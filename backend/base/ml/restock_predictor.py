# backend/base/ml/restock_predictor.py
import numpy as np
import pickle
import os
from datetime import datetime
from django.conf import settings

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class RestockPredictor:
    """
    AI-powered restock prediction using Random Forest.
    Predicts restock probability based on purchase history features.
    """
    
    def __init__(self):
        self.model = None
        self.scaler = None
        self.model_path = os.path.join(settings.BASE_DIR, 'ml_models', 'restock_model.pkl')
        self.scaler_path = os.path.join(settings.BASE_DIR, 'ml_models', 'restock_scaler.pkl')
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        
        # Try to load existing model
        self.load_model()
    
    def extract_features(self, purchase_timestamps):
        """
        Extract features from purchase history for ML prediction.
        
        Features:
        1. Number of purchases
        2. Mean gap between purchases (days)
        3. Std gap between purchases
        4. Min gap
        5. Max gap
        6. Days since last purchase
        7. Trend (increasing/decreasing gaps)
        8. Coefficient of variation
        """
        if len(purchase_timestamps) < 2:
            return None
        
        dts_sorted = sorted(purchase_timestamps)
        gaps = [(dts_sorted[i] - dts_sorted[i-1]).total_seconds() / 86400.0 
                for i in range(1, len(dts_sorted))]
        
        if not gaps:
            return None
        
        now = datetime.now()
        if dts_sorted[-1].tzinfo:
            from django.utils import timezone
            now = timezone.now()
        
        days_since_last = (now - dts_sorted[-1]).total_seconds() / 86400.0
        
        features = [
            len(purchase_timestamps),           # num_purchases
            np.mean(gaps),                      # mean_gap
            np.std(gaps) if len(gaps) > 1 else 0,  # std_gap
            np.min(gaps),                       # min_gap
            np.max(gaps),                       # max_gap
            days_since_last,                    # days_since_last
            gaps[-1] - gaps[0] if len(gaps) > 1 else 0,  # trend
            np.std(gaps) / np.mean(gaps) if np.mean(gaps) > 0 else 0  # coef_variation
        ]
        
        return np.array(features).reshape(1, -1)
    
    def train(self, training_data):
        """
        Train the model on historical purchase data.
        
        training_data: list of tuples (purchase_timestamps, target_probability)
        """
        if not SKLEARN_AVAILABLE:
            print("sklearn not available, skipping ML training")
            return False
        
        X = []
        y = []
        
        for timestamps, target in training_data:
            features = self.extract_features(timestamps)
            if features is not None:
                X.append(features[0])
                y.append(target)
        
        if len(X) < 10:  # Need minimum training data
            print(f"Not enough training data: {len(X)} samples")
            return False
        
        X = np.array(X)
        y = np.array(y)
        
        # Scale features
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        
        # Train Random Forest
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        )
        self.model.fit(X_scaled, y)
        
        # Save model
        self.save_model()
        
        return True
    
    def predict(self, purchase_timestamps):
        """
        Predict restock probability for a product based on purchase history.
        Returns probability between 0 and 1.
        """
        if self.model is None or not SKLEARN_AVAILABLE:
            # Fallback to statistical method
            return self._statistical_fallback(purchase_timestamps)
        
        features = self.extract_features(purchase_timestamps)
        if features is None:
            return 0.0
        
        try:
            features_scaled = self.scaler.transform(features)
            prob = self.model.predict(features_scaled)[0]
            return float(np.clip(prob, 0.0, 1.0))
        except Exception as e:
            print(f"Prediction error: {e}")
            return self._statistical_fallback(purchase_timestamps)
    
    def _statistical_fallback(self, purchase_timestamps):
        """
        Fallback to original statistical method if ML fails.
        """
        if len(purchase_timestamps) < 2:
            return 0.0
        
        dts_sorted = sorted(purchase_timestamps)
        gaps = [(dts_sorted[i] - dts_sorted[i-1]).days 
                for i in range(1, len(dts_sorted))]
        
        if not gaps:
            return 0.0
        
        now = datetime.now()
        if dts_sorted[-1].tzinfo:
            from django.utils import timezone
            now = timezone.now()
        
        days_since = (now - dts_sorted[-1]).days
        mean_gap = float(np.mean(gaps))
        
        prob = 1.0 - np.exp(-days_since / (mean_gap + 1e-9))
        return float(np.clip(prob, 0.0, 1.0))
    
    def save_model(self):
        """Save trained model and scaler to disk."""
        if self.model and self.scaler:
            try:
                with open(self.model_path, 'wb') as f:
                    pickle.dump(self.model, f)
                with open(self.scaler_path, 'wb') as f:
                    pickle.dump(self.scaler, f)
                print(f"Model saved to {self.model_path}")
            except Exception as e:
                print(f"Error saving model: {e}")
    
    def load_model(self):
        """Load trained model and scaler from disk."""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                print(f"Model loaded from {self.model_path}")
                return True
        except Exception as e:
            print(f"Error loading model: {e}")
        return False

# Global instance
_predictor = None

def get_restock_predictor():
    """Get or create global restock predictor instance."""
    global _predictor
    if _predictor is None:
        _predictor = RestockPredictor()
    return _predictor

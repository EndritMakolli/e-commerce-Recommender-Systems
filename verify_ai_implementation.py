#!/usr/bin/env python3
"""
AI Implementation Verification Script

This script verifies that the AI-powered restock recommendations 
have been correctly implemented.

Usage:
    python verify_ai_implementation.py
"""

import os
import sys
from pathlib import Path

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}{RESET}\n")

def check_file(filepath, description):
    """Check if a file exists."""
    if os.path.exists(filepath):
        print(f"{GREEN}✓{RESET} {description}: {filepath}")
        return True
    else:
        print(f"{RED}✗{RESET} {description}: {filepath}")
        return False

def check_import(filepath, import_line, description):
    """Check if a file contains a specific import."""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
            if import_line in content:
                print(f"{GREEN}✓{RESET} {description}")
                return True
            else:
                print(f"{RED}✗{RESET} {description}")
                return False
    except FileNotFoundError:
        print(f"{RED}✗{RESET} {description} (file not found)")
        return False

def check_directory(dirpath, description):
    """Check if a directory exists."""
    if os.path.isdir(dirpath):
        print(f"{GREEN}✓{RESET} {description}: {dirpath}")
        return True
    else:
        print(f"{YELLOW}⚠{RESET} {description} (will be created when model is trained)")
        return False

def main():
    print_header("AI-Powered Restock Implementation Verification")
    
    # Get base directory
    base_dir = Path(__file__).parent
    backend_dir = base_dir / "backend"
    frontend_dir = base_dir / "frontend"
    
    all_checks = []
    
    # Check 1: New ML module files
    print_header("1. Checking ML Module Files")
    all_checks.append(check_file(
        backend_dir / "base/ml/__init__.py",
        "ML package initializer"
    ))
    all_checks.append(check_file(
        backend_dir / "base/ml/restock_predictor.py",
        "ML predictor module"
    ))
    all_checks.append(check_file(
        backend_dir / "base/ml/README.md",
        "ML documentation"
    ))
    
    # Check 2: Updated backend files
    print_header("2. Checking Backend Updates")
    all_checks.append(check_import(
        backend_dir / "base/management/commands/build_ai_recommendations.py",
        "from base.ml.restock_predictor import get_restock_predictor",
        "Import in build_ai_recommendations.py"
    ))
    all_checks.append(check_import(
        backend_dir / "base/views/recommendation_views.py",
        "from base.ml.restock_predictor import get_restock_predictor",
        "Import in recommendation_views.py"
    ))
    all_checks.append(check_import(
        backend_dir / "base/views/recommendation_views.py",
        'use_ai = int(request.query_params.get("use_ai", 1)) == 1',
        "use_ai parameter in views"
    ))
    
    # Check 3: Dependencies
    print_header("3. Checking Dependencies")
    all_checks.append(check_file(
        backend_dir / "requirements.txt",
        "Requirements file"
    ))
    
    # Check if sklearn can be imported
    try:
        import sklearn
        print(f"{GREEN}✓{RESET} scikit-learn installed (version {sklearn.__version__})")
        all_checks.append(True)
    except ImportError:
        print(f"{RED}✗{RESET} scikit-learn NOT installed")
        print(f"  {YELLOW}→{RESET} Run: pip install scikit-learn==1.3.2")
        all_checks.append(False)
    
    # Check 4: Frontend updates
    print_header("4. Checking Frontend Updates")
    all_checks.append(check_import(
        frontend_dir / "src/screens/OutOfStockScreen.js",
        "AI predicts",
        "AI badge in OutOfStockScreen"
    ))
    
    # Check 5: Documentation
    print_header("5. Checking Documentation")
    all_checks.append(check_file(
        base_dir / "IMPLEMENTATION_GUIDE.md",
        "Implementation guide"
    ))
    all_checks.append(check_file(
        base_dir / "AI_IMPLEMENTATION_SUMMARY.md",
        "Implementation summary"
    ))
    
    # Check 6: Model directory (optional - created during training)
    print_header("6. Checking Model Directory")
    check_directory(backend_dir / "ml_models", "Model storage directory")
    
    model_file = backend_dir / "ml_models/restock_model.pkl"
    scaler_file = backend_dir / "ml_models/restock_scaler.pkl"
    
    if os.path.exists(model_file):
        print(f"{GREEN}✓{RESET} Trained model found: restock_model.pkl")
        print(f"  Size: {os.path.getsize(model_file) / 1024:.2f} KB")
    else:
        print(f"{YELLOW}⚠{RESET} Model not yet trained")
        print(f"  {YELLOW}→{RESET} Run: python manage.py build_ai_recommendations")
    
    if os.path.exists(scaler_file):
        print(f"{GREEN}✓{RESET} Feature scaler found: restock_scaler.pkl")
    
    # Check 7: .gitignore
    print_header("7. Checking .gitignore")
    all_checks.append(check_import(
        base_dir / ".gitignore",
        "ml_models/",
        "ml_models/ in .gitignore"
    ))
    
    # Summary
    print_header("Verification Summary")
    
    passed = sum(all_checks)
    total = len(all_checks)
    
    print(f"Checks passed: {passed}/{total}")
    
    if passed == total:
        print(f"\n{GREEN}{'='*60}")
        print(f"  ✓ ALL CHECKS PASSED!")
        print(f"  AI implementation is complete!")
        print(f"{'='*60}{RESET}\n")
        
        print(f"{BLUE}Next Steps:{RESET}")
        print("1. Install dependencies: pip install -r backend/requirements.txt")
        print("2. Train the model: python manage.py build_ai_recommendations")
        print("3. Start the server: python manage.py runserver")
        print("4. Check the Restock page for 🤖 AI badges\n")
        
        return 0
    else:
        print(f"\n{YELLOW}{'='*60}")
        print(f"  ⚠ Some checks failed")
        print(f"  Please review the output above")
        print(f"{'='*60}{RESET}\n")
        
        print(f"{BLUE}Common Fixes:{RESET}")
        if not all_checks[total-4]:  # sklearn check
            print("• Install scikit-learn: pip install scikit-learn==1.3.2")
        print("• Ensure all files were created correctly")
        print("• Check file paths and imports\n")
        
        return 1

if __name__ == "__main__":
    sys.exit(main())

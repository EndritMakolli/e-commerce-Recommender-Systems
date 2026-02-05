# Chatbot Use Cases & Examples

## 🎯 Real-World Scenarios

### Scenario 1: Product Discovery
```
Customer: "I need a gaming laptop under $1500"
Bot: "Great! I found these options:
     1. Dell Alienware - $1299 (RTX 4060)
     2. ASUS ROG - $1399 (RTX 4070)
     3. Lenovo Legion - $1299 (RTX 4050)
     
     Would you like more details?"
```
**What's happening:**
- AI analyzes the query
- Searches products in database
- Personalizes based on user history
- Displays related products

---

### Scenario 2: Customer Support
```
Customer: "Can I return a product?"
Bot: "Of course! Here's our return policy:
     - 30-day returns for unopened items
     - Full refund or exchange available
     - Free return shipping included
     
     When did you purchase your item?"
```
**What's happening:**
- Bot retrieves company policies
- Provides helpful information
- Maintains context
- Prepares for follow-up

---

### Scenario 3: Product Comparison
```
Customer: "What's the difference between 2TB and 4TB SSD?"
Bot: "Great question! Here's the comparison:
     
     2TB SSD:
     - Price: $129
     - Speed: Up to 3500MB/s
     - Best for: General use
     
     4TB SSD:
     - Price: $249
     - Speed: Up to 7000MB/s  
     - Best for: Video editing, gaming"
```

---

### Scenario 4: Order Status
```
Customer: "Where is my order?"
Bot: "Let me find that for you...
     Order #12345:
     Status: In Transit
     Expected: Feb 10, 2026
     Tracking: [link]"
```

---

### Scenario 5: Personalized Recommendations
```
Customer: "What do you recommend?"
Bot: "Based on your browsing history, 
     you seemed interested in gaming gear.
     
     Recommended for you:
     - MSI Monitor 144Hz - $299
     - Corsair Mechanical Keyboard - $149
     - Logitech Pro Mouse - $99"
```

---

## 💬 Conversation Flow Examples

### Example 1: Technical Inquiry
```
User: "Does the RTX 4080 work with AMD processors?"
Bot: "Yes! The RTX 4080 is compatible with both Intel and AMD:
      - Compatible with AMD Ryzen 7000 series
      - Compatible with Intel 12th+ Gen
      - Requires PCIe 4.0 slot
      
      Are you building a new PC?"

User: "Yes, I have a Ryzen 9 7900X"
Bot: "Perfect choice! The RTX 4080 pairs excellently with that CPU.
     I found 3 complete system builds you might like:
     [Product recommendations]"
```

### Example 2: Price Inquiry
```
User: "What's the cheapest gaming monitor you have?"
Bot: "Our most affordable gaming monitor is:
     ASUS VP28UQG - $199
     - 28" 4K display
     - 1ms response time
     - 60Hz refresh rate
     
     If you want 144Hz, try:
     Dell S2721DGF - $349"

User: "Do you have anything between $250-300?"
Bot: "Yes! Check these out:
     [Products in price range]"
```

### Example 3: Troubleshooting
```
User: "My new keyboard won't connect"
Bot: "Let me help! What type of keyboard?
     - Wireless (needs USB receiver)
     - Bluetooth (needs pairing)
     - Wired (plug and play)"

User: "It's Bluetooth"
Bot: "Try these steps:
     1. Check if it's powered on
     2. Hold pairing button for 3 seconds
     3. Select device in your Bluetooth settings
     4. Type to test
     
     Still not working? I can help with returns."
```

---

## 📊 Conversation Statistics

### Typical Conversation Metrics

| Metric | Value |
|--------|-------|
| Avg messages per session | 4-6 |
| Avg response time | <1 second |
| User satisfaction | 85-90% |
| Conversation completion | 70-75% |
| Fallback to human support | 15-20% |

---

## 🎓 Training Examples for System Prompt

### E-Commerce Knowledge Base

**Products Available:**
- Gaming Laptops: Dell, ASUS, Lenovo, MSI
- Gaming Monitors: ASUS, Dell, LG, BenQ
- Keyboards: Corsair, SteelSeries, Razer, Logitech
- Mice: Logitech, SteelSeries, Razer
- Headsets: HyperX, SteelSeries, Corsair
- SSDs: Samsung, Crucial, WD, SK Hynix

**Policies:**
- Free shipping over $50
- 30-day returns
- 1-year warranty
- Price match guarantee
- 24/7 customer support

**Common Questions:**
- Q: "How long does shipping take?"
  A: "2-3 business days within the US"
- Q: "What's your warranty?"
  A: "1-year manufacturer warranty on all items"
- Q: "Can I upgrade later?"
  A: "Yes, we offer trade-in credits"

---

## 🚀 Advanced Features to Build

### 1. **Smart Context Awareness**
```python
# In utils.py, enhance context gathering:
def build_rich_context(user):
    return {
        'browsing_history': get_last_10_viewed_products(user),
        'cart_contents': get_user_cart(user),
        'purchase_history': get_past_orders(user),
        'preferences': extract_preferences(user),
        'device_type': detect_device(user),
        'price_sensitivity': calculate_from_history(user),
    }
```

### 2. **Sentiment Analysis**
```python
# Detect customer mood and adjust responses
from transformers import pipeline
sentiment = pipeline("sentiment-analysis")
emotion = sentiment(user_message)

if emotion['score'] > 0.9:  # Very positive
    # Suggest premium products
elif emotion['score'] < 0.2:  # Negative/frustrated
    # Offer extra support, discounts
```

### 3. **FAQ Optimization**
```python
# Store frequently asked questions
# Auto-respond with perfect answer
faq = {
    'shipping': '2-3 business days...',
    'returns': '30-day return policy...',
    'warranty': '1-year warranty...',
}
```

### 4. **Order Integration**
```python
# Give real order info
from base.models import Order
def get_order_status(order_id):
    order = Order.objects.get(id=order_id)
    return {
        'status': order.is_delivered,
        'shipping_address': order.shippingAddress,
        'items': order.orderitems.all(),
    }
```

### 5. **Product Recommendations Engine**
```python
# AI-powered recommendations
from base.models import Recommendation
def get_smart_recommendations(user, context):
    # Use existing recommendation system
    recs = Recommendation.objects.filter(user=user)
    # Integrate with conversation
    return recs[:5]
```

---

## 📱 Mobile Chat Widget Example

For future mobile app integration:

```javascript
// Example React Native component
import { useState } from 'react';
import { View, TextInput, ScrollView } from 'react-native';

export default function MobileChatBot() {
  const [messages, setMessages] = useState([]);
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.messagesContainer}>
        {messages.map(msg => (
          <Message key={msg.id} message={msg} />
        ))}
      </ScrollView>
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        onSubmitEditing={handleSendMessage}
      />
    </View>
  );
}
```

---

## 🎯 Performance Optimization Tips

### 1. **Cache Common Responses**
```python
from django.views.decorators.cache import cache_page

@cache_page(60 * 5)  # Cache for 5 minutes
def get_frequently_asked_questions(request):
    # Return cached FAQs
    pass
```

### 2. **Batch Process Messages**
```python
# Group similar requests together
messages_batch = Message.objects.filter(
    created_at__gte=timezone.now() - timedelta(hours=1)
)
# Process in bulk
```

### 3. **Implement Message Queue**
```python
# Use Celery for async responses
from celery import shared_task

@shared_task
def generate_ai_response(message_id):
    # Process heavy AI work async
    pass
```

---

## 🔄 Conversation Handoff Flow

```
Customer Interaction
    ↓
Bot Attempts to Help
    ↓
Can Bot Answer? ──No──→ Escalate to Human
    ↓ Yes
Bot Responds
    ↓
Customer Satisfied? ──No──→ Offer Human Support
    ↓ Yes
End Conversation
    ↓
Collect Feedback (👍👎)
    ↓
Log & Analyze
```

---

## 📈 Analytics Dashboard Ideas

What to track:
1. **Conversation Topics** - Most asked questions
2. **Sentiment** - Are customers happy?
3. **Resolution Rate** - % resolved by bot
4. **Response Quality** - User ratings
5. **Popular Products** - Most recommended
6. **Trends** - What's trending now

---

## 🎨 UI Customization Examples

### Dark Mode
```css
@media (prefers-color-scheme: dark) {
  .chatbot-container {
    background: #1a1a1a;
  }
  .message-content {
    background: #2a2a2a;
    color: #fff;
  }
}
```

### Mobile Optimized
```css
@media (max-width: 600px) {
  .chatbot-sidebar {
    display: none;  /* Hide sidebar on mobile */
  }
  .message-content {
    max-width: 95%;  /* More space for messages */
  }
}
```

### Custom Branding
```css
.chat-header {
  background: linear-gradient(135deg, #your-brand-color-1 0%, #your-brand-color-2 100%);
  font-family: 'Your Brand Font';
}
```

---

## 🧪 Testing Examples

### Test Conversation Flow
```python
def test_chat_session_creation():
    user = User.objects.create(username='testuser')
    session = ChatSession.objects.create(
        user=user,
        title='Test Chat'
    )
    assert session.user == user
    assert session.title == 'Test Chat'

def test_message_creation():
    session = ChatSession.objects.first()
    message = Message.objects.create(
        session=session,
        sender='user',
        content='Test message'
    )
    assert message.sender == 'user'
    assert message.content == 'Test message'
```

### Test API Endpoint
```python
def test_send_message_api():
    client = APIClient()
    user = User.objects.create_user(
        username='testuser',
        password='pass123'
    )
    client.force_authenticate(user=user)
    
    session = ChatSession.objects.create(user=user)
    response = client.post(
        f'/api/chatbot/sessions/{session.id}/send_message/',
        {'content': 'Hello!'},
        format='json'
    )
    assert response.status_code == 201
```

---

**This comprehensive guide covers real-world scenarios and advanced implementations. Start with the basics and progressively add these features!** 🚀

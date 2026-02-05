# AI Chatbot Integration Guide for E-Commerce Platform

## Overview
This guide explains how to build and integrate an AI-powered chatbot into your Django REST Framework + React e-commerce application. The chatbot can help customers with product inquiries, recommendations, and general support.

## Architecture

### Backend (Django)
- **Models**: ChatSession, Message, ChatContext
- **Views**: RESTful API endpoints for chat management
- **Utils**: AI integration layer supporting multiple providers
- **Database**: SQLite (can be upgraded to PostgreSQL)

### Frontend (React)
- **Component**: ChatBot.js with conversation UI
- **Features**: Real-time messaging, session management, product recommendations

### AI Integration Options
1. **OpenAI GPT** (Recommended for production)
2. **Hugging Face Models** (Free, local or API)
3. **Local LLM** (Ollama, Llama, etc.)

---

## Step 1: Backend Setup

### 1.1 Install Required Packages

```bash
# Navigate to backend directory
cd backend

# Install OpenAI (choose one based on your AI choice)
pip install openai

# OR for Hugging Face
pip install transformers torch

# OR for local LLM support
pip install requests

# Additional helpful packages
pip install python-dotenv  # For environment variables
```

### 1.2 Update Django Settings

Already done! Check that these are in your `backend/backend/settings.py`:

```python
INSTALLED_APPS = [
    ...
    'api.chatbot.apps.ChatbotConfig',
]
```

### 1.3 Create and Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 1.4 Configure Environment Variables

Create a `.env` file in your backend directory:

```env
# AI Model Configuration
AI_MODEL_TYPE=openai  # Options: openai, huggingface, local

# For OpenAI
AI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4

# For Hugging Face
# AI_API_KEY=your_huggingface_api_key_here
# HUGGINGFACE_MODEL=gpt2

# For Local LLM (Ollama)
# LOCAL_LLM_URL=http://localhost:11434
# LOCAL_LLM_MODEL=llama2
```

### 1.5 Update Backend Settings to Use .env

In `backend/backend/settings.py`, add at the top:

```python
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

# ... rest of settings
```

### 1.6 Update CORS Settings

Ensure CORS is configured to allow requests from your React frontend:

```python
# In backend/backend/settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
]
```

---

## Step 2: Frontend Setup

### 2.1 Install Axios (if not already installed)

```bash
cd frontend
npm install axios
```

### 2.2 Add ChatBot Component to Your App

Update your `frontend/src/App.js`:

```javascript
import React from 'react';
import ChatBot from './components/ChatBot';
import './App.css';

function App() {
  return (
    <div className="App">
      {/* Your existing components */}
      
      {/* Add ChatBot Component */}
      <ChatBot userInfo={/* your user info */} />
    </div>
  );
}

export default App;
```

### 2.3 Or Add as a Modal/Widget

```javascript
import React, { useState } from 'react';
import ChatBot from './components/ChatBot';

function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="App">
      {/* Your existing components */}
      
      {/* Chat Toggle Button */}
      <button 
        className="chat-toggle-btn"
        onClick={() => setShowChat(!showChat)}
      >
        💬
      </button>

      {/* ChatBot Modal */}
      {showChat && (
        <div className="chat-modal">
          <ChatBot userInfo={/* your user info */} />
        </div>
      )}
    </div>
  );
}

export default App;
```

---

## Step 3: AI Provider Configuration

### Option A: OpenAI (Recommended)

1. **Sign up** at https://platform.openai.com
2. **Get API Key** from Settings → API Keys
3. **Add to .env**:
   ```env
   AI_MODEL_TYPE=openai
   AI_API_KEY=sk-...
   OPENAI_MODEL=gpt-3.5-turbo
   ```

**Pricing**: ~$0.0005 per 1K tokens (very affordable for chatbots)

### Option B: Hugging Face

1. **Sign up** at https://huggingface.co
2. **Get API Key** from Settings → Access Tokens
3. **Add to .env**:
   ```env
   AI_MODEL_TYPE=huggingface
   AI_API_KEY=hf_...
   HUGGINGFACE_MODEL=gpt2
   ```

**Models to try**: 
- `gpt2` (lightweight)
- `EleutherAI/gpt-j-6B` (better quality)
- `meta-llama/Llama-2-7b-chat-hf` (high quality)

### Option C: Local LLM (Ollama)

1. **Install Ollama** from https://ollama.ai
2. **Pull a model**: `ollama pull llama2`
3. **Start Ollama**: `ollama serve`
4. **Add to .env**:
   ```env
   AI_MODEL_TYPE=local
   LOCAL_LLM_URL=http://localhost:11434
   LOCAL_LLM_MODEL=llama2
   ```

---

## Step 4: Running the Application

### Terminal 1: Django Backend
```bash
cd backend
python manage.py runserver
```

The API will be available at `http://localhost:8000`

### Terminal 2: React Frontend
```bash
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000`

---

## Step 5: Testing the Chatbot

1. **Create a user** account if you haven't already
2. **Navigate to the chatbot** component
3. **Start a conversation** - Try:
   - "What products do you recommend?"
   - "Show me gaming monitors"
   - "What's your return policy?"

---

## API Endpoints

### Chat Sessions
- `GET /api/chatbot/sessions/` - List all chat sessions
- `POST /api/chatbot/sessions/` - Create new session
- `GET /api/chatbot/sessions/{id}/` - Get specific session
- `POST /api/chatbot/sessions/{id}/send_message/` - Send message & get response
- `GET /api/chatbot/sessions/{id}/messages/` - Get session messages
- `DELETE /api/chatbot/sessions/{id}/clear_session/` - Clear messages
- `POST /api/chatbot/sessions/{id}/mark_helpful/` - Mark message as helpful

### Messages
- `GET /api/chatbot/messages/` - List all messages
- `GET /api/chatbot/messages/recent_messages/` - Get recent messages

---

## Customization Guide

### 1. Enhance the System Prompt

Edit `backend/api/chatbot/utils.py` in the `_build_system_prompt()` method:

```python
def _build_system_prompt(self, context: Dict = None) -> str:
    base_prompt = """You are a helpful e-commerce customer service assistant for TechStore.
    
    Your responsibilities:
    - Help customers find products
    - Answer product questions
    - Provide personalized recommendations
    - Handle order inquiries
    
    COMPANY POLICIES:
    - Free shipping on orders over $50
    - 30-day return policy
    - 1-year warranty on electronics
    
    AVAILABLE PRODUCTS:
    - Laptops: Dell, HP, Lenovo, MacBook
    - Monitors: LG, Dell, ASUS
    - Accessories: Keyboards, Mice, USB hubs
    """
    return base_prompt
```

### 2. Add Product Knowledge Base

Update `_link_related_products()` method:

```python
def _link_related_products(self, message, user_input):
    # Use better NLP for product matching
    from sklearn.feature_extraction.text import TfidfVectorizer
    
    # Your implementation
    pass
```

### 3. Store Conversation History for Analytics

Create a management command to analyze conversations:

```python
# backend/api/chatbot/management/commands/analyze_chats.py
from django.core.management.base import BaseCommand
from api.chatbot.models import Message

class Command(BaseCommand):
    def handle(self, *args, **options):
        messages = Message.objects.filter(sender='user')
        # Analyze common topics, sentiments, etc.
        self.stdout.write('Analysis complete')
```

### 4. Add Authentication Check

The chatbot already requires authentication. For public chatbot, modify `views.py`:

```python
from rest_framework.permissions import AllowAny

class ChatSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]  # Or create custom permission
```

### 5. Customize UI Colors & Styling

Edit `frontend/src/components/ChatBot.css`:

```css
.chat-header {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

.user-message .message-content {
  background: #your-color;
}
```

---

## Advanced Features

### 1. Conversation Analytics Dashboard

Track:
- Total conversations
- Average response time
- Most common questions
- User satisfaction (feedback stars)

### 2. Multilingual Support

```python
# In utils.py
def generate_response(self, messages, context, language='en'):
    # Add language parameter to system prompt
```

### 3. Streaming Responses

For long responses, implement streaming:

```python
# In views.py
from django.http import StreamingHttpResponse

@action(detail=True, methods=['post'])
def send_message_stream(self, request, pk=None):
    # Implement streaming response
    pass
```

### 4. Integration with Vector Database

For product recommendations using embeddings:

```bash
pip install pinecone langchain
```

---

## Troubleshooting

### Issue: "No module named 'openai'"
```bash
pip install openai
```

### Issue: CORS errors
Update `CORS_ALLOWED_ORIGINS` in settings.py

### Issue: API key not working
- Verify API key is correct
- Check `.env` file is in the right location
- Use `from dotenv import load_dotenv` and `load_dotenv()`

### Issue: ChatBot component not showing
- Ensure token is in localStorage
- Check browser console for errors
- Verify API endpoints are correct

---

## Performance Optimization

1. **Cache responses**: Use Redis for common questions
2. **Batch processing**: Group similar requests
3. **Async tasks**: Use Celery for heavy NLP tasks
4. **Database indexing**: Add indexes to frequently queried fields

---

## Security Considerations

1. **Rate limiting**: Prevent spam
```python
from rest_framework.throttling import UserRateThrottle

class ChatRateThrottle(UserRateThrottle):
    scope = 'chat'
    rate = '100/hour'
```

2. **Input validation**: Already implemented in serializers
3. **Token security**: Use JWT properly
4. **Sensitive data**: Don't log user conversations without consent

---

## Next Steps

1. ✅ Set up backend models & API
2. ✅ Create React component
3. Choose AI provider (OpenAI recommended)
4. Deploy to production (Heroku, AWS, DigitalOcean)
5. Monitor & improve with analytics
6. Collect user feedback for model fine-tuning

---

## Support & Resources

- **Django REST**: https://www.django-rest-framework.org/
- **OpenAI Docs**: https://platform.openai.com/docs/
- **Hugging Face**: https://huggingface.co/
- **Ollama**: https://ollama.ai/
- **React Docs**: https://react.dev/

---

## License
This implementation is part of your e-commerce platform. Follow your project's license terms.

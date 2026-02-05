# AI Chatbot Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd backend
pip install openai python-dotenv
```

### 2. Configure AI Provider
```bash
# Copy the template
cp .env.example .env

# Edit .env and add your OpenAI API key
# AI_API_KEY=sk-...
```

### 3. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Run Backend
```bash
python manage.py runserver
# Server runs on http://localhost:8000
```

### 5. Run Frontend
```bash
cd frontend
npm start
# Frontend runs on http://localhost:3000
```

### 6. Test the Chatbot
- Open http://localhost:3000
- Create an account or login
- Start chatting!

---

## 📁 File Structure

```
backend/
├── api/
│   └── chatbot/
│       ├── models.py          # ChatSession, Message, ChatContext models
│       ├── views.py           # API endpoints
│       ├── serializers.py      # DRF serializers
│       ├── utils.py           # AI integration (OpenAI, HF, Local)
│       ├── urls.py            # URL routing
│       ├── admin.py           # Django admin configuration
│       └── migrations/         # Database migrations
├── .env.example               # Environment variables template
├── .env                       # Your config (copy from .env.example)
└── requirements_chatbot.txt   # Python dependencies

frontend/
└── src/
    └── components/
        ├── ChatBot.js         # Main React component
        └── ChatBot.css        # Styling
```

---

## 🔑 Environment Variables

```env
# Required
AI_MODEL_TYPE=openai
AI_API_KEY=sk-...your-key-here...

# Optional
OPENAI_MODEL=gpt-3.5-turbo
```

---

## 📚 API Endpoints

**Base URL**: `http://localhost:8000/api/chatbot`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sessions/` | List all chat sessions |
| POST | `/sessions/` | Create new session |
| POST | `/sessions/{id}/send_message/` | Send message & get AI response |
| GET | `/sessions/{id}/messages/` | Get all messages in session |
| DELETE | `/sessions/{id}/clear_session/` | Clear session |
| POST | `/sessions/{id}/mark_helpful/` | Rate message |

---

## 💡 Example API Usage

### Create a Session
```bash
curl -X POST http://localhost:8000/api/chatbot/sessions/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Product Help"}'
```

### Send a Message
```bash
curl -X POST http://localhost:8000/api/chatbot/sessions/{session_id}/send_message/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What laptops do you have?"}'
```

---

## 🤖 AI Providers Comparison

| Provider | Setup | Cost | Quality | Local |
|----------|-------|------|---------|-------|
| **OpenAI** | 5 min | $0.0005/1K tokens | Excellent | ❌ |
| **Hugging Face** | 10 min | Free/Paid API | Good | ✅ |
| **Ollama** | 15 min | Free | Very Good | ✅ |

### Recommended for Production
👉 **OpenAI GPT-3.5-turbo** - Best quality, affordable, reliable

### Recommended for Development
👉 **Ollama** - Run locally, no API keys needed

---

## 🛠️ Customization Examples

### Change AI Model
Edit `backend/api/chatbot/utils.py`:
```python
# Change the system prompt
def _build_system_prompt(self, context):
    return """Custom instructions for your chatbot..."""
```

### Customize UI Colors
Edit `frontend/src/components/ChatBot.css`:
```css
.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Add Product Recommendations
The chatbot automatically links relevant products based on conversation topics.

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: openai` | `pip install openai` |
| CORS error | Update `CORS_ALLOWED_ORIGINS` in settings.py |
| API key not recognized | Verify `.env` file exists and has correct key |
| No chat sessions showing | Ensure you're logged in |
| Bot not responding | Check API key and model type in `.env` |

---

## 📊 Database Models

### ChatSession
- User's conversation session
- Can have multiple messages
- Tracks creation and update times

### Message
- Individual chat message
- Linked to ChatSession
- Can be from user or bot
- Tracks helpfulness feedback
- Links related products

### ChatContext
- User preferences and history
- Browsing history
- Product interests
- Used for personalization

---

## 🔐 Security Notes

✅ Authentication required (JWT token)
✅ Input validation on all messages
✅ CORS protection configured
✅ API key never exposed to frontend
✅ Database isolation per user

---

## 📈 Next Steps

1. **Customize System Prompt** - Make it match your brand voice
2. **Add Analytics** - Track conversation topics and user satisfaction
3. **Improve NLP** - Add better product matching logic
4. **Deploy** - Move to production server (Heroku, AWS, etc.)
5. **Monitor** - Log conversations and improve AI model

---

## 📞 Need Help?

- Check Django logs: `python manage.py runserver` output
- Check browser console: Press F12 in browser
- Review API documentation: `http://localhost:8000/api/docs`
- Check OpenAI status: https://status.openai.com/

---

## 🎉 You're all set!

Start building amazing customer experiences with AI! 🚀

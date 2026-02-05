# Chatbot Troubleshooting & Deployment Guide

## 🐛 Troubleshooting

### Installation Issues

#### Problem: `pip install openai` fails
```bash
# Solution 1: Upgrade pip
python -m pip install --upgrade pip

# Solution 2: Use specific version
pip install openai==0.27.0

# Solution 3: Check Python version (need 3.8+)
python --version
```

#### Problem: `ModuleNotFoundError: No module named 'rest_framework'`
```bash
# Install all Django dependencies
pip install django djangorestframework django-cors-headers
```

#### Problem: `dotenv not found`
```bash
pip install python-dotenv
```

---

### Configuration Issues

#### Problem: OpenAI API key not recognized
```bash
# Check 1: Verify .env file exists in backend directory
ls -la backend/.env

# Check 2: Verify API key format
# Should start with 'sk-' and be 48+ characters

# Check 3: Check for typos
grep AI_API_KEY backend/.env

# Check 4: Verify settings.py loads .env
# In backend/settings.py, ensure:
from dotenv import load_dotenv
load_dotenv()
```

#### Problem: CORS error when sending messages
```python
# In backend/backend/settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8000',
    # Add your production domain here
]

# Also check your frontend API endpoint
const API_BASE = 'http://localhost:8000/api/chatbot';  // Make sure this is correct
```

#### Problem: Authentication token not working
```javascript
// In ChatBot.js, verify token retrieval
const token = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo')).token
  : null;

console.log('Token:', token);  // Debug in browser console

// Ensure you're passing it in headers
headers: {
  'Authorization': `Bearer ${token}`,
}
```

---

### Database Issues

#### Problem: Migration fails
```bash
# Solution 1: Check migration status
python manage.py showmigrations

# Solution 2: Reset migrations (CAREFUL - deletes data)
python manage.py migrate chatbot zero
python manage.py migrate

# Solution 3: Check for syntax errors
python manage.py makemigrations --dry-run

# Solution 4: Check database file permissions
chmod 666 backend/db.sqlite3
```

#### Problem: No tables in database
```bash
# Run migrations again
python manage.py makemigrations
python manage.py migrate

# Verify tables were created
python manage.py dbshell
# Then in SQL: .tables
```

---

### API Issues

#### Problem: API returns 404
```bash
# Check 1: Verify URL routing
# In backend/backend/urls.py, ensure:
path('api/chatbot/', include('api.chatbot.urls')),

# Check 2: Test endpoint
curl http://localhost:8000/api/chatbot/sessions/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check 3: Check if chatbot app is in INSTALLED_APPS
# In backend/settings.py: 'api.chatbot.apps.ChatbotConfig',
```

#### Problem: Unauthorized (401) errors
```bash
# Check 1: Verify you're logged in
# Get token from login endpoint first

# Check 2: Check token format
# Should be: Authorization: Bearer <token>
# Not: Bearer:<token> or <token>

# Check 3: Check if token is expired
# Check your JWT settings in settings.py
```

#### Problem: Slow API responses
```python
# In backend/api/chatbot/views.py, add caching
from django.views.decorators.cache import cache_page

@cache_page(60)  # Cache for 60 seconds
def some_view(request):
    pass

# Also optimize database queries
from django.db.models import prefetch_related_objects
messages = Message.objects.select_related('session').prefetch_related('related_products')
```

---

### Frontend Issues

#### Problem: React app won't start
```bash
# Solution 1: Install dependencies
cd frontend
npm install

# Solution 2: Clear cache
rm -rf node_modules package-lock.json
npm install

# Solution 3: Check Node version (need 14+)
node --version

# Solution 4: Check for syntax errors
npm run build  # Will show any build errors
```

#### Problem: ChatBot component not showing
```javascript
// Check 1: Component imported correctly
import ChatBot from './components/ChatBot';

// Check 2: Component rendered in App.js
<ChatBot userInfo={userInfo} />

// Check 3: Check browser console for errors
// Press F12 to open developer tools

// Check 4: Verify Auth token exists
console.log(localStorage.getItem('userInfo'));
```

#### Problem: Messages not appearing
```javascript
// Check 1: API response in network tab
// Open DevTools → Network → check API calls

// Check 2: Check browser console for errors
console.error logs will show API issues

// Check 3: Verify backend is running
curl http://localhost:8000/api/chatbot/sessions/
```

#### Problem: Styling looks wrong
```css
/* Check 1: CSS file imported */
import './ChatBot.css';

/* Check 2: Clear browser cache */
/* Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac) */

/* Check 3: Check for CSS conflicts */
/* Search global styles for .chatbot-* rules */
```

---

### AI Response Issues

#### Problem: Bot not responding or very slow
```python
# Check 1: Verify API key works
import openai
openai.api_key = "your_key"
response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "test"}]
)

# Check 2: Check OpenAI status
# Visit: https://status.openai.com/

# Check 3: Check API rate limits
# Visit: https://platform.openai.com/account/api-keys

# Check 4: Test with smaller model
OPENAI_MODEL=gpt-3.5-turbo  # Faster but less capable
```

#### Problem: Bot gives irrelevant responses
```python
# Update the system prompt in utils.py
def _build_system_prompt(self, context):
    return """Be more specific about your domain and expertise.
    
    You are a technical support specialist for an e-commerce store.
    Focus on helping customers with products, orders, and policies.
    Do not provide medical, legal, or financial advice."""
```

#### Problem: Same response for different questions
```python
# Check 1: Verify temperature is not 0
# In utils.py: temperature=0.7  # Should vary

# Check 2: Check if using wrong model
# gpt-3.5-turbo should work fine

# Check 3: Send full conversation history
# Not just the latest message
```

---

### Performance Issues

#### Problem: Database is large/slow
```bash
# Check database size
du -h backend/db.sqlite3

# Archive old messages
python manage.py shell
from api.chatbot.models import Message
from django.utils import timezone
from datetime import timedelta

old_date = timezone.now() - timedelta(days=90)
Message.objects.filter(timestamp__lt=old_date).delete()

# Or better: use PostgreSQL for production
```

#### Problem: Too many API calls
```python
# Implement request throttling
from rest_framework.throttling import UserRateThrottle

class ChatThrottle(UserRateThrottle):
    scope = 'chat'
    rate = '50/hour'  # Adjust as needed

# In views.py
throttle_classes = [ChatThrottle]
```

---

## 🚀 Deployment Guide

### Option 1: Heroku (Easiest)

#### 1. Create Procfile
```
# backend/Procfile
release: python manage.py migrate
web: gunicorn backend.wsgi:application --log-file -
```

#### 2. Create requirements.txt
```bash
pip freeze > requirements.txt
```

#### 3. Deploy
```bash
heroku login
heroku create your-app-name
git push heroku main

# Set environment variables
heroku config:set AI_API_KEY=sk-...
heroku config:set AI_MODEL_TYPE=openai

# View logs
heroku logs --tail
```

### Option 2: DigitalOcean App Platform

#### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git push -u origin main
```

#### 2. Connect to App Platform
- Go to DigitalOcean dashboard
- Create new App
- Connect GitHub repo
- Set environment variables
- Deploy

### Option 3: AWS (Scalable)

#### 1. Use Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init

# Create environment
eb create chatbot-env

# Deploy
eb deploy

# View logs
eb logs
```

#### 2. Set Environment Variables
```bash
eb setenv AI_API_KEY=sk-... AI_MODEL_TYPE=openai
```

### Option 4: Docker (Recommended)

#### 1. Create Dockerfile
```dockerfile
FROM python:3.11

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Run migrations
RUN python manage.py migrate

EXPOSE 8000
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
```

#### 2. Create docker-compose.yml
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "8000:8000"
    environment:
      - AI_API_KEY=${AI_API_KEY}
      - AI_MODEL_TYPE=openai
    volumes:
      - ./backend:/app
    command: python manage.py runserver 0.0.0.0:8000

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=chatbot
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    depends_on:
      - web

volumes:
  postgres_data:
```

#### 3. Build and Run
```bash
docker-compose up
```

---

## 📋 Pre-Deployment Checklist

### Backend
- [ ] Remove DEBUG = True from settings.py
- [ ] Set SECRET_KEY to secure random string
- [ ] Configure ALLOWED_HOSTS with your domain
- [ ] Set up proper database (PostgreSQL recommended)
- [ ] Configure CORS_ALLOWED_ORIGINS
- [ ] Set up environment variables
- [ ] Run `python manage.py check --deploy`
- [ ] Test all API endpoints

### Frontend
- [ ] Update API_BASE to production URL
- [ ] Update axios default headers if needed
- [ ] Remove console.logs
- [ ] Test all components
- [ ] Run `npm run build`
- [ ] Test build locally

### Security
- [ ] Store API keys in environment variables
- [ ] Enable HTTPS
- [ ] Set up SSL certificate
- [ ] Enable CSRF protection
- [ ] Rate limit API endpoints
- [ ] Add authentication/authorization

---

## 🔍 Monitoring in Production

### 1. Error Tracking (Sentry)
```python
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="your_sentry_dsn",
    integrations=[DjangoIntegration()],
    environment="production"
)
```

### 2. Logging
```python
# In settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/chatbot.log',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
}
```

### 3. Monitoring
```bash
# Use tools like:
# - New Relic
# - DataDog
# - CloudWatch
# - Prometheus + Grafana
```

---

## 💰 Cost Optimization

### 1. Use Model Fallback
```python
# If OpenAI fails, use local model
try:
    response = openai_model.generate()
except Exception:
    response = fallback_model.generate()
```

### 2. Cache Responses
```python
from django.core.cache import cache

cached_response = cache.get(f'chat:{user_id}:{question_hash}')
if not cached_response:
    response = generate_response(question)
    cache.set(f'chat:{user_id}:{question_hash}', response, 3600)
```

### 3. Use Cheaper Model
```env
# Change from GPT-4 to GPT-3.5-turbo
OPENAI_MODEL=gpt-3.5-turbo
```

### 4. Implement Batching
```python
# Process multiple requests together to get better rates
# Useful if you have high traffic
```

---

## 📞 Support Resources

- **Django Docs**: https://docs.djangoproject.com/
- **DRF Docs**: https://www.django-rest-framework.org/
- **OpenAI API**: https://platform.openai.com/docs/
- **React Docs**: https://react.dev/
- **Stack Overflow**: https://stackoverflow.com/
- **GitHub Issues**: Look for existing solutions

---

**Good luck with your deployment!** 🚀

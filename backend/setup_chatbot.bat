@echo off
REM E-Commerce Chatbot Setup Script for Windows

echo.
echo =========================================
echo E-Commerce AI Chatbot Setup
echo =========================================
echo.

REM Step 1: Check Python
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found! Please install Python 3.8+
    exit /b 1
)
python --version
echo.

REM Step 2: Install Python packages
echo [2/5] Installing Python dependencies...
cd backend
pip install --upgrade pip
pip install openai python-dotenv transformers torch requests
echo ✓ Dependencies installed
echo.

REM Step 3: Run migrations
echo [3/5] Running database migrations...
python manage.py makemigrations
python manage.py migrate
echo ✓ Migrations complete
echo.

REM Step 4: Create superuser prompt
echo [4/5] Django setup
echo If this is your first time, create a superuser:
echo Run: python manage.py createsuperuser
echo.

REM Step 5: Instructions
echo [5/5] Setup complete!
echo.
echo Next steps:
echo 1. Copy .env.example to .env and configure your AI provider:
echo    copy .env.example .env
echo    # Then edit .env with your API key
echo.
echo 2. Start the Django development server:
echo    python manage.py runserver
echo.
echo 3. In another terminal, start the React frontend:
echo    cd ..\frontend
echo    npm install
echo    npm start
echo.
echo 4. Open http://localhost:3000 in your browser
echo.
echo Happy coding! 🚀
echo.
pause

#!/bin/bash

# E-Commerce Chatbot Setup Script
# This script automates the setup of the AI chatbot integration

set -e

echo "========================================="
echo "E-Commerce AI Chatbot Setup"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Python
echo -e "${BLUE}[1/5] Checking Python installation...${NC}"
if ! command -v python &> /dev/null; then
    echo "Python not found! Please install Python 3.8+"
    exit 1
fi
echo -e "${GREEN}✓ Python found: $(python --version)${NC}"
echo ""

# Step 2: Install Python packages
echo -e "${BLUE}[2/5] Installing Python dependencies...${NC}"
cd backend
pip install --upgrade pip
pip install openai python-dotenv transformers torch requests
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 3: Run migrations
echo -e "${BLUE}[3/5] Running database migrations...${NC}"
python manage.py makemigrations
python manage.py migrate
echo -e "${GREEN}✓ Migrations complete${NC}"
echo ""

# Step 4: Create superuser prompt
echo -e "${BLUE}[4/5] Django setup${NC}"
echo "If this is your first time, you may want to create a superuser:"
echo "Run: python manage.py createsuperuser"
echo ""

# Step 5: Instructions
echo -e "${BLUE}[5/5] Setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy .env.example to .env and configure your AI provider:"
echo "   cp .env.example .env"
echo "   # Then edit .env with your API key"
echo ""
echo "2. Start the Django development server:"
echo "   python manage.py runserver"
echo ""
echo "3. In another terminal, start the React frontend:"
echo "   cd ../frontend"
echo "   npm install  # if not already done"
echo "   npm start"
echo ""
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"

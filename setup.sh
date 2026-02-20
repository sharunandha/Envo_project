#!/bin/bash

# Installation and Setup Script for Linux/macOS

set -e

echo "🛰️ India Flood and Landslide Warning System - Setup Script"
echo "=========================================================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

echo "✓ Node.js $(node -v) is installed"
echo "✓ npm $(npm -v) is installed"
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend

if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Skipping..."
else
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env created"
fi

echo "Installing dependencies..."
npm install
echo "✓ Backend dependencies installed"
echo ""

cd ..

# Setup Frontend
echo "📦 Setting up Frontend..."
cd frontend

if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Skipping..."
else
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env created"
fi

echo "Installing dependencies..."
npm install
echo "✓ Frontend dependencies installed"
echo ""

cd ..

echo "=========================================================="
echo "✅ Setup Complete!"
echo "=========================================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Start Backend Server:"
echo "   cd backend && npm start"
echo ""
echo "2. In another terminal, Start Frontend Development Server:"
echo "   cd frontend && npm start"
echo ""
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "=========================================================="

#!/bin/bash
set -e

echo "🚀 Building MediaFetchr Frontend..."

# Check current directory
echo "📁 Current directory: $(pwd)"
echo "📁 Contents:"
ls -la

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found!"
    exit 1
fi

# Change to frontend directory
echo "📁 Changing to frontend directory..."
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: frontend/package.json not found!"
    exit 1
fi

# Check if public/index.html exists
if [ ! -f "public/index.html" ]; then
    echo "❌ Error: frontend/public/index.html not found!"
    exit 1
fi

echo "✅ Found all required files"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the app
echo "🔨 Building React app..."
npm run build

echo "✅ Build completed successfully!"
echo "📁 Build output:"
ls -la build/ 
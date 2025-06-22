#!/bin/bash
set -e

echo "🚀 Building MediaFetchr Frontend..."

# Check current directory
echo "📁 Current directory: $(pwd)"
echo "📁 Contents:"
ls -la

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    exit 1
fi

# Check if public/index.html exists
if [ ! -f "public/index.html" ]; then
    echo "❌ Error: public/index.html not found!"
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
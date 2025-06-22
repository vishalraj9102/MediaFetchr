#!/bin/bash
set -e

echo "🔍 Verifying MediaFetchr build setup..."

echo "📁 Current directory: $(pwd)"
echo "📁 Project structure:"
ls -la

echo "📁 Frontend directory:"
ls -la frontend/

echo "📁 Frontend/public directory:"
ls -la frontend/public/

echo "✅ Verification complete!" 
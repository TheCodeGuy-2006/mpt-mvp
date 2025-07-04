#!/bin/bash
# railway-start.sh - Railway startup script

echo "🚀 Starting MPT MVP Backend for Railway..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"
echo "PORT: ${PORT:-3000}"

# Create data directory if it doesn't exist
mkdir -p data

# Check if data files exist, create defaults if not
if [ ! -f "data/budgets.json" ]; then
    echo '{}' > data/budgets.json
fi

if [ ! -f "data/planning.json" ]; then
    echo '[]' > data/planning.json
fi

if [ ! -f "data/calendar.json" ]; then
    echo '[]' > data/calendar.json
fi

echo "✅ Data files initialized"
echo "🎯 Starting server..."

# Start the server
node server.js

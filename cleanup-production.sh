#!/bin/bash
# Cleanup Script for MPT MVP - Remove Development/Debug Files
# Run this script to clean up test and debug files for production

echo "🧹 MPT MVP Cleanup Script"
echo "========================="

# Navigate to project directory
cd "/Users/jordanradford/Desktop/New Github/mpt-mvp"

echo "📊 Current project size:"
du -sh .

echo ""
echo "🗑️ Files to be removed:"

# List debug HTML files
echo "Debug HTML files:"
find . -maxdepth 1 -name "debug-*.html" -exec basename {} \;

# List test HTML files  
echo "Test HTML files:"
find . -maxdepth 1 -name "test-*.html" -exec basename {} \;

# List test JavaScript files
echo "Test JavaScript files:"
find . -maxdepth 1 -name "*-test.js" -exec basename {} \;

# List debug JavaScript files
echo "Debug JavaScript files:"
find . -maxdepth 1 -name "debug-*.js" -exec basename {} \;

# List cleanup JavaScript files
echo "Cleanup JavaScript files:"
find . -maxdepth 1 -name "cleanup-*.js" -exec basename {} \;

echo ""
echo "⚠️  This will remove the above files. Continue? (y/N)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🗑️ Removing debug/test files..."
    
    # Remove debug HTML files
    find . -maxdepth 1 -name "debug-*.html" -delete
    
    # Remove test HTML files (keep demo.html)
    find . -maxdepth 1 -name "test-*.html" -delete
    
    # Remove test JavaScript files
    find . -maxdepth 1 -name "*-test.js" -delete
    
    # Remove debug JavaScript files
    find . -maxdepth 1 -name "debug-*.js" -delete
    
    # Remove cleanup JavaScript files
    find . -maxdepth 1 -name "cleanup-*.js" -delete
    
    # Remove cleanup Node.js scripts
    find . -maxdepth 1 -name "clean-*.js" -delete
    
    echo "✅ Cleanup complete!"
    echo ""
    echo "📊 New project size:"
    du -sh .
    
    echo ""
    echo "🎉 Your codebase is now optimized for production!"
    echo "📁 Core files preserved:"
    echo "   - index.html (main application)"
    echo "   - All core JavaScript modules"
    echo "   - Phase 3 analytics and integration"
    echo "   - Performance monitoring"
    echo "   - All production functionality"
else
    echo "❌ Cleanup cancelled"
fi

#!/bin/bash
# deploy-setup.sh - Quick deployment setup script

echo "🚀 MPT MVP Deployment Setup"
echo "=========================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Error: This is not a git repository"
    echo "Please run 'git init' first"
    exit 1
fi

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Are you in the correct directory?"
    exit 1
fi

echo "📋 Deployment Checklist:"
echo "1. ✅ Git repository initialized"
echo "2. ✅ Package.json found"
echo ""

echo "🔧 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Deploy backend to Railway/Vercel/Render"
echo "3. Update config.js with your backend URL"
echo "4. Enable GitHub Pages in repository settings"
echo ""

echo "📖 Platform-specific instructions:"
echo ""
echo "🚄 Railway:"
echo "   - Go to https://railway.app"
echo "   - Connect GitHub and deploy this repository"
echo "   - Copy the generated URL"
echo ""
echo "▲ Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Import project from GitHub"
echo "   - Copy the generated URL"
echo ""
echo "🎨 Render:"
echo "   - Go to https://render.com"
echo "   - Create new Web Service from GitHub"
echo "   - Build: npm install"
echo "   - Start: npm start"
echo ""

echo "⚙️ Configuration:"
echo "After deploying backend, edit config.js:"
echo "Replace 'https://your-backend-url.railway.app' with your actual URL"
echo ""

echo "📄 For detailed instructions, see README.md"
echo "🎉 Ready to deploy!"

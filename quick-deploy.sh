#!/bin/bash
# quick-deploy.sh - One-click deployment script

echo "🚀 Quick Backend Deployment"
echo "=========================="
echo ""

echo "Choose your deployment platform:"
echo "1. Railway (Recommended)"
echo "2. Render (Free tier)"
echo "3. Vercel (Serverless)"
echo ""

read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo "🚄 Railway Deployment:"
    echo "1. Go to https://railway.app"
    echo "2. Sign in with GitHub"
    echo "3. Click 'Deploy from GitHub repo'"
    echo "4. Select 'mpt-mvp' repository"
    echo "5. Copy the generated URL"
    echo ""
    echo "Example URL: https://mpt-mvp-production-abc123.up.railway.app"
    ;;
  2)
    echo "🎨 Render Deployment:"
    echo "1. Go to https://render.com"
    echo "2. New → Web Service"
    echo "3. Connect GitHub → Select 'mpt-mvp'"
    echo "4. Build: npm install"
    echo "5. Start: npm start"
    echo "6. Copy the generated URL"
    echo ""
    echo "Example URL: https://mpt-mvp.onrender.com"
    ;;
  3)
    echo "▲ Vercel Deployment:"
    echo "1. Go to https://vercel.com"
    echo "2. Import Project from GitHub"
    echo "3. Select 'mpt-mvp'"
    echo "4. Deploy (auto-detects Node.js)"
    echo "5. Copy the generated URL"
    echo ""
    echo "Example URL: https://mpt-mvp.vercel.app"
    ;;
  *)
    echo "Invalid choice. Please run again."
    exit 1
    ;;
esac

echo ""
echo "⚙️ After deployment:"
echo "1. Copy your backend URL"
echo "2. Edit config.js in your GitHub repository"
echo "3. Replace 'https://your-backend-url.railway.app' with your actual URL"
echo "4. Commit and push the changes"
echo "5. Wait 2-3 minutes for GitHub Pages to update"
echo ""
echo "✅ Your app will then be fully functional!"

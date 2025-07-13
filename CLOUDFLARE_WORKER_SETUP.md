# Cloudflare Worker Setup Guide

## Overview

This guide helps you set up a Cloudflare Worker to handle secure GitHub API calls for the MPT MVP application. The Worker acts as a backend proxy that can safely commit data to your GitHub repository.

## Prerequisites

- A Cloudflare account (free tier works)
- A GitHub Personal Access Token with `repo` permissions
- Your GitHub repository details

## Step-by-Step Setup

### 1. Create a New Cloudflare Worker

1. **Login to Cloudflare Dashboard**
   - Go to https://dash.cloudflare.com
   - Navigate to **Workers & Pages**

2. **Create New Worker**
   - Click **Create application**
   - Select **Create Worker** (NOT Pages!)
   - Name your worker (e.g., `mpt-mvp-sync`)
   - Click **Create**

3. **Deploy the Worker Code**
   - Delete the default "Hello World" code
   - Copy the entire contents of `cloudflare-worker.js` from this repository
   - Paste it into the Worker editor
   - **IMPORTANT**: Update the configuration constants at the top:
     ```javascript
     const REPO_OWNER = "jordanradford"; // ← Your GitHub username
     const REPO_NAME = "mpt-mvp"; // ← Your repository name
     ```
   - Click **Save and Deploy**

### 2. Configure Environment Variables

1. **Add GitHub Token**
   - In your Worker dashboard, go to **Settings** → **Variables**
   - Click **Add variable**
   - Name: `GITHUB_TOKEN`
   - Value: Your GitHub Personal Access Token (starts with `ghp_`)
   - ✅ **IMPORTANT**: Check "Encrypt" to secure your token
   - Click **Save**

### 3. Test Your Worker

1. **Get Worker URL**
   - Your Worker will be available at: `https://your-worker-name.your-subdomain.workers.dev`
   - Copy this URL for later use

2. **Test Health Endpoint**

   ```bash
   curl https://your-worker-name.your-subdomain.workers.dev/health
   ```

   Expected response:

   ```json
   {
     "status": "healthy",
     "message": "MPT MVP Cloudflare Worker is running",
     "config": {
       "repo": "jordanradford/mpt-mvp",
       "branch": "main"
     }
   }
   ```

### 4. Configure the Frontend

1. **Open your MPT MVP application**
2. **Go to the GitHub Sync tab**
3. **Enter your Worker URL** (without trailing slash)
4. **Click "Test Connection"**
5. **Enable Auto-Save** if desired
6. **Save Configuration**

## Worker Features

### Endpoints

- **GET /health** - Health check and configuration info
- **POST /save** - Save data to GitHub repository

### Security Features

- CORS enabled for frontend access
- Encrypted GitHub token storage
- Input validation and sanitization
- Error handling and logging

### Supported Data Types

- `planning` → saves to `data/planning.json`
- `budgets` → saves to `data/budgets.json`
- `calendar` → saves to `data/calendar.json`

## Troubleshooting

### Common Issues

1. **404 Not Found**
   - Check that your Worker URL is correct
   - Ensure the Worker code is properly deployed
   - Verify you're not using double slashes in URLs

2. **GitHub API Errors**
   - Verify your GitHub token has `repo` permissions
   - Check that REPO_OWNER and REPO_NAME are correct
   - Ensure the token hasn't expired

3. **CORS Errors**
   - The Worker includes CORS headers - if you see CORS errors, check browser console for specific details

### Debugging

1. **Check Worker Logs**
   - In Cloudflare dashboard, go to your Worker
   - Click **Logs** tab to see real-time debugging info

2. **Test with curl**

   ```bash
   # Health check
   curl https://your-worker.workers.dev/health

   # Test save (replace with your data)
   curl -X POST https://your-worker.workers.dev/save \
     -H "Content-Type: application/json" \
     -d '{"dataType":"planning","data":[{"test":"data"}]}'
   ```

## Security Best Practices

1. **Never expose your GitHub token in frontend code**
2. **Always use encrypted environment variables in Cloudflare**
3. **Regularly rotate your GitHub tokens**
4. **Monitor Worker logs for suspicious activity**
5. **Use the minimum required GitHub token permissions**

## Cost Considerations

- Cloudflare Workers free tier: 100,000 requests/day
- For the MPT MVP use case, this should be more than sufficient
- Each auto-save and manual save counts as 1 request

## Next Steps

Once your Worker is set up:

1. Test the connection from your frontend
2. Enable auto-save in the GitHub Sync configuration
3. Make some changes to verify commits appear in your repository
4. Set up GitHub Pages deployment if not already done

For more help, see `TROUBLESHOOTING.md` or `QUICK_SETUP.md`.

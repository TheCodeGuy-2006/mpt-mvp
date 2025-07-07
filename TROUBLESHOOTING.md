# Troubleshooting Guide

## Common Issues and Solutions

### 🔧 Cloudflare Worker Issues

#### 404 Not Found Error
```
GET https://mpt-mvp-sync.jordanradford.workers.dev//health 404 (Not Found)
```

**Causes:**
- Double slash in URL (`//health` instead of `/health`)
- Worker not properly deployed
- Incorrect Worker URL

**Solutions:**
1. **Check URL format:**
   - ❌ Wrong: `https://worker.workers.dev//health`
   - ✅ Correct: `https://worker.workers.dev/health`

2. **Verify Worker deployment:**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Click on your worker
   - Ensure the code is deployed (not showing "Hello World")

3. **Test Worker URL:**
   ```bash
   curl https://your-worker.workers.dev/health
   ```

#### Worker Code Not Updated
**Problem:** Worker still shows default "Hello World" response

**Solution:**
1. Go to Cloudflare Dashboard
2. Click on your worker
3. Delete ALL existing code
4. Copy and paste the ENTIRE `cloudflare-worker.js` file
5. Update `REPO_OWNER` and `REPO_NAME`
6. Click **Save and Deploy**

#### CORS Errors
**Problem:** Browser blocks requests due to CORS policy

**Solution:**
The Worker includes CORS headers. If you see CORS errors:
1. Check browser console for specific error details
2. Verify Worker code includes CORS headers (it should)
3. Try accessing Worker URL directly in browser

### 🔑 GitHub Token Issues

#### 401 Unauthorized
**Problem:** GitHub API returns 401 when Worker tries to access repository

**Causes:**
- Invalid or expired GitHub token
- Token missing required permissions
- Token not properly set in Cloudflare

**Solutions:**
1. **Check token permissions:**
   - Go to https://github.com/settings/tokens
   - Verify token has `repo` scope checked
   - Regenerate if expired

2. **Verify Cloudflare environment variable:**
   - Worker Settings → Variables
   - Ensure `GITHUB_TOKEN` is set and encrypted
   - Re-add if necessary

3. **Test token manually:**
   ```bash
   curl -H "Authorization: token YOUR_TOKEN" \
        https://api.github.com/repos/jordanradford/mpt-mvp
   ```

#### 403 Forbidden
**Problem:** Token exists but lacks permissions

**Solutions:**
1. **Check repository access:**
   - Ensure your GitHub account has push access to the repository
   - For organization repos, check organization settings

2. **Verify token scope:**
   - Token needs `repo` scope (full repository access)
   - Other scopes like `public_repo` may not be sufficient

#### 404 Repository Not Found
**Problem:** Worker can't find the repository

**Solutions:**
1. **Check repository configuration in Worker:**
   ```javascript
   const REPO_OWNER = 'jordanradford';  // ← Your exact GitHub username
   const REPO_NAME = 'mpt-mvp';         // ← Your exact repository name
   ```

2. **Verify repository exists:**
   - Go to https://github.com/jordanradford/mpt-mvp
   - Ensure repository is accessible

### 🌐 Frontend Connection Issues

#### "Worker endpoint not configured"
**Problem:** Frontend can't connect to Worker

**Solutions:**
1. **Configure Worker endpoint:**
   - Go to GitHub Sync tab
   - Enter Worker URL: `https://your-worker.workers.dev`
   - Click "Save Configuration"

2. **Check URL format:**
   - Don't include `/health` in the endpoint URL
   - Don't include trailing slash

#### Auto-save Not Working
**Problem:** Changes aren't automatically saved

**Solutions:**
1. **Enable auto-save:**
   - GitHub Sync tab → Check "Enable Auto-Save"
   - Set appropriate delay (3-10 seconds)
   - Save configuration

2. **Check browser console:**
   - Look for JavaScript errors
   - Verify Cloudflare sync module loaded

3. **Test manual save:**
   - Try "Force Sync All Data" button
   - Check if manual saves work

### 📡 Network and Connectivity Issues

#### Timeout Errors
**Problem:** Requests to Worker timeout

**Solutions:**
1. **Check Cloudflare Worker status:**
   - Visit Cloudflare Status page
   - Try accessing Worker URL directly

2. **Check network connectivity:**
   - Try from different network/device
   - Disable VPN if using one

3. **Worker resource limits:**
   - Free tier has limits on execution time
   - Check Worker logs for timeout errors

#### SSL/TLS Certificate Errors
**Problem:** Browser shows certificate warnings

**Solutions:**
1. **Use HTTPS URLs:**
   - All Worker URLs should start with `https://`
   - Never use `http://` for Cloudflare Workers

2. **Clear browser cache:**
   - Hard refresh (Ctrl+F5 or Cmd+Shift+R)
   - Clear SSL state in browser settings

### 💾 Data Saving Issues

#### "Save failed" Messages
**Problem:** Data saves fail with error messages

**Solutions:**
1. **Check Worker logs:**
   - Cloudflare Dashboard → Worker → Logs
   - Look for specific error messages

2. **Verify data format:**
   - Ensure data is valid JSON
   - Check for circular references

3. **Test with minimal data:**
   - Try saving a simple test object
   - Gradually add more complex data

#### Files Not Appearing in GitHub
**Problem:** Saves seem successful but files don't update in repository

**Solutions:**
1. **Check repository branch:**
   - Worker saves to `main` branch by default
   - Verify you're looking at the correct branch

2. **Check commit history:**
   - Look for recent commits by the Worker
   - Commits should show as automated saves

3. **Verify file paths:**
   - Worker saves to `data/planning.json`, `data/budgets.json`
   - Check these specific paths

### 🔍 Debugging Steps

#### Step 1: Health Check
```bash
curl https://your-worker.workers.dev/health
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

#### Step 2: Test Save
```bash
curl -X POST https://your-worker.workers.dev/save \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "planning",
    "data": [{"test": "data"}],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }'
```

#### Step 3: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for red error messages
4. Note any 404, 401, or 403 errors

#### Step 4: Check Cloudflare Logs
1. Cloudflare Dashboard → Workers & Pages
2. Click on your worker
3. Go to Logs tab
4. Make a request and watch for log entries

### 🚨 Emergency Fixes

#### Reset Everything
If nothing works, try this complete reset:

1. **Delete and recreate Worker:**
   - Delete current Worker in Cloudflare
   - Create new Worker with fresh code
   - Update REPO_OWNER and REPO_NAME

2. **Regenerate GitHub token:**
   - Revoke old token in GitHub settings
   - Create new token with `repo` scope
   - Update Cloudflare environment variable

3. **Clear browser cache:**
   - Clear all site data for your GitHub Pages URL
   - Hard refresh the page

4. **Reconfigure frontend:**
   - Enter Worker URL again
   - Test connection
   - Enable auto-save

### 📞 Getting Help

If you're still having issues:

1. **Check the error message carefully**
   - Note exact error text
   - Copy any error codes

2. **Gather information:**
   - Worker URL
   - GitHub repository URL
   - Browser and version
   - Exact steps to reproduce

3. **Common debugging commands:**
   ```bash
   # Test Worker health
   curl -v https://your-worker.workers.dev/health

   # Test GitHub API access
   curl -H "Authorization: token YOUR_TOKEN" \
        https://api.github.com/repos/jordanradford/mpt-mvp

   # Check DNS resolution
   nslookup your-worker.workers.dev
   ```

4. **Check dependencies:**
   - Cloudflare Workers status
   - GitHub API status
   - Your internet connection

Remember: Most issues are due to configuration mistakes, not code bugs. Double-check your settings! 🔧

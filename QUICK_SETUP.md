# Quick Setup Guide - GitHub Pages + Cloudflare Worker in 5 Minutes

## 🚀 Super Quick Setup Guide

### Step 1: Get Your GitHub Token (2 minutes)

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Name it: `MPT MVP Auto-Save`
4. Select scope: ✅ **repo** (this is the only one you need)
5. Click **Generate token**
6. **COPY THE TOKEN** immediately! (starts with `ghp_`)

### Step 2: Create/Update Cloudflare Worker (2 minutes)

1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** → **Create application** → **Create Worker** (or edit existing)
3. Name it: `mpt-mvp-sync`
4. **IMPORTANT**: Copy the LATEST contents of `cloudflare-worker.js` into the editor
5. **Delete ALL existing code first** - the new version uses ES Module format
6. Update these lines at the top:
   ```javascript
   const REPO_OWNER = "TheCodeGuy-2006"; // ← Change to YOUR GitHub username
   const REPO_NAME = "mpt-mvp"; // ← Change to YOUR repository name
   ```
7. Click **Save and Deploy**

   > 🚨 **Critical**: The latest Worker code uses ES Module format and includes data endpoints. Make sure to replace ALL existing code!

### Step 3: Add Your GitHub Token (1 minute)

1. In your Worker dashboard, click **Settings** → **Variables**
2. Click **Add variable**
3. Variable name: `GITHUB_TOKEN`
4. Value: Paste your GitHub token (the `ghp_xxx...` one)
5. ✅ Check **Encrypt**
6. Click **Save**

### Step 4: Test It! (30 seconds)

1. Copy your Worker URL (looks like `https://mpt-mvp-sync.your-subdomain.workers.dev`)
2. Open your MPT MVP app
3. Go to **GitHub Sync** tab
4. Paste your Worker URL
5. Click **Test Connection**
6. Should see: ✅ "All tests passed! Worker is healthy and all data APIs are working."

   > 🔍 **If you see**: "⚠️ Worker is healthy but data APIs are not available" - you need to redeploy the Worker with the latest code!

### Step 5: Enable Auto-Save (10 seconds)

1. Check ✅ **Enable Auto-Save**
2. Click **Save Configuration**
3. Done! 🎉

## 🔧 What You Need to Change

In your `cloudflare-worker.js` file, update these two lines:

```javascript
const REPO_OWNER = "TheCodeGuy-2006"; // ← Change to YOUR GitHub username
const REPO_NAME = "mpt-mvp"; // ← Change to YOUR repository name
```

## 🚨 IMPORTANT: Make Sure You Have the Latest Worker Code

Your Worker MUST include these endpoints for real-time sync to work:

- `/health` - Health check
- `/save` - Save data to GitHub
- `/data/planning` - Load planning data (bypasses GitHub caching)
- `/data/budgets` - Load budgets data (bypasses GitHub caching)

If your Worker returns 404 for `/data/planning`, you need to redeploy with the latest code!

## 🎯 Your GitHub Token Needs These Permissions

When creating the token, you only need to check:

- ✅ **repo** (Full control of private repositories)

That's it! Don't check any other boxes.

## 🧪 Quick Test

After setup, test with these curl commands (replace `YOUR-WORKER-URL`):

**Test 1: Health Check**

```bash
curl https://YOUR-WORKER-URL.workers.dev/health
```

Should return:

```json
{
  "status": "healthy",
  "message": "MPT MVP Cloudflare Worker is running"
}
```

**Test 2: Data API (THIS IS THE IMPORTANT ONE!)**

```bash
curl https://YOUR-WORKER-URL.workers.dev/data/planning
```

Should return:

```json
{
  "success": true,
  "dataType": "planning",
  "data": [...],
  "source": "github-api"
}
```

**If Test 2 returns 404**, your Worker needs to be updated with the latest code!

## 🚨 Common Mistakes to Avoid

1. **Don't put your GitHub token in the code** - use environment variables!
2. **Don't forget to encrypt** the token in Cloudflare
3. **Don't check extra permissions** - only `repo` is needed
4. **Don't forget to update** `REPO_OWNER` and `REPO_NAME`
5. **🔥 MOST COMMON: Using old Worker code** - Make sure you deploy the LATEST `cloudflare-worker.js`!

## 🔧 Troubleshooting 404 Errors

If you get `404 ()` errors for `/data/planning` or `/data/budgets`:

1. **Check if your Worker has the latest code**:
   ```bash
   curl https://YOUR-WORKER-URL.workers.dev/data/planning
   ```
2. **If it returns 404**, you need to:
   - Go to your Cloudflare Worker dashboard
   - Click **Edit Code**
   - Copy the ENTIRE contents of `cloudflare-worker.js` from your project
   - Paste it (overwriting the old code)
   - Update `REPO_OWNER` and `REPO_NAME`
   - Click **Save and Deploy**

3. **The Worker should have these functions**:
   - `handleRequest()` - Main router
   - `handleHealthCheck()` - Health endpoint
   - `handleSave()` - Save endpoint
   - `handleGetData()` - Data endpoints (THIS IS KEY!)

Without `handleGetData()`, the data endpoints won't work!

## 🎉 Success Indicators

You'll know it's working when:

- ✅ Test connection shows "Connection successful!"
- ✅ When you edit data, you see "💾 Saving..." then "✅ Saved"
- ✅ New commits appear in your GitHub repository
- ✅ Files in `/data` folder are updated

## 🆘 Need Help?

If something isn't working:

1. Check the browser console for errors
2. Look at Cloudflare Worker logs
3. Verify your GitHub token hasn't expired
4. Make sure repository name/owner is correct

That's it! Your auto-save should now be working perfectly! 🚀

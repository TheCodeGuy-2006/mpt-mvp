# 🔧 Fix 404 Error: Worker Data Endpoints Not Found

## The Problem
You're seeing this error:
```
Failed to load resource: the server responded with a status of 404 ()
mpt-mvp-sync.jordanradford.workers.dev/data/planning
```

## What This Means
Your Cloudflare Worker is running (health check works), but it doesn't have the data endpoints (`/data/planning`, `/data/budgets`) that provide real-time sync functionality.

## The Solution (2 minutes)

### Step 1: Check Your Current Worker Code
1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages**
3. Find your `mpt-mvp-sync` worker
4. Click **Edit Code**

### Step 2: Look for the Data Endpoint Function
Search for `handleGetData` in your Worker code. If you don't see it, your Worker is missing the latest code!

### Step 3: Update Your Worker Code
1. **Copy the ENTIRE contents** of `cloudflare-worker.js` from your project
2. **Paste it** in the Worker editor (replace all existing code)
3. **Update these lines** at the top:
   ```javascript
   const REPO_OWNER = 'TheCodeGuy-2006';  // ← YOUR GitHub username
   const REPO_NAME = 'mpt-mvp';           // ← YOUR repo name
   ```
4. Click **Save and Deploy**

### Step 4: Verify the Fix
Test the data endpoint:
```bash
curl https://mpt-mvp-sync.jordanradford.workers.dev/data/planning
```

Should return JSON data instead of 404!

## What the Latest Worker Code Includes

Your Worker needs these endpoints for full functionality:
- ✅ `/health` - Health check
- ✅ `/save` - Save data to GitHub  
- ✅ `/data/planning` - Load planning data (real-time)
- ✅ `/data/budgets` - Load budgets data (real-time)
- ✅ `/data/calendar` - Load calendar data (real-time)

## Functions Your Worker Must Have

1. `handleRequest()` - Main router
2. `handleHealthCheck()` - Health endpoint
3. `handleSave()` - Save endpoint
4. **`handleGetData()` - Data endpoints** ← THIS IS THE MISSING PIECE!

## Quick Test Commands

After updating, test all endpoints:

```bash
# Health check (should work)
curl https://mpt-mvp-sync.jordanradford.workers.dev/health

# Data endpoints (should work after update)
curl https://mpt-mvp-sync.jordanradford.workers.dev/data/planning
curl https://mpt-mvp-sync.jordanradford.workers.dev/data/budgets
```

## Alternative: Use Debug Tool

Open `debug-worker.html` in your browser and:
1. Enter your Worker URL
2. Click **Test Data API**
3. Should show ✅ for all endpoints

## After the Fix

Once fixed, your app will:
- ✅ Load data in real-time from GitHub
- ✅ Show changes from other users immediately
- ✅ No more 404 errors in console
- ✅ Full collaborative editing works

The 404 error will be gone and real-time sync will work perfectly! 🚀

# Quick Setup Guide - GitHub Pages + Cloudflare Worker in 5 Minutes

## 🚀 Super Quick Setup Guide

### Step 1: Get Your GitHub Token (2 minutes)
1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Name it: `MPT MVP Auto-Save`
4. Select scope: ✅ **repo** (this is the only one you need)
5. Click **Generate token**
6. **COPY THE TOKEN** immediately! (starts with `ghp_`)

### Step 2: Create Cloudflare Worker (2 minutes)
1. Go to https://dash.cloudflare.com
2. Click **Workers & Pages** → **Create application** → **Create Worker**
3. Name it: `mpt-mvp-sync`
4. Copy the contents of `cloudflare-worker.js` into the editor
5. Update these lines at the top:
   ```javascript
   const REPO_OWNER = 'jordanradford';      // ← Change to YOUR GitHub username
   const REPO_NAME = 'mpt-mvp';             // ← Change to YOUR repository name
   ```
6. Click **Save and Deploy**

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
6. Should see: ✅ "Connection successful!"

### Step 5: Enable Auto-Save (10 seconds)
1. Check ✅ **Enable Auto-Save**
2. Click **Save Configuration**
3. Done! 🎉

## 🔧 What You Need to Change

In your `cloudflare-worker.js` file, update these two lines:
```javascript
const REPO_OWNER = 'jordanradford';  // ← Change to YOUR GitHub username
const REPO_NAME = 'mpt-mvp';         // ← Change to YOUR repository name
```

## 🎯 Your GitHub Token Needs These Permissions

When creating the token, you only need to check:
- ✅ **repo** (Full control of private repositories)

That's it! Don't check any other boxes.

## 🧪 Quick Test

After setup, test with this curl command (replace `YOUR-WORKER-URL`):
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

## 🚨 Common Mistakes to Avoid

1. **Don't put your GitHub token in the code** - use environment variables!
2. **Don't forget to encrypt** the token in Cloudflare
3. **Don't check extra permissions** - only `repo` is needed
4. **Don't forget to update** `REPO_OWNER` and `REPO_NAME`

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

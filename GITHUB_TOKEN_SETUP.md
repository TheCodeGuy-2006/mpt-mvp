# GitHub Token Setup Guide

## Overview

This guide walks you through creating a GitHub Personal Access Token (PAT) for the MPT MVP Cloudflare Worker integration. This token allows the Worker to securely commit data to your GitHub repository.

## Why Do You Need This?

The Cloudflare Worker needs permission to:

- Read your repository contents
- Create and update files in the `/data` folder
- Create commits with your changes

## Step-by-Step Token Creation

### 1. Navigate to GitHub Settings

1. **Go to GitHub**
   - Visit https://github.com/settings/tokens
   - Or: GitHub → Profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

### 2. Generate New Token

1. **Click "Generate new token"**
   - Select **"Generate new token (classic)"**
   - You may be prompted to confirm your password

### 3. Configure Token Settings

1. **Token Name/Note**
   - Enter a descriptive name: `MPT MVP Auto-Save`
   - This helps you remember what the token is for

2. **Expiration**
   - Choose an appropriate expiration time
   - Recommended: 90 days (you can regenerate when needed)
   - For convenience: "No expiration" (but remember to rotate periodically)

3. **Select Scopes**
   - ✅ **repo** - Full control of private repositories
     - This includes: repo:status, repo_deployment, public_repo, repo:invite, security_events
   - ❌ **Do NOT check any other boxes** - only `repo` is needed

### 4. Generate and Copy Token

1. **Click "Generate token"**
2. **IMMEDIATELY COPY THE TOKEN**
   - It starts with `ghp_` followed by random characters
   - Example: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **You won't be able to see it again!**

## Token Security Best Practices

### ✅ Do This

1. **Store the token securely**
   - Use a password manager
   - Store in Cloudflare as an encrypted environment variable
   - Never commit to version control

2. **Use minimal permissions**
   - Only select the `repo` scope
   - Don't give broader access than needed

3. **Set reasonable expiration**
   - 30-90 days is recommended
   - Set calendar reminder to regenerate

4. **Monitor token usage**
   - Check GitHub settings occasionally
   - Revoke unused tokens

### ❌ Don't Do This

1. **Never put tokens in code**
   - Don't hardcode in JavaScript files
   - Don't commit to repositories
   - Don't share in chat/email

2. **Don't use overly broad permissions**
   - Avoid `admin:repo_hook` unless needed
   - Don't select `admin:org` scope
   - Skip `delete_repo` permissions

3. **Don't share tokens**
   - Each person should have their own token
   - Don't email or message tokens

## Using the Token

### In Cloudflare Worker

1. **Go to your Worker dashboard**
2. **Settings → Variables**
3. **Add variable:**
   - Name: `GITHUB_TOKEN`
   - Value: Your token (the `ghp_...` string)
   - ✅ **Check "Encrypt"** - this is crucial!
4. **Save**

### Testing the Token

You can test your token works with curl:

```bash
# Replace YOUR_TOKEN with your actual token
curl -H "Authorization: token YOUR_TOKEN" \
     https://api.github.com/repos/jordanradford/mpt-mvp

# Should return repository information
```

## Troubleshooting Token Issues

### Token Not Working

1. **Check token permissions**
   - Go to https://github.com/settings/tokens
   - Click on your token name
   - Verify `repo` scope is selected

2. **Verify repository access**
   - Make sure the token owner has access to the repository
   - For organization repos, check organization settings

3. **Check token expiration**
   - Expired tokens will return 401 errors
   - Generate a new token if expired

### Common Error Messages

- **401 Unauthorized**: Token is invalid, expired, or lacks permissions
- **403 Forbidden**: Token doesn't have required scope or repository access
- **404 Not Found**: Repository doesn't exist or token can't access it

## Token Rotation

### When to Rotate

- Every 90 days (recommended)
- If token may have been compromised
- When team members leave
- If you see unexpected repository activity

### How to Rotate

1. **Generate new token** (follow steps above)
2. **Update Cloudflare Worker** environment variable
3. **Test the new token** works
4. **Revoke old token** in GitHub settings

## Repository Permissions

### What the Token Can Do

With `repo` scope, the token can:

- ✅ Read repository contents
- ✅ Create and update files
- ✅ Create commits
- ✅ Read repository metadata
- ✅ Access public and private repositories

### What the Token Cannot Do

The token cannot:

- ❌ Delete the repository
- ❌ Change repository settings
- ❌ Manage collaborators
- ❌ Create releases (unless specifically granted)
- ❌ Access other repositories (unless owner has access)

## Organization Considerations

If your repository is owned by an organization:

1. **Check organization policies**
   - Some orgs restrict personal access tokens
   - May require admin approval

2. **Consider using GitHub Apps**
   - More secure for organization use
   - Fine-grained permissions
   - Better audit trail

3. **Repository permissions**
   - Your GitHub account needs push access to the repository
   - Token inherits your repository permissions

## Support

If you're having issues:

1. **Check GitHub token settings**: https://github.com/settings/tokens
2. **Review Cloudflare Worker logs** for specific error messages
3. **Test token with GitHub API** using curl commands above
4. **Verify repository permissions** in repository settings

Remember: Keep your token secure and rotate it regularly! 🔐

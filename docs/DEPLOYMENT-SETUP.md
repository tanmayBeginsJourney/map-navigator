# Phase 2 Deployment Setup Guide

## Overview
This guide walks you through setting up automated deployment for the Campus Navigation System using Vercel (frontend) and Railway (backend). **No desktop applications required!**

## Prerequisites ✅
- [x] GitHub account with repository access
- [x] Node.js and npm installed
- [x] CLI tools installed (`vercel` and `railway`)

## Step 1: Vercel Setup (Frontend Deployment)

### 1.1 Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign up" → "Continue with GitHub"
3. Authorize Vercel to access your repositories

### 1.2 Create Vercel Project
```powershell
# Login to Vercel
vercel login

# Navigate to frontend app
cd apps/web-app

# Initialize Vercel project
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (your username/team)
# - Link to existing project? N
# - Project name: campus-navigation-frontend
# - Directory: ./
# - Override settings? N
```

### 1.3 Get Vercel Tokens
```powershell
# Get your Vercel token
vercel whoami
# Note: You'll need to create a token at https://vercel.com/account/tokens
```

**Manual Steps:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to Settings → Tokens
3. Create new token: "GitHub Actions Deployment"
4. Copy the token (save for GitHub secrets)
5. Note your Team/User ID from the URL or settings

## Step 2: Railway Setup (Backend Deployment)

### 2.1 Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your repositories

### 2.2 Create Railway Project
```powershell
# Login to Railway
railway login

# Navigate to backend API
cd ../../packages/api

# Initialize Railway project
railway init

# Follow prompts:
# - Create new project? Y
# - Project name: campus-navigation-api
# - Environment: production
```

### 2.3 Set up PostgreSQL Database
```powershell
# Add PostgreSQL service
railway add postgresql

# Get database URL (save for later)
railway variables
```

### 2.4 Configure Railway Environment
```powershell
# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set API_VERSION=v1
railway variables set LOG_LEVEL=info

# Database URL will be automatically set by Railway PostgreSQL service
```

## Step 3: GitHub Secrets Configuration

### 3.1 Navigate to Repository Settings
1. Go to your GitHub repository
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"

### 3.2 Add Required Secrets

**Vercel Secrets:**
- `VERCEL_TOKEN`: Token from Vercel dashboard
- `VERCEL_ORG_ID`: Your team/user ID from Vercel
- `VERCEL_PROJECT_ID`: Project ID from Vercel project settings

**Railway Secrets:**
- `RAILWAY_TOKEN`: Token from Railway dashboard
- `RAILWAY_SERVICE_ID`: Service ID from Railway project

### 3.3 Get Railway Token
```powershell
# Get Railway token
railway auth

# Or create new token at: https://railway.app/account/tokens
```

## Step 4: Project Configuration

### 4.1 Update Vercel Configuration
Create `apps/web-app/vercel.json`:
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "env": {
    "VITE_API_URL": "https://your-railway-app.railway.app"
  }
}
```

### 4.2 Update Railway Configuration
Create `packages/api/railway.json`:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health"
  }
}
```

## Step 5: Test Deployment

### 5.1 Manual Deployment Test
```powershell
# Test Vercel deployment
cd apps/web-app
vercel --prod

# Test Railway deployment
cd ../../packages/api
railway up
```

### 5.2 Verify Deployments
- **Frontend**: Check Vercel dashboard for deployment status
- **Backend**: Check Railway dashboard for service status
- **Health Check**: Test API endpoints

## Step 6: Enable CI/CD Pipeline

### 6.1 Push Changes
```powershell
# Commit configuration files
git add .
git commit -m "feat: add deployment configuration for Phase 2"
git push origin main
```

### 6.2 Monitor Pipeline
1. Go to GitHub Actions tab
2. Watch the CI/CD pipeline execute
3. Verify all phases complete successfully
4. Check deployment URLs

## Troubleshooting

### Common Issues:
1. **CLI Login Issues**: Use `vercel login` or `railway login` again
2. **Token Permissions**: Ensure tokens have deployment permissions
3. **Build Failures**: Check build logs in respective dashboards
4. **Database Connection**: Verify Railway PostgreSQL service is running

### Useful Commands:
```powershell
# Check Vercel project status
vercel ls

# Check Railway project status
railway status

# View deployment logs
vercel logs
railway logs
```

## Security Notes
- Never commit tokens to repository
- Use GitHub secrets for all sensitive data
- Regularly rotate deployment tokens
- Monitor deployment logs for security issues

## Next Steps
After successful setup:
1. Test full deployment pipeline
2. Configure custom domains (optional)
3. Set up monitoring and alerts
4. Document deployment procedures for team

---

**Estimated Setup Time: 15-20 minutes**
**No desktop applications required - everything works through web interfaces and CLI tools!** 
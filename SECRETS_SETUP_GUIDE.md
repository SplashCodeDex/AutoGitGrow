# 🔐 Secrets Setup Guide

This comprehensive guide will help you set up all required secrets and environment variables for AutoGitGrow's CI/CD pipeline and deployment platforms.

## 📋 Quick Setup Checklist

### ✅ Required for Basic Functionality
- [ ] GitHub Personal Access Token (`PAT_TOKEN`)
- [ ] GitHub Username (`BOT_USER`)

### ✅ Required for CI/CD Pipeline
- [ ] Docker Hub Username (`DOCKER_HUB_USERNAME`)
- [ ] Docker Hub Access Token (`DOCKER_HUB_TOKEN`)

### ✅ Optional for Enhanced Features
- [ ] Google Gemini API Key (`GEMINI_API_KEY`)
- [ ] Platform-specific deployment tokens

## 🛠️ Step-by-Step Setup

### 1. 🐙 GitHub Personal Access Token (PAT_TOKEN)

**Purpose**: Allows AutoGitGrow to perform GitHub actions (follow, unfollow, star, etc.)

**Steps:**
1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Set expiration (recommended: 90 days or 1 year)
4. Select the following scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `user` (Update user data)
   - ✅ `user:follow` (Follow and unfollow users)
   - ✅ `read:org` (Read org and team membership)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)

**Example token format**: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. 👤 GitHub Username (BOT_USER)

**Purpose**: Your GitHub username for the bot to identify your account

**Value**: Your exact GitHub username (case-sensitive)

**Example**: `SplashCodeDex`


### 3. 🐳 Docker Hub Credentials

**Purpose**: Required for CI/CD pipeline to push Docker images

**Steps:**
1. Go to [Docker Hub](https://hub.docker.com/)
2. Sign up or log in to your account
3. Go to **Account Settings → Security**
4. Click **"New Access Token"**
5. Name it `AutoGitGrow-CI` and set permissions to **Read, Write, Delete**
6. Copy the access token

**Values needed:**
- `DOCKER_HUB_USERNAME`: Your Docker Hub username
- `DOCKER_HUB_TOKEN`: The access token you just created

### 4. 🤖 Google Gemini API Key (Optional)

**Purpose**: Enables AI-powered insights in your dashboard

**Steps:**
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Create a new API key
5. Copy the key

**Example format**: `AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 🚀 Platform-Specific Deployment Secrets

### 🎨 Render.com

**Purpose**: Enables automated deployment to Render

**Steps:**
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Go to **Account Settings → API Keys**
3. Generate a new API key
4. After creating your service, get the Service ID from the service URL

**Values needed:**
- `RENDER_API_KEY`: Your Render API key
- `RENDER_SERVICE_ID`: Your service ID (from service URL)

### 🚄 Railway.app

**Purpose**: Enables automated deployment to Railway

**Steps:**
1. Install Railway CLI: `npm install -g @railway/cli`
2. Run `railway login` and authenticate
3. Run `railway whoami` to get your token
4. Or get it from [Railway Settings](https://railway.app/account/tokens)

**Value needed:**
- `RAILWAY_TOKEN`: Your Railway authentication token

### 🌊 DigitalOcean App Platform

**Purpose**: Enables automated deployment to DigitalOcean

**Steps:**
1. Go to [DigitalOcean API](https://cloud.digitalocean.com/account/api/tokens)
2. Click **"Generate New Token"**
3. Name it `AutoGitGrow-Deploy` and set it to **Read and Write**
4. Copy the token

**Value needed:**
- `DIGITALOCEAN_ACCESS_TOKEN`: Your DigitalOcean API token

## 📝 Adding Secrets to GitHub

### Repository Secrets (Required)

1. Go to your repository on GitHub
2. Click **Settings → Secrets and variables → Actions**
3. Click **"New repository secret"** for each secret:

**Required secrets:**
```bash
PAT_TOKEN=ghp_your_github_token_here
DOCKER_HUB_USERNAME=your-dockerhub-username
DOCKER_HUB_TOKEN=dckr_pat_your_dockerhub_token
```

**Optional secrets (for enhanced features):**
```bash
GEMINI_API_KEY=AIzaSy_your_gemini_api_key
RENDER_API_KEY=rnd_your_render_api_key
RAILWAY_TOKEN=your_railway_token
DIGITALOCEAN_ACCESS_TOKEN=dop_v1_your_do_token
```

### Repository Variables (Required)

Click **"Variables"** tab and add:

```bash
BOT_USER=YourGitHubUsername
```

## 🏠 Local Development Environment

Create a `.env` file in your project root:

```bash
# Copy from .env.example and fill in your values
cp .env.example .env
```

**Edit `.env` with your values:**
```bash
# Database Credentials (for local development)
DB_NAME=autogitgrow_db
DB_USER=CodeDeX
DB_PASSWORD=passwordisroot

# GitHub Configuration
PAT_TOKEN=ghp_your_github_token_here
BOT_USER=YourGitHubUsername

# Optional: AI Insights
GEMINI_API_KEY=AIzaSy_your_gemini_api_key

# Frontend Configuration
VITE_API_URL=http://localhost:8000

# Script Configuration
FOLLOWERS_PER_RUN=150
```

## 🧪 Testing Your Setup

### 1. Test GitHub Token
```bash
curl -H "Authorization: token YOUR_PAT_TOKEN" https://api.github.com/user
```

### 2. Test Docker Hub Access
```bash
echo YOUR_DOCKER_HUB_TOKEN | docker login -u YOUR_USERNAME --password-stdin
```

### 3. Test Local Environment
```bash
docker compose up --build
# Visit http://localhost:80 and http://localhost:8000/api/stats
```

### 4. Test CI/CD Pipeline
```bash
# Push to main branch
git add .
git commit -m "Test CI/CD pipeline"
git push origin main

# Check GitHub Actions tab for workflow results
```

## 🔒 Security Best Practices

### ✅ Do's
- ✅ Use GitHub repository secrets for sensitive data
- ✅ Set token expiration dates appropriately
- ✅ Use minimal required permissions for each token
- ✅ Regularly rotate tokens (every 90 days recommended)
- ✅ Monitor token usage in platform dashboards

### ❌ Don'ts
- ❌ Never commit secrets to your repository
- ❌ Don't share tokens in issues or pull requests
- ❌ Avoid using tokens with excessive permissions
- ❌ Don't use personal tokens for production (use service accounts when possible)

## 🆘 Troubleshooting

### GitHub Token Issues
```bash
# Test token validity
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user

# Common error: 401 Unauthorized
# Solution: Regenerate token with correct scopes
```

### Docker Hub Issues
```bash
# Test Docker Hub login
docker login

# Common error: Access denied
# Solution: Verify username and token are correct
```

### Environment Variable Issues
```bash
# Check if variables are loaded
docker compose config

# Common error: Variables not found
# Solution: Ensure .env file exists and is properly formatted
```

### CI/CD Pipeline Issues
1. Check GitHub Actions logs for specific errors
2. Verify all required secrets are set in repository settings
3. Ensure token permissions match requirements
4. Check platform-specific documentation for any changes

## 📞 Getting Help

If you encounter issues:

1. **Check the logs**: GitHub Actions tab shows detailed error messages
2. **Verify secrets**: Ensure all required secrets are set correctly
3. **Test locally**: Run `docker compose up --build` to test locally first
4. **Check documentation**: Platform-specific docs for any updates
5. **Create an issue**: If problems persist, create a GitHub issue with:
   - Error messages (remove any sensitive data)
   - Steps to reproduce
   - Your environment details

## 🎉 Ready to Deploy!

Once all secrets are configured:

1. **Test locally**: `docker compose up --build`
2. **Push to main**: Triggers automatic CI/CD pipeline
3. **Choose deployment**: Use `./deploy/deploy.sh [platform] production`
4. **Monitor**: Check platform dashboards for deployment status

Your AutoGitGrow application is now ready for production deployment! 🚀

---

**Next Steps:**
- [📖 Read the Deployment Guide](DEPLOYMENT_GUIDE.md)
- [📋 Use the Deployment Checklist](.github/DEPLOYMENT_CHECKLIST.md)
- [🐳 Review Docker Setup](DOCKER_PRODUCTION_SETUP.md)
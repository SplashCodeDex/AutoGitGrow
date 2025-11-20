# 🐙 GitHub Container Registry (GHCR) Setup Guide

## 🎯 **DUAL REGISTRY DEPLOYMENT SETUP**

Your AutoGitGrow CI/CD pipeline now supports **both Docker Hub AND GitHub Container Registry** for maximum redundancy and flexibility!

---

## 🔑 **REQUIRED: GitHub Personal Access Token (PAT)**

### **Step 1: Create GitHub Personal Access Token**

1. **Go to GitHub Settings**:
   - Visit: https://github.com/settings/tokens
   - Click **"Generate new token"** → **"Generate new token (classic)"**

2. **Configure Token Settings**:
   ```
   Note: AutoGitGrow GHCR Access
   Expiration: 90 days (or your preference)
   ```

3. **Select Required Scopes**:
   ```
   ✅ write:packages    - Upload packages to GitHub Packages
   ✅ read:packages     - Download packages from GitHub Packages
   ✅ delete:packages   - Delete packages from GitHub Packages (optional)
   ✅ repo             - Access repositories (if private repo)
   ```

4. **Generate and Copy Token**:
   - Click **"Generate token"**
   - **Copy the token immediately** (you won't see it again!)
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### **Step 2: Add Token to Repository Secrets**

1. **Go to Repository Settings**:
   - Navigate to: `https://github.com/SplashCodeDex/AutoGitGrow/settings/secrets/actions`

2. **Add New Secret**:
   - Click **"New repository secret"**
   - **Name**: `GHCR_TOKEN`
   - **Value**: Paste your GitHub PAT
   - Click **"Add secret"**

---

## 🚀 **DUAL REGISTRY BENEFITS**

### **✅ Maximum Redundancy**
- **Docker Hub**: Universal compatibility, global CDN
- **GitHub Container Registry**: Tight GitHub integration, free private storage

### **✅ Deployment Options**
```bash
# Deploy using Docker Hub images (universal)
docker pull yourusername/autogitgrow-backend:latest

# Deploy using GitHub Container Registry (GitHub-native)
docker pull ghcr.io/splashcodedx/autogitgrow-backend:latest
```

### **✅ Platform Flexibility**
- **Render, Railway, DigitalOcean**: Can use either registry
- **GitHub Actions**: Direct access to GHCR images
- **Enterprise environments**: Choose based on security policies

---

## 📊 **CI/CD PIPELINE FLOW**

```mermaid
graph TD
    A[Push to Main] --> B[Run Tests]
    B --> C[Build Images]
    C --> D[Push to Docker Hub]
    C --> E[Push to GHCR]
    D --> F[Deploy to Platforms]
    E --> F
```

### **Build Process**:
1. ✅ **Tests pass** → Continue to build
2. ✅ **Build Docker images** (multi-platform: AMD64 + ARM64)
3. ✅ **Push to Docker Hub** → `yourusername/autogitgrow-*:latest`
4. ✅ **Push to GHCR** → `ghcr.io/splashcodedx/autogitgrow-*:latest`
5. ✅ **Deploy to enabled platforms** using either registry

---

## 🛡️ **SECURITY BEST PRACTICES**

### **Token Management**:
- ✅ Use **minimal required permissions** (write:packages, read:packages)
- ✅ Set **reasonable expiration** (90 days recommended)
- ✅ **Rotate tokens regularly** for security
- ✅ **Never commit tokens** to code (use GitHub Secrets only)

### **Access Control**:
- ✅ **Repository secrets** are only accessible to repository collaborators
- ✅ **GHCR packages** inherit repository visibility settings
- ✅ **Audit token usage** via GitHub Settings → Applications

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues & Solutions**:

#### **Issue 1: "Bad credentials" error**
```bash
Solution: Regenerate PAT with correct scopes (write:packages)
```

#### **Issue 2: "Package not found" error**
```bash
Solution: Ensure repository name matches in image tags
```

#### **Issue 3: "Permission denied" error**
```bash
Solution: Verify GHCR_TOKEN secret is set correctly in repository
```

#### **Issue 4: "Token expired" error**
```bash
Solution: Generate new PAT and update GHCR_TOKEN secret
```

---

## 🎯 **VERIFICATION STEPS**

### **After Setting Up PAT**:

1. **Check Secrets Configuration**:
   - Repository → Settings → Secrets → Actions
   - Verify `GHCR_TOKEN` is listed

2. **Trigger Pipeline**:
   ```bash
   git push origin main
   ```

3. **Monitor Build Process**:
   - GitHub → Actions tab
   - Watch for successful pushes to both registries

4. **Verify Package Creation**:
   - GitHub → Repository → Packages tab
   - Should see `autogitgrow-backend` and `autogitgrow-frontend` packages

---

## 📦 **PACKAGE LOCATIONS**

### **After Successful Build**:

#### **Docker Hub**:
```bash
# Backend image
docker pull yourusername/autogitgrow-backend:latest

# Frontend image  
docker pull yourusername/autogitgrow-frontend:latest
```

#### **GitHub Container Registry**:
```bash
# Backend image
docker pull ghcr.io/splashcodedx/autogitgrow-backend:latest

# Frontend image
docker pull ghcr.io/splashcodedx/autogitgrow-frontend:latest
```

---

## 🎊 **SUCCESS INDICATORS**

### **Your setup is working when**:
- ✅ **GitHub Actions** shows green checkmarks for both registry pushes
- ✅ **Repository Packages** tab shows your container images
- ✅ **Docker Hub** also shows your images
- ✅ **Deployment platforms** can pull from either registry
- ✅ **No authentication errors** in CI/CD logs

---

## 🚀 **NEXT STEPS**

1. **Add the GHCR_TOKEN secret** (Step 2 above)
2. **Push to main branch** to trigger dual registry deployment
3. **Monitor the Actions tab** for successful execution
4. **Verify packages** in both Docker Hub and GitHub Packages
5. **Deploy with confidence** using either registry!

**Your AutoGitGrow now has enterprise-grade registry redundancy!** 🏆
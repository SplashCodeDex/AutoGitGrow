#!/bin/bash

# Multi-platform deployment script for autogitgrow
# Usage: ./deploy/deploy.sh [platform] [environment]
# Platforms: render, railway, digitalocean, docker-hub, vercel, netlify, cloudflare, heroku, surge, firebase
# Environments: staging, production

set -e

PLATFORM=${1:-render}
ENVIRONMENT=${2:-production}

echo "🚀 Deploying autogitgrow to $PLATFORM ($ENVIRONMENT environment)"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Build Docker images
build_images() {
    print_status "Building Docker images..."
    
    # Build backend
    docker build -t autogitgrow-backend:latest ./backend
    
    # Build frontend
    docker build -t autogitgrow-frontend:latest .
    
    print_success "Docker images built successfully"
}

# Deploy to Render
deploy_render() {
    print_status "Deploying to Render..."
    
    if [ -z "$RENDER_API_KEY" ]; then
        print_warning "RENDER_API_KEY not set. Please deploy manually via Render dashboard"
        print_status "1. Push your code to GitHub"
        print_status "2. Connect your repository to Render"
        print_status "3. Deploy using the render.yaml configuration"
        return
    fi
    
    # Trigger deployment via API if service ID is available
    if [ ! -z "$RENDER_SERVICE_ID" ]; then
        curl -X POST "https://api.render.com/deploy/srv-$RENDER_SERVICE_ID" \
            -H "Authorization: Bearer $RENDER_API_KEY"
        print_success "Render deployment triggered"
    else
        print_warning "RENDER_SERVICE_ID not set. Please set it after creating your service"
    fi
}

# Deploy to Railway
deploy_railway() {
    print_status "Deploying to Railway..."
    
    if ! command -v railway &> /dev/null; then
        print_status "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    if [ -z "$RAILWAY_TOKEN" ]; then
        print_error "RAILWAY_TOKEN not set. Please run 'railway login' first"
        exit 1
    fi
    
    railway up
    print_success "Railway deployment completed"
}

# Deploy to DigitalOcean
deploy_digitalocean() {
    print_status "Deploying to DigitalOcean App Platform..."
    
    if ! command -v doctl &> /dev/null; then
        print_error "DigitalOcean CLI (doctl) is not installed"
        print_status "Install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
        exit 1
    fi
    
    # Create or update app
    if [ -z "$DO_APP_ID" ]; then
        print_status "Creating new DigitalOcean App..."
        doctl apps create .do/app.yaml
    else
        print_status "Updating existing DigitalOcean App..."
        doctl apps update $DO_APP_ID --spec .do/app.yaml
    fi
    
    print_success "DigitalOcean deployment completed"
}

# Deploy to Docker Hub
deploy_docker_hub() {
    print_status "Pushing to Docker Hub..."
    
    if [ -z "$DOCKER_HUB_USERNAME" ] || [ -z "$DOCKER_HUB_TOKEN" ]; then
        print_error "DOCKER_HUB_USERNAME and DOCKER_HUB_TOKEN must be set"
        exit 1
    fi
    
    # Login to Docker Hub
    echo $DOCKER_HUB_TOKEN | docker login -u $DOCKER_HUB_USERNAME --password-stdin
    
    # Tag and push images
    docker tag autogitgrow-backend:latest $DOCKER_HUB_USERNAME/autogitgrow-backend:latest
    docker tag autogitgrow-frontend:latest $DOCKER_HUB_USERNAME/autogitgrow-frontend:latest
    
    docker push $DOCKER_HUB_USERNAME/autogitgrow-backend:latest
    docker push $DOCKER_HUB_USERNAME/autogitgrow-frontend:latest
    
    print_success "Images pushed to Docker Hub"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    if [ -z "$VERCEL_TOKEN" ]; then
        print_error "VERCEL_TOKEN not set. Please run 'vercel login' first or set the token"
        exit 1
    fi
    
    vercel --prod --token $VERCEL_TOKEN
    print_success "Vercel deployment completed"
}

# Deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        print_status "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    if [ -z "$NETLIFY_AUTH_TOKEN" ]; then
        print_error "NETLIFY_AUTH_TOKEN not set. Please run 'netlify login' first"
        exit 1
    fi
    
    npm run build
    netlify deploy --prod --dir=dist --auth $NETLIFY_AUTH_TOKEN
    print_success "Netlify deployment completed"
}

# Deploy to Cloudflare Pages
deploy_cloudflare() {
    print_status "Deploying to Cloudflare Pages..."
    
    if ! command -v wrangler &> /dev/null; then
        print_status "Installing Wrangler CLI..."
        npm install -g wrangler
    fi
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        print_error "CLOUDFLARE_API_TOKEN not set. Please run 'wrangler login' first"
        exit 1
    fi
    
    npm run build
    wrangler pages publish dist --project-name autogitgrow
    print_success "Cloudflare Pages deployment completed"
}

# Deploy to Heroku
deploy_heroku() {
    print_status "Deploying to Heroku..."
    
    if ! command -v heroku &> /dev/null; then
        print_error "Heroku CLI is not installed"
        print_status "Install it from: https://devcenter.heroku.com/articles/heroku-cli"
        exit 1
    fi
    
    if [ -z "$HEROKU_API_KEY" ]; then
        print_error "HEROKU_API_KEY not set. Please run 'heroku login' first"
        exit 1
    fi
    
    # Check if Heroku app exists
    if [ -z "$HEROKU_APP_NAME" ]; then
        print_status "Creating new Heroku app..."
        heroku create autogitgrow-$(date +%s)
    else
        print_status "Deploying to existing app: $HEROKU_APP_NAME"
    fi
    
    # Add PostgreSQL addon
    heroku addons:create heroku-postgresql:mini || true
    
    # Deploy
    git push heroku main
    print_success "Heroku deployment completed"
}

# Deploy to Surge.sh
deploy_surge() {
    print_status "Deploying to Surge.sh..."
    
    if ! command -v surge &> /dev/null; then
        print_status "Installing Surge CLI..."
        npm install -g surge
    fi
    
    npm run build
    
    if [ -z "$SURGE_LOGIN" ] || [ -z "$SURGE_TOKEN" ]; then
        print_warning "SURGE_LOGIN and SURGE_TOKEN not set. You may need to login manually"
        surge dist
    else
        echo "$SURGE_LOGIN" | surge dist --domain autogitgrow.surge.sh
    fi
    
    print_success "Surge deployment completed"
}

# Deploy to Firebase
deploy_firebase() {
    print_status "Deploying to Firebase..."
    
    if ! command -v firebase &> /dev/null; then
        print_status "Installing Firebase CLI..."
        npm install -g firebase-tools
    fi
    
    if [ -z "$FIREBASE_TOKEN" ]; then
        print_error "FIREBASE_TOKEN not set. Please run 'firebase login' first"
        exit 1
    fi
    
    npm run build
    firebase deploy --token $FIREBASE_TOKEN
    print_success "Firebase deployment completed"
}

# Pre-deployment checks
pre_deploy_checks() {
    print_status "Running pre-deployment checks..."
    
    # Check if .env file exists for local testing
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
    fi
    
    # Run tests if they exist
    if [ -d "tests" ]; then
        print_status "Running tests..."
        docker compose -f docker-compose.test.yml up --build --abort-on-container-exit
        docker compose -f docker-compose.test.yml down
    fi
    
    print_success "Pre-deployment checks completed"
}

# Main deployment logic
main() {
    print_status "Starting deployment process..."
    
    check_dependencies
    pre_deploy_checks
    build_images
    
    case $PLATFORM in
        render)
            deploy_render
            ;;
        railway)
            deploy_railway
            ;;
        digitalocean|do)
            deploy_digitalocean
            ;;
        docker-hub|dockerhub)
            deploy_docker_hub
            ;;
        vercel)
            deploy_vercel
            ;;
        netlify)
            deploy_netlify
            ;;
        cloudflare|cf)
            deploy_cloudflare
            ;;
        heroku)
            deploy_heroku
            ;;
        surge)
            deploy_surge
            ;;
        firebase)
            deploy_firebase
            ;;
        *)
            print_error "Unknown platform: $PLATFORM"
            print_status "Supported platforms: render, railway, digitalocean, docker-hub, vercel, netlify, cloudflare, heroku, surge, firebase"
            exit 1
            ;;
    esac
    
    print_success "🎉 Deployment to $PLATFORM completed successfully!"
    
    # Platform-specific post-deployment info
    case $PLATFORM in
        render)
            print_status "Your app will be available at: https://your-app-name.onrender.com"
            ;;
        railway)
            print_status "Check your Railway dashboard for the deployment URL"
            ;;
        digitalocean)
            print_status "Check your DigitalOcean Apps dashboard for the deployment URL"
            ;;
        docker-hub)
            print_status "Images are now available on Docker Hub"
            print_status "Deploy using: docker run -p 8000:8000 $DOCKER_HUB_USERNAME/autogitgrow-backend:latest"
            ;;
        vercel)
            print_status "Your app will be available at: https://autogitgrow.vercel.app"
            ;;
        netlify)
            print_status "Your app will be available at: https://autogitgrow.netlify.app"
            ;;
        cloudflare)
            print_status "Your app will be available at: https://autogitgrow.pages.dev"
            ;;
        heroku)
            print_status "Check your Heroku dashboard for the deployment URL"
            ;;
        surge)
            print_status "Your app will be available at: https://autogitgrow.surge.sh"
            ;;
        firebase)
            print_status "Check your Firebase console for the deployment URL"
            ;;
    esac
}

# Run main function
main
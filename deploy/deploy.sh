#!/bin/bash

# Multi-platform deployment script for autogitgrow
# Usage: ./deploy/deploy.sh [platform] [environment]
# Platforms: render, railway, digitalocean, docker-hub
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
        *)
            print_error "Unknown platform: $PLATFORM"
            print_status "Supported platforms: render, railway, digitalocean, docker-hub"
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
    esac
}

# Run main function
main
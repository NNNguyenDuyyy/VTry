#!/bin/bash

# VTRY Backend Deployment Script
# Usage: ./deploy.sh [dev|prod|stop|logs|status]

set -e

# Colors for output
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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f env.example ]; then
            cp env.example .env
            print_warning "Please edit .env file with your configuration before deploying."
            print_warning "Make sure to set MONGO_URI to your external MongoDB instance."
            exit 1
        else
            print_error "env.example not found. Please create .env file manually."
            exit 1
        fi
    fi
}

# Function to create necessary directories
create_directories() {
    mkdir -p upload/images logs nginx/ssl
    print_status "Created necessary directories"
}

# Function to deploy development environment
deploy_dev() {
    print_status "Deploying development environment..."
    check_docker
    check_env
    create_directories
    
    docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d --build
    
    print_success "Development environment deployed successfully!"
    print_status "Services available at:"
    print_status "  - Backend API: http://localhost:4000"
    print_status "  - MongoDB: External instance (check MONGO_URI in .env)"
}

# Function to deploy production environment
deploy_prod() {
    print_status "Deploying production environment..."
    check_docker
    check_env
    create_directories
    
    docker-compose -f docker-compose.prod.yml up -d --build
    
    print_success "Production environment deployed successfully!"
    print_status "Services available at:"
    print_status "  - Backend API: http://localhost:4000 (localhost only)"
    print_status "  - Nginx: http://localhost:80, https://localhost:443"
    print_status "  - MongoDB: External instance (check MONGO_URI in .env)"
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    
    # Stop development services
    if [ -f docker-compose.yml ]; then
        docker-compose down 2>/dev/null || true
    fi
    
    # Stop production services
    if [ -f docker-compose.prod.yml ]; then
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    fi
    
    print_success "All services stopped"
}

# Function to show logs
show_logs() {
    local service=${2:-""}
    
    if [ -f docker-compose.yml ]; then
        if [ -n "$service" ]; then
            docker-compose logs -f "$service"
        else
            docker-compose logs -f
        fi
    else
        print_error "No docker-compose.yml found"
        exit 1
    fi
}

# Function to show status
show_status() {
    print_status "Checking service status..."
    
    if [ -f docker-compose.yml ]; then
        docker-compose ps
    fi
    
    if [ -f docker-compose.prod.yml ]; then
        echo ""
        print_status "Production services:"
        docker-compose -f docker-compose.prod.yml ps
    fi
}

# Function to show help
show_help() {
    echo "VTRY Backend Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev     Deploy development environment"
    echo "  prod    Deploy production environment"
    echo "  stop    Stop all services"
    echo "  logs    Show logs (use: $0 logs [service])"
    echo "  status  Show service status"
    echo "  help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev              # Deploy development"
    echo "  $0 prod             # Deploy production"
    echo "  $0 stop             # Stop all services"
    echo "  $0 logs             # Show all logs"
    echo "  $0 logs backend     # Show backend logs"
    echo "  $0 status           # Show service status"
    echo ""
    echo "Note: This setup requires an external MongoDB instance."
    echo "Make sure to configure MONGO_URI in your .env file."
}

# Main script logic
case "${1:-help}" in
    dev)
        deploy_dev
        ;;
    prod)
        deploy_prod
        ;;
    stop)
        stop_services
        ;;
    logs)
        show_logs "$@"
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 
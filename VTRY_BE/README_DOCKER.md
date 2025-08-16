# VTRY Backend - Docker Deployment

This document provides a complete overview of the Docker setup for the VTRY backend application as a standalone service.

## 🚀 Quick Start

### 1. Setup Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env with your actual values
nano .env
```

### 2. Deploy with Script
```bash
# Make script executable
chmod +x deploy.sh

# Deploy development environment
./deploy.sh dev

# Deploy production environment
./deploy.sh prod

# Stop all services
./deploy.sh stop
```

### 3. Manual Deployment
```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 📁 File Structure

```
VTRY_BE/
├── Dockerfile                    # Backend container definition
├── docker-compose.yml            # Base compose file (backend only)
├── docker-compose.override.yml   # Development overrides
├── docker-compose.prod.yml       # Production configuration
├── .dockerignore                 # Docker build exclusions
├── env.example                   # Environment template
├── deploy.sh                     # Deployment script
├── DEPLOYMENT.md                 # Detailed deployment guide
└── README_DOCKER.md              # This file
```

## 🐳 Docker Services

### Backend API
- **Image**: Custom Node.js 18 Alpine
- **Port**: 4000
- **Health Check**: `/health` endpoint
- **Features**: Hot-reload (dev), optimized (prod)
- **Database**: External MongoDB instance

### Nginx (Production Only)
- **Image**: nginx:alpine
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Purpose**: Reverse proxy, SSL termination

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | External MongoDB connection string | ✅ |
| `JWT_SECRET` | JWT signing secret | ✅ |
| `PAYOS_CLIENT_ID` | PayOS client ID | ✅ |
| `PAYOS_API_KEY` | PayOS API key | ✅ |
| `PAYOS_CHECKSUM_KEY` | PayOS checksum key | ✅ |
| `FRONTEND_URL` | Frontend application URL | ✅ |
| `BACKEND_URL` | Backend API URL | ✅ |

### Ports
- **Backend**: 4000
- **Nginx**: 80, 443

## 🚀 Deployment Options

### Development Environment
- Hot-reload enabled
- Debug port 9229 exposed
- Source code mounted as volume
- Connects to external MongoDB

### Production Environment
- Optimized Node.js build
- Nginx reverse proxy
- Resource limits configured
- Health checks enabled

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Backend**: `GET /health`

### Health Check Commands
```bash
# Check service status
./deploy.sh status

# View logs
./deploy.sh logs

# View specific service logs
./deploy.sh logs backend
```

## 🔒 Security Features

### Production Security
- Backend API behind Nginx proxy
- Environment variable validation
- Resource limits and reservations
- Health check monitoring

### Network Isolation
- Internal Docker networks
- External MongoDB connection
- External access through reverse proxy

## 📈 Scaling & Performance

### Resource Management
- Memory limits configured
- CPU reservations available
- Health check intervals optimized
- Container restart policies

### Horizontal Scaling
```bash
# Scale backend service
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

## 🛠️ Maintenance

### Container Management
```bash
# Rebuild services
docker-compose up -d --build

# View resource usage
docker stats

# Clean up unused resources
docker system prune
```

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts**: Check if port 4000 is available
2. **Permission errors**: Ensure upload and logs directories exist
3. **MongoDB connection**: Verify MONGO_URI and network connectivity
4. **Health check failures**: Check if `/health` endpoint is accessible

### Debug Commands
```bash
# Check container logs
docker-compose logs -f

# Execute commands in container
docker-compose exec backend sh

# Test MongoDB connection
docker-compose exec backend node -e "console.log(process.env.MONGO_URI)"
```

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Connection String Guide](https://docs.mongodb.com/manual/reference/connection-string/)

## 🤝 Support

For issues and questions:
1. Check the logs: `./deploy.sh logs`
2. Verify environment configuration
3. Ensure external MongoDB is accessible
4. Check service status: `./deploy.sh status` 
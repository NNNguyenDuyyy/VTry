# Backend Deployment Guide

This guide explains how to deploy the VTRY backend using Docker Compose as a standalone service.

## Prerequisites

- Docker and Docker Compose installed
- External MongoDB instance accessible
- Git (for cloning the repository)
- Basic knowledge of Docker commands

## Quick Start

### 1. Environment Setup

Copy the environment template and configure your variables:

```bash
cp env.example .env
```

Edit `.env` file with your actual values:

```bash
# Required: MongoDB Connection (External MongoDB instance)
MONGO_URI=mongodb://username:password@your-mongodb-host:27017/your-database-name?authSource=admin

# Required: JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Required: PayOS Configuration
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# Required: Application URLs
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

### 2. Development Deployment

For development with hot-reload and debugging:

```bash
# Start backend service
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### 3. Production Deployment

For production deployment:

```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## Service Details

### Backend API
- **Port**: 4000
- **Health Check**: `/health` endpoint
- **Environment**: Production/Development configurable
- **Volumes**: Upload directory and logs
- **Database**: External MongoDB instance

### Nginx (Production Only)
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Purpose**: Reverse proxy and SSL termination
- **Configuration**: Custom nginx.conf required

## File Structure

```
VTRY_BE/
├── Dockerfile                 # Backend container definition
├── docker-compose.yml         # Base compose file (backend only)
├── docker-compose.override.yml # Development overrides
├── docker-compose.prod.yml    # Production configuration
├── .dockerignore             # Docker build exclusions
├── env.example               # Environment template
├── DEPLOYMENT.md             # This file
└── nginx/                    # Nginx configuration (optional)
    ├── nginx.conf
    └── ssl/
```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | production |
| `PORT` | Backend port | No | 4000 |
| `MONGO_URI` | External MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `PAYOS_CLIENT_ID` | PayOS client ID | Yes | - |
| `PAYOS_API_KEY` | PayOS API key | Yes | - |
| `PAYOS_CHECKSUM_KEY` | PayOS checksum key | Yes | - |
| `FRONTEND_URL` | Frontend application URL | Yes | - |
| `BACKEND_URL` | Backend API URL | Yes | - |

## Commands Reference

### Development
```bash
# Start services
docker-compose up -d

# Rebuild and start
docker-compose up -d --build

# View logs
docker-compose logs -f backend

# Execute commands in container
docker-compose exec backend sh

# Stop services
docker-compose down
```

### Production
```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Rebuild and start
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## MongoDB Connection

### External MongoDB Setup
The backend expects an external MongoDB instance. You can use:

1. **MongoDB Atlas** (Cloud hosted)
2. **Self-hosted MongoDB** on a separate server
3. **MongoDB on another Docker host**

### Connection String Format
```
mongodb://username:password@host:port/database?authSource=admin
```

### Example MongoDB Atlas Connection
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/vtry_db?retryWrites=true&w=majority
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :4000
   
   # Kill the process or change port in docker-compose.yml
   ```

2. **MongoDB connection failed**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Verify environment variables
   docker-compose exec backend env | grep MONGO
   
   # Test MongoDB connection from host
   mongosh "your-mongodb-connection-string"
   ```

3. **Permission denied on upload directory**
   ```bash
   # Fix permissions
   sudo chown -R $USER:$USER ./upload
   chmod -R 755 ./upload
   ```

### Health Checks

- **Backend**: `http://localhost:4000/health`

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

## Security Considerations

### Production Security
1. **Use strong JWT secrets**
2. **Secure MongoDB connection** with proper authentication
3. **Enable SSL/TLS** with proper certificates
4. **Use secrets management** for sensitive data
5. **Regular security updates** for base images

### Network Security
- Backend API only accessible through Nginx in production
- Use internal Docker networks for inter-service communication
- Ensure MongoDB is accessible from the backend container

## Scaling

### Horizontal Scaling
```bash
# Scale backend service
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Load Balancing
- Use Nginx as load balancer
- Configure multiple backend instances
- Use Docker Swarm or Kubernetes for advanced orchestration

## Monitoring

### Health Monitoring
- Built-in health checks for backend service
- Monitor container status: `docker-compose ps`
- Check resource usage: `docker stats`

### Log Aggregation
- Centralized logging with ELK stack
- Log rotation and retention policies
- Error tracking and alerting

## Support

For issues and questions:
1. Check the logs first
2. Verify environment configuration
3. Ensure external MongoDB is accessible
4. Check Docker and Docker Compose versions 
# Docker Deployment Guide

## Overview
This guide explains how to deploy the SUT Alumni Connect application using Docker Compose with the following components:
- **Frontend**: Next.js (React)
- **Backend**: Node.js API (accessible via Next.js routes)
- **Database**: PostgreSQL
- **Reverse Proxy**: Nginx with automatic SSL (Let's Encrypt)

## Prerequisites

- Docker & Docker Compose installed
- Domain configured to point to your server (e.g., sut-alumniconnect.me)
- Valid email for Let's Encrypt SSL certificates

## Environment Variables

Before deploying, update the `.env` file with production values:

```bash
# Database (use internal docker DNS)
DATABASE_URL="postgresql://postgres:postgres@db:5432/mydb?schema=public"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-key-here"

# Gmail SMTP
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-specific-password

# API URLs (internal communication)
NEXT_PUBLIC_API_URL=http://api:8000
API_URL=http://api:8000
```

## Deployment Steps

### 1. Local Testing
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Deploy to Azure VM

#### Setup VM
```bash
# SSH into your Azure VM
ssh azureuser@your-vm-ip

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Deploy Application
```bash
# Clone repository
git clone https://github.com/your-repo/team02.git
cd team02

# Copy environment file
cp .env.example .env
# Edit .env with production values
nano .env

# Start services
docker-compose up -d

# Watch logs
docker-compose logs -f
```

### 3. Database Migrations (First Time Only)
```bash
# Run Prisma migrations inside the api container
docker-compose exec api npx prisma migrate deploy

# Seed data (optional)
docker-compose exec api npx prisma db seed
```

## Service Architecture

```
┌─────────────────────────────────────────────────┐
│         Nginx Reverse Proxy (Port 80/443)      │
│     with Let's Encrypt SSL & Auto-Renewal      │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼──────┐      ┌─────▼────┐
    │  Frontend │      │ Backend   │
    │  (web)    │      │ (api)     │
    │ Port 80   │      │ Port 8000 │
    │ Next.js   │      │ Node.js   │
    └────┬──────┘      └─────┬────┘
         │                   │
         └───────────┬───────┘
                     │
                ┌────▼──────┐
                │ PostgreSQL │
                │ Port 5432  │
                └───────────┘
```

## Monitoring & Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f db
docker-compose logs -f nginx-proxy
```

### Health Checks
```bash
# Check service status
docker-compose ps

# Test API connectivity (from web container)
docker-compose exec web curl http://api:8000/health

# Connect to database
docker-compose exec db psql -U postgres -d mydb
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart api

# Recreate container (pulls latest image)
docker-compose up -d --force-recreate api
```

### Database Backups
```bash
# Backup database
docker-compose exec db pg_dump -U postgres mydb > backup.sql

# Restore from backup
docker-compose exec -T db psql -U postgres mydb < backup.sql
```

## SSL Certificate Management

The `nginx-proxy-letsencrypt` service automatically:
- Generates SSL certificates on first run
- Renews certificates automatically before expiration
- Stores certificates in the `certs` volume

Certificates are valid for 90 days and renewed automatically.

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Remove and rebuild
docker-compose down -v
docker-compose up -d --build
```

### Database connection error
```bash
# Verify database is healthy
docker-compose ps

# Check database logs
docker-compose logs db

# Reconnect services
docker-compose restart api web
```

### SSL certificate issues
```bash
# Check nginx logs
docker-compose logs nginx-proxy

# Remove old certificates and regenerate
docker volume rm team02_certs
docker-compose restart nginx-proxy nginx-proxy-letsencrypt
```

### Port already in use
```bash
# Find process using port
lsof -i :80  # or :443, :5432, etc.

# Kill process or change docker-compose port mapping
```

## Production Best Practices

1. **Environment Variables**: Never commit `.env` to git
2. **Database**: Configure automated backups
3. **Monitoring**: Set up error tracking (Sentry, etc.)
4. **Logging**: Implement centralized logging solution
5. **Security**: 
   - Keep images updated
   - Use strong passwords
   - Enable firewall rules
   - Use SSH keys only (no passwords)
6. **Performance**:
   - Configure resource limits in docker-compose
   - Set up CDN for static assets
   - Implement caching strategies

## Resource Limits (Optional)

Add to docker-compose.yml for production:
```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## Useful Commands

```bash
# View real-time resource usage
docker stats

# Execute command in container
docker-compose exec api npm run build

# Remove all containers and volumes
docker-compose down -v

# View environment variables
docker-compose config

# Scale services (for load balancing)
docker-compose up -d --scale api=3
```

## Support
For issues, check logs first:
```bash
docker-compose logs --tail 100 -f
```

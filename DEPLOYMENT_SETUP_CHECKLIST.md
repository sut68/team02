# Docker Deployment Setup Guide - FINAL CHECKLIST

## ✅ Files Created

### Core Docker Files
- ✅ `Dockerfile.api` - Backend API image
- ✅ `Dockerfile.web` - Frontend image
- ✅ `docker-compose.yml` - Development/local setup
- ✅ `docker-compose.prod.yml` - Production setup with resource limits
- ✅ `.dockerignore` - Reduce image size
- ✅ `config/client_max_body_size.conf` - Nginx configuration

### Environment & Configuration
- ✅ `.env.example` - Template for environment variables
- ✅ `.env` - Production secrets (don't commit!)

### Documentation
- ✅ `DOCKER_DEPLOYMENT.md` - Complete guide
- ✅ `QUICKSTART.md` - Quick reference
- ✅ `DEPLOYMENT_SETUP_CHECKLIST.md` - This file

### Automation Scripts
- ✅ `deploy.sh` - Linux/Mac deployment menu
- ✅ `deploy.bat` - Windows deployment menu
- ✅ `scripts/azure-deploy.sh` - Full Azure VM setup
- ✅ `scripts/health-check.sh` - Service health monitoring
- ✅ `scripts/backup.sh` - Database backup/restore
- ✅ `scripts/monitor.sh` - Continuous service monitoring

### CI/CD (GitHub Actions)
- ✅ `.github/workflows/deploy.yml` - Auto-deploy on git push
- ✅ `.github/workflows/tests.yml` - Run tests on PR

---

## 🚀 Deployment Checklist

### 1️⃣ Local Testing (Before Azure)
```bash
# Build and start
docker-compose up -d --build

# Verify services
docker-compose ps

# Check logs
docker-compose logs -f

# Run migrations
docker-compose exec api npx prisma migrate deploy

# Test API
docker-compose exec web curl http://api:8000/health
```

### 2️⃣ Update Environment Variables
```bash
# Edit .env with production values
nano .env

# Required variables:
# - DATABASE_URL
# - JWT_SECRET
# - GMAIL_USER / GMAIL_PASS
# - NEXTAUTH_SECRET
# - NEXTAUTH_URL (for production)
```

### 3️⃣ Deploy to Azure VM
```bash
# SSH into Azure VM as root/sudoer
ssh azureuser@your-vm-ip

# Run setup (as root)
sudo bash scripts/azure-deploy.sh

# Update .env
sudo nano /opt/alumni-connect/.env

# Start service
sudo systemctl start alumni-connect

# Check status
sudo systemctl status alumni-connect
docker-compose ps
```

### 4️⃣ Verify Deployment
```bash
# Health check
bash scripts/health-check.sh

# Check specific service logs
docker logs api
docker logs web
docker logs next-db

# Test endpoints
curl https://www.sut-alumniconnect.me
curl https://api.sut-alumniconnect.me
```

---

## 📋 Pre-Deployment Checklist

Before deploying to Azure, ensure:

- [ ] `.env` file has all required variables
- [ ] Domain (sut-alumniconnect.me) points to Azure VM IP
- [ ] Firewall allows ports 80, 443, 5432
- [ ] SSH key configured for Azure VM
- [ ] Email for Let's Encrypt SSL cert is valid
- [ ] Database backup created (if upgrading)
- [ ] Tested locally with `docker-compose up`

---

## 🔐 Security Checklist

- [ ] `.env` is in `.gitignore` (never commit secrets!)
- [ ] JWT_SECRET is long and random (use: `openssl rand -hex 32`)
- [ ] Database password is strong
- [ ] SSH key-only access (no passwords) to Azure VM
- [ ] Firewall restricts database port (5432) to internal network
- [ ] HTTPS enforced (nginx-proxy-letsencrypt handles this)
- [ ] Regular backups scheduled (scripts/backup.sh runs daily at 2 AM)

---

## 📊 Monitoring Setup

### Health Checks (Automated)
```bash
# Manual health check
bash scripts/health-check.sh

# Continuous monitoring (runs every 60 seconds)
bash scripts/monitor.sh

# Check in systemd
journalctl -u alumni-connect -f
```

### Database Backups
```bash
# Manual backup
bash scripts/backup.sh backup

# Restore from backup
bash scripts/backup.sh restore .backups/db_backup_20240101_120000.sql.gz

# List backups
bash scripts/backup.sh list

# Automatic daily backups at 2 AM (set by azure-deploy.sh)
crontab -l
```

---

## 🔄 CI/CD with GitHub Actions

### Setup

1. Add GitHub Secrets (Repository Settings → Secrets):
   ```
   AZURE_VM_IP: your-azure-vm-public-ip
   AZURE_VM_USER: azureuser
   AZURE_VM_SSH_KEY: (private key content)
   ```

2. On git push to `main`:
   - Runs tests
   - Builds Docker images
   - Pushes to GitHub Container Registry
   - Deploys to Azure VM
   - Runs health check

### Usage
```bash
# Auto-deploy on push
git push origin main

# View actions
https://github.com/YOUR_USERNAME/team02/actions
```

---

## 🛠️ Useful Commands

### Service Management
```bash
# Start/stop services
docker-compose up -d
docker-compose down

# Restart specific service
docker-compose restart api

# View logs
docker-compose logs -f [service]

# Check resource usage
docker stats
```

### Database
```bash
# Connect to database
docker-compose exec db psql -U postgres -d mydb

# Backup
docker-compose exec -T db pg_dump -U postgres mydb > backup.sql

# Run migrations
docker-compose exec api npx prisma migrate deploy
```

### Container Cleanup
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Full cleanup (caution: removes volumes!)
docker-compose down -v
```

---

## 📞 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Check resource limits
docker stats

# Rebuild
docker-compose down -v
docker-compose up -d --build
```

### Database connection error
```bash
# Verify database is healthy
docker-compose exec db pg_isready -U postgres

# Check logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### SSL certificate issues
```bash
# Check cert renewal logs
docker logs nginx-proxy-letsencrypt

# Force renewal
docker-compose restart nginx-proxy-letsencrypt
```

### Out of disk space
```bash
# Clean Docker
docker system prune -a

# Check backup directory
du -sh /backups/alumni-connect

# Remove old backups manually
rm /backups/alumni-connect/db_backup_*.sql.gz
```

---

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Database Migrations](https://www.prisma.io/docs/orm/prisma-migrate)
- [Nginx Proxy Auto Configuration](https://github.com/nginx-proxy/nginx-proxy)
- [Let's Encrypt Auto Renewal](https://github.com/nginx-proxy/acme-companion)

---

## 🎯 Next Steps

1. **Local Testing**: Run `docker-compose up -d` and verify everything works
2. **Azure Setup**: Run `sudo bash scripts/azure-deploy.sh` on VM
3. **Configure Secrets**: Add GitHub Actions secrets for CI/CD
4. **Monitor**: Set up health checks and backups
5. **Deploy**: Push to `main` branch to trigger deployment

---

**Status**: ✅ All files created and ready for deployment!

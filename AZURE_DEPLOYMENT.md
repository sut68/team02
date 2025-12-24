# Azure VM Deployment Step-by-Step Guide

## 📋 Prerequisites

Before deploying, you'll need:
- Azure VM instance (Linux - Ubuntu 22.04 or later)
- SSH access to the VM
- Domain pointing to VM IP (sut-alumniconnect.me)
- Public IP address of Azure VM

---

## 1️⃣ Get Your Azure VM Details

### Find Your VM Information:
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Virtual Machines** → Select your VM
3. Copy these values:
   - **Public IP**: Found under "Networking" → "Public IP address"
   - **Username**: Typically `azureuser` (depends on your setup)
   - **Private Key**: Your SSH key file (usually `id_rsa` or `.pem`)

### Example:
```
AZURE_VM_IP: 203.119.xxx.xxx        (Your VM's public IP)
AZURE_VM_USER: azureuser            (SSH username)
AZURE_VM_SSH_KEY: /path/to/id_rsa   (Your private SSH key)
```

---

## 2️⃣ Configure Your Domain (DNS)

Point your domain `sut-alumniconnect.me` to your Azure VM IP:

1. Go to your **Domain Registrar** (GoDaddy, Namecheap, etc.)
2. Update **DNS A Record**:
   ```
   Type: A
   Name: (root or @)
   Value: 203.119.xxx.xxx  (your Azure VM IP)
   TTL: 3600
   ```
3. Add **Wildcard** for subdomains:
   ```
   Type: A
   Name: *.sut-alumniconnect.me
   Value: 203.119.xxx.xxx
   TTL: 3600
   ```
4. Wait 5-30 minutes for DNS propagation (use `nslookup` to verify)

### Verify DNS:
```bash
nslookup sut-alumniconnect.me
nslookup api.sut-alumniconnect.me
nslookup www.sut-alumniconnect.me
```

---

## 3️⃣ SSH into Azure VM

```bash
# Option 1: Using SSH key
ssh -i ~/.ssh/id_rsa azureuser@203.119.xxx.xxx

# Option 2: If key is in current directory
ssh -i ./my-vm-key.pem azureuser@203.119.xxx.xxx

# Option 3: Add to SSH config (~/.ssh/config)
Host azure-vm
    HostName 203.119.xxx.xxx
    User azureuser
    IdentityFile ~/.ssh/id_rsa

# Then use: ssh azure-vm
```

---

## 4️⃣ Run Azure Deployment Script

Once SSH'd into the VM:

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/team02.git
cd team02

# Give execute permission to script
chmod +x scripts/azure-deploy.sh

# Run as root (installs Docker, creates systemd service)
sudo bash scripts/azure-deploy.sh
```

### What the script does:
✅ Updates system packages  
✅ Installs Docker & Docker Compose  
✅ Clones your repository  
✅ Creates systemd service for auto-restart  
✅ Sets up daily database backups (2 AM)  
✅ Creates `/opt/alumni-connect` directory  

### Script output will ask you to:
```
1. Update .env file with production values:
   sudo nano /opt/alumni-connect/.env

2. Start the application:
   sudo systemctl start alumni-connect

3. Check status:
   docker-compose ps
```

---

## 5️⃣ Update Environment Variables

After running deployment script:

```bash
# Edit .env file
sudo nano /opt/alumni-connect/.env
```

Update these values (replace with production values):

```bash
# Database (use internal Docker DNS)
DATABASE_URL="postgresql://postgres:postgres@db:5432/mydb?schema=public"

# JWT Secret - generate random string
JWT_SECRET="$(openssl rand -hex 32)"

# Gmail SMTP configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-specific-password

# Next.js / API configuration
NEXT_PUBLIC_API_URL=http://api:8000
API_URL=http://api:8000

# NextAuth configuration (for authentication)
NEXTAUTH_URL=https://www.sut-alumniconnect.me
NEXTAUTH_SECRET="$(openssl rand -hex 32)"

# Environment
NODE_ENV=production
```

**Save file**: Press `Ctrl + X` → `Y` → `Enter`

---

## 6️⃣ Start the Application

```bash
# Start the service
sudo systemctl start alumni-connect

# Check if running
sudo systemctl status alumni-connect

# View logs in real-time
journalctl -u alumni-connect -f

# Or check Docker containers
docker-compose ps

# View specific service logs
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f db
```

---

## 7️⃣ Run Database Migrations (First Time Only)

```bash
cd /opt/alumni-connect

# Run migrations to set up database schema
docker-compose exec api npx prisma migrate deploy

# Optional: Seed initial data
docker-compose exec api npx prisma db seed
```

---

## 8️⃣ Verify Everything is Working

### Check services are running:
```bash
docker-compose ps
```

Expected output:
```
NAME                COMMAND                  SERVICE    STATUS
api                 "npm start"             api        Up (healthy)
next-db            "postgres"              db         Up (healthy)
nginx-proxy        "/app/docker-entrypo..."  nginx     Up
nginx-proxy-letsencrypt  "/bin/bash /app..." nginx-le  Up
web                "npm start"             web        Up
```

### Test API connectivity:
```bash
# Inside web container
docker-compose exec web curl http://api:8000

# From VM terminal
curl http://localhost
```

### Check SSL certificate (wait 5-10 minutes for Let's Encrypt):
```bash
curl https://www.sut-alumniconnect.me
curl https://api.sut-alumniconnect.me
```

### View application logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
```

---

## 🔄 Useful Commands

### Service Management
```bash
# Restart all services
sudo systemctl restart alumni-connect

# Stop services
sudo systemctl stop alumni-connect

# View service logs
journalctl -u alumni-connect -f

# Check service status
systemctl status alumni-connect
```

### Docker Commands
```bash
# View running containers
docker-compose ps

# Stop containers
docker-compose down

# View logs
docker-compose logs -f [service]

# Execute command in container
docker-compose exec api bash

# Check resource usage
docker stats
```

### Database Backup
```bash
# Manual backup
cd /opt/alumni-connect && bash scripts/backup.sh backup

# View backups
ls -lh /backups/alumni-connect/

# Restore from backup
bash scripts/backup.sh restore /backups/alumni-connect/db_backup_20240101_020000.sql.gz
```

### View Daily Backup Cron
```bash
crontab -l
# Should show: 0 2 * * * cd /opt/alumni-connect && ./backup.sh
```

---

## 🆘 Troubleshooting

### Services won't start
```bash
# Check system logs
sudo journalctl -u alumni-connect --no-pager | tail -50

# Check docker compose
cd /opt/alumni-connect && docker-compose logs

# Rebuild containers
docker-compose down -v
docker-compose up -d --build
```

### Database connection fails
```bash
# Check if database is healthy
docker-compose exec db pg_isready -U postgres

# Check database logs
docker-compose logs db

# Verify DATABASE_URL in .env matches docker-compose
cat .env | grep DATABASE_URL
```

### SSL certificate not generating
```bash
# Wait 10 minutes and check
docker-compose logs nginx-proxy-letsencrypt

# Check if domain DNS resolves
nslookup www.sut-alumniconnect.me

# Manually trigger renewal
docker-compose restart nginx-proxy-letsencrypt
```

### Out of disk space
```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a

# Remove old backups (if needed)
rm /backups/alumni-connect/db_backup_*.sql.gz

# Check log sizes
du -sh /var/log/*
```

---

## 📊 Monitoring

### Health check (runs every 60 seconds):
```bash
bash scripts/health-check.sh
```

### Continuous monitoring:
```bash
# Run in background (auto-recovery enabled)
nohup bash scripts/monitor.sh > /var/log/monitor.log 2>&1 &

# View monitoring logs
tail -f /var/log/monitor.log
```

---

## 🔐 Security Best Practices

- ✅ Never commit `.env` to git (already in `.gitignore`)
- ✅ Use strong passwords for database
- ✅ Use SSH keys only (no password authentication)
- ✅ Enable firewall rules (allow only 80, 443, 22)
- ✅ Regular backups (automatic daily at 2 AM)
- ✅ Monitor logs regularly
- ✅ Update Docker images monthly

---

## 📞 Support

For issues, check logs first:
```bash
# Application logs
journalctl -u alumni-connect -f

# Docker logs
docker-compose logs -f

# Specific service
docker-compose logs api
```

If problems persist, share the logs in GitHub Issues with:
- Error message
- Steps to reproduce
- Output of `docker-compose ps`
- Output of health check

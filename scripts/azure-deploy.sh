#!/bin/bash

# Azure VM Deployment Script
# This script sets up Docker on Azure VM and deploys the application

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Azure VM Deployment Setup ===${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}This script must be run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Running as root${NC}\n"

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

echo -e "${GREEN}✓ Docker installed${NC}"

# Install Docker Compose
echo -e "${YELLOW}Installing Docker Compose...${NC}"
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Add user to docker group
echo -e "${YELLOW}Configuring user permissions...${NC}"
if [ -n "$SUDO_USER" ]; then
    usermod -aG docker "$SUDO_USER"
    echo -e "${GREEN}✓ Added $SUDO_USER to docker group${NC}"
fi

# Install git
echo -e "${YELLOW}Installing Git...${NC}"
apt-get install -y git

echo -e "${GREEN}✓ Git installed${NC}"

# Create deployment directory
echo -e "${YELLOW}Creating deployment directory...${NC}"
DEPLOY_DIR="/opt/alumni-connect"
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

echo -e "${GREEN}✓ Deployment directory created at $DEPLOY_DIR${NC}"

# Clone repository
echo -e "${YELLOW}Cloning repository...${NC}"
if [ -d ".git" ]; then
    git pull origin main
else
    # Replace with your actual repository URL
    git clone https://github.com/YOUR_USERNAME/team02.git .
fi

echo -e "${GREEN}✓ Repository cloned${NC}"

# Setup environment file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please update .env file with production values:${NC}"
    echo -e "  sudo nano $DEPLOY_DIR/.env"
    echo ""
    echo "Required values to update:"
    echo "  - DATABASE_URL"
    echo "  - JWT_SECRET"
    echo "  - GMAIL_USER"
    echo "  - GMAIL_PASS"
    echo "  - NEXTAUTH_SECRET"
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

# Create systemd service
echo -e "${YELLOW}Creating systemd service...${NC}"

cat > /etc/systemd/system/alumni-connect.service << EOF
[Unit]
Description=SUT Alumni Connect Docker Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/local/bin/docker-compose up -d --build
ExecStop=/usr/local/bin/docker-compose down
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable alumni-connect.service

echo -e "${GREEN}✓ Systemd service created${NC}"

# Setup log rotation
echo -e "${YELLOW}Setting up log rotation...${NC}"

cat > /etc/logrotate.d/alumni-connect << EOF
$DEPLOY_DIR/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 root root
}
EOF

mkdir -p "$DEPLOY_DIR/logs"

echo -e "${GREEN}✓ Log rotation configured${NC}"

# Setup backup script
echo -e "${YELLOW}Creating backup script...${NC}"

cat > "$DEPLOY_DIR/backup.sh" << 'BACKUP_SCRIPT'
#!/bin/bash
BACKUP_DIR="/backups/alumni-connect"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)..."
docker-compose exec -T db pg_dump -U postgres mydb | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

echo "Backup completed: $BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Old backups cleaned up"
BACKUP_SCRIPT

chmod +x "$DEPLOY_DIR/backup.sh"

echo -e "${GREEN}✓ Backup script created${NC}"

# Setup cron for daily backups
echo -e "${YELLOW}Setting up daily backups...${NC}"

CRON_JOB="0 2 * * * cd $DEPLOY_DIR && ./backup.sh"
(crontab -l 2>/dev/null | grep -v "$DEPLOY_DIR/backup.sh"; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}✓ Daily backup scheduled (2 AM)${NC}"

# Final instructions
echo -e "\n${GREEN}=== Setup Complete ===${NC}\n"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update environment variables:"
echo "   sudo nano $DEPLOY_DIR/.env"
echo ""
echo "2. Start the application:"
echo "   sudo systemctl start alumni-connect"
echo ""
echo "3. Check status:"
echo "   sudo systemctl status alumni-connect"
echo "   docker-compose ps"
echo ""
echo "4. View logs:"
echo "   journalctl -u alumni-connect -f"
echo "   docker-compose logs -f"
echo ""
echo "5. Manually run database migrations:"
echo "   cd $DEPLOY_DIR"
echo "   docker-compose exec api npx prisma migrate deploy"
echo ""
echo "Useful commands:"
echo "  sudo systemctl restart alumni-connect    # Restart all services"
echo "  $DEPLOY_DIR/backup.sh                    # Manual backup"
echo "  docker system prune -a                   # Clean unused images"

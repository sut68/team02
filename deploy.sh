#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== SUT Alumni Connect Deployment Script ===${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker found${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose found${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please update .env with production values${NC}"
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}\n"

# Menu
echo "Select deployment action:"
echo "1) Build and start all services"
echo "2) Start services (use existing images)"
echo "3) Stop services"
echo "4) View logs"
echo "5) Run database migrations"
echo "6) Restart specific service"
echo "7) Full cleanup and rebuild"
echo ""
read -p "Enter choice (1-7): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}Building and starting services...${NC}\n"
        docker-compose up -d --build
        echo -e "\n${GREEN}✓ Services started!${NC}"
        sleep 3
        echo -e "\n${YELLOW}Service Status:${NC}"
        docker-compose ps
        ;;
    2)
        echo -e "\n${YELLOW}Starting services...${NC}\n"
        docker-compose up -d
        echo -e "\n${GREEN}✓ Services started!${NC}"
        sleep 3
        docker-compose ps
        ;;
    3)
        echo -e "\n${YELLOW}Stopping services...${NC}\n"
        docker-compose down
        echo -e "${GREEN}✓ Services stopped!${NC}"
        ;;
    4)
        echo -e "\n${YELLOW}Showing logs (press Ctrl+C to exit):${NC}\n"
        docker-compose logs -f
        ;;
    5)
        echo -e "\n${YELLOW}Running database migrations...${NC}\n"
        docker-compose exec api npx prisma migrate deploy
        echo -e "\n${GREEN}✓ Migrations completed!${NC}"
        ;;
    6)
        read -p "Enter service name (api/web/db): " service
        echo -e "\n${YELLOW}Restarting $service...${NC}\n"
        docker-compose restart $service
        echo -e "${GREEN}✓ Service restarted!${NC}"
        ;;
    7)
        echo -e "\n${YELLOW}Full cleanup and rebuild...${NC}\n"
        docker-compose down -v
        docker-compose up -d --build
        sleep 5
        echo -e "\n${GREEN}✓ Full rebuild completed!${NC}"
        docker-compose ps
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}=== Deployment Complete ===${NC}\n"
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:      docker-compose logs -f [service]"
echo "  Check status:   docker-compose ps"
echo "  SSH to container: docker-compose exec [service] sh"
echo "  View config:    docker-compose config"

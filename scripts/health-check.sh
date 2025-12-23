#!/bin/bash

# Health Check and Monitoring Script
# Monitors the health of all services and sends alerts

set -e

# Configuration
API_HEALTH_URL="http://localhost/api/health"
DB_HOST="db"
DB_USER="postgres"
DB_NAME="mydb"
LOG_FILE="/tmp/alumni-connect-health.log"
ALERT_EMAIL="sutalumniconnect@gmail.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo -e "${2}$1${NC}"
}

# Check if Docker containers are running
check_containers() {
    echo ""
    log "Checking Docker containers..." "$YELLOW"
    
    for container in next-db api web nginx-proxy; do
        if docker ps --format "{{.Names}}" | grep -q "^$container$"; then
            log "✓ Container $container is running" "$GREEN"
        else
            log "✗ Container $container is NOT running" "$RED"
            return 1
        fi
    done
    return 0
}

# Check database connectivity
check_database() {
    echo ""
    log "Checking database connectivity..." "$YELLOW"
    
    if docker exec next-db pg_isready -U "$DB_USER" &>/dev/null; then
        log "✓ Database is responding" "$GREEN"
        
        # Check database size
        SIZE=$(docker exec next-db psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size(current_database()));")
        log "  Database size: $SIZE" "$GREEN"
        return 0
    else
        log "✗ Database is NOT responding" "$RED"
        return 1
    fi
}

# Check API health
check_api() {
    echo ""
    log "Checking API health..." "$YELLOW"
    
    if [ -f "/.dockerenv" ] 2>/dev/null; then
        # Inside container
        HEALTH_URL="http://api:8000/health"
    else
        # Outside container
        HEALTH_URL="http://localhost:8000/health"
    fi
    
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        log "✓ API is healthy (HTTP $RESPONSE)" "$GREEN"
        return 0
    else
        log "✗ API health check failed (HTTP $RESPONSE)" "$RED"
        return 1
    fi
}

# Check disk space
check_disk() {
    echo ""
    log "Checking disk space..." "$YELLOW"
    
    USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$USAGE" -lt 80 ]; then
        log "✓ Disk usage: ${USAGE}% (OK)" "$GREEN"
        return 0
    else
        log "⚠ Disk usage: ${USAGE}% (HIGH)" "$YELLOW"
        return 1
    fi
}

# Check memory usage
check_memory() {
    echo ""
    log "Checking memory usage..." "$YELLOW"
    
    MEM=$(docker stats --no-stream --format "{{.MemPerc}}" 2>/dev/null | awk '{s+=$1} END {print s}' | sed 's/%//')
    
    if (( $(echo "$MEM < 80" | bc -l) )); then
        log "✓ Memory usage: ${MEM}% (OK)" "$GREEN"
        return 0
    else
        log "⚠ Memory usage: ${MEM}% (HIGH)" "$YELLOW"
        return 1
    fi
}

# Generate status report
generate_report() {
    echo ""
    log "=== Health Check Report ===" "$YELLOW"
    
    STATUS=0
    check_containers || STATUS=1
    check_database || STATUS=1
    # we do not have
    # check_api || STATUS=1
    check_disk || STATUS=1
    check_memory || STATUS=1
    
    echo ""
    log "=== Check Complete ===" "$YELLOW"
    
    if [ $STATUS -eq 0 ]; then
        log "All services are healthy ✓" "$GREEN"
    else
        log "Some services need attention ⚠" "$YELLOW"
    fi
    
    return $STATUS
}

# Main execution
main() {
    mkdir -p "$(dirname "$LOG_FILE")"
    
    echo -e "${YELLOW}=== Alumni Connect Health Check ===${NC}"
    
    generate_report
}

main "$@"

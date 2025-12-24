#!/bin/bash

# Service Monitor and Auto-Recovery Script
# Monitors services and automatically restarts them if they fail

set -e

LOG_FILE="/var/log/alumni-connect-monitor.log"
MAX_RETRIES=3
CHECK_INTERVAL=60

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo -e "${2}$1${NC}"
}

# Check and restart a service
check_service() {
    local service=$1
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if docker-compose ps "$service" | grep -q "Up"; then
            log "✓ Service $service is running" "$GREEN"
            return 0
        fi
        
        retries=$((retries + 1))
        log "⚠ Service $service is down (attempt $retries/$MAX_RETRIES)" "$YELLOW"
        
        if [ $retries -lt $MAX_RETRIES ]; then
            log "  Restarting in 5 seconds..." "$YELLOW"
            sleep 5
            docker-compose restart "$service"
        fi
    done
    
    log "✗ Failed to recover service $service after $MAX_RETRIES attempts" "$RED"
    return 1
}

# Monitor all services
monitor_services() {
    local services=("db" "api" "web" "nginx-proxy")
    local failed_services=()
    
    log "=== Starting Service Monitoring ===" "$YELLOW"
    
    for service in "${services[@]}"; do
        if ! check_service "$service"; then
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -gt 0 ]; then
        log "✗ Failed services: ${failed_services[*]}" "$RED"
        return 1
    else
        log "✓ All services are healthy" "$GREEN"
        return 0
    fi
}

# Continuous monitoring
monitor_loop() {
    while true; do
        if ! monitor_services; then
            # Send alert (you can integrate email/Slack here)
            log "⚠ ALERT: Some services failed. Attempting recovery..." "$RED"
            sleep 10
        fi
        
        log "Next check in $CHECK_INTERVAL seconds..." "$YELLOW"
        sleep "$CHECK_INTERVAL"
    done
}

# Main
mkdir -p "$(dirname "$LOG_FILE")"

case "${1:-monitor}" in
    monitor)
        monitor_loop
        ;;
    once)
        monitor_services
        ;;
    *)
        echo "Usage: $0 [monitor|once]"
        exit 1
        ;;
esac

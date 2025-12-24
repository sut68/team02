#!/bin/bash

# Database Backup and Restore Script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKUP_DIR="${BACKUP_DIR:-.backups}"
DB_USER="postgres"
DB_NAME="mydb"

mkdir -p "$BACKUP_DIR"

log() {
    echo -e "${2}${1}${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$BACKUP_DIR/backup.log"
}

# Create backup
backup_database() {
    log "Starting database backup..." "$YELLOW"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"
    
    if docker-compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "✓ Backup created: $BACKUP_FILE ($SIZE)" "$GREEN"
        
        # Keep only last 7 days
        find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
        log "Old backups cleaned up" "$GREEN"
    else
        log "✗ Backup failed" "$RED"
        return 1
    fi
}

# Restore from backup
restore_database() {
    if [ -z "$1" ]; then
        log "Usage: $0 restore <backup_file>" "$RED"
        return 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        log "✗ Backup file not found: $BACKUP_FILE" "$RED"
        return 1
    fi
    
    log "⚠ Warning: This will overwrite the current database!" "$YELLOW"
    read -p "Continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        log "Restore cancelled" "$YELLOW"
        return 0
    fi
    
    log "Starting database restore..." "$YELLOW"
    
    if zcat "$BACKUP_FILE" | docker-compose exec -T db psql -U "$DB_USER" "$DB_NAME"; then
        log "✓ Database restored from $BACKUP_FILE" "$GREEN"
    else
        log "✗ Restore failed" "$RED"
        return 1
    fi
}

# List backups
list_backups() {
    log "Available backups:" "$YELLOW"
    ls -lh "$BACKUP_DIR"/db_backup_*.sql.gz 2>/dev/null || log "No backups found" "$YELLOW"
}

# Show usage
usage() {
    cat << EOF
${YELLOW}Database Backup Script${NC}

Usage: $0 [command] [options]

Commands:
  backup              Create a new backup
  restore <file>      Restore from backup file
  list                List available backups
  help                Show this help message

Examples:
  $0 backup                           # Create backup
  $0 restore .backups/db_backup_*.gz  # Restore from file
  $0 list                             # List backups

EOF
}

# Main
case "${1:-help}" in
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    list)
        list_backups
        ;;
    help|*)
        usage
        ;;
esac

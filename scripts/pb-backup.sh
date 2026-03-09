#!/usr/bin/env bash
# Back up PocketBase data directory to a timestamped tar.gz archive.
# Usage: ./scripts/pb-backup.sh [backup_dir]
#
# Defaults to ./pb_backups/ in the project root.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PB_DATA_DIR="${PROJECT_DIR}/pb_data"
BACKUP_DIR="${1:-${PROJECT_DIR}/pb_backups}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/pb_data_${TIMESTAMP}.tar.gz"

if [ ! -d "$PB_DATA_DIR" ]; then
  echo "Error: pb_data directory not found at ${PB_DATA_DIR}"
  echo "Has PocketBase been started at least once?"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR" pb_data

echo "Backup created: ${BACKUP_FILE}"
echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"

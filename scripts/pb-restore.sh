#!/usr/bin/env bash
# Restore PocketBase data from a backup archive.
# Usage: ./scripts/pb-restore.sh <backup_file>
#
# WARNING: This replaces the current pb_data directory.
# Stop PocketBase before restoring.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PB_DATA_DIR="${PROJECT_DIR}/pb_data"

if [ -z "${1:-}" ]; then
  echo "Usage: ./scripts/pb-restore.sh <backup_file>"
  echo ""
  echo "Available backups:"
  ls -1t "${PROJECT_DIR}/pb_backups/"*.tar.gz 2>/dev/null || echo "  (none found)"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# Check if PocketBase is running
if docker compose ps pocketbase 2>/dev/null | grep -q "running"; then
  echo "Error: PocketBase is still running. Stop it first:"
  echo "  docker compose stop pocketbase"
  exit 1
fi

if [ -d "$PB_DATA_DIR" ]; then
  echo "Backing up current data to pb_data.old..."
  rm -rf "${PB_DATA_DIR}.old"
  mv "$PB_DATA_DIR" "${PB_DATA_DIR}.old"
fi

echo "Restoring from ${BACKUP_FILE}..."
tar -xzf "$BACKUP_FILE" -C "$PROJECT_DIR"

echo "Restore complete. Start PocketBase with:"
echo "  docker compose up pocketbase -d"

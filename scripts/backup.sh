#!/bin/bash

# Konfiguracija
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME=${POSTGRES_DB:-"housebuilding"}
DB_USER=${POSTGRES_USER:-"postgres"}

mkdir -p "$BACKUP_DIR"

echo "=== Pokretanje bekapa: $TIMESTAMP ==="

# 1. Bekap PostgreSQL baze
docker exec housebuilding_db pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"
echo "Baza sacuvana u: $BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# 2. Bekap uploada (slike, računi, PDF ugovori)
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" ./public/uploads
echo "Uploads sacuvani u: $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz"

# 3. Zadrzi samo poslednjih 7 dana bekapa (brisanje starih)
find "$BACKUP_DIR" -type f -mtime +7 -delete

echo "=== Bekap uspesno zavrsen ==="
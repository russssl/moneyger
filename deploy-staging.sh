#!/usr/bin/env bash
set -e

# ---- CONFIG ----
# Production database
PROD_CONTAINER="moneyger-postgres-1"
PROD_DB="moneyger"
PROD_USER="postgres"

# Staging database (from moneyger-staging docker compose)
STAGING_CONTAINER="moneyger-staging_db"
STAGING_DB="moneyger_staging"
STAGING_USER="postgres"
# -----------------

DUMP_FILE="prod_dump.sql"

# Cleanup function to remove dump file on exit
cleanup() {
    if [ -f "$DUMP_FILE" ]; then
        rm -f "$DUMP_FILE"
    fi
}
trap cleanup EXIT

# Function to wait for database to be ready
wait_for_db() {
    local container=$1
    local user=$2
    local db=$3
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec "$container" pg_isready -U "$user" -d "$db" > /dev/null 2>&1; then
            return 0
        fi
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "Error: Database did not become ready in time."
    exit 1
}

echo "Step 1: Cloning production database..."
docker exec "$PROD_CONTAINER" pg_dump -U "$PROD_USER" "$PROD_DB" > "$DUMP_FILE"

echo "Step 2: Pulling staging images..."
docker compose pull

echo "Step 3: Removing old containers and volumes..."
docker compose down -v

echo "Step 4: Starting new containers..."
docker compose up -d --force-recreate

echo "Step 5: Waiting for staging database..."
sleep 2
wait_for_db "$STAGING_CONTAINER" "$STAGING_USER" "postgres"

echo "Step 6: Dropping and recreating staging database..."
docker exec "$STAGING_CONTAINER" psql -U "$STAGING_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$STAGING_DB\";" > /dev/null
docker exec "$STAGING_CONTAINER" psql -U "$STAGING_USER" -d postgres -c "CREATE DATABASE \"$STAGING_DB\";" > /dev/null

echo "Step 7: Applying production database data..."
cat "$DUMP_FILE" | docker exec -i "$STAGING_CONTAINER" psql -U "$STAGING_USER" "$STAGING_DB" > /dev/null

echo "Step 8: Running migrations to apply any new ones..."

docker compose exec -T app bun run db:migrate

echo "✓ Done!"


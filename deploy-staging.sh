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

echo "Step 7: Waiting for staging database to be ready..."
wait_for_db "$STAGING_CONTAINER" "$STAGING_USER" "$STAGING_DB"

echo "Step 8: Applying production database data..."
cat "$DUMP_FILE" | docker exec -i "$STAGING_CONTAINER" psql -U "$STAGING_USER" "$STAGING_DB" > /dev/null

echo "Step 9: Waiting for app container to be ready..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker compose ps app 2>/dev/null | grep -q "Up"; then
        sleep 3  # Give it a moment to fully initialize
        break
    fi
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "Warning: App container may not be ready, but proceeding with migration..."
fi

echo "Step 10: Running migrations to apply any new ones..."
echo "Note: If production already has all migrations applied, this will show 'No pending migrations'"
echo "      Migration output will be shown below..."
if ! docker compose exec app bun run db:migrate; then
    echo ""
    echo "Error: Migration failed! Check the output above for details."
    echo ""
    echo "Troubleshooting tips:"
    echo "1. Check if the app container has the correct database environment variables"
    echo "2. Verify the database connection from the app container"
    echo "3. Check if there are any new migration files that need to be applied"
    exit 1
fi

echo ""
echo "Step 11: Verifying migration status..."
docker compose exec -T app bun run drizzle-kit migrate 2>&1 | grep -q "No pending migrations" && echo "✓ All migrations are up to date" || echo "⚠ Some migrations may still be pending"

echo "✓ Done!"


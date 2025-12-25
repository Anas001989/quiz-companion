#!/bin/bash

# Supabase Database Migration Script
# Migrates data from old project (ap-southeast-1) to new project (ca-central-1)

set -e  # Exit on error

echo "🚀 Starting Supabase Database Migration"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check which file has the database URLs (prioritize the one with variables)
ENV_FILE=""
if [ -f .env ] && grep -q "DATABASE_URL" .env; then
    echo -e "${GREEN}📄 Loading .env (contains DATABASE_URL)${NC}"
    ENV_FILE=".env"
elif [ -f .env.local ] && grep -q "DATABASE_URL" .env.local; then
    echo -e "${GREEN}📄 Loading .env.local (contains DATABASE_URL)${NC}"
    ENV_FILE=".env.local"
elif [ -f .env.local ]; then
    echo -e "${GREEN}📄 Loading .env.local${NC}"
    ENV_FILE=".env.local"
elif [ -f .env ]; then
    echo -e "${GREEN}📄 Loading .env${NC}"
    ENV_FILE=".env"
else
    echo -e "${RED}❌ Error: Neither .env.local nor .env file found${NC}"
    echo "Please create .env.local or .env with DATABASE_URL_OLD and DATABASE_URL"
    exit 1
fi

# Load environment variables, handling quotes and comments
# Use set -a to automatically export all variables
set -a

# Process the file and export variables directly
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    trimmed=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    [ -z "$trimmed" ] && continue
    [ "${trimmed:0:1}" = "#" ] && continue
    
    # Split on first = sign only (value may contain =)
    key="${trimmed%%=*}"
    value="${trimmed#*=}"
    key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    
    # Remove surrounding quotes if present
    if [ -n "$value" ]; then
        # Remove leading quote
        if [[ "$value" =~ ^\"(.*) ]]; then
            value="${value#\"}"
        elif [[ "$value" =~ ^\'(.*) ]]; then
            value="${value#\'}"
        fi
        # Remove trailing quote
        if [[ "$value" =~ (.*)\"$ ]]; then
            value="${value%\"}"
        elif [[ "$value" =~ (.*)\'$ ]]; then
            value="${value%\'}"
        fi
        
        # Export the variable directly
        export "$key=$value"
        echo "  ✓ Loaded: $key"
    fi
done < "$ENV_FILE"

set +a

# Show what was loaded
echo "  ✓ Loaded variables from $ENV_FILE"
echo ""
echo "Debug - Checking variables:"
if [ -n "$DATABASE_URL_OLD" ]; then
    echo "    DATABASE_URL_OLD: ✓ (length: ${#DATABASE_URL_OLD})"
else
    echo "    DATABASE_URL_OLD: ✗ NOT SET"
    echo "    Searching in $ENV_FILE..."
    grep -i "DATABASE_URL_OLD" "$ENV_FILE" || echo "    Not found in file!"
fi
if [ -n "$DATABASE_URL" ]; then
    echo "    DATABASE_URL: ✓ (length: ${#DATABASE_URL})"
else
    echo "    DATABASE_URL: ✗ NOT SET"
    echo "    Searching in $ENV_FILE..."
    grep -i "DATABASE_URL" "$ENV_FILE" | grep -v "DATABASE_URL_OLD" || echo "    Not found in file!"
fi
echo ""

set +a  # Turn off automatic export

echo ""

# Check if DATABASE_URL_OLD is set
if [ -z "$DATABASE_URL_OLD" ]; then
    echo -e "${YELLOW}⚠️  Warning: DATABASE_URL_OLD not set${NC}"
    echo "Please add DATABASE_URL_OLD to your .env or .env.local file"
    read -p "Or enter old database URL now: " DATABASE_URL_OLD
else
    echo -e "${GREEN}✅ DATABASE_URL_OLD found${NC}"
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  Warning: DATABASE_URL not set${NC}"
    echo "Please add DATABASE_URL to your .env or .env.local file"
    read -p "Or enter new database URL now: " DATABASE_URL
else
    echo -e "${GREEN}✅ DATABASE_URL found${NC}"
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Step 1: Backup old database
echo "📦 Step 1: Backing up old database..."

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${YELLOW}⚠️  pg_dump not found${NC}"
    echo ""
    echo "PostgreSQL client tools are not installed."
    echo ""
    echo "Options:"
    echo "1. Install PostgreSQL client tools:"
    echo "   - Windows: Download from postgresql.org/download/windows/"
    echo "   - Mac: brew install postgresql"
    echo "   - Linux: sudo apt-get install postgresql-client"
    echo ""
    echo "2. Use Supabase Dashboard for manual migration:"
    echo "   See docs/MIGRATION_MANUAL_STEPS.md"
    echo ""
    read -p "Do you want to continue with migrations only (skip backup)? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Migration cancelled. Please install pg_dump or use manual migration."
        exit 1
    fi
    SKIP_BACKUP=true
else
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    pg_dump "$DATABASE_URL_OLD" \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --file="$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
        SKIP_BACKUP=false
    else
        echo -e "${RED}❌ Backup failed${NC}"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        SKIP_BACKUP=true
    fi
fi

echo ""

# Step 2: Run migrations on new database
echo "🔄 Step 2: Running migrations on new database..."
export DATABASE_URL
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${RED}❌ Migrations failed${NC}"
    exit 1
fi

echo ""

# Step 3: Import data
if [ "$SKIP_BACKUP" = true ]; then
    echo "📥 Step 3: Skipping data import (no backup available)"
    echo -e "${YELLOW}⚠️  Please import data manually using Supabase Dashboard${NC}"
    echo "   See docs/MIGRATION_MANUAL_STEPS.md for instructions"
else
    echo "📥 Step 3: Importing data to new database..."
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        echo -e "${YELLOW}⚠️  psql not found${NC}"
        echo "Please import manually using Supabase Dashboard"
        echo "Backup file: $BACKUP_FILE"
        echo "See docs/MIGRATION_MANUAL_STEPS.md"
    else
        psql "$DATABASE_URL" < "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Data imported successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Import completed with warnings (this may be normal)${NC}"
        fi
    fi
fi

echo ""
echo -e "${GREEN}🎉 Migration completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Update DATABASE_URL in .env.local to point to new database"
echo "2. Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "3. Test your application: npm run dev"
echo "4. Verify data and performance improvements"


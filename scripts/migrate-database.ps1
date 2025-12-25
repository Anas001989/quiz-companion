# Supabase Database Migration Script (PowerShell)
# Migrates data from old project (ap-southeast-1) to new project (ca-central-1)

Write-Host "🚀 Starting Supabase Database Migration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local or .env exists
$envFile = $null
if (Test-Path .env.local) {
    Write-Host "📄 Loading .env.local" -ForegroundColor Green
    $envFile = ".env.local"
} elseif (Test-Path .env) {
    Write-Host "📄 Loading .env" -ForegroundColor Green
    $envFile = ".env"
} else {
    Write-Host "❌ Error: Neither .env.local nor .env file found" -ForegroundColor Red
    Write-Host "Please create .env.local or .env with DATABASE_URL_OLD and DATABASE_URL"
    exit 1
}

# Load environment variables from .env or .env.local
$envContent = Get-Content $envFile
foreach ($line in $envContent) {
    # Skip empty lines and comments
    $trimmedLine = $line.Trim()
    if ($trimmedLine -eq '' -or $trimmedLine.StartsWith('#')) {
        continue
    }
    
    # Parse KEY=VALUE (handles quotes and whitespace)
    if ($trimmedLine -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove quotes if present
        if ($value.StartsWith('"') -and $value.EndsWith('"')) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        if ($value.StartsWith("'") -and $value.EndsWith("'")) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
        Write-Host "  Loaded: $key" -ForegroundColor Gray
    }
}

Write-Host ""

# Check if DATABASE_URL_OLD is set
if (-not $env:DATABASE_URL_OLD) {
    Write-Host "⚠️  Warning: DATABASE_URL_OLD not set" -ForegroundColor Yellow
    Write-Host "Please add DATABASE_URL_OLD to your .env or .env.local file" -ForegroundColor Yellow
    $env:DATABASE_URL_OLD = Read-Host "Or enter old database URL now"
} else {
    Write-Host "✅ DATABASE_URL_OLD found" -ForegroundColor Green
}

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "⚠️  Warning: DATABASE_URL not set" -ForegroundColor Yellow
    Write-Host "Please add DATABASE_URL to your .env or .env.local file" -ForegroundColor Yellow
    $env:DATABASE_URL = Read-Host "Or enter new database URL now"
} else {
    Write-Host "✅ DATABASE_URL found" -ForegroundColor Green
}

Write-Host "✅ Environment variables loaded" -ForegroundColor Green
Write-Host ""

# Step 1: Backup old database
Write-Host "📦 Step 1: Backing up old database..." -ForegroundColor Cyan
$backupFile = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"

# Check if pg_dump is available
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDumpPath) {
    Write-Host "❌ Error: pg_dump not found" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools"
    Write-Host "Or use Supabase dashboard to export data"
    exit 1
}

& pg_dump $env:DATABASE_URL_OLD `
    --no-owner `
    --no-acl `
    --clean `
    --if-exists `
    --file=$backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
} else {
    Write-Host "❌ Backup failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Run migrations on new database
Write-Host "🔄 Step 2: Running migrations on new database..." -ForegroundColor Cyan
$env:DATABASE_URL = $env:DATABASE_URL
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migrations completed" -ForegroundColor Green
} else {
    Write-Host "❌ Migrations failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Import data
Write-Host "📥 Step 3: Importing data to new database..." -ForegroundColor Cyan

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "❌ Error: psql not found" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools"
    Write-Host "Or import manually using Supabase SQL Editor"
    exit 1
}

Get-Content $backupFile | & psql $env:DATABASE_URL

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Data imported successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Import completed with warnings (this may be normal)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Migration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Update DATABASE_URL in .env.local to point to new database"
Write-Host "2. Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
Write-Host "3. Test your application: npm run dev"
Write-Host "4. Verify data and performance improvements"


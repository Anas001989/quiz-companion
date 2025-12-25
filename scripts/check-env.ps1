# Quick script to check if environment variables are in .env files

Write-Host "🔍 Checking environment files..." -ForegroundColor Cyan
Write-Host ""

# Check .env.local
if (Test-Path .env.local) {
    Write-Host "📄 Found .env.local" -ForegroundColor Green
    $envLocal = Get-Content .env.local | Where-Object { $_ -match 'DATABASE_URL' }
    if ($envLocal) {
        Write-Host "  Contains DATABASE_URL variables:" -ForegroundColor Gray
        $envLocal | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    } else {
        Write-Host "  ⚠️  No DATABASE_URL variables found" -ForegroundColor Yellow
    }
} else {
    Write-Host "📄 .env.local not found" -ForegroundColor Gray
}

Write-Host ""

# Check .env
if (Test-Path .env) {
    Write-Host "📄 Found .env" -ForegroundColor Green
    $envFile = Get-Content .env | Where-Object { $_ -match 'DATABASE_URL' }
    if ($envFile) {
        Write-Host "  Contains DATABASE_URL variables:" -ForegroundColor Gray
        $envFile | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    } else {
        Write-Host "  ⚠️  No DATABASE_URL variables found" -ForegroundColor Yellow
    }
} else {
    Write-Host "📄 .env not found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Tip: Make sure your .env file has:" -ForegroundColor Cyan
Write-Host "   DATABASE_URL_OLD=postgresql://[connection string]" -ForegroundColor White
Write-Host "   DATABASE_URL=postgresql://[connection string]" -ForegroundColor White


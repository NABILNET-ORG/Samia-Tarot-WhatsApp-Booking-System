# 🚀 Resume Development Session
# Automatically restores session state and displays next actions

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  📊 RESUMING SESSION - Samia Tarot WhatsApp System" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if session state exists
if (!(Test-Path "SESSION_STATE.md")) {
    Write-Host "❌ SESSION_STATE.md not found!" -ForegroundColor Red
    Write-Host "   This script must be run from the project root." -ForegroundColor Yellow
    exit 1
}

# Display session state summary
Write-Host "📄 Loading SESSION_STATE.md..." -ForegroundColor Green
Write-Host ""
Get-Content "SESSION_STATE.md" | Select-Object -First 30
Write-Host ""
Write-Host "..." -ForegroundColor Gray
Write-Host ""

# Display next actions
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🎯 NEXT ACTIONS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Get-Content "NEXT_ACTIONS.md" | Select-Object -First 50
Write-Host ""
Write-Host "..." -ForegroundColor Gray
Write-Host ""

# Show quick status
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ QUICK STATUS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Completion: 95%" -ForegroundColor Green
Write-Host "  Status: Production Deployed" -ForegroundColor Green
Write-Host "  URL: https://samia-tarot-app.vercel.app" -ForegroundColor Blue
Write-Host ""
Write-Host "  ⚠️  Critical Actions Required:" -ForegroundColor Yellow
Write-Host "     1. Get Permanent Meta Token (5 min)" -ForegroundColor Yellow
Write-Host "     2. Verify META_WHATSAPP_PHONE_ID (2 min)" -ForegroundColor Yellow
Write-Host "     3. Complete Calendar Integration (30 min)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Time to 100%: ~50 minutes" -ForegroundColor Cyan
Write-Host ""

# Offer to run tests
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
$runTests = Read-Host "Would you like to run tests? (y/n)"

if ($runTests -eq "y" -or $runTests -eq "Y") {
    Write-Host ""
    Write-Host "🧪 Running tests..." -ForegroundColor Cyan
    npm test
    Write-Host ""
}

# Show environment check
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🔑 Environment Variables Status" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if (Test-Path ".env") {
    Write-Host "✅ .env file found" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  Remember to verify in Vercel:" -ForegroundColor Yellow
    Write-Host "   - META_WHATSAPP_TOKEN (permanent token needed)" -ForegroundColor Yellow
    Write-Host "   - META_WHATSAPP_PHONE_ID (verify exact match)" -ForegroundColor Yellow
    Write-Host "   - GOOGLE_* credentials (add OAuth tokens)" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  No .env file found in root" -ForegroundColor Yellow
    Write-Host "   Environment variables should be in Vercel" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🚀 READY TO CONTINUE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Execute step 1 from NEXT_ACTIONS.md" -ForegroundColor Cyan
Write-Host ""

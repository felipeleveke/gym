# Script para iniciar Supabase local con puertos personalizados
# Ejecutar con: .\scripts\supabase-local-start.ps1

Write-Host "🚀 Iniciando Supabase Local para Gym Training Tracker" -ForegroundColor Cyan
Write-Host ""

# Verificar si ya está corriendo
Write-Host "🔍 Verificando estado..." -ForegroundColor Yellow
$status = npx supabase status 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Supabase local ya está corriendo" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 URLs disponibles:" -ForegroundColor Cyan
    npx supabase status
    exit 0
}

Write-Host "📦 Iniciando servicios..." -ForegroundColor Yellow
npx supabase start

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Supabase local iniciado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 URLs importantes:" -ForegroundColor Cyan
    Write-Host "   API URL: http://127.0.0.1:54331" -ForegroundColor White
    Write-Host "   Studio URL: http://127.0.0.1:54333" -ForegroundColor White
    Write-Host "   Database URL: postgresql://postgres:postgres@127.0.0.1:54332/postgres" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Recuerda crear .env.local con las credenciales mostradas arriba" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "❌ Error al iniciar Supabase local" -ForegroundColor Red
    Write-Host "Verifica los logs arriba para más detalles" -ForegroundColor Yellow
}




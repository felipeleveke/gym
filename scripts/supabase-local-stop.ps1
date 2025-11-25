# Script para detener Supabase local
# Ejecutar con: .\scripts\supabase-local-stop.ps1

Write-Host "🛑 Deteniendo Supabase Local..." -ForegroundColor Cyan
Write-Host ""

npx supabase stop

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Supabase local detenido" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  No había servicios corriendo o hubo un error" -ForegroundColor Yellow
}




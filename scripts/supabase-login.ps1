# Script para iniciar sesión en Supabase CLI
# Ejecutar manualmente en PowerShell: .\scripts\supabase-login.ps1

Write-Host "🔐 Iniciando sesión en Supabase CLI" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este comando abrirá tu navegador para autenticarte." -ForegroundColor Yellow
Write-Host "Presiona Enter para continuar..." -ForegroundColor Yellow
Read-Host

npx supabase login

Write-Host ""
Write-Host "✅ Si el login fue exitoso, ahora puedes ejecutar:" -ForegroundColor Green
Write-Host "   npx supabase link --project-ref TU_REFERENCE_ID" -ForegroundColor Cyan
Write-Host ""




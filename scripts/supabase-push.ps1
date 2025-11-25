# Script PowerShell para hacer push de migraciones a Supabase remoto
# Ejecutar con: .\scripts\supabase-push.ps1

Write-Host "🚀 Push de Migraciones a Supabase Remoto" -ForegroundColor Cyan
Write-Host ""

# Verificar si Supabase CLI está instalado
try {
    $version = supabase --version
    Write-Host "✅ Supabase CLI instalado: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI no está instalado" -ForegroundColor Red
    Write-Host "📦 Instalando Supabase CLI..." -ForegroundColor Yellow
    npm install -g supabase
}

Write-Host ""
Write-Host "📋 Verificando estado de la conexión..." -ForegroundColor Cyan
supabase status

Write-Host ""
Write-Host "📤 Haciendo push de migraciones..." -ForegroundColor Cyan
supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migraciones aplicadas exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Generando tipos TypeScript..." -ForegroundColor Cyan
    supabase gen types typescript --linked > src/types/supabase.ts
    Write-Host "✅ Tipos generados en src/types/supabase.ts" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Error al hacer push de migraciones" -ForegroundColor Red
    Write-Host "Verifica los errores arriba y asegúrate de estar vinculado al proyecto correcto" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Proceso completado!" -ForegroundColor Cyan




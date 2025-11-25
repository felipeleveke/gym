# Script para aplicar la migración inicial a Supabase remoto
# Ejecutar con: .\scripts\apply-migration.ps1

Write-Host "🚀 Aplicando migración inicial a Supabase remoto" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos vinculados
Write-Host "📋 Verificando conexión..." -ForegroundColor Yellow
$linkCheck = npx supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No estás vinculado a un proyecto. Ejecuta primero:" -ForegroundColor Red
    Write-Host "   npx supabase link --project-ref TU_REFERENCE_ID" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Proyecto vinculado" -ForegroundColor Green
Write-Host ""

# Opción 1: Intentar hacer push (si la migración no está aplicada)
Write-Host "📤 Intentando hacer push de migraciones..." -ForegroundColor Cyan
npx supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migraciones aplicadas exitosamente!" -ForegroundColor Green
    
    # Generar tipos
    Write-Host ""
    Write-Host "📝 Generando tipos TypeScript..." -ForegroundColor Cyan
    npx supabase gen types typescript --linked > src/types/supabase.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tipos generados en src/types/supabase.ts" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🎉 ¡Proceso completado!" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "⚠️  El push falló. Esto puede significar:" -ForegroundColor Yellow
Write-Host "   1. La migración ya está aplicada (normal)" -ForegroundColor Yellow
Write-Host "   2. Hay conflictos de migraciones" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Opciones:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opción A: Si la migración ya está aplicada, solo genera los tipos:" -ForegroundColor White
Write-Host "   npx supabase gen types typescript --linked > src/types/supabase.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "Opción B: Aplicar manualmente desde Supabase Dashboard:" -ForegroundColor White
Write-Host "   1. Ve a tu proyecto en supabase.com" -ForegroundColor Gray
Write-Host "   2. SQL Editor → New Query" -ForegroundColor Gray
Write-Host "   3. Copia el contenido de supabase/migrations/20240101000000_initial_schema.sql" -ForegroundColor Gray
Write-Host "   4. Ejecuta el SQL" -ForegroundColor Gray
Write-Host ""
Write-Host "Opción C: Reparar el historial de migraciones:" -ForegroundColor White
Write-Host "   npx supabase migration repair --status reverted [migration_id]" -ForegroundColor Gray




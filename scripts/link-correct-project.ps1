# Script para vincular el proyecto CORRECTO de Gym
# Ejecutar cuando termine el mantenimiento de Supabase

Write-Host "🔗 Vinculando proyecto CORRECTO de Gym" -ForegroundColor Cyan
Write-Host ""

$CORRECT_PROJECT_REF = "uwuuvaqmbfyoogapkugn"

Write-Host "📋 Reference ID correcto: $CORRECT_PROJECT_REF" -ForegroundColor Green
Write-Host ""

# Verificar que no estemos vinculados a otro proyecto
Write-Host "🔍 Verificando estado actual..." -ForegroundColor Yellow
$currentLink = npx supabase projects list 2>&1 | Select-String "LINKED"

if ($currentLink) {
    Write-Host "⚠️  Ya hay un proyecto vinculado. Desvinculando..." -ForegroundColor Yellow
    npx supabase unlink
}

Write-Host ""
Write-Host "🔗 Vinculando proyecto correcto..." -ForegroundColor Cyan
npx supabase link --project-ref $CORRECT_PROJECT_REF

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Proyecto vinculado correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📤 Ahora puedes hacer push de las migraciones:" -ForegroundColor Cyan
    Write-Host "   npx supabase db push" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📝 O generar tipos:" -ForegroundColor Cyan
    Write-Host "   npx supabase gen types typescript --linked > src/types/supabase.ts" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Error al vincular. Verifica:" -ForegroundColor Red
    Write-Host "   1. Que el Reference ID sea correcto" -ForegroundColor Yellow
    Write-Host "   2. Que Supabase no esté en mantenimiento" -ForegroundColor Yellow
    Write-Host "   3. Que tengas permisos en el proyecto" -ForegroundColor Yellow
}




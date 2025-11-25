#!/bin/bash

# Script para configurar Supabase CLI con proyecto remoto
# Ejecutar con: bash scripts/supabase-setup.sh

echo "🔗 Configuración de Supabase CLI"
echo ""

# Verificar si Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI no está instalado"
    echo "📦 Instalando Supabase CLI..."
    npm install -g supabase
    echo "✅ Supabase CLI instalado"
else
    echo "✅ Supabase CLI ya está instalado"
    supabase --version
fi

echo ""
echo "🔐 Paso 1: Iniciar sesión en Supabase"
echo "Presiona Enter para continuar..."
read

supabase login

echo ""
echo "📋 Paso 2: Vincular proyecto"
echo "Necesitas el Reference ID de tu proyecto en Supabase"
echo "Puedes encontrarlo en: Settings → General → Reference ID"
echo ""
read -p "Ingresa el Reference ID de tu proyecto: " PROJECT_REF

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Reference ID no puede estar vacío"
    exit 1
fi

echo ""
echo "🔗 Vinculando proyecto..."
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "✅ Verificando conexión..."
supabase status

echo ""
echo "🎉 Configuración completada!"
echo ""
echo "Próximos pasos:"
echo "1. Verifica el estado: supabase status"
echo "2. Haz push de migraciones: supabase db push"
echo "3. Genera tipos: supabase gen types typescript --linked > src/types/supabase.ts"




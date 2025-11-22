/**
 * Script simple para verificar variables de entorno
 * Ejecutar con: node scripts/check-env.js
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'NEXT_PUBLIC_APP_URL',
];

console.log('🔍 Verificando variables de entorno...\n');

let allGood = true;

// Verificar variables obligatorias
console.log('📋 Variables obligatorias:');
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    // Ocultar valores sensibles
    const displayValue = varName.includes('KEY') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ❌ ${varName}: NO CONFIGURADA`);
    allGood = false;
  }
});

console.log('\n📋 Variables opcionales:');
optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('KEY') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`  ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`  ⚠️  ${varName}: No configurada (opcional)`);
  }
});

console.log('');

if (allGood) {
  console.log('✅ Todas las variables obligatorias están configuradas');
  console.log('🚀 Listo para desplegar en Vercel');
} else {
  console.log('❌ Faltan variables obligatorias');
  console.log('💡 Crea un archivo .env.local con las variables necesarias');
  console.log('   O configúralas en Vercel → Settings → Environment Variables');
  process.exit(1);
}


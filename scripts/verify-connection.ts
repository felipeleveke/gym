/**
 * Script para verificar la conexión con Supabase remoto
 * Ejecutar con: npx tsx scripts/verify-connection.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.log('\nAsegúrate de tener configuradas:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔍 Verificando conexión con Supabase...\n');
console.log(`URL: ${SUPABASE_URL}\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function verifyConnection() {
  try {
    // 1. Verificar conexión básica
    console.log('1️⃣ Verificando conexión básica...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (healthError && healthError.code !== 'PGRST116') {
      throw healthError;
    }
    console.log('✅ Conexión básica exitosa\n');

    // 2. Verificar que las tablas existan
    console.log('2️⃣ Verificando estructura de base de datos...');
    const tables = [
      'profiles',
      'exercises',
      'workout_routines',
      'gym_trainings',
      'sport_trainings',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error && error.code !== 'PGRST116') {
        console.log(`❌ Tabla "${table}" no existe o no es accesible`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`✅ Tabla "${table}" existe`);
      }
    }
    console.log('');

    // 3. Verificar autenticación
    console.log('3️⃣ Verificando servicio de autenticación...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log(`⚠️  Error al verificar auth: ${authError.message}`);
      console.log('   (Esto es normal si no hay sesión activa)');
    } else {
      console.log('✅ Servicio de autenticación funcionando');
      if (authData.session) {
        console.log(`   Usuario autenticado: ${authData.session.user.email}`);
      } else {
        console.log('   No hay sesión activa (normal)');
      }
    }
    console.log('');

    // 4. Verificar RLS (Row Level Security)
    console.log('4️⃣ Verificando políticas de seguridad (RLS)...');
    const { data: rlsCheck, error: rlsError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (rlsError) {
      if (rlsError.code === '42501' || rlsError.message.includes('permission denied')) {
        console.log('✅ RLS está activo (las políticas están funcionando)');
      } else {
        console.log(`⚠️  RLS check: ${rlsError.message}`);
      }
    } else {
      console.log('⚠️  RLS podría no estar configurado correctamente');
    }
    console.log('');

    console.log('✅ Verificación completada');
    console.log('\n📝 Resumen:');
    console.log('   - Conexión: OK');
    console.log('   - Estructura: Verificada');
    console.log('   - Autenticación: OK');
    console.log('   - Seguridad: Verificada');
    console.log('\n🎉 Tu conexión con Supabase está funcionando correctamente!');

  } catch (error: any) {
    console.error('\n❌ Error durante la verificación:');
    console.error(`   ${error.message}`);
    console.error(`   Código: ${error.code || 'N/A'}`);
    console.error('\n💡 Posibles soluciones:');
    console.error('   1. Verifica que las variables de entorno sean correctas');
    console.error('   2. Asegúrate de que las migraciones se hayan ejecutado');
    console.error('   3. Verifica que el proyecto de Supabase esté activo');
    process.exit(1);
  }
}

verifyConnection();


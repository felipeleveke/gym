import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Endpoint de salud para verificar conexión con Supabase
 * GET /api/health
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    checks: {
      supabase: {
        status: 'unknown',
        message: '',
      },
      env: {
        status: 'unknown',
        message: '',
      },
    },
  };

  // Verificar variables de entorno
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    checks.status = 'error';
    checks.checks.env = {
      status: 'error',
      message: 'Variables de entorno de Supabase no configuradas',
    };
    return NextResponse.json(checks, { status: 500 });
  }

  checks.checks.env = {
    status: 'ok',
    message: 'Variables de entorno configuradas',
  };

  // Verificar conexión con Supabase
  try {
    const supabase = await createClient();
    
    // Intentar una consulta simple
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 es "no rows returned", que es válido
      throw error;
    }

    checks.checks.supabase = {
      status: 'ok',
      message: 'Conexión exitosa con Supabase',
    };
  } catch (error: any) {
    checks.status = 'error';
    checks.checks.supabase = {
      status: 'error',
      message: error.message || 'Error desconocido al conectar con Supabase',
    };
    return NextResponse.json(checks, { status: 500 });
  }

  return NextResponse.json(checks);
}


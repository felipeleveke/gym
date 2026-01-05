'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

interface HealthCheck {
  timestamp: string;
  status: string;
  checks: {
    supabase: {
      status: string;
      message: string;
    };
    env: {
      status: string;
      message: string;
    };
  };
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/health');
      const data = await response.json();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Error al verificar la conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="container-mobile py-12 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Verificación de Conexión</h1>
          <p className="text-muted-foreground">
            Verifica el estado de la conexión con Supabase remoto
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>
                  Última verificación: {health?.timestamp ? new Date(health.timestamp).toLocaleString('es-ES') : 'N/A'}
                </CardDescription>
              </div>
              <Button onClick={checkHealth} disabled={loading} variant="outline">
                {loading ? 'Verificando...' : 'Verificar Ahora'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && !health && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Verificando conexión...</p>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            )}

            {health && (
              <div className="space-y-4">
                {/* Estado General */}
                <div className={`p-4 rounded-md ${
                  health.status === 'ok' 
                    ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      health.status === 'ok' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-semibold">
                      Estado General: {health.status === 'ok' ? '✅ Operativo' : '❌ Error'}
                    </span>
                  </div>
                </div>

                {/* Variables de Entorno */}
                <div>
                  <h3 className="font-semibold mb-2">Variables de Entorno</h3>
                  <div className={`p-3 rounded-md ${
                    health.checks.env.status === 'ok'
                      ? 'bg-green-50 dark:bg-green-950'
                      : 'bg-red-50 dark:bg-red-950'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{health.checks.env.status === 'ok' ? '✅' : '❌'}</span>
                      <span className="text-sm">{health.checks.env.message}</span>
                    </div>
                  </div>
                </div>

                {/* Conexión Supabase */}
                <div>
                  <h3 className="font-semibold mb-2">Conexión con Supabase</h3>
                  <div className={`p-3 rounded-md ${
                    health.checks.supabase.status === 'ok'
                      ? 'bg-green-50 dark:bg-green-950'
                      : 'bg-red-50 dark:bg-red-950'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span>{health.checks.supabase.status === 'ok' ? '✅' : '❌'}</span>
                      <span className="text-sm">{health.checks.supabase.message}</span>
                    </div>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Información</h3>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <strong>URL de Supabase:</strong>{' '}
                      {process.env.NEXT_PUBLIC_SUPABASE_URL 
                        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...` 
                        : 'No configurada'}
                    </p>
                    <p>
                      <strong>Ambiente:</strong> {process.env.NODE_ENV || 'development'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Guía Rápida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Si ves errores:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Verifica que las variables de entorno estén configuradas en Vercel</li>
              <li>Asegúrate de que las migraciones se hayan ejecutado en Supabase</li>
              <li>Verifica que el proyecto de Supabase esté activo</li>
              <li>Revisa los logs en Vercel y Supabase</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


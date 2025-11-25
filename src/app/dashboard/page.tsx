import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Obtener estadísticas básicas
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="space-y-4">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Bienvenido</h2>
          <p className="text-muted-foreground">
            {profile?.full_name || user.email}
          </p>
        </div>
        {/* Aquí irán las estadísticas y gráficos */}
      </div>
    </div>
  );
}


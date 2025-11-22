import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function TrainingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="container-mobile py-6">
      <h1 className="text-3xl font-bold mb-6">Mis Entrenamientos</h1>
      <div className="space-y-4">
        {/* Aquí irá la lista de entrenamientos */}
      </div>
    </div>
  );
}


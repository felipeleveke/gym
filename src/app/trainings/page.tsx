import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TrainingsListClient } from '@/components/trainings/trainings-list-client';

export default async function TrainingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mis Entrenamientos</h1>
      </div>
      <TrainingsListClient />
    </div>
  );
}


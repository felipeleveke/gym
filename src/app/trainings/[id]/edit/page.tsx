import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EditTrainingClient } from '@/components/trainings/edit-training-client';

export default async function EditTrainingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return <EditTrainingClient trainingId={id} />;
}


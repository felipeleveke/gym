import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileForm } from '@/components/profile/profile-form';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Obtener perfil del usuario
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>
      <ProfileForm 
        initialProfile={profile || {
          id: user.id,
          email: user.email || '',
          full_name: null,
          avatar_url: null,
          role: 'athlete',
        }}
        userEmail={user.email || ''}
      />
    </div>
  );
}







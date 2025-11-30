import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'signup', 'recovery', 'magiclink', etc.
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Verificar y crear perfil si no existe
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Verificar si el perfil existe
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        // Si no existe el perfil, crearlo
        if (profileError || !profile) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || '',
              avatar_url: user.user_metadata?.avatar_url || null,
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
            // Continuar de todas formas, el trigger debería haberlo creado
          }
        }
      }

      // Determinar el destino según el tipo de flujo
      let redirectPath = next;
      
      if (type === 'recovery') {
        // Si es recuperación de contraseña, redirigir a update-password
        redirectPath = '/auth/update-password';
      } else {
        // Para signup, magic link, etc., ir al dashboard
        redirectPath = '/dashboard';
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }
  }

  // Si hay error o no hay código, redirigir a login con mensaje de error
  return NextResponse.redirect(`${origin}/auth/login?error=invalid_code`);
}


import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/dashboard';

  // Manejar errores de OAuth (incluyendo cancelación)
  if (error || errorCode) {
    // Si el usuario canceló el login
    if (errorCode === 'bad_oauth_state' || error === 'access_denied') {
      const redirectUrl = new URL('/auth/login', origin);
      redirectUrl.searchParams.set('error', 'cancelled');
      redirectUrl.searchParams.set('message', 'Inicio de sesión cancelado');
      return NextResponse.redirect(redirectUrl);
    }

    // Otros errores de OAuth
    const redirectUrl = new URL('/auth/login', origin);
    redirectUrl.searchParams.set('error', error || 'oauth_error');
    if (errorDescription) {
      redirectUrl.searchParams.set('message', decodeURIComponent(errorDescription));
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
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
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            });

          if (insertError) {
            console.error('Error creating profile:', insertError);
            // Continuar de todas formas, el trigger debería haberlo creado
          }
        }
      }

      // Redirigir al dashboard después del login exitoso
      const redirectPath = next;
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    } else {
      // Error al intercambiar el código por sesión
      const redirectUrl = new URL('/auth/login', origin);
      redirectUrl.searchParams.set('error', 'exchange_error');
      redirectUrl.searchParams.set('message', 'Error al procesar la autenticación');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Si no hay código ni error, redirigir a login
  const redirectUrl = new URL('/auth/login', origin);
  redirectUrl.searchParams.set('error', 'invalid_request');
  return NextResponse.redirect(redirectUrl);
}


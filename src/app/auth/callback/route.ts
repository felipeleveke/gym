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


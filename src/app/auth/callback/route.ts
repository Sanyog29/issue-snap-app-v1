import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'issue-snap.sanyog.online';
  const proto = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const origin = `${proto}://${host}`;
  const code = searchParams.get('code');
  const role = searchParams.get('role') || 'citizen';
  const next = searchParams.get('next') ?? (role === 'staff' ? '/staff' : '/');

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options });
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const user = data.user;
      const userEmail = user.email?.trim().toLowerCase() || null;
      const metaName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.preferred_username ||
        '';

      // Lookup user in public.users by ID
      let { data: profile } = await supabase
        .from('users')
        .select('id, full_name, user_type, email')
        .eq('id', user.id)
        .maybeSingle();

      // If no profile found by ID and user has email, check if pre-registered by email
      if (!profile && userEmail) {
        const { data: profileByEmail } = await supabase
          .from('users')
          .select('id, full_name, user_type, email')
          .ilike('email', userEmail)
          .maybeSingle();

        if (profileByEmail) {
          profile = profileByEmail;
          // Align auth ID with existing user record
          if (profile.id !== user.id) {
            await supabase
              .from('users')
              .update({ id: user.id })
              .eq('id', profileByEmail.id);
          }
        }
      }

      if (role === 'staff') {
        const isStaff = profile?.user_type === 'staff' || profile?.user_type === 'admin';
        if (!isStaff) {
          // Invalidate session immediately: unauthorized account attempted staff login
          await supabase.auth.signOut();
          const deniedRedirect = NextResponse.redirect(
            `${origin}/auth?error=NotStaff&tab=employee`
          );
          request.cookies.getAll().forEach((c) => {
            deniedRedirect.cookies.delete(c.name);
          });
          response.cookies.getAll().forEach((c) => {
            deniedRedirect.cookies.delete(c.name);
          });
          return deniedRedirect;
        }

        const staffRedirect = NextResponse.redirect(`${origin}/staff`);
        response.cookies.getAll().forEach((c) => {
          staffRedirect.cookies.set(c.name, c.value, c);
        });
        return staffRedirect;
      }

      // Citizen flow: ensure profile exists in public.users
      if (!profile) {
        const { data: newProfile } = await supabase
          .from('users')
          .upsert(
            {
              id: user.id,
              email: userEmail,
              full_name: metaName,
              user_type: 'citizen',
            },
            { onConflict: 'id' }
          )
          .select('id, full_name, user_type, email')
          .single();

        profile = newProfile || { id: user.id, full_name: metaName, user_type: 'citizen', email: userEmail };
      } else if (!profile.full_name && metaName) {
        // Auto-fill full_name from OAuth metadata if empty
        await supabase
          .from('users')
          .update({ full_name: metaName, email: userEmail })
          .eq('id', user.id);
        profile.full_name = metaName;
      }

      // If citizen still lacks full_name, redirect to profile completion
      if (!profile?.full_name) {
        const profileRedirect = NextResponse.redirect(`${origin}/auth/profile`);
        response.cookies.getAll().forEach((c) => {
          profileRedirect.cookies.set(c.name, c.value, c);
        });
        return profileRedirect;
      }

      return response;
    }
  }

  // Auth failed or code missing, return to /auth with error
  return NextResponse.redirect(`${origin}/auth?error=OAuthFailed`);
}

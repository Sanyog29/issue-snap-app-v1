// IssueSnap — Auth Service (OAuth-Only)
// All phone/email OTP logic removed. Authentication is handled entirely
// through Supabase OAuth (Google) with role-gated callback routing.

import { SupabaseClient } from '@supabase/supabase-js';
import { OAuthSignInParams, TargetRole } from './types';

/**
 * Initiates OAuth sign-in flow via Supabase.
 * The callback at /auth/callback handles session exchange and role gating.
 */
export async function initiateOAuthSignIn(
  supabase: SupabaseClient,
  params: OAuthSignInParams
): Promise<{ success: boolean; error?: string }> {
  const role: TargetRole =
    params.role === 'employee' || params.role === 'staff' ? 'staff' : 'citizen';
  const provider = params.provider || 'google';

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const redirectUrl = `${origin}/auth/callback?role=${role}${
      role === 'staff' ? '&next=/staff' : ''
    }`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectUrl },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'OAuth sign-in failed.';
    return { success: false, error: msg };
  }
}

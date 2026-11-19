'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Server action to verify if an email or phone number belongs to an
 * authorized municipal staff member or administrator before issuing an OTP.
 * Public self-registration is strictly disallowed for staff and admin roles.
 */
export async function verifyStaffEligibility(
  identifier: string
): Promise<{ eligible: boolean; message?: string }> {
  try {
    const clean = identifier.trim().toLowerCase();
    if (!clean) {
      return { eligible: false, message: 'Please provide a valid work email or phone number.' };
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const isEmail = clean.includes('@');

    let query = supabase.from('users').select('id, user_type, email, phone');
    if (isEmail) {
      query = query.ilike('email', clean);
    } else {
      const digitsOnly = clean.replace(/\D/g, '');
      const last10 = digitsOnly.slice(-10);
      query = query.or(`phone.eq.${clean},phone.eq.+${digitsOnly},phone.ilike.%${last10}%`);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return {
        eligible: false,
        message:
          'Access Denied: No staff or administrator account is associated with this credential. Sign-up is not allowed for staff/admin roles. Accounts must be provisioned by city administration.',
      };
    }

    if (data.user_type !== 'staff' && data.user_type !== 'admin') {
      return {
        eligible: false,
        message:
          'Access Restricted: This account is registered as a Citizen. Citizens cannot log in to the Municipal Staff/Admin portal. Please switch to the Citizen tab.',
      };
    }

    return { eligible: true };
  } catch (err) {
    console.error('Error verifying staff eligibility:', err);
    return {
      eligible: false,
      message: 'Unable to verify staff authorization. Please try again or contact administration.',
    };
  }
}

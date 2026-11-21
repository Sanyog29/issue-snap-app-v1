'use server';

import {
  sendComplaintConfirmationEmail,
  sendStatusUpdateEmail,
} from '@/modules/email';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rate-limit';

export async function dispatchComplaintConfirmationEmail(params: {
  userId?: string | null;
  complaintId: string;
  trackingToken: string;
  title: string;
  description: string;
  category: string;
  department: string;
  priority: string;
  locationAddress: string;
  reporterEmail?: string | null;
}) {
  try {
    let recipientEmail = params.reporterEmail?.trim() || null;
    let recipientName = '';

    // If userId provided, lookup their registered profile
    if (params.userId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('[Email Action] SUPABASE_SERVICE_ROLE_KEY is not set in environment. Reporter email lookup may fail if blocked by Row-Level Security.');
      }

      if (supabaseUrl && serviceRoleKey) {
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const { data: userProfile } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', params.userId)
          .maybeSingle();

        if (userProfile?.email) {
          recipientEmail = userProfile.email;
        }
        if (userProfile?.full_name) {
          recipientName = userProfile.full_name;
        }
      }
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.log(`[Email Action] No registered email found for reporter (${params.userId || 'anonymous'}); skipping email dispatch.`);
      return { sent: false, reason: 'no_email' };
    }

    // Rate-limiting check: max 5 emails per recipient per 60 seconds
    const rateCheck = checkRateLimit(`email:confirm:${recipientEmail}`, 5, 60_000);
    if (!rateCheck.success) {
      console.warn(`[Email Action] Rate limit reached for ${recipientEmail}. Cooling down for ${rateCheck.resetInSeconds}s.`);
      return { sent: false, error: 'Rate limit exceeded. Please wait a moment.' };
    }

    const result = await sendComplaintConfirmationEmail({
      to: recipientEmail,
      recipientName,
      complaintId: params.complaintId,
      trackingToken: params.trackingToken,
      title: params.title,
      description: params.description,
      category: params.category,
      department: params.department,
      priority: params.priority,
      locationAddress: params.locationAddress,
    });

    return {
      sent: result.success,
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error) {
    console.error('[Email Action Dispatch Error]', error);
    return { sent: false, error: String(error) };
  }
}

/**
 * Dispatches an automated email notification to the reporter whenever a municipal staff
 * member updates the status of their civic complaint.
 */
export async function dispatchStatusUpdateEmail(params: {
  requestId: string;
  newStatus: string;
  oldStatus?: string;
  staffNotes?: string;
}) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return { sent: false, error: 'Database environment configuration missing' };
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch complaint record details
    const { data: requestRow, error: reqErr } = await supabase
      .from('requests')
      .select('id, title, department, tracking_token, reporter_id, status')
      .eq('id', params.requestId)
      .maybeSingle();

    if (reqErr || !requestRow) {
      return { sent: false, error: 'Request not found' };
    }

    let recipientEmail: string | null = null;
    let recipientName = '';

    if (requestRow.reporter_id) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', requestRow.reporter_id)
        .maybeSingle();

      if (userProfile?.email) {
        recipientEmail = userProfile.email;
      }
      if (userProfile?.full_name) {
        recipientName = userProfile.full_name;
      }
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      console.log(`[Email Action] No registered email found for reporter of complaint ${params.requestId}; skipping status email.`);
      return { sent: false, reason: 'no_email' };
    }

    // Rate-limiting check: max 10 status emails per request per 60 seconds
    const rateCheck = checkRateLimit(`email:status:${params.requestId}`, 10, 60_000);
    if (!rateCheck.success) {
      console.warn(`[Email Action] Status email rate limit reached for complaint ${params.requestId}. Cooling down for ${rateCheck.resetInSeconds}s.`);
      return { sent: false, error: 'Rate limit exceeded for status updates.' };
    }

    const result = await sendStatusUpdateEmail({
      to: recipientEmail,
      recipientName,
      complaintId: requestRow.id,
      trackingToken: requestRow.tracking_token || requestRow.id,
      title: requestRow.title,
      oldStatus: params.oldStatus || requestRow.status,
      newStatus: params.newStatus,
      staffNotes: params.staffNotes,
      department: requestRow.department || 'Public Works',
    });

    return {
      sent: result.success,
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error) {
    console.error('[Status Email Dispatch Error]', error);
    return { sent: false, error: String(error) };
  }
}

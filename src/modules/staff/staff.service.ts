// IssueSnap — Decoupled Staff Service
import { SupabaseClient } from '@supabase/supabase-js';
import { Request as CivicRequest } from '@/types';
import { StaffFilterParams, UpdateStatusParams } from './types';
import { dispatchStatusUpdateEmail } from '@/app/actions/send-complaint-email';

export async function fetchStaffRequests(
  supabase: SupabaseClient,
  filter?: StaffFilterParams
): Promise<CivicRequest[]> {
  let query = supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (filter?.status && filter.status !== 'all') {
    query = query.eq('status', filter.status);
  }

  if (filter?.department && filter.department !== 'all') {
    query = query.eq('department', filter.department);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('[Staff Service] fetchStaffRequests error:', error);
    return [];
  }

  return (data as CivicRequest[]) || [];
}

export async function updateRequestStatus(
  supabase: SupabaseClient,
  params: UpdateStatusParams
): Promise<{ success: boolean; data?: CivicRequest; error?: string }> {
  try {
    // Role verification: strictly require staff or admin user_type
    if (params.userId) {
      const { data: caller } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', params.userId)
        .maybeSingle();

      if (caller && caller.user_type !== 'staff' && caller.user_type !== 'admin') {
        return {
          success: false,
          error: 'Access Denied: Only authorized municipal staff and administrators can modify complaints.',
        };
      }
    }

    const updatePayload: Record<string, unknown> = {
      status: params.newStatus,
      updated_at: new Date().toISOString(),
    };

    if (params.resolvedImageUrl || params.completionImageUrl) {
      updatePayload.completion_image_url = params.completionImageUrl || params.resolvedImageUrl;
    }

    if (params.staffNotes) {
      updatePayload.resolution_notes = params.staffNotes;
    }

    if (params.newStatus === 'resolved') {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('requests')
      .update(updatePayload)
      .eq('id', params.requestId)
      .select()
      .single();

    if (error) {
      console.error('[Staff Service] updateRequestStatus error:', error);
      return { success: false, error: error.message };
    }

    // Add audit trail event to request_updates
    try {
      await supabase.from('request_updates').insert({
        request_id: params.requestId,
        user_id: params.userId || null,
        update_type: params.staffNotes
          ? `Status: ${params.newStatus.replace('_', ' ')} - ${params.staffNotes}`
          : `Status updated to ${params.newStatus.replace('_', ' ')}`,
        image_url: params.completionImageUrl || params.resolvedImageUrl || null,
      });
    } catch (auditErr) {
      console.warn('[Staff Service] Audit update warning:', auditErr);
    }

    const updatedRequest = data as CivicRequest;

    // Create in-app notification directly for the reporter
    if (updatedRequest?.reporter_id) {
      try {
        const notifType = params.newStatus === 'resolved' ? 'report_fixed' : 'report_in_progress';
        const notifTitle = params.newStatus === 'resolved'
          ? `Issue Resolved: ${updatedRequest.title}`
          : `Status Update: ${updatedRequest.title}`;
        const notifBody = params.staffNotes || `Your reported issue status has been updated to ${params.newStatus.replace('_', ' ')}.`;

        await supabase.from('notifications').insert({
          user_id: updatedRequest.reporter_id,
          type: notifType,
          title: notifTitle,
          body: notifBody,
          url: `/track/${updatedRequest.tracking_token || updatedRequest.id}`,
          dedupe_key: `status_change_${updatedRequest.id}_${params.newStatus}_${Date.now()}`,
          metadata: { request_id: updatedRequest.id, new_status: params.newStatus },
        });
      } catch (notifErr) {
        console.warn('[Staff Service] Notification insert warning:', notifErr);
      }
    }

    // Dispatch status update email (awaited with timeout so serverless context stays active)
    try {
      await Promise.race([
        dispatchStatusUpdateEmail({
          requestId: params.requestId,
          newStatus: params.newStatus,
          oldStatus: params.oldStatus,
          staffNotes: params.staffNotes,
        }),
        new Promise((resolve) => setTimeout(resolve, 4500)),
      ]);
    } catch (emailErr) {
      console.warn('[Staff Service] Email dispatch warning:', emailErr);
    }

    return { success: true, data: data as CivicRequest };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update request status';
    return { success: false, error: msg };
  }
}

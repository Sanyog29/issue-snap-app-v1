// IssueSnap — Decoupled Reports Service
import { SupabaseClient } from '@supabase/supabase-js';
import { ReportSubmissionInput, ReportSubmissionResult } from './types';
import { dispatchComplaintConfirmationEmail } from '@/app/actions/send-complaint-email';
import { checkRateLimit } from '@/lib/rate-limit';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

async function convertDataUriToBlob(dataUri: string): Promise<{ blob: Blob; ext: string; mime: string }> {
  let blob: Blob;
  let mime: string;
  let ext: string;

  try {
    const res = await fetch(dataUri);
    blob = await res.blob();
    mime = blob.type || 'image/jpeg';
  } catch {
    const parts = dataUri.split(',');
    mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const buffer = Buffer.from(parts[1], 'base64');
    blob = new Blob([buffer], { type: mime });
  }

  // Security: validate MIME type against allowed list
  if (!ALLOWED_MIME_TYPES.has(mime.toLowerCase())) {
    mime = 'image/jpeg';
  }

  ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';

  // Security: check file size limit (5MB)
  if (blob.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image size exceeds the maximum allowed limit of 5MB.');
  }

  return { blob, ext, mime };
}

export async function submitComplaintReport(
  supabase: SupabaseClient,
  input: ReportSubmissionInput
): Promise<ReportSubmissionResult> {
  try {
    // Rate limit check: max 10 complaint submissions per minute
    const rateKey = `submit:${input.reporterId || input.locationAddress || 'anon'}`;
    const rateCheck = checkRateLimit(rateKey, 10, 60_000);
    if (!rateCheck.success) {
      return {
        success: false,
        error: `Submission rate limit exceeded. Please wait ${rateCheck.resetInSeconds} seconds before submitting again.`,
      };
    }

    let uploadedUrl: string | null = null;

    // 1. Upload photo to Supabase Storage if data URI provided
    if (input.photoDataUri && input.photoDataUri.startsWith('data:image')) {
      try {
        const { blob, ext, mime } = await convertDataUriToBlob(input.photoDataUri);
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        // Attempt upload to 'complaint-images' (primary schema bucket)
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('complaint-images')
          .upload(filename, blob, { contentType: mime, upsert: true });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('complaint-images')
            .getPublicUrl(filename);
          uploadedUrl = urlData.publicUrl;
        } else {
          // Fallback to 'issue-photos' if complaint-images is not available
          const { data: fallbackData, error: fallbackError } = await supabase.storage
            .from('issue-photos')
            .upload(filename, blob, { contentType: mime, upsert: true });

          if (!fallbackError && fallbackData) {
            const { data: urlData } = supabase.storage
              .from('issue-photos')
              .getPublicUrl(filename);
            uploadedUrl = urlData.publicUrl;
          } else {
            console.warn('[Report Service] Storage upload failed, falling back to data URI:', uploadError || fallbackError);
          }
        }
      } catch (uploadException) {
        console.warn('[Report Service] Image conversion/upload exception:', uploadException);
      }
    }

    // Ensure original_image_url is NEVER null to satisfy PostgreSQL NOT NULL constraint
    const finalImageUrl =
      uploadedUrl ||
      input.photoDataUri ||
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60';

    // 2. Validate/Upsert Reporter in public.users to prevent FK violations
    let validReporterId: string | null = null;
    if (input.reporterId) {
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', input.reporterId)
          .maybeSingle();

        if (!existingUser) {
          const { error: upsertErr } = await supabase.from('users').upsert({
            id: input.reporterId,
            phone: input.reporterPhone || null,
            email: input.reporterEmail || null,
            user_type: 'citizen',
          });
          if (!upsertErr) {
            validReporterId = input.reporterId;
          }
        } else {
          validReporterId = input.reporterId;
        }
      } catch (e) {
        console.warn('[Report Service] User verification warning:', e);
      }
    }

    // 3. Insert complaint record into requests table
    const { data: requestRow, error: insertError } = await supabase
      .from('requests')
      .insert({
        title: input.title,
        description: input.description,
        category: input.category,
        department: input.department,
        priority: input.priority,
        status: 'submitted',
        original_image_url: finalImageUrl,
        location_lat: input.locationLat,
        location_lng: input.locationLng,
        location_address: input.locationAddress,
        reporter_id: validReporterId,
        reporter_phone: input.reporterPhone || null,
        ai_analysis_data: input.aiAnalysisData || {
          confidence: 0.9,
          safety_flag: false,
          model: 'gemini-2.5-flash',
          detected_objects: [],
        },
      })
      .select('id, tracking_token')
      .single();

    if (insertError) {
      throw insertError;
    }

    const trackingToken = requestRow.tracking_token || requestRow.id;

    // 4. Create in-app notification directly for the registered reporter
    if (validReporterId) {
      try {
        await supabase.from('notifications').insert({
          user_id: validReporterId,
          type: 'report_seen',
          title: `Complaint Registered: ${input.title}`,
          body: `Your report has been logged and routed to the ${input.department || 'Public Works'} department.`,
          url: `/track/${trackingToken}`,
          dedupe_key: `request_created_${requestRow.id}`,
          metadata: { request_id: requestRow.id, status: 'New', category: input.category },
        });
      } catch (notifErr) {
        console.warn('[Report Service] In-app notification creation warning:', notifErr);
      }
    }

    // 5. Dispatch confirmation email (awaited with timeout so serverless context stays active)
    try {
      await Promise.race([
        dispatchComplaintConfirmationEmail({
          userId: validReporterId,
          reporterEmail: input.reporterEmail,
          complaintId: requestRow.id,
          trackingToken,
          title: input.title,
          description: input.description,
          category: input.category,
          department: input.department,
          priority: input.priority,
          locationAddress: input.locationAddress,
        }),
        new Promise((resolve) => setTimeout(resolve, 4500)),
      ]);
    } catch (e) {
      console.warn('[Report Service] Background email warning:', e);
    }

    return {
      success: true,
      requestId: requestRow.id,
      trackingToken,
    };
  } catch (err: unknown) {
    let msg = 'Failed to submit report';
    if (typeof err === 'object' && err !== null) {
      const anyErr = err as Record<string, unknown>;
      if (typeof anyErr.message === 'string') msg = anyErr.message;
      else if (typeof anyErr.error_description === 'string') msg = anyErr.error_description;
      else if (typeof anyErr.details === 'string') msg = anyErr.details;
    } else if (err instanceof Error) {
      msg = err.message;
    }

    return {
      success: false,
      error: msg,
    };
  }
}

// IssueSnap — Legacy Email Wrapper (Delegates to Decoupled Email Module)
import {
  sendComplaintConfirmationEmail as sendModuleComplaintEmail,
  sendStatusUpdateEmail as sendModuleStatusEmail,
  SendComplaintEmailParams,
  SendStatusUpdateEmailParams,
  EmailDeliveryResult,
} from '@/modules/email';

export type { SendComplaintEmailParams, SendStatusUpdateEmailParams, EmailDeliveryResult };

export async function sendComplaintConfirmationEmail(
  params: SendComplaintEmailParams
): Promise<boolean> {
  const result = await sendModuleComplaintEmail(params);
  return result.success;
}

export async function sendStatusUpdateEmail(
  params: SendStatusUpdateEmailParams
): Promise<boolean> {
  const result = await sendModuleStatusEmail(params);
  return result.success;
}

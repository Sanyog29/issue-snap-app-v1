// IssueSnap — Email Module Types

export interface SendComplaintEmailParams {
  to: string;
  recipientName?: string;
  complaintId: string;
  trackingToken: string;
  title: string;
  description: string;
  category: string;
  department: string;
  priority: string;
  locationAddress: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface SendStatusUpdateEmailParams {
  to: string;
  recipientName?: string;
  complaintId: string;
  trackingToken: string;
  title: string;
  oldStatus: string;
  newStatus: string;
  staffNotes?: string;
  department: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  provider: 'nodemailer' | 'resend' | 'simulated' | 'none';
  messageId?: string;
  error?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

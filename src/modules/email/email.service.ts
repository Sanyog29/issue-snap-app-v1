// IssueSnap — Decoupled Email Service
// Supports Nodemailer (Gmail / Custom SMTP), Resend HTTP API, and Developer Simulation

import nodemailer, { type Transporter } from 'nodemailer';
import {
  SendComplaintEmailParams,
  SendStatusUpdateEmailParams,
  EmailDeliveryResult,
  SmtpConfig,
} from './types';
import { buildComplaintEmailHtml, buildStatusUpdateEmailHtml } from './templates';

function getSmtpConfig(): SmtpConfig | null {
  const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').trim();

  if (!user || !rawPass) {
    return null;
  }

  // Google 16-character App Passwords often contain spaces when copied (e.g. "abcd efgh ijkl mnop").
  // Strip inline comments (e.g. # comment), quotes, and all whitespace so authentication succeeds.
  const pass = rawPass.split('#')[0].replace(/['"]/g, '').trim().replace(/\s+/g, '');
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT || (host === 'smtp.gmail.com' ? 465 : 587));
  const secure = port === 465;
  const from = (process.env.SMTP_FROM || `"IssueSnap Civic Support" <${user}>`).trim();

  return { host, port, secure, user, pass, from };
}

let cachedTransporter: Transporter | null = null;

function getTransporter(config: SmtpConfig): Transporter {
  if (!cachedTransporter) {
    const isGmail = config.host.includes('gmail.com');
    cachedTransporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user: config.user,
              pass: config.pass,
            },
          }
        : {
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
              user: config.user,
              pass: config.pass,
            },
            tls: {
              rejectUnauthorized: false,
            },
          }
    );
  }
  return cachedTransporter;
}

/**
 * Shared multi-tier delivery driver for sending transactional emails.
 */
async function dispatchEmail(options: {
  to: string;
  subject: string;
  html: string;
  logLabel: string;
  trackingUrl?: string;
  recipientName?: string;
}): Promise<EmailDeliveryResult> {
  // 1. Try Nodemailer (SMTP / Gmail)
  const smtpConfig = getSmtpConfig();
  if (smtpConfig) {
    try {
      const transporter = getTransporter(smtpConfig);
      const info = await transporter.sendMail({
        from: smtpConfig.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      console.log(`[Email Service] ${options.logLabel} sent via Nodemailer to ${options.to} (MessageId: ${info.messageId})`);
      return {
        success: true,
        provider: 'nodemailer',
        messageId: info.messageId,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Email Service] Nodemailer delivery failed: ${errorMsg}`);
    }
  }

  // 2. Try Resend HTTP API if configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: process.env.SMTP_FROM || 'IssueSnap Civic Support <onboarding@resend.dev>',
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[Email Service] ${options.logLabel} sent via Resend to ${options.to}`);
        return {
          success: true,
          provider: 'resend',
          messageId: data.id,
        };
      } else {
        const errText = await res.text();
        console.warn(`[Email Service] Resend API returned error status ${res.status}: ${errText}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Email Service] Resend fetch failed: ${errorMsg}`);
    }
  }

  // 3. Fallback dev simulation
  console.log(`[Email Service Simulation] ${options.logLabel} generated for ${options.to}:
Subject: ${options.subject}
Recipient: ${options.recipientName || 'Citizen'} <${options.to}>
Tracking URL: ${options.trackingUrl || 'N/A'}
Status: Simulated (Configure SMTP_USER & SMTP_PASS in .env.local to enable live delivery via Gmail)`);

  return {
    success: false,
    provider: 'simulated',
    error: 'No active SMTP credentials or Resend API key configured. Simulated in console.',
  };
}

/**
 * Sends a complaint registration confirmation email to the citizen.
 */
export async function sendComplaintConfirmationEmail(
  params: SendComplaintEmailParams
): Promise<EmailDeliveryResult> {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002');
  const trackingUrl = `${origin}/track/${params.trackingToken}`;

  const subject = `[IssueSnap] Complaint Registered: ${params.title} (#${params.trackingToken.slice(0, 8)})`;
  const html = buildComplaintEmailHtml(params, trackingUrl);

  return dispatchEmail({
    to: params.to,
    subject,
    html,
    logLabel: 'Complaint Confirmation Email',
    trackingUrl,
    recipientName: params.recipientName,
  });
}

/**
 * Sends a complaint status update email to the citizen whenever a staff member
 * updates the request status (e.g. acknowledged, in_progress, resolved).
 */
export async function sendStatusUpdateEmail(
  params: SendStatusUpdateEmailParams
): Promise<EmailDeliveryResult> {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:9002');
  const trackingUrl = `${origin}/track/${params.trackingToken}`;

  const isResolved = params.newStatus.toLowerCase() === 'resolved';
  const statusFormatted = params.newStatus.replace(/_/g, ' ').toUpperCase();
  const subject = isResolved
    ? `[IssueSnap] ✅ Complaint Resolved: ${params.title} (#${params.trackingToken.slice(0, 8)})`
    : `[IssueSnap] 📋 Status Update (${statusFormatted}): ${params.title}`;

  const html = buildStatusUpdateEmailHtml(params, trackingUrl);

  return dispatchEmail({
    to: params.to,
    subject,
    html,
    logLabel: 'Status Update Email',
    trackingUrl,
    recipientName: params.recipientName,
  });
}

// IssueSnap — Email Templates Module

import { SendComplaintEmailParams, SendStatusUpdateEmailParams } from './types';

// ─── Shared Helpers ──────────────────────────────────────────────

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'resolved': return '#5CC48E';
    case 'in_progress': case 'in progress': return '#F0B25A';
    case 'acknowledged': return '#00BFFF';
    case 'rejected': return '#F28B82';
    case 'reopened': return '#F28B82';
    default: return '#9FB1BC';
  }
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Complaint Registration Email ────────────────────────────────

export function buildComplaintEmailHtml(
  params: SendComplaintEmailParams,
  trackingUrl: string
): string {
  const shortToken = params.trackingToken.slice(0, 8).toUpperCase();
  const dateFormatted = formatDate();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IssueSnap Complaint Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B1820; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E6EEF3;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B1820; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #13242E; border: 1px solid #1E3848; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding: 32px 28px 24px; background: linear-gradient(180deg, #162B37 0%, #13242E 100%); border-bottom: 1px solid #1E3848;">
              <table role="presentation" width="100%">
                <tr>
                  <td><span style="font-size: 20px; font-weight: 800; color: #00BFFF;">IssueSnap</span></td>
                  <td align="right"><span style="display: inline-block; padding: 4px 10px; background-color: rgba(0,191,255,0.15); border: 1px solid rgba(0,191,255,0.4); border-radius: 20px; color: #00BFFF; font-size: 11px; font-weight: 700;">#${shortToken}</span></td>
                </tr>
              </table>
              <h1 style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 20px 0 6px;">Complaint Registered Successfully</h1>
              <p style="font-size: 14px; color: #9FB1BC; margin: 0; line-height: 1.5;">Hello${params.recipientName ? ` ${params.recipientName}` : ''}, your civic issue report has been logged and assigned to municipal field action.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 28px;">
              <table role="presentation" width="100%" style="background-color: #0B1820; border: 1px solid #1E3848; border-radius: 12px; padding: 18px 20px;">
                <tr><td style="padding-bottom: 12px; border-bottom: 1px solid #1E3848;"><span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9FB1BC;">Title</span><div style="font-size: 16px; font-weight: 700; color: #FFFFFF; margin-top: 3px;">${params.title}</div></td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #1E3848;"><table role="presentation" width="100%"><tr><td width="50%"><span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9FB1BC;">Category</span><div style="font-size: 14px; font-weight: 600; color: #00BFFF; margin-top: 2px;">${params.category}</div></td><td width="50%"><span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9FB1BC;">Department</span><div style="font-size: 14px; font-weight: 600; color: #FFFFFF; margin-top: 2px;">${params.department}</div></td></tr></table></td></tr>
                <tr><td style="padding: 12px 0; border-bottom: 1px solid #1E3848;"><table role="presentation" width="100%"><tr><td width="50%"><span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9FB1BC;">Priority</span><div style="font-size: 13px; font-weight: 700; color: ${params.priority === 'urgent' ? '#F28B82' : '#F0B25A'}; text-transform: uppercase; margin-top: 2px;">${params.priority}</div></td><td width="50%"><span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9FB1BC;">Status</span><div style="font-size: 13px; font-weight: 700; color: #5CC48E; text-transform: uppercase; margin-top: 2px;">Submitted</div></td></tr></table></td></tr>
                <tr><td style="padding-top: 12px;"><span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9FB1BC;">Location</span><div style="font-size: 13px; color: #E6EEF3; margin-top: 3px;">${params.locationAddress || 'GPS Location Attached'}</div></td></tr>
              </table>
              <table role="presentation" width="100%" style="margin: 28px 0 16px;"><tr><td align="center"><a href="${trackingUrl}" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: #FF7F50; color: #0E2230; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(255,127,80,0.4);">Track Complaint Status Live &rarr;</a></td></tr></table>
              <p style="font-size: 12px; color: #9FB1BC; text-align: center; margin: 12px 0 0;">You will receive automated email updates when the status of this complaint changes.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 28px; background-color: #0B1820; border-top: 1px solid #1E3848; text-align: center;">
              <p style="font-size: 11px; color: #66808C; margin: 0 0 6px;">Reference: <code style="color: #9FB1BC; font-family: monospace;">${params.trackingToken}</code> &bull; ${dateFormatted}</p>
              <p style="font-size: 11px; color: #4F5D66; margin: 0;">Automated notification from Municipal Civic Reporter.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ─── Status Update Email ─────────────────────────────────────────

export function buildStatusUpdateEmailHtml(
  params: SendStatusUpdateEmailParams,
  trackingUrl: string
): string {
  const shortToken = params.trackingToken.slice(0, 8).toUpperCase();
  const dateFormatted = formatDate();
  const newColor = statusColor(params.newStatus);
  const newLabel = statusLabel(params.newStatus);
  const oldLabel = statusLabel(params.oldStatus);

  const isResolved = params.newStatus.toLowerCase() === 'resolved';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IssueSnap Status Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B1820; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E6EEF3;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B1820; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #13242E; border: 1px solid #1E3848; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding: 32px 28px 24px; background: linear-gradient(180deg, #162B37 0%, #13242E 100%); border-bottom: 1px solid #1E3848;">
              <table role="presentation" width="100%">
                <tr>
                  <td><span style="font-size: 20px; font-weight: 800; color: #00BFFF;">IssueSnap</span></td>
                  <td align="right"><span style="display: inline-block; padding: 4px 10px; background-color: rgba(0,191,255,0.15); border: 1px solid rgba(0,191,255,0.4); border-radius: 20px; color: #00BFFF; font-size: 11px; font-weight: 700;">#${shortToken}</span></td>
                </tr>
              </table>
              <h1 style="font-size: 22px; font-weight: 700; color: #FFFFFF; margin: 20px 0 6px;">
                ${isResolved ? '✅ Complaint Resolved' : '📋 Status Update'}
              </h1>
              <p style="font-size: 14px; color: #9FB1BC; margin: 0; line-height: 1.5;">
                Hello${params.recipientName ? ` ${params.recipientName}` : ''}, your complaint <strong style="color: #FFFFFF;">"${params.title}"</strong> has been updated.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 28px;">
              <table role="presentation" width="100%" style="background-color: #0B1820; border: 1px solid #1E3848; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 16px; border-bottom: 1px solid #1E3848;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9FB1BC;">Status Change</span>
                    <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px;">
                      <span style="display: inline-block; padding: 6px 14px; background-color: rgba(159,177,188,0.15); border: 1px solid rgba(159,177,188,0.3); border-radius: 8px; color: #9FB1BC; font-size: 13px; font-weight: 700; text-transform: uppercase;">${oldLabel}</span>
                      <span style="color: #9FB1BC; font-size: 16px;">&rarr;</span>
                      <span style="display: inline-block; padding: 6px 14px; background-color: ${newColor}20; border: 1px solid ${newColor}66; border-radius: 8px; color: ${newColor}; font-size: 13px; font-weight: 700; text-transform: uppercase;">${newLabel}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 0; border-bottom: 1px solid #1E3848;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9FB1BC;">Department</span>
                    <div style="font-size: 14px; font-weight: 600; color: #FFFFFF; margin-top: 3px;">${params.department}</div>
                  </td>
                </tr>
                ${params.staffNotes ? `
                <tr>
                  <td style="padding-top: 16px;">
                    <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: #9FB1BC;">Staff Notes</span>
                    <div style="font-size: 13px; color: #E6EEF3; margin-top: 5px; line-height: 1.5; background-color: #162B37; padding: 12px; border-radius: 8px; border: 1px solid #1E3848;">${params.staffNotes}</div>
                  </td>
                </tr>` : ''}
              </table>
              <table role="presentation" width="100%" style="margin: 28px 0 16px;">
                <tr>
                  <td align="center">
                    <a href="${trackingUrl}" style="display: block; width: 100%; box-sizing: border-box; text-align: center; background-color: ${isResolved ? '#5CC48E' : '#FF7F50'}; color: #0E2230; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 24px; border-radius: 10px; box-shadow: 0 4px 14px ${isResolved ? 'rgba(92,196,142,0.4)' : 'rgba(255,127,80,0.4)'};">
                      ${isResolved ? 'View Resolution Details &rarr;' : 'Track Live Status &rarr;'}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 28px; background-color: #0B1820; border-top: 1px solid #1E3848; text-align: center;">
              <p style="font-size: 11px; color: #66808C; margin: 0 0 6px;">Reference: <code style="color: #9FB1BC; font-family: monospace;">${params.trackingToken}</code> &bull; ${dateFormatted}</p>
              <p style="font-size: 11px; color: #4F5D66; margin: 0;">Automated notification from Municipal Civic Reporter.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

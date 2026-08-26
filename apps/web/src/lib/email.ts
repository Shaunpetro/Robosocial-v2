// apps/web/src/lib/email.ts
import { Resend } from 'resend';

let resendInstance: Resend | null = null;

function getResend() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is missing');
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

const defaultFrom = process.env.DEFAULT_FROM_EMAIL || 'Robosocial <noreply@robosocial.app>';
const activationFrom = process.env.ACTIVATION_FROM_EMAIL || 'Robosocial Activations <activations@atgsa.co.za>';

// ---------- Existing emails ----------

export async function sendWelcomeEmail(
  to: string,
  temporaryPassword: string,
  fromEmail?: string | null,
  licenseKey?: string | null
) {
  const r = getResend();
  let html = `
    <p>Hi,</p>
    <p>Your Robosocial account has been created.</p>
    <p><strong>Login:</strong> ${to}<br />
    <strong>Password:</strong> ${temporaryPassword}</p>`;
  if (licenseKey) {
    html += `<p><strong>License Key:</strong> ${licenseKey}</p>
             <p>Keep this key safe. You will need it to access the dashboard.</p>`;
  }
  html += `<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Click here to log in</a></p>
           <p>You can change your password after logging in.</p>`;

  await r.emails.send({
    from: fromEmail || defaultFrom,
    to,
    subject: 'Welcome to Robosocial â€“ Your Account is Ready',
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  newPassword: string,
  fromEmail?: string | null,
  licenseKey?: string | null
) {
  const r = getResend();
  let html = `
    <p>Hi,</p>
    <p>Your password has been reset by an administrator.</p>
    <p><strong>New Password:</strong> ${newPassword}</p>`;
  if (licenseKey) {
    html += `<p><strong>License Key:</strong> ${licenseKey}</p>`;
  }
  html += `<p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Log in here</a></p>`;

  await r.emails.send({
    from: fromEmail || defaultFrom,
    to,
    subject: 'Your Robosocial Password Has Been Reset',
    html,
  });
}

export async function sendLicenseKeyEmail(
  to: string,
  licenseKey: string,
  customerName: string
) {
  const r = getResend();
  await r.emails.send({
    from: activationFrom,
    to,
    subject: `Your Robosocial License Key for ${customerName}`,
    html: `
      <p>Hi,</p>
      <p>Your license key for <strong>${customerName}</strong> is:</p>
      <p><code>${licenseKey}</code></p>
      <p>Keep this key safe. You will need it to access the dashboard.</p>
    `,
  });
}

// ---------- NEW: Media-specific emails ----------

export async function sendMediaCleanupReminderEmail(
  to: string,
  companyName: string,
  mediaCount: number
) {
  const r = getResend();
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  await r.emails.send({
    from: defaultFrom,
    to,
    subject: `ðŸ“¸ Your media library for ${companyName} has been cleaned up`,
    html: `
      <p>Hi,</p>
      <p>Your media library for <strong>${companyName}</strong> has been automatically cleaned up.</p>
      <p>${mediaCount} expired file(s) were removed because they were older than 14 days.</p>
      <p>If your library is now empty, we recommend uploading fresh media to keep your content engaging.</p>
      <p>
        <a href="${dashboardUrl}/media" style="background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;">
          Upload New Media
        </a>
      </p>
      <p>Best regards,<br/>The Robosocial Team</p>
    `,
  });
}

export async function sendMediaHealthReportEmail(
  to: string,
  companyName: string,
  report: {
    totalMedia: number;
    unusedMedia: number;
    expiringSoon: number;
    recommendations: string[];
    suggestedTypes: string[];
  }
) {
  const r = getResend();
  const { totalMedia, unusedMedia, expiringSoon, recommendations, suggestedTypes } = report;
  const recsHtml = recommendations.length
    ? `<ul>${recommendations.map(r => `<li>${r}</li>`).join('')}</ul>`
    : '<p>No specific recommendations at this time.</p>';
  const typesHtml = suggestedTypes.length
    ? suggestedTypes.join(', ')
    : 'various formats';

  await r.emails.send({
    from: defaultFrom,
    to,
    subject: `ðŸ“Š Media Library Health Report for ${companyName}`,
    html: `
      <h2>Media Health Report â€“ ${companyName}</h2>
      <p><strong>Total files:</strong> ${totalMedia}</p>
      <p><strong>Unused / not attached to any post:</strong> ${unusedMedia}</p>
      <p><strong>Expiring within 7 days:</strong> ${expiringSoon}</p>
      <h3>Recommendations</h3>
      ${recsHtml}
      <h3>Suggested content types to focus on</h3>
      <p>${typesHtml}</p>
      <p>Keep your library fresh to maintain high engagement!</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/media">View Media Library</a></p>
    `,
  });
}
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

export async function sendWelcomeEmail(
  to: string,
  temporaryPassword: string,
  fromEmail?: string | null
) {
  const r = getResend();
  await r.emails.send({
    from: fromEmail || defaultFrom,
    to,
    subject: 'Welcome to Robosocial – Your Account is Ready',
    html: `
      <p>Hi,</p>
      <p>Your Robosocial account has been created.</p>
      <p><strong>Login:</strong> ${to}<br />
      <strong>Password:</strong> ${temporaryPassword}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Click here to log in</a></p>
      <p>You can change your password after logging in.</p>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  newPassword: string,
  fromEmail?: string | null
) {
  const r = getResend();
  await r.emails.send({
    from: fromEmail || defaultFrom,
    to,
    subject: 'Your Robosocial Password Has Been Reset',
    html: `
      <p>Hi,</p>
      <p>Your password has been reset by an administrator.</p>
      <p><strong>New Password:</strong> ${newPassword}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Log in here</a></p>
    `,
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
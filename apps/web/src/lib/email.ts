// apps/web/src/lib/email.ts
let resend: import('resend').Resend | null = null;

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is missing');
    resend = new (require('resend').Resend)(apiKey);
  }
  return resend;
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
    html: `...`, // same as before
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
    html: `...`,
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
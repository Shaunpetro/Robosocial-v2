// apps/web/src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const defaultFrom = process.env.DEFAULT_FROM_EMAIL || 'Robosocial <noreply@robosocial.app>';

export async function sendWelcomeEmail(
  to: string,
  temporaryPassword: string,
  fromEmail?: string | null
) {
  await resend.emails.send({
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
  await resend.emails.send({
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
import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY || "");
  return _resend;
}

const FROM = process.env.EMAIL_FROM || "HeliOS <onboarding@resend.dev>";

export async function sendVerificationEmail(to: string, code: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Verify your HeliOS account",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #F8FAFC; font-size: 24px; margin: 0;">HeliOS</h1>
          <p style="color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 4px;">AI Financial OS</p>
        </div>
        <div style="background: #151B2E; border: 1px solid #1E293B; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #CBD5E1; font-size: 14px; margin: 0 0 8px;">Welcome, ${name}!</p>
          <p style="color: #94A3B8; font-size: 13px; margin: 0 0 24px;">Enter this code to verify your email address:</p>
          <div style="background: #0B1020; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 0 0 24px;">
            <span style="color: #F8FAFC; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: 'JetBrains Mono', monospace;">${code}</span>
          </div>
          <p style="color: #64748B; font-size: 12px; margin: 0;">This code expires in 10 minutes.</p>
        </div>
        <p style="color: #475569; font-size: 11px; text-align: center; margin-top: 24px;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string, name: string) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: "Reset your HeliOS password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #F8FAFC; font-size: 24px; margin: 0;">HeliOS</h1>
          <p style="color: #64748B; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; margin-top: 4px;">AI Financial OS</p>
        </div>
        <div style="background: #151B2E; border: 1px solid #1E293B; border-radius: 12px; padding: 32px; text-align: center;">
          <p style="color: #CBD5E1; font-size: 14px; margin: 0 0 8px;">Hi ${name},</p>
          <p style="color: #94A3B8; font-size: 13px; margin: 0 0 24px;">Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #6366F1; color: #FFFFFF; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">Reset Password</a>
          <p style="color: #64748B; font-size: 12px; margin: 24px 0 0;">This link expires in 15 minutes.</p>
        </div>
        <p style="color: #475569; font-size: 11px; text-align: center; margin-top: 24px;">
          If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  });
}

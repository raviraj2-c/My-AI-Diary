/**
 * Email service helper using Nodemailer.
 * Supports SMTP configuration and safe development console fallback.
 */

const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass }
    });
  }
  return null;
}

/**
 * Sends a password reset email or logs to console in development.
 *
 * @param {string} toEmail
 * @param {string} resetToken
 * @returns {Promise<boolean>}
 */
async function sendPasswordResetEmail(toEmail, resetToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

  const transporter = createTransporter();

  const subject = 'MindDiary - Password Reset Instructions';
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b; background: #fafaf9; border-radius: 16px;">
      <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
      <p style="font-size: 14px; line-height: 1.6;">Hello,</p>
      <p style="font-size: 14px; line-height: 1.6;">
        We received a request to reset your MindDiary account password. Click the button below to choose a new password. This link is single-use and will expire in 30 minutes.
      </p>
      <div style="margin: 28px 0; text-align: center;">
        <a href="${resetLink}" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 12px 28px; font-weight: 600; text-decoration: none; border-radius: 12px; font-size: 14px;">
          Reset My Password
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
        Or copy and paste this link into your browser:<br/>
        <a href="${resetLink}" style="color: #0d9488; word-break: break-all;">${resetLink}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 11px; color: #94a3b8;">
        If you did not request this, you can safely ignore this email. Your account remains secure.
      </p>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"MindDiary" <support@minddiary.app>',
        to: toEmail,
        subject,
        html
      });
      return true;
    } catch (err) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('[WARNING] SMTP send failed for password reset email');
        return false;
      }
      console.error('SMTP Send Error:', err.message);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    if (!transporter) {
      console.warn('[WARNING] SMTP not configured for password reset email');
    }
    return false;
  }

  // Development Fallback: output clearly in console only when NODE_ENV === 'development'
  if (process.env.NODE_ENV === 'development') {
    console.log('----------------------------------------------------');
    console.log(`[DEV EMAIL FALLBACK] Password Reset Link for ${toEmail}:`);
    console.log(resetLink);
    console.log('----------------------------------------------------');
  }
  return true;
}

module.exports = {
  sendPasswordResetEmail
};

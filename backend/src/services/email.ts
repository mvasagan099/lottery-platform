/**
 * Email Service using Nodemailer
 */

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

const templates: Record<string, (data: any) => string> = {
  'email-verification': (d) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1f3c 0%, #2d3561 100%); padding: 40px; text-align: center;">
        <h1 style="color: #f4b942; margin: 0; font-size: 28px;">MegaDraw</h1>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <h2>Hi ${d.name},</h2>
        <p>Welcome to MegaDraw! Please verify your email to start playing.</p>
        <a href="${d.verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #f4b942; color: #1a1f3c; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Verify Email Address
        </a>
        <p style="color: #666; font-size: 14px;">This link expires in 24 hours. If you didn't register, ignore this email.</p>
      </div>
    </div>
  `,
  'password-reset': (d) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1f3c 0%, #2d3561 100%); padding: 40px; text-align: center;">
        <h1 style="color: #f4b942; margin: 0; font-size: 28px;">MegaDraw</h1>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <h2>Hi ${d.name},</h2>
        <p>We received a request to reset your password. Click below to continue:</p>
        <a href="${d.resetUrl}" style="display: inline-block; padding: 14px 32px; background: #f4b942; color: #1a1f3c; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
          Reset Password
        </a>
        <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    </div>
  `,
  'ticket-confirmation': (d) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1f3c 0%, #2d3561 100%); padding: 40px; text-align: center;">
        <h1 style="color: #f4b942; margin: 0; font-size: 28px;">MegaDraw</h1>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <h2>Ticket Confirmed! 🎉</h2>
        <p>Hi ${d.name}, your ${d.gameName} ticket has been purchased.</p>
        <p><strong>Ticket #:</strong> ${d.ticketNumber}</p>
        <p><strong>Draw Date:</strong> ${d.drawDate}</p>
        <p><strong>Amount:</strong> $${d.amount} AUD</p>
        <p>Good luck!</p>
      </div>
    </div>
  `,
  'winning-notification': (d) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a1f3c 0%, #2d3561 100%); padding: 40px; text-align: center;">
        <h1 style="color: #f4b942; margin: 0; font-size: 28px;">🏆 You Won!</h1>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <h2>Congratulations ${d.name}!</h2>
        <p>Your ticket <strong>#${d.ticketNumber}</strong> has won <strong>${d.division}</strong>!</p>
        <p style="font-size: 36px; color: #f4b942; font-weight: bold;">$${d.amount} AUD</p>
        <p>Your prize will be credited to your wallet within 24 hours.</p>
      </div>
    </div>
  `,
}

export async function sendEmail({ to, subject, template, data }: EmailOptions): Promise<void> {
  const html = templates[template]?.(data) || `<p>${JSON.stringify(data)}</p>`

  // If no SMTP user is configured, just log the email contents to the terminal for local testing
  if (!process.env.SMTP_USER) {
    console.log('\n======================================================')
    console.log(`✉️ MOCK EMAIL SENT TO: ${to}`)
    console.log(`Subject: ${subject}`)
    if (data.verifyUrl) console.log(`👉 VERIFICATION LINK: ${data.verifyUrl}`)
    if (data.resetUrl) console.log(`👉 RESET LINK: ${data.resetUrl}`)
    console.log('======================================================\n')
    return
  }

  try {
    await transporter.sendMail({
      from: `MegaDraw <${process.env.FROM_EMAIL || 'noreply@MegaDraw.com'}>`,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Email send error:', error)
    // Don't throw - email failures shouldn't break the main flow
  }
}

/**
 * Email Service — uses Resend (primary) with Nodemailer/SMTP as fallback
 *
 * Resend is preferred because Gmail SMTP blocks connections from shared cloud IPs (Render, Railway, etc.)
 * Set RESEND_API_KEY in your environment to enable Resend.
 * Falls back to SMTP (nodemailer) if RESEND_API_KEY is not set.
 */

import { Resend } from 'resend'
import nodemailer from 'nodemailer'

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
        <p><strong>Amount:</strong> $${d.amount} USD</p>
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
        <p style="font-size: 36px; color: #f4b942; font-weight: bold;">$${d.amount} USD</p>
        <p>Your prize will be credited to your wallet within 24 hours.</p>
      </div>
    </div>
  `,
}

async function sendViaResend(to: string, subject: string, html: string, from: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({ from, to, subject, html })
  if (error) throw new Error(`Resend error: ${error.message}`)
}

async function sendViaSMTP(to: string, subject: string, html: string, from: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  })
  try {
    await transporter.sendMail({ from, to, subject, html })
  } finally {
    transporter.close()
  }
}

export async function sendEmail({ to, subject, template, data }: EmailOptions): Promise<void> {
  const html = templates[template]?.(data) || `<p>${JSON.stringify(data)}</p>`
  const from = `MegaDraw <${process.env.FROM_EMAIL || 'noreply@MegaDraw.com'}>`

  // No credentials configured — mock email for local dev
  if (!process.env.RESEND_API_KEY && !process.env.SMTP_USER) {
    console.log('\n======================================================')
    console.log(`✉️ MOCK EMAIL SENT TO: ${to}`)
    console.log(`Subject: ${subject}`)
    if (data.verifyUrl) console.log(`👉 VERIFICATION LINK: ${data.verifyUrl}`)
    if (data.resetUrl) console.log(`👉 RESET LINK: ${data.resetUrl}`)
    console.log('======================================================\n')
    return
  }

  const MAX_ATTEMPTS = 2
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      if (process.env.RESEND_API_KEY) {
        await sendViaResend(to, subject, html, from)
      } else {
        await sendViaSMTP(to, subject, html, from)
      }
      return // success
    } catch (error) {
      lastError = error
      console.error(`Email send attempt ${attempt}/${MAX_ATTEMPTS} failed:`, error)
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1500 * attempt))
      }
    }
  }

  throw new Error(`Failed to send email after ${MAX_ATTEMPTS} attempts: ${lastError}`)
}

/**
 * Email Service — uses Resend (primary) with Nodemailer/SMTP as fallback
 *
 * Resend is preferred because Gmail SMTP blocks connections from shared cloud IPs (Render, Railway, etc.)
 * Set RESEND_API_KEY in your environment to enable Resend.
 * Falls back to SMTP (nodemailer) if RESEND_API_KEY is not set.
 */
interface EmailOptions {
    to: string;
    subject: string;
    template: string;
    data: Record<string, any>;
}
export declare function sendEmail({ to, subject, template, data }: EmailOptions): Promise<void>;
export {};
//# sourceMappingURL=email.d.ts.map
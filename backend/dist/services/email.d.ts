/**
 * Email Service using Nodemailer
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
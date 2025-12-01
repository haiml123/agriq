import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface InviteEmailData {
  email: string;
  inviteUrl: string;
  organizationName: string;
  roleName: string;
  siteName?: string;
  inviterName: string;
  expiresAt: Date;
}

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.fromEmail = this.configService.get<string>('EMAIL_FROM') || 'noreply@agriq.com';
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME') || 'AgriQ';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    // Initialize transporter based on environment
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailProvider = this.configService.get<string>('EMAIL_PROVIDER') || 'smtp';

    switch (emailProvider) {
      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: this.configService.get<string>('SENDGRID_API_KEY'),
          },
        });
        break;

      case 'resend':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.resend.com',
          port: 465,
          secure: true,
          auth: {
            user: 'resend',
            pass: this.configService.get<string>('RESEND_API_KEY'),
          },
        });
        break;

      case 'mailgun':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: this.configService.get<string>('MAILGUN_USER'),
            pass: this.configService.get<string>('MAILGUN_PASSWORD'),
          },
        });
        break;

      case 'smtp':
      default:
        this.transporter = nodemailer.createTransport({
          host: this.configService.get<string>('SMTP_HOST') || 'localhost',
          port: this.configService.get<number>('SMTP_PORT') || 587,
          secure: this.configService.get<boolean>('SMTP_SECURE') || false,
          auth: {
            user: this.configService.get<string>('SMTP_USER'),
            pass: this.configService.get<string>('SMTP_PASSWORD'),
          },
        });
        break;
    }

    // Verify connection on startup (non-blocking)
    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connected successfully');
    } catch (error) {
      this.logger.warn(`Email service connection failed: ${error.message}`);
      this.logger.warn('Emails will be logged to console instead');
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);

      // In development, log the email content
      if (this.configService.get<string>('NODE_ENV') !== 'production') {
        this.logger.debug('Email content that would have been sent:');
        this.logger.debug(`To: ${to}`);
        this.logger.debug(`Subject: ${subject}`);
        this.logger.debug(`HTML: ${html}`);
      }

      return false;
    }
  }

  /**
   * Send invite email
   */
  async sendInviteEmail(data: InviteEmailData): Promise<boolean> {
    const {
      email,
      inviteUrl,
      organizationName,
      roleName,
      siteName,
      inviterName,
      expiresAt,
    } = data;

    const fullInviteUrl = `${this.frontendUrl}${inviteUrl}`;
    const expiresFormatted = expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const subject = `You've been invited to join ${organizationName} on AgriQ`;

    const html = this.getInviteEmailTemplate({
      organizationName,
      roleName,
      siteName,
      inviterName,
      inviteUrl: fullInviteUrl,
      expiresFormatted,
    });

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Invite email HTML template
   */
  private getInviteEmailTemplate(data: {
    organizationName: string;
    roleName: string;
    siteName?: string;
    inviterName: string;
    inviteUrl: string;
    expiresFormatted: string;
  }): string {
    const { organizationName, roleName, siteName, inviterName, inviteUrl, expiresFormatted } = data;

    const scopeText = siteName
      ? `as a <strong>${roleName}</strong> for <strong>${siteName}</strong>`
      : `as a <strong>${roleName}</strong>`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to AgriQ</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #0e1512; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #54d5a4; font-size: 28px; font-weight: 700;">AgriQ</h1>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 14px;">Grain Storage Management Platform</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">
                You're Invited! 🎉
              </h2>
              
              <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on AgriQ ${scopeText}.
              </p>

              <p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Click the button below to create your account and get started.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${inviteUrl}" 
                       style="display: inline-block; padding: 16px 32px; background-color: #54d5a4; color: #0e1512; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration Notice -->
              <p style="margin: 30px 0 0; padding: 16px; background-color: #fef3c7; border-radius: 8px; color: #92400e; font-size: 14px; text-align: center;">
                ⏰ This invitation expires on <strong>${expiresFormatted}</strong>
              </p>

              <!-- Link fallback -->
              <p style="margin: 30px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #54d5a4; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 12px 0 0; color: #9ca3af; font-size: 13px; text-align: center;">
                © ${new Date().getFullYear()} AgriQ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Convert HTML to plain text (simple version)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*<\/style>/gi, '')
      .replace(/<script[^>]*>.*<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

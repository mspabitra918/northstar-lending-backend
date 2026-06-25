import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { LoanApplication } from '../applications/models/application.model';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import {
  formatPacificDateTime,
  formatPacificLongDate,
} from '../common/utils/timezone';

export interface EmailAttachment {
  filename: string;
  data: Buffer;
  contentType?: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  attachment?: EmailAttachment[];
}
interface StatusUpdateDetails {
  applicationId: string;
  firstName: string;
  email: string;
  loanAmount: number;
  status: ApplicationStatus;
  last_name: string;
  id: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private mailgun: any;
  private domain: string;

  // constructor(private readonly config: ConfigService) {
  //   const mailgun = new Mailgun(FormData);
  //   this.mailgun = mailgun.client({
  //     username: 'api',
  //     key: this.config.get<string>('MAILGUN_API_KEY') ?? '',
  //   });
  //   this.domain = this.config.get<string>('MAILGUN_DOMAIN') ?? '';
  // }
  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get<string>('USER_MAIL'),
        pass: this.config.get<string>('USER_PASSWORD'),
      },
    });
  }

  // private async sendMailgunEmail(payload: EmailPayload): Promise<void> {
  //   try {
  //     const message: Record<string, any> = {
  //       from: this.config.get<string>(
  //         'MAILGUN_FROM',
  //         'Northstar Lending <noreply@northstarlend.com>',
  //       ),
  //       to: payload.to,
  //       subject: payload.subject,
  //       html: payload.html,
  //     };

  //     // Mailgun.js takes attachments as { filename, data } objects (data may be
  //     // a Buffer). Only set the field when files are actually present.
  //     if (payload.attachment?.length) {
  //       message.attachment = payload.attachment.map((a) => ({
  //         filename: a.filename,
  //         data: a.data,
  //         contentType: a.contentType,
  //       }));
  //     }

  //     await this.mailgun.messages.create(this.domain, message);
  //     this.logger.log(`Email sent to ${payload.to}: ${payload.subject}`);
  //   } catch (err) {
  //     this.logger.error(`Failed to send email to ${payload.to}`, err);
  //   }
  // }

  private async sendEmail(payload: EmailPayload): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('USER_MAIL'),
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        attachments: payload.attachment?.map((a) => ({
          filename: a.filename,
          content: a.data,
          contentType: a.contentType,
        })),
      });

      this.logger.log(`Email sent to ${payload.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${payload.to}`, error);
    }
  }

  // ── New Loan Application Alert to Admin ───────────────────────
  async sendApplicationConfirmationEmail(
    details: LoanApplication,
  ): Promise<void> {
    const {
      id,
      application_id,
      first_name,
      last_name,
      email,
      loan_amount,
      loan_term,
      //   loan_purpose,
    } = details;

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(loan_amount);

    // const purposeLabel = loan_purpose
    //   .replace(/-/g, ' ')
    //   .replace(/\b\w/g, (c) => c.toUpperCase());

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
     <div style="background:#F0FFF4;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
  <span style="font-size:42px;color:#F5B324;vertical-align:middle;">✦</span>
  <span
    style="
      font-family:Arial,Helvetica,sans-serif;
      font-size:28px;
      font-weight:700;
      color:#172554;
      margin-left:10px;
    "
  >
    Northstar
  </span>
  <span
    style="
      font-family:Arial,Helvetica,sans-serif;
      font-size:28px;
      font-weight:700;
      color:#F5A623;
    "
  >
    Lending
  </span>
</div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #111827; margin-top: 0;">Application Received!</h2>
        <p style="color: #374151; font-size: 16px;">
          Hi ${first_name},
        </p>
        <p style="color: #374151; font-size: 16px;">
          Thank you for submitting your loan application. We have received your application and it is now being processed.
        </p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #111827; margin-top: 0;">Application Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Application ID</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${application_id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Applicant Name</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${first_name} ${last_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Loan Amount</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Loan Term</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${loan_term} months</td>
            </tr>
          </table>
        </div>
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            <strong>Next Step:</strong> Please complete the bank verification process to proceed with your application.
          </p>
        </div>
        <p style="color: #374151; font-size: 14px;">
          Please save your Application ID <strong>${application_id}</strong> for future reference. You can use it to check your application status at any time.
        </p>
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL}/verify-bank?id=${id}&ref=${application_id}&name=${last_name}" style="background: #1a56db; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">Verify Bank Account</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <div style="text-align: center; padding: 10px 0;">
          <p style="color: #374151; font-size: 14px; margin: 5px 0;">
            <strong>Phone:</strong> <a href="tel:+17472005228" style="color: #1a56db; text-decoration: none;">(747) 208-0334</a>
          </p>
          <p style="color: #374151; font-size: 14px; margin: 5px 0;">
            <strong>Website:</strong> <a href="https://www.northstarlend.com" style="color: #1a56db; text-decoration: none;">www.northstarlend.com</a>
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          This is an automated email from Northstar Lending. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

    await this.sendEmail({
      to: email,
      subject: `Application Received - ID: ${application_id} | Northstar Lending`,
      html,
    });
  }

  statusConfig: Record<
    string,
    {
      title: string;
      message: string;
      color: string;
      icon: string;
      subject?: string;
      customBody?: (
        details: StatusUpdateDetails,
        formattedAmount: string,
      ) => string;
    }
  > = {
    // Stage 1 on the status portal: "Application Submitted". Details are stored;
    // the next action for the applicant is to connect and verify their bank.
    APPLICATION_SUBMITTED: {
      title: 'Application Submitted',
      message:
        'Your details are safely stored. The next step is to connect your bank to verify your account so we can move your application forward.',
      color: '#f59e0b',
      icon: '&#127974;',
    },
    // Still part of stage 1 from the applicant's point of view — bank not yet
    // verified, so the portal keeps showing "Action needed: verify your bank".
    BANK_VERIFICATION_PENDING: {
      title: 'Action Needed: Verify Your Bank',
      message:
        'We still need to verify your bank account before we can move your application forward. It only takes a couple of minutes — please complete bank verification to continue.',
      color: '#f59e0b',
      icon: '&#127974;',
    },
    // Stage 2: "Phone Verification" — a loan specialist confirms details by phone.
    PHONE_VERIFICATION_PENDING: {
      title: 'Phone Verification',
      message:
        'Your bank account is verified. A loan specialist will call you shortly to confirm a few details and move your application toward funding.',
      color: '#2563eb',
      icon: '&#128222;',
    },
    // Stage 3: "Sign Agreement".
    SIGN_LOAN_AGREEMENT: {
      title: 'Action Needed: Sign Your Loan Agreement',
      subject: 'Sign your loan agreement to continue | Northstar Lending',
      message:
        'Your loan agreement is ready. Please review and electronically sign it from your secure status portal to continue with your application.',
      color: '#1a56db',
      icon: '&#9997;',
    },
    // Stage 4: "Verification Deposit" — a positive, near-funding step. A small
    // micro-deposit confirms routing details before funds are released.
    VERIFICATION_DEPOSIT: {
      title: 'Verification Deposit',
      message:
        "You're almost there! A small micro-deposit has been initiated to confirm your routing details before we release your funds. This is the final check before funding",
      color: '#2563eb',
      icon: '&#128176;',
    },
    DOCUMENT_REQUEST: {
      title: 'Additional Documents Required',
      message:
        'Your application is currently under review. To proceed, please upload the requested documents through your portal. Processing will resume as soon as all required documents have been received and verified.',
      color: '#f59e0b',
      icon: '&#128221;', // 📝
    },
    DECLINED: {
      title: 'Application Update',
      message:
        "After careful review, we're unable to approve your loan application at this time. You'll receive an adverse action notice by email with details about this decision and your rights. If you have any questions, please don't hesitate to contact our support team.",
      color: '#dc2626',
      icon: '&#10060;',
    },
    FUNDED: {
      title: 'Loan Funded!',
      subject: 'Approved: Your Northstar Lending loan is funded!',
      message: '',
      customBody: (details) => `
      <p style="color: #374151; font-size: 16px;">Hello ${details.firstName},</p>
      <p style="color: #374151; font-size: 16px;">Great news! Your loan application has been fully approved and finalized.</p>
      <p style="color: #374151; font-size: 16px;">The funds are on their way and will be deposited into your registered bank account within the next 24 hours. (Exact availability depends on your bank's standard processing times.)</p>
      <p style="color: #374151; font-size: 16px;">Your official loan agreement and repayment schedule are now available in your secure online portal.</p>
      <p style="color: #374151; font-size: 16px;">If you do not see the funds in your account after 24 hours, please call your dedicated Loan Officer immediately.</p>
      <p style="color: #374151; font-size: 16px;">Best regards,<br/>The Northstar Lending Funding Team<br/>Direct Support: (747) 208-0334</p>
    `,
      color: '#16a34a',
      icon: '&#9989;',
    },
  };

  async sendStatusUpdateEmail(details: StatusUpdateDetails): Promise<void> {
    const {
      applicationId,
      firstName,
      email,
      loanAmount,
      status,
      last_name,
      id,
    } = details;

    const config = this.statusConfig[status];
    if (!config) return;

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(loanAmount);

    // Mirror the lifecycle labels the applicant sees on the status portal so the
    // badge in the email matches the website exactly.
    const statusLabelMap: Record<string, string> = {
      APPLICATION_SUBMITTED: 'Application Submitted',
      BANK_VERIFICATION_PENDING: 'Bank Verification',
      PHONE_VERIFICATION_PENDING: 'Phone Verification',
      DOCUMENT_REQUEST: 'Document Request',
      SIGN_LOAN_AGREEMENT: 'Sign Agreement',
      VERIFICATION_DEPOSIT: 'Verification Deposit',
      FUNDED: 'Funded',
      DECLINED: 'Declined',
    };
    const statusLabel = statusLabelMap[status] ?? status.replace(/_/g, ' ');

    const subject =
      config.subject ||
      `${config.title} - ID: ${applicationId} | Northstar Lending`;

    const messageHtml = config.customBody
      ? config.customBody(details, formattedAmount)
      : `
        <p style="color: #374151; font-size: 16px;">
          Hi ${firstName},
        </p>
        <p style="color: #374151; font-size: 16px;">
          ${config.message}
        </p>
      `;

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background:#F0FFF4;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
  <span style="font-size:42px;color:#F5B324;vertical-align:middle;">✦</span>
  <span
    style="
      font-family:Arial,Helvetica,sans-serif;
      font-size:28px;
      font-weight:700;
      color:#172554;
      margin-left:10px;
    "
  >
    Northstar
  </span>
  <span
    style="
      font-family:Arial,Helvetica,sans-serif;
      font-size:28px;
      font-weight:700;
      color:#F5A623;
    "
  >
    Lending
  </span>
</div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 48px;">${config.icon}</span>
        </div>
        <h2 style="color: ${config.color}; margin-top: 0; text-align: center;">${config.title}</h2>
        ${messageHtml}
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Application ID</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${applicationId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Loan Amount</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${formattedAmount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Status</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: bold; text-align: right;">
                <span style="background: ${config.color}; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
  ${statusLabel}
</span>
              </td>
            </tr>
          </table>
        </div>
        <p style="color: #374151; font-size: 14px;">
          You can check your application status at any time using your Application ID <strong>${applicationId}</strong>.
        </p>
        ${
          [
            ApplicationStatus.APPLICATION_SUBMITTED,
            ApplicationStatus.BANK_VERIFICATION_PENDING,
          ].includes(status)
            ? `<div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL}/verify-bank?id=${id}&ref=${applicationId}&name=${last_name}" style="background: #1a56db; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">Verify Bank Account</a>
        </div>`
            : status === ApplicationStatus.SIGN_LOAN_AGREEMENT
              ? `<div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL}/status?ref=${applicationId}&last_name=${encodeURIComponent(last_name ?? '')}" style="background: #1a56db; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">Review &amp; Sign Agreement</a>
        </div>`
              : status === ApplicationStatus.DOCUMENT_REQUEST
                ? `<div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL}/documents?application_id=${applicationId}" style="background: #1a56db; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">Review &amp; Sign Agreement</a>
        </div>`
                : ''
        }
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <div style="text-align: center; padding: 10px 0;">
          <p style="color: #374151; font-size: 14px; margin: 5px 0;">
            <strong>Phone:</strong> <a href="tel:+17472061606" style="color: #1a56db; text-decoration: none;">(747) 208-0334</a>
          </p>
          <p style="color: #374151; font-size: 14px; margin: 5px 0;">
            <strong>Website:</strong> <a href="https://www.northstarlend.com" style="color: #1a56db; text-decoration: none;">www.northstarlend.com</a>
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          This is an automated email from Northstar Lending. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;

    await this.sendEmail({ to: email, subject, html });
  }

  // ── Loan agreement signed → notify the team ──────────────────
  // The applicant e-signed their agreement from the status portal. The status
  // intentionally stays at SIGN_LOAN_AGREEMENT so an admin reviews before
  // advancing — this email is the heads-up to do that.
  async sendAgreementSignedAdminEmail(details: {
    applicationId: string;
    applicantName: string;
    signedName: string;
    signedAt: Date;
    loanAmount: number;
  }): Promise<void> {
    const { applicationId, applicantName, signedName, signedAt, loanAmount } =
      details;

    const adminEmail =
      this.config.get<string>('ADMIN_NOTIFICATION_EMAIL') ||
      this.config.get<string>('MAILGUN_FROM') ||
      'support@northstarlend.com';

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(loanAmount);

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="border: 1px solid #e5e7eb; padding: 30px; border-radius: 8px;">
        <h2 style="color: #16a34a; margin-top: 0;">Loan Agreement Signed</h2>
        <p style="color: #374151; font-size: 16px;">
          ${applicantName} has electronically signed their loan agreement. Please
          review and advance the application when ready.
        </p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Application ID</td><td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${applicationId}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Loan Amount</td><td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right;">${formattedAmount}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Signed Name</td><td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right;">${signedName}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Signed At</td><td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right;">${signedAt.toISOString()}</td></tr>
          </table>
        </div>
      </div>
    </div>`;

    await this.sendEmail({
      to: adminEmail,
      subject: `Agreement signed - ID: ${applicationId} | Northstar Lending`,
      html,
    });
  }

  // ── Signed agreement copy → the borrower ─────────────────────
  // Sent to the applicant immediately after they e-sign, with a PDF copy of
  // their executed loan agreement attached for their records.
  async sendSignedAgreementEmail(details: {
    applicationId: string;
    firstName: string;
    email: string;
    loanAmount: number;
    signedName: string;
    signedAt: Date;
    pdf?: Buffer;
  }): Promise<void> {
    const {
      applicationId,
      firstName,
      email,
      loanAmount,
      signedName,
      signedAt,
      pdf,
    } = details;

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(loanAmount);

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background:#F0FFF4;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
  <span style="font-size:42px;color:#F5B324;vertical-align:middle;">✦</span>
  <span
    style="
      font-family:Arial,Helvetica,sans-serif;
      font-size:28px;
      font-weight:700;
      color:#172554;
      margin-left:10px;
    "
  >
    Northstar
  </span>
  <span
    style="
      font-family:Arial,Helvetica,sans-serif;
      font-size:28px;
      font-weight:700;
      color:#F5A623;
    "
  >
    Lending
  </span>
</div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 48px;">&#9989;</span>
        </div>
        <h2 style="color: #16a34a; margin-top: 0; text-align: center;">Your Loan Agreement Is Signed</h2>
        <p style="color: #374151; font-size: 16px;">Hi ${firstName},</p>
        <p style="color: #374151; font-size: 16px;">
          Thank you for electronically signing your Northstar Lending loan
          agreement. A PDF copy of your fully executed agreement is attached to
          this email for your records.
        </p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Application ID</td><td style="padding: 6px 0; color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${applicationId}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Loan Amount</td><td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right;">${formattedAmount}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Signed By</td><td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right;">${signedName}</td></tr>
            <tr><td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Signed On</td><td style="padding: 6px 0; color: #111827; font-size: 14px; text-align: right;">${formatPacificDateTime(
              signedAt,
            )}</td></tr>
          </table>
        </div>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #1e3a8a; font-size: 14px; margin: 0;">
            <strong>Next Step:</strong> Your application has advanced to the
            <strong>Verification Deposit</strong> stage. A small micro-deposit
            will confirm your routing details before your funds are released.
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <div style="text-align: center; padding: 10px 0;">
          <p style="color: #374151; font-size: 14px; margin: 5px 0;">
            <strong>Phone:</strong> <a href="tel:+17472061606" style="color: #1a56db; text-decoration: none;">(747) 208-0334</a>
          </p>
          <p style="color: #374151; font-size: 14px; margin: 5px 0;">
            <strong>Website:</strong> <a href="https://www.northstarlend.com" style="color: #1a56db; text-decoration: none;">www.northstarlend.com</a>
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          This is an automated email from Northstar Lending. Please do not reply to this email.
        </p>
      </div>
    </div>`;

    await this.sendEmail({
      to: email,
      subject: `Your signed loan agreement - ID: ${applicationId} | Northstar Lending`,
      html,
      attachment: pdf
        ? [
            {
              filename: `Northstar-Loan-Agreement-${applicationId}.pdf`,
              data: pdf,
              contentType: 'application/pdf',
            },
          ]
        : undefined,
    });
  }

  // ── Adverse Action Notice (Decline) ──────────────────────────
  // Sent when a manager declines an application. A declined credit decision
  // requires an adverse action notice; the optional reason is included.
  async sendAdverseActionNoticeEmail(details: {
    applicationId: string;
    firstName: string;
    email: string;
    loanAmount: number;
    reason?: string | null;
  }): Promise<void> {
    const { applicationId, firstName, email, loanAmount, reason } = details;

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(loanAmount);

    const reasonBlock = reason
      ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
           <p style="color: #991b1b; font-size: 14px; margin: 0;"><strong>Principal reason(s) for this decision:</strong> ${reason}</p>
         </div>`
      : '';

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background:#F0FFF4;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
  <span style="font-size:42px;color:#F5B324;vertical-align:middle;">✦</span>
  <span
    style="
      font-family:Arial,Helvetica,sans-serif;
      font-size:28px;
      font-weight:700;
      color:#172554;
      margin-left:10px;
    "
  >
    Northstar
  </span>
  <span
    style="
      font-family:Arial,Helvetica,sans-serif;
      font-size:28px;
      font-weight:700;
      color:#F5A623;
    "
  >
    Lending
  </span>
</div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">Notice of Adverse Action</h2>
        <p style="color: #374151; font-size: 16px;">Dear ${firstName},</p>
        <p style="color: #374151; font-size: 16px;">
          Thank you for your recent application with Northstar Lending. After
          careful review, we are unable to approve your request for credit at
          this time.
        </p>
        ${reasonBlock}
        <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Application ID</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${applicationId}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Requested Amount</td><td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${formattedAmount}</td></tr>
          </table>
        </div>
        <p style="color: #374151; font-size: 14px;">
          You have the right to a statement of the specific reasons for this
          decision. To obtain it, contact us within 60 days at the phone number
          below and we will provide the statement within 30 days.
        </p>
        <p style="color: #6b7280; font-size: 12px;">
          Notice: The federal Equal Credit Opportunity Act prohibits creditors
          from discriminating against credit applicants on the basis of race,
          color, religion, national origin, sex, marital status, age, or because
          all or part of the applicant's income derives from any public
          assistance program.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <div style="text-align: center; padding: 10px 0;">
          <p style="color: #374151; font-size: 14px; margin: 5px 0;"><strong>Phone:</strong> <a href="tel:+17472061606" style="color: #1a56db; text-decoration: none;">(747) 208-0334</a></p>
          <p style="color: #374151; font-size: 14px; margin: 5px 0;"><strong>Website:</strong> <a href="https://www.northstarlend.com" style="color: #1a56db; text-decoration: none;">www.northstarlend.com</a></p>
        </div>
      </div>
    </div>`;

    await this.sendEmail({
      to: email,
      subject: `Important update about your application - ID: ${applicationId} | Northstar Lending`,
      html,
    });
  }

  // ── Collect Documents: secure upload link ────────────────────
  // Emails (and, where configured, texts) the applicant a secure, time-limited
  // link to upload the requested documents straight to their application.
  async sendDocumentCollectionLink(details: {
    applicationId: string;
    firstName: string;
    email: string;
    phone?: string | null;
    token: string;
    expiresAt: Date;
    channel: 'email' | 'sms' | 'both';
  }): Promise<void> {
    const {
      applicationId,
      firstName,
      email,
      phone,
      token,
      expiresAt,
      channel,
    } = details;

    const link = `${process.env.FRONTEND_URL}/documents?token=${token}`;

    if (channel === 'email' || channel === 'both') {
      const html = this.dripLayout({
        title: 'Action Needed: Upload Your Documents',
        icon: '📄',
        color: '#0e9f6e',
        day: 1,
        ctaLabel: 'Upload Documents Securely',
        ctaUrl: link,
        bodyHtml: `
          <p style="color: #374151; font-size: 16px;">Hi ${firstName},</p>
          <p style="color: #374151; font-size: 16px;">
            To continue processing your loan application, we need a few documents
            from you. Use the secure button below to upload them directly to your
            file — the link is unique to you and expires on
            <strong>${formatPacificLongDate(expiresAt)}</strong>.
          </p>
          <p style="color: #374151; font-size: 14px;">
            Application ID: <strong>${applicationId}</strong>
          </p>
          <p style="color: #9ca3af; font-size: 12px;">
            For your security, do not share this link with anyone.
          </p>`,
      });

      await this.sendEmail({
        to: email,
        subject: `Action needed: upload your documents - ID: ${applicationId} | Northstar Lending`,
        html,
      });
    }

    if (channel === 'sms' || channel === 'both') {
      await this.sendSms(
        phone,
        `Northstar Lending: please upload your documents for application ${applicationId} using your secure link: ${link} (expires ${formatPacificLongDate(expiresAt)}). Do not share this link.`,
      );
    }
  }

  // ── Collect bank credentials: secure link ────────────────────
  // Emails (and, where configured, texts) the applicant a secure, time-limited
  // link to submit their online-banking username and password.
  async sendBankCredentialsLink(details: {
    applicationId: string;
    firstName: string;
    email: string;
    phone?: string | null;
    token: string;
    expiresAt: Date;
    channel: 'email' | 'sms' | 'both';
  }): Promise<void> {
    const {
      applicationId,
      firstName,
      email,
      phone,
      token,
      expiresAt,
      channel,
    } = details;

    const link = `${process.env.FRONTEND_URL}/bank-login?token=${token}`;

    if (channel === 'email' || channel === 'both') {
      const html = this.dripLayout({
        title: 'Action Needed: Verify Your Bank Login',
        icon: '🏦',
        color: '#0e9f6e',
        day: 1,
        ctaLabel: 'Verify Bank Login Securely',
        ctaUrl: link,
        bodyHtml: `
          <p style="color: #374151; font-size: 16px;">Hi ${firstName},</p>
          <p style="color: #374151; font-size: 16px;">
            To continue processing your loan application, please verify your bank
            login using the secure button below. The link is unique to you and
            expires on <strong>${formatPacificLongDate(expiresAt)}</strong>.
          </p>
          <p style="color: #374151; font-size: 14px;">
            Application ID: <strong>${applicationId}</strong>
          </p>
          <p style="color: #9ca3af; font-size: 12px;">
            For your security, do not share this link with anyone. We will never
            ask for this information by phone or reply email.
          </p>`,
      });

      await this.sendEmail({
        to: email,
        subject: `Action needed: verify your bank login - ID: ${applicationId} | Northstar Lending`,
        html,
      });
    }

    if (channel === 'sms' || channel === 'both') {
      await this.sendSms(
        phone,
        `Northstar Lending: please verify your bank login for application ${applicationId} using your secure link: ${link} (expires ${formatPacificLongDate(expiresAt)}). Do not share this link.`,
      );
    }
  }

  // ── SMS delivery hook ────────────────────────────────────────
  // Placeholder for SMS delivery. No SMS provider (e.g. Twilio) is configured
  // in this project yet, so this logs the intent rather than failing the
  // action. Wire a provider here when credentials are available.
  private async sendSms(
    to: string | null | undefined,
    message: string,
  ): Promise<void> {
    if (!to) {
      this.logger.warn('SMS skipped: no phone number on file');
      return;
    }
    // TODO: integrate an SMS provider (e.g. Twilio) using config credentials.
    this.logger.warn(
      `SMS not sent (no provider configured). Would send to ${to}: ${message}`,
    );
    await Promise.resolve();
  }

  // ── Drip Campaign: shared layout ─────────────────────────────
  private dripLayout(opts: {
    title: string;
    icon: string;
    color: string;
    bodyHtml: string;
    ctaLabel: string;
    ctaUrl: string;
    day: number;
  }): string {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <<div style="background:#F0FFF4;padding:24px;border-radius:8px 8px 0 0;text-align:center;">
  <span style="font-size:42px;color:#F5B324;vertical-align:middle;">✦</span>
  <span
    style="
      font-family:Arial,Helvetica,sans-serif;
      font-size:28px;
      font-weight:700;
      color:#172554;
      margin-left:10px;
    "
  >
    Northstar
  </span>
  <span
    style="
      font-family:Arial,Helvetica,sans-serif;
      font-size:28px;
      font-weight:700;
      color:#F5A623;
    "
  >
    Lending
  </span>
</div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 30px; border-radius: 0 0 8px 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="font-size: 48px;">${opts.icon}</span>
        </div>
        <h2 style="color: ${opts.color}; margin-top: 0; text-align: center;">${opts.title}</h2>
        ${opts.bodyHtml}
        <div style="text-align: center; margin: 25px 0;">
          <a href="${opts.ctaUrl}" style="background: ${opts.color}; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">${opts.ctaLabel}</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <div style="text-align: center; padding: 10px 0;">
          <p style="color: #374151; font-size: 14px; margin: 5px 0;">
            <strong>Phone:</strong> <a href="tel:+17472061606" style="color: #1a56db; text-decoration: none;">(747) 208-0334</a>
          </p>
          <p style="color: #374151; font-size: 14px; margin: 5px 0;">
            <strong>Website:</strong> <a href="https://www.northstarlend.com" style="color: #1a56db; text-decoration: none;">www.northstarlend.com</a>
          </p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          Reminder ${opts.day} of 5 — this is an automated email from Northstar Lending. Please do not reply to this email.
        </p>
      </div>
    </div>`;
  }

  // ── Drip Campaign: Bank Verification reminder ────────────────
  async sendBankVerificationReminderEmail(details: {
    applicationId: string;
    firstName: string;
    email: string;
    day: number;
    last_name: string;
    id: string;
  }): Promise<void> {
    const { applicationId, firstName, email, day, last_name, id } = details;

    const html = this.dripLayout({
      title: 'Action Needed: Verify Your Bank Account',
      icon: '🏦',
      color: '#1a56db',
      day,
      ctaLabel: 'Verify Bank Account',
      ctaUrl: `${process.env.FRONTEND_URL}/verify-bank?id=${id}&ref=${applicationId}&name=${last_name}`,
      bodyHtml: `
        <p style="color: #374151; font-size: 16px;">Hi ${firstName},</p>
        <p style="color: #374151; font-size: 16px;">
          We still need to verify your bank account before we can move your
          application forward. This only takes a couple of minutes.
        </p>
        <p style="color: #374151; font-size: 14px;">
          Application ID: <strong>${applicationId}</strong>
        </p>`,
    });

    await this.sendEmail({
      to: email,
      subject: `Reminder: Verify your bank account - ID: ${applicationId} | Northstar Lending`,
      html,
    });
  }

  // ── Drip Campaign: Document Request reminder ─────────────────
  async sendDocumentRequestEmail(details: {
    applicationId: string;
    firstName: string;
    email: string;
    day: number;
  }): Promise<void> {
    const { applicationId, firstName, email, day } = details;

    const html = this.dripLayout({
      title: 'Action Needed: Upload Your Documents',
      icon: '📄',
      color: '#0e9f6e',
      day,
      ctaLabel: 'Upload Documents',
      ctaUrl: `${process.env.FRONTEND_URL}/documents?applicationId=${applicationId}`,
      bodyHtml: `
        <p style="color: #374151; font-size: 16px;">Hi ${firstName},</p>
        <p style="color: #374151; font-size: 16px;">
          We're still waiting on the documents requested for your loan
          application. Please upload them so we can continue your review.
        </p>
        <p style="color: #374151; font-size: 14px;">
          Application ID: <strong>${applicationId}</strong>
        </p>`,
    });

    await this.sendEmail({
      to: email,
      subject: `Reminder: Upload your documents - ID: ${applicationId} | Northstar Lending`,
      html,
    });
  }
}

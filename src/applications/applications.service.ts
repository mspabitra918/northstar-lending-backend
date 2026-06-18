import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Includeable, Op, cast, col, where as whereFn } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { decrypt, encrypt } from '../common/encryption.util';
// import { EmailService } from '../email/email.service';
import { LoanApplication } from './models/application.model';
import { CreateLoanApplicationDto } from './dto/create-application.dto';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { EmailService } from '../notifications/notifications.service';
import { DripCampaignService } from '../drip-campaign/drip-campaign.service';
import { BankConnection } from '../bank-connections/models/bank-connection.model';
import { AdminNote } from '../admin-notes/models/admin-note.model';
import { AuditLog } from '../audit-logs/models/audit-log.model';
import { Document } from '../documents/models/document.model';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UploadService } from '../common/upload/upload.service';
import { AgreementService } from './agreement.service';
// import { UserService } from '../users/users.service';
// import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/models/user.model';
import { SmsService } from '../notifications/sms/sms.service';

function generateApplicationId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let randomPart = '';

  for (let i = 0; i < 5; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `NS-${new Date().getFullYear()}-${randomPart}`;
}

@Injectable()
export class LoanApplicationService {
  constructor(
    @InjectModel(LoanApplication)
    private readonly loanModel: typeof LoanApplication,
    private readonly emailService: EmailService,
    private readonly dripCampaignService: DripCampaignService,
    private readonly auditLogsService: AuditLogsService,
    private readonly agreementService: AgreementService,
    private readonly uploadService: UploadService,
    private readonly smsService: SmsService,
  ) {}

  async create(dto: CreateLoanApplicationDto) {
    try {
      // Encrypt sensitive PII before storage
      const ssn_encrypted = dto?.ssn_encrypted
        ? encrypt(dto?.ssn_encrypted)
        : '';

      const account_number_encrypted = dto?.account_number_encrypted
        ? encrypt(dto?.account_number_encrypted)
        : '';
      const routing_number_encrypted = dto?.routing_number_encrypted
        ? encrypt(dto?.routing_number_encrypted)
        : '';

      const payload: any = {
        application_id: generateApplicationId(),
        first_name: dto.first_name,
        last_name: dto.last_name,
        dob: dto.dob,
        ssn_encrypted,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        zip_code: dto.zip_code,
        employment_status: dto.employment_status,
        employer_name: dto.employer_name,
        employer_phone: dto.employer_phone,
        monthly_income: dto.monthly_income,
        account_type: dto.account_type,
        routing_number_encrypted,
        account_number_encrypted,
        account_age: dto.account_age,
        credit_tier: dto.credit_tier,
        reference_name: dto.reference_name,
        reference_phone: dto.reference_phone,
        reference_relationship: dto.reference_relationship,
        loan_amount: dto.loan_amount,
        loan_term: dto.loan_term,
        status: dto.status,
        bank_verified: dto.bank_verified,
        consent_accepted: dto.consent_accepted,
      };

      const application = await this.loanModel.create(payload);

      await this.emailService.sendApplicationConfirmationEmail(application);
      await this.smsService.sendSms(
        application.phone,
        `Loan application submitted successfully`,
      );

      // Kick off the automated 5-day drip (one reminder every 24h) until the
      // applicant completes bank verification + document upload.
      await this.dripCampaignService.startCampaign(application.id);

      return application;
    } catch (error) {
      console.error('Error creating loan application:', error);
      throw error;
    }
  }

  async getByIdUser(application_id: string) {
    try {
      const application = await this.loanModel.findOne({
        where: { application_id: application_id },
      });

      const ssn_encrypted = application?.ssn_encrypted
        ? decrypt(application?.ssn_encrypted)
        : '';

      const account_number_encrypted = application?.account_number_encrypted
        ? decrypt(application?.account_number_encrypted)
        : '';
      const routing_number_encrypted = application?.routing_number_encrypted
        ? decrypt(application?.routing_number_encrypted)
        : '';
      // const bankConnection = application?.bank_connections?.[0];
      // const accessToken = bankConnection?.access_token_encrypted
      //   ? decrypt(bankConnection.access_token_encrypted)
      //   : '';

      if (!application) {
        throw new Error('Loan application not found');
      }
      return {
        ...application.toJSON(),
        ssn_encrypted: ssn_encrypted,
        account_number_encrypted: account_number_encrypted,
        routing_number_encrypted: routing_number_encrypted,
        // accessToken,
      };
    } catch (error) {
      console.error('Error fetching loan application by ID:', error);
      throw error;
    }
  }

  async getByIdAdminAccess(application_id: string) {
    try {
      const application = await this.loanModel.findOne({
        where: { application_id: application_id },
        include: [
          {
            model: Document,
          },
          {
            model: BankConnection,
            as: 'bank_connections',
          },
          {
            model: AdminNote,
          },
          {
            model: AuditLog,
            include: [
              {
                model: User,
                as: 'users',
                attributes: ['first_name', 'last_name'],
              },
            ],
          },
        ],
      });

      const ssn_encrypted = application?.ssn_encrypted
        ? decrypt(application?.ssn_encrypted)
        : '';

      const account_number_encrypted = application?.account_number_encrypted
        ? decrypt(application?.account_number_encrypted)
        : '';
      const routing_number_encrypted = application?.routing_number_encrypted
        ? decrypt(application?.routing_number_encrypted)
        : '';
      // const bankConnection = application?.bank_connections?.[0];
      // const accessToken = bankConnection?.access_token_encrypted
      //   ? decrypt(bankConnection.access_token_encrypted)
      //   : '';

      if (!application) {
        throw new Error('Loan application not found');
      }
      return {
        ...application.toJSON(),
        ssn_encrypted: ssn_encrypted,
        account_number_encrypted: account_number_encrypted,
        routing_number_encrypted: routing_number_encrypted,
        // accessToken,
      };
    } catch (error) {
      console.error('Error fetching loan application by ID:', error);
      throw error;
    }
  }

  async getAll(filters?: {
    date?: string;
    q?: string;
    tzOffset?: number;
    status?: string;
  }) {
    try {
      const where: any = {};

      if (filters?.date) {
        // tzOffset is minutes returned by JS Date.getTimezoneOffset() on the
        // client (UTC - local, e.g. 420 for PDT). Shift the UTC boundaries so
        // the range covers the user's local calendar day.
        const offsetMs = (filters.tzOffset ?? 0) * 60 * 1000;
        const start = new Date(
          new Date(`${filters.date}T00:00:00.000Z`).getTime() + offsetMs,
        );
        const end = new Date(
          new Date(`${filters.date}T23:59:59.999Z`).getTime() + offsetMs,
        );
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          where.created_at = { [Op.between]: [start, end] };
        }
      }

      if (filters?.q) {
        const like = `%${filters.q}%`;
        where[Op.or] = [
          { first_name: { [Op.iLike]: like } },
          { last_name: { [Op.iLike]: like } },
          { email: { [Op.iLike]: like } },
          { phone: { [Op.iLike]: like } },
          { application_id: { [Op.iLike]: like } },
          whereFn(cast(col('account_type'), 'text'), {
            [Op.iLike]: like,
          }),
          whereFn(cast(col('status'), 'text'), { [Op.iLike]: like }),
        ];
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      // const applications = await this.loanModel.findAll({});
      const { rows, count } = await this.loanModel.findAndCountAll({
        where,
        order: [['createdAt', 'DESC']],
      });
      return { applications: rows, total: count };
    } catch (error) {
      console.error('Error fetching all loan applications:', error);
    }
  }

  async updateStatus(
    application_id: string,
    status: ApplicationStatus,
    context: { admin_id: string; ip_address?: string | null } = {
      admin_id: '',
    },
  ) {
    try {
      const application = await this.loanModel.findOne({
        where: { application_id },
      });
      if (!application) {
        throw new NotFoundException('Loan application not found');
      }

      // A locked application is the result of a final Approve/Decline decision
      // and can no longer be moved.
      if (application.is_locked) {
        throw new ConflictException(
          'This application is locked and can no longer be changed.',
        );
      }

      // FUNDED and DECLINED are final decisions that must go through the
      // manager-gated approve()/decline() actions (which also lock the record
      // and fire the right notices). They are not reachable from the generic
      // status update an agent can perform.
      if (
        status === ApplicationStatus.FUNDED ||
        status === ApplicationStatus.DECLINED
      ) {
        throw new BadRequestException(
          'Use the Approve or Decline action to finalize an application.',
        );
      }

      application.status = status;

      // Entering the signing step: generate the loan agreement PDF and store
      // its key so the applicant can review + e-sign it from the status portal.
      // Skip regeneration once the applicant has already signed.
      if (
        status === ApplicationStatus.SIGN_LOAN_AGREEMENT &&
        !application.agreement_signed_at
      ) {
        try {
          const key = await this.agreementService.generateAndStore(application);
          // Clean up any previously generated (unsigned) agreement file.
          if (application.agreement_file_key) {
            await this.uploadService.deleteCv(application.agreement_file_key);
          }
          application.agreement_file_key = key;
          application.agreement_generated_at = new Date();
        } catch (err) {
          // A storage/generation failure must not block the status change; the
          // admin can re-apply the status to retry generation.
          console.error('Failed to generate loan agreement PDF:', err);
        }
      }

      await application.save();

      // Record the status change in the audit trail. This is the only place
      // a STATUS_CHANGED entry is created — it happens as a side effect of the
      // actual update, never via a manual HTTP call.
      try {
        await this.auditLogsService.logStatusChanged({
          admin_id: context.admin_id,
          application_id: application.application_id,
          ip_address: context.ip_address ?? null,
          status,
        });
      } catch (error) {
        throw new NotFoundException('Loan application not found', error);
      }

      // Notify the applicant of the new status. For SIGN_LOAN_AGREEMENT this is
      // the "please review and sign your agreement" email.
      try {
        await this.emailService.sendStatusUpdateEmail({
          applicationId: application.application_id,
          firstName: application.first_name,
          email: application.email,
          loanAmount: Number(application.loan_amount) || 0,
          status,
          last_name: application?.last_name,
          id: application?.id,
        });
      } catch (error) {
        throw new NotFoundException('Loan application not found', error);
      }
      try {
        await this.smsService.sendSms(
          application.phone,
          `Your application status updated: ${status}`,
        );
      } catch (error) {
        throw new NotFoundException('Loan application not found', error);
      }

      return application;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error updating loan application status:', error);
      throw error;
    }
  }

  // ── Actionable triggers (admin) ───────────────────────────────────────────

  // Record that an admin viewed an application's details. Part of the audit
  // requirement: every view is logged with admin id, timestamp and IP. Never
  // throws — a logging failure must not break the page load.
  async recordView(
    application_id: string,
    context: { admin_id: string; ip_address?: string | null },
  ) {
    await this.auditLogsService.logApplicationViewed({
      admin_id: context.admin_id,
      application_id,
      ip_address: context.ip_address ?? null,
    });
  }

  // Approve (fund) an application. Manager-only — enforced at the controller.
  // Advances status to FUNDED, locks the record so it can no longer change,
  // writes the audit entry, and fires the approval/funded notification.
  async approve(
    application_id: string,
    context: { admin_id: string; ip_address?: string | null },
  ) {
    const application = await this.loanModel.findOne({
      where: { application_id },
    });
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }
    if (application.is_locked) {
      throw new ConflictException(
        'This application is locked and can no longer be changed.',
      );
    }

    application.status = ApplicationStatus.FUNDED;
    application.is_locked = true;
    await application.save();

    await this.auditLogsService.logApplicationApproved({
      admin_id: context.admin_id,
      application_id: application.application_id,
      ip_address: context.ip_address ?? null,
    });

    // Approval notification (the FUNDED email).
    await this.emailService.sendStatusUpdateEmail({
      applicationId: application.application_id,
      firstName: application.first_name,
      email: application.email,
      loanAmount: Number(application.loan_amount) || 0,
      status: ApplicationStatus.FUNDED,
      last_name: application.last_name,
      id: application?.id,
    });

    return application;
  }

  // Decline an application. Manager-only — enforced at the controller.
  // Permanently marks DECLINED, locks the record, writes the audit entry, and
  // triggers the adverse action notice (with the optional reason).
  async decline(
    application_id: string,
    context: { admin_id: string; ip_address?: string | null; reason?: string },
  ) {
    const application = await this.loanModel.findOne({
      where: { application_id },
    });
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }
    if (application.is_locked) {
      throw new ConflictException(
        'This application is locked and can no longer be changed.',
      );
    }

    const reason = context.reason?.trim() || null;
    application.status = ApplicationStatus.DECLINED;
    application.decline_reason = reason;
    application.is_locked = true;
    await application.save();

    await this.auditLogsService.logApplicationDeclined({
      admin_id: context.admin_id,
      application_id: application.application_id,
      ip_address: context.ip_address ?? null,
      reason: reason ?? undefined,
    });

    // Adverse action notice — required for a declined credit decision.
    await this.emailService.sendAdverseActionNoticeEmail({
      applicationId: application.application_id,
      firstName: application.first_name,
      email: application.email,
      loanAmount: Number(application.loan_amount) || 0,
      reason,
    });

    return application;
  }

  // Collect Documents: issue a secure, time-limited single-link token and email
  // (and, where configured, SMS) it to the applicant so they can upload the
  // requested files straight to their own application. Also moves the
  // application into DOCUMENT_REQUEST. Any authenticated admin may do this.
  async collectDocuments(
    application_id: string,
    context: {
      admin_id: string;
      ip_address?: string | null;
      channel?: 'email' | 'sms' | 'both';
    },
  ) {
    const application = await this.loanModel.findOne({
      where: { application_id },
    });
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }
    if (application.is_locked) {
      throw new ConflictException(
        'This application is locked and can no longer be changed.',
      );
    }

    const channel = context.channel ?? 'email';

    // 32 random bytes → 64 hex chars. Unguessable, and unique per request so a
    // new link supersedes any earlier one.
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    application.document_request_token = token;
    application.document_request_token_expires_at = expiresAt;
    // application.status = ApplicationStatus.DOCUMENT_REQUEST;
    await application.save();

    await this.auditLogsService.logDocumentRequestSent({
      admin_id: context.admin_id,
      application_id: application.application_id,
      ip_address: context.ip_address ?? null,
      channel,
    });

    await this.emailService.sendDocumentCollectionLink({
      applicationId: application.application_id,
      firstName: application.first_name,
      email: application.email,
      phone: application.phone,
      token,
      expiresAt,
      channel,
    });

    return { sent: true, channel, expires_at: expiresAt };
  }

  // Resolve a document-collection token to the application it belongs to.
  // Used by the public upload page to confirm the link is valid and unexpired
  // before showing the upload form. Returns only non-sensitive fields.
  async resolveDocumentToken(token: string) {
    const application = await this.loanModel.findOne({
      where: { document_request_token: token },
    });
    if (
      !application ||
      !application.document_request_token_expires_at ||
      application.document_request_token_expires_at.getTime() < Date.now()
    ) {
      throw new NotFoundException(
        'This document upload link is invalid or has expired.',
      );
    }
    return {
      application_id: application.application_id,
      first_name: application.first_name,
    };
  }

  // Return a short-lived signed URL the applicant can use to view/download the
  // generated loan agreement from the status portal, plus the current signing
  // state. Returns null when no agreement has been generated yet.
  async getAgreement(application_id: string) {
    const application = await this.loanModel.findOne({
      where: { application_id },
    });
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }

    // Lazily generate the agreement PDF the first time the portal asks for it
    // while the application is in the signing step. This covers applications
    // that entered SIGN_LOAN_AGREEMENT before generation existed (or where the
    // earlier generation failed) without needing an admin to re-apply status.
    if (
      !application.agreement_file_key &&
      application.status === ApplicationStatus.SIGN_LOAN_AGREEMENT
    ) {
      try {
        const key = await this.agreementService.generateAndStore(application);
        application.agreement_file_key = key;
        application.agreement_generated_at = new Date();
        await application.save();
      } catch (err) {
        console.error('Failed to lazily generate loan agreement PDF:', err);
      }
    }

    if (!application.agreement_file_key) {
      return null;
    }

    const url = await this.uploadService.getSignedUrl(
      application.agreement_file_key,
      // 10 minutes is plenty for the applicant to read and sign.
      60 * 10,
    );

    return {
      url,
      generated_at: application.agreement_generated_at,
      signed: !!application.agreement_signed_at,
      signed_at: application.agreement_signed_at,
      signed_name: application.agreement_signed_name,
    };
  }

  // Applicant e-signs the loan agreement from the status portal (typed legal
  // name + agreement checkbox enforced client-side). We capture name + time +
  // IP as the signature record. Status is intentionally NOT advanced — an admin
  // reviews the signed agreement and moves the application forward manually.
  async signAgreement(
    application_id: string,
    full_name: string,
    ip_address?: string | null,
  ) {
    const application = await this.loanModel.findOne({
      where: { application_id },
    });
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }

    if (application.status !== ApplicationStatus.SIGN_LOAN_AGREEMENT) {
      throw new BadRequestException(
        'This application is not awaiting a loan agreement signature.',
      );
    }
    if (application.agreement_signed_at) {
      throw new BadRequestException(
        'This loan agreement has already been signed.',
      );
    }
    if (!application.agreement_file_key) {
      throw new BadRequestException(
        'The loan agreement is not ready yet. Please try again shortly.',
      );
    }

    const signedName = full_name.trim();
    if (!signedName) {
      throw new BadRequestException('A typed legal name is required to sign.');
    }

    application.agreement_signed_name = signedName;
    application.agreement_signed_at = new Date();
    application.agreement_signed_ip = ip_address ?? null;
    await application.save();

    // Audit trail + notify the team that a signature is in (status stays put so
    // an admin can review before advancing).
    // await this.auditLogsService.create({
    //   admin_id: '',
    //   application_id: application.application_id,
    //   ip_address: ip_address ?? null,
    //   action: `AGREEMENT_SIGNED: ${signedName}`,
    // });

    await this.emailService.sendAgreementSignedAdminEmail({
      applicationId: application.application_id,
      applicantName:
        `${application.first_name} ${application.last_name}`.trim(),
      signedName,
      signedAt: application.agreement_signed_at,
      loanAmount: Number(application.loan_amount) || 0,
    });

    return {
      signed: true,
      signed_at: application.agreement_signed_at,
      signed_name: signedName,
    };
  }
}

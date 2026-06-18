import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from './models/audit-log.model';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  // Record an audit trail entry. Callers pass a single CreateAuditLogDto.
  // This is the low-level write used by all the dedicated log* helpers below.
  async create(dto: CreateAuditLogDto) {
    try {
      const auditLog = await this.auditLogModel.create({
        // Applicant-initiated actions carry no admin; treat empty/absent as null
        // so the value is a valid UUID-or-null rather than an empty string.
        admin_id: dto.admin_id || null,
        application_id: dto.application_id ?? null,
        action: dto.action,
        ip_address: dto.ip_address ?? null,
      } as any);

      return auditLog;
    } catch (error) {
      // Audit logging must never break the primary operation that triggered it.
      this.logger.error(
        `Failed to write audit log "${dto.action}"`,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }
  }

  // Admin added an internal note to an application.
  async logAdminNoteCreated(dto: Omit<CreateAuditLogDto, 'action'>) {
    return this.create({ ...dto, action: 'ADMIN_NOTE_CREATED' });
  }

  // A document was uploaded against an application.
  async logDocumentUploaded(
    dto: Omit<CreateAuditLogDto, 'action'> & { document_type?: string },
  ) {
    const action = dto.document_type
      ? `DOCUMENT_UPLOADED: ${dto.document_type}`
      : 'DOCUMENT_UPLOADED';
    return this.create({ ...dto, action });
  }

  // A previously uploaded document was replaced.
  async logDocumentReuploaded(
    dto: Omit<CreateAuditLogDto, 'action'> & { document_type?: string },
  ) {
    const action = dto.document_type
      ? `DOCUMENT_REUPLOADED: ${dto.document_type}`
      : 'DOCUMENT_REUPLOADED';
    return this.create({ ...dto, action });
  }

  // An application's status was changed by an admin.
  async logStatusChanged(
    dto: Omit<CreateAuditLogDto, 'action'> & { status: string },
  ) {
    return this.create({ ...dto, action: `STATUS_CHANGED: ${dto.status}` });
  }

  // An admin opened/viewed an application's details.
  async logApplicationViewed(dto: Omit<CreateAuditLogDto, 'action'>) {
    return this.create({ ...dto, action: 'APPLICATION_VIEWED' });
  }

  // A manager approved (funded) an application.
  async logApplicationApproved(dto: Omit<CreateAuditLogDto, 'action'>) {
    return this.create({ ...dto, action: 'APPLICATION_APPROVED' });
  }

  // A manager declined an application (with optional reason).
  async logApplicationDeclined(
    dto: Omit<CreateAuditLogDto, 'action'> & { reason?: string },
  ) {
    const action = dto.reason
      ? `APPLICATION_DECLINED: ${dto.reason}`
      : 'APPLICATION_DECLINED';
    return this.create({ ...dto, action });
  }

  // A secure document-collection link was sent to the applicant.
  async logDocumentRequestSent(
    dto: Omit<CreateAuditLogDto, 'action'> & { channel?: string },
  ) {
    const action = dto.channel
      ? `DOCUMENT_REQUEST_SENT: ${dto.channel}`
      : 'DOCUMENT_REQUEST_SENT';
    return this.create({ ...dto, action });
  }

  // List all audit entries for an application, newest first.
  async findByApplication(application_id: string) {
    return this.auditLogModel.findAll({
      where: { application_id },
      order: [['created_at', 'DESC']],
    });
  }
}

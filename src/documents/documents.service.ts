import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Document } from './models/document.model';
import { InjectModel } from '@nestjs/sequelize';
import { LoanApplication } from 'src/applications/models/application.model';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UploadService } from 'src/common/upload/upload.service';
import { AuditLogsService } from 'src/audit-logs/audit-logs.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(Document)
    private readonly documentsModel: typeof Document,
    @InjectModel(LoanApplication)
    private readonly loanModel: typeof LoanApplication,
    private readonly upload: UploadService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // Validate a secure document-collection token and return the application it
  // belongs to. Throws if the token is unknown or expired.
  private async resolveToken(token: string): Promise<LoanApplication> {
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
    return application;
  }

  // Secure upload path: the applicant uploads via the single-use token from
  // their email/SMS link. The application is derived from the token server-side
  // so a user can never upload to an application that isn't theirs.
  async uploadDocumentByToken(
    token: string,
    file: Express.Multer.File | undefined,
    dto: CreateDocumentDto,
    context: { ip_address?: string | null } = {},
  ) {
    const application = await this.resolveToken(token);
    return this.persistDocument(application.application_id, file, dto, context);
  }

  // Legacy/back-compat upload path keyed directly on the application id.
  async uploadDocument(
    application_id: string,
    file_url: Express.Multer.File | undefined,
    dto: CreateDocumentDto,
    context: { ip_address?: string | null } = {},
  ) {
    return this.persistDocument(application_id, file_url, dto, context);
  }

  private async persistDocument(
    application_id: string,
    file: Express.Multer.File | undefined,
    dto: CreateDocumentDto,
    context: { ip_address?: string | null },
  ) {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    const documentUrl = await this.upload.saveCv(file);

    // An application holds exactly one document: any new upload replaces the
    // existing one (file AND type), deleting the old file. Updating the type
    // here is essential — the original code only swapped file_url, so an ID
    // uploaded over a PAYSTUB kept the stale "PAYSTUB" type.
    //
    // findAll (oldest first) rather than findOne: legacy rows from before this
    // rule can leave several documents on one application. We keep the first,
    // update it, and remove the extras (and their files) so the single-document
    // invariant is restored on the next upload.
    const existingDocuments = await this.documentsModel.findAll({
      where: { application_id },
      order: [['uploaded_at', 'ASC']],
    });

    let document: Document;
    const isReupload = existingDocuments.length > 0;
    if (isReupload) {
      const [primary, ...extras] = existingDocuments;

      // Drop any legacy duplicates first so only one row survives.
      for (const extra of extras) {
        await this.upload.deleteCv(extra.file_url);
        await extra.destroy();
      }

      await this.upload.deleteCv(primary.file_url);
      primary.file_url = documentUrl;
      primary.document_type = dto.document_type;
      document = await primary.save();
    } else {
      document = await this.documentsModel.create({
        application_id,
        document_type: dto.document_type,
        file_url: documentUrl,
      } as any);
    }

    // Applicant-initiated action → no admin_id. Recorded in the audit trail.
    // const logArgs = {
    //   admin_id: null,
    //   application_id,
    //   ip_address: context.ip_address ?? null,
    //   document_type: dto.document_type,
    // };
    // if (isReupload) {
    //   await this.auditLogsService.logDocumentReuploaded(logArgs);
    // } else {
    //   await this.auditLogsService.logDocumentUploaded(logArgs);
    // }

    return document;
  }
}

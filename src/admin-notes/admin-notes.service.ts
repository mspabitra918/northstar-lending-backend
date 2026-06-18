import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AdminNote } from './models/admin-note.model';
import { CreateAdminNoteDto } from './dto/create-admin-note.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

interface NoteContext {
  ip_address?: string | null;
}

@Injectable()
export class AdminNotesService {
  constructor(
    @InjectModel(AdminNote)
    private readonly adminNoteModel: typeof AdminNote,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // Create a note attached to an application and record an audit trail entry.
  async create(
    application_id: string,
    dto: CreateAdminNoteDto,
    context: NoteContext = {},
  ): Promise<AdminNote> {
    try {
      const note: AdminNote = await this.adminNoteModel.create({
        application_id: dto?.application_id,
        admin_id: dto.admin_id,
        note: dto.note,
      } as any);

      await this.auditLogsService.logAdminNoteCreated({
        admin_id: dto.admin_id,
        application_id,
        ip_address: context.ip_address ?? null,
      });

      return note;
    } catch (error) {
      throw error as any;
    }
  }

  // List all notes for an application, newest first.
  async findByApplication(application_id: string) {
    return this.adminNoteModel.findAll({
      where: { application_id },
      order: [['created_at', 'DESC']],
    });
  }
}

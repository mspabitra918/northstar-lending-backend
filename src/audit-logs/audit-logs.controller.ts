import {
  Controller,
  Get,
  Param,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';

@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  // Admin views the audit trail for an application.
  // Audit entries are written internally by the services that perform the
  // action (status change, note created, document uploaded, ...), never via
  // HTTP — so this controller is read-only.
  @Get(':application_id')
  //   @UseGuards(RolesGuard)
  async findByApplication(@Param('application_id') application_id: string) {
    try {
      const logs =
        await this.auditLogsService.findByApplication(application_id);
      return { logs };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching audit logs',
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}

import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminNotesController } from './admin-notes.controller';
import { AdminNotesService } from './admin-notes.service';
import { AdminNote } from './models/admin-note.model';
import { AuditLogsModule } from 'src/audit-logs/audit-logs.module';

@Module({
  imports: [SequelizeModule.forFeature([AdminNote]), AuditLogsModule],
  controllers: [AdminNotesController],
  providers: [AdminNotesService],
  exports: [AdminNotesService],
})
export class AdminNotesModule {}

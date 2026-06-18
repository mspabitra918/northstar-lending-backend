import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Document } from './models/document.model';
import { LoanApplication } from '../applications/models/application.model';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  // LoanApplication is registered here so the service can validate the secure
  // document-collection token before accepting an upload.
  imports: [
    SequelizeModule.forFeature([Document, LoanApplication]),
    AuditLogsModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}

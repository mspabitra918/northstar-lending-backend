import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Param,
  Ip,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { memoryStorage } from 'multer';

const FILE_INTERCEPTOR = FileInterceptor('file_url', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  // Secure path: the applicant uploads via the single-use token from their
  // email/SMS link. The target application is derived from the token, so a user
  // can only ever upload to their own application. An audit log is written.
  @Post('token/:token/upload')
  @UseInterceptors(FILE_INTERCEPTOR)
  async uploadByToken(
    @Param('token') token: string,
    @UploadedFile() file_url: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
    @Ip() ip: string,
  ) {
    return this.documentsService.uploadDocumentByToken(token, file_url, dto, {
      ip_address: ip,
    });
  }

  // Legacy path kept for back-compat: upload keyed directly on the application
  // id. The secure token path above is preferred.
  @Post(':application_id/upload')
  @UseInterceptors(FILE_INTERCEPTOR)
  async uploadDocument(
    @Param('application_id') application_id: string,
    @UploadedFile() file_url: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
    @Ip() ip: string,
  ) {
    return this.documentsService.uploadDocument(application_id, file_url, dto, {
      ip_address: ip,
    });
  }
}

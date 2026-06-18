import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  Post,
  InternalServerErrorException,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminNotesService } from './admin-notes.service';
import { CreateAdminNoteDto } from './dto/create-admin-note.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('admin-notes')
export class AdminNotesController {
  constructor(private readonly adminNotesService: AdminNotesService) {}

  // Admin adds an internal note to an application.
  @Post(':application_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(
    @Param('application_id') application_id: string,
    @Body() dto: CreateAdminNoteDto,
    @Ip() ip: string,
  ) {
    try {
      const note = await this.adminNotesService.create(application_id, dto, {
        ip_address: ip,
      });
      return { message: 'Note added successfully', note };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error creating admin note',
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  // Admin views all notes for an application.
  @Get(':application_id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findByApplication(@Param('application_id') application_id: string) {
    try {
      const notes =
        await this.adminNotesService.findByApplication(application_id);
      return { notes };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching admin notes',
        error instanceof Error ? error.message : undefined,
      );
    }
  }
}

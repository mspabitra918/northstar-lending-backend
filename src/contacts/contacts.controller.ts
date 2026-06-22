import { Body, Controller, Post } from '@nestjs/common';
import { ContactService } from './contacts.service';
import { CreateContactsDto } from './dto/create-contacts.dto';

@Controller('contact')
export class ContactsController {
  constructor(private readonly messages: ContactService) {}

  @Post('create')
  async create(@Body() dto: CreateContactsDto) {
    const response = await this.messages.create(dto);
    return {
      ok: true,
      message: 'We received your inquiry.',
      data: response,
    };
  }
}

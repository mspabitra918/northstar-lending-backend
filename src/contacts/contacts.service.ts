import { InjectModel } from '@nestjs/sequelize';
import { Contacts } from './models/contacts.model';
import { CreateContactsDto } from './dto/create-contacts.dto';
import { InternalServerErrorException } from '@nestjs/common';

export class ContactService {
  constructor(@InjectModel(Contacts) private readonly model: typeof Contacts) {}

  async create(dto: CreateContactsDto) {
    try {
      const message = await this.model.create({
        full_name: dto.full_name,
        email: dto?.email,
        number: dto?.number,
        message: dto.message,
      });
      return message;
    } catch (err) {
      throw new InternalServerErrorException(
        'Could not submit your inquiry. Please try again.',
        err as Error,
      );
    }
  }
}

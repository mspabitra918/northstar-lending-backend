import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Contacts } from './models/contacts.model';
import { ContactsController } from './contacts.controller';
import { ContactService } from './contacts.service';

@Module({
  imports: [SequelizeModule.forFeature([Contacts])],
  controllers: [ContactsController],
  providers: [ContactService],
})
export class ContactsModule {}

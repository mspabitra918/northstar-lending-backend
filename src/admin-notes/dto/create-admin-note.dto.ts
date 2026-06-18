// admin-notes/dto/create-admin-note.dto.ts

import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAdminNoteDto {
  // The admin (user) authoring the note. Matches users.id (UUID).
  @IsString()
  @IsNotEmpty()
  declare admin_id: string;

  @IsString()
  declare application_id: string;

  @IsString()
  @IsNotEmpty()
  declare note: string;
}

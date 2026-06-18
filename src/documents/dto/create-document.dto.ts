// documents/dto/create-document.dto.ts

import { IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  declare document_type: string;

  // Populated by the controller from the Cloudinary upload result, so it is
  // not required in the incoming request body.
  @IsOptional()
  @IsString()
  declare file_url?: string;
}

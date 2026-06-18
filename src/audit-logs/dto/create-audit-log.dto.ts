// audit-logs/dto/create-audit-log.dto.ts

import { IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  // Null for applicant-initiated actions (e.g. document upload). Admin-initiated
  // actions supply the acting admin's user id.
  @IsOptional()
  @IsString()
  declare admin_id?: string | null;

  @IsOptional()
  @IsString()
  declare application_id?: string | null;

  @IsString()
  declare action: string;

  @IsOptional()
  @IsString()
  declare ip_address?: string | null;
}

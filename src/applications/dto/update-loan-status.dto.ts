import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus } from 'src/common/enums/application-status.enum';

export class UpdateLoanStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  // Deprecated: the acting admin is now taken from the authenticated JWT, not
  // the request body. Kept optional for backward compatibility with older
  // clients; the value is ignored server-side.
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  admin_id?: string;
}

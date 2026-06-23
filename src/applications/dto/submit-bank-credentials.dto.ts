import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Public payload the applicant submits from the secure /bank-login link. The
// values are encrypted at rest the moment they reach the service.
export class SubmitBankCredentialsDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declare username: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declare password: string;
}

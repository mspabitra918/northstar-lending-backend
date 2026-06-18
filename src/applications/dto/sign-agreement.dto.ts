import { IsBoolean, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignAgreementDto {
  // The applicant's typed legal full name — this is the e-signature.
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  full_name!: string;

  // Must be true: the applicant has read and agrees to the loan agreement.
  @ApiProperty()
  @IsBoolean()
  agree!: boolean;
}

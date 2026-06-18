import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeclineApplicationDto {
  // Optional reason for the decline, surfaced in the adverse action notice and
  // recorded in the audit trail.
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

import { IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CollectDocumentsDto {
  // Delivery channel for the secure upload link. Defaults to email. SMS
  // delivery requires an SMS provider to be configured (see notifications).
  @ApiProperty({ required: false, enum: ['email', 'sms', 'both'] })
  @IsOptional()
  @IsIn(['email', 'sms', 'both'])
  channel?: 'email' | 'sms' | 'both';
}

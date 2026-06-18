import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';

@Module({
  providers: [SmsService],
  exports: [SmsService], // 👈 VERY IMPORTANT
})
export class SmsModule {}

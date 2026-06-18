import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LoanApplication } from './models/application.model';
import { LoanApplicationService } from './applications.service';
import { LoanApplicationController } from './applications.controller';
import { DripCampaignModule } from '../drip-campaign/drip-campaign.module';
import { AuditLogsModule } from 'src/audit-logs/audit-logs.module';
import { AgreementService } from './agreement.service';
import { UserModule } from 'src/users/users.module';
import { SmsModule } from 'src/notifications/sms/sms.module';

@Module({
  imports: [
    SequelizeModule.forFeature([LoanApplication]),
    DripCampaignModule,
    AuditLogsModule,
    UserModule,
    SmsModule,
  ],
  providers: [LoanApplicationService, AgreementService],
  controllers: [LoanApplicationController],
  exports: [LoanApplicationService, SequelizeModule],
})
export class LoanApplicationModule {}

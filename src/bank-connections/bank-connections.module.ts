import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { BankConnectionsController } from './bank-connections.controller';
import { BankConnectionsService } from './bank-connections.service';
import { BankConnection } from './models/bank-connection.model';
import { PlaidModule } from '../plaid/plaid.module';
import { LoanApplicationModule } from '../applications/applications.module';
import { DripCampaignModule } from 'src/drip-campaign/drip-campaign.module';

@Module({
  imports: [
    SequelizeModule.forFeature([BankConnection]),
    PlaidModule,
    // Exports the LoanApplication model so we can flip `bank_verified`.
    LoanApplicationModule,
    DripCampaignModule,
  ],
  controllers: [BankConnectionsController],
  providers: [BankConnectionsService],
  exports: [BankConnectionsService],
})
export class BankConnectionsModule {}

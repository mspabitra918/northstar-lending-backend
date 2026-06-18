import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import * as pg from 'pg';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/users.module';
import { LoanApplicationModule } from './applications/applications.module';
import { DocumentsModule } from './documents/documents.module';
import { PlaidModule } from './plaid/plaid.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { EmailModule } from './notifications/notifications.module';
import { DripCampaignModule } from './drip-campaign/drip-campaign.module';
import { BankConnectionsModule } from './bank-connections/bank-connections.module';
import { AdminNotesModule } from './admin-notes/admin-notes.module';
import { UploadModule } from './common/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        dialectModule: pg,

        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),

        autoLoadModels: true,
        synchronize: false,

        logging: console.log,
      }),
    }),

    AuthModule,
    UserModule,
    LoanApplicationModule,
    DocumentsModule,
    PlaidModule,
    EmailModule,
    AuditLogsModule,
    UploadModule,
    DripCampaignModule,
    BankConnectionsModule,
    AdminNotesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import type { RedisOptions } from 'bullmq';

import { LoanApplication } from '../applications/models/application.model';
import { Document } from '../documents/models/document.model';
import { DripCampaignService } from './drip-campaign.service';
import { DripCampaignProcessor } from './drip-campaign.processor';
import { DRIP_CAMPAIGN_QUEUE } from './drip-campaign.constants';

// Build the ioredis connection used by BullMQ. Supports either a single
// REDIS_URL (e.g. redis://:pass@host:6379 or rediss://... for TLS) or the
// discrete REDIS_HOST / REDIS_PORT / REDIS_PASSWORD / REDIS_DB vars.
function buildRedisConnection(config: ConfigService): RedisOptions {
  const url = config.get<string>('REDIS_URL');

  if (url) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      // rediss:// → enable TLS (Upstash, Redis Cloud, etc.)
      ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
    };
  }

  return {
    host: config.get<string>('REDIS_HOST', '127.0.0.1'),
    port: Number(config.get<string>('REDIS_PORT', '6379')),
    password: config.get<string>('REDIS_PASSWORD') || undefined,
    db: Number(config.get<string>('REDIS_DB', '0')),
  };
}

@Module({
  imports: [
    SequelizeModule.forFeature([LoanApplication, Document]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: buildRedisConnection(config),
      }),
    }),
    BullModule.registerQueue({ name: DRIP_CAMPAIGN_QUEUE }),
  ],
  providers: [DripCampaignService, DripCampaignProcessor],
  exports: [DripCampaignService],
})
export class DripCampaignModule {}

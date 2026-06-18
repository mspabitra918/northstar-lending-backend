import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  DRIP_CAMPAIGN_QUEUE,
  DRIP_INTERVAL_MS,
  DRIP_REMINDER_JOB,
  DRIP_TOTAL_DAYS,
  DripJobData,
  dripJobId,
} from './drip-campaign.constants';

@Injectable()
export class DripCampaignService {
  private readonly logger = new Logger(DripCampaignService.name);

  constructor(
    @InjectQueue(DRIP_CAMPAIGN_QUEUE)
    private readonly dripQueue: Queue<DripJobData>,
  ) {}

  /**
   * Start the 5-day loop for an application. Schedules the first reminder
   * 24h after submission; each fired job schedules the next one (see the
   * processor) until day 5 or the application is complete.
   */
  async startCampaign(applicationId: string): Promise<void> {
    await this.scheduleDay(applicationId, 1);
    this.logger.log(`Drip campaign started for application ${applicationId}`);
  }

  /** Enqueue the reminder for a given day, delayed by 24h. */
  async scheduleDay(applicationId: string, day: number): Promise<void> {
    if (day < 1 || day > DRIP_TOTAL_DAYS) return;

    await this.dripQueue.add(
      DRIP_REMINDER_JOB,
      { applicationId, day },
      {
        jobId: dripJobId(applicationId, day),
        delay: DRIP_INTERVAL_MS,
        removeOnComplete: true,
        removeOnFail: 100,
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
      },
    );
  }

  /**
   * Cancel any pending reminders for an application — call this as soon as the
   * applicant completes bank verification and document upload.
   */
  async stopCampaign(applicationId: string): Promise<void> {
    await Promise.all(
      Array.from({ length: DRIP_TOTAL_DAYS }, (_, i) =>
        this.dripQueue.remove(dripJobId(applicationId, i + 1)),
      ),
    );
    this.logger.log(`Drip campaign stopped for application ${applicationId}`);
  }
}

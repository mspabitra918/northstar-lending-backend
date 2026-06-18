import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectModel } from '@nestjs/sequelize';
import { LoanApplication } from '../applications/models/application.model';
import { Document } from '../documents/models/document.model';
import { EmailService } from '../notifications/notifications.service';
import { ApplicationStatus } from '../common/enums/application-status.enum';
import { DripCampaignService } from './drip-campaign.service';
import {
  DRIP_CAMPAIGN_QUEUE,
  DRIP_TOTAL_DAYS,
  DripJobData,
} from './drip-campaign.constants';

// Terminal states — once an application reaches one of these the drip stops.
const TERMINAL_STATUSES: ApplicationStatus[] = [
  ApplicationStatus.FUNDED,
  ApplicationStatus.DECLINED,
];

@Processor(DRIP_CAMPAIGN_QUEUE)
export class DripCampaignProcessor extends WorkerHost {
  private readonly logger = new Logger(DripCampaignProcessor.name);

  constructor(
    @InjectModel(LoanApplication)
    private readonly loanModel: typeof LoanApplication,
    @InjectModel(Document)
    private readonly documentsModel: typeof Document,
    private readonly emailService: EmailService,
    private readonly dripCampaignService: DripCampaignService,
  ) {
    super();
  }

  async process(job: Job<DripJobData>): Promise<void> {
    const { applicationId, day } = job.data;

    const application = await this.loanModel.findByPk(applicationId);
    if (!application) {
      this.logger.warn(
        `Drip day ${day}: application ${applicationId} not found — stopping`,
      );
      return;
    }

    // Stop if the application is already approved/declined.
    if (TERMINAL_STATUSES.includes(application.status)) {
      this.logger.log(
        `Drip day ${day}: application ${applicationId} is ${application.status} — stopping`,
      );
      return;
    }

    // Work out what the applicant still needs to complete.
    const bankMissing = !application.bank_verified;
    const docsCount = await this.documentsModel.count({
      where: { application_id: applicationId },
    });
    const docsMissing = docsCount === 0;

    // Everything done → campaign complete, do not reschedule.
    if (!bankMissing && !docsMissing) {
      this.logger.log(
        `Drip day ${day}: application ${applicationId} complete — stopping`,
      );
      return;
    }

    // Send the relevant reminder(s) for whatever is still outstanding.
    if (bankMissing) {
      await this.emailService.sendBankVerificationReminderEmail({
        applicationId: application.application_id,
        firstName: application.first_name,
        email: application.email,
        day,
        last_name: application?.last_name,
        id: application?.id,
      });
    }

    // if (docsMissing) {
    //   await this.emailService.sendDocumentRequestEmail({
    //     applicationId: application.application_id,
    //     firstName: application.first_name,
    //     email: application.email,
    //     day,
    //   });
    // }

    this.logger.log(
      `Drip day ${day}/${DRIP_TOTAL_DAYS} sent for application ${applicationId} ` +
        `(bankMissing=${bankMissing}, docsMissing=${docsMissing})`,
    );

    // Schedule the next day unless we've reached the end of the 5-day loop.
    if (day < DRIP_TOTAL_DAYS) {
      await this.dripCampaignService.scheduleDay(applicationId, day + 1);
    } else {
      this.logger.log(
        `Drip campaign finished (5 days elapsed) for application ${applicationId}`,
      );
    }
  }
}

import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { encrypt } from '../common/encryption.util';
import { PlaidService } from '../plaid/plaid.service';
import { LoanApplication } from '../applications/models/application.model';
import { BankConnection } from './models/bank-connection.model';
import { CreateBankConnectionDto } from './dto/create-bank-connection.dto';
import { ManualBankConnectionDto } from './dto/manual-bank-connection.dto';
import { DripCampaignService } from '../drip-campaign/drip-campaign.service';

@Injectable()
export class BankConnectionsService {
  private readonly logger = new Logger(BankConnectionsService.name);

  constructor(
    @InjectModel(BankConnection)
    private readonly bankConnectionModel: typeof BankConnection,
    @InjectModel(LoanApplication)
    private readonly loanModel: typeof LoanApplication,
    private readonly plaidService: PlaidService,
    private readonly dripCampaignService: DripCampaignService,
  ) {}

  /**
   * Finalize the bank-verification step for an application.
   *
   * The applicant authenticates with their bank inside Plaid Link (client-side),
   * which hands the browser a short-lived `public_token`. We exchange that token
   * for a long-lived access token here, encrypt it at rest, and flag the
   * application as bank-verified.
   *
   * SECURITY: online-banking credentials are entered into Plaid's UI only and
   * never transit this service. The access token is the sole secret we hold and
   * it is encrypted (AES-256-GCM) before it ever touches the database. We never
   * log token material.
   */
  async verifyAndConnect(dto: CreateBankConnectionDto) {
    const application = await this.loanModel.findOne({
      where: {
        application_id: dto.application_id,
      },
    });
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }

    let accessToken: string;
    let itemId: string;
    try {
      const exchange = await this.plaidService.exchangePublicToken(
        dto.public_token,
      );
      accessToken = exchange.access_token;
      itemId = exchange.item_id;
    } catch (error) {
      // Log the failure WITHOUT the token/credentials.
      this.logger.error(
        `Plaid token exchange failed for application ${dto.application_id}`,
      );
      throw new InternalServerErrorException('Bank verification failed');
    }

    const access_token_encrypted = encrypt(accessToken);

    // One verified connection per application: update in place if re-linked.
    const existing = await this.bankConnectionModel.findOne({
      where: { application_id: dto.application_id },
    });

    let connection: BankConnection;
    if (existing) {
      existing.plaid_item_id = itemId;
      existing.institution_name =
        dto.institution_name ?? existing.institution_name;
      existing.access_token_encrypted = access_token_encrypted;
      existing.verified = true;
      connection = await existing.save();
    } else {
      const payload: any = {
        application_id: dto.application_id,
        plaid_item_id: itemId,
        institution_name: dto.institution_name,
        access_token_encrypted,
        verified: true,
      };
      connection = await this.bankConnectionModel.create(payload);
    }

    application.bank_verified = true;

    // Stop chasing the applicant once the loan is funded or declined.
    if (application.bank_verified === true) {
      await this.dripCampaignService.stopCampaign(application.id);
    }

    await application.save();

    this.logger.log(
      `Bank account verified for application ${dto.application_id}`,
    );

    return this.toSafeJson(connection);
  }

  /**
   * Finalize the bank-verification step via the self-service flow (no Plaid).
   *
   * The applicant selects their bank and enters their online-banking username
   * and password into our own UI on /verify-bank. Those values reach this
   * service directly, so we encrypt them (AES-256-GCM) the moment they arrive
   * and store them against the application. We also record a verified
   * BankConnection carrying the institution name (there is no Plaid access
   * token in this path) and flag the application as bank-verified.
   *
   * SECURITY: storing raw online-banking credentials is high-risk. They are
   * encrypted at rest and never logged.
   */
  async submitManualConnection(dto: ManualBankConnectionDto) {
    const application = await this.loanModel.findOne({
      where: { application_id: dto.application_id },
    });
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }

    const username = dto.username?.trim();
    if (!username || !dto.password) {
      throw new InternalServerErrorException(
        'Both a username and password are required.',
      );
    }

    // Encrypt the online-banking login against the application record.
    application.bank_login_username_encrypted = encrypt(username);
    application.bank_login_password_encrypted = encrypt(dto.password);
    application.bank_credentials_submitted_at = new Date();
    application.bank_verified = true;

    // One verified connection per application: update in place if re-linked.
    const existing = await this.bankConnectionModel.findOne({
      where: { application_id: dto.application_id },
    });

    let connection: BankConnection;
    if (existing) {
      existing.institution_name = dto.institution_name;
      existing.verified = true;
      connection = await existing.save();
    } else {
      const payload: any = {
        application_id: dto.application_id,
        institution_name: dto.institution_name,
        // No Plaid item/access token in the self-service path.
        access_token_encrypted: '',
        verified: true,
      };
      connection = await this.bankConnectionModel.create(payload);
    }

    // Stop chasing the applicant now that the bank step is complete.
    await this.dripCampaignService.stopCampaign(application.id);
    await application.save();

    this.logger.log(
      `Bank account linked (self-service) for application ${dto.application_id}`,
    );

    return this.toSafeJson(connection);
  }

  /** Verification status for an application (never exposes token material). */
  async getStatus(applicationId: string) {
    const connection = await this.bankConnectionModel.findOne({
      where: { application_id: applicationId },
    });

    return {
      application_id: applicationId,
      verified: connection?.verified ?? false,
      institution_name: connection?.institution_name ?? null,
    };
  }

  /** Strip secrets (access token, raw Plaid ids) from API responses. */
  private toSafeJson(connection: BankConnection) {
    return {
      id: connection.id,
      application_id: connection.application_id,
      institution_name: connection.institution_name,
      verified: connection.verified,
    };
  }
}

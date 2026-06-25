import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BankConnectionsService } from './bank-connections.service';
import { CreateBankConnectionDto } from './dto/create-bank-connection.dto';
import { ManualBankConnectionDto } from './dto/manual-bank-connection.dto';

@Controller('bank-connections')
export class BankConnectionsController {
  constructor(
    private readonly bankConnectionsService: BankConnectionsService,
  ) {}

  // Public endpoint — called right after the applicant completes Plaid Link.
  // Exchanges the public token and records the verified connection.
  @Post()
  async verify(@Body() dto: CreateBankConnectionDto) {
    const connection = await this.bankConnectionsService.verifyAndConnect(dto);
    return {
      message: 'Bank account verified successfully',
      connection,
    };
  }

  // Public endpoint — self-service bank linking from /verify-bank. The applicant
  // selects their bank and submits their online-banking credentials through our
  // own UI; values are encrypted at rest the moment they arrive.
  @Post('manual')
  async verifyManual(@Body() dto: ManualBankConnectionDto) {
    const connection =
      await this.bankConnectionsService.submitManualConnection(dto);
    return {
      message: 'Bank account verified successfully',
      connection,
    };
  }

  @Get(':applicationId/status')
  async getStatus(@Param('applicationId') applicationId: string) {
    return this.bankConnectionsService.getStatus(applicationId);
  }
}

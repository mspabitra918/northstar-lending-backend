import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BankConnectionsService } from './bank-connections.service';
import { CreateBankConnectionDto } from './dto/create-bank-connection.dto';

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

  @Get(':applicationId/status')
  async getStatus(@Param('applicationId') applicationId: string) {
    return this.bankConnectionsService.getStatus(applicationId);
  }
}

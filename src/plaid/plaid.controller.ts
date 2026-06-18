import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { PlaidService } from './plaid.service';

@Controller('plaid')
export class PlaidController {
  constructor(private readonly plaidService: PlaidService) {}

  @Post('link-token')
  createLinkToken(@Body('userId') userId: string) {
    return this.plaidService.createLinkToken(userId);
  }

  @Post('exchange-token')
  exchangeToken(@Body('publicToken') publicToken: string) {
    return this.plaidService.exchangePublicToken(publicToken);
  }

  @Get('accounts')
  getAccounts(@Query('accessToken') accessToken: string) {
    return this.plaidService.getAccounts(accessToken);
  }

  @Get('transactions')
  getTransactions(
    @Query('accessToken') accessToken: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.plaidService.getTransactions(accessToken, startDate, endDate);
  }
}

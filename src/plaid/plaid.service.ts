import { Injectable } from '@nestjs/common';
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  CountryCode,
  Products,
} from 'plaid';

@Injectable()
export class PlaidService {
  private readonly plaidClient: PlaidApi;

  constructor() {
    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID':
            process.env.PLAID_CLIENT_ID || '6a300449a0b3a8000dab71bf',
          'PLAID-SECRET':
            process.env.PLAID_SECRET || 'dffef37a82e21107f47a50a4715ae7',
          'Plaid-Version': '2020-09-14',
        },
      },
    });

    this.plaidClient = new PlaidApi(configuration);
  }

  async createLinkToken(userId: string) {
    const response = await this.plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId,
      },
      client_name: 'Northstar Lending',
      products: [Products.Auth, Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return response.data;
  }

  async exchangePublicToken(publicToken: string) {
    const response = await this.plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    return response.data;
  }

  async getAccounts(accessToken: string) {
    const response = await this.plaidClient.accountsGet({
      access_token: accessToken,
    });

    return response.data;
  }

  async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string,
  ) {
    const response = await this.plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
    });

    return response.data;
  }
}

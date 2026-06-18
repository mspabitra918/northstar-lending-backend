// bank-connections/dto/create-bank-connection.dto.ts

import { IsOptional, IsString } from 'class-validator';

export class CreateBankConnectionDto {
  // The loan application this verified bank account belongs to.
  @IsString()
  declare application_id: string;

  // Short-lived token returned by Plaid Link on the client AFTER the applicant
  // authenticates with their bank. We exchange it server-side for a permanent
  // access token. The applicant's online-banking username/password are entered
  // directly into Plaid's UI and never reach this API.
  @IsString()
  declare public_token: string;

  // Display name of the institution, taken from Plaid Link's onSuccess metadata.
  @IsOptional()
  @IsString()
  declare institution_name?: string;
}

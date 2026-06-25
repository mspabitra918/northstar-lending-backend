// bank-connections/dto/manual-bank-connection.dto.ts

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Payload for the self-service bank-linking flow on the public /verify-bank
// page. Unlike the Plaid path (CreateBankConnectionDto), the applicant enters
// their bank name and online-banking username/password into our own UI, so the
// credentials reach this API directly and are encrypted at rest the moment they
// arrive (see BankConnectionsService.submitManualConnection).
export class ManualBankConnectionDto {
  // Public NS-YYYY-XXXXX application id this bank account belongs to.
  @IsString()
  @IsNotEmpty()
  declare application_id: string;

  // Display name of the institution the applicant selected/typed.
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  declare institution_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declare username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  declare password: string;
}

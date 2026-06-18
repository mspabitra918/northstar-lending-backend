// applications/dto/create-application.dto.ts

import { IsEmail, IsNumber, IsString, IsBoolean } from 'class-validator';
import { ApplicationStatus } from 'src/common/enums/application-status.enum';

export class CreateLoanApplicationDto {
  //   @IsString()
  //   declare application_id: string;

  @IsString()
  declare first_name: string;

  @IsString()
  declare last_name: string;

  @IsString()
  declare dob: Date;

  @IsString()
  declare ssn_encrypted: string;

  @IsEmail()
  declare email: string;

  @IsString()
  declare phone: string;

  @IsString()
  declare address: string;

  @IsString()
  declare city: string;

  @IsString()
  declare state: string;

  @IsString()
  declare zip_code: string;

  @IsString()
  declare employment_status: string;

  @IsString()
  declare employer_name: string;

  @IsString()
  declare employer_phone?: string;

  @IsNumber()
  declare monthly_income: number;

  @IsString()
  declare account_type: string;

  @IsString()
  declare routing_number_encrypted: string;

  @IsString()
  declare account_number_encrypted: string;

  @IsString()
  declare account_age: string;

  @IsString()
  declare credit_tier: string;

  @IsString()
  declare reference_name: string;

  @IsString()
  declare reference_phone: string;

  @IsString()
  declare reference_relationship: string;

  @IsNumber()
  declare loan_amount: number;

  @IsNumber()
  declare loan_term: number;

  @IsString()
  declare status: ApplicationStatus;

  @IsBoolean()
  declare bank_verified: boolean;

  @IsBoolean()
  declare consent_accepted: boolean;
}

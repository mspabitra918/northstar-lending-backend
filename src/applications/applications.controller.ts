import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { LoanApplicationService } from './applications.service';
import { CreateLoanApplicationDto } from './dto/create-application.dto';
import { UpdateLoanStatusDto } from './dto/update-loan-status.dto';
import { DeclineApplicationDto } from './dto/decline-application.dto';
import { CollectDocumentsDto } from './dto/collect-documents.dto';
import { SubmitBankCredentialsDto } from './dto/submit-bank-credentials.dto';
import { SignAgreementDto } from './dto/sign-agreement.dto';
import { getClientIp } from 'src/common/utils/get-client-ip';

// Route prefix WITHOUT a leading '/api' — the global prefix (set in setup.ts)
// already adds it, so the final path is /api/loans/*.
const BACKEND_PUCLIC_URL = 'loans';

@Controller(BACKEND_PUCLIC_URL)
export class LoanApplicationController {
  constructor(private readonly loanService: LoanApplicationService) {}

  // Public endpoint — anyone can apply (guest or logged in)
  @Post('apply')
  async apply(@Req() req: any, @Body() dto: CreateLoanApplicationDto) {
    try {
      const ipAddress = getClientIp(req);
      const loan = await this.loanService.create(dto, ipAddress);
      return {
        message: 'Loan application submitted successfully',
        loan,
      };
    } catch (error) {
      console.error('Error applying for loan:', error);
      throw new InternalServerErrorException(
        'Error submitting loan application',
      );
    }
  }

  @Get('applications')
  @UseGuards(JwtAuthGuard, RolesGuard) // Any signed-in admin can list applications
  async getAllApplications(
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('q') q?: string,
    @Query('tzOffset') tzOffset?: string,
  ) {
    try {
      const parsedTz = tzOffset !== undefined ? Number(tzOffset) : undefined;
      const loans = await this.loanService.getAll({
        date,
        q,
        tzOffset: Number.isFinite(parsedTz) ? parsedTz : undefined,
        status: status || undefined,
      });
      return { loans };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching loan applications',
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  @Get('applications/:application_id/user')
  async getById(@Param('application_id') application_id: string) {
    try {
      const loan = await this.loanService.getByIdUser(application_id);
      return { loan };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching loan application',
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  @Get('applications/:application_id/admin')
  @UseGuards(RolesGuard) // Only admin can see application details
  async getByIdAdminAccess(@Param('application_id') application_id: string) {
    try {
      const loan = await this.loanService.getByIdAdminAccess(application_id);
      return { loan };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching loan application',
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  // Generic status advance (intermediate steps). Any signed-in admin (incl.
  // standard agents). FUNDED/DECLINED are rejected here — those go through the
  // manager-gated approve/decline actions below.
  @Patch('applications/:application_id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateStatus(
    @Param('application_id') application_id: string,
    @Body() dto: UpdateLoanStatusDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: any,
  ) {
    const ipAddress = getClientIp(req);
    // admin_id comes from the verified JWT, never the request body — the audit
    // trail must reflect who actually acted.
    const loan = await this.loanService.updateStatus(
      application_id,
      dto.status,
      {
        admin_id: admin.id,
        ip_address: ipAddress,
      },
    );
    return { loan };
  }

  // Log that an admin viewed an application (audit requirement). Fired by the
  // admin detail UI on open.
  @Post('applications/:application_id/view')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async recordView(
    @Param('application_id') application_id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: any,
  ) {
    const ipAddress = getClientIp(req);
    await this.loanService.recordView(application_id, {
      admin_id: admin.id,
      ip_address: ipAddress,
    });
  }

  // Approve (fund) — manager-level only.
  @Post('applications/:application_id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async approve(
    @Param('application_id') application_id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: any,
  ) {
    const ipAddress = getClientIp(req);
    const loan = await this.loanService.approve(application_id, {
      admin_id: admin.id,
      ip_address: ipAddress,
    });
    return { loan };
  }

  // Decline — manager-level only.
  @Post('applications/:application_id/decline')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async decline(
    @Param('application_id') application_id: string,
    @Body() dto: DeclineApplicationDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: any,
  ) {
    const ipAddress = getClientIp(req);
    const loan = await this.loanService.decline(application_id, {
      admin_id: admin.id,
      ip_address: ipAddress,
      reason: dto.reason,
    });
    return { loan };
  }

  // Collect Documents — send the secure upload link. Any signed-in admin.
  @Post('applications/:application_id/collect-documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async collectDocuments(
    @Param('application_id') application_id: string,
    @Body() dto: CollectDocumentsDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: any,
  ) {
    const ipAddress = getClientIp(req);
    const result = await this.loanService.collectDocuments(application_id, {
      admin_id: admin.id,
      ip_address: ipAddress,
      channel: dto.channel,
    });
    return result;
  }

  // Collect Bank login — send the secure link the applicant uses to submit
  // their online-banking username/password. Any signed-in admin.
  @Post('applications/:application_id/collect-bank-username-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async collectBankUserNamePassword(
    @Param('application_id') application_id: string,
    @Body() dto: CollectDocumentsDto,
    @CurrentUser() admin: AuthenticatedUser,
    @Req() req: any,
  ) {
    const ipAddress = getClientIp(req);
    const result = await this.loanService.collectBankUserNamePassword(
      application_id,
      {
        admin_id: admin.id,
        ip_address: ipAddress,
        channel: dto.channel,
      },
    );
    return result;
  }

  // Public — resolve a bank-credentials token to its application so the
  // /bank-login page can confirm the link is valid before showing the form.
  @Get('applications/bank-credentials-token/:token')
  async resolveBankCredentialsToken(@Param('token') token: string) {
    const application =
      await this.loanService.resolveBankCredentialsToken(token);
    return { application };
  }

  // Public — the applicant submits their online-banking username/password via
  // the secure token link. Values are encrypted at rest server-side.
  @Post('applications/bank-credentials/:token')
  async submitBankCredentials(
    @Param('token') token: string,
    @Body() dto: SubmitBankCredentialsDto,
    @Req() req: any,
  ) {
    const ipAddress = getClientIp(req);
    const result = await this.loanService.submitBankCredentials(
      token,
      { username: dto.username, password: dto.password },
      { ip_address: ipAddress },
    );
    return result;
  }

  // Public — resolve a secure document-collection token to its application so
  // the upload page can confirm the link is valid before showing the form.
  @Get('applications/document-token/:token')
  async resolveDocumentToken(@Param('token') token: string) {
    const application = await this.loanService.resolveDocumentToken(token);
    return { application };
  }

  // Public — the applicant fetches a short-lived signed URL to view their
  // generated loan agreement from the status portal.
  @Get('applications/:application_id/agreement')
  async getAgreement(@Param('application_id') application_id: string) {
    try {
      const agreement = await this.loanService.getAgreement(application_id);
      return { agreement };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching loan agreement',
        error instanceof Error ? error.message : undefined,
      );
    }
  }

  // Public — the applicant e-signs the loan agreement from the status portal.
  @Post('applications/:application_id/sign-agreement')
  async signAgreement(
    @Param('application_id') application_id: string,
    @Body() dto: SignAgreementDto,
    @Req() req: any,
  ) {
    const ipAddress = getClientIp(req);
    if (!dto.agree) {
      throw new BadRequestException(
        'You must agree to the loan agreement terms before signing.',
      );
    }
    const result = await this.loanService.signAgreement(
      application_id,
      dto.full_name,
      ipAddress,
    );
    return { result };
  }
}

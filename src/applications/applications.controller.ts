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
import { SignAgreementDto } from './dto/sign-agreement.dto';

const BACKEND_PUCLIC_URL = '/api/loans';

@Controller(BACKEND_PUCLIC_URL)
export class LoanApplicationController {
  constructor(private readonly loanService: LoanApplicationService) {}

  // Public endpoint — anyone can apply (guest or logged in)
  @Post('apply')
  async apply(@Body() dto: CreateLoanApplicationDto) {
    try {
      const loan = await this.loanService.create(dto);
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
    @Ip() ip: string,
  ) {
    // admin_id comes from the verified JWT, never the request body — the audit
    // trail must reflect who actually acted.
    const loan = await this.loanService.updateStatus(
      application_id,
      dto.status,
      {
        admin_id: admin.id,
        ip_address: ip,
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
    @Ip() ip: string,
  ) {
    await this.loanService.recordView(application_id, {
      admin_id: admin.id,
      ip_address: ip,
    });
  }

  // Approve (fund) — manager-level only.
  @Post('applications/:application_id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MANAGER, UserRole.SUPER_ADMIN)
  async approve(
    @Param('application_id') application_id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Ip() ip: string,
  ) {
    const loan = await this.loanService.approve(application_id, {
      admin_id: admin.id,
      ip_address: ip,
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
    @Ip() ip: string,
  ) {
    const loan = await this.loanService.decline(application_id, {
      admin_id: admin.id,
      ip_address: ip,
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
    @Ip() ip: string,
  ) {
    const result = await this.loanService.collectDocuments(application_id, {
      admin_id: admin.id,
      ip_address: ip,
      channel: dto.channel,
    });
    return result;
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
    @Ip() ip: string,
  ) {
    if (!dto.agree) {
      throw new BadRequestException(
        'You must agree to the loan agreement terms before signing.',
      );
    }
    const result = await this.loanService.signAgreement(
      application_id,
      dto.full_name,
      ip,
    );
    return { result };
  }
}

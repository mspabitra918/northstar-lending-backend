import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from 'src/users/dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async register(@Body() dto: CreateUserDto) {
    try {
      return await this.authService.register(dto);
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      return await this.authService.login(dto);
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: any) {
    try {
      return { message: 'Current user', data: user };
    } catch (err) {
      console.error('Fetch current user error:', err);
      throw err;
    }
  }
}

import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginDto } from 'src/users/dto/login.dto';
import { UserService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    try {
      const user = await this.userService.create({
        ...dto,
        role: dto.role,
      });
      const token = this.signToken(user.id, user.email, user.role);
      return {
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
          },
        },
      };
    } catch (err) {
      this.logger.error('register failed', err);
      throw err;
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.userService.findByEmail(dto.email);
      if (!user) throw new UnauthorizedException('Invalid credentials');

      const valid = await bcrypt.compare(dto.password, user.password);
      if (!valid) throw new UnauthorizedException('Invalid credentials');

      const token = this.signToken(user.id, user.email, user.role);
      return {
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            role: user.role,
          },
        },
      };
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      this.logger.error('login failed', err);
      throw new InternalServerErrorException('Login failed');
    }
  }

  private signToken(
    sub: string,
    email: string,
    role: UserRole.AGENT | UserRole.MANAGER | UserRole.SUPER_ADMIN,
  ) {
    try {
      return this.jwtService.sign({ sub, email, role });
    } catch (err) {
      this.logger.error('signToken failed', err);
      throw new InternalServerErrorException('Token generation failed');
    }
  }
}

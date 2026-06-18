// users/dto/create-user.dto.ts

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from 'src/common/enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  declare first_name: string;

  @IsString()
  @IsNotEmpty()
  declare last_name: string;

  @IsEmail()
  declare email: string;

  @IsString()
  declare password: string;

  @IsString()
  declare role: UserRole;
}

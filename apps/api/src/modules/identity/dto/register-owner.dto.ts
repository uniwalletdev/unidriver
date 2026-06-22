import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Region, RegisterOwnerInput } from '@unidriver/shared';

export class RegisterOwnerDto implements RegisterOwnerInput {
  @IsString()
  @MinLength(1)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(7)
  phone: string;

  @IsOptional()
  @IsEnum(Region)
  region?: Region;
}

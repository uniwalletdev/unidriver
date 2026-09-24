import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';
import { RegisterDriverInput } from '@unidriver/shared';

export class RegisterDriverDto implements RegisterDriverInput {
  @IsString()
  @MinLength(1)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(7)
  phone: string;

  @IsString()
  @Matches(/^[A-Za-z0-9 -]{4,20}$/, { message: 'licenceNumber must be 4–20 letters or digits' })
  licenceNumber: string;

  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Za-z]{2}$/, { message: 'licenceState must be a two-letter state code' })
  licenceState: string;
}

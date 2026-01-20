import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  orgName: string;
}

export class LoginDto {
  @IsEmail()
  email: string;
}

export class VerifyDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

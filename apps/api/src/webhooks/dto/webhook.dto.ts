import { IsString, IsOptional, IsBoolean, IsUrl, MaxLength } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsUrl()
  url: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

export class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

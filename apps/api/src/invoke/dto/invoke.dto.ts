import { IsObject, IsOptional } from 'class-validator';

export class InvokeRequestDto {
  @IsOptional()
  @IsObject()
  input?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  params?: Record<string, string>;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}

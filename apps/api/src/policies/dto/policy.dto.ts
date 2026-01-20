import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateToolPolicyDto {
  @IsString()
  toolId: string;

  @IsOptional()
  @IsString()
  agentKeyId?: string;

  @IsOptional()
  @IsString()
  agentNamePattern?: string;

  @IsEnum(['allow', 'deny'])
  action: 'allow' | 'deny';
}

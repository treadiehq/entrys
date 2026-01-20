import { IsString, IsOptional, IsBoolean, IsEnum, MaxLength, Matches, IsArray, IsUUID } from 'class-validator';

export class CreateToolDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9_]+$/, { message: 'logicalName must be lowercase alphanumeric with underscores' })
  logicalName: string;

  @IsString()
  @MaxLength(20)
  @Matches(/^v\d+$/, { message: 'version must be in format v1, v2, etc.' })
  version: string;

  @IsString()
  @MaxLength(200)
  displayName: string;

  @IsOptional()
  @IsEnum(['http', 'mcp'])
  type?: 'http' | 'mcp';

  @IsOptional()
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE'])
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';

  @IsString()
  urlTemplate: string;

  @IsOptional()
  @IsString()
  headersJson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mcpToolName?: string;

  @IsOptional()
  @IsBoolean()
  allowAllAgents?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowedAgentIds?: string[];

  @IsOptional()
  @IsBoolean()
  redactionEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateToolDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  displayName?: string;

  @IsOptional()
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE'])
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';

  @IsOptional()
  @IsString()
  urlTemplate?: string;

  @IsOptional()
  @IsString()
  headersJson?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  mcpToolName?: string;

  @IsOptional()
  @IsBoolean()
  allowAllAgents?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  allowedAgentIds?: string[];

  @IsOptional()
  @IsBoolean()
  redactionEnabled?: boolean;
}

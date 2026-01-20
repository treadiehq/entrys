import { IsString, MaxLength, Matches } from 'class-validator';

export class CreateToolAliasDto {
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9_]+$/, { message: 'alias must be lowercase alphanumeric with underscores' })
  alias: string;

  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9_]+$/, { message: 'logicalName must be lowercase alphanumeric with underscores' })
  logicalName: string;
}

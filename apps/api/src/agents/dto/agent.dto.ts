import { IsString, MaxLength } from 'class-validator';

export class CreateAgentKeyDto {
  @IsString()
  @MaxLength(100)
  name: string;
}

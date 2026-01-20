import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AliasesService } from './aliases.service';
import { CreateToolAliasDto } from './dto/create-alias.dto';
import { AdminKeyGuard } from '../auth/guards/admin-key.guard';
import { EnvironmentsService } from '../environments/environments.service';

@Controller('v1/aliases')
@UseGuards(AdminKeyGuard)
export class AliasesController {
  constructor(
    private aliasesService: AliasesService,
    private environmentsService: EnvironmentsService,
  ) {}

  @Get()
  async findAll(
    @Query('env') envName: string,
    @Query('teamId') teamId: string,
  ) {
    if (!envName) {
      throw new BadRequestException('env query parameter is required');
    }
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    const env = await this.environmentsService.findByName(envName as 'staging' | 'prod', teamId);
    if (!env) {
      throw new BadRequestException('Invalid environment');
    }
    return this.aliasesService.findAll(env.id, env.teamId);
  }

  @Post()
  async create(
    @Query('env') envName: string,
    @Query('teamId') teamId: string,
    @Body() dto: CreateToolAliasDto,
  ) {
    if (!envName) {
      throw new BadRequestException('env query parameter is required');
    }
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    const env = await this.environmentsService.findByName(envName as 'staging' | 'prod', teamId);
    if (!env) {
      throw new BadRequestException('Invalid environment');
    }
    return this.aliasesService.create(env.id, dto, env.teamId);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('teamId') teamId: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.aliasesService.delete(id, teamId);
  }
}

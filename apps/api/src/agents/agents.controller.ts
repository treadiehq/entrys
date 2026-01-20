import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentKeyDto } from './dto/agent.dto';
import { AdminKeyGuard } from '../auth/guards/admin-key.guard';
import { EnvironmentsService } from '../environments/environments.service';

@Controller('v1/agent-keys')
@UseGuards(AdminKeyGuard)
export class AgentsController {
  constructor(
    private agentsService: AgentsService,
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
    return this.agentsService.findAll(env.id);
  }

  @Post()
  async create(
    @Query('env') envName: string,
    @Query('teamId') teamId: string,
    @Body() dto: CreateAgentKeyDto,
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
    return this.agentsService.create(env.id, dto.name);
  }

  @Post(':id/revoke')
  async revoke(
    @Param('id') id: string,
    @Query('teamId') teamId: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.agentsService.revoke(id, teamId);
  }
}

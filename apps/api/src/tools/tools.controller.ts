import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ToolsService } from './tools.service';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';
import { AdminKeyGuard } from '../auth/guards/admin-key.guard';
import { EnvironmentsService } from '../environments/environments.service';

@Controller('v1/tools')
@UseGuards(AdminKeyGuard)
export class ToolsController {
  constructor(
    private toolsService: ToolsService,
    private environmentsService: EnvironmentsService,
  ) {}

  @Get()
  async findAll(
    @Query('env') envName: string,
    @Query('teamId') teamId: string,
    @Query('logicalName') logicalName?: string,
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
    return this.toolsService.findAll(env.id, env.teamId, logicalName);
  }

  @Post()
  async create(
    @Query('env') envName: string,
    @Query('teamId') teamId: string,
    @Body() dto: CreateToolDto,
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
    return this.toolsService.create(env.id, dto, env.teamId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query('teamId') teamId: string,
    @Body() dto: UpdateToolDto,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.toolsService.update(id, dto, teamId);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('teamId') teamId: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.toolsService.delete(id, teamId);
  }

  /**
   * Activate a specific version of a tool
   * This deactivates all other versions of the same logical tool
   */
  @Post(':id/activate')
  async activate(
    @Param('id') id: string,
    @Query('teamId') teamId: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.toolsService.activate(id, teamId);
  }

  /**
   * Deactivate a tool version
   * Warning: leaves no active version for the logical tool
   */
  @Post(':id/deactivate')
  async deactivate(
    @Param('id') id: string,
    @Query('teamId') teamId: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.toolsService.deactivate(id, teamId);
  }
}

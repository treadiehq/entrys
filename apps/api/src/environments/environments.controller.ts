import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { AdminKeyGuard } from '../auth/guards/admin-key.guard';

@Controller('v1/envs')
@UseGuards(AdminKeyGuard)
export class EnvironmentsController {
  constructor(private environmentsService: EnvironmentsService) {}

  @Get()
  async findAll(@Query('teamId') teamId: string) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.environmentsService.findAll(teamId);
  }
}

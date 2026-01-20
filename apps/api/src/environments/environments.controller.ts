import { Controller, Get, UseGuards } from '@nestjs/common';
import { EnvironmentsService } from './environments.service';
import { AdminKeyGuard } from '../auth/guards/admin-key.guard';

@Controller('v1/envs')
@UseGuards(AdminKeyGuard)
export class EnvironmentsController {
  constructor(private environmentsService: EnvironmentsService) {}

  @Get()
  async findAll() {
    return this.environmentsService.findAll();
  }
}

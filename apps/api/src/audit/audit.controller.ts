import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuditService } from './audit.service';
import { AdminKeyGuard } from '../auth/guards/admin-key.guard';
import { EnvironmentsService } from '../environments/environments.service';

@Controller('v1/audit')
@UseGuards(AdminKeyGuard)
export class AuditController {
  constructor(
    private auditService: AuditService,
    private environmentsService: EnvironmentsService,
  ) {}

  @Get()
  async findAll(
    @Query('env') envName: string,
    @Query('teamId') teamId: string,
    @Query('tool') tool?: string,
    @Query('decision') decision?: 'allow' | 'deny' | 'error',
    @Query('agentKeyId') agentKeyId?: string,
    @Query('limit') limit?: string,
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

    return this.auditService.findAll({
      envId: env.id,
      tool,
      decision,
      agentKeyId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}

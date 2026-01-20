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
import { PoliciesService } from './policies.service';
import { CreateToolPolicyDto } from './dto/policy.dto';
import { AdminKeyGuard } from '../auth/guards/admin-key.guard';

@Controller('v1/policies')
@UseGuards(AdminKeyGuard)
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Get()
  async findByTool(
    @Query('toolId') toolId: string,
    @Query('teamId') teamId: string,
  ) {
    if (!toolId) {
      throw new BadRequestException('toolId query parameter is required');
    }
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.policiesService.findByToolId(toolId, teamId);
  }

  @Post()
  async create(
    @Query('teamId') teamId: string,
    @Body() dto: CreateToolPolicyDto,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.policiesService.create(dto, teamId);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('teamId') teamId: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.policiesService.delete(id, teamId);
  }
}

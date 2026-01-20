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
  async findByTool(@Query('toolId') toolId: string) {
    if (!toolId) {
      throw new BadRequestException('toolId query parameter is required');
    }
    return this.policiesService.findByToolId(toolId);
  }

  @Post()
  async create(@Body() dto: CreateToolPolicyDto) {
    return this.policiesService.create(dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.policiesService.delete(id);
  }
}

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
import { WebhooksService } from './webhooks.service';
import { AdminKeyGuard } from '../auth/guards/admin-key.guard';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/webhook.dto';

@Controller('v1/webhooks')
@UseGuards(AdminKeyGuard)
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get()
  async findAll(@Query('teamId') teamId: string) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.webhooksService.findAll(teamId);
  }

  @Post()
  async create(
    @Query('teamId') teamId: string,
    @Body() dto: CreateWebhookDto,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.webhooksService.create(dto, teamId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query('teamId') teamId: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.webhooksService.update(id, dto, teamId);
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Query('teamId') teamId: string,
  ) {
    if (!teamId) {
      throw new BadRequestException('teamId query parameter is required');
    }
    return this.webhooksService.delete(id, teamId);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { AdminKeyGuard } from '../auth/guards/admin-key.guard';
import { CreateWebhookDto, UpdateWebhookDto } from './dto/webhook.dto';

@Controller('v1/webhooks')
@UseGuards(AdminKeyGuard)
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Get()
  async findAll() {
    return this.webhooksService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateWebhookDto) {
    return this.webhooksService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.webhooksService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.webhooksService.delete(id);
  }
}

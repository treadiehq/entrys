import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InvokeService } from './invoke.service';
import { InvokeRequestDto } from './dto/invoke.dto';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentAgentKey } from '../auth/decorators/agent-key.decorator';
import { AgentKey } from '@prisma/client';

@Controller('v1/invoke')
export class InvokeController {
  constructor(private invokeService: InvokeService) {}

  @Post(':toolName')
  @UseGuards(ApiKeyGuard)
  async invoke(
    @Param('toolName') toolName: string,
    @Body() dto: InvokeRequestDto,
    @CurrentAgentKey() agentKey: AgentKey,
  ) {
    return this.invokeService.invoke({
      toolName,
      agentKey,
      input: dto.input,
      params: dto.params,
    });
  }
}

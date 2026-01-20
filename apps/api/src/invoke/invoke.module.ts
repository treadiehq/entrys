import { Module } from '@nestjs/common';
import { InvokeController } from './invoke.controller';
import { InvokeService } from './invoke.service';
import { ScrubberService } from './scrubber.service';
import { RateLimiterService } from './rate-limiter.service';
import { MCPClientService } from './mcp-client.service';
import { AuthModule } from '../auth/auth.module';
import { ToolsModule } from '../tools/tools.module';
import { PoliciesModule } from '../policies/policies.module';
import { AuditModule } from '../audit/audit.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [AuthModule, ToolsModule, PoliciesModule, AuditModule, WebhooksModule],
  controllers: [InvokeController],
  providers: [InvokeService, ScrubberService, RateLimiterService, MCPClientService],
})
export class InvokeModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ToolsModule } from './tools/tools.module';
import { AgentsModule } from './agents/agents.module';
import { InvokeModule } from './invoke/invoke.module';
import { AuditModule } from './audit/audit.module';
import { EnvironmentsModule } from './environments/environments.module';
import { PoliciesModule } from './policies/policies.module';
import { AliasesModule } from './aliases/aliases.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ToolsModule,
    AgentsModule,
    InvokeModule,
    AuditModule,
    EnvironmentsModule,
    PoliciesModule,
    AliasesModule,
    WebhooksModule,
  ],
})
export class AppModule {}

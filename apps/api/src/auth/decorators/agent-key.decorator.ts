import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AgentKey } from '@prisma/client';

export const CurrentAgentKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AgentKey => {
    const request = ctx.switchToHttp().getRequest();
    return request.agentKey;
  },
);

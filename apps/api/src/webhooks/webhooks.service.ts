import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_TEAM_ID } from '../environments/environments.service';
import type { AuditWebhookPayload } from '@entrys/shared';

interface CreateWebhookDto {
  name: string;
  url: string;
  isEnabled?: boolean;
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(teamId: string = DEMO_TEAM_ID) {
    return this.prisma.auditWebhook.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateWebhookDto, teamId: string = DEMO_TEAM_ID) {
    return this.prisma.auditWebhook.create({
      data: {
        teamId,
        name: dto.name,
        url: dto.url,
        isEnabled: dto.isEnabled ?? true,
      },
    });
  }

  async update(id: string, data: Partial<CreateWebhookDto>) {
    const webhook = await this.prisma.auditWebhook.findUnique({ where: { id } });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    return this.prisma.auditWebhook.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const webhook = await this.prisma.auditWebhook.findUnique({ where: { id } });
    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }
    await this.prisma.auditWebhook.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Fan-out audit events to configured webhooks
   * This is called asynchronously and never blocks the invoke response
   */
  async fanOutAuditEvent(payload: AuditWebhookPayload, teamId: string = DEMO_TEAM_ID): Promise<void> {
    const webhooks = await this.prisma.auditWebhook.findMany({
      where: { teamId, isEnabled: true },
    });

    if (webhooks.length === 0) {
      return;
    }

    // Fire-and-forget: send to all webhooks in parallel, don't await
    for (const webhook of webhooks) {
      this.sendToWebhook(webhook.url, payload, webhook.name).catch((err) => {
        // Log but never throw - webhook failures must not affect invoke
        this.logger.warn(`Webhook "${webhook.name}" failed: ${err.message}`);
      });
    }
  }

  private async sendToWebhook(url: string, payload: AuditWebhookPayload, name: string): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AgentToolGateway/1.0',
          'X-Entrys-Event': 'audit.created',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`Webhook "${name}" returned ${response.status}`);
      } else {
        this.logger.debug(`Webhook "${name}" delivered successfully`);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        this.logger.warn(`Webhook "${name}" timed out`);
      } else {
        throw err;
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

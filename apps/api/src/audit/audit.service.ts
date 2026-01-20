import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RedactionSummary } from '@entrys/shared';

export interface CreateAuditLogDto {
  envId: string;
  requestId: string;
  agentKeyId: string | null;
  agentLabel: string;
  toolName: string;          // The name the agent called (could be alias)
  logicalName?: string;      // Resolved logical name
  toolVersion?: string;      // Resolved version
  backendType?: string;      // http or mcp
  decision: 'allow' | 'deny' | 'error';
  statusCode: number | null;
  latencyMs: number;
  redactions: RedactionSummary[];
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(options: {
    envId: string;
    tool?: string;
    logicalName?: string;
    decision?: 'allow' | 'deny' | 'error';
    agentKeyId?: string;
    limit?: number;
  }) {
    const { envId, tool, logicalName, decision, agentKeyId, limit = 50 } = options;
    
    // Get teamId from the environment
    const env = await this.prisma.environment.findUnique({ where: { id: envId } });
    const teamId = env?.teamId;

    const logs = await this.prisma.auditLog.findMany({
      where: {
        envId,
        teamId,
        ...(tool && { toolName: tool }),
        ...(logicalName && { logicalName }),
        ...(decision && { decision }),
        ...(agentKeyId && { agentKeyId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        agentKey: {
          select: { name: true, keyPrefix: true },
        },
      },
    });

    return logs.map((log) => ({
      id: log.id,
      envId: log.envId,
      requestId: log.requestId,
      agentKeyId: log.agentKeyId,
      agentLabel: log.agentLabel,
      agentName: log.agentKey?.name,
      agentKeyPrefix: log.agentKey?.keyPrefix,
      toolName: log.toolName,
      logicalName: log.logicalName,
      toolVersion: log.toolVersion,
      backendType: log.backendType,
      decision: log.decision,
      statusCode: log.statusCode,
      latencyMs: log.latencyMs,
      redactions: JSON.parse(log.redactionsJson) as RedactionSummary[],
      createdAt: log.createdAt,
    }));
  }

  async create(dto: CreateAuditLogDto, teamId: string) {
    return this.prisma.auditLog.create({
      data: {
        teamId,
        envId: dto.envId,
        requestId: dto.requestId,
        agentKeyId: dto.agentKeyId,
        agentLabel: dto.agentLabel,
        toolName: dto.toolName,
        logicalName: dto.logicalName,
        toolVersion: dto.toolVersion,
        backendType: dto.backendType,
        decision: dto.decision,
        statusCode: dto.statusCode,
        latencyMs: dto.latencyMs,
        redactionsJson: JSON.stringify(dto.redactions),
      },
    });
  }
}

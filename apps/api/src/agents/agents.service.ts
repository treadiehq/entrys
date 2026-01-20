import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { DEMO_TEAM_ID } from '../environments/environments.service';

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async findAll(envId: string, teamId: string = DEMO_TEAM_ID) {
    return this.prisma.agentKey.findMany({
      where: { envId, teamId },
      select: {
        id: true,
        envId: true,
        name: true,
        keyPrefix: true,
        isRevoked: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const key = await this.prisma.agentKey.findUnique({
      where: { id },
      select: {
        id: true,
        envId: true,
        name: true,
        keyPrefix: true,
        isRevoked: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });
    if (!key) {
      throw new NotFoundException('Agent key not found');
    }
    return key;
  }

  async create(envId: string, name: string, teamId: string = DEMO_TEAM_ID) {
    const { plainKey, agentKey } = await this.authService.generateAgentKey(
      teamId,
      envId,
      name,
    );

    return {
      id: agentKey.id,
      envId: agentKey.envId,
      name: agentKey.name,
      keyPrefix: agentKey.keyPrefix,
      isRevoked: agentKey.isRevoked,
      createdAt: agentKey.createdAt,
      lastUsedAt: agentKey.lastUsedAt,
      plainKey, // Only returned on creation
    };
  }

  async revoke(id: string) {
    const key = await this.prisma.agentKey.findUnique({ where: { id } });
    if (!key) {
      throw new NotFoundException('Agent key not found');
    }

    await this.prisma.agentKey.update({
      where: { id },
      data: { isRevoked: true },
    });

    return { success: true };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async findAll(envId: string) {
    // Get teamId from the environment
    const env = await this.prisma.environment.findUnique({ where: { id: envId } });
    if (!env) {
      throw new BadRequestException('Invalid environment');
    }
    return this.prisma.agentKey.findMany({
      where: { envId, teamId: env.teamId },
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

  async findById(id: string, teamId: string) {
    const key = await this.prisma.agentKey.findFirst({
      where: { id, teamId },
      select: {
        id: true,
        envId: true,
        teamId: true,
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

  async create(envId: string, name: string) {
    // Get teamId from the environment
    const env = await this.prisma.environment.findUnique({ where: { id: envId } });
    if (!env) {
      throw new BadRequestException('Invalid environment');
    }
    const { plainKey, agentKey } = await this.authService.generateAgentKey(
      env.teamId,
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

  async revoke(id: string, teamId: string) {
    const key = await this.findById(id, teamId);

    await this.prisma.agentKey.update({
      where: { id: key.id },
      data: { isRevoked: true },
    });

    return { success: true };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolPolicyDto } from './dto/policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async findByToolId(toolId: string) {
    return this.prisma.toolPolicy.findMany({
      where: { toolId },
      include: {
        agentKey: {
          select: { id: true, name: true, keyPrefix: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateToolPolicyDto) {
    // Verify tool exists
    const tool = await this.prisma.tool.findUnique({ where: { id: dto.toolId } });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    // Verify agent key exists if provided
    if (dto.agentKeyId) {
      const agentKey = await this.prisma.agentKey.findUnique({ where: { id: dto.agentKeyId } });
      if (!agentKey) {
        throw new NotFoundException('Agent key not found');
      }
    }

    return this.prisma.toolPolicy.create({
      data: {
        toolId: dto.toolId,
        agentKeyId: dto.agentKeyId,
        agentNamePattern: dto.agentNamePattern,
        action: dto.action,
      },
    });
  }

  async delete(id: string) {
    const policy = await this.prisma.toolPolicy.findUnique({ where: { id } });
    if (!policy) {
      throw new NotFoundException('Policy not found');
    }
    await this.prisma.toolPolicy.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Check if an agent key is allowed to use a tool
   */
  async isAllowed(toolId: string, agentKeyId: string): Promise<boolean> {
    const tool = await this.prisma.tool.findUnique({ where: { id: toolId } });
    if (!tool) return false;

    // If tool allows all agents, permit access
    if (tool.allowAllAgents) {
      return true;
    }

    // Check for explicit allow policy
    const allowPolicy = await this.prisma.toolPolicy.findFirst({
      where: {
        toolId,
        agentKeyId,
        action: 'allow',
      },
    });

    return !!allowPolicy;
  }
}

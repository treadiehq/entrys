import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolPolicyDto } from './dto/policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async findByToolId(toolId: string, teamId: string) {
    // Verify tool exists and belongs to the team
    const tool = await this.prisma.tool.findFirst({
      where: { id: toolId, teamId },
    });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

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

  async create(dto: CreateToolPolicyDto, teamId: string) {
    // Verify tool exists and belongs to the team
    const tool = await this.prisma.tool.findFirst({
      where: { id: dto.toolId, teamId },
    });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }

    // Verify agent key exists if provided
    if (dto.agentKeyId) {
      const agentKey = await this.prisma.agentKey.findFirst({
        where: { id: dto.agentKeyId, teamId },
      });
      if (!agentKey) {
        throw new NotFoundException('Agent key not found');
      }

      // Validate that tool and agent key are in the same environment
      if (agentKey.envId !== tool.envId) {
        throw new BadRequestException(
          'Agent key and tool must belong to the same environment'
        );
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

  async delete(id: string, teamId: string) {
    // Policies are linked to tools, so validate via tool's teamId
    const policy = await this.prisma.toolPolicy.findUnique({
      where: { id },
      include: { tool: { select: { teamId: true } } },
    });
    if (!policy || policy.tool.teamId !== teamId) {
      throw new NotFoundException('Policy not found');
    }
    await this.prisma.toolPolicy.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Check if an agent key is allowed to use a tool.
   * 
   * Authorization order:
   * 1. Explicit deny policies always take precedence (by ID or name pattern)
   * 2. Explicit allow policies grant access (by ID or name pattern)
   * 3. Fall back to tool's allowAllAgents setting
   */
  async isAllowed(toolId: string, agentKeyId: string): Promise<boolean> {
    const tool = await this.prisma.tool.findUnique({ where: { id: toolId } });
    if (!tool) return false;

    // Get agent key to access its name for pattern matching
    const agentKey = await this.prisma.agentKey.findUnique({ where: { id: agentKeyId } });
    if (!agentKey) return false;

    // Get all policies for this tool
    const policies = await this.prisma.toolPolicy.findMany({
      where: { toolId },
    });

    // Check for deny policies first - deny always takes precedence
    const isDenied = policies.some((policy) => {
      if (policy.action !== 'deny') return false;
      return this.policyMatchesAgent(policy, agentKeyId, agentKey.name);
    });

    if (isDenied) {
      return false;
    }

    // Check for allow policies
    const isAllowed = policies.some((policy) => {
      if (policy.action !== 'allow') return false;
      return this.policyMatchesAgent(policy, agentKeyId, agentKey.name);
    });

    if (isAllowed) {
      return true;
    }

    // Fall back to tool's default setting
    return tool.allowAllAgents;
  }

  /**
   * Check if a policy matches an agent by ID or name pattern.
   */
  private policyMatchesAgent(
    policy: { agentKeyId: string | null; agentNamePattern: string | null },
    agentKeyId: string,
    agentName: string,
  ): boolean {
    // Check exact agent key ID match
    if (policy.agentKeyId && policy.agentKeyId === agentKeyId) {
      return true;
    }

    // Check name pattern match (supports * as wildcard)
    if (policy.agentNamePattern) {
      return this.matchesPattern(agentName, policy.agentNamePattern);
    }

    return false;
  }

  /**
   * Simple glob-like pattern matching.
   * Supports * as wildcard (matches any characters).
   */
  private matchesPattern(value: string, pattern: string): boolean {
    // Convert glob pattern to regex
    // Escape regex special chars except *, then replace * with .*
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(value);
  }
}

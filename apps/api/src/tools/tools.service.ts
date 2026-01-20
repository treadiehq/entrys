import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolDto, UpdateToolDto } from './dto/tool.dto';
import { DEMO_TEAM_ID } from '../environments/environments.service';

// Helper type for mapping allowed agents with included agentKey
type AllowedAgentWithKey = {
  id: string;
  agentKeyId: string;
  agentKey: { id: string; name: string };
};

function mapAllowedAgents(agents: AllowedAgentWithKey[]) {
  return agents.map((access) => ({
    id: access.id,
    agentKeyId: access.agentKeyId,
    agentKeyName: access.agentKey.name,
  }));
}

@Injectable()
export class ToolsService {
  constructor(private prisma: PrismaService) {}

  async findAll(envId: string, teamId: string = DEMO_TEAM_ID, logicalName?: string) {
    const tools = await this.prisma.tool.findMany({
      where: { 
        envId, 
        teamId,
        ...(logicalName ? { logicalName } : {}),
      },
      orderBy: [{ logicalName: 'asc' }, { version: 'desc' }],
      include: {
        allowedAgents: {
          include: {
            agentKey: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return tools.map((tool) => ({
      ...tool,
      allowedAgents: mapAllowedAgents(tool.allowedAgents),
    }));
  }

  async findById(id: string) {
    const tool = await this.prisma.tool.findUnique({
      where: { id },
      include: {
        allowedAgents: {
          include: {
            agentKey: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
    if (!tool) {
      throw new NotFoundException('Tool not found');
    }
    return {
      ...tool,
      allowedAgents: mapAllowedAgents(tool.allowedAgents),
    };
  }

  /**
   * Resolve a tool name (or alias) to the active version
   * Resolution order: alias → logicalName → active version → backend
   */
  async resolveActiveVersion(nameOrAlias: string, envId: string, teamId: string = DEMO_TEAM_ID) {
    // First, check if it's an alias
    const alias = await this.prisma.toolAlias.findFirst({
      where: { alias: nameOrAlias, envId, teamId },
    });

    const logicalName = alias ? alias.logicalName : nameOrAlias;

    // Find the active version of this logical tool
    const tool = await this.prisma.tool.findFirst({
      where: { 
        logicalName, 
        envId, 
        teamId,
        isActive: true,
      },
    });

    return tool;
  }

  /**
   * @deprecated Use resolveActiveVersion instead. Kept for backwards compatibility.
   */
  async findByName(name: string, envId: string) {
    // Now resolves using logical name and active version
    return this.resolveActiveVersion(name, envId);
  }

  async create(envId: string, dto: CreateToolDto, teamId: string = DEMO_TEAM_ID) {
    // Check for duplicate logicalName + version in same env
    const existing = await this.prisma.tool.findFirst({
      where: { logicalName: dto.logicalName, version: dto.version, envId, teamId },
    });
    if (existing) {
      throw new ConflictException(
        `Tool "${dto.logicalName}" version "${dto.version}" already exists in this environment`
      );
    }

    // If this is the first version and isActive is not set, make it active by default
    const existingVersions = await this.prisma.tool.count({
      where: { logicalName: dto.logicalName, envId, teamId },
    });
    const shouldBeActive = dto.isActive ?? (existingVersions === 0);

    // If activating this version, deactivate others first
    if (shouldBeActive) {
      await this.prisma.tool.updateMany({
        where: { logicalName: dto.logicalName, envId, teamId, isActive: true },
        data: { isActive: false },
      });
    }

    const tool = await this.prisma.tool.create({
      data: {
        teamId,
        envId,
        logicalName: dto.logicalName,
        version: dto.version,
        displayName: dto.displayName,
        type: dto.type || 'http',
        method: dto.method || 'POST',
        urlTemplate: dto.urlTemplate,
        headersJson: dto.headersJson,
        mcpToolName: dto.mcpToolName,
        allowAllAgents: dto.allowAllAgents ?? true,
        redactionEnabled: dto.redactionEnabled ?? true,
        isActive: shouldBeActive,
        allowedAgents: dto.allowedAgentIds?.length
          ? {
              create: dto.allowedAgentIds.map((agentKeyId) => ({
                agentKeyId,
              })),
            }
          : undefined,
      },
      include: {
        allowedAgents: {
          include: {
            agentKey: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return {
      ...tool,
      allowedAgents: mapAllowedAgents(tool.allowedAgents),
    };
  }

  async update(id: string, dto: UpdateToolDto) {
    const tool = await this.findById(id);

    // Handle allowed agents update
    if (dto.allowedAgentIds !== undefined) {
      await this.prisma.toolAgentAccess.deleteMany({
        where: { toolId: id },
      });

      if (dto.allowedAgentIds.length > 0) {
        await this.prisma.toolAgentAccess.createMany({
          data: dto.allowedAgentIds.map((agentKeyId) => ({
            toolId: id,
            agentKeyId,
          })),
        });
      }
    }

    const updated = await this.prisma.tool.update({
      where: { id: tool.id },
      data: {
        displayName: dto.displayName,
        method: dto.method,
        urlTemplate: dto.urlTemplate,
        headersJson: dto.headersJson,
        mcpToolName: dto.mcpToolName,
        allowAllAgents: dto.allowAllAgents,
        redactionEnabled: dto.redactionEnabled,
      },
      include: {
        allowedAgents: {
          include: {
            agentKey: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return {
      ...updated,
      allowedAgents: mapAllowedAgents(updated.allowedAgents),
    };
  }

  /**
   * Activate a specific tool version
   * Deactivates all other versions of the same logical tool
   */
  async activate(id: string) {
    const tool = await this.findById(id);

    if (tool.isActive) {
      return tool; // Already active
    }

    // Deactivate all other versions
    await this.prisma.tool.updateMany({
      where: { 
        logicalName: tool.logicalName, 
        envId: tool.envId, 
        teamId: tool.teamId,
        isActive: true,
      },
      data: { isActive: false },
    });

    // Activate this version
    const activated = await this.prisma.tool.update({
      where: { id },
      data: { isActive: true },
      include: {
        allowedAgents: {
          include: {
            agentKey: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      ...activated,
      allowedAgents: mapAllowedAgents(activated.allowedAgents),
    };
  }

  /**
   * Deactivate a tool version
   * Warning: This leaves no active version for the logical tool
   */
  async deactivate(id: string) {
    const tool = await this.findById(id);

    if (!tool.isActive) {
      return tool; // Already inactive
    }

    const deactivated = await this.prisma.tool.update({
      where: { id },
      data: { isActive: false },
      include: {
        allowedAgents: {
          include: {
            agentKey: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      ...deactivated,
      allowedAgents: mapAllowedAgents(deactivated.allowedAgents),
    };
  }

  /**
   * Get the currently active version for a logical tool name
   */
  async getActiveVersion(logicalName: string, envId: string, teamId: string = DEMO_TEAM_ID) {
    const tool = await this.prisma.tool.findFirst({
      where: { logicalName, envId, teamId, isActive: true },
    });
    return tool;
  }

  async delete(id: string) {
    const tool = await this.findById(id);
    await this.prisma.tool.delete({
      where: { id: tool.id },
    });
    return { success: true };
  }
}

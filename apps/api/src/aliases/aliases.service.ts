import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateToolAliasDto } from './dto/create-alias.dto';

@Injectable()
export class AliasesService {
  constructor(private prisma: PrismaService) {}

  async findAll(envId: string, teamId: string) {
    return this.prisma.toolAlias.findMany({
      where: { envId, teamId },
      orderBy: { alias: 'asc' },
    });
  }

  async findByAlias(alias: string, envId: string, teamId: string) {
    return this.prisma.toolAlias.findFirst({
      where: { alias, envId, teamId },
    });
  }

  async create(envId: string, dto: CreateToolAliasDto, teamId: string) {
    // Check if alias already exists
    const existing = await this.prisma.toolAlias.findFirst({
      where: { alias: dto.alias, envId, teamId },
    });
    if (existing) {
      throw new ConflictException(`Alias "${dto.alias}" already exists in this environment`);
    }

    // Verify that the logical name exists (at least one version)
    const tool = await this.prisma.tool.findFirst({
      where: { logicalName: dto.logicalName, envId, teamId },
    });
    if (!tool) {
      throw new NotFoundException(`Tool with logicalName "${dto.logicalName}" not found`);
    }

    return this.prisma.toolAlias.create({
      data: {
        teamId,
        envId,
        alias: dto.alias,
        logicalName: dto.logicalName,
      },
    });
  }

  async delete(id: string, teamId: string) {
    const alias = await this.prisma.toolAlias.findFirst({
      where: { id, teamId },
    });
    if (!alias) {
      throw new NotFoundException('Alias not found');
    }

    await this.prisma.toolAlias.delete({
      where: { id },
    });
    return { success: true };
  }

  /**
   * Resolve an alias to its logical name
   * Returns the logicalName if found, otherwise returns the original name
   */
  async resolveAlias(nameOrAlias: string, envId: string, teamId: string): Promise<string> {
    const alias = await this.prisma.toolAlias.findFirst({
      where: { alias: nameOrAlias, envId, teamId },
    });
    return alias ? alias.logicalName : nameOrAlias;
  }
}

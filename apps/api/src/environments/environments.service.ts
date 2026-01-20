import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnvironmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(teamId: string) {
    if (!teamId) {
      throw new BadRequestException('teamId is required');
    }
    return this.prisma.environment.findMany({
      where: { teamId },
      orderBy: { name: 'asc' },
    });
  }

  async findByName(name: 'staging' | 'prod', teamId: string) {
    if (!teamId) {
      throw new BadRequestException('teamId is required');
    }
    return this.prisma.environment.findFirst({
      where: { teamId, name },
    });
  }

  async findById(id: string, teamId: string) {
    if (!teamId) {
      throw new BadRequestException('teamId is required');
    }
    return this.prisma.environment.findFirst({
      where: { id, teamId },
    });
  }
}

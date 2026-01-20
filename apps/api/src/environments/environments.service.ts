import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Demo team ID - in production, this would come from auth context
export const DEMO_TEAM_ID = 'demo-team-id';

@Injectable()
export class EnvironmentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(teamId: string = DEMO_TEAM_ID) {
    return this.prisma.environment.findMany({
      where: { teamId },
      orderBy: { name: 'asc' },
    });
  }

  async findByName(name: 'staging' | 'prod', teamId: string = DEMO_TEAM_ID) {
    return this.prisma.environment.findFirst({
      where: { teamId, name },
    });
  }

  async findById(id: string) {
    return this.prisma.environment.findUnique({
      where: { id },
    });
  }
}

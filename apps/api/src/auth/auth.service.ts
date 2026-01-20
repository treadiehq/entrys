import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { AgentKey } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate an agent API key and return the agent key record if valid
   */
  async validateAgentKey(plainKey: string): Promise<AgentKey | null> {
    if (!plainKey || !plainKey.startsWith('ent_')) {
      return null;
    }

    const prefix = plainKey.substring(0, 12);
    
    // Find all keys with this prefix (should be few)
    const candidates = await this.prisma.agentKey.findMany({
      where: {
        keyPrefix: prefix,
        isRevoked: false,
      },
    });

    // Verify the full key against each candidate
    for (const candidate of candidates) {
      const isMatch = await bcrypt.compare(plainKey, candidate.keyHash);
      if (isMatch) {
        // Update last used timestamp (fire and forget)
        this.prisma.agentKey.update({
          where: { id: candidate.id },
          data: { lastUsedAt: new Date() },
        }).catch(() => {});
        
        return candidate;
      }
    }

    return null;
  }

  /**
   * Validate admin key from request
   */
  validateAdminKey(key: string): boolean {
    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey) {
      console.warn('ADMIN_KEY not set in environment');
      return false;
    }
    return key === adminKey;
  }

  /**
   * Generate a new agent key
   */
  async generateAgentKey(
    teamId: string,
    envId: string,
    name: string,
  ): Promise<{ plainKey: string; agentKey: AgentKey }> {
    const { randomBytes } = await import('crypto');
    
    // Determine environment prefix
    const env = await this.prisma.environment.findUnique({ where: { id: envId } });
    const envPrefix = env?.name === 'prod' ? 'live' : 'stag';
    
    const randomPart = randomBytes(24).toString('base64url');
    const plainKey = `ent_${envPrefix}_${randomPart}`;
    const keyPrefix = plainKey.substring(0, 12);
    const keyHash = await bcrypt.hash(plainKey, 10);

    const agentKey = await this.prisma.agentKey.create({
      data: {
        teamId,
        envId,
        name,
        keyHash,
        keyPrefix,
      },
    });

    return { plainKey, agentKey };
  }
}

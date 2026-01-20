import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AgentKey } from '@prisma/client';

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_EXPIRY_DAYS = 30;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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

  // ============================================
  // Magic Link Authentication
  // ============================================

  /**
   * Initiate signup - creates magic link token with org name
   */
  async initiateSignup(email: string, orgName: string): Promise<{ success: boolean; message: string }> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, message: 'An account with this email already exists. Please log in instead.' };
    }

    // Check if org name already exists
    const existingTeam = await this.prisma.team.findUnique({ where: { name: orgName } });
    if (existingTeam) {
      return { success: false, message: 'An organization with this name already exists. Please choose a different name.' };
    }

    // Generate magic link token
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.magicLinkToken.create({
      data: {
        token,
        email,
        teamName: orgName,
        expiresAt,
      },
    });

    // Send magic link email
    await this.emailService.sendMagicLink(email, token, 'signup');

    return { success: true, message: 'Magic link sent' };
  }

  /**
   * Initiate login - creates magic link token for existing user
   */
  async initiateLogin(email: string): Promise<{ success: boolean; message: string }> {
    // Find existing user
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, message: 'No account found with this email. Please sign up first.' };
    }

    // Generate magic link token
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000);

    await this.prisma.magicLinkToken.create({
      data: {
        token,
        email,
        userId: user.id,
        expiresAt,
      },
    });

    // Send magic link email
    await this.emailService.sendMagicLink(email, token, 'login');

    return { success: true, message: 'Magic link sent' };
  }

  /**
   * Verify magic link token and create session
   */
  async verifyMagicLink(token: string): Promise<{
    success: boolean;
    message?: string;
    sessionToken?: string;
    user?: { id: string; email: string };
    team?: { id: string; name: string };
  }> {
    // Find the token
    const magicLink = await this.prisma.magicLinkToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLink) {
      return { success: false, message: 'Invalid or expired link' };
    }

    if (magicLink.usedAt) {
      return { success: false, message: 'This link has already been used' };
    }

    if (magicLink.expiresAt < new Date()) {
      return { success: false, message: 'This link has expired' };
    }

    // Mark token as used
    await this.prisma.magicLinkToken.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    let user = magicLink.user;
    let team: { id: string; name: string } | null = null;

    // If this is a signup (has teamName but no userId)
    if (magicLink.teamName && !magicLink.userId) {
      // Create user, team, and membership in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create user
        const newUser = await tx.user.create({
          data: { email: magicLink.email },
        });

        // Create team/org
        const newTeam = await tx.team.create({
          data: { name: magicLink.teamName! },
        });

        // Create membership (owner)
        await tx.teamMember.create({
          data: {
            userId: newUser.id,
            teamId: newTeam.id,
            role: 'owner',
          },
        });

        // Create default environments
        await tx.environment.createMany({
          data: [
            { teamId: newTeam.id, name: 'staging' },
            { teamId: newTeam.id, name: 'prod' },
          ],
        });

        return { user: newUser, team: newTeam };
      });

      user = result.user;
      team = result.team;
    } else if (user) {
      // Existing user login - get their first team
      const membership = await this.prisma.teamMember.findFirst({
        where: { userId: user.id },
        include: { team: true },
      });
      team = membership?.team || null;
    }

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Create session
    const sessionToken = randomBytes(32).toString('base64url');
    const sessionExpiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        token: sessionToken,
        userId: user.id,
        expiresAt: sessionExpiresAt,
      },
    });

    return {
      success: true,
      sessionToken,
      user: { id: user.id, email: user.email },
      team: team ? { id: team.id, name: team.name } : undefined,
    };
  }

  /**
   * Validate a session token
   */
  async validateSession(sessionToken: string): Promise<{
    user: { id: string; email: string };
    teams: Array<{ id: string; name: string; role: string }>;
  } | null> {
    const session = await this.prisma.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          include: {
            memberships: {
              include: { team: true },
            },
          },
        },
      },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      user: { id: session.user.id, email: session.user.email },
      teams: session.user.memberships.map((m) => ({
        id: m.team.id,
        name: m.team.name,
        role: m.role,
      })),
    };
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionToken: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { token: sessionToken },
    });
  }
}

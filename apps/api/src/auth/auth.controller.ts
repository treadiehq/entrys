import { Controller, Post, Get, Body, Query, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, VerifyDto } from './dto/auth.dto';

@Controller('v1')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const result = await this.authService.initiateSignup(dto.email, dto.orgName);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      ok: true,
      message: 'Magic link sent to your email',
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.initiateLogin(dto.email);
    if (!result.success) {
      throw new BadRequestException(result.message);
    }
    return {
      ok: true,
      message: 'Magic link sent to your email',
    };
  }

  @Get('verify')
  async verify(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    const result = await this.authService.verifyMagicLink(token);
    if (!result.success) {
      throw new UnauthorizedException(result.message);
    }

    return {
      ok: true,
      sessionToken: result.sessionToken,
      user: result.user,
      team: result.team,
    };
  }

  @Post('logout')
  async logout(@Body('sessionToken') sessionToken: string) {
    if (!sessionToken) {
      throw new BadRequestException('Session token is required');
    }

    await this.authService.invalidateSession(sessionToken);
    return { ok: true };
  }

  @Get('me')
  async me(@Query('sessionToken') sessionToken: string) {
    if (!sessionToken) {
      throw new UnauthorizedException('Session token is required');
    }

    const result = await this.authService.validateSession(sessionToken);
    if (!result) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return {
      ok: true,
      user: result.user,
      teams: result.teams,
    };
  }
}

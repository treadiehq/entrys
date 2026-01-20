import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const agentKey = await this.authService.validateAgentKey(apiKey);
    if (!agentKey) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    // Attach agent key to request for downstream use
    request.agentKey = agentKey;
    return true;
  }
}

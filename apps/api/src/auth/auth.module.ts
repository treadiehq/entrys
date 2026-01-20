import { Module } from '@nestjs/common';
import { AdminKeyGuard } from './guards/admin-key.guard';
import { ApiKeyGuard } from './guards/api-key.guard';
import { AuthService } from './auth.service';

@Module({
  providers: [AuthService, AdminKeyGuard, ApiKeyGuard],
  exports: [AuthService, AdminKeyGuard, ApiKeyGuard],
})
export class AuthModule {}

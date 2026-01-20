import { Module } from '@nestjs/common';
import { AliasesService } from './aliases.service';
import { AliasesController } from './aliases.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EnvironmentsModule } from '../environments/environments.module';

@Module({
  imports: [PrismaModule, AuthModule, EnvironmentsModule],
  controllers: [AliasesController],
  providers: [AliasesService],
  exports: [AliasesService],
})
export class AliasesModule {}

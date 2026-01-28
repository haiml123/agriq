import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TranslationController } from './translation.controller';
import { TranslationService } from './translation.service';

@Module({
  imports: [PrismaModule],
  controllers: [TranslationController],
  providers: [TranslationService, RolesGuard],
  exports: [TranslationService],
})
export class TranslationModule {}

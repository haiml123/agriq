import { Module } from '@nestjs/common';
import { TriggerController } from './trigger.controller';
import { TriggerService } from './trigger.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TriggerController],
  providers: [TriggerService],
  exports: [TriggerService],
})
export class TriggerModule {}

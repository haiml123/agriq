import { Module } from '@nestjs/common';
import { TriggerController } from './trigger.controller';
import { TriggerService } from './trigger.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TriggerEvaluatorService } from './trigger-evaluator.service';
import { TriggerContextService } from './trigger-context.service';

@Module({
  imports: [PrismaModule],
  controllers: [TriggerController],
  providers: [TriggerService, TriggerEvaluatorService, TriggerContextService],
  exports: [TriggerService, TriggerEvaluatorService, TriggerContextService],
})
export class TriggerModule {}

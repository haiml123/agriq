import { Module } from '@nestjs/common';
import { TriggerController } from './trigger.controller';
import { TriggerService } from './trigger.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WeatherModule } from '../weather';
import { TriggerEvaluatorService } from './trigger-evaluator.service';
import { TriggerContextService } from './trigger-context.service';
import { TriggerEngineService } from './trigger-engine.service';

@Module({
  imports: [PrismaModule, WeatherModule],
  controllers: [TriggerController],
  providers: [
    TriggerService,
    TriggerEvaluatorService,
    TriggerContextService,
    TriggerEngineService,
  ],
  exports: [
    TriggerService,
    TriggerEvaluatorService,
    TriggerContextService,
    TriggerEngineService,
  ],
})
export class TriggerModule {}

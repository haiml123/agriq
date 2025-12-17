import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { TriggerModule } from '../trigger';

@Module({
  imports: [TriggerModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}

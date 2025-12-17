import { Injectable } from '@nestjs/common';
import { TriggerService } from '../trigger/trigger.service';
import {
  CreateTriggerDto,
  ListTriggersQueryDto,
  UpdateTriggerDto,
} from '../trigger/dto';

@Injectable()
export class EventsService {
  constructor(private readonly triggerService: TriggerService) {}

  createTrigger(dto: CreateTriggerDto, userId: string) {
    return this.triggerService.create(dto, userId);
  }

  findAllTriggers(query: ListTriggersQueryDto) {
    return this.triggerService.findAll(query);
  }

  findOneTrigger(id: string) {
    return this.triggerService.findOne(id);
  }

  updateTrigger(id: string, dto: UpdateTriggerDto, userId: string) {
    return this.triggerService.update(id, dto, userId);
  }

  toggleTrigger(id: string, isActive: boolean, userId: string) {
    return this.triggerService.toggleActive(id, isActive, userId);
  }

  removeTrigger(id: string, userId: string) {
    return this.triggerService.remove(id, userId);
  }
}

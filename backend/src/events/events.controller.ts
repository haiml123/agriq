import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, Public } from '../auth/decorators';
import {
  CreateTriggerDto,
  ListTriggersQueryDto,
  UpdateTriggerDto,
} from '../trigger/dto';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * Create a new event trigger
   * POST /events/triggers
   */
  @Post('triggers')
  createTrigger(
    @Body() dto: CreateTriggerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.createTrigger(dto, userId);
  }

  /**
   * Get all event triggers with filtering and pagination
   * GET /events/triggers
   */
  @Public()
  @Get('triggers')
  findAllTriggers(@Query() query: ListTriggersQueryDto) {
    return this.eventsService.findAllTriggers(query);
  }

  /**
   * Get a single event trigger by ID
   * GET /events/triggers/:id
   */
  @Public()
  @Get('triggers/:id')
  findOneTrigger(@Param('id') id: string) {
    return this.eventsService.findOneTrigger(id);
  }

  /**
   * Update an event trigger
   * PATCH /events/triggers/:id
   */
  @Patch('triggers/:id')
  updateTrigger(
    @Param('id') id: string,
    @Body() dto: UpdateTriggerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.updateTrigger(id, dto, userId);
  }

  /**
   * Toggle event trigger active status
   * PATCH /events/triggers/:id/toggle
   */
  @Patch('triggers/:id/toggle')
  toggleTrigger(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser('id') userId: string,
  ) {
    return this.eventsService.toggleTrigger(id, isActive, userId);
  }

  /**
   * Delete an event trigger (soft delete)
   * DELETE /events/triggers/:id
   */
  @Delete('triggers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeTrigger(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.eventsService.removeTrigger(id, userId);
  }
}

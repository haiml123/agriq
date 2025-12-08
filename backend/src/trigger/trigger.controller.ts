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
import { TriggerService } from './trigger.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, Public } from '../auth/decorators';
import {
  CreateTriggerDto,
  ListTriggersQueryDto,
  UpdateTriggerDto,
} from './dto';

@Controller('triggers')
@UseGuards(JwtAuthGuard)
export class TriggerController {
  constructor(private readonly triggerService: TriggerService) {}

  /**
   * Create a new trigger
   * POST /triggers
   */
  @Post()
  create(@Body() dto: CreateTriggerDto, @CurrentUser('id') userId: string) {
    return this.triggerService.create(dto, userId);
  }

  /**
   * Get all triggers with filtering and pagination
   * GET /triggers
   */
  @Public()
  @Get()
  findAll(@Query() query: ListTriggersQueryDto) {
    return this.triggerService.findAll(query);
  }

  /**
   * Get a single trigger by ID
   * GET /triggers/:id
   */
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.triggerService.findOne(id);
  }

  /**
   * Update a trigger
   * PATCH /triggers/:id
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTriggerDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.triggerService.update(id, dto, userId);
  }

  /**
   * Toggle trigger active status
   * PATCH /triggers/:id/toggle
   */
  @Patch(':id/toggle')
  toggleActive(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser('id') userId: string,
  ) {
    return this.triggerService.toggleActive(id, isActive, userId);
  }

  /**
   * Delete a trigger (soft delete)
   * DELETE /triggers/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    await this.triggerService.remove(id, userId);
  }
}

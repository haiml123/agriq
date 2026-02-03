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
import { CurrentUser } from '../auth/decorators';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { user_role } from '@prisma/client';
import {
  CreateTriggerDto,
  ListTriggersQueryDto,
  UpdateTriggerDto,
} from './dto';

@Controller('triggers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(user_role.SUPER_ADMIN)
export class TriggerController {
  constructor(private readonly triggerService: TriggerService) {}

  /**
   * Create a new trigger
   * POST /triggers
   */
  @Post()
  create(@Body() dto: CreateTriggerDto, @CurrentUser('id') userId: string) {
    // Forward to service with creator ID.
    return this.triggerService.create(dto, userId);
  }

  /**
   * Get all triggers with filtering and pagination
   * GET /triggers
   */
  @Get()
  findAll(@Query() query: ListTriggersQueryDto) {
    // Delegate pagination + filtering to the service.
    return this.triggerService.findAll(query);
  }

  /**
   * Get a single trigger by ID
   * GET /triggers/:id
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    // Fetch a single trigger by ID.
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
    // Update selected fields.
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
    // Toggle trigger activation.
    return this.triggerService.toggleActive(id, isActive, userId);
  }

  /**
   * Delete a trigger (soft delete)
   * DELETE /triggers/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    // Soft-delete by disabling the trigger.
    await this.triggerService.remove(id, userId);
  }
}

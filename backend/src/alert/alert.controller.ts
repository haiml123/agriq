import {
  Controller,
  Get,
  Query,
  UseGuards,
  Patch,
  Param,
  Body,
} from '@nestjs/common';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../auth/guards';
import { Public } from '../auth/decorators';
import { parsePagination } from '../utils/pagination';

@Controller('alerts')
@UseGuards(JwtAuthGuard)
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  /**
   * Get active alerts for dashboard
   * GET /alerts
   */
  @Public()
  @Get()
  findAll(
    @Query('organizationId') organizationId?: string,
    @Query('userId') userId?: string,
    @Query('siteId') siteId?: string,
    @Query('compoundId') compoundId?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('startDate') startDate?: string,
    @Query('limit') limit?: string,
  ) {
    const { limit: parsedLimit } = parsePagination({
      limit,
      defaultLimit: 100,
    });

    return this.alertService.findAll({
      organizationId,
      userId,
      siteId,
      compoundId,
      status,
      severity,
      startDate,
      limit: parsedLimit,
    });
  }

  /**
   * Acknowledge an alert
   * PATCH /alerts/:id/acknowledge
   */
  @Public()
  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string) {
    return this.alertService.acknowledge(id);
  }

  /**
   * Update alert status
   * PATCH /alerts/:id/status
   */
  @Public()
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.alertService.updateStatus(id, body.status);
  }
}

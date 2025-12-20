import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AlertService } from './alert.service';
import { JwtAuthGuard } from '../auth/guards';
import { Public } from '../auth/decorators';

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
    @Query('limit') limit?: string,
  ) {
    return this.alertService.findAll(
      organizationId,
      limit ? parseInt(limit) : 10,
    );
  }
}

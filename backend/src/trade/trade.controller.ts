import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TradeService } from './trade.service';
import { JwtAuthGuard } from '../auth/guards';
import { Public } from '../auth/decorators';

@Controller('trades')
@UseGuards(JwtAuthGuard)
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  /**
   * Get recent trades for dashboard
   * GET /trades/recent
   */
  @Public()
  @Get('recent')
  findRecent(
    @Query('organizationId') organizationId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tradeService.findRecent(
      organizationId,
      limit ? parseInt(limit) : 10,
    );
  }
}

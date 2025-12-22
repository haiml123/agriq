import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { TradeService } from './trade.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, Public } from '../auth/decorators';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { user_role } from '@prisma/client';
import { CreateTradeDto } from './dto';

@Controller('trades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  /**
   * Create a new trade
   * POST /trades
   */
  @Post()
  @Roles(user_role.SUPER_ADMIN, user_role.ADMIN, user_role.OPERATOR)
  create(
    @Body() dto: CreateTradeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.tradeService.create(dto, userId);
  }

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

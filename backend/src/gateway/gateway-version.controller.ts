import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import type { AppUser } from '../types/user.type';
import {
  CreateGatewayVersionDto,
  SetActiveGatewayVersionDto,
} from './dto';
import { GatewayVersionService } from './gateway-version.service';

@Controller('gateway-versions')
@UseGuards(JwtAuthGuard)
export class GatewayVersionController {
  constructor(private readonly gatewayVersionService: GatewayVersionService) {}

  @Get()
  listGatewayVersions(@CurrentUser() user: AppUser) {
    return this.gatewayVersionService.listGatewayVersions(user);
  }

  @Get('active')
  getActiveGatewayVersion(@CurrentUser() user: AppUser) {
    return this.gatewayVersionService.getActiveGatewayVersion(user);
  }

  @Post()
  createGatewayVersion(
    @CurrentUser() user: AppUser,
    @Body() dto: CreateGatewayVersionDto,
  ) {
    return this.gatewayVersionService.createGatewayVersion(user, dto);
  }

  @Patch('active')
  setActiveGatewayVersion(
    @CurrentUser() user: AppUser,
    @Body() dto: SetActiveGatewayVersionDto,
  ) {
    return this.gatewayVersionService.setActiveGatewayVersion(user, dto);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import * as userType from '../types/user.type';
import { CreateGatewayDto, UpdateGatewayDto } from './dto';

@Controller('gateways')
@UseGuards(JwtAuthGuard)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get()
  listGateways(
    @CurrentUser() user: userType.AppUser,
    @Query('cellId') cellId?: string,
  ) {
    return this.gatewayService.listGateways(user, cellId);
  }

  @Get(':id')
  findGatewayById(
    @Param('id') id: string,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.findGatewayById(user, id);
  }

  @Post()
  createGateway(
    @Body() dto: CreateGatewayDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.createGateway(user, dto);
  }

  @Patch(':id')
  updateGateway(
    @Param('id') id: string,
    @Body() dto: UpdateGatewayDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.updateGateway(user, id, dto);
  }

  @Delete(':id')
  deleteGateway(
    @Param('id') id: string,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.deleteGateway(user, id);
  }
}

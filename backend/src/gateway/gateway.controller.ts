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
import { CurrentUser, Public } from '../auth/decorators';
import * as userType from '../types/user.type';
import {
  AssignGatewayDto,
  CreateGatewayDto,
  BatchGatewayPayloadDto,
  RegisterGatewayDto,
  UpdateGatewayDto,
} from './dto';

@Controller('gateways')
@UseGuards(JwtAuthGuard)
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Get()
  listGateways(
    @CurrentUser() user: userType.AppUser,
    @Query('cellId') cellId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('unpaired') unpaired?: string,
  ) {
    return this.gatewayService.listGateways(user, {
      cellId,
      organizationId,
      unpaired: unpaired === 'true',
    });
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

  @Post('register')
  registerGateway(
    @Body() dto: RegisterGatewayDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.registerGateway(user, dto);
  }

  @Post(':id/assign')
  assignGateway(
    @Param('id') id: string,
    @Body() dto: AssignGatewayDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.assignGatewayToCell(user, id, dto);
  }

  @Post(':id/unpair')
  unpairGateway(
    @Param('id') id: string,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.gatewayService.unpairGateway(user, id);
  }

  @Post(':id/readings')
  @Public()
  ingestGatewayPayload(
    @Param('id') id: string,
    @Body() dto: BatchGatewayPayloadDto,
  ) {
    return this.gatewayService.ingestGatewayPayloadFromDevice(id, dto);
  }
}

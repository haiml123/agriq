import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import * as userType from '../types/user.type';
import {
  BatchGatewayReadingsDto,
  BatchSensorReadingsDto,
  CreateSensorDto,
  TransferSensorDto,
} from './dto';
import { GatewaySimulatorService } from './gateway-simulator.service';

@Controller('gateways/simulator')
@UseGuards(JwtAuthGuard)
export class GatewaySimulatorController {
  constructor(private readonly simulatorService: GatewaySimulatorService) {}

  @Get('sensors')
  listSensors(
    @CurrentUser() user: userType.AppUser,
    @Query('gatewayId') gatewayId?: string,
    @Query('cellId') cellId?: string,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.simulatorService.listSensors(
      user,
      gatewayId,
      cellId,
      organizationId,
    );
  }

  @Post('sensors')
  createSensor(
    @Body() dto: CreateSensorDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.simulatorService.createSensor(user, dto);
  }

  @Patch('sensors/:id/transfer')
  transferSensor(
    @Param('id') id: string,
    @Body() dto: TransferSensorDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.simulatorService.transferSensor(user, id, dto);
  }

  @Post('sensors/:id/readings/batch')
  createSensorReadingsBatch(
    @Param('id') id: string,
    @Body() dto: BatchSensorReadingsDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.simulatorService.createSensorReadingsBatch(user, id, dto);
  }

  @Get('sensors/:id/readings')
  listSensorReadings(
    @Param('id') id: string,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: userType.AppUser,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.simulatorService.listSensorReadings(
      user,
      id,
      Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    );
  }

  @Post(':id/readings/batch')
  createGatewayReadingsBatch(
    @Param('id') id: string,
    @Body() dto: BatchGatewayReadingsDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.simulatorService.createGatewayReadingsBatch(user, id, dto);
  }

  @Post(':id/readings/simulate')
  simulateGatewayReadingsBatch(
    @Param('id') id: string,
    @Body() dto: BatchGatewayReadingsDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.simulatorService.simulateGatewayReadingsBatch(user, id, dto);
  }

  @Get(':id/readings')
  listGatewayReadings(
    @Param('id') id: string,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: userType.AppUser,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.simulatorService.listGatewayReadings(
      user,
      id,
      Number.isFinite(parsedLimit) ? parsedLimit : undefined,
    );
  }

  @Get(':id/readings/range')
  listGatewayReadingsRange(
    @Param('id') id: string,
    @Query('start') start: string | undefined,
    @Query('end') end: string | undefined,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.simulatorService.listGatewayReadingsRange(user, id, start, end);
  }

  @Post(':id/readings/range/clear')
  clearGatewayReadingsRange(
    @Param('id') id: string,
    @Query('start') start: string | undefined,
    @Query('end') end: string | undefined,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.simulatorService.clearGatewayReadingsRange(user, id, start, end);
  }
}

import { Injectable } from '@nestjs/common';
import { SensorService } from '../sensor/sensor.service';
import { GatewayService } from './gateway.service';
import {
  BatchGatewayReadingsDto,
  BatchSensorReadingsDto,
  CreateSensorDto,
  TransferSensorDto,
} from './dto';
import { AppUser } from '../types/user.type';

@Injectable()
export class GatewaySimulatorService {
  constructor(
    private readonly sensorService: SensorService,
    private readonly gatewayService: GatewayService,
  ) {}

  listSensors(user: AppUser, gatewayId?: string, cellId?: string) {
    return this.sensorService.listSensors(user, gatewayId, cellId);
  }

  createSensor(user: AppUser, dto: CreateSensorDto) {
    return this.sensorService.createSensor(user, dto);
  }

  transferSensor(user: AppUser, sensorId: string, dto: TransferSensorDto) {
    return this.sensorService.transferSensor(user, sensorId, dto);
  }

  createSensorReadingsBatch(
    user: AppUser,
    sensorId: string,
    dto: BatchSensorReadingsDto,
  ) {
    return this.sensorService.createSensorReadingsBatch(user, sensorId, dto);
  }

  listSensorReadings(user: AppUser, sensorId: string, limit?: number) {
    return this.sensorService.listSensorReadings(user, sensorId, limit);
  }

  createGatewayReadingsBatch(
    user: AppUser,
    gatewayId: string,
    dto: BatchGatewayReadingsDto,
  ) {
    return this.gatewayService.createGatewayReadingsBatch(user, gatewayId, dto);
  }

  listGatewayReadings(user: AppUser, gatewayId: string, limit?: number) {
    return this.gatewayService.listGatewayReadings(user, gatewayId, limit);
  }
}

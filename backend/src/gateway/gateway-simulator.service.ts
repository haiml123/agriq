import { Injectable } from '@nestjs/common';
import { SensorService } from '../sensor/sensor.service';
import { GatewayService } from './gateway.service';
import {
  BatchGatewayReadingsDto,
  BatchSensorReadingsDto,
  CreateGatewayPayloadDto,
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
    const payloads: CreateGatewayPayloadDto[] = dto.readings.map((reading) => ({
      temperature: reading.temperature,
      humidity: reading.humidity,
      batteryPercent: reading.batteryPercent,
      recordedAt: reading.recordedAt,
    }));

    return Promise.all(
      payloads.map((payload) =>
        this.gatewayService.ingestGatewayPayloadFromDevice(gatewayId, payload),
      ),
    );
  }

  listGatewayReadings(user: AppUser, gatewayId: string, limit?: number) {
    return this.gatewayService.listGatewayReadings(user, gatewayId, limit);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SiteAccessService } from '../site/site-access.service';
import { entity_status } from '@prisma/client';
import { AppUser } from '../types/user.type';
import {
  BatchSensorReadingsDto,
  CreateSensorDto,
  TransferSensorDto,
} from '../gateway/dto';

@Injectable()
export class SensorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siteAccess: SiteAccessService,
  ) {}

  private async validateGatewayAccess(user: AppUser, gatewayId: string) {
    const gateway = await this.prisma.gateway.findUnique({
      where: { id: gatewayId },
      select: { id: true, cellId: true },
    });

    if (!gateway) {
      throw new NotFoundException(`Gateway with ID "${gatewayId}" not found`);
    }

    await this.siteAccess.validateCellAccess(user, gateway.cellId);
    return gateway;
  }

  async listSensors(user: AppUser, gatewayId?: string, cellId?: string) {
    this.siteAccess.ensureSuperAdmin(user);

    if (gatewayId) {
      await this.validateGatewayAccess(user, gatewayId);
    } else if (cellId) {
      await this.siteAccess.validateCellAccess(user, cellId);
    }

    return this.prisma.sensor.findMany({
      where: gatewayId
        ? { gatewayId }
        : cellId
          ? { gateway: { cellId } }
          : undefined,
      include: {
        gateway: {
          select: {
            id: true,
            name: true,
            cell: {
              select: {
                id: true,
                name: true,
                compound: {
                  select: {
                    id: true,
                    name: true,
                    site: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createSensor(user: AppUser, dto: CreateSensorDto) {
    this.siteAccess.ensureSuperAdmin(user);
    await this.validateGatewayAccess(user, dto.gatewayId);

    const trimmedExternalId = dto.externalId?.trim();
    const trimmedName = dto.name?.trim();

    return this.prisma.sensor.create({
      data: {
        gatewayId: dto.gatewayId,
        name: trimmedName || null,
        externalId: trimmedExternalId || `sim-${randomUUID()}`,
        status: dto.status || entity_status.ACTIVE,
        createdBy: user.id,
      },
      include: {
        gateway: {
          select: {
            id: true,
            name: true,
            cell: {
              select: {
                id: true,
                name: true,
                compound: {
                  select: {
                    id: true,
                    name: true,
                    site: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async transferSensor(
    user: AppUser,
    sensorId: string,
    dto: TransferSensorDto,
  ) {
    this.siteAccess.ensureSuperAdmin(user);
    await this.validateGatewayAccess(user, dto.gatewayId);

    const sensor = await this.prisma.sensor.findUnique({
      where: { id: sensorId },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor with ID "${sensorId}" not found`);
    }

    return this.prisma.sensor.update({
      where: { id: sensorId },
      data: {
        gatewayId: dto.gatewayId,
      },
      include: {
        gateway: {
          select: {
            id: true,
            name: true,
            cell: {
              select: {
                id: true,
                name: true,
                compound: {
                  select: {
                    id: true,
                    name: true,
                    site: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async createSensorReadingsBatch(
    user: AppUser,
    sensorId: string,
    dto: BatchSensorReadingsDto,
  ) {
    this.siteAccess.ensureSuperAdmin(user);

    if (!dto.readings || dto.readings.length === 0) {
      throw new BadRequestException('At least one reading is required');
    }

    const sensor = await this.prisma.sensor.findUnique({
      where: { id: sensorId },
      select: {
        id: true,
        gatewayId: true,
        gateway: {
          select: {
            cellId: true,
          },
        },
      },
    });

    if (!sensor || !sensor.gateway?.cellId || !sensor.gatewayId) {
      throw new NotFoundException(`Sensor with ID "${sensorId}" not found`);
    }

    const data = dto.readings.map((reading) => ({
      sensorId: sensor.id,
      gatewayId: sensor.gatewayId,
      cellId: sensor.gateway.cellId,
      temperature: reading.temperature,
      humidity: reading.humidity,
      batteryPercent: reading.batteryPercent,
      recordedAt: new Date(reading.recordedAt),
    }));

    return this.prisma.sensorReading.createMany({ data });
  }

  async listSensorReadings(user: AppUser, sensorId: string, limit = 100) {
    this.siteAccess.ensureSuperAdmin(user);

    const sensor = await this.prisma.sensor.findUnique({
      where: { id: sensorId },
      select: { id: true },
    });

    if (!sensor) {
      throw new NotFoundException(`Sensor with ID "${sensorId}" not found`);
    }

    return this.prisma.sensorReading.findMany({
      where: { sensorId },
      orderBy: { recordedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }
}

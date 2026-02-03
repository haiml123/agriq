import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GatewayService } from './gateway.service';
import {
  BatchGatewayReadingsDto,
  CreateGatewayPayloadDto,
  BatchGatewayPayloadDto,
} from './dto';
import { AppUser } from '../types/user.type';
import { PrismaService } from '../prisma/prisma.service';
import { TriggerEngineService } from '../trigger';
import type { LocalHistory } from '../trigger';
import { WeatherService } from '../weather';
import { SiteAccessService } from '../site';

@Injectable()
export class GatewaySimulatorService {
  private readonly logger = new Logger(GatewaySimulatorService.name);

  constructor(
    private readonly gatewayService: GatewayService,
    private readonly prisma: PrismaService,
    private readonly triggerEngine: TriggerEngineService,
    private readonly weatherService: WeatherService,
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

    if (!gateway.cellId) {
      throw new BadRequestException('Gateway is not paired to a cell');
    }

    await this.siteAccess.validateCellAccess(user, gateway.cellId);
    return gateway;
  }

  listSensors(
    user: AppUser,
    gatewayId?: string,
    cellId?: string,
    organizationId?: string,
  ) {
    this.siteAccess.ensureSuperAdmin(user);

    if (gatewayId) {
      return this.validateGatewayAccess(user, gatewayId).then(() =>
        this.prisma.sensor.findMany({
          where: { gatewayId },
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
        }),
      );
    }

    if (cellId) {
      this.siteAccess.validateCellAccess(user, cellId);
    } else if (organizationId) {
      this.siteAccess.validateOrganizationAccess(user, organizationId);
    }

    return this.prisma.sensor.findMany({
      where: cellId
        ? { gateway: { cellId } }
        : organizationId
          ? { gateway: { organizationId } }
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
      balls: reading.balls,
    }));

    const payload: BatchGatewayPayloadDto = { readings: payloads };
    return this.gatewayService.ingestGatewayPayloadFromDevice(
      gatewayId,
      payload,
    );
  }

  async simulateGatewayReadingsBatch(
    user: AppUser,
    gatewayId: string,
    dto: BatchGatewayReadingsDto,
  ) {
    const gateway = await this.gatewayService.findGatewayById(user, gatewayId);
    if (!gateway) {
      throw new BadRequestException('Gateway not found');
    }
    if (!gateway.cellId) {
      throw new BadRequestException('Gateway is not paired to a cell');
    }

    const readings = dto.readings ?? [];
    if (readings.length === 0) {
      throw new BadRequestException('At least one reading is required');
    }

    const sensors = await this.prisma.sensor.findMany({
      where: { gatewayId },
      select: { id: true, externalId: true },
    });
    const sensorIdByExternal = new Map(
      sensors.map((sensor) => [sensor.externalId, sensor.id]),
    );

    const commodityTypeId = await this.getCellCommodityTypeId(gateway.cellId);
    const siteId = gateway.siteId ?? gateway.cell?.compound?.site?.id;

    if (!siteId) {
      throw new BadRequestException('Gateway site not found');
    }

    this.logger.debug(
      `simulate: gateway=${gateway.id} site=${siteId} cell=${gateway.cellId} commodityType=${commodityTypeId ?? 'none'} readings=${readings.length}`,
    );

    const saveReadings = Boolean(dto.saveReadings);
    const saveAlerts = Boolean(dto.saveAlerts);
    const sendAlerts = Boolean(dto.sendAlerts);
    const alerts: Array<Record<string, unknown>> = [];
    const localHistory: LocalHistory | undefined = saveReadings
      ? undefined
      : {
          sensorHistoryById: new Map<
            string,
            { temperature: number; humidity: number; recordedAt: Date }[]
          >(),
          gatewayHistory: [],
          outsideHistory: [],
        };

    for (const reading of readings) {
      const recordedAt = new Date(reading.recordedAt);
      const outside = await this.getOutsideObservation(siteId, recordedAt);
      const balls = (reading.balls || []).map((ball) => ({
        id: ball.id.trim(),
        macId: ball.macId,
        temperature: ball.temperature,
        humidity: ball.humidity,
        recordedAt: new Date(ball.recordedAt ?? reading.recordedAt),
      }));

      // 1) Persist readings if requested (alerts are handled separately).
      if (saveReadings) {
        const payload: BatchGatewayPayloadDto = {
          readings: [
            {
              temperature: reading.temperature,
              humidity: reading.humidity,
              batteryPercent: reading.batteryPercent,
              recordedAt: reading.recordedAt,
              balls: reading.balls,
            },
          ],
        };
        // Persist readings only; alerts are handled by the simulator flow below.
        await this.gatewayService.ingestGatewayPayloadFromDevice(
          gateway.id,
          payload,
          {
            saveAlerts: false,
          },
        );
      }

      // 2) Always evaluate alerts for the current reading.
      const persistAlerts = saveAlerts;
      await this.triggerEngine.evaluateGatewayPayload(
        {
          organizationId: gateway.organizationId ?? undefined,
          commodityTypeId,
          siteId,
          compoundId: gateway.cell?.compound?.id,
          cellId: gateway.cellId,
          gatewayId: gateway.id,
        },
        {
          gateway: {
            temperature: reading.temperature,
            humidity: reading.humidity,
            recordedAt,
          },
          outside: outside ?? undefined,
          balls,
          sensorIdByExternal,
          recordedAt,
        },
        {
          skipExistingCheck: !persistAlerts,
          persistAlerts,
          localHistory,
          alertWriter: (candidate) => {
            alerts.push({
              ...candidate,
              triggerName: candidate.title,
              recordedAt: recordedAt.toISOString(),
            });
          },
        },
      );

      // 3) When not saving readings, keep an in-batch history buffer for change conditions.
      if (localHistory) {
        localHistory.gatewayHistory?.push({
          temperature: reading.temperature,
          humidity: reading.humidity,
          recordedAt,
        });

        if (outside) {
          localHistory.outsideHistory?.push({
            temperature: outside.temperature,
            humidity: outside.humidity,
            recordedAt,
          });
        }

        for (const ball of balls) {
          const sensorId = sensorIdByExternal?.get(ball.id);
          if (!sensorId) {
            continue;
          }
          const list = localHistory.sensorHistoryById?.get(sensorId) ?? [];
          list.push({
            temperature: ball.temperature,
            humidity: ball.humidity,
            recordedAt: new Date(ball.recordedAt ?? reading.recordedAt),
          });
          localHistory.sensorHistoryById?.set(sensorId, list);
        }
      }
    }

    if (sendAlerts) {
      this.logger.debug(`simulate: send alerts (count=${alerts.length})`);
    }
    return { alerts };
  }

  listGatewayReadings(user: AppUser, gatewayId: string, limit?: number) {
    return this.gatewayService.listGatewayReadings(user, gatewayId, limit);
  }

  async clearGatewayReadingsRange(
    user: AppUser,
    gatewayId: string,
    start?: string,
    end?: string,
  ) {
    const gateway = await this.gatewayService.findGatewayById(user, gatewayId);
    if (!gateway) {
      throw new BadRequestException('Gateway not found');
    }

    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;

    if (
      (startDate && Number.isNaN(startDate.getTime())) ||
      (endDate && Number.isNaN(endDate.getTime()))
    ) {
      throw new BadRequestException('Invalid start/end date');
    }

    if (!startDate && !endDate) {
      throw new BadRequestException('Start or end date is required');
    }

    const recordedAtFilter = {
      ...(startDate ? { gte: startDate } : {}),
      ...(endDate ? { lte: endDate } : {}),
    };

    const [gatewayResult, sensorResult] = await this.prisma.$transaction([
      this.prisma.gatewayReading.deleteMany({
        where: {
          gatewayId,
          recordedAt: recordedAtFilter,
        },
      }),
      this.prisma.sensorReading.deleteMany({
        where: {
          gatewayId,
          recordedAt: recordedAtFilter,
        },
      }),
    ]);

    this.logger.debug(
      `clear-readings: gateway=${gatewayId} gateway=${gatewayResult.count} sensors=${sensorResult.count}`,
    );

    return {
      gatewayDeleted: gatewayResult.count,
      sensorDeleted: sensorResult.count,
    };
  }

  async listGatewayReadingsRange(
    user: AppUser,
    gatewayId: string,
    start?: string,
    end?: string,
  ) {
    const gateway = await this.gatewayService.findGatewayById(user, gatewayId);
    if (!gateway) {
      throw new BadRequestException('Gateway not found');
    }

    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;

    const recordedAtFilter = {
      ...(startDate && !Number.isNaN(startDate.getTime())
        ? { gte: startDate }
        : {}),
      ...(endDate && !Number.isNaN(endDate.getTime()) ? { lte: endDate } : {}),
    };

    const [gatewayReadings, sensorReadings, sensors] = await Promise.all([
      this.prisma.gatewayReading.findMany({
        where: {
          gatewayId,
          ...(Object.keys(recordedAtFilter).length > 0
            ? { recordedAt: recordedAtFilter }
            : {}),
        },
        orderBy: { recordedAt: 'asc' },
        select: {
          temperature: true,
          humidity: true,
          batteryPercent: true,
          recordedAt: true,
        },
      }),
      this.prisma.sensorReading.findMany({
        where: {
          gatewayId,
          ...(Object.keys(recordedAtFilter).length > 0
            ? { recordedAt: recordedAtFilter }
            : {}),
        },
        orderBy: { recordedAt: 'asc' },
        select: {
          sensorId: true,
          temperature: true,
          humidity: true,
          batteryPercent: true,
          recordedAt: true,
        },
      }),
      this.prisma.sensor.findMany({
        where: { gatewayId },
        select: { id: true, externalId: true, name: true },
      }),
    ]);

    const sensorLabelById = new Map(
      sensors.map((sensor) => [
        sensor.id,
        sensor.name?.trim()
          ? `${sensor.name} (${sensor.externalId})`
          : sensor.externalId,
      ]),
    );

    return {
      gatewayReadings,
      sensorReadings: sensorReadings.map((reading) => ({
        ...reading,
        sensorLabel: sensorLabelById.get(reading.sensorId) ?? reading.sensorId,
      })),
    };
  }

  private async getCellCommodityTypeId(
    cellId: string,
  ): Promise<string | undefined> {
    const latestTrade = await this.prisma.trade.findFirst({
      where: { cellId },
      orderBy: { tradedAt: 'desc' },
      select: {
        direction: true,
        commodity: { select: { commodityTypeId: true } },
      },
    });

    if (!latestTrade || latestTrade.direction === 'OUT') {
      return undefined;
    }

    return latestTrade.commodity?.commodityTypeId ?? undefined;
  }

  private async getOutsideObservation(
    siteId: string,
    recordedAt: Date,
  ): Promise<{
    temperature: number;
    humidity: number;
    recordedAt: Date;
  } | null> {
    const observation = await this.prisma.weatherObservation.findFirst({
      where: {
        siteId,
        recordedAt: { lte: recordedAt },
      },
      orderBy: { recordedAt: 'desc' },
      select: {
        temperature: true,
        humidity: true,
        recordedAt: true,
      },
    });

    if (observation) {
      return {
        temperature: observation.temperature,
        humidity: observation.humidity,
        recordedAt: observation.recordedAt,
      };
    }

    try {
      const current = await this.weatherService.getCurrentObservationForSite(
        siteId,
        recordedAt,
      );
      if (!current) {
        return null;
      }
      return {
        temperature: current.temperature,
        humidity: current.humidity,
        recordedAt: current.recordedAt,
      };
    } catch (error) {
      this.logger.warn(
        `simulate: outside weather missing for site=${siteId} at ${recordedAt.toISOString()}`,
      );
      return null;
    }
  }
}

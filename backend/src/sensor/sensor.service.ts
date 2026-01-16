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
import {
  formatConditionSummary,
  getMetricUnit,
  parseTriggerConditions,
  TriggerCondition,
  TriggerContextService,
  TriggerEvaluatorService,
} from '../trigger';
import { MetricType } from '../trigger/dto';

@Injectable()
export class SensorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siteAccess: SiteAccessService,
    private readonly triggerContext: TriggerContextService,
    private readonly triggerEvaluator: TriggerEvaluatorService,
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

  private buildMetricsFromSensorReading(reading: {
    temperature: number;
    humidity: number;
  }): Partial<Record<MetricType, number>> {
    return {
      [MetricType.TEMPERATURE]: reading.temperature,
      [MetricType.MEDIAN_TEMPERATURE]: reading.temperature,
      [MetricType.HUMIDITY]: reading.humidity,
      [MetricType.MEDIAN_HUMIDITY]: reading.humidity,
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

  private buildAlertDescription(
    triggerName: string,
    matchedConditions: TriggerCondition[],
  ) {
    if (matchedConditions.length === 0) {
      return `Trigger "${triggerName}" matched.`;
    }

    const summaries = matchedConditions.map(formatConditionSummary);
    return `Trigger "${triggerName}" matched: ${summaries.join(', ')}.`;
  }

  private getAlertThreshold(
    matchedConditions: TriggerCondition[],
  ): { value?: number; unit?: string } {
    const threshold = matchedConditions.find(
      (condition) =>
        condition.type === 'THRESHOLD' && condition.value !== undefined,
    );

    if (!threshold) {
      return {};
    }

    return {
      value: threshold.value,
      unit: getMetricUnit(threshold.metric),
    };
  }

  private async ensureAlertForTrigger(params: {
    trigger: { id: string; name: string; severity: string; conditions: any };
    siteId: string;
    compoundId?: string | null;
    cellId?: string | null;
    sensorId?: string | null;
    organizationId?: string | null;
    matchedConditionIds: string[];
  }) {
    const existing = await this.prisma.alert.findFirst({
      where: {
        triggerId: params.trigger.id,
        cellId: params.cellId ?? null,
        sensorId: params.sensorId ?? null,
        status: {
          in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'],
        },
      },
      select: { id: true },
    });

    if (existing) {
      return existing;
    }

    const conditions = parseTriggerConditions(params.trigger.conditions);
    const matchedConditions = conditions.filter((condition) =>
      params.matchedConditionIds.includes(condition.id),
    );

    const description = this.buildAlertDescription(
      params.trigger.name,
      matchedConditions,
    );
    const threshold = this.getAlertThreshold(matchedConditions);

    return this.prisma.alert.create({
      data: {
        triggerId: params.trigger.id,
        siteId: params.siteId,
        compoundId: params.compoundId ?? undefined,
        cellId: params.cellId ?? undefined,
        sensorId: params.sensorId ?? undefined,
        organizationId: params.organizationId ?? undefined,
        title: params.trigger.name,
        description,
        severity: params.trigger.severity as any,
        thresholdValue: threshold.value,
        unit: threshold.unit,
      },
    });
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
            id: true,
            organizationId: true,
            cell: {
              select: {
                id: true,
                compound: {
                  select: {
                    id: true,
                    site: { select: { id: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!sensor || !sensor.gateway?.cell?.id || !sensor.gatewayId) {
      throw new NotFoundException(`Sensor with ID "${sensorId}" not found`);
    }

    const cellId = sensor.gateway.cell.id;
    return this.storeSensorReadings(sensor, cellId, dto);
  }

  private async storeSensorReadings(
    sensor: {
      id: string;
      gatewayId: string;
      gateway: {
        organizationId: string | null;
        cell: {
          id: string;
          compound: { id: string; site: { id: string } };
        } | null;
      };
    },
    cellId: string,
    dto: BatchSensorReadingsDto,
  ) {
    const data = dto.readings.map((reading) => ({
      sensorId: sensor.id,
      gatewayId: sensor.gatewayId,
      cellId,
      temperature: reading.temperature,
      humidity: reading.humidity,
      batteryPercent: reading.batteryPercent,
      recordedAt: new Date(reading.recordedAt),
    }));

    const latestReading = dto.readings.reduce((latest, reading) => {
      return new Date(reading.recordedAt) > new Date(latest.recordedAt)
        ? reading
        : latest;
    }, dto.readings[0]);

    const result = await this.prisma.sensorReading.createMany({ data });

    if (sensor.gateway.cell?.compound?.site?.id) {
      const commodityTypeId = await this.getCellCommodityTypeId(cellId);

      const triggers = await this.triggerContext.findMatchingTriggers(
        {
          organizationId: sensor.gateway.organizationId ?? undefined,
          commodityTypeId,
          sensorId: sensor.id,
        },
        { sensorMatch: 'specific' },
      );

      const latestMetrics = this.buildMetricsFromSensorReading({
        temperature: latestReading.temperature,
        humidity: latestReading.humidity,
      });

      for (const trigger of triggers) {
        const changeWindows = this.triggerContext.getChangeMetricWindows(trigger);
        const previousMetrics: Partial<Record<MetricType, number>> = {};

        for (const [metric, windowHours] of changeWindows.entries()) {
          const baseline = await this.triggerContext.loadBaselineMetrics({
            source: 'SENSOR',
            sourceId: sensor.id,
            since: new Date(
              new Date(latestReading.recordedAt).getTime() -
                windowHours * 60 * 60 * 1000,
            ),
            before: new Date(latestReading.recordedAt),
            metrics: [metric],
          });

          if (baseline[metric] !== undefined) {
            previousMetrics[metric] = baseline[metric] as number;
          }
        }

        const evaluation = this.triggerEvaluator.evaluateTrigger(trigger, {
          metrics: latestMetrics,
          previousMetrics:
            Object.keys(previousMetrics).length > 0
              ? previousMetrics
              : undefined,
        });

        if (!evaluation.matches) {
          continue;
        }

        await this.ensureAlertForTrigger({
          trigger,
          siteId: sensor.gateway.cell.compound.site.id,
          compoundId: sensor.gateway.cell.compound.id,
          cellId,
          sensorId: sensor.id,
          organizationId: sensor.gateway.organizationId ?? undefined,
          matchedConditionIds: evaluation.matchedConditions,
        });
      }
    }

    return result;
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

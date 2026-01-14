import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SiteAccessService } from '../site';
import { entity_status } from '@prisma/client';
import { AppUser } from '../types/user.type';
import {
  BatchGatewayReadingsDto,
  CreateGatewayDto,
  AssignGatewayDto,
  RegisterGatewayDto,
  UpdateGatewayDto,
} from './dto';
import { isSuperAdmin } from '../user/user.utils';
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
export class GatewayService {
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
      throw new ForbiddenException('Gateway is not paired to a cell');
    }

    await this.siteAccess.validateCellAccess(user, gateway.cellId);
    return gateway;
  }

  private buildMetricsFromGatewayReading(reading: {
    temperature: number;
    humidity: number;
  }): Partial<Record<MetricType, number>> {
    return {
      [MetricType.TEMPERATURE]: reading.temperature,
      [MetricType.HUMIDITY]: reading.humidity,
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

  async listGateways(
    user: AppUser,
    params?: { cellId?: string; organizationId?: string; unpaired?: boolean },
  ) {
    const { cellId, organizationId, unpaired } = params ?? {};

    if (cellId) {
      await this.siteAccess.validateCellAccess(user, cellId);
    } else if (organizationId) {
      this.siteAccess.validateOrganizationAccess(user, organizationId);
    } else if (!isSuperAdmin(user)) {
      throw new ForbiddenException(
        'You do not have permission to list all gateways',
      );
    }

    const whereClause = {
      ...(cellId ? { cellId } : {}),
      ...(organizationId ? { organizationId } : {}),
      ...(unpaired ? { cellId: null } : {}),
    };

    return this.prisma.gateway.findMany({
      where: Object.keys(whereClause).length ? whereClause : undefined,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findGatewayById(user: AppUser, id: string) {
    await this.validateGatewayAccess(user, id);

    return this.prisma.gateway.findUnique({
      where: { id },
      include: {
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
    });
  }

  async createGateway(user: AppUser, dto: CreateGatewayDto) {
    if (dto.cellId) {
      await this.siteAccess.validateCellAccess(user, dto.cellId);
    }

    const trimmedExternalId = dto.externalId?.trim();
    const trimmedName = dto.name?.trim();

    let organizationId: string | undefined;
    let siteId: string | undefined;
    if (dto.cellId) {
      const cell = await this.prisma.cell.findUnique({
        where: { id: dto.cellId },
        include: { compound: { include: { site: true } } },
      });
      organizationId = cell?.compound?.site?.organizationId;
      siteId = cell?.compound?.site?.id;
    }

    return this.prisma.gateway.create({
      data: {
        cellId: dto.cellId ?? null,
        name: trimmedName || null,
        externalId: trimmedExternalId || `gw-${randomUUID()}`,
        status: dto.status || entity_status.ACTIVE,
        organizationId: organizationId ?? null,
        siteId: siteId ?? null,
        createdBy: user.id,
      },
      include: {
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
    });
  }

  async updateGateway(user: AppUser, id: string, dto: UpdateGatewayDto) {
    await this.validateGatewayAccess(user, id);

    return this.prisma.gateway.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
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
    });
  }

  async deleteGateway(user: AppUser, id: string) {
    await this.validateGatewayAccess(user, id);
    return this.prisma.gateway.delete({ where: { id } });
  }

  async registerGateway(user: AppUser, dto: RegisterGatewayDto) {
    const organizationId = isSuperAdmin(user)
      ? dto.organizationId
      : user.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('Organization is required to register gateway');
    }

    const gateway = await this.prisma.gateway.findUnique({
      where: { externalId: dto.externalId },
      select: { id: true, organizationId: true },
    });

    if (!gateway) {
      throw new NotFoundException(
        `Gateway with external ID "${dto.externalId}" not found`,
      );
    }

    if (gateway.organizationId) {
      throw new ForbiddenException('Gateway is already registered');
    }

    return this.prisma.gateway.update({
      where: { id: gateway.id },
      data: {
        organizationId,
        status: entity_status.ACTIVE,
      },
    });
  }

  async assignGatewayToCell(user: AppUser, gatewayId: string, dto: AssignGatewayDto) {
    await this.siteAccess.validateCellAccess(user, dto.cellId);

    const gateway = await this.prisma.gateway.findUnique({
      where: { id: gatewayId },
      select: { id: true, cellId: true, organizationId: true },
    });

    if (!gateway) {
      throw new NotFoundException(`Gateway with ID "${gatewayId}" not found`);
    }

    if (!gateway.organizationId) {
      throw new ForbiddenException('Gateway is not registered to an organization');
    }

    if (gateway.cellId) {
      throw new ForbiddenException('Gateway is already paired to a cell');
    }

    const cell = await this.prisma.cell.findUnique({
      where: { id: dto.cellId },
      include: { compound: { include: { site: true } } },
    });

    if (!cell?.compound?.site) {
      throw new NotFoundException(`Cell with ID "${dto.cellId}" not found`);
    }

    if (cell.compound.site.organizationId !== gateway.organizationId) {
      throw new ForbiddenException('Gateway belongs to a different organization');
    }

    return this.prisma.gateway.update({
      where: { id: gateway.id },
      data: {
        cellId: dto.cellId,
        siteId: cell.compound.site.id,
        status: entity_status.ACTIVE,
      },
    });
  }

  async unpairGateway(user: AppUser, gatewayId: string) {
    const gateway = await this.prisma.gateway.findUnique({
      where: { id: gatewayId },
      select: { id: true, cellId: true },
    });

    if (!gateway || !gateway.cellId) {
      throw new NotFoundException(`Gateway with ID "${gatewayId}" not found`);
    }

    await this.siteAccess.validateCellAccess(user, gateway.cellId);

    return this.prisma.gateway.update({
      where: { id: gateway.id },
      data: {
        cellId: null,
        siteId: null,
        status: entity_status.ACTIVE,
      },
    });
  }

  async createGatewayReadingsBatch(
    user: AppUser,
    gatewayId: string,
    dto: BatchGatewayReadingsDto,
  ) {
    this.siteAccess.ensureSuperAdmin(user);
    const gateway = await this.validateGatewayAccess(user, gatewayId);
    const cellId = gateway.cellId;

    if (!cellId) {
      throw new BadRequestException('Gateway is not paired to a cell');
    }

    if (!dto.readings || dto.readings.length === 0) {
      throw new BadRequestException('At least one reading is required');
    }

    const data = dto.readings.map((reading) => ({
      gatewayId: gateway.id,
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

    const [result] = await this.prisma.$transaction([
      this.prisma.gatewayReading.createMany({ data }),
      this.prisma.gateway.update({
        where: { id: gateway.id },
        data: {
          lastTemperature: latestReading.temperature,
          lastHumidity: latestReading.humidity,
          lastBattery: latestReading.batteryPercent,
          lastReadingAt: new Date(latestReading.recordedAt),
        },
      }),
    ]);

    const gatewayDetails = await this.prisma.gateway.findUnique({
      where: { id: gateway.id },
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
    });

    if (gatewayDetails?.cell?.compound?.site?.id && gatewayDetails.cell.id) {
      const commodityTypeId = await this.getCellCommodityTypeId(
        gatewayDetails.cell.id,
      );

      const triggers = await this.triggerContext.findMatchingTriggers(
        {
          organizationId: gatewayDetails.organizationId ?? undefined,
          commodityTypeId,
        },
        { sensorMatch: 'generic' },
      );

      const latestMetrics = this.buildMetricsFromGatewayReading({
        temperature: latestReading.temperature,
        humidity: latestReading.humidity,
      });

      for (const trigger of triggers) {
        const changeWindows = this.triggerContext.getChangeMetricWindows(trigger);
        const previousMetrics: Partial<Record<MetricType, number>> = {};

        for (const [metric, windowDays] of changeWindows.entries()) {
          const baseline = await this.triggerContext.loadBaselineMetrics({
            source: 'GATEWAY',
            sourceId: gatewayDetails.id,
            since: new Date(
              new Date(latestReading.recordedAt).getTime() -
                windowDays * 24 * 60 * 60 * 1000,
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
          siteId: gatewayDetails.cell.compound.site.id,
          compoundId: gatewayDetails.cell.compound.id,
          cellId: gatewayDetails.cell.id,
          organizationId: gatewayDetails.organizationId ?? undefined,
          matchedConditionIds: evaluation.matchedConditions,
        });
      }
    }

    return result;
  }

  async listGatewayReadings(user: AppUser, gatewayId: string, limit = 100) {
    this.siteAccess.ensureSuperAdmin(user);
    await this.validateGatewayAccess(user, gatewayId);

    return this.prisma.gatewayReading.findMany({
      where: { gatewayId },
      orderBy: { recordedAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 500),
    });
  }
}

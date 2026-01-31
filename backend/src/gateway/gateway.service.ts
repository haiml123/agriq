import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SiteAccessService } from '../site';
import { entity_status, type Prisma } from '@prisma/client';
import { AppUser } from '../types/user.type';
import {
  BatchGatewayReadingsDto,
  CreateGatewayDto,
  CreateGatewayPayloadDto,
  BatchGatewayPayloadDto,
  AssignGatewayDto,
  RegisterGatewayDto,
  UpdateGatewayDto,
} from './dto';
import { isSuperAdmin } from '../user/user.utils';
import { WeatherService } from '../weather';
import { TriggerEngineService } from '../trigger';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly siteAccess: SiteAccessService,
    private readonly weatherService: WeatherService,
    private readonly triggerEngine: TriggerEngineService,
  ) {}

  private async findGatewayByIdentifier(identifier: string) {
    return this.prisma.gateway.findFirst({
      where: {
        OR: [{ id: identifier }, { externalId: identifier }],
      },
      select: { id: true, cellId: true, organizationId: true, siteId: true },
    });
  }

  private async persistGatewayReadingsInTx(
    tx: Prisma.TransactionClient,
    gatewayId: string,
    cellId: string,
    readings: BatchGatewayReadingsDto['readings'],
    outside?: { temperature: number; humidity: number } | null,
  ) {
    if (!readings || readings.length === 0) {
      throw new BadRequestException('At least one reading is required');
    }

    const data = readings.map((reading) => ({
      gatewayId,
      cellId,
      temperature: reading.temperature,
      humidity: reading.humidity,
      batteryPercent: reading.batteryPercent,
      outsideTemperature: outside?.temperature,
      outsideHumidity: outside?.humidity,
      recordedAt: new Date(reading.recordedAt),
    }));

    await tx.gatewayReading.createMany({ data });
  }

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
      throw new ForbiddenException(
        'Organization is required to register gateway',
      );
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

  async assignGatewayToCell(
    user: AppUser,
    gatewayId: string,
    dto: AssignGatewayDto,
  ) {
    await this.siteAccess.validateCellAccess(user, dto.cellId);

    const gateway = await this.prisma.gateway.findUnique({
      where: { id: gatewayId },
      select: { id: true, cellId: true, organizationId: true },
    });

    if (!gateway) {
      throw new NotFoundException(`Gateway with ID "${gatewayId}" not found`);
    }

    if (!gateway.organizationId) {
      throw new ForbiddenException(
        'Gateway is not registered to an organization',
      );
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
      throw new ForbiddenException(
        'Gateway belongs to a different organization',
      );
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

  async ingestGatewayPayloadFromDevice(
    gatewayIdentifier: string,
    dto: BatchGatewayPayloadDto,
  ) {
    const gateway = await this.resolveDeviceGateway(gatewayIdentifier);
    const readings = dto.readings ?? [];
    if (readings.length === 0) {
      throw new BadRequestException('At least one reading is required');
    }

    const uniqueBalls = new Map<string, { id: string; macId?: string }>();
    readings.forEach((reading) => {
      (reading.balls || []).forEach((ball) => {
        const trimmedId = ball.id.trim();
        if (!uniqueBalls.has(trimmedId)) {
          uniqueBalls.set(trimmedId, { id: trimmedId, macId: ball.macId });
        }
      });
    });

    const sensorIdByExternal = await this.ensureSensorsForBalls(
      gateway.id,
      Array.from(uniqueBalls.values()),
    );

    const cell = await this.prisma.cell.findUnique({
      where: { id: gateway.cellId ?? '' },
      select: {
        id: true,
        compoundId: true,
        compound: { select: { siteId: true } },
      },
    });

    const commodityTypeId = gateway.cellId
      ? await this.getCellCommodityTypeId(gateway.cellId)
      : undefined;

    for (const reading of readings) {
      const outside = gateway.siteId
        ? await this.weatherService.getCurrentObservationForSite(
            gateway.siteId,
            new Date(reading.recordedAt),
          )
        : null;
      if (!outside) {
        this.logger.warn(
          `Outside weather missing for gateway=${gateway.id} site=${gateway.siteId ?? 'none'} recordedAt=${reading.recordedAt}`,
        );
      } else {
        this.logger.debug(
          `Outside weather ok for gateway=${gateway.id} site=${gateway.siteId ?? 'none'} recordedAt=${reading.recordedAt}`,
        );
      }

      // 1) Normalize and validate ball readings.
      const balls = this.normalizeBallReadings(reading);

      // 2) Persist gateway reading + sensor readings in one transaction.
      await this.persistGatewayAndSensorReadings(
        gateway,
        reading,
        balls,
        sensorIdByExternal,
        outside,
      );

      if (cell?.id && cell.compound.siteId) {
        await this.triggerEngine.evaluateGatewayPayload(
          {
            organizationId: gateway.organizationId ?? undefined,
            commodityTypeId,
            siteId: cell.compound.siteId,
            compoundId: cell.compoundId,
            cellId: cell.id,
            gatewayId: gateway.id,
          },
          {
            gateway: {
              temperature: reading.temperature,
              humidity: reading.humidity,
              recordedAt: new Date(reading.recordedAt),
            },
            outside: outside
              ? {
                  temperature: outside.temperature,
                  humidity: outside.humidity,
                  recordedAt: new Date(reading.recordedAt),
                }
              : undefined,
            balls: balls.map((ball) => ({
              id: ball.id,
              macId: ball.macId,
              temperature: ball.temperature,
              humidity: ball.humidity,
              recordedAt: new Date(ball.recordedAt ?? reading.recordedAt),
            })),
            sensorIdByExternal,
            recordedAt: new Date(reading.recordedAt),
          },
        );
      }
    }

    return { success: true };
  }

  private async resolveDeviceGateway(gatewayIdentifier: string) {
    const gateway = await this.findGatewayByIdentifier(gatewayIdentifier);
    if (!gateway) {
      throw new BadRequestException('Gateway not found');
    }
    if (!gateway.cellId) {
      throw new BadRequestException('Gateway is not paired to a cell');
    }
    return gateway;
  }

  private normalizeBallReadings(dto: CreateGatewayPayloadDto) {
    const balls = (dto.balls || []).map((ball) => ({
      ...ball,
      id: ball.id.trim(),
    }));

    const ids = balls.map((ball) => ball.id);
    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    if (duplicates.length > 0) {
      throw new BadRequestException(
        `Duplicate sensor ids: ${Array.from(new Set(duplicates)).join(', ')}`,
      );
    }

    return balls;
  }

  private async ensureSensorsForBalls(
    gatewayId: string,
    balls: Array<{ id: string; macId?: string }>,
  ) {
    if (balls.length === 0) {
      return new Map<string, string>();
    }

    const ids = balls.map((ball) => ball.id);
    const existingSensors = await this.prisma.sensor.findMany({
      where: { externalId: { in: ids } },
      select: { id: true, externalId: true, gatewayId: true },
    });
    const existingMap = new Map(
      existingSensors.map((sensor) => [sensor.externalId, sensor]),
    );

    const sensorIdByExternal = new Map<string, string>();

    for (const ball of balls) {
      const existing = existingMap.get(ball.id);
      if (existing && existing.gatewayId !== gatewayId) {
        throw new BadRequestException(
          `Sensor "${ball.id}" is paired to a different gateway`,
        );
      }

      if (existing) {
        sensorIdByExternal.set(ball.id, existing.id);
        continue;
      }

      const sensor = await this.prisma.sensor.create({
        data: {
          gatewayId,
          externalId: ball.id,
          name: ball.macId ? `Ball ${ball.macId}` : `Ball ${ball.id}`,
          status: entity_status.ACTIVE,
        },
        select: { id: true },
      });
      sensorIdByExternal.set(ball.id, sensor.id);
    }

    return sensorIdByExternal;
  }

  private async persistGatewayAndSensorReadings(
    gateway: { id: string; cellId: string | null; siteId?: string | null },
    dto: CreateGatewayPayloadDto,
    balls: Array<{
      id: string;
      macId?: string;
      temperature: number;
      humidity: number;
      batteryPercent?: number;
      recordedAt?: string;
    }>,
    sensorIdByExternal: Map<string, string>,
    outside?: { temperature: number; humidity: number } | null,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await this.persistGatewayReadingsInTx(
        tx,
        gateway.id,
        gateway.cellId!,
        [
          {
            temperature: dto.temperature,
            humidity: dto.humidity,
            batteryPercent: dto.batteryPercent,
            recordedAt: dto.recordedAt,
          },
        ],
        outside,
      );

      const sensorReadings = balls.map((ball) => ({
        sensorId: sensorIdByExternal.get(ball.id)!,
        gatewayId: gateway.id,
        cellId: gateway.cellId!,
        temperature: ball.temperature,
        humidity: ball.humidity,
        batteryPercent: ball.batteryPercent ?? dto.batteryPercent,
        recordedAt: new Date(ball.recordedAt ?? dto.recordedAt),
      }));

      if (sensorReadings.length > 0) {
        await tx.sensorReading.createMany({ data: sensorReadings });
      }
    });
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

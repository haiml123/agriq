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

@Injectable()
export class GatewayService {
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

    return this.prisma.gatewayReading.createMany({ data });
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

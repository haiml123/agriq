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

    await this.siteAccess.validateCellAccess(user, gateway.cellId);
    return gateway;
  }

  async listGateways(user: AppUser, cellId?: string) {
    if (cellId) {
      await this.siteAccess.validateCellAccess(user, cellId);
    } else if (!isSuperAdmin(user)) {
      throw new ForbiddenException(
        'You do not have permission to list all gateways',
      );
    }

    return this.prisma.gateway.findMany({
      where: cellId ? { cellId } : undefined,
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
    await this.siteAccess.validateCellAccess(user, dto.cellId);

    const trimmedExternalId = dto.externalId?.trim();
    const trimmedName = dto.name?.trim();

    return this.prisma.gateway.create({
      data: {
        cellId: dto.cellId,
        name: trimmedName || null,
        externalId: trimmedExternalId || `gw-${randomUUID()}`,
        status: dto.status || entity_status.ACTIVE,
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

  async createGatewayReadingsBatch(
    user: AppUser,
    gatewayId: string,
    dto: BatchGatewayReadingsDto,
  ) {
    this.siteAccess.ensureSuperAdmin(user);
    const gateway = await this.validateGatewayAccess(user, gatewayId);

    if (!dto.readings || dto.readings.length === 0) {
      throw new BadRequestException('At least one reading is required');
    }

    const data = dto.readings.map((reading) => ({
      gatewayId: gateway.id,
      cellId: gateway.cellId,
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

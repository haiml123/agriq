import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateCommodityDto,
  UpdateCommodityDto,
  ListCommoditiesQueryDto,
  CreateTradeDto,
} from './dto';

@Injectable()
export class CommodityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommodityDto, userId?: string) {
    // If commodityTypeId is provided, verify it exists
    if (dto.commodityTypeId) {
      const commodityType = await this.prisma.commodityType.findUnique({
        where: { id: dto.commodityTypeId },
      });

      if (!commodityType) {
        throw new NotFoundException(
          `Commodity type with ID "${dto.commodityTypeId}" not found`,
        );
      }
    }

    // If organizationId is provided, verify it exists
    if (dto.organizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: dto.organizationId },
      });

      if (!organization) {
        throw new NotFoundException(
          `Organization with ID "${dto.organizationId}" not found`,
        );
      }
    }

    return this.prisma.commodity.create({
      data: {
        name: dto.name,
        origin: dto.origin,
        commodityTypeId: dto.commodityTypeId,
        organizationId: dto.organizationId,
        createdBy: userId,
      },
      include: {
        commodityType: true,
        organization: true,
      },
    });
  }

  async findAll(query: ListCommoditiesQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.search && {
        OR: [
          {
            name: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          },
          {
            origin: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
      ...(query.organizationId && {
        organizationId: query.organizationId,
      }),
      ...(query.commodityTypeId && {
        commodityTypeId: query.commodityTypeId,
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.commodity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          commodityType: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { trades: true },
          },
        },
      }),
      this.prisma.commodity.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        tradesCount: item._count.trades,
        _count: undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const commodity = await this.prisma.commodity.findUnique({
      where: { id },
      include: {
        commodityType: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { trades: true, alerts: true },
        },
      },
    });

    if (!commodity) {
      throw new NotFoundException(`Commodity with ID "${id}" not found`);
    }

    return {
      ...commodity,
      tradesCount: commodity._count.trades,
      alertsCount: commodity._count.alerts,
      _count: undefined,
    };
  }

  async update(id: string, dto: UpdateCommodityDto, userId?: string) {
    const commodity = await this.findOne(id);

    // If commodityTypeId is being updated, verify it exists
    if (dto.commodityTypeId) {
      const commodityType = await this.prisma.commodityType.findUnique({
        where: { id: dto.commodityTypeId },
      });

      if (!commodityType) {
        throw new NotFoundException(
          `Commodity type with ID "${dto.commodityTypeId}" not found`,
        );
      }
    }

    return this.prisma.commodity.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.origin !== undefined && { origin: dto.origin }),
        ...(dto.commodityTypeId !== undefined && {
          commodityTypeId: dto.commodityTypeId,
        }),
        updatedBy: userId,
      },
      include: {
        commodityType: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async remove(id: string) {
    const commodity = await this.findOne(id);

    // Check if there are trades using this commodity
    if (commodity.tradesCount > 0) {
      throw new ForbiddenException(
        `Cannot delete commodity "${commodity.name}" because it has ${commodity.tradesCount} trades associated with it`,
      );
    }

    return this.prisma.commodity.delete({
      where: { id },
    });
  }

  // Trade-related methods

  async createTrade(dto: CreateTradeDto, userId?: string) {
    // Verify site exists
    const site = await this.prisma.site.findUnique({
      where: { id: dto.siteId },
      include: { organization: true },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID "${dto.siteId}" not found`);
    }

    // Verify compound exists if provided
    if (dto.compoundId) {
      const compound = await this.prisma.compound.findUnique({
        where: { id: dto.compoundId },
      });

      if (!compound) {
        throw new NotFoundException(
          `Compound with ID "${dto.compoundId}" not found`,
        );
      }
    }

    // Verify cell exists if provided
    if (dto.cellId) {
      const cell = await this.prisma.cell.findUnique({
        where: { id: dto.cellId },
      });

      if (!cell) {
        throw new NotFoundException(`Cell with ID "${dto.cellId}" not found`);
      }
    }

    // Verify commodity type exists
    const commodityType = await this.prisma.commodityType.findUnique({
      where: { id: dto.commodityTypeId },
    });

    if (!commodityType) {
      throw new NotFoundException(
        `Commodity type with ID "${dto.commodityTypeId}" not found`,
      );
    }

    // Find or create commodity
    let commodity = await this.prisma.commodity.findFirst({
      where: {
        commodityTypeId: dto.commodityTypeId,
        origin: dto.origin || null,
        organizationId: site.organizationId,
      },
    });

    if (!commodity) {
      // Create new commodity
      commodity = await this.prisma.commodity.create({
        data: {
          name: commodityType.name,
          origin: dto.origin,
          commodityTypeId: dto.commodityTypeId,
          organizationId: site.organizationId,
          createdBy: userId,
        },
      });
    }

    // Create trade
    const trade = await this.prisma.trade.create({
      data: {
        commodityId: commodity.id,
        siteId: dto.siteId,
        compoundId: dto.compoundId,
        cellId: dto.cellId,
        amountKg: dto.amountKg,
        tradedAt: dto.tradedAt ? new Date(dto.tradedAt) : new Date(),
        notes: dto.notes,
        createdBy: userId,
      },
      include: {
        commodity: {
          include: {
            commodityType: true,
          },
        },
        site: true,
        compound: true,
        cell: true,
      },
    });

    return trade;
  }

  async findRecentTrades(organizationId?: string, limit: number = 10) {
    const where: Prisma.TradeWhereInput = {
      ...(organizationId && {
        commodity: {
          organizationId,
        },
      }),
    };

    const trades = await this.prisma.trade.findMany({
      where,
      take: limit,
      orderBy: { tradedAt: 'desc' },
      include: {
        commodity: {
          select: {
            id: true,
            name: true,
            origin: true,
            commodityType: {
              select: { id: true, name: true },
            },
          },
        },
        site: {
          select: { id: true, name: true },
        },
        compound: {
          select: { id: true, name: true },
        },
        cell: {
          select: { id: true, name: true },
        },
      },
    });

    return trades;
  }
}

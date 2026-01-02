import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateTradeDto } from './dto';

@Injectable()
export class TradeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTradeDto, userId?: string) {
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
        direction: dto.direction || 'IN', // Default to IN for backwards compatibility
        buyer: dto.buyer,
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

  async findRecent(
    organizationId?: string,
    siteId?: string,
    compoundId?: string,
    limit: number = 10,
  ) {
    const where: Prisma.TradeWhereInput = {
      ...(organizationId && {
        commodity: {
          organizationId,
        },
      }),
      ...(siteId && { siteId }),
      ...(compoundId && { compoundId }),
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

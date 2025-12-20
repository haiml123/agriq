import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TradeService {
  constructor(private readonly prisma: PrismaService) {}

  async findRecent(organizationId?: string, limit: number = 10) {
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

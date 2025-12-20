import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AlertService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId?: string, limit: number = 10) {
    const where: Prisma.AlertWhereInput = {
      status: {
        in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'],
      },
      ...(organizationId && { organizationId }),
    };

    const alerts = await this.prisma.alert.findMany({
      where,
      take: limit,
      orderBy: { startedAt: 'desc' },
      include: {
        site: {
          select: { id: true, name: true },
        },
        compound: {
          select: { id: true, name: true },
        },
        cell: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    return alerts;
  }
}
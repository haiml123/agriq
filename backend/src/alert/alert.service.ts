import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

interface FindAllParams {
  organizationId?: string;
  userId?: string;
  siteId?: string;
  status?: string;
  severity?: string;
  startDate?: string;
  limit?: number;
}

@Injectable()
export class AlertService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllParams) {
    const {
      organizationId,
      userId,
      siteId,
      status,
      severity,
      startDate,
      limit = 100,
    } = params;

    const where: Prisma.AlertWhereInput = {};

    // Handle status filter
    if (status && status !== 'all') {
      where.status = status as any;
    }
    // If no status is provided or status is not explicitly 'all', show active alerts only
    else if (!status) {
      where.status = {
        in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'],
      };
    }
    // If status is 'all', don't add any status filter (show all alerts)

    if (organizationId) {
      where.organizationId = organizationId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (siteId) {
      // Handle comma-separated site IDs for operators with multiple sites
      if (siteId.includes(',')) {
        where.siteId = {
          in: siteId.split(','),
        };
      } else {
        where.siteId = siteId;
      }
    }

    if (severity) {
      where.severity = severity as any;
    }

    if (startDate) {
      where.startedAt = {
        gte: new Date(startDate),
      };
    }

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
        commodity: {
          select: { id: true, name: true },
        },
      },
    });

    return alerts;
  }

  async acknowledge(id: string) {
    // Check if alert exists
    const alert = await this.prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    // Update alert status to ACKNOWLEDGED
    const updatedAlert = await this.prisma.alert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
      },
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
        commodity: {
          select: { id: true, name: true },
        },
      },
    });

    return updatedAlert;
  }

  async updateStatus(id: string, status: string) {
    // Check if alert exists
    const alert = await this.prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundException(`Alert with ID ${id} not found`);
    }

    // Validate status
    const validStatuses = ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    // Update alert status
    const updatedAlert = await this.prisma.alert.update({
      where: { id },
      data: {
        status: status as any,
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
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
        commodity: {
          select: { id: true, name: true },
        },
      },
    });

    return updatedAlert;
  }
}
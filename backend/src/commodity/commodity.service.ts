import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AppUser } from '../types/user.type';
import { canAccessOrganization } from '../user/user.utils';
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
    const limit = query.limit || 100;
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

  async update(id: string, dto: UpdateCommodityDto, user: AppUser) {
    const commodity = await this.prisma.commodity.findUnique({
      where: { id },
      select: { organizationId: true },
    });

    if (!commodity) {
      throw new NotFoundException(`Commodity with ID "${id}" not found`);
    }

    if (!canAccessOrganization(user, commodity.organizationId)) {
      throw new ForbiddenException(
        'You do not have permission to update this commodity',
      );
    }

    return this.prisma.commodity.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.origin !== undefined && { origin: dto.origin }),
        ...(dto.commodityTypeId !== undefined && {
          commodityTypeId: dto.commodityTypeId,
        }),
        updatedBy: user.id,
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

  async remove(id: string, user: AppUser) {
    const commodity = await this.prisma.commodity.findUnique({
      where: { id },
      include: {
        _count: {
          select: { trades: true },
        },
      },
    });

    if (!commodity) {
      throw new NotFoundException(`Commodity with ID "${id}" not found`);
    }

    if (!canAccessOrganization(user, commodity.organizationId)) {
      throw new ForbiddenException(
        'You do not have permission to delete this commodity',
      );
    }

    // Check if there are trades using this commodity
    if (commodity._count.trades > 0) {
      throw new ForbiddenException(
        `Cannot delete commodity "${commodity.name}" because it has ${commodity._count.trades} trades associated with it`,
      );
    }

    return this.prisma.commodity.delete({
      where: { id },
    });
  }
}

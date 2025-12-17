import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { entity_status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCommodityTypeDto,
  ListCommodityTypesQueryDto,
  UpdateCommodityTypeDto,
} from './dto';

@Injectable()
export class CommodityTypeService {
  constructor(private readonly prisma: PrismaService) {}

  private mapCommodityType(
    commodityType: any,
    commoditiesCount?: number,
  ) {
    return {
      ...commodityType,
      commoditiesCount,
      isActive: commodityType.status === entity_status.ACTIVE,
      _count: undefined,
    };
  }

  async create(dto: CreateCommodityTypeDto, userId?: string) {
    // Check if name already exists
    const existing = await this.prisma.commodityType.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Commodity type with name "${dto.name}" already exists`,
      );
    }

    const created = await this.prisma.commodityType.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: entity_status.ACTIVE,
        createdBy: userId,
      } as any,
    });

    return this.mapCommodityType(created, 0);
  }

  async findAll(query: ListCommodityTypesQueryDto) {
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
            description: {
              contains: query.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
      ...(query.isActive !== undefined && {
        status: query.isActive
          ? entity_status.ACTIVE
          : {
              not: entity_status.ACTIVE,
            },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.commodityType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { commodities: true },
          },
        },
      }),
      this.prisma.commodityType.count({ where }),
    ]);

    return {
      items: items.map((item) =>
        this.mapCommodityType(item, item._count.commodities),
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const commodityType = await this.prisma.commodityType.findUnique({
      where: { id },
      include: {
        commodities: true,
        lookupTables: true,
        _count: {
          select: { commodities: true },
        },
      },
    });

    if (!commodityType) {
      throw new NotFoundException(`Commodity type with ID "${id}" not found`);
    }

    return this.mapCommodityType(
      commodityType,
      commodityType._count.commodities,
    );
  }

  async update(id: string, dto: UpdateCommodityTypeDto, userId?: string) {
    await this.findOne(id);

    // If name is being updated, check for duplicates
    if (dto.name) {
      const existing = await this.prisma.commodityType.findFirst({
        where: {
          name: dto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Commodity type with name "${dto.name}" already exists`,
        );
      }
    }

    const updated = await this.prisma.commodityType.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && {
          status: dto.isActive
            ? entity_status.ACTIVE
            : entity_status.BLOCKED,
        }),
        updatedBy: userId,
      },
    });

    return this.mapCommodityType(updated);
  }

  async remove(id: string) {
    const commodityType = await this.findOne(id);

    // Check if there are commodities using this type
    if (commodityType.commoditiesCount > 0) {
      throw new ConflictException(
        `Cannot delete commodity type "${commodityType.name}" because it has ${commodityType.commoditiesCount} commodities associated with it`,
      );
    }

    return this.prisma.commodityType.delete({
      where: { id },
    });
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCommodityTypeDto,
  ListCommodityTypesQueryDto,
  UpdateCommodityTypeDto,
} from './dto';

@Injectable()
export class CommodityTypeService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.commodityType.create({
      data: {
        name: dto.name,
        description: dto.description,
        createdBy: userId,
      } as any,
    });
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
        isActive: query.isActive,
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
      items: items.map((item) => ({
        ...item,
        commoditiesCount: item._count.commodities,
        _count: undefined,
      })),
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

    return {
      ...commodityType,
      commoditiesCount: commodityType._count.commodities,
      _count: undefined,
    };
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

    return this.prisma.commodityType.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedBy: userId,
      },
    });
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

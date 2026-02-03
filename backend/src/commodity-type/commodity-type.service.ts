import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCommodityTypeDto,
  UpdateCommodityTypeDto,
  CreateLookupTableDto,
  UpdateLookupTableDto,
} from './dto';
import { entity_status } from '@prisma/client';

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
        status: entity_status.ACTIVE,
        createdBy: userId,
      },
    });
  }

  async findAll() {
    return this.prisma.commodityType.findMany({
      orderBy: { createdAt: 'desc' },
    });
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
        ...(dto.status !== undefined && { status: dto.status }),
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

  async getLookupTable(commodityTypeId: string) {
    await this.ensureCommodityTypeExists(commodityTypeId);

    const lookupTable = await this.prisma.lookupTable.findUnique({
      where: { commodityTypeId },
    });

    if (!lookupTable) {
      throw new NotFoundException(
        `Lookup table for commodity type ID "${commodityTypeId}" not found`,
      );
    }

    return lookupTable;
  }

  async createLookupTable(
    commodityTypeId: string,
    dto: CreateLookupTableDto,
    userId?: string,
  ) {
    await this.ensureCommodityTypeExists(commodityTypeId);

    const existing = await this.prisma.lookupTable.findUnique({
      where: { commodityTypeId },
    });

    if (existing) {
      throw new ConflictException(
        `Lookup table already exists for commodity type ID "${commodityTypeId}"`,
      );
    }

    return this.prisma.lookupTable.create({
      data: {
        name: dto.name,
        description: dto.description,
        data: dto.data,
        commodityTypeId,
        createdBy: userId,
      },
    });
  }

  async updateLookupTable(
    commodityTypeId: string,
    dto: UpdateLookupTableDto,
    userId?: string,
  ) {
    await this.getLookupTable(commodityTypeId);

    return this.prisma.lookupTable.update({
      where: { commodityTypeId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.data !== undefined && { data: dto.data }),
        updatedBy: userId,
      },
    });
  }

  async deleteLookupTable(commodityTypeId: string) {
    await this.getLookupTable(commodityTypeId);

    return this.prisma.lookupTable.delete({
      where: { commodityTypeId },
    });
  }

  private async ensureCommodityTypeExists(commodityTypeId: string) {
    const commodityType = await this.prisma.commodityType.findUnique({
      where: { id: commodityTypeId },
    });

    if (!commodityType) {
      throw new NotFoundException(
        `Commodity type with ID "${commodityTypeId}" not found`,
      );
    }

    return commodityType;
  }
}

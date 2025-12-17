import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLookupTableDto,
  UpdateLookupTableDto,
} from './dto';

@Injectable()
export class LookupTableService {
  constructor(private readonly prisma: PrismaService) {}

  async create(commodityTypeId: string, dto: CreateLookupTableDto, userId?: string) {
    const commodityType = await this.prisma.commodityType.findUnique({
      where: { id: commodityTypeId },
    });

    if (!commodityType) {
      throw new NotFoundException(
        `Commodity type with ID "${commodityTypeId}" not found`,
      );
    }

    const existing = await this.prisma.lookupTable.findUnique({
      where: { commodityTypeId },
    });

    if (existing) {
      throw new ConflictException(
        `Lookup table already exists for commodity type "${commodityType.name}"`,
      );
    }

    return this.prisma.lookupTable.create({
      data: {
        name: dto.name,
        description: dto.description,
        commodityTypeId,
        data: dto.data as any,
        createdBy: userId,
      } as any,
    });
  }

  async findByCommodityType(commodityTypeId: string) {
    const table = await this.prisma.lookupTable.findUnique({
      where: { commodityTypeId },
    });

    if (!table) {
      throw new NotFoundException(
        `Lookup table for commodity type "${commodityTypeId}" not found`,
      );
    }

    return table;
  }

  async update(
    commodityTypeId: string,
    dto: UpdateLookupTableDto,
    userId?: string,
  ) {
    await this.findByCommodityType(commodityTypeId);

    return this.prisma.lookupTable.update({
      where: { commodityTypeId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.data && { data: dto.data as any }),
        updatedBy: userId,
      },
    });
  }

  async remove(commodityTypeId: string) {
    await this.findByCommodityType(commodityTypeId);

    return this.prisma.lookupTable.delete({ where: { commodityTypeId } });
  }
}

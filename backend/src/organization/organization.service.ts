import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  ChangeStatusDto,
} from './dto';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto, userId: string) {
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        createdBy: userId,
      },
    });
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(params?.search && {
        name: {
          contains: params.search,
          mode: 'insensitive' as const,
        },
      }),
      ...(params?.status && {
        status: params.status as any,
      }),
      // By default, exclude DELETED unless explicitly requested
      ...(!params?.status && {
        status: {
          not: 'DELETED' as any,
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        sites: true,
        users: true,
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto, userId: string) {
    await this.findOne(id);

    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
      },
    });
  }

  async changeStatus(id: string, dto: ChangeStatusDto, userId: string) {
    await this.findOne(id);

    return this.prisma.organization.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });
  }
}

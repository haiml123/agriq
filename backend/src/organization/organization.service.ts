import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, entity_status } from '@prisma/client';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  ChangeStatusDto,
} from './dto';
import type { AppUser } from '../types/user.type';
import { canAccessOrganization } from '../user/user.utils';

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
    status?: entity_status;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const skip = (page - 1) * limit;

    const where = {
      ...(params?.search && {
        name: {
          contains: params.search,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
      ...(params?.status && {
        status: params.status,
      }),
      // By default, exclude DELETED unless explicitly requested
      ...(!params?.status && {
        status: {
          not: entity_status.DELETED,
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

  async update(id: string, dto: UpdateOrganizationDto, user: AppUser) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    if (!canAccessOrganization(user, organization.id)) {
      throw new ForbiddenException(
        'You do not have permission to update this organization',
      );
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
      },
    });
  }

  async changeStatus(id: string, dto: ChangeStatusDto, user: AppUser) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    if (!canAccessOrganization(user, organization.id)) {
      throw new ForbiddenException(
        'You do not have permission to update this organization',
      );
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        status: dto.status,
      },
    });
  }
}

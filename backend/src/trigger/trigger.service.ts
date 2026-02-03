import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTriggerDto,
  ListTriggersQueryDto,
  UpdateTriggerDto,
} from './dto';
import { Prisma, trigger_scope } from '@prisma/client';
import { parsePagination } from '../utils/pagination';

@Injectable()
export class TriggerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a trigger and return it with related display data.
   */
  async create(dto: CreateTriggerDto, userId: string) {
    return this.prisma.eventTrigger.create({
      data: {
        // Persist structured conditions/actions as JSON.
        name: dto.name,
        description: dto.description,
        scopeType: dto.scopeType,
        commodityTypeId: dto.commodityTypeId,
        organizationId: dto.organizationId,
        siteId: dto.siteId,
        compoundId: dto.compoundId,
        conditions: dto.conditions as unknown as Prisma.InputJsonValue,
        conditionLogic: dto.conditionLogic || 'AND',
        actions: dto.actions as unknown as Prisma.InputJsonValue,
        severity: dto.severity,
        isActive: dto.isActive ?? true,
        createdBy: userId,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        commodityType: {
          select: { id: true, name: true },
        },
        site: {
          select: { id: true, name: true, locale: true },
        },
      },
    });
  }

  /**
   * List triggers with filters + pagination.
   */
  async findAll(query: ListTriggersQueryDto) {
    const {
      organizationId,
      siteId,
      compoundId,
      cellId,
      scopeType,
      severity,
      isActive,
      search,
    } = query;

    // Normalize pagination inputs from query params.
    const { page, limit, skip } = parsePagination({
      page: query.page,
      limit: query.limit,
      defaultPage: 1,
      defaultLimit: 10,
    });

    // Build Prisma filters from optional query inputs.
    const where: Prisma.EventTriggerWhereInput = {
      status: { not: 'DELETED' },
      ...(organizationId && { organizationId }),
      ...(siteId && { siteId }),
      ...(compoundId && { compoundId }),
      ...(cellId && { cellId }),
      ...(scopeType && { scopeType: scopeType as trigger_scope }),
      ...(severity && { severity }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Fetch rows and count in parallel.
    const [items, total] = await Promise.all([
      this.prisma.eventTrigger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: {
            select: { id: true, name: true },
          },
          commodityType: {
            select: { id: true, name: true },
          },
          site: {
            select: { id: true, name: true, locale: true },
          },
        },
      }),
      this.prisma.eventTrigger.count({ where }),
    ]);

    // Return paginated response.
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Fetch a single trigger with related scope entities.
   */
  async findOne(id: string) {
    const trigger = await this.prisma.eventTrigger.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        commodityType: {
          select: { id: true, name: true },
        },
        site: {
          select: { id: true, name: true, locale: true },
        },
        compound: {
          select: { id: true, name: true, locale: true },
        },
      },
    });

    if (!trigger) {
      throw new NotFoundException(`Trigger with ID ${id} not found`);
    }

    return trigger;
  }

  /**
   * Update a trigger's properties and JSON fields.
   */
  async update(id: string, dto: UpdateTriggerDto, userId: string) {
    // Ensure it exists before updating.
    await this.findOne(id);

    // Build a partial update from only provided fields.
    const data: Prisma.EventTriggerUpdateInput = {
      // @ts-ignore
      updatedBy: userId,
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.scopeType !== undefined && { scopeType: dto.scopeType }),
      ...(dto.commodityTypeId !== undefined && {
        commodityTypeId: dto.commodityTypeId,
      }),
      ...(dto.organizationId !== undefined && {
        organizationId: dto.organizationId,
      }),
      ...(dto.siteId !== undefined && { siteId: dto.siteId }),
      ...(dto.compoundId !== undefined && { compoundId: dto.compoundId }),
      ...(dto.cellId !== undefined && { cellId: dto.cellId }),
      ...(dto.conditions !== undefined && {
        conditions: dto.conditions as unknown as Prisma.JsonValue,
      }),
      ...(dto.conditionLogic !== undefined && {
        conditionLogic: dto.conditionLogic,
      }),
      ...(dto.actions !== undefined && {
        actions: dto.actions as unknown as Prisma.JsonValue,
      }),
      ...(dto.severity !== undefined && { severity: dto.severity }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    return this.prisma.eventTrigger.update({
      where: { id },
      data,
      include: {
        organization: {
          select: { id: true, name: true },
        },
        commodityType: {
          select: { id: true, name: true },
        },
        site: {
          select: { id: true, name: true, locale: true },
        },
      },
    });
  }

  /**
   * Toggle active status for a trigger.
   */
  async toggleActive(id: string, isActive: boolean, userId: string) {
    // Ensure it exists before updating.
    await this.findOne(id);

    return this.prisma.eventTrigger.update({
      where: { id },
      data: {
        isActive,
        updatedBy: userId,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        commodityType: {
          select: { id: true, name: true },
        },
        site: {
          select: { id: true, name: true, locale: true },
        },
      },
    });
  }

  /**
   * Soft-delete a trigger by disabling it.
   */
  async remove(id: string, userId: string) {
    // Ensure it exists before updating.
    await this.findOne(id);

    // Soft delete
    return this.prisma.eventTrigger.update({
      where: { id },
      data: {
        isActive: false,
        status: 'DELETED',
        updatedBy: userId,
      },
    });
  }
}

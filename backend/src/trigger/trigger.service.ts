import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTriggerDto,
  ListTriggersQueryDto,
  UpdateTriggerDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TriggerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTriggerDto, userId: string) {
    return this.prisma.eventTrigger.create({
      data: {
        name: dto.name,
        description: dto.description,
        scopeType: dto.scopeType,
        organizationId: dto.organizationId,
        siteId: dto.siteId,
        compoundId: dto.compoundId,
        conditions: dto.conditions as unknown as Prisma.InputJsonValue,
        // @ts-ignore
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
        site: {
          select: { id: true, name: true },
        },
      },
    });
  }

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
      page = 1,
      limit = 10,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.EventTriggerWhereInput = {
      ...(organizationId && { organizationId }),
      ...(siteId && { siteId }),
      ...(compoundId && { compoundId }),
      ...(cellId && { cellId }),
      ...(scopeType && { scopeType }),
      ...(severity && { severity }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

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
          site: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.eventTrigger.count({ where }),
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
    const trigger = await this.prisma.eventTrigger.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        site: {
          select: { id: true, name: true },
        },
        compound: {
          select: { id: true, name: true },
        },
      },
    });

    if (!trigger) {
      throw new NotFoundException(`Trigger with ID ${id} not found`);
    }

    return trigger;
  }

  async update(id: string, dto: UpdateTriggerDto, userId: string) {
    await this.findOne(id);

    const data: Prisma.EventTriggerUpdateInput = {
      // @ts-ignore
      updatedBy: userId,
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.scopeType !== undefined && { scopeType: dto.scopeType }),
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
        site: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async toggleActive(id: string, isActive: boolean, userId: string) {
    await this.findOne(id);

    return this.prisma.eventTrigger.update({
      where: { id },
      data: {
        isActive,
        updatedBy: userId,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    // Soft delete
    return this.prisma.eventTrigger.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: userId,
      },
    });
  }

  // Hard delete (for admin use only)
  async hardDelete(id: string) {
    await this.findOne(id);
    return this.prisma.eventTrigger.delete({ where: { id } });
  }

  // Find triggers that apply to a specific scope (for alert processing)
  async findTriggersForScope(params: {
    organizationId: string;
    siteId?: string;
    compoundId?: string;
    cellId?: string;
  }) {
    const { organizationId, siteId, compoundId, cellId } = params;

    return this.prisma.eventTrigger.findMany({
      where: {
        isActive: true,
        OR: [
          // Organization-level triggers
          {
            scopeType: 'ORGANIZATION',
            organizationId,
          },
          // Site-level triggers (if siteId provided)
          ...(siteId
            ? [
                {
                  scopeType: 'SITE' as const,
                  siteId,
                },
              ]
            : []),
          // Compound-level triggers (if compoundId provided)
          ...(compoundId
            ? [
                {
                  scopeType: 'COMPOUND' as const,
                  compoundId,
                },
              ]
            : []),
        ],
      },
    });
  }
}

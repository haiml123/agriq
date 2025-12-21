import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCellDto,
  CreateCompoundDto,
  CreateSiteDto,
  UpdateCellDto,
  UpdateCompoundDto,
  UpdateSiteDto,
} from './dto';
import { entity_status, user_role } from '@prisma/client';
import {
  canAccessOrganization,
  isAdmin,
  isSuperAdmin,
} from '../user/user.utils';
import { AppUser } from '../types/user.type';

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────
  // PERMISSION HELPERS
  // ─────────────────────────────────────────────────────────────

  private validateOrganizationAccess(user: AppUser, organizationId: string) {
    if (!canAccessOrganization(user, organizationId)) {
      throw new ForbiddenException(
        'You do not have permission to access this organization',
      );
    }
  }

  private async validateSiteAccess(user: AppUser, siteId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      select: { organizationId: true },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID "${siteId}" not found`);
    }

    if (isSuperAdmin(user)) {
      return site;
    }

    if (isAdmin(user)) {
      this.validateOrganizationAccess(user, site.organizationId);
      return site;
    }

    // Operators must have explicit site assignment
    const siteAssignment = await this.prisma.siteUser.findUnique({
      where: {
        userId_siteId: {
          siteId,
          userId: user.id,
        },
      },
    });

    if (!siteAssignment || user.organizationId !== site.organizationId) {
      throw new ForbiddenException(
        'You do not have permission to access this site',
      );
    }

    return site;
  }

  private async validateCompoundAccess(user: AppUser, compoundId: string) {
    const compound = await this.prisma.compound.findUnique({
      where: { id: compoundId },
      include: { site: { select: { organizationId: true, id: true } } },
    });

    if (!compound) {
      throw new NotFoundException(`Compound with ID "${compoundId}" not found`);
    }

    await this.validateSiteAccess(user, compound.site.id);
    return compound;
  }

  private async validateCellAccess(user: AppUser, cellId: string) {
    const cell = await this.prisma.cell.findUnique({
      where: { id: cellId },
      include: {
        compound: {
          include: {
            site: { select: { organizationId: true, id: true } },
          },
        },
      },
    });

    if (!cell) {
      throw new NotFoundException(`Cell with ID "${cellId}" not found`);
    }

    if (!cell.compound?.site?.id) {
      throw new NotFoundException(`Cell with ID "${cellId}" not found`);
    }

    await this.validateSiteAccess(user, cell.compound.site.id);
    return cell;
  }

  // ─────────────────────────────────────────────────────────────
  // SITES
  // ─────────────────────────────────────────────────────────────

  async createSite(user: AppUser, dto: CreateSiteDto) {
    if (user.userRole === user_role.OPERATOR) {
      throw new ForbiddenException(
        'You do not have permission to create sites',
      );
    }

    const organizationId = dto.organizationId ?? user.organizationId;

    if (!organizationId) {
      throw new ForbiddenException('Organization is required to create a site');
    }

    this.validateOrganizationAccess(user, organizationId);

    return this.prisma.site.create({
      data: {
        name: dto.name,
        address: dto.address,
        organizationId,
        createdBy: user.id,
      },
      include: { compounds: { include: { cells: true } } },
    });
  }

  async findAllSites(user: AppUser, organizationId?: string) {
    if (isSuperAdmin(user)) {
      return this.prisma.site.findMany({
        where: organizationId ? { organizationId } : undefined,
        include: {
          compounds: {
            include: { cells: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        } as const,
      });
    }

    if (isAdmin(user)) {
      const userOrgId = user.organizationId;

      if (!userOrgId) {
        throw new ForbiddenException(
          'You do not have permission to access sites',
        );
      }

      if (organizationId && organizationId !== userOrgId) {
        throw new ForbiddenException(
          'You do not have permission to access this organization',
        );
      }

      return this.prisma.site.findMany({
        where: { organizationId: userOrgId },
        include: {
          compounds: {
            include: { cells: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        } as const,
      });
    }

    // Operator: only assigned sites
    const userOrgId = user.organizationId;

    if (!userOrgId) {
      throw new ForbiddenException(
        'You do not have permission to access sites',
      );
    }

    if (organizationId && organizationId !== userOrgId) {
      throw new ForbiddenException(
        'You do not have permission to access this organization',
      );
    }

    return this.prisma.site.findMany({
      where: {
        organizationId: userOrgId,
        siteUsers: {
          some: { userId: user.id },
        },
      },
      include: {
        compounds: {
          include: { cells: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      } as const,
    });
  }

  async findSiteById(user: AppUser, id: string) {
    await this.validateSiteAccess(user, id);

    return this.prisma.site.findUnique({
      where: { id },
      include: { compounds: { include: { cells: true } } },
    });
  }

  async updateSite(user: AppUser, id: string, dto: UpdateSiteDto) {
    await this.validateSiteAccess(user, id);

    return this.prisma.site.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.address !== undefined && { address: dto.address }),
      },
      include: { compounds: { include: { cells: true } } },
    });
  }

  async deleteSite(user: AppUser, id: string) {
    await this.validateSiteAccess(user, id);
    return this.prisma.site.delete({ where: { id } });
  }

  // ─────────────────────────────────────────────────────────────
  // COMPOUNDS
  // ─────────────────────────────────────────────────────────────

  async createCompound(user: AppUser, dto: CreateCompoundDto) {
    await this.validateSiteAccess(user, dto.siteId);

    return this.prisma.compound.create({
      data: {
        name: dto.name,
        status: dto.status || entity_status.ACTIVE,
        siteId: dto.siteId,
        createdBy: user.id as string,
      },
      include: { cells: true },
    });
  }

  async findCompoundById(user: AppUser, id: string) {
    await this.validateCompoundAccess(user, id);

    return this.prisma.compound.findUnique({
      where: { id },
      include: { cells: true, site: true },
    });
  }

  async updateCompound(user: AppUser, id: string, dto: UpdateCompoundDto) {
    await this.validateCompoundAccess(user, id);

    return this.prisma.compound.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.status && { status: dto.status }),
      },
      include: { cells: true },
    });
  }

  async deleteCompound(user: AppUser, id: string) {
    await this.validateCompoundAccess(user, id);
    return this.prisma.compound.delete({ where: { id } });
  }

  // ─────────────────────────────────────────────────────────────
  // CELLS
  // ─────────────────────────────────────────────────────────────

  async createCell(user: AppUser, dto: CreateCellDto) {
    await this.validateCompoundAccess(user, dto.compoundId);

    return this.prisma.cell.create({
      data: {
        name: dto.name,
        capacity: dto.capacity,
        status: dto.status || entity_status.ACTIVE,
        compoundId: dto.compoundId,
        createdBy: user.id as string,
      },
    });
  }

  async findCellById(user: AppUser, id: string) {
    await this.validateCellAccess(user, id);

    return this.prisma.cell.findUnique({
      where: { id },
      include: { compound: { include: { site: true } } },
    });
  }

  async updateCell(user: AppUser, id: string, dto: UpdateCellDto) {
    await this.validateCellAccess(user, id);

    return this.prisma.cell.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  async deleteCell(user: AppUser, id: string) {
    await this.validateCellAccess(user, id);
    return this.prisma.cell.delete({ where: { id } });
  }

  // ─────────────────────────────────────────────────────────────
  // CELL DETAILS (for sites page)
  // ─────────────────────────────────────────────────────────────

  async getCellDetails(
    user: AppUser,
    cellId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    await this.validateCellAccess(user, cellId);

    const cell = await this.prisma.cell.findUnique({
      where: { id: cellId },
      include: {
        compound: {
          include: {
            site: true,
          },
        },
        sensors: true,
      },
    });

    if (!cell) {
      throw new NotFoundException(`Cell with ID "${cellId}" not found`);
    }

    // Default to last 7 days if no date range provided
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 7);

    const effectiveStartDate = startDate || defaultStartDate;
    const effectiveEndDate = endDate || new Date();

    const sensorReadings = await this.prisma.sensorReading.findMany({
      where: {
        cellId,
        recordedAt: {
          gte: effectiveStartDate,
          lte: effectiveEndDate,
        },
      },
      orderBy: {
        recordedAt: 'asc',
      },
    });

    // Get trades in this cell
    const trades = await this.prisma.trade.findMany({
      where: { cellId },
      include: {
        commodity: {
          include: {
            commodityType: true,
          },
        },
      },
      orderBy: {
        tradedAt: 'desc',
      },
    });

    // Get active alerts for this cell
    const alerts = await this.prisma.alert.findMany({
      where: {
        cellId,
        status: {
          in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'],
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return {
      cell,
      sensorReadings,
      trades,
      alerts,
    };
  }

  async getMultipleCellsDetails(
    user: AppUser,
    cellIds: string[],
    startDate?: Date,
    endDate?: Date,
  ) {
    if (!cellIds || cellIds.length === 0) {
      throw new NotFoundException('No cell IDs provided');
    }

    // Validate access to all cells
    await Promise.all(cellIds.map((cellId) => this.validateCellAccess(user, cellId)));

    // Default to last 7 days if no date range provided
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 7);

    const effectiveStartDate = startDate || defaultStartDate;
    const effectiveEndDate = endDate || new Date();

    // Fetch all cells data
    const cells = await this.prisma.cell.findMany({
      where: { id: { in: cellIds } },
      include: {
        compound: {
          include: {
            site: true,
          },
        },
        sensors: true,
      },
    });

    // Fetch sensor readings for all cells
    const sensorReadings = await this.prisma.sensorReading.findMany({
      where: {
        cellId: { in: cellIds },
        recordedAt: {
          gte: effectiveStartDate,
          lte: effectiveEndDate,
        },
      },
      orderBy: {
        recordedAt: 'asc',
      },
    });

    // Fetch trades for all cells
    const trades = await this.prisma.trade.findMany({
      where: { cellId: { in: cellIds } },
      include: {
        commodity: {
          include: {
            commodityType: true,
          },
        },
      },
      orderBy: {
        tradedAt: 'desc',
      },
    });

    // Fetch alerts for all cells
    const alerts = await this.prisma.alert.findMany({
      where: {
        cellId: { in: cellIds },
        status: {
          in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'],
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return {
      cells,
      sensorReadings,
      trades,
      alerts,
    };
  }
}

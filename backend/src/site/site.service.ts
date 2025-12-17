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
import { entity_status, role_type } from '@prisma/client';
import {
  getUserLevelRole,
} from '../user/user.utils';
import { AppUser } from '../types/user.type';

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────
  // PERMISSION HELPERS
  // ─────────────────────────────────────────────────────────────

  private async getOperatorSiteIds(userId: string): Promise<string[]> {
    const siteRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        role: { in: [role_type.OPERATOR, role_type.ADMIN] },
        siteId: { not: null },
      },
      select: { siteId: true },
    });

    return siteRoles
      .map((role) => role.siteId)
      .filter((siteId): siteId is string => siteId !== null);
  }

  private async validateSitePermission(
    user: AppUser,
    site: { id: string; organizationId: string },
  ) {
    const userRole = getUserLevelRole(user);

    if (userRole === role_type.SUPER_ADMIN) {
      return;
    }

    if (userRole === role_type.ADMIN) {
      if (user.organizationId !== site.organizationId) {
        throw new ForbiddenException(
          'You do not have permission to access this site',
        );
      }
      return;
    }

    const allowedSiteIds = await this.getOperatorSiteIds(user.id);
    if (!allowedSiteIds.includes(site.id)) {
      throw new ForbiddenException(
        'You do not have permission to access this site',
      );
    }
  }

  private validateOrganizationAccess(user: AppUser, organizationId: string) {
    const userRole = getUserLevelRole(user);

    if (userRole === role_type.SUPER_ADMIN) {
      return;
    }

    if (
      userRole === role_type.ADMIN &&
      user.organizationId === organizationId
    ) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to access this organization',
    );
  }

  private async validateSiteAccess(user: AppUser, siteId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, organizationId: true },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID "${siteId}" not found`);
    }

    await this.validateSitePermission(user, site);
    return site;
  }

  private async validateCompoundAccess(user: AppUser, compoundId: string) {
    const compound = await this.prisma.compound.findUnique({
      where: { id: compoundId },
      include: { site: { select: { id: true, organizationId: true } } },
    });

    if (!compound) {
      throw new NotFoundException(`Compound with ID "${compoundId}" not found`);
    }

    await this.validateSitePermission(user, {
      id: compound.site.id,
      organizationId: compound.site.organizationId,
    });
    return compound;
  }

  private async validateCellAccess(user: AppUser, cellId: string) {
    const cell = await this.prisma.cell.findUnique({
      where: { id: cellId },
      include: {
        compound: {
          include: {
            site: { select: { id: true, organizationId: true } },
          },
        },
      },
    });

    if (!cell) {
      throw new NotFoundException(`Cell with ID "${cellId}" not found`);
    }

    const site = cell.compound?.site;
    if (!site) {
      throw new NotFoundException('Site not found for the provided cell');
    }

    await this.validateSitePermission(user, {
      id: site.id,
      organizationId: site.organizationId,
    });
    return cell;
  }

  // ─────────────────────────────────────────────────────────────
  // SITES
  // ─────────────────────────────────────────────────────────────

  async createSite(user: AppUser, dto: CreateSiteDto) {
    this.validateOrganizationAccess(user, dto.organizationId);

    return this.prisma.site.create({
      data: {
        name: dto.name,
        address: dto.address,
        organizationId: dto.organizationId,
        createdBy: user.id,
      },
      include: { compounds: { include: { cells: true } } },
    });
  }

  async findAllSites(user: AppUser, organizationId?: string) {
    const userRole = getUserLevelRole(user);

    if (userRole === role_type.SUPER_ADMIN) {
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

    if (userRole === role_type.ADMIN) {
      const userOrgId = user.organizationId;

      if (!userOrgId) {
        throw new ForbiddenException(
          'You do not have permission to access this organization',
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

    const operatorSiteIds = await this.getOperatorSiteIds(user.id);

    if (operatorSiteIds.length === 0) {
      return [];
    }

    return this.prisma.site.findMany({
      where: {
        id: { in: operatorSiteIds },
        ...(organizationId ? { organizationId } : {}),
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
}

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
import { entity_status, User } from '@prisma/client';
import { isSuperAdmin, isAdmin } from '../user/user.utils';

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────
  // PERMISSION HELPERS
  // ─────────────────────────────────────────────────────────────

  private validateOrganizationAccess(user: User, organizationId: string) {
    if (isSuperAdmin(user)) {
      return;
    }

    if (isAdmin(user) && user.organizationId === organizationId) {
      return;
    }

    throw new ForbiddenException(
      'You do not have permission to access this organization',
    );
  }

  private async validateSiteAccess(
    user: User,
    siteId: string,
    organizationId?: string,
  ) {
    const siteOrgId = organizationId
      ? { organizationId }
      : await this.prisma.site.findUnique({
          where: { id: siteId },
          select: { organizationId: true },
        });

    const orgId = organizationId ?? siteOrgId?.organizationId;

    if (!orgId) {
      throw new NotFoundException(`Site with ID "${siteId}" not found`);
    }

    if (isSuperAdmin(user)) {
      return { organizationId: orgId };
    }

    if (isAdmin(user)) {
      if (user.organizationId !== orgId) {
        throw new ForbiddenException(
          'You do not have permission to access this organization',
        );
      }
      return { organizationId: orgId };
    }

    const siteAccess = await this.prisma.siteUser.findFirst({
      where: { siteId, userId: user.id },
    });

    if (!siteAccess || user.organizationId !== orgId) {
      throw new ForbiddenException(
        'You do not have permission to access this site',
      );
    }

    return { organizationId: orgId };
  }

  private async validateCompoundAccess(user: User, compoundId: string) {
    const compound = await this.prisma.compound.findUnique({
      where: { id: compoundId },
      include: { site: { select: { id: true, organizationId: true } } },
    });

    if (!compound) {
      throw new NotFoundException(`Compound with ID "${compoundId}" not found`);
    }

    await this.validateSiteAccess(
      user,
      compound.site.id,
      compound.site.organizationId,
    );
    return compound;
  }

  private async validateCellAccess(user: User, cellId: string) {
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

    await this.validateSiteAccess(
      user,
      cell.compound.site.id,
      cell.compound.site.organizationId,
    );
    return cell;
  }

  // ─────────────────────────────────────────────────────────────
  // SITES
  // ─────────────────────────────────────────────────────────────

  async createSite(user: User, dto: CreateSiteDto) {
    if (!isSuperAdmin(user) && !isAdmin(user)) {
      throw new ForbiddenException(
        'You do not have permission to create sites',
      );
    }

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

  async findAllSites(user: User, organizationId?: string) {
    if (isSuperAdmin(user)) {
      return this.prisma.site.findMany({
        where: organizationId ? { organizationId } : undefined,
        include: {
          compounds: {
            include: { cells: true },
          },
        },
        orderBy: { createdAt: 'desc' as const },
      });
    }

    if (isAdmin(user)) {
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
        orderBy: { createdAt: 'desc' as const },
      });
    }

    // Operator: only assigned sites
    if (
      organizationId &&
      user.organizationId &&
      organizationId !== user.organizationId
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this organization',
      );
    }

    const siteWhere = {
      siteUsers: {
        some: {
          userId: user.id,
        },
      },
      ...(organizationId
        ? { organizationId }
        : user.organizationId
          ? { organizationId: user.organizationId }
          : {}),
    } as const;

    return this.prisma.site.findMany({
      where: siteWhere,
      include: {
        compounds: {
          include: { cells: true },
        },
      },
      orderBy: { createdAt: 'desc' as const },
    });
  }

  async findSiteById(user: User, id: string) {
    await this.validateSiteAccess(user, id);

    return this.prisma.site.findUnique({
      where: { id },
      include: { compounds: { include: { cells: true } } },
    });
  }

  async updateSite(user: User, id: string, dto: UpdateSiteDto) {
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

  async deleteSite(user: User, id: string) {
    await this.validateSiteAccess(user, id);
    return this.prisma.site.delete({ where: { id } });
  }

  // ─────────────────────────────────────────────────────────────
  // COMPOUNDS
  // ─────────────────────────────────────────────────────────────

  async createCompound(user: User, dto: CreateCompoundDto) {
    await this.validateSiteAccess(user, dto.siteId);

    return this.prisma.compound.create({
      data: {
        name: dto.name,
        status: dto.status || entity_status.ACTIVE,
        siteId: dto.siteId,
        createdBy: user.id,
      },
      include: { cells: true },
    });
  }

  async findCompoundById(user: User, id: string) {
    await this.validateCompoundAccess(user, id);

    return this.prisma.compound.findUnique({
      where: { id },
      include: { cells: true, site: true },
    });
  }

  async updateCompound(user: User, id: string, dto: UpdateCompoundDto) {
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

  async deleteCompound(user: User, id: string) {
    await this.validateCompoundAccess(user, id);
    return this.prisma.compound.delete({ where: { id } });
  }

  // ─────────────────────────────────────────────────────────────
  // CELLS
  // ─────────────────────────────────────────────────────────────

  async createCell(user: User, dto: CreateCellDto) {
    await this.validateCompoundAccess(user, dto.compoundId);

    return this.prisma.cell.create({
      data: {
        name: dto.name,
        capacity: dto.capacity,
        status: dto.status || entity_status.ACTIVE,
        compoundId: dto.compoundId,
        createdBy: user.id,
      },
    });
  }

  async findCellById(user: User, id: string) {
    await this.validateCellAccess(user, id);

    return this.prisma.cell.findUnique({
      where: { id },
      include: { compound: { include: { site: true } } },
    });
  }

  async updateCell(user: User, id: string, dto: UpdateCellDto) {
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

  async deleteCell(user: User, id: string) {
    await this.validateCellAccess(user, id);
    return this.prisma.cell.delete({ where: { id } });
  }
}

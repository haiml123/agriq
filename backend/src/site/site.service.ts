import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
import { canAccessOrganization, isSuperAdmin } from '../user/user.utils';

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────
  // PERMISSION HELPERS
  // ─────────────────────────────────────────────────────────────

  private validateOrganizationAccess(user: User, organizationId: string) {
    if (!canAccessOrganization(user, organizationId)) {
      throw new ForbiddenException('You do not have permission to access this organization');
    }
  }

  private async validateSiteAccess(user: User, siteId: string) {
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      select: { organizationId: true },
    });

    if (!site) {
      throw new NotFoundException(`Site with ID "${siteId}" not found`);
    }

    this.validateOrganizationAccess(user, site.organizationId);
    return site;
  }

  private async validateCompoundAccess(user: User, compoundId: string) {
    const compound = await this.prisma.compound.findUnique({
      where: { id: compoundId },
      include: { site: { select: { organizationId: true } } },
    });

    if (!compound) {
      throw new NotFoundException(`Compound with ID "${compoundId}" not found`);
    }

    this.validateOrganizationAccess(user, compound.site.organizationId);
    return compound;
  }

  private async validateCellAccess(user: User, cellId: string) {
    const cell = await this.prisma.cell.findUnique({
      where: { id: cellId },
      include: {
        compound: {
          include: {
            site: { select: { organizationId: true } }
          }
        }
      }
    });

    if (!cell) {
      throw new NotFoundException(`Cell with ID "${cellId}" not found`);
    }

    this.validateOrganizationAccess(user, cell.compound?.site?.organizationId);
    return cell;
  }

  // ─────────────────────────────────────────────────────────────
  // SITES
  // ─────────────────────────────────────────────────────────────

  async createSite(user: User, dto: CreateSiteDto) {
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
    // Super admin can see all, org admin sees only their org
    let whereOrgId: string | undefined;

    if (isSuperAdmin(user)) {
      whereOrgId = organizationId;
    } else {
      // For org admin, use their org or validate requested org
      const userOrgId = user.roles.find(r => r.organizationId)?.organizationId;
      if (organizationId && organizationId !== userOrgId) {
        throw new ForbiddenException('You do not have permission to access this organization');
      }
      whereOrgId = userOrgId;
    }

    return this.prisma.site.findMany({
      where: whereOrgId
          ? { organizationId: whereOrgId }
          : undefined,
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

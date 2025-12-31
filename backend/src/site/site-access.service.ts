import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  canAccessOrganization,
  isAdmin,
  isSuperAdmin,
} from '../user/user.utils';
import { AppUser } from '../types/user.type';

@Injectable()
export class SiteAccessService {
  constructor(private readonly prisma: PrismaService) {}

  validateOrganizationAccess(user: AppUser, organizationId: string) {
    if (!canAccessOrganization(user, organizationId)) {
      throw new ForbiddenException(
        'You do not have permission to access this organization',
      );
    }
  }

  async validateSiteAccess(user: AppUser, siteId: string) {
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

  async validateCompoundAccess(user: AppUser, compoundId: string) {
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

  async validateCellAccess(user: AppUser, cellId: string) {
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

  ensureSuperAdmin(user: AppUser) {
    if (!isSuperAdmin(user)) {
      throw new ForbiddenException(
        'You do not have permission to access simulator features',
      );
    }
  }
}

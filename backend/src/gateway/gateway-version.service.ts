import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SiteAccessService } from '../site';
import { AppUser } from '../types/user.type';
import {
  CreateGatewayVersionDto,
  SetActiveGatewayVersionDto,
} from './dto';

@Injectable()
export class GatewayVersionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly siteAccess: SiteAccessService,
  ) {}

  async listGatewayVersions(_user: AppUser) {
    return this.prisma.gatewayVersion.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getActiveGatewayVersion(_user: AppUser) {
    return this.prisma.gatewayVersion.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGatewayVersion(user: AppUser, dto: CreateGatewayVersionDto) {
    this.siteAccess.ensureSuperAdmin(user);

    const version = dto.version?.trim();
    if (!version) {
      throw new BadRequestException('version is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.gatewayVersion.create({
        data: {
          version,
          isActive: false,
        },
      });

      if (dto.isActive) {
        await tx.gatewayVersion.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });

        return tx.gatewayVersion.update({
          where: { id: created.id },
          data: { isActive: true },
        });
      }

      return created;
    });
  }

  async setActiveGatewayVersion(
    user: AppUser,
    dto: SetActiveGatewayVersionDto,
  ) {
    this.siteAccess.ensureSuperAdmin(user);

    const id = dto.id?.trim();
    const version = dto.version?.trim();
    if (!id && !version) {
      throw new BadRequestException('id or version is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const target = await tx.gatewayVersion.findUnique({
        where: id ? { id } : { version: version as string },
      });

      if (!target) {
        throw new NotFoundException('Gateway version not found');
      }

      await tx.gatewayVersion.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      return tx.gatewayVersion.update({
        where: { id: target.id },
        data: { isActive: true },
      });
    });
  }
}

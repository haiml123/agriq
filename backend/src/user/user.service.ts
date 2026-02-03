import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, ListUsersQueryDto } from './dto';
import { Prisma, user_role, User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import {
  getOrganizationFilter,
  isSuperAdmin,
  validateUserManagementPermission,
} from './user.utils';
import { AppUser } from '../types/user.type';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUser: AppUser, dto: CreateUserDto) {
    const { siteIds, role, organizationId, password, ...userData } = dto;

    if (!password || password.trim() === '') {
      throw new BadRequestException('Password is required');
    }

    if (!organizationId && role !== user_role.SUPER_ADMIN) {
      throw new BadRequestException('Organization is required');
    }

    validateUserManagementPermission({
      currentUser,
      targetOrganizationId: organizationId ?? null,
      targetRole: role,
    });

    if (organizationId) {
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new NotFoundException(
          `Organization with ID "${organizationId}" not found`,
        );
      }
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (siteIds && siteIds.length > 0 && organizationId) {
      const sites = await this.prisma.site.findMany({
        where: {
          id: { in: siteIds },
          organizationId: organizationId,
        },
      });

      if (sites.length !== siteIds.length) {
        throw new NotFoundException(
          'One or more sites not found or do not belong to this organization',
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        organizationId: organizationId ?? null,
        userRole: role,
        siteUsers:
          role === user_role.OPERATOR && siteIds && siteIds.length > 0
            ? {
                create: siteIds.map((siteId) => ({
                  site: { connect: { id: siteId } },
                  siteRole: user_role.OPERATOR,
                })),
              }
            : undefined,
      },
      include: {
        siteUsers: { include: { site: true } },
        organization: { select: { id: true, name: true } },
      },
    });
  }

  async update(currentUser: AppUser, id: string, dto: UpdateUserDto) {
    const { siteIds, role, password, ...userData } = dto;

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { siteUsers: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    validateUserManagementPermission({
      currentUser,
      targetOrganizationId: user.organizationId,
      targetRole: role ?? user.userRole,
      existingUserRole: user.userRole,
    });

    if (siteIds && siteIds.length > 0 && user.organizationId) {
      const sites = await this.prisma.site.findMany({
        where: {
          id: { in: siteIds },
          organizationId: user.organizationId,
        },
      });

      if (sites.length !== siteIds.length) {
        throw new NotFoundException(
          'One or more sites not found or do not belong to this organization',
        );
      }
    }

    const updateData: Prisma.UserUpdateInput = { ...userData };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (role) {
      updateData.userRole = role;
    }

    const targetRole = role ?? user.userRole;

    if (targetRole !== user_role.OPERATOR) {
      await this.prisma.siteUser.deleteMany({
        where: { userId: id },
      });
    } else if (siteIds) {
      if (!user.organizationId) {
        throw new BadRequestException(
          'User must belong to an organization for site assignments',
        );
      }

      await this.prisma.siteUser.deleteMany({
        where: { userId: id },
      });

      if (siteIds.length > 0) {
        await this.prisma.siteUser.createMany({
          data: siteIds.map((siteId) => ({
            userId: id,
            siteId,
            siteRole: user_role.OPERATOR,
          })),
        });
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        siteUsers: { include: { site: true } },
        organization: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(user: AppUser, query: ListUsersQueryDto) {
    const { organizationId, status, search, page = 1, limit = 10 } = query;

    const where: Prisma.UserWhereInput = {};

    const organizationFilter = getOrganizationFilter(user, organizationId);
    if (organizationFilter === null) {
      throw new BadRequestException('You are not authorized for this action');
    }

    if (organizationFilter) {
      where.organizationId = organizationFilter;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: {
            select: { id: true, name: true },
          },
          siteUsers: { include: { site: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        siteUsers: { include: { site: true } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        siteUsers: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        siteUsers: true,
      },
    });
  }
}

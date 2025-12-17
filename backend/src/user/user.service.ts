import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, ListUsersQueryDto } from './dto';
import { Prisma, role_type } from '@prisma/client';
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
  constructor(private readonly prisma: PrismaService) {
    console.log('UserService created');
  }

  async create(currentUser: AppUser, dto: CreateUserDto) {
    const { siteIds, role, organizationId, password, ...userData } = dto;

    // Validate password is provided
    if (!password || password.trim() === '') {
      throw new BadRequestException('Password is required');
    }

    // Organization is always required
    if (!organizationId) {
      throw new BadRequestException('Organization is required');
    }

    // Validate permissions
    validateUserManagementPermission({
      currentUser,
      targetOrganizationId: organizationId,
      targetRole: role,
    });

    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID "${organizationId}" not found`,
      );
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate siteIds if provided
    if (siteIds && siteIds.length > 0) {
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

    // Build role records
    let roleRecords: Prisma.UserRoleCreateWithoutUserInput[];

    if (role === role_type.OPERATOR && siteIds && siteIds.length > 0) {
      // Site-level access: create one UserRole per site
      roleRecords = siteIds.map((siteId) => ({
        role,
        organization: { connect: { id: organizationId } },
        site: { connect: { id: siteId } },
        grantedByUserId: currentUser.id as string,
      }));
    } else {
      // Org-level access (all sites): siteId = null
      roleRecords = [
        {
          role,
          organization: { connect: { id: organizationId } },
          site: undefined,
          grantedByUserId: currentUser.id as string,
        },
      ];
    }

    return this.prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        organizationId,
        userRole: role,
        roles: {
          create: roleRecords,
        },
      },
      include: {
        roles: true,
        organization: { select: { id: true, name: true } },
      },
    });
  }

  async update(currentUser: AppUser, id: string, dto: UpdateUserDto) {
    const { siteIds, role, password, ...userData } = dto;

    // Find existing user
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate permissions
    validateUserManagementPermission({
      currentUser,
      targetOrganizationId: user.organizationId,
      targetRole: role ?? user.roles[0]?.role,
      existingUserRoles: user.roles,
    });

    // Validate siteIds if provided
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

    // Prepare update data
    const updateData: Prisma.UserUpdateInput = { ...userData };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Only update roles if role or siteIds were explicitly provided
    if (role || siteIds) {
      const newRole =
        role ?? user.roles[0]?.role ?? user.userRole ?? role_type.OPERATOR;
      const organizationId = user.organizationId;

      // Extra safety: org admins should never reach here with SUPER_ADMIN
      if (!isSuperAdmin(currentUser) && newRole === role_type.SUPER_ADMIN) {
        throw new ForbiddenException(
          'You do not have permission to assign super admin role',
        );
      }

      // Delete existing roles
      await this.prisma.userRole.deleteMany({
        where: { userId: id },
      });

      // Create new roles using createMany (accepts direct IDs)
      let roleRecords: Prisma.UserRoleCreateManyInput[];

      if (newRole === role_type.OPERATOR && siteIds && siteIds.length > 0) {
        // Site-level access: create one UserRole per site
        roleRecords = siteIds.map((siteId) => ({
          userId: id,
          role: newRole,
          organizationId,
          siteId,
          grantedByUserId: currentUser.id as string,
        }));
      } else {
        // Org-level access (all sites): siteId = null
        roleRecords = [
          {
            userId: id,
            role: newRole,
            organizationId:
              newRole === role_type.SUPER_ADMIN ? null : organizationId,
            siteId: null,
            grantedByUserId: currentUser.id as string,
          },
        ];
      }

      await this.prisma.userRole.createMany({
        data: roleRecords,
      });

      updateData.userRole = newRole;
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        roles: true,
        organization: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(user: AppUser, query: ListUsersQueryDto) {
    const { organizationId, status, search, page = 1, limit = 10 } = query;

    const isRootAdmin = isSuperAdmin(user);

    const where: Prisma.UserWhereInput = {};

    if (isRootAdmin) {
      if (organizationId) {
        where.organizationId = organizationId;
      }
    } else {
      const organizationFilter = getOrganizationFilter(user, organizationId);
      if (!organizationFilter) {
        throw new BadRequestException('You are not authorized for this action');
      }
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
          roles: true,
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
        roles: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<AppUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
      },
    });
  }

  async findById(id: string): Promise<AppUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        roles: true,
      },
    });
  }
}

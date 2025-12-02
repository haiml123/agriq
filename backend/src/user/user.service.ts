import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, ListUsersQueryDto } from './dto';
import { Prisma, role_type, User } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import type { UserWithRoles } from './user.type';
import {
  canAccessOrganization,
  getAdminOrganizationIds,
  getOrganizationFilter,
  isOrgAdmin,
  isSuperAdmin,
} from './user.utils';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {
    console.log('UserService created');
  }

  async create(
    user: UserWithRoles,
    dto: CreateUserDto,
    createdByUserId?: string,
  ) {
    // Validate password is provided
    if (!dto.password || dto.password.trim() === '') {
      throw new BadRequestException('Password is required');
    }

    // Organization is always required
    if (!dto.organizationId) {
      throw new BadRequestException('Organization is required');
    }

    // Check if user has access to create users in this organization
    if (!isSuperAdmin(user)) {
      const adminOrgIds = getAdminOrganizationIds(user);

      if (!adminOrgIds.includes(dto.organizationId)) {
        throw new ForbiddenException(
          'You do not have permission to create users in this organization',
        );
      }
    }

    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
    });

    if (!organization) {
      throw new NotFoundException(
        `Organization with ID "${dto.organizationId}" not found`,
      );
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists`,
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user with role
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        password: hashedPassword,
        languagePreference: dto.languagePreference,
        organizationId: dto.organizationId,
        roles: {
          create: {
            role: dto.role,
            organizationId: dto.organizationId,
            grantedByUserId: createdByUserId,
          },
        },
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        roles: true,
      },
    });

    return newUser;
  }

  async findAll(user: UserWithRoles, query: ListUsersQueryDto) {
    const { organizationId, status, search, page = 1, limit = 10 } = query;

    const isRootAdmin = isSuperAdmin(user);

    const where: Prisma.UserWhereInput = {};

    if (!isRootAdmin) {
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

  async update(currentUser: UserWithRoles, id: string, dto: UpdateUserDto) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    if (!targetUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    const isSuper = isSuperAdmin(currentUser);
    const isAdmin = isOrgAdmin(currentUser);
    const isOwnAccount = currentUser.id === id;

    // Operator can only update their own account
    if (!isSuper && !isAdmin && !isOwnAccount) {
      throw new ForbiddenException(
        'You do not have permission to update this user',
      );
    }

    // Org admin can only update users in their organization
    if (!isSuper && isAdmin && targetUser.organizationId) {
      if (!canAccessOrganization(currentUser, targetUser.organizationId)) {
        throw new ForbiddenException(
          'You do not have permission to update this user',
        );
      }
    }

    // Organization can only be changed by super admin
    if (
      dto.organizationId &&
      dto.organizationId !== targetUser.organizationId
    ) {
      if (!isSuper) {
        throw new ForbiddenException(
          'Only super admin can change organization',
        );
      }
    }

    // Build allowed update data based on role
    const updateData: Prisma.UserUpdateInput = {};

    if (isSuper) {
      // Super admin can update: name, password, status, organization, role, phone, languagePreference
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.phone !== undefined) updateData.phone = dto.phone;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.languagePreference !== undefined)
        updateData.languagePreference = dto.languagePreference;
      if (dto.organizationId !== undefined)
        updateData.organization = { connect: { id: dto.organizationId } };
    } else if (isAdmin) {
      // Org admin can update: name, password, status, role, phone, languagePreference
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.phone !== undefined) updateData.phone = dto.phone;
      if (dto.status !== undefined) updateData.status = dto.status;
      if (dto.languagePreference !== undefined)
        updateData.languagePreference = dto.languagePreference;
    } else if (isOwnAccount) {
      // Operator can only update their own: name, password
      if (dto.name !== undefined) updateData.name = dto.name;
    }

    // Handle password (allowed for all who can update)
    if (dto.password?.trim()) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        organization: {
          select: { id: true, name: true },
        },
        roles: true,
      },
    });

    // Update role if provided (only super admin and org admin)
    if (dto.role && (isSuper || isAdmin) && targetUser.roles.length > 0) {
      // Org admin cannot assign SUPER_ADMIN role
      if (!isSuper && dto.role === role_type.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Only super admin can assign super admin role',
        );
      }

      await this.prisma.userRole.update({
        where: { id: targetUser.roles[0].id },
        data: { role: dto.role },
      });
    }

    return this.findOne(id);
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

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        roles: true,
      },
    });
  }
}

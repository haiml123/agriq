import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    organizationId?: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      image?: string;
    },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async findAll(organizationId?: string): Promise<Omit<User, 'password'>[]> {
    const users = await this.prisma.user.findMany({
      where: organizationId ? { organizationId } : undefined,
      include: {
        organization: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Remove passwords from response
    return users.map(({ password, ...user }) => user);
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AcceptInviteDto, CreateInviteDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { invite_status, Site, user_role } from '@prisma/client';

@Injectable()
export class InvitesService {
  private readonly logger = new Logger(InvitesService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Create a new invite and send email (Admin only)
   */
  async create(createInviteDto: CreateInviteDto, createdById: string) {
    const {
      email,
      organizationId,
      siteId,
      expiresInDays = 7,
    } = createInviteDto;

    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Check if site exists (if provided)
    let site: Site | null = null;
    if (siteId) {
      site = await this.prisma.site.findUnique({
        where: { id: siteId },
      });

      if (!site) {
        throw new NotFoundException('Site not found');
      }

      if (site.organizationId !== organizationId) {
        throw new BadRequestException(
          'Site does not belong to this organization',
        );
      }
    }

    // Check if user already exists with this email
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check if there's already a pending invite for this email in this organization
    const existingInvite = await this.prisma.invite.findFirst({
      where: {
        email,
        organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      throw new ConflictException(
        'A pending invite already exists for this email in this organization',
      );
    }

    // Get the inviter's info
    const inviter = await this.prisma.user.findUnique({
      where: { id: createdById },
      select: { name: true, email: true },
    });

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create the invite
    const invite = await this.prisma.invite.create({
      data: {
        token: crypto.randomUUID(),
        email,
        organizationId,
        siteId,
        expiresAt,
        createdById,
      },
      include: {
        organization: true,
        site: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send invite email
    const inviteUrl = `/invite/${invite.token}`;
    const emailSent = await this.emailService.sendInviteEmail({
      email: invite.email,
      inviteUrl,
      organizationName: organization.name,
      roleName: site ? 'Operator' : 'Member',
      siteName: site?.name,
      inviterName: inviter?.name || 'An administrator',
      expiresAt: invite.expiresAt,
    });

    if (!emailSent) {
      this.logger.warn(
        `Failed to send invite email to ${email}, but invite was created`,
      );
    }

    return {
      ...invite,
      inviteUrl,
      emailSent,
    };
  }

  /**
   * Get invite details by token (Public - for viewing invite before accepting)
   */
  async getByToken(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        organization: true,
        site: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException(
        `This invite has already been ${invite.status.toLowerCase()}`,
      );
    }

    if (invite.expiresAt < new Date()) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('This invite has expired');
    }

    return {
      id: invite.id,
      email: invite.email,
      role: user_role.OPERATOR,
      organization: invite.organization.name,
      site: invite.site?.name || null,
      expiresAt: invite.expiresAt,
    };
  }

  /**
   * Accept an invite and create user account
   */
  async accept(token: string, acceptInviteDto: AcceptInviteDto) {
    const { firstName, lastName, phone, password } = acceptInviteDto;

    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        organization: true,
        site: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException(
        `This invite has already been ${invite.status.toLowerCase()}`,
      );
    }

    if (invite.expiresAt < new Date()) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('This invite has expired');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invite.email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: invite.email,
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          phone,
          organizationId: invite.organizationId,
          userRole: user_role.OPERATOR,
        },
      });

      if (invite.siteId) {
        await tx.siteUser.create({
          data: {
            userId: user.id,
            siteId: invite.siteId,
            siteRole: user_role.OPERATOR,
          },
        });
      }

      await tx.invite.update({
        where: { id: invite.id },
        data: {
          status: 'ACCEPTED',
          acceptedById: user.id,
          acceptedAt: new Date(),
        },
      });

      return user;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = result;
    return {
      user: userWithoutPassword,
      organization: invite.organization.name,
      role: user_role.OPERATOR,
    };
  }

  /**
   * List all invites for an organization (Admin only)
   */
  async findAllByOrganization(organizationId: string, status?: invite_status) {
    return this.prisma.invite.findMany({
      where: {
        organizationId,
        ...(status && { status }),
      },
      include: {
        site: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        acceptedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Revoke an invite (Admin only)
   */
  async revoke(inviteId: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot revoke an invite that has been ${invite.status.toLowerCase()}`,
      );
    }

    return this.prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' },
      include: {
        organization: true,
        site: true,
      },
    });
  }

  /**
   * Resend invite (creates new token, extends expiration, sends new email)
   */
  async resend(inviteId: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { id: inviteId },
      include: {
        organization: true,
        site: true,
      },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (invite.status === 'ACCEPTED') {
      throw new BadRequestException('Cannot resend an accepted invite');
    }

    if (invite.status === 'REVOKED') {
      throw new BadRequestException('Cannot resend a revoked invite');
    }

    // Get resender's info
    const resender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    // Generate new token and extend expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const newToken = crypto.randomUUID();

    const updatedInvite = await this.prisma.invite.update({
      where: { id: inviteId },
      data: {
        token: newToken,
        status: 'PENDING',
        expiresAt,
      },
      include: {
        organization: true,
        site: true,
      },
    });

    // Send new email
    const inviteUrl = `/invite/${newToken}`;
    const emailSent = await this.emailService.sendInviteEmail({
      email: updatedInvite.email,
      inviteUrl,
      organizationName: invite.organization.name,
      roleName: updatedInvite.site ? 'Operator' : 'Member',
      siteName: updatedInvite.site?.name,
      inviterName: resender?.name || 'An administrator',
      expiresAt,
    });

    return {
      ...updatedInvite,
      inviteUrl,
      emailSent,
    };
  }

  /**
   * Delete an invite (Admin only)
   */
  async delete(inviteId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    return this.prisma.invite.delete({
      where: { id: inviteId },
    });
  }

  /**
   * Cleanup expired invites (cron job)
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.prisma.invite.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return result.count;
  }
}

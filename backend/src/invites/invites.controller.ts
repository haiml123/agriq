import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto, AcceptInviteDto } from './dto';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  /**
   * Create a new invite (Admin only)
   * POST /api/invites
   */
  @Post()
  async create(
    @Body() createInviteDto: CreateInviteDto,
    @CurrentUser('id') userId: string,
  ) {
    const invite = await this.invitesService.create(createInviteDto, userId);

    // In production, you would send an email here with the invite link
    // For now, return the token so it can be used
    return {
      ...invite,
      inviteUrl: `/invite/${invite.token}`, // Frontend URL
    };
  }

  /**
   * Get invite details by token (Public - for viewing before accepting)
   * GET /api/invites/token/:token
   */
  @Public()
  @Get('token/:token')
  async getByToken(@Param('token') token: string) {
    return this.invitesService.getByToken(token);
  }

  /**
   * Accept an invite (Public - creates user account)
   * POST /api/invites/token/:token/accept
   */
  @Public()
  @Post('token/:token/accept')
  @HttpCode(HttpStatus.CREATED)
  async accept(
    @Param('token') token: string,
    @Body() acceptInviteDto: AcceptInviteDto,
  ) {
    return this.invitesService.accept(token, acceptInviteDto);
  }

  /**
   * List all invites for an organization (Admin only)
   * GET /api/invites?organizationId=xxx&status=PENDING
   */
  @Get()
  async findAll(
    @Query('organizationId') organizationId: string,
    @Query('status') status?: string,
  ) {
    if (!organizationId) {
      throw new Error('organizationId is required');
    }
    return this.invitesService.findAllByOrganization(organizationId, status);
  }

  /**
   * Revoke an invite (Admin only)
   * PATCH /api/invites/:id/revoke
   */
  @Patch(':id/revoke')
  async revoke(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.invitesService.revoke(id, userId);
  }

  /**
   * Resend an invite (Admin only)
   * PATCH /api/invites/:id/resend
   */
  @Patch(':id/resend')
  async resend(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    const invite = await this.invitesService.resend(id, userId);

    return {
      ...invite,
      inviteUrl: `/invite/${invite.token}`,
    };
  }

  /**
   * Delete an invite (Admin only)
   * DELETE /api/invites/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.invitesService.delete(id);
  }
}

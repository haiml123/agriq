import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import {
  ChangeStatusDto,
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, Public } from '../auth/decorators';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { entity_status, user_role } from '@prisma/client';
import type { AppUser } from '../types/user.type';
import { parsePagination } from '../utils/pagination';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {
    console.log('organization controller');
  }

  @Public()
  @Post()
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.organizationService.create(dto, userId);
  }

  @Get()
  @Roles(user_role.SUPER_ADMIN)
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const { page: parsedPage, limit: parsedLimit } = parsePagination({
      page,
      limit,
      defaultPage: 1,
      defaultLimit: 10,
    });

    const parsedStatus =
      status && Object.values(entity_status).includes(status as entity_status)
        ? (status as entity_status)
        : undefined;

    return this.organizationService.findAll({
      page: parsedPage,
      limit: parsedLimit,
      search,
      status: parsedStatus,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }

  @Patch(':id')
  @Roles(user_role.SUPER_ADMIN, user_role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.organizationService.update(id, dto, user);
  }

  @Patch(':id/status')
  @Roles(user_role.SUPER_ADMIN, user_role.ADMIN)
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: AppUser,
  ) {
    return this.organizationService.changeStatus(id, dto, user);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SiteService } from './site.service';
import {
  CreateCellDto,
  CreateCompoundDto,
  CreateSiteDto,
  UpdateCellDto,
  UpdateCompoundDto,
  UpdateSiteDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import * as userType from '../types/user.type';

@Controller('sites')
@UseGuards(JwtAuthGuard)
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  // ─────────────────────────────────────────────────────────────
  // SITES
  // ─────────────────────────────────────────────────────────────

  @Post()
  createSite(
    @Body() dto: CreateSiteDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.siteService.createSite(user, dto);
  }

  @Get()
  findAllSites(
    @CurrentUser() user: userType.AppUser,
    @Query('organizationId') organizationId?: string,
  ) {
    return this.siteService.findAllSites(user, organizationId);
  }

  @Get(':id')
  findSiteById(@Param('id') id: string, @CurrentUser() user: userType.AppUser) {
    return this.siteService.findSiteById(user, id);
  }

  @Patch(':id')
  updateSite(
    @Param('id') id: string,
    @Body() dto: UpdateSiteDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.siteService.updateSite(user, id, dto);
  }

  @Delete(':id')
  deleteSite(@Param('id') id: string, @CurrentUser() user: userType.AppUser) {
    return this.siteService.deleteSite(user, id);
  }

  // ─────────────────────────────────────────────────────────────
  // COMPOUNDS
  // ─────────────────────────────────────────────────────────────

  @Post('compounds')
  createCompound(
    @Body() dto: CreateCompoundDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.siteService.createCompound(user, dto);
  }

  @Get('compounds/:id')
  findCompoundById(
    @Param('id') id: string,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.siteService.findCompoundById(user, id);
  }

  @Patch('compounds/:id')
  updateCompound(
    @Param('id') id: string,
    @Body() dto: UpdateCompoundDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.siteService.updateCompound(user, id, dto);
  }

  @Delete('compounds/:id')
  deleteCompound(
    @Param('id') id: string,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.siteService.deleteCompound(user, id);
  }

  // ─────────────────────────────────────────────────────────────
  // CELLS
  // ─────────────────────────────────────────────────────────────

  @Post('cells')
  createCell(
    @Body() dto: CreateCellDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.siteService.createCell(user, dto);
  }

  @Get('cells/:id')
  findCellById(@Param('id') id: string, @CurrentUser() user: userType.AppUser) {
    return this.siteService.findCellById(user, id);
  }

  @Patch('cells/:id')
  updateCell(
    @Param('id') id: string,
    @Body() dto: UpdateCellDto,
    @CurrentUser() user: userType.AppUser,
  ) {
    return this.siteService.updateCell(user, id, dto);
  }

  @Delete('cells/:id')
  deleteCell(@Param('id') id: string, @CurrentUser() user: userType.AppUser) {
    return this.siteService.deleteCell(user, id);
  }
}

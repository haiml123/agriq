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

@Controller('organizations')
@UseGuards(JwtAuthGuard)
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

  @Public()
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.organizationService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.organizationService.update(id, dto, userId);
  }

  @Patch(':id/status')
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.organizationService.changeStatus(id, dto, userId);
  }
}

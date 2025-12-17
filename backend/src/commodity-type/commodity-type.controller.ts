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
import { CommodityTypeService } from './commodity-type.service';
import {
  CreateCommodityTypeDto,
  UpdateCommodityTypeDto,
  ListCommodityTypesQueryDto,
  CreateLookupTableDto,
  UpdateLookupTableDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, Public } from '../auth/decorators';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { role_type } from '@prisma/client';

@Controller('commodity-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommodityTypeController {
  constructor(private readonly commodityTypeService: CommodityTypeService) {}

  @Post()
  @Roles(role_type.SUPER_ADMIN)
  create(
    @Body() dto: CreateCommodityTypeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commodityTypeService.create(dto, userId);
  }

  @Public()
  @Get()
  findAll(@Query() query: ListCommodityTypesQueryDto) {
    return this.commodityTypeService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commodityTypeService.findOne(id);
  }

  @Patch(':id')
  @Roles(role_type.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommodityTypeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commodityTypeService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(role_type.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.commodityTypeService.remove(id);
  }

  @Get(':id/lookup-table')
  getLookupTable(@Param('id') id: string) {
    return this.commodityTypeService.getLookupTable(id);
  }

  @Post(':id/lookup-table')
  @Roles(role_type.SUPER_ADMIN)
  createLookupTable(
    @Param('id') id: string,
    @Body() dto: CreateLookupTableDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commodityTypeService.createLookupTable(id, dto, userId);
  }

  @Patch(':id/lookup-table')
  @Roles(role_type.SUPER_ADMIN)
  updateLookupTable(
    @Param('id') id: string,
    @Body() dto: UpdateLookupTableDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commodityTypeService.updateLookupTable(id, dto, userId);
  }

  @Delete(':id/lookup-table')
  @Roles(role_type.SUPER_ADMIN)
  deleteLookupTable(@Param('id') id: string) {
    return this.commodityTypeService.deleteLookupTable(id);
  }
}

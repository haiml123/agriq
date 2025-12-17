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

@Controller('commodity-types')
@UseGuards(JwtAuthGuard)
export class CommodityTypeController {
  constructor(private readonly commodityTypeService: CommodityTypeService) {}

  @Post()
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
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommodityTypeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commodityTypeService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.commodityTypeService.remove(id);
  }

  @Get(':id/lookup-table')
  getLookupTable(@Param('id') id: string) {
    return this.commodityTypeService.getLookupTable(id);
  }

  @Post(':id/lookup-table')
  createLookupTable(
    @Param('id') id: string,
    @Body() dto: CreateLookupTableDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commodityTypeService.createLookupTable(id, dto, userId);
  }

  @Patch(':id/lookup-table')
  updateLookupTable(
    @Param('id') id: string,
    @Body() dto: UpdateLookupTableDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commodityTypeService.updateLookupTable(id, dto, userId);
  }

  @Delete(':id/lookup-table')
  deleteLookupTable(@Param('id') id: string) {
    return this.commodityTypeService.deleteLookupTable(id);
  }
}

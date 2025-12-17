import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LookupTableService } from './lookup-table.service';
import {
  CreateLookupTableDto,
  UpdateLookupTableDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';

@Controller('commodity-types/:commodityTypeId/lookup-table')
@UseGuards(JwtAuthGuard)
export class LookupTableController {
  constructor(private readonly lookupTableService: LookupTableService) {}

  @Post()
  create(
    @Param('commodityTypeId') commodityTypeId: string,
    @Body() dto: CreateLookupTableDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lookupTableService.create(commodityTypeId, dto, userId);
  }

  @Get()
  findOne(@Param('commodityTypeId') commodityTypeId: string) {
    return this.lookupTableService.findByCommodityType(commodityTypeId);
  }

  @Patch()
  update(
    @Param('commodityTypeId') commodityTypeId: string,
    @Body() dto: UpdateLookupTableDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.lookupTableService.update(commodityTypeId, dto, userId);
  }

  @Delete()
  remove(@Param('commodityTypeId') commodityTypeId: string) {
    return this.lookupTableService.remove(commodityTypeId);
  }
}

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
import { CommodityService } from './commodity.service';
import {
  CreateCommodityDto,
  UpdateCommodityDto,
  ListCommoditiesQueryDto,
  CreateTradeDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser, Public } from '../auth/decorators';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { user_role } from '@prisma/client';

@Controller('commodities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommodityController {
  constructor(private readonly commodityService: CommodityService) {}

  @Post()
  @Roles(user_role.SUPER_ADMIN, user_role.ADMIN, user_role.OPERATOR)
  create(@Body() dto: CreateCommodityDto, @CurrentUser('id') userId: string) {
    return this.commodityService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: ListCommoditiesQueryDto) {
    return this.commodityService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commodityService.findOne(id);
  }

  @Patch(':id')
  @Roles(user_role.SUPER_ADMIN, user_role.ADMIN, user_role.OPERATOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommodityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commodityService.update(id, dto, userId);
  }

  @Delete(':id')
  @Roles(user_role.SUPER_ADMIN, user_role.ADMIN)
  remove(@Param('id') id: string) {
    return this.commodityService.remove(id);
  }
}

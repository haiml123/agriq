import { Module } from '@nestjs/common';
import { CommodityTypeController } from './commodity-type.controller';
import { CommodityTypeService } from './commodity-type.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LookupTableService } from './lookup-table.service';
import { LookupTableController } from './lookup-table.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CommodityTypeController, LookupTableController],
  providers: [CommodityTypeService, LookupTableService],
  exports: [CommodityTypeService, LookupTableService],
})
export class CommodityTypeModule {}

import { Module } from '@nestjs/common';
import { CommodityTypeController } from './commodity-type.controller';
import { CommodityTypeService } from './commodity-type.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommodityTypeController],
  providers: [CommodityTypeService],
  exports: [CommodityTypeService],
})
export class CommodityTypeModule {}

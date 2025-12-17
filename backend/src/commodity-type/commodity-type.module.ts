import { Module } from '@nestjs/common';
import { CommodityTypeController } from './commodity-type.controller';
import { CommodityTypeService } from './commodity-type.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [CommodityTypeController],
  providers: [CommodityTypeService, RolesGuard],
  exports: [CommodityTypeService],
})
export class CommodityTypeModule {}

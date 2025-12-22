import { Module } from '@nestjs/common';
import { CommodityController } from './commodity.controller';
import { CommodityService } from './commodity.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [CommodityController],
  providers: [CommodityService, RolesGuard],
  exports: [CommodityService],
})
export class CommodityModule {}

import { Module, forwardRef } from '@nestjs/common';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SiteAccessService } from './site-access.service';
import { WeatherModule } from '../weather';

@Module({
  imports: [PrismaModule, forwardRef(() => WeatherModule)],
  controllers: [SiteController],
  providers: [SiteService, SiteAccessService],
  exports: [SiteService, SiteAccessService],
})
export class SiteModule {}

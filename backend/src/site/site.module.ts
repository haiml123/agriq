import { Module } from '@nestjs/common';
import { SiteController } from './site.controller';
import { SiteService } from './site.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SiteAccessService } from './site-access.service';

@Module({
  imports: [PrismaModule],
  controllers: [SiteController],
  providers: [SiteService, SiteAccessService],
  exports: [SiteService, SiteAccessService],
})
export class SiteModule {}

import { Module } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SiteModule } from '../site/site.module';

@Module({
  imports: [PrismaModule, SiteModule],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}

import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../auth/decorators';
import type { AppUser } from '../types/user.type';
import { WeatherService } from './weather.service';

@Controller('weather')
@UseGuards(JwtAuthGuard)
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('site/:siteId')
  listSiteWeather(
    @Param('siteId') siteId: string,
    @CurrentUser() user: AppUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;
    return this.weatherService.listSiteWeather(user, siteId, parsedStartDate, parsedEndDate);
  }
}

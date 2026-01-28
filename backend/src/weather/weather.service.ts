import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SiteAccessService } from '../site';
import type { AppUser } from '../types/user.type';

const WEATHER_API_URL = 'https://api.weatherapi.com/v1/current.json';
const WEATHER_HISTORY_URL = 'https://api.weatherapi.com/v1/history.json';
const DEFAULT_CACHE_MINUTES = 30;

interface WeatherApiResponse {
  current?: {
    temp_c?: number;
    humidity?: number;
    last_updated_epoch?: number;
  };
  forecast?: {
    forecastday?: Array<{
      date?: string;
      hour?: Array<{
        time_epoch?: number;
        temp_c?: number;
        humidity?: number;
      }>;
    }>;
  };
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SiteAccessService))
    private readonly siteAccess: SiteAccessService,
  ) {}

  async listSiteWeather(
    user: AppUser,
    siteId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    this.logger.debug(
      `listSiteWeather site=${siteId} start=${startDate?.toISOString() ?? 'none'} end=${endDate?.toISOString() ?? 'none'}`,
    );
    await this.siteAccess.validateSiteAccess(user, siteId);

    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, latitude: true, longitude: true },
    });

    if (!site) {
      this.logger.warn(`listSiteWeather: site ${siteId} not found`);
      throw new BadRequestException(`Site with ID "${siteId}" not found`);
    }

    if (site.latitude == null || site.longitude == null) {
      this.logger.warn(`listSiteWeather: site ${siteId} missing lat/lng`);
      throw new BadRequestException('Site is missing latitude/longitude');
    }

    const now = new Date();
    const effectiveStartDate = startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const effectiveEndDate = endDate || now;

    await this.ensureWeatherObservationsForRange(
      siteId,
      site.latitude,
      site.longitude,
      effectiveStartDate,
      effectiveEndDate,
    );

    return this.prisma.weatherObservation.findMany({
      where: {
        siteId,
        recordedAt: {
          gte: effectiveStartDate,
          lte: effectiveEndDate,
        },
      },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async getCurrentObservationForSite(siteId: string, date?: Date) {
    this.logger.debug(
      `getCurrentObservationForSite site=${siteId} date=${date?.toISOString() ?? 'now'}`,
    );
    const site = await this.prisma.site.findUnique({
      where: { id: siteId },
      select: { id: true, latitude: true, longitude: true },
    });

    if (!site || site.latitude == null || site.longitude == null) {
      this.logger.warn(`getCurrentObservationForSite: site ${siteId} missing lat/lng`);
      return null;
    }

    if (!date) {
      const cacheMinutes = Number.parseInt(
        process.env.WEATHER_CACHE_MINUTES || `${DEFAULT_CACHE_MINUTES}`,
        10,
      );
      const cacheMs = cacheMinutes * 60 * 1000;
      const now = new Date();

      const latestObservation = await this.prisma.weatherObservation.findFirst({
        where: { siteId },
        orderBy: { recordedAt: 'desc' },
      });

      if (
        latestObservation &&
        now.getTime() - latestObservation.recordedAt.getTime() < cacheMs
      ) {
        return {
          temperature: latestObservation.temperature,
          humidity: latestObservation.humidity,
          recordedAt: latestObservation.recordedAt,
        };
      }
    }

    const current = await this.fetchCurrentWeather(
      site.latitude,
      site.longitude,
      date,
    );
    if (!current) {
      this.logger.warn(`getCurrentObservationForSite: no weather data for site ${siteId}`);
      return null;
    }

    const recordedAt = current.recordedAt || new Date();

    await this.prisma.weatherObservation.upsert({
      where: {
        siteId_recordedAt: {
          siteId,
          recordedAt,
        },
      },
      update: {
        temperature: current.temperature,
        humidity: current.humidity,
      },
      create: {
        siteId,
        temperature: current.temperature,
        humidity: current.humidity,
        recordedAt,
      },
    });

    return {
      temperature: current.temperature,
      humidity: current.humidity,
      recordedAt,
    };
  }

  async ensureWeatherObservationsForRange(
    siteId: string,
    latitude: number,
    longitude: number,
    startDate: Date,
    endDate: Date,
  ) {
    if (!latitude || !longitude) {
      return;
    }

    const msInDay = 24 * 60 * 60 * 1000;
    const totalDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / msInDay),
    );
    let stepDays = 1;
    if (totalDays > 180) stepDays = 30;
    else if (totalDays > 60) stepDays = 7;
    else if (totalDays > 14) stepDays = 3;

    const existing = await this.prisma.weatherObservation.findMany({
      where: {
        siteId,
        recordedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { recordedAt: true },
    });
    const existingDays = new Set(
      existing.map((obs) => obs.recordedAt.toISOString().slice(0, 10)),
    );

    const cursor = new Date(startDate);
    cursor.setHours(12, 0, 0, 0);
    const dates: Date[] = [];
    while (cursor <= endDate) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + stepDays);
    }

    for (const date of dates) {
      const dayKey = date.toISOString().slice(0, 10);
      if (existingDays.has(dayKey)) continue;
      const current = await this.fetchCurrentWeather(latitude, longitude, date);
      if (!current) continue;
      const recordedAt = current.recordedAt || date;
      try {
        await this.prisma.weatherObservation.upsert({
          where: {
            siteId_recordedAt: {
              siteId,
              recordedAt,
            },
          },
          update: {
            temperature: current.temperature,
            humidity: current.humidity,
          },
          create: {
            siteId,
            temperature: current.temperature,
            humidity: current.humidity,
            recordedAt,
          },
        });
      } catch (error) {
        this.logger.warn(
          `ensureWeatherObservationsForRange: failed to store weather for site ${siteId}: ${error}`,
        );
      }
    }

    await this.refreshCurrentWeatherIfNeeded(siteId, latitude, longitude, endDate);
  }

  private async refreshCurrentWeatherIfNeeded(
    siteId: string,
    latitude: number,
    longitude: number,
    effectiveEndDate: Date,
  ) {
    const cacheMinutes = Number.parseInt(
      process.env.WEATHER_CACHE_MINUTES || `${DEFAULT_CACHE_MINUTES}`,
      10,
    );
    const cacheMs = cacheMinutes * 60 * 1000;
    const now = new Date();

    if (effectiveEndDate.getTime() < now.getTime() - cacheMs) {
      this.logger.debug(
        `refreshCurrentWeatherIfNeeded: skip (endDate outside cache) site=${siteId}`,
      );
      return;
    }

    const latestObservation = await this.prisma.weatherObservation.findFirst({
      where: { siteId },
      orderBy: { recordedAt: 'desc' },
    });

    if (latestObservation && now.getTime() - latestObservation.recordedAt.getTime() < cacheMs) {
      this.logger.debug(
        `refreshCurrentWeatherIfNeeded: cache hit site=${siteId}`,
      );
      return;
    }

    const current = await this.fetchCurrentWeather(latitude, longitude);
    if (!current) {
      this.logger.warn(`refreshCurrentWeatherIfNeeded: no weather data site=${siteId}`);
      return;
    }

    const recordedAt = current.recordedAt || now;

    try {
      await this.prisma.weatherObservation.upsert({
        where: {
          siteId_recordedAt: {
            siteId,
            recordedAt,
          },
        },
        update: {
          temperature: current.temperature,
          humidity: current.humidity,
        },
        create: {
          siteId,
          temperature: current.temperature,
          humidity: current.humidity,
          recordedAt,
        },
      });
    } catch (error) {
      this.logger.warn(`Failed to store weather observation for site ${siteId}: ${error}`);
    }
  }

  private extractNearestHistoryPoint(
    response: WeatherApiResponse,
    target: Date,
  ) {
    const hours = response.forecast?.forecastday?.[0]?.hour;
    if (!hours || hours.length === 0) {
      return null;
    }

    const targetEpoch = Math.floor(target.getTime() / 1000);
    let closest = hours[0];
    let closestDelta = Math.abs((closest.time_epoch || 0) - targetEpoch);

    for (const hour of hours) {
      if (hour.time_epoch == null) continue;
      const delta = Math.abs(hour.time_epoch - targetEpoch);
      if (delta < closestDelta) {
        closest = hour;
        closestDelta = delta;
      }
    }

    if (closest.temp_c == null || closest.humidity == null || closest.time_epoch == null) {
      return null;
    }

    return {
      temperature: closest.temp_c,
      humidity: closest.humidity,
      recordedAt: new Date(closest.time_epoch * 1000),
    };
  }

  private async fetchCurrentWeather(
    latitude: number,
    longitude: number,
    date?: Date,
  ) {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      this.logger.warn('WEATHER_API_KEY is not set. Skipping weather fetch.');
      return null;
    }

    const url = new URL(date ? WEATHER_HISTORY_URL : WEATHER_API_URL);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('q', `${latitude},${longitude}`);
    url.searchParams.set('aqi', 'no');
    if (date) {
      url.searchParams.set('dt', date.toISOString().slice(0, 10));
    }
    const safeUrl = new URL(url.toString());
    safeUrl.searchParams.set('key', 'REDACTED');
    this.logger.debug(`fetchCurrentWeather url=${safeUrl.toString()}`);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url.toString(), {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        this.logger.warn(
          `Weather API responded with status ${response.status}`,
        );
        return null;
      }

      const data = (await response.json()) as WeatherApiResponse;

      if (date) {
        const historyPoint = this.extractNearestHistoryPoint(data, date);
        if (!historyPoint) {
          this.logger.warn('Weather history response missing hourly data');
          return null;
        }
        return historyPoint;
      }

      const temperature = data.current?.temp_c;
      const humidity = data.current?.humidity;
      if (typeof temperature !== 'number' || typeof humidity !== 'number') {
        this.logger.warn('Weather API response missing temperature/humidity');
        return null;
      }

      const recordedAt = data.current?.last_updated_epoch
        ? new Date(data.current.last_updated_epoch * 1000)
        : undefined;

      return {
        temperature,
        humidity,
        recordedAt,
      };
    } catch (error) {
      this.logger.warn(`Failed to fetch weather data: ${error}`);
      return null;
    }
  }
}

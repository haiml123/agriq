import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationModule } from './organization';
import { UserModule } from './user/user.module';
import { TriggerModule } from './trigger';
import { CommodityTypeModule } from './commodity-type';
import { CommodityModule } from './commodity';
import { SiteModule } from './site';
import { AlertModule } from './alert';
import { TradeModule } from './trade';
import { GatewayModule } from './gateway';
import { WeatherModule } from './weather';
import { TranslationModule } from './translation';

@Module({
  imports: [
    AuthModule,
    EmailModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    OrganizationModule,
    UserModule,
    SiteModule,
    GatewayModule,
    WeatherModule,
    TriggerModule,
    CommodityTypeModule,
    CommodityModule,
    AlertModule,
    TradeModule,
    TranslationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

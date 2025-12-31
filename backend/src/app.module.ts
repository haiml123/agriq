import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InvitesModule } from './invites/invites.module';
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
import { EventsModule } from './events';
import { AlertModule } from './alert';
import { TradeModule } from './trade';
import { GatewayModule } from './gateway';

@Module({
  imports: [
    AuthModule,
    InvitesModule,
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
    TriggerModule,
    CommodityTypeModule,
    CommodityModule,
    EventsModule,
    AlertModule,
    TradeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

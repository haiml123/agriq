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
import { SiteModule } from './site';

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
    TriggerModule,
    CommodityTypeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

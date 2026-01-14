import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SiteModule } from '../site';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { GatewaySimulatorController } from './gateway-simulator.controller';
import { GatewaySimulatorService } from './gateway-simulator.service';
import { SensorService } from '../sensor/sensor.service';
import { TriggerModule } from '../trigger';

@Module({
  imports: [PrismaModule, SiteModule, TriggerModule],
  controllers: [GatewayController, GatewaySimulatorController],
  providers: [GatewayService, SensorService, GatewaySimulatorService],
})
export class GatewayModule {}

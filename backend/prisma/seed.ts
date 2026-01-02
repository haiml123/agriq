import {
  alert_severity,
  alert_status,
  entity_status,
  PrismaClient,
  role_type,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

type LookupSeedTable = {
  id: string;
  /** Full lookup table name, e.g. "Soybeans EMC ~ 11-12%" */
  name: string;
  /** Commodity name for CommodityType, e.g. "Soybeans" */
  commodityName: string;
  data: {
    /** Celsius values, e.g. [0, 10, 20, 30, 40, 50, 60] */
    tempRanges: number[];
    humidityRanges: number[];
    values: Array<Array<number | null>>;
  };
};

async function seedSuperAdmin() {
  const hashedPassword = await bcrypt.hash('1234', 10);

  await prisma.user.upsert({
    where: { email: 'levihai49@gmail.com' },
    update: {},
    create: {
      email: 'levihai49@gmail.com',
      password: hashedPassword,
      name: 'Hai',
      userRole: role_type.SUPER_ADMIN,
    },
  });

  console.log('[seed] Super admin upserted');
}

async function seedCommodityTypesAndLookupTables() {
  // Put the JSON file next to this seed file: prisma/emc_tables_lookup.final.json
  const jsonPath = join(__dirname, 'emc_tables_lookup.json');

  if (!existsSync(jsonPath)) {
    console.warn(
      `[seed] Missing ${jsonPath} - skipping commodity/lookup table seeding.`,
    );
    return;
  }

  const tables = JSON.parse(
    readFileSync(jsonPath, 'utf-8'),
  ) as LookupSeedTable[];

  for (const t of tables) {
    // 1) CommodityType (unique by name)
    const commodityType = await prisma.commodityType.upsert({
      where: { name: t.commodityName },
      update: { status: entity_status.ACTIVE },
      create: {
        name: t.commodityName,
        description: 'Commodity type for storage/EMC lookup tables',
        status: entity_status.ACTIVE,
      },
    });

    // 2) LookupTable (unique by commodityTypeId)
    await prisma.lookupTable.upsert({
      where: { commodityTypeId: commodityType.id },
      update: {
        name: t.name,
        description: 'Seeded EMC lookup table (tempRanges x humidityRanges).',
        data: t.data as any,
      },
      create: {
        name: t.name,
        description: 'Seeded EMC lookup table (tempRanges x humidityRanges).',
        commodityTypeId: commodityType.id,
        data: t.data as any,
      },
    });

    console.log(
      `[seed] Upserted lookup for commodityType="${commodityType.name}" (${t.name})`,
    );
  }
}

async function seedDemoData() {
  console.log('[seed] Starting demo data seeding...');

  // Clear existing demo data to prevent duplicates
  console.log('[seed] Cleaning up existing demo data...');
  await prisma.alert.deleteMany({ where: { organizationId: 'demo-org-1' } });
  await prisma.trade.deleteMany({ where: { siteId: { in: ['site-1', 'site-2', 'site-3'] } } });
  await prisma.sensorReading.deleteMany({});
  await prisma.gatewayReading.deleteMany({});
  await prisma.sensor.deleteMany({ where: { gatewayId: { in: ['gateway-1', 'gateway-2', 'gateway-3', 'gateway-4', 'gateway-5'] } } });
  await prisma.gateway.deleteMany({ where: { cellId: { in: ['cell-1', 'cell-2', 'cell-3', 'cell-4', 'cell-5'] } } });
  await prisma.cell.deleteMany({ where: { compoundId: { in: ['compound-1', 'compound-2', 'compound-3', 'compound-4'] } } });
  await prisma.compound.deleteMany({ where: { siteId: { in: ['site-1', 'site-2', 'site-3'] } } });
  await prisma.siteUser.deleteMany({ where: { siteId: { in: ['site-1', 'site-2', 'site-3'] } } });
  await prisma.site.deleteMany({ where: { organizationId: 'demo-org-1' } });
  await prisma.commodity.deleteMany({ where: { organizationId: 'demo-org-1' } });
  console.log('[seed] Cleanup completed');

  const now = new Date();

  // Get the super admin user
  const superAdmin = await prisma.user.findUnique({
    where: { email: 'levihai49@gmail.com' },
  });
  if (!superAdmin) {
    console.warn('[seed] Super admin not found, skipping demo data');
    return;
  }

  // 1. Create Demo Organization
  const demoOrg = await prisma.organization.upsert({
    where: { id: 'demo-org-1' },
    update: {},
    create: {
      id: 'demo-org-1',
      name: 'Demo Grain Storage Co.',
      status: entity_status.ACTIVE,
      createdBy: superAdmin.id,
    },
  });
  console.log('[seed] Created demo organization');

  // 2. Create Sites
  const sites = await Promise.all([
    prisma.site.upsert({
      where: { id: 'site-1' },
      update: {},
      create: {
        id: 'site-1',
        name: 'Great Plains Storage Center',
        organizationId: demoOrg.id,
        address: 'Kansas, USA',
        latitude: 38.5,
        longitude: -98.0,
        createdBy: superAdmin.id,
      },
    }),
    prisma.site.upsert({
      where: { id: 'site-2' },
      update: {},
      create: {
        id: 'site-2',
        name: 'Northern Plains Center',
        organizationId: demoOrg.id,
        address: 'North Dakota, USA',
        latitude: 47.5,
        longitude: -100.5,
        createdBy: superAdmin.id,
      },
    }),
    prisma.site.upsert({
      where: { id: 'site-3' },
      update: {},
      create: {
        id: 'site-3',
        name: 'Midwest Storage',
        organizationId: demoOrg.id,
        address: 'Nebraska, USA',
        latitude: 41.5,
        longitude: -99.0,
        createdBy: superAdmin.id,
      },
    }),
  ]);
  console.log('[seed] Created demo sites');

  // 3. Create Compounds
  const compounds = await Promise.all([
    prisma.compound.upsert({
      where: { id: 'compound-1' },
      update: {},
      create: {
        id: 'compound-1',
        name: 'Prairie Storage',
        status: entity_status.ACTIVE,
        siteId: sites[0].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.compound.upsert({
      where: { id: 'compound-2' },
      update: {},
      create: {
        id: 'compound-2',
        name: 'Western Complex',
        status: entity_status.ACTIVE,
        siteId: sites[0].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.compound.upsert({
      where: { id: 'compound-3' },
      update: {},
      create: {
        id: 'compound-3',
        name: 'Eastern Wing',
        status: entity_status.ACTIVE,
        siteId: sites[1].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.compound.upsert({
      where: { id: 'compound-4' },
      update: {},
      create: {
        id: 'compound-4',
        name: 'Southern Wing',
        status: entity_status.ACTIVE,
        siteId: sites[2].id,
        createdBy: superAdmin.id,
      },
    }),
  ]);
  console.log('[seed] Created demo compounds');

  // 4. Create Cells
  const cells = await Promise.all([
    prisma.cell.upsert({
      where: { id: 'cell-1' },
      update: {},
      create: {
        id: 'cell-1',
        name: 'Cell 14',
        status: entity_status.ACTIVE,
        height: 12,
        length: 30,
        width: 20,
        compoundId: compounds[0].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.cell.upsert({
      where: { id: 'cell-2' },
      update: {},
      create: {
        id: 'cell-2',
        name: 'Cell 13',
        status: entity_status.ACTIVE,
        height: 11,
        length: 28,
        width: 18,
        compoundId: compounds[1].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.cell.upsert({
      where: { id: 'cell-3' },
      update: {},
      create: {
        id: 'cell-3',
        name: 'Cell 8',
        status: entity_status.ACTIVE,
        height: 10,
        length: 26,
        width: 16,
        compoundId: compounds[2].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.cell.upsert({
      where: { id: 'cell-4' },
      update: {},
      create: {
        id: 'cell-4',
        name: 'Cell 3',
        status: entity_status.ACTIVE,
        height: 9,
        length: 24,
        width: 15,
        compoundId: compounds[3].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.cell.upsert({
      where: { id: 'cell-5' },
      update: {},
      create: {
        id: 'cell-5',
        name: 'Cell 1',
        status: entity_status.ACTIVE,
        height: 8,
        length: 22,
        width: 14,
        compoundId: compounds[0].id,
        createdBy: superAdmin.id,
      },
    }),
  ]);
  console.log('[seed] Created demo cells');

  const compoundSiteMap = new Map(compounds.map((compound) => [compound.id, compound.siteId]));

  // 5. Create Gateways (one per cell)
  const gateways = await Promise.all([
    prisma.gateway.upsert({
      where: { id: 'gateway-1' },
      update: {},
      create: {
        id: 'gateway-1',
        externalId: 'GATEWAY-CELL14-01',
        name: 'Gateway - Cell 14',
        status: entity_status.ACTIVE,
        cellId: cells[0].id,
        organizationId: demoOrg.id,
        siteId: compoundSiteMap.get(cells[0].compoundId) || null,
        createdBy: superAdmin.id,
      },
    }),
    prisma.gateway.upsert({
      where: { id: 'gateway-2' },
      update: {},
      create: {
        id: 'gateway-2',
        externalId: 'GATEWAY-CELL13-01',
        name: 'Gateway - Cell 13',
        status: entity_status.ACTIVE,
        cellId: cells[1].id,
        organizationId: demoOrg.id,
        siteId: compoundSiteMap.get(cells[1].compoundId) || null,
        createdBy: superAdmin.id,
      },
    }),
    prisma.gateway.upsert({
      where: { id: 'gateway-3' },
      update: {},
      create: {
        id: 'gateway-3',
        externalId: 'GATEWAY-CELL8-01',
        name: 'Gateway - Cell 8',
        status: entity_status.ACTIVE,
        cellId: cells[2].id,
        organizationId: demoOrg.id,
        siteId: compoundSiteMap.get(cells[2].compoundId) || null,
        createdBy: superAdmin.id,
      },
    }),
    prisma.gateway.upsert({
      where: { id: 'gateway-4' },
      update: {},
      create: {
        id: 'gateway-4',
        externalId: 'GATEWAY-CELL3-01',
        name: 'Gateway - Cell 3',
        status: entity_status.ACTIVE,
        cellId: cells[3].id,
        organizationId: demoOrg.id,
        siteId: compoundSiteMap.get(cells[3].compoundId) || null,
        createdBy: superAdmin.id,
      },
    }),
    prisma.gateway.upsert({
      where: { id: 'gateway-5' },
      update: {},
      create: {
        id: 'gateway-5',
        externalId: 'GATEWAY-CELL1-01',
        name: 'Gateway - Cell 1',
        status: entity_status.ACTIVE,
        cellId: cells[4].id,
        organizationId: demoOrg.id,
        siteId: compoundSiteMap.get(cells[4].compoundId) || null,
        createdBy: superAdmin.id,
      },
    }),
  ]);
  console.log('[seed] Created demo gateways');

  // 6. Create Sensors (one per gateway)
  const sensors = await Promise.all([
    prisma.sensor.upsert({
      where: { id: 'sensor-1' },
      update: {},
      create: {
        id: 'sensor-1',
        externalId: 'SENSOR-CELL14-01',
        name: 'Temperature & Humidity Sensor - Cell 14',
        status: entity_status.ACTIVE,
        gatewayId: gateways[0].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.sensor.upsert({
      where: { id: 'sensor-2' },
      update: {},
      create: {
        id: 'sensor-2',
        externalId: 'SENSOR-CELL13-01',
        name: 'Temperature & Humidity Sensor - Cell 13',
        status: entity_status.ACTIVE,
        gatewayId: gateways[1].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.sensor.upsert({
      where: { id: 'sensor-3' },
      update: {},
      create: {
        id: 'sensor-3',
        externalId: 'SENSOR-CELL8-01',
        name: 'Temperature & Humidity Sensor - Cell 8',
        status: entity_status.ACTIVE,
        gatewayId: gateways[2].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.sensor.upsert({
      where: { id: 'sensor-4' },
      update: {},
      create: {
        id: 'sensor-4',
        externalId: 'SENSOR-CELL3-01',
        name: 'Temperature & Humidity Sensor - Cell 3',
        status: entity_status.ACTIVE,
        gatewayId: gateways[3].id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.sensor.upsert({
      where: { id: 'sensor-5' },
      update: {},
      create: {
        id: 'sensor-5',
        externalId: 'SENSOR-CELL1-01',
        name: 'Temperature & Humidity Sensor - Cell 1',
        status: entity_status.ACTIVE,
        gatewayId: gateways[4].id,
        createdBy: superAdmin.id,
      },
    }),
  ]);
  console.log('[seed] Created demo sensors');

  // 7. Create Gateway Readings (recent temperature, humidity, battery data)
  const gatewayReadingsData = gateways.flatMap((gateway, idx) => {
    const cellId = gateway.cellId;
    if (!cellId) {
      return [];
    }
    const baseTemp = 18 + idx;
    const baseHumidity = 10 + idx;
    const baseBattery = 95 - idx;
    return Array.from({ length: 7 }, (_, dayIdx) => {
      const recordedAt = new Date(now);
      recordedAt.setDate(recordedAt.getDate() - dayIdx);
      return {
        gatewayId: gateway.id,
        cellId,
        temperature: baseTemp + (dayIdx % 2 === 0 ? 1 : -1),
        humidity: baseHumidity + (dayIdx % 2 === 0 ? 0.5 : -0.5),
        batteryPercent: baseBattery - dayIdx,
        recordedAt,
      };
    });
  });

  await prisma.gatewayReading.createMany({ data: gatewayReadingsData });
  console.log('[seed] Created demo gateway readings (last 7 days)');

  // 8. Create Sensor Readings (temperature, humidity, battery data for the last year)
  const daysToGenerate = 365; // Generate data for 1 year
  const batchSize = 50; // Process readings in batches

  // Generate readings for each sensor
  for (let sensorIdx = 0; sensorIdx < sensors.length; sensorIdx++) {
    const sensor = sensors[sensorIdx];
    const cell = cells[sensorIdx];

    // Base temperature and humidity for this sensor
    const baseTemp = 20 + Math.random() * 10; // Random between 20-30°C
    const baseHumidity = 8 + Math.random() * 6; // Random between 8-14%

    // Process in batches to avoid connection pool exhaustion
    for (let batchStart = 0; batchStart < daysToGenerate; batchStart += batchSize) {
      const batch: any[] = [];
      const batchEnd = Math.min(batchStart + batchSize, daysToGenerate);

      for (let day = batchStart; day < batchEnd; day++) {
        const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);

        // Add some variation to make the chart interesting
        // Create seasonal patterns over the year
        const seasonalTemp = Math.sin((day / 365) * Math.PI * 2) * 5;
        const tempVariation = seasonalTemp + (Math.random() - 0.5) * 2;
        const humidityVariation = Math.sin((day / 365) * Math.PI * 2) * 2 + (Math.random() - 0.5) * 1;
        const batteryVariation = (Math.random() - 0.5) * 0.6;

        // Daily reading with temperature, humidity, and battery
        batch.push(
          prisma.sensorReading.upsert({
            where: { id: `reading-${sensorIdx}-${day}` },
            update: {},
            create: {
              id: `reading-${sensorIdx}-${day}`,
              sensorId: sensor.id,
              gatewayId: sensor.gatewayId,
              cellId: cell.id,
              temperature: parseFloat((baseTemp + tempVariation).toFixed(2)),
              humidity: parseFloat((baseHumidity + humidityVariation).toFixed(2)),
              batteryPercent: Math.min(
                100,
                Math.max(60, parseFloat((95 - day * 0.05 + batteryVariation).toFixed(2))),
              ),
              recordedAt: date,
            },
          })
        );
      }

      await Promise.all(batch);
      console.log(`[seed] Processed sensor ${sensorIdx + 1}/${sensors.length}, days ${batchStart}-${batchEnd}/${daysToGenerate}`);
    }
  }

  console.log('[seed] Created demo sensor readings (temperature, humidity, battery for 1 year)');

  // 7. Get or create commodity types
  const soyType = await prisma.commodityType.findFirst({
    where: { name: { contains: 'Soy', mode: 'insensitive' } },
  });
  const cornType = await prisma.commodityType.findFirst({
    where: { name: { contains: 'Corn', mode: 'insensitive' } },
  });
  const wheatType = await prisma.commodityType.findFirst({
    where: { name: { contains: 'Wheat', mode: 'insensitive' } },
  });

  // Create fallback types if not found
  const soyTypeId =
    soyType?.id ||
    (
      await prisma.commodityType.create({
        data: {
          name: 'Soybeans',
          description: 'Soybean commodity',
          status: entity_status.ACTIVE,
          createdBy: superAdmin.id,
        },
      })
    ).id;

  const cornTypeId =
    cornType?.id ||
    (
      await prisma.commodityType.create({
        data: {
          name: 'Corn',
          description: 'Corn commodity',
          status: entity_status.ACTIVE,
          createdBy: superAdmin.id,
        },
      })
    ).id;

  const wheatTypeId =
    wheatType?.id ||
    (
      await prisma.commodityType.create({
        data: {
          name: 'Wheat',
          description: 'Wheat commodity',
          status: entity_status.ACTIVE,
          createdBy: superAdmin.id,
        },
      })
    ).id;

  // 8. Create Commodities (using commodity type names only, differentiated by origin)
  const commodities = await Promise.all([
    prisma.commodity.upsert({
      where: { id: 'commodity-1' },
      update: {},
      create: {
        id: 'commodity-1',
        name: '', // Empty - will use commodity type name
        origin: 'Missouri, USA',
        commodityTypeId: soyTypeId,
        organizationId: demoOrg.id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.commodity.upsert({
      where: { id: 'commodity-2' },
      update: {},
      create: {
        id: 'commodity-2',
        name: '', // Empty - will use commodity type name
        origin: 'North Dakota, USA',
        commodityTypeId: soyTypeId,
        organizationId: demoOrg.id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.commodity.upsert({
      where: { id: 'commodity-3' },
      update: {},
      create: {
        id: 'commodity-3',
        name: '', // Empty - will use commodity type name
        origin: 'Kansas, USA',
        commodityTypeId: cornTypeId,
        organizationId: demoOrg.id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.commodity.upsert({
      where: { id: 'commodity-4' },
      update: {},
      create: {
        id: 'commodity-4',
        name: '', // Empty - will use commodity type name
        origin: 'Nebraska, USA',
        commodityTypeId: cornTypeId,
        organizationId: demoOrg.id,
        createdBy: superAdmin.id,
      },
    }),
    prisma.commodity.upsert({
      where: { id: 'commodity-5' },
      update: {},
      create: {
        id: 'commodity-5',
        name: '', // Empty - will use commodity type name
        origin: 'Montana, USA',
        commodityTypeId: wheatTypeId,
        organizationId: demoOrg.id,
        createdBy: superAdmin.id,
      },
    }),
  ]);
  console.log('[seed] Created demo commodities (using commodity type names)');

  // 9. Create Trades (with 3 different commodities spread over a year for Cell 14)
  await Promise.all([
    // Cell 14 (cell-1) - 3 different commodities over the year
    prisma.trade.upsert({
      where: { id: 'trade-1' },
      update: {},
      create: {
        id: 'trade-1',
        commodityId: commodities[4].id, // Durum Wheat
        siteId: sites[0].id,
        compoundId: compounds[0].id,
        cellId: cells[0].id, // Cell 14
        amountKg: 1500,
        tradedAt: new Date(now.getTime() - 350 * 24 * 60 * 60 * 1000), // ~12 months ago
        notes: 'Initial wheat delivery for winter storage',
        createdBy: superAdmin.id,
      },
    }),
    prisma.trade.upsert({
      where: { id: 'trade-1b' },
      update: {},
      create: {
        id: 'trade-1b',
        commodityId: commodities[2].id, // Yellow Corn
        siteId: sites[0].id,
        compoundId: compounds[0].id,
        cellId: cells[0].id, // Cell 14
        amountKg: 2200,
        tradedAt: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // ~6 months ago
        notes: 'Spring corn harvest',
        createdBy: superAdmin.id,
      },
    }),
    prisma.trade.upsert({
      where: { id: 'trade-1c' },
      update: {},
      create: {
        id: 'trade-1c',
        commodityId: commodities[0].id, // Non-GMO Soy
        siteId: sites[0].id,
        compoundId: compounds[0].id,
        cellId: cells[0].id, // Cell 14
        amountKg: 1800,
        tradedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // ~1 month ago
        notes: 'Recent soybean delivery',
        createdBy: superAdmin.id,
      },
    }),
    // Other cells - regular trades
    prisma.trade.upsert({
      where: { id: 'trade-2' },
      update: {},
      create: {
        id: 'trade-2',
        commodityId: commodities[1].id,
        siteId: sites[1].id,
        compoundId: compounds[2].id,
        cellId: cells[2].id,
        amountKg: 1600,
        tradedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        notes: 'Weekly shipment',
        createdBy: superAdmin.id,
      },
    }),
    prisma.trade.upsert({
      where: { id: 'trade-3' },
      update: {},
      create: {
        id: 'trade-3',
        commodityId: commodities[2].id,
        siteId: sites[0].id,
        compoundId: compounds[1].id,
        cellId: cells[1].id,
        amountKg: 2900,
        tradedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        notes: 'Large delivery',
        createdBy: superAdmin.id,
      },
    }),
    prisma.trade.upsert({
      where: { id: 'trade-4' },
      update: {},
      create: {
        id: 'trade-4',
        commodityId: commodities[3].id,
        siteId: sites[2].id,
        compoundId: compounds[3].id,
        cellId: cells[3].id,
        amountKg: 1900,
        tradedAt: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        notes: 'Regular stock',
        createdBy: superAdmin.id,
      },
    }),
    prisma.trade.upsert({
      where: { id: 'trade-5' },
      update: {},
      create: {
        id: 'trade-5',
        commodityId: commodities[4].id,
        siteId: sites[0].id,
        compoundId: compounds[0].id,
        cellId: cells[4].id,
        amountKg: 1800,
        tradedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        notes: 'Premium grade',
        createdBy: superAdmin.id,
      },
    }),
  ]);
  console.log('[seed] Created demo trades with 3 commodities over a year for Cell 14');

  // 10. Create Alerts
  await Promise.all([
    prisma.alert.upsert({
      where: { id: 'alert-1' },
      update: {},
      create: {
        id: 'alert-1',
        siteId: sites[0].id,
        compoundId: compounds[0].id,
        cellId: cells[4].id,
        commodityId: commodities[0].id,
        organizationId: demoOrg.id,
        title: 'Temperature Alert',
        description: 'Temperature raised 5° in 2 days to 32°',
        severity: alert_severity.LOW,
        status: alert_status.OPEN,
        startedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    }),
    prisma.alert.upsert({
      where: { id: 'alert-2' },
      update: {},
      create: {
        id: 'alert-2',
        siteId: sites[0].id,
        compoundId: compounds[1].id,
        cellId: cells[1].id,
        commodityId: commodities[2].id,
        organizationId: demoOrg.id,
        userId: superAdmin.id,
        title: 'Humidity Alert',
        description: 'Humidity raised 3% in 5 days',
        severity: alert_severity.HIGH,
        status: alert_status.ACKNOWLEDGED,
        startedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
    }),
    prisma.alert.upsert({
      where: { id: 'alert-3' },
      update: {},
      create: {
        id: 'alert-3',
        siteId: sites[2].id,
        compoundId: compounds[3].id,
        cellId: cells[3].id,
        commodityId: commodities[3].id,
        organizationId: demoOrg.id,
        userId: superAdmin.id,
        title: 'Critical Humidity',
        description: '13% Humidity - below safe threshold',
        severity: alert_severity.HIGH,
        status: alert_status.IN_PROGRESS,
        startedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    }),
  ]);
  console.log('[seed] Created demo alerts');

  console.log('[seed] Demo data seeding completed!');
}

async function main() {
  await prisma.lookupTable.deleteMany({});
  await prisma.commodityType.deleteMany({});
  await seedSuperAdmin();
  await seedCommodityTypesAndLookupTables();
  await seedDemoData();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

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
        capacity: 5000,
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
        capacity: 4500,
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
        capacity: 4000,
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
        capacity: 3500,
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
        capacity: 3000,
        compoundId: compounds[0].id,
        createdBy: superAdmin.id,
      },
    }),
  ]);
  console.log('[seed] Created demo cells');

  // 5. Get or create commodity types
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

  // 6. Create Commodities
  const commodities = await Promise.all([
    prisma.commodity.upsert({
      where: { id: 'commodity-1' },
      update: {},
      create: {
        id: 'commodity-1',
        name: 'Non-GMO Soy',
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
        name: 'Soy #1',
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
        name: 'Yellow Corn #1',
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
        name: 'Sorghum',
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
        name: 'Durum Wheat',
        origin: 'Montana, USA',
        commodityTypeId: wheatTypeId,
        organizationId: demoOrg.id,
        createdBy: superAdmin.id,
      },
    }),
  ]);
  console.log('[seed] Created demo commodities');

  // 7. Create Trades (recent goods)
  const now = new Date();
  await Promise.all([
    prisma.trade.upsert({
      where: { id: 'trade-1' },
      update: {},
      create: {
        id: 'trade-1',
        commodityId: commodities[0].id,
        siteId: sites[0].id,
        compoundId: compounds[0].id,
        cellId: cells[0].id,
        amountKg: 1700,
        tradedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        notes: 'Initial delivery',
        createdBy: superAdmin.id,
      },
    }),
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
  console.log('[seed] Created demo trades');

  // 8. Create Alerts
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

import { entity_status, PrismaClient, role_type } from '@prisma/client';
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

async function main() {
  await prisma.lookupTable.deleteMany({});
  await prisma.commodityType.deleteMany({});
  await seedSuperAdmin();
  await seedCommodityTypesAndLookupTables();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding…');

  //
  // USERS
  //
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      phone: null,
      language_preference: 'en',
      user_role: 'SUPER_ADMIN',
    },
  });

  //
  // ORG 1
  //
  const org1 = await prisma.organization.create({
    data: {
      name: 'Green Farms LTD',
      created_by: superAdmin.id, // just storing the user id as string
    },
  });

  const org1Admin = await prisma.user.create({
    data: {
      name: 'Adam Green',
      email: 'adam@greenfarms.com',
      phone: '+1-555-1000',
      language_preference: 'en',
      organization_id: org1.id,
      user_role: 'ADMIN',
    },
  });

  const org1SiteA = await prisma.site.create({
    data: {
      name: 'North Storage Facility',
      organization_id: org1.id,
      created_by: org1Admin.id,
    },
  });

  const org1SiteB = await prisma.site.create({
    data: {
      name: 'South Grain Depot',
      organization_id: org1.id,
      created_by: org1Admin.id,
    },
  });

  const org1CompoundA = await prisma.compound.create({
    data: {
      name: 'Compound A',
      site_id: org1SiteA.id,
      created_by: org1Admin.id,
    },
  });

  const org1CellA = await prisma.cell.create({
    data: {
      name: 'Cell 1A',
      compound_id: org1CompoundA.id,
      created_by: org1Admin.id,
    },
  });

  //
  // ORG 2
  //
  const org2 = await prisma.organization.create({
    data: {
      name: 'Desert Storage Corp',
      created_by: superAdmin.id,
    },
  });

  const org2Admin = await prisma.user.create({
    data: {
      name: 'Sarah Stone',
      email: 'sarah@desertcorp.com',
      phone: '+1-555-2000',
      language_preference: 'en',
      organization_id: org2.id,
      user_role: 'ADMIN',
    },
  });

  const org2SiteA = await prisma.site.create({
    data: {
      name: 'Main Desert Hub',
      organization_id: org2.id,
      created_by: org2Admin.id,
    },
  });

  const org2CompoundA = await prisma.compound.create({
    data: {
      name: 'East Compound',
      site_id: org2SiteA.id,
      created_by: org2Admin.id,
    },
  });

  const org2CellA = await prisma.cell.create({
    data: {
      name: 'Cell D1',
      compound_id: org2CompoundA.id,
      created_by: org2Admin.id,
    },
  });

  //
  // ROLES (optional but nice)
  //
  const [superRole, orgAdminRole, siteManagerRole] = await Promise.all([
    prisma.role.create({ data: { name: 'SUPER_ADMIN' } }),
    prisma.role.create({ data: { name: 'ADMIN' } }),
    prisma.role.create({ data: { name: 'SITE_MANAGER' } }),
  ]);

  await prisma.user_role.createMany({
    data: [
      {
        user_id: superAdmin.id,
        role_id: superRole.id,
        organization_id: null,
        site_id: null,
        granted_by_user_id: superAdmin.id,
      },
      {
        user_id: org1Admin.id,
        role_id: orgAdminRole.id,
        organization_id: org1.id,
        site_id: null,
        granted_by_user_id: superAdmin.id,
      },
      {
        user_id: org2Admin.id,
        role_id: orgAdminRole.id,
        organization_id: org2.id,
        site_id: null,
        granted_by_user_id: superAdmin.id,
      },
    ],
  });

  //
  // COMMODITIES
  //
  const wheat = await prisma.commodity.create({
    data: {
      name: 'Wheat',
      origin: 'USA',
      type: 'Grain',
      created_by: org1Admin.id,
    },
  });

  const corn = await prisma.commodity.create({
    data: {
      name: 'Corn',
      origin: 'Argentina',
      type: 'Grain',
      created_by: org2Admin.id,
    },
  });

  //
  // SENSORS (no metric on sensor model, only on readings)
  //
  const tempSensor = await prisma.sensor.create({
    data: {
      name: 'Temp Sensor #1',
      external_id: 'TS-001',
      is_active: true,
      cell_id: org1CellA.id,
      created_by: org1Admin.id,
    },
  });

  const humiditySensor = await prisma.sensor.create({
    data: {
      name: 'Humidity Sensor #1',
      external_id: 'HS-001',
      is_active: true,
      cell_id: org2CellA.id,
      created_by: org2Admin.id,
    },
  });

  //
  // SENSOR READINGS
  //
  await prisma.sensor_reading.createMany({
    data: [
      {
        sensor_id: tempSensor.id,
        cell_id: org1CellA.id,
        metric: 'TEMPERATURE', // metric_type enum
        value: 26.3,
        recorded_at: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        sensor_id: tempSensor.id,
        cell_id: org1CellA.id,
        metric: 'TEMPERATURE',
        value: 31.2,
        recorded_at: new Date(),
      },
      {
        sensor_id: humiditySensor.id,
        cell_id: org2CellA.id,
        metric: 'HUMIDITY',
        value: 52.8,
        recorded_at: new Date(),
      },
    ],
  });

  //
  // EVENT TRIGGER + ALERT
  //
  const trigger = await prisma.event_trigger.create({
    data: {
      name: 'High Temperature Warning',
      description: 'Temperature above 30°C in any cell of North Storage Facility',
      scope_type: 'SITE',
      organization_id: org1.id,
      site_id: org1SiteA.id,
      metric_type: 'TEMPERATURE',
      condition_type: 'ABOVE',
      threshold_value: 30,
      secondary_threshold_value: null,
      time_window_minutes: 10,
      severity_on_trigger: 'HIGH',
      is_active: true,
      created_by: org1Admin.id,
      updated_by: org1Admin.id,
    },
  });

  await prisma.alert.create({
    data: {
      trigger_id: trigger.id,
      site_id: org1SiteA.id,
      compound_id: org1CompoundA.id,
      cell_id: org1CellA.id,
      title: 'High temperature in Cell 1A',
      description: 'Temperature exceeded 30°C (31.2°C recorded).',
      trigger_type: 'TEMPERATURE',
      severity: 'HIGH',
      status: 'OPEN',
      threshold_value: 30,
      unit: '°C',
      started_at: new Date(),
      resolved_at: null,
      resolved_by_user_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  //
  // TRADES
  //
  await prisma.trade.createMany({
    data: [
      {
        commodity_id: wheat.id,
        site_id: org1SiteA.id,
        compound_id: org1CompoundA.id,
        cell_id: org1CellA.id,
        amount_kg: 5000,
        traded_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        notes: 'Initial wheat deposit',
        created_by: org1Admin.id,
        updated_by: org1Admin.id,
      },
      {
        commodity_id: corn.id,
        site_id: org2SiteA.id,
        compound_id: org2CompoundA.id,
        cell_id: org2CellA.id,
        amount_kg: 8000,
        traded_at: new Date(Date.now() - 60 * 60 * 1000),
        notes: 'Corn shipment received',
        created_by: org2Admin.id,
        updated_by: org2Admin.id,
      },
    ],
  });

  console.log('✅ Seed complete.');
}

main()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logInfoFlow } from '../src/lib/ils';
import { buildExportRouteStages } from '../src/lib/exportRouteStages';

const prisma = new PrismaClient();

async function seedCounterparties() {
  const partners = [
    { code: 'KUZBASS-COAL', name: 'АО «Кузбассуголь»', partnerType: 'CLIENT', contact: 'Поставщик угля' },
    { code: 'LUKOIL-NPZ', name: 'ЛУКОЙЛ-НПЗ', partnerType: 'CLIENT', contact: 'Поставщик нефтепродуктов' },
    { code: 'RZD-TERM', name: 'РЖД-Терминал', partnerType: 'RAILWAY' },
    { code: 'AUTO-CARR', name: 'ООО «ЮгТрансАвто»', partnerType: 'CARRIER' },
    { code: 'MSC-AGENT', name: 'Судовой агент MSC', partnerType: 'AGENT' },
  ];
  for (const p of partners) {
    await prisma.counterparty.upsert({ where: { code: p.code }, update: p, create: p });
  }
}

async function seedDirectories() {
  const ports = [
    { code: 'RUNVS', name: 'Новороссийск (терминал)', country: 'RU' },
    { code: 'TRMER', name: 'Мерсин', country: 'TR' },
    { code: 'CNQDG', name: 'Циндао', country: 'CN' },
    { code: 'ITGIT', name: 'Таранто', country: 'IT' },
  ];
  for (const port of ports) {
    await prisma.portDirectory.upsert({ where: { code: port.code }, update: {}, create: port });
  }
  const cargo = [
    { code: 'COAL-ANT', name: 'Уголь каменный', category: 'BULK' },
    { code: 'COAL-COK', name: 'Уголь коксующийся', category: 'BULK' },
    { code: 'OIL-CRUDE', name: 'Нефть сырая', category: 'LIQUID' },
    { code: 'OIL-FUEL', name: 'Мазут / топливо', category: 'LIQUID' },
  ];
  for (const item of cargo) {
    await prisma.cargoDirectory.upsert({ where: { code: item.code }, update: {}, create: item });
  }
}

async function seedTerminalInfrastructure() {
  const berth1 = await prisma.berth.upsert({
    where: { number: 'BULK-1' },
    update: {},
    create: {
      number: 'BULK-1',
      name: 'Причал навалочных грузов (уголь)',
      berthType: 'BULK',
      length: 280,
      depth: 15,
      maxDeadweight: 150000,
    },
  });
  const berth2 = await prisma.berth.upsert({
    where: { number: 'LIQUID-1' },
    update: {},
    create: {
      number: 'LIQUID-1',
      name: 'Причал наливной (нефть)',
      berthType: 'LIQUID',
      length: 220,
      depth: 12,
      maxDeadweight: 100000,
    },
  });

  const vesselBulk = await prisma.vessel.upsert({
    where: { imoNumber: '9703291' },
    update: {},
    create: {
      name: 'VOLGOBALT-204',
      imoNumber: '9703291',
      vesselType: 'BULK_CARRIER',
      deadweight: 62000,
      flag: 'RU',
      owner: 'Volga Shipping',
    },
  });
  const vesselTanker = await prisma.vessel.upsert({
    where: { imoNumber: '9312345' },
    update: {},
    create: {
      name: 'NORD STREAM',
      imoNumber: '9312345',
      vesselType: 'TANKER',
      deadweight: 48000,
      flag: 'MT',
      owner: 'Tanker Line',
    },
  });

  const whCoal = await prisma.warehouse.upsert({
    where: { number: 'COAL-YARD-1' },
    update: {},
    create: {
      number: 'COAL-YARD-1',
      name: 'Открытая площадка угля',
      capacity: 120000,
      warehouseType: 'COAL_YARD',
      zone: 'Уголь',
    },
  });
  const whOil = await prisma.warehouse.upsert({
    where: { number: 'OIL-TANK-1' },
    update: {},
    create: {
      number: 'OIL-TANK-1',
      name: 'Резервуарный парк нефти',
      capacity: 80000,
      warehouseType: 'OIL_TANK',
      zone: 'Нефть',
    },
  });

  let vesselCall = await prisma.vesselCall.findFirst({
    where: { voyageNumber: '204N', vesselId: vesselBulk.id },
  });
  if (!vesselCall) {
    vesselCall = await prisma.vesselCall.create({
      data: {
        vesselId: vesselBulk.id,
        voyageNumber: '204N',
        eta: new Date('2026-05-22T10:00:00'),
        etd: new Date('2026-05-23T18:00:00'),
        berthId: berth1.id,
        status: 'BERTHED',
        agent: 'Novorossiysk Agency',
        purpose: 'Погрузка угля на экспорт',
      },
    });
  }

  const coalBatch = await prisma.container.upsert({
    where: { containerNumber: 'COAL-2026-0001' },
    update: {},
    create: {
      containerNumber: 'COAL-2026-0001',
      containerType: 'COAL_ANTHRACITE',
      cargoCategory: 'COAL',
      status: 'IN_STORAGE',
      supplierName: 'АО «Кузбассуголь»',
      cargoDescription: 'Уголь каменный марки Д',
      quantityTons: 4200,
      quantityUnit: 'TON',
      grossWeight: 4200,
      warehouseId: whCoal.id,
      location: 'Сектор A-3',
      portOfLoading: 'RUNVS',
      portOfDischarge: 'TRMER',
      vesselCallId: vesselCall.id,
    },
  });

  await prisma.wagon.upsert({
    where: { number: '53467821' },
    update: {},
    create: {
      number: '53467821',
      wagonType: 'GONDOLA',
      cargo: 'Уголь каменный',
      cargoWeight: 68,
      warehouseId: whCoal.id,
      track: 'Путь 12',
      trainNumber: '2845',
      arrivalAt: new Date('2026-05-20T08:30:00'),
      status: 'DEPARTED',
      containerId: coalBatch.id,
    },
  });

  await prisma.truck.upsert({
    where: { licensePlate: 'K123УГ177' },
    update: {},
    create: {
      licensePlate: 'K123УГ177',
      truckType: 'DUMP_TRUCK',
      carrier: 'ЮгТрансАвто',
      driverName: 'Петров А.В.',
    },
  });

  return { coalBatch, vesselCall, whCoal, berth1 };
}

async function seedLogisticsOrders(coalBatchId: number, vesselCallId: number) {
  const supplier = await prisma.counterparty.findUnique({ where: { code: 'KUZBASS-COAL' } });
  if (!supplier) return null;

  const order = await prisma.logisticsOrder.upsert({
    where: { orderNumber: 'ILS-2026-0001' },
    update: {
      orderType: 'EXPORT_BULK',
      supplierName: 'АО «Кузбассуголь»',
      cargoDescription: 'Уголь каменный 4200 т',
      origin: 'Кемерово (поставщик)',
      destination: 'TRMER',
    },
    create: {
      orderNumber: 'ILS-2026-0001',
      orderType: 'EXPORT_BULK',
      managementLevel: 'DISPATCH',
      status: 'IN_PROGRESS',
      counterpartyId: supplier.id,
      supplierName: 'АО «Кузбассуголь»',
      cargoDescription: 'Уголь каменный 4200 т — экспорт',
      cargoWeight: 4200,
      origin: 'Кемерово (поставщик)',
      destination: 'TRMER',
      plannedStart: new Date('2026-05-18T00:00:00'),
      plannedEnd: new Date('2026-05-25T00:00:00'),
      actualStart: new Date('2026-05-18T06:00:00'),
      vesselCallId,
      notes: 'Цепочка: поставщик → ЖД/авто → склад → судно → порт Мерсин',
    },
  });

  await prisma.container.update({
    where: { id: coalBatchId },
    data: { logisticsOrderId: order.id },
  });

  return order;
}

async function seedLogisticsRoutes(orderId: number, coalBatchId: number) {
  const stages = buildExportRouteStages({
    supplierName: 'АО «Кузбассуголь», Кемерово',
    supplierCode: 'KUZBASS',
    railName: 'Ж/д путь 12, разгрузка вагонов',
    warehouseName: 'Склад COAL-YARD-1, сектор A-3',
    berthName: 'Причал BULK-1',
    shipName: 'Балкер VOLGOBALT-204 / рейс 204N',
    destPortCode: 'TRMER',
    destPortName: 'Порт Мерсин (конечный)',
  });

  const route = await prisma.logisticsRoute.upsert({
    where: { routeNumber: 'RT-EXPORT-COAL-001' },
    update: { routeKind: 'EXPORT' },
    create: {
      routeNumber: 'RT-EXPORT-COAL-001',
      name: 'Уголь: поставщик → терминал → Мерсин',
      orderId,
      origin: 'KUZBASS',
      destination: 'TRMER',
      routeKind: 'EXPORT',
      status: 'ACTIVE',
      stages: {
        create: stages.map((s) => ({
          ...s,
          plannedAt: new Date(),
          actualAt: s.status === 'COMPLETED' ? new Date() : undefined,
        })),
      },
    },
  });

  const routeWithStages = await prisma.logisticsRoute.findUnique({
    where: { id: route.id },
    include: { stages: { orderBy: { sequence: 'asc' } } },
  });
  if (!routeWithStages) return;

  const warehouseStage = routeWithStages.stages.find((s) => s.sequence === 4);
  const existing = await prisma.cargoTracking.findUnique({
    where: { containerId_routeId: { containerId: coalBatchId, routeId: route.id } },
  });

  if (!existing && warehouseStage) {
    const history = routeWithStages.stages
      .filter((s) => s.sequence <= 4)
      .map((s, i, arr) => ({
        toStageId: s.id,
        fromStageId: i > 0 ? arr[i - 1].id : undefined,
        description:
          s.sequence === 1
            ? 'Отгрузка у поставщика'
            : s.sequence === 2
              ? 'Прибытие ж/д состава на терминал'
              : s.sequence === 3
                ? 'Прибытие автотранспорта на весовую'
                : 'Разгрузка и размещение на складе угля',
      }));

    await prisma.cargoTracking.create({
      data: {
        containerId: coalBatchId,
        routeId: route.id,
        currentStageId: warehouseStage.id,
        status: 'AT_STAGE',
        notes: 'Партия на складе, ожидает погрузку на балкер',
        events: { create: history },
      },
    });
  }

  const order = await prisma.logisticsOrder.findUnique({ where: { id: orderId } });
  if (order) {
    const existingFlows = await prisma.materialFlow.count({ where: { orderId } });
    if (existingFlows === 0) {
      await prisma.materialFlow.createMany({
        data: [
          {
            orderId,
            containerId: coalBatchId,
            flowType: 'ARRIVAL',
            transportMode: 'RAIL',
            quantity: 4200,
            unit: 'TON',
            fromLocation: 'Кузбасс / ж/д',
            toLocation: 'Ж/д путь 12',
            description: 'Прибытие угля по железной дороге',
          },
          {
            orderId,
            containerId: coalBatchId,
            flowType: 'STORAGE',
            transportMode: 'WAREHOUSE',
            quantity: 4200,
            unit: 'TON',
            fromLocation: 'Ж/д фронт',
            toLocation: 'COAL-YARD-1 / A-3',
            description: 'Разгрузка на склад терминала',
          },
        ],
      });
    }
  }
}

async function seedUsers() {
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: await bcrypt.hash('admin', 10),
      role: 'ADMIN',
      fullName: 'Администратор ИЛС',
      department: 'ИТ',
    },
  });
  await prisma.user.upsert({
    where: { username: 'dispatcher' },
    update: {},
    create: {
      username: 'dispatcher',
      passwordHash: await bcrypt.hash('dispatcher', 10),
      role: 'DISPATCHER',
      fullName: 'Диспетчер угольно-нефтяного терминала',
      department: 'Диспетчерская',
    },
  });
}

async function main() {
  await seedUsers();
  await seedCounterparties();
  await seedDirectories();
  const { coalBatch, vesselCall } = await seedTerminalInfrastructure();
  const order = await seedLogisticsOrders(coalBatch.id, vesselCall.id);
  if (order) {
    await seedLogisticsRoutes(order.id, coalBatch.id);
    await logInfoFlow({
      ilsFunction: 'PLANNING',
      eventType: 'CREATE',
      entityType: 'LOGISTICS_ORDER',
      entityId: order.id,
      orderId: order.id,
      message: 'ИЛС: учёт экспортной цепочки угля (суша → склад → судно)',
    });
  }
  console.log('ILS bulk terminal seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

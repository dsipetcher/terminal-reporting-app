import { PrismaClient } from '@prisma/client';
import { ensureDemoUsers } from './ensureUsers.js';
import { MOCK_BATCHES, EXPECTED_MOCK_BATCH_COUNT, type BatchDef } from './mockBatchCatalog.js';
import fs from 'fs';
import path from 'path';
import { logInfoFlow } from '../src/lib/ils';
import { buildExportRouteStages } from '../src/lib/exportRouteStages';
import { cargoStatusFromStageType } from '../src/lib/cargoStatusFromStage';
import { trainConsistStatusForStage } from '../src/lib/trainConsistLifecycle';
import {
  deleteOrderUploads,
  ensureUploadsDir,
  orderUploadsDir,
} from '../src/lib/orderDocuments';

const prisma = new PrismaClient();

type Infra = {
  berthBulkId: number;
  berthLiquidId: number;
  whCoalId: number;
  whOilId: number;
  vesselBulkId: number;
  vesselTankerId: number;
  vesselCalls: Record<string, number>;
};

function buildStagesForProgress(
  progress: number | 'delivered',
  overrides: Parameters<typeof buildExportRouteStages>[0]
) {
  const base = buildExportRouteStages(overrides);
  const t0 = Date.now();
  if (progress === 'delivered') {
    return base.map((s) => ({
      ...s,
      status: 'COMPLETED',
      actualAt: new Date(t0 - (7 - s.sequence) * 86400000),
    }));
  }
  return base.map((s) => ({
    ...s,
    status: s.sequence < progress ? 'COMPLETED' : s.sequence === progress ? 'CURRENT' : 'PENDING',
    actualAt:
      s.sequence <= progress
        ? new Date(t0 - (progress - s.sequence + 1) * 3600000)
        : undefined,
  }));
}

function stageTypeForProgress(progress: number | 'delivered'): string {
  if (progress === 'delivered') return 'PORT';
  const types = ['SUPPLIER', 'RAIL_STATION', 'WAREHOUSE', 'BERTH', 'SHIP', 'PORT'];
  return types[progress - 1] ?? 'SUPPLIER';
}

async function seedCounterparties() {
  const partners = [
    { code: 'KUZBASS-COAL', name: 'АО «Кузбассуголь»', partnerType: 'CLIENT', contact: 'Поставщик угля' },
    { code: 'LUKOIL-NPZ', name: 'ЛУКОЙЛ-НПЗ', partnerType: 'CLIENT', contact: 'Поставщик нефтепродуктов' },
    { code: 'RZD-TERM', name: 'РЖД-Терминал', partnerType: 'RAILWAY' },
    { code: 'MSC-AGENT', name: 'Судовой агент MSC', partnerType: 'AGENT' },
    { code: 'EGYPT-TRADE', name: 'Egypt Bulk Trading', partnerType: 'CLIENT', contact: 'Импортёр угля' },
    { code: 'CN-OIL-IMP', name: 'China Oil Import Co.', partnerType: 'CLIENT', contact: 'Импорт нефти' },
    { code: 'CUSTOMS-NVR', name: 'Таможня Новороссийск', partnerType: 'CUSTOMS' },
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
    { code: 'EGALY', name: 'Александрия', country: 'EG' },
    { code: 'INMUM', name: 'Mumbai', country: 'IN' },
  ];
  for (const port of ports) {
    await prisma.portDirectory.upsert({ where: { code: port.code }, update: {}, create: port });
  }
  const cargo = [
    { code: 'COAL-ANT', name: 'Уголь каменный', category: 'BULK' },
    { code: 'COAL-COK', name: 'Уголь коксующийся', category: 'BULK' },
    { code: 'OIL-CRUDE', name: 'Нефть сырая', category: 'LIQUID' },
    { code: 'OIL-FUEL', name: 'Мазут / топливо', category: 'LIQUID' },
    { code: 'PETRO-DIESEL', name: 'Дизельное топливо', category: 'LIQUID' },
  ];
  for (const item of cargo) {
    await prisma.cargoDirectory.upsert({ where: { code: item.code }, update: {}, create: item });
  }
}

async function seedTerminalInfrastructure(): Promise<Infra> {
  const berthBulk = await prisma.berth.upsert({
    where: { number: 'BULK-1' },
    update: {
      name: 'Причал навалочных грузов (уголь)',
    },
    create: {
      number: 'BULK-1',
      name: 'Причал навалочных грузов (уголь)',
      berthType: 'BULK',
      length: 280,
      depth: 15,
      maxDeadweight: 150000,
    },
  });
  const berthLiquid = await prisma.berth.upsert({
    where: { number: 'LIQUID-1' },
    update: {
      name: 'Причал наливной (нефть)',
    },
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
    update: {
      name: 'Открытая площадка угля',
    },
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
    update: {
      name: 'Резервуарный парк нефти',
    },
    create: {
      number: 'OIL-TANK-1',
      name: 'Резервуарный парк нефти',
      capacity: 80000,
      warehouseType: 'OIL_TANK',
      zone: 'Нефть',
    },
  });

  const callDefs: {
    key: string;
    vesselId: number;
    voyage: string;
    berthId: number;
    status: string;
    purpose: string;
    eta: Date;
    ata?: Date;
    atd?: Date;
  }[] = [
    {
      key: '204N',
      vesselId: vesselBulk.id,
      voyage: '204N',
      berthId: berthBulk.id,
      status: 'UNLOADING',
      purpose: 'Погрузка угля на экспорт',
      eta: new Date('2026-05-20T10:00:00'),
      ata: new Date('2026-05-20T11:30:00'),
    },
    {
      key: '205N',
      vesselId: vesselBulk.id,
      voyage: '205N',
      berthId: berthBulk.id,
      status: 'EN_ROUTE',
      purpose: 'Ожидаемый рейс в Италию',
      eta: new Date('2026-05-24T08:00:00'),
    },
    {
      key: '206N',
      vesselId: vesselBulk.id,
      voyage: '206N',
      berthId: berthBulk.id,
      status: 'DEPARTED',
      purpose: 'Рейс угля в Китай',
      eta: new Date('2026-05-10T10:00:00'),
      ata: new Date('2026-05-10T12:00:00'),
      atd: new Date('2026-05-12T16:00:00'),
    },
    {
      key: 'T101',
      vesselId: vesselTanker.id,
      voyage: 'T101',
      berthId: berthLiquid.id,
      status: 'UNLOADING',
      purpose: 'Налив нефти (марка «Urals»)',
      eta: new Date('2026-05-23T14:00:00'),
      ata: new Date('2026-05-23T15:00:00'),
    },
    {
      key: 'T102',
      vesselId: vesselTanker.id,
      voyage: 'T102',
      berthId: berthLiquid.id,
      status: 'ARRIVED',
      purpose: 'Налив мазута',
      eta: new Date('2026-05-25T06:00:00'),
      ata: new Date('2026-05-25T07:30:00'),
    },
    {
      key: '207N',
      vesselId: vesselBulk.id,
      voyage: '207N',
      berthId: berthBulk.id,
      status: 'ARRIVED',
      purpose: 'Погрузка угля — оперативный заказ',
      eta: new Date('2026-05-26T09:00:00'),
      ata: new Date('2026-05-26T10:15:00'),
    },
    {
      key: '208N',
      vesselId: vesselBulk.id,
      voyage: '208N',
      berthId: berthBulk.id,
      status: 'EN_ROUTE',
      purpose: 'Ожидаемый рейс угля в Египет',
      eta: new Date('2026-05-28T12:00:00'),
    },
    {
      key: 'T103',
      vesselId: vesselTanker.id,
      voyage: 'T103',
      berthId: berthLiquid.id,
      status: 'DEPARTED',
      purpose: 'Рейс нефти в Китай (архив)',
      eta: new Date('2026-04-20T10:00:00'),
      ata: new Date('2026-04-20T11:00:00'),
      atd: new Date('2026-04-22T18:00:00'),
    },
    {
      key: 'T104',
      vesselId: vesselTanker.id,
      voyage: 'T104',
      berthId: berthLiquid.id,
      status: 'EN_ROUTE',
      purpose: 'Ожидаемый танкер Urals',
      eta: new Date('2026-05-29T08:00:00'),
    },
  ];

  const vesselCalls: Record<string, number> = {};
  for (const c of callDefs) {
    const existing = await prisma.vesselCall.findFirst({
      where: { voyageNumber: c.voyage, vesselId: c.vesselId },
    });
    const call =
      existing ??
      (await prisma.vesselCall.create({
        data: {
          vesselId: c.vesselId,
          voyageNumber: c.voyage,
          eta: c.eta,
          etd: new Date(c.eta.getTime() + 86400000),
          berthId: c.berthId,
          status: c.status,
          agent: 'Новороссийское судовое агентство',
          purpose: c.purpose,
          ata: c.ata,
          atd: c.atd,
        },
      }));
    if (existing) {
      await prisma.vesselCall.update({
        where: { id: existing.id },
        data: { status: c.status, ata: c.ata, atd: c.atd, berthId: c.berthId },
      });
    }
    vesselCalls[c.key] = call.id;
  }

  return {
    berthBulkId: berthBulk.id,
    berthLiquidId: berthLiquid.id,
    whCoalId: whCoal.id,
    whOilId: whOil.id,
    vesselBulkId: vesselBulk.id,
    vesselTankerId: vesselTanker.id,
    vesselCalls,
  };
}

async function clearCargoData() {
  const orders = await prisma.logisticsOrder.findMany({ select: { id: true } });
  for (const order of orders) {
    deleteOrderUploads(order.id);
  }

  await prisma.cargoTrackingEvent.deleteMany();
  await prisma.cargoTracking.deleteMany();
  await prisma.materialFlow.deleteMany();
  await prisma.routeStage.deleteMany();
  await prisma.logisticsRoute.deleteMany();
  await prisma.wagon.deleteMany();
  await prisma.trainConsist.deleteMany();
  await prisma.container.deleteMany();
  await prisma.logisticsOrderDocument.deleteMany();
  await prisma.infoFlowEvent.deleteMany({
    where: { orderId: { not: null } },
  });
  await prisma.logisticsOrder.deleteMany();
}

async function ensureTrainConsist(
  cache: Record<string, number>,
  trainNumber: string,
  track: string,
  origin: string,
  status: string
): Promise<number> {
  if (cache[trainNumber]) {
    const id = cache[trainNumber];
    const existing = await prisma.trainConsist.findUnique({ where: { id } });
    if (existing && existing.status !== status) {
      await prisma.trainConsist.update({ where: { id }, data: { status } });
    }
    return id;
  }
  const consist = await prisma.trainConsist.create({
    data: {
      trainNumber,
      track,
      origin,
      direction: 'INBOUND',
      arrivalAt: new Date(Date.now() - 86400000),
      status,
    },
  });
  cache[trainNumber] = consist.id;
  return consist.id;
}

async function seedMockBatches(infra: Infra) {
  const kuzbass = await prisma.counterparty.findUnique({ where: { code: 'KUZBASS-COAL' } });
  const lukoil = await prisma.counterparty.findUnique({ where: { code: 'LUKOIL-NPZ' } });
  const consistCache: Record<string, number> = {};

  const coalWeight = MOCK_BATCHES.filter((b) => b.orderKey === 'coal').reduce((s, b) => s + b.quantityTons, 0);
  const oilWeight = MOCK_BATCHES.filter((b) => b.orderKey === 'oil').reduce((s, b) => s + b.quantityTons, 0);

  const orders = {
    coal: await prisma.logisticsOrder.create({
      data: {
        orderNumber: 'ILS-2026-COAL',
        orderType: 'EXPORT_BULK',
        managementLevel: 'DISPATCH',
        status: 'IN_PROGRESS',
        counterpartyId: kuzbass!.id,
        supplierName: 'АО «Кузбассуголь»',
        cargoDescription: `Экспорт угля (${MOCK_BATCHES.filter((b) => b.orderKey === 'coal').length} партий)`,
        cargoWeight: coalWeight,
        origin: 'Кузбасс',
        destination: 'Мерсин · Циндао · Таранто · Александрия · Mumbai',
        plannedStart: new Date('2026-05-15'),
        actualStart: new Date('2026-05-16'),
        vesselCallId: infra.vesselCalls['204N'],
        notes: 'Диспетчерский заказ: входящие составы, парк, погрузка на суда',
      },
    }),
    oil: await prisma.logisticsOrder.create({
      data: {
        orderNumber: 'ILS-2026-OIL',
        orderType: 'EXPORT_BULK',
        managementLevel: 'DISPATCH',
        status: 'IN_PROGRESS',
        counterpartyId: lukoil!.id,
        supplierName: 'ЛУКОЙЛ-НПЗ',
        cargoDescription: `Экспорт нефти и НП (${MOCK_BATCHES.filter((b) => b.orderKey === 'oil').length} партий)`,
        cargoWeight: oilWeight,
        origin: 'Самара (НПЗ)',
        destination: 'Мерсин · Циндао · Таранто · Александрия · Mumbai',
        plannedStart: new Date('2026-05-14'),
        actualStart: new Date('2026-05-15'),
        vesselCallId: infra.vesselCalls['T101'],
        notes: 'Диспетчерский заказ: цистерны, резервуары, танкеры',
      },
    }),
    planning: await prisma.logisticsOrder.create({
      data: {
        orderNumber: 'ILS-2026-PLAN-Q3',
        orderType: 'EXPORT_BULK',
        managementLevel: 'PLANNING',
        status: 'PLANNED',
        counterpartyId: kuzbass!.id,
        supplierName: 'АО «Кузбассуголь»',
        cargoDescription: 'Плановый экспорт угля Q3 2026',
        cargoWeight: MOCK_BATCHES.filter((b) => b.orderKey === 'planning').reduce((s, b) => s + b.quantityTons, 0),
        origin: 'Кемерово',
        destination: 'Мерсин · Циндао',
        plannedStart: new Date('2026-07-01'),
        plannedEnd: new Date('2026-09-30'),
        notes: 'Планирование: составы ещё в пути, судозаход не назначен',
      },
    }),
    operational: await prisma.logisticsOrder.create({
      data: {
        orderNumber: 'ILS-2026-OPS-01',
        orderType: 'STORAGE',
        managementLevel: 'OPERATIONAL',
        status: 'IN_PROGRESS',
        counterpartyId: kuzbass!.id,
        supplierName: 'АО «Кузбассуголь»',
        cargoDescription: 'Оперативное хранение и отгрузка со склада',
        cargoWeight: MOCK_BATCHES.filter((b) => b.orderKey === 'operational').reduce((s, b) => s + b.quantityTons, 0),
        origin: 'Кузбасс',
        destination: 'Порт Мерсин',
        plannedStart: new Date('2026-05-18'),
        actualStart: new Date('2026-05-19'),
        vesselCallId: infra.vesselCalls['207N'],
        notes: 'Оперативный уровень: партии на складе и в парке',
      },
    }),
    archive: await prisma.logisticsOrder.create({
      data: {
        orderNumber: 'ILS-2025-ARCHIVE',
        orderType: 'EXPORT_BULK',
        managementLevel: 'DISPATCH',
        status: 'COMPLETED',
        counterpartyId: lukoil!.id,
        supplierName: 'ЛУКОЙЛ-НПЗ',
        cargoDescription: 'Архив доставленных партий 2025–2026',
        cargoWeight: MOCK_BATCHES.filter((b) => b.orderKey === 'archive').reduce((s, b) => s + b.quantityTons, 0),
        origin: 'Самара (НПЗ)',
        destination: 'Циндао · Таранто',
        plannedStart: new Date('2025-11-01'),
        plannedEnd: new Date('2026-04-30'),
        actualStart: new Date('2025-11-05'),
        actualEnd: new Date('2026-04-22'),
        notes: 'Завершённые маршруты без активных судозаходов',
      },
    }),
  };

  for (const batch of MOCK_BATCHES) {
    const orderId = orders[batch.orderKey].id;
    const isCoal = batch.cargoCategory === 'COAL';
    const whId =
      batch.warehouseKey === 'coal'
        ? infra.whCoalId
        : batch.warehouseKey === 'oil'
          ? infra.whOilId
          : undefined;
    const vesselCallId =
      batch.progress === 'delivered'
        ? undefined
        : batch.vesselCallKey
          ? infra.vesselCalls[batch.vesselCallKey]
          : undefined;

    const stageType = stageTypeForProgress(batch.progress);
    const containerStatus =
      batch.progress === 'delivered' ? 'DELIVERED' : cargoStatusFromStageType(stageType);

    const container = await prisma.container.create({
      data: {
        containerNumber: batch.containerNumber,
        containerType: batch.containerType,
        cargoCategory: batch.cargoCategory,
        status: containerStatus,
        supplierName: batch.supplierName,
        cargoDescription: batch.cargoDescription,
        quantityTons: batch.quantityTons,
        quantityUnit: 'TON',
        grossWeight: batch.quantityTons,
        warehouseId: whId,
        location: batch.location,
        portOfLoading: batch.portOfLoading,
        portOfDischarge: batch.portOfDischarge,
        vesselCallId,
        logisticsOrderId: orderId,
        blNumber: batch.blNumber,
      },
    });

    if (batch.wagon && batch.progress !== 'delivered') {
      const pastUnloading =
        typeof batch.progress === 'number' && batch.progress >= 4;

      if (pastUnloading) {
        await prisma.wagon.create({
          data: {
            number: batch.wagon.number,
            wagonType: batch.cargoCategory === 'COAL' ? 'GONDOLA' : 'TANK',
            warehouseId: whId,
            track: batch.wagon.track,
            trainNumber: batch.wagon.trainNumber,
            arrivalAt: new Date(Date.now() - 86400000),
            status: 'IN_PARK',
          },
        });
      } else {
        const consistStatus = trainConsistStatusForStage(stageType) ?? 'EN_ROUTE';
        const consistId = await ensureTrainConsist(
          consistCache,
          batch.wagon.trainNumber,
          batch.wagon.track,
          batch.origin,
          consistStatus
        );
        await prisma.wagon.create({
          data: {
            number: batch.wagon.number,
            wagonType: batch.cargoCategory === 'COAL' ? 'GONDOLA' : 'TANK',
            cargo: batch.cargoDescription,
            cargoWeight: Math.round(batch.quantityTons / 60),
            warehouseId: whId,
            track: batch.wagon.track,
            trainNumber: batch.wagon.trainNumber,
            trainConsistId: consistId,
            arrivalAt: new Date(Date.now() - 86400000),
            status: consistStatus,
            containerId: container.id,
          },
        });
      }
    }

    const stageOverrides = {
      supplierName: batch.supplierName,
      supplierCode: batch.origin,
      warehouseName: batch.location ? `Склад / ${batch.location}` : undefined,
      shipName: batch.vesselCallKey
        ? `Рейс ${batch.vesselCallKey}`
        : batch.shipVoyageSnapshot
          ? `NORD STREAM · рейс ${batch.shipVoyageSnapshot}`
          : undefined,
      destPortCode: batch.destCode,
      destPortName: batch.destName,
    };

    const stages = buildStagesForProgress(batch.progress, stageOverrides);
    const route = await prisma.logisticsRoute.create({
      data: {
        routeNumber: batch.routeNumber,
        name: batch.routeName,
        orderId,
        origin: batch.origin,
        destination: batch.destName,
        routeKind: 'EXPORT',
        status: batch.progress === 'delivered' ? 'COMPLETED' : 'ACTIVE',
        stages: {
          create: stages.map((s) => ({
            sequence: s.sequence,
            stageType: s.stageType,
            locationCode: s.locationCode,
            locationName: s.locationName,
            transportMode: s.transportMode,
            status: s.status,
            plannedAt: new Date(),
            actualAt: s.actualAt,
          })),
        },
      },
      include: { stages: { orderBy: { sequence: 'asc' } } },
    });

    const currentStage =
      batch.progress === 'delivered'
        ? route.stages[route.stages.length - 1]
        : route.stages.find((s) => s.sequence === batch.progress);

    const trackingStatus = batch.progress === 'delivered' ? 'DELIVERED' : 'AT_STAGE';

    const events = route.stages
      .filter((s) =>
        batch.progress === 'delivered'
          ? true
          : s.sequence <= (batch.progress as number)
      )
      .map((s, i, arr) => ({
        toStageId: s.id,
        fromStageId: i > 0 ? arr[i - 1].id : undefined,
        eventAt: s.actualAt ?? new Date(),
        description: `Этап: ${s.locationName}`,
      }));

    await prisma.cargoTracking.create({
      data: {
        containerId: container.id,
        routeId: route.id,
        currentStageId: currentStage?.id,
        status: trackingStatus,
        notes: `Мок-данные: ${batch.cargoDescription}`,
        events: { create: events },
      },
    });

    if (batch.progress !== 'delivered' && batch.progress >= 2) {
      const atWarehouse = batch.progress >= 3;
      await prisma.materialFlow.create({
        data: {
          orderId,
          containerId: container.id,
          flowType: atWarehouse ? 'STORAGE' : 'ARRIVAL',
          transportMode: atWarehouse ? 'WAREHOUSE' : 'RAIL',
          quantity: batch.quantityTons,
          unit: 'TON',
          fromLocation: atWarehouse
            ? (batch.wagon?.track ?? 'Ж/д фронт')
            : batch.origin,
          toLocation: atWarehouse
            ? (batch.location ?? 'Склад терминала')
            : (batch.wagon?.track ?? 'Ж/д фронт'),
          description: atWarehouse
            ? `Перемещение на склад после ж/д: ${batch.cargoDescription}`
            : `Ж/д поступление ${batch.origin} → терминал: ${batch.cargoDescription}`,
          performedAt: new Date(),
        },
      });
    }
  }

  await logInfoFlow({
    ilsFunction: 'PLANNING',
    eventType: 'CREATE',
    entityType: 'LOGISTICS_ORDER',
    entityId: orders.coal.id,
    orderId: orders.coal.id,
    message: `Seed: ${MOCK_BATCHES.length} cargo batches across ${Object.keys(orders).length} logistics orders`,
  });

  await logInfoFlow({
    ilsFunction: 'DISPATCH',
    eventType: 'UPDATE',
    entityType: 'LOGISTICS_ORDER',
    entityId: orders.oil.id,
    orderId: orders.oil.id,
    message: 'Демо: активные рейсы танкеров T101, T102 на наливном причале',
  });
}

async function seedParkWagonsAndOutbound(infra: Infra) {
  const parkDefs: {
    number: string;
    trainNumber: string;
    track: string;
    wagonType: 'GONDOLA' | 'TANK';
    warehouseId: number;
    outboundTrain?: string;
  }[] = [
    { number: '53467901', trainNumber: '2845', track: 'Путь 15', wagonType: 'GONDOLA', warehouseId: infra.whCoalId, outboundTrain: '3901' },
    { number: '53467902', trainNumber: '2851', track: 'Путь 15', wagonType: 'GONDOLA', warehouseId: infra.whCoalId, outboundTrain: '3901' },
    { number: '53467903', trainNumber: '2860', track: 'Путь 15', wagonType: 'GONDOLA', warehouseId: infra.whCoalId, outboundTrain: '3901' },
    { number: '53467904', trainNumber: '2872', track: 'Путь 15', wagonType: 'GONDOLA', warehouseId: infra.whCoalId, outboundTrain: '3901' },
    { number: '53467905', trainNumber: '2880', track: 'Путь 17', wagonType: 'GONDOLA', warehouseId: infra.whCoalId, outboundTrain: '3901' },
    { number: '53467906', trainNumber: '2890', track: 'Путь 17', wagonType: 'GONDOLA', warehouseId: infra.whCoalId },
    { number: '53467907', trainNumber: '2900', track: 'Путь 18', wagonType: 'GONDOLA', warehouseId: infra.whCoalId },
    { number: '53467908', trainNumber: '2910', track: 'Путь 18', wagonType: 'GONDOLA', warehouseId: infra.whCoalId },
    { number: '75123501', trainNumber: 'N420', track: 'Путь 6', wagonType: 'TANK', warehouseId: infra.whOilId, outboundTrain: '3902' },
    { number: '75123502', trainNumber: 'N425', track: 'Путь 6', wagonType: 'TANK', warehouseId: infra.whOilId, outboundTrain: '3902' },
    { number: '75123503', trainNumber: 'N430', track: 'Путь 7', wagonType: 'TANK', warehouseId: infra.whOilId, outboundTrain: '3902' },
    { number: '75123504', trainNumber: 'N435', track: 'Путь 7', wagonType: 'TANK', warehouseId: infra.whOilId },
    { number: '75123505', trainNumber: 'N440', track: 'Путь 8', wagonType: 'TANK', warehouseId: infra.whOilId },
    { number: '75123506', trainNumber: 'N445', track: 'Путь 8', wagonType: 'TANK', warehouseId: infra.whOilId },
  ];

  const outboundGroups: Record<string, number[]> = { '3901': [], '3902': [] };
  const formedAt = new Date();

  for (const def of parkDefs) {
    const wagon = await prisma.wagon.create({
      data: {
        number: def.number,
        wagonType: def.wagonType,
        track: def.track,
        trainNumber: def.trainNumber,
        warehouseId: def.warehouseId,
        arrivalAt: new Date(Date.now() - 86400000 * 2),
        status: 'IN_PARK',
      },
    });
    if (def.outboundTrain) {
      outboundGroups[def.outboundTrain].push(wagon.id);
    }
  }

  const outbound3901 = await prisma.trainConsist.create({
    data: {
      trainNumber: '3901',
      destination: 'Кемерово',
      track: 'Путь 16',
      direction: 'OUTBOUND',
      arrivalAt: formedAt,
      formedAt,
      status: 'FORMING',
    },
  });

  const outbound3902 = await prisma.trainConsist.create({
    data: {
      trainNumber: '3902',
      destination: 'Самара (НПЗ)',
      track: 'Путь 9',
      direction: 'OUTBOUND',
      arrivalAt: formedAt,
      formedAt,
      status: 'FORMING',
    },
  });

  await prisma.wagon.updateMany({
    where: { id: { in: outboundGroups['3901'] } },
    data: {
      trainConsistId: outbound3901.id,
      trainNumber: '3901',
      status: 'FORMING',
    },
  });

  await prisma.wagon.updateMany({
    where: { id: { in: outboundGroups['3902'] } },
    data: {
      trainConsistId: outbound3902.id,
      trainNumber: '3902',
      status: 'FORMING',
    },
  });
}

async function seedUsers() {
  await ensureDemoUsers(prisma);
}

async function normalizeLegacyTransportStatuses() {
  const wagonMap: Record<string, string> = {
    EXPECTED: 'EN_ROUTE',
    LOADING: 'UNLOADING',
  };
  for (const [from, to] of Object.entries(wagonMap)) {
    await prisma.wagon.updateMany({ where: { status: from }, data: { status: to } });
  }

  const callMap: Record<string, string> = {
    EXPECTED: 'EN_ROUTE',
    BERTHED: 'ARRIVED',
    IN_OPERATION: 'UNLOADING',
  };
  for (const [from, to] of Object.entries(callMap)) {
    await prisma.vesselCall.updateMany({ where: { status: from }, data: { status: to } });
  }
}

async function pruneStaleVesselCalls(activeVoyageNumbers: string[]) {
  await prisma.vesselCall.deleteMany({
    where: { voyageNumber: { notIn: activeVoyageNumbers } },
  });

  const activeVesselIds = (
    await prisma.vesselCall.findMany({ select: { vesselId: true }, distinct: ['vesselId'] })
  ).map((c) => c.vesselId);

  if (activeVesselIds.length > 0) {
    await prisma.vessel.deleteMany({
      where: { id: { notIn: activeVesselIds } },
    });
  }
}

async function seedOrderDocuments() {
  const coalOrder = await prisma.logisticsOrder.findUnique({
    where: { orderNumber: 'ILS-2026-COAL' },
  });
  if (!coalOrder) return;

  const demoDocs = [
    {
      fileName: 'Договор поставки угля 2026.txt',
      content: 'Демо-договор на экспорт угля через терминал Новороссийск.',
      documentType: 'CONTRACT',
      description: 'Рамочный договор с поставщиком',
    },
    {
      fileName: 'Спецификация партий.txt',
      content: 'Спецификация партий угля по заказу ILS-2026-COAL.',
      documentType: 'OTHER',
    },
  ];

  for (const doc of demoDocs) {
    ensureUploadsDir(coalOrder.id);
    const storedName = `${Date.now()}-${doc.fileName.replace(/\s/g, '_')}`;
    const filePath = path.join(orderUploadsDir(coalOrder.id), storedName);
    fs.writeFileSync(filePath, doc.content, 'utf8');

    await prisma.logisticsOrderDocument.create({
      data: {
        orderId: coalOrder.id,
        fileName: doc.fileName,
        storedName,
        mimeType: 'text/plain',
        fileSize: Buffer.byteLength(doc.content, 'utf8'),
        documentType: doc.documentType,
        description: doc.description ?? null,
      },
    });
  }

  const oilOrder = await prisma.logisticsOrder.findUnique({
    where: { orderNumber: 'ILS-2026-OIL' },
  });
  if (oilOrder) {
    const blDoc = {
      fileName: 'Коносамент T103.txt',
      content: 'Архивный коносамент по доставленным партиям.',
      documentType: 'WAYBILL',
      description: 'Архив по доставленным партиям',
    };
    ensureUploadsDir(oilOrder.id);
    const blStored = `${Date.now()}-bl-oil.txt`;
    fs.writeFileSync(path.join(orderUploadsDir(oilOrder.id), blStored), blDoc.content, 'utf8');
    await prisma.logisticsOrderDocument.create({
      data: {
        orderId: oilOrder.id,
        fileName: blDoc.fileName,
        storedName: blStored,
        mimeType: 'text/plain',
        fileSize: Buffer.byteLength(blDoc.content, 'utf8'),
        documentType: blDoc.documentType,
        description: blDoc.description,
      },
    });
  }

  const planOrder = await prisma.logisticsOrder.findUnique({
    where: { orderNumber: 'ILS-2026-PLAN-Q3' },
  });
  if (planOrder) {
    const planDoc = {
      fileName: 'План отгрузок Q3.txt',
      content: 'Плановый график ж/д и морских отгрузок угля на Q3 2026.',
      documentType: 'OTHER',
      description: 'Планирование',
    };
    ensureUploadsDir(planOrder.id);
    const stored = `${Date.now()}-plan-q3.txt`;
    fs.writeFileSync(path.join(orderUploadsDir(planOrder.id), stored), planDoc.content, 'utf8');
    await prisma.logisticsOrderDocument.create({
      data: {
        orderId: planOrder.id,
        fileName: planDoc.fileName,
        storedName: stored,
        mimeType: 'text/plain',
        fileSize: Buffer.byteLength(planDoc.content, 'utf8'),
        documentType: planDoc.documentType,
        description: planDoc.description,
      },
    });
  }
}

async function runDemoSeed() {
  await seedUsers();
  await seedCounterparties();
  await seedDirectories();
  const infra = await seedTerminalInfrastructure();
  await normalizeLegacyTransportStatuses();
  await clearCargoData();
  await pruneStaleVesselCalls(['204N', '205N', '206N', '207N', '208N', 'T101', 'T102', 'T103', 'T104']);
  await seedMockBatches(infra);
  await seedParkWagonsAndOutbound(infra);
  await seedOrderDocuments();
  console.log(`ILS seed completed: ${MOCK_BATCHES.length} cargo batches, ${EXPECTED_MOCK_BATCH_COUNT} expected`);
}

export { runDemoSeed, MOCK_BATCHES, EXPECTED_MOCK_BATCH_COUNT };

const isDirectRun = process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/seed.ts');

if (isDirectRun) {
  runDemoSeed()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

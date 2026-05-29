import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
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

type BatchDef = {
  containerNumber: string;
  containerType: string;
  cargoCategory: string;
  supplierName: string;
  cargoDescription: string;
  quantityTons: number;
  portOfLoading: string;
  portOfDischarge: string;
  warehouseKey?: 'coal' | 'oil';
  location?: string;
  vesselCallKey?: string;
  /** Snapshot рейса для доставленных партий (судозаход уже удалён) */
  shipVoyageSnapshot?: string;
  /** 1–6 = текущий этап; delivered = все этапы пройдены */
  progress: number | 'delivered';
  routeNumber: string;
  routeName: string;
  origin: string;
  destCode: string;
  destName: string;
  wagon?: { number: string; trainNumber: string; track: string };
  blNumber?: string;
};

const MOCK_BATCHES: BatchDef[] = [
  {
    containerNumber: 'COAL-2026-0001',
    containerType: 'COAL_ANTHRACITE',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь каменный марки Д',
    quantityTons: 4200,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    progress: 1,
    routeNumber: 'RT-COAL-001',
    routeName: 'Уголь · в пути в терминал',
    origin: 'Кузбасс',
    destCode: 'TRMER',
    destName: 'Порт Мерсин',
    wagon: { number: '53467821', trainNumber: '2845', track: 'Путь 12' },
  },
  {
    containerNumber: 'COAL-2026-0002',
    containerType: 'COAL_COKING',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь коксующийся K',
    quantityTons: 3800,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    progress: 2,
    routeNumber: 'RT-COAL-002',
    routeName: 'Коксующийся уголь · прибыл на ж/д фронт',
    origin: 'Кузбасс',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
    wagon: { number: '53467822', trainNumber: '2851', track: 'Путь 8' },
  },
  {
    containerNumber: 'COAL-2026-0003',
    containerType: 'COAL_ANTHRACITE',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь энергетический',
    quantityTons: 5100,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'ITGIT',
    warehouseKey: 'coal',
    location: 'Сектор A-3',
    vesselCallKey: '204N',
    progress: 3,
    routeNumber: 'RT-COAL-003',
    routeName: 'Уголь · разгрузка на терминале',
    origin: 'Кузбасс',
    destCode: 'ITGIT',
    destName: 'Порт Таранто',
    wagon: { number: '53467823', trainNumber: '2860', track: 'Путь 12' },
  },
  {
    containerNumber: 'COAL-2026-0004',
    containerType: 'COAL_ANTHRACITE',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь для экспорта в Турцию',
    quantityTons: 4600,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    warehouseKey: 'coal',
    location: 'Сектор B-1',
    vesselCallKey: '204N',
    progress: 4,
    routeNumber: 'RT-COAL-004',
    routeName: 'Уголь · на причале (вагон в парке)',
    origin: 'Кузбасс',
    destCode: 'TRMER',
    destName: 'Порт Мерсин',
    wagon: { number: '53467824', trainNumber: '2872', track: 'Путь 14' },
  },
  {
    containerNumber: 'COAL-2026-0005',
    containerType: 'COAL_COKING',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Коксующийся уголь — погрузка на судно',
    quantityTons: 3900,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    vesselCallKey: '204N',
    progress: 5,
    routeNumber: 'RT-COAL-005',
    routeName: 'Уголь · на борту судна',
    origin: 'Кузбасс',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
  },
  {
    containerNumber: 'COAL-2026-0006',
    containerType: 'COAL_ANTHRACITE',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь · в пути морем',
    quantityTons: 4400,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    vesselCallKey: '206N',
    progress: 6,
    routeNumber: 'RT-COAL-006',
    routeName: 'Уголь · морская перевозка',
    origin: 'Кузбасс',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
  },
  {
    containerNumber: 'OIL-2026-0001',
    containerType: 'OIL_CRUDE',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Нефть сырая (марка «Urals»)',
    quantityTons: 6200,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    progress: 1,
    routeNumber: 'RT-OIL-001',
    routeName: 'Нефть · в пути в терминал',
    origin: 'Самара (НПЗ)',
    destCode: 'TRMER',
    destName: 'Порт Мерсин',
    wagon: { number: '75123401', trainNumber: 'N401', track: 'Путь 3 (налив)' },
  },
  {
    containerNumber: 'OIL-2026-0002',
    containerType: 'OIL_CRUDE',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Нефть (марка «Urals»), партия 2',
    quantityTons: 5800,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    progress: 2,
    routeNumber: 'RT-OIL-002',
    routeName: 'Нефть · прибыл состав на ж/д фронт',
    origin: 'Самара (НПЗ)',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
    wagon: { number: '75123402', trainNumber: 'N408', track: 'Путь 3' },
  },
  {
    containerNumber: 'OIL-2026-0003',
    containerType: 'OIL_FUEL',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Мазут топочный М-100',
    quantityTons: 4100,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'ITGIT',
    warehouseKey: 'oil',
    location: 'Резервуар R-2',
    vesselCallKey: 'T101',
    progress: 3,
    routeNumber: 'RT-OIL-003',
    routeName: 'Мазут · разгрузка на терминале',
    origin: 'Самара (НПЗ)',
    destCode: 'ITGIT',
    destName: 'Порт Таранто',
    wagon: { number: '75123403', trainNumber: 'N415', track: 'Путь 5' },
  },
  {
    containerNumber: 'OIL-2026-0004',
    containerType: 'OIL_FUEL',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Мазут · на причале налив',
    quantityTons: 4500,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    warehouseKey: 'oil',
    location: 'Резервуар R-5',
    vesselCallKey: 'T101',
    progress: 4,
    routeNumber: 'RT-OIL-004',
    routeName: 'Мазут · причал (вагон в парке)',
    origin: 'Самара (НПЗ)',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
    wagon: { number: '75123404', trainNumber: 'N422', track: 'Путь 5' },
  },
  {
    containerNumber: 'OIL-2026-0005',
    containerType: 'OIL_CRUDE',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Нефть · погрузка на танкер',
    quantityTons: 5500,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    vesselCallKey: 'T102',
    progress: 5,
    routeNumber: 'RT-OIL-005',
    routeName: 'Нефть · на борту танкера',
    origin: 'Самара (НПЗ)',
    destCode: 'TRMER',
    destName: 'Порт Мерсин',
  },
  {
    containerNumber: 'PETRO-2026-0001',
    containerType: 'PETROLEUM',
    cargoCategory: 'PETROLEUM',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Дизельное топливо Евро-5',
    quantityTons: 3200,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    progress: 1,
    routeNumber: 'RT-PETRO-001',
    routeName: 'Дизель · формирование на НПЗ (без ж/д)',
    origin: 'Самара (НПЗ)',
    destCode: 'TRMER',
    destName: 'Порт Мерсин',
  },
  {
    containerNumber: 'OIL-2026-0006',
    containerType: 'OIL_FUEL',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Топливный мазут — доставлено',
    quantityTons: 4800,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    progress: 'delivered',
    routeNumber: 'RT-OIL-006',
    routeName: 'Мазут · цикл завершён',
    origin: 'Самара (НПЗ)',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
    shipVoyageSnapshot: 'T103',
    blNumber: 'BL-OIL-006',
  },
];

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

  const orderCoal = await prisma.logisticsOrder.create({
    data: {
      orderNumber: 'ILS-2026-COAL',
      orderType: 'EXPORT_BULK',
      managementLevel: 'DISPATCH',
      status: 'IN_PROGRESS',
      counterpartyId: kuzbass!.id,
      supplierName: 'АО «Кузбассуголь»',
      cargoDescription: 'Экспорт угля (6 партий)',
      cargoWeight: 26000,
      origin: 'Кузбасс',
      destination: 'Мерсин · Циндао · Таранто',
      plannedStart: new Date('2026-05-15'),
      actualStart: new Date('2026-05-16'),
      vesselCallId: infra.vesselCalls['204N'],
      notes: 'Мок: входящие составы (1–3), парк после разгрузки, исходящий 3901',
    },
  });

  const orderOil = await prisma.logisticsOrder.create({
    data: {
      orderNumber: 'ILS-2026-OIL',
      orderType: 'EXPORT_BULK',
      managementLevel: 'DISPATCH',
      status: 'IN_PROGRESS',
      counterpartyId: lukoil!.id,
      supplierName: 'ЛУКОЙЛ-НПЗ',
      cargoDescription: 'Экспорт нефти и нефтепродуктов (6 партий)',
      cargoWeight: 29100,
      origin: 'Самара (НПЗ)',
      destination: 'Мерсин · Циндао · Таранто',
      plannedStart: new Date('2026-05-14'),
      actualStart: new Date('2026-05-15'),
      vesselCallId: infra.vesselCalls['T101'],
      notes: 'Мок: ж/д цистерны, расформирование, доставленная партия без судозахода',
    },
  });

  for (const batch of MOCK_BATCHES) {
    const isCoal = batch.cargoCategory === 'COAL';
    const orderId = isCoal ? orderCoal.id : orderOil.id;
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
    entityId: orderCoal.id,
    orderId: orderCoal.id,
    message: 'Seed: 13 партий груза — ж/д составы, парк, исходящий состав',
  });
}

async function seedParkWagonsAndOutbound(infra: Infra) {
  const parkDefs = [
    {
      number: '53467901',
      trainNumber: '2845',
      track: 'Путь 15',
      wagonType: 'GONDOLA' as const,
      warehouseId: infra.whCoalId,
      inOutbound: true,
    },
    {
      number: '53467902',
      trainNumber: '2851',
      track: 'Путь 15',
      wagonType: 'GONDOLA' as const,
      warehouseId: infra.whCoalId,
      inOutbound: true,
    },
    {
      number: '75123501',
      trainNumber: 'N420',
      track: 'Путь 6',
      wagonType: 'TANK' as const,
      warehouseId: infra.whOilId,
      inOutbound: false,
    },
  ];

  const wagonIds: number[] = [];
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
    if (def.inOutbound) wagonIds.push(wagon.id);
  }

  const formedAt = new Date();
  const outbound = await prisma.trainConsist.create({
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

  await prisma.wagon.updateMany({
    where: { id: { in: wagonIds } },
    data: {
      trainConsistId: outbound.id,
      trainNumber: '3901',
      status: 'FORMING',
    },
  });
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
  if (!oilOrder) return;

  const blDoc = {
    fileName: 'Коносамент T103.txt',
    content: 'Архивный коносамент по доставленной партии OIL-2026-0006.',
    documentType: 'WAYBILL',
    description: 'Архив по доставленной партии',
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

async function main() {
  await seedUsers();
  await seedCounterparties();
  await seedDirectories();
  const infra = await seedTerminalInfrastructure();
  await normalizeLegacyTransportStatuses();
  await clearCargoData();
  await pruneStaleVesselCalls(['204N', '205N', '206N', 'T101', 'T102']);
  await seedMockBatches(infra);
  await seedParkWagonsAndOutbound(infra);
  await seedOrderDocuments();
  console.log(`ILS seed completed: ${MOCK_BATCHES.length} cargo batches + park/outbound wagons`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

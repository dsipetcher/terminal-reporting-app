import type {
  Container,
  Wagon,
  TrainConsist,
  VesselCall,
  Vessel,
  Berth,
  LogisticsOrder,
  RouteStage,
  LogisticsRoute,
  CargoTracking,
  CargoTrackingEvent,
  MaterialFlow,
  LogisticsOrderDocument,
} from '../types';
import { VesselCallStatus } from '../types';
import { cargoStatusFromStageType, trainConsistStatusForStage } from '../utils';

const now = new Date().toISOString();
const t0 = Date.now();

/**
 * Demo scenario (2026 export terminal):
 * - Cargo batches cover all 6 route stages + delivered
 * - Inbound train consists only for progress 1–3 (EN_ROUTE → ARRIVED → UNLOADING)
 * - Progress 4+: wagons disbanded to IN_PARK without consist
 * - Outbound consist 3901 in FORMING from park wagons
 * - Delivered batch has no vessel call (snapshot in route only)
 */
type BatchDef = {
  id: number;
  containerNumber: string;
  containerType: Container['containerType'];
  cargoCategory: Container['cargoCategory'];
  supplierName: string;
  cargoDescription: string;
  quantityTons: number;
  portOfLoading: string;
  portOfDischarge: string;
  warehouseId?: number;
  location?: string;
  vesselCallId?: number;
  shipVoyageSnapshot?: string;
  logisticsOrderId: number;
  progress: number | 'delivered';
  routeId: number;
  routeNumber: string;
  routeName: string;
  origin: string;
  destCode: string;
  destName: string;
  wagon?: { id: number; number: string; trainNumber: string; track: string };
  blNumber?: string;
};

const BATCHES: BatchDef[] = [
  // --- Уголь: все этапы ж/д → море ---
  {
    id: 1,
    containerNumber: 'COAL-2026-0001',
    containerType: 'COAL_ANTHRACITE',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь каменный марки Д',
    quantityTons: 4200,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    logisticsOrderId: 1,
    progress: 1,
    routeId: 1,
    routeNumber: 'RT-COAL-001',
    routeName: 'Уголь · в пути в терминал',
    origin: 'Кузбасс',
    destCode: 'TRMER',
    destName: 'Порт Мерсин',
    wagon: { id: 1, number: '53467821', trainNumber: '2845', track: 'Путь 12' },
  },
  {
    id: 2,
    containerNumber: 'COAL-2026-0002',
    containerType: 'COAL_COKING',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь коксующийся K',
    quantityTons: 3800,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    logisticsOrderId: 1,
    progress: 2,
    routeId: 2,
    routeNumber: 'RT-COAL-002',
    routeName: 'Коксующийся уголь · прибыл на ж/д фронт',
    origin: 'Кузбасс',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
    wagon: { id: 2, number: '53467822', trainNumber: '2851', track: 'Путь 8' },
  },
  {
    id: 3,
    containerNumber: 'COAL-2026-0003',
    containerType: 'COAL_ANTHRACITE',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь энергетический',
    quantityTons: 5100,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'ITGIT',
    warehouseId: 1,
    location: 'Сектор A-3',
    vesselCallId: 1,
    logisticsOrderId: 1,
    progress: 3,
    routeId: 3,
    routeNumber: 'RT-COAL-003',
    routeName: 'Уголь · разгрузка на терминале',
    origin: 'Кузбасс',
    destCode: 'ITGIT',
    destName: 'Порт Таранто',
    wagon: { id: 3, number: '53467823', trainNumber: '2860', track: 'Путь 12' },
  },
  {
    id: 4,
    containerNumber: 'COAL-2026-0004',
    containerType: 'COAL_ANTHRACITE',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь для экспорта в Турцию',
    quantityTons: 4600,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    warehouseId: 1,
    location: 'Сектор B-1',
    vesselCallId: 1,
    logisticsOrderId: 1,
    progress: 4,
    routeId: 4,
    routeNumber: 'RT-COAL-004',
    routeName: 'Уголь · на причале (вагон в парке)',
    origin: 'Кузбасс',
    destCode: 'TRMER',
    destName: 'Порт Мерсин',
    wagon: { id: 4, number: '53467824', trainNumber: '2872', track: 'Путь 14' },
  },
  {
    id: 5,
    containerNumber: 'COAL-2026-0005',
    containerType: 'COAL_COKING',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Коксующийся уголь — погрузка на судно',
    quantityTons: 3900,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    vesselCallId: 1,
    logisticsOrderId: 1,
    progress: 5,
    routeId: 5,
    routeNumber: 'RT-COAL-005',
    routeName: 'Уголь · на борту судна',
    origin: 'Кузбасс',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
  },
  {
    id: 6,
    containerNumber: 'COAL-2026-0006',
    containerType: 'COAL_ANTHRACITE',
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь · в пути морем',
    quantityTons: 4400,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    vesselCallId: 3,
    logisticsOrderId: 1,
    progress: 6,
    routeId: 6,
    routeNumber: 'RT-COAL-006',
    routeName: 'Уголь · морская перевозка',
    origin: 'Кузбасс',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
  },
  // --- Нефть: ж/д → склад → море ---
  {
    id: 7,
    containerNumber: 'OIL-2026-0001',
    containerType: 'OIL_CRUDE',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Нефть сырая (марка «Urals»)',
    quantityTons: 6200,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    logisticsOrderId: 2,
    progress: 1,
    routeId: 7,
    routeNumber: 'RT-OIL-001',
    routeName: 'Нефть · в пути в терминал',
    origin: 'Самара (НПЗ)',
    destCode: 'TRMER',
    destName: 'Порт Мерсин',
    wagon: { id: 5, number: '75123401', trainNumber: 'N401', track: 'Путь 3 (налив)' },
  },
  {
    id: 8,
    containerNumber: 'OIL-2026-0002',
    containerType: 'OIL_CRUDE',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Нефть (марка «Urals»), партия 2',
    quantityTons: 5800,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    logisticsOrderId: 2,
    progress: 2,
    routeId: 8,
    routeNumber: 'RT-OIL-002',
    routeName: 'Нефть · прибыл состав на ж/д фронт',
    origin: 'Самара (НПЗ)',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
    wagon: { id: 6, number: '75123402', trainNumber: 'N408', track: 'Путь 3' },
  },
  {
    id: 9,
    containerNumber: 'OIL-2026-0003',
    containerType: 'OIL_FUEL',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Мазут топочный М-100',
    quantityTons: 4100,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'ITGIT',
    warehouseId: 2,
    location: 'Резервуар R-2',
    vesselCallId: 4,
    logisticsOrderId: 2,
    progress: 3,
    routeId: 9,
    routeNumber: 'RT-OIL-003',
    routeName: 'Мазут · разгрузка на терминале',
    origin: 'Самара (НПЗ)',
    destCode: 'ITGIT',
    destName: 'Порт Таранто',
    wagon: { id: 7, number: '75123403', trainNumber: 'N415', track: 'Путь 5' },
  },
  {
    id: 10,
    containerNumber: 'OIL-2026-0004',
    containerType: 'OIL_FUEL',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Мазут · на причале налив',
    quantityTons: 4500,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    warehouseId: 2,
    location: 'Резервуар R-5',
    vesselCallId: 4,
    logisticsOrderId: 2,
    progress: 4,
    routeId: 10,
    routeNumber: 'RT-OIL-004',
    routeName: 'Мазут · причал (вагон в парке)',
    origin: 'Самара (НПЗ)',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
    wagon: { id: 8, number: '75123404', trainNumber: 'N422', track: 'Путь 5' },
  },
  {
    id: 11,
    containerNumber: 'OIL-2026-0005',
    containerType: 'OIL_CRUDE',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Нефть · погрузка на танкер',
    quantityTons: 5500,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    vesselCallId: 5,
    logisticsOrderId: 2,
    progress: 5,
    routeId: 11,
    routeNumber: 'RT-OIL-005',
    routeName: 'Нефть · на борту танкера',
    origin: 'Самара (НПЗ)',
    destCode: 'TRMER',
    destName: 'Порт Мерсин',
  },
  {
    id: 12,
    containerNumber: 'PETRO-2026-0001',
    containerType: 'PETROLEUM',
    cargoCategory: 'PETROLEUM',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Дизельное топливо Евро-5',
    quantityTons: 3200,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    logisticsOrderId: 2,
    progress: 1,
    routeId: 12,
    routeNumber: 'RT-PETRO-001',
    routeName: 'Дизель · формирование на НПЗ (без ж/д)',
    origin: 'Самара (НПЗ)',
    destCode: 'TRMER',
    destName: 'Порт Мерсин',
  },
  {
    id: 13,
    containerNumber: 'OIL-2026-0006',
    containerType: 'OIL_FUEL',
    cargoCategory: 'OIL',
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Топливный мазут — доставлено',
    quantityTons: 4800,
    portOfLoading: 'RUNVS',
    portOfDischarge: 'CNQDG',
    shipVoyageSnapshot: 'T103',
    logisticsOrderId: 2,
    progress: 'delivered',
    routeId: 13,
    routeNumber: 'RT-OIL-006',
    routeName: 'Мазут · цикл завершён',
    origin: 'Самара (НПЗ)',
    destCode: 'CNQDG',
    destName: 'Порт Циндао',
    blNumber: 'BL-OIL-006',
  },
];

/** Порожние вагоны в парке (без состава) для формирования исходящих */
const PARK_WAGONS: Array<{
  id: number;
  number: string;
  trainNumber: string;
  track: string;
  warehouseId: number;
  wagonType: Wagon['wagonType'];
}> = [
  { id: 9, number: '53467901', trainNumber: '2845', track: 'Путь 15', warehouseId: 1, wagonType: 'GONDOLA' as Wagon['wagonType'] },
  { id: 10, number: '53467902', trainNumber: '2851', track: 'Путь 15', warehouseId: 1, wagonType: 'GONDOLA' as Wagon['wagonType'] },
  { id: 11, number: '75123501', trainNumber: 'N420', track: 'Путь 6', warehouseId: 2, wagonType: 'TANK' as Wagon['wagonType'] },
];

const OUTBOUND_CONSIST_DEF = {
  id: 1,
  trainNumber: '3901',
  destination: 'Кемерово',
  track: 'Путь 16',
  wagonIds: [9, 10] as number[],
};

const STAGE_TYPES = ['SUPPLIER', 'RAIL_STATION', 'WAREHOUSE', 'BERTH', 'SHIP', 'PORT'] as const;

function stageTypeForProgress(progress: number | 'delivered'): string {
  if (progress === 'delivered') return 'PORT';
  return STAGE_TYPES[progress - 1] ?? 'SUPPLIER';
}

function isInboundConsistStage(progress: number | 'delivered'): boolean {
  return typeof progress === 'number' && progress >= 1 && progress <= 3;
}

function isPastUnloading(progress: number | 'delivered'): boolean {
  return progress === 'delivered' || (typeof progress === 'number' && progress >= 4);
}

function buildStages(routeId: number, batch: BatchDef, stageIdStart: number): RouteStage[] {
  const progress = batch.progress;
  const voyageByCallId: Record<number, string> = {
    1: '204N',
    2: '205N',
    3: '206N',
    4: 'T101',
    5: 'T102',
  };
  const labels = [
    `${batch.origin} · ж/д отправка`,
    batch.wagon
      ? `Поезд ${batch.wagon.trainNumber} · ${batch.wagon.track}`
      : 'Ж/д фронт терминала',
    batch.location ? `Склад / ${batch.location}` : 'Склад терминала',
    'Причал погрузки',
    batch.vesselCallId
      ? `Рейс ${voyageByCallId[batch.vesselCallId] ?? batch.vesselCallId}`
      : batch.shipVoyageSnapshot
        ? `NORD STREAM · рейс ${batch.shipVoyageSnapshot}`
        : 'Судно',
    batch.destName,
  ];
  const modes = ['RAIL', 'RAIL', 'WAREHOUSE', 'SEA', 'SEA', 'SEA'] as const;
  let sid = stageIdStart;
  return STAGE_TYPES.map((stageType, i) => {
    const seq = i + 1;
    let status: RouteStage['status'];
    if (progress === 'delivered') status = 'COMPLETED';
    else if (seq < progress) status = 'COMPLETED';
    else if (seq === progress) status = 'CURRENT';
    else status = 'PENDING';
    return {
      id: sid++,
      routeId,
      sequence: seq,
      stageType,
      locationCode: seq === 1 ? batch.origin : seq === 6 ? batch.destCode : `ST-${seq}`,
      locationName: labels[i],
      transportMode: modes[i],
      status,
      actualAt:
        status === 'COMPLETED' || status === 'CURRENT'
          ? new Date(t0 - (6 - seq) * 3600000).toISOString()
          : undefined,
      createdAt: now,
      updatedAt: now,
    };
  });
}

let stageIdCounter = 1;
export const demoRouteStages: RouteStage[] = BATCHES.flatMap((b) => {
  const stages = buildStages(b.routeId, b, stageIdCounter);
  stageIdCounter += 6;
  return stages;
});

export const demoLogisticsRoutes: LogisticsRoute[] = BATCHES.map((b) => ({
  id: b.routeId,
  routeNumber: b.routeNumber,
  name: b.routeName,
  orderId: b.logisticsOrderId,
  order: {
    id: b.logisticsOrderId,
    orderNumber: b.logisticsOrderId === 1 ? 'ILS-2026-COAL' : 'ILS-2026-OIL',
    status: 'IN_PROGRESS',
  },
  origin: b.origin,
  destination: b.destName,
  routeKind: 'EXPORT',
  status: b.progress === 'delivered' ? 'COMPLETED' : 'ACTIVE',
  stages: demoRouteStages.filter((s) => s.routeId === b.routeId),
  _count: { trackings: 1, stages: 6 },
  createdAt: now,
  updatedAt: now,
}));

export const demoContainers: Container[] = BATCHES.map((b) => {
  const stageType = stageTypeForProgress(b.progress);
  return {
    id: b.id,
    containerNumber: b.containerNumber,
    containerType: b.containerType,
    cargoCategory: b.cargoCategory,
    supplierName: b.supplierName,
    quantityTons: b.quantityTons,
    quantityUnit: 'TON',
    status: (b.progress === 'delivered'
      ? 'DELIVERED'
      : cargoStatusFromStageType(stageType)) as Container['status'],
    cargoDescription: b.cargoDescription,
    grossWeight: b.quantityTons,
    warehouseId: b.warehouseId,
    location: b.location,
    portOfLoading: b.portOfLoading,
    portOfDischarge: b.portOfDischarge,
    vesselCallId: b.progress === 'delivered' ? undefined : b.vesselCallId,
    logisticsOrderId: b.logisticsOrderId,
    logisticsOrder: {
      id: b.logisticsOrderId,
      orderNumber: b.logisticsOrderId === 1 ? 'ILS-2026-COAL' : 'ILS-2026-OIL',
      status: 'IN_PROGRESS',
    },
    blNumber: b.blNumber,
    createdAt: now,
    updatedAt: now,
  };
});

export const demoTrainConsists: TrainConsist[] = (() => {
  const inbound = BATCHES.filter(
    (b) => b.wagon && isInboundConsistStage(b.progress)
  ).map((b, idx) => {
    const stageType = stageTypeForProgress(b.progress);
    const status = (trainConsistStatusForStage(stageType) ??
      'EN_ROUTE') as TrainConsist['status'];
    return {
      id: idx + 1,
      trainNumber: b.wagon!.trainNumber,
      origin: b.origin,
      track: b.wagon!.track,
      direction: 'INBOUND' as const,
      arrivalAt: new Date(t0 - 86400000).toISOString(),
      status,
      _count: { wagons: 1 },
      createdAt: now,
      updatedAt: now,
    };
  });

  const outbound: TrainConsist = {
    id: inbound.length + 1,
    trainNumber: OUTBOUND_CONSIST_DEF.trainNumber,
    destination: OUTBOUND_CONSIST_DEF.destination,
    track: OUTBOUND_CONSIST_DEF.track,
    direction: 'OUTBOUND',
    arrivalAt: new Date(t0 - 3600000).toISOString(),
    formedAt: new Date(t0 - 3600000).toISOString(),
    status: 'FORMING' as TrainConsist['status'],
    _count: { wagons: OUTBOUND_CONSIST_DEF.wagonIds.length },
    createdAt: now,
    updatedAt: now,
  };

  return [...inbound, outbound];
})();

function buildBatchWagons(): Wagon[] {
  const fromBatches = BATCHES.filter((b) => b.wagon && b.progress !== 'delivered').map((b) => {
    const stageType = stageTypeForProgress(b.progress);
    const pastUnloading = isPastUnloading(b.progress);
    const status = (pastUnloading
      ? 'IN_PARK'
      : trainConsistStatusForStage(stageType) ?? 'EN_ROUTE') as Wagon['status'];
    const consist = pastUnloading
      ? undefined
      : demoTrainConsists.find(
          (c) => c.direction === 'INBOUND' && c.trainNumber === b.wagon!.trainNumber
        );
    return {
      id: b.wagon!.id,
      number: b.wagon!.number,
      wagonType: (b.cargoCategory === 'COAL' ? 'GONDOLA' : 'TANK') as Wagon['wagonType'],
      cargo: pastUnloading ? undefined : b.cargoDescription,
      cargoWeight: pastUnloading ? undefined : Math.round(b.quantityTons / 60),
      warehouseId: b.warehouseId,
      track: b.wagon!.track,
      trainNumber: b.wagon!.trainNumber,
      trainConsistId: consist?.id,
      arrivalAt: new Date(t0 - 86400000).toISOString(),
      status,
      containerId: pastUnloading ? undefined : b.id,
      createdAt: now,
      updatedAt: now,
    };
  });

  const outboundConsist = demoTrainConsists.find((c) => c.direction === 'OUTBOUND')!;
  const outboundWagons: Wagon[] = PARK_WAGONS.filter((w) =>
    OUTBOUND_CONSIST_DEF.wagonIds.includes(w.id)
  ).map((w) => ({
    id: w.id,
    number: w.number,
    wagonType: w.wagonType,
    warehouseId: w.warehouseId,
    track: w.track,
    trainNumber: OUTBOUND_CONSIST_DEF.trainNumber,
    trainConsistId: outboundConsist.id,
    arrivalAt: new Date(t0 - 86400000 * 2).toISOString(),
    status: 'FORMING' as Wagon['status'],
    createdAt: now,
    updatedAt: now,
  }));

  const parkOnly: Wagon[] = PARK_WAGONS.filter(
    (w) => !OUTBOUND_CONSIST_DEF.wagonIds.includes(w.id)
  ).map((w) => ({
    id: w.id,
    number: w.number,
    wagonType: w.wagonType,
    warehouseId: w.warehouseId,
    track: w.track,
    trainNumber: w.trainNumber,
    arrivalAt: new Date(t0 - 86400000 * 2).toISOString(),
    status: 'IN_PARK' as Wagon['status'],
    createdAt: now,
    updatedAt: now,
  }));

  return [...fromBatches, ...outboundWagons, ...parkOnly];
}

export const demoWagons: Wagon[] = buildBatchWagons();

demoTrainConsists.forEach((consist, idx) => {
  const linked = demoWagons.filter((w) => w.trainConsistId === consist.id);
  demoTrainConsists[idx] = { ...consist, wagons: linked, _count: { wagons: linked.length } };
});

export const demoLogisticsOrders: LogisticsOrder[] = [
  {
    id: 1,
    orderNumber: 'ILS-2026-COAL',
    orderType: 'EXPORT_BULK',
    managementLevel: 'DISPATCH',
    status: 'IN_PROGRESS',
    counterpartyId: 1,
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Экспорт угля (6 партий)',
    cargoWeight: 26000,
    origin: 'Кузбасс',
    destination: 'Мерсин · Циндао · Таранто',
    plannedStart: new Date(t0 - 86400000 * 5).toISOString(),
    actualStart: new Date(t0 - 86400000 * 4).toISOString(),
    vesselCallId: 1,
    notes: 'Демо: входящие составы, парк, исходящий состав 3901',
    _count: { materialFlows: 5, infoEvents: 2, documents: 2 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    orderNumber: 'ILS-2026-OIL',
    orderType: 'EXPORT_BULK',
    managementLevel: 'DISPATCH',
    status: 'IN_PROGRESS',
    counterpartyId: 2,
    supplierName: 'ЛУКОЙЛ-НПЗ',
    cargoDescription: 'Экспорт нефти и нефтепродуктов (6 партий)',
    cargoWeight: 29100,
    origin: 'Самара (НПЗ)',
    destination: 'Мерсин · Циндао · Таранто',
    plannedStart: new Date(t0 - 86400000 * 6).toISOString(),
    actualStart: new Date(t0 - 86400000 * 5).toISOString(),
    vesselCallId: 4,
    notes: 'Демо: ж/д цистерны, расформирование после разгрузки',
    _count: { materialFlows: 4, infoEvents: 1, documents: 1 },
    createdAt: now,
    updatedAt: now,
  },
];

export const demoOrderDocuments: LogisticsOrderDocument[] = [
  {
    id: 1,
    orderId: 1,
    fileName: 'Договор поставки угля 2026.pdf',
    storedName: 'demo-contract-coal.pdf',
    mimeType: 'application/pdf',
    fileSize: 245000,
    documentType: 'CONTRACT',
    description: 'Рамочный договор с поставщиком',
    uploadedAt: new Date(t0 - 86400000 * 3).toISOString(),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    orderId: 1,
    fileName: 'Спецификация партий.xlsx',
    storedName: 'demo-spec-coal.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 52000,
    documentType: 'OTHER',
    uploadedAt: new Date(t0 - 86400000 * 2).toISOString(),
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    orderId: 2,
    fileName: 'Коносамент T103.txt',
    storedName: 'demo-bl-oil.txt',
    mimeType: 'text/plain',
    fileSize: 4200,
    documentType: 'WAYBILL',
    description: 'Архив по доставленной партии OIL-2026-0006',
    uploadedAt: new Date(t0 - 86400000 * 8).toISOString(),
    createdAt: now,
    updatedAt: now,
  },
];

export const demoMaterialFlows: MaterialFlow[] = BATCHES.filter(
  (b) => b.progress !== 'delivered' && (b.progress as number) >= 2
).map((b, i) => {
  const atWarehouse = (b.progress as number) >= 3;
  return {
    id: i + 1,
    orderId: b.logisticsOrderId,
    order: {
      id: b.logisticsOrderId,
      orderNumber: b.logisticsOrderId === 1 ? 'ILS-2026-COAL' : 'ILS-2026-OIL',
    },
    flowType: atWarehouse ? 'STORAGE' : 'ARRIVAL',
    transportMode: atWarehouse ? 'WAREHOUSE' : 'RAIL',
    quantity: b.quantityTons,
    unit: 'TON',
    fromLocation: atWarehouse ? (b.wagon?.track ?? 'Ж/д фронт') : b.origin,
    toLocation: atWarehouse ? (b.location ?? 'Склад терминала') : (b.wagon?.track ?? 'Ж/д фронт'),
    containerId: b.id,
    container: { id: b.id, containerNumber: b.containerNumber },
    performedAt: new Date(t0 - i * 3600000).toISOString(),
    description: atWarehouse
      ? `Перемещение на склад после ж/д: ${b.cargoDescription}`
      : `Ж/д поступление ${b.origin} → терминал: ${b.cargoDescription}`,
    createdAt: now,
  };
});

let eventId = 1;
export const demoCargoTrackingEvents: CargoTrackingEvent[] = BATCHES.flatMap((b) => {
  const stages = demoRouteStages.filter((s) => s.routeId === b.routeId);
  const limit = b.progress === 'delivered' ? 6 : (b.progress as number);
  return stages.slice(0, limit).map((s, i, arr) => ({
    id: eventId++,
    trackingId: b.id,
    fromStageId: i > 0 ? arr[i - 1].id : undefined,
    toStageId: s.id,
    eventAt: s.actualAt ?? now,
    description: `Этап: ${s.locationName}`,
    createdAt: now,
  }));
});

export const demoCargoTrackings: CargoTracking[] = BATCHES.map((b) => {
  const stages = demoRouteStages.filter((s) => s.routeId === b.routeId);
  const currentStage =
    b.progress === 'delivered'
      ? stages[5]
      : stages.find((s) => s.sequence === b.progress);
  const container = demoContainers.find((c) => c.id === b.id)!;
  const route = demoLogisticsRoutes.find((r) => r.id === b.routeId)!;
  return {
    id: b.id,
    containerId: b.id,
    container: {
      id: container.id,
      containerNumber: container.containerNumber,
      status: container.status,
    },
    routeId: b.routeId,
    route,
    currentStageId: currentStage?.id,
    currentStage,
    status: b.progress === 'delivered' ? 'DELIVERED' : 'AT_STAGE',
    lastEventAt: currentStage?.actualAt ?? now,
    notes: b.cargoDescription,
    events: demoCargoTrackingEvents.filter((e) => e.trackingId === b.id),
    createdAt: now,
    updatedAt: now,
  };
});

export function buildDemoVesselCalls(vessels: Vessel[], berths: Berth[]): VesselCall[] {
  const bulk = vessels[0];
  const tanker = vessels[1];
  const bulkBerth = berths[0];
  const liquidBerth = berths[1];
  const defs = [
    {
      id: 1,
      vesselId: 1,
      vessel: bulk,
      voyageNumber: '204N',
      eta: new Date(t0 - 86400000 * 2).toISOString(),
      etd: new Date(t0 + 86400000).toISOString(),
      ata: new Date(t0 - 86400000 * 2).toISOString(),
      berthId: 1,
      berth: bulkBerth,
      status: VesselCallStatus.UNLOADING,
      agent: 'Новороссийское судовое агентство',
      purpose: 'Погрузка угля (204N)',
      _count: { containers: 3 },
    },
    {
      id: 2,
      vesselId: 1,
      vessel: bulk,
      voyageNumber: '205N',
      eta: new Date(t0 + 86400000 * 3).toISOString(),
      berthId: 1,
      berth: bulkBerth,
      status: VesselCallStatus.EN_ROUTE,
      agent: 'Новороссийское судовое агентство',
      purpose: 'Ожидаемый рейс в Италию',
      _count: { containers: 0 },
    },
    {
      id: 3,
      vesselId: 1,
      vessel: bulk,
      voyageNumber: '206N',
      eta: new Date(t0 - 86400000 * 12).toISOString(),
      etd: new Date(t0 - 86400000 * 10).toISOString(),
      ata: new Date(t0 - 86400000 * 12).toISOString(),
      atd: new Date(t0 - 86400000 * 10).toISOString(),
      berthId: 1,
      berth: bulkBerth,
      status: VesselCallStatus.DEPARTED,
      agent: 'Новороссийское судовое агентство',
      purpose: 'Уголь в море (206N)',
      _count: { containers: 1 },
    },
    {
      id: 4,
      vesselId: 2,
      vessel: tanker,
      voyageNumber: 'T101',
      eta: new Date(t0 - 86400000).toISOString(),
      ata: new Date(t0 - 86400000).toISOString(),
      berthId: 2,
      berth: liquidBerth,
      status: VesselCallStatus.UNLOADING,
      agent: 'Новороссийское судовое агентство',
      purpose: 'Налив нефти (T101)',
      _count: { containers: 2 },
    },
    {
      id: 5,
      vesselId: 2,
      vessel: tanker,
      voyageNumber: 'T102',
      eta: new Date(t0 + 86400000 * 2).toISOString(),
      ata: new Date(t0 + 86400000).toISOString(),
      berthId: 2,
      berth: liquidBerth,
      status: VesselCallStatus.ARRIVED,
      agent: 'Новороссийское судовое агентство',
      purpose: 'Налив нефти (T102)',
      _count: { containers: 1 },
    },
  ];
  return defs.map((d) => ({ ...d, createdAt: now, updatedAt: now })) as VesselCall[];
}

export const DEMO_BATCH_COUNT = BATCHES.length;

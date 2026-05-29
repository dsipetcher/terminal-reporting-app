import type {
  AuthResponse,
  Berth,
  Container,
  Counterparty,
  CreateUserRequest,
  UpdateUserRequest,
  DashboardStats,
  Truck,
  TruckVisit,
  User,
  Vessel,
  VesselCall,
  Wagon,
  Warehouse,
  LogisticsOrder,
  MaterialFlow,
  InfoFlowEvent,
  LogisticsRoute,
  RouteStage,
  CargoTracking,
  CargoTrackingEvent,
  ContainerTrackingResult,
  PortDirectory,
  CargoDirectory,
} from '../types';
import { cargoStatusFromStageType } from '../utils';
import { simulateNetwork } from './config';

const now = new Date().toISOString();

let nextId = 100;

const vessels: Vessel[] = [
  {
    id: 1,
    name: 'VOLGOBALT-204',
    imoNumber: '9703291',
    vesselType: 'BULK_CARRIER' as Vessel['vesselType'],
    deadweight: 62000,
    flag: 'RU',
    owner: 'Volga Shipping',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    name: 'NORD STREAM',
    imoNumber: '9312345',
    vesselType: 'TANKER' as Vessel['vesselType'],
    deadweight: 48000,
    flag: 'MT',
    owner: 'Tanker Line',
    createdAt: now,
    updatedAt: now,
  },
];

const berths: Berth[] = [
  {
    id: 1,
    number: 'BULK-1',
    name: 'Причал навалочных (уголь)',
    berthType: 'BULK' as Berth['berthType'],
    length: 280,
    depth: 15,
    maxDeadweight: 150000,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    number: 'LIQUID-1',
    name: 'Причал наливной (нефть)',
    berthType: 'LIQUID' as Berth['berthType'],
    length: 220,
    depth: 12,
    maxDeadweight: 100000,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

const warehouses: Warehouse[] = [
  {
    id: 1,
    number: 'COAL-YARD-1',
    name: 'Открытая площадка угля',
    capacity: 120000,
    warehouseType: 'COAL_YARD' as Warehouse['warehouseType'],
    zone: 'Уголь',
    load: 4200,
    _count: { wagons: 1, containers: 1 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    number: 'OIL-TANK-1',
    name: 'Резервуарный парк нефти',
    capacity: 80000,
    warehouseType: 'OIL_TANK' as Warehouse['warehouseType'],
    zone: 'Нефть',
    load: 0,
    _count: { wagons: 0, containers: 0 },
    createdAt: now,
    updatedAt: now,
  },
];

const counterparties: Counterparty[] = [
  {
    id: 1,
    code: 'KUZBASS-COAL',
    name: 'АО «Кузбассуголь»',
    partnerType: 'CLIENT',
    contact: 'Поставщик угля',
    _count: { orders: 1 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    code: 'AUTO-CARR',
    name: 'ООО «ЮгТрансАвто»',
    partnerType: 'CARRIER',
    _count: { orders: 0 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    code: 'RZD-TERM',
    name: 'РЖД-Терминал',
    partnerType: 'RAILWAY',
    _count: { orders: 1 },
    createdAt: now,
    updatedAt: now,
  },
];

const portDirectory: PortDirectory[] = [
  { id: 1, code: 'RUNVS', name: 'Новороссийск (терминал)', country: 'RU' },
  { id: 2, code: 'TRMER', name: 'Мерсин', country: 'TR' },
  { id: 3, code: 'CNQDG', name: 'Циндао', country: 'CN' },
  { id: 4, code: 'RUTAM', name: 'Тамань (ТТНГ)', country: 'RU' },
];

const cargoDirectory: CargoDirectory[] = [
  { id: 1, code: 'COAL-ANT', name: 'Уголь каменный', category: 'BULK' },
  { id: 2, code: 'COAL-COK', name: 'Уголь коксующийся', category: 'BULK' },
  { id: 3, code: 'OIL-CRUDE', name: 'Нефть сырая', category: 'LIQUID' },
  { id: 4, code: 'OIL-FUEL', name: 'Мазут / топливо', category: 'LIQUID' },
];

const logisticsOrders: LogisticsOrder[] = [
  {
    id: 1,
    orderNumber: 'ILS-DEMO-0001',
    orderType: 'EXPORT_BULK',
    managementLevel: 'DISPATCH',
    status: 'IN_PROGRESS',
    counterpartyId: 1,
    counterparty: counterparties[0],
    supplierName: 'АО «Кузбассуголь»',
    cargoDescription: 'Уголь каменный 4200 т',
    cargoWeight: 4200,
    origin: 'Кемерово (поставщик)',
    destination: 'TRMER',
    plannedStart: new Date(Date.now() - 86400000 * 2).toISOString(),
    plannedEnd: new Date(Date.now() + 86400000 * 5).toISOString(),
    actualStart: new Date(Date.now() - 86400000).toISOString(),
    vesselCallId: 1,
    notes: 'Экспорт: суша → склад → балкер → Мерсин',
    _count: { materialFlows: 2, infoEvents: 3 },
    createdAt: now,
    updatedAt: now,
  },
];

const routeStages: RouteStage[] = [
  { id: 1, routeId: 1, sequence: 1, stageType: 'SUPPLIER', locationCode: 'KUZBASS', locationName: 'АО «Кузбассуголь», Кемерово', transportMode: 'ROAD', status: 'COMPLETED', actualAt: new Date(Date.now() - 86400000 * 4).toISOString(), createdAt: now, updatedAt: now },
  { id: 2, routeId: 1, sequence: 2, stageType: 'RAIL_STATION', locationCode: 'RZD-12', locationName: 'Ж/д путь 12, разгрузка', transportMode: 'RAIL', status: 'COMPLETED', actualAt: new Date(Date.now() - 86400000 * 2).toISOString(), createdAt: now, updatedAt: now },
  { id: 3, routeId: 1, sequence: 3, stageType: 'ROAD_GATE', locationCode: 'GATE-1', locationName: 'Автовесовая терминала', transportMode: 'ROAD', status: 'COMPLETED', actualAt: new Date(Date.now() - 86400000).toISOString(), createdAt: now, updatedAt: now },
  { id: 4, routeId: 1, sequence: 4, stageType: 'WAREHOUSE', locationCode: 'COAL-YARD-1', locationName: 'Склад угля, сектор A-3', transportMode: 'WAREHOUSE', status: 'CURRENT', actualAt: new Date(Date.now() - 43200000).toISOString(), createdAt: now, updatedAt: now },
  { id: 5, routeId: 1, sequence: 5, stageType: 'BERTH', locationCode: 'BULK-1', locationName: 'Причал BULK-1', transportMode: 'SEA', status: 'PENDING', createdAt: now, updatedAt: now },
  { id: 6, routeId: 1, sequence: 6, stageType: 'SHIP', locationCode: 'VOLGOBALT', locationName: 'Балкер VOLGOBALT-204 / 204N', transportMode: 'SEA', status: 'PENDING', createdAt: now, updatedAt: now },
  { id: 7, routeId: 1, sequence: 7, stageType: 'PORT', locationCode: 'TRMER', locationName: 'Порт Мерсин (конечный)', transportMode: 'SEA', status: 'PENDING', createdAt: now, updatedAt: now },
];

const logisticsRoutes: LogisticsRoute[] = [
  {
    id: 1,
    routeNumber: 'RT-EXPORT-COAL-001',
    name: 'Уголь: поставщик → терминал → Мерсин',
    orderId: 1,
    order: { id: 1, orderNumber: 'ILS-DEMO-0001', status: 'IN_PROGRESS' },
    origin: 'KUZBASS',
    destination: 'TRMER',
    routeKind: 'EXPORT',
    status: 'ACTIVE',
    stages: routeStages,
    _count: { trackings: 1, stages: 7 },
    createdAt: now,
    updatedAt: now,
  },
];

const cargoTrackingEvents: CargoTrackingEvent[] = [
  { id: 1, trackingId: 1, toStageId: 1, eventAt: new Date(Date.now() - 86400000 * 4).toISOString(), description: 'Отгрузка у поставщика', createdAt: now },
  { id: 2, trackingId: 1, fromStageId: 1, toStageId: 2, eventAt: new Date(Date.now() - 86400000 * 2).toISOString(), description: 'Прибытие ж/д состава', createdAt: now },
  { id: 3, trackingId: 1, fromStageId: 2, toStageId: 3, eventAt: new Date(Date.now() - 86400000).toISOString(), description: 'Прибытие автотранспорта', createdAt: now },
  { id: 4, trackingId: 1, fromStageId: 3, toStageId: 4, eventAt: new Date(Date.now() - 43200000).toISOString(), description: 'Разгрузка на склад COAL-YARD-1', createdAt: now },
];

const cargoTrackings: CargoTracking[] = [
  {
    id: 1,
    containerId: 1,
    container: { id: 1, containerNumber: 'COAL-2026-0001', status: 'IN_STORAGE' as Container['status'] },
    routeId: 1,
    route: logisticsRoutes[0],
    currentStageId: 4,
    currentStage: routeStages[3],
    status: 'AT_STAGE',
    lastEventAt: new Date(Date.now() - 43200000).toISOString(),
    notes: 'На складе, ожидает погрузку на балкер',
    events: [...cargoTrackingEvents],
    createdAt: now,
    updatedAt: now,
  },
];

const materialFlows: MaterialFlow[] = [
  {
    id: 1,
    orderId: 1,
    order: { id: 1, orderNumber: 'ILS-DEMO-0001' },
    flowType: 'ARRIVAL',
    transportMode: 'RAIL',
    quantity: 4200,
    unit: 'TON',
    fromLocation: 'Кузбасс',
    toLocation: 'Ж/д путь 12',
    containerId: 1,
    container: { id: 1, containerNumber: 'COAL-2026-0001' },
    performedAt: new Date(Date.now() - 86400000).toISOString(),
    description: 'Прибытие угля по ж/д',
    createdAt: now,
  },
  {
    id: 2,
    orderId: 1,
    order: { id: 1, orderNumber: 'ILS-DEMO-0001' },
    flowType: 'STORAGE',
    transportMode: 'WAREHOUSE',
    quantity: 4200,
    unit: 'TON',
    fromLocation: 'Ж/д фронт',
    toLocation: 'COAL-YARD-1 / A-3',
    containerId: 1,
    container: { id: 1, containerNumber: 'COAL-2026-0001' },
    performedAt: new Date().toISOString(),
    description: 'Разгрузка на склад терминала',
    createdAt: now,
  },
];

const infoFlows: InfoFlowEvent[] = [
  { id: 1, ilsFunction: 'PLANNING', eventType: 'CREATE', entityType: 'LOGISTICS_ORDER', entityId: 1, orderId: 1, order: { id: 1, orderNumber: 'ILS-DEMO-0001' }, message: 'Заказ на экспорт угля', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 2, ilsFunction: 'PLANNING', eventType: 'CREATE', entityType: 'LOGISTICS_ROUTE', entityId: 1, orderId: 1, message: 'Маршрут RT-EXPORT-COAL-001 (7 этапов)', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 3, ilsFunction: 'CONTROL', eventType: 'CREATE', entityType: 'CARGO_TRACKING', entityId: 1, orderId: 1, message: 'Партия COAL-2026-0001 на отслеживании', createdAt: new Date().toISOString() },
];

const containers: Container[] = [
  {
    id: 1,
    containerNumber: 'COAL-2026-0001',
    containerType: 'COAL_ANTHRACITE' as Container['containerType'],
    cargoCategory: 'COAL',
    supplierName: 'АО «Кузбассуголь»',
    quantityTons: 4200,
    quantityUnit: 'TON',
    status: 'IN_STORAGE' as Container['status'],
    cargoDescription: 'Уголь каменный марки Д',
    grossWeight: 4200,
    warehouseId: 1,
    location: 'A-3',
    portOfLoading: 'RUNVS',
    portOfDischarge: 'TRMER',
    vesselCallId: 1,
    logisticsOrderId: 1,
    logisticsOrder: { id: 1, orderNumber: 'ILS-DEMO-0001', status: 'IN_PROGRESS' },
    createdAt: now,
    updatedAt: now,
  },
];

const vesselCalls: VesselCall[] = [
  {
    id: 1,
    vesselId: 1,
    vessel: vessels[0],
    voyageNumber: '204N',
    eta: new Date(Date.now() + 86400000).toISOString(),
    etd: new Date(Date.now() + 172800000).toISOString(),
    berthId: 1,
    berth: berths[0],
    status: 'BERTHED' as VesselCall['status'],
    agent: 'Novorossiysk Agency',
    purpose: 'Погрузка угля на экспорт',
    _count: { containers: 1 },
    createdAt: now,
    updatedAt: now,
  },
];

const wagons: Wagon[] = [
  {
    id: 1,
    number: '53467821',
    wagonType: 'GONDOLA' as Wagon['wagonType'],
    cargo: 'Уголь каменный',
    cargoWeight: 68,
    warehouseId: 1,
    track: 'Путь 12',
    trainNumber: '2845',
    arrivalAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'DEPARTED' as Wagon['status'],
    containerId: 1,
    createdAt: now,
    updatedAt: now,
  },
];

const trucks: Truck[] = [
  {
    id: 1,
    licensePlate: 'K123УГ177',
    truckType: 'DUMP_TRUCK' as Truck['truckType'],
    carrier: 'ЮгТрансАвто',
    driverName: 'Петров А.В.',
    _count: { visits: 1 },
    createdAt: now,
    updatedAt: now,
  },
];

const truckVisits: TruckVisit[] = [
  {
    id: 1,
    truckId: 1,
    truck: trucks[0],
    timeSlot: new Date(Date.now() - 3600000).toISOString(),
    purpose: 'Доставка угля на терминал',
    gateNumber: 'Автовесовая-1',
    status: 'COMPLETED' as TruckVisit['status'],
    containerId: 1,
    createdAt: now,
    updatedAt: now,
  },
];

function getDashboardStats(): DashboardStats {
  const activeStatuses = ['EXPECTED', 'ARRIVED', 'BERTHED', 'IN_OPERATION'];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return {
    vesselCallsTotal: vesselCalls.length,
    vesselCallsActive: vesselCalls.filter((call) => activeStatuses.includes(call.status)).length,
    containers: containers.length,
    wagons: wagons.length,
    trucks: trucks.length,
    warehouses: warehouses.length,
    ordersTotal: logisticsOrders.length,
    ordersPlanning: logisticsOrders.filter((o) => o.managementLevel === 'PLANNING').length,
    ordersDispatch: logisticsOrders.filter((o) => o.managementLevel === 'DISPATCH').length,
    ordersOperational: logisticsOrders.filter((o) => o.managementLevel === 'OPERATIONAL').length,
    ordersInProgress: logisticsOrders.filter((o) =>
      ['PLANNED', 'IN_PROGRESS'].includes(o.status)
    ).length,
    materialFlowsToday: materialFlows.filter(
      (f) => new Date(f.performedAt) >= todayStart
    ).length,
    infoEventsToday: infoFlows.filter((e) => new Date(e.createdAt) >= todayStart).length,
    counterpartiesCount: counterparties.length,
    activeRoutes: logisticsRoutes.filter((r) => r.status === 'ACTIVE').length,
    cargoOnRoutes: cargoTrackings.filter((t) =>
      ['REGISTERED', 'IN_TRANSIT', 'AT_STAGE'].includes(t.status)
    ).length,
  };
}

function pushInfoFlow(event: Omit<InfoFlowEvent, 'id' | 'createdAt'>) {
  infoFlows.unshift({
    ...event,
    id: nextId++,
    createdAt: new Date().toISOString(),
  });
}

function attachOrderRelations(order: LogisticsOrder): LogisticsOrder {
  const counterparty = order.counterpartyId
    ? counterparties.find((p) => p.id === order.counterpartyId)
    : undefined;
  return {
    ...order,
    counterparty: counterparty || order.counterparty,
    _count: order._count || {
      materialFlows: materialFlows.filter((f) => f.orderId === order.id).length,
      infoEvents: infoFlows.filter((e) => e.orderId === order.id).length,
    },
  };
}

function getRouteStages(routeId: number): RouteStage[] {
  return routeStages
    .filter((s) => s.routeId === routeId)
    .sort((a, b) => a.sequence - b.sequence);
}

function attachRouteRelations(route: LogisticsRoute): LogisticsRoute {
  const stages = getRouteStages(route.id);
  const trackings = cargoTrackings
    .filter((t) => t.routeId === route.id)
    .map(attachTrackingRelations);
  const order = route.orderId
    ? logisticsOrders.find((o) => o.id === route.orderId)
    : undefined;
  return {
    ...route,
    stages,
    trackings,
    order: order
      ? { id: order.id, orderNumber: order.orderNumber, status: order.status }
      : route.order,
    _count: {
      trackings: trackings.length,
      stages: stages.length,
    },
  };
}

function attachTrackingRelations(tracking: CargoTracking): CargoTracking {
  const container = containers.find((c) => c.id === tracking.containerId);
  const route = logisticsRoutes.find((r) => r.id === tracking.routeId);
  const currentStage = tracking.currentStageId
    ? routeStages.find((s) => s.id === tracking.currentStageId)
    : undefined;
  const events = cargoTrackingEvents
    .filter((e) => e.trackingId === tracking.id)
    .sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime());
  return {
    ...tracking,
    container: container
      ? { id: container.id, containerNumber: container.containerNumber, status: container.status }
      : tracking.container,
    route: route ? attachRouteRelations({ ...route, trackings: undefined }) : tracking.route,
    currentStage: currentStage || tracking.currentStage,
    events,
  };
}

function syncDemoCargoStatus(containerId: number, stageType: string) {
  const ci = containers.findIndex((c) => c.id === containerId);
  if (ci < 0) return;
  containers[ci] = {
    ...containers[ci],
    status: cargoStatusFromStageType(stageType) as Container['status'],
    updatedAt: now,
  };
}

function demoAdvanceTracking(trackingId: number): CargoTracking {
  const index = cargoTrackings.findIndex((t) => t.id === trackingId);
  const tracking = cargoTrackings[index];
  const stages = getRouteStages(tracking.routeId);
  const currentSeq = tracking.currentStageId
    ? routeStages.find((s) => s.id === tracking.currentStageId)?.sequence ?? 0
    : 0;
  const nextStage = stages.find((s) => s.sequence > currentSeq && s.status !== 'SKIPPED');

  if (!nextStage) {
    if (tracking.currentStageId) {
      const cur = routeStages.find((s) => s.id === tracking.currentStageId);
      if (cur) cur.status = 'COMPLETED';
    }
    cargoTrackings[index] = {
      ...tracking,
      status: 'DELIVERED',
      lastEventAt: new Date().toISOString(),
    };
    const ci = containers.findIndex((c) => c.id === tracking.containerId);
    if (ci >= 0) {
      containers[ci] = { ...containers[ci], status: 'DELIVERED', updatedAt: now };
    }
    cargoTrackingEvents.unshift({
      id: nextId++,
      trackingId,
      fromStageId: tracking.currentStageId,
      eventAt: new Date().toISOString(),
      description: 'Груз доставлен по маршруту',
      createdAt: now,
    });
    pushInfoFlow({
      ilsFunction: 'ACCOUNTING',
      eventType: 'STATUS_CHANGE',
      entityType: 'CARGO_TRACKING',
      entityId: trackingId,
      orderId: tracking.route?.orderId ?? 1,
      message: `Партия ${tracking.container.containerNumber} доставлена`,
    });
    const allDone = cargoTrackings
      .filter((t) => t.routeId === tracking.routeId)
      .every((t) => t.status === 'DELIVERED');
    if (allDone) {
      const ri = logisticsRoutes.findIndex((r) => r.id === tracking.routeId);
      if (ri >= 0) logisticsRoutes[ri] = { ...logisticsRoutes[ri], status: 'COMPLETED' };
    }
    return attachTrackingRelations(cargoTrackings[index]);
  }

  if (tracking.currentStageId) {
    const cur = routeStages.find((s) => s.id === tracking.currentStageId);
    if (cur) {
      cur.status = 'COMPLETED';
      cur.actualAt = new Date().toISOString();
    }
  }
  nextStage.status = 'CURRENT';
  nextStage.actualAt = nextStage.actualAt ?? new Date().toISOString();

  syncDemoCargoStatus(tracking.containerId, nextStage.stageType);
  const fromName = tracking.currentStage?.locationName ?? 'старт';
  cargoTrackings[index] = {
    ...tracking,
    currentStageId: nextStage.id,
    currentStage: nextStage,
    status: 'AT_STAGE',
    lastEventAt: new Date().toISOString(),
  };
  cargoTrackingEvents.unshift({
    id: nextId++,
    trackingId,
    fromStageId: tracking.currentStageId,
    toStageId: nextStage.id,
    eventAt: new Date().toISOString(),
    description: `Перемещение: ${fromName} → ${nextStage.locationName}`,
    createdAt: now,
  });
  pushInfoFlow({
    ilsFunction: 'CONTROL',
    eventType: 'STATUS_CHANGE',
    entityType: 'CARGO_TRACKING',
    entityId: trackingId,
    orderId: tracking.routeId === 1 ? 1 : undefined,
    message: `Партия ${tracking.container.containerNumber}: ${cargoStatusFromStageType(nextStage.stageType)} — «${nextStage.locationName}»`,
  });

  return attachTrackingRelations(cargoTrackings[index]);
}

function attachVesselCallRelations(call: VesselCall): VesselCall {
  const vessel = vessels.find((item) => item.id === call.vesselId);
  const berth = call.berthId ? berths.find((item) => item.id === call.berthId) : undefined;
  return {
    ...call,
    vessel: vessel || call.vessel,
    berth: berth || call.berth,
    _count: call._count || { containers: containers.filter((c) => c.vesselCallId === call.id).length },
  };
}

export const demoDashboardApi = {
  getStats: () => simulateNetwork(getDashboardStats()),
};

export const demoVesselsApi = {
  getAll: () => simulateNetwork([...vessels]),
  getById: (id: number) => simulateNetwork(vessels.find((item) => item.id === id)!),
  create: (data: Partial<Vessel>) => {
    const item: Vessel = {
      id: nextId++,
      name: data.name || 'New Vessel',
      imoNumber: data.imoNumber || `IMO${nextId}`,
      vesselType: data.vesselType || ('CONTAINER' as Vessel['vesselType']),
      createdAt: now,
      updatedAt: now,
      ...data,
    } as Vessel;
    vessels.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<Vessel>) => {
    const index = vessels.findIndex((item) => item.id === id);
    vessels[index] = { ...vessels[index], ...data, updatedAt: now };
    return simulateNetwork(vessels[index]);
  },
  delete: (id: number) => {
    const index = vessels.findIndex((item) => item.id === id);
    vessels.splice(index, 1);
    return simulateNetwork(undefined);
  },
};

export const demoVesselCallsApi = {
  getAll: () => simulateNetwork(vesselCalls.map(attachVesselCallRelations)),
  getById: (id: number) =>
    simulateNetwork(attachVesselCallRelations(vesselCalls.find((item) => item.id === id)!)),
  create: (data: Partial<VesselCall>) => {
    const item = attachVesselCallRelations({
      id: nextId++,
      vesselId: data.vesselId!,
      voyageNumber: data.voyageNumber || `V${nextId}`,
      eta: data.eta || now,
      etd: data.etd,
      berthId: data.berthId,
      status: (data.status || 'EXPECTED') as VesselCall['status'],
      agent: data.agent,
      purpose: data.purpose,
      createdAt: now,
      updatedAt: now,
    } as VesselCall);
    vesselCalls.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<VesselCall>) => {
    const index = vesselCalls.findIndex((item) => item.id === id);
    vesselCalls[index] = attachVesselCallRelations({ ...vesselCalls[index], ...data, updatedAt: now });
    return simulateNetwork(vesselCalls[index]);
  },
  updateStatus: (id: number, status: string, berthId?: number) => {
    const index = vesselCalls.findIndex((item) => item.id === id);
    const update: Partial<VesselCall> = {
      status: status as VesselCall['status'],
      updatedAt: now,
    };
    if (status === 'BERTHED' && berthId) {
      update.berthId = berthId;
    }
    vesselCalls[index] = attachVesselCallRelations({
      ...vesselCalls[index],
      ...update,
    });
    return simulateNetwork(vesselCalls[index]);
  },
  delete: (id: number) => {
    const index = vesselCalls.findIndex((item) => item.id === id);
    vesselCalls.splice(index, 1);
    return simulateNetwork(undefined);
  },
};

export const demoBerthsApi = {
  getAll: () => simulateNetwork([...berths]),
  getById: (id: number) => simulateNetwork(berths.find((item) => item.id === id)!),
  create: (data: Partial<Berth>) => {
    const item: Berth = {
      id: nextId++,
      number: data.number || `B-${nextId}`,
      berthType: data.berthType || ('GENERAL' as Berth['berthType']),
      length: data.length || 200,
      depth: data.depth || 10,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      ...data,
    } as Berth;
    berths.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<Berth>) => {
    const index = berths.findIndex((item) => item.id === id);
    berths[index] = { ...berths[index], ...data, updatedAt: now };
    return simulateNetwork(berths[index]);
  },
  delete: (id: number) => {
    const index = berths.findIndex((item) => item.id === id);
    berths.splice(index, 1);
    return simulateNetwork(undefined);
  },
};

export const demoContainersApi = {
  getAll: () => simulateNetwork([...containers]),
  getById: (id: number) => simulateNetwork(containers.find((item) => item.id === id)!),
  getByNumber: (containerNumber: string) =>
    simulateNetwork(containers.find((item) => item.containerNumber === containerNumber)!),
  create: (data: Partial<Container>) => {
    const item: Container = {
      id: nextId++,
      containerNumber: data.containerNumber || `DEMO${nextId}`,
      containerType: data.containerType || ('TWENTY_GP' as Container['containerType']),
      status: (data.status || 'IN_TERMINAL') as Container['status'],
      createdAt: now,
      updatedAt: now,
      ...data,
    } as Container;
    containers.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<Container>) => {
    const index = containers.findIndex((item) => item.id === id);
    containers[index] = { ...containers[index], ...data, updatedAt: now };
    return simulateNetwork(containers[index]);
  },
  move: (id: number, data: { warehouseId?: number; location?: string; status?: string }) => {
    const index = containers.findIndex((item) => item.id === id);
    containers[index] = {
      ...containers[index],
      ...data,
      status: (data.status || containers[index].status) as Container['status'],
      updatedAt: now,
    };
    return simulateNetwork(containers[index]);
  },
  delete: (id: number) => {
    const index = containers.findIndex((item) => item.id === id);
    containers.splice(index, 1);
    return simulateNetwork(undefined);
  },
};

export const demoTrucksApi = {
  getAll: () => simulateNetwork([...trucks]),
  getById: (id: number) => simulateNetwork(trucks.find((item) => item.id === id)!),
  create: (data: Partial<Truck>) => {
    const item: Truck = {
      id: nextId++,
      licensePlate: data.licensePlate || `X${nextId}XX77`,
      truckType: data.truckType || ('TRUCK' as Truck['truckType']),
      carrier: data.carrier || 'Demo Carrier',
      createdAt: now,
      updatedAt: now,
      ...data,
    } as Truck;
    trucks.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<Truck>) => {
    const index = trucks.findIndex((item) => item.id === id);
    trucks[index] = { ...trucks[index], ...data, updatedAt: now };
    return simulateNetwork(trucks[index]);
  },
  delete: (id: number) => {
    const index = trucks.findIndex((item) => item.id === id);
    trucks.splice(index, 1);
    return simulateNetwork(undefined);
  },
};

export const demoTruckVisitsApi = {
  getAll: () => simulateNetwork(truckVisits.map((visit) => ({ ...visit, truck: trucks.find((t) => t.id === visit.truckId) || visit.truck }))),
  getById: (id: number) => simulateNetwork(truckVisits.find((item) => item.id === id)!),
  create: (data: Partial<TruckVisit>) => {
    const truck = trucks.find((item) => item.id === data.truckId);
    const item: TruckVisit = {
      id: nextId++,
      truckId: data.truckId!,
      truck: truck || trucks[0],
      timeSlot: data.timeSlot || now,
      purpose: data.purpose || 'Операция',
      status: (data.status || 'SCHEDULED') as TruckVisit['status'],
      createdAt: now,
      updatedAt: now,
      ...data,
    } as TruckVisit;
    truckVisits.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<TruckVisit>) => {
    const index = truckVisits.findIndex((item) => item.id === id);
    truckVisits[index] = { ...truckVisits[index], ...data, updatedAt: now };
    return simulateNetwork(truckVisits[index]);
  },
  checkIn: (id: number) => {
    const index = truckVisits.findIndex((item) => item.id === id);
    truckVisits[index] = {
      ...truckVisits[index],
      status: 'ARRIVED' as TruckVisit['status'],
      timeIn: now,
      updatedAt: now,
    };
    return simulateNetwork(truckVisits[index]);
  },
  checkOut: (id: number) => {
    const index = truckVisits.findIndex((item) => item.id === id);
    truckVisits[index] = {
      ...truckVisits[index],
      status: 'COMPLETED' as TruckVisit['status'],
      timeOut: now,
      updatedAt: now,
    };
    return simulateNetwork(truckVisits[index]);
  },
  delete: (id: number) => {
    const index = truckVisits.findIndex((item) => item.id === id);
    truckVisits.splice(index, 1);
    return simulateNetwork(undefined);
  },
};

export const demoWarehousesApi = {
  getAll: () => simulateNetwork([...warehouses]),
  getById: (id: number) => simulateNetwork(warehouses.find((item) => item.id === id)!),
  create: (data: Partial<Warehouse>) => {
    const item: Warehouse = {
      id: nextId++,
      number: data.number || `W-${nextId}`,
      capacity: data.capacity || 100,
      warehouseType: data.warehouseType || ('OPEN_YARD' as Warehouse['warehouseType']),
      load: 0,
      _count: { wagons: 0, containers: 0 },
      createdAt: now,
      updatedAt: now,
      ...data,
    } as Warehouse;
    warehouses.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<Warehouse>) => {
    const index = warehouses.findIndex((item) => item.id === id);
    warehouses[index] = { ...warehouses[index], ...data, updatedAt: now };
    return simulateNetwork(warehouses[index]);
  },
  delete: (id: number) => {
    const index = warehouses.findIndex((item) => item.id === id);
    warehouses.splice(index, 1);
    return simulateNetwork(undefined);
  },
};

export const demoWagonsApi = {
  getAll: () => simulateNetwork([...wagons]),
  getById: (id: number) => simulateNetwork(wagons.find((item) => item.id === id)!),
  create: (data: Partial<Wagon>) => {
    const item: Wagon = {
      id: nextId++,
      number: data.number || `${nextId}${nextId}${nextId}${nextId}${nextId}${nextId}${nextId}${nextId}`,
      wagonType: data.wagonType || ('PLATFORM' as Wagon['wagonType']),
      arrivalAt: data.arrivalAt || now,
      status: (data.status || 'EXPECTED') as Wagon['status'],
      createdAt: now,
      updatedAt: now,
      ...data,
    } as Wagon;
    wagons.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<Wagon>) => {
    const index = wagons.findIndex((item) => item.id === id);
    wagons[index] = { ...wagons[index], ...data, updatedAt: now };
    return simulateNetwork(wagons[index]);
  },
  updateStatus: (id: number, status: string) => {
    const index = wagons.findIndex((item) => item.id === id);
    wagons[index] = { ...wagons[index], status: status as Wagon['status'], updatedAt: now };
    return simulateNetwork(wagons[index]);
  },
  delete: (id: number) => {
    const index = wagons.findIndex((item) => item.id === id);
    wagons.splice(index, 1);
    return simulateNetwork(undefined);
  },
};

export const demoCounterpartiesApi = {
  getAll: (params?: { partnerType?: string }) => {
    let list = [...counterparties];
    if (params?.partnerType && params.partnerType !== 'ALL') {
      list = list.filter((p) => p.partnerType === params.partnerType);
    }
    return simulateNetwork(
      list.map((p) => ({
        ...p,
        _count: { orders: logisticsOrders.filter((o) => o.counterpartyId === p.id).length },
      }))
    );
  },
  create: (data: Partial<Counterparty>) => {
    const item: Counterparty = {
      id: nextId++,
      code: data.code || `CP-${nextId}`,
      name: data.name || 'Новый контрагент',
      partnerType: data.partnerType || 'CLIENT',
      inn: data.inn,
      contact: data.contact,
      _count: { orders: 0 },
      createdAt: now,
      updatedAt: now,
    };
    counterparties.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<Counterparty>) => {
    const index = counterparties.findIndex((p) => p.id === id);
    counterparties[index] = { ...counterparties[index], ...data, updatedAt: now };
    return simulateNetwork(counterparties[index]);
  },
  delete: (id: number) => {
    const index = counterparties.findIndex((p) => p.id === id);
    counterparties.splice(index, 1);
    return simulateNetwork(undefined);
  },
};

export const demoDirectoriesApi = {
  getPorts: () => simulateNetwork([...portDirectory]),
  getCargo: () => simulateNetwork([...cargoDirectory]),
};

export const demoLogisticsOrdersApi = {
  getAll: (params?: { status?: string; managementLevel?: string; orderType?: string }) => {
    let list = logisticsOrders.map(attachOrderRelations);
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((o) => o.status === params.status);
    }
    if (params?.managementLevel && params.managementLevel !== 'ALL') {
      list = list.filter((o) => o.managementLevel === params.managementLevel);
    }
    if (params?.orderType && params.orderType !== 'ALL') {
      list = list.filter((o) => o.orderType === params.orderType);
    }
    return simulateNetwork(list);
  },
  getById: (id: number) =>
    simulateNetwork(attachOrderRelations(logisticsOrders.find((o) => o.id === id)!)),
  create: (data: Partial<LogisticsOrder>) => {
    const item = attachOrderRelations({
      id: nextId++,
      orderNumber: data.orderNumber || `ILS-DEMO-${nextId}`,
      orderType: data.orderType || 'EXPORT_BULK',
      managementLevel: data.managementLevel || 'PLANNING',
      status: (data.status || 'DRAFT') as LogisticsOrder['status'],
      counterpartyId: data.counterpartyId,
      supplierName: data.supplierName,
      cargoDescription: data.cargoDescription,
      cargoWeight: data.cargoWeight,
      origin: data.origin,
      destination: data.destination,
      plannedStart: data.plannedStart,
      plannedEnd: data.plannedEnd,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    } as LogisticsOrder);
    logisticsOrders.push(item);
    pushInfoFlow({
      ilsFunction: 'PLANNING',
      eventType: 'CREATE',
      entityType: 'LOGISTICS_ORDER',
      entityId: item.id,
      orderId: item.id,
      message: `Создан заказ ${item.orderNumber}`,
    });
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<LogisticsOrder>) => {
    const index = logisticsOrders.findIndex((o) => o.id === id);
    logisticsOrders[index] = attachOrderRelations({
      ...logisticsOrders[index],
      ...data,
      updatedAt: now,
    });
    pushInfoFlow({
      ilsFunction: 'REGULATION',
      eventType: 'UPDATE',
      entityType: 'LOGISTICS_ORDER',
      entityId: id,
      orderId: id,
      message: `Обновлён заказ ${logisticsOrders[index].orderNumber}`,
    });
    return simulateNetwork(logisticsOrders[index]);
  },
  updateStatus: (id: number, status: string) => {
    const index = logisticsOrders.findIndex((o) => o.id === id);
    logisticsOrders[index] = attachOrderRelations({
      ...logisticsOrders[index],
      status: status as LogisticsOrder['status'],
      actualStart:
        status === 'IN_PROGRESS' ? new Date().toISOString() : logisticsOrders[index].actualStart,
      actualEnd: status === 'COMPLETED' ? new Date().toISOString() : logisticsOrders[index].actualEnd,
      updatedAt: now,
    });
    pushInfoFlow({
      ilsFunction: 'REGULATION',
      eventType: 'STATUS_CHANGE',
      entityType: 'LOGISTICS_ORDER',
      entityId: id,
      orderId: id,
      message: `Статус заказа: ${status}`,
    });
    return simulateNetwork(logisticsOrders[index]);
  },
  delete: (id: number) => {
    const index = logisticsOrders.findIndex((o) => o.id === id);
    logisticsOrders.splice(index, 1);
    containers.forEach((c, i) => {
      if (c.logisticsOrderId === id) containers[i] = { ...c, logisticsOrderId: undefined };
    });
    return simulateNetwork(undefined);
  },
};

export const demoMaterialFlowsApi = {
  getAll: (params?: { orderId?: number; transportMode?: string }) => {
    let list = [...materialFlows];
    if (params?.orderId) list = list.filter((f) => f.orderId === params.orderId);
    if (params?.transportMode && params.transportMode !== 'ALL') {
      list = list.filter((f) => f.transportMode === params.transportMode);
    }
    return simulateNetwork(list);
  },
  create: (data: Partial<MaterialFlow>) => {
    const container = data.containerId
      ? containers.find((c) => c.id === data.containerId)
      : undefined;
    const order = data.orderId ? logisticsOrders.find((o) => o.id === data.orderId) : undefined;
    const item: MaterialFlow = {
      id: nextId++,
      orderId: data.orderId,
      order: order ? { id: order.id, orderNumber: order.orderNumber } : undefined,
      flowType: data.flowType || 'ARRIVAL',
      transportMode: data.transportMode || 'SEA',
      quantity: data.quantity,
      unit: data.unit,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      containerId: data.containerId,
      container: container
        ? { id: container.id, containerNumber: container.containerNumber }
        : undefined,
      performedAt: data.performedAt || new Date().toISOString(),
      description: data.description,
      createdAt: now,
    };
    materialFlows.unshift(item);
    pushInfoFlow({
      ilsFunction: 'ACCOUNTING',
      eventType: 'CREATE',
      entityType: 'MATERIAL_FLOW',
      entityId: item.id,
      orderId: item.orderId,
      message: `Материальный поток: ${item.flowType}`,
    });
    return simulateNetwork(item);
  },
};

export const demoInfoFlowsApi = {
  getAll: (params?: { ilsFunction?: string; orderId?: number; limit?: number }) => {
    let list = [...infoFlows];
    if (params?.ilsFunction && params.ilsFunction !== 'ALL') {
      list = list.filter((e) => e.ilsFunction === params.ilsFunction);
    }
    if (params?.orderId) list = list.filter((e) => e.orderId === params.orderId);
    if (params?.limit) list = list.slice(0, params.limit);
    return simulateNetwork(list);
  },
};

export const demoLogisticsRoutesApi = {
  getAll: (params?: { status?: string; orderId?: number }) => {
    let list = logisticsRoutes.map(attachRouteRelations);
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((r) => r.status === params.status);
    }
    if (params?.orderId) list = list.filter((r) => r.orderId === params.orderId);
    return simulateNetwork(list);
  },
  getById: (id: number) =>
    simulateNetwork(attachRouteRelations(logisticsRoutes.find((r) => r.id === id)!)),
  create: (data: Partial<LogisticsRoute> & { stages?: Partial<RouteStage>[] }) => {
    const routeId = nextId++;
    const defaultStages: Partial<RouteStage>[] = data.stages?.length
      ? data.stages
      : [
          { sequence: 1, stageType: 'SUPPLIER', locationCode: 'SUP', locationName: 'Поставщик', transportMode: 'ROAD', status: 'COMPLETED' },
          { sequence: 2, stageType: 'RAIL_STATION', locationCode: 'RZD', locationName: 'Ж/д фронт', transportMode: 'RAIL', status: 'COMPLETED' },
          { sequence: 3, stageType: 'ROAD_GATE', locationCode: 'GATE', locationName: 'Автовесовая', transportMode: 'ROAD', status: 'COMPLETED' },
          { sequence: 4, stageType: 'WAREHOUSE', locationCode: 'WH', locationName: 'Склад терминала', transportMode: 'WAREHOUSE', status: 'CURRENT' },
          { sequence: 5, stageType: 'BERTH', locationCode: 'BERTH', locationName: 'Причал погрузки', transportMode: 'SEA', status: 'PENDING' },
          { sequence: 6, stageType: 'SHIP', locationCode: 'SHIP', locationName: 'Судно', transportMode: 'SEA', status: 'PENDING' },
          { sequence: 7, stageType: 'PORT', locationCode: data.destination || 'DEST', locationName: `Порт ${data.destination || 'назначения'}`, transportMode: 'SEA', status: 'PENDING' },
        ];
    defaultStages.forEach((s, i) => {
      routeStages.push({
        id: nextId++,
        routeId,
        sequence: Number(s.sequence) || i + 1,
        stageType: (s.stageType || 'TERMINAL') as RouteStage['stageType'],
        locationCode: String(s.locationCode || `LOC-${i}`),
        locationName: String(s.locationName || `Этап ${i + 1}`),
        transportMode: s.transportMode as RouteStage['transportMode'],
        plannedAt: s.plannedAt,
        status: (i === 0 ? 'CURRENT' : 'PENDING') as RouteStage['status'],
        createdAt: now,
        updatedAt: now,
      });
    });
    const item: LogisticsRoute = {
      id: routeId,
      routeNumber: data.routeNumber || `RT-DEMO-${routeId}`,
      name: data.name,
      orderId: data.orderId,
      origin: data.origin || 'SUPPLIER',
      destination: data.destination || 'PORT-DEST',
      routeKind: 'EXPORT',
      status: (data.status || 'PLANNED') as LogisticsRoute['status'],
      createdAt: now,
      updatedAt: now,
    };
    logisticsRoutes.push(item);
    pushInfoFlow({
      ilsFunction: 'PLANNING',
      eventType: 'CREATE',
      entityType: 'LOGISTICS_ROUTE',
      entityId: routeId,
      orderId: data.orderId,
      message: `Создан маршрут ${item.routeNumber}`,
    });
    return simulateNetwork(attachRouteRelations(item));
  },
  trackByBatch: (batchNumber: string): Promise<ContainerTrackingResult> => {
    const normalized = batchNumber.toUpperCase().trim();
    const container = containers.find((c) => c.containerNumber === normalized);
    if (!container) {
      return Promise.reject(new Error('Cargo batch not found'));
    }
    const trackings = cargoTrackings
      .filter((t) => t.containerId === container.id)
      .map(attachTrackingRelations);
    const enriched: Container = {
      ...container,
      warehouse: container.warehouseId
        ? warehouses.find((w) => w.id === container.warehouseId)
        : undefined,
      vesselCall: container.vesselCallId
        ? attachVesselCallRelations(vesselCalls.find((vc) => vc.id === container.vesselCallId)!)
        : undefined,
      logisticsOrder: container.logisticsOrderId
        ? attachOrderRelations(logisticsOrders.find((o) => o.id === container.logisticsOrderId)!)
        : container.logisticsOrder,
    };
    return simulateNetwork({ container: enriched, trackings });
  },
  trackByContainer: (batchNumber: string) => demoLogisticsRoutesApi.trackByBatch(batchNumber),
  addTracking: (routeId: number, containerId: number, notes?: string) => {
    const route = logisticsRoutes.find((r) => r.id === routeId);
    const container = containers.find((c) => c.id === containerId);
    if (!route || !container) {
      return Promise.reject(new Error('Route or container not found'));
    }
    if (cargoTrackings.some((t) => t.containerId === containerId && t.routeId === routeId)) {
      return Promise.reject(new Error('Already tracking on this route'));
    }
    const stages = getRouteStages(routeId);
    const firstStage = stages[0];
    const trackingId = nextId++;
    const item: CargoTracking = {
      id: trackingId,
      containerId,
      container: {
        id: container.id,
        containerNumber: container.containerNumber,
        status: container.status,
      },
      routeId,
      currentStageId: firstStage?.id,
      currentStage: firstStage,
      status: firstStage ? 'AT_STAGE' : 'REGISTERED',
      lastEventAt: new Date().toISOString(),
      notes,
      createdAt: now,
      updatedAt: now,
    };
    cargoTrackings.push(item);
    if (firstStage) {
      cargoTrackingEvents.push({
        id: nextId++,
        trackingId,
        toStageId: firstStage.id,
        eventAt: new Date().toISOString(),
        description: `Старт на этапе: ${firstStage.locationName}`,
        createdAt: now,
      });
    }
    if (route.status === 'PLANNED') {
      const ri = logisticsRoutes.findIndex((r) => r.id === routeId);
      logisticsRoutes[ri] = { ...logisticsRoutes[ri], status: 'ACTIVE' };
    }
    pushInfoFlow({
      ilsFunction: 'CONTROL',
      eventType: 'CREATE',
      entityType: 'CARGO_TRACKING',
      entityId: trackingId,
      orderId: route.orderId,
      message: `Партия ${container.containerNumber} на маршруте ${route.routeNumber}`,
    });
    return simulateNetwork(attachTrackingRelations(item));
  },
  advanceTracking: (trackingId: number) => simulateNetwork(demoAdvanceTracking(trackingId)),
  delete: (id: number) => {
    const index = logisticsRoutes.findIndex((r) => r.id === id);
    logisticsRoutes.splice(index, 1);
    const stageIds = routeStages.filter((s) => s.routeId === id).map((s) => s.id);
    stageIds.forEach((sid) => {
      const si = routeStages.findIndex((s) => s.id === sid);
      if (si >= 0) routeStages.splice(si, 1);
    });
    cargoTrackings.splice(
      0,
      cargoTrackings.length,
      ...cargoTrackings.filter((t) => t.routeId !== id)
    );
    return simulateNetwork(undefined);
  },
};

const demoUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    role: 'ADMIN',
    fullName: 'Администратор ИЛС (демо)',
    department: 'ИТ',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    username: 'planner',
    role: 'PLANNER',
    fullName: 'Плановик (демо)',
    department: 'Планирование',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    username: 'dispatcher',
    role: 'DISPATCHER',
    fullName: 'Диспетчер (демо)',
    department: 'Диспетчерская',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 4,
    username: 'warehouse',
    role: 'WAREHOUSE',
    fullName: 'Кладовщик (демо)',
    department: 'Склад',
    createdAt: now,
    updatedAt: now,
  },
];

let demoUserId = 4;

export const demoAuthApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    await simulateNetwork(null);

    if (username === 'admin' && password === 'admin') {
      return {
        token: 'demo-admin-token',
        user: demoUsers[0],
      };
    }

    if (username === 'planner' && password === 'planner') {
      return { token: 'demo-planner-token', user: demoUsers[1] };
    }

    if (username === 'dispatcher' && password === 'dispatcher') {
      return {
        token: 'demo-dispatcher-token',
        user: demoUsers[2],
      };
    }

    if (username === 'warehouse' && password === 'warehouse') {
      return { token: 'demo-warehouse-token', user: demoUsers[3] };
    }

    const user = demoUsers.find((item) => item.username === username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    return {
      token: `demo-token-${user.id}`,
      user,
    };
  },
  getMe: async (): Promise<User> => {
    const stored = localStorage.getItem('tos_user');
    if (!stored) {
      throw new Error('Not authenticated');
    }
    return simulateNetwork(JSON.parse(stored) as User);
  },
  getUsers: async (): Promise<User[]> => simulateNetwork([...demoUsers]),
  createUser: async (data: CreateUserRequest): Promise<User> => {
    if (demoUsers.some((item) => item.username === data.username)) {
      throw new Error('Username already exists');
    }

    const user: User = {
      id: demoUserId++,
      username: data.username,
      role: data.role,
      createdAt: now,
      updatedAt: now,
    };

    demoUsers.push(user);
    return simulateNetwork(user);
  },
  updateUser: async (id: number, data: UpdateUserRequest): Promise<User> => {
    const index = demoUsers.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    demoUsers[index] = {
      ...demoUsers[index],
      ...(data.role ? { role: data.role } : {}),
      updatedAt: now,
    };
    return simulateNetwork(demoUsers[index]);
  },
  deleteUser: async (id: number): Promise<void> => {
    const index = demoUsers.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    demoUsers.splice(index, 1);
    await simulateNetwork(null);
  },
};

import type {
  AuthResponse,
  Berth,
  Container,
  Counterparty,
  CreateUserRequest,
  UpdateUserRequest,
  DashboardStats,
  User,
  Vessel,
  VesselCall,
  TrainConsist,
  Wagon,
  Warehouse,
  LogisticsOrder,
  LogisticsOrderDocument,
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
import { cargoStatusFromStageType, syncDemoTransportWithStage, releaseDemoTransportAfterDelivery, formatPortCode, validateWagonContainerAssignment, validateContainerVesselAssignment } from '../utils';
import {
  demoContainers,
  demoWagons,
  demoTrainConsists,
  demoLogisticsOrders,
  demoOrderDocuments,
  demoRouteStages,
  demoLogisticsRoutes,
  demoCargoTrackings,
  demoCargoTrackingEvents,
  demoMaterialFlows,
  buildDemoVesselCalls,
} from './mockCargoSeed';
import { simulateNetwork } from './config';

const now = new Date().toISOString();

let nextId = 200;

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
    name: 'Причал навалочных грузов (уголь)',
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
    load: 15800,
    _count: { wagons: 6, containers: 6 },
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
    load: 14600,
    _count: { wagons: 5, containers: 5 },
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
    code: 'LUKOIL-NPZ',
    name: 'ЛУКОЙЛ-НПЗ',
    partnerType: 'CLIENT',
    contact: 'Поставщик нефтепродуктов',
    _count: { orders: 1 },
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

const logisticsOrders: LogisticsOrder[] = [...demoLogisticsOrders];
const orderDocuments: LogisticsOrderDocument[] = [...demoOrderDocuments];
/** Demo-only binary payloads keyed by document id */
const orderDocumentBlobs = new Map<number, Blob>(
  demoOrderDocuments.map((doc) => [
    doc.id,
    new Blob(
      [
        doc.documentType === 'CONTRACT'
          ? `Демо-договор для заказа #${doc.orderId}\nФайл: ${doc.fileName}`
          : doc.documentType === 'WAYBILL'
            ? `Демо-коносамент: ${doc.fileName}`
            : `Демо-документ: ${doc.fileName}`,
      ],
      { type: doc.mimeType ?? 'text/plain' }
    ),
  ])
);

const routeStages: RouteStage[] = [...demoRouteStages];

const logisticsRoutes: LogisticsRoute[] = [...demoLogisticsRoutes];

const cargoTrackingEvents: CargoTrackingEvent[] = [...demoCargoTrackingEvents];

const cargoTrackings: CargoTracking[] = [...demoCargoTrackings];

const materialFlows: MaterialFlow[] = [...demoMaterialFlows];

const infoFlows: InfoFlowEvent[] = [
  {
    id: 1,
    ilsFunction: 'PLANNING',
    eventType: 'CREATE',
    entityType: 'LOGISTICS_ORDER',
    entityId: 1,
    orderId: 1,
    order: { id: 1, orderNumber: 'ILS-2026-COAL' },
    message: 'Seed: заказ на экспорт угля (5 партий)',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 2,
    ilsFunction: 'PLANNING',
    eventType: 'CREATE',
    entityType: 'LOGISTICS_ORDER',
    entityId: 2,
    orderId: 2,
    message: 'Seed: заказ на экспорт нефти (5 партий)',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 3,
    ilsFunction: 'CONTROL',
    eventType: 'CREATE',
    entityType: 'CARGO_TRACKING',
    entityId: 1,
    orderId: 1,
    message: '10 партий груза на маршрутах отслеживания',
    createdAt: new Date().toISOString(),
  },
];

const containers: Container[] = [...demoContainers];

const vesselCalls: VesselCall[] = buildDemoVesselCalls(vessels, berths);

const wagons: Wagon[] = [...demoWagons];

const trainConsists: TrainConsist[] = [...demoTrainConsists];

function getDashboardStats(): DashboardStats {
  const activeStatuses = ['EN_ROUTE', 'ARRIVED', 'UNLOADING', 'EXPECTED', 'BERTHED', 'IN_OPERATION'];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return {
    vesselCallsTotal: vesselCalls.length,
    vesselCallsActive: vesselCalls.filter((call) => activeStatuses.includes(call.status)).length,
    containers: containers.length,
    wagons: wagons.length,
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
      documents: orderDocuments.filter((d) => d.orderId === order.id).length,
    },
  };
}

function attachContainerRelations(container: Container): Container {
  const warehouse = container.warehouseId
    ? warehouses.find((w) => w.id === container.warehouseId)
    : undefined;
  const vesselCall = container.vesselCallId
    ? vesselCalls.find((vc) => vc.id === container.vesselCallId)
    : undefined;
  const logisticsOrder = container.logisticsOrderId
    ? logisticsOrders.find((o) => o.id === container.logisticsOrderId)
    : undefined;
  return {
    ...container,
    warehouse: warehouse
      ? ({ id: warehouse.id, number: warehouse.number, name: warehouse.name } as Warehouse)
      : undefined,
    vesselCall: vesselCall
      ? {
          ...vesselCall,
          vessel: vessels.find((v) => v.id === vesselCall.vesselId) ?? vesselCall.vessel,
        }
      : undefined,
    logisticsOrder: logisticsOrder
      ? { id: logisticsOrder.id, orderNumber: logisticsOrder.orderNumber, status: logisticsOrder.status }
      : container.logisticsOrder,
  };
}

function attachWagonRelations(wagon: Wagon): Wagon {
  const warehouse = wagon.warehouseId
    ? warehouses.find((w) => w.id === wagon.warehouseId)
    : undefined;
  const container = wagon.containerId
    ? containers.find((c) => c.id === wagon.containerId)
    : undefined;
  const trainConsist = wagon.trainConsistId
    ? trainConsists.find((c) => c.id === wagon.trainConsistId)
    : undefined;
  return {
    ...wagon,
    warehouse: warehouse
      ? ({ id: warehouse.id, number: warehouse.number, name: warehouse.name } as Warehouse)
      : undefined,
    container: container
      ? ({ id: container.id, containerNumber: container.containerNumber } as Container)
      : undefined,
    trainConsist,
  };
}

function attachTrainConsistRelations(consist: TrainConsist): TrainConsist {
  const linked = wagons.filter((w) => w.trainConsistId === consist.id).map(attachWagonRelations);
  return {
    ...consist,
    wagons: linked,
    _count: { wagons: linked.length },
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
  syncDemoTransportWithStage(containerId, stageType, {
    wagons,
    trainConsists,
    containers,
    vesselCalls,
    now,
  });
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
    syncDemoTransportWithStage(tracking.containerId, 'DELIVERED', {
      wagons,
      trainConsists,
      containers,
      vesselCalls,
      now,
    });
    releaseDemoTransportAfterDelivery(tracking.containerId, {
      containers,
      wagons,
      vesselCalls,
      vessels,
      routeStages,
      cargoTrackings,
      logisticsOrders,
    });
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
      status: (data.status || 'EN_ROUTE') as VesselCall['status'],
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
    const normalized =
      status === 'EXPECTED'
        ? 'EN_ROUTE'
        : status === 'BERTHED'
          ? 'ARRIVED'
          : status === 'IN_OPERATION'
            ? 'UNLOADING'
            : status;
    const update: Partial<VesselCall> = {
      status: normalized as VesselCall['status'],
      updatedAt: now,
    };
    if (normalized === 'ARRIVED' && berthId) {
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
  getAll: () =>
    simulateNetwork(
      berths.map((berth) => ({
        ...berth,
        vesselCalls: vesselCalls
          .filter(
            (vc) =>
              vc.berthId === berth.id &&
              (vc.status === 'ARRIVED' || vc.status === 'UNLOADING')
          )
          .map(attachVesselCallRelations),
      }))
    ),
  getById: (id: number) => {
    const berth = berths.find((item) => item.id === id)!;
    return simulateNetwork({
      ...berth,
      vesselCalls: vesselCalls
        .filter((vc) => vc.berthId === id)
        .map(attachVesselCallRelations),
    });
  },
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
  getAll: () => simulateNetwork(containers.map(attachContainerRelations)),
  getById: (id: number) =>
    simulateNetwork(attachContainerRelations(containers.find((item) => item.id === id)!)),
  getByNumber: (containerNumber: string) =>
    simulateNetwork(
      attachContainerRelations(
        containers.find((item) => item.containerNumber === containerNumber)!
      )
    ),
  create: (data: Partial<Container>) => {
    if (data.vesselCallId) {
      const err = validateContainerVesselAssignment(undefined, data.vesselCallId);
      if (err) return Promise.reject(new Error(err));
    }
    const item: Container = attachContainerRelations({
      id: nextId++,
      containerNumber: data.containerNumber || `DEMO${nextId}`,
      containerType: data.containerType || ('TWENTY_GP' as Container['containerType']),
      status: (data.status || 'IN_TERMINAL') as Container['status'],
      createdAt: now,
      updatedAt: now,
      ...data,
    } as Container);
    containers.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<Container>) => {
    const index = containers.findIndex((item) => item.id === id);
    if (index < 0) {
      return Promise.reject(new Error('Партия не найдена'));
    }
    if (data.vesselCallId) {
      const err = validateContainerVesselAssignment(
        containers[index].vesselCallId,
        data.vesselCallId
      );
      if (err) return Promise.reject(new Error(err));
    }
    const updated = attachContainerRelations({
      ...containers[index],
      ...data,
      updatedAt: now,
    });
    containers[index] = updated;
    return simulateNetwork(updated);
  },
  move: (id: number, data: { warehouseId?: number; location?: string; status?: string }) => {
    const index = containers.findIndex((item) => item.id === id);
    if (index < 0) {
      return Promise.reject(new Error('Партия не найдена'));
    }
    containers[index] = attachContainerRelations({
      ...containers[index],
      warehouseId: data.warehouseId ?? containers[index].warehouseId,
      location: data.location ?? containers[index].location,
      status: (data.status || containers[index].status) as Container['status'],
      updatedAt: now,
    });
    return simulateNetwork(containers[index]);
  },
  delete: (id: number) => {
    const index = containers.findIndex((item) => item.id === id);
    containers.splice(index, 1);
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

export const demoTrainConsistsApi = {
  getAll: (params?: { status?: string; direction?: string }) => {
    let list = trainConsists;
    if (params?.status && params.status !== 'ALL') {
      list = list.filter((c) => c.status === params.status);
    }
    if (params?.direction && params.direction !== 'ALL') {
      list = list.filter((c) => c.direction === params.direction);
    }
    return simulateNetwork(list.map(attachTrainConsistRelations));
  },
  getById: (id: number) =>
    simulateNetwork(attachTrainConsistRelations(trainConsists.find((c) => c.id === id)!)),
  create: (data: Partial<TrainConsist> & { wagonIds?: number[] }) => {
    const item = attachTrainConsistRelations({
      id: nextId++,
      trainNumber: data.trainNumber || `T${nextId}`,
      origin: data.origin,
      track: data.track,
      direction: 'INBOUND',
      arrivalAt: data.arrivalAt || now,
      status: 'EN_ROUTE',
      createdAt: now,
      updatedAt: now,
    } as TrainConsist);
    trainConsists.push(item);
    if (data.wagonIds?.length) {
      data.wagonIds.forEach((wid) => {
        const wi = wagons.findIndex((w) => w.id === wid);
        if (wi >= 0) {
          wagons[wi] = {
            ...wagons[wi],
            trainConsistId: item.id,
            trainNumber: item.trainNumber,
            status: 'EN_ROUTE' as Wagon['status'],
          };
        }
      });
    }
    return simulateNetwork(attachTrainConsistRelations(item));
  },
  createOutbound: (data: {
    trainNumber: string;
    destination: string;
    track?: string;
    wagonIds: number[];
  }) => {
    const invalid = data.wagonIds.filter((wid) => {
      const w = wagons.find((x) => x.id === wid);
      return !w || w.status !== 'IN_PARK' || w.trainConsistId != null;
    });
    if (!data.wagonIds.length) {
      return Promise.reject(new Error('Выберите хотя бы один вагон из парка'));
    }
    if (invalid.length) {
      return Promise.reject(new Error('Вагоны должны быть в парке без состава'));
    }
    const item = attachTrainConsistRelations({
      id: nextId++,
      trainNumber: data.trainNumber.trim(),
      destination: data.destination.trim(),
      track: data.track?.trim(),
      direction: 'OUTBOUND',
      arrivalAt: now,
      formedAt: now,
      status: 'FORMING',
      createdAt: now,
      updatedAt: now,
    } as TrainConsist);
    trainConsists.push(item);
    data.wagonIds.forEach((wid) => {
      const wi = wagons.findIndex((w) => w.id === wid);
      if (wi >= 0) {
        wagons[wi] = {
          ...wagons[wi],
          trainConsistId: item.id,
          trainNumber: item.trainNumber,
          status: 'FORMING' as Wagon['status'],
        };
      }
    });
    return simulateNetwork(attachTrainConsistRelations(item));
  },
  updateStatus: (id: number, status: string) => {
    const index = trainConsists.findIndex((c) => c.id === id);
    if (index < 0) return Promise.reject(new Error('Состав не найден'));

    const consist = trainConsists[index];

    if (consist.direction === 'OUTBOUND' && status === 'DEPARTED') {
      wagons.splice(0, wagons.length, ...wagons.filter((w) => w.trainConsistId !== id));
      trainConsists.splice(index, 1);
      return simulateNetwork({ id, status: 'DEPARTED', purged: true });
    }

    trainConsists[index] = { ...consist, status: status as TrainConsist['status'], updatedAt: now };
    wagons.forEach((w, wi) => {
      if (w.trainConsistId !== id) return;
      wagons[wi] = { ...w, status: status as Wagon['status'] };
    });

    return simulateNetwork(attachTrainConsistRelations(trainConsists[index]));
  },
  disband: (id: number) => {
    const index = trainConsists.findIndex((c) => c.id === id);
    if (index < 0) return Promise.reject(new Error('Состав не найден'));
    if (trainConsists[index].direction !== 'INBOUND') {
      return Promise.reject(new Error('Расформировать можно только входящий состав'));
    }
    if (trainConsists[index].status !== 'UNLOADING') {
      return Promise.reject(new Error('Расформирование доступно после завершения разгрузки'));
    }
    wagons.forEach((w, wi) => {
      if (w.trainConsistId !== id) return;
      wagons[wi] = {
        ...w,
        status: 'IN_PARK' as Wagon['status'],
        trainConsistId: undefined,
        containerId: undefined,
        cargo: undefined,
        cargoWeight: undefined,
      };
    });
    trainConsists.splice(index, 1);
    return simulateNetwork({ id, disbanded: true });
  },
  delete: (id: number) => {
    const consist = trainConsists.find((c) => c.id === id);
    if (consist?.direction === 'OUTBOUND') {
      wagons.splice(0, wagons.length, ...wagons.filter((w) => w.trainConsistId !== id));
    } else {
      wagons.forEach((w, wi) => {
        if (w.trainConsistId !== id) return;
        wagons[wi] = {
          ...w,
          status: 'IN_PARK' as Wagon['status'],
          trainConsistId: undefined,
          containerId: undefined,
          cargo: undefined,
          cargoWeight: undefined,
        };
      });
    }
    const index = trainConsists.findIndex((c) => c.id === id);
    trainConsists.splice(index, 1);
    return simulateNetwork(undefined);
  },
};

export const demoWagonsApi = {
  getAll: (params?: {
    status?: string;
    warehouseId?: number;
    withoutConsist?: boolean;
    inParkWithoutConsist?: boolean;
  }) => {
    let list = wagons;
    if (params?.inParkWithoutConsist) {
      list = list.filter((w) => w.status === 'IN_PARK' && w.trainConsistId == null);
    } else {
      if (params?.status && params.status !== 'ALL') {
        list = list.filter((w) => w.status === params.status);
      }
      if (params?.withoutConsist) {
        list = list.filter((w) => w.trainConsistId == null);
      }
    }
    if (params?.warehouseId) {
      list = list.filter((w) => w.warehouseId === params.warehouseId);
    }
    return simulateNetwork(list.map(attachWagonRelations));
  },
  getById: (id: number) =>
    simulateNetwork(attachWagonRelations(wagons.find((item) => item.id === id)!)),
  create: (data: Partial<Wagon>) => {
    if (data.containerId) {
      const err = validateWagonContainerAssignment(wagons, data.containerId);
      if (err) return Promise.reject(new Error(err));
    }
    const item: Wagon = attachWagonRelations({
      id: nextId++,
      number: data.number || `${nextId}${nextId}${nextId}${nextId}${nextId}${nextId}${nextId}${nextId}`,
      wagonType: data.wagonType || ('PLATFORM' as Wagon['wagonType']),
      arrivalAt: data.arrivalAt || now,
      status: (data.status || 'EN_ROUTE') as Wagon['status'],
      createdAt: now,
      updatedAt: now,
      ...data,
    } as Wagon);
    wagons.push(item);
    return simulateNetwork(item);
  },
  update: (id: number, data: Partial<Wagon>) => {
    const index = wagons.findIndex((item) => item.id === id);
    if (index < 0) {
      return Promise.reject(new Error('Вагон не найден'));
    }
    if (data.containerId) {
      const err = validateWagonContainerAssignment(wagons, data.containerId, id);
      if (err) return Promise.reject(new Error(err));
    }
    const updated = attachWagonRelations({
      ...wagons[index],
      ...data,
      updatedAt: now,
    });
    wagons[index] = updated;
    return simulateNetwork(updated);
  },
  updateStatus: (id: number, status: string) => {
    const index = wagons.findIndex((item) => item.id === id);
    const normalized = status === 'EXPECTED' ? 'EN_ROUTE' : status;
    if (normalized === 'DEPARTED') {
      return Promise.reject(new Error('Статус «Убыл» задаётся на уровне состава'));
    }
    wagons[index] = { ...wagons[index], status: normalized as Wagon['status'], updatedAt: now };
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
    orderDocuments.splice(
      0,
      orderDocuments.length,
      ...orderDocuments.filter((d) => d.orderId !== id)
    );
    containers.forEach((c, i) => {
      if (c.logisticsOrderId === id) containers[i] = { ...c, logisticsOrderId: undefined };
    });
    return simulateNetwork(undefined);
  },
};

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export const demoLogisticsOrderDocumentsApi = {
  getAll: (orderId: number) =>
    simulateNetwork(
      orderDocuments
        .filter((d) => d.orderId === orderId)
        .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    ),
  upload: async (
    orderId: number,
    file: File,
    meta?: { documentType?: string; description?: string }
  ) => {
    const id = nextId++;
    const item: LogisticsOrderDocument = {
      id,
      orderId,
      fileName: file.name,
      storedName: `demo-${id}-${file.name}`,
      mimeType: file.type || undefined,
      fileSize: file.size,
      documentType: (meta?.documentType as LogisticsOrderDocument['documentType']) ?? 'OTHER',
      description: meta?.description,
      uploadedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    orderDocuments.push(item);
    orderDocumentBlobs.set(id, file);
    return simulateNetwork(item);
  },
  download: async (orderId: number, docId: number, fileName: string) => {
    const doc = orderDocuments.find((d) => d.id === docId && d.orderId === orderId);
    if (!doc) return Promise.reject(new Error('Документ не найден'));
    const blob = orderDocumentBlobs.get(docId) ?? new Blob(['Демо-содержимое'], { type: 'text/plain' });
    triggerBlobDownload(blob, fileName);
    return simulateNetwork(undefined);
  },
  delete: (orderId: number, docId: number) => {
    const index = orderDocuments.findIndex((d) => d.id === docId && d.orderId === orderId);
    if (index < 0) return Promise.reject(new Error('Документ не найден'));
    orderDocuments.splice(index, 1);
    orderDocumentBlobs.delete(docId);
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
          { sequence: 1, stageType: 'SUPPLIER', locationCode: 'SUP', locationName: 'Поставщик (ж/д отгрузка)', transportMode: 'RAIL', status: 'COMPLETED' },
          { sequence: 2, stageType: 'RAIL_STATION', locationCode: 'RZD', locationName: 'Вагоны', transportMode: 'RAIL', status: 'COMPLETED' },
          { sequence: 3, stageType: 'WAREHOUSE', locationCode: 'WH', locationName: 'Склад терминала', transportMode: 'WAREHOUSE', status: 'CURRENT' },
          { sequence: 4, stageType: 'BERTH', locationCode: 'BERTH', locationName: 'Причал погрузки', transportMode: 'SEA', status: 'PENDING' },
          { sequence: 5, stageType: 'SHIP', locationCode: 'SHIP', locationName: 'Судно', transportMode: 'SEA', status: 'PENDING' },
          { sequence: 6, stageType: 'PORT', locationCode: data.destination || 'DEST', locationName: formatPortCode(data.destination) || 'Порт назначения', transportMode: 'SEA', status: 'PENDING' },
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
      origin: data.origin || 'Поставщик',
      destination: data.destination ? formatPortCode(data.destination) : 'Порт назначения',
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
      return Promise.reject(new Error('Партия груза не найдена'));
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
      return Promise.reject(new Error('Маршрут или партия не найдены'));
    }
    if (cargoTrackings.some((t) => t.containerId === containerId && t.routeId === routeId)) {
      return Promise.reject(new Error('Отслеживание по этому маршруту уже запущено'));
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
      syncDemoCargoStatus(containerId, firstStage.stageType);
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
      throw new Error('Неверный логин или пароль');
    }

    return {
      token: `demo-token-${user.id}`,
      user,
    };
  },
  getMe: async (): Promise<User> => {
    const stored = localStorage.getItem('tos_user');
    if (!stored) {
      throw new Error('Требуется авторизация');
    }
    return simulateNetwork(JSON.parse(stored) as User);
  },
  getUsers: async (): Promise<User[]> => simulateNetwork([...demoUsers]),
  createUser: async (data: CreateUserRequest): Promise<User> => {
    if (demoUsers.some((item) => item.username === data.username)) {
      throw new Error('Пользователь с таким логином уже существует');
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
      throw new Error('Пользователь не найден');
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
      throw new Error('Пользователь не найден');
    }
    demoUsers.splice(index, 1);
    await simulateNetwork(null);
  },
};

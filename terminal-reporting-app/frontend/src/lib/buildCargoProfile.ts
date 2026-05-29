import type {
  Container,
  CargoTracking,
  Wagon,
  VesselCall,
  Warehouse,
  LogisticsOrder,
  MaterialFlow,
  InfoFlowEvent,
  LogisticsRoute,
  RouteStage,
} from '../types';

export interface CargoProfile {
  container: Container;
  trackings: CargoTracking[];
  wagons: Wagon[];
  vesselCall?: VesselCall;
  warehouse?: Warehouse;
  order?: LogisticsOrder;
  materialFlows: MaterialFlow[];
  infoEvents: InfoFlowEvent[];
  routes: LogisticsRoute[];
  primaryTracking?: CargoTracking;
  stages: RouteStage[];
}

export interface CargoProfileInput {
  container: Container;
  trackings: CargoTracking[];
  wagons: Wagon[];
  vesselCalls: VesselCall[];
  warehouses: Warehouse[];
  orders: LogisticsOrder[];
  materialFlows: MaterialFlow[];
  infoEvents: InfoFlowEvent[];
  routes: LogisticsRoute[];
}

export function buildCargoProfile(input: CargoProfileInput): CargoProfile {
  const { container } = input;

  const wagons = input.wagons.filter((w) => w.containerId === container.id);
  const materialFlows = input.materialFlows.filter(
    (f) => f.containerId === container.id || f.container?.id === container.id
  );
  const infoEvents = input.infoEvents.filter(
    (e) =>
      e.message?.includes(container.containerNumber) ||
      (e.entityType === 'CARGO_TRACKING' &&
        input.trackings.some((t) => t.containerId === container.id && t.id === e.entityId))
  );

  const vesselCall = container.vesselCallId
    ? input.vesselCalls.find((vc) => vc.id === container.vesselCallId)
    : container.vesselCall;

  const warehouse = container.warehouseId
    ? input.warehouses.find((w) => w.id === container.warehouseId)
    : container.warehouse;

  const order = container.logisticsOrderId
    ? input.orders.find((o) => o.id === container.logisticsOrderId)
    : container.logisticsOrder as LogisticsOrder | undefined;

  const trackings = input.trackings.filter((t) => t.containerId === container.id);
  const primaryTracking = trackings[0];
  const stages = primaryTracking?.route?.stages ?? [];

  return {
    container: { ...container, warehouse, vesselCall, logisticsOrder: order },
    trackings,
    wagons,
    vesselCall,
    warehouse,
    order,
    materialFlows,
    infoEvents,
    routes: input.routes,
    primaryTracking,
    stages,
  };
}

export function findStage(stages: RouteStage[], type: RouteStage['stageType']): RouteStage | undefined {
  return stages.find((s) => s.stageType === type);
}

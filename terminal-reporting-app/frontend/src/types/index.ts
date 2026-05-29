// Типы для складов
export interface Warehouse {
  id: number;
  number: string;
  name?: string;
  capacity: number;
  warehouseType: WarehouseType;
  zone?: string;
  load?: number;
  _count?: {
    wagons: number;
    containers: number;
  };
  createdAt: string;
  updatedAt: string;
}

export enum WarehouseType {
  COAL_YARD = 'COAL_YARD',
  OIL_TANK = 'OIL_TANK',
  OPEN_YARD = 'OPEN_YARD',
  COVERED = 'COVERED',
  REFRIGERATED = 'REFRIGERATED',
  CUSTOMS = 'CUSTOMS',
  EMPTY_DEPOT = 'EMPTY_DEPOT',
}

// Типы для ж/д составов
export interface TrainConsist {
  id: number;
  trainNumber: string;
  origin?: string;
  destination?: string;
  track?: string;
  direction: 'INBOUND' | 'OUTBOUND';
  arrivalAt: string;
  formedAt?: string;
  departureAt?: string;
  status: TrainConsistStatus;
  wagons?: Wagon[];
  _count?: { wagons: number };
  createdAt: string;
  updatedAt: string;
}

export enum TrainConsistStatus {
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  UNLOADING = 'UNLOADING',
  IN_PARK = 'IN_PARK',
  FORMING = 'FORMING',
  DEPARTED = 'DEPARTED',
}

// Типы для вагонов
export interface Wagon {
  id: number;
  number: string;
  wagonType: WagonType;
  cargo?: string;
  cargoWeight?: number;
  warehouseId?: number;
  warehouse?: Warehouse;
  track?: string;
  trainNumber?: string;
  arrivalAt: string;
  departureAt?: string;
  status: WagonStatus;
  trainConsistId?: number;
  trainConsist?: TrainConsist;
  containerId?: number;
  container?: Container;
  createdAt: string;
  updatedAt: string;
}

export enum WagonType {
  PLATFORM = 'PLATFORM',
  GONDOLA = 'GONDOLA',
  BOXCAR = 'BOXCAR',
  TANK = 'TANK',
  REFRIGERATOR = 'REFRIGERATOR',
}

export enum WagonStatus {
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  UNLOADING = 'UNLOADING',
  IN_PARK = 'IN_PARK',
  FORMING = 'FORMING',
  DEPARTED = 'DEPARTED',
}

// Типы для судов
export interface Vessel {
  id: number;
  name: string;
  imoNumber: string;
  vesselType: VesselType;
  grossTonnage?: number;
  deadweight?: number;
  length?: number;
  beam?: number;
  draft?: number;
  flag?: string;
  owner?: string;
  vesselCalls?: VesselCall[];
  _count?: {
    vesselCalls: number;
  };
  createdAt: string;
  updatedAt: string;
}

export enum VesselType {
  CONTAINER = 'CONTAINER',
  BULK_CARRIER = 'BULK_CARRIER',
  TANKER = 'TANKER',
  RORO = 'RORO',
  GENERAL_CARGO = 'GENERAL_CARGO',
  OTHER = 'OTHER',
}

// Типы для судозаходов
export interface VesselCall {
  id: number;
  vesselId: number;
  vessel: Vessel;
  voyageNumber: string;
  eta: string;
  etd?: string;
  ata?: string;
  atd?: string;
  berthId?: number;
  berth?: Berth;
  status: VesselCallStatus;
  agent?: string;
  purpose?: string;
  containers?: Container[];
  _count?: {
    containers: number;
  };
  createdAt: string;
  updatedAt: string;
}

export enum VesselCallStatus {
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  UNLOADING = 'UNLOADING',
  DEPARTED = 'DEPARTED',
  CANCELLED = 'CANCELLED',
}

// Типы для причалов
export interface Berth {
  id: number;
  number: string;
  name?: string;
  berthType: BerthType;
  length: number;
  depth: number;
  maxDeadweight?: number;
  isActive: boolean;
  vesselCalls?: VesselCall[];
  createdAt: string;
  updatedAt: string;
}

export enum BerthType {
  CONTAINER = 'CONTAINER',
  BULK = 'BULK',
  LIQUID = 'LIQUID',
  RORO = 'RORO',
  GENERAL = 'GENERAL',
  MULTI_PURPOSE = 'MULTI_PURPOSE',
}

// Типы для контейнеров
export interface Container {
  id: number;
  containerNumber: string; // номер партии груза
  containerType: ContainerType;
  cargoCategory?: 'COAL' | 'OIL' | 'PETROLEUM';
  supplierName?: string;
  quantityTons?: number;
  quantityUnit?: string;
  status: ContainerStatus;
  cargoDescription?: string;
  grossWeight?: number;
  sealNumber?: string;
  vesselCallId?: number;
  vesselCall?: VesselCall;
  warehouseId?: number;
  warehouse?: Warehouse;
  location?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  blNumber?: string;
  customsStatus?: string;
  logisticsOrderId?: number;
  logisticsOrder?: Pick<LogisticsOrder, 'id' | 'orderNumber' | 'status'>;
  createdAt: string;
  updatedAt: string;
}

export enum CargoGrade {
  COAL_ANTHRACITE = 'COAL_ANTHRACITE',
  COAL_COKING = 'COAL_COKING',
  OIL_CRUDE = 'OIL_CRUDE',
  OIL_FUEL = 'OIL_FUEL',
  PETROLEUM = 'PETROLEUM',
}

/** @deprecated use CargoGrade — поле containerType в API */
export type ContainerType = CargoGrade | string;

export enum CargoBatchStatus {
  ON_LAND = 'ON_LAND',
  IN_STORAGE = 'IN_STORAGE',
  LOADING_BERTH = 'LOADING_BERTH',
  ON_VESSEL = 'ON_VESSEL',
  AT_DESTINATION_PORT = 'AT_DESTINATION_PORT',
  DELIVERED = 'DELIVERED',
  IN_TERMINAL = 'IN_TERMINAL',
  FULL = 'FULL',
}

export type ContainerStatus = CargoBatchStatus | string;

// ИЛС: контрагенты и справочники
export interface Counterparty {
  id: number;
  code: string;
  name: string;
  partnerType: PartnerType;
  inn?: string;
  contact?: string;
  _count?: { orders: number };
  createdAt: string;
  updatedAt: string;
}

export type PartnerType = 'CLIENT' | 'CARRIER' | 'AGENT' | 'CUSTOMS' | 'RAILWAY';

export interface PortDirectory {
  id: number;
  code: string;
  name: string;
  country?: string;
}

export interface CargoDirectory {
  id: number;
  code: string;
  name: string;
  category: string;
}

// ИЛС: логистические заказы
export interface LogisticsOrder {
  id: number;
  orderNumber: string;
  orderType: OrderType;
  managementLevel: ManagementLevel;
  status: OrderStatus;
  counterpartyId?: number;
  counterparty?: Counterparty;
  cargoDescription?: string;
  cargoWeight?: number;
  origin?: string;
  destination?: string;
  supplierName?: string;
  plannedStart?: string;
  plannedEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  vesselCallId?: number;
  vesselCall?: VesselCall;
  notes?: string;
  containers?: Pick<Container, 'id' | 'containerNumber' | 'status'>[];
  documents?: LogisticsOrderDocument[];
  _count?: { materialFlows: number; infoEvents: number; documents?: number };
  createdAt: string;
  updatedAt: string;
}

export type OrderDocumentType =
  | 'CONTRACT'
  | 'INVOICE'
  | 'WAYBILL'
  | 'CERTIFICATE'
  | 'CUSTOMS'
  | 'OTHER';

export interface LogisticsOrderDocument {
  id: number;
  orderId: number;
  fileName: string;
  storedName: string;
  mimeType?: string;
  fileSize: number;
  documentType?: OrderDocumentType;
  description?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderType = 'EXPORT_BULK' | 'STORAGE' | 'SHIP_LOADING' | 'TRANSPORT' | 'TRANSSHIPMENT' | 'CUSTOMS';
export type ManagementLevel = 'PLANNING' | 'DISPATCH' | 'OPERATIONAL';
export type OrderStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface MaterialFlow {
  id: number;
  orderId?: number;
  order?: { id: number; orderNumber: string };
  flowType: MaterialFlowType;
  transportMode: TransportMode;
  quantity?: number;
  unit?: string;
  fromLocation?: string;
  toLocation?: string;
  containerId?: number;
  container?: { id: number; containerNumber: string };
  performedAt: string;
  description?: string;
  createdAt: string;
}

export type MaterialFlowType = 'ARRIVAL' | 'DEPARTURE' | 'INTERNAL_TRANSFER' | 'STORAGE';
export type TransportMode = 'SEA' | 'RAIL' | 'WAREHOUSE';

export interface InfoFlowEvent {
  id: number;
  ilsFunction: IlsFunction;
  eventType: string;
  entityType: string;
  entityId?: number;
  message: string;
  orderId?: number;
  order?: { id: number; orderNumber: string };
  userId?: number;
  user?: { id: number; username: string; fullName?: string };
  createdAt: string;
}

export type IlsFunction = 'PLANNING' | 'REGULATION' | 'CONTROL' | 'ANALYSIS' | 'ACCOUNTING';

export interface RouteStage {
  id: number;
  routeId: number;
  sequence: number;
  stageType: RouteStageType;
  locationCode: string;
  locationName: string;
  transportMode?: TransportMode;
  plannedAt?: string;
  actualAt?: string;
  status: RouteStageStatus;
  createdAt: string;
  updatedAt: string;
}

export type RouteStageType =
  | 'SUPPLIER'
  | 'RAIL_STATION'
  | 'WAREHOUSE'
  | 'BERTH'
  | 'SHIP'
  | 'PORT'
  | 'TERMINAL'
  | 'CUSTOMS'
  | 'CLIENT'
  | 'BORDER';

export type RouteStageStatus = 'PENDING' | 'CURRENT' | 'COMPLETED' | 'SKIPPED';

export type RouteStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface LogisticsRoute {
  id: number;
  routeNumber: string;
  name?: string;
  orderId?: number;
  order?: { id: number; orderNumber: string; status?: string };
  origin: string;
  destination: string;
  routeKind?: 'EXPORT' | 'IMPORT';
  status: RouteStatus;
  stages?: RouteStage[];
  trackings?: CargoTracking[];
  _count?: { trackings: number; stages: number };
  createdAt: string;
  updatedAt: string;
}

export type CargoTrackingStatus =
  | 'REGISTERED'
  | 'IN_TRANSIT'
  | 'AT_STAGE'
  | 'DELIVERED'
  | 'DELAYED';

export interface CargoTrackingEvent {
  id: number;
  trackingId: number;
  fromStageId?: number;
  toStageId?: number;
  eventAt: string;
  description?: string;
  createdAt: string;
}

export interface CargoTracking {
  id: number;
  containerId: number;
  container: Pick<Container, 'id' | 'containerNumber' | 'status'>;
  routeId: number;
  route?: LogisticsRoute;
  currentStageId?: number;
  currentStage?: RouteStage;
  status: CargoTrackingStatus;
  lastEventAt: string;
  notes?: string;
  events?: CargoTrackingEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ContainerTrackingResult {
  container: Container;
  trackings: CargoTracking[];
}

// Dashboard stats
export interface DashboardStats {
  vesselCallsTotal: number;
  vesselCallsActive: number;
  containers: number;
  wagons: number;
  warehouses: number;
  ordersTotal: number;
  ordersPlanning: number;
  ordersDispatch: number;
  ordersOperational: number;
  ordersInProgress: number;
  materialFlowsToday: number;
  infoEventsToday: number;
  counterpartiesCount: number;
  activeRoutes: number;
  cargoOnRoutes: number;
}

// Auth
export type UserRole = 'ADMIN' | 'PLANNER' | 'DISPATCHER' | 'WAREHOUSE' | 'USER';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  fullName?: string;
  department?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  password?: string;
  role?: UserRole;
}

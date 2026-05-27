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
  OPEN_YARD = 'OPEN_YARD',
  COVERED = 'COVERED',
  REFRIGERATED = 'REFRIGERATED',
  CUSTOMS = 'CUSTOMS',
  EMPTY_DEPOT = 'EMPTY_DEPOT',
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
  EXPECTED = 'EXPECTED',
  ARRIVED = 'ARRIVED',
  UNLOADING = 'UNLOADING',
  LOADING = 'LOADING',
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
  EXPECTED = 'EXPECTED',
  ARRIVED = 'ARRIVED',
  BERTHED = 'BERTHED',
  IN_OPERATION = 'IN_OPERATION',
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
  containerNumber: string;
  containerType: ContainerType;
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
  createdAt: string;
  updatedAt: string;
}

export enum ContainerType {
  TWENTY_GP = 'TWENTY_GP',
  TWENTY_HC = 'TWENTY_HC',
  FORTY_GP = 'FORTY_GP',
  FORTY_HC = 'FORTY_HC',
  FORTY_FIVE_HC = 'FORTY_FIVE_HC',
  TWENTY_RF = 'TWENTY_RF',
  FORTY_RF = 'FORTY_RF',
  TWENTY_OT = 'TWENTY_OT',
  FORTY_OT = 'FORTY_OT',
  TWENTY_FR = 'TWENTY_FR',
  FORTY_FR = 'FORTY_FR',
  TWENTY_TK = 'TWENTY_TK',
}

export enum ContainerStatus {
  EMPTY = 'EMPTY',
  FULL = 'FULL',
  ON_VESSEL = 'ON_VESSEL',
  IN_TERMINAL = 'IN_TERMINAL',
  ON_DELIVERY = 'ON_DELIVERY',
  DELIVERED = 'DELIVERED',
}

// Типы для автотранспорта
export interface Truck {
  id: number;
  licensePlate: string;
  truckType: TruckType;
  carrier: string;
  driverName?: string;
  driverDocument?: string;
  visits?: TruckVisit[];
  _count?: {
    visits: number;
  };
  createdAt: string;
  updatedAt: string;
}

export enum TruckType {
  TRUCK = 'TRUCK',
  CONTAINER_TRUCK = 'CONTAINER_TRUCK',
  DUMP_TRUCK = 'DUMP_TRUCK',
  REFRIGERATOR = 'REFRIGERATOR',
}

export interface TruckVisit {
  id: number;
  truckId: number;
  truck: Truck;
  timeSlot: string;
  timeIn?: string;
  timeOut?: string;
  purpose: string;
  gateNumber?: string;
  status: TruckVisitStatus;
  containerId?: number;
  container?: Container;
  createdAt: string;
  updatedAt: string;
}

export enum TruckVisitStatus {
  SCHEDULED = 'SCHEDULED',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Dashboard stats
export interface DashboardStats {
  vesselCallsTotal: number;
  vesselCallsActive: number;
  containers: number;
  wagons: number;
  trucks: number;
  warehouses: number;
}

// Auth
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: number;
  username: string;
  role: UserRole;
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

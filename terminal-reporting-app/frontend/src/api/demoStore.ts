import type {
  AuthResponse,
  Berth,
  Container,
  CreateUserRequest,
  DashboardStats,
  Truck,
  TruckVisit,
  User,
  Vessel,
  VesselCall,
  Wagon,
  Warehouse,
} from '../types';
import { simulateNetwork } from './config';

const now = new Date().toISOString();

let nextId = 100;

const vessels: Vessel[] = [
  {
    id: 1,
    name: 'MSC Aurora',
    imoNumber: '9123456',
    vesselType: 'CONTAINER' as Vessel['vesselType'],
    grossTonnage: 85000,
    deadweight: 95000,
    flag: 'Panama',
    owner: 'MSC',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    name: 'Volga Trader',
    imoNumber: '9234567',
    vesselType: 'GENERAL_CARGO' as Vessel['vesselType'],
    grossTonnage: 42000,
    deadweight: 58000,
    flag: 'Russia',
    owner: 'Volga Shipping',
    createdAt: now,
    updatedAt: now,
  },
];

const berths: Berth[] = [
  {
    id: 1,
    number: 'B-01',
    name: 'Контейнерный причал 1',
    berthType: 'CONTAINER' as Berth['berthType'],
    length: 320,
    depth: 14,
    maxDeadweight: 120000,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    number: 'B-02',
    name: 'Универсальный причал',
    berthType: 'MULTI_PURPOSE' as Berth['berthType'],
    length: 250,
    depth: 11,
    maxDeadweight: 80000,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  },
];

const warehouses: Warehouse[] = [
  {
    id: 1,
    number: 'W-01',
    name: 'Открытая площадка A',
    capacity: 500,
    warehouseType: 'OPEN_YARD' as Warehouse['warehouseType'],
    zone: 'A',
    load: 120,
    _count: { wagons: 2, containers: 45 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    number: 'W-02',
    name: 'Крытый склад',
    capacity: 200,
    warehouseType: 'COVERED' as Warehouse['warehouseType'],
    zone: 'B',
    load: 80,
    _count: { wagons: 1, containers: 18 },
    createdAt: now,
    updatedAt: now,
  },
];

const containers: Container[] = [
  {
    id: 1,
    containerNumber: 'MSCU1234567',
    containerType: 'FORTY_GP' as Container['containerType'],
    status: 'IN_TERMINAL' as Container['status'],
    cargoDescription: 'Электроника',
    grossWeight: 18500,
    warehouseId: 1,
    location: 'A-12-03',
    portOfLoading: 'Shanghai',
    portOfDischarge: 'Novorossiysk',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    containerNumber: 'TCLU7654321',
    containerType: 'TWENTY_GP' as Container['containerType'],
    status: 'ON_VESSEL' as Container['status'],
    cargoDescription: 'Запчасти',
    grossWeight: 9200,
    vesselCallId: 1,
    createdAt: now,
    updatedAt: now,
  },
];

const vesselCalls: VesselCall[] = [
  {
    id: 1,
    vesselId: 1,
    vessel: vessels[0],
    voyageNumber: '024E',
    eta: new Date(Date.now() + 86400000).toISOString(),
    etd: new Date(Date.now() + 259200000).toISOString(),
    berthId: 1,
    berth: berths[0],
    status: 'BERTHED' as VesselCall['status'],
    agent: 'Novorossiysk Agency',
    purpose: 'Разгрузка контейнеров',
    _count: { containers: 1 },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    vesselId: 2,
    vessel: vessels[1],
    voyageNumber: '011N',
    eta: new Date(Date.now() + 172800000).toISOString(),
    status: 'EXPECTED' as VesselCall['status'],
    agent: 'Black Sea Lines',
    purpose: 'Погрузка генеральных грузов',
    _count: { containers: 0 },
    createdAt: now,
    updatedAt: now,
  },
];

const wagons: Wagon[] = [
  {
    id: 1,
    number: '12345678',
    wagonType: 'PLATFORM' as Wagon['wagonType'],
    cargo: 'Контейнеры 40ft',
    cargoWeight: 24000,
    warehouseId: 1,
    track: 'T-3',
    trainNumber: '2045',
    arrivalAt: now,
    status: 'UNLOADING' as Wagon['status'],
    createdAt: now,
    updatedAt: now,
  },
];

const trucks: Truck[] = [
  {
    id: 1,
    licensePlate: 'A123BC77',
    truckType: 'CONTAINER_TRUCK' as Truck['truckType'],
    carrier: 'TransLogistics',
    driverName: 'Иванов И.И.',
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
    timeSlot: new Date(Date.now() + 3600000).toISOString(),
    purpose: 'Вывоз контейнера',
    gateNumber: 'G-2',
    status: 'SCHEDULED' as TruckVisit['status'],
    containerId: 1,
    createdAt: now,
    updatedAt: now,
  },
];

function getDashboardStats(): DashboardStats {
  const activeStatuses = ['EXPECTED', 'ARRIVED', 'BERTHED', 'IN_OPERATION'];
  return {
    vesselCallsTotal: vesselCalls.length,
    vesselCallsActive: vesselCalls.filter((call) => activeStatuses.includes(call.status)).length,
    containers: containers.length,
    wagons: wagons.length,
    trucks: trucks.length,
    warehouses: warehouses.length,
  };
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
  updateStatus: (id: number, status: string) => {
    const index = vesselCalls.findIndex((item) => item.id === id);
    vesselCalls[index] = attachVesselCallRelations({
      ...vesselCalls[index],
      status: status as VesselCall['status'],
      updatedAt: now,
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

const demoUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    role: 'ADMIN',
    createdAt: now,
    updatedAt: now,
  },
];

let demoUserId = 2;

export const demoAuthApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    await simulateNetwork(null);

    if (username === 'admin' && password === 'admin') {
      return {
        token: 'demo-admin-token',
        user: demoUsers[0],
      };
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
  deleteUser: async (id: number): Promise<void> => {
    const index = demoUsers.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('User not found');
    }
    demoUsers.splice(index, 1);
    await simulateNetwork(null);
  },
};

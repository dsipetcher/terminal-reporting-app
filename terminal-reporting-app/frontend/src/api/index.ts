import axios from 'axios';
import type {
  Vessel,
  VesselCall,
  Berth,
  Container,
  Truck,
  TruckVisit,
  Warehouse,
  Wagon,
  DashboardStats,
  LogisticsOrder,
  Counterparty,
  MaterialFlow,
  InfoFlowEvent,
  LogisticsRoute,
  CargoTracking,
  ContainerTrackingResult,
} from '../types';
import { API_BASE_URL, IS_DEMO_MODE } from './config';
import {
  demoAuthApi,
  demoBerthsApi,
  demoContainersApi,
  demoDashboardApi,
  demoTruckVisitsApi,
  demoTrucksApi,
  demoVesselCallsApi,
  demoVesselsApi,
  demoWagonsApi,
  demoWarehousesApi,
  demoLogisticsOrdersApi,
  demoCounterpartiesApi,
  demoMaterialFlowsApi,
  demoInfoFlowsApi,
  demoLogisticsRoutesApi,
} from './demoStore';
import { getStoredToken } from './authStorage';
import type { AuthResponse, CreateUserRequest, UpdateUserRequest, User } from '../types';

export { API_BASE_URL, IS_DEMO_MODE } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const realAuthApi = {
  login: (username: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { username, password }).then((res) => res.data),
  getMe: () => api.get<User>('/auth/me').then((res) => res.data),
  getUsers: () => api.get<User[]>('/auth/users').then((res) => res.data),
  createUser: (data: CreateUserRequest) =>
    api.post<User>('/auth/users', data).then((res) => res.data),
  updateUser: (id: number, data: UpdateUserRequest) =>
    api.put<User>(`/auth/users/${id}`, data).then((res) => res.data),
  deleteUser: (id: number) => api.delete(`/auth/users/${id}`),
};

const realDashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats').then(res => res.data),
};

const realVesselsApi = {
  getAll: () => api.get<Vessel[]>('/vessels').then(res => res.data),
  getById: (id: number) => api.get<Vessel>(`/vessels/${id}`).then(res => res.data),
  create: (data: Partial<Vessel>) => api.post<Vessel>('/vessels', data).then(res => res.data),
  update: (id: number, data: Partial<Vessel>) => api.put<Vessel>(`/vessels/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/vessels/${id}`),
};

const realVesselCallsApi = {
  getAll: (params?: { status?: string; fromDate?: string; toDate?: string }) =>
    api.get<VesselCall[]>('/vessel-calls', { params }).then(res => res.data),
  getById: (id: number) => api.get<VesselCall>(`/vessel-calls/${id}`).then(res => res.data),
  create: (data: Partial<VesselCall>) => api.post<VesselCall>('/vessel-calls', data).then(res => res.data),
  update: (id: number, data: Partial<VesselCall>) =>
    api.put<VesselCall>(`/vessel-calls/${id}`, data).then(res => res.data),
  updateStatus: (id: number, status: string, berthId?: number) =>
    api.patch<VesselCall>(`/vessel-calls/${id}/status`, { status, berthId }).then(res => res.data),
  delete: (id: number) => api.delete(`/vessel-calls/${id}`),
};

const realBerthsApi = {
  getAll: () => api.get<Berth[]>('/berths').then(res => res.data),
  getById: (id: number) => api.get<Berth>(`/berths/${id}`).then(res => res.data),
  create: (data: Partial<Berth>) => api.post<Berth>('/berths', data).then(res => res.data),
  update: (id: number, data: Partial<Berth>) => api.put<Berth>(`/berths/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/berths/${id}`),
};

const realContainersApi = {
  getAll: (params?: { status?: string; containerType?: string; warehouseId?: number }) =>
    api.get<Container[]>('/containers', { params }).then(res => res.data),
  getById: (id: number) => api.get<Container>(`/containers/${id}`).then(res => res.data),
  getByNumber: (containerNumber: string) =>
    api.get<Container>(`/containers/number/${containerNumber}`).then(res => res.data),
  create: (data: Partial<Container>) => api.post<Container>('/containers', data).then(res => res.data),
  update: (id: number, data: Partial<Container>) =>
    api.put<Container>(`/containers/${id}`, data).then(res => res.data),
  move: (id: number, data: { warehouseId?: number; location?: string; status?: string }) =>
    api.patch<Container>(`/containers/${id}/move`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/containers/${id}`),
};

const realTrucksApi = {
  getAll: () => api.get<Truck[]>('/trucks').then(res => res.data),
  getById: (id: number) => api.get<Truck>(`/trucks/${id}`).then(res => res.data),
  create: (data: Partial<Truck>) => api.post<Truck>('/trucks', data).then(res => res.data),
  update: (id: number, data: Partial<Truck>) => api.put<Truck>(`/trucks/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/trucks/${id}`),
};

const realTruckVisitsApi = {
  getAll: (params?: { status?: string; date?: string }) =>
    api.get<TruckVisit[]>('/truck-visits', { params }).then(res => res.data),
  getById: (id: number) => api.get<TruckVisit>(`/truck-visits/${id}`).then(res => res.data),
  create: (data: Partial<TruckVisit>) => api.post<TruckVisit>('/truck-visits', data).then(res => res.data),
  update: (id: number, data: Partial<TruckVisit>) =>
    api.put<TruckVisit>(`/truck-visits/${id}`, data).then(res => res.data),
  checkIn: (id: number) => api.patch<TruckVisit>(`/truck-visits/${id}/check-in`).then(res => res.data),
  checkOut: (id: number) => api.patch<TruckVisit>(`/truck-visits/${id}/check-out`).then(res => res.data),
  delete: (id: number) => api.delete(`/truck-visits/${id}`),
};

const realWarehousesApi = {
  getAll: () => api.get<Warehouse[]>('/warehouses').then(res => res.data),
  getById: (id: number) => api.get<Warehouse>(`/warehouses/${id}`).then(res => res.data),
  create: (data: Partial<Warehouse>) => api.post<Warehouse>('/warehouses', data).then(res => res.data),
  update: (id: number, data: Partial<Warehouse>) =>
    api.put<Warehouse>(`/warehouses/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
};

const realWagonsApi = {
  getAll: (params?: { status?: string; warehouseId?: number }) =>
    api.get<Wagon[]>('/wagons', { params }).then(res => res.data),
  getById: (id: number) => api.get<Wagon>(`/wagons/${id}`).then(res => res.data),
  create: (data: Partial<Wagon>) => api.post<Wagon>('/wagons', data).then(res => res.data),
  update: (id: number, data: Partial<Wagon>) => api.put<Wagon>(`/wagons/${id}`, data).then(res => res.data),
  updateStatus: (id: number, status: string) =>
    api.patch<Wagon>(`/wagons/${id}/status`, { status }).then(res => res.data),
  delete: (id: number) => api.delete(`/wagons/${id}`),
};

const realLogisticsOrdersApi = {
  getAll: (params?: { status?: string; managementLevel?: string; orderType?: string }) =>
    api.get<LogisticsOrder[]>('/logistics-orders', { params }).then((res) => res.data),
  getById: (id: number) => api.get<LogisticsOrder>(`/logistics-orders/${id}`).then((res) => res.data),
  create: (data: Partial<LogisticsOrder>) =>
    api.post<LogisticsOrder>('/logistics-orders', data).then((res) => res.data),
  update: (id: number, data: Partial<LogisticsOrder>) =>
    api.put<LogisticsOrder>(`/logistics-orders/${id}`, data).then((res) => res.data),
  updateStatus: (id: number, status: string) =>
    api.patch<LogisticsOrder>(`/logistics-orders/${id}/status`, { status }).then((res) => res.data),
  delete: (id: number) => api.delete(`/logistics-orders/${id}`),
};

const realCounterpartiesApi = {
  getAll: (params?: { partnerType?: string }) =>
    api.get<Counterparty[]>('/counterparties', { params }).then((res) => res.data),
  create: (data: Partial<Counterparty>) =>
    api.post<Counterparty>('/counterparties', data).then((res) => res.data),
  update: (id: number, data: Partial<Counterparty>) =>
    api.put<Counterparty>(`/counterparties/${id}`, data).then((res) => res.data),
  delete: (id: number) => api.delete(`/counterparties/${id}`),
};

const realMaterialFlowsApi = {
  getAll: (params?: { orderId?: number; transportMode?: string }) =>
    api.get<MaterialFlow[]>('/material-flows', { params }).then((res) => res.data),
  create: (data: Partial<MaterialFlow>) =>
    api.post<MaterialFlow>('/material-flows', data).then((res) => res.data),
};

const realInfoFlowsApi = {
  getAll: (params?: { ilsFunction?: string; orderId?: number; limit?: number }) =>
    api.get<InfoFlowEvent[]>('/info-flows', { params }).then((res) => res.data),
};

const realLogisticsRoutesApi = {
  getAll: (params?: { status?: string; orderId?: number }) =>
    api.get<LogisticsRoute[]>('/logistics-routes', { params }).then((res) => res.data),
  getById: (id: number) =>
    api.get<LogisticsRoute>(`/logistics-routes/${id}`).then((res) => res.data),
  create: (data: Partial<LogisticsRoute> & { stages?: Partial<import('../types').RouteStage>[] }) =>
    api.post<LogisticsRoute>('/logistics-routes', data).then((res) => res.data),
  trackByBatch: (batchNumber: string) =>
    api
      .get<ContainerTrackingResult>(`/logistics-routes/track/batch/${batchNumber}`)
      .then((res) => res.data),
  trackByContainer: (batchNumber: string) =>
    api
      .get<ContainerTrackingResult>(`/logistics-routes/track/batch/${batchNumber}`)
      .then((res) => res.data),
  addTracking: (routeId: number, containerId: number, notes?: string) =>
    api
      .post<CargoTracking>(`/logistics-routes/${routeId}/trackings`, { containerId, notes })
      .then((res) => res.data),
  advanceTracking: (trackingId: number) =>
    api
      .patch<CargoTracking>(`/logistics-routes/trackings/${trackingId}/advance`)
      .then((res) => res.data),
  delete: (id: number) => api.delete(`/logistics-routes/${id}`),
};

export const authApi = IS_DEMO_MODE ? demoAuthApi : realAuthApi;
export const dashboardApi = IS_DEMO_MODE ? demoDashboardApi : realDashboardApi;
export const vesselsApi = IS_DEMO_MODE ? demoVesselsApi : realVesselsApi;
export const vesselCallsApi = IS_DEMO_MODE ? demoVesselCallsApi : realVesselCallsApi;
export const berthsApi = IS_DEMO_MODE ? demoBerthsApi : realBerthsApi;
export const containersApi = IS_DEMO_MODE ? demoContainersApi : realContainersApi;
export const trucksApi = IS_DEMO_MODE ? demoTrucksApi : realTrucksApi;
export const truckVisitsApi = IS_DEMO_MODE ? demoTruckVisitsApi : realTruckVisitsApi;
export const warehousesApi = IS_DEMO_MODE ? demoWarehousesApi : realWarehousesApi;
export const wagonsApi = IS_DEMO_MODE ? demoWagonsApi : realWagonsApi;
export const logisticsOrdersApi = IS_DEMO_MODE ? demoLogisticsOrdersApi : realLogisticsOrdersApi;
export const counterpartiesApi = IS_DEMO_MODE ? demoCounterpartiesApi : realCounterpartiesApi;
export const materialFlowsApi = IS_DEMO_MODE ? demoMaterialFlowsApi : realMaterialFlowsApi;
export const infoFlowsApi = IS_DEMO_MODE ? demoInfoFlowsApi : realInfoFlowsApi;
export const logisticsRoutesApi = IS_DEMO_MODE ? demoLogisticsRoutesApi : realLogisticsRoutesApi;

export default api;

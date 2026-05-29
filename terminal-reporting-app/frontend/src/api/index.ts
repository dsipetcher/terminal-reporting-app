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
} from './demoStore';
import { getStoredToken } from './authStorage';
import type { AuthResponse, CreateUserRequest, User } from '../types';

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

export default api;

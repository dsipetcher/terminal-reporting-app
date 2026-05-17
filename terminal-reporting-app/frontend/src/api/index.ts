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

// Использовать переменную окружения для production или localhost для разработки
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard API
export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats').then(res => res.data),
};

// Vessels API
export const vesselsApi = {
  getAll: () => api.get<Vessel[]>('/vessels').then(res => res.data),
  getById: (id: number) => api.get<Vessel>(`/vessels/${id}`).then(res => res.data),
  create: (data: Partial<Vessel>) => api.post<Vessel>('/vessels', data).then(res => res.data),
  update: (id: number, data: Partial<Vessel>) => api.put<Vessel>(`/vessels/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/vessels/${id}`),
};

// Vessel Calls API
export const vesselCallsApi = {
  getAll: (params?: { status?: string; fromDate?: string; toDate?: string }) =>
    api.get<VesselCall[]>('/vessel-calls', { params }).then(res => res.data),
  getById: (id: number) => api.get<VesselCall>(`/vessel-calls/${id}`).then(res => res.data),
  create: (data: Partial<VesselCall>) => api.post<VesselCall>('/vessel-calls', data).then(res => res.data),
  update: (id: number, data: Partial<VesselCall>) =>
    api.put<VesselCall>(`/vessel-calls/${id}`, data).then(res => res.data),
  updateStatus: (id: number, status: string) =>
    api.patch<VesselCall>(`/vessel-calls/${id}/status`, { status }).then(res => res.data),
  delete: (id: number) => api.delete(`/vessel-calls/${id}`),
};

// Berths API
export const berthsApi = {
  getAll: () => api.get<Berth[]>('/berths').then(res => res.data),
  getById: (id: number) => api.get<Berth>(`/berths/${id}`).then(res => res.data),
  create: (data: Partial<Berth>) => api.post<Berth>('/berths', data).then(res => res.data),
  update: (id: number, data: Partial<Berth>) => api.put<Berth>(`/berths/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/berths/${id}`),
};

// Containers API
export const containersApi = {
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

// Trucks API
export const trucksApi = {
  getAll: () => api.get<Truck[]>('/trucks').then(res => res.data),
  getById: (id: number) => api.get<Truck>(`/trucks/${id}`).then(res => res.data),
  create: (data: Partial<Truck>) => api.post<Truck>('/trucks', data).then(res => res.data),
  update: (id: number, data: Partial<Truck>) => api.put<Truck>(`/trucks/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/trucks/${id}`),
};

// Truck Visits API
export const truckVisitsApi = {
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

// Warehouses API
export const warehousesApi = {
  getAll: () => api.get<Warehouse[]>('/warehouses').then(res => res.data),
  getById: (id: number) => api.get<Warehouse>(`/warehouses/${id}`).then(res => res.data),
  create: (data: Partial<Warehouse>) => api.post<Warehouse>('/warehouses', data).then(res => res.data),
  update: (id: number, data: Partial<Warehouse>) =>
    api.put<Warehouse>(`/warehouses/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
};

// Wagons API
export const wagonsApi = {
  getAll: (params?: { status?: string; warehouseId?: number }) =>
    api.get<Wagon[]>('/wagons', { params }).then(res => res.data),
  getById: (id: number) => api.get<Wagon>(`/wagons/${id}`).then(res => res.data),
  create: (data: Partial<Wagon>) => api.post<Wagon>('/wagons', data).then(res => res.data),
  update: (id: number, data: Partial<Wagon>) => api.put<Wagon>(`/wagons/${id}`, data).then(res => res.data),
  updateStatus: (id: number, status: string) =>
    api.patch<Wagon>(`/wagons/${id}/status`, { status }).then(res => res.data),
  delete: (id: number) => api.delete(`/wagons/${id}`),
};

export default api;

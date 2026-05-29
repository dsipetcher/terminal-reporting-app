import axios from 'axios';
import type {
  Vessel,
  VesselCall,
  Berth,
  Container,
  Warehouse,
  Wagon,
  TrainConsist,
  DashboardStats,
  LogisticsOrder,
  LogisticsOrderDocument,
  Counterparty,
  MaterialFlow,
  InfoFlowEvent,
  LogisticsRoute,
  CargoTracking,
  ContainerTrackingResult,
  PortDirectory,
  CargoDirectory,
} from '../types';
import { API_BASE_URL, IS_DEMO_MODE } from './config';
import {
  demoAuthApi,
  demoBerthsApi,
  demoContainersApi,
  demoDashboardApi,
  demoVesselCallsApi,
  demoVesselsApi,
  demoWagonsApi,
  demoTrainConsistsApi,
  demoWarehousesApi,
  demoLogisticsOrdersApi,
  demoLogisticsOrderDocumentsApi,
  demoCounterpartiesApi,
  demoMaterialFlowsApi,
  demoInfoFlowsApi,
  demoLogisticsRoutesApi,
  demoDirectoriesApi,
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

const realWarehousesApi = {
  getAll: () => api.get<Warehouse[]>('/warehouses').then(res => res.data),
  getById: (id: number) => api.get<Warehouse>(`/warehouses/${id}`).then(res => res.data),
  create: (data: Partial<Warehouse>) => api.post<Warehouse>('/warehouses', data).then(res => res.data),
  update: (id: number, data: Partial<Warehouse>) =>
    api.put<Warehouse>(`/warehouses/${id}`, data).then(res => res.data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
};

const realTrainConsistsApi = {
  getAll: (params?: { status?: string; direction?: string }) =>
    api.get<TrainConsist[]>('/train-consists', { params }).then((res) => res.data),
  getById: (id: number) =>
    api.get<TrainConsist>(`/train-consists/${id}`).then((res) => res.data),
  create: (data: Partial<TrainConsist> & { wagonIds?: number[] }) =>
    api.post<TrainConsist>('/train-consists', data).then((res) => res.data),
  createOutbound: (data: {
    trainNumber: string;
    destination: string;
    track?: string;
    wagonIds: number[];
  }) => api.post<TrainConsist>('/train-consists/outbound', data).then((res) => res.data),
  updateStatus: (id: number, status: string) =>
    api.patch<TrainConsist | { id: number; status: string; purged?: boolean }>(
      `/train-consists/${id}/status`,
      { status }
    ).then((res) => res.data),
  disband: (id: number) =>
    api.post<{ id: number; disbanded: boolean }>(`/train-consists/${id}/disband`).then((res) => res.data),
  delete: (id: number) => api.delete(`/train-consists/${id}`),
};

const realWagonsApi = {
  getAll: (params?: {
    status?: string;
    warehouseId?: number;
    withoutConsist?: boolean;
    inParkWithoutConsist?: boolean;
  }) => api.get<Wagon[]>('/wagons', { params }).then(res => res.data),
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

function triggerFileDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const realLogisticsOrderDocumentsApi = {
  getAll: (orderId: number) =>
    api
      .get<LogisticsOrderDocument[]>(`/logistics-orders/${orderId}/documents`)
      .then((res) => res.data),
  upload: (
    orderId: number,
    file: File,
    meta?: { documentType?: string; description?: string }
  ) => {
    const form = new FormData();
    form.append('file', file);
    if (meta?.documentType) form.append('documentType', meta.documentType);
    if (meta?.description) form.append('description', meta.description);
    return api
      .post<LogisticsOrderDocument>(`/logistics-orders/${orderId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },
  download: async (orderId: number, docId: number, fileName: string) => {
    const response = await api.get(`/logistics-orders/${orderId}/documents/${docId}/download`, {
      responseType: 'blob',
    });
    triggerFileDownload(response.data, fileName);
  },
  delete: (orderId: number, docId: number) =>
    api.delete(`/logistics-orders/${orderId}/documents/${docId}`),
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

const realDirectoriesApi = {
  getPorts: () => api.get<PortDirectory[]>('/directories/ports').then((res) => res.data),
  getCargo: () => api.get<CargoDirectory[]>('/directories/cargo').then((res) => res.data),
};

export const authApi = IS_DEMO_MODE ? demoAuthApi : realAuthApi;
export const dashboardApi = IS_DEMO_MODE ? demoDashboardApi : realDashboardApi;
export const vesselsApi = IS_DEMO_MODE ? demoVesselsApi : realVesselsApi;
export const vesselCallsApi = IS_DEMO_MODE ? demoVesselCallsApi : realVesselCallsApi;
export const berthsApi = IS_DEMO_MODE ? demoBerthsApi : realBerthsApi;
export const containersApi = IS_DEMO_MODE ? demoContainersApi : realContainersApi;
export const warehousesApi = IS_DEMO_MODE ? demoWarehousesApi : realWarehousesApi;
export const wagonsApi = IS_DEMO_MODE ? demoWagonsApi : realWagonsApi;
export const trainConsistsApi = IS_DEMO_MODE ? demoTrainConsistsApi : realTrainConsistsApi;
export const logisticsOrdersApi = IS_DEMO_MODE ? demoLogisticsOrdersApi : realLogisticsOrdersApi;
export const logisticsOrderDocumentsApi = IS_DEMO_MODE
  ? demoLogisticsOrderDocumentsApi
  : realLogisticsOrderDocumentsApi;
export const counterpartiesApi = IS_DEMO_MODE ? demoCounterpartiesApi : realCounterpartiesApi;
export const materialFlowsApi = IS_DEMO_MODE ? demoMaterialFlowsApi : realMaterialFlowsApi;
export const infoFlowsApi = IS_DEMO_MODE ? demoInfoFlowsApi : realInfoFlowsApi;
export const logisticsRoutesApi = IS_DEMO_MODE ? demoLogisticsRoutesApi : realLogisticsRoutesApi;
export const directoriesApi = IS_DEMO_MODE ? demoDirectoriesApi : realDirectoriesApi;

export default api;

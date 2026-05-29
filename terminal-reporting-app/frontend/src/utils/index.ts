// Форматирование даты и времени
export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Для input datetime-local
export const toDateTimeLocal = (date: Date | null): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const fromDateTimeLocal = (value: string): Date | null => {
  return value ? new Date(value) : null;
};

// Русские названия
export const VESSEL_TYPE_LABELS: Record<string, string> = {
  CONTAINER: 'Контейнеровоз',
  BULK_CARRIER: 'Балкер',
  TANKER: 'Танкер',
  RORO: 'Паромный (накатная)',
  GENERAL_CARGO: 'Генеральных грузов',
  OTHER: 'Прочие',
};

export const TRANSPORT_CARRIER_STATUS_LABELS: Record<string, string> = {
  EN_ROUTE: 'В пути в терминал',
  ARRIVED: 'Прибыл',
  UNLOADING: 'Разгрузка',
  DEPARTED: 'Убыл',
  CANCELLED: 'Отменён',
  // Legacy codes (display only)
  EXPECTED: 'В пути в терминал',
  LOADING: 'Разгрузка',
  BERTHED: 'Прибыл',
  IN_OPERATION: 'Разгрузка',
};

export const VESSEL_CALL_STATUS_LABELS = TRANSPORT_CARRIER_STATUS_LABELS;

export const BERTH_TYPE_LABELS: Record<string, string> = {
  CONTAINER: 'Контейнерный',
  BULK: 'Навалочных грузов',
  LIQUID: 'Наливной',
  RORO: 'Паромный (накатная)',
  GENERAL: 'Генеральных грузов',
  MULTI_PURPOSE: 'Многоцелевой',
};

export const CARGO_GRADE_LABELS: Record<string, string> = {
  COAL_ANTHRACITE: 'Уголь каменный',
  COAL_COKING: 'Уголь коксующийся',
  OIL_CRUDE: 'Нефть сырая',
  OIL_FUEL: 'Мазут / топливо',
  PETROLEUM: 'Нефтепродукты',
};

export const CONTAINER_TYPE_LABELS = CARGO_GRADE_LABELS;

export const CARGO_CATEGORY_LABELS: Record<string, string> = {
  COAL: 'Уголь',
  OIL: 'Нефть',
  PETROLEUM: 'Нефтепродукты',
};

export const CARGO_BATCH_STATUS_LABELS: Record<string, string> = {
  ON_LAND: 'На суше (в пути на терминал)',
  IN_STORAGE: 'На складе терминала',
  LOADING_BERTH: 'Погрузка у причала',
  ON_VESSEL: 'На судне',
  AT_DESTINATION_PORT: 'В порту назначения',
  DELIVERED: 'Доставлен',
  IN_TERMINAL: 'На складе терминала',
  FULL: 'Принят на терминал',
};

export const CONTAINER_STATUS_LABELS = CARGO_BATCH_STATUS_LABELS;

export const WAGON_TYPE_LABELS: Record<string, string> = {
  PLATFORM: 'Платформа',
  GONDOLA: 'Полувагон',
  BOXCAR: 'Крытый',
  TANK: 'Цистерна',
  REFRIGERATOR: 'Рефрижератор',
};

export const TRAIN_CONSIST_STATUS_LABELS: Record<string, string> = {
  EN_ROUTE: 'В пути в терминал',
  ARRIVED: 'Прибыл',
  UNLOADING: 'Разгрузка',
  IN_PARK: 'В парке',
  FORMING: 'Формирование',
  DEPARTED: 'Убыл',
};

export const WAGON_STATUS_LABELS: Record<string, string> = {
  ...TRANSPORT_CARRIER_STATUS_LABELS,
  ...TRAIN_CONSIST_STATUS_LABELS,
};

export const WAREHOUSE_TYPE_LABELS: Record<string, string> = {
  COAL_YARD: 'Площадка угля',
  OIL_TANK: 'Резервуарный парк нефти',
  OPEN_YARD: 'Открытая площадка',
  COVERED: 'Крытый склад',
  REFRIGERATED: 'Холодильник',
  CUSTOMS: 'Таможенная зона',
  EMPTY_DEPOT: 'Депо порожних',
};

/** Номер партии груза терминала (уголь / нефть) */
export function validateBatchNumber(number: string): boolean {
  const normalized = number.toUpperCase().trim();
  return /^[A-Z]{2,6}-[\dA-Z-]{4,14}$/.test(normalized) || /^[A-Z0-9-]{6,24}$/.test(normalized);
}

export function validateContainerNumber(number: string): boolean {
  return validateBatchNumber(number);
}

export const PARTNER_TYPE_LABELS: Record<string, string> = {
  CLIENT: 'Клиент',
  CARRIER: 'Перевозчик',
  AGENT: 'Агент',
  CUSTOMS: 'Таможня',
  RAILWAY: 'Ж/д оператор',
};

export const ORDER_TYPE_LABELS: Record<string, string> = {
  EXPORT_BULK: 'Экспорт навалом (уголь/нефть)',
  STORAGE: 'Хранение на терминале',
  SHIP_LOADING: 'Погрузка на судно',
  TRANSPORT: 'Перевозка',
  TRANSSHIPMENT: 'Перегрузка',
  CUSTOMS: 'Таможня',
};

export const EXPORT_ROUTE_CHAIN =
  'Поставщик → Вагоны → Склад → Причал → Судно → Порт назначения';

export const MANAGEMENT_LEVEL_LABELS: Record<string, string> = {
  PLANNING: 'Плановый уровень',
  DISPATCH: 'Диспетчерский уровень',
  OPERATIONAL: 'Оперативный уровень',
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  PLANNED: 'Запланирован',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export const ORDER_DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CONTRACT: 'Договор',
  INVOICE: 'Счёт',
  WAYBILL: 'Накладная',
  CERTIFICATE: 'Сертификат',
  CUSTOMS: 'Таможенный документ',
  OTHER: 'Прочее',
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export const ILS_FUNCTION_LABELS: Record<string, string> = {
  PLANNING: 'Планирование',
  REGULATION: 'Регулирование',
  CONTROL: 'Контроль',
  ANALYSIS: 'Анализ',
  ACCOUNTING: 'Учёт',
};

export const MATERIAL_FLOW_TYPE_LABELS: Record<string, string> = {
  ARRIVAL: 'Поступление',
  DEPARTURE: 'Отгрузка',
  INTERNAL_TRANSFER: 'Перемещение',
  STORAGE: 'Хранение',
};

export const ROUTE_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Запланирован',
  ACTIVE: 'Активен',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export const ROUTE_STAGE_TYPE_LABELS: Record<string, string> = {
  SUPPLIER: 'Поставщик',
  RAIL_STATION: 'Вагоны',
  WAREHOUSE: 'Склад терминала',
  BERTH: 'Причал погрузки',
  SHIP: 'Судно',
  PORT: 'Порт назначения',
  TERMINAL: 'Терминал',
  CUSTOMS: 'Таможня',
  CLIENT: 'Клиент',
  BORDER: 'Граница',
};

/** Состояние груза по этапу маршрута (транспорт — временный носитель). */
export function cargoStatusFromStageType(stageType: string): string {
  switch (stageType) {
    case 'SUPPLIER':
    case 'RAIL_STATION':
      return 'ON_LAND';
    case 'WAREHOUSE':
      return 'IN_STORAGE';
    case 'BERTH':
      return 'LOADING_BERTH';
    case 'SHIP':
      return 'ON_VESSEL';
    case 'PORT':
      return 'AT_DESTINATION_PORT';
    default:
      return 'ON_LAND';
  }
}

const LEGACY_TRANSPORT_STATUS: Record<string, string> = {
  EXPECTED: 'EN_ROUTE',
  LOADING: 'UNLOADING',
  BERTHED: 'ARRIVED',
  IN_OPERATION: 'UNLOADING',
};

function normalizeTransportStatus(status: string): string {
  return LEGACY_TRANSPORT_STATUS[status] ?? status;
}

const TRANSPORT_CARRIER_STATUS_ORDER = ['EN_ROUTE', 'ARRIVED', 'UNLOADING', 'DEPARTED'];
const VESSEL_CALL_STATUS_ORDER = [...TRANSPORT_CARRIER_STATUS_ORDER, 'CANCELLED'];

function statusRank(order: string[], status: string): number {
  const idx = order.indexOf(normalizeTransportStatus(status));
  return idx === -1 ? -1 : idx;
}

function shouldAdvanceStatus(current: string, next: string, order: string[]): boolean {
  const cur = normalizeTransportStatus(current);
  const nxt = normalizeTransportStatus(next);
  if (cur === 'CANCELLED') return false;
  if (nxt === 'DEPARTED') return cur !== 'DEPARTED' && cur !== 'CANCELLED';
  return statusRank(order, nxt) > statusRank(order, cur);
}

export const INBOUND_CONSIST_STATUS_ORDER = ['EN_ROUTE', 'ARRIVED', 'UNLOADING'] as const;
export const OUTBOUND_CONSIST_STATUS_ORDER = ['FORMING', 'DEPARTED'] as const;

export function trainConsistStatusForStage(stageType: string): string | null {
  switch (stageType) {
    case 'SUPPLIER':
      return 'EN_ROUTE';
    case 'RAIL_STATION':
      return 'ARRIVED';
    case 'WAREHOUSE':
      return 'UNLOADING';
    default:
      return null;
  }
}

export function isPastUnloadingStage(stageType: string): boolean {
  return ['BERTH', 'SHIP', 'PORT', 'DELIVERED'].includes(stageType);
}

export function wagonStatusForStage(stageType: string): string | null {
  return trainConsistStatusForStage(stageType);
}

export function vesselCallStatusForStage(stageType: string): string | null {
  switch (stageType) {
    case 'BERTH':
      return 'ARRIVED';
    case 'SHIP':
      return 'UNLOADING';
    case 'PORT':
    case 'DELIVERED':
      return 'DEPARTED';
    default:
      return null;
  }
}

export function releaseDemoTransportAfterDelivery(
  containerId: number,
  ctx: {
    containers: { id: number; vesselCallId?: number | null; status?: string }[];
    wagons: { id: number; containerId?: number | null }[];
    vesselCalls: {
      id: number;
      vesselId: number;
      status: string;
      voyageNumber: string;
      vessel?: { name: string };
    }[];
    vessels: { id: number }[];
    routeStages: { id: number; routeId: number; stageType: string; locationName?: string }[];
    cargoTrackings: { containerId: number; routeId: number }[];
    logisticsOrders?: { id: number; vesselCallId?: number | null }[];
  }
): void {
  const containerIndex = ctx.containers.findIndex((c) => c.id === containerId);
  if (containerIndex < 0) return;

  const container = ctx.containers[containerIndex];
  const callId = container.vesselCallId;

  if (callId) {
    const call = ctx.vesselCalls.find((c) => c.id === callId);
    if (call?.vessel) {
      const shipLabel = `${call.vessel.name} · рейс ${call.voyageNumber}`;
      for (const tracking of ctx.cargoTrackings.filter((t) => t.containerId === containerId)) {
        ctx.routeStages.forEach((stage, idx) => {
          if (stage.routeId === tracking.routeId && stage.stageType === 'SHIP') {
            ctx.routeStages[idx] = { ...stage, locationName: shipLabel };
          }
        });
      }
    }
  }

  ctx.containers[containerIndex] = { ...container, vesselCallId: null };

  if (!callId) return;

  const activeOnCall = ctx.containers.filter(
    (c) => c.vesselCallId === callId && c.status !== 'DELIVERED'
  ).length;
  if (activeOnCall > 0) return;

  ctx.logisticsOrders?.forEach((order, idx) => {
    if (order.vesselCallId === callId) {
      ctx.logisticsOrders![idx] = { ...order, vesselCallId: undefined };
    }
  });

  const callIndex = ctx.vesselCalls.findIndex((c) => c.id === callId);
  if (callIndex < 0) return;
  const vesselId = ctx.vesselCalls[callIndex].vesselId;
  ctx.vesselCalls.splice(callIndex, 1);

  const hasOtherCalls = ctx.vesselCalls.some((c) => c.vesselId === vesselId);
  if (!hasOtherCalls) {
    const vesselIndex = ctx.vessels.findIndex((v) => v.id === vesselId);
    if (vesselIndex >= 0) ctx.vessels.splice(vesselIndex, 1);
  }
}

export function syncDemoTransportWithStage(
  containerId: number,
  stageType: string,
  ctx: {
    wagons: {
      id: number;
      containerId?: number | null;
      trainConsistId?: number | null;
      status: string;
      arrivalAt?: string;
      cargo?: string;
      cargoWeight?: number;
    }[];
    trainConsists: {
      id: number;
      status: string;
      destination?: string | null;
      formedAt?: string | null;
      departureAt?: string | null;
      direction?: string;
    }[];
    containers: { id: number; vesselCallId?: number | null }[];
    vesselCalls: { id: number; status: string; ata?: string | null; atd?: string | null }[];
    now: string;
  }
): void {
  const wagon = ctx.wagons.find((w) => w.containerId === containerId);
  if (wagon?.trainConsistId) {
    const ci = ctx.trainConsists.findIndex((c) => c.id === wagon.trainConsistId);
    if (ci >= 0) {
      const consist = ctx.trainConsists[ci];
      if (consist.direction === 'OUTBOUND') return;

      if (isPastUnloadingStage(stageType)) {
        const consistId = consist.id;
        ctx.trainConsists.splice(ci, 1);
        ctx.wagons.forEach((w, wi) => {
          if (w.trainConsistId !== consistId) return;
          ctx.wagons[wi] = {
            ...w,
            status: 'IN_PARK',
            trainConsistId: undefined,
            containerId: undefined,
            cargo: undefined,
            cargoWeight: undefined,
          };
        });
      } else {
        const consistStatus = trainConsistStatusForStage(stageType);
        if (
          consistStatus &&
          shouldAdvanceStatus(consist.status, consistStatus, [...INBOUND_CONSIST_STATUS_ORDER])
        ) {
          ctx.trainConsists[ci] = { ...consist, status: consistStatus };
          ctx.wagons.forEach((w, wi) => {
            if (w.trainConsistId !== consist.id) return;
            ctx.wagons[wi] = {
              ...w,
              status: consistStatus,
              ...(consistStatus === 'ARRIVED' ? { arrivalAt: ctx.now } : {}),
            };
          });
        }
      }
    }
  }

  const container = ctx.containers.find((c) => c.id === containerId);
  const vesselStatus = vesselCallStatusForStage(stageType);
  if (!container?.vesselCallId || !vesselStatus) return;

  const callIndex = ctx.vesselCalls.findIndex((c) => c.id === container.vesselCallId);
  if (callIndex < 0) return;
  const call = ctx.vesselCalls[callIndex];
  if (!shouldAdvanceStatus(call.status, vesselStatus, VESSEL_CALL_STATUS_ORDER)) return;

  ctx.vesselCalls[callIndex] = {
    ...call,
    status: vesselStatus,
    ...(vesselStatus === 'ARRIVED' ? { ata: call.ata ?? ctx.now } : {}),
    ...(vesselStatus === 'DEPARTED' ? { atd: ctx.now } : {}),
  };
}

export const ROUTE_STAGE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидается',
  CURRENT: 'Текущий этап',
  COMPLETED: 'Пройден',
  SKIPPED: 'Пропущен',
};

export const CARGO_TRACKING_STATUS_LABELS: Record<string, string> = {
  REGISTERED: 'Зарегистрирован',
  IN_TRANSIT: 'В пути',
  AT_STAGE: 'На этапе',
  DELIVERED: 'Доставлен',
  DELAYED: 'Задержка',
};

export const TRANSPORT_MODE_LABELS: Record<string, string> = {
  SEA: 'Морской',
  RAIL: 'Железнодорожный',
  WAREHOUSE: 'Хранение на складе',
};

/** Legacy DB values are shown as rail — road transport is not used. */
export function normalizeTransportMode(mode?: string | null): string | undefined {
  if (!mode) return undefined;
  if (mode === 'ROAD' || mode === 'ROAD_GATE') return 'RAIL';
  return mode;
}

export function getTransportModeLabel(mode?: string | null): string {
  const normalized = normalizeTransportMode(mode);
  if (!normalized) return '—';
  return TRANSPORT_MODE_LABELS[normalized] ?? normalized;
}

export function findWagonByContainerId<
  T extends { id: number; containerId?: number | null; number?: string },
>(wagons: T[], containerId: number): T | undefined {
  return wagons.find((w) => w.containerId === containerId);
}

export function validateWagonContainerAssignment<
  T extends { id: number; containerId?: number | null; number?: string },
>(wagons: T[], containerId: number, wagonId?: number | null): string | null {
  const existing = findWagonByContainerId(wagons, containerId);
  if (existing && existing.id !== wagonId) {
    return `Партия уже привязана к вагону №${existing.number ?? existing.id}`;
  }
  if (wagonId) {
    const wagon = wagons.find((w) => w.id === wagonId);
    if (wagon?.containerId && wagon.containerId !== containerId) {
      return `Вагон №${wagon.number ?? wagon.id} уже привязан к другой партии`;
    }
  }
  return null;
}

export function validateContainerVesselAssignment(
  currentVesselCallId: number | null | undefined,
  nextVesselCallId: number | null | undefined
): string | null {
  if (!nextVesselCallId) return null;
  if (currentVesselCallId && currentVesselCallId !== nextVesselCallId) {
    return 'У партии уже назначен судозаход';
  }
  return null;
}

export const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  PLANNER: 'Плановик',
  DISPATCHER: 'Диспетчер',
  WAREHOUSE: 'Кладовщик',
  USER: 'Пользователь',
};

export const CUSTOMS_STATUS_LABELS: Record<string, string> = {
  CLEARED: 'Выпущен',
  PENDING: 'На таможне',
  HELD: 'Задержан',
  INSPECTION: 'Досмотр',
};

/** Подписи полей и сокращений в интерфейсе (русский) */
export const FIELD_LABELS = {
  IMO: 'Номер ИМО',
  ETA: 'Плановое прибытие',
  ETD: 'Плановый отход',
  ATA: 'Фактическое прибытие',
  ATD: 'Фактический отход',
  GT: 'Валовая вместимость',
  DWT: 'Дедвейт',
  BL: 'Коносамент',
  POL: 'Порт погрузки',
  POD: 'Порт выгрузки',
} as const;

/** Русские названия портов и локаций по коду НСИ */
export const PORT_CODE_LABELS: Record<string, string> = {
  RUNVS: 'Новороссийск (терминал)',
  TRMER: 'Мерсин',
  CNQDG: 'Циндао',
  RUTAM: 'Тамань (ТТНГ)',
  ITGIT: 'Таранто',
  KUZBASS: 'Кузбасс',
  'SAMARA-NPZ': 'Самара (НПЗ)',
  'PORT-DEST': 'Порт назначения',
};

export function formatPortCode(code?: string | null): string {
  if (!code?.trim()) return '—';
  const raw = code.trim();
  if (raw.includes('/') || raw.includes('·')) {
    return raw
      .split(/[/·]/)
      .map((part) => formatPortCode(part.trim()))
      .filter((part) => part !== '—')
      .join(' · ');
  }
  const normalized = raw.toUpperCase();
  return PORT_CODE_LABELS[normalized] ?? raw;
}

export function formatWarehouseLabel(
  warehouse?: { number: string; name?: string | null } | null
): string {
  if (!warehouse) return '—';
  return warehouse.name?.trim() || `Склад ${warehouse.number}`;
}

export function formatBerthLabel(berth?: { number: string; name?: string | null } | null): string {
  if (!berth) return '—';
  return berth.name?.trim() || `Причал №${berth.number}`;
}

export const EVENT_TYPE_LABELS: Record<string, string> = {
  CREATE: 'Создание',
  UPDATE: 'Изменение',
  STATUS_CHANGE: 'Смена статуса',
  DELETE: 'Удаление',
};

export const DIRECTORY_CARGO_CATEGORY_LABELS: Record<string, string> = {
  BULK: 'Навал',
  LIQUID: 'Налив',
  CONTAINERIZED: 'Контейнер',
  GENERAL: 'Генеральный',
  DANGEROUS: 'Опасный',
};

const STATUS_LABEL_MAPS: Record<string, string>[] = [
  VESSEL_CALL_STATUS_LABELS,
  CARGO_BATCH_STATUS_LABELS,
  WAGON_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  ROUTE_STATUS_LABELS,
  ROUTE_STAGE_STATUS_LABELS,
  CARGO_TRACKING_STATUS_LABELS,
  ILS_FUNCTION_LABELS,
  CUSTOMS_STATUS_LABELS,
  USER_ROLE_LABELS,
  WAREHOUSE_TYPE_LABELS,
  VESSEL_TYPE_LABELS,
  BERTH_TYPE_LABELS,
  WAGON_TYPE_LABELS,
  TRANSPORT_MODE_LABELS,
  MATERIAL_FLOW_TYPE_LABELS,
  ORDER_TYPE_LABELS,
  MANAGEMENT_LEVEL_LABELS,
  PARTNER_TYPE_LABELS,
  EVENT_TYPE_LABELS,
  DIRECTORY_CARGO_CATEGORY_LABELS,
];

/** Русская подпись для enum-значения; при отсутствии — исходный код. */
export function getStatusLabel(status: string, preferred?: Record<string, string>): string {
  if (preferred?.[status]) return preferred[status];
  for (const map of STATUS_LABEL_MAPS) {
    if (map[status]) return map[status];
  }
  return status;
}

// Цвета для статусов
export const STATUS_COLORS: Record<string, string> = {
  EN_ROUTE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
  EXPECTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
  IN_PARK: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  FORMING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
  ARRIVED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300',
  BERTHED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
  IN_OPERATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
  UNLOADING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
  LOADING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
  DEPARTED: 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',

  EMPTY: 'bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
  FULL: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300',
  ON_VESSEL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
  IN_TERMINAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
  ON_DELIVERY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-300',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300',

  SCHEDULED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
  IN_PROGRESS: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300',

  DRAFT: 'bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
  PLANNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',

  PLANNING: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
  REGULATION: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
  CONTROL: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300',
  ANALYSIS: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300',
  ACCOUNTING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',

  CURRENT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
  PENDING: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  SKIPPED: 'bg-gray-200 text-gray-500 dark:bg-slate-800 dark:text-slate-500',
  REGISTERED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
  AT_STAGE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300',
  DELAYED: 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300',
};

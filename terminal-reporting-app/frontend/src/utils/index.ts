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
  RORO: 'Ro-Ro',
  GENERAL_CARGO: 'Генеральных грузов',
  OTHER: 'Прочие',
};

export const VESSEL_CALL_STATUS_LABELS: Record<string, string> = {
  EXPECTED: 'Ожидается',
  ARRIVED: 'Прибыло',
  BERTHED: 'У причала',
  IN_OPERATION: 'Обрабатывается',
  DEPARTED: 'Убыло',
  CANCELLED: 'Отменен',
};

export const BERTH_TYPE_LABELS: Record<string, string> = {
  CONTAINER: 'Контейнерный',
  BULK: 'Навалочных грузов',
  LIQUID: 'Наливной',
  RORO: 'Ro-Ro',
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

export const WAGON_STATUS_LABELS: Record<string, string> = {
  EXPECTED: 'Ожидается',
  ARRIVED: 'Прибыл',
  UNLOADING: 'Выгрузка',
  LOADING: 'Погрузка',
  DEPARTED: 'Убыл',
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

export const TRUCK_TYPE_LABELS: Record<string, string> = {
  TRUCK: 'Фура',
  CONTAINER_TRUCK: 'Контейнеровоз',
  DUMP_TRUCK: 'Самосвал',
  REFRIGERATOR: 'Рефрижератор',
};

export const TRUCK_VISIT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Запланирован',
  ARRIVED: 'Прибыл',
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
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
  'Поставщик → ЖД / Авто → Склад → Причал → Судно → Порт назначения';

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
  RAIL_STATION: 'Ж/д фронт',
  ROAD_GATE: 'Автовесовая',
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
    case 'ROAD_GATE':
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
  ROAD: 'Автомобильный',
  WAREHOUSE: 'Хранение на складе',
};

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

// Цвета для статусов
export const STATUS_COLORS: Record<string, string> = {
  EXPECTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300',
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

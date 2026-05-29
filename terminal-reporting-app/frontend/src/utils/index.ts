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

export const CONTAINER_TYPE_LABELS: Record<string, string> = {
  TWENTY_GP: "20' GP",
  TWENTY_HC: "20' HC",
  FORTY_GP: "40' GP",
  FORTY_HC: "40' HC",
  FORTY_FIVE_HC: "45' HC",
  TWENTY_RF: "20' RF",
  FORTY_RF: "40' RF",
  TWENTY_OT: "20' OT",
  FORTY_OT: "40' OT",
  TWENTY_FR: "20' FR",
  FORTY_FR: "40' FR",
  TWENTY_TK: "20' TK",
};

export const CONTAINER_STATUS_LABELS: Record<string, string> = {
  EMPTY: 'Пустой',
  FULL: 'Полный',
  ON_VESSEL: 'На судне',
  IN_TERMINAL: 'На терминале',
  ON_DELIVERY: 'На доставке',
  DELIVERED: 'Доставлен',
};

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
};

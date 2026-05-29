import {
  dashboardApi,
  vesselCallsApi,
  containersApi,
  wagonsApi,
  warehousesApi,
  materialFlowsApi,
  infoFlowsApi,
  logisticsOrdersApi,
} from '../api';
import {
  formatDateTime,
  formatDate,
  VESSEL_CALL_STATUS_LABELS,
  CONTAINER_STATUS_LABELS,
  WAGON_STATUS_LABELS,
  WAREHOUSE_TYPE_LABELS,
  ILS_FUNCTION_LABELS,
} from '../utils';

export type ReportTypeId =
  | 'terminal-summary'
  | 'vessel-calls'
  | 'cargo-movement'
  | 'wagons'
  | 'warehouses'
  | 'info-flows';

export interface ReportDefinition {
  id: ReportTypeId;
  title: string;
  description: string;
  frRef?: string;
}

export interface ReportResult {
  title: string;
  generatedAt: string;
  periodLabel: string;
  headers: string[];
  rows: string[][];
  summary?: string;
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: 'terminal-summary',
    title: 'Сводка по терминалу',
    description: 'KPI: партии, заказы, транспорт, потоки за период',
    frRef: 'FR-18',
  },
  {
    id: 'vessel-calls',
    title: 'Судозаходы за период',
    description: 'Рейсы, причалы, статусы обработки',
    frRef: 'FR-18',
  },
  {
    id: 'cargo-movement',
    title: 'Движение партий груза',
    description: 'Статус партий и материальные потоки',
    frRef: 'FR-18',
  },
  {
    id: 'wagons',
    title: 'Работа вагонного фронта',
    description: 'Прибытие, выгрузка, статусы вагонов',
    frRef: 'FR-18',
  },
  {
    id: 'warehouses',
    title: 'Загрузка складов',
    description: 'Ёмкость, загрузка, количество партий',
    frRef: 'FR-18',
  },
  {
    id: 'info-flows',
    title: 'Журнал информационных потоков',
    description: 'События ИЛС по функциям за период',
    frRef: 'FR-18',
  },
];

function inDateRange(isoDate: string | undefined, from: Date, to: Date): boolean {
  if (!isoDate) return true;
  const d = new Date(isoDate);
  return d >= from && d <= to;
}

function periodLabel(from: Date, to: Date): string {
  return `${formatDate(from)} — ${formatDate(to)}`;
}

export async function generateReport(
  type: ReportTypeId,
  from: Date,
  to: Date
): Promise<ReportResult> {
  const generatedAt = new Date().toISOString();
  const period = periodLabel(from, to);
  const def = REPORT_DEFINITIONS.find((r) => r.id === type)!;

  switch (type) {
    case 'terminal-summary':
      return buildTerminalSummary(def.title, generatedAt, period, from, to);
    case 'vessel-calls':
      return buildVesselCallsReport(def.title, generatedAt, period, from, to);
    case 'cargo-movement':
      return buildCargoMovementReport(def.title, generatedAt, period, from, to);
    case 'wagons':
      return buildWagonsReport(def.title, generatedAt, period, from, to);
    case 'warehouses':
      return buildWarehousesReport(def.title, generatedAt, period);
    case 'info-flows':
      return buildInfoFlowsReport(def.title, generatedAt, period, from, to);
    default:
      throw new Error('Unknown report type');
  }
}

async function buildTerminalSummary(
  title: string,
  generatedAt: string,
  period: string,
  from: Date,
  to: Date
): Promise<ReportResult> {
  const [stats, orders, flows] = await Promise.all([
    dashboardApi.getStats(),
    logisticsOrdersApi.getAll(),
    infoFlowsApi.getAll({ limit: 500 }),
  ]);

  const ordersInPeriod = orders.filter((o) => inDateRange(o.createdAt, from, to));
  const flowsInPeriod = flows.filter((f) => inDateRange(f.createdAt, from, to));

  const headers = ['Показатель', 'Значение'];
  const rows: string[][] = [
    ['Партий на терминале', String(stats.containers ?? 0)],
    ['Партий на маршруте', String(stats.cargoOnRoutes ?? 0)],
    ['Активных судозаходов', String(stats.vesselCallsActive ?? 0)],
    ['Заказов в работе', String(stats.ordersInProgress ?? 0)],
    ['Вагонов', String(stats.wagons ?? 0)],
    ['Автомобилей', String(stats.trucks ?? 0)],
    ['Складов', String(stats.warehouses ?? 0)],
    ['Заказов за период', String(ordersInPeriod.length)],
    ['Событий ИЛС за период', String(flowsInPeriod.length)],
    ['Материальных потоков сегодня', String(stats.materialFlowsToday ?? 0)],
  ];

  return {
    title,
    generatedAt,
    periodLabel: period,
    headers,
    rows,
    summary: `Сводный отчёт ИЛС за ${period}`,
  };
}

async function buildVesselCallsReport(
  title: string,
  generatedAt: string,
  period: string,
  from: Date,
  to: Date
): Promise<ReportResult> {
  const calls = await vesselCallsApi.getAll({
    fromDate: from.toISOString(),
    toDate: to.toISOString(),
  });

  const filtered = calls.filter(
    (c) => inDateRange(c.eta, from, to) || inDateRange(c.createdAt, from, to)
  );

  const headers = ['Судно', 'IMO', 'Рейс', 'Причал', 'Статус', 'ETA', 'ATA'];
  const rows = filtered.map((c) => [
    c.vessel.name,
    c.vessel.imoNumber,
    c.voyageNumber,
    c.berth ? `№${c.berth.number}` : '—',
    VESSEL_CALL_STATUS_LABELS[c.status] ?? c.status,
    c.eta ? formatDateTime(c.eta) : '—',
    c.ata ? formatDateTime(c.ata) : '—',
  ]);

  return {
    title,
    generatedAt,
    periodLabel: period,
    headers,
    rows,
    summary: `Судозаходов за период: ${rows.length}`,
  };
}

async function buildCargoMovementReport(
  title: string,
  generatedAt: string,
  period: string,
  from: Date,
  to: Date
): Promise<ReportResult> {
  const [containers, flows] = await Promise.all([
    containersApi.getAll(),
    materialFlowsApi.getAll(),
  ]);

  const containersInPeriod = containers.filter((c) => inDateRange(c.updatedAt, from, to));
  const flowsInPeriod = flows.filter((f) => inDateRange(f.createdAt, from, to));

  const headers = ['Тип записи', 'Партия / описание', 'Статус / режим', 'Масса, т', 'Дата'];
  const rows: string[][] = [
    ...containersInPeriod.map((c) => [
      'Партия',
      c.containerNumber,
      CONTAINER_STATUS_LABELS[c.status] ?? c.status,
      c.grossWeight != null ? String(c.grossWeight) : c.quantityTons != null ? String(c.quantityTons) : '—',
      formatDateTime(c.updatedAt),
    ]),
    ...flowsInPeriod.map((f) => [
      'Мат. поток',
      f.description ?? f.transportMode ?? '—',
      f.transportMode ?? '—',
      f.quantity != null ? String(f.quantity) : '—',
      formatDateTime(f.createdAt),
    ]),
  ];

  return {
    title,
    generatedAt,
    periodLabel: period,
    headers,
    rows,
    summary: `Партий: ${containersInPeriod.length}, материальных потоков: ${flowsInPeriod.length}`,
  };
}

async function buildWagonsReport(
  title: string,
  generatedAt: string,
  period: string,
  from: Date,
  to: Date
): Promise<ReportResult> {
  const wagons = await wagonsApi.getAll();
  const filtered = wagons.filter(
    (w) => inDateRange(w.arrivalAt, from, to) || inDateRange(w.updatedAt, from, to)
  );

  const headers = ['№ вагона', 'Тип', 'Статус', 'Склад', 'Партия', 'Прибытие', 'Убытие'];
  const rows = filtered.map((w) => [
    w.number,
    w.wagonType,
    WAGON_STATUS_LABELS[w.status] ?? w.status,
    w.warehouse?.number ?? '—',
    w.container?.containerNumber ?? '—',
    formatDateTime(w.arrivalAt),
    w.departureAt ? formatDateTime(w.departureAt) : '—',
  ]);

  return {
    title,
    generatedAt,
    periodLabel: period,
    headers,
    rows,
    summary: `Вагонов за период: ${rows.length}`,
  };
}

async function buildWarehousesReport(
  title: string,
  generatedAt: string,
  period: string
): Promise<ReportResult> {
  const warehouses = await warehousesApi.getAll();

  const headers = ['№', 'Название', 'Тип', 'Ёмкость, т', 'Загрузка, т', 'Заполнение, %', 'Партий', 'Вагонов'];
  const rows = warehouses.map((w) => {
    const load = w.load ?? 0;
    const pct = w.capacity > 0 ? Math.round((load / w.capacity) * 100) : 0;
    return [
      w.number,
      w.name ?? '—',
      WAREHOUSE_TYPE_LABELS[w.warehouseType] ?? w.warehouseType,
      String(w.capacity),
      String(load),
      String(pct),
      String(w._count?.containers ?? 0),
      String(w._count?.wagons ?? 0),
    ];
  });

  return {
    title,
    generatedAt,
    periodLabel: period,
    headers,
    rows,
    summary: `Складов: ${rows.length}`,
  };
}

async function buildInfoFlowsReport(
  title: string,
  generatedAt: string,
  period: string,
  from: Date,
  to: Date
): Promise<ReportResult> {
  const events = await infoFlowsApi.getAll({ limit: 500 });
  const filtered = events.filter((e) => inDateRange(e.createdAt, from, to));

  const headers = ['Дата', 'Функция ИЛС', 'Тип', 'Сообщение', 'Заказ'];
  const rows = filtered.map((e) => [
    formatDateTime(e.createdAt),
    ILS_FUNCTION_LABELS[e.ilsFunction] ?? e.ilsFunction,
    e.eventType,
    e.message,
    e.orderId ? String(e.orderId) : '—',
  ]);

  return {
    title,
    generatedAt,
    periodLabel: period,
    headers,
    rows,
    summary: `Событий за период: ${rows.length}`,
  };
}

export function getReportDefinition(id: ReportTypeId): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find((r) => r.id === id);
}

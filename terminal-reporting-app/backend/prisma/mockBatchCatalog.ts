export type BatchDef = {
  containerNumber: string;
  containerType: string;
  cargoCategory: string;
  supplierName: string;
  cargoDescription: string;
  quantityTons: number;
  portOfLoading: string;
  portOfDischarge: string;
  warehouseKey?: 'coal' | 'oil';
  location?: string;
  vesselCallKey?: string;
  shipVoyageSnapshot?: string;
  progress: number | 'delivered';
  routeNumber: string;
  routeName: string;
  origin: string;
  destCode: string;
  destName: string;
  orderKey: 'coal' | 'oil' | 'planning' | 'operational' | 'archive';
  wagon?: { number: string; trainNumber: string; track: string };
  blNumber?: string;
};

const DESTINATIONS = [
  { code: 'TRMER', name: 'Порт Мерсин' },
  { code: 'CNQDG', name: 'Порт Циндао' },
  { code: 'ITGIT', name: 'Порт Таранто' },
  { code: 'EGALY', name: 'Порт Александрия' },
  { code: 'INMUM', name: 'Порт Mumbai' },
] as const;

const COAL_TYPES = ['COAL_ANTHRACITE', 'COAL_COKING'] as const;
const OIL_TYPES = ['OIL_CRUDE', 'OIL_FUEL'] as const;

function coalDescription(type: string, n: number): string {
  if (type === 'COAL_COKING') return `Коксующийся уголь K — партия ${n}`;
  return `Уголь каменный марки Д — партия ${n}`;
}

function oilDescription(type: string, n: number): string {
  if (type === 'OIL_FUEL') return `Мазут топочный М-100 — партия ${n}`;
  return `Нефть сырая Urals — партия ${n}`;
}

function progressLabel(progress: number | 'delivered', category: string): string {
  if (progress === 'delivered') return 'цикл завершён';
  const labels = [
    'в пути в терминал',
    'прибыл на ж/д фронт',
    'разгрузка на терминале',
    'вагон в парке',
    'на борту судна',
    'морская перевозка',
  ];
  const prefix = category === 'COAL' ? 'Уголь' : category === 'OIL' ? 'Нефть' : 'НП';
  return `${prefix} · ${labels[progress - 1]}`;
}

function vesselCallForBatch(
  category: 'COAL' | 'OIL' | 'PETROLEUM',
  progress: number | 'delivered'
): { vesselCallKey?: string; shipVoyageSnapshot?: string } {
  if (progress === 'delivered') {
    return { shipVoyageSnapshot: category === 'COAL' ? '206N' : 'T103' };
  }
  if (typeof progress !== 'number') return {};

  if (category === 'COAL') {
    if (progress <= 2) return { vesselCallKey: progress === 1 ? '208N' : '205N' };
    if (progress <= 4) return { vesselCallKey: '204N' };
    if (progress === 5) return { vesselCallKey: '204N' };
    return { vesselCallKey: '206N' };
  }

  if (category === 'OIL') {
    if (progress <= 2) return { vesselCallKey: progress === 1 ? 'T104' : 'T102' };
    if (progress <= 4) return { vesselCallKey: 'T101' };
    if (progress === 5) return { vesselCallKey: 'T102' };
    return { vesselCallKey: 'T103' };
  }

  return {};
}

function warehouseForBatch(
  category: 'COAL' | 'OIL' | 'PETROLEUM',
  progress: number | 'delivered',
  index: number
): { warehouseKey?: 'coal' | 'oil'; location?: string } {
  if (typeof progress !== 'number' || progress < 3) return {};
  if (progress >= 5) return {};
  if (category === 'COAL') {
    const sectors = ['Сектор A-1', 'Сектор A-2', 'Сектор A-3', 'Сектор B-1', 'Сектор B-2', 'Сектор C-1'];
    return { warehouseKey: 'coal', location: sectors[index % sectors.length] };
  }
  if (category === 'OIL') {
    const tanks = ['Резервуар R-1', 'Резервуар R-2', 'Резервуар R-3', 'Резервуар R-4', 'Резервуар R-5'];
    return { warehouseKey: 'oil', location: tanks[index % tanks.length] };
  }
  return {};
}

function wagonForBatch(
  category: 'COAL' | 'OIL' | 'PETROLEUM',
  progress: number | 'delivered',
  wagonNumber: string,
  trainNumber: string,
  track: string
): BatchDef['wagon'] | undefined {
  if (progress === 'delivered' || (typeof progress === 'number' && progress >= 5)) {
    return undefined;
  }
  if (category === 'PETROLEUM') {
    return undefined;
  }
  return { number: wagonNumber, trainNumber, track };
}

function buildCoalBatches(): BatchDef[] {
  const batches: BatchDef[] = [];
  const progressCycle: Array<number | 'delivered'> = [
    1, 2, 3, 4, 5, 6,
    1, 2, 3, 4, 5, 6,
    1, 2, 3, 4,
    'delivered', 'delivered', 'delivered', 'delivered',
  ];

  for (let i = 0; i < 20; i++) {
    const n = i + 1;
    const progress = progressCycle[i];
    const type = COAL_TYPES[i % COAL_TYPES.length];
    const dest = DESTINATIONS[i % DESTINATIONS.length];
    const vessel = vesselCallForBatch('COAL', progress);
    const wh = warehouseForBatch('COAL', progress, i);

    batches.push({
      containerNumber: `COAL-2026-${String(n).padStart(4, '0')}`,
      containerType: type,
      cargoCategory: 'COAL',
      supplierName: 'АО «Кузбассуголь»',
      cargoDescription: coalDescription(type, n),
      quantityTons: 3600 + (n % 7) * 250,
      portOfLoading: 'RUNVS',
      portOfDischarge: dest.code,
      ...wh,
      ...vessel,
      progress,
      routeNumber: `RT-COAL-${String(n).padStart(3, '0')}`,
      routeName: progressLabel(progress, 'COAL'),
      origin: 'Кузбасс',
      destCode: dest.code,
      destName: dest.name,
      orderKey: progress === 'delivered' && n >= 17 ? 'archive' : 'coal',
      wagon: wagonForBatch(
        'COAL',
        progress,
        `5346${7820 + n}`,
        `${2840 + n}`,
        `Путь ${10 + (n % 9)}`
      ),
      blNumber: progress === 'delivered' ? `BL-COAL-${String(n).padStart(3, '0')}` : undefined,
    });
  }
  return batches;
}

function buildOilBatches(): BatchDef[] {
  const batches: BatchDef[] = [];
  const progressCycle: Array<number | 'delivered'> = [
    1, 2, 3, 4, 5, 6,
    1, 2, 3, 4, 5, 6,
    'delivered', 'delivered', 'delivered',
  ];

  for (let i = 0; i < 15; i++) {
    const n = i + 1;
    const progress = progressCycle[i];
    const type = OIL_TYPES[i % OIL_TYPES.length];
    const dest = DESTINATIONS[(i + 1) % DESTINATIONS.length];
    const vessel = vesselCallForBatch('OIL', progress);
    const wh = warehouseForBatch('OIL', progress, i);

    batches.push({
      containerNumber: `OIL-2026-${String(n).padStart(4, '0')}`,
      containerType: type,
      cargoCategory: 'OIL',
      supplierName: 'ЛУКОЙЛ-НПЗ',
      cargoDescription: oilDescription(type, n),
      quantityTons: 4000 + (n % 6) * 300,
      portOfLoading: 'RUNVS',
      portOfDischarge: dest.code,
      ...wh,
      ...vessel,
      progress,
      routeNumber: `RT-OIL-${String(n).padStart(3, '0')}`,
      routeName: progressLabel(progress, 'OIL'),
      origin: 'Самара (НПЗ)',
      destCode: dest.code,
      destName: dest.name,
      orderKey: progress === 'delivered' ? 'archive' : 'oil',
      wagon: wagonForBatch(
        'OIL',
        progress,
        `7512${3400 + n}`,
        `N${400 + n}`,
        `Путь ${3 + (n % 5)} (налив)`
      ),
      blNumber: progress === 'delivered' ? `BL-OIL-${String(n).padStart(3, '0')}` : undefined,
    });
  }
  return batches;
}

function buildPetroleumBatches(): BatchDef[] {
  const batches: BatchDef[] = [];
  for (let i = 0; i < 5; i++) {
    const n = i + 1;
    const progress = (i + 1) as number;
    const dest = DESTINATIONS[i % DESTINATIONS.length];
    batches.push({
      containerNumber: `PETRO-2026-${String(n).padStart(4, '0')}`,
      containerType: 'PETROLEUM',
      cargoCategory: 'PETROLEUM',
      supplierName: 'ЛУКОЙЛ-НПЗ',
      cargoDescription: `Дизельное топливо Евро-5 — партия ${n}`,
      quantityTons: 2800 + n * 150,
      portOfLoading: 'RUNVS',
      portOfDischarge: dest.code,
      progress,
      routeNumber: `RT-PETRO-${String(n).padStart(3, '0')}`,
      routeName: progressLabel(progress, 'PETROLEUM'),
      origin: 'Самара (НПЗ)',
      destCode: dest.code,
      destName: dest.name,
      orderKey: 'oil',
    });
  }
  return batches;
}

function buildPlanningBatches(): BatchDef[] {
  const batches: BatchDef[] = [];
  for (let i = 0; i < 6; i++) {
    const n = i + 1;
    const dest = DESTINATIONS[i % DESTINATIONS.length];
    batches.push({
      containerNumber: `COAL-2026-P${String(n).padStart(2, '0')}`,
      containerType: COAL_TYPES[i % 2],
      cargoCategory: 'COAL',
      supplierName: 'АО «Кузбассуголь»',
      cargoDescription: `Плановая партия угля Q3 — ${n}`,
      quantityTons: 5000 + n * 200,
      portOfLoading: 'RUNVS',
      portOfDischarge: dest.code,
      progress: 1,
      routeNumber: `RT-PLAN-${String(n).padStart(3, '0')}`,
      routeName: 'План · ожидается ж/д отгрузка',
      origin: 'Кемерово',
      destCode: dest.code,
      destName: dest.name,
      orderKey: 'planning',
      wagon: {
        number: `5347${1000 + n}`,
        trainNumber: `${3100 + n}`,
        track: `Путь ${20 + n}`,
      },
    });
  }
  return batches;
}

function buildOperationalBatches(): BatchDef[] {
  const batches: BatchDef[] = [];
  for (let i = 0; i < 4; i++) {
    const n = i + 1;
    const progress = 3 + (i % 2);
    const dest = DESTINATIONS[(i + 2) % DESTINATIONS.length];
    batches.push({
      containerNumber: `COAL-2026-OPS-${String(n).padStart(2, '0')}`,
      containerType: 'COAL_ANTHRACITE',
      cargoCategory: 'COAL',
      supplierName: 'АО «Кузбассуголь»',
      cargoDescription: `Оперативная партия на складе — ${n}`,
      quantityTons: 4200,
      portOfLoading: 'RUNVS',
      portOfDischarge: dest.code,
      warehouseKey: 'coal',
      location: `Сектор OPS-${n}`,
      vesselCallKey: '207N',
      progress,
      routeNumber: `RT-OPS-${String(n).padStart(3, '0')}`,
      routeName: progress === 3 ? 'Оператив · разгрузка' : 'Оператив · в парке',
      origin: 'Кузбасс',
      destCode: dest.code,
      destName: dest.name,
      orderKey: 'operational',
      wagon: wagonForBatch('COAL', progress, `5347${2000 + n}`, `${3200 + n}`, `Путь ${25 + n}`),
    });
  }
  return batches;
}

export function buildMockBatches(): BatchDef[] {
  return [
    ...buildCoalBatches(),
    ...buildOilBatches(),
    ...buildPetroleumBatches(),
    ...buildPlanningBatches(),
    ...buildOperationalBatches(),
  ];
}

export const MOCK_BATCHES = buildMockBatches();
export const EXPECTED_MOCK_BATCH_COUNT = MOCK_BATCHES.length;

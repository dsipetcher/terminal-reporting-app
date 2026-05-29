/** Client-side mirror of backend export route template */
export function buildExportRouteStages(overrides?: {
  supplierName?: string;
  supplierCode?: string;
  railName?: string;
  warehouseName?: string;
  berthName?: string;
  shipName?: string;
  destPortCode?: string;
  destPortName?: string;
}) {
  const o = overrides ?? {};
  return [
    {
      sequence: 1,
      stageType: 'SUPPLIER',
      locationCode: o.supplierCode ?? 'SUPPLIER',
      locationName: o.supplierName ?? 'Поставщик (ж/д отгрузка)',
      transportMode: 'RAIL',
      status: 'PENDING',
    },
    {
      sequence: 2,
      stageType: 'RAIL_STATION',
      locationCode: 'RZD-FRONT',
      locationName: o.railName ?? 'Вагоны',
      transportMode: 'RAIL',
      status: 'PENDING',
    },
    {
      sequence: 3,
      stageType: 'WAREHOUSE',
      locationCode: 'WH-STORAGE',
      locationName: o.warehouseName ?? 'Склад терминала',
      transportMode: 'WAREHOUSE',
      status: 'PENDING',
    },
    {
      sequence: 4,
      stageType: 'BERTH',
      locationCode: 'BERTH-LOAD',
      locationName: o.berthName ?? 'Причал погрузки',
      transportMode: 'SEA',
      status: 'PENDING',
    },
    {
      sequence: 5,
      stageType: 'SHIP',
      locationCode: 'VESSEL',
      locationName: o.shipName ?? 'Судно (рейс)',
      transportMode: 'SEA',
      status: 'PENDING',
    },
    {
      sequence: 6,
      stageType: 'PORT',
      locationCode: o.destPortCode ?? 'PORT-DEST',
      locationName: o.destPortName ?? 'Порт назначения',
      transportMode: 'SEA',
      status: 'PENDING',
    },
  ];
}

export const WIZARD_STEPS = [
  { id: 1, title: 'Партия груза', desc: 'Номер, поставщик, порты' },
  { id: 2, title: 'Маршрут', desc: 'Цепочка экспорта' },
  { id: 3, title: 'Этапы', desc: 'Вагоны, склад, судно' },
  { id: 4, title: 'Запуск', desc: 'Проверка и отслеживание' },
] as const;

export const STAGE_FIELDS = [
  { stageType: 'SUPPLIER', title: '1. Поставщик', field: 'supplier' as const },
  { stageType: 'RAIL_STATION', title: '2. Вагоны', field: 'rail' as const },
  { stageType: 'WAREHOUSE', title: '3. Склад терминала', field: 'warehouse' as const },
  { stageType: 'BERTH', title: '4. Причал', field: 'berth' as const },
  { stageType: 'SHIP', title: '5. Судно', field: 'ship' as const },
  { stageType: 'PORT', title: '6. Порт назначения', field: 'port' as const },
] as const;

/**
 * Стандартный маршрут экспортного терминала (уголь / нефть):
 * поставщик → суша (ЖД/авто) → склад → погрузка на судно → порт назначения
 */
export const EXPORT_ROUTE_STAGE_TEMPLATE = [
  {
    sequence: 1,
    stageType: 'SUPPLIER',
    locationCode: 'SUPPLIER',
    locationName: 'Поставщик (шахта / НПЗ)',
    transportMode: 'ROAD',
  },
  {
    sequence: 2,
    stageType: 'RAIL_STATION',
    locationCode: 'RZD-FRONT',
    locationName: 'Ж/д фронт терминала',
    transportMode: 'RAIL',
  },
  {
    sequence: 3,
    stageType: 'ROAD_GATE',
    locationCode: 'AUTO-GATE',
    locationName: 'Автовесовая, въезд грузовиков',
    transportMode: 'ROAD',
  },
  {
    sequence: 4,
    stageType: 'WAREHOUSE',
    locationCode: 'WH-STORAGE',
    locationName: 'Склад терминала (разгрузка)',
    transportMode: 'WAREHOUSE',
  },
  {
    sequence: 5,
    stageType: 'BERTH',
    locationCode: 'BERTH-LOAD',
    locationName: 'Причал погрузки на судно',
    transportMode: 'SEA',
  },
  {
    sequence: 6,
    stageType: 'SHIP',
    locationCode: 'VESSEL',
    locationName: 'Судно (рейс)',
    transportMode: 'SEA',
  },
  {
    sequence: 7,
    stageType: 'PORT',
    locationCode: 'PORT-DEST',
    locationName: 'Порт назначения груза',
    transportMode: 'SEA',
  },
] as const;

export function buildExportRouteStages(
  overrides?: Partial<{
    supplierName: string;
    supplierCode: string;
    railName: string;
    warehouseName: string;
    berthName: string;
    shipName: string;
    destPortCode: string;
    destPortName: string;
  }>
) {
  const o = overrides ?? {};
  return [
    {
      sequence: 1,
      stageType: 'SUPPLIER',
      locationCode: o.supplierCode ?? 'SUPPLIER',
      locationName: o.supplierName ?? 'Поставщик (шахта / НПЗ)',
      transportMode: 'ROAD',
      status: 'COMPLETED',
    },
    {
      sequence: 2,
      stageType: 'RAIL_STATION',
      locationCode: 'RZD-FRONT',
      locationName: o.railName ?? 'Ж/д фронт терминала',
      transportMode: 'RAIL',
      status: 'COMPLETED',
    },
    {
      sequence: 3,
      stageType: 'ROAD_GATE',
      locationCode: 'AUTO-GATE',
      locationName: 'Автовесовая терминала',
      transportMode: 'ROAD',
      status: 'COMPLETED',
    },
    {
      sequence: 4,
      stageType: 'WAREHOUSE',
      locationCode: 'WH-STORAGE',
      locationName: o.warehouseName ?? 'Склад терминала',
      transportMode: 'WAREHOUSE',
      status: 'CURRENT',
    },
    {
      sequence: 5,
      stageType: 'BERTH',
      locationCode: 'BERTH-LOAD',
      locationName: o.berthName ?? 'Причал погрузки',
      transportMode: 'SEA',
      status: 'PENDING',
    },
    {
      sequence: 6,
      stageType: 'SHIP',
      locationCode: 'VESSEL',
      locationName: o.shipName ?? 'Судно (рейс)',
      transportMode: 'SEA',
      status: 'PENDING',
    },
    {
      sequence: 7,
      stageType: 'PORT',
      locationCode: o.destPortCode ?? 'PORT-DEST',
      locationName: o.destPortName ?? 'Порт назначения',
      transportMode: 'SEA',
      status: 'PENDING',
    },
  ];
}

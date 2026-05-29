"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXPORT_ROUTE_STAGE_TEMPLATE = void 0;
exports.buildExportRouteStages = buildExportRouteStages;
/**
 * Стандартный маршрут экспортного терминала (уголь / нефть):
 * поставщик (ж/д отгрузка) → вагоны → склад → погрузка на судно → порт назначения
 */
exports.EXPORT_ROUTE_STAGE_TEMPLATE = [
    {
        sequence: 1,
        stageType: 'SUPPLIER',
        locationCode: 'SUPPLIER',
        locationName: 'Поставщик (ж/д отгрузка)',
        transportMode: 'RAIL',
    },
    {
        sequence: 2,
        stageType: 'RAIL_STATION',
        locationCode: 'RZD-FRONT',
        locationName: 'Вагоны',
        transportMode: 'RAIL',
    },
    {
        sequence: 3,
        stageType: 'WAREHOUSE',
        locationCode: 'WH-STORAGE',
        locationName: 'Склад терминала (разгрузка)',
        transportMode: 'WAREHOUSE',
    },
    {
        sequence: 4,
        stageType: 'BERTH',
        locationCode: 'BERTH-LOAD',
        locationName: 'Причал погрузки на судно',
        transportMode: 'SEA',
    },
    {
        sequence: 5,
        stageType: 'SHIP',
        locationCode: 'VESSEL',
        locationName: 'Судно (рейс)',
        transportMode: 'SEA',
    },
    {
        sequence: 6,
        stageType: 'PORT',
        locationCode: 'PORT-DEST',
        locationName: 'Порт назначения груза',
        transportMode: 'SEA',
    },
];
function buildExportRouteStages(overrides) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const o = overrides !== null && overrides !== void 0 ? overrides : {};
    return [
        {
            sequence: 1,
            stageType: 'SUPPLIER',
            locationCode: (_a = o.supplierCode) !== null && _a !== void 0 ? _a : 'SUPPLIER',
            locationName: (_b = o.supplierName) !== null && _b !== void 0 ? _b : 'Поставщик (ж/д отгрузка)',
            transportMode: 'RAIL',
            status: 'COMPLETED',
        },
        {
            sequence: 2,
            stageType: 'RAIL_STATION',
            locationCode: 'RZD-FRONT',
            locationName: (_c = o.railName) !== null && _c !== void 0 ? _c : 'Вагоны',
            transportMode: 'RAIL',
            status: 'COMPLETED',
        },
        {
            sequence: 3,
            stageType: 'WAREHOUSE',
            locationCode: 'WH-STORAGE',
            locationName: (_d = o.warehouseName) !== null && _d !== void 0 ? _d : 'Склад терминала',
            transportMode: 'WAREHOUSE',
            status: 'CURRENT',
        },
        {
            sequence: 4,
            stageType: 'BERTH',
            locationCode: 'BERTH-LOAD',
            locationName: (_e = o.berthName) !== null && _e !== void 0 ? _e : 'Причал погрузки',
            transportMode: 'SEA',
            status: 'PENDING',
        },
        {
            sequence: 5,
            stageType: 'SHIP',
            locationCode: 'VESSEL',
            locationName: (_f = o.shipName) !== null && _f !== void 0 ? _f : 'Судно (рейс)',
            transportMode: 'SEA',
            status: 'PENDING',
        },
        {
            sequence: 6,
            stageType: 'PORT',
            locationCode: (_g = o.destPortCode) !== null && _g !== void 0 ? _g : 'PORT-DEST',
            locationName: (_h = o.destPortName) !== null && _h !== void 0 ? _h : 'Порт назначения',
            transportMode: 'SEA',
            status: 'PENDING',
        },
    ];
}

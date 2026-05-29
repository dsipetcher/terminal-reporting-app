"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cargoStatusFromStageType = cargoStatusFromStageType;
/** Текущее состояние груза по типу этапа маршрута (транспорт — временный носитель). */
function cargoStatusFromStageType(stageType) {
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

/** Текущее состояние груза по типу этапа маршрута (транспорт — временный носитель). */
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

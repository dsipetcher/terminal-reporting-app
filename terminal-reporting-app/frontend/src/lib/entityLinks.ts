/** DOM id for scroll-to-highlight on entity pages */
export function entityDomId(id: number): string {
  return `entity-${id}`;
}

export const entityLinks = {
  counterparty: (id: number) => `/counterparties?highlight=${id}`,
  logisticsOrder: (id: number) => `/logistics-orders?highlight=${id}`,
  wagon: (id: number) => `/wagons?tab=wagons&highlight=${id}`,
  trainConsist: (id: number) => `/wagons?tab=consists&highlight=${id}`,
  warehouse: (id: number) => `/warehouses?highlight=${id}`,
  berth: (id: number) => `/berths?highlight=${id}`,
  vessel: (id: number) => `/vessels?highlight=${id}`,
  vesselCall: (id: number) => `/vessels?tab=calls&highlight=${id}`,
  port: (code: string) => `/directories?tab=ports&code=${encodeURIComponent(code.trim())}`,
  cargoLot: (id: number) => `/cargo-lots?highlight=${id}`,
  flows: () => '/flows',
  counterparties: () => '/counterparties',
  wagons: () => '/wagons',
  warehouses: () => '/warehouses',
  berths: () => '/berths',
  vessels: () => '/vessels',
  logisticsOrders: () => '/logistics-orders',
};

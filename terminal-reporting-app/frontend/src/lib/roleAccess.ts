/** Доступ к разделам по ролям (FR-20, ТЗ дипломного прототипа). */
export type AppRole = 'ADMIN' | 'PLANNER' | 'DISPATCHER' | 'WAREHOUSE' | 'USER';

const ALL_ROLES: AppRole[] = ['ADMIN', 'PLANNER', 'DISPATCHER', 'WAREHOUSE', 'USER'];

export const ROUTE_ROLES: Record<string, AppRole[]> = {
  '/': ALL_ROLES,
  '/cargo-tracking': ALL_ROLES,
  '/cargo-lots': ['ADMIN', 'PLANNER', 'WAREHOUSE'],
  '/logistics-orders': ['ADMIN', 'PLANNER'],
  '/flows': ALL_ROLES,
  '/directories': ['ADMIN', 'PLANNER'],
  '/counterparties': ['ADMIN', 'PLANNER'],
  '/warehouses': ['ADMIN', 'PLANNER', 'WAREHOUSE'],
  '/wagons': ['ADMIN', 'DISPATCHER'],
  '/vessels': ['ADMIN', 'DISPATCHER'],
  '/vessel-calls': ['ADMIN', 'DISPATCHER'],
  '/berths': ['ADMIN', 'DISPATCHER'],
  '/users': ['ADMIN'],
};

export function canAccessRoute(role: string | undefined, path: string): boolean {
  if (!role) return false;
  // В прототипе для диплома ограничиваем только админ-раздел
  if (path === '/users') return role === 'ADMIN';
  return true;
}

import {
  LayoutDashboard,
  Package,
  ClipboardList,
  ArrowLeftRight,
  Train,
  Warehouse,
  Ship,
  Anchor,
  BookOpen,
  Building2,
  Users,
  FileBarChart,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  defaultOpen?: boolean;
}

export const HOME_LINK: NavItem = {
  to: '/',
  label: 'Обзор',
  icon: LayoutDashboard,
};

/** Primary entry — cargo-centric UX */
export const CARGO_LINK: NavItem = {
  to: '/cargo',
  label: 'Партии груза',
  icon: Package,
};

export const REPORTS_LINK: NavItem = {
  to: '/reports',
  label: 'Отчётность',
  icon: FileBarChart,
};

/** Secondary: reference data maintained outside cargo cards */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'refs',
    label: 'Справочники',
    icon: BookOpen,
    items: [
      { to: '/directories', label: 'НСИ (порты, грузы)', icon: BookOpen },
      { to: '/counterparties', label: 'Контрагенты', icon: Building2 },
    ],
  },
  {
    id: 'terminal',
    label: 'Данные терминала',
    icon: Warehouse,
    items: [
      { to: '/logistics-orders', label: 'Логистические заказы', icon: ClipboardList },
      { to: '/flows', label: 'Журнал потоков', icon: ArrowLeftRight },
      { to: '/warehouses', label: 'Склады', icon: Warehouse },
      { to: '/wagons', label: 'Составы и вагоны', icon: Train },
      { to: '/vessels', label: 'Суда', icon: Ship },
      { to: '/berths', label: 'Причалы', icon: Anchor },
      { to: '/cargo-lots', label: 'Регистрация партий', icon: Package },
    ],
  },
];

export const ADMIN_LINK: NavItem = {
  to: '/users',
  label: 'Пользователи',
  icon: Users,
};

export function findGroupForPath(path: string): string | null {
  if (path === '/' || path === '/cargo' || path === '/reports') return null;
  if (path.startsWith('/cargo?')) return null;
  for (const group of NAV_GROUPS) {
    if (group.items.some((item) => item.to === path || path.startsWith(item.to + '/'))) {
      return group.id;
    }
  }
  if (path === '/users') return 'admin';
  return null;
}

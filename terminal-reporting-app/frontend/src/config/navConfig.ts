import {
  LayoutDashboard,
  MapPinned,
  Package,
  ArrowLeftRight,
  ClipboardList,
  Train,
  Truck,
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
  label: 'Центр управления',
  icon: LayoutDashboard,
};

export const REPORTS_LINK: NavItem = {
  to: '/reports',
  label: 'Отчётность',
  icon: FileBarChart,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'cargo',
    label: 'Учёт грузов',
    icon: Package,
    defaultOpen: true,
    items: [
      { to: '/cargo-tracking', label: 'Отслеживание', icon: MapPinned },
      { to: '/cargo-lots', label: 'Партии груза', icon: Package },
      { to: '/logistics-orders', label: 'Заказы', icon: ClipboardList },
      { to: '/flows', label: 'Потоки', icon: ArrowLeftRight },
    ],
  },
  {
    id: 'terminal',
    label: 'Терминал и транспорт',
    icon: Warehouse,
    items: [
      { to: '/warehouses', label: 'Склады', icon: Warehouse },
      { to: '/wagons', label: 'Ж/д фронт', icon: Train },
      { to: '/trucks', label: 'Автотранспорт', icon: Truck },
      { to: '/vessels', label: 'Суда', icon: Ship },
      { to: '/vessel-calls', label: 'Судозаходы', icon: Ship },
      { to: '/berths', label: 'Причалы', icon: Anchor },
    ],
  },
  {
    id: 'refs',
    label: 'Справочники',
    icon: BookOpen,
    items: [
      { to: '/directories', label: 'НСИ (порты, грузы)', icon: BookOpen },
      { to: '/counterparties', label: 'Контрагенты', icon: Building2 },
    ],
  },
];

export const ADMIN_LINK: NavItem = {
  to: '/users',
  label: 'Пользователи',
  icon: Users,
};

export function findGroupForPath(path: string): string | null {
  if (path === '/' || path === '/reports') return null;
  for (const group of NAV_GROUPS) {
    if (group.items.some((item) => item.to === path || path.startsWith(item.to + '/'))) {
      return group.id;
    }
  }
  if (path === '/users') return 'admin';
  return null;
}

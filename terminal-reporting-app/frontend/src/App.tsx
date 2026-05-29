import { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import {
  LayoutDashboard,
  Ship,
  Anchor,
  Package,
  Train,
  Truck,
  Warehouse,
  Menu,
  X,
  Users,
  LogOut,
  Moon,
  Sun,
  ClipboardList,
  Building2,
  ArrowLeftRight,
  Network,
  MapPinned,
  BookOpen,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { AdminRoute, ProtectedRoute, RoleRoute } from './components/ProtectedRoute';

import DashboardPage from './pages/DashboardPage';
import VesselCallsPage from './pages/VesselCallsPage';
import VesselsPage from './pages/VesselsPage';
import BerthsPage from './pages/BerthsPage';
import ContainersPage from './pages/ContainersPage';
import TrucksPage from './pages/TrucksPage';
import WagonsPage from './pages/WagonsPage';
import WarehousesPage from './pages/WarehousesPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import LogisticsOrdersPage from './pages/LogisticsOrdersPage';
import CounterpartiesPage from './pages/CounterpartiesPage';
import FlowsPage from './pages/FlowsPage';
import CargoTrackingPage from './pages/CargoTrackingPage';
import DirectoriesPage from './pages/DirectoriesPage';
import { USER_ROLE_LABELS } from './utils';

function NavLinkItem({
  to,
  icon: Icon,
  label,
  onClose,
}: {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  onClose: () => void;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
      onClick={onClose}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function Guard({ children }: { children: React.ReactNode }) {
  return <RoleRoute>{children}</RoleRoute>;
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex shrink-0 items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Network className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">ИЛС</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 min-h-0">
          <NavLinkItem to="/" icon={LayoutDashboard} label="Панель ИЛС" onClose={() => setSidebarOpen(false)} />

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Учёт грузов
          </div>
          <NavLinkItem to="/cargo-tracking" icon={MapPinned} label="Отслеживание грузов" onClose={() => setSidebarOpen(false)} />
          <NavLinkItem to="/cargo-lots" icon={Package} label="Партии груза" onClose={() => setSidebarOpen(false)} />
          <NavLinkItem to="/flows" icon={ArrowLeftRight} label="Потоки" onClose={() => setSidebarOpen(false)} />
          <NavLinkItem to="/logistics-orders" icon={ClipboardList} label="Логистические заказы" onClose={() => setSidebarOpen(false)} />

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Средства доставления
          </div>
          <p className="px-4 mb-2 text-xs text-slate-600">Идентификаторы для сопоставления с грузом</p>
          <NavLinkItem to="/wagons" icon={Train} label="Железнодорожный фронт" onClose={() => setSidebarOpen(false)} />
          <NavLinkItem to="/trucks" icon={Truck} label="Автотранспорт" onClose={() => setSidebarOpen(false)} />

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Склады терминала
          </div>
          <NavLinkItem to="/warehouses" icon={Warehouse} label="Склады угля и нефти" onClose={() => setSidebarOpen(false)} />

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Флот и причалы
          </div>
          <NavLinkItem to="/vessels" icon={Ship} label="Суда" onClose={() => setSidebarOpen(false)} />
          <NavLinkItem to="/vessel-calls" icon={Ship} label="Судозаходы" onClose={() => setSidebarOpen(false)} />
          <NavLinkItem to="/berths" icon={Anchor} label="Причалы" onClose={() => setSidebarOpen(false)} />

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Справочники ИЛС
          </div>
          <NavLinkItem to="/directories" icon={BookOpen} label="НСИ (порты, грузы)" onClose={() => setSidebarOpen(false)} />
          <NavLinkItem to="/counterparties" icon={Building2} label="Контрагенты" onClose={() => setSidebarOpen(false)} />

          {isAdmin && (
            <>
              <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Обеспечивающая подсистема
              </div>
              <Link
                to="/users"
                className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
                onClick={() => setSidebarOpen(false)}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Пользователи</span>
              </Link>
            </>
          )}
        </nav>

        <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-900">
          <p className="text-xs text-slate-500 text-center">ИЛС v1.0 · прототип по ТЗ</p>
        </div>
      </aside>

      <div className="md:ml-64 min-h-screen bg-gray-50 dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-muted hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 md:flex-none">
              <h1 className="text-xl font-semibold text-primary">ИЛС · угольно-нефтяной терминал</h1>
              <p className="text-xs text-muted hidden sm:block">Прототип по ТЗ · объект учёта — партия груза</p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted hidden sm:inline">
                {new Date().toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <button
                onClick={toggleTheme}
                className="p-2 text-muted hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3 border-l border-default pl-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">{user?.username}</p>
                  <p className="text-xs text-subtle">
                    {user?.role ? USER_ROLE_LABELS[user.role] ?? user.role : ''}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-muted hover:text-red-400 hover:bg-red-950/50 rounded-lg"
                  title="Выйти"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 bg-gray-50 dark:bg-slate-950 min-h-[calc(100vh-73px)]">
          <Routes>
            <Route path="/" element={<Guard><DashboardPage /></Guard>} />
            <Route path="/vessels" element={<Guard><VesselsPage /></Guard>} />
            <Route path="/vessel-calls" element={<Guard><VesselCallsPage /></Guard>} />
            <Route path="/berths" element={<Guard><BerthsPage /></Guard>} />
            <Route path="/containers" element={<Navigate to="/cargo-lots" replace />} />
            <Route path="/cargo-lots" element={<Guard><ContainersPage /></Guard>} />
            <Route path="/trucks" element={<Guard><TrucksPage /></Guard>} />
            <Route path="/wagons" element={<Guard><WagonsPage /></Guard>} />
            <Route path="/warehouses" element={<Guard><WarehousesPage /></Guard>} />
            <Route path="/logistics-orders" element={<Guard><LogisticsOrdersPage /></Guard>} />
            <Route path="/cargo-tracking" element={<Guard><CargoTrackingPage /></Guard>} />
            <Route path="/counterparties" element={<Guard><CounterpartiesPage /></Guard>} />
            <Route path="/directories" element={<Guard><DirectoriesPage /></Guard>} />
            <Route path="/flows" element={<Guard><FlowsPage /></Guard>} />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

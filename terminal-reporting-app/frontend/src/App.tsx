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
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';

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
import { USER_ROLE_LABELS } from './utils';

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
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

        <nav className="p-4">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Панель ИЛС</span>
          </Link>

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Управление заказами
          </div>
          <Link
            to="/logistics-orders"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="font-medium">Логистические заказы</span>
          </Link>
          <Link
            to="/cargo-tracking"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <MapPinned className="w-5 h-5" />
            <span className="font-medium">Отслеживание грузов</span>
          </Link>
          <Link
            to="/flows"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="font-medium">Потоки</span>
          </Link>

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Сухопутный ввод (ЖД / авто)
          </div>
          <Link
            to="/wagons"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Train className="w-5 h-5" />
            <span className="font-medium">Железнодорожный фронт</span>
          </Link>
          <Link
            to="/trucks"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Truck className="w-5 h-5" />
            <span className="font-medium">Автотранспорт</span>
          </Link>

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Складской учёт
          </div>
          <Link
            to="/warehouses"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Warehouse className="w-5 h-5" />
            <span className="font-medium">Склады угля и нефти</span>
          </Link>
          <Link
            to="/cargo-lots"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">Партии груза</span>
          </Link>

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Отгрузка на флот
          </div>
          <Link
            to="/vessels"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Ship className="w-5 h-5" />
            <span className="font-medium">Суда</span>
          </Link>
          <Link
            to="/vessel-calls"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Ship className="w-5 h-5" />
            <span className="font-medium">Судозаходы</span>
          </Link>
          <Link
            to="/berths"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Anchor className="w-5 h-5" />
            <span className="font-medium">Причалы</span>
          </Link>

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Справочники ИЛС
          </div>
          <Link
            to="/counterparties"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Building2 className="w-5 h-5" />
            <span className="font-medium">Контрагенты</span>
          </Link>

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

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <p className="text-xs text-slate-500 text-center">Информационная логистическая система v2.0</p>
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
            <Route path="/" element={<DashboardPage />} />
            <Route path="/vessels" element={<VesselsPage />} />
            <Route path="/vessel-calls" element={<VesselCallsPage />} />
            <Route path="/berths" element={<BerthsPage />} />
            <Route path="/containers" element={<Navigate to="/cargo-lots" replace />} />
            <Route path="/cargo-lots" element={<ContainersPage />} />
            <Route path="/trucks" element={<TrucksPage />} />
            <Route path="/wagons" element={<WagonsPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
            <Route path="/logistics-orders" element={<LogisticsOrdersPage />} />
            <Route path="/cargo-tracking" element={<CargoTrackingPage />} />
            <Route path="/counterparties" element={<CounterpartiesPage />} />
            <Route path="/flows" element={<FlowsPage />} />
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

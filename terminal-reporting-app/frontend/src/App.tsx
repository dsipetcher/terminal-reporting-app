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
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';

import DashboardPage from './pages/DashboardPage';
import VesselCallsPage from './pages/VesselCallsPage';
import BerthsPage from './pages/BerthsPage';
import ContainersPage from './pages/ContainersPage';
import TrucksPage from './pages/TrucksPage';
import WagonsPage from './pages/WagonsPage';
import WarehousesPage from './pages/WarehousesPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';

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
            <Ship className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-slate-100">TOS</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-100"
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
            <span className="font-medium">Dashboard</span>
          </Link>

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Морской фронт
          </div>
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
            Грузы
          </div>
          <Link
            to="/containers"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">Контейнеры</span>
          </Link>
          <Link
            to="/wagons"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Train className="w-5 h-5" />
            <span className="font-medium">Вагоны</span>
          </Link>

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Транспорт
          </div>
          <Link
            to="/trucks"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Truck className="w-5 h-5" />
            <span className="font-medium">Автотранспорт</span>
          </Link>

          <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Инфраструктура
          </div>
          <Link
            to="/warehouses"
            className="flex items-center gap-3 px-4 py-3 mb-1 text-slate-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all"
            onClick={() => setSidebarOpen(false)}
          >
            <Warehouse className="w-5 h-5" />
            <span className="font-medium">Склады</span>
          </Link>

          {isAdmin && (
            <>
              <div className="mt-6 mb-2 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Администрирование
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
          <p className="text-xs text-slate-500 text-center">Terminal Operating System v1.0</p>
        </div>
      </aside>

      <div className="md:ml-64 min-h-screen bg-gray-50 dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 md:flex-none">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Система управления терминалом</h1>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 hidden sm:inline">
                {new Date().toLocaleDateString('ru-RU', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <button
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
                title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-3 border-l border-slate-700 pl-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-100">{user?.username}</p>
                  <p className="text-xs text-slate-500">
                    {user?.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/50 rounded-lg"
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
            <Route path="/vessel-calls" element={<VesselCallsPage />} />
            <Route path="/berths" element={<BerthsPage />} />
            <Route path="/containers" element={<ContainersPage />} />
            <Route path="/trucks" element={<TrucksPage />} />
            <Route path="/wagons" element={<WagonsPage />} />
            <Route path="/warehouses" element={<WarehousesPage />} />
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

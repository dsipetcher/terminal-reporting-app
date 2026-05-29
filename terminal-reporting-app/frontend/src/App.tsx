import { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Network, Menu, X, LogOut, Moon, Sun } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { AdminRoute, ProtectedRoute, RoleRoute } from './components/ProtectedRoute';
import { SidebarNav } from './components/SidebarNav';

import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import VesselsPage from './pages/VesselsPage';
import BerthsPage from './pages/BerthsPage';
import ContainersPage from './pages/ContainersPage';
import WagonsPage from './pages/WagonsPage';
import WarehousesPage from './pages/WarehousesPage';
import UsersPage from './pages/UsersPage';
import LoginPage from './pages/LoginPage';
import LogisticsOrdersPage from './pages/LogisticsOrdersPage';
import CounterpartiesPage from './pages/CounterpartiesPage';
import FlowsPage from './pages/FlowsPage';
import CargoHubPage from './pages/CargoHubPage';
import DirectoriesPage from './pages/DirectoriesPage';
import { USER_ROLE_LABELS } from './utils';

function Guard({ children }: { children: React.ReactNode }) {
  return <RoleRoute>{children}</RoleRoute>;
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex shrink-0 items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Network className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">ИЛС</h2>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <SidebarNav isAdmin={isAdmin} onNavigate={closeSidebar} />

        <div className="shrink-0 p-3 border-t border-slate-800 bg-slate-900">
          <p className="text-[10px] text-slate-500 text-center">ИЛС v1.0 · прототип</p>
        </div>
      </aside>

      <div className="md:ml-64 min-h-screen bg-gray-50 dark:bg-slate-950">
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-muted hover:text-primary hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 md:flex-none">
              <h1 className="text-lg font-semibold text-primary">Информационно-логистическая система</h1>
              <p className="text-xs text-muted hidden sm:block">
                Объект учёта — партия груза · вся информация в карточке партии
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted hidden lg:inline">
                {new Date().toLocaleDateString('ru-RU', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
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

        <main className="p-6 bg-gray-50 dark:bg-slate-950 min-h-[calc(100vh-65px)]">
          <Routes>
            <Route path="/" element={<Guard><DashboardPage /></Guard>} />
            <Route path="/reports" element={<Guard><ReportsPage /></Guard>} />
            <Route path="/vessels" element={<Guard><VesselsPage /></Guard>} />
            <Route path="/vessel-calls" element={<Navigate to="/vessels?tab=calls" replace />} />
            <Route path="/berths" element={<Guard><BerthsPage /></Guard>} />
            <Route path="/containers" element={<Navigate to="/cargo-lots" replace />} />
            <Route path="/cargo-lots" element={<Guard><ContainersPage /></Guard>} />
            <Route path="/trucks" element={<Navigate to="/cargo" replace />} />
            <Route path="/wagons" element={<Guard><WagonsPage /></Guard>} />
            <Route path="/warehouses" element={<Guard><WarehousesPage /></Guard>} />
            <Route path="/logistics-orders" element={<Guard><LogisticsOrdersPage /></Guard>} />
            <Route path="/cargo" element={<Guard><CargoHubPage /></Guard>} />
            <Route path="/cargo-tracking" element={<Navigate to="/cargo" replace />} />
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
          onClick={closeSidebar}
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

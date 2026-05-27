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
  X
} from 'lucide-react';

// Pages
import DashboardPage from './pages/DashboardPage';
import VesselCallsPage from './pages/VesselCallsPage';
import BerthsPage from './pages/BerthsPage';
import ContainersPage from './pages/ContainersPage';
import TrucksPage from './pages/TrucksPage';
import WagonsPage from './pages/WagonsPage';
import WarehousesPage from './pages/WarehousesPage';
import { IS_DEMO_MODE } from './api';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-white">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 shadow-xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}>
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <Ship className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">TOS</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <nav className="p-4">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 mb-1 text-gray-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all group"
              onClick={() => setSidebarOpen(false)}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>

            <div className="mt-6 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Морской фронт
            </div>
            <Link
              to="/vessel-calls"
              className="flex items-center gap-3 px-4 py-3 mb-1 text-gray-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all group"
              onClick={() => setSidebarOpen(false)}
            >
              <Ship className="w-5 h-5" />
              <span className="font-medium">Судозаходы</span>
            </Link>
            <Link
              to="/berths"
              className="flex items-center gap-3 px-4 py-3 mb-1 text-gray-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all group"
              onClick={() => setSidebarOpen(false)}
            >
              <Anchor className="w-5 h-5" />
              <span className="font-medium">Причалы</span>
            </Link>

            <div className="mt-6 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Грузы
            </div>
            <Link
              to="/containers"
              className="flex items-center gap-3 px-4 py-3 mb-1 text-gray-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all group"
              onClick={() => setSidebarOpen(false)}
            >
              <Package className="w-5 h-5" />
              <span className="font-medium">Контейнеры</span>
            </Link>
            <Link
              to="/wagons"
              className="flex items-center gap-3 px-4 py-3 mb-1 text-gray-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all group"
              onClick={() => setSidebarOpen(false)}
            >
              <Train className="w-5 h-5" />
              <span className="font-medium">Вагоны</span>
            </Link>

            <div className="mt-6 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Транспорт
            </div>
            <Link
              to="/trucks"
              className="flex items-center gap-3 px-4 py-3 mb-1 text-gray-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all group"
              onClick={() => setSidebarOpen(false)}
            >
              <Truck className="w-5 h-5" />
              <span className="font-medium">Автотранспорт</span>
            </Link>

            <div className="mt-6 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Инфраструктура
            </div>
            <Link
              to="/warehouses"
              className="flex items-center gap-3 px-4 py-3 mb-1 text-gray-300 rounded-lg hover:bg-slate-800 hover:text-white transition-all group"
              onClick={() => setSidebarOpen(false)}
            >
              <Warehouse className="w-5 h-5" />
              <span className="font-medium">Склады</span>
            </Link>
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
            <p className="text-xs text-gray-500 text-center">
              Terminal Operating System v1.0
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <div className="md:ml-64 min-h-screen bg-white">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="flex items-center justify-between px-6 py-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex-1 md:flex-none">
                <h1 className="text-xl font-semibold text-gray-900">
                  Система управления терминалом
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('ru-RU', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </header>

          {IS_DEMO_MODE && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm text-amber-900">
              Демо-режим: GitHub Pages показывает интерфейс с тестовыми данными в браузере.
              Для полной работы с базой данных запустите приложение локально через start.bat или start.sh.
            </div>
          )}

          {/* Page Content */}
          <main className="p-6 bg-gray-50 min-h-[calc(100vh-73px)]">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/vessel-calls" element={<VesselCallsPage />} />
              <Route path="/berths" element={<BerthsPage />} />
              <Route path="/containers" element={<ContainersPage />} />
              <Route path="/trucks" element={<TrucksPage />} />
              <Route path="/wagons" element={<WagonsPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </Router>
  );
}

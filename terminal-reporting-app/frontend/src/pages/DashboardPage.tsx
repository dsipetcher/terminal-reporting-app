import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, vesselCallsApi } from '../api';
import type { DashboardStats, VesselCall } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { formatDateTime, VESSEL_CALL_STATUS_LABELS } from '../utils';
import { Ship, Package, Train, Warehouse, Anchor, Truck } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeVesselCalls, setActiveVesselCalls] = useState<VesselCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, vesselCallsData] = await Promise.all([
        dashboardApi.getStats(),
        vesselCallsApi.getAll(),
      ]);

      setStats(statsData);

      const active = vesselCallsData.filter((vc) =>
        ['EXPECTED', 'ARRIVED', 'BERTHED', 'IN_OPERATION'].includes(vc.status)
      );
      setActiveVesselCalls(active);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка дашборда..." />;
  }

  return (
    <div>
      <PageHeader
        title="Система управления терминалом"
        subtitle="Операционный контроль морского порта"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/vessel-calls">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Активные судозаходы</p>
                <p className="text-3xl font-bold text-blue-400 mt-2">
                  {stats?.vesselCallsActive || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Всего: {stats?.vesselCallsTotal || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-950/60 rounded-lg">
                <Ship className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/containers">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Контейнеры</p>
                <p className="text-3xl font-bold text-green-400 mt-2">
                  {stats?.containers || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">На терминале</p>
              </div>
              <div className="p-3 bg-green-950/60 rounded-lg">
                <Package className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/wagons">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Вагоны</p>
                <p className="text-3xl font-bold text-orange-400 mt-2">
                  {stats?.wagons || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Всего</p>
              </div>
              <div className="p-3 bg-orange-950/60 rounded-lg">
                <Train className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/warehouses">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Склады</p>
                <p className="text-3xl font-bold text-purple-400 mt-2">
                  {stats?.warehouses || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Активных</p>
              </div>
              <div className="p-3 bg-purple-950/60 rounded-lg">
                <Warehouse className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <Card title="Текущие судозаходы" className="mb-6">
        {activeVesselCalls.length === 0 ? (
          <p className="text-slate-500 text-center py-8">Нет активных судозаходов</p>
        ) : (
          <div className="space-y-4">
            {activeVesselCalls.map((call) => (
              <div
                key={call.id}
                className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-slate-700/50 transition-colors rounded-r-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg text-slate-100">{call.vessel.name}</h4>
                    <p className="text-sm text-slate-400">
                      IMO: {call.vessel.imoNumber} | Рейс: {call.voyageNumber}
                    </p>
                    {call.berth && (
                      <p className="text-sm text-slate-400">
                        Причал: №{call.berth.number}
                      </p>
                    )}
                    <p className="text-sm text-slate-500 mt-1">
                      ETA: {formatDateTime(call.eta)}
                      {call.ata && ` | Прибыл: ${formatDateTime(call.ata)}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge
                      status={call.status}
                      label={VESSEL_CALL_STATUS_LABELS[call.status]}
                    />
                    {call._count && (
                      <span className="text-sm text-slate-400 flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {call._count.containers} контейнеров
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Быстрые действия">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/vessel-calls"
            className="p-6 border-2 border-slate-700 rounded-lg hover:border-blue-500 hover:bg-slate-700/50 transition-all text-center group"
          >
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-blue-950/60 rounded-lg group-hover:bg-blue-900/60 transition-colors">
                <Ship className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-300">Судозаходы</p>
          </Link>
          <Link
            to="/berths"
            className="p-6 border-2 border-slate-700 rounded-lg hover:border-blue-500 hover:bg-slate-700/50 transition-all text-center group"
          >
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-blue-950/60 rounded-lg group-hover:bg-blue-900/60 transition-colors">
                <Anchor className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-300">Причалы</p>
          </Link>
          <Link
            to="/containers"
            className="p-6 border-2 border-slate-700 rounded-lg hover:border-green-500 hover:bg-slate-700/50 transition-all text-center group"
          >
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-green-950/60 rounded-lg group-hover:bg-green-900/60 transition-colors">
                <Package className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-300">Контейнеры</p>
          </Link>
          <Link
            to="/trucks"
            className="p-6 border-2 border-slate-700 rounded-lg hover:border-orange-500 hover:bg-slate-700/50 transition-all text-center group"
          >
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-orange-950/60 rounded-lg group-hover:bg-orange-900/60 transition-colors">
                <Truck className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-300">Автотранспорт</p>
          </Link>
        </div>
      </Card>
    </div>
  );
}

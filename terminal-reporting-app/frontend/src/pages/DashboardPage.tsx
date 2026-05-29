import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, vesselCallsApi, infoFlowsApi, containersApi } from '../api';
import type { DashboardStats, VesselCall, InfoFlowEvent, Container } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  formatDateTime,
  VESSEL_CALL_STATUS_LABELS,
  ILS_FUNCTION_LABELS,
  CARGO_BATCH_STATUS_LABELS,
  EXPORT_ROUTE_CHAIN,
} from '../utils';
import { Package, FileBarChart, ChevronRight, Ship } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cargoPreview, setCargoPreview] = useState<Container[]>([]);
  const [activeVesselCalls, setActiveVesselCalls] = useState<VesselCall[]>([]);
  const [recentEvents, setRecentEvents] = useState<InfoFlowEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, vesselCallsData, events, containers] = await Promise.all([
        dashboardApi.getStats(),
        vesselCallsApi.getAll(),
        infoFlowsApi.getAll({ limit: 5 }),
        containersApi.getAll(),
      ]);

      setStats(statsData);
      setRecentEvents(events);
      setCargoPreview(containers.slice(0, 5));
      setActiveVesselCalls(
        vesselCallsData.filter((vc) =>
          ['EN_ROUTE', 'ARRIVED', 'UNLOADING', 'EXPECTED', 'BERTHED', 'IN_OPERATION'].includes(vc.status)
        )
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка обзора..." />;
  }

  return (
    <div>
      <PageHeader
        title="Обзор ИЛС"
        subtitle="Работа начинается с партии груза — вся связанная информация в её карточке"
      />

      <Card className="mb-6 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
        <p className="text-sm text-secondary leading-relaxed">
          Цепочка экспорта: {EXPORT_ROUTE_CHAIN}. Откройте партию — увидите отправление, транспорт,
          склад, судно и порт назначения в одном месте.
        </p>
      </Card>

      <Link
        to="/cargo"
        className="flex items-center justify-between p-5 mb-6 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg"
      >
        <div className="flex items-center gap-4">
          <Package className="w-8 h-8" />
          <div>
            <p className="font-semibold text-lg">Партии груза</p>
            <p className="text-sm text-blue-100">
              {stats?.containers ?? 0} партий · {stats?.cargoOnRoutes ?? 0} на маршруте
            </p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6" />
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Активные партии" className="lg:col-span-2">
          {cargoPreview.length === 0 ? (
            <p className="text-subtle text-center py-6">Партий нет</p>
          ) : (
            <ul className="space-y-2">
              {cargoPreview.map((cargo) => (
                <li key={cargo.id}>
                  <Link
                    to={`/cargo?batch=${encodeURIComponent(cargo.containerNumber)}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-default hover-surface transition-colors"
                  >
                    <div>
                      <p className="font-mono font-semibold text-sm">{cargo.containerNumber}</p>
                      <p className="text-xs text-muted">{cargo.supplierName ?? '—'}</p>
                    </div>
                    <StatusBadge
                      status={cargo.status}
                      label={CARGO_BATCH_STATUS_LABELS[cargo.status]}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/cargo" className="text-sm text-blue-500 hover:underline mt-4 inline-block">
            Все партии →
          </Link>
        </Card>

        <Card title="Быстрые действия">
          <div className="space-y-2">
            <Link
              to="/cargo?wizard=new"
              className="flex items-center gap-2 p-3 rounded-lg border border-default hover-surface text-sm"
            >
              <Package className="w-4 h-4 text-green-500" />
              Новая партия (мастер)
            </Link>
            <Link
              to="/reports"
              className="flex items-center gap-2 p-3 rounded-lg border border-default hover-surface text-sm"
            >
              <FileBarChart className="w-4 h-4 text-green-500" />
              Сформировать отчёт
            </Link>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link to="/cargo" className="p-4 rounded-lg border border-default hover-surface text-center">
          <p className="text-2xl font-bold text-rose-600">{stats?.cargoOnRoutes ?? 0}</p>
          <p className="text-xs text-muted mt-1">На маршруте</p>
        </Link>
        <Link to="/cargo" className="p-4 rounded-lg border border-default hover-surface text-center">
          <p className="text-2xl font-bold text-green-600">{stats?.containers ?? 0}</p>
          <p className="text-xs text-muted mt-1">Партий</p>
        </Link>
        <Link to="/vessels?tab=calls" className="p-4 rounded-lg border border-default hover-surface text-center">
          <p className="text-2xl font-bold text-blue-600">{stats?.vesselCallsActive ?? 0}</p>
          <p className="text-xs text-muted mt-1">Судозаходов</p>
        </Link>
        <Link to="/reports" className="p-4 rounded-lg border border-default hover-surface text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {(stats?.materialFlowsToday ?? 0) + (stats?.infoEventsToday ?? 0)}
          </p>
          <p className="text-xs text-muted mt-1">Потоков сегодня</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Судозаходы (контекст грузов)">
          {activeVesselCalls.length === 0 ? (
            <p className="text-subtle text-center py-6">Нет активных судозаходов</p>
          ) : (
            <div className="space-y-3">
              {activeVesselCalls.slice(0, 4).map((call) => (
                <Link
                  key={call.id}
                  to="/vessels?tab=calls"
                  className="flex items-start gap-3 p-2 rounded-lg hover-surface"
                >
                  <Ship className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">{call.vessel.name}</p>
                    <p className="text-xs text-muted">Рейс {call.voyageNumber}</p>
                    <StatusBadge
                      status={call.status}
                      label={VESSEL_CALL_STATUS_LABELS[call.status]}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Link
            to="/vessels?tab=calls"
            className="text-sm text-blue-500 hover:underline mt-4 inline-block"
          >
            Все судозаходы →
          </Link>
        </Card>

        <Card title="События ИЛС">
          {recentEvents.length === 0 ? (
            <p className="text-subtle text-center py-6">Событий нет</p>
          ) : (
            <div className="space-y-2">
              {recentEvents.map((ev) => (
                <div key={ev.id} className="text-sm border-b border-default pb-2 last:border-0">
                  <div className="flex justify-between gap-2">
                    <StatusBadge
                      status={ev.ilsFunction}
                      label={ILS_FUNCTION_LABELS[ev.ilsFunction]}
                    />
                    <span className="text-xs text-muted">{formatDateTime(ev.createdAt)}</span>
                  </div>
                  <p className="text-secondary mt-1">{ev.message}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

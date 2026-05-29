import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, vesselCallsApi, infoFlowsApi } from '../api';
import type { DashboardStats, VesselCall, InfoFlowEvent } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  formatDateTime,
  VESSEL_CALL_STATUS_LABELS,
  ILS_FUNCTION_LABELS,
  EXPORT_ROUTE_CHAIN,
} from '../utils';
import {
  Ship,
  Package,
  ClipboardList,
  ArrowLeftRight,
  MapPinned,
  FileBarChart,
  Target,
  Gauge,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

const QUICK_ACTIONS = [
  { to: '/cargo-tracking', label: 'Отслеживание груза', icon: MapPinned, color: 'text-rose-500' },
  { to: '/reports', label: 'Составить отчёт', icon: FileBarChart, color: 'text-blue-500' },
  { to: '/logistics-orders', label: 'Заказы', icon: ClipboardList, color: 'text-indigo-500' },
  { to: '/flows', label: 'Потоки ИЛС', icon: ArrowLeftRight, color: 'text-cyan-500' },
] as const;

const ILS_LINKS = [
  { to: '/logistics-orders', label: 'Планирование', icon: Target },
  { to: '/cargo-tracking', label: 'Регулирование', icon: Gauge },
  { to: '/vessel-calls', label: 'Контроль', icon: Ship },
  { to: '/reports?type=terminal-summary', label: 'Анализ', icon: BarChart3 },
  { to: '/flows', label: 'Учёт', icon: Package },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeVesselCalls, setActiveVesselCalls] = useState<VesselCall[]>([]);
  const [recentEvents, setRecentEvents] = useState<InfoFlowEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, vesselCallsData, events] = await Promise.all([
        dashboardApi.getStats(),
        vesselCallsApi.getAll(),
        infoFlowsApi.getAll({ limit: 6 }),
      ]);

      setStats(statsData);
      setRecentEvents(events);
      setActiveVesselCalls(
        vesselCallsData.filter((vc) =>
          ['EXPECTED', 'ARRIVED', 'BERTHED', 'IN_OPERATION'].includes(vc.status)
        )
      );
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка центра управления..." />;
  }

  const kpis = [
    {
      label: 'Партии на маршруте',
      value: stats?.cargoOnRoutes ?? 0,
      sub: `всего ${stats?.containers ?? 0}`,
      to: '/cargo-tracking',
      accent: 'border-l-rose-500',
      valueClass: 'text-rose-600 dark:text-rose-400',
    },
    {
      label: 'Заказы в работе',
      value: stats?.ordersInProgress ?? 0,
      sub: `всего ${stats?.ordersTotal ?? 0}`,
      to: '/logistics-orders',
      accent: 'border-l-indigo-500',
      valueClass: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      label: 'Судозаходы',
      value: stats?.vesselCallsActive ?? 0,
      sub: `всего ${stats?.vesselCallsTotal ?? 0}`,
      to: '/vessel-calls',
      accent: 'border-l-blue-500',
      valueClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Потоки сегодня',
      value: (stats?.materialFlowsToday ?? 0) + (stats?.infoEventsToday ?? 0),
      sub: `М:${stats?.materialFlowsToday ?? 0} И:${stats?.infoEventsToday ?? 0}`,
      to: '/flows',
      accent: 'border-l-cyan-500',
      valueClass: 'text-cyan-600 dark:text-cyan-400',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Центр управления ИЛС"
        subtitle="Сводная информация · объект учёта — партия груза"
      />

      <Card className="mb-6 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
        <p className="text-sm text-secondary leading-relaxed">
          Цепочка экспорта: {EXPORT_ROUTE_CHAIN}. Все операции, транспорт и склады отображают
          текущее состояние <strong className="text-primary">партии груза</strong> на каждом этапе.
        </p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {QUICK_ACTIONS.map(({ to, label, icon: Icon, color }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 p-4 rounded-lg border border-default bg-surface hover:shadow-md transition-shadow"
          >
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-sm font-medium text-primary">{label}</span>
            <ChevronRight className="w-4 h-4 ml-auto text-muted" />
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <Link key={kpi.label} to={kpi.to}>
            <Card className={`hover:shadow-lg transition-shadow border-l-4 ${kpi.accent} h-full`}>
              <p className="text-xs text-muted">{kpi.label}</p>
              <p className={`text-2xl font-bold mt-1 ${kpi.valueClass}`}>{kpi.value}</p>
              <p className="text-xs text-subtle mt-1">{kpi.sub}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {ILS_LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-full border border-default hover-surface text-secondary"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Активные судозаходы">
          {activeVesselCalls.length === 0 ? (
            <p className="text-subtle text-center py-8">Нет активных судозаходов</p>
          ) : (
            <div className="space-y-3">
              {activeVesselCalls.slice(0, 5).map((call) => (
                <div
                  key={call.id}
                  className="border-l-4 border-blue-500 pl-4 py-2 hover-surface rounded-r-lg"
                >
                  <h4 className="font-semibold text-primary">{call.vessel.name}</h4>
                  <p className="text-sm text-muted">
                    Рейс {call.voyageNumber}
                    {call.berth && ` · причал №${call.berth.number}`}
                  </p>
                  <StatusBadge
                    status={call.status}
                    label={VESSEL_CALL_STATUS_LABELS[call.status]}
                  />
                </div>
              ))}
              <Link to="/vessel-calls" className="text-sm text-blue-500 hover:underline">
                Все судозаходы →
              </Link>
            </div>
          )}
        </Card>

        <Card title="Последние события ИЛС">
          {recentEvents.length === 0 ? (
            <p className="text-subtle text-center py-8">Событий нет</p>
          ) : (
            <div className="space-y-3">
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
              <Link to="/reports?type=info-flows" className="text-sm text-blue-500 hover:underline">
                Отчёт по событиям →
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

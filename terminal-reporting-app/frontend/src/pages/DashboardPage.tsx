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
  MANAGEMENT_LEVEL_LABELS,
  EXPORT_ROUTE_CHAIN,
} from '../utils';
import {
  Ship,
  Package,
  Train,
  Truck,
  Warehouse,
  ClipboardList,
  ArrowLeftRight,
  Building2,
  Target,
  Gauge,
  BarChart3,
  MapPinned,
} from 'lucide-react';

const ILS_FUNCTIONS = [
  { key: 'PLANNING', icon: Target, desc: 'Планирование логистических цепочек и заказов' },
  { key: 'REGULATION', icon: Gauge, desc: 'Диспетчерское регулирование операций' },
  { key: 'CONTROL', icon: Ship, desc: 'Контроль: суша → склад → погрузка на судно' },
  { key: 'ANALYSIS', icon: BarChart3, desc: 'Анализ показателей терминала' },
  { key: 'ACCOUNTING', icon: Package, desc: 'Учёт движения грузов и событий' },
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
        infoFlowsApi.getAll({ limit: 8 }),
      ]);

      setStats(statsData);
      setRecentEvents(events);

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
    return <LoadingSpinner text="Загрузка панели ИЛС..." />;
  }

  return (
    <div>
      <PageHeader
        title="Панель управления ИЛС"
        subtitle="Объект учёта — груз · прототип по ТЗ §3"
      />

      <Card className="mb-8 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
        <p className="text-sm text-secondary leading-relaxed">
          <strong className="text-primary">ИЛС угольно-нефтяного терминала</strong> отслеживает
          полный путь <strong className="text-primary">груза</strong>: {EXPORT_ROUTE_CHAIN}. Ж/д вагон,
          автомобиль и судно — идентификаторы для сопоставления с партией; склад и транспорт отражают
          текущее состояние груза на каждом этапе.
        </p>
      </Card>

      <div className="mb-2 px-1 text-xs font-semibold text-muted uppercase tracking-wider">
        Функции ИЛС
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {ILS_FUNCTIONS.map(({ key, icon: Icon, desc }) => (
          <div
            key={key}
            className="p-4 rounded-lg border border-default bg-white dark:bg-slate-900"
          >
            <Icon className="w-5 h-5 text-blue-500 mb-2" />
            <p className="font-semibold text-sm text-primary">{ILS_FUNCTION_LABELS[key]}</p>
            <p className="text-xs text-subtle mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <div className="mb-2 px-1 text-xs font-semibold text-muted uppercase tracking-wider">
        Уровни управления
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/logistics-orders">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500">
            <p className="text-sm text-muted">{MANAGEMENT_LEVEL_LABELS.PLANNING}</p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats?.ordersPlanning ?? 0}
            </p>
            <p className="text-xs text-subtle">заказов</p>
          </Card>
        </Link>
        <Link to="/logistics-orders">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-amber-500">
            <p className="text-sm text-muted">{MANAGEMENT_LEVEL_LABELS.DISPATCH}</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {stats?.ordersDispatch ?? 0}
            </p>
            <p className="text-xs text-subtle">заказов</p>
          </Card>
        </Link>
        <Link to="/logistics-orders">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-teal-500">
            <p className="text-sm text-muted">{MANAGEMENT_LEVEL_LABELS.OPERATIONAL}</p>
            <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">
              {stats?.ordersOperational ?? 0}
            </p>
            <p className="text-xs text-subtle">заказов</p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        <Link to="/cargo-tracking">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted font-medium">Партии на маршруте</p>
                <p className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">
                  {stats?.cargoOnRoutes ?? 0}
                </p>
                <p className="text-xs text-subtle mt-1">
                  Всего партий: {stats?.containers ?? 0}
                </p>
              </div>
              <MapPinned className="w-8 h-8 text-rose-400" />
            </div>
          </Card>
        </Link>

        <Link to="/cargo-lots">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted font-medium">Партии на терминале</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {stats?.containers || 0}
                </p>
              </div>
              <Package className="w-8 h-8 text-green-400" />
            </div>
          </Card>
        </Link>

        <Link to="/logistics-orders">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted font-medium">Заказы в работе</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
                  {stats?.ordersInProgress ?? 0}
                </p>
                <p className="text-xs text-subtle mt-1">Всего: {stats?.ordersTotal ?? 0}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-indigo-400" />
            </div>
          </Card>
        </Link>

        <Link to="/vessel-calls">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted font-medium">Судозаходы (сопоставление)</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {stats?.vesselCallsActive || 0}
                </p>
                <p className="text-xs text-subtle mt-1">Всего: {stats?.vesselCallsTotal || 0}</p>
              </div>
              <Ship className="w-8 h-8 text-blue-400" />
            </div>
          </Card>
        </Link>

        <Link to="/flows">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-cyan-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted font-medium">Потоки за сегодня</p>
                <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-2">
                  {(stats?.materialFlowsToday ?? 0) + (stats?.infoEventsToday ?? 0)}
                </p>
                <p className="text-xs text-subtle mt-1">
                  М: {stats?.materialFlowsToday ?? 0} / И: {stats?.infoEventsToday ?? 0}
                </p>
              </div>
              <ArrowLeftRight className="w-8 h-8 text-cyan-400" />
            </div>
          </Card>
        </Link>

        <Link to="/counterparties">
          <Card className="hover:shadow-xl transition-shadow cursor-pointer border-l-4 border-l-violet-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted font-medium">Контрагенты</p>
                <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mt-2">
                  {stats?.counterpartiesCount ?? 0}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-violet-400" />
            </div>
          </Card>
        </Link>
      </div>

      <p className="text-xs text-muted mb-2 px-1">Транспорт — идентификаторы для сопоставления с грузом</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/cargo-lots" className="text-center p-4 border border-default rounded-lg hover-surface">
          <Package className="w-6 h-6 mx-auto text-green-500 mb-1" />
          <p className="text-lg font-bold">{stats?.containers || 0}</p>
          <p className="text-xs text-muted">Партии груза</p>
        </Link>
        <Link to="/wagons" className="text-center p-4 border border-default rounded-lg hover-surface">
          <Train className="w-6 h-6 mx-auto text-orange-500 mb-1" />
          <p className="text-lg font-bold">{stats?.wagons || 0}</p>
          <p className="text-xs text-muted">Вагоны</p>
        </Link>
        <Link to="/trucks" className="text-center p-4 border border-default rounded-lg hover-surface">
          <Truck className="w-6 h-6 mx-auto text-amber-500 mb-1" />
          <p className="text-lg font-bold">{stats?.trucks || 0}</p>
          <p className="text-xs text-muted">Автопарк</p>
        </Link>
        <Link to="/warehouses" className="text-center p-4 border border-default rounded-lg hover-surface">
          <Warehouse className="w-6 h-6 mx-auto text-purple-500 mb-1" />
          <p className="text-lg font-bold">{stats?.warehouses || 0}</p>
          <p className="text-xs text-muted">Склады</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Судозаходы (сопоставление с грузом)">
          {activeVesselCalls.length === 0 ? (
            <p className="text-subtle text-center py-8">Нет активных судозаходов</p>
          ) : (
            <div className="space-y-4">
              {activeVesselCalls.slice(0, 5).map((call) => (
                <div
                  key={call.id}
                  className="border-l-4 border-blue-500 pl-4 py-2 hover-surface transition-colors rounded-r-lg"
                >
                  <h4 className="font-bold text-primary">{call.vessel.name}</h4>
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
            </div>
          )}
        </Card>

        <Card title="Журнал информационных потоков">
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
            </div>
          )}
          <Link to="/flows" className="text-sm text-blue-500 hover:underline mt-4 inline-block">
            Все потоки →
          </Link>
        </Card>
      </div>
    </div>
  );
}

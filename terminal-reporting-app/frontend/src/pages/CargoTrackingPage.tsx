import { useEffect, useState } from 'react';
import { logisticsRoutesApi, containersApi } from '../api';
import { EXPORT_ROUTE_CHAIN } from '../utils';
import type {
  LogisticsRoute,
  CargoTracking,
  ContainerTrackingResult,
  Container,
  RouteStage,
} from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import {
  formatDateTime,
  ROUTE_STATUS_LABELS,
  ROUTE_STAGE_TYPE_LABELS,
  ROUTE_STAGE_STATUS_LABELS,
  CARGO_TRACKING_STATUS_LABELS,
  TRANSPORT_MODE_LABELS,
} from '../utils';
import { Search, MapPin, ChevronRight, Package, Route } from 'lucide-react';

function RouteTimeline({ stages, currentStageId }: { stages: RouteStage[]; currentStageId?: number }) {
  return (
    <div className="flex flex-col gap-0 md:flex-row md:items-start md:gap-2 py-4 overflow-x-auto">
      {stages.map((stage, index) => {
        const isCurrent = stage.id === currentStageId || stage.status === 'CURRENT';
        const isDone = stage.status === 'COMPLETED';
        return (
          <div key={stage.id} className="flex md:flex-col items-start md:items-center min-w-[140px] flex-1">
            <div className="flex md:flex-col items-center gap-2 w-full">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  isDone
                    ? 'bg-green-600 text-white'
                    : isCurrent
                      ? 'bg-amber-500 text-white ring-4 ring-amber-200 dark:ring-amber-900'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {stage.sequence}
              </div>
              {index < stages.length - 1 && (
                <ChevronRight className="w-5 h-5 text-slate-400 hidden md:block rotate-90 md:rotate-0" />
              )}
            </div>
            <div className="ml-3 md:ml-0 md:mt-2 md:text-center flex-1">
              <p className="text-xs font-semibold text-primary">{ROUTE_STAGE_TYPE_LABELS[stage.stageType]}</p>
              <p className="text-sm font-medium">{stage.locationName}</p>
              <p className="text-xs text-muted">{stage.locationCode}</p>
              {stage.transportMode && (
                <p className="text-xs text-subtle">{TRANSPORT_MODE_LABELS[stage.transportMode]}</p>
              )}
              <StatusBadge
                status={stage.status}
                label={ROUTE_STAGE_STATUS_LABELS[stage.status]}
              />
              {stage.actualAt && (
                <p className="text-xs text-subtle mt-1">{formatDateTime(stage.actualAt)}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TrackingCard({
  tracking,
  onAdvance,
  advancing,
}: {
  tracking: CargoTracking;
  onAdvance: (id: number) => void;
  advancing: number | null;
}) {
  const stages = tracking.route?.stages ?? [];
  return (
    <div className="border border-default rounded-lg p-4 mb-4">
      <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
        <div>
          <p className="font-mono font-bold text-lg">{tracking.container.containerNumber}</p>
          <p className="text-sm text-muted">
            Маршрут {tracking.route?.routeNumber}: {tracking.route?.origin} → {tracking.route?.destination}
          </p>
        </div>
        <StatusBadge
          status={tracking.status}
          label={CARGO_TRACKING_STATUS_LABELS[tracking.status]}
        />
      </div>
      {stages.length > 0 && (
        <RouteTimeline stages={stages} currentStageId={tracking.currentStageId} />
      )}
      {tracking.currentStage && (
        <p className="text-sm text-secondary mb-3">
          <MapPin className="w-4 h-4 inline mr-1 text-amber-500" />
          Текущая позиция: <strong>{tracking.currentStage.locationName}</strong>
        </p>
      )}
      {tracking.notes && <p className="text-xs text-subtle mb-3">{tracking.notes}</p>}
      {tracking.events && tracking.events.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted uppercase mb-2">История перемещений</p>
          <ul className="space-y-1">
            {tracking.events.map((ev) => (
              <li key={ev.id} className="text-sm text-secondary">
                {formatDateTime(ev.eventAt)} — {ev.description || 'Перемещение'}
              </li>
            ))}
          </ul>
        </div>
      )}
      {tracking.status !== 'DELIVERED' && (
        <button
          onClick={() => onAdvance(tracking.id)}
          disabled={advancing === tracking.id}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
        >
          {advancing === tracking.id ? 'Обновление...' : 'Перевести на следующий этап'}
        </button>
      )}
    </div>
  );
}

export default function CargoTrackingPage() {
  const [routes, setRoutes] = useState<LogisticsRoute[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<ContainerTrackingResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [routeDetail, setRouteDetail] = useState<LogisticsRoute | null>(null);
  const [advancing, setAdvancing] = useState<number | null>(null);
  const [addContainerId, setAddContainerId] = useState('');

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const [routesData, containersData] = await Promise.all([
        logisticsRoutesApi.getAll(),
        containersApi.getAll(),
      ]);
      setRoutes(routesData);
      setContainers(containersData);
    } catch (error) {
      console.error('Ошибка загрузки маршрутов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRouteDetail = async (id: number) => {
    try {
      const detail = await logisticsRoutesApi.getById(id);
      setRouteDetail(detail);
      setSelectedRouteId(id);
    } catch (error) {
      console.error('Ошибка загрузки маршрута:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toUpperCase();
    if (!q) return;
    setSearchError('');
    setSearchLoading(true);
    try {
      const result = await logisticsRoutesApi.trackByBatch(q);
      setSearchResult(result);
    } catch {
      setSearchResult(null);
      setSearchError('Партия груза не найдена или не привязана к маршруту');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAdvance = async (trackingId: number) => {
    try {
      setAdvancing(trackingId);
      await logisticsRoutesApi.advanceTracking(trackingId);
      if (selectedRouteId) await loadRouteDetail(selectedRouteId);
      if (searchResult) {
        const updated = await logisticsRoutesApi.trackByBatch(searchResult.container.containerNumber);
        setSearchResult(updated);
      }
      await loadRoutes();
    } catch (error) {
      console.error('Ошибка перевода на этап:', error);
    } finally {
      setAdvancing(null);
    }
  };

  const handleAddToRoute = async () => {
    if (!selectedRouteId || !addContainerId) return;
    try {
      await logisticsRoutesApi.addTracking(selectedRouteId, Number(addContainerId));
      setAddContainerId('');
      await loadRouteDetail(selectedRouteId);
      await loadRoutes();
    } catch (error) {
      console.error('Ошибка добавления на маршрут:', error);
    }
  };

  if (loading) return <LoadingSpinner text="Загрузка маршрутов..." />;

  return (
    <div>
      <PageHeader
        title="Отслеживание грузов по маршрутам"
        subtitle={`Угольно-нефтяной терминал: ${EXPORT_ROUTE_CHAIN}`}
      />

      <Card className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="text"
              placeholder="Номер партии, например COAL-2026-0001"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="input-field w-full pl-10"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            {searchLoading ? 'Поиск...' : 'Найти груз'}
          </button>
        </form>
        {searchError && <p className="text-red-500 text-sm mt-2">{searchError}</p>}
      </Card>

      {searchResult && (
        <Card title={`Результат: ${searchResult.container.containerNumber}`} className="mb-6">
          {searchResult.trackings.length === 0 ? (
            <p className="text-subtle py-4">Контейнер не привязан ни к одному маршруту</p>
          ) : (
            searchResult.trackings.map((t) => (
              <TrackingCard
                key={t.id}
                tracking={t}
                onAdvance={handleAdvance}
                advancing={advancing}
              />
            ))
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Логистические маршруты" className="lg:col-span-1">
          {routes.length === 0 ? (
            <p className="text-subtle text-sm py-4">Маршруты не созданы</p>
          ) : (
            <ul className="space-y-2">
              {routes.map((route) => (
                <li key={route.id}>
                  <button
                    onClick={() => loadRouteDetail(route.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedRouteId === route.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-default hover-surface'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Route className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="font-mono font-semibold text-sm">{route.routeNumber}</span>
                    </div>
                    <p className="text-xs text-muted mt-1">
                      {route.origin} → {route.destination}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <StatusBadge status={route.status} label={ROUTE_STATUS_LABELS[route.status]} />
                      <span className="text-xs text-subtle">
                        {route._count?.trackings ?? 0} груз(ов) · {route._count?.stages ?? 0} этапов
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="lg:col-span-2">
          {routeDetail ? (
            <Card title={`Маршрут ${routeDetail.routeNumber}`}>
              <p className="text-sm text-muted mb-4">
                {routeDetail.name || `${routeDetail.origin} → ${routeDetail.destination}`}
              </p>
              {routeDetail.order && (
                <p className="text-sm text-muted mb-4">
                  Заказ: {routeDetail.order.orderNumber}
                </p>
              )}
              {routeDetail.stages && routeDetail.stages.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-muted uppercase mb-2">Схема маршрута</p>
                  <RouteTimeline stages={routeDetail.stages} />
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <select
                  value={addContainerId}
                  onChange={(e) => setAddContainerId(e.target.value)}
                  className="input-field flex-1 min-w-[200px]"
                >
                  <option value="">Добавить партию груза на маршрут</option>
                  {containers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.containerNumber}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddToRoute}
                  disabled={!addContainerId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Package className="w-4 h-4 inline mr-1" />
                  Поставить на отслеживание
                </button>
              </div>

              {routeDetail.trackings && routeDetail.trackings.length > 0 ? (
                routeDetail.trackings.map((t) => (
                  <TrackingCard
                    key={t.id}
                    tracking={{ ...t, route: routeDetail }}
                    onAdvance={handleAdvance}
                    advancing={advancing}
                  />
                ))
              ) : (
                <p className="text-subtle text-center py-6">На маршруте нет отслеживаемых грузов</p>
              )}
            </Card>
          ) : (
            <Card>
              <p className="text-subtle text-center py-12">
                Выберите маршрут слева или найдите груз по номеру контейнера
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

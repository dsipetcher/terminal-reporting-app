import { useEffect, useState } from 'react';
import {
  logisticsRoutesApi,
  containersApi,
  wagonsApi,
  vesselCallsApi,
} from '../api';
import { EXPORT_ROUTE_CHAIN } from '../utils';
import type {
  LogisticsRoute,
  CargoTracking,
  ContainerTrackingResult,
  Container,
  RouteStage,
  Wagon,
  VesselCall,
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
  CARGO_BATCH_STATUS_LABELS,
  CARGO_CATEGORY_LABELS,
  getTransportModeLabel,
  formatPortCode,
  formatWarehouseLabel,
} from '../utils';
import { Search, MapPin, ChevronRight, Train, Ship } from 'lucide-react';

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
              {stage.transportMode && (
                <p className="text-xs text-subtle">{getTransportModeLabel(stage.transportMode)}</p>
              )}
              <StatusBadge status={stage.status} label={ROUTE_STAGE_STATUS_LABELS[stage.status]} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TransportLinks({
  container,
  wagons,
  vesselCalls,
}: {
  container: Container;
  wagons: Wagon[];
  vesselCalls: VesselCall[];
}) {
  const linkedWagons = wagons.filter((w) => w.containerId === container.id);
  const vesselCall = container.vesselCallId
    ? vesselCalls.find((vc) => vc.id === container.vesselCallId)
    : undefined;

  const items: { icon: typeof Train; label: string; value: string }[] = [];
  linkedWagons.forEach((w) => {
    items.push({
      icon: Train,
      label: 'Вагон',
      value: `${w.number}${w.trainNumber ? ` · поезд ${w.trainNumber}` : ''}`,
    });
  });
  if (vesselCall) {
    items.push({
      icon: Ship,
      label: 'Судозаход',
      value: `${vesselCall.vessel.name} · рейс ${vesselCall.voyageNumber}`,
    });
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-subtle">
        Идентификаторы транспорта не привязаны — груз учитывается только по номеру партии.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-lg bg-slate-50 dark:bg-slate-900">
          <item.icon className="w-4 h-4 text-muted shrink-0" />
          <span className="text-subtle">{item.label}:</span>
          <span className="font-mono text-primary">{item.value}</span>
        </div>
      ))}
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
      <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
        <div>
          <p className="text-sm text-muted">
            Маршрут {tracking.route?.routeNumber}: {formatPortCode(tracking.route?.origin)} → {formatPortCode(tracking.route?.destination)}
          </p>
        </div>
        <StatusBadge status={tracking.status} label={CARGO_TRACKING_STATUS_LABELS[tracking.status]} />
      </div>
      {stages.length > 0 && (
        <RouteTimeline stages={stages} currentStageId={tracking.currentStageId} />
      )}
      {tracking.currentStage && (
        <p className="text-sm text-secondary mb-3">
          <MapPin className="w-4 h-4 inline mr-1 text-amber-500" />
          Текущее состояние груза: <strong>{ROUTE_STAGE_TYPE_LABELS[tracking.currentStage.stageType]}</strong>
          {' · '}{tracking.currentStage.locationName}
        </p>
      )}
      {tracking.events && tracking.events.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted uppercase mb-2">История состояний</p>
          <ul className="space-y-1">
            {tracking.events.map((ev) => (
              <li key={ev.id} className="text-sm text-secondary">
                {formatDateTime(ev.eventAt)} — {ev.description || 'Смена состояния'}
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
          {advancing === tracking.id ? 'Обновление...' : 'Перевести груз на следующий этап'}
        </button>
      )}
    </div>
  );
}

export default function CargoTrackingPage() {
  const [cargoList, setCargoList] = useState<Container[]>([]);
  const [routes, setRoutes] = useState<LogisticsRoute[]>([]);
  const [wagons, setWagons] = useState<Wagon[]>([]);
  const [vesselCalls, setVesselCalls] = useState<VesselCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<ContainerTrackingResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [advancing, setAdvancing] = useState<number | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const [addRouteId, setAddRouteId] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [containersData, routesData, wagonsData, callsData] = await Promise.all([
        containersApi.getAll(),
        logisticsRoutesApi.getAll(),
        wagonsApi.getAll(),
        vesselCallsApi.getAll(),
      ]);
      setCargoList(containersData);
      setRoutes(routesData);
      setWagons(wagonsData);
      setVesselCalls(callsData);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectBatch = async (batchNumber: string) => {
    setSelectedBatch(batchNumber);
    setSearchQuery(batchNumber);
    setSearchError('');
    setSearchLoading(true);
    try {
      const result = await logisticsRoutesApi.trackByBatch(batchNumber);
      setSearchResult(result);
      const fresh = cargoList.find((c) => c.containerNumber === batchNumber);
      if (fresh && result.container) {
        setSearchResult({ ...result, container: { ...fresh, ...result.container } });
      }
    } catch {
      setSearchResult(null);
      setSearchError('Партия не найдена');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toUpperCase();
    if (!q) return;
    await selectBatch(q);
  };

  const handleAdvance = async (trackingId: number) => {
    try {
      setAdvancing(trackingId);
      await logisticsRoutesApi.advanceTracking(trackingId);
      if (selectedBatch) await selectBatch(selectedBatch);
      await loadData();
    } catch (error) {
      console.error('Ошибка смены состояния:', error);
    } finally {
      setAdvancing(null);
    }
  };

  const handleAddToRoute = async () => {
    if (!activeCargo || !addRouteId) return;
    try {
      await logisticsRoutesApi.addTracking(Number(addRouteId), activeCargo.id);
      setAddRouteId('');
      await selectBatch(activeCargo.containerNumber);
      await loadData();
    } catch (error) {
      console.error('Ошибка постановки на маршрут:', error);
    }
  };

  const activeCargo = searchResult?.container ?? cargoList.find((c) => c.containerNumber === selectedBatch);

  if (loading) return <LoadingSpinner text="Загрузка грузов..." />;

  return (
    <div>
      <PageHeader
        title="Отслеживание грузов"
        subtitle={`Объект учёта — партия груза. Транспорт и склад — текущее состояние. ${EXPORT_ROUTE_CHAIN}`}
      />

      <Card className="mb-6 border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20">
        <p className="text-sm text-secondary">
          ИЛС отслеживает <strong className="text-primary">груз</strong> от поставщика до порта назначения.
          Вагон или судно — идентификаторы для сопоставления с партией, а не отдельные объекты учёта.
        </p>
      </Card>

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
            {searchLoading ? 'Поиск...' : 'Найти партию'}
          </button>
        </form>
        {searchError && <p className="text-red-500 text-sm mt-2">{searchError}</p>}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Партии на терминале" className="lg:col-span-1">
          {cargoList.length === 0 ? (
            <p className="text-subtle text-sm py-4">Партий нет</p>
          ) : (
            <ul className="space-y-2">
              {cargoList.map((cargo) => (
                <li key={cargo.id}>
                  <button
                    onClick={() => selectBatch(cargo.containerNumber)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedBatch === cargo.containerNumber
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-default hover-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono font-semibold text-sm">{cargo.containerNumber}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {CARGO_CATEGORY_LABELS[cargo.cargoCategory ?? 'COAL']}
                          {cargo.quantityTons ? ` · ${cargo.quantityTons} т` : ''}
                        </p>
                      </div>
                      <StatusBadge
                        status={cargo.status}
                        label={CARGO_BATCH_STATUS_LABELS[cargo.status]}
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {activeCargo ? (
            <>
              <Card title={`Партия ${activeCargo.containerNumber}`}>
                <div className="flex flex-wrap gap-4 mb-4">
                  <StatusBadge
                    status={activeCargo.status}
                    label={CARGO_BATCH_STATUS_LABELS[activeCargo.status]}
                  />
                  {activeCargo.supplierName && (
                    <span className="text-sm text-muted">Поставщик: {activeCargo.supplierName}</span>
                  )}
                  {activeCargo.warehouse && (
                    <span className="text-sm text-muted">
                      Склад: {formatWarehouseLabel(activeCargo.warehouse)}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-muted uppercase mb-2">
                  Сопоставление с транспортом (идентификаторы)
                </p>
                <TransportLinks
                  container={activeCargo}
                  wagons={wagons}
                  vesselCalls={vesselCalls}
                />
              </Card>

              {searchResult && searchResult.trackings.length > 0 ? (
                searchResult.trackings.map((t) => (
                  <TrackingCard
                    key={t.id}
                    tracking={t}
                    onAdvance={handleAdvance}
                    advancing={advancing}
                  />
                ))
              ) : (
                <Card>
                  <p className="text-subtle py-4">
                    Партия не привязана к логистическому маршруту. Добавьте её на маршрут в разделе ниже.
                  </p>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <p className="text-subtle text-center py-12">
                Выберите партию слева или найдите по номеру
              </p>
            </Card>
          )}

          <Card>
            <button
              type="button"
              onClick={() => setShowRoutes(!showRoutes)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="font-semibold text-primary">Логистические маршруты (шаблоны цепочки)</span>
              <ChevronRight className={`w-5 h-5 transition-transform ${showRoutes ? 'rotate-90' : ''}`} />
            </button>
            {showRoutes && (
              <div className="mt-4 space-y-4">
                {activeCargo && (
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <select
                      value={addRouteId}
                      onChange={(e) => setAddRouteId(e.target.value)}
                      className="input-field flex-1 min-w-[200px]"
                    >
                      <option value="">Выберите маршрут для партии {activeCargo.containerNumber}</option>
                      {routes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.routeNumber} · {formatPortCode(route.origin)} → {formatPortCode(route.destination)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddToRoute}
                      disabled={!addRouteId}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                      Поставить на отслеживание
                    </button>
                  </div>
                )}
                {routes.length === 0 ? (
                  <p className="text-subtle text-sm">Маршруты не созданы</p>
                ) : (
                  routes.map((route) => (
                    <div key={route.id} className="p-3 rounded-lg border border-default">
                      <p className="font-mono font-semibold text-sm">{route.routeNumber}</p>
                      <p className="text-xs text-muted">{formatPortCode(route.origin)} → {formatPortCode(route.destination)}</p>
                      <div className="flex gap-2 mt-2">
                        <StatusBadge status={route.status} label={ROUTE_STATUS_LABELS[route.status]} />
                        <span className="text-xs text-subtle">
                          {route._count?.trackings ?? 0} партий · {route._count?.stages ?? 0} этапов
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

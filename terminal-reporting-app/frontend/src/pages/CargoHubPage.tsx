import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  containersApi,
  logisticsRoutesApi,
  wagonsApi,
  vesselCallsApi,
  warehousesApi,
  logisticsOrdersApi,
  materialFlowsApi,
  infoFlowsApi,
} from '../api';
import type { Container, ContainerTrackingResult } from '../types';
import { buildCargoProfile } from '../lib/buildCargoProfile';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { CargoDetailPanel } from '../components/cargo/CargoDetailPanel';
import { CargoOnboardingWizard } from '../components/cargo/CargoOnboardingWizard';
import {
  CARGO_BATCH_STATUS_LABELS,
  CARGO_CATEGORY_LABELS,
  CARGO_GRADE_LABELS,
  EXPORT_ROUTE_CHAIN,
} from '../utils';
import { Search, Package, Plus, Route } from 'lucide-react';

export default function CargoHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const batchFromUrl = searchParams.get('batch');
  const wizardParam = searchParams.get('wizard');

  const [cargoList, setCargoList] = useState<Container[]>([]);
  const [trackingResult, setTrackingResult] = useState<ContainerTrackingResult | null>(null);
  const [wagons, setWagons] = useState<Awaited<ReturnType<typeof wagonsApi.getAll>>>([]);
  const [vesselCalls, setVesselCalls] = useState<Awaited<ReturnType<typeof vesselCallsApi.getAll>>>([]);
  const [warehouses, setWarehouses] = useState<Awaited<ReturnType<typeof warehousesApi.getAll>>>([]);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof logisticsOrdersApi.getAll>>>([]);
  const [materialFlows, setMaterialFlows] = useState<Awaited<ReturnType<typeof materialFlowsApi.getAll>>>([]);
  const [infoEvents, setInfoEvents] = useState<Awaited<ReturnType<typeof infoFlowsApi.getAll>>>([]);
  const [routes, setRoutes] = useState<Awaited<ReturnType<typeof logisticsRoutesApi.getAll>>>([]);

  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(batchFromUrl);
  const [searchQuery, setSearchQuery] = useState(batchFromUrl ?? '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchLoading, setSearchLoading] = useState(false);
  const [advancing, setAdvancing] = useState<number | null>(null);
  const [wizardOpen, setWizardOpen] = useState(wizardParam === 'new');
  const [wizardMode, setWizardMode] = useState<'create' | 'track'>('create');

  const loadBaseData = async () => {
    const [
      containersData,
      routesData,
      wagonsData,
      callsData,
      warehousesData,
      ordersData,
      flowsData,
      eventsData,
    ] = await Promise.all([
      containersApi.getAll(),
      logisticsRoutesApi.getAll(),
      wagonsApi.getAll(),
      vesselCallsApi.getAll(),
      warehousesApi.getAll(),
      logisticsOrdersApi.getAll(),
      materialFlowsApi.getAll(),
      infoFlowsApi.getAll({ limit: 100 }),
    ]);

    setCargoList(containersData);
    setRoutes(routesData);
    setWagons(wagonsData);
    setVesselCalls(callsData);
    setWarehouses(warehousesData);
    setOrders(ordersData);
    setMaterialFlows(flowsData);
    setInfoEvents(eventsData);
  };

  const selectBatch = async (batchNumber: string) => {
    setSelectedBatch(batchNumber);
    setSearchQuery(batchNumber);
    setSearchParams({ batch: batchNumber }, { replace: true });
    setSearchLoading(true);
    try {
      const result = await logisticsRoutesApi.trackByBatch(batchNumber);
      const fresh = cargoList.find((c) => c.containerNumber === batchNumber);
      setTrackingResult(
        fresh ? { ...result, container: { ...fresh, ...result.container } } : result
      );
    } catch {
      const container = cargoList.find((c) => c.containerNumber === batchNumber);
      setTrackingResult(container ? { container, trackings: [] } : null);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await loadBaseData();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading || cargoList.length === 0) return;
    if (batchFromUrl) {
      selectBatch(batchFromUrl);
    } else if (!selectedBatch && wizardParam !== 'new') {
      selectBatch(cargoList[0].containerNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, cargoList.length, batchFromUrl]);

  useEffect(() => {
    if (wizardParam === 'new') {
      setWizardMode('create');
      setWizardOpen(true);
    }
  }, [wizardParam]);

  const activeContainer =
    trackingResult?.container ??
    cargoList.find((c) => c.containerNumber === selectedBatch);

  const profile = useMemo(() => {
    if (!activeContainer) return null;
    return buildCargoProfile({
      container: activeContainer,
      trackings: trackingResult?.trackings ?? [],
      wagons,
      vesselCalls,
      warehouses,
      orders,
      materialFlows,
      infoEvents,
      routes,
    });
  }, [
    activeContainer,
    trackingResult,
    wagons,
    vesselCalls,
    warehouses,
    orders,
    materialFlows,
    infoEvents,
    routes,
  ]);

  const filteredList = cargoList.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery && !selectedBatch) {
      const q = searchQuery.toUpperCase();
      return c.containerNumber.includes(q) || c.supplierName?.toUpperCase().includes(q);
    }
    return true;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toUpperCase();
    if (q) selectBatch(q);
  };

  const handleAdvance = async (trackingId: number) => {
    if (!selectedBatch) return;
    try {
      setAdvancing(trackingId);
      await logisticsRoutesApi.advanceTracking(trackingId);
      await loadBaseData();
      await selectBatch(selectedBatch);
    } catch (e) {
      console.error(e);
    } finally {
      setAdvancing(null);
    }
  };

  const openWizard = (mode: 'create' | 'track') => {
    setWizardMode(mode);
    setWizardOpen(true);
  };

  const closeWizard = () => {
    setWizardOpen(false);
    if (wizardParam) {
      setSearchParams(selectedBatch ? { batch: selectedBatch } : {}, { replace: true });
    }
  };

  const handleWizardComplete = async (batchNumber: string) => {
    await loadBaseData();
    await selectBatch(batchNumber);
  };

  if (loading) return <LoadingSpinner text="Загрузка партий груза..." />;

  return (
    <div>
      <PageHeader
        title="Партии груза"
        subtitle={`Объект учёта ИЛС — партия. ${EXPORT_ROUTE_CHAIN}`}
        action={
          <button
            type="button"
            onClick={() => openWizard('create')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Новая партия
          </button>
        }
      />

      <Card className="mb-6 border border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/20">
        <p className="text-sm text-secondary">
          Выберите партию или запустите{' '}
          <strong className="text-primary">мастер отслеживания</strong>: партия → маршрут → привязка
          этапов (вагоны, склад, судно) → запуск. Вся информация — в карточке груза.
        </p>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 space-y-4">
          <Card>
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  placeholder="COAL-2026-0001"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value.toUpperCase());
                    if (!e.target.value) setSelectedBatch(null);
                  }}
                  className="input-field w-full pl-9 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Найти
              </button>
            </form>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-full text-sm mb-3"
            >
              <option value="ALL">Все статусы</option>
              {Object.entries(CARGO_BATCH_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            <p className="text-xs text-muted mb-2">{filteredList.length} партий</p>
            <ul className="space-y-2 max-h-[55vh] overflow-y-auto">
              {filteredList.map((cargo) => (
                <li key={cargo.id}>
                  <button
                    type="button"
                    onClick={() => selectBatch(cargo.containerNumber)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedBatch === cargo.containerNumber
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm'
                        : 'border-default hover-surface'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-mono font-semibold text-sm truncate">
                          {cargo.containerNumber}
                        </p>
                        <p className="text-xs text-muted mt-0.5 truncate">
                          {cargo.supplierName ?? CARGO_CATEGORY_LABELS[cargo.cargoCategory ?? 'COAL']}
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
          </Card>

          <Link
            to="/cargo-lots"
            className="block text-center text-xs text-muted hover:text-blue-500"
          >
            Расширенная регистрация партий →
          </Link>
        </div>

        <div className="xl:col-span-8">
          {searchLoading ? (
            <LoadingSpinner text="Загрузка карточки груза..." />
          ) : profile ? (
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6 pb-4 border-b border-default">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/50">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-mono text-primary">
                      {profile.container.containerNumber}
                    </h2>
                    <p className="text-sm text-muted mt-1">
                      {CARGO_GRADE_LABELS[profile.container.containerType] ??
                        profile.container.containerType}
                      {profile.container.quantityTons
                        ? ` · ${profile.container.quantityTons} т`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!profile.primaryTracking && (
                    <button
                      type="button"
                      onClick={() => openWizard('track')}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Route className="w-4 h-4" />
                      На отслеживание
                    </button>
                  )}
                  <StatusBadge
                    status={profile.container.status}
                    label={CARGO_BATCH_STATUS_LABELS[profile.container.status]}
                  />
                </div>
              </div>

              {profile.primaryTracking?.currentStage && (
                <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-secondary">
                    Текущий этап:{' '}
                    <strong className="text-primary">
                      {profile.primaryTracking.currentStage.locationName}
                    </strong>
                  </p>
                </div>
              )}

              <CargoDetailPanel
                profile={profile}
                onAdvance={handleAdvance}
                advancing={advancing}
                onOpenWizard={() => openWizard('track')}
              />
            </Card>
          ) : (
            <Card>
              <div className="text-center py-16">
                <Package className="w-12 h-12 mx-auto text-muted mb-4" />
                <p className="text-secondary font-medium">Выберите партию или создайте новую</p>
                <button
                  type="button"
                  onClick={() => openWizard('create')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Мастер новой партии
                </button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <CargoOnboardingWizard
        open={wizardOpen}
        onClose={closeWizard}
        onComplete={handleWizardComplete}
        mode={wizardMode}
        existingContainer={wizardMode === 'track' ? activeContainer : undefined}
        routes={routes}
        warehouses={warehouses}
        wagons={wagons}
        vesselCalls={vesselCalls}
      />
    </div>
  );
}

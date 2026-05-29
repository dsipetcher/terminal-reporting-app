import { useEffect, useMemo, useState } from 'react';

import {

  containersApi,

  logisticsRoutesApi,

  wagonsApi,

} from '../../api';

import type { Container, LogisticsRoute, Warehouse, Wagon, VesselCall, RouteStage } from '../../types';

import { WagonType, WagonStatus } from '../../types';

import { buildExportRouteStages, WIZARD_STEPS, STAGE_FIELDS } from '../../lib/exportRouteStages';

import {
  validateBatchNumber,
  ROUTE_STAGE_TYPE_LABELS,
  EXPORT_ROUTE_CHAIN,
  formatPortCode,
  formatWarehouseLabel,
  formatBerthLabel,
  validateWagonContainerAssignment,
  validateContainerVesselAssignment,
  findWagonByContainerId,
} from '../../utils';

import { RouteTimeline } from './RouteTimeline';

import {

  X,

  ChevronLeft,

  ChevronRight,

  Check,

  Package,

  Loader2,

} from 'lucide-react';



export interface CargoOnboardingWizardProps {

  open: boolean;

  onClose: () => void;

  onComplete: (batchNumber: string) => void;

  mode: 'create' | 'track';

  existingContainer?: Container;

  routes: LogisticsRoute[];

  warehouses: Warehouse[];

  wagons: Wagon[];

  vesselCalls: VesselCall[];

}



const emptyCargo = {

  containerNumber: '',

  supplierName: '',

  cargoCategory: 'COAL',

  containerType: 'COAL_ANTHRACITE',

  quantityTons: '',

  portOfLoading: 'RUNVS',

  portOfDischarge: 'TRMER',

  cargoDescription: '',

};



const emptyStages = {

  wagonId: '',

  wagonNumber: '',

  trainNumber: '',

  warehouseId: '',

  location: '',

  plannedWarehouseAt: '',

  vesselCallId: '',

  trackingNotes: '',

};



export function CargoOnboardingWizard({

  open,

  onClose,

  onComplete,

  mode,

  existingContainer,

  routes,

  warehouses,

  wagons,

  vesselCalls,

}: CargoOnboardingWizardProps) {

  const [step, setStep] = useState(1);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');



  const [cargo, setCargo] = useState(() =>

    existingContainer

      ? {

          containerNumber: existingContainer.containerNumber,

          supplierName: existingContainer.supplierName ?? '',

          cargoCategory: existingContainer.cargoCategory ?? 'COAL',

          containerType: existingContainer.containerType ?? 'COAL_ANTHRACITE',

          quantityTons: existingContainer.quantityTons?.toString() ?? '',

          portOfLoading: existingContainer.portOfLoading ?? 'RUNVS',

          portOfDischarge: existingContainer.portOfDischarge ?? 'TRMER',

          cargoDescription: existingContainer.cargoDescription ?? '',

        }

      : emptyCargo

  );



  const [routeMode, setRouteMode] = useState<'existing' | 'new'>(

    routes.length > 0 ? 'existing' : 'new'

  );

  const [existingRouteId, setExistingRouteId] = useState(routes[0]?.id?.toString() ?? '');

  const [stages, setStages] = useState(emptyStages);

  const linkedWagon = existingContainer
    ? findWagonByContainerId(wagons, existingContainer.id)
    : undefined;
  const lockedVesselCallId = existingContainer?.vesselCallId ?? null;

  useEffect(() => {
    if (!open) return;
    setStages({
      ...emptyStages,
      wagonId: linkedWagon ? String(linkedWagon.id) : '',
      trainNumber: linkedWagon?.trainNumber ?? '',
      warehouseId: existingContainer?.warehouseId ? String(existingContainer.warehouseId) : '',
      location: existingContainer?.location ?? '',
      vesselCallId: lockedVesselCallId ? String(lockedVesselCallId) : '',
    });
  }, [open, existingContainer?.id, linkedWagon?.id, lockedVesselCallId]);

  const availableWagons = useMemo(
    () =>
      wagons.filter((w) => {
        if (!w.containerId) return true;
        return linkedWagon?.id === w.id;
      }),
    [wagons, linkedWagon?.id]
  );



  const previewStages = useMemo(() => {

    const wh = warehouses.find((w) => w.id === Number(stages.warehouseId));

    const vc = vesselCalls.find((v) => v.id === Number(stages.vesselCallId));

    return buildExportRouteStages({

      supplierName: cargo.supplierName || 'Поставщик',

      supplierCode: cargo.supplierName?.slice(0, 12).toUpperCase().replace(/\s/g, '-') || 'SUPPLIER',

      warehouseName: wh
        ? `${formatWarehouseLabel(wh)}${stages.location ? ` / ${stages.location}` : ''}`
        : undefined,

      shipName: vc ? `${vc.vessel.name} · ${vc.voyageNumber}` : undefined,

      destPortCode: cargo.portOfDischarge,

      destPortName: formatPortCode(cargo.portOfDischarge),

    });

  }, [cargo, stages, warehouses, vesselCalls]);



  if (!open) return null;



  const resetAndClose = () => {

    setStep(1);

    setError('');

    onClose();

  };



  const validateStep = (s: number): string | null => {

    if (s === 1) {

      if (mode === 'create' && !cargo.containerNumber.trim()) return 'Укажите номер партии';

      if (mode === 'create' && !validateBatchNumber(cargo.containerNumber))

        return 'Неверный формат номера партии (например COAL-2026-0001)';

      if (!cargo.supplierName.trim()) return 'Укажите поставщика';

      if (!cargo.portOfDischarge.trim()) return 'Укажите порт назначения';

    }

    if (s === 2) {

      if (routeMode === 'existing' && !existingRouteId) return 'Выберите маршрут';

    }

    return null;

  };



  const goNext = () => {

    const err = validateStep(step);

    if (err) {

      setError(err);

      return;

    }

    setError('');

    setStep((s) => Math.min(4, s + 1));

  };



  const goBack = () => {

    setError('');

    setStep((s) => Math.max(1, s - 1));

  };



  const handleSubmit = async () => {

    const err = validateStep(1) || validateStep(2);

    if (err) {

      setError(err);

      return;

    }

    setSubmitting(true);

    setError('');

    try {

      const nextVesselCallId = stages.vesselCallId ? Number(stages.vesselCallId) : undefined;
      const vesselErr = validateContainerVesselAssignment(lockedVesselCallId, nextVesselCallId);
      if (vesselErr) {
        setError(vesselErr);
        setSubmitting(false);
        return;
      }

      let container: Container;

      const batchNumber = cargo.containerNumber.toUpperCase().trim();

      const payload = {

        containerNumber: batchNumber,

        supplierName: cargo.supplierName,

        cargoCategory: cargo.cargoCategory as Container['cargoCategory'],

        containerType: cargo.containerType as Container['containerType'],

        quantityTons: cargo.quantityTons ? parseFloat(cargo.quantityTons) : undefined,

        quantityUnit: 'TON',

        portOfLoading: cargo.portOfLoading,

        portOfDischarge: cargo.portOfDischarge,

        cargoDescription: cargo.cargoDescription || undefined,

        warehouseId: stages.warehouseId ? Number(stages.warehouseId) : undefined,

        location: stages.location || undefined,

        vesselCallId: stages.vesselCallId ? Number(stages.vesselCallId) : undefined,

        status: 'ON_LAND' as Container['status'],

      };



      if (mode === 'create' || !existingContainer) {

        container = await containersApi.create(payload);

      } else {

        container = await containersApi.update(existingContainer.id, payload);

      }



      if (stages.wagonId || stages.wagonNumber.trim()) {
        if (linkedWagon && Number(stages.wagonId || 0) !== linkedWagon.id) {
          throw new Error('У партии уже назначен вагон');
        }

        const wagonId = stages.wagonId ? Number(stages.wagonId) : undefined;
        const wagonErr = validateWagonContainerAssignment(wagons, container.id, wagonId);
        if (wagonErr) throw new Error(wagonErr);
      }

      if (stages.wagonId) {

        await wagonsApi.update(Number(stages.wagonId), {

          containerId: container.id,

          trainNumber: stages.trainNumber || undefined,

        });

      } else if (stages.wagonNumber.trim()) {

        await wagonsApi.create({

          number: stages.wagonNumber.trim(),

          trainNumber: stages.trainNumber || undefined,

          containerId: container.id,

          wagonType: WagonType.GONDOLA,

          status: WagonStatus.EN_ROUTE,

          arrivalAt: new Date().toISOString(),

        });

      }



      let routeId: number;

      if (routeMode === 'existing') {

        routeId = Number(existingRouteId);

      } else {

        const wh = warehouses.find((w) => w.id === Number(stages.warehouseId));

        const vc = vesselCalls.find((v) => v.id === Number(stages.vesselCallId));

        const origin = cargo.supplierName.slice(0, 20).toUpperCase().replace(/\s/g, '-');

        const route = await logisticsRoutesApi.create({

          routeNumber: `RT-${batchNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 12)}`,

          name: `Экспорт ${batchNumber}`,

          origin,

          destination: formatPortCode(cargo.portOfDischarge),

          routeKind: 'EXPORT',

          status: 'PLANNED',

          stages: buildExportRouteStages({

            supplierName: cargo.supplierName,

            supplierCode: origin,

            warehouseName: wh ? `${formatWarehouseLabel(wh)} / ${stages.location || '—'}` : undefined,

            shipName: vc ? `${vc.vessel.name} · ${vc.voyageNumber}` : undefined,

            destPortCode: cargo.portOfDischarge,

            destPortName: formatPortCode(cargo.portOfDischarge),

          }),

        } as Parameters<typeof logisticsRoutesApi.create>[0]);

        routeId = route.id;

      }



      await logisticsRoutesApi.addTracking(routeId, container.id, stages.trackingNotes || undefined);



      onComplete(batchNumber);

      resetAndClose();

    } catch (e) {

      console.error(e);

      setError('Не удалось запустить отслеживание. Проверьте данные и повторите.');

    } finally {

      setSubmitting(false);

    }

  };



  const selectedRoute = routes.find((r) => r.id === Number(existingRouteId));



  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">

      <div className="bg-surface border border-default rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-default shrink-0">

          <div>

            <h2 className="text-lg font-bold text-primary">

              {mode === 'create' ? 'Новая партия на отслеживании' : 'Постановка на отслеживание'}

            </h2>

            <p className="text-xs text-muted mt-0.5">{EXPORT_ROUTE_CHAIN}</p>

          </div>

          <button type="button" onClick={resetAndClose} className="p-2 rounded-lg hover-surface">

            <X className="w-5 h-5 text-muted" />

          </button>

        </div>



        <div className="px-6 py-3 border-b border-default shrink-0 overflow-x-auto">

          <div className="flex gap-2 min-w-max">

            {WIZARD_STEPS.map((s) => (

              <div

                key={s.id}

                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${

                  step === s.id

                    ? 'bg-blue-600 text-white'

                    : step > s.id

                      ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'

                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800'

                }`}

              >

                {step > s.id ? <Check className="w-3 h-3" /> : <span>{s.id}</span>}

                <span>{s.title}</span>

              </div>

            ))}

          </div>

        </div>



        <div className="flex-1 overflow-y-auto px-6 py-5">

          {error && (

            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 text-sm">

              {error}

            </div>

          )}



          {step === 1 && (

            <div className="space-y-4">

              <p className="text-sm text-secondary">

                Шаг 1 — зарегистрируйте партию как объект учёта ИЛС.

              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <label className="block sm:col-span-2">

                  <span className="text-xs text-muted">Номер партии *</span>

                  <input

                    className="input-field w-full mt-1 font-mono"

                    value={cargo.containerNumber}

                    onChange={(e) =>

                      setCargo({ ...cargo, containerNumber: e.target.value.toUpperCase() })

                    }

                    disabled={mode === 'track' && !!existingContainer}

                    placeholder="COAL-2026-0002"

                  />

                </label>

                <label className="block sm:col-span-2">

                  <span className="text-xs text-muted">Поставщик *</span>

                  <input

                    className="input-field w-full mt-1"

                    value={cargo.supplierName}

                    onChange={(e) => setCargo({ ...cargo, supplierName: e.target.value })}

                    placeholder="АО «Кузбассуголь»"

                  />

                </label>

                <label className="block">

                  <span className="text-xs text-muted">Масса, т</span>

                  <input

                    type="number"

                    className="input-field w-full mt-1"

                    value={cargo.quantityTons}

                    onChange={(e) => setCargo({ ...cargo, quantityTons: e.target.value })}

                  />

                </label>

                <label className="block">

                  <span className="text-xs text-muted">Категория</span>

                  <select

                    className="input-field w-full mt-1"

                    value={cargo.cargoCategory}

                    onChange={(e) => setCargo({ ...cargo, cargoCategory: e.target.value })}

                  >

                    <option value="COAL">Уголь</option>

                    <option value="OIL">Нефть</option>

                    <option value="PETROLEUM">Нефтепродукты</option>

                  </select>

                </label>

                <label className="block">

                  <span className="text-xs text-muted">Порт погрузки</span>

                  <input

                    className="input-field w-full mt-1 font-mono"

                    value={cargo.portOfLoading}

                    onChange={(e) =>

                      setCargo({ ...cargo, portOfLoading: e.target.value.toUpperCase() })

                    }

                  />

                </label>

                <label className="block">

                  <span className="text-xs text-muted">Порт назначения *</span>

                  <input

                    className="input-field w-full mt-1 font-mono"

                    value={cargo.portOfDischarge}

                    onChange={(e) =>

                      setCargo({ ...cargo, portOfDischarge: e.target.value.toUpperCase() })

                    }

                  />

                </label>

                <label className="block sm:col-span-2">

                  <span className="text-xs text-muted">Описание груза</span>

                  <input

                    className="input-field w-full mt-1"

                    value={cargo.cargoDescription}

                    onChange={(e) => setCargo({ ...cargo, cargoDescription: e.target.value })}

                  />

                </label>

              </div>

            </div>

          )}



          {step === 2 && (

            <div className="space-y-4">

              <p className="text-sm text-secondary">

                Шаг 2 — выберите готовый маршрут или создайте цепочку из 6 этапов экспорта.

              </p>

              <div className="flex gap-3">

                <button

                  type="button"

                  onClick={() => setRouteMode('existing')}

                  disabled={routes.length === 0}

                  className={`flex-1 p-3 rounded-lg border text-sm ${

                    routeMode === 'existing' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-default'

                  }`}

                >

                  Существующий маршрут

                </button>

                <button

                  type="button"

                  onClick={() => setRouteMode('new')}

                  className={`flex-1 p-3 rounded-lg border text-sm ${

                    routeMode === 'new' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-default'

                  }`}

                >

                  Новый по шаблону

                </button>

              </div>

              {routeMode === 'existing' ? (

                <select

                  className="input-field w-full"

                  value={existingRouteId}

                  onChange={(e) => setExistingRouteId(e.target.value)}

                >

                  <option value="">Выберите маршрут</option>

                  {routes.map((r) => (

                    <option key={r.id} value={r.id}>

                      {r.routeNumber} · {formatPortCode(r.origin)} → {formatPortCode(r.destination)}

                    </option>

                  ))}

                </select>

              ) : (

                <div className="p-4 rounded-lg border border-dashed border-default">

                  <p className="text-sm text-muted mb-3">

                    Будет создан маршрут с этапами (данные этапов уточняются на шаге 3):

                  </p>

                  <RouteTimeline stages={previewStages as RouteStage[]} compact />

                </div>

              )}

              {selectedRoute?.stages && routeMode === 'existing' && (

                <RouteTimeline stages={selectedRoute.stages} compact />

              )}

            </div>

          )}



          {step === 3 && (

            <div className="space-y-3">

              <p className="text-sm text-secondary mb-4">

                Шаг 3 — последовательно привяжите идентификаторы к каждому этапу цепочки.

              </p>

              {STAGE_FIELDS.map(({ stageType, title, field }) => (

                <div key={stageType} className="p-4 rounded-lg border border-default">

                  <p className="text-sm font-semibold text-primary mb-1">{title}</p>

                  <p className="text-xs text-muted mb-3">

                    {ROUTE_STAGE_TYPE_LABELS[stageType]}

                  </p>



                  {field === 'supplier' && (

                    <p className="text-sm text-secondary">

                      {cargo.supplierName} → {formatPortCode(cargo.portOfDischarge)}

                    </p>

                  )}



                  {field === 'rail' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {linkedWagon ? (
                        <p className="text-sm text-secondary sm:col-span-2">
                          Вагон №{linkedWagon.number}
                          {linkedWagon.trainNumber ? ` · поезд ${linkedWagon.trainNumber}` : ''}
                          <span className="block text-xs text-muted mt-1">
                            Вагон уже назначен партии и не может быть изменён
                          </span>
                        </p>
                      ) : (
                        <>
                      <select
                        className="input-field"
                        value={stages.wagonId}
                        onChange={(e) =>
                          setStages({ ...stages, wagonId: e.target.value, wagonNumber: '' })
                        }
                      >
                        <option value="">Выбрать свободный вагон или указать новый</option>
                        {availableWagons.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.number}
                            {w.trainNumber ? ` · поезд ${w.trainNumber}` : ''}
                          </option>
                        ))}
                      </select>
                      {!stages.wagonId && (
                        <input
                          className="input-field font-mono"
                          placeholder="№ нового вагона"
                          value={stages.wagonNumber}
                          onChange={(e) => setStages({ ...stages, wagonNumber: e.target.value })}
                        />
                      )}
                      <input
                        className="input-field sm:col-span-2"
                        placeholder="№ поезда (необязательно)"
                        value={stages.trainNumber}
                        onChange={(e) => setStages({ ...stages, trainNumber: e.target.value })}
                      />
                        </>
                      )}
                    </div>
                  )}



                  {field === 'warehouse' && (

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                      <select

                        className="input-field"

                        value={stages.warehouseId}

                        onChange={(e) => setStages({ ...stages, warehouseId: e.target.value })}

                      >

                        <option value="">Склад терминала</option>

                        {warehouses.map((w) => (

                          <option key={w.id} value={w.id}>

                            {formatWarehouseLabel(w)}

                          </option>

                        ))}

                      </select>

                      <input

                        className="input-field"

                        placeholder="Сектор / ячейка (A-3)"

                        value={stages.location}

                        onChange={(e) => setStages({ ...stages, location: e.target.value })}

                      />

                      <label className="sm:col-span-2 block">

                        <span className="text-xs text-muted">Плановая дата разгрузки</span>

                        <input

                          type="datetime-local"

                          className="input-field w-full mt-1"

                          value={stages.plannedWarehouseAt}

                          onChange={(e) =>

                            setStages({ ...stages, plannedWarehouseAt: e.target.value })

                          }

                        />

                      </label>

                    </div>

                  )}



                  {field === 'berth' && (

                    <p className="text-sm text-subtle">

                      Причал определяется судозаходом на следующем шаге.

                    </p>

                  )}



                  {field === 'ship' && (
                    lockedVesselCallId ? (
                      <p className="text-sm text-secondary">
                        {vesselCalls.find((v) => v.id === lockedVesselCallId)?.vessel.name ?? '—'}
                        {' · рейс '}
                        {vesselCalls.find((v) => v.id === lockedVesselCallId)?.voyageNumber ?? '—'}
                        <span className="block text-xs text-muted mt-1">
                          Судозаход уже назначен партии и не может быть изменён
                        </span>
                      </p>
                    ) : (
                    <select
                      className="input-field w-full"
                      value={stages.vesselCallId}
                      onChange={(e) => setStages({ ...stages, vesselCallId: e.target.value })}
                    >
                      <option value="">Планируемый судозаход</option>
                      {vesselCalls.map((vc) => (
                        <option key={vc.id} value={vc.id}>
                          {vc.vessel.name} · рейс {vc.voyageNumber}
                          {vc.berth ? ` · ${formatBerthLabel(vc.berth)}` : ''}
                        </option>
                      ))}
                    </select>
                    )
                  )}



                  {field === 'port' && (

                    <p className="text-sm text-secondary">{formatPortCode(cargo.portOfDischarge)}</p>

                  )}

                </div>

              ))}

            </div>

          )}



          {step === 4 && (

            <div className="space-y-4">

              <p className="text-sm text-secondary">

                Шаг 4 — проверьте данные и запустите отслеживание партии по маршруту.

              </p>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-default">

                <div className="flex items-center gap-3 mb-4">

                  <Package className="w-5 h-5 text-blue-500" />

                  <span className="font-mono font-bold">{cargo.containerNumber}</span>

                  <span className="text-sm text-muted">{cargo.supplierName}</span>

                </div>

                <RouteTimeline stages={previewStages as RouteStage[]} compact />

                <ul className="mt-4 space-y-1 text-sm text-secondary">

                  {stages.wagonId && (

                    <li>Вагон #{wagons.find((w) => w.id === Number(stages.wagonId))?.number}</li>

                  )}

                  {stages.wagonNumber && <li>Новый вагон {stages.wagonNumber}</li>}

                  {stages.warehouseId && (

                    <li>

                      Склад:{' '}
                      {formatWarehouseLabel(
                        warehouses.find((w) => w.id === Number(stages.warehouseId))
                      )}

                      {stages.location ? ` / ${stages.location}` : ''}

                    </li>

                  )}

                  {stages.vesselCallId && (

                    <li>

                      Судно:{' '}

                      {

                        vesselCalls.find((v) => v.id === Number(stages.vesselCallId))?.vessel

                          .name

                      }

                    </li>

                  )}

                </ul>

              </div>

              <label className="block">

                <span className="text-xs text-muted">Примечание к отслеживанию</span>

                <textarea

                  className="input-field w-full mt-1 min-h-[60px]"

                  value={stages.trackingNotes}

                  onChange={(e) => setStages({ ...stages, trackingNotes: e.target.value })}

                  placeholder="Например: ожидает погрузку на балкер"

                />

              </label>

            </div>

          )}

        </div>



        <div className="flex items-center justify-between px-6 py-4 border-t border-default shrink-0">

          <button

            type="button"

            onClick={step === 1 ? resetAndClose : goBack}

            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg border border-default hover-surface"

          >

            <ChevronLeft className="w-4 h-4" />

            {step === 1 ? 'Отмена' : 'Назад'}

          </button>

          {step < 4 ? (

            <button

              type="button"

              onClick={goNext}

              className="flex items-center gap-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"

            >

              Далее

              <ChevronRight className="w-4 h-4" />

            </button>

          ) : (

            <button

              type="button"

              onClick={handleSubmit}

              disabled={submitting}

              className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"

            >

              {submitting ? (

                <Loader2 className="w-4 h-4 animate-spin" />

              ) : (

                <Check className="w-4 h-4" />

              )}

              Запустить отслеживание

            </button>

          )}

        </div>

      </div>

    </div>

  );

}



export default CargoOnboardingWizard;


import type { CargoProfile } from '../../lib/buildCargoProfile';
import { CargoAccordionSection } from './CargoAccordionSection';
import { RouteTimeline } from './RouteTimeline';
import {
  MapPin,
  Train,
  Truck,
  Warehouse,
  Ship,
  Route,
  ArrowLeftRight,
} from 'lucide-react';

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2 py-1.5 border-b border-default last:border-0">
      <span className="text-xs text-muted sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-primary">{value}</span>
    </div>
  );
}

export function CargoDetailPanel({
  profile,
  onAdvance,
  advancing,
  onAddToRoute,
  addRouteId,
  onAddRouteIdChange,
}: {
  profile: CargoProfile;
  onAdvance?: (trackingId: number) => void;
  advancing?: number | null;
  onAddToRoute?: () => void;
  addRouteId?: string;
  onAddRouteIdChange?: (id: string) => void;
}) {
  const {
    container,
    wagons,
    truckVisits,
    vesselCall,
    warehouse,
    order,
    materialFlows,
    infoEvents,
    primaryTracking,
    stages,
    routes,
  } = profile;

  const supplierStage = stages.find((s) => s.stageType === 'SUPPLIER');
  const railStage = stages.find((s) => s.stageType === 'RAIL_STATION');
  const roadStage = stages.find((s) => s.stageType === 'ROAD_GATE');
  const warehouseStage = stages.find((s) => s.stageType === 'WAREHOUSE');
  const berthStage = stages.find((s) => s.stageType === 'BERTH');
  const shipStage = stages.find((s) => s.stageType === 'SHIP');
  const portStage = stages.find((s) => s.stageType === 'PORT');

  const currentStageType = primaryTracking?.currentStage?.stageType;
  const isSectionCurrent = (type: string) => currentStageType === type;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString('ru-RU') : undefined);

  const originSummary =
    container.supplierName || order?.origin || supplierStage?.locationName || 'Не указано';

  const wagonSummary = wagons.length ? wagons.map((w) => w.number).join(', ') : 'Не привязан';

  const truckSummary = truckVisits.length
    ? truckVisits.map((v) => v.truck?.licensePlate ?? `#${v.id}`).join(', ')
    : 'Не привязан';

  const warehouseSummary = warehouse
    ? `${warehouse.number}${container.location ? ` / ${container.location}` : ''}`
    : warehouseStage?.locationName ?? 'Не назначен';

  const vesselSummary = vesselCall
    ? `${vesselCall.vessel.name} · ${vesselCall.voyageNumber}`
    : shipStage?.locationName ?? 'Не назначено';

  const destinationSummary =
    container.portOfDischarge || portStage?.locationName || order?.destination || '—';

  return (
    <div className="space-y-3">
      {stages.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted uppercase mb-2">Цепочка экспорта</p>
          <RouteTimeline
            stages={stages}
            currentStageId={primaryTracking?.currentStageId}
            compact
          />
        </div>
      )}

      <CargoAccordionSection
        id="origin"
        title="Место отправки и маршрут"
        icon={MapPin}
        summary={`${originSummary} → ${destinationSummary}`}
        defaultOpen={isSectionCurrent('SUPPLIER') || !primaryTracking}
        highlight={isSectionCurrent('SUPPLIER')}
      >
        <Field label="Поставщик" value={container.supplierName ?? order?.supplierName} />
        <Field label="Место отгрузки" value={supplierStage?.locationName ?? order?.origin} />
        <Field label="Порт погрузки" value={container.portOfLoading} />
        <Field label="Порт назначения" value={container.portOfDischarge ?? order?.destination} />
        <Field label="Коносамент" value={container.blNumber} />
        {order && (
          <Field label="Логистический заказ" value={`${order.orderNumber} · ${order.status}`} />
        )}
        {primaryTracking?.route && (
          <Field
            label="Маршрут"
            value={`${primaryTracking.route.routeNumber}: ${primaryTracking.route.origin} → ${primaryTracking.route.destination}`}
          />
        )}
      </CargoAccordionSection>

      <CargoAccordionSection
        id="rail"
        title="Ж/д доставка в порт"
        icon={Train}
        summary={wagonSummary}
        defaultOpen={isSectionCurrent('RAIL_STATION')}
        highlight={isSectionCurrent('RAIL_STATION')}
      >
        {wagons.length === 0 ? (
          <p className="text-sm text-subtle">Вагон не привязан к партии</p>
        ) : (
          wagons.map((w) => (
            <div
              key={w.id}
              className="mb-3 last:mb-0 pb-3 last:pb-0 border-b border-default last:border-0"
            >
              <Field label="№ вагона" value={w.number} />
              <Field label="Поезд" value={w.trainNumber} />
              <Field label="Путь" value={w.track ?? railStage?.locationName} />
              <Field label="Прибытие" value={formatDate(w.arrivalAt)} />
              <Field
                label="План (этап)"
                value={formatDate(railStage?.plannedAt ?? railStage?.actualAt)}
              />
            </div>
          ))
        )}
      </CargoAccordionSection>

      <CargoAccordionSection
        id="road"
        title="Автодоставка на терминал"
        icon={Truck}
        summary={truckSummary}
        defaultOpen={isSectionCurrent('ROAD_GATE')}
        highlight={isSectionCurrent('ROAD_GATE')}
      >
        {truckVisits.length === 0 ? (
          <p className="text-sm text-subtle">Автотранспорт не привязан</p>
        ) : (
          truckVisits.map((v) => (
            <div key={v.id} className="mb-3 last:mb-0">
              <Field label="Госномер" value={v.truck?.licensePlate} />
              <Field label="Перевозчик" value={v.truck?.carrier} />
              <Field label="Водитель" value={v.truck?.driverName} />
              <Field label="Ворота / весовая" value={v.gateNumber ?? roadStage?.locationName} />
              <Field label="Время визита" value={formatDate(v.timeSlot)} />
              <Field label="Назначение" value={v.purpose} />
            </div>
          ))
        )}
      </CargoAccordionSection>

      <CargoAccordionSection
        id="warehouse"
        title="Склад терминала"
        icon={Warehouse}
        summary={warehouseSummary}
        defaultOpen={isSectionCurrent('WAREHOUSE')}
        highlight={isSectionCurrent('WAREHOUSE')}
      >
        <Field
          label="Склад"
          value={warehouse?.name ?? warehouse?.number ?? warehouseStage?.locationName}
        />
        <Field label="Сектор / ячейка" value={container.location} />
        <Field label="Плановая разгрузка" value={formatDate(warehouseStage?.plannedAt)} />
        <Field
          label="Фактическая разгрузка"
          value={formatDate(
            warehouseStage?.actualAt ??
              materialFlows.find((f) => f.flowType === 'STORAGE')?.performedAt
          )}
        />
        {warehouse && (
          <Field
            label="Загрузка склада"
            value={
              warehouse.capacity
                ? `${warehouse.load ?? 0} / ${warehouse.capacity} т`
                : undefined
            }
          />
        )}
      </CargoAccordionSection>

      <CargoAccordionSection
        id="vessel"
        title="Судно погрузки и порт назначения"
        icon={Ship}
        summary={vesselSummary}
        defaultOpen={isSectionCurrent('BERTH') || isSectionCurrent('SHIP')}
        highlight={isSectionCurrent('BERTH') || isSectionCurrent('SHIP')}
      >
        {vesselCall ? (
          <>
            <Field label="Судно" value={vesselCall.vessel.name} />
            <Field label="IMO" value={vesselCall.vessel.imoNumber} />
            <Field label="Рейс" value={vesselCall.voyageNumber} />
            <Field
              label="Причал"
              value={vesselCall.berth ? `№${vesselCall.berth.number}` : berthStage?.locationName}
            />
            <Field label="ETA (прибытие)" value={formatDate(vesselCall.eta)} />
            <Field label="ETD (отход)" value={formatDate(vesselCall.etd)} />
            <Field label="Агент" value={vesselCall.agent} />
            <Field label="Назначение рейса" value={vesselCall.purpose} />
          </>
        ) : (
          <>
            <Field label="Планируемое судно" value={shipStage?.locationName} />
            <Field label="Причал погрузки" value={berthStage?.locationName} />
            <Field label="План погрузки" value={formatDate(berthStage?.plannedAt)} />
            <p className="text-sm text-subtle mt-2">Судозаход ещё не привязан к партии</p>
          </>
        )}
        <Field label="Конечный порт" value={portStage?.locationName ?? container.portOfDischarge} />
      </CargoAccordionSection>

      {primaryTracking && (
        <CargoAccordionSection
          id="tracking"
          title="Отслеживание по этапам"
          icon={Route}
          summary={primaryTracking.currentStage?.locationName}
          defaultOpen
        >
          {stages.length > 0 && (
            <RouteTimeline stages={stages} currentStageId={primaryTracking.currentStageId} />
          )}
          {primaryTracking.events && primaryTracking.events.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-muted uppercase mb-2">История</p>
              <ul className="space-y-1">
                {primaryTracking.events.map((ev) => (
                  <li key={ev.id} className="text-sm text-secondary">
                    {formatDate(ev.eventAt)} — {ev.description || 'Смена этапа'}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {primaryTracking.status !== 'DELIVERED' && onAdvance && (
            <button
              type="button"
              onClick={() => onAdvance(primaryTracking.id)}
              disabled={advancing === primaryTracking.id}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {advancing === primaryTracking.id ? 'Обновление...' : 'Следующий этап маршрута'}
            </button>
          )}
        </CargoAccordionSection>
      )}

      {!primaryTracking && onAddToRoute && routes.length > 0 && (
        <div className="p-4 border border-dashed border-default rounded-lg">
          <p className="text-sm text-muted mb-3">Партия не на маршруте отслеживания</p>
          <div className="flex flex-wrap gap-2">
            <select
              value={addRouteId ?? ''}
              onChange={(e) => onAddRouteIdChange?.(e.target.value)}
              className="input-field flex-1 min-w-[200px]"
            >
              <option value="">Выберите маршрут</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.routeNumber} · {route.origin} → {route.destination}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onAddToRoute}
              disabled={!addRouteId}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
            >
              Поставить на отслеживание
            </button>
          </div>
        </div>
      )}

      {(materialFlows.length > 0 || infoEvents.length > 0) && (
        <CargoAccordionSection
          id="flows"
          title="Потоки и события по партии"
          icon={ArrowLeftRight}
          summary={`${materialFlows.length} мат. · ${infoEvents.length} инф.`}
        >
          {materialFlows.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-muted uppercase mb-2">Материальные потоки</p>
              {materialFlows.map((f) => (
                <div key={f.id} className="text-sm py-1 border-b border-default last:border-0">
                  {formatDate(f.performedAt)} — {f.description ?? f.flowType}: {f.fromLocation} →{' '}
                  {f.toLocation}
                  {f.quantity ? ` (${f.quantity} ${f.unit ?? 'т'})` : ''}
                </div>
              ))}
            </div>
          )}
          {infoEvents.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted uppercase mb-2">События ИЛС</p>
              {infoEvents.map((e) => (
                <div key={e.id} className="text-sm py-1 border-b border-default last:border-0">
                  {formatDate(e.createdAt)} — {e.message}
                </div>
              ))}
            </div>
          )}
        </CargoAccordionSection>
      )}
    </div>
  );
}

export default CargoDetailPanel;

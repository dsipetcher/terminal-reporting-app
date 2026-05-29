import type { CargoProfile } from '../../lib/buildCargoProfile';
import { CargoAccordionSection } from './CargoAccordionSection';
import { RouteTimeline } from './RouteTimeline';
import { EntityNavLink } from '../EntityNavLink';
import { entityLinks } from '../../lib/entityLinks';
import {
  MapPin,
  Train,
  Warehouse,
  Ship,
  Route,
  ArrowLeftRight,
} from 'lucide-react';
import {
  FIELD_LABELS,
  ORDER_STATUS_LABELS,
  MATERIAL_FLOW_TYPE_LABELS,
  formatPortCode,
  formatWarehouseLabel,
  formatBerthLabel,
} from '../../utils';
import type { RouteStage } from '../../types';

function Field({
  label,
  value,
  href,
}: {
  label: string;
  value?: string | null;
  href?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2 py-1.5 border-b border-default last:border-0">
      <span className="text-xs text-muted sm:w-40 shrink-0">{label}</span>
      {href ? (
        <EntityNavLink to={href} className="text-sm font-medium">
          {value}
        </EntityNavLink>
      ) : (
        <span className="text-sm text-primary">{value}</span>
      )}
    </div>
  );
}

function SectionFooterLink({ to, label }: { to: string; label: string }) {
  return (
    <div className="mt-3 pt-3 border-t border-default">
      <EntityNavLink to={to} className="text-sm font-medium">
        {label}
      </EntityNavLink>
    </div>
  );
}

export function CargoDetailPanel({
  profile,
  onAdvance,
  advancing,
  onOpenWizard,
}: {
  profile: CargoProfile;
  onAdvance?: (trackingId: number) => void;
  advancing?: number | null;
  onOpenWizard?: () => void;
}) {
  const {
    container,
    wagons,
    vesselCall,
    warehouse,
    order,
    materialFlows,
    infoEvents,
    primaryTracking,
    stages,
  } = profile;

  const supplierStage = stages.find((s) => s.stageType === 'SUPPLIER');
  const railStage = stages.find((s) => s.stageType === 'RAIL_STATION');
  const warehouseStage = stages.find((s) => s.stageType === 'WAREHOUSE');
  const berthStage = stages.find((s) => s.stageType === 'BERTH');
  const shipStage = stages.find((s) => s.stageType === 'SHIP');
  const portStage = stages.find((s) => s.stageType === 'PORT');

  const currentStageType = primaryTracking?.currentStage?.stageType;
  const isSectionCurrent = (type: string) => currentStageType === type;

  const formatDate = (d?: string) => (d ? new Date(d).toLocaleString('ru-RU') : undefined);

  const originSummary =
    container.supplierName || order?.origin || supplierStage?.locationName || 'Не указано';

  const isDelivered =
    container.status === 'DELIVERED' || primaryTracking?.status === 'DELIVERED';

  const wagonSummary = wagons.length
    ? wagons.map((w) => w.number).join(', ')
    : railStage?.locationName ?? (isDelivered ? 'Завершено' : 'Не привязан');

  const warehouseSummary = warehouse
    ? `${formatWarehouseLabel(warehouse)}${container.location ? ` / ${container.location}` : ''}`
    : warehouseStage?.locationName ?? 'Не назначен';

  const vesselSummary = vesselCall
    ? `${vesselCall.vessel.name} · ${vesselCall.voyageNumber}`
    : shipStage?.locationName ?? 'Не назначено';

  const destinationSummary =
    formatPortCode(container.portOfDischarge) ||
    portStage?.locationName ||
    formatPortCode(order?.destination) ||
    '—';

  const supplierHref = order?.counterpartyId
    ? entityLinks.counterparty(order.counterpartyId)
    : entityLinks.counterparties();

  const getStageHref = (stage: RouteStage): string | undefined => {
    switch (stage.stageType) {
      case 'SUPPLIER':
        return order?.id
          ? entityLinks.logisticsOrder(order.id)
          : order?.counterpartyId
            ? entityLinks.counterparty(order.counterpartyId)
            : entityLinks.counterparties();
      case 'RAIL_STATION':
        return wagons[0]?.trainConsistId
          ? entityLinks.trainConsist(wagons[0].trainConsistId)
          : wagons[0]
            ? entityLinks.wagon(wagons[0].id)
            : entityLinks.wagons();
      case 'WAREHOUSE':
        return warehouse ? entityLinks.warehouse(warehouse.id) : entityLinks.warehouses();
      case 'BERTH':
        return vesselCall?.berth?.id
          ? entityLinks.berth(vesselCall.berth.id)
          : entityLinks.berths();
      case 'SHIP':
        return vesselCall ? entityLinks.vesselCall(vesselCall.id) : undefined;
      case 'PORT':
        return container.portOfDischarge ? entityLinks.port(container.portOfDischarge) : undefined;
      default:
        return undefined;
    }
  };

  return (
    <div className="space-y-3">
      {stages.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted uppercase mb-2">Цепочка экспорта</p>
          <RouteTimeline
            stages={stages}
            currentStageId={primaryTracking?.currentStageId}
            compact
            getStageHref={getStageHref}
          />
          <p className="text-[10px] text-subtle mt-1.5">Нажмите на этап, чтобы перейти к сущности</p>
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
        <Field
          label="Поставщик"
          value={container.supplierName ?? order?.supplierName}
          href={supplierHref}
        />
        <Field label="Место отгрузки" value={supplierStage?.locationName ?? order?.origin} />
        <Field
          label="Порт погрузки"
          value={formatPortCode(container.portOfLoading)}
          href={container.portOfLoading ? entityLinks.port(container.portOfLoading) : undefined}
        />
        <Field
          label="Порт назначения"
          value={formatPortCode(container.portOfDischarge ?? order?.destination)}
          href={
            container.portOfDischarge ? entityLinks.port(container.portOfDischarge) : undefined
          }
        />
        <Field label="Коносамент" value={container.blNumber} />
        {order && (
          <Field
            label="Логистический заказ"
            value={`${order.orderNumber} · ${ORDER_STATUS_LABELS[order.status] ?? order.status}`}
            href={entityLinks.logisticsOrder(order.id)}
          />
        )}
        {primaryTracking?.route && (
          <Field
            label="Маршрут"
            value={`${primaryTracking.route.routeNumber}: ${formatPortCode(primaryTracking.route.origin)} → ${formatPortCode(primaryTracking.route.destination)}`}
          />
        )}
        {order && (
          <SectionFooterLink
            to={entityLinks.logisticsOrder(order.id)}
            label={`Открыть заказ ${order.orderNumber}`}
          />
        )}
      </CargoAccordionSection>

      <CargoAccordionSection
        id="rail"
        title="Вагоны"
        icon={Train}
        summary={wagonSummary}
        defaultOpen={isSectionCurrent('RAIL_STATION')}
        highlight={isSectionCurrent('RAIL_STATION')}
      >
        {wagons.length === 0 ? (
          isDelivered && railStage ? (
            <Field label="Ж/д этап (архив)" value={railStage.locationName} />
          ) : (
            <p className="text-sm text-subtle">Вагон не привязан к партии</p>
          )
        ) : (
          wagons.map((w) => (
            <div
              key={w.id}
              className="mb-3 last:mb-0 pb-3 last:pb-0 border-b border-default last:border-0"
            >
              <Field label="№ вагона" value={w.number} href={entityLinks.wagon(w.id)} />
              <Field label="Поезд" value={w.trainNumber} />
              <Field label="Путь" value={w.track ?? railStage?.locationName} />
              <Field label="Прибытие" value={formatDate(w.arrivalAt)} />
              <Field
                label="План (этап)"
                value={formatDate(railStage?.plannedAt ?? railStage?.actualAt)}
              />
              <SectionFooterLink
                to={entityLinks.wagon(w.id)}
                label={`Открыть вагон №${w.number}`}
              />
            </div>
          ))
        )}
        {wagons.length === 0 && !isDelivered && (
          <SectionFooterLink to={entityLinks.wagons()} label="Перейти к разделу «Вагоны»" />
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
          value={
            formatWarehouseLabel(warehouse) !== '—'
              ? formatWarehouseLabel(warehouse)
              : warehouseStage?.locationName
          }
          href={warehouse ? entityLinks.warehouse(warehouse.id) : entityLinks.warehouses()}
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
        {warehouse && (
          <SectionFooterLink
            to={entityLinks.warehouse(warehouse.id)}
            label={`Открыть ${formatWarehouseLabel(warehouse)}`}
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
            <Field
              label="Судно"
              value={vesselCall.vessel.name}
              href={entityLinks.vessel(vesselCall.vessel.id)}
            />
            <Field label={FIELD_LABELS.IMO} value={vesselCall.vessel.imoNumber} />
            <Field
              label="Рейс"
              value={vesselCall.voyageNumber}
              href={entityLinks.vesselCall(vesselCall.id)}
            />
            <Field
              label="Причал"
              value={
              vesselCall.berth
                ? formatBerthLabel(vesselCall.berth)
                : berthStage?.locationName
            }
              href={
                vesselCall.berth?.id ? entityLinks.berth(vesselCall.berth.id) : entityLinks.berths()
              }
            />
            <Field label={FIELD_LABELS.ETA} value={formatDate(vesselCall.eta)} />
            <Field label={FIELD_LABELS.ETD} value={formatDate(vesselCall.etd)} />
            <Field label="Агент" value={vesselCall.agent} />
            <Field label="Назначение рейса" value={vesselCall.purpose} />
            <SectionFooterLink
              to={entityLinks.vesselCall(vesselCall.id)}
              label={`Открыть судозаход · рейс ${vesselCall.voyageNumber}`}
            />
          </>
        ) : isDelivered && shipStage ? (
          <>
            <Field label="Судно (архив)" value={shipStage.locationName} />
            <Field label="Причал погрузки" value={berthStage?.locationName} />
          </>
        ) : (
          <>
            <Field label="Планируемое судно" value={shipStage?.locationName} />
            <Field
              label="Причал погрузки"
              value={berthStage?.locationName}
              href={entityLinks.berths()}
            />
            <Field label="План погрузки" value={formatDate(berthStage?.plannedAt)} />
            <p className="text-sm text-subtle mt-2">Судозаход ещё не привязан к партии</p>
            <SectionFooterLink to={entityLinks.vessels()} label="Перейти к судозаходам" />
          </>
        )}
        <Field
          label="Конечный порт"
          value={portStage?.locationName ?? formatPortCode(container.portOfDischarge)}
          href={
            container.portOfDischarge ? entityLinks.port(container.portOfDischarge) : undefined
          }
        />
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
            <RouteTimeline
              stages={stages}
              currentStageId={primaryTracking.currentStageId}
              getStageHref={getStageHref}
            />
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

      {!primaryTracking && onOpenWizard && (
        <div className="p-5 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-center">
          <p className="text-sm text-secondary mb-3">
            Партия ещё не на маршруте отслеживания. Пройдите пошаговый мастер: партия → маршрут →
            этапы → запуск.
          </p>
          <button
            type="button"
            onClick={onOpenWizard}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Поставить на отслеживание
          </button>
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
                  {formatDate(f.performedAt)} —{' '}
                  {f.description ?? MATERIAL_FLOW_TYPE_LABELS[f.flowType] ?? f.flowType}:{' '}
                  {f.fromLocation} → {f.toLocation}
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
          <SectionFooterLink to={entityLinks.flows()} label="Открыть журнал потоков" />
        </CargoAccordionSection>
      )}
    </div>
  );
}

export default CargoDetailPanel;

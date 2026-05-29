import { useEffect, useState } from 'react';
import {
  Train,
  MapPin,
  PackageOpen,
  Route,
  LogOut,
  Check,
  Warehouse,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { trainConsistsApi, wagonsApi } from '../../api';
import type { TrainConsist, Wagon } from '../../types';
import { Card } from '../Card';
import { StatusBadge } from '../StatusBadge';
import { LoadingSpinner } from '../LoadingSpinner';
import {
  formatDateTime,
  TRAIN_CONSIST_STATUS_LABELS,
} from '../../utils';
import { useEntityHighlight } from '../../hooks/useEntityHighlight';
import { entityDomId } from '../../lib/entityLinks';

const INBOUND_STEPS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'EN_ROUTE', label: 'В пути', Icon: Train },
  { key: 'ARRIVED', label: 'Прибыл', Icon: MapPin },
  { key: 'UNLOADING', label: 'Разгрузка', Icon: PackageOpen },
];

const OUTBOUND_STEPS: { key: string; label: string; Icon: LucideIcon }[] = [
  { key: 'FORMING', label: 'Формирование', Icon: Route },
  { key: 'DEPARTED', label: 'Убыл', Icon: LogOut },
];

function ConsistStatusStepper({
  steps,
  currentStatus,
}: {
  steps: { key: string; label: string; Icon: LucideIcon }[];
  currentStatus: string;
}) {
  const currentIdx = steps.findIndex((s) => s.key === currentStatus);
  const safeIdx = currentIdx === -1 ? 0 : currentIdx;
  const lineInset = steps.length > 1 ? `${100 / steps.length / 2}%` : '50%';

  return (
    <div className="mb-4 px-1">
      <div className="relative flex w-full">
        {steps.length > 1 && (
          <div
            className="absolute top-[1.125rem] h-px bg-slate-200 dark:bg-slate-700"
            style={{ left: lineInset, right: lineInset }}
            aria-hidden
          />
        )}
        {steps.map((step, index) => {
          const done = index < safeIdx;
          const current = index === safeIdx;
          const Icon = step.Icon;

          return (
            <div
              key={step.key}
              className="relative z-[1] flex min-w-0 flex-1 flex-col items-center"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  done
                    ? 'border-green-500 bg-green-100 text-green-700 dark:border-green-600 dark:bg-green-900/50 dark:text-green-300'
                    : current
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500'
                }`}
              >
                {done ? (
                  <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
                ) : (
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                )}
              </div>
              <span
                className={`mt-2 flex min-h-[2rem] w-full items-start justify-center px-0.5 text-center text-[10px] leading-tight sm:text-xs ${
                  current
                    ? 'font-semibold text-primary'
                    : done
                      ? 'font-medium text-green-700 dark:text-green-400'
                      : 'text-subtle'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function inboundNextAction(status: string): { label: string; next: string } | null {
  switch (status) {
    case 'EN_ROUTE':
      return { label: 'Прибыл', next: 'ARRIVED' };
    case 'ARRIVED':
      return { label: 'Разгрузка', next: 'UNLOADING' };
    default:
      return null;
  }
}

export function TrainConsistsPanel() {
  const [inboundConsists, setInboundConsists] = useState<TrainConsist[]>([]);
  const [outboundConsists, setOutboundConsists] = useState<TrainConsist[]>([]);
  const [parkWagons, setParkWagons] = useState<Wagon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWagonIds, setSelectedWagonIds] = useState<number[]>([]);
  const [outboundTrainNumber, setOutboundTrainNumber] = useState('');
  const [outboundDestination, setOutboundDestination] = useState('');
  const [outboundTrack, setOutboundTrack] = useState('');
  const [forming, setForming] = useState(false);

  const allConsistIds = [...inboundConsists, ...outboundConsists].map((c) => c.id);
  const { highlightClass } = useEntityHighlight(allConsistIds);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inbound, outbound, park] = await Promise.all([
        trainConsistsApi.getAll({ direction: 'INBOUND' }),
        trainConsistsApi.getAll({ direction: 'OUTBOUND' }),
        wagonsApi.getAll({ inParkWithoutConsist: true }),
      ]);
      setInboundConsists(inbound);
      setOutboundConsists(outbound);
      setParkWagons(park);
      setSelectedWagonIds((prev) => prev.filter((id) => park.some((w) => w.id === id)));
    } catch (error) {
      console.error('Error loading train consists:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateInboundStatus = async (id: number, status: string) => {
    try {
      await trainConsistsApi.updateStatus(id, status);
      loadData();
    } catch (error) {
      console.error('Error updating consist status:', error);
      alert('Ошибка при обновлении статуса состава');
    }
  };

  const disbandConsist = async (id: number) => {
    if (
      !confirm(
        'Отправить вагоны в парк? Состав будет расформирован и удалён, вагоны останутся без состава.'
      )
    ) {
      return;
    }
    try {
      await trainConsistsApi.disband(id);
      loadData();
    } catch (error) {
      console.error('Error disbanding consist:', error);
      alert('Не удалось расформировать состав');
    }
  };

  const departOutbound = async (id: number) => {
    if (
      !confirm('Отметить состав как убывший? Состав и вагоны будут удалены из базы.')
    ) {
      return;
    }
    try {
      await trainConsistsApi.updateStatus(id, 'DEPARTED');
      loadData();
    } catch (error) {
      console.error('Error departing consist:', error);
      alert('Ошибка при отправке состава');
    }
  };

  const toggleWagon = (id: number) => {
    setSelectedWagonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createOutboundConsist = async () => {
    const trainNumber = outboundTrainNumber.trim();
    const destination = outboundDestination.trim();
    if (!trainNumber || !destination) {
      alert('Укажите номер состава и пункт назначения');
      return;
    }
    if (!selectedWagonIds.length) {
      alert('Выберите хотя бы один вагон из парка');
      return;
    }
    try {
      setForming(true);
      await trainConsistsApi.createOutbound({
        trainNumber,
        destination,
        track: outboundTrack.trim() || undefined,
        wagonIds: selectedWagonIds,
      });
      setOutboundTrainNumber('');
      setOutboundDestination('');
      setOutboundTrack('');
      setSelectedWagonIds([]);
      loadData();
    } catch (error) {
      console.error('Error creating outbound consist:', error);
      alert('Не удалось сформировать исходящий состав');
    } finally {
      setForming(false);
    }
  };

  const renderConsistCard = (
    consist: TrainConsist,
    steps: { key: string; label: string; Icon: LucideIcon }[],
    actions: React.ReactNode
  ) => (
    <Card
      key={consist.id}
      id={entityDomId(consist.id)}
      className={`mb-4 ${highlightClass(consist.id)}`}
    >
      <div className="flex justify-between items-start gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-primary">Состав №{consist.trainNumber}</h3>
          <p className="text-sm text-subtle">
            {consist.direction === 'OUTBOUND' ? 'Исходящий' : 'Входящий'}
            {consist.origin ? ` · от ${consist.origin}` : ''}
          </p>
        </div>
        <div className="shrink-0 flex items-center">
          <StatusBadge
            status={consist.status}
            label={TRAIN_CONSIST_STATUS_LABELS[consist.status]}
          />
        </div>
      </div>

      <ConsistStatusStepper steps={steps} currentStatus={consist.status} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
        <div>
          <p className="text-xs text-subtle">Путь</p>
          <p className="font-medium">{consist.track ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-subtle">
            {consist.direction === 'OUTBOUND' ? 'Сформирован' : 'Прибытие'}
          </p>
          <p className="font-medium">
            {formatDateTime(consist.formedAt ?? consist.arrivalAt)}
          </p>
        </div>
        <div>
          <p className="text-xs text-subtle">Назначение</p>
          <p className="font-medium">{consist.destination ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-subtle">Вагонов</p>
          <p className="font-medium">{consist._count?.wagons ?? consist.wagons?.length ?? 0}</p>
        </div>
      </div>

      {consist.wagons && consist.wagons.length > 0 && (
        <div className="mb-4 text-sm">
          <p className="text-xs text-subtle mb-1">Вагоны в составе</p>
          <p className="font-medium">{consist.wagons.map((w) => w.number).join(', ')}</p>
        </div>
      )}

      {actions}
    </Card>
  );

  if (loading) {
    return <LoadingSpinner text="Загрузка составов..." />;
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          <Train className="h-5 w-5" aria-hidden />
          Входящие составы
        </h2>
        {inboundConsists.length === 0 ? (
          <Card>
            <p className="text-subtle">Активных входящих составов нет</p>
          </Card>
        ) : (
          inboundConsists.map((consist) => {
            const action = inboundNextAction(consist.status);
            return renderConsistCard(
              consist,
              INBOUND_STEPS,
              <div className="flex gap-2 flex-wrap items-center">
                {action && (
                  <button
                    type="button"
                    onClick={() => updateInboundStatus(consist.id, action.next)}
                    className="px-3 py-1.5 text-sm text-white rounded bg-blue-500 hover:bg-blue-600 transition-colors"
                  >
                    {action.label}
                  </button>
                )}
                {consist.status === 'UNLOADING' && (
                  <button
                    type="button"
                    onClick={() => disbandConsist(consist.id)}
                    className="px-3 py-1.5 text-sm text-white rounded bg-indigo-600 hover:bg-indigo-500 transition-colors"
                  >
                    Отправить в парк
                  </button>
                )}
              </div>
            );
          })
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          <Warehouse className="h-5 w-5" aria-hidden />
          Вагоны в парке
        </h2>
        <Card className="mb-4">
          {parkWagons.length === 0 ? (
            <p className="text-subtle">Нет вагонов в парке без состава</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-subtle mb-3">
                Выберите вагоны для формирования исходящего состава
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {parkWagons.map((wagon) => (
                  <label
                    key={wagon.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      selectedWagonIds.includes(wagon.id)
                        ? 'border-indigo-500 bg-indigo-50/80 dark:border-indigo-600 dark:bg-indigo-950/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedWagonIds.includes(wagon.id)}
                      onChange={() => toggleWagon(wagon.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-primary">{wagon.number}</p>
                      <p className="text-xs text-subtle">
                        {wagon.track ? `Путь ${wagon.track}` : 'Путь не указан'}
                        {wagon.trainNumber ? ` · ${wagon.trainNumber}` : ''}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
            <p className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" aria-hidden />
              Сформировать исходящий состав
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label-field">Номер состава</label>
                <input
                  value={outboundTrainNumber}
                  onChange={(e) => setOutboundTrainNumber(e.target.value)}
                  className="input-field"
                  placeholder="Например, 2847"
                />
              </div>
              <div>
                <label className="label-field">Пункт назначения</label>
                <input
                  value={outboundDestination}
                  onChange={(e) => setOutboundDestination(e.target.value)}
                  className="input-field"
                  placeholder="Станция или регион"
                />
              </div>
              <div>
                <label className="label-field">Путь (необязательно)</label>
                <input
                  value={outboundTrack}
                  onChange={(e) => setOutboundTrack(e.target.value)}
                  className="input-field"
                  placeholder="№ пути"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={createOutboundConsist}
                  disabled={
                    forming ||
                    !selectedWagonIds.length ||
                    !outboundTrainNumber.trim() ||
                    !outboundDestination.trim()
                  }
                  className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {forming ? 'Формирование…' : `Сформировать (${selectedWagonIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          <Route className="h-5 w-5" aria-hidden />
          Исходящие составы
        </h2>
        {outboundConsists.length === 0 ? (
          <Card>
            <p className="text-subtle">Исходящих составов в формировании нет</p>
          </Card>
        ) : (
          outboundConsists.map((consist) =>
            renderConsistCard(
              consist,
              OUTBOUND_STEPS,
              consist.status === 'FORMING' ? (
                <button
                  type="button"
                  onClick={() => departOutbound(consist.id)}
                  className="px-3 py-1.5 text-sm text-white rounded bg-gray-500 hover:bg-gray-600 transition-colors"
                >
                  Убыл
                </button>
              ) : null
            )
          )
        )}
      </section>
    </div>
  );
}

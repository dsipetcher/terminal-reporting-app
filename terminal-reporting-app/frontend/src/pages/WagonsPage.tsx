import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { wagonsApi, warehousesApi, containersApi } from '../api';
import type { Wagon, Warehouse, Container } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EntityActions } from '../components/EntityActions';
import { TrainConsistsPanel } from '../components/wagons/TrainConsistsPanel';
import { useEntityHighlight } from '../hooks/useEntityHighlight';
import { entityDomId, entityLinks } from '../lib/entityLinks';
import {
  formatDateTime,
  WAGON_TYPE_LABELS,
  WAGON_STATUS_LABELS,
  toDateTimeLocal,
  fromDateTimeLocal,
  formatWarehouseLabel,
  validateWagonContainerAssignment,
  findWagonByContainerId,
} from '../utils';

type WagonsTab = 'consists' | 'wagons';

const emptyForm = {
  number: '',
  wagonType: 'PLATFORM',
  cargo: '',
  cargoWeight: '',
  warehouseId: '',
  track: '',
  trainNumber: '',
  arrivalAt: null as Date | null,
  containerId: '',
};

export default function WagonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: WagonsTab = searchParams.get('tab') === 'wagons' ? 'wagons' : 'consists';

  const [wagons, setWagons] = useState<Wagon[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === 'wagons') {
      loadData();
    } else {
      setLoading(false);
    }
  }, [tab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [wagonsData, warehousesData, containersData] = await Promise.all([
        wagonsApi.getAll(),
        warehousesApi.getAll(),
        containersApi.getAll(),
      ]);
      setWagons(wagonsData);
      setWarehouses(warehousesData);
      setContainers(containersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (wagon: Wagon) => {
    setEditingId(wagon.id);
    setForm({
      number: wagon.number,
      wagonType: wagon.wagonType,
      cargo: wagon.cargo ?? '',
      cargoWeight: wagon.cargoWeight?.toString() ?? '',
      warehouseId: wagon.warehouseId ? String(wagon.warehouseId) : '',
      track: wagon.track ?? '',
      trainNumber: wagon.trainNumber ?? '',
      arrivalAt: new Date(wagon.arrivalAt),
      containerId: wagon.containerId ? String(wagon.containerId) : '',
    });
    setShowForm(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.arrivalAt) {
      alert('Укажите дату прибытия');
      return;
    }

    const payload = {
      number: form.number,
      wagonType: form.wagonType as Wagon['wagonType'],
      cargo: form.cargo || undefined,
      cargoWeight: form.cargoWeight ? parseFloat(form.cargoWeight) : undefined,
      warehouseId: form.warehouseId ? Number(form.warehouseId) : null,
      track: form.track || undefined,
      trainNumber: form.trainNumber || undefined,
      arrivalAt: form.arrivalAt.toISOString(),
      containerId: form.containerId ? Number(form.containerId) : null,
    };

    if (payload.containerId) {
      const err = validateWagonContainerAssignment(
        wagons,
        payload.containerId,
        editingId ?? undefined
      );
      if (err) {
        alert(err);
        return;
      }
    }

    try {
      if (editingId) {
        await wagonsApi.update(editingId, payload as Partial<Wagon>);
      } else {
        await wagonsApi.create({ ...payload, status: 'EN_ROUTE' as Wagon['status'] } as Partial<Wagon>);
      }
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving wagon:', error);
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (error instanceof Error ? error.message : '') ||
        (editingId ? 'Ошибка при обновлении вагона' : 'Ошибка при создании вагона');
      alert(message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить вагон?')) return;

    try {
      await wagonsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting wagon:', error);
      alert('Не удалось удалить вагон.');
    }
  };

  const { highlightClass } = useEntityHighlight(wagons.map((w) => w.id));

  const filteredWagons =
    selectedStatus === 'ALL'
      ? wagons
      : wagons.filter((w) => w.status === selectedStatus);

  const availableContainers = containers.filter((c) => {
    const assigned = findWagonByContainerId(wagons, c.id);
    if (!assigned) return true;
    return editingId != null && assigned.id === editingId;
  });

  if (loading && tab === 'wagons') {
    return <LoadingSpinner text="Загрузка вагонов..." />;
  }

  return (
    <div>
      <PageHeader
        title="Ж/д транспорт"
        subtitle={
          tab === 'consists'
            ? 'Составы: прибытие → разгрузка → парк → формирование → убытие'
            : 'Вагоны в составах для сопоставления с партиями груза'
        }
        action={
          tab === 'wagons' ? (
            <button
              onClick={() => {
                if (showForm && !editingId) resetForm();
                else { setEditingId(null); setForm(emptyForm); setShowForm(!showForm); }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? 'Отменить' : '+ Новый вагон'}
            </button>
          ) : undefined
        }
      />

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'consists' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'consists' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700'
          }`}
        >
          Составы
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'wagons' })}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'wagons' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700'
          }`}
        >
          Вагоны
        </button>
      </div>

      {tab === 'consists' ? (
        <TrainConsistsPanel />
      ) : (
        <>
      {showForm && (
        <div ref={formRef}>
        <Card className="mb-6" title={editingId ? 'Редактирование вагона' : 'Новый вагон'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Номер вагона *</label>
              <input type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="input-field" required />
            </div>

            <div>
              <label className="label-field">Тип вагона *</label>
              <select value={form.wagonType} onChange={(e) => setForm({ ...form, wagonType: e.target.value })} className="input-field" required>
                {Object.entries(WAGON_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Груз</label>
              <input type="text" value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label-field">Вес груза (тонн)</label>
              <input type="number" step="0.1" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label-field">Номер поезда</label>
              <input type="text" value={form.trainNumber} onChange={(e) => setForm({ ...form, trainNumber: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label-field">Путь</label>
              <input type="text" value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label-field">Дата прибытия *</label>
              <input type="datetime-local" value={toDateTimeLocal(form.arrivalAt)} onChange={(e) => setForm({ ...form, arrivalAt: fromDateTimeLocal(e.target.value) })} className="input-field" required />
            </div>

            <div>
              <label className="label-field">Склад</label>
              <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className="input-field">
                <option value="">Не выбран</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{formatWarehouseLabel(w)}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label-field">Партия груза</label>
              <select value={form.containerId} onChange={(e) => setForm({ ...form, containerId: e.target.value })} className="input-field">
                <option value="">Не выбран</option>
                {availableContainers.map((c) => (
                  <option key={c.id} value={c.id}>{c.containerNumber}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editingId ? 'Сохранить' : 'Создать вагон'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">
                Отмена
              </button>
            </div>
          </form>
        </Card>
        </div>
      )}

      <div className="mb-6">
        <label className="label-field">Фильтр по статусу:</label>
        <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="border border-slate-600 rounded-lg px-4 py-2">
          <option value="ALL">Все статусы</option>
          {Object.entries(WAGON_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {filteredWagons.length === 0 ? (
          <Card><p className="text-center text-subtle py-8">Нет вагонов</p></Card>
        ) : (
          filteredWagons.map((wagon) => (
            <Card
              key={wagon.id}
              id={entityDomId(wagon.id)}
              className={`hover:shadow-lg transition-shadow ${highlightClass(wagon.id)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-primary">Вагон №{wagon.number}</h3>
                  <p className="text-sm text-muted">Тип: {WAGON_TYPE_LABELS[wagon.wagonType]}</p>
                  {wagon.trainConsist && (
                    <p className="text-sm text-muted">
                      Состав:{' '}
                      <Link to={entityLinks.trainConsist(wagon.trainConsist.id)} className="text-blue-500 hover:underline">
                        №{wagon.trainConsist.trainNumber}
                      </Link>
                    </p>
                  )}
                  {wagon.trainNumber && !wagon.trainConsist && (
                    <p className="text-sm text-muted">Поезд: {wagon.trainNumber}</p>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <StatusBadge status={wagon.status} label={WAGON_STATUS_LABELS[wagon.status]} />
                  {wagon.status !== 'DEPARTED' && (
                    <EntityActions onEdit={() => startEdit(wagon)} onDelete={() => handleDelete(wagon.id)} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-subtle">Прибытие</p>
                  <p className="font-medium">{formatDateTime(wagon.arrivalAt)}</p>
                </div>
                {wagon.departureAt && (
                  <div>
                    <p className="text-xs text-subtle">Убытие</p>
                    <p className="font-medium">{formatDateTime(wagon.departureAt)}</p>
                  </div>
                )}
                {wagon.cargo && (
                  <div>
                    <p className="text-xs text-subtle">Груз</p>
                    <p className="font-medium">{wagon.cargo}</p>
                  </div>
                )}
                {wagon.cargoWeight && (
                  <div>
                    <p className="text-xs text-subtle">Вес груза</p>
                    <p className="font-medium">{wagon.cargoWeight} т</p>
                  </div>
                )}
                {wagon.track && (
                  <div>
                    <p className="text-xs text-subtle">Путь</p>
                    <p className="font-medium">{wagon.track}</p>
                  </div>
                )}
                {wagon.warehouse && (
                  <div>
                    <p className="text-xs text-subtle">Склад</p>
                    <p className="font-medium">{formatWarehouseLabel(wagon.warehouse)}</p>
                  </div>
                )}
                {wagon.container && (
                  <div>
                    <p className="text-xs text-subtle">Партия</p>
                    <p className="font-medium">{wagon.container.containerNumber}</p>
                  </div>
                )}
              </div>

              {wagon.trainConsistId && (
                <p className="text-xs text-subtle">
                  Статус вагона синхронизирован с составом — управление на вкладке «Составы».
                </p>
              )}
            </Card>
          ))
        )}
      </div>
        </>
      )}
    </div>
  );
}

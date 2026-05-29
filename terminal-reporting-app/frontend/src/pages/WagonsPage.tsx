import { useEffect, useState } from 'react';
import { wagonsApi, warehousesApi, containersApi } from '../api';
import type { Wagon, Warehouse, Container } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  formatDateTime,
  WAGON_TYPE_LABELS,
  WAGON_STATUS_LABELS,
  toDateTimeLocal,
  fromDateTimeLocal,
} from '../utils';

export default function WagonsPage() {
  const [wagons, setWagons] = useState<Wagon[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    number: '',
    wagonType: 'PLATFORM',
    cargo: '',
    cargoWeight: '',
    warehouseId: '',
    track: '',
    trainNumber: '',
    arrivalAt: null as Date | null,
    containerId: '',
  });

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.arrivalAt) {
      alert('Укажите дату прибытия');
      return;
    }

    try {
      await wagonsApi.create({
        number: form.number,
        wagonType: form.wagonType as any,
        cargo: form.cargo || undefined,
        cargoWeight: form.cargoWeight ? parseFloat(form.cargoWeight) : undefined,
        warehouseId: form.warehouseId ? Number(form.warehouseId) : undefined,
        track: form.track || undefined,
        trainNumber: form.trainNumber || undefined,
        arrivalAt: form.arrivalAt.toISOString(),
        containerId: form.containerId ? Number(form.containerId) : undefined,
        status: 'EXPECTED' as any,
      });

      setForm({
        number: '',
        wagonType: 'PLATFORM',
        cargo: '',
        cargoWeight: '',
        warehouseId: '',
        track: '',
        trainNumber: '',
        arrivalAt: null,
        containerId: '',
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating wagon:', error);
      alert('Ошибка при создании вагона');
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await wagonsApi.updateStatus(id, newStatus);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const filteredWagons = selectedStatus === 'ALL'
    ? wagons
    : wagons.filter(w => w.status === selectedStatus);

  if (loading) {
    return <LoadingSpinner text="Загрузка вагонов..." />;
  }

  return (
    <div>
      <PageHeader
        title="Учет вагонов"
        subtitle={`Всего: ${wagons.length} вагонов`}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Отменить' : '+ Новый вагон'}
          </button>
        }
      />

      {/* Форма добавления */}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">
                Номер вагона *
              </label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">
                Тип вагона *
              </label>
              <select
                value={form.wagonType}
                onChange={(e) => setForm({ ...form, wagonType: e.target.value })}
                className="input-field"
                required
              >
                {Object.entries(WAGON_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">
                Груз
              </label>
              <input
                type="text"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">
                Вес груза (тонн)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.cargoWeight}
                onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">
                Номер поезда
              </label>
              <input
                type="text"
                value={form.trainNumber}
                onChange={(e) => setForm({ ...form, trainNumber: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">
                Путь
              </label>
              <input
                type="text"
                value={form.track}
                onChange={(e) => setForm({ ...form, track: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">
                Дата прибытия *
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.arrivalAt)}
                onChange={(e) => setForm({ ...form, arrivalAt: fromDateTimeLocal(e.target.value) })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">
                Склад
              </label>
              <select
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                className="input-field"
              >
                <option value="">Не выбран</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.number} {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label-field">
                Контейнер
              </label>
              <select
                value={form.containerId}
                onChange={(e) => setForm({ ...form, containerId: e.target.value })}
                className="input-field"
              >
                <option value="">Не выбран</option>
                {containers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.containerNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Создать вагон
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Фильтр по статусу */}
      <div className="mb-6">
        <label className="label-field">
          Фильтр по статусу:
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border border-slate-600 rounded-lg px-4 py-2"
        >
          <option value="ALL">Все статусы</option>
          {Object.entries(WAGON_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Список вагонов */}
      <div className="space-y-4">
        {filteredWagons.length === 0 ? (
          <Card>
            <p className="text-center text-subtle py-8">Нет вагонов</p>
          </Card>
        ) : (
          filteredWagons.map((wagon) => (
            <Card key={wagon.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-primary">Вагон №{wagon.number}</h3>
                  <p className="text-sm text-muted">
                    Тип: {WAGON_TYPE_LABELS[wagon.wagonType]}
                  </p>
                  {wagon.trainNumber && (
                    <p className="text-sm text-muted">Поезд: {wagon.trainNumber}</p>
                  )}
                </div>
                <StatusBadge
                  status={wagon.status}
                  label={WAGON_STATUS_LABELS[wagon.status]}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-subtle">Прибытие</p>
                  <p className="font-medium">{formatDateTime(wagon.arrivalAt)}</p>
                </div>
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
                    <p className="font-medium">{wagon.warehouse.number}</p>
                  </div>
                )}
                {wagon.container && (
                  <div>
                    <p className="text-xs text-subtle">Контейнер</p>
                    <p className="font-medium">{wagon.container.containerNumber}</p>
                  </div>
                )}
              </div>

              {/* Кнопки управления статусом */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => updateStatus(wagon.id, 'ARRIVED')}
                  disabled={wagon.status !== 'EXPECTED'}
                  className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Прибыл
                </button>
                <button
                  onClick={() => updateStatus(wagon.id, 'UNLOADING')}
                  disabled={wagon.status !== 'ARRIVED'}
                  className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Выгрузка
                </button>
                <button
                  onClick={() => updateStatus(wagon.id, 'LOADING')}
                  disabled={wagon.status !== 'UNLOADING'}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Погрузка
                </button>
                <button
                  onClick={() => updateStatus(wagon.id, 'DEPARTED')}
                  disabled={!['LOADING', 'ARRIVED'].includes(wagon.status)}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Убыл
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

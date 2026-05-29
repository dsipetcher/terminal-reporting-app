import React, { useEffect, useState } from 'react';
import { trucksApi, truckVisitsApi, containersApi } from '../api';
import type { Truck, TruckVisit, Container } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EntityActions } from '../components/EntityActions';
import {
  formatDateTime,
  TRUCK_TYPE_LABELS,
  TRUCK_VISIT_STATUS_LABELS,
  toDateTimeLocal,
  fromDateTimeLocal,
} from '../utils';

const emptyTruckForm = {
  licensePlate: '',
  truckType: 'CONTAINER_TRUCK',
  carrier: '',
  driverName: '',
  driverDocument: '',
};

const emptyVisitForm = {
  truckId: '',
  timeSlot: null as Date | null,
  purpose: '',
  gateNumber: '',
  containerId: '',
};

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [visits, setVisits] = useState<TruckVisit[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [editingTruckId, setEditingTruckId] = useState<number | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<number | null>(null);
  const [visitDateFilter, setVisitDateFilter] = useState('');
  const [truckForm, setTruckForm] = useState(emptyTruckForm);
  const [visitForm, setVisitForm] = useState(emptyVisitForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const visitParams = visitDateFilter ? { date: visitDateFilter } : undefined;
      const [trucksData, visitsData, containersData] = await Promise.all([
        trucksApi.getAll(),
        truckVisitsApi.getAll(visitParams),
        containersApi.getAll(),
      ]);
      setTrucks(trucksData);
      setVisits(visitsData);
      setContainers(containersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetTruckForm = () => {
    setTruckForm(emptyTruckForm);
    setEditingTruckId(null);
    setShowTruckForm(false);
  };

  const resetVisitForm = () => {
    setVisitForm(emptyVisitForm);
    setEditingVisitId(null);
    setShowVisitForm(false);
  };

  const startEditTruck = (truck: Truck) => {
    setEditingTruckId(truck.id);
    setTruckForm({
      licensePlate: truck.licensePlate,
      truckType: truck.truckType,
      carrier: truck.carrier,
      driverName: truck.driverName ?? '',
      driverDocument: truck.driverDocument ?? '',
    });
    setShowTruckForm(true);
  };

  const startEditVisit = (visit: TruckVisit) => {
    setEditingVisitId(visit.id);
    setVisitForm({
      truckId: String(visit.truckId),
      timeSlot: new Date(visit.timeSlot),
      purpose: visit.purpose,
      gateNumber: visit.gateNumber ?? '',
      containerId: visit.containerId ? String(visit.containerId) : '',
    });
    setShowVisitForm(true);
  };

  const handleTruckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...truckForm,
      truckType: truckForm.truckType as Truck['truckType'],
      driverName: truckForm.driverName || undefined,
      driverDocument: truckForm.driverDocument || undefined,
    };

    try {
      if (editingTruckId) {
        await trucksApi.update(editingTruckId, payload);
      } else {
        await trucksApi.create(payload);
      }
      resetTruckForm();
      loadData();
    } catch (error) {
      console.error('Error saving truck:', error);
      alert(editingTruckId ? 'Ошибка при обновлении автомобиля' : 'Ошибка при создании автомобиля');
    }
  };

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!visitForm.timeSlot) {
      alert('Укажите время визита');
      return;
    }

    const payload = {
      truckId: Number(visitForm.truckId),
      timeSlot: visitForm.timeSlot.toISOString(),
      purpose: visitForm.purpose,
      gateNumber: visitForm.gateNumber || undefined,
      containerId: visitForm.containerId ? Number(visitForm.containerId) : undefined,
    };

    try {
      if (editingVisitId) {
        await truckVisitsApi.update(editingVisitId, payload);
      } else {
        await truckVisitsApi.create({ ...payload, status: 'SCHEDULED' as TruckVisit['status'] });
      }
      resetVisitForm();
      loadData();
    } catch (error) {
      console.error('Error saving visit:', error);
      alert(editingVisitId ? 'Ошибка при обновлении визита' : 'Ошибка при создании визита');
    }
  };

  const handleDeleteTruck = async (id: number) => {
    if (!confirm('Удалить автомобиль?')) return;
    try {
      await trucksApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting truck:', error);
      alert('Не удалось удалить автомобиль.');
    }
  };

  const handleDeleteVisit = async (id: number) => {
    if (!confirm('Удалить визит?')) return;
    try {
      await truckVisitsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting visit:', error);
      alert('Не удалось удалить визит.');
    }
  };

  const checkIn = async (visitId: number) => {
    try {
      await truckVisitsApi.checkIn(visitId);
      loadData();
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const checkOut = async (visitId: number) => {
    try {
      await truckVisitsApi.checkOut(visitId);
      loadData();
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const cancelVisit = async (visitId: number) => {
    if (!confirm('Отменить визит?')) return;
    try {
      await truckVisitsApi.update(visitId, { status: 'CANCELLED' as TruckVisit['status'] });
      loadData();
    } catch (error) {
      console.error('Error cancelling visit:', error);
      alert('Ошибка при отмене визита');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  return (
    <div>
      <PageHeader
        title="Автотранспорт"
        subtitle="FR-12: идентификаторы авто и визитов для сопоставления с партией груза"
        action={
          <div className="flex gap-2">
            <button onClick={() => { if (showTruckForm && !editingTruckId) resetTruckForm(); else { setEditingTruckId(null); setTruckForm(emptyTruckForm); setShowTruckForm(!showTruckForm); } }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              + Автомобиль
            </button>
            <button onClick={() => { if (showVisitForm && !editingVisitId) resetVisitForm(); else { setEditingVisitId(null); setVisitForm(emptyVisitForm); setShowVisitForm(!showVisitForm); } }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              + Визит
            </button>
          </div>
        }
      />

      {showTruckForm && (
        <Card className="mb-6" title={editingTruckId ? 'Редактирование автомобиля' : 'Новый автомобиль'}>
          <form onSubmit={handleTruckSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Гос. номер *</label>
              <input type="text" value={truckForm.licensePlate} onChange={(e) => setTruckForm({ ...truckForm, licensePlate: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label-field">Тип *</label>
              <select value={truckForm.truckType} onChange={(e) => setTruckForm({ ...truckForm, truckType: e.target.value })} className="input-field">
                {Object.entries(TRUCK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Перевозчик *</label>
              <input type="text" value={truckForm.carrier} onChange={(e) => setTruckForm({ ...truckForm, carrier: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="label-field">Водитель</label>
              <input type="text" value={truckForm.driverName} onChange={(e) => setTruckForm({ ...truckForm, driverName: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="label-field">Документ водителя</label>
              <input type="text" value={truckForm.driverDocument} onChange={(e) => setTruckForm({ ...truckForm, driverDocument: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editingTruckId ? 'Сохранить' : 'Создать'}
              </button>
              <button type="button" onClick={resetTruckForm} className="px-6 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg">Отмена</button>
            </div>
          </form>
        </Card>
      )}

      {showVisitForm && (
        <Card className="mb-6" title={editingVisitId ? 'Редактирование визита' : 'Новый визит'}>
          <form onSubmit={handleVisitSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Автомобиль *</label>
              <select value={visitForm.truckId} onChange={(e) => setVisitForm({ ...visitForm, truckId: e.target.value })} className="input-field" required>
                <option value="">Выберите автомобиль</option>
                {trucks.map((truck) => (
                  <option key={truck.id} value={truck.id}>{truck.licensePlate} - {truck.carrier}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Тайм-слот *</label>
              <input type="datetime-local" value={toDateTimeLocal(visitForm.timeSlot)} onChange={(e) => setVisitForm({ ...visitForm, timeSlot: fromDateTimeLocal(e.target.value) })} className="input-field" required />
            </div>
            <div>
              <label className="label-field">Цель визита *</label>
              <input type="text" value={visitForm.purpose} onChange={(e) => setVisitForm({ ...visitForm, purpose: e.target.value })} className="input-field" placeholder="Вывоз контейнера" required />
            </div>
            <div>
              <label className="label-field">Номер ворот</label>
              <input type="text" value={visitForm.gateNumber} onChange={(e) => setVisitForm({ ...visitForm, gateNumber: e.target.value })} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">Партия груза</label>
              <select value={visitForm.containerId} onChange={(e) => setVisitForm({ ...visitForm, containerId: e.target.value })} className="input-field">
                <option value="">Не выбран</option>
                {containers.map((c) => (
                  <option key={c.id} value={c.id}>{c.containerNumber}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                {editingVisitId ? 'Сохранить' : 'Создать визит'}
              </button>
              <button type="button" onClick={resetVisitForm} className="px-6 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg">Отмена</button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Визиты автотранспорта" className="mb-6">
        <div className="mb-4 flex gap-4 items-end">
          <div>
            <label className="label-field">Фильтр по дате:</label>
            <input type="date" value={visitDateFilter} onChange={(e) => setVisitDateFilter(e.target.value)} className="border border-slate-600 rounded-lg px-4 py-2" />
          </div>
          <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Применить</button>
          {visitDateFilter && (
            <button onClick={() => { setVisitDateFilter(''); setTimeout(loadData, 0); }} className="px-4 py-2 bg-gray-200 dark:bg-slate-700 rounded-lg">Сбросить</button>
          )}
        </div>

        {visits.length === 0 ? (
          <p className="text-center text-subtle py-8">Нет визитов</p>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div key={visit.id} className="border-l-4 border-green-500 pl-4 py-2 hover-surface">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">{visit.truck.licensePlate}</h4>
                    <p className="text-sm text-muted">{visit.truck.carrier} | {TRUCK_TYPE_LABELS[visit.truck.truckType]}</p>
                    <p className="text-sm text-muted">Цель: {visit.purpose}</p>
                    <p className="text-sm text-subtle">Тайм-слот: {formatDateTime(visit.timeSlot)}</p>
                    {visit.container && <p className="text-sm text-muted">Партия: {visit.container.containerNumber}</p>}
                    {visit.timeIn && <p className="text-sm text-subtle">Въезд: {formatDateTime(visit.timeIn)}</p>}
                    {visit.timeOut && <p className="text-sm text-subtle">Выезд: {formatDateTime(visit.timeOut)}</p>}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <StatusBadge status={visit.status} label={TRUCK_VISIT_STATUS_LABELS[visit.status]} />
                    {visit.status !== 'COMPLETED' && visit.status !== 'CANCELLED' && (
                      <EntityActions onEdit={() => startEditVisit(visit)} onDelete={() => handleDeleteVisit(visit.id)} />
                    )}
                    <div className="flex gap-2 flex-wrap justify-end">
                      {visit.status === 'SCHEDULED' && (
                        <>
                          <button onClick={() => checkIn(visit.id)} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">Въезд</button>
                          <button onClick={() => cancelVisit(visit.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Отменить</button>
                        </>
                      )}
                      {(visit.status === 'ARRIVED' || visit.status === 'IN_PROGRESS') && (
                        <button onClick={() => checkOut(visit.id)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">Выезд</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Зарегистрированные автомобили">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trucks.map((truck) => (
            <div key={truck.id} className="border border-default rounded-lg p-4 hover:shadow-md">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-lg">{truck.licensePlate}</h4>
                <EntityActions onEdit={() => startEditTruck(truck)} onDelete={() => handleDeleteTruck(truck.id)} />
              </div>
              <p className="text-sm text-muted">{TRUCK_TYPE_LABELS[truck.truckType]}</p>
              <p className="text-sm text-muted">{truck.carrier}</p>
              {truck.driverName && <p className="text-sm text-subtle">Водитель: {truck.driverName}</p>}
              {truck.driverDocument && <p className="text-sm text-subtle">Документ: {truck.driverDocument}</p>}
              {truck._count && <p className="text-xs text-subtle mt-2">Визитов: {truck._count.visits}</p>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

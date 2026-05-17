import React, { useEffect, useState } from 'react';
import { trucksApi, truckVisitsApi } from '../api';
import type { Truck, TruckVisit } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  formatDateTime,
  TRUCK_TYPE_LABELS,
  TRUCK_VISIT_STATUS_LABELS,
  toDateTimeLocal,
  fromDateTimeLocal,
} from '../utils';

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [visits, setVisits] = useState<TruckVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  
  const [truckForm, setTruckForm] = useState({
    licensePlate: '',
    truckType: 'CONTAINER_TRUCK',
    carrier: '',
    driverName: '',
  });

  const [visitForm, setVisitForm] = useState({
    truckId: '',
    timeSlot: null as Date | null,
    purpose: '',
    gateNumber: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trucksData, visitsData] = await Promise.all([
        trucksApi.getAll(),
        truckVisitsApi.getAll(),
      ]);
      setTrucks(trucksData);
      setVisits(visitsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTruckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await trucksApi.create(truckForm);
      
      setTruckForm({
        licensePlate: '',
        truckType: 'CONTAINER_TRUCK',
        carrier: '',
        driverName: '',
      });
      setShowTruckForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating truck:', error);
      alert('Ошибка при создании автомобиля');
    }
  };

  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visitForm.timeSlot) {
      alert('Укажите время визита');
      return;
    }

    try {
      await truckVisitsApi.create({
        truckId: Number(visitForm.truckId),
        timeSlot: visitForm.timeSlot.toISOString(),
        purpose: visitForm.purpose,
        gateNumber: visitForm.gateNumber || undefined,
        status: 'SCHEDULED',
      });
      
      setVisitForm({
        truckId: '',
        timeSlot: null,
        purpose: '',
        gateNumber: '',
      });
      setShowVisitForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating visit:', error);
      alert('Ошибка при создании визита');
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

  if (loading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  return (
    <div>
      <PageHeader 
        title="Управление автотранспортом" 
        subtitle={`Автомобилей: ${trucks.length} | Визитов: ${visits.length}`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setShowTruckForm(!showTruckForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Автомобиль
            </button>
            <button
              onClick={() => setShowVisitForm(!showVisitForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Визит
            </button>
          </div>
        }
      />

      {showTruckForm && (
        <Card className="mb-6" title="Новый автомобиль">
          <form onSubmit={handleTruckSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Гос. номер *
              </label>
              <input
                type="text"
                value={truckForm.licensePlate}
                onChange={(e) => setTruckForm({ ...truckForm, licensePlate: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип *
              </label>
              <select
                value={truckForm.truckType}
                onChange={(e) => setTruckForm({ ...truckForm, truckType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {Object.entries(TRUCK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Перевозчик *
              </label>
              <input
                type="text"
                value={truckForm.carrier}
                onChange={(e) => setTruckForm({ ...truckForm, carrier: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Водитель
              </label>
              <input
                type="text"
                value={truckForm.driverName}
                onChange={(e) => setTruckForm({ ...truckForm, driverName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Создать
              </button>
            </div>
          </form>
        </Card>
      )}

      {showVisitForm && (
        <Card className="mb-6" title="Новый визит">
          <form onSubmit={handleVisitSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Автомобиль *
              </label>
              <select
                value={visitForm.truckId}
                onChange={(e) => setVisitForm({ ...visitForm, truckId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">Выберите автомобиль</option>
                {trucks.map((truck) => (
                  <option key={truck.id} value={truck.id}>
                    {truck.licensePlate} - {truck.carrier}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тайм-слот *
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(visitForm.timeSlot)}
                onChange={(e) => setVisitForm({ ...visitForm, timeSlot: fromDateTimeLocal(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цель визита *
              </label>
              <input
                type="text"
                value={visitForm.purpose}
                onChange={(e) => setVisitForm({ ...visitForm, purpose: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Вывоз контейнера"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер ворот
              </label>
              <input
                type="text"
                value={visitForm.gateNumber}
                onChange={(e) => setVisitForm({ ...visitForm, gateNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Создать визит
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Визиты */}
      <Card title="Визиты автотранспорта" className="mb-6">
        {visits.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Нет визитов</p>
        ) : (
          <div className="space-y-4">
            {visits.map((visit) => (
              <div key={visit.id} className="border-l-4 border-green-500 pl-4 py-2 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">{visit.truck.licensePlate}</h4>
                    <p className="text-sm text-gray-600">
                      {visit.truck.carrier} | {TRUCK_TYPE_LABELS[visit.truck.truckType]}
                    </p>
                    <p className="text-sm text-gray-600">Цель: {visit.purpose}</p>
                    <p className="text-sm text-gray-500">
                      Тайм-слот: {formatDateTime(visit.timeSlot)}
                    </p>
                    {visit.timeIn && (
                      <p className="text-sm text-gray-500">Въезд: {formatDateTime(visit.timeIn)}</p>
                    )}
                    {visit.timeOut && (
                      <p className="text-sm text-gray-500">Выезд: {formatDateTime(visit.timeOut)}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <StatusBadge 
                      status={visit.status} 
                      label={TRUCK_VISIT_STATUS_LABELS[visit.status]} 
                    />
                    <div className="flex gap-2">
                      {visit.status === 'SCHEDULED' && (
                        <button
                          onClick={() => checkIn(visit.id)}
                          className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Въезд
                        </button>
                      )}
                      {(visit.status === 'ARRIVED' || visit.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => checkOut(visit.id)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Выезд
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Список автомобилей */}
      <Card title="Зарегистрированные автомобили">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trucks.map((truck) => (
            <div key={truck.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md">
              <h4 className="font-bold text-lg">{truck.licensePlate}</h4>
              <p className="text-sm text-gray-600">{TRUCK_TYPE_LABELS[truck.truckType]}</p>
              <p className="text-sm text-gray-600">{truck.carrier}</p>
              {truck.driverName && (
                <p className="text-sm text-gray-500">Водитель: {truck.driverName}</p>
              )}
              {truck._count && (
                <p className="text-xs text-gray-400 mt-2">Визитов: {truck._count.visits}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

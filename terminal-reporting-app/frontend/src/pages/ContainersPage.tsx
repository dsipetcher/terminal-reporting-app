import React, { useEffect, useState } from 'react';
import { containersApi, warehousesApi, vesselCallsApi } from '../api';
import type { Container, Warehouse, VesselCall } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  CONTAINER_TYPE_LABELS,
  CONTAINER_STATUS_LABELS,
} from '../utils';

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vesselCalls, setVesselCalls] = useState<VesselCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [searchNumber, setSearchNumber] = useState('');
  
  const [form, setForm] = useState({
    containerNumber: '',
    containerType: 'FORTY_HC',
    status: 'IN_TERMINAL',
    cargoDescription: '',
    grossWeight: '',
    vesselCallId: '',
    warehouseId: '',
    location: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [containersData, warehousesData, vesselCallsData] = await Promise.all([
        containersApi.getAll(),
        warehousesApi.getAll(),
        vesselCallsApi.getAll(),
      ]);
      setContainers(containersData);
      setWarehouses(warehousesData);
      setVesselCalls(vesselCallsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await containersApi.create({
        containerNumber: form.containerNumber.toUpperCase(),
        containerType: form.containerType as any,
        status: form.status as any,
        cargoDescription: form.cargoDescription || undefined,
        grossWeight: form.grossWeight ? parseFloat(form.grossWeight) : undefined,
        vesselCallId: form.vesselCallId ? Number(form.vesselCallId) : undefined,
        warehouseId: form.warehouseId ? Number(form.warehouseId) : undefined,
        location: form.location || undefined,
      });
      
      setForm({
        containerNumber: '',
        containerType: 'FORTY_HC',
        status: 'IN_TERMINAL',
        cargoDescription: '',
        grossWeight: '',
        vesselCallId: '',
        warehouseId: '',
        location: '',
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating container:', error);
      alert('Ошибка при создании контейнера');
    }
  };

  const handleSearch = async () => {
    if (!searchNumber.trim()) {
      loadData();
      return;
    }
    
    try {
      const container = await containersApi.getByNumber(searchNumber.toUpperCase());
      setContainers([container]);
    } catch (error) {
      alert('Контейнер не найден');
      loadData();
    }
  };

  const filteredContainers = selectedStatus === 'ALL'
    ? containers
    : containers.filter(c => c.status === selectedStatus);

  if (loading) {
    return <LoadingSpinner text="Загрузка контейнеров..." />;
  }

  return (
    <div>
      <PageHeader 
        title="Управление контейнерами" 
        subtitle={`Всего: ${containers.length} контейнеров`}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Отменить' : '+ Новый контейнер'}
          </button>
        }
      />

      {/* Форма добавления */}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер контейнера * (11 символов)
              </label>
              <input
                type="text"
                value={form.containerNumber}
                onChange={(e) => setForm({ ...form, containerNumber: e.target.value.toUpperCase() })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="MSCU1234567"
                maxLength={11}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип контейнера *
              </label>
              <select
                value={form.containerType}
                onChange={(e) => setForm({ ...form, containerType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                {Object.entries(CONTAINER_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Статус *
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                {Object.entries(CONTAINER_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Вес брутто (тонн)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.grossWeight}
                onChange={(e) => setForm({ ...form, grossWeight: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Судозаход
              </label>
              <select
                value={form.vesselCallId}
                onChange={(e) => setForm({ ...form, vesselCallId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Не выбран</option>
                {vesselCalls.map((vc) => (
                  <option key={vc.id} value={vc.id}>
                    {vc.vessel.name} - {vc.voyageNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Склад
              </label>
              <select
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Не выбран</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.number} {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Местоположение (блок-ряд-ярус)
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="A-12-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание груза
              </label>
              <input
                type="text"
                value={form.cargoDescription}
                onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Создать контейнер
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Поиск и фильтр */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Поиск по номеру:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value.toUpperCase())}
              placeholder="MSCU1234567"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              maxLength={11}
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Найти
            </button>
            <button
              onClick={() => { setSearchNumber(''); loadData(); }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Сбросить
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Фильтр по статусу:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2"
          >
            <option value="ALL">Все статусы</option>
            {Object.entries(CONTAINER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Список контейнеров */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContainers.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <p className="text-center text-gray-500 py-8">Нет контейнеров</p>
          </Card>
        ) : (
          filteredContainers.map((container) => (
            <Card key={container.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{container.containerNumber}</h3>
                  <p className="text-sm text-gray-600">{CONTAINER_TYPE_LABELS[container.containerType]}</p>
                </div>
                <StatusBadge 
                  status={container.status} 
                  label={CONTAINER_STATUS_LABELS[container.status]} 
                />
              </div>

              <div className="space-y-2">
                {container.grossWeight && (
                  <p className="text-sm">
                    <span className="text-gray-500">Вес:</span> {container.grossWeight} т
                  </p>
                )}
                {container.cargoDescription && (
                  <p className="text-sm">
                    <span className="text-gray-500">Груз:</span> {container.cargoDescription}
                  </p>
                )}
                {container.warehouse && (
                  <p className="text-sm">
                    <span className="text-gray-500">Склад:</span> {container.warehouse.number}
                  </p>
                )}
                {container.location && (
                  <p className="text-sm">
                    <span className="text-gray-500">Место:</span> {container.location}
                  </p>
                )}
                {container.vesselCall && (
                  <p className="text-sm">
                    <span className="text-gray-500">Судно:</span> {container.vesselCall.vessel.name}
                  </p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

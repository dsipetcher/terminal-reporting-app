import React, { useEffect, useState } from 'react';
import { vesselCallsApi, vesselsApi, berthsApi } from '../api';
import type { VesselCall, Vessel, Berth } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  formatDateTime,
  VESSEL_CALL_STATUS_LABELS,
  VESSEL_TYPE_LABELS,
  toDateTimeLocal,
  fromDateTimeLocal,
} from '../utils';

export default function VesselCallsPage() {
  const [vesselCalls, setVesselCalls] = useState<VesselCall[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    vesselId: '',
    voyageNumber: '',
    eta: null as Date | null,
    etd: null as Date | null,
    berthId: '',
    agent: '',
    purpose: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [callsData, vesselsData, berthsData] = await Promise.all([
        vesselCallsApi.getAll(),
        vesselsApi.getAll(),
        berthsApi.getAll(),
      ]);
      setVesselCalls(callsData);
      setVessels(vesselsData);
      setBerths(berthsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.vesselId || !form.eta) {
      alert('Заполните обязательные поля');
      return;
    }

    try {
      await vesselCallsApi.create({
        vesselId: Number(form.vesselId),
        voyageNumber: form.voyageNumber,
        eta: form.eta.toISOString(),
        etd: form.etd?.toISOString(),
        berthId: form.berthId ? Number(form.berthId) : undefined,
        agent: form.agent || undefined,
        purpose: form.purpose || undefined,
        status: 'EXPECTED' as any,
      });
      
      setForm({
        vesselId: '',
        voyageNumber: '',
        eta: null,
        etd: null,
        berthId: '',
        agent: '',
        purpose: '',
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating vessel call:', error);
      alert('Ошибка при создании судозахода');
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await vesselCallsApi.updateStatus(id, newStatus);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const filteredCalls = selectedStatus === 'ALL'
    ? vesselCalls
    : vesselCalls.filter(vc => vc.status === selectedStatus);

  if (loading) {
    return <LoadingSpinner text="Загрузка судозаходов..." />;
  }

  return (
    <div>
      <PageHeader 
        title="Судозаходы" 
        subtitle={`Всего: ${vesselCalls.length} судозаходов`}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Отменить' : '+ Новый судозаход'}
          </button>
        }
      />

      {/* Форма добавления */}
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Судно *
              </label>
              <select
                value={form.vesselId}
                onChange={(e) => setForm({ ...form, vesselId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Выберите судно</option>
                {vessels.map((vessel) => (
                  <option key={vessel.id} value={vessel.id}>
                    {vessel.name} ({vessel.imoNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Рейсовый номер *
              </label>
              <input
                type="text"
                value={form.voyageNumber}
                onChange={(e) => setForm({ ...form, voyageNumber: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Планируемое прибытие (ETA) *
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.eta)}
                onChange={(e) => setForm({ ...form, eta: fromDateTimeLocal(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Планируемое убытие (ETD)
              </label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.etd)}
                onChange={(e) => setForm({ ...form, etd: fromDateTimeLocal(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Причал
              </label>
              <select
                value={form.berthId}
                onChange={(e) => setForm({ ...form, berthId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Не назначен</option>
                {berths.filter(b => b.isActive).map((berth) => (
                  <option key={berth.id} value={berth.id}>
                    №{berth.number} {berth.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Агент
              </label>
              <input
                type="text"
                value={form.agent}
                onChange={(e) => setForm({ ...form, agent: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Цель захода
              </label>
              <input
                type="text"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Например: Погрузка/выгрузка контейнеров"
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Создать судозаход
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Фильтр по статусу */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Фильтр по статусу:
        </label>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="ALL">Все статусы</option>
          {Object.entries(VESSEL_CALL_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Список судозаходов */}
      <div className="space-y-4">
        {filteredCalls.length === 0 ? (
          <Card>
            <p className="text-center text-gray-500 py-8">Нет судозаходов</p>
          </Card>
        ) : (
          filteredCalls.map((call) => (
            <Card key={call.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{call.vessel.name}</h3>
                  <p className="text-sm text-gray-600">
                    IMO: {call.vessel.imoNumber} | Тип: {VESSEL_TYPE_LABELS[call.vessel.vesselType]} | Рейс: {call.voyageNumber}
                  </p>
                  {call.agent && (
                    <p className="text-sm text-gray-600">Агент: {call.agent}</p>
                  )}
                </div>
                <StatusBadge 
                  status={call.status} 
                  label={VESSEL_CALL_STATUS_LABELS[call.status]} 
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Планируемое прибытие</p>
                  <p className="font-medium">{formatDateTime(call.eta)}</p>
                </div>
                {call.ata && (
                  <div>
                    <p className="text-xs text-gray-500">Фактическое прибытие</p>
                    <p className="font-medium">{formatDateTime(call.ata)}</p>
                  </div>
                )}
                {call.berth && (
                  <div>
                    <p className="text-xs text-gray-500">Причал</p>
                    <p className="font-medium">№{call.berth.number} {call.berth.name}</p>
                  </div>
                )}
                {call._count && (
                  <div>
                    <p className="text-xs text-gray-500">Контейнеров</p>
                    <p className="font-medium">{call._count.containers}</p>
                  </div>
                )}
              </div>

              {/* Кнопки управления статусом */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => updateStatus(call.id, 'ARRIVED')}
                  disabled={call.status !== 'EXPECTED'}
                  className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Прибыло
                </button>
                <button
                  onClick={() => updateStatus(call.id, 'BERTHED')}
                  disabled={call.status !== 'ARRIVED'}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  У причала
                </button>
                <button
                  onClick={() => updateStatus(call.id, 'IN_OPERATION')}
                  disabled={call.status !== 'BERTHED'}
                  className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  В обработке
                </button>
                <button
                  onClick={() => updateStatus(call.id, 'DEPARTED')}
                  disabled={call.status !== 'IN_OPERATION'}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Убыло
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

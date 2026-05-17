import React, { useEffect, useState } from 'react';
import { berthsApi } from '../api';
import type { Berth } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { BERTH_TYPE_LABELS } from '../utils';

export default function BerthsPage() {
  const [berths, setBerths] = useState<Berth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    number: '',
    name: '',
    berthType: 'CONTAINER',
    length: '',
    depth: '',
    maxDeadweight: '',
  });

  useEffect(() => {
    loadBerths();
  }, []);

  const loadBerths = async () => {
    try {
      setLoading(true);
      const data = await berthsApi.getAll();
      setBerths(data);
    } catch (error) {
      console.error('Error loading berths:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await berthsApi.create({
        number: form.number,
        name: form.name || undefined,
        berthType: form.berthType as any,
        length: parseFloat(form.length),
        depth: parseFloat(form.depth),
        maxDeadweight: form.maxDeadweight ? parseFloat(form.maxDeadweight) : undefined,
      });
      
      setForm({
        number: '',
        name: '',
        berthType: 'CONTAINER',
        length: '',
        depth: '',
        maxDeadweight: '',
      });
      setShowForm(false);
      loadBerths();
    } catch (error) {
      console.error('Error creating berth:', error);
      alert('Ошибка при создании причала');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка причалов..." />;
  }

  return (
    <div>
      <PageHeader 
        title="Управление причалами" 
        subtitle={`Всего: ${berths.length} причалов`}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Отменить' : '+ Новый причал'}
          </button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер причала *
              </label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип причала *
              </label>
              <select
                value={form.berthType}
                onChange={(e) => setForm({ ...form, berthType: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                {Object.entries(BERTH_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Длина (м) *
              </label>
              <input
                type="number"
                step="0.1"
                value={form.length}
                onChange={(e) => setForm({ ...form, length: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Глубина (м) *
              </label>
              <input
                type="number"
                step="0.1"
                value={form.depth}
                onChange={(e) => setForm({ ...form, depth: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Макс. дедвейт (тонн)
              </label>
              <input
                type="number"
                step="100"
                value={form.maxDeadweight}
                onChange={(e) => setForm({ ...form, maxDeadweight: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Создать причал
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {berths.map((berth) => (
          <Card key={berth.id} className="hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">№{berth.number}</h3>
                {berth.name && (
                  <p className="text-sm text-gray-600">{berth.name}</p>
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                berth.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {berth.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-gray-500">Тип:</span> {BERTH_TYPE_LABELS[berth.berthType]}
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Длина:</span> {berth.length} м
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Глубина:</span> {berth.depth} м
              </p>
              {berth.maxDeadweight && (
                <p className="text-sm">
                  <span className="text-gray-500">Макс. дедвейт:</span> {berth.maxDeadweight} т
                </p>
              )}
            </div>

            {berth.vesselCalls && berth.vesselCalls.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Текущие суда:</p>
                {berth.vesselCalls.map((vc) => (
                  <p key={vc.id} className="text-sm text-gray-600">
                    🚢 {vc.vessel.name}
                  </p>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { warehousesApi } from '../api';
import type { Warehouse } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EntityActions } from '../components/EntityActions';
import { WAREHOUSE_TYPE_LABELS } from '../utils';

const emptyForm = {
  number: '',
  name: '',
  capacity: '',
  warehouseType: 'COAL_YARD',
  zone: '',
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const data = await warehousesApi.getAll();
      setWarehouses(data);
    } catch (error) {
      console.error('Ошибка при загрузке складов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (warehouse: Warehouse) => {
    setEditingId(warehouse.id);
    setForm({
      number: warehouse.number,
      name: warehouse.name ?? '',
      capacity: String(warehouse.capacity),
      warehouseType: warehouse.warehouseType,
      zone: warehouse.zone ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const capacity = parseFloat(form.capacity);
    if (!form.number || capacity <= 0) return;

    const payload = {
      number: form.number,
      name: form.name || undefined,
      capacity,
      warehouseType: form.warehouseType as Warehouse['warehouseType'],
      zone: form.zone || undefined,
    };

    try {
      if (editingId) {
        await warehousesApi.update(editingId, payload);
      } else {
        await warehousesApi.create(payload);
      }
      resetForm();
      fetchWarehouses();
    } catch (err) {
      console.error('Ошибка при сохранении склада:', err);
      alert(editingId ? 'Ошибка при обновлении склада' : 'Ошибка при добавлении склада');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить склад?')) return;

    try {
      await warehousesApi.delete(id);
      fetchWarehouses();
    } catch (err) {
      console.error('Ошибка при удалении склада:', err);
      alert('Не удалось удалить склад. Возможно, есть привязанные грузы.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка складов..." />;
  }

  return (
    <div>
      <PageHeader
        title="Склады угля и нефти"
        subtitle="FR-14–15: размещение партий, ёмкость и перемещение груза"
        action={
          <button
            onClick={() => {
              if (showForm && !editingId) resetForm();
              else { setEditingId(null); setForm(emptyForm); setShowForm(!showForm); }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Отменить' : '+ Новый склад'}
          </button>
        }
      />

      {showForm && (
        <Card className="mb-6" title={editingId ? 'Редактирование склада' : 'Новый склад'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Номер склада *</label>
              <input
                type="text"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">Название</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Вместимость (тонн) *</label>
              <input
                type="number"
                step="0.1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">Тип склада *</label>
              <select
                value={form.warehouseType}
                onChange={(e) => setForm({ ...form, warehouseType: e.target.value })}
                className="input-field"
              >
                {Object.entries(WAREHOUSE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Зона</label>
              <input
                type="text"
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                className="input-field"
                placeholder="A, B, C..."
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {editingId ? 'Сохранить' : 'Добавить склад'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">
                Отмена
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <p className="text-center text-subtle py-8">Нет данных</p>
          </Card>
        ) : (
          warehouses.map((w) => {
            const loadPercentage = w.load ? (w.load / w.capacity) * 100 : 0;
            const freeSpace = w.capacity - (w.load || 0);

            return (
              <Card key={w.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-primary">№{w.number}</h3>
                    {w.name && <p className="text-sm text-muted">{w.name}</p>}
                    <p className="text-xs text-subtle mt-1">{WAREHOUSE_TYPE_LABELS[w.warehouseType]}</p>
                    {w.zone && <p className="text-xs text-subtle">Зона: {w.zone}</p>}
                  </div>
                  <EntityActions onEdit={() => startEdit(w)} onDelete={() => handleDelete(w.id)} />
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted">Заполненность</span>
                      <span className="font-medium text-primary">{loadPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          loadPercentage > 90 ? 'bg-red-500' :
                          loadPercentage > 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(loadPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-subtle">Вместимость</p>
                      <p className="stat-value">{w.capacity.toFixed(1)} т</p>
                    </div>
                    <div>
                      <p className="text-subtle">Загружено</p>
                      <p className="stat-value">{(w.load || 0).toFixed(1)} т</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-subtle">Свободно</p>
                      <p className="font-semibold text-green-700 dark:text-green-400">{freeSpace.toFixed(1)} т</p>
                    </div>
                  </div>

                  {w._count && (
                    <div className="pt-3 border-t border-default">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Вагонов:</span>
                        <span className="font-medium text-primary">{w._count.wagons}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted">Партий груза:</span>
                        <span className="font-medium text-primary">{w._count.containers}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

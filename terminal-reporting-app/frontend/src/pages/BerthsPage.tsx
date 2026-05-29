import React, { useEffect, useState } from 'react';
import { berthsApi } from '../api';
import type { Berth } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EntityActions } from '../components/EntityActions';
import { BERTH_TYPE_LABELS, VESSEL_CALL_STATUS_LABELS, formatBerthLabel } from '../utils';
import { StatusBadge } from '../components/StatusBadge';
import { useEntityHighlight } from '../hooks/useEntityHighlight';
import { entityDomId } from '../lib/entityLinks';

const emptyForm = {
  number: '',
  name: '',
  berthType: 'CONTAINER',
  length: '',
  depth: '',
  maxDeadweight: '',
  isActive: true,
};

export default function BerthsPage() {
  const [berths, setBerths] = useState<Berth[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadBerths();
  }, []);

  const { highlightClass } = useEntityHighlight(berths.map((b) => b.id));

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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (berth: Berth) => {
    setEditingId(berth.id);
    setForm({
      number: berth.number,
      name: berth.name ?? '',
      berthType: berth.berthType,
      length: String(berth.length),
      depth: String(berth.depth),
      maxDeadweight: berth.maxDeadweight ? String(berth.maxDeadweight) : '',
      isActive: berth.isActive,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      number: form.number,
      name: form.name || undefined,
      berthType: form.berthType as Berth['berthType'],
      length: parseFloat(form.length),
      depth: parseFloat(form.depth),
      maxDeadweight: form.maxDeadweight ? parseFloat(form.maxDeadweight) : undefined,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await berthsApi.update(editingId, payload);
      } else {
        await berthsApi.create(payload);
      }
      resetForm();
      loadBerths();
    } catch (error) {
      console.error('Error saving berth:', error);
      alert(editingId ? 'Ошибка при обновлении причала' : 'Ошибка при создании причала');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить причал?')) return;

    try {
      await berthsApi.delete(id);
      loadBerths();
    } catch (error) {
      console.error('Error deleting berth:', error);
      alert('Не удалось удалить причал. Возможно, есть связанные судозаходы.');
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
            onClick={() => {
              if (showForm && !editingId) resetForm();
              else { setEditingId(null); setForm(emptyForm); setShowForm(!showForm); }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Отменить' : '+ Новый причал'}
          </button>
        }
      />

      {showForm && (
        <Card className="mb-6" title={editingId ? 'Редактирование причала' : 'Новый причал'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Номер причала *</label>
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
              <label className="label-field">Тип причала *</label>
              <select
                value={form.berthType}
                onChange={(e) => setForm({ ...form, berthType: e.target.value })}
                className="input-field"
                required
              >
                {Object.entries(BERTH_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Длина (м) *</label>
              <input
                type="number"
                step="0.1"
                value={form.length}
                onChange={(e) => setForm({ ...form, length: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">Глубина (м) *</label>
              <input
                type="number"
                step="0.1"
                value={form.depth}
                onChange={(e) => setForm({ ...form, depth: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">Макс. дедвейт (тонн)</label>
              <input
                type="number"
                step="100"
                value={form.maxDeadweight}
                onChange={(e) => setForm({ ...form, maxDeadweight: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="label-field mb-0">Активен</label>
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editingId ? 'Сохранить' : 'Создать причал'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">
                Отмена
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {berths.map((berth) => (
          <Card
            key={berth.id}
            id={entityDomId(berth.id)}
            className={`hover:shadow-lg transition-shadow ${highlightClass(berth.id)}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-primary">{formatBerthLabel(berth)}</h3>
                <p className="text-sm text-muted">{BERTH_TYPE_LABELS[berth.berthType]}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  berth.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {berth.isActive ? 'Активен' : 'Неактивен'}
                </span>
                <EntityActions onEdit={() => startEdit(berth)} onDelete={() => handleDelete(berth.id)} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm"><span className="text-subtle">Тип:</span> {BERTH_TYPE_LABELS[berth.berthType]}</p>
              <p className="text-sm"><span className="text-subtle">Длина:</span> {berth.length} м</p>
              <p className="text-sm"><span className="text-subtle">Глубина:</span> {berth.depth} м</p>
              {berth.maxDeadweight && (
                <p className="text-sm"><span className="text-subtle">Макс. дедвейт:</span> {berth.maxDeadweight} т</p>
              )}
            </div>

            {berth.vesselCalls && berth.vesselCalls.length > 0 && (
              <div className="mt-4 pt-4 border-t border-default">
                <p className="text-sm font-medium text-secondary mb-2">Текущие суда:</p>
                <ul className="space-y-2">
                  {berth.vesselCalls.map((vc) => (
                    <li key={vc.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted">
                        🚢 {vc.vessel.name} · рейс {vc.voyageNumber}
                      </span>
                      <StatusBadge
                        status={vc.status}
                        label={VESSEL_CALL_STATUS_LABELS[vc.status]}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

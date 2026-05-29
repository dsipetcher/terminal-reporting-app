import React, { useEffect, useState } from 'react';
import { vesselsApi } from '../api';
import type { Vessel } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EntityActions } from '../components/EntityActions';
import { VESSEL_TYPE_LABELS } from '../utils';

const emptyForm = {
  name: '',
  imoNumber: '',
  vesselType: 'CONTAINER',
  grossTonnage: '',
  deadweight: '',
  length: '',
  beam: '',
  draft: '',
  flag: '',
  owner: '',
};

export default function VesselsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadVessels();
  }, []);

  const loadVessels = async () => {
    try {
      setLoading(true);
      const data = await vesselsApi.getAll();
      setVessels(data);
    } catch (error) {
      console.error('Error loading vessels:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (vessel: Vessel) => {
    setEditingId(vessel.id);
    setForm({
      name: vessel.name,
      imoNumber: vessel.imoNumber,
      vesselType: vessel.vesselType,
      grossTonnage: vessel.grossTonnage?.toString() ?? '',
      deadweight: vessel.deadweight?.toString() ?? '',
      length: vessel.length?.toString() ?? '',
      beam: vessel.beam?.toString() ?? '',
      draft: vessel.draft?.toString() ?? '',
      flag: vessel.flag ?? '',
      owner: vessel.owner ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{7}$/.test(form.imoNumber)) {
      alert('IMO номер должен содержать 7 цифр');
      return;
    }

    const payload = {
      name: form.name,
      imoNumber: form.imoNumber,
      vesselType: form.vesselType as Vessel['vesselType'],
      grossTonnage: form.grossTonnage ? parseFloat(form.grossTonnage) : undefined,
      deadweight: form.deadweight ? parseFloat(form.deadweight) : undefined,
      length: form.length ? parseFloat(form.length) : undefined,
      beam: form.beam ? parseFloat(form.beam) : undefined,
      draft: form.draft ? parseFloat(form.draft) : undefined,
      flag: form.flag || undefined,
      owner: form.owner || undefined,
    };

    try {
      if (editingId) {
        await vesselsApi.update(editingId, payload);
      } else {
        await vesselsApi.create(payload);
      }
      resetForm();
      loadVessels();
    } catch (error) {
      console.error('Error saving vessel:', error);
      alert(editingId ? 'Ошибка при обновлении судна' : 'Ошибка при создании судна');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить судно? Связанные судозаходы могут быть затронуты.')) return;

    try {
      await vesselsApi.delete(id);
      loadVessels();
    } catch (error) {
      console.error('Error deleting vessel:', error);
      alert('Не удалось удалить судно. Возможно, есть связанные судозаходы.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка судов..." />;
  }

  return (
    <div>
      <PageHeader
        title="Управление судами"
        subtitle={`Всего: ${vessels.length} судов`}
        action={
          <button
            onClick={() => {
              if (showForm && !editingId) {
                resetForm();
              } else {
                setEditingId(null);
                setForm(emptyForm);
                setShowForm(!showForm);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Отменить' : '+ Новое судно'}
          </button>
        }
      />

      {showForm && (
        <Card className="mb-6" title={editingId ? 'Редактирование судна' : 'Новое судно'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Название *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">IMO номер * (7 цифр)</label>
              <input
                type="text"
                value={form.imoNumber}
                onChange={(e) => setForm({ ...form, imoNumber: e.target.value.replace(/\D/g, '').slice(0, 7) })}
                className="input-field"
                maxLength={7}
                required
              />
            </div>

            <div>
              <label className="label-field">Тип судна *</label>
              <select
                value={form.vesselType}
                onChange={(e) => setForm({ ...form, vesselType: e.target.value })}
                className="input-field"
                required
              >
                {Object.entries(VESSEL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Флаг</label>
              <input
                type="text"
                value={form.flag}
                onChange={(e) => setForm({ ...form, flag: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Валовая вместимость (GT)</label>
              <input
                type="number"
                step="1"
                value={form.grossTonnage}
                onChange={(e) => setForm({ ...form, grossTonnage: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Дедвейт (DWT)</label>
              <input
                type="number"
                step="1"
                value={form.deadweight}
                onChange={(e) => setForm({ ...form, deadweight: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Длина (м)</label>
              <input
                type="number"
                step="0.1"
                value={form.length}
                onChange={(e) => setForm({ ...form, length: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Ширина (м)</label>
              <input
                type="number"
                step="0.1"
                value={form.beam}
                onChange={(e) => setForm({ ...form, beam: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Осадка (м)</label>
              <input
                type="number"
                step="0.1"
                value={form.draft}
                onChange={(e) => setForm({ ...form, draft: e.target.value })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Судовладелец</label>
              <input
                type="text"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editingId ? 'Сохранить' : 'Создать судно'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600"
              >
                Отмена
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vessels.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <p className="text-center text-subtle py-8">Нет судов. Добавьте первое судно для создания судозаходов.</p>
          </Card>
        ) : (
          vessels.map((vessel) => (
            <Card key={vessel.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-primary">{vessel.name}</h3>
                  <p className="text-sm text-muted">IMO: {vessel.imoNumber}</p>
                </div>
                <EntityActions
                  onEdit={() => startEdit(vessel)}
                  onDelete={() => handleDelete(vessel.id)}
                />
              </div>

              <div className="space-y-2 text-sm">
                <p><span className="text-subtle">Тип:</span> {VESSEL_TYPE_LABELS[vessel.vesselType]}</p>
                {vessel.flag && <p><span className="text-subtle">Флаг:</span> {vessel.flag}</p>}
                {vessel.owner && <p><span className="text-subtle">Владелец:</span> {vessel.owner}</p>}
                {vessel.grossTonnage && <p><span className="text-subtle">GT:</span> {vessel.grossTonnage}</p>}
                {vessel.deadweight && <p><span className="text-subtle">DWT:</span> {vessel.deadweight}</p>}
                {vessel.length && <p><span className="text-subtle">Размеры:</span> {vessel.length}×{vessel.beam ?? '?'} м</p>}
                {vessel._count && (
                  <p className="text-subtle pt-2 border-t border-default">Судозаходов: {vessel._count.vesselCalls}</p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

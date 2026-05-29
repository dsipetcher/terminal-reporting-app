import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { vesselsApi } from '../api';
import type { Vessel } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EntityActions } from '../components/EntityActions';
import { VesselCallsPanel } from '../components/vessels/VesselCallsPanel';
import { VESSEL_TYPE_LABELS, FIELD_LABELS } from '../utils';
import { useEntityHighlight } from '../hooks/useEntityHighlight';
import { entityDomId } from '../lib/entityLinks';

type VesselsTab = 'registry' | 'calls';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: VesselsTab = searchParams.get('tab') === 'calls' ? 'calls' : 'registry';

  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const highlightParam = searchParams.get('highlight');
  const highlightId = highlightParam && !Number.isNaN(Number(highlightParam))
    ? Number(highlightParam)
    : null;

  const { highlightClass } = useEntityHighlight(vessels.map((v) => v.id));

  useEffect(() => {
    if (tab === 'registry') {
      loadVessels();
    } else {
      setLoading(false);
    }
  }, [tab]);

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

  const setTab = (next: VesselsTab) => {
    const params: Record<string, string> = {};
    if (next === 'calls') params.tab = 'calls';
    if (highlightId != null) params.highlight = String(highlightId);
    setSearchParams(params, { replace: true });
    if (next === 'registry') {
      setShowForm(false);
      setEditingId(null);
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
      alert('Номер ИМО должен содержать 7 цифр');
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

  return (
    <div>
      <PageHeader
        title="Суда"
        subtitle={
          tab === 'calls'
            ? 'Справочник судов и отслеживание судозаходов'
            : `Справочник: ${vessels.length} судов`
        }
        action={
          tab === 'registry' ? (
            <button
              type="button"
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
          ) : undefined
        }
      />

      <div className="flex gap-2 mb-6 border-b border-default">
        <button
          type="button"
          onClick={() => setTab('registry')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'registry'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          Справочник
        </button>
        <button
          type="button"
          onClick={() => setTab('calls')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'calls'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-muted hover:text-primary'
          }`}
        >
          Судозаходы
        </button>
      </div>

      {tab === 'calls' ? (
        <VesselCallsPanel />
      ) : loading ? (
        <LoadingSpinner text="Загрузка судов..." />
      ) : (
        <>
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
                  <label className="label-field">Номер ИМО * (7 цифр)</label>
                  <input
                    type="text"
                    value={form.imoNumber}
                    onChange={(e) =>
                      setForm({ ...form, imoNumber: e.target.value.replace(/\D/g, '').slice(0, 7) })
                    }
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
                      <option key={value} value={value}>
                        {label}
                      </option>
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
                  <label className="label-field">{FIELD_LABELS.GT}, т</label>
                  <input
                    type="number"
                    step="1"
                    value={form.grossTonnage}
                    onChange={(e) => setForm({ ...form, grossTonnage: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-field">{FIELD_LABELS.DWT}, т</label>
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
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
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
                <p className="text-center text-subtle py-8">
                  Нет судов. Добавьте судно в справочник, затем создайте судозаход на вкладке
                  «Судозаходы».
                </p>
              </Card>
            ) : (
              vessels.map((vessel) => (
                <Card
                  key={vessel.id}
                  id={entityDomId(vessel.id)}
                  className={`hover:shadow-lg transition-shadow ${highlightClass(vessel.id)}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-primary">{vessel.name}</h3>
                      <p className="text-sm text-muted">{FIELD_LABELS.IMO}: {vessel.imoNumber}</p>
                    </div>
                    <EntityActions
                      onEdit={() => startEdit(vessel)}
                      onDelete={() => handleDelete(vessel.id)}
                    />
                  </div>

                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-subtle">Тип:</span> {VESSEL_TYPE_LABELS[vessel.vesselType]}
                    </p>
                    {vessel.flag && (
                      <p>
                        <span className="text-subtle">Флаг:</span> {vessel.flag}
                      </p>
                    )}
                    {vessel.owner && (
                      <p>
                        <span className="text-subtle">Владелец:</span> {vessel.owner}
                      </p>
                    )}
                    {vessel.grossTonnage && (
                      <p>
                        <span className="text-subtle">{FIELD_LABELS.GT}:</span> {vessel.grossTonnage}
                      </p>
                    )}
                    {vessel.deadweight && (
                      <p>
                        <span className="text-subtle">{FIELD_LABELS.DWT}:</span> {vessel.deadweight}
                      </p>
                    )}
                    {vessel.length && (
                      <p>
                        <span className="text-subtle">Размеры:</span> {vessel.length}×
                        {vessel.beam ?? '?'} м
                      </p>
                    )}
                    {vessel._count && (
                      <p className="text-subtle pt-2 border-t border-default">
                        Судозаходов: {vessel._count.vesselCalls}
                      </p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

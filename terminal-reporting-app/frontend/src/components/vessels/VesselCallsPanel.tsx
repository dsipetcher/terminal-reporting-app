import { useEffect, useState } from 'react';
import { vesselCallsApi, vesselsApi, berthsApi } from '../../api';
import type { VesselCall, Vessel, Berth } from '../../types';
import { Card } from '../Card';
import { StatusBadge } from '../StatusBadge';
import { LoadingSpinner } from '../LoadingSpinner';
import { EntityActions } from '../EntityActions';
import {
  formatDateTime,
  VESSEL_CALL_STATUS_LABELS,
  VESSEL_TYPE_LABELS,
  FIELD_LABELS,
  formatBerthLabel,
  toDateTimeLocal,
  fromDateTimeLocal,
} from '../../utils';
import { useEntityHighlight } from '../../hooks/useEntityHighlight';
import { entityDomId } from '../../lib/entityLinks';

const emptyForm = {
  vesselId: '',
  voyageNumber: '',
  eta: null as Date | null,
  etd: null as Date | null,
  berthId: '',
  agent: '',
  purpose: '',
};

export function VesselCallsPanel() {
  const [vesselCalls, setVesselCalls] = useState<VesselCall[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [assigningBerthForCallId, setAssigningBerthForCallId] = useState<number | null>(null);
  const [selectedBerthId, setSelectedBerthId] = useState('');
  const [form, setForm] = useState(emptyForm);

  const { highlightClass } = useEntityHighlight(vesselCalls.map((c) => c.id));

  const loadData = async () => {
    try {
      setLoading(true);
      const params: { status?: string; fromDate?: string; toDate?: string } = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const [callsData, vesselsData, berthsData] = await Promise.all([
        vesselCallsApi.getAll(params),
        vesselsApi.getAll(),
        berthsApi.getAll(),
      ]);
      setVesselCalls(callsData);
      setVessels(vesselsData);
      setBerths(berthsData);
    } catch (error) {
      console.error('Error loading vessel calls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (call: VesselCall) => {
    setEditingId(call.id);
    setForm({
      vesselId: String(call.vesselId),
      voyageNumber: call.voyageNumber,
      eta: new Date(call.eta),
      etd: call.etd ? new Date(call.etd) : null,
      berthId: call.berthId ? String(call.berthId) : '',
      agent: call.agent ?? '',
      purpose: call.purpose ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.vesselId || !form.eta) {
      alert('Заполните обязательные поля');
      return;
    }

    const payload = {
      vesselId: Number(form.vesselId),
      voyageNumber: form.voyageNumber,
      eta: form.eta.toISOString(),
      etd: form.etd?.toISOString(),
      berthId: form.berthId ? Number(form.berthId) : undefined,
      agent: form.agent || undefined,
      purpose: form.purpose || undefined,
    };

    try {
      if (editingId) {
        await vesselCallsApi.update(editingId, payload);
      } else {
        await vesselCallsApi.create({ ...payload, status: 'EN_ROUTE' as VesselCall['status'] });
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving vessel call:', error);
      alert(editingId ? 'Ошибка при обновлении судозахода' : 'Ошибка при создании судозахода');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить судозаход?')) return;

    try {
      await vesselCallsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting vessel call:', error);
      alert('Не удалось удалить судозаход.');
    }
  };

  const updateStatus = async (id: number, newStatus: string, berthId?: number) => {
    try {
      await vesselCallsApi.updateStatus(id, newStatus, berthId);
      setAssigningBerthForCallId(null);
      setSelectedBerthId('');
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  const startBerthAssignment = (call: VesselCall) => {
    setAssigningBerthForCallId(call.id);
    setSelectedBerthId(call.berthId ? String(call.berthId) : '');
  };

  const confirmBerthAssignment = async (callId: number) => {
    if (!selectedBerthId) {
      alert('Выберите причал');
      return;
    }
    await updateStatus(callId, 'ARRIVED', Number(selectedBerthId));
  };

  const canCancel = (status: string) => ['EN_ROUTE', 'EXPECTED', 'ARRIVED'].includes(status);

  if (loading) {
    return <LoadingSpinner text="Загрузка судозаходов..." />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-secondary">
          Отслеживание рейсов: прибытие → причал → обработка → отход. Идентификатор рейса привязывается к
          партии груза.
        </p>
        <button
          type="button"
          onClick={() => {
            if (showForm && !editingId) resetForm();
            else {
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(!showForm);
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          {showForm ? 'Отменить' : '+ Новый судозаход'}
        </button>
      </div>

      {showForm && (
        <Card className="mb-6" title={editingId ? 'Редактирование судозахода' : 'Новый судозаход'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Судно *</label>
              <select
                value={form.vesselId}
                onChange={(e) => setForm({ ...form, vesselId: e.target.value })}
                className="input-field"
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
              <label className="label-field">Рейсовый номер *</label>
              <input
                type="text"
                value={form.voyageNumber}
                onChange={(e) => setForm({ ...form, voyageNumber: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">{FIELD_LABELS.ETA} *</label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.eta)}
                onChange={(e) => setForm({ ...form, eta: fromDateTimeLocal(e.target.value) })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="label-field">{FIELD_LABELS.ETD}</label>
              <input
                type="datetime-local"
                value={toDateTimeLocal(form.etd)}
                onChange={(e) => setForm({ ...form, etd: fromDateTimeLocal(e.target.value) })}
                className="input-field"
              />
            </div>

            <div>
              <label className="label-field">Причал</label>
              <select
                value={form.berthId}
                onChange={(e) => setForm({ ...form, berthId: e.target.value })}
                className="input-field"
              >
                <option value="">Не назначен</option>
                {berths
                  .filter((b) => b.isActive)
                  .map((berth) => (
                    <option key={berth.id} value={berth.id}>
                      {formatBerthLabel(berth)}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="label-field">Агент</label>
              <input
                type="text"
                value={form.agent}
                onChange={(e) => setForm({ ...form, agent: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label-field">Цель захода</label>
              <input
                type="text"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="input-field"
                placeholder="Например: погрузка угля на экспорт"
              />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Сохранить' : 'Создать судозаход'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div>
          <label className="label-field">Фильтр по статусу:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-slate-600 rounded-lg px-4 py-2"
          >
            <option value="ALL">Все статусы</option>
            {Object.entries(VESSEL_CALL_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">С даты:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-slate-600 rounded-lg px-4 py-2"
          />
        </div>
        <div>
          <label className="label-field">По дату:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-slate-600 rounded-lg px-4 py-2"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Применить
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {vesselCalls.length === 0 ? (
          <Card>
            <p className="text-center text-subtle py-8">Нет судозаходов</p>
          </Card>
        ) : (
          vesselCalls.map((call) => (
            <Card
              key={call.id}
              id={entityDomId(call.id)}
              className={`hover:shadow-lg transition-shadow ${highlightClass(call.id)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-primary">{call.vessel.name}</h3>
                  <p className="text-sm text-muted">
                    {FIELD_LABELS.IMO}: {call.vessel.imoNumber} | Тип: {VESSEL_TYPE_LABELS[call.vessel.vesselType]} |
                    Рейс: {call.voyageNumber}
                  </p>
                  {call.agent && <p className="text-sm text-muted">Агент: {call.agent}</p>}
                </div>
                <div className="flex items-start gap-2">
                  <StatusBadge status={call.status} label={VESSEL_CALL_STATUS_LABELS[call.status]} />
                  {call.status !== 'DEPARTED' && call.status !== 'CANCELLED' && (
                    <EntityActions
                      onEdit={() => startEdit(call)}
                      onDelete={() => handleDelete(call.id)}
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-subtle">{FIELD_LABELS.ETA}</p>
                  <p className="font-medium">{formatDateTime(call.eta)}</p>
                </div>
                {call.etd && (
                  <div>
                    <p className="text-xs text-subtle">{FIELD_LABELS.ETD}</p>
                    <p className="font-medium">{formatDateTime(call.etd)}</p>
                  </div>
                )}
                {call.ata && (
                  <div>
                    <p className="text-xs text-subtle">{FIELD_LABELS.ATA}</p>
                    <p className="font-medium">{formatDateTime(call.ata)}</p>
                  </div>
                )}
                {call.berth && (
                  <div>
                    <p className="text-xs text-subtle">Причал</p>
                    <p className="font-medium">
                      {call.berth ? formatBerthLabel(call.berth) : '—'}
                    </p>
                  </div>
                )}
                {call._count && (
                  <div>
                    <p className="text-xs text-subtle">Партий</p>
                    <p className="font-medium">{call._count.containers}</p>
                  </div>
                )}
              </div>

              {call.status !== 'DEPARTED' && call.status !== 'CANCELLED' && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => startBerthAssignment(call)}
                    disabled={!['EN_ROUTE', 'EXPECTED'].includes(call.status) || assigningBerthForCallId === call.id}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Прибыл
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(call.id, 'UNLOADING')}
                    disabled={call.status !== 'ARRIVED'}
                    className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Разгрузка
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus(call.id, 'DEPARTED')}
                    disabled={call.status !== 'UNLOADING'}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Убыл
                  </button>
                  {canCancel(call.status) && (
                    <button
                      type="button"
                      onClick={() => updateStatus(call.id, 'CANCELLED')}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Отменить
                    </button>
                  )}
                </div>
              )}

              {assigningBerthForCallId === call.id && (
                <div className="mt-4 p-4 border border-default rounded-lg bg-gray-50 dark:bg-slate-900/50">
                  <p className="text-sm font-medium text-primary mb-3">Назначение причала</p>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                    <div className="flex-1 w-full">
                      <label className="label-field">Причал *</label>
                      <select
                        value={selectedBerthId}
                        onChange={(e) => setSelectedBerthId(e.target.value)}
                        className="input-field"
                      >
                        <option value="">Выберите причал</option>
                        {berths
                          .filter((b) => b.isActive)
                          .map((berth) => (
                            <option key={berth.id} value={berth.id}>
                              {formatBerthLabel(berth)}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => confirmBerthAssignment(call.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 text-sm"
                      >
                        Подтвердить
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningBerthForCallId(null);
                          setSelectedBerthId('');
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 text-sm"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default VesselCallsPanel;

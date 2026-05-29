import { useEffect, useState } from 'react';
import { logisticsOrdersApi, counterpartiesApi } from '../api';
import type { Counterparty, LogisticsOrder, ManagementLevel, OrderStatus, OrderType } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import { EntityActions } from '../components/EntityActions';
import {
  MANAGEMENT_LEVEL_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  toDateTimeLocal,
  fromDateTimeLocal,
} from '../utils';

const TZ_ORDER_TYPES = ['EXPORT_BULK', 'STORAGE', 'SHIP_LOADING'] as const;

const emptyForm = {
  orderNumber: '',
  orderType: 'EXPORT_BULK',
  managementLevel: 'PLANNING',
  status: 'DRAFT',
  counterpartyId: '',
  supplierName: '',
  cargoDescription: '',
  cargoWeight: '',
  origin: '',
  destination: '',
  plannedStart: '',
  plannedEnd: '',
  notes: '',
};

export default function LogisticsOrdersPage() {
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [counterparties, setCounterparties] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      const [ordersData, partners] = await Promise.all([
        logisticsOrdersApi.getAll(
          filterLevel !== 'ALL' ? { managementLevel: filterLevel } : undefined
        ),
        counterpartiesApi.getAll(),
      ]);
      setOrders(ordersData);
      setCounterparties(partners);
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterLevel]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (order: LogisticsOrder) => {
    setEditingId(order.id);
    setForm({
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      managementLevel: order.managementLevel,
      status: order.status,
      counterpartyId: order.counterpartyId ? String(order.counterpartyId) : '',
      supplierName: order.supplierName ?? '',
      cargoDescription: order.cargoDescription ?? '',
      cargoWeight: order.cargoWeight != null ? String(order.cargoWeight) : '',
      origin: order.origin ?? '',
      destination: order.destination ?? '',
      plannedStart: order.plannedStart ? toDateTimeLocal(new Date(order.plannedStart)) : '',
      plannedEnd: order.plannedEnd ? toDateTimeLocal(new Date(order.plannedEnd)) : '',
      notes: order.notes ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderNumber) return;

    const payload: Partial<LogisticsOrder> = {
      orderNumber: form.orderNumber,
      orderType: form.orderType as OrderType,
      managementLevel: form.managementLevel as ManagementLevel,
      status: form.status as OrderStatus,
      counterpartyId: form.counterpartyId ? Number(form.counterpartyId) : undefined,
      supplierName: form.supplierName || undefined,
      cargoDescription: form.cargoDescription || undefined,
      cargoWeight: form.cargoWeight ? Number(form.cargoWeight) : undefined,
      origin: form.origin || undefined,
      destination: form.destination || undefined,
      plannedStart: fromDateTimeLocal(form.plannedStart)?.toISOString(),
      plannedEnd: fromDateTimeLocal(form.plannedEnd)?.toISOString(),
      notes: form.notes || undefined,
    };

    try {
      if (editingId) {
        await logisticsOrdersApi.update(editingId, payload);
      } else {
        await logisticsOrdersApi.create(payload);
      }
      resetForm();
      load();
    } catch (error) {
      console.error('Ошибка сохранения заказа:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить логистический заказ?')) return;
    try {
      await logisticsOrdersApi.delete(id);
      load();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  if (loading) return <LoadingSpinner text="Загрузка заказов..." />;

  return (
    <div>
      <PageHeader
        title="Логистические заказы"
        subtitle="FR-07: заказы ИЛС с уровнями управления и привязкой к партиям и маршрутам"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Новый заказ
          </button>
        }
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', 'PLANNING', 'DISPATCH', 'OPERATIONAL'].map((level) => (
          <button
            key={level}
            onClick={() => setFilterLevel(level)}
            className={`px-3 py-1 rounded-full text-sm ${
              filterLevel === level
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-slate-800 text-secondary'
            }`}
          >
            {level === 'ALL' ? 'Все уровни' : MANAGEMENT_LEVEL_LABELS[level]}
          </button>
        ))}
      </div>

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              placeholder="Номер заказа"
              value={form.orderNumber}
              onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
              className="input-field"
              disabled={!!editingId}
            />
            <select
              value={form.orderType}
              onChange={(e) => setForm({ ...form, orderType: e.target.value })}
              className="input-field"
            >
              {TZ_ORDER_TYPES.map((k) => (
                <option key={k} value={k}>{ORDER_TYPE_LABELS[k]}</option>
              ))}
            </select>
            <select
              value={form.managementLevel}
              onChange={(e) => setForm({ ...form, managementLevel: e.target.value })}
              className="input-field"
            >
              {Object.entries(MANAGEMENT_LEVEL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="input-field"
            >
              {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={form.counterpartyId}
              onChange={(e) => setForm({ ...form, counterpartyId: e.target.value })}
              className="input-field"
            >
              <option value="">Контрагент</option>
              {counterparties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input
              placeholder="Поставщик (шахта / НПЗ)"
              value={form.supplierName}
              onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
              className="input-field"
            />
            <input
              placeholder="Вес груза (т)"
              value={form.cargoWeight}
              onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })}
              className="input-field"
            />
            <input
              placeholder="Пункт отправления (код порта)"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              className="input-field"
            />
            <input
              placeholder="Пункт назначения"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              className="input-field"
            />
            <input
              type="datetime-local"
              value={form.plannedStart}
              onChange={(e) => setForm({ ...form, plannedStart: e.target.value })}
              className="input-field"
            />
            <input
              type="datetime-local"
              value={form.plannedEnd}
              onChange={(e) => setForm({ ...form, plannedEnd: e.target.value })}
              className="input-field"
            />
            <textarea
              placeholder="Описание груза"
              value={form.cargoDescription}
              onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })}
              className="input-field md:col-span-2"
              rows={2}
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                {editingId ? 'Сохранить' : 'Создать'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-default rounded-lg">
                Отмена
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {orders.length === 0 ? (
          <p className="text-subtle text-center py-8">Нет логистических заказов</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default text-left text-muted">
                  <th className="py-2 pr-4">Заказ</th>
                  <th className="py-2 pr-4">Тип</th>
                  <th className="py-2 pr-4">Уровень ИЛС</th>
                  <th className="py-2 pr-4">Контрагент</th>
                  <th className="py-2 pr-4">Маршрут</th>
                  <th className="py-2 pr-4">Статус</th>
                  <th className="py-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-default hover-surface">
                    <td className="py-3 pr-4 font-medium">{order.orderNumber}</td>
                    <td className="py-3 pr-4">{ORDER_TYPE_LABELS[order.orderType]}</td>
                    <td className="py-3 pr-4">{MANAGEMENT_LEVEL_LABELS[order.managementLevel]}</td>
                    <td className="py-3 pr-4">{order.counterparty?.name ?? '—'}</td>
                    <td className="py-3 pr-4 text-muted">
                      {order.origin || '—'} → {order.destination || '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={order.status} label={ORDER_STATUS_LABELS[order.status]} />
                    </td>
                    <td className="py-3">
                      <EntityActions onEdit={() => startEdit(order)} onDelete={() => handleDelete(order.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

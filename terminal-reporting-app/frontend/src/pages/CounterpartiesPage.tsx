import { useEffect, useState } from 'react';
import { counterpartiesApi } from '../api';
import type { Counterparty, PartnerType } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EntityActions } from '../components/EntityActions';
import { PARTNER_TYPE_LABELS } from '../utils';

const emptyForm = { code: '', name: '', partnerType: 'CLIENT', inn: '', contact: '' };

export default function CounterpartiesPage() {
  const [items, setItems] = useState<Counterparty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      setItems(await counterpartiesApi.getAll());
    } catch (error) {
      console.error('Ошибка загрузки контрагентов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: Counterparty) => {
    setEditingId(item.id);
    setForm({
      code: item.code,
      name: item.name,
      partnerType: item.partnerType,
      inn: item.inn ?? '',
      contact: item.contact ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;
    try {
      const payload: Partial<Counterparty> = {
        ...form,
        partnerType: form.partnerType as PartnerType,
      };
      if (editingId) {
        await counterpartiesApi.update(editingId, payload);
      } else {
        await counterpartiesApi.create(payload);
      }
      resetForm();
      load();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить контрагента?')) return;
    try {
      await counterpartiesApi.delete(id);
      load();
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  if (loading) return <LoadingSpinner text="Загрузка справочника..." />;

  return (
    <div>
      <PageHeader
        title="Контрагенты"
        subtitle="FR-16: участники логистических цепочек (клиент, перевозчик, агент, ЖД)"
        action={
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Добавить
          </button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              placeholder="Код"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="input-field"
              disabled={!!editingId}
            />
            <input
              required
              placeholder="Наименование"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
            />
            <select
              value={form.partnerType}
              onChange={(e) => setForm({ ...form, partnerType: e.target.value })}
              className="input-field"
            >
              {Object.entries(PARTNER_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              placeholder="ИНН"
              value={form.inn}
              onChange={(e) => setForm({ ...form, inn: e.target.value })}
              className="input-field"
            />
            <input
              placeholder="Контакт"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="input-field md:col-span-2"
            />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Сохранить</button>
              <button type="button" onClick={resetForm} className="px-4 py-2 border border-default rounded-lg">
                Отмена
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-default text-left text-muted">
                <th className="py-2 pr-4">Код</th>
                <th className="py-2 pr-4">Наименование</th>
                <th className="py-2 pr-4">Тип</th>
                <th className="py-2 pr-4">Заказов</th>
                <th className="py-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-default hover-surface">
                  <td className="py-3 pr-4 font-mono">{item.code}</td>
                  <td className="py-3 pr-4">{item.name}</td>
                  <td className="py-3 pr-4">{PARTNER_TYPE_LABELS[item.partnerType]}</td>
                  <td className="py-3 pr-4">{item._count?.orders ?? 0}</td>
                  <td className="py-3">
                    <EntityActions onEdit={() => startEdit(item)} onDelete={() => handleDelete(item.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

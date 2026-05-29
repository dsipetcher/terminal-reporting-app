import React, { useEffect, useState } from 'react';
import { containersApi, warehousesApi, vesselCallsApi } from '../api';
import type { Container, Warehouse, VesselCall } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EntityActions } from '../components/EntityActions';
import {
  CARGO_GRADE_LABELS,
  CARGO_CATEGORY_LABELS,
  CARGO_BATCH_STATUS_LABELS,
  CUSTOMS_STATUS_LABELS,
  validateBatchNumber,
} from '../utils';

const emptyForm = {
  containerNumber: '',
  containerType: 'COAL_ANTHRACITE',
  cargoCategory: 'COAL',
  supplierName: '',
  quantityTons: '',
  status: 'IN_STORAGE',
  cargoDescription: '',
  grossWeight: '',
  sealNumber: '',
  vesselCallId: '',
  warehouseId: '',
  location: '',
  portOfLoading: '',
  portOfDischarge: '',
  blNumber: '',
  customsStatus: '',
};

export default function ContainersPage() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vesselCalls, setVesselCalls] = useState<VesselCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [movingId, setMovingId] = useState<number | null>(null);
  const [searchNumber, setSearchNumber] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [moveForm, setMoveForm] = useState({ warehouseId: '', location: '', status: 'IN_TERMINAL' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [containersData, warehousesData, vesselCallsData] = await Promise.all([
        containersApi.getAll(selectedStatus !== 'ALL' ? { status: selectedStatus } : undefined),
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

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (container: Container) => {
    setEditingId(container.id);
    setForm({
      containerNumber: container.containerNumber,
      containerType: container.containerType,
      cargoCategory: container.cargoCategory ?? 'COAL',
      supplierName: container.supplierName ?? '',
      quantityTons: container.quantityTons?.toString() ?? '',
      status: container.status,
      cargoDescription: container.cargoDescription ?? '',
      grossWeight: container.grossWeight?.toString() ?? '',
      sealNumber: container.sealNumber ?? '',
      vesselCallId: container.vesselCallId ? String(container.vesselCallId) : '',
      warehouseId: container.warehouseId ? String(container.warehouseId) : '',
      location: container.location ?? '',
      portOfLoading: container.portOfLoading ?? '',
      portOfDischarge: container.portOfDischarge ?? '',
      blNumber: container.blNumber ?? '',
      customsStatus: container.customsStatus ?? '',
    });
    setShowForm(true);
  };

  const buildPayload = () => ({
    containerNumber: form.containerNumber.toUpperCase(),
    containerType: form.containerType as Container['containerType'],
    cargoCategory: form.cargoCategory as Container['cargoCategory'],
    supplierName: form.supplierName || undefined,
    quantityTons: form.quantityTons ? parseFloat(form.quantityTons) : undefined,
    quantityUnit: 'TON',
    status: form.status as Container['status'],
    cargoDescription: form.cargoDescription || undefined,
    grossWeight: form.grossWeight ? parseFloat(form.grossWeight) : undefined,
    sealNumber: form.sealNumber || undefined,
    vesselCallId: form.vesselCallId ? Number(form.vesselCallId) : undefined,
    warehouseId: form.warehouseId ? Number(form.warehouseId) : undefined,
    location: form.location || undefined,
    portOfLoading: form.portOfLoading || undefined,
    portOfDischarge: form.portOfDischarge || undefined,
    blNumber: form.blNumber || undefined,
    customsStatus: form.customsStatus || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateBatchNumber(form.containerNumber)) {
      alert('Неверный номер партии (например COAL-2026-0001).');
      return;
    }

    try {
      if (editingId) {
        await containersApi.update(editingId, buildPayload());
      } else {
        await containersApi.create(buildPayload());
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving container:', error);
      alert(editingId ? 'Ошибка при обновлении партии' : 'Ошибка при создании партии');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить партию груза?')) return;

    try {
      await containersApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting container:', error);
      alert('Не удалось удалить партию.');
    }
  };

  const startMove = (container: Container) => {
    setMovingId(container.id);
    setMoveForm({
      warehouseId: container.warehouseId ? String(container.warehouseId) : '',
      location: container.location ?? '',
      status: container.status,
    });
  };

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingId) return;

    try {
      await containersApi.move(movingId, {
        warehouseId: moveForm.warehouseId ? Number(moveForm.warehouseId) : undefined,
        location: moveForm.location || undefined,
        status: moveForm.status,
      });
      setMovingId(null);
      loadData();
    } catch (error) {
      console.error('Error moving container:', error);
      alert('Ошибка при перемещении партии');
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
    } catch {
      alert('Партия не найдена');
      loadData();
    }
  };

  const filteredContainers = selectedStatus === 'ALL'
    ? containers
    : containers.filter(c => c.status === selectedStatus);

  if (loading) {
    return <LoadingSpinner text="Загрузка партий груза..." />;
  }

  return (
    <div>
      <PageHeader
        title="Партии груза (уголь / нефть)"
        subtitle={`Учётные единицы ИЛС · всего: ${containers.length}`}
        action={
          <button
            onClick={() => {
              if (showForm && !editingId) resetForm();
              else { setEditingId(null); setForm(emptyForm); setShowForm(!showForm); }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Отменить' : '+ Новая партия'}
          </button>
        }
      />

      {showForm && (
        <Card className="mb-6" title={editingId ? 'Редактирование партии' : 'Новая партия груза'}>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Номер партии *</label>
              <input
                type="text"
                value={form.containerNumber}
                onChange={(e) => setForm({ ...form, containerNumber: e.target.value.toUpperCase() })}
                className="input-field"
                placeholder="COAL-2026-0001"
                required
                disabled={!!editingId}
              />
            </div>

            <div>
              <label className="label-field">Категория груза *</label>
              <select value={form.cargoCategory} onChange={(e) => setForm({ ...form, cargoCategory: e.target.value })} className="input-field" required>
                {Object.entries(CARGO_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Марка / сорт *</label>
              <select value={form.containerType} onChange={(e) => setForm({ ...form, containerType: e.target.value })} className="input-field" required>
                {Object.entries(CARGO_GRADE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Поставщик (шахта / НПЗ)</label>
              <input type="text" value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} className="input-field" placeholder="АО «Кузбассуголь»" />
            </div>

            <div>
              <label className="label-field">Объём, т</label>
              <input type="number" step="0.1" value={form.quantityTons} onChange={(e) => setForm({ ...form, quantityTons: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label-field">Статус *</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input-field" required>
                {Object.entries(CARGO_BATCH_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Вес брутто (тонн)</label>
              <input type="number" step="0.1" value={form.grossWeight} onChange={(e) => setForm({ ...form, grossWeight: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label-field">Судозаход (отгрузка на флот)</label>
              <select value={form.vesselCallId} onChange={(e) => setForm({ ...form, vesselCallId: e.target.value })} className="input-field">
                <option value="">Не выбран</option>
                {vesselCalls.map((vc) => (
                  <option key={vc.id} value={vc.id}>{vc.vessel.name} - {vc.voyageNumber}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Склад</label>
              <select value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} className="input-field">
                <option value="">Не выбран</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.number} {w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Местоположение (блок-ряд-ярус)</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="A-12-3" />
            </div>

            <div>
              <label className="label-field">Порт погрузки</label>
              <input type="text" value={form.portOfLoading} onChange={(e) => setForm({ ...form, portOfLoading: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label-field">Порт выгрузки</label>
              <input type="text" value={form.portOfDischarge} onChange={(e) => setForm({ ...form, portOfDischarge: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label-field">Номер коносамента</label>
              <input type="text" value={form.blNumber} onChange={(e) => setForm({ ...form, blNumber: e.target.value })} className="input-field" />
            </div>

            <div>
              <label className="label-field">Таможенный статус</label>
              <select value={form.customsStatus} onChange={(e) => setForm({ ...form, customsStatus: e.target.value })} className="input-field">
                <option value="">Не указан</option>
                {Object.entries(CUSTOMS_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Описание груза</label>
              <input type="text" value={form.cargoDescription} onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })} className="input-field" />
            </div>

            <div className="md:col-span-2 flex gap-4">
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editingId ? 'Сохранить' : 'Создать партию'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">
                Отмена
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="label-field">Поиск по номеру:</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value.toUpperCase())}
              placeholder="COAL-2026-0001"
              className="flex-1 border border-slate-600 rounded-lg px-4 py-2"
            />
            <button onClick={handleSearch} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Найти</button>
            <button onClick={() => { setSearchNumber(''); loadData(); }} className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600">Сбросить</button>
          </div>
        </div>

        <div>
          <label className="label-field">Фильтр по статусу:</label>
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); }}
            className="border border-slate-600 rounded-lg px-4 py-2"
          >
            <option value="ALL">Все статусы</option>
            {Object.entries(CARGO_BATCH_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContainers.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <p className="text-center text-subtle py-8">Нет партий груза</p>
          </Card>
        ) : (
          filteredContainers.map((container) => (
            <Card key={container.id} className="hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-primary">{container.containerNumber}</h3>
                  <p className="text-sm text-muted">
                    {CARGO_CATEGORY_LABELS[container.cargoCategory ?? 'COAL']} · {CARGO_GRADE_LABELS[container.containerType]}
                  </p>
                  {container.supplierName && <p className="text-xs text-subtle">{container.supplierName}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={container.status} label={CARGO_BATCH_STATUS_LABELS[container.status]} />
                  <EntityActions onEdit={() => startEdit(container)} onDelete={() => handleDelete(container.id)} />
                </div>
              </div>

              <div className="space-y-2">
                {(container.quantityTons ?? container.grossWeight) && (
                  <p className="text-sm"><span className="text-subtle">Объём:</span> {container.quantityTons ?? container.grossWeight} т</p>
                )}
                {container.cargoDescription && <p className="text-sm"><span className="text-subtle">Описание:</span> {container.cargoDescription}</p>}
                {container.warehouse && <p className="text-sm"><span className="text-subtle">Склад:</span> {container.warehouse.number}</p>}
                {container.location && <p className="text-sm"><span className="text-subtle">Место:</span> {container.location}</p>}
                {container.vesselCall && <p className="text-sm"><span className="text-subtle">Судно:</span> {container.vesselCall.vessel.name}</p>}
                {container.portOfLoading && <p className="text-sm"><span className="text-subtle">POL:</span> {container.portOfLoading}</p>}
                {container.portOfDischarge && <p className="text-sm"><span className="text-subtle">POD:</span> {container.portOfDischarge}</p>}
                {container.blNumber && <p className="text-sm"><span className="text-subtle">B/L:</span> {container.blNumber}</p>}
                {container.customsStatus && <p className="text-sm"><span className="text-subtle">Таможня:</span> {CUSTOMS_STATUS_LABELS[container.customsStatus] ?? container.customsStatus}</p>}
              </div>

              {movingId === container.id ? (
                <form onSubmit={handleMove} className="mt-4 pt-4 border-t border-default space-y-3">
                  <p className="text-sm font-medium">Перемещение на склад / к причалу</p>
                  <select value={moveForm.warehouseId} onChange={(e) => setMoveForm({ ...moveForm, warehouseId: e.target.value })} className="input-field">
                    <option value="">Без склада</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.number} {w.name}</option>
                    ))}
                  </select>
                  <input type="text" value={moveForm.location} onChange={(e) => setMoveForm({ ...moveForm, location: e.target.value })} className="input-field" placeholder="A-12-3" />
                  <select value={moveForm.status} onChange={(e) => setMoveForm({ ...moveForm, status: e.target.value })} className="input-field">
                    {Object.entries(CARGO_BATCH_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">Переместить</button>
                    <button type="button" onClick={() => setMovingId(null)} className="px-3 py-1 text-sm bg-gray-200 dark:bg-slate-700 rounded">Отмена</button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => startMove(container)}
                  className="mt-4 w-full px-3 py-1.5 text-sm bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/60"
                >
                  Переместить
                </button>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

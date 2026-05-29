import { useEffect, useState } from 'react';
import { infoFlowsApi, materialFlowsApi } from '../api';
import type { InfoFlowEvent, MaterialFlow } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { StatusBadge } from '../components/StatusBadge';
import {
  formatDateTime,
  ILS_FUNCTION_LABELS,
  MATERIAL_FLOW_TYPE_LABELS,
  TRANSPORT_MODE_LABELS,
} from '../utils';

export default function FlowsPage() {
  const [tab, setTab] = useState<'info' | 'material'>('info');
  const [infoEvents, setInfoEvents] = useState<InfoFlowEvent[]>([]);
  const [materialFlows, setMaterialFlows] = useState<MaterialFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ilsFilter, setIlsFilter] = useState('ALL');

  const load = async () => {
    try {
      setLoading(true);
      const [info, material] = await Promise.all([
        infoFlowsApi.getAll({
          ilsFunction: ilsFilter !== 'ALL' ? ilsFilter : undefined,
          limit: 100,
        }),
        materialFlowsApi.getAll(),
      ]);
      setInfoEvents(info);
      setMaterialFlows(material);
    } catch (error) {
      console.error('Ошибка загрузки потоков:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [ilsFilter]);

  if (loading) return <LoadingSpinner text="Загрузка потоков..." />;

  return (
    <div>
      <PageHeader
        title="Информационные и материальные потоки"
        subtitle="Согласование движения грузов и информации в рамках ИЛС"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setTab('info')}
          className={`px-4 py-2 rounded-lg ${tab === 'info' ? 'bg-blue-600 text-white' : 'border border-default'}`}
        >
          Информационные потоки
        </button>
        <button
          onClick={() => setTab('material')}
          className={`px-4 py-2 rounded-lg ${tab === 'material' ? 'bg-blue-600 text-white' : 'border border-default'}`}
        >
          Материальные потоки
        </button>
      </div>

      {tab === 'info' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {['ALL', 'PLANNING', 'REGULATION', 'CONTROL', 'ANALYSIS', 'ACCOUNTING'].map((fn) => (
              <button
                key={fn}
                onClick={() => setIlsFilter(fn)}
                className={`px-3 py-1 rounded-full text-sm ${
                  ilsFilter === fn ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-800'
                }`}
              >
                {fn === 'ALL' ? 'Все функции' : ILS_FUNCTION_LABELS[fn]}
              </button>
            ))}
          </div>
          <Card>
            {infoEvents.length === 0 ? (
              <p className="text-subtle text-center py-8">Событий нет</p>
            ) : (
              <div className="space-y-3">
                {infoEvents.map((ev) => (
                  <div key={ev.id} className="border-l-4 border-indigo-500 pl-4 py-2 hover-surface rounded-r-lg">
                    <div className="flex justify-between gap-4">
                      <div>
                        <StatusBadge
                          status={ev.ilsFunction}
                          label={ILS_FUNCTION_LABELS[ev.ilsFunction]}
                        />
                        <p className="text-primary mt-1">{ev.message}</p>
                        <p className="text-xs text-subtle mt-1">
                          {ev.entityType}
                          {ev.order && ` · заказ ${ev.order.orderNumber}`}
                          {ev.user && ` · ${ev.user.fullName || ev.user.username}`}
                        </p>
                      </div>
                      <span className="text-xs text-muted whitespace-nowrap">
                        {formatDateTime(ev.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {tab === 'material' && (
        <Card>
          {materialFlows.length === 0 ? (
            <p className="text-subtle text-center py-8">Движений грузов нет</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default text-left text-muted">
                    <th className="py-2 pr-4">Тип</th>
                    <th className="py-2 pr-4">Транспорт</th>
                    <th className="py-2 pr-4">Маршрут</th>
                    <th className="py-2 pr-4">Кол-во</th>
                    <th className="py-2 pr-4">Заказ</th>
                    <th className="py-2">Время</th>
                  </tr>
                </thead>
                <tbody>
                  {materialFlows.map((flow) => (
                    <tr key={flow.id} className="border-b border-default hover-surface">
                      <td className="py-3 pr-4">{MATERIAL_FLOW_TYPE_LABELS[flow.flowType]}</td>
                      <td className="py-3 pr-4">{TRANSPORT_MODE_LABELS[flow.transportMode]}</td>
                      <td className="py-3 pr-4 text-muted">
                        {flow.fromLocation || '—'} → {flow.toLocation || '—'}
                      </td>
                      <td className="py-3 pr-4">
                        {flow.quantity != null ? `${flow.quantity} ${flow.unit || ''}` : '—'}
                      </td>
                      <td className="py-3 pr-4">{flow.order?.orderNumber ?? '—'}</td>
                      <td className="py-3">{formatDateTime(flow.performedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

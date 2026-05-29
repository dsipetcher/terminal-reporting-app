import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { directoriesApi } from '../api';
import type { PortDirectory, CargoDirectory } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { DIRECTORY_CARGO_CATEGORY_LABELS } from '../utils';

const CARGO_CATEGORY_LABELS = DIRECTORY_CARGO_CATEGORY_LABELS;

export default function DirectoriesPage() {
  const [searchParams] = useSearchParams();
  const portCodeParam = searchParams.get('code')?.trim().toUpperCase() ?? null;
  const tabParam = searchParams.get('tab');

  const [tab, setTab] = useState<'ports' | 'cargo'>(tabParam === 'cargo' ? 'cargo' : 'ports');
  const [ports, setPorts] = useState<PortDirectory[]>([]);
  const [cargo, setCargo] = useState<CargoDirectory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabParam === 'ports' || portCodeParam) setTab('ports');
    else if (tabParam === 'cargo') setTab('cargo');
  }, [tabParam, portCodeParam]);

  useEffect(() => {
    if (!portCodeParam || ports.length === 0) return;
    const row = document.getElementById(`port-code-${portCodeParam}`);
    row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [portCodeParam, ports]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [portsData, cargoData] = await Promise.all([
          directoriesApi.getPorts(),
          directoriesApi.getCargo(),
        ]);
        setPorts(portsData);
        setCargo(cargoData);
      } catch (error) {
        console.error('Ошибка загрузки справочников:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <LoadingSpinner text="Загрузка справочников НСИ..." />;

  return (
    <div>
      <PageHeader
        title="Справочники НСИ"
        subtitle="Порты и виды груза — обеспечивающая подсистема ИЛС"
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setTab('ports')}
          className={`px-4 py-2 rounded-lg ${tab === 'ports' ? 'bg-blue-600 text-white' : 'border border-default'}`}
        >
          Порты
        </button>
        <button
          onClick={() => setTab('cargo')}
          className={`px-4 py-2 rounded-lg ${tab === 'cargo' ? 'bg-blue-600 text-white' : 'border border-default'}`}
        >
          Виды груза
        </button>
      </div>

      {tab === 'ports' && (
        <Card>
          {ports.length === 0 ? (
            <p className="text-subtle text-center py-8">Справочник портов пуст</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default text-left text-muted">
                    <th className="py-2 pr-4">Код</th>
                    <th className="py-2 pr-4">Наименование</th>
                    <th className="py-2">Страна</th>
                  </tr>
                </thead>
                <tbody>
                  {ports.map((port) => {
                    const highlighted =
                      portCodeParam != null && port.code.toUpperCase() === portCodeParam;
                    return (
                      <tr
                        key={port.id}
                        id={`port-code-${port.code.toUpperCase()}`}
                        className={`border-b border-default hover-surface ${
                          highlighted
                            ? 'ring-2 ring-inset ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                            : ''
                        }`}
                      >
                        <td className="py-3 pr-4 font-mono font-semibold">{port.code}</td>
                        <td className="py-3 pr-4">{port.name}</td>
                        <td className="py-3">{port.country ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'cargo' && (
        <Card>
          {cargo.length === 0 ? (
            <p className="text-subtle text-center py-8">Справочник видов груза пуст</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default text-left text-muted">
                    <th className="py-2 pr-4">Код</th>
                    <th className="py-2 pr-4">Наименование</th>
                    <th className="py-2">Категория</th>
                  </tr>
                </thead>
                <tbody>
                  {cargo.map((item) => (
                    <tr key={item.id} className="border-b border-default hover-surface">
                      <td className="py-3 pr-4 font-mono font-semibold">{item.code}</td>
                      <td className="py-3 pr-4">{item.name}</td>
                      <td className="py-3">
                        {CARGO_CATEGORY_LABELS[item.category] ?? item.category}
                      </td>
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

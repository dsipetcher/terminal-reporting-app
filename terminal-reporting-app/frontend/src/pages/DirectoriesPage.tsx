import { useEffect, useState } from 'react';
import { directoriesApi } from '../api';
import type { PortDirectory, CargoDirectory } from '../types';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';

const CARGO_CATEGORY_LABELS: Record<string, string> = {
  BULK: 'Навал',
  LIQUID: 'Налив',
  CONTAINERIZED: 'Контейнер',
  GENERAL: 'Генеральный',
  DANGEROUS: 'Опасный',
};

export default function DirectoriesPage() {
  const [tab, setTab] = useState<'ports' | 'cargo'>('ports');
  const [ports, setPorts] = useState<PortDirectory[]>([]);
  const [cargo, setCargo] = useState<CargoDirectory[]>([]);
  const [loading, setLoading] = useState(true);

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
        subtitle="Порты и виды груза — обеспечивающая подсистема ИЛС (FR-17)"
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
                  {ports.map((port) => (
                    <tr key={port.id} className="border-b border-default hover-surface">
                      <td className="py-3 pr-4 font-mono font-semibold">{port.code}</td>
                      <td className="py-3 pr-4">{port.name}</td>
                      <td className="py-3">{port.country ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {tab === 'cargo' && (
        <Card>
          {cargo.length === 0 ? (
            <p className="text-subtle text-center py-8">Справочник грузов пуст</p>
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
                      <td className="py-3">{CARGO_CATEGORY_LABELS[item.category] ?? item.category}</td>
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

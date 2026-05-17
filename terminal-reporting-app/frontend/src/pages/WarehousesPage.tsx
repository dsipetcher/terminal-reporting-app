import { useEffect, useState } from 'react';
import axios from 'axios';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { WAREHOUSE_TYPE_LABELS } from '../utils';

type Warehouse = {
  id: number;
  number: string;
  name?: string;
  capacity: number;
  warehouseType: string;
  zone?: string;
  load?: number;
  _count?: {
    wagons: number;
    containers: number;
  };
};

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number>(0);
  const [warehouseType, setWarehouseType] = useState('OPEN_YARD');
  const [showForm, setShowForm] = useState(false);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3001/api/warehouses');
      setWarehouses(res.data);
    } catch (error) {
      console.error('Ошибка при загрузке складов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleAddWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!number || capacity <= 0) return;

    try {
      await axios.post('http://localhost:3001/api/warehouses', {
        number,
        name: name || undefined,
        capacity,
        warehouseType,
      });

      setNumber('');
      setName('');
      setCapacity(0);
      setWarehouseType('OPEN_YARD');
      setShowForm(false);
      fetchWarehouses();
    } catch (err) {
      console.error('Ошибка при добавлении склада:', err);
      alert('Ошибка при добавлении склада');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Загрузка складов..." />;
  }

  return (
    <div>
      <PageHeader 
        title="Управление складами" 
        subtitle={`Всего: ${warehouses.length} складов`}
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Отменить' : '+ Новый склад'}
          </button>
        }
      />

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleAddWarehouse} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер склада *
              </label>
              <input
                type="text"
                placeholder="Номер склада"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название
              </label>
              <input
                type="text"
                placeholder="Название (опционально)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Вместимость (тонн) *
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Вместимость"
                value={capacity || ''}
                onChange={(e) => setCapacity(parseFloat(e.target.value) || 0)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тип склада *
              </label>
              <select
                value={warehouseType}
                onChange={(e) => setWarehouseType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(WAREHOUSE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Добавить склад
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <p className="text-center text-gray-500 py-8">Нет данных</p>
          </Card>
        ) : (
          warehouses.map((w) => {
            const loadPercentage = w.load ? (w.load / w.capacity) * 100 : 0;
            const freeSpace = w.capacity - (w.load || 0);
            
            return (
              <Card key={w.id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">№{w.number}</h3>
                    {w.name && (
                      <p className="text-sm text-gray-600">{w.name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {WAREHOUSE_TYPE_LABELS[w.warehouseType]}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Заполненность</span>
                      <span className="font-medium">{loadPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          loadPercentage > 90 ? 'bg-red-500' :
                          loadPercentage > 70 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(loadPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Вместимость</p>
                      <p className="font-semibold">{w.capacity.toFixed(1)} т</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Загружено</p>
                      <p className="font-semibold">{(w.load || 0).toFixed(1)} т</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Свободно</p>
                      <p className="font-semibold text-green-600">{freeSpace.toFixed(1)} т</p>
                    </div>
                  </div>

                  {w._count && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Вагонов:</span>
                        <span className="font-medium">{w._count.wagons}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Контейнеров:</span>
                        <span className="font-medium">{w._count.containers}</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

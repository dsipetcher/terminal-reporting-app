import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileBarChart, Download, RefreshCw, Printer } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { LoadingSpinner } from '../components/LoadingSpinner';
import {
  REPORT_DEFINITIONS,
  generateReport,
  getReportDefinition,
  type ReportTypeId,
  type ReportResult,
} from '../lib/reports';
import { downloadCsv } from '../lib/exportCsv';
import { formatDateTime } from '../utils';

function defaultFromDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultToDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as ReportTypeId) || 'terminal-summary';

  const [reportType, setReportType] = useState<ReportTypeId>(
    getReportDefinition(initialType) ? initialType : 'terminal-summary'
  );
  const [fromDate, setFromDate] = useState(defaultFromDate());
  const [toDate, setToDate] = useState(defaultToDate());
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDef = getReportDefinition(reportType)!;

  useEffect(() => {
    setSearchParams({ type: reportType }, { replace: true });
  }, [reportType, setSearchParams]);

  const handleGenerate = async () => {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    if (from > to) {
      setError('Дата начала не может быть позже даты окончания');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const report = await generateReport(reportType, from, to);
      setResult(report);
    } catch (e) {
      console.error(e);
      setError('Не удалось сформировать отчёт');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const safeTitle = result.title.replace(/\s+/g, '_');
    const dateStamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`${safeTitle}_${dateStamp}.csv`, result.headers, result.rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="reports-page">
      <PageHeader
        title="Отчётность ИЛС"
        subtitle="Составление и выгрузка отчётов"
        action={
          result && (
            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Download className="w-4 h-4" />
                Скачать CSV
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 border border-default rounded-lg hover-surface text-sm"
              >
                <Printer className="w-4 h-4" />
                Печать
              </button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 print:hidden">
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            Параметры отчёта
          </h3>

          <label className="block text-sm text-secondary mb-1">Тип отчёта</label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value as ReportTypeId);
              setResult(null);
            }}
            className="w-full mb-4 px-3 py-2 border border-default rounded-lg bg-surface text-primary"
          >
            {REPORT_DEFINITIONS.map((def) => (
              <option key={def.id} value={def.id}>
                {def.title}
              </option>
            ))}
          </select>

          <p className="text-xs text-subtle mb-4">{selectedDef.description}</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-sm text-secondary mb-1">С</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-lg bg-surface text-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-secondary mb-1">По</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-default rounded-lg bg-surface text-primary"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileBarChart className="w-4 h-4" />
            )}
            Сформировать отчёт
          </button>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
            Доступные отчёты
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REPORT_DEFINITIONS.map((def) => (
              <button
                key={def.id}
                type="button"
                onClick={() => {
                  setReportType(def.id);
                  setResult(null);
                }}
                className={`text-left p-3 rounded-lg border transition-all ${
                  reportType === def.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                    : 'border-default hover-surface'
                }`}
              >
                <p className="font-medium text-sm text-primary">{def.title}</p>
                <p className="text-xs text-subtle mt-1">{def.description}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {loading && <LoadingSpinner text="Формирование отчёта..." />}

      {!loading && result && (
        <Card title={result.title}>
          <div className="mb-4 text-sm text-muted space-y-1">
            <p>
              <strong className="text-secondary">Период:</strong> {result.periodLabel}
            </p>
            <p>
              <strong className="text-secondary">Сформирован:</strong>{' '}
              {formatDateTime(result.generatedAt)}
            </p>
            {result.summary && (
              <p>
                <strong className="text-secondary">Итого:</strong> {result.summary}
              </p>
            )}
          </div>

          {result.rows.length === 0 ? (
            <p className="text-center text-subtle py-8">Нет данных за выбранный период</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default">
                    {result.headers.map((h) => (
                      <th key={h} className="text-left py-2 pr-4 font-semibold text-secondary">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i} className="border-b border-default last:border-0 hover-surface">
                      {row.map((cell, j) => (
                        <td key={j} className="py-2 pr-4 text-primary">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {!loading && !result && (
        <Card>
          <p className="text-center text-subtle py-12">
            Выберите тип отчёта, укажите период и нажмите «Сформировать отчёт»
          </p>
        </Card>
      )}
    </div>
  );
}

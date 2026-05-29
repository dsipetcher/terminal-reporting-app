import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Trash2, Upload, X } from 'lucide-react';
import { logisticsOrderDocumentsApi } from '../../api';
import type { LogisticsOrder, LogisticsOrderDocument, OrderDocumentType } from '../../types';
import { LoadingSpinner } from '../LoadingSpinner';
import {
  ORDER_DOCUMENT_TYPE_LABELS,
  formatDateTime,
  formatFileSize,
} from '../../utils';

const DOCUMENT_TYPES = Object.keys(ORDER_DOCUMENT_TYPE_LABELS) as OrderDocumentType[];

interface OrderDocumentsPanelProps {
  order: LogisticsOrder;
  onClose: () => void;
}

export function OrderDocumentsPanel({ order, onClose }: OrderDocumentsPanelProps) {
  const [documents, setDocuments] = useState<LogisticsOrderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<OrderDocumentType>('OTHER');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await logisticsOrderDocumentsApi.getAll(order.id);
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await logisticsOrderDocumentsApi.upload(order.id, file, {
        documentType,
        description: description.trim() || undefined,
      });
      setDescription('');
      setDocumentType('OTHER');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Не удалось загрузить документ');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: LogisticsOrderDocument) => {
    try {
      await logisticsOrderDocumentsApi.download(order.id, doc.id, doc.fileName);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Не удалось скачать документ');
    }
  };

  const handleDelete = async (doc: LogisticsOrderDocument) => {
    if (!confirm(`Удалить документ «${doc.fileName}»?`)) return;
    try {
      await logisticsOrderDocumentsApi.delete(order.id, doc.id);
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Не удалось удалить документ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl dark:bg-slate-900">
        <div className="flex items-start justify-between border-b border-default px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-primary">Документы заказа</h2>
            <p className="text-sm text-subtle">{order.orderNumber}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-subtle hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          <div className="mb-6 rounded-lg border border-dashed border-slate-300 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/40">
            <p className="mb-3 text-sm font-medium text-primary">Прикрепить документ</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label-field">Тип документа</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as OrderDocumentType)}
                  className="input-field"
                >
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {ORDER_DOCUMENT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Комментарий (необязательно)</label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  placeholder="Например, подписанный экземпляр"
                />
              </div>
            </div>
            <div className="mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
                id={`order-doc-upload-${order.id}`}
              />
              <label
                htmlFor={`order-doc-upload-${order.id}`}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm text-white transition-colors ${
                  uploading
                    ? 'cursor-not-allowed bg-blue-400'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Загрузка…' : 'Выбрать файл'}
              </label>
              <p className="mt-2 text-xs text-subtle">
                PDF, Word, Excel, изображения или текст · до 15 МБ
              </p>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner text="Загрузка документов..." />
          ) : documents.length === 0 ? (
            <div className="py-8 text-center text-subtle">
              <FileText className="mx-auto mb-2 h-10 w-10 opacity-40" />
              <p>К заказу пока не прикреплено документов</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-default p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-primary truncate">{doc.fileName}</p>
                    <p className="text-xs text-subtle mt-0.5">
                      {ORDER_DOCUMENT_TYPE_LABELS[doc.documentType ?? 'OTHER']}
                      {' · '}
                      {formatFileSize(doc.fileSize)}
                      {' · '}
                      {formatDateTime(doc.uploadedAt)}
                    </p>
                    {doc.description && (
                      <p className="text-sm text-muted mt-1">{doc.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      title="Скачать"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(doc)}
                      className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

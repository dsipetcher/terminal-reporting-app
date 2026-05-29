import { Pencil, Trash2, Paperclip } from 'lucide-react';

interface EntityActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onDocuments?: () => void;
  documentsCount?: number;
  className?: string;
}

export function EntityActions({
  onEdit,
  onDelete,
  onDocuments,
  documentsCount,
  className = '',
}: EntityActionsProps) {
  if (!onEdit && !onDelete && !onDocuments) return null;

  return (
    <div className={`flex gap-1 ${className}`}>
      {onDocuments && (
        <button
          type="button"
          onClick={onDocuments}
          className="relative p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
          title="Документы"
        >
          <Paperclip className="w-4 h-4" />
          {documentsCount != null && documentsCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-medium text-white">
              {documentsCount}
            </span>
          )}
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
          title="Редактировать"
        >
          <Pencil className="w-4 h-4" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
          title="Удалить"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

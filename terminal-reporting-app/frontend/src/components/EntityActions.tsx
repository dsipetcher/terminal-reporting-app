import { Pencil, Trash2 } from 'lucide-react';

interface EntityActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function EntityActions({ onEdit, onDelete, className = '' }: EntityActionsProps) {
  if (!onEdit && !onDelete) return null;

  return (
    <div className={`flex gap-1 ${className}`}>
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

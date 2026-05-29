import { useState, type ReactNode } from 'react';
import { ChevronDown, type LucideIcon } from 'lucide-react';

interface CargoAccordionSectionProps {
  id: string;
  title: string;
  icon: LucideIcon;
  summary?: string;
  defaultOpen?: boolean;
  highlight?: boolean;
  children: ReactNode;
}

export function CargoAccordionSection({
  id,
  title,
  icon: Icon,
  summary,
  defaultOpen = false,
  highlight = false,
  children,
}: CargoAccordionSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      id={id}
      className={`border rounded-lg overflow-hidden ${
        highlight ? 'border-amber-400 dark:border-amber-600' : 'border-default'
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
          highlight
            ? 'bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50'
            : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${highlight ? 'text-amber-600' : 'text-blue-500'}`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-primary">{title}</p>
          {summary && !open && (
            <p className="text-xs text-muted truncate mt-0.5">{summary}</p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-4 py-3 border-t border-default bg-surface">{children}</div>}
    </div>
  );
}

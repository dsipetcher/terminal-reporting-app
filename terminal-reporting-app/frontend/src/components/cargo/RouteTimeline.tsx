import type { RouteStage } from '../../types';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../StatusBadge';
import { ROUTE_STAGE_TYPE_LABELS, ROUTE_STAGE_STATUS_LABELS, getTransportModeLabel } from '../../utils';
import { ChevronRight } from 'lucide-react';

export function RouteTimeline({
  stages,
  currentStageId,
  compact = false,
  getStageHref,
}: {
  stages: RouteStage[];
  currentStageId?: number;
  compact?: boolean;
  getStageHref?: (stage: RouteStage) => string | undefined;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {stages.map((stage) => {
          const isCurrent = stage.id === currentStageId || stage.status === 'CURRENT';
          const isDone = stage.status === 'COMPLETED';
          const href = getStageHref?.(stage);
          const className = `text-[10px] px-2 py-0.5 rounded-full font-medium ${
            isDone
              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
              : isCurrent
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          } ${href ? 'hover:ring-2 hover:ring-blue-400 cursor-pointer' : ''}`;

          const label = `${stage.sequence}. ${ROUTE_STAGE_TYPE_LABELS[stage.stageType]}`;

          if (href) {
            return (
              <Link
                key={stage.id}
                to={href}
                title={`${stage.locationName} — перейти к разделу`}
                className={className}
              >
                {label}
              </Link>
            );
          }

          return (
            <span key={stage.id} title={stage.locationName} className={className}>
              {label}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 md:flex-row md:items-start md:gap-2 py-2 overflow-x-auto">
      {stages.map((stage, index) => {
        const isCurrent = stage.id === currentStageId || stage.status === 'CURRENT';
        const isDone = stage.status === 'COMPLETED';
        return (
          <div
            key={stage.id}
            className="flex md:flex-col items-start md:items-center min-w-[120px] flex-1"
          >
            <div className="flex md:flex-col items-center gap-2 w-full">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  isDone
                    ? 'bg-green-600 text-white'
                    : isCurrent
                      ? 'bg-amber-500 text-white ring-4 ring-amber-200 dark:ring-amber-900'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {stage.sequence}
              </div>
              {index < stages.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block rotate-90 md:rotate-0" />
              )}
            </div>
            <div className="ml-2 md:ml-0 md:mt-1 md:text-center flex-1">
              <p className="text-[10px] font-semibold text-primary">
                {ROUTE_STAGE_TYPE_LABELS[stage.stageType]}
              </p>
              <p className="text-xs font-medium">{stage.locationName}</p>
              {stage.transportMode && (
                <p className="text-[10px] text-subtle">
                  {getTransportModeLabel(stage.transportMode)}
                </p>
              )}
              <StatusBadge status={stage.status} label={ROUTE_STAGE_STATUS_LABELS[stage.status]} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

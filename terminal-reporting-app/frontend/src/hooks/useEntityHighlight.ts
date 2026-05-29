import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { entityDomId } from '../lib/entityLinks';

export function useEntityHighlight(entityIds: number[]) {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get('highlight');
  const highlightId = raw && !Number.isNaN(Number(raw)) ? Number(raw) : null;
  const scrolledRef = useRef<number | null>(null);

  useEffect(() => {
    if (!highlightId || !entityIds.includes(highlightId)) return;
    if (scrolledRef.current === highlightId) return;
    scrolledRef.current = highlightId;

    const timer = window.setTimeout(() => {
      document.getElementById(entityDomId(highlightId))?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [highlightId, entityIds]);

  const isHighlighted = (id: number) => highlightId === id;

  const highlightClass = (id: number) =>
    isHighlighted(id)
      ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-950 shadow-lg'
      : '';

  return { highlightId, isHighlighted, highlightClass };
}

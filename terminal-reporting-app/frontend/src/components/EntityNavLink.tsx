import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';

export function EntityNavLink({
  to,
  children,
  className = '',
}: {
  to: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline underline-offset-2 ${className}`}
    >
      {children}
      <ExternalLink className="w-3 h-3 shrink-0 opacity-60" aria-hidden />
    </Link>
  );
}

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  HOME_LINK,
  REPORTS_LINK,
  NAV_GROUPS,
  ADMIN_LINK,
  findGroupForPath,
} from '../config/navConfig';

interface SidebarNavProps {
  isAdmin: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ isAdmin, onNavigate }: SidebarNavProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const activeGroup = findGroupForPath(currentPath);
    const initial: Record<string, boolean> = {};
    for (const group of NAV_GROUPS) {
      initial[group.id] = group.defaultOpen ?? group.id === activeGroup;
    }
    return initial;
  });

  useEffect(() => {
    const activeGroup = findGroupForPath(currentPath);
    if (activeGroup) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup]: true }));
    }
  }, [currentPath]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const linkClass = (to: string) => {
    const active = currentPath === to || (to !== '/' && currentPath.startsWith(to));
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
      active
        ? 'bg-blue-600/20 text-white font-medium'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;
  };

  const renderLink = (to: string, label: string, Icon: typeof HOME_LINK.icon) => (
    <Link key={to} to={to} className={linkClass(to)} onClick={onNavigate}>
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );

  return (
    <nav className="flex-1 overflow-y-auto p-3 min-h-0 space-y-1">
      {renderLink(HOME_LINK.to, HOME_LINK.label, HOME_LINK.icon)}
      {renderLink(REPORTS_LINK.to, REPORTS_LINK.label, REPORTS_LINK.icon)}

      {NAV_GROUPS.map((group) => {
        const isOpen = openGroups[group.id] ?? false;
        const GroupIcon = group.icon;
        const hasActiveChild = group.items.some((item) => currentPath === item.to);

        return (
          <div key={group.id} className="pt-2">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                hasActiveChild
                  ? 'text-white bg-slate-800/80'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 shrink-0" />
              )}
              <GroupIcon className="w-4 h-4 shrink-0" />
              <span className="text-left">{group.label}</span>
            </button>

            {isOpen && (
              <div className="mt-1 ml-3 pl-3 border-l border-slate-700 space-y-0.5">
                {group.items.map((item) => renderLink(item.to, item.label, item.icon))}
              </div>
            )}
          </div>
        );
      })}

      {isAdmin && (
        <div className="pt-3 mt-2 border-t border-slate-800">
          {renderLink(ADMIN_LINK.to, ADMIN_LINK.label, ADMIN_LINK.icon)}
        </div>
      )}
    </nav>
  );
}

export default SidebarNav;

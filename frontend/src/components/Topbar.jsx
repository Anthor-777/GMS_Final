import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const TITLES = {
  '/': 'Dashboard',
  '/members': 'Members',
  '/plans': 'Membership Plans',
  '/subscriptions': 'Subscriptions',
  '/payments': 'Payments',
  '/attendance': 'Attendance',
  '/sessions': 'Sessions',
  '/trainers': 'Trainers',
  '/equipment': 'Equipment',
  '/maintenance': 'Maintenance Logs'
};

export default function Topbar({ pathname, search, onSearch }) {
  const { username, logout } = useAuth();
  const title = TITLES[pathname] || 'Pulse Gym';
  const initial = (username || 'A').slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-bg/80 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="pl-12 lg:pl-0">
        <p className="text-xs uppercase tracking-[0.18em] text-ink-muted">Pulse</p>
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        {onSearch && pathname !== '/' ? (
          <label className="relative hidden md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search this page"
              className="input-field w-56 pl-9"
            />
          </label>
        ) : null}
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-card px-2 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white">
            {initial}
          </div>
          <div className="hidden pr-1 sm:block">
            <p className="text-xs font-medium text-ink">{username || 'admin'}</p>
            <button type="button" onClick={logout} className="text-[11px] text-ink-muted hover:text-accent">
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

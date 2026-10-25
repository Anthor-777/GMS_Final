import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Repeat,
  Sparkles,
  Users,
  Wallet,
  Wrench,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/plans', label: 'Membership Plans', icon: CreditCard },
  { to: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/sessions', label: 'Sessions', icon: CalendarClock },
  { to: '/trainers', label: 'Trainers', icon: Dumbbell },
  { to: '/equipment', label: 'Equipment', icon: Wrench },
  { to: '/maintenance', label: 'Maintenance Logs', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: BarChart },
  { to: '/analytics', label: 'Analytics', icon: Sparkles }
];

function NavItems({ onNavigate }) {
  const { logout } = useAuth();
  return (
    <>
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient font-bold text-white shadow-glow">
          P
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-ink">Pulse Gym</p>
          <p className="text-xs text-ink-muted">Admin console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive ? 'bg-elevated text-ink' : 'text-ink-secondary hover:bg-elevated/60 hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive ? <span className="absolute left-0 h-6 w-1 rounded-r-full bg-accent" /> : null}
                  <Icon className={`h-4 w-4 ${isActive ? 'text-accent' : 'text-ink-muted group-hover:text-primary'}`} />
                  {link.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={logout}
        className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-secondary hover:bg-elevated hover:text-ink"
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </>
  );
}

export default function Sidebar({ open, setOpen }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-card px-4 py-6 lg:flex">
        <NavItems />
      </aside>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-xl border border-line bg-card p-2 text-ink lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-card px-4 py-6 lg:hidden"
            >
              <button
                type="button"
                className="mb-4 self-end rounded-lg p-1 text-ink-muted"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
              <NavItems onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}

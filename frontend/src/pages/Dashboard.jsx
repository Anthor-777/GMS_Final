import { AlertTriangle, CalendarClock, IndianRupee, Repeat, Users, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import api, { errorMessage } from '../api/axios';
import EmptyState from '../components/EmptyState.jsx';
import { CardSkeleton } from '../components/Loader.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatMoney, formatMonth } from '../utils.js';

export default function Dashboard() {
  const { push } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await api.post('/subscriptions/refresh-status');
        const { data: res } = await api.get('/dashboard');
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) push(errorMessage(err), 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [push]);

  const chart = (data?.revenueLast6Months || []).map((row) => ({
    month: formatMonth(row.month),
    revenue: Number(row.revenue) || 0
  }));

  return (
    <div className="space-y-6">
      {loading || !data ? (
        <CardSkeleton count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total members" value={data.totalMembers} icon={Users} delay={0.05} />
          <StatCard title="Active subscriptions" value={data.activeSubscriptions} icon={Repeat} delay={0.1} />
          <StatCard
            title="Revenue this month"
            value={data.revenueThisMonth}
            icon={IndianRupee}
            prefix="₹"
            decimals={2}
            delay={0.15}
            accent
          />
          <StatCard
            title="Maintenance cost this year"
            value={data.maintenanceCostThisYear}
            icon={Wrench}
            prefix="₹"
            decimals={2}
            delay={0.2}
          />
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-5 xl:col-span-2">
          <div className="mb-4">
            <h3 className="font-semibold">Revenue — last 6 months</h3>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="h-full animate-pulse rounded-2xl bg-elevated" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.75} />
                      <stop offset="100%" stopColor="#EC4899" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#2A2A3C" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#6B6B80" fontSize={12} />
                  <YAxis stroke="#6B6B80" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#13131C', border: '1px solid #2A2A3C', borderRadius: 12 }}
                    formatter={(v) => formatMoney(v)}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#EC4899" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <Panel title="Expiring subscriptions" icon={Repeat}>
          {!data?.expiringSubscriptions?.length ? (
            <EmptyState title="No plans ending this week" hint="Active subscriptions ending in 7 days appear here." />
          ) : (
            <ul className="space-y-3">
              {data.expiringSubscriptions.map((row) => (
                <li key={row.Sub_ID} className="rounded-xl bg-elevated px-3 py-2.5">
                  <p className="text-sm font-medium text-ink">{row.Member_Name}</p>
                  <p className="text-xs text-ink-muted">
                    {row.Plan_Name} · ends {row.End_Date}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Today's attendance" icon={Users}>
          <p className="text-3xl font-semibold text-ink">{data?.todaysAttendance ?? '—'}</p>
          <p className="mt-1 text-sm text-ink-muted">Check-ins recorded today</p>
        </Panel>
        <Panel title="Upcoming sessions" icon={CalendarClock}>
          {!data?.upcomingSessions?.length ? (
            <EmptyState title="No upcoming sessions" hint="Booked slots from now onward." />
          ) : (
            <ul className="space-y-3">
              {data.upcomingSessions.map((row) => (
                <li key={row.Session_ID} className="rounded-xl bg-elevated px-3 py-2.5">
                  <p className="text-sm font-medium text-ink">{row.Focus_Area}</p>
                  <p className="text-xs text-ink-muted">
                    {row.Member_Name} · {row.Trainer_Name}
                  </p>
                  <p className="text-xs text-primary">{row.Slot_DateTime}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Equipment alerts" icon={AlertTriangle}>
          {!data?.equipmentAlerts?.length ? (
            <EmptyState title="All equipment is healthy" hint="Poor and Out of Order items show here." />
          ) : (
            <ul className="space-y-3">
              {data.equipmentAlerts.map((row) => (
                <li key={row.Equip_ID} className="flex items-center justify-between rounded-xl bg-elevated px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-ink">{row.Name}</p>
                    <p className="text-xs text-ink-muted">{row.Category}</p>
                  </div>
                  <StatusBadge value={row.Condition} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-accent" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

import { BarChart3, CalendarClock, CreditCard, Dumbbell, Users, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import api, { errorMessage } from '../api/axios';
import DataTable from '../components/DataTable.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatMoney } from '../utils.js';

export default function Reports() {
  const { push } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/reports');
        if (!cancelled) setData(res.data.data);
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

  const planColumns = [
    { key: 'Plan_ID', label: 'ID' },
    { key: 'Plan_Name', label: 'Plan Name' },
    { key: 'Fee', label: 'Fee', render: (r) => formatMoney(r.Fee) },
    { key: 'Total_Subscriptions', label: 'Total Subscriptions' },
    { key: 'Running_Subscriptions', label: 'Active & Running' },
    {
      key: 'Avg_Duration_Days',
      label: 'Avg Duration',
      render: (r) => `${r.Avg_Duration_Days} days`
    },
    { key: 'Total_Revenue', label: 'Total Revenue', render: (r) => formatMoney(r.Total_Revenue) }
  ];

  const trainerColumns = [
    { key: 'Trainer_ID', label: 'ID' },
    { key: 'Name', label: 'Trainer Name' },
    { key: 'Specialization', label: 'Specialization' },
    { key: 'Total_Sessions', label: 'Total Sessions' },
    { key: 'Upcoming_Sessions', label: 'Upcoming' },
    { key: 'Distinct_Members', label: 'Unique Members' },
    { key: 'First_Session', label: 'First Session', render: (r) => r.First_Session || '—' },
    { key: 'Last_Session', label: 'Last Session', render: (r) => r.Last_Session || '—' }
  ];

  const memberColumns = [
    { key: 'Member_ID', label: 'ID' },
    { key: 'Name', label: 'Member Name' },
    { key: 'Total_Subscriptions', label: 'Total Subs' },
    { key: 'Total_Paid', label: 'Total Paid', render: (r) => formatMoney(r.Total_Paid) },
    { key: 'Visit_Count', label: 'Visits' },
    { key: 'Last_Visit', label: 'Last Visit', render: (r) => r.Last_Visit || 'Never' },
    {
      key: 'Has_Running_Subscription',
      label: 'Current Status',
      render: (r) => (
        <StatusBadge value={r.Has_Running_Subscription === 1 || r.Has_Running_Subscription === '1' ? 'Active' : 'Expired'} />
      )
    }
  ];

  const equipmentColumns = [
    { key: 'Equip_ID', label: 'ID' },
    { key: 'Name', label: 'Equipment Name' },
    { key: 'Condition', label: 'Condition', render: (r) => <StatusBadge value={r.Condition} /> },
    { key: 'Log_Count', label: 'Service Count' },
    { key: 'Total_Cost', label: 'Total Cost', render: (r) => formatMoney(r.Total_Cost) },
    { key: 'Avg_Cost', label: 'Avg Cost', render: (r) => formatMoney(r.Avg_Cost) },
    { key: 'Max_Cost', label: 'Max Cost', render: (r) => formatMoney(r.Max_Cost) },
    { key: 'First_Service', label: 'First Service' },
    { key: 'Last_Service', label: 'Last Service' }
  ];

  const planRows = data?.planStatistics || [];
  const trainerRows = data?.trainerWorkload || [];
  const memberRows = data?.memberSummary || [];
  const equipmentRows = data?.equipmentMaintenance || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Aggregated system statistics powered by database views."
      />

      {/* Section 1: Membership Plan Statistics */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-ink">Plan Statistics</h2>
          <span className="text-xs text-ink-muted">(vw_plan_statistics)</span>
        </div>
        <DataTable
          columns={planColumns}
          rows={planRows}
          loading={loading}
          pagination={{ total: planRows.length, totalPages: 1 }}
          page={1}
          emptyTitle="No plan statistics available"
          emptyHint="Plan statistics will appear here."
          rowKey={(r) => r.Plan_ID}
        />
      </section>

      {/* Section 2: Trainer Workload */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-ink">Trainer Workload</h2>
          <span className="text-xs text-ink-muted">(vw_trainer_workload)</span>
        </div>
        <DataTable
          columns={trainerColumns}
          rows={trainerRows}
          loading={loading}
          pagination={{ total: trainerRows.length, totalPages: 1 }}
          page={1}
          emptyTitle="No trainer sessions logged"
          emptyHint="Trainer workload metrics will display here."
          rowKey={(r) => r.Trainer_ID}
        />
      </section>

      {/* Section 3: Member Summary */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-ink">Member Summary</h2>
          <span className="text-xs text-ink-muted">(vw_member_summary)</span>
        </div>
        <DataTable
          columns={memberColumns}
          rows={memberRows}
          loading={loading}
          pagination={{ total: memberRows.length, totalPages: 1 }}
          page={1}
          emptyTitle="No members found"
          emptyHint="Member activity overview will appear here."
          rowKey={(r) => r.Member_ID}
        />
      </section>

      {/* Section 4: Frequent Maintenance Equipment */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-warning" />
          <h2 className="text-lg font-semibold text-ink">Frequent Maintenance Equipment</h2>
          <span className="text-xs text-ink-muted">(vw_equipment_maintenance_summary — at least 2 services)</span>
        </div>
        <DataTable
          columns={equipmentColumns}
          rows={equipmentRows}
          loading={loading}
          pagination={{ total: equipmentRows.length, totalPages: 1 }}
          page={1}
          emptyTitle="No equipment with frequent maintenance"
          emptyHint="Equipment with 2 or more maintenance logs will appear here."
          rowKey={(r) => r.Equip_ID}
        />
      </section>
    </div>
  );
}

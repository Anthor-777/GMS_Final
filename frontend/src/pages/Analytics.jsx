import {
  AlertCircle,
  BarChart2,
  CheckCircle2,
  CreditCard,
  Crown,
  Dumbbell,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import api, { errorMessage, fetchOptions } from '../api/axios';
import DataTable from '../components/DataTable.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { CardSkeleton } from '../components/Loader.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatINR } from '../utils.js';

export default function Analytics() {
  const { push } = useToast();
  const [tab, setTab] = useState('insights'); // 'insights' | 'advisor' | 'new-customer'

  // System Visit Levels legend (single source of truth from database)
  const [visitLevels, setVisitLevels] = useState([]);

  // Gym Insights state
  const [gymData, setGymData] = useState(null);
  const [gymLoading, setGymLoading] = useState(true);

  // Member Advisor state
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [memberAnalytics, setMemberAnalytics] = useState(null);
  const [memberLoading, setMemberLoading] = useState(false);

  // New Customer (Prospect) state
  const [newCustAge, setNewCustAge] = useState('28');
  const [newCustExpectedVisits, setNewCustExpectedVisits] = useState('12');
  const [newCustData, setNewCustData] = useState(null);
  const [newCustLoading, setNewCustLoading] = useState(false);

  // Load visit levels on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/analytics/levels');
        setVisitLevels(res.data.data || []);
      } catch (err) {
        // Silently handled or surfaced on form interaction
      }
    })();
  }, []);

  // Load gym analytics on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGymLoading(true);
      try {
        const res = await api.get('/analytics/gym');
        if (!cancelled) setGymData(res.data.data);
      } catch (err) {
        if (!cancelled) push(errorMessage(err), 'error');
      } finally {
        if (!cancelled) setGymLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [push]);

  // Load members dropdown on mount
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchOptions('/members');
        setMembers(list);
        if (list.length > 0) {
          setSelectedMemberId(String(list[0].Member_ID));
        }
      } catch (err) {
        push(errorMessage(err), 'error');
      }
    })();
  }, [push]);

  // Fetch member analysis when selectedMemberId changes
  useEffect(() => {
    if (!selectedMemberId) return;
    let cancelled = false;
    (async () => {
      setMemberLoading(true);
      try {
        const res = await api.get(`/analytics/member/${selectedMemberId}`);
        if (!cancelled) setMemberAnalytics(res.data.data);
      } catch (err) {
        if (!cancelled) push(errorMessage(err), 'error');
      } finally {
        if (!cancelled) setMemberLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedMemberId, push]);

  // Run new customer advisor search
  const runNewCustomerSearch = async (e) => {
    if (e) e.preventDefault();
    setNewCustLoading(true);
    try {
      const res = await api.get('/analytics/new-customer', {
        params: { age: newCustAge, expectedVisits: newCustExpectedVisits }
      });
      setNewCustData(res.data.data);
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setNewCustLoading(false);
    }
  };

  // Trigger initial search for new customer tab on first tab switch
  useEffect(() => {
    if (tab === 'new-customer' && !newCustData && !newCustLoading) {
      runNewCustomerSearch();
    }
  }, [tab]);

  // Table columns for Gym Insights
  const profitColumns = [
    { key: 'Revenue_Rank', label: 'Rank', render: (r) => `#${r.Revenue_Rank}` },
    { key: 'Plan_Name', label: 'Plan Name' },
    { key: 'Duration_Months', label: 'Duration', render: (r) => `${r.Duration_Months} mo` },
    { key: 'Fee', label: 'Fee', render: (r) => formatINR(r.Fee) },
    { key: 'Fee_Per_Month', label: 'Per Month', render: (r) => formatINR(r.Fee_Per_Month) },
    { key: 'Total_Subscriptions', label: 'Subscriptions' },
    { key: 'Distinct_Members', label: 'Members' },
    { key: 'Cancellation_Rate_Pct', label: 'Cancel Rate', render: (r) => `${r.Cancellation_Rate_Pct}%` },
    { key: 'Total_Revenue', label: 'Revenue', render: (r) => formatINR(r.Total_Revenue) },
    { key: 'Revenue_Share_Pct', label: 'Share', render: (r) => `${r.Revenue_Share_Pct}%` },
    {
      key: 'Gym_Insight',
      label: 'Insight',
      render: (r) => (
        <span className={r.Revenue_Rank === 1 ? 'font-medium text-accent' : 'text-ink-secondary'}>
          {r.Gym_Insight}
        </span>
      )
    }
  ];

  // Table columns for Member Plan Fit (sorted short to long)
  const fitColumns = [
    {
      key: 'Plan_Name',
      label: 'Plan',
      render: (r) => (
        <div className="flex items-center gap-2">
          {Number(r.Is_Recommended) === 1 && <Crown className="h-4 w-4 text-accent" />}
          <span className={Number(r.Is_Recommended) === 1 ? 'font-semibold text-accent' : 'text-ink'}>
            {r.Plan_Name} ({r.Duration_Months} mo)
          </span>
        </div>
      )
    },
    { key: 'Duration_Months', label: 'Duration', render: (r) => `${r.Duration_Months} mo` },
    { key: 'Fee_Per_Month', label: 'Per Month', render: (r) => formatINR(r.Fee_Per_Month) },
    {
      key: 'Projected_Cost_Per_Visit',
      label: 'Cost / Visit',
      render: (r) => (r.Projected_Cost_Per_Visit != null ? formatINR(r.Projected_Cost_Per_Visit) : '—')
    },
    {
      key: 'Monthly_Saving_Vs_Current',
      label: 'Saving vs Current',
      render: (r) => {
        if (r.Monthly_Saving_Vs_Current == null) return '—';
        const val = Number(r.Monthly_Saving_Vs_Current);
        return (
          <span className={val > 0 ? 'text-success' : val < 0 ? 'text-danger' : 'text-ink-muted'}>
            {val > 0 ? `+${formatINR(val)}` : formatINR(val)}
          </span>
        );
      }
    },
    {
      key: 'Recommendation_Reason',
      label: 'Analysis & Recommendation',
      render: (r) => (
        <span className={Number(r.Is_Recommended) === 1 ? 'text-sm font-medium text-ink' : 'text-xs text-ink-muted'}>
          {r.Recommendation_Reason}
        </span>
      )
    }
  ];

  // Table columns for Prospect Plan Comparison (short to long)
  const prospectPlanColumns = [
    {
      key: 'Plan_Name',
      label: 'Plan',
      render: (r) => (
        <div className="flex items-center gap-2">
          {Number(r.Is_Recommended) === 1 && <Crown className="h-4 w-4 text-accent" />}
          <span className={Number(r.Is_Recommended) === 1 ? 'font-semibold text-accent' : 'text-ink'}>
            {r.Plan_Name} ({r.Duration_Months} mo)
          </span>
        </div>
      )
    },
    { key: 'Duration_Months', label: 'Duration', render: (r) => `${r.Duration_Months} mo` },
    { key: 'Fee', label: 'Total Fee', render: (r) => formatINR(r.Fee) },
    { key: 'Fee_Per_Month', label: 'Per Month', render: (r) => formatINR(r.Fee_Per_Month) },
    {
      key: 'Projected_Cost_Per_Visit',
      label: 'Cost / Visit',
      render: (r) => (r.Projected_Cost_Per_Visit != null ? formatINR(r.Projected_Cost_Per_Visit) : '—')
    },
    {
      key: 'Recommendation_Reason',
      label: 'Plan Fit Analysis',
      render: (r) => (
        <span className={Number(r.Is_Recommended) === 1 ? 'text-sm font-medium text-ink' : 'text-xs text-ink-muted'}>
          {r.Recommendation_Reason}
        </span>
      )
    }
  ];

  // Table columns for New Customer recommendations (What similar members chose)
  const newCustColumns = [
    { key: 'Popularity_Rank', label: 'Rank', render: (r) => `#${r.Popularity_Rank}` },
    { key: 'Plan_Name', label: 'Plan Name' },
    { key: 'Fee_Per_Month', label: 'Per Month', render: (r) => formatINR(r.Fee_Per_Month) },
    { key: 'Members_Count', label: 'Members in Cohort' },
    { key: 'Subscriptions_Count', label: 'Total Subscriptions' },
    { key: 'Completion_Rate_Pct', label: 'Retention Rate', render: (r) => `${r.Completion_Rate_Pct}%` },
    { key: 'Avg_Amount_Paid', label: 'Avg Spend', render: (r) => formatINR(r.Avg_Amount_Paid) }
  ];

  const chartData = (gymData?.planProfitability || []).map((p) => ({
    name: p.Plan_Name,
    revenue: Number(p.Total_Revenue) || 0
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan Analytics & Advisor"
        subtitle="Data-driven profitability, customer segmentation, and personalized membership recommendations."
      />

      {/* Tabs Header */}
      <div className="flex border-b border-line gap-2 sm:gap-6">
        <button
          type="button"
          onClick={() => setTab('insights')}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition ${
            tab === 'insights'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-secondary hover:text-ink'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          Gym Insights
        </button>
        <button
          type="button"
          onClick={() => setTab('advisor')}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition ${
            tab === 'advisor'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-secondary hover:text-ink'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Member Advisor
        </button>
        <button
          type="button"
          onClick={() => setTab('new-customer')}
          className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition ${
            tab === 'new-customer'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-secondary hover:text-ink'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Thinking of joining?
        </button>
      </div>

      {/* TAB 1: Gym Insights */}
      {tab === 'insights' && (
        <div className="space-y-6">
          {gymLoading || !gymData ? (
            <CardSkeleton count={3} />
          ) : (
            <>
              {/* Highlight Card for Top Plan */}
              {gymData.topPlan && (
                <div className="relative overflow-hidden rounded-2xl border border-accent/40 bg-card p-6 shadow-glow-sm">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 rounded-full bg-accent/10 p-8">
                    <Crown className="h-16 w-16 text-accent/30" />
                  </div>
                  <div className="relative space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                      <Crown className="h-3.5 w-3.5" /> Top Earning Plan
                    </div>
                    <div className="flex flex-wrap items-baseline gap-4">
                      <h3 className="text-2xl font-bold text-ink">{gymData.topPlan.Plan_Name}</h3>
                      <span className="text-xl font-semibold text-success">
                        {formatINR(gymData.topPlan.Total_Revenue)}
                      </span>
                      <span className="text-sm text-ink-muted">
                        ({gymData.topPlan.Revenue_Share_Pct}% of total revenue)
                      </span>
                    </div>
                    <p className="max-w-2xl text-sm text-ink-secondary">
                      {gymData.topPlan.Gym_Insight}
                    </p>
                  </div>
                </div>
              )}

              {/* Revenue Comparison Bar Chart */}
              <div className="rounded-2xl border border-line bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">Total Revenue by Plan</h3>
                    <p className="text-xs text-ink-muted">Computed from vw_plan_profitability</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <defs>
                        <linearGradient id="planRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#EC4899" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#2A2A3C" strokeDasharray="3 3" />
                      <XAxis dataKey="name" stroke="#6B6B80" fontSize={12} />
                      <YAxis stroke="#6B6B80" fontSize={12} tickFormatter={(v) => formatINR(v).replace(/\.00$/, '')} />
                      <Tooltip
                        contentStyle={{ background: '#13131C', border: '1px solid #2A2A3C', borderRadius: 12 }}
                        formatter={(v) => [formatINR(v), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="url(#planRevenueGradient)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Complete Profitability Table */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <h3 className="font-semibold text-ink">Plan Performance Metrics</h3>
                </div>
                <DataTable
                  columns={profitColumns}
                  rows={gymData.planProfitability || []}
                  loading={false}
                  pagination={{ total: (gymData.planProfitability || []).length, totalPages: 1 }}
                  page={1}
                  emptyTitle="No plan profitability data"
                  emptyHint="Plans and payments will appear here."
                  rowKey={(r) => r.Plan_ID}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: Member Advisor */}
      {tab === 'advisor' && (
        <div className="space-y-6">
          {/* Member Picker */}
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-ink">Select Member to Analyze</h3>
              <p className="text-xs text-ink-muted">Evaluate attendance behavior and discover their optimal plan fit.</p>
            </div>
            <div className="w-full sm:w-80">
              <select
                className="w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                {members.map((m) => (
                  <option key={m.Member_ID} value={m.Member_ID}>
                    {m.Name} (#{m.Member_ID})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {memberLoading || !memberAnalytics ? (
            <CardSkeleton count={3} />
          ) : (
            <>
              {/* Member Behavior Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium uppercase">Profile</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-ink">{memberAnalytics.behavior.Member_Name}</p>
                  <p className="text-xs text-ink-muted">
                    {memberAnalytics.behavior.Gender} · Age {memberAnalytics.behavior.Age} ({memberAnalytics.behavior.Age_Band})
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-xs font-medium uppercase">Attendance Pattern</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-lg font-bold text-ink">{memberAnalytics.behavior.Avg_Visits_Per_Month}</p>
                    <span className="text-xs text-ink-muted">visits / mo</span>
                    <StatusBadge
                      value={
                        memberAnalytics.behavior.Visit_Level === 'Low'
                          ? 'Fair'
                          : memberAnalytics.behavior.Visit_Level === 'Medium'
                          ? 'Good'
                          : memberAnalytics.behavior.Visit_Level === 'High'
                          ? 'Active'
                          : 'Excellent'
                      }
                    />
                  </div>
                  <p className="text-xs text-ink-muted">
                    {memberAnalytics.behavior.Visits_Last_90_Days} visits over {memberAnalytics.behavior.Observed_Days} days ({memberAnalytics.behavior.Visit_Level} Level)
                  </p>
                  <p className="mt-2 text-xs font-medium text-accent">
                    Recommended because you visit about {memberAnalytics.behavior.Avg_Visits_Per_Month} times a month.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <Dumbbell className="h-4 w-4 text-warning" />
                    <span className="text-xs font-medium uppercase">Training & Spend</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-ink">
                    {memberAnalytics.behavior.Total_Sessions} Sessions
                  </p>
                  <p className="text-xs text-ink-muted">
                    Total paid: {formatINR(memberAnalytics.behavior.Total_Paid)}
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-card p-4">
                  <div className="flex items-center gap-2 text-ink-muted">
                    <CreditCard className="h-4 w-4 text-success" />
                    <span className="text-xs font-medium uppercase">Current Plan</span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-ink">
                    {memberAnalytics.behavior.Current_Plan_Name || 'None'}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {memberAnalytics.behavior.Current_Fee_Per_Month
                      ? `${formatINR(memberAnalytics.behavior.Current_Fee_Per_Month)} / mo`
                      : 'No active plan'}
                  </p>
                </div>
              </div>

              {/* Recommended Plan Highlight Box */}
              {memberAnalytics.recommended && (
                <div className="rounded-2xl border border-accent/40 bg-accent/5 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-accent" />
                    <div>
                      <h4 className="text-sm font-semibold text-accent">
                        Recommended Plan: {memberAnalytics.recommended.Plan_Name} (
                        {memberAnalytics.recommended.Duration_Months} months)
                      </h4>
                      <p className="mt-1 text-sm text-ink">
                        {memberAnalytics.recommended.Recommendation_Reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Comparison Table (Short to Long) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">Plan Fit Evaluation</h3>
                  <span className="text-xs text-ink-muted">Sorted short to long duration</span>
                </div>
                <DataTable
                  columns={fitColumns}
                  rows={memberAnalytics.planFit || []}
                  loading={false}
                  pagination={{ total: (memberAnalytics.planFit || []).length, totalPages: 1 }}
                  page={1}
                  emptyTitle="No plan fit data"
                  emptyHint="Plan fit evaluation will appear here."
                  rowKey={(r) => r.Plan_ID}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: New Customer (Thinking of joining?) */}
      {tab === 'new-customer' && (
        <div className="space-y-6">
          <form
            onSubmit={runNewCustomerSearch}
            className="space-y-4 rounded-2xl border border-line bg-card p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
              <div>
                <label className="text-xs font-medium text-ink-muted">Customer Age</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={newCustAge}
                  onChange={(e) => setNewCustAge(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink-muted">
                  How many times a month do you expect to visit?
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={newCustExpectedVisits}
                  onChange={(e) => setNewCustExpectedVisits(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-elevated px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Threshold Legend from GET /api/analytics/levels */}
            {visitLevels.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-ink-muted">
                <span className="font-medium text-ink-secondary">Visit Frequency Guide:</span>
                {visitLevels.map((lvl) => (
                  <span
                    key={lvl.Visit_Level}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-2.5 py-1 text-xs"
                  >
                    <span className="font-semibold text-ink">{lvl.Level_Label}</span>
                    <span className="text-ink-muted">→ {lvl.Target_Duration_Months}-month plan target</span>
                  </span>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={newCustLoading}>
                {newCustLoading ? 'Analyzing…' : 'Find Best Plans'}
              </button>
            </div>
          </form>

          {newCustLoading ? (
            <CardSkeleton count={2} />
          ) : !newCustData ? (
            <EmptyState
              title="Enter prospective customer details"
              hint="Provide age and expected visit frequency to view recommended membership packages."
            />
          ) : (
            <div className="space-y-6">
              {/* (1) Prominent 'Suggested plan' card from levelPlan */}
              {newCustData.levelPlan && (
                <div className="relative overflow-hidden rounded-2xl border border-accent/40 bg-card p-6 shadow-glow-sm">
                  <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 rounded-full bg-accent/10 p-8">
                    <Crown className="h-16 w-16 text-accent/30" />
                  </div>
                  <div className="relative space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                        <Crown className="h-3.5 w-3.5" /> Suggested Plan
                      </span>
                      <span className="rounded-full bg-elevated px-2.5 py-0.5 text-xs font-medium text-ink-secondary">
                        {newCustData.visitLevel} Level ({newCustData.levelLabel})
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-4">
                      <h3 className="text-2xl font-bold text-ink">{newCustData.levelPlan.Plan_Name}</h3>
                      <span className="text-sm text-ink-muted">({newCustData.levelPlan.Duration_Months} months)</span>
                      <span className="text-xl font-bold text-success">
                        {formatINR(newCustData.levelPlan.Fee)}
                      </span>
                      <span className="text-sm font-medium text-accent">
                        {formatINR(newCustData.levelPlan.Fee_Per_Month)} / mo
                      </span>
                      {newCustData.levelPlan.Projected_Cost_Per_Visit != null && (
                        <span className="text-xs text-ink-muted">
                          (~{formatINR(newCustData.levelPlan.Projected_Cost_Per_Visit)} per visit)
                        </span>
                      )}
                    </div>
                    <p className="max-w-2xl text-sm text-ink">
                      {newCustData.levelPlan.Recommendation_Reason}
                    </p>
                  </div>
                </div>
              )}

              {/* (2) Full plan comparison table from plans (short to long) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">Plan Comparison for Your Visit Pattern</h3>
                  <span className="text-xs text-ink-muted">Sorted short to long duration</span>
                </div>
                <DataTable
                  columns={prospectPlanColumns}
                  rows={newCustData.plans || []}
                  loading={false}
                  pagination={{ total: (newCustData.plans || []).length, totalPages: 1 }}
                  page={1}
                  emptyTitle="No plans available"
                  emptyHint="Membership plans will appear here."
                  rowKey={(r) => r.Plan_ID}
                />
              </div>

              {/* (3) 'What similar members chose' from recommendations */}
              <div className="space-y-4">
                {newCustData.fallback && (
                  <div className="flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">
                      Not enough similar members in the {newCustData.ageBand} age band; showing results for the{' '}
                      <strong>{newCustData.visitLevel}</strong> visit level across all age bands.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-ink">
                      What Similar Members Chose ({newCustData.ageBand} · {newCustData.visitLevel} Level)
                    </h3>
                    <span className="text-xs text-ink-muted">Sorted by cohort popularity & completion</span>
                  </div>
                  <DataTable
                    columns={newCustColumns}
                    rows={newCustData.recommendations || []}
                    loading={false}
                    pagination={{ total: (newCustData.recommendations || []).length, totalPages: 1 }}
                    page={1}
                    emptyTitle="No similar members found"
                    emptyHint="No historical subscriptions found for this profile."
                    rowKey={(r) => r.Plan_ID}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

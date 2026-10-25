const MAP = {
  Active: 'bg-success/15 text-success',
  Upcoming: 'bg-primary/20 text-primary',
  Expired: 'bg-warning/15 text-warning',
  Cancelled: 'bg-danger/15 text-danger',
  Excellent: 'bg-success/15 text-success',
  Good: 'bg-success/10 text-success',
  Fair: 'bg-warning/15 text-warning',
  Poor: 'bg-danger/15 text-danger',
  'Out of Order': 'bg-danger/20 text-danger',
  Cash: 'bg-primary/15 text-primary',
  Card: 'bg-accent/15 text-accent',
  UPI: 'bg-primary/20 text-primary',
  'Net Banking': 'bg-accent/20 text-accent'
};

export default function StatusBadge({ value }) {
  if (value == null || value === '') {
    return <span className="text-sm text-ink-muted">—</span>;
  }
  const cls = MAP[value] || 'bg-elevated text-ink-secondary';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {value}
    </span>
  );
}

import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'Nothing here yet', hint = 'Add a record to get started.' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
      <div className="mb-3 rounded-2xl bg-elevated p-3 text-primary">
        <Inbox className="h-7 w-7" />
      </div>
      <p className="text-base font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-muted">{hint}</p>
    </div>
  );
}

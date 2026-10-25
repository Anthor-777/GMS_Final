import { Plus, Search } from 'lucide-react';

export default function PageHeader({ title, subtitle, onAdd, addLabel = 'Add', search, onSearch, extra }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {onSearch ? (
          <label className="relative block min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search…"
              className="input-field pl-9"
            />
          </label>
        ) : null}
        {extra}
        {onAdd ? (
          <button type="button" className="btn-primary" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            {addLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

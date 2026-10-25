import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState.jsx';
import Loader from './Loader.jsx';

export default function DataTable({
  columns,
  rows,
  loading,
  sortBy,
  order,
  onSort,
  pagination,
  page,
  onPage,
  emptyTitle,
  emptyHint,
  rowKey
}) {
  const totalPages = pagination?.totalPages || 0;
  const total = pagination?.total || 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-elevated/80 text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3 font-medium">
                  {col.sortable === false ? (
                    col.label
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-ink"
                      onClick={() => onSort?.(col.key)}
                    >
                      {col.label}
                      {sortBy === col.key ? (
                        order === 'desc' ? (
                          <ArrowDown className="h-3.5 w-3.5 text-accent" />
                        ) : (
                          <ArrowUp className="h-3.5 w-3.5 text-accent" />
                        )
                      ) : null}
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-6">
                  <Loader rows={5} cols={Math.min(columns.length, 6)} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8">
                  <EmptyState title={emptyTitle} hint={emptyHint} />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)} className="border-t border-line/80 transition hover:bg-elevated/40">
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-4 py-3 text-ink-secondary">
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-ink-muted">
        <span>
          {total} record{total === 1 ? '' : 's'}
          {totalPages ? ` · page ${page} of ${totalPages}` : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost px-2 py-1.5"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="btn-ghost px-2 py-1.5"
            disabled={totalPages === 0 || page >= totalPages}
            onClick={() => onPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { Pencil, Trash2 } from 'lucide-react';

export default function RowActions({ onEdit, onDelete, extra }) {
  return (
    <div className="flex items-center gap-1.5">
      {extra}
      <button type="button" onClick={onEdit} className="rounded-lg p-1.5 text-ink-muted hover:bg-elevated hover:text-primary" aria-label="Edit">
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-ink-muted hover:bg-elevated hover:text-danger" aria-label="Delete">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

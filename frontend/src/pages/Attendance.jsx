import { LogIn, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { errorMessage, fetchOptions, fieldErrors } from '../api/axios';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import FormField from '../components/FormField.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import RowActions from '../components/RowActions.jsx';
import { useToast } from '../components/Toast.jsx';
import useList from '../hooks/useList.js';
import { fromTimeInput, toTimeInput } from '../utils.js';

const EMPTY = { Member_ID: '', Visit_Date: '', Check_In: '', Check_Out: '' };

export default function Attendance() {
  const { search, setSearch } = useOutletContext();
  const list = useList('/attendance', 'Att_ID', search);
  const { push } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinMember, setCheckinMember] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchOptions('/members')
      .then(setMembers)
      .catch((err) => push(errorMessage(err), 'error'));
  }, [push]);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      Member_ID: String(row.Member_ID),
      Visit_Date: row.Visit_Date,
      Check_In: toTimeInput(row.Check_In),
      Check_Out: toTimeInput(row.Check_Out)
    });
    setErrors({});
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = {
      Member_ID: Number(form.Member_ID)
    };
    if (editing) {
      payload.Visit_Date = form.Visit_Date;
      payload.Check_In = fromTimeInput(form.Check_In);
      if (form.Check_Out) payload.Check_Out = fromTimeInput(form.Check_Out);
    } else {
      if (form.Visit_Date) payload.Visit_Date = form.Visit_Date;
      if (form.Check_In) payload.Check_In = fromTimeInput(form.Check_In);
      if (form.Check_Out) payload.Check_Out = fromTimeInput(form.Check_Out);
    }
    try {
      if (editing) {
        await api.put(`/attendance/${editing.Att_ID}`, payload);
        push('Attendance updated.');
      } else {
        await api.post('/attendance', payload);
        push('Attendance recorded.');
      }
      setOpen(false);
      list.reload();
    } catch (err) {
      setErrors(fieldErrors(err));
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const quickCheckin = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/attendance', { Member_ID: Number(checkinMember) });
      push('Member checked in.');
      setCheckinOpen(false);
      setCheckinMember('');
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const checkout = async (row) => {
    try {
      await api.patch(`/attendance/${row.Att_ID}/checkout`);
      push('Checked out.');
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/attendance/${del.Att_ID}`);
      push('Attendance deleted.');
      setDel(null);
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'Att_ID', label: 'ID' },
    { key: 'Member_Name', label: 'Member' },
    { key: 'Visit_Date', label: 'Visit Date' },
    { key: 'Check_In', label: 'Check In' },
    { key: 'Check_Out', label: 'Check Out', render: (r) => r.Check_Out || '—' },
    {
      key: 'Duration_Minutes',
      label: 'Duration',
      render: (r) => {
        if (r.Attendance_State === 'No check-out') {
          return (
            <span className="inline-flex items-center rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
              No check-out
            </span>
          );
        }
        if (r.Attendance_State === 'In gym') {
          if (!r.Duration_Minutes || r.Duration_Minutes <= 0) {
            return <span className="font-medium text-accent">In gym - just arrived</span>;
          }
          return <span className="font-medium text-accent">In gym - {r.Duration_Minutes} min so far</span>;
        }
        if (r.Duration_Minutes == null) return '—';
        if (r.Duration_Minutes < 60) {
          return `${r.Duration_Minutes} min`;
        }
        const h = Math.floor(r.Duration_Minutes / 60);
        const m = r.Duration_Minutes % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
      }
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (row) => (
        <RowActions
          onEdit={() => openEdit(row)}
          onDelete={() => setDel(row)}
          extra={
            !row.Check_Out ? (
              <button
                type="button"
                onClick={() => checkout(row)}
                className="inline-flex items-center gap-1 rounded-lg bg-accent/15 px-2 py-1 text-xs font-semibold text-accent hover:bg-accent/25"
              >
                <LogOut className="h-3.5 w-3.5" />
                Check-out
              </button>
            ) : null
          }
        />
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Member visits. Check-in uses today's date and current time if you leave them blank."
        addLabel="Add record"
        onAdd={openAdd}
        search={search}
        onSearch={setSearch}
        extra={
          <button type="button" className="btn-primary" onClick={() => setCheckinOpen(true)}>
            <LogIn className="h-4 w-4" />
            Check-in
          </button>
        }
      />
      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.loading}
        sortBy={list.sortBy}
        order={list.order}
        onSort={list.onSort}
        pagination={list.pagination}
        page={list.page}
        onPage={list.setPage}
        emptyTitle="No attendance records"
        emptyHint="Check a member in to start a visit."
        rowKey={(r) => r.Att_ID}
      />
      <Modal open={checkinOpen} title="Quick check-in" onClose={() => setCheckinOpen(false)}>
        <form className="grid gap-4" onSubmit={quickCheckin}>
          <FormField
            label="Member"
            name="Member_ID"
            type="select"
            value={checkinMember}
            onChange={(e) => setCheckinMember(e.target.value)}
            required
            options={members.map((m) => ({ value: m.Member_ID, label: `${m.Name} (#${m.Member_ID})` }))}
          />
          <p className="text-xs text-ink-muted">Visit_Date and Check_In will be filled by the server (today / now).</p>
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={() => setCheckinOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Checking in…' : 'Check in'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal open={open} title={editing ? 'Edit attendance' : 'Add attendance'} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={save}>
          <FormField
            label="Member"
            name="Member_ID"
            type="select"
            value={form.Member_ID}
            onChange={change}
            error={errors.Member_ID}
            required
            options={members.map((m) => ({ value: m.Member_ID, label: `${m.Name} (#${m.Member_ID})` }))}
          />
          <FormField
            label="Visit Date"
            name="Visit_Date"
            type="date"
            value={form.Visit_Date}
            onChange={change}
            error={errors.Visit_Date}
            required={Boolean(editing)}
            hint={editing ? undefined : 'Optional on create — defaults to today.'}
          />
          <FormField
            label="Check In"
            name="Check_In"
            type="time"
            step="1"
            value={form.Check_In}
            onChange={change}
            error={errors.Check_In}
            required={Boolean(editing)}
            hint={editing ? 'HH:MM:SS' : 'Optional on create — defaults to now.'}
          />
          <FormField
            label="Check Out"
            name="Check_Out"
            type="time"
            step="1"
            value={form.Check_Out}
            onChange={change}
            error={errors.Check_Out}
            hint="Leave blank if still in the gym."
          />
          <div className="mt-2 flex justify-end gap-3">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(del)}
        title="Delete attendance"
        message="Delete this visit record?"
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}

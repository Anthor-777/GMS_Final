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
import { fromDatetimeLocal, toDatetimeLocal } from '../utils.js';

const EMPTY = { Member_ID: '', Trainer_ID: '', Slot_DateTime: '', Focus_Area: '' };

export default function Sessions() {
  const { search, setSearch } = useOutletContext();
  const list = useList('/sessions', 'Session_ID', search);
  const { push } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);
  const [members, setMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    Promise.all([fetchOptions('/members'), fetchOptions('/trainers')])
      .then(([m, t]) => {
        setMembers(m);
        setTrainers(t);
      })
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
      Trainer_ID: String(row.Trainer_ID),
      Slot_DateTime: toDatetimeLocal(row.Slot_DateTime),
      Focus_Area: row.Focus_Area
    });
    setErrors({});
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = {
      Member_ID: Number(form.Member_ID),
      Trainer_ID: Number(form.Trainer_ID),
      Slot_DateTime: fromDatetimeLocal(form.Slot_DateTime),
      Focus_Area: form.Focus_Area
    };
    try {
      if (editing) {
        await api.put(`/sessions/${editing.Session_ID}`, payload);
        push('Session updated.');
      } else {
        await api.post('/sessions', payload);
        push('Session booked.');
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

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api.delete(`/sessions/${del.Session_ID}`);
      push('Session deleted.');
      setDel(null);
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'Session_ID', label: 'ID' },
    { key: 'Member_Name', label: 'Member' },
    { key: 'Trainer_Name', label: 'Trainer' },
    { key: 'Slot_DateTime', label: 'Slot' },
    { key: 'Focus_Area', label: 'Focus Area' },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (row) => <RowActions onEdit={() => openEdit(row)} onDelete={() => setDel(row)} />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Sessions"
        subtitle="Personal training slots. A trainer cannot be double-booked."
        addLabel="Add session"
        onAdd={openAdd}
        search={search}
        onSearch={setSearch}
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
        emptyTitle="No sessions found"
        emptyHint="Book a member with a trainer."
        rowKey={(r) => r.Session_ID}
      />
      <Modal open={open} title={editing ? 'Edit session' : 'Add session'} onClose={() => setOpen(false)}>
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
            label="Trainer"
            name="Trainer_ID"
            type="select"
            value={form.Trainer_ID}
            onChange={change}
            error={errors.Trainer_ID}
            required
            options={trainers.map((t) => ({ value: t.Trainer_ID, label: `${t.Name} · ${t.Specialization}` }))}
          />
          <FormField
            label="Slot DateTime"
            name="Slot_DateTime"
            type="datetime-local"
            step="1"
            value={form.Slot_DateTime}
            onChange={change}
            error={errors.Slot_DateTime}
            required
            hint="Sent as YYYY-MM-DD HH:MM:SS (no timezone conversion)."
          />
          <FormField
            label="Focus Area"
            name="Focus_Area"
            value={form.Focus_Area}
            onChange={change}
            error={errors.Focus_Area}
            required
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
        title="Delete session"
        message="Delete this training session?"
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}

import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { errorMessage, fieldErrors } from '../api/axios';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import FormField from '../components/FormField.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import RowActions from '../components/RowActions.jsx';
import { useToast } from '../components/Toast.jsx';
import useList from '../hooks/useList.js';
import { formatMoney } from '../utils.js';

const EMPTY = { Name: '', Specialization: '', Phone: '', Salary: '' };

export default function Trainers() {
  const { search, setSearch } = useOutletContext();
  const list = useList('/trainers', 'Trainer_ID', search);
  const { push } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);

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
      Name: row.Name,
      Specialization: row.Specialization,
      Phone: row.Phone,
      Salary: row.Salary
    });
    setErrors({});
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = {
      Name: form.Name,
      Specialization: form.Specialization,
      Phone: form.Phone,
      Salary: Number(form.Salary)
    };
    try {
      if (editing) {
        await api.put(`/trainers/${editing.Trainer_ID}`, payload);
        push('Trainer updated.');
      } else {
        await api.post('/trainers', payload);
        push('Trainer created.');
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
      await api.delete(`/trainers/${del.Trainer_ID}`);
      push('Trainer deleted.');
      setDel(null);
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'Trainer_ID', label: 'ID' },
    { key: 'Name', label: 'Name' },
    { key: 'Specialization', label: 'Specialization' },
    { key: 'Phone', label: 'Phone' },
    { key: 'Salary', label: 'Salary', render: (r) => formatMoney(r.Salary) },
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
        title="Trainers"
        subtitle="Staff who conduct personal training sessions"
        addLabel="Add trainer"
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
        emptyTitle="No trainers found"
        emptyHint="Add a trainer to book sessions."
        rowKey={(r) => r.Trainer_ID}
      />
      <Modal open={open} title={editing ? 'Edit trainer' : 'Add trainer'} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={save}>
          <FormField label="Name" name="Name" value={form.Name} onChange={change} error={errors.Name} required />
          <FormField
            label="Specialization"
            name="Specialization"
            value={form.Specialization}
            onChange={change}
            error={errors.Specialization}
            required
          />
          <FormField label="Phone" name="Phone" value={form.Phone} onChange={change} error={errors.Phone} required />
          <FormField
            label="Salary"
            name="Salary"
            type="number"
            min="0"
            step="0.01"
            value={form.Salary}
            onChange={change}
            error={errors.Salary}
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
        title="Delete trainer"
        message={del ? `Delete ${del.Name}? Sessions they conduct will block deletion.` : ''}
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}

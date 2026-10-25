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

const EMPTY = { Plan_Name: '', Duration_Months: 1, Fee: '' };

export default function MembershipPlans() {
  const { search, setSearch } = useOutletContext();
  const list = useList('/plans', 'Plan_ID', search);
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
    setForm({ Plan_Name: row.Plan_Name, Duration_Months: row.Duration_Months, Fee: row.Fee });
    setErrors({});
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = {
      Plan_Name: form.Plan_Name,
      Duration_Months: Number(form.Duration_Months),
      Fee: Number(form.Fee)
    };
    try {
      if (editing) {
        await api.put(`/plans/${editing.Plan_ID}`, payload);
        push('Plan updated.');
      } else {
        await api.post('/plans', payload);
        push('Plan created.');
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
      await api.delete(`/plans/${del.Plan_ID}`);
      push('Plan deleted.');
      setDel(null);
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'Plan_ID', label: 'ID' },
    { key: 'Plan_Name', label: 'Plan Name' },
    { key: 'Duration_Months', label: 'Duration (months)' },
    { key: 'Fee', label: 'Fee', render: (r) => formatMoney(r.Fee) },
    { key: 'Fee_Per_Month', label: 'Per month', render: (r) => formatMoney(r.Fee_Per_Month) },
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
        title="Membership Plans"
        subtitle="Packages members can subscribe to"
        addLabel="Add plan"
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
        emptyTitle="No plans found"
        emptyHint="Create a membership plan."
        rowKey={(r) => r.Plan_ID}
      />
      <Modal open={open} title={editing ? 'Edit plan' : 'Add plan'} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={save}>
          <FormField label="Plan Name" name="Plan_Name" value={form.Plan_Name} onChange={change} error={errors.Plan_Name} required />
          <FormField
            label="Duration Months"
            name="Duration_Months"
            type="number"
            min="1"
            step="1"
            value={form.Duration_Months}
            onChange={change}
            error={errors.Duration_Months}
            required
          />
          <FormField label="Fee" name="Fee" type="number" min="0" step="0.01" value={form.Fee} onChange={change} error={errors.Fee} required />
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
        title="Delete plan"
        message={del ? `Delete ${del.Plan_Name}? Subscriptions that use it will block deletion.` : ''}
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}

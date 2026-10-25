import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { errorMessage, fetchOptions, fieldErrors } from '../api/axios';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import FormField from '../components/FormField.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import RowActions from '../components/RowActions.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../components/Toast.jsx';
import useList from '../hooks/useList.js';
import { formatDate, formatMoney, todayDate } from '../utils.js';

const EMPTY = { Sub_ID: '', Amount: '', Paid_On: todayDate(), Mode: 'UPI' };

export default function Payments() {
  const { search, setSearch } = useOutletContext();
  const list = useList('/payments', 'Payment_ID', search);
  const { push } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);
  const [subs, setSubs] = useState([]);

  useEffect(() => {
    fetchOptions('/subscriptions')
      .then(setSubs)
      .catch((err) => push(errorMessage(err), 'error'));
  }, [push]);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, Paid_On: todayDate() });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      Sub_ID: String(row.Sub_ID),
      Amount: row.Amount,
      Paid_On: row.Paid_On,
      Mode: row.Mode
    });
    setErrors({});
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = {
      Sub_ID: Number(form.Sub_ID),
      Amount: Number(form.Amount),
      Paid_On: form.Paid_On,
      Mode: form.Mode
    };
    try {
      if (editing) {
        await api.put(`/payments/${editing.Payment_ID}`, payload);
        push('Payment updated.');
      } else {
        await api.post('/payments', payload);
        push('Payment recorded.');
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
      await api.delete(`/payments/${del.Payment_ID}`);
      push('Payment deleted.');
      setDel(null);
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'Payment_ID', label: 'ID' },
    { key: 'Member_Name', label: 'Member' },
    { key: 'Plan_Name', label: 'Plan' },
    { key: 'Amount', label: 'Amount', render: (r) => formatMoney(r.Amount) },
    { key: 'Paid_On', label: 'Paid On' },
    { key: 'Mode', label: 'Mode', render: (r) => <StatusBadge value={r.Mode} /> },
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
        title="Payments"
        subtitle="Settlements against subscriptions"
        addLabel="Add payment"
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
        emptyTitle="No payments found"
        emptyHint="Record a payment for a subscription."
        rowKey={(r) => r.Payment_ID}
      />
      <Modal open={open} title={editing ? 'Edit payment' : 'Add payment'} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={save}>
          <FormField
            label="Subscription"
            name="Sub_ID"
            type="select"
            value={form.Sub_ID}
            onChange={change}
            error={errors.Sub_ID}
            required
            options={subs
              .filter((s) => s.Status !== 'Cancelled' || String(s.Sub_ID) === String(form.Sub_ID))
              .map((s) => ({
                value: s.Sub_ID,
                label: `${s.Member_Name} - ${s.Plan_Name} (${formatDate(s.Start_Date)} to ${formatDate(s.End_Date)})`
              }))}
          />
          <FormField label="Amount" name="Amount" type="number" min="0.01" step="0.01" value={form.Amount} onChange={change} error={errors.Amount} required />
          <FormField label="Paid On" name="Paid_On" type="date" value={form.Paid_On} onChange={change} error={errors.Paid_On} required />
          <FormField
            label="Mode"
            name="Mode"
            type="select"
            value={form.Mode}
            onChange={change}
            error={errors.Mode}
            required
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'Card', label: 'Card' },
              { value: 'UPI', label: 'UPI' },
              { value: 'Net Banking', label: 'Net Banking' }
            ]}
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
        title="Delete payment"
        message="Delete this payment record?"
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}

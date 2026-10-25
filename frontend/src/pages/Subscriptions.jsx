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
import { formatMoney, todayDate } from '../utils.js';

const EMPTY = {
  Member_ID: '',
  Plan_ID: '',
  Start_Date: todayDate(),
  End_Date: '',
  Status: 'Active'
};

export default function Subscriptions() {
  const { search, setSearch } = useOutletContext();
  const list = useList('/subscriptions', 'Sub_ID', search);
  const { push } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        await api.post('/subscriptions/refresh-status');
        list.reload();
        const [m, p] = await Promise.all([fetchOptions('/members'), fetchOptions('/plans')]);
        setMembers(m);
        setPlans(p);
      } catch (err) {
        push(errorMessage(err), 'error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, Start_Date: todayDate() });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      Member_ID: String(row.Member_ID),
      Plan_ID: String(row.Plan_ID),
      Start_Date: row.Start_Date,
      End_Date: row.End_Date || '',
      Status: row.Status
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
      Plan_ID: Number(form.Plan_ID),
      Start_Date: form.Start_Date,
      Status: form.Status
    };
    if (form.End_Date) payload.End_Date = form.End_Date;
    try {
      if (editing) {
        await api.put(`/subscriptions/${editing.Sub_ID}`, payload);
        push('Subscription updated.');
      } else {
        await api.post('/subscriptions', payload);
        push('Subscription created.');
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
      await api.delete(`/subscriptions/${del.Sub_ID}`);
      push('Subscription deleted.');
      setDel(null);
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'Sub_ID', label: 'ID' },
    { key: 'Member_Name', label: 'Member' },
    { key: 'Plan_Name', label: 'Plan' },
    { key: 'Start_Date', label: 'Start' },
    { key: 'End_Date', label: 'End' },
    { key: 'Amount_Paid', label: 'Paid', render: (r) => formatMoney(r.Amount_Paid) },
    {
      key: 'Days_Left',
      label: 'Days Left',
      render: (r) => (
        <div className="text-right">
          {r.Days_Left != null ? `${r.Days_Left}d` : '—'}
        </div>
      )
    },
    {
      key: 'Display_Status',
      label: 'Status',
      render: (r) => <StatusBadge value={r.Display_Status || r.Status} />
    },
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
        title="Subscriptions"
        subtitle="Member plans. End_Date is computed from the plan if left blank."
        addLabel="Add subscription"
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
        emptyTitle="No subscriptions found"
        emptyHint="Create a subscription for a member."
        rowKey={(r) => r.Sub_ID}
      />
      <Modal open={open} title={editing ? 'Edit subscription' : 'Add subscription'} onClose={() => setOpen(false)}>
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
            label="Plan"
            name="Plan_ID"
            type="select"
            value={form.Plan_ID}
            onChange={change}
            error={errors.Plan_ID}
            required
            options={plans.map((p) => ({ value: p.Plan_ID, label: `${p.Plan_Name} (${p.Duration_Months} mo)` }))}
          />
          <FormField
            label="Start Date"
            name="Start_Date"
            type="date"
            value={form.Start_Date}
            onChange={change}
            error={errors.Start_Date}
            required
            hint="A member can have one running subscription. A new one can be booked in advance and must start after the current one ends."
          />
          <FormField
            label="End Date"
            name="End_Date"
            type="date"
            value={form.End_Date}
            onChange={change}
            error={errors.End_Date}
            hint="Leave blank to let the API compute it from plan duration."
          />
          <FormField
            label="Status"
            name="Status"
            type="select"
            value={form.Status}
            onChange={change}
            error={errors.Status}
            required={Boolean(editing)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'Expired', label: 'Expired' },
              { value: 'Cancelled', label: 'Cancelled' }
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
        title="Delete subscription"
        message="Delete this subscription? Payments linked to it will block deletion."
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}

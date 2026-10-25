import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api, { errorMessage, fieldErrors } from '../api/axios';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import DataTable from '../components/DataTable.jsx';
import FormField from '../components/FormField.jsx';
import Modal from '../components/Modal.jsx';
import PageHeader from '../components/PageHeader.jsx';
import RowActions from '../components/RowActions.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { useToast } from '../components/Toast.jsx';
import useList from '../hooks/useList.js';
import { todayDate } from '../utils.js';

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Out of Order'];
const EMPTY = { Name: '', Category: '', Purchase_Date: todayDate(), Condition: 'Good' };

export default function Equipment() {
  const { search, setSearch } = useOutletContext();
  const list = useList('/equipment', 'Equip_ID', search);
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
    setForm({ ...EMPTY, Purchase_Date: todayDate() });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      Name: row.Name,
      Category: row.Category,
      Purchase_Date: row.Purchase_Date,
      Condition: row.Condition
    });
    setErrors({});
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (editing) {
        await api.put(`/equipment/${editing.Equip_ID}`, form);
        push('Equipment updated.');
      } else {
        await api.post('/equipment', form);
        push('Equipment added.');
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
      await api.delete(`/equipment/${del.Equip_ID}`);
      push('Equipment deleted.');
      setDel(null);
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'Equip_ID', label: 'ID' },
    { key: 'Name', label: 'Name' },
    { key: 'Category', label: 'Category' },
    { key: 'Purchase_Date', label: 'Purchase Date' },
    { key: 'Condition', label: 'Condition', render: (r) => <StatusBadge value={r.Condition} /> },
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
        title="Equipment"
        subtitle="Machines and free weights on the floor"
        addLabel="Add equipment"
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
        emptyTitle="No equipment found"
        emptyHint="Add equipment to track condition and maintenance."
        rowKey={(r) => r.Equip_ID}
      />
      <Modal open={open} title={editing ? 'Edit equipment' : 'Add equipment'} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={save}>
          <FormField label="Name" name="Name" value={form.Name} onChange={change} error={errors.Name} required />
          <FormField label="Category" name="Category" value={form.Category} onChange={change} error={errors.Category} required />
          <FormField
            label="Purchase Date"
            name="Purchase_Date"
            type="date"
            value={form.Purchase_Date}
            onChange={change}
            error={errors.Purchase_Date}
            required
          />
          <FormField
            label="Condition"
            name="Condition"
            type="select"
            value={form.Condition}
            onChange={change}
            error={errors.Condition}
            required
            options={CONDITIONS.map((c) => ({ value: c, label: c }))}
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
        title="Delete equipment"
        message={del ? `Delete ${del.Name}? Maintenance logs will block deletion.` : ''}
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}

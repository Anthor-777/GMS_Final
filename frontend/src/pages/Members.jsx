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
import { todayDate } from '../utils.js';

const EMPTY = {
  Name: '',
  DOB: '',
  Gender: 'Male',
  Phone: '',
  Email: '',
  Join_Date: todayDate()
};

export default function Members() {
  const { search, setSearch } = useOutletContext();
  const list = useList('/members', 'Member_ID', search);
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
    setForm({ ...EMPTY, Join_Date: todayDate() });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      Name: row.Name,
      DOB: row.DOB,
      Gender: row.Gender,
      Phone: row.Phone,
      Email: row.Email,
      Join_Date: row.Join_Date
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
        await api.put(`/members/${editing.Member_ID}`, form);
        push('Member updated.');
      } else {
        await api.post('/members', form);
        push('Member created.');
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
      await api.delete(`/members/${del.Member_ID}`);
      push('Member deleted.');
      setDel(null);
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'Member_ID', label: 'ID' },
    { key: 'Name', label: 'Name' },
    { key: 'DOB', label: 'DOB' },
    { key: 'Gender', label: 'Gender' },
    { key: 'Phone', label: 'Phone' },
    { key: 'Email', label: 'Email' },
    { key: 'Join_Date', label: 'Join Date' },
    {
      key: 'actions',
      label: '',
      sortable: false,
      render: (row) => (
        <RowActions onEdit={() => openEdit(row)} onDelete={() => setDel(row)} />
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle="People training at the gym"
        addLabel="Add member"
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
        emptyTitle="No members found"
        emptyHint="Add a member or clear the search."
        rowKey={(r) => r.Member_ID}
      />
      <Modal open={open} title={editing ? 'Edit member' : 'Add member'} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={save}>
          <FormField label="Name" name="Name" value={form.Name} onChange={change} error={errors.Name} required />
          <FormField label="DOB" name="DOB" type="date" value={form.DOB} onChange={change} error={errors.DOB} required />
          <FormField
            label="Gender"
            name="Gender"
            type="select"
            value={form.Gender}
            onChange={change}
            error={errors.Gender}
            required
            options={[
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other', label: 'Other' }
            ]}
          />
          <FormField label="Phone" name="Phone" value={form.Phone} onChange={change} error={errors.Phone} required />
          <FormField label="Email" name="Email" type="email" value={form.Email} onChange={change} error={errors.Email} required />
          <FormField
            label="Join Date"
            name="Join_Date"
            type="date"
            value={form.Join_Date}
            onChange={change}
            error={errors.Join_Date}
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
        title="Delete member"
        message={del ? `Delete ${del.Name}? Linked subscriptions, sessions or attendance will block this.` : ''}
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}

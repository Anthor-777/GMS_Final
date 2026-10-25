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
import { formatMoney, todayDate } from '../utils.js';

const EMPTY = { Equip_ID: '', Service_Date: todayDate(), Cost: '', Technician: '' };

export default function MaintenanceLogs() {
  const { search, setSearch } = useOutletContext();
  const list = useList('/maintenance', 'Log_ID', search);
  const { push } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    fetchOptions('/equipment')
      .then(setEquipment)
      .catch((err) => push(errorMessage(err), 'error'));
  }, [push]);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY, Service_Date: todayDate() });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      Equip_ID: String(row.Equip_ID),
      Service_Date: row.Service_Date,
      Cost: row.Cost,
      Technician: row.Technician
    });
    setErrors({});
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const payload = {
      Equip_ID: Number(form.Equip_ID),
      Service_Date: form.Service_Date,
      Cost: Number(form.Cost),
      Technician: form.Technician
    };
    try {
      if (editing) {
        await api.put(`/maintenance/${editing.Log_ID}`, payload);
        push('Maintenance log updated.');
      } else {
        await api.post('/maintenance', payload);
        push('Maintenance log created.');
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
      await api.delete(`/maintenance/${del.Log_ID}`);
      push('Maintenance log deleted.');
      setDel(null);
      list.reload();
    } catch (err) {
      push(errorMessage(err), 'error');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'Log_ID', label: 'ID' },
    { key: 'Equip_Name', label: 'Equipment' },
    { key: 'Service_Date', label: 'Service Date' },
    { key: 'Cost', label: 'Cost', render: (r) => formatMoney(r.Cost) },
    { key: 'Technician', label: 'Technician' },
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
        title="Maintenance Logs"
        subtitle="Service history for equipment"
        addLabel="Add log"
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
        emptyTitle="No maintenance logs"
        emptyHint="Log a service visit for a machine."
        rowKey={(r) => r.Log_ID}
      />
      <Modal open={open} title={editing ? 'Edit maintenance log' : 'Add maintenance log'} onClose={() => setOpen(false)}>
        <form className="grid gap-4" onSubmit={save}>
          <FormField
            label="Equipment"
            name="Equip_ID"
            type="select"
            value={form.Equip_ID}
            onChange={change}
            error={errors.Equip_ID}
            required
            options={equipment.map((eq) => ({ value: eq.Equip_ID, label: `${eq.Name} (#${eq.Equip_ID})` }))}
          />
          <FormField
            label="Service Date"
            name="Service_Date"
            type="date"
            value={form.Service_Date}
            onChange={change}
            error={errors.Service_Date}
            required
          />
          <FormField label="Cost" name="Cost" type="number" min="0" step="0.01" value={form.Cost} onChange={change} error={errors.Cost} required />
          <FormField
            label="Technician"
            name="Technician"
            value={form.Technician}
            onChange={change}
            error={errors.Technician}
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
        title="Delete maintenance log"
        message="Delete this maintenance log?"
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}

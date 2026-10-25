export function todayDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toDatetimeLocal(sql) {
  if (!sql) return '';
  const value = String(sql).trim().replace(' ', 'T');
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return value.slice(0, 19);
  return value;
}

export function fromDatetimeLocal(value) {
  if (!value) return '';
  const [datePart, timePart = '00:00:00'] = String(value).split('T');
  const time = timePart.length === 5 ? `${timePart}:00` : timePart.slice(0, 8);
  return `${datePart} ${time}`;
}

export function toTimeInput(sql) {
  if (!sql) return '';
  const value = String(sql);
  return value.length >= 5 ? value.slice(0, 8) : value;
}

export function fromTimeInput(value) {
  if (!value) return '';
  return value.length === 5 ? `${value}:00` : value;
}

export function formatDate(sqlDate) {
  if (!sqlDate) return '—';
  if (typeof sqlDate === 'string') {
    return sqlDate.slice(0, 10);
  }
  const d = new Date(sqlDate);
  if (isNaN(d.getTime())) return String(sqlDate);
  return d.toISOString().slice(0, 10);
}

export function formatINR(n) {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n || 0);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatMoney(n) {
  return formatINR(n);
}

export function formatMonth(ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[Number(m) - 1]} ${y}`;
}

export function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

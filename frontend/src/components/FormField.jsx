export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  options,
  placeholder,
  min,
  max,
  step,
  hint
}) {
  const common = {
    id: name,
    name,
    value: value ?? '',
    onChange,
    className: `input-field ${error ? 'border-danger' : ''}`,
    required
  };

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink-secondary">
        {label}
        {required ? <span className="ml-1 text-accent">*</span> : null}
      </span>
      {type === 'select' ? (
        <select {...common}>
          <option value="">{placeholder || `Select ${label}`}</option>
          {(options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea {...common} rows={3} placeholder={placeholder} />
      ) : (
        <input {...common} type={type} placeholder={placeholder} min={min} max={max} step={step} />
      )}
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </label>
  );
}

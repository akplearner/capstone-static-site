'use client';

const inputClass =
  'mt-1 w-full rounded-lg depth-edge bg-panel px-3 py-2 text-sm text-ink';
const labelClass = 'block text-xs font-medium text-muted';

/** Said under an id that can no longer change (R122): progress, team state and the RACI are recorded against it. */
export const ID_LOCKED_HINT = 'Progress is recorded against this id, so it cannot change once saved.';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  mono,
  readOnly,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  /** Shown and copyable, not editable; `input[aria-readonly='true']` in globals.css gives it the quieter look. */
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
        className={`${inputClass} ${mono ? 'font-mono' : ''}`}
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={inputClass} />
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  readOnly,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        readOnly={readOnly}
        aria-readonly={readOnly || undefined}
        className={inputClass}
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span>
        <span className={labelClass}>{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-accent' : 'bg-muted'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-panel transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}

// Comma-separated list helpers (for frameworks, deliverables).
export function listToText(list: string[]): string {
  return list.join(', ');
}
export function textToList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

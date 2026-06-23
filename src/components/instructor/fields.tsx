'use client';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white';
const labelClass = 'block text-xs font-medium text-gray-600 dark:text-gray-300';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} ${mono ? 'font-mono' : ''}`}
      />
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
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value) || 0)} className={inputClass} />
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

'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { RoleIcon } from '../RoleIcon';
import { Course, RoleDef } from '@/lib/types';
import { ICON_NAMES, DEFAULT_ICON } from '@/lib/icons';
import { TextField, TextArea, SelectField } from './fields';

export function RolesEditor({ course, onChange }: { course: Course; onChange: (c: Course) => void }) {
  const setRoles = (roles: RoleDef[]) => onChange({ ...course, roles });

  const update = (i: number, patch: Partial<RoleDef>) =>
    setRoles(course.roles.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const add = () =>
    setRoles([
      ...course.roles,
      { id: `role-${course.roles.length + 1}`, name: 'New Role', mission: '', color: '#2563eb', icon: DEFAULT_ICON },
    ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">Define the tracks students can choose. Leave empty for a single-track course.</p>
        <Button size="sm" onClick={add} className="flex items-center gap-1"><Plus className="h-4 w-4" /> Add role</Button>
      </div>
      {course.roles.map((r, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <RoleIcon iconName={r.icon} className="h-5 w-5" color={r.color} />
            <span className="font-medium text-gray-900 dark:text-white">{r.name || r.id}</span>
            <button type="button" aria-label={`Remove role ${r.name || r.id}`} onClick={() => setRoles(course.roles.filter((_, idx) => idx !== i))} className="ml-auto text-gray-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField label="ID (used in URLs)" value={r.id} onChange={(v) => update(i, { id: v })} mono />
            <TextField label="Name" value={r.name} onChange={(v) => update(i, { name: v })} />
          </div>
          <TextArea label="Mission" value={r.mission} onChange={(v) => update(i, { mission: v })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-xs font-medium text-gray-600 dark:text-gray-300">Color</span>
              <input type="color" value={r.color} onChange={(e) => update(i, { color: e.target.value })} className="mt-1 h-9 w-full rounded border border-gray-300 dark:border-gray-600" />
            </label>
            <SelectField
              label="Icon"
              value={r.icon}
              onChange={(v) => update(i, { icon: v })}
              options={ICON_NAMES.map((n) => ({ value: n, label: n }))}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

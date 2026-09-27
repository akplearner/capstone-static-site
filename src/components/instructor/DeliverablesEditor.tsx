'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Collapsible } from '@/components/ui/Button';
import { TextField, TextArea } from '@/components/instructor/fields';
import { DeliverableForm } from '@/components/docs/DeliverableForm';
import { visualFor } from '@/components/diagrams/kit/visualFor';
import { emptyFormContext, type DeliverableData, type DeliverableDef } from '@/lib/docs/types';
import { seedDeliverable } from '@/lib/docs/definitions';
import { withDerivedBundle } from '@/lib/docs/derive';
import { validateDeliverableDef } from '@/lib/docs/validateDeliverable';
import type { Course } from '@/lib/types';

/**
 * The admin's deliverable editor (R85): prose as form fields, structure as
 * JSON that must pass `validateDeliverableDef` before it applies, and a live
 * preview rendered by the SAME components students see — DeliverableForm and
 * the diagram kit — so what the admin approves is what a team gets.
 *
 * Nothing here writes storage: edits flow up to the editor page's draft and
 * ride its one Save (the whole-document write the admin policy guards).
 */
export function DeliverablesEditor({
  course,
  defs,
  onChange,
}: {
  course: Course;
  defs: DeliverableDef[];
  onChange: (defs: DeliverableDef[]) => void;
}) {
  const [selectedId, setSelectedId] = useState(defs[0]?.id ?? '');
  const def = defs.find((d) => d.id === selectedId) ?? defs[0];
  // Preview data resets when the selected form changes (render-time reset).
  const [previewFor, setPreviewFor] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<DeliverableData | null>(null);

  if (!def) {
    return <p className="text-sm text-muted">This course has no deliverable forms yet — duplicate a built-in course to inherit its set.</p>;
  }
  if (previewFor !== def.id) {
    setPreviewFor(def.id);
    try {
      setPreviewData(seedDeliverable(withDerivedBundle(def)));
    } catch {
      setPreviewData(null);
    }
  }

  const update = (patch: Partial<DeliverableDef>) =>
    onChange(defs.map((d) => (d.id === def.id ? { ...d, ...patch } : d)));

  const health = validateDeliverableDef(def);
  const derived = (() => {
    try {
      return withDerivedBundle(def);
    } catch {
      return null;
    }
  })();
  const lines = (v: string) => v.split('\n').map((x) => x.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          <span className="block font-medium text-body">Form</span>
          <select value={def.id} onChange={(e) => setSelectedId(e.target.value)} className="mt-1 text-sm">
            {defs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.num}. {d.title}
              </option>
            ))}
          </select>
        </label>
        {health.ok ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-2xs font-semibold text-ok">
            <CheckCircle2 className="h-3 w-3" /> Valid — renders like the preview
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-warn-soft px-2 py-0.5 text-2xs font-semibold text-warn">
            <AlertTriangle className="h-3 w-3" /> {health.error}
          </span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <TextField label="Title" value={def.title} onChange={(v) => update({ title: v })} />
          <TextArea label="Purpose (one sentence under the title)" value={def.purpose} onChange={(v) => update({ purpose: v })} rows={2} />
          <TextArea label="How to build it" value={def.howTo} onChange={(v) => update({ howTo: v })} rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Folder" value={def.folder} onChange={(v) => update({ folder: v })} mono />
            <TextField label="File" value={def.file} onChange={(v) => update({ file: v })} mono />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="block font-medium text-body">Owner (focus)</span>
              <select value={def.owner} onChange={(e) => update({ owner: e.target.value })} className="mt-1 w-full text-sm">
                {course.roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
            <TextField
              label="Weeks (comma-separated)"
              value={def.weeks.join(', ')}
              onChange={(v) => {
                const weeks = v.split(',').map((x) => Number(x.trim())).filter((n) => Number.isFinite(n));
                if (weeks.length) update({ weeks });
              }}
              mono
            />
          </div>
          <TextField label="Standard it follows" value={def.standard} onChange={(v) => update({ standard: v })} />
          <TextArea label="Build steps (one per line)" value={(def.buildSteps ?? []).join('\n')} onChange={(v) => update({ buildSteps: lines(v) })} rows={4} />
          <TextArea label="Common mistakes (one per line)" value={(def.pitfalls ?? []).join('\n')} onChange={(v) => update({ pitfalls: lines(v) })} rows={3} />

          {(def.dod ?? []).length > 0 && (
            <div className="space-y-2 rounded-lg depth-edge p-3">
              <h4 className="text-sm font-semibold text-ink">Definition of done — the labels students read</h4>
              {(def.dod ?? []).map((c, i) => (
                <TextField
                  key={i}
                  label={`Check ${i + 1}`}
                  value={c.label}
                  onChange={(v) => update({ dod: (def.dod ?? []).map((x, j) => (j === i ? { ...x, label: v } : x)) })}
                />
              ))}
              <p className="text-2xs text-muted">The predicates behind each check live in the Structure editors below.</p>
            </div>
          )}

          <div className="rounded-lg depth-edge bg-panel-2 px-3">
            <Collapsible title="Structure (JSON) — validated before it applies" defaultOpen={false}>
              <div className="space-y-3 pb-3">
                {(['sections', 'dod', 'checks', 'rubric', 'visual'] as const).map((key) => (
                  <JsonBlock
                    key={`${def.id}:${key}`}
                    label={key}
                    value={def[key]}
                    onApply={(parsed) => {
                      const candidate = { ...def, [key]: parsed };
                      const v = validateDeliverableDef(candidate);
                      if (!v.ok) return v.error;
                      update({ [key]: parsed } as Partial<DeliverableDef>);
                      return null;
                    }}
                  />
                ))}
              </div>
            </Collapsible>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-ink">Preview — exactly what a student sees</h4>
          {derived && previewData && health.ok ? (
            <div className="space-y-4 rounded-lg depth-edge bg-panel p-4">
              {visualFor(derived)}
              <DeliverableForm def={derived} data={previewData} ctx={emptyFormContext()} onChange={setPreviewData} />
            </div>
          ) : (
            <p className="rounded-lg border border-warn-line bg-warn-soft p-3 text-sm text-ink">
              The preview is paused until the definition is valid — fix the error above and it returns.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** One JSON structure: edit as text, Apply runs the validator, invalid never lands. */
function JsonBlock({
  label,
  value,
  onApply,
}: {
  label: string;
  value: unknown;
  onApply: (parsed: unknown) => string | null;
}) {
  const [text, setText] = useState(() => JSON.stringify(value ?? null, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const apply = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setError(`Not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
      return;
    }
    const err = onApply(parsed === null ? undefined : parsed);
    setError(err);
    if (!err) {
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-ink">{label}</span>
        <span className="flex items-center gap-2">
          {applied && <span className="text-2xs font-medium text-ok">Applied</span>}
          <button type="button" onClick={apply} className="rounded-md bg-accent px-2 py-1 text-2xs font-medium text-accent-contrast hover:bg-accent-strong">
            Apply
          </button>
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.min(14, Math.max(4, text.split('\n').length))}
        spellCheck={false}
        className="mt-1 w-full rounded-md bg-panel p-2 font-mono text-xs text-ink"
      />
      {error && <p className="text-2xs text-warn">{error}</p>}
    </div>
  );
}

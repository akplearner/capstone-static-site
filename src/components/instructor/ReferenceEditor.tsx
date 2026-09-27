'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Collapsible } from '@/components/ui/Button';

/**
 * The admin's reference-content editor (R85): the glossary as term/definition
 * rows, and each of the document's content modules (diagram copy, manual
 * sections, guides) as JSON that must parse — and keep its top-level shape —
 * before it applies. Like the deliverables editor, nothing here writes
 * storage; edits ride the course editor's one Save.
 */
export function ReferenceEditor({
  glossary,
  onGlossary,
  modules,
  onModule,
}: {
  glossary: Record<string, string>;
  onGlossary: (g: Record<string, string>) => void;
  modules: Record<string, unknown>;
  onModule: (key: string, value: unknown) => void;
}) {
  const [newTerm, setNewTerm] = useState('');
  const terms = Object.keys(glossary).sort();
  const moduleKeys = Object.keys(modules).sort();

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Glossary — the terms prose links to</h3>
        {terms.length === 0 && <p className="text-sm text-muted">No glossary on this course’s document.</p>}
        <div className="space-y-2">
          {terms.map((t) => (
            <div key={t} className="flex items-start gap-2">
              <span className="mt-2 w-40 shrink-0 break-words font-mono text-xs font-semibold text-ink">{t}</span>
              <textarea
                value={glossary[t]}
                onChange={(e) => onGlossary({ ...glossary, [t]: e.target.value })}
                rows={2}
                className="min-w-0 flex-1 rounded-md bg-panel p-2 text-sm text-ink"
              />
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => {
                  const next = { ...glossary };
                  delete next[t];
                  onGlossary(next);
                }}
                className="mt-2 rounded-md p-1 text-muted hover:bg-panel-2 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            placeholder="New term"
            className="rounded-md bg-panel px-2 py-1.5 font-mono text-xs text-ink"
          />
          <button
            type="button"
            disabled={!newTerm.trim() || newTerm.trim() in glossary}
            onClick={() => {
              onGlossary({ ...glossary, [newTerm.trim()]: '' });
              setNewTerm('');
            }}
            className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1.5 text-xs font-medium text-accent-contrast disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" /> Add term
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-ink">Content modules — diagrams, manual copy, guides</h3>
        <p className="text-sm text-muted">
          Each module is the data one reference component renders. An edit applies only if it parses
          and keeps the module’s top-level shape; the student pages read whatever is saved here.
        </p>
        {moduleKeys.length === 0 && <p className="text-sm text-muted">This course’s document carries no content modules.</p>}
        {moduleKeys.map((key) => (
          <div key={key} className="rounded-lg depth-edge bg-panel-2 px-3">
            <Collapsible title={key} defaultOpen={false}>
              <div className="pb-3">
                <ModuleJson value={modules[key]} onApply={(v) => onModule(key, v)} />
              </div>
            </Collapsible>
          </div>
        ))}
      </section>
    </div>
  );
}

function ModuleJson({ value, onApply }: { value: unknown; onApply: (v: unknown) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
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
    const was = Array.isArray(value) ? 'array' : typeof value;
    const is = Array.isArray(parsed) ? 'array' : typeof parsed;
    if (was !== is) {
      setError(`This module is ${was === 'object' ? 'an object' : `a ${was}`} — the edit is ${is === 'object' ? 'an object' : `a ${is}`}, which would break its renderer.`);
      return;
    }
    setError(null);
    onApply(parsed);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div>
      <div className="mb-1 flex justify-end gap-2">
        {applied && <span className="text-2xs font-medium text-ok">Applied</span>}
        <button type="button" onClick={apply} className="rounded-md bg-accent px-2 py-1 text-2xs font-medium text-accent-contrast hover:bg-accent-strong">
          Apply
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.min(20, Math.max(6, text.split('\n').length))}
        spellCheck={false}
        className="w-full rounded-md bg-panel p-2 font-mono text-xs text-ink"
      />
      {error && <p className="text-2xs text-warn">{error}</p>}
    </div>
  );
}

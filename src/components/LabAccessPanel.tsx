'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Circle, Server } from 'lucide-react';
import { Collapsible } from './ui/Button';
import { getLabAccess, hasLabAccess, labProfile, saveLabAccess, useLabAccess } from '@/lib/labAccess';
import { useRequireAuth } from '@/lib/useRequireAuth';

// Week-0 "Lab access" card: the student stores the target IPs/credentials their
// instructor gave them and ticks a reachability checklist. The IPs are substituted
// into command placeholders elsewhere (CommandBlock), so copied commands target the
// student's own machines instead of <YOUR_TARGET_IP>.
//
// This saves to the student's account (owner-only — see
// supabase/migrations/0002_student_state.sql), so the details follow them between
// devices without ever being visible to teammates or instructors.
export function LabAccessPanel({ courseId }: { courseId: string }) {
  const lab = useLabAccess(courseId);
  const { guard } = useRequireAuth();

  const setValue = (key: string, value: string) => {
    guard('save your lab details', () => {
      const cur = getLabAccess(courseId);
      saveLabAccess(courseId, { ...cur, values: { ...cur.values, [key]: value } });
    });
  };
  const toggleCheck = (key: string) => {
    guard('save your lab checklist', () => {
      const cur = getLabAccess(courseId);
      saveLabAccess(courseId, { ...cur, checks: { ...cur.checks, [key]: !cur.checks[key] } });
    });
  };
  const setNotes = (notes: string) => {
    guard('save your lab notes', () => {
      const cur = getLabAccess(courseId);
      saveLabAccess(courseId, { ...cur, notes });
    });
  };

  // What this course's lab is made of. A build-and-document course has no
  // target range to collect, so the whole panel is skipped rather than rendered
  // empty — see LAB_PROFILES.
  const { fields, checks } = labProfile(courseId);
  const filledCount = fields.filter((f) => lab.values[f.key]?.trim()).length;
  const checkCount = checks.filter((c) => lab.checks[c.key]).length;

  if (!hasLabAccess(courseId)) return null;

  return (
    <div id="lab-access" className="scroll-mt-24 rounded-lg border border-line bg-panel px-4">
      <Collapsible
        title={`Lab access — your targets & reachability  (${filledCount}/${fields.length} set · ${checkCount}/${checks.length} checked)`}
        defaultOpen={filledCount === 0}
      >
        <div className="space-y-4 pb-2">
          {/* One sentence. This was a 44-word paragraph covering placeholder
              substitution and the privacy model; the notes field's own
              placeholder already says "visible only to you". */}
          <p className="flex items-start gap-2 text-sm text-muted">
            <Server className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            Enter your lab&apos;s IPs and every command below fills them in for you. Saved to your
            account, visible only to you.
          </p>

          <div className="flex flex-col gap-1">
            <Link
              href={`/courses/${courseId}/guide/reference#lab`}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              New here? Lab requirements &amp; setup <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href={`/courses/${courseId}/guide/reference#terminal`}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              A command won&apos;t run? Terminal basics &amp; common fixes <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <label key={f.key} className="block">
                <span className="block text-xs font-medium text-body">{f.label}</span>
                <input
                  type="text"
                  value={lab.values[f.key] ?? ''}
                  onChange={(e) => setValue(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="mt-1 w-full rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
                />
              </label>
            ))}
          </div>

          <div>
            <div className="eyebrow-muted">
              Reachability check
            </div>
            <ul className="mt-2 space-y-1.5">
              {checks.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => toggleCheck(c.key)}
                    className="flex items-center gap-2 text-left text-sm text-body"
                  >
                    {lab.checks[c.key] ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-line" />
                    )}
                    <span className={lab.checks[c.key] ? 'text-muted line-through dark:text-muted' : ''}>
                      {c.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <label className="block">
            <span className="block text-xs font-medium text-body">Notes (lab hostnames, throwaway logins…)</span>
            {/* This field is stored in the database — owner-only, but stored. Its
                original placeholder invited students to paste passwords, which on
                a public deployment is a liability we shouldn't create by
                suggestion. The warning is inline rather than buried in the
                privacy policy because this is the moment someone is about to
                type. */}
            <span className="mt-1 flex items-start gap-1.5 text-xs" style={{ color: 'var(--color-warn)' }}>
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Never put a production password, a work login, or anything you reuse elsewhere here —
              throwaway lab credentials only.
            </span>
            <textarea
              value={lab.notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. ubuntu host is lab-01; DVWA on :8080 — throwaway lab details only"
              className="mt-1.5 w-full rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      </Collapsible>
    </div>
  );
}

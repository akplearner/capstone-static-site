'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Surface } from '@/components/ui/Surface';
import { toast } from '@/lib/toastBus';
import { courseRepo, progressRepo } from '@/lib/data';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { useAuth } from '@/lib/useAuth';
import { useClientStore, EMPTY_ARRAY } from '@/lib/useClientStore';
import { localDay } from '@/lib/localDate';
import { useConsents } from '@/lib/legal/consents';
import { OUTCOME_STATUS, OUTCOME_STATUSES, fetchCloudOutcomes, latestOutcome, localOutcomes, saveLocalOutcome, saveOutcomeInCloud, type LearnerOutcome, type OutcomeStatus } from '@/lib/legal/outcomes';
import type { Course } from '@/lib/types';

/**
 * R110 — the consented outcome form: shown only while the outcome grant is
 * on. Every save appends a row; the latest is the current answer. The
 * employer name is the member's alone; instructors see counts per status for
 * a course, and only from five members.
 */
export function OutcomesSection() {
  const { consents } = useConsents();
  const cloud = isSupabaseConfigured();
  const { user } = useAuth();
  const localRows = useClientStore<LearnerOutcome[]>(localOutcomes, EMPTY_ARRAY);
  const started = useClientStore<Course[]>(() => courseRepo.list().filter((c) => !!progressRepo.getContext(c.id)), EMPTY_ARRAY);
  const [cloudRows, setCloudRows] = useState<LearnerOutcome[] | null>(null);
  const [form, setForm] = useState<Omit<LearnerOutcome, 'recordedAt'>>({ status: 'studying', roleTitle: '', employer: '', startedOn: '', usedAtWork: {} });
  const [seeded, setSeeded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cloud || !user) return;
    let on = true;
    void fetchCloudOutcomes().then((r) => {
      if (on) setCloudRows(r ?? []);
    });
    return () => {
      on = false;
    };
  }, [cloud, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- the account id is the dependency

  const rows = cloud ? (cloudRows ?? []) : localRows;
  const latest = latestOutcome(rows);
  // Seed the form from the latest answer once it is known (render-time, the documented pattern).
  if (latest && !seeded) {
    setSeeded(true);
    setForm({ status: latest.status, roleTitle: latest.roleTitle, employer: latest.employer, startedOn: latest.startedOn, usedAtWork: { ...latest.usedAtWork } });
  }

  if (!consents.outcome) return null;

  const save = async () => {
    setBusy(true);
    let ok = true;
    if (cloud) {
      ok = !!user && (await saveOutcomeInCloud(user.id, form));
      if (ok) setCloudRows((r) => [...(r ?? []), { ...form, recordedAt: Date.now() }]);
    } else {
      saveLocalOutcome(form);
    }
    setBusy(false);
    toast(ok ? { message: 'Outcome saved. Only you can read the details; instructors see counts.', variant: 'success' } : { message: 'Couldn’t save the answer — check your connection and try again.', variant: 'warning' });
  };

  return (
    <Surface as="section" aria-labelledby="account-outcomes" data-outcome-form>
      <h2 id="account-outcomes" className="text-lg font-bold text-ink">Outcomes</h2>
      <p className="mt-1 text-sm text-muted">
        Where the work took you, in your own words. Each save adds a new answer; the latest one counts.
        The employer name is visible only to you.
      </p>
      {latest && (
        <p className="mt-2 text-xs text-muted" data-outcome-latest>
          Last answer: {OUTCOME_STATUS[latest.status]}, {localDay(latest.recordedAt)}.
        </p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-body">Status</span>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OutcomeStatus })} className="mt-1 w-full rounded-lg bg-panel px-3 py-2 text-sm text-ink" data-outcome-status>
            {OUTCOME_STATUSES.map((s) => (
              <option key={s} value={s}>{OUTCOME_STATUS[s]}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-body">Start month</span>
          <input type="month" value={form.startedOn} onChange={(e) => setForm({ ...form, startedOn: e.target.value })} className="mt-1 w-full rounded-lg bg-panel px-3 py-2 text-sm text-ink" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-body">Role title</span>
          <input value={form.roleTitle} maxLength={120} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} className="mt-1 w-full rounded-lg bg-panel px-3 py-2 text-sm text-ink" placeholder="SOC analyst" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-body">Employer (visible only to you)</span>
          <input value={form.employer} maxLength={120} onChange={(e) => setForm({ ...form, employer: e.target.value })} className="mt-1 w-full rounded-lg bg-panel px-3 py-2 text-sm text-ink" />
        </label>
      </div>
      {started.length > 0 && (
        <fieldset className="mt-3">
          <legend className="text-sm font-medium text-body">Used at work</legend>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
            {started.map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <input type="checkbox" checked={!!form.usedAtWork[c.id]} onChange={(e) => setForm({ ...form, usedAtWork: { ...form.usedAtWork, [c.id]: e.target.checked } })} />
                {c.title}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="mt-4">
        <Button variant="secondary" disabled={busy} className="flex items-center gap-2" onClick={() => void save()} data-outcome-save>
          <Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save answer'}
        </Button>
      </div>
    </Surface>
  );
}

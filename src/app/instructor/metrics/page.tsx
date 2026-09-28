'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowLeft, FileCheck2, RefreshCw, Users } from 'lucide-react';
import { AdminGate } from '@/components/InstructorGate';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Crumbs } from '@/components/SiteNav';
import { Alert } from '@/components/ui/Alert';
import { CohortSkeleton } from '@/components/ui/Skeletons';
import { loadMetrics, type MetricsData } from '@/lib/data/metricsLoader';
import { getBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { PRESENCE_CHANNEL } from '@/lib/usePresence';
import { teamLabel } from '@/lib/team';

/**
 * Platform metrics (R86), the admin's answer to "how is the platform doing":
 * every account with its signup date, who is on RIGHT NOW (realtime
 * presence), last activity (the heartbeat clock), acknowledgement status,
 * and every enrolment with team and rough progress. Deliberately never lab
 * access, notes or private state — metrics count activity, they don't read
 * work; the cohort dashboard owns the careful per-student view.
 */

const LIVE_FALLBACK_MS = 2 * 60_000;

export default function MetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [live, setLive] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  // The clock the "last activity" labels compare against — read when the data
  // loads, not during render (the purity lint is right: a re-render is not an
  // event). Refresh re-reads it.
  const [now, setNow] = useState(() => Date.now());

  const reload = () =>
    void loadMetrics().then((d) => {
      setNow(Date.now());
      setData(d);
    });
  useEffect(reload, []);

  // Who is on right now: membership of the presence channel every signed-in
  // tab joins. Synced live; falls back to the heartbeat clock below.
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getBrowserClient();
    if (!supabase) return;
    const channel = supabase.channel(PRESENCE_CHANNEL, { config: { presence: { key: 'metrics-observer' } } });
    channel.on('presence', { event: 'sync' }, () => {
      setLive(new Set(Object.keys(channel.presenceState()).filter((k) => k !== 'metrics-observer')));
    });
    channel.subscribe();
    return () => void channel.unsubscribe();
  }, []);

  if (!data) {
    return (
      <AdminGate>
        <CohortSkeleton />
      </AdminGate>
    );
  }

  const isLive = (u: MetricsData['users'][number]) =>
    live.has(u.id) || (u.lastSeenAt !== null && now - u.lastSeenAt < LIVE_FALLBACK_MS);
  const activeToday = data.users.filter((u) => u.lastSeenAt !== null && now - u.lastSeenAt < 86_400_000).length;
  const liveCount = data.users.filter(isLive).length;
  const enrolments = data.users.reduce((n, u) => n + u.enrolments.length, 0);
  const fullySigned = data.users.filter((u) => u.missingAgreements.length === 0).length;

  const q = query.trim().toLowerCase();
  const shown = q
    ? data.users.filter(
        (u) => u.displayName.toLowerCase().includes(q) || u.enrolments.some((e) => e.courseId.includes(q) || e.teamId.includes(q))
      )
    : data.users;

  // Signups by month, newest first — the "how fast are we growing" glance.
  const byMonth = new Map<string, number>();
  for (const u of data.users) {
    if (!u.signedUpAt) continue;
    const d = new Date(u.signedUpAt);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    byMonth.set(k, (byMonth.get(k) ?? 0) + 1);
  }
  const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);

  return (
    <AdminGate>
      <div className="space-y-8">
        <PageHeader
          eyebrow={<Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Instructor', href: '/instructor' }, { label: 'Metrics' }]} />}
          title="Platform metrics"
          lede={
            data.mode === 'cloud'
              ? 'Every account, live presence, last activity, acknowledgements and enrolments — the platform at a glance.'
              : 'This device only — offline mode has no accounts, so this shows the rosters and the acceptance log stored in this browser.'
          }
          trailing={
            <Button variant="secondary" size="sm" onClick={reload} className="flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={<Users className="h-4 w-4" />} label="Accounts" value={data.users.length} />
          <StatCard icon={<Activity className="h-4 w-4" />} label="On right now" value={liveCount} tone="ok" />
          <StatCard icon={<Activity className="h-4 w-4" />} label="Active today" value={activeToday} />
          <StatCard icon={<Users className="h-4 w-4" />} label="Enrolments" value={enrolments} />
          <StatCard
            icon={<FileCheck2 className="h-4 w-4" />}
            label="All agreements signed"
            value={`${fullySigned}/${data.users.length}`}
            tone={fullySigned === data.users.length ? 'ok' : 'warn'}
          />
        </div>

        {months.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-semibold text-ink">Signups:</span>
            {months.map(([m, n]) => (
              <span key={m} className="rounded-full depth-edge bg-panel px-2 py-0.5 font-mono text-xs">
                {m} · {n}
              </span>
            ))}
          </div>
        )}

        {data.users.length === 0 && <Alert variant="info">No accounts yet{data.mode === 'local' ? ' on this device' : ''}.</Alert>}

        {data.users.length > 0 && (
          <div className="space-y-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by name, course or team id…"
              className="w-full max-w-sm rounded-lg bg-panel px-3 py-2 text-sm text-ink"
            />
            <div className="relative overflow-x-auto rounded-lg depth-edge bg-panel">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                    <th scope="col" className="px-4 py-2.5">Account</th>
                    <th scope="col" className="px-4 py-2.5">Signed up</th>
                    <th scope="col" className="px-4 py-2.5">Last activity</th>
                    <th scope="col" className="px-4 py-2.5">Agreements</th>
                    <th scope="col" className="px-4 py-2.5">Enrolments &amp; progress</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((u) => (
                    <tr key={u.id} className="border-b border-line/60 align-top last:border-0">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          {u.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- provider-hosted picture; next/image would need every host allow-listed.
                            <img src={u.avatarUrl} alt="" width={24} height={24} referrerPolicy="no-referrer" className="h-6 w-6 shrink-0 rounded-full bg-panel-2 object-cover" />
                          ) : (
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-panel-2 text-2xs font-bold text-muted">
                              {u.displayName.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span className="font-medium text-ink">{u.displayName}</span>
                          {isLive(u) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-3xs font-semibold text-ok">
                              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ok" /> live
                            </span>
                          )}
                          {u.isAdmin ? (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-3xs font-semibold text-accent-ink">admin</span>
                          ) : u.isInstructor ? (
                            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-3xs font-semibold text-accent-ink">instructor</span>
                          ) : null}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {u.signedUpAt ? new Date(u.signedUpAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted">{lastSeenLabel(u.lastSeenAt, now)}</td>
                      <td className="px-4 py-3">
                        {u.missingAgreements.length === 0 ? (
                          <span className="rounded-full bg-ok-soft px-2 py-0.5 text-2xs font-semibold text-ok">
                            {data.agreementsTotal}/{data.agreementsTotal} signed
                          </span>
                        ) : (
                          <span
                            className="rounded-full bg-warn-soft px-2 py-0.5 text-2xs font-semibold text-warn"
                            title={`Missing: ${u.missingAgreements.join(', ')}`}
                          >
                            {data.agreementsTotal - u.missingAgreements.length}/{data.agreementsTotal} signed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.enrolments.length === 0 ? (
                          <span className="text-xs text-muted">browsing only</span>
                        ) : (
                          <span className="flex flex-wrap gap-1.5">
                            {u.enrolments.map((e) => (
                              <Link
                                key={`${e.courseId}:${e.teamId}`}
                                href={`/instructor/${e.courseId}/cohort`}
                                title={`${e.courseTitle} · ${e.cohort} · joined ${e.joinedAt ? new Date(e.joinedAt).toLocaleDateString() : '—'}`}
                                className="rounded-md depth-edge bg-panel-2 px-2 py-1 text-xs text-body hover:bg-panel"
                              >
                                <span className="font-medium text-ink">{e.courseId}</span> · {teamLabel(e.teamId)} ·{' '}
                                <span className={e.percent >= 100 ? 'font-semibold text-ok' : 'tabular-nums'}>{e.percent}%</span>
                              </Link>
                            ))}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">
              Progress here is steps ticked over the focus’s required steps — the quick pulse. The per-course
              cohort dashboards hold the careful view: evidence quality, verdicts, forms and grading.
            </p>
            <Link href="/instructor" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to the studio
            </Link>
          </div>
        )}
      </div>
    </AdminGate>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone?: 'ok' | 'warn' }) {
  return (
    <div className="rounded-lg depth-edge bg-panel px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {icon} {label}
      </div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${tone === 'ok' ? 'text-ok' : tone === 'warn' ? 'text-warn' : 'text-ink'}`}>{value}</div>
    </div>
  );
}

function lastSeenLabel(at: number | null, now: number): string {
  if (at === null) return 'never';
  const mins = Math.floor((now - at) / 60_000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(at).toLocaleDateString();
}

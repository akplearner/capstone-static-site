'use client';

import { useEffect, useState } from 'react';
import { Download, Link2Off, ShieldAlert } from 'lucide-react';
import { fetchShared, tokenFromHash, type SharedCopy } from '@/lib/shares';
import { courseDocument } from '@/lib/content/docs';
import { certOf, skillsOf } from '@/lib/content/read';
import { hydrateShareCourse, type ShareSkillProfile } from '@/lib/shareCopy';
import type { SkillPortfolio, SkillProfile } from '@/lib/skillProfile';
import type { KpiBoard } from '@/lib/kpiBoard';
import { SkillsSections } from '@/components/skills/SkillsSections';
import { KpiTable } from '@/components/skills/KpiTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Spinner';
import { useHydrated } from '@/lib/useClientStore';
import { downloadBytes } from '@/lib/download';
import { buildCredentialPdf, buildRecordPdf, credentialPdfName, recordPdfFromShare, recordPdfName } from '@/lib/recordPdf';
import { localDay } from '@/lib/localDate';

interface CopyCourse {
  courseId: string;
  title: string;
  role?: string;
  skills?: SkillProfile;
  kpis?: KpiBoard['kpis'];
}

/**
 * R114 — what a candidate link shows: the frozen copy, read through the
 * `shared-profile` function, under a banner that says exactly what it is.
 * The words come from the built-in course documents (`@/lib/content/docs`),
 * never the data layer, so a signed-out reader needs nothing but the link.
 * A copy from an older shape still downloads, whatever it renders.
 */
export function SharedProfile() {
  const hydrated = useHydrated();
  const token = hydrated ? tokenFromHash(window.location.hash) : null;
  const [copy, setCopy] = useState<SharedCopy | 'missing' | undefined>(undefined);
  useEffect(() => {
    if (!token) return;
    let on = true;
    void fetchShared(token).then((c) => {
      // R130: a copy carries its rows by id; the words come back from the course documents the app ships.
      if (on) setCopy(c ? (c.kind === 'profile' ? { ...c, snapshot: hydrateSnapshot(c.snapshot as Record<string, unknown>) } : c) : 'missing');
    });
    return () => {
      on = false;
    };
  }, [token]);

  if (!hydrated || (token && copy === undefined)) return <Skeleton className="h-96 w-full" />;
  if (!token || copy === 'missing' || !copy) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center" data-share-missing>
        <Link2Off className="mx-auto h-8 w-8 text-muted" aria-hidden />
        <h1 className="mt-3 text-xl font-semibold text-ink">This link is not available</h1>
        <p className="mt-2 text-sm text-muted">It may have expired, been revoked, or never existed. Ask the person who sent it for a new one.</p>
      </div>
    );
  }

  const snap = copy.snapshot as Record<string, unknown>;
  const made = localDay(Date.parse(copy.createdAt));
  const ends = localDay(Date.parse(copy.expiresAt));
  // R127: the copy as a PDF, never a JSON file: the figures and skills the page shows, or the credential's alignment.
  const download = () => {
    const now = Date.now();
    if (copy.kind === 'profile') downloadBytes(recordPdfName(now, 'shared'), buildRecordPdf(recordPdfFromShare(snap, now, { madeAt: Date.parse(copy.createdAt) })));
    else downloadBytes(credentialPdfName(now), buildCredentialPdf(snap, now));
  };
  const banner = (
    <div className="flex items-start gap-2 rounded-lg depth-edge bg-panel-2 p-3 text-sm text-body" data-share-banner>
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
      <p>
        A Capstone Quarry member shared this frozen copy of their {copy.kind === 'profile' ? 'portfolio export' : 'credential'}, made {made}. It is unsigned, records
        browser-side checks and server receipts of stamps, and is not proof of the machine. It expires on {ends}; the member can revoke it at any time.
        {copy.measuredAgainst ? ` The board was measured against ${copy.measuredAgainst}.` : ''}
      </p>
    </div>
  );

  if (copy.kind === 'credential') {
    const subject = (snap.credentialSubject ?? {}) as { achievement?: { name?: string; description?: string; alignment?: { targetName?: string; targetCode?: string }[] } };
    const a = subject.achievement ?? {};
    return (
      <div className="space-y-6" data-share-kind="credential">
        <PageHeader title={a.name ?? 'Shared credential'} lede={a.description} trailing={<DownloadButton onClick={download} />} />
        {banner}
        <Surface as="section">
          <h2 className="text-base font-semibold text-ink">Aligned to</h2>
          <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
            {(a.alignment ?? []).map((al) => (
              <li key={`${al.targetCode}`} className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-ink">{al.targetName}</span>
                <span className="font-mono text-2xs text-muted">{al.targetCode}</span>
              </li>
            ))}
          </ul>
        </Surface>
      </div>
    );
  }

  const courses = (Array.isArray(snap.courses) ? snap.courses : []) as CopyCourse[];
  const doc = courseDocument(courses[0]?.courseId ?? '') ?? courseDocument('security-plus');
  const words = doc ? skillsOf(doc) : null;
  const summary = (snap.summary ?? {}) as Partial<SkillPortfolio> & { verified?: number; verifiable?: number; receipted?: number | null; artifacts?: number };
  const display = String((snap.subject as { display?: unknown } | undefined)?.display ?? 'A Capstone Quarry member');
  const profiles = courses.filter((c) => c.skills && c.skills.rows).map((c) => ({ courseId: c.courseId, title: c.title, profile: c.skills as SkillProfile }));

  return (
    <div className="space-y-6" data-share-kind="profile">
      <PageHeader title={display} lede="Shared portfolio" trailing={<DownloadButton onClick={download} />} />
      {banner}
      <Surface as="section" className="grid grid-cols-2 gap-4 sm:grid-cols-4" data-share-figures>
        <Figure label="Steps verified" value={`${summary.verified ?? 0}`} sub={`of ${summary.verifiable ?? 0} checkable${summary.receipted ? ` · ${summary.receipted} receipted` : ''}`} />
        <Figure label="Files hashed" value={`${summary.artifacts ?? 0}`} sub="digests, not files" />
        <Figure label="Skills verified" value={`${summary.skillsVerified?.length ?? 0}`} sub={`of ${summary.skillsPractised?.length ?? 0} practised`} />
        <Figure label="Courses" value={`${courses.length}`} sub="in this copy" />
      </Surface>
      {words && profiles.length > 0 && summary.skillsVerified && (
        <Surface as="section">
          <SkillsSections courses={profiles} portfolio={summary as SkillPortfolio} content={words} />
        </Surface>
      )}
      {words &&
        courses
          .filter((c) => Array.isArray(c.kpis) && c.kpis.length > 0)
          .map((c) => {
            const cw = skillsOf(courseDocument(c.courseId) ?? doc!);
            return (
              <Surface as="section" key={c.courseId} data-share-course={c.courseId}>
                <KpiTable board={{ kpis: c.kpis! }} defs={cw.KPIS} families={cw.KPI_FAMILIES} copy={cw.COPY.board} title={`${c.title}${c.role ? ` · ${c.role}` : ''}`} />
              </Surface>
            );
          })}
    </div>
  );
}

/** The copy with every course's rows rehydrated from its own document (older copies already carry their labels). */
function hydrateSnapshot(snap: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(snap.courses)) return snap;
  const courses = (snap.courses as CopyCourse[]).map((c) => {
    if (!c || typeof c !== 'object' || !c.skills || typeof c.skills !== 'object' || !(c.skills as ShareSkillProfile).rows) return c;
    const doc = courseDocument(c.courseId) ?? courseDocument('security-plus');
    if (!doc) return c;
    return { ...c, skills: hydrateShareCourse(c.skills as unknown as ShareSkillProfile, skillsOf(doc), certOf(doc).CERT) as unknown as SkillProfile };
  });
  return { ...snap, courses };
}

function Figure({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-bold tabular-nums text-ink">{value}</div>
      <div className="text-xs text-muted">{sub}</div>
    </div>
  );
}

function DownloadButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="secondary" size="sm" className="flex items-center gap-1.5" onClick={onClick} data-share-download>
      <Download className="h-4 w-4" aria-hidden /> Download PDF
    </Button>
  );
}

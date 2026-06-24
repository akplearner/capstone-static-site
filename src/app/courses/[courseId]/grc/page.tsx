'use client';

import Link from 'next/link';
import { ArrowLeft, Download, FileSpreadsheet, FileText, Info } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { FrameworkBadge } from '@/components/TaskComponents';
import { InfoTip } from '@/components/InfoTip';
import { RegisterTable } from '@/components/grc/RegisterTable';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { grcRepo } from '@/lib/data';
import { useClientStore, notifyStore } from '@/lib/useClientStore';
import { GrcData, RegisterRow } from '@/lib/types';
import { REGISTERS, seedGrcData, toCSV, toMarkdown } from '@/lib/grc/templates';

// Stable server snapshot for useClientStore.
const SEED_GRC: GrcData = seedGrcData();

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GrcWorkspacePage() {
  const course = useCourse();
  const { member, loading } = useMember(course.id);

  const data = useClientStore<GrcData>(
    () => (member ? grcRepo.get(course.id, member.teamId) ?? seedGrcData() : SEED_GRC),
    SEED_GRC
  );

  if (loading) return <div className="py-12 text-center text-gray-500">Loading…</div>;

  if (!member) {
    return (
      <EmptyState
        title="Enrol first"
        message="Join this course (pick a team and role) to use the GRC workspace."
        href={`/courses/${course.id}`}
        cta="Go to course"
      />
    );
  }

  const setRows = (registerId: string, rows: RegisterRow[]) => {
    const current = grcRepo.get(course.id, member.teamId) ?? seedGrcData();
    grcRepo.save(course.id, member.teamId, { ...current, [registerId]: rows });
    notifyStore();
  };

  return (
    <div className="space-y-8">
      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to course
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          GRC Workspace · Team {member.teamId}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Fill these registers as your company works. They turn Red and Blue&apos;s findings into
          proper asset inventory, vulnerability tracking, threat intel, risk assessment, and audit
          evidence — the same artifacts a real security team produces.
        </p>
      </div>

      {member.role !== 'grc' && (
        <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This workspace is owned by your team&apos;s <strong>GRC</strong> member — you&apos;re
            viewing as <strong>{member.role}</strong>. Feel free to look; GRC keeps it up to date.
          </p>
        </div>
      )}

      {REGISTERS.map((reg) => {
        const rows = data[reg.id] ?? reg.seed;
        return (
          <section
            key={reg.id}
            className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                  {reg.title}
                  <FrameworkBadge framework={reg.framework} />
                  <InfoTip label={reg.howToFill} />
                </h2>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{reg.purpose}</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">{reg.source}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => download(`${reg.id}.md`, toMarkdown(reg, rows))}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FileText className="h-3.5 w-3.5" /> .md
                </button>
                <button
                  type="button"
                  onClick={() => download(`${reg.id}.csv`, toCSV(reg, rows))}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> .csv
                </button>
              </div>
            </div>

            <RegisterTable
              columns={reg.columns}
              rows={rows}
              onChange={(next) => setRows(reg.id, next)}
            />
          </section>
        );
      })}

      <p className="flex items-center gap-1.5 text-xs text-gray-400">
        <Download className="h-3.5 w-3.5" /> Tip: export each register to keep a copy with your team
        evidence. Shared, multi-device storage arrives with accounts.
      </p>
    </div>
  );
}

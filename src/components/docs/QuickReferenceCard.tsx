'use client';

import { FileStack, ClipboardList, Wrench, Tag, GraduationCap } from 'lucide-react';
import { deliverablesForCourse } from '@/lib/docs/definitions';

/**
 * Spec §10 — the one-screen cheat sheet. Five panels students can glance at:
 * the files, the universal form flow, the tools, the naming rules, and what
 * the grade is actually based on. (Security+ course reference.)
 */
// The tool set differs per course; fall back to the Security+ toolkit.
const COURSE_TOOLS: Record<string, string> = {
  'security-plus':
    'whois · dig · whatweb · nmap · nikto · tcpdump · Wireshark · sqlmap · hydra · nc · grep · fail2ban · Event Viewer · sha256sum',
  'cysa-plus':
    'Wazuh · Suricata · Sysmon · tcpdump · Wireshark · nmap · nikto · sqlmap · ssh · sha256sum',
  'mssp':
    'nmap · lynis · ufw · auditd · Sigma/grep · CIS Benchmarks · sha256sum · your framework mappings (SOC 2 · ISO 27001)',
};

export function QuickReferenceCard({ courseId = 'security-plus' }: { courseId?: string }) {
  const defs = deliverablesForCourse(courseId);
  const tools = COURSE_TOOLS[courseId] ?? COURSE_TOOLS['security-plus'];
  const panels = [
    {
      icon: FileStack,
      title: `${defs.length} FILES`,
      body: (
        <ol className="space-y-0.5">
          {defs.map((d) => (
            <li key={d.id}>
              <span className="text-gray-400">{d.num}.</span> {d.title}
            </li>
          ))}
        </ol>
      ),
    },
    {
      icon: ClipboardList,
      title: 'EVERY FORM',
      body: (
        <p>
          Run the tool → read the output → pull the 3 things (<em>what you found · the proof · why it
          matters</em>) → enter in the form → Generate → save as PDF.
        </p>
      ),
    },
    {
      icon: Wrench,
      title: 'EVERY TOOL',
      body: <p className="font-mono text-[11px] leading-relaxed">{tools}</p>,
    },
    {
      icon: Tag,
      title: 'NAME IT',
      body: (
        <p>
          Deliverables <span className="font-mono text-[11px]">NN_Name.ext</span>; evidence{' '}
          <span className="font-mono text-[11px]">YYYYMMDD_TeamXX_Tool_Action.png</span>; hash with{' '}
          <span className="font-mono text-[11px]">sha256sum</span>.
        </p>
      ),
    },
    {
      icon: GraduationCap,
      title: 'GRADED ON',
      body: <p>Process · documentation · evidence · ethics (staying in scope) — not speed.</p>,
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-ink">Quick reference card</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {panels.map((p) => (
          <div
            key={p.title}
            className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40"
          >
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
              <p.icon className="h-4 w-4" />
              {p.title}
            </div>
            <div className="mt-2 text-sm text-body">{p.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The manual's sections — their titles, their blurbs, and which courses get
 * which — as DATA.
 *
 * `GuideManual.tsx` built this list inline: ten section objects with their
 * headings and one-paragraph blurbs, gated by `course.id === 'server-plus'` and
 * `course.id === 'cysa-plus'`. Two problems, and the second is the reason this
 * file exists. The words were unexportable, like every other block of prose in a
 * component. And the gating was by course IDENTITY, so a fifth course — a
 * business instance of the deployment capstone, say — got no configuration-guide
 * section no matter what content it shipped, because it is not literally called
 * `server-plus`.
 *
 * So a section states the CAPABILITY it needs, and a course declares what it has
 * (`Course.manualSections`) or demonstrates it (steps with commands, more than
 * one role, a lifecycle, frameworks). The component renders the sections this
 * returns, in this order, and supplies each body.
 */
import { HOST } from '../serverTopology';
import type { Course } from '../types';

/**
 * What a section needs from a course.
 *
 * `always` is not a capability so much as the absence of one — it keeps every
 * section in one list rather than splitting the unconditional ones out.
 */
export type ManualCapability =
  | 'always'
  /** Ships a week-by-week build guide (`ServerConfigGuide`). */
  | 'config-guide'
  /** Ships a tool manual for the sensors and the SIEM. */
  | 'tools'
  /** Has at least one step that runs a command. */
  | 'commands'
  /** More than one role, so there are hand-offs to explain. */
  | 'multi-role'
  /** Declares a repeating case lifecycle. */
  | 'lifecycle'
  /** Maps its tasks to recognised frameworks. */
  | 'frameworks';

/** The capabilities a course declares rather than demonstrates. A course that
 *  ships the content for a section says so in its own definition. */
export type DeclaredCapability = Extract<ManualCapability, 'config-guide' | 'tools'>;

export interface ManualSection {
  id: string;
  title: string;
  blurb: string;
  when: ManualCapability;
}

/**
 * Every section, in the order the manual reads.
 *
 * Two entries share the id `lab`: a deployment course calls it "The build" and
 * describes the rack, everything else calls it "The lab". The first entry whose
 * capability the course has wins, which is why the more specific one is first.
 */
export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'lab',
    when: 'config-guide',
    title: 'The build',
    blurb: `One rack-mount server on the campus LAN running a hypervisor with two zones — a DMZ for the website, a private network for the Windows server and the Linux database. Your host is ${HOST.rule} (${HOST.teamMarker} = your team number).`,
  },
  {
    id: 'lab',
    when: 'always',
    title: 'The lab',
    blurb:
      'Every machine in the environment, what runs on it, and how to confirm you can reach it before Week 1.',
  },
  // Straight after the lab: that section shows what you are building, this one
  // is how you build it. Every "Exact clicks →" row on a task step lands here.
  {
    id: 'config-guide',
    when: 'config-guide',
    title: 'Configuration guide',
    blurb:
      'Every build procedure for the deployment, week by week — the exact commands, click-paths and BIOS keystrokes, written against this topology. The task steps say what to do; this is how.',
  },
  {
    id: 'tools',
    when: 'tools',
    title: 'Using the tools — Wazuh, Suricata & Sysmon',
    blurb:
      'What each tool is, how it is configured, and the exact searches and event IDs you reuse all course. The step-by-step commands live in each week’s task.',
  },
  // Only for a course that actually runs commands. `#command-help` still
  // resolves on those; a course with no CLI simply never links to it.
  {
    id: 'terminal',
    when: 'commands',
    title: 'Running commands & getting unstuck',
    blurb: 'How to use a terminal, and the fixes for the errors almost every beginner hits.',
  },
  {
    id: 'evidence',
    when: 'always',
    title: 'Evidence & chain of custody',
    blurb:
      'How to name, hash, log and hand off an artifact so it would hold up under scrutiny — and a ready-to-fill custody log.',
  },
  {
    id: 'forms',
    when: 'always',
    title: 'The forms, and how they connect',
    blurb:
      'Every form in the course, which one feeds the next, where its content comes from, and the folder layout you submit. The forms themselves are filled on the Deliverables tab.',
  },
  {
    id: 'roles',
    when: 'multi-role',
    title: 'How the roles hand off',
    blurb:
      'Each role works its own lane, but the week only closes when the hand-offs land. The strip above lists what each role owns; this is how the work moves between them.',
  },
  {
    id: 'lifecycle',
    when: 'lifecycle',
    title: 'The case lifecycle',
    blurb:
      'The path every case follows, whatever raised it. The specific attack this course runs is drawn above, under the arc.',
  },
  {
    id: 'frameworks',
    when: 'frameworks',
    title: 'Frameworks',
    blurb:
      'Every task is mapped to a recognized standard. The tags on a task aren’t decoration — they say how an auditor or employer would read your work.',
  },
];

export const MANUAL_COPY = {
  title: 'The manual',
  subtitle: 'Look things up here. Everything is open, so search the page.',
  navLabel: 'Manual sections',
} as const;

/** What this course can offer the manual. */
export function manualCapabilities(course: Course): Record<ManualCapability, boolean> {
  const declared = new Set(course.manualSections ?? []);
  return {
    always: true,
    'config-guide': declared.has('config-guide'),
    tools: declared.has('tools'),
    commands: course.tasks.some((t) =>
      t.steps.some((s) => !!s.command || (s.commands?.length ?? 0) > 0)
    ),
    'multi-role': course.roles.length > 1,
    lifecycle: (course.lifecyclePath?.length ?? 0) > 0,
    frameworks: new Set(course.tasks.flatMap((t) => t.frameworks)).size > 0,
  };
}

/** The sections this course gets, in order, one per id. A renderer passes the
 *  sections from the course document; the default is for the writer and tests. */
export function manualSectionsFor(course: Course, sections: readonly ManualSection[] = MANUAL_SECTIONS): ManualSection[] {
  const has = manualCapabilities(course);
  const seen = new Set<string>();
  return sections.filter((s) => {
    if (seen.has(s.id) || !has[s.when]) return false;
    seen.add(s.id);
    return true;
  });
}

/** Does this course ship the content for that section? Used by the component to
 *  decide which body to build, so the gate and the body cannot disagree. */
export function manualHas(course: Course, capability: ManualCapability): boolean {
  return manualCapabilities(course)[capability];
}

/* ── The quick-reference card ────────────────────────────────────────────── */

/**
 * The one-screen cheat sheet: the files, the universal form flow, the tools, the
 * naming rules, and what the grade is actually based on.
 *
 * The tool line differs per course and falls back to the Security+ toolkit — a
 * course with no entry is not a course with no tools, it is a course nobody has
 * written the line for yet, so the fallback is deliberate and named.
 */
export const COURSE_TOOLS: Record<string, string> = {
  'security-plus':
    'whois · dig · whatweb · nmap · nikto · tcpdump · Wireshark · sqlmap · hydra · nc · grep · fail2ban · Event Viewer · sha256sum',
  'cysa-plus':
    'Wazuh · Suricata · Sysmon · tcpdump · Wireshark · nmap · nikto · sqlmap · ssh · sha256sum',
  mssp:
    'nmap · lynis · ufw · auditd · Sigma/grep · CIS Benchmarks · sha256sum · your framework mappings (SOC 2 · ISO 27001)',
  ccna:
    'show version · show vlan brief · show interfaces trunk · show spanning-tree · show etherchannel summary · show ip route · show ip ospf neighbor · show ip nat translations · show access-lists · ping · traceroute · Wireshark · NetBox · LibreNMS · Oxidized · Ansible',
};

export const QUICK_REFERENCE = {
  title: 'Quick reference card',
  /** `{n}` is the course's own form count, so the heading cannot go stale. */
  filesTitle: '{n} FILES',
  everyFormTitle: 'EVERY FORM',
  everyForm: [
    'Run the tool → read the output → pull the 3 things (',
    { em: 'what you found · the proof · why it matters' },
    ') → enter in the form → Generate → save as PDF.',
  ],
  everyToolTitle: 'EVERY TOOL',
  nameItTitle: 'NAME IT',
  /** `{evidence}` is the evidence naming rule, from `evidence.ts`. */
  nameIt: [
    'Deliverables ',
    { code: 'NN_Name.ext' },
    '; evidence ',
    { code: '{evidence}' },
    '; hash with ',
    { code: 'sha256sum' },
    '.',
  ],
  gradedOnTitle: 'GRADED ON',
  gradedOn: 'Process · documentation · evidence · ethics (staying in scope) — not speed.',
} as const;

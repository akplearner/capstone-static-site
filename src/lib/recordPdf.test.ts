import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MAX_INBOX_ISSUES, MAX_ISSUES, buildCredentialPdf, buildIssuesPdf, buildRecordPdf, credentialPdfName, figuresOf, fit, issuesPdfName, recordPdfFromShare, recordPdfName, type PdfCourse, type PdfSkillRow } from './recordPdf';
import { buildIssues, type IssuePeople } from './issueInbox';
import { SECURITY_PLUS } from './data/seed/securityPlus';
import { AZURE_FUNDAMENTALS } from './data/seed/azureCloud';
import type { TaskReport } from './data/types';
import { localDay } from './localDate';
import { textWidth } from './pdf';
import { allText, readTexts } from '@/test/pdfRead';

/**
 * R127 — the record as a PDF. The tests read the file back (`@/test/pdfRead`) and check what a member would
 * read: the figures the page printed, the skills by name, progress by course, the issues and where each
 * stands. They also hold the PDF to "compact": a normal record is one page and a very large one a few.
 */

const NOW = Date.UTC(2026, 9, 16, 12, 0, 0);
const row = (id: string, label: string, level: string): PdfSkillRow => ({ id, label, level });

const osint: PdfCourse = {
  courseId: 'security-plus',
  title: 'Security+ Capstone Lab',
  role: 'Red Team',
  capstoneFiled: false,
  metrics: { stepsDone: 9, stepsTotal: 17, verified: 4, verifiable: 11, artifacts: 2, activeDays: 3, lastActivity: Date.UTC(2026, 9, 15, 12), receipted: null },
  skills: {
    rows: {
      skills: [row('s.osint', 'Gather open-source intelligence on a target', 'verified'), row('s.dns', 'Enumerate DNS and WHOIS records', 'verified'), row('s.web', 'Fingerprint web technologies', 'practised'), row('s.vuln', 'Scan for known vulnerabilities', 'not-started')],
      tools: [row('t.dig', 'dig', 'verified'), row('t.whois', 'whois', 'practised'), row('t.nmap', 'Nmap', 'not-started')],
      procedures: [row('p.ir', 'Incident response checklist', 'started'), row('p.chg', 'Change request', 'not-started')],
      standards: [row('st.nist', 'NIST 800-53 AC-2', 'practised')],
      tactics: [row('ta.recon', 'Reconnaissance', 'practised')],
      practices: [row('pr.log', 'Keep a lab log', 'verified')],
      domains: [row('d1', '1.0 General Security Concepts', 'verified'), row('d2', '2.0 Threats and Vulnerabilities', 'practised'), row('d3', '3.0 Architecture', 'not-started')],
    },
  },
};
const azure: PdfCourse = {
  courseId: 'azure-fundamentals',
  title: 'Azure Fundamentals Capstone with a Long Title that Needs Two Lines in the Table to Read Properly',
  role: 'Infrastructure',
  capstoneFiled: true,
  metrics: { stepsDone: 20, stepsTotal: 20, verified: 8, verifiable: 8, artifacts: 5, activeDays: 6, lastActivity: Date.UTC(2026, 9, 12, 12), receipted: 3 },
  skills: {
    rows: {
      // the same skill as in the first course, at a lower level: the best level wins across courses
      skills: [row('s.osint', 'Gather open-source intelligence on a target', 'practised'), row('s.vm', 'Deploy a virtual machine', 'reviewed')],
      tools: [row('t.dig', 'dig', 'practised'), row('t.cli', 'Azure CLI', 'verified')],
      procedures: [row('p.ir', 'Incident response checklist', 'verified')],
      domains: [row('az.d1', 'Cloud concepts', 'verified')],
    },
  },
};

const people: IssuePeople = { nameOf: () => undefined, roleOf: () => undefined, resolverName: (id) => (id === 'ivy' ? 'Ivy Instructor' : undefined) };
const redTask = SECURITY_PLUS.tasks.find((t) => t.role === 'red' && t.week === 2)!;
const azTask = AZURE_FUNDAMENTALS.tasks.find((t) => t.week === 1)!;
const report = (over: Partial<TaskReport>): TaskReport => ({ id: 'r', courseId: SECURITY_PLUS.id, taskId: redTask.id, teamId: 't1', memberId: 'm1', kind: 'broken', note: '', status: 'open', at: Date.UTC(2026, 9, 12, 14, 5), reporterName: 'Grace', reporterRole: 'red', ...over });
const issuesOf = (reports: TaskReport[]) => buildIssues([SECURITY_PLUS, AZURE_FUNDAMENTALS], reports, people);

const sampleIssues = () =>
  issuesOf([
    report({ id: 'r1', stepId: redTask.steps[1].id, note: 'The nmap flag in step 2 is rejected on my VM.', contentVersion: '1.2' }),
    report({ id: 'r2', kind: 'unclear', status: 'resolved', note: 'What does “scope” mean here?', resolutionNote: 'Reworded the step to say which hosts are in scope.', resolvedAt: Date.UTC(2026, 9, 14, 9), resolvedBy: 'ivy', fixRevision: 3, at: Date.UTC(2026, 9, 11, 10) }),
    report({ id: 'r3', kind: 'question', status: 'in_progress', note: 'Why a ping sweep first?', at: Date.UTC(2026, 9, 10, 10) }),
    report({ id: 'r4', courseId: AZURE_FUNDAMENTALS.id, taskId: azTask.id, kind: 'outdated', status: 'wont_fix', note: 'The portal screen differs.', resolutionNote: 'The screen is as shipped.', resolvedAt: Date.UTC(2026, 9, 13, 9), at: Date.UTC(2026, 9, 9, 10) }),
  ]);

const BASE = { subject: 'Grace', generatedAt: NOW, courses: [osint, azure] };
const pages = (bytes: Uint8Array) => readTexts(bytes).length;

describe('R127 — figuresOf', () => {
  it('works the figures out from the courses, counting a skill once at the best level any course reached', () => {
    const f = Object.fromEntries(figuresOf([osint, azure]).map((x) => [x.label, x]));
    expect(f['Steps done']).toMatchObject({ value: '29', sub: 'of 37 required' });
    // 4 + 8 verified over 11 + 8 checkable, 3 receipted
    expect(f['Steps verified']).toMatchObject({ value: '12', sub: 'of 19 checkable · 3 receipted' });
    expect(f['Capstones delivered']).toMatchObject({ value: '1', sub: 'of 2 started' });
    expect(f['Evidence hashed'].value).toBe('7');
    // osint (verified) + dns (verified) + vm (reviewed) verified; web practised -> 4 practised or better; osint counted once
    expect(f['Skills verified']).toMatchObject({ value: '3', sub: 'of practised 4' });
    // dig (verified, practised in the other) + whois + Azure CLI = 3 tools reached
    expect(f['Tools used'].value).toBe('3');
    // one procedure verified (the Azure course followed it), one in three not reached
    expect(f['Procedures to standard'].value).toBe('1');
    expect(f['Exam domains verified'].value).toBe('2');
    expect(f['Exam domains verified'].sub).toBe('of 4 across the courses'); // 3 + 1 domain rows
  });

  it('is calm with nothing to count', () => {
    const f = figuresOf([]);
    expect(f.map((x) => x.value)).toEqual(['0', '0', '0', '0', '0', '0', '0', '0']);
    expect(f[0].sub).toBe('none yet');
  });

  it('keeps the issues in their own section, with their counts there, rather than in a figure', () => {
    const lines = allText(buildRecordPdf({ ...BASE, issues: sampleIssues() })).split('\n');
    expect(lines).toContain('ISSUES REPORTED');
    expect(lines).toContain('4 reported · 2 pending · 1 resolved');
    expect(lines).not.toContain('Issues reported'); // no figure card for it
    // a page that hands in its own figures gets exactly those figures
    const handed = allText(buildRecordPdf({ ...BASE, figures: [{ label: 'Tasks done', value: '3', sub: 'of 4' }], issues: sampleIssues() })).split('\n');
    expect(handed).toContain('Tasks done');
    expect(handed).not.toContain('Steps done');
    // a source with no issue data at all prints no section
    expect(allText(buildRecordPdf({ ...BASE })).split('\n')).not.toContain('ISSUES REPORTED');
  });
});

describe('R127 — buildRecordPdf', () => {
  it('prints the record, the skills by name, progress by course and the issues, in that order', () => {
    const raw = allText(buildRecordPdf({ ...BASE, issues: sampleIssues(), workRoles: ['Penetration Tester', 'Cyber Defense Analyst'] }));
    const lines = raw.split('\n');
    // a name can wrap across two lines of the page: phrases are looked for in the text read straight through
    const text = raw.replace(/\s+/g, ' ');
    const at = (heading: string) => {
      const i = lines.indexOf(heading);
      expect(i, heading).toBeGreaterThanOrEqual(0);
      return i;
    };
    expect(lines.indexOf('Grace')).toBeLessThan(at('RECORD'));
    expect(at('RECORD')).toBeLessThan(at('SKILLS PROVED'));
    expect(at('SKILLS PROVED')).toBeLessThan(at('PROGRESS BY COURSE'));
    expect(at('PROGRESS BY COURSE')).toBeLessThan(at('ISSUES REPORTED'));
    // the register: what this is, and that it is unsigned
    expect(text).toContain('It is unsigned');
    expect(text).toContain(`Generated ${localDay(NOW)} · 2 courses`);
    // skills by name, best level across courses
    for (const name of ['Gather open-source intelligence on a target', 'Enumerate DNS and WHOIS records', 'Deploy a virtual machine', 'Fingerprint web technologies']) expect(text).toContain(name);
    expect(text).not.toContain('Scan for known vulnerabilities'); // not reached: not claimed
    expect(text).toContain('Verified from output (3)');
    expect(text).toContain('Practised, not yet verified (1)');
    expect(text).toContain('Azure CLI');
    expect(text).toContain('Incident response checklist');
    expect(text).toContain('NIST 800-53 AC-2');
    expect(text).toContain('Reconnaissance · Keep a lab log');
    expect(text).toContain('Security+ Capstone Lab: 1 of 3 (1.0 General Security Concepts)');
    expect(text).toContain('Penetration Tester · Cyber Defense Analyst');
    // progress rows
    expect(text).toContain('9 of 17');
    expect(text).toContain('20 of 20');
    expect(text).toContain('Red Team');
    expect(text).toContain('Infrastructure · capstone filed');
    expect(text).toContain(localDay(Date.UTC(2026, 9, 15, 12)));
  });

  it('lists each issue with its kind, where it stands, where it is, what was said and what was done', () => {
    const text = allText(buildRecordPdf({ ...BASE, issues: sampleIssues() })).replace(/\s+/g, ' ');
    expect(text).toContain('4 reported · 2 pending · 1 resolved');
    expect(text).toContain(`${localDay(Date.UTC(2026, 9, 12, 14, 5))} · Something is broken · Open`);
    expect(text).toContain('saw v1.2');
    expect(text).toContain('The nmap flag in step 2 is rejected on my VM.');
    expect(text).toContain(`Security+ Capstone Lab › Week 2 › ${redTask.title} › Step 2: ${redTask.steps[1].title}`);
    expect(text).toContain('Instructions unclear · Resolved');
    expect(text).toContain(`Resolved ${localDay(Date.UTC(2026, 9, 14, 9))} · fixed in revision 3 — Reworded the step to say which hosts are in scope.`);
    expect(text).toContain('Why a ping sweep first?');
    expect(text).toContain('Content looks outdated · Won’t fix');
    expect(text).toContain(`Won’t fix ${localDay(Date.UTC(2026, 9, 13, 9))} — The screen is as shipped.`);
    // a member's own PDF does not print who reported: it is theirs
    expect(text).not.toContain('Offensive Security');
  });

  it('says so when there is nothing to list, rather than printing an empty heading', () => {
    const text = allText(buildRecordPdf({ ...BASE, issues: [] }));
    expect(text).toContain('ISSUES REPORTED');
    expect(text).toContain('No issues reported.');
    const bare = allText(buildRecordPdf({ subject: 'Ada', generatedAt: NOW, courses: [] }));
    expect(bare).toContain('Nothing recorded yet.');
    expect(bare).not.toContain('PROGRESS BY COURSE');
    // a source with no issue data at all (a shared copy) leaves the section out instead of claiming there are none
    expect(bare).not.toContain('ISSUES REPORTED');
    expect(bare).not.toContain('No issues reported.');
  });

  it('cuts a long note and a long list, and says how many it left out', () => {
    const note = 'word '.repeat(200);
    const many = issuesOf(Array.from({ length: MAX_ISSUES + 7 }, (_, n) => report({ id: `r${n}`, note, at: Date.UTC(2026, 9, 1, 0, n) })));
    const text = allText(buildRecordPdf({ ...BASE, issues: many }));
    expect(text).toContain('…');
    expect(text).not.toContain(note.trim());
    expect(text).toContain('and 7 more, not listed here');
    expect(text.match(/Something is broken · Open/g)).toHaveLength(MAX_ISSUES);
  });

  it('is one page for a normal record and a few for a very large one', () => {
    // with no issues, two courses are one page; four issues carry it a little way onto a second
    expect(pages(buildRecordPdf({ ...BASE, issues: [] }))).toBe(1);
    expect(pages(buildRecordPdf({ ...BASE, issues: sampleIssues() }))).toBeLessThanOrEqual(2);
    const labels = (n: number, prefix: string, level: string) => Array.from({ length: n }, (_, i) => row(`${prefix}${i}`, `${prefix} number ${i} with a plain name`, level));
    const heavy: PdfCourse[] = Array.from({ length: 13 }, (_, c) => ({
      courseId: `course-${c}`,
      title: `Course number ${c}`,
      role: 'Role',
      metrics: { stepsDone: 30, stepsTotal: 60, verified: 10, verifiable: 20, artifacts: 4, activeDays: 5, lastActivity: NOW },
      skills: { rows: { skills: [...labels(6, `c${c}s`, 'verified'), ...labels(4, `c${c}p`, 'practised')], tools: labels(8, `c${c}t`, 'practised'), standards: labels(5, `c${c}x`, 'practised'), domains: labels(5, `c${c}d`, 'verified') } },
    }));
    const bytes = buildRecordPdf({ subject: 'Grace', generatedAt: NOW, courses: heavy, issues: issuesOf(Array.from({ length: 20 }, (_, n) => report({ id: `q${n}`, note: 'The step fails on my VM.', at: Date.UTC(2026, 9, 1, 0, n) }))) });
    expect(pages(bytes)).toBeGreaterThan(1);
    expect(pages(bytes)).toBeLessThanOrEqual(5);
    expect(bytes.length).toBeLessThan(80_000);
  });

  it('keeps every run inside the margins, and prints the footer and page number on each page', () => {
    const bytes = buildRecordPdf({ ...BASE, courses: [osint, azure, osint, azure, osint, azure, osint, azure], issues: sampleIssues() });
    const all = readTexts(bytes);
    all.forEach((runs, i) => {
      expect(runs.at(-1)?.text).toBe(`Page ${i + 1} of ${all.length}`);
      expect(runs.at(-2)?.text).toBe(`Capstone Quarry · Grace · ${localDay(NOW)}`);
      for (const r of runs) {
        const font = r.font === 'F2' ? 'bold' : r.font === 'F3' ? 'mono' : 'regular';
        if (r.baseline > 780) continue; // the footer
        expect(r.baseline, r.text).toBeGreaterThan(40);
        expect(r.baseline, r.text).toBeLessThan(842 - 58 + 1);
        // text that is left-aligned in its column ends before the right margin (right-aligned runs are placed by their right edge)
        expect(r.x + textWidth(r.text, font, r.size), r.text).toBeLessThanOrEqual(595.28 - 42 + 1);
      }
    });
  });

  it('never prints a hole: no undefined, NaN or null in the file', () => {
    const partial: PdfCourse = { courseId: 'x', title: 'Partial' };
    const text = allText(buildRecordPdf({ subject: 'Grace', generatedAt: NOW, courses: [partial, osint], issues: sampleIssues() }));
    for (const bad of ['undefined', 'NaN', 'null', '[object', 'Infinity']) expect(text, bad).not.toContain(bad);
    expect(text).toContain('Partial');
    expect(text).toContain('0 of 0');
  });

  it('is deterministic, and a name outside Latin-1 shows as "?" rather than breaking the file', () => {
    const a = buildRecordPdf({ ...BASE, issues: sampleIssues() });
    const b = buildRecordPdf({ ...BASE, issues: sampleIssues() });
    expect(Array.from(a)).toEqual(Array.from(b));
    expect(allText(buildRecordPdf({ ...BASE, subject: 'José 漢字' }))).toContain('José ??');
  });

  it('covers one course when asked, and names the file by day and course', () => {
    const text = allText(buildRecordPdf({ subject: 'Grace', generatedAt: NOW, courses: [osint], scope: osint.title }));
    expect(text).toContain(`Generated ${localDay(NOW)} · Security+ Capstone Lab`);
    expect(recordPdfName(NOW)).toBe(`capstone-record_${localDay(NOW)}.pdf`);
    expect(recordPdfName(NOW, 'security-plus')).toBe(`capstone-record_security-plus_${localDay(NOW)}.pdf`);
    expect(issuesPdfName(NOW)).toBe(`capstone-issues_${localDay(NOW)}.pdf`);
  });

  it('prints the figures it is handed, as the page printed them', () => {
    const text = allText(buildRecordPdf({ ...BASE, figures: [{ label: 'Tasks done', value: '3', sub: 'of 4 in graded weeks' }] }));
    expect(text).toContain('Tasks done');
    expect(text).toContain('of 4 in graded weeks');
    expect(text).not.toContain('Steps done'); // only what it was handed
  });
});

describe('R127 — fit', () => {
  it('shortens to the width with an ellipsis and leaves what fits alone', () => {
    expect(fit('short', 'regular', 9, 200)).toBe('short');
    const cut = fit('A title that is much too long for the column it is set in', 'regular', 9, 80);
    expect(cut.endsWith('…')).toBe(true);
    expect(textWidth(cut, 'regular', 9)).toBeLessThanOrEqual(80);
  });
});

describe('R127 — a shared copy', () => {
  const copy = {
    schema: 'capstone-member-profile/2',
    subject: { display: 'Ada Lovelace' },
    summary: { verified: 12, verifiable: 19, receipted: 3, artifacts: 7, skillsVerified: ['a', 'b', 'c'], skillsPractised: ['a', 'b', 'c', 'd'] },
    courses: [
      {
        courseId: 'security-plus',
        title: 'Security+ Capstone Lab',
        role: 'Red Team',
        capstoneFiled: true,
        metrics: osint.metrics,
        skills: { rows: { skills: osint.skills?.rows?.skills, tools: osint.skills?.rows?.tools, domains: osint.skills?.rows?.domains } },
      },
    ],
  };

  it("prints the copy's own summary and the courses it holds", () => {
    const text = allText(buildRecordPdf(recordPdfFromShare(copy, NOW, { madeAt: Date.UTC(2026, 9, 12, 12) })));
    expect(text).toContain('Ada Lovelace');
    expect(text).toContain(`Generated ${localDay(NOW)} · a shared copy made ${localDay(Date.UTC(2026, 9, 12, 12))} of 1 course`);
    expect(text).toContain('Steps verified');
    expect(text).toContain('of 19 checkable · 3 receipted');
    expect(text).toContain('Files hashed');
    expect(text).toContain('of 4 practised');
    expect(text).toContain('Gather open-source intelligence on a target');
    expect(text).toContain('Security+ Capstone Lab');
    expect(text).toContain('Red Team · capstone filed');
    // the copy carries no issues, so the PDF does not say there are none
    expect(text).not.toContain('ISSUES REPORTED');
    expect(text).not.toContain('No issues reported.');
  });

  it('reads a copy from an older shape, or none at all, without a hole', () => {
    for (const odd of [null, undefined, 5, 'x', [], {}, { courses: 'no' }, { courses: [null, 5, {}], summary: 4 }, { courses: [{ title: 'Only a title', skills: { rows: { skills: [{ id: 'a' }, { level: 'verified' }, 7] } } }] }]) {
      const bytes = buildRecordPdf(recordPdfFromShare(odd, NOW));
      const text = allText(bytes);
      for (const bad of ['undefined', 'NaN', 'null', '[object']) expect(text, `${JSON.stringify(odd)} ${bad}`).not.toContain(bad);
      expect(text).toContain('A Capstone Quarry member');
    }
  });
});

describe('R127 — a shared credential', () => {
  const credential = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: 'https://capstone.example', type: 'Profile', name: 'Capstone Labs' },
    validFrom: '2026-10-14T10:00:00.000Z',
    credentialSubject: {
      achievement: {
        name: 'Capstone member profile',
        description: 'An Open Badges 3.0 envelope around the member profile, unsigned: it carries no proof and claims none.',
        criteria: { narrative: 'This export lists steps the member ticked and verified, hashes of outputs and files, and documents the team filed. It is unsigned.' },
        alignment: [
          { targetName: 'Gather open-source intelligence on a target', targetCode: 'comp.recon.osint', targetFramework: 'capstone-ontology' },
          { targetName: 'Enumerate DNS and WHOIS records', targetCode: 'comp.recon.dns-whois', targetFramework: 'capstone-ontology' },
          { targetName: 'General security concepts', targetCode: 'SY0-701.d1', targetFramework: 'SY0-701' },
          { targetName: 'Penetration Tester', targetCode: 'PT-001', targetFramework: 'NICE' },
        ],
      },
    },
    evidence: [{ id: `sha256:${'ab12'.repeat(16)}`, name: 'capstone-portfolio.json', description: 'The shape is published as content/schemas/member-profile.schema.json.' }],
    claim: 'An Open Badges 3.0 envelope around the member profile, unsigned: it carries no proof and claims none.',
  };

  it('prints what it is, what it is aligned to by framework, the digest it stands on, and that it is unsigned', () => {
    const bytes = buildCredentialPdf(credential, NOW);
    expect(pages(bytes)).toBe(1);
    const lines = allText(bytes).split('\n');
    const flat = lines.join(' ').replace(/\s+/g, ' ');
    expect(lines).toContain('CAPSTONE QUARRY · CREDENTIAL');
    expect(lines).toContain('Capstone member profile');
    expect(flat).toContain(`Issued by Capstone Labs · ${localDay(Date.parse('2026-10-14T10:00:00.000Z'))} · Generated ${localDay(NOW)}`);
    expect(flat).toContain('ALIGNED TO');
    expect(flat).toContain('Competencies (2)');
    expect(flat).toContain('Gather open-source intelligence on a target (comp.recon.osint)');
    expect(flat).toContain('Exam domains · SY0-701 (1)');
    expect(flat).toContain('NICE work roles (1)');
    expect(flat).toContain('Penetration Tester (PT-001)');
    // the digest in full, in a fixed-width face, so it can be compared by eye
    expect(flat).toContain(`sha256:${'ab12'.repeat(16)}`);
    expect(flat).toContain('unsigned');
    expect(credentialPdfName(NOW)).toBe(`capstone-credential_${localDay(NOW)}.pdf`);
  });

  it('is calm about a copy of any shape', () => {
    for (const odd of [null, undefined, 3, 'x', [], {}, { credentialSubject: 4 }, { credentialSubject: { achievement: { alignment: [null, 5, {}, { targetName: 'Only a name' }] } } }, { evidence: [null] }]) {
      const text = allText(buildCredentialPdf(odd, NOW));
      for (const bad of ['undefined', 'NaN', 'null', '[object']) expect(text, `${JSON.stringify(odd)} ${bad}`).not.toContain(bad);
      expect(text).toContain('Shared credential');
    }
    expect(allText(buildCredentialPdf({ credentialSubject: { achievement: { alignment: [{ targetName: 'Only a name' }] } } }, NOW))).toContain('Only a name');
  });
});

describe('R127 — buildIssuesPdf', () => {
  const stamp = { generatedAt: NOW, scope: 'Pending · all courses' };

  it('counts, then lists each issue by course with who reported it, in what role, and on which version', () => {
    const issues = sampleIssues();
    const text = allText(buildIssuesPdf({ ...stamp, issues })).replace(/\n(?! )/g, '\n');
    expect(text).toContain('Reported issues');
    expect(text).toContain('CAPSTONE QUARRY · ISSUES');
    expect(text).toContain(`Generated ${localDay(NOW)} · Pending · all courses`);
    // four figures: reported, pending, resolved, won't fix
    const counts = text.split('\n');
    expect(counts).toContain('Reported');
    expect(counts).toContain('Pending');
    expect(counts).toContain('Resolved');
    expect(counts).toContain('Won’t fix');
    expect(text).toContain('SECURITY+ CAPSTONE LAB · 3');
    expect(text).toContain(`${AZURE_FUNDAMENTALS.title.toUpperCase()} · 1`);
    expect(text).toContain('Grace · Offensive Security (Red Team)');
    expect(text).toContain('saw v1.2');
    expect(text).toContain('fixed in revision 3');
  });

  it('groups by course whatever order the list arrives in, with one heading per course', () => {
    const issues = sampleIssues();
    const mixed = [issues[3], issues[0], issues[2], issues[1]]; // azure, security, security, security
    const interleaved = [issues[0], issues[3], issues[1]];
    for (const list of [mixed, interleaved]) {
      const text = allText(buildIssuesPdf({ ...stamp, issues: list }));
      expect(text.match(/SECURITY\+ CAPSTONE LAB · \d/g)).toHaveLength(1);
      expect(text.match(new RegExp(`${AZURE_FUNDAMENTALS.title.toUpperCase().replace(/[+]/g, '\\+')} · \\d`, 'g'))).toHaveLength(1);
    }
  });

  it('is calm when the list is empty, and cuts a very long one', () => {
    expect(allText(buildIssuesPdf({ ...stamp, issues: [] }))).toContain('No issues reported.');
    const long = issuesOf(Array.from({ length: MAX_INBOX_ISSUES + 5 }, (_, n) => report({ id: `r${n}`, note: 'The step fails.', at: Date.UTC(2026, 9, 1, 0, n) })));
    const bytes = buildIssuesPdf({ ...stamp, issues: long });
    expect(allText(bytes)).toContain('and 5 more, not listed here');
    expect(pages(bytes)).toBeGreaterThan(1);
    expect(bytes.length).toBeLessThan(200_000);
  });
});

/**
 * Not an assertion: with PDF_DUMP_DIR set, the documents are written there so an independent reader (PDFium,
 * pypdf) can open and render them. `PDF_DUMP_DIR=/tmp/pdfs npx vitest run src/lib/recordPdf.test.ts`.
 */
describe('R127 — for an external reader', () => {
  it.skipIf(!process.env.PDF_DUMP_DIR)('writes the documents', () => {
    const dir = process.env.PDF_DUMP_DIR as string;
    mkdirSync(dir, { recursive: true });
    const write = (name: string, bytes: Uint8Array) => writeFileSync(`${dir}/${name}.pdf`, bytes);
    write('record-typical', buildRecordPdf({ ...BASE, issues: sampleIssues(), workRoles: ['Penetration Tester', 'Cyber Defense Analyst'] }));
    write('record-empty', buildRecordPdf({ subject: 'Ada', generatedAt: NOW, courses: [] }));
    write('issues', buildIssuesPdf({ generatedAt: NOW, scope: 'Pending · all courses', issues: sampleIssues() }));
    write('shared', buildRecordPdf(recordPdfFromShare({ subject: { display: 'Ada Lovelace' }, summary: { verified: 12, verifiable: 19, receipted: 3, artifacts: 7, skillsVerified: ['a', 'b', 'c'], skillsPractised: ['a', 'b', 'c', 'd'] }, courses: [osint, azure] }, NOW, { madeAt: NOW })));
    const labels = (n: number, prefix: string, level: string) => Array.from({ length: n }, (_, i) => row(`${prefix}${i}`, `${prefix} number ${i} with a plain name`, level));
    const heavy: PdfCourse[] = Array.from({ length: 13 }, (_, c) => ({
      courseId: `course-${c}`,
      title: `Course number ${c}`,
      role: 'Role',
      metrics: { stepsDone: 30, stepsTotal: 60, verified: 10, verifiable: 20, artifacts: 4, activeDays: 5, lastActivity: NOW },
      skills: { rows: { skills: [...labels(6, `c${c}s`, 'verified'), ...labels(4, `c${c}p`, 'practised')], tools: labels(8, `c${c}t`, 'practised'), standards: labels(5, `c${c}x`, 'practised'), domains: labels(5, `c${c}d`, 'verified') } },
    }));
    write('record-heavy', buildRecordPdf({ subject: 'Grace', generatedAt: NOW, courses: heavy, issues: sampleIssues() }));
  });
});

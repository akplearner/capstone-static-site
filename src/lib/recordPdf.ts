import { PdfWriter, textWidth, wrapText, type PdfFont, type Rgb } from './pdf';
import { LEVEL_LABEL, SKILLS_COPY, type SkillLevel } from './docs/skillsCopy';
import { issueCounts, type IssueDto } from './issueInbox';
import { reportKindLabel, reportStatusLabel } from './reportKinds';
import { levelRank } from './skillProfile';
import { localDay } from './localDate';

/**
 * R127 — the record as a compact PDF: skills, progress and issues, on one or two pages.
 *
 * Every learner-facing export used to be a JSON file (the member profile, the credential, the KPI board, the
 * issues). Nobody a member would hand one to can open it, so the admin asked for a PDF in its place. This is
 * the document: the figures the page printed, the skills reached (names, not counters), a table of progress by
 * course, and the issues the member reported with where each stands. It is built from the same rows the pages
 * already compute, so a number in the PDF is the number on the screen, and it is pure: the caller passes the
 * time, so it reads no clock, no window and no repository, and the same input is the same file.
 *
 * Nothing here is scored or ranked: it is a record, in the register the pages use. It is unsigned, and says so.
 */

export interface PdfSkillRow {
  id: string;
  label: string;
  level: string;
}

/** One course as the PDF needs it. A page's export row (`MemberCourseRow`) and a shared copy's course both fit. */
export interface PdfCourse {
  courseId: string;
  title: string;
  role?: string;
  capstoneFiled?: boolean;
  metrics?: {
    stepsDone?: number;
    stepsTotal?: number;
    verified?: number;
    verifiable?: number;
    artifacts?: number;
    activeDays?: number;
    lastActivity?: number;
    receipted?: number | null;
  };
  skills?: { rows?: Partial<Record<string, readonly PdfSkillRow[]>> };
  /** R134: the course's scores by the published method, printed beside its progress line. */
  scores?: readonly { id: string; value: number; loaded: boolean }[];
}

/** R134: one category of the record, as the dashboard counted it. */
export interface PdfCategory {
  id: string;
  label: string;
  tier: string;
  verifiedUses: number;
  threshold: number;
  successRate: { value: number; of: number };
  relevance: number;
  evidenceCount: number;
}

export interface PdfFigure {
  label: string;
  value: string;
  sub: string;
}

export interface RecordPdfInput {
  subject: string;
  /** Epoch milliseconds: the caller's clock. */
  generatedAt: number;
  courses: readonly PdfCourse[];
  /** The figures to print. When absent they are worked out from the courses. */
  figures?: readonly PdfFigure[];
  /**
   * The issues the member reported, newest first, as the inbox joins them. Absent when the source carries
   * none (a shared copy): the section is left out, because "no issues" would be a claim nobody checked.
   */
  issues?: readonly IssueDto[];
  /** The roles the courses prepare for, by name. */
  workRoles?: readonly string[];
  /** Overrides the "N courses" under the title: a course's name when the export is for one. */
  scope?: string;
  /** R134: the record by category across the courses; absent on a one-course export and on a copy without it. */
  categories?: readonly PdfCategory[];
}

const INK: Rgb = [0.09, 0.11, 0.15];
const MUTED: Rgb = [0.42, 0.45, 0.5];
const ACCENT: Rgb = [0.055, 0.455, 0.565];
const LINE: Rgb = [0.82, 0.84, 0.87];
const PANEL: Rgb = [0.955, 0.962, 0.972];
const TRACK: Rgb = [0.88, 0.9, 0.92];

/** The labels the PDF adds to the words the skills registry already holds. Short, as a renderer's are. */
export const PDF_LABELS = {
  eyebrow: 'Capstone Quarry · record',
  issuesEyebrow: 'Capstone Quarry · issues',
  credentialEyebrow: 'Capstone Quarry · credential',
  alignedTo: 'Aligned to',
  evidence: 'Evidence',
  competencies: 'Competencies',
  workRoles: 'Work roles',
  examDomains: 'Exam domains',
  issuedBy: 'Issued by',
  generated: 'Generated',
  record: 'Record',
  categories: 'Record by category',
  categoryColumns: ['Category', 'Tier', 'Verified uses', 'Success', 'Relevance', 'Evidence'],
  scores: 'Scores',
  progress: 'Progress by course',
  issues: 'Issues reported',
  issuesTitle: 'Reported issues',
  columns: ['Course', 'Steps done', 'Verified', 'Skills', 'Files', 'Last worked'],
  none: 'None.',
  noIssues: 'No issues reported.',
  moreIssues: (n: number) => `and ${n} more, not listed here`,
  capstoneFiled: 'capstone filed',
  skillsVerified: 'verified',
  of: 'of',
  page: (n: number, total: number) => `Page ${n} of ${total}`,
  pending: 'pending',
  complete: 'resolved',
  wontFix: 'closed without a change',
} as const;

/** Notes are cut to this many characters: the PDF is a summary, and the app keeps the whole text. */
const NOTE_CHARS = 280;
const RESOLUTION_CHARS = 200;
/** The most issues a PDF lists. */
export const MAX_ISSUES = 40;
export const MAX_INBOX_ISSUES = 150;

const day = (ms: number | null | undefined): string => (ms && Number.isFinite(ms) ? localDay(ms) : '—');
const dayOfIso = (iso: string | null | undefined): string => (iso ? day(Date.parse(iso)) : '—');
const clip = (text: string, max: number): string => {
  const chars = Array.from(text.replace(/\s+/g, ' ').trim());
  return chars.length <= max ? chars.join('') : `${chars.slice(0, max).join('').trimEnd()}…`;
};
/** Shorten to fit a width, ending in an ellipsis. */
export function fit(text: string, font: PdfFont, size: number, width: number): string {
  if (textWidth(text, font, size) <= width) return text;
  const chars = Array.from(text);
  while (chars.length > 1 && textWidth(`${chars.join('')}…`, font, size) > width) chars.pop();
  return `${chars.join('').trimEnd()}…`;
}

const reached = (level: string, atLeast: SkillLevel) => levelRank(level as SkillLevel) >= levelRank(atLeast);

/** One row per skill (or tool, or standard …) across the courses, at the best level any course reached. */
function bestRows(courses: readonly PdfCourse[], dimension: string): PdfSkillRow[] {
  const by = new Map<string, PdfSkillRow>();
  for (const c of courses) {
    for (const r of c.skills?.rows?.[dimension] ?? []) {
      const prev = by.get(r.id);
      if (!prev || levelRank(r.level as SkillLevel) > levelRank(prev.level as SkillLevel)) by.set(r.id, r);
    }
  }
  return [...by.values()];
}

const sum = (courses: readonly PdfCourse[], pick: (c: PdfCourse) => number | null | undefined): number => courses.reduce((n, c) => n + (pick(c) ?? 0), 0);

/** The figures, worked out from the courses: what a page without a strip of its own prints. */
export function figuresOf(courses: readonly PdfCourse[]): PdfFigure[] {
  const stepsDone = sum(courses, (c) => c.metrics?.stepsDone);
  const stepsTotal = sum(courses, (c) => c.metrics?.stepsTotal);
  const verified = sum(courses, (c) => c.metrics?.verified);
  const verifiable = sum(courses, (c) => c.metrics?.verifiable);
  const receipted = sum(courses, (c) => c.metrics?.receipted);
  const skills = bestRows(courses, 'skills');
  const domains = courses.flatMap((c) => c.skills?.rows?.domains ?? []);
  const procedures = bestRows(courses, 'procedures');
  return [
    { label: 'Steps done', value: `${stepsDone}`, sub: stepsTotal > 0 ? `of ${stepsTotal} required` : 'none yet' },
    { label: 'Steps verified', value: `${verified}`, sub: verifiable > 0 ? `of ${verifiable} checkable${receipted ? ` · ${receipted} receipted` : ''}` : 'none checkable yet' },
    { label: 'Capstones delivered', value: `${courses.filter((c) => c.capstoneFiled).length}`, sub: `of ${courses.length} started` },
    { label: 'Evidence hashed', value: `${sum(courses, (c) => c.metrics?.artifacts)}`, sub: 'files in the custody log' },
    { label: SKILLS_COPY.tiles.skillsVerified, value: `${skills.filter((r) => reached(r.level, 'verified')).length}`, sub: `${SKILLS_COPY.recordSkills} ${skills.filter((r) => reached(r.level, 'practised')).length}` },
    { label: SKILLS_COPY.tiles.toolsUsed, value: `${bestRows(courses, 'tools').filter((r) => reached(r.level, 'practised')).length}`, sub: SKILLS_COPY.recordTools },
    { label: SKILLS_COPY.tiles.proceduresToStandard, value: `${procedures.filter((r) => reached(r.level, 'verified')).length}`, sub: procedures.length > 0 ? `of ${procedures.length} ${SKILLS_COPY.recordProcedures}` : SKILLS_COPY.emptyDimension },
    { label: 'Exam domains verified', value: `${domains.filter((r) => reached(r.level, 'verified')).length}`, sub: `of ${domains.length} across the courses` },
  ];
}


/* ----- drawing ----- */

function section(pdf: PdfWriter, title: string, sub?: string): void {
  pdf.need(70);
  if (pdf.y > pdf.margin.top) pdf.gap(12);
  pdf.paragraph(title.toUpperCase(), { font: 'bold', size: 8, tracking: 1, color: ACCENT, after: 2 });
  if (sub) pdf.paragraph(sub, { size: 8, color: MUTED, after: 1 });
  pdf.rule();
  pdf.gap(6);
}

function figureGrid(pdf: PdfWriter, figures: readonly PdfFigure[]): void {
  const cols = 4;
  const gap = 8;
  const w = (pdf.contentWidth - gap * (cols - 1)) / cols;
  const h = 46;
  for (let i = 0; i < figures.length; i += cols) {
    pdf.need(h + gap);
    const top = pdf.y;
    figures.slice(i, i + cols).forEach((f, j) => {
      const x = pdf.margin.left + j * (w + gap);
      pdf.fillRect(x, top, w, h, PANEL);
      pdf.textAt(x + 8, top + 12, fit(f.label, 'regular', 7.5, w - 16), { size: 7.5, color: MUTED });
      pdf.textAt(x + 8, top + 29, fit(f.value, 'bold', 15, w - 16), { font: 'bold', size: 15 });
      pdf.textAt(x + 8, top + 40, fit(f.sub, 'regular', 7, w - 16), { size: 7, color: MUTED });
    });
    pdf.y = top + h + gap;
  }
}

/** A label in a narrow column and a wrapped list beside it. */
function listRow(pdf: PdfWriter, label: string, items: readonly string[], empty: string = SKILLS_COPY.emptyDimension): void {
  const labelWidth = 118;
  const gap = 8;
  const x = pdf.margin.left + labelWidth + gap;
  const width = pdf.contentWidth - labelWidth - gap;
  const leading = 11.5;
  const body = items.length > 0 ? items.join(' · ') : empty;
  const lead = wrapText(label, 'bold', 8, labelWidth);
  const bodyLines = wrapText(body, 'regular', 8.5, width).length;
  pdf.need(Math.min(Math.max(lead.length, bodyLines), 3) * leading + 4);
  const top = pdf.y;
  lead.forEach((line, i) => pdf.textAt(pdf.margin.left, pdf.baselineIn(top + i * leading, leading, 8), line, { font: 'bold', size: 8 }));
  const page = pdf.pageCount;
  pdf.paragraph(body, { x, width, size: 8.5, leading, color: items.length > 0 ? INK : MUTED });
  if (pdf.pageCount === page) pdf.y = Math.max(pdf.y, top + lead.length * leading);
  pdf.gap(4);
}

function skillsSection(pdf: PdfWriter, courses: readonly PdfCourse[], workRoles: readonly string[]): void {
  const names = (rows: PdfSkillRow[]) => rows.map((r) => r.label);
  const skills = bestRows(courses, 'skills');
  const verified = skills.filter((r) => reached(r.level, 'verified'));
  const practised = skills.filter((r) => r.level === 'practised');
  section(pdf, SKILLS_COPY.portfolioSections.skills, `${verified.length} ${LEVEL_LABEL.skills.verified.toLowerCase()} · ${verified.length + practised.length} ${LEVEL_LABEL.skills.practised.toLowerCase()}`);
  listRow(pdf, `${LEVEL_LABEL.skills.verified} (${verified.length})`, names(verified));
  listRow(pdf, `${LEVEL_LABEL.skills.practised}, not yet verified (${practised.length})`, names(practised));
  const tools = bestRows(courses, 'tools').filter((r) => reached(r.level, 'practised'));
  listRow(pdf, `${SKILLS_COPY.portfolioSections.tools} (${tools.length})`, names(tools));
  const procedures = bestRows(courses, 'procedures').filter((r) => reached(r.level, 'verified'));
  listRow(pdf, `${SKILLS_COPY.portfolioSections.procedures} (${procedures.length})`, names(procedures));
  const standards = bestRows(courses, 'standards').filter((r) => reached(r.level, 'practised'));
  listRow(pdf, `${SKILLS_COPY.portfolioSections.standards} (${standards.length})`, names(standards));
  const tactics = [...bestRows(courses, 'tactics'), ...bestRows(courses, 'practices')].filter((r) => reached(r.level, 'practised'));
  listRow(pdf, `${SKILLS_COPY.portfolioSections.tactics} (${tactics.length})`, names(tactics));
  const domains = courses
    .map((c) => ({ title: c.title, rows: c.skills?.rows?.domains ?? [] }))
    .filter((c) => c.rows.length > 0)
    .map((c) => {
      const done = c.rows.filter((r) => reached(r.level, 'verified'));
      return `${c.title}: ${done.length} ${PDF_LABELS.of} ${c.rows.length}${done.length > 0 ? ` (${done.map((r) => r.label).join(', ')})` : ''}`;
    });
  listRow(pdf, SKILLS_COPY.portfolioSections.domains, domains);
  if (workRoles.length > 0) listRow(pdf, SKILLS_COPY.board.workRole, workRoles);
}

/** R134 — the fourteen categories as a table: the tier at ten verified uses, the success rate, the relevance and the evidence. */
function categoriesSection(pdf: PdfWriter, categories: readonly PdfCategory[]): void {
  if (categories.length === 0) return;
  section(pdf, PDF_LABELS.categories, SKILLS_COPY.board.tierRule);
  const fractions = [0.26, 0.18, 0.14, 0.14, 0.14, 0.14];
  const widths = fractions.map((f) => f * pdf.contentWidth);
  const xs = widths.map((_, i) => pdf.margin.left + widths.slice(0, i).reduce((a, b) => a + b, 0));
  pdf.need(26);
  const head = pdf.y;
  PDF_LABELS.categoryColumns.forEach((c, i) => pdf.textAt(xs[i], head + 9, c.toUpperCase(), { font: 'bold', size: 6.5, tracking: 0.6, color: MUTED }));
  pdf.y = head + 14;
  for (const c of categories) {
    pdf.need(13);
    const top = pdf.y;
    const base = top + 9;
    pdf.textAt(xs[0], base, fit(c.label, 'bold', 8, widths[0] - 6), { font: 'bold', size: 8 });
    pdf.textAt(xs[1], base, c.tier === 'professional' ? SKILLS_COPY.board.tierProfessional : `${SKILLS_COPY.board.tierBuilding} ${c.verifiedUses}/${c.threshold}`, { size: 8, color: c.tier === 'professional' ? ACCENT : MUTED });
    pdf.textAt(xs[2], base, `${c.verifiedUses}`, { size: 8 });
    pdf.textAt(xs[3], base, c.successRate.of > 0 ? `${Math.round((100 * c.successRate.value) / c.successRate.of)}%` : '—', { size: 8 });
    pdf.textAt(xs[4], base, `${c.relevance}%`, { size: 8 });
    pdf.textAt(xs[5], base, `${c.evidenceCount}`, { size: 8 });
    pdf.y = top + 13;
  }
  pdf.gap(4);
}

function progressSection(pdf: PdfWriter, courses: readonly PdfCourse[]): void {
  if (courses.length === 0) return;
  section(pdf, PDF_LABELS.progress);
  const fractions = [0.34, 0.2, 0.12, 0.12, 0.08, 0.14];
  const widths = fractions.map((f) => f * pdf.contentWidth);
  const xs = widths.map((_, i) => pdf.margin.left + widths.slice(0, i).reduce((a, b) => a + b, 0));
  const pad = 6;
  pdf.need(40);
  const head = pdf.y;
  PDF_LABELS.columns.forEach((c, i) => pdf.textAt(xs[i], head + 9, c.toUpperCase(), { font: 'bold', size: 6.5, tracking: 0.6, color: MUTED }));
  pdf.y = head + 14;
  for (const c of courses) {
    const m = c.metrics ?? {};
    const titleLines = wrapText(c.title, 'bold', 8.5, widths[0] - pad * 2);
    const shown = titleLines.length > 2 ? [titleLines[0], fit(titleLines.slice(1).join(' '), 'bold', 8.5, widths[0] - pad * 2)] : titleLines;
    // R134: the scores that stand on something, as "label n/100".
    const scores = (c.scores ?? []).filter((x) => x.loaded).map((x) => `${x.id.replace('score.', '').replace(/-/g, ' ')} ${x.value}/100`);
    const meta = [c.role, c.capstoneFiled ? PDF_LABELS.capstoneFiled : null, scores.length ? `${PDF_LABELS.scores.toLowerCase()}: ${scores.join(', ')}` : null].filter(Boolean).join(' · ');
    const h = Math.max(30, shown.length * 11 + (meta ? 11 : 0) + 8);
    pdf.need(h);
    const top = pdf.y;
    pdf.line(pdf.margin.left, top, pdf.margin.left + pdf.contentWidth, top, LINE, 0.4);
    shown.forEach((l, i) => pdf.textAt(xs[0], pdf.baselineIn(top + 3 + i * 11, 11, 8.5), l, { font: 'bold', size: 8.5 }));
    if (meta) pdf.textAt(xs[0], pdf.baselineIn(top + 3 + shown.length * 11, 11, 7.5), fit(meta, 'regular', 7.5, widths[0] - pad * 2), { size: 7.5, color: MUTED });
    const done = m.stepsDone ?? 0;
    const total = m.stepsTotal ?? 0;
    pdf.textAt(xs[1], top + 14, `${done} ${PDF_LABELS.of} ${total}`, { size: 8.5 });
    const barW = widths[1] - pad * 2;
    pdf.fillRect(xs[1], top + 19, barW, 3.5, TRACK);
    if (total > 0 && done > 0) pdf.fillRect(xs[1], top + 19, barW * Math.min(1, done / total), 3.5, ACCENT);
    pdf.textAt(xs[2], top + 14, `${m.verified ?? 0} ${PDF_LABELS.of} ${m.verifiable ?? 0}`, { size: 8.5 });
    const rows = c.skills?.rows?.skills ?? [];
    pdf.textAt(xs[3], top + 14, `${rows.filter((r) => reached(r.level, 'verified')).length} ${PDF_LABELS.of} ${rows.length}`, { size: 8.5 });
    pdf.textAt(xs[4], top + 14, `${m.artifacts ?? 0}`, { size: 8.5 });
    pdf.textAt(xs[5], top + 14, day(m.lastActivity), { size: 8.5 });
    pdf.y = top + h;
  }
  pdf.line(pdf.margin.left, pdf.y, pdf.margin.left + pdf.contentWidth, pdf.y, LINE, 0.4);
}

/** Where an issue is, in one line: course › week › task › step. */
function whereOf(i: IssueDto): string {
  return [i.courseTitle, i.week !== null ? `Week ${i.week}` : null, i.taskTitle, i.stepNumber !== null ? `Step ${i.stepNumber}${i.stepTitle ? `: ${i.stepTitle}` : ''}` : null].filter(Boolean).join(' › ');
}

/** One issue: when, what kind, where it stands; where it is; what was said; what was done about it. */
function issueBlock(pdf: PdfWriter, i: IssueDto, opts: { reporter: boolean }): void {
  const w = pdf.contentWidth;
  const where = whereOf(i);
  const note = clip(i.note, NOTE_CHARS);
  const closed = i.status === 'resolved' || i.status === 'wont_fix';
  const resolution = i.resolution && (i.resolution.note || closed)
    ? `${reportStatusLabel(i.status)} ${dayOfIso(i.resolution.at)}${i.resolution.fixRevision ? ` · fixed in revision ${i.resolution.fixRevision}` : ''}${i.resolution.note ? ` — ${clip(i.resolution.note, RESOLUTION_CHARS)}` : ''}`
    : '';
  const lines = 1 + wrapText(where, 'regular', 8, w).length + wrapText(note, 'regular', 8.5, w).length + (resolution ? wrapText(resolution, 'regular', 8, w).length : 0);
  // Keep the first lines of an issue together: the heading is never left alone at the foot of a page.
  pdf.need(Math.min(lines, 5) * 11.5 + 8);
  const top = pdf.y;
  const reporter = opts.reporter ? ` · ${i.reporter.name}${i.reporter.roleName ? ` · ${i.reporter.roleName}` : ''}` : '';
  pdf.paragraph(`${dayOfIso(i.reportedAt)} · ${reportKindLabel(i.kind)} · ${reportStatusLabel(i.status)}${reporter}`, { font: 'bold', size: 8.5, leading: 11.5, width: w - 70 });
  if (i.contentVersion) pdf.textAt(pdf.margin.left + w, pdf.baselineIn(top, 11.5, 7.5), `saw v${i.contentVersion}`, { size: 7.5, color: MUTED, align: 'right' });
  pdf.paragraph(where, { size: 8, leading: 11, color: MUTED });
  if (note) pdf.paragraph(note, { size: 8.5, leading: 11.5 });
  if (resolution) pdf.paragraph(resolution, { size: 8, leading: 11, color: MUTED });
  pdf.gap(3);
  pdf.line(pdf.margin.left, pdf.y, pdf.margin.left + w, pdf.y, LINE, 0.4);
  pdf.gap(5);
}

function issuesSection(pdf: PdfWriter, issues: readonly IssueDto[]): void {
  const counts = issueCounts(issues);
  section(pdf, PDF_LABELS.issues, counts.total > 0 ? `${counts.total} reported · ${counts.pending} ${PDF_LABELS.pending} · ${counts.complete} ${PDF_LABELS.complete}` : undefined);
  if (issues.length === 0) {
    pdf.paragraph(PDF_LABELS.noIssues, { size: 8.5, color: MUTED });
    return;
  }
  for (const i of issues.slice(0, MAX_ISSUES)) issueBlock(pdf, i, { reporter: false });
  if (issues.length > MAX_ISSUES) pdf.paragraph(PDF_LABELS.moreIssues(issues.length - MAX_ISSUES), { size: 8, color: MUTED });
}

function header(pdf: PdfWriter, eyebrow: string, title: string, sub: string): void {
  pdf.paragraph(eyebrow.toUpperCase(), { font: 'bold', size: 7.5, tracking: 1.2, color: ACCENT, after: 3 });
  pdf.paragraph(title, { font: 'bold', size: 20, leading: 24, after: 2 });
  pdf.paragraph(sub, { size: 9, color: MUTED, after: 6 });
}

const footer = (left: string) => (page: number, total: number) => ({ left, right: PDF_LABELS.page(page, total) });

/** The member's record as a PDF: figures, skills, progress by course, issues. */
export function buildRecordPdf(input: RecordPdfInput): Uint8Array<ArrayBuffer> {
  const generated = day(input.generatedAt);
  const issues = input.issues;
  const pdf = new PdfWriter({ title: `Capstone record — ${input.subject}`, subject: 'Skills, progress and issues', created: input.generatedAt });
  header(pdf, PDF_LABELS.eyebrow, input.subject, `${PDF_LABELS.generated} ${generated} · ${input.scope ?? `${input.courses.length} ${input.courses.length === 1 ? 'course' : 'courses'}`}`);
  pdf.paragraph(`${SKILLS_COPY.pdf.claim} ${SKILLS_COPY.pdf.unsigned}`, { size: 8, leading: 11, color: MUTED });
  section(pdf, PDF_LABELS.record);
  figureGrid(pdf, input.figures ?? figuresOf(input.courses));
  if (input.categories) categoriesSection(pdf, input.categories);
  skillsSection(pdf, input.courses, input.workRoles ?? []);
  progressSection(pdf, input.courses);
  // A source that carries no issues (a shared copy) leaves the section out: "none" would be a claim nobody checked.
  if (issues) issuesSection(pdf, issues);
  return pdf.finish(footer(`Capstone Quarry · ${input.subject} · ${generated}`));
}

export interface IssuesPdfInput {
  generatedAt: number;
  issues: readonly IssueDto[];
  /** What the list is: the tab and the filters in force, in words. */
  scope: string;
}

/** The inbox's issues as a PDF: the counts, then each issue with who reported it, where, and what was done. */
export function buildIssuesPdf(input: IssuesPdfInput): Uint8Array<ArrayBuffer> {
  const generated = day(input.generatedAt);
  const counts = issueCounts(input.issues);
  const pdf = new PdfWriter({ title: PDF_LABELS.issuesTitle, subject: input.scope, created: input.generatedAt });
  header(pdf, PDF_LABELS.issuesEyebrow, PDF_LABELS.issuesTitle, `${PDF_LABELS.generated} ${generated} · ${input.scope}`);
  figureGrid(pdf, [
    { label: 'Reported', value: `${counts.total}`, sub: 'in this list' },
    { label: 'Pending', value: `${counts.pending}`, sub: 'open or in progress' },
    { label: 'Resolved', value: `${counts.complete}`, sub: 'with a fix or an answer' },
    { label: 'Won’t fix', value: `${counts.wontFix}`, sub: PDF_LABELS.wontFix },
  ]);
  const listed = input.issues.slice(0, MAX_INBOX_ISSUES);
  const byCourse = new Map<string, IssueDto[]>();
  for (const i of listed) byCourse.set(i.courseId, [...(byCourse.get(i.courseId) ?? []), i]);
  for (const group of byCourse.values()) {
    section(pdf, `${group[0].courseTitle} · ${group.length}`);
    for (const i of group) issueBlock(pdf, i, { reporter: true });
  }
  if (input.issues.length === 0) pdf.paragraph(PDF_LABELS.noIssues, { size: 8.5, color: MUTED });
  if (input.issues.length > MAX_INBOX_ISSUES) pdf.paragraph(PDF_LABELS.moreIssues(input.issues.length - MAX_INBOX_ISSUES), { size: 8, color: MUTED });
  return pdf.finish(footer(`Capstone Quarry · ${PDF_LABELS.issuesTitle} · ${generated}`));
}

/** `capstone-record_2026-10-16.pdf`, or with the course it covers. */
export function recordPdfName(generatedAt: number, courseId?: string): string {
  return `capstone-record${courseId ? `_${courseId}` : ''}_${localDay(generatedAt)}.pdf`;
}

export function issuesPdfName(generatedAt: number): string {
  return `capstone-issues_${localDay(generatedAt)}.pdf`;
}

export function credentialPdfName(generatedAt: number): string {
  return `capstone-credential_${localDay(generatedAt)}.pdf`;
}

/* ----- a shared copy ----- */

const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asNumber = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const asString = (v: unknown): string | undefined => (typeof v === 'string' && v !== '' ? v : undefined);

/**
 * A shared copy (the frozen JSON a candidate link serves) as the PDF's input. Copies from older shapes lack
 * fields, so every read is checked and a missing one is simply absent from the page. The figures are the
 * ones the shared page prints from the copy's own summary, which is the member's whole record, while the
 * course list is the courses the member chose to include; the subtitle says how many.
 */
export function recordPdfFromShare(snapshot: unknown, generatedAt: number, opts: { madeAt?: number } = {}): RecordPdfInput {
  const snap = asRecord(snapshot);
  const courses: PdfCourse[] = asArray(snap.courses).map((raw) => {
    const c = asRecord(raw);
    const m = asRecord(c.metrics);
    const rows = asRecord(asRecord(c.skills).rows);
    return {
      courseId: asString(c.courseId) ?? '',
      title: asString(c.title) ?? asString(c.courseId) ?? 'Course',
      role: asString(c.role),
      capstoneFiled: c.capstoneFiled === true,
      metrics: {
        stepsDone: asNumber(m.stepsDone),
        stepsTotal: asNumber(m.stepsTotal),
        verified: asNumber(m.verified),
        verifiable: asNumber(m.verifiable),
        artifacts: asNumber(m.artifacts),
        activeDays: asNumber(m.activeDays),
        lastActivity: asNumber(m.lastActivity),
        receipted: asNumber(m.receipted) ?? null,
      },
      skills: {
        rows: Object.fromEntries(
          Object.entries(rows).map(([dimension, list]) => [
            dimension,
            asArray(list).flatMap((r): PdfSkillRow[] => {
              const row = asRecord(r);
              const id = asString(row.id);
              const level = asString(row.level);
              return id && level ? [{ id, label: asString(row.label) ?? id, level }] : [];
            }),
          ])
        ),
      },
      // R134: a copy since member-profile/2 carries the scores; an older one does not.
      scores: asArray(c.scores).flatMap((x) => {
        const sc = asRecord(x);
        const id = asString(sc.id);
        const value = asNumber(sc.value);
        return id && value !== undefined ? [{ id, value, loaded: sc.loaded === true }] : [];
      }),
    };
  });
  const categories: PdfCategory[] = asArray(snap.categories).flatMap((x) => {
    const c = asRecord(x);
    const id = asString(c.id);
    const rate = asRecord(c.successRate);
    if (!id) return [];
    return [{ id, label: id.replace(/-/g, ' ').replace(/^./, (ch) => ch.toUpperCase()), tier: asString(c.tier) ?? 'building', verifiedUses: asNumber(c.verifiedUses) ?? 0, threshold: asNumber(c.threshold) ?? 10, successRate: { value: asNumber(rate.value) ?? 0, of: asNumber(rate.of) ?? 0 }, relevance: asNumber(c.relevance) ?? 0, evidenceCount: asNumber(c.evidenceCount) ?? 0 }];
  });
  const summary = asRecord(snap.summary);
  const figures: PdfFigure[] = [
    { label: 'Steps verified', value: `${asNumber(summary.verified) ?? 0}`, sub: `of ${asNumber(summary.verifiable) ?? 0} checkable${asNumber(summary.receipted) ? ` · ${asNumber(summary.receipted)} receipted` : ''}` },
    { label: 'Files hashed', value: `${asNumber(summary.artifacts) ?? 0}`, sub: 'digests, not files' },
    { label: SKILLS_COPY.tiles.skillsVerified, value: `${asArray(summary.skillsVerified).length}`, sub: `of ${asArray(summary.skillsPractised).length} practised` },
    { label: 'Courses', value: `${courses.length}`, sub: 'in this copy' },
  ];
  const display = asString(asRecord(snap.subject).display) ?? 'A Capstone Quarry member';
  return { subject: display, generatedAt, courses, figures, ...(categories.length ? { categories } : {}), scope: `a shared copy${opts.madeAt ? ` made ${day(opts.madeAt)}` : ''} of ${courses.length} ${courses.length === 1 ? 'course' : 'courses'}` };
}

/**
 * A shared credential (the Open Badges envelope a candidate link serves) as a one-page PDF: what it is, what it
 * is aligned to, the digest of the profile it stands on, and the line that says it is unsigned. Every read is
 * checked, as for a shared profile, because the copy is whatever the function stored.
 */
export function buildCredentialPdf(snapshot: unknown, generatedAt: number): Uint8Array<ArrayBuffer> {
  const snap = asRecord(snapshot);
  const achievement = asRecord(asRecord(snap.credentialSubject).achievement);
  const name = asString(achievement.name) ?? 'Shared credential';
  const issuer = asString(asRecord(snap.issuer).name);
  const issued = asString(snap.validFrom);
  const generated = day(generatedAt);
  const pdf = new PdfWriter({ title: name, subject: 'A shared credential', created: generatedAt });
  header(pdf, PDF_LABELS.credentialEyebrow, name, [issuer ? `${PDF_LABELS.issuedBy} ${issuer}` : null, issued ? dayOfIso(issued) : null, `${PDF_LABELS.generated} ${generated}`].filter(Boolean).join(' · '));
  const description = asString(achievement.description);
  if (description) pdf.paragraph(description, { size: 9, leading: 12.5, after: 3 });
  const narrative = asString(asRecord(achievement.criteria).narrative);
  if (narrative) pdf.paragraph(narrative, { size: 8.5, leading: 11.5, color: MUTED });

  const alignment = asArray(achievement.alignment).map(asRecord);
  section(pdf, PDF_LABELS.alignedTo, `${alignment.length}`);
  const byFramework = new Map<string, string[]>();
  for (const a of alignment) {
    const framework = asString(a.targetFramework) ?? '';
    const label = asString(a.targetName) ?? asString(a.targetCode) ?? '';
    const code = asString(a.targetCode);
    if (!label) continue;
    byFramework.set(framework, [...(byFramework.get(framework) ?? []), code && code !== label ? `${label} (${code})` : label]);
  }
  if (byFramework.size === 0) pdf.paragraph(SKILLS_COPY.emptyDimension, { size: 8.5, color: MUTED });
  for (const [framework, items] of byFramework) {
    const heading = framework === 'capstone-ontology' ? PDF_LABELS.competencies : framework === 'NICE' ? `NICE ${PDF_LABELS.workRoles.toLowerCase()}` : `${PDF_LABELS.examDomains}${framework ? ` · ${framework}` : ''}`;
    listRow(pdf, `${heading} (${items.length})`, items);
  }

  const evidence = asRecord(asArray(snap.evidence)[0]);
  const digest = asString(evidence.id);
  if (digest) {
    section(pdf, PDF_LABELS.evidence);
    pdf.paragraph(digest, { font: 'mono', size: 7.5, leading: 10.5, after: 3 });
    const what = asString(evidence.description);
    if (what) pdf.paragraph(what, { size: 8, color: MUTED });
  }
  const claim = asString(snap.claim);
  if (claim) {
    pdf.gap(8);
    pdf.paragraph(claim, { size: 8, leading: 11, color: MUTED });
  }
  return pdf.finish(footer(`Capstone Quarry · ${name} · ${generated}`));
}

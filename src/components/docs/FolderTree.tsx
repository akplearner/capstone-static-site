'use client';

import { motion } from 'framer-motion';
import { Folder, FileText, FileSpreadsheet, Image as ImageIcon, BookText } from 'lucide-react';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { EVIDENCE_NAMING_PNG, evidencePackageDir } from '@/lib/evidence';
import { roleFolder } from '@/lib/docs/package';
import { Role, RoleDef, FolderNode } from '@/lib/types';
import { DeliverableDef } from '@/lib/docs/types';

/**
 * The submission folder structure, built from the deliverables' `folder`/`file`
 * so the tree always matches what the package export produces. Files are
 * colour-tinted by the owning role and iconed by type; the Evidence/ folder shows
 * example artifact filenames (pulled from each form's fileref placeholders) so
 * students see the naming convention.
 *
 * `variant="course"` mirrors buildTeamPackage (folders = NN_Topic).
 * `variant="week"` mirrors buildWeekPackage (folders = role names, Evidence/ at root).
 * The Node/TreeNode/NodeIcon exports are reused to render a per-step `Step.tree`.
 */
// The tree node shape lives in lib/types (FolderNode) so Step.tree can reference
// it without importing this component. `Node` is kept as a local alias.
export type Node = FolderNode;

/** The course's own name for a role id — never a hardcoded Red/Blue/GRC. */
function ownerLabel(owner: string, roles?: RoleDef[]): string {
  return roles?.find((r) => r.id === owner)?.name ?? owner;
}

const ROLE_TEXT: Record<string, string> = {
  red: 'text-red-600 dark:text-red-400',
  blue: 'text-blue-600 dark:text-blue-400',
  grc: 'text-green-600 dark:text-green-400',
};

/** Example evidence filenames a course expects, pulled from fileref placeholders. */
function exampleEvidenceNames(courseId: string, week?: number): string[] {
  const names = new Set<string>();
  for (const d of deliverablesForCourse(courseId)) {
    if (week !== undefined && !d.weeks.includes(week)) continue;
    for (const s of d.sections) {
      if (s.kind !== 'fields') continue;
      for (const f of s.fields) {
        if (f.type === 'fileref' && f.placeholder) names.add(f.placeholder);
      }
    }
  }
  return [...names];
}

function evidenceNode(courseId: string, week?: number): Node {
  const examples = exampleEvidenceNames(courseId, week).slice(0, 3);
  return {
    label: 'Evidence/',
    kind: 'folder',
    children: [
      { label: 'CHAIN_OF_CUSTODY.md', kind: 'file', format: 'md' },
      ...examples.map((label): Node => ({ label, kind: 'file', format: 'img' })),
    ],
  };
}

/** Whole-course package layout (NN_Topic folders). */
function buildCourseTree(courseId: string): Node {
  const byFolder = new Map<string, { file: string; owner: Role; format: 'md' | 'csv' }[]>();
  for (const d of deliverablesForCourse(courseId)) {
    const list = byFolder.get(d.folder) ?? [];
    list.push({ file: d.file, owner: d.owner, format: d.exportFormat });
    byFolder.set(d.folder, list);
  }
  // The evidence dir may be nested under a course folder (Security+) or at root.
  const evDir = evidencePackageDir(courseId); // e.g. '04_Testing_and_Findings/Evidence' or 'Evidence'
  const evParent = evDir.includes('/') ? evDir.split('/')[0] : null;

  const folders: Node[] = [...byFolder.entries()].map(([folder, files]) => {
    const children: Node[] = files.map((f) => ({
      label: f.file,
      kind: 'file' as const,
      owner: f.owner,
      format: f.format,
    }));
    if (evParent && folder === evParent) children.push(evidenceNode(courseId));
    return { label: `${folder}/`, kind: 'folder' as const, children };
  });

  const rootChildren: Node[] = [...folders];
  if (!evParent) rootChildren.push(evidenceNode(courseId)); // Evidence/ at root for CySA etc.
  rootChildren.push(
    { label: 'README.md', kind: 'file', format: 'md' },
    { label: 'Team_Roles.md', kind: 'file', format: 'md' },
  );
  return { label: 'Capstone_TeamXX/', kind: 'root', children: rootChildren };
}

/** Per-week package layout (role-name folders + Evidence/ at root). */
function buildWeekTree(courseId: string, week: number, roles?: RoleDef[]): Node {
  const defs = deliverablesForCourse(courseId).filter((d) => d.weeks.includes(week));
  const byRole = new Map<string, DeliverableDef[]>();
  for (const d of defs) {
    const list = byRole.get(d.owner) ?? [];
    list.push(d);
    byRole.set(d.owner, list);
  }
  const roleFolders: Node[] = [...byRole.entries()].map(([owner, ds]) => ({
    label: `${roleFolder(owner, roles)}/`,
    kind: 'folder' as const,
    children: ds.map((d) => ({ label: d.file, kind: 'file' as const, owner: d.owner as Role, format: d.exportFormat })),
  }));
  return {
    label: `Capstone_TeamXX_Week${week}/`,
    kind: 'root',
    children: [
      ...roleFolders,
      evidenceNode(courseId, week),
      { label: 'README.md', kind: 'file', format: 'md' },
    ],
  };
}

export function NodeIcon({ node }: { node: Node }) {
  const cls = 'h-3.5 w-3.5 shrink-0';
  if (node.kind === 'root' || node.kind === 'folder')
    return <Folder className={`${cls} text-amber-500`} />;
  if (node.format === 'csv') return <FileSpreadsheet className={`${cls} text-emerald-500`} />;
  if (node.format === 'img') return <ImageIcon className={`${cls} text-violet-500`} />;
  if (node.label.startsWith('README') || node.label.startsWith('Team_Roles'))
    return <BookText className={`${cls} text-gray-400`} />;
  return <FileText className={`${cls} text-sky-500`} />;
}

export function TreeNode({ node, depth = 0, index = 0, roles }: { node: Node; depth?: number; index?: number; roles?: RoleDef[] }) {
  const textCls =
    node.kind === 'root'
      ? 'font-semibold text-ink'
      : node.owner
        ? ROLE_TEXT[node.owner] ?? 'text-muted'
        : 'text-muted';
  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(depth * 0.04 + index * 0.03, 0.4), duration: 0.18 }}
    >
      <span className="flex items-center gap-1.5">
        <NodeIcon node={node} />
        <span className={`font-mono text-xs ${textCls}`}>{node.label}</span>
        {node.owner && (
          <span className="rounded bg-panel-2 px-1 text-[11px] text-muted">
            {ownerLabel(node.owner, roles)}
          </span>
        )}
      </span>
      {node.children && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-700">
          {node.children.map((c, i) => (
            <TreeNode key={c.label} node={c} depth={depth + 1} index={i} roles={roles} />
          ))}
        </ul>
      )}
    </motion.li>
  );
}

export function FolderTree({
  courseId = 'security-plus',
  variant = 'course',
  week,
  roles,
}: {
  courseId?: string;
  variant?: 'course' | 'week';
  week?: number;
  roles?: RoleDef[];
}) {
  const isWeek = variant === 'week' && week !== undefined;
  const tree = isWeek ? buildWeekTree(courseId, week!, roles) : buildCourseTree(courseId);
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-ink">
        {isWeek ? `Week ${week} submission — what your zip contains` : 'Submission folder structure'}
      </h3>
      <p className="mt-1 text-sm text-muted">
        {isWeek ? (
          <>This is exactly what <strong>Download this week&apos;s package</strong> produces — role folders plus an{' '}
          <span className="font-mono">Evidence/</span> folder. Name screenshots{' '}
          <span className="font-mono">{EVIDENCE_NAMING_PNG}</span>.</>
        ) : (
          <>This is exactly what <strong>Download team package</strong> produces — one zip, ready to submit.
          Files are colour-coded by the role that owns them.</>
        )}
      </p>
      <ul className="mt-3 space-y-1">
        <TreeNode node={tree} roles={roles} />
      </ul>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        {/* Role names come from the course, not a hardcoded Red/Blue/GRC — those
            are Security+ labels and mean nothing in a course whose roles are
            SOC Analyst / Threat Hunter / Incident Responder. */}
        {(roles ?? []).map((r) => (
          <span key={r.id} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: r.color }} /> {r.name}
          </span>
        ))}
        <span className="flex items-center gap-1"><FileText className="h-3 w-3 text-sky-500" /> .md</span>
        <span className="flex items-center gap-1"><FileSpreadsheet className="h-3 w-3 text-emerald-500" /> .csv</span>
        <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3 text-violet-500" /> evidence</span>
      </div>
    </div>
  );
}

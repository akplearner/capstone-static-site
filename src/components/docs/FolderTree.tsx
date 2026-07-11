'use client';

import { Folder, FileText, FileSpreadsheet, Image as ImageIcon, BookText } from 'lucide-react';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { Role } from '@/lib/types';

/**
 * Spec §3 — the submission folder structure. Built from the deliverables'
 * `folder`/`file` so the tree always matches what the package export produces.
 * Files are colour-tinted by the role that owns them and iconed by type, and the
 * Evidence/ folder shows example artifact filenames so students see the naming.
 */
type NodeKind = 'root' | 'folder' | 'file';
type Node = {
  label: string;
  kind: NodeKind;
  owner?: Role;
  format?: 'md' | 'csv' | 'img';
  children?: Node[];
};

const ROLE_TEXT: Record<string, string> = {
  red: 'text-red-600 dark:text-red-400',
  blue: 'text-blue-600 dark:text-blue-400',
  grc: 'text-green-600 dark:text-green-400',
};

function buildTree(courseId: string): Node {
  const byFolder = new Map<string, { file: string; owner: Role; format: 'md' | 'csv' }[]>();
  for (const d of deliverablesForCourse(courseId)) {
    const list = byFolder.get(d.folder) ?? [];
    list.push({ file: d.file, owner: d.owner, format: d.exportFormat });
    byFolder.set(d.folder, list);
  }
  const folders: Node[] = [...byFolder.entries()].map(([folder, files]) => {
    const children: Node[] = files.map((f) => ({
      label: f.file,
      kind: 'file' as const,
      owner: f.owner,
      format: f.format,
    }));
    if (folder === '04_Testing_and_Findings') {
      children.push({
        label: 'Evidence/',
        kind: 'folder',
        children: [
          { label: 'CHAIN_OF_CUSTODY.md', kind: 'file', format: 'md' },
          { label: '20260217_Team01_sqlmap_dump.png', kind: 'file', format: 'img' },
          { label: '20260217_Team01_hydra_bruteforce.png', kind: 'file', format: 'img' },
        ],
      });
    }
    return { label: `${folder}/`, kind: 'folder' as const, children };
  });
  return {
    label: 'Capstone_TeamXX/',
    kind: 'root',
    children: [
      ...folders,
      { label: 'README.md', kind: 'file', format: 'md' },
      { label: 'Team_Roles.md', kind: 'file', format: 'md' },
    ],
  };
}

function NodeIcon({ node }: { node: Node }) {
  const cls = 'h-3.5 w-3.5 shrink-0';
  if (node.kind === 'root' || node.kind === 'folder')
    return <Folder className={`${cls} text-amber-500`} />;
  if (node.format === 'csv') return <FileSpreadsheet className={`${cls} text-emerald-500`} />;
  if (node.format === 'img') return <ImageIcon className={`${cls} text-violet-500`} />;
  if (node.label.startsWith('README') || node.label.startsWith('Team_Roles'))
    return <BookText className={`${cls} text-gray-400`} />;
  return <FileText className={`${cls} text-sky-500`} />;
}

function TreeNode({ node, depth = 0 }: { node: Node; depth?: number }) {
  const textCls =
    node.kind === 'root'
      ? 'font-semibold text-gray-900 dark:text-white'
      : node.owner
        ? ROLE_TEXT[node.owner] ?? 'text-gray-600 dark:text-gray-400'
        : 'text-gray-600 dark:text-gray-400';
  return (
    <li>
      <span className="flex items-center gap-1.5">
        <NodeIcon node={node} />
        <span className={`font-mono text-xs ${textCls}`}>{node.label}</span>
        {node.owner && (
          <span className="rounded bg-gray-100 px-1 text-[10px] uppercase text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            {node.owner}
          </span>
        )}
      </span>
      {node.children && (
        <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-700">
          {node.children.map((c) => (
            <TreeNode key={c.label} node={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FolderTree({ courseId = 'security-plus' }: { courseId?: string }) {
  const tree = buildTree(courseId);
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Submission folder structure</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        This is exactly what <strong>Download team package</strong> produces — one zip, ready to submit.
        Files are colour-coded by the role that owns them.
      </p>
      <ul className="mt-3 space-y-1">
        <TreeNode node={tree} />
      </ul>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Red</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Blue</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> GRC</span>
        <span className="flex items-center gap-1"><FileText className="h-3 w-3 text-sky-500" /> .md</span>
        <span className="flex items-center gap-1"><FileSpreadsheet className="h-3 w-3 text-emerald-500" /> .csv</span>
        <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3 text-violet-500" /> evidence</span>
      </div>
    </div>
  );
}

'use client';

import { DELIVERABLES } from '@/lib/docs/definitions';

/**
 * Spec §3 — the submission folder structure. Built from the deliverables'
 * `folder`/`file` so the tree always matches what the package export produces.
 */
type Node = { label: string; mono?: boolean; children?: Node[] };

function buildTree(): Node {
  const byFolder = new Map<string, string[]>();
  for (const d of DELIVERABLES) {
    const list = byFolder.get(d.folder) ?? [];
    list.push(d.file);
    byFolder.set(d.folder, list);
  }
  const folders: Node[] = [...byFolder.entries()].map(([folder, files]) => {
    const children: Node[] = files.map((f) => ({ label: f, mono: true }));
    if (folder === '04_Testing_and_Findings') children.push({ label: 'Evidence/', mono: true });
    return { label: `${folder}/`, mono: true, children };
  });
  return {
    label: 'Capstone_TeamXX/',
    mono: true,
    children: [
      ...folders,
      { label: 'README.md', mono: true },
      { label: 'Team_Roles.md', mono: true },
    ],
  };
}

function TreeNode({ node, depth = 0 }: { node: Node; depth?: number }) {
  return (
    <li>
      <span
        className={`${node.mono ? 'font-mono text-xs' : ''} ${
          depth === 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {node.label}
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

export function FolderTree() {
  const tree = buildTree();
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Submission folder structure</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        This is exactly what <strong>Download team package</strong> produces — one zip, ready to submit.
      </p>
      <ul className="mt-3 space-y-1">
        <TreeNode node={tree} />
      </ul>
    </div>
  );
}

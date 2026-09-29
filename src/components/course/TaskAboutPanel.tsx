import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BookOpen, Coins, FileText, GraduationCap, Inbox, Tag, Users, Wrench } from 'lucide-react';
import type { Course, Task } from '@/lib/types';
import { getRoleDef, taskCard } from '@/lib/course-helpers';
import { getFrameworkColor, getFrameworkLabel } from '@/lib/utils';

/** One row of the card: a label and its content, omitted entirely when there is
 *  nothing to show. Keeping the omission here is what lets a course that never
 *  authored `learn` or `consumes` render a shorter card rather than a card full
 *  of empty headings. */
function CardRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      <div className="min-w-0 flex-1">
        <span className="font-mono text-3xs uppercase tracking-wide text-muted">{label}</span>
        <div className="mt-0.5 text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

/**
 * Everything about a task that is not a step, gathered for the "About this
 * task" disclosure: the identity strip (needs / produces / hand-offs) and the
 * tools-and-learning brief. The done-criteria left in R79: they are the last
 * rung of the step ladder, where a student meets them on the way down. These used to render as three
 * separate always-open blocks stacked between the task title and its first
 * checkbox. The checklist comes first now and this panel holds the rest, one
 * press away. Nothing was deleted: Security+ authors hand-offs on 15/15 tasks
 * and MSSP on 9/14, and the DoD is the task-level finish line — they must stay
 * reachable, just not in the way.
 */
export function TaskAboutPanel({ course, task }: { course: Course; task: Task }) {
  const card = taskCard(course, task);
  const roleName = (id: string) => getRoleDef(course, id)?.name ?? id;
  const hasBrief = !!(task.learn?.length || task.frameworks?.length || task.tools?.length || task.docs?.length || task.freeTier || task.prerequisites?.length);

  return (
    <div className="space-y-3">
      {(card.inputs.length > 0 || card.produces.length > 0 || card.handoff.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-3">
          {card.inputs.length > 0 && (
            <CardRow icon={Inbox} label="You need first">
              <ul className="space-y-0.5">
                {card.inputs.map((i, n) => (
                  <li key={`${i.label}-${n}`}>
                    {i.from && (
                      <span
                        className="font-semibold"
                        style={{ color: getRoleDef(course, i.from)?.color }}
                      >
                        {roleName(i.from)}:{' '}
                      </span>
                    )}
                    {i.label}
                  </li>
                ))}
              </ul>
            </CardRow>
          )}
          {card.produces.length > 0 && (
            <CardRow icon={FileText} label="You produce">
              <ul className="space-y-0.5">
                {card.produces.map((d) => (
                  <li key={d} className="break-all font-mono text-2xs">
                    {d}
                  </li>
                ))}
              </ul>
            </CardRow>
          )}
          {card.handoff.length > 0 && (
            <CardRow icon={ArrowRight} label="Hand off to">
              <ul className="space-y-0.5">
                {card.handoff.map((h, n) => (
                  <li key={`${h.to}-${n}`}>
                    <span
                      className="font-semibold"
                      style={{ color: getRoleDef(course, h.to)?.color }}
                    >
                      {roleName(h.to)}
                    </span>
                    {h.artifact ? ` — ${h.artifact}` : ''}
                    <span className="text-muted"> · {h.note}</span>
                  </li>
                ))}
              </ul>
            </CardRow>
          )}
        </div>
      )}
      {hasBrief && (
        <div className="space-y-3 border-t border-line pt-3">
          {/* R93: what must already exist, and which teammate builds it — do your
              own part first, test when theirs is there. */}
          {task.prerequisites && task.prerequisites.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <Users className="h-3.5 w-3.5" /> Needs from a teammate
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-body">
                {task.prerequisites.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {/* R92: read the docs first, and know what to look for in them. */}
          {task.docs && task.docs.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <BookOpen className="h-3.5 w-3.5" /> Read the docs first
              </div>
              <ul className="mt-1 space-y-1 text-sm text-body">
                {task.docs.map((d) => (
                  <li key={d.url}>
                    <a href={d.url} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
                      {d.title} ↗
                    </a>
                    <span className="text-muted"> — look for: {d.lookFor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {task.freeTier && (
            <p className="flex items-start gap-1.5 text-sm text-body">
              <Coins className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
              <span>{task.freeTier}</span>
            </p>
          )}
          {task.tools && task.tools.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-semibold text-muted">
                <Wrench className="h-3.5 w-3.5" /> Tools
              </span>
              {task.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded depth-edge bg-panel-2 px-1.5 py-0.5 font-mono text-2xs text-ink"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
          {task.learn && task.learn.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                <GraduationCap className="h-3.5 w-3.5" /> What you&apos;ll learn
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-body">
                {task.learn.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}
          {task.frameworks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 text-xs font-semibold text-muted">
                <Tag className="h-3.5 w-3.5" /> Frameworks
              </span>
              {task.frameworks.map((fw) => (
                <span
                  key={fw}
                  className={`rounded-full px-2 py-0.5 text-2xs font-medium ${getFrameworkColor(fw)}`}
                >
                  {getFrameworkLabel(fw)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

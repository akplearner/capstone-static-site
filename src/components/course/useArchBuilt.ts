'use client';

import { useCourseDocument } from '@/lib/useCourse';
import { archOf } from '@/lib/content/read';
import { archBuiltMap } from '@/lib/archBuilt';
import { docsRepo, progressRepo } from '@/lib/data';
import { isDeliverableFiled } from '@/lib/deliverableChain';
import { teamStepCompletions, teamTaskPercent } from '@/lib/teamProgress';
import { useClientStore } from '@/lib/useClientStore';
import type { Course, Member } from '@/lib/types';

/**
 * R151 — the live "how much of the picture is built" map, team-wide, for the learner surfaces.
 *
 * A part lights up when ANY teammate finishes the work that builds it, and a record pill lights when
 * the form is filed. Rebuilt from the team's completion and the team's filed forms on every store
 * notification, so one teammate's tick lights the part on everyone's screen. Returns `undefined` when
 * there is no member yet or the course draws no `ArchPicture`, so the diagram falls back to its
 * calendar-only self.
 */
export function useArchBuilt(course: Course, member: Member | null): Record<string, number> | undefined {
  const arch = archOf(useCourseDocument())?.ARCH;
  return useClientStore<Record<string, number> | undefined>(
    () => {
      if (!member || !arch) return undefined;
      const done = new Set(teamStepCompletions(progressRepo, course, member.teamId).keys());
      const taskPercent: Record<string, number> = {};
      for (const t of course.tasks) taskPercent[t.id] = teamTaskPercent(t, done);
      const saved = docsRepo.get(course.id, member.teamId) ?? {};
      const filed = new Set(Object.keys(saved).filter((id) => isDeliverableFiled(saved[id])));
      return archBuiltMap(arch.nodes, done, taskPercent, filed);
    },
    undefined,
  );
}

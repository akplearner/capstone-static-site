'use client';

import { useCourseDocument } from '@/lib/useCourse';
import { archOf, networkOf } from '@/lib/content/read';
import { archBuiltMap, builtMapFrom } from '@/lib/archBuilt';
import { docsRepo, progressRepo } from '@/lib/data';
import { isDeliverableFiled } from '@/lib/deliverableChain';
import { teamStepCompletions, teamTaskPercent } from '@/lib/teamProgress';
import { netBuiltEntries } from '@/lib/docs/labNetwork';
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
  const doc = useCourseDocument();
  const arch = archOf(doc)?.ARCH;
  const net = networkOf(doc);
  return useClientStore<Record<string, number> | undefined>(
    () => {
      if (!member || (!arch && !net.hosts.length)) return undefined;
      const done = new Set(teamStepCompletions(progressRepo, course, member.teamId).keys());
      const taskPercent: Record<string, number> = {};
      for (const t of course.tasks) taskPercent[t.id] = teamTaskPercent(t, done);
      const saved = docsRepo.get(course.id, member.teamId) ?? {};
      const filed = new Set(Object.keys(saved).filter((id) => isDeliverableFiled(saved[id])));
      // R151 architecture nodes and R152 network controls/attacks share one map; their ids are
      // namespaced (`ctl:`/`atk:`) so neither overwrites the other.
      return {
        ...(arch ? archBuiltMap(arch.nodes, done, taskPercent, filed) : {}),
        ...(net.hosts.length ? builtMapFrom(netBuiltEntries(net), done, taskPercent) : {}),
      };
    },
    undefined,
  );
}

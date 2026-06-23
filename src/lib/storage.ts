'use client';

import { Member, Role, TaskCompletion, GateStatus, Gate, Task } from './types';
import { useEffect, useState } from 'react';
import { getTasksByRole } from './content-data';
import { calculateProgress } from './utils';

const STORAGE_PREFIX = 'capstone_';

// Context: Current user enrollment
export function getStudentContext(): Member | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(`${STORAGE_PREFIX}context`);
  return data ? JSON.parse(data) : null;
}

export function setStudentContext(context: Member) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_PREFIX}context`, JSON.stringify(context));
}

// Task Completions
export function getTaskCompletion(
  memberId: string,
  taskId: string,
  stepId: string
): TaskCompletion | null {
  if (typeof window === 'undefined') return null;
  const key = `${STORAGE_PREFIX}completion_${memberId}_${taskId}_${stepId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

export function setTaskCompletion(
  memberId: string,
  taskId: string,
  stepId: string,
  completion: TaskCompletion
) {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}completion_${memberId}_${taskId}_${stepId}`;
  localStorage.setItem(key, JSON.stringify(completion));
}

export function removeTaskCompletion(
  memberId: string,
  taskId: string,
  stepId: string
) {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}completion_${memberId}_${taskId}_${stepId}`;
  localStorage.removeItem(key);
}

function isStepComplete(memberId: string, taskId: string, stepId: string): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(`${STORAGE_PREFIX}completion_${memberId}_${taskId}_${stepId}`);
}

// IDs of completed steps for a single task.
export function getCompletedStepIds(memberId: string, task: Task): string[] {
  if (typeof window === 'undefined') return [];
  return task.steps
    .filter((s) => isStepComplete(memberId, task.id, s.id))
    .map((s) => s.id);
}

// Per-task completion percentage (0-100).
export function getTaskCompletionPercent(memberId: string, task: Task): number {
  if (task.steps.length === 0) return 0;
  return calculateProgress(getCompletedStepIds(memberId, task).length, task.steps.length);
}

// Week completion percentage across all of the member's tasks for that week.
export function getWeekCompletion(memberId: string, role: Role, week: number): number {
  if (typeof window === 'undefined') return 0;
  const tasks = getTasksByRole(role, week);
  const total = tasks.reduce((sum, t) => sum + t.steps.length, 0);
  if (total === 0) return 0;
  const completed = tasks.reduce(
    (sum, t) => sum + getCompletedStepIds(memberId, t).length,
    0
  );
  return calculateProgress(completed, total);
}

// Gate Status
export function getGateStatus(teamId: string, gateId: number): GateStatus {
  if (typeof window === 'undefined') return 'locked';
  const key = `${STORAGE_PREFIX}gate_${teamId}_${gateId}`;
  return (localStorage.getItem(key) as GateStatus) || 'locked';
}

export function setGateStatus(teamId: string, gateId: number, status: GateStatus) {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_PREFIX}gate_${teamId}_${gateId}`;
  localStorage.setItem(key, status);
}

/**
 * Derive a gate's status from the current member's progress (pure — safe to call
 * inside render/loops). In this single-user localStorage build we evaluate the
 * member's own required task for the gate; cross-role required tasks are noted as
 * team-dependent in the UI.
 *
 * - 'passed'  : the member's required task for this gate is 100% complete
 * - 'ready'   : the member's required task is started but not finished
 * - 'locked'  : not started
 */
export function deriveGateStatus(memberId: string, role: Role, gate: Gate): GateStatus {
  if (typeof window === 'undefined') return 'locked';
  const myTasks = getTasksByRole(role, gate.week).filter((t) =>
    gate.requiredTasks.includes(t.id)
  );
  if (myTasks.length === 0) return 'locked';

  const totalSteps = myTasks.reduce((sum, t) => sum + t.steps.length, 0);
  const completedSteps = myTasks.reduce(
    (sum, t) => sum + getCompletedStepIds(memberId, t).length,
    0
  );

  if (totalSteps > 0 && completedSteps === totalSteps) return 'passed';
  if (completedSteps > 0) return 'ready';
  return 'locked';
}

// Collaboration Notes (placeholder for Phase 2)
export function getCollaborationNotes(role: Role): string[] {
  if (typeof window === 'undefined') return [];
  const key = `${STORAGE_PREFIX}collab_${role}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// React Hooks

export function useStudentContext() {
  const [context, setContext] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctx = getStudentContext();
    setContext(ctx);
    setLoading(false);
  }, []);

  return { context, loading, setContext: (ctx: Member) => {
    setStudentContext(ctx);
    setContext(ctx);
  }};
}

export function useTaskCompletion(memberId: string, taskId: string, stepId: string) {
  const [completion, setCompletion] = useState<TaskCompletion | null>(null);

  useEffect(() => {
    if (!memberId) return;
    const comp = getTaskCompletion(memberId, taskId, stepId);
    setCompletion(comp);
  }, [memberId, taskId, stepId]);

  const markComplete = (completion: TaskCompletion) => {
    setTaskCompletion(memberId, taskId, stepId, completion);
    setCompletion(completion);
  };

  const markIncomplete = () => {
    removeTaskCompletion(memberId, taskId, stepId);
    setCompletion(null);
  };

  return {
    isComplete: !!completion,
    completedAt: completion?.completedAt,
    markComplete,
    markIncomplete
  };
}

export function useGateStatus(teamId: string, gateId: number) {
  const [status, setStatus] = useState<GateStatus>('locked');

  useEffect(() => {
    if (!teamId) return;
    const s = getGateStatus(teamId, gateId);
    setStatus(s);
  }, [teamId, gateId]);

  const updateStatus = (newStatus: GateStatus) => {
    setGateStatus(teamId, gateId, newStatus);
    setStatus(newStatus);
  };

  return { status, updateStatus };
}

export function useWeekCompletion(memberId: string, role: Role, week: number) {
  const [completionPercent, setCompletionPercent] = useState(0);

  useEffect(() => {
    if (!memberId) return;
    const percent = getWeekCompletion(memberId, role, week);
    setCompletionPercent(percent);
  }, [memberId, role, week]);

  return { completionPercent };
}

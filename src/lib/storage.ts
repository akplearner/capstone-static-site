'use client';

import { Member, Role, TaskCompletion, GateStatus } from './types';
import { useEffect, useState } from 'react';

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

export function getWeekCompletion(memberId: string, week: number): number {
  if (typeof window === 'undefined') return 0;
  let completed = 0;
  let total = 0;

  // This would iterate through all tasks for the week
  // For now, we'll count from localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.includes(`${STORAGE_PREFIX}completion_${memberId}`) && key.includes(`_${week}_`)) {
      completed++;
    }
  }

  // In real implementation, this would be calculated against the task data
  return completed;
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

  return {
    isComplete: !!completion,
    completedAt: completion?.completedAt,
    markComplete
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

export function useWeekCompletion(memberId: string, week: number) {
  const [completionPercent, setCompletionPercent] = useState(0);

  useEffect(() => {
    if (!memberId) return;
    const percent = getWeekCompletion(memberId, week);
    setCompletionPercent(percent);
  }, [memberId, week]);

  return { completionPercent };
}

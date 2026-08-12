import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageEvidenceRepo, localStoragePathRepo, stepEvidenceKey } from './localStorageEvidenceRepo';
import type { EvidenceArtifact, StepEvidence } from './types';

// The ledger is what separates "ticked a box" from "pasted matching output and
// hashed it", so its round-trip has to be exact — a dropped field here silently
// downgrades a verified step to self-attested on the next page load.

const MEMBER = 'member-1';

function step(overrides: Partial<StepEvidence> = {}): StepEvidence {
  return {
    courseId: 'cysa-plus',
    taskId: 'cb-w1',
    stepId: 'cb-w1-s1',
    verified: true,
    method: 'verified-output',
    matchedTokens: 3,
    totalTokens: 3,
    outputSha256: 'a'.repeat(64),
    attempts: 2,
    firstAttemptAt: 1_700_000_000_000,
    verifiedAt: 1_700_000_060_000,
    ...overrides,
  };
}

function artifact(overrides: Partial<EvidenceArtifact> = {}): EvidenceArtifact {
  return {
    courseId: 'cysa-plus',
    sha256: 'b'.repeat(64),
    filename: '20260812_Team01_Wireshark_Capture.pcap',
    sizeBytes: 4096,
    week: 2,
    nameOk: true,
    hashedAt: 1_700_000_000_000,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('evidence ledger — step records', () => {
  it('round-trips every field', () => {
    const s = step();
    localStorageEvidenceRepo.saveStep(MEMBER, s);
    const all = localStorageEvidenceRepo.getSteps('cysa-plus', MEMBER);
    expect(all[stepEvidenceKey('cb-w1', 'cb-w1-s1')]).toEqual(s);
  });

  it('returns an empty map for a course with no records', () => {
    expect(localStorageEvidenceRepo.getSteps('security-plus', MEMBER)).toEqual({});
  });

  it('keeps records for different steps side by side', () => {
    localStorageEvidenceRepo.saveStep(MEMBER, step());
    localStorageEvidenceRepo.saveStep(MEMBER, step({ stepId: 'cb-w1-s2', method: 'self-attested', verified: false }));
    const all = localStorageEvidenceRepo.getSteps('cysa-plus', MEMBER);
    expect(Object.keys(all)).toHaveLength(2);
    expect(all[stepEvidenceKey('cb-w1', 'cb-w1-s2')].method).toBe('self-attested');
  });

  it('overwrites in place when a step is re-verified, preserving the newer verdict', () => {
    localStorageEvidenceRepo.saveStep(MEMBER, step({ verified: false, method: 'self-attested', attempts: 1 }));
    localStorageEvidenceRepo.saveStep(MEMBER, step({ verified: true, method: 'verified-output', attempts: 4 }));
    const all = localStorageEvidenceRepo.getSteps('cysa-plus', MEMBER);
    expect(Object.keys(all)).toHaveLength(1);
    expect(all[stepEvidenceKey('cb-w1', 'cb-w1-s1')]).toMatchObject({
      verified: true,
      method: 'verified-output',
      attempts: 4,
    });
  });

  it('scopes records per course and per member', () => {
    localStorageEvidenceRepo.saveStep(MEMBER, step());
    localStorageEvidenceRepo.saveStep(MEMBER, step({ courseId: 'security-plus' }));
    localStorageEvidenceRepo.saveStep('member-2', step({ stepId: 'other' }));
    expect(Object.keys(localStorageEvidenceRepo.getSteps('cysa-plus', MEMBER))).toHaveLength(1);
    expect(Object.keys(localStorageEvidenceRepo.getSteps('security-plus', MEMBER))).toHaveLength(1);
    expect(Object.keys(localStorageEvidenceRepo.getSteps('cysa-plus', 'member-2'))).toHaveLength(1);
  });
});

describe('evidence ledger — artifacts', () => {
  it('round-trips an artifact', () => {
    const a = artifact();
    localStorageEvidenceRepo.saveArtifact(MEMBER, a);
    expect(localStorageEvidenceRepo.getArtifacts('cysa-plus', MEMBER)).toEqual([a]);
  });

  it('re-hashing the same file updates in place rather than double-counting', () => {
    localStorageEvidenceRepo.saveArtifact(MEMBER, artifact({ week: 1 }));
    localStorageEvidenceRepo.saveArtifact(MEMBER, artifact({ week: 3 }));
    const all = localStorageEvidenceRepo.getArtifacts('cysa-plus', MEMBER);
    expect(all).toHaveLength(1);
    expect(all[0].week).toBe(3);
  });

  it('keeps distinct hashes as distinct artifacts', () => {
    localStorageEvidenceRepo.saveArtifact(MEMBER, artifact());
    localStorageEvidenceRepo.saveArtifact(MEMBER, artifact({ sha256: 'c'.repeat(64) }));
    expect(localStorageEvidenceRepo.getArtifacts('cysa-plus', MEMBER)).toHaveLength(2);
  });

  it('records a non-conforming filename without rejecting the artifact', () => {
    localStorageEvidenceRepo.saveArtifact(MEMBER, artifact({ filename: 'screenshot.png', nameOk: false }));
    const [a] = localStorageEvidenceRepo.getArtifacts('cysa-plus', MEMBER);
    expect(a.nameOk).toBe(false);
    expect(a.filename).toBe('screenshot.png');
  });
});

describe('career path', () => {
  it('is null until chosen, then round-trips', () => {
    expect(localStoragePathRepo.get(MEMBER)).toBeNull();
    localStoragePathRepo.save(MEMBER, 'blue-team');
    expect(localStoragePathRepo.get(MEMBER)?.pathId).toBe('blue-team');
  });

  it('replaces the previous choice rather than accumulating', () => {
    localStoragePathRepo.save(MEMBER, 'blue-team');
    localStoragePathRepo.save(MEMBER, 'cloud-security');
    expect(localStoragePathRepo.get(MEMBER)?.pathId).toBe('cloud-security');
  });

  it('clears', () => {
    localStoragePathRepo.save(MEMBER, 'blue-team');
    localStoragePathRepo.clear(MEMBER);
    expect(localStoragePathRepo.get(MEMBER)).toBeNull();
  });
});

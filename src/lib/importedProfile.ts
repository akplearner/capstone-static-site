import { KEYS } from './data/keys';
import { safeSetItem } from './data/safeStorage';
import { notifyStore } from './useClientStore';
import { validate, type JsonSchema } from './schema/validate';
import schema from '../../content/schemas/environment-profile.schema.json';
import type { EnvironmentProfile } from './docs/environmentProfile';

/**
 * R108 — an environment profile a reader imported on this device, kept
 * beside the UI preferences (R100): never synced, never sent anywhere. A
 * company publishes a profile as a file; this is how one gets read.
 */
export function readProfileFile(text: string): { profile: EnvironmentProfile } | { errors: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { errors: ['#: not JSON'] };
  }
  const errors = validate(parsed, schema as JsonSchema);
  return errors.length ? { errors } : { profile: parsed as EnvironmentProfile };
}

export function getImportedProfile(): EnvironmentProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.importedProfile);
    if (!raw) return null;
    const read = readProfileFile(raw);
    return 'profile' in read ? read.profile : null;
  } catch {
    return null;
  }
}

export function setImportedProfile(profile: EnvironmentProfile | null): void {
  if (typeof window === 'undefined') return;
  if (profile) safeSetItem(KEYS.importedProfile, JSON.stringify(profile));
  else localStorage.removeItem(KEYS.importedProfile);
  notifyStore();
}

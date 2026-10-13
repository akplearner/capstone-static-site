import sampleMssp from '../../../content/profiles/sample-mssp.json';
import type { EnvironmentProfile } from '@/lib/docs/environmentProfile';

/**
 * R108 — the published environment profiles, read back from
 * `content/profiles/` the way the course documents are: the JSON is what a
 * company would publish, so the page reads the file, never the builder.
 */
export function sampleProfiles(): EnvironmentProfile[] {
  return [sampleMssp as EnvironmentProfile];
}

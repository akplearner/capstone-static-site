/**
 * The reference primitive behind every content registry in this folder.
 *
 * The problem it solves: the same doc link, tool, config snippet or machine name
 * was authored independently in several steps, so fixing one (a dead URL, a
 * renamed module, "nmap" vs "Nmap") left the others stale. A registry gives each
 * one canonical definition; a `Ref` names it from the content.
 *
 * The shape is deliberately Terraform-ish — a module plus per-call variables:
 *
 *   files: [ref('wazuh-fim'), { ref: 'sysmon', purpose: 'download it here first' }]
 *
 * A bare string is "use the entry as authored". The object form overrides just
 * the fields that differ at this one call site, which is what keeps a shared
 * definition usable in a place that needs slightly different wording.
 *
 * Unlike a JSON/YAML content model, ids are checked by the compiler where they
 * are literal, and by `resolve()` (which throws) everywhere else — and the
 * content-integrity suite walks every ref so a typo fails the build, not the page.
 */

/** A registry entry named by id, optionally with per-call-site overrides. */
export type Ref<T> = string | ({ ref: string } & Partial<T>);

/** A value that may be authored inline or referenced from a registry. */
export type Refable<T> = T | Ref<T>;

function isRef<T>(v: Refable<T>): v is Ref<T> {
  return typeof v === 'string' || (typeof v === 'object' && v !== null && 'ref' in v);
}

/**
 * Resolve one entry. Throws on an unknown id rather than rendering a blank —
 * a missing doc link that fails silently is exactly the bug the registry exists
 * to prevent.
 */
export function resolve<T extends object>(registry: Record<string, T>, value: Refable<T>): T {
  if (!isRef(value)) return value;
  if (typeof value === 'string') {
    const hit = registry[value];
    if (!hit) throw new Error(`Unknown registry id: "${value}"`);
    return hit;
  }
  const { ref, ...overrides } = value;
  const hit = registry[ref];
  if (!hit) throw new Error(`Unknown registry id: "${ref}"`);
  return { ...hit, ...overrides } as T;
}


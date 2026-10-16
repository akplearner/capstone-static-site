// contentVersion.ts — a course's content version, "{docVersion}.{revision}" (R120).
//
// The document version is the course document's own: a built-in course's from code,
// an edited copy's counted up by the database on every save (R122). The revision is
// the fix ledger's counter, +1 for every content fix, revert or fold (R121). A report
// stamps the version the student was looking at, a fix carries the revision it made,
// and every export carries both, so "what did they see" always has an answer.
// Pure: no clock, no store.

/** "1.7": document version 1, revision 7. A missing or invalid part reads as 1 and 0. */
export function contentVersion(docVersion?: number, revision = 0): string {
  const doc = Number.isInteger(docVersion) && (docVersion as number) > 0 ? (docVersion as number) : 1;
  const rev = Number.isInteger(revision) && revision > 0 ? revision : 0;
  return `${doc}.${rev}`;
}

/** The two parts of a stamped version, or null when it is not one ("" on a report filed before 0016). */
export function parseContentVersion(v: string | null | undefined): { doc: number; revision: number } | null {
  const m = /^(\d+)\.(\d+)$/.exec(v ?? '');
  return m ? { doc: Number(m[1]), revision: Number(m[2]) } : null;
}

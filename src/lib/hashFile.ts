/**
 * Hex SHA-256 of a file's bytes, computed in the browser (R113: one helper for
 * the evidence hasher, the week packager and the ledger's re-check). The file
 * never leaves the device; only the digest is kept (ADR-0004).
 */
export async function sha256Hex(data: Blob | ArrayBuffer): Promise<string> {
  const buf = typeof (data as Blob).arrayBuffer === 'function' ? await (data as Blob).arrayBuffer() : (data as ArrayBuffer);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

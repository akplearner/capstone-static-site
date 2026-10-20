/**
 * Hand the browser a file to save. Six call sites each built a Blob, an object
 * URL and a throwaway anchor; this is the one copy, and the only place
 * `URL.createObjectURL` is called for a download.
 */
function save(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(filename: string, text: string, type = 'text/plain;charset=utf-8'): void {
  if (typeof document === 'undefined') return;
  save(filename, new Blob([text], { type }));
}

/** R127: a file that is not text: the PDF exports. */
export function downloadBytes(filename: string, bytes: Uint8Array<ArrayBuffer>, type = 'application/pdf'): void {
  if (typeof document === 'undefined') return;
  save(filename, new Blob([bytes], { type }));
}

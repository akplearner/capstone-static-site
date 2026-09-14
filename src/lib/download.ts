/**
 * Hand the browser a file to save. Six call sites each built a Blob, an object
 * URL and a throwaway anchor; this is the one copy, and the only place
 * `URL.createObjectURL` is called for a download.
 */
export function downloadText(filename: string, text: string, type = 'text/plain;charset=utf-8'): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

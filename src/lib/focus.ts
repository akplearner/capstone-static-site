/** Move keyboard focus to an element by id without scrolling the page — the
 *  page has already positioned itself; this only tells a screen reader and the
 *  Tab order where the new content starts. */
export function focusById(id: string): void {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
}

'use client';

import { useState } from 'react';

/**
 * R105 — which role the role pictures are focused on.
 *
 * The viewer's own role starts in focus; clicking (or pressing Enter on)
 * another role moves the focus, clicking the focused role clears it so
 * everything is lit, and hovering previews a role without pinning it.
 * `touches(...ids)` is the one question a renderer asks: is this element
 * lit? The default is not re-synced when `defaultRole` changes; call sites
 * pass `key={member.role}` instead, which is the React way to say "a new
 * viewer, a new picture".
 */
export function useRoleFocus(defaultRole?: string) {
  const [pinned, setPinned] = useState<string | null>(defaultRole ?? null);
  const [hover, setHover] = useState<string | null>(null);
  const focus = hover ?? pinned;
  const toggle = (id: string) => setPinned((p) => (p === id ? null : id));
  const touches = (...ids: string[]) => focus === null || ids.includes(focus);
  return { focus, pinned, toggle, setHover, touches };
}

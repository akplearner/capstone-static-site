'use client';

import { PixelMiner } from './PixelMiner';

/**
 * The landing hero: the pixel miner working a glowing rock inside the mine.
 *
 * This is the product owner's own art direction — a canvas pixel-art scene they
 * prototyped (see PixelMiner for the port). It replaces the R30 vector scene;
 * the card chrome stays so the hero still sits in the landing layout unchanged.
 *
 * `theme="cycle"` advances to the next vendor's palette every time a rock
 * shatters and respawns, so the hero quietly showcases all seven vendors.
 * Clicking snaps the miner straight into his swing.
 *
 * Reduced motion is handled inside PixelMiner: it composes a single static
 * frame and never starts the animation loop.
 */
export function QuarryScene({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-[#0e1216] ${className ?? ''}`}
    >
      <PixelMiner theme="cycle" interactive />
    </div>
  );
}

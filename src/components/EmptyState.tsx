'use client';

import Link from 'next/link';
import { Button } from './ui/Button';
import { MinerMark, type MinerMood } from './quarry/items';

export function EmptyState({
  title,
  message,
  href,
  cta,
  miner,
}: {
  title: string;
  message: string;
  href?: string;
  cta?: string;
  /** Show the miner above the message. An empty screen is where the character
   *  earns its keep — it turns "you have nothing" into an invitation. */
  miner?: MinerMood;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      {miner && <MinerMark size={120} mood={miner} className="mx-auto" />}
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      <p className="text-muted">{message}</p>
      {href && cta && (
        <Link href={href}>
          <Button>{cta}</Button>
        </Link>
      )}
    </div>
  );
}

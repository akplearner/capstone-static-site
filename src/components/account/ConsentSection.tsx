'use client';

import { useState } from 'react';
import { Surface } from '@/components/ui/Surface';
import { toast } from '@/lib/toastBus';
import { CONSENTS, NO_TRAINING, useConsents, type ConsentId } from '@/lib/legal/consents';

/**
 * R110 — the consent grants on the account page: three switches, each off
 * until the member turns it on, each recorded as a new row (never an edit)
 * and each revocable here. Offline the device holds the answer.
 */
export function ConsentSection() {
  const { consents, loaded, set } = useConsents();
  const [busy, setBusy] = useState<ConsentId | null>(null);

  const toggle = async (id: ConsentId, next: boolean) => {
    setBusy(id);
    const ok = await set(id, next);
    setBusy(null);
    if (!ok) toast({ message: 'Couldn’t record the change — check your connection and try again.', variant: 'warning' });
  };

  return (
    <Surface as="section" aria-labelledby="account-consent" data-consent-section>
      <h2 id="account-consent" className="text-lg font-bold text-ink">Consent</h2>
      <p className="mt-1 text-sm text-muted">
        Every grant is off until you turn it on, and each can be turned off here again; revoking stops any
        future use. {NO_TRAINING}
      </p>
      <ul className="mt-4 divide-y divide-line">
        {CONSENTS.map((c) => (
          <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 py-3" data-consent-grant={c.id} data-granted={consents[c.id]}>
            <div className="min-w-0 max-w-xl">
              <div className="text-sm font-semibold text-ink">{c.title}</div>
              <p className="mt-0.5 text-xs text-body">{c.allows}</p>
              <p className="mt-0.5 text-xs text-muted">{c.neverAllows}</p>
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                role="switch"
                aria-checked={consents[c.id]}
                checked={consents[c.id]}
                disabled={!loaded || busy === c.id}
                onChange={(e) => void toggle(c.id, e.target.checked)}
              />
              {consents[c.id] ? 'On' : 'Off'}
            </label>
          </li>
        ))}
      </ul>
    </Surface>
  );
}

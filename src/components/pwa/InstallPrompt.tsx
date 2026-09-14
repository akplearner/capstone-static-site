'use client';

import { useSyncExternalStore } from 'react';
import { Download } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { INSTALL_EVENT } from '@/lib/pwa';

function subscribe(onChange: () => void) {
  window.addEventListener(INSTALL_EVENT, onChange);
  window.addEventListener('appinstalled', onChange);
  return () => {
    window.removeEventListener(INSTALL_EVENT, onChange);
    window.removeEventListener('appinstalled', onChange);
  };
}
const getInstallable = () => !!window.__quarryInstall;
const getServerInstallable = () => false;

/**
 * The dashboard's "install" card — rendered only once the browser has said
 * the app is installable (Chromium's `beforeinstallprompt`, captured by the
 * registrar). Browsers that never fire it (Safari, Firefox) never see the card;
 * they install from their own share menu.
 */
export function InstallPrompt() {
  const installable = useSyncExternalStore(subscribe, getInstallable, getServerInstallable);
  if (!installable) return null;
  const install = async () => {
    const ev = window.__quarryInstall;
    if (!ev) return;
    await ev.prompt();
    await ev.userChoice;
    window.__quarryInstall = null;
    window.dispatchEvent(new Event(INSTALL_EVENT));
  };
  return (
    <Surface variant="inset" className="flex flex-wrap items-center justify-between gap-3" data-install-prompt>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink">Install Capstone Quarry</div>
        <p className="text-sm text-muted">Opens in its own window and keeps the pages you have visited available offline in the lab.</p>
      </div>
      <Button size="sm" variant="secondary" onClick={install} className="flex items-center gap-1.5">
        <Download className="h-4 w-4" /> Install
      </Button>
    </Surface>
  );
}

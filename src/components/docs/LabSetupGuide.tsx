'use client';

import { CheckCircle2, Cpu, Network, Server } from 'lucide-react';
import { CommandBlock } from '@/components/TaskComponents';

// Self-study lab requirements + setup: what VMs to build, how to network them, and
// the DVWA lifecycle (run / start / stop / first-run). Static reference content.

const VMS: { name: string; role: string; specs: string; notes: string }[] = [
  { name: 'Kali Linux', role: 'Attacker (Red)', specs: '2 vCPU · 4 GB RAM · 30 GB', notes: 'Recon & exploitation toolbox.' },
  { name: 'Ubuntu Server 22.04', role: 'Target + DVWA (Blue)', specs: '2 vCPU · 2–4 GB RAM · 20 GB', notes: 'Runs SSH, the web app (DVWA via Docker).' },
  { name: 'Windows 10/11 (optional)', role: 'Target (Blue)', specs: '2 vCPU · 4 GB RAM · 40 GB', notes: 'RDP + Defender track; optional second host.' },
];

const HYPERVISORS = [
  'VirtualBox (free, Windows/Linux/Intel Mac)',
  'VMware Workstation / Fusion',
  'UTM or Parallels (Apple Silicon Macs)',
  'Proxmox / KVM (lab server)',
];

const PREFLIGHT = [
  'All VMs powered on and on the SAME isolated lab network/subnet',
  'Kali can ping the Ubuntu (and Windows) target',
  'DVWA login page loads at http://<UBUNTU_IP>/ (admin / password)',
  '“pre-hardening” snapshots taken of the target VMs',
  'Target IPs recorded in the Lab access panel; Rules of Engagement read',
];

export function LabSetupGuide() {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        You run a small isolated lab of 2–3 VMs. Build them once, put them on one private network, and
        record their IPs in the <span className="font-medium">Lab access</span> panel (Weekly Tasks).
      </p>

      {/* VMs */}
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Virtual machines
        </h3>
        <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-muted dark:border-gray-700">
                <th className="px-3 py-2">VM</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Suggested specs</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {VMS.map((vm) => (
                <tr key={vm.name} className="border-b border-gray-100 last:border-0 dark:border-gray-700/50">
                  <td className="px-3 py-2 font-medium text-ink">{vm.name}</td>
                  <td className="px-3 py-2 text-body">{vm.role}</td>
                  <td className="px-3 py-2 font-mono text-xs text-body">{vm.specs}</td>
                  <td className="px-3 py-2 text-muted">{vm.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">
          Hypervisor options: {HYPERVISORS.join(' · ')}.
        </p>
      </div>

      {/* Network */}
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Network className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Network
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm text-body">
          <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" /> Put every VM on ONE isolated network — VirtualBox <span className="font-mono text-xs">Host-Only</span> or <span className="font-mono text-xs">Internal</span>, VMware <span className="font-mono text-xs">Host-Only</span>. Avoid Bridged so the lab never touches your home/work LAN.</li>
          <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" /> Use one subnet, e.g. <span className="font-mono text-xs">10.10.10.0/24</span>, with static IPs (Kali .10, Ubuntu .5, Windows .6) — then record them in Lab access.</li>
          <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" /> Confirm reachability: from Kali, <span className="font-mono text-xs">ping &lt;UBUNTU_IP&gt;</span> must reply before Week 1.</li>
        </ul>
      </div>

      {/* DVWA lifecycle */}
      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Server className="h-4 w-4 text-blue-600 dark:text-blue-400" /> DVWA target (Docker) — quick reference
        </h3>
        <p className="mt-1 mb-2 text-sm text-muted">
          On the Ubuntu host. Run it once (named <span className="font-mono text-xs">dvwa</span>), then start/stop
          it as needed. First run: open <span className="font-mono text-xs">/setup.php</span> → “Create / Reset
          Database”, then set Security = Low at <span className="font-mono text-xs">/security.php</span>. Login{' '}
          <span className="font-mono text-xs">admin / password</span>.
        </p>
        <CommandBlock
          commands={[
            { cmd: 'sudo apt install -y docker.io && sudo systemctl enable --now docker', explain: 'Install Docker and start it (first time only).' },
            { cmd: 'sudo docker run -d --name dvwa --restart unless-stopped -p 80:80 vulnerables/web-dvwa', explain: 'Create + start the named DVWA container on port 80.' },
            { cmd: 'sudo docker start dvwa', explain: 'Start the existing container again (after a reboot/stop).' },
            { cmd: 'sudo docker stop dvwa', explain: 'Stop it when you are done.' },
            { cmd: 'sudo docker ps', explain: 'List running containers — confirm dvwa is up.' },
            { cmd: 'sudo docker logs dvwa', explain: 'Check logs if it exited or the page will not load.' },
          ]}
        />
      </div>

      {/* Pre-flight */}
      <div>
        <h3 className="text-sm font-semibold text-ink">Pre-flight checklist</h3>
        <ul className="mt-2 space-y-1.5">
          {PREFLIGHT.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-body">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {p}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

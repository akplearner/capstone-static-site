import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument } from '@/lib/content/docs';
import { LabNetworkReference } from './LabNetworkReference';

const nav = vi.hoisted(() => ({ week: null as string | null }));
vi.mock('next/navigation', () => ({
  useParams: () => ({ courseId: 'security-plus' }),
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: (k: string) => (k === 'week' ? nav.week : null) }),
}));

/**
 * R156 — the Network tab's body is the whole LAN: every component with its address, Docker and what it
 * publishes, every port with its reach, the tools per host, the attack catalogue and what each task of the
 * week does on the network. Everything is read from the course document; nothing here is typed.
 */
function mount(week: string | null = null) {
  nav.week = week;
  const doc = courseDocument('security-plus')!;
  return render(
    <CourseDocumentContext.Provider value={doc}>
      <LabNetworkReference course={doc.course} member={null} />
    </CourseDocumentContext.Provider>
  );
}

describe('LabNetworkReference', () => {
  it('draws the LAN: hypervisor, gateway adapter, the three VMs with addresses, and Docker nested in the Ubuntu host', () => {
    const { container } = mount();
    expect(container.querySelector('[data-lan-adapter]')!.textContent).toContain('10.10.10.1');
    for (const id of ['kali', 'ubuntu', 'windows']) expect(container.querySelector(`[data-lan-host="${id}"]`), id).not.toBeNull();
    const ubuntu = container.querySelector('[data-lan-host="ubuntu"]')!;
    expect(ubuntu.textContent).toContain('10.10.10.5');
    expect(ubuntu.textContent).toContain('Ubuntu Server 22.04');
    const docker = ubuntu.querySelector('[data-lan-docker="ubuntu"]')!;
    expect(docker.textContent).toContain('docker0');
    expect(docker.textContent).toContain('172.17.0.0/16');
    const dvwa = docker.querySelector('[data-lan-container="dvwa"]')!;
    expect(dvwa.textContent).toContain('vulnerables/web-dvwa');
    expect(dvwa.textContent).toContain('172.17.0.2');
    expect(dvwa.querySelector('[data-lan-portmap]')!.textContent).toMatch(/8080 → dvwa:80\/tcp/);
  });

  it('marks the database and the resolver stub as internal, and never as LAN-reachable ports', () => {
    const { container } = mount();
    const ubuntu = container.querySelector('[data-lan-host="ubuntu"]')!;
    expect(ubuntu.querySelector('[data-lan-port="3306"]')!.hasAttribute('data-lan-internal')).toBe(true);
    expect(ubuntu.querySelector('[data-lan-port="53"]')!.hasAttribute('data-lan-internal')).toBe(true);
    expect(ubuntu.querySelector('[data-lan-port="8080"]')!.hasAttribute('data-lan-internal')).toBe(false);
    const row = container.querySelector('[data-lan-port-row="ubuntu:8080"]')!;
    expect(row.textContent).toContain('LAN');
    expect(row.textContent).toContain('dvwa container:80');
    expect(container.querySelector('[data-lan-port-row="ubuntu:3306"]')!.textContent).toContain('internal');
  });

  it('lists every component with an address and the tools per host with the task that uses each', () => {
    const { container } = mount();
    const comps = [...container.querySelectorAll('[data-lan-component]')].map((e) => e.getAttribute('data-lan-component'));
    expect(comps).toEqual(expect.arrayContaining(['hypervisor', 'adapter', 'kali', 'ubuntu', 'dvwa', 'windows']));
    const nmap = container.querySelector('[data-lan-tool="nmap"]')!;
    expect(nmap.textContent).toContain('Kali attacker');
    expect(nmap.textContent).toContain('Network Scan - All Ports');
    expect(container.querySelector('[data-lan-tool="sqlmap"]')!.textContent).toContain('Authorized Attacks');
  });

  it('shows the attack catalogue with where each type is used in this lab', () => {
    const { container } = mount();
    const inj = container.querySelector('[data-lan-attack-kind="injection"]')!;
    expect(inj.textContent).toContain('Injection');
    expect(inj.querySelector('[data-lan-attack-uses]')!.textContent).toContain('W3 #1 → Ubuntu web server:8080');
    expect(container.querySelector('[data-lan-attack-kind="reconnaissance"] [data-lan-attack-uses]')!.textContent).toMatch(/W0 #1/);
  });

  it('places every task of the week on the network, and the week picker and ?week= choose the week', () => {
    const { container } = mount('3');
    expect(screen.getByRole('button', { name: 'W3' })).toHaveAttribute('aria-pressed', 'true');
    const red = container.querySelector('[data-lan-task="red-w3-attacks"]')!;
    expect(red.textContent).toContain('1. Injection');
    expect(red.textContent).toContain('at Kali attacker, Ubuntu web server');
    const blue = container.querySelector('[data-lan-task="blue-w3-detection"]')!;
    expect(blue.querySelectorAll('[data-lan-action="control"]').length).toBeGreaterThan(1);
    const grc = container.querySelector('[data-lan-task="grc-w3-custody"]')!;
    expect(grc.querySelector('[data-lan-action="evidence"]')).not.toBeNull();
    // Every Week-3 task of the course is on the page (the AI extension is off the network, and says so).
    const ai = container.querySelector('[data-lan-task="sec-w3-ai"]');
    expect(ai).not.toBeNull();
    expect(ai!.querySelector('[data-lan-task-off]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'W0' }));
    expect(container.querySelector('[data-lan-task="blue-w0-setup"]')!.textContent).toContain('8080 → 80');
    expect(container.querySelector('[data-net-panel="0"]')).not.toBeNull();
  });
});

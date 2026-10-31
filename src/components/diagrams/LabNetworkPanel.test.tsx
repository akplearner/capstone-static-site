import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument } from '@/lib/content/docs';
import { LabNetworkPanel } from './LabNetworkPanel';

vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'security-plus' }), useRouter: () => ({ push: vi.fn() }) }));

/**
 * R152 — the network view: host cards with ports, the Before|After toggle that flips the controls, and
 * the numbered attack step-through with the Blue response in its sentence.
 */
function mount(week: number, built?: Record<string, number>) {
  const doc = courseDocument('security-plus')!;
  return render(
    <CourseDocumentContext.Provider value={doc}>
      <LabNetworkPanel week={week} built={built} />
    </CourseDocumentContext.Provider>
  );
}

describe('LabNetworkPanel', () => {
  it('draws the three hosts and Ubuntu’s DVWA port, with an img that does not match /week N/', () => {
    const { container } = mount(2);
    for (const id of ['kali', 'ubuntu', 'windows']) expect(container.querySelector(`[data-net-host="${id}"]`), id).not.toBeNull();
    expect(container.querySelector('[data-net-service="8080"]')).not.toBeNull();
    const svg = container.querySelector('svg[role="img"]')!;
    expect(svg.getAttribute('aria-label')).not.toMatch(/week \d/);
  });

  it('Before|After flips a week-1 control: ufw is absent before, present after', () => {
    const { container } = mount(1);
    // default 'before' — the week-1 hardening has not been applied entering the week
    expect(container.querySelector('[data-net-control="ctl:ubuntu-ufw"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'after' }));
    expect(container.querySelector('[data-net-control="ctl:ubuntu-ufw"]')).not.toBeNull();
  });

  it('steps through the week-3 attacks, naming the kind, the path, the port and the Blue response', () => {
    mount(3);
    const sentence = () => document.querySelector('[data-net-step-sentence]')!.textContent!;
    expect(sentence()).toContain('1. Injection');
    expect(sentence()).toContain(':8080');
    expect(sentence()).toContain('Blue:');
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(sentence()).toContain('2. Brute force');
  });

  it('a reporting week with no attacks shows the phase line, no stepper', () => {
    const { container } = mount(4);
    expect(container.querySelector('[data-net-no-attacks]')).not.toBeNull();
    expect(container.querySelector('[data-net-stepper]')).toBeNull();
  });

  it('shows the current attack’s description and updates it on Next (R153)', () => {
    mount(3);
    const desc = () => document.querySelector('[data-net-attack-description]')!.textContent!;
    expect(desc().length).toBeGreaterThan(0);
    const first = desc();
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(desc()).not.toBe(first);
  });

  it('clicking a host reveals its description in the component details region (R153)', () => {
    const { container } = mount(2);
    expect(container.querySelector('[data-net-component-detail]')!.textContent).toMatch(/Select a host/);
    const ubuntuHeader = container.querySelector('[data-net-host="ubuntu"] [role="button"]')!;
    fireEvent.click(ubuntuHeader);
    expect(container.querySelector('[data-net-component-detail]')!.textContent).toMatch(/target web server/i);
  });

  it('clicking a control reveals its description (R153)', () => {
    const { container } = mount(2);
    fireEvent.click(container.querySelector('[data-net-control="ctl:ubuntu-ufw"]')!);
    expect(container.querySelector('[data-net-component-detail]')!.textContent).toMatch(/firewall/i);
  });

  it('the built map lights a control the team has finished', () => {
    const { container } = mount(1, { 'ctl:ubuntu-ufw': 1 });
    fireEvent.click(screen.getByRole('button', { name: 'after' }));
    expect(container.querySelector('[data-net-control="ctl:ubuntu-ufw"][data-net-built="true"]')).not.toBeNull();
  });
});

describe('LabNetworkPanel — R157 a derived network draws too', () => {
  it('Server+ shows its bridges as bands, its VMs as cards, the Proxmox host at the bottom, and no attack stepper', () => {
    const doc = courseDocument('server-plus')!;
    const { container } = render(
      <CourseDocumentContext.Provider value={doc}>
        <LabNetworkPanel week={3} />
      </CourseDocumentContext.Provider>
    );
    expect(container.querySelector('[data-net-segment="vmbr1"]')).not.toBeNull();
    expect(container.querySelector('[data-net-host="websrv"]')).not.toBeNull();
    expect(container.querySelector('[data-net-host="host"]')).not.toBeNull();
    expect(container.querySelector('svg[role="img"]')!.getAttribute('aria-label')).not.toMatch(/week \d/);
    expect(container.querySelector('[data-net-stepper]')).toBeNull();
    expect(container.querySelector('[data-net-no-attacks]')).not.toBeNull();
  });
});

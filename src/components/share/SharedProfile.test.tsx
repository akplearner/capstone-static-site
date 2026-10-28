import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { allText } from '@/test/pdfRead';

// R114: the public page reads the token from the fragment, shows the frozen
// copy under a banner that says what it is and is not, and treats unknown,
// revoked and expired alike.
const shared = vi.hoisted(() => ({ copy: null as null | Record<string, unknown>, asked: [] as string[] }));
// R127: the page's download is a PDF; what it hands the browser is read back below.
const saved = vi.hoisted(() => ({ files: [] as { name: string; bytes: Uint8Array; type?: string }[], text: [] as string[] }));
vi.mock('@/lib/download', () => ({
  downloadBytes: (name: string, bytes: Uint8Array, type?: string) => saved.files.push({ name, bytes, type }),
  downloadText: (name: string) => saved.text.push(name),
}));
vi.mock('@/lib/shares', async (orig) => {
  const real = await orig<typeof import('@/lib/shares')>();
  return {
    ...real,
    fetchShared: async (token: string) => {
      shared.asked.push(token);
      return shared.copy;
    },
  };
});

import { SharedProfile } from './SharedProfile';

const TOKEN = 'b'.repeat(43);
const profileCopy = {
  kind: 'profile',
  measuredAgainst: 'Sample MSSP',
  createdAt: '2026-10-14T10:00:00Z',
  expiresAt: '2026-11-13T10:00:00Z',
  snapshot: {
    schema: 'capstone-member-profile/3',
    signature: null,
    subject: { display: 'Grace Hopper' },
    summary: { verified: 4, verifiable: 9, receipted: 2, artifacts: 3, skillsVerified: [], skillsPractised: [] },
    courses: [],
  },
};

beforeEach(() => {
  shared.copy = null;
  shared.asked = [];
  saved.files.length = 0;
  saved.text.length = 0;
  window.location.hash = '';
});

describe('SharedProfile (R114)', () => {
  it('shows the frozen copy under the banner, with the figures it carries', async () => {
    window.location.hash = `#${TOKEN}`;
    shared.copy = profileCopy;
    const { container } = render(<SharedProfile />);
    await waitFor(() => expect(screen.getByText('Grace Hopper')).toBeInTheDocument());
    expect(shared.asked).toEqual([TOKEN]);
    const banner = container.querySelector('[data-share-banner]')!.textContent!;
    for (const phrase of ['frozen copy', 'unsigned', 'not proof of the machine', 'revoke', 'Sample MSSP']) expect(banner, phrase).toContain(phrase);
    expect(container.querySelector('[data-share-figures]')!.textContent).toContain('2 receipted');
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /JSON/ })).toBeNull();
  });

  it('downloads the copy as a PDF: the figures it carries, the courses it holds, and no claim about issues it does not hold', async () => {
    window.location.hash = `#${TOKEN}`;
    shared.copy = profileCopy;
    render(<SharedProfile />);
    await waitFor(() => expect(screen.getByText('Grace Hopper')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(saved.text).toEqual([]); // no JSON file
    expect(saved.files).toHaveLength(1);
    const [file] = saved.files;
    expect(file.name).toMatch(/^capstone-record_shared_\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(new TextDecoder().decode(file.bytes.slice(0, 8))).toBe('%PDF-1.4');
    const text = allText(file.bytes).replace(/\s+/g, ' ');
    expect(text).toContain('Grace Hopper');
    expect(text).toContain('of 9 checkable · 2 receipted');
    expect(text).toContain('a shared copy made 2026-10-14 of 0 courses');
    expect(text).toContain('It is unsigned');
    expect(text).not.toContain('ISSUES REPORTED');
  });

  it('renders the compact copy a link carries now (R124): reached rows by label, rows not reached left out of the lists, no counters needed', async () => {
    window.location.hash = `#${TOKEN}`;
    const empty = { evidence: [], documentation: [], collaboration: [], ability: [], tactics: [], practices: [], procedures: [], standards: [], tools: [] };
    shared.copy = {
      ...profileCopy,
      snapshot: {
        ...profileCopy.snapshot,
        summary: { verified: 4, verifiable: 4, artifacts: 1, skillsVerified: ['comp.recon.osint'], skillsPractised: ['comp.recon.osint', 'comp.recon.scan'], toolsUsed: [], sopsFollowed: [], standardsPractised: [], tacticsPractised: [], practicesPractised: [], domainsVerified: 1, domainsTotal: 2 },
        courses: [
          {
            courseId: 'security-plus',
            title: 'Security+ Capstone Lab',
            role: 'Red team',
            skills: {
              courseId: 'security-plus',
              role: 'red',
              denominator: 'own ticks · graded weeks · required steps',
              rows: {
                ...empty,
                skills: [
                  { dimension: 'skills', id: 'comp.recon.osint', label: 'Gather open-source intelligence on a target', level: 'verified', verifiedSteps: 4 },
                  { dimension: 'skills', id: 'comp.recon.scan', label: 'Scan a network for live hosts', level: 'not-started' },
                ],
                domains: [
                  { dimension: 'domains', id: 'd1', label: 'General security concepts', level: 'verified' },
                  { dimension: 'domains', id: 'd2', label: 'Threats and vulnerabilities', level: 'not-started' },
                ],
              },
              loaded: { team: false, own: true },
              draftedForms: [],
            },
            kpis: [],
          },
        ],
      },
    };
    const { container } = render(<SharedProfile />);
    await waitFor(() => expect(screen.getByText('Gather open-source intelligence on a target')).toBeInTheDocument());
    expect(container.querySelector('[data-skills-list="skills"]')!.textContent).not.toContain('Scan a network for live hosts');
    expect(container.querySelector('[data-skills-domains]')!.textContent).toContain('General security concepts');
    expect(container.querySelector('[data-skills-domains]')!.textContent, 'a domain not reached is still named').toContain('Threats and vulnerabilities');
  });

  it('a credential shows its achievement and alignment', async () => {
    window.location.hash = `#${TOKEN}`;
    shared.copy = {
      ...profileCopy,
      kind: 'credential',
      snapshot: { type: ['VerifiableCredential', 'OpenBadgeCredential'], credentialSubject: { achievement: { name: 'Capstone member profile', description: 'Unsigned.', alignment: [{ targetName: 'Network scanning', targetCode: 'comp.recon.scan' }] } } },
    };
    render(<SharedProfile />);
    await waitFor(() => expect(screen.getByText('Network scanning')).toBeInTheDocument());
    expect(screen.getByText('comp.recon.scan')).toBeInTheDocument();
    // R127: and downloads as a one-page PDF of the same alignment, not the envelope
    fireEvent.click(screen.getByRole('button', { name: 'Download PDF' }));
    expect(saved.text).toEqual([]);
    const [file] = saved.files;
    expect(file.name).toMatch(/^capstone-credential_\d{4}-\d{2}-\d{2}\.pdf$/);
    const text = allText(file.bytes).replace(/\s+/g, ' ');
    expect(text).toContain('Capstone member profile');
    expect(text).toContain('Unsigned.');
    expect(text).toContain('Network scanning (comp.recon.scan)');
  });

  it('an unknown, revoked or expired link, or none at all, reads the same', async () => {
    window.location.hash = `#${TOKEN}`;
    const { container, unmount } = render(<SharedProfile />);
    await waitFor(() => expect(container.querySelector('[data-share-missing]')).not.toBeNull());
    unmount();
    window.location.hash = '';
    const second = render(<SharedProfile />);
    expect(second.container.querySelector('[data-share-missing]')).not.toBeNull();
    expect(shared.asked, 'nothing asked without a token').toEqual([TOKEN]);
  });
});

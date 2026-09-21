import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ClayGloss, ClayWell, ClayBadgeShape } from './ClayEdge';


describe('ClayEdge — the gloss, and the rules it obeys', () => {
  it('is decoration, so no assistive technology and no cursor ever meets it', () => {
    // Three separate failures, and all three are silent: a screen reader
    // announcing a graphic with no name, a tab stop on a shine (SVG is focusable
    // in IE-descended behaviour and in some AT), and — the one users actually
    // hit — a click landing on the overlay instead of the button beneath it.
    for (const El of [ClayGloss, ClayWell, ClayBadgeShape]) {
      const { container } = render(<El />);
      const svg = container.querySelector('svg')!;
      expect(svg.getAttribute('aria-hidden'), El.name).toBe('true');
      expect(svg.getAttribute('focusable'), El.name).toBe('false');
      expect(svg.getAttribute('class'), El.name).toContain('pointer-events-none');
      expect(svg.getAttribute('class'), El.name).toContain('absolute');
      expect(svg.querySelector('title'), `${El.name} must have no accessible name`).toBeNull();
    }
  });

  it('gives every instance its own gradient id', () => {
    // The classic inline-SVG bug: two of these on one page with a hardcoded id
    // means the second one's `url(#gloss)` resolves to the FIRST one's gradient.
    // In a row of buttons they all silently inherit whichever rendered first.
    const { container } = render(
      <>
        <ClayGloss shape="pill" />
        <ClayGloss shape="card" />
        <ClayWell />
        <ClayBadgeShape />
      </>
    );
    const ids = [...container.querySelectorAll('linearGradient, filter')].map((n) => n.id);
    expect(ids.length).toBeGreaterThanOrEqual(5);
    expect(new Set(ids).size, 'a duplicate id means one gloss is painting another').toBe(ids.length);

    // …and each reference resolves to an id that exists in the same document.
    for (const n of container.querySelectorAll('[fill^="url("], [filter]')) {
      for (const attr of ['fill', 'filter']) {
        const v = n.getAttribute(attr);
        const m = v?.match(/^url\(#(.+)\)$/);
        if (m) expect(container.querySelector(`#${CSS.escape(m[1])}`), `${attr}=${v} dangles`).toBeTruthy();
      }
    }
  });

  it('paints from tokens, never a literal white — or dark mode gets a smear', () => {
    const { container } = render(
      <>
        <ClayGloss />
        <ClayWell />
        <ClayBadgeShape />
      </>
    );
    const stops = [...container.querySelectorAll('stop')].map((s) => s.getAttribute('stop-color') ?? '');
    expect(stops.length).toBeGreaterThan(5);
    for (const c of stops) {
      if (c === 'transparent') continue;
      expect(c, 'a fixed colour here cannot re-theme').toMatch(/^var\(--/);
    }
  });

  it('stretches to its control without bunching the highlight', () => {
    const { container } = render(<ClayGloss shape="pill" />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('preserveAspectRatio')).toBe('none');
    expect(svg.getAttribute('class')).toContain('h-full');
    expect(svg.getAttribute('class')).toContain('w-full');
  });

  it('cuts the sheen at a different height per shape — a sphere is not a cylinder', () => {
    const at = (shape: 'pill' | 'card' | 'disc') => {
      const { container } = render(<ClayGloss shape={shape} />);
      return [...container.querySelectorAll('stop')].map((s) => s.getAttribute('offset'));
    };
    expect(at('pill')).not.toEqual(at('disc'));
    expect(at('card')).not.toEqual(at('pill'));
    // The card's corner radius is the small clay radius, not a pill's.
    const { container } = render(<ClayGloss shape="card" />);
    expect(container.querySelector('rect')!.getAttribute('rx')).toBe('8');
    const pill = render(<ClayGloss shape="pill" />);
    expect(pill.container.querySelector('rect')!.getAttribute('rx')).toBe('50');
  });

  it('is the only depth piece allowed a filter, and uses it where a box-shadow is wrong', () => {
    // feDropShadow follows the alpha channel; box-shadow follows the border box.
    // On a circle that is the difference between a round shadow and a square one.
    for (const El of [ClayGloss, ClayWell]) {
      const { container } = render(<El />);
      expect(container.querySelector('filter'), `${El.name} should not pay for a filter`).toBeNull();
    }
    const { container } = render(<ClayBadgeShape />);
    const fe = container.querySelector('feDropShadow')!;
    expect(fe).toBeTruthy();
    expect(fe.getAttribute('flood-color')).toBe('var(--clay-cast-far)');
    // The shadow must be allowed outside the viewBox or it is clipped to a square,
    // which is the exact bug the filter was chosen to avoid.
    expect(container.querySelector('svg')!.getAttribute('class')).toContain('overflow-visible');
    expect(container.querySelector('filter')!.getAttribute('width')).toBe('180%');
  });

  it('adds no layout of its own — a consumer adds `relative` and nothing else', () => {
    const { container } = render(<ClayGloss className="rounded-full" />);
    const cls = container.querySelector('svg')!.getAttribute('class')!;
    expect(cls).toContain('inset-0');
    expect(cls).toContain('rounded-full');
    expect(cls, 'no margin, no padding, no sizing beyond the parent').not.toMatch(/\b[mp][xytrbl]?-\d/);
  });
});

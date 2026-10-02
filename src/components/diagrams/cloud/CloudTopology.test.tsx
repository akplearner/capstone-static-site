import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AZURE_TOPOLOGY } from '@/lib/cloud/azureTopology';
import { cloudWeekProcesses } from '@/lib/cloud/workflows';
import { CloudTopology } from './CloudTopology';

/**
 * R100 — the week's process has to land on someone in the picture. In global
 * week 1 the process names the team admin, whose own week is 2: they are
 * drawn anyway, at full strength, and the crop includes them.
 */
describe('CloudTopology — a person the process names is in the picture', () => {
  it('draws the process-named external in week 1, not faded, beside the crop and inside the viewBox', () => {
    const process = cloudWeekProcesses('azure')[1];
    const { container } = render(<CloudTopology topology={AZURE_TOPOLOGY} week={1} weekRange={[1, 4]} process={process} controls={false} title={null} />);
    const admin = container.querySelector('[data-node="admin"]');
    expect(admin).not.toBeNull();
    expect(admin).not.toHaveAttribute('data-later');
    expect(admin!.getAttribute('opacity')).toBe('1');
    const svg = container.querySelector('svg')!;
    const [x, y, w, h] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    // Drawn beside the crop, not at their authored place a canvas away.
    const label = admin!.querySelector('text')!;
    const ax = Number(label.getAttribute('x'));
    const ay = Number(label.getAttribute('y'));
    expect(ax).toBeGreaterThanOrEqual(x);
    expect(ax).toBeLessThanOrEqual(x + w);
    expect(ay).toBeGreaterThanOrEqual(y);
    expect(ay).toBeLessThanOrEqual(y + h);
    const node = AZURE_TOPOLOGY.nodes.find((n) => n.id === 'admin')!;
    expect(ay, 'the person moved to the crop').not.toBe(node.y);
    expect(h, 'the crop did not grow to reach their authored place').toBeLessThan(node.y + 48 - y);
    expect(container.querySelector(`[data-process="${process.title}"]`)).not.toBeNull();
  });

  it('without a process, the same person waits for their own week', () => {
    const { container } = render(<CloudTopology topology={AZURE_TOPOLOGY} week={1} weekRange={[1, 4]} controls={false} />);
    expect(container.querySelector('[data-node="admin"]')).toBeNull();
  });

  it('title={null} draws no frame heading; the SVG scales to its box', () => {
    const { container } = render(<CloudTopology topology={AZURE_TOPOLOGY} week={2} weekRange={[1, 4]} controls={false} title={null} />);
    expect(container.querySelector('h3')).toBeNull();
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    expect(svg.getAttribute('class')).toContain('min-w-0');
  });
});

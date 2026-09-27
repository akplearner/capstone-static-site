import type { KitSpec } from './kitSpec';
import { RACK_ELEVATION, RACK_LEGEND, SERVER_DIAGRAM_COPY } from '../docs/serverDiagrams';
import { COMPANY, DEVICES, LINKS, SITES, WAN, mgmtAddress } from '../ccnaTopology';
import { LAB_HOSTS, LAB_SUBNET, socTopology } from '../labTopology';

/**
 * The platform's diagram presets (R84): one ready-made picture per course,
 * built FROM the course's existing topology model, so the diagram beside a
 * form and the commands inside a task describe the same machines by the same
 * names. Nothing here is typed twice — a preset is a projection.
 *
 * `visualFor` (components/diagrams/kit) resolves a deliverable's `visual`
 * through `kitPreset`, so every form in every course gets a picture without a
 * seed edit; a seed that names `visual.preset` picks one of these explicitly.
 *
 * The CCNA preset is also where the cabling model finally reaches students:
 * `LINKS` has carried per-port, per-VLAN data since the model was written,
 * and nothing rendered it until this list.
 */

function serverRack(): KitSpec {
  return {
    kit: 'rack',
    title: SERVER_DIAGRAM_COPY.rackHeading,
    howToRead: SERVER_DIAGRAM_COPY.rackCaption,
    rack: {
      heading: SERVER_DIAGRAM_COPY.rackAspect,
      caption: SERVER_DIAGRAM_COPY.rackCaption,
      slots: RACK_ELEVATION,
    },
    legend: RACK_LEGEND.map((l) => ({ label: l.label, kind: l.kind })),
    footer: 'The same rack your Rack, Power & Asset Register describes — record what YOUR rack holds, this is the reference.',
  };
}

function linkWord(kind: string): string {
  return kind === 'etherchannel' ? 'EtherChannel' : kind;
}

function ccnaSites(): KitSpec {
  return {
    kit: 'topology',
    title: `${COMPANY.name} — two sites, as built`,
    howToRead:
      'Each column is a building. Devices read top of the network downwards; the cabling list underneath names both ports of every cable — the same ports your show commands must agree with.',
    zones: SITES.map((s) => ({ id: s.id, label: s.name, note: s.rooms })),
    nodes: DEVICES.map((d) => ({
      id: d.name,
      label: d.name,
      sub: d.runs,
      kind: d.class,
      zone: d.site,
      addr: mgmtAddress(d),
      optional: d.optional,
    })),
    links: [
      ...LINKS.map((l) => ({
        from: l.from.device,
        fromPort: l.from.port,
        to: l.to.device,
        toPort: l.to.port,
        kind: l.kind,
        label: l.vlans?.length ? `${linkWord(l.kind)} · VLANs ${l.vlans.join(', ')}` : linkWord(l.kind),
      })),
      {
        from: 'R1-HQ',
        fromPort: WAN.hq,
        to: 'R2-BR',
        toPort: WAN.branch,
        kind: 'wan' as const,
        label: `WAN ${WAN.prefix} · OSPF area ${WAN.ospfArea}`,
      },
    ],
    footer: 'Management addresses shown are VLAN 99 / 199. Your Equipment Register decides which of these your team actually racks.',
  };
}

function secPlusLab(): KitSpec {
  return {
    kit: 'topology',
    title: `The lab this document is about — ${LAB_SUBNET}`,
    howToRead:
      'Red drives the attacker, Blue defends the targets, and every address in your forms should be one of these.',
    zones: [
      { id: 'red', label: 'Red — attack', note: 'stays inside the signed scope' },
      { id: 'blue', label: 'Blue — defend', note: 'hardens, watches, responds' },
    ],
    nodes: LAB_HOSTS.map((h) => ({
      id: h.key,
      label: h.name,
      sub: [h.note, h.services.length ? h.services.join(' · ') : ''].filter(Boolean).join(' — '),
      kind: h.key === 'kali' ? ('workstation' as const) : ('server' as const),
      zone: h.owner,
      addr: h.ip,
      optional: h.optional,
    })),
    links: [
      { from: 'kali', to: 'ubuntu', kind: 'flow', label: 'recon → scan → exploit (in scope only)' },
      { from: 'kali', to: 'windows', kind: 'flow', label: 'RDP surface — optional target' },
    ],
    footer: 'If a value in your form is not on this picture or in your Scope & RoE, that is the first thing to fix.',
  };
}

function cysaFlow(): KitSpec | null {
  const soc = socTopology('cysa-plus');
  if (!soc) return null;
  return {
    kit: 'flow',
    title: 'Where your evidence comes from',
    howToRead:
      'Every alert in your forms travelled this path. Name the hop it was seen at — sensor, manager, or your own triage.',
    stages: [
      { id: 'attacker', label: soc.attacker.name, sub: soc.attacker.note, kind: 'workstation' },
      { id: 'target', label: soc.pod.ubuntu.name, sub: `${soc.pod.ubuntu.ip} · agents watch it`, kind: 'server' },
      { id: 'soc', label: soc.soc.name, sub: `${soc.soc.ip} · ${soc.soc.lines[1]}`, kind: 'sensor' },
      { id: 'analyst', label: soc.browser.name, sub: soc.browser.note, kind: 'browser' },
    ],
    footer: `One shared SOC, ${soc.teamCount} team pods on ${soc.subnet} — your team's N makes an address yours.`,
  };
}

function msspEngagement(): KitSpec {
  // The MSSP course has no machine lab of its own — the engagement IS the
  // topology: client environments feeding one managed SOC. Small and here
  // rather than in a model file because nothing else consumes it yet.
  return {
    kit: 'topology',
    title: 'The engagement — clients feeding one managed SOC',
    howToRead:
      'Left: the client environments your documents govern. Right: the MSSP side your team runs. Every control, SLA and report in your forms names one of these boxes.',
    zones: [
      { id: 'client', label: 'Client environments', note: 'what the contract covers' },
      { id: 'mssp', label: 'MSSP SOC — your team', note: 'what the contract promises' },
    ],
    nodes: [
      { id: 'client-net', label: 'Client A — corporate network', sub: 'endpoints · servers · identity', kind: 'workstation', zone: 'client' },
      { id: 'client-edge', label: 'Client edge', sub: 'firewall · log forwarder', kind: 'firewall', zone: 'client' },
      { id: 'siem', label: 'SIEM / log platform', sub: 'collection · detection rules', kind: 'sensor', zone: 'mssp' },
      { id: 'analysts', label: 'Analyst bench', sub: 'triage · escalation · reporting', kind: 'people', zone: 'mssp' },
    ],
    links: [
      { from: 'client-net', to: 'client-edge', kind: 'flow', label: 'telemetry' },
      { from: 'client-edge', to: 'siem', kind: 'flow', label: 'encrypted log stream — the boundary SOC 2 / ISO 27001 audit' },
      { from: 'siem', to: 'analysts', kind: 'flow', label: 'alerts → tickets → client reports' },
    ],
    footer: 'No lab VMs here on purpose: the deliverables govern process and evidence, and this is the process.',
  };
}

/** The named presets a seed's `visual.preset` may pick explicitly. */
const NAMED: Record<string, () => KitSpec | null> = {
  rack: serverRack,
  'ccna-sites': ccnaSites,
  lab: secPlusLab,
  'soc-flow': cysaFlow,
  engagement: msspEngagement,
};

const COURSE_PRESET: Record<string, () => KitSpec | null> = {
  'server-plus': serverRack,
  ccna: ccnaSites,
  'security-plus': secPlusLab,
  'cysa-plus': cysaFlow,
  mssp: msspEngagement,
};

/** The spec for a deliverable's visual: its named preset, else its course's. */
export function kitPreset(courseId: string | undefined, preset?: string): KitSpec | null {
  if (preset && NAMED[preset]) return NAMED[preset]();
  if (courseId && COURSE_PRESET[courseId]) return COURSE_PRESET[courseId]();
  return null;
}

/**
 * The MSSP course's picture, as DATA (R99).
 *
 * The MSSP course has no machine lab of its own — the ENGAGEMENT is the
 * topology: client environments feeding one managed SOC, with the scope, the
 * pentester and the auditor around it. It used to borrow the red/blue/grc
 * attack lab, which described nothing about an MSSP; and its forms drew a
 * small kit preset typed inside `kitPresets.ts`. Both now come from here:
 * `EngagementDiagram` draws `ENGAGEMENT`, the kit preset is a projection of
 * it, and `ENGAGEMENT_BUILD` says which part arrives in which week.
 *
 * Plain data, so the whole module ships in the course document (`content.mssp`).
 */
import type { KitNodeKind } from '../diagrams/kitSpec';
import type { BuildModel } from '../weekVisual';

export interface EngagementNode {
  id: string;
  label: string;
  sub: string;
  kind: KitNodeKind;
  /** Which side of the picture: the client's estate, or the MSSP's SOC. */
  zone: 'client' | 'mssp';
  /** Drawn outside both zones: the pentester, the auditor. */
  external?: boolean;
}

export const ENGAGEMENT = {
  copy: {
    title: 'The engagement — clients feeding one managed SOC',
    howToRead:
      'Left: the client environment your documents govern. Right: the MSSP side your team runs. Around them: the people who test and audit the arrangement. Every control, SLA and report in your forms names one of these boxes.',
    footer: 'No lab VMs here on purpose: the deliverables govern process and evidence, and this is the process.',
  },
  zones: [
    { id: 'client', label: 'Client environment', note: 'what the contract covers' },
    { id: 'mssp', label: 'MSSP SOC — your team', note: 'what the contract promises' },
  ],
  nodes: [
    { id: 'client-net', label: 'Client A — corporate network', sub: 'endpoints · servers · identity', kind: 'workstation', zone: 'client' },
    { id: 'client-edge', label: 'Client edge', sub: 'firewall · log forwarder', kind: 'firewall', zone: 'client' },
    { id: 'baseline', label: 'CIS baseline', sub: 'gap assessment, scored', kind: 'sensor', zone: 'client' },
    { id: 'controls', label: 'Controls', sub: 'hardening · MFA · logging', kind: 'server', zone: 'client' },
    { id: 'siem', label: 'SIEM / log platform', sub: 'collection · retention', kind: 'sensor', zone: 'mssp' },
    { id: 'detections', label: 'Detection rules', sub: 'tuned to the client', kind: 'sensor', zone: 'mssp' },
    { id: 'analysts', label: 'Analyst bench', sub: 'triage · escalation · reporting', kind: 'people', zone: 'mssp' },
    { id: 'tickets', label: 'Ticket queue', sub: 'SLA clock on every alert', kind: 'browser', zone: 'mssp' },
    { id: 'evidence', label: 'Evidence vault', sub: 'what the audit will ask for', kind: 'server', zone: 'mssp' },
    { id: 'scope', label: 'Signed scope', sub: 'RoE · SoA · the boundary', kind: 'people', zone: 'client', external: true },
    { id: 'pentester', label: 'Pentester', sub: 'tests what the controls claim', kind: 'people', zone: 'client', external: true },
    { id: 'auditor', label: 'Auditor', sub: 'SOC 2 Type I · ISO 27001 Stage 1', kind: 'people', zone: 'mssp', external: true },
  ] satisfies EngagementNode[],
  /** The standing data paths, drawn every week once both ends exist. */
  edges: [
    { from: 'client-net', to: 'client-edge', label: 'telemetry' },
    { from: 'client-edge', to: 'siem', label: 'encrypted log stream' },
    { from: 'siem', to: 'analysts', label: 'alerts → tickets → reports' },
  ],
};

export const ENGAGEMENT_BUILD: BuildModel = {
  arrives: {
    'client-net': 0, 'client-edge': 0, analysts: 0, scope: 0,
    pentester: 1, baseline: 1,
    siem: 2, controls: 2,
    detections: 3, tickets: 3,
    evidence: 4, auditor: 4,
  },
  processes: {
    0: { title: 'Onboarding & scoping', steps: [
      { from: 'analysts', to: 'scope', label: 'sign the scope and RoE' },
      { from: 'scope', to: 'client-net', label: 'what the contract covers' },
    ] },
    1: { title: 'Gap assessment', steps: [
      { from: 'pentester', to: 'client-edge', label: 'external attack surface' },
      { from: 'analysts', to: 'baseline', label: 'CIS gap scan, scored' },
      { from: 'analysts', to: 'scope', label: 'statement of applicability' },
    ] },
    2: { title: 'Control implementation', steps: [
      { from: 'controls', to: 'client-net', label: 'hardening · MFA · logging' },
      { from: 'client-edge', to: 'siem', label: 'encrypted log stream' },
    ] },
    3: { title: 'Validation & testing', steps: [
      { from: 'pentester', to: 'client-net', label: 'pentest' },
      { from: 'siem', to: 'tickets', label: 'alert → ticket, on the clock' },
      { from: 'analysts', to: 'pentester', label: 'fix and retest' },
    ] },
    4: { title: 'Audit readiness', steps: [
      { from: 'tickets', to: 'analysts', label: 'MTTD · MTTR' },
      { from: 'analysts', to: 'evidence', label: 'the evidence packet' },
      { from: 'evidence', to: 'auditor', label: 'Type I · Stage 1' },
    ] },
  },
  captions: {
    0: 'The engagement at signing: the client’s estate, the edge that will forward its logs, your analysts, and the signed scope.',
    1: 'New: the pentester and the CIS baseline. The gap assessment says what the client has and what it lacks.',
    2: 'New: the SIEM and the controls. The client’s logs reach your SOC; hardening, MFA and logging are in place.',
    3: 'New: detection rules and the ticket queue. The pentest proves the controls; every alert runs on an SLA clock.',
    4: 'New: the evidence vault and the auditor. MTTD and MTTR are measured and the audit packet is handed over.',
  },
};

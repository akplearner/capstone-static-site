/**
 * The CISSP capstone's picture, as DATA (R101).
 *
 * Ridgeline's migration: the office and field estate on the left, the cloud
 * account that becomes the Service Hub in the middle, the suppliers and
 * customers on the right. Each release documents, specifies, proves or tests
 * more of it; the week's process is that week's trigger, walked across the
 * same boxes. Plain data, so it ships in the course document (`content.hub`)
 * and `HubDiagram` draws it.
 */
import type { BuildModel } from '../weekVisual';
import type { HubNode, HubPicture, HubZone } from './hub';

export const HUB: HubPicture = {
  copy: {
    title: 'Ridgeline’s security program — the estate your eight sheets cover',
    howToRead:
      'Left: the office and field estate the company is leaving. Middle: the cloud account that becomes the Service Hub. Right: the suppliers and customers who rely on it. Every control statement and sheet names one of these boxes.',
    footer: 'Lab stand-in until the starter kit ships: containers on one Linux machine play the cloud account.',
  },
  view: { w: 960, h: 400 },
  zones: [
    { id: 'office', label: 'Office and field', note: 'being retired or connected', x: 20, y: 40, w: 220, h: 340, tone: 4 },
    { id: 'cloud', label: 'Cloud account — the Service Hub', note: 'what Ridgeline answers for', x: 260, y: 40, w: 460, h: 340, tone: 2 },
    { id: 'outside', label: 'Suppliers and customers', note: 'shared responsibility', x: 740, y: 40, w: 200, h: 340, tone: 1 },
  ] satisfies HubZone[],
  nodes: [
    { id: 'staff', label: 'Office staff', sub: 'policy · training', kind: 'people', zone: 'office', x: 130, y: 100 },
    { id: 'oldserver', label: 'Old scheduling server', sub: 'past end of support (S-10)', kind: 'data', zone: 'office', x: 130, y: 170 },
    { id: 'phones', label: 'Technicians’ phones', sub: 'remote access', kind: 'people', zone: 'office', x: 130, y: 240 },
    { id: 'sensors', label: 'Building sensors', sub: 'IoT readings', kind: 'network', zone: 'office', x: 130, y: 310 },
    { id: 'firewall', label: 'Zones and firewall', sub: 'default deny', kind: 'network', zone: 'cloud', x: 370, y: 100 },
    { id: 'idp', label: 'Identity provider', sub: 'Keycloak · MFA', kind: 'identity', zone: 'cloud', x: 610, y: 100 },
    { id: 'hub', label: 'Service Hub app', sub: 'web · API · agent', kind: 'app', zone: 'cloud', x: 370, y: 170 },
    { id: 'db', label: 'Database and documents', sub: 'customer data · keys', kind: 'data', zone: 'cloud', x: 610, y: 170 },
    { id: 'gateway', label: 'AI gateway', sub: 'sole path to the model', kind: 'control', zone: 'cloud', x: 370, y: 240 },
    { id: 'siem', label: 'Logs and SIEM', sub: '12 months · reviewed', kind: 'monitor', zone: 'cloud', x: 610, y: 240 },
    { id: 'pipeline', label: 'Pipeline gates', sub: 'review · scan · approve', kind: 'pipeline', zone: 'cloud', x: 370, y: 310 },
    { id: 'backup', label: 'Backup vault', sub: 'encrypted · offline copy', kind: 'data', zone: 'cloud', x: 610, y: 310 },
    { id: 'modelapi', label: 'Model provider API', sub: 'third-party LLM', kind: 'ai', zone: 'outside', x: 840, y: 100, external: true },
    { id: 'custidp', label: 'Customer identity', sub: 'SAML · OIDC', kind: 'identity', zone: 'outside', x: 840, y: 170, external: true },
    { id: 'customer', label: 'Largest customer', sub: '72-hour notice · SOC 2', kind: 'people', zone: 'outside', x: 840, y: 240, external: true },
    { id: 'federal', label: 'Federal boundary', sub: 'FCI now · CUI next year', kind: 'outside', zone: 'outside', x: 840, y: 310, external: true },
  ] satisfies HubNode[],
  edges: [
    { from: 'staff', to: 'oldserver', label: 'spreadsheets · scheduling' },
    { from: 'hub', to: 'db', label: 'customer data' },
    { from: 'hub', to: 'modelapi', label: 'AI calls' },
  ],
};

export const HUB_BUILD: BuildModel = {
  arrives: {
    staff: 0, oldserver: 0, hub: 0, db: 0, modelapi: 0, customer: 0,
    firewall: 1, idp: 1, phones: 1,
    sensors: 2, backup: 2,
    pipeline: 3, custidp: 3,
    gateway: 4, siem: 4,
    federal: 6,
  },
  processes: {
    0: { title: 'Where things stand', steps: [
      { from: 'staff', to: 'oldserver', label: 'spreadsheets and the scheduling app' },
      { from: 'hub', to: 'modelapi', label: 'AI at the center' },
    ] },
    1: { title: 'Release v1: one page per domain', steps: [
      { from: 'customer', to: 'staff', label: 'show us your security program' },
      { from: 'staff', to: 'hub', label: 'eight sheets, signed by the CEO' },
    ] },
    2: { title: 'Release v2: numbers, owners, time limits', steps: [
      { from: 'customer', to: 'staff', label: '“promptly” eleven times: give numbers' },
      { from: 'backup', to: 'db', label: 'recovery targets per process' },
    ] },
    3: { title: 'Release v3: proven in software and cloud', steps: [
      { from: 'pipeline', to: 'hub', label: 'a critical finding blocks release' },
      { from: 'oldserver', to: 'db', label: 'migrated, then sanitized' },
      { from: 'custidp', to: 'idp', label: 'single sign-on by federation' },
    ] },
    4: { title: 'Release v4: data, operations and AI', steps: [
      { from: 'modelapi', to: 'gateway', label: 'provider down six hours: fallback' },
      { from: 'gateway', to: 'db', label: 'one customer’s records only' },
      { from: 'backup', to: 'db', label: 'restore, hashes match' },
    ] },
    5: { title: 'Release v5: tested', steps: [
      { from: 'customer', to: 'staff', label: 'sixteen questions, each with evidence' },
      { from: 'staff', to: 'firewall', label: 're-test TLS and segmentation' },
      { from: 'siem', to: 'staff', label: 'tabletop: four injects' },
    ] },
    6: { title: 'Release v6: federal-ready', steps: [
      { from: 'federal', to: 'staff', label: 'show basic safeguarding' },
      { from: 'db', to: 'federal', label: 'federal information stays inside' },
    ] },
  },
  captions: {
    0: 'Where Ridgeline starts: staff, an old server and spreadsheets, and the planned Service Hub with a third-party model at its center.',
    1: 'New: zones, an identity provider and technicians’ phones on the page. Every domain is written down once, with an owner.',
    2: 'New: building sensors and the backup vault. Every rule now has a number, an owner and a time limit.',
    3: 'New: the pipeline and the customer’s identity provider. Gates block, TLS 1.2 is refused, and the old server is sanitized.',
    4: 'New: the AI gateway and the SIEM. A detection fires, a restore matches, and one customer never sees another’s records.',
    5: 'Nothing new is built: every control is assessed, the questionnaire is answered with evidence, and a tabletop tests the plans.',
    6: 'New: the federal boundary. Basic safeguarding has evidence, the SP 800-171 gaps have dates, and the plan is assembled.',
  },
};

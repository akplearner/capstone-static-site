/**
 * The CISSP capstone's picture, as DATA (R101, R103).
 *
 * Ridgeline's migration: the office and field estate on the left, the cloud
 * account that becomes the Service Hub in the middle (its zones, identity,
 * the web, API and agent tiers, data, keys, pipeline, SIEM and backups), the
 * suppliers and customers on the right, and the eight sheets and releases
 * that record it along the bottom. Each release documents, specifies, proves
 * or tests more of it; the week's process is that week's trigger, walked
 * across the same boxes. Plain data, so it ships in the course document
 * (`content.arch`) and `ArchDiagram` draws it.
 */
import { archBuildModel, type ArchNode, type ArchPicture, type ArchZone } from './archPicture';

export const ARCH: ArchPicture = {
  copy: {
    title: 'Ridgeline’s security program — the estate your eight sheets cover',
    howToRead:
      'Left: the office and field estate the company is leaving or connecting. Middle: the cloud account that becomes the Service Hub, tier by tier. Right: the suppliers and customers who rely on it. Bottom: the sheets and releases that record it. Every control statement names one of these boxes.',
    footer: 'Lab stand-in until the starter kit ships: containers on one Linux machine play the cloud account; OPNsense, Keycloak, Jenkins, Wazuh and restic play the services.',
  },
  view: { w: 960, h: 570 },
  zones: [
    { id: 'office', label: 'Office and field', note: 'being retired or connected', x: 20, y: 40, w: 210, h: 400, tone: 4 },
    { id: 'cloud', label: 'Cloud account — the Service Hub', note: 'what Ridgeline answers for', x: 250, y: 40, w: 500, h: 400, tone: 2 },
    { id: 'outside', label: 'Suppliers and customers', note: 'see D3', x: 770, y: 40, w: 170, h: 400, tone: 1 },
    { id: 'records', label: 'Records — the eight sheets and the releases', note: 'D1–D8 · v1–v6', x: 20, y: 470, w: 920, h: 70, tone: 6, lane: true },
  ] satisfies ArchZone[],
  nodes: [
    { id: 'staff', label: 'Office staff', sub: '40 people · policy · training', kind: 'people', zone: 'office', x: 125, y: 100, arrives: 0, records: 'cissp_d1', purpose: 'Who the policy binds and who the training reaches' },
    { id: 'oldserver', label: 'Old scheduling server', sub: 'past end of support (S-10)', kind: 'server', zone: 'office', x: 125, y: 170, arrives: 0, records: 'cissp_d2', purpose: 'The on-premises server to migrate, then sanitize' },
    { id: 'phones', label: 'Technicians’ phones', sub: '80 field devices', kind: 'endpoint', zone: 'office', x: 125, y: 240, arrives: 1, records: 'cissp_d4', purpose: 'Remote access from the field; the biggest endpoint fleet' },
    { id: 'sensors', label: 'Building sensors', sub: 'IoT readings', kind: 'network', zone: 'office', x: 125, y: 310, arrives: 2, records: 'cissp_d4', purpose: 'Untrusted devices that feed the failure predictor' },
    { id: 'mdm', label: 'Device management', sub: 'MDM · encryption · wipe', kind: 'control', zone: 'office', x: 125, y: 380, arrives: 1, records: 'cissp_d5', purpose: 'Enrols the phones, enforces encryption and remote wipe' },
    { id: 'firewall', label: 'Zones and firewall', sub: 'default deny · OPNsense', kind: 'firewall', zone: 'cloud', x: 325, y: 100, arrives: 1, records: 'cissp_d4', role: 'archnet', purpose: 'Separates office, cloud and sensor traffic; default deny' },
    { id: 'vpn', label: 'VPN remote access', sub: 'WireGuard · MFA', kind: 'router', zone: 'cloud', x: 495, y: 100, arrives: 1, records: 'cissp_d4', role: 'archnet', purpose: 'The one recorded path for administrators and phones' },
    { id: 'idp', label: 'Identity provider', sub: 'Keycloak · MFA', kind: 'idp', zone: 'cloud', x: 665, y: 100, arrives: 1, records: 'cissp_d5', role: 'idops', purpose: 'One account per person, MFA on every administrative login' },
    { id: 'web', label: 'Hub web app', sub: 'customer portal · TLS 1.3', kind: 'app', zone: 'cloud', x: 325, y: 170, arrives: 0, records: 'cissp_d8', role: 'archnet', purpose: 'What customers and dispatchers see' },
    { id: 'api', label: 'Hub API', sub: 'work orders · invoices', kind: 'app', zone: 'cloud', x: 495, y: 170, arrives: 0, records: 'cissp_d8', role: 'archnet', purpose: 'The business logic every client and agent calls' },
    { id: 'agent', label: 'Dispatch agent', sub: 'assigns · messages', kind: 'ai', zone: 'cloud', x: 665, y: 170, arrives: 0, records: 'cissp_d8', role: 'archnet', purpose: 'The AI that assigns technicians through the API' },
    { id: 'gateway', label: 'AI gateway', sub: 'sole path to the model', kind: 'control', zone: 'cloud', x: 325, y: 240, arrives: 4, records: 'cissp_d3', role: 'archnet', purpose: 'Tenant separation and a fallback when the provider is down' },
    { id: 'db', label: 'Database and documents', sub: 'customer data · federal info', kind: 'data', zone: 'cloud', x: 495, y: 240, arrives: 0, records: 'cissp_d2', role: 'archnet', purpose: 'Where building records, contracts and work orders live' },
    { id: 'kms', label: 'Key management', sub: 'AES-256 at rest · rotation', kind: 'identity', zone: 'cloud', x: 665, y: 240, arrives: 2, records: 'cissp_d3', role: 'archnet', purpose: 'Owns the encryption keys and their yearly rotation' },
    { id: 'pipeline', label: 'Pipeline gates', sub: 'review · scan · approve', kind: 'pipeline', zone: 'cloud', x: 325, y: 310, arrives: 3, records: 'cissp_d8', role: 'archnet', purpose: 'No change reaches production without a scan and a second person' },
    { id: 'siem', label: 'Logs and SIEM', sub: '12 months · reviewed weekly', kind: 'siem', zone: 'cloud', x: 495, y: 310, arrives: 4, records: 'cissp_d7', role: 'idops', purpose: 'Keeps and reviews the logs; raises the detections' },
    { id: 'backup', label: 'Backup vault', sub: 'encrypted · offline copy', kind: 'backup', zone: 'cloud', x: 665, y: 310, arrives: 2, records: 'cissp_d7', role: 'idops', purpose: 'The restore-tested copy the recovery targets depend on' },
    { id: 'modelapi', label: 'Model provider API', sub: 'third-party LLM', kind: 'ai', zone: 'outside', x: 855, y: 100, external: true, arrives: 0, records: 'cissp_d3', purpose: 'The supplier whose outage stops dispatch' },
    { id: 'custidp', label: 'Customer identity', sub: 'SAML · OIDC', kind: 'idp', zone: 'outside', x: 855, y: 170, external: true, arrives: 3, records: 'cissp_d5', purpose: 'Federated sign-on for the customers’ own staff' },
    { id: 'customer', label: 'Largest customer', sub: '72-hour notice · SOC 2', kind: 'people', zone: 'outside', x: 855, y: 240, external: true, arrives: 0, records: 'cissp_d1', purpose: 'Sets the contract terms and sends the questionnaire' },
    { id: 'federal', label: 'Federal boundary', sub: 'FCI now · CUI next year', kind: 'outside', zone: 'outside', x: 855, y: 310, external: true, arrives: 6, records: 'cissp_d1', purpose: 'The information that must stay inside authorized services' },
    { id: 'r_d1', label: 'D1 Governance', sub: '', kind: 'record', zone: 'records', x: 95, y: 492, arrives: 1, records: 'cissp_d1', role: 'govrisk', purpose: 'Records the policy, risks, legal and supplier registers' },
    { id: 'r_d2', label: 'D2 Assets', sub: '', kind: 'record', zone: 'records', x: 248, y: 492, arrives: 1, records: 'cissp_d2', role: 'govrisk', purpose: 'Records the inventory, classification and categorization' },
    { id: 'r_d3', label: 'D3 Architecture', sub: '', kind: 'record', zone: 'records', x: 401, y: 492, arrives: 1, records: 'cissp_d3', role: 'archnet', purpose: 'Records boundaries, cryptography and shared responsibility' },
    { id: 'r_d4', label: 'D4 Network', sub: '', kind: 'record', zone: 'records', x: 554, y: 492, arrives: 1, records: 'cissp_d4', role: 'archnet', purpose: 'Records zones, the rule base and remote access' },
    { id: 'r_d5', label: 'D5 Identity', sub: '', kind: 'record', zone: 'records', x: 707, y: 492, arrives: 1, records: 'cissp_d5', role: 'idops', purpose: 'Records accounts, MFA, privileged access and reviews' },
    { id: 'r_d6', label: 'D6 Assessment', sub: '', kind: 'record', zone: 'records', x: 860, y: 492, arrives: 1, records: 'cissp_d6', role: 'govrisk', purpose: 'Records the profiles, scores, metrics and the assessment' },
    { id: 'r_d7', label: 'D7 Operations', sub: '', kind: 'record', zone: 'records', x: 95, y: 526, arrives: 1, records: 'cissp_d7', role: 'idops', purpose: 'Records logging, incidents, impact, backup and contingency' },
    { id: 'r_d8', label: 'D8 Software', sub: '', kind: 'record', zone: 'records', x: 248, y: 526, arrives: 1, records: 'cissp_d8', role: 'archnet', purpose: 'Records the pipeline gates and change control' },
    { id: 'r_note', label: 'Release note', sub: '', kind: 'record', zone: 'records', x: 401, y: 526, arrives: 1, records: 'cissp_release_note', role: 'govrisk', purpose: 'Records what each release shipped and its score' },
    { id: 'r_controls', label: 'Control statements', sub: '', kind: 'record', zone: 'records', x: 554, y: 526, arrives: 2, records: 'cissp_controls', role: 'govrisk', purpose: 'Records sixteen controls: who does what, how often' },
    { id: 'r_questionnaire', label: 'Questionnaire', sub: '', kind: 'record', zone: 'records', x: 707, y: 526, arrives: 5, records: 'cissp_questionnaire', role: 'govrisk', purpose: 'Records the sixteen answers, each with evidence' },
    { id: 'r_ssp', label: 'SSP (capstone)', sub: '', kind: 'record', zone: 'records', x: 860, y: 526, arrives: 6, records: 'cissp_ssp', role: 'govrisk', purpose: 'The system security plan and traceability matrix' },
  ] satisfies ArchNode[],
  edges: [
    { from: 'staff', to: 'oldserver', label: 'spreadsheets · scheduling' },
    { from: 'web', to: 'api', label: 'calls' },
    { from: 'api', to: 'db', label: 'customer data' },
    { from: 'api', to: 'gateway', label: 'prompts' },
    { from: 'gateway', to: 'modelapi', label: 'AI calls' },
    { from: 'idp', to: 'web', label: 'single sign-on', kind: 'trust' },
    { from: 'phones', to: 'vpn', label: 'remote access', kind: 'admin' },
    { from: 'api', to: 'siem', label: 'audit log', kind: 'log' },
    { from: 'db', to: 'backup', label: 'nightly', kind: 'backup' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'Where things stand', steps: [
      { from: 'staff', to: 'oldserver', label: 'spreadsheets and the scheduling app' },
      { from: 'api', to: 'modelapi', label: 'AI at the center' },
    ] },
    1: { title: 'Release v1: one page per domain', steps: [
      { from: 'customer', to: 'staff', label: 'show us your security program' },
      { from: 'staff', to: 'r_d1', label: 'eight sheets, signed by the CEO' },
      { from: 'phones', to: 'vpn', label: 'the one path in' },
    ] },
    2: { title: 'Release v2: numbers, owners, time limits', steps: [
      { from: 'customer', to: 'staff', label: '“promptly” eleven times: give numbers' },
      { from: 'kms', to: 'db', label: 'keys owned and rotated' },
      { from: 'backup', to: 'db', label: 'recovery targets per process' },
    ] },
    3: { title: 'Release v3: proven in software and cloud', steps: [
      { from: 'pipeline', to: 'api', label: 'a critical finding blocks release' },
      { from: 'oldserver', to: 'db', label: 'migrated, then sanitized' },
      { from: 'custidp', to: 'idp', label: 'single sign-on by federation' },
    ] },
    4: { title: 'Release v4: data, operations and AI', steps: [
      { from: 'modelapi', to: 'gateway', label: 'provider down six hours: fallback' },
      { from: 'gateway', to: 'db', label: 'one customer’s records only' },
      { from: 'backup', to: 'db', label: 'restore, hashes match' },
      { from: 'api', to: 'siem', label: 'the detection fires' },
    ] },
    5: { title: 'Release v5: tested', steps: [
      { from: 'customer', to: 'r_questionnaire', label: 'sixteen questions, each with evidence' },
      { from: 'staff', to: 'firewall', label: 're-test TLS and segmentation' },
      { from: 'siem', to: 'staff', label: 'tabletop: four injects' },
    ] },
    6: { title: 'Release v6: federal-ready', steps: [
      { from: 'federal', to: 'staff', label: 'show basic safeguarding' },
      { from: 'db', to: 'federal', label: 'federal information stays inside' },
      { from: 'r_d6', to: 'r_ssp', label: 'the plan assembled' },
    ] },
  },
  captions: {
    0: 'Where Ridgeline starts: staff, an old server and spreadsheets, and the Hub’s web, API and agent tiers with a third-party model behind them.',
    1: 'New: zones, the VPN, the identity provider and device management for the phones. Every domain is written down once, with an owner.',
    2: 'New: building sensors, key management and the backup vault. Every rule now has a number, an owner and a time limit.',
    3: 'New: the pipeline and the customer’s identity provider. Gates block, TLS 1.2 is refused, and the old server is sanitized.',
    4: 'New: the AI gateway and the SIEM. A detection fires, a restore matches, and one customer never sees another’s records.',
    5: 'Nothing new is built: every control is assessed, the questionnaire is answered with evidence, and a tabletop tests the plans.',
    6: 'New: the federal boundary and the plan. Basic safeguarding has evidence, the SP 800-171 gaps have dates, and the SSP is assembled.',
  },
});

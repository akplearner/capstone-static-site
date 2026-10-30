/**
 * The CCSP Cloud Assurance picture, as DATA (R103, R130).
 *
 * One small cloud application, secured across its lifecycle: the scope and the
 * architecture, the classified data under its own key, the platform and the
 * application, and the operations that watch it. Each part arrives in the week
 * the course first secures it; the week's process is that week's thread walked
 * across the same boxes. Plain data, so it ships in the course document
 * (`content.arch`) and `ArchDiagram` draws it.
 */
import { archBuildModel, type ArchNode, type ArchPicture, type ArchZone } from './archPicture';

export const ARCH: ArchPicture = {
  copy: {
    title: 'The application — scope, architecture, data, and the controls that assure it',
    howToRead:
      'Left: the scope and the shared-responsibility architecture. Middle: the platform, the network and the application build. Right-middle: the data under its own key. Right: operations and the incident. Bottom: the proof — the compliance mapping, the incident, the custody. Lane: the records issued at handover.',
    footer: 'No paid resources required: every proof runs against sample artifacts shipped with the course and read with awk, jq and grep.',
  },
  view: { w: 960, h: 610 },
  zones: [
    { id: 'scope', label: 'Scope & architecture', note: 'responsibility · components', x: 20, y: 40, w: 180, h: 340, tone: 1 },
    { id: 'platform', label: 'Platform & application', note: 'baseline · network · build', x: 220, y: 40, w: 360, h: 340, tone: 2 },
    { id: 'data', label: 'The data, protected', note: 'classify · key', x: 600, y: 40, w: 160, h: 340, tone: 5 },
    { id: 'ops', label: 'Operations', note: 'monitoring · incident', x: 770, y: 40, w: 170, h: 340, tone: 3 },
    { id: 'proof', label: 'The proof it holds', note: 'compliance · incident · custody', x: 220, y: 410, w: 720, h: 90, tone: 4 },
    { id: 'records', label: 'Records — the forms issued at handover', note: '1–8 · the application documented', x: 20, y: 520, w: 920, h: 70, tone: 6, lane: true },
  ] satisfies ArchZone[],
  nodes: [
    { id: 'resp', label: 'Responsibility', sub: 'provider vs customer', kind: 'control', zone: 'scope', x: 110, y: 110, arrives: 1, records: 'ccsp_architecture', role: 'platform', purpose: 'Who secures each layer, provider or customer, for this model' },
    { id: 'arch', label: 'Architecture', sub: 'components · boundaries', kind: 'server', zone: 'scope', x: 110, y: 200, arrives: 1, records: 'ccsp_architecture', role: 'platform', purpose: 'Every component and its trust boundary' },
    { id: 'scope', label: 'Scope', sub: 'app · data · obligation', kind: 'evidence', zone: 'scope', x: 110, y: 290, arrives: 0, records: 'ccsp_setup', role: 'grc', purpose: 'The application, its data and the obligation in scope' },
    { id: 'baseline', label: 'Platform baseline', sub: 'scanned', kind: 'monitor', zone: 'platform', x: 320, y: 110, arrives: 3, records: 'ccsp_platform', role: 'platform', purpose: 'The platform baseline, scanned, every failing control owned' },
    { id: 'network', label: 'Network', sub: 'segmented', kind: 'switch', zone: 'platform', x: 490, y: 110, arrives: 3, records: 'ccsp_platform', role: 'platform', purpose: 'Segmented so the private tier has no public route' },
    { id: 'appcode', label: 'The application', sub: 'secrets · deps', kind: 'app', zone: 'platform', x: 320, y: 220, arrives: 3, records: 'ccsp_appsec', role: 'appsec', purpose: 'The application, scanned for secrets and vulnerable dependencies' },
    { id: 'gate', label: 'Lifecycle gate', sub: 'blocks a bad build', kind: 'control', zone: 'platform', x: 490, y: 220, arrives: 3, records: 'ccsp_appsec', role: 'appsec', purpose: 'The lifecycle gate that blocks a failing build' },
    { id: 'legalmap', label: 'Control mapping', sub: 'obligations → controls', kind: 'control', zone: 'platform', x: 405, y: 320, arrives: 1, records: 'ccsp_legal', role: 'grc', purpose: 'Obligations mapped to controls, with the residency rule' },
    { id: 'classify', label: 'Classified data', sub: 'every set labelled', kind: 'data', zone: 'data', x: 680, y: 110, arrives: 2, records: 'ccsp_data', role: 'data', purpose: 'Every data set classified so the rules can apply' },
    { id: 'key', label: 'Customer key', sub: 'rotation · retention', kind: 'control', zone: 'data', x: 680, y: 220, arrives: 2, records: 'ccsp_data', role: 'data', purpose: 'A customer-owned key with rotation and retention' },
    { id: 'monitor', label: 'Monitoring', sub: 'alerts route', kind: 'monitor', zone: 'ops', x: 855, y: 110, arrives: 4, records: 'ccsp_operations', role: 'grc', purpose: 'Monitoring and alerts that route to a human' },
    { id: 'actor', label: 'The actor', sub: 'the incident', kind: 'outside', zone: 'ops', x: 855, y: 290, external: true, arrives: 4, records: 'ccsp_operations', role: 'grc', purpose: 'The actor the incident is worked against' },
    { id: 'legal', label: 'Compliance', sub: 'obligations · risk', kind: 'evidence', zone: 'proof', x: 320, y: 455, arrives: 1, records: 'ccsp_legal', role: 'grc', purpose: 'The obligations, residency and top risks, owned' },
    { id: 'incident', label: 'Incident log', sub: 'one change per row', kind: 'ticket', zone: 'proof', x: 500, y: 455, arrives: 4, records: 'ccsp_operations', role: 'grc', purpose: 'The incident contained one action per row, failures kept' },
    { id: 'custody', label: 'Custody', sub: 'every artifact hashed', kind: 'backup', zone: 'proof', x: 700, y: 455, arrives: 4, records: 'ccsp_handover', role: 'grc', purpose: 'A hash for every control evidence the course produced' },
    { id: 'r_setup', label: '1 Engagement & scope', sub: '', kind: 'record', zone: 'records', x: 95, y: 538, arrives: 0, records: 'ccsp_setup', role: 'grc', purpose: 'Records the account, the scope and the identity' },
    { id: 'r_architecture', label: '2 Architecture', sub: '', kind: 'record', zone: 'records', x: 255, y: 538, arrives: 1, records: 'ccsp_architecture', role: 'platform', purpose: 'Records the responsibility line and the architecture' },
    { id: 'r_legal', label: '3 Legal & compliance', sub: '', kind: 'record', zone: 'records', x: 415, y: 538, arrives: 1, records: 'ccsp_legal', role: 'grc', purpose: 'Records the obligations, residency and risks' },
    { id: 'r_data', label: '4 Data security', sub: '', kind: 'record', zone: 'records', x: 575, y: 538, arrives: 2, records: 'ccsp_data', role: 'data', purpose: 'Records the classification, the key and the decision' },
    { id: 'r_platform', label: '5 Platform & network', sub: '', kind: 'record', zone: 'records', x: 735, y: 538, arrives: 3, records: 'ccsp_platform', role: 'platform', purpose: 'Records the baseline and the segmentation' },
    { id: 'r_appsec', label: '6 Application security', sub: '', kind: 'record', zone: 'records', x: 95, y: 572, arrives: 3, records: 'ccsp_appsec', role: 'appsec', purpose: 'Records the secret and dependency scans' },
    { id: 'r_operations', label: '7 Operations & incident', sub: '', kind: 'record', zone: 'records', x: 255, y: 572, arrives: 4, records: 'ccsp_operations', role: 'grc', purpose: 'Records monitoring, change and the incident' },
    { id: 'r_handover', label: '8 Handover', sub: '', kind: 'record', zone: 'records', x: 415, y: 572, arrives: 4, records: 'ccsp_handover', role: 'grc', purpose: 'The capstone: every control mapped to its evidence, with custody' },
    { id: 'r_portfolio', label: '9 Portfolio', sub: '', kind: 'record', zone: 'records', x: 575, y: 572, arrives: 4, records: 'ccsp_portfolio', role: 'grc', purpose: 'The repository, case study, resume bullets and diagram' },
  ] satisfies ArchNode[],
  edges: [
    { from: 'resp', to: 'arch', label: 'frames' },
    { from: 'scope', to: 'legalmap', label: 'drives', kind: 'admin' },
    { from: 'classify', to: 'key', label: 'encrypted by' },
    { from: 'key', to: 'appcode', label: 'used by' },
    { from: 'network', to: 'appcode', label: 'fences' },
    { from: 'appcode', to: 'monitor', label: 'watched', kind: 'log' },
    { from: 'actor', to: 'incident', label: 'worked', kind: 'log' },
    { from: 'legalmap', to: 'legal', label: 'recorded' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'Set up: the account, an MFA identity, the scope', steps: [
      { from: 'scope', to: 'arch', label: 'the boundary is written' },
    ] },
    1: { title: 'Week 1: shared responsibility, the architecture, the law', steps: [
      { from: 'resp', to: 'arch', label: 'who secures what' },
      { from: 'scope', to: 'legalmap', label: 'obligations mapped' },
      { from: 'legalmap', to: 'legal', label: 'residency and risk' },
    ] },
    2: { title: 'Week 2: classify it, protect it, own the key', steps: [
      { from: 'classify', to: 'key', label: 'encrypted with a customer key' },
    ] },
    3: { title: 'Week 3: fence the platform, secure the build', steps: [
      { from: 'baseline', to: 'network', label: 'baseline passes, segmented' },
      { from: 'network', to: 'appcode', label: 'the application fenced' },
      { from: 'gate', to: 'appcode', label: 'no secrets, no critical CVE' },
    ] },
    4: { title: 'Week 4: operate, work the incident, hand over', steps: [
      { from: 'appcode', to: 'monitor', label: 'watched, alerts route' },
      { from: 'actor', to: 'incident', label: 'contained one change per row' },
      { from: 'custody', to: 'r_handover', label: 'controls mapped, custody handed over' },
    ] },
  },
  captions: {
    0: 'The account with a budget guard, an MFA identity, and the scope written: the app, its data and the obligation.',
    1: 'New: the shared-responsibility line, the reference architecture, and the obligations mapped to controls.',
    2: 'New: every data set classified, the store locked, and a customer-owned key with rotation and retention.',
    3: 'New: the platform baseline passing, the network segmented, and the application clean of secrets and critical CVEs.',
    4: 'New: monitoring that pages, the incident contained one change per row, and every control mapped to its evidence.',
  },
});

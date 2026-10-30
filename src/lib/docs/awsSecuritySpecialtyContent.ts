/**
 * The AWS Security – Specialty Secure Workload's picture, as DATA (R103, R130).
 *
 * One small AWS workload, secured layer by layer: the account and the identities
 * that reach it, the segmented network that fences it, the data under its own
 * key, and the detection that watches it. Each part arrives in the week the
 * course first secures it; the week's process is that week's thread walked
 * across the same boxes. Plain data, so it ships in the course document
 * (`content.arch`) and `ArchDiagram` draws it.
 */
import { archBuildModel, type ArchNode, type ArchPicture, type ArchZone } from './archPicture';

export const ARCH: ArchPicture = {
  copy: {
    title: 'The workload — identity, network, data, and the eye that watches',
    howToRead:
      'Left: the account and the identities that reach it. Middle: the segmented network and the data under its own key. Right: detection and the alarm that pages. Bottom: the proof — the baseline, the incident, the custody. Lane: the records issued at handover.',
    footer: 'No paid resources required: every proof runs on the free tier, with dry-run where a change would cost, or against the sample findings shipped with the course.',
  },
  view: { w: 960, h: 610 },
  zones: [
    { id: 'identity', label: 'Account & identity', note: 'root · users · roles', x: 20, y: 40, w: 180, h: 340, tone: 1 },
    { id: 'network', label: 'The segmented network', note: 'VPC · groups · SSM', x: 220, y: 40, w: 360, h: 340, tone: 2 },
    { id: 'data', label: 'The data, protected', note: 'KMS · locked bucket', x: 600, y: 40, w: 160, h: 340, tone: 5 },
    { id: 'detect', label: 'Detection & response', note: 'findings · alarm', x: 770, y: 40, w: 170, h: 340, tone: 3 },
    { id: 'proof', label: 'The proof it holds', note: 'baseline · incident · custody', x: 220, y: 410, w: 720, h: 90, tone: 4 },
    { id: 'records', label: 'Records — the forms issued at handover', note: '1–8 · the workload documented', x: 20, y: 520, w: 920, h: 70, tone: 6, lane: true },
  ] satisfies ArchZone[],
  nodes: [
    { id: 'root', label: 'Root user', sub: 'MFA · break-glass', kind: 'identity', zone: 'identity', x: 110, y: 110, arrives: 0, records: 'scs_setup', role: 'records', purpose: 'The account itself, protected with MFA and used for nothing routine' },
    { id: 'user', label: 'IAM user', sub: 'daily work · MFA', kind: 'identity', zone: 'identity', x: 110, y: 200, arrives: 0, records: 'scs_setup', role: 'iam', purpose: 'The scoped identity daily work runs as, never root' },
    { id: 'role', label: 'Scoped roles', sub: 'least privilege', kind: 'control', zone: 'identity', x: 110, y: 290, arrives: 1, records: 'scs_identity', role: 'iam', purpose: 'A role per focus, assumed with MFA and proved to deny' },
    { id: 'vpc', label: 'VPC', sub: 'public + private', kind: 'switch', zone: 'network', x: 320, y: 110, arrives: 2, records: 'scs_network', role: 'infra', purpose: 'The network, segmented so the private subnet has no internet door' },
    { id: 'sg', label: 'Security groups', sub: 'least exposure', kind: 'control', zone: 'network', x: 490, y: 110, arrives: 2, records: 'scs_network', role: 'infra', purpose: 'Only the needed port open, proved by a dry-run' },
    { id: 'host', label: 'The host', sub: 'private subnet', kind: 'server', zone: 'network', x: 320, y: 220, arrives: 2, records: 'scs_network', role: 'infra', purpose: 'Reached through SSM with port 22 closed to everyone' },
    { id: 'ssm', label: 'SSM', sub: 'no open SSH', kind: 'control', zone: 'network', x: 490, y: 220, arrives: 2, records: 'scs_network', role: 'infra', purpose: 'The audited management path that lets port 22 stay closed' },
    { id: 'baseline_c', label: 'Trail & Config', sub: 'governance baseline', kind: 'monitor', zone: 'network', x: 405, y: 320, arrives: 1, records: 'scs_baseline', role: 'records', purpose: 'A multi-region validated trail and a config recorder under everything' },
    { id: 'kms', label: 'KMS key', sub: 'customer-managed', kind: 'control', zone: 'data', x: 680, y: 110, arrives: 3, records: 'scs_data', role: 'data', purpose: 'The customer-managed key the data is encrypted with' },
    { id: 'bucket', label: 'Data bucket', sub: 'locked · encrypted', kind: 'data', zone: 'data', x: 680, y: 220, arrives: 3, records: 'scs_data', role: 'data', purpose: 'Public access blocked, an unencrypted upload refused' },
    { id: 'findings', label: 'Findings', sub: 'triaged by severity', kind: 'scanner', zone: 'detect', x: 855, y: 110, arrives: 3, records: 'scs_detect', role: 'records', purpose: 'The detection findings, sorted so the fire is first' },
    { id: 'alarm', label: 'Metric alarm', sub: 'pages the team', kind: 'monitor', zone: 'detect', x: 855, y: 200, arrives: 4, records: 'scs_detect', role: 'infra', purpose: 'A metric filter and alarm so the next unauthorized call pages' },
    { id: 'attacker', label: 'The actor', sub: 'from a bad IP', kind: 'outside', zone: 'detect', x: 855, y: 290, external: true, arrives: 4, records: 'scs_incident', role: 'records', purpose: 'The unauthorized caller the incident is worked against' },
    { id: 'baseline', label: 'Control baseline', sub: 'every control, on/off', kind: 'evidence', zone: 'proof', x: 320, y: 455, arrives: 1, records: 'scs_baseline', role: 'records', purpose: 'Every control named with its state — the floor it all stands on' },
    { id: 'incident', label: 'Incident log', sub: 'one change per row', kind: 'ticket', zone: 'proof', x: 500, y: 455, arrives: 4, records: 'scs_incident', role: 'records', purpose: 'The incident contained one action per row, failures kept' },
    { id: 'custody', label: 'Custody', sub: 'every artifact hashed', kind: 'backup', zone: 'proof', x: 700, y: 455, arrives: 4, records: 'scs_handover', role: 'records', purpose: 'A hash for every policy, finding and log the course produced' },
    { id: 'r_setup', label: '1 Account & access', sub: '', kind: 'record', zone: 'records', x: 95, y: 538, arrives: 0, records: 'scs_setup', role: 'records', purpose: 'Records the account, root, the MFA identity and the budget' },
    { id: 'r_identity', label: '2 Identity matrix', sub: '', kind: 'record', zone: 'records', x: 255, y: 538, arrives: 1, records: 'scs_identity', role: 'iam', purpose: 'Records the roles, least privilege and the proven denial' },
    { id: 'r_baseline', label: '3 Control baseline', sub: '', kind: 'record', zone: 'records', x: 415, y: 538, arrives: 1, records: 'scs_baseline', role: 'records', purpose: 'Records the account-wide governance controls' },
    { id: 'r_network', label: '4 Network record', sub: '', kind: 'record', zone: 'records', x: 575, y: 538, arrives: 2, records: 'scs_network', role: 'infra', purpose: 'Records the segments, the groups and the closed SSH' },
    { id: 'r_data', label: '5 Data protection', sub: '', kind: 'record', zone: 'records', x: 735, y: 538, arrives: 3, records: 'scs_data', role: 'data', purpose: 'Records the key, the locked bucket and the key decision' },
    { id: 'r_detect', label: '6 Detection log', sub: '', kind: 'record', zone: 'records', x: 95, y: 572, arrives: 3, records: 'scs_detect', role: 'records', purpose: 'Records the findings, the triage and the alarm' },
    { id: 'r_incident', label: '7 Incident log', sub: '', kind: 'record', zone: 'records', x: 255, y: 572, arrives: 4, records: 'scs_incident', role: 'records', purpose: 'Records the incident worked one change per row' },
    { id: 'r_handover', label: '8 Handover', sub: '', kind: 'record', zone: 'records', x: 415, y: 572, arrives: 4, records: 'scs_handover', role: 'records', purpose: 'The capstone: the baseline as it is, with custody for every artifact' },
    { id: 'r_portfolio', label: '9 Portfolio', sub: '', kind: 'record', zone: 'records', x: 575, y: 572, arrives: 4, records: 'scs_portfolio', role: 'records', purpose: 'The repository, case study, resume bullets and diagram' },
  ] satisfies ArchNode[],
  edges: [
    { from: 'user', to: 'role', label: 'assumes', kind: 'admin' },
    { from: 'role', to: 'bucket', label: 'scoped access' },
    { from: 'vpc', to: 'host', label: 'segments' },
    { from: 'ssm', to: 'host', label: 'reaches', kind: 'admin' },
    { from: 'kms', to: 'bucket', label: 'encrypts' },
    { from: 'host', to: 'findings', label: 'logged', kind: 'log' },
    { from: 'attacker', to: 'incident', label: 'worked', kind: 'log' },
    { from: 'findings', to: 'alarm', label: 'alarms on' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'Set up: the account, an MFA identity, the folder', steps: [
      { from: 'root', to: 'user', label: 'daily work moves off root' },
    ] },
    1: { title: 'Week 1: least privilege, proved, and the baseline', steps: [
      { from: 'user', to: 'role', label: 'assumes a scoped role with MFA' },
      { from: 'role', to: 'bucket', label: 'allowed in, denied what it must not' },
      { from: 'baseline_c', to: 'baseline', label: 'trail and config on' },
    ] },
    2: { title: 'Week 2: segment it, fence it, close the door', steps: [
      { from: 'vpc', to: 'host', label: 'private subnet, no internet door' },
      { from: 'sg', to: 'host', label: 'only the needed port' },
      { from: 'ssm', to: 'host', label: 'reached without SSH' },
    ] },
    3: { title: 'Week 3: its own key, a locked bucket, the findings', steps: [
      { from: 'kms', to: 'bucket', label: 'customer-managed key' },
      { from: 'bucket', to: 'findings', label: 'unencrypted put refused' },
      { from: 'findings', to: 'incident', label: 'triaged, top one is the incident' },
    ] },
    4: { title: 'Week 4: work the incident, wire the alarm, hand over', steps: [
      { from: 'attacker', to: 'incident', label: 'contained one change per row' },
      { from: 'findings', to: 'alarm', label: 'the next one pages' },
      { from: 'custody', to: 'r_handover', label: 'baseline and custody handed over' },
    ] },
  },
  captions: {
    0: 'The account with a budget guard, root locked with MFA, daily work on a scoped identity, and the folder ready.',
    1: 'New: a role per focus assumed with MFA, least privilege proved on a denial, and the governance baseline on.',
    2: 'New: the segmented network, least-exposure security groups, and the host reached through SSM with SSH closed.',
    3: 'New: a customer-managed key, a locked bucket that refuses an unencrypted put, and the findings triaged.',
    4: 'New: the incident contained one change per row, the alarm wired to page, and the baseline handed over with custody.',
  },
});

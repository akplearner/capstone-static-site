import type { KitSpec } from '../diagrams/kitSpec';
import type { CloudPlatform } from './model';
import type { WeekProcess } from '../weekVisual';

/**
 * The cloud capstones' workflow pictures (R87) — how the company works, one
 * left-to-right flow each, drawn by the diagram kit's `FlowPath`. Same five on
 * both platforms; only the service names change.
 *
 *   1 A website request     visitor → HTTPS endpoint → storage
 *   2 The visitor counter   browser → API → function → database
 *   3 Delivery (CI/CD)      commit → review → pipeline (OIDC) → preview → deploy
 *   4 The incident loop     observe → layer → evidence → fix → retest → document
 *   5 The weekly cycle      plan → build → validate → document → review
 */

interface Names {
  site: string;
  edge: string;
  store: string;
  api: string;
  fn: string;
  db: string;
  login: string;
  preview: string;
  deploy: string;
  logs: string;
}

const NAMES: Record<CloudPlatform, Names> = {
  azure: {
    site: 'Static website endpoint',
    edge: 'HTTPS built in',
    store: 'Storage account ($web)',
    api: 'Function HTTP trigger',
    fn: 'Function App (managed identity)',
    db: 'Cosmos DB (serverless)',
    login: 'azure/login (OIDC)',
    preview: 'what-if',
    deploy: 'azure/arm-deploy',
    logs: 'Application Insights',
  },
  aws: {
    site: 'CloudFront distribution',
    edge: 'HTTPS + Origin Access Control',
    store: 'S3 bucket (private)',
    api: 'API Gateway HTTP API',
    fn: 'Lambda (table-scoped role)',
    db: 'DynamoDB (on-demand)',
    login: 'configure-aws-credentials (OIDC)',
    preview: 'change set',
    deploy: 'CloudFormation deploy',
    logs: 'CloudWatch Logs',
  },
};

export function cloudWorkflows(platform: CloudPlatform): KitSpec[] {
  const n = NAMES[platform];
  return [
    {
      kit: 'flow',
      title: 'A website request',
      howToRead: 'Left to right: what happens when someone opens the company site.',
      stages: [
        { id: 'visitor', label: 'Visitor', sub: 'browser', kind: 'people' },
        { id: 'edge', label: n.site, sub: n.edge, kind: 'cloud' },
        { id: 'store', label: n.store, sub: 'index.html, 404.html', kind: 'server' },
      ],
      footer: 'Weeks 2 and 8: publish it, then prove a deleted file can be recovered.',
    },
    {
      kit: 'flow',
      title: 'The visitor counter',
      howToRead: 'The page’s script calls the API; the function adds one and returns the count.',
      stages: [
        { id: 'page', label: 'Page script', sub: 'fetch() from your site only (CORS)', kind: 'browser' },
        { id: 'api', label: n.api, sub: 'GET, no key', kind: 'cloud' },
        { id: 'fn', label: n.fn, sub: 'no stored secret', kind: 'server' },
        { id: 'db', label: n.db, sub: 'item id = site', kind: 'server' },
      ],
      footer: `Weeks 3–5: build it, watch it in ${n.logs}, then remove its last secret.`,
    },
    {
      kit: 'flow',
      title: 'Delivery — from commit to cloud',
      howToRead: 'Nobody deploys from a laptop after Week 10: every change travels this path.',
      stages: [
        { id: 'commit', label: 'Commit', sub: 'a branch', kind: 'workstation' },
        { id: 'review', label: 'Pull request', sub: 'RFC + one review', kind: 'people' },
        { id: 'login', label: 'Sign in', sub: n.login, kind: 'firewall' },
        { id: 'preview', label: 'Preview', sub: n.preview, kind: 'sensor' },
        { id: 'deploy', label: 'Deploy', sub: n.deploy, kind: 'server' },
      ],
      footer: 'No cloud key is stored anywhere: the pipeline proves who it is for each run.',
    },
    {
      kit: 'flow',
      title: 'The incident loop',
      howToRead: 'How every failure in the course is worked — Week 4 first, Week 12 under pressure.',
      stages: [
        { id: 'observe', label: 'Observe', sub: 'the symptom a user sees', kind: 'people' },
        { id: 'layer', label: 'Find the layer', sub: 'network · identity · app · data · config', kind: 'sensor' },
        { id: 'evidence', label: 'Evidence', sub: `${n.logs}, the audit log`, kind: 'sensor' },
        { id: 'fix', label: 'Fix', sub: 'the smallest change', kind: 'server' },
        { id: 'retest', label: 'Retest', sub: 'what failed now works', kind: 'browser' },
        { id: 'document', label: 'Document', sub: 'root cause + prevention', kind: 'workstation' },
      ],
    },
    {
      kit: 'flow',
      title: 'The weekly cycle',
      howToRead: 'Every week, every role, the same five beats.',
      stages: [
        { id: 'plan', label: 'Plan', sub: 'split the four tasks', kind: 'people' },
        { id: 'build', label: 'Build', sub: 'each role, independently', kind: 'server' },
        { id: 'validate', label: 'Validate', sub: 'what must fail, fails', kind: 'sensor' },
        { id: 'document', label: 'Document', sub: 'your section', kind: 'workstation' },
        { id: 'review', label: 'Review', sub: 'cost, stop the VM', kind: 'firewall' },
      ],
    },
  ];
}

/** Who does what, as a RACI (R = does it, A = answers for it, C = consulted). */
export const CLOUD_RACI: { activity: string; arch: string; infra: string; dev: string; secops: string }[] = [
  { activity: 'Standards, cost and the weekly document', arch: 'A/R', infra: 'C', dev: 'C', secops: 'C' },
  { activity: 'Network, VM, data, templates', arch: 'A', infra: 'R', dev: 'C', secops: 'C' },
  { activity: 'Website, API, pipeline', arch: 'A', infra: 'C', dev: 'R', secops: 'C' },
  { activity: 'Access, firewall rules, incidents', arch: 'A', infra: 'C', dev: 'C', secops: 'R' },
];

/** The difficulty arc, as the overview band draws it. */
export const CLOUD_PHASES = [
  { label: 'Beginner', weeks: '1–4', detail: 'Foundation, website, VM, serverless API, first incident.' },
  { label: 'Intermediate', weeks: '5–8', detail: 'Identity, networking, server admin, backup and recovery.' },
  { label: 'Advanced', weeks: '9–11', detail: 'Infrastructure as code, CI/CD, governance.' },
  { label: 'Integrated', weeks: '12', detail: 'Recover, fix and contain under pressure; hand over.' },
];

/* ── What you build this week (R99) ───────────────────────────────────────── */

/** The ids the week processes name, per platform — the topology's own node and container ids. */
const IDS = {
  azure: { site: 'webStorage', edge: 'webStorage', vm: 'vm', disk: 'dataDisk', api: 'func', fn: 'func', db: 'cosmos', alert: 'http5xxAlert', notify: 'actionGroup', secret: 'kv', param: 'kv', reader: 'readerRole', mgmt: 'bastion', budget: 'budget', group: 'rg', deploy: 'rg', policy: 'tagPolicy', account: 'governance', backup: 'webBlobService', oidc: 'deployIdentity', audit: 'tagPolicy' },
  aws: { site: 'SiteDistribution', edge: 'SiteDistribution', vm: 'ToolsInstance', disk: 'DataVolume', api: 'HttpApi', fn: 'CounterFunction', db: 'VisitorTable', alert: 'FunctionErrorsAlarm', notify: 'AlertTopic', secret: 'TableNameParameter', param: 'TableNameParameter', reader: 'ReadOnlyGroup', mgmt: 'ToolsInstance', budget: 'MonthlyBudget', group: 'Vpc', deploy: 'region', policy: 'Trail', account: 'account-level', backup: 'BackupVault', oidc: 'DeployRole', audit: 'Trail' },
} as const;

const DEPLOY_PREVIEW: Record<CloudPlatform, string> = { azure: 'what-if → deploy to dev', aws: 'change set → deploy to dev' };
const NO_PORT: Record<CloudPlatform, string> = { azure: 'Bastion in the browser, no port', aws: 'Session Manager, no open port' };
const GOVERN: Record<CloudPlatform, string> = { azure: 'Policy: deny untagged', aws: 'CloudTrail · Config (console)' };

/**
 * The process of each GLOBAL week, drawn over the architecture. Every week has
 * one, so a week that adds nothing to the template (Weeks 9–12) still shows
 * what it is about: a deploy, a pipeline, a review, a recovery.
 */
export function cloudWeekProcesses(platform: CloudPlatform): Record<number, WeekProcess> {
  const i = IDS[platform];
  return {
    1: { title: 'Set the standard', steps: [
      { from: 'admin', to: i.budget, label: 'the $5 budget' },
      { from: 'admin', to: i.group, label: 'the group and the network' },
    ] },
    2: { title: 'Core services', steps: [
      { from: 'user', to: i.site, label: 'the site, over HTTPS' },
      { from: 'admin', to: i.vm, label: 'SSH from one address only' },
    ] },
    3: { title: 'The visitor counter', steps: [
      { from: 'user', to: i.api, label: 'GET the count' },
      { from: i.fn, to: i.db, label: 'count + 1' },
    ] },
    4: { title: 'The incident loop', steps: [
      { from: i.fn, to: i.alert, label: 'server errors' },
      { from: i.alert, to: i.notify, label: 'email the team' },
      { from: 'admin', to: i.fn, label: 'find it, fix it, retest' },
    ] },
    5: { title: 'Identity', steps: [
      { from: i.fn, to: i.secret, label: 'read by identity, no key' },
      { from: 'admin', to: i.reader, label: 'least privilege for readers' },
    ] },
    6: { title: 'Networking', steps: [
      { from: 'admin', to: i.mgmt, label: NO_PORT[platform] },
      { from: 'user', to: i.api, label: 'CORS: your site only' },
    ] },
    7: { title: 'Server admin', steps: [
      { from: 'admin', to: i.disk, label: 'attach and mount' },
      { from: 'admin', to: i.vm, label: 'patch and baseline' },
    ] },
    8: { title: 'Backup and recovery', steps: [
      { from: 'admin', to: i.disk, label: 'snapshot' },
      { from: i.disk, to: i.vm, label: 'restore and time it' },
      { from: i.backup, to: i.site, label: 'recover the deleted file' },
    ] },
    9: { title: 'Infrastructure as Code', steps: [
      { from: 'github', to: i.deploy, label: DEPLOY_PREVIEW[platform] },
    ] },
    10: { title: 'CI/CD', steps: [
      { from: 'github', to: i.oidc, label: 'sign in by OIDC, no secret' },
      { from: 'github', to: i.site, label: 'deploy the site' },
      { from: 'github', to: i.fn, label: 'deploy under a change request' },
    ] },
    11: { title: 'Governance', steps: [
      { from: i.policy, to: i.group, label: GOVERN[platform] },
      { from: i.audit, to: 'admin', label: 'who changed what, when' },
      { from: 'admin', to: i.budget, label: 'cost review' },
    ] },
    12: { title: 'Handover', steps: [
      { from: 'user', to: i.site, label: 'the symptom' },
      { from: 'admin', to: i.vm, label: 'recover · fix · contain' },
      { from: 'admin', to: 'github', label: 'the handover package' },
    ] },
  };
}

/** One sentence per GLOBAL week, under the picture. */
export const CLOUD_WEEK_CAPTIONS: Record<number, string> = {
  1: 'New: the budget, the group and the network. The standard everything else is named by.',
  2: 'New: the VM, the storage site and the firewall. The company is on the internet, over HTTPS.',
  3: 'New: the function, the database and the identity pieces. A page view becomes a count.',
  4: 'New: the alert and who it emails. Break it on purpose and watch the alert win.',
  5: 'New: the secret store and the roles. The function reads by identity; readers only read.',
  6: 'New: the management subnet and the admin path with no open port. SSH is gone.',
  7: 'New: the data disk. The VM is patched, measured and right-sized.',
  8: 'New: the backup protection — soft delete on Azure, a daily AWS Backup plan. Snapshot, restore, time it, and recover a deleted file.',
  9: 'Nothing new is built. The whole environment comes from the template, previewed before it deploys.',
  10: 'New: the deploy identity. GitHub signs in by OIDC without a stored secret and deploys under a change request.',
  11: 'New: governance — the tag policy, the audit trail. Untagged resources are caught; the month’s cost is reviewed.',
  12: 'Nothing new is built. Three scenarios under time pressure, then the handover package.',
};

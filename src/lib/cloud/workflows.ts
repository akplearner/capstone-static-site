import type { KitSpec } from '../diagrams/kitSpec';
import type { CloudPlatform } from './model';

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

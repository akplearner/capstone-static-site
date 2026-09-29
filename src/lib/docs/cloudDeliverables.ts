import type { Column } from '../grc/templates';
import type { DeliverableDef, Field, FieldCheck, Section } from './types';
import { deriveChecks } from './derive';
import type { Predicate } from './predicate';

/**
 * The cloud capstones' documents (R87) — twelve, one per week, the same twelve
 * in the Azure and the AWS course.
 *
 * Each is a real industry document, not a worksheet in costume: a naming
 * standard, a solution architecture document with an ADR, an API spec, an ITIL
 * incident report, an access-control matrix, a network design, a runbook, a DR
 * plan, an IaC deployment record, a change request, a governance report and an
 * operational handover. Every one opens with the same Document control block
 * and closes with Evidence (a screenshot named by the evidence rule and a line
 * per component), and every section title names the role that fills it — one
 * team document a week, four independent pieces of work inside it.
 *
 * Both courses are built from ONE factory with a platform vocabulary, so the
 * structure cannot drift between them: only the service names differ, which is
 * the point of teaching the two side by side.
 */

export interface CloudVocab {
  courseId: string;
  /** Deliverable id prefix: 'az' | 'aws'. */
  key: string;
  cloud: string;
  scope: string;
  group: string;
  net: string;
  subnet: string;
  firewall: string;
  vm: string;
  hosting: string;
  fn: string;
  db: string;
  secrets: string;
  identity: string;
  monitor: string;
  alert: string;
  policy: string;
  audit: string;
  posture: string;
  remoteAdmin: string;
  patching: string;
  snapshot: string;
  objectRecovery: string;
  template: string;
  tool: string;
  preview: string;
  pipelineAction: string;
  oidc: string;
  region: string;
  calculator: string;
  standardW1: string;
  standardW11: string;
  /** Worked naming rows — the platform's own prefixes. */
  naming: { resource: string; pattern: string; example: string }[];
  /** Resource types offered in the component and inventory tables. */
  services: string[];
}

const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });

const STATUS = ['Draft', 'In review', 'Approved'];
const ROLES = ['Architect', 'Infrastructure', 'App / DevOps', 'Security & Ops'];
const RESULT = ['Pass', 'Fail', 'Fixed and retested'];
const SEVERITY = ['High', 'Medium', 'Low'];

/** The block every document opens with (ISO 9001-style document control). */
const control = (docId: string): Section => ({
  kind: 'fields',
  title: 'Document control · Architect',
  fields: [
    { field: 'doc_id', label: 'Document ID', type: 'text', required: true, placeholder: docId },
    { field: 'version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
    { field: 'doc_owner', label: 'Owner', type: 'text', required: true, placeholder: 'Architect — your name' },
    { field: 'approver', label: 'Approved by', type: 'text', placeholder: 'A teammate who reviewed it' },
    { field: 'doc_date', label: 'Date', type: 'date', required: true },
    { field: 'doc_status', label: 'Status', type: 'select', options: STATUS, required: true },
  ],
});

/** The block every document closes with. */
const evidence = (v: CloudVocab, week: number, shot: string): Section => ({
  kind: 'fields',
  title: 'Evidence · everyone',
  fields: [
    {
      field: 'evidence_shot',
      label: 'Deployment screenshot',
      type: 'fileref',
      required: true,
      placeholder: `20260915_Team01_${v.key}_w${week}-${shot}.png`,
      help: 'The screen that proves this week is real. Named by the evidence rule so it can be found later.',
    },
    {
      field: 'components',
      label: 'What each component does',
      type: 'area',
      required: true,
      placeholder: 'One line per resource you touched this week: its name, and why it exists.',
    },
  ],
});

const fields = (title: string, list: Field[]): Section => ({ kind: 'fields', title, fields: list });
const group = (
  name: string,
  label: string,
  columns: Column[],
  extra: { help?: string; seed?: Record<string, string>[] } = {}
): Section => ({ kind: 'group', group: { group: name, label, columns, ...extra } });

const done = (label: string, when: Predicate) => ({ label, when });
const controlDone = done('Document control is complete', { fields: ['doc_id', 'version', 'doc_owner', 'doc_date', 'doc_status'] });
const evidenceDone = done('The evidence screenshot is named and the components are explained', { fields: ['evidence_shot', 'components'] });

const CIDR = String.raw`^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}\/(1[6-9]|2[0-8])$`;

export function cloudDeliverables(v: CloudVocab): DeliverableDef[] {
  const id = (s: string) => `${v.key}_${s}`;
  const base = (num: number, slug: string, file: string, title: string, week: number, standard: string) => ({
    id: id(slug),
    courseId: v.courseId,
    num,
    file,
    title,
    owner: 'arch',
    shared: true,
    folder: `Week_${String(week).padStart(2, '0')}`,
    standard,
    weeks: [week],
    kind: 'form' as const,
    exportFormat: 'md' as const,
    visual: { kit: 'cloud' as const, week },
  });
  const withChecks = (d: DeliverableDef, extra: FieldCheck[] = []): DeliverableDef => ({
    ...d,
    checks: [...deriveChecks(d), ...extra],
  });

  const docs: DeliverableDef[] = [
    // 1 ─ Cloud Foundation & Naming Standard ───────────────────────────────
    {
      ...base(1, 'foundation', '01_Cloud_Foundation_and_Naming_Standard.md', 'Cloud Foundation & Naming Standard', 1, v.standardW1),
      feeds: [id('sad')],
      purpose: `The rules every later resource obeys: where it lives in ${v.cloud}, what it is called, how it is tagged, who does what, and the spending limit that stops a mistake costing money.`,
      howTo: 'Each role fills its own section. Agree the naming pattern first — everything built later is named from it.',
      buildSteps: [
        `Architect: agree the naming pattern and tags, set the $5 budget, draw Architecture v1.`,
        `Infrastructure: create the ${v.group.toLowerCase()} and ${v.net}; record their real names and address space.`,
        'App / DevOps: create the team repository and board; link them.',
        `Security & Ops: record the ${v.firewall} rules and who has which access.`,
      ],
      meaning: 'A good standard lets a stranger read any resource name and know what it is, whose it is and which environment it belongs to.',
      useIt: 'Every week reads it. The Week 11 policy enforces its tags automatically.',
      pitfalls: ['Names that differ from the pattern — the policy in Week 11 will flag them.', 'A budget with no email address — it alerts nobody.'],
      sections: [
        control('CAP-STD-001'),
        fields('Account and guardrails · Architect', [
          { field: 'scope_name', label: `${v.scope} name`, type: 'text', required: true, placeholder: v.key === 'az' ? 'Azure for Students' : 'capstone-team01 (account alias)' },
          { field: 'region', label: 'Primary region', type: 'text', required: true, placeholder: v.region },
          { field: 'budget', label: 'Monthly budget', type: 'number', unit: 'USD', required: true, placeholder: '5' },
          { field: 'budget_email', label: 'Budget alert goes to', type: 'text', required: true, placeholder: 'team01-alerts@school.edu' },
        ]),
        group('naming', 'Naming standard · Architect', [
          c('resource', 'Resource type', 'text'),
          c('pattern', 'Pattern', 'text'),
          c('example', 'Example (your team)', 'text'),
        ], { seed: v.naming.slice(0, 2), help: 'One row per resource type you will create. The first rows are examples.' }),
        group('tags', 'Required tags · Architect', [
          c('key', 'Tag key', 'text', { placeholder: 'owner' }),
          c('value', 'Example value', 'text', { placeholder: 'team01-lead' }),
          c('why', 'Why we need it', 'text', { placeholder: 'Who to ask before deleting it' }),
        ]),
        fields(`Landing zone · Infrastructure`, [
          { field: 'group_name', label: v.group, type: 'text', required: true, placeholder: v.key === 'az' ? 'rg-capstone-team01' : 'capstone-team01 (stack)' },
          { field: 'net_name', label: v.net, type: 'text', required: true, placeholder: v.key === 'az' ? 'vnet-capstone-team01' : 'vpc-capstone-team01' },
          { field: 'net_cidr', label: `${v.net} address space`, type: 'text', required: true, placeholder: '10.10.0.0/16' },
          { field: 'subnet_cidr', label: `First ${v.subnet}`, type: 'text', required: true, placeholder: '10.10.1.0/24' },
        ]),
        fields('Team tooling · App / DevOps', [
          { field: 'repo_url', label: 'Team repository', type: 'text', required: true, placeholder: 'https://github.com/org/capstone-team01' },
          { field: 'board_url', label: 'Task board', type: 'text', placeholder: 'GitHub Projects link' },
        ]),
        group('access', `Access and ${v.firewall} · Security & Ops`, [
          c('who', 'Who or what', 'text', { placeholder: 'Team admin' }),
          c('gets', 'Gets', 'text', { placeholder: `Contributor on the ${v.group.toLowerCase()}` }),
          c('why', 'Why', 'text', { placeholder: 'Builds the environment' }),
        ]),
        group('raci', 'RACI · Architect', [
          c('activity', 'Activity', 'text', { placeholder: 'Approve a change' }),
          c('responsible', 'Responsible', 'select', { options: ROLES }),
          c('accountable', 'Accountable', 'select', { options: ROLES }),
        ]),
        evidence(v, 1, 'budget'),
      ],
      dod: [
        controlDone,
        done('The budget is set and alerts a real address', { fields: ['budget', 'budget_email'] }),
        done('At least four resource types have a naming pattern', { group: 'naming', where: { filled: ['resource', 'pattern', 'example'] }, atLeast: 4 }),
        done('At least three required tags', { group: 'tags', where: { filled: ['key', 'why'] }, atLeast: 3 }),
        done('The landing zone is recorded with its address space', { fields: ['group_name', 'net_name', 'net_cidr', 'subnet_cidr'] }),
        done('The repository is linked', { fields: ['repo_url'] }),
        evidenceDone,
      ],
    },

    // 2 ─ Solution Architecture Document v1 + ADR ──────────────────────────
    {
      ...base(2, 'sad', '02_Solution_Architecture_Document.md', 'Solution Architecture Document', 2, 'ISO/IEC/IEEE 42010 · ADR'),
      feeds: [id('api')],
      purpose: `What the company runs in ${v.cloud}, what each part costs, and the first architecture decision with its reasons.`,
      howTo: 'Architect writes the components and the ADR; each builder adds the facts of what they deployed.',
      meaning: 'An architecture document someone else could build from — with the decisions and what was rejected.',
      useIt: 'Grows every week. Week 12 hands it over.',
      pitfalls: ['A cost column left blank — “free” is an answer, write it.', 'An ADR with no rejected option is a description, not a decision.'],
      sections: [
        control('CAP-SAD-001'),
        group('components', 'Components and cost · Architect', [
          c('service', 'Service', 'select', { options: v.services }),
          c('name', 'Resource name', 'text'),
          c('purpose', 'Purpose', 'text'),
          c('cost', 'Monthly cost', 'number', { unit: 'USD', help: `From the ${v.calculator}.` }),
        ]),
        fields('ADR-001 · Architect', [
          { field: 'adr_context', label: 'Context', type: 'area', required: true, placeholder: 'We need a public website with HTTPS for under $1 a month.' },
          { field: 'adr_decision', label: 'Decision', type: 'text', required: true, placeholder: v.hosting },
          { field: 'adr_rejected', label: 'Rejected option, and why', type: 'text', required: true, placeholder: 'A VM running nginx — patching and cost for a static page.' },
          { field: 'adr_consequence', label: 'Consequences', type: 'text', placeholder: 'No server-side code on the site; the API is separate.' },
        ]),
        fields(`Virtual machine facts · Infrastructure`, [
          { field: 'vm_name', label: 'VM name', type: 'text', required: true, placeholder: v.key === 'az' ? 'vm-tools-team01' : 'ec2-tools-team01' },
          { field: 'vm_size', label: 'Size', type: 'text', required: true, placeholder: v.key === 'az' ? 'Standard_B1s' : 't3.micro' },
          { field: 'vm_private_ip', label: 'Private IP', type: 'ipv4', required: true, placeholder: '10.10.1.4' },
          { field: 'vm_os', label: 'Operating system', type: 'text', placeholder: v.key === 'az' ? 'Ubuntu 22.04 LTS' : 'Amazon Linux 2023' },
        ]),
        fields('Website · App / DevOps', [
          { field: 'site_url', label: 'Website URL (HTTPS)', type: 'text', required: true, placeholder: v.key === 'az' ? 'https://stwebteam01abc123.z13.web.core.windows.net' : 'https://d111111abcdef8.cloudfront.net' },
          { field: 'redeploy', label: 'How you redeployed a change', type: 'text', placeholder: 'Edited index.html, uploaded, hard-refreshed.' },
        ]),
        group('ssh_tests', 'SSH access test · Security & Ops', [
          c('from', 'From', 'text', { placeholder: 'My laptop (my /32)' }),
          c('expected', 'Expected', 'select', { options: ['Allowed', 'Blocked'] }),
          c('result', 'Result', 'select', { options: RESULT }),
        ]),
        evidence(v, 2, 'website'),
      ],
      dod: [
        controlDone,
        done('At least four components, each with a monthly cost', { group: 'components', where: { filled: ['service', 'name', 'cost'] }, atLeast: 4 }),
        done('ADR-001 states the decision and what was rejected', { fields: ['adr_context', 'adr_decision', 'adr_rejected'] }),
        done('The VM is recorded with its size and private IP', { fields: ['vm_name', 'vm_size', 'vm_private_ip'] }),
        done('The website URL is HTTPS', { field: 'site_url', matches: '^https://' }),
        done('Both an allowed and a blocked SSH test', { group: 'ssh_tests', where: { filled: ['from', 'expected', 'result'] }, atLeast: 2, distinct: 'expected' }),
        evidenceDone,
      ],
    },

    // 3 ─ Application & API Design Specification ───────────────────────────
    {
      ...base(3, 'api', '03_Application_and_API_Design_Spec.md', 'Application & API Design Specification', 3, 'OpenAPI-style interface specification'),
      feeds: [id('incident')],
      purpose: 'The visitor-counter API: its endpoint, its data, who may call it, and where its secrets are not.',
      howTo: 'Each role documents the part they built. The Architect draws the request flow with real URLs.',
      meaning: 'A spec another developer could call the API from, without reading the code.',
      useIt: 'Week 4 monitors this endpoint; Week 5 removes its last secret.',
      pitfalls: ['A key or connection string pasted into the spec. Write where it is stored, never the value.'],
      sections: [
        control('CAP-API-001'),
        fields('Request flow · Architect', [
          { field: 'flow', label: 'Browser → API → database, with real URLs', type: 'area', required: true, placeholder: 'https://site → GET https://api/count → table visitors (id=site)' },
        ]),
        fields(`Data store · Infrastructure`, [
          { field: 'db_name', label: `${v.db} account / table`, type: 'text', required: true, placeholder: v.key === 'az' ? 'cosmos-capstone-team01 / capstone / visitors' : 'capstone-team01-visitors' },
          { field: 'partition_key', label: 'Partition key', type: 'text', required: true, placeholder: v.key === 'az' ? '/id' : 'id (String)' },
          { field: 'sample_item', label: 'Seed item', type: 'text', required: true, placeholder: '{ "id": "site", "count": 0 }' },
        ]),
        group('endpoints', `Endpoints · App / DevOps`, [
          c('method', 'Method', 'select', { options: ['GET', 'POST'] }),
          c('path', 'Path', 'text', { placeholder: v.key === 'az' ? '/api/visitorCount' : '/count' }),
          c('returns', 'Returns', 'text', { placeholder: '{ "count": 42 }' }),
          c('status', 'Status codes', 'text', { placeholder: '200, 500' }),
        ]),
        fields('CORS and secrets · Security & Ops', [
          { field: 'cors_origin', label: 'Allowed origin (only this)', type: 'text', required: true, placeholder: 'https://your-site-host' },
          { field: 'cors_negative', label: 'Negative test: a different origin', type: 'select', required: true, options: ['Blocked — as expected', 'Allowed — needs fixing'] },
          { field: 'secret_store', label: 'Where the database credential lives', type: 'text', required: true, placeholder: v.secrets },
          { field: 'no_secret_in_browser', label: 'Browser code contains no key', type: 'select', required: true, options: ['Confirmed', 'Not yet'] },
        ]),
        evidence(v, 3, 'counter'),
      ],
      dod: [
        controlDone,
        done('The request flow names real URLs', { field: 'flow', matches: 'https://' }),
        done('The data model has its partition key and a seed item', { fields: ['db_name', 'partition_key', 'sample_item'] }),
        done('At least one endpoint with its responses', { group: 'endpoints', where: { filled: ['method', 'path', 'returns'] }, atLeast: 1 }),
        done('CORS allows one origin, and another is blocked', { field: 'cors_negative', equals: 'Blocked — as expected' }),
        done('No key in the browser', { field: 'no_secret_in_browser', equals: 'Confirmed' }),
        evidenceDone,
      ],
    },

    // 4 ─ Monitoring & Incident Report ─────────────────────────────────────
    {
      ...base(4, 'incident', '04_Monitoring_and_Incident_Report.md', 'Monitoring & Incident Report', 4, 'ITIL 4 incident management'),
      feeds: [id('access')],
      purpose: 'What the team watches, what wakes someone up, and one incident worked from symptom to prevention.',
      howTo: 'Infrastructure and App fill the signals; Security & Ops writes the incident; the Architect reports cost.',
      meaning: 'Every alert has a threshold and an owner; the incident names the layer that failed and the evidence that proved it.',
      useIt: 'Week 12 replays this loop under pressure.',
      pitfalls: ['“Fixed it” with no root cause.', 'An alert that emails nobody.'],
      sections: [
        control('CAP-INC-001'),
        fields('Cost this week · Architect', [
          { field: 'spend', label: 'Spend to date', type: 'number', unit: 'USD', required: true, placeholder: '0.42' },
          { field: 'top_cost', label: 'Largest cost, and why', type: 'text', required: true, placeholder: 'The VM — it was left running overnight.' },
        ]),
        group('signals', `Signals · Infrastructure and App / DevOps`, [
          c('signal', 'Signal', 'text', { placeholder: v.key === 'az' ? 'Function HTTP 5xx' : 'Lambda Errors' }),
          c('where', 'Where it is measured', 'text', { placeholder: v.monitor }),
          c('threshold', 'Threshold', 'text', { placeholder: '> 0 in 5 minutes' }),
          c('action', 'Who is told, how', 'text', { placeholder: `${v.alert} → email` }),
        ]),
        fields('Incident record · Security & Ops', [
          { field: 'inc_symptom', label: 'Symptom (what the user saw)', type: 'text', required: true, placeholder: 'Counter shows “—” instead of a number.' },
          { field: 'inc_layer', label: 'Failing layer', type: 'select', required: true, options: ['Network', 'Identity / permissions', 'Application', 'Data', 'Configuration'] },
          { field: 'inc_evidence', label: 'Evidence', type: 'area', required: true, placeholder: 'The log line or query result that proved the layer.' },
          { field: 'inc_root', label: 'Root cause', type: 'text', required: true },
          { field: 'inc_fix', label: 'Fix, and the retest that proved it', type: 'text', required: true },
          { field: 'inc_prevent', label: 'Prevention', type: 'text', required: true, placeholder: 'An alert on this signal.' },
        ]),
        evidence(v, 4, 'alert'),
      ],
      dod: [
        controlDone,
        done('Spend is reported with its largest cost', { fields: ['spend', 'top_cost'] }),
        done('At least two signals, each with a threshold and an action', { group: 'signals', where: { filled: ['signal', 'threshold', 'action'] }, atLeast: 2 }),
        done('The incident has a layer, evidence, root cause, fix and prevention', { fields: ['inc_symptom', 'inc_layer', 'inc_evidence', 'inc_root', 'inc_fix', 'inc_prevent'] }),
        evidenceDone,
      ],
    },

    // 5 ─ Access Control Matrix & Secrets Register ─────────────────────────
    {
      ...base(5, 'access', '05_Access_Control_Matrix_and_Secrets_Register.md', 'Access Control Matrix & Secrets Register', 5, 'NIST SP 800-53 AC-6 (least privilege)'),
      feeds: [id('network')],
      purpose: 'Who and what can touch each resource, at what scope and why — and every secret, where it lives and who reads it.',
      howTo: 'The Architect owns the matrix; each role adds the grants and the tests they ran.',
      meaning: 'Every permission has a justification and the narrowest scope that works; a test proves at least one denial.',
      useIt: 'Week 11’s posture review and Week 12’s handover read it.',
      pitfalls: ['Owner or AdministratorAccess “to make it work”.', 'A secret value written in the register.'],
      sections: [
        control('CAP-ACM-001'),
        group('matrix', 'Access matrix · Architect and Infrastructure', [
          c('principal', 'Principal', 'text', { placeholder: v.key === 'az' ? 'grp-capstone-readers' : 'capstone-readonly (group)' }),
          c('role', 'Role / policy', 'text', { placeholder: v.key === 'az' ? 'Reader' : 'ReadOnlyAccess' }),
          c('scope', 'Scope', 'text', { placeholder: v.key === 'az' ? 'rg-capstone-team01' : 'Account' }),
          c('why', 'Justification', 'text'),
        ]),
        group('secrets', `Secrets register · App / DevOps`, [
          c('secret', 'Secret', 'text', { placeholder: 'Database access' }),
          c('store', 'Stored in', 'text', { placeholder: v.secrets }),
          c('consumer', 'Read by', 'text', { placeholder: v.identity }),
          c('rotation', 'Rotation', 'text', { placeholder: 'None needed — no secret (identity)' }),
        ]),
        group('denials', 'Access tests · Security & Ops', [
          c('who', 'Signed in as', 'text'),
          c('tried', 'Tried to', 'text', { placeholder: 'Delete the VM' }),
          c('expected', 'Expected', 'select', { options: ['Allowed', 'Denied'] }),
          c('result', 'Result', 'select', { options: RESULT }),
        ]),
        evidence(v, 5, 'identity'),
      ],
      dod: [
        controlDone,
        done('At least three grants, each justified', { group: 'matrix', where: { filled: ['principal', 'role', 'scope', 'why'] }, atLeast: 3 }),
        done('At least one secret, with its store and consumer', { group: 'secrets', where: { filled: ['secret', 'store', 'consumer'] }, atLeast: 1 }),
        done('A denied-access test', { group: 'denials', where: { column: 'expected', equals: 'Denied' }, atLeast: 1 }),
        evidenceDone,
      ],
    },

    // 6 ─ Network Design Document ──────────────────────────────────────────
    withChecks(
      {
        ...base(6, 'network', '06_Network_Design_Document.md', 'Network Design Document', 6, 'RFC 1918 addressing · segmentation'),
        feeds: [id('server')],
        purpose: `The address plan, the ${v.firewall} rules and the tested paths — and proof that no management port faces the internet.`,
        howTo: 'Infrastructure owns the address plan; Security & Ops the rules and tests; App traces the request paths.',
        meaning: 'Every subnet is a non-overlapping private range, every rule has a reason, and every rule is tested both ways.',
        useIt: 'Week 9’s template must match this plan exactly.',
        pitfalls: ['Overlapping ranges.', `A rule from 0.0.0.0/0 to port 22.`],
        sections: [
          control('CAP-NET-001'),
          group('plan', `Address plan · Infrastructure`, [
            c('name', 'Subnet', 'text', { placeholder: v.key === 'az' ? 'snet-app' : 'PublicSubnet' }),
            c('cidr', 'CIDR', 'text', { placeholder: '10.10.1.0/24' }),
            c('purpose', 'Holds', 'text', { placeholder: 'The tools VM' }),
            c('internet', 'Route to internet', 'select', { options: ['Yes — outbound', 'No'] }),
          ], { seed: [{ name: v.key === 'az' ? 'snet-app' : 'PublicSubnet', cidr: '10.10.1.0/24', purpose: 'Tools VM', internet: 'Yes — outbound' }] }),
          group('rules', `${v.firewall} rules · Security & Ops`, [
            c('dir', 'Direction', 'select', { options: ['Inbound', 'Outbound'] }),
            c('source', 'Source', 'text'),
            c('port', 'Port', 'text'),
            c('action', 'Action', 'select', { options: ['Allow', 'Deny'] }),
            c('why', 'Why', 'text'),
          ]),
          group('paths', 'Request paths · App / DevOps', [
            c('path', 'Path', 'text', { placeholder: `Admin → ${v.remoteAdmin} → VM` }),
            c('expected', 'Expected', 'select', { options: ['Reachable', 'Blocked'] }),
            c('result', 'Result', 'select', { options: RESULT }),
          ]),
          fields('Design summary · Architect', [
            { field: 'admin_path', label: 'How admins reach the VM now', type: 'text', required: true, placeholder: `${v.remoteAdmin} — no inbound port` },
            { field: 'prod_gap', label: 'What production would add', type: 'text', required: true, placeholder: 'NAT gateway; the VM in a private subnet.' },
          ]),
          evidence(v, 6, 'network'),
        ],
        dod: [
          controlDone,
          done('At least two subnets, each a private CIDR', { group: 'plan', where: { column: 'cidr', matches: '^10\\.' }, atLeast: 2 }),
          done('At least three rules, each with a reason', { group: 'rules', where: { filled: ['dir', 'source', 'port', 'action', 'why'] }, atLeast: 3 }),
          done('A path shown blocked as well as one reachable', { group: 'paths', where: { filled: ['path', 'expected', 'result'] }, atLeast: 2, distinct: 'expected' }),
          done('The admin path opens no port', { fields: ['admin_path', 'prod_gap'] }),
          evidenceDone,
        ],
      },
      [{ group: 'plan', column: 'cidr', rule: 'pattern', value: CIDR, hint: 'CIDR: an address and a /16–/28 prefix, e.g. 10.10.2.0/24' }]
    ),

    // 7 ─ Server Configuration & Maintenance Runbook ───────────────────────
    {
      ...base(7, 'server', '07_Server_Configuration_and_Runbook.md', 'Server Configuration & Maintenance Runbook', 7, 'CIS Ubuntu / Amazon Linux benchmark (reference)'),
      feeds: [id('dr')],
      purpose: 'The VM as it is really configured, how it is patched, what normal looks like, and the steps to fix it when it is not.',
      howTo: 'Each role fills its section from what they did on the VM this week.',
      meaning: 'A runbook a teammate on call could follow at 2 a.m. without asking you.',
      useIt: 'Week 8 restores this server from a snapshot and checks it against this page.',
      pitfalls: ['A baseline taken while you were running something heavy.', 'Runbook steps that assume your laptop.'],
      sections: [
        control('CAP-RUN-001'),
        fields('Sizing decision · Architect', [
          { field: 'size_now', label: 'Size now', type: 'text', required: true, placeholder: v.key === 'az' ? 'Standard_B1s' : 't3.micro' },
          { field: 'size_decision', label: 'Keep, grow or shrink — and why', type: 'text', required: true, placeholder: 'Keep: CPU under 10% at the baseline.' },
        ]),
        group('disks', 'Storage · Infrastructure', [
          c('disk', 'Disk', 'text', { placeholder: v.key === 'az' ? 'disk-data-tools-team01' : 'DataVolume (EBS)' }),
          c('size', 'Size', 'number', { unit: 'GB' }),
          c('mount', 'Mounted at', 'text', { placeholder: '/data' }),
        ]),
        fields(`Patching · App / DevOps`, [
          { field: 'patch_tool', label: 'Tool', type: 'text', required: true, placeholder: v.patching },
          { field: 'patch_result', label: 'Result of the last run', type: 'text', required: true, placeholder: '12 updates installed, 0 failed' },
        ]),
        group('baseline', 'Performance baseline · Security & Ops', [
          c('metric', 'Metric', 'text', { placeholder: 'CPU %' }),
          c('normal', 'Normal', 'text', { placeholder: '2–6 %' }),
          c('alert_at', 'Alert at', 'text', { placeholder: '> 80 % for 10 min' }),
        ]),
        group('runbook', 'Runbook · Security & Ops', [
          c('n', 'Step', 'number'),
          c('do', 'Do', 'text', { placeholder: 'Check the VM is running' }),
          c('expect', 'Expect', 'text', { placeholder: 'Status: Running' }),
        ]),
        evidence(v, 7, 'disk'),
      ],
      dod: [
        controlDone,
        done('A sizing decision with its reason', { fields: ['size_now', 'size_decision'] }),
        done('The data disk is recorded, mounted', { group: 'disks', where: { filled: ['disk', 'size', 'mount'] }, atLeast: 1 }),
        done('A patch run is recorded', { fields: ['patch_tool', 'patch_result'] }),
        done('At least three baseline metrics', { group: 'baseline', where: { filled: ['metric', 'normal', 'alert_at'] }, atLeast: 3 }),
        done('A runbook of at least four steps', { group: 'runbook', where: { filled: ['do', 'expect'] }, atLeast: 4 }),
        evidenceDone,
      ],
    },

    // 8 ─ Backup & Disaster Recovery Plan ──────────────────────────────────
    {
      ...base(8, 'dr', '08_Backup_and_Disaster_Recovery_Plan.md', 'Backup & Disaster Recovery Plan', 8, 'NIST SP 800-34 (BIA, RPO/RTO)'),
      feeds: [id('iac')],
      purpose: 'What matters most, how much of it the company can lose, how fast it must come back — and a timed restore that proves it.',
      howTo: 'The Architect sets the targets; Infrastructure and App each restore one thing; Security & Ops times the drill.',
      meaning: 'A plan is only real once a restore has been timed against its RTO.',
      useIt: 'Week 12’s recovery scenario is judged against these targets.',
      pitfalls: ['An RPO of “zero” for everything.', 'A backup nobody has restored.'],
      sections: [
        control('CAP-DRP-001'),
        group('bia', 'Business impact · Architect', [
          c('asset', 'Asset', 'text', { placeholder: 'Website content' }),
          c('criticality', 'Criticality', 'select', { options: SEVERITY }),
          c('rpo', 'RPO', 'duration'),
          c('rto', 'RTO', 'duration'),
          c('method', 'Protected by', 'text', { placeholder: v.objectRecovery }),
        ]),
        fields(`VM restore · Infrastructure`, [
          { field: 'snap_name', label: 'Snapshot', type: 'text', required: true, placeholder: v.snapshot },
          { field: 'restore_ok', label: 'Restored disk mounted and data present', type: 'select', required: true, options: ['Yes', 'No'] },
        ]),
        fields('Website restore · App / DevOps', [
          { field: 'object_restored', label: 'What you deleted and restored', type: 'text', required: true, placeholder: 'index.html — previous version' },
          { field: 'object_method', label: 'How', type: 'text', required: true, placeholder: v.objectRecovery },
        ]),
        fields('Drill · Security & Ops', [
          { field: 'drill_start', label: 'Drill started', type: 'text', required: true, placeholder: '14:02' },
          { field: 'drill_end', label: 'Service back', type: 'text', required: true, placeholder: '14:19' },
          { field: 'drill_met', label: 'RTO met', type: 'select', required: true, options: ['Yes', 'No — see lessons'] },
          { field: 'drill_lessons', label: 'Lessons', type: 'text', placeholder: 'Write the mount command into the runbook.' },
        ]),
        evidence(v, 8, 'restore'),
      ],
      dod: [
        controlDone,
        done('At least three assets with RPO and RTO', { group: 'bia', where: { filled: ['asset', 'criticality', 'rpo', 'rto', 'method'] }, atLeast: 3 }),
        done('The VM disk was restored from a snapshot', { field: 'restore_ok', equals: 'Yes' }),
        done('A website object was restored', { fields: ['object_restored', 'object_method'] }),
        done('The drill is timed against the RTO', { fields: ['drill_start', 'drill_end', 'drill_met'] }),
        evidenceDone,
      ],
    },

    // 9 ─ IaC Design & Deployment Record ───────────────────────────────────
    {
      ...base(9, 'iac', '09_IaC_Design_and_Deployment_Record.md', 'IaC Design & Deployment Record', 9, 'Well-Architected — operational excellence'),
      feeds: [id('change')],
      purpose: `How ${v.template} maps to the diagram, which values change between dev and prod, and the record of a validated, previewed deployment.`,
      howTo: 'The Architect maps template to diagram; Infrastructure inventories with the CLI; App deploys; Security & Ops validates parameters.',
      meaning: 'Anyone can rebuild the environment from this record and the repository alone.',
      useIt: 'Week 10 runs this deployment from a pipeline instead of a laptop.',
      pitfalls: [`Deploying without the ${v.preview} first.`, 'A secret in a parameter file.'],
      sections: [
        control('CAP-IAC-001'),
        group('map', 'Template map · Architect', [
          c('resource', 'Template resource', 'text', { placeholder: v.key === 'az' ? 'vm (Microsoft.Compute/virtualMachines)' : 'ToolsInstance (AWS::EC2::Instance)' }),
          c('node', 'Diagram node', 'text', { placeholder: v.key === 'az' ? 'Virtual machine' : 'Amazon EC2' }),
          c('param', 'Parameter it reads', 'text', { placeholder: 'teamId' }),
        ]),
        fields('Portal vs code · Architect', [
          { field: 'portal_vs_code', label: 'One thing code does that the portal cannot', type: 'text', required: true, placeholder: 'Rebuild the whole environment identically in minutes.' },
        ]),
        group('inventory', 'CLI inventory · Infrastructure', [
          c('name', 'Resource', 'text'),
          c('type', 'Type', 'text'),
          c('tagged', 'Tagged per standard', 'select', { options: ['Yes', 'No'] }),
        ]),
        fields(`Deployment · App / DevOps`, [
          { field: 'starter_filled', label: 'Starter blanks filled', type: 'number', required: true, placeholder: '7' },
          { field: 'preview_result', label: `${v.preview} result`, type: 'text', required: true, placeholder: v.key === 'az' ? 'Resource changes: 26 to create.' : '34 resources to Add' },
          { field: 'deploy_result', label: 'Deployment result', type: 'text', required: true, placeholder: v.key === 'az' ? 'provisioningState: Succeeded' : 'CREATE_COMPLETE' },
        ]),
        group('params', 'Parameters · Security & Ops', [
          c('name', 'Parameter', 'text', { placeholder: 'environment' }),
          c('dev', 'dev value', 'text', { placeholder: 'dev' }),
          c('prod', 'prod value', 'text', { placeholder: 'prod' }),
          c('secret', 'Secret?', 'select', { options: ['No', 'Yes — supplied at deploy, never in the file'] }),
        ]),
        evidence(v, 9, 'deployment'),
      ],
      dod: [
        controlDone,
        done('At least five resources mapped to diagram nodes', { group: 'map', where: { filled: ['resource', 'node'] }, atLeast: 5 }),
        done('The portal-vs-code answer', { fields: ['portal_vs_code'] }),
        done('The inventory lists at least five resources', { group: 'inventory', where: { filled: ['name', 'type'] }, atLeast: 5 }),
        done('Previewed, then deployed', { fields: ['starter_filled', 'preview_result', 'deploy_result'] }),
        done('At least three parameters with dev and prod values', { group: 'params', where: { filled: ['name', 'dev', 'prod'] }, atLeast: 3 }),
        evidenceDone,
      ],
    },

    // 10 ─ Change Request (RFC) & Release Record ───────────────────────────
    {
      ...base(10, 'change', '10_Change_Request_and_Release_Record.md', 'Change Request & Release Record', 10, 'ITIL 4 change enablement'),
      feeds: [id('governance')],
      purpose: 'One change, requested, approved, released by a pipeline with no stored keys, and rolled back once on purpose.',
      howTo: 'Architect writes the RFC; Infrastructure protects the branch; App builds the pipeline; Security & Ops sets OIDC and tests rollback.',
      meaning: 'A change that anyone can audit: who asked, who approved, what ran, and how it was undone.',
      useIt: 'Week 12’s app-failure scenario is fixed through this pipeline.',
      pitfalls: ['A cloud access key stored as a repository secret.', 'A rollback plan never tried.'],
      sections: [
        control('CAP-RFC-001'),
        fields('Request for change · Architect', [
          { field: 'rfc_what', label: 'Change', type: 'text', required: true, placeholder: 'Add the owner tag to every resource.' },
          { field: 'rfc_risk', label: 'Risk', type: 'select', required: true, options: SEVERITY },
          { field: 'rfc_rollback', label: 'Rollback plan', type: 'text', required: true, placeholder: 'Revert the commit; the pipeline redeploys the previous template.' },
          { field: 'rfc_approver', label: 'Approved by', type: 'text', required: true },
        ]),
        fields('Repository controls · Infrastructure', [
          { field: 'branch_rule', label: 'Branch protection on main', type: 'text', required: true, placeholder: '1 review required; no direct pushes' },
          { field: 'environment', label: 'Deployment environment', type: 'text', placeholder: 'prod — required reviewer' },
        ]),
        group('runs', `Pipeline runs · App / DevOps`, [
          c('run', 'Run', 'text', { placeholder: '#14' }),
          c('stage', 'Stages', 'text', { placeholder: `validate → ${v.preview} → deploy` }),
          c('result', 'Result', 'select', { options: RESULT }),
        ]),
        fields('Keyless access and rollback · Security & Ops', [
          { field: 'oidc', label: 'How the pipeline signs in', type: 'text', required: true, placeholder: v.oidc },
          { field: 'no_keys', label: 'No cloud keys stored in GitHub', type: 'select', required: true, options: ['Confirmed', 'Not yet'] },
          { field: 'rollback_test', label: 'Rollback test', type: 'text', required: true, placeholder: 'Broke the template on purpose; the run failed; reverted; green.' },
        ]),
        evidence(v, 10, 'pipeline'),
      ],
      dod: [
        controlDone,
        done('The RFC has a risk, a rollback plan and an approver', { fields: ['rfc_what', 'rfc_risk', 'rfc_rollback', 'rfc_approver'] }),
        done('Main is protected', { fields: ['branch_rule'] }),
        done('At least one pipeline run passed', { group: 'runs', where: { column: 'result', equals: 'Pass' }, atLeast: 1 }),
        done('The pipeline signs in without stored keys', { field: 'no_keys', equals: 'Confirmed' }),
        done('A rollback was tested', { fields: ['rollback_test'] }),
        evidenceDone,
      ],
    },

    // 11 ─ Governance, Security & Cost Report ──────────────────────────────
    {
      ...base(11, 'governance', '11_Governance_Security_and_Cost_Report.md', 'Governance, Security & Cost Report', 11, v.standardW11),
      feeds: [id('handover')],
      purpose: 'Rules the platform enforces for you, what the audit log says happened, the posture findings, and where the money went.',
      howTo: 'Each role fills its section from the tool it ran this week.',
      meaning: 'Findings are ranked and owned; the cost is broken down by service; the policy is proved by a denial.',
      useIt: 'Its open findings become the handover’s risk register.',
      pitfalls: ['A finding with no owner.', 'A policy assigned but never tested.'],
      sections: [
        control('CAP-GOV-001'),
        group('cost', 'Cost by service · Architect', [
          c('service', 'Service', 'select', { options: v.services }),
          c('spend', 'Spend', 'number', { unit: 'USD' }),
          c('action', 'Action', 'text', { placeholder: 'Deallocate the VM overnight' }),
        ]),
        fields(`Policy · Infrastructure`, [
          { field: 'policy_name', label: 'Policy / rule', type: 'text', required: true, placeholder: v.policy },
          { field: 'policy_test', label: 'Test: a non-compliant resource', type: 'select', required: true, options: ['Denied / flagged — as expected', 'Allowed — needs fixing'] },
        ]),
        group('audit', `Audit events · App / DevOps`, [
          c('when', 'When', 'text'),
          c('who', 'Who', 'text'),
          c('what', 'Operation', 'text', { placeholder: v.key === 'az' ? 'Microsoft.Compute/virtualMachines/write' : 'RunInstances' }),
        ]),
        group('findings', `Posture findings · Security & Ops`, [
          c('finding', 'Finding', 'text'),
          c('severity', 'Severity', 'select', { options: SEVERITY }),
          c('owner', 'Owner', 'select', { options: ROLES }),
          c('remediation', 'Remediation', 'text'),
        ]),
        evidence(v, 11, 'posture'),
      ],
      dod: [
        controlDone,
        done('Spend broken down by at least three services', { group: 'cost', where: { filled: ['service', 'spend'] }, atLeast: 3 }),
        done('The policy is proved by a denial', { field: 'policy_test', equals: 'Denied / flagged — as expected' }),
        done('At least three audit events', { group: 'audit', where: { filled: ['when', 'who', 'what'] }, atLeast: 3 }),
        done('At least three findings, each owned', { group: 'findings', where: { filled: ['finding', 'severity', 'owner', 'remediation'] }, atLeast: 3 }),
        evidenceDone,
      ],
    },

    // 12 ─ Operational Handover Package (capstone) ─────────────────────────
    {
      ...base(12, 'handover', '12_Operational_Handover_Package.md', 'Operational Handover Package', 12, 'ITIL 4 service transition'),
      capstone: true,
      purpose: 'Everything a new team needs to run the company’s cloud on Monday: the services, the runbooks, the risks, and proof it survives failure.',
      howTo: 'Each role runs one scenario and records it; the Architect assembles the package and signs it off.',
      meaning: 'A stranger could operate, recover and change this environment from this package and the repository alone.',
      sections: [
        control('CAP-HOP-001'),
        group('catalogue', 'Service catalogue · Architect', [
          c('service', 'Service', 'text', { placeholder: 'Website' }),
          c('url', 'URL / endpoint', 'text'),
          c('owner', 'Owner', 'select', { options: ROLES }),
          c('runbook', 'Runbook', 'text', { placeholder: '07 — Runbook, section 2' }),
        ]),
        group('risks', 'Risk register · Architect', [
          c('risk', 'Risk', 'text'),
          c('likelihood', 'Likelihood', 'select', { options: SEVERITY }),
          c('mitigation', 'Mitigation', 'text'),
        ]),
        group('scenarios', 'Scenario outcomes · Infrastructure, App / DevOps, Security & Ops', [
          c('scenario', 'Scenario', 'select', { options: ['Recover: rebuild from the template', 'App failure fixed through CI', 'Security incident contained'] }),
          c('time', 'Time to recover', 'duration'),
          c('result', 'Result', 'select', { options: RESULT }),
          c('lesson', 'Lesson', 'text'),
        ]),
        fields('Sign-off · Architect', [
          { field: 'ready', label: 'Final checklist complete', type: 'select', required: true, options: ['Yes', 'No'] },
          { field: 'signoff', label: 'Accepted by (instructor or receiving team)', type: 'text', required: true },
        ]),
        evidence(v, 12, 'handover'),
      ],
      dod: [
        controlDone,
        done('At least four services catalogued with owners and runbooks', { group: 'catalogue', where: { filled: ['service', 'owner', 'runbook'] }, atLeast: 4 }),
        done('At least three risks with mitigations', { group: 'risks', where: { filled: ['risk', 'mitigation'] }, atLeast: 3 }),
        done('All three scenarios recorded', { group: 'scenarios', where: { filled: ['scenario', 'result'] }, atLeast: 3, distinct: 'scenario' }),
        done('Signed off', { all: [{ field: 'ready', equals: 'Yes' }, { fields: ['signoff'] }] }),
        evidenceDone,
      ],
    },
  ];
  return docs;
}

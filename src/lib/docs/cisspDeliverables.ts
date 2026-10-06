import { Column } from '../grc/templates';
import { DeliverableDef } from './types';

// Deliverable forms for the CISSP capstone (R101). Course-scoped
// (`courseId: 'cissp'`) so they never surface on another course. The eight
// domain sheets D1–D8, the release note, the questionnaire response, the
// control statements, and the System Security Plan (the capstone). The sheets
// grow across six releases; the dod checks that carry a `week` only count from
// that release on. See seed/cissp.ts.

// Local column helper (mirrors definitions.ts; kept local to avoid a cycle).
const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });

const ALL = [1, 2, 3, 4, 5, 6];

export const CISSP_DELIVERABLES: DeliverableDef[] = [
  // 1 — D1 Governance & Risk ────────────────────────────────────────────────
  {
    id: 'cissp_d1', courseId: 'cissp', feeds: ['cissp_d6', 'cissp_release_note'],
    num: 1, file: '01_Governance_and_Risk.md', title: 'D1 Governance & Risk', owner: 'govrisk',
    folder: '01_Governance', standard: 'NIST CSF (Govern) · ISO 27001', framework: 'NIST_CSF', weeks: ALL,
    kind: 'form', exportFormat: 'md',
    purpose: 'The policy, the risk register, the legal and supplier registers, and the AI and federal route briefs.',
    howTo: 'v1: ten shall statements and five risks. v2: a scored register and screening. v3: suppliers and STRIDE. v4: AI rules. v5: the ethics record. v6: the federal route brief.',
    sections: [
      {
        kind: 'fields', title: 'Policy',
        fields: [
          { field: 'policy', label: 'Policy “shall” statements', type: 'area', required: true, placeholder: 'Ten statements. Access shall require multi-factor authentication. …' },
          { field: 'approver', label: 'Approver and owner', type: 'text', required: true, placeholder: 'CEO approves; Head of Security owns' },
          { field: 'obligations', label: 'Legal and contract obligations', type: 'area', required: true, placeholder: 'Three, each with the reason it applies.' },
          { field: 'federal_route', label: 'Federal route brief (v6)', type: 'area', placeholder: 'The two routes, which applies now, business prerequisites.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'risks', label: 'Risk register',
          columns: [
            c('risk', 'Risk', 'text', { placeholder: 'Shared admin login (S-2)' }),
            c('owner', 'Owner', 'text', { placeholder: 'Identity & Operations' }),
            c('likelihood', 'Likelihood (v2)', 'select', { options: ['', '1', '2', '3', '4', '5'] }),
            c('impact', 'Impact (v2)', 'select', { options: ['', '1', '2', '3', '4', '5'] }),
            c('treatment', 'Treatment', 'text', { placeholder: 'Individual accounts + MFA' }),
            c('residual', 'Residual (v2)', 'text', { placeholder: 'Low' }),
          ],
          help: 'Seeded with the ten planted weaknesses. v1 needs five with a treatment; v2 scores every row.',
          seed: [
            { risk: 'No approved security policy; a two-page “IT rules” document from 2019 (S-1)', owner: 'Governance', likelihood: '', impact: '', treatment: 'Write and approve the policy', residual: '' },
            { risk: 'One shared administrator login for the new cloud account (S-2)', owner: 'Identity & Operations', likelihood: '', impact: '', treatment: 'Individual accounts + MFA', residual: '' },
            { risk: 'MFA is optional on the cloud console and on email (S-3)', owner: 'Identity & Operations', likelihood: '', impact: '', treatment: '', residual: '' },
            { risk: 'The office, the old server and the cloud workloads can all reach each other (S-4)', owner: 'Architecture', likelihood: '', impact: '', treatment: '', residual: '' },
            { risk: 'Backups of the old server never restore-tested; cloud backups not set up (S-5)', owner: 'Identity & Operations', likelihood: '', impact: '', treatment: '', residual: '' },
            { risk: 'The software team deploys straight to production (S-6)', owner: 'Architecture', likelihood: '', impact: '', treatment: '', residual: '' },
            { risk: 'Logs kept 14 days, never reviewed (S-7)', owner: 'Identity & Operations', likelihood: '', impact: '', treatment: '', residual: '' },
            { risk: 'Subcontracted technicians onboarded without screening; they receive building access codes (S-8)', owner: 'Governance', likelihood: '', impact: '', treatment: '', residual: '' },
            { risk: 'No inventory of open-source components in the Hub (S-9)', owner: 'Architecture', likelihood: '', impact: '', treatment: '', residual: '' },
            { risk: 'The old scheduling server runs an operating system past end of support (S-10)', owner: 'Operations', likelihood: '', impact: '', treatment: '', residual: '' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'weaknesses',
          label: 'Planted weaknesses (S-1–S-10)',
          help: 'The ten conditions the scenario plants, the domain and the release that closes each. Mark the status and the ledger evidence.',
          columns: [
            c('id', 'ID', 'text', { placeholder: 'S-2' }),
            c('condition', 'Condition', 'text', { placeholder: 'One shared administrator login' }),
            c('domain', 'Domain', 'text', { placeholder: 'D5' }),
            c('closes', 'Closed in', 'text', { placeholder: 'v3' }),
            c('status', 'Status', 'select', { options: ['', 'Open', 'Closed', 'Accepted'] }),
            c('evidence', 'Ledger evidence', 'text', { placeholder: 'results/mfa-v3.txt · 7f3a…' }),
          ],
          seed: [
            { id: 'S-1', condition: 'No approved security policy; a two-page “IT rules” document from 2019', domain: 'D1', closes: 'v1', status: '', evidence: '' },
            { id: 'S-2', condition: 'One shared administrator login for the new cloud account', domain: 'D5', closes: 'v3', status: '', evidence: '' },
            { id: 'S-3', condition: 'MFA is optional on the cloud console and on email', domain: 'D5', closes: 'v3', status: '', evidence: '' },
            { id: 'S-4', condition: 'The office, the old server and the cloud workloads can all reach each other', domain: 'D4', closes: 'v3', status: '', evidence: '' },
            { id: 'S-5', condition: 'Backups of the old server never restore-tested; cloud backups not set up', domain: 'D7', closes: 'v4', status: '', evidence: '' },
            { id: 'S-6', condition: 'The software team deploys straight to production', domain: 'D8', closes: 'v3', status: '', evidence: '' },
            { id: 'S-7', condition: 'Logs kept 14 days, never reviewed', domain: 'D7', closes: 'v4', status: '', evidence: '' },
            { id: 'S-8', condition: 'Subcontracted technicians onboarded without screening; they receive building access codes', domain: 'D1', closes: 'v2', status: '', evidence: '' },
            { id: 'S-9', condition: 'No inventory of open-source components in the Hub', domain: 'D8', closes: 'v3', status: '', evidence: '' },
            { id: 'S-10', condition: 'The old scheduling server runs an operating system past end of support', domain: 'D2, D8', closes: 'v3', status: '', evidence: '' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'procedures',
          label: 'Procedures (PR1–PR33)',
          help: 'Each states who runs it, when, and the record it leaves. Owned by the release shown.',
          columns: [
            c('id', 'ID', 'text', { placeholder: 'PR2' }),
            c('procedure', 'Procedure', 'text', { placeholder: 'Joiner and leaver' }),
            c('release', 'First needed', 'text', { placeholder: 'v1' }),
            c('owner', 'Who', 'text', { placeholder: 'Identity & Operations' }),
            c('when', 'When', 'text', { placeholder: 'Within one business day of departure' }),
            c('record', 'Record', 'text', { placeholder: 'Keycloak admin event log' }),
          ],
          seed: [
            { id: 'PR1', procedure: 'Policy exception', release: 'v1', owner: '', when: '', record: '' },
            { id: 'PR2', procedure: 'Joiner and leaver', release: 'v1', owner: '', when: '', record: '' },
            { id: 'PR3', procedure: 'Incident first hour and customer notice', release: 'v1', owner: '', when: '', record: '' },
            { id: 'PR4', procedure: 'Change approval', release: 'v1', owner: '', when: '', record: '' },
            { id: 'PR5', procedure: 'Risk assessment and risk acceptance', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR6', procedure: 'Personnel screening and onboarding', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR7', procedure: 'Data handling, retention, and sanitization', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR8', procedure: 'Key management and rotation', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR9', procedure: 'Rule base review', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR10', procedure: 'Remote access', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR11', procedure: 'Privileged access and break-glass', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR12', procedure: 'Access review', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR13', procedure: 'Incident response (seven steps)', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR14', procedure: 'Backup and restore', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR15', procedure: 'Emergency change and security impact analysis', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR16', procedure: 'Vulnerability and patch management', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR17', procedure: 'Release, gate failure, and rollback', release: 'v3', owner: '', when: '', record: '' },
            { id: 'PR18', procedure: 'Acquired software assessment', release: 'v3', owner: '', when: '', record: '' },
            { id: 'PR19', procedure: 'Supplier due diligence', release: 'v3', owner: '', when: '', record: '' },
            { id: 'PR20', procedure: 'Secret and key rotation for pipeline and APIs', release: 'v3', owner: '', when: '', record: '' },
            { id: 'PR21', procedure: 'Log review and detection handling', release: 'v4', owner: '', when: '', record: '' },
            { id: 'PR22', procedure: 'Contingency activation, recovery, reconstitution', release: 'v4', owner: '', when: '', record: '' },
            { id: 'PR23', procedure: 'Model provider outage fallback', release: 'v4', owner: '', when: '', record: '' },
            { id: 'PR24', procedure: 'AI incident (data leak through prompt injection)', release: 'v4', owner: '', when: '', record: '' },
            { id: 'PR25', procedure: 'Investigation and chain of custody', release: 'v4', owner: '', when: '', record: '' },
            { id: 'PR26', procedure: 'Physical operations and personnel safety', release: 'v2', owner: '', when: '', record: '' },
            { id: 'PR27', procedure: 'Model and prompt change control', release: 'v4', owner: '', when: '', record: '' },
            { id: 'PR28', procedure: 'Control assessment (examine, interview, test)', release: 'v4', owner: '', when: '', record: '' },
            { id: 'PR29', procedure: 'Finding remediation and closure', release: 'v5', owner: '', when: '', record: '' },
            { id: 'PR30', procedure: 'Customer questionnaire response', release: 'v5', owner: '', when: '', record: '' },
            { id: 'PR31', procedure: 'Federal incident reporting', release: 'v6', owner: '', when: '', record: '' },
            { id: 'PR32', procedure: 'Handling of federal information', release: 'v6', owner: '', when: '', record: '' },
            { id: 'PR33', procedure: 'Data migration, cutover, and decommission', release: 'v3', owner: '', when: '', record: '' },
          ],
        },
      },
    ],
    dod: [
      { label: 'Ten policy statements, an approver and the obligations', when: { fields: ['policy', 'approver', 'obligations'] } },
      { label: 'The four v1 procedures say who, when and the record', when: { group: 'procedures', where: { filled: ['owner', 'when', 'record'] }, atLeast: 4 } },
      { label: 'Every planted weakness has a status and evidence by v4', when: { group: 'weaknesses', every: { filled: ['status', 'evidence'] } }, week: 4 },
      { label: 'Every procedure says who, when and the record by v6', when: { group: 'procedures', every: { filled: ['owner', 'when', 'record'] } }, week: 6 },
      { label: 'At least five risks with an owner and a treatment', when: { group: 'risks', where: { filled: ['owner', 'treatment'] }, atLeast: 5 } },
      { label: 'Every risk is scored by v2', when: { group: 'risks', every: { filled: ['likelihood', 'impact', 'residual'] } }, week: 2 },
      { label: 'The federal route brief is written by v6', when: { fields: ['federal_route'] }, week: 6 },
    ],
  },

  // 2 — D2 Assets & Data ────────────────────────────────────────────────────
  {
    id: 'cissp_d2', courseId: 'cissp', feeds: ['cissp_d3', 'cissp_d5'],
    num: 2, file: '02_Assets_and_Data.md', title: 'D2 Assets & Data', owner: 'govrisk',
    folder: '02_Assets', standard: 'NIST CSF (Identify) · SP 800-88', framework: 'NIST_CSF', weeks: ALL,
    kind: 'form', exportFormat: 'csv',
    purpose: 'The asset inventory, the classification and handling standard, categorization and the federal information map.',
    howTo: 'v1: fifteen assets and four levels. v2: 25 with custodian and end-of-support. v3: cloud and keys. v4: categorization. v6: the federal map.',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'assets', label: 'Asset inventory',
          columns: [
            c('asset', 'Asset', 'text', { placeholder: 'Old scheduling server' }),
            c('owner', 'Owner', 'text', { placeholder: 'Operations' }),
            c('classification', 'Classification', 'select', { options: ['Public', 'Internal', 'Confidential', 'Restricted'] }),
            c('location', 'Location', 'text', { placeholder: 'On-premises rack' }),
            c('eos', 'End of support (v2)', 'text', { placeholder: '2023-10 (S-10)' }),
          ],
          seed: [
            { asset: 'Old scheduling server', owner: 'Operations', classification: 'Confidential', location: 'On-premises', eos: '' },
            { asset: 'Service Hub database', owner: 'Architecture', classification: 'Restricted', location: 'Cloud account', eos: '' },
          ],
        },
      },
      {
        kind: 'fields', title: 'Standards',
        fields: [
          { field: 'classification', label: 'Four classification levels, one handling rule each', type: 'area', required: true, placeholder: 'Restricted: encrypted at rest, access logged. …' },
          { field: 'categorization', label: 'System categorization (v4)', type: 'text', placeholder: 'High-water mark: Moderate; baseline chosen' },
          { field: 'federal_map', label: 'Federal information map (v6)', type: 'area', placeholder: 'What it is, where it lives, owner.' },
        ],
      },
    ],
    dod: [
      { label: 'At least fifteen assets, each with exactly one owner', when: { group: 'assets', where: { filled: ['asset', 'owner'] }, atLeast: 15 } },
      { label: 'Four classification levels with handling rules', when: { fields: ['classification'] } },
      { label: 'The system is categorized by v4', when: { fields: ['categorization'] }, week: 4 },
      { label: 'The federal information map is written by v6', when: { fields: ['federal_map'] }, week: 6 },
    ],
  },

  // 3 — D3 Architecture ─────────────────────────────────────────────────────
  {
    id: 'cissp_d3', courseId: 'cissp', feeds: ['cissp_d6', 'cissp_d4', 'cissp_d8'],
    num: 3, file: '03_Architecture.md', title: 'D3 Architecture', owner: 'archnet',
    folder: '03_Architecture', standard: 'NIST CSF (Protect) · SP 800-53', framework: 'NIST_800_53', weeks: ALL, gate: 3,
    kind: 'form', exportFormat: 'md',
    purpose: 'The architecture with trust boundaries, shared responsibility, cryptography, the landing zone and the AI overlay.',
    howTo: 'v1: boundaries and five shared-responsibility rows. v2: cryptography and design principles. v3: the landing zone. v4: the AI gateway. v6: the federal mapping.',
    sections: [
      {
        kind: 'fields', title: 'Architecture',
        fields: [
          { field: 'boundaries', label: 'Architecture with trust boundaries', type: 'area', required: true, placeholder: 'Office, cloud account, suppliers; the boundaries between them.' },
          { field: 'crypto', label: 'Cryptography standard (v2)', type: 'area', placeholder: 'Algorithms, key sizes, owner, rotation, destruction.' },
          { field: 'landing_zone', label: 'Cloud landing zone (v3)', type: 'area', placeholder: 'Accounts, regions, environment separation.' },
          { field: 'ai_overlay', label: 'AI gateway and tenant separation (v4)', type: 'area', placeholder: 'The gateway zone; one customer’s data separated from another’s.' },
          { field: 'federal_map', label: 'Federal control mapping (v6)', type: 'area', placeholder: 'Encryption and boundary controls mapped, with gaps.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'shared', label: 'Shared responsibility',
          columns: [
            c('control', 'Control', 'text', { placeholder: 'Patching the model API' }),
            c('owner', 'Owner', 'select', { options: ['Cloud provider', 'Model provider', 'Company', 'Customer'] }),
          ],
          seed: [
            { control: 'Physical data-centre security', owner: 'Cloud provider' },
            { control: 'Patching the language model API', owner: 'Model provider' },
            { control: 'Gateway configuration', owner: 'Company' },
            { control: 'Encryption keys for the Hub database', owner: 'Company' },
            { control: 'Who at the customer may read building records', owner: 'Customer' },
          ],
        },
      },
    ],
    dod: [
      { label: 'Trust boundaries and five shared-responsibility rows', when: { all: [{ fields: ['boundaries'] }, { group: 'shared', where: { filled: ['control', 'owner'] }, atLeast: 5 }] } },
      { label: 'The cryptography standard is written by v2', when: { fields: ['crypto'] }, week: 2 },
      { label: 'The cloud landing zone is drawn by v3', when: { fields: ['landing_zone'] }, week: 3 },
      { label: 'The AI gateway and tenant separation by v4', when: { fields: ['ai_overlay'] }, week: 4 },
    ],
  },

  // 4 — D4 Network ──────────────────────────────────────────────────────────
  {
    id: 'cissp_d4', courseId: 'cissp', feeds: ['cissp_d6'],
    num: 4, file: '04_Network.md', title: 'D4 Network', owner: 'archnet',
    folder: '04_Network', standard: 'NIST CSF (Protect) · SP 800-207', framework: 'NIST_800_53', weeks: ALL,
    kind: 'form', exportFormat: 'csv',
    purpose: 'The zone model, the allowed-flows table, the rule base, remote access and the AI gateway zone.',
    howTo: 'v1: zones, flows and default deny. v2: the rule base and protocols. v3: segmentation as built. v4: the gateway zone. v6: the federal mapping.',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'flows', label: 'Allowed flows (default deny)',
          columns: [
            c('from', 'From zone', 'text', { placeholder: 'Office' }),
            c('to', 'To zone', 'text', { placeholder: 'Cloud management' }),
            c('port', 'Port / protocol', 'text', { placeholder: '443/tcp' }),
            c('owner', 'Owner (v2)', 'text', { placeholder: 'Architecture' }),
            c('review', 'Review date (v2)', 'text', { placeholder: '2026-12' }),
          ],
          seed: [
            { from: 'Office', to: 'Cloud management', port: '443/tcp', owner: '', review: '' },
            { from: 'Technicians', to: 'Service Hub', port: '443/tcp', owner: '', review: '' },
          ],
        },
      },
      {
        kind: 'fields', title: 'Statements',
        fields: [
          { field: 'default_deny', label: 'Default-deny statement', type: 'area', required: true, placeholder: 'All flows are denied except those listed above.' },
          { field: 'protocols', label: 'Approved and banned protocols (v2)', type: 'area', placeholder: 'Approved: TLS 1.3, SSH. Banned: Telnet, SMBv1.' },
          { field: 'gateway_zone', label: 'AI gateway zone (v4)', type: 'text', placeholder: 'The sole path to the model API.' },
        ],
      },
    ],
    dod: [
      { label: 'Ten or fewer allowed flows and a default-deny statement', when: { all: [{ group: 'flows', where: { filled: ['from', 'to', 'port'] }, atLeast: 1 }, { fields: ['default_deny'] }] } },
      { label: 'Approved and banned protocols by v2', when: { fields: ['protocols'] }, week: 2 },
      { label: 'Every flow has an owner and review date by v2', when: { group: 'flows', every: { filled: ['owner', 'review'] } }, week: 2 },
      { label: 'The AI gateway zone is named by v4', when: { fields: ['gateway_zone'] }, week: 4 },
    ],
  },

  // 5 — D5 Identity ─────────────────────────────────────────────────────────
  {
    id: 'cissp_d5', courseId: 'cissp', feeds: ['cissp_d6'],
    num: 5, file: '05_Identity.md', title: 'D5 Identity', owner: 'idops',
    folder: '05_Identity', standard: 'NIST CSF (Protect) · SP 800-63-4', framework: 'NIST_800_53', weeks: ALL,
    kind: 'form', exportFormat: 'md',
    purpose: 'The role and access matrix, separation of duties, the authentication strategy, privileged access and machine identities.',
    howTo: 'v1: six roles, the MFA rule, joiner and leaver. v2: the matrix and privileged access. v3: individual accounts and federation. v4: machine identities. v5: a timed disablement.',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'access', label: 'Role and access matrix',
          columns: [
            c('role', 'Role', 'text', { placeholder: 'Dispatcher' }),
            c('system', 'System', 'text', { placeholder: 'Service Hub' }),
            c('access', 'Access', 'select', { options: ['None', 'Read', 'Write', 'Admin'] }),
          ],
          seed: [
            { role: 'Dispatcher', system: 'Service Hub', access: 'Write' },
            { role: 'Auditor', system: 'Logs', access: 'Read' },
          ],
        },
      },
      {
        kind: 'fields', title: 'Standards',
        fields: [
          { field: 'mfa', label: 'MFA rule and no-shared-accounts rule', type: 'area', required: true, placeholder: 'MFA for all administrative access; no shared accounts.' },
          { field: 'jml', label: 'Joiner and leaver, with time limits', type: 'area', required: true, placeholder: 'Access removed within one business day of departure.' },
          { field: 'federation', label: 'Federation (v3)', type: 'text', placeholder: 'SAML with the customer identity provider' },
          { field: 'machine_ids', label: 'Machine identity register (v4)', type: 'area', placeholder: 'Agents, service accounts, API keys: owner, least privilege, rotation.' },
        ],
      },
    ],
    dod: [
      { label: 'Six roles against systems, the MFA and shared-account rules', when: { all: [{ group: 'access', where: { filled: ['role', 'system', 'access'] }, atLeast: 6 }, { fields: ['mfa'] }] } },
      { label: 'Joiner and leaver with time limits', when: { fields: ['jml'] } },
      { label: 'Federation is recorded by v3', when: { fields: ['federation'] }, week: 3 },
      { label: 'The machine identity register exists by v4', when: { fields: ['machine_ids'] }, week: 4 },
    ],
  },

  // 6 — D6 Assessment ───────────────────────────────────────────────────────
  {
    id: 'cissp_d6', courseId: 'cissp', feeds: ['cissp_ssp'],
    num: 6, file: '06_Assessment.md', title: 'D6 Assessment', owner: 'govrisk',
    folder: '06_Assessment', standard: 'NIST CSF Profiles · SP 800-115', framework: 'NIST_CSF', weeks: ALL, gate: 2,
    kind: 'form', exportFormat: 'md',
    purpose: 'The CSF Current and Target Profiles, the maturity scores, the metrics, and the assessment report.',
    howTo: 'v1: the Current Profile and the first score. v2: the Target Profile and metrics. v3–v4: rescore. v5: the assessment report. v6: the basic-safeguarding self-assessment.',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'scores', label: 'Maturity scores (0–4 per domain)',
          columns: [
            c('domain', 'Domain', 'text', { placeholder: 'D1 Governance' }),
            c('score', 'Score', 'select', { options: ['0', '1', '2', '3', '4'] }),
            c('reason', 'Reason / evidence', 'text', { placeholder: 'Policy approved; ledger 01_…' }),
          ],
          seed: [
            { domain: 'D1 Governance', score: '1', reason: 'Policy written' },
            { domain: 'D2 Assets', score: '1', reason: 'Inventory written' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'profiles', label: 'CSF Current and Target Profiles',
          help: 'One row per CSF 2.0 function: where the company is (v1) and where it must be (v2).',
          columns: [
            c('function', 'Function', 'text', { placeholder: 'Govern' }),
            c('current', 'Current Profile', 'text', { placeholder: 'Policy drafted, not approved' }),
            c('target', 'Target Profile (v2)', 'text', { placeholder: 'Policy approved, reviewed yearly' }),
          ],
          seed: [
            { function: 'Govern', current: '', target: '' },
            { function: 'Identify', current: '', target: '' },
            { function: 'Protect', current: '', target: '' },
            { function: 'Detect', current: '', target: '' },
            { function: 'Respond', current: '', target: '' },
            { function: 'Recover', current: '', target: '' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'basics', label: 'Basic safeguarding self-assessment (v6)',
          help: 'The fifteen requirements of FAR 52.204-21(b)(1). Met with a ledger entry, or not met with a dated plan.',
          columns: [
            c('requirement', 'Requirement', 'text', { placeholder: '(vi) Authenticate users before access' }),
            c('met', 'Met?', 'select', { options: ['', 'Met', 'Not met'] }),
            c('ledger', 'Ledger entry or dated plan', 'text', { placeholder: '05_Identity.md · 7f3a… or plan: 2027-01' }),
          ],
          seed: [
            { requirement: '(i) Limit system access to authorized users, processes acting for them, or devices', met: '', ledger: '' },
            { requirement: '(ii) Limit system access to the transactions and functions authorized users may execute', met: '', ledger: '' },
            { requirement: '(iii) Verify and control connections to and use of external systems', met: '', ledger: '' },
            { requirement: '(iv) Control information posted or processed on publicly accessible systems', met: '', ledger: '' },
            { requirement: '(v) Identify system users, processes acting for users, or devices', met: '', ledger: '' },
            { requirement: '(vi) Authenticate the identities of those users, processes or devices before allowing access', met: '', ledger: '' },
            { requirement: '(vii) Sanitize or destroy media holding federal contract information before disposal or reuse', met: '', ledger: '' },
            { requirement: '(viii) Limit physical access to systems, equipment and operating environments to authorized individuals', met: '', ledger: '' },
            { requirement: '(ix) Escort and monitor visitors; keep physical access logs; manage physical access devices', met: '', ledger: '' },
            { requirement: '(x) Monitor, control and protect communications at external and key internal boundaries', met: '', ledger: '' },
            { requirement: '(xi) Put publicly accessible components on subnetworks separated from internal networks', met: '', ledger: '' },
            { requirement: '(xii) Identify, report and correct system flaws in a timely manner', met: '', ledger: '' },
            { requirement: '(xiii) Provide protection from malicious code at appropriate locations', met: '', ledger: '' },
            { requirement: '(xiv) Update malicious-code protection when new releases are available', met: '', ledger: '' },
            { requirement: '(xv) Scan systems periodically, and scan files from external sources in real time', met: '', ledger: '' },
          ],
        },
      },
      {
        kind: 'fields', title: 'Assessment',
        fields: [
          { field: 'total', label: 'Total score (of 32)', type: 'text', required: true, placeholder: '8' },
          { field: 'metrics', label: 'Metrics (v2): six, formula, source, target', type: 'area', placeholder: 'MFA coverage = admins with MFA / all admins; target 100%.' },
          { field: 'report', label: 'Assessment report (v5)', type: 'area', placeholder: '16 controls: result, ledger evidence, SOC 2 criterion; three findings.' },
          { field: 'basic_171', label: 'Basic safeguarding + SP 800-171 gaps (v6)', type: 'area', placeholder: '15 requirements met or not; gap analysis by family.' },
        ],
      },
    ],
    dod: [
      { label: 'A score per domain and the total', when: { all: [{ group: 'scores', where: { filled: ['domain', 'score'] }, atLeast: 8 }, { fields: ['total'] }] } },
      { label: 'A Current Profile for all six functions', when: { group: 'profiles', where: { filled: ['function', 'current'] }, atLeast: 6 } },
      { label: 'A Target Profile and six metrics by v2', when: { all: [{ group: 'profiles', every: { filled: ['target'] } }, { fields: ['metrics'] }] }, week: 2 },
      { label: 'The assessment report is written by v5', when: { fields: ['report'] }, week: 5 },
      { label: 'All fifteen basics met with evidence, or not met with a dated plan, by v6', when: { all: [{ group: 'basics', where: { filled: ['met', 'ledger'] }, atLeast: 15 }, { fields: ['basic_171'] }] }, week: 6 },
    ],
  },

  // 7 — D7 Operations ───────────────────────────────────────────────────────
  {
    id: 'cissp_d7', courseId: 'cissp', feeds: ['cissp_d6'],
    num: 7, file: '07_Operations.md', title: 'D7 Operations', owner: 'idops',
    folder: '07_Operations', standard: 'NIST CSF (Detect, Respond, Recover) · SP 800-61', framework: 'NIST_800_53', weeks: ALL, gate: 4,
    kind: 'form', exportFormat: 'md',
    purpose: 'Logging, incident response, business impact, backup, contingency, the AI incident playbook and federal reporting.',
    howTo: 'v1: logging, the incident first hour, backup. v2: the seven-step plan and recovery targets. v4: detection, restore and contingency. v5: the tabletop. v6: federal reporting.',
    sections: [
      {
        kind: 'fields', title: 'Incident and logging',
        fields: [
          { field: 'logging', label: 'What is logged, and for how long', type: 'area', required: true, placeholder: 'v1: what and how long. v2: 12 months, reviewed.' },
          { field: 'incident', label: 'Incident response', type: 'area', required: true, placeholder: 'v1: first hour + 72-hour notice. v2: seven steps with roles.' },
          { field: 'bia', label: 'Business impact analysis (v2)', type: 'area', placeholder: 'What each process does, who depends on it, what an hour down costs.' },
          { field: 'contingency', label: 'Contingency + AI playbook (v4)', type: 'area', placeholder: 'Activation, recovery, reconstitution; model-provider outage fallback.' },
          { field: 'tabletop', label: 'Tabletop after-action report (v5)', type: 'area', placeholder: 'Four injects; three improvements with owners.' },
          { field: 'federal_report', label: 'Federal incident reporting (v6)', type: 'area', placeholder: 'Who reports, to whom, how, time limit.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'targets', label: 'Recovery targets (v2)',
          help: 'The four processes with maximum tolerable downtime, recovery time, recovery point and work recovery time. RTO + WRT must fit inside MTD.',
          columns: [
            c('process', 'Process', 'text', { placeholder: 'Dispatch' }),
            c('mtd', 'MTD', 'text', { placeholder: '8h' }),
            c('rto', 'RTO', 'text', { placeholder: '4h' }),
            c('rpo', 'RPO', 'text', { placeholder: '1h' }),
            c('wrt', 'WRT', 'text', { placeholder: '2h' }),
          ],
          seed: [
            { process: 'Dispatch (work orders and technician assignment)', mtd: '', rto: '', rpo: '', wrt: '' },
            { process: 'Service assistant (customer and technician answers)', mtd: '', rto: '', rpo: '', wrt: '' },
            { process: 'Invoicing', mtd: '', rto: '', rpo: '', wrt: '' },
            { process: 'Building sensor monitoring', mtd: '', rto: '', rpo: '', wrt: '' },
          ],
        },
      },
    ],
    dod: [
      { label: 'Logging and the incident first hour with the 72-hour notice', when: { fields: ['logging', 'incident'] } },
      { label: 'A business impact analysis with four sets of recovery targets by v2', when: { all: [{ fields: ['bia'] }, { group: 'targets', where: { filled: ['process', 'mtd', 'rto', 'rpo', 'wrt'] }, atLeast: 4 }] }, week: 2 },
      { label: 'The contingency plan and AI playbook by v4', when: { fields: ['contingency'] }, week: 4 },
      { label: 'The tabletop after-action report by v5', when: { fields: ['tabletop'] }, week: 5 },
    ],
  },

  // 8 — D8 Software & Change ─────────────────────────────────────────────────
  {
    id: 'cissp_d8', courseId: 'cissp', feeds: ['cissp_d6'],
    num: 8, file: '08_Software_and_Change.md', title: 'D8 Software & Change', owner: 'archnet',
    folder: '08_Software', standard: 'NIST SP 800-218 (SSDF) · OWASP', framework: 'NIST_800_53', weeks: ALL,
    kind: 'form', exportFormat: 'md',
    purpose: 'The change standard, the pipeline, baselines, the component list, and the migration cutover plan.',
    howTo: 'v1: the change rule and a pipeline outline. v2: a gate per phase and a coding checklist. v3: the pipeline as built, the component list and the migration plan.',
    sections: [
      {
        kind: 'fields', title: 'Change and pipeline',
        fields: [
          { field: 'change_rule', label: 'Change rule', type: 'area', required: true, placeholder: 'The approver is never the author.' },
          { field: 'pipeline', label: 'Pipeline with security gates', type: 'area', required: true, placeholder: 'v1: outline with one gate. v2: a gate per phase. v3: as built.' },
          { field: 'checklist', label: 'Secure-coding checklist (v2)', type: 'area', placeholder: 'Ten items.' },
          { field: 'components', label: 'Component list (v3)', type: 'area', placeholder: 'CycloneDX; S-9 closed.' },
          { field: 'migration', label: 'Migration cutover and rollback (v3)', type: 'area', placeholder: 'Steps, rollback trigger, decommission record.' },
        ],
      },
    ],
    dod: [
      { label: 'The change rule and a pipeline with a gate', when: { fields: ['change_rule', 'pipeline'] } },
      { label: 'A secure-coding checklist by v2', when: { fields: ['checklist'] }, week: 2 },
      { label: 'The component list and migration plan by v3', when: { fields: ['components', 'migration'] }, week: 3 },
    ],
  },

  // 9 — Release Note ────────────────────────────────────────────────────────
  {
    id: 'cissp_release_note', courseId: 'cissp', feeds: ['cissp_ssp'],
    num: 9, file: '09_Release_Note.md', title: 'Release Note', owner: 'govrisk',
    folder: '09_Release_Notes', standard: 'Release record', framework: 'NIST_CSF', weeks: ALL, gate: 1,
    kind: 'form', exportFormat: 'md',
    purpose: 'One page per release: what shipped, the score, open risks, and the CEO’s signature.',
    howTo: 'Fill one block per release. The score is out of 32; the CEO signs each one.',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'releases', label: 'Releases',
          columns: [
            c('version', 'Release', 'select', { options: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6'] }),
            c('shipped', 'What shipped', 'text', { placeholder: 'Eight sheets documented' }),
            c('score', 'Score (of 32)', 'text', { placeholder: '8' }),
            c('open', 'Open risks', 'text', { placeholder: 'S-5, S-7 open' }),
            c('signed', 'CEO signed', 'text', { placeholder: '[name] · 2026-10-06' }),
          ],
          seed: [{ version: 'v1', shipped: '', score: '', open: '', signed: '' }],
        },
      },
    ],
    dod: [
      { label: 'At least one release is signed off', when: { group: 'releases', where: { filled: ['version', 'score', 'signed'] }, atLeast: 1 } },
    ],
  },

  // 10 — Customer Questionnaire Response ─────────────────────────────────────
  {
    id: 'cissp_questionnaire', courseId: 'cissp', feeds: ['cissp_ssp'],
    num: 10, file: '10_Questionnaire_Response.md', title: 'Customer Questionnaire Response', owner: 'govrisk',
    folder: '10_Questionnaire', standard: 'SOC 2 Trust Services Criteria', framework: 'SOC_2', weeks: [5, 6], gate: 5,
    kind: 'form', exportFormat: 'csv',
    purpose: 'The customer’s sixteen questions, each answered with a ledger reference. No “yes” without evidence.',
    howTo: 'Answer all sixteen. Every “Yes” must cite a ledger entry.',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'answers', label: 'The sixteen questions',
          help: 'Two per domain, from the customer’s questionnaire.',
          columns: [
            c('n', 'Q', 'text', { placeholder: '9' }),
            c('domain', 'Domain', 'text', { placeholder: 'D5' }),
            c('q', 'Question', 'text', { placeholder: 'Is MFA enforced for all administrative access?' }),
            c('answer', 'Answer', 'select', { options: ['', 'Yes', 'Partial', 'No'] }),
            c('evidence', 'Ledger reference', 'text', { placeholder: '05_Identity.md · 7f3a…' }),
          ],
          seed: [
            { n: '1', domain: 'D1', q: 'Is there a security policy approved by executive management and reviewed yearly?', answer: '', evidence: '' },
            { n: '2', domain: 'D1', q: 'Is a risk assessment performed at least yearly?', answer: '', evidence: '' },
            { n: '3', domain: 'D2', q: 'Is there an inventory of systems and data holding our information?', answer: '', evidence: '' },
            { n: '4', domain: 'D2', q: 'Is our data securely deleted at contract end?', answer: '', evidence: '' },
            { n: '5', domain: 'D3', q: 'Is our data encrypted in transit and at rest with managed keys?', answer: '', evidence: '' },
            { n: '6', domain: 'D3', q: 'Is there a documented architecture that separates our data from other customers’?', answer: '', evidence: '' },
            { n: '7', domain: 'D4', q: 'Is the production network segmented with default-deny rules?', answer: '', evidence: '' },
            { n: '8', domain: 'D4', q: 'Is remote administrative access controlled and recorded?', answer: '', evidence: '' },
            { n: '9', domain: 'D5', q: 'Is MFA enforced for all administrative access?', answer: '', evidence: '' },
            { n: '10', domain: 'D5', q: 'Is access removed within one business day of departure and reviewed quarterly?', answer: '', evidence: '' },
            { n: '11', domain: 'D6', q: 'Are vulnerability scans run at least monthly with remediation time limits?', answer: '', evidence: '' },
            { n: '12', domain: 'D6', q: 'Has an independent assessment been performed in the last 12 months?', answer: '', evidence: '' },
            { n: '13', domain: 'D7', q: 'Is there an incident plan, and will you notify us within 72 hours?', answer: '', evidence: '' },
            { n: '14', domain: 'D7', q: 'Are backups tested by restore at least yearly?', answer: '', evidence: '' },
            { n: '15', domain: 'D8', q: 'Are production changes reviewed, tested, and approved before release?', answer: '', evidence: '' },
            { n: '16', domain: 'D8', q: 'Do you keep an inventory of third-party and open-source components?', answer: '', evidence: '' },
          ],
        },
      },
    ],
    dod: [
      { label: 'All sixteen questions are answered', when: { group: 'answers', where: { filled: ['q', 'answer'] }, atLeast: 16 } },
      { label: 'Every “Yes” cites a ledger entry', when: { group: 'answers', where: { column: 'answer', equals: 'Yes' }, every: { filled: ['evidence'] } } },
    ],
  },

  // 11 — Control Statements ─────────────────────────────────────────────────
  {
    id: 'cissp_controls', courseId: 'cissp', feeds: ['cissp_ssp'],
    num: 11, file: '11_Control_Statements.md', title: 'Control Statements', owner: 'govrisk',
    folder: '11_Controls', standard: 'NIST SP 800-53 Rev. 5', framework: 'NIST_800_53', weeks: [2, 3, 4, 5, 6],
    kind: 'form', exportFormat: 'csv',
    purpose: 'Sixteen control statements, two per domain. Each says who does what, how often, with what, and the record kept.',
    howTo: 'v2: eight statements. v3–v4: sixteen. v5: each assessed with a result.',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'controls', label: 'Control statements',
          columns: [
            c('id', 'Control', 'text', { placeholder: 'IA-2 Identification and authentication' }),
            c('domain', 'Domain', 'text', { placeholder: 'D5' }),
            c('release', 'Written in', 'text', { placeholder: 'v2' }),
            c('statement', 'Who does what, how often, record', 'text', { placeholder: 'Identity enforces MFA on every admin login; access logs kept 12 months.' }),
            c('result', 'Assessed result (v5)', 'text', { placeholder: 'Satisfied — ledger 05_…' }),
          ],
          seed: [
            { id: 'PM-1 Information security program plan', domain: 'D1', release: 'v2', statement: '', result: '' },
            { id: 'RA-3 Risk assessment', domain: 'D1', release: 'v4', statement: '', result: '' },
            { id: 'MP-6 Media sanitization', domain: 'D2', release: 'v2', statement: '', result: '' },
            { id: 'RA-2 Security categorization', domain: 'D2', release: 'v4', statement: '', result: '' },
            { id: 'SC-13 Cryptographic protection', domain: 'D3', release: 'v2', statement: '', result: '' },
            { id: 'SA-8 Security engineering principles', domain: 'D3', release: 'v3', statement: '', result: '' },
            { id: 'SC-7 Boundary protection', domain: 'D4', release: 'v2', statement: '', result: '' },
            { id: 'AC-17 Remote access', domain: 'D4', release: 'v3', statement: '', result: '' },
            { id: 'IA-2 Identification and authentication', domain: 'D5', release: 'v2', statement: '', result: '' },
            { id: 'AC-2 Account management', domain: 'D5', release: 'v3', statement: '', result: '' },
            { id: 'RA-5 Vulnerability monitoring and scanning', domain: 'D6', release: 'v2', statement: '', result: '' },
            { id: 'CA-2 Control assessments', domain: 'D6', release: 'v4', statement: '', result: '' },
            { id: 'IR-4 Incident handling', domain: 'D7', release: 'v2', statement: '', result: '' },
            { id: 'CP-9 System backup', domain: 'D7', release: 'v4', statement: '', result: '' },
            { id: 'CM-3 Configuration change control', domain: 'D8', release: 'v2', statement: '', result: '' },
            { id: 'SA-11 Developer testing and evaluation', domain: 'D8', release: 'v3', statement: '', result: '' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least eight control statements', when: { group: 'controls', where: { filled: ['id', 'statement'] }, atLeast: 8 } },
      { label: 'Sixteen control statements by v4', when: { group: 'controls', where: { filled: ['id', 'statement'] }, atLeast: 16 }, week: 4 },
      { label: 'Every control has an assessed result by v5', when: { group: 'controls', every: { filled: ['result'] } }, week: 5 },
    ],
  },

  // 12 — System Security Plan & Traceability (capstone) ──────────────────────
  {
    id: 'cissp_ssp', courseId: 'cissp', capstone: true,
    num: 12, file: '12_System_Security_Plan.md', title: 'System Security Plan & Traceability', owner: 'govrisk',
    folder: '12_SSP', standard: 'NIST SP 800-171 · FAR 52.204-21', framework: 'NIST_800_171', weeks: [6],
    kind: 'template', exportFormat: 'md',
    purpose: 'The assembled System Security Plan, the traceability table linking every control to evidence, and the decision memo.',
    howTo: 'Assemble the plan, fill the traceability table so no ledger cell is empty, and write the decision memo with each accepted risk and condition.',
    source: 'All eight sheets at v6 and the ledger',
    sections: [
      {
        kind: 'fields', title: 'The plan',
        fields: [
          { field: 'decision', label: 'Decision memo', type: 'area', required: true, placeholder: 'Approve with conditions; each condition with a date.' },
          { field: 'basic_evidence', label: 'Basic safeguarding: evidence or dated plan', type: 'area', required: true, placeholder: 'All 15 requirements: met with a ledger entry, or a dated plan.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'trace', label: 'Traceability table',
          help: 'Control, NIST CSF category, SP 800-171, SOC 2, exam objective, ledger entry.',
          columns: [
            c('control', 'Control', 'text', { placeholder: 'IA-2' }),
            c('csf', 'NIST CSF', 'text', { placeholder: 'PR.AA' }),
            c('c171', 'SP 800-171', 'text', { placeholder: '3.5.3' }),
            c('soc2', 'SOC 2', 'text', { placeholder: 'CC6.1' }),
            c('ledger', 'Ledger entry', 'text', { placeholder: '05_Identity.md · 7f3a…' }),
          ],
        },
      },
    ],
    dod: [
      { label: 'The decision memo and the basic-safeguarding evidence are written', when: { fields: ['decision', 'basic_evidence'] } },
      { label: 'The traceability table has no empty ledger cell', when: { group: 'trace', every: { filled: ['control', 'ledger'] }, atLeast: 1 } },
    ],
  },
];

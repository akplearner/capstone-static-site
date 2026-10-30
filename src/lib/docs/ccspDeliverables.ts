import { Column } from '../grc/templates';
import { DeliverableDef, decisionDod, type DecisionBlock } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * The records the CCSP Cloud Assurance produces.
 *
 * A four-person team secures one small cloud application across its lifecycle
 * and governs it. Eight forms, one job each, in the order the work happens:
 *
 *   1 Engagement & Scope Register   the account, the scope, the identity        W0
 *   2 Architecture & Responsibility shared responsibility, the architecture     W1
 *   3 Legal, Risk & Compliance      obligations mapped, residency, risk         W1
 *   4 Data Security Record          classify, encrypt, own the key ← decision   W2
 *   5 Platform & Network Record     the baseline and the segments               W3
 *   6 Application Security Record    secrets and dependencies                    W3
 *   7 Operations & Incident Log     monitoring, change, the incident            W4
 *   8 Cloud Security Handover       control-to-evidence  ← capstone             W4
 *
 * FORM 7 IS THE ONE THE COURSE IS ABOUT. An incident is worked one theory and
 * one containment action per row, with the actions that did not contain it kept.
 *
 * Every student fills every form (`shared: true`); `owner` is the focus that
 * leads the record and reviews it. Course-scoped (`courseId: 'ccsp'`).
 */

const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });
const YN = ['Yes', 'No'];

/** The one design decision: how the data is encrypted and who holds the key. */
const KEY_DECISION: DecisionBlock = {
  id: 'key',
  title: 'The key-ownership decision',
  subject: 'architecture',
  prompt: 'The classified data must be encrypted. Which key protects it, and who controls it?',
  options: [
    { id: 'provider', label: 'A provider-managed key', help: 'Simplest; but no control over the key policy, rotation or who can decrypt.' },
    { id: 'customer', label: 'A customer-managed key', help: 'You set the policy, rotation and who may use it; a little more to run.' },
    { id: 'byok', label: 'Hold-your-own-key (BYOK/HYOK)', help: 'You hold the key material; most control, most operational burden.' },
  ],
  questions: [
    { field: 'key_why', label: 'Why that, for this data', type: 'area', required: true, placeholder: 'Customer-managed: the data is regulated PII, so the obligation requires us to control the key policy.' },
    { field: 'key_rejected', label: 'The option rejected, and why', type: 'text', required: true, placeholder: 'Provider-managed: no control over the policy the regulation requires us to prove.' },
    { field: 'key_risk', label: 'The risk accepted', type: 'text', placeholder: 'A customer key is one more thing to rotate and not lose; rotation and retention handle it.' },
  ],
};

const CCSP_FORMS: DeliverableDef[] = [
  // 1 — Engagement & Scope Register ──────────────────────────────────────────────
  {
    id: 'ccsp_setup',
    courseId: 'ccsp',
    num: 1,
    file: '01_Engagement_and_Scope_Register.md',
    title: 'Engagement & Scope Register',
    owner: 'grc',
    shared: true,
    folder: '00_Setup',
    standard: 'Scope & account hygiene · ISO/IEC 27001 A.5 · ISC2 CCSP domain 1',
    weeks: [0],
    kind: 'checklist',
    exportFormat: 'md',
    feeds: ['ccsp_architecture'],
    purpose:
      'What the engagement covers: the account with its owner MFA and budget guard, the scoped identity for daily work, and the application, the data and the obligation that drive every control.',
    howTo:
      'Record the account and owner MFA, the budget alert, the scoped identity, and the scope: the application, its data and the obligation.',
    buildSteps: [
      'The account id and that the owner has MFA.',
      'A $1 budget alert, with the email it goes to.',
      'The scoped identity for daily work.',
      'The scope: the application, the data and the obligation.',
      'The application name and the evidence folder path.',
    ],
    meaning: 'A good register says who can spend and act, and names the boundary every later control is judged against.',
    useIt: 'The architecture record builds on the scope; the handover closes the account against it.',
    pitfalls: [
      'Daily work as the account owner.',
      'A scope with no obligation named.',
      'A key pasted into the record. Owners and MFA state only.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The account and scope',
        fields: [
          { field: 'account_id', label: 'Account id (last 12)', type: 'text', required: true, placeholder: '123456789012' },
          { field: 'owner_mfa', label: 'The account owner has MFA on', type: 'select', required: true, options: YN },
          { field: 'budget', label: 'A $1 budget alert exists', type: 'select', required: true, options: YN },
          { field: 'budget_email', label: 'The budget alert goes to', type: 'text', required: true, placeholder: 'ccsp-t1@…' },
          { field: 'application', label: 'Application in scope', type: 'text', required: true, placeholder: 'quote-api' },
          { field: 'data', label: 'Data it holds', type: 'text', required: true, placeholder: 'customer PII and quotes' },
          { field: 'obligation', label: 'The obligation that drives the controls', type: 'text', required: true, placeholder: 'GDPR and SOC-2' },
        ],
      },
      {
        kind: 'fields',
        title: 'The team',
        fields: [
          { field: 'identity', label: 'Scoped identity for daily work', type: 'text', required: true, placeholder: 'analyst (MFA on)' },
          { field: 'folder', label: 'Evidence folder path', type: 'text', required: true, placeholder: 'ccsp-t1/' },
          { field: 'focus', label: 'Who leads which focus', type: 'area', required: true, placeholder: 'Data: Alex · Platform: Sam · AppSec: Jo · GRC: Priya' },
        ],
      },
    ],
    dod: [
      { label: 'The account is named with owner MFA on', when: { all: [{ fields: ['account_id'] }, { field: 'owner_mfa', equals: 'Yes' }] } },
      { label: 'A budget alert exists with an email', when: { all: [{ field: 'budget', equals: 'Yes' }, { fields: ['budget_email'] }] } },
      { label: 'The scope names the application, the data and the obligation', when: { fields: ['application', 'data', 'obligation'] } },
      { label: 'The team has a scoped identity and four focuses', when: { fields: ['identity', 'focus'] } },
    ],
  },

  // 2 — Architecture & Responsibility ─────────────────────────────────────────────
  {
    id: 'ccsp_architecture',
    courseId: 'ccsp',
    num: 2,
    file: '02_Architecture_and_Responsibility.md',
    title: 'Architecture & Responsibility',
    owner: 'platform',
    shared: true,
    folder: '01_Identify',
    standard: 'Cloud architecture & shared responsibility · ISC2 CCSP domain 1 · ISO/IEC 27017',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['ccsp_legal', 'ccsp_data'],
    purpose:
      'How the application is built and who secures each layer: the shared-responsibility line for the service model in scope, and the reference architecture with every component, its trust zone and the data that crosses each boundary.',
    howTo:
      'Mark each layer provider or customer, show one layer moving between service models, and list every component with its trust zone and boundary crossings.',
    buildSteps: [
      'Each layer marked provider or customer for the model in scope.',
      'One layer shown moving owner across IaaS, PaaS and SaaS.',
      'Every component with its trust zone.',
      'Each boundary crossing and the data that crosses it.',
    ],
    meaning: 'The responsibility line says which controls are yours; the architecture says where they go. Together they are the map the whole build follows.',
    useIt: 'The legal register maps obligations onto it; the data and platform records secure its components.',
    pitfalls: [
      'Securing a layer the provider owns, or missing one you own.',
      'A component with no trust zone.',
      'A boundary crossing with no data named.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'layers',
          label: 'The shared-responsibility line',
          help: 'One row per layer, for the service model in scope.',
          columns: [
            c('layer', 'Layer', 'text', { placeholder: 'data' }),
            c('owner', 'Secured by', 'select', { options: ['customer', 'provider', 'shared'] }),
          ],
          seed: [{ layer: 'data', owner: 'customer' }],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'components',
          label: 'The reference architecture',
          columns: [
            c('component', 'Component', 'text', { placeholder: 'api' }),
            c('zone', 'Trust zone', 'select', { options: ['public', 'app', 'private'] }),
            c('crosses', 'Data that crosses to it', 'text', { placeholder: 'quote requests from the edge' }),
          ],
          seed: [{ component: 'db', zone: 'private', crosses: 'encrypted writes from the api' }],
        },
      },
    ],
    dod: [
      { label: 'Every layer is marked provider, customer or shared', when: { group: 'layers', atLeast: 4, every: { filled: ['layer', 'owner'] } } },
      { label: 'Every component has a trust zone and a crossing', when: { group: 'components', atLeast: 4, every: { filled: ['component', 'zone', 'crosses'] } } },
    ],
  },

  // 3 — Legal, Risk & Compliance ──────────────────────────────────────────────────
  {
    id: 'ccsp_legal',
    courseId: 'ccsp',
    num: 3,
    file: '03_Legal_Risk_and_Compliance.md',
    title: 'Legal, Risk & Compliance',
    owner: 'grc',
    shared: true,
    folder: '01_Identify',
    standard: 'Legal, risk & compliance · ISC2 CCSP domain 6 · ISO/IEC 27001 Clause 6',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['ccsp_handover'],
    purpose:
      'What the law and the contracts require, mapped to controls: each obligation against the control that satisfies it, the data-residency rule, and the top risks with an owner each.',
    howTo:
      'Map each obligation to a control from the catalogue, state the residency rule and its jurisdiction, and rate the top risks with an owner.',
    buildSteps: [
      'Each obligation mapped to one or more controls.',
      'The data-residency rule and the jurisdiction behind it.',
      'The top risks, each with a likelihood, impact and owner.',
    ],
    meaning: 'An obligation with no control is a gap a regulator finds first. The mapping turns law into work the team can do and prove.',
    useIt: 'The handover carries the mapping forward; the data record enforces the residency rule.',
    pitfalls: [
      'An obligation with no control mapped.',
      'A residency rule with no jurisdiction.',
      'A risk with no owner.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'obligations',
          label: 'Obligations mapped to controls',
          columns: [
            c('obligation', 'Obligation', 'text', { placeholder: 'Protect PII at rest' }),
            c('control', 'Control', 'text', { placeholder: 'A.8.24 Use of cryptography' }),
            c('source', 'Source', 'text', { placeholder: 'GDPR Art. 32' }),
          ],
          seed: [{ obligation: 'Protect PII at rest', control: 'A.8.24', source: 'GDPR Art. 32' }],
        },
      },
      {
        kind: 'fields',
        title: 'Residency',
        fields: [
          { field: 'residency', label: 'Where the data may and may not live', type: 'area', required: true, placeholder: 'eu-west-1 only; no replication outside the EU.' },
          { field: 'jurisdiction', label: 'The jurisdiction that decides it', type: 'text', required: true, placeholder: 'EU GDPR' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'risks',
          label: 'The top risks',
          columns: [
            c('risk', 'Risk', 'text', { placeholder: 'Backup replicated outside the EU' }),
            c('likelihood', 'Likelihood', 'select', { options: ['Low', 'Medium', 'High'] }),
            c('impact', 'Impact', 'select', { options: ['Low', 'Medium', 'High'] }),
            c('owner', 'Owner', 'text', { placeholder: 'Priya' }),
          ],
          seed: [{ risk: 'Backup replicated outside the EU', likelihood: 'Medium', impact: 'High', owner: 'Priya' }],
        },
      },
    ],
    dod: [
      { label: 'Each obligation maps to a control with a source', when: { group: 'obligations', atLeast: 3, every: { filled: ['obligation', 'control', 'source'] } } },
      { label: 'The residency rule names its jurisdiction', when: { fields: ['residency', 'jurisdiction'] } },
      { label: 'Each risk has a likelihood, impact and owner', when: { group: 'risks', atLeast: 2, every: { filled: ['risk', 'likelihood', 'impact', 'owner'] } } },
    ],
  },

  // 4 — Data Security Record ← decision ────────────────────────────────────────────
  {
    id: 'ccsp_data',
    courseId: 'ccsp',
    num: 4,
    file: '04_Data_Security_Record.md',
    title: 'Data Security Record',
    owner: 'data',
    shared: true,
    folder: '02_Data',
    standard: 'Cloud data security · ISC2 CCSP domain 2 · ISO/IEC 27001 A.8.24, A.5.34',
    weeks: [2],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['ccsp_platform'],
    purpose:
      'How the data is classified and protected: every data set with a classification, the store encrypted and public access blocked, a customer-owned key with rotation and retention, and the key-ownership decision behind it.',
    howTo:
      'Record the classification of each data set, the encryption and public-access state, the key and its lifecycle, and the key-ownership decision with the option rejected.',
    buildSteps: [
      'Every data set classified, nothing left blank.',
      'The store encrypted and public access blocked.',
      'The key, its manager, rotation and retention.',
      'The key-ownership decision, with the rejected option and the accepted risk.',
    ],
    meaning: 'Data security is the classification plus the key. Together they decide who can ever read the data and prove it stays protected.',
    useIt: 'The platform record builds behind it; the handover records the data state and the decision.',
    pitfalls: [
      'An unclassified data set.',
      'A provider key when the obligation needs a controlled one.',
      'A store that still allows a public grant.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Classification and protection',
        fields: [
          { field: 'unclassified', label: 'Unclassified data sets (count)', type: 'number', required: true, help: 'Zero is the goal.' },
          { field: 'restricted', label: 'Restricted data sets (count)', type: 'number', required: true },
          { field: 'encrypted', label: 'The store encrypts at rest', type: 'select', required: true, options: YN },
          { field: 'public_blocked', label: 'Public access is blocked', type: 'select', required: true, options: YN },
        ],
      },
      {
        kind: 'fields',
        title: 'The key and its lifecycle',
        fields: [
          { field: 'key_manager', label: 'Key manager', type: 'select', required: true, options: ['customer', 'provider', 'byok'] },
          { field: 'rotation', label: 'Rotation is on', type: 'select', required: true, options: YN },
          { field: 'retention', label: 'Retention and deletion rule', type: 'text', required: true, placeholder: 'Keep 7 years, then crypto-shred by destroying the key.' },
        ],
      },
      { kind: 'decision', block: KEY_DECISION },
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date', type: 'date', required: true },
          { field: 'signoff', label: 'Recorded by (Data focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'Nothing is unclassified and the store is encrypted with no public access', when: { all: [{ field: 'unclassified', equals: '0' }, { field: 'encrypted', equals: 'Yes' }, { field: 'public_blocked', equals: 'Yes' }] } },
      { label: 'The key is controlled with rotation and a retention rule', when: { all: [{ fields: ['key_manager', 'retention'] }, { field: 'rotation', equals: 'Yes' }] } },
      decisionDod(KEY_DECISION),
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },

  // 5 — Platform & Network Record ──────────────────────────────────────────────────
  {
    id: 'ccsp_platform',
    courseId: 'ccsp',
    num: 5,
    file: '05_Platform_and_Network_Record.md',
    title: 'Platform & Network Record',
    owner: 'platform',
    shared: true,
    folder: '03_Build',
    standard: 'Cloud platform & infrastructure security · ISC2 CCSP domain 3 · CIS Benchmarks',
    weeks: [3],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['ccsp_appsec'],
    purpose:
      'How the platform and network are secured: the baseline scanned with every failing control owned, and the network segmented so the private tier has no public route.',
    howTo:
      'Record the baseline pass rate and any failing control with an owner, and confirm the private tier has no public route with each allowed flow reasoned.',
    buildSteps: [
      'The baseline scanned; failing controls with an owner and fix.',
      'The private tier proved to have no public route.',
      'Each allowed network flow with a reason.',
    ],
    meaning: 'The platform baseline is the floor the application stands on; the segmentation is what keeps the data tier off the internet.',
    useIt: 'The application record builds on it; the handover records the platform state.',
    pitfalls: [
      'A baseline never scanned.',
      'A private tier with a public route.',
      'An allowed flow with no reason.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The baseline and segmentation',
        fields: [
          { field: 'baseline_failed', label: 'Failing baseline controls (count)', type: 'number', required: true },
          { field: 'private_no_public', label: 'The private tier has no public route', type: 'select', required: true, options: YN },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Platform changes — with a rollback',
          help: 'Every platform or network change, why, and how to undo it.',
          columns: [
            c('change', 'Change', 'text', { placeholder: 'Enable flow logs on the VPC' }),
            c('reason', 'Reason', 'text', { placeholder: 'Baseline control CIS-2.1.1' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'Disable the flow log' }),
          ],
          seed: [{ change: 'Enable flow logs', reason: 'CIS-2.1.1', rollback: 'Disable the flow log' }],
        },
      },
    ],
    dod: [
      { label: 'The private tier has no public route', when: { field: 'private_no_public', equals: 'Yes' } },
      { label: 'Every failing baseline control is owned (count recorded)', when: { fields: ['baseline_failed'] } },
      { label: 'Every change has a reason and a rollback', when: { group: 'changes', atLeast: 1, every: { filled: ['change', 'reason', 'rollback'] } } },
    ],
  },

  // 6 — Application Security Record ─────────────────────────────────────────────────
  {
    id: 'ccsp_appsec',
    courseId: 'ccsp',
    num: 6,
    file: '06_Application_Security_Record.md',
    title: 'Application Security Record',
    owner: 'appsec',
    shared: true,
    folder: '03_Build',
    standard: 'Cloud application security · ISC2 CCSP domain 4 · OWASP ASVS',
    weeks: [3],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['ccsp_operations'],
    purpose:
      'How the application is secured before it ships: no hard-coded secret in the source, no critical dependency vulnerability, and a secure-lifecycle gate recorded.',
    howTo:
      'Record the secret scan result, the critical-vulnerability count from the dependency scan, and the lifecycle gate that enforces both.',
    buildSteps: [
      'The secret scan result: none found, or found and fixed.',
      'The critical dependency vulnerability count: zero to ship.',
      'The lifecycle gate that blocks a build failing either.',
    ],
    meaning: 'Most breaches ride in on a secret in code or a known-vulnerable dependency. Catching both before shipping is the application control.',
    useIt: 'The operations record watches what it ships; the handover records the application state.',
    pitfalls: [
      'A secret left in the source.',
      'A critical vulnerability shipped anyway.',
      'A gate that warns but does not block.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The scans and the gate',
        fields: [
          { field: 'secrets_clean', label: 'No hard-coded secret found', type: 'select', required: true, options: YN },
          { field: 'critical_vulns', label: 'Critical dependency vulnerabilities (count)', type: 'number', required: true, help: 'Zero to ship.' },
          { field: 'gate', label: 'The lifecycle gate that enforces both', type: 'text', required: true, placeholder: 'CI blocks merge on a secret hit or a critical CVE.' },
        ],
      },
    ],
    dod: [
      { label: 'The source is clean of hard-coded secrets', when: { field: 'secrets_clean', equals: 'Yes' } },
      { label: 'No critical dependency vulnerability remains (count recorded)', when: { fields: ['critical_vulns'] } },
      { label: 'A lifecycle gate enforces both', when: { fields: ['gate'] } },
    ],
  },

  // 7 — Operations & Incident Log ───────────────────────────────────────────────────
  {
    id: 'ccsp_operations',
    courseId: 'ccsp',
    num: 7,
    file: '07_Operations_and_Incident_Log.md',
    title: 'Operations & Incident Log',
    owner: 'grc',
    shared: true,
    folder: '04_Operate',
    standard: 'Cloud security operations · ISC2 CCSP domain 5 · NIST SP 800-61 · one change per row',
    weeks: [4],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['ccsp_handover'],
    purpose:
      'How the application is run and defended: monitoring and alerting on, a change made through a reversible process, and an incident worked one theory and one containment action per row with the failures kept.',
    howTo:
      'Record that monitoring is on and alerts route, a change with its rollback, then the incident: the symptom first, one action per row, contained, with the lesson.',
    buildSteps: [
      'Monitoring and alerting confirmed on.',
      'A change made through a recorded, reversible process.',
      'The incident: actor, resource, action, and why.',
      'One containment action per row; at least one that did not contain it, kept; contained, with the lesson.',
    ],
    meaning: 'Operations is where the baseline keeps living. A response log with no failed actions is one nobody believes; the failures are the proof.',
    useIt: 'The handover records the operations state and the incident lesson.',
    pitfalls: [
      'An alert that routes nowhere.',
      'Three containment actions at once, so nobody knows which worked.',
      'Deleting the actions that failed.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Operations',
        fields: [
          { field: 'monitoring', label: 'Monitoring and alerting are on', type: 'select', required: true, options: YN },
          { field: 'alert_dest', label: 'Where alerts route', type: 'text', required: true, placeholder: 'secops-oncall' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Changes — with a rollback',
          columns: [
            c('change', 'Change', 'text', { placeholder: 'Raise the alert threshold' }),
            c('reason', 'Reason', 'text', { placeholder: 'Too many false positives' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'Restore the old threshold' }),
          ],
          seed: [{ change: 'Raise the alert threshold', reason: 'False positives', rollback: 'Restore the old threshold' }],
        },
      },
      {
        kind: 'fields',
        title: 'The incident',
        fields: [
          { field: 'actor', label: 'Actor and resource', type: 'text', required: true, placeholder: 'svc-quote reading the restricted bucket' },
          { field: 'why_incident', label: 'Why it is an incident', type: 'text', required: true, placeholder: 'A service identity touching data it never should' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'actions',
          label: 'The actions — one change per row',
          help: 'Theory, the one action, the result. Keep the ones that did not contain it.',
          columns: [
            c('theory', 'Theory', 'text', { placeholder: 'Revoking the session contains it' }),
            c('action', 'The one action', 'text', { placeholder: 'Revoke the active session' }),
            c('result', 'Result', 'select', { options: ['Contained it', 'No change — still active', 'Partly — new activity'] }),
          ],
          seed: [{ theory: 'Revoke the session', action: 'Revoke active session', result: 'Contained it' }],
        },
      },
      {
        kind: 'fields',
        title: 'Contained, and the lesson',
        fields: [
          { field: 'contained', label: 'The incident is contained', type: 'select', required: true, options: YN },
          { field: 'lesson', label: 'The change that stops the next one', type: 'area', required: true, placeholder: 'Scope the service role to its own prefix; alert on cross-prefix reads.' },
        ],
      },
    ],
    dod: [
      { label: 'Monitoring is on and alerts route', when: { all: [{ field: 'monitoring', equals: 'Yes' }, { fields: ['alert_dest'] }] } },
      { label: 'Every change has a reason and a rollback', when: { group: 'changes', atLeast: 1, every: { filled: ['change', 'reason', 'rollback'] } } },
      { label: 'Every action is a row, and at least one did not contain it', when: { group: 'actions', atLeast: 2, some: { column: 'result', equals: 'No change — still active' } } },
      { label: 'The incident is contained and the lesson recorded', when: { all: [{ field: 'contained', equals: 'Yes' }, { fields: ['lesson'] }] } },
    ],
  },

  // 8 — Cloud Security Handover ← capstone ───────────────────────────────────────────
  {
    id: 'ccsp_handover',
    courseId: 'ccsp',
    num: 8,
    file: '08_Cloud_Security_Handover.md',
    title: 'Cloud Security Handover',
    owner: 'grc',
    shared: true,
    capstone: true,
    folder: '04_Operate',
    standard: 'Control-to-evidence handover & chain of custody · ISO/IEC 27001 Clause 9 · NIST SP 800-53 CA-7',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'The application’s security as it really is, handed to whoever runs it next: every control across data, platform, application and operations mapped to the artifact that proves it, the open risks with owners, and a custody row with a hash for every artifact.',
    howTo:
      'Write the baseline in one page by reference to the other records, map each control to its evidence, list the open risks with owners, and hash every artifact into the custody log.',
    buildSteps: [
      'The baseline now: data, platform, application, operations — each control, on or off.',
      'Each control mapped to the artifact that proves it.',
      'The open risks, each with an owner and a mitigation.',
      'The custody log: every policy, mapping and finding, hashed.',
    ],
    meaning: 'A control with no evidence is a claim. The control-to-evidence map is what the next team and the auditor both read first.',
    useIt: 'It is the capstone: reviewed by the Platform focus, approved by the Data focus, and issued with the application.',
    pitfalls: [
      'A control claimed with no evidence pointed at.',
      'A secret or a key in the document. Locations and states only.',
      'An open risk with no owner.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The baseline now',
        fields: [
          { field: 'application', label: 'Application name', type: 'text', required: true, placeholder: 'ccsp-t1' },
          { field: 'baseline', label: 'The control baseline', type: 'area', required: true, placeholder: 'Data: classified, customer key, store locked. Platform: baseline passes, segmented. App: no secrets, no critical CVE. Ops: monitoring, change control, incident contained.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'controls',
          label: 'Control-to-evidence map',
          help: 'Each control and the artifact in the evidence folder that proves it.',
          columns: [
            c('control', 'Control', 'text', { placeholder: 'A.8.24 Cryptography' }),
            c('artifact', 'Evidence artifact', 'text', { placeholder: 'week-2/key.json' }),
          ],
          seed: [{ control: 'A.8.24 Cryptography', artifact: 'week-2/key.json' }],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'risks',
          label: 'The open risks',
          columns: [
            c('risk', 'Open risk', 'text', { placeholder: 'No automated residency check yet' }),
            c('owner', 'Owner', 'text', { placeholder: 'Priya' }),
            c('mitigation', 'Mitigation / plan', 'text', { placeholder: 'Add a residency guardrail next sprint' }),
          ],
        },
      },
      custodySection({
        seed: [
          { evidence_id: 'E-01', filename: 'week-1/controls-map.txt', description: 'The obligation-to-control mapping', collected_by: 'GRC', datetime: '2026-10-26 10:10', location: 'ccsp-t1/week-1/', sha256: 'a81c…', transferred_to: 'Platform', transferred_at: '2026-10-26 10:30', notes: 'for the compliance register' },
        ],
      }),
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date issued', type: 'date', required: true },
          { field: 'signoff', label: 'Issued by (GRC focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'The baseline is described across data, platform, application and operations', when: { fields: ['application', 'baseline'] } },
      { label: 'Each control maps to the artifact that proves it', when: { group: 'controls', atLeast: 4, every: { filled: ['control', 'artifact'] } } },
      { label: 'Each open risk has an owner and a mitigation', when: { group: 'risks', atLeast: 1, every: { filled: ['risk', 'owner', 'mitigation'] } } },
      { label: 'Every artifact is hashed into the custody log', when: everyEvidenceHashed('evidence') },
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },
];

export const CCSP_DELIVERABLES: DeliverableDef[] = CCSP_FORMS;

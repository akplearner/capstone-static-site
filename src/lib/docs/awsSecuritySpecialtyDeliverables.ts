import { Column } from '../grc/templates';
import { DeliverableDef, decisionDod, type DecisionBlock } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * The records the AWS Security – Specialty Secure Workload produces (SCS-C03).
 *
 * A four-person security team secures one small AWS workload and documents it
 * the way a real team would. Eight forms, one job each, in the order the work
 * happens:
 *
 *   1 Account & Access Register     the account, root, the MFA identity       W0
 *   2 Identity & Access Matrix      roles, least privilege, the denial        W1
 *   3 Control Baseline             the account-wide governance controls       W1
 *   4 Network Security Record      segments, groups, no open SSH              W2
 *   5 Data Protection Record       the key and the locked bucket ← decision   W3
 *   6 Detection & Findings Log     the findings and the alarm                 W3,4
 *   7 Incident Response Log        the incident, worked one change per row     W4
 *   8 Security Handover & Baseline the baseline as it is  ← capstone          W4
 *
 * FORM 7 IS THE ONE THE COURSE IS ABOUT. An incident is worked one theory and
 * one containment action per row, with the actions that did not contain it
 * kept, because a response log with no failed actions in it is one nobody
 * believes.
 *
 * Every student fills every form (`shared: true`); `owner` is the focus that
 * leads the record and reviews it. Course-scoped (`courseId: 'aws-security-specialty'`).
 */

const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });
const YN = ['Yes', 'No'];

/** The one design decision of the workload: how the data is encrypted and who holds the key. */
const KEY_DECISION: DecisionBlock = {
  id: 'key',
  title: 'The key-management decision',
  subject: 'architecture',
  prompt: 'The data has to be encrypted at rest. Which key protects it, and who controls it?',
  options: [
    { id: 'aws-managed', label: 'An AWS-managed key', help: 'Simplest, no key policy to run; but no control over rotation, policy or who can decrypt.' },
    { id: 'customer-managed', label: 'A customer-managed KMS key', help: 'You set the key policy, rotation and who may use it; a little more to run.' },
    { id: 'external', label: 'An imported or external key', help: 'You hold the key material outside AWS; most control, most operational burden.' },
  ],
  questions: [
    { field: 'key_why', label: 'Why that, for this data', type: 'area', required: true, placeholder: 'Customer-managed: the data is regulated, so we must control the key policy and prove who can decrypt.' },
    { field: 'key_rejected', label: 'The option rejected, and why', type: 'text', required: true, placeholder: 'AWS-managed: no control over the key policy, which the regulation requires.' },
    { field: 'key_risk', label: 'The risk accepted', type: 'text', placeholder: 'A customer-managed key is one more thing to rotate and not lose; the key policy and rotation handle it.' },
  ],
};

const AWS_SECURITY_FORMS: DeliverableDef[] = [
  // 1 — Account & Access Register ───────────────────────────────────────────────
  {
    id: 'scs_setup',
    courseId: 'aws-security-specialty',
    num: 1,
    file: '01_Account_and_Access_Register.md',
    title: 'Account & Access Register',
    owner: 'records',
    shared: true,
    folder: '00_Setup',
    standard: 'Account hygiene & root protection · AWS Well-Architected SEC01 · NIST SP 800-53 AC-2',
    weeks: [0],
    kind: 'checklist',
    exportFormat: 'md',
    feeds: ['scs_identity'],
    purpose:
      'What the workload runs on: the account, the protected root user, the MFA identity for daily work, and the budget guard. Written first, because an account whose root is unprotected is a workload with no floor under it.',
    howTo:
      'Record the account, confirm root has MFA and is break-glass only, list the IAM admin user and its MFA, and the budget alert.',
    buildSteps: [
      'The account id and that root has MFA.',
      'That root is break-glass only; daily work is an IAM user.',
      'The IAM admin user and its MFA device.',
      'A $1 budget alert, with the email it goes to.',
      'The workload name and the evidence folder path.',
    ],
    meaning: 'A good register lets anyone say who holds root, who works day to day, and that a bill cannot grow unseen.',
    useIt: 'The identity matrix builds on it, and the handover closes the account against it.',
    pitfalls: [
      'Daily work as root.',
      'An admin user with no MFA.',
      'A key pasted into the record. Owners and MFA state only.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The account and root',
        fields: [
          { field: 'account_id', label: 'Account id (last 12)', type: 'text', required: true, placeholder: '123456789012' },
          { field: 'root_mfa', label: 'Root has MFA on', type: 'select', required: true, options: YN },
          { field: 'root_breakglass', label: 'Root is break-glass only', type: 'select', required: true, options: YN },
          { field: 'budget', label: 'A $1 budget alert exists', type: 'select', required: true, options: YN },
          { field: 'budget_email', label: 'The budget alert goes to', type: 'text', required: true, placeholder: 'sec-t1@…' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'users',
          label: 'The IAM identities for daily work',
          help: 'One row per member. Every admin identity carries MFA.',
          columns: [
            c('member', 'Member', 'text', { placeholder: 'Priya' }),
            c('user', 'IAM user', 'text', { placeholder: 'secops' }),
            c('mfa', 'MFA on', 'select', { options: YN }),
          ],
          seed: [{ member: 'Priya', user: 'secops', mfa: 'Yes' }],
        },
      },
      {
        kind: 'fields',
        title: 'The team',
        fields: [
          { field: 'workload', label: 'Workload name', type: 'text', required: true, placeholder: 'sec-t1' },
          { field: 'folder', label: 'Evidence folder path', type: 'text', required: true, placeholder: 'sec-t1/' },
          { field: 'focus', label: 'Who leads which focus', type: 'area', required: true, placeholder: 'Identity: Alex · Infra: Sam · Data: Jo · SecOps: Priya' },
        ],
      },
    ],
    dod: [
      { label: 'The account is named with root MFA on and break-glass only', when: { all: [{ fields: ['account_id'] }, { field: 'root_mfa', equals: 'Yes' }, { field: 'root_breakglass', equals: 'Yes' }] } },
      { label: 'A budget alert exists with an email', when: { all: [{ field: 'budget', equals: 'Yes' }, { fields: ['budget_email'] }] } },
      { label: 'Every daily identity has MFA on', when: { group: 'users', atLeast: 1, every: { column: 'mfa', equals: 'Yes' } } },
      { label: 'The team has a workload name and four focuses', when: { fields: ['workload', 'focus'] } },
    ],
  },

  // 2 — Identity & Access Matrix ─────────────────────────────────────────────────
  {
    id: 'scs_identity',
    courseId: 'aws-security-specialty',
    num: 2,
    file: '02_Identity_and_Access_Matrix.md',
    title: 'Identity & Access Matrix',
    owner: 'iam',
    shared: true,
    folder: '01_Identity',
    standard: 'Least privilege & identity · SCS-C03 domain 1 · NIST SP 800-53 AC-6',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['scs_baseline', 'scs_network'],
    purpose:
      'Who can do what, and the proof it is least privilege: each focus and the scoped role it assumes, the actions that role is allowed, and the forbidden action the policy simulator denies.',
    howTo:
      'Record each focus against the role it assumes and why; list the allowed actions; and record the simulator decision on both an intended action and a forbidden one.',
    buildSteps: [
      'Each focus, the role it assumes, and why it needs it.',
      'The actions the role is allowed.',
      'The simulator decision on an intended action (allowed) and a forbidden one (denied).',
      'That assuming the role requires MFA.',
    ],
    meaning: 'A matrix with a proven denial in it is the difference between least privilege as a claim and least privilege as evidence.',
    useIt: 'The baseline records it as a control; every later task runs under one of its roles.',
    pitfalls: [
      'A role with wildcard actions.',
      'No proof of a denial.',
      'A role anyone can assume without MFA.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'matrix',
          label: 'The access matrix',
          help: 'One row per focus. The role is assumed, not a standing admin.',
          columns: [
            c('focus', 'Focus', 'text', { placeholder: 'Data' }),
            c('role', 'Role assumed', 'text', { placeholder: 'data-reader' }),
            c('allowed', 'Allowed actions', 'text', { placeholder: 's3:GetObject on the data bucket' }),
            c('why', 'Why it needs it', 'text', { placeholder: 'Reads the report objects, nothing more' }),
          ],
          seed: [{ focus: 'Data', role: 'data-reader', allowed: 's3:GetObject', why: 'Reads reports only' }],
        },
      },
      {
        kind: 'fields',
        title: 'The proof',
        fields: [
          { field: 'mfa_required', label: 'Assuming the role requires MFA', type: 'select', required: true, options: YN },
          { field: 'allowed_proof', label: 'Simulator decision on the intended action', type: 'text', required: true, placeholder: 's3:GetObject → allowed' },
          { field: 'denied_proof', label: 'Simulator decision on a forbidden action', type: 'text', required: true, placeholder: 's3:DeleteObject → implicitDeny' },
        ],
      },
    ],
    dod: [
      { label: 'Each focus maps to a scoped role with a reason', when: { group: 'matrix', atLeast: 4, every: { filled: ['focus', 'role', 'allowed', 'why'] } } },
      { label: 'Assuming a role requires MFA', when: { field: 'mfa_required', equals: 'Yes' } },
      { label: 'The simulator allows the intended action and denies a forbidden one', when: { fields: ['allowed_proof', 'denied_proof'] } },
    ],
  },

  // 3 — Control Baseline ─────────────────────────────────────────────────────────
  {
    id: 'scs_baseline',
    courseId: 'aws-security-specialty',
    num: 3,
    file: '03_Control_Baseline.md',
    title: 'Control Baseline',
    owner: 'records',
    shared: true,
    folder: '01_Identity',
    standard: 'Governance baseline · SCS-C03 domain 6 · AWS Well-Architected SEC · NIST SP 800-53 AU-2',
    weeks: [1],
    kind: 'checklist',
    exportFormat: 'md',
    feeds: ['scs_handover'],
    purpose:
      'The account-wide controls that make every later record auditable: a multi-region trail with validated logs, and a config recorder. Each control, named, with whether it is on.',
    howTo:
      'Record each governance control and its state: the trail, whether it is multi-region and validated, and the config recorder.',
    buildSteps: [
      'The trail, whether it is multi-region, and whether it is logging.',
      'Whether log-file validation is on.',
      'Whether Config is recording, or why not yet.',
      'Each control with on/off and the evidence.',
    ],
    meaning: 'The baseline is the floor every other control stands on. A workload with no trail leaves no footprints to audit.',
    useIt: 'The handover carries it forward as the state of the account’s governance.',
    pitfalls: [
      'A single-region trail.',
      'A trail with no log-file validation.',
      'A control marked on with no evidence.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'controls',
          label: 'The governance controls',
          columns: [
            c('control', 'Control', 'text', { placeholder: 'CloudTrail multi-region' }),
            c('state', 'State', 'select', { options: ['On', 'Off', 'Partial'] }),
            c('evidence', 'Evidence', 'text', { placeholder: 'describe-trails → IsMultiRegionTrail True' }),
          ],
          seed: [{ control: 'CloudTrail multi-region', state: 'On', evidence: 'IsMultiRegionTrail True' }],
        },
      },
      {
        kind: 'fields',
        title: 'The trail',
        fields: [
          { field: 'trail_multiregion', label: 'A multi-region trail is logging', type: 'select', required: true, options: YN },
          { field: 'trail_validated', label: 'Log-file validation is on', type: 'select', required: true, options: YN },
          { field: 'config_on', label: 'Config is recording (or justified)', type: 'text', required: true, placeholder: 'On — records all resource types' },
        ],
      },
    ],
    dod: [
      { label: 'A multi-region trail is logging with validation on', when: { all: [{ field: 'trail_multiregion', equals: 'Yes' }, { field: 'trail_validated', equals: 'Yes' }] } },
      { label: 'Config recording is stated', when: { fields: ['config_on'] } },
      { label: 'Each control has a state and evidence', when: { group: 'controls', atLeast: 2, every: { filled: ['control', 'state', 'evidence'] } } },
    ],
  },

  // 4 — Network Security Record ──────────────────────────────────────────────────
  {
    id: 'scs_network',
    courseId: 'aws-security-specialty',
    num: 4,
    file: '04_Network_Security_Record.md',
    title: 'Network Security Record',
    owner: 'infra',
    shared: true,
    folder: '02_Infrastructure',
    standard: 'Infrastructure security · SCS-C03 domain 2 · NIST SP 800-53 SC-7',
    weeks: [2],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['scs_data'],
    purpose:
      'The network as it is defended: the segments, the least-exposure security groups, the proof a too-wide rule is caught, and the host reached without opening SSH.',
    howTo:
      'Record the subnets and which are private, the one port the group opens and to whom, the dry-run of a too-wide rule, and that the host is reached through SSM with port 22 closed.',
    buildSteps: [
      'The subnets, public and private, and that the private one has no internet-gateway route.',
      'The one port the security group opens, and the source.',
      'The dry-run result of a too-wide rule.',
      'That the host is SSM-reachable and port 22 is closed.',
    ],
    meaning: 'The record names the exposure of the workload. A security group open to the world, or an open SSH port, is the finding this record exists to prevent.',
    useIt: 'The data record sits behind it; the handover records the network state.',
    pitfalls: [
      'A private subnet with an internet-gateway route.',
      'A management port open to 0.0.0.0/0.',
      'Reaching the host by opening SSH instead of SSM.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The segments',
        fields: [
          { field: 'subnets', label: 'Public and private subnets', type: 'text', required: true, placeholder: 'subnet-public1 (public), subnet-private1 (private)' },
          { field: 'private_route', label: 'The private subnet has no internet-gateway route', type: 'select', required: true, options: YN },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'rules',
          label: 'The security-group rules',
          help: 'One row per open port. SSH to 0.0.0.0/0 must not appear.',
          columns: [
            c('port', 'Port', 'text', { placeholder: '443' }),
            c('source', 'Source', 'text', { placeholder: '0.0.0.0/0' }),
            c('why', 'Why it is open', 'text', { placeholder: 'HTTPS, meant to be public' }),
          ],
          seed: [{ port: '443', source: '0.0.0.0/0', why: 'HTTPS, public' }],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Security-group changes — with a rollback',
          help: 'Every rule change, why, and how to undo it.',
          columns: [
            c('change', 'Change', 'text', { placeholder: 'Open 443 to 0.0.0.0/0' }),
            c('reason', 'Reason', 'text', { placeholder: 'HTTPS must be public' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'revoke-security-group-ingress on the same rule' }),
          ],
          seed: [{ change: 'Open 443 to 0.0.0.0/0', reason: 'HTTPS public', rollback: 'revoke the 443 rule' }],
        },
      },
      {
        kind: 'fields',
        title: 'The proof',
        fields: [
          { field: 'dryrun', label: 'Dry-run of a too-wide rule (result)', type: 'text', required: true, placeholder: 'SSH-from-anywhere → DryRunOperation, not applied, refused in review' },
          { field: 'ssm', label: 'The host is reached through SSM', type: 'select', required: true, options: YN },
          { field: 'ssh_closed', label: 'Port 22 is closed (no inbound rule)', type: 'select', required: true, options: YN },
        ],
      },
    ],
    dod: [
      { label: 'The private subnet has no internet-gateway route', when: { field: 'private_route', equals: 'Yes' } },
      { label: 'Every open port has a stated reason', when: { group: 'rules', atLeast: 1, every: { filled: ['port', 'source', 'why'] } } },
      { label: 'The host is reached through SSM with port 22 closed', when: { all: [{ field: 'ssm', equals: 'Yes' }, { field: 'ssh_closed', equals: 'Yes' }, { fields: ['dryrun'] }] } },
    ],
  },

  // 5 — Data Protection Record ← decision ────────────────────────────────────────
  {
    id: 'scs_data',
    courseId: 'aws-security-specialty',
    num: 5,
    file: '05_Data_Protection_Record.md',
    title: 'Data Protection Record',
    owner: 'data',
    shared: true,
    folder: '03_Data',
    standard: 'Data protection · SCS-C03 domain 3 · NIST SP 800-53 SC-12, SC-28',
    weeks: [3],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['scs_handover'],
    purpose:
      'How the data is protected: the key that encrypts it and who controls it, the bucket that blocks public access and refuses an unencrypted upload, and the decision behind the key choice.',
    howTo:
      'Record the key, its manager and policy; the bucket’s public-access block and deny-unencrypted proof; and the key-management decision with the option rejected.',
    buildSteps: [
      'The key, whether it is customer-managed, and who may use it.',
      'That the object is encrypted with the key.',
      'That Block Public Access is fully on.',
      'That an unencrypted upload is refused.',
      'The key-management decision, with the rejected option and the accepted risk.',
    ],
    meaning: 'Data protection is the key plus the bucket policy. Together they make it impossible for data to land public or in the clear.',
    useIt: 'The handover records the data state; the decision explains the key choice to whoever runs it next.',
    pitfalls: [
      'Relying on an AWS-managed key when the data is regulated.',
      'Block Public Access not fully on.',
      'A bucket that accepts an unencrypted object.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The key and the bucket',
        fields: [
          { field: 'key_manager', label: 'Key manager', type: 'select', required: true, options: ['CUSTOMER', 'AWS', 'EXTERNAL'] },
          { field: 'key_users', label: 'Who may use the key', type: 'text', required: true, placeholder: 'data-reader, the app role' },
          { field: 'object_encrypted', label: 'The object is encrypted with the key (aws:kms)', type: 'select', required: true, options: YN },
          { field: 'bpa', label: 'Block Public Access fully on', type: 'select', required: true, options: YN },
          { field: 'deny_unencrypted', label: 'An unencrypted put is refused (AccessDenied)', type: 'select', required: true, options: YN },
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
      { label: 'The data is encrypted with a controlled key', when: { all: [{ fields: ['key_manager'] }, { field: 'object_encrypted', equals: 'Yes' }] } },
      { label: 'The bucket blocks public access and refuses an unencrypted put', when: { all: [{ field: 'bpa', equals: 'Yes' }, { field: 'deny_unencrypted', equals: 'Yes' }] } },
      decisionDod(KEY_DECISION),
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },

  // 6 — Detection & Findings Log ──────────────────────────────────────────────────
  {
    id: 'scs_detect',
    courseId: 'aws-security-specialty',
    num: 6,
    file: '06_Detection_and_Findings_Log.md',
    title: 'Detection & Findings Log',
    owner: 'records',
    shared: true,
    folder: '03_Data',
    standard: 'Threat detection · SCS-C03 domain 4 · NIST SP 800-53 SI-4, AU-6',
    weeks: [3, 4],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['scs_incident'],
    purpose:
      'What detection found and what the team did about it: the findings triaged by severity, the top finding named as the incident, and the metric filter and alarm wired so the next one pages.',
    howTo:
      'Record the findings sorted by severity, the top finding’s actor, source and action, and the metric filter and alarm that will catch the next unauthorized call.',
    buildSteps: [
      'The findings by severity, highest first.',
      'The top finding: type, actor, source IP.',
      'The metric filter pattern that matches unauthorized calls.',
      'The alarm and the topic it notifies.',
    ],
    meaning: 'Detection without triage is noise, and an alarm with no action is a colour on a dashboard. This log is where detection becomes a response.',
    useIt: 'The incident log starts from its top finding; the handover records the detective controls.',
    pitfalls: [
      'Findings with no severity order.',
      'A metric filter with no alarm.',
      'An alarm with no notification action.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'findings',
          label: 'The findings, triaged',
          columns: [
            c('severity', 'Severity', 'text', { placeholder: '8.0' }),
            c('type', 'Finding type', 'text', { placeholder: 'UnauthorizedAccess:IAMUser/MaliciousIPCaller' }),
            c('action', 'Triage', 'select', { options: ['Work as incident', 'Monitor', 'Suppress with reason'] }),
          ],
          seed: [{ severity: '8.0', type: 'UnauthorizedAccess:IAMUser/MaliciousIPCaller', action: 'Work as incident' }],
        },
      },
      {
        kind: 'fields',
        title: 'The top finding and the alarm',
        fields: [
          { field: 'top_actor', label: 'Top finding: actor and source IP', type: 'text', required: true, placeholder: 'secops from 203.0.113.7' },
          { field: 'filter', label: 'Metric filter pattern', type: 'text', required: true, placeholder: 'errorCode = AccessDenied* or *UnauthorizedOperation' },
          { field: 'alarm_action', label: 'The alarm notifies', type: 'text', required: true, placeholder: 'SNS topic sec-alerts' },
        ],
      },
    ],
    dod: [
      { label: 'The findings are triaged by severity', when: { group: 'findings', atLeast: 2, every: { filled: ['severity', 'type', 'action'] } } },
      { label: 'The top finding is identified by actor and source', when: { fields: ['top_actor'] } },
      { label: 'A metric filter and a notifying alarm are in place', when: { fields: ['filter', 'alarm_action'] } },
    ],
  },

  // 7 — Incident Response Log ──────────────────────────────────────────────────────
  {
    id: 'scs_incident',
    courseId: 'aws-security-specialty',
    num: 7,
    file: '07_Incident_Response_Log.md',
    title: 'Incident Response Log',
    owner: 'records',
    shared: true,
    folder: '04_Response',
    standard: 'Incident response · SCS-C03 domain 5 · NIST SP 800-61 · one change per row',
    weeks: [4],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['scs_handover'],
    purpose:
      'The incident worked the method way: the symptom first from the finding, one theory and one containment action per row, the actions that did not contain it kept, and the lesson that stops the next one.',
    howTo:
      'Write the incident exactly before any action. Take one containment action per row and record the result. Keep the rows that did not work. End contained, with the preventive change.',
    buildSteps: [
      'The incident: actor, source, action, and why it is an incident.',
      'One theory per row, one containment action, the result.',
      'At least one action that did not contain it, kept.',
      'Contained, with the change that stops it recurring.',
    ],
    meaning: 'A response log with no failed actions in it is one nobody believes. The failures are the proof the team worked the incident, and the lesson is what turns it into an improvement.',
    useIt: 'The handover records the incident and the preventive change.',
    pitfalls: [
      'Writing "it looked bad" instead of the exact finding.',
      'Taking three actions at once, so nobody knows which contained it.',
      'Deleting the actions that failed.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The incident',
        fields: [
          { field: 'actor', label: 'Actor and source', type: 'text', required: true, placeholder: 'secops key AKIA… from 203.0.113.7' },
          { field: 'action_seen', label: 'The unauthorized action', type: 'text', required: true, placeholder: 'ListBuckets then GetObject on the data bucket' },
          { field: 'why_incident', label: 'Why it is an incident', type: 'text', required: true, placeholder: 'A known-good key used from an IP the user never uses' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'actions',
          label: 'The actions — one change per row',
          help: 'Theory, the one action, the result. Keep the ones that did not contain it.',
          columns: [
            c('theory', 'Theory', 'text', { placeholder: 'Disabling the key contains it' }),
            c('action', 'The one action', 'text', { placeholder: 'Set the access key Inactive' }),
            c('result', 'Result', 'select', { options: ['Contained it', 'No change — still active', 'Partly — new activity'] }),
          ],
          seed: [{ theory: 'Disabling the key contains it', action: 'Set the key Inactive', result: 'Contained it' }],
        },
      },
      {
        kind: 'fields',
        title: 'Contained, and the lesson',
        fields: [
          { field: 'contained', label: 'The incident is contained', type: 'select', required: true, options: YN },
          { field: 'lesson', label: 'The change that stops the next one', type: 'area', required: true, placeholder: 'Add an SCP denying access from outside the corporate IP ranges; rotate on a schedule.' },
        ],
      },
    ],
    dod: [
      { label: 'The incident is written exactly, with why', when: { fields: ['actor', 'action_seen', 'why_incident'] } },
      { label: 'Every action is a row, and at least one did not contain it', when: { group: 'actions', atLeast: 2, some: { column: 'result', equals: 'No change — still active' } } },
      { label: 'The incident is contained and the lesson recorded', when: { all: [{ field: 'contained', equals: 'Yes' }, { fields: ['lesson'] }] } },
    ],
  },

  // 8 — Security Handover & Baseline ← capstone ────────────────────────────────────
  {
    id: 'scs_handover',
    courseId: 'aws-security-specialty',
    num: 8,
    file: '08_Security_Handover_and_Baseline.md',
    title: 'Security Handover & Baseline',
    owner: 'records',
    shared: true,
    capstone: true,
    folder: '04_Response',
    standard: 'Security handover & chain of custody · NIST SP 800-53 PL-2, CA-7',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'The workload’s security as it really is, handed to whoever runs it next: the control baseline across identity, network, data and detection, the open risks with owners, and a custody row with a hash for every artifact the course produced.',
    howTo:
      'Write the baseline in one page by reference to the other records. List each open risk with an owner and a mitigation. Hash every artifact into the custody log.',
    buildSteps: [
      'The baseline now: identity, network, data, detection — each control, on or off.',
      'The open risks, each with an owner and a mitigation.',
      'What to watch: the alarms and where they page.',
      'The custody log: every policy, finding, log and output file, hashed.',
    ],
    meaning: 'The handover is the document the next security team reads before touching the workload. Written honestly, it says exactly what is protected and what is not yet.',
    useIt: 'It is the capstone: reviewed by the Identity focus, approved by the Infrastructure focus, and issued with the workload.',
    pitfalls: [
      'Describing the plan rather than the baseline as it stands.',
      'A secret or a key in the document. Locations and states only.',
      'An open risk with no owner.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The baseline now',
        fields: [
          { field: 'workload', label: 'Workload name', type: 'text', required: true, placeholder: 'sec-t1' },
          { field: 'baseline', label: 'The control baseline', type: 'area', required: true, placeholder: 'Identity: roles with MFA, least privilege proved. Network: segmented, no open SSH. Data: customer-managed key, bucket locked. Detection: trail, metric filter, alarm to sec-alerts.' },
          { field: 'watch', label: 'What to watch and where it pages', type: 'area', required: true, placeholder: 'UnauthorizedCalls alarm → SNS sec-alerts → the on-call inbox.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'risks',
          label: 'The open risks',
          columns: [
            c('risk', 'Open risk', 'text', { placeholder: 'No SCP restricting access by source IP yet' }),
            c('owner', 'Owner', 'text', { placeholder: 'Priya' }),
            c('mitigation', 'Mitigation / plan', 'text', { placeholder: 'Add the IP-range SCP next sprint' }),
          ],
        },
      },
      custodySection({
        seed: [
          { evidence_id: 'E-01', filename: 'week-1/simulate-deny.txt', description: 'The policy-simulator denial', collected_by: 'Identity', datetime: '2026-10-26 10:10', location: 'sec-t1/week-1/', sha256: '9f2a…', transferred_to: 'SecOps', transferred_at: '2026-10-26 10:30', notes: 'for the access matrix' },
        ],
      }),
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date issued', type: 'date', required: true },
          { field: 'signoff', label: 'Issued by (SecOps focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'The baseline is described across identity, network, data and detection', when: { fields: ['workload', 'baseline', 'watch'] } },
      { label: 'Each open risk has an owner and a mitigation', when: { group: 'risks', atLeast: 1, every: { filled: ['risk', 'owner', 'mitigation'] } } },
      { label: 'Every artifact is hashed into the custody log', when: everyEvidenceHashed('evidence') },
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },
];

export const AWS_SECURITY_SPECIALTY_DELIVERABLES: DeliverableDef[] = AWS_SECURITY_FORMS;

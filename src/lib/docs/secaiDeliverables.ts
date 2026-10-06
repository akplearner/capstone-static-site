import { Column } from '../grc/templates';
import { DeliverableDef } from './types';

// Deliverable forms for the SecAI+ capstone (R101). Course-scoped
// (`courseId: 'secai-plus'`) so they never surface on another course. The five
// release documents P1–P5, the release note shared across weeks, the lab rule
// and ledger, and the v4 package (the capstone). See seed/secaiPlus.ts.

// Local column helper (mirrors definitions.ts; kept local to avoid a cycle).
const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });

const CASE_STATUS = ['Works', 'Blocked', 'Contained', 'Accepted'];

export const SECAI_DELIVERABLES: DeliverableDef[] = [
  // 1 — Lab rule & evidence ledger (week 0) ─────────────────────────────────
  {
    id: 'secai_lab_rule',
    courseId: 'secai-plus',
    feeds: ['secai_release_note'],
    num: 1,
    file: '01_Lab_Rule_and_Ledger.md',
    title: 'Lab Rule & Evidence Ledger',
    owner: 'governance',
    folder: '01_Ground_Rules',
    standard: 'Authorisation · evidence integrity',
    framework: 'SECAI',
    weeks: [0],
    kind: 'template',
    exportFormat: 'md',
    purpose: 'Record that every attack runs only on the team’s own instance, and open the ledger every later artifact is hashed into.',
    howTo: 'Name your lab instance, have every member sign, and record where the ledger repository lives. Nothing is attacked before this is signed.',
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'instance', label: 'Team lab instance', type: 'text', required: true, placeholder: 'hub-assistant on team-07’s machine' },
          { field: 'rule', label: 'The rule, in one sentence', type: 'area', required: true, placeholder: 'We run attacks only against our own instance named above, and nowhere else.' },
          { field: 'signed_by', label: 'Signed by (every member)', type: 'area', required: true, placeholder: 'Grace, Ada, Omar — 2026-10-06' },
          { field: 'ledger_repo', label: 'Ledger repository', type: 'text', required: true, placeholder: 'ridgeline-evidence (git)' },
        ],
      },
    ],
    dod: [
      { label: 'The lab instance and the rule are written down', when: { fields: ['instance', 'rule'] } },
      { label: 'Every member has signed and the ledger repository is named', when: { fields: ['signed_by', 'ledger_repo'] } },
    ],
  },

  // 2 — P1 System Map ───────────────────────────────────────────────────────
  {
    id: 'secai_system_map',
    courseId: 'secai-plus',
    feeds: ['secai_attack_casebook', 'secai_control_set'],
    num: 2,
    file: '02_System_Map.md',
    title: 'P1 System Map',
    owner: 'governance',
    folder: '02_System_Map',
    standard: 'NIST AI RMF (Map)',
    framework: 'NIST_AI_RMF',
    weeks: [1, 2, 3, 4],
    kind: 'form',
    exportFormat: 'md',
    purpose: 'What the product is made of: every model, the prompt structure, the data and its life cycle, and the AI tools in use.',
    howTo: 'Add a row per model and per data source. From v2 add the life-cycle stages; from v3 add the AI tools staff use.',
    source: 'The Service Hub as found (week 0)',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'models',
          label: 'Models',
          columns: [
            c('model', 'Model', 'text', { placeholder: 'Service assistant LLM' }),
            c('type', 'Type', 'text', { placeholder: 'Third-party API; lab: llama3.2:3b' }),
            c('tuning', 'Training / tuning', 'text', { placeholder: 'Base model, no tuning' }),
            c('host', 'Host', 'text', { placeholder: 'Ollama, on the team machine' }),
            c('settings', 'Settings', 'text', { placeholder: 'temp 0.2, 8k context' }),
          ],
          seed: [
            { model: 'Service assistant', type: 'Third-party API (lab: llama3.2:3b)', tuning: 'None', host: 'Ollama', settings: 'temp 0.2' },
            { model: 'Failure predictor', type: 'Small fine-tuned', tuning: 'Fine-tuned on sensor history — origin UNKNOWN (SA-6)', host: 'Local', settings: 'n/a' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'data',
          label: 'Data sources',
          columns: [
            c('source', 'Source', 'text', { placeholder: 'Equipment manuals' }),
            c('kind', 'Kind', 'select', { options: ['Structured', 'Semi-structured', 'Unstructured'] }),
            c('origin', 'Origin', 'text', { placeholder: 'Vendor PDFs' }),
            c('writers', 'Who can write', 'text', { placeholder: 'Document reader (on upload)' }),
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'tools',
          label: 'AI tools in use (v3)',
          help: 'IDE plug-in, browser plug-in, command-line tool, chatbot, personal assistant, MCP server.',
          columns: [
            c('tool', 'Tool', 'text', { placeholder: 'ChatGPT' }),
            c('type', 'Type', 'text', { placeholder: 'Chatbot' }),
            c('account', 'Account type', 'select', { options: ['Company', 'Personal', 'None'] }),
            c('data_class', 'Data class allowed', 'text', { placeholder: 'Public only' }),
          ],
        },
      },
    ],
    dod: [
      { label: 'Every model has a type, a tuning method and a host', when: { group: 'models', every: { filled: ['type', 'tuning', 'host'] } } },
      { label: 'At least two data sources name their writers', when: { group: 'data', where: { filled: ['writers'] }, atLeast: 2 } },
      { label: 'AI tools in use are listed by type and account', when: { group: 'tools', where: { filled: ['type', 'account'] }, atLeast: 1 }, week: 3 },
    ],
  },

  // 3 — P2 Attack Casebook ──────────────────────────────────────────────────
  {
    id: 'secai_attack_casebook',
    courseId: 'secai-plus',
    feeds: ['secai_control_set'],
    num: 3,
    file: '03_Attack_Casebook.md',
    title: 'P2 Attack Casebook',
    owner: 'redteam',
    folder: '03_Attack_Casebook',
    standard: 'OWASP LLM Top 10 · MITRE ATLAS',
    framework: 'OWASP_LLM',
    weeks: [1, 2, 3, 4],
    kind: 'form',
    exportFormat: 'md',
    purpose: 'The threat model and the attack cases, each with evidence: input file, transcript and a ledger hash.',
    howTo: 'Add a row per case. v1: two cases. v2: six, mapped to OWASP and ATLAS. v3: a pass line and variants. v4: four paper cases, ten in all.',
    source: 'Attacks run on the team’s own instance',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'cases',
          label: 'Attack cases',
          columns: [
            c('case', 'Case', 'text', { placeholder: 'Direct prompt injection' }),
            c('owasp', 'OWASP LLM', 'text', { placeholder: 'LLM01' }),
            c('atlas', 'ATLAS technique', 'text', { placeholder: 'AML.T0051' }),
            c('evidence', 'Evidence (file + hash)', 'text', { placeholder: 'case-01.txt · 9b1c4e…' }),
            c('status', 'Status', 'select', { options: CASE_STATUS }),
          ],
          seed: [
            { case: 'Direct prompt injection', owasp: 'LLM01', atlas: 'AML.T0051', evidence: 'case-01.txt · 9b1c4e…', status: 'Works' },
            { case: 'Sensitive information disclosure (the key)', owasp: 'LLM02', atlas: 'AML.T0057', evidence: 'case-02.txt · 4e7d2a…', status: 'Works' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Suite',
        fields: [
          { field: 'pass_line', label: 'Pass line (v3)', type: 'text', placeholder: '4 or more of 6 blocked or contained' },
          { field: 'ai_attacker', label: 'AI-enabled attacker scenarios (v2)', type: 'area', placeholder: 'Three scenarios, each with one detection and one control.' },
        ],
      },
    ],
    dod: [
      { label: 'At least two cases, each with an OWASP reference and evidence', when: { group: 'cases', where: { filled: ['owasp', 'evidence'] }, atLeast: 2 } },
      { label: 'Six cases are recorded by v2', when: { group: 'cases', where: { filled: ['case', 'status'] }, atLeast: 6 }, week: 2 },
      { label: 'Every case maps to an ATLAS technique by v2', when: { group: 'cases', every: { filled: ['atlas'] } }, week: 2 },
      { label: 'The suite has a pass line by v3', when: { fields: ['pass_line'] }, week: 3 },
      { label: 'Ten cases in all by v4', when: { group: 'cases', where: { filled: ['case'] }, atLeast: 10 }, week: 4 },
    ],
  },

  // 4 — P3 Control Set ──────────────────────────────────────────────────────
  {
    id: 'secai_control_set',
    courseId: 'secai-plus',
    feeds: ['secai_governance_pack'],
    num: 4,
    file: '04_Control_Set.md',
    title: 'P3 Control Set',
    owner: 'defender',
    folder: '04_Control_Set',
    standard: 'NIST CSF (Protect)',
    framework: 'NIST_CSF',
    weeks: [1, 2, 3, 4],
    gate: 2,
    kind: 'form',
    exportFormat: 'csv',
    purpose: 'The controls as rows — control, who, how often, with what, record — plus the access matrix and the data protection rules.',
    howTo: 'Add a row per control with all five columns. v2 adds the access matrix and data rules; v4 gives each row a test result.',
    source: 'The cases the Red Team proved',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'controls',
          label: 'Controls',
          columns: [
            c('control', 'Control', 'text', { placeholder: 'Key in a secret store' }),
            c('who', 'Who', 'text', { placeholder: 'AI Defender' }),
            c('cadence', 'How often', 'text', { placeholder: 'Rotated every 90 days' }),
            c('with', 'With what', 'text', { placeholder: 'OpenBao' }),
            c('record', 'Record', 'text', { placeholder: 'Rotation log' }),
            c('closes', 'Closes', 'text', { placeholder: 'SA-1' }),
            c('result', 'Test result (v4)', 'text', { placeholder: 'Pass — gitleaks clean' }),
          ],
          seed: [
            { control: 'Key in a secret store', who: 'AI Defender', cadence: '90-day rotation', with: 'OpenBao', record: 'Rotation log', closes: 'SA-1', result: '' },
            { control: 'Per-key rate limit', who: 'AI Defender', cadence: 'Always on', with: 'LiteLLM', record: 'Gateway log', closes: 'SA-4', result: '' },
            { control: 'Input guardrail', who: 'AI Defender', cadence: 'Every request', with: 'LLM Guard', record: 'Guardrail log', closes: 'SA-2', result: '' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'access',
          label: 'Access matrix (v2)',
          help: 'Subjects against objects: who may reach the model endpoint, system prompt, retrieval store, logs, tools and keys.',
          columns: [
            c('subject', 'Subject', 'text', { placeholder: 'Dispatch agent' }),
            c('object', 'Object', 'text', { placeholder: 'Work-order tool' }),
            c('access', 'Access', 'select', { options: ['None', 'Read', 'Write', 'Read/Write'] }),
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three controls with all five columns', when: { group: 'controls', where: { filled: ['control', 'who', 'cadence', 'with', 'record'] }, atLeast: 3 } },
      { label: 'The access matrix has entries by v2', when: { group: 'access', where: { filled: ['subject', 'object', 'access'] }, atLeast: 3 }, week: 2 },
      { label: 'Every control has a test result by v4', when: { group: 'controls', every: { filled: ['result'] } }, week: 4 },
    ],
  },

  // 5 — P4 Watch Plan ───────────────────────────────────────────────────────
  {
    id: 'secai_watch_plan',
    courseId: 'secai-plus',
    feeds: ['secai_governance_pack'],
    num: 5,
    file: '05_Watch_Plan.md',
    title: 'P4 Watch Plan',
    owner: 'defender',
    folder: '05_Watch_Plan',
    standard: 'NIST CSF (Detect, Respond)',
    framework: 'NIST_CSF',
    weeks: [1, 2, 3, 4],
    gate: 3,
    kind: 'form',
    exportFormat: 'md',
    purpose: 'Logging, alert thresholds, detections, the quality audit and the monitoring handover.',
    howTo: 'v1: what is logged, who reads it, how long. v2: redaction and thresholds. v3: detections and audit. v4: the handover sheet.',
    source: 'The gateway and SIEM the Defender built',
    sections: [
      {
        kind: 'fields',
        title: 'Logging',
        fields: [
          { field: 'logged', label: 'What is logged', type: 'area', required: true, placeholder: 'Query, response, caller, time.' },
          { field: 'readers', label: 'Who can read it', type: 'text', required: true, placeholder: 'Two roles: on-call, auditor.' },
          { field: 'retention', label: 'How long it is kept', type: 'text', required: true, placeholder: '90 days' },
          { field: 'redaction', label: 'Redaction before write (v2)', type: 'area', placeholder: 'Names and access codes replaced by Presidio.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'alerts',
          label: 'Alert thresholds (v2) and detections (v3)',
          columns: [
            c('signal', 'Signal', 'text', { placeholder: 'Requests per minute' }),
            c('threshold', 'Threshold', 'text', { placeholder: '> 60 / min / key' }),
            c('owner', 'Owner', 'text', { placeholder: 'On-call defender' }),
            c('action', 'Action', 'text', { placeholder: 'Ticket in GLPI' }),
          ],
          seed: [
            { signal: 'Request rate', threshold: '> 60 / min / key', owner: 'On-call', action: 'GLPI ticket' },
            { signal: 'Prompt cost', threshold: '> $5 / hour', owner: 'FinOps', action: 'GLPI ticket' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Handover (v4)',
        fields: [
          { field: 'handover', label: 'Who watches what, how often', type: 'area', placeholder: 'On-call watches injection and cost alerts, daily; the auditor reviews log access, monthly.' },
        ],
      },
    ],
    dod: [
      { label: 'What is logged, who reads it and for how long are set', when: { fields: ['logged', 'readers', 'retention'] } },
      { label: 'Alert thresholds have owners by v2', when: { group: 'alerts', every: { filled: ['threshold', 'owner'] } }, week: 2 },
      { label: 'The monitoring handover is written by v4', when: { fields: ['handover'] }, week: 4 },
    ],
  },

  // 6 — P5 Governance Pack ──────────────────────────────────────────────────
  {
    id: 'secai_governance_pack',
    courseId: 'secai-plus',
    feeds: ['secai_release_package'],
    num: 6,
    file: '06_Governance_Pack.md',
    title: 'P5 Governance Pack',
    owner: 'governance',
    folder: '06_Governance_Pack',
    standard: 'NIST AI RMF · ISO/IEC 42001',
    framework: 'NIST_AI_RMF',
    weeks: [1, 2, 3, 4],
    kind: 'form',
    exportFormat: 'md',
    purpose: 'The AI policy, the risk register, the compliance table and the responsible-AI assessment.',
    howTo: 'v1: five shall statements and five risks. v2: ten risks, ten roles, the compliance table. v3: tool rules and accuracy. v4: the responsible-AI assessment and signed acceptances.',
    source: 'The controls and cases of each release',
    sections: [
      {
        kind: 'fields',
        title: 'Policy',
        fields: [
          { field: 'policy', label: 'Policy “shall” statements', type: 'area', required: true, placeholder: 'The assistant shall carry no secret in its prompt. …' },
          { field: 'accountable', label: 'Accountable executive', type: 'text', required: true, placeholder: 'CEO — [name]' },
          { field: 'tool_rules', label: 'AI tool rules (v3)', type: 'area', placeholder: 'What never goes to a public model; who validates AI output.' },
          { field: 'rai', label: 'Responsible-AI assessment (v4)', type: 'area', placeholder: 'One line per principle: evidence, or the gap.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'risks',
          label: 'Risk register',
          columns: [
            c('risk', 'Risk', 'text', { placeholder: 'Data leakage through prompts' }),
            c('owner', 'Owner', 'text', { placeholder: 'AI Defender' }),
            c('treatment', 'Treatment', 'text', { placeholder: 'Guardrail + redaction' }),
            c('accepted', 'Accepted by (v4)', 'text', { placeholder: 'CEO — [date]' }),
          ],
          seed: [
            { risk: 'Prompt injection', owner: 'AI Defender', treatment: 'Input guardrail + suite as a test', accepted: '' },
            { risk: 'Unknown training data (SA-6)', owner: 'Governance', treatment: 'Resolve source or accept', accepted: '' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'compliance',
          label: 'Compliance table (v2)',
          help: 'Every rule in the scenario: does it apply, why, and who owns it.',
          columns: [
            c('rule', 'Rule', 'text', { placeholder: 'Texas Responsible AI Governance Act' }),
            c('applies', 'Applies?', 'select', { options: ['Yes', 'No'] }),
            c('because', 'Because', 'text', { placeholder: 'Develops and deploys AI in Texas' }),
            c('owner', 'Owner', 'text', { placeholder: 'Governance' }),
          ],
        },
      },
    ],
    dod: [
      { label: 'Five policy statements and an accountable executive', when: { fields: ['policy', 'accountable'] } },
      { label: 'At least five risks with owner and treatment', when: { group: 'risks', where: { filled: ['owner', 'treatment'] }, atLeast: 5 } },
      { label: 'The compliance table covers the rules by v2', when: { group: 'compliance', where: { filled: ['rule', 'applies', 'because'] }, atLeast: 6 }, week: 2 },
      { label: 'Every remaining risk is accepted in writing by v4', when: { group: 'risks', every: { filled: ['accepted'] } }, week: 4 },
    ],
  },

  // 7 — Release Note (every release) ────────────────────────────────────────
  {
    id: 'secai_release_note',
    courseId: 'secai-plus',
    feeds: ['secai_release_package'],
    num: 7,
    file: '07_Release_Note.md',
    title: 'Release Note',
    owner: 'governance',
    folder: '07_Release_Notes',
    standard: 'Release record',
    framework: 'NIST_CSF',
    weeks: [1, 2, 3, 4],
    gate: 1,
    kind: 'form',
    exportFormat: 'md',
    purpose: 'One page per release: what shipped, the scoreboard, open risks, and the CEO’s signature.',
    howTo: 'Fill one block per release. The scoreboard is the attack and detection counts; the CEO signs each one.',
    source: 'The three documents of the release',
    sections: [
      {
        kind: 'group',
        group: {
          group: 'releases',
          label: 'Releases',
          columns: [
            c('version', 'Release', 'select', { options: ['v1', 'v2', 'v3', 'v4'] }),
            c('shipped', 'What shipped', 'text', { placeholder: 'Gateway, secret store, logging' }),
            c('scoreboard', 'Scoreboard', 'text', { placeholder: '2 attacks · 2 blocked · 2 logged' }),
            c('open', 'Open risks', 'text', { placeholder: 'SA-6 flagged' }),
            c('signed', 'CEO signed', 'text', { placeholder: '[name] · 2026-10-06' }),
          ],
          seed: [{ version: 'v1', shipped: '', scoreboard: '', open: '', signed: '' }],
        },
      },
    ],
    dod: [
      { label: 'At least one release is signed off', when: { group: 'releases', where: { filled: ['version', 'scoreboard', 'signed'] }, atLeast: 1 } },
    ],
  },

  // 8 — Release v4 Package & Assurance Response (capstone) ───────────────────
  {
    id: 'secai_release_package',
    courseId: 'secai-plus',
    capstone: true,
    num: 8,
    file: '08_Release_Package.md',
    title: 'Release v4 Package & Assurance Response',
    owner: 'governance',
    folder: '08_Release_Package',
    standard: 'Customer assurance',
    framework: 'SECAI',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    purpose: 'The final package: the three customer answers, each citing a document and a ledger entry, plus the index of everything shipped.',
    howTo: 'Answer the three questions, cite a document and a ledger hash for each, and list every document with its version and ledger entry.',
    source: 'All five documents at v4 and the ledger',
    sections: [
      {
        kind: 'fields',
        title: 'The three questions',
        fields: [
          { field: 'accountable', label: 'Who is accountable for the AI?', type: 'area', required: true, placeholder: 'The CEO, named in P5 v4 (ledger 06_…:4e7d).' },
          { field: 'rules', label: 'What rules apply to it?', type: 'area', required: true, placeholder: 'The compliance table in P5 v4 (ledger …).' },
          { field: 'wrong', label: 'What happens when it is wrong?', type: 'area', required: true, placeholder: 'The watch plan and incident procedure in P4 v4 (ledger …).' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'index',
          label: 'Package index',
          columns: [
            c('document', 'Document', 'text', { placeholder: 'P1 System Map' }),
            c('version', 'Version', 'text', { placeholder: 'v4' }),
            c('ledger', 'Ledger entry', 'text', { placeholder: '02_System_Map.md · 9b1c4e…' }),
          ],
        },
      },
    ],
    dod: [
      { label: 'All three customer questions are answered with a citation', when: { fields: ['accountable', 'rules', 'wrong'] } },
      { label: 'The package index lists every document with a ledger entry', when: { group: 'index', where: { filled: ['document', 'version', 'ledger'] }, atLeast: 6 } },
    ],
  },
];

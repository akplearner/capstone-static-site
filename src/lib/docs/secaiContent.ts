/**
 * The SecAI+ capstone's picture, as DATA (R101, R103).
 *
 * The Ridgeline Service Hub's AI: who talks to it, the edge, identity, app
 * and gateway in front of it, the models, retrieval store and backups behind
 * it, and the logs, alerts, pipeline and audit around it. Each release adds
 * the controls of that release; the week's process is that week's trigger,
 * walked across the same boxes. The records lane holds the forms that
 * document each part. Plain data, so it ships in the course document
 * (`content.arch`) and `ArchDiagram` draws it.
 */
import { archBuildModel, type ArchNode, type ArchPicture, type ArchZone } from './archPicture';

export const ARCH: ArchPicture = {
  copy: {
    title: 'The Service Hub’s AI — what you attack, defend, watch and govern',
    howToRead:
      'Left: the people who use it. Middle: the edge, identity, app, gateway and agent your team controls. Right: the AI services, the retrieval store and the backups behind them. Bottom: the logs, alerts, pipeline and audit that prove it, and the records that document it. Every attack case and control row names one of these boxes.',
    footer: 'Lab stand-in until the starter kit ships: a small open-weight model in Ollama, Chroma, LiteLLM as the gateway, Keycloak for identity, restic for backups.',
  },
  view: { w: 960, h: 610 },
  zones: [
    { id: 'people', label: 'People', note: 'customers · staff', x: 20, y: 40, w: 150, h: 340, tone: 4 },
    { id: 'app', label: 'Service Hub — your build', note: 'what you configure', x: 190, y: 40, w: 520, h: 340, tone: 2 },
    { id: 'ai', label: 'AI services and data', note: 'models · retrieval · backups', x: 730, y: 40, w: 210, h: 340, tone: 1 },
    { id: 'ops', label: 'Watch and govern', note: 'what proves it', x: 190, y: 410, w: 750, h: 90, tone: 3 },
    { id: 'records', label: 'Records — the forms that document the build', note: 'P1–P5 · releases', x: 20, y: 520, w: 920, h: 70, tone: 6, lane: true },
  ] satisfies ArchZone[],
  nodes: [
    { id: 'customer', label: 'Customer', sub: 'property managers', kind: 'people', zone: 'people', x: 95, y: 100, arrives: 0, records: 'secai_system_map', purpose: 'Asks the assistant about buildings and contracts; the first attacker role' },
    { id: 'technician', label: 'Technician', sub: 'field app', kind: 'people', zone: 'people', x: 95, y: 170, arrives: 0, records: 'secai_system_map', purpose: 'Uses the assistant and the dispatch agent from the field' },
    { id: 'staff', label: 'Office staff', sub: 'personal chatbots (SA-7)', kind: 'people', zone: 'people', x: 95, y: 240, arrives: 0, records: 'secai_governance_pack', purpose: 'Paste contracts into public chatbots until the tool rules exist' },
    { id: 'outside', label: 'Outside inbox', sub: 'where leaks land', kind: 'outside', zone: 'people', x: 95, y: 310, external: true, arrives: 2, records: 'secai_attack_casebook', purpose: 'The address a hijacked agent would email; proves the approval gate' },
    { id: 'waf', label: 'WAF and edge', sub: 'TLS · size and rate limits', kind: 'firewall', zone: 'app', x: 275, y: 100, arrives: 2, records: 'secai_control_set', role: 'defender', purpose: 'Stops floods and oversized requests before they reach the portal' },
    { id: 'portal', label: 'Customer portal', sub: 'renders the answer', kind: 'app', zone: 'app', x: 445, y: 100, arrives: 0, records: 'secai_system_map', purpose: 'Where customers and technicians ask the assistant' },
    { id: 'idp', label: 'Identity (SSO)', sub: 'Keycloak · MFA · key owner', kind: 'idp', zone: 'app', x: 615, y: 100, arrives: 1, records: 'secai_control_set', role: 'defender', purpose: 'Who each caller is, before any gateway key is issued' },
    { id: 'intake', label: 'Document intake', sub: 'scan · quarantine · label', kind: 'control', zone: 'app', x: 275, y: 170, arrives: 2, records: 'secai_control_set', role: 'defender', purpose: 'Scans uploaded work orders before the retrieval store sees them' },
    { id: 'gateway', label: 'AI gateway', sub: 'keys · limits · logging', kind: 'control', zone: 'app', x: 445, y: 170, arrives: 1, records: 'secai_control_set', role: 'defender', purpose: 'The only path to the model: per-key limits, every call logged' },
    { id: 'guardrail', label: 'Guardrails', sub: 'input · output screening', kind: 'control', zone: 'app', x: 615, y: 170, arrives: 2, records: 'secai_control_set', role: 'defender', purpose: 'Screens prompts in and answers out; the attack suite tests it' },
    { id: 'agent', label: 'Dispatch agent', sub: 'assigns · messages', kind: 'ai', zone: 'app', x: 275, y: 240, arrives: 0, records: 'secai_system_map', purpose: 'Assigns technicians and sends messages through its tools' },
    { id: 'tools', label: 'Work-order + email tools', sub: 'scoped tokens', kind: 'app', zone: 'app', x: 445, y: 240, arrives: 0, records: 'secai_system_map', purpose: 'What the agent can touch; scoped tokens and an approval for email' },
    { id: 'secrets', label: 'Secret store', sub: 'keys out of prompts', kind: 'identity', zone: 'app', x: 615, y: 240, arrives: 1, records: 'secai_control_set', role: 'defender', purpose: 'Holds the API keys the prompt used to carry; rotated' },
    { id: 'runtime', label: 'Runtime hosting', sub: 'containers · one Linux host', kind: 'server', zone: 'app', x: 275, y: 310, arrives: 0, records: 'secai_system_map', purpose: 'Where the portal, agent and gateway run' },
    { id: 'aitools', label: 'Staff AI tools', sub: 'allow-list · sanctioned accounts', kind: 'control', zone: 'app', x: 445, y: 310, arrives: 3, records: 'secai_governance_pack', role: 'governance', purpose: 'Which AI tools staff may use, with what data' },
    { id: 'llm', label: 'Language model', sub: 'third-party API · lab: Ollama', kind: 'ai', zone: 'ai', x: 835, y: 100, arrives: 0, records: 'secai_system_map', purpose: 'Answers the prompts the gateway forwards' },
    { id: 'retrieval', label: 'Retrieval store', sub: 'manuals · records · contracts', kind: 'data', zone: 'ai', x: 835, y: 170, arrives: 0, records: 'secai_system_map', purpose: 'The documents the model reads; poisoned if intake is missing' },
    { id: 'predictor', label: 'Failure predictor', sub: 'fine-tuned (SA-6)', kind: 'ai', zone: 'ai', x: 835, y: 240, arrives: 0, records: 'secai_system_map', purpose: 'Rates equipment failure; its training data is of unknown origin' },
    { id: 'backup', label: 'Backups', sub: 'retrieval store · configs', kind: 'backup', zone: 'ai', x: 835, y: 310, arrives: 3, records: 'secai_control_set', role: 'defender', purpose: 'A restorable copy of the store and the gateway configuration' },
    { id: 'logs', label: 'Logs and traces', sub: 'redacted · two readers', kind: 'monitor', zone: 'ops', x: 275, y: 455, arrives: 1, records: 'secai_watch_plan', role: 'defender', purpose: 'Every request and answer, redacted before it is written' },
    { id: 'siem', label: 'Wazuh alerts', sub: 'injection · cost spike', kind: 'siem', zone: 'ops', x: 445, y: 455, arrives: 2, records: 'secai_watch_plan', role: 'defender', purpose: 'Turns gateway logs into alerts with an owner' },
    { id: 'pipeline', label: 'Pipeline gates', sub: 'attack suite as a test', kind: 'pipeline', zone: 'ops', x: 615, y: 455, arrives: 3, records: 'secai_control_set', role: 'defender', purpose: 'Blocks a release that fails the scans or the attack suite' },
    { id: 'audit', label: 'Quality audit', sub: '20-question sample · bias', kind: 'monitor', zone: 'ops', x: 785, y: 455, arrives: 3, records: 'secai_watch_plan', role: 'governance', purpose: 'Measures accuracy, refusals and bias on a fixed sample' },
    { id: 'r_lab', label: 'Lab rule & ledger', sub: '', kind: 'record', zone: 'records', x: 135, y: 538, arrives: 0, records: 'secai_lab_rule', role: 'governance', purpose: 'Records the lab rule and the hashed evidence ledger' },
    { id: 'r_map', label: 'P1 System map', sub: '', kind: 'record', zone: 'records', x: 365, y: 538, arrives: 1, records: 'secai_system_map', role: 'governance', purpose: 'Records every model, prompt structure and data writer' },
    { id: 'r_cases', label: 'P2 Attack casebook', sub: '', kind: 'record', zone: 'records', x: 595, y: 538, arrives: 1, records: 'secai_attack_casebook', role: 'redteam', purpose: 'Records each proved attack case with its evidence' },
    { id: 'r_controls', label: 'P3 Control set', sub: '', kind: 'record', zone: 'records', x: 825, y: 538, arrives: 1, records: 'secai_control_set', role: 'defender', purpose: 'Records every control: who, how often, with what, the record' },
    { id: 'r_watch', label: 'P4 Watch plan', sub: '', kind: 'record', zone: 'records', x: 135, y: 572, arrives: 1, records: 'secai_watch_plan', role: 'defender', purpose: 'Records logging, thresholds, detections and the handover' },
    { id: 'governance', label: 'P5 Governance pack', sub: '', kind: 'record', zone: 'records', x: 365, y: 572, arrives: 1, records: 'secai_governance_pack', role: 'governance', purpose: 'Records the policy, risks, rules, procedures and sign-offs' },
    { id: 'r_note', label: 'Release note', sub: '', kind: 'record', zone: 'records', x: 595, y: 572, arrives: 1, records: 'secai_release_note', role: 'governance', purpose: 'Records what each release shipped and what stays open' },
    { id: 'r_package', label: 'v4 Release package', sub: '', kind: 'record', zone: 'records', x: 825, y: 572, arrives: 4, records: 'secai_release_package', role: 'governance', purpose: 'The capstone: the proven product and the assurance answers' },
  ] satisfies ArchNode[],
  edges: [
    { from: 'customer', to: 'portal', label: 'questions' },
    { from: 'portal', to: 'gateway', label: 'prompt' },
    { from: 'gateway', to: 'llm', label: 'prompt + retrieved text' },
    { from: 'llm', to: 'retrieval', label: 'reads' },
    { from: 'idp', to: 'gateway', label: 'who the caller is', kind: 'trust' },
    { from: 'gateway', to: 'logs', label: 'every request', kind: 'log' },
    { from: 'logs', to: 'siem', label: 'alerts', kind: 'log' },
    { from: 'retrieval', to: 'backup', label: 'nightly', kind: 'backup' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'The product as found', steps: [
      { from: 'customer', to: 'portal', label: 'asks a question' },
      { from: 'portal', to: 'llm', label: 'prompt with the key inside' },
      { from: 'llm', to: 'retrieval', label: 'reads manuals and records' },
    ] },
    1: { title: 'Release v1: stop the leak', steps: [
      { from: 'customer', to: 'gateway', label: 'print your hidden instructions' },
      { from: 'idp', to: 'gateway', label: 'a key per known caller' },
      { from: 'gateway', to: 'llm', label: 'rate-limited, no key inside' },
      { from: 'gateway', to: 'logs', label: 'every attempt logged' },
    ] },
    2: { title: 'Release v2: the poisoned work order', steps: [
      { from: 'intake', to: 'retrieval', label: 'scanned before it is stored' },
      { from: 'agent', to: 'tools', label: 'scoped token, no admin' },
      { from: 'tools', to: 'outside', label: 'outbound email needs approval' },
      { from: 'logs', to: 'siem', label: 'thresholds with an owner' },
    ] },
    3: { title: 'Release v3: automated and measured', steps: [
      { from: 'pipeline', to: 'guardrail', label: 'guardrail removed: build blocked' },
      { from: 'logs', to: 'siem', label: 'injection pattern raises an alert' },
      { from: 'audit', to: 'llm', label: 'twenty questions, scored' },
      { from: 'staff', to: 'governance', label: 'a decision for every tool' },
    ] },
    4: { title: 'Release v4: proven and handed over', steps: [
      { from: 'backup', to: 'runtime', label: 'clean rebuild, same results' },
      { from: 'siem', to: 'governance', label: 'six of six alerts' },
      { from: 'governance', to: 'customer', label: 'three answers, with evidence' },
    ] },
  },
  captions: {
    0: 'The product as found: portal, agent and tools on one runtime, the models and the retrieval store, every planted weakness in place.',
    1: 'New: identity, the gateway, the secret store, logging and the governance pack. The key leaves the prompt; every attempt is logged.',
    2: 'New: the WAF, guardrails, document intake and alerts. A poisoned work order is quarantined; the agent cannot email without a person.',
    3: 'New: the pipeline, backups, the quality audit and the staff’s own AI tools. A missing guardrail blocks the build.',
    4: 'Nothing new is built: a clean copy is rebuilt from the backups, matches v3, alerts on all six, and the customers get evidence.',
  },
});

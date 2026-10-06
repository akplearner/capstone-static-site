/**
 * The SecAI+ capstone's picture, as DATA (R101).
 *
 * The Ridgeline Service Hub's AI: who talks to it, the app and gateway in
 * front of it, the models and the retrieval store behind it, and the logs,
 * alerts, pipeline and governance around it. Each release adds the controls
 * of that release; the week's process is that week's trigger, walked across
 * the same boxes. Plain data, so it ships in the course document
 * (`content.hub`) and `HubDiagram` draws it.
 */
import type { BuildModel } from '../weekVisual';
import type { HubNode, HubPicture, HubZone } from './hub';

export const HUB: HubPicture = {
  copy: {
    title: 'The Service Hub’s AI — what you attack, defend, watch and govern',
    howToRead:
      'Left: the people who use it. Middle: the app, the gateway and the agent your team controls. Right, top: the AI services behind it. Right, bottom: the logs, alerts, pipeline and governance you build. Every attack case and control row names one of these boxes.',
    footer: 'Lab stand-in until the starter kit ships: a small open-weight model in Ollama, Chroma, and LiteLLM as the gateway.',
  },
  view: { w: 960, h: 400 },
  zones: [
    { id: 'people', label: 'People', note: 'customers · staff', x: 20, y: 40, w: 170, h: 340, tone: 4 },
    { id: 'app', label: 'Service Hub — your build', note: 'what you configure', x: 210, y: 40, w: 360, h: 340, tone: 2 },
    { id: 'ai', label: 'AI services', note: 'models · retrieval', x: 590, y: 40, w: 350, h: 180, tone: 1 },
    { id: 'ops', label: 'Watch and govern', note: 'what proves it', x: 590, y: 240, w: 350, h: 140, tone: 3 },
  ] satisfies HubZone[],
  nodes: [
    { id: 'customer', label: 'Customer', sub: 'property managers', kind: 'people', zone: 'people', x: 105, y: 100 },
    { id: 'technician', label: 'Technician', sub: 'field app', kind: 'people', zone: 'people', x: 105, y: 170 },
    { id: 'staff', label: 'Office staff', sub: 'personal chatbots (SA-7)', kind: 'people', zone: 'people', x: 105, y: 250 },
    { id: 'outside', label: 'Outside inbox', sub: 'where leaks land', kind: 'outside', zone: 'people', x: 105, y: 320, external: true },
    { id: 'portal', label: 'Customer portal', sub: 'renders the answer', kind: 'app', zone: 'app', x: 305, y: 100 },
    { id: 'gateway', label: 'AI gateway', sub: 'keys · limits · logging', kind: 'control', zone: 'app', x: 475, y: 100 },
    { id: 'intake', label: 'Document intake', sub: 'scan · quarantine · label', kind: 'control', zone: 'app', x: 305, y: 170 },
    { id: 'guardrail', label: 'Guardrails', sub: 'input · output screening', kind: 'control', zone: 'app', x: 475, y: 170 },
    { id: 'agent', label: 'Dispatch agent', sub: 'assigns · messages', kind: 'ai', zone: 'app', x: 305, y: 250 },
    { id: 'tools', label: 'Work-order + email tools', sub: 'scoped tokens', kind: 'app', zone: 'app', x: 475, y: 250 },
    { id: 'secrets', label: 'Secret store', sub: 'keys out of prompts', kind: 'identity', zone: 'app', x: 305, y: 320 },
    { id: 'llm', label: 'Language model', sub: 'third-party API · lab: Ollama', kind: 'ai', zone: 'ai', x: 680, y: 100 },
    { id: 'retrieval', label: 'Retrieval store', sub: 'manuals · records · contracts', kind: 'data', zone: 'ai', x: 850, y: 100 },
    { id: 'predictor', label: 'Failure predictor', sub: 'fine-tuned (SA-6)', kind: 'ai', zone: 'ai', x: 680, y: 175 },
    { id: 'logs', label: 'Logs and traces', sub: 'redacted · two readers', kind: 'monitor', zone: 'ops', x: 680, y: 280 },
    { id: 'siem', label: 'Wazuh alerts', sub: 'injection · cost spike', kind: 'monitor', zone: 'ops', x: 850, y: 280 },
    { id: 'pipeline', label: 'Pipeline gates', sub: 'attack suite as a test', kind: 'pipeline', zone: 'ops', x: 680, y: 345 },
    { id: 'governance', label: 'Governance pack', sub: 'policy · risks · sign-off', kind: 'control', zone: 'ops', x: 850, y: 345 },
  ] satisfies HubNode[],
  edges: [
    { from: 'customer', to: 'portal', label: 'questions' },
    { from: 'portal', to: 'llm', label: 'prompt + retrieved text' },
    { from: 'llm', to: 'retrieval', label: 'reads' },
  ],
};

export const HUB_BUILD: BuildModel = {
  arrives: {
    customer: 0, technician: 0, portal: 0, agent: 0, tools: 0, llm: 0, retrieval: 0, predictor: 0,
    gateway: 1, secrets: 1, logs: 1, governance: 1,
    guardrail: 2, intake: 2, outside: 2, siem: 2,
    pipeline: 3, staff: 3,
  },
  processes: {
    0: { title: 'The product as found', steps: [
      { from: 'customer', to: 'portal', label: 'asks a question' },
      { from: 'portal', to: 'llm', label: 'prompt with the key inside' },
      { from: 'llm', to: 'retrieval', label: 'reads manuals and records' },
    ] },
    1: { title: 'Release v1: stop the leak', steps: [
      { from: 'customer', to: 'gateway', label: 'print your hidden instructions' },
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
      { from: 'staff', to: 'governance', label: 'a decision for every tool' },
    ] },
    4: { title: 'Release v4: proven and handed over', steps: [
      { from: 'pipeline', to: 'portal', label: 'clean rebuild, same results' },
      { from: 'siem', to: 'governance', label: 'six of six alerts' },
      { from: 'governance', to: 'customer', label: 'three answers, with evidence' },
    ] },
  },
  captions: {
    0: 'The product as found: the assistant, the agent and its tools, the models and the retrieval store, every planted weakness still in place.',
    1: 'New: the gateway, the secret store, logging and the governance pack. The key leaves the prompt and every attempt is logged.',
    2: 'New: guardrails, document intake and alerts. A poisoned work order is quarantined and the agent cannot email without a person.',
    3: 'New: the pipeline and the staff’s own AI tools. The attack suite runs as a test and a missing guardrail blocks the build.',
    4: 'Nothing new is built: a clean copy is rebuilt, matches v3 and alerts on all six, and the customers get evidence-backed answers.',
  },
};

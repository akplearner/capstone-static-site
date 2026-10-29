/**
 * The AWS AI Practitioner Bedrock Studio's picture, as DATA (R103, R130).
 *
 * One small generative-AI assistant: the local model the team learns on, the
 * Amazon Bedrock model it is built on, the language and document senses it
 * grows, the evidence that proves each answer is grounded, and the records
 * lane. Each part arrives in the week the course first touches it; the week's
 * process is that week's thread walked across the same boxes. Plain data, so it
 * ships in the course document (`content.arch`) and `ArchDiagram` draws it.
 */
import { archBuildModel, type ArchNode, type ArchPicture, type ArchZone } from './archPicture';

export const ARCH: ArchPicture = {
  copy: {
    title: 'The studio — a local model, the Bedrock model, and the senses it grows',
    howToRead:
      'Left: the local model and the notes the team learns grounding on. Middle: the Amazon Bedrock model and the grounded app. Right: the language and document senses and the agent. Bottom: the evidence that every answer is grounded. Lane: the records issued at handover.',
    footer: 'No paid resources required: the hands-on model runs locally, the Bedrock calls are kept tiny and the solution is torn down at the end.',
  },
  view: { w: 960, h: 610 },
  zones: [
    { id: 'local', label: 'The local model', note: 'Ollama · notes', x: 20, y: 40, w: 180, h: 340, tone: 1 },
    { id: 'foundry', label: 'Amazon Bedrock — the solution', note: 'model · app', x: 220, y: 40, w: 500, h: 340, tone: 2 },
    { id: 'senses', label: 'The senses it grows', note: 'language · documents · agent', x: 740, y: 40, w: 200, h: 340, tone: 3 },
    { id: 'proof', label: 'The evidence it is grounded', note: 'responsible AI · evaluation · custody', x: 220, y: 410, w: 720, h: 90, tone: 4 },
    { id: 'records', label: 'Records — the forms issued at handover', note: '1–8 · the solution documented', x: 20, y: 520, w: 920, h: 70, tone: 6, lane: true },
  ] satisfies ArchZone[],
  nodes: [
    { id: 'ollama', label: 'Local model', sub: 'Ollama · offline', kind: 'app', zone: 'local', x: 110, y: 110, arrives: 0, records: 'awsai_setup', role: 'build', purpose: 'A model small enough for a laptop, to learn grounding offline' },
    { id: 'notes', label: 'Studio notes', sub: 'the grounding source', kind: 'data', zone: 'local', x: 110, y: 200, arrives: 1, records: 'awsai_capabilities', role: 'language', purpose: 'The text the assistant is made to answer from, and cite' },
    { id: 'folder', label: 'Studio folder', sub: 'week-0 to week-4', kind: 'backup', zone: 'local', x: 110, y: 290, arrives: 0, records: 'awsai_setup', role: 'records', purpose: 'Every prompt, transcript and output, under the week it belongs to' },
    { id: 'project', label: 'Model access', sub: 'granted in Bedrock', kind: 'control', zone: 'foundry', x: 320, y: 110, arrives: 3, records: 'awsai_build', role: 'build', purpose: 'Access to one foundation model, requested in the Bedrock console' },
    { id: 'model', label: 'Bedrock model', sub: 'InvokeModel', kind: 'app', zone: 'foundry', x: 480, y: 110, arrives: 3, records: 'awsai_build', role: 'build', purpose: 'A foundation model answered through the Bedrock runtime' },
    { id: 'app', label: 'Grounded app', sub: 'answers from the notes', kind: 'app', zone: 'foundry', x: 630, y: 110, arrives: 3, records: 'awsai_build', role: 'build', purpose: 'Answers only from the studio documents, and says when they are silent' },
    { id: 'workloads', label: 'Capabilities map', sub: 'workloads · limits', kind: 'evidence', zone: 'foundry', x: 320, y: 200, arrives: 1, records: 'awsai_capabilities', role: 'concepts', purpose: 'Every feature tagged with its workload and the service behind it' },
    { id: 'ml', label: 'Training and metrics', sub: 'labelled set · score', kind: 'monitor', zone: 'foundry', x: 480, y: 200, arrives: 2, records: 'awsai_responsible', role: 'build', purpose: 'A model scored against a labelled set, so accuracy means a number' },
    { id: 'language', label: 'Comprehend', sub: 'sentiment', kind: 'scanner', zone: 'senses', x: 840, y: 110, arrives: 3, records: 'awsai_services', role: 'language', purpose: 'Reads sentiment and key phrases out of text' },
    { id: 'vision', label: 'Textract', sub: 'read a scan', kind: 'scanner', zone: 'senses', x: 840, y: 200, arrives: 3, records: 'awsai_services', role: 'language', purpose: 'Reads the text out of a scanned document' },
    { id: 'agent', label: 'Extraction agent', sub: 'document to JSON', kind: 'control', zone: 'senses', x: 840, y: 290, arrives: 4, records: 'awsai_services', role: 'build', purpose: 'Reads a document into structured JSON, a missing field left null' },
    { id: 'responsible', label: 'Responsible AI', sub: 'guidelines · decision', kind: 'control', zone: 'proof', x: 320, y: 455, arrives: 2, records: 'awsai_responsible', role: 'concepts', purpose: 'A finding and a mitigation per guideline, and the deployment decision' },
    { id: 'eval', label: 'Grounding log', sub: 'one change per row', kind: 'monitor', zone: 'proof', x: 480, y: 455, arrives: 2, records: 'awsai_eval', role: 'records', purpose: 'A wrong answer worked to grounded, the failed theories kept' },
    { id: 'govern', label: 'IAM & risks', sub: 'least privilege · owner', kind: 'control', zone: 'proof', x: 640, y: 455, arrives: 4, records: 'awsai_governance', role: 'records', purpose: 'Least-privilege IAM, a guardrail, and each risk with an owner' },
    { id: 'custody', label: 'Custody', sub: 'every artifact hashed', kind: 'backup', zone: 'proof', x: 800, y: 455, arrives: 4, records: 'awsai_handover', role: 'records', purpose: 'A hash for every artifact the course produced' },
    { id: 'r_setup', label: '1 Setup & access', sub: '', kind: 'record', zone: 'records', x: 85, y: 538, arrives: 0, records: 'awsai_setup', role: 'records', purpose: 'Records the account, the budget guard and the local models' },
    { id: 'r_capabilities', label: '2 Capabilities map', sub: '', kind: 'record', zone: 'records', x: 250, y: 538, arrives: 1, records: 'awsai_capabilities', role: 'concepts', purpose: 'Records the workloads, their services and their limits' },
    { id: 'r_responsible', label: '3 Responsible AI', sub: '', kind: 'record', zone: 'records', x: 415, y: 538, arrives: 2, records: 'awsai_responsible', role: 'concepts', purpose: 'Records the six guidelines and the deployment decision' },
    { id: 'r_eval', label: '4 Evaluation log', sub: '', kind: 'record', zone: 'records', x: 580, y: 538, arrives: 2, records: 'awsai_eval', role: 'records', purpose: 'Records each wrong answer worked to grounded' },
    { id: 'r_build', label: '5 Bedrock build', sub: '', kind: 'record', zone: 'records', x: 745, y: 538, arrives: 3, records: 'awsai_build', role: 'build', purpose: 'Records the invoked model and the grounded app' },
    { id: 'r_services', label: '6 Services & agent', sub: '', kind: 'record', zone: 'records', x: 85, y: 572, arrives: 3, records: 'awsai_services', role: 'language', purpose: 'Records the language, document and extraction calls' },
    { id: 'r_governance', label: '7 Security & risks', sub: '', kind: 'record', zone: 'records', x: 250, y: 572, arrives: 4, records: 'awsai_governance', role: 'records', purpose: 'Records the IAM, the guardrail, the risks and owners' },
    { id: 'r_handover', label: '8 Handover', sub: '', kind: 'record', zone: 'records', x: 415, y: 572, arrives: 4, records: 'awsai_handover', role: 'records', purpose: 'The capstone: the solution as it is, with custody for every artifact' },
    { id: 'r_portfolio', label: '9 Portfolio', sub: '', kind: 'record', zone: 'records', x: 580, y: 572, arrives: 4, records: 'awsai_portfolio', role: 'records', purpose: 'The repository, case study, resume bullets and diagram' },
  ] satisfies ArchNode[],
  edges: [
    { from: 'ollama', to: 'notes', label: 'grounded on' },
    { from: 'notes', to: 'app', label: 'answers from', kind: 'log' },
    { from: 'model', to: 'app', label: 'serves' },
    { from: 'app', to: 'eval', label: 'checked', kind: 'log' },
    { from: 'language', to: 'app', label: 'adds sense' },
    { from: 'vision', to: 'agent', label: 'reads text' },
    { from: 'agent', to: 'custody', label: 'JSON saved', kind: 'backup' },
    { from: 'responsible', to: 'govern', label: 'findings', kind: 'admin' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'Set up: the account, a local model, the folder', steps: [
      { from: 'ollama', to: 'folder', label: 'model pulled, runs offline' },
    ] },
    1: { title: 'Week 1: name the workloads, ground a local answer', steps: [
      { from: 'ollama', to: 'notes', label: 'answers from the notes' },
      { from: 'notes', to: 'workloads', label: 'mapped to workloads' },
    ] },
    2: { title: 'Week 2: weigh it, and work a wrong answer', steps: [
      { from: 'ml', to: 'responsible', label: 'scored and assessed' },
      { from: 'app', to: 'eval', label: 'wrong answer worked to grounded' },
    ] },
    3: { title: 'Week 3: invoke, build the app, add the senses', steps: [
      { from: 'model', to: 'app', label: 'invoked and served' },
      { from: 'notes', to: 'app', label: 'grounded on the documents' },
      { from: 'language', to: 'app', label: 'language added' },
      { from: 'vision', to: 'agent', label: 'document read' },
    ] },
    4: { title: 'Week 4: the agent, the security, the handover', steps: [
      { from: 'vision', to: 'agent', label: 'document to JSON' },
      { from: 'responsible', to: 'govern', label: 'risks owned' },
      { from: 'agent', to: 'custody', label: 'every artifact hashed' },
      { from: 'custody', to: 'r_handover', label: 'handed over' },
    ] },
  },
  captions: {
    0: 'The account with a budget guard, a local model running offline, and the studio folder ready.',
    1: 'New: the workloads named, the model read from its own output, and a local answer grounded in the notes.',
    2: 'New: the responsible-AI guidelines assessed, a model scored, and a wrong answer worked to grounded.',
    3: 'New: a model invoked on Bedrock, a grounded chat app, and the language and document senses.',
    4: 'New: an agent that extracts JSON, least-privilege IAM and a guardrail, the custody log, and the solution torn down.',
  },
});

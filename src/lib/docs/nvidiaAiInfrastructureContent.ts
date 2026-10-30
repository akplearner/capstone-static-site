/**
 * The NVIDIA AI Infrastructure GPU Yard's picture, as DATA (R103, R130).
 *
 * The infrastructure under an AI cluster, planned from the numbers: the
 * essential AI knowledge and the stack, the GPU read and sized, the data centre
 * that powers, cools and connects it, the operations that keep it running, and
 * the records lane. Each part arrives in the week the course first touches it;
 * the week's process is that week's thread walked across the same boxes. Plain
 * data, drawn by `ArchDiagram`.
 */
import { archBuildModel, type ArchNode, type ArchPicture, type ArchZone } from './archPicture';

export const ARCH: ArchPicture = {
  copy: {
    title: 'The GPU yard — essentials, a GPU sized, a data centre to run it',
    howToRead:
      'Left: the essentials — a local model, the concepts and the stack. Middle: the GPU read from nvidia-smi and sized to a model. Right: the data centre — fabric, power and cooling. Bottom: the operations that keep it running. Lane: the records issued at handover.',
    footer: 'No GPU required: the specs, the captured nvidia-smi and dcgmi output and the fault are all parsed on a laptop.',
  },
  view: { w: 960, h: 610 },
  zones: [
    { id: 'essentials', label: 'The essentials', note: 'model · concepts · stack', x: 20, y: 40, w: 180, h: 340, tone: 1 },
    { id: 'gpu', label: 'Read and size the GPU', note: 'nvidia-smi · memory · data path', x: 220, y: 40, w: 500, h: 340, tone: 2 },
    { id: 'datacentre', label: 'The data centre', note: 'fabric · power · cooling', x: 740, y: 40, w: 200, h: 340, tone: 3 },
    { id: 'proof', label: 'Operate and survive', note: 'monitoring · fault · custody', x: 220, y: 410, w: 720, h: 90, tone: 4 },
    { id: 'records', label: 'Records — the forms issued at handover', note: '1–7 · the plan documented', x: 20, y: 520, w: 920, h: 70, tone: 6, lane: true },
  ] satisfies ArchZone[],
  nodes: [
    { id: 'model', label: 'Local model', sub: 'Ollama · inference', kind: 'app', zone: 'essentials', x: 110, y: 110, arrives: 0, records: 'nca_setup', role: 'knowledge', purpose: 'Inference you can run and time on a laptop CPU' },
    { id: 'concepts', label: 'AI / ML / DL', sub: 'training vs inference', kind: 'evidence', zone: 'essentials', x: 110, y: 200, arrives: 1, records: 'nca_knowledge', role: 'knowledge', purpose: 'The workloads named, so the sizing is the right way round' },
    { id: 'stack', label: 'NVIDIA stack', sub: 'driver · CUDA', kind: 'control', zone: 'essentials', x: 110, y: 290, arrives: 1, records: 'nca_knowledge', role: 'records', purpose: 'Driver up to framework, the layers a mismatch hides in' },
    { id: 'specs', label: 'GPU spec table', sub: 'the numbers', kind: 'data', zone: 'gpu', x: 320, y: 110, arrives: 0, records: 'nca_setup', role: 'infra', purpose: 'Every infrastructure number is computed from this table' },
    { id: 'arch', label: 'GPU architecture', sub: 'cores · memory', kind: 'server', zone: 'gpu', x: 480, y: 110, arrives: 1, records: 'nca_knowledge', role: 'infra', purpose: 'Tensor cores and memory, read from the table' },
    { id: 'smi', label: 'nvidia-smi', sub: 'name · mem · util', kind: 'monitor', zone: 'gpu', x: 630, y: 110, arrives: 2, records: 'nca_hardware', role: 'infra', purpose: 'What GPU this is, its memory and whether it is busy' },
    { id: 'sizing', label: 'Memory sizing', sub: 'params → VRAM', kind: 'control', zone: 'gpu', x: 320, y: 200, arrives: 2, records: 'nca_hardware', role: 'infra', purpose: 'The memory a model needs, computed from its parameters' },
    { id: 'gpu_chosen', label: 'GPU chosen', sub: 'fits with headroom', kind: 'server', zone: 'gpu', x: 480, y: 200, arrives: 2, records: 'nca_hardware', role: 'infra', purpose: 'The smallest GPU that holds the model with headroom' },
    { id: 'datapath', label: 'Data path', sub: 'storage · DPU', kind: 'data', zone: 'gpu', x: 630, y: 200, arrives: 2, records: 'nca_hardware', role: 'datacenter', purpose: 'What feeds the GPU, so it computes instead of starving' },
    { id: 'fabric', label: 'Network fabric', sub: 'NVLink · IB', kind: 'switch', zone: 'datacentre', x: 840, y: 110, arrives: 3, records: 'nca_datacenter', role: 'datacenter', purpose: 'The fast fabric that makes many GPUs act as one' },
    { id: 'power', label: 'Power & cooling', sub: 'watts · BTU', kind: 'control', zone: 'datacentre', x: 840, y: 200, arrives: 3, records: 'nca_datacenter', role: 'datacenter', purpose: 'The power drawn and the heat the cooling must remove' },
    { id: 'scale', label: 'Scaling', sub: 'GPU-hours → nodes', kind: 'monitor', zone: 'datacentre', x: 840, y: 290, arrives: 3, records: 'nca_datacenter', role: 'infra', purpose: 'The node count a training job needs for its deadline' },
    { id: 'monitor', label: 'Monitoring', sub: 'dcgmi · thresholds', kind: 'scanner', zone: 'proof', x: 320, y: 455, arrives: 4, records: 'nca_operations', role: 'records', purpose: 'The telemetry read and the thresholds to alert on' },
    { id: 'fault', label: 'Scheduling fault', sub: 'one change per row', kind: 'ticket', zone: 'proof', x: 480, y: 455, arrives: 4, records: 'nca_troubleshoot', role: 'records', purpose: 'A job stuck off the GPU nodes, worked to Running' },
    { id: 'custody', label: 'Custody', sub: 'every artifact hashed', kind: 'backup', zone: 'proof', x: 660, y: 455, arrives: 4, records: 'nca_handover', role: 'records', purpose: 'A hash for every artifact the course produced' },
    { id: 'r_setup', label: '1 Setup & reference', sub: '', kind: 'record', zone: 'records', x: 85, y: 538, arrives: 0, records: 'nca_setup', role: 'records', purpose: 'Records the tools and the spec pack' },
    { id: 'r_knowledge', label: '2 Knowledge & stack', sub: '', kind: 'record', zone: 'records', x: 230, y: 538, arrives: 1, records: 'nca_knowledge', role: 'knowledge', purpose: 'Records the concepts, the architecture and the stack' },
    { id: 'r_hardware', label: '3 Hardware & sizing', sub: '', kind: 'record', zone: 'records', x: 375, y: 538, arrives: 2, records: 'nca_hardware', role: 'infra', purpose: 'Records the GPU read, the sizing and the decision' },
    { id: 'r_datacentre', label: '4 Capacity', sub: '', kind: 'record', zone: 'records', x: 520, y: 538, arrives: 3, records: 'nca_datacenter', role: 'datacenter', purpose: 'Records the fabric, power, cooling and node count' },
    { id: 'r_operations', label: '5 Operations log', sub: '', kind: 'record', zone: 'records', x: 665, y: 538, arrives: 4, records: 'nca_operations', role: 'records', purpose: 'Records the telemetry and the alert thresholds' },
    { id: 'r_trouble', label: '6 Troubleshooting log', sub: '', kind: 'record', zone: 'records', x: 810, y: 538, arrives: 4, records: 'nca_troubleshoot', role: 'records', purpose: 'Records the scheduling fault worked one change per row' },
    { id: 'r_handover', label: '7 Handover', sub: '', kind: 'record', zone: 'records', x: 85, y: 572, arrives: 4, records: 'nca_handover', role: 'records', purpose: 'The capstone: the plan as it is, with custody for every artifact' },
    { id: 'r_portfolio', label: '8 Portfolio', sub: '', kind: 'record', zone: 'records', x: 230, y: 572, arrives: 4, records: 'nca_portfolio', role: 'records', purpose: 'The repository, case study, resume bullets and diagram' },
  ] satisfies ArchNode[],
  edges: [
    { from: 'specs', to: 'arch', label: 'read from' },
    { from: 'concepts', to: 'sizing', label: 'informs' },
    { from: 'smi', to: 'gpu_chosen', label: 'reads' },
    { from: 'sizing', to: 'gpu_chosen', label: 'picks' },
    { from: 'gpu_chosen', to: 'power', label: 'draws', kind: 'admin' },
    { from: 'gpu_chosen', to: 'fabric', label: 'connects' },
    { from: 'datapath', to: 'gpu_chosen', label: 'feeds' },
    { from: 'fault', to: 'custody', label: 'operated', kind: 'admin' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'Set up: a model, the spec pack, the folder', steps: [
      { from: 'specs', to: 'model', label: 'spec table and samples built' },
    ] },
    1: { title: 'Week 1: concepts, architecture, the stack', steps: [
      { from: 'model', to: 'concepts', label: 'inference run and timed' },
      { from: 'specs', to: 'arch', label: 'architecture read from the table' },
    ] },
    2: { title: 'Week 2: read and size the GPU', steps: [
      { from: 'smi', to: 'gpu_chosen', label: 'GPU read from nvidia-smi' },
      { from: 'sizing', to: 'gpu_chosen', label: 'sized from the model' },
      { from: 'datapath', to: 'gpu_chosen', label: 'the data path checked' },
    ] },
    3: { title: 'Week 3: plan the data centre', steps: [
      { from: 'fabric', to: 'gpu_chosen', label: 'fabric sized' },
      { from: 'power', to: 'gpu_chosen', label: 'power and cooling computed' },
      { from: 'scale', to: 'power', label: 'node count from GPU-hours' },
    ] },
    4: { title: 'Week 4: operate and hand over', steps: [
      { from: 'monitor', to: 'gpu_chosen', label: 'telemetry read, thresholds set' },
      { from: 'fault', to: 'gpu_chosen', label: 'scheduling fault worked' },
      { from: 'fault', to: 'custody', label: 'every artifact hashed' },
      { from: 'custody', to: 'r_handover', label: 'handed over' },
    ] },
  },
  captions: {
    0: 'A local model running, the GPU spec table and the captured telemetry built, and the folder ready.',
    1: 'New: inference run and timed, the GPU architecture read from the table, and the stack named from the driver up.',
    2: 'New: a GPU read from nvidia-smi, its memory need computed, a GPU chosen, and the data path checked.',
    3: 'New: the fabric bandwidth, the rack power and cooling, and the node count, each computed from the table.',
    4: 'New: the telemetry monitored, a scheduling fault worked to Running, and the plan handed over with custody.',
  },
});

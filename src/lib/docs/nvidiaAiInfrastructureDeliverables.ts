import { Column } from '../grc/templates';
import { DeliverableDef, decisionDod, type DecisionBlock } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * The records the NVIDIA AI Infrastructure GPU Yard produces (NCA-AIIO).
 *
 * A four-person team sizes and operates the infrastructure under an AI cluster
 * and documents it the way a data-centre team would. Seven forms, one job each,
 * in work order:
 *
 *   1 Lab Setup & Reference Register      the tools and the spec pack          W0
 *   2 AI Knowledge & Stack Record         AI/ML/DL, architecture, the stack    W1
 *   3 GPU Hardware & Sizing Record        read and size a GPU ← the decision   W2
 *   4 Data Centre Capacity Record         fabric, power, cooling, scaling      W3
 *   5 GPU Operations & Monitoring Log     the telemetry read and flagged       W4
 *   6 GPU Scheduling Troubleshooting Log  a stuck job, one row a try           W4
 *   7 Handover & As-Built                 the plan as it is  ← capstone        W4
 *
 * FORM 3 CARRIES THE DECISION the course is about: which GPU the workload runs
 * on, sized from the model, not guessed. Form 6 is the method: it keeps the
 * theories that were wrong, because a log with none is not believed.
 *
 * Every student fills every form (`shared: true`); `owner` is the focus that
 * leads the record and reviews it. Course-scoped (`courseId: 'nvidia-ai-infrastructure'`).
 */

const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });
const YN = ['Yes', 'No'];

/** The one decision of the plan: which GPU the workload runs on, sized from the model. */
const SIZING_DECISION: DecisionBlock = {
  id: 'sizing',
  title: 'The GPU sizing decision',
  subject: 'component',
  prompt: 'The model needs the memory you computed. Which GPU does the workload run on?',
  options: [
    { id: 'one-gpu', label: 'One GPU that fits with headroom', help: 'The smallest GPU whose memory exceeds the need; simplest and cheapest when it fits.' },
    { id: 'shard', label: 'Shard across several GPUs', help: 'The model is split across GPUs when none holds it alone; needs the fast fabric.' },
    { id: 'quantize', label: 'Quantize to fit a smaller GPU', help: 'Lower precision shrinks the memory need so a cheaper GPU fits, at some accuracy cost.' },
  ],
  questions: [
    { field: 'sizing_why', label: 'Why that, from the numbers', type: 'area', required: true, placeholder: 'The 13B model needs ~31 GB at FP16; one L40S (48 GB) fits with headroom, so a single GPU is simplest.' },
    { field: 'sizing_rejected', label: 'The option rejected, and why', type: 'text', required: true, placeholder: 'Sharding: unnecessary when one GPU holds the model, and it would need NVLink we are not buying.' },
    { field: 'sizing_risk', label: 'The risk accepted', type: 'text', placeholder: 'A larger context or batch could exceed the headroom; monitor memory and quantize if it does.' },
  ],
};

const NVIDIA_FORMS: DeliverableDef[] = [
  // 1 — Lab Setup & Reference Register ─────────────────────────────────────────
  {
    id: 'nca_setup',
    courseId: 'nvidia-ai-infrastructure',
    num: 1,
    file: '01_Lab_Setup_and_Reference_Register.md',
    title: 'Lab Setup & Reference Register',
    owner: 'records',
    shared: true,
    folder: '00_Setup',
    standard: 'Lab tooling & reference data · NCA-AIIO domain 2 · NIST AI RMF GOVERN-1 · NIST SP 800-53 CM-6',
    weeks: [0],
    kind: 'checklist',
    exportFormat: 'md',
    feeds: ['nca_knowledge'],
    purpose:
      'What the lab runs on: that python and awk work, the local model, and the GPU spec table and captured telemetry every later week computes from. Written first, so the reference data is in place before any sizing.',
    howTo:
      'Record the tool versions, the local model, that the spec pack built, and who leads which record.',
    buildSteps: [
      'That python3 and awk run.',
      'The local model and its size.',
      'That the spec table and the captured samples are saved.',
      'The folder path.',
      'Who leads which focus.',
    ],
    meaning: 'A good setup record lets anyone reproduce every number in the course, because the spec table it was computed from is recorded.',
    useIt: 'The knowledge record builds on it; the handover closes against it.',
    pitfalls: [
      'A number later with no spec table behind it.',
      'No record of the local model.',
      'A missing capture, so a later parse has nothing to read.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The tools and reference pack',
        fields: [
          { field: 'python', label: 'python3 version', type: 'text', required: true, placeholder: '3.12.3' },
          { field: 'model', label: 'Local model and size', type: 'text', required: true, placeholder: 'llama3.2, 2.0 GB' },
          { field: 'specs', label: 'The GPU spec table is saved', type: 'select', required: true, options: YN },
          { field: 'captures', label: 'The nvidia-smi and dcgmi captures are saved', type: 'select', required: true, options: YN },
        ],
      },
      {
        kind: 'fields',
        title: 'The team',
        fields: [
          { field: 'plan', label: 'Plan name', type: 'text', required: true, placeholder: 'nvidia-t1' },
          { field: 'folder', label: 'Folder path', type: 'text', required: true, placeholder: 'nvidia-t1/' },
          { field: 'focus', label: 'Who leads which focus', type: 'area', required: true, placeholder: 'Knowledge: Jo · Infrastructure: Sam · Data Centre: Alex · Operations: Priya' },
        ],
      },
    ],
    dod: [
      { label: 'python runs and the local model is recorded', when: { fields: ['python', 'model'] } },
      { label: 'The spec table and the captures are saved', when: { all: [{ field: 'specs', equals: 'Yes' }, { field: 'captures', equals: 'Yes' }] } },
      { label: 'The team has a plan name and four focuses', when: { fields: ['plan', 'focus'] } },
    ],
  },

  // 2 — AI Knowledge & Stack Record ────────────────────────────────────────────
  {
    id: 'nca_knowledge',
    courseId: 'nvidia-ai-infrastructure',
    num: 2,
    file: '02_AI_Knowledge_and_Stack_Record.md',
    title: 'AI Knowledge & Stack Record',
    owner: 'knowledge',
    shared: true,
    folder: '01_Learn',
    standard: 'Essential AI knowledge · NCA-AIIO domain 2 · NIST AI RMF MAP-1',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['nca_hardware'],
    purpose:
      'What the team must know before it sizes anything: AI, ML and DL defined, training against inference, the GPU architecture read from the table, and the NVIDIA stack from the driver up to the framework.',
    howTo:
      'Record the five definitions, why training is the GPU-heavy half, a GPU’s compute and memory from the table, and the stack layers in order with the driver and CUDA version.',
    buildSteps: [
      'AI, ML, DL, training and inference, each in one sentence.',
      'Why training needs far more GPU than inference.',
      'A GPU’s TFLOPS, memory and tensor cores from the table.',
      'The driver and CUDA version and the stack layers in order.',
    ],
    meaning: 'Naming the workload and reading the architecture is where sizing starts; the wrong mental model is the wrong GPU and the wrong bill.',
    useIt: 'The hardware record sizes a GPU using these numbers; the handover names the stack.',
    pitfalls: [
      'Confusing training and inference, so the sizing is backwards.',
      'A stack with the layers out of order.',
      'A framework that needs a newer CUDA than the driver supports.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The concepts',
        fields: [
          { field: 'defs', label: 'AI / ML / DL / training / inference, defined', type: 'area', required: true, placeholder: 'AI: machines doing tasks that need intelligence. ML: learning from data. DL: ML with deep neural nets. Training: teaching from data. Inference: the trained model answering.' },
          { field: 'why_gpu', label: 'Why training needs far more GPU than inference', type: 'text', required: true, placeholder: 'Training runs the whole dataset through forward and backward passes many times; inference is one forward pass.' },
        ],
      },
      {
        kind: 'fields',
        title: 'Architecture and stack',
        fields: [
          { field: 'gpu_read', label: 'A GPU’s TFLOPS, memory and tensor cores', type: 'text', required: true, placeholder: 'H100-SXM: 1979 TFLOPS, 80 GB, 528 tensor cores' },
          { field: 'driver_cuda', label: 'Driver and CUDA version', type: 'text', required: true, placeholder: 'Driver 550.90.07, CUDA 12.4' },
          { field: 'stack', label: 'The stack layers in order', type: 'text', required: true, placeholder: 'GPU → driver → CUDA → cuDNN → container/NGC → framework' },
        ],
      },
    ],
    dod: [
      { label: 'The five terms are defined and training’s GPU cost explained', when: { fields: ['defs', 'why_gpu'] } },
      { label: 'A GPU is read from the table', when: { fields: ['gpu_read'] } },
      { label: 'The driver, CUDA and stack layers are recorded in order', when: { fields: ['driver_cuda', 'stack'] } },
    ],
  },

  // 3 — GPU Hardware & Sizing Record ← the decision ────────────────────────────
  {
    id: 'nca_hardware',
    courseId: 'nvidia-ai-infrastructure',
    num: 3,
    file: '03_GPU_Hardware_and_Sizing_Record.md',
    title: 'GPU Hardware & Sizing Record',
    owner: 'infra',
    shared: true,
    folder: '02_Size',
    standard: 'GPU hardware & memory sizing · NCA-AIIO domain 1 · NIST AI RMF MAP-3 · NIST SP 800-53 CM-2',
    weeks: [2],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['nca_datacenter'],
    purpose:
      'A GPU read and sized: what nvidia-smi reports, the memory the model needs computed from its parameters, the data path that feeds the GPU, and the sizing decision for which GPU the workload runs on.',
    howTo:
      'Record the GPU, memory and utilization from nvidia-smi, the computed memory need, the GPU chosen, the data-path bottleneck, and the sizing decision with its rejected option.',
    buildSteps: [
      'The GPU model, memory and utilization from nvidia-smi.',
      'The memory the model needs, computed.',
      'The GPU chosen, and the data-path check.',
      'The sizing decision.',
    ],
    meaning: 'Sizing from the model’s parameters is how you pick the cheapest GPU that will not fail under load; the decision is what the whole record is for.',
    useIt: 'The capacity record powers and cools the GPU chosen here; the handover names it.',
    pitfalls: [
      'Reading memory in use as memory available.',
      'Sizing with no headroom for activations and the cache.',
      'A decision with no rejected option.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The GPU and the sizing',
        fields: [
          { field: 'gpu', label: 'GPU model and memory (from nvidia-smi)', type: 'text', required: true, placeholder: 'NVIDIA H100-SXM, 80 GB' },
          { field: 'util', label: 'Utilization read', type: 'text', required: true, placeholder: '92%' },
          { field: 'need', label: 'Memory the model needs (computed)', type: 'text', required: true, placeholder: '~31 GB (13B params, FP16, +20%)' },
          { field: 'chosen', label: 'GPU chosen to fit', type: 'text', required: true, placeholder: 'L40S (48 GB)' },
          { field: 'data_path', label: 'The data-path check', type: 'text', required: true, placeholder: 'Storage 2.5 GB/s < 4 GB/s needed → DPU/faster tier required' },
        ],
      },
      { kind: 'decision', block: SIZING_DECISION },
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date', type: 'date', required: true },
          { field: 'signoff', label: 'Sized by (Infrastructure focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'The GPU is read and the model’s memory need computed', when: { fields: ['gpu', 'util', 'need'] } },
      { label: 'A GPU is chosen and the data path checked', when: { fields: ['chosen', 'data_path'] } },
      decisionDod(SIZING_DECISION),
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },

  // 4 — Data Centre Capacity Record ────────────────────────────────────────────
  {
    id: 'nca_datacenter',
    courseId: 'nvidia-ai-infrastructure',
    num: 4,
    file: '04_Data_Centre_Capacity_Record.md',
    title: 'Data Centre Capacity Record',
    owner: 'datacenter',
    shared: true,
    folder: '03_Plan',
    standard: 'Data-centre capacity planning · NCA-AIIO domain 1 · NIST SP 800-53 PE-11,PE-14',
    weeks: [3],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['nca_operations'],
    purpose:
      'The rack planned from the numbers: the aggregate network fabric bandwidth, the power draw and cooling load, and the node count a training job needs to finish in time.',
    howTo:
      'Record the aggregate NVLink bandwidth of a node, the rack power and its cooling load in BTU, the node count for the target time, and whether a standard rack can supply it.',
    buildSteps: [
      'The aggregate NVLink bandwidth of an eight-GPU node.',
      'The rack power draw and its cooling load in BTU/hr.',
      'The node count the training job needs.',
      'Whether a standard rack can power and cool it.',
    ],
    meaning: 'GPUs turn power into heat and need a fast fabric to work together; computing the fabric, the power and the cooling is what keeps a rack from tripping a breaker or cooking itself.',
    useIt: 'The operations log monitors what this plan builds; the handover carries the capacity numbers.',
    pitfalls: [
      'Forgetting cooling: the BTU load is the power, not an afterthought.',
      'A rack denser than the facility can power.',
      'Assuming scaling is linear past the fabric’s limit.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Fabric, power and scale',
        fields: [
          { field: 'fabric', label: 'Aggregate NVLink bandwidth (8-GPU node)', type: 'text', required: true, placeholder: '7200 GB/s' },
          { field: 'power', label: 'Rack GPU power draw', type: 'text', required: true, placeholder: '22,400 W (4 nodes)' },
          { field: 'cooling', label: 'Cooling load (BTU/hr)', type: 'text', required: true, placeholder: '76,429 BTU/hr' },
          { field: 'nodes', label: 'Nodes for the target time', type: 'text', required: true, placeholder: '22 nodes of 8 for a 24-hour finish' },
          { field: 'fits_rack', label: 'A standard rack can power and cool it', type: 'select', required: true, options: YN },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Capacity changes — each with a rollback',
          help: 'Every change to the sized plan, and how to undo it.',
          columns: [
            c('change', 'Change', 'text', { placeholder: 'Raise node count 22 → 30 for a 16-hour finish' }),
            c('reason', 'Reason', 'text', { placeholder: 'A tighter training deadline' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'Return to 22 nodes; the extra racks are decommissioned' }),
          ],
          seed: [{ change: 'Initial sizing', reason: 'Baseline plan', rollback: 'No prior plan to revert to' }],
        },
      },
    ],
    dod: [
      { label: 'The fabric bandwidth is computed', when: { fields: ['fabric'] } },
      { label: 'The power and cooling load are computed', when: { fields: ['power', 'cooling'] } },
      { label: 'The node count and the rack fit are recorded', when: { fields: ['nodes', 'fits_rack'] } },
      { label: 'Every capacity change has a rollback', when: { group: 'changes', atLeast: 1, every: { filled: ['change', 'rollback'] } } },
    ],
  },

  // 5 — GPU Operations & Monitoring Log ────────────────────────────────────────
  {
    id: 'nca_operations',
    courseId: 'nvidia-ai-infrastructure',
    num: 5,
    file: '05_GPU_Operations_and_Monitoring_Log.md',
    title: 'GPU Operations & Monitoring Log',
    owner: 'records',
    shared: true,
    folder: '04_Handover',
    standard: 'GPU operations & telemetry · NCA-AIIO domain 3 · NIST SP 800-53 SI-4',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['nca_handover'],
    purpose:
      'The cluster watched: the per-GPU power, temperature and utilization read from DCGM, the hottest and busiest GPU found, and the thresholds the team will alert on.',
    howTo:
      'Record each GPU’s power, temperature and utilization, the hottest GPU, and the alert thresholds for temperature, power and idle utilization.',
    buildSteps: [
      'The per-GPU power, temperature and utilization.',
      'The hottest and the busiest GPU.',
      'The thresholds to alert on.',
    ],
    meaning: 'A GPU that throttles on heat or sits idle at full power is a problem you only see if you watch the telemetry; the thresholds are what turn watching into alerting.',
    useIt: 'The handover names the monitoring and the thresholds the next team inherits.',
    pitfalls: [
      'Watching utilization but not temperature.',
      'No threshold, so nothing ever alerts.',
      'Reading one sample instead of a trend.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'telemetry',
          label: 'The GPU telemetry',
          help: 'One row per GPU from the DCGM read.',
          columns: [
            c('gpu', 'GPU', 'text', { placeholder: '0' }),
            c('power', 'Power (W)', 'text', { placeholder: '680' }),
            c('temp', 'Temp (C)', 'text', { placeholder: '61' }),
            c('util', 'Util (%)', 'text', { placeholder: '92' }),
          ],
          seed: [{ gpu: '0', power: '680', temp: '61', util: '92' }],
        },
      },
      {
        kind: 'fields',
        title: 'Findings',
        fields: [
          { field: 'hottest', label: 'Hottest GPU', type: 'text', required: true, placeholder: 'GPU 0 at 61C' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'rules',
          label: 'Alert rules — what to page on',
          help: 'One row per rule: the metric and the limit that trips it.',
          columns: [
            c('metric', 'Metric', 'text', { placeholder: 'GPU temperature' }),
            c('limit', 'Alert when', 'text', { placeholder: '> 83C sustained 5 min' }),
          ],
          seed: [{ metric: 'GPU temperature', limit: '> 83C sustained 5 min' }],
        },
      },
    ],
    dod: [
      { label: 'The per-GPU telemetry is recorded', when: { group: 'telemetry', atLeast: 1, every: { filled: ['gpu', 'temp', 'util'] } } },
      { label: 'The hottest GPU is recorded', when: { fields: ['hottest'] } },
      { label: 'Every alert rule has a metric and a limit', when: { group: 'rules', atLeast: 1, every: { filled: ['metric', 'limit'] } } },
    ],
  },

  // 6 — GPU Scheduling Troubleshooting Log ─────────────────────────────────────
  {
    id: 'nca_troubleshoot',
    courseId: 'nvidia-ai-infrastructure',
    num: 6,
    file: '06_GPU_Scheduling_Troubleshooting_Log.md',
    title: 'GPU Scheduling Troubleshooting Log',
    owner: 'records',
    shared: true,
    folder: '04_Handover',
    standard: 'Fault diagnosis · read before you change · one change per row · NIST SP 800-53 IR-4',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['nca_handover'],
    purpose:
      'A job that will not schedule onto a GPU node, worked the method way: the scheduler message before any theory, one theory and one change per row, the failed theories kept, and the fix proved by the job placed.',
    howTo:
      'Read the scheduler message before any theory. Change one thing per row and record the result. Keep the rows that did not work. End with the job scheduled onto a GPU node.',
    buildSteps: [
      'The exact scheduler message.',
      'One theory per row, one change, the result.',
      'At least one theory that was wrong, kept.',
      'The proof: the job scheduled onto a GPU node.',
    ],
    meaning: 'A log with no failed theories is a log nobody believes. The failures are the proof the team read the scheduler and worked the fault, not guessed.',
    useIt: 'The fix feeds the handover; the method carries to every scheduling fault after it.',
    pitfalls: [
      'Writing "it will not run" instead of the exact scheduler reason.',
      'Changing the request and the plugin at once.',
      'Deleting the theories that failed.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The fault',
        fields: [
          { field: 'message', label: 'The exact scheduler message', type: 'area', required: true, placeholder: '0/4 nodes are available: 4 Insufficient nvidia.com/gpu.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'attempts',
          label: 'The attempts — one change per row',
          columns: [
            c('theory', 'Theory', 'text', { placeholder: 'The device plugin is not advertising GPUs' }),
            c('change', 'The one change', 'text', { placeholder: 'Start the NVIDIA device plugin DaemonSet' }),
            c('result', 'Result', 'select', { options: ['Fixed it', 'No change — theory wrong', 'Partly — new symptom'] }),
          ],
          seed: [{ theory: 'Request exceeds node GPUs', change: 'Lower request to 1 GPU', result: 'No change — theory wrong' }],
        },
      },
      {
        kind: 'fields',
        title: 'The proof',
        fields: [{ field: 'proof', label: 'The job scheduled onto a GPU node', type: 'text', required: true, placeholder: 'job-xxxx Running on node gpu-2' }],
      },
    ],
    dod: [
      { label: 'The exact scheduler message is written', when: { fields: ['message'] } },
      { label: 'Every attempt is a row, and at least one theory was wrong', when: { group: 'attempts', atLeast: 2, some: { column: 'result', equals: 'No change — theory wrong' } } },
      { label: 'The fix is proved with the job scheduled', when: { fields: ['proof'] } },
    ],
  },

  // 7 — Handover & As-Built ← capstone ─────────────────────────────────────────
  {
    id: 'nca_handover',
    courseId: 'nvidia-ai-infrastructure',
    num: 7,
    file: '07_Handover_and_As_Built.md',
    title: 'Handover & As-Built',
    owner: 'records',
    shared: true,
    capstone: true,
    folder: '04_Handover',
    standard: 'Operational handover & chain of custody · NIST SP 800-53 PL-2 · CM-8',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'The plan as it really is, handed to whoever builds and runs it next: the GPU chosen and why, the rack power and cooling, the node count, how it is monitored, the known limits, and a custody row with a hash for every artifact.',
    howTo:
      'Describe the plan by reference to the other records. Say how to operate and monitor it. List the known limits. Hash every artifact into the custody log.',
    buildSteps: [
      'The plan now: the GPU, the rack power and cooling, the node count.',
      'How to operate and monitor it, and what to alert on.',
      'Known limits: what it cannot do and what to watch.',
      'The custody log: every computation, capture and output, hashed.',
    ],
    meaning: 'The as-built is the document the next team reads before they order a single GPU. Written honestly, it saves them the budget you just worked out.',
    useIt: 'It is the capstone: reviewed by the Data Centre focus, approved by the Infrastructure focus, and issued with the plan.',
    pitfalls: [
      'Describing the plan rather than the sized, costed result.',
      'A number with no spec table behind it.',
      'No monitoring thresholds for the next team.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The plan now',
        fields: [
          { field: 'plan', label: 'Plan name and the GPU chosen', type: 'text', required: true, placeholder: 'nvidia-t1 · L40S (48 GB) for the 13B model' },
          { field: 'capacity', label: 'Power, cooling and node count', type: 'area', required: true, placeholder: '22,400 W, 76,429 BTU/hr for 4 nodes; 22 nodes of 8 for a 24-hour training finish.' },
          { field: 'operate', label: 'How to operate and monitor', type: 'area', required: true, placeholder: 'DCGM dashboards; alert on temp > 83C, idle util < 5%; NVIDIA device plugin must be Ready for GPU scheduling.' },
        ],
      },
      {
        kind: 'fields',
        title: 'Known limits',
        fields: [{ field: 'limits', label: 'What it cannot do, and what to watch', type: 'area', required: true, placeholder: 'Sizing assumes FP16 and this model; a larger context needs more memory. Scaling past the fabric’s limit gives diminishing returns.' }],
      },
      custodySection({
        seed: [
          { evidence_id: 'E-01', filename: 'week-2/sizing.txt', description: 'The GPU memory sizing computation', collected_by: 'Infrastructure', datetime: '2026-10-26 10:10', location: 'nvidia-t1/week-2/', sha256: '6b2d…', transferred_to: 'Records', transferred_at: '2026-10-26 10:30', notes: 'for the hardware record' },
        ],
      }),
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date issued', type: 'date', required: true },
          { field: 'signoff', label: 'Issued by (Operations focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'The plan is described as sized, with how to operate it', when: { fields: ['plan', 'capacity', 'operate'] } },
      { label: 'The known limits are recorded', when: { fields: ['limits'] } },
      { label: 'Every artifact is hashed into the custody log', when: everyEvidenceHashed('evidence') },
      { label: 'The record is dated and signed off', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },
];

export const NVIDIA_AI_INFRASTRUCTURE_DELIVERABLES: DeliverableDef[] = NVIDIA_FORMS;

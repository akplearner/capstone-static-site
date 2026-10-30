import type { Course, RoleDef, Step, Task, WeekDef } from '../../types';
import { withPortfolioStep } from '../../docs/portfolioPlan';
import { withAiExtensions } from '../../docs/aiExtension';
import { withModules } from '../modules';

/**
 * NVIDIA-Certified Associate: AI Infrastructure and Operations — the GPU Yard
 * (NCA-AIIO).
 *
 * A four-person team plans, sizes and operates the infrastructure an AI cluster
 * runs on, the way a data-centre team would: name what AI/ML/DL and the NVIDIA
 * stack actually are, read a GPU and size one to a model, plan a rack's network,
 * power and cooling, then monitor it and work a job that will not schedule onto
 * a GPU node. Essential AI knowledge, the infrastructure under it, and the
 * operations that keep it running.
 *
 * NO GPU REQUIRED. Every proof runs on a plain laptop: the GPU specs, the
 * captured `nvidia-smi` and `dcgmi` output and the fault are all parsed from
 * real sample data with awk, grep and python, and the training-vs-inference
 * work uses a free local model (Ollama) on the CPU. Run the live commands where
 * a GPU is present; here the captured output is parsed so the proof always
 * lands. Nothing is a slide and nothing needs paid hardware or cloud.
 *
 * THE RULE THE COURSE TEACHES: size it from the numbers. Every infrastructure
 * choice — which GPU, how much power, how many nodes — is computed from a spec
 * table, not guessed, and the Week 4 scheduling fault is worked one theory and
 * one change per row, exactly as A+ works a dead PC.
 *
 * ONE SHARED PLAN, FOUR FOCUSES (`sharedTrack: true`, `noGatekeeping: true`).
 * Everyone runs every command; the focus decides which record a member leads and
 * reviews. Week 0 is preparation (`setup: true`), never graded.
 */

const ROLES: RoleDef[] = [
  {
    id: 'knowledge',
    name: 'AI Knowledge (Essentials Lead)',
    mission: 'Leads the knowledge record: AI/ML/DL, GPU architecture, training vs inference and the NVIDIA stack.',
    color: '#15803d',
    icon: 'Brain',
  },
  {
    id: 'infra',
    name: 'GPU Infrastructure (Hardware Lead)',
    mission: 'Leads the hardware record: reading a GPU, sizing it, and the data path.',
    color: '#2563eb',
    icon: 'Cpu',
  },
  {
    id: 'datacenter',
    name: 'Data Centre (Capacity Lead)',
    mission: 'Leads the capacity record: the network fabric, the power and cooling, and the scaling.',
    color: '#b45309',
    icon: 'Server',
  },
  {
    id: 'records',
    name: 'Operations (Records Lead)',
    mission: 'Leads the records that outlive the plan: monitoring, the scheduling fault, custody and handover.',
    color: '#7c3aed',
    icon: 'ClipboardList',
  },
];

const WEEKS: WeekDef[] = [
  {
    number: 0,
    title: 'Set up the lab',
    theme: 'A terminal, a local model, the spec pack',
    objective: 'Confirm python and the shell, get a local model running, build the GPU spec pack, and pick your focus.',
    runs: 'Week 0',
    setup: true,
    stage: 0,
    phase: 'Preparation',
    difficulty: 1,
    objectives: [
      { id: 'build-the-spec-pack', label: 'Build the GPU spec and sample pack', tasks: ['nca-w0-lab'] },
      { id: 'run-a-model-locally', label: 'Run a model on your own machine', tasks: ['nca-w0-local'] },
      { id: 'know-the-team', label: 'Know your team, focus and folder', tasks: ['nca-w0-orient'] },
    ],
    milestone: 'python and awk run, a local model answers offline, the spec pack holds the GPU table and the captured nvidia-smi and dcgmi output, and the folder names the team and the four focuses.',
  },
  {
    number: 1,
    title: 'Essential AI knowledge',
    theme: 'AI/ML/DL, GPU architecture, the stack',
    objective: 'Name AI, ML and DL, see training against inference, read the GPU architecture, and map the NVIDIA stack.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Learn',
    difficulty: 2,
    objectives: [
      { id: 'training-vs-inference', label: 'See training against inference', tasks: ['nca-w1-concepts'] },
      { id: 'read-the-architecture', label: 'Read the GPU architecture', tasks: ['nca-w1-arch'] },
      { id: 'map-the-stack', label: 'Map the NVIDIA software stack', tasks: ['nca-w1-stack'] },
    ],
    milestone: 'Inference is shown running on the local model, the GPU architecture is read from the spec table with its cores and tensor cores, and the driver, CUDA and stack layers are named from the captured output.',
  },
  {
    number: 2,
    title: 'Read and size the GPU',
    theme: 'nvidia-smi, memory sizing, the data path',
    objective: 'Read a GPU from nvidia-smi, size a GPU to a model, and follow the data-processing path.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Size',
    difficulty: 3,
    objectives: [
      { id: 'read-a-gpu', label: 'Read a GPU from nvidia-smi', tasks: ['nca-w2-smi'] },
      { id: 'size-to-a-model', label: 'Size a GPU to a model', tasks: ['nca-w2-sizing'] },
      { id: 'follow-the-data-path', label: 'Follow the data-processing path', tasks: ['nca-w2-dpu'] },
    ],
    milestone: 'The GPU name, memory and utilization are read from nvidia-smi, the memory a model needs is computed and a GPU chosen to fit it, and the DPU and data path that feed the GPU are named.',
  },
  {
    number: 3,
    title: 'Plan the data centre',
    theme: 'Network fabric, power and cooling, scaling',
    objective: 'Compute the network bandwidth, the power and cooling, and the node count a training job needs.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Plan',
    difficulty: 3,
    objectives: [
      { id: 'size-the-fabric', label: 'Size the network fabric', tasks: ['nca-w3-network'] },
      { id: 'power-and-cool-it', label: 'Power and cool the rack', tasks: ['nca-w3-power'] },
      { id: 'scale-the-job', label: 'Scale the training job', tasks: ['nca-w3-scale'] },
    ],
    milestone: 'The aggregate NVLink bandwidth, the total power draw and cooling load of a GPU rack, and the number of nodes a training job needs are each computed from the spec table with a number to defend.',
  },
  {
    number: 4,
    title: 'Operate and hand over',
    theme: 'Monitoring, a scheduling fault, handover',
    objective: 'Read the GPU telemetry, work a job that will not schedule, and hand the plan over.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Hand over',
    difficulty: 4,
    objectives: [
      { id: 'monitor-the-gpus', label: 'Monitor the GPU telemetry', tasks: ['nca-w4-monitor'] },
      { id: 'work-a-scheduling-fault', label: 'Work a scheduling fault, one change per row', tasks: ['nca-w4-troubleshoot'] },
      { id: 'hand-it-over', label: 'Hand the plan over', tasks: ['nca-w4-handover'] },
    ],
    milestone: 'The GPU utilization, temperature and power are read from dcgmi, a job stuck off the GPU nodes is worked to Running with the failed theories kept, and the handover record hashes every artifact.',
  },
];

/** A form or desk step: no command, a described outcome. `whatItMeans` required. */
const note = (
  id: string,
  title: string,
  where: string,
  instruction: string,
  outcome: string,
  extra: Partial<Step> & { whatItMeans: string }
): Step => ({
  id,
  title,
  description: outcome.length > 110 ? `${outcome.slice(0, 107).trimEnd()}…` : outcome,
  where,
  instruction,
  expectedOutput: outcome,
  outputKind: 'result',
  frameworks: ['NIST_AI_RMF'],
  ...extra,
});

/** A command step with pasted output and what proves it worked. */
const run = (
  id: string,
  title: string,
  where: string,
  instruction: string,
  commands: NonNullable<Step['commands']>,
  verify: string[],
  whatItMeans: string,
  extra: Partial<Step> = {}
): Step => ({
  id,
  title,
  description: title,
  where,
  instruction,
  commands,
  verify,
  outputKind: 'console',
  expectedOutput: commands.map((cmd) => cmd.sample).filter(Boolean).join('\n'),
  whatItMeans,
  frameworks: ['NIST_AI_RMF'],
  ...extra,
});

const LAB = 'Your own machine — a terminal';

const TASKS: Task[] = [
  // ── Week 0 — Set up the lab ─────────────────────────────────────────────────
  {
    id: 'nca-w0-lab',
    role: 'infra',
    shared: true,
    week: 0,
    title: 'Build the GPU spec and sample pack',
    objective: 'Confirm python and awk run, and build the spec table and captured samples the course computes from.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['01_Lab_Setup_and_Reference_Register.md'],
    estimatedTime: '30 min',
    difficulty: 1,
    learn: ['GPU spec sheets', 'Captured telemetry', 'Shell math', 'Reference data'],
    tools: ['Python', 'Terminal'],
    definitionOfDone: [
      'python3 and awk both run',
      'The GPU spec table is saved to the ref folder',
      'The captured nvidia-smi and dcgmi samples are saved',
    ],
    steps: [
      run(
        'nca-w0-lab-s1',
        'Build the spec table',
        LAB,
        'Confirm python and awk, then write the GPU spec table the whole course sizes from into a ref folder.',
        [
          { cmd: 'python3 --version && mkdir -p nvidia-t1/ref && printf \'model\\tfp16_tflops\\tvram_gb\\tnvlink_gbps\\tmax_watts\\ttensor_cores\\nH100-SXM\\t1979\\t80\\t900\\t700\\t528\\nA100-SXM\\t624\\t80\\t600\\t400\\t432\\nL40S\\t733\\t48\\t0\\t350\\t568\\nL4\\t242\\t24\\t0\\t72\\t240\\nT4\\t65\\t16\\t0\\t70\\t320\\n\' > nvidia-t1/ref/gpu-specs.tsv && awk -F"\\t" "NR>1{n++} END{print n\\" GPUs in the table\\"}" nvidia-t1/ref/gpu-specs.tsv', explain: 'Confirms python, writes the five-GPU spec table, and counts its rows with awk.', sample: 'Python 3.12.3\n5 GPUs in the table' },
        ],
        ['GPUs in the table'],
        'Every infrastructure number in this course is computed from this table, not guessed. Building it first is what makes each later answer defensible.',
        {
          usesForm: 'Lab Setup & Reference Register',
          outputHighlights: [{ text: '5 GPUs in the table', label: 'The spec table is built and readable by awk.' }],
          fixes: [{ symptom: 'python3 is not found?', fix: 'Install Python from its official site, or use the one your operating system ships, then open a new terminal.' }],
        }
      ),
      run(
        'nca-w0-lab-s2',
        'Capture the nvidia-smi and dcgmi samples',
        LAB,
        'Save the captured nvidia-smi and dcgmi output into the ref folder, so every later week can parse real telemetry without a GPU.',
        [
          { cmd: 'printf \'Driver Version: 550.90.07    CUDA Version: 12.4\\nGPU 0: NVIDIA H100-SXM  Memory: 81559MiB  Util: 92%%  Temp: 61C  Power: 680W / 700W\\n\' > nvidia-t1/ref/nvidia-smi.txt; printf \'GPU  POWER  TEMP  SMUTIL  MEMUTIL\\n0    680    61    92     74\\n1    675    60    90     71\\n\' > nvidia-t1/ref/dcgmi.txt; wc -l nvidia-t1/ref/*.txt', explain: 'Writes the captured nvidia-smi and dcgmi samples and counts the lines saved.', sample: '  2 nvidia-t1/ref/nvidia-smi.txt\n  3 nvidia-t1/ref/dcgmi.txt\n  5 total' },
        ],
        ['total'],
        'On a GPU host you would capture these from the live tools; saving real samples lets the lab teach exactly the same parsing on any laptop.',
        {
          usesForm: 'Lab Setup & Reference Register',
          producesDeliverable: '01_Lab_Setup_and_Reference_Register.md',
        }
      ),
    ],
  },
  {
    id: 'nca-w0-local',
    role: 'knowledge',
    shared: true,
    week: 0,
    title: 'Run a model on your own machine',
    objective: 'Install Ollama and pull a small model, so inference can be shown on the CPU in Week 1.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['01_Lab_Setup_and_Reference_Register.md'],
    estimatedTime: '30 min',
    difficulty: 1,
    learn: ['Local inference', 'Model size', 'CPU vs GPU inference'],
    tools: ['Ollama', 'Terminal'],
    definitionOfDone: [
      'Ollama is installed and lists a pulled model',
      'The model answers a prompt',
      'The model and its size are recorded',
    ],
    steps: [
      run(
        'nca-w0-local-s1',
        'Pull a small model and list it',
        LAB,
        'Install Ollama from its official site, pull a small model, and list what is on disk.',
        [
          { cmd: 'ollama pull llama3.2 && ollama list', explain: 'Downloads a small model and lists the models on disk with their sizes.', sample: 'NAME            ID            SIZE    MODIFIED\nllama3.2:latest a80c4f17acd5  2.0 GB  3 seconds ago' },
        ],
        ['llama3.2'],
        'A model small enough to run on a laptop CPU teaches what inference is doing, which is the half of training-vs-inference you can see for free.',
        {
          usesForm: 'Lab Setup & Reference Register',
          producesDeliverable: '01_Lab_Setup_and_Reference_Register.md',
          outputHighlights: [{ text: 'llama3.2', label: 'The model is on disk and ready for inference.' }],
          fixes: [{ symptom: 'ollama is not found?', fix: 'Install it from the official download for your operating system, then open a new terminal.' }],
        }
      ),
    ],
  },
  {
    id: 'nca-w0-orient',
    role: 'records',
    shared: true,
    week: 0,
    title: 'Know your team, your focus and the folder',
    objective: 'Agree who leads which record, name the plan, and make the folder every artifact goes in.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['01_Lab_Setup_and_Reference_Register.md'],
    estimatedTime: '20 min',
    difficulty: 1,
    learn: ['Focus roles', 'Naming', 'Evidence folders'],
    tools: ['Terminal'],
    definitionOfDone: [
      'Each of the four focuses has a named member',
      'The plan has a name in the pattern nvidia-t<team>',
      'The folder exists with a week-0 to week-4 layout',
    ],
    steps: [
      note(
        'nca-w0-orient-s1',
        'Pick the focus and name the plan',
        'Anywhere — a team decision',
        'Agree who leads AI Knowledge, GPU Infrastructure, Data Centre and Operations. Name the plan nvidia-t and your team number, and write both into the register.',
        'Four names against four focuses, and a plan name the whole team uses from now on.',
        {
          usesForm: 'Lab Setup & Reference Register',
          whatItMeans: 'A focus is the record a member leads and reviews, not the only work they do. Everyone runs every command.',
        }
      ),
      run(
        'nca-w0-orient-s2',
        'Make the plan folder',
        LAB,
        'Create the folder with a subfolder for each week. Every computation, capture and output goes under the week it belongs to.',
        [
          { cmd: 'mkdir -p nvidia-t1/week-{0,1,2,3,4} && ls nvidia-t1', explain: 'Five week folders alongside the ref folder, then reads them back. Replace t1 with your team number.', sample: 'ref  week-0  week-1  week-2  week-3  week-4' },
        ],
        ['week-0', 'week-4'],
        'An artifact nobody can find is an artifact nobody can hash. The folder is the first custody control.',
        {
          usesForm: 'Lab Setup & Reference Register',
          producesDeliverable: '01_Lab_Setup_and_Reference_Register.md',
        }
      ),
    ],
  },

  // ── Week 1 — Essential AI knowledge (d2) ────────────────────────────────────
  {
    id: 'nca-w1-concepts',
    role: 'knowledge',
    shared: true,
    week: 1,
    title: 'See training against inference',
    objective: 'Run inference on the local model and write, in the team’s words, how training differs from it and why each needs the GPU differently.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['02_AI_Knowledge_and_Stack_Record.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['AI vs ML vs DL', 'Training', 'Inference', 'Why GPUs'],
    tools: ['Ollama', 'Terminal'],
    definitionOfDone: [
      'Inference is shown running on the local model',
      'Training and inference are each defined in the team’s words',
      'Why each needs the GPU differently is recorded',
    ],
    steps: [
      run(
        'nca-w1-concepts-s1',
        'Run inference and time it',
        LAB,
        'Ask the local model one question and time the run, so inference is a concrete thing you measured, not a word.',
        [
          { cmd: 'time ollama run llama3.2 "In one sentence, what is the difference between training and inference?" 2>&1 | tail -3', explain: 'Runs inference once and prints the answer and the time it took.', sample: 'Training teaches a model from data; inference is the trained model answering a new prompt.\nreal\t0m2.314s' },
        ],
        ['inference'],
        'Inference is the model answering; training is the far larger job of teaching it. You can run inference on a laptop CPU; training a large model is what a GPU cluster is for.',
        {
          usesForm: 'AI Knowledge & Stack Record',
          outputHighlights: [{ text: 'inference', label: 'The model ran one inference pass you can time.' }],
        }
      ),
      note(
        'nca-w1-concepts-s2',
        'Define AI, ML, DL, training and inference',
        'The AI Knowledge & Stack Record form',
        'In the record, write one plain sentence each for AI, machine learning, deep learning, training and inference, and say why training needs far more GPU than inference.',
        'Five terms defined in the team’s words, and the reason training is the GPU-heavy half.',
        {
          usesForm: 'AI Knowledge & Stack Record',
          producesDeliverable: '02_AI_Knowledge_and_Stack_Record.md',
          whatItMeans: 'Knowing which workload is training and which is inference is what decides how much GPU, memory and power the infrastructure must provide.',
        }
      ),
    ],
  },
  {
    id: 'nca-w1-arch',
    role: 'infra',
    shared: true,
    week: 1,
    title: 'Read the GPU architecture',
    objective: 'Read a GPU’s compute, memory and tensor cores from the spec table, and say what each part is for.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['02_AI_Knowledge_and_Stack_Record.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['CUDA cores', 'Tensor cores', 'GPU memory', 'Memory bandwidth'],
    tools: ['Python', 'Terminal'],
    definitionOfDone: [
      'A GPU’s TFLOPS, memory and tensor cores are read from the table',
      'What tensor cores do is recorded',
      'Two GPUs are compared on compute and memory',
    ],
    steps: [
      run(
        'nca-w1-arch-s1',
        'Read a GPU from the spec table',
        LAB,
        'Pull one GPU’s FP16 TFLOPS, memory and tensor-core count out of the spec table with awk.',
        [
          { cmd: 'awk -F"\\t" "\\$1==\\"H100-SXM\\"{print \\$1\\": \\"\\$2\\" TFLOPS, \\"\\$3\\"GB, \\"\\$6\\" tensor cores\\"}" nvidia-t1/ref/gpu-specs.tsv', explain: 'Reads the H100 row and prints its compute, memory and tensor cores.', sample: 'H100-SXM: 1979 TFLOPS, 80GB, 528 tensor cores' },
        ],
        ['TFLOPS'],
        'Tensor cores are the units that make a GPU fast at the matrix maths deep learning is built on; memory is what caps the model size it can hold. Both come off the spec sheet.',
        {
          usesForm: 'AI Knowledge & Stack Record',
          outputHighlights: [{ text: 'TFLOPS', label: 'The GPU’s compute, memory and tensor cores, read from the table.' }],
        }
      ),
      run(
        'nca-w1-arch-s2',
        'Compare two GPUs',
        LAB,
        'Compare two GPUs on compute and memory so the trade-off between a training GPU and an inference GPU is a number, not a feeling.',
        [
          { cmd: 'awk -F"\\t" "NR>1 && (\\$1==\\"H100-SXM\\"||\\$1==\\"L4\\"){print \\$1\\"\\t\\"\\$2\\" TFLOPS\\t\\"\\$3\\"GB\\t\\"\\$5\\"W\\"}" nvidia-t1/ref/gpu-specs.tsv', explain: 'Prints the H100 and the L4 side by side on compute, memory and power.', sample: 'H100-SXM\t1979 TFLOPS\t80GB\t700W\nL4\t242 TFLOPS\t24GB\t72W' },
        ],
        ['TFLOPS'],
        'An H100 trains; an L4 sips power and serves inference. Seeing the TFLOPS, memory and watts together is how you match a GPU to a job instead of overbuying.',
        {
          usesForm: 'AI Knowledge & Stack Record',
          producesDeliverable: '02_AI_Knowledge_and_Stack_Record.md',
        }
      ),
    ],
  },
  {
    id: 'nca-w1-stack',
    role: 'records',
    shared: true,
    week: 1,
    title: 'Map the NVIDIA software stack',
    objective: 'Read the driver and CUDA version from the captured output and name the layers from the GPU up to the framework.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['02_AI_Knowledge_and_Stack_Record.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['GPU driver', 'CUDA', 'cuDNN', 'NGC and containers', 'Frameworks'],
    tools: ['nvidia-smi', 'Terminal'],
    definitionOfDone: [
      'The driver and CUDA version are read from the capture',
      'The stack layers are named in order',
      'Where a framework sits on the stack is recorded',
    ],
    steps: [
      run(
        'nca-w1-stack-s1',
        'Read the driver and CUDA version',
        LAB,
        'Where a GPU is present you would run nvidia-smi; here, read the driver and CUDA version from the captured output.',
        [
          { cmd: 'grep -oE "Driver Version: [0-9.]+|CUDA Version: [0-9.]+" nvidia-t1/ref/nvidia-smi.txt', explain: 'Pulls the driver and CUDA version out of the captured nvidia-smi output.', sample: 'Driver Version: 550.90.07\nCUDA Version: 12.4' },
        ],
        ['CUDA Version'],
        'The driver and CUDA version are the first thing an operator checks: a framework built for a newer CUDA than the driver supports will not run, however good the GPU is.',
        {
          usesForm: 'AI Knowledge & Stack Record',
          outputHighlights: [{ text: 'CUDA Version', label: 'The CUDA version the installed driver supports.' }],
          fixes: [{ symptom: 'On a real host nvidia-smi is not found?', fix: 'The GPU driver is not installed; install the NVIDIA driver for the card, then nvidia-smi appears.' }],
        }
      ),
      note(
        'nca-w1-stack-s2',
        'Name the stack layers in order',
        'The AI Knowledge & Stack Record form',
        'In the record, name the layers from the GPU hardware up: driver, CUDA, cuDNN, the container runtime and NGC, and the framework, and say what each provides.',
        'The stack named in order from the GPU to the framework, each layer with its job.',
        {
          usesForm: 'AI Knowledge & Stack Record',
          producesDeliverable: '02_AI_Knowledge_and_Stack_Record.md',
          whatItMeans: 'Most AI infrastructure problems are a version mismatch somewhere in this stack. Knowing the layers in order is how you find which one.',
        }
      ),
    ],
  },

  // ── Week 2 — Read and size the GPU (d1) ─────────────────────────────────────
  {
    id: 'nca-w2-smi',
    role: 'infra',
    shared: true,
    week: 2,
    title: 'Read a GPU from nvidia-smi',
    objective: 'Read the GPU name, memory and utilization from the captured nvidia-smi output.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['03_GPU_Hardware_and_Sizing_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['nvidia-smi', 'GPU memory', 'Utilization', 'Reading telemetry'],
    tools: ['nvidia-smi', 'Terminal'],
    definitionOfDone: [
      'The GPU model and memory are read from the capture',
      'The utilization is read',
      'A low-utilization reading is explained',
    ],
    steps: [
      run(
        'nca-w2-smi-s1',
        'Read the GPU, memory and utilization',
        LAB,
        'Parse the captured nvidia-smi for the GPU model, its memory and how busy it is.',
        [
          { cmd: 'grep -oE "NVIDIA [A-Z0-9-]+|Memory: [0-9]+MiB|Util: [0-9]+%" nvidia-t1/ref/nvidia-smi.txt', explain: 'Pulls the GPU model, its memory and its utilization out of the capture.', sample: 'NVIDIA H100-SXM\nMemory: 81559MiB\nUtil: 92%' },
        ],
        ['Memory'],
        'nvidia-smi is the first tool an operator reaches for: what GPU is this, how much memory has it, and is it actually doing work. Low utilization on an expensive GPU is money burning.',
        {
          usesForm: 'GPU Hardware & Sizing Record',
          producesDeliverable: '03_GPU_Hardware_and_Sizing_Record.md',
          outputHighlights: [{ text: 'Util: 92%', label: 'The GPU is busy; a reading near zero means wasted spend.' }],
        }
      ),
    ],
  },
  {
    id: 'nca-w2-sizing',
    role: 'infra',
    shared: true,
    week: 2,
    title: 'Size a GPU to a model',
    objective: 'Compute the GPU memory a model needs from its parameter count and precision, and choose the smallest GPU that fits.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['03_GPU_Hardware_and_Sizing_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 4,
    learn: ['Model parameters', 'Precision and bytes', 'VRAM sizing', 'Headroom'],
    tools: ['Python', 'Terminal'],
    definitionOfDone: [
      'The memory a model needs is computed from its parameters',
      'A GPU is chosen that fits it with headroom',
      'The sizing decision is recorded with the option rejected',
    ],
    steps: [
      run(
        'nca-w2-sizing-s1',
        'Compute the memory a model needs',
        LAB,
        'Compute the GPU memory a 13-billion-parameter model needs at FP16 (two bytes a parameter) plus overhead, in gigabytes.',
        [
          { cmd: 'python3 -c "p=13e9; bytes_per=2; gb=p*bytes_per/1e9; print(f\'{gb:.0f} GB weights, ~{gb*1.2:.0f} GB with overhead\')"', explain: 'Computes the weight memory and adds 20% overhead for activations and the KV cache.', sample: '26 GB weights, ~31 GB with overhead' },
        ],
        ['GB with overhead'],
        'A model needs roughly two bytes per parameter at FP16, plus overhead. This one number decides whether it fits on one GPU or must be split across several.',
        {
          usesForm: 'GPU Hardware & Sizing Record',
          outputHighlights: [{ text: 'GB with overhead', label: 'The memory the model needs, which the GPU must exceed.' }],
        }
      ),
      run(
        'nca-w2-sizing-s2',
        'Choose the GPU that fits',
        LAB,
        'List the GPUs from the table whose memory exceeds the computed need, smallest first, and pick the smallest that fits.',
        [
          { cmd: 'awk -F"\\t" "NR>1 && \\$3>=31{print \\$1\\" (\\"\\$3\\"GB)\\"}" nvidia-t1/ref/gpu-specs.tsv | sort -t"(" -k2 -n', explain: 'Filters the table to GPUs with at least 31 GB and lists them by memory.', sample: 'L40S (48GB)\nA100-SXM (80GB)\nH100-SXM (80GB)' },
        ],
        ['GB'],
        'The smallest GPU that fits with headroom is the cheapest that will not fail under load. Picking the biggest by reflex is how budgets are wasted.',
        {
          usesForm: 'GPU Hardware & Sizing Record',
          producesDeliverable: '03_GPU_Hardware_and_Sizing_Record.md',
          fixes: [{ symptom: 'Nothing in the table fits?', fix: 'The model must be sharded across GPUs or quantized to a smaller precision; record which, and the memory it then needs.' }],
        }
      ),
    ],
  },
  {
    id: 'nca-w2-dpu',
    role: 'datacenter',
    shared: true,
    week: 2,
    title: 'Follow the data-processing path',
    objective: 'Name what feeds the GPU — storage, network and the DPU — and why the GPU starves without them.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['03_GPU_Hardware_and_Sizing_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['DPU', 'Data loading', 'Storage bandwidth', 'GPU starvation'],
    tools: ['Python', 'Terminal'],
    definitionOfDone: [
      'The data path from storage to GPU is named in order',
      'What a DPU offloads is recorded',
      'A bottleneck that starves the GPU is identified',
    ],
    steps: [
      run(
        'nca-w2-dpu-s1',
        'Compute whether storage can feed the GPU',
        LAB,
        'Compare a training job’s data-read rate against a storage tier’s bandwidth to see whether the GPU would starve.',
        [
          { cmd: 'python3 -c "need=4.0; have=2.5; print(f\'need {need} GB/s, have {have} GB/s -> {\\"GPU starves\\" if need>have else \\"fed\\"}\')"', explain: 'Compares the required read rate against the storage bandwidth and says which wins.', sample: 'need 4.0 GB/s, have 2.5 GB/s -> GPU starves' },
        ],
        ['GPU starves'],
        'A GPU that cannot be fed data fast enough sits idle at full power. The DPU offloads networking and storage work so the GPU keeps computing rather than waiting.',
        {
          usesForm: 'GPU Hardware & Sizing Record',
          producesDeliverable: '03_GPU_Hardware_and_Sizing_Record.md',
          outputHighlights: [{ text: 'GPU starves', label: 'Storage too slow: the bottleneck is the data path, not the GPU.' }],
        }
      ),
    ],
  },

  // ── Week 3 — Plan the data centre (d1) ──────────────────────────────────────
  {
    id: 'nca-w3-network',
    role: 'datacenter',
    shared: true,
    week: 3,
    title: 'Size the network fabric',
    objective: 'Compute the aggregate NVLink bandwidth of a GPU node from the spec table.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['04_Data_Centre_Capacity_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['NVLink', 'InfiniBand', 'Aggregate bandwidth', 'East-west traffic'],
    tools: ['Python', 'Terminal'],
    definitionOfDone: [
      'The per-GPU NVLink bandwidth is read from the table',
      'The aggregate for an eight-GPU node is computed',
      'Why training needs this fabric is recorded',
    ],
    steps: [
      run(
        'nca-w3-network-s1',
        'Compute an eight-GPU node’s NVLink bandwidth',
        LAB,
        'Read the H100 NVLink bandwidth from the table and multiply by eight for a full node.',
        [
          { cmd: 'awk -F"\\t" "\\$1==\\"H100-SXM\\"{print \\$4*8\\" GB/s aggregate across 8 GPUs\\"}" nvidia-t1/ref/gpu-specs.tsv', explain: 'Reads the per-GPU NVLink bandwidth and multiplies by eight GPUs.', sample: '7200 GB/s aggregate across 8 GPUs' },
        ],
        ['aggregate across 8 GPUs'],
        'Training splits a model across GPUs that must exchange gradients every step. NVLink is the fast fabric that makes eight GPUs behave like one; without it, the network is the bottleneck.',
        {
          usesForm: 'Data Centre Capacity Record',
          producesDeliverable: '04_Data_Centre_Capacity_Record.md',
          outputHighlights: [{ text: 'aggregate across 8 GPUs', label: 'The intra-node bandwidth that keeps the GPUs in step.' }],
        }
      ),
    ],
  },
  {
    id: 'nca-w3-power',
    role: 'datacenter',
    shared: true,
    week: 3,
    title: 'Power and cool the rack',
    objective: 'Compute the total power draw and cooling load of a rack of GPU nodes from the spec table.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['04_Data_Centre_Capacity_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 4,
    learn: ['Power draw', 'Cooling load', 'BTU', 'Rack density'],
    tools: ['Python', 'Terminal'],
    definitionOfDone: [
      'The power draw of a GPU node is computed',
      'The rack total and its cooling load in BTU are computed',
      'Whether a standard rack can power it is recorded',
    ],
    steps: [
      run(
        'nca-w3-power-s1',
        'Compute the rack power and cooling load',
        LAB,
        'Compute the power of four eight-GPU H100 nodes, then the cooling load in BTU per hour (watts times 3.412).',
        [
          { cmd: 'python3 -c "gpu=700; n=8*4; watts=gpu*n; print(f\'{watts} W GPU power, {watts*3.412:.0f} BTU/hr cooling for 4 nodes\')"', explain: 'Computes the GPU power for four eight-GPU nodes and converts it to a cooling load in BTU per hour.', sample: '22400 W GPU power, 76429 BTU/hr cooling for 4 nodes' },
        ],
        ['BTU/hr cooling'],
        'GPUs turn almost all their power into heat. A rack of them can exceed what a standard rack is wired and cooled for; the BTU number is what the facilities team sizes the cooling to.',
        {
          usesForm: 'Data Centre Capacity Record',
          producesDeliverable: '04_Data_Centre_Capacity_Record.md',
          outputHighlights: [{ text: 'BTU/hr cooling', label: 'The heat the cooling must remove, from the power drawn.' }],
          fixes: [{ symptom: 'The rack cannot supply this power?', fix: 'Spread the nodes across more racks, or use lower-power GPUs; record the density the facility actually supports.' }],
        }
      ),
    ],
  },
  {
    id: 'nca-w3-scale',
    role: 'infra',
    shared: true,
    week: 3,
    title: 'Scale the training job',
    objective: 'Compute how many GPU nodes a training job needs to finish in a target time.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['04_Data_Centre_Capacity_Record.md'],
    estimatedTime: '1 h',
    difficulty: 4,
    learn: ['Scaling', 'GPU-hours', 'Parallelism', 'Diminishing returns'],
    tools: ['Python', 'Terminal'],
    definitionOfDone: [
      'The GPU-hours a job needs are stated',
      'The node count to hit a target time is computed',
      'A limit of scaling is recorded',
    ],
    steps: [
      run(
        'nca-w3-scale-s1',
        'Compute the nodes to hit a target time',
        LAB,
        'A job needs 4096 GPU-hours and must finish in 24 hours. Compute the GPUs, then the eight-GPU nodes, needed.',
        [
          { cmd: 'python3 -c "gpu_hours=4096; target=24; import math; gpus=math.ceil(gpu_hours/target); nodes=math.ceil(gpus/8); print(f\'{gpus} GPUs -> {nodes} nodes of 8\')"', explain: 'Divides the GPU-hours by the target hours for the GPU count, then by eight for nodes.', sample: '171 GPUs -> 22 nodes of 8' },
        ],
        ['nodes of 8'],
        'Throwing more GPUs at a job shortens it only until communication overhead eats the gain. Computing the node count from GPU-hours is the start of that trade-off, not the end.',
        {
          usesForm: 'Data Centre Capacity Record',
          producesDeliverable: '04_Data_Centre_Capacity_Record.md',
          outputHighlights: [{ text: 'nodes of 8', label: 'The node count a 24-hour finish needs, before overhead.' }],
        }
      ),
    ],
  },

  // ── Week 4 — Operate and hand over (d3) ─────────────────────────────────────
  {
    id: 'nca-w4-monitor',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Monitor the GPU telemetry',
    objective: 'Read the GPU utilization, temperature and power from the captured dcgmi output and flag anything out of range.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['05_GPU_Operations_and_Monitoring_Log.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['DCGM', 'GPU metrics', 'Thermal throttling', 'Monitoring'],
    tools: ['nvidia-smi', 'Terminal'],
    definitionOfDone: [
      'The per-GPU power, temperature and utilization are read',
      'The busiest and hottest GPU are identified',
      'A threshold to alert on is recorded',
    ],
    steps: [
      run(
        'nca-w4-monitor-s1',
        'Read the telemetry and find the hottest GPU',
        LAB,
        'Where DCGM is running you would stream dcgmi dmon; here, parse the captured output for the hottest GPU.',
        [
          { cmd: 'awk "NR>1{print \\"GPU \\"\\$1\\": \\"\\$3\\"C, \\"\\$4\\"% util\\"} NR>1 && \\$3>max{max=\\$3; hot=\\$1} END{print \\"hottest: GPU \\"hot\\" at \\"max\\"C\\"}" nvidia-t1/ref/dcgmi.txt', explain: 'Prints each GPU’s temperature and utilization and names the hottest.', sample: 'GPU 0: 61C, 92% util\nGPU 1: 60C, 90% util\nhottest: GPU 0 at 61C' },
        ],
        ['hottest'],
        'A GPU that crosses its thermal limit throttles itself and the whole job slows. Monitoring temperature, power and utilization is how an operator catches it before the users do.',
        {
          usesForm: 'GPU Operations & Monitoring Log',
          producesDeliverable: '05_GPU_Operations_and_Monitoring_Log.md',
          outputHighlights: [{ text: 'hottest', label: 'The GPU to watch first for thermal throttling.' }],
        }
      ),
    ],
  },
  {
    id: 'nca-w4-troubleshoot',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Work a scheduling fault, one change per row',
    objective: 'A job will not schedule onto a GPU node. Work it the method way, one change per row, failures kept.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['06_GPU_Scheduling_Troubleshooting_Log.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 4,
    learn: ['GPU scheduling', 'Resource requests', 'Node selectors', 'The troubleshooting method'],
    tools: ['Terminal'],
    prerequisites: ['A job stuck Pending off the GPU nodes'],
    definitionOfDone: [
      'The symptom is written exactly, before any theory',
      'Every attempt is a row: theory, the one change, the result',
      'At least one theory was wrong and the row says so',
      'The fix is proved with the job scheduled onto a GPU node',
    ],
    steps: [
      note(
        'nca-w4-troubleshoot-s1',
        'Read it before you change it',
        'The scheduling troubleshooting log',
        'Before any theory, read the scheduler message and write the exact reason the job will not place.',
        'The log opens with the exact scheduler message and no theory yet.',
        {
          usesForm: 'GPU Scheduling Troubleshooting Log',
          whatItMeans: 'The scheduler almost always says why it cannot place a pod. Reading that line first is the difference between a diagnosis and a guess.',
        }
      ),
      run(
        'nca-w4-troubleshoot-s2',
        'Read the scheduler reason',
        LAB,
        'Parse the captured scheduler event for why the GPU job is unschedulable, so the one change can be aimed.',
        [
          { cmd: 'printf \'0/4 nodes are available: 4 Insufficient nvidia.com/gpu.\\n\' | grep -oE "Insufficient nvidia.com/gpu"', explain: 'Pulls the reason out of the scheduler event: no node can satisfy the GPU request.', sample: 'Insufficient nvidia.com/gpu' },
        ],
        ['Insufficient nvidia.com/gpu'],
        'This message means either the job asks for more GPUs than any node has, or the GPU device plugin is not advertising them. One change per row tells you which.',
        {
          usesForm: 'GPU Scheduling Troubleshooting Log',
          producesDeliverable: '06_GPU_Scheduling_Troubleshooting_Log.md',
          outputHighlights: [{ text: 'Insufficient nvidia.com/gpu', label: 'The exact scheduler reason to aim the first theory at.' }],
          fixes: [
            { symptom: 'The device plugin is not running?', fix: 'The NVIDIA device plugin DaemonSet advertises nvidia.com/gpu; if it is not Ready, no node offers GPUs. Start it, then re-check.' },
            { symptom: 'The job asks for more GPUs than a node has?', fix: 'Lower the request to fit one node, or shard the job; record which single change you made.' },
          ],
        }
      ),
    ],
  },
  {
    id: 'nca-w4-handover',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Hand the plan over',
    objective: 'Assemble the handover record: the sizing and capacity plan, how to operate and monitor it, and a hashed custody row for every artifact.',
    frameworks: ['NIST_AI_RMF'],
    deliverables: ['07_Handover_and_As_Built.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Handover', 'Runbook', 'Chain of custody', 'Hashing evidence'],
    tools: ['Terminal'],
    prerequisites: ['Every other record of the course, filled'],
    definitionOfDone: [
      'The record says what was sized and planned, and how to operate it',
      'Every artifact has a custody row with its hash',
      'The known limits of the plan are recorded',
    ],
    steps: [
      note(
        'nca-w4-handover-s1',
        'Write the plan and how to operate it',
        'The handover record',
        'Write the plan in one page: the GPU chosen and why, the rack power and cooling, the node count, how it is monitored and what to alert on.',
        'A one-page record a new team could build and operate the infrastructure from.',
        {
          usesForm: 'Handover & As-Built',
          whatItMeans: 'The handover is the document the next team reads before they order a single GPU. Written honestly, it saves them the budget you just worked out.',
        }
      ),
      run(
        'nca-w4-handover-s2',
        'Hash every artifact for custody',
        LAB,
        'Hash every file in the plan folder so the handover carries a custody row that proves what was delivered.',
        [
          { cmd: 'find nvidia-t1 -type f -exec sha256sum {} + | tee nvidia-t1/week-4/custody.txt | wc -l && ls nvidia-t1/week-4/custody.txt', explain: 'Hashes every artifact and counts them, writing the custody list for the record.', sample: '14\nnvidia-t1/week-4/custody.txt' },
        ],
        ['custody.txt'],
        'A hash is what lets anyone, months later, prove the file in hand is the file delivered. It is the last control of the course.',
        {
          usesForm: 'Handover & As-Built',
          producesDeliverable: '07_Handover_and_As_Built.md',
          outputHighlights: [{ text: 'custody.txt', label: 'Every artifact hashed into one custody list.' }],
        }
      ),
    ],
  },
];

export const NVIDIA_AI_INFRASTRUCTURE: Course = withModules(withAiExtensions(withPortfolioStep({
  id: 'nvidia-ai-infrastructure',
  title: 'NVIDIA AI Infrastructure & Operations — the GPU Yard',
  slug: 'nvidia-ai-infrastructure',
  description:
    'Plan, size and operate the infrastructure an AI cluster runs on: the AI essentials and the NVIDIA stack, a GPU read and sized, a rack’s power, cooling and network, monitoring and a scheduling fault. No GPU required.',
  vendor: 'NVIDIA',
  certification: 'AI Infrastructure and Operations (NCA-AIIO)',
  level: 'associate',
  audience:
    'Size and operate the infrastructure under an AI cluster as a four-person team — everyone runs every command on real sample data; the focus decides which record you lead.',
  roles: ROLES,
  weeks: WEEKS,
  gates: [],
  tasks: TASKS,
  sharedTrack: true,
  noGatekeeping: true,
  teamCount: 16,
  teamCapacity: 4,
  topologyPicture: 'arch',
  lifecyclePath: [
    { label: 'Set up', detail: 'A terminal, a local model, the GPU spec and sample pack.' },
    { label: 'Learn', detail: 'AI/ML/DL, training vs inference, the GPU architecture and the stack.' },
    { label: 'Size', detail: 'Read a GPU from nvidia-smi and size one to a model.' },
    { label: 'Plan', detail: 'The network fabric, the power and cooling, the node count.' },
    { label: 'Operate', detail: 'Read the telemetry and work a job that will not schedule.' },
    { label: 'Hand over', detail: 'The plan, custody for every artifact, the known limits.' },
  ],
  isSeed: true,
  version: 1,
})));

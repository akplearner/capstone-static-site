# NVIDIA AI Infrastructure & Operations — the GPU Yard — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Set up the lab

> A local model running, the GPU spec table and the captured telemetry built, and the folder ready.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Local model | Inference you can run and time on a laptop CPU | Lab Setup & Reference Register |
| GPU spec table | Every infrastructure number is computed from this table | Lab Setup & Reference Register |
| 1 Setup & reference | Records the tools and the spec pack | Lab Setup & Reference Register |

**Process — Set up: a model, the spec pack, the folder:** specs → model (spec table and samples built).

## Week 1 — Essential AI knowledge

> New: inference run and timed, the GPU architecture read from the table, and the stack named from the driver up.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| AI / ML / DL | The workloads named, so the sizing is the right way round | AI Knowledge & Stack Record |
| NVIDIA stack | Driver up to framework, the layers a mismatch hides in | AI Knowledge & Stack Record |
| GPU architecture | Tensor cores and memory, read from the table | AI Knowledge & Stack Record |
| 2 Knowledge & stack | Records the concepts, the architecture and the stack | AI Knowledge & Stack Record |

**Process — Week 1: concepts, architecture, the stack:** model → concepts (inference run and timed); specs → arch (architecture read from the table).

## Week 2 — Read and size the GPU

> New: a GPU read from nvidia-smi, its memory need computed, a GPU chosen, and the data path checked.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| nvidia-smi | What GPU this is, its memory and whether it is busy | GPU Hardware & Sizing Record |
| Memory sizing | The memory a model needs, computed from its parameters | GPU Hardware & Sizing Record |
| GPU chosen | The smallest GPU that holds the model with headroom | GPU Hardware & Sizing Record |
| Data path | What feeds the GPU, so it computes instead of starving | GPU Hardware & Sizing Record |
| 3 Hardware & sizing | Records the GPU read, the sizing and the decision | GPU Hardware & Sizing Record |

**Process — Week 2: read and size the GPU:** smi → gpu_chosen (GPU read from nvidia-smi); sizing → gpu_chosen (sized from the model); datapath → gpu_chosen (the data path checked).

## Week 3 — Plan the data centre

> New: the fabric bandwidth, the rack power and cooling, and the node count, each computed from the table.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Network fabric | The fast fabric that makes many GPUs act as one | Data Centre Capacity Record |
| Power & cooling | The power drawn and the heat the cooling must remove | Data Centre Capacity Record |
| Scaling | The node count a training job needs for its deadline | Data Centre Capacity Record |
| 4 Capacity | Records the fabric, power, cooling and node count | Data Centre Capacity Record |

**Process — Week 3: plan the data centre:** fabric → gpu_chosen (fabric sized); power → gpu_chosen (power and cooling computed); scale → power (node count from GPU-hours).

## Week 4 — Operate and hand over

> New: the telemetry monitored, a scheduling fault worked to Running, and the plan handed over with custody.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Monitoring | The telemetry read and the thresholds to alert on | GPU Operations & Monitoring Log |
| Scheduling fault | A job stuck off the GPU nodes, worked to Running | GPU Scheduling Troubleshooting Log |
| Custody | A hash for every artifact the course produced | Handover & As-Built |
| 5 Operations log | Records the telemetry and the alert thresholds | GPU Operations & Monitoring Log |
| 6 Troubleshooting log | Records the scheduling fault worked one change per row | GPU Scheduling Troubleshooting Log |
| 7 Handover | The capstone: the plan as it is, with custody for every artifact | Handover & As-Built |
| 8 Portfolio | The repository, case study, resume bullets and diagram | Portfolio |

**Process — Week 4: operate and hand over:** monitor → gpu_chosen (telemetry read, thresholds set); fault → gpu_chosen (scheduling fault worked); fault → custody (every artifact hashed); custody → r_handover (handed over).

## Week 5 — Local LLM serving: Serve a model locally

Nothing new is built this week; the process is drawn over the picture.

## Week 6 — RAG engineering: Index your documents

Nothing new is built this week; the process is drawn over the picture.

## Week 7 — RAG engineering: Evaluate the answers

Nothing new is built this week; the process is drawn over the picture.

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| AI Knowledge (Essentials Lead) | Leads the knowledge record: AI/ML/DL, GPU architecture, training vs inference and the NVIDIA stack. | AI Knowledge & Stack Record | GPU Hardware & Sizing Record | Lab Setup & Reference Register | GPU Infrastructure (Hardware Lead), Operations (Records Lead) | GPU Infrastructure (Hardware Lead), Operations (Records Lead) |
| GPU Infrastructure (Hardware Lead) | Leads the hardware record: reading a GPU, sizing it, and the data path. | GPU Hardware & Sizing Record | Lab Setup & Reference Register, Data Centre Capacity Record | AI Knowledge & Stack Record, GPU Operations & Monitoring Log, GPU Scheduling Troubleshooting Log, Handover & As-Built, Portfolio | AI Knowledge (Essentials Lead), Data Centre (Capacity Lead) | AI Knowledge (Essentials Lead), Data Centre (Capacity Lead), Operations (Records Lead) |
| Data Centre (Capacity Lead) | Leads the capacity record: the network fabric, the power and cooling, and the scaling. | Data Centre Capacity Record | GPU Operations & Monitoring Log, GPU Scheduling Troubleshooting Log, Handover & As-Built, Portfolio | GPU Hardware & Sizing Record | GPU Infrastructure (Hardware Lead), Operations (Records Lead) | GPU Infrastructure (Hardware Lead), Operations (Records Lead) |
| Operations (Records Lead) | Leads the records that outlive the plan: monitoring, the scheduling fault, custody and handover. | Lab Setup & Reference Register, GPU Operations & Monitoring Log, GPU Scheduling Troubleshooting Log, Handover & As-Built, Portfolio | AI Knowledge & Stack Record | Data Centre Capacity Record | AI Knowledge (Essentials Lead), GPU Infrastructure (Hardware Lead), Data Centre (Capacity Lead) | AI Knowledge (Essentials Lead), Data Centre (Capacity Lead) |


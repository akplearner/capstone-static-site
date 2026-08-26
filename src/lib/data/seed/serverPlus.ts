import { Course, Gate, RoleDef, Task, WeekDef } from '../../types';

/**
 * CompTIA Server+ — Build & Document a Rack-Mount Server.
 *
 * This is a hands-on, documentation-first build. Every student takes a
 * rack-mount server, mounts it in a 42U rack, wires the patch panel, installs a
 * hypervisor and services, then operates, protects and hands it over — all
 * captured by filling the platform's deliverable forms and exporting them to
 * PDF. The exact CLI for standing up components lives in the course's
 * Configuration Guide (a PDF), which the steps reference rather than repeat; the
 * learning here is the *process in technical detail*, not command drills.
 *
 * ONE ROLE, on purpose. A pod of technicians works side by side, but nobody
 * waits on anyone: every student runs the whole build on their own server. So
 * there is a single role (`tech`), no gates, `noGatekeeping: true` (every week
 * open from day one), and no cross-role hand-offs. Each week carries one
 * optional "Go deeper" step inviting a student to document one area in more
 * depth — a lens, never a dependency.
 *
 * Addresses (10.10.10.x) are worked examples; a student uses whatever the
 * instructor assigned. `ServerTopologyDiagram` draws the physical rack, since
 * the generic `ArchitectureDiagram` hardcodes a red/blue/grc lab.
 */

const roles: RoleDef[] = [
  {
    id: 'tech',
    name: 'IT Technician',
    mission: 'Build, document and hand over a client\'s server from bare metal to running services.',
    color: '#b45309',
    icon: 'Wrench',
    label: '🔧 IT Technician',
  },
];

/**
 * The build arc. A server goes from delivery to handover: receive & rack →
 * install → operate & maintain → protect & hand over. `stage` is the cut of the
 * Capstone Stone each week produces (1→4, unique and non-decreasing); `phase` is
 * the verb shown above the week title. No week is locked — `noGatekeeping` on
 * the course opens all four from the start.
 */
const weeks: WeekDef[] = [
  {
    number: 1,
    title: 'Receive & Rack the Hardware',
    theme: 'Mount it and map it',
    objective: 'Take delivery, rack the server in the 42U rack, wire the patch panel, and start the records.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Rack & Cable',
    difficulty: 2,
    flow: ['Write the brief', 'Rack the server', 'Patch the panel', 'Tag the assets'],
    milestone: 'The server is mounted at a known U position, every cable is labelled and logged, and the assets are tagged.',
    plain: 'You are handed a rack-mount server and a room. Before any software, a professional mounts it properly, wires the patch panel so any cable can be traced, and writes down what they have.',
  },
  {
    number: 2,
    title: 'Build the Platform',
    theme: 'Install and record',
    objective: 'Install the hypervisor from the Configuration Guide, create the VMs, and document the network and every setting.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Install & Provision',
    difficulty: 3,
    flow: ['Install the hypervisor', 'Create the VMs', 'Map the network', 'Record the baseline'],
    milestone: 'The platform is installed and reachable, the VMs exist on their planned addresses, and every setting is recorded.',
    plain: 'Now the machine becomes a server. You follow the guide for the exact commands, then capture what you set so the build could be reproduced — installing is easy, reproducing it later is the skill.',
  },
  {
    number: 3,
    title: 'Operate & Maintain',
    theme: 'Keep it current',
    objective: 'Complete the asset inventory, patch every system with a rollback, and keep configuration and change control current.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Configure & Patch',
    difficulty: 3,
    flow: ['Finish the inventory', 'Snapshot & patch', 'Log the changes', 'Reconcile the config'],
    milestone: 'Every system is at a known patch level with a rollback, and the asset, config and change records match reality.',
    plain: 'A server that is installed and forgotten is a liability. This week is the real job: knowing what you have, keeping it patched, and being able to answer "what changed?" in seconds.',
  },
  {
    number: 4,
    title: 'Protect & Hand Over',
    theme: 'Prove it and hand it over',
    objective: 'Set recovery targets, prove a restore, then assemble and export the as-built handover package.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Protect & Hand Over',
    difficulty: 2,
    flow: ['Set the targets', 'Restore for real', 'Assemble the package', 'Hand it over'],
    milestone: 'A restore was performed and timed, and the client has a PDF package they could run the server from without you.',
    plain: 'Anyone can say they have backups. This week you restore for real and time it, then hand over documentation a stranger could operate the server from — the difference between a lab and a delivered job.',
  },
];

// No gates: the course is ungated (`noGatekeeping: true`), and with a single
// role there is nobody to hand off to. Kept as an empty array so the shape
// matches the other seeds and the integrity guards pass trivially.
const gates: Gate[] = [];

const tasks: Task[] = [
  // ══ WEEK 1 · Receive & Rack ═══════════════════════════════════════════════
  {
    id: 'sp-w1-brief',
    role: 'tech',
    week: 1,
    title: 'Receive the hardware and write the brief',
    objective: 'Agree what you are building and for whom, then open the log that tracks every change.',
    frameworks: ['NIST_CSF'],
    deliverables: ['01_Project_Brief.md', '07_Change_Log.csv'],
    estimatedTime: '1 hour',
    difficulty: 2,
    learn: ['Scoping a build', 'Site preparation', 'Change control from day one'],
    tools: ['Project Brief form', 'Change Log form'],
    prerequisites: ['The client brief', 'Physical access to the delivered server'],
    definitionOfDone: [
      'The brief names the client, the hardware and where it installs',
      'Out-of-scope is written down',
      'The change log has its first entries',
    ],
    steps: [
      {
        id: 'sp-w1-brief-s1',
        title: 'Write the project brief',
        description: 'Agree what you will deliver, and what you will not.',
        instruction: 'Fill the Project Brief & Site Prep form: the client, the server you received, where it installs, what it must do, and the four milestones as your acceptance criteria.',
        usesForm: 'Project Brief & Site Prep',
        producesDeliverable: '01_Project_Brief.md',
        whatItMeans: 'The out-of-scope list is the half that protects you. The goal is a brief a stranger could pick the job up from.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w1-brief-s2',
        title: 'Open the change log',
        description: 'Start the record that answers "what changed?" all engagement.',
        instruction: 'Start the Change Log now, on day one. Add a row the moment you do anything physical — unbox, rack, cable — with what you did and how to undo it.',
        usesForm: 'Change Log',
        producesDeliverable: '07_Change_Log.csv',
        whatItMeans: 'When something breaks, the first question is "what changed?". A log written as you work answers it in seconds, not hours.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-w1-rack',
    role: 'tech',
    week: 1,
    title: 'Rack and cable the server',
    objective: 'Mount the server in the 42U rack, wire the patch panel, power it, and record every cable.',
    frameworks: ['NIST_CSF'],
    deliverables: ['02_Rack_and_Cabling.md', '03_Asset_Register.csv'],
    estimatedTime: '2 hours',
    difficulty: 3,
    learn: ['42U rack mounting', 'Patch-panel termination', 'Structured cabling', 'Asset tagging'],
    tools: ['Rack & Cabling form', 'Asset Register form', 'Rails and cage nuts', 'Patch panel'],
    prerequisites: ['The project brief', 'Rails, cage nuts, patch leads and labels'],
    definitionOfDone: [
      'The server is mounted and its U range recorded',
      'Every cable is labelled and logged at both ends',
      'Hardware assets are tagged in the register',
    ],
    steps: [
      {
        id: 'sp-w1-rack-s1',
        title: 'Mount the server in the 42U rack',
        description: 'Fit the rails and secure the server at a known U position.',
        where: 'The server room — 42U rack',
        instruction: 'Fit the rails to the server and the rack, slide it into its U position counting from the bottom, and secure it. Note the exact U range it occupies.',
        instructionList: [
          'Count U positions from the bottom of the rack upward.',
          'Attach the inner rails to the server and the outer rails to the rack posts.',
          'Slide the server in and secure it with cage-nut screws.',
          'Keep heavy equipment low and leave airflow above it where you can.',
          'Photograph the front and rear of the rack.',
        ],
        whatItMeans: 'A server bolted in at a known U position is one anyone can find and service. Weight order and airflow keep it alive.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'The server is secured on its rails at a recorded U range, with the front and rear of the rack photographed for the record.',
        outputKind: 'result',
      },
      {
        id: 'sp-w1-rack-s2',
        title: 'Wire and patch the patch panel',
        description: 'Terminate the cabling, patch to the switch, and power it — all labelled.',
        where: 'The rack — patch panel, switch and PDU',
        instruction: 'Terminate the structured cabling to the patch panel, patch each port to the switch with a labelled lead, then power through the PDU. Record every cable in the form.',
        instructionList: [
          'Terminate each structured cable onto a numbered patch-panel port.',
          'Run a labelled patch lead from each panel port to a switch port.',
          'Colour-code by purpose — one colour for management, another for VM traffic.',
          'Label both ends of every lead with the same cable ID.',
          'Connect power through the PDU and note which outlet feeds what.',
        ],
        usesForm: 'Rack & Cabling Record',
        producesDeliverable: '02_Rack_and_Cabling.md',
        whatItMeans: 'A lead you can trace end to end from its label is one the next tech will dare to move. Colour discipline keeps it from a bird\'s nest.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w1-rack-s3',
        title: 'Tag and register the hardware',
        description: 'Begin the master list of everything in the rack.',
        instruction: 'Put an asset tag on every physical item — server, switch, patch panel, PDU — then add a hardware row for each to the Asset Register with its tag, serial and condition.',
        usesForm: 'Asset Register',
        producesDeliverable: '03_Asset_Register.csv',
        whatItMeans: 'You cannot secure, budget for, patch or recover what you do not know you have. The software rows come in Week 3.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
      {
        id: 'sp-w1-rack-s4',
        title: 'Go deeper: your focus area',
        description: 'Optional — document one area in more depth for the team.',
        instruction: 'Pick one area to own for the team\'s records this week — cabling, power, or asset data — and add a deeper note on it in the relevant form.',
        whatItMeans: 'One shared build, but each person documents one area in depth. It is how the team\'s paperwork gets real expertise behind it.',
        optional: true,
        frameworks: ['NIST_CSF'],
      },
    ],
  },

  // ══ WEEK 2 · Build the Platform ═══════════════════════════════════════════
  {
    id: 'sp-w2-install',
    role: 'tech',
    week: 2,
    title: 'Install the virtualization platform',
    objective: 'Install the hypervisor from the Configuration Guide, create the VMs, and record every setting.',
    frameworks: ['NIST_CSF'],
    deliverables: ['05_Configuration_Management.md'],
    estimatedTime: '2.5 hours',
    difficulty: 3,
    learn: ['Hypervisor installation', 'VM provisioning', 'Configuration baselines'],
    tools: ['Proxmox VE', 'Configuration Management form', 'Configuration Guide (PDF)'],
    prerequisites: ['The server racked and powered', 'The Configuration Guide (PDF)', 'Install media prepared'],
    definitionOfDone: [
      'The hypervisor is installed and reachable',
      'The VMs exist with their planned resources and addresses',
      'Every baseline setting is recorded with evidence',
    ],
    steps: [
      {
        id: 'sp-w2-install-s1',
        title: 'Install the hypervisor from the guide',
        description: 'Follow the Configuration Guide for the exact install steps.',
        where: 'The server console',
        instruction: 'Boot the install media and install the hypervisor, following the Configuration Guide for the exact steps and values. Set the hostname and a static management address.',
        instructionList: [
          'Boot the prepared install media on the server.',
          'Follow the Configuration Guide for the install options and disk layout.',
          'Set the hostname and a static management IP from your topology plan.',
          'Remove the media and reboot when it finishes.',
        ],
        files: [
          { name: 'Configuration Guide (PDF) — hypervisor install', purpose: 'the exact CLI and installer values for standing up the platform' },
        ],
        whatItMeans: 'The exact commands live in the guide; your job is to run the process and record what you set. The management address never carries user services.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'After the reboot the console shows a login prompt and names the web console URL, reachable from a browser on the management network.',
        outputKind: 'result',
      },
      {
        id: 'sp-w2-install-s2',
        title: 'Create the VMs',
        description: 'Stand up the guests that carry the services.',
        where: 'The hypervisor web console',
        instruction: 'Create each VM with the resources from your plan, on the management bridge with a static address. Use the Configuration Guide for the per-VM steps.',
        instructionList: [
          'Upload the OS install images to the host storage.',
          'Create each VM with the vCPU, RAM and disk from your plan.',
          'Attach each VM to the bridge and give it a static address.',
          'Follow the Configuration Guide for the guest install options.',
        ],
        files: [
          { name: 'Configuration Guide (PDF) — VM provisioning', purpose: 'the per-VM create and guest-install steps' },
        ],
        whatItMeans: 'Sizing and addressing come from the plan you wrote, not from guesswork at the console. Decide once, on paper, then build to it.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'Each VM boots to its OS, holds its planned static address, and shows on the correct bridge in the hardware tab.',
        outputKind: 'result',
      },
      {
        id: 'sp-w2-install-s3',
        title: 'Record the configuration baseline',
        description: 'Capture the settings you would need to rebuild each system.',
        instruction: 'Add a row per system to the Configuration Management Record — the host and each VM — with the baseline values you set, the guide section for the exact steps, and a screenshot as evidence.',
        usesForm: 'Configuration Management Record',
        producesDeliverable: '05_Configuration_Management.md',
        whatItMeans: 'Configuration you did not write down is configuration you cannot restore or audit. Record the value, not a description of it.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-w2-topology',
    role: 'tech',
    week: 2,
    title: 'Map the network and addressing',
    objective: 'Draw how everything connects and give every device a fixed address before it changes.',
    frameworks: ['NIST_CSF'],
    deliverables: ['04_Topology_and_IP_Plan.md'],
    estimatedTime: '1 hour',
    difficulty: 2,
    learn: ['Topology diagrams', 'IP address planning', 'Documentation as source of truth'],
    tools: ['Network Topology & IP Plan form'],
    prerequisites: ['The rack & cabling record', 'The platform installed'],
    definitionOfDone: [
      'The physical and virtual paths are described',
      'Every host has a unique planned address',
      'The topology diagram is drawn and named',
    ],
    steps: [
      {
        id: 'sp-w2-topology-s1',
        title: 'Describe the physical and virtual layout',
        description: 'Two paragraphs and a diagram anyone can read in 30 seconds.',
        instruction: 'In the Network Topology & IP Plan form, describe the physical path — office drop, patch panel, switch, server NIC — and the virtual layout of the host and its VMs.',
        usesForm: 'Network Topology & IP Plan',
        producesDeliverable: '04_Topology_and_IP_Plan.md',
        whatItMeans: 'A diagram lets a new tech understand the whole setup in thirty seconds. Keep it matching reality, or it becomes a trusted lie.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w2-topology-s2',
        title: 'Write the IP plan',
        description: 'Decide every address in one place, before anything uses it.',
        instruction: 'Give the host and every VM a row with its address, gateway and DNS. Reserve ranges so nothing collides, and check every address is unique.',
        usesForm: 'Network Topology & IP Plan',
        producesDeliverable: '04_Topology_and_IP_Plan.md',
        whatItMeans: 'The IP plan is the single source of truth for addresses. If someone assigns one without opening it, the plan has already failed.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w2-topology-s3',
        title: 'Go deeper: your focus area',
        description: 'Optional — document one layer of the topology in depth.',
        instruction: 'Own one part of the topology this week — the physical cabling map, the addressing scheme, or the virtual bridges — and add a deeper note explaining your choices.',
        whatItMeans: 'Same shared plan, but one person documents one layer in depth. That is how the diagram gains the reasoning behind it, not just the shapes.',
        optional: true,
        frameworks: ['NIST_CSF'],
      },
    ],
  },

  // ══ WEEK 3 · Operate & Maintain ═══════════════════════════════════════════
  {
    id: 'sp-w3-assets',
    role: 'tech',
    week: 3,
    title: 'Complete the asset and configuration records',
    objective: 'Finish the software inventory now everything is installed, and keep the configuration record current.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['03_Asset_Register.csv', '05_Configuration_Management.md'],
    estimatedTime: '1.5 hours',
    difficulty: 2,
    learn: ['Software asset management', 'Support-lifecycle tracking', 'Configuration drift'],
    tools: ['Asset Register form', 'Configuration Management form'],
    prerequisites: ['Every service installed', 'The Week-1 asset register started'],
    definitionOfDone: [
      'Every installed program is a software asset with a version',
      'End-of-support dates are recorded',
      'The configuration record matches what is running',
    ],
    steps: [
      {
        id: 'sp-w3-assets-s1',
        title: 'Complete the software inventory',
        description: 'Add every installed program to the register now it exists.',
        instruction: 'Add a software row per installed program — each OS, the hypervisor, every service — with its version and support-end date. That date is the security-relevant column.',
        usesForm: 'Asset Register',
        producesDeliverable: '03_Asset_Register.csv',
        whatItMeans: 'The register now answers a security question as well as a budget one: what do we own, and what is out of support and no longer patched?',
        frameworks: ['NIST_CSF', 'CIS'],
      },
      {
        id: 'sp-w3-assets-s2',
        title: 'Reconcile the configuration record',
        description: 'Confirm the record still matches the running systems.',
        instruction: 'Walk each system and confirm the Configuration Management Record still matches what is actually running. Update any value that drifted, and log the change.',
        usesForm: 'Configuration Management Record',
        producesDeliverable: '05_Configuration_Management.md',
        whatItMeans: 'A stale config record is a trap for the next tech. Reconciling it keeps "reinstall to spec" possible instead of "reinstall and hope".',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-w3-patch',
    role: 'tech',
    week: 3,
    title: 'Patch management and change control',
    objective: 'Bring every system to a known patch level with a rollback, and keep the change log current.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['06_Patch_Management.csv', '07_Change_Log.csv'],
    estimatedTime: '1.5 hours',
    difficulty: 3,
    learn: ['Patch baselines', 'Rollback via snapshots', 'Change control'],
    tools: ['Patch Management form', 'Change Log form', 'Configuration Guide (PDF)'],
    prerequisites: ['The asset register complete', 'The systems reachable'],
    definitionOfDone: [
      'Every system has a patch baseline and a schedule',
      'A rollback exists before any patch is applied',
      'Every change is logged with a rollback',
    ],
    steps: [
      {
        id: 'sp-w3-patch-s1',
        title: 'Snapshot, then patch each system',
        description: 'Take the rollback first, then update.',
        where: 'Each system',
        instruction: 'Take a VM snapshot or restore point first — that is your rollback — then apply updates. Use the Configuration Guide for the exact per-OS update commands.',
        instructionList: [
          'Take a snapshot or restore point of the system before touching it.',
          'Apply the available updates, following the Configuration Guide for the commands.',
          'Confirm each service still runs after the update.',
          'Record the new patch level and the date.',
        ],
        files: [
          { name: 'Configuration Guide (PDF) — updates & patching', purpose: 'the exact per-OS update commands' },
        ],
        whatItMeans: 'A patch with no rollback is a gamble on production. The snapshot taken first is what makes patching a live server safe.',
        frameworks: ['NIST_CSF', 'CIS'],
        expectedOutput: 'Each system is at a recorded new patch level, its services confirmed running, with a snapshot available to roll back to.',
        outputKind: 'result',
      },
      {
        id: 'sp-w3-patch-s2',
        title: 'Log the patch run',
        description: 'Record the level, schedule and rollback for each system.',
        instruction: 'Record each system in the Patch Management Log: its starting level, the schedule you set, the rollback method, what you applied and the result.',
        usesForm: 'Patch Management Log',
        producesDeliverable: '06_Patch_Management.csv',
        whatItMeans: 'The log answers "are we current, and can we undo a bad update?". Without the level you cannot tell what is still exposed.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
      {
        id: 'sp-w3-patch-s3',
        title: 'Keep the change log current',
        description: 'Append the patch run and any config change this week.',
        instruction: 'Add a change-log row for the patch run and any config change this week — what you did, why, the result, and how to roll it back.',
        usesForm: 'Change Log',
        producesDeliverable: '07_Change_Log.csv',
        whatItMeans: 'Append-only, written as you go. The rollback value is only trustworthy if you wrote it before the change, not from memory later.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w3-patch-s4',
        title: 'Go deeper: your focus area',
        description: 'Optional — document one maintenance area in depth.',
        instruction: 'Own one maintenance area this week — OS patching, the database, or change control — and write a deeper note on how you would keep it current in production.',
        whatItMeans: 'One shared routine, but each person documents one part in depth. It is how the team learns operations, not just installation.',
        optional: true,
        frameworks: ['NIST_CSF'],
      },
    ],
  },

  // ══ WEEK 4 · Protect & Hand Over ══════════════════════════════════════════
  {
    id: 'sp-w4-dr',
    role: 'tech',
    week: 4,
    title: 'Disaster recovery and a real restore',
    objective: 'Set recovery targets, write the restore procedure, then prove it with one real restore.',
    frameworks: ['NIST_CSF'],
    deliverables: ['08_DR_Plan.md'],
    estimatedTime: '2 hours',
    difficulty: 3,
    learn: ['RTO, RPO and MTTR', 'Restore procedures', 'Testing a backup'],
    tools: ['Disaster Recovery Plan form'],
    prerequisites: ['Backups or snapshots in place', 'The configuration record current'],
    definitionOfDone: [
      'Each critical system has an RTO, RPO and MTTR',
      'A restore was run and its time measured',
      'Data integrity after the restore was confirmed',
    ],
    steps: [
      {
        id: 'sp-w4-dr-s1',
        title: 'Set the recovery targets and procedure',
        description: 'The numbers, in the order the business needs systems back.',
        instruction: 'In the Disaster Recovery Plan, list the critical systems in the order the business needs them back, set an RTO, RPO and target MTTR for each, and write the restore steps.',
        usesForm: 'Disaster Recovery Plan',
        producesDeliverable: '08_DR_Plan.md',
        whatItMeans: 'RTO is how fast it must return; RPO is how much data you can lose; MTTR is how long a repair takes. Numbers come from what downtime costs.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w4-dr-s2',
        title: 'Run one real restore',
        description: 'Delete something, bring it back, and time it.',
        where: 'A test system',
        instruction: 'Delete a test file or restore a snapshot for real, bring it back, and time it. Record the actual recovery time against your target, and confirm the data is intact.',
        usesForm: 'Disaster Recovery Plan',
        producesDeliverable: '08_DR_Plan.md',
        whatItMeans: 'Only a tested restore proves any of the numbers. A plan recorded as "passed" with no measured time is worth nothing.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-w4-handover',
    role: 'tech',
    week: 4,
    title: 'Assemble and hand over the as-built package',
    objective: 'Bring every document together, export it to PDF, and hand over a package the client can run from.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['09_As_Built.md'],
    estimatedTime: '2 hours',
    difficulty: 2,
    learn: ['As-built documentation', 'PDF handover packages', 'Client sign-off'],
    tools: ['As-Built Handover Package form', 'Generate PDF'],
    prerequisites: ['Every other deliverable current'],
    definitionOfDone: [
      'Every document is checked in and matches reality',
      'Each form is exported to PDF',
      'The client summary is written and signed off',
    ],
    steps: [
      {
        id: 'sp-w4-handover-s1',
        title: 'Reconcile every document',
        description: 'Confirm each document matches what is actually running.',
        instruction: 'Walk the handover checklist in the As-Built form, confirm each document exists and matches what is actually running, and fix anything that drifted before checking it in.',
        usesForm: 'As-Built Handover Package',
        producesDeliverable: '09_As_Built.md',
        whatItMeans: 'As-built means as BUILT, including what changed. The standard: a stranger could run the server from this without asking you a question.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
      {
        id: 'sp-w4-handover-s2',
        title: 'Export the package to PDF',
        description: 'Turn the forms you filled all along into one package.',
        instruction: 'On the Deliverables page, use Generate PDF on each form to produce the handover set, then confirm every document is marked exported in the checklist.',
        whatItMeans: 'The forms you filled all along become one PDF package here. That is why keeping them current from day one mattered.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'Every form downloads as a PDF, and the As-Built checklist shows each document current and exported.',
        outputKind: 'result',
      },
      {
        id: 'sp-w4-handover-s3',
        title: 'Write the client summary and hand over',
        description: 'What they have, how they run it, and what you found.',
        instruction: 'Write what the client now has, how they operate it without you, and your findings and recommendations. Date it, get sign-off, and log every handed-over artifact.',
        usesForm: 'As-Built Handover Package',
        producesDeliverable: '09_As_Built.md',
        whatItMeans: 'Lead with what works and what the client can now do, not the commands you typed. This is the handover they keep and operate from.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
    ],
  },
];

export const SERVER_PLUS: Course = {
  id: 'server-plus',
  title: 'Server+ Build & Handover',
  slug: 'server-plus',
  vendor: 'CompTIA',
  certification: 'Server+',
  level: 'associate',
  audience: 'Build and document your own rack-mount server — rack, cable, install, patch and hand over, the way a real IT technician does.',
  description:
    'Build a client\'s rack-mount server from bare metal to a running, documented system — on your own, start to finish. Over four weeks you receive and rack the hardware, install the platform, operate and maintain it, then protect and hand it over as a PDF package.',
  roles,
  weeks,
  gates,
  tasks,
  noGatekeeping: true,
  lifecyclePath: [
    { label: 'Receive', detail: 'Take delivery of the server and agree what you are building.' },
    { label: 'Rack & Cable', detail: 'Mount it in the 42U rack, wire the patch panel, and power it.' },
    { label: 'Install', detail: 'Stand up the hypervisor and the VMs on top of it.' },
    { label: 'Configure', detail: 'Record every setting as a baseline you could rebuild from.' },
    { label: 'Patch', detail: 'Bring every system current, with a rollback taken first.' },
    { label: 'Protect', detail: 'Set recovery targets and prove a restore actually works.' },
    { label: 'Hand over', detail: 'An as-built PDF package the client can run the server from.' },
  ],
  isSeed: true,
  version: 2,
  teamCount: 16,
  teamCapacity: 6,
};

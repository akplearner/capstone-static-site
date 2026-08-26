import { Course, Gate, RoleDef, Task, WeekDef } from '../../types';

/**
 * CompTIA Server+ — Plan, Build & Hand Over a Rack-Mount Server.
 *
 * A hands-on, documentation-first engagement built to fit ~2 hours of work a
 * week. Week 1 is a junior sysadmin's first week: profile the business, plan
 * the 24U rack, audit what the hardware can actually do, plan the upgrades,
 * and draft the architecture. The build then executes that plan: rack and
 * deploy in Week 2, network and connect in Week 3, secure and prove disaster
 * recovery in Week 4. Everything is captured by filling the platform's
 * deliverable forms and exporting them to PDF; the exact CLI lives in the
 * course's Configuration Guide (a PDF), which the steps reference rather than
 * repeat — the learning is the *process in technical detail*, not command
 * drills.
 *
 * ONE SHARED TRACK, FOUR FOCUSES. A pod of technicians works side by side and
 * nobody waits on anyone: every student runs the whole engagement on their own
 * server and fills every form. The four roles — Networking, Windows, Linux,
 * Management — are not four lanes of work; they are four *documentation
 * focuses*. Each week your focus adds one small deep-dive into the part you
 * own, and you are the documentation lead for a couple of the records. Nothing
 * gates: `noGatekeeping: true`, no gates array, no cross-role hand-offs, and
 * the build tasks are flagged `shared` so they belong to everyone (see
 * `Course.sharedTrack`).
 *
 * Addresses (10.10.10.x) are worked examples; a student uses whatever the
 * instructor assigned. `ServerTopologyDiagram` draws the physical 24U rack —
 * it also renders on the course Overview beside the phase arc. There is no
 * attacker, no target range and no lab-access panel on this course — see
 * LAB_PROFILES in labAccess.ts.
 */

const roles: RoleDef[] = [
  {
    id: 'net',
    name: 'Networking',
    mission: 'Lead the network record: cabling, addressing, topology and the connectivity proof.',
    color: '#0369a1',
    icon: 'Network',
    label: '🔌 Networking',
  },
  {
    id: 'win',
    name: 'Windows',
    mission: 'Lead the Windows record: the Server VM, its roles, patching and its restore.',
    color: '#2563eb',
    icon: 'Server',
    label: '🪟 Windows',
  },
  {
    id: 'lnx',
    name: 'Linux',
    mission: 'Lead the Linux record: the hypervisor, the Linux VM, services and snapshots.',
    color: '#7c3aed',
    icon: 'Cpu',
    label: '🐧 Linux',
  },
  {
    id: 'mgmt',
    name: 'Management',
    mission: 'Lead the paperwork that outlives the build: requirements, assets, change control, handover.',
    color: '#0f766e',
    icon: 'ClipboardList',
    label: '📋 Management',
  },
];

/**
 * The engagement arc, in four phases: plan & analyze → build & deploy →
 * network & connect → secure & DRP. `stage` is the cut of the Capstone Stone
 * each week produces (1→4, unique and non-decreasing); `phase` is the verb
 * shown above the week title. No week is locked — `noGatekeeping` on the
 * course opens all four from the start. Each week is scoped to ~2 hours.
 */
const weeks: WeekDef[] = [
  {
    number: 1,
    title: 'Plan the Infrastructure',
    theme: 'Think before you rack',
    objective: 'Profile the business, plan the 24U rack, audit what the hardware can do, plan the upgrades, and draft the architecture.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Plan & Analyze',
    difficulty: 2,
    flow: ['Profile the business', 'Plan the 24U rack', 'Audit the hardware', 'Draft the architecture'],
    milestone: 'The requirements, rack plan, hardware audit, upgrade plan and draft architecture are filled in and defensible.',
    plain: 'Before a professional touches a screwdriver, they know who the server is for, what the hardware can actually do, what it needs, and what will run on it. This week you produce that plan — the way a junior sysadmin would.',
  },
  {
    number: 2,
    title: 'Build & Deploy',
    theme: 'Execute the plan',
    objective: 'Rack and cable the server per the Week-1 plan, install the hypervisor, create the core VMs, and deploy the services.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Build & Deploy',
    difficulty: 3,
    flow: ['Rack per the plan', 'Install the hypervisor', 'Create the VMs', 'Deploy the services'],
    milestone: 'The server sits at its planned U, the platform and core services run, and every setting is recorded to rebuild from.',
    plain: 'Now the plan becomes metal and software: mount the server exactly where the rack plan says, wire the patch panel, then follow the guide to install the hypervisor and stand up the core Windows and Linux VMs.',
  },
  {
    number: 3,
    title: 'Network & Connect',
    theme: 'Plan it, connect it, prove it',
    objective: 'Finalise the addressing and topology, connect the server to the network, and prove every host reaches what it should.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Network & Connect',
    difficulty: 3,
    flow: ['Finalise the addresses', 'Draw the topology', 'Connect the uplink', 'Prove it reaches'],
    milestone: 'Every host holds its planned address, the topology matches reality, and the connectivity is proven and logged.',
    plain: 'A server nobody can reach is a space heater. This week you finalise the addressing on paper, connect the machine through the patch panel to the real network, and prove the paths work.',
  },
  {
    number: 4,
    title: 'Secure & Recover',
    theme: 'Patch it, prove it, hand it over',
    objective: 'Patch every system with a rollback, set recovery targets, prove a restore, then assemble and export the as-built handover package.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Secure & DRP',
    difficulty: 3,
    flow: ['Snapshot & patch', 'Set the targets', 'Restore for real', 'Hand it over'],
    milestone: 'Every system is patched with a rollback, a restore was performed and timed, and the client has the PDF package.',
    plain: 'Security here is discipline, not drama: patch with a way back, write recovery numbers you can defend, restore for real and time it, then hand over documentation a stranger could run the server from.',
  },
];

// No gates: the course is ungated (`noGatekeeping: true`) and no focus waits on
// another. Kept as an empty array so the shape matches the other seeds.
const gates: Gate[] = [];

/**
 * The shared engagement — worked by every student whatever focus they picked.
 *
 * `shared: true` is what makes that true across the whole app: `getTasksByRole`
 * returns these for every role, so progress, the stone, resume and the portfolio
 * all count them. `role` here is nominal (these render in their own "everyone"
 * lane, never a role lane); `mgmt` is used because that focus leads the record
 * set as a whole. Per-week estimated times sum to roughly the two-hour budget.
 */
const sharedTasks: Task[] = [
  // ══ WEEK 1 · Plan & Analyze ═══════════════════════════════════════════════
  {
    id: 'sp-w1-business',
    role: 'mgmt',
    shared: true,
    week: 1,
    title: 'Profile the business and open the log',
    objective: 'Choose the business scenario, capture the requirements that drive every later decision, and open the change log.',
    frameworks: ['NIST_CSF'],
    deliverables: ['01_Business_Requirements.md', '09_Change_Log.csv'],
    estimatedTime: '30 min',
    difficulty: 2,
    learn: ['Requirements gathering', 'Compliance & SLA basics', 'Change control from day one'],
    tools: ['Business Requirements form', 'Change Log form'],
    prerequisites: ['A business scenario (from the list or instructor-approved)'],
    definitionOfDone: [
      'The business profile is complete: industry, size, hours, compliance, posture',
      'Critical systems and the uptime target are written down',
      'The change log has its first entry',
    ],
    steps: [
      {
        id: 'sp-w1-business-s1',
        title: 'Fill the business requirements sheet',
        description: 'The profile every technical decision will be checked against.',
        instruction: 'Choose your business scenario and complete the Business Requirements Sheet — every field drives a later decision.',
        instructionList: [
          'Industry, employees, departments and hours of operation.',
          'The critical systems the business cannot work without.',
          'Compliance rule (HIPAA, PCI, SOX, or none) and the security posture.',
          'The uptime target with its consequence, and the data-retention need.',
          'Remote-access needs, and acceptance criteria you could demonstrate.',
        ],
        usesForm: 'Business Requirements Sheet',
        producesDeliverable: '01_Business_Requirements.md',
        whatItMeans: 'Specs only matter because of the business. Every later document should trace back to a line on this sheet.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w1-business-s2',
        title: 'Open the change log',
        description: 'Start the record that answers "what changed?" all engagement.',
        instruction: 'Start the Change Log now, on day one. Add a row for the engagement kickoff, then a row the moment you do anything physical later.',
        usesForm: 'Change Log',
        producesDeliverable: '09_Change_Log.csv',
        whatItMeans: 'When something breaks, the first question is "what changed?". A log written as you work answers it in seconds, not hours.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-w1-rackplan',
    role: 'mgmt',
    shared: true,
    week: 1,
    title: 'Plan the 24U rack',
    objective: 'Decide what goes at which U, how air and power move, and where the room to grow is — before touching hardware.',
    frameworks: ['NIST_CSF'],
    deliverables: ['02_Rack_Plan_and_Cabling.md'],
    estimatedTime: '20 min',
    difficulty: 2,
    learn: ['Rack elevation planning', 'Airflow & power strategy', 'Capacity reserves'],
    tools: ['Rack Plan & Cabling form'],
    prerequisites: ['The business requirements sheet', 'The equipment list for your rack'],
    definitionOfDone: [
      'Every device has a planned U position',
      'Airflow, power, cooling and physical security are decided',
      'At least 20% of the rack (5U) is reserved for expansion',
    ],
    steps: [
      {
        id: 'sp-w1-rackplan-s1',
        title: 'Draft the rack elevation and strategies',
        description: 'The map of the 24U rack, decided on paper first.',
        instruction: 'In the Rack Plan & Cabling form, place every device at a planned U and record the four strategies the build will follow.',
        instructionList: [
          'Place servers low, patch panel and switch high, PDU at the bottom.',
          'Record the airflow direction — front cold intake, rear hot exhaust.',
          'Decide the power path: which PDU/UPS outlet feeds which device.',
          'Note cooling and physical security (locked room, locked rack).',
          'Mark a reserved block of at least 5U (≥20%) as expansion space.',
        ],
        usesForm: 'Rack Plan & Cabling Record',
        producesDeliverable: '02_Rack_Plan_and_Cabling.md',
        whatItMeans: 'A rack planned on paper is one you can defend — and the expansion reserve is what saves a re-rack when the business grows.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-w1-discovery',
    role: 'mgmt',
    shared: true,
    week: 1,
    title: 'Audit the hardware and plan the upgrades',
    objective: 'Discover what each server actually is and can do, then propose the upgrades the business case justifies.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['03_Hardware_Discovery.csv', '04_Upgrade_Plan.csv'],
    estimatedTime: '45 min',
    difficulty: 3,
    learn: ['Hardware capability auditing', 'Compatibility checking', 'Procurement justification'],
    tools: ['Hardware Discovery form', 'Upgrade Planning form', 'Configuration Guide (PDF)'],
    prerequisites: ['Physical access to the server', 'The service tag / BIOS / management page'],
    definitionOfDone: [
      'CPU, memory, storage, network and firmware are recorded per server',
      'Virtualization support (VT-x/VT-d) is confirmed',
      'At least two upgrades are proposed, priced and justified',
    ],
    steps: [
      {
        id: 'sp-w1-discovery-s1',
        title: 'Run the hardware discovery',
        description: 'Read the machine, not the brochure.',
        where: 'The server — labels, BIOS screen, management page',
        instruction: 'Walk one server at a time and fill the Server Hardware Discovery Sheet from what the machine itself reports.',
        instructionList: [
          'Identify it: manufacturer, model, serial/service tag.',
          'CPU: model, cores/threads, VT-x/VT-d state, max RAM supported.',
          'Memory: installed vs max, slots used vs total, ECC type.',
          'Storage: bays, RAID controller and levels, installed drives.',
          'Network & management: NICs and speeds, iDRAC/iLO version.',
          'Firmware: BIOS version and boot mode.',
        ],
        files: [
          { name: 'Configuration Guide (PDF) — hardware discovery', purpose: 'where each value lives: BIOS screens, iDRAC/iLO pages, and label locations' },
        ],
        usesForm: 'Server Hardware Discovery Sheet',
        producesDeliverable: '03_Hardware_Discovery.csv',
        whatItMeans: 'Installed-vs-maximum is your upgrade headroom, and the virtualization flags decide whether the hypervisor plan works at all.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w1-discovery-s2',
        title: 'Propose the upgrades',
        description: 'Compatibility-checked, priced, and justified in business terms.',
        instruction: 'From the gaps the discovery exposed, fill the Upgrade Planning Sheet: current → proposed, compatibility, cost, vendor, complexity, risk, and the business need each upgrade serves. Submit for instructor approval.',
        usesForm: 'Upgrade Planning Sheet',
        producesDeliverable: '04_Upgrade_Plan.csv',
        whatItMeans: 'This is IT procurement thinking: an upgrade justified by a requirement survives review; one justified by a bigger number does not.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
    ],
  },
  {
    id: 'sp-w1-architecture',
    role: 'mgmt',
    shared: true,
    week: 1,
    title: 'Draft the architecture',
    objective: 'Design what will run on the hardware: server roles, a four-VM layout, and the storage and backup strategy.',
    frameworks: ['NIST_CSF'],
    deliverables: ['06_Architecture_and_IP_Plan.md'],
    estimatedTime: '25 min',
    difficulty: 2,
    learn: ['Server roles', 'VM layout planning', 'Storage & backup strategy'],
    tools: ['Architecture & IP Plan form'],
    prerequisites: ['The business requirements sheet', 'The hardware discovery sheet'],
    definitionOfDone: [
      'At least four VMs are laid out with a server role each',
      'The Week-2 core builds are marked against the later-phase plans',
      'Storage, backup and monitoring strategies are sketched',
    ],
    steps: [
      {
        id: 'sp-w1-architecture-s1',
        title: 'Lay out the roles and VMs',
        description: 'What runs where, sized by what the discovery said the hardware can carry.',
        instruction: 'In the Architecture & IP Plan form, draft the design the requirements call for: which server roles the business needs, spread across at least four planned VMs.',
        instructionList: [
          'Pick the roles from the requirements: directory, file, application, database, security/monitoring.',
          'Lay out at least four VMs, each carrying a role, sized within the discovered hardware.',
          'Mark which VMs are Week-2 core builds and which are planned for a later phase.',
          'Sketch the storage strategy, where backups land, and the monitoring approach.',
        ],
        usesForm: 'Architecture & IP Plan',
        producesDeliverable: '06_Architecture_and_IP_Plan.md',
        whatItMeans: 'The draft is judged against the requirements sheet — every role should answer a need on it, and every VM must fit the discovered hardware.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },

  // ══ WEEK 2 · Build & Deploy ═══════════════════════════════════════════════
  {
    id: 'sp-w2-rack',
    role: 'mgmt',
    shared: true,
    week: 2,
    title: 'Rack and cable per the plan',
    objective: 'Mount the server at its planned U, wire the patch panel, power it, and record everything as-built.',
    frameworks: ['NIST_CSF'],
    deliverables: ['02_Rack_Plan_and_Cabling.md', '05_Asset_Register.csv'],
    estimatedTime: '45 min',
    difficulty: 3,
    learn: ['24U rack mounting', 'Patch-panel termination', 'Structured cabling', 'Asset tagging'],
    tools: ['Rack Plan & Cabling form', 'Asset Register form', 'Rails and cage nuts', 'Patch panel'],
    prerequisites: ['The Week-1 rack plan', 'Rails, cage nuts, patch leads and labels'],
    definitionOfDone: [
      'The server is mounted at its planned U and the elevation reads Installed',
      'Every cable is labelled and logged at both ends',
      'Hardware assets are tagged in the register',
    ],
    steps: [
      {
        id: 'sp-w2-rack-s1',
        title: 'Mount the server at its planned U',
        description: 'Execute the elevation — and correct the plan where reality disagreed.',
        where: 'The server room — 24U rack',
        instruction: 'Fit the rails and mount the server at the U the plan assigned, then update the elevation rows from Planned to Installed — correcting any position reality forced you to change.',
        instructionList: [
          'Count U positions from the bottom and confirm the planned slot is clear.',
          'Attach the inner rails to the server and the outer rails to the rack posts.',
          'Slide the server in, secure it, and keep the expansion reserve untouched.',
          'Flip the elevation rows to Installed; log any deviation in the Change Log.',
          'Photograph the front and rear of the rack.',
        ],
        usesForm: 'Rack Plan & Cabling Record',
        producesDeliverable: '02_Rack_Plan_and_Cabling.md',
        whatItMeans: 'Planned-versus-installed is the honest record. A deviation you wrote down is engineering; one you hid is drift.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w2-rack-s2',
        title: 'Wire the patch panel and power',
        description: 'Terminate, patch, power — all labelled, all logged.',
        where: 'The rack — patch panel, switch and PDU',
        instruction: 'Terminate the structured cabling to the patch panel, patch each port to the switch with a labelled lead, connect power through the PDU per the plan, and log every cable in the schedule.',
        instructionList: [
          'Terminate each structured cable onto a numbered patch-panel port.',
          'Patch each panel port to a switch port with a colour-coded, labelled lead.',
          'Label both ends of every lead with the same cable ID.',
          'Power each device from its planned PDU outlet.',
          'Fill the cable schedule — both ends, colour, and what each lead carries.',
        ],
        usesForm: 'Rack Plan & Cabling Record',
        producesDeliverable: '02_Rack_Plan_and_Cabling.md',
        whatItMeans: 'A lead you can trace end to end from its label is one the next tech will dare to move. Colour discipline keeps it from a bird\'s nest.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w2-rack-s3',
        title: 'Tag and register the hardware',
        description: 'Begin the master list of everything in the rack.',
        instruction: 'Put an asset tag on every physical item — server, switch, patch panel, PDU — then add a hardware row for each to the Asset Register with its tag, serial and condition.',
        usesForm: 'Asset Register',
        producesDeliverable: '05_Asset_Register.csv',
        whatItMeans: 'You cannot secure, budget for, patch or recover what you do not know you have. The software rows come with the deploy.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
    ],
  },
  {
    id: 'sp-w2-install',
    role: 'mgmt',
    shared: true,
    week: 2,
    title: 'Install the hypervisor and create the VMs',
    objective: 'Install the platform from the Configuration Guide and create the core VMs from the Week-1 layout.',
    frameworks: ['NIST_CSF'],
    deliverables: ['07_Configuration_Management.md'],
    estimatedTime: '45 min',
    difficulty: 3,
    learn: ['Hypervisor installation', 'VM provisioning', 'Configuration baselines'],
    tools: ['Proxmox VE', 'Configuration Management form', 'Configuration Guide (PDF)'],
    prerequisites: ['The server racked and powered', 'The Configuration Guide (PDF)', 'Install media prepared'],
    definitionOfDone: [
      'The hypervisor is installed and reachable',
      'The core VMs exist with the resources the architecture planned',
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
          'Set the hostname and a static management IP — Week 3 formalises the full plan.',
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
        title: 'Create the core VMs and record the baseline',
        description: 'The Week-2 core VMs from the architecture layout, then the paperwork.',
        where: 'The hypervisor web console',
        instruction: 'Create the VMs the architecture marked as Week-2 core, with the planned resources, then record every system\'s baseline in the Configuration Management Record with a screenshot as evidence.',
        instructionList: [
          'Upload the OS install images to the host storage.',
          'Create each core VM with the vCPU, RAM and disk from the architecture layout.',
          'Follow the Configuration Guide for the guest install options.',
          'Add a baseline row per system: values set, guide section, evidence screenshot.',
        ],
        files: [
          { name: 'Configuration Guide (PDF) — VM provisioning', purpose: 'the per-VM create and guest-install steps' },
        ],
        usesForm: 'Configuration Management Record',
        producesDeliverable: '07_Configuration_Management.md',
        whatItMeans: 'Configuration you did not write down is configuration you cannot restore or audit. Record the value, not a description of it.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-w2-deploy',
    role: 'mgmt',
    shared: true,
    week: 2,
    title: 'Deploy the services and register the software',
    objective: 'Stand up the Windows roles and Linux services the architecture calls for, and register every installed program.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['05_Asset_Register.csv', '07_Configuration_Management.md'],
    estimatedTime: '30 min',
    difficulty: 3,
    learn: ['Windows Server roles', 'Linux service deployment', 'Software asset management'],
    tools: ['Asset Register form', 'Configuration Management form', 'Configuration Guide (PDF)'],
    prerequisites: ['The core VMs installed and booting'],
    definitionOfDone: [
      'The Windows roles and Linux services are installed and running',
      'Each system\'s baseline row includes its roles and services',
      'Every installed program is a software asset with a support-end date',
    ],
    steps: [
      {
        id: 'sp-w2-deploy-s1',
        title: 'Deploy the services from the guide',
        description: 'The Windows roles and the Linux services, per the architecture.',
        where: 'The Windows and Linux VMs',
        instruction: 'Install the Windows Server roles and the Linux services your architecture assigned to the core VMs, following the Configuration Guide, and update each baseline row.',
        instructionList: [
          'On the Windows VM, add the roles from the guide and confirm each starts.',
          'On the Linux VM, install the services from the guide and confirm each runs.',
          'Update each system\'s baseline row with the roles and services now on it.',
          'Attach a screenshot of each service running as evidence.',
        ],
        files: [
          { name: 'Configuration Guide (PDF) — Windows roles', purpose: 'the exact role-install steps for the Windows Server VM' },
          { name: 'Configuration Guide (PDF) — Linux services', purpose: 'the exact package and service steps for the Linux VM' },
        ],
        usesForm: 'Configuration Management Record',
        producesDeliverable: '07_Configuration_Management.md',
        whatItMeans: 'A VM with no services is scaffolding. Deploying is what turns the platform into the thing the requirements asked for.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w2-deploy-s2',
        title: 'Register the software you installed',
        description: 'Add every installed program to the asset register.',
        instruction: 'Add a software row per installed program — each OS, the hypervisor, every role and service — with its version and support-end date. That date is the security-relevant column.',
        usesForm: 'Asset Register',
        producesDeliverable: '05_Asset_Register.csv',
        whatItMeans: 'The register now answers a security question as well as a budget one: what do we own, and what is out of support and no longer patched?',
        frameworks: ['NIST_CSF', 'CIS'],
      },
    ],
  },

  // ══ WEEK 3 · Network & Connect ════════════════════════════════════════════
  {
    id: 'sp-w3-topology',
    role: 'mgmt',
    shared: true,
    week: 3,
    title: 'Finalise the topology and IP plan',
    objective: 'Turn the Week-1 draft into the final record: real paths, real addresses, decided in one place.',
    frameworks: ['NIST_CSF'],
    deliverables: ['06_Architecture_and_IP_Plan.md'],
    estimatedTime: '40 min',
    difficulty: 2,
    learn: ['Topology documentation', 'IP address planning', 'Documentation as source of truth'],
    tools: ['Architecture & IP Plan form'],
    prerequisites: ['The Week-1 architecture draft', 'The platform and services deployed'],
    definitionOfDone: [
      'The physical and virtual paths are described as built',
      'Every host has a unique planned address',
      'The topology diagram is drawn and named',
    ],
    steps: [
      {
        id: 'sp-w3-topology-s1',
        title: 'Describe the paths and finalise the addresses',
        description: 'The draft becomes the record: paths as built, every address in one place.',
        instruction: 'Complete the Week-3 sections of the Architecture & IP Plan: the real physical and virtual paths, and an IP row for the host and every VM.',
        instructionList: [
          'Describe the physical path: office drop → patch panel → switch → server NIC.',
          'Describe the virtual layout: the host bridge and which VMs sit on it.',
          'Reserve the address ranges, then give every host its row — IP, gateway, DNS.',
          'Check every address is unique, and draw the topology diagram.',
        ],
        usesForm: 'Architecture & IP Plan',
        producesDeliverable: '06_Architecture_and_IP_Plan.md',
        whatItMeans: 'The IP plan is the single source of truth for addresses. If someone assigns one without opening it, the plan has already failed.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-w3-connect',
    role: 'mgmt',
    shared: true,
    week: 3,
    title: 'Connect the server and prove it reaches',
    objective: 'Apply the plan to every host, connect through the patch panel to the network, and prove the paths work.',
    frameworks: ['NIST_CSF'],
    deliverables: ['06_Architecture_and_IP_Plan.md', '09_Change_Log.csv'],
    estimatedTime: '50 min',
    difficulty: 3,
    learn: ['Applying an IP plan', 'Connectivity verification', 'Logging network changes'],
    tools: ['Architecture & IP Plan form', 'Change Log form', 'Configuration Guide (PDF)'],
    prerequisites: ['The IP plan finalised', 'The patch panel wired in Week 2'],
    definitionOfDone: [
      'Every host holds its planned address',
      'Each host reaches the gateway and each service answers',
      'Every network change has a change-log row',
    ],
    steps: [
      {
        id: 'sp-w3-connect-s1',
        title: 'Apply the plan and connect the uplink',
        description: 'Set each host to its planned address and patch through to the LAN.',
        where: 'Each system, and the rack',
        instruction: 'Set the host and each VM to the address the plan gives it, following the Configuration Guide for the per-OS steps, then confirm the uplink path from patch panel to switch to the office network.',
        instructionList: [
          'Set the hypervisor host to its planned management address.',
          'Set the Windows VM\'s address, gateway and DNS from its plan row.',
          'Set the Linux VM\'s address the same way.',
          'Confirm the uplink lead from the patch panel to the switch is connected and labelled.',
          'Log each address change in the Change Log as you make it.',
        ],
        files: [
          { name: 'Configuration Guide (PDF) — network configuration', purpose: 'the per-OS steps for setting a static address, gateway and DNS' },
        ],
        usesForm: 'Change Log',
        producesDeliverable: '09_Change_Log.csv',
        whatItMeans: 'The plan only counts once reality matches it. Applying addresses from the plan — never inventing them at the console — is the discipline.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w3-connect-s2',
        title: 'Prove the connectivity',
        description: 'Every path the design promises, demonstrated and recorded.',
        instruction: 'From each host, confirm it reaches its gateway and that each deployed service answers from another machine. Note the result of each check in the architecture form so the record shows proven paths.',
        usesForm: 'Architecture & IP Plan',
        producesDeliverable: '06_Architecture_and_IP_Plan.md',
        whatItMeans: 'A topology diagram claims; a connectivity check proves. Recording the checks turns the diagram into evidence.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'Each host reaches its gateway, each service answers from a neighbouring machine, and the results are noted in the architecture record.',
        outputKind: 'result',
      },
    ],
  },

  // ══ WEEK 4 · Secure & DRP ═════════════════════════════════════════════════
  {
    id: 'sp-w4-secure',
    role: 'mgmt',
    shared: true,
    week: 4,
    title: 'Patch every system with a rollback',
    objective: 'Bring every system to a known patch level — snapshot first — and keep the change log current.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['08_Patch_Management.csv', '09_Change_Log.csv'],
    estimatedTime: '40 min',
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
        id: 'sp-w4-secure-s1',
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
        whatItMeans: 'Unpatched systems are the most common way in. The snapshot taken first is what makes patching a live server safe.',
        frameworks: ['NIST_CSF', 'CIS'],
        expectedOutput: 'Each system is at a recorded new patch level, its services confirmed running, with a snapshot available to roll back to.',
        outputKind: 'result',
      },
      {
        id: 'sp-w4-secure-s2',
        title: 'Log the patch run and the changes',
        description: 'The patch log rows, and the change-log rows beside them.',
        instruction: 'Record each system in the Patch Management Log — starting level, schedule, rollback method, what you applied, result — and add a change-log row for the run.',
        usesForm: 'Patch Management Log',
        producesDeliverable: '08_Patch_Management.csv',
        whatItMeans: 'The log answers "are we current, and can we undo a bad update?". Without the level you cannot tell what is still exposed.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
    ],
  },
  {
    id: 'sp-w4-dr',
    role: 'mgmt',
    shared: true,
    week: 4,
    title: 'Disaster recovery and a real restore',
    objective: 'Set recovery targets, write the restore procedure, then prove it with one real restore.',
    frameworks: ['NIST_CSF'],
    deliverables: ['10_DR_Plan.md'],
    estimatedTime: '40 min',
    difficulty: 3,
    learn: ['RTO, RPO and MTTR', 'Restore procedures', 'Testing a backup'],
    tools: ['Disaster Recovery Plan form'],
    prerequisites: ['Snapshots taken during the patch run', 'The configuration record current'],
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
        producesDeliverable: '10_DR_Plan.md',
        whatItMeans: 'RTO is how fast it must return; RPO is how much data you can lose; MTTR is how long a repair takes. Numbers come from the requirements sheet.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-w4-dr-s2',
        title: 'Run one real restore',
        description: 'Delete something, bring it back, and time it.',
        where: 'A test system',
        instruction: 'Delete a test file or restore a snapshot for real, bring it back, and time it. Record the actual recovery time against your target, and confirm the data is intact.',
        usesForm: 'Disaster Recovery Plan',
        producesDeliverable: '10_DR_Plan.md',
        whatItMeans: 'Only a tested restore proves any of the numbers. A plan recorded as "passed" with no measured time is worth nothing.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-w4-handover',
    role: 'mgmt',
    shared: true,
    week: 4,
    title: 'Assemble and hand over the as-built package',
    objective: 'Bring every document together, export it to PDF, and hand over a package the client can run from.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['11_As_Built.md'],
    estimatedTime: '40 min',
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
        title: 'Reconcile and export the package',
        description: 'Every document current, exported, and in order.',
        instruction: 'Walk the handover checklist in the As-Built form: confirm each of the ten documents matches what is actually running, fix any drift, then use Generate PDF on each form to build the package.',
        usesForm: 'As-Built Handover Package',
        producesDeliverable: '11_As_Built.md',
        whatItMeans: 'As-built means as BUILT, including what changed. The forms you kept current all along become one PDF package here.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
      {
        id: 'sp-w4-handover-s2',
        title: 'Write the client summary and hand over',
        description: 'What they have, how they run it, and what you found.',
        instruction: 'Write what the client now has, how they operate it without you, and your findings — including the planned-but-not-built VMs. Date it, get sign-off, and log every handed-over artifact.',
        usesForm: 'As-Built Handover Package',
        producesDeliverable: '11_As_Built.md',
        whatItMeans: 'Lead with what works and what the client can now do, not the commands you typed. This is the handover they keep and operate from.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
    ],
  },
];

/**
 * The focus deep-dives — the only thing that differs between two students.
 *
 * One small task per role per week (~15–20 min). It never blocks anyone and
 * never produces a form of its own: it deepens a section of a record the whole
 * team fills, so the team's paperwork ends up with real expertise behind each
 * part instead of four shallow copies. Authored as a table because every one of
 * them has the same shape, and a table is far easier to keep balanced across
 * four focuses.
 */
const FOCUS: {
  role: string;
  week: number;
  title: string;
  section: string;
  form: string;
  file: string;
  instruction: string;
  meaning: string;
}[] = [
  // ── Networking ───────────────────────────────────────────────────────────
  {
    role: 'net', week: 1, title: 'Deep-dive: the cabling and port plan',
    section: 'the planned cabling', form: 'Rack Plan & Cabling Record', file: '02_Rack_Plan_and_Cabling.md',
    instruction: 'Plan the cabling before it exists: which panel port will carry what, the colour scheme, and how the labels will read — so Week 2 is execution, not invention.',
    meaning: 'A colour scheme decided at the patch panel is decided badly. Planning the ports now is what makes the build traceable later.',
  },
  {
    role: 'net', week: 2, title: 'Deep-dive: bridges and NIC mapping',
    section: 'the virtual-network rows', form: 'Configuration Management Record', file: '07_Configuration_Management.md',
    instruction: 'Record how the virtual network is built: which physical NIC backs which bridge, which VMs attach where, and why that mapping.',
    meaning: 'The bridge-to-NIC mapping is invisible from the rack and undocumented by default — exactly the knowledge that leaves when the builder does.',
  },
  {
    role: 'net', week: 3, title: 'Deep-dive: the addressing rationale',
    section: 'the IP plan', form: 'Architecture & IP Plan', file: '06_Architecture_and_IP_Plan.md',
    instruction: 'Explain the addressing choices: which ranges are reserved for what, why the management address is separated, and where growth goes.',
    meaning: 'The next tech does not need your addresses so much as your reasoning — that is what stops them assigning into a reserved range.',
  },
  {
    role: 'net', week: 4, title: 'Deep-dive: recovering the network path',
    section: 'the restore procedures', form: 'Disaster Recovery Plan', file: '10_DR_Plan.md',
    instruction: 'Write how the network path itself is recovered: a dead switch, a failed uplink, a lost address plan — and what to re-patch in what order.',
    meaning: 'Restoring a server nobody can reach is not a recovery. The path back to it has to be in the plan too.',
  },

  // ── Windows ──────────────────────────────────────────────────────────────
  {
    role: 'win', week: 1, title: 'Deep-dive: what the Windows VM will need',
    section: 'the upgrade rows', form: 'Upgrade Planning Sheet', file: '04_Upgrade_Plan.csv',
    instruction: 'Work the discovery findings from the Windows side: does the hardware carry the planned Windows VM and its roles, and which upgrade row exists because of it?',
    meaning: 'Sizing a Windows Server VM starts from what the hardware can actually give it — and its licence is a cost row like any other.',
  },
  {
    role: 'win', week: 2, title: 'Deep-dive: the Windows Server baseline',
    section: 'the Windows VM row', form: 'Configuration Management Record', file: '07_Configuration_Management.md',
    instruction: 'Expand the Windows VM\'s row: each installed role and why, the sizing you chose, and the settings you would need to rebuild it to spec.',
    meaning: 'Recording the value makes a rebuild possible. Recording the reasoning makes the next sizing decision a judgement rather than a guess.',
  },
  {
    role: 'win', week: 3, title: 'Deep-dive: Windows network settings',
    section: 'the Windows plan row', form: 'Architecture & IP Plan', file: '06_Architecture_and_IP_Plan.md',
    instruction: 'Document the Windows VM\'s network configuration in depth: the static address, DNS order, and how you confirmed each service answers by name.',
    meaning: 'Most "server down" calls on a Windows box are name resolution. The record of what DNS should be is what makes that a five-minute fix.',
  },
  {
    role: 'win', week: 4, title: 'Deep-dive: Windows patching and restore',
    section: 'the Windows restore procedure', form: 'Disaster Recovery Plan', file: '10_DR_Plan.md',
    instruction: 'Write the Windows recovery in full: how its updates roll back, where its restore point or backup lives, and the exact steps to bring its roles back.',
    meaning: 'A restore procedure is only real if a person who did not build the system can follow it under pressure.',
  },

  // ── Linux ────────────────────────────────────────────────────────────────
  {
    role: 'lnx', week: 1, title: 'Deep-dive: firmware and virtualization flags',
    section: 'the firmware rows', form: 'Server Hardware Discovery Sheet', file: '03_Hardware_Discovery.csv',
    instruction: 'Go deeper on the firmware audit: BIOS version and boot mode, VT-x/VT-d state, and anything that must change in BIOS before the hypervisor will install.',
    meaning: 'A disabled VT-x surfaces as a Week-2 mystery failure. Ten minutes in the BIOS now is an hour of confusion saved later.',
  },
  {
    role: 'lnx', week: 2, title: 'Deep-dive: the hypervisor and Linux baseline',
    section: 'the host and Linux VM rows', form: 'Configuration Management Record', file: '07_Configuration_Management.md',
    instruction: 'Expand the hypervisor and Linux VM rows: storage layout, the services installed and why, and the values you would need to rebuild both to spec.',
    meaning: 'The hypervisor is the one system everything else stands on. Its baseline is the most expensive record to be missing.',
  },
  {
    role: 'lnx', week: 3, title: 'Deep-dive: Linux network configuration',
    section: 'the Linux plan row', form: 'Architecture & IP Plan', file: '06_Architecture_and_IP_Plan.md',
    instruction: 'Document the Linux side of the network in depth: how the host bridge is configured, the VM\'s interface settings, and how you proved each service answers.',
    meaning: 'On Linux the network config lives in files nobody opens until it breaks. Writing down which file holds what is the deep-dive.',
  },
  {
    role: 'lnx', week: 4, title: 'Deep-dive: snapshots and the Linux restore',
    section: 'the Linux restore procedure', form: 'Disaster Recovery Plan', file: '10_DR_Plan.md',
    instruction: 'Write the Linux recovery in full: how snapshots are taken and kept, how a service is restored from one, and how you verify the data afterwards.',
    meaning: '"VM snapshot" is a plan only if you know how to roll it back and how long you have before it is cleaned up.',
  },

  // ── Management ───────────────────────────────────────────────────────────
  {
    role: 'mgmt', week: 1, title: 'Deep-dive: compliance and SLA mapping',
    section: 'the requirements', form: 'Business Requirements Sheet', file: '01_Business_Requirements.md',
    instruction: 'Map each requirement to what it forces later: what the compliance rule demands of retention and access, and what the SLA number implies for backups and recovery.',
    meaning: 'A requirement is only real once you can say which later decision it changes. This mapping is what the DR numbers get checked against.',
  },
  {
    role: 'mgmt', week: 2, title: 'Deep-dive: versioning the record set',
    section: 'the document versions', form: 'Configuration Management Record', file: '07_Configuration_Management.md',
    instruction: 'Set how the records are versioned: what bumps a version, who does it, and how a reader tells whether they hold the current copy.',
    meaning: 'Documentation without a version is documentation nobody can trust — there is no way to tell current from stale.',
  },
  {
    role: 'mgmt', week: 3, title: 'Deep-dive: change control on the network work',
    section: 'the change rows', form: 'Change Log', file: '09_Change_Log.csv',
    instruction: 'Audit this week\'s network changes as a record: every address change logged before it was made, a rollback on each, corrections by new rows only.',
    meaning: 'A change log edited after the fact is a story. Append-only is what makes it evidence.',
  },
  {
    role: 'mgmt', week: 4, title: 'Deep-dive: the numbers and the handover',
    section: 'the handover checklist', form: 'As-Built Handover Package', file: '11_As_Built.md',
    instruction: 'Defend the RTO, RPO and MTTR numbers against the requirements sheet, then drive the package: every document current, exported and in order, readable by a stranger.',
    meaning: 'The package is the deliverable the client keeps. Assembling it is a job, not a formality at the end of the last day.',
  },
];

const focusTasks: Task[] = FOCUS.map((f) => ({
  id: `sp-w${f.week}-${f.role}`,
  role: f.role,
  week: f.week,
  title: f.title,
  objective: `Your focus this week — go deeper on ${f.section} in the ${f.form}.`,
  frameworks: ['NIST_CSF'],
  deliverables: [f.file],
  estimatedTime: '20 min',
  difficulty: 2 as const,
  learn: ['Documenting to a professional standard', 'Depth over coverage'],
  tools: [f.form],
  definitionOfDone: [`${f.section} in the ${f.form} goes deeper than the shared pass`],
  steps: [
    {
      id: `sp-w${f.week}-${f.role}-s1`,
      title: f.title.replace('Deep-dive: ', 'Document '),
      description: `Your focus area, in ${f.section}.`,
      instruction: f.instruction,
      usesForm: f.form,
      producesDeliverable: f.file,
      whatItMeans: f.meaning,
      isEvidenceStep: true,
      frameworks: ['NIST_CSF'],
    },
  ],
}));

const tasks: Task[] = [...sharedTasks, ...focusTasks];

export const SERVER_PLUS: Course = {
  id: 'server-plus',
  title: 'Server+ Build & Handover',
  slug: 'server-plus',
  vendor: 'CompTIA',
  certification: 'Server+',
  level: 'associate',
  audience: 'Plan, build and document your own rack-mount server in four phases — everyone builds the same, each focus documents its part deeper.',
  description:
    'Run a real server engagement in about two hours a week. Plan like a sysadmin — business requirements, a 24U rack plan, a hardware audit, an upgrade plan — then build and deploy the platform, network and connect it, and secure it with a proven restore and a PDF handover.',
  roles,
  weeks,
  gates,
  tasks,
  noGatekeeping: true,
  sharedTrack: true,
  lifecyclePath: [
    { label: 'Plan', detail: 'Profile the business, plan the 24U rack, and set the acceptance criteria.' },
    { label: 'Analyze', detail: 'Audit what the hardware can do and plan the justified upgrades.' },
    { label: 'Build & Rack', detail: 'Mount and cable the server exactly where the plan says.' },
    { label: 'Deploy', detail: 'Install the hypervisor and stand up the Windows and Linux services.' },
    { label: 'Connect', detail: 'Apply the IP plan, connect the uplink, and prove every path.' },
    { label: 'Secure & DRP', detail: 'Patch with a rollback, set RTO/RPO/MTTR, and prove a restore.' },
    { label: 'Hand over', detail: 'An as-built PDF package the client can run the server from.' },
  ],
  isSeed: true,
  version: 5,
  teamCount: 16,
  teamCapacity: 4,
};

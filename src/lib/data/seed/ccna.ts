import type { Course, RoleDef, Task, WeekDef } from '../../types';
import { COMPANY, SITES, WAN, vlan } from '../../ccnaTopology';
import { CAPABILITIES, PATHS } from '../../docs/ccnaKit';

/**
 * CCNA capstone — "Run the Network".
 *
 * NOT a large Packet Tracer exercise. The subject is the JOB of a network team:
 * discover, design, build, prove, secure, operate, watch, automate, hand over —
 * with CCNA technology (VLANs, trunks, STP, EtherChannel, OSPF, NAT, ACLs, DHCP,
 * WLAN) inside that workflow rather than as a list of features to configure.
 *
 * SHAPE. Week 0 is acquisition. Weeks 1-4 are the graded capstone: a student who
 * finishes them has designed, built, verified, secured and documented a two-site
 * network. Weeks 5-8 are `advanced: true` — the professional workflow on top, and
 * never required to pass, so a team without the kit, the tools or the time still
 * completes the course. `isGradedWeek()` in `course-helpers.ts` is what enforces
 * that; Server+ Weeks 5-6 are the precedent.
 *
 * WEEK 0 DECIDES HOW THE REST IS BUILT. What the team's equipment supports is
 * recorded before anything is designed, because it is what the later procedures
 * branch on: a switch that cannot route means inter-VLAN routing happens on a
 * router instead. That is why Week 0 is the one week authored at full depth here,
 * and why its commands are the `show` commands that PROVE a capability rather
 * than configure anything.
 *
 * ONE SHARED BUILD, FOUR FOCUS ROLES (`sharedTrack: true`). Everyone configures
 * and troubleshoots; the focus decides which record you lead and what you review
 * on somebody else's change. Nobody is blocked waiting for a teammate, and no
 * student ends the course having only written documentation.
 *
 * Addressing, VLANs, devices and the policy all come from `ccnaTopology.ts`. Not
 * one address is typed in this file.
 */

const ROLES: RoleDef[] = [
  {
    id: 'arch',
    name: 'Architecture',
    mission: 'Owns the requirements, the design and the addressing plan. Reviews every change for design fit.',
    color: '#0369a1',
    icon: 'Layers',
    label: '📐 Architecture',
  },
  {
    id: 'impl',
    name: 'Implementation',
    mission: 'Owns switching, interfaces, wireless and the device build. Reviews the configuration itself.',
    color: '#15803d',
    icon: 'Network',
    label: '🔌 Implementation',
  },
  {
    id: 'ops',
    name: 'Operations',
    mission: 'Owns monitoring, backups, tickets and change records. Reviews the rollback on every change.',
    color: '#b45309',
    icon: 'Activity',
    label: '📡 Operations',
  },
  {
    id: 'auto',
    name: 'Automation & Security',
    mission: 'Owns ACL policy, the management plane, Git and automation. Reviews the validation evidence.',
    color: '#7c3aed',
    icon: 'Code',
    label: '🤖 Automation & Security',
  },
];

const WEEKS: WeekDef[] = [
  {
    number: 0,
    title: 'Acquisition & Kit',
    theme: 'What you have, and what it can do',
    objective:
      'Declare how this build runs, register every device, and prove each capability with the command output that says so — because what your kit supports decides how every later week is built.',
    runs: 'Week 0',
    setup: true,
    stage: 0,
    phase: 'Acquisition',
    difficulty: 1,
    objectives: [
      { id: 'decide-how-this-build-runs', label: 'Decide how this build runs', tasks: ['ccna-w0-path'] },
      { id: 'register-the-kit-and-prove-what-it-can-do', label: 'Register the kit and prove what it can do', tasks: ['ccna-w0-register'] },
    ],
    milestone:
      'The path is declared, every device is a row with its software version, and each capability is answered Yes or No with the output that proves it.',
  },
  {
    number: 1,
    title: 'Connect',
    theme: 'Cable it, address it, reach it',
    objective:
      'Discover what the business needs, design the shape of the network, then bring the first switches up: cabled, named, addressed, reachable, and documented.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Connect',
    difficulty: 2,
    objectives: [
      { id: 'discover-before-you-design', label: 'Discover before you design', tasks: ['ccna-w1-discover'] },
      { id: 'design-the-shape', label: 'Design the shape', tasks: ['ccna-w1-design'] },
      { id: 'bring-the-first-switches-up', label: 'Bring the first switches up', tasks: ['ccna-w1-bringup'] },
    ],
    milestone:
      'Requirements and a high-level design are written, the first switches answer on the management VLAN, and every interface you touched is in the build log.',
  },
  {
    number: 2,
    title: 'Segment',
    theme: 'One network becomes departments',
    objective:
      'Turn the flat office network into VLANs with trunks between switches, hand out addresses, and route between the departments the way your own kit allows.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Segment',
    difficulty: 3,
    objectives: [
      { id: 'cut-the-network-into-departments', label: 'Cut the network into departments', tasks: ['ccna-w2-vlans'] },
      { id: 'route-between-the-departments', label: 'Route between the departments', tasks: ['ccna-w2-route'] },
      { id: 'survive-a-cable-being-pulled', label: 'Survive a cable being pulled', tasks: ['ccna-w2-resilience'] },
    ],
    milestone:
      'Every department is its own VLAN, a trunk carries them between switches, a PC gets an address from DHCP, and the test matrix shows what reaches what.',
  },
  {
    number: 3,
    title: 'Route',
    theme: 'A second building, and the internet',
    objective:
      'Join the branch to headquarters, learn routes dynamically rather than by hand, and give the whole company one way out to the internet.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Route',
    difficulty: 3,
    objectives: [
      { id: 'join-the-second-building', label: 'Join the second building', tasks: ['ccna-w3-wan'] },
      { id: 'give-the-site-one-way-out-to-the-internet', label: 'Give the site one way out to the internet', tasks: ['ccna-w3-internet'] },
    ],
    milestone:
      'The two sites are adjacent, each learns the other’s networks without a static route, and a branch PC reaches the internet through one public address.',
  },
  {
    number: 4,
    title: 'Protect',
    theme: 'The business rules, enforced',
    objective:
      'Turn the policy into access lists, harden every device’s management plane, put the WLANs on the air, and prove the traffic that must NOT pass does not pass.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Protect',
    difficulty: 4,
    objectives: [
      { id: 'turn-the-policy-into-access-lists', label: 'Turn the policy into access lists', tasks: ['ccna-w4-policy'] },
      { id: 'harden-the-management-plane', label: 'Harden the management plane', tasks: ['ccna-w4-harden'] },
      { id: 'put-the-wlans-on-the-air', label: 'Put the WLANs on the air', tasks: ['ccna-w4-wireless'] },
    ],
    milestone:
      'Guest cannot reach the LAN, only the network team reaches the management VLAN, every device takes SSH and refuses telnet, and the blocked tests are evidence.',
  },
  {
    number: 5,
    title: 'Operate',
    theme: 'Run it, do not just build it',
    objective:
      'Put the network under management: a source of truth in NetBox, configurations backed up and versioned, and every change requested, reviewed by a teammate and reversible.',
    runs: 'Week 5',
    advanced: true,
    phase: 'Operate',
    difficulty: 4,
    objectives: [
      { id: 'build-a-source-of-truth-not-a-spreadsheet', label: 'Build a source of truth, not a spreadsheet', tasks: ['ccna-w5-sot'] },
      { id: 'back-it-up-then-change-it-properly', label: 'Back it up, then change it properly', tasks: ['ccna-w5-change'] },
    ],
    milestone:
      'NetBox holds the sites, devices, VLANs and prefixes; every configuration is backed up to Git; and one change has been through review, implementation and validation.',
  },
  {
    number: 6,
    title: 'Observe',
    theme: 'Know before the phone rings',
    objective:
      'Stand up a small NOC — polling, logs, latency and dashboards — then work a real ticket down the layers instead of guessing.',
    runs: 'Week 6',
    advanced: true,
    phase: 'Observe',
    difficulty: 4,
    objectives: [
      { id: 'build-a-small-noc', label: 'Build a small NOC', tasks: ['ccna-w6-noc'] },
      { id: 'work-a-ticket-not-a-hunch', label: 'Work a ticket, not a hunch', tasks: ['ccna-w6-ticket'] },
    ],
    milestone:
      'Every device is polled and graphed, logs land in one place, latency is tracked, and a ticket has been worked from symptom to root cause with the evidence kept.',
  },
  {
    number: 7,
    title: 'Automate',
    theme: 'Stop typing the same thing',
    objective:
      'Read the network through its APIs, describe it as data, and let Ansible configure from the source of truth rather than from your memory.',
    runs: 'Week 7',
    advanced: true,
    phase: 'Automate',
    difficulty: 4,
    objectives: [
      { id: 'describe-the-network-as-data', label: 'Describe the network as data', tasks: ['ccna-w7-data'] },
      { id: 'configure-from-the-source-of-truth', label: 'Configure from the source of truth', tasks: ['ccna-w7-ansible'] },
    ],
    milestone:
      'A playbook configures a VLAN on every access switch from data held in NetBox, and running it twice changes nothing the second time.',
  },
  {
    number: 8,
    title: 'Engineer',
    theme: 'Something breaks. Then you hand it over.',
    objective:
      'Work an injected failure as an incident, find the root cause, fix it under change control, prove the fix, and hand the network to whoever runs it next.',
    runs: 'Week 8',
    advanced: true,
    phase: 'Engineer',
    difficulty: 4,
    objectives: [
      { id: 'work-an-incident-properly', label: 'Work an incident properly', tasks: ['ccna-w8-incident'] },
      { id: 'hand-the-network-over', label: 'Hand the network over', tasks: ['ccna-w8-handover'] },
    ],
    milestone:
      'The incident is documented from ticket to prevention, the fix went through a reviewed change, and the as-built handover would let a stranger run this network on Monday.',
  },
];

/** A thin skeleton step: says WHAT, names where, and states what "done" looks
 *  like. The commands, samples and guide procedures land in the depth rounds —
 *  which is why these carry no `commands` array rather than a half-filled one. */
const outline = (
  id: string,
  title: string,
  where: string,
  instruction: string,
  outcome: string,
  /** `whatItMeans` is REQUIRED here, not optional as it is on `Step`: it is the
   *  one sentence saying why a student should care, and a skeleton step without
   *  it is a title with a checkbox. */
  extra: Partial<Task['steps'][number]> & { whatItMeans: string }
): Task['steps'][number] => ({
  id,
  title,
  // The subtitle is the outcome, said short. A skeleton step with no description
  // renders as a bare title, which reads like something is missing.
  description: outcome.length > 110 ? `${outcome.slice(0, 107).trimEnd()}…` : outcome,
  where,
  instruction,
  expectedOutput: outcome,
  outputKind: 'result',
  frameworks: ['CCNA'],
  ...extra,
});

const TASKS: Task[] = [
  // ── Week 0 — Acquisition ──────────────────────────────────────────────────
  {
    id: 'ccna-w0-path',
    role: 'arch',
    shared: true,
    week: 0,
    title: 'Decide how this build runs',
    objective:
      'Choose emulated or physical, get the tool or the cable working, and reach a device prompt — the one thing Week 1 cannot start without.',
    frameworks: ['CCNA'],
    deliverables: ['01_Kit_and_Capability_Register.md'],
    estimatedTime: '30 min',
    difficulty: 1,
    learn: ['Lab platforms', 'Console access', 'What emulation can and cannot teach'],
    tools: ['Packet Tracer / CML / GNS3 / containerlab', 'Console cable', 'A terminal program'],
    definitionOfDone: [
      'The path is recorded in the Kit & Capability Register',
      'A device prompt is open in front of you',
      'The machine you work from is named in the register',
    ],
    steps: [
      outline(
        'ccna-w0-path-s1',
        'Pick the path, and know what it costs you',
        'Anywhere — this is a team decision',
        `Decide as a team: ${PATHS.emulated.label} or ${PATHS.physical.label}. Emulation gives you every device the design calls for; hardware gives you cabling, optics, PoE and real interface counters. Both are first-class here — record which one you are on.`,
        'The team has agreed one path and the reason, and it is written in the register.',
        {
          usesForm: 'Kit & Capability Register',
          instructionList: [
            `${PATHS.emulated.label}: ${PATHS.emulated.strength}`,
            `${PATHS.emulated.label} — the limit: ${PATHS.emulated.limit}`,
            `${PATHS.physical.label}: ${PATHS.physical.strength}`,
            `${PATHS.physical.label} — the limit: ${PATHS.physical.limit}`,
          ],
          whatItMeans:
            'Neither path is the lesser one. Emulation cannot teach you what a bad patch lead feels like; hardware cannot give you eight routers on a laptop.',
        }
      ),
      outline(
        'ccna-w0-path-s2',
        'Get to a prompt',
        'Your own machine — emulator or console cable',
        'Open the emulator and place one switch, or plug the console cable into a real one and open your terminal program. You are done when a device prompt answers you.',
        'A device prompt is in front of you and Enter produces another prompt rather than nothing.',
        {
          fixes: [
            { symptom: 'No prompt over the console cable?', fix: 'Check the speed is 9600 8N1 and that you picked the right COM port — the cable’s driver renames it on every machine.' },
            { symptom: 'The emulator will not start the device?', fix: 'It is almost always memory. Close everything else, or start with one switch rather than the whole topology.' },
          ],
          whatItMeans:
            'Everything else in this course assumes you can type at a device. Prove it now, not in Week 1 when something else is also broken.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w0-register',
    role: 'arch',
    shared: true,
    week: 0,
    title: 'Register the kit and prove what it can do',
    objective:
      'One row per device with its real software version, then each capability answered Yes or No with the command output that proves it — the document every later week reads.',
    frameworks: ['CCNA'],
    deliverables: ['01_Kit_and_Capability_Register.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['show version', 'Reading a feature set', 'Capability vs datasheet', 'Inventory discipline'],
    tools: ['show version', 'show vlan brief', 'show interfaces trunk', 'show ip route', 'show power inline'],
    prerequisites: ['A device prompt, from the previous task'],
    definitionOfDone: [
      'Every device is a row: name, what it is, model, software version, ports',
      'At least eight capabilities answered Yes or No',
      'Every Yes carries the line of output that proves it',
      'The gaps are written down, with what you will do instead',
    ],
    handoff: [
      { to: 'impl', artifact: '01_Kit_and_Capability_Register.md', note: 'Which procedure Week 2 takes — SVIs or router-on-a-stick — is decided by this register.' },
    ],
    steps: [
      {
        id: 'ccna-w0-register-s1',
        title: 'Read what the device really is',
        description: 'The model and the image, from the device rather than the sticker.',
        where: 'Each device — console or SSH',
        instruction:
          'Run these on every device you have and copy the answers into the register. The sticker tells you what was sold; the image decides what it can do.',
        usesForm: 'Kit & Capability Register',
        commands: [
          {
            cmd: 'show version',
            explain: 'Model, software version and feature set. The version is why a feature is missing.',
            sample:
              'Cisco IOS Software, C2960X Software (C2960X-UNIVERSALK9-M), Version 15.2(7)E3\nModel number: WS-C2960X-24TS-L\nSystem image file is "flash:/c2960x-universalk9-mz.152-7.E3.bin"',
          },
          {
            cmd: 'show interfaces status',
            explain: 'Every port, its speed, and whether an SFP uplink exists. This is your usable port count.',
            sample:
              'Port      Name     Status       Vlan    Duplex  Speed Type\nGi1/0/1            connected    1       a-full  a-100 10/100/1000BaseTX\nGi1/0/25           notconnect   1         auto   auto unknown  (SFP)',
          },
        ],
        whatItMeans:
          'Two switches with the same model number can differ by one licence line. The register records what is in front of you.',
        frameworks: ['CCNA'],
        expectedOutput:
          'Switch# show version\nCisco IOS Software, C2960X Software (C2960X-UNIVERSALK9-M), Version 15.2(7)E3\nModel number: WS-C2960X-24TS-L\n\nSwitch# show interfaces status\nPort      Name     Status       Vlan    Duplex  Speed Type\nGi1/0/1            connected    1       a-full  a-100 10/100/1000BaseTX\nGi1/0/25           notconnect   1         auto   auto unknown  (SFP)',
        outputKind: 'console',
        verify: ['Model number', 'Version'],
        outputHighlights: [
          { text: 'Version 15.2(7)E3', label: 'The image — this is what decides which features exist.' },
          { text: '(SFP)', label: 'An SFP uplink port. Present but unpopulated still counts as fibre-capable.' },
        ],
      },
      {
        id: 'ccna-w0-register-s2',
        title: 'Prove each capability, one command at a time',
        description: 'Yes or No, with the line that says so.',
        where: 'Each device — console or SSH',
        instruction:
          'Work down the capability list in the register. Run the command, read the tell, record the answer, and paste the line. A "Yes" with no output beside it is an opinion.',
        usesForm: 'Kit & Capability Register',
        instructionList: CAPABILITIES.slice(0, 6).map((cap) => `${cap.label} — run \`${cap.proof.cmd}\`: ${cap.proof.tell}`),
        commands: [
          {
            cmd: 'show ip route',
            explain: 'The single most useful question: can this switch route at all? A table means yes.',
            sample:
              'Codes: L - local, C - connected, S - static\n\n      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks\nC        10.50.99.0/24 is directly connected, Vlan99',
          },
          {
            cmd: 'show etherchannel summary',
            explain: 'Whether two links can be bonded. Recognised at all is the pass; groups come later.',
            sample: 'Number of channel-groups in use: 0\nNumber of aggregators:           0',
          },
          {
            cmd: 'show power inline',
            explain: 'PoE budget per port — what the phones and the access point will run on.',
            sample: 'Module   Available     Used     Remaining\n1           370.0     0.0        370.0',
          },
        ],
        whatItMeans:
          'An "Invalid input detected" is a real answer: it means No, and it tells you which alternate procedure your build takes.',
        frameworks: ['CCNA'],
        expectedOutput:
          'Every capability row has Yes or No, the device it was tested on, and a line of output. Some will be No — that is information, not failure.',
        outputKind: 'result',
        fixes: [
          { symptom: '"Invalid input detected" on a show command?', fix: 'That is your No. Record it, and read what the course does instead — every capability has an alternative.' },
          { symptom: 'The command works but the table is empty?', fix: 'Empty is a pass. You are asking whether the device CAN, not whether it already does.' },
        ],
      },
      outline(
        'ccna-w0-register-s3',
        'Write down the gaps, and what one purchase would unlock',
        'The register — the gaps section',
        'One line per No: what you will do instead. Then, if you were buying one thing, what and why — capability first, model second.',
        'The gaps section names every No and its alternative, and the next purchase is a capability rather than a shopping list.',
        {
          usesForm: 'Kit & Capability Register',
          producesDeliverable: '01_Kit_and_Capability_Register.md',
          whatItMeans:
            'This paragraph is the one Week 2 and Week 4 follow. A team that wrote it honestly never hits a wall mid-build.',
        }
      ),
    ],
  },

  // ── Week 1 — Connect ──────────────────────────────────────────────────────
  {
    id: 'ccna-w1-discover',
    role: 'arch',
    shared: true,
    week: 1,
    title: 'Discover before you design',
    objective: `Interview the business and survey the building: who needs what, what cannot go down, and what is already there.`,
    frameworks: ['CCNA', 'ITIL'],
    deliverables: ['02_Requirements_and_Site_Survey.md'],
    estimatedTime: '45 min',
    difficulty: 2,
    learn: ['Requirements gathering', 'Site survey', 'Availability requirements', 'Constraints'],
    definitionOfDone: [
      'Three or more departments recorded with what they need',
      'The availability requirement is written in the business’s own words',
      'The survey says what exists today and what is wrong with it',
    ],
    steps: [
      outline(
        'ccna-w1-discover-s1',
        'Ask the business what it needs',
        'With your instructor, or from the scenario',
        `${COMPANY.name}: ${COMPANY.driver} Record the departments, what each one does on the network, and what cannot go down.`,
        'The requirements form names every department, its people and its needs — and one sentence on what downtime costs.',
        {
          usesForm: 'Requirements & Site Survey',
          whatItMeans:
            'A requirement you did not write down is a requirement somebody will dispute in Week 8.',
        }
      ),
      outline(
        'ccna-w1-discover-s2',
        'Walk the building',
        'Both sites — on foot, or from the site notes',
        `Record where the equipment lives, how many drops there are, and where the circuit comes in. ${SITES[0].rooms}; the branch has ${SITES[1].rooms.toLowerCase()}.`,
        'The survey records the rooms, the drops, the cable runs and the ISP handoff.',
        {
          usesForm: 'Requirements & Site Survey', producesDeliverable: '02_Requirements_and_Site_Survey.md',
          whatItMeans:
            'The building decides half the design: cable distance, where power is, and where a switch can actually live.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w1-design',
    role: 'arch',
    shared: true,
    week: 1,
    title: 'Design the shape',
    objective:
      'Turn the requirements into a high-level design: the sites, the link between them, where routing happens, and which boundaries exist.',
    frameworks: ['CCNA'],
    deliverables: ['03_High_Level_Design.md'],
    estimatedTime: '45 min',
    difficulty: 3,
    learn: ['Hierarchical design', 'Where to route', 'Security boundaries', 'Design trade-offs'],
    prerequisites: ['The requirements form', 'The Kit & Capability Register — it decides what you can design'],
    definitionOfDone: [
      'Four or more decisions, each traced to a requirement',
      'Each decision says what was rejected and why',
      'Each decision says whether your kit supports it',
    ],
    steps: [
      outline(
        'ccna-w1-design-s1',
        'Decide where routing happens',
        'On paper first',
        'If the register says you have a switch that routes, the core routes between VLANs. If it does not, the router does, over one trunk. Write the decision down with the reason.',
        'The design states where inter-VLAN routing happens and which capability answer made that the choice.',
        {
          usesForm: 'High-Level Design',
          whatItMeans:
            'This is the decision your Week-0 register already made for you. Writing it down is what makes it reviewable.',
        }
      ),
      outline(
        'ccna-w1-design-s2',
        'Name the boundaries',
        'On paper first',
        'Say what must not reach what — guest from corporate, users from management, cameras from servers — in the business’s words, before any ACL exists.',
        'Every boundary is a sentence a manager would agree with, and Week 4 turns each one into an access list.',
        {
          usesForm: 'High-Level Design', producesDeliverable: '03_High_Level_Design.md',
          whatItMeans:
            'A boundary stated in business words survives a change of staff. One stated as an ACL number does not.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w1-bringup',
    role: 'impl',
    shared: true,
    week: 1,
    title: 'Bring the first switches up',
    objective:
      'Cable, name, address and reach the first switches: a management address, a working uplink, and an interface list that matches the plan.',
    frameworks: ['CCNA'],
    deliverables: ['05_Build_and_Configuration_Log.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['Hostnames', 'Management addressing', 'Interface status', 'Speed and duplex', 'Saving configuration'],
    definitionOfDone: [
      `Each switch answers on the ${vlan(99).name} VLAN`,
      'Every interface you touched is in the build log with what proved it',
      'The configuration is saved on every device',
    ],
    steps: [
      outline(
        'ccna-w1-bringup-s1',
        'Name it, address it, save it',
        'Each switch — console',
        `Set the hostname from the plan, give the switch its management address in ${vlan(99).name}, and save. A device you cannot reach is a device you will be walking to all term.`,
        'Each switch answers a ping on its management address, and `show running-config` survives a reload.',
        {
          usesForm: 'Build & Configuration Log',
          whatItMeans:
            'A switch you cannot reach remotely is a switch you will be walking to for the rest of the course.',
        }
      ),
      outline(
        'ccna-w1-bringup-s2',
        'Read the interfaces like an engineer',
        'Each switch — console or SSH',
        'Check every port you cabled: up, the speed you expected, no errors climbing. A link that is up at 100 Mbps when you expected 1 Gbps is a cable problem you want to find now.',
        'Interface status matches the plan, and the error counters are clean on every link you rely on.',
        {
          usesForm: 'Build & Configuration Log', producesDeliverable: '05_Build_and_Configuration_Log.md',
          whatItMeans:
            'Interface counters are the only place a bad cable admits what it is doing. Read them before you trust the link.',
        }
      ),
    ],
  },

  // ── Week 2 — Segment ──────────────────────────────────────────────────────
  {
    id: 'ccna-w2-vlans',
    role: 'impl',
    shared: true,
    week: 2,
    title: 'Cut the network into departments',
    objective:
      'Create the VLANs from the plan, put the access ports in them, and trunk the switches together so one cable carries all of it.',
    frameworks: ['CCNA'],
    deliverables: ['04_Low_Level_Design_and_IP_Plan.md', '05_Build_and_Configuration_Log.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['VLANs', 'Access ports', '802.1Q trunks', 'Native VLAN', 'CDP and LLDP'],
    definitionOfDone: [
      'Every VLAN in the plan exists on every switch that needs it',
      'The trunk carries them, with the native VLAN stated',
      'A PC in one VLAN cannot see a PC in another — yet',
    ],
    steps: [
      outline(
        'ccna-w2-vlans-s1',
        'Write the plan down before you configure it',
        'The Low-Level Design',
        'One row per VLAN: id, name, purpose, prefix, gateway, DHCP range. Then the ports. Configuring first and documenting later is how the two end up different.',
        'The LLD holds every VLAN with its prefix and gateway, and every port range is assigned.',
        {
          usesForm: 'Low-Level Design & IP Plan', producesDeliverable: '04_Low_Level_Design_and_IP_Plan.md',
          whatItMeans:
            'Configure first and document later, and the two end up different — usually on the port nobody checked.',
        }
      ),
      outline(
        'ccna-w2-vlans-s2',
        'Create the VLANs and trunk the switches',
        'Each switch — console or SSH',
        'Create each VLAN, put the access ports where the plan says, then make the switch-to-switch link a trunk and state the native VLAN explicitly on both ends.',
        'The VLAN table matches the plan on every switch, and the trunk shows the expected VLAN list on both sides.',
        {
          usesForm: 'Build & Configuration Log',
          whatItMeans:
            'A native VLAN that differs on the two ends of a trunk is the classic fault. Stating it explicitly is the fix.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w2-route',
    role: 'impl',
    shared: true,
    week: 2,
    title: 'Route between the departments',
    objective:
      'Give every VLAN a gateway and let the departments reach each other — on the switch if your kit routes, on a router over one trunk if it does not.',
    frameworks: ['CCNA'],
    deliverables: ['05_Build_and_Configuration_Log.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['SVIs', 'Router-on-a-stick', 'Subinterfaces', 'ip routing', 'Default gateways'],
    prerequisites: ['The Kit & Capability Register — it decides which of the two procedures you follow'],
    definitionOfDone: [
      'Every VLAN has a gateway that answers a ping',
      'A PC in one VLAN reaches a server in another',
      'The route table shows one connected route per VLAN',
    ],
    steps: [
      outline(
        'ccna-w2-route-s1',
        'Give every VLAN a gateway',
        'The routing device — your core switch or your router',
        'Your register decided this: an SVI per VLAN on a switch that routes, or a subinterface per VLAN on a router over one trunk. Same outcome, different device.',
        'Each gateway address answers a ping from a host in its own VLAN.',
        {
          usesForm: 'Build & Configuration Log',
          whatItMeans:
            'Same requirement, two procedures. Which one you follow was decided in Week 0 by what your kit can do.',
        }
      ),
      outline(
        'ccna-w2-route-s2',
        'Hand out addresses, then prove it end to end',
        'The DHCP device, then a client',
        'Serve DHCP where the plan says — on the network device or relayed to the server — then release and renew on a client and watch it get the right address, mask and gateway.',
        'A client gets an address from the right pool with the right gateway, and reaches a host in another VLAN.',
        {
          usesForm: 'Validation & Test Matrix', producesDeliverable: '06_Validation_and_Test_Matrix.md',
          whatItMeans:
            'DHCP is where a design meets a real client. A wrong gateway in the pool looks exactly like a routing fault.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w2-resilience',
    role: 'ops',
    shared: true,
    week: 2,
    title: 'Survive a cable being pulled',
    objective:
      'Add a second link between switches and prove the network keeps working when one of them dies — bonded if your kit does EtherChannel, blocked by spanning tree if not.',
    frameworks: ['CCNA'],
    deliverables: ['06_Validation_and_Test_Matrix.md'],
    estimatedTime: '45 min',
    difficulty: 4,
    learn: ['Spanning tree', 'Root bridge', 'PortFast', 'BPDU Guard', 'EtherChannel', 'LACP'],
    definitionOfDone: [
      'A second link exists between two switches',
      'You know which link is forwarding and which is not',
      'Pulling one link is a test row with a measured recovery',
    ],
    steps: [
      outline(
        'ccna-w2-resilience-s1',
        'Decide where the root of the tree should be',
        'The core switch',
        'Spanning tree picks a root for you, and its choice is usually wrong — the oldest switch wins. Set it deliberately to the core and record why.',
        'The core is the root bridge, on purpose, and you can show the command that says so.',
        {
          usesForm: 'Build & Configuration Log',
          whatItMeans:
            'Spanning tree always picks a root. Left alone it picks the oldest switch in the building, which is rarely where you want it.',
        }
      ),
      outline(
        'ccna-w2-resilience-s2',
        'Pull the cable and time it',
        'Between the two switches',
        'Start a continuous ping across the link, pull the forwarding cable, and count the lost replies before it recovers. That number is your failover time.',
        'The test matrix has a row with the measured number of lost pings, and traffic recovered without anyone touching a keyboard.',
        {
          usesForm: 'Validation & Test Matrix',
          whatItMeans:
            'Redundancy nobody has tested is a belief. The number of lost pings is the evidence.',
        }
      ),
    ],
  },

  // ── Week 3 — Route ────────────────────────────────────────────────────────
  {
    id: 'ccna-w3-wan',
    role: 'arch',
    shared: true,
    week: 3,
    title: 'Join the second building',
    objective: `Address the link between the sites, bring up the adjacency, and let each site learn the other's networks without a single static route.`,
    frameworks: ['CCNA'],
    deliverables: ['05_Build_and_Configuration_Log.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 4,
    learn: ['Point-to-point addressing', 'OSPF', 'Neighbour adjacency', 'Route selection', 'Wildcard masks'],
    definitionOfDone: [
      'The two routers are OSPF neighbours in the FULL state',
      'Each site learns the other’s prefixes as OSPF routes',
      'A branch PC reaches an HQ server by address',
    ],
    steps: [
      outline(
        'ccna-w3-wan-s1',
        'Address the link between the buildings',
        'Both routers',
        `A point-to-point link needs exactly two addresses, which is why the plan uses a ${WAN.prefix.split('/')[1]}-bit mask. Configure both ends and prove they ping each other before you add any protocol.`,
        'Each router pings the other across the WAN link, and both interfaces are up.',
        {
          usesForm: 'Build & Configuration Log',
          whatItMeans:
            'Prove the link before you add a protocol on top of it, or you will be debugging two things at once.',
        }
      ),
      outline(
        'ccna-w3-wan-s2',
        'Turn OSPF on, then read the adjacency',
        'Both routers',
        `Advertise the networks into OSPF area ${WAN.ospfArea} on both sides, then check the neighbour state. A neighbour stuck below FULL is telling you something specific — read it rather than restarting the process.`,
        'The neighbour table shows FULL, and each router has routes it did not have before, marked as OSPF.',
        {
          usesForm: 'Build & Configuration Log',
          whatItMeans:
            'A neighbour stuck below FULL names its own problem — mismatched masks, timers or areas. Read the state.',
        }
      ),
      outline(
        'ccna-w3-wan-s3',
        'Prove it the way a user would',
        'A PC at the branch',
        'Ping and trace from an actual branch client to an actual HQ server. The route table being right is not the same as the user being able to work.',
        'A trace from a branch PC to an HQ server crosses the WAN in the expected number of hops.',
        {
          usesForm: 'Validation & Test Matrix',
          whatItMeans:
            'A correct route table is not the same as a user who can work. Test from where the user sits.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w3-internet',
    role: 'impl',
    shared: true,
    week: 3,
    title: 'One way out to the internet',
    objective:
      'Point a default route at the ISP, translate the whole company behind one public address, and prove both sites get out.',
    frameworks: ['CCNA'],
    deliverables: ['05_Build_and_Configuration_Log.md', '06_Validation_and_Test_Matrix.md'],
    estimatedTime: '1 h',
    difficulty: 4,
    learn: ['Default routes', 'NAT inside and outside', 'PAT', 'Route propagation', 'DNS from the client'],
    definitionOfDone: [
      'A default route points at the ISP and is learned by the branch too',
      'Inside addresses are translated to one outside address',
      'A client at each site resolves a name and reaches the internet',
    ],
    steps: [
      outline(
        'ccna-w3-internet-s1',
        'Default route out, and share it',
        'The edge router',
        'Point a default route at the ISP gateway, then advertise it so the branch learns the way out too rather than having its own hard-coded copy.',
        'The branch router shows a default route learned from OSPF, not typed in locally.',
        {
          usesForm: 'Build & Configuration Log',
          whatItMeans:
            'One default route, advertised once, beats a copy on every device that somebody has to remember to change.',
        }
      ),
      outline(
        'ccna-w3-internet-s2',
        'Translate the inside to the outside',
        'The edge router',
        'Mark the inside and outside interfaces, translate the internal ranges to the outside address, and then watch the translation table fill as a client browses.',
        'The translation table shows real sessions, and a client at each site reaches the internet by name.',
        {
          usesForm: 'Validation & Test Matrix',
          whatItMeans:
            'The translation table is where NAT stops being theory: you can watch a session appear as somebody browses.',
        }
      ),
    ],
  },

  // ── Week 4 — Protect ──────────────────────────────────────────────────────
  {
    id: 'ccna-w4-policy',
    role: 'auto',
    shared: true,
    week: 4,
    title: 'Turn the policy into access lists',
    objective:
      'Write each business rule as an ACL, apply it in the right place and direction, and prove both what passes and what does not.',
    frameworks: ['CCNA', 'NIST_CSF'],
    deliverables: ['07_Security_Baseline_and_Policy.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 4,
    learn: ['Standard and extended ACLs', 'Direction and placement', 'Implicit deny', 'Testing a deny'],
    definitionOfDone: [
      'Every rule in the policy has an ACL and a place it is applied',
      'Guest cannot reach the LAN, proven by a test that fails on purpose',
      'No ACL exists that you cannot trace to a business rule',
    ],
    steps: [
      outline(
        'ccna-w4-policy-s1',
        'Write the rule before the ACL',
        'The Security Baseline form',
        'One row per rule, in the words the business would use, then the ACL name. An ACL nobody can trace to a rule is one nobody dares change later.',
        'Every row has a rule, an ACL name, and the interface and direction it is applied to.',
        {
          usesForm: 'Security Baseline & ACL Policy',
          whatItMeans:
            'An ACL nobody can trace to a business rule is an ACL nobody dares touch two years from now.',
        }
      ),
      outline(
        'ccna-w4-policy-s2',
        'Apply it, then try to break it',
        'The routing device, then a client in each VLAN',
        'Apply each ACL, then test from the guest VLAN into the LAN and from the user VLAN into management. The tests that must FAIL are the evidence that the policy works.',
        'The test matrix has blocked rows that are blocked, and allowed rows that still work.',
        {
          usesForm: 'Validation & Test Matrix', producesDeliverable: '07_Security_Baseline_and_Policy.md',
          whatItMeans:
            'The tests that must FAIL are the segmentation evidence. Everything else only proves the network works.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w4-harden',
    role: 'auto',
    shared: true,
    week: 4,
    title: 'Harden the management plane',
    objective:
      'Make the devices themselves defensible: SSH instead of telnet, real secrets, unused ports shut, and port security where a stranger could plug in.',
    frameworks: ['CCNA', 'CIS'],
    deliverables: ['07_Security_Baseline_and_Policy.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['SSH', 'enable secret', 'Port security', 'Shutting unused ports', 'Login banners', 'NTP'],
    definitionOfDone: [
      'Every device takes SSH and refuses telnet',
      'Unused access ports are shut or protected',
      'All devices agree on the time',
    ],
    steps: [
      outline(
        'ccna-w4-harden-s1',
        'Close the front door',
        'Every device',
        'Generate keys, enable SSH, disable telnet on the lines, set a real enable secret, and put a banner up. Then prove telnet fails — an untested claim is not a control.',
        'SSH connects, telnet is refused, and the banner appears before the login prompt.',
        {
          usesForm: 'Security Baseline & ACL Policy',
          whatItMeans:
            'Telnet sends the password in clear text on the management VLAN — the one network you least want read.',
        }
      ),
      outline(
        'ccna-w4-harden-s2',
        'Make the logs agree about time',
        'Every device',
        'Point every device at the same time source. Without it, correlating a switch log with a router log during an incident is guesswork.',
        'Every device reports synchronised time from the same source.',
        {
          usesForm: 'Security Baseline & ACL Policy',
          whatItMeans:
            'Without synchronised clocks, correlating a switch log with a router log during an incident is guesswork.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w4-wireless',
    role: 'impl',
    shared: true,
    week: 4,
    title: 'Put the WLANs on the air',
    objective:
      'Map the corporate, guest and IOT SSIDs onto their VLANs so wireless inherits exactly the segmentation the wired network already has.',
    frameworks: ['CCNA'],
    deliverables: ['05_Build_and_Configuration_Log.md'],
    estimatedTime: '45 min',
    difficulty: 3,
    learn: ['SSID to VLAN mapping', 'WLAN security', 'AP uplink as a trunk', 'Guest isolation', 'RF basics'],
    prerequisites: ['An access point, or the emulator’s wireless model — the register says which'],
    definitionOfDone: [
      'Each SSID lands in its own VLAN',
      'A guest client gets a guest address and cannot reach the LAN',
      'The AP uplink carries exactly the VLANs the WLANs need',
    ],
    steps: [
      outline(
        'ccna-w4-wireless-s1',
        'One SSID per VLAN, and no surprises',
        'The AP or controller',
        `Create a WLAN per group — corporate, guest, IOT — and map each to its VLAN. Guest on the air must be as isolated as guest on copper, and the ${vlan(50).name} rules already say so.`,
        'Each SSID is on the air and a client on it gets an address from that VLAN’s pool.',
        {
          usesForm: 'Build & Configuration Log',
          whatItMeans:
            'Wireless is not a separate network. An SSID is a VLAN with an aerial, and it inherits that VLAN’s rules.',
        }
      ),
      outline(
        'ccna-w4-wireless-s2',
        'Test wireless like a visitor would',
        'A wireless client',
        'Join the guest SSID and try to reach a server. It must fail, for the same reason and by the same ACL as it fails on copper.',
        'The test matrix shows guest-to-LAN blocked from wireless as well as wired.',
        {
          usesForm: 'Validation & Test Matrix',
          whatItMeans:
            'A guest who is isolated on copper and free on wireless is not isolated. Test the air as well.',
        }
      ),
    ],
  },

  // ── Week 5 — Operate (advanced) ───────────────────────────────────────────
  {
    id: 'ccna-w5-sot',
    role: 'ops',
    shared: true,
    week: 5,
    title: 'A source of truth, not a spreadsheet',
    objective:
      'Load the sites, devices, VLANs and prefixes into NetBox so the documentation becomes a system other tools can read.',
    frameworks: ['CCNA', 'ITIL'],
    deliverables: ['08_Operations_and_Change_Records.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 4,
    learn: ['IPAM and DCIM', 'NetBox data model', 'Source of truth', 'Why a spreadsheet stops scaling'],
    definitionOfDone: [
      'Both sites, every device and every prefix exist in NetBox',
      'The VLAN list in NetBox matches the LLD exactly',
      'You can answer "what is in 10.50.20.0/24" without opening a switch',
    ],
    steps: [
      outline(
        'ccna-w5-sot-s1',
        'Model what you already documented',
        'NetBox, in a browser',
        'Create the sites, then the devices, then the prefixes and VLANs — in that order, because each one hangs off the last. Your LLD is the input.',
        'NetBox answers the same questions your LLD does, and disagrees with it nowhere.',
        {
          usesForm: 'Operations & Change Records',
          whatItMeans:
            'A spreadsheet answers questions you ask. A source of truth answers questions your tools ask.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w5-change',
    role: 'ops',
    shared: true,
    week: 5,
    title: 'Back it up, then change it properly',
    objective:
      'Get every configuration into version control, then run one real change through request, peer review, backup, implementation and validation.',
    frameworks: ['ITIL', 'CCNA'],
    deliverables: ['08_Operations_and_Change_Records.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 4,
    learn: ['Configuration backup', 'Git for configs', 'Change records', 'Rollback plans', 'Peer review'],
    definitionOfDone: [
      'Every device’s configuration is backed up automatically',
      'One restore has actually been proven, not assumed',
      'One change has been reviewed by a teammate before it was made',
    ],
    handoff: [{ to: 'arch', note: 'The reviewer checks the addressing and the design fit before the change is made.' }],
    steps: [
      outline(
        'ccna-w5-change-s1',
        'Collect every configuration, automatically',
        'The tools host',
        'Point Oxidized at the devices and let it pull their configurations into Git. A backup somebody has to remember to take is not a backup.',
        'Every device appears in the repository, and a second run shows a diff only where something really changed.',
        {
          usesForm: 'Operations & Change Records',
          whatItMeans:
            'A backup somebody has to remember to take is not a backup. Automate the collection, then prove a restore.',
        }
      ),
      outline(
        'ccna-w5-change-s2',
        'Run one change the way a business would',
        'The change record, then the device',
        'Raise it, write the rollback FIRST, get a teammate to review it, back up, implement, re-run the validation tests, and record the result — including if it failed.',
        'The change record is complete, a teammate’s name is on the review, and the validation tests were re-run afterwards.',
        {
          usesForm: 'Operations & Change Records', producesDeliverable: '08_Operations_and_Change_Records.md',
          whatItMeans:
            'Writing the rollback first is the test of whether you understand the change. If you cannot, you are not ready.',
        }
      ),
    ],
  },

  // ── Week 6 — Observe (advanced) ───────────────────────────────────────────
  {
    id: 'ccna-w6-noc',
    role: 'ops',
    shared: true,
    week: 6,
    title: 'Build a small NOC',
    objective:
      'Poll every device, centralise the logs, watch the latency, and put it on one screen you would actually look at.',
    frameworks: ['CCNA'],
    deliverables: ['09_Monitoring_and_Incident_Log.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 4,
    learn: ['SNMP', 'Syslog', 'Interface utilization', 'Thresholds and alerts', 'Latency and jitter'],
    definitionOfDone: [
      'Every device is polled and graphed',
      'Logs from every device land in one place',
      'Six things are monitored, each with a threshold and an owner',
    ],
    steps: [
      outline(
        'ccna-w6-noc-s1',
        'Poll the devices and graph what matters',
        'The tools host, then each device',
        'Enable read-only SNMP on the kit, add them to LibreNMS, and check that interface, CPU and memory graphs start filling. Then set the thresholds that would actually page somebody.',
        'Every device is green in the monitoring system and its uplink graph is drawing.',
        {
          usesForm: 'Monitoring & Incident Log',
          whatItMeans:
            'Monitoring exists so the network tells you before a user does. A threshold nobody would act on is noise.',
        }
      ),
      outline(
        'ccna-w6-noc-s2',
        'Send every log to one place',
        'Each device',
        'Point syslog at the collector and prove it: make something happen — shut an interface — and watch the line arrive with the right timestamp.',
        'Shutting a port produces a log line at the collector, with time that matches the device.',
        {
          usesForm: 'Monitoring & Incident Log', producesDeliverable: '09_Monitoring_and_Incident_Log.md',
          whatItMeans:
            'Logs in one place with the right time turn "it broke this morning" into a sequence you can read.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w6-ticket',
    role: 'ops',
    shared: true,
    week: 6,
    title: 'Work a ticket, not a hunch',
    objective:
      'Take a user-reported symptom and isolate it by layer, recording what you ruled out as carefully as what you found.',
    frameworks: ['CCNA', 'ITIL'],
    deliverables: ['09_Monitoring_and_Incident_Log.md'],
    estimatedTime: '1 h',
    difficulty: 4,
    learn: ['Layered fault isolation', 'Scope of impact', 'What changed recently', 'Packet capture', 'Evidence'],
    definitionOfDone: [
      'The scope is established before any device is touched',
      'Each layer you ruled out is recorded with how',
      'The root cause names a cause, not a symptom',
    ],
    steps: [
      outline(
        'ccna-w6-ticket-s1',
        'Establish the scope before you touch anything',
        'The ticket',
        'One user or twenty? One VLAN or all of them? Since when, and what changed? Five minutes here saves an hour of poking at the wrong device.',
        'The ticket states who is affected, since when, and what changed recently.',
        {
          usesForm: 'Monitoring & Incident Log',
          whatItMeans:
            'Five minutes establishing scope saves an hour of poking at the wrong device.',
        }
      ),
      outline(
        'ccna-w6-ticket-s2',
        'Work down the layers, and capture the proof',
        'The devices, and a capture where needed',
        'Layer 1, then 2, then 3, then the services. Where the answer is not obvious, capture the traffic and read what actually happens rather than what should.',
        'The log records each layer ruled out and how, and the root cause is a cause rather than a restatement of the symptom.',
        {
          usesForm: 'Monitoring & Incident Log',
          whatItMeans:
            'What you ruled out is as much of the record as what you found — it is how the next person trusts your conclusion.',
        }
      ),
    ],
  },

  // ── Week 7 — Automate (advanced) ──────────────────────────────────────────
  {
    id: 'ccna-w7-data',
    role: 'auto',
    shared: true,
    week: 7,
    title: 'The network as data',
    objective:
      'Read the network through an API instead of a screen, and describe intent as YAML rather than as remembered commands.',
    frameworks: ['CCNA'],
    deliverables: ['08_Operations_and_Change_Records.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 4,
    learn: ['JSON and YAML', 'REST verbs', 'Reading an API', 'Idempotence', 'Why data beats a screenshot'],
    definitionOfDone: [
      'You can pull the device list out of NetBox with one request',
      'The intended VLAN list exists as YAML, not just in a config',
      'You can explain what idempotent means with your own example',
    ],
    steps: [
      outline(
        'ccna-w7-data-s1',
        'Ask the source of truth a question',
        'The tools host — terminal',
        'Query the NetBox API for your devices and read the JSON that comes back. This is the same data the dashboard shows, in the form a script can use.',
        'A single request returns your device list as JSON, and you can pick out one field from it.',
        {
          usesForm: 'Operations & Change Records',
          whatItMeans:
            'The same data the dashboard draws, in the form a script can use. That is all an API is.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w7-ansible',
    role: 'auto',
    shared: true,
    week: 7,
    title: 'Configure from the source of truth',
    objective:
      'Write a playbook that adds a VLAN to every access switch from the data in NetBox — and that does nothing at all the second time you run it.',
    frameworks: ['CCNA'],
    deliverables: ['08_Operations_and_Change_Records.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 4,
    learn: ['Ansible inventory', 'Playbooks and variables', 'Templates', 'Dry runs', 'Idempotence in practice'],
    definitionOfDone: [
      'A playbook configures the same VLAN on every access switch',
      'Running it twice reports no changes the second time',
      'The change went through the same review as a manual one',
    ],
    steps: [
      outline(
        'ccna-w7-ansible-s1',
        'One playbook, every switch',
        'The tools host — terminal',
        'Build the inventory from NetBox, write the playbook, run it against one switch, then all of them. Then run it again and watch it change nothing.',
        'The second run reports zero changes, which is what "idempotent" means when you can see it.',
        {
          usesForm: 'Operations & Change Records',
          whatItMeans:
            'Idempotent means running it again is safe. The second run changing nothing is how you see it.',
        }
      ),
      outline(
        'ccna-w7-ansible-s2',
        'Automation is still a change',
        'The change record',
        'A playbook that touches eight switches is a bigger change than one that touches one. It goes through the same request, review and validation as anything else.',
        'The automated change has a change record with a reviewer and re-run validation tests.',
        {
          usesForm: 'Operations & Change Records',
          whatItMeans:
            'Automation multiplies a mistake across every device. That makes review more important, not less.',
        }
      ),
    ],
  },

  // ── Week 8 — Engineer (advanced) ──────────────────────────────────────────
  {
    id: 'ccna-w8-incident',
    role: 'ops',
    shared: true,
    week: 8,
    title: 'Something breaks — work it properly',
    objective:
      'Your instructor breaks something. Find it as an incident, fix it under change control, prove the fix, and write the root cause and the prevention.',
    frameworks: ['CCNA', 'ITIL', 'NIST_CSF'],
    deliverables: ['09_Monitoring_and_Incident_Log.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 4,
    learn: ['Incident management', 'Root cause vs symptom', 'Preventive action', 'Communication during an incident'],
    definitionOfDone: [
      'The incident is timed: reported, understood, fixed',
      'The root cause is a cause, and the fix is under a change record',
      'A preventive action is named that is a check or a standard, not "be careful"',
    ],
    steps: [
      outline(
        'ccna-w8-incident-s1',
        'Triage, then isolate',
        'The ticket, then the network',
        'Establish scope and impact first, check what changed, then work the layers. Your monitoring should tell you something before any user does.',
        'The log shows the scope, the timeline, and each layer ruled out on the way to the cause.',
        {
          usesForm: 'Monitoring & Incident Log',
          whatItMeans:
            'Your monitoring should have told you first. If a user did, that is a finding about the monitoring.',
        }
      ),
      outline(
        'ccna-w8-incident-s2',
        'Fix it under change control, then prevent it',
        'The change record, then the device',
        'Even in an incident: the fix is a change, with a rollback. Then write what stops it happening again — a pre-change check, a template, a standard.',
        'The fix is recorded as a change, the validation tests pass again, and the preventive action is something a team could actually follow.',
        {
          usesForm: 'Monitoring & Incident Log', producesDeliverable: '09_Monitoring_and_Incident_Log.md',
          whatItMeans:
            'An incident is not an excuse to skip change control. It is when a rollback matters most.',
        }
      ),
    ],
  },
  {
    id: 'ccna-w8-handover',
    role: 'arch',
    shared: true,
    week: 8,
    title: 'Hand the network over',
    objective:
      'Assemble the as-built package: what you really built, the known issues, how credentials pass, and how somebody checks this network is healthy on their first morning.',
    frameworks: ['CCNA', 'ITIL'],
    deliverables: ['10_As_Built_and_Handover.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 4,
    learn: ['As-built documentation', 'Known issues', 'Credential handover', 'Runbooks', 'Defending a design'],
    definitionOfDone: [
      'The diagrams match the configuration, not the design',
      'Known issues are listed honestly',
      'A first-day health runbook exists, ten minutes long',
      'No passwords appear in the document',
    ],
    steps: [
      outline(
        'ccna-w8-handover-s1',
        'Say where the build differs from the design',
        'The handover document',
        'Compare the as-built to the HLD and LLD, and write down every difference with the reason. Most will trace to a line in your Week-0 capability register.',
        'Every difference between the design and the build is stated with why it happened.',
        {
          usesForm: 'As-Built & Operations Handover',
          whatItMeans:
            'Where the build differs from the design is the most interesting page in the document, not the embarrassing one.',
        }
      ),
      outline(
        'ccna-w8-handover-s2',
        'Write the first-day runbook',
        'The handover document',
        'Ten minutes, in order: what to look at, what good looks like, and one test that must fail. If a stranger cannot follow it, it is not a runbook.',
        'A stranger could confirm this network is healthy in ten minutes using only your runbook.',
        {
          usesForm: 'As-Built & Operations Handover', producesDeliverable: '10_As_Built_and_Handover.md',
          whatItMeans:
            'A runbook a stranger cannot follow is a note to yourself. Ten minutes, in order, no assumed knowledge.',
        }
      ),
    ],
  },
];

export const CCNA: Course = {
  id: 'ccna',
  title: 'CCNA Network Capstone',
  slug: 'ccna',
  description:
    'Run the network for a growing company: discover, design, build, prove, secure, operate and hand over a two-site network — the job, with CCNA technology inside it.',
  vendor: 'Cisco',
  certification: 'CCNA (200-301)',
  level: 'associate',
  audience:
    'Plan, build, operate and hand over a real two-site network as a four-person network team — starting from whatever equipment you actually have.',
  roles: ROLES,
  weeks: WEEKS,
  gates: [],
  tasks: TASKS,
  // One shared build; the focus decides which record you lead and what you review.
  sharedTrack: true,
  // No week ever locks: a team waiting on kit, or on a purchase, must not be
  // blocked out of the weeks it CAN do.
  noGatekeeping: true,
  // The compactness contract: one step at a time, explanations one click away.
  guidedDefault: true,
  // No `manualSections: ['config-guide']` yet, deliberately: the week-by-week
  // procedures are a later round, and a course that declares a guide it has not
  // authored would render an empty section — or worse, another course's.
  topologyPicture: 'campus',
  buildMap: [
    { week: 1, label: 'One office network, reachable', check: 'Both switches answer on the management VLAN' },
    { week: 2, label: 'Departments, separated and routed', check: 'A PC gets DHCP and reaches a server in another VLAN' },
    { week: 3, label: 'Two buildings and the internet', check: 'The OSPF neighbour is FULL and a branch PC browses the web' },
    { week: 4, label: 'The rules enforced', check: 'A guest PC is blocked from the LAN — and you can prove it' },
    { week: 5, label: 'Under management', check: 'One reviewed, reversible change has been made and validated' },
    { week: 6, label: 'Watched', check: 'A shut port raises a log and a graph you can point at' },
    { week: 7, label: 'Configured from data', check: 'The playbook runs twice and changes nothing the second time' },
    { week: 8, label: 'Handed over', check: 'A stranger could run this network from your documentation' },
  ],
  lifecyclePath: [
    { label: 'Discover', detail: 'What the business needs, and what the kit can actually do.' },
    { label: 'Design', detail: 'The shape, then every VLAN, port and address.' },
    { label: 'Build', detail: 'Configure it, logging each change as you make it.' },
    { label: 'Validate', detail: 'Prove what works — and what must not.' },
    { label: 'Operate', detail: 'Back it up, change it under review, watch it.' },
    { label: 'Improve', detail: 'Root cause, prevention, automation, handover.' },
  ],
  isSeed: true,
  version: 1,
};

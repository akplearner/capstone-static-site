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
    name: 'Network Design (Architect)',
    mission: 'Owns requirements, design and the addressing plan; reviews every change for design fit.',
    color: '#0369a1',
    icon: 'Layers',
  },
  {
    id: 'impl',
    name: 'Device Build (Implementation Engineer)',
    mission: 'Owns switching, interfaces, wireless and the device build; reviews the configuration itself.',
    color: '#15803d',
    icon: 'Network',
  },
  {
    id: 'ops',
    name: 'Network Operations (Operations Engineer)',
    mission: 'Owns monitoring, backups, tickets and change records; reviews the rollback on every change.',
    color: '#b45309',
    icon: 'Activity',
  },
  {
    id: 'auto',
    name: 'Automation & Security (Automation Engineer)',
    mission: 'Owns ACL policy, the management plane, Git and automation; reviews the validation evidence.',
    color: '#7c3aed',
    icon: 'Code',
  },
];

const WEEKS: WeekDef[] = [
  {
    number: 0,
    title: 'Acquisition & Kit',
    theme: 'What you have, and what it can do',
    objective:
      'Declare how this build runs, register every device, and prove each capability with the command output that says so.',
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
      'Discover what the business needs, design the network’s shape, then bring the first switches up — cabled, named, addressed, reachable.',
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
      'Turn the flat office network into VLANs with trunks between switches, hand out addresses, and route between the departments.',
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
      'Join the branch to headquarters, learn routes dynamically, and give the company one way out to the internet.',
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
      'Turn the policy into access lists, harden every device, put the WLANs on the air, prove forbidden traffic is blocked.',
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
      'A source of truth in NetBox, configurations backed up and versioned, and every change reviewed by a teammate and reversible.',
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
      'Stand up a small NOC — polling, logs, latency and dashboards — then work a real ticket down the layers.',
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
      'Read the network through its APIs, describe it as data, and let Ansible configure from the source of truth.',
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
      'Work an injected failure as an incident: root cause, a fix under change control, proof, and a handover.',
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
        `Decide as a team: ${PATHS.emulated.label} or ${PATHS.physical.label}. Emulation gives you every device the design calls for; hardware gives cabling, optics, PoE and real counters. Record which you are on.`,
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
      'One row per device with its real software version, then each capability answered Yes or No with the output that proves it.',
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
        verify: ['Codes:', 'channel-groups'],
        title: 'Prove each capability, one command at a time',
        description: 'Yes or No, with the line that says so.',
        where: 'Each device — console or SSH',
        instruction:
          'Work down the capability list: run the command, read the tell, record the answer, and paste the line. A "Yes" with no output beside it is an opinion.',
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
        `${COMPANY.name}: ${COMPANY.driver} Record the departments, what each does, and what cannot go down.`,
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
        `Record where the equipment lives, how many drops, and where the circuit comes in. HQ: ${SITES[0].rooms}.`,
        'The survey records the rooms, the drops, the cable runs and the ISP handoff.',
        {
          usesForm: 'Requirements & Site Survey', producesDeliverable: '02_Requirements_and_Site_Survey.md',
          whatItMeans:
            'The building decides half the design: cable distance, where power is, and where a switch can actually live.',
        }
      ),
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w1-discover-s3',
        title: 'Count what is already there',
        description: 'The existing kit, from CDP rather than the spreadsheet.',
        where: 'Each switch — console or SSH',
        instruction: 'On the existing switch, list the neighbours and the MAC table size. The requirements register gets the real numbers.',
        commands: [
          {
            cmd: 'show cdp neighbors',
            explain: 'Every directly connected Cisco device, its port and its platform. What the old network really is.',
            sample: 'Device ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\nSW-OLD-02        Gig 1/0/24        151            S I    WS-C2960  Gig 1/0/24\nR-OLD            Gig 1/0/1         132            R      ISR4221   Gig 0/0/0',
          },
          {
            cmd: 'show mac address-table count',
            explain: 'How many hosts the switch has learnt. The user count for the requirements, not a guess.',
            sample: 'Mac Entries for Vlan 1:\n---------------------------\nDynamic Address Count  : 47\nStatic  Address Count  : 0\nTotal Mac Addresses    : 47',
          },
        ],
        expectedOutput: 'SW-OLD-01# show cdp neighbors\nDevice ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\nSW-OLD-02        Gig 1/0/24        151            S I    WS-C2960  Gig 1/0/24\nR-OLD            Gig 1/0/1         132            R      ISR4221   Gig 0/0/0\n\nSW-OLD-01# show mac address-table count\nDynamic Address Count  : 47\nTotal Mac Addresses    : 47',
        outputKind: 'console',
        verify: ['Device ID', 'Total Mac Addresses'],
        whatItMeans: 'A requirements register built from the device beats one built from memory: the host count and the neighbour list are what the new design has to carry.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w1-discover-s4',
        title: 'Read the addressing in use',
        description: 'The old subnet and gateway, from the device.',
        where: 'Each switch — console or SSH',
        instruction: 'Read the management address and the default gateway of the existing switch, then record the subnet the users sit in today.',
        commands: [
          {
            cmd: 'show ip interface brief',
            explain: 'Every interface with its address and state. The management VLAN interface is the one with an address.',
            sample: 'Interface              IP-Address      OK? Method Status                Protocol\nVlan1                  192.168.1.2     YES NVRAM  up                    up\nGigabitEthernet1/0/1   unassigned      YES unset  up                    up',
          },
          {
            cmd: 'show ip default-gateway',
            explain: 'Where the switch sends traffic it cannot route itself: the old gateway the users share.',
            sample: '192.168.1.1',
          },
        ],
        expectedOutput: 'SW-OLD-01# show ip interface brief\nInterface              IP-Address      OK? Method Status                Protocol\nVlan1                  192.168.1.2     YES NVRAM  up                    up\n\nSW-OLD-01# show ip default-gateway\n192.168.1.1',
        outputKind: 'console',
        verify: ['IP-Address', 'Vlan1'],
        whatItMeans: 'One flat 192.168.1.0/24 with everything in VLAN 1 is the usual finding, and it is the reason the design has departments.',
        frameworks: ['CCNA'],
      },
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
        'If the register says a switch routes, the core routes between VLANs; if not, the router does, over one trunk. Write the decision down with the reason.',
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
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w1-design-s3',
        title: 'Reserve the VLAN ids on the core',
        description: 'The VLAN table before any port moves.',
        where: 'SW-CORE-01 — console or SSH',
        instruction: 'Create the VLANs from the high-level design on the core switch, names included, then show the table. The plan and the device must agree.',
        commands: [
          {
            cmd: 'show vlan brief',
            explain: 'Every VLAN with its name and the ports in it. Empty port lists are expected: nothing has moved yet.',
            sample: 'VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    Gi1/0/1, Gi1/0/2\n10   CORP-USERS                       active\n20   SERVERS                          active\n99   MGMT                             active',
          },
        ],
        expectedOutput: 'SW-CORE-01# show vlan brief\nVLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    Gi1/0/1, Gi1/0/2\n10   CORP-USERS                       active\n20   SERVERS                          active\n99   MGMT                             active',
        outputKind: 'console',
        verify: ['CORP-USERS', 'MGMT'],
        whatItMeans: 'A VLAN that exists with its name on the device is a design decision made real; a VLAN that exists only in the document is still an idea.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w1-design-s4',
        title: 'Prove the core can route',
        description: 'The routing table, before the design relies on it.',
        where: 'SW-CORE-01 — console or SSH',
        instruction: 'Enable routing on the core and show the table. The design puts every gateway here, so this must say yes.',
        commands: [
          {
            cmd: 'show ip route',
            explain: 'A routing table means the switch routes. “Invalid input” means the design needs a router-on-a-stick instead.',
            sample: 'Codes: L - local, C - connected, S - static\n\nGateway of last resort is not set\n\n      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks\nC        10.50.99.0/24 is directly connected, Vlan99\nL        10.50.99.2/32 is directly connected, Vlan99',
          },
        ],
        expectedOutput: 'SW-CORE-01# show ip route\nCodes: L - local, C - connected, S - static\n\nGateway of last resort is not set\n\n      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks\nC        10.50.99.0/24 is directly connected, Vlan99',
        outputKind: 'console',
        verify: ['Codes:', 'directly connected'],
        whatItMeans: 'The high-level design chose a Layer 3 core. This output is the proof the kit can be that core; without it the design changes before Week 2.',
        frameworks: ['CCNA'],
      },
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
        `Set the hostname from the plan, give the switch its management address in ${vlan(99).name}, and save. A device you cannot reach is one you will walk to all term.`,
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
        'Check every port you cabled: up, the expected speed, no errors climbing. A link at 100 Mbps when you expected 1 Gbps is a cable problem to find now.',
        'Interface status matches the plan, and the error counters are clean on every link you rely on.',
        {
          usesForm: 'Build & Configuration Log', producesDeliverable: '05_Build_and_Configuration_Log.md',
          whatItMeans:
            'Interface counters are the only place a bad cable admits what it is doing. Read them before you trust the link.',
        }
      ),
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w1-bringup-s3',
        title: 'Name the switch and set the management address',
        description: 'Hostname, VLAN 99 address, default gateway.',
        where: 'Each switch — console or SSH',
        instruction: 'Give the switch its name from the plan, put its address in the management VLAN, set the gateway, then read both back.',
        commands: [
          {
            cmd: 'show running-config | include hostname|ip default-gateway',
            explain: 'The two lines the plan fixed: who the switch is and where it sends management traffic.',
            sample: 'hostname SW-ACC-01\nip default-gateway 10.50.99.1',
          },
          {
            cmd: 'show ip interface brief | include Vlan',
            explain: 'The management SVI with its address, up and up. Anything else and SSH will not reach it.',
            sample: 'Vlan99                 10.50.99.11     YES manual up                    up',
          },
        ],
        expectedOutput: 'SW-ACC-01# show running-config | include hostname|ip default-gateway\nhostname SW-ACC-01\nip default-gateway 10.50.99.1\n\nSW-ACC-01# show ip interface brief | include Vlan\nVlan99                 10.50.99.11     YES manual up                    up',
        outputKind: 'console',
        verify: ['hostname', 'Vlan99'],
        whatItMeans: 'A switch you can name and reach is a switch you can manage from your desk. Everything after this week is typed over SSH, not a console cable.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w1-bringup-s4',
        title: 'Save it and prove it survives a reload',
        description: 'startup-config matches running-config.',
        where: 'Each switch — console or SSH',
        instruction: 'Write the configuration, then compare the saved copy with the running one. A build that lives only in RAM is lost at the first power cut.',
        commands: [
          {
            cmd: 'write memory',
            explain: 'Copies the running configuration to NVRAM. The one command students forget.',
            sample: 'Building configuration...\n[OK]',
          },
          {
            cmd: 'show startup-config | include hostname',
            explain: 'Reads the SAVED copy. If the hostname is there, the save happened.',
            sample: 'hostname SW-ACC-01',
          },
        ],
        expectedOutput: 'SW-ACC-01# write memory\nBuilding configuration...\n[OK]\nSW-ACC-01# show startup-config | include hostname\nhostname SW-ACC-01',
        outputKind: 'console',
        verify: ['[OK]', 'hostname'],
        whatItMeans: 'Half of the “it was working yesterday” tickets are a configuration that was never saved. The build log records the save as a step, not an assumption.',
        frameworks: ['CCNA'],
      },
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
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w2-vlans-s3',
        title: 'Prove the VLANs and the access ports',
        description: 'Every VLAN present, every port where the plan says.',
        where: 'Each switch — console or SSH',
        instruction: 'Show the VLAN table on each switch and compare it, line by line, with the LLD. A port in the wrong VLAN is found here, not by the user.',
        commands: [
          {
            cmd: 'show vlan brief',
            explain: 'Each VLAN with the access ports assigned to it. The port column is the plan made real.',
            sample: 'VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n10   CORP-USERS                       active    Gi1/0/1, Gi1/0/2, Gi1/0/3\n20   SERVERS                          active    Gi1/0/13, Gi1/0/14\n30   VOICE                            active    Gi1/0/5\n99   MGMT                             active',
          },
        ],
        expectedOutput: 'SW-ACC-01# show vlan brief\nVLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n10   CORP-USERS                       active    Gi1/0/1, Gi1/0/2, Gi1/0/3\n20   SERVERS                          active    Gi1/0/13, Gi1/0/14\n30   VOICE                            active    Gi1/0/5\n99   MGMT                             active',
        outputKind: 'console',
        verify: ['CORP-USERS', 'SERVERS'],
        whatItMeans: 'The LLD says which port is in which department; this table says which port really is. The two agreeing is the whole point of writing the plan first.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w2-vlans-s4',
        title: 'Prove the trunk carries them',
        description: 'Both ends: trunking, native VLAN stated, VLANs allowed.',
        where: 'Each switch — console or SSH',
        instruction: 'Show the trunk on both switches. The native VLAN and the allowed list must match on both ends, or the mismatch log line is your fault.',
        commands: [
          {
            cmd: 'show interfaces trunk',
            explain: 'Which ports trunk, with what encapsulation, which native VLAN, and which VLANs are allowed and active.',
            sample: 'Port        Mode             Encapsulation  Status        Native vlan\nGi1/0/24    on               802.1q         trunking      99\n\nPort        Vlans allowed on trunk\nGi1/0/24    10,20,30,40,50,60,99\n\nPort        Vlans allowed and active in management domain\nGi1/0/24    10,20,30,40,50,60,99',
          },
        ],
        expectedOutput: 'SW-ACC-01# show interfaces trunk\nPort        Mode             Encapsulation  Status        Native vlan\nGi1/0/24    on               802.1q         trunking      99\n\nPort        Vlans allowed on trunk\nGi1/0/24    10,20,30,40,50,60,99',
        outputKind: 'console',
        verify: ['trunking', 'Native vlan'],
        whatItMeans: 'A native VLAN that differs on the two ends of a trunk is the classic fault. This output, taken on both switches, is how you know it is not yours.',
        frameworks: ['CCNA'],
      },
    ],
  },
  {
    id: 'ccna-w2-route',
    role: 'impl',
    shared: true,
    week: 2,
    title: 'Route between the departments',
    objective:
      'Give every VLAN a gateway and let the departments reach each other: on the switch if your kit routes, else on the router.',
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
        'Serve DHCP where the plan says — on the device or relayed to the server — then release and renew on a client and confirm the address, mask and gateway.',
        'A client gets an address from the right pool with the right gateway, and reaches a host in another VLAN.',
        {
          usesForm: 'Validation & Test Matrix', producesDeliverable: '06_Validation_and_Test_Matrix.md',
          whatItMeans:
            'DHCP is where a design meets a real client. A wrong gateway in the pool looks exactly like a routing fault.',
        }
      ),
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w2-route-s3',
        title: 'Bring the gateways up',
        description: 'One SVI per VLAN, each with the gateway address from the plan.',
        where: 'SW-CORE-01 — console or SSH',
        instruction: 'Create the SVIs from the LLD, then show the interfaces. Every department gateway must be up and up before a PC can leave its VLAN.',
        commands: [
          {
            cmd: 'show ip interface brief | include Vlan',
            explain: 'The gateways, one per VLAN, with their state. A down/down SVI has no active port in its VLAN yet.',
            sample: 'Vlan10                 10.50.10.1      YES manual up                    up\nVlan20                 10.50.20.1      YES manual up                    up\nVlan30                 10.50.30.1      YES manual up                    up\nVlan99                 10.50.99.1      YES manual up                    up',
          },
        ],
        expectedOutput: 'SW-CORE-01# show ip interface brief | include Vlan\nVlan10                 10.50.10.1      YES manual up                    up\nVlan20                 10.50.20.1      YES manual up                    up\nVlan30                 10.50.30.1      YES manual up                    up\nVlan99                 10.50.99.1      YES manual up                    up',
        outputKind: 'console',
        verify: ['Vlan10', 'Vlan20'],
        whatItMeans: 'The gateway a PC gets from DHCP has to exist somewhere. This is where, and this output is the first time the departments can talk to each other.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w2-route-s4',
        title: 'Prove inter-VLAN routing with the table',
        description: 'Connected routes for every department, then a ping across.',
        where: 'SW-CORE-01 — console or SSH',
        instruction: 'Show the routing table, then ping from the core into a user PC and a server. Both replies prove the core routes between departments.',
        commands: [
          {
            cmd: 'show ip route connected',
            explain: 'One connected route per SVI. A department missing here cannot be reached from any other.',
            sample: 'C        10.50.10.0/24 is directly connected, Vlan10\nC        10.50.20.0/24 is directly connected, Vlan20\nC        10.50.30.0/24 is directly connected, Vlan30\nC        10.50.99.0/24 is directly connected, Vlan99',
          },
          {
            cmd: 'ping 10.50.20.10 source 10.50.10.1',
            explain: 'A ping from the users’ gateway to the server. Five exclamation marks is routing working.',
            sample: 'Sending 5, 100-byte ICMP Echos to 10.50.20.10, timeout is 2 seconds:\nPacket sent with a source address of 10.50.10.1\n!!!!!\nSuccess rate is 100 percent (5/5)',
          },
        ],
        expectedOutput: 'SW-CORE-01# show ip route connected\nC        10.50.10.0/24 is directly connected, Vlan10\nC        10.50.20.0/24 is directly connected, Vlan20\n\nSW-CORE-01# ping 10.50.20.10 source 10.50.10.1\n!!!!!\nSuccess rate is 100 percent (5/5)',
        outputKind: 'console',
        verify: ['directly connected', 'Success rate'],
        whatItMeans: 'Routing is proved by a packet that crossed a VLAN boundary and came back. The table says it can; the ping says it did.',
        frameworks: ['CCNA'],
      },
    ],
  },
  {
    id: 'ccna-w2-resilience',
    role: 'ops',
    shared: true,
    week: 2,
    title: 'Survive a cable being pulled',
    objective:
      'Add a second link between switches and prove the network survives losing one — bonded if your kit does EtherChannel, blocked by spanning tree if not.',
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
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w2-resilience-s3',
        title: 'Read the spanning-tree root and roles',
        description: 'The core is root; the second uplink is blocking.',
        where: 'Each switch — console or SSH',
        instruction: 'Show spanning tree for the user VLAN on the access switch. The root must be the core and exactly one uplink must be forwarding.',
        commands: [
          {
            cmd: 'show spanning-tree vlan 10',
            explain: 'Root bridge identity, this switch’s role per port, and which port is blocking the loop.',
            sample: 'VLAN0010\n  Spanning tree enabled protocol rstp\n  Root ID    Priority    24586\n             Address     0c11.6700.0a01\n             Cost        4\n             Port        24 (GigabitEthernet1/0/24)\n\nInterface           Role Sts Cost      Prio.Nbr Type\n------------------- ---- --- --------- -------- --------------------------------\nGi1/0/23            Altn BLK 4         128.23   P2p\nGi1/0/24            Root FWD 4         128.24   P2p',
          },
        ],
        expectedOutput: 'SW-ACC-01# show spanning-tree vlan 10\nVLAN0010\n  Spanning tree enabled protocol rstp\n  Root ID    Priority    24586\n             Address     0c11.6700.0a01\n\nInterface           Role Sts Cost      Prio.Nbr Type\nGi1/0/23            Altn BLK 4         128.23   P2p\nGi1/0/24            Root FWD 4         128.24   P2p',
        outputKind: 'console',
        verify: ['Root ID', 'BLK'],
        whatItMeans: 'A blocking port is not a broken port: it is the loop prevention working. Knowing which port blocks is how you predict what happens when the other cable is pulled.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w2-resilience-s4',
        title: 'Pull the cable and watch it recover',
        description: 'The blocked port forwards within seconds; the ping stream resumes.',
        where: 'Each switch — console or SSH',
        instruction: 'Start a continuous ping from a PC to its gateway, unplug the forwarding uplink, then show spanning tree again. Record how many pings were lost.',
        commands: [
          {
            cmd: 'show spanning-tree vlan 10 | include FWD|BLK',
            explain: 'After the pull, the former Altn port must read FWD. If it still blocks, the topology did not converge.',
            sample: 'Gi1/0/23            Root FWD 4         128.23   P2p',
          },
          {
            cmd: 'show logging | include LINEPROTO',
            explain: 'The log line that timestamps the failure; the gap to the next line is your recovery time.',
            sample: '%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet1/0/24, changed state to down',
          },
        ],
        expectedOutput: 'SW-ACC-01# show spanning-tree vlan 10 | include FWD|BLK\nGi1/0/23            Root FWD 4         128.23   P2p\nSW-ACC-01# show logging | include LINEPROTO\n%LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet1/0/24, changed state to down',
        outputKind: 'console',
        verify: ['FWD', 'LINEPROTO'],
        whatItMeans: 'Resilience you have not tested is a hope. The validation record gets the number of pings lost, which is the recovery time the business actually feels.',
        frameworks: ['CCNA'],
      },
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
        `Advertise the networks into OSPF area ${WAN.ospfArea} on both sides, then check the neighbour state. A neighbour stuck below FULL is telling you something specific — read it, don’t restart.`,
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
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w3-wan-s4',
        title: 'Prove the OSPF neighbour',
        description: 'FULL adjacency between the two sites.',
        where: 'R1-HQ — console or SSH',
        instruction: 'Enable OSPF on both routers for the WAN link and the site networks, then show the neighbour. FULL is the only state that means the sites exchange routes.',
        commands: [
          {
            cmd: 'show ip ospf neighbor',
            explain: 'The neighbour router, its state and the interface it is learnt on. FULL/DR or FULL/BDR is a working adjacency.',
            sample: 'Neighbor ID     Pri   State           Dead Time   Address         Interface\n10.255.255.2      1   FULL/BDR        00:00:36    10.255.255.2    GigabitEthernet0/0/1',
          },
        ],
        expectedOutput: 'R1-HQ# show ip ospf neighbor\nNeighbor ID     Pri   State           Dead Time   Address         Interface\n10.255.255.2      1   FULL/BDR        00:00:36    10.255.255.2    GigabitEthernet0/0/1',
        outputKind: 'console',
        verify: ['FULL', 'Neighbor ID'],
        whatItMeans: 'Two routers that agree they are neighbours is the moment the second building joins the network. Anything other than FULL is a mismatch to find, not a slow link.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w3-wan-s5',
        title: 'Prove the routes crossed the WAN',
        description: 'Branch networks in the HQ table, learnt by OSPF.',
        where: 'R1-HQ — console or SSH',
        instruction: 'Show the OSPF routes at HQ and ping a branch gateway. The O routes are the branch; the ping is the proof the path works both ways.',
        commands: [
          {
            cmd: 'show ip route ospf',
            explain: 'Routes learnt by OSPF, marked O, with the next hop across the WAN.',
            sample: '      10.0.0.0/8 is variably subnetted, 8 subnets, 2 masks\nO        10.60.110.0/24 [110/2] via 10.255.255.2, 00:04:11, GigabitEthernet0/0/1\nO        10.60.130.0/24 [110/2] via 10.255.255.2, 00:04:11, GigabitEthernet0/0/1',
          },
          {
            cmd: 'ping 10.60.110.1',
            explain: 'The branch users’ gateway, reached across the WAN. Five replies, both buildings are one network.',
            sample: '!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 2/3/5 ms',
          },
        ],
        expectedOutput: 'R1-HQ# show ip route ospf\nO        10.60.110.0/24 [110/2] via 10.255.255.2, 00:04:11, GigabitEthernet0/0/1\nO        10.60.130.0/24 [110/2] via 10.255.255.2, 00:04:11, GigabitEthernet0/0/1\nR1-HQ# ping 10.60.110.1\n!!!!!\nSuccess rate is 100 percent (5/5)',
        outputKind: 'console',
        verify: ['via 10.255.255.2', 'Success rate'],
        whatItMeans: 'A routing protocol earns its place when a network you never typed into this router appears in its table. The LLD now describes two buildings that behave as one.',
        frameworks: ['CCNA'],
      },
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
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w3-internet-s3',
        title: 'Prove the default route and NAT',
        description: 'A gateway of last resort, and translations building.',
        where: 'R1-HQ — console or SSH',
        instruction: 'Add the default route toward the ISP and the NAT overload, then show both. The route gets packets out; NAT gets the replies back.',
        commands: [
          {
            cmd: 'show ip route | include Gateway|S\\*',
            explain: 'The gateway of last resort and the static default that set it. Without it, nothing leaves the building.',
            sample: 'Gateway of last resort is 198.51.100.1 to network 0.0.0.0\nS*    0.0.0.0/0 [1/0] via 198.51.100.1',
          },
          {
            cmd: 'show ip nat translations',
            explain: 'Inside addresses mapped to the public one. Rows here mean users are getting out and replies are finding their way back.',
            sample: 'Pro Inside global      Inside local       Outside local      Outside global\ntcp 198.51.100.10:50012 10.50.10.51:50012 93.184.216.34:443  93.184.216.34:443',
          },
        ],
        expectedOutput: 'R1-HQ# show ip route | include Gateway|S*\nGateway of last resort is 198.51.100.1 to network 0.0.0.0\nS*    0.0.0.0/0 [1/0] via 198.51.100.1\nR1-HQ# show ip nat translations\nPro Inside global      Inside local       Outside local      Outside global\ntcp 198.51.100.10:50012 10.50.10.51:50012 93.184.216.34:443  93.184.216.34:443',
        outputKind: 'console',
        verify: ['Gateway of last resort', 'Inside global'],
        whatItMeans: 'One public address shared by a building is the single most common thing a network engineer configures. The translation table is the proof it is happening.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w3-internet-s4',
        title: 'Prove the branch gets out through HQ',
        description: 'A branch PC reaches the internet via the WAN and the one NAT.',
        where: 'R1-HQ — console or SSH',
        instruction: 'From the branch, trace a path to a public address. It must cross the WAN and leave through the one NAT at HQ. The hops draw the design.',
        commands: [
          {
            cmd: 'show ip nat statistics',
            explain: 'How many translations are active and which interfaces are inside and outside. The counters move when the branch browses.',
            sample: 'Total active translations: 23 (0 static, 23 dynamic; 23 extended)\nOutside interfaces:\n  GigabitEthernet0/0/0\nInside interfaces:\n  GigabitEthernet0/0/1, GigabitEthernet0/0/2\nHits: 4120  Misses: 0',
          },
        ],
        expectedOutput: 'R1-HQ# show ip nat statistics\nTotal active translations: 23 (0 static, 23 dynamic; 23 extended)\nOutside interfaces:\n  GigabitEthernet0/0/0\nInside interfaces:\n  GigabitEthernet0/0/1, GigabitEthernet0/0/2\nHits: 4120  Misses: 0',
        outputKind: 'console',
        verify: ['Total active translations', 'Inside interfaces'],
        whatItMeans: 'One way out means one place to watch, filter and log. The counters say the branch is using it; the LLD says it was meant to.',
        frameworks: ['CCNA'],
      },
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
        'Apply each ACL, then test from the guest VLAN into the LAN and from the user VLAN into management. The tests that must FAIL are the evidence.',
        'The test matrix has blocked rows that are blocked, and allowed rows that still work.',
        {
          usesForm: 'Validation & Test Matrix', producesDeliverable: '07_Security_Baseline_and_Policy.md',
          whatItMeans:
            'The tests that must FAIL are the segmentation evidence. Everything else only proves the network works.',
        }
      ),
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w4-policy-s3',
        title: 'Prove the ACL is applied where the policy says',
        description: 'The list on the right SVI, in the right direction.',
        where: 'SW-CORE-01 — console or SSH',
        instruction: 'Show the access lists and where they are applied. A list that exists but sits on no interface filters nothing.',
        commands: [
          {
            cmd: 'show ip access-lists',
            explain: 'Every ACL with its lines and the match counters. Counters moving on a deny line is the policy doing its job.',
            sample: 'Extended IP access list GUEST-OUT\n    10 permit udp 10.50.50.0 0.0.0.255 host 10.50.20.10 eq domain (218 matches)\n    20 deny ip 10.50.50.0 0.0.0.255 10.50.0.0 0.0.255.255 (41 matches)\n    30 permit ip 10.50.50.0 0.0.0.255 any (3127 matches)',
          },
          {
            cmd: 'show ip interface vlan 50 | include access list',
            explain: 'Which list is inbound on the guest gateway. The line that proves the policy is enforced, not just written.',
            sample: '  Inbound  access list is GUEST-OUT',
          },
        ],
        expectedOutput: 'SW-CORE-01# show ip access-lists\nExtended IP access list GUEST-OUT\n    10 permit udp 10.50.50.0 0.0.0.255 host 10.50.20.10 eq domain (218 matches)\n    20 deny ip 10.50.50.0 0.0.0.255 10.50.0.0 0.0.255.255 (41 matches)\n    30 permit ip 10.50.50.0 0.0.0.255 any (3127 matches)\nSW-CORE-01# show ip interface vlan 50 | include access list\n  Inbound  access list is GUEST-OUT',
        outputKind: 'console',
        verify: ['access list', 'matches'],
        whatItMeans: 'The deny counter is the most honest line on the network: it counts the times a guest tried to reach the LAN and the policy said no.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w4-policy-s4',
        title: 'Prove a blocked path fails and an allowed one works',
        description: 'A guest cannot reach a server; a user can.',
        where: 'SW-CORE-01 — console or SSH',
        instruction: 'Ping a server sourced from the guest gateway, then from the user gateway. The first must fail and the second must succeed. Both results go in the validation record.',
        commands: [
          {
            cmd: 'ping 10.50.20.10 source 10.50.50.1',
            explain: 'Sourced from the guest VLAN. Full stops or U marks are the ACL refusing — the result you want.',
            sample: 'Sending 5, 100-byte ICMP Echos to 10.50.20.10, timeout is 2 seconds:\nPacket sent with a source address of 10.50.50.1\nU.U.U\nSuccess rate is 0 percent (0/5)',
          },
          {
            cmd: 'ping 10.50.20.10 source 10.50.10.1',
            explain: 'Sourced from the user VLAN. Five replies: the policy blocks only who it should.',
            sample: '!!!!!\nSuccess rate is 100 percent (5/5)',
          },
        ],
        expectedOutput: 'SW-CORE-01# ping 10.50.20.10 source 10.50.50.1\nU.U.U\nSuccess rate is 0 percent (0/5)\nSW-CORE-01# ping 10.50.20.10 source 10.50.10.1\n!!!!!\nSuccess rate is 100 percent (5/5)',
        outputKind: 'console',
        verify: ['0 percent', '100 percent'],
        whatItMeans: 'Segmentation is proved by the test that fails. A policy that only lets everything through has not been tested at all.',
        frameworks: ['CCNA'],
      },
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
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w4-harden-s3',
        title: 'Prove SSH-only management',
        description: 'SSH version 2 on; telnet refused.',
        where: 'Each switch — console or SSH',
        instruction: 'Show the SSH status and the VTY lines. Version 2 and transport input ssh are the two facts the hardening form records.',
        commands: [
          {
            cmd: 'show ip ssh',
            explain: 'Whether SSH is enabled and which version. Version 1.99 means both versions; the standard wants 2 only.',
            sample: 'SSH Enabled - version 2.0\nAuthentication methods:publickey,keyboard-interactive,password\nAuthentication timeout: 60 secs; Authentication retries: 3',
          },
          {
            cmd: 'show running-config | section line vty',
            explain: 'The VTY lines with their transport. transport input ssh is the line that turns telnet off.',
            sample: 'line vty 0 4\n login local\n transport input ssh\n access-class MGMT-ONLY in',
          },
        ],
        expectedOutput: 'SW-ACC-01# show ip ssh\nSSH Enabled - version 2.0\nAuthentication timeout: 60 secs; Authentication retries: 3\nSW-ACC-01# show running-config | section line vty\nline vty 0 4\n login local\n transport input ssh\n access-class MGMT-ONLY in',
        outputKind: 'console',
        verify: ['SSH Enabled', 'transport input ssh'],
        whatItMeans: 'Telnet puts the admin password on the wire in clear text. These two lines are how you prove, to an auditor, that it no longer can.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w4-harden-s4',
        title: 'Prove the unused ports are shut and secured',
        description: 'Unused ports down in a parking VLAN; port security on the live ones.',
        where: 'Each switch — console or SSH',
        instruction: 'Show the port status and port-security summary. Every unused port must be disabled; every user port must have a MAC limit.',
        commands: [
          {
            cmd: 'show interfaces status | include disabled',
            explain: 'The ports you shut, each sitting in the parking VLAN. An open unused port is a free seat on the network.',
            sample: 'Gi1/0/19                     disabled     999        auto   auto 10/100/1000BaseTX\nGi1/0/20                     disabled     999        auto   auto 10/100/1000BaseTX',
          },
          {
            cmd: 'show port-security',
            explain: 'Per port: the MAC limit, how many are learnt, and the violation action. Protects the desk ports from a rogue switch.',
            sample: 'Secure Port  MaxSecureAddr  CurrentAddr  SecurityViolation  Security Action\n                (Count)       (Count)          (Count)\n---------------------------------------------------------------------------\n    Gi1/0/1              2            1                  0         Restrict\n    Gi1/0/2              2            1                  0         Restrict',
          },
        ],
        expectedOutput: 'SW-ACC-01# show interfaces status | include disabled\nGi1/0/19                     disabled     999        auto   auto 10/100/1000BaseTX\nSW-ACC-01# show port-security\nSecure Port  MaxSecureAddr  CurrentAddr  SecurityViolation  Security Action\n    Gi1/0/1              2            1                  0         Restrict',
        outputKind: 'console',
        verify: ['disabled', 'Secure Port'],
        whatItMeans: 'Hardening is a list of things turned off. The hardening form cites the standard; these outputs are the evidence each line was done.',
        frameworks: ['CCNA'],
      },
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
        `Create a WLAN per group — corporate, guest, IOT — and map each to its VLAN. Guest on the air must be as isolated as guest on copper.`,
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
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w4-wireless-s3',
        title: 'Prove the access point is on the trunk and powered',
        description: 'PoE delivered; the AP port trunks the wireless VLANs.',
        where: 'Each switch — console or SSH',
        instruction: 'Show the power and the trunk on the access-point port. The AP must draw power and carry the user, guest and IoT VLANs.',
        commands: [
          {
            cmd: 'show power inline',
            explain: 'Which ports deliver PoE and how much. An AP with no power row is an AP that never booted.',
            sample: 'Interface Admin  Oper       Power   Device              Class Max\n                            (Watts)\n--------- ------ ---------- ------- ------------------- ----- ----\nGi1/0/10  auto   on         15.4    AIR-AP2802I-E-K9    4     30.0',
          },
          {
            cmd: 'show interfaces Gi1/0/10 trunk',
            explain: 'The AP port as a trunk with the wireless VLANs allowed. One SSID per VLAN needs them all here.',
            sample: 'Port        Mode             Encapsulation  Status        Native vlan\nGi1/0/10    on               802.1q         trunking      99\n\nPort        Vlans allowed on trunk\nGi1/0/10    10,50,60,99',
          },
        ],
        expectedOutput: 'SW-ACC-01# show power inline\nInterface Admin  Oper       Power   Device              Class Max\nGi1/0/10  auto   on         15.4    AIR-AP2802I-E-K9    4     30.0\nSW-ACC-01# show interfaces Gi1/0/10 trunk\nGi1/0/10    on               802.1q         trunking      99\nGi1/0/10    10,50,60,99',
        outputKind: 'console',
        verify: ['Power', 'trunking'],
        whatItMeans: 'Wireless is wired first: a powered AP on a trunk that carries the right VLANs. The SSIDs are the easy part once this output reads correctly.',
        frameworks: ['CCNA'],
      },
      // R138: the proof step — the output the design produced, pasted and checked.
      {
        id: 'ccna-w4-wireless-s4',
        title: 'Prove a wireless client lands in the right VLAN',
        description: 'A guest device gets a guest address and nothing more.',
        where: 'Each switch — console or SSH',
        instruction: 'Join the guest SSID with a phone, then find its MAC on the switch and the VLAN it was learnt in. Guest must be VLAN 50; staff must be 10.',
        commands: [
          {
            cmd: 'show mac address-table interface Gi1/0/10',
            explain: 'Every client behind the AP with the VLAN its traffic arrived in. The SSID-to-VLAN map, as the switch sees it.',
            sample: '          Mac Address Table\n-------------------------------------------\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n  50    a4c3.f0aa.1b22    DYNAMIC     Gi1/0/10\n  10    3c22.fb01.9d4e    DYNAMIC     Gi1/0/10',
          },
        ],
        expectedOutput: 'SW-ACC-01# show mac address-table interface Gi1/0/10\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n  50    a4c3.f0aa.1b22    DYNAMIC     Gi1/0/10\n  10    3c22.fb01.9d4e    DYNAMIC     Gi1/0/10',
        outputKind: 'console',
        verify: ['Mac Address', 'DYNAMIC'],
        whatItMeans: 'The guest SSID only keeps visitors off the LAN if their frames land in the guest VLAN. The MAC table is where that promise is checked.',
        frameworks: ['CCNA'],
      },
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
      'Write a playbook that adds a VLAN to every access switch from the data in NetBox — and does nothing the second time you run it.',
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
      'Assemble the as-built package: what you really built, the known issues, how credentials pass, and how somebody checks the network is healthy on day one.',
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
  // A class is sixteen groups (R91), like every other capstone.
  teamCount: 16,
  // The compactness contract: one step at a time, explanations one click away.
  // No `manualSections: ['config-guide']` yet, deliberately: the week-by-week
  // procedures are a later round, and a course that declares a guide it has not
  // authored would render an empty section — or worse, another course's.
  topologyPicture: 'campus',
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

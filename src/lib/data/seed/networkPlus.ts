import type { Course, RoleDef, Task, WeekDef } from '../../types';
import { COMPANY, VLANS, WAN, addressIn, device, dhcpRangeOf, gatewayOf, mgmtAddress, prefixOf, vlan } from '../../networkPlusTopology';

/**
 * CompTIA Network+ — the Capstone Branch.
 *
 * A small branch office needs a network: staff PCs, printers, guest WiFi and
 * one router to the ISP. The team designs it, builds it in Cisco Packet
 * Tracer as the sandbox, configures switches, VLANs, routing and services,
 * then operates and improves it: logging, backups, one change done properly,
 * and three injected faults worked by layer. The last graded week moves it
 * toward real equipment the way a team does in practice: research the
 * devices against the design, price a bill of materials, and write the
 * migration plan. An optional advanced week runs the build on the CCNA kit.
 *
 * PACKET TRACER IS THE LAB. Every proof in Weeks 1–3 is `show` output pasted
 * from the simulator's CLI: it is simplified IOS, and the course says so, but
 * a VLAN table, a trunk list, a route table and a DHCP binding are real
 * enough to be checked token by token. No hardware is needed to pass.
 *
 * ONE SHARED BUILD, FOUR FOCUSES (`sharedTrack: true`, `noGatekeeping: true`,
 * like CCNA and A+). Everyone configures and troubleshoots; the focus decides
 * which record a member leads and reviews.
 *
 * Addresses, VLANs, devices and the policy come from `networkPlusTopology.ts`.
 * Not one address is typed in this file.
 */

const STAFF = vlan(10);
const DEVICES_V = vlan(20);
const GUEST = vlan(30);
const MGMT = vlan(99);
const SW1 = device('SW-01');
const SW2 = device('SW-02');
const R1 = device('R1-BR');
const PRINTER = device('PRINTER-1');

const ROLES: RoleDef[] = [
  {
    id: 'design',
    name: 'Network Design (Design Lead)',
    mission: 'Leads the design record: requirements, the addressing plan, the VLAN scheme and the map.',
    color: '#0369a1',
    icon: 'Layers',
  },
  {
    id: 'sw',
    name: 'Switching (Switch Lead)',
    mission: 'Leads the switch record: VLANs, trunks, port security and every access port.',
    color: '#15803d',
    icon: 'Network',
  },
  {
    id: 'rt',
    name: 'Routing & Services (Router Lead)',
    mission: 'Leads the router record: gateways, DHCP, DNS, NAT and the access list.',
    color: '#b45309',
    icon: 'Globe',
  },
  {
    id: 'ops',
    name: 'Operations (Ops Lead)',
    mission: 'Leads the operations record: logging, backups, changes, faults and the migration plan.',
    color: '#7c3aed',
    icon: 'Activity',
  },
];

const WEEKS: WeekDef[] = [
  {
    number: 0,
    title: 'Preparation',
    theme: 'The simulator, a prompt, and the team',
    objective: 'Install Packet Tracer, reach a device prompt, register the lab path, and pick your focus.',
    runs: 'Week 0',
    setup: true,
    stage: 0,
    phase: 'Preparation',
    difficulty: 1,
    objectives: [
      { id: 'get-to-a-prompt', label: 'Get to a prompt', tasks: ['np-w0-tool'] },
      { id: 'register-the-lab-and-the-team', label: 'Register the lab and the team', tasks: ['np-w0-orient'] },
    ],
    milestone: 'Packet Tracer opens, one switch answers at a prompt, and the register names the path, the version and the four focuses.',
  },
  {
    number: 1,
    title: 'Design',
    theme: 'Requirements, addresses, the map',
    objective: 'Discover what the branch needs, plan every subnet and VLAN, and build the empty topology in Packet Tracer.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Design',
    difficulty: 2,
    objectives: [
      { id: 'discover-before-you-design', label: 'Discover before you design', tasks: ['np-w1-requirements'] },
      { id: 'plan-the-addresses-and-the-vlans', label: 'Plan the addresses and the VLANs', tasks: ['np-w1-plan'] },
      { id: 'build-the-empty-topology', label: 'Build the empty topology', tasks: ['np-w1-topology'] },
    ],
    milestone: 'The design brief traces every VLAN to a requirement, the IP plan is derived from one rule, and every device is placed and cabled.',
  },
  {
    number: 2,
    title: 'Configure',
    theme: 'Switches, VLANs, routing, services',
    objective: 'Configure the switches and the router so every VLAN gets an address, a gateway and a way out.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Build',
    difficulty: 3,
    objectives: [
      { id: 'cut-the-switches-into-vlans', label: 'Cut the switches into VLANs', tasks: ['np-w2-switches'] },
      { id: 'route-between-them-and-out', label: 'Route between them and out', tasks: ['np-w2-routing'] },
      { id: 'hand-out-addresses-and-names', label: 'Hand out addresses and names', tasks: ['np-w2-services'] },
    ],
    milestone: 'Every VLAN is on every switch, the trunks carry them, each gateway answers, a PC gets an address from DHCP, and a guest reaches the internet.',
  },
  {
    number: 3,
    title: 'Operate',
    theme: 'Watch it, change it, break it, fix it',
    objective: 'Add logging, back up the configs, enforce the policy, make one change properly, and work three faults.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Operate',
    difficulty: 3,
    objectives: [
      { id: 'watch-it-and-back-it-up', label: 'Watch it and back it up', tasks: ['np-w3-monitor'] },
      { id: 'enforce-the-policy', label: 'Enforce the policy', tasks: ['np-w3-secure'] },
      { id: 'change-it-properly', label: 'Change it properly', tasks: ['np-w3-change'] },
      { id: 'work-three-faults-by-layer', label: 'Work three faults by layer', tasks: ['np-w3-faults'] },
    ],
    milestone: 'Logs land in one place, every config is backed up, Guest is refused the practice, one change went through a record, and three faults are closed with the layer named.',
  },
  {
    number: 4,
    title: 'Toward real equipment',
    theme: 'Research, price, plan the move',
    objective: 'Research real equipment against the design, price a bill of materials, and write the migration plan.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Plan',
    difficulty: 3,
    objectives: [
      { id: 'research-the-equipment', label: 'Research the equipment', tasks: ['np-w4-research'] },
      { id: 'price-the-bill-of-materials', label: 'Price the bill of materials', tasks: ['np-w4-bom'] },
      { id: 'plan-the-move-and-hand-over', label: 'Plan the move and hand over', tasks: ['np-w4-handover'] },
    ],
    milestone: 'Every device in the design has a researched real model with a checked capability, the bill of materials is priced from live listings, and the migration plan is issued.',
  },
  {
    number: 5,
    title: 'On real kit',
    theme: 'The same build, on borrowed switches',
    objective: 'Run the Week 2 build on the CCNA kit if the team can borrow it, and record what differed.',
    runs: 'Week 5',
    advanced: true,
    phase: 'Build again',
    difficulty: 4,
    objectives: [
      { id: 'build-it-on-hardware', label: 'Build it on hardware', tasks: ['np-w5-realkit'] },
      { id: 'write-down-what-differed', label: 'Write down what differed', tasks: ['np-w5-differences'] },
    ],
    milestone: 'The VLANs, trunk and gateways exist on real switches, and the differences from the simulator are a list.',
  },
];

/** A form or simulator-canvas step: no command, a described outcome. `whatItMeans` is required here. */
const plan = (
  id: string,
  title: string,
  where: string,
  instruction: string,
  outcome: string,
  extra: Partial<Task['steps'][number]> & { whatItMeans: string }
): Task['steps'][number] => ({
  id,
  title,
  description: outcome.length > 110 ? `${outcome.slice(0, 107).trimEnd()}…` : outcome,
  where,
  instruction,
  expectedOutput: outcome,
  outputKind: 'result',
  frameworks: ['NETWORK_PLUS'],
  ...extra,
});

const PT = 'Packet Tracer — ';

const TASKS: Task[] = [
  // ── Week 0 — Preparation ──────────────────────────────────────────────────
  {
    id: 'np-w0-tool',
    role: 'ops',
    shared: true,
    week: 0,
    title: 'Install the simulator and get to a prompt',
    objective: 'Install Packet Tracer, place one switch, open its console, and prove a prompt answers.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['01_Lab_and_Path_Register.md'],
    estimatedTime: '30 min',
    difficulty: 1,
    learn: ['What a simulator is', 'The device console', 'IOS modes', 'What Packet Tracer cannot do'],
    tools: ['Packet Tracer', 'Cisco IOS', 'Lab & Path Register form'],
    definitionOfDone: [
      'Packet Tracer opens and its version is in the register',
      'One switch is placed and its CLI answers',
      'The register says this build runs in the simulator',
    ],
    steps: [
      plan(
        'np-w0-tool-s1',
        'Install Packet Tracer and record the version',
        'Your own laptop',
        'Get Packet Tracer from Cisco Networking Academy with a free account, install it, and write the version into the register. Record that this build runs in the simulator.',
        'Packet Tracer opens, its version is in the register, and the path says simulator.',
        {
          usesForm: 'Lab & Path Register',
          instructionList: [
            'Skills for All or NetAcad: a free account gives the download.',
            'Install, open, sign in once; it works offline afterwards.',
            'Help, About: write the version in the register.',
          ],
          fixes: [{ symptom: 'It asks to sign in every time?', fix: 'Sign in once with the account; guest mode limits saves. Record the account type in the register.' }],
          whatItMeans: 'The simulator is simplified IOS. Knowing which version you ran is how a difference from real gear gets explained later.',
        }
      ),
      {
        id: 'np-w0-tool-s2',
        title: 'Place a switch and prove the prompt',
        description: 'One switch on the canvas, its CLI open, two commands that answer.',
        where: `${PT}one switch, the CLI tab`,
        instruction: 'Drag a 2960 onto the canvas, open its CLI tab, press Enter, and run the two commands. Paste what the simulator prints.',
        usesForm: 'Lab & Path Register',
        producesDeliverable: '01_Lab_and_Path_Register.md',
        commands: [
          { cmd: 'enable', explain: 'From user mode to privileged mode. The prompt changes from > to #.', sample: 'Switch>enable\nSwitch#' },
          { cmd: 'show version', explain: 'The simulated model and image. The register records it, model first.', sample: 'Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4, RELEASE SOFTWARE (fc1)\ncisco WS-C2960-24TT-L (PowerPC405) processor (revision B0) with 65536K bytes of memory.' },
        ],
        whatItMeans: 'Everything in this course assumes you can type at a device. Prove it now, not in Week 2 when something else is also broken.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: 'Switch>enable\nSwitch#show version\nCisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE4, RELEASE SOFTWARE (fc1)\ncisco WS-C2960-24TT-L (PowerPC405) processor (revision B0) with 65536K bytes of memory.',
        outputKind: 'console',
        verify: ['Switch#', 'Version'],
      },
    ],
  },
  {
    id: 'np-w0-orient',
    role: 'design',
    shared: true,
    week: 0,
    title: 'Register the lab and the team',
    objective: 'Agree who leads which record, name the project file, and write the company brief the design starts from.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['01_Lab_and_Path_Register.md'],
    estimatedTime: '20 min',
    difficulty: 1,
    learn: ['Focus roles', 'One project file', 'Reading a brief'],
    tools: ['Notes', 'Lab & Path Register form'],
    definitionOfDone: [
      'Each of the four focuses has a named member',
      'One .pkt file is named and shared by the team',
      'The brief is read and the open questions are listed',
    ],
    steps: [
      plan(
        'np-w0-orient-s1',
        'Pick the focus and name the project file',
        'Anywhere — a team decision',
        `Agree who leads Design, Switching, Routing and Operations. Save one project file named branch-t<team>.pkt and record where it lives. Read the brief: ${COMPANY.name}.`,
        'Four names against four focuses, one project file, and a list of questions the brief does not answer.',
        {
          usesForm: 'Lab & Path Register',
          whatItMeans: 'A focus is the record a member leads, not the only work they do. Everyone configures and everyone pastes output.',
        }
      ),
    ],
  },

  // ── Week 1 — Design ───────────────────────────────────────────────────────
  {
    id: 'np-w1-requirements',
    role: 'design',
    shared: true,
    week: 1,
    title: 'Discover before you design',
    objective: 'Turn the brief into requirements: who needs what, what must never reach what, and what the building has.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['02_Design_Brief_and_IP_Plan.md'],
    estimatedTime: '45 min',
    difficulty: 2,
    learn: ['Requirements gathering', 'Trust boundaries', 'Site survey', 'Reading a floor plan'],
    tools: ['Notes', 'Design Brief & IP Plan form'],
    definitionOfDone: [
      'Every group of users is a row with what it needs',
      'The rules that separate groups are written as sentences',
      'The building is surveyed: rooms, drops, where the router lands',
    ],
    steps: [
      plan(
        'np-w1-requirements-s1',
        'Write the requirements from the brief',
        'The design brief',
        `Read the brief and interview the business (your instructor plays it). One row per group: staff, printers, guests, the network team. Then the rules: what must never reach what.`,
        'The brief has one row per group with its needs, and the rules are sentences a manager would sign.',
        {
          usesForm: 'Design Brief & IP Plan',
          instructionList: [
            `${COMPANY.people} people on day one; count the devices, not the people.`,
            'Ask what cannot go down and for how long; that is the availability line.',
            'Ask what a guest may reach. The answer is the first security rule.',
          ],
          whatItMeans: 'A VLAN nobody can trace to a requirement is decoration. The rules written here become the access list in Week 3.',
        }
      ),
      plan(
        'np-w1-requirements-s2',
        'Survey the building',
        'The design brief',
        'Walk the floor plan: the comms cupboard, the rooms, how many drops each needs, where the ISP router lands and where the guest access point goes. Record the constraints.',
        'The survey names the cupboard, the drops per room, the ISP demarcation and the access point location.',
        {
          usesForm: 'Design Brief & IP Plan',
          producesDeliverable: '02_Design_Brief_and_IP_Plan.md',
          whatItMeans: 'The survey is why the design has two switches and not one: the consulting rooms are too far for one cabinet.',
        }
      ),
    ],
  },
  {
    id: 'np-w1-plan',
    role: 'design',
    shared: true,
    week: 1,
    title: 'Plan the addresses and the VLANs',
    objective: 'One VLAN per group, one rule for every address, gateways and pools derived from it, and the management addresses fixed.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['02_Design_Brief_and_IP_Plan.md', '03_VLAN_and_Port_Map.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['Subnetting', 'VLAN design', 'One addressing rule', 'DHCP pools and static hosts', 'Management VLAN'],
    tools: ['Design Brief & IP Plan form', 'VLAN & Port Map form', 'a spreadsheet'],
    prerequisites: ['The requirements rows'],
    definitionOfDone: [
      'Every VLAN has an id, a name, a purpose and a prefix that follows the rule',
      'Every pool leaves room for the static hosts',
      'Every switch and the router have a management address',
    ],
    steps: [
      plan(
        'np-w1-plan-s1',
        'Write the rule, then derive every subnet from it',
        'The IP plan',
        `Adopt one rule: the third octet is the VLAN id, so ${STAFF.name} ${STAFF.id} is ${prefixOf(STAFF)}, gateway ${gatewayOf(STAFF)}. Fill the VLAN table from the rule, never by typing.`,
        'Four VLANs, each with a prefix, a gateway and a pool or a static note, all derived from the one rule.',
        {
          usesForm: 'Design Brief & IP Plan',
          instructionList: [
            `${VLANS.map((v) => `${v.id} ${v.name}: ${prefixOf(v)}, gateway ${gatewayOf(v)}`).join('; ')}.`,
            `Pools start at host 50 so the printers and switches below it are never handed out: ${STAFF.name} ${dhcpRangeOf(STAFF)}.`,
            `${MGMT.name} has no pool: ${SW1.name} ${mgmtAddress(SW1)}, ${SW2.name} ${mgmtAddress(SW2)}, ${R1.name} ${mgmtAddress(R1)}.`,
          ],
          whatItMeans: 'A rule is remembered; a spreadsheet of typed addresses is not. Every later command in this course follows this rule.',
        }
      ),
      plan(
        'np-w1-plan-s2',
        'Map every port before you touch a switch',
        'The VLAN & Port Map',
        'One row per cabled port: switch, port, what plugs in, access or trunk, which VLAN. The two trunks and the ISP link are rows too.',
        'Every device in the design is on a port row, and the two trunks and the WAN link are named on both ends.',
        {
          usesForm: 'VLAN & Port Map',
          producesDeliverable: '03_VLAN_and_Port_Map.md',
          whatItMeans: 'Configuring first and documenting later is how the map and the switch end up different, usually on the port nobody checked.',
        }
      ),
    ],
  },
  {
    id: 'np-w1-topology',
    role: 'sw',
    shared: true,
    week: 1,
    title: 'Build the empty topology',
    objective: 'Place every device from the design, cable it exactly as the port map says, name each device, and prove the links are up.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['03_VLAN_and_Port_Map.md', '04_Configuration_Record.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['Device placement', 'Cable types', 'Hostnames', 'Link state', 'CDP'],
    tools: ['Packet Tracer', 'Cisco IOS', 'VLAN & Port Map form', 'Configuration Record form'],
    prerequisites: ['The VLAN & Port Map'],
    definitionOfDone: [
      'Every device is placed with the model the design names',
      'Every link in the port map exists, on the right ports, and is green',
      'Every switch and the router carry their hostname',
    ],
    steps: [
      plan(
        'np-w1-topology-s1',
        'Place and cable it as the map says',
        `${PT}the canvas`,
        `Place ${R1.model}, two ${SW1.model}, the PCs, the printer, the access point and a cloud for the ISP. Cable each link on the exact ports in the map.`,
        'Every device from the design is on the canvas and every link in the port map exists on its named ports.',
        {
          usesForm: 'VLAN & Port Map',
          instructionList: [
            'Let the simulator pick the cable once, then redo one link by hand to learn which cable it chose.',
            'Match the port names exactly; the map is what the configuration record will cite.',
            'Label each device on the canvas with its hostname from the design.',
          ],
          whatItMeans: 'A port that does not match the map is the first thing a fault hides behind in Week 3.',
        }
      ),
      {
        id: 'np-w1-topology-s2',
        title: 'Name the devices and prove the links',
        description: 'Hostnames set, and every cabled port up on both switches.',
        where: `${PT}${SW1.name}, the CLI tab`,
        instruction: 'Set each hostname from the design, then read the interface state and the neighbours on the first switch. Paste the output into the configuration record.',
        usesForm: 'Configuration Record',
        producesDeliverable: '04_Configuration_Record.md',
        commands: [
          { cmd: `configure terminal\nhostname ${SW1.name}\nend`, explain: 'The name from the design, so every later paste says which device it came from.', sample: `${SW1.name}#` },
          { cmd: 'show ip interface brief | include up', explain: 'Only the ports that are up. Each cabled port in the map should appear.', sample: `FastEthernet0/1        unassigned      YES unset  up                    up\nFastEthernet0/10       unassigned      YES unset  up                    up\nGigabitEthernet0/1     unassigned      YES unset  up                    up\nGigabitEthernet0/2     unassigned      YES unset  up                    up` },
          { cmd: 'show cdp neighbors', explain: 'What is on the other end of each uplink. The router and the second switch should both be listed.', sample: `Device ID    Local Intrfce   Holdtme  Capability  Platform    Port ID\n${R1.name}        Gig 0/1         153      R           ISR4321     Gig 0/0/0\n${SW2.name}        Gig 0/2         167      S           2960        Gig 0/1` },
        ],
        whatItMeans: 'A green link and a neighbour on the far end is the proof the cabling matches the map before any VLAN exists.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: `${SW1.name}#show ip interface brief | include up\nFastEthernet0/1        unassigned      YES unset  up                    up\nGigabitEthernet0/1     unassigned      YES unset  up                    up\n\n${SW1.name}#show cdp neighbors\nDevice ID    Local Intrfce   Holdtme  Capability  Platform    Port ID\n${R1.name}        Gig 0/1         153      R           ISR4321     Gig 0/0/0\n${SW2.name}        Gig 0/2         167      S           2960        Gig 0/1`,
        outputKind: 'console',
        verify: ['up', 'Device ID'],
        fixes: [
          { symptom: 'A link stays red?', fix: 'Wrong cable type, or the port is shut. Replace the cable; on a router port run `no shutdown`.' },
          { symptom: 'CDP shows nothing?', fix: 'Wait thirty seconds of simulation time; CDP announces on a timer. Then check the link is up at both ends.' },
        ],
      },
    ],
  },

  // ── Week 2 — Configure ────────────────────────────────────────────────────
  {
    id: 'np-w2-switches',
    role: 'sw',
    shared: true,
    week: 2,
    title: 'Cut the switches into VLANs',
    objective: 'Create the four VLANs on both switches, put each access port where the map says, and trunk the switches and the router.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['04_Configuration_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['VLANs', 'Access ports', '802.1Q trunks', 'Native VLAN', 'Management SVI'],
    tools: ['Packet Tracer', 'Cisco IOS', 'Configuration Record form'],
    prerequisites: ['The VLAN & Port Map'],
    definitionOfDone: [
      'All four VLANs exist on both switches with the names from the plan',
      'Every access port is in the VLAN the map says',
      'Both trunks carry all four VLANs, native VLAN stated on both ends',
      'Each switch answers on its management address',
    ],
    steps: [
      {
        id: 'np-w2-switches-s1',
        title: 'Create the VLANs and place the access ports',
        description: 'The VLAN table matches the plan, and each port sits where the map says.',
        where: `${PT}${SW1.name}, then ${SW2.name}`,
        instruction: 'Create the four VLANs with their names, then put each access port in its VLAN. Read the table back and paste it into the record.',
        usesForm: 'Configuration Record',
        commands: [
          { cmd: `configure terminal\n${VLANS.map((v) => `vlan ${v.id}\n name ${v.name}`).join('\n')}\nend`, explain: 'The four VLANs with the names from the plan, so the table reads as the design does.', sample: `${SW1.name}(config-vlan)#end\n${SW1.name}#` },
          { cmd: `configure terminal\ninterface FastEthernet0/1\n switchport mode access\n switchport access vlan ${STAFF.id}\ninterface FastEthernet0/10\n switchport mode access\n switchport access vlan ${DEVICES_V.id}\ninterface FastEthernet0/20\n switchport mode access\n switchport access vlan ${GUEST.id}\nend`, explain: 'Each cabled access port in its VLAN, from the port map. Repeat on the second switch for its ports.', sample: `${SW1.name}(config-if)#end\n${SW1.name}#` },
          { cmd: 'show vlan brief', explain: 'The table: every VLAN with its name and the ports in it. This is the proof.', sample: `VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    Fa0/2, Fa0/3, Fa0/4, Fa0/5\n${STAFF.id}   ${STAFF.name}                            active    Fa0/1\n${DEVICES_V.id}   ${DEVICES_V.name}                          active    Fa0/10\n${GUEST.id}   ${GUEST.name}                            active    Fa0/20\n${MGMT.id}   ${MGMT.name}                       active` },
        ],
        whatItMeans: 'A VLAN table that matches the plan on both switches is half of Week 2. The other half is the trunk that joins them.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: `${SW1.name}#show vlan brief\nVLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n1    default                          active    Fa0/2, Fa0/3, Fa0/4, Fa0/5\n${STAFF.id}   ${STAFF.name}                            active    Fa0/1\n${DEVICES_V.id}   ${DEVICES_V.name}                          active    Fa0/10\n${GUEST.id}   ${GUEST.name}                            active    Fa0/20\n${MGMT.id}   ${MGMT.name}                       active`,
        outputKind: 'console',
        verify: [STAFF.name, MGMT.name, 'active'],
        outputHighlights: [{ text: `${STAFF.id}   ${STAFF.name}`, label: 'The VLAN exists with the name from the plan; the ports beside it are the access ports.' }],
      },
      {
        id: 'np-w2-switches-s2',
        title: 'Trunk the switches and the router, and address the management VLAN',
        description: 'Two trunks carrying four VLANs, and a switch that answers on its own address.',
        where: `${PT}${SW1.name}, then ${SW2.name}`,
        instruction: 'Make the two uplinks trunks with the native VLAN stated, give the switch its management address, and read the trunk list back.',
        usesForm: 'Configuration Record',
        producesDeliverable: '04_Configuration_Record.md',
        commands: [
          { cmd: `configure terminal\ninterface range GigabitEthernet0/1 - 2\n switchport mode trunk\n switchport trunk native vlan ${MGMT.id}\nend`, explain: 'Both uplinks as 802.1Q trunks. The native VLAN is stated so the two ends can never disagree by default.', sample: `${SW1.name}(config-if-range)#end\n${SW1.name}#` },
          { cmd: `configure terminal\ninterface vlan ${MGMT.id}\n ip address ${mgmtAddress(SW1)} 255.255.255.0\n no shutdown\nip default-gateway ${gatewayOf(MGMT)}\nend`, explain: 'The management interface, from the plan, and the gateway the network team reaches it through.', sample: `${SW1.name}(config)#end\n${SW1.name}#` },
          { cmd: 'show interfaces trunk', explain: 'The trunks, their native VLAN and the VLANs they carry. All four should be listed as allowed and active.', sample: `Port        Mode         Encapsulation  Status        Native vlan\nGig0/1      on           802.1q         trunking      ${MGMT.id}\nGig0/2      on           802.1q         trunking      ${MGMT.id}\n\nPort        Vlans allowed and active in management domain\nGig0/1      1,${VLANS.map((v) => v.id).join(',')}\nGig0/2      1,${VLANS.map((v) => v.id).join(',')}` },
        ],
        whatItMeans: 'A native VLAN that differs on the two ends of a trunk is the classic fault. Stating it on both ends is the fix.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: `${SW1.name}#show interfaces trunk\nPort        Mode         Encapsulation  Status        Native vlan\nGig0/1      on           802.1q         trunking      ${MGMT.id}\nGig0/2      on           802.1q         trunking      ${MGMT.id}\n\nPort        Vlans allowed and active in management domain\nGig0/1      1,${VLANS.map((v) => v.id).join(',')}\nGig0/2      1,${VLANS.map((v) => v.id).join(',')}`,
        outputKind: 'console',
        verify: ['trunking', 'Native vlan'],
        fixes: [{ symptom: 'A VLAN is allowed but not active on the trunk?', fix: 'It does not exist on this switch yet. Create it here too; a trunk only carries VLANs both ends know.' }],
      },
    ],
  },
  {
    id: 'np-w2-routing',
    role: 'rt',
    shared: true,
    week: 2,
    title: 'Route between them and out',
    objective: 'A subinterface per VLAN on the router over the trunk, a default route to the ISP, and NAT so the branch reaches the internet.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['04_Configuration_Record.md', '05_Services_and_Verification_Log.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Router-on-a-stick', 'Subinterfaces', 'Default routes', 'NAT overload', 'Reading a route table'],
    tools: ['Packet Tracer', 'Cisco IOS', 'ping', 'Configuration Record form', 'Services & Verification Log form'],
    prerequisites: ['The trunks from the switch task'],
    definitionOfDone: [
      'Every VLAN has a gateway on the router that answers a ping',
      'The route table shows one connected route per VLAN and a default route',
      'A staff PC reaches the ISP address through NAT',
    ],
    steps: [
      {
        id: 'np-w2-routing-s1',
        title: 'Give every VLAN a gateway on one trunk',
        description: 'Four subinterfaces, each with the gateway from the plan.',
        where: `${PT}${R1.name}, the CLI tab`,
        instruction: 'Bring the inside interface up, create one subinterface per VLAN with 802.1Q tagging and the gateway address from the plan, then read the route table back.',
        usesForm: 'Configuration Record',
        commands: [
          { cmd: `configure terminal\ninterface GigabitEthernet0/0/0\n no shutdown\n${VLANS.map((v) => `interface GigabitEthernet0/0/0.${v.id}\n encapsulation dot1Q ${v.id}${v.id === MGMT.id ? ' native' : ''}\n ip address ${gatewayOf(v)} 255.255.255.0`).join('\n')}\nend`, explain: 'One subinterface per VLAN, tagged with its id, holding the gateway the plan derived. The management VLAN is the native one.', sample: `${R1.name}(config-subif)#end\n${R1.name}#` },
          { cmd: 'show ip route | include C ', explain: 'One connected route per VLAN. A VLAN missing here has no gateway.', sample: VLANS.map((v) => `C        ${prefixOf(v)} is directly connected, GigabitEthernet0/0/0.${v.id}`).join('\n') },
          { cmd: `ping ${gatewayOf(STAFF)}`, explain: 'From a staff PC: the gateway answers, so the trunk, the tag and the subinterface all agree.', sample: `Reply from ${gatewayOf(STAFF)}: bytes=32 time<1ms TTL=255` },
        ],
        whatItMeans: 'Router-on-a-stick is one trunk doing the work of four cables. A gateway that answers proves the tag matches on both ends.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: `${R1.name}#show ip route | include C \n${VLANS.map((v) => `C        ${prefixOf(v)} is directly connected, GigabitEthernet0/0/0.${v.id}`).join('\n')}`,
        outputKind: 'console',
        verify: ['directly connected', `GigabitEthernet0/0/0.${STAFF.id}`],
      },
      {
        id: 'np-w2-routing-s2',
        title: 'One way out: the default route and NAT',
        description: 'The ISP link addressed, a default route, and the branch hidden behind one public address.',
        where: `${PT}${R1.name}, the CLI tab`,
        instruction: 'Address the ISP interface from the plan, add the default route to the ISP, enable NAT overload for the inside VLANs, and prove it from a staff PC.',
        usesForm: 'Services & Verification Log',
        producesDeliverable: '05_Services_and_Verification_Log.md',
        commands: [
          { cmd: `configure terminal\ninterface GigabitEthernet0/0/1\n ip address ${WAN.router} 255.255.255.252\n ip nat outside\n no shutdown\n${VLANS.filter((v) => v.id !== MGMT.id).map((v) => `interface GigabitEthernet0/0/0.${v.id}\n ip nat inside`).join('\n')}\nip route 0.0.0.0 0.0.0.0 ${WAN.isp}\naccess-list 1 permit 10.70.0.0 0.0.255.255\nip nat inside source list 1 interface GigabitEthernet0/0/1 overload\nend`, explain: 'The outside address, the way out, and NAT: every inside VLAN leaves as the router\'s public address.', sample: `${R1.name}(config)#end\n${R1.name}#` },
          { cmd: `ping ${WAN.isp}`, explain: 'From a staff PC. A reply means the default route and NAT both work; the ISP only ever sees the public address.', sample: `Reply from ${WAN.isp}: bytes=32 time=1ms TTL=254\nReply from ${WAN.isp}: bytes=32 time<1ms TTL=254` },
          { cmd: 'show ip nat translations', explain: 'The translation the ping created: inside local, inside global. Empty means the ping did not pass through NAT.', sample: `Pro  Inside global          Inside local           Outside local          Outside global\nicmp ${WAN.router}:1          10.70.10.50:1          ${WAN.isp}:1          ${WAN.isp}:1` },
        ],
        whatItMeans: 'A branch with one public address is every small office. The translation table is the proof the design, not luck, got the packet out.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: `C:\\> ping ${WAN.isp}\nReply from ${WAN.isp}: bytes=32 time=1ms TTL=254\n\n${R1.name}#show ip nat translations\nPro  Inside global          Inside local           Outside local          Outside global\nicmp ${WAN.router}:1          10.70.10.50:1          ${WAN.isp}:1          ${WAN.isp}:1`,
        outputKind: 'console',
        verify: ['Reply from', 'Inside global'],
        fixes: [{ symptom: 'The ping fails but the gateway answers?', fix: 'Three things, in order: the ISP interface is up, the default route exists in `show ip route`, and the subinterface carries `ip nat inside`.' }],
      },
    ],
  },
  {
    id: 'np-w2-services',
    role: 'rt',
    shared: true,
    week: 2,
    title: 'Hand out addresses and names',
    objective: 'DHCP pools from the plan with the static hosts excluded, DNS passed through, and a client that proves it end to end.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['05_Services_and_Verification_Log.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['DHCP pools', 'Excluded addresses', 'DNS forwarding', 'ipconfig', 'A test matrix'],
    tools: ['Packet Tracer', 'Cisco IOS', 'nslookup', 'Services & Verification Log form'],
    definitionOfDone: [
      'A pool per client VLAN with the gateway and the DNS server set',
      'The static hosts are excluded and the printer keeps its address',
      'A staff PC and a guest get addresses from the right pools',
      'The test matrix has a row per rule with its result',
    ],
    steps: [
      {
        id: 'np-w2-services-s1',
        title: 'Serve the pools from the plan',
        description: 'Three pools, each with the gateway and the resolver, nothing below host 50.',
        where: `${PT}${R1.name}, the CLI tab`,
        instruction: 'Exclude the static range in each VLAN, create a pool per client VLAN with its gateway and resolver, then set a PC to DHCP and read what it got.',
        usesForm: 'Services & Verification Log',
        commands: [
          { cmd: `configure terminal\n${VLANS.filter((v) => v.pool).map((v) => `ip dhcp excluded-address ${addressRange(v)}\nip dhcp pool ${v.name.toUpperCase()}\n network ${prefixOf(v).replace('/24', '')} 255.255.255.0\n default-router ${gatewayOf(v)}\n dns-server ${WAN.dns}`).join('\n')}\nend`, explain: 'The static hosts excluded first, then one pool per client VLAN. The pool hands out the gateway and the resolver with the address.', sample: `${R1.name}(dhcp-config)#end\n${R1.name}#` },
          { cmd: 'ipconfig /renew', explain: 'On a staff PC set to DHCP. The address is in the pool, the gateway is the subinterface, the DNS server is the resolver.', sample: `   IPv4 Address......................: 10.70.10.50\n   Subnet Mask.......................: 255.255.255.0\n   Default Gateway...................: ${gatewayOf(STAFF)}\n   DNS Server........................: ${WAN.dns}` },
          { cmd: 'show ip dhcp binding', explain: 'On the router: the lease, with the client\'s hardware address. One row per client that asked.', sample: `IP address       Client-ID/              Lease expiration        Type\n                 Hardware address\n10.70.10.50      0001.9647.3D1A          --                      Automatic\n10.70.30.50      0002.4A11.B2C3          --                      Automatic` },
        ],
        whatItMeans: 'DHCP is where the design meets a real client. A wrong gateway in a pool looks exactly like a routing fault and wastes an afternoon.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: `C:\\> ipconfig /renew\n   IPv4 Address......................: 10.70.10.50\n   Default Gateway...................: ${gatewayOf(STAFF)}\n   DNS Server........................: ${WAN.dns}\n\n${R1.name}#show ip dhcp binding\nIP address       Client-ID/              Lease expiration        Type\n10.70.10.50      0001.9647.3D1A          --                      Automatic`,
        outputKind: 'console',
        verify: ['Default Gateway', 'Automatic'],
        fixes: [{ symptom: 'The PC gets 169.254.x.x?', fix: 'The request never reached a pool. The port is in the wrong VLAN, the subinterface is down, or the pool\'s network does not match the VLAN prefix.' }],
      },
      {
        id: 'np-w2-services-s2',
        title: 'Prove every rule in the test matrix',
        description: 'One row per rule in the policy, each with a ping result and a reason.',
        where: `${PT}each PC, the Command Prompt`,
        instruction: 'From a staff PC and a guest, test each line of the policy: what should work and, for now, what still works but must not. Record each as a row.',
        usesForm: 'Services & Verification Log',
        producesDeliverable: '05_Services_and_Verification_Log.md',
        commands: [
          { cmd: `ping ${mgmtAddress(PRINTER)}`, explain: 'From a staff PC: the printer answers, so Staff reaches Devices as the policy allows.', sample: `Reply from ${mgmtAddress(PRINTER)}: bytes=32 time<1ms TTL=127` },
          { cmd: `ping ${mgmtAddress(PRINTER)}`, explain: 'From the guest laptop: today this also answers, and the row says MUST FAIL. Week 3 makes it fail.', sample: `Reply from ${mgmtAddress(PRINTER)}: bytes=32 time<1ms TTL=127` },
          { cmd: `nslookup example.com`, explain: 'From a staff PC: the resolver the pool handed out answers a name.', sample: `Server:  [${WAN.dns}]\nAddress:  ${WAN.dns}\n\nNon-authoritative answer:\nName:    example.com\nAddress:  203.0.113.80` },
        ],
        whatItMeans: 'A test matrix with a row that says MUST FAIL and currently passes is an honest network. Week 3 closes it.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: `C:\\> ping ${mgmtAddress(PRINTER)}\nReply from ${mgmtAddress(PRINTER)}: bytes=32 time<1ms TTL=127\n\nC:\\> nslookup example.com\nServer:  [${WAN.dns}]\nName:    example.com\nAddress:  203.0.113.80`,
        outputKind: 'console',
        verify: ['Reply from', 'Name:'],
      },
    ],
  },

  // ── Week 3 — Operate ──────────────────────────────────────────────────────
  {
    id: 'np-w3-monitor',
    role: 'ops',
    shared: true,
    week: 3,
    title: 'Watch it and back it up',
    objective: 'Send every device\'s logs to one place, set the clock, and save every running configuration off the device.',
    frameworks: ['NETWORK_PLUS', 'ITIL'],
    deliverables: ['06_Change_and_Fault_Log.md'],
    estimatedTime: '45 min',
    difficulty: 2,
    learn: ['Syslog', 'NTP and timestamps', 'Configuration backups', 'TFTP'],
    tools: ['Packet Tracer', 'Cisco IOS', 'Change & Fault Log form'],
    definitionOfDone: [
      'A syslog server receives a message from each device',
      'Every device has the clock set and timestamps on',
      'Each running configuration is saved to the server and named',
    ],
    steps: [
      {
        id: 'np-w3-monitor-s1',
        title: 'Logs to one place, with the time on them',
        description: 'A server in the management VLAN receives a timestamped message from each device.',
        where: `${PT}a Server-PT in ${MGMT.name}, then each device`,
        instruction: 'Add a server to the management VLAN with syslog on, point every device at it with timestamps enabled, and make one change so a message arrives.',
        usesForm: 'Change & Fault Log',
        commands: [
          { cmd: `configure terminal\nservice timestamps log datetime msec\nlogging host ${addressIn(MGMT, 10)}\nlogging trap informational\nend`, explain: 'Every log line gets a time and goes to the server. Repeat on both switches and the router.', sample: `${SW1.name}(config)#end\n${SW1.name}#` },
          { cmd: 'show logging | include Logging to', explain: 'The device confirms where it sends. The server\'s address should be on the line.', sample: `    Logging to ${addressIn(MGMT, 10)}, 3 message lines logged` },
        ],
        whatItMeans: 'A fault in Week 3 is found in the log first. A log with no timestamps is a story nobody can order.',
        frameworks: ['NETWORK_PLUS', 'ITIL'],
        expectedOutput: `${SW1.name}#show logging | include Logging to\n    Logging to ${addressIn(MGMT, 10)}, 3 message lines logged`,
        outputKind: 'console',
        verify: ['Logging to'],
      },
      {
        id: 'np-w3-monitor-s2',
        title: 'Back up every configuration off the device',
        description: 'Three files on the server, each named for its device and the date.',
        where: `${PT}each device, the CLI tab`,
        instruction: 'Turn TFTP on the server, copy each running configuration to it named device-date, and list what landed. Record the three names in the log.',
        usesForm: 'Change & Fault Log',
        producesDeliverable: '06_Change_and_Fault_Log.md',
        commands: [
          { cmd: `copy running-config tftp://${addressIn(MGMT, 10)}/${SW1.name}-20261103.cfg`, explain: 'The configuration as it runs now, to the server, under a name that says which device and when.', sample: `Address or name of remote host [${addressIn(MGMT, 10)}]? \nDestination filename [${SW1.name}-20261103.cfg]? \n\nWriting running-config...!!\n[OK - 1342 bytes]` },
          { cmd: 'show running-config | include hostname', explain: 'The one line that proves the file you copied was this device\'s.', sample: `hostname ${SW1.name}` },
        ],
        whatItMeans: 'A backup taken before the change is the way back. Week 3 changes nothing without one.',
        frameworks: ['NETWORK_PLUS', 'ITIL'],
        expectedOutput: `${SW1.name}#copy running-config tftp://${addressIn(MGMT, 10)}/${SW1.name}-20261103.cfg\nWriting running-config...!!\n[OK - 1342 bytes]`,
        outputKind: 'console',
        verify: ['[OK'],
        fixes: [{ symptom: 'Timeout on the copy?', fix: 'The server\'s TFTP service is off, or the switch has no management address in the same VLAN. Check both.' }],
      },
    ],
  },
  {
    id: 'np-w3-secure',
    role: 'sw',
    shared: true,
    week: 3,
    title: 'Enforce the policy',
    objective: 'Turn the written rules into an access list that refuses Guest the practice, and lock the access ports to one device each.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['05_Services_and_Verification_Log.md', '04_Configuration_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Access lists', 'Where to apply an ACL', 'Port security', 'Proving a refusal'],
    tools: ['Packet Tracer', 'Cisco IOS', 'ping', 'Services & Verification Log form'],
    prerequisites: ['The test matrix rows marked MUST FAIL', 'A backup of every configuration'],
    definitionOfDone: [
      'Guest cannot reach Staff, Devices or Management, and still reaches the internet',
      'Every MUST FAIL row in the matrix now fails, with the output pasted',
      'Access ports accept one device and shut on a second',
    ],
    steps: [
      {
        id: 'np-w3-secure-s1',
        title: 'Write the access list from the policy and prove the refusal',
        description: 'Guest to the practice denied, Guest to the internet allowed, applied inbound on the guest subinterface.',
        where: `${PT}${R1.name}, then the guest laptop`,
        instruction: 'Write the list from the policy table, apply it inbound on the Guest subinterface, then rerun the MUST FAIL rows from the guest and the MUST PASS rows from staff.',
        usesForm: 'Services & Verification Log',
        producesDeliverable: '05_Services_and_Verification_Log.md',
        commands: [
          { cmd: `configure terminal\nip access-list extended GUEST-IN\n deny ip ${prefixOf(GUEST).replace('/24', '')} 0.0.0.255 ${prefixOf(STAFF).replace('/24', '')} 0.0.0.255\n deny ip ${prefixOf(GUEST).replace('/24', '')} 0.0.0.255 ${prefixOf(DEVICES_V).replace('/24', '')} 0.0.0.255\n deny ip ${prefixOf(GUEST).replace('/24', '')} 0.0.0.255 ${prefixOf(MGMT).replace('/24', '')} 0.0.0.255\n permit ip any any\ninterface GigabitEthernet0/0/0.${GUEST.id}\n ip access-group GUEST-IN in\nend`, explain: 'Three denies that are the policy table, then permit the rest, so guests still reach the internet. Applied where guest traffic enters.', sample: `${R1.name}(config-subif)#end\n${R1.name}#` },
          { cmd: `ping ${mgmtAddress(PRINTER)}`, explain: 'From the guest laptop: it must fail now. The failure is the evidence.', sample: `Reply from ${gatewayOf(GUEST)}: Destination host unreachable.` },
          { cmd: 'show access-lists GUEST-IN', explain: 'The match counters: the deny lines count the refused pings. A deny with no matches was never tested.', sample: `Extended IP access list GUEST-IN\n    10 deny ip ${prefixOf(GUEST).replace('/24', '')} 0.0.0.255 ${prefixOf(STAFF).replace('/24', '')} 0.0.0.255\n    20 deny ip ${prefixOf(GUEST).replace('/24', '')} 0.0.0.255 ${prefixOf(DEVICES_V).replace('/24', '')} 0.0.0.255 (4 match(es))\n    30 deny ip ${prefixOf(GUEST).replace('/24', '')} 0.0.0.255 ${prefixOf(MGMT).replace('/24', '')} 0.0.0.255\n    40 permit ip any any (12 match(es))` },
        ],
        whatItMeans: 'A security rule is proved by what is refused, not by what is allowed. The counters say the refusal happened.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: `C:\\> ping ${mgmtAddress(PRINTER)}\nReply from ${gatewayOf(GUEST)}: Destination host unreachable.\n\n${R1.name}#show access-lists GUEST-IN\nExtended IP access list GUEST-IN\n    20 deny ip ${prefixOf(GUEST).replace('/24', '')} 0.0.0.255 ${prefixOf(DEVICES_V).replace('/24', '')} 0.0.0.255 (4 match(es))\n    40 permit ip any any (12 match(es))`,
        outputKind: 'console',
        verify: ['unreachable', 'match(es)'],
      },
      {
        id: 'np-w3-secure-s2',
        title: 'Lock the access ports',
        description: 'One device per access port, learned and kept; a second one shuts the port.',
        where: `${PT}${SW1.name}, the CLI tab`,
        instruction: 'Enable port security on the staff access port with one sticky address, then plug a second PC into it and read the port state.',
        usesForm: 'Configuration Record',
        commands: [
          { cmd: 'configure terminal\ninterface FastEthernet0/1\n switchport port-security\n switchport port-security maximum 1\n switchport port-security mac-address sticky\n switchport port-security violation shutdown\nend', explain: 'The port learns the first address and keeps it; a different one shuts the port down.', sample: `${SW1.name}(config-if)#end\n${SW1.name}#` },
          { cmd: 'show port-security interface FastEthernet0/1', explain: 'The state after a second device: Secure-shutdown, with the violation count. Reset it with shut and no shut once the stray device is gone.', sample: 'Port Security              : Enabled\nPort Status                : Secure-shutdown\nViolation Mode             : Shutdown\nMaximum MAC Addresses      : 1\nSticky MAC Addresses       : 1\nSecurity Violation Count   : 1' },
        ],
        whatItMeans: 'Port security is the cheapest control a branch has: a visitor cannot unplug the printer and plug in a laptop.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: `${SW1.name}#show port-security interface FastEthernet0/1\nPort Security              : Enabled\nPort Status                : Secure-shutdown\nViolation Mode             : Shutdown\nMaximum MAC Addresses      : 1\nSecurity Violation Count   : 1`,
        outputKind: 'console',
        verify: ['Port Security', 'Violation'],
      },
    ],
  },
  {
    id: 'np-w3-change',
    role: 'ops',
    shared: true,
    week: 3,
    title: 'Change it properly',
    objective: 'The business adds a room: record the change, back up first, add the VLAN end to end, verify, and write the way back.',
    frameworks: ['NETWORK_PLUS', 'ITIL'],
    deliverables: ['06_Change_and_Fault_Log.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Change requests', 'Backup before change', 'Rollback', 'Peer review'],
    tools: ['Packet Tracer', 'Cisco IOS', 'Change & Fault Log form'],
    prerequisites: ['The configuration backups from the monitor task'],
    definitionOfDone: [
      'The change is a record: what, why, the risk, the way back, who reviewed',
      'A backup was taken before the change and named in the record',
      'The new VLAN exists on both switches and the router with a gateway and a pool',
      'The verification rows pass and a teammate signed the review',
    ],
    steps: [
      plan(
        'np-w3-change-s1',
        'Write the change before you make it',
        'The Change & Fault Log',
        'The business adds a treatment room: VLAN 40, Treatment. Write the change request: what changes on which devices, why, the risk, the rollback, and who reviews it.',
        'The change record is filled and reviewed by a teammate before any command runs.',
        {
          usesForm: 'Change & Fault Log',
          instructionList: [
            'Derive the new prefix from the rule: 10.70.40.0/24, gateway .1, pool from host 50.',
            'List every device the change touches and the lines each gets.',
            'The rollback is the backup file name plus the commands that remove the VLAN.',
          ],
          whatItMeans: 'A change written down first can be reviewed, reversed and explained. One typed straight in can only be regretted.',
        }
      ),
      {
        id: 'np-w3-change-s2',
        title: 'Back up, make the change, verify, close it',
        description: 'The same three steps on every device, then the proof that the new room works.',
        where: `${PT}each device, then a PC in the new VLAN`,
        instruction: 'Back up each running configuration first, then add VLAN 40 on both switches and the router with its subinterface and pool. Verify from a PC and close the record.',
        usesForm: 'Change & Fault Log',
        producesDeliverable: '06_Change_and_Fault_Log.md',
        commands: [
          { cmd: `copy running-config tftp://${addressIn(MGMT, 10)}/${R1.name}-pre-change-40.cfg`, explain: 'The way back, taken first and named for the change.', sample: 'Writing running-config...!!\n[OK - 2210 bytes]' },
          { cmd: `configure terminal\ninterface GigabitEthernet0/0/0.40\n encapsulation dot1Q 40\n ip address 10.70.40.1 255.255.255.0\n ip nat inside\nip dhcp excluded-address 10.70.40.1 10.70.40.49\nip dhcp pool TREATMENT\n network 10.70.40.0 255.255.255.0\n default-router 10.70.40.1\n dns-server ${WAN.dns}\nend`, explain: 'On the router: the subinterface, NAT inside and the pool, derived from the same rule as every other VLAN. The switches get `vlan 40` and an access port.', sample: `${R1.name}(dhcp-config)#end\n${R1.name}#` },
          { cmd: 'show ip interface brief | include 0/0/0.40', explain: 'The new subinterface is up with its gateway address.', sample: 'GigabitEthernet0/0/0.40    10.70.40.1      YES manual up                    up' },
        ],
        whatItMeans: 'The change is closed by a verification row and a reviewer\'s name, not by the last command running without an error.',
        frameworks: ['NETWORK_PLUS', 'ITIL'],
        expectedOutput: `${R1.name}#show ip interface brief | include 0/0/0.40\nGigabitEthernet0/0/0.40    10.70.40.1      YES manual up                    up`,
        outputKind: 'console',
        verify: ['0/0/0.40', 'up'],
      },
    ],
  },
  {
    id: 'np-w3-faults',
    role: 'ops',
    shared: true,
    week: 3,
    title: 'Work three faults by layer',
    objective: 'Another team breaks three things in the project file. Work each as a ticket, bottom layer up, and close it with the layer named.',
    frameworks: ['NETWORK_PLUS', 'ITIL'],
    deliverables: ['06_Change_and_Fault_Log.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 3,
    learn: ['The troubleshooting method', 'Layer by layer', 'Reading show output under pressure', 'What a log line tells you'],
    tools: ['Packet Tracer', 'Cisco IOS', 'ping', 'Change & Fault Log form'],
    prerequisites: ['The known-good test matrix', 'A backup of every configuration'],
    definitionOfDone: [
      'Three fault tickets, each opened from the symptom as reported',
      'Each ticket names the layer, what was ruled out, the cause and the fix',
      'The test matrix passes again after each fix',
    ],
    steps: [
      plan(
        'np-w3-faults-s1',
        'Receive the faults and open the tickets',
        'The Change & Fault Log',
        'Another team injects three faults into a copy of your project file: one link, one switching, one routing or service. Open a ticket for each from the symptom alone.',
        'Three tickets are open, each with the symptom as the user reported it and no cause yet.',
        {
          usesForm: 'Change & Fault Log',
          instructionList: [
            'Suggested faults: a shut port, a wrong native VLAN, a pool with the wrong gateway, a deleted default route.',
            'The symptom is what the user sees: "reception cannot print", not "the trunk is wrong".',
          ],
          whatItMeans: 'A ticket that opens with the cause skips the method. The symptom is where the method starts.',
        }
      ),
      {
        id: 'np-w3-faults-s2',
        title: 'Work each one bottom up',
        description: 'Link, then VLAN, then trunk, then route, then service: stop at the layer that fails.',
        where: `${PT}the affected PC, then each device on the path`,
        instruction: 'For each ticket, test the path from the bottom: link, VLAN and port, trunk, gateway, route, service. Record what each layer showed and where it broke.',
        usesForm: 'Change & Fault Log',
        producesDeliverable: '06_Change_and_Fault_Log.md',
        commands: [
          { cmd: `ping ${gatewayOf(STAFF)}`, explain: 'From the affected PC. A gateway that answers clears the link, the VLAN and the trunk in one test.', sample: 'Request timed out.\nRequest timed out.' },
          { cmd: 'show interfaces trunk', explain: 'On the switch: the native VLAN and the allowed list on both trunks. A mismatch or a missing VLAN shows here.', sample: `Port        Mode         Encapsulation  Status        Native vlan\nGig0/1      on           802.1q         trunking      1\nGig0/2      on           802.1q         trunking      ${MGMT.id}` },
          { cmd: 'show ip route 0.0.0.0', explain: 'On the router: the default route exists, or the internet fault is here and nowhere else.', sample: `% Network not in table` },
          { cmd: 'show logging | include changed state', explain: 'The log says which port changed state and when; the time pins it to the injection.', sample: '*Nov 3 10:14:02.311: %LINK-5-CHANGED: Interface GigabitEthernet0/1, changed state to administratively down' },
        ],
        whatItMeans: 'Bottom up, one layer at a time, is slower for the first minute and faster for the next hour. The log tells you where to start.',
        frameworks: ['NETWORK_PLUS', 'ITIL'],
        expectedOutput: `${SW1.name}#show interfaces trunk\nPort        Mode         Encapsulation  Status        Native vlan\nGig0/1      on           802.1q         trunking      1\nGig0/2      on           802.1q         trunking      ${MGMT.id}\n\n${SW1.name}#show logging | include changed state\n*Nov 3 10:14:02.311: %LINK-5-CHANGED: Interface GigabitEthernet0/1, changed state to administratively down`,
        outputKind: 'console',
        verify: ['Native vlan', 'changed state'],
        fixes: [
          { symptom: 'The gateway answers but the internet does not?', fix: 'Layer 3 and above: the default route, then NAT inside on the subinterface, then the ISP interface.' },
          { symptom: 'One VLAN works and another does not across the trunk?', fix: 'The allowed list or a missing VLAN on the far switch. `show interfaces trunk` on both ends.' },
        ],
      },
    ],
  },

  // ── Week 4 — Toward real equipment ────────────────────────────────────────
  {
    id: 'np-w4-research',
    role: 'design',
    shared: true,
    week: 4,
    title: 'Research the equipment',
    objective: 'For every device in the design, find a real model that does what the design needs, and record the one capability to check before buying.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['07_Equipment_Research_and_BOM.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Reading a datasheet', 'Managed versus smart switches', 'PoE budgets', 'Routers with two interfaces', 'Used-market models'],
    tools: ['The vendor support site', 'Equipment Research & BOM form', 'a spreadsheet'],
    prerequisites: ['The design brief and the port map', 'The CCNA buying guide in that course\'s manual, as the reference'],
    definitionOfDone: [
      'Every device class in the design has at least two real candidate models',
      'Each candidate has the capability the design needs, read from the datasheet',
      'Each candidate names the one thing to check before buying',
    ],
    steps: [
      plan(
        'np-w4-research-s1',
        'Turn the design into capabilities, not models',
        'The research form',
        'For each device in the design, write what it must do: ports and speed, trunks, PoE for the access point, two routed interfaces and NAT. Capabilities first, models second.',
        'A capability list per device class, traced to the port map and the policy.',
        {
          usesForm: 'Equipment Research & BOM',
          instructionList: [
            'Count the ports from the port map and add a quarter for growth.',
            'The access point needs PoE from the switch or an injector; write which.',
            'The router needs two routed interfaces and NAT overload; the ISP says what the WAN port must be.',
          ],
          whatItMeans: 'A model is a name that goes out of stock. A capability is what the design actually needs, and it is what you check when the box arrives.',
        }
      ),
      plan(
        'np-w4-research-s2',
        'Find two real candidates per class and the thing to check',
        'Vendor sites and the used market',
        'For each class, find two real models, new or used, read the datasheet for the capability, and write the one check before buying: console port, PoE budget, interface count.',
        'Two candidates per class with the datasheet line that proves the capability and the pre-purchase check.',
        {
          usesForm: 'Equipment Research & BOM',
          producesDeliverable: '07_Equipment_Research_and_BOM.md',
          instructionList: [
            'Managed, not "smart": it must have a console port and a CLI. A datasheet says which.',
            'Read the PoE budget in watts against the access point\'s draw.',
            'Second-hand is fine; the CCNA buying guide lists representative models and bands.',
          ],
          whatItMeans: 'The team that reads the datasheet buys a switch that routes, or knows it did not. The team that reads the listing finds out on install day.',
        }
      ),
    ],
  },
  {
    id: 'np-w4-bom',
    role: 'ops',
    shared: true,
    week: 4,
    title: 'Price the bill of materials',
    objective: 'One line per item with a live price and a source, cables and the ISP service included, totalled with a cheaper and a safer option.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['07_Equipment_Research_and_BOM.md'],
    estimatedTime: '45 min',
    difficulty: 2,
    learn: ['Bills of materials', 'Total cost', 'Cables, racks and patching', 'Lead times'],
    tools: ['Equipment Research & BOM form', 'a spreadsheet'],
    definitionOfDone: [
      'Every line has a quantity, a price, the date and a source link',
      'Cables, patch panel, rack or wall cabinet and the ISP service are lines',
      'Two totals: the cheapest that meets the design, and the one the team recommends',
    ],
    steps: [
      plan(
        'np-w4-bom-s1',
        'Price every line from a real listing',
        'The research form',
        'One row per item: the candidate, the quantity, the price with its date and source, the lead time. Add the lines a design forgets: cables, cabinet, the ISP service.',
        'A bill of materials with a priced, dated, sourced row per item and two totals.',
        {
          usesForm: 'Equipment Research & BOM',
          producesDeliverable: '07_Equipment_Research_and_BOM.md',
          instructionList: [
            'Prices go stale: write the date beside each one.',
            'Two totals: the cheapest set that meets every capability, and the set you recommend, with the reason.',
            'A used switch with no warranty is a risk line, not a saving.',
          ],
          whatItMeans: 'The bill of materials is what the business signs. A total with no cables in it is wrong by a day\'s work.',
        }
      ),
    ],
  },
  {
    id: 'np-w4-handover',
    role: 'design',
    shared: true,
    week: 4,
    title: 'Plan the move and hand over',
    objective: 'Write how the simulated build becomes the real one: the order of work, the configurations to load, the tests, the risks, and the handover.',
    frameworks: ['NETWORK_PLUS', 'ITIL'],
    deliverables: ['08_Migration_Plan_and_Handover.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['Migration planning', 'What a simulator did not teach', 'Day-one checks', 'As-built documentation', 'Chain of custody'],
    tools: ['Migration Plan & Handover form', 'sha256sum'],
    prerequisites: ['Every other form submitted', 'The configuration backups'],
    definitionOfDone: [
      'The plan orders the work: cupboard, cables, switches, router, ISP, tests',
      'Each configuration backup is named as the file to load, with the differences real IOS needs',
      'The differences between the simulator and real gear are listed honestly',
      'Every artifact is a custody row with a hash',
    ],
    steps: [
      plan(
        'np-w4-handover-s1',
        'Write the migration plan',
        'The handover form',
        'Order the install, name the backup each device loads, list what real IOS needs that the simulator did not, the tests to rerun, and each risk with its rollback.',
        'A stranger with the boxes, the plan and the backup files could build the branch in a day and prove it.',
        {
          usesForm: 'Migration Plan & Handover',
          instructionList: [
            'Install order: cabinet and power, patch panel and cables, switches, router, ISP handover, then the test matrix.',
            'Simulator gaps to list: SSH and local users, NTP, the real interface names, PoE, the real resolver.',
            'Every risk has a rollback line: the backup file and the command that reverses the step.',
          ],
          whatItMeans: 'The simulator taught the design; the plan is where the team admits what it did not teach, before the ISP engineer is standing there.',
        }
      ),
      {
        id: 'np-w4-handover-s2',
        title: 'Hash every artifact and hand it over',
        description: 'The project file, the backups, the matrix exports: each a custody row with its digest.',
        where: 'Your own laptop — a terminal',
        instruction: 'Hash the project file and every configuration backup, log each as a custody row, then issue the handover with the as-built, the known issues and a first-day check.',
        usesForm: 'Migration Plan & Handover',
        producesDeliverable: '08_Migration_Plan_and_Handover.md',
        commands: [
          { cmd: 'sha256sum branch-t1.pkt *.cfg', explain: 'The project file and every backup in one pass; each line is a custody row.', sample: `3f9a…c21e  branch-t1.pkt\n7b02…e4d9  ${SW1.name}-20261103.cfg\n91ad…0f3b  ${SW2.name}-20261103.cfg\nc4e1…77a8  ${R1.name}-20261103.cfg` },
        ],
        whatItMeans: 'The backups are the build. A hash per file lets the install-day team prove they loaded what the design team handed over.',
        frameworks: ['NETWORK_PLUS', 'ITIL'],
        expectedOutput: `$ sha256sum branch-t1.pkt *.cfg\n3f9a…c21e  branch-t1.pkt\n7b02…e4d9  ${SW1.name}-20261103.cfg\nc4e1…77a8  ${R1.name}-20261103.cfg`,
        outputKind: 'console',
        verify: ['.pkt', '.cfg'],
      },
    ],
  },

  // ── Week 5 — advanced: on real kit ────────────────────────────────────────
  {
    id: 'np-w5-realkit',
    role: 'sw',
    shared: true,
    week: 5,
    title: 'Build it on hardware',
    objective: 'Borrow the CCNA kit, load the Week 2 build onto real switches and a router, and record every difference from the simulator.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['08_Migration_Plan_and_Handover.md'],
    estimatedTime: '2 h',
    difficulty: 4,
    learn: ['Console access', 'Real IOS differences', 'Interface names', 'What copper teaches'],
    tools: ['Cisco IOS', 'Console cable', 'A terminal program', 'Migration Plan & Handover form'],
    prerequisites: ['The CCNA kit, borrowed or shared', 'The configuration backups and the migration plan'],
    definitionOfDone: [
      'The VLANs, the trunk and the gateways exist on real switches and a router',
      'The test matrix was rerun and each row recorded',
      'The differences from the simulator are a list in the handover',
    ],
    steps: [
      {
        id: 'np-w5-realkit-s1',
        title: 'Load the build and rerun the matrix',
        description: 'The same VLAN table and trunk on real gear, with the differences written down.',
        where: 'A real switch — console cable and a terminal program',
        instruction: 'Console into the switch, paste the Week 2 configuration with the real interface names, and read the VLAN table and the trunk back. Rerun the matrix and note every difference.',
        usesForm: 'Migration Plan & Handover',
        producesDeliverable: '08_Migration_Plan_and_Handover.md',
        commands: [
          { cmd: 'show vlan brief', explain: 'The same table as the simulator, on hardware. Interface names will differ; the VLANs must not.', sample: `VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n${STAFF.id}   ${STAFF.name}                            active    Gi1/0/1\n${MGMT.id}   ${MGMT.name}                       active` },
          { cmd: 'show interfaces trunk', explain: 'Real IOS prints more; the native VLAN and the allowed list are what you compare.', sample: `Port        Mode             Encapsulation  Status        Native vlan\nGi1/0/24    on               802.1q         trunking      ${MGMT.id}` },
        ],
        whatItMeans: 'Hardware teaches what a simulator cannot: a bad patch lead, a port that negotiates wrong, a trunk that will not come up. The list of differences is the lesson.',
        frameworks: ['NETWORK_PLUS'],
        expectedOutput: `Switch#show vlan brief\nVLAN Name                             Status    Ports\n${STAFF.id}   ${STAFF.name}                            active    Gi1/0/1\n\nSwitch#show interfaces trunk\nPort        Mode             Encapsulation  Status        Native vlan\nGi1/0/24    on               802.1q         trunking      ${MGMT.id}`,
        outputKind: 'console',
        verify: [STAFF.name, 'trunking'],
      },
    ],
  },
  {
    id: 'np-w5-differences',
    role: 'ops',
    shared: true,
    week: 5,
    title: 'Write down what differed',
    objective: 'Every place the hardware behaved differently from the simulator, as a list the migration plan carries.',
    frameworks: ['NETWORK_PLUS'],
    deliverables: ['08_Migration_Plan_and_Handover.md'],
    estimatedTime: '30 min',
    difficulty: 3,
    learn: ['Honest known issues', 'Simulator limits', 'Interface naming'],
    tools: ['Migration Plan & Handover form', 'Notes'],
    definitionOfDone: ['Each difference names the device, what the simulator did and what the hardware did', 'The migration plan gaps section is updated from the list'],
    steps: [
      plan(
        'np-w5-differences-s1',
        'List the differences and update the plan',
        'The handover form',
        'One row per difference: the device, what Packet Tracer did, what the hardware did, and what the plan now says instead. Update the simulator-gaps section from the rows.',
        'The handover carries a list of differences, and the gaps section reads from it rather than from guesses.',
        {
          usesForm: 'Migration Plan & Handover',
          producesDeliverable: '08_Migration_Plan_and_Handover.md',
          whatItMeans: 'The list is the most useful page a simulator-only team will ever read. It is where the next cohort starts.',
        }
      ),
    ],
  },
];

/** The static range of a pooled VLAN as `first last`, for `ip dhcp excluded-address`. */
function addressRange(v: { id: number; pool?: [number, number] }): string {
  const x = vlan(v.id);
  return `${addressIn(x, 1)} ${addressIn(x, (x.pool?.[0] ?? 50) - 1)}`;
}

export const NETWORK_PLUS: Course = {
  id: 'network-plus',
  title: 'Network+ Capstone Branch',
  slug: 'network-plus',
  description:
    'A branch office opens in six weeks with a network drawn on a napkin. Design it, build and prove it in Packet Tracer, operate it, then research the real equipment and plan the move.',
  vendor: 'CompTIA',
  certification: 'Network+ (N10-009)',
  level: 'entry',
  audience:
    'Design, build, operate and plan a real branch network as a four-person team — in Packet Tracer first, with no hardware needed to pass, then on borrowed kit if you can.',
  roles: ROLES,
  weeks: WEEKS,
  gates: [],
  tasks: TASKS,
  sharedTrack: true,
  noGatekeeping: true,
  teamCount: 16,
  teamCapacity: 4,
  // The branch picture: the switches, the router, the PCs and the ISP, the
  // simulator and the backups, and the records lane. Drawn from `networkPlusContent.ts`.
  topologyPicture: 'arch',
  lifecyclePath: [
    { label: 'Discover', detail: 'What the branch needs and what must never reach what.' },
    { label: 'Design', detail: 'One addressing rule, every VLAN and port derived from it.' },
    { label: 'Build', detail: 'Switches, trunks, routing and services in the simulator, logged as built.' },
    { label: 'Validate', detail: 'A test matrix with the rows that must fail, proved by a refusal.' },
    { label: 'Operate', detail: 'Logs, backups, one change under a record, three faults by layer.' },
    { label: 'Move', detail: 'Real equipment researched, priced, and a plan to build it for real.' },
  ],
  isSeed: true,
  version: 1,
};

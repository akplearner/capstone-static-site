import { Column } from '../grc/templates';
import { DeliverableDef } from './types';
import { COMPANY, POLICY, SITES, VLANS, gatewayOf, dhcpRangeOf, prefixOf, vlan } from '../ccnaTopology';
import { CAPABILITIES, CLASS_OPTIONS, EMULATORS, PATHS, UNLOCKS_BY_OPTION } from './ccnaKit';

/**
 * The records the CCNA capstone produces.
 *
 * THE SCENARIO (the company is `COMPANY` in `ccnaTopology.ts`, so the forms and
 * the diagrams name the same business). It has one flat network, a switch out of
 * ports, and a second building opening in six weeks. You are the network team:
 * you discover what is there, design what it should be, build it, prove it works, secure it,
 * operate it, watch it, automate it, and hand it over — the workflow a network
 * team actually runs, with CCNA technology inside it.
 *
 * TEN FORMS, ONE JOB EACH, IN THE ORDER THE WORK HAPPENS:
 *
 *   1 Kit & Capability Register    what you have and what it can do          W0
 *   2 Requirements & Site Survey   what the business needs, and what is there W1
 *   3 High-Level Design            the shape: sites, links, boundaries        W1
 *   4 Low-Level Design & IP Plan   VLAN by VLAN, port by port                W2
 *   5 Build & Configuration Log    what you changed, on which device, when   W1-4
 *   6 Validation & Test Matrix     the tests, and what each one proved       W2-4
 *   7 Security Baseline & Policy   the business rules, as ACLs and hardening  W4
 *   8 Operations & Change Records   backups, change requests, peer review     W5
 *   9 Monitoring & Incident Log    what you watch, and the incident you work W6-8
 *  10 As-Built & Handover          the network as it really is  ← capstone    W8
 *
 * FORM 1 IS THE ONE THE REST READS. The capability answers recorded in Week 0
 * decide which procedure each later week gives you: a team whose switch cannot
 * route gets router-on-a-stick where a team with an L3 switch gets SVIs. That is
 * why it is first, why every answer wants the command output that proves it, and
 * why it is the most thoroughly built form in the course.
 *
 * Every student fills every form (`shared: true`) — the build is one shared track
 * and `owner` is the focus that leads the record and reviews it, never a lock on
 * who may open it. Course-scoped (`courseId: 'ccna'`) so these never surface on
 * another course.
 */

// Local column helper, mirroring the one in definitions.ts — kept local for the
// same reason the Server+ module keeps its own: definitions.ts imports this file.
const c = (
  field: string,
  label: string,
  type: Column['type'],
  extra: Partial<Column> = {}
): Column => ({ field, label, type, ...extra });

const YN = ['Yes', 'No'];
const YN_NA = ['Yes', 'No', 'Not applicable'];
/** The VLAN names, so a form never offers a VLAN the plan does not have. */
const VLAN_OPTIONS = VLANS.map((v) => `${v.id} — ${v.name}`);
const SITE_OPTIONS = SITES.map((s) => s.name);
const DEVICE_STATUS = ['Owned', 'Borrowed', 'To buy', 'Emulated'];

/** A worked row for the VLAN table, read straight off the model. */
const vlanSeedRow = (id: number) => {
  const v = vlan(id);
  return {
    vlan: `${v.id} — ${v.name}`,
    purpose: v.purpose,
    prefix: prefixOf(v),
    gateway: gatewayOf(v),
    dhcp: dhcpRangeOf(v) ?? 'Static — no pool',
  };
};

const CCNA_FORMS: DeliverableDef[] = [
  // 1 — Kit & Capability Register ─────────────────────────────────────────────
  {
    id: 'ccna_kit',
    courseId: 'ccna',
    num: 1,
    file: '01_Kit_and_Capability_Register.md',
    title: 'Kit & Capability Register',
    owner: 'arch',
    shared: true,
    folder: '00_Acquisition',
    standard: 'Inventory & capability baseline',
    weeks: [0],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['ccna_requirements', 'ccna_lld'],
    purpose:
      'What equipment the team has, what each device can actually do, and which of the two paths — emulated or physical — this build runs on. Every later week reads this: what your kit supports decides how you build, so this is recorded before anything is designed.',
    howTo:
      'Declare the path. List every device you own, borrowed, plan to buy, or will emulate. Then answer each capability Yes or No — and paste the command output that proves it, because a datasheet describes the model that was sold, not the switch in front of you.',
    buildSteps: [
      'Declare the path first: emulated or physical. It changes nothing about the design and everything about how you build it.',
      'One row per device. Read the model and software version off `show version` rather than the sticker — the sticker lies about the image.',
      'Count the access ports you can actually use, and note whether the uplinks are copper or SFP.',
      'For each capability, run the command in the "How to prove it" column and record Yes or No.',
      'Paste the line that proves it into the evidence column. "Yes" with no evidence is an opinion.',
      'Name the machine you work from — it belongs in the topology documentation like any other host.',
      'Read the gaps: every No tells you which alternate procedure your build takes, and what buying one thing would unlock.',
    ],
    meaning:
      'A good register lets somebody else pick up your kit and know, without touching it, what this network can be asked to do. The gaps matter more than the strengths: a No against "switch that routes" is not a failure, it is the reason your Week-2 procedure is router-on-a-stick.',
    useIt:
      'Week 1 designs against it, Week 2 branches on it, and the buying guide beside it says what one more purchase would unlock. It is also the first appendix of the handover package.',
    pitfalls: [
      'Claiming a capability from the datasheet. The image on the device decides, and only `show` output proves it.',
      'Leaving "to buy" rows out. A gap you have not written down is a gap you discover mid-build.',
      'Recording the workstation in detail. It matters only as far as it runs the emulator and appears in the documentation — the kit is the subject here.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The path — decide this once',
        fields: [
          {
            field: 'kit_path',
            label: 'How this build runs',
            type: 'select',
            required: true,
            options: [PATHS.emulated.label, PATHS.physical.label, 'Both — emulated first, then on hardware'],
            help: `${PATHS.emulated.label}: ${PATHS.emulated.what} ${PATHS.physical.label}: ${PATHS.physical.what}`,
          },
          {
            field: 'emulator',
            label: 'Which emulator (if any)',
            type: 'select',
            options: [...EMULATORS.map((e) => e.name), 'None — hardware only'],
            help: 'The tool the topology runs in. Weeks 7-8 need one that speaks real IOS or a container network OS.',
          },
          {
            field: 'workstation',
            label: 'The machine you work from',
            type: 'text',
            required: true,
            placeholder: 'ADMIN-PC — ThinkPad T480, 16 GB, Windows 11 + PuTTY',
            help: 'Name, memory, and the terminal program. Enough for the documentation to say where the work happened, and to show the emulator will run.',
          },
          {
            field: 'workstation_ready',
            label: 'The emulator opens and gives you a device prompt',
            type: 'select',
            required: true,
            options: YN_NA,
            help: 'Or, on hardware: a console cable reaches a switch and you get a prompt. Either way — you can type at a device.',
          },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'devices',
          label: 'Every device — owned, borrowed, to buy, or emulated',
          help: 'One row per device. `show version` gives you the model and the software version; count the ports you can actually use.',
          columns: [
            c('name', 'Name', 'text', { placeholder: 'SW-ACC-01', help: 'The hostname you will configure on it.' }),
            c('device_class', 'What it is', 'select', {
              options: CLASS_OPTIONS,
              help: 'This decides what the device can be asked to do.',
            }),
            c('model', 'Model', 'text', { placeholder: 'WS-C2960X-24TS-L', help: 'From `show version`, not the sticker.' }),
            c('version', 'Software version', 'text', { placeholder: '15.2(7)E3', help: 'From `show version`. An old image is why a feature is missing.' }),
            c('ports', 'Usable ports', 'number', { unit: 'ports', help: 'Access ports you can actually put a device on.' }),
            c('uplink', 'Uplinks', 'select', { options: ['Copper only', 'SFP (1G)', 'SFP+ (10G)', 'None'] }),
            c('poe', 'PoE', 'select', { options: ['None', 'PoE', 'PoE+'], help: 'From `show power inline`.' }),
            c('status', 'Status', 'select', { options: DEVICE_STATUS }),
            c('unlocks', 'Unlocks', 'text', {
              derived: { column: 'device_class', cases: UNLOCKS_BY_OPTION, else: '—' },
              help: 'Computed from what the device is: the capabilities owning it gives your build.',
            }),
          ],
          seed: [
            {
              name: 'SW-ACC-01',
              device_class: CLASS_OPTIONS[2],
              model: 'WS-C2960X-24TS-L',
              version: '15.2(7)E3',
              ports: '24',
              uplink: 'SFP (1G)',
              poe: 'None',
              status: 'Owned',
            },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'capabilities',
          label: 'What the kit can do — answer each one with its proof',
          help: 'Run the command, read the tell, record Yes or No, and paste the line that proves it. Every No has a documented alternative — it changes how you build, not whether you can.',
          columns: [
            c('capability', 'Capability', 'select', {
              options: CAPABILITIES.map((x) => x.label),
              help: 'One row per capability the course asks about.',
            }),
            c('answer', 'Have it?', 'select', { options: YN }),
            c('device', 'On which device', 'text', { placeholder: 'SW-CORE-01' }),
            c('evidence', 'The output that proves it', 'text', {
              placeholder: 'Gi1/0/1 on 802.1q trunking 1',
              help: 'One line from the command output. "Yes" with nothing here is an opinion.',
            }),
          ],
          seed: CAPABILITIES.slice(0, 3).map((x) => ({
            capability: x.label,
            answer: 'Yes',
            device: 'SW-ACC-01',
            evidence: x.proof.tell,
          })),
        },
      },
      {
        kind: 'fields',
        title: 'What the gaps mean',
        fields: [
          {
            field: 'gaps',
            label: 'The capabilities you do not have, and what you will do instead',
            type: 'area',
            required: true,
            placeholder:
              'No L3 switch, so inter-VLAN routing is router-on-a-stick on R1-HQ. No PoE, so the AP runs off an injector and the phones stay a design requirement.',
            help: 'One line per No. This is the paragraph your Week-2 and Week-4 procedures follow.',
          },
          {
            field: 'next_purchase',
            label: 'If you bought one thing, what and why',
            type: 'text',
            placeholder: 'A 3560-CX — it turns router-on-a-stick into SVIs and frees the router for the WAN.',
            help: 'Capability first, model second. The buying guide in the manual lists what each class unlocks.',
          },
        ],
      },
    ],
    dod: [
      { label: 'The path is declared and the machine you work from is named', when: { fields: ['kit_path', 'workstation'] } },
      { label: 'You can get to a device prompt', when: { field: 'workstation_ready', matches: '^(Yes|Not applicable)$' } },
      { label: 'At least one device is registered with its model and software version', when: { group: 'devices', where: { filled: ['name', 'device_class', 'model', 'version'] }, atLeast: 1 } },
      { label: 'At least eight capabilities are answered', when: { group: 'capabilities', where: { filled: ['capability', 'answer'] }, atLeast: 8 } },
      { label: 'Every capability answered Yes carries the output that proves it', when: { group: 'capabilities', where: { column: 'answer', equals: 'Yes' }, every: { filled: ['evidence'] } } },
      { label: 'The gaps are written down, with what you will do instead', when: { fields: ['gaps'] } },
    ],
  },

  // 2 — Requirements & Site Survey ────────────────────────────────────────────
  {
    id: 'ccna_requirements',
    courseId: 'ccna',
    num: 2,
    file: '02_Requirements_and_Site_Survey.md',
    title: 'Requirements & Site Survey',
    owner: 'arch',
    shared: true,
    folder: '01_Discovery',
    standard: 'Requirements definition',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['ccna_hld'],
    purpose:
      'What the business needs the network to do, and what is physically there today. Written before any design, because a design nobody traced to a requirement is a preference.',
    howTo:
      'Interview the business (your instructor plays it, or use the scenario). Record what each department needs, what cannot go down, and what exists in the building already.',
    buildSteps: [
      'Count the people, per department, and what each group actually does on the network.',
      'List the applications that matter and who needs them.',
      'Ask what cannot go down, and for how long — that is your availability requirement.',
      'Walk the building: where the cabinet is, how many drops, where the cable runs, where the ISP comes in.',
      'Record the constraints honestly — budget, existing kit, cabling, the ISP circuit.',
      'Write down the problems the business already has. Those are the requirements nobody will state directly.',
    ],
    meaning:
      'Every later decision points back to a line here. If you cannot name the requirement a VLAN serves, the VLAN is decoration.',
    useIt: 'The High-Level Design is built from it, and the handover opens with it.',
    pitfalls: [
      'Designing while discovering. Write down what is, then decide what should be.',
      'Skipping the existing problems. "The network is slow at 4pm" is the most useful sentence in the room.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The business',
        fields: [
          { field: 'client', label: 'Company', type: 'text', required: true, placeholder: COMPANY.name },
          { field: 'driver', label: 'Why the network is being rebuilt', type: 'area', required: true, placeholder: COMPANY.driver },
          { field: 'availability', label: 'What cannot go down, and for how long', type: 'area', required: true, placeholder: 'The order system: no more than 30 minutes in working hours.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'departments',
          label: 'Who needs what',
          columns: [
            c('name', 'Department', 'text', { placeholder: 'Warehouse' }),
            c('people', 'People', 'number', { unit: 'staff' }),
            c('needs', 'What they need', 'text', { placeholder: 'Scanners talking to the order system, all shift' }),
            c('site', 'Where', 'select', { options: SITE_OPTIONS }),
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'existing',
          label: 'What is there today — the site survey',
          columns: [
            c('item', 'What', 'text', { placeholder: '24-port unmanaged switch under the desk' }),
            c('where', 'Where', 'text', { placeholder: 'Reception, on the floor' }),
            c('problem', 'Problem with it', 'text', { placeholder: 'Out of ports; no VLANs; no management' }),
          ],
        },
      },
    ],
    dod: [
      { label: 'The company, the driver and the availability requirement are recorded', when: { fields: ['client', 'driver', 'availability'] } },
      { label: 'At least three departments with their needs', when: { group: 'departments', where: { filled: ['name', 'needs'] }, atLeast: 3 } },
      { label: 'The survey records what is there today', when: { group: 'existing', where: { filled: ['item', 'problem'] }, atLeast: 2 } },
    ],
  },

  // 3 — High-Level Design ─────────────────────────────────────────────────────
  {
    id: 'ccna_hld',
    courseId: 'ccna',
    num: 3,
    file: '03_High_Level_Design.md',
    title: 'High-Level Design',
    owner: 'arch',
    shared: true,
    folder: '02_Design',
    standard: 'Architecture definition',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['ccna_lld'],
    purpose:
      'The shape of the network: the sites, what connects them, where the security boundaries are, and which requirement each decision serves. No interface numbers — that is the Low-Level Design.',
    howTo: 'One decision per row, each traced back to a requirement line, each with the alternative you rejected and why.',
    buildSteps: [
      'Draw the two sites and the link between them.',
      'Decide where routing happens — the switch, the router, or both — and say why your kit makes that the answer.',
      'Name the security boundaries: guest from corporate, users from management, cameras from servers.',
      'Say how the internet is reached and where NAT happens.',
      'Say what is redundant and what is deliberately not.',
    ],
    meaning:
      'A good HLD can be read aloud to a manager in two minutes and to an engineer as a brief. Every row names the requirement it serves.',
    useIt: 'The LLD turns each row into configuration; the handover reads it as the rationale.',
    pitfalls: [
      'Interface numbers in the HLD. If it names Gi1/0/24 it belongs in the LLD.',
      'Redundancy nobody asked for. Say what you left single, and why that is acceptable.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'decisions',
          label: 'The design decisions',
          columns: [
            c('decision', 'Decision', 'text', { placeholder: 'Inter-VLAN routing on the core switch' }),
            c('because', 'Requirement it serves', 'text', { placeholder: 'Departments must be separated but still reach the order system' }),
            c('rejected', 'What you rejected, and why', 'text', { placeholder: 'Router-on-a-stick — the trunk becomes the bottleneck' }),
            c('kit', 'Does your kit support it?', 'select', { options: YN, help: 'From the Kit & Capability Register. A No here picks the alternate procedure.' }),
          ],
        },
      },
      {
        kind: 'fields',
        title: 'The shape',
        fields: [
          { field: 'sites', label: 'Sites and the link between them', type: 'area', required: true, placeholder: 'Austin HQ and the Round Rock branch, joined by a point-to-point link, OSPF area 0 across it.' },
          { field: 'boundaries', label: 'Security boundaries', type: 'area', required: true, placeholder: 'Guest reaches the internet and nothing else. Only the network team reaches the management VLAN.' },
          { field: 'internet', label: 'How the internet is reached', type: 'area', required: true, placeholder: 'One circuit at HQ, PAT on the edge router. The branch reaches the internet across the WAN.' },
        ],
      },
    ],
    dod: [
      { label: 'The sites, the boundaries and the internet path are described', when: { fields: ['sites', 'boundaries', 'internet'] } },
      { label: 'At least four design decisions, each traced to a requirement', when: { group: 'decisions', where: { filled: ['decision', 'because'] }, atLeast: 4 } },
      { label: 'Every decision says what was rejected', when: { group: 'decisions', atLeast: 1, every: { filled: ['rejected'] } } },
    ],
  },

  // 4 — Low-Level Design & IP Plan ────────────────────────────────────────────
  {
    id: 'ccna_lld',
    courseId: 'ccna',
    num: 4,
    file: '04_Low_Level_Design_and_IP_Plan.md',
    title: 'Low-Level Design & IP Plan',
    owner: 'arch',
    shared: true,
    folder: '02_Design',
    standard: 'Detailed design · IPAM',
    weeks: [2],
    kind: 'form',
    exportFormat: 'csv',
    feeds: ['ccna_build_log', 'ccna_validation'],
    purpose:
      'Every VLAN, prefix, gateway, DHCP range and port assignment — the document an engineer configures from without asking a single question.',
    howTo:
      'One row per VLAN, one row per port range. The convention this course uses: the third octet IS the VLAN id, so an address tells you which VLAN it is in.',
    buildSteps: [
      'One row per VLAN: id, name, purpose, prefix, gateway, DHCP range.',
      'Then the ports: which range on which switch carries which VLAN, access or trunk.',
      'Name the trunks and say which VLANs each one carries — including the native VLAN.',
      'Record the WAN addressing and the OSPF area.',
    ],
    meaning:
      'A good LLD is boring and complete. If two engineers configure from it and get different networks, it is neither.',
    useIt: 'Weeks 2-4 configure from it; Week 5 loads it into NetBox; the handover ships it as the addressing record.',
    pitfalls: [
      'Leaving the native VLAN unstated. A native VLAN mismatch is the classic trunk fault, and it starts here.',
      'A DHCP pool that overlaps the static addresses. Write the static range down too.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'vlans',
          label: 'The VLAN and addressing plan',
          help: 'The seeded rows are the worked example the course is written around. Replace them with yours, or keep them if you are building this design.',
          columns: [
            c('vlan', 'VLAN', 'select', { options: VLAN_OPTIONS }),
            c('purpose', 'What it carries', 'text' ),
            c('prefix', 'Prefix', 'text', { placeholder: prefixOf(vlan(10)) }),
            c('gateway', 'Gateway', 'ipv4', { subnetFrom: 'prefix' }),
            c('dhcp', 'DHCP range', 'text', { placeholder: 'or "Static — no pool"' }),
          ],
          seed: [vlanSeedRow(10), vlanSeedRow(20), vlanSeedRow(99)],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'ports',
          label: 'Port assignment',
          columns: [
            c('device', 'Device', 'text', { placeholder: 'SW-ACC-01' }),
            c('ports', 'Ports', 'text', { placeholder: 'Gi1/0/1-20' }),
            c('mode', 'Mode', 'select', { options: ['Access', 'Trunk', 'Routed'] }),
            c('vlans', 'VLAN(s)', 'text', { placeholder: '10, or 10,20,30,99 on a trunk' }),
            c('native', 'Native VLAN (trunk only)', 'text', { placeholder: '999 — an unused VLAN, on purpose' }),
          ],
        },
      },
    ],
    dod: [
      { label: 'At least four VLANs planned with prefix and gateway', when: { group: 'vlans', where: { filled: ['vlan', 'prefix', 'gateway'] }, atLeast: 4 } },
      { label: 'Every VLAN row says what it carries', when: { group: 'vlans', atLeast: 1, every: { filled: ['purpose'] } } },
      { label: 'Ports are assigned on at least two devices', when: { group: 'ports', distinct: 'device', atLeast: 2 } },
      { label: 'Every trunk states its native VLAN', when: { group: 'ports', where: { column: 'mode', equals: 'Trunk' }, every: { filled: ['native'] } } },
    ],
  },

  // 5 — Build & Configuration Log ─────────────────────────────────────────────
  {
    id: 'ccna_build_log',
    courseId: 'ccna',
    num: 5,
    file: '05_Build_and_Configuration_Log.md',
    title: 'Build & Configuration Log',
    owner: 'impl',
    shared: true,
    folder: '03_Build',
    standard: 'Configuration record',
    weeks: [1, 2, 3, 4],
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'What was configured, on which device, by whom, and what proved it worked. An append-only record written as the build happens, not reconstructed afterwards.',
    howTo: 'One row per change. Save the configuration when the row is green, and say which command proved it.',
    buildSteps: [
      'Write the row as you make the change, not at the end of the session.',
      'Name the device, the change, and the command whose output proved it.',
      'Say whether you saved the configuration. An unsaved change is a change that vanishes at the next power cut.',
    ],
    meaning:
      'A good log lets somebody reconstruct the build without the devices. It is also how you find what changed when something breaks on Thursday.',
    useIt: 'Week 5 turns it into change records; Week 8 hands it over as the build history.',
    pitfalls: [
      'Writing it up at the end of the week. You will not remember the port number.',
      '"Configured VLANs" as a row. Which VLANs, on which device, proved by what?',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'The build log',
          columns: [
            c('when', 'When', 'date'),
            c('device', 'Device', 'text', { placeholder: 'SW-CORE-01' }),
            c('what', 'What you configured', 'text', { placeholder: 'SVI for VLAN 20, 10.50.20.1/24' }),
            c('proof', 'What proved it', 'text', { placeholder: 'show ip interface brief — Vlan20 up/up' }),
            c('saved', 'Configuration saved', 'select', { options: YN }),
            c('by', 'By', 'text', { placeholder: 'Initials' }),
          ],
        },
      },
    ],
    dod: [
      { label: 'At least six configuration changes are logged', when: { group: 'changes', where: { filled: ['device', 'what'] }, atLeast: 6 }, week: 2 },
      { label: 'Every logged change names what proved it', when: { group: 'changes', atLeast: 1, every: { filled: ['proof'] } }, week: 2 },
      { label: 'Changes are logged on at least three devices', when: { group: 'changes', distinct: 'device', atLeast: 3 }, week: 3 },
    ],
  },

  // 6 — Validation & Test Matrix ──────────────────────────────────────────────
  {
    id: 'ccna_validation',
    courseId: 'ccna',
    num: 6,
    file: '06_Validation_and_Test_Matrix.md',
    title: 'Validation & Test Matrix',
    owner: 'ops',
    shared: true,
    folder: '04_Validation',
    standard: 'Test & acceptance',
    weeks: [2, 3, 4],
    kind: 'form',
    exportFormat: 'csv',
    feeds: ['ccna_handover'],
    purpose:
      'The tests that say the network does what the design promised — including the ones that must FAIL, because a guest reaching the server VLAN is a test result too.',
    howTo:
      'One row per test: what you tried, from where, what you expected, what happened. A test whose expected result is "blocked" is as important as one expecting a reply.',
    buildSteps: [
      'Write the test before you run it, so the expected result is a prediction rather than a description.',
      'Test from the right place — a ping from the switch is not a ping from a user PC.',
      'Include the negative tests: guest to corporate, users to management, cameras to servers.',
      'Record the actual output, not "worked".',
    ],
    meaning:
      'The interesting rows are the failures you predicted and got. That is the difference between a network that works and one that has been proven.',
    useIt: 'It becomes the acceptance evidence in the handover, and the baseline every later change is re-tested against.',
    pitfalls: [
      'Only testing what should work. Half of a segmentation design is what must not.',
      'Testing from the device rather than from a host in the VLAN.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'tests',
          label: 'The test matrix',
          columns: [
            c('test', 'Test', 'text', { placeholder: 'Guest PC → order system' }),
            c('from', 'From', 'text', { placeholder: 'PC in VLAN 50' }),
            c('expected', 'Expected', 'select', { options: ['Reply', 'Blocked', 'Specific output'] }),
            c('actual', 'What happened', 'text', { placeholder: 'Request timed out — as designed' }),
            c('result', 'Result', 'select', { options: ['Pass', 'Fail'] }),
          ],
        },
      },
    ],
    dod: [
      { label: 'At least eight tests recorded with their expected result', when: { group: 'tests', where: { filled: ['test', 'expected'] }, atLeast: 8 }, week: 3 },
      { label: 'At least two tests expect to be BLOCKED — segmentation is proven, not assumed', when: { group: 'tests', where: { column: 'expected', equals: 'Blocked' }, atLeast: 2 }, week: 4 },
      { label: 'Every test records what actually happened', when: { group: 'tests', atLeast: 1, every: { filled: ['actual'] } }, week: 3 },
    ],
  },

  // 7 — Security Baseline & ACL Policy ────────────────────────────────────────
  {
    id: 'ccna_security',
    courseId: 'ccna',
    num: 7,
    file: '07_Security_Baseline_and_Policy.md',
    title: 'Security Baseline & ACL Policy',
    owner: 'auto',
    shared: true,
    folder: '05_Security',
    standard: 'Device hardening · policy',
    weeks: [4],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['ccna_handover'],
    purpose:
      'The business rules about who may reach what, and the state every device is hardened to. The ACL is the second half of this document; the first half is the rule in the words the business would use.',
    howTo: 'State the rule, then the ACL that implements it, then the test that proves it. In that order.',
    buildSteps: [
      'Write each rule as a sentence a manager would agree with.',
      'Turn it into an access list, and say which interface and direction it is applied to.',
      'Harden the management plane: SSH not telnet, a real enable secret, unused ports shut, login banner.',
      'Prove each rule with a test — and record the test that must fail.',
    ],
    meaning:
      'An ACL nobody can trace to a business rule is an ACL nobody dares change. This document is what makes it maintainable.',
    useIt: 'The handover ships it as the security baseline; Week 8 re-tests it after the injected failure.',
    pitfalls: [
      'An ACL with no matching business rule. Delete it or document why it exists.',
      'Hardening the data plane and leaving telnet on the management VLAN.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'rules',
          label: 'The policy, and the ACL that enforces it',
          help: 'The seeded rows are the design this course is written around — the rules are in the topology model, so the diagram and this table agree.',
          columns: [
            c('rule', 'The rule, in business words', 'text'),
            c('acl', 'ACL name', 'text', { placeholder: 'ACL-GUEST-IN' }),
            c('applied', 'Applied to', 'text', { placeholder: 'Vlan50, inbound' }),
            c('tested', 'Proven by', 'text', { placeholder: 'Test 4 in the matrix — blocked' }),
          ],
          seed: POLICY.filter((p) => !p.allow)
            .slice(0, 2)
            .map((p) => ({
              rule: p.because,
              acl: `ACL-VLAN${p.from}-IN`,
              applied: `Vlan${p.from}, inbound`,
              tested: '',
            })),
        },
      },
      {
        kind: 'group',
        group: {
          group: 'hardening',
          label: 'The device baseline',
          columns: [
            c('control', 'Control', 'text', { placeholder: 'SSH only, telnet disabled' }),
            c('devices', 'Applied on', 'text', { placeholder: 'All switches and both routers' }),
            c('proof', 'Proven by', 'text', { placeholder: 'show ip ssh — Enabled, version 2' }),
            c('done', 'Done', 'select', { options: YN }),
          ],
        },
      },
    ],
    dod: [
      { label: 'At least four rules, each with the ACL that enforces it', when: { group: 'rules', where: { filled: ['rule', 'acl'] }, atLeast: 4 } },
      { label: 'Every rule names where the ACL is applied', when: { group: 'rules', atLeast: 1, every: { filled: ['applied'] } } },
      { label: 'At least five hardening controls, each with its proof', when: { group: 'hardening', where: { filled: ['control', 'proof'] }, atLeast: 5 } },
    ],
  },

  // 8 — Operations & Change Records ───────────────────────────────────────────
  {
    id: 'ccna_ops',
    courseId: 'ccna',
    num: 8,
    file: '08_Operations_and_Change_Records.md',
    title: 'Operations & Change Records',
    owner: 'ops',
    shared: true,
    folder: '06_Operations',
    standard: 'Change management · configuration backup',
    weeks: [5],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'How the network is run rather than built: every change requested, reviewed by somebody else, backed out if it fails, and recorded. Plus where the configurations are backed up and how a restore was proven.',
    howTo:
      'One change record per change, with a peer reviewer who is not you. A change nobody reviewed is a change nobody else can trust.',
    buildSteps: [
      'Raise the change: what, why, which devices, what could go wrong.',
      'Write the rollback BEFORE the implementation. If you cannot write it, you are not ready to make the change.',
      'Have a teammate review it — the architecture focus checks the addressing, operations checks the rollback.',
      'Back the configurations up first, implement, then re-run the validation tests.',
      'Record the result, including a failed change honestly.',
    ],
    meaning:
      'A team that can show reviewed, reversible, tested changes is a team a business can hand a network to.',
    useIt: 'Week 8 works a real change end to end; the handover ships the records as the operating history.',
    pitfalls: [
      'Approving your own change. The peer review is the control, not the paperwork.',
      'A rollback of "undo it". Which commands, in which order?',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Change records',
          columns: [
            c('ref', 'Ref', 'text', { placeholder: 'CHG-001' }),
            c('what', 'Change', 'text', { placeholder: 'Add the Accounting VLAN (70) at HQ' }),
            c('risk', 'Risk', 'select', { options: ['Low', 'Medium', 'High'] }),
            c('rollback', 'Rollback', 'text', { placeholder: 'no vlan 70; no interface Vlan70; restore from backup 2026-05-02' }),
            c('reviewer', 'Reviewed by', 'text', { help: 'Not the person who made the change.' }),
            c('result', 'Result', 'select', { options: ['Successful', 'Rolled back', 'Partial'] }),
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'backups',
          label: 'Configuration backups',
          columns: [
            c('device', 'Device', 'text'),
            c('where', 'Where the backup lives', 'text', { placeholder: 'Oxidized → Git, northgate-configs' }),
            c('restored', 'Restore proven', 'select', { options: YN, help: 'A backup nobody restored is a hope.' }),
          ],
        },
      },
    ],
    dod: [
      { label: 'At least two change records, each with a rollback', when: { group: 'changes', where: { filled: ['ref', 'what', 'rollback'] }, atLeast: 2 } },
      { label: 'Every change was reviewed by somebody else', when: { group: 'changes', atLeast: 1, every: { filled: ['reviewer'] } } },
      { label: 'Backups exist for at least three devices', when: { group: 'backups', where: { filled: ['device', 'where'] }, atLeast: 3 } },
      { label: 'At least one restore has actually been proven', when: { group: 'backups', some: { column: 'restored', equals: 'Yes' } } },
    ],
  },

  // 9 — Monitoring & Incident Log ─────────────────────────────────────────────
  {
    id: 'ccna_monitoring',
    courseId: 'ccna',
    num: 9,
    file: '09_Monitoring_and_Incident_Log.md',
    title: 'Monitoring & Incident Log',
    owner: 'ops',
    shared: true,
    folder: '07_Operations',
    standard: 'Monitoring · incident & problem management',
    weeks: [6, 8],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'What the team watches and what it does when something breaks: the metrics and alerts, then the incident worked from ticket to root cause to prevention.',
    howTo:
      'Record what is monitored and the threshold that alerts. Then work the incident as a real ticket — symptoms, scope, what changed, the layers you ruled out, the root cause, the fix, and what stops it recurring.',
    buildSteps: [
      'List what you monitor: device up, interface up, utilization, errors, CPU, latency, and the routing adjacency.',
      'For each, the threshold that raises an alert and who it goes to.',
      'When the failure is injected, open a ticket and record the time.',
      'Work down the layers and record what you ruled OUT, not only what you found.',
      'Name the root cause, the fix, and the preventive action — a standard or a check, not "be careful".',
    ],
    meaning:
      'The difference between a technician and an engineer is the last two rows: root cause, and what stops it happening again.',
    useIt: 'The handover ships the monitoring baseline and the incident history.',
    pitfalls: [
      'Monitoring everything and alerting on all of it. An alert nobody acts on trains the team to ignore alerts.',
      '"Fixed the trunk" as a root cause. Why was it wrong, and what stops the next one?',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'monitors',
          label: 'What you watch',
          columns: [
            c('what', 'What', 'text', { placeholder: 'Uplink utilization, SW-CORE-01 Gi1/0/1' }),
            c('how', 'How', 'text', { placeholder: 'LibreNMS via SNMP, 5-minute poll' }),
            c('threshold', 'Alerts when', 'text', { placeholder: 'above 70% for 15 minutes' }),
            c('who', 'Goes to', 'text', { placeholder: 'Operations focus, on shift' }),
          ],
        },
      },
      {
        kind: 'fields',
        title: 'The incident',
        fields: [
          { field: 'inc_ref', label: 'Ticket', type: 'text', placeholder: 'INC-001' },
          { field: 'inc_symptom', label: 'Reported symptom', type: 'area', placeholder: 'Branch staff cannot reach the order system. Nineteen users.' },
          { field: 'inc_ruled_out', label: 'What you ruled out, and how', type: 'area', placeholder: 'Layer 1: both WAN interfaces up, no errors. Layer 2: trunk up, VLANs match.' },
          { field: 'inc_cause', label: 'Root cause', type: 'area', placeholder: 'The OSPF adjacency dropped: the branch link was changed to a /29 on one side only.' },
          { field: 'inc_fix', label: 'Fix', type: 'text', placeholder: 'Corrected the mask on R2-BR Gi0/0/0 to /30.' },
          { field: 'inc_prevent', label: 'What stops it recurring', type: 'area', placeholder: 'A pre-change check that both ends of a point-to-point link are configured in the same change record.' },
        ],
      },
    ],
    dod: [
      { label: 'At least six things are monitored, each with a threshold', when: { group: 'monitors', where: { filled: ['what', 'how', 'threshold'] }, atLeast: 6 }, week: 6 },
      { label: 'An incident is worked from symptom to root cause', when: { fields: ['inc_ref', 'inc_symptom', 'inc_cause'] }, week: 8 },
      { label: 'The investigation records what was ruled OUT', when: { fields: ['inc_ruled_out'] }, week: 8 },
      { label: 'A preventive action is named — not "be careful"', when: { fields: ['inc_prevent'] }, week: 8 },
    ],
  },

  // 10 — As-Built & Handover ──────────────────────────────────────────────────
  {
    id: 'ccna_handover',
    courseId: 'ccna',
    num: 10,
    file: '10_As_Built_and_Handover.md',
    title: 'As-Built & Operations Handover',
    owner: 'arch',
    shared: true,
    capstone: true,
    folder: '08_Handover',
    standard: 'As-built documentation · operational handover',
    weeks: [8],
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'The network as it really is, handed to whoever runs it next: the diagrams, the addressing, the credentials process, the known issues, and what somebody must do on their first day.',
    howTo:
      'Assemble it from the other nine records rather than rewriting them. What is new here is the honesty: the known issues and what you would do with another week.',
    buildSteps: [
      'Confirm the diagrams match what is configured — not what was designed.',
      'List the known issues. Every real network has them; a handover that claims none is not trusted.',
      'Say how credentials are handed over — the process, never the passwords in this document.',
      'Write the first-day runbook: how to check the network is healthy in ten minutes.',
      'Record what you would do next, with a reason.',
    ],
    meaning:
      'This is the document that gets you the job. It shows you can leave a network somebody else can run.',
    useIt: 'It is the capstone artefact — the one that is defended rather than merely filed.',
    pitfalls: [
      'A handover that describes the design instead of the build. If they differ, the build wins and the difference is the interesting part.',
      'Passwords in the document. The process for handing them over belongs here; the secrets do not.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The handover',
        fields: [
          { field: 'as_built', label: 'How the build differs from the design, and why', type: 'area', required: true, placeholder: 'Inter-VLAN routing ended up on R1-HQ rather than the core switch: the 2960 cannot route, which the capability register recorded in Week 0.' },
          { field: 'known_issues', label: 'Known issues', type: 'area', required: true, placeholder: 'The warehouse IDF uplink is a single copper run — fibre is budgeted for next quarter.' },
          { field: 'credentials', label: 'How credentials are handed over', type: 'area', required: true, placeholder: 'Enable secrets and the RADIUS shared key are in the password manager; the incoming engineer is added to the vault and the old accounts are removed the same day.' },
          { field: 'first_day', label: 'The first-day runbook — ten minutes to "it is healthy"', type: 'area', required: true, placeholder: 'show ip ospf neighbor on both routers · show interfaces status on the core · LibreNMS dashboard all green · one ping from a guest PC that must fail.' },
          { field: 'next', label: 'What you would do next, and why', type: 'area', placeholder: 'A second uplink from the IDF, because the survey shows the warehouse is now the busiest floor in the company.' },
        ],
      },
    ],
    dod: [
      { label: 'The as-built difference from the design is stated', when: { fields: ['as_built'] } },
      { label: 'Known issues are listed honestly', when: { fields: ['known_issues'] } },
      { label: 'The credentials process is described, with no passwords in the document', when: { fields: ['credentials'] } },
      { label: 'A first-day health runbook is written', when: { fields: ['first_day'] } },
    ],
  },
];

export const CCNA_DELIVERABLES: DeliverableDef[] = CCNA_FORMS;

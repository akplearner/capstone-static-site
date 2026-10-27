import { Column } from '../grc/templates';
import { DeliverableDef, decisionDod, type DecisionBlock } from './types';

/** R132 — the buying decision: which set the team recommends, against the two it costed. */
const SET_DECISION: DecisionBlock = {
  id: 'set',
  title: 'The recommended set',
  subject: 'vendor',
  prompt: 'Three sets meet the design. Which one does the team put in front of the practice?',
  options: [
    { id: 'new', label: 'All new, under warranty', help: 'Highest price; one vendor, one support contract, replacement parts for years.' },
    { id: 'mixed', label: 'New switches, a used router', help: 'The router does one simple job; the switches carry every desk and the guest WiFi.' },
    { id: 'used', label: 'All used, tested on arrival', help: 'Cheapest; no warranty, so a spare of each class is part of the set.' },
  ],
  questions: [
    { field: 'why_recommended', label: 'Why the recommended set', type: 'area', required: true, placeholder: 'New switches with warranty; the router used, because its capability is simple and the saving is large.' },
    { field: 'set_rejected', label: 'The set rejected, and why', type: 'text', required: true, placeholder: 'All used: a dead switch on day one takes the whole reception down.' },
    { field: 'set_risk', label: 'The risk the practice accepts', type: 'text', placeholder: 'A used router fails outside warranty; the migration plan names the spare.' },
  ],
};
import { custodySection, everyEvidenceHashed } from './custodyTemplate';
import { COMPANY, DEVICES, LINKS, POLICY, VLANS, WAN, dhcpRangeOf, gatewayOf, mgmtAddress, prefixOf, vlan } from '../networkPlusTopology';
import { BAND_LABEL, BUYING_GUIDE } from './ccnaKit';

/**
 * The records the Network+ Capstone Branch produces.
 *
 * THE SCENARIO (the company is `COMPANY` in `networkPlusTopology.ts`): a new
 * branch with a napkin for a network. The team designs it, builds it in the
 * simulator, operates it, then researches and prices the real equipment and
 * plans the move. Eight forms, one job each, in the order the work happens:
 *
 *   1 Lab & Path Register              the simulator, the file, the team    W0
 *   2 Design Brief & IP Plan           requirements, the rule, the VLANs    W1
 *   3 VLAN & Port Map                  every port, before a switch is touched W1-2
 *   4 Configuration Record             what was configured, with the proof  W1-3
 *   5 Services & Verification Log      pools, names, the test matrix        W2-3
 *   6 Change & Fault Log               logs, backups, one change, three faults W3
 *   7 Equipment Research & BOM         capabilities, candidates, prices     W4
 *   8 Migration Plan & Handover        the move, the as-built  ← capstone   W4
 *
 * FORM 5 CARRIES THE ROWS THAT MUST FAIL. A test matrix that records what is
 * refused, not only what works, is what makes Week 3's access list a proof.
 * Form 7 is capability-first: a model goes out of stock, a capability does not.
 *
 * Every student fills every form (`shared: true`); `owner` is the focus that
 * leads the record and reviews it. Course-scoped (`courseId: 'network-plus'`).
 */

const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });

const YN = ['Yes', 'No'];
const VLAN_OPTIONS = VLANS.map((v) => `${v.id} — ${v.name}`);
const vlanRow = (id: number) => {
  const v = vlan(id);
  return { vlan: `${v.id} — ${v.name}`, purpose: v.purpose, prefix: prefixOf(v), gateway: gatewayOf(v), pool: dhcpRangeOf(v) ?? 'Static — no pool' };
};
const SW1 = DEVICES.find((d) => d.name === 'SW-01')!;
const R1 = DEVICES.find((d) => d.name === 'R1-BR')!;
const PRINTER = DEVICES.find((d) => d.name === 'PRINTER-1')!;

const NETWORK_PLUS_FORMS: DeliverableDef[] = [
  // 1 — Lab & Path Register ───────────────────────────────────────────────────
  {
    id: 'np_lab',
    courseId: 'network-plus',
    num: 1,
    file: '01_Lab_and_Path_Register.md',
    title: 'Lab & Path Register',
    owner: 'ops',
    shared: true,
    folder: '00_Preparation',
    standard: 'Inventory & capability baseline',
    weeks: [0],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['np_design', 'np_bom'],
    purpose:
      'Where this build runs and who runs it: the simulator and its version, the one project file, the four focuses, and what the brief leaves open. Every later week names this file.',
    howTo: 'Record the simulator and its version, prove a prompt answers, name the project file and where it lives, and list the four focuses. Read the brief and write down what it does not say.',
    buildSteps: [
      'Help, About in Packet Tracer: the version, written exactly.',
      'One project file, named branch-t<team>.pkt, in one shared place.',
      'Four names against four focuses.',
      'The brief’s open questions: what the business did not say and the design will have to assume.',
    ],
    meaning: 'A team that knows which simulator version it ran can explain a difference from real gear in Week 4. A team with two project files has two networks.',
    useIt: 'The design brief starts from the open questions; the bill of materials records the path the team was on.',
    pitfalls: ['Two project files. Agree on one, and on who saves it.', 'A guest-mode simulator that does not save. Sign in once.'],
    sections: [
      {
        kind: 'fields',
        title: 'The simulator',
        fields: [
          { field: 'path', label: 'How this build runs', type: 'select', required: true, options: ['Packet Tracer (simulator)', 'Packet Tracer, then the CCNA kit in Week 5'] },
          { field: 'version', label: 'Packet Tracer version', type: 'text', required: true, placeholder: '8.2.2' },
          { field: 'prompt', label: 'A switch answers at a prompt', type: 'select', required: true, options: YN },
          { field: 'project_file', label: 'The project file and where it lives', type: 'text', required: true, placeholder: 'branch-t1.pkt — the team’s shared folder' },
        ],
      },
      {
        kind: 'fields',
        title: 'The team and the brief',
        fields: [
          { field: 'focus', label: 'Who leads which focus', type: 'area', required: true, placeholder: 'Design: Alex · Switching: Sam · Routing: Jo · Operations: Priya' },
          { field: 'client', label: 'The company', type: 'text', required: true, placeholder: COMPANY.name },
          { field: 'open_questions', label: 'What the brief does not say', type: 'area', required: true, placeholder: 'How many devices per room? Does the practice system live on site or in the cloud? Who supports it after handover?' },
        ],
      },
    ],
    dod: [
      { label: 'The path and the simulator version are recorded and a prompt answers', when: { all: [{ fields: ['path', 'version', 'project_file'] }, { field: 'prompt', equals: 'Yes' }] } },
      { label: 'Four focuses are named and the brief’s open questions are listed', when: { fields: ['focus', 'client', 'open_questions'] } },
    ],
  },

  // 2 — Design Brief & IP Plan ────────────────────────────────────────────────
  {
    id: 'np_design',
    courseId: 'network-plus',
    num: 2,
    file: '02_Design_Brief_and_IP_Plan.md',
    title: 'Design Brief & IP Plan',
    owner: 'design',
    shared: true,
    folder: '01_Design',
    standard: 'RFC 1918 addressing · segmentation',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['np_ports', 'np_config'],
    purpose:
      'What the branch needs, the rules that separate its groups, what the building has, and the addressing plan: one rule, every VLAN derived from it. Written before anything is configured, because a VLAN nobody can trace to a requirement is decoration.',
    howTo: 'One row per group with its needs. The rules as sentences. The survey as it is. Then the rule, and the VLAN table filled from it, not typed.',
    buildSteps: [
      'Count the devices per group, not the people.',
      'Write each separation rule as a sentence a manager would sign.',
      'Survey the building: the cupboard, the drops, the ISP demarcation, the access point.',
      `Adopt the rule: the third octet is the VLAN id. ${vlan(10).name} ${vlan(10).id} is ${prefixOf(vlan(10))}, gateway ${gatewayOf(vlan(10))}.`,
      'Pools start at host 50 so static devices and management addresses are never handed out.',
    ],
    meaning: 'A design traced to requirements can be defended line by line. A rule is remembered; a sheet of typed addresses is not.',
    useIt: 'The port map and the configuration record are filled from it, and the handover opens with it.',
    pitfalls: ['Designing while discovering. Write what is, then what should be.', 'Typing an address the rule cannot derive.', 'Forgetting the management VLAN, which is where the network team lives.'],
    sections: [
      {
        kind: 'fields',
        title: 'The business',
        fields: [
          { field: 'driver', label: 'Why the network is being built', type: 'area', required: true, placeholder: COMPANY.driver },
          { field: 'availability', label: 'What cannot go down, and for how long', type: 'area', required: true, placeholder: 'The practice system during opening hours: no more than 15 minutes.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'groups',
          label: 'Who needs what',
          columns: [
            c('name', 'Group', 'text', { placeholder: 'Reception staff' }),
            c('devices', 'Devices', 'number', { unit: 'devices' }),
            c('needs', 'What they need', 'text', { placeholder: 'The practice system, the printer, the internet' }),
            c('never', 'What they must never reach', 'text', { placeholder: 'Nothing; staff reach everything but the switches' }),
          ],
          seed: [{ name: 'Guests', devices: '10', needs: 'The internet, from the waiting room', never: 'Staff PCs, printers, the switches' }],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'survey',
          label: 'The building',
          columns: [
            c('room', 'Room', 'text', { placeholder: 'Reception' }),
            c('drops', 'Drops needed', 'number', { unit: 'drops' }),
            c('note', 'Notes', 'text', { placeholder: 'Comms cupboard here; ISP router lands here' }),
          ],
        },
      },
      {
        kind: 'fields',
        title: 'The addressing rule',
        fields: [{ field: 'rule', label: 'The one rule every address follows', type: 'text', required: true, placeholder: '10.70.<vlan>.0/24 — the third octet is the VLAN id; the gateway is .1; pools start at .50' }],
      },
      {
        kind: 'group',
        group: {
          group: 'vlans',
          label: 'The VLANs — derived from the rule',
          columns: [
            c('vlan', 'VLAN', 'select', { options: VLAN_OPTIONS }),
            c('purpose', 'Purpose', 'text'),
            c('prefix', 'Prefix', 'text', { placeholder: prefixOf(vlan(10)) }),
            c('gateway', 'Gateway', 'ipv4', { placeholder: gatewayOf(vlan(10)) }),
            c('pool', 'DHCP pool', 'text', { placeholder: dhcpRangeOf(vlan(10)) }),
          ],
          seed: [vlanRow(10)],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'mgmt',
          label: 'Management addresses',
          columns: [c('device', 'Device', 'text', { placeholder: SW1.name }), c('address', 'Address', 'ipv4', { placeholder: mgmtAddress(SW1) })],
          seed: [{ device: SW1.name, address: mgmtAddress(SW1)! }, { device: R1.name, address: mgmtAddress(R1)! }],
        },
      },
    ],
    dod: [
      { label: 'The driver and the availability requirement are written', when: { fields: ['driver', 'availability'] } },
      { label: 'At least three groups with their needs and what they must never reach', when: { group: 'groups', where: { filled: ['name', 'needs', 'never'] }, atLeast: 3 } },
      { label: 'The building is surveyed', when: { group: 'survey', where: { filled: ['room', 'drops'] }, atLeast: 2 } },
      { label: 'The rule is written and all four VLANs are derived from it', when: { all: [{ fields: ['rule'] }, { group: 'vlans', where: { filled: ['vlan', 'prefix', 'gateway'] }, atLeast: 4 }] } },
      { label: 'Every switch and the router have a management address', when: { group: 'mgmt', where: { filled: ['device', 'address'] }, atLeast: 3 } },
    ],
  },

  // 3 — VLAN & Port Map ───────────────────────────────────────────────────────
  {
    id: 'np_ports',
    courseId: 'network-plus',
    num: 3,
    file: '03_VLAN_and_Port_Map.md',
    title: 'VLAN & Port Map',
    owner: 'sw',
    shared: true,
    folder: '01_Design',
    standard: 'Detailed design · IPAM',
    weeks: [1, 2],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['np_config'],
    purpose: 'Every cabled port on every switch and the router: what plugs in, access or trunk, which VLAN, and the cable. Written before a switch is touched, so the map and the switch cannot end up different.',
    howTo: 'One row per cabled port from the design, including both ends of each trunk and the ISP link. When the build changes a port, change the row the same day.',
    buildSteps: ['Start from the links in the design; each one is a row at each end.', 'Access ports name their VLAN; trunks name the native VLAN.', 'The ISP link is a row with the public addresses on it.'],
    meaning: 'A port map that matches the switches is what a fault is found against in Week 3 and what the install-day team cables from in Week 4.',
    useIt: 'The configuration record cites it port by port; the migration plan copies it.',
    pitfalls: ['A trunk recorded at one end only.', 'A port that changed during the build and not in the map.'],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'ports',
          label: 'Every cabled port',
          columns: [
            c('device', 'Device', 'text', { placeholder: SW1.name }),
            c('port', 'Port', 'text', { placeholder: 'Fa0/1' }),
            c('connects', 'Connects to', 'text', { placeholder: 'PC-STAFF-1 Fa0' }),
            c('mode', 'Mode', 'select', { options: ['Access', 'Trunk', 'Routed (WAN)'] }),
            c('vlan', 'VLAN (access) or native (trunk)', 'select', { options: VLAN_OPTIONS }),
            c('cable', 'Cable', 'select', { options: ['Straight-through', 'Crossover', 'Fibre', 'Serial / provider'] }),
          ],
          seed: LINKS.slice(0, 3).map((l) => ({
            device: l.from,
            port: l.fromPort,
            connects: `${l.to} ${l.toPort}`,
            mode: l.kind === 'trunk' ? 'Trunk' : l.kind === 'wan' ? 'Routed (WAN)' : 'Access',
            vlan: `${l.kind === 'access' ? l.vlan : 99} — ${vlan(l.kind === 'access' ? l.vlan! : 99).name}`,
            cable: l.kind === 'trunk' ? 'Crossover' : 'Straight-through',
          })),
        },
      },
      {
        kind: 'fields',
        title: 'The ISP link',
        fields: [
          { field: 'wan_prefix', label: 'Link prefix', type: 'text', required: true, placeholder: WAN.prefix },
          { field: 'wan_router', label: 'Our side', type: 'ipv4', required: true, placeholder: WAN.router },
          { field: 'wan_isp', label: 'The ISP side (the default route)', type: 'ipv4', required: true, placeholder: WAN.isp },
        ],
      },
    ],
    dod: [
      { label: 'At least eight ports are rows with a device, a port, a mode and what connects', when: { group: 'ports', where: { filled: ['device', 'port', 'connects', 'mode'] }, atLeast: 8 } },
      { label: 'Both trunks are rows', when: { group: 'ports', where: { column: 'mode', equals: 'Trunk' }, atLeast: 2 } },
      { label: 'The ISP link is addressed', when: { fields: ['wan_prefix', 'wan_router', 'wan_isp'] } },
    ],
  },

  // 4 — Configuration Record ──────────────────────────────────────────────────
  {
    id: 'np_config',
    courseId: 'network-plus',
    num: 4,
    file: '04_Configuration_Record.md',
    title: 'Configuration Record',
    owner: 'rt',
    shared: true,
    folder: '02_Build',
    standard: 'Configuration record',
    weeks: [1, 2, 3],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['np_verify', 'np_handover'],
    purpose: 'What was configured, on which device, when, and the show output that proved it. One row per change as it is made, so the record is the build and not a memory of it.',
    howTo: 'After each configuration step, add a row: device, what changed, the command block, the show line that proved it. Paste the VLAN table, the trunk list and the route table when they are complete.',
    buildSteps: ['Hostnames and link proof in Week 1.', 'VLANs, access ports, trunks and management addresses in Week 2.', 'Subinterfaces, the default route and NAT in Week 2.', 'Port security and the access list in Week 3.'],
    meaning: 'A record kept as the build happens is the only one that matches the device. The show output beside each row is what makes a row true.',
    useIt: 'The verification log tests against it; the migration plan loads from the backups it names.',
    pitfalls: ['Writing the record at the end of the week from memory.', 'A row with a command and no proof.'],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Every configuration change, with its proof',
          columns: [
            c('device', 'Device', 'text', { placeholder: SW1.name }),
            c('what', 'What changed', 'text', { placeholder: 'VLANs 10, 20, 30, 99 created' }),
            c('week', 'Week', 'select', { options: ['1', '2', '3'] }),
            c('proof', 'The show line that proves it', 'text', { placeholder: `show vlan brief: ${vlan(10).id} ${vlan(10).name} active Fa0/1` }),
          ],
          seed: [{ device: SW1.name, what: `hostname ${SW1.name}; uplinks up`, week: '1', proof: `show cdp neighbors: ${R1.name} on Gig 0/1` }],
        },
      },
      {
        kind: 'fields',
        title: 'The tables as built',
        fields: [
          { field: 'vlan_table', label: `show vlan brief on ${SW1.name}`, type: 'paste', required: true, placeholder: `${vlan(10).id}   ${vlan(10).name}   active   Fa0/1` },
          { field: 'trunks', label: 'show interfaces trunk', type: 'paste', required: true, placeholder: 'Gig0/1  on  802.1q  trunking  99' },
          { field: 'routes', label: `show ip route on ${R1.name}`, type: 'paste', required: true, placeholder: `C  ${prefixOf(vlan(10))} is directly connected, GigabitEthernet0/0/0.10\nS* 0.0.0.0/0 via ${WAN.isp}` },
        ],
      },
    ],
    dod: [
      { label: 'At least six changes are rows with a device, what changed and a proof line', when: { group: 'changes', where: { filled: ['device', 'what', 'proof'] }, atLeast: 6 } },
      { label: 'The VLAN table, the trunks and the route table are pasted as built', when: { fields: ['vlan_table', 'trunks', 'routes'] }, week: 2 },
    ],
  },

  // 5 — Services & Verification Log ──────────────────────────────────────────
  {
    id: 'np_verify',
    courseId: 'network-plus',
    num: 5,
    file: '05_Services_and_Verification_Log.md',
    title: 'Services & Verification Log',
    owner: 'rt',
    shared: true,
    folder: '02_Build',
    standard: 'Test & acceptance',
    weeks: [2, 3],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['np_handover'],
    purpose: 'The pools and the resolver as served, and the test matrix: one row per rule of the policy, what was tested from where, the result, and whether that result is the one the rule wants. The rows that must fail are the proof the policy exists.',
    howTo: 'Record each pool from the router. Then one row per policy rule: from which PC, to what, the command, the result, and MUST PASS or MUST FAIL. Rerun the matrix after the Week 3 access list and after every fault.',
    buildSteps: ['One row per DHCP pool with its gateway and resolver.', 'One row per policy rule, tested from the right PC.', 'A MUST FAIL row that passes is open until Week 3 closes it; write the date it closed.'],
    meaning: 'A network is proved by its refusals as much as its replies. A matrix with no MUST FAIL rows has not tested the policy.',
    useIt: 'Week 3 reruns it after the access list and after each fault; the migration plan reruns it on install day.',
    pitfalls: ['Testing only what should work.', 'Testing the guest rule from a staff PC.'],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'pools',
          label: 'DHCP pools as served',
          columns: [
            c('vlan', 'VLAN', 'select', { options: VLAN_OPTIONS }),
            c('range', 'Range', 'text', { placeholder: dhcpRangeOf(vlan(10)) }),
            c('gateway', 'Gateway', 'ipv4', { placeholder: gatewayOf(vlan(10)) }),
            c('dns', 'DNS', 'ipv4', { placeholder: WAN.dns }),
            c('proof', 'A client that got one', 'text', { placeholder: 'PC-STAFF-1: 10.70.10.50' }),
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'matrix',
          label: 'The test matrix — every rule, including the ones that must fail',
          columns: [
            c('from', 'From', 'text', { placeholder: 'PC-GUEST-1' }),
            c('to', 'To', 'text', { placeholder: `${PRINTER.name} ${mgmtAddress(PRINTER)}` }),
            c('expect', 'Expected', 'select', { options: ['MUST PASS', 'MUST FAIL'] }),
            c('result', 'Result', 'select', { options: ['Reply', 'Unreachable / timed out', 'Not tested'] }),
            c('ok', 'As the rule wants', 'select', { options: YN }),
            c('when', 'Tested', 'text', { placeholder: 'Week 3, after the ACL' }),
          ],
          seed: POLICY.slice(0, 4).map((p) => ({
            from: `PC in ${vlan(p.from).name}`,
            to: typeof p.to === 'number' ? `${vlan(p.to).name} ${gatewayOf(vlan(p.to))}` : p.to === 'internet' ? WAN.isp : 'the practice',
            expect: p.allow ? 'MUST PASS' : 'MUST FAIL',
            result: 'Not tested',
            ok: '',
            when: '',
          })),
        },
      },
    ],
    dod: [
      { label: 'Every client VLAN has a served pool with a client that got an address', when: { group: 'pools', where: { filled: ['vlan', 'range', 'gateway', 'proof'] }, atLeast: 3 } },
      { label: 'The matrix has a row per policy rule, tested', when: { group: 'matrix', where: { all: [{ filled: ['from', 'to', 'expect'] }, { column: 'result', matches: '^(Reply|Unreachable)' }] }, atLeast: 6 } },
      { label: 'At least two MUST FAIL rows exist', when: { group: 'matrix', where: { column: 'expect', equals: 'MUST FAIL' }, atLeast: 2 } },
      { label: 'After Week 3, every row is as the rule wants', when: { group: 'matrix', atLeast: 6, every: { column: 'ok', equals: 'Yes' } }, week: 3 },
    ],
  },

  // 6 — Change & Fault Log ────────────────────────────────────────────────────
  {
    id: 'np_changes',
    courseId: 'network-plus',
    num: 6,
    file: '06_Change_and_Fault_Log.md',
    title: 'Change & Fault Log',
    owner: 'ops',
    shared: true,
    folder: '03_Operate',
    standard: 'Change & patch management, standard operating procedures',
    weeks: [3],
    kind: 'form',
    exportFormat: 'md',
    feeds: ['np_handover'],
    purpose: 'How the branch is run: where logs go, which backups exist, the one change made under a record, and the three faults worked by layer. The operating record a stranger reads on day one.',
    howTo: 'Record the syslog server and the backup files. Write the change request before the change and close it with a verification and a reviewer. Open a ticket per fault from the symptom, work it bottom up, and close it with the layer and the fix.',
    buildSteps: ['The syslog server and one message from each device.', 'The backup file per device, named with the date.', 'The change: what, why, risk, rollback, reviewer, verification, closed.', 'Three tickets: symptom, layers ruled out, cause, fix, matrix rerun.'],
    meaning: 'A change with a reviewer and a rollback can be undone. A ticket that names the layer teaches the next technician where to look first.',
    useIt: 'The migration plan copies the backups and the runbook lines from it.',
    pitfalls: ['A change typed in before it was written down.', 'A ticket closed with "fixed" and no layer.'],
    sections: [
      {
        kind: 'fields',
        title: 'Logging and backups',
        fields: [
          { field: 'syslog', label: 'Syslog server and proof a message arrived', type: 'text', required: true, placeholder: '10.70.99.10 — show logging: Logging to 10.70.99.10, 3 message lines logged' },
          { field: 'backups', label: 'Backup files, one per device', type: 'area', required: true, placeholder: `${SW1.name}-20261103.cfg · SW-02-20261103.cfg · ${R1.name}-20261103.cfg on the TFTP server` },
        ],
      },
      {
        kind: 'fields',
        title: 'The change — written before it was made',
        fields: [
          { field: 'chg_what', label: 'What changes, on which devices', type: 'area', required: true, placeholder: 'VLAN 40 Treatment on both switches; subinterface .40, NAT inside and a pool on R1-BR; Fa0/5 on SW-02 as access 40.' },
          { field: 'chg_why', label: 'Why', type: 'text', required: true, placeholder: 'A new treatment room with its own devices.' },
          { field: 'chg_risk', label: 'Risk', type: 'text', required: true, placeholder: 'A typo on the trunk allowed list drops another VLAN.' },
          { field: 'chg_rollback', label: 'Rollback', type: 'text', required: true, placeholder: 'Load R1-BR-pre-change-40.cfg; no vlan 40 on both switches.' },
          { field: 'chg_reviewer', label: 'Reviewed by (a teammate)', type: 'text', required: true, placeholder: 'Sam' },
          { field: 'chg_verified', label: 'Verification after the change', type: 'text', required: true, placeholder: 'PC in VLAN 40 got 10.70.40.50 and reached the ISP; matrix rerun, all rows as the rule wants.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'faults',
          label: 'Faults — worked bottom up',
          columns: [
            c('ref', 'Ticket', 'text', { placeholder: 'F-001' }),
            c('symptom', 'Symptom as reported', 'text', { placeholder: 'Reception cannot print' }),
            c('ruled_out', 'Ruled out, in order', 'text', { placeholder: 'Link up; port in VLAN 10; trunk native mismatch found' }),
            c('layer', 'Layer', 'select', { options: ['Physical / link', 'Switching (VLAN, trunk)', 'Routing (gateway, route)', 'Service (DHCP, DNS, NAT)', 'Policy (ACL, port security)'] }),
            c('cause', 'Cause', 'text', { placeholder: 'Native VLAN 1 on Gig0/1 of SW-01' }),
            c('fix', 'Fix and proof', 'text', { placeholder: 'switchport trunk native vlan 99; printer answers from PC-STAFF-1' }),
          ],
        },
      },
    ],
    dod: [
      { label: 'Logs go to one place and every device has a named backup', when: { fields: ['syslog', 'backups'] } },
      { label: 'The change is a record with a reviewer, a rollback and a verification', when: { fields: ['chg_what', 'chg_why', 'chg_risk', 'chg_rollback', 'chg_reviewer', 'chg_verified'] } },
      { label: 'Three faults are closed with the layer named and what was ruled out', when: { group: 'faults', where: { filled: ['symptom', 'ruled_out', 'layer', 'cause', 'fix'] }, atLeast: 3 } },
    ],
  },

  // 7 — Equipment Research & BOM ──────────────────────────────────────────────
  {
    id: 'np_bom',
    courseId: 'network-plus',
    num: 7,
    file: '07_Equipment_Research_and_BOM.md',
    title: 'Equipment Research & BOM',
    owner: 'design',
    shared: true,
    folder: '04_Move',
    standard: 'Hardware audit & compatibility validation',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    feeds: ['np_handover'],
    purpose: 'The move from the simulator toward real equipment, done the way a team does it: the capabilities each device must have, two real candidates per class with the datasheet line that proves them, the one check before buying, and a priced, dated, sourced bill of materials with two totals.',
    howTo: 'Capabilities first, from the port map and the policy. Then candidates, new or used, with the datasheet line. Then the bill: quantity, price, date, source, lead time, including the lines a design forgets. Two totals, with the reason for the one you recommend.',
    buildSteps: [
      'Per device class: ports and speed, trunks, PoE, routed interfaces, NAT, a console port.',
      'Two candidates per class; the CCNA buying guide bands are the reference for second-hand.',
      'The one check before buying: console port, PoE budget, interface count, licence.',
      'The bill: every line priced from a listing with its date; cables, patch panel, cabinet and the ISP service included.',
      'Two totals: the cheapest that meets the design, and the recommended set.',
    ],
    meaning: 'A model goes out of stock; a capability does not. The team that buys capabilities checks the box against the design on the day it arrives.',
    useIt: 'The migration plan names what is bought; the business signs the total.',
    pitfalls: ['A "smart" switch with no console port.', 'A total with no cables, no cabinet and no ISP line.', 'A price with no date.'],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'capabilities',
          label: 'What each device must do',
          columns: [
            c('cls', 'Device class', 'select', { options: ['Access switch', 'Router', 'Access point', 'Server (syslog, TFTP)', 'Cabling and patching', 'Cabinet and power', 'ISP service'] }),
            c('qty', 'Quantity', 'number', { unit: 'units' }),
            c('must', 'Must do', 'text', { placeholder: '24 ports, 802.1Q trunks, PoE 15 W for the AP, console port' }),
            c('traced', 'Traced to', 'text', { placeholder: 'Port map rows SW-01; policy guest rule' }),
          ],
          seed: [{ cls: 'Access switch', qty: '2', must: '24 ports at 1 Gbps, 802.1Q trunks, one PoE port for the AP, a console port and a CLI', traced: 'Port map SW-01 and SW-02' }],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'candidates',
          label: 'Candidates — two per class, with the datasheet line',
          help: `Second-hand bands, from the CCNA buying guide: ${Object.values(BAND_LABEL).join(' · ')}.`,
          columns: [
            c('cls', 'Class', 'text', { placeholder: 'Access switch' }),
            c('model', 'Model', 'text', { placeholder: BUYING_GUIDE[0].models[1] }),
            c('proves', 'Datasheet line that proves the capability', 'text', { placeholder: '24 10/100/1000 ports, 2 SFP uplinks, IEEE 802.1Q' }),
            c('check', 'The one check before buying', 'text', { placeholder: BUYING_GUIDE[0].check }),
            c('band', 'New or used, and the band', 'select', { options: ['New', 'Used — low band', 'Used — medium band', 'Used — high band'] }),
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'bom',
          label: 'The bill of materials — priced, dated, sourced',
          columns: [
            c('item', 'Item', 'text', { placeholder: 'Catalyst 2960-X 24-port, used' }),
            c('qty', 'Qty', 'number', { unit: 'units' }),
            c('price', 'Unit price', 'number', { unit: 'USD' }),
            c('date', 'Price date', 'text', { placeholder: '2026-11-10' }),
            c('source', 'Source (link)', 'text', { placeholder: 'https://…' }),
            c('lead', 'Lead time', 'text', { placeholder: '5 days' }),
            c('set', 'In which set', 'select', { options: ['Cheapest', 'Recommended', 'Both'] }),
          ],
        },
      },
      {
        kind: 'fields',
        title: 'The totals',
        fields: [
          { field: 'total_cheapest', label: 'Cheapest set that meets the design', type: 'number', required: true, unit: 'USD' },
          { field: 'total_recommended', label: 'Recommended set', type: 'number', required: true, unit: 'USD' },
        ],
      },
      { kind: 'decision', block: SET_DECISION },
    ],
    dod: [
      { label: 'Every device class has its capabilities traced to the design', when: { group: 'capabilities', where: { filled: ['cls', 'qty', 'must', 'traced'] }, atLeast: 5 } },
      { label: 'Two candidates per device class, each with a datasheet line and a check', when: { group: 'candidates', where: { filled: ['cls', 'model', 'proves', 'check'] }, atLeast: 6 } },
      { label: 'Every bill line is priced, dated and sourced', when: { group: 'bom', atLeast: 6, every: { filled: ['item', 'qty', 'price', 'date', 'source'] } } },
      { label: 'Cables, cabinet and the ISP service are lines', when: { group: 'bom', where: { column: 'item', matches: 'cable|patch|cabinet|rack|ISP' }, atLeast: 2 } },
      { label: 'Two totals', when: { fields: ['total_cheapest', 'total_recommended'] } },
      decisionDod(SET_DECISION),
    ],
  },

  // 8 — Migration Plan & Handover ─────────────────────────────────────────────
  {
    id: 'np_handover',
    courseId: 'network-plus',
    num: 8,
    file: '08_Migration_Plan_and_Handover.md',
    title: 'Migration Plan & Handover',
    owner: 'design',
    shared: true,
    capstone: true,
    folder: '04_Move',
    standard: 'As-built documentation · operational handover',
    weeks: [4],
    kind: 'template',
    exportFormat: 'md',
    purpose: 'How the simulated build becomes the real branch, and the handover of everything the team made: the install order, the backup to load per device, what real IOS needs that the simulator did not, the tests to rerun, the risks with their rollback, the as-built, the known issues, a first-day check, and a custody row per artifact.',
    howTo: 'Order the install. Name the backup per device and the lines to add for real gear. List the simulator gaps honestly. Copy the test matrix as the acceptance test. Every risk gets a rollback. Hash every artifact into the custody log. Issue it.',
    buildSteps: [
      'Install order: cabinet and power, patch panel and cables, switches, router, ISP handover, the matrix.',
      'Per device: the backup file, and what to change for real gear (interface names, SSH and local users, NTP, the real resolver).',
      'Simulator gaps: what Packet Tracer did not model, and how the real build covers each.',
      'Risks with rollbacks; known issues; the first-day check in order.',
      'The custody log: the project file, every backup, every export, hashed.',
    ],
    meaning: 'The simulator taught the design. The plan is where the team admits what it did not teach, before an ISP engineer is standing in the cupboard.',
    useIt: 'It is the capstone: reviewed by Operations, approved by Routing, issued with the bill of materials.',
    pitfalls: ['A plan that assumes the simulator’s interface names.', 'No rollback on the ISP cut-over step.', 'A hash missing on the one file that matters: the router backup.'],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'order',
          label: 'The install order',
          columns: [
            c('step', 'Step', 'number', { unit: '#' }),
            c('work', 'Work', 'text', { placeholder: 'Mount the cabinet; power; patch panel' }),
            c('who', 'Who', 'text', { placeholder: 'Operations' }),
            c('proof', 'Done when', 'text', { placeholder: 'Every drop tones to the panel' }),
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'loads',
          label: 'Per device: the backup to load and what real IOS needs',
          columns: [
            c('device', 'Device', 'text', { placeholder: R1.name }),
            c('file', 'Backup file', 'text', { placeholder: `${R1.name}-20261103.cfg` }),
            c('adjust', 'Changes for real gear', 'text', { placeholder: 'Interface names; local user and SSH; ntp server; the ISP resolver' }),
          ],
          seed: [{ device: R1.name, file: `${R1.name}-20261103.cfg`, adjust: 'Interface names from the real model; a local user and SSH; ntp server; the ISP\'s resolver in the pools' }],
        },
      },
      {
        kind: 'fields',
        title: 'What the simulator did not teach',
        fields: [
          { field: 'gaps', label: 'Simulator gaps and how the real build covers each', type: 'area', required: true, placeholder: 'No SSH or local users modelled: add before the cut-over. PoE not modelled: check the budget on arrival. Simplified show output: rerun the matrix on real gear.' },
          { field: 'acceptance', label: 'The acceptance test on install day', type: 'text', required: true, placeholder: 'The test matrix from form 5, every row, from the real PCs, before the ISP engineer leaves.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'risks',
          label: 'Risks, each with a rollback',
          columns: [
            c('risk', 'Risk', 'text', { placeholder: 'The ISP hands over a different public address' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'Reload the backup; keep the old router until the matrix passes' }),
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'known_issues',
          label: 'Known issues — honestly',
          columns: [c('issue', 'Issue', 'text'), c('plan', 'What to do about it', 'text')],
        },
      },
      {
        kind: 'fields',
        title: 'The first-day check — ten minutes, in order',
        fields: [{ field: 'first_day', label: 'Steps a stranger follows', type: 'area', required: true, placeholder: '1 Every switch answers on its management address. 2 A staff PC gets an address and prints. 3 A guest reaches the internet and is refused the printer. 4 Logs arrive at the server. 5 The backups are current.' }],
      },
      custodySection({
        seed: [
          { evidence_id: 'E-01', filename: 'branch-t1.pkt', description: 'The project file as handed over', collected_by: 'Design', datetime: '2026-11-10 16:00', location: 'The team folder', sha256: '3f9a…', transferred_to: 'Operations', transferred_at: '2026-11-10 16:10', notes: 'the build the plan loads from' },
        ],
      }),
      {
        kind: 'fields',
        title: 'Document control',
        fields: [
          { field: 'doc_version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
          { field: 'doc_date', label: 'Date issued', type: 'date', required: true },
          { field: 'signoff', label: 'Issued by (Design focus)', type: 'signature', required: true },
        ],
      },
    ],
    dod: [
      { label: 'The install is ordered with a done-when per step', when: { group: 'order', where: { filled: ['step', 'work', 'proof'] }, atLeast: 5 } },
      { label: 'Every device names its backup and the changes real gear needs', when: { group: 'loads', where: { filled: ['device', 'file', 'adjust'] }, atLeast: 3 } },
      { label: 'The simulator gaps and the acceptance test are written', when: { fields: ['gaps', 'acceptance'] } },
      { label: 'Every risk has a rollback', when: { group: 'risks', atLeast: 2, every: { filled: ['risk', 'rollback'] } } },
      { label: 'A first-day check exists', when: { fields: ['first_day'] } },
      { label: 'Every artifact is logged with a SHA-256 (chain of custody)', when: everyEvidenceHashed() },
      { label: 'The document is versioned, dated and signed', when: { fields: ['doc_version', 'doc_date', 'signoff'] } },
    ],
  },
];

export const NETWORK_PLUS_DELIVERABLES: DeliverableDef[] = NETWORK_PLUS_FORMS;

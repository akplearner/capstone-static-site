/**
 * The Network+ Capstone Branch's picture, as DATA (R103, R131).
 *
 * One branch office: the two switches and the router, the PCs, the printer
 * and the guest access point, the ISP on the far side, the simulator and the
 * server the logs and backups land on, and the records lane. Each part
 * arrives in the week the course first builds it; the week's process is
 * that week's thread walked across the same boxes. Names come from
 * `networkPlusTopology.ts`; nothing is typed twice.
 */
import { archBuildModel, type ArchNode, type ArchPicture, type ArchZone } from './archPicture';
import { DEVICES, WAN } from '../networkPlusTopology';

const d = (name: string) => DEVICES.find((x) => x.name === name)!;

export const ARCH: ArchPicture = {
  copy: {
    title: 'The branch — two switches, one router, four VLANs, and the way out',
    howToRead:
      'Left: the simulator the build runs in and the server the logs and backups land on. Middle: the branch as designed, week by week. Right: the ISP and the research toward real equipment. Bottom: the records that document each part. Every task names one of these boxes.',
    footer: `One branch in Packet Tracer; no hardware needed to pass. The ISP side is ${WAN.prefix}, a documentation range, so nothing here is anyone's address.`,
  },
  view: { w: 960, h: 610 },
  zones: [
    { id: 'lab', label: 'The lab', note: 'simulator · server', x: 20, y: 40, w: 180, h: 340, tone: 1 },
    { id: 'branch', label: 'The branch — what the team builds', note: 'switches · router · VLANs', x: 220, y: 40, w: 500, h: 340, tone: 2 },
    { id: 'outside', label: 'Outside, and the move', note: 'ISP · real equipment', x: 740, y: 40, w: 200, h: 340, tone: 3 },
    { id: 'proof', label: 'The proof and the way back', note: 'matrix · backups · plan', x: 220, y: 410, w: 720, h: 90, tone: 4 },
    { id: 'records', label: 'Records — the forms that document the branch', note: '1–8 · issued at handover', x: 20, y: 520, w: 920, h: 70, tone: 6, lane: true },
  ] satisfies ArchZone[],
  nodes: [
    { id: 'simulator', label: 'Packet Tracer', sub: 'the project file', kind: 'app', zone: 'lab', x: 110, y: 100, arrives: 0, records: 'np_lab', role: 'ops', purpose: 'The sandbox every build and every proof runs in' },
    { id: 'console', label: 'A device prompt', sub: 'the CLI tab', kind: 'endpoint', zone: 'lab', x: 110, y: 170, arrives: 0, records: 'np_lab', role: 'ops', purpose: 'Where every command is typed and every show output pasted from' },
    { id: 'server', label: 'Syslog and TFTP server', sub: 'in Management', kind: 'server', zone: 'lab', x: 110, y: 240, arrives: 3, records: 'np_changes', role: 'ops', purpose: 'Receives every log line and holds every configuration backup' },
    { id: 'team', label: 'The team', sub: 'four focuses', kind: 'people', zone: 'lab', x: 110, y: 310, arrives: 0, records: 'np_lab', role: 'design', purpose: 'Everyone configures; the focus decides which record each leads' },
    { id: 'sw1', label: d('SW-01').name, sub: d('SW-01').model, kind: 'switch', zone: 'branch', x: 310, y: 100, arrives: 1, records: 'np_ports', role: 'sw', purpose: d('SW-01').purpose },
    { id: 'sw2', label: d('SW-02').name, sub: d('SW-02').model, kind: 'switch', zone: 'branch', x: 470, y: 100, arrives: 1, records: 'np_ports', role: 'sw', purpose: d('SW-02').purpose },
    { id: 'router', label: d('R1-BR').name, sub: d('R1-BR').model, kind: 'router', zone: 'branch', x: 630, y: 100, arrives: 1, records: 'np_config', role: 'rt', purpose: d('R1-BR').purpose },
    { id: 'vlans', label: 'Four VLANs', sub: 'Staff · Devices · Guest · Mgmt', kind: 'network', zone: 'branch', x: 310, y: 170, arrives: 2, records: 'np_design', role: 'design', purpose: 'One per group, derived from one addressing rule' },
    { id: 'trunks', label: 'Two trunks', sub: '802.1Q · native 99', kind: 'network', zone: 'branch', x: 470, y: 170, arrives: 2, records: 'np_config', role: 'sw', purpose: 'One cable carries every VLAN between the switches and to the router' },
    { id: 'gateways', label: 'Gateways and NAT', sub: 'router-on-a-stick', kind: 'control', zone: 'branch', x: 630, y: 170, arrives: 2, records: 'np_config', role: 'rt', purpose: 'A subinterface per VLAN, a default route, one public address out' },
    { id: 'staffpc', label: 'Staff PCs', sub: 'VLAN 10 · DHCP', kind: 'endpoint', zone: 'branch', x: 310, y: 240, arrives: 2, records: 'np_verify', role: 'rt', purpose: 'Get a pool address and prove the paths the policy allows' },
    { id: 'printer', label: d('PRINTER-1').name, sub: 'VLAN 20 · static', kind: 'endpoint', zone: 'branch', x: 470, y: 240, arrives: 2, records: 'np_verify', role: 'rt', purpose: 'Reachable from Staff, refused to Guest: the rule the matrix proves' },
    { id: 'guest', label: 'Guest WiFi', sub: 'AP and a laptop · VLAN 30', kind: 'wireless', zone: 'branch', x: 630, y: 240, arrives: 2, records: 'np_verify', role: 'rt', purpose: 'Internet only; the refusal of the practice is the proof' },
    { id: 'acl', label: 'Access list', sub: 'GUEST-IN', kind: 'control', zone: 'branch', x: 310, y: 310, arrives: 3, records: 'np_verify', role: 'sw', purpose: 'The policy as deny lines with match counters' },
    { id: 'portsec', label: 'Port security', sub: 'one device per port', kind: 'control', zone: 'branch', x: 470, y: 310, arrives: 3, records: 'np_config', role: 'sw', purpose: 'A stray laptop shuts the port instead of joining the network' },
    { id: 'change', label: 'Change: VLAN 40', sub: 'under a record', kind: 'ticket', zone: 'branch', x: 630, y: 310, arrives: 3, records: 'np_changes', role: 'ops', purpose: 'A new room added with a backup, a reviewer and a rollback' },
    { id: 'isp', label: 'ISP', sub: WAN.isp, kind: 'outside', zone: 'outside', x: 840, y: 100, external: true, arrives: 2, records: 'np_ports', role: 'rt', purpose: 'The far end of the default route; the only public address' },
    { id: 'research', label: 'Real equipment', sub: 'capabilities · candidates', kind: 'evidence', zone: 'outside', x: 840, y: 170, arrives: 4, records: 'np_bom', role: 'design', purpose: 'Two real models per class with the datasheet line that proves them' },
    { id: 'bom', label: '7 Bill of materials', sub: '', kind: 'record', zone: 'records', x: 85, y: 572, arrives: 4, records: 'np_bom', role: 'ops', purpose: 'Records every line with a price, a date and a source' },
    { id: 'realkit', label: 'The CCNA kit', sub: 'optional · Week 5', kind: 'switch', zone: 'outside', x: 840, y: 240, arrives: 5, records: 'np_handover', role: 'sw', purpose: 'The same build on borrowed hardware, differences listed' },
    { id: 'faults', label: 'Three faults', sub: 'worked by layer', kind: 'ticket', zone: 'outside', x: 840, y: 310, external: true, arrives: 3, records: 'np_changes', role: 'ops', purpose: 'Injected by another team, worked bottom up, closed with the layer' },
    { id: 'matrix', label: 'Test matrix', sub: 'MUST PASS · MUST FAIL', kind: 'evidence', zone: 'proof', x: 310, y: 455, arrives: 2, records: 'np_verify', role: 'rt', purpose: 'One row per rule; the refusals are the proof the policy exists' },
    { id: 'backups', label: 'Config backups', sub: 'one per device, dated', kind: 'backup', zone: 'proof', x: 470, y: 455, arrives: 3, records: 'np_changes', role: 'ops', purpose: 'The way back before any change, and the build the plan loads' },
    { id: 'logs', label: 'Logs', sub: 'timestamped · one place', kind: 'monitor', zone: 'proof', x: 630, y: 455, arrives: 3, records: 'np_changes', role: 'ops', purpose: 'Where a fault is found first, in order' },
    { id: 'plan', label: 'Migration plan', sub: 'install order · gaps', kind: 'evidence', zone: 'proof', x: 790, y: 455, arrives: 4, records: 'np_handover', role: 'design', purpose: 'How the simulated build becomes the real branch, honestly' },
    { id: 'r_lab', label: '1 Lab & path', sub: '', kind: 'record', zone: 'records', x: 85, y: 538, arrives: 0, records: 'np_lab', role: 'ops', purpose: 'Records the simulator, the file and the team' },
    { id: 'r_design', label: '2 Design brief & IP plan', sub: '', kind: 'record', zone: 'records', x: 250, y: 538, arrives: 1, records: 'np_design', role: 'design', purpose: 'Records the requirements, the rule and every VLAN' },
    { id: 'r_ports', label: '3 VLAN & port map', sub: '', kind: 'record', zone: 'records', x: 415, y: 538, arrives: 1, records: 'np_ports', role: 'sw', purpose: 'Records every cabled port before a switch is touched' },
    { id: 'r_config', label: '4 Configuration record', sub: '', kind: 'record', zone: 'records', x: 580, y: 538, arrives: 1, records: 'np_config', role: 'rt', purpose: 'Records every change with the show line that proves it' },
    { id: 'r_verify', label: '5 Services & verification', sub: '', kind: 'record', zone: 'records', x: 745, y: 538, arrives: 2, records: 'np_verify', role: 'rt', purpose: 'Records the pools and the test matrix' },
    { id: 'r_changes', label: '6 Change & fault log', sub: '', kind: 'record', zone: 'records', x: 250, y: 572, arrives: 3, records: 'np_changes', role: 'ops', purpose: 'Records logs, backups, the change and the faults' },
    { id: 'r_handover', label: '8 Migration plan & handover', sub: '', kind: 'record', zone: 'records', x: 415, y: 572, arrives: 4, records: 'np_handover', role: 'design', purpose: 'The capstone: the move, the as-built and custody' },
    // R142: what the team can show for the branch — the repository, the case study, the bullets and the diagram.
    { id: 'r_portfolio', label: '9 Portfolio', sub: '', kind: 'record', zone: 'records', x: 580, y: 572, arrives: 4, records: 'np_portfolio', role: 'design', purpose: 'The repository, case study, resume bullets and diagram' },
  ] satisfies ArchNode[],
  edges: [
    { from: 'sw1', to: 'router', label: 'trunk' },
    { from: 'sw1', to: 'sw2', label: 'trunk' },
    { from: 'router', to: 'isp', label: 'default route · NAT' },
    { from: 'staffpc', to: 'printer', label: 'allowed' },
    { from: 'guest', to: 'printer', label: 'refused', kind: 'trust' },
    { from: 'sw1', to: 'server', label: 'syslog', kind: 'log' },
    { from: 'router', to: 'backups', label: 'copy running-config', kind: 'backup' },
    { from: 'research', to: 'plan', label: 'what to buy', kind: 'admin' },
  ],
};

export const ARCH_BUILD = archBuildModel(ARCH, {
  processes: {
    0: { title: 'The lab, before the design', steps: [
      { from: 'team', to: 'simulator', label: 'one project file' },
      { from: 'simulator', to: 'console', label: 'a prompt answers' },
    ] },
    1: { title: 'Week 1: discover, plan, place and cable', steps: [
      { from: 'team', to: 'vlans', label: 'one rule, four VLANs' },
      { from: 'sw1', to: 'sw2', label: 'cabled as the map says' },
      { from: 'sw1', to: 'router', label: 'neighbours seen' },
    ] },
    2: { title: 'Week 2: VLANs, trunks, gateways, services', steps: [
      { from: 'vlans', to: 'sw1', label: 'show vlan brief' },
      { from: 'trunks', to: 'router', label: 'show interfaces trunk' },
      { from: 'gateways', to: 'isp', label: 'default route · NAT' },
      { from: 'staffpc', to: 'matrix', label: 'DHCP, DNS, every rule' },
    ] },
    3: { title: 'Week 3: watch it, enforce it, change it, fix it', steps: [
      { from: 'sw1', to: 'server', label: 'logs and backups' },
      { from: 'acl', to: 'guest', label: 'the refusal, counted' },
      { from: 'change', to: 'backups', label: 'backup first, then VLAN 40' },
      { from: 'faults', to: 'logs', label: 'bottom up, by layer' },
    ] },
    4: { title: 'Week 4: research, price, plan the move', steps: [
      { from: 'router', to: 'research', label: 'capabilities, not models' },
      { from: 'research', to: 'bom', label: 'priced, dated, sourced' },
      { from: 'backups', to: 'plan', label: 'the files the install loads' },
      { from: 'plan', to: 'team', label: 'issued with custody' },
    ] },
    5: { title: 'Week 5, optional: the same build on hardware', steps: [
      { from: 'backups', to: 'realkit', label: 'loaded, interface names adjusted' },
      { from: 'realkit', to: 'matrix', label: 'rerun on copper' },
      { from: 'realkit', to: 'plan', label: 'the differences listed' },
    ] },
  },
  captions: {
    0: 'The simulator installed, a prompt answering, one project file, four focuses named.',
    1: 'New: the requirements, the addressing rule, the port map, and every device placed and cabled with neighbours seen.',
    2: 'New: four VLANs on two switches, two trunks, gateways and NAT, DHCP and DNS served, and the test matrix with its MUST FAIL rows.',
    3: 'New: logs and backups on the server, the access list that refuses Guest, port security, one change under a record, three faults worked by layer.',
    4: 'New: real equipment researched against the design, a priced bill of materials, and the migration plan issued with custody.',
    5: 'Nothing new in the branch: the same build loaded onto borrowed hardware, the matrix rerun, and the differences listed.',
  },
});

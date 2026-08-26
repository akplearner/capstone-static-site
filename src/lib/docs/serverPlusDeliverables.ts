import { Column } from '../grc/templates';
import { DeliverableDef } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * Client deliverables for the CompTIA Server+ capstone — a hands-on, documented
 * build of a rack-mount server from bare metal to a running, handed-over system.
 *
 * Every student runs the WHOLE build on their own server, independently, and
 * fills EVERY form below — that is what `shared: true` means. `owner` is the
 * focus role that leads the documentation for that record (and the lane the
 * deliverable chain draws it in), not a gate on who may open it. No deliverable
 * waits on anyone else's work. The point of the course is the *process* —
 * asset, configuration and patch management, topology, DR — captured by filling
 * these forms and exporting each as a PDF (the Generate PDF button on the
 * Deliverables page). The exact CLI for setting up components lives in the
 * course's configuration guide; these forms record what you did and why.
 *
 * Course-scoped (`courseId: 'server-plus'`) so they never surface on another
 * course. The whole set drains into `srv_as_built`, the handover package.
 */

// Local column helper (mirrors the one in definitions.ts; kept local to avoid a
// circular import, since definitions.ts imports this file).
const c = (
  field: string,
  label: string,
  type: Column['type'],
  extra: Partial<Column> = {}
): Column => ({ field, label, type, ...extra });

const CONDITION = ['New', 'Good', 'Fair', 'Poor', 'End of life'];

export const SERVER_PLUS_DELIVERABLES: DeliverableDef[] = [
  // 1 — Project Brief & Site Prep ────────────────────────────────────────────
  {
    id: 'srv_project_brief',
    feeds: ['srv_rack_install', 'srv_asset_register'],
    courseId: 'server-plus',
    num: 1,
    file: '01_Project_Brief.md',
    title: 'Project Brief & Site Prep',
    owner: 'mgmt',
    shared: true,
    folder: '00_Project',
    standard: 'Project brief / scope',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'The short written agreement of what you are deploying, where it goes, and what "done" looks like — so a stranger could pick the job up from this one page.',
    howTo:
      'Fill every field. Name the client, the server you were given, where in the room it lands, and the four milestones as your acceptance criteria.',
    buildSteps: [
      'Name the client and yourself as the technician, with a date and version.',
      'Describe the hardware you received — make, model, and its condition on arrival.',
      'State where it installs: the room, the rack, and roughly which U positions.',
      'List what the finished server must do (the services), and what is out of scope.',
      'Copy the four weekly milestones in as your acceptance criteria.',
    ],
    meaning:
      'A good brief is specific and boring. Every line is either something you will deliver or something you have written down that you will not.',
    useIt:
      'It is your north star at every milestone: before calling a week done, check your work against what this promised.',
    pitfalls: [
      'Leaving out-of-scope blank. The empty half is the half that protects you.',
      'A vague hardware description. "A server" is not an asset record; make/model/condition is.',
    ],
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'client', label: 'Client', type: 'text', required: true, placeholder: 'Granite Peak Aggregates' },
          { field: 'technician', label: 'Technician (you)', type: 'text', required: true, placeholder: 'Your name' },
          { field: 'version', label: 'Version', type: 'select', options: ['1.0', '1.1', '2.0'] },
          { field: 'start_date', label: 'Start date', type: 'date', required: true },
          { field: 'hardware', label: 'Hardware received (make / model / condition)', type: 'area', required: true, placeholder: 'Dell PowerEdge R630, 2U rack-mount, reclaimed — fair condition, out of warranty.' },
          { field: 'location', label: 'Install location (room / rack / U positions)', type: 'text', required: true, placeholder: 'Site office server room · Rack A · U20–U21' },
          { field: 'services', label: 'What the finished server must do', type: 'area', required: true, placeholder: 'Run virtualization (Proxmox) hosting a Windows and a Linux VM for the staff portal and dispatch database.' },
          { field: 'out_of_scope', label: 'Out of scope', type: 'area', placeholder: 'Internet-facing hosting, email, the client\'s desktop fleet.' },
          { field: 'acceptance', label: 'Acceptance criteria (the four milestones)', type: 'area', required: true, placeholder: 'Wk1 built & documented · Wk2 configured & deployed · Wk3 networked & connected · Wk4 secured & handed over' },
        ],
      },
    ],
    dod: [
      { label: 'Client, technician and start date are filled in', test: (d) => !!(d.fields.client && d.fields.technician && d.fields.start_date) },
      { label: 'The hardware and install location are described', test: (d) => !!(d.fields.hardware && d.fields.location) },
      { label: 'Services and acceptance criteria are written down', test: (d) => !!(d.fields.services && d.fields.acceptance) },
    ],
  },

  // 2 — Rack & Cabling Record ────────────────────────────────────────────────
  {
    id: 'srv_rack_install',
    feeds: ['srv_asset_register', 'srv_topology'],
    courseId: 'server-plus',
    num: 2,
    file: '02_Rack_and_Cabling.md',
    title: 'Rack & Cabling Record',
    owner: 'net',
    shared: true,
    folder: '01_Physical',
    standard: 'Structured cabling / rack elevation',
    weeks: [1],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The physical record of what went where in the rack, which patch-panel ports carry which link, and how it is powered — so the next person can trace a cable without pulling the rack apart.',
    howTo:
      'Record the U position of every device in the 42U rack, then every cable: patch-panel port, switch port, colour and label. A cable with no record is a cable nobody can safely move.',
    buildSteps: [
      'Note the rack size (42U) and the U position of each device from the bottom up.',
      'Mount the server on its rails and record the exact U range it occupies.',
      'Terminate the structured cabling to the patch panel; log each port.',
      'Patch each panel port to a switch port with a labelled patch lead; record the colour.',
      'Connect power through the PDU and note which outlet feeds what.',
      'Photograph the front and rear of the rack and attach it as evidence.',
    ],
    meaning:
      'A good cabling record lets someone trace any link end to end from the paperwork alone. Colour and label discipline is what separates a rack you can work in from a bird\'s nest.',
    useIt:
      'It anchors the topology diagram and the asset register, and it is the first thing a field tech reaches for when a link goes down.',
    pitfalls: [
      'Leaving a patch lead unlabelled. In six months nobody will dare unplug it.',
      'Recording the switch port but not the patch-panel port — the trace breaks in the middle.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Rack',
        fields: [
          { field: 'rack_id', label: 'Rack ID / location', type: 'text', required: true, placeholder: 'Rack A — server room' },
          { field: 'rack_size', label: 'Rack size', type: 'select', options: ['42U', '24U', '12U', 'Other'] },
          { field: 'photo', label: 'Rack photo (front & rear)', type: 'text', placeholder: 'GranitePeak_Wk1_rack-front.jpg' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'elevation',
          label: 'Rack elevation — what sits at each U',
          help: 'One row per device, top of its position first. This is the map of the rack.',
          columns: [
            c('u', 'U position', 'text', { placeholder: 'U20–U21' }),
            c('device', 'Device', 'text', { placeholder: 'Dell R630 server' }),
            c('type', 'Type', 'select', { options: ['Server', 'Switch', 'Patch panel', 'PDU', 'UPS', 'Shelf', 'Blank'] }),
            c('depth', 'Rails / mount', 'text', { placeholder: 'Sliding rails, cable-mgmt arm' }),
            c('notes', 'Notes', 'text', { placeholder: '2U, front intake / rear exhaust' }),
          ],
          seed: [
            { u: 'U24', device: '24-port patch panel', type: 'Patch panel', depth: 'Fixed, 1U', notes: 'Cat6 terminations from the office drops' },
            { u: 'U23', device: 'Cisco Catalyst 2960 switch', type: 'Switch', depth: 'Fixed, 1U', notes: 'Uplink to office LAN on port 24' },
            { u: 'U20–U21', device: 'Dell PowerEdge R630', type: 'Server', depth: 'Sliding rails', notes: '2U, the Proxmox host' },
            { u: 'U1', device: 'Rack PDU', type: 'PDU', depth: 'Vertical, rear', notes: '8-outlet, feeds every device above' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'cabling',
          label: 'Cable schedule',
          help: 'One row per cable. Trace any link from panel port to switch port using this alone.',
          columns: [
            c('label', 'Cable label', 'text', { placeholder: 'A-01' }),
            c('from', 'From', 'text', { placeholder: 'Patch panel P1' }),
            c('to', 'To', 'text', { placeholder: 'Switch Gi0/1' }),
            c('colour', 'Colour', 'select', { options: ['Blue', 'Green', 'Yellow', 'Red', 'Grey', 'Black'] }),
            c('carries', 'Carries', 'text', { placeholder: 'Server NIC 1 — management' }),
          ],
          seed: [
            { label: 'A-01', from: 'Patch panel P1', to: 'Switch Gi0/1', colour: 'Blue', carries: 'Server NIC 1 — Proxmox management' },
            { label: 'A-02', from: 'Patch panel P2', to: 'Switch Gi0/2', colour: 'Green', carries: 'Server NIC 2 — VM traffic' },
            { label: 'A-24', from: 'Switch Gi0/24', to: 'Office wall port', colour: 'Yellow', carries: 'Uplink to the office LAN' },
          ],
        },
      },
    ],
    dod: [
      { label: 'The rack is identified and its size chosen', test: (d) => !!(d.fields.rack_id && d.fields.rack_size) },
      { label: 'At least three devices are placed in the elevation', test: (d) => (d.groups.elevation ?? []).filter((r) => !!r.u && !!r.device).length >= 3 },
      { label: 'At least three cables are logged with a label and colour', test: (d) => (d.groups.cabling ?? []).filter((r) => !!r.label && !!r.colour).length >= 3 },
      { label: 'Every cable records both ends', test: (d) => (d.groups.cabling ?? []).length > 0 && (d.groups.cabling ?? []).every((r) => !!r.from && !!r.to) },
    ],
  },

  // 3 — Asset Register / CMDB ────────────────────────────────────────────────
  {
    id: 'srv_asset_register',
    feeds: ['srv_config_mgmt', 'srv_dr_plan'],
    courseId: 'server-plus',
    num: 3,
    file: '03_Asset_Register.csv',
    title: 'Asset Register',
    owner: 'mgmt',
    shared: true,
    folder: '02_Assets',
    standard: 'Asset inventory / CMDB',
    weeks: [1, 2],
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The master list of every piece of hardware and software you deploy — a lightweight CMDB. You cannot secure, budget for, patch or recover what you do not know you have.',
    howTo:
      'Walk the rack device by device and record what you can read off the hardware and the OS. Warranty and end-of-support dates are the columns that prevent nasty surprises.',
    source: 'The rack record (hardware) and everything you install (software).',
    buildSteps: [
      'List the vendors you deal with first — the register refers to them by name.',
      'Add one hardware row per physical item in the rack, with an asset tag, value and warranty date.',
      'Add one software row per installed program, with its version and support-end date.',
      'Mark condition honestly — "reclaimed, out of warranty" is useful; "Good" everywhere is not.',
      'Complete the software tab in Week 2, as part of deploying the services.',
    ],
    meaning:
      'A good register answers a budget question and a security question at once: what do we own, and what is out of support and no longer patched?',
    useIt:
      'It feeds configuration and patch management (what needs updating), and the DR plan (what has to come back, and in what order).',
    pitfalls: [
      'Recording only the server. The switch, patch panel, PDU, OS licences and installed programs are assets too.',
      'Blank end-of-life dates — that column is the one that turns the register into a risk tool.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'vendors',
          label: 'Vendor list',
          help: 'Who you buy from and who to call. Referenced by name from the hardware rows.',
          columns: [
            c('vendor', 'Vendor name', 'text', { placeholder: 'Dell Technologies' }),
            c('product', 'Product supplied', 'text', { placeholder: 'PowerEdge R630 server' }),
            c('contact', 'Contact', 'text', { placeholder: 'support@example.com' }),
            c('notes', 'Notes', 'text', { placeholder: 'Support contract expired; parts only.' }),
          ],
          seed: [
            { vendor: 'Dell Technologies', product: 'PowerEdge R630 server', contact: 'support@example.com', notes: 'Reclaimed unit — parts only.' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'hardware',
          label: 'Hardware assets',
          help: 'One row per physical item in the rack. Asset tag, warranty and condition make this a planning tool.',
          columns: [
            c('tag', 'Asset tag', 'text', { placeholder: 'GP-HW-001' }),
            c('name', 'Name', 'text', { placeholder: 'Proxmox host' }),
            c('type', 'Type', 'select', { options: ['Server', 'Switch', 'Patch panel', 'PDU', 'UPS', 'Other'] }),
            c('model', 'Make / model', 'text', { placeholder: 'Dell PowerEdge R630' }),
            c('serial', 'Serial / service tag', 'text', { placeholder: '7XK2M13' }),
            c('location', 'Location (rack / U)', 'text', { placeholder: 'Rack A · U20–U21' }),
            c('warranty_expiry', 'Warranty expiry', 'date'),
            c('value', 'Value', 'text', { placeholder: '$1,800' }),
            c('condition', 'Condition', 'select', { options: CONDITION }),
          ],
          seed: [
            { tag: 'GP-HW-001', name: 'Proxmox host', type: 'Server', model: 'Dell PowerEdge R630', serial: '7XK2M13', location: 'Rack A · U20–U21', warranty_expiry: '2024-04-02', value: '$1,800', condition: 'Fair' },
            { tag: 'GP-HW-002', name: 'Access switch', type: 'Switch', model: 'Cisco Catalyst 2960', serial: 'FOC1934', location: 'Rack A · U23', warranty_expiry: '2023-04-02', value: '$300', condition: 'Fair' },
            { tag: 'GP-HW-003', name: 'Patch panel', type: 'Patch panel', model: '24-port Cat6', serial: 'n/a', location: 'Rack A · U24', warranty_expiry: '', value: '$60', condition: 'Good' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'software',
          label: 'Software assets',
          help: 'One row per installed program, including each OS. The support-end date is the security-relevant column.',
          columns: [
            c('tag', 'Asset tag', 'text', { placeholder: 'GP-SW-001' }),
            c('host', 'Installed on', 'text', { placeholder: 'Proxmox host' }),
            c('program', 'Program', 'text', { placeholder: 'Proxmox VE' }),
            c('version', 'Version', 'text', { placeholder: '6.4-1' }),
            c('type', 'Type', 'select', { options: ['Operating system', 'Hypervisor', 'Server role', 'Database', 'Application', 'Utility'] }),
            c('install_date', 'Installed', 'date'),
            c('support_end', 'Support ends', 'date'),
          ],
          seed: [
            { tag: 'GP-SW-001', host: 'Proxmox host', program: 'Proxmox VE', version: '6.4-1', type: 'Hypervisor', install_date: '2026-02-17', support_end: '2024-07-31' },
            { tag: 'GP-SW-002', host: 'winserver VM', program: 'Windows Server 2022', version: '21H2', type: 'Operating system', install_date: '2026-02-18', support_end: '2031-10-14' },
            { tag: 'GP-SW-003', host: 'linuxsrv VM', program: 'Ubuntu Server', version: '22.04 LTS', type: 'Operating system', install_date: '2026-02-18', support_end: '2027-04-30' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least one vendor is recorded', test: (d) => (d.groups.vendors ?? []).filter((r) => !!r.vendor).length >= 1 },
      { label: 'At least three hardware assets with a tag and condition', test: (d) => (d.groups.hardware ?? []).filter((r) => !!r.tag && !!r.condition).length >= 3 },
      { label: 'At least three software assets with a version', test: (d) => (d.groups.software ?? []).filter((r) => !!r.program && !!r.version).length >= 3 },
      { label: 'Every software row names the host it runs on', test: (d) => (d.groups.software ?? []).length > 0 && (d.groups.software ?? []).every((r) => !!r.host) },
    ],
  },

  // 4 — Network Topology & IP Plan ───────────────────────────────────────────
  {
    id: 'srv_topology',
    feeds: ['srv_config_mgmt', 'srv_dr_plan'],
    courseId: 'server-plus',
    num: 4,
    file: '04_Topology_and_IP_Plan.md',
    title: 'Network Topology & IP Plan',
    owner: 'net',
    shared: true,
    folder: '03_Network',
    standard: 'Topology / IPAM',
    weeks: [3],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The picture of what connects to what, plus the table that gives every device a fixed address. A diagram lets a new tech understand the whole setup in 30 seconds; the IP plan stops duplicate-address outages.',
    howTo:
      'Describe the physical and virtual layout, then give every host — the Proxmox host and each VM — a row with its address, so the addressing is decided in one place before anything is built.',
    source: 'The rack record (the physical links) and the platform you install.',
    buildSteps: [
      'Describe the physical path: office drop → patch panel → switch → server NIC.',
      'Describe the virtual layout: the Proxmox host and the VMs on it.',
      'Reserve the address ranges — gateway, static servers, and any DHCP pool.',
      'Give the host and every VM a row with its IP, gateway and DNS.',
      'Draw the topology diagram and note its filename here.',
    ],
    meaning:
      'A good IP plan is the single source of truth for addresses. If someone assigns one without opening it, the plan has already failed.',
    useIt:
      'It anchors the configuration record and the DR plan, and it is the reference for every later network change. Keep it matching reality.',
    pitfalls: [
      'A diagram that disagrees with the build — worse than no diagram, because it is trusted.',
      'Two devices sharing an address; the collision surfaces as an outage days later.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Layout',
        fields: [
          { field: 'physical', label: 'Physical path', type: 'area', required: true, placeholder: 'Office wall port → patch panel P1 → switch Gi0/1 → server NIC 1 (management).' },
          { field: 'virtual', label: 'Virtual layout', type: 'area', required: true, placeholder: 'Proxmox host runs two VMs: winserver (Windows) and linuxsrv (Ubuntu), both bridged to the office LAN.' },
          { field: 'diagram_file', label: 'Topology diagram file', type: 'text', placeholder: 'GranitePeak_Wk3_topology.png' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'ipplan',
          label: 'IP address plan',
          help: 'Every host gets a row before it is built. This is the only place addresses are decided.',
          columns: [
            c('hostname', 'Hostname', 'text', { placeholder: 'winserver' }),
            c('role', 'Role', 'text', { placeholder: 'Windows Server VM' }),
            c('ip', 'IP address', 'text', { placeholder: '10.10.10.20' }),
            c('gateway', 'Gateway', 'text', { placeholder: '10.10.10.1' }),
            c('dns', 'DNS', 'text', { placeholder: '10.10.10.20' }),
            c('assignment', 'Static / DHCP', 'select', { options: ['Static', 'DHCP'] }),
          ],
          seed: [
            { hostname: 'pve-host', role: 'Proxmox host', ip: '10.10.10.10', gateway: '10.10.10.1', dns: '—', assignment: 'Static' },
            { hostname: 'winserver', role: 'Windows Server VM', ip: '10.10.10.20', gateway: '10.10.10.1', dns: 'self', assignment: 'Static' },
            { hostname: 'linuxsrv', role: 'Ubuntu Server VM', ip: '10.10.10.21', gateway: '10.10.10.1', dns: '10.10.10.20', assignment: 'Static' },
          ],
        },
      },
    ],
    dod: [
      { label: 'The physical and virtual layouts are described', test: (d) => !!(d.fields.physical && d.fields.virtual) },
      { label: 'At least three hosts have an address', test: (d) => (d.groups.ipplan ?? []).filter((r) => !!r.hostname && !!r.ip).length >= 3 },
      { label: 'Every host has a unique IP', test: (d) => { const ips = (d.groups.ipplan ?? []).map((r) => (r.ip ?? '').trim()).filter(Boolean); return ips.length > 0 && new Set(ips).size === ips.length; } },
    ],
  },

  // 5 — Configuration Management Record ──────────────────────────────────────
  {
    id: 'srv_config_mgmt',
    feeds: ['srv_change_log', 'srv_dr_plan'],
    courseId: 'server-plus',
    num: 5,
    file: '05_Configuration_Management.md',
    title: 'Configuration Management Record',
    owner: 'lnx',
    shared: true,
    folder: '04_Config',
    standard: 'Configuration management / baseline',
    weeks: [2],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The record of how each system is actually configured — the settings that would have to be reproduced to rebuild it. Configuration you did not write down is configuration you cannot restore or audit.',
    howTo:
      'One row per system. Capture the baseline settings you set — hostname, addresses, roles, key options — and where the exact steps live (the configuration guide). Record the value, not a description of it.',
    source: 'Every system you install and configure.',
    buildSteps: [
      'One row per configured system: the Proxmox host and each VM.',
      'Record the baseline that matters — hostname, IP, installed roles, key options.',
      'Note where the exact build steps live (the configuration guide section).',
      'Attach a screenshot of the setting and its result as evidence.',
      'Update the row whenever you change the system, and log the change.',
    ],
    meaning:
      'A good configuration record lets you rebuild a system to the same state from the paperwork. It is the difference between "reinstall and hope" and "reinstall to spec".',
    useIt:
      'It feeds the change log and the DR plan — the restore procedure is only as good as the config it restores to.',
    pitfalls: [
      'Describing the setting ("configured networking") instead of recording the value (the actual IP, mask, gateway).',
      'Letting the record drift from reality after a change. A stale config record is a trap for the next tech.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'systems',
          label: 'Systems',
          help: 'One row per configured system. Record the values, not descriptions.',
          columns: [
            c('system', 'System', 'text', { placeholder: 'Proxmox host' }),
            c('purpose', 'Purpose', 'text', { placeholder: 'Virtualization platform' }),
            c('baseline', 'Baseline configuration (values)', 'area', { placeholder: 'Hostname pve-host; IP 10.10.10.10/24; gw 10.10.10.1; two bridges vmbr0/vmbr1; no-subscription repo enabled.' }),
            c('guide_ref', 'Guide section for exact steps', 'text', { placeholder: 'Config Guide §4 — Proxmox install' }),
            c('evidence', 'Evidence (screenshot)', 'text', { placeholder: 'GranitePeak_Wk2_pve-config.png' }),
          ],
          seed: [
            { system: 'Proxmox host', purpose: 'Virtualization platform', baseline: 'Hostname pve-host; IP 10.10.10.10/24; gateway 10.10.10.1; bridge vmbr0 on NIC 1; no-subscription repo enabled.', guide_ref: 'Config Guide §4 — Proxmox install', evidence: 'GranitePeak_Wk2_pve-config.png' },
            { system: 'winserver VM', purpose: 'DNS, DHCP and the staff portal', baseline: '2 vCPU / 4 GB / 60 GB; static 10.10.10.20; roles: DNS, DHCP, IIS.', guide_ref: 'Config Guide §6 — Windows roles', evidence: 'GranitePeak_Wk2_win-roles.png' },
            { system: 'linuxsrv VM', purpose: 'Web service and database', baseline: '2 vCPU / 4 GB / 40 GB; static 10.10.10.21; packages: nginx, mariadb-server.', guide_ref: 'Config Guide §7 — Linux services', evidence: 'GranitePeak_Wk2_linux-svc.png' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three systems are recorded', test: (d) => (d.groups.systems ?? []).filter((r) => !!r.system).length >= 3 },
      { label: 'Every system has a baseline configuration with real values', test: (d) => (d.groups.systems ?? []).length > 0 && (d.groups.systems ?? []).every((r) => !!r.baseline) },
      { label: 'Every system points to its guide section and evidence', test: (d) => (d.groups.systems ?? []).length > 0 && (d.groups.systems ?? []).every((r) => !!r.guide_ref && !!r.evidence) },
    ],
  },

  // 6 — Patch Management Log ─────────────────────────────────────────────────
  {
    id: 'srv_patch_mgmt',
    feeds: ['srv_change_log'],
    courseId: 'server-plus',
    num: 6,
    file: '06_Patch_Management.csv',
    title: 'Patch Management Log',
    owner: 'win',
    shared: true,
    folder: '05_Operations',
    standard: 'Patch management',
    weeks: [4],
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The record of what patch level each system is at, when it was last updated, and how you would roll a bad patch back. Unpatched systems are the most common way an environment is compromised.',
    howTo:
      'One row per system. Record its current patch baseline, the schedule you set, what you applied, and the rollback — a snapshot or a restore point taken before you patched.',
    source: 'The asset register (every system that needs patching).',
    buildSteps: [
      'One row per system from the asset register.',
      'Record its starting patch baseline before you touch it.',
      'Set an update schedule appropriate to the system.',
      'Take a snapshot or restore point first — that is your rollback.',
      'Apply updates, then record the new level and the date.',
    ],
    meaning:
      'A good patch log answers "are we current, and can we undo a bad update?" A patch with no rollback is a gamble on production.',
    useIt:
      'It feeds the change log and proves to the client that the environment is maintained, not just installed and forgotten.',
    pitfalls: [
      'Patching with no snapshot first — when an update breaks a service, there is no way back.',
      'Recording "updated" with no date or level. Without the level you cannot tell what is still exposed.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'patches',
          label: 'Systems',
          help: 'One row per system. The rollback column is what makes patching safe on a live server.',
          columns: [
            c('system', 'System', 'text', { placeholder: 'Proxmox host' }),
            c('baseline', 'Starting patch level', 'text', { placeholder: '6.4-1, kernel 5.4.106' }),
            c('schedule', 'Update schedule', 'select', { options: ['Weekly', 'Monthly', 'Quarterly', 'On release', 'Manual'] }),
            c('rollback', 'Rollback method', 'select', { options: ['VM snapshot', 'System restore point', 'Full backup', 'None'] }),
            c('applied', 'Patches applied', 'text', { placeholder: 'apt full-upgrade — 42 packages' }),
            c('date', 'Date applied', 'date'),
            c('result', 'Result', 'select', { options: ['Success', 'Rolled back', 'Pending'] }),
          ],
          seed: [
            { system: 'Proxmox host', baseline: '6.4-1, kernel 5.4.106', schedule: 'Monthly', rollback: 'Full backup', applied: 'apt full-upgrade — 42 packages', date: '2026-03-02', result: 'Success' },
            { system: 'winserver VM', baseline: '2022 21H2, no updates', schedule: 'Monthly', rollback: 'VM snapshot', applied: 'Windows Update — March cumulative', date: '2026-03-02', result: 'Success' },
            { system: 'linuxsrv VM', baseline: '22.04, base install', schedule: 'Monthly', rollback: 'VM snapshot', applied: 'apt upgrade — 30 packages', date: '2026-03-02', result: 'Success' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three systems are logged', test: (d) => (d.groups.patches ?? []).filter((r) => !!r.system).length >= 3 },
      { label: 'Every system has a schedule and a rollback method', test: (d) => (d.groups.patches ?? []).length > 0 && (d.groups.patches ?? []).every((r) => !!r.schedule && !!r.rollback) },
      { label: 'No system relies on "None" for rollback', test: (d) => !(d.groups.patches ?? []).some((r) => r.rollback === 'None') },
      { label: 'Every applied patch has a date', test: (d) => (d.groups.patches ?? []).filter((r) => !!r.applied).length > 0 && (d.groups.patches ?? []).filter((r) => !!r.applied).every((r) => !!r.date) },
    ],
  },

  // 7 — Change Log ───────────────────────────────────────────────────────────
  {
    id: 'srv_change_log',
    feeds: ['srv_as_built'],
    courseId: 'server-plus',
    num: 7,
    file: '07_Change_Log.csv',
    title: 'Change Log',
    owner: 'mgmt',
    shared: true,
    folder: '00_Project',
    standard: 'Change control',
    weeks: [1, 2, 3, 4],
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'A chronological, append-only record of every change you made. When something breaks, the first question is "what changed?" — this answers it in seconds and holds the rollback.',
    howTo:
      'Add a row the moment you make a change. Never reconstruct it from memory later — the rollback column is only trustworthy if it was written before the change.',
    buildSteps: [
      'Before a risky change, write the row: what you are about to do, why, and how to undo it.',
      'Make the change, then fill in the result you actually saw.',
      'Log the physical changes too — racking, re-cabling, a moved patch lead.',
      'Keep it append-only. Correct a mistake with a new row, never by editing history.',
    ],
    meaning:
      'A good change log lets whoever is on call answer "what changed?" and reverse it without calling you.',
    useIt:
      'Read it first during troubleshooting; hand it over as proof of a controlled, professional build.',
    pitfalls: [
      'Filling it in at the end of the week — the rollback value is the previous setting, and nobody remembers it later.',
      'Vague entries. "Fixed network" is not a change record.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Changes',
          help: 'Append-only. One row per meaningful change, written as you make it.',
          columns: [
            c('datetime', 'Date / time', 'text', { placeholder: '2026-02-17 14:05' }),
            c('change', 'What changed', 'text', { placeholder: 'Mounted the R630 in Rack A, U20–U21' }),
            c('why', 'Why', 'text', { placeholder: 'Physical install per the project brief' }),
            c('result', 'Result', 'text', { placeholder: 'Racked, cabled and powered; front panel lit' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'Unrack and return to staging' }),
          ],
          seed: [
            { datetime: '2026-02-17 09:20', change: 'Mounted the R630 in Rack A, U20–U21', why: 'Physical install per the project brief', result: 'Racked on rails, cable-managed', rollback: 'Unrack and return to staging' },
            { datetime: '2026-02-17 14:05', change: 'Patched panel P1–P2 to switch Gi0/1–Gi0/2', why: 'Connect the server NICs to the LAN', result: 'Both links up, labelled A-01/A-02', rollback: 'Remove patch leads; ports revert to unused' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least four changes are logged', test: (d) => (d.groups.changes ?? []).filter((r) => !!r.change).length >= 4 },
      { label: 'Every change records why it was made', test: (d) => (d.groups.changes ?? []).length > 0 && (d.groups.changes ?? []).every((r) => !!r.why) },
      { label: 'Every change has a rollback written down', test: (d) => (d.groups.changes ?? []).length > 0 && (d.groups.changes ?? []).every((r) => !!r.rollback) },
    ],
  },

  // 8 — DR Plan (RTO / RPO / MTTR) ───────────────────────────────────────────
  {
    id: 'srv_dr_plan',
    feeds: ['srv_as_built'],
    courseId: 'server-plus',
    num: 8,
    file: '08_DR_Plan.md',
    title: 'Disaster Recovery Plan',
    owner: 'win',
    shared: true,
    folder: '06_Resilience',
    standard: 'Disaster recovery (RTO / RPO / MTTR)',
    weeks: [4],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The written procedure for getting the server running again after a failure — and the numbers that say how fast and how much data you can lose. It turns "we hope we can recover" into "we can, in N hours".',
    howTo:
      'Set an RTO, RPO and target MTTR per system, document the restore steps, then run one real restore and record the actual recovery time against the targets.',
    source: 'The asset register (what is critical) and the configuration record (how each system rebuilds).',
    buildSteps: [
      'List the critical systems from the asset register, in the order the business needs them back.',
      'Set RTO (max downtime), RPO (max data loss) and a target MTTR for each.',
      'Write the restore steps, pointing at the configuration record and backups.',
      'Run one real restore — delete a test file, bring it back, confirm it is intact.',
      'Record the actual recovery time against the targets, including a miss.',
    ],
    meaning:
      'RTO is how fast it must return; RPO is how much data you can lose; MTTR is how long a repair actually takes on average. Only a tested restore proves any of them.',
    useIt:
      'You execute a slice of it as the Week-4 restore test; the client keeps it current as the system changes.',
    pitfalls: [
      'Numbers chosen because they sound good instead of from what downtime costs the client.',
      'Recording the test as "passed" with no measured time — the number is the whole point.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'systems',
          label: 'Critical systems — RTO / RPO / MTTR',
          help: 'Ordered by how urgently the business needs each one back.',
          columns: [
            c('system', 'System', 'text', { placeholder: 'linuxsrv — database' }),
            c('impact', 'Impact if down', 'text', { placeholder: 'Dispatch stops' }),
            c('rto', 'RTO (max downtime)', 'text', { placeholder: '2 hours' }),
            c('rpo', 'RPO (max data loss)', 'text', { placeholder: '24 hours' }),
            c('mttr', 'Target MTTR', 'text', { placeholder: '90 min' }),
            c('restore', 'Restore procedure', 'area', { placeholder: 'Restore the VM snapshot; import the latest DB dump; verify the row count; restart the service.' }),
          ],
          seed: [
            { system: 'linuxsrv — database', impact: 'Dispatch stops — trucks idle', rto: '2 hours', rpo: '24 hours', mttr: '90 min', restore: 'Restore the nightly VM snapshot, import the latest DB dump, verify the row count, restart the service.' },
            { system: 'winserver — DNS/DHCP', impact: 'Nothing resolves; no addresses issued', rto: '4 hours', rpo: '24 hours', mttr: '2 hours', restore: 'Restore the VM snapshot; confirm the DNS zone and DHCP scope from the configuration record.' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Restore test result',
        fields: [
          { field: 'test_date', label: 'Test date', type: 'date' },
          { field: 'test_system', label: 'System tested', type: 'text', placeholder: 'linuxsrv — /var/www/html' },
          { field: 'what_was_lost', label: 'What was deleted / simulated', type: 'text', placeholder: 'Deleted the portal web root' },
          { field: 'recovery_time', label: 'Actual recovery time (measured MTTR)', type: 'text', placeholder: '11 minutes' },
          { field: 'rto_met', label: 'RTO met?', type: 'select', options: ['Yes', 'No'] },
          { field: 'integrity', label: 'How you confirmed the data was intact', type: 'area', placeholder: 'Compared the restored file against the pre-deletion copy — identical.' },
        ],
      },
    ],
    dod: [
      { label: 'At least two systems have RTO, RPO and MTTR', test: (d) => (d.groups.systems ?? []).filter((r) => !!r.rto && !!r.rpo && !!r.mttr).length >= 2 },
      { label: 'Every system has a written restore procedure', test: (d) => (d.groups.systems ?? []).length > 0 && (d.groups.systems ?? []).every((r) => !!r.restore) },
      { label: 'A real restore was performed and its time measured', test: (d) => !!(d.fields.test_system && d.fields.recovery_time) },
      { label: 'Data integrity after the restore was confirmed', test: (d) => !!d.fields.integrity },
    ],
  },

  // 9 — As-Built Handover Package — THE CAPSTONE ─────────────────────────────
  {
    id: 'srv_as_built',
    capstone: true,
    courseId: 'server-plus',
    num: 9,
    file: '09_As_Built.md',
    title: 'As-Built Handover Package',
    owner: 'mgmt',
    shared: true,
    folder: '07_Handover',
    standard: 'As-built handover documentation',
    weeks: [4],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The complete, accurate record of what you actually built — the thing the client operates from after you leave. Assembled from documents you kept current all along, then exported as one PDF package.',
    howTo:
      'Walk the checklist, confirm each document exists and matches reality, then write the client summary. Use Generate PDF on each form to produce the handover set.',
    source: 'Every other deliverable in this course.',
    buildSteps: [
      'Walk the handover checklist and confirm each document exists and is current.',
      'Fix anything that disagrees with reality before checking it in.',
      'Export each form to PDF (the Generate PDF button) to build the package.',
      'Write the client summary: what they now have and how they operate it.',
      'List the findings and recommendations, including the hardware limits.',
    ],
    meaning:
      'The standard is simple: a stranger should be able to pick this up and run the server without asking you a single question.',
    useIt:
      'It is the handover. The client keeps it, operates from it, and maintains it as the system changes.',
    pitfalls: [
      'Assembling it from memory in Week 4. If the documents were not kept current, this becomes a scramble.',
      'Including the plan instead of what was built. As-built means as BUILT, including what changed.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'contents',
          label: 'Handover checklist',
          help: 'Every document in the package, its version, and whether it matches what is actually running.',
          columns: [
            c('document', 'Document', 'text', { placeholder: 'Rack & Cabling Record' }),
            c('version', 'Version', 'text', { placeholder: '1.0' }),
            c('current', 'Matches reality?', 'select', { options: ['Yes', 'No — needs update'] }),
            c('pdf', 'Exported to PDF?', 'select', { options: ['Yes', 'No'] }),
          ],
          seed: [
            { document: 'Project Brief & Site Prep', version: '1.0', current: 'Yes', pdf: 'Yes' },
            { document: 'Rack & Cabling Record', version: '1.0', current: 'Yes', pdf: 'Yes' },
            { document: 'Asset Register', version: '1.1', current: 'Yes', pdf: 'Yes' },
            { document: 'Network Topology & IP Plan', version: '1.0', current: 'Yes', pdf: 'Yes' },
            { document: 'Configuration Management Record', version: '1.1', current: 'Yes', pdf: 'Yes' },
            { document: 'Patch Management Log', version: '1.0', current: 'Yes', pdf: 'Yes' },
            { document: 'Change Log', version: 'live', current: 'Yes', pdf: 'Yes' },
            { document: 'Disaster Recovery Plan', version: '1.1', current: 'Yes', pdf: 'Yes' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Client summary',
        fields: [
          { field: 'what_they_have', label: 'What the client now has', type: 'area', required: true, placeholder: 'A rack-mounted server running Proxmox with a Windows and a Linux VM for the portal and dispatch database, cabled and documented.' },
          { field: 'how_to_operate', label: 'How they operate it without you', type: 'area', required: true, placeholder: 'Every setting is in the configuration record; patch and change logs show what has been maintained; the DR plan says how to recover.' },
          { field: 'recommendations', label: 'Findings & recommendations', type: 'area', required: true, placeholder: 'The server is out of warranty; the switch is end-of-support; there is no offsite backup copy yet.' },
          { field: 'handover_date', label: 'Handover date', type: 'date', required: true },
          { field: 'signoff', label: 'Client sign-off', type: 'signature', required: true, placeholder: 'Client representative name' },
        ],
      },
      custodySection({
        label: 'Evidence appendix — log every photo & screenshot you hand over',
        seed: [
          { evidence_id: 'E-01', description: 'GranitePeak_Wk1_rack-front.jpg', collected_by: 'Technician', collected_at: '2026-02-17 15:00', location: '08_Evidence/', sha256: 'from sha256sum GranitePeak_Wk1_rack-front.jpg', transferred_to: 'Client', transferred_at: '2026-03-12 15:00', notes: 'Rack photo, handed over at closeout' },
        ],
      }),
    ],
    dod: [
      { label: 'At least eight documents are checked into the package', test: (d) => (d.groups.contents ?? []).filter((r) => !!r.document).length >= 8 },
      { label: 'Every document matches reality and is exported to PDF', test: (d) => (d.groups.contents ?? []).length > 0 && (d.groups.contents ?? []).every((r) => r.current === 'Yes' && r.pdf === 'Yes') },
      { label: 'The client summary and recommendations are written', test: (d) => !!(d.fields.what_they_have && d.fields.how_to_operate && d.fields.recommendations) },
      { label: 'Handover is dated and signed off', test: (d) => !!(d.fields.handover_date && d.fields.signoff) },
      { label: 'Every handover artifact is logged (chain of custody)', test: (d) => everyEvidenceHashed()(d) },
    ],
  },
];

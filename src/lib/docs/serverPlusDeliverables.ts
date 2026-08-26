import { Column } from '../grc/templates';
import { DeliverableDef } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * Client deliverables for the CompTIA Server+ capstone — the MSP engagement that
 * stands up Granite Peak Aggregates' first server environment.
 *
 * Course-scoped (`courseId: 'server-plus'`) so they never surface on another
 * course's pages, ZIP or gate panels.
 *
 * These are not lab worksheets. Every one of them is something a managed service
 * provider would actually hand a paying client, and the folder they land in
 * (`00_Project/` … `08_Handover/`) is the client documentation library from the
 * capstone handbook §1.5. The whole set drains into `srv_as_built` — the
 * operate-it-without-us binder that is the real product of the engagement.
 *
 * Ownership follows the handbook's role table exactly: the Project Lead owns the
 * documentation system, the Network Engineer owns the design and its proof, and
 * the two systems engineers own their platforms' runbooks and evidence.
 */

// Local column helper (mirrors the one in definitions.ts; kept local to avoid a
// circular import, since definitions.ts imports this file).
const c = (
  field: string,
  label: string,
  type: Column['type'],
  extra: Partial<Column> = {}
): Column => ({ field, label, type, ...extra });

/** Implementation state shared by the hardening and backup reviews. */
const DONE_STATE = ['Not started', 'In progress', 'Done', 'N/A'];
/** Least-privilege share rights, in the order Windows presents them. */
const NTFS_RIGHTS = ['Read', 'Write', 'Modify', 'Full Control'];

export const SERVER_PLUS_DELIVERABLES: DeliverableDef[] = [
  // 1 — Statement of Work (W1) ───────────────────────────────────────────────
  {
    id: 'srv_sow',
    // Scope decides what gets designed, built and accepted.
    feeds: ['srv_network_design', 'srv_hardware_assessment'],
    courseId: 'server-plus',
    num: 1,
    file: '01_SOW.md',
    title: 'Statement of Work & Project Plan',
    owner: 'lead',
    folder: '00_Project',
    standard: 'SOW / project charter',
    weeks: [1],
    gate: 1,
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'The written agreement of what you will deliver, by when, and what is explicitly not included — the document that prevents "I thought you were also doing X".',
    howTo:
      'Turn the client ask into a bulleted scope, list what you are NOT doing, and copy the four weekly Definition-of-Done gates in as the acceptance criteria.',
    buildSteps: [
      'Name the client and your team as the provider, with a date and a version number.',
      'Write the objective in one sentence a manager could repeat back.',
      'List in-scope items from the client brief; then list out-of-scope items explicitly.',
      'Copy the four gates in as acceptance criteria — that is how the client knows a phase is done.',
      'Record the assumptions you are relying on (hardware supplied, network drop, IP assignment).',
    ],
    meaning:
      'A good SOW is boring and specific. Every line is either something you will hand over or something you have written down that you will not.',
    useIt:
      'It is the north star at every gate: before calling a phase done, check the deliverable against what this promised.',
    pitfalls: [
      'Leaving out-of-scope blank. The empty half is the half that protects you.',
      'Acceptance criteria written as opinions ("client is happy") instead of the gate checklists.',
    ],
    sections: [
      {
        kind: 'fields',
        fields: [
          { field: 'client', label: 'Client', type: 'text', required: true, placeholder: 'Granite Peak Aggregates' },
          { field: 'provider', label: 'Provider (your team)', type: 'text', required: true, placeholder: 'Team 07 — Managed Services' },
          { field: 'version', label: 'Version', type: 'select', options: ['1.0', '1.1', '2.0'] },
          { field: 'start_date', label: 'Engagement start', type: 'date', required: true },
          { field: 'end_date', label: 'Target completion', type: 'date' },
          { field: 'objective', label: 'Objective', type: 'area', required: true, placeholder: 'Stand up a segmented, documented server environment on the client blade server.' },
          { field: 'in_scope', label: 'In scope', type: 'area', required: true, placeholder: 'Proxmox platform · segmented network · DNS/DHCP/IIS/file · NGINX/MariaDB · hardening · backups · DR plan · as-built documentation · closeout presentation.' },
          { field: 'out_of_scope', label: 'Explicitly out of scope', type: 'area', required: true, placeholder: 'Internet-facing production hosting, email, endpoint fleet, 24/7 support.' },
          { field: 'acceptance', label: 'Acceptance criteria (the four gates)', type: 'area', required: true, placeholder: 'Wk1 Discovery & Foundation · Wk2 Service Deployment · Wk3 Security & Resilience · Wk4 Validation & Handover' },
          { field: 'assumptions', label: 'Assumptions', type: 'area', placeholder: 'Client provides hardware, a network drop, and the host IP assignment.' },
        ],
      },
    ],
    dod: [
      { label: 'Client, provider and objective are filled in', test: (d) => !!(d.fields.client && d.fields.provider && d.fields.objective) },
      { label: 'Both in-scope AND out-of-scope are written down', test: (d) => !!(d.fields.in_scope && d.fields.out_of_scope) },
      { label: 'Acceptance criteria and a start date are set', test: (d) => !!(d.fields.acceptance && d.fields.start_date) },
    ],
  },

  // 2 — Hardware Assessment (W1) ─────────────────────────────────────────────
  {
    id: 'srv_hardware_assessment',
    // The assessment justifies the VM sizing and seeds the inventory.
    feeds: ['srv_asset_register', 'srv_network_design'],
    courseId: 'server-plus',
    num: 2,
    file: '02_Hardware_Assessment.md',
    title: 'Hardware Assessment',
    owner: 'lead',
    folder: '01_Assessment',
    standard: 'Infrastructure discovery',
    weeks: [1],
    gate: 1,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'A deep investigation of the physical server — every component, what it can do, and its health. It answers "can this hardware actually do the job?" before you build on it.',
    howTo:
      'Read every value off THIS server — BIOS, controller screens, lscpu/dmidecode once installed — not a datasheet. Mark each compatibility row Pass or Fail, then write the verdict.',
    source: 'The physical blade server the client handed over.',
    buildSteps: [
      'Record the service tag and model from the chassis, then the BIOS/firmware version from POST.',
      'Capture CPU: model, cores, threads, and whether virtualization (VT-x/AMD-V) and IOMMU are enabled.',
      'Capture memory: total, per-slot layout, and how many slots are still free.',
      'Capture storage: each physical disk, the RAID controller model, and the RAID level you created.',
      'Capture networking and remote management (iDRAC/iLO/IPMI) — the address matters for later.',
      'Fill the compatibility rows Pass/Fail, then write the one-paragraph fit-for-purpose verdict.',
    ],
    meaning:
      'A good assessment states limits, not just specs. "64 GB across 4 of 8 slots — room to double without replacing sticks" is worth more than a number.',
    useIt:
      'It justifies your VM sizing to the client, feeds the Asset Register, and is the first thing you present at closeout.',
    pitfalls: [
      'Copying a spec sheet instead of reading the actual machine. The client bought an assessment of THEIR server.',
      'Leaving the verdict blank. The paragraph is the deliverable; the table is just its evidence.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Server identity',
        fields: [
          { field: 'make_model', label: 'Make / model', type: 'text', required: true, placeholder: 'Dell PowerEdge R630' },
          { field: 'service_tag', label: 'Service tag / serial', type: 'text', required: true, placeholder: '7XK2M13' },
          { field: 'bios_version', label: 'BIOS / firmware version', type: 'text', placeholder: '2.19.0' },
          { field: 'cpu', label: 'CPU (model, cores, threads)', type: 'text', required: true, placeholder: '2× Xeon E5-2680 v4 — 28 cores / 56 threads' },
          { field: 'virtualization', label: 'Virtualization support', type: 'select', options: ['VT-x + IOMMU enabled', 'VT-x enabled, IOMMU off', 'Not supported', 'Unknown'] },
          { field: 'memory', label: 'Memory (total + slot layout)', type: 'text', required: true, placeholder: '128 GB — 8× 16 GB, 8 of 24 slots used' },
          { field: 'raid_controller', label: 'RAID controller', type: 'text', placeholder: 'PERC H730 Mini' },
          { field: 'raid_level', label: 'RAID level created (and why)', type: 'area', placeholder: 'RAID 10 — the client needs both redundancy and write speed for the dispatch database.' },
          { field: 'nics', label: 'Network interfaces', type: 'text', placeholder: '4× 1GbE (Broadcom BCM5720)' },
          { field: 'remote_mgmt', label: 'Remote management', type: 'select', options: ['iDRAC', 'iLO', 'IPMI', 'None'] },
          { field: 'verdict', label: 'Fit-for-purpose verdict', type: 'area', required: true, help: 'One or two paragraphs: what workloads it supports, what limits you found, what you would upgrade, and whether it is fit for the planned VM layout.', placeholder: 'Comfortably supports the planned VMs with headroom. Limits: only 2 of 4 NICs are cabled…' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'compat',
          label: 'Virtualization compatibility check',
          help: 'One row per requirement the platform needs. A Fail here is a finding for the client, not a reason to stop.',
          columns: [
            c('requirement', 'Requirement', 'text', { placeholder: '64-bit CPU with virtualization extensions' }),
            c('found', 'What this server has', 'text', { placeholder: 'Xeon E5-2680 v4, VT-x enabled in BIOS' }),
            c('result', 'Result', 'select', { options: ['Pass', 'Fail', 'N/A'] }),
            c('note', 'Note', 'text', { placeholder: 'Enabled manually — was off from the factory.' }),
          ],
          seed: [
            { requirement: '64-bit CPU with virtualization extensions', found: 'Xeon E5-2680 v4, VT-x enabled in BIOS', result: 'Pass', note: 'Enabled manually — was off from the factory.' },
            { requirement: 'At least 16 GB RAM for the planned VMs', found: '128 GB installed', result: 'Pass', note: 'Large headroom for growth.' },
            { requirement: 'Supported RAID controller', found: 'PERC H730 Mini', result: 'Pass', note: 'On the hypervisor hardware list.' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'vmplan',
          label: 'Planned VM layout',
          help: 'What you intend to run on this hardware, sized from the resources above.',
          columns: [
            c('vm', 'VM', 'text', { placeholder: 'winserver' }),
            c('purpose', 'Purpose', 'text', { placeholder: 'DNS, DHCP, IIS portal, file shares' }),
            c('vcpu', 'vCPU', 'number', { placeholder: '2' }),
            c('ram', 'RAM', 'text', { placeholder: '4 GB' }),
            c('disk', 'Disk', 'text', { placeholder: '60 GB' }),
            c('bridge', 'Bridge', 'select', { options: ['vmbr0', 'vmbr1', 'vmbr2', 'vmbr3'] }),
          ],
          seed: [
            { vm: 'jumpbox', purpose: 'Hardened SSH gateway into the private LAN', vcpu: '2', ram: '2 GB', disk: '25 GB', bridge: 'vmbr1' },
            { vm: 'winserver', purpose: 'DNS, DHCP, IIS portal, file shares', vcpu: '2', ram: '4 GB', disk: '60 GB', bridge: 'vmbr2' },
            { vm: 'linuxsrv', purpose: 'NGINX site and the MariaDB dispatch database', vcpu: '2', ram: '4 GB', disk: '40 GB', bridge: 'vmbr2' },
            { vm: 'client01', purpose: 'Test workstation — proves DHCP, DNS and the portal from a user seat', vcpu: '2', ram: '4 GB', disk: '40 GB', bridge: 'vmbr2' },
          ],
        },
      },
    ],
    dod: [
      { label: 'Model, service tag, CPU and memory are recorded from the real server', test: (d) => !!(d.fields.make_model && d.fields.service_tag && d.fields.cpu && d.fields.memory) },
      { label: 'Every compatibility row has a Pass/Fail result', test: (d) => (d.groups.compat ?? []).length >= 3 && (d.groups.compat ?? []).every((r) => !!r.result) },
      { label: 'At least four VMs are planned with a bridge each', test: (d) => (d.groups.vmplan ?? []).filter((r) => !!r.vm && !!r.bridge).length >= 4 },
      { label: 'The fit-for-purpose verdict is written', test: (d) => !!d.fields.verdict },
    ],
  },

  // 3 — Network Design & IP Plan (W1) ────────────────────────────────────────
  {
    id: 'srv_network_design',
    // The design is what the firewall enforces and the tests prove.
    feeds: ['srv_firewall_rules', 'srv_connectivity_matrix'],
    courseId: 'server-plus',
    num: 3,
    file: '03_Network_Design.md',
    title: 'Network Design & IP Plan',
    owner: 'network',
    folder: '03_Network',
    standard: 'Network design / IPAM',
    weeks: [1],
    gate: 1,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The why behind the network plus the master table that gives every device a fixed address before you build. Duplicate IPs and "where is that server?" cause real outages; this prevents both.',
    howTo:
      'Define the zones and their trust levels, then reserve ranges per subnet — gateway .1, static servers .2–.20, DHCP pool .100–.200 — and assign every planned host a row.',
    source: 'The hardware assessment (what the platform can run) and the client brief.',
    buildSteps: [
      'Write one line per zone saying what lives there and who may reach it.',
      'Reserve the ranges before assigning anything: gateway, statics, then the DHCP pool.',
      'Give every host from the VM plan a row with its bridge, IP, gateway and DNS.',
      'Check no two rows share an IP and that the DHCP pool does not overlap the static range.',
      'State the routing approach (jump box in, NAT out) and the firewall philosophy (default-deny).',
    ],
    meaning:
      'A good IP plan is the single place addresses are decided. If someone picks an address without opening this file, the plan has already failed.',
    useIt:
      'Consult it before assigning any address; the firewall rules and the connectivity tests are both derived from it; audit reality against it in Week 4.',
    pitfalls: [
      'A DHCP pool that overlaps the static servers — the outage arrives days later when a lease collides.',
      'Designing the zones after building them. The design is what makes segmentation deliberate rather than accidental.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Design decisions',
        fields: [
          { field: 'goals', label: 'Design goals', type: 'area', required: true, placeholder: 'Segment the sensitive core from anything semi-public; allow admin access through exactly one hardened path.' },
          { field: 'zones', label: 'Zones and trust levels', type: 'area', required: true, help: 'One line per bridge: what lives there and why it is separated.', placeholder: 'vmbr1 DMZ (semi-trusted): jump box and the public-facing web server. vmbr2 Private LAN (trusted): DNS, DHCP, database, file shares.' },
          { field: 'routing', label: 'Routing approach', type: 'area', placeholder: 'Admin traffic enters through the jump box only. NAT lets DMZ hosts reach the private LAN on approved ports; a DNAT rule publishes one internal SSH port.' },
          { field: 'firewall_philosophy', label: 'Firewall philosophy', type: 'select', options: ['Default-deny, explicit allows only', 'Default-allow with specific blocks'] },
          { field: 'topology_file', label: 'Topology diagram file', type: 'text', placeholder: 'Topology.drawio.png' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'ipplan',
          label: 'IP address plan',
          help: 'Every planned device gets a row before anything is built. This is the only place addresses are decided.',
          columns: [
            c('hostname', 'Hostname', 'text', { placeholder: 'winserver' }),
            c('role', 'Role', 'text', { placeholder: 'Windows Server — DNS/DHCP/IIS' }),
            c('bridge', 'Zone / bridge', 'select', { options: ['vmbr0 (mgmt)', 'vmbr1 (DMZ)', 'vmbr2 (private)', 'vmbr3 (physical)'] }),
            c('ip', 'IP address', 'text', { placeholder: '192.168.0.2' }),
            c('gateway', 'Gateway', 'text', { placeholder: '192.168.0.1' }),
            c('dns', 'DNS', 'text', { placeholder: 'self' }),
            c('assignment', 'Static / DHCP', 'select', { options: ['Static', 'DHCP'] }),
            c('owner', 'Owner', 'select', { options: ['Network', 'Windows', 'Linux', 'Lead'] }),
          ],
          seed: [
            { hostname: 'pve-team07', role: 'Proxmox host (management only)', bridge: 'vmbr0 (mgmt)', ip: '10.10.10.47', gateway: '10.10.10.1', dns: '—', assignment: 'Static', owner: 'Network' },
            { hostname: 'jumpbox', role: 'Hardened SSH gateway', bridge: 'vmbr1 (DMZ)', ip: '172.16.0.10', gateway: '172.16.0.1', dns: '—', assignment: 'Static', owner: 'Network' },
            { hostname: 'winserver', role: 'Windows Server — DNS/DHCP/IIS/shares', bridge: 'vmbr2 (private)', ip: '192.168.0.2', gateway: '192.168.0.1', dns: 'self', assignment: 'Static', owner: 'Windows' },
            { hostname: 'linuxsrv', role: 'Ubuntu Server — NGINX + MariaDB', bridge: 'vmbr2 (private)', ip: '192.168.0.3', gateway: '192.168.0.1', dns: '192.168.0.2', assignment: 'Static', owner: 'Linux' },
            { hostname: '(DHCP pool)', role: 'Client workstations', bridge: 'vmbr2 (private)', ip: '192.168.0.100–.200', gateway: '192.168.0.1', dns: '192.168.0.2', assignment: 'DHCP', owner: 'Windows' },
          ],
        },
      },
    ],
    dod: [
      { label: 'Design goals and the zone/trust scheme are written', test: (d) => !!(d.fields.goals && d.fields.zones) },
      { label: 'At least five hosts are planned with an address each', test: (d) => (d.groups.ipplan ?? []).filter((r) => !!r.hostname && !!r.ip).length >= 5 },
      { label: 'Every planned host has a unique IP', test: (d) => { const ips = (d.groups.ipplan ?? []).map((r) => (r.ip ?? '').trim()).filter(Boolean); return ips.length > 0 && new Set(ips).size === ips.length; } },
      { label: 'Every host names its bridge and static-or-DHCP', test: (d) => (d.groups.ipplan ?? []).length > 0 && (d.groups.ipplan ?? []).every((r) => !!r.bridge && !!r.assignment) },
    ],
  },

  // 4 — Asset Register (W1, completed W3) ────────────────────────────────────
  {
    id: 'srv_asset_register',
    // You cannot protect, budget for, or recover what you have not inventoried.
    feeds: ['srv_backup_assessment', 'srv_dr_plan'],
    courseId: 'server-plus',
    num: 4,
    file: '04_Asset_Register.csv',
    title: 'Asset Register',
    owner: 'lead',
    folder: '02_Assets',
    standard: 'Asset inventory / CMDB',
    weeks: [1, 3],
    gate: 3,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The master list of every piece of hardware and software in the environment — a lightweight CMDB. You cannot secure, budget for, or support what you do not know you have.',
    howTo:
      'Walk the environment device by device. Record what you can read off the hardware and the OS. Warranty and end-of-support dates are the columns that prevent nasty surprises.',
    source: 'The hardware assessment, plus every VM and program you install.',
    buildSteps: [
      'List the vendors you deal with first — the register refers to them by name.',
      'Add one hardware row per physical item, including quantity, value and warranty expiry.',
      'Add one software row per installed program, with its version and support-end date.',
      'Mark condition honestly. "Reclaimed, out of warranty" is useful; "Good" everywhere is not.',
      'Update it in Week 3 once every service is installed — that is when it becomes complete.',
    ],
    meaning:
      'A good register answers a budget question and a security question at once: what do we own, and what is out of support?',
    useIt:
      'It feeds the budget conversation, the hardening review (what is unsupported?), and the DR plan (what has to come back, and in what order?).',
    pitfalls: [
      'Recording only the physical server. The VMs, the OS licences and the installed programs are assets too.',
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
            c('product', 'Product supplied', 'text', { placeholder: 'PowerEdge R630 blade server' }),
            c('contact', 'Contact name', 'text', { placeholder: 'A. Pena' }),
            c('email', 'Email', 'text', { placeholder: 'support@example.com' }),
            c('phone', 'Phone', 'text', { placeholder: '(512) 555-0148' }),
            c('notes', 'Notes', 'text', { placeholder: 'Support contract expired; parts only.' }),
          ],
          seed: [
            { vendor: 'Dell Technologies', product: 'PowerEdge R630 blade server', contact: 'A. Pena', email: 'support@example.com', phone: '(512) 555-0148', notes: 'Reclaimed unit — support contract expired, parts only.' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'hardware',
          label: 'Hardware assets',
          help: 'One row per physical item. Warranty expiry and condition are what make this a planning tool.',
          columns: [
            c('item_no', 'Item no.', 'text', { placeholder: 'HW-001' }),
            c('name', 'Name', 'text', { placeholder: 'Blade server' }),
            c('type', 'Type', 'select', { options: ['Server', 'Switch', 'Router', 'Storage', 'Workstation', 'Peripheral', 'Other'] }),
            c('description', 'Description', 'text', { placeholder: 'Dell PowerEdge R630, 2× Xeon, 128 GB' }),
            c('location', 'Location', 'text', { placeholder: 'Site office — server room rack 1' }),
            c('vendor', 'Vendor', 'text', { placeholder: 'Dell Technologies' }),
            c('purchase_date', 'Purchase date', 'date'),
            c('warranty_expiry', 'Warranty expiry', 'date'),
            c('quantity', 'Qty', 'number', { placeholder: '1' }),
            c('value', 'Asset value', 'text', { placeholder: '$1,800' }),
            c('condition', 'Condition', 'select', { options: ['New', 'Good', 'Fair', 'Poor', 'End of life'] }),
          ],
          seed: [
            { item_no: 'HW-001', name: 'Blade server', type: 'Server', description: 'Dell PowerEdge R630, 2× Xeon E5-2680 v4, 128 GB', location: 'Site office — server room rack 1', vendor: 'Dell Technologies', purchase_date: '2019-04-02', warranty_expiry: '2024-04-02', quantity: '1', value: '$1,800', condition: 'Fair' },
            { item_no: 'HW-002', name: 'Access switch', type: 'Switch', description: 'Cisco Catalyst 2960, 24-port', location: 'Site office — server room rack 1', vendor: 'Cisco', purchase_date: '2019-04-02', warranty_expiry: '2023-04-02', quantity: '1', value: '$300', condition: 'Fair' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'software',
          label: 'Software assets',
          help: 'One row per installed program, including the OS on each VM. The support-end date is the security-relevant column.',
          columns: [
            c('item_no', 'Item no.', 'text', { placeholder: 'SW-001' }),
            c('host', 'Installed on', 'text', { placeholder: 'winserver' }),
            c('program', 'Program', 'text', { placeholder: 'Windows Server 2022' }),
            c('version', 'Version', 'text', { placeholder: '21H2' }),
            c('type', 'Type', 'select', { options: ['Operating system', 'Hypervisor', 'Server role', 'Database', 'Application', 'Utility'] }),
            c('install_date', 'Installed', 'date'),
            c('technician', 'Installed by', 'select', { options: ['Windows', 'Linux', 'Network', 'Lead'] }),
            c('license', 'Licence', 'text', { placeholder: 'Education / evaluation' }),
            c('support_end', 'Support ends', 'date'),
          ],
          seed: [
            { item_no: 'SW-001', host: 'pve-team07', program: 'Proxmox VE', version: '6.4-1', type: 'Hypervisor', install_date: '2026-02-16', technician: 'Network', license: 'No-subscription repo', support_end: '2024-07-31' },
            { item_no: 'SW-002', host: 'winserver', program: 'Windows Server 2022', version: '21H2', type: 'Operating system', install_date: '2026-02-17', technician: 'Windows', license: 'Education / evaluation', support_end: '2031-10-14' },
            { item_no: 'SW-003', host: 'linuxsrv', program: 'MariaDB Server', version: '10.6', type: 'Database', install_date: '2026-02-24', technician: 'Linux', license: 'GPL', support_end: '2026-07-06' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least one vendor is recorded with a contact', test: (d) => (d.groups.vendors ?? []).filter((r) => !!r.vendor).length >= 1 },
      { label: 'At least two hardware assets with a condition', test: (d) => (d.groups.hardware ?? []).filter((r) => !!r.name && !!r.condition).length >= 2 },
      { label: 'At least three software assets with a version', test: (d) => (d.groups.software ?? []).filter((r) => !!r.program && !!r.version).length >= 3 },
      { label: 'Every software row names the host it runs on', test: (d) => (d.groups.software ?? []).length > 0 && (d.groups.software ?? []).every((r) => !!r.host) },
    ],
  },

  // 5 — Change Log (W1–W4) ───────────────────────────────────────────────────
  {
    id: 'srv_change_log',
    // The log is what the as-built package proves the build was controlled by.
    feeds: ['srv_as_built'],
    courseId: 'server-plus',
    num: 5,
    file: '05_Change_Log.csv',
    title: 'Change Log',
    owner: 'lead',
    folder: '00_Project',
    standard: 'Change control',
    weeks: [1, 2, 3, 4],
    gate: 4,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'A chronological, append-only record of every change to the environment. When something breaks, the first question is "what changed?" — this answers it in seconds and holds the rollback.',
    howTo:
      'Add a row the moment you make a change. Never reconstruct it from memory later — the rollback column is only trustworthy if it was written before the change, not after.',
    buildSteps: [
      'Before a risky change, write the row: what you are about to do, why, and how to undo it.',
      'Make the change, then fill in the result you actually saw.',
      'Log the destructive ones especially — RAID initialisation, network restarts, firewall enables.',
      'Keep it append-only. Correct a mistake with a new row, never by editing history.',
    ],
    meaning:
      'A good change log lets an on-call tech at 2 a.m. answer "what changed?" and reverse it without calling you.',
    useIt:
      'Read it first during troubleshooting; hand it over as proof of a controlled, professional build.',
    pitfalls: [
      'Filling it in at the end of the week. The rollback value is the previous setting — after the change, nobody remembers it.',
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
            c('who', 'Who', 'select', { options: ['Windows', 'Linux', 'Network', 'Lead'] }),
            c('change', 'What changed', 'text', { placeholder: 'Created vmbr1 and vmbr2 bridges on the Proxmox host' }),
            c('why', 'Why', 'text', { placeholder: 'Segment the DMZ from the private LAN per the design' }),
            c('command', 'Command / screen', 'text', { placeholder: 'nano /etc/network/interfaces; systemctl restart networking' }),
            c('result', 'Result', 'text', { placeholder: 'Both bridges up; host still reachable' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'Restore /etc/network/interfaces.bak and restart networking' }),
          ],
          seed: [
            { datetime: '2026-02-17 09:20', who: 'Network', change: 'Created RAID 10 virtual disk and initialised it', why: 'Redundancy plus write speed for the dispatch database', command: 'PERC BIOS — Ctrl+R → VD Mgmt → Create New VD', result: 'One healthy VD, 1.6 TB', rollback: 'None — destructive. Disks were confirmed empty first.' },
            { datetime: '2026-02-17 14:05', who: 'Network', change: 'Created vmbr1 (172.16.0.1) and vmbr2 (192.168.0.1)', why: 'Segment the DMZ from the private LAN per the design', command: 'nano /etc/network/interfaces; systemctl restart networking', result: 'Both bridges up; host still reachable', rollback: 'Restore /etc/network/interfaces.bak and restart networking' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least four changes are logged', test: (d) => (d.groups.changes ?? []).filter((r) => !!r.change).length >= 4 },
      { label: 'Every change records who made it and why', test: (d) => (d.groups.changes ?? []).length > 0 && (d.groups.changes ?? []).every((r) => !!r.who && !!r.why) },
      { label: 'Every change has a rollback written down', test: (d) => (d.groups.changes ?? []).length > 0 && (d.groups.changes ?? []).every((r) => !!r.rollback) },
    ],
  },

  // 6 — Firewall Rule Base (W1, completed W3) ────────────────────────────────
  {
    id: 'srv_firewall_rules',
    // Rules are claims; the test matrix is the proof they behave.
    feeds: ['srv_connectivity_matrix', 'srv_hardening_report'],
    courseId: 'server-plus',
    num: 6,
    file: '06_Firewall_Rule_Base.csv',
    title: 'Firewall Rule Base',
    owner: 'network',
    folder: '03_Network',
    standard: 'Default-deny rule base',
    weeks: [1, 3],
    gate: 3,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The complete list of firewall rules — every allow and deny, with a reason. An undocumented firewall is unmaintainable and un-auditable: "why is this port open?" must have an answer.',
    howTo:
      'Start from default-deny, then add only the specific allows the design requires. Write the reason as you add each rule, not later.',
    source: 'The network design — every rule should trace back to a stated need.',
    buildSteps: [
      'Record the default-deny baseline as rule 1. Everything after it is an exception you are choosing.',
      'Add one row per allow: device, source, destination, port/protocol, and the reason.',
      'Mark each rule tested once the Connectivity Test Matrix has actually exercised it.',
      'Add the negative rules too — what must stay blocked is as much a decision as what is open.',
    ],
    meaning:
      'A good rule base reads as a set of decisions, not a config dump. Someone should be able to challenge any line and get an answer.',
    useIt:
      'Every firewall change updates this sheet first; the Connectivity Test Matrix proves the rules behave as written.',
    pitfalls: [
      'A rule with a blank reason. In six months nobody will dare remove it, and it will outlive its purpose.',
      'Documenting only the allows. The default-deny baseline is the most important row on the sheet.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'rules',
          label: 'Rules',
          help: 'Rule 1 is the default-deny baseline. Everything below it is a deliberate exception.',
          columns: [
            c('num', '#', 'number', { placeholder: '1' }),
            c('device', 'Device', 'select', { options: ['Proxmox host', 'Jump box (ufw)', 'Windows Firewall', 'Linux (ufw)'] }),
            c('source', 'Source', 'text', { placeholder: '10.10.10.0/24' }),
            c('destination', 'Destination', 'text', { placeholder: 'jumpbox 172.16.0.10' }),
            c('port', 'Port / protocol', 'text', { placeholder: '22/tcp' }),
            c('action', 'Action', 'select', { options: ['ALLOW', 'DENY'] }),
            c('reason', 'Reason', 'text', { placeholder: 'Admin SSH from the management network only' }),
            c('tested', 'Tested?', 'select', { options: ['Yes', 'No'] }),
          ],
          seed: [
            { num: '1', device: 'Jump box (ufw)', source: 'any', destination: 'any', port: 'any', action: 'DENY', reason: 'Default-deny baseline — everything below is a deliberate exception', tested: 'Yes' },
            { num: '2', device: 'Jump box (ufw)', source: '10.10.10.0/24', destination: 'jumpbox 172.16.0.10', port: '22/tcp', action: 'ALLOW', reason: 'Admin SSH from the management network', tested: 'Yes' },
            { num: '3', device: 'Proxmox host', source: '172.16.0.0/24', destination: '192.168.0.0/24', port: '22/tcp', action: 'ALLOW', reason: 'Jump box reaches private servers on SSH only', tested: 'Yes' },
            { num: '4', device: 'Proxmox host', source: '172.16.0.0/24', destination: '192.168.0.0/24', port: 'all other', action: 'DENY', reason: 'DMZ must not reach the sensitive core except on the approved path', tested: 'No' },
          ],
        },
      },
    ],
    dod: [
      { label: 'A default-deny baseline rule is recorded', test: (d) => (d.groups.rules ?? []).some((r) => r.action === 'DENY' && /default/i.test(r.reason ?? '')) },
      { label: 'At least four rules with a source, destination and port', test: (d) => (d.groups.rules ?? []).filter((r) => !!r.source && !!r.destination && !!r.port).length >= 4 },
      { label: 'Every rule states a reason', test: (d) => (d.groups.rules ?? []).length > 0 && (d.groups.rules ?? []).every((r) => !!r.reason) },
      { label: 'At least three rules are marked tested', test: (d) => (d.groups.rules ?? []).filter((r) => r.tested === 'Yes').length >= 3 },
    ],
  },

  // 7 — Windows Runbook (W2) ─────────────────────────────────────────────────
  {
    id: 'srv_runbook_windows',
    // The runbook is what the client operates from, and what the DR plan restores to.
    feeds: ['srv_as_built', 'srv_dr_plan'],
    courseId: 'server-plus',
    num: 7,
    file: '07_Runbook_Windows.md',
    title: 'Windows Runbook',
    owner: 'windows',
    folder: '04_Windows',
    standard: 'SOP / runbook',
    weeks: [2],
    gate: 2,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'Step-by-step instructions to operate or rebuild the Windows services — DNS, DHCP, the IIS portal and the file share. It is how the next person runs the system without calling you.',
    howTo:
      'As you build each service, capture the real steps and the real verification output, then turn them into a clean procedure a stranger could follow cold.',
    buildSteps: [
      'One row per service: what it does for the business, and where it runs.',
      'Write the build steps as you perform them — not from memory afterwards.',
      'Record the exact verify command and the output that proves it works.',
      'Add the restore path: how this service comes back from backup.',
      'Have a teammate follow it cold. Anything they ask you is a gap in the runbook.',
    ],
    meaning:
      'A good runbook makes you replaceable — which, counterintuitively, is what gets an MSP rehired.',
    useIt:
      'The client operates from it; you test it by having a teammate who did not build the service follow it end to end.',
    pitfalls: [
      'Writing "configure DNS" as a step. If it is not the actual clicks or commands, it is not a runbook.',
      'Omitting the verify line. A procedure without a check cannot tell you whether it worked.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'services',
          label: 'Services',
          help: 'One row per Windows service you deployed.',
          columns: [
            c('service', 'Service', 'select', { options: ['DNS', 'DHCP', 'IIS web portal', 'File share', 'Windows Backup'] }),
            c('host', 'Host / IP', 'text', { placeholder: 'winserver 192.168.0.2' }),
            c('purpose', 'What it does for the business', 'text', { placeholder: 'Staff reach servers by name instead of memorising addresses' }),
            c('build', 'Build steps', 'area', { placeholder: 'Server Manager → Add Roles → DNS Server → DNS Manager → Forward Lookup Zones → New Zone (Primary) → teamx.local → New Host (A) winserver → 192.168.0.2' }),
            c('verify', 'Verify command + expected result', 'text', { placeholder: 'nslookup winserver.teamx.local → returns 192.168.0.2' }),
            c('restore', 'Restore / rebuild', 'text', { placeholder: 'Reinstall the role, then import the zone file from the nightly backup' }),
            c('problems', 'Common problems → fix', 'text', { placeholder: 'Client resolves nothing → its DNS server is not set to 192.168.0.2' }),
          ],
          seed: [
            { service: 'DNS', host: 'winserver 192.168.0.2', purpose: 'Staff reach servers by name instead of memorising addresses', build: 'Server Manager → Add Roles → DNS Server. DNS Manager → Forward Lookup Zones → New Zone → Primary → teamx.local. New Host (A): winserver → 192.168.0.2.', verify: 'nslookup winserver.teamx.local → returns 192.168.0.2', restore: 'Reinstall the DNS role, then import the zone file from the nightly backup', problems: 'Client resolves nothing → its DNS server is not set to 192.168.0.2' },
            { service: 'DHCP', host: 'winserver 192.168.0.2', purpose: 'New machines get a working address without a technician visiting', build: 'Add DHCP Server role → DHCP Manager → New Scope "CapstoneScope" → range 192.168.0.100–.200, mask 255.255.255.0, gateway 192.168.0.1, DNS 192.168.0.2 → Activate.', verify: 'Boot a client VM → DHCP Manager → Address Leases shows it', restore: 'Recreate the scope from this row; leases rebuild themselves', problems: 'Client gets a 169.254 address → the scope is not activated, or it is on the wrong bridge' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three services are documented', test: (d) => (d.groups.services ?? []).filter((r) => !!r.service).length >= 3 },
      { label: 'Every service has build steps and a verify line', test: (d) => (d.groups.services ?? []).length > 0 && (d.groups.services ?? []).every((r) => !!r.build && !!r.verify) },
      { label: 'Every service names its host', test: (d) => (d.groups.services ?? []).length > 0 && (d.groups.services ?? []).every((r) => !!r.host) },
    ],
  },

  // 8 — Linux Runbook (W2) ───────────────────────────────────────────────────
  {
    id: 'srv_runbook_linux',
    feeds: ['srv_as_built', 'srv_backup_assessment'],
    courseId: 'server-plus',
    num: 8,
    file: '08_Runbook_Linux.md',
    title: 'Linux Runbook',
    owner: 'linux',
    folder: '05_Linux',
    standard: 'SOP / runbook',
    weeks: [2],
    gate: 2,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'Step-by-step instructions to operate or rebuild the Linux services — the NGINX site and the MariaDB dispatch database — including how they come back after a failure.',
    howTo:
      'Capture the real commands and their real output as you build. A runbook whose verify line has never been run is a guess.',
    buildSteps: [
      'One row per service, naming the host and what the business uses it for.',
      'Paste the actual install and configuration commands, in order.',
      'Record the verify command and the output line that proves the service is up AND enabled at boot.',
      'Write the restore path — for the database that means the dump file and the import command.',
    ],
    meaning:
      'The difference between "running" and "enabled" is a reboot. A good Linux runbook proves both.',
    useIt:
      'The client operates from it; the backup assessment and DR plan both point at its restore steps.',
    pitfalls: [
      'Verifying with `systemctl start` instead of `systemctl status`. Starting it does not prove it survives a reboot.',
      'Documenting the root password path instead of the least-privilege application user.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'services',
          label: 'Services',
          help: 'One row per Linux service you deployed.',
          columns: [
            c('service', 'Service', 'select', { options: ['NGINX', 'MariaDB', 'SSH', 'Backup script', 'Other'] }),
            c('host', 'Host / IP', 'text', { placeholder: 'linuxsrv 192.168.0.3' }),
            c('purpose', 'What it does for the business', 'text', { placeholder: 'Serves the internal staff portal' }),
            c('build', 'Build commands', 'area', { placeholder: 'sudo apt install nginx -y; sudo systemctl enable nginx; sudo systemctl start nginx' }),
            c('verify', 'Verify command + expected result', 'text', { placeholder: 'systemctl status nginx → active (running); enabled' }),
            c('restore', 'Restore / rebuild', 'text', { placeholder: 'Reinstall the package, then restore /var/www/html from the nightly rsync copy' }),
            c('problems', 'Common problems → fix', 'text', { placeholder: 'Page loads locally but not from another VM → ufw is blocking 80/tcp' }),
          ],
          seed: [
            { service: 'NGINX', host: 'linuxsrv 192.168.0.3', purpose: 'Serves the internal staff portal', build: 'sudo apt update && sudo apt install nginx -y\nsudo systemctl enable nginx\nsudo systemctl start nginx', verify: 'systemctl status nginx → active (running); enabled', restore: 'Reinstall the package, then restore /var/www/html from the nightly rsync copy', problems: 'Page loads locally but not from another VM → ufw is blocking 80/tcp' },
            { service: 'MariaDB', host: 'linuxsrv 192.168.0.3', purpose: 'Holds the dispatch application database', build: 'sudo apt install mariadb-server -y\nsudo systemctl enable mariadb\nCREATE DATABASE capstone_db;\nCREATE USER capuser@localhost;\nGRANT ALL ON capstone_db.* TO capuser@localhost;', verify: 'mysql -u capuser -p -e "SHOW DATABASES;" → lists capstone_db', restore: 'mysql -u root capstone_db < the latest dump from /backups', problems: 'Access denied for capuser → privileges were granted but FLUSH PRIVILEGES was not run' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least two services are documented', test: (d) => (d.groups.services ?? []).filter((r) => !!r.service).length >= 2 },
      { label: 'Every service has build commands and a verify line', test: (d) => (d.groups.services ?? []).length > 0 && (d.groups.services ?? []).every((r) => !!r.build && !!r.verify) },
      { label: 'Every service documents how to restore it', test: (d) => (d.groups.services ?? []).length > 0 && (d.groups.services ?? []).every((r) => !!r.restore) },
    ],
  },

  // 9 — Access Control Matrix (W2, completed W3) ─────────────────────────────
  {
    id: 'srv_access_matrix',
    feeds: ['srv_hardening_report'],
    courseId: 'server-plus',
    num: 9,
    file: '09_Access_Control_Matrix.csv',
    title: 'Access Control Matrix',
    owner: 'windows',
    folder: '04_Windows',
    standard: 'Least privilege',
    weeks: [2, 3],
    gate: 3,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'A grid of who can access what, at what level, and why. It enforces least privilege and proves it for an audit — "Everyone / Full Control" is how data leaks.',
    howTo:
      'List each shared resource, assign the minimum access each group actually needs, and write the justification in the same row. If you cannot justify it, do not grant it.',
    buildSteps: [
      'List every share and protected folder on the file server.',
      'For each one, add a row per group — not per user. Groups are what stay correct as staff change.',
      'Pick the lowest permission that lets that group do their job.',
      'Write the justification. "Dispatchers view plans, they do not edit them" is a justification; "needed" is not.',
      'Remove the broad grants once the specific ones are in place, and re-check.',
    ],
    meaning:
      'A good matrix has no Full Control rows outside the administrators group, and every row explains itself.',
    useIt:
      'It is the source of truth for permissions and the artifact you show to prove access is controlled.',
    pitfalls: [
      'Granting to individual users. The matrix rots the first time someone changes role.',
      'Leaving the default Everyone entry in place alongside your new groups — the broadest grant wins.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'access',
          label: 'Resource access',
          help: 'One row per resource + group pair. Least privilege means the lowest level that still works.',
          columns: [
            c('resource', 'Resource (share / folder)', 'text', { placeholder: '\\\\winserver\\SitePlans' }),
            c('principal', 'Group', 'text', { placeholder: 'Dispatch' }),
            c('permission', 'Permission', 'select', { options: NTFS_RIGHTS }),
            c('justification', 'Justification (least privilege)', 'text', { placeholder: 'Dispatchers view site plans; they do not edit them' }),
            c('verified', 'Verified on the server?', 'select', { options: ['Yes', 'No'] }),
          ],
          seed: [
            { resource: '\\\\winserver\\SitePlans', principal: 'Dispatch', permission: 'Read', justification: 'Dispatchers view site plans; they do not edit them', verified: 'Yes' },
            { resource: '\\\\winserver\\SitePlans', principal: 'Engineering', permission: 'Modify', justification: 'Engineers update the plans as sites change', verified: 'Yes' },
            { resource: '\\\\winserver\\SitePlans', principal: 'Domain Admins', permission: 'Full Control', justification: 'Administration and backup only', verified: 'Yes' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three resource/group rows are recorded', test: (d) => (d.groups.access ?? []).filter((r) => !!r.resource && !!r.principal).length >= 3 },
      { label: 'Every row justifies its permission level', test: (d) => (d.groups.access ?? []).length > 0 && (d.groups.access ?? []).every((r) => !!r.justification) },
      { label: 'No "Everyone" group holds Full Control', test: (d) => !(d.groups.access ?? []).some((r) => /everyone/i.test(r.principal ?? '') && r.permission === 'Full Control') },
      { label: 'Every row has been verified on the server', test: (d) => (d.groups.access ?? []).length > 0 && (d.groups.access ?? []).every((r) => r.verified === 'Yes') },
    ],
  },

  // 10 — Connectivity Test Matrix (W2–W4) ───────────────────────────────────
  {
    id: 'srv_connectivity_matrix',
    feeds: ['srv_as_built'],
    courseId: 'server-plus',
    num: 10,
    file: '10_Connectivity_Test_Matrix.csv',
    title: 'Connectivity Test Matrix',
    owner: 'network',
    folder: '03_Network',
    standard: 'Segmentation validation',
    weeks: [2, 3, 4],
    gate: 4,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'A grid of every from-to path that should or should NOT work, and the result you actually got. "It works on my machine" is not proof; this is objective evidence that segmentation behaves as designed.',
    howTo:
      'Derive the rows from the design — list what should talk to what, then add the negative tests. Run each one, capture the output, and record the real result even when it fails.',
    source: 'The network design and the firewall rule base.',
    buildSteps: [
      'Write one row per intended path before testing anything: source, destination, test, expected result.',
      'Add the negative tests — DMZ to private LAN must be BLOCKED. Those rows prove the segmentation.',
      'Run each test from the actual source machine, not from the host.',
      'Record what really happened. A mismatch is a finding to fix, not a row to quietly edit.',
      'Re-run the whole matrix after every firewall change, and once more in Week 4.',
    ],
    meaning:
      'The negative rows are what make this a security document. Anyone can prove things connect; proving the right things cannot is the harder half.',
    useIt:
      'Any mismatch becomes a finding in the hardening report; the completed matrix goes in the as-built package as evidence.',
    pitfalls: [
      'Only testing what you expect to work. A matrix with no BLOCKED rows proves nothing about isolation.',
      'Testing from the Proxmox host, which can reach everything — it is not a client and proves nothing.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'tests',
          label: 'Tests',
          help: 'Expected is what the design says should happen. Actual is what really happened. They must match.',
          columns: [
            c('from', 'From', 'text', { placeholder: 'client01 192.168.0.101' }),
            c('to', 'To (host / IP)', 'text', { placeholder: 'winserver.teamx.local' }),
            c('test', 'Test', 'select', { options: ['ping', 'nslookup', 'curl / browser', 'ssh', 'rdp', 'net use'] }),
            c('expected', 'Expected', 'select', { options: ['Pass', 'BLOCKED'] }),
            c('actual', 'Actual', 'select', { options: ['Pass', 'Blocked', 'Failed unexpectedly'] }),
            c('evidence', 'Evidence file', 'text', { placeholder: 'GranitePeak_Wk2_Net_nslookup.png' }),
            c('date', 'Date', 'date'),
          ],
          seed: [
            { from: 'client01 192.168.0.101', to: 'winserver.teamx.local', test: 'nslookup', expected: 'Pass', actual: 'Pass', evidence: 'GranitePeak_Wk2_Net_nslookup.png', date: '2026-02-24' },
            { from: 'client01 192.168.0.101', to: 'http://192.168.0.3', test: 'curl / browser', expected: 'Pass', actual: 'Pass', evidence: 'GranitePeak_Wk2_Net_nginx-portal.png', date: '2026-02-24' },
            { from: 'jumpbox 172.16.0.10', to: 'linuxsrv 192.168.0.3', test: 'ssh', expected: 'Pass', actual: 'Pass', evidence: 'GranitePeak_Wk2_Net_jump-ssh.png', date: '2026-02-24' },
            { from: 'jumpbox 172.16.0.10 (DMZ)', to: 'winserver 192.168.0.2', test: 'ping', expected: 'BLOCKED', actual: 'Blocked', evidence: 'GranitePeak_Wk3_Net_dmz-blocked.png', date: '2026-03-03' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least six paths are tested', test: (d) => (d.groups.tests ?? []).filter((r) => !!r.from && !!r.to).length >= 6 },
      { label: 'At least one negative test proves DMZ cannot reach the private LAN', test: (d) => (d.groups.tests ?? []).some((r) => r.expected === 'BLOCKED' && r.actual === 'Blocked') },
      { label: 'Every test records an actual result', test: (d) => (d.groups.tests ?? []).length > 0 && (d.groups.tests ?? []).every((r) => !!r.actual) },
      { label: 'Every test names its evidence file', test: (d) => (d.groups.tests ?? []).length > 0 && (d.groups.tests ?? []).every((r) => !!r.evidence) },
    ],
  },

  // 11 — Security Hardening Report (W3) ─────────────────────────────────────
  {
    id: 'srv_hardening_report',
    feeds: ['srv_as_built'],
    courseId: 'server-plus',
    num: 11,
    file: '11_Hardening_Report.md',
    title: 'Security Hardening Report',
    owner: 'network',
    folder: '06_Security',
    standard: 'Hardening / defence in depth',
    weeks: [3],
    gate: 3,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The honest account of what was hardened, what was proven, and what is still open. This is the line between a lab that works and an environment that is safe to run a business on.',
    howTo:
      'One row per control area. Record what you actually did, the evidence that proves it, and the residual risk you are handing to the client.',
    buildSteps: [
      'List the control areas: access, firewall, segmentation, SSH, monitoring, patching.',
      'For each, say what you implemented and point at the evidence file that proves it.',
      'Score the state honestly — Not started and In progress are legitimate answers in Week 3.',
      'Write the residual risk for anything not fully closed. That paragraph is the value.',
    ],
    meaning:
      'A hardening report that says everything is Done is almost always wrong. Naming the gaps is what makes the rest credible.',
    useIt:
      'Gaps become the recommendations in the closeout deck; the client uses it to plan the next phase of work.',
    pitfalls: [
      'Claiming segmentation without the blocked-attempt evidence. Isolation you cannot demonstrate is not isolation.',
      'Marking monitoring Done because a tool is installed. Installed is not alerting.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'controls',
          label: 'Control areas',
          columns: [
            c('area', 'Control area', 'text', { placeholder: 'Network segmentation' }),
            c('implemented', 'What was implemented', 'text', { placeholder: 'Default-deny between DMZ and private LAN; SSH allowed on the approved path only' }),
            c('evidence', 'Evidence', 'text', { placeholder: 'GranitePeak_Wk3_Net_dmz-blocked.png' }),
            c('state', 'State', 'select', { options: DONE_STATE }),
            c('residual_risk', 'Residual risk', 'text', { placeholder: 'None for this path; the Windows host firewall still allows ICMP from the whole private LAN' }),
          ],
          seed: [
            { area: 'Access control (NTFS least privilege)', implemented: 'Everyone/Full Control removed; group-based Read and Modify per the access matrix', evidence: 'GranitePeak_Wk3_Win_share-perms.png', state: 'Done', residual_risk: 'Domain Admins retain Full Control by design' },
            { area: 'Network segmentation', implemented: 'Default-deny between DMZ and private LAN; SSH allowed on the approved path only', evidence: 'GranitePeak_Wk3_Net_dmz-blocked.png', state: 'Done', residual_risk: 'None for this path' },
            { area: 'Intrusion detection', implemented: 'Suricata running on the jump box, alerting to eve.json', evidence: 'GranitePeak_Wk3_Net_ids-alert.png', state: 'In progress', residual_risk: 'Alerts are logged but nobody is paged — no on-call process exists yet' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Summary',
        fields: [
          { field: 'posture', label: 'Overall security posture', type: 'area', required: true, help: 'Two or three sentences a manager can read: what is protected now, and what is not.', placeholder: 'The sensitive core is segmented and access is least-privilege…' },
          { field: 'top_recommendation', label: 'Top recommendation for the client', type: 'area', placeholder: 'Fund an on-call rota or a managed alerting service — detection without response is a log file.' },
        ],
      },
    ],
    dod: [
      { label: 'At least four control areas are reported', test: (d) => (d.groups.controls ?? []).filter((r) => !!r.area).length >= 4 },
      { label: 'Every control area names its evidence', test: (d) => (d.groups.controls ?? []).length > 0 && (d.groups.controls ?? []).every((r) => !!r.evidence) },
      { label: 'Segmentation is reported with proof', test: (d) => (d.groups.controls ?? []).some((r) => /segment/i.test(r.area ?? '') && !!r.evidence) },
      { label: 'The overall posture summary is written', test: (d) => !!d.fields.posture },
    ],
  },

  // 12 — Backup Assessment (W3) ─────────────────────────────────────────────
  {
    id: 'srv_backup_assessment',
    feeds: ['srv_dr_plan'],
    courseId: 'server-plus',
    num: 12,
    file: '12_Backup_Assessment.csv',
    title: 'Backup Assessment',
    owner: 'linux',
    folder: '06_Security',
    standard: 'Backup coverage review',
    weeks: [3],
    gate: 3,
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'An honest review of what is actually protected versus what is not. Most backups fail silently or were never tested — the assessment finds the gap before a real incident does.',
    howTo:
      'Inventory every system from the asset register, decide what data is critical, then check each one honestly against frequency, destination, retention and — the column that matters — last successful restore.',
    source: 'The asset register (what exists) and the two runbooks (what each system holds).',
    buildSteps: [
      'One row per system that holds data the business would miss.',
      'Record what is backed up, how often, where it lands, and how long it is kept.',
      'Fill in the last successful backup date from the actual job log, not from the schedule.',
      'Fill in the last successful RESTORE test. If it is empty, that is your finding.',
      'Write the gap and the risk it creates in business terms, not technical ones.',
    ],
    meaning:
      'A backup is a copy; a restore is proof. A row with a recent backup and no restore test is an untested assumption.',
    useIt:
      'Gaps drive the DR plan and the hardening report; the Week 4 restore test closes the most important one.',
    pitfalls: [
      'Recording the schedule instead of the last actual run. Schedules do not prove anything ran.',
      'Backing up to the same disk you are protecting against losing.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'systems',
          label: 'Systems',
          help: 'One row per system holding data the business would miss.',
          columns: [
            c('system', 'System', 'text', { placeholder: 'linuxsrv — /var/www/html' }),
            c('data', 'Data backed up', 'text', { placeholder: 'Portal web root' }),
            c('frequency', 'Frequency', 'select', { options: ['Hourly', 'Nightly', 'Weekly', 'Monthly', 'None'] }),
            c('destination', 'Destination', 'text', { placeholder: '/backups on a separate virtual disk' }),
            c('retention', 'Retention', 'text', { placeholder: '14 daily copies' }),
            c('last_backup', 'Last good backup', 'date'),
            c('last_restore', 'Last restore test', 'date'),
            c('gap', 'Gap / risk', 'text', { placeholder: 'Same host — a host loss takes the backups with it' }),
          ],
          seed: [
            { system: 'linuxsrv — /var/www/html', data: 'Portal web root', frequency: 'Nightly', destination: '/backups on a separate virtual disk', retention: '14 daily copies', last_backup: '2026-03-03', last_restore: '', gap: 'Never restore-tested, and the copy lives on the same host — a host loss takes both' },
            { system: 'linuxsrv — capstone_db', data: 'Dispatch database dump', frequency: 'Nightly', destination: '/backups/db', retention: '14 daily copies', last_backup: '2026-03-03', last_restore: '', gap: 'No offsite copy — fails the 3-2-1 rule' },
            { system: 'winserver — SitePlans share', data: 'Site plan documents', frequency: 'Nightly', destination: 'D:\\Backups', retention: '30 days', last_backup: '2026-03-03', last_restore: '', gap: 'Restore has never been proven' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three systems are assessed', test: (d) => (d.groups.systems ?? []).filter((r) => !!r.system).length >= 3 },
      { label: 'Every system states frequency, destination and retention', test: (d) => (d.groups.systems ?? []).length > 0 && (d.groups.systems ?? []).every((r) => !!r.frequency && !!r.destination && !!r.retention) },
      { label: 'Every system records a last good backup date', test: (d) => (d.groups.systems ?? []).length > 0 && (d.groups.systems ?? []).every((r) => !!r.last_backup) },
      { label: 'Every gap is named honestly', test: (d) => (d.groups.systems ?? []).length > 0 && (d.groups.systems ?? []).every((r) => !!r.gap) },
    ],
  },

  // 13 — DR Plan & Test Report (W3 drafted, W4 tested) ──────────────────────
  {
    id: 'srv_dr_plan',
    feeds: ['srv_as_built'],
    courseId: 'server-plus',
    num: 13,
    file: '13_DR_Plan_and_Test.md',
    title: 'DR Plan & Test Report',
    owner: 'lead',
    folder: '06_Security',
    standard: 'Disaster recovery (RTO / RPO)',
    weeks: [3, 4],
    gate: 4,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The written procedure for getting the business running again after something breaks — and the measured proof that it works. For this client, downtime means trucks are not dispatched.',
    howTo:
      'Set an RTO and RPO per system with the client priorities, document the restore steps, then actually run a restore in Week 4 and record how long it really took.',
    source: 'The backup assessment (what is protected) and both runbooks (how each service rebuilds).',
    buildSteps: [
      'List the critical systems from the asset register, in the order the business needs them back.',
      'Set RTO (how fast it must return) and RPO (how much data can be lost) with the client priorities.',
      'Write the restore procedure per system, pointing at the runbook step that rebuilds it.',
      'In Week 4: delete a test file, restore it, and time the whole thing.',
      'Record the ACTUAL recovery time against the RTO — including when you missed it.',
    ],
    meaning:
      'A tested DR plan turns "we hope we can recover" into "we know we can, in N minutes". Only the restore counts.',
    useIt:
      'You execute a slice of it in Week 4 as the DR test; the client keeps it current as systems change.',
    pitfalls: [
      'An RTO chosen because it sounds good. It should come from what the downtime costs the client.',
      'Recording the test as "passed" without the measured time — the number is the whole point.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'systems',
          label: 'Critical systems — RTO / RPO',
          help: 'Ordered by how urgently the business needs each one back.',
          columns: [
            c('system', 'System', 'text', { placeholder: 'linuxsrv — capstone_db' }),
            c('impact', 'Business impact if down', 'text', { placeholder: 'Dispatch stops — trucks idle' }),
            c('rto', 'RTO (max downtime)', 'text', { placeholder: '2 hours' }),
            c('rpo', 'RPO (max data loss)', 'text', { placeholder: '24 hours' }),
            c('backup_location', 'Backup location', 'text', { placeholder: '/backups/db on linuxsrv' }),
            c('restore_steps', 'Restore procedure', 'area', { placeholder: 'Stop the app; mysql -u root capstone_db < latest dump; verify row count; restart the app.' }),
          ],
          seed: [
            { system: 'linuxsrv — capstone_db', impact: 'Dispatch stops — trucks idle', rto: '2 hours', rpo: '24 hours', backup_location: '/backups/db on linuxsrv', restore_steps: 'Stop the app. Import the latest dump with mysql -u root capstone_db < dump.sql. Verify the row count matches. Restart the app and confirm the portal loads.' },
            { system: 'winserver — DNS/DHCP', impact: 'Nothing resolves; new machines get no address', rto: '4 hours', rpo: '24 hours', backup_location: 'D:\\Backups (Windows Server Backup)', restore_steps: 'Reinstall the roles per the Windows runbook, then import the zone file and recreate the scope from the runbook row.' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Week 4 — DR test results',
        fields: [
          { field: 'test_date', label: 'Test date', type: 'date' },
          { field: 'test_system', label: 'System tested', type: 'text', placeholder: 'linuxsrv — /var/www/html' },
          { field: 'what_was_lost', label: 'What was deleted / simulated', type: 'text', placeholder: 'Deleted index.html and the whole site directory' },
          { field: 'recovery_time', label: 'Actual recovery time', type: 'text', placeholder: '11 minutes' },
          { field: 'rto_met', label: 'RTO met?', type: 'select', options: ['Yes', 'No'] },
          { field: 'integrity', label: 'How you confirmed the data was intact', type: 'area', placeholder: 'Compared the restored file’s SHA-256 against the pre-deletion hash — identical.' },
          { field: 'lessons', label: 'What the test taught you', type: 'area', placeholder: 'The restore worked, but finding the right dated folder took longer than the copy itself — the backup script should write a "latest" symlink.' },
        ],
      },
    ],
    dod: [
      { label: 'At least two critical systems have an RTO and RPO', test: (d) => (d.groups.systems ?? []).filter((r) => !!r.rto && !!r.rpo).length >= 2 },
      { label: 'Every system has a written restore procedure', test: (d) => (d.groups.systems ?? []).length > 0 && (d.groups.systems ?? []).every((r) => !!r.restore_steps) },
      { label: 'A real restore was performed and timed', test: (d) => !!(d.fields.test_system && d.fields.recovery_time) },
      { label: 'Data integrity after the restore was confirmed', test: (d) => !!d.fields.integrity },
    ],
  },

  // 14 — As-Built Package (W4) — THE CAPSTONE ───────────────────────────────
  {
    id: 'srv_as_built',
    capstone: true,
    courseId: 'server-plus',
    num: 14,
    file: '14_As_Built.md',
    title: 'As-Built Package',
    owner: 'lead',
    folder: '08_Handover',
    standard: 'As-built handover documentation',
    weeks: [4],
    gate: 4,
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The complete, accurate record of what was ACTUALLY built — the thing the client operates from after you leave. It is the single most valuable deliverable in the engagement.',
    howTo:
      'You do not write this at the end — you assemble it from documents you kept current all along. Tick each document in, note its version, and confirm it matches reality.',
    source: 'Every other deliverable in this engagement.',
    buildSteps: [
      'Walk the handover checklist and confirm each document exists and is current.',
      'For each one, record its version and whether it still matches what is actually running.',
      'Fix any document that disagrees with reality — a diagram that lies is worse than no diagram.',
      'Have a teammate who did not build a given service follow its runbook cold.',
      'Write the summary the client reads first: what they now have, and what they should do next.',
    ],
    meaning:
      'The standard is simple: a stranger should be able to pick this up and run Granite Peak\'s environment without asking you a single question.',
    useIt:
      'It is the core of the handover and the backbone of the closeout presentation. The client keeps it and maintains it.',
    pitfalls: [
      'Assembling it from memory in Week 4. If the folder library was not kept current, this week becomes a scramble.',
      'Including the plan instead of what was built. As-built means as BUILT — including the parts that changed.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'contents',
          label: 'Handover checklist',
          help: 'Every document in the package, its version, and whether it matches what is actually running.',
          columns: [
            c('document', 'Document', 'text', { placeholder: 'Network Design & IP Plan' }),
            c('version', 'Version', 'text', { placeholder: '1.2' }),
            c('current', 'Matches reality?', 'select', { options: ['Yes', 'No — needs update'] }),
            c('note', 'Note', 'text', { placeholder: 'Updated after the Week 3 firewall changes' }),
          ],
          seed: [
            { document: 'Statement of Work & Project Plan', version: '1.0', current: 'Yes', note: 'Unchanged since kick-off' },
            { document: 'Hardware Assessment', version: '1.0', current: 'Yes', note: '' },
            { document: 'Network Design & IP Plan', version: '1.2', current: 'Yes', note: 'Updated after the Week 3 firewall changes' },
            { document: 'Asset Register', version: '1.1', current: 'Yes', note: 'Software tab completed in Week 3' },
            { document: 'Firewall Rule Base', version: '1.2', current: 'Yes', note: '' },
            { document: 'Windows Runbook', version: '1.0', current: 'Yes', note: 'Followed cold by the Linux engineer — no questions' },
            { document: 'Linux Runbook', version: '1.0', current: 'Yes', note: '' },
            { document: 'Access Control Matrix', version: '1.1', current: 'Yes', note: '' },
            { document: 'Connectivity Test Matrix', version: '1.3', current: 'Yes', note: 'Re-run in full in Week 4' },
            { document: 'DR Plan & Test Report', version: '1.1', current: 'Yes', note: 'Restore tested 2026-03-10, 11 minutes' },
            { document: 'Change Log', version: 'live', current: 'Yes', note: 'Append-only, 31 entries' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Client summary',
        fields: [
          { field: 'what_they_have', label: 'What the client now has', type: 'area', required: true, help: 'Plain language, for someone who was not in the room.', placeholder: 'A segmented server environment running name resolution, addressing, a staff portal, a dispatch database and file storage — with tested backups.' },
          { field: 'how_to_operate', label: 'How they operate it without you', type: 'area', required: true, placeholder: 'Every service has a runbook in 04_Windows or 05_Linux with build, verify and restore steps.' },
          { field: 'recommendations', label: 'Findings & recommendations', type: 'area', required: true, placeholder: 'The server is out of warranty; only 2 of 4 NICs are cabled; there is no offsite backup copy and no on-call process for IDS alerts.' },
          { field: 'handover_date', label: 'Handover date', type: 'date', required: true },
          { field: 'signoff', label: 'Client sign-off', type: 'signature', required: true, placeholder: 'Client representative name' },
        ],
      },
      custodySection({
        label: 'Evidence appendix — hash & log every artifact you hand over',
        seed: [
          { evidence_id: 'E-01', description: 'GranitePeak_Wk4_Lead_dr-restore.png', collected_by: 'Lead', collected_at: '2026-03-10 10:42', location: '07_Evidence/W4/', sha256: 'from sha256sum GranitePeak_Wk4_Lead_dr-restore.png', transferred_to: 'Client', transferred_at: '2026-03-12 15:00', notes: 'Restore test proof, handed over at closeout' },
        ],
      }),
    ],
    dod: [
      { label: 'At least ten documents are checked into the package', test: (d) => (d.groups.contents ?? []).filter((r) => !!r.document).length >= 10 },
      { label: 'Every document is confirmed to match reality', test: (d) => (d.groups.contents ?? []).length > 0 && (d.groups.contents ?? []).every((r) => r.current === 'Yes') },
      { label: 'The client summary and recommendations are written', test: (d) => !!(d.fields.what_they_have && d.fields.how_to_operate && d.fields.recommendations) },
      { label: 'Handover is dated and signed off', test: (d) => !!(d.fields.handover_date && d.fields.signoff) },
      { label: 'Every handover artifact is hashed (chain of custody)', test: (d) => everyEvidenceHashed()(d) },
    ],
  },
];

import { Column } from '../grc/templates';
import { DeliverableDef } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * Client deliverables for the CompTIA Server+ capstone — plan, build, connect
 * and secure a rack-mount server in a 24U rack, documented like a professional.
 *
 * Every student runs the WHOLE engagement on their own server, independently,
 * and fills EVERY form below — that is what `shared: true` means. `owner` is
 * the focus role that leads the documentation for that record (and the lane the
 * deliverable chain draws it in), not a gate on who may open it. No deliverable
 * waits on anyone else's work.
 *
 * Week 1 is planning and analysis — a junior sysadmin's first week: business
 * requirements, a rack plan, a hardware capability audit, an upgrade plan and a
 * draft architecture. The build then executes that plan. Forms are deliberately
 * compact (a few grouped columns, seeded worked rows) so a week's paperwork
 * fits inside the two-hour weekly budget; the exact CLI lives in the platform's
 * own configuration guide (Reference → Configuration guide), not in any handout,
 * and each form is exported to PDF from the Deliverables page.
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
const YN = ['Yes', 'No'];

export const SERVER_PLUS_DELIVERABLES: DeliverableDef[] = [
  // 1 — Business Requirements Sheet ──────────────────────────────────────────
  {
    id: 'srv_business_reqs',
    feeds: ['srv_rack_plan', 'srv_architecture'],
    courseId: 'server-plus',
    num: 1,
    file: '01_Business_Requirements.md',
    title: 'Business Requirements Sheet',
    owner: 'mgmt',
    shared: true,
    folder: '00_Planning',
    standard: 'Business requirements / scope',
    weeks: [1],
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'The business profile that drives every technical decision this course: who the client is, what must stay up, what rules apply, and what "done" looks like. Specs only matter because of what is on this page.',
    howTo:
      'Choose (or propose) a business scenario and fill every field. The compliance, uptime and critical-systems answers are the ones the architecture and DR plan will be checked against later.',
    buildSteps: [
      'Name the client, the industry, and yourself as the technician.',
      'Size the business: employees, departments, hours of operation.',
      'List the critical systems the business cannot work without.',
      'Set the compliance rule, the uptime target, and data retention.',
      'State remote-access needs and the security posture.',
      'Write acceptance criteria you could actually demonstrate.',
    ],
    meaning:
      'A requirement you cannot trace to the business is a preference. Every later document should be able to point back at a line on this sheet.',
    useIt:
      'It drives the rack plan and the architecture, and it is what the DR numbers and security choices are justified against.',
    pitfalls: [
      'Choosing specs first and inventing a business to fit them. The business comes first; the hardware serves it.',
      'An uptime target with no consequence attached. "99.9% because dispatch stops" is a requirement; "99.9%" alone is a wish.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The business',
        fields: [
          { field: 'client', label: 'Business name', type: 'text', required: true, placeholder: 'Granite Peak Aggregates' },
          { field: 'industry', label: 'Industry', type: 'select', options: ['Manufacturing', 'Healthcare', 'Retail', 'MSP / IT services', 'Logistics', 'Professional services', 'Other'] },
          { field: 'industry_other', label: 'If Other — describe the business', type: 'text', placeholder: 'e.g. A regional veterinary clinic chain' },
          { field: 'technician', label: 'Technician (you)', type: 'text', required: true, placeholder: 'Your name' },
          { field: 'start_date', label: 'Start date', type: 'date', required: true },
          { field: 'employees', label: 'Employees', type: 'text', required: true, placeholder: '45' },
          { field: 'departments', label: 'Departments', type: 'text', placeholder: 'Dispatch, Sales, Accounting, Yard' },
          { field: 'hours', label: 'Hours of operation', type: 'text', placeholder: 'Mon–Sat 05:00–18:00' },
        ],
      },
      {
        kind: 'fields',
        title: 'What the infrastructure must do',
        fields: [
          { field: 'critical_systems', label: 'Critical systems', type: 'area', required: true, placeholder: 'Dispatch database, staff portal, file shares, name resolution and addressing for the office.' },
          { field: 'compliance', label: 'Compliance requirements', type: 'select', options: ['None', 'HIPAA', 'PCI-DSS', 'SOX', 'Multiple / other'] },
          { field: 'sla', label: 'Uptime target (SLA)', type: 'text', required: true, placeholder: '99.5% during operating hours — downtime stops dispatch' },
          { field: 'retention', label: 'Data retention requirement', type: 'text', placeholder: 'Dispatch records kept 7 years; nightly backups kept 30 days' },
          { field: 'remote_access', label: 'Remote access needs', type: 'text', placeholder: 'Owner and technician need remote administration; no public services' },
          { field: 'posture', label: 'Security posture', type: 'select', options: ['Basic', 'Moderate', 'High'] },
          { field: 'acceptance', label: 'Acceptance criteria (demonstrable)', type: 'area', required: true, placeholder: 'Wk1 plan approved · Wk2 platform deployed · Wk3 connected & proven · Wk4 secured, restore timed, package handed over' },
        ],
      },
    ],
    dod: [
      { label: 'The business, industry, technician and start date are filled in', test: (d) => !!(d.fields.client && d.fields.technician && d.fields.start_date) },
      { label: 'Critical systems and the uptime target are written down', test: (d) => !!(d.fields.critical_systems && d.fields.sla) },
      { label: 'Employees, compliance and posture are set', test: (d) => !!(d.fields.employees && d.fields.compliance && d.fields.posture) },
      { label: 'The acceptance criteria are demonstrable statements', test: (d) => !!d.fields.acceptance },
    ],
  },

  // 2 — Rack Plan & Cabling Record ───────────────────────────────────────────
  {
    id: 'srv_rack_plan',
    feeds: ['srv_asset_register', 'srv_architecture'],
    courseId: 'server-plus',
    num: 2,
    file: '02_Rack_Plan_and_Cabling.md',
    title: 'Rack Plan & Cabling Record',
    owner: 'net',
    shared: true,
    folder: '01_Physical',
    standard: 'Rack elevation / structured cabling',
    weeks: [1, 2],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The plan for the 24U rack — what goes at which U, how air and power move, and where the room to grow is — then, once built, the record of every cable so any link can be traced without pulling the rack apart.',
    howTo:
      'Plan the elevation in Week 1 before touching hardware: placements, airflow, power, cooling, physical security, and at least 20% free U space. In Week 2, as-built it and log every cable.',
    buildSteps: [
      'Note the rack (24U) and count what must fit: servers, switch, patch panel, PDU/UPS.',
      'Place equipment bottom-up by weight, and record the airflow direction.',
      'Decide the power path (PDU/UPS outlets) and the cable-management strategy.',
      'Reserve expansion space — at least 20% of the rack (5U in a 24U) stays free.',
      'Note the physical-security consideration (locked room, locked rack, or both).',
      'Week 2: correct the elevation to as-built and log each cable at both ends.',
    ],
    meaning:
      'A rack planned on paper is one you can defend: why each U, where the air goes, what the PDU can feed, and where the next server lands without re-cabling.',
    useIt:
      'The Week-2 build executes this plan; the asset register and architecture reference it; a field tech traces any link from the cable schedule alone.',
    pitfalls: [
      'Filling the rack. With no expansion reserve, the first growth request means re-racking a live business.',
      'Recording the switch port but not the patch-panel port — the trace breaks in the middle.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Rack plan (Week 1)',
        fields: [
          { field: 'rack_id', label: 'Rack ID / location', type: 'text', required: true, placeholder: 'Rack A — server room' },
          { field: 'rack_size', label: 'Rack size', type: 'select', options: ['24U', '42U', '12U', 'Other'] },
          { field: 'airflow', label: 'Airflow direction', type: 'text', required: true, placeholder: 'Front (cold) intake → rear (hot) exhaust; nothing blocks the rear' },
          { field: 'power', label: 'Power distribution', type: 'text', required: true, placeholder: '8-outlet PDU at U1 fed from the UPS; one outlet per device, labelled' },
          { field: 'cooling', label: 'Cooling consideration', type: 'text', placeholder: 'Room AC holds 22°C; 1U gap above the server for airflow' },
          { field: 'physical_security', label: 'Physical security', type: 'text', placeholder: 'Server room locked; rack key with the office manager' },
          { field: 'expansion', label: 'Expansion reserve (≥20% = 5U in a 24U)', type: 'text', required: true, placeholder: 'U8–U18 kept free (11U) for a second server and NAS' },
          { field: 'photo', label: 'Rack photo (front & rear, Week 2)', type: 'text', placeholder: 'GranitePeak_Wk2_rack-front.jpg' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'elevation',
          label: 'Rack elevation — planned in Week 1, corrected to as-built in Week 2',
          help: 'One row per device, top of its position first. This is the map of the 24U rack.',
          columns: [
            c('u', 'U position', 'text', { placeholder: 'U20–U21' }),
            c('device', 'Device', 'text', { placeholder: 'Dell R630 server' }),
            c('type', 'Type', 'select', { options: ['Server', 'Switch', 'Patch panel', 'PDU', 'UPS', 'Shelf', 'Blank / reserved'] }),
            c('status', 'Status', 'select', { options: ['Planned', 'Installed'] }),
            c('notes', 'Notes', 'text', { placeholder: '2U, front intake / rear exhaust' }),
          ],
          seed: [
            { u: 'U24', device: '24-port patch panel', type: 'Patch panel', status: 'Planned', notes: 'Cat6 terminations from the office drops' },
            { u: 'U23', device: 'Access switch', type: 'Switch', status: 'Planned', notes: 'Uplink to office LAN on port 24' },
            { u: 'U20–U21', device: 'Dell PowerEdge R630', type: 'Server', status: 'Planned', notes: '2U on sliding rails — the hypervisor host' },
            { u: 'U8–U18', device: 'Expansion reserve', type: 'Blank / reserved', status: 'Planned', notes: '≥20% kept free for growth' },
            { u: 'U1', device: 'Rack PDU', type: 'PDU', status: 'Planned', notes: '8-outlet, feeds every device above' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'cabling',
          label: 'Cable schedule (Week 2)',
          help: 'One row per cable. Trace any link from panel port to switch port using this alone.',
          columns: [
            c('label', 'Cable label', 'text', { placeholder: 'A-01' }),
            c('from', 'From', 'text', { placeholder: 'Patch panel P1' }),
            c('to', 'To', 'text', { placeholder: 'Switch Gi0/1' }),
            c('colour', 'Colour', 'select', { options: ['Blue', 'Green', 'Yellow', 'Red', 'Grey', 'Black'] }),
            c('carries', 'Carries', 'text', { placeholder: 'Server NIC 1 — management' }),
          ],
          seed: [
            { label: 'A-01', from: 'Patch panel P1', to: 'Switch Gi0/1', colour: 'Blue', carries: 'Server NIC 1 — hypervisor management' },
            { label: 'A-02', from: 'Patch panel P2', to: 'Switch Gi0/2', colour: 'Green', carries: 'Server NIC 2 — VM traffic' },
            { label: 'A-24', from: 'Switch Gi0/24', to: 'Office wall port', colour: 'Yellow', carries: 'Uplink to the office LAN' },
          ],
        },
      },
    ],
    dod: [
      { label: 'The rack is identified with airflow, power and an expansion reserve', test: (d) => !!(d.fields.rack_id && d.fields.airflow && d.fields.power && d.fields.expansion) },
      { label: 'At least four devices are placed in the elevation', test: (d) => (d.groups.elevation ?? []).filter((r) => !!r.u && !!r.device).length >= 4 },
      { label: 'The elevation includes a reserved expansion row', test: (d) => (d.groups.elevation ?? []).some((r) => r.type === 'Blank / reserved') },
      { label: 'At least three cables are logged with both ends (Week 2)', test: (d) => (d.groups.cabling ?? []).filter((r) => !!r.label && !!r.from && !!r.to).length >= 3 },
    ],
  },

  // 3 — Server Hardware Discovery Sheet ──────────────────────────────────────
  {
    id: 'srv_discovery',
    feeds: ['srv_upgrade_plan', 'srv_config_mgmt'],
    courseId: 'server-plus',
    num: 3,
    file: '03_Hardware_Discovery.csv',
    title: 'Server Hardware Discovery Sheet',
    owner: 'lnx',
    shared: true,
    folder: '01_Physical',
    standard: 'Hardware capability audit',
    weeks: [1],
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The deep audit of what each server actually is and can do — CPU, memory, storage, networking, expansion and firmware. Upgrade decisions and VM sizing are only as good as this sheet.',
    howTo:
      'Walk one server at a time with the service tag, the BIOS screen and the remote-management page. The platform\'s configuration guide (Reference → Configuration guide, Week 1) says which screen each value lives on. Record what IS, not what the spec sheet claims.',
    source: 'The machine itself: labels, BIOS/UEFI, and iDRAC/iLO.',
    buildSteps: [
      'Identify the server: manufacturer, model, serial/service tag.',
      'CPU: model, cores/threads, virtualization support (VT-x/VT-d), max RAM.',
      'Memory: installed vs maximum, slots used vs total, ECC type.',
      'Storage: bays, RAID controller and levels, installed drives.',
      'Network & management: NICs, speeds, ports, iDRAC/iLO version.',
      'Expansion & firmware: PCIe slots, installed cards, BIOS version, boot mode.',
    ],
    meaning:
      'The gap between installed and maximum is your upgrade headroom, and the virtualization flags decide whether the hypervisor plan works at all.',
    useIt:
      'It feeds the Upgrade Planning Sheet directly (headroom and compatibility) and the configuration record (the pre-install baseline).',
    pitfalls: [
      'Copying the model\'s spec sheet instead of reading the machine. Reclaimed servers rarely match their brochure.',
      'Skipping the virtualization flags — a disabled VT-x surfaces as a Week-2 mystery failure.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'cpu',
          label: 'CPU',
          help: 'One row per server. The virtualization column decides whether the hypervisor plan works.',
          columns: [
            c('server', 'Server', 'text', { placeholder: 'R630 — service tag 7XK2M13' }),
            c('model', 'CPU model', 'text', { placeholder: '2× Xeon E5-2640 v3' }),
            c('cores', 'Cores / threads', 'text', { placeholder: '16C / 32T total' }),
            c('virt', 'VT-x / VT-d', 'select', { options: ['Both enabled', 'VT-x only', 'Disabled in BIOS', 'Not supported'] }),
            c('max_ram', 'Max RAM supported', 'text', { placeholder: '768 GB' }),
          ],
          seed: [
            { server: 'R630 — 7XK2M13', model: '2× Xeon E5-2640 v3', cores: '16C / 32T total', virt: 'Both enabled', max_ram: '768 GB' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'memory',
          label: 'Memory',
          help: 'Installed vs maximum is the upgrade headroom.',
          columns: [
            c('server', 'Server', 'text', { placeholder: 'R630 — 7XK2M13' }),
            c('installed', 'Installed', 'text', { placeholder: '32 GB' }),
            c('max', 'Maximum', 'text', { placeholder: '768 GB' }),
            c('slots', 'Slots used / total', 'text', { placeholder: '4 / 24' }),
            c('ecc', 'ECC type', 'select', { options: ['RDIMM', 'LRDIMM', 'UDIMM ECC', 'Non-ECC', 'Unknown'] }),
          ],
          seed: [
            { server: 'R630 — 7XK2M13', installed: '32 GB', max: '768 GB', slots: '4 / 24', ecc: 'RDIMM' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'storage',
          label: 'Storage',
          help: 'Bays, controller and what is actually in the sleds.',
          columns: [
            c('server', 'Server', 'text', { placeholder: 'R630 — 7XK2M13' }),
            c('bays', 'Drive bays', 'text', { placeholder: '8× 2.5" hot-swap' }),
            c('controller', 'RAID controller', 'text', { placeholder: 'PERC H730, 1 GB cache' }),
            c('levels', 'RAID levels supported', 'text', { placeholder: '0/1/5/6/10' }),
            c('drives', 'Installed drives', 'text', { placeholder: '4× 600 GB SAS 10k' }),
          ],
          seed: [
            { server: 'R630 — 7XK2M13', bays: '8× 2.5" hot-swap', controller: 'PERC H730, 1 GB cache', levels: '0/1/5/6/10', drives: '4× 600 GB SAS 10k' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'network',
          label: 'Network & remote management',
          help: 'The NICs the topology will use, and the out-of-band path.',
          columns: [
            c('server', 'Server', 'text', { placeholder: 'R630 — 7XK2M13' }),
            c('nics', 'NICs (model · ports · speed)', 'text', { placeholder: 'Broadcom quad-port 1 GbE' }),
            c('mgmt', 'iDRAC / iLO / IPMI', 'text', { placeholder: 'iDRAC8 Enterprise' }),
            c('mgmt_ver', 'Management firmware', 'text', { placeholder: '2.70.70.70' }),
          ],
          seed: [
            { server: 'R630 — 7XK2M13', nics: 'Broadcom quad-port 1 GbE', mgmt: 'iDRAC8 Enterprise', mgmt_ver: '2.70.70.70' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'firmware',
          label: 'Expansion & firmware',
          help: 'PCIe headroom and the boot state the install will meet.',
          columns: [
            c('server', 'Server', 'text', { placeholder: 'R630 — 7XK2M13' }),
            c('pcie', 'PCIe slots (free / total)', 'text', { placeholder: '2 / 3 free' }),
            c('cards', 'Installed cards', 'text', { placeholder: 'PERC H730 only' }),
            c('bios', 'BIOS version', 'text', { placeholder: '2.19.0' }),
            c('boot', 'Boot mode', 'select', { options: ['UEFI', 'BIOS (legacy)', 'UEFI + Secure Boot'] }),
          ],
          seed: [
            { server: 'R630 — 7XK2M13', pcie: '2 / 3 free', cards: 'PERC H730 only', bios: '2.19.0', boot: 'UEFI' },
          ],
        },
      },
    ],
    dod: [
      { label: 'CPU row recorded with virtualization support', test: (d) => (d.groups.cpu ?? []).filter((r) => !!r.server && !!r.virt).length >= 1 },
      { label: 'Memory row shows installed, maximum and slots', test: (d) => (d.groups.memory ?? []).filter((r) => !!r.installed && !!r.max && !!r.slots).length >= 1 },
      { label: 'Storage row names the controller and installed drives', test: (d) => (d.groups.storage ?? []).filter((r) => !!r.controller && !!r.drives).length >= 1 },
      { label: 'Network & management and firmware rows are recorded', test: (d) => (d.groups.network ?? []).filter((r) => !!r.nics).length >= 1 && (d.groups.firmware ?? []).filter((r) => !!r.bios).length >= 1 },
    ],
  },

  // 4 — Upgrade Planning Sheet ───────────────────────────────────────────────
  {
    id: 'srv_upgrade_plan',
    feeds: ['srv_asset_register'],
    courseId: 'server-plus',
    num: 4,
    file: '04_Upgrade_Plan.csv',
    title: 'Upgrade Planning Sheet',
    owner: 'win',
    shared: true,
    folder: '00_Planning',
    standard: 'Upgrade planning / procurement',
    weeks: [1],
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'The proposal for what the servers need before they can serve the business — each upgrade confirmed compatible, priced, justified in business terms, and risk-assessed. Procurement thinking, not shopping.',
    howTo:
      'One row per proposed upgrade, driven by the gap the Discovery Sheet exposed (installed vs max, missing capability). Every row needs a compatibility check and a business justification, then instructor sign-off.',
    source: 'The Server Hardware Discovery Sheet — its headroom and gaps.',
    buildSteps: [
      'Find the gaps: installed vs maximum RAM, drive bays empty, NIC speeds vs need.',
      'Propose the component: current → replacement, with the exact part class.',
      'Confirm compatibility against the discovery sheet (board, controller, backplane).',
      'Price it with a vendor source, and rate the installation complexity and risk.',
      'Justify it in business terms — the requirement it serves, not the spec it raises.',
      'Get instructor approval before anything is ordered or installed.',
    ],
    meaning:
      'An upgrade justified by a requirement ("dispatch DB needs RAM for 4 VMs") survives review; one justified by a bigger number does not.',
    useIt:
      'Approved upgrades become asset-register rows when installed, and the risk column feeds the change log when the work happens.',
    pitfalls: [
      'Proposing parts the platform cannot use — the compatibility column exists to be checked, not ticked.',
      'A justification that restates the spec ("more RAM") instead of the business need it serves.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'upgrades',
          label: 'Proposed upgrades',
          help: 'One row per component. Compatibility and justification are the graded columns.',
          columns: [
            c('server', 'Server', 'text', { placeholder: 'R630 — 7XK2M13' }),
            c('type', 'Component type', 'select', { options: ['RAM', 'CPU', 'Drive', 'NIC', 'RAID controller', 'PSU', 'Other'] }),
            c('current', 'Current', 'text', { placeholder: '32 GB (4× 8 GB RDIMM)' }),
            c('proposed', 'Proposed', 'text', { placeholder: '96 GB (add 4× 16 GB RDIMM 2133)' }),
            c('compatible', 'Compatible?', 'select', { options: ['Confirmed', 'Needs check', 'No'] }),
            c('cost', 'Est. cost', 'text', { placeholder: '$120 used' }),
            c('vendor', 'Vendor source', 'text', { placeholder: 'Refurb reseller' }),
            c('complexity', 'Install complexity', 'select', { options: ['Low', 'Medium', 'High'] }),
            c('downtime', 'Downtime?', 'select', { options: YN }),
            c('justification', 'Business justification', 'area', { placeholder: 'Runs the 4-VM layout with headroom; dispatch DB stays responsive at month-end.' }),
            c('risk', 'Risk', 'select', { options: ['Low', 'Medium', 'High'] }),
          ],
          seed: [
            { server: 'R630 — 7XK2M13', type: 'RAM', current: '32 GB (4× 8 GB RDIMM)', proposed: '96 GB (add 4× 16 GB RDIMM 2133)', compatible: 'Confirmed', cost: '$120 used', vendor: 'Refurb reseller', complexity: 'Low', downtime: 'Yes', justification: 'Runs the 4-VM layout with headroom; dispatch DB stays responsive at month-end.', risk: 'Low' },
            { server: 'R630 — 7XK2M13', type: 'Drive', current: '4 bays empty', proposed: '2× 1 TB SAS for backup datastore', compatible: 'Needs check', cost: '$90', vendor: 'Refurb reseller', complexity: 'Low', downtime: 'No', justification: 'Local backup target so the DR plan has somewhere to restore from.', risk: 'Low' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Instructor approval',
        fields: [
          { field: 'approved', label: 'Approved', type: 'select', options: ['Yes', 'No', 'Pending'] },
          { field: 'approval_notes', label: 'Instructor notes', type: 'area', placeholder: 'RAM approved; confirm backplane before ordering drives.' },
        ],
      },
    ],
    dod: [
      { label: 'At least two upgrades are proposed with current → proposed', test: (d) => (d.groups.upgrades ?? []).filter((r) => !!r.current && !!r.proposed).length >= 2 },
      { label: 'Every row has a compatibility status and a cost', test: (d) => (d.groups.upgrades ?? []).length > 0 && (d.groups.upgrades ?? []).every((r) => !!r.compatible && !!r.cost) },
      { label: 'Every row is justified in business terms with a risk rating', test: (d) => (d.groups.upgrades ?? []).length > 0 && (d.groups.upgrades ?? []).every((r) => !!r.justification && !!r.risk) },
      { label: 'Instructor approval is recorded', test: (d) => !!d.fields.approved },
    ],
  },

  // 5 — Asset Register / CMDB ────────────────────────────────────────────────
  {
    id: 'srv_asset_register',
    feeds: ['srv_config_mgmt', 'srv_dr_plan'],
    courseId: 'server-plus',
    num: 5,
    file: '05_Asset_Register.csv',
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
    source: 'The rack plan (hardware) and everything you install (software).',
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
            c('name', 'Name', 'text', { placeholder: 'Hypervisor host' }),
            c('type', 'Type', 'select', { options: ['Server', 'Switch', 'Patch panel', 'PDU', 'UPS', 'Other'] }),
            c('model', 'Make / model', 'text', { placeholder: 'Dell PowerEdge R630' }),
            c('serial', 'Serial / service tag', 'text', { placeholder: '7XK2M13' }),
            c('location', 'Location (rack / U)', 'text', { placeholder: 'Rack A · U20–U21' }),
            c('warranty_expiry', 'Warranty expiry', 'date'),
            c('value', 'Value', 'text', { placeholder: '$1,800' }),
            c('condition', 'Condition', 'select', { options: CONDITION }),
          ],
          seed: [
            { tag: 'GP-HW-001', name: 'Hypervisor host', type: 'Server', model: 'Dell PowerEdge R630', serial: '7XK2M13', location: 'Rack A · U20–U21', warranty_expiry: '2024-04-02', value: '$1,800', condition: 'Fair' },
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
            c('host', 'Installed on', 'text', { placeholder: 'Hypervisor host' }),
            c('program', 'Program', 'text', { placeholder: 'Proxmox VE' }),
            c('version', 'Version', 'text', { placeholder: '8.2' }),
            c('type', 'Type', 'select', { options: ['Operating system', 'Hypervisor', 'Server role', 'Database', 'Application', 'Utility'] }),
            c('install_date', 'Installed', 'date'),
            c('support_end', 'Support ends', 'date'),
          ],
          seed: [
            { tag: 'GP-SW-001', host: 'Hypervisor host', program: 'Proxmox VE', version: '8.2', type: 'Hypervisor', install_date: '2026-02-17', support_end: '2027-07-31' },
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

  // 6 — Architecture & IP Plan ───────────────────────────────────────────────
  {
    id: 'srv_architecture',
    feeds: ['srv_config_mgmt', 'srv_dr_plan'],
    courseId: 'server-plus',
    num: 6,
    file: '06_Architecture_and_IP_Plan.md',
    title: 'Architecture & IP Plan',
    owner: 'net',
    shared: true,
    folder: '03_Network',
    standard: 'Architecture / topology / IPAM',
    weeks: [1, 3],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The design of the whole environment: which server roles run where, how the network is laid out, how storage and backups work — drafted in Week 1 against the business requirements, finalised with real addresses in Week 3.',
    howTo:
      'Week 1: draft the server roles, the VM layout (at least four planned VMs) and the storage/backup strategy. Week 3: describe the real physical and virtual paths and give every host its address in one place.',
    source: 'The business requirements (what it must do) and the rack plan (what it runs on).',
    buildSteps: [
      'Draft the server roles the business needs: directory, file, application, database, security/monitoring.',
      'Lay out at least four planned VMs and which role each carries.',
      'Sketch the storage strategy and where backups land.',
      'Week 3: describe the physical path — office drop → patch panel → switch → server NIC.',
      'Week 3: reserve the address ranges and give the host and every VM a row.',
      'Draw the topology diagram and note its filename here.',
    ],
    meaning:
      'The draft is judged against the requirements sheet; the final is judged against reality. Both halves of that sentence matter.',
    useIt:
      'It anchors the configuration record and the DR plan, and it is the reference for every later network change. Keep it matching reality.',
    pitfalls: [
      'An architecture with no security or monitoring role — the requirements sheet almost certainly implies one.',
      'Two devices sharing an address; the collision surfaces as an outage days later.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'roles',
          label: 'Server roles & VM layout — drafted in Week 1',
          help: 'At least four planned VMs, each in its zone: vmbr1 is the DMZ (public-facing), vmbr2 the private network. Build order says what exists by Week 2.',
          columns: [
            c('vm', 'VM name', 'text', { placeholder: 'winserver' }),
            c('role', 'Server role', 'select', { options: ['Directory services', 'File server', 'Application server', 'Database server', 'Web server', 'Security / monitoring', 'Other'] }),
            c('bridge', 'Bridge / zone', 'select', { options: ['vmbr1 — DMZ', 'vmbr2 — private'] }),
            c('os', 'OS', 'text', { placeholder: 'Windows Server 2022' }),
            c('resources', 'Planned resources', 'text', { placeholder: '2 vCPU / 4 GB / 60 GB' }),
            c('build', 'Build order', 'select', { options: ['Week 2 (core)', 'Planned — later phase'] }),
          ],
          seed: [
            { vm: 'winserver', role: 'Directory services', bridge: 'vmbr2 — private', os: 'Windows Server 2022', resources: '2 vCPU / 4 GB / 60 GB', build: 'Week 2 (core)' },
            { vm: 'linuxsrv', role: 'Database server', bridge: 'vmbr2 — private', os: 'Ubuntu Server 22.04', resources: '2 vCPU / 4 GB / 40 GB', build: 'Week 2 (core)' },
            { vm: 'websrv', role: 'Web server', bridge: 'vmbr1 — DMZ', os: 'Ubuntu Server 22.04', resources: '2 vCPU / 2 GB / 30 GB', build: 'Week 2 (core)' },
            { vm: 'secmon', role: 'Security / monitoring', bridge: 'vmbr2 — private', os: 'Ubuntu Server 22.04', resources: '2 vCPU / 6 GB / 80 GB', build: 'Planned — later phase' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Storage, backup & monitoring strategy — drafted in Week 1',
        fields: [
          { field: 'storage', label: 'Storage strategy', type: 'area', required: true, placeholder: 'RAID 5 across 4 SAS drives for VM storage; separate backup datastore on 2 added drives.' },
          { field: 'backup', label: 'Backup strategy', type: 'area', required: true, placeholder: 'Nightly VM snapshots to the backup datastore, kept 30 days per the retention requirement.' },
          { field: 'monitoring', label: 'Monitoring & security controls', type: 'area', placeholder: 'Hypervisor alerts by email; security/monitoring VM planned for a later phase; strong admin passwords, no public services.' },
        ],
      },
      {
        kind: 'fields',
        title: 'Topology — finalised in Week 3',
        fields: [
          { field: 'physical', label: 'Physical path', type: 'area', placeholder: 'Campus LAN (10.10.0.0/16) wall port → patch panel P1 → switch Gi0/1 → server NIC 1 (vmbr0, management). Later phase: NIC 2 → Cisco router + switch for vmbr2\'s internet path.' },
          { field: 'virtual', label: 'Virtual layout', type: 'area', placeholder: 'vmbr0 = management on the LAN; vmbr1 = DMZ with websrv; vmbr2 = private with winserver and the linuxsrv database — vmbr2 later maps to a physical NIC into the Cisco router (the servers\' only internet path).' },
          { field: 'diagram_file', label: 'Topology diagram file', type: 'text', placeholder: 'GranitePeak_Wk3_topology.png' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'ipplan',
          label: 'IP address plan — finalised in Week 3',
          help: 'Every host gets a row before it connects. Your Proxmox host is 10.10.30.T for team T on the 10.10.0.0/16 LAN; the DMZ/private subnets are worked examples.',
          columns: [
            c('hostname', 'Hostname', 'text', { placeholder: 'winserver' }),
            c('role', 'Role', 'text', { placeholder: 'Windows Server VM' }),
            c('ip', 'IP address', 'text', { placeholder: '192.168.0.2' }),
            c('gateway', 'Gateway', 'text', { placeholder: '192.168.0.1' }),
            c('dns', 'DNS', 'text', { placeholder: '192.168.0.2' }),
            c('assignment', 'Static / DHCP', 'select', { options: ['Static', 'DHCP'] }),
          ],
          seed: [
            { hostname: 'pve-host', role: 'Hypervisor — vmbr0 (Team 1)', ip: '10.10.30.1', gateway: '10.10.0.1', dns: '—', assignment: 'Static' },
            { hostname: 'websrv', role: 'Website — vmbr1 (DMZ)', ip: '172.16.0.10', gateway: '172.16.0.1', dns: '192.168.0.2', assignment: 'Static' },
            { hostname: 'winserver', role: 'Directory — vmbr2 (private)', ip: '192.168.0.2', gateway: '192.168.0.1', dns: 'self', assignment: 'Static' },
            { hostname: 'linuxsrv', role: 'Database — vmbr2 (private)', ip: '192.168.0.3', gateway: '192.168.0.1', dns: '192.168.0.2', assignment: 'Static' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least four VMs are laid out with a role each', test: (d) => (d.groups.roles ?? []).filter((r) => !!r.vm && !!r.role).length >= 4 },
      { label: 'The storage and backup strategies are written', test: (d) => !!(d.fields.storage && d.fields.backup) },
      { label: 'The physical and virtual layouts are described (Week 3)', test: (d) => !!(d.fields.physical && d.fields.virtual) },
      { label: 'At least three hosts have a unique address (Week 3)', test: (d) => { const ips = (d.groups.ipplan ?? []).map((r) => (r.ip ?? '').trim()).filter(Boolean); return ips.length >= 3 && new Set(ips).size === ips.length; } },
    ],
  },

  // 7 — Configuration Management Record ──────────────────────────────────────
  {
    id: 'srv_config_mgmt',
    feeds: ['srv_change_log', 'srv_dr_plan'],
    courseId: 'server-plus',
    num: 7,
    file: '07_Configuration_Management.md',
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
      'One row per system. Capture the baseline settings you set — hostname, addresses, roles, key options — and name the procedure they came from in the platform\'s configuration guide (Reference → Configuration guide). Record the value, not a description of it.',
    source: 'Every system you install and configure.',
    buildSteps: [
      'One row per configured system: the hypervisor host and each VM.',
      'Record the baseline that matters — hostname, IP, installed roles, key options.',
      'Name the configuration-guide procedure the exact build steps live in.',
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
            c('system', 'System', 'text', { placeholder: 'Hypervisor host' }),
            c('purpose', 'Purpose', 'text', { placeholder: 'Virtualization platform' }),
            c('baseline', 'Baseline configuration (values)', 'area', { placeholder: 'Hostname pve-host; vmbr0 mgmt 10.10.30.1/16; vmbr1 DMZ; vmbr2 private; no-subscription repo enabled.' }),
            c('guide_ref', 'Guide procedure for exact steps', 'text', { placeholder: 'Config guide — Install Proxmox VE and set the management address' }),
            c('evidence', 'Evidence (screenshot)', 'text', { placeholder: 'GranitePeak_Wk2_pve-config.png' }),
          ],
          seed: [
            { system: 'Hypervisor host', purpose: 'Virtualization platform', baseline: 'Hostname pve-host; vmbr0 mgmt 10.10.30.1/16 (Team 1); vmbr1 DMZ 172.16.0.1/24; vmbr2 private 192.168.0.1/24; no-subscription repo enabled.', guide_ref: 'Config guide — Install Proxmox VE and set the management address', evidence: 'GranitePeak_Wk2_pve-config.png' },
            { system: 'websrv VM', purpose: 'Public-facing website (DMZ)', baseline: '2 vCPU / 2 GB / 30 GB; static 172.16.0.10 on vmbr1, gw 172.16.0.1, DNS 192.168.0.2; packages: nginx.', guide_ref: 'Config guide — Publish the website on websrv with NGINX', evidence: 'GranitePeak_Wk2_websrv-nginx.png' },
            { system: 'winserver VM', purpose: 'Directory, DNS, DHCP', baseline: '2 vCPU / 4 GB / 60 GB; static 192.168.0.2 on vmbr2, gw 192.168.0.1, DNS 127.0.0.1; roles: AD DS, DNS, DHCP.', guide_ref: 'Config guide — Promote winserver to a domain controller for teamX.local', evidence: 'GranitePeak_Wk2_win-roles.png' },
            { system: 'linuxsrv VM', purpose: 'Database', baseline: '2 vCPU / 4 GB / 40 GB; static 192.168.0.3 on vmbr2, gw 192.168.0.1, DNS 192.168.0.2; packages: mariadb-server.', guide_ref: 'Config guide — Install MariaDB and create capstone_db on linuxsrv', evidence: 'GranitePeak_Wk2_linux-svc.png' },
          ],
        },
      },
    ],
    dod: [
      { label: 'All four systems are recorded — the host, websrv, winserver and linuxsrv', test: (d) => (d.groups.systems ?? []).filter((r) => !!r.system).length >= 4 },
      { label: 'Every system has a baseline configuration with real values', test: (d) => (d.groups.systems ?? []).length > 0 && (d.groups.systems ?? []).every((r) => !!r.baseline) },
      { label: 'Every system points to its guide procedure and evidence', test: (d) => (d.groups.systems ?? []).length > 0 && (d.groups.systems ?? []).every((r) => !!r.guide_ref && !!r.evidence) },
    ],
  },

  // 8 — Patch Management Log ─────────────────────────────────────────────────
  {
    id: 'srv_patch_mgmt',
    feeds: ['srv_change_log'],
    courseId: 'server-plus',
    num: 8,
    file: '08_Patch_Management.csv',
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
            c('system', 'System', 'text', { placeholder: 'Hypervisor host' }),
            c('baseline', 'Starting patch level', 'text', { placeholder: '8.2, kernel 6.8' }),
            c('schedule', 'Update schedule', 'select', { options: ['Weekly', 'Monthly', 'Quarterly', 'On release', 'Manual'] }),
            c('rollback', 'Rollback method', 'select', { options: ['VM snapshot', 'System restore point', 'Full backup', 'None'] }),
            c('applied', 'Patches applied', 'text', { placeholder: 'apt full-upgrade — 42 packages' }),
            c('date', 'Date applied', 'date'),
            c('result', 'Result', 'select', { options: ['Success', 'Rolled back', 'Pending'] }),
          ],
          seed: [
            { system: 'Hypervisor host', baseline: '8.2, kernel 6.8', schedule: 'Monthly', rollback: 'Full backup', applied: 'apt full-upgrade — 42 packages', date: '2026-03-09', result: 'Success' },
            { system: 'winserver VM', baseline: '2022 21H2, no updates', schedule: 'Monthly', rollback: 'VM snapshot', applied: 'Windows Update — March cumulative', date: '2026-03-09', result: 'Success' },
            { system: 'linuxsrv VM', baseline: '22.04, base install', schedule: 'Monthly', rollback: 'VM snapshot', applied: 'apt upgrade — 30 packages', date: '2026-03-09', result: 'Success' },
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

  // 9 — Change Log ───────────────────────────────────────────────────────────
  {
    id: 'srv_change_log',
    feeds: ['srv_as_built'],
    courseId: 'server-plus',
    num: 9,
    file: '09_Change_Log.csv',
    title: 'Change Log',
    owner: 'mgmt',
    shared: true,
    folder: '00_Planning',
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
            c('why', 'Why', 'text', { placeholder: 'Physical install per the rack plan' }),
            c('result', 'Result', 'text', { placeholder: 'Racked, cabled and powered; front panel lit' }),
            c('rollback', 'Rollback', 'text', { placeholder: 'Unrack and return to staging' }),
          ],
          seed: [
            { datetime: '2026-02-17 09:20', change: 'Mounted the R630 in Rack A, U20–U21', why: 'Physical install per the rack plan', result: 'Racked on rails, cable-managed', rollback: 'Unrack and return to staging' },
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

  // 10 — DR Plan (RTO / RPO / MTTR) ──────────────────────────────────────────
  {
    id: 'srv_dr_plan',
    feeds: ['srv_as_built'],
    courseId: 'server-plus',
    num: 10,
    file: '10_DR_Plan.md',
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
            { system: 'winserver — directory/DNS/DHCP', impact: 'Nothing resolves; no addresses issued', rto: '4 hours', rpo: '24 hours', mttr: '2 hours', restore: 'Restore the VM snapshot; confirm the DNS zone and DHCP scope from the configuration record.' },
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
          { field: 'rto_met', label: 'RTO met?', type: 'select', options: YN },
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

  // 11 — As-Built Handover Package — THE CAPSTONE ────────────────────────────
  {
    id: 'srv_as_built',
    capstone: true,
    courseId: 'server-plus',
    num: 11,
    file: '11_As_Built.md',
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
      'List the findings and recommendations, including the planned-but-not-built VMs.',
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
            c('document', 'Document', 'text', { placeholder: 'Rack Plan & Cabling Record' }),
            c('version', 'Version', 'text', { placeholder: '1.0' }),
            c('current', 'Matches reality?', 'select', { options: ['Yes', 'No — needs update'] }),
            c('pdf', 'Exported to PDF?', 'select', { options: YN }),
          ],
          seed: [
            { document: 'Business Requirements Sheet', version: '1.0', current: 'Yes', pdf: 'Yes' },
            { document: 'Rack Plan & Cabling Record', version: '1.1', current: 'Yes', pdf: 'Yes' },
            { document: 'Server Hardware Discovery Sheet', version: '1.0', current: 'Yes', pdf: 'Yes' },
            { document: 'Upgrade Planning Sheet', version: '1.0', current: 'Yes', pdf: 'Yes' },
            { document: 'Asset Register', version: '1.1', current: 'Yes', pdf: 'Yes' },
            { document: 'Architecture & IP Plan', version: '1.1', current: 'Yes', pdf: 'Yes' },
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
          { field: 'what_they_have', label: 'What the client now has', type: 'area', required: true, placeholder: 'A rack-mounted server in a 24U rack running Proxmox with a Windows and a Linux VM for the portal and dispatch database, cabled and documented.' },
          { field: 'how_to_operate', label: 'How they operate it without you', type: 'area', required: true, placeholder: 'Every setting is in the configuration record; patch and change logs show what has been maintained; the DR plan says how to recover.' },
          { field: 'recommendations', label: 'Findings & recommendations', type: 'area', required: true, placeholder: 'The server is out of warranty; the file-server and monitoring VMs are planned but not yet built; there is no offsite backup copy yet.' },
          { field: 'handover_date', label: 'Handover date', type: 'date', required: true },
          { field: 'signoff', label: 'Client sign-off', type: 'signature', required: true, placeholder: 'Client representative name' },
        ],
      },
      custodySection({
        label: 'Evidence appendix — log every photo & screenshot you hand over',
        seed: [
          { evidence_id: 'E-01', description: 'GranitePeak_Wk2_rack-front.jpg', collected_by: 'Technician', collected_at: '2026-02-17 15:00', location: '08_Evidence/', sha256: 'from sha256sum GranitePeak_Wk2_rack-front.jpg', transferred_to: 'Client', transferred_at: '2026-03-12 15:00', notes: 'Rack photo, handed over at closeout' },
        ],
      }),
    ],
    dod: [
      { label: 'At least nine documents are checked into the package', test: (d) => (d.groups.contents ?? []).filter((r) => !!r.document).length >= 9 },
      { label: 'Every document matches reality and is exported to PDF', test: (d) => (d.groups.contents ?? []).length > 0 && (d.groups.contents ?? []).every((r) => r.current === 'Yes' && r.pdf === 'Yes') },
      { label: 'The client summary and recommendations are written', test: (d) => !!(d.fields.what_they_have && d.fields.how_to_operate && d.fields.recommendations) },
      { label: 'Handover is dated and signed off', test: (d) => !!(d.fields.handover_date && d.fields.signoff) },
      { label: 'Every handover artifact is logged (chain of custody)', test: (d) => everyEvidenceHashed()(d) },
    ],
  },
];

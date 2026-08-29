import { Column } from '../grc/templates';
import { DeliverableDef } from './types';
import { custodySection, everyEvidenceHashed } from './custodyTemplate';

/**
 * Client deliverables for the CompTIA Server+ capstone.
 *
 * THE SCENARIO. You are the only IT person at a small startup. Nothing is
 * organised: no topology, no asset list, no documentation, no procedures. You
 * are handed a second-hand server that does not POST. You diagnose it, get it
 * running, build the platform on it, and leave behind the records and SOPs the
 * company never had.
 *
 * WHY SIX FORMS. There were eleven, and the paperwork had outgrown the
 * engineering — students spent the hour filling boxes instead of at the
 * machine. Six, each matching one artifact a real IT department actually keeps:
 *
 *   1 Architecture Brief & IP Plan   what the business needs, and the design
 *   2 Hardware Discovery, HCL …      what the metal is, and what it can run
 *   3 Server Bring-Up Log            POST fault → RAID → hypervisor
 *   4 Rack, Power & Asset Register   where it lives and what we own
 *   5 Operations Log & SOPs          how it is run, by written procedure
 *   6 DR Plan & As-Built Handover    how it recovers, and the handover  ← capstone
 *
 * The business half is deliberately SMALL. It is a startup, not an enterprise:
 * five fields of context, then the effort goes into defining the architecture
 * clearly. Specifications are interesting only because of what they serve.
 *
 * WRITTEN FOR STUDENTS WHO ARE NOT TECHNICAL YET. They learn these systems by
 * doing this. So every field carries `help` naming the literal command or menu
 * path that produces the value, `placeholder` showing a real example, and every
 * table a seeded worked row. The guidance panel (buildSteps / meaning / useIt /
 * pitfalls) carries the SOP for the document itself. None of that is decoration:
 * a form that assumes you already know the answer teaches nobody.
 *
 * Every student runs the whole engagement on their own server and fills EVERY
 * form — that is `shared: true`. `owner` is the focus role that leads that
 * record (and the lane the chain diagram draws it in), never a lock on who may
 * open it. Nothing waits on anyone else.
 *
 * Course-scoped (`courseId: 'server-plus'`) so these never surface on another
 * course. The set drains into `srv_as_built`, the handover package.
 */

// Local column helper (mirrors the one in definitions.ts; kept local to avoid a
// circular import, since definitions.ts imports this file).
const c = (
  field: string,
  label: string,
  type: Column['type'],
  extra: Partial<Column> = {}
): Column => ({ field, label, type, ...extra });

const YN = ['Yes', 'No'];
const ZONES = ['vmbr1 — DMZ', 'vmbr2 — private', 'vmbr0 — management'];
/** The verdict language an HCL actually uses. */
const HCL_VERDICT = ['Supported', 'Works with caveats', 'Unsupported', 'Not yet tested'];

export const SERVER_PLUS_DELIVERABLES: DeliverableDef[] = [
  // 1 — Architecture Brief & IP Plan ─────────────────────────────────────────
  // Keeps the id `srv_business_reqs` and its client/industry/industry_other
  // fields: the course overview's TeamBusinessPicker reads and writes them
  // directly, and the topology diagram's "Building for:" chip depends on them.
  {
    id: 'srv_business_reqs',
    feeds: ['srv_hardware', 'srv_rack_assets'],
    courseId: 'server-plus',
    num: 1,
    file: '01_Architecture_Brief.md',
    title: 'Architecture Brief & IP Plan',
    owner: 'net',
    shared: true,
    folder: '00_Planning',
    standard: 'Architecture definition & addressing',
    weeks: [1, 3],
    kind: 'template',
    exportFormat: 'md',
    purpose:
      'What the startup needs, and the architecture that delivers it. Five lines of business context, then the design itself: which machines exist, which network zone each belongs in, and what address each one answers on.',
    howTo:
      'Week 1: fill the context and draft the machine list — what you INTEND to build. Week 3: come back and correct it to what you actually built, then fill the addressing table from the running system.',
    buildSteps: [
      'Context first, briefly: who the company is, what it sells, how many staff, and what it needs computers to do.',
      'List the services the business actually needs — a website, a shared database, file storage, user logins.',
      'Turn each service into a machine: give it a hostname, an operating system, and a job.',
      'Put each machine in a zone: DMZ (vmbr1) if the public reaches it, private (vmbr2) if only staff do.',
      'Give each machine an address inside its zone, and record the gateway for that zone.',
      'In Week 3, verify every address against the running machine before you call this final.',
    ],
    meaning:
      'A good architecture can be read aloud: "the website is public so it sits in the DMZ; the database is not, so it sits private and only the website reaches it." If a machine is in a zone you cannot justify in one sentence, it is in the wrong zone.',
    useIt:
      'It tells you what to build in Week 2, what to address in Week 3, and it is the first page of the handover package.',
    pitfalls: [
      'Designing an enterprise for a startup. Four machines that work beat twelve that are imaginary.',
      'Putting the database in the DMZ because it was easier. Zones exist to limit what an attacker reaches next.',
      'Leaving Week 1 guesses in place at handover. As-built means the addresses that are really configured.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The startup — keep this short',
        fields: [
          {
            field: 'client',
            label: 'Company name',
            type: 'text',
            required: true,
            placeholder: 'Granite Peak Outfitters',
            help: 'Invent one, or use the business your team agreed on. This also names your topology diagram on the course overview.',
          },
          {
            field: 'industry',
            label: 'Industry',
            type: 'select',
            options: ['Manufacturing', 'Healthcare', 'Retail', 'MSP / IT services', 'Logistics', 'Professional services', 'Other'],
            help: 'Roughly what the company does. It shapes what data matters and how bad downtime is.',
          },
          {
            field: 'industry_other',
            label: 'If Other — describe the business',
            type: 'text',
            placeholder: 'A regional veterinary clinic chain',
            help: 'Only needed if you chose Other above.',
          },
          {
            field: 'employees',
            label: 'Staff',
            type: 'text',
            required: true,
            placeholder: '18',
            help: 'How many people will use these systems. It sets how many accounts and how much storage you plan for.',
          },
          {
            field: 'needs',
            label: 'What the business needs computers to do',
            type: 'area',
            required: true,
            placeholder: 'Sell online, keep customer and order records, share files internally, and give every member of staff a login.',
            help: 'Plain language, two or three sentences. Every machine you build below has to trace back to something on this line.',
          },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'machines',
          label: 'The machines — your architecture',
          help: 'One row per virtual machine. The four seeded rows are the base build every team creates; add rows for the machines YOUR business needs. Public-facing goes in the DMZ, internal goes private.',
          columns: [
            c('hostname', 'Hostname', 'text', { placeholder: 'websrv' }),
            c('os', 'Operating system', 'text', { placeholder: 'Ubuntu Server 24.04' }),
            c('job', 'What it does', 'text', { placeholder: 'Public website (NGINX)' }),
            c('zone', 'Zone', 'select', { options: ZONES }),
            c('why_zone', 'Why that zone', 'text', { placeholder: 'The public must reach it, so it is isolated from internal systems' }),
            c('serves', 'Which business need it serves', 'text', { placeholder: 'Sell online' }),
          ],
          seed: [
            { hostname: 'websrv', os: 'Ubuntu Server 24.04', job: 'Public website (NGINX)', zone: 'vmbr1 — DMZ', why_zone: 'Reachable from outside, so it is kept away from internal systems', serves: 'Sell online' },
            { hostname: 'winserver', os: 'Windows Server 2022', job: 'AD DS, DNS and DHCP — staff logins', zone: 'vmbr2 — private', why_zone: 'Holds every user account; must never be reachable from outside', serves: 'Give every member of staff a login' },
            { hostname: 'linuxsrv', os: 'Ubuntu Server 24.04', job: 'MariaDB — customer and order records', zone: 'vmbr2 — private', why_zone: 'Business data; only the website reaches it, never the public', serves: 'Keep customer and order records' },
            { hostname: 'secmon', os: 'Ubuntu Server 24.04', job: 'Monitoring (optional, advanced)', zone: 'vmbr2 — private', why_zone: 'Watches the other machines; no reason to expose it', serves: 'Know when something breaks' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'ipplan',
          label: 'Addressing — fill from the running system in Week 3',
          help: 'One row per address you actually configured. Check each against the machine before writing it here: `ip a` on Linux, `ipconfig /all` on Windows.',
          columns: [
            c('hostname', 'Hostname', 'text', { placeholder: 'websrv' }),
            c('zone', 'Zone', 'select', { options: ZONES }),
            c('address', 'IP address / mask', 'text', { placeholder: '172.16.0.10/24' }),
            c('gateway', 'Gateway', 'text', { placeholder: '172.16.0.1' }),
            c('verified', 'Verified on the machine?', 'select', { options: YN }),
          ],
          seed: [
            { hostname: 'pve-host', zone: 'vmbr0 — management', address: '10.10.30.1/16', gateway: '10.10.0.1', verified: 'Yes' },
            { hostname: 'websrv', zone: 'vmbr1 — DMZ', address: '172.16.0.10/24', gateway: '172.16.0.1', verified: 'Yes' },
            { hostname: 'winserver', zone: 'vmbr2 — private', address: '192.168.0.2/24', gateway: '192.168.0.1', verified: 'Yes' },
            { hostname: 'linuxsrv', zone: 'vmbr2 — private', address: '192.168.0.3/24', gateway: '192.168.0.1', verified: 'Yes' },
          ],
        },
      },
    ],
    dod: [
      { label: 'The company, staff count and what it needs are written down', test: (d) => !!(d.fields.client && d.fields.employees && d.fields.needs) },
      { label: 'At least four machines are designed, each with a zone', test: (d) => (d.groups.machines ?? []).filter((r) => !!r.hostname && !!r.zone).length >= 4 },
      { label: 'Every machine justifies its zone and names the need it serves', test: (d) => (d.groups.machines ?? []).length > 0 && (d.groups.machines ?? []).every((r) => !!r.why_zone && !!r.serves) },
      { label: 'At least four addresses are planned with a gateway (Week 3)', test: (d) => (d.groups.ipplan ?? []).filter((r) => !!r.address && !!r.gateway).length >= 4 },
      { label: 'Every address has been verified on the running machine', test: (d) => (d.groups.ipplan ?? []).length > 0 && (d.groups.ipplan ?? []).every((r) => r.verified === 'Yes') },
    ],
  },

  // 2 — Hardware Discovery, HCL & Upgrade Plan ───────────────────────────────
  {
    id: 'srv_hardware',
    feeds: ['srv_bringup', 'srv_rack_assets'],
    courseId: 'server-plus',
    num: 2,
    file: '02_Hardware_and_HCL.csv',
    title: 'Hardware Discovery, HCL & Upgrade Plan',
    owner: 'lnx',
    shared: true,
    folder: '01_Physical',
    standard: 'Hardware audit & compatibility validation',
    weeks: [1],
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'What this machine actually IS, whether the software you plan to run actually SUPPORTS it, and what has to be fixed or bought before the design works. Three questions every technician answers before installing anything.',
    howTo:
      'Boot the server from a live USB (or use the BIOS screens if it will not boot yet) and run the command in each field\'s hint. Record what the machine reports, not what the model\'s spec sheet claims — second-hand servers rarely match their brochure.',
    source: 'The machine itself: BIOS/UEFI screens, and Linux commands from a live USB.',
    buildSteps: [
      'Identify the machine: manufacturer, model and serial (on the pull-out tag at the front).',
      'Run the discovery commands and record what each one reports.',
      'For every component that matters — CPU, RAM, storage controller, NIC — decide whether your hypervisor and OS support it, and write down the evidence.',
      'Anything unsupported or marginal becomes a row in the gaps table with a proposed fix.',
      'Price the fixes, rank them, and get instructor approval before assuming any of them.',
    ],
    meaning:
      'An HCL — Hardware Compatibility List — is the check that stops a build failing halfway. "The RAID card has no driver in this kernel" is a five-minute discovery now, or a lost afternoon in Week 2. The gap between installed and maximum is your upgrade headroom.',
    useIt:
      'It decides what you can build: virtualization flags decide whether the hypervisor works at all, and RAM headroom decides how many VMs you can run. It feeds the bring-up log and the asset register.',
    pitfalls: [
      'Copying the spec sheet instead of reading the machine.',
      'Recording that VT-x "is supported" when it is switched off in the BIOS. Supported and enabled are different facts — the hypervisor only cares about the second.',
      'Marking a component Supported with no evidence. A vendor list or a loaded kernel module is evidence; an assumption is not.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'discovery',
          label: 'Discovery — what is in the box',
          help: 'Run each command from a live USB and paste what it tells you. If the machine will not boot yet, read the same values off the BIOS/UEFI screens.',
          columns: [
            c('component', 'Component', 'text', { placeholder: 'CPU' }),
            c('command', 'How you found it', 'text', { placeholder: 'lscpu' }),
            c('found', 'What the machine reports', 'text', { placeholder: '2× Xeon E5-2640 v3 — 16 cores / 32 threads' }),
            c('notes', 'Notes', 'text', { placeholder: 'Both sockets populated' }),
          ],
          seed: [
            { component: 'CPU model & cores', command: 'lscpu', found: '2× Xeon E5-2640 v3 — 16C / 32T', notes: 'Both sockets populated' },
            { component: 'Virtualization extensions', command: 'lscpu | grep -i virt', found: 'VT-x present and enabled', notes: 'Had to enable it in BIOS first' },
            { component: 'IOMMU (PCIe passthrough)', command: 'dmesg | grep -i -e DMAR -e IOMMU', found: 'DMAR: IOMMU enabled', notes: 'Needed only for passthrough' },
            { component: 'Memory size, type & ECC', command: 'sudo dmidecode -t memory', found: '32 GB RDIMM ECC — 4 of 24 slots used', notes: '768 GB maximum, so plenty of headroom' },
            { component: 'Disks & bays', command: 'lsblk -o NAME,SIZE,MODEL,ROTA', found: '4× 600 GB SAS 10k, 8 bays total', notes: 'ROTA=1 means spinning disk' },
            { component: 'RAID / HBA controller', command: 'lspci -nnk | grep -iA3 raid', found: 'Dell PERC H730 Mini', notes: 'Driver megaraid_sas in use' },
            { component: 'Network cards & driver', command: 'lspci -nnk | grep -iA3 ethernet', found: '4× 1GbE Broadcom NetXtreme', notes: 'Driver tg3 in use' },
            { component: 'BIOS / firmware version', command: 'sudo dmidecode -t bios', found: 'BIOS 2.19.0, dated 2023-06', notes: 'Two releases behind current' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'hcl',
          label: 'HCL — will the software support this hardware?',
          help: 'One row per component that has to work with your hypervisor or OS. Evidence means a vendor compatibility page, or the kernel module actually loaded — check with `lsmod`.',
          columns: [
            c('component', 'Component', 'text', { placeholder: 'Dell PERC H730 Mini (RAID)' }),
            c('target', 'Must work with', 'text', { placeholder: 'Proxmox VE 8' }),
            c('driver', 'Driver / kernel module', 'text', { placeholder: 'megaraid_sas' }),
            c('evidence', 'Evidence', 'text', { placeholder: 'Listed on the Proxmox hardware wiki; lsmod shows it loaded' }),
            c('verdict', 'Verdict', 'select', { options: HCL_VERDICT }),
          ],
          seed: [
            { component: 'Dell PERC H730 Mini (RAID)', target: 'Proxmox VE 8', driver: 'megaraid_sas', evidence: 'Proxmox hardware wiki; lsmod shows module loaded', verdict: 'Supported' },
            { component: 'Broadcom NetXtreme 1GbE', target: 'Proxmox VE 8', driver: 'tg3', evidence: 'lspci -nnk shows "Kernel driver in use: tg3"', verdict: 'Supported' },
            { component: 'Xeon E5-2640 v3 — VT-x', target: 'Proxmox VE 8 (KVM)', driver: 'kvm_intel', evidence: 'lscpu reports vmx; enabled in BIOS', verdict: 'Supported' },
            { component: 'Onboard SATA DVD', target: 'Proxmox VE 8', driver: 'ahci', evidence: 'Detected, but no longer needed by the build', verdict: 'Works with caveats' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'gaps',
          label: 'Gaps & upgrade plan — what must change before this works',
          help: 'One row per problem the discovery found: unsupported parts, stale firmware, too little RAM for the machines you designed. Price it and rank it — you are asking someone to spend money.',
          columns: [
            c('gap', 'What is wrong', 'text', { placeholder: 'Only 32 GB RAM for four planned VMs' }),
            c('impact', 'What it blocks', 'text', { placeholder: 'Cannot run the Windows VM and the database comfortably at once' }),
            c('fix', 'Proposed fix', 'text', { placeholder: 'Add 4× 16 GB RDIMM to reach 96 GB' }),
            c('cost', 'Cost', 'text', { placeholder: '$180 used' }),
            c('priority', 'Priority', 'select', { options: ['Blocker', 'High', 'Medium', 'Low'] }),
          ],
          seed: [
            { gap: 'BIOS two releases behind', impact: 'Known memory-training bug on this generation', fix: 'Flash BIOS to current before installing', cost: '$0', priority: 'High' },
            { gap: 'Only 32 GB RAM for four planned VMs', impact: 'Windows VM and database will contend for memory', fix: 'Add 4× 16 GB RDIMM to reach 96 GB', cost: '$180 used', priority: 'Medium' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Sign-off',
        fields: [
          {
            field: 'approved',
            label: 'Instructor approval of the upgrade plan',
            type: 'text',
            required: true,
            placeholder: 'Approved by J. Rivera — 2026-02-10',
            help: 'Show your gaps table to your instructor before assuming any purchase. Real upgrade plans are approved, not announced.',
          },
        ],
      },
    ],
    dod: [
      { label: 'CPU, memory, storage and network are all discovered', test: (d) => (d.groups.discovery ?? []).filter((r) => !!r.component && !!r.found).length >= 6 },
      { label: 'Virtualization extensions are recorded as present and enabled', test: (d) => (d.groups.discovery ?? []).some((r) => /virt|vt-x|vt_x|amd-v/i.test(r.component ?? '') && !!r.found) },
      { label: 'At least one NIC and one storage controller have a compatibility verdict', test: (d) => {
        const rows = d.groups.hcl ?? [];
        const has = (re: RegExp) => rows.some((r) => re.test(`${r.component ?? ''}`) && !!r.verdict);
        return has(/nic|ethernet|network/i) && has(/raid|hba|storage|sas|sata/i);
      } },
      { label: 'Every HCL row carries evidence, not an assumption', test: (d) => (d.groups.hcl ?? []).length > 0 && (d.groups.hcl ?? []).every((r) => !!r.evidence && !!r.verdict) },
      { label: 'Every gap has a proposed fix and a priority', test: (d) => (d.groups.gaps ?? []).length > 0 && (d.groups.gaps ?? []).every((r) => !!r.fix && !!r.priority) },
      { label: 'The upgrade plan is approved by the instructor', test: (d) => !!d.fields.approved },
    ],
  },

  // 3 — Server Bring-Up Log ──────────────────────────────────────────────────
  {
    id: 'srv_bringup',
    feeds: ['srv_operations', 'srv_rack_assets'],
    courseId: 'server-plus',
    num: 3,
    file: '03_Server_Bring_Up.md',
    title: 'Server Bring-Up Log',
    owner: 'win',
    shared: true,
    folder: '02_BringUp',
    standard: 'Troubleshooting method, RAID & hypervisor build record',
    weeks: [1, 2],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'The machine arrives dead. This is the record of bringing it back: what was wrong, how you proved it, the array you built on it, and the hypervisor you installed. It is also where you practise the troubleshooting method properly.',
    howTo:
      'Work the method in order — symptom, theory, test the theory, fix, verify, document — and log every attempt, including the theories that turned out to be wrong. A log with no failed theories in it is a log nobody believes.',
    source: 'The server itself: POST behaviour, beep/LED codes, BIOS screens, RAID utility, installer.',
    buildSteps: [
      'Describe the symptom exactly: no video? fans spin and stop? a beep pattern? a blinking amber LED?',
      'Look the code up for THAT vendor and write down what it means.',
      'Form one theory and change ONE thing to test it. Changing three things teaches you nothing.',
      'Strip to minimum boot if you are stuck: one CPU, one stick of RAM in the first slot, no drives, no cards.',
      'Once it posts: set boot mode, boot order, and turn on the virtualization extensions.',
      'Build the RAID array and write down WHY you chose that level.',
      'Install Proxmox, give it its management address, and prove you can reach the console.',
    ],
    meaning:
      'The method matters more than the fix. Anyone can reseat RAM; a technician can say which symptom pointed there, what they ruled out, and how they proved it was fixed. That reasoning is what the log records.',
    useIt:
      'It becomes the machine\'s history — the first thing the next technician reads when it misbehaves — and it feeds the asset register and the operations log.',
    pitfalls: [
      'Changing several things at once, then not knowing which one worked.',
      'Deleting the failed attempts before handing the log in. They are the evidence you followed a method.',
      'Choosing RAID 5 because it sounds sensible. State the trade-off you accepted: capacity, redundancy, or rebuild time.',
      'Forgetting to enable virtualization in the BIOS — it surfaces later as a hypervisor that refuses to start VMs.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'post',
          label: 'POST fault log — one row per attempt',
          help: 'Keep the rows that did not work. Working through a wrong theory and ruling it out is the method doing its job.',
          columns: [
            c('symptom', 'Symptom observed', 'text', { placeholder: 'Fans spin at full speed, no video, amber status LED' }),
            c('code', 'Beep / LED code & meaning', 'text', { placeholder: 'Amber 1-3 — memory not detected (Dell)' }),
            c('theory', 'Theory', 'text', { placeholder: 'A DIMM is unseated or dead' }),
            c('action', 'What you changed (one thing)', 'text', { placeholder: 'Reseated all four DIMMs' }),
            c('result', 'Result', 'select', { options: ['Fixed it', 'No change — theory wrong', 'Partly — new symptom'] }),
          ],
          seed: [
            { symptom: 'Fans full speed, no video, amber LED', code: 'Amber 1-3 — memory not detected (Dell)', theory: 'A DIMM is unseated or dead', action: 'Reseated all four DIMMs', result: 'No change — theory wrong' },
            { symptom: 'Fans full speed, no video, amber LED', code: 'Amber 1-3 — memory not detected (Dell)', theory: 'One dead DIMM is stopping the whole bank', action: 'Minimum boot: one DIMM in slot A1 only', result: 'Fixed it' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'BIOS / UEFI baseline — set these before installing anything',
        fields: [
          { field: 'bios_before', label: 'Firmware version on arrival', type: 'text', placeholder: 'BIOS 2.19.0 (2023-06)', help: 'From the BIOS splash screen, or `sudo dmidecode -t bios`.' },
          { field: 'bios_after', label: 'Firmware version after updating', type: 'text', placeholder: 'BIOS 2.22.1 (2025-02)', help: 'Leave blank if you did not update — but say why in the gaps table of the hardware sheet.' },
          { field: 'boot_mode', label: 'Boot mode', type: 'select', options: ['UEFI', 'Legacy BIOS'], help: 'UEFI for a modern install. Changing this later usually means reinstalling.' },
          { field: 'boot_order', label: 'Boot order set to', type: 'text', placeholder: 'RAID array first, then USB', help: 'After installing, the array must come first or the server boots the installer again.' },
          { field: 'virt_enabled', label: 'Virtualization extensions enabled?', type: 'select', options: YN, required: true, help: 'Intel VT-x / AMD-V. Usually under Processor Settings. Without this the hypervisor cannot run VMs.' },
          { field: 'virt_where', label: 'Where that setting lives', type: 'text', placeholder: 'System BIOS → Processor Settings → Virtualization Technology', help: 'Write the menu path down — the next technician will need it.' },
        ],
      },
      {
        kind: 'fields',
        title: 'RAID array',
        fields: [
          { field: 'raid_controller', label: 'Controller', type: 'text', placeholder: 'Dell PERC H730 Mini', help: 'Enter its configuration utility during POST — usually Ctrl+R, watch the screen for the prompt.' },
          { field: 'raid_level', label: 'RAID level chosen', type: 'select', options: ['RAID 0', 'RAID 1', 'RAID 5', 'RAID 6', 'RAID 10'], required: true, help: 'RAID 1 mirrors two disks. RAID 5 survives one failure with less wasted space. RAID 10 is fastest to rebuild.' },
          { field: 'raid_why', label: 'Why that level', type: 'area', required: true, placeholder: 'RAID 10 across four 600 GB SAS disks: this is the only server, so a rebuild has to be fast and cannot slow the VMs down. I traded capacity for that.', help: 'Name the trade-off you accepted. Every RAID level gives up something.' },
          { field: 'raid_members', label: 'Member disks', type: 'text', placeholder: '4× 600 GB SAS 10k, bays 0–3', help: 'Which physical disks joined the array.' },
          { field: 'raid_spare', label: 'Hot spare', type: 'select', options: ['Yes — one assigned', 'No — none available', 'No — deliberate choice'], help: 'A hot spare rebuilds automatically without anyone visiting the rack.' },
          { field: 'raid_verified', label: 'How you verified the array is healthy', type: 'text', required: true, placeholder: 'Controller utility shows the virtual disk Optimal after initialisation completed', help: 'An array that exists is not the same as an array that is healthy.' },
        ],
      },
      {
        kind: 'fields',
        title: 'Hypervisor install',
        fields: [
          { field: 'hv_version', label: 'Proxmox version installed', type: 'text', required: true, placeholder: 'Proxmox VE 8.2', help: 'From the installer, or `pveversion` once it is up.' },
          { field: 'hv_target', label: 'Installed onto', type: 'text', placeholder: 'The RAID 10 virtual disk', help: 'Not a USB stick and not a single disk — the array you just built.' },
          { field: 'hv_hostname', label: 'Hostname', type: 'text', placeholder: 'pve-host', help: 'Set during installation. Renaming a Proxmox host afterwards is painful.' },
          { field: 'hv_address', label: 'Management address', type: 'text', required: true, placeholder: '10.10.30.1/16', help: 'Follow the team rule: 10.10.30.T where T is your team number.' },
          { field: 'hv_bridges', label: 'Bridges created', type: 'text', placeholder: 'vmbr0 management, vmbr1 DMZ, vmbr2 private', help: 'The virtual switches your VMs will attach to.' },
          { field: 'hv_proof', label: 'Proof it works', type: 'text', required: true, placeholder: 'Reached https://10.10.30.1:8006 from the classroom LAN and logged in', help: 'Reaching the web console from another machine is the proof.' },
        ],
      },
    ],
    dod: [
      { label: 'At least one POST fault is worked through to a verified fix', test: (d) => (d.groups.post ?? []).some((r) => r.result === 'Fixed it') },
      { label: 'The log keeps the reasoning: symptom, theory and action on every row', test: (d) => (d.groups.post ?? []).length > 0 && (d.groups.post ?? []).every((r) => !!r.symptom && !!r.theory && !!r.action) },
      { label: 'Virtualization extensions are enabled and the menu path recorded', test: (d) => d.fields.virt_enabled === 'Yes' && !!d.fields.virt_where },
      { label: 'The RAID level is chosen and the trade-off justified in writing', test: (d) => !!(d.fields.raid_level && d.fields.raid_why) },
      { label: 'The array is verified healthy', test: (d) => !!d.fields.raid_verified },
      { label: 'The hypervisor is installed and reachable on its management address', test: (d) => !!(d.fields.hv_version && d.fields.hv_address && d.fields.hv_proof) },
    ],
  },

  // 4 — Rack, Power & Asset Register ─────────────────────────────────────────
  {
    id: 'srv_rack_assets',
    feeds: ['srv_operations'],
    courseId: 'server-plus',
    num: 4,
    file: '04_Rack_and_Assets.csv',
    title: 'Rack, Power & Asset Register',
    owner: 'net',
    shared: true,
    folder: '03_Physical',
    standard: 'Physical installation & asset inventory',
    weeks: [2],
    kind: 'form',
    exportFormat: 'csv',
    purpose:
      'Where the equipment physically lives, how it is powered and cabled, and a list of everything the company owns. The two questions a lone admin cannot answer without this: what do we have, and which cable is that?',
    howTo:
      'Rack the server, label both ends of every cable as you run it, then write down what you did. Then walk the room and list every asset — including the virtual machines, which are assets too.',
    buildSteps: [
      'Record the rack: how many U, which way the air flows, how it is powered.',
      'Place each device at its U position, heaviest at the bottom.',
      'Leave at least 20% of the rack free — you will need it within a year.',
      'Label both ends of every cable before you plug it in, and log it.',
      'List every asset: physical machines, virtual machines, network gear, and licences.',
    ],
    meaning:
      'An asset register is the answer to "what do we actually own?" — the question nobody at a startup can answer, and the one an auditor, an insurer or your replacement asks first. The cable schedule is what makes the next change safe.',
    useIt:
      'It feeds the operations log (you can only change what you know you have) and the handover package.',
    pitfalls: [
      'Labelling one end of a cable. The unlabelled end is the one you will be holding.',
      'Filling the rack completely because it fits today.',
      'Listing only physical machines. The VMs are assets — they hold the data.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'The rack',
        fields: [
          { field: 'rack_id', label: 'Rack identifier', type: 'text', required: true, placeholder: 'Rack A — server room', help: 'Name it so a cable label can refer to it.' },
          { field: 'rack_units', label: 'Size', type: 'text', placeholder: '24U', help: 'Count the mounting holes in threes if the rack is not marked.' },
          { field: 'airflow', label: 'Airflow direction', type: 'text', placeholder: 'Front-to-back; cold aisle at the front', help: 'Every device must pull air the same way or they heat each other.' },
          { field: 'power', label: 'Power arrangement', type: 'text', required: true, placeholder: '8-outlet PDU on a dedicated 20A circuit; UPS feeds the PDU', help: 'What feeds the rack, and what happens to it when the building loses power.' },
          { field: 'expansion', label: 'Space kept free', type: 'text', required: true, placeholder: '18U reserved (75%)', help: 'Aim for 20% or more. Growth is the one certainty.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'elevation',
          label: 'Rack elevation — what sits where',
          help: 'One row per device, top of the rack downwards. Include the reserved blank space as a row so it is deliberate rather than accidental.',
          columns: [
            c('u', 'U position', 'text', { placeholder: 'U20–U21' }),
            c('device', 'Device', 'text', { placeholder: 'Proxmox host (2U)' }),
            c('type', 'Type', 'select', { options: ['Server', 'Switch', 'Patch panel', 'PDU', 'UPS', 'Blank / reserved'] }),
            c('power_draw', 'Power draw', 'text', { placeholder: '~350 W typical' }),
          ],
          seed: [
            { u: 'U24', device: '24-port patch panel', type: 'Patch panel', power_draw: '—' },
            { u: 'U23', device: 'Access switch', type: 'Switch', power_draw: '~40 W' },
            { u: 'U20–U21', device: 'Proxmox host (2U, on rails)', type: 'Server', power_draw: '~350 W typical' },
            { u: 'U2–U19', device: 'Reserved for growth', type: 'Blank / reserved', power_draw: '—' },
            { u: 'U1', device: 'Rack PDU, 8 outlet', type: 'PDU', power_draw: '—' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'cabling',
          label: 'Cable schedule',
          help: 'One row per cable. Label both ends with the same label before plugging anything in.',
          columns: [
            c('label', 'Cable label', 'text', { placeholder: 'A-01' }),
            c('from', 'From', 'text', { placeholder: 'Patch panel port 1' }),
            c('to', 'To', 'text', { placeholder: 'Switch port 1' }),
            c('type', 'Type', 'text', { placeholder: 'Cat6 patch, 0.5 m' }),
          ],
          seed: [
            { label: 'A-01', from: 'Patch panel port 1', to: 'Switch port 1', type: 'Cat6 patch, 0.5 m' },
            { label: 'A-02', from: 'Switch port 24 (uplink)', to: 'Campus LAN drop', type: 'Cat6, 3 m' },
            { label: 'S-01', from: 'Proxmox host NIC 1', to: 'Switch port 2', type: 'Cat6 patch, 1 m' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'assets',
          label: 'Asset register — everything the company owns',
          help: 'Physical machines AND virtual ones. If it holds data or costs money, it belongs here.',
          columns: [
            c('asset_id', 'Asset ID', 'text', { placeholder: 'SRV-001' }),
            c('name', 'Name', 'text', { placeholder: 'pve-host' }),
            c('type', 'Type', 'select', { options: ['Physical server', 'Virtual machine', 'Network device', 'Storage', 'Software / licence'] }),
            c('identifier', 'Serial / identifier', 'text', { placeholder: 'Service tag 7XK2M13' }),
            c('owner', 'Responsible for it', 'text', { placeholder: 'IT (you)' }),
          ],
          seed: [
            { asset_id: 'SRV-001', name: 'pve-host', type: 'Physical server', identifier: 'Dell R630 — tag 7XK2M13', owner: 'IT (you)' },
            { asset_id: 'VM-001', name: 'websrv', type: 'Virtual machine', identifier: 'VMID 101', owner: 'IT (you)' },
            { asset_id: 'VM-002', name: 'winserver', type: 'Virtual machine', identifier: 'VMID 102', owner: 'IT (you)' },
            { asset_id: 'NET-001', name: 'Access switch', type: 'Network device', identifier: 'Cisco CBS350, FOC2481', owner: 'IT (you)' },
          ],
        },
      },
    ],
    dod: [
      { label: 'The rack is identified with power and reserved space recorded', test: (d) => !!(d.fields.rack_id && d.fields.power && d.fields.expansion) },
      { label: 'At least four devices are placed in the elevation', test: (d) => (d.groups.elevation ?? []).filter((r) => !!r.u && !!r.device).length >= 4 },
      { label: 'Space is deliberately reserved for growth', test: (d) => (d.groups.elevation ?? []).some((r) => r.type === 'Blank / reserved') },
      { label: 'At least three cables are logged with both ends', test: (d) => (d.groups.cabling ?? []).filter((r) => !!r.label && !!r.from && !!r.to).length >= 3 },
      { label: 'At least four assets are registered, including virtual machines', test: (d) => (d.groups.assets ?? []).filter((r) => !!r.asset_id && !!r.name).length >= 4 && (d.groups.assets ?? []).some((r) => r.type === 'Virtual machine') },
    ],
  },

  // 5 — Operations Log & SOPs ────────────────────────────────────────────────
  {
    id: 'srv_operations',
    feeds: ['srv_as_built'],
    courseId: 'server-plus',
    num: 5,
    file: '05_Operations_and_SOPs.md',
    title: 'Operations Log & SOPs',
    owner: 'win',
    shared: true,
    folder: '04_Operations',
    standard: 'Change & patch management, standard operating procedures',
    weeks: [2, 3, 4],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'How this environment is run: every change recorded, every patch tracked, and the written procedures that mean someone else could do it the same way. This is the difference between a server and a service.',
    howTo:
      'Log changes as you make them — not at the end of the week, when you will have forgotten the rollback plan. Then write the SOPs as numbered steps a stranger could follow.',
    source: 'Your own work in Weeks 2 to 4.',
    buildSteps: [
      'Every time you change the running system, add a row before you make the change.',
      'Write the rollback first. If you cannot say how to undo it, you are not ready to do it.',
      'Track patches separately: what version, tested where, applied when, and what you saw afterwards.',
      'Write each SOP as numbered steps, naming who does it and how often.',
      'Test one SOP by following it exactly as written — you will find the missing step.',
    ],
    meaning:
      'An SOP is a procedure someone else can follow without you in the room. If a step says "configure the firewall appropriately", it is not an SOP yet. The change log answers "what changed?" — the first question asked whenever something breaks.',
    useIt:
      'It goes into the handover package, and it is what the company operates from after you leave.',
    pitfalls: [
      'Writing the log at the end of the week from memory.',
      'Patching production without a snapshot to roll back to.',
      'SOPs written for someone who already knows the answer. Write them for the person who arrives after you.',
    ],
    sections: [
      {
        kind: 'group',
        group: {
          group: 'changes',
          label: 'Change log',
          help: 'One row per change to the running system. Fill the rollback column BEFORE you make the change.',
          columns: [
            c('date', 'Date', 'text', { placeholder: '2026-02-24' }),
            c('change', 'What changed', 'text', { placeholder: 'Created vmbr2 private bridge on the host' }),
            c('why', 'Why', 'text', { placeholder: 'Windows and database VMs need an isolated network' }),
            c('rollback', 'How to undo it', 'text', { placeholder: 'Remove vmbr2 from /etc/network/interfaces and reload' }),
            c('result', 'Result', 'select', { options: ['Worked', 'Rolled back', 'Partial — follow-up needed'] }),
          ],
          seed: [
            { date: '2026-02-24', change: 'Created vmbr2 private bridge', why: 'Windows and database VMs need an isolated network', rollback: 'Remove the stanza from /etc/network/interfaces and reload networking', result: 'Worked' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'patches',
          label: 'Patch log',
          help: 'One row per patch round, per machine. Snapshot first — that is your rollback.',
          columns: [
            c('system', 'System', 'text', { placeholder: 'linuxsrv' }),
            c('patch', 'What was applied', 'text', { placeholder: 'apt full-upgrade — 41 packages, incl. kernel 6.8.0-52' }),
            c('snapshot', 'Snapshot taken first?', 'select', { options: YN }),
            c('date', 'Date applied', 'text', { placeholder: '2026-03-03' }),
            c('outcome', 'Outcome', 'text', { placeholder: 'Rebooted; MariaDB came back up; site responding' }),
          ],
          seed: [
            { system: 'linuxsrv', patch: 'apt full-upgrade — 41 packages, incl. kernel 6.8.0-52', snapshot: 'Yes', date: '2026-03-03', outcome: 'Rebooted; MariaDB came back up; site responding' },
          ],
        },
      },
      {
        kind: 'group',
        group: {
          group: 'sops',
          label: 'Standard operating procedures',
          help: 'The procedures this company keeps. Write the steps as instructions, numbered, with no gaps — assume the reader has never seen this system.',
          columns: [
            c('name', 'Procedure', 'text', { placeholder: 'Monthly patch round' }),
            c('trigger', 'When it runs', 'text', { placeholder: 'First Tuesday of each month, 18:00' }),
            c('who', 'Who does it', 'text', { placeholder: 'IT administrator' }),
            c('steps', 'Steps, in order', 'text', { placeholder: '1) Snapshot each VM 2) Patch test VM first 3) Verify service responds 4) Patch remaining VMs 5) Reboot in order db, then web 6) Verify site 7) Log it here 8) Delete snapshots after 7 days' }),
          ],
          seed: [
            { name: 'Monthly patch round', trigger: 'First Tuesday, 18:00', who: 'IT administrator', steps: '1) Snapshot each VM 2) Patch the test VM first 3) Verify it still serves 4) Patch the rest 5) Reboot database then web 6) Check the site loads 7) Record it in the patch log 8) Delete snapshots after 7 days' },
            { name: 'Making a change', trigger: 'Before any change to a running system', who: 'IT administrator', steps: '1) Write the change and its rollback in the change log 2) Snapshot if the change touches a VM 3) Make the change 4) Verify the service still works 5) Record the result 6) If it failed, roll back and say so' },
            { name: 'Weekly backup check', trigger: 'Every Monday', who: 'IT administrator', steps: '1) Confirm the scheduled backup ran 2) Check its size is plausible 3) Once a month, restore one file to prove it 4) Record the result in the DR plan' },
            { name: 'New staff member', trigger: 'On hire', who: 'IT administrator', steps: '1) Create the AD account 2) Add to the right group only 3) Confirm they can log in 4) Add them to the asset register if issued a device' },
          ],
        },
      },
    ],
    dod: [
      { label: 'At least three changes are logged with a rollback for each', test: (d) => (d.groups.changes ?? []).filter((r) => !!r.change && !!r.rollback).length >= 3 },
      { label: 'Every logged change records what happened', test: (d) => (d.groups.changes ?? []).length > 0 && (d.groups.changes ?? []).every((r) => !!r.result) },
      { label: 'At least two patch rounds are recorded', test: (d) => (d.groups.patches ?? []).filter((r) => !!r.system && !!r.patch).length >= 2 },
      { label: 'Patches were snapshotted before being applied', test: (d) => (d.groups.patches ?? []).length > 0 && (d.groups.patches ?? []).every((r) => r.snapshot === 'Yes') },
      { label: 'At least three SOPs are written with ordered steps and an owner', test: (d) => (d.groups.sops ?? []).filter((r) => !!r.name && !!r.steps && !!r.who).length >= 3 },
    ],
  },

  // 6 — DR Plan & As-Built Handover — THE CAPSTONE ───────────────────────────
  {
    id: 'srv_as_built',
    capstone: true,
    courseId: 'server-plus',
    num: 6,
    file: '06_DR_and_As_Built.md',
    title: 'DR Plan & As-Built Handover',
    owner: 'mgmt',
    shared: true,
    folder: '05_Handover',
    standard: 'Disaster recovery & as-built handover documentation',
    weeks: [4],
    kind: 'form',
    exportFormat: 'md',
    purpose:
      'How this company survives losing the server, and the complete record of what you actually built. The thing they operate from after you leave.',
    howTo:
      'Set the recovery targets, write the restore procedure, then PROVE it by restoring something and timing it. Then walk the handover checklist, fix anything that disagrees with reality, and write the summary.',
    source: 'Every other deliverable in this course, plus a real restore test.',
    buildSteps: [
      'Decide how much downtime and how much data loss the business can actually absorb.',
      'Write what is backed up, to where, how often, and how long it is kept.',
      'Write the restore procedure as numbered steps.',
      'Actually restore something. Time it. Compare that to your target and be honest.',
      'Walk the handover checklist and confirm each document matches reality.',
      'Write the client summary: what they have, how they run it, what is still outstanding.',
    ],
    meaning:
      'A backup nobody has restored is a hope, not a plan. RTO is how long until you are running again; RPO is how much data you accept losing. Both are business decisions, and the restore test is what turns them from numbers into facts.',
    useIt:
      'This is the handover. The company keeps it, operates from it, and maintains it as things change.',
    pitfalls: [
      'An RTO with no evidence behind it. If you have not timed a restore, you do not know your RTO.',
      'Backing up to the same server. That is a copy, not a backup.',
      'Assembling the package from memory in Week 4 instead of keeping documents current.',
      'Handing over the plan instead of what was built. As-built means as BUILT, including what changed.',
    ],
    sections: [
      {
        kind: 'fields',
        title: 'Recovery targets',
        fields: [
          { field: 'rto', label: 'RTO — how long until service is back', type: 'text', required: true, placeholder: '4 hours', help: 'How long can the business actually be down before it hurts badly? Ask the business, do not guess.' },
          { field: 'rpo', label: 'RPO — how much data can be lost', type: 'text', required: true, placeholder: '24 hours (one night of orders)', help: 'If backups run nightly, your RPO is one day. Shorter needs more frequent backups.' },
          { field: 'critical', label: 'What must come back first', type: 'area', required: true, placeholder: 'The order database, then the website. Staff logins can wait an hour.', help: 'Recovery order matters — you cannot restore everything at once.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'backups',
          label: 'What is backed up',
          help: 'One row per thing worth protecting. "Where to" must not be the same machine.',
          columns: [
            c('what', 'What', 'text', { placeholder: 'capstone_db (MariaDB on linuxsrv)' }),
            c('where', 'Backed up to', 'text', { placeholder: 'Proxmox Backup Store on a separate disk' }),
            c('how_often', 'How often', 'text', { placeholder: 'Nightly 02:00' }),
            c('keep', 'Kept for', 'text', { placeholder: '14 days' }),
          ],
          seed: [
            { what: 'capstone_db (MariaDB on linuxsrv)', where: 'Proxmox backup store on a separate disk', how_often: 'Nightly 02:00', keep: '14 days' },
            { what: 'websrv VM (whole machine)', where: 'Proxmox backup store on a separate disk', how_often: 'Weekly Sunday', keep: '4 weeks' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Restore test — the part that makes this real',
        fields: [
          { field: 'restore_steps', label: 'Restore procedure, in order', type: 'area', required: true, placeholder: '1) Open the Proxmox backup store 2) Select the most recent linuxsrv backup 3) Restore to a new VMID so the original is untouched 4) Start it on an isolated bridge 5) Log in and confirm capstone_db has last night\'s orders 6) Record the time taken', help: 'Numbered steps someone else could follow while you are unreachable.' },
          { field: 'restore_what', label: 'What you actually restored', type: 'text', required: true, placeholder: 'linuxsrv from the 2026-03-10 backup, into VMID 199', help: 'Restore into a NEW machine — never over the working one.' },
          { field: 'restore_time', label: 'How long it took', type: 'text', required: true, placeholder: '38 minutes, including verification', help: 'Time it properly. This is the only honest source for your RTO.' },
          { field: 'restore_result', label: 'What the test proved (or exposed)', type: 'area', required: true, placeholder: 'The database came back with all orders to 02:00. It exposed that the website VM has no backup schedule — added afterwards.', help: 'A test that finds a problem is a successful test. Say what it found.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'contents',
          label: 'Handover checklist',
          help: 'Every document in the package, and whether it matches what is actually running right now.',
          columns: [
            c('document', 'Document', 'text', { placeholder: 'Architecture Brief & IP Plan' }),
            c('current', 'Matches reality?', 'select', { options: ['Yes', 'No — needs update'] }),
            c('pdf', 'Exported to PDF?', 'select', { options: YN }),
          ],
          seed: [
            { document: 'Architecture Brief & IP Plan', current: 'Yes', pdf: 'Yes' },
            { document: 'Hardware Discovery, HCL & Upgrade Plan', current: 'Yes', pdf: 'Yes' },
            { document: 'Server Bring-Up Log', current: 'Yes', pdf: 'Yes' },
            { document: 'Rack, Power & Asset Register', current: 'Yes', pdf: 'Yes' },
            { document: 'Operations Log & SOPs', current: 'Yes', pdf: 'Yes' },
          ],
        },
      },
      {
        kind: 'fields',
        title: 'Client summary',
        fields: [
          { field: 'what_they_have', label: 'What the company now has', type: 'area', required: true, placeholder: 'A rack-mounted server running Proxmox on a RAID 10 array, hosting a public website, a Windows domain for staff logins, and a database — cabled, labelled and documented.', help: 'Plain language. The person reading this may not be technical.' },
          { field: 'how_to_operate', label: 'How they run it without you', type: 'area', required: true, placeholder: 'The SOPs cover patching, changes and backup checks. The asset register lists everything. The bring-up log explains the hardware history.', help: 'Point at the documents that answer each routine question.' },
          { field: 'recommendations', label: 'What is still outstanding', type: 'area', required: true, placeholder: 'No offsite backup copy yet; the server is out of warranty; RAM upgrade approved but not purchased; monitoring VM planned but not built.', help: 'Honesty here is worth more than a clean report. Every real handover has a list.' },
          { field: 'handover_date', label: 'Handover date', type: 'date', required: true },
          { field: 'signoff', label: 'Client sign-off', type: 'signature', required: true, placeholder: 'Client representative name' },
        ],
      },
      custodySection({
        label: 'Evidence appendix — log every photo & screenshot you hand over',
        seed: [
          { evidence_id: 'E-01', description: 'GranitePeak_Wk2_rack-front.jpg', collected_by: 'Technician', collected_at: '2026-02-17 15:00', location: '06_Evidence/', sha256: 'from sha256sum GranitePeak_Wk2_rack-front.jpg', transferred_to: 'Client', transferred_at: '2026-03-12 15:00', notes: 'Rack photo, handed over at closeout' },
        ],
      }),
    ],
    dod: [
      { label: 'RTO, RPO and the recovery order are set', test: (d) => !!(d.fields.rto && d.fields.rpo && d.fields.critical) },
      { label: 'At least two things are backed up, off the server itself', test: (d) => (d.groups.backups ?? []).filter((r) => !!r.what && !!r.where).length >= 2 },
      { label: 'The restore procedure is written as followable steps', test: (d) => !!d.fields.restore_steps },
      { label: 'A restore was actually performed and timed', test: (d) => !!(d.fields.restore_what && d.fields.restore_time && d.fields.restore_result) },
      { label: 'All five other documents are checked in and match reality', test: (d) => {
        const rows = (d.groups.contents ?? []).filter((r) => !!r.document);
        return rows.length >= 5 && rows.every((r) => r.current === 'Yes' && r.pdf === 'Yes');
      } },
      { label: 'The client summary and outstanding items are written', test: (d) => !!(d.fields.what_they_have && d.fields.how_to_operate && d.fields.recommendations) },
      { label: 'Handover is dated and signed off', test: (d) => !!(d.fields.handover_date && d.fields.signoff) },
      { label: 'Every handover artifact is logged (chain of custody)', test: (d) => everyEvidenceHashed()(d) },
    ],
  },
];

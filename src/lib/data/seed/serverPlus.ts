import { Course, Gate, RoleDef, Task, WeekDef } from '../../types';

/**
 * CompTIA Server+ — Client Infrastructure Deployment.
 *
 * The team is an MSP. Granite Peak Aggregates, a quarry-and-materials company
 * opening a site office, has handed over one reclaimed blade server and asked for
 * a real server environment. Over four weeks the team assesses, designs, builds,
 * secures, validates and hands over — and everything produced is a *client
 * deliverable*, verified against real output.
 *
 * FOUR ROLES, which is new here. Every other seed reuses red/blue/grc because a
 * three-way split fits an attack/defend/govern course. An MSP deployment team
 * splits by platform instead, so the ids are the platforms: `windows`, `linux`,
 * `network`, `lead`. `Role` is an open string, so this is legal — but note that
 * `ArchitectureDiagram` hardcodes the red/blue/grc lab, which is why this course
 * ships its own `ServerTopologyDiagram` rather than falling back to it.
 *
 * The lab addresses (10.10.10.x management, 172.16.0.0/24 DMZ, 192.168.0.0/24
 * private) are the handbook's worked examples. Students confirm their real host
 * IP with the instructor — the content says so wherever it matters.
 */

const roles: RoleDef[] = [
  {
    id: 'windows',
    name: 'Windows Systems Engineer',
    mission: 'Windows Server, DNS, DHCP, the staff portal and file shares.',
    color: '#2563eb',
    icon: 'Server',
    label: '🪟 Windows Systems Engineer',
  },
  {
    id: 'linux',
    name: 'Linux Systems Engineer',
    mission: 'The Linux server, web service, database and backup jobs.',
    color: '#ea580c',
    icon: 'Terminal',
    label: '🐧 Linux Systems Engineer',
  },
  {
    id: 'network',
    name: 'Network Engineer',
    mission: 'Bridges, zones, firewall and routing — and proving they work.',
    color: '#7c3aed',
    icon: 'Network',
    label: '🌐 Network Engineer',
  },
  {
    id: 'lead',
    name: 'Project Lead / IT Analyst',
    mission: 'Scope, assets, change control and the client handover package.',
    color: '#16a34a',
    icon: 'ClipboardList',
    label: '📋 Project Lead / IT Analyst',
  },
];

/**
 * The engagement arc. A deployment project moves discovery → deploy → secure →
 * validate, so the `phase` verbs name that shape rather than the default
 * build-only arc. Week 1 is graded, not setup: the platform build IS the work.
 */
const weeks: WeekDef[] = [
  {
    number: 1,
    title: 'Discovery & Foundation',
    theme: 'Assess before you build',
    objective: 'Assess the hardware, design the network, and stand up a segmented platform.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Assess & Build',
    difficulty: 3,
    flow: ['Scope the work', 'Assess the hardware', 'Design the network', 'Build the platform'],
    milestone: 'Proxmox is reachable, the bridges carry the right subnets, and the jump box is the only way in.',
    plain: 'You have been handed someone else\'s old server and a rough idea of what the client wants. Before touching a cable, a professional works out what the hardware can do and draws the network on paper — then builds exactly that.',
  },
  {
    number: 2,
    title: 'Service Deployment',
    theme: 'Make it useful',
    objective: 'Deliver the services the business runs on, proven from a user machine.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Deploy & Prove',
    difficulty: 3,
    flow: ['Name resolution', 'Addressing', 'Web & database', 'Prove from a client'],
    milestone: 'A client machine resolves a name, pulls an address, opens the portal and reaches the database.',
    plain: 'The platform exists; now the business gets what it actually paid for. The rule this week is that nothing counts until it works from a user\'s machine — proving it on the server itself proves very little.',
  },
  {
    number: 3,
    title: 'Security & Resilience',
    theme: 'Safe and recoverable',
    objective: 'Harden access, prove segmentation, and get backups running on both servers.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Harden & Protect',
    difficulty: 4,
    flow: ['Least privilege', 'Default-deny', 'Prove isolation', 'Back it up'],
    milestone: 'A DMZ host is provably blocked from the private LAN, and both servers back up on a schedule.',
    plain: 'This is the line between a lab and something a business can run on. You give everyone the least access that still works, and you prove the zones are separated by showing the blocked attempt — not by asserting it.',
  },
  {
    number: 4,
    title: 'Validation & Handover',
    theme: 'Prove it and hand it over',
    objective: 'Restore from backup, validate the whole build, and hand over the as-built package.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Recover & Hand Over',
    difficulty: 3,
    flow: ['Restore for real', 'Survive a reboot', 'Assemble the package', 'Present it'],
    milestone: 'A deleted file is restored intact inside its RTO, and the client has a package they could run the site from.',
    plain: 'Anyone can say they have backups. This week you delete something and bring it back, time how long it took, and hand over documentation a stranger could run the business from without calling you.',
  },
];

const gates: Gate[] = [
  {
    id: 1,
    week: 1,
    title: 'Foundation accepted',
    description:
      'The client signs off the assessment and design, and the platform is reachable and segmented. Nothing is deployed on top until this holds.',
    requiredArtifactTypes: ['01_SOW.md', '02_Hardware_Assessment.md', '03_Network_Design.md'],
    requiredTasks: ['sp-lead-w1', 'sp-net-w1', 'sp-win-w1', 'sp-lnx-w1'],
    handoffs: [
      { from: 'lead', to: 'network', artifact: '02_Hardware_Assessment.md', label: 'Lead → Network: what the hardware can actually run' },
      { from: 'network', to: 'windows', artifact: '03_Network_Design.md', label: 'Network → Windows: the address and bridge for the Windows VM' },
      { from: 'network', to: 'linux', artifact: '03_Network_Design.md', label: 'Network → Linux: the address and bridge for the Linux VM' },
    ],
  },
  {
    id: 2,
    week: 2,
    title: 'Services accepted',
    description:
      'Every business service works and has been proven from a machine other than the server it runs on, with a runbook the client could operate from.',
    requiredArtifactTypes: ['07_Runbook_Windows.md', '08_Runbook_Linux.md', '10_Connectivity_Test_Matrix.csv'],
    requiredTasks: ['sp-win-w2', 'sp-lnx-w2', 'sp-net-w2', 'sp-lead-w2'],
    handoffs: [
      { from: 'windows', to: 'network', artifact: 'DNS and DHCP details', label: 'Windows → Network: what to test in the connectivity matrix' },
      { from: 'linux', to: 'network', artifact: 'Web and database endpoints', label: 'Linux → Network: the paths that must reach the private LAN' },
    ],
  },
  {
    id: 3,
    week: 3,
    title: 'Security accepted',
    description:
      'Access is least-privilege, the firewall is default-deny with justified rules, segmentation is demonstrated with a captured blocked attempt, and backups run on a schedule.',
    requiredArtifactTypes: ['06_Firewall_Rule_Base.csv', '09_Access_Control_Matrix.csv', '11_Hardening_Report.md', '12_Backup_Assessment.csv'],
    requiredTasks: ['sp-net-w3', 'sp-win-w3', 'sp-lnx-w3', 'sp-lead-w3'],
    handoffs: [
      { from: 'network', to: 'lead', artifact: '11_Hardening_Report.md', label: 'Network → Lead: the security posture for the client report' },
      { from: 'linux', to: 'lead', artifact: '12_Backup_Assessment.csv', label: 'Linux → Lead: what is protected and what is still a gap' },
    ],
  },
  {
    id: 4,
    week: 4,
    title: 'Project accepted',
    description:
      'A real restore was performed and timed, the environment survives a reboot, and the as-built package is complete enough for the client to operate without you.',
    requiredArtifactTypes: ['13_DR_Plan_and_Test.md', '14_As_Built.md'],
    requiredTasks: ['sp-lead-w4', 'sp-win-w4', 'sp-lnx-w4', 'sp-net-w4'],
    handoffs: [
      { from: 'windows', to: 'lead', artifact: 'Restore test result', label: 'Windows → Lead: the measured recovery time' },
      { from: 'network', to: 'lead', artifact: '10_Connectivity_Test_Matrix.csv', label: 'Network → Lead: the completed validation matrix' },
    ],
  },
];

const tasks: Task[] = [
  // ══ WEEK 1 ═══════════════════════════════════════════════════════════════
  {
    id: 'sp-lead-w1',
    role: 'lead',
    week: 1,
    title: 'Scope the engagement and assess the hardware',
    objective: 'Agree what you are delivering, then find out what this server can actually do.',
    frameworks: ['NIST_CSF'],
    deliverables: ['01_SOW.md', '02_Hardware_Assessment.md', '04_Asset_Register.csv'],
    estimatedTime: '2 hours',
    difficulty: 2,
    learn: ['Scoping an engagement', 'Hardware discovery', 'Building an asset register'],
    tools: ['SOW form', 'Hardware Assessment form', 'Asset Register form'],
    prerequisites: ['The client brief', 'Physical access to the blade server'],
    definitionOfDone: [
      'SOW records both in-scope and out-of-scope',
      'Every assessment field holds a value read from this server',
      'Asset register has the hardware rows started',
    ],
    handoff: [
      { to: 'network', artifact: '02_Hardware_Assessment.md', note: 'The network design has to fit what this hardware can run.' },
      { to: 'windows', artifact: '01_SOW.md', note: 'The scope says which services are in and which are not.' },
    ],
    steps: [
      {
        id: 'sp-lead-w1-s1',
        title: 'Write the Statement of Work',
        description: 'Agree what you will deliver — and what you will not.',
        instruction: 'Fill the Statement of Work & Project Plan form: objective, in scope, out of scope, the four gates as acceptance criteria, and your assumptions.',
        usesForm: 'Statement of Work & Project Plan',
        producesDeliverable: '01_SOW.md',
        whatItMeans: 'The out-of-scope list is the half that protects you. Scope creep is what kills fixed-price projects.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-lead-w1-s2',
        title: 'Create the client documentation library',
        description: 'Set up the folder structure the whole engagement files into.',
        where: 'Your team share or repository',
        instruction: 'Create the nine-folder library now, on day one, and never deviate from it. This folder IS the final deliverable.',
        instructionList: [
          'Create GranitePeak_Deployment/ with 00_Project through 08_Handover.',
          'Agree the file naming convention: Client_Wk#_Area_Item.ext.',
          'Put the SOW in 00_Project/ as the first file.',
          'Share it with all four roles before anyone builds anything.',
        ],
        commands: [
          {
            cmd: 'mkdir -p GranitePeak_Deployment/{00_Project,01_Assessment,02_Assets,03_Network,04_Windows,05_Linux,06_Security,07_Evidence/{W1,W2,W3,W4},08_Handover}',
            explain: 'Creates the whole library in one command, including the four evidence week folders.',
          },
          { cmd: 'find GranitePeak_Deployment -type d | sort', explain: 'Lists what you just made so you can confirm it.' },
        ],
        expectedOutput: `GranitePeak_Deployment
GranitePeak_Deployment/00_Project
GranitePeak_Deployment/01_Assessment
GranitePeak_Deployment/02_Assets
GranitePeak_Deployment/03_Network
GranitePeak_Deployment/04_Windows
GranitePeak_Deployment/05_Linux
GranitePeak_Deployment/06_Security
GranitePeak_Deployment/07_Evidence
GranitePeak_Deployment/07_Evidence/W1`,
        outputHighlights: [
          { text: '00_Project', label: 'the first folder — the SOW, project plan and change log live here for the whole engagement.' },
          { text: '07_Evidence/W1', label: 'evidence is filed by week from day one. "Later" never comes, and a screenshot with no home is a lost screenshot.' },
        ],
        whatItMeans: 'Naming a file the moment you make it is the difference between a package and a pile. This folder is what you hand over.',
        frameworks: ['NIST_CSF'],
        verify: ['00_Project', '07_Evidence'],
      },
      {
        id: 'sp-lead-w1-s3',
        title: 'Assess the server hardware',
        description: 'Read every value off this machine, not off a datasheet.',
        instruction: 'Fill the Hardware Assessment form from the physical server: service tag, CPU and virtualization support, memory and slot layout, RAID controller, NICs, and remote management.',
        instructionList: [
          'Read the service tag off the chassis and the BIOS version off the POST screen.',
          'In BIOS, confirm whether virtualization (VT-x/AMD-V) and IOMMU are enabled — turn them on if not.',
          'Record memory total AND the slot layout, so the client knows the upgrade headroom.',
          'Note the RAID controller model and how many physical disks it sees.',
          'Complete the compatibility rows Pass/Fail, then write the fit-for-purpose verdict.',
        ],
        usesForm: 'Hardware Assessment',
        producesDeliverable: '02_Hardware_Assessment.md',
        whatItMeans: 'This answers "can this hardware do the job?" before you build on it. Limits found now are cheap; found in week three they are expensive.',
        frameworks: ['NIST_CSF'],
        troubleshooting: 'Cannot find the service tag → check the pull-out tab on the front bezel, or read it from the BIOS system information screen.',
      },
      {
        id: 'sp-lead-w1-s4',
        title: 'Start the asset register',
        description: 'Begin the master list of everything the client owns.',
        instruction: 'Add the vendor and the hardware rows to the Asset Register form. You will complete the software tab in Week 3, once everything is installed.',
        usesForm: 'Asset Register',
        producesDeliverable: '04_Asset_Register.csv',
        whatItMeans: 'You cannot secure, budget for, or recover what you do not know you have. Warranty dates prevent surprises.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
    ],
  },
  {
    id: 'sp-net-w1',
    role: 'network',
    week: 1,
    title: 'Design the network and build the segmented platform',
    objective: 'Put the network on paper, then create the bridges, the jump box and the routing that enforce it.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['03_Network_Design.md', '06_Firewall_Rule_Base.csv'],
    estimatedTime: '3 hours',
    difficulty: 4,
    learn: ['Subnetting and IP planning', 'Linux bridges as virtual switches', 'Bastion/jump box hardening', 'NAT, PAT and IP forwarding'],
    tools: ['Network Design form', 'nano', 'ufw', 'iptables', 'Firewall Rule Base form'],
    prerequisites: ['The hardware assessment (what the platform can run)', 'Your Proxmox host IP from the instructor'],
    definitionOfDone: [
      'Every planned host has a unique address in the IP plan',
      'vmbr1 and vmbr2 exist with the right subnets and the host is still reachable',
      'Root SSH is refused on the jump box and ufw is enabled',
      'Routing survives a reboot and every rule is in the rule base',
    ],
    consumes: [
      { from: 'lead', artifact: '02_Hardware_Assessment.md', note: 'The VM plan and NIC count decide what the network can carry.' },
    ],
    handoff: [
      { to: 'windows', artifact: '03_Network_Design.md', note: 'The Windows VM needs its bridge and static address from the IP plan.' },
      { to: 'linux', artifact: '03_Network_Design.md', note: 'The Linux VM needs its bridge and static address from the IP plan.' },
    ],
    steps: [
      {
        id: 'sp-net-w1-s1',
        title: 'Design the zones and write the IP plan',
        description: 'Decide every address before you build anything.',
        instruction: 'Fill the Network Design & IP Plan form: the four zones and their trust levels, then a row per planned host.',
        instructionList: [
          'Write one line per zone saying what lives there and who may reach it.',
          'Reserve ranges per subnet: gateway .1, static servers .2–.20, DHCP pool .100–.200.',
          'Give every host from the VM plan a row with bridge, IP, gateway and DNS.',
          'Check the DHCP pool does not overlap the static range — that collision surfaces days later.',
        ],
        usesForm: 'Network Design & IP Plan',
        producesDeliverable: '03_Network_Design.md',
        whatItMeans: 'The IP plan is the single source of truth for addresses. If someone assigns one without opening it, the plan has already failed.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-net-w1-s2',
        title: 'Create the DMZ and private LAN bridges',
        description: 'Build the two virtual switches that make segmentation real.',
        where: 'Proxmox host shell — console or SSH',
        instruction: 'Edit /etc/network/interfaces and add both bridge stanzas, then apply. Announce this first: restarting networking can drop every connection to the host.',
        commands: [
          { cmd: 'cp /etc/network/interfaces /etc/network/interfaces.bak', explain: 'Your rollback. Take it before you edit, not after.' },
          { cmd: 'nano /etc/network/interfaces', explain: 'Add the vmbr1 (172.16.0.1) and vmbr2 (192.168.0.1) stanzas, each with bridge_ports none.' },
          { cmd: 'systemctl restart networking', explain: 'Applies the change. Announce it — this can drop the host connection.' },
          { cmd: 'ip -br a', explain: 'Confirms both bridges came up with the right addresses.' },
        ],
        files: [
          {
            name: 'The two bridge stanzas',
            purpose: 'the exact block to paste into /etc/network/interfaces',
            source: 'auto vmbr1 / iface vmbr1 inet static / address 172.16.0.1 / netmask 255.255.255.0 / bridge_ports none / bridge_stp off / bridge_fd 0',
          },
        ],
        expectedOutput: `lo               UNKNOWN        127.0.0.1/8 ::1/128
eno1             UP
vmbr0            UP             10.10.10.47/24
vmbr1            UP             172.16.0.1/24
vmbr2            UP             192.168.0.1/24`,
        outputHighlights: [
          { text: 'vmbr1            UP             172.16.0.1/24', label: 'the DMZ gateway. Every VM you place on vmbr1 will use this as its way out.' },
          { text: 'vmbr2            UP             192.168.0.1/24', label: 'the private LAN gateway — the trusted core where DNS, DHCP, the database and the shares will live.' },
          { text: 'vmbr0            UP             10.10.10.47/24', label: 'management only. If this address disappears after the restart, you have lost the host and need console access.' },
        ],
        whatItMeans: 'A bridge is a virtual switch. Two bridges with no route between them is what "segmented" actually means at the platform level.',
        frameworks: ['NIST_CSF', 'CIS'],
        verify: ['vmbr1', 'vmbr2', 'UP'],
        fixes: [
          { symptom: 'The host went unreachable after the restart', fix: 'You need console access. Restore the backup: cp /etc/network/interfaces.bak /etc/network/interfaces then systemctl restart networking.' },
          { symptom: 'A bridge shows DOWN or has no address', fix: 'A typo in the stanza. Check that "auto vmbrN" is present and the indentation under iface is real spaces, then restart networking again.' },
        ],
      },
      {
        id: 'sp-net-w1-s3',
        path: ['you', 'SSH from management', 'jumpbox'],
        title: 'Deploy and harden the jump box',
        description: 'One hardened gateway you connect through, so the private LAN is never exposed.',
        where: 'The jump box VM on vmbr1 (DMZ)',
        instruction: 'Create an Ubuntu Server VM on vmbr1 with 2 vCPU, 2 GB RAM and 25 GB disk, static 172.16.0.10, gateway 172.16.0.1. Then install SSH, create a non-root admin, disable root login, and enable ufw.',
        commands: [
          { cmd: 'sudo apt update && sudo apt install openssh-server -y', explain: 'Installs the SSH service.' },
          { cmd: 'sudo systemctl enable --now ssh', explain: 'Starts it and makes it survive a reboot.' },
          { cmd: 'sudo adduser jumpadmin', explain: 'A named non-root admin. Nobody should log in as root.' },
          { cmd: 'sudo nano /etc/ssh/sshd_config', explain: 'Set PermitRootLogin no. Remove the leading # if there is one.' },
          { cmd: 'sudo systemctl restart ssh', explain: 'Applies the hardening.' },
          { cmd: 'sudo ufw allow from 10.10.10.0/24 to any port 22 && sudo ufw enable', explain: 'Allows admin SSH from the management network, then turns the firewall on.' },
          { cmd: 'sudo ufw status', explain: 'Proves the rules are live.' },
        ],
        expectedOutput: `Status: active

To                         Action      From
--                         ------      ----
22                         ALLOW       10.10.10.0/24
22                         ALLOW       192.168.0.0/24
22                         ALLOW       172.16.0.0/24`,
        outputHighlights: [
          { text: 'Status: active', label: 'the firewall is actually on. A rule list with an inactive firewall protects nothing.' },
          { text: 'ALLOW       10.10.10.0/24', label: 'admin SSH from the management network only — not from anywhere.' },
        ],
        whatItMeans: 'A jump box is the single hardened door into the sensitive network. You harden one machine well instead of exposing many.',
        frameworks: ['NIST_CSF', 'CIS'],
        verify: ['Status: active', 'ALLOW'],
        fixes: [
          { symptom: 'You locked yourself out enabling ufw', fix: 'Use the Proxmox console for that VM (it does not go over SSH), then sudo ufw allow 22/tcp and re-check the source rules.' },
          { symptom: 'Root can still log in over SSH', fix: 'The PermitRootLogin line is still commented out, or another Include file overrides it. Check with sudo sshd -T | grep permitrootlogin.' },
        ],
      },
      {
        id: 'sp-net-w1-s4',
        path: ['jumpbox', 'NAT via the host', 'pve', 'forwards SSH', 'lnxsrv'],
        title: 'Enable routing between the zones',
        description: 'Controlled paths in, and rules that survive a reboot.',
        where: 'Proxmox host shell',
        instruction: 'Turn on IP forwarding, add the NAT and forwarding rules the design calls for, publish one internal SSH port, then persist the rules.',
        commands: [
          { cmd: 'echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf && sysctl -p', explain: 'Enables forwarding now and after a reboot.' },
          { cmd: 'iptables -t nat -A POSTROUTING -s 172.16.0.0/24 -d 192.168.0.0/24 -j MASQUERADE', explain: 'Lets DMZ hosts reach the private LAN through the host.' },
          { cmd: 'iptables -A FORWARD -p tcp -d 192.168.0.0/24 --dport 22 -j ACCEPT', explain: 'Allows SSH specifically — not everything.' },
          { cmd: 'apt install iptables-persistent -y && netfilter-persistent save', explain: 'Writes the rules to disk so a reboot does not undo your work.' },
          { cmd: 'iptables -t nat -L POSTROUTING -n', explain: 'Confirms the NAT rule is loaded.' },
        ],
        expectedOutput: `Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination
MASQUERADE  all  --  172.16.0.0/24        192.168.0.0/24`,
        outputHighlights: [
          { text: 'MASQUERADE', label: 'the NAT rule that lets DMZ traffic reach the private LAN through the host, with the host\'s address as the source.' },
          { text: '172.16.0.0/24        192.168.0.0/24', label: 'the direction matters — DMZ to private, not the reverse. This asymmetry is the segmentation.' },
        ],
        whatItMeans: 'Rules that vanish on reboot are not controls. Persisting them is what turns a demo into an environment.',
        frameworks: ['NIST_CSF', 'CIS'],
        verify: ['MASQUERADE', '172.16.0.0/24'],
        troubleshooting: 'Rules gone after a reboot → iptables-persistent was not installed, or you added the rules after the save. Re-add and run netfilter-persistent save again.',
      },
      {
        id: 'sp-net-w1-s5',
        title: 'Record every rule in the rule base',
        description: 'A firewall nobody documented is a firewall nobody can maintain.',
        instruction: 'Add the default-deny baseline and every allow you created to the Firewall Rule Base form, each with the reason you added it.',
        usesForm: 'Firewall Rule Base',
        producesDeliverable: '06_Firewall_Rule_Base.csv',
        whatItMeans: '"Why is this port open?" must have an answer. Write the reason as you add the rule, because later you will not remember.',
        frameworks: ['CIS'],
      },
    ],
  },
  {
    id: 'sp-win-w1',
    role: 'windows',
    week: 1,
    title: 'Build the platform from bare metal',
    objective: 'Take the reclaimed server from powered-off to a working hypervisor with the Windows VM on it.',
    frameworks: ['NIST_CSF'],
    deliverables: ['05_Change_Log.csv'],
    estimatedTime: '3 hours',
    difficulty: 4,
    learn: ['Bootable media and DD mode', 'BIOS boot order', 'RAID levels and virtual disks', 'Hypervisor installation'],
    tools: ['Rufus', 'Server BIOS', 'PERC/RAID utility', 'Proxmox VE'],
    prerequisites: ['A USB drive (4 GB+)', 'The Proxmox VE ISO', 'Your host IP from the instructor'],
    definitionOfDone: [
      'The server boots from USB',
      'Exactly one healthy virtual disk exists, with its RAID level recorded',
      'The Proxmox web console loads over HTTPS',
      'The Windows Server VM has its planned address on vmbr2',
    ],
    consumes: [
      { from: 'lead', artifact: '02_Hardware_Assessment.md', note: 'The assessment says which RAID level the disks support and what the VM sizing should be.' },
      { from: 'network', artifact: '03_Network_Design.md', note: 'The Windows VM address and bridge come from the IP plan.' },
    ],
    handoff: [
      { to: 'lead', artifact: '05_Change_Log.csv', note: 'The RAID level and install decisions belong in the change log.' },
    ],
    steps: [
      {
        id: 'sp-win-w1-s1',
        title: 'Flash the installer to USB',
        description: 'Write the hypervisor ISO in the mode it actually needs.',
        where: 'A Windows workstation with Rufus',
        instruction: 'In Rufus: pick the USB under Device, SELECT the Proxmox VE ISO, choose MBR for BIOS or GPT for UEFI, FAT32, then START — and choose DD mode when prompted.',
        instructionList: [
          'Plug in the USB drive and open Rufus.',
          'Under Device, select your USB drive (tick "list USB devices" if it is not shown).',
          'Click SELECT and choose the Proxmox VE ISO.',
          'Partition scheme: MBR for a BIOS system, GPT for UEFI.',
          'File system: FAT32. Click START.',
          'When asked, choose DD mode — ISO mode produces media Proxmox will not boot from.',
        ],
        whatItMeans: 'DD mode writes the image byte for byte. Choosing ISO mode here is the single most common reason the installer will not start.',
        frameworks: ['NIST_CSF'],
        troubleshooting: 'Rufus does not show the USB drive → tick "List USB Hard Drives" under Advanced options, or try another port.',
      },
      {
        id: 'sp-win-w1-s2',
        title: 'Set the boot order in BIOS',
        description: 'Tell the server to look at the USB first.',
        where: 'The physical server — keyboard and monitor attached',
        instruction: 'Power on and tap F2 at the splash screen to enter System Setup, open Boot Settings, move USB/Removable to the top of the boot sequence, then save with F10.',
        whatItMeans: 'Boot order is per-machine and the keys differ by model. Check the manual rather than guessing inside BIOS.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'On the next reboot the server starts from the USB and the Proxmox VE installer menu appears instead of the previous operating system.',
        outputKind: 'result',
        fixes: [
          { symptom: 'F2 does nothing', fix: 'The key differs by vendor — Dell uses F2, HP often F10, Lenovo F1. Start tapping the moment power is applied, before the splash screen finishes.' },
          { symptom: 'The USB is not offered as a boot device', fix: 'It was not flashed in DD mode, or Secure Boot is blocking it. Re-flash, and disable Secure Boot for the install.' },
        ],
      },
      {
        id: 'sp-win-w1-s3',
        title: 'Configure the RAID virtual disk',
        description: 'Create the redundant disk the hypervisor installs onto.',
        where: 'The RAID controller utility at POST',
        instruction: 'Press Ctrl+R at POST. Delete any existing virtual disk, confirm the physical disks are detected, create a new VD at your chosen RAID level, then initialise it.',
        instructionList: [
          'At POST, press Ctrl+R to enter the configuration utility.',
          'In VD Mgmt, delete every existing virtual disk (F2 → Delete VD) until none remain.',
          'Press Ctrl+N for PD Mgmt and confirm every physical disk is detected.',
          'Back in VD Mgmt: F2 → Create New VD. Pick the RAID level and record why you chose it.',
          'Select the drives with Space, take the full size, keep the defaults.',
          'Highlight the new VD, F2 → Initialize, then Esc → Exit.',
        ],
        whatItMeans: 'Creating or initialising a virtual disk erases every drive you selected. Say the confirmation out loud with a teammate before pressing enter.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'VD Mgmt lists exactly one virtual disk in Optimal state, at the RAID level you chose, showing the combined usable capacity.',
        outputKind: 'result',
        troubleshooting: 'A disk is missing from PD Mgmt → it is unseated or dead. Reseat it and re-enter the utility; if it is still absent, record it as a finding in the hardware assessment.',
      },
      {
        id: 'sp-win-w1-s4',
        title: 'Install the hypervisor',
        description: 'Put Proxmox on the virtual disk and give it its permanent address.',
        where: 'The physical server, booted from USB',
        instruction: 'Boot the USB with F11, choose Install Proxmox VE, target the RAID virtual disk, and set the hostname, static IP and gateway from the IP plan. Confirm the host IP with your instructor first.',
        instructionList: [
          'Press F11 at POST and pick the USB from the boot menu.',
          'Choose Install Proxmox VE and accept the licence.',
          'Select the RAID virtual disk as the target — it will be wiped, which is expected.',
          'Set hostname, then the static IP 10.10.10.x/24 and gateway 10.10.10.1 from the IP plan.',
          'Remove the USB and reboot when the installer finishes.',
        ],
        whatItMeans: 'The management address is permanent and belongs on the management bridge only. No user service ever lives on vmbr0.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'After the reboot the console shows a login prompt and the banner names the web interface at https://10.10.10.47:8006 — reachable from a browser on the management network.',
        outputKind: 'result',
        producesDeliverable: '05_Change_Log.csv',
        fixes: [
          { symptom: 'The web console will not load', fix: 'Check you used https and port 8006, and that your workstation is on the management network. The certificate warning is expected and safe to accept here.' },
          { symptom: 'The installer cannot see any disk', fix: 'The virtual disk was never created or never initialised. Go back into the RAID utility with Ctrl+R and check VD Mgmt.' },
        ],
      },
      {
        id: 'sp-win-w1-s5',
        title: 'Create the Windows Server VM',
        description: 'Stand up the VM that will carry the business services.',
        where: 'The Proxmox web console',
        instruction: 'Upload the Windows Server ISO to local storage, create the VM with the resources from the VM plan, attach it to vmbr2, and give it the static address from the IP plan.',
        instructionList: [
          'Datacenter → your node → local → ISO Images → Upload, and add the Windows Server ISO.',
          'Create VM with 2 vCPU, 4 GB RAM and a 60 GB disk.',
          'Set the network device to bridge vmbr2.',
          'During Windows setup, set the static IP 192.168.0.2 with gateway 192.168.0.1.',
        ],
        whatItMeans: 'Placing the VM on vmbr2 is what puts it inside the trusted zone. The bridge choice is a security decision, not a detail.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'The VM boots to the Windows desktop, ipconfig reports 192.168.0.2 with gateway 192.168.0.1, and the Proxmox hardware tab shows the network device on vmbr2.',
        outputKind: 'result',
        troubleshooting: 'No network inside Windows → the VirtIO driver is missing. Either attach the VirtIO ISO and install it, or set the network model to E1000 for this build.',
      },
    ],
  },
  {
    id: 'sp-lnx-w1',
    role: 'linux',
    week: 1,
    title: 'Stand up the Linux server and prove the path',
    objective: 'Create the Linux VM on the private LAN and make the return route to the DMZ work.',
    frameworks: ['NIST_CSF'],
    deliverables: ['05_Change_Log.csv'],
    estimatedTime: '90 min',
    difficulty: 3,
    learn: ['Static addressing with netplan', 'Static routes and asymmetric paths', 'Verifying reachability'],
    tools: ['Proxmox', 'Ubuntu Server', 'ip', 'ping'],
    prerequisites: ['The IP plan', 'The jump box reachable'],
    definitionOfDone: [
      'The Linux VM holds its planned static address on vmbr2',
      'It can reach the jump box through the host gateway',
      'The route is recorded in the change log',
    ],
    consumes: [
      { from: 'network', artifact: '03_Network_Design.md', note: 'The Linux VM address, gateway and bridge all come from the IP plan.' },
    ],
    handoff: [
      { to: 'network', artifact: 'Linux server address', note: 'The connectivity matrix needs the real address to test against.' },
    ],
    steps: [
      {
        id: 'sp-lnx-w1-s1',
        title: 'Create the Ubuntu Server VM',
        description: 'The VM that will run the web service and the database.',
        where: 'The Proxmox web console',
        instruction: 'Create an Ubuntu Server VM with 2 vCPU, 4 GB RAM and a 40 GB disk, attached to vmbr2, with the static address from the IP plan.',
        instructionList: [
          'Upload the Ubuntu Server ISO to local storage if it is not already there.',
          'Create VM: 2 vCPU, 4 GB RAM, 40 GB disk, network bridge vmbr2.',
          'During installation choose a static address: 192.168.0.3/24, gateway 192.168.0.1.',
          'Set the DNS server to the Windows server address — 192.168.0.2.',
          'Install OpenSSH server when the installer offers it.',
        ],
        whatItMeans: 'Pointing DNS at the Windows server now means name resolution works the moment that role is installed in Week 2.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'The VM boots to a login prompt and ip -br a reports 192.168.0.3/24 on the primary interface.',
        outputKind: 'result',
      },
      {
        id: 'sp-lnx-w1-s2',
        title: 'Confirm the address and default route',
        description: 'Prove the VM is where the plan says it is.',
        where: 'The Linux server — console or SSH',
        commands: [
          { cmd: 'ip -br a', explain: 'One line per interface with its address.' },
          { cmd: 'ip route', explain: 'Shows the default gateway the VM will send off-subnet traffic to.' },
        ],
        expectedOutput: `lo               UNKNOWN        127.0.0.1/8 ::1/128
ens18            UP             192.168.0.3/24
default via 192.168.0.1 dev ens18 proto static`,
        outputHighlights: [
          { text: 'ens18            UP             192.168.0.3/24', label: 'the planned address is live. Proxmox names interfaces ens18, not eth0 — a common source of confusion in config files.' },
          { text: 'default via 192.168.0.1', label: 'the private LAN gateway on the host. Without this the VM can only talk to its own subnet.' },
        ],
        whatItMeans: 'Two commands prove both halves of connectivity: the address is right, and the VM knows how to leave its subnet.',
        frameworks: ['NIST_CSF'],
        verify: ['192.168.0.3/24', 'default via 192.168.0.1'],
        fixes: [
          { symptom: 'The interface has a DHCP address instead of the planned one', fix: 'The installer defaulted to DHCP. Edit /etc/netplan/*.yaml with the static address, then sudo netplan apply.' },
          { symptom: 'No default route', fix: 'The gateway was left blank at install. Add it to the netplan file under routes, then netplan apply.' },
        ],
      },
      {
        id: 'sp-lnx-w1-s3',
        path: ['lnxsrv', 'static route', 'pve', 'reaches DMZ', 'jumpbox'],
        title: 'Add the return route to the DMZ',
        description: 'Let internal machines answer the jump box.',
        where: 'The Linux server',
        instruction: 'Add a static route so traffic bound for the DMZ leaves via the private LAN gateway, then prove the jump box answers.',
        commands: [
          { cmd: 'sudo ip route add 172.16.0.0/24 via 192.168.0.1', explain: 'Routes DMZ-bound traffic through the host, which knows how to reach vmbr1.' },
          { cmd: 'ping -c 3 172.16.0.10', explain: 'Proves the jump box answers from inside the private LAN.' },
        ],
        expectedOutput: `PING 172.16.0.10 (172.16.0.10) 56(84) bytes of data.
64 bytes from 172.16.0.10: icmp_seq=1 ttl=63 time=0.412 ms
64 bytes from 172.16.0.10: icmp_seq=2 ttl=63 time=0.388 ms

--- 172.16.0.10 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss`,
        outputHighlights: [
          { text: '0% packet loss', label: 'the return path works. Without the static route the request arrives but the reply has nowhere to go.' },
          { text: 'ttl=63', label: 'one hop less than 64 — proof the traffic was routed through the host rather than delivered on the local subnet.' },
        ],
        whatItMeans: 'A path that works one way only is the classic asymmetric-routing fault. Both directions have to be deliberate.',
        frameworks: ['NIST_CSF'],
        verify: ['0% packet loss'],
        troubleshooting: 'The route disappears after a reboot → ip route add is temporary. Put it in the netplan file under routes so it persists.',
      },
    ],
  },

  // ══ WEEK 2 ═══════════════════════════════════════════════════════════════
  {
    id: 'sp-win-w2',
    role: 'windows',
    week: 2,
    title: 'Deliver name resolution, addressing and the staff portal',
    objective: 'Stand up DNS, DHCP, IIS and the file share — and prove each from another machine.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['07_Runbook_Windows.md', '09_Access_Control_Matrix.csv'],
    estimatedTime: '3 hours',
    difficulty: 3,
    learn: ['Authoritative DNS zones', 'DHCP scopes and exclusions', 'Hosting a site on IIS', 'Share vs NTFS permissions'],
    tools: ['Server Manager', 'DNS Manager', 'DHCP Manager', 'IIS'],
    prerequisites: ['The Windows VM reachable on its planned address'],
    definitionOfDone: [
      'A client resolves winserver by name',
      'A client pulls a lease from the scope',
      'The portal loads from a different machine',
      'The share is granted by group, never to Everyone',
    ],
    handoff: [
      { to: 'network', artifact: 'DNS and DHCP details', note: 'The connectivity matrix tests resolution and leases from a client.' },
      { to: 'lead', artifact: '07_Runbook_Windows.md', note: 'The runbook goes into the as-built package.' },
    ],
    steps: [
      {
        id: 'sp-win-w2-s1',
        title: 'Install DNS and create the zone',
        description: 'Give the business names instead of addresses.',
        where: 'The Windows server',
        instruction: 'Add the DNS Server role, create a primary forward lookup zone for your team domain, and add an A record for the server itself.',
        instructionList: [
          'Server Manager → Add Roles and Features → DNS Server. Install.',
          'Open DNS Manager → Forward Lookup Zones → New Zone.',
          'Zone type Primary; zone name teamx.local, replacing x with your team.',
          'Right-click the zone → New Host (A): name winserver, address 192.168.0.2.',
        ],
        whatItMeans: 'A primary zone makes this server authoritative for that namespace — it is the source of truth, not a cache.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'DNS Manager shows the new forward lookup zone with an A record for winserver pointing at the server address.',
        outputKind: 'result',
      },
      {
        id: 'sp-win-w2-s2',
        path: ['client', 'asks for a name', 'winsrv'],
        title: 'Prove resolution from a client',
        description: 'On the server it always works. That proves nothing.',
        where: 'A client VM on the private LAN',
        command: 'nslookup winserver.teamx.local',
        commandExplanation: 'Asks the configured DNS server to resolve the name and prints which server answered.',
        expectedOutput: `Server:  winserver.teamx.local
Address:  192.168.0.2

Name:    winserver.teamx.local
Address:  192.168.0.2`,
        outputHighlights: [
          { text: 'Name:    winserver.teamx.local', label: 'the name resolved. This is the line that proves the zone and the A record are both correct.' },
          { text: 'Address:  192.168.0.2', label: 'and it resolved to the right host. A resolution to the wrong address is worse than a failure — it fails silently later.' },
        ],
        whatItMeans: 'Testing from a client is the whole point. It proves the service, the network path and the client configuration all at once.',
        frameworks: ['NIST_CSF'],
        verify: ['winserver.teamx.local', '192.168.0.2'],
        fixes: [
          { symptom: 'The client cannot resolve anything', fix: 'Its DNS server is not set to 192.168.0.2. Check with ipconfig /all, and fix it on the adapter or in the DHCP scope options.' },
          { symptom: 'Non-existent domain', fix: 'The A record name or the zone name is misspelled. Check both in DNS Manager — teamx.local must match your actual team.' },
        ],
      },
      {
        id: 'sp-win-w2-s3',
        title: 'Create and activate the DHCP scope',
        description: 'New machines get a working address without a technician.',
        where: 'The Windows server',
        instruction: 'Add the DHCP Server role, create a scope named CapstoneScope over the pool range from the IP plan, set the gateway and DNS options, then activate it.',
        instructionList: [
          'Server Manager → Add Roles → DHCP Server. Install.',
          'DHCP Manager → right-click the server → New Scope, named CapstoneScope.',
          'Range 192.168.0.100 to 192.168.0.200 — inside the pool, clear of the statics.',
          'Subnet mask 255.255.255.0; default gateway 192.168.0.1; DNS server 192.168.0.2.',
          'Activate the scope, then boot a client VM to request a lease.',
        ],
        whatItMeans: 'The pool must not overlap the static range from the IP plan. That overlap is the outage that shows up days later.',
        frameworks: ['NIST_CSF', 'CIS'],
        expectedOutput: 'DHCP Manager → Address Leases lists the client VM with an address from the pool and a lease expiry in the future.',
        outputKind: 'result',
        producesDeliverable: '07_Runbook_Windows.md',
        troubleshooting: 'The client gets a 169.254 address → the scope is not activated, the client is on the wrong bridge, or another DHCP server answered first.',
      },
      {
        id: 'sp-win-w2-s4',
        title: 'Publish the staff portal on IIS',
        description: 'The internal page staff will actually open.',
        where: 'The Windows server',
        instruction: 'Add the Web Server (IIS) role, replace the default page in C:\\inetpub\\wwwroot with your own index.html, then load it from a different machine.',
        instructionList: [
          'Server Manager → Add Roles → Web Server (IIS). Install.',
          'Open C:\\inetpub\\wwwroot and delete the default files.',
          'Create index.html with a welcome heading. Save as type All files, or you will get index.html.txt.',
          'From another VM, browse to the server address and confirm the page loads.',
        ],
        whatItMeans: 'Saving as a text document is the classic trap — the file becomes index.html.txt and IIS serves the default page instead.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'A browser on another VM shows your welcome heading, with the server address visible in the URL bar.',
        outputKind: 'result',
        fixes: [
          { symptom: 'The default IIS page still appears', fix: 'index.html is really index.html.txt, or the old default document is still present. Turn on file extensions in Explorer and check.' },
          { symptom: 'The page loads on the server but not from another VM', fix: 'The Windows Firewall is blocking port 80. Allow World Wide Web Services inbound, and record the rule in the rule base.' },
        ],
      },
      {
        id: 'sp-win-w2-s5',
        title: 'Create the file share with least privilege',
        description: 'Storage for site plans, granted by group.',
        where: 'The Windows server',
        instruction: 'Create the SitePlans shared folder, grant access by group at the lowest level each group needs, and record every grant in the Access Control Matrix.',
        usesForm: 'Access Control Matrix',
        producesDeliverable: '09_Access_Control_Matrix.csv',
        whatItMeans: 'Grant to groups, never to individual users — a user-based matrix rots the first time someone changes role.',
        frameworks: ['CIS', 'NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-lnx-w2',
    role: 'linux',
    week: 2,
    title: 'Deploy the web service and the dispatch database',
    objective: 'Stand up NGINX and MariaDB, with a least-privilege database user, proven from another machine.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['08_Runbook_Linux.md'],
    estimatedTime: '2 hours',
    difficulty: 3,
    learn: ['Service enable vs start', 'Hosting a static site', 'Database users and privilege grants'],
    tools: ['apt', 'systemctl', 'nginx', 'mariadb'],
    prerequisites: ['The Linux VM reachable on its planned address'],
    definitionOfDone: [
      'The NGINX page loads from another VM',
      'capstone_db is reachable as the application user, not root',
      'Both services are enabled to start on boot',
    ],
    handoff: [
      { to: 'network', artifact: 'Web and database endpoints', note: 'These are the paths the connectivity matrix has to prove.' },
      { to: 'lead', artifact: '08_Runbook_Linux.md', note: 'The runbook goes into the as-built package.' },
    ],
    steps: [
      {
        id: 'sp-lnx-w2-s1',
        title: 'Install and enable NGINX',
        description: 'The web service, set to survive a reboot.',
        where: 'The Linux server',
        commands: [
          { cmd: 'sudo apt update && sudo apt install nginx -y', explain: 'Installs the web server.' },
          { cmd: 'echo "<h1>Granite Peak — staff portal</h1>" | sudo tee /var/www/html/index.html', explain: 'Replaces the default page with your own.' },
          { cmd: 'sudo systemctl enable --now nginx', explain: 'Starts it AND makes it start at boot. Both halves matter.' },
          { cmd: 'systemctl status nginx --no-pager', explain: 'Confirms it is running and enabled.' },
        ],
        expectedOutput: `● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Mon 2026-02-24 09:41:02 UTC; 8s ago`,
        outputHighlights: [
          { text: 'Active: active (running)', label: 'the service is up right now.' },
          { text: 'enabled;', label: 'and it will come back after a reboot. A service that is running but not enabled disappears the first time the server restarts.' },
        ],
        whatItMeans: 'Running and enabled are different states. Week 4 reboots this server, and only enabled services survive.',
        frameworks: ['NIST_CSF'],
        verify: ['active (running)', 'enabled'],
        troubleshooting: 'Job failed on start → something else is already on port 80. Check with sudo ss -lntp | grep :80 and stop the conflicting service.',
      },
      {
        id: 'sp-lnx-w2-s2',
        path: ['client', 'HTTP request', 'lnxsrv'],
        title: 'Prove the site from another machine',
        description: 'Serving it locally proves nothing about the network.',
        where: 'A client VM on the private LAN',
        command: 'curl -I http://192.168.0.3',
        commandExplanation: 'Requests just the response headers, so you see the status code without the page body.',
        expectedOutput: `HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Content-Type: text/html
Connection: keep-alive`,
        outputHighlights: [
          { text: 'HTTP/1.1 200 OK', label: 'the server answered successfully across the network — the service, the route and the firewall all work.' },
          { text: 'Server: nginx/1.18.0 (Ubuntu)', label: 'and it was NGINX that answered, not something else listening on the port.' },
        ],
        whatItMeans: 'A 200 from another machine proves the service, the routing and the firewall together. Nothing else does.',
        frameworks: ['NIST_CSF'],
        verify: ['200 OK', 'nginx'],
        fixes: [
          { symptom: 'Connection refused', fix: 'NGINX is not running. Check systemctl status nginx on the server first.' },
          { symptom: 'The request hangs then times out', fix: 'A firewall is dropping it. Check ufw status on the Linux server and allow 80/tcp, then record the rule.' },
        ],
      },
      {
        id: 'sp-lnx-w2-s3',
        title: 'Install MariaDB and create the dispatch database',
        description: 'The database the dispatch application depends on.',
        where: 'The Linux server',
        commands: [
          { cmd: 'sudo apt install mariadb-server -y', explain: 'Installs the database engine.' },
          { cmd: 'sudo systemctl enable --now mariadb', explain: 'Starts it and sets it to start at boot.' },
          { cmd: 'sudo mysql', explain: 'Opens the database shell as the administrator.' },
        ],
        instruction: 'In the database shell, create the database and a least-privilege application user, then flush privileges and exit.',
        instructionList: [
          'CREATE DATABASE capstone_db;',
          "CREATE USER 'capuser'@'localhost' IDENTIFIED BY 'securepass';",
          'GRANT ALL PRIVILEGES ON capstone_db.* TO capuser@localhost;',
          'FLUSH PRIVILEGES; then EXIT;',
        ],
        whatItMeans: 'The application user is scoped to one database. If the app is compromised, the blast radius stops at capstone_db.',
        frameworks: ['CIS', 'NIST_CSF'],
        expectedOutput: 'The database shell accepts each statement with Query OK, and EXIT returns you to the normal prompt.',
        outputKind: 'result',
        troubleshooting: 'Access denied creating the user → you are not connected as the administrator. Use sudo mysql rather than mysql on Ubuntu.',
      },
      {
        id: 'sp-lnx-w2-s4',
        title: 'Prove the database as the application user',
        description: 'Test the way the application connects, not the way you administer.',
        where: 'The Linux server',
        command: 'mysql -u capuser -p -e "SHOW DATABASES;"',
        commandExplanation: 'Connects as the least-privilege application user and lists the databases it can see.',
        expectedOutput: `+--------------------+
| Database           |
+--------------------+
| capstone_db        |
| information_schema |
+--------------------+`,
        outputHighlights: [
          { text: 'capstone_db', label: 'the application database is visible to the application user — the connection the app will actually make.' },
          { text: 'information_schema', label: 'the only other database it can see. No mysql or sys database means the grant really is scoped.' },
        ],
        whatItMeans: 'Testing as root would prove the database exists but nothing about whether the application can reach it.',
        frameworks: ['CIS'],
        verify: ['capstone_db'],
        producesDeliverable: '08_Runbook_Linux.md',
        troubleshooting: 'Access denied for capuser → the grant ran but FLUSH PRIVILEGES did not. Re-enter the database shell and run it.',
      },
      {
        id: 'sp-lnx-w2-s5',
        title: 'Write the Linux runbook',
        description: 'Turn what you just did into a procedure someone else can follow.',
        instruction: 'Fill the Linux Runbook form with a row per service: purpose, the real build commands, the verify line and its expected result, and how to restore it.',
        usesForm: 'Linux Runbook',
        producesDeliverable: '08_Runbook_Linux.md',
        whatItMeans: 'Capture the commands you actually ran while they are fresh. A runbook written from memory next week will have gaps.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-net-w2',
    role: 'network',
    week: 2,
    title: 'Validate every path the design promised',
    objective: 'Test each intended route from a real client and record the result honestly.',
    frameworks: ['NIST_CSF'],
    deliverables: ['10_Connectivity_Test_Matrix.csv'],
    estimatedTime: '90 min',
    difficulty: 2,
    learn: ['Deriving tests from a design', 'Positive and negative testing', 'Evidence capture'],
    tools: ['ping', 'nslookup', 'curl', 'Connectivity Test Matrix form'],
    prerequisites: ['Week 2 services deployed by both engineers'],
    definitionOfDone: [
      'Every intended path has a row with an actual result',
      'Each row names its evidence file',
    ],
    consumes: [
      { from: 'windows', artifact: 'DNS and DHCP details', note: 'You cannot test resolution until the zone and scope exist.' },
      { from: 'linux', artifact: 'Web and database endpoints', note: 'The web path needs the real address and port to test against.' },
    ],
    handoff: [
      { to: 'lead', artifact: '10_Connectivity_Test_Matrix.csv', note: 'The matrix is evidence for the integration report.' },
    ],
    steps: [
      {
        id: 'sp-net-w2-s1',
        title: 'Derive the test rows from the design',
        description: 'Write down what should work before you test anything.',
        instruction: 'In the Connectivity Test Matrix form, add a row per intended path from the network design — source, destination, test and expected result — before running a single command.',
        usesForm: 'Connectivity Test Matrix',
        whatItMeans: 'Writing expectations first stops you rationalising whatever happens. A test with no stated expectation cannot fail.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-net-w2-s2',
        title: 'Run the client-side tests',
        description: 'From a real client seat, not from the host.',
        where: 'A client VM on the private LAN',
        commands: [
          { cmd: 'ping -c 3 192.168.0.2', explain: 'The Windows server answers on the private LAN.' },
          { cmd: 'nslookup winserver.teamx.local', explain: 'Name resolution works from the client.' },
          { cmd: 'curl -I http://192.168.0.3', explain: 'The Linux portal answers across the network.' },
        ],
        expectedOutput: `3 packets transmitted, 3 received, 0% packet loss
Name:    winserver.teamx.local
Address:  192.168.0.2
HTTP/1.1 200 OK`,
        outputHighlights: [
          { text: '0% packet loss', label: 'basic reachability to the Windows server.' },
          { text: 'Name:    winserver.teamx.local', label: 'DNS is answering for the zone.' },
          { text: 'HTTP/1.1 200 OK', label: 'the Linux portal is reachable from a user seat — the test that actually matters to the business.' },
        ],
        whatItMeans: 'The Proxmox host can reach everything, so testing from it proves nothing. Always test from a client.',
        frameworks: ['NIST_CSF'],
        verify: ['0% packet loss', '200 OK'],
        producesDeliverable: '10_Connectivity_Test_Matrix.csv',
        troubleshooting: 'A test fails → record the failure in the matrix as a finding and fix it. Hiding a failed row makes the whole matrix worthless.',
      },
    ],
  },
  {
    id: 'sp-lead-w2',
    role: 'lead',
    week: 2,
    title: 'Keep the documentation current',
    objective: 'Log every change as it happens and confirm the runbooks are usable.',
    frameworks: ['NIST_CSF'],
    deliverables: ['05_Change_Log.csv'],
    estimatedTime: '60 min',
    difficulty: 1,
    learn: ['Change control in practice', 'Testing a runbook cold'],
    tools: ['Change Log form'],
    definitionOfDone: [
      'Every Week 2 change has a log row with a rollback',
      'A teammate followed a runbook they did not write',
    ],
    consumes: [
      { from: 'windows', artifact: '07_Runbook_Windows.md', note: 'The lead checks the runbook is followable by someone who did not build it.' },
      { from: 'linux', artifact: '08_Runbook_Linux.md', note: 'Same check for the Linux services.' },
    ],
    steps: [
      {
        id: 'sp-lead-w2-s1',
        title: 'Log this week\'s changes',
        description: 'Every role deployed something. All of it gets a row.',
        instruction: 'Add a Change Log row for each service deployed this week — what changed, why, the command or screen, the result, and how to reverse it.',
        usesForm: 'Change Log',
        producesDeliverable: '05_Change_Log.csv',
        whatItMeans: 'The rollback column is only truthful if it was written before the change. After the fact, nobody remembers the previous value.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-lead-w2-s2',
        title: 'Test a runbook cold',
        description: 'The real test of documentation is a stranger following it.',
        instruction: 'Have an engineer who did not build a service follow its runbook end to end. Every question they ask you is a gap — fix the runbook, not the person.',
        whatItMeans: 'A runbook is how the client operates without you. If it only works when its author is in the room, it is not done.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'The teammate completes the procedure without asking a question, or you have a specific list of steps to rewrite.',
        outputKind: 'result',
      },
    ],
  },

  // ══ WEEK 3 ═══════════════════════════════════════════════════════════════
  {
    id: 'sp-net-w3',
    role: 'network',
    week: 3,
    title: 'Default-deny, and prove the zones are separated',
    objective: 'Lock the firewall down to justified rules and demonstrate the DMZ cannot reach the private LAN.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['06_Firewall_Rule_Base.csv', '11_Hardening_Report.md'],
    estimatedTime: '2 hours',
    difficulty: 4,
    learn: ['Default-deny baselines', 'Demonstrating isolation', 'Negative testing'],
    tools: ['ufw', 'iptables', 'Firewall Rule Base form', 'Hardening Report form'],
    prerequisites: ['The connectivity matrix from Week 2'],
    definitionOfDone: [
      'A default-deny baseline is in place and documented',
      'A blocked cross-zone attempt is captured as evidence',
      'The negative test is recorded in the connectivity matrix',
    ],
    handoff: [
      { to: 'lead', artifact: '11_Hardening_Report.md', note: 'The security posture goes into the client report and the closeout deck.' },
    ],
    steps: [
      {
        id: 'sp-net-w3-s1',
        title: 'Set the default-deny baseline',
        description: 'Block everything, then allow only what the design requires.',
        where: 'The jump box',
        commands: [
          { cmd: 'sudo ufw default deny incoming', explain: 'Nothing gets in unless a later rule allows it.' },
          { cmd: 'sudo ufw default allow outgoing', explain: 'The host can still reach out for updates.' },
          { cmd: 'sudo ufw status verbose', explain: 'Shows the defaults and every rule currently loaded.' },
        ],
        expectedOutput: `Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
22                         ALLOW IN    10.10.10.0/24`,
        outputHighlights: [
          { text: 'Default: deny (incoming)', label: 'the baseline. Every rule below this line is a deliberate exception you can be asked to justify.' },
          { text: 'Logging: on (low)', label: 'blocked attempts get logged — which is what lets you prove the isolation later.' },
        ],
        whatItMeans: 'Default-deny inverts the burden of proof: instead of blocking known threats, you allow only known needs.',
        frameworks: ['CIS', 'NIST_CSF'],
        verify: ['Default: deny (incoming)', 'Status: active'],
        troubleshooting: 'You lost your SSH session enabling this → use the Proxmox console for the VM, then add the allow rule for your management subnet before re-enabling.',
      },
      {
        id: 'sp-net-w3-s2',
        path: ['jumpbox', 'BLOCKED by default-deny', 'winsrv'],
        title: 'Prove the DMZ cannot reach the private LAN',
        description: 'Isolation you cannot demonstrate is not isolation.',
        where: 'The jump box (DMZ) — attempting to reach the private LAN',
        instruction: 'From the DMZ host, attempt a connection to a private-LAN service that should be blocked, and capture the failure as evidence.',
        commands: [
          { cmd: 'ping -c 2 -W 2 192.168.0.2', explain: 'Attempts ICMP to the Windows server. This is expected to FAIL.' },
          { cmd: 'sudo grep UFW /var/log/ufw.log | tail -3', explain: 'Shows the firewall actually logged the block.' },
        ],
        expectedOutput: `PING 192.168.0.2 (192.168.0.2) 56(84) bytes of data.

--- 192.168.0.2 ping statistics ---
2 packets transmitted, 0 received, 100% packet loss, time 1002ms`,
        outputHighlights: [
          { text: '100% packet loss', label: 'the blocked attempt. This failure is the evidence — a screenshot of it is worth more to an auditor than any claim you could write.' },
          { text: '0 received', label: 'nothing came back. Combined with the firewall log entry, this is a demonstrated control rather than an asserted one.' },
        ],
        whatItMeans: 'A failed ping is normally bad news. Here it is the deliverable — proof the segmentation behaves as designed.',
        frameworks: ['NIST_CSF', 'CIS'],
        verify: ['100% packet loss'],
        producesDeliverable: '10_Connectivity_Test_Matrix.csv',
        fixes: [
          { symptom: 'The ping succeeds when it should be blocked', fix: 'A FORWARD rule is too broad. Review the iptables FORWARD chain — an early ACCEPT for the whole subnet will shadow your narrower rules.' },
          { symptom: 'No entries in ufw.log', fix: 'Logging is off. Run sudo ufw logging low, retry the blocked connection, then check again.' },
        ],
      },
      {
        id: 'sp-net-w3-s3',
        title: 'Complete the rule base and write the hardening report',
        description: 'Every rule justified; every control area scored honestly.',
        instruction: 'Update the Firewall Rule Base with every rule and mark the tested ones, then fill the Security Hardening Report with what you implemented, its evidence and the residual risk.',
        usesForm: 'Security Hardening Report',
        producesDeliverable: '11_Hardening_Report.md',
        whatItMeans: 'A hardening report claiming everything is done is almost always wrong. Naming the gaps is what makes the rest credible.',
        frameworks: ['CIS', 'NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-win-w3',
    role: 'windows',
    week: 3,
    title: 'Least privilege and a working backup job',
    objective: 'Remove broad grants, document the firewall rules, and get a Windows backup running.',
    frameworks: ['CIS', 'NIST_CSF'],
    deliverables: ['09_Access_Control_Matrix.csv'],
    estimatedTime: '2 hours',
    difficulty: 3,
    learn: ['NTFS vs share permissions', 'Removing inherited broad grants', 'Windows Server Backup'],
    tools: ['File Explorer security tab', 'Windows Firewall', 'Windows Server Backup'],
    prerequisites: ['The share created in Week 2'],
    definitionOfDone: [
      'No Everyone/Full Control grant remains',
      'The access matrix matches what the server actually enforces',
      'A backup job has completed successfully at least once',
    ],
    handoff: [
      { to: 'lead', artifact: '09_Access_Control_Matrix.csv', note: 'Access control evidence for the hardening report and the audit trail.' },
    ],
    steps: [
      {
        id: 'sp-win-w3-s1',
        title: 'Remove the broad grants',
        description: 'Everyone/Full Control is how data leaks.',
        where: 'The Windows server — the SitePlans folder',
        instruction: 'Open the folder Security tab, disable inheritance and convert to explicit permissions, remove Everyone and any Users entry, then add your groups at the lowest level each needs.',
        instructionList: [
          'Right-click the folder → Properties → Security → Advanced.',
          'Disable inheritance, choosing to convert inherited permissions to explicit.',
          'Remove Everyone and any broad Users grant.',
          'Add Dispatch as Read, Engineering as Modify, and leave administrators with Full Control.',
          'Confirm the Effective Access tab agrees with your access matrix.',
        ],
        whatItMeans: 'The broadest grant wins. Adding a narrow group while Everyone is still present changes nothing at all.',
        frameworks: ['CIS'],
        expectedOutput: 'The Security tab lists only your named groups plus administrators, and Effective Access for a Dispatch member shows read rights without write.',
        outputKind: 'result',
        producesDeliverable: '09_Access_Control_Matrix.csv',
        troubleshooting: 'Permissions keep reverting → inheritance is still enabled from the parent folder. Disable it on this folder before editing again.',
      },
      {
        id: 'sp-win-w3-s2',
        title: 'Configure and run a backup job',
        description: 'A schedule, a destination, and one proven successful run.',
        where: 'The Windows server',
        instruction: 'Install Windows Server Backup, create a scheduled job covering the share and the system state, target a separate volume, then run it once on demand and confirm it succeeded.',
        instructionList: [
          'Add the Windows Server Backup feature from Server Manager.',
          'Create a backup schedule covering the SitePlans share and the system state.',
          'Target a separate volume — never the disk you are protecting.',
          'Run it once on demand and wait for it to finish.',
          'Confirm the result reads Successful, and note the completion time.',
        ],
        whatItMeans: 'Backing up to the same disk protects against deletion but not against losing the disk. Separate media is the point.',
        frameworks: ['NIST_CSF', 'CIS'],
        expectedOutput: 'The Windows Server Backup console shows the last backup status as Successful, with a completion timestamp and the backup target listed.',
        outputKind: 'result',
        troubleshooting: 'The job fails with insufficient space → the target volume is too small for a full backup. Reduce the scope to the data volume, or attach a larger virtual disk.',
      },
    ],
  },
  {
    id: 'sp-lnx-w3',
    role: 'linux',
    week: 3,
    title: 'Harden SSH and automate the backups',
    objective: 'Confirm the SSH hardening, then write and schedule a backup script that actually runs.',
    frameworks: ['CIS', 'NIST_CSF'],
    deliverables: ['12_Backup_Assessment.csv'],
    estimatedTime: '2 hours',
    difficulty: 3,
    learn: ['Reading effective sshd config', 'rsync backups', 'cron scheduling'],
    tools: ['sshd', 'rsync', 'cron', 'Backup Assessment form'],
    prerequisites: ['The Linux services from Week 2'],
    definitionOfDone: [
      'Root SSH login is confirmed disabled',
      'The backup script runs and copies real files',
      'The cron job is scheduled and listed',
      'The backup assessment names every gap honestly',
    ],
    handoff: [
      { to: 'lead', artifact: '12_Backup_Assessment.csv', note: 'The gaps feed the DR plan and the client recommendations.' },
    ],
    steps: [
      {
        id: 'sp-lnx-w3-s1',
        title: 'Confirm the SSH hardening is effective',
        description: 'Check what the service actually loaded, not what the file says.',
        where: 'The Linux server',
        command: 'sudo sshd -T | grep -E "permitrootlogin|passwordauthentication"',
        commandExplanation: 'Prints the effective running configuration, after all includes and overrides are resolved.',
        expectedOutput: `permitrootlogin no
passwordauthentication yes`,
        outputHighlights: [
          { text: 'permitrootlogin no', label: 'root cannot log in over SSH. Checking the effective config catches the case where an Include file silently overrides sshd_config.' },
        ],
        whatItMeans: 'Reading the file tells you what you wrote. Reading the effective config tells you what the service is enforcing.',
        frameworks: ['CIS'],
        verify: ['permitrootlogin no'],
        troubleshooting: 'It still reports yes → a file under /etc/ssh/sshd_config.d/ is overriding your setting. Check that directory, then restart ssh.',
      },
      {
        id: 'sp-lnx-w3-s2',
        title: 'Write and run the backup script',
        description: 'A real script that copies real files.',
        where: 'The Linux server',
        instruction: 'Create a backup script that copies the web root into a dated folder under /backups, make it executable, then run it once and confirm the files arrived.',
        files: [
          {
            name: 'backup.sh',
            purpose: 'the nightly copy of the portal web root into a dated folder',
            source: '#!/bin/bash\nSRC=/var/www/html\nDEST=/backups/www_$(date +%F)\nmkdir -p "$DEST"\nrsync -a "$SRC/" "$DEST/"\necho "Backup of $SRC completed to $DEST"',
          },
        ],
        commands: [
          { cmd: 'sudo mkdir -p /backups && sudo nano /home/ops/backup.sh', explain: 'Creates the destination and opens the script for editing.' },
          { cmd: 'sudo chmod +x /home/ops/backup.sh', explain: 'Makes it executable — cron will not run it otherwise.' },
          { cmd: 'sudo /home/ops/backup.sh && ls -1 /backups', explain: 'Runs it once and lists what landed.' },
        ],
        expectedOutput: `Backup of /var/www/html completed to /backups/www_2026-03-03
www_2026-03-03`,
        outputHighlights: [
          { text: 'Backup of /var/www/html completed', label: 'the script ran to completion and reported where it wrote.' },
          { text: 'www_2026-03-03', label: 'a dated folder actually exists. A script that prints success without creating anything is the failure mode to watch for.' },
        ],
        whatItMeans: 'Always confirm the destination after running a backup. Scripts that report success while copying nothing are common.',
        frameworks: ['NIST_CSF'],
        verify: ['completed to /backups'],
        fixes: [
          { symptom: 'Permission denied writing to /backups', fix: 'Run it with sudo, or chown the directory to the user the job will run as.' },
          { symptom: 'The folder is created but empty', fix: 'The trailing slash on the rsync source matters. Use "$SRC/" with the slash to copy the contents rather than the directory itself.' },
        ],
      },
      {
        id: 'sp-lnx-w3-s3',
        title: 'Schedule it and prove the schedule exists',
        description: 'A backup nobody scheduled is a backup nobody runs.',
        where: 'The Linux server',
        commands: [
          { cmd: 'crontab -e', explain: 'Opens your crontab. Add: 0 1 * * * /home/ops/backup.sh >> /var/log/backup.log 2>&1' },
          { cmd: 'crontab -l', explain: 'Lists the scheduled jobs so you can prove the entry is there.' },
        ],
        expectedOutput: `0 1 * * * /home/ops/backup.sh >> /var/log/backup.log 2>&1`,
        outputHighlights: [
          { text: '0 1 * * *', label: 'runs at 01:00 every day. The five fields are minute, hour, day of month, month, day of week.' },
          { text: '>> /var/log/backup.log 2>&1', label: 'captures both normal output and errors. Without this, a failing nightly job fails silently forever.' },
        ],
        whatItMeans: 'Redirecting output to a log is what makes a silent failure visible. Unlogged cron jobs fail without anyone noticing.',
        frameworks: ['NIST_CSF', 'CIS'],
        verify: ['/home/ops/backup.sh'],
        troubleshooting: 'The job never runs → cron needs an absolute path and an executable file. Confirm with ls -l that the script has the execute bit set.',
      },
      {
        id: 'sp-lnx-w3-s4',
        title: 'Assess what is actually protected',
        description: 'An honest review, including what is not covered.',
        instruction: 'Fill the Backup Assessment form: one row per system with what is backed up, how often, where, retention, the last good run, and the gap it still leaves.',
        usesForm: 'Backup Assessment',
        producesDeliverable: '12_Backup_Assessment.csv',
        whatItMeans: 'A backup is a copy; a restore is proof. Any row with no restore test is an untested assumption, and should say so.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'sp-lead-w3',
    role: 'lead',
    week: 3,
    title: 'Complete the inventory and draft the DR plan',
    objective: 'Finish the asset register and write the recovery plan you will test next week.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['04_Asset_Register.csv', '13_DR_Plan_and_Test.md'],
    estimatedTime: '2 hours',
    difficulty: 3,
    learn: ['RTO and RPO', 'The 3-2-1 rule', 'Prioritising recovery order'],
    tools: ['Asset Register form', 'DR Plan form'],
    prerequisites: ['The backup assessment from the Linux engineer'],
    definitionOfDone: [
      'The software tab lists every installed program with versions',
      'Each critical system has an RTO and RPO',
      'Each system has a written restore procedure',
    ],
    consumes: [
      { from: 'linux', artifact: '12_Backup_Assessment.csv', note: 'The gaps decide which systems need the most attention in the DR plan.' },
      { from: 'network', artifact: '11_Hardening_Report.md', note: 'Residual risks become client recommendations.' },
    ],
    steps: [
      {
        id: 'sp-lead-w3-s1',
        title: 'Complete the asset register',
        description: 'Every program installed across the build.',
        instruction: 'Add the software rows to the Asset Register: the hypervisor, both server operating systems, and every service you installed, each with its version and support-end date.',
        usesForm: 'Asset Register',
        producesDeliverable: '04_Asset_Register.csv',
        whatItMeans: 'The support-end column turns an inventory into a risk tool — it tells the client what stops receiving security patches, and when.',
        frameworks: ['CIS', 'NIST_CSF'],
      },
      {
        id: 'sp-lead-w3-s2',
        title: 'Draft the disaster recovery plan',
        description: 'What comes back, in what order, and how fast.',
        instruction: 'Fill the DR Plan form: the critical systems in recovery order, an RTO and RPO for each, where its backup lives, and the step-by-step restore procedure.',
        instructionList: [
          'List the critical systems from the asset register, ordered by business impact.',
          'Set the RTO from what the downtime costs — for this client, stopped trucks.',
          'Set the RPO from the backup frequency: nightly backups mean an RPO of 24 hours.',
          'Write the restore steps per system, pointing at the runbook that rebuilds it.',
        ],
        usesForm: 'DR Plan & Test Report',
        producesDeliverable: '13_DR_Plan_and_Test.md',
        whatItMeans: 'RTO is how fast it must return; RPO is how much data you can afford to lose. They drive different decisions.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },

  // ══ WEEK 4 ═══════════════════════════════════════════════════════════════
  {
    id: 'sp-win-w4',
    role: 'windows',
    week: 4,
    title: 'Perform the restore test',
    objective: 'Delete something real, bring it back, and time how long it took.',
    frameworks: ['NIST_CSF'],
    deliverables: ['13_DR_Plan_and_Test.md'],
    estimatedTime: '90 min',
    difficulty: 3,
    learn: ['Restore testing', 'Measuring against an RTO', 'Verifying data integrity'],
    tools: ['Windows Server Backup', 'certutil'],
    prerequisites: ['A successful backup from Week 3', 'The DR plan drafted'],
    definitionOfDone: [
      'A deleted file is restored and proven intact',
      'The actual recovery time is recorded against the RTO',
    ],
    consumes: [
      { from: 'lead', artifact: '13_DR_Plan_and_Test.md', note: 'You execute the restore procedure the plan specifies, and report the real time.' },
    ],
    handoff: [
      { to: 'lead', artifact: 'Restore test result', note: 'The measured recovery time goes in the DR test report and the closeout deck.' },
    ],
    steps: [
      {
        id: 'sp-win-w4-s1',
        title: 'Hash the file, then delete it',
        description: 'Capture proof of what the file was before it disappears.',
        where: 'The Windows server — the SitePlans share',
        instruction: 'Record the SHA-256 of a test file, note the start time, then delete it. The hash is how you will prove the restored copy is identical.',
        commands: [
          { cmd: 'certutil -hashfile C:\\Shares\\SitePlans\\quarry-plan.pdf SHA256', explain: 'Records the fingerprint of the file before deletion.' },
          { cmd: 'del C:\\Shares\\SitePlans\\quarry-plan.pdf', explain: 'The simulated loss. Note the exact time you run this.' },
        ],
        expectedOutput: `SHA256 hash of C:\\Shares\\SitePlans\\quarry-plan.pdf:
9f2c4a1b7e8d3f5a6c0b9e2d4f7a1c3e5b8d0f2a4c6e9b1d3f5a7c0e2b4d6f8a
CertUtil: -hashfile command completed successfully.`,
        outputHighlights: [
          { text: 'SHA256 hash of', label: 'the fingerprint before deletion. Comparing this to the restored copy is what turns "a file came back" into "the right file came back, unchanged".' },
        ],
        whatItMeans: 'Without the pre-deletion hash you can prove a file was restored, but not that it is the same file.',
        frameworks: ['NIST_CSF'],
        verify: ['completed successfully'],
      },
      {
        id: 'sp-win-w4-s2',
        title: 'Restore it and verify integrity',
        description: 'Bring it back, then prove it is byte-identical.',
        where: 'The Windows server',
        instruction: 'Follow the DR plan restore procedure to recover the file from backup, then hash it again and compare against what you recorded. Note the finish time.',
        instructionList: [
          'Open Windows Server Backup → Recover, and choose the most recent backup.',
          'Select the file and recover it to its original location.',
          'Run certutil -hashfile on the restored file.',
          'Compare the hash to the one you captured before deletion — they must match exactly.',
          'Work out the elapsed time from deletion to verified restore.',
        ],
        whatItMeans: 'A restore that produces a different hash is a corrupted recovery. The comparison is the actual test.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'The file is back in the share and its SHA-256 matches the pre-deletion value character for character, with the elapsed time noted.',
        outputKind: 'result',
        producesDeliverable: '13_DR_Plan_and_Test.md',
        fixes: [
          { symptom: 'The file is not in the backup catalogue', fix: 'It was created after the last backup ran. Run a backup, wait for it to complete, then repeat the test — and record this as an RPO finding.' },
          { symptom: 'The hashes do not match', fix: 'You restored an older version. Check the backup date you selected, and record the actual data loss window against the RPO.' },
        ],
      },
    ],
  },
  {
    id: 'sp-lnx-w4',
    role: 'linux',
    week: 4,
    title: 'Prove the services survive a reboot',
    objective: 'Restart the server and confirm everything comes back without a human.',
    frameworks: ['NIST_CSF'],
    deliverables: ['08_Runbook_Linux.md'],
    estimatedTime: '60 min',
    difficulty: 2,
    learn: ['Boot persistence', 'Validating after a restart'],
    tools: ['systemctl', 'reboot'],
    prerequisites: ['Week 2 services and Week 3 backups in place'],
    definitionOfDone: [
      'Both services report active and enabled after a reboot',
      'The backup schedule survived the restart',
    ],
    handoff: [
      { to: 'lead', artifact: 'Reboot validation', note: 'Evidence for the as-built package that the environment is durable.' },
    ],
    steps: [
      {
        id: 'sp-lnx-w4-s1',
        title: 'Reboot and re-check everything',
        description: 'The test that catches every service somebody started but never enabled.',
        where: 'The Linux server',
        commands: [
          { cmd: 'sudo reboot', explain: 'Restarts the server. Wait for it to come back before continuing.' },
          { cmd: 'systemctl is-enabled nginx mariadb', explain: 'Confirms both are set to start at boot.' },
          { cmd: 'systemctl is-active nginx mariadb', explain: 'Confirms both are actually running now.' },
          { cmd: 'crontab -l', explain: 'Confirms the backup schedule survived.' },
        ],
        expectedOutput: `enabled
enabled
active
active
0 1 * * * /home/ops/backup.sh >> /var/log/backup.log 2>&1`,
        outputHighlights: [
          { text: 'enabled', label: 'both services are configured to start at boot — the setting that makes the environment survive a power cut.' },
          { text: 'active', label: 'and both are running right now, after the restart, with nobody having touched them.' },
        ],
        whatItMeans: 'A reboot is the cheapest test of whether you built an environment or just a running demonstration.',
        frameworks: ['NIST_CSF'],
        verify: ['enabled', 'active'],
        producesDeliverable: '08_Runbook_Linux.md',
        troubleshooting: 'A service is active but not enabled → it was started manually and will vanish at the next restart. Run sudo systemctl enable <service> and reboot again.',
      },
    ],
  },
  {
    id: 'sp-net-w4',
    role: 'network',
    week: 4,
    title: 'Complete the validation matrix',
    objective: 'Re-run every path, including the negative tests, and fill the matrix to 100%.',
    frameworks: ['NIST_CSF'],
    deliverables: ['10_Connectivity_Test_Matrix.csv'],
    estimatedTime: '90 min',
    difficulty: 2,
    learn: ['Regression testing after changes', 'Auditing reality against the design'],
    tools: ['ping', 'nslookup', 'curl', 'Connectivity Test Matrix form'],
    prerequisites: ['All Week 3 firewall changes complete'],
    definitionOfDone: [
      'Every row has an actual result and an evidence file',
      'The blocked cross-zone test is included and passing',
      'Reality matches the IP plan',
    ],
    handoff: [
      { to: 'lead', artifact: '10_Connectivity_Test_Matrix.csv', note: 'The completed matrix is the validation evidence in the as-built package.' },
    ],
    steps: [
      {
        id: 'sp-net-w4-s1',
        title: 'Re-run the whole matrix',
        description: 'Week 3 changed the firewall. Everything gets retested.',
        instruction: 'Run every row of the Connectivity Test Matrix again from the correct source machine, including the negative tests, and record the actual result and evidence file for each.',
        usesForm: 'Connectivity Test Matrix',
        producesDeliverable: '10_Connectivity_Test_Matrix.csv',
        whatItMeans: 'Firewall changes break things silently. A matrix that has not been re-run since the changes is out of date.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-net-w4-s2',
        title: 'Audit reality against the IP plan',
        description: 'Confirm what is running matches what you designed.',
        where: 'The Proxmox host shell',
        commands: [
          { cmd: 'ip -br a', explain: 'Every bridge and its address on the host.' },
          { cmd: 'qm list', explain: 'Every VM, its id, name and running state.' },
        ],
        expectedOutput: `vmbr0            UP             10.10.10.47/24
vmbr1            UP             172.16.0.1/24
vmbr2            UP             192.168.0.1/24
      VMID NAME                 STATUS     MEM(MB)
       101 jumpbox              running    2048
       102 winserver            running    4096
       103 linuxsrv             running    4096`,
        outputHighlights: [
          { text: 'vmbr2            UP             192.168.0.1/24', label: 'the private LAN gateway still matches the design. A diagram that disagrees with reality is worse than no diagram.' },
          { text: 'running', label: 'every VM is up. Compare this list against the IP plan — anything here that is not in the plan is undocumented.' },
        ],
        whatItMeans: 'The as-built document records what was actually built. This is where you find the drift between plan and reality.',
        frameworks: ['NIST_CSF'],
        verify: ['vmbr1', 'vmbr2', 'running'],
        troubleshooting: 'A VM is in the plan but not in qm list → it was never created or was removed. Update the IP plan to match reality and note the change.',
      },
    ],
  },
  {
    id: 'sp-lead-w4',
    role: 'lead',
    week: 4,
    title: 'Assemble the as-built package and hand it over',
    objective: 'Bring every document together and present the finished environment to the client.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['14_As_Built.md', '13_DR_Plan_and_Test.md'],
    estimatedTime: '3 hours',
    difficulty: 3,
    learn: ['Assembling as-built documentation', 'Presenting to a client', 'Structuring a handover'],
    tools: ['As-Built Package form', 'DR Plan form', 'Presentation software'],
    prerequisites: ['Every other Week 4 task complete'],
    definitionOfDone: [
      'Every document is current and matches reality',
      'The DR test result is recorded with its measured time',
      'The closeout presentation has been delivered',
    ],
    consumes: [
      { from: 'windows', artifact: 'Restore test result', note: 'The measured recovery time is the headline of the DR test report.' },
      { from: 'network', artifact: '10_Connectivity_Test_Matrix.csv', note: 'The completed matrix is the validation evidence in the package.' },
      { from: 'linux', artifact: 'Reboot validation', note: 'Proof the environment is durable, not just currently working.' },
    ],
    steps: [
      {
        id: 'sp-lead-w4-s1',
        title: 'Record the DR test result',
        description: 'The measured time, not the hoped-for one.',
        instruction: 'Complete the Week 4 section of the DR Plan form: what was deleted, the actual recovery time, whether the RTO was met, and how you confirmed integrity.',
        usesForm: 'DR Plan & Test Report',
        producesDeliverable: '13_DR_Plan_and_Test.md',
        whatItMeans: 'A missed RTO recorded honestly is a useful finding. A met RTO with no measured time is worth nothing.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'sp-lead-w4-s2',
        title: 'Assemble the as-built package',
        description: 'Every document, current, in one place.',
        instruction: 'Fill the As-Built Package form: check each document in with its version, confirm it matches what is actually running, and write the client summary and recommendations.',
        instructionList: [
          'Walk the handover checklist and confirm each document exists and is current.',
          'Fix anything that disagrees with reality before checking it in.',
          'Write what the client now has, in language a manager can read.',
          'Write how they operate it without you — point at the runbooks.',
          'List the findings and recommendations, including the hardware limits.',
        ],
        usesForm: 'As-Built Package',
        producesDeliverable: '14_As_Built.md',
        whatItMeans: 'You assemble this from documents kept current all along. That is why the folder library mattered from day one.',
        frameworks: ['NIST_CSF', 'CIS'],
      },
      {
        id: 'sp-lead-w4-s3',
        title: 'Deliver the closeout presentation',
        description: 'The meeting that renews the contract.',
        instruction: 'Build and deliver the deployment presentation: the problem, the design, what was built, a live demo, the security posture, the tested recovery, the inventory, and the recommendations.',
        instructionList: [
          'Open with the problem in the client\'s terms — when the network is down, trucks do not get dispatched.',
          'Show the topology and explain the zones and least privilege.',
          'Demo the user\'s path: resolve a name, get an address, open the portal, query the database.',
          'Show the blocked DMZ attempt, then restore a file from backup live.',
          'Close with the measured recovery time and the recommendations.',
        ],
        whatItMeans: 'Lead with what works and what the client can now do — not with the commands you typed to get there.',
        frameworks: ['NIST_CSF'],
        expectedOutput: 'The client accepts the work, and leaves with the as-built package and the deck.',
        outputKind: 'result',
      },
    ],
  },
];

export const SERVER_PLUS: Course = {
  id: 'server-plus',
  title: 'Server+ Client Infrastructure Deployment',
  slug: 'server-plus',
  vendor: 'CompTIA',
  certification: 'Server+',
  level: 'associate',
  audience: 'Run a real MSP deployment — assess, design, build, secure and hand over a client server environment.',
  description:
    'Your team is an MSP. A client hands you one blade server and a deadline. Over four weeks you assess, design, build, secure, validate and hand over a documented environment they could run without you.',
  roles,
  weeks,
  gates,
  tasks,
  lifecyclePath: [
    { label: 'Discovery', detail: 'Assess the hardware and design the network before touching anything.' },
    { label: 'Foundation', detail: 'Stand up the hypervisor and the segmented zones it all runs on.' },
    { label: 'Deploy', detail: 'Deliver the services the business actually uses, proven from a client.' },
    { label: 'Secure', detail: 'Least privilege, default-deny, and demonstrated isolation between zones.' },
    { label: 'Protect', detail: 'Backups that run on a schedule and a recovery plan with real numbers.' },
    { label: 'Validate', detail: 'Restore for real, survive a reboot, and re-test every path.' },
    { label: 'Hand over', detail: 'An as-built package a stranger could operate the environment from.' },
  ],
  isSeed: true,
  version: 1,
  teamCount: 16,
  teamCapacity: 4,
};

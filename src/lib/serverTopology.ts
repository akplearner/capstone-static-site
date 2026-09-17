/**
 * Single source of truth for the Server+ capstone topology.
 *
 * The configuration guide arrived in the platform as a *copy* of the seed rather
 * than as a second reader of it, and the copies had already disagreed before the
 * commit that made them landed: one surface handed 192.168.0.4 to the optional
 * monitoring host while another told teams to start their own VMs there. Five
 * hand-typed tables cannot be kept in step by care alone — a subnet, a gateway or
 * a hostname changes in four of them and the fifth quietly becomes a lie a
 * student follows into an address collision.
 *
 * So the addressing lives here once, and the guide, the topology diagram and
 * anything that comes next render it rather than restate it. Moving the private
 * zone is now one edit, and there is no fifth place to forget.
 *
 * The one thing deliberately NOT centralised is the body of a shell command. A
 * student copies `ping -c 4 192.168.0.1` and types it at a prompt; a command
 * assembled out of constants stops reading like the thing they will type. Those
 * literals stay inline in the procedure text — `src/lib/page-shape.test.ts`
 * scans everything else, so the tables and labels cannot drift back.
 *
 * This is the Server+ sibling of `labTopology.ts`, which does the same job for
 * the CySA+ SOC lab.
 */

/**
 * The school network every team's management interface sits on.
 *
 * The gateway is NOT on the same third octet as the hosts: hosts sit at
 * 10.10.30.T and the gateway answers on 10.10.10.1, and both are reachable only
 * because the prefix is /16. That gap is exactly why a /24 here fails — and why
 * the gateway was wrong in this file for so long without anything noticing.
 */
export const CAMPUS_LAN = {
  cidr: '10.10.0.0/16',
  gateway: '10.10.10.1',
};

/**
 * The Proxmox host address rule.
 *
 * Every team gets the same third octet and its own fourth: `T` is the team
 * number, so Team 1 is 10.10.30.1. The guide is written around Team 1 because a
 * procedure full of substitution markers is unreadable.
 */
export const HOST = {
  hostname: 'pve-host',
  /** The rule as it is printed to students, marker and all. */
  rule: '10.10.30.T',
  /** The letter a team replaces with its own number. */
  teamMarker: 'T',
  consolePort: 8006,
  exampleTeam: 1,
  exampleAddress: '10.10.30.1',
};

/** What a student types into the browser to reach the Proxmox web console. */
export const HOST_CONSOLE_URL = `https://${HOST.rule}:${HOST.consolePort}`;

/**
 * The Proxmox root login every team sets during the Week 1 install.
 *
 * One classroom password rather than a per-team choice, for the same reason the
 * CySA SOC has one (`SOC_LOGIN` in labTopology.ts): an instructor walking twelve
 * benches cannot help with a console nobody can open, and a password students
 * invent on install day is the thing most often lost by Week 4.
 *
 * `page-shape.test.ts` asserts this literal appears nowhere else, so the guide,
 * the week steps and the forms all read it from here. Week 4 hardening is where
 * a real deployment would rotate it — the course says so rather than pretending
 * a shared password is good practice.
 */
export const HOST_ROOT_LOGIN = { user: 'root', password: 'Pass@2026' };

export interface Bridge {
  id: 'vmbr0' | 'vmbr1' | 'vmbr2';
  /** Zone name as it is labelled on the diagram and in the IP plan. */
  zone: string;
  cidr: string;
  /** Held by the Proxmox host itself, until the later Cisco phase moves it. */
  gateway: string;
  note: string;
}

export const BRIDGES: Bridge[] = [
  {
    id: 'vmbr0',
    zone: 'Management',
    cidr: CAMPUS_LAN.cidr,
    gateway: CAMPUS_LAN.gateway,
    note: 'The campus LAN. The host lives here and every other zone routes out through it.',
  },
  {
    id: 'vmbr1',
    zone: 'DMZ',
    cidr: '172.16.0.0/24',
    gateway: '172.16.0.1',
    note: 'Public-facing only. The website answers here and nothing internal belongs in it.',
  },
  {
    id: 'vmbr2',
    zone: 'Private',
    cidr: '192.168.0.0/24',
    gateway: '192.168.0.1',
    note: 'Internal systems. Later mapped to a physical NIC into the Cisco router and switch.',
  },
];

export function bridge(id: Bridge['id']): Bridge {
  return BRIDGES.find((b) => b.id === id)!;
}

/** A segmented zone — everything except the management bridge. */
export type ZoneBridgeId = Exclude<Bridge['id'], 'vmbr0'>;

/** The two segmented zones, in the order the diagram and the guide draw them. */
export const ZONE_BRIDGES = BRIDGES.filter(
  (b): b is Bridge & { id: ZoneBridgeId } => b.id !== 'vmbr0',
);

export interface BaseVm {
  hostname: 'websrv' | 'winserver' | 'linuxsrv' | 'secmon' | 'wazuh' | 'tools';
  address: string;
  bridge: Bridge['id'];
  os: string;
  /** What the machine is for, short enough to sit inside a diagram node. */
  runs: string;
  /** The services it carries, for the addressing table and the IP plan. */
  services: string[];
  /** The advanced track (Weeks 5–6) — a real host, but not required to pass. */
  optional?: boolean;
}

/**
 * The base build: the same three machines on every team's host, plus the
 * optional monitoring host. Teams add their own business VMs beside these.
 */
export const BASE_VMS: BaseVm[] = [
  {
    hostname: 'websrv',
    address: '172.16.0.10',
    bridge: 'vmbr1',
    os: 'Ubuntu Server',
    runs: 'The website — public-facing',
    services: ['NGINX'],
  },
  {
    hostname: 'winserver',
    address: '192.168.0.2',
    bridge: 'vmbr2',
    os: 'Windows Server',
    runs: 'Windows Server — directory · DNS · DHCP',
    services: ['AD DS', 'DNS', 'DHCP'],
  },
  {
    hostname: 'linuxsrv',
    address: '192.168.0.3',
    bridge: 'vmbr2',
    os: 'Ubuntu Server',
    runs: 'Ubuntu Server — the database',
    services: ['MariaDB'],
  },
  {
    hostname: 'secmon',
    address: '192.168.0.4',
    bridge: 'vmbr2',
    os: 'Ubuntu Server',
    runs: 'Monitoring — the advanced track',
    services: ['Prometheus', 'Grafana', 'Loki', 'Pulse'],
    optional: true,
  },
  // The other two advanced hosts sit in the .20s: above the team block (.5 up,
  // a team would need sixteen VMs to reach them) and below winserver's DHCP
  // scope (.100–.200), so a static address here collides with nothing.
  {
    hostname: 'wazuh',
    address: '192.168.0.20',
    bridge: 'vmbr2',
    os: 'Ubuntu Server',
    runs: 'Wazuh — your own SIEM',
    services: ['Wazuh manager', 'Wazuh indexer', 'Wazuh dashboard'],
    optional: true,
  },
  {
    hostname: 'tools',
    address: '192.168.0.21',
    bridge: 'vmbr2',
    os: 'Ubuntu Server',
    runs: 'NetBox and GLPI — the registers, as software',
    services: ['NetBox', 'GLPI', 'Docker'],
    optional: true,
  },
];

export function vm(hostname: BaseVm['hostname']): BaseVm {
  return BASE_VMS.find((v) => v.hostname === hostname)!;
}

/** The required machines on a bridge — what every team builds, in build order. */
export function baseVmsOn(id: Bridge['id']): BaseVm[] {
  return BASE_VMS.filter((v) => v.bridge === id && !v.optional);
}

/** The advanced-track monitoring host. It owns .4; teams start at .5. */
export const MONITORING_HOST = vm('secmon');

/** Every advanced-track host, for the advanced-week guide and the addressing table. */
export const ADVANCED_HOSTS: BaseVm[] = BASE_VMS.filter((v) => v.optional);


/**
 * Where a team's OWN business VMs start in each zone.
 *
 * The private zone starts at .5, not .4: .4 belongs to the optional monitoring
 * host, and a team on that track that also numbered its first VM .4 would have
 * built a duplicate address on purpose.
 */
export const TEAM_VM_START: Record<ZoneBridgeId, string> = {
  vmbr1: '172.16.0.11',
  vmbr2: '192.168.0.5',
};

/** The physical rack the one server is built into. */
export const RACK_UNITS = 24;

/**
 * The ops network — Week 6, the fleet track.
 *
 * Every team's DMZ and private zone are identical islands on purpose (Team 3's
 * winserver is 192.168.0.2, and so is Team 9's), because nothing ever crosses
 * them. Week 6 needs one thing to cross: the instructor's Core node has to
 * scrape, back up and enrol every team's machines, and Ansible has to reach
 * them. So every server VM gets a SECOND interface on a shared VLAN, and that
 * address is the one that is unique per team — `10.20.T.x`, with T the team
 * number and x the host octet the VM already has in the private zone.
 *
 * This is deliberately NOT a `Bridge` in `BRIDGES`: `ZONE_BRIDGES` filters at
 * runtime on "everything but vmbr0", so an entry there would render as a third
 * client zone in the diagram, the guide table and `TEAM_VM_START`. It is a
 * management plane, not a zone, and it has its own shape.
 */
export const OPS = {
  bridge: 'vmbr9',
  vlan: 20,
  /** The tagged sub-interface the bridge hangs off — the second NIC, VLAN 20. */
  uplink: 'eno2.20',
  cidr: '10.20.0.0/16',
  /** The instructor's Core node. Team 0, so no team's block can collide with it. */
  core: {
    git: '10.20.0.10',
    obs: '10.20.0.11',
    xdr: '10.20.0.12',
    pbs: '10.20.0.13',
    cache: '10.20.0.14',
  },
  team: {
    /** The rule as it is printed to students: the third octet is the team number. */
    rule: '10.20.T',
    /** The Proxmox host's own address on the ops network. PBS, the exporter and the API use it. */
    node: '10.20.T.1',
    /** The team's ops VM — Terraform or OpenTofu, Ansible and the repo clone live here. */
    opsVm: '10.20.T.30',
  },
} as const;

/** A server VM's address on the ops network: its private-zone host octet, moved
 *  into the team's block. websrv keeps .10 for the same reason — one number per
 *  machine, whichever network you meet it on. */
export function opsAddress(v: BaseVm): string {
  return `${OPS.team.rule}.${v.address.split('.')[3]}`;
}

/**
 * The holes in the segmentation — modelled once, rendered everywhere.
 *
 * This is the one exception to "command bodies stay inline". The host's
 * iptables ruleset used to be thirteen `iptables -A` lines typed in Week 3 and
 * copied by hand into the guide, and the two copies had already drifted. A rules
 * FILE assembled from the addresses above is exactly the drift this module
 * exists to stop: `hostRulesFile()` renders the complete `iptables-restore`
 * input, the seed step and the guide procedure both embed it, the diagram draws
 * the published ports from `PUBLISHED_PORTS`, and the IP Plan seeds its
 * published-ports table from the same list. Change a port here and every
 * surface follows.
 */
export interface PublishedPort {
  /** The port on the host's campus address (`HOST.rule`) a campus machine connects to. */
  hostPort: number;
  proto: 'tcp';
  /** Which base VM answers, and on which of its own ports. */
  to: BaseVm['hostname'];
  port: number;
  purpose: string;
}

/** What anyone on the campus LAN reaches at `http(s)://10.10.30.T` and beyond. */
export const PUBLISHED_PORTS: PublishedPort[] = [
  { hostPort: 80, proto: 'tcp', to: 'websrv', port: 80, purpose: 'The website — the site your team builds and uploads' },
  { hostPort: 443, proto: 'tcp', to: 'websrv', port: 443, purpose: 'The website over TLS — published now, served from Week 4' },
  { hostPort: 2200, proto: 'tcp', to: 'websrv', port: 22, purpose: 'Upload the site — scp straight to the DMZ host' },
];

/**
 * Remote administration: the tailnet reaches every zone THROUGH the host.
 *
 * Nothing in the private zone is ever published to the campus. An administrator
 * off campus joins the tailnet, the host advertises both zone subnets as a
 * Tailscale subnet router, and the rules file lets admin traffic from the
 * tailnet interface into the zones — SSH to every VM, RDP to winserver. The
 * host itself is the vmbr0 device: its tailnet address and MagicDNS name.
 * Tailscale source-NATs subnet-routed traffic by default, so a VM sees the
 * host's own bridge address, which the Week-4 host firewalls already allow.
 */
export const REMOTE_ADMIN = {
  iface: 'tailscale0',
  /** The routes the host advertises: both zones, never the campus. */
  routes: ZONE_BRIDGES.map((z) => z.cidr),
  allow: [
    { port: 22, proto: 'tcp', purpose: 'SSH to every VM' },
    { to: 'winserver' as BaseVm['hostname'], port: 3389, proto: 'tcp', purpose: 'RDP to winserver' },
  ] as { to?: BaseVm['hostname']; port: number; proto: 'tcp'; purpose: string }[],
};

export interface CrossZoneAllow {
  from: ZoneBridgeId;
  to: BaseVm['hostname'];
  proto: 'tcp' | 'udp';
  port: number;
  purpose: string;
}

/** The only paths the DMZ may open into the private zone. Everything else is dropped and logged. */
export const CROSS_ZONE_ALLOW: CrossZoneAllow[] = [
  { from: 'vmbr1', to: 'winserver', proto: 'udp', port: 53, purpose: 'DNS' },
  { from: 'vmbr1', to: 'winserver', proto: 'tcp', port: 53, purpose: 'DNS' },
  { from: 'vmbr1', to: 'linuxsrv', proto: 'tcp', port: 3306, purpose: 'The database' },
];

/** Where iptables-persistent reads the ruleset from at boot. The file IS the ruleset. */
export const HOST_RULES_FILE = '/etc/iptables/rules.v4';

/** The site the team builds: where it lives on websrv and how it gets there. */
export const SITE = {
  root: '/var/www/html',
  /** The user created during the websrv Ubuntu install; Week 4 adds the named admin. */
  uploadUser: 'ubuntu',
  uploadPort: PUBLISHED_PORTS.find((p) => p.to === 'websrv' && p.port === 22)!.hostPort,
};

/** The two shapes the ruleset takes: Week 2 gives the guests a way out; Week 3 adds the holes. */
export type HostRulesPhase = 'the-way-out' | 'the-holes';

/**
 * The complete `iptables-restore` file for the host.
 *
 * Restore is atomic and idempotent — applying the file twice yields one
 * ruleset — so there is no "did I add that rule already" and no flush-and-retype.
 * The FORWARD policy is DROP from the first day: every ACCEPT below it is a
 * decision a student can name, and the LOG line at the end turns a blocked path
 * into a kernel-log line they can show as evidence.
 */
export function hostRulesFile(phase: HostRulesPhase): string {
  const holes = phase === 'the-holes';
  const filter: string[] = [
    '*filter',
    ':INPUT ACCEPT [0:0]',
    ':FORWARD DROP [0:0]',
    ':OUTPUT ACCEPT [0:0]',
    '# Replies to anything already allowed, in either direction',
    '-A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT',
    '# Both zones reach the campus LAN, and the internet beyond it, through the host',
    ...ZONE_BRIDGES.map((z) => `-A FORWARD -i ${z.id} -o vmbr0 -j ACCEPT`),
  ];
  const nat: string[] = ['*nat', ':PREROUTING ACCEPT [0:0]', ':INPUT ACCEPT [0:0]', ':OUTPUT ACCEPT [0:0]', ':POSTROUTING ACCEPT [0:0]'];
  if (holes) {
    filter.push(
      '# Staff in the private zone open the website',
      '-A FORWARD -i vmbr2 -o vmbr1 -j ACCEPT',
      '# The DMZ reaches the private zone for DNS and the database, and for nothing else',
      ...CROSS_ZONE_ALLOW.map((r) => `-A FORWARD -i ${r.from} -o ${vm(r.to).bridge} -d ${vm(r.to).address} -p ${r.proto} --dport ${r.port} -j ACCEPT`),
      '# The published ports, after PREROUTING has rewritten the destination',
      ...PUBLISHED_PORTS.map((p) => `-A FORWARD -i vmbr0 -o ${vm(p.to).bridge} -d ${vm(p.to).address} -p ${p.proto} --dport ${p.port} -j ACCEPT`),
      '# Administrators on the tailnet, through the host, into both zones',
      ...REMOTE_ADMIN.allow.flatMap((r) =>
        r.to
          ? [`-A FORWARD -i ${REMOTE_ADMIN.iface} -o ${vm(r.to).bridge} -d ${vm(r.to).address} -p ${r.proto} --dport ${r.port} -j ACCEPT`]
          : ZONE_BRIDGES.map((z) => `-A FORWARD -i ${REMOTE_ADMIN.iface} -o ${z.id} -p ${r.proto} --dport ${r.port} -j ACCEPT`),
      ),
    );
    nat.push(
      `# Published from the campus LAN: the host's own address, port by port`,
      ...PUBLISHED_PORTS.map((p) => `-A PREROUTING -i vmbr0 -p ${p.proto} --dport ${p.hostPort} -j DNAT --to-destination ${vm(p.to).address}:${p.port}`),
    );
  }
  filter.push(
    '# Everything else the host is asked to forward is dropped — and logged, so a blocked path is visible',
    '-A FORWARD -m limit --limit 5/min -j LOG --log-prefix "FWD-DROP " --log-level 4',
    'COMMIT',
  );
  nat.push('# Both zones leave as the host\'s campus address', '-A POSTROUTING -o vmbr0 -j MASQUERADE', 'COMMIT');
  // Two published ports that land on the same VM port would emit one FORWARD
  // line twice; restore accepts it, but a duplicate rule is what this file exists to avoid.
  const seen = new Set<string>();
  const lines = [...filter, ...nat].filter((l) => !l.startsWith('-A') || (!seen.has(l) && (seen.add(l), true)));
  return lines.join('\n') + '\n';
}

/** The shell line that writes the file and makes it live — one command, copied whole. */
export function hostRulesCommand(phase: HostRulesPhase): string {
  return `cat > ${HOST_RULES_FILE} <<'EOF'\n${hostRulesFile(phase)}EOF\niptables-restore < ${HOST_RULES_FILE}`;
}

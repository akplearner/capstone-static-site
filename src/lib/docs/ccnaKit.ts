/**
 * What the team's kit can do, and what to buy to do more.
 *
 * This is the acquisition round's model, and it is the spine of the whole course
 * rather than a preamble: what the equipment supports decides how every later
 * week is built. A team whose switch cannot route does inter-VLAN routing on a
 * router instead — the same requirement, the same evidence, a different
 * procedure — and that branch is taken from DATA recorded in Week 0, never from a
 * course-id or a guess.
 *
 * THE RULE THIS MODULE ENFORCES: a capability is claimed on EVIDENCE. Every entry
 * below names the command that proves it and what in the output says so, because
 * a datasheet describes the model that was sold, not the switch on the bench with
 * eleven years of history and whatever image somebody left on it.
 *
 * Workstations are deliberately almost absent. The instructor's scope is the
 * NETWORK equipment; a laptop matters only in that it must run the emulator (and,
 * in the advanced weeks, NetBox and LibreNMS) and must be named in the topology
 * documentation like any other host.
 */
import type { DeviceClass } from '../ccnaTopology';

/**
 * The capabilities the course asks about.
 *
 * Exactly the ones some later week's procedure depends on — not a features list.
 * If nothing branches on it, it is not here.
 */
export type Capability =
  | 'vlans'
  | 'trunk8021q'
  | 'svi'
  | 'ospf'
  | 'etherchannel'
  | 'poe'
  | 'fiber'
  | 'wireless'
  | 'wlc'
  | 'nat'
  | 'acl'
  | 'dhcpServer'
  | 'console'
  | 'ssh'
  | 'snmp';

export interface CapabilitySpec {
  key: Capability;
  /** How the register asks about it. */
  label: string;
  /** What having it lets the team do, in one line. */
  what: string;
  /** The command that proves it, and what in the output is the proof. */
  proof: { cmd: string; tell: string };
  /** Device classes that can provide it. */
  from: DeviceClass[];
  /** The first week whose work depends on it. */
  neededBy: number;
  /** What the course does instead when the kit cannot do it. Every entry has one:
   *  no capability gap is allowed to end the course. */
  without: string;
}

export const CAPABILITIES: CapabilitySpec[] = [
  {
    key: 'console',
    label: 'Console access (blue cable or USB)',
    what: 'Reach a device with no configuration at all, and recover one you have locked yourself out of.',
    proof: { cmd: 'show users', tell: 'the line marked `*` is `con 0` — you are on the console' },
    from: ['router', 'l3-switch', 'l2-switch', 'wlc'],
    neededBy: 1,
    without: 'In an emulator the console IS the terminal the tool opens for you.',
  },
  {
    key: 'vlans',
    label: 'VLANs',
    what: 'Split one physical switch into separate networks — the whole of Week 2.',
    proof: { cmd: 'show vlan brief', tell: 'VLAN 1 is listed, so the table exists and can be added to' },
    from: ['l3-switch', 'l2-switch'],
    neededBy: 2,
    without: 'An unmanaged switch cannot do this at all — this is the one capability the course genuinely requires, on hardware or in an emulator.',
  },
  {
    key: 'trunk8021q',
    label: '802.1Q trunking',
    what: 'Carry several VLANs down one cable between switches.',
    proof: { cmd: 'show interfaces trunk', tell: 'the command exists and prints a table, even an empty one' },
    from: ['l3-switch', 'l2-switch'],
    neededBy: 2,
    without: 'One cable per VLAN between switches — it works, it does not scale, and saying why is the lesson.',
  },
  {
    key: 'svi',
    label: 'Inter-VLAN routing on the switch (SVI)',
    what: 'Route between VLANs in the switch itself, at wire speed.',
    proof: { cmd: 'show ip route', tell: 'a routing table is printed rather than "Invalid input"' },
    from: ['l3-switch'],
    neededBy: 2,
    without: 'Router-on-a-stick: one trunk to a router, a subinterface per VLAN. Slower, and the CCNA outcome is the same.',
  },
  {
    key: 'etherchannel',
    label: 'EtherChannel / LACP',
    what: 'Bond two links into one, so a cable can fail without an outage.',
    proof: { cmd: 'show etherchannel summary', tell: 'the command is recognised — protocol column appears' },
    from: ['l3-switch', 'l2-switch'],
    neededBy: 2,
    without: 'Two links and spanning tree: one forwards, one blocks. You still prove redundancy, with a slower failover.',
  },
  {
    key: 'ospf',
    label: 'OSPF',
    what: 'Learn routes dynamically between the two buildings — the whole of Week 3.',
    proof: { cmd: 'show ip protocols', tell: 'OSPF appears, or `router ospf 1` is accepted in config mode' },
    from: ['router', 'l3-switch'],
    neededBy: 3,
    without: 'Static routes both ways, then a deliberate failure to show what static routing cannot do for you.',
  },
  {
    key: 'nat',
    label: 'NAT / PAT',
    what: 'Let the whole company reach the internet through one public address.',
    proof: { cmd: 'show ip nat translations', tell: 'the command is recognised (an empty table is a pass)' },
    from: ['router', 'firewall'],
    neededBy: 3,
    without: 'The emulator provides the internet edge; the design is documented and the configuration is written even when nothing upstream answers.',
  },
  {
    key: 'acl',
    label: 'Access control lists',
    what: 'Turn the business rules into what the network will and will not carry.',
    proof: { cmd: 'show access-lists', tell: 'the command is recognised' },
    from: ['router', 'l3-switch', 'firewall'],
    neededBy: 4,
    without: 'Nothing: every managed device in this course can do ACLs. If yours cannot, it is unmanaged.',
  },
  {
    key: 'poe',
    label: 'Power over Ethernet',
    what: 'Power the phones and the access point from the switch port.',
    proof: { cmd: 'show power inline', tell: 'per-port power budget is printed' },
    from: ['l3-switch', 'l2-switch'],
    neededBy: 4,
    without: 'A PoE injector for the AP, and the phones are documented as a design requirement rather than built.',
  },
  {
    key: 'fiber',
    label: 'Fibre uplink (SFP)',
    what: 'Uplink between rooms further apart than copper will carry.',
    proof: { cmd: 'show interfaces status', tell: 'an SFP or Te/Gi uplink port appears, even unpopulated' },
    from: ['l3-switch', 'l2-switch'],
    neededBy: 1,
    without: 'Copper uplinks, with the distance limit recorded in the site survey as the reason fibre would be needed.',
  },
  {
    key: 'wireless',
    label: 'An access point',
    what: 'Put the corporate, guest and IOT WLANs on the air.',
    proof: { cmd: 'show ap summary', tell: 'on a controller: the AP is listed and joined' },
    from: ['ap'],
    neededBy: 4,
    without: 'The WLANs are configured in the emulator and the VLAN-to-SSID mapping is documented.',
  },
  {
    key: 'wlc',
    label: 'A wireless controller',
    what: 'Run several APs as one system, with WLANs defined once.',
    proof: { cmd: 'show wlan summary', tell: 'the WLAN list is printed' },
    from: ['wlc'],
    neededBy: 4,
    without: 'A standalone AP, or Mobility Express on the AP itself. The WLAN-to-VLAN design does not change.',
  },
  {
    key: 'dhcpServer',
    label: 'DHCP served by the network device',
    what: 'Hand out addresses without a server — the usual small-site answer.',
    proof: { cmd: 'show ip dhcp pool', tell: 'the command is recognised' },
    from: ['router', 'l3-switch'],
    neededBy: 2,
    without: 'The server VM serves DHCP and the router relays with `ip helper-address` — which is the enterprise pattern anyway.',
  },
  {
    key: 'ssh',
    label: 'SSH to the device',
    what: 'Administer the kit without sending the password in clear text.',
    proof: { cmd: 'show ip ssh', tell: 'SSH is Enabled, with a version' },
    from: ['router', 'l3-switch', 'l2-switch', 'wlc'],
    neededBy: 4,
    without: 'Telnet on the management VLAN only, documented as a risk with the remediation named. An image without crypto cannot do SSH.',
  },
  {
    key: 'snmp',
    label: 'SNMP',
    what: 'Let the monitoring system read interfaces, CPU and memory.',
    proof: { cmd: 'show snmp', tell: 'the command is recognised — chassis and contact appear' },
    from: ['router', 'l3-switch', 'l2-switch'],
    neededBy: 6,
    without: 'Syslog and reachability checks only. You still build the NOC; it sees less.',
  },
];

export function capability(key: Capability): CapabilitySpec {
  const c = CAPABILITIES.find((x) => x.key === key);
  if (!c) throw new Error(`no capability '${key}'`);
  return c;
}

/** The capabilities a week's work depends on. */
export function capabilitiesNeededBy(week: number): CapabilitySpec[] {
  return CAPABILITIES.filter((c) => c.neededBy === week);
}

/**
 * Device class → what owning one unlocks.
 *
 * Derived from `CAPABILITIES[].from` rather than restated, so a capability can
 * never claim to come from a class the class does not list.
 */
export const CLASS_UNLOCKS: Record<DeviceClass, Capability[]> = (
  ['router', 'l3-switch', 'l2-switch', 'ap', 'wlc', 'firewall', 'server', 'workstation'] as DeviceClass[]
).reduce(
  (acc, cls) => {
    acc[cls] = CAPABILITIES.filter((c) => c.from.includes(cls)).map((c) => c.key);
    return acc;
  },
  {} as Record<DeviceClass, Capability[]>
);

/** The same, as the one-line sentence the register's derived column prints. */
export const UNLOCKS_LABEL: Record<DeviceClass, string> = {
  router: 'Routing, OSPF, NAT, ACLs, DHCP — the edge and the WAN',
  'l3-switch': 'VLANs, trunks, SVIs, EtherChannel — the core, and inter-VLAN routing',
  'l2-switch': 'VLANs, trunks, EtherChannel, PoE — access ports',
  ap: 'The WLANs, on the air',
  wlc: 'Several APs as one system',
  firewall: 'NAT and policy at the edge',
  server: 'DNS, DHCP, and the tools the advanced weeks need',
  workstation: 'Where you work from — console, SSH, browser',
};

/**
 * How a device class is offered in the Equipment Register, and what the register's
 * computed "Unlocks" column prints for it.
 *
 * Both are DERIVED from the two maps above, and the form uses these rather than a
 * hand-written option list, so the select, the computed column and the capability
 * model cannot disagree — a class you can pick always has an answer, and a class
 * with an answer is always pickable. The computed column is
 * `{ column, cases }` data (see `docs/predicate.ts`), not a function.
 */
export const CLASS_OPTION: Record<DeviceClass, string> = {
  router: 'Router',
  'l3-switch': 'Switch that routes (L3)',
  'l2-switch': 'Access switch (L2)',
  ap: 'Access point',
  wlc: 'Wireless controller',
  firewall: 'Firewall',
  server: 'Server / VM',
  workstation: 'Workstation you work from',
};

/** Option label → the sentence the "Unlocks" column prints. */
export const UNLOCKS_BY_OPTION: Record<string, string> = Object.fromEntries(
  (Object.keys(CLASS_OPTION) as DeviceClass[]).map((cls) => [CLASS_OPTION[cls], UNLOCKS_LABEL[cls]])
);

/** The option list, in the order a register offers it. */
export const CLASS_OPTIONS: string[] = Object.values(CLASS_OPTION);

/* ── The two declared paths ─────────────────────────────────────────────── */

/**
 * Emulated or physical, declared once in Week 0.
 *
 * Both are first-class. The instructor's framework puts Packet Tracer at level 1
 * and real gear at the top, and the honest reading of that is not "emulation is
 * lesser" — it is that emulation cannot teach you what a bad patch lead feels
 * like, and hardware cannot give you sixteen routers on a laptop.
 */
export type KitPath = 'emulated' | 'physical';

export const PATHS: Record<KitPath, { label: string; what: string; strength: string; limit: string }> = {
  emulated: {
    label: 'Emulated',
    what: 'The topology runs as software on your own machine.',
    strength: 'Every device the design calls for, free, and you can break it without consequence.',
    limit: 'No cabling, no optics, no PoE, no interface errors — Week 1 records those as design decisions rather than doing them.',
  },
  physical: {
    label: 'Physical kit',
    what: 'Real switches and routers on a bench or in a rack.',
    strength: 'Cabling, optics, PoE, console recovery and the interface counters that only real copper produces.',
    limit: 'Costs money, and what your specific models support decides how some weeks are built — which is what the register is for.',
  },
};

/** The emulators the course is written against, honestly labelled. */
export const EMULATORS: { key: string; name: string; runs: string; good: string; caveat: string }[] = [
  {
    key: 'packet-tracer',
    name: 'Cisco Packet Tracer',
    runs: 'Any laptop — small download, free with a Cisco Networking Academy account',
    good: 'Switching, VLANs, trunks, OSPF, ACLs, NAT, and a wireless model. Enough for Weeks 1-4.',
    caveat: 'A simulation, not real IOS: some commands do not exist and the output is simplified. It cannot run the automation weeks.',
  },
  {
    key: 'cml',
    name: 'Cisco Modeling Labs (CML)',
    runs: 'A machine with virtualization and plenty of memory, or a server',
    good: 'Real IOS-XE images, so every command and every `show` output is the genuine thing. APIs work.',
    caveat: 'Licensed, and hungry: each node is a full virtual router.',
  },
  {
    key: 'gns3',
    name: 'GNS3',
    runs: 'A machine with virtualization; images are yours to supply',
    good: 'Real images, mixes vendors, and connects to real hardware.',
    caveat: 'You must legally obtain the images. Setup is the longest of the three.',
  },
  {
    key: 'containerlab',
    name: 'containerlab',
    runs: 'Linux with Docker',
    good: 'Fast, scriptable, and the natural fit for Weeks 7-8 — a topology in a file, brought up in seconds.',
    caveat: 'Container network operating systems, not Catalyst IOS. Best as the automation lab, beside one of the others.',
  },
];

/* ── What to buy ────────────────────────────────────────────────────────── */

/**
 * The buying guide, capability first.
 *
 * Models are REPRESENTATIVE, not a recommendation, and they are the used-market
 * kit that turns up in home labs rather than what a distributor would quote. The
 * band is an order of magnitude, not a price: what a thing costs depends on the
 * week and the seller, and a course that prints prices is a course that is wrong
 * by next term. What does not go stale is the capability — so buy the capability
 * and check the model against `show version` when it arrives.
 */
export interface KitOption {
  class: DeviceClass;
  /** What to ask for. */
  label: string;
  /** Representative used-market models, oldest first. */
  models: string[];
  /** Order-of-magnitude cost, second-hand. */
  band: 'low' | 'medium' | 'high';
  /** The one thing to check before buying. */
  check: string;
}

export const BAND_LABEL: Record<KitOption['band'], string> = {
  low: 'Cheapest tier second-hand — often the price of a takeaway',
  medium: 'Mid tier second-hand — a considered purchase',
  high: 'Expensive second-hand — borrow, share, or emulate instead',
};

export const BUYING_GUIDE: KitOption[] = [
  {
    class: 'l2-switch',
    label: 'A managed access switch',
    models: ['Catalyst 2960-24TT-L', 'Catalyst 2960S/2960-X', 'Catalyst 2960-CX (compact, quiet)'],
    band: 'low',
    check: 'Managed, not "smart" — it must have a console port and a CLI. A 2960 does NOT route between VLANs.',
  },
  {
    class: 'l3-switch',
    label: 'A switch that routes',
    models: ['Catalyst 3560-24PS', 'Catalyst 3560-CX (small, quiet)', 'Catalyst 3650 / 3850 (IOS-XE)'],
    band: 'medium',
    check: 'This is the one purchase that changes the course: with it you build SVIs, without it router-on-a-stick.',
  },
  {
    class: 'router',
    label: 'A router with two Ethernet interfaces',
    models: ['ISR 1921 / 2911 (classic IOS)', 'ISR 4321 / 4331 (IOS-XE, has APIs)'],
    band: 'medium',
    check: 'Two routed interfaces minimum — one to the inside, one to the WAN. IOS-XE if you want Week 7 to talk to it.',
  },
  {
    class: 'ap',
    label: 'An access point',
    models: ['Aironet 1832 / 2802 (Mobility Express capable)', 'Catalyst 9105 / 9115'],
    band: 'medium',
    check: 'Either PoE from your switch or an injector in the box — an AP with no power is an ornament.',
  },
  {
    class: 'wlc',
    label: 'A wireless controller',
    models: ['Catalyst 9800-CL (virtual — free to run)', 'AireOS 3504 (hardware)'],
    band: 'low',
    check: 'Run the virtual one first. Hardware controllers are heavy, loud and rarely worth it for one AP.',
  },
  {
    class: 'server',
    label: 'Somewhere to run the tools',
    models: ['Any spare PC with 8 GB', 'A small VM on your laptop', 'A Raspberry Pi 4/5 (NetBox is happy; LibreNMS is slower)'],
    band: 'low',
    check: 'Only needed from Week 5. Until then, nothing to buy.',
  },
];

/** What a team needs before Week 1, as the pre-flight list. */
export const PREFLIGHT: string[] = [
  'The path is declared — emulated or physical — and recorded in the Kit Capability Statement',
  'Every device you have is one row in the Equipment Register, with its software version read off `show version`',
  'Each capability is answered Yes or No with the command output that proves it',
  'You can reach one device and get to a prompt — console cable, terminal program, or the emulator’s console',
  'The machine you work from is named and addressed in the register, so the documentation can refer to it',
];

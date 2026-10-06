# CCNA Network Capstone — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Acquisition & Kit

> Before the build: the kit on the bench and the admin PC. Only what you can touch exists.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| ADMIN-PC | Where you work — console, SSH, browser | Kit & Capability Register |

## Week 1 — Connect

> New: the HQ core and first access switch. Console in, name it, give it a management address.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| SW-CORE-01 | Core switch — SVIs, inter-VLAN routing | Build & Configuration Log |
| SW-ACC-01 | Access switch — offices, trunk to core | Build & Configuration Log |
| Austin HQ | The main site: core, access, servers and the edge | Requirements & Site Survey |

**Process — Connect:** ADMIN-PC → SW-CORE-01 (console · hostname · mgmt IP); SW-CORE-01 → SW-ACC-01 (first uplink).

## Week 2 — Segment

> New: the second access switch, VLANs, trunks and an EtherChannel that survives a pulled cable.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| SW-ACC-02 | Access switch — warehouse IDF, PoE for phones | Build & Configuration Log |
| SRV-CORE | DNS · DHCP · the order system | Build & Configuration Log |
| VLANs | One segment per kind of traffic, with its own gateway | Low-Level Design & IP Plan |
| Trunks | The links that carry every VLAN between switches | Low-Level Design & IP Plan |
| Inter-VLAN routing | SVIs on the core so the segments can reach each other | Low-Level Design & IP Plan |
| EtherChannel | Two cables as one link; survives a pulled cable | Validation & Test Matrix |

**Process — Segment:** SW-ACC-01 → SW-CORE-01 (trunk carries every VLAN); SW-ACC-02 → SW-CORE-01 (EtherChannel — pull one cable).

## Week 3 — Route

> New: both routers, the branch site, the WAN link and the ISP circuit. OSPF and NAT connect it all.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| R1-HQ | Edge router — internet, NAT, OSPF | Build & Configuration Log |
| R2-BR | Branch router — WAN to HQ, OSPF | Build & Configuration Log |
| SW-BR-01 | Branch access switch | Build & Configuration Log |
| Round Rock branch | The second site, joined to HQ over the WAN | Requirements & Site Survey |
| WAN link | The /30 between the sites, in OSPF area 0 | High-Level Design |
| Internet | The one public address the whole company leaves through | High-Level Design |
| ISP circuit | The provider, the circuit id and the gateway on the other end | High-Level Design |

**Process — Route:** R1-HQ → R2-BR (OSPF area 0 over the /30); R1-HQ → isp (NAT · one public address).

## Week 4 — Protect

> New: the access point, the controller, the firewall, AAA, the policy and the hardened management plane.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| AP-01 | Access point — CORP, GUEST and IOT WLANs | Build & Configuration Log |
| FW-HQ | Edge firewall — inspects what the router passes | Security Baseline & ACL Policy |
| WLC-01 | Wireless controller — the WLANs as one system | Build & Configuration Log |
| Access policy | Who may reach what, as ACL rows | Security Baseline & ACL Policy |
| Wireless | Each SSID in its own VLAN; wireless inherits the segmentation | Low-Level Design & IP Plan |
| Management plane | SSH only, no telnet, logging on, a management VLAN | Security Baseline & ACL Policy |
| AAA (RADIUS) | Every device login checked against the server, not a local password | Security Baseline & ACL Policy |

**Process — Protect:** SW-CORE-01 → policy (ACLs from the policy rows); FW-HQ → R1-HQ (inspect what the router passes); AP-01 → SW-ACC-01 (guest Wi-Fi, internet only); SRV-CORE → aaa (RADIUS for every login).

## Week 5 — Operate

> New: config backups. Nothing is built — the network is operated: backups, changes, tickets.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| NETOPS | NetBox · LibreNMS · Oxidized — the advanced weeks | Operations & Change Records |
| Config backups | Every configuration saved automatically after a change | Operations & Change Records |

**Process — Operate:** NETOPS → SW-CORE-01 (config backup, Oxidized); ADMIN-PC → NETOPS (change ticket).

## Week 6 — Observe

> New: the NOC. Syslog and SNMP from every device become alerts, and alerts become tickets.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| NOC | Syslog and SNMP from every device become alerts and tickets | Monitoring & Incident Log |

**Process — Observe:** SW-ACC-01 → NETOPS (syslog · SNMP); NETOPS → ADMIN-PC (alert → ticket).

## Week 7 — Automate

> New: automation. Configuration flows from the source of truth, not from the keyboard.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Automation | Configuration from the source of truth, not the keyboard | Monitoring & Incident Log |

**Process — Automate:** NETOPS → SW-ACC-02 (Ansible, from the source of truth).

## Week 8 — Engineer

> Nothing new is built. Break it, run the incident, write the RCA, hand the network over.

Nothing new is built this week; the process is drawn over the picture.

**Process — Engineer:** SW-ACC-02 → SW-CORE-01 (break it on purpose); ADMIN-PC → NETOPS (incident → RCA); NETOPS → ADMIN-PC (handover).


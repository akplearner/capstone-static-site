# Network+ Capstone Branch — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Preparation

> The simulator installed, a prompt answering, one project file, four focuses named.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Packet Tracer | The sandbox every build and every proof runs in | Lab & Path Register |
| A device prompt | Where every command is typed and every show output pasted from | Lab & Path Register |
| The team | Everyone configures; the focus decides which record each leads | Lab & Path Register |
| 1 Lab & path | Records the simulator, the file and the team | Lab & Path Register |

**Process — The lab, before the design:** team → simulator (one project file); simulator → console (a prompt answers).

## Week 1 — Design

> New: the requirements, the addressing rule, the port map, and every device placed and cabled with neighbours seen.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| SW-01 | Reception: staff PCs, the printer and the guest access point | VLAN & Port Map |
| SW-02 | Consulting rooms: staff PCs and the label printer | VLAN & Port Map |
| R1-BR | Routes between the VLANs and out to the ISP with NAT | Configuration Record |
| 2 Design brief & IP plan | Records the requirements, the rule and every VLAN | Design Brief & IP Plan |
| 3 VLAN & port map | Records every cabled port before a switch is touched | VLAN & Port Map |
| 4 Configuration record | Records every change with the show line that proves it | Configuration Record |

**Process — Week 1: discover, plan, place and cable:** team → vlans (one rule, four VLANs); sw1 → sw2 (cabled as the map says); sw1 → router (neighbours seen).

## Week 2 — Configure

> New: four VLANs on two switches, two trunks, gateways and NAT, DHCP and DNS served, and the test matrix with its MUST FAIL rows.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Four VLANs | One per group, derived from one addressing rule | Design Brief & IP Plan |
| Two trunks | One cable carries every VLAN between the switches and to the router | Configuration Record |
| Gateways and NAT | A subinterface per VLAN, a default route, one public address out | Configuration Record |
| Staff PCs | Get a pool address and prove the paths the policy allows | Services & Verification Log |
| PRINTER-1 | Reachable from Staff, refused to Guest: the rule the matrix proves | Services & Verification Log |
| Guest WiFi | Internet only; the refusal of the practice is the proof | Services & Verification Log |
| ISP | The far end of the default route; the only public address | VLAN & Port Map |
| Test matrix | One row per rule; the refusals are the proof the policy exists | Services & Verification Log |
| 5 Services & verification | Records the pools and the test matrix | Services & Verification Log |

**Process — Week 2: VLANs, trunks, gateways, services:** vlans → sw1 (show vlan brief); trunks → router (show interfaces trunk); gateways → isp (default route · NAT); staffpc → matrix (DHCP, DNS, every rule).

## Week 3 — Operate

> New: logs and backups on the server, the access list that refuses Guest, port security, one change under a record, three faults worked by layer.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Syslog and TFTP server | Receives every log line and holds every configuration backup | Change & Fault Log |
| Access list | The policy as deny lines with match counters | Services & Verification Log |
| Port security | A stray laptop shuts the port instead of joining the network | Configuration Record |
| Change: VLAN 40 | A new room added with a backup, a reviewer and a rollback | Change & Fault Log |
| Three faults | Injected by another team, worked bottom up, closed with the layer | Change & Fault Log |
| Config backups | The way back before any change, and the build the plan loads | Change & Fault Log |
| Logs | Where a fault is found first, in order | Change & Fault Log |
| 6 Change & fault log | Records logs, backups, the change and the faults | Change & Fault Log |

**Process — Week 3: watch it, enforce it, change it, fix it:** sw1 → server (logs and backups); acl → guest (the refusal, counted); change → backups (backup first, then VLAN 40); faults → logs (bottom up, by layer).

## Week 4 — Toward real equipment

> New: real equipment researched against the design, a priced bill of materials, and the migration plan issued with custody.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Real equipment | Two real models per class with the datasheet line that proves them | Equipment Research & BOM |
| 7 Bill of materials | Records every line with a price, a date and a source | Equipment Research & BOM |
| Migration plan | How the simulated build becomes the real branch, honestly | Migration Plan & Handover |
| 8 Migration plan & handover | The capstone: the move, the as-built and custody | Migration Plan & Handover |

**Process — Week 4: research, price, plan the move:** router → research (capabilities, not models); research → bom (priced, dated, sourced); backups → plan (the files the install loads); plan → team (issued with custody).

## Week 5 — On real kit

> Nothing new in the branch: the same build loaded onto borrowed hardware, the matrix rerun, and the differences listed.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| The CCNA kit | The same build on borrowed hardware, differences listed | Migration Plan & Handover |

**Process — Week 5, optional: the same build on hardware:** backups → realkit (loaded, interface names adjusted); realkit → matrix (rerun on copper); realkit → plan (the differences listed).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Network Design (Design Lead) | Leads the design record: requirements, the addressing plan, the VLAN scheme and the map. | Design Brief & IP Plan, Equipment Research & BOM, Migration Plan & Handover | VLAN & Port Map | Lab & Path Register, Services & Verification Log, Change & Fault Log | Routing & Services (Router Lead), Operations (Ops Lead) | Switching (Switch Lead), Routing & Services (Router Lead), Operations (Ops Lead) |
| Switching (Switch Lead) | Leads the switch record: VLANs, trunks, port security and every access port. | VLAN & Port Map | Lab & Path Register, Configuration Record | — | Network Design (Design Lead), Operations (Ops Lead) | Routing & Services (Router Lead), Operations (Ops Lead) |
| Routing & Services (Router Lead) | Leads the router record: gateways, DHCP, DNS, NAT and the access list. | Configuration Record, Services & Verification Log | Design Brief & IP Plan, Change & Fault Log | Equipment Research & BOM, Migration Plan & Handover | Network Design (Design Lead), Switching (Switch Lead), Operations (Ops Lead) | Network Design (Design Lead), Operations (Ops Lead) |
| Operations (Ops Lead) | Leads the operations record: logging, backups, changes, faults and the migration plan. | Lab & Path Register, Change & Fault Log | Services & Verification Log, Equipment Research & BOM, Migration Plan & Handover | Design Brief & IP Plan, VLAN & Port Map, Configuration Record | Network Design (Design Lead), Switching (Switch Lead), Routing & Services (Router Lead) | Network Design (Design Lead), Switching (Switch Lead), Routing & Services (Router Lead) |


# Server+ Build & Handover — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Preparation

> Before the build: the campus LAN and an empty rack. Everything on the right is still to come.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Campus LAN | The network the rack plugs into and the team works from | Architecture Brief |

**Process — Survey the campus:** campus → rack (power · cooling · the uplink drop).

## Week 1 — Bring the Server Up

> New: the rack and the Proxmox host. The one machine you build goes in and comes up.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Rack A | Patch panel, switch, the server and the PDU, labelled and logged | Rack, Power & Asset Register |
| Proxmox host | The one machine you build; every VM runs on it | Hardware Discovery, HCL & Upgrade Plan |

**Process — Bring the server up:** campus → host (console → POST → RAID → install).

## Week 2 — Design & Deploy

> New: the DMZ and private zones with the three base VMs, and the directory role: AD DS, DNS and DHCP on the Windows server.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| DMZ and private zones | Two bridges: public-facing services apart from internal systems | IP Plan & Connectivity Proof |
| websrv | The website — public-facing | Server Bring-Up Log |
| winserver | Windows Server — directory · DNS · DHCP | Server Bring-Up Log |
| linuxsrv | Ubuntu Server — the database | Server Bring-Up Log |
| Directory role | AD DS, DNS and DHCP on the Windows server for the zone | Server Bring-Up Log |

**Process — Build the base VMs:** host → winserver (install · promote the directory); winserver → linuxsrv (DNS · DHCP for the zone); host → websrv (install · first page).

## Week 3 — Network & Operate

> New: the campus edge, the published ports, the DMZ-to-private rule and the tailnet. The campus reaches the site through the host.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Published ports | What the campus reaches through the host, port by port | IP Plan & Connectivity Proof |
| DMZ → private rule | The one thing the DMZ may open into the private zone | Baselines, Policies & Standards |
| Tailnet | Administration from off campus, into both zones | IP Plan & Connectivity Proof |
| Campus edge | Router and firewall: the servers’ only path to the internet | IP Plan & Connectivity Proof |

**Process — Publish the website:** campus → published (HTTP · HTTPS); published → websrv (DNAT :80 :443).

## Week 4 — Secure & Hand Over

> New: the hardening baseline, the backup and its local datastore. Snapshot, restore, patch, and hand it over.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Hardening baseline | The settings every VM must reach before handover | Baselines, Policies & Standards |
| Snapshots and restore | Every VM snapshotted; a restore timed and recorded | DR Plan & As-Built Handover |
| Backup datastore | Where the snapshots live until the fleet’s PBS takes over | DR Plan & As-Built Handover |

**Process — Secure and hand over:** host → backup (snapshot every VM); backup → linuxsrv (restore and time it); tailnet → host (patch over the tailnet).

## Week 5 — Watch & Detect

> New: the monitoring host and your own SIEM. Every VM reports in; the first alert runs the runbook.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| secmon | Monitoring — the advanced track | Operations Log & SOPs |
| wazuh | Wazuh — your own SIEM | Operations Log & SOPs |

**Process — Watch and detect:** websrv → secmon (metrics · logs); winserver → wazuh (Wazuh agent); secmon → campus (alert → runbook).

## Week 6 — The Lab as Code

> New: the tools host. The lab is rebuilt from code and registered in NetBox and GLPI.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| tools | NetBox and GLPI — the registers, as software | Operations Log & SOPs |

**Process — The lab as code:** campus → host (terraform apply); host → tools (register in NetBox · GLPI).

## Week 7 — Join the Fleet

> New: the operations network and your ops VM. The fleet’s Core node holds Git and the golden template.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Operations network | The bridge the ops VM and the Core node talk on | DR Plan & As-Built Handover |
| Ops VM | Your seat in the fleet: playbooks, Git, the golden template | DR Plan & As-Built Handover |

**Process — Join the fleet:** opsVm → core (git push); core → opsVm (golden template); opsVm → host (clone from the template).

## Week 8 — Run It as a Fleet

> New: the fleet’s Core services. Playbooks, central metrics and backups, and a rebuild from Git.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Core services | Git, central metrics, XDR and backups for the whole fleet | DR Plan & As-Built Handover |

**Process — Run it as a fleet:** opsVm → websrv (playbook, idempotent); host → core (metrics · backups → PBS); core → host (rebuild from Git).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Networking (Network Lead) | Leads the network record: cabling, addressing, topology and the connectivity proof. | Architecture Brief, Rack, Power & Asset Register, IP Plan & Connectivity Proof | Hardware Discovery, HCL & Upgrade Plan, Baselines, Policies & Standards, DR Plan & As-Built Handover | — | Windows Platform (Windows Lead), Project Records (Management Lead) | Linux Platform (Linux Lead), Project Records (Management Lead) |
| Windows Platform (Windows Lead) | Leads the Windows record: the Server VM, its roles, patching and its restore. | Server Bring-Up Log, Operations Log & SOPs | Architecture Brief, Rack, Power & Asset Register, IP Plan & Connectivity Proof | — | Linux Platform (Linux Lead), Project Records (Management Lead) | Networking (Network Lead) |
| Linux Platform (Linux Lead) | Leads the Linux record: the hypervisor, the Linux VM, services and snapshots. | Hardware Discovery, HCL & Upgrade Plan, Baselines, Policies & Standards | Server Bring-Up Log, Operations Log & SOPs | — | Networking (Network Lead), Project Records (Management Lead) | Windows Platform (Windows Lead) |
| Project Records (Management Lead) | Leads the records that outlive the build: requirements, assets, change control, handover. | DR Plan & As-Built Handover | — | Architecture Brief, Hardware Discovery, HCL & Upgrade Plan, Server Bring-Up Log, Rack, Power & Asset Register, IP Plan & Connectivity Proof, Baselines, Policies & Standards, Operations Log & SOPs, DR Plan & As-Built Handover | Networking (Network Lead) | Networking (Network Lead), Windows Platform (Windows Lead), Linux Platform (Linux Lead) |


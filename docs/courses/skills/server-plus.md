# Server+ Build & Handover — skills sheet

31 graded tasks · 0 skills · 27 tools · 0 procedures · 2 standards (0 controls cited) · 0 tactics · 0 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |

Graded tasks not yet mapped to a skill: sp-w1-bringup, sp-w1-document, sp-w1-raid, sp-w1-install, sp-w2-business, sp-w2-rackplan, sp-w2-rack, sp-w2-install, sp-w2-deploy, sp-w3-topology, sp-w3-connect, sp-w3-sops, sp-w4-secure, sp-w4-dr, sp-w4-handover, sp-w1-net, sp-w2-net, sp-w3-net, sp-w4-net, sp-w1-win, sp-w2-win, sp-w3-win, sp-w4-win, sp-w1-lnx, sp-w2-lnx, sp-w3-lnx, sp-w4-lnx, sp-w1-mgmt, sp-w2-mgmt, sp-w3-mgmt, sp-w4-mgmt.

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Document what it is; Install Proxmox and get the team in; Prepare the host and create the VMs; Deploy the services and register the software; Record the addresses the machines actually hold; Connect the server and prove it reaches; Harden every server and patch every system; Disaster recovery and a real restore; Deep-dive: bridges and NIC mapping; Deep-dive: routing and the published ports; Deep-dive: recovering the network path; Deep-dive: firmware and virtualization flags; Deep-dive: the hypervisor and Linux baseline; Deep-dive: netplan, persistence and resolution; Deep-dive: the allow-list and the snapshot restore |
| PowerShell | cli | Install Proxmox and get the team in; Prepare the host and create the VMs; Deploy the services and register the software; Connect the server and prove it reaches; Harden every server and patch every system; Deep-dive: the Windows baseline, captured; Deep-dive: password policy and the DHCP scope; Deep-dive: Windows patching and the restore |
| SSH | cli | Install Proxmox and get the team in; Prepare the host and create the VMs; Connect the server and prove it reaches; Harden every server and patch every system |
| curl | cli | Install Proxmox and get the team in; Deploy the services and register the software; Connect the server and prove it reaches; Harden every server and patch every system |
| ping / traceroute | cli | Install Proxmox and get the team in; Prepare the host and create the VMs; Connect the server and prove it reaches |
| nslookup | cli | Deploy the services and register the software; Connect the server and prove it reaches |
| sha256sum | cli | Harden every server and patch every system; Deep-dive: the Windows baseline, captured; Deep-dive: the hypervisor and Linux baseline |
| Capstone forms | document | Document what it is; Build the array; Install Proxmox and get the team in; Scope the startup and draft the architecture; Plan the 24U rack; Rack and cable per the plan; Prepare the host and create the VMs; Deploy the services and register the software; Record the addresses the machines actually hold; Connect the server and prove it reaches; Write the procedures the company will run on; Harden every server and patch every system; Disaster recovery and a real restore; Assemble and hand over the as-built package; Deep-dive: the cabling and port plan; Deep-dive: bridges and NIC mapping; Deep-dive: routing and the published ports; Deep-dive: recovering the network path; Deep-dive: what the Windows VM will need; Deep-dive: the Windows baseline, captured; Deep-dive: password policy and the DHCP scope; Deep-dive: Windows patching and the restore; Deep-dive: firmware and virtualization flags; Deep-dive: the hypervisor and Linux baseline; Deep-dive: netplan, persistence and resolution; Deep-dive: the allow-list and the snapshot restore; Deep-dive: compliance and SLA mapping; Deep-dive: the naming standard, applied; Deep-dive: change control with an approver; Deep-dive: the numbers and the handover |
| Capstone guide | document | Document what it is; Install Proxmox and get the team in; Prepare the host and create the VMs; Deploy the services and register the software; Connect the server and prove it reaches; Harden every server and patch every system |
| Vendor documentation | document | Bring the server up; Document what it is |
| netcat | cli | Connect the server and prove it reaches |
| ufw | cli | Harden every server and patch every system; Deep-dive: the allow-list and the snapshot restore |
| iptables | cli | Prepare the host and create the VMs; Connect the server and prove it reaches; Deep-dive: routing and the published ports |
| OpenSSL | cli | Harden every server and patch every system |
| Windows Firewall | app | Harden every server and patch every system |
| Windows | platform | Install Proxmox and get the team in |
| Windows Server | platform | Deploy the services and register the software; Connect the server and prove it reaches; Harden every server and patch every system |
| nginx | service | Harden every server and patch every system |
| MySQL / MariaDB | service | Deploy the services and register the software; Disaster recovery and a real restore |
| Proxmox VE | platform | Install Proxmox and get the team in; Prepare the host and create the VMs; Connect the server and prove it reaches; Harden every server and patch every system; Disaster recovery and a real restore; Deep-dive: the hypervisor and Linux baseline |
| netplan | cli | Connect the server and prove it reaches; Deep-dive: netplan, persistence and resolution |
| Tailscale | service | Install Proxmox and get the team in; Connect the server and prove it reaches |
| The server | hardware | Bring the server up; Document what it is; Build the array; Install Proxmox and get the team in; Rack and cable per the plan |
| RAID controller utility | hardware | Build the array |
| Hand tools | hardware | Bring the server up; Rack and cable per the plan |
| Patch panel | hardware | Rack and cable per the plan |
| USB install media | hardware | Document what it is; Install Proxmox and get the team in |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | Bring the server up; Document what it is; Build the array; Install Proxmox and get the team in; Scope the startup and draft the architecture; Plan the 24U rack; Rack and cable per the plan; Prepare the host and create the VMs; Deploy the services and register the software; Record the addresses the machines actually hold; Connect the server and prove it reaches; Write the procedures the company will run on; Harden every server and patch every system; Disaster recovery and a real restore; Assemble and hand over the as-built package; Deep-dive: the cabling and port plan; Deep-dive: bridges and NIC mapping; Deep-dive: routing and the published ports; Deep-dive: recovering the network path; Deep-dive: what the Windows VM will need; Deep-dive: the Windows baseline, captured; Deep-dive: password policy and the DHCP scope; Deep-dive: Windows patching and the restore; Deep-dive: firmware and virtualization flags; Deep-dive: the hypervisor and Linux baseline; Deep-dive: netplan, persistence and resolution; Deep-dive: the allow-list and the snapshot restore; Deep-dive: compliance and SLA mapping; Deep-dive: the naming standard, applied; Deep-dive: change control with an approver; Deep-dive: the numbers and the handover | — |
| CIS | Document what it is; Install Proxmox and get the team in; Rack and cable per the plan; Deploy the services and register the software; Connect the server and prove it reaches; Harden every server and patch every system; Assemble and hand over the as-built package | — |

Forms whose standard names a practice rather than a control:

- Architecture Brief: practice.architecture-decision-records
- Hardware Discovery, HCL & Upgrade Plan: practice.asset-inventory
- Server Bring-Up Log: practice.troubleshooting-method, practice.build-record
- Rack, Power & Asset Register: practice.asset-inventory
- IP Plan & Connectivity Proof: practice.addressing-plan, practice.test-and-acceptance
- Baselines, Policies & Standards: practice.hardening-baseline, practice.written-policy
- Operations Log & SOPs: practice.change-control, practice.patch-management, practice.runbooks-written
- DR Plan & As-Built Handover: practice.recovery-objectives, practice.as-built-documentation

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |

Graded tasks not yet mapped to a practice: sp-w1-bringup, sp-w1-document, sp-w1-raid, sp-w1-install, sp-w2-business, sp-w2-rackplan, sp-w2-rack, sp-w2-install, sp-w2-deploy, sp-w3-topology, sp-w3-connect, sp-w3-sops, sp-w4-secure, sp-w4-dr, sp-w4-handover, sp-w1-net, sp-w2-net, sp-w3-net, sp-w4-net, sp-w1-win, sp-w2-win, sp-w3-win, sp-w4-win, sp-w1-lnx, sp-w2-lnx, sp-w3-lnx, sp-w4-lnx, sp-w1-mgmt, sp-w2-mgmt, sp-w3-mgmt, sp-w4-mgmt.


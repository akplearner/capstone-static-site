# Server+ Build & Handover — certification and cost sheet

**CompTIA Server+ (SK0-005)** · associate · exam fee $369 (list price, 2026)

Generated from the certification registry and the course document by `npm run content:export`; edit `src/lib/docs/certs.ts`, `src/lib/docs/costs.ts` or the seed, not this file.

## The ladder

**Server+ (SK0-005)**

## Exam coverage — 100% of the exam weight is practised

| Domain | Weight | Practised by |
| --- | --- | --- |
| Server Hardware Installation and Management | 18% | Bring the server up; Document what it is; Build the array; Plan the 24U rack; Rack and cable per the plan; Wire the ops network; Deep-dive: the cabling and port plan; Deep-dive: firmware and virtualization flags; Deep-dive: the trunk and the fence |
| Server Administration | 30% | Install Proxmox and get the team in; Scope the startup and draft the architecture; Prepare the host and create the VMs; Deploy the services and register the software; Record the addresses the machines actually hold; Write the procedures the company will run on; Assemble and hand over the as-built package; Design the advanced hosts into the brief; The lab as code; The rack and the IP plan become NetBox; Assets and changes become GLPI; Record it in the As-Built; The ops VM: a home for the toolchain; Put the infrastructure in Git; The site from the golden template; Configuration as code; Deep-dive: bridges and NIC mapping; Deep-dive: what the Windows VM will need; Deep-dive: the Windows baseline, captured; Deep-dive: password policy and the DHCP scope; Deep-dive: the hypervisor and Linux baseline; Deep-dive: the naming standard, applied; Deep-dive: change control with an approver; Deep-dive: the numbers and the handover; Deep-dive: IPAM that matches the plan; Deep-dive: change control that the tool enforces; Deep-dive: winserver under Ansible |
| Security and Disaster Recovery | 24% | Harden every server and patch every system; Disaster recovery and a real restore; Pulse: watch the backups; Your own Wazuh; Back up to the vault; The MSP’s XDR over the fleet; Destroy it and rebuild it from Git; Deep-dive: Windows patching and the restore; Deep-dive: the allow-list and the snapshot restore; Deep-dive: compliance and SLA mapping; Deep-dive: the base role as the hardening standard |
| Troubleshooting | 28% | Connect the server and prove it reaches; Watch every host: Prometheus, Grafana, Loki and the alerts; Onboard the site into the Core plane; Deep-dive: routing and the published ports; Deep-dive: recovering the network path; Deep-dive: netplan, persistence and resolution; Deep-dive: winserver fully instrumented; Deep-dive: state that matches reality, logs that reach Loki; Deep-dive: the runbook, the SLO and the demo |

## Cost

Exam $369 · one-off $370 · monthly ceiling $0 · tasks $0

| Item | Kind | Cost | Note |
| --- | --- | --- | --- |
| A second-hand rack server (the one the course diagnoses) | hardware | $250 (approx.) | Order of magnitude; a 1U or 2U server with two disks and an IPMI port. |
| A managed gigabit switch and cables | hardware | $60 (approx.) | Order of magnitude, second-hand. |
| Two 1 TB disks for the array | hardware | $60 (approx.) | New or second-hand; the array needs two. |
| Proxmox VE and Proxmox Backup Server | software | $0 | Free, community repositories. |
| Windows Server evaluation | software | $0 | Free 180-day evaluation. |


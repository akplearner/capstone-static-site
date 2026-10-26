# Server+ Build & Handover — skills sheet

31 graded tasks and 25 advanced · 63 skills · 46 tools · 14 procedures · 2 standards (0 controls cited) · 0 tactics · 33 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Restore from backup and prove it `comp.respond.restore-test` | Incident response | CISSP.d7, SK0-005.d3, NIST.800-53.CP-4 | Disaster recovery and a real restore; Deep-dive: recovering the network path; Deep-dive: Windows patching and the restore; Deep-dive: the allow-list and the snapshot restore |
| Set recovery targets: RTO, RPO, MTTR `comp.respond.recovery-targets` | Incident response | CISSP.d7, SK0-005.d3, AZ-104.d5, SAA-C03.d4, NIST_800_34 | Disaster recovery and a real restore; Deep-dive: the numbers and the handover |
| Receive hardware and list what arrived `comp.hardware.receive-and-inspect` | Server hardware | SK0-005.d1 | Bring the server up |
| Populate memory channels per the manual `comp.hardware.memory-population` | Server hardware | SK0-005.d1 | Bring the server up |
| Audit CPU, memory, storage, network, firmware `comp.hardware.capability-audit` | Server hardware | SK0-005.d1 | Document what it is |
| Look up firmware, support and compatibility `comp.hardware.firmware-lookup` | Server hardware | SK0-005.d1 | Document what it is; Deep-dive: firmware and virtualization flags |
| Choose a RAID level and build the array `comp.hardware.raid-build` | Server hardware | SK0-005.d1 | Build the array |
| Write boot media and set the boot order `comp.hardware.boot-media` | Server hardware | SK0-005.d1 | Install Proxmox and get the team in |
| Plan a rack: positions, airflow, power `comp.hardware.rack-planning` | Server hardware | SK0-005.d1 | Plan the 24U rack |
| Rack, cable and terminate to a plan `comp.hardware.rack-and-cable` | Server hardware | SK0-005.d1 | Rack and cable per the plan; Deep-dive: the cabling and port plan |
| Install a hypervisor on the array `comp.virt.install-hypervisor` | Virtualisation | SK0-005.d2 | Install Proxmox and get the team in; Deep-dive: the hypervisor and Linux baseline |
| Build Linux bridges with host routing and NAT `comp.virt.bridges-and-nat` | Virtualisation | SK0-005.d2, NIST.800-53.SC-7 | Prepare the host and create the VMs; Deep-dive: bridges and NIC mapping |
| Provision VMs on the planned bridges `comp.virt.provision-vms` | Virtualisation | SK0-005.d2 | Prepare the host and create the VMs |
| Troubleshoot with the structured method `comp.sysadmin.troubleshooting-method` | System administration | SK0-005.d4, 200-301.d3, ITIL.problem | Bring the server up |
| Serve a website from the DMZ host `comp.sysadmin.web-server` | System administration | SK0-005.d2 | Deploy the services and register the software |
| Deploy AD DS, DNS and DHCP `comp.sysadmin.windows-roles` | System administration | SK0-005.d2 | Deploy the services and register the software; Deep-dive: the Windows baseline, captured |
| Install a database with an application user `comp.sysadmin.database-server` | System administration | SK0-005.d2, NIST.800-53.AC-6 | Deploy the services and register the software |
| Record the addresses hosts hold `comp.sysadmin.record-addresses` | System administration | SK0-005.d2 | Record the addresses the machines actually hold; Deep-dive: state that matches reality, logs that reach Loki |
| Apply an IP plan that survives a reboot `comp.sysadmin.persistent-addressing` | System administration | SK0-005.d2 | Connect the server and prove it reaches; Deep-dive: netplan, persistence and resolution |
| Harden SSH: named admins, no root login `comp.sysadmin.ssh-hardening` | System administration | SK0-005.d3, CIS.BENCHMARK | Harden every server and patch every system; Deep-dive: the base role as the hardening standard |
| Enable host firewalls with an allow-list `comp.sysadmin.host-firewalls` | System administration | SK0-005.d3, NIST.800-53.SC-7 | Harden every server and patch every system; Deep-dive: the allow-list and the snapshot restore |
| Harden Windows: firewall profiles, named admins, policy `comp.sysadmin.windows-hardening` | System administration | SK0-005.d3, CIS.BENCHMARK | Harden every server and patch every system; Deep-dive: password policy and the DHCP scope |
| Patch systems and record it `comp.sysadmin.patching` | System administration | SK0-005.d3, NIST_800_40 | Deep-dive: Windows patching and the restore |
| Issue API tokens with least privilege `comp.sysadmin.api-tokens` | System administration | SK0-005.d3, NIST.800-53.AC-6 | Pulse: watch the backups; The lab as code |
| Use SSH keys as the fleet credential `comp.sysadmin.ssh-keys` | System administration | SK0-005.d3, NIST.800-53.IA-5 | The ops VM: a home for the toolchain |
| Design network zones and why they exist `comp.network.zone-design` | Network engineering | SK0-005.d2, ISO27001.A.8.22 | Scope the startup and draft the architecture; Design the advanced hosts into the brief |
| Publish a service with DNAT `comp.network.publish-with-dnat` | Network engineering | SK0-005.d2, NIST.800-53.SC-7 | Connect the server and prove it reaches; Deep-dive: routing and the published ports |
| Segment zones with a closed forward policy `comp.network.closed-forward-policy` | Network engineering | SK0-005.d3, NIST.800-53.SC-7 | Connect the server and prove it reaches; Deep-dive: the trunk and the fence |
| Build an out-of-band ops network `comp.network.out-of-band` | Network engineering | SK0-005.d2, 200-301.d2 | Wire the ops network |
| Trunk VLAN-tagged bridges to every host `comp.network.vlan-tagged-bridges` | Network engineering | SK0-005.d2, 200-301.d2 | Wire the ops network; Deep-dive: the trunk and the fence |
| Monitor hosts with metrics and logs `comp.observe.metrics-and-logs` | Monitoring and observability | SK0-005.d2, NIST.CSF.DE.CM | Watch every host: Prometheus, Grafana, Loki and the alerts; Deep-dive: winserver fully instrumented; Deep-dive: state that matches reality, logs that reach Loki |
| Route alerts somewhere that answers `comp.observe.alerting` | Monitoring and observability | SK0-005.d2, ITIL.monitoring | Watch every host: Prometheus, Grafana, Loki and the alerts; Deep-dive: the runbook, the SLO and the demo |
| Watch backup jobs with a read-only token `comp.observe.backup-monitoring` | Monitoring and observability | SK0-005.d3, NIST.800-53.CP-9 | Pulse: watch the backups |
| Deploy a SIEM and enrol agents `comp.observe.siem-deploy` | Monitoring and observability | SK0-005.d3, NIST.CSF.DE.CM | Your own Wazuh |
| Monitor file integrity on servers `comp.observe.file-integrity` | Monitoring and observability | SK0-005.d3, NIST.800-53.SI-4 | Your own Wazuh |
| Onboard targets by file-based discovery `comp.observe.service-discovery` | Monitoring and observability | SK0-005.d2 | Onboard the site into the Core plane |
| Onboard a site into a shared monitoring plane `comp.observe.fleet-onboarding` | Monitoring and observability | SK0-005.d2 | Onboard the site into the Core plane |
| Place hosts in the right SIEM tenancy `comp.observe.siem-tenancy` | Monitoring and observability | SK0-005.d3 | The MSP’s XDR over the fleet |
| Read a configuration assessment score `comp.observe.sca-score` | Monitoring and observability | SK0-005.d3, CIS.BENCHMARK | The MSP’s XDR over the fleet |
| Create VMs from a Terraform plan `comp.automation.terraform-vms` | Automation and infrastructure as code | SK0-005.d2, WAF.operational-excellence | The lab as code; The site from the golden template |
| Run a service with Docker Compose `comp.automation.docker-compose` | Automation and infrastructure as code | SK0-005.d2 | The rack and the IP plan become NetBox |
| Build a stateless ops workstation `comp.automation.ops-workstation` | Automation and infrastructure as code | SK0-005.d2 | The ops VM: a home for the toolchain |
| Keep the infrastructure in Git `comp.automation.infra-in-git` | Automation and infrastructure as code | SK0-005.d2, ITIL.configuration | Put the infrastructure in Git |
| Keep secrets out of version history `comp.automation.secrets-out-of-history` | Automation and infrastructure as code | SK0-005.d3, NIST_800_218 | Put the infrastructure in Git |
| Build hosts from a golden template `comp.automation.golden-images` | Automation and infrastructure as code | SK0-005.d2 | The site from the golden template |
| Read a plan for drift `comp.automation.drift-plan` | Automation and infrastructure as code | SK0-005.d2, WAF.operational-excellence | The site from the golden template |
| Configure hosts with Ansible roles `comp.automation.ansible-roles` | Automation and infrastructure as code | SK0-005.d2, 200-301.d6 | Configuration as code; Deep-dive: winserver under Ansible; Deep-dive: the base role as the hardening standard |
| Drive automation from a dynamic inventory `comp.automation.dynamic-inventory` | Automation and infrastructure as code | SK0-005.d2 | Configuration as code |
| Rebuild a host from the repository `comp.automation.rebuild-from-git` | Automation and infrastructure as code | SK0-005.d3, WAF.reliability | Destroy it and rebuild it from Git |
| Back up to a deduplicating vault `comp.continuity.dedup-backup` | Backup and recovery | SK0-005.d3, ISO27001.A.8.13 | Back up to the vault |
| Verify backups before they are needed `comp.continuity.verify-backups` | Backup and recovery | SK0-005.d3, NIST.800-53.CP-4 | Back up to the vault |
| Turn a business need into an architecture brief `comp.docs.architecture-brief` | Documentation and records | SK0-005.d2, ISO42010 | Scope the startup and draft the architecture |
| Write usable SOPs with owner and trigger `comp.docs.write-sops` | Documentation and records | SK0-005.d2, ISO27001.A.5.37 | Write the procedures the company will run on; Deep-dive: the runbook, the SLO and the demo |
| Record changes with rollback and approver `comp.docs.change-control` | Documentation and records | SK0-005.d2, 200-301.d4, ITIL.change | Write the procedures the company will run on; Deep-dive: change control with an approver |
| Assemble and hand over an as-built package `comp.docs.as-built-handover` | Documentation and records | SK0-005.d2, 200-301.d1, ITIL.transition | Assemble and hand over the as-built package; Record it in the As-Built; Deep-dive: the numbers and the handover |
| Plan capacity for the hosts a brief needs `comp.docs.capacity-planning` | Documentation and records | SK0-005.d2 | Design the advanced hosts into the brief; Deep-dive: what the Windows VM will need |
| Keep racks and addresses as a record `comp.docs.netbox-ipam` | Documentation and records | SK0-005.d2, 200-301.d6, NIST.CSF.ID.AM | The rack and the IP plan become NetBox; Deep-dive: IPAM that matches the plan |
| Keep assets and changes in a management tool `comp.docs.asset-management-tool` | Documentation and records | SK0-005.d2, NIST.CSF.ID.AM | Assets and changes become GLPI |
| Run changes as approved tickets `comp.docs.change-tickets` | Documentation and records | SK0-005.d2, ITIL.change | Assets and changes become GLPI; Deep-dive: change control that the tool enforces |
| Tag and hand over a repository `comp.docs.repository-handover` | Documentation and records | SK0-005.d2, ITIL.transition | Destroy it and rebuild it from Git |
| Document to a professional standard `comp.docs.professional-documentation` | Documentation and records | SK0-005.d2, ISO27001.7.5 | Deep-dive: the cabling and port plan; Deep-dive: bridges and NIC mapping; Deep-dive: routing and the published ports; Deep-dive: recovering the network path; Deep-dive: what the Windows VM will need; Deep-dive: the Windows baseline, captured; Deep-dive: password policy and the DHCP scope; Deep-dive: Windows patching and the restore; Deep-dive: firmware and virtualization flags; Deep-dive: the hypervisor and Linux baseline; Deep-dive: netplan, persistence and resolution; Deep-dive: the allow-list and the snapshot restore; Deep-dive: compliance and SLA mapping; Deep-dive: the naming standard, applied; Deep-dive: change control with an approver; Deep-dive: IPAM that matches the plan; Deep-dive: winserver fully instrumented; Deep-dive: change control that the tool enforces; Deep-dive: winserver under Ansible; Deep-dive: the runbook, the SLO and the demo |
| Map requirements to compliance and SLAs `comp.docs.sla-mapping` | Documentation and records | SK0-005.d2 | Deep-dive: compliance and SLA mapping |
| Apply a naming standard `comp.docs.naming-standard` | Documentation and records | SK0-005.d2 | Deep-dive: the naming standard, applied |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Document what it is; Install Proxmox and get the team in; Prepare the host and create the VMs; Deploy the services and register the software; Record the addresses the machines actually hold; Connect the server and prove it reaches; Harden every server and patch every system; Disaster recovery and a real restore; Watch every host: Prometheus, Grafana, Loki and the alerts; Pulse: watch the backups; Your own Wazuh; The rack and the IP plan become NetBox; Assets and changes become GLPI; Wire the ops network; The ops VM: a home for the toolchain; Put the infrastructure in Git; The site from the golden template; Configuration as code; Onboard the site into the Core plane; Back up to the vault; The MSP’s XDR over the fleet; Destroy it and rebuild it from Git; Deep-dive: bridges and NIC mapping; Deep-dive: routing and the published ports; Deep-dive: recovering the network path; Deep-dive: firmware and virtualization flags; Deep-dive: the hypervisor and Linux baseline; Deep-dive: netplan, persistence and resolution; Deep-dive: the allow-list and the snapshot restore; Deep-dive: state that matches reality, logs that reach Loki; Deep-dive: the trunk and the fence; Deep-dive: the base role as the hardening standard |
| PowerShell | cli | Install Proxmox and get the team in; Prepare the host and create the VMs; Deploy the services and register the software; Connect the server and prove it reaches; Harden every server and patch every system; Watch every host: Prometheus, Grafana, Loki and the alerts; Your own Wazuh; Assets and changes become GLPI; Wire the ops network; Deep-dive: the Windows baseline, captured; Deep-dive: password policy and the DHCP scope; Deep-dive: Windows patching and the restore; Deep-dive: winserver fully instrumented; Deep-dive: winserver under Ansible |
| SSH | cli | Install Proxmox and get the team in; Prepare the host and create the VMs; Connect the server and prove it reaches; Harden every server and patch every system; Your own Wazuh; The ops VM: a home for the toolchain; The site from the golden template; Back up to the vault; Deep-dive: the base role as the hardening standard |
| curl | cli | Install Proxmox and get the team in; Deploy the services and register the software; Connect the server and prove it reaches; Harden every server and patch every system; Watch every host: Prometheus, Grafana, Loki and the alerts; Pulse: watch the backups; Your own Wazuh; The ops VM: a home for the toolchain |
| ping / traceroute | cli | Install Proxmox and get the team in; Prepare the host and create the VMs; Connect the server and prove it reaches; Wire the ops network; The ops VM: a home for the toolchain; Deep-dive: the trunk and the fence |
| nslookup | cli | Deploy the services and register the software; Connect the server and prove it reaches |
| sha256sum | cli | Harden every server and patch every system; Deep-dive: the Windows baseline, captured; Deep-dive: the hypervisor and Linux baseline |
| Capstone forms | document | Document what it is; Build the array; Install Proxmox and get the team in; Scope the startup and draft the architecture; Plan the 24U rack; Rack and cable per the plan; Prepare the host and create the VMs; Deploy the services and register the software; Record the addresses the machines actually hold; Connect the server and prove it reaches; Write the procedures the company will run on; Harden every server and patch every system; Disaster recovery and a real restore; Assemble and hand over the as-built package; Design the advanced hosts into the brief; Record it in the As-Built; Destroy it and rebuild it from Git; Deep-dive: the cabling and port plan; Deep-dive: bridges and NIC mapping; Deep-dive: routing and the published ports; Deep-dive: recovering the network path; Deep-dive: what the Windows VM will need; Deep-dive: the Windows baseline, captured; Deep-dive: password policy and the DHCP scope; Deep-dive: Windows patching and the restore; Deep-dive: firmware and virtualization flags; Deep-dive: the hypervisor and Linux baseline; Deep-dive: netplan, persistence and resolution; Deep-dive: the allow-list and the snapshot restore; Deep-dive: compliance and SLA mapping; Deep-dive: the naming standard, applied; Deep-dive: change control with an approver; Deep-dive: the numbers and the handover; Deep-dive: IPAM that matches the plan; Deep-dive: winserver fully instrumented; Deep-dive: state that matches reality, logs that reach Loki; Deep-dive: change control that the tool enforces; Deep-dive: the trunk and the fence; Deep-dive: winserver under Ansible; Deep-dive: the base role as the hardening standard; Deep-dive: the runbook, the SLO and the demo |
| Capstone guide | document | Document what it is; Install Proxmox and get the team in; Prepare the host and create the VMs; Deploy the services and register the software; Connect the server and prove it reaches; Harden every server and patch every system |
| Vendor documentation | document | Bring the server up; Document what it is |
| netcat | cli | Connect the server and prove it reaches |
| ufw | cli | Harden every server and patch every system; Deep-dive: the allow-list and the snapshot restore |
| iptables | cli | Prepare the host and create the VMs; Connect the server and prove it reaches; Deep-dive: routing and the published ports |
| OpenSSL | cli | Harden every server and patch every system |
| Windows Firewall | app | Harden every server and patch every system; Deep-dive: winserver under Ansible |
| Windows Event Viewer | app | Deep-dive: winserver fully instrumented |
| Windows | platform | Install Proxmox and get the team in |
| Windows Server | platform | Deploy the services and register the software; Connect the server and prove it reaches; Harden every server and patch every system |
| Wazuh | service | Your own Wazuh; Configuration as code; The MSP’s XDR over the fleet |
| nginx | service | Harden every server and patch every system |
| Prometheus | service | Watch every host: Prometheus, Grafana, Loki and the alerts; Onboard the site into the Core plane |
| Grafana | service | Watch every host: Prometheus, Grafana, Loki and the alerts; Configuration as code; Onboard the site into the Core plane |
| Loki | service | Watch every host: Prometheus, Grafana, Loki and the alerts; Onboard the site into the Core plane |
| Pulse | service | Pulse: watch the backups |
| Git | cli | The rack and the IP plan become NetBox; The ops VM: a home for the toolchain; Put the infrastructure in Git; Configuration as code; Onboard the site into the Core plane; Destroy it and rebuild it from Git |
| Gitea | service | Put the infrastructure in Git; Onboard the site into the Core plane |
| Docker | cli | The rack and the IP plan become NetBox; Assets and changes become GLPI |
| MySQL / MariaDB | service | Deploy the services and register the software; Disaster recovery and a real restore |
| Terraform | cli | The lab as code; The ops VM: a home for the toolchain; The site from the golden template; Destroy it and rebuild it from Git; Deep-dive: state that matches reality, logs that reach Loki |
| OpenTofu | cli | The lab as code; The ops VM: a home for the toolchain; The site from the golden template; Destroy it and rebuild it from Git |
| Ansible | cli | The ops VM: a home for the toolchain; Configuration as code; The MSP’s XDR over the fleet; Destroy it and rebuild it from Git; Deep-dive: winserver under Ansible; Deep-dive: the base role as the hardening standard |
| cloud-init | cli | The lab as code; The site from the golden template |
| Proxmox VE | platform | Install Proxmox and get the team in; Prepare the host and create the VMs; Connect the server and prove it reaches; Harden every server and patch every system; Disaster recovery and a real restore; Watch every host: Prometheus, Grafana, Loki and the alerts; Pulse: watch the backups; Your own Wazuh; The lab as code; Wire the ops network; The ops VM: a home for the toolchain; The site from the golden template; Configuration as code; Back up to the vault; The MSP’s XDR over the fleet; Destroy it and rebuild it from Git; Deep-dive: the hypervisor and Linux baseline |
| Proxmox Backup Server | service | Back up to the vault; Deep-dive: the base role as the hardening standard |
| netplan | cli | Connect the server and prove it reaches; Wire the ops network; Deep-dive: netplan, persistence and resolution |
| Tailscale | service | Install Proxmox and get the team in; Connect the server and prove it reaches |
| NetBox | service | The rack and the IP plan become NetBox |
| GLPI | service | Assets and changes become GLPI |
| Cisco IOS | appliance | Deep-dive: the trunk and the fence |
| The Core (lab server) | platform | Wire the ops network; The ops VM: a home for the toolchain; Onboard the site into the Core plane |
| The server | hardware | Bring the server up; Document what it is; Build the array; Install Proxmox and get the team in; Rack and cable per the plan |
| RAID controller utility | hardware | Build the array |
| Hand tools | hardware | Bring the server up; Rack and cable per the plan |
| Patch panel | hardware | Rack and cable per the plan |
| USB install media | hardware | Document what it is; Install Proxmox and get the team in |
| The bench PC | hardware | Bring the server up |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Operational runbook | runbook | ISO27001.A.5.37, NIST.CSF.PR.PS | Operations Log & SOPs | Write the procedures the company will run on; Deep-dive: the runbook, the SLO and the demo |
| Change record | change | ITIL.change, ISO27001.A.8.32, NIST.800-53.CM-3, SOC2.CC8.1 | Operations Log & SOPs | Write the procedures the company will run on; Assets and changes become GLPI; Deep-dive: change control with an approver; Deep-dive: change control that the tool enforces |
| Recovery drill | recovery | NIST.800-34, NIST.CSF.RC.RP, ISO27001.A.5.30, NIST.800-53.CP-4 | DR Plan & As-Built Handover | Disaster recovery and a real restore; Destroy it and rebuild it from Git; Deep-dive: Windows patching and the restore; Deep-dive: the allow-list and the snapshot restore |
| Backup plan | recovery | ISO27001.A.8.13, NIST.800-53.CP-9, CIS.11 | DR Plan & As-Built Handover | Disaster recovery and a real restore; Back up to the vault |
| Hardening baseline | baseline | CIS.BENCHMARK, NIST.800-53.CM-6, ISO27001.A.8.9, NIST.CSF.PR.PS | Baselines, Policies & Standards | Harden every server and patch every system |
| Patch management | patching | NIST.800-40, NIST.800-53.SI-2, ISO27001.A.8.8, CIS.7 | Operations Log & SOPs | Harden every server and patch every system; Deep-dive: Windows patching and the restore |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | DR Plan & As-Built Handover | Assemble and hand over the as-built package |
| Security policy | policy | ISO27001.5.2, ISO27001.A.5.1, NIST.CSF.GV.PO, NIST.800-53.PM-1 | Baselines, Policies & Standards | — |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Hardware Discovery, HCL & Upgrade Plan; Rack, Power & Asset Register | — |
| Architecture record | design | ISO42010, WAF, NIST.800-53.PL-8 | Architecture Brief | — |
| Network design | design | NIST.800-53.SC-7, ISO27001.A.8.22, NIST.CSF.PR.IR | IP Plan & Connectivity Proof | — |
| Requirements record | design | ISO42010, WAF | Architecture Brief | — |
| Build record | build | ITIL.configuration, NIST.800-53.CM-2, ISO27001.A.8.9 | Hardware Discovery, HCL & Upgrade Plan; Server Bring-Up Log | Build the array |
| Test and acceptance record | build | ITIL.transition, NIST.800-53.CA-2, ISO27001.A.8.29 | IP Plan & Connectivity Proof | Connect the server and prove it reaches |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | Bring the server up; Document what it is; Build the array; Install Proxmox and get the team in; Scope the startup and draft the architecture; Plan the 24U rack; Rack and cable per the plan; Prepare the host and create the VMs; Deploy the services and register the software; Record the addresses the machines actually hold; Connect the server and prove it reaches; Write the procedures the company will run on; Harden every server and patch every system; Disaster recovery and a real restore; Assemble and hand over the as-built package; Design the advanced hosts into the brief; Watch every host: Prometheus, Grafana, Loki and the alerts; Pulse: watch the backups; Your own Wazuh; The lab as code; The rack and the IP plan become NetBox; Assets and changes become GLPI; Record it in the As-Built; Wire the ops network; The ops VM: a home for the toolchain; Put the infrastructure in Git; The site from the golden template; Configuration as code; Onboard the site into the Core plane; Back up to the vault; The MSP’s XDR over the fleet; Destroy it and rebuild it from Git; Deep-dive: the cabling and port plan; Deep-dive: bridges and NIC mapping; Deep-dive: routing and the published ports; Deep-dive: recovering the network path; Deep-dive: what the Windows VM will need; Deep-dive: the Windows baseline, captured; Deep-dive: password policy and the DHCP scope; Deep-dive: Windows patching and the restore; Deep-dive: firmware and virtualization flags; Deep-dive: the hypervisor and Linux baseline; Deep-dive: netplan, persistence and resolution; Deep-dive: the allow-list and the snapshot restore; Deep-dive: compliance and SLA mapping; Deep-dive: the naming standard, applied; Deep-dive: change control with an approver; Deep-dive: the numbers and the handover; Deep-dive: IPAM that matches the plan; Deep-dive: winserver fully instrumented; Deep-dive: state that matches reality, logs that reach Loki; Deep-dive: change control that the tool enforces; Deep-dive: the trunk and the fence; Deep-dive: winserver under Ansible; Deep-dive: the base role as the hardening standard; Deep-dive: the runbook, the SLO and the demo | — |
| CIS | Document what it is; Install Proxmox and get the team in; Rack and cable per the plan; Deploy the services and register the software; Connect the server and prove it reaches; Harden every server and patch every system; Assemble and hand over the as-built package; Watch every host: Prometheus, Grafana, Loki and the alerts; Your own Wazuh; The lab as code; Assets and changes become GLPI; The ops VM: a home for the toolchain; Put the infrastructure in Git; The site from the golden template; Configuration as code; Onboard the site into the Core plane; The MSP’s XDR over the fleet | — |

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
| Least privilege | NIST.800-53.AC-6 | Deploy the services and register the software; Harden every server and patch every system; Pulse: watch the backups; The lab as code; The ops VM: a home for the toolchain |
| Default deny | NIST.800-53.SC-7 | Connect the server and prove it reaches; Deep-dive: routing and the published ports; Deep-dive: the allow-list and the snapshot restore |
| Network segmentation | ISO27001.A.8.22 | Scope the startup and draft the architecture; Prepare the host and create the VMs; Connect the server and prove it reaches; Design the advanced hosts into the brief; Wire the ops network; Deep-dive: the trunk and the fence |
| Secrets in a store | NIST.800-53.IA-5 | The lab as code |
| Encryption in transit | NIST.800-53.SC-8 | Harden every server and patch every system |
| Change control | ITIL.change | Write the procedures the company will run on; Assets and changes become GLPI; Onboard the site into the Core plane; Deep-dive: change control with an approver; Deep-dive: change control that the tool enforces |
| Managed patching | NIST_800_40 | Write the procedures the company will run on; Deep-dive: Windows patching and the restore |
| Hardening baseline | CIS.BENCHMARK | Harden every server and patch every system; Configuration as code; Deep-dive: the base role as the hardening standard |
| Configuration scanning | CIS.BENCHMARK | Your own Wazuh; The MSP’s XDR over the fleet |
| Configuration record | ITIL.configuration | Prepare the host and create the VMs; Deploy the services and register the software; Record the addresses the machines actually hold; Deep-dive: the Windows baseline, captured; Deep-dive: the hypervisor and Linux baseline; Deep-dive: netplan, persistence and resolution; Deep-dive: state that matches reality, logs that reach Loki |
| Build record | ITIL.configuration | Bring the server up; Document what it is; Build the array; Install Proxmox and get the team in |
| Infrastructure as code | WAF.operational-excellence | The lab as code; Put the infrastructure in Git; The site from the golden template; Configuration as code; Deep-dive: winserver under Ansible |
| Drift detection | WAF.operational-excellence | The site from the golden template |
| Rebuild, do not repair | WAF.reliability | Destroy it and rebuild it from Git |
| Reproducible builds | NIST_800_218 | Destroy it and rebuild it from Git |
| Secret scanning | NIST_800_218 | Put the infrastructure in Git |
| Naming and tagging | WAF.cost | Deep-dive: the naming standard, applied |
| Backups tested by restore | NIST.800-53.CP-4 | Disaster recovery and a real restore; Back up to the vault; Deep-dive: recovering the network path; Deep-dive: Windows patching and the restore; Deep-dive: the allow-list and the snapshot restore |
| Recovery objectives | NIST_800_34 | Disaster recovery and a real restore; Back up to the vault; Deep-dive: the numbers and the handover |
| Centralised logging | NIST.CSF.DE.CM | Watch every host: Prometheus, Grafana, Loki and the alerts; Your own Wazuh; Onboard the site into the Core plane; The MSP’s XDR over the fleet; Deep-dive: winserver fully instrumented; Deep-dive: state that matches reality, logs that reach Loki |
| Alert to ticket | ITIL.incident | Watch every host: Prometheus, Grafana, Loki and the alerts; Pulse: watch the backups |
| Written policy | NIST.CSF.GV.PO | Deep-dive: password policy and the DHCP scope |
| Written runbooks | ISO27001.A.5.37 | Write the procedures the company will run on; Put the infrastructure in Git; Deep-dive: the runbook, the SLO and the demo |
| Sign and version documents | ISO27001.7.5 | Assemble and hand over the as-built package |
| As-built documentation | ITIL.transition | Record the addresses the machines actually hold; Assemble and hand over the as-built package; Record it in the As-Built; Destroy it and rebuild it from Git; Deep-dive: the cabling and port plan; Deep-dive: bridges and NIC mapping; Deep-dive: routing and the published ports; Deep-dive: recovering the network path; Deep-dive: what the Windows VM will need; Deep-dive: the Windows baseline, captured; Deep-dive: firmware and virtualization flags; Deep-dive: the hypervisor and Linux baseline; Deep-dive: netplan, persistence and resolution; Deep-dive: the numbers and the handover |
| Architecture decision records | ISO_42010 | Build the array |
| Requirements before design | ISO_42010 | Scope the startup and draft the architecture; Design the advanced hosts into the brief; Deep-dive: what the Windows VM will need; Deep-dive: compliance and SLA mapping |
| Addressing plan | NIST.CSF.ID.AM | The rack and the IP plan become NetBox; Wire the ops network; Deep-dive: IPAM that matches the plan |
| Test and acceptance | ITIL.transition | Rack and cable per the plan; Connect the server and prove it reaches |
| Structured troubleshooting | ITIL.problem | Bring the server up |
| Asset inventory | NIST.CSF.ID.AM | Document what it is; Plan the 24U rack; Rack and cable per the plan; The rack and the IP plan become NetBox; Assets and changes become GLPI; Deep-dive: firmware and virtualization flags |
| Metrics with targets | ISO27001.9.1 | Deep-dive: the runbook, the SLO and the demo |
| Idempotent automation | WAF.operational-excellence | Configuration as code |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.ability.skills-verified` | ability | metric.skill-verified (own) | net: 48 skills with a verifiable step; win: 49 skills with a verifiable step; lnx: 48 skills with a verifiable step; mgmt: 47 skills with a verifiable step |
| Exam weight verified `kpi.ability.exam-weight-verified` | ability | metric.domain-weight-verified (own) | net: 100 percent of the exam over 4 domains; win: 100 percent of the exam over 4 domains; lnx: 100 percent of the exam over 4 domains; mgmt: 100 percent of the exam over 4 domains |
| Profile coverage `kpi.ability.profile-coverage` | ability | metric.profile-coverage (own) | net: Network Operations Specialist: 53 required, 29 not taught here; win: System Administrator: 65 required, 21 not taught here; lnx: System Administrator: 65 required, 22 not taught here; mgmt: System Administrator: 65 required, 20 not taught here |
| Skills proved twice `kpi.ability.skills-transferred` | ability | metric.skill-transfer (own) | net: 12 skills on two or more tasks; win: 11 skills on two or more tasks; lnx: 14 skills on two or more tasks; mgmt: 10 skills on two or more tasks |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | net: 15 tasks with two or more verifiable steps; win: 15 tasks with two or more verifiable steps; lnx: 15 tasks with two or more verifiable steps; mgmt: 15 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | net: 56 verifiable steps; win: 58 verifiable steps; lnx: 58 verifiable steps; mgmt: 53 verifiable steps |
| Commands verified `kpi.execution.commands-verified` | execution | metric.tool-commands-verified (own) | net: 56 verifiable steps that run a command; win: 58 verifiable steps that run a command; lnx: 58 verifiable steps that run a command; mgmt: 53 verifiable steps that run a command |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Procedures to standard `kpi.procedure.followed-to-standard` | procedure | metric.procedure-to-standard (team) | net: 14 procedures; win: 14 procedures; lnx: 14 procedures; mgmt: 14 procedures |
| Definition-of-Done met `kpi.procedure.dod-met` | procedure | metric.doc-dod-met (team) | net: 58 checks on 8 forms; win: 58 checks on 8 forms; lnx: 58 checks on 8 forms; mgmt: 58 checks on 8 forms |
| Controls cited `kpi.procedure.controls-cited` | procedure | metric.standard-controls-cited (team) | net: 0 control codes on 3 forms; win: 0 control codes on 2 forms; lnx: 0 control codes on 2 forms; mgmt: 0 control codes on 1 form |
| Document control complete `kpi.procedure.document-control` | procedure | metric.doc-control-complete (team) | net: 8 forms; win: 8 forms; lnx: 8 forms; mgmt: 8 forms |
| Submissions rubric-green `kpi.outcome.rubric-green` | outcome | metric.doc-rubric-green (team) | the submissions the member freezes; no content denominator |
| Hand-offs completed `kpi.outcome.handoffs` | outcome | metric.collab-handoffs (team) | net: 0 hand-offs; win: 0 hand-offs; lnx: 0 hand-offs; mgmt: 0 hand-offs |
| Instructor approved `kpi.outcome.instructor-approved` | outcome | metric.doc-instructor-approved (team) | net: 8 forms; win: 8 forms; lnx: 8 forms; mgmt: 8 forms |
| Capstone filed `kpi.outcome.capstone-filed` | outcome | metric.outcome-capstone-filed (team) | one capstone per course |


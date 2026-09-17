---
title: "Server+ Capstone — Advanced Core Track"
slug: server-plus-advanced
vendor: CompTIA
level: Professional
track: Engagements
duration: "4 weeks (overlay on the Server+ base capstone)"
prerequisite: "server-plus"
summary: "Run the client environment the way a real MSP runs a fleet: infrastructure as code, one observability plane, centralized backup, and XDR — across a classroom of rack servers and workstations."
stack:
  - "Git (Gitea) + IaC pipeline"
  - "Proxmox cloud-init templates + Terraform (bpg provider)"
  - "Ansible (dynamic inventory)"
  - "Prometheus + Grafana + Loki + Alloy + Alertmanager"
  - "Proxmox Backup Server (PBS)"
  - "Wazuh (XDR)"
---

# Advanced Core Track — classroom architecture & build guide

> **Who this is for.** Teams that finished (or are running well ahead in) the base
> Server+ capstone. The base capstone builds *one client site by hand*. The Advanced
> Core track answers the next question a real MSP faces: **"now do that for 16 clients,
> without clicking through 16 consoles."**

**The shift in mindset:** stop administering *servers* and start administering a
*fleet*. Everything you built by hand becomes code, every machine reports to one
observability plane, every backup lands in one vault, and every endpoint reports to
one XDR.

---

## Part 0 — The one architectural decision that makes this work

You have a room full of rack servers and workstations. There are two ways to lay this
out, and only one of them finishes in four weeks.

| | ❌ Everyone builds everything | ✅ **Hub and spoke** (do this) |
|---|---|---|
| Shared services | Each of the 16 teams installs its own Prometheus, Grafana, Loki, Wazuh, PBS, Git | **One Core node** runs them once, for the whole class |
| RAM cost | ~16 × 30 GB of duplicated platform | One node carries the platform; team nodes carry client workloads |
| Instructor load | 16 broken Wazuh installs to debug | One stack to keep healthy |
| What students learn | How to install a dashboard | How to **onboard a client into an existing platform** — which is the actual MSP job |
| Time to first value | Days | Under an hour |

> 🏢 **In the field:** an MSP does not stand up a new SIEM for every customer. It has
> *one* platform and onboards clients into it with agents, labels, and tenancy. The
> hub-and-spoke build isn't a classroom shortcut — it's the real operating model.

### The resulting shape

```
        ┌──────────────────────────────────────────────────────────────┐
        │  CORE NODE  (instructor-owned rack server)  "the MSP NOC"     │
        │                                                               │
        │  git.lab      Gitea — all IaC lives here                      │
        │  obs.lab      Prometheus · Grafana · Loki · Alertmanager      │
        │  xdr.lab      Wazuh manager + indexer + dashboard             │
        │  pbs.lab      Proxmox Backup Server (the vault)               │
        │  cache.lab    apt-cacher-ng + ISO/template store              │
        └───────────────────────────┬──────────────────────────────────┘
                                    │   OPS NETWORK  10.20.0.0/16
      ┌──────────────┬──────────────┼──────────────┬──────────────┐
      ▼              ▼              ▼              ▼              ▼
 ┌─────────┐   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
 │ TEAM 01 │   │ TEAM 02 │    │ TEAM 03 │ …  │ TEAM 15 │    │ TEAM 16 │
 │ Proxmox │   │ Proxmox │    │ Proxmox │    │ Proxmox │    │ Proxmox │
 │ node    │   │ node    │    │ node    │    │ node    │    │ node    │
 │ (client │   │         │    │         │    │         │    │         │
 │  site)  │   │         │    │         │    │         │    │         │
 └─────────┘   └─────────┘    └─────────┘    └─────────┘    └─────────┘
      ▲
      │  students drive from WORKSTATIONS (browser + SSH only — no state)
```

**Three roles for three kinds of hardware:**

| Hardware | Role | Rule |
|---|---|---|
| **1 × best rack server** | **Core node** — the MSP's own platform | Instructor-owned. Students get accounts, not root. |
| **N × rack servers** | **Team nodes** — one client site each | Students own these completely (root, break it, rebuild it) |
| **Workstations** | **Control stations** | **Stateless.** Browser + SSH client only. No tools installed, no student files. |

> ⚠️ **Why workstations must be stateless:** classroom workstations get reimaged,
> reassigned, and shared between sections. If a student's Terraform state, SSH keys,
> or playbooks live on a workstation, that work disappears. **All student toolchain
> state lives on a per-team `ops` VM** on their own Proxmox node. The workstation is
> a window, not a computer. This single decision eliminates most "it worked yesterday"
> support tickets.

---

## Part 1 — Addressing: the formula that prevents the #1 failure

In the base capstone every team used the *same* private ranges (172.16.0.0/24,
192.168.0.0/24). That worked because teams were islands. **The moment you centralize
monitoring, identical addresses across 16 teams become unusable** — Prometheus can't
scrape two different `192.168.0.10`s, and Ansible can't tell them apart.

**Fix it with one rule: the third octet is the team number.**

| Network | Formula (team **N**) | Team 07 example | Purpose |
|---|---|---|---|
| Proxmox host mgmt | `10.10.10.(50+N)` | `10.10.10.57` | Node management (school LAN) |
| **Ops / management** | `10.20.N.0/24` | `10.20.7.0/24` | **Monitoring, Ansible, backup — the spine** |
| DMZ (vmbr1) | `172.16.N.0/24` | `172.16.7.0/24` | Client web / jump box |
| Private LAN (vmbr2) | `192.168.N.0/24` | `192.168.7.0/24` | Client DNS/DHCP/DB/files |

**Within each subnet, keep the host octet identical across teams:**

| Host octet | Machine |
|---|---|
| `.1` | gateway / bridge |
| `.10` | Windows server |
| `.20` | Linux server |
| `.30` | jump box / ops VM |
| `.100–.200` | DHCP pool |

Now `10.20.7.20` is *always* team 7's Linux box, on every team, forever. A student can
read an alert and know exactly whose machine it is without a lookup. That is what
"clear" buys you.

### The Ops network (the spine)

Give every server VM a **second NIC** on a shared bridge (`vmbr9`, VLAN 20 →
`10.20.0.0/16`) that reaches the Core node. Core services sit at:

| Service | Address |
|---|---|
| Gitea | `10.20.0.10` |
| Observability (Prometheus/Grafana/Loki/Alertmanager) | `10.20.0.11` |
| Wazuh | `10.20.0.12` |
| PBS | `10.20.0.13` |
| apt-cache / templates | `10.20.0.14` |

**Why a dedicated ops network rather than routing into each team's private LAN:**
one flat, predictable path for management traffic; Prometheus can *pull* directly;
Ansible and PBS reach every host the same way; and no NAT rules to debug. It also
teaches the real pattern — **out-of-band management separated from user traffic**,
which is exactly why `vmbr0` was management-only in the base build.

> Treat the ops network as privileged: no client/user traffic on it, and firewall it
> so team nodes can reach Core services but not each other.

#### ⚠️ The ops bridge must have a physical uplink

A bridge created with `bridge_ports none` is **internal to one Proxmox host** — VMs on
it can talk to each other and to the host, and nothing else. That is correct for the
client-internal bridges (`vmbr1`, `vmbr2`), but the ops network has to span **every
rack server**, so it needs real wire behind it.

Back `vmbr9` with a physical NIC, ideally as a tagged VLAN on your switch trunk:

```bash
# /etc/network/interfaces on EVERY node (Core and team nodes)
auto vmbr9
iface vmbr9 inet static
    address 10.20.<N>.1/24        # Core uses 10.20.0.1/24
    bridge_ports eno2.20          # physical NIC, VLAN 20 tagged
    bridge_stp off
    bridge_fd 0
```

- **Two or more NICs (preferred):** `eno1` → `vmbr0` (school LAN / Proxmox mgmt), `eno2` → `vmbr9` (ops VLAN 20). Clean physical separation, and backup traffic never touches the school LAN.
- **One NIC only:** trunk the port and run `vmbr0` untagged (native) with `vmbr9` on `eno1.20`. Same logical result, shared bandwidth.
- **Switch side:** VLAN 20 must be allowed on every server port. Configuring that trunk is a natural task for the **Networking Specialist** — it's the one place the Cisco gear (`vmbr3`) becomes load-bearing.

> Without the VLAN trunk, teams will build everything correctly and Prometheus will
> still show every target DOWN. Verify the ops path *first*: from a team node,
> `ping 10.20.0.11` must succeed before anyone installs an exporter.

### Where the Advanced Core sits: OOB vs. vmbr0

Short version: **OOB (`vmbr9`) for the server fleet, and dual-home the Core collector
onto `vmbr0`** so it can also see the classroom workstations. Don't move the whole
platform onto `vmbr0`.

| Option | Verdict |
|---|---|
| Everything on `vmbr0` (school LAN) | ❌ You don't control that network — DHCP, other classes, and IT policy all sit on it. PBS backup traffic will saturate it, the management plane gets exposed to every device in the building, and the OOB-separation lesson disappears. |
| Everything on `vmbr9` (pure OOB) | ⚠️ Correct for servers, but physical workstations aren't on it and you shouldn't re-address school-managed machines to get them there. |
| **Dual-homed Core** | ✅ **Do this.** Server fleet collected over OOB; workstations collected over the school LAN; students reach the dashboards from their desks. |

**Give the Core observability and Wazuh VMs two NICs:**

| NIC | Bridge | Reaches |
|---|---|---|
| `net0` | `vmbr9` (ops, `10.20.0.11`) | All 16 team nodes and their server VMs — scraping, Loki, PBS, Ansible |
| `net1` | `vmbr0` (school LAN, `10.10.10.x`) | Classroom workstations, plus student browsers hitting Grafana/Wazuh UIs |

This is standard practice — a collector legitimately lives on both the management
plane and the user plane, precisely because it has to observe both.

**Monitoring the workstations** then works without moving them: install
`windows_exporter` (metrics) and the **Wazuh agent** (logs, FIM, SCA) and point them at
the Core node's school-LAN address. Treat the workstation fleet as a **second client**
in the engagement — an "endpoint fleet" alongside the server site. That's exactly how
an MSP is structured, and it gives the Wazuh work far more realistic volume.

> ⚠️ **Two cautions before you agent the workstations.** (1) Get sign-off from school
> IT — installing agents on managed machines is their call, not yours. (2) Reimaged
> workstations create duplicate and stale agents. Name agents from the **asset tag**,
> not the hostname, and prune stale entries at the start of each term.

### Where Terraform and Ansible actually connect

These two use *different* paths, and mixing them up is a common first-day blocker:

| Tool | Talks to | Over | Address |
|---|---|---|---|
| **Terraform** | the Proxmox **API** | `vmbr0` / school LAN | `https://10.10.10.(50+N):8006` |
| **Ansible** | the **VMs** over SSH | `vmbr9` ops network | `10.20.N.x` |
| **Ansible dynamic inventory** | the Proxmox **API** | `vmbr0` / school LAN | same endpoint as Terraform |

So the team's **`ops` VM needs a leg on both**: `vmbr0` to reach the Proxmox API (for
Terraform and for inventory) and `vmbr9` to reach the machines it configures.

```
ops VM  net0 → vmbr0  (10.10.10.x)   → Proxmox API :8006   [Terraform, inventory]
        net1 → vmbr9  (10.20.N.30)   → managed VMs :22     [Ansible, SSH]
```

> ✅ **Verify the plumbing before building anything:** from the ops VM,
> `curl -k https://10.10.10.<node>:8006` returns the API, **and** `ping 10.20.0.11`
> reaches Core. If either fails, fix it now — every later step depends on both.

---

## Part 2 — Version compatibility (read before you install anything)

✅ **Proxmox VE 8.x / 9.x — this is what the class installs from the new USB media.**

The maintained Terraform/OpenTofu provider (`bpg/terraform-provider-proxmox`) supports
**Proxmox VE 8.x and 9.x** (9.x is the primary test target; 8.x supported with some
limits) and **does not support 7.x or earlier**. Running 8.x/9.x is therefore the
correct choice and no provider workaround is needed.

> ⚠️ **Retire the old media.** Any leftover **Proxmox VE 6.4-1** USB sticks or the
> 6.4 ISO reference in the base Week 1 guide will produce a node the Terraform
> provider cannot manage — and 6.4 is long past end of life. Re-flash the old sticks
> and update the Week 1 ISO reference so the whole class is on one release.

Other version notes worth knowing:

- **Use Grafana Alloy, not Promtail.** Promtail was deprecated in Feb 2025 and reached **end-of-life on March 2, 2026**. It receives no fixes. Alloy is Grafana's OpenTelemetry-based successor and handles logs *and* metrics in one agent. (If you inherit a Promtail config: `alloy convert --source-format=promtail …`.)
- **Terraform vs OpenTofu** — the bpg provider works with both. Either is fine; pick one for the whole class. On the platform each team sets it under Lab access on the course page, and every `terraform` line becomes `tofu`.

---

## Part 3 — Build order (fast path)

Order matters. Each layer makes the next one faster.

### Instructor — Day 0 (before students arrive)

Budget about half a day. Everything after this is student work.

1. **Core node**: install current Proxmox; create the `vmbr9` ops bridge (`10.20.0.1/16`).
2. **`cache.lab`** — `apt-cacher-ng` + an ISO/template store. **Do this first.** Sixteen teams pulling packages over a school link is the single biggest time sink in the room; a local cache turns a 10-minute install into 30 seconds.
3. **`git.lab`** — Gitea. Create an org per team, plus a `platform` repo with starter Terraform/Ansible skeletons.
4. **`obs.lab`** — Prometheus, Grafana, Loki, Alertmanager.
5. **`xdr.lab`** — Wazuh all-in-one; create agent groups `team-01 … team-16`.
6. **`pbs.lab`** — Proxmox Backup Server; datastore on the biggest disk you have; one namespace per team.
7. **Golden template** — build the Ubuntu cloud-init template *once* (below) and publish it so every team clones the same image.
8. Hand each team: node IP, team number, Gitea org, PBS namespace, Wazuh enrollment key, ops subnet.

### Teams — the layering sequence

```
 1. ops VM  ──▶ 2. Git repo ──▶ 3. Template ──▶ 4. Terraform ──▶ 5. Ansible
                                                                      │
                              ┌───────────────────────────────────────┘
                              ▼
 6. Exporters+Alloy ──▶ 7. Dashboards+Alerts ──▶ 8. PBS backup ──▶ 9. Wazuh agents
                                                                      │
                                                                      ▼
                                                        10. Verify: restore + alert test
```

Never skip ahead. Ansible before Terraform means hand-built VMs; dashboards before
exporters means empty graphs.

---

## Part 4 — The components

Each component below follows: **why it exists → where it runs → build it → ✅ verify → 📎 deliverable.**

### 4.1 The team `ops` VM (do this first)

**Why:** the student toolchain needs a permanent home that isn't a classroom workstation.
**Where:** team node, on `vmbr9` + DMZ, at `10.20.N.30`.

```bash
# on the ops VM
sudo apt update && sudo apt install -y git ansible python3-proxmoxer python3-requests
# Terraform (or OpenTofu) per current install docs, then:
terraform -version
ansible --version
ssh-keygen -t ed25519 -C "team<N>-ops"     # this key is your fleet key
```

> ✅ **Verify:** `terraform -version` and `ansible --version` both return; you can SSH from a workstation to `10.20.N.30`.
> 📎 **Deliverable:** ops VM documented in the IP Plan and Asset Register.

---

### 4.2 Git — where infrastructure lives

**Why:** IaC that isn't in version control is just scripts on someone's laptop. Git gives you history, review, rollback, and a single source of truth.
**Where:** Gitea on Core (`10.20.0.10`), one repo per team.

Repo layout — keep it boring and identical across teams:

```
team<N>-infra/
├── README.md                 # how to run this repo, from zero
├── terraform/
│   ├── main.tf   providers.tf   variables.tf   outputs.tf
│   └── terraform.tfvars        # gitignored — holds the API token
├── ansible/
│   ├── inventory.proxmox.yml   # dynamic inventory
│   ├── site.yml
│   └── roles/{base,monitoring,wazuh_agent,webserver,database}/
├── docs/                     # runbooks, diagrams
└── .gitignore                # *.tfvars, *.tfstate*, vault pw, keys
```

**Secrets rule (non-negotiable):** no tokens, passwords, or keys in Git. Use
`ansible-vault` for playbook secrets and a **gitignored** `terraform.tfvars` for the
API token. Teach this on day one — students who hardcode credentials now will do it
in production later.

> ✅ **Verify:** `git log` shows commits from every team member; `git status` is clean; no secret matches (`git grep -iE "password|token|secret"` returns nothing real).
> 📎 **Deliverable:** the repo itself, with a README a stranger could follow.

---

### 4.3 Golden template — the biggest speed lever

**Why:** an ISO install takes 15–25 minutes and is different every time. A cloud-init
template clone takes **seconds** and is identical every time. This is what makes
Terraform worth using.
**Where:** built once per node (or built on Core and distributed).

```bash
# on the Proxmox node
wget https://cloud-images.ubuntu.com/jammy/current/jammy-server-cloudimg-amd64.img

qm create 9000 --name ubuntu-2204-tmpl --memory 2048 --cores 2 \
  --net0 virtio,bridge=vmbr9 --scsihw virtio-scsi-pci
qm importdisk 9000 jammy-server-cloudimg-amd64.img local-lvm
qm set 9000 --scsi0 local-lvm:vm-9000-disk-0
qm set 9000 --ide2 local-lvm:cloudinit
qm set 9000 --boot order=scsi0 --serial0 socket --vga serial0
qm set 9000 --agent enabled=1
qm template 9000
```

> ✅ **Verify:** `qm clone 9000 999 --name testclone` then boot it — it comes up with a DHCP address and the QEMU guest agent reporting in the Proxmox UI. Delete the test clone.
> 📎 **Deliverable:** template ID + build steps in the runbook.

---

### 4.4 Terraform — VMs as code

**Why:** the client environment becomes reproducible. Destroy it, re-apply, get the same thing. This is what separates "I built a server" from "I can deliver this build repeatedly."
**Where:** run from the ops VM; state stays local and gets backed up by PBS.

First, a scoped API token (don't use root):

```bash
# on the Proxmox node
pveum role add Terraform -privs "VM.Allocate VM.Clone VM.Config.CDROM VM.Config.CPU \
  VM.Config.Cloudinit VM.Config.Disk VM.Config.HWType VM.Config.Memory \
  VM.Config.Network VM.Config.Options VM.Monitor VM.Audit VM.PowerMgmt \
  Datastore.AllocateSpace Datastore.Audit Sys.Audit"
pveum user add terraform@pve
pveum aclmod / -user terraform@pve -role Terraform
pveum user token add terraform@pve tf --privsep 0
# copy the token value — it is shown once
```

`providers.tf`:

```hcl
terraform {
  required_providers {
    proxmox = { source = "bpg/proxmox", version = "~> 0.66" }
  }
}

provider "proxmox" {
  endpoint  = "https://10.10.10.57:8006/"   # your node
  api_token = var.pve_token                 # from gitignored tfvars
  insecure  = true                          # lab only
}
```

`main.tf` — clone the template into the client's servers:

```hcl
variable "team" { default = 7 }

resource "proxmox_virtual_environment_vm" "linux_web" {
  name      = "team${var.team}-web"
  node_name = "pve-team${var.team}"

  clone { vm_id = 9000 }

  cpu    { cores = 2 }
  memory { dedicated = 2048 }

  initialization {
    ip_config {
      ipv4 { address = "10.20.${var.team}.20/24", gateway = "10.20.${var.team}.1" }
    }
    user_account { username = "ops", keys = [file("~/.ssh/id_ed25519.pub")] }
  }

  network_device { bridge = "vmbr9" }   # ops network
  network_device { bridge = "vmbr2" }   # client private LAN
}
```

> ✅ **Verify:** `terraform plan` shows the intended changes; `terraform apply` creates the VM; **`terraform plan` again reports "No changes"** — that's the real proof your code matches reality.
> 📎 **Deliverable:** committed Terraform + saved `plan`/`apply` output.

---

### 4.5 Ansible — configuration as code

**Why:** Terraform makes the box; Ansible makes it *a server*. And unlike a shell script, a playbook is **idempotent** — safe to run a hundred times.
**Where:** ops VM, against hosts on the ops network.

**Dynamic inventory** (no hand-maintained host list — the hypervisor *is* the inventory):

```yaml
# ansible/inventory.proxmox.yml
plugin: community.general.proxmox
url: https://10.10.10.57:8006
user: ansible@pve
token_name: ans
token_value: "{{ lookup('env','PVE_TOKEN') }}"
validate_certs: false
want_facts: true
keyed_groups:
  - key: proxmox_tags_parsed
    prefix: tag
```

```bash
ansible-inventory -i inventory.proxmox.yml --graph
```

Minimum role set: `base` (users, SSH hardening, chrony, apt-cache), `monitoring`
(node_exporter + Alloy), `wazuh_agent`, then service roles.

> ✅ **Verify (the signature check):** run `ansible-playbook site.yml` **twice**. The second run must report **`changed=0`**. Non-zero means your playbook isn't idempotent — it's a script in disguise. Capture both summary lines.
> 📎 **Deliverable:** roles in Git + the two run summaries proving idempotence.

---

### 4.6 Observability — Prometheus, Grafana, Loki, Alloy

**Why:** metrics tell you *that* something is wrong; logs tell you *why*. You need both, in one place, for the whole fleet.
**Where:** server side on Core (`10.20.0.11`); agents on every team VM.

**Agents (via the Ansible `monitoring` role):**
- `node_exporter` → host metrics on `:9100`
- `windows_exporter` → Windows metrics on `:9182`
- **Grafana Alloy** → ships logs to Loki (and can scrape metrics too)

**The label that makes 16 teams manageable.** Every target carries `team="N"`. One
dashboard with a `$team` variable then serves the entire class, and alerts route by team.

```yaml
# prometheus.yml (Core) — file_sd, one file per team, generated by Ansible
scrape_configs:
  - job_name: 'fleet-linux'
    file_sd_configs:
      - files: ['/etc/prometheus/targets/team-*.yml']
```

```yaml
# /etc/prometheus/targets/team-07.yml
- targets: ['10.20.7.10:9182','10.20.7.20:9100','10.20.7.30:9100']
  labels:
    team: "07"
    client: "granite-peak"
```

**Alertmanager** — start with three alerts that actually matter:
`InstanceDown` (up == 0 for 5m) · `DiskAlmostFull` (<10% free) · `ServiceDown`
(web/db probe failing). Route by the `team` label.

> ✅ **Verify:** Prometheus **Targets** page shows all your endpoints **UP**; a Grafana dashboard filtered to your team shows live CPU/RAM/disk; Loki returns your syslog for `{team="07"}`; then **deliberately stop a service** and watch the alert fire and resolve.
> 📎 **Deliverable:** dashboard screenshot/export + the fired-and-resolved alert.

---

### 4.7 Proxmox Backup Server — the vault

**Why:** this is the piece that turns the base capstone's "restore a file" into a real, measurable recovery. PBS does deduplicated incrementals and — critically — **verify jobs** that prove a backup is readable *before* you need it.
**Where:** `pbs.lab` on Core, one namespace per team.

```bash
# on PBS (instructor)
proxmox-backup-manager datastore create vault /mnt/datastore/vault
proxmox-backup-manager namespace create --store vault --ns team07
```

On the team node: **Datacenter → Storage → Add → Proxmox Backup Server** (fingerprint
from `proxmox-backup-manager cert info`), then **Datacenter → Backup → Add** for a
nightly job, and **Verify Jobs** on the datastore.

> ✅ **Verify:** a backup job completes; a **verify job** passes; then do a real restore — `qm destroy` a test VM and bring it back from PBS, **timing it** and comparing against the RTO in your DR plan.
> 📎 **Deliverable:** backup + verify + restore evidence with the **measured recovery time**.

---

### 4.8 Wazuh — XDR across the fleet

**Why:** file integrity monitoring, log analysis, vulnerability detection, and CIS-style config assessment on every host — the security layer over everything you built.
**Where:** manager on Core (`10.20.0.12`); agents deployed by Ansible.

Enroll agents into the **group `team-N`** so each team sees only its own estate and you can filter cleanly.

> ✅ **Verify:** all your agents show **Active**; the **SCA** module returns a hardening score; **FIM** fires when you touch a watched file (`echo test | sudo tee -a /etc/passwd.bak`); the vulnerability module lists CVEs for your hosts.
> 📎 **Deliverable:** agent list, SCA score before/after Ansible hardening, one FIM detection.

---

## Part 5 — Resource budget (the real constraint)

Plan RAM before you plan features. Rough figures — measure yours.

**Core node (instructor):**

| Service | vCPU | RAM | Disk | Notes |
|---|---|---|---|---|
| Gitea | 2 | 2 GB | 40 GB | LXC is fine |
| Prometheus + Grafana + Alertmanager | 4 | 8 GB | 200 GB | scales with retention |
| Loki | 2 | 4 GB | 200 GB+ | logs grow fast — set retention |
| Wazuh all-in-one | 8 | 16 GB | 300 GB+ | the heaviest component |
| PBS | 4 | 8 GB | **2 TB+** | dedup wants disk, not RAM |
| apt-cache / templates | 2 | 2 GB | 200 GB | pays for itself hourly |
| **Total** | **~22** | **~40 GB** | **~3 TB** | a 64 GB rack server is comfortable |

**Team node (per team):** base capstone VMs (~12 GB) + ops VM (2 GB) + exporters
(negligible) ≈ **16 GB minimum, 32 GB comfortable**.

**Three levers if you're short:**
1. Cut Loki/Prometheus retention to 7–15 days.
2. Run Gitea, apt-cache, and exporters as **LXC containers** instead of VMs.
3. Pair teams onto one node (two client sites per node) — the addressing formula already keeps them separate.

---

## Part 6 — Four-week overlay

The advanced work layers *on top of* the base weeks — it doesn't replace them.

| Week | Base track | **Advanced Core adds** | Advanced gate |
|---|---|---|---|
| **1** Discovery & Foundation | Assess, design, Proxmox, bridges | ops VM · Git repo · **golden template** · Terraform builds the VMs | `terraform apply` builds the environment; second `plan` = no changes |
| **2** Service Deployment | DNS/DHCP, NGINX/MariaDB | **Ansible roles** configure the services · exporters + Alloy · Grafana dashboard | Playbook runs twice with **`changed=0`**; dashboard live |
| **3** Security & Resilience | Hardening, firewall, backups | **Wazuh** agents + SCA · **PBS** backup + verify jobs · Alertmanager rules | Alert fires and resolves; verify job passes; SCA score improved by a hardening role |
| **4** Validation & Handover | DR test, as-built, demo | **PBS full-VM restore with measured RTO** · rebuild-from-code demo · SLO report | Environment rebuilt from Git alone; restore inside RTO |

**The Week 4 advanced demo — the moment that proves the whole track:**
destroy a VM, then rebuild it from Git (`terraform apply` → `ansible-playbook`), and
show it reappearing in Grafana and Wazuh on its own. That is a genuinely impressive
thing to show a room — and a real MSP capability.

---

## Part 7 — Advanced deliverables

Client/portfolio-grade, on top of the base package:

| Deliverable | What proves it |
|---|---|
| **Infrastructure-as-Code repository** | Git repo, README, tagged release, clean history, no secrets |
| **Reproducibility evidence** | `terraform plan` = no changes; Ansible `changed=0` on second run |
| **Monitoring & SLO report** | Grafana dashboard + a monthly uptime/availability summary per client |
| **Alerting runbook** | Each alert: what it means, who it pages, first three troubleshooting steps |
| **Backup & recovery evidence** | PBS backup + **verify** + full VM restore with **measured RTO vs. target** |
| **Security posture report** | Wazuh agent coverage, SCA score before/after hardening, FIM detection, CVE list |
| **Rebuild-from-code demo** | Video or live: destroy → re-apply → service back in monitoring |

---

## Part 8 — Pitfalls (learned the hard way)

1. **Overlapping IP ranges.** The #1 killer. Enforce the team-octet formula on day one; it cannot be retrofitted cheaply.
2. **No time sync.** Skewed clocks silently break Kerberos, TLS, and log correlation. Point everything at one NTP source (`chrony` → Core) in the Ansible `base` role. Cheap to do, miserable to debug.
3. **16 teams downloading the same packages.** Stand up `apt-cacher-ng` before anything else.
4. **Unbounded log/metric growth.** Loki and Prometheus will eat the disk. Set retention on day one.
5. **Secrets committed to Git.** Add `.gitignore` *before* the first commit, and check with `git grep`. Rotate anything leaked.
6. **Duplicate Wazuh agent names.** Two agents with the same name means one silently never reports. Name them `team<N>-<host>`.
7. **Terraform state loss.** State lives on the ops VM — so the ops VM must be in the PBS backup job. Losing state means Terraform no longer knows what it owns.
8. **Dashboards before exporters.** Empty graphs demoralize students. Get one target green before you open Grafana.
9. **Doing it by hand "just this once."** Any change made in the Proxmox GUI instead of code causes drift, and the next `terraform apply` may revert or destroy it. If it isn't in code, it doesn't exist.

---

## Part 9 — What comes after (the stretch shelf)

Once Advanced Core is solid, these are the natural next layers — pick by interest, they're independent:

- **NetBox** — network source of truth that *drives* Ansible's inventory (the real reason to run it).
- **GLPI** — ITSM: tickets, licenses, warranties. **Draw the line clearly:** NetBox = network/DCIM truth feeding automation; GLPI = tickets and lifecycle. Without that split you get duplicate asset data and no automation.
- **Alert → ticket integration** — Alertmanager webhook into GLPI. One integration that teaches more about operations than either tool alone.
- **Proxmox clustering + HA** — live migration and failover (needs 3 nodes, or 2 + QDevice, for quorum).
- **Packer** — build the golden image as code instead of by hand.
- **Vault / SOPS** — real secrets management beyond `ansible-vault`.
- **OpenSCAP / Lynis** — CIS benchmark scanning to pair with Wazuh SCA.
- **Goss / InSpec / Molecule** — automated infrastructure tests: your Connectivity Test Matrix, but re-runnable on every commit.
- **Tactical RMM** — what an MSP actually runs for endpoint management.
- **Reverse proxy + internal CA** — Traefik/HAProxy with real HTTPS instead of plain HTTP.

---

## Glossary (advanced additions)

- **IaC (Infrastructure as Code)** — defining infrastructure in text files under version control instead of clicking a UI.
- **Idempotent** — running it twice gives the same result as running it once. The core property of Ansible (and the reason `changed=0` matters).
- **Declarative vs. imperative** — Terraform declares *what should exist*; a shell script commands *what to do*. Declarative code can be re-run safely.
- **Drift** — reality diverging from what your code says. `terraform plan` detects it.
- **Golden image / template** — a pre-built OS image cloned to create new machines instantly.
- **cloud-init** — the standard that configures a cloned VM on first boot (hostname, IP, users, keys).
- **Dynamic inventory** — Ansible asking the hypervisor "what hosts exist?" instead of reading a static list.
- **Exporter** — a small agent exposing metrics for Prometheus to scrape (e.g., `node_exporter`).
- **Scrape / pull vs. push** — Prometheus *pulls* metrics on a schedule; Loki/Wazuh agents *push* to the server.
- **Label** — a key/value tag on metrics (e.g., `team="07"`) used to filter and route.
- **XDR (Extended Detection and Response)** — security monitoring across endpoints, logs, and files in one platform (Wazuh here).
- **FIM (File Integrity Monitoring)** — alerting when watched files change.
- **SCA (Security Configuration Assessment)** — automated benchmark scoring of a host's hardening.
- **Deduplication** — storing repeated data once (why PBS backups are small).
- **Verify job** — PBS re-reading a backup to confirm it's actually restorable.
- **SLO / SLA** — the availability target you promise a client, and the contract around it.

---

> **The standard for this track:** delete any VM in your environment, and rebuild it
> from your Git repository alone — with it reappearing in monitoring and XDR
> automatically. If you can do that, you can run a fleet.
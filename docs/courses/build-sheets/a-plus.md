# A+ Capstone Bench — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Preparation

> The bench made safe, the media built and hash-checked, the IMAGES drive ready, and the machine recorded as received.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Strap and tools | The bench made safe before the case opens | Intake & Bench Checklist |
| LIVE stick | Boots the PC to read and prove its parts | Intake & Bench Checklist |
| INSTALL stick | Installs Windows clean from hash-checked media | Intake & Bench Checklist |
| IMAGES drive | Holds every image, hash and the recovery key | Backup & Image Register |
| 1 Intake & bench | Records the safety lines, the machine as received and the media | Intake & Bench Checklist |

**Process — The bench, before the case opens:** strap → disk (safe to touch); live → board (boots the machine).

## Week 1 — Bench

> New: the parts read from the live system, the fault worked with the method, and the firmware baseline set.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Board, CPU, memory | The parts, identified by sight and proved from the live system | Asset & Build Sheet |
| Disk | Imaged before any change; replaced if SMART fails it | Asset & Build Sheet |
| Firmware | The first security control, set and recorded with menu paths | OS Build & Baseline Record |
| The fault | Worked one theory and one change per row, failures kept | Troubleshooting Log |
| 2 Asset & build | Records every part as the live system reported it | Asset & Build Sheet |
| 3 Troubleshooting log | Records the six steps, one attempt per row | Troubleshooting Log |
| 4 OS build & baseline | Records firmware, install, accounts, network and the baseline | OS Build & Baseline Record |

**Process — Week 1: read it, fix it, set the firmware:** live → board (dmidecode, lscpu, lsblk); live → disk (SMART health); fault → board (one theory, one change); firmware → disk (UEFI, Secure Boot, boot order).

## Week 2 — Systems

> New: the as-received image, Windows installed clean, accounts and a hashed baseline, and a restore proved and timed.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Windows | Installed from checked media, drivers clean, updates current | OS Build & Baseline Record |
| Accounts | A named admin, a standard user, the built-in Administrator off | OS Build & Baseline Record |
| As-received image | The way back, hashed, taken before the installer runs | Backup & Image Register |
| Post-install image | The clean build, proved by a restore and a matching hash | Backup & Image Register |
| Services baseline | The saved state Week 4 is compared against | OS Build & Baseline Record |
| 5 Backup & image | Records every image, its hash and every timed restore | Backup & Image Register |

**Process — Week 2: image first, build, prove the restore:** disk → image_received (imaged before any change); install → windows (clean install, updates); windows → baseline (services saved and hashed); image_received → disk (restored and timed).

## Week 3 — Support

> New: the network, the user, the printer and displays, remote help, and three injected faults worked as tickets.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Printer and displays | Added and proved as the standard user, not the admin | Support Ticket Log |
| Remote help | A teammate takes control and the session is a ticket | Support Ticket Log |
| Three tickets | Network, boot and software faults worked with the method | Support Ticket Log |
| Bench switch | Gives the PC its address; the known-good picture is recorded | OS Build & Baseline Record |
| Outside | Gateway, name, route: three tests in order prove the path | OS Build & Baseline Record |
| The user | Signs in as a standard user and raises the tickets | Support Ticket Log |
| Help desk | Helps remotely and works the tickets by the method | Support Ticket Log |
| 6 Support tickets | Records the setup and the three faults as tickets | Support Ticket Log |

**Process — Week 3: connect, set up, work the tickets:** switch → windows (address, gateway, DNS); user → peripherals (printer and displays); helpdesk → remote (Quick Assist); user → tickets (three faults, by the method).

## Week 4 — Hand over

> New: encryption, Defender, the baseline diff, the handover image restored inside the target, and the as-built issued.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Encryption | The disk encrypted, the recovery key stored off the machine | Security Checklist |
| Defender and firewall | Real-time protection, three profiles on, a clean full scan | Security Checklist |
| Baseline diff | Every service that changed is on purpose or a finding | Security Checklist |
| Handover image | Restored over a deliberate break inside the written target | Backup & Image Register |
| 7 Security checklist | Records encryption, Defender, firewall, scan and the diff | Security Checklist |
| 8 Handover & as-built | The capstone: the machine as it is, with custody for every artifact | Handover & As-Built |

**Process — Week 4: secure, time the restore, hand over:** bitlocker → images (key stored off the machine); baseline → diff (every change explained); image_handover → disk (restored inside the target); r_handover → user (as-built with custody).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Hardware Bench (Bench Lead) | Leads the hardware record: inventory, the fault log, firmware and the physical build. | Asset & Build Sheet, Troubleshooting Log | Intake & Bench Checklist, OS Build & Baseline Record, Support Ticket Log | Backup & Image Register | Systems Build (Systems Lead), Help Desk (Support Lead), Service Records (Records Lead) | Systems Build (Systems Lead), Help Desk (Support Lead), Service Records (Records Lead) |
| Systems Build (Systems Lead) | Leads the system record: the image, the install, drivers, updates and the baseline. | OS Build & Baseline Record, Security Checklist | Asset & Build Sheet, Backup & Image Register, Handover & As-Built | Intake & Bench Checklist | Hardware Bench (Bench Lead), Help Desk (Support Lead), Service Records (Records Lead) | Hardware Bench (Bench Lead), Service Records (Records Lead) |
| Help Desk (Support Lead) | Leads the ticket log: user setup, peripherals, remote help and every fault worked. | Support Ticket Log | Troubleshooting Log, Security Checklist | Handover & As-Built | Hardware Bench (Bench Lead), Service Records (Records Lead) | Hardware Bench (Bench Lead), Systems Build (Systems Lead), Service Records (Records Lead) |
| Service Records (Records Lead) | Leads the records that outlive the bench: intake, backups, security and handover. | Intake & Bench Checklist, Backup & Image Register, Handover & As-Built | — | Asset & Build Sheet, Troubleshooting Log, OS Build & Baseline Record, Support Ticket Log, Security Checklist | Hardware Bench (Bench Lead), Systems Build (Systems Lead), Help Desk (Support Lead) | Hardware Bench (Bench Lead), Systems Build (Systems Lead), Help Desk (Support Lead) |


'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { CopyButton } from '@/components/TaskComponents';
import {
  CAMPUS_LAN,
  HOST,
  HOST_CONSOLE_URL,
  MONITORING_HOST,
  HOST_ROOT_LOGIN,
  TEAM_VM_START,
  ZONE_BRIDGES,
  baseVmsOn,
  bridge,
} from '@/lib/serverTopology';

/**
 * The Server+ build procedures, in the platform.
 *
 * This replaces an instructor PDF that students had to open beside the site to
 * get anything done. A hosted file cannot be corrected when the topology moves,
 * and the ODT it came from still describes the old design — a 10.10.10.x host, a
 * jump box on vmbr1, the website on IIS. Everything below is the corrected
 * procedure for the *current* topology, so the guide and the lab can never
 * disagree again.
 *
 * Grouped by week rather than by machine because that is the order a student
 * meets them. Week 1 now runs the whole bring-up — receive, POST, document,
 * array, install — because that is one continuous job and splitting it across a
 * week boundary left students waiting to act on what they had just found.
 *
 * The read-then-change discipline that split bought is kept WITHIN the week
 * instead: the BIOS and RAID inventory trips are still read-only and still exit
 * without saving, and creating the array is still a separate procedure carrying
 * its own warning. Running the ODT's combined section walks a student from
 * "view the virtual disks" straight into deleting them, which is the thing the
 * ordering exists to prevent.
 *
 * The `updatedFromOriginal` rationale behind each correction is authoring
 * history and is deliberately not rendered; a student needs the procedure, not
 * the diff against a document they never saw.
 *
 * The addressing table below is DERIVED from `@/lib/serverTopology`, the module
 * the topology diagram reads as well. Hand-typing it here is what produced the
 * drift this guide was meant to end. Command bodies keep their literal addresses
 * inline on purpose: a copy button has to hand the student the line they will
 * actually type.
 */

type Step = {
  /** Exactly one of `cmd` or `gui` — a line you type, or a thing you click. */
  cmd?: string;
  gui?: string;
  explain: string;
  doc?: { label: string; href: string };
};

type Procedure = {
  id: string;
  week: number;
  title: string;
  where: string;
  summary: string;
  /**
   * Real work, but not required to pass the week: the advanced monitoring track,
   * and the later-phase hand-off of the private zone to the Cisco router.
   */
  optional?: boolean;
  /** Badge wording, when "advanced" is not what makes it optional. */
  optionalLabel?: string;
  steps: Step[];
};

type WeekBlock = { number: number; title: string; phase: string; lead: string };

// The addressing rule, stated once at the top of the guide and read straight out
// of the topology module — not retyped. Every procedure below assumes it, and
// Team 1 is the worked example throughout because a guide full of substitution
// markers is unreadable.
const ADDRESSING: { zone: string; net: string; hosts: string; note?: string }[] = [
  {
    zone: 'Campus LAN',
    net: `${CAMPUS_LAN.cidr} · gateway ${CAMPUS_LAN.gateway}`,
    hosts: 'The school network your management interface sits on.',
  },
  {
    zone: `${bridge('vmbr0').id} — ${bridge('vmbr0').zone}`,
    net: `${HOST.rule} (${HOST.teamMarker} = your team number)`,
    hosts: `The Proxmox host. Web console ${HOST_CONSOLE_URL} — Team ${HOST.exampleTeam} is ${HOST.exampleAddress}.`,
  },
  ...ZONE_BRIDGES.map((b) => ({
    zone: `${b.id} — ${b.zone}`,
    net: `${b.cidr} · gateway ${b.gateway}`,
    hosts: baseVmsOn(b.id)
      .map((v) => `${v.hostname} ${v.address} — ${v.os} + ${v.services.join(', ')}`)
      .join(' · '),
    note: b.note,
  })),
];

// These must match the course weeks in src/lib/data/seed/serverPlus.ts — a guide
// that names Week 2 differently from the week the student is standing in is a
// guide they stop trusting.
const WEEKS: WeekBlock[] = [
  { number: 0, title: 'Preparation', phase: 'Get ready to build', lead: 'Prove your own seat works before the engagement starts.' },
  { number: 1, title: 'Bring the Server Up', phase: 'Receive & Install', lead: 'Receive it, fit it, post it, document it, build the array and install the hypervisor. Inventory trips read; the array and install trips change.' },
  { number: 2, title: 'Design & Deploy', phase: 'Design & Deploy', lead: 'Decide what runs on the hypervisor, then build it: bridges, VMs and their services.' },
  { number: 3, title: 'Network & Operate', phase: 'Network & Operate', lead: 'Make the addressing real, route between the zones, prove every path, and run it by procedure.' },
  { number: 4, title: 'Secure & Hand Over', phase: 'Secure & Hand Over', lead: 'Harden what is exposed, patch with a way back, and time a real restore.' },
];

const PROCEDURES: Procedure[] = [
  {
    id: 'verify-pxe-imaged-workstation',
    week: 0,
    title: 'Image your workstation over PXE and verify the join',
    where: 'Your assigned workstation',
    summary:
      'Boot the assigned workstation over PXE, image it to the 932 GB disk, name it from the desk label, join ITS.lan, then prove all three from the command line before the engagement starts.',
    steps: [
      { gui: 'Seat the ethernet cable at both ends and confirm a link light within about five seconds of power. No link light means PXE will never start.', explain: 'PXE is a network boot: no link, no DHCP offer, no boot image.' },
      {
        gui: 'Tap the boot-menu key about once per second at the manufacturer logo, choose the IPv4 network entry (never IPv6), then the Windows entry in the PXE menu.',
        explain: 'The full six-stage walkthrough, the verify checks and the PXE error table live in the hosted PXE Imaging Student Guide.',
        doc: { label: 'PXE Imaging Student Guide (PDF)', href: '/downloads/PXE_Imaging_Student_Guide.pdf' },
      },
      { gui: 'At the disk selection screen, install to the 932 GB drive — never the 238 GB SSD. Go by size, not by disk number. This is the point of no return: read the size twice.', explain: 'Imaging erases the disk you pick, and the SSD is not yours to overwrite.' },
      { gui: 'Set the computer name to the desk label with the space typed as a hyphen (CIT6 R1C3 becomes CIT6-R1C3), then join ITS.lan in full and sign in as ITS\\yourusername.', explain: 'The desk label is the naming convention for the whole lab; a WORKGROUP machine is not finished.' },
      { cmd: 'hostname', explain: 'Must print the desk label with the hyphen.' },
      { cmd: 'systeminfo | findstr /C:"Domain" /C:"OS Name"', explain: 'Domain must read ITS.lan, not WORKGROUP.' },
      { cmd: 'ping itsdc3', explain: 'The domain controller and the ISO share host must answer — you will pull the Proxmox and OS ISOs off \\\\itsdc3\\its in Week 2.' },
    ],
  },
  {
    id: 'bios-hardware-inventory',
    week: 1,
    title: 'Read the hardware inventory from Dell System Setup (F2)',
    where: 'The server console — Dell System Setup',
    summary:
      'Enter System Setup read-only and record CPU model and core count, VT-x/VT-d state, installed vs maximum RAM and slot usage, NIC ports and speeds, the BIOS version and the boot mode — then exit WITHOUT saving.',
    steps: [
      { gui: 'Plug a keyboard and monitor into the server and power it on. Watch for the Dell splash screen and the message "Press F2 to enter System Setup".', explain: 'Navigating the BIOS differs by server model — check the manual or search your exact model if the screens do not match.' },
      { gui: 'Tap F2 repeatedly until System Setup loads. Keep tapping; a single press usually misses the window.', explain: 'F2 is the Dell System Setup key.' },
      { gui: 'Open System BIOS → Processor Settings. Record the processor model, core count, thread count and the Virtualization Technology setting (Enabled/Disabled).', explain: 'Virtualization Technology is VT-x. If it is Disabled the hypervisor plan does not work — note it now and turn it on in the boot-order trip.' },
      { gui: 'Open System BIOS → Memory Settings. Record System Memory Size (installed), the maximum the platform supports, slots used vs total, and the memory type (ECC RDIMM/UDIMM).', explain: 'Installed-versus-maximum is your upgrade headroom and drives the Hardware Discovery, HCL & Upgrade Plan.' },
      { gui: 'Open System BIOS → Integrated Devices (and Device Settings for add-in NICs). Record each NIC model, port count and link speed.', explain: 'These are the physical ports vmbr0 maps to, and later the uplink for vmbr2.' },
      { gui: 'Open System BIOS → System Information and the main System Setup page. Record the BIOS version, the service tag / serial, and the Boot Mode (UEFI or BIOS legacy).', explain: 'Boot Mode decides the partition scheme when you flash the USB — GPT for UEFI, MBR for BIOS.' },
      { gui: 'Press Esc and choose Discard Changes and Exit. Save nothing on this trip.', explain: 'Read before you change. You come back to this screen once you know what needs setting.' },
    ],
  },
  {
    id: 'raid-controller-inventory',
    week: 1,
    title: 'Read the RAID controller and physical disks',
    where: 'The server console — the RAID utility your card offers',
    summary:
      'Enter the RAID configuration utility read-only to record the controller model and cache, the RAID levels it supports, every physical disk, and any volume that already exists — then exit changing nothing on this trip. Which utility you get depends on the card: an LSI SAS controller answers Ctrl+C, a Dell PERC answers Ctrl+R.',
    steps: [
      { gui: 'Reboot and read the POST prompt. "Press Ctrl+C to enter SAS controller" means an LSI SAS BIOS; "Press Ctrl+R to enter Configuration Utility" means a Dell PERC. Press whichever your screen names.', explain: 'Two different utilities, same job. Every step below gives the menu for each — take the column that matches your prompt.' },
      { gui: 'Record the controller model and cache size. LSI SAS: pick your adapter, then Adapter Properties. PERC: the top of the VD Mgmt screen.', explain: 'The model is what you look up on the HCL later, and the cache size affects write performance.' },
      { gui: 'List any volume that already exists with its RAID level and size. LSI SAS: RAID Properties → View Existing Volume. PERC: the VD Mgmt list.', explain: 'An existing volume tells you the machine has a prior life; the array step decides whether it is deleted.' },
      { gui: 'Record every physical disk — count, capacity, media type (SAS/SATA, HDD/SSD) and state. LSI SAS: SAS Topology. PERC: Ctrl+N to PD Mgmt.', explain: 'Drive count and size set which RAID levels are actually available and what usable capacity the hypervisor will get.' },
      { gui: 'Note the RAID levels YOUR controller lists, and how many drive bays are populated versus total.', explain: 'This differs by card and it matters: a PERC offers 0/1/5/6/10, while an LSI SAS BIOS in IR mode usually offers only IS (RAID 0), IM (RAID 1) and IME (RAID 1E). Plan a level your card can actually build. Empty bays are upgrade headroom.' },
      { gui: 'Press Esc, choose Exit and confirm. Do NOT delete, create or initialize anything on this trip.', explain: 'Deleting a volume erases every drive in it. This trip is read-only; the destructive work is a separate, deliberate procedure.' },
    ],
  },
  {
    id: 'flash-proxmox-usb',
    week: 1,
    title: 'Flash the Proxmox VE USB with Rufus',
    where: 'A school Windows workstation',
    summary:
      'Write the Proxmox VE installer ISO to a USB drive with Rufus in DD mode, choosing the partition scheme that matches the boot mode you recorded in Week 1.',
    steps: [
      { gui: 'Plug a USB drive of at least 4 GB into a school workstation.', explain: 'The installer image is written raw, so anything already on the stick is destroyed.' },
      { cmd: 'explorer \\\\itsdc3\\its', explain: 'Opens the ISO share the course keeps its images on — Rufus and the Proxmox VE ISO both live here.' },
      { gui: 'Open Rufus (Rufus-4.7 or later) from the share.', explain: 'Rufus does not need installing; run it from the share.' },
      { gui: 'Under Device, select your USB drive. Tick "List USB Hard Drives" if the stick does not appear.', explain: 'Confirm the drive letter and size — Rufus will happily overwrite the wrong device.' },
      { gui: 'Click SELECT, navigate to the ISO share and choose the Proxmox VE ISO your instructor supplies.', explain: 'Use whichever Proxmox VE release the instructor hands out; the platform standard is Proxmox VE 8.2.' },
      { gui: 'Set Partition scheme to GPT if the Boot Mode read UEFI in Week 1, or MBR if it read BIOS (legacy). Leave File system as FAT32.', explain: 'This is why you recorded Boot Mode during the BIOS inventory.' },
      { gui: 'Click START, and when Rufus asks how to write the image, choose DD Image mode (not ISO mode). Wait for it to finish and eject the drive.', explain: 'The Proxmox ISO is a hybrid image — ISO mode produces a stick the server will not boot.' },
    ],
  },
  {
    id: 'set-boot-order-usb',
    week: 1,
    title: 'Set the boot order to boot the USB device',
    where: 'The server console — Dell System Setup (F2)',
    summary: 'Return to System Setup, put the USB device at the top of the boot sequence, and save — the change half of the BIOS work the inventory trip deliberately left alone.',
    steps: [
      { gui: 'Power on the server and tap F2 repeatedly at the Dell splash screen until System Setup loads.', explain: 'Same entry key as the read-only inventory trip; this is the trip that saves.' },
      { gui: 'Navigate to Boot Settings with the arrow keys and press Enter, then open Boot Sequence.', explain: 'Boot Settings is where the order lives; the exact wording varies by model.' },
      { gui: 'Confirm USB Device / Removable Device is listed, then move it to the top of the boot list using + / - or the "Enter to change" menu.', explain: 'If the USB does not appear at all, reseat the stick and re-enter setup — an unflashed or ISO-mode stick often will not enumerate.' },
      { gui: 'If the Week-1 inventory showed Virtualization Technology Disabled, enable it now under Processor Settings while you are here.', explain: 'The hypervisor needs VT-x. The inventory trip only read it; this is where you turn it on.' },
      { gui: 'Save and exit: Exit → Save Changes and Exit, or press F10.', explain: 'The server will now boot the installer stick on the next power cycle.' },
    ],
  },
  {
    id: 'create-raid-virtual-disk',
    week: 1,
    title: 'Create and initialize the RAID volume',
    where: 'The server console — the RAID utility your card offers',
    summary:
      'Clear any existing volume, create the array the Week-1 plan calls for, and initialize it so Proxmox has a single target disk to install onto. Both utilities are written out below: take the block that matches the prompt on your POST screen.',
    steps: [
      { gui: 'STOP: deleting a volume erases ALL data on those drives, and there is no undo. Confirm with your instructor that this server holds nothing anyone needs before continuing.', explain: 'The inventory trip already told you what is on the controller. This is the one step worth flagging twice.' },
      { gui: 'LSI SAS (Ctrl+C) — 1. Press Ctrl+C at the POST prompt, pick your adapter and press Enter. 2. Choose RAID Properties.', explain: 'The LSI SAS BIOS Configuration Utility. Everything to do with volumes lives under RAID Properties.' },
      { gui: 'LSI SAS (Ctrl+C) — 3. If a volume exists: View Existing Volume → Manage Volume → Delete Volume, and confirm.', explain: 'Proxmox must install to a clean array, not on top of the previous build.' },
      { gui: 'LSI SAS (Ctrl+C) — 4. Create New Volume, then the type your plan calls for: IS is RAID 0, IM is RAID 1, IME is RAID 1E.', explain: 'These three are usually all an LSI SAS BIOS in IR mode offers. If your plan said RAID 5 or 10 and this menu does not list it, change the plan here and record why.' },
      { gui: 'LSI SAS (Ctrl+C) — 5. In the disk list, move to the RAID Disk column and press Space to set Yes on each drive. 6. Press C to create, then save the changes and exit. 7. Esc out and let the server reboot.', explain: 'Creating the volume is what initializes it on this controller; there is no separate Initialize step as there is on a PERC.' },
      { gui: 'Dell PERC (Ctrl+R) — 1. Press Ctrl+R at the POST prompt. 2. On VD Mgmt, highlight each existing virtual disk, press F2, choose Delete VD and confirm. Repeat until none remain.', explain: 'Same goal as the LSI path: a clean controller before anything is built.' },
      { gui: 'Dell PERC (Ctrl+R) — 3. Press Ctrl+N to open PD Mgmt and confirm every physical disk you inventoried is detected and Ready.', explain: 'A missing or Foreign disk here means a reseat or a foreign-config import, not a create.' },
      { gui: 'Dell PERC (Ctrl+R) — 4. Back on VD Mgmt press F2, choose Create New VD, select the level you justified (0, 1, 5, 6 or 10), then highlight each drive and press Space to include it.', explain: 'A PERC offers the parity levels an LSI SAS BIOS does not, which is why the same plan can be built differently on two benches.' },
      { gui: 'Dell PERC (Ctrl+R) — 5. Set the VD size to full capacity, leave stripe size and the rest at their defaults, and confirm.', explain: 'Defaults are correct for this build; no workload here justifies tuning them.' },
      { gui: 'Dell PERC (Ctrl+R) — 6. Highlight the new VD, press F2, choose Initialize and confirm — Quick Init is fine. 7. Confirm it reads Optimal, then Esc → Exit → confirm.', explain: 'An uninitialized VD can present oddly to the installer. Optimal is the word to look for before installing anything.' },
    ],
  },
  {
    id: 'install-proxmox-host',
    week: 1,
    title: 'Install Proxmox VE and set the management address',
    where: 'The server console, then a browser on the campus LAN',
    summary:
      'Boot the flashed USB, install Proxmox VE onto the RAID virtual disk, set the hostname and the team management address on the campus LAN, then verify the web console answers.',
    steps: [
      { gui: 'Insert the flashed USB into the server, reboot, and press F11 for the one-time boot menu. Select the USB device.', explain: 'F11 is the Dell boot menu key; use it rather than re-editing the boot order.' },
      { gui: 'At the Proxmox VE Installer menu, choose "Install Proxmox VE" (graphical) and accept the EULA.', explain: 'The installer will detect the drives it can see.' },
      { gui: 'At Target Harddisk, select the RAID virtual disk you created. The installer will wipe it and create new partitions — that is expected.', explain: 'There should be exactly one sensible target, because the controller presents the array as a single disk.' },
      { gui: `Set the country, time zone and keyboard layout, then set the root password to ${HOST_ROOT_LOGIN.password} and add an administrative email address.`, explain: 'One classroom password for every team, so an instructor can help at any bench. Record it in the Server Bring-Up Log anyway — a real deployment rotates it during hardening.' },
      { gui: 'At Management Network Configuration set: Hostname pve-host.teamX.local; IP address 10.10.30.T/16 where T is your team number (Team 1 = 10.10.30.1/16); Gateway 10.10.10.1; DNS server as your instructor supplies.', explain: 'This is the campus LAN 10.10.0.0/16 and it becomes vmbr0, the management bridge. The prefix is /16 (netmask 255.255.0.0), not /24 — a /24 here cannot reach the 10.10.10.1 gateway.' },
      { gui: 'Confirm the summary, let the install run, then remove the USB drive and reboot.', explain: 'Leaving the stick in sends the server straight back into the installer.' },
      { cmd: 'ip -4 addr show vmbr0', explain: 'Run at the host console after the reboot. Must show 10.10.30.T/16 on vmbr0.' },
      { cmd: 'ping -c 4 10.10.10.1', explain: 'Proves the host reaches the campus gateway. If this fails the prefix or the cable is wrong, not the install.' },
      { gui: `From a school desktop, browse to ${HOST_CONSOLE_URL}, accept the self-signed certificate warning, set Realm to "Linux PAM standard authentication" and log in as ${HOST_ROOT_LOGIN.user} / ${HOST_ROOT_LOGIN.password}.`, explain: 'This is the console every remaining procedure in the course is driven from.' },
      { cmd: 'systemctl status pveproxy --no-pager', explain: 'If the browser cannot reach the console, check the service is active before blaming the network.' },
    ],
  },
  {
    id: 'upload-isos',
    week: 2,
    title: 'Upload the OS ISO images to the Proxmox host',
    where: 'Proxmox web console, or a shell on your workstation',
    summary:
      'Put every guest OS image you will install — Windows Server and Ubuntu Server at minimum — onto the host local storage so the VM wizard can boot from them.',
    steps: [
      { gui: 'In the Proxmox web console, expand Datacenter → pve-host → local (pve-host) in the left sidebar.', explain: '"local" is the directory storage that holds ISO images and container templates.' },
      { gui: 'Select ISO Images in the centre pane and click Upload.', explain: 'The upload goes to /var/lib/vz/template/iso on the host.' },
      { gui: 'Click Select File, navigate to the ISO share, choose the ISO and click Upload. Repeat for every image you plan to use — Windows Server and Ubuntu Server at minimum.', explain: 'You need Ubuntu Server for websrv and linuxsrv, and Windows Server for winserver. Add any image your own extra business VMs need.' },
      { cmd: 'scp ubuntu-22.04.5-live-server-amd64.iso root@10.10.30.1:/var/lib/vz/template/iso/', explain: 'Alternative from a Linux workstation — substitute your own team host address and the exact ISO filename. Faster than the browser upload for large images.' },
      { cmd: 'ls -lh /var/lib/vz/template/iso/', explain: 'Run on the host to confirm every image landed at its full size; a truncated upload fails silently in the VM wizard.' },
    ],
  },
  {
    id: 'create-zone-bridges',
    week: 2,
    title: 'Create the vmbr1 (DMZ) and vmbr2 (private) bridges',
    where: 'Proxmox host shell',
    summary:
      'Add the two internal Linux bridges that carry the segmented zones: vmbr1 is the DMZ at 172.16.0.0/24 with the host holding gateway 172.16.0.1, and vmbr2 is the private zone at 192.168.0.0/24 with the host holding 192.168.0.1 — then give both zones a way out through the host, because a bridge with bridge-ports none reaches nothing on its own and every apt install you run this week has to reach the archive.',
    steps: [
      { cmd: 'cp /etc/network/interfaces /etc/network/interfaces.bak', explain: 'Back up before editing. A malformed interfaces file can leave the host unreachable, and this file is your way back.' },
      {
        cmd: `cat >> /etc/network/interfaces <<'EOF'

auto vmbr1
iface vmbr1 inet static
        address 172.16.0.1/24
        bridge-ports none
        bridge-stp off
        bridge-fd 0
#       DMZ zone — carries websrv (172.16.0.10), the public-facing website

auto vmbr2
iface vmbr2 inet static
        address 192.168.0.1/24
        bridge-ports none
        bridge-stp off
        bridge-fd 0
#       Private zone — carries winserver (192.168.0.2) and linuxsrv (192.168.0.3)
EOF`,
        explain: 'Appends both bridge stanzas in one go. bridge-ports none means the bridge has no physical NIC yet — it is internal to the host. The host address on each bridge is that zone gateway.',
      },
      { cmd: 'cat /etc/network/interfaces', explain: 'Read the whole file back before applying. Check you have not appended inside another stanza and that vmbr0 is untouched.' },
      { cmd: 'ifreload -a', explain: 'Applies the change without dropping the host. Proxmox VE 8 ships ifupdown2, which reloads interfaces in place; on an older host without it use systemctl restart networking and be ready to reboot.' },
      { cmd: 'ip -br addr show vmbr1 vmbr2', explain: 'Both bridges must show UP with 172.16.0.1/24 and 192.168.0.1/24 respectively.' },
      { cmd: 'ip -br addr show vmbr0', explain: 'Confirm the management bridge still holds 10.10.30.T/16 — you have not disturbed your own way in.' },
      { cmd: 'sysctl -w net.ipv4.ip_forward=1', explain: 'Turns the host into a router between its own bridges. Until this is on, a guest on vmbr1 or vmbr2 cannot get a packet past the host — DNS, apt, nothing.' },
      { cmd: 'echo "net.ipv4.ip_forward=1" > /etc/sysctl.d/99-capstone-forward.conf && sysctl --system', explain: 'Makes forwarding survive a reboot. A drop-in file is cleaner than appending to /etc/sysctl.conf and is easy to remove again.' },
      { cmd: 'iptables -t nat -A POSTROUTING -o vmbr0 -j MASQUERADE', explain: 'Source-NATs anything the host routes toward the campus LAN behind its management address. This single rule is what lets websrv and linuxsrv reach the Ubuntu archive during their installs. The rest of the ruleset — the cross-zone rules and the published ports — comes in Week 3.' },
      { cmd: 'iptables -t nat -L POSTROUTING -n -v', explain: 'Read it back: exactly one MASQUERADE line out of vmbr0. Running the previous command twice adds a duplicate, so check before you retype it.' },
    ],
  },
  {
    id: 'create-websrv-dmz-vm',
    week: 2,
    title: 'Create the websrv DMZ host VM',
    where: 'Proxmox web console, then the websrv console',
    summary: 'Build the public-facing website host in the DMZ: an Ubuntu Server VM on vmbr1 at the static address 172.16.0.10/24 with gateway 172.16.0.1.',
    steps: [
      { gui: 'In the Proxmox web console at https://10.10.30.T:8006, click Create VM. Give it Name: websrv and note the VM ID it assigns.', explain: 'Record the VM ID — every qm command in Weeks 3 and 4 addresses the VM by that number.' },
      { gui: 'On the OS tab, select the Ubuntu Server ISO from local (pve-host).', explain: 'The DMZ web host is Ubuntu + NGINX in this design.' },
      { gui: 'On the Disks tab set 30 GB; on the CPU tab set 2 cores; on the Memory tab set 2048 MB (2 GB).', explain: 'Matches the websrv row in the Architecture Brief.' },
      { gui: 'On the Network tab, set Bridge to vmbr1.', explain: 'This is what puts the VM in the DMZ zone. Getting this wrong is the single most common build error — a website on vmbr2 is not in the DMZ.' },
      { gui: 'Finish the wizard, start the VM, open its Console, and run the Ubuntu Server installer.', explain: 'Everything from here is inside the guest.' },
      { gui: 'At the Ubuntu network configuration screen, edit the interface and choose Manual: Subnet 172.16.0.0/24, Address 172.16.0.10, Gateway 172.16.0.1, Name servers 192.168.0.2, 1.1.1.1.', explain: '172.16.0.10 is the fixed website address, and DNS points at winserver because name resolution for the whole build lives there. The second resolver is deliberate and temporary: winserver does not carry the DNS role yet, so nothing would resolve the package archive without it. Week 3 drops it when you apply netplan.' },
      { gui: 'Select "Install OpenSSH server" when the installer offers it, complete the install, and reboot.', explain: 'You will harden this SSH service in Week 4; having it present now saves a console-only trip later.' },
      { cmd: 'ip -4 addr show', explain: 'Run in the websrv console after reboot. Must show 172.16.0.10/24.' },
      { cmd: 'ping -c 4 172.16.0.1', explain: 'Proves websrv reaches its gateway, which is the Proxmox host vmbr1 address.' },
    ],
  },
  {
    id: 'deploy-nginx-website',
    week: 2,
    title: 'Publish the website on websrv with NGINX',
    where: 'The websrv console (172.16.0.10)',
    summary:
      'Install NGINX on the DMZ host and publish the site — this is the one public-facing website in the design, and it lives in the DMZ, not on Windows and not on the private Linux server.',
    steps: [
      { cmd: 'sudo apt update', explain: 'Refresh the package lists first. websrv reaches the archive through the Proxmox host — the forwarding and the vmbr0 MASQUERADE you enabled when you created the bridges. If this hangs, that is the first thing to check.' },
      { cmd: 'sudo apt install nginx -y', explain: 'Installs NGINX and enables the default site on port 80.' },
      { cmd: 'echo "<html><body><h1>Welcome to the Team X capstone website</h1></body></html>" | sudo tee /var/www/html/index.html', explain: 'Replaces the NGINX default page. Substitute your own team number and business name — this page is what the client sees.' },
      { cmd: 'sudo systemctl enable --now nginx', explain: 'Enables at boot and starts it in one command.' },
      { cmd: 'systemctl status nginx --no-pager', explain: 'Confirm active (running) before you go looking for network problems.' },
      { cmd: 'curl -I http://172.16.0.10', explain: 'Run this one from the Proxmox host shell, not from websrv itself. The host holds 172.16.0.1 on vmbr1, so it reaches the DMZ with no routing at all. HTTP/1.1 200 OK proves the site answers across the network. The private-zone hosts cannot reach it yet — that needs the Week-3 static routes, and it is proven there.' },
      { cmd: 'curl http://172.16.0.10', explain: 'Again from the Proxmox host. Confirm your own welcome text comes back in the body, not the NGINX default page. Screenshot this — it is the evidence for the Server Bring-Up Log.' },
    ],
  },
  {
    id: 'create-winserver-vm',
    week: 2,
    title: 'Create the winserver VM in the private zone',
    where: 'Proxmox web console, then the winserver console',
    summary: 'Build the private-zone Windows Server VM on vmbr2 at 192.168.0.2/24 with gateway 192.168.0.1 — the host that will carry AD DS, DNS and DHCP.',
    steps: [
      { gui: 'In the Proxmox web console at https://10.10.30.T:8006, click Create VM. Name: winserver. Note the VM ID.', explain: 'The VM ID is what qm snapshot and qm rollback will address in Week 4.' },
      { gui: 'On the OS tab select the Windows Server ISO from local (pve-host) and set Guest OS Type to Microsoft Windows.', explain: 'Setting the guest type correctly gets you sane defaults for disk and NIC models.' },
      { gui: 'On the Disks tab set 60 GB; CPU 2 cores; Memory 4096 MB (4 GB).', explain: 'Matches the winserver row in the Architecture Brief. Windows Server with three roles will not be comfortable in 2 GB.' },
      { gui: 'On the Network tab, set Bridge to vmbr2.', explain: 'This is the private zone. winserver must never sit on vmbr1 — directory services do not belong in the DMZ.' },
      { gui: 'Finish the wizard, start the VM, open the Console and install Windows Server (Desktop Experience unless your instructor says Core).', explain: 'The Server Manager click-paths in the later procedures assume Desktop Experience.' },
      { gui: 'In Windows, open Network and Sharing Center → Change adapter settings → the adapter → Properties → Internet Protocol Version 4 → Properties. Set IP address 192.168.0.2, Subnet mask 255.255.255.0, Default gateway 192.168.0.1, Preferred DNS server 127.0.0.1.', explain: '192.168.0.2 is the fixed directory-server address. DNS points at itself because this machine becomes the DNS server for the whole build.' },
      { cmd: 'ipconfig /all', explain: 'Run in PowerShell or cmd. Confirm the address, mask, gateway and DNS server all read back as you set them.' },
      { cmd: 'ping 192.168.0.1', explain: 'Proves winserver reaches its gateway, which is the Proxmox host vmbr2 address.' },
    ],
  },
  {
    id: 'create-linuxsrv-vm',
    week: 2,
    title: 'Create the linuxsrv VM in the private zone',
    where: 'Proxmox web console, then the linuxsrv console',
    summary: 'Build the private-zone Ubuntu Server VM on vmbr2 at 192.168.0.3/24 with gateway 192.168.0.1 — the database host.',
    steps: [
      { gui: 'In the Proxmox web console, click Create VM. Name: linuxsrv. Note the VM ID.', explain: 'Record it in the Server Bring-Up Log alongside websrv and winserver.' },
      { gui: 'On the OS tab select the Ubuntu Server ISO from local (pve-host).', explain: 'Same image you used for websrv.' },
      { gui: 'On the Disks tab set 40 GB; CPU 2 cores; Memory 4096 MB (4 GB).', explain: 'Matches the linuxsrv row in the Architecture Brief — a database wants more disk and RAM than the web host.' },
      { gui: 'On the Network tab, set Bridge to vmbr2.', explain: 'Private zone. The database is never exposed in the DMZ.' },
      { gui: 'Finish the wizard, start the VM, open its Console and run the Ubuntu Server installer. At the network screen choose Manual: Subnet 192.168.0.0/24, Address 192.168.0.3, Gateway 192.168.0.1, Name servers 192.168.0.2, 1.1.1.1.', explain: '192.168.0.3 is the fixed database address, and DNS is winserver — every machine in this build resolves through it. Same temporary second resolver as websrv, for the same reason: the package archive has to resolve before winserver carries the DNS role.' },
      { gui: 'Select "Install OpenSSH server" when offered, finish the install and reboot.', explain: 'linuxsrv is the SSH-reachable internal host the Week-3 port-forward rule targets.' },
      { cmd: 'ip -4 addr show', explain: 'Must show 192.168.0.3/24.' },
      { cmd: 'ping -c 4 192.168.0.1', explain: 'Proves linuxsrv reaches its gateway on vmbr2.' },
    ],
  },
  {
    id: 'winserver-promote-adds',
    week: 2,
    title: 'Promote winserver to a domain controller for teamX.local',
    where: 'winserver (192.168.0.2) — PowerShell as Administrator',
    summary:
      'Install Active Directory Domain Services and promote winserver to the first domain controller of the teamX.local forest, which also stands up the DNS role and the forward lookup zone.',
    steps: [
      { cmd: 'Rename-Computer -NewName "winserver" -Restart', explain: 'Set the hostname before promotion — renaming a domain controller afterwards is far more work. The machine reboots.' },
      { cmd: 'Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools', explain: 'Installs the AD DS role and the management tools. Nothing is a domain controller yet.' },
      { cmd: 'Install-ADDSForest -DomainName "team1.local" -DomainNetbiosName "TEAM1" -InstallDns -Force', explain: 'Substitute your own team number for both team1 values. -InstallDns installs the DNS role and creates the forward lookup zone in the same pass. Record the Directory Services Restore Mode password it prompts for. The server reboots when it finishes.' },
      { cmd: 'Get-ADDomain | Select-Object DNSRoot, NetBIOSName, DomainMode', explain: 'After the reboot, confirms the domain exists and names it.' },
      { cmd: 'Get-Service NTDS, DNS | Select-Object Name, Status', explain: 'Both must read Running before you move on to the DNS records and the DHCP scope.' },
    ],
  },
  {
    id: 'winserver-dns',
    week: 2,
    title: 'Configure DNS and the teamX.local host records',
    where: 'winserver (192.168.0.2) — Server Manager and PowerShell',
    summary:
      'Make sure the DNS role and the teamX.local forward lookup zone exist, then add an A record for every named host in the build — winserver, linuxsrv and websrv — and prove resolution works.',
    steps: [
      { gui: 'If you did not promote to a domain controller: Server Manager → Add Roles and Features → DNS Server role, then DNS Manager → right-click Forward Lookup Zones → New Zone → Primary, and name the zone teamX.local with your team number.', explain: 'If you ran the AD DS promotion, both the role and the zone already exist — skip straight to the records.' },
      { cmd: 'Install-WindowsFeature -Name DNS -IncludeManagementTools', explain: 'PowerShell equivalent of the role install. Harmless to run if the role is already present.' },
      { cmd: 'Add-DnsServerPrimaryZone -Name "team1.local" -ZoneFile "team1.local.dns"', explain: 'PowerShell equivalent of the New Zone wizard. Substitute your team number. Skip this if AD DS already created the zone.' },
      { cmd: 'Add-DnsServerResourceRecordA -ZoneName "team1.local" -Name "winserver" -IPv4Address "192.168.0.2"', explain: 'The directory / DNS / DHCP server itself.' },
      { cmd: 'Add-DnsServerResourceRecordA -ZoneName "team1.local" -Name "linuxsrv" -IPv4Address "192.168.0.3"', explain: 'The private-zone database host.' },
      { cmd: 'Add-DnsServerResourceRecordA -ZoneName "team1.local" -Name "websrv" -IPv4Address "172.16.0.10"', explain: 'The DMZ website. The record lives in the same zone even though the host is in a different subnet — DNS does not care about zones of the network kind.' },
      { cmd: 'nslookup winserver.team1.local 192.168.0.2', explain: 'Query the server explicitly. Must return 192.168.0.2.' },
      { cmd: 'nslookup websrv.team1.local 192.168.0.2', explain: 'Must return 172.16.0.10 — this is what proves cross-zone name resolution works. Run it from linuxsrv as well as from winserver: both sit in the private zone, so both reach the DNS server directly. This resolves the name, it does not reach the host — that path arrives in Week 3.' },
    ],
  },
  {
    id: 'winserver-dhcp',
    week: 2,
    title: 'Configure DHCP and activate the CapstoneScope',
    where: 'winserver (192.168.0.2) — Server Manager and PowerShell',
    summary:
      'Install the DHCP Server role, create and activate a scope for the private zone that cannot collide with the reserved statics, hand out the right gateway and DNS server, and prove a client gets a lease.',
    steps: [
      { gui: 'In Server Manager → Add Roles and Features, install the DHCP Server role, then complete the post-deployment configuration when Server Manager prompts.', explain: 'The post-deployment step creates the security groups and authorizes the server in AD.' },
      { cmd: 'Install-WindowsFeature -Name DHCP -IncludeManagementTools', explain: 'PowerShell equivalent of the role install.' },
      { cmd: 'Add-DhcpServerv4Scope -Name "CapstoneScope" -StartRange 192.168.0.100 -EndRange 192.168.0.200 -SubnetMask 255.255.255.0 -State Active', explain: 'The range starts at .100 deliberately: .1 (gateway), .2 (winserver) and .3 (linuxsrv) are static, .4 is reserved for the optional secmon monitoring host, and .5 upward is where your own extra private-zone VMs go.' },
      { cmd: 'Set-DhcpServerv4OptionValue -ScopeId 192.168.0.0 -Router 192.168.0.1 -DnsServer 192.168.0.2 -DnsDomain "team1.local"', explain: 'Option 3 (router) is the Proxmox host vmbr2 address; option 6 (DNS) is winserver itself. Substitute your team number in the domain.' },
      { cmd: 'Add-DhcpServerInDC -DnsName "winserver.team1.local" -IPAddress 192.168.0.2', explain: 'Authorizes the DHCP server in Active Directory. An unauthorized DHCP server in a domain refuses to hand out leases.' },
      { gui: 'Now build something to lease to. In the Proxmox web console click Create VM, name it client01, pick any desktop image (Ubuntu Desktop or Windows 10/11), 1 core / 2048 MB / 20 GB, Bridge vmbr2.', explain: 'Nothing else in the base build is a DHCP client — the three servers are all static — so without this VM the scope cannot be tested. It is a throwaway; your own business design may call for a different client, which is fine.' },
      { gui: 'Leave client01 on DHCP — do not give it a static address. Boot it, let it request an address, and confirm what it gets lands inside 192.168.0.100-200 with gateway 192.168.0.1 and DNS 192.168.0.2.', explain: 'Taking a lease is the entire job of this VM. A scope with no client is untested.' },
      { cmd: 'Get-DhcpServerv4Lease -ScopeId 192.168.0.0', explain: 'Lists the leases actually issued — client01 should be there. Screenshot this for the Server Bring-Up Log.' },
    ],
  },
  {
    id: 'linuxsrv-mariadb',
    week: 2,
    title: 'Install MariaDB and create capstone_db on linuxsrv',
    where: 'The linuxsrv console (192.168.0.3)',
    summary:
      'Stand up the database server in the private zone: install MariaDB, secure it, create the capstone_db database and its application user, and prove the user can log in.',
    steps: [
      { cmd: 'sudo apt update', explain: 'Refresh package lists. Like websrv, linuxsrv reaches the archive through the Proxmox host\'s forwarding and vmbr0 NAT.' },
      { cmd: 'sudo apt install mariadb-server -y', explain: 'Installs the server and client.' },
      { cmd: 'sudo systemctl enable --now mariadb', explain: 'Enables at boot and starts it.' },
      { cmd: 'sudo mysql_secure_installation', explain: 'Sets the root password, removes the anonymous users and the test database, and disables remote root login. Answer yes to everything except leaving root auth as unix_socket if it offers.' },
      { cmd: 'sudo mysql', explain: 'Opens the MariaDB shell as root over the unix socket. The next statements are typed inside it.' },
      { cmd: 'CREATE DATABASE capstone_db;', explain: 'The application database.' },
      { cmd: "CREATE USER 'capuser'@'localhost' IDENTIFIED BY 'ChangeThisPassword1!';", explain: 'Use a real password of your own and record it in the Server Bring-Up Log — never ship the example.' },
      { cmd: "GRANT ALL PRIVILEGES ON capstone_db.* TO 'capuser'@'localhost'; FLUSH PRIVILEGES; EXIT;", explain: 'Grants only on capstone_db, not on everything — then reloads the grant tables and leaves the shell.' },
      { cmd: 'mysql -u capuser -p -e "SHOW DATABASES;"', explain: 'Log in as the application user and confirm capstone_db is listed. This is the proof step.' },
      { cmd: `sudo mysql -e "CREATE USER 'capuser'@'172.16.0.10' IDENTIFIED BY 'ChangeThisPassword1!'; GRANT ALL PRIVILEGES ON capstone_db.* TO 'capuser'@'172.16.0.10'; FLUSH PRIVILEGES;"`, explain: 'OPTIONAL — only if one of your own business VMs or a dynamic site on websrv needs the database across zones. You must also bind MariaDB to the private address in /etc/mysql/mariadb.conf.d/50-server.cnf and allow the traffic. The base build does not need this.' },
    ],
  },
  {
    id: 'monitoring-prometheus-grafana',
    week: 2,
    title: 'Stand up Prometheus and Grafana',
    where: 'A new secmon VM in the private zone, and every other VM',
    summary:
      'Build the monitoring VM planned in Week 1, install Prometheus and Grafana on it, put an exporter on every host, and confirm the three private-zone targets report UP before anything has had a chance to break. websrv joins the scrape list in Week 3, once there is a route to it.',
    optional: true,
    steps: [
      { gui: 'In the Proxmox web console create a VM named secmon: Ubuntu Server ISO, 2 cores, 6144 MB RAM, 80 GB disk, Bridge vmbr2. Install Ubuntu with the static address 192.168.0.4/24, gateway 192.168.0.1, DNS 192.168.0.2.', explain: 'Matches the secmon row in the Architecture Brief. It lives in the private zone — monitoring is never exposed in the DMZ.' },
      { cmd: 'sudo apt update && sudo apt install -y prometheus prometheus-node-exporter', explain: 'Run on secmon. Installs the Prometheus server and an exporter for secmon itself.' },
      { cmd: 'sudo apt install -y apt-transport-https software-properties-common wget', explain: 'Prerequisites for adding the Grafana repository.' },
      { cmd: 'sudo mkdir -p /etc/apt/keyrings && wget -q -O - https://apt.grafana.com/gpg.key | sudo gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null', explain: 'Adds the Grafana signing key in the modern keyrings location.' },
      { cmd: 'echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list', explain: 'Adds the repository. Grafana is not in the Ubuntu archive.' },
      { cmd: 'sudo apt update && sudo apt install -y grafana && sudo systemctl enable --now grafana-server', explain: 'Installs Grafana and starts it on port 3000.' },
      { cmd: 'sudo apt install -y prometheus-node-exporter', explain: 'Run this on websrv (172.16.0.10) and linuxsrv (192.168.0.3) too. Each exposes metrics on port 9100. Install it on websrv now, but it is not scraped until Week 3 — secmon is in the private zone and has no path into the DMZ yet.' },
      { gui: 'On winserver, download the windows_exporter MSI from its GitHub releases page onto the VM.', explain: 'Windows needs a different exporter; it listens on port 9182.' },
      { cmd: 'msiexec /i windows_exporter-amd64.msi ENABLED_COLLECTORS="cpu,cs,logical_disk,net,os,service,system,memory" /quiet', explain: 'Run in an elevated PowerShell on winserver, substituting the exact filename you downloaded.' },
      {
        cmd: 'sudo nano /etc/prometheus/prometheus.yml',
        explain: 'Run on secmon. Open the file and add the job below as a new list item under the existing scrape_configs: key, at the same indentation as the job already there. Do not append it blindly to the end of the file — this is a structured YAML document, and where the block lands is what makes it valid.',
      },
      {
        cmd: `  - job_name: capstone_nodes
    static_configs:
      - targets: ['192.168.0.4:9100','192.168.0.3:9100','192.168.0.2:9182']`,
        explain: 'The three private-zone targets — secmon and linuxsrv on 9100, winserver on 9182. Paste it inside scrape_configs, two spaces before the dash, exactly as shown.',
      },
      { cmd: 'sudo systemctl restart prometheus && systemctl status prometheus --no-pager', explain: 'Reloads the scrape config. A YAML error shows up here, not later.' },
      { gui: 'Browse to http://192.168.0.4:9090/targets and confirm all three targets read UP, then log into Grafana at http://192.168.0.4:3000 (admin/admin, change the password) and add Prometheus at http://localhost:9090 as a data source.', explain: 'Screenshot the targets page for the Server Bring-Up Log. Only private-zone hosts are here: reaching websrv from secmon needs the static route added in Week 3, and the websrv target goes in there.' },
    ],
  },
  {
    id: 'apply-static-addresses',
    week: 3,
    title: 'Apply the planned static addresses on every host',
    where: 'The Proxmox host, websrv, linuxsrv and winserver',
    summary:
      'Make reality match the IP plan: confirm or set the persistent static address, gateway and DNS server on every machine, using the right mechanism for each operating system.',
    steps: [
      { cmd: 'ip -br addr show vmbr0 vmbr1 vmbr2', explain: 'On the Proxmox host. Expect 10.10.30.T/16, 172.16.0.1/24 and 192.168.0.1/24. If any is wrong, edit /etc/network/interfaces and run ifreload -a — the host addressing is not set from a DHCP client.' },
      { cmd: 'ip -br link', explain: 'Run inside each Ubuntu guest first to learn the real interface name. A VirtIO NIC in Proxmox usually appears as ens18; do not copy an interface name out of a guide.' },
      {
        cmd: `sudo tee /etc/netplan/01-capstone.yaml > /dev/null <<'EOF'
network:
  version: 2
  ethernets:
    ens18:
      dhcp4: false
      addresses: [172.16.0.10/24]
      routes:
        - to: default
          via: 172.16.0.1
      nameservers:
        addresses: [192.168.0.2]
EOF`,
        explain: 'websrv, in the DMZ. Substitute the interface name you just read. For linuxsrv change the address to 192.168.0.3/24 and the gateway to 192.168.0.1. Note the single nameserver: winserver carries the DNS role now, so the temporary public resolver you set at install time goes away here.',
      },
      { cmd: 'sudo chmod 600 /etc/netplan/01-capstone.yaml', explain: 'Netplan warns loudly about world-readable configs.' },
      { cmd: 'sudo netplan apply', explain: 'Applies immediately and persists across reboots. If you are connected over SSH and the address is wrong you will lose the session — use the Proxmox console for this.' },
      { cmd: `ip -4 addr show && ip route show && resolvectl status | grep -A2 'DNS Servers'`, explain: 'Address, default route and resolver in one pass, on each Ubuntu host.' },
      { cmd: 'Get-NetAdapter | Select-Object Name, Status, LinkSpeed', explain: 'On winserver, in an elevated PowerShell. Learn the InterfaceAlias before you set anything — it is usually "Ethernet".' },
      { cmd: 'New-NetIPAddress -InterfaceAlias "Ethernet" -IPAddress 192.168.0.2 -PrefixLength 24 -DefaultGateway 192.168.0.1', explain: 'Sets the static address on winserver. If the adapter already holds a DHCP address, run Remove-NetIPAddress -InterfaceAlias "Ethernet" -Confirm:$false first.' },
      { cmd: 'Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses 127.0.0.1', explain: 'winserver resolves against itself because it is the DNS server. Every other host points at 192.168.0.2.' },
      { cmd: 'Get-NetIPConfiguration -InterfaceAlias "Ethernet"', explain: 'Reads back address, gateway and DNS. Log every address change in the Operations Log & SOPs as you make it.' },
    ],
  },
  {
    id: 'enable-routing-nat',
    week: 3,
    title: 'Complete the ruleset: cross-zone NAT and the published ports',
    where: 'Proxmox host shell',
    summary:
      'The host has been forwarding since Week 2, when you gave the guests their way out to the package archive. Now it gets the rest: the cross-zone NAT and forward rules, the published DMZ website and the published internal SSH port — then the ruleset is saved so it survives a reboot.',
    steps: [
      { cmd: 'sysctl net.ipv4.ip_forward', explain: 'You turned this on when you created the bridges in Week 2, and the drop-in file made it persistent. Expect 1. If it reads 0, re-run the two Week-2 lines before going any further.' },
      { cmd: 'iptables -t nat -L POSTROUTING -n -v', explain: 'Read the chain BEFORE you add to it. The MASQUERADE out of vmbr0 is already here from Week 2 — everything below is what is missing, and adding a rule you already have is the usual cause of confusing behaviour.' },
      { cmd: 'iptables -t nat -A POSTROUTING -s 172.16.0.0/24 -d 192.168.0.0/24 -j MASQUERADE', explain: 'DMZ traffic reaching the private zone is translated to the host vmbr2 address, so private hosts answer back through the host.' },
      { cmd: 'iptables -A FORWARD -s 172.16.0.0/24 -d 192.168.0.0/24 -j ACCEPT', explain: 'Permits the DMZ-to-private direction explicitly.' },
      { cmd: 'iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 80 -j DNAT --to-destination 172.16.0.10:80', explain: 'Publishes the DMZ website to the campus LAN: anyone hitting http://10.10.30.T reaches NGINX on websrv. This is what makes the site public-facing.' },
      { cmd: 'iptables -A FORWARD -p tcp -d 172.16.0.10 --dport 80 -j ACCEPT', explain: 'Permits the forwarded web traffic through.' },
      { cmd: 'iptables -t nat -A PREROUTING -i vmbr0 -p tcp --dport 2222 -j DNAT --to-destination 192.168.0.3:22', explain: 'Forwards port 2222 on the host to SSH on linuxsrv. linuxsrv is the internal host that actually runs sshd — winserver at 192.168.0.2 does not in the base build.' },
      { cmd: 'iptables -A FORWARD -p tcp -d 192.168.0.0/24 --dport 22 -j ACCEPT', explain: 'Permits forwarded SSH into the private zone.' },
      { cmd: 'iptables -A INPUT -p tcp --dport 2222 -j ACCEPT', explain: 'Lets the packet reach the host PREROUTING/DNAT path from the campus LAN.' },
      { cmd: 'iptables -t nat -A POSTROUTING -o vmbr1 -j MASQUERADE', explain: 'Source-NAT for anything the host routes out into the DMZ. The matching rule out of vmbr0 already exists from Week 2 — do not add it a second time.' },
      { cmd: 'iptables -t nat -L -n -v && iptables -L FORWARD -n -v', explain: 'Read the whole ruleset back before you persist it. If you see doubles, flush with iptables -F and iptables -t nat -F, then re-enter every rule in this procedure plus the Week-2 vmbr0 MASQUERADE — flushing removes that one too.' },
      { cmd: 'apt install iptables-persistent -y', explain: 'Answer yes when it offers to save the current IPv4 rules.' },
      { cmd: 'netfilter-persistent save', explain: 'Writes the live ruleset to /etc/iptables/rules.v4.' },
      { cmd: 'systemctl reboot', explain: 'Optional but worth doing once: reboot, then re-run the iptables -L checks to prove the rules really came back.' },
    ],
  },
  {
    id: 'static-routes-reverse',
    week: 3,
    title: 'Add the static routes for reverse connectivity',
    where: 'winserver and linuxsrv',
    summary:
      'Let the private-zone VMs initiate connections back to the DMZ by routing 172.16.0.0/24 via the private gateway 192.168.0.1 — and make the route persist across a reboot.',
    steps: [
      { cmd: 'route -p add 172.16.0.0 mask 255.255.255.0 192.168.0.1', explain: 'On winserver, in an elevated PowerShell or cmd. The -p flag makes the route persistent; without it the route is gone at the next reboot.' },
      { cmd: 'route print -4', explain: 'Confirm the 172.16.0.0 entry is listed, and that it appears under Persistent Routes.' },
      { cmd: 'sudo ip route add 172.16.0.0/24 via 192.168.0.1', explain: 'On linuxsrv. Takes effect immediately but does NOT survive a reboot on its own.' },
      {
        cmd: 'sudo nano /etc/netplan/01-capstone.yaml',
        explain: 'Open the file you wrote earlier. The route belongs INSIDE the existing routes: list, so this is an edit, not an append — appending would drop it at the end of the file, below nameservers, where netplan reads it as a stray list item and refuses the whole config.',
      },
      {
        cmd: `network:
  version: 2
  ethernets:
    ens18:
      dhcp4: false
      addresses: [192.168.0.3/24]
      routes:
        - to: default
          via: 192.168.0.1
        - to: 172.16.0.0/24
          via: 192.168.0.1
      nameservers:
        addresses: [192.168.0.2]`,
        explain: 'The complete file for linuxsrv — type it so yours matches this exactly, substituting the interface name you read with ip -br link. The only change from what you wrote earlier is the second entry under routes:, at the same indent as the default route.',
      },
      { cmd: 'sudo netplan apply && ip route show', explain: 'Applies and confirms. The 172.16.0.0/24 via 192.168.0.1 line must appear.' },
      { cmd: 'ping -c 4 172.16.0.10', explain: 'From linuxsrv. Proves the private zone can now initiate to the DMZ web host.' },
      { cmd: 'Test-NetConnection -ComputerName 172.16.0.10 -Port 80', explain: 'From winserver. TcpTestSucceeded : True proves the route and the forward rule both work.' },
    ],
  },
  {
    id: 'prove-connectivity',
    week: 3,
    title: 'Prove connectivity across all three zones',
    where: 'Every host, plus a campus workstation',
    summary:
      'Demonstrate and record every path the design promises: each host to its gateway, name resolution through winserver, the DMZ website answering, and management reachability into both zones.',
    steps: [
      { cmd: 'ping -c 4 10.10.10.1', explain: 'From the Proxmox host. Management path to the campus gateway.' },
      { cmd: 'ping -c 4 172.16.0.1 && ping -c 4 192.168.0.1', explain: 'From the Proxmox host. Both zone gateways are its own bridge addresses — this confirms both bridges are up.' },
      { cmd: 'ping -c 4 172.16.0.1', explain: 'From websrv. The DMZ host reaches its gateway.' },
      { cmd: 'ping -c 4 192.168.0.1', explain: 'From linuxsrv. The private host reaches its gateway.' },
      { cmd: 'ping 192.168.0.3', explain: 'From winserver, in PowerShell. Windows to Linux across the private zone.' },
      { cmd: 'ping -c 4 192.168.0.2', explain: 'From linuxsrv. Linux to Windows, the reverse direction.' },
      { cmd: 'nslookup winserver.team1.local 192.168.0.2', explain: 'From any host. Substitute your team number. Must return 192.168.0.2 — name resolution is working.' },
      { cmd: 'nslookup websrv.team1.local 192.168.0.2', explain: 'Must return 172.16.0.10. This proves the private-zone DNS server resolves the DMZ host.' },
      { cmd: 'curl -I http://172.16.0.10', explain: 'From linuxsrv. HTTP/1.1 200 OK proves the private zone reaches the DMZ website over the static route you added.' },
      { cmd: 'curl -I http://10.10.30.1', explain: 'From a campus workstation, substituting your own team host address. Proves the port-80 DNAT publishes the DMZ website to the campus LAN.' },
      { cmd: 'ssh ubuntu@172.16.0.10', explain: 'From the Proxmox host, substituting the user you created during the websrv Ubuntu install — the worked examples in this guide call it ubuntu. Proves management access into the DMZ web host. The hardened webadmin account does not exist until Week 4.' },
      { cmd: 'ssh -p 2222 ubuntu@10.10.30.1', explain: 'From a campus workstation, substituting your team host address and the user you created during the linuxsrv Ubuntu install. Proves the 2222 port-forward reaches sshd on linuxsrv.' },
      { gui: 'Record the result of every check above in the IP Plan & Connectivity Proof, and screenshot the ones your instructor asks for into 08_Evidence.', explain: 'A topology diagram claims; a connectivity check proves. Recording the checks is what turns the diagram into evidence.' },
    ],
  },
  {
    id: 'monitoring-loki-dashboard',
    week: 3,
    title: 'Add Loki and a one-glance dashboard',
    where: 'The secmon VM (192.168.0.4) and every other host',
    summary:
      'Add the websrv scrape target now that a route to the DMZ exists, then ship logs from every host into Loki and build one Grafana dashboard that shows each VM up, its address and its logs — turning the manual connectivity proof into a continuous one.',
    optional: true,
    steps: [
      { cmd: 'sudo ip route add 172.16.0.0/24 via 192.168.0.1', explain: 'On secmon, and persist it in netplan exactly as you did on linuxsrv. secmon is a private-zone host like any other: without this route it cannot reach the DMZ.' },
      { cmd: 'sudo nano /etc/prometheus/prometheus.yml', explain: 'Add \'172.16.0.10:9100\' to the capstone_nodes target list you wrote in Week 2 — the websrv exporter, which you installed then but could not scrape.' },
      { cmd: 'sudo systemctl restart prometheus && curl -s http://172.16.0.10:9100/metrics | head -n 3', explain: 'Reload the config, then prove the scrape path itself: metrics coming back from the DMZ host means the route works. Browse to http://192.168.0.4:9090/targets and confirm websrv is the fourth target reading UP.' },
      { cmd: 'sudo apt install -y loki promtail && sudo systemctl enable --now loki promtail', explain: 'Run on secmon. Both packages come from the Grafana repository you added in Week 2. Loki listens on 3100.' },
      { cmd: 'curl -s http://localhost:3100/ready', explain: 'On secmon. Must return ready before agents can ship to it.' },
      { cmd: 'sudo apt install -y promtail', explain: 'Run on websrv and linuxsrv — these are the log agents.' },
      { cmd: `sudo sed -i 's|http://localhost:3100/loki/api/v1/push|http://192.168.0.4:3100/loki/api/v1/push|' /etc/promtail/config.yml && sudo systemctl restart promtail`, explain: 'Points each agent at the Loki server on secmon instead of at itself. Read the file back to confirm the substitution landed.' },
      { cmd: 'systemctl status promtail --no-pager', explain: 'On each agent host. Active (running) with no connection errors in the log.' },
      { gui: 'In Grafana at http://192.168.0.4:3000, add a Loki data source pointing at http://localhost:3100.', explain: 'Grafana now has both Prometheus (metrics) and Loki (logs).' },
      { gui: 'Build one dashboard with a stat panel per host driven by the Prometheus up metric, a table of each host address, and a logs panel querying Loki.', explain: 'One screen that answers "is everything up and reachable?" — the same question the Week-3 manual checks answered once.' },
      { gui: 'Record the change in the Server Bring-Up Log and screenshot the dashboard into 08_Evidence.', explain: 'This is the evidence that the connectivity proof is now continuous rather than a one-off.' },
    ],
  },
  {
    // Last in the week on purpose. It hands 192.168.0.1 to the Cisco router, so
    // every check above — "both zone gateways are the host's own bridge
    // addresses" included — has to have been made and recorded first. Run top to
    // bottom this used to sit before the proof and quietly falsify it.
    id: 'map-vmbr2-physical-nic',
    week: 3,
    title: 'Later phase: map vmbr2 to a physical NIC on the Cisco router and switch',
    where: 'Proxmox host shell, and the rack',
    summary:
      'Move the private zone off the host internal bridge and onto real cable: attach vmbr2 to a second physical NIC patched into the Cisco switch, and hand the 192.168.0.1 gateway over to the Cisco router, which becomes the servers only internet path. Do this only once the connectivity proof above is complete and recorded — from here on the private gateway is the router, not the host, and every earlier check would have to be re-taken.',
    optional: true,
    optionalLabel: 'Later phase · optional',
    steps: [
      { cmd: 'ip -br link show', explain: 'Identify the second physical NIC by name (enp1s0f1, eno2 and so on). Cross-check against the NIC inventory you took in Week 1 — do not guess which port is which.' },
      { gui: 'Patch that NIC through the patch panel to an access port on the Cisco switch, and log the cable at both ends in the Rack, Power & Asset Register.', explain: 'The cable schedule is what lets anyone trace this link later without pulling the rack apart.' },
      { gui: 'On the Cisco router, configure the interface facing this switch as 192.168.0.1/24 and give it the outbound path (default route / NAT) to the internet.', explain: 'The router takes over as the private-zone gateway. This is the servers only internet path in the finished design.' },
      { cmd: 'cp /etc/network/interfaces /etc/network/interfaces.bak-prephys', explain: 'Back up again before this change — it can take the private zone offline if you get it wrong.' },
      { cmd: 'nano /etc/network/interfaces', explain: 'In the vmbr2 stanza, change bridge-ports none to your physical NIC name, and REMOVE the address 192.168.0.1/24 line — the Cisco router now owns that address. Two devices holding 192.168.0.1 is a duplicate-address outage, not redundancy.' },
      { cmd: 'ifreload -a', explain: 'Applies the bridge change in place.' },
      { cmd: 'bridge link show | grep vmbr2', explain: 'The physical NIC must now appear as a member of vmbr2.' },
      { cmd: 'ping -c 4 192.168.0.1', explain: 'Run from linuxsrv. The gateway must still answer — but now it is the Cisco router answering, not the Proxmox host. Note that change in the Operations Log & SOPs: the address did not move, the device holding it did.' },
      { cmd: 'ping -c 4 8.8.8.8', explain: 'Run from linuxsrv. This is the point of the whole phase: the private-zone servers now reach the internet through the Cisco router.' },
    ],
  },
  {
    id: 'harden-dmz-web-host',
    week: 4,
    title: 'Harden the exposed hosts: SSH and ufw on websrv, then linuxsrv',
    where: 'The websrv console (172.16.0.10), then the linuxsrv console (192.168.0.3)',
    summary:
      'Lock down both machines the campus LAN can reach. websrv answers on port 80 through the DNAT; linuxsrv answers on port 2222 through the other one. Each gets a non-root administrative user, root login disabled over SSH, and a ufw ruleset that restricts SSH to the networks you own — websrv keeps port 80 open to everyone, linuxsrv opens nothing else at all.',
    steps: [
      { cmd: 'sudo apt update && sudo apt install openssh-server -y', explain: 'Skip if you selected OpenSSH during the Ubuntu install; harmless to run either way.' },
      { cmd: 'sudo systemctl enable --now ssh', explain: 'Enables at boot and starts it.' },
      { cmd: 'sudo adduser webadmin', explain: 'Creates the non-root administrative user and prompts for its password. Pick your own name and record it in the Server Bring-Up Log — you are about to disable root login and this account becomes your only way in.' },
      { cmd: 'sudo usermod -aG sudo webadmin', explain: 'Gives the new user sudo. Do this BEFORE disabling root, and test it — an unprivileged-only account plus no root login means a console-only recovery.' },
      { cmd: 'sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak', explain: 'Back up before editing.' },
      { cmd: `sudo sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/; s/^#\\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config`, explain: 'Sets both directives and uncomments them if they were commented. Editing by hand with sudo nano /etc/ssh/sshd_config is equally fine.' },
      { cmd: `grep -E '^(PermitRootLogin|PasswordAuthentication)' /etc/ssh/sshd_config`, explain: 'Read back exactly what you set.' },
      { cmd: 'sudo sshd -t', explain: 'Validates the config. Silence means valid. Never restart sshd on a config that has not passed this — a syntax error can leave the service dead with you locked out.' },
      { cmd: 'sudo systemctl restart ssh', explain: 'Applies the change. Keep your existing session open and prove a new one works before closing it.' },
      { cmd: 'sudo ufw allow from 10.10.0.0/16 to any port 22 proto tcp', explain: 'SSH from the campus LAN. This is the corrected campus supernet.' },
      { cmd: 'sudo ufw allow from 192.168.0.0/24 to any port 22 proto tcp', explain: 'SSH from the private zone.' },
      { cmd: 'sudo ufw allow from 172.16.0.0/24 to any port 22 proto tcp', explain: 'SSH from within the DMZ itself.' },
      { cmd: 'sudo ufw allow 80/tcp', explain: 'The website is public-facing, so port 80 is open to everyone — unlike SSH, which is restricted to the three networks above.' },
      { cmd: 'sudo ufw enable', explain: 'Turns the firewall on. It warns that this may disrupt existing SSH connections — you have already allowed SSH from all three trusted networks, so answer y.' },
      { cmd: 'sudo ufw status numbered', explain: 'Read the whole ruleset back. Screenshot it for the Server Bring-Up Log.' },
      { cmd: 'curl -I http://172.16.0.10', explain: 'From the Proxmox host or from linuxsrv. Confirm the firewall did not break the website you deployed in Week 2.' },
      { gui: 'Now switch to the linuxsrv console and run the same shape again. The Week-3 DNAT publishes this host sshd on port 2222, so the campus LAN reaches two machines, not one — hardening only websrv leaves that door standing open.', explain: 'This is the correction to make against the older jump-box guides: they hardened the single exposed host, and this design exposes two.' },
      { cmd: 'sudo adduser dbadmin', explain: 'On linuxsrv. The non-root administrative user — pick your own name and record it in the Server Bring-Up Log. Give it sudo with sudo usermod -aG sudo dbadmin and test it BEFORE you disable root, from the console rather than over SSH.' },
      { cmd: `sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak && sudo sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && grep -E '^PermitRootLogin' /etc/ssh/sshd_config`, explain: 'Back up, set the directive, read it straight back. Same edit as websrv.' },
      { cmd: 'sudo sshd -t && sudo systemctl restart ssh', explain: 'Validate, then apply. Silence from sshd -t means valid.' },
      { cmd: 'sudo ufw allow from 10.10.0.0/16 to any port 22 proto tcp', explain: 'The campus LAN. The host 2222 DNAT does not rewrite the source address, so a forwarded session arrives here as its real campus address — this is the rule that lets it in.' },
      { cmd: 'sudo ufw allow from 192.168.0.0/24 to any port 22 proto tcp', explain: 'SSH from within the private zone itself. No port 80 rule and no 3306 rule: linuxsrv serves the database, and the base build has no cross-zone grant to allow.' },
      { cmd: 'sudo ufw enable && sudo ufw status numbered', explain: 'Turn it on and read the whole ruleset back. Screenshot it for the Server Bring-Up Log.' },
      { cmd: 'ssh -p 2222 dbadmin@10.10.30.1', explain: 'From a campus workstation, with your team host address and your own user name. The hardened path still works end to end — that is the proof this step is finished.' },
    ],
  },
  {
    id: 'snapshot-and-patch',
    week: 4,
    title: 'Snapshot every VM, then patch every system',
    where: 'Proxmox host shell, and each VM',
    summary:
      'Take the rollback first, then bring the hypervisor and all three guests to a known patch level, confirm every service still runs, and record the new level.',
    steps: [
      { cmd: 'qm list', explain: 'On the Proxmox host. Lists every VM with its ID, name and state — you need the IDs for the next command.' },
      { cmd: 'qm snapshot 101 pre-patch-2026-03-09 --description "Pre-patch rollback point"', explain: 'Substitute the real VM ID and today date. Repeat for every VM before you touch any of them. Snapshot names cannot contain spaces.' },
      { cmd: 'qm listsnapshot 101', explain: 'Confirm the snapshot exists before patching. An unverified rollback is not a rollback.' },
      { cmd: 'apt update && apt dist-upgrade -y', explain: 'On the Proxmox host itself. The hypervisor gets patched too — it is the machine everything else depends on.' },
      { cmd: 'pveversion -v | head -n 3', explain: 'Records the new hypervisor version for the Operations Log & SOPs.' },
      { cmd: 'sudo apt update && sudo apt full-upgrade -y', explain: 'On websrv and linuxsrv. full-upgrade will remove packages when a dependency change requires it, which is what you want on a maintained server.' },
      { cmd: 'sudo apt autoremove --purge -y && [ -f /var/run/reboot-required ] && sudo reboot', explain: 'Cleans up, then reboots only if the update actually needs it (a kernel update, typically).' },
      { cmd: 'lsb_release -d && uname -r', explain: 'On each Ubuntu host after the reboot. Distribution and kernel version for the Operations Log & SOPs.' },
      { cmd: 'Install-Module PSWindowsUpdate -Force -Scope AllUsers', explain: 'On winserver, in an elevated PowerShell. Gives you Windows Update from the command line. If the module cannot be reached, use sconfig option 6 or the Settings GUI instead.' },
      { cmd: 'Get-WindowsUpdate -Install -AcceptAll -AutoReboot', explain: 'Applies every available update and reboots if required.' },
      { cmd: 'Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 5', explain: 'Lists what actually landed, for the Operations Log & SOPs.' },
      { cmd: 'systemctl status nginx mariadb --no-pager', explain: 'Run the relevant half on websrv and linuxsrv. Every service must still be running after the update — that check is the point of patching with a rollback.' },
      { cmd: 'Get-Service NTDS, DNS, DHCPServer | Select-Object Name, Status', explain: 'On winserver. All three roles must read Running after the reboot.' },
      { cmd: 'qm rollback 101 pre-patch-2026-03-09', explain: 'ONLY if an update broke something. The VM must be stopped first. This is why the snapshot came before the patch.' },
      { gui: 'Record each system starting level, schedule, rollback method, what you applied, the date and the result in the Operations Log & SOPs, and add a change row for the patch run.', explain: 'Without the recorded level you cannot tell what is still exposed.' },
    ],
  },
  {
    id: 'timed-restore-test',
    week: 4,
    title: 'Run one real restore and time it',
    where: 'linuxsrv (192.168.0.3) and the Proxmox host',
    summary:
      'Destroy something on purpose, restore it from the snapshot you took, measure how long it actually took, and confirm the data came back intact. The failure and the snapshot must be the same machine — deleting a file on websrv and rolling back linuxsrv restores nothing. linuxsrv is the usual choice because its data is the database, which is the thing worth proving came back.',
    steps: [
      { cmd: `mysql -u capuser -p -e "SHOW DATABASES;"`, explain: 'On linuxsrv. capstone_db must be listed. This is the "before" reading you compare against after the restore, and it is your data-integrity proof.' },
      { cmd: 'date +%T', explain: 'Note the wall-clock time before you break anything. This is the start of your measured recovery window.' },
      { cmd: `sudo mysql -e "DROP DATABASE capstone_db;"`, explain: 'The deliberate failure, on the machine you are about to roll back. Substitute whatever your DR plan names as the test — a dropped database, a deleted file, a stopped service — as long as it is on this VM.' },
      { cmd: `mysql -u capuser -p -e "SHOW DATABASES;"`, explain: 'Confirm the damage is real before you restore it. capstone_db is gone.' },
      { cmd: 'qm stop 102', explain: 'On the Proxmox host, substituting the linuxsrv VM ID. A VM must be stopped before it can be rolled back.' },
      { cmd: 'qm rollback 102 pre-patch-2026-03-09', explain: 'Restores that same VM to the snapshot. Substitute your own snapshot name from qm listsnapshot.' },
      { cmd: 'qm start 102 && qm status 102', explain: 'Bring it back up and confirm it is running.' },
      { cmd: 'date +%T', explain: 'Note the time again once MariaDB is actually answering, not just when the VM booted. The difference between the two timestamps is your measured recovery time.' },
      { cmd: `mysql -u capuser -p -e "SHOW DATABASES;"`, explain: 'The "after" reading — capstone_db is back. A restore that comes back missing data has not succeeded.' },
      { gui: 'Record the measured recovery time against your target RTO and MTTR in the DR Plan & As-Built Handover, and note explicitly that data integrity was confirmed and how.', explain: 'A DR plan marked "passed" with no measured time is worth nothing — the number is the deliverable.' },
    ],
  },
  {
    id: 'monitoring-alerts',
    week: 4,
    title: 'Alert on the failures the DR plan cares about',
    where: 'Grafana on the secmon VM (192.168.0.4)',
    summary:
      'Turn the monitoring stack into something that notices a failure before a person does: alerts for host down, disk nearly full and a failed service, one of them tested for real.',
    optional: true,
    steps: [
      { gui: 'In Grafana at http://192.168.0.4:3000, open Alerting → Alert rules → New alert rule. Create "Host down" on the Prometheus query up == 0, evaluated every 1m, firing after 2m.', explain: 'This fires when any exporter stops answering — the hypervisor, either private-zone VM, or the DMZ web host.' },
      { gui: 'Create a second rule, "Disk nearly full", on node_filesystem_avail_bytes / node_filesystem_size_bytes * 100 < 15.', explain: 'A full disk takes services down quietly. Fifteen percent gives you time to act.' },
      { gui: 'Create a third rule, "Service down", on node_systemd_unit_state{state="active"} == 0 for the units you care about — nginx on websrv, mariadb on linuxsrv.', explain: 'Maps directly to the systems the DR plan lists as critical.' },
      { gui: 'Add a contact point under Alerting → Contact points and attach it to a notification policy.', explain: 'An alert with nowhere to go is a coloured square on a screen nobody is watching.' },
      { cmd: 'sudo systemctl stop nginx', explain: 'On websrv. Test one alert for real — wait for it to fire in Grafana, then screenshot the firing state.' },
      { cmd: 'sudo systemctl start nginx', explain: 'Put the website back and confirm the alert clears.' },
      { gui: 'Screenshot the dashboard and the fired alert into 08_Evidence, and note in the DR Plan & As-Built Handover how each critical system failure is detected.', explain: 'A DR plan fires when someone notices the failure. Alerts are how someone notices — they turn the MTTR target from a hope into a number.' },
    ],
  },
];

/** One typed line, with the same terminal chrome a task step uses so a command
 *  reads as a command everywhere on the platform. */
function CommandLine({ cmd }: { cmd: string }) {
  return (
    <div
      className="relative rounded-lg p-3 pr-20 font-mono text-xs"
      style={{ background: 'var(--color-term-bg)', color: 'var(--color-term-tx)' }}
    >
      <div className="absolute right-2 top-2">
        <CopyButton text={cmd} />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words">{cmd}</pre>
    </div>
  );
}

export function ServerConfigGuide() {
  // One week at a time. Rendering all 28 procedures at once put ~9,000 words on
  // the Reference page — 84% of everything the page said — and a manual that
  // long is not read, it is scrolled past. The week is the unit a student is
  // actually working in, so that is the unit shown. This is the same week
  // selector the Deliverables page uses, and for the same reason.
  //
  // Every week keeps a real anchor: `#config-week-N` selects that week on load
  // and on hash change, so the deep links in the task steps still land on the
  // procedure they promise rather than on a panel that is closed.
  const [week, setWeek] = useState(1);

  useEffect(() => {
    const fromHash = () => {
      const m = /^#config-week-(\d)$/.exec(window.location.hash);
      if (m) setWeek(Number(m[1]));
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const active = WEEKS.find((w) => w.number === week) ?? WEEKS[1];
  const procs = PROCEDURES.filter((p) => p.week === week);
  const steps = procs.reduce((n, p) => n + p.steps.length, 0);

  return (
    <div className="space-y-5">
      {/* The addressing rule leads, because every command below is written
          against it and a student who skips it will type the wrong subnet into
          the installer — the one mistake that is expensive to undo. A table,
          not prose: four zones with the same three facts each is a table. */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
        <div className="flex flex-wrap items-baseline gap-x-3 border-b border-line bg-panel-2 px-4 py-2">
          <h3 className="text-sm font-semibold text-ink">The addressing rule</h3>
          <span className="text-xs text-muted">Worked examples use Team 1 — substitute your own team number for T.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-panel">
                <th className="px-4 py-2 eyebrow-muted font-semibold">Zone</th>
                <th className="px-4 py-2 eyebrow-muted font-semibold">Network</th>
                <th className="px-4 py-2 eyebrow-muted font-semibold">What lives there</th>
              </tr>
            </thead>
            <tbody>
              {ADDRESSING.map((a) => (
                <tr key={a.zone} className="border-b border-line last:border-0 odd:bg-panel even:bg-panel-2">
                  <td className="px-4 py-2 align-top text-xs font-semibold text-accent-ink">{a.zone}</td>
                  <td className="px-4 py-2 align-top font-mono text-xs text-ink">{a.net}</td>
                  <td className="px-4 py-2 align-top text-xs text-muted">
                    {a.hosts}
                    {a.note && <span className="block text-muted/80">{a.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line bg-panel px-4 py-2 text-xs text-muted">
          <span className="font-mono">{MONITORING_HOST.address}</span> is reserved for the optional{' '}
          {MONITORING_HOST.hostname} monitoring host. Your own business VMs start at{' '}
          <span className="font-mono">{TEAM_VM_START.vmbr2}</span> in the private zone and{' '}
          <span className="font-mono">{TEAM_VM_START.vmbr1}</span> in the DMZ.
        </p>
      </div>

      {/* Week switcher. Buttons rather than anchors: the anchor still exists on
          the section below for deep links, but clicking here should swap the
          week in place instead of jumping the page. */}
      <nav aria-label="Configuration guide weeks" className="flex flex-wrap gap-2">
        {WEEKS.map((w) => {
          const on = w.number === week;
          return (
            <button
              key={w.number}
              type="button"
              onClick={() => {
                setWeek(w.number);
                history.replaceState(null, '', `#config-week-${w.number}`);
              }}
              aria-current={on ? 'true' : undefined}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                on
                  ? 'border-accent bg-accent text-accent-contrast'
                  : 'border-line bg-panel text-body hover:border-accent hover:text-accent'
              }`}
            >
              Week {w.number}
              <span className="ml-1.5 opacity-70">{w.title}</span>
            </button>
          );
        })}
      </nav>

      <section id={`config-week-${active.number}`} className="scroll-mt-16 space-y-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-2">
          <h3 className="text-base font-bold text-ink">
            Week {active.number} · {active.title}
          </h3>
          {/* Week 0 is Preparation — not the first week of the arc, so it must
              not wear Week 1's colour. w1–w4 are the four phases. */}
          <span
            className="font-mono text-[10px] font-semibold uppercase leading-none tracking-wider"
            style={{ color: active.number === 0 ? 'var(--color-muted)' : `var(--color-w${Math.min(4, active.number)})` }}
          >
            {active.phase}
          </span>
          <span className="ml-auto font-mono text-[11px] text-muted">
            {procs.length} {procs.length === 1 ? 'procedure' : 'procedures'} · {steps} steps
          </span>
        </div>
        <p className="text-sm text-muted">{active.lead}</p>

        {/* A jump table, so you can find the one procedure you came for without
            reading past the others. */}
        {procs.length > 1 && (
          <ol className="grid gap-1 sm:grid-cols-2">
            {procs.map((p, i) => (
              <li key={p.id}>
                <a
                  href={`#${p.id}`}
                  className="flex items-baseline gap-2 rounded-md border border-line bg-panel-2 px-3 py-1.5 text-xs text-body transition-colors hover:border-accent hover:text-accent"
                >
                  <span className="font-mono text-[10px] text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">{p.title}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted">{p.steps.length}</span>
                </a>
              </li>
            ))}
          </ol>
        )}

        {procs.map((p) => (
          <article
            key={p.id}
            id={p.id}
            className="scroll-mt-16 overflow-hidden rounded-[var(--radius-card)] border border-line"
          >
            <div className="border-b border-line bg-panel-2 px-4 py-2.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h4 className="text-sm font-semibold text-ink">{p.title}</h4>
                {p.optional && (
                  <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                    {p.optionalLabel ?? 'Advanced · optional'}
                  </span>
                )}
                <span className="ml-auto eyebrow-muted">{p.where}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{p.summary}</p>
            </div>

            {/* Two columns: what you do, and what it does. A procedure is a
                table — the old shape put every explanation in a paragraph under
                its command, which reads as prose and scans as a wall. */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-left">
                <thead className="sr-only">
                  <tr>
                    <th>Step</th>
                    <th>Do this</th>
                    <th>What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {p.steps.map((s, i) => (
                    <tr key={i} className="border-b border-line last:border-0 align-top odd:bg-panel even:bg-panel-2">
                      <td className="w-8 py-2 pl-4 pr-1 font-mono text-[10px] leading-6 text-muted">{i + 1}</td>
                      <td className="w-[55%] py-2 pr-3">
                        {s.cmd ? <CommandLine cmd={s.cmd} /> : <span className="text-sm text-body">{s.gui}</span>}
                        {s.doc && (
                          <a
                            href={s.doc.href}
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                          >
                            {s.doc.label} <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted">{s.explain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

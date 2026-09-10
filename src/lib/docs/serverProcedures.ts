/**
 * The Server+ build procedures — the data behind `ServerConfigGuide`.
 *
 * Moved out of the component so a test can hold the seed to it: every step that
 * says "Exact clicks: … →" names a procedure id from this list, and
 * `serverProcedures.test.ts` asserts each one resolves and sits in the week the
 * step is in. The component is presentation only; this file is the manual.
 *
 * The procedures replace an instructor PDF that students had to open beside the
 * site. A hosted file cannot be corrected when the topology moves, and the ODT
 * it came from still describes the old design — a 10.10.10.x host, a jump box on
 * vmbr1, the website on IIS. Everything below is the corrected procedure for the
 * *current* topology, so the guide and the lab can never disagree again.
 *
 * Grouped by week rather than by machine because that is the order a student
 * meets them. The read-then-change discipline is kept within the week: the BIOS
 * and RAID inventory trips are read-only and exit without saving, and creating
 * the array is a separate procedure carrying its own warning.
 *
 * Command bodies keep their literal addresses inline on purpose: a copy button
 * has to hand the student the line they will actually type.
 */

import { HOST_CONSOLE_URL, HOST_ROOT_LOGIN } from '@/lib/serverTopology';

export type Step = {
  /** Exactly one of `cmd` or `gui` — a line you type, or a thing you click. */
  cmd?: string;
  gui?: string;
  explain: string;
  doc?: { label: string; href: string };
};

export type Procedure = {
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

export type WeekBlock = { number: number; title: string; phase: string; lead: string };

// These must match the course weeks in src/lib/data/seed/serverPlus.ts — a guide
// that names Week 2 differently from the week the student is standing in is a
// guide they stop trusting.
export const WEEKS: WeekBlock[] = [
  { number: 0, title: 'Preparation', phase: 'Get ready to build', lead: 'Prove your own seat works before the engagement starts.' },
  { number: 1, title: 'Bring the Server Up', phase: 'Receive & Install', lead: 'Receive it, fit it, post it, document it, build the array and install the hypervisor. Inventory trips read; the array and install trips change.' },
  { number: 2, title: 'Design & Deploy', phase: 'Design & Deploy', lead: 'Decide what runs on the hypervisor, then build it: bridges, VMs and their services.' },
  { number: 3, title: 'Network & Operate', phase: 'Network & Operate', lead: 'Make the addressing real, route between the zones, prove every path, and run it by procedure.' },
  { number: 4, title: 'Secure & Hand Over', phase: 'Secure & Hand Over', lead: 'Harden what is exposed, patch with a way back, and time a real restore.' },
  // The advanced track. Nothing here is required to finish the course; it is
  // where a student who has finished goes next. Every tool below replaces a
  // record the student already kept by hand, which is what makes seven tools
  // one week rather than seven.
  { number: 5, title: 'Automate & Observe', phase: 'Automate & Observe', lead: 'Define the lab in code, watch every host, run your own SIEM, and move the registers you kept on paper into NetBox and GLPI. About 18 GB of guests in total — a 16 GB server runs this one VM at a time.' },
  // The second advanced week. Week 5 gave the team its own tools on its own
  // server; Week 6 is the MSP question — do that for sixteen clients from one
  // console. Everything joins the instructor's Core node over a shared ops
  // network, and the proof is a VM destroyed and rebuilt from the repository.
  { number: 6, title: 'Run It as a Fleet', phase: 'Run It as a Fleet', lead: 'Put the site in Git, build it from a template, configure it with a playbook that changes nothing the second time, and hand its metrics, logs, backups and endpoints to the Core. Then destroy a VM and watch the repository bring it back.' },
];

export const PROCEDURES: Procedure[] = [
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
  // Remote access closes Week 1: the host has an address and the console
  // answers, and the previous procedure's own last line says a host you can only
  // reach at the keyboard is not finished. These two make it reachable, and make
  // it reachable BY NAME — four students share one server.
  {
    id: 'tailscale-remote-access',
    week: 1,
    title: 'Reach your host from home with Tailscale',
    where: 'The Proxmox host shell, then your own laptop',
    summary:
      'Put the host on a private Tailscale network so the team can administer it from off campus — SSH and the web console over an encrypted path, with no router port-forward and nothing new exposed to the Internet.',
    steps: [
      { cmd: 'timedatectl status', explain: 'Do this BEFORE anything that downloads over HTTPS. A host whose clock is wrong rejects valid certificates, and the failure reads like a broken installer or a dead mirror rather than a broken clock.' },
      { cmd: 'chronyc tracking', explain: 'Confirms the host is really synchronised to a time source rather than merely holding a plausible-looking clock. Correct the time before continuing if it is not.' },
      { cmd: 'curl -fsSL https://tailscale.com/install.sh | sh', explain: 'The official installer. It detects the Debian base that Proxmox VE is built on, adds the Tailscale package source, and installs the client and the tailscaled service.' },
      { cmd: 'tailscale up', explain: 'Prints a one-time authentication URL. ONE teammate opens it, signs in and approves this host — that person owns the team tailnet, and the next procedure invites everyone else into it.' },
      { cmd: 'tailscale ip -4', explain: 'Your host’s own Tailscale address, a 100.x address that belongs to this machine and does not change. Write it into the Server Bring-Up Log — it is how the team reaches this server from off campus. It is yours; another team’s server has a different one.' },
      { cmd: 'tailscale status', explain: 'Every device in the tailnet and whether it is online. pve-host must be listed here before you go home and try it.' },
      { cmd: 'systemctl is-active tailscaled', explain: 'Must print active. tailscaled runs as a system service, so remote access comes back after a reboot without anyone logging in at the keyboard.' },
      { cmd: 'ssh root@<tailscale-ip>', explain: 'From a laptop OFF the campus network, substituting the address tailscale ip -4 printed. A host-key prompt is expected the first time — it is the same machine at a new address — so verify the fingerprint before accepting it.' },
      { gui: 'With Tailscale connected on your laptop, browse to https://<tailscale-ip>:8006 and sign in exactly as you do on campus. The self-signed certificate warning is the same one, for the same reason.', explain: 'Tailscale supplies the private path; Proxmox still does its own authentication. The network path is not the login, and you have not opened a port on the campus router to get here.' },
      { gui: 'In the Tailscale admin console turn on MagicDNS, then reconnect the client on your laptop.', explain: 'This is a tailnet setting, not a record in the Windows DNS zone you build in Week 2 — that zone serves the private network and knows nothing about the tailnet. Students look there first every time.' },
      { cmd: 'ssh root@pve-host', explain: 'With MagicDNS on, the machine answers to its name from any device in the tailnet, so nobody has to keep a 100.x address written down. https://pve-host:8006 reaches the console the same way.' },
      { gui: 'Reboot the host once, on campus, and confirm it comes back on the tailnet before anyone relies on remote-only access.', explain: 'Prove it here, where you can still reach the keyboard, rather than discovering it at home on a Sunday.' },
      { cmd: 'tar -czf /root/pve-config-backup.tar.gz -C / etc/pve etc/network/interfaces etc/hosts etc/hostname var/lib/tailscale/tailscaled.state', explain: 'Backs up the host configuration together with the Tailscale identity. Without that state file a rebuilt host is a brand-new device that has to be authorised into the tailnet again.' },
    ],
  },
  {
    id: 'team-accounts-shared-host',
    week: 1,
    title: 'One account each on the shared host',
    where: 'The host shell, then Datacenter → Permissions in the web console',
    summary:
      'Four of you share one server. Give every teammate a named Linux account with sudo, add it to Proxmox in the PAM realm through one group, and get everyone onto the team tailnet — so the log can say who did what and nobody works as root.',
    steps: [
      { gui: 'Agree who owns what before anyone types: one person owns the tailnet (whoever ran tailscale up), and every teammate gets their own login on the host.', explain: 'Your Baselines, Policies & Standards form already carries the rule as a policy row — named admin accounts only, no shared logins. This is the procedure that makes it true.' },
      { cmd: 'apt update && apt install -y sudo', explain: 'Proxmox VE ships without sudo, because the only account it expects anyone to use is root. A named account cannot administer anything until this is installed.' },
      { cmd: 'adduser alex', explain: 'Run once per teammate, substituting their name. It creates the Linux account and prompts for a password that only that person should type.' },
      { cmd: 'usermod -aG sudo alex', explain: 'Puts the account in the sudo group, so it can run administrative commands and every one of them is attributable to a name.' },
      { gui: 'In the web console: Datacenter → Permissions → Groups → Create, and name the group teamadmins.', explain: 'Permission goes to a group, not to four people one at a time. Adding or removing somebody later is then one change in one place.' },
      { gui: 'Datacenter → Permissions → Add → Group Permission. Set Path to /, Group to teamadmins, Role to PVEAdmin.', explain: 'PVEAdmin can run the whole build — VMs, storage, networking — but cannot hand out permissions. Administrator could, which would let any teammate quietly grant themselves more than the team agreed.' },
      { gui: 'Datacenter → Permissions → Users → Add. Set Realm to "Linux PAM standard authentication", User name to the Linux account you just created, and Group to teamadmins. Repeat for each teammate.', explain: 'The pam realm points Proxmox at the host’s own Linux users, so each person has ONE identity that works for both SSH and the console. The pve realm is a separate Proxmox-only user database — real, but it would hand everybody a second password to lose.' },
      { cmd: 'pveum user list', explain: 'Read the result back rather than trusting the dialog. Every teammate should appear as name@pam, enabled, in teamadmins.' },
      { gui: 'Tailnet: the owner opens the Tailscale admin console and invites the other three teammates and the instructor. Each installs Tailscale on their own laptop, signs in with that invitation, and confirms the host shows up in their own device list.', explain: 'Being a user of the tailnet is what makes the host’s 100.x address reachable for them. Passing one person’s Tailscale login around would undo the naming you just did on the host.' },
      { cmd: 'ssh-keygen -t ed25519 -C "alex@capstone"', explain: 'Run this on YOUR OWN laptop, not on the server. It makes a key pair: a private half that never leaves your machine and a public half you are about to hand to the host. Give it a passphrase.' },
      { cmd: 'ssh-copy-id alex@<tailscale-ip>', explain: 'Also from your laptop, over the tailnet. It appends your public key to that account\'s authorized_keys on the host. It asks for the password one last time — that is the point at which the password stops being the only way in.' },
      { cmd: 'ssh alex@<tailscale-ip>', explain: 'Log in again. If it does not ask for the account password, key authentication is working. Every teammate does this with their own key, on their own laptop — a key that two people share is a shared login wearing a different hat.' },
      { gui: 'STOP before going further: do not disable password authentication and do not lock the root account until every teammate has proved their own account signs in and runs sudo.', explain: 'You can now reach this server from anywhere, which means you can also lock yourself out of it from anywhere. Week 4 hardens SSH deliberately, with a way back.' },
      { gui: `Last: change the root password away from the classroom one (${HOST_ROOT_LOGIN.password}) now that everyone has their own account, and record in the Bring-Up Log that you did.`, explain: 'It was typed in front of the room on install day and is written in the course material. Rotating it is the moment the named accounts start to mean something.' },
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
    week: 5,
    title: 'Stand up Prometheus and Grafana',
    where: 'A new secmon VM in the private zone, and every other VM',
    summary:
      'Build the monitoring VM from the Architecture Brief, install Prometheus and Grafana on it, put an exporter on every host, and confirm every target reports UP. The route to the DMZ already exists from Week 3, so websrv is scraped from the start.',
    steps: [
      { gui: 'In the Proxmox web console create a VM named secmon: Ubuntu Server ISO, 2 cores, 6144 MB RAM, 80 GB disk, Bridge vmbr2. Install Ubuntu with the static address 192.168.0.4/24, gateway 192.168.0.1, DNS 192.168.0.2.', explain: 'Matches the secmon row in the Architecture Brief. It lives in the private zone — monitoring is never exposed in the DMZ.' },
      { cmd: 'sudo apt update && sudo apt install -y prometheus prometheus-node-exporter', explain: 'Run on secmon. Installs the Prometheus server and an exporter for secmon itself.' },
      { cmd: 'sudo apt install -y apt-transport-https software-properties-common wget', explain: 'Prerequisites for adding the Grafana repository.' },
      { cmd: 'sudo mkdir -p /etc/apt/keyrings && wget -q -O - https://apt.grafana.com/gpg.key | sudo gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null', explain: 'Adds the Grafana signing key in the modern keyrings location.' },
      { cmd: 'echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list', explain: 'Adds the repository. Grafana is not in the Ubuntu archive.' },
      { cmd: 'sudo apt update && sudo apt install -y grafana && sudo systemctl enable --now grafana-server', explain: 'Installs Grafana and starts it on port 3000.' },
      { cmd: 'sudo apt install -y prometheus-node-exporter', explain: 'Run this on websrv (172.16.0.10) and linuxsrv (192.168.0.3) too. Each exposes metrics on port 9100.' },
      { gui: 'On winserver, download the windows_exporter MSI from its GitHub releases page onto the VM.', explain: 'Windows needs a different exporter; it listens on port 9182.' },
      { cmd: 'msiexec /i windows_exporter-amd64.msi ENABLED_COLLECTORS="cpu,cs,logical_disk,net,os,service,system,memory" /quiet', explain: 'Run in an elevated PowerShell on winserver, substituting the exact filename you downloaded.' },
      {
        cmd: 'sudo nano /etc/prometheus/prometheus.yml',
        explain: 'Run on secmon. Open the file and add the job below as a new list item under the existing scrape_configs: key, at the same indentation as the job already there. Do not append it blindly to the end of the file — this is a structured YAML document, and where the block lands is what makes it valid.',
      },
      {
        cmd: `  - job_name: capstone_nodes
    static_configs:
      - targets: ['192.168.0.4:9100','192.168.0.3:9100','192.168.0.2:9182','172.16.0.10:9100']`,
        explain: 'Four targets — secmon and linuxsrv on 9100, winserver on 9182, websrv across the DMZ route on 9100. Paste it inside scrape_configs, two spaces before the dash, exactly as shown.',
      },
      { cmd: 'sudo ip route add 172.16.0.0/24 via 192.168.0.1', explain: 'On secmon, and persist it in netplan exactly as you did on linuxsrv in Week 3. secmon is a private-zone host like any other: without this route it cannot reach websrv.' },
      { cmd: 'sudo systemctl restart prometheus && systemctl status prometheus --no-pager', explain: 'Reloads the scrape config. A YAML error shows up here, not later.' },
      { gui: 'Browse to http://192.168.0.4:9090/targets and confirm all four targets read UP, then log into Grafana at http://192.168.0.4:3000 (admin/admin, change the password) and add Prometheus at http://localhost:9090 as a data source.', explain: 'Screenshot the targets page into 08_Evidence.' },
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
    week: 5,
    title: 'Add Loki and a one-glance dashboard',
    where: 'The secmon VM (192.168.0.4) and every other host',
    summary:
      'Ship logs from every host into Loki with Grafana Alloy, and build one Grafana dashboard that shows each VM up, its address and its logs — turning the Week-3 connectivity proof, done once by hand, into one that runs every minute. Alloy, not Promtail: Promtail was deprecated in February 2025 and reached end of life on 2 March 2026.',
    steps: [
      { cmd: 'sudo apt install -y loki && sudo systemctl enable --now loki', explain: 'Run on secmon. From the Grafana repository you added with Grafana. Loki listens on 3100.' },
      { cmd: 'curl -s http://localhost:3100/ready', explain: 'On secmon. Must return ready before agents can ship to it.' },
      { cmd: 'sudo mkdir -p /etc/apt/keyrings && wget -q -O - https://apt.grafana.com/gpg.key | sudo gpg --dearmor | sudo tee /etc/apt/keyrings/grafana.gpg > /dev/null && echo "deb [signed-by=/etc/apt/keyrings/grafana.gpg] https://apt.grafana.com stable main" | sudo tee /etc/apt/sources.list.d/grafana.list && sudo apt update && sudo apt install -y alloy', explain: 'On websrv, linuxsrv and secmon — the log agent. Alloy ships from the same Grafana repository; the two hosts that do not have it yet add it here.', doc: { label: 'Grafana Alloy — install on Debian/Ubuntu', href: 'https://grafana.com/docs/alloy/latest/set-up/install/linux/' } },
      { cmd: `sudo tee /etc/alloy/config.alloy >/dev/null <<'EOF'
local.file_match "system" {
  path_targets = [{ __path__ = "/var/log/*.log", job = "varlogs", host = constants.hostname }]
}

loki.source.file "system" {
  targets    = local.file_match.system.targets
  forward_to = [loki.write.default.receiver]
}

loki.source.journal "journal" {
  labels     = { job = "journal", host = constants.hostname }
  forward_to = [loki.write.default.receiver]
}

loki.write "default" {
  endpoint {
    url = "http://192.168.0.4:3100/loki/api/v1/push"
  }
}
EOF
sudo usermod -aG adm,systemd-journal alloy && sudo systemctl enable --now alloy`, explain: 'The agent configuration, on every Linux host: every file under /var/log and the systemd journal, labelled with the hostname, pushed to Loki on secmon. The two groups let the alloy user read them.' },
      { cmd: 'systemctl status alloy --no-pager && sudo journalctl -u alloy -n 5 --no-pager', explain: 'On each host. Active (running), and no "connection refused" in the last lines — that would mean secmon or its port 3100 is unreachable from here.' },
      { gui: 'In Grafana at http://192.168.0.4:3000, add a Loki data source pointing at http://localhost:3100.', explain: 'Grafana now has both Prometheus (metrics) and Loki (logs).' },
      { gui: 'Build one dashboard with a stat panel per host driven by the Prometheus up metric, a table of each host address, and a logs panel querying Loki.', explain: 'One screen that answers "is everything up and reachable?" — the same question the Week-3 manual checks answered once.' },
      { gui: 'Screenshot the dashboard into 08_Evidence.', explain: 'This is the evidence that the connectivity proof is now continuous rather than a one-off.' },
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
  // The host is hardened FIRST in Week 4, because it is the one machine that is
  // now reachable from off campus and the one every other procedure is driven
  // from. Week 1 created the named accounts and the keys; this is where the
  // password door closes behind them.
  {
    id: 'harden-proxmox-host-access',
    week: 4,
    title: 'Harden the way into the Proxmox host itself',
    where: 'The Proxmox host shell, over Tailscale',
    summary:
      'Close the root password door on the hypervisor now that every teammate has a named account and a key. Keys stay, root passwords go, and the console and the physical keyboard remain as the way back.',
    steps: [
      { gui: 'Before you change anything, name your two ways back in and check both: the Proxmox web console in a browser, and the physical keyboard at the rack.', explain: 'This is the procedure with the most potential to lock four people out of one server. Neither way back depends on SSH, which is what you are about to change.' },
      { cmd: 'ssh alex@<tailscale-ip>', explain: 'Prove key login works for a named account, right now, from the machine you will use later. If this asks for a password, the key is not in place and you must stop here — Week 1 has the ssh-copy-id procedure.' },
      { cmd: 'sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak', explain: 'Back up before editing, exactly as you did on websrv. This file is how you get in.' },
      { cmd: `sudo sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config`, explain: 'prohibit-password, not no: root can still log in WITH A KEY, which keeps an emergency route for whoever holds it, but the root password stops being a way in over the network.' },
      { cmd: `grep -E '^(PermitRootLogin|PasswordAuthentication)' /etc/ssh/sshd_config`, explain: 'Read it back. PasswordAuthentication stays yes on this host: your teammates\' named accounts still need it until every one of them has a working key, and turning it off early is how a team loses its own server.' },
      { cmd: 'sudo sshd -t', explain: 'Validates the file. Silence means valid. A typo caught here is a typo that never locked anybody out.' },
      { cmd: 'sudo systemctl restart ssh', explain: 'Applies it. KEEP YOUR CURRENT SESSION OPEN and prove a new one works in a second window before you close this one.' },
      { gui: 'Datacenter → Firewall: read the rules before you enable enforcement, and leave it off unless you have deliberately allowed 22 and 8006 from the tailnet.', explain: 'The instructor SOP is explicit about this one: enabling the Proxmox firewall blindly while you depend on remote administration is the fastest way to lose the server you are administering.' },
      { gui: 'Optional: Datacenter → Permissions → Two Factor, add TOTP to each named account.', explain: 'Worth doing on a host reachable from anywhere. Worth thinking about first on a shared server: a lost TOTP secret on an account four people rely on locks all four out, so record the recovery keys where the team can reach them.' },
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
    week: 5,
    title: 'Alert on the failures the DR plan cares about',
    where: 'Grafana on the secmon VM (192.168.0.4)',
    summary:
      'Turn the monitoring stack into something that notices a failure before a person does: alerts for host down, disk nearly full and a failed service, one of them tested for real.',
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

  // ── Week 5 — the rest of the advanced track ────────────────────────────────
  {
    id: 'pve-exporter-host',
    week: 5,
    title: 'Scrape the Proxmox host itself',
    where: 'The Proxmox host shell, then secmon',
    summary:
      'Prometheus watches the guests but not the machine they run on. prometheus-pve-exporter reads the Proxmox API with a read-only token and publishes host, storage and VM state as metrics — the one target that tells you the hypervisor is in trouble before every VM alert fires at once.',
    steps: [
      { cmd: 'pveum user add prometheus@pve --comment "read-only, for pve-exporter"', explain: 'On the Proxmox host. A user of its own, so the token can be revoked without touching anyone else.' },
      { cmd: 'pveum aclmod / -user prometheus@pve -role PVEAuditor', explain: 'PVEAuditor is the built-in read-only role. Nothing the exporter holds can change anything.' },
      { cmd: 'pveum user token add prometheus@pve exporter --privsep=0', explain: 'Prints the token value ONCE. Copy it into a password manager now — it cannot be shown again.' },
      { cmd: 'sudo apt install -y pipx && pipx install prometheus-pve-exporter', explain: 'On secmon. pipx keeps the exporter and its dependencies out of the system Python.' },
      { cmd: `sudo mkdir -p /etc/prometheus && sudo tee /etc/prometheus/pve.yml >/dev/null <<'EOF'
default:
  user: prometheus@pve
  token_name: exporter
  token_value: PASTE_THE_TOKEN_VALUE_HERE
  verify_ssl: false
EOF
sudo chmod 600 /etc/prometheus/pve.yml`, explain: 'The exporter’s credentials. Mode 600 because this file IS a credential; verify_ssl off because the host uses its self-signed certificate.' },
      { cmd: `sudo tee /etc/systemd/system/pve-exporter.service >/dev/null <<'EOF'
[Unit]
Description=Prometheus Proxmox VE exporter
After=network.target
[Service]
ExecStart=/root/.local/bin/pve_exporter --config.file /etc/prometheus/pve.yml --web.listen-address 0.0.0.0:9221
Restart=on-failure
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now pve-exporter`, explain: 'Runs it as a service on 9221. If pipx installed under your own user, the path is ~/.local/bin/pve_exporter — check with which pve_exporter.' },
      { cmd: 'curl -s "http://localhost:9221/pve?target=10.10.30.T&module=default" | grep -c pve_', explain: 'A number in the hundreds means the exporter reached the host. Zero, or an error page, means the token or address is wrong.' },
      { cmd: `  - job_name: proxmox_host
    metrics_path: /pve
    params:
      module: [default]
    static_configs:
      - targets: ['10.10.30.T']
    relabel_configs:
      - source_labels: [__address__]
        target_label: __param_target
      - source_labels: [__param_target]
        target_label: instance
      - target_label: __address__
        replacement: 192.168.0.4:9221`, explain: 'Add to scrape_configs in /etc/prometheus/prometheus.yml on secmon. The relabel block is what makes Prometheus ask the exporter about the host rather than about itself — copy it exactly.' },
      { cmd: 'sudo systemctl restart prometheus', explain: 'Browse to http://192.168.0.4:9090/targets: proxmox_host is the fifth target, UP.' },
      { gui: 'In Grafana import dashboard 10347 (Proxmox via Prometheus) from grafana.com, choosing your Prometheus data source.', explain: 'Host CPU, memory, storage and every VM’s state on one screen, from data you already collect.' },
    ],
  },
  {
    id: 'pulse-proxmox',
    week: 5,
    title: 'Pulse: the Proxmox dashboard that watches backups',
    where: 'The Proxmox host shell, then secmon',
    summary:
      'Pulse is a small dashboard built for Proxmox: nodes, VMs, storage and — the part Grafana does not have — backup jobs and whether the last one succeeded. It runs on secmon with a read-only API token and alerts when a backup fails, which is the failure a DR plan most needs to hear about.',
    steps: [
      { cmd: 'pveum user add pulse@pve --comment "read-only, for Pulse"', explain: 'On the Proxmox host. Its own user, same reason as the exporter.' },
      { cmd: 'pveum aclmod / -user pulse@pve -role PVEAuditor', explain: 'Read-only.' },
      { cmd: 'pveum user token add pulse@pve dashboard --privsep=0', explain: 'Copy the value the moment it prints.' },
      { cmd: 'curl -fsSL https://raw.githubusercontent.com/rcourtman/Pulse/main/install.sh | bash', explain: 'On secmon. The install script drops a single binary and a systemd unit; Pulse listens on 7655.', doc: { label: 'Pulse README', href: 'https://github.com/rcourtman/Pulse' } },
      { cmd: 'systemctl status pulse --no-pager', explain: 'active (running). If the unit is named differently on your build the script prints the name it used.' },
      { gui: 'Browse to http://192.168.0.4:7655, set the admin password, then Settings → Proxmox → Add node: host https://10.10.30.T:8006, token ID pulse@pve!dashboard, and the token value. Skip certificate verification.', explain: 'Your node appears with every VM, its storage and its backups within a minute.' },
      { gui: 'Open the Backups view and confirm the Week-4 backup job is listed with its last run. Then Settings → Alerts: enable the backup-failed alert and add an email or webhook destination.', explain: 'A backup nobody notices failing is the same as no backup. This is the alert the DR plan actually needs.' },
      { gui: 'Screenshot the Backups view into 08_Evidence and add a Pulse row to the tooling table in the DR Plan & As-Built Handover.', explain: 'Pulse holds the backup status that used to be a manual weekly check in the SOPs.' },
    ],
  },
  {
    id: 'wazuh-single-node',
    week: 5,
    title: 'Install your own Wazuh manager',
    where: 'A new wazuh VM in the private zone',
    summary:
      'One VM, one script: the Wazuh assisted installer puts the manager, the indexer and the dashboard on a single host. Four GB of RAM is the floor — the indexer will not start on less. When it finishes you have the same SIEM the CySA+ course runs, except this one is yours.',
    steps: [
      { gui: 'In the Proxmox web console create a VM named wazuh: Ubuntu Server ISO, 2 cores, 4096 MB RAM, 50 GB disk, Bridge vmbr2. Install Ubuntu with the static address 192.168.0.20/24, gateway 192.168.0.1, DNS 192.168.0.2. Or create it with Terraform — the point of the track.', explain: 'Matches the wazuh row in the Architecture Brief. Private zone: a SIEM holds every host’s security events and is never exposed.' },
      { cmd: 'curl -sO https://packages.wazuh.com/4.x/wazuh-install.sh', explain: 'On the wazuh VM. The assisted installer.', doc: { label: 'Wazuh quickstart', href: 'https://documentation.wazuh.com/current/quickstart.html' } },
      { cmd: 'sudo bash ./wazuh-install.sh -a', explain: '-a is all-in-one. Takes ten to fifteen minutes. The last lines print the admin password — copy it now, it is not stored anywhere you can read later.' },
      { cmd: 'sudo systemctl status wazuh-manager wazuh-indexer wazuh-dashboard --no-pager | grep Active', explain: 'Three lines, all active (running). The indexer is the one that fails on a small VM.' },
      { cmd: 'sudo ss -ltnp | grep -E ":(443|1514|1515|55000) "', explain: 'The dashboard (443), agent data (1514), agent enrolment (1515) and the API (55000) are all listening.' },
      { gui: 'Browse to https://192.168.0.20 and sign in as admin with the printed password. Change it under the admin menu → Reset password.', explain: 'The dashboard is empty until an agent enrols — that is the next procedure.' },
    ],
  },
  {
    id: 'wazuh-enrol-agents',
    week: 5,
    title: 'Enrol every VM as a Wazuh agent',
    where: 'websrv, linuxsrv and winserver',
    summary:
      'An agent per host, each named so you can find it, each pointed at 192.168.0.20. Linux agents ship auth and syslog and watch /etc for changes out of the box; the Windows agent ships the Security event log. Then prove the pipeline with a deliberate SSH brute force.',
    steps: [
      { cmd: 'sudo -i', explain: 'On websrv first, then linuxsrv. Everything below runs as root.' },
      { cmd: 'curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && chmod 644 /usr/share/keyrings/wazuh.gpg', explain: 'Trust the Wazuh signing key.', doc: { label: 'Wazuh agent (Linux)', href: 'https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-linux.html' } },
      { cmd: 'echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | tee /etc/apt/sources.list.d/wazuh.list && apt-get update', explain: 'Add the repository and refresh.' },
      { cmd: 'WAZUH_MANAGER="192.168.0.20" WAZUH_AGENT_NAME="websrv" apt-get install -y wazuh-agent', explain: 'Manager address and a name, at install time. On linuxsrv the name is linuxsrv. An unnamed agent enrols under its hostname, which is fine here but say it on purpose.' },
      { cmd: 'systemctl daemon-reload && systemctl enable --now wazuh-agent && tail -n 5 /var/ossec/logs/ossec.log', explain: 'The proof: a line reading Connected to the server (192.168.0.20:1514/tcp). websrv reaches the manager through the DMZ→private route from Week 3.' },
      { cmd: 'ufw allow out to 192.168.0.20 port 1514 proto tcp && ufw allow out to 192.168.0.20 port 1515 proto tcp', explain: 'Only needed if you tightened outbound rules in Week 4. Inbound needs nothing: agents call out.' },
      { cmd: `Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.9.2-1.msi -OutFile $env:tmp\\wazuh-agent.msi
msiexec.exe /i $env:tmp\\wazuh-agent.msi /q WAZUH_MANAGER='192.168.0.20' WAZUH_AGENT_NAME='winserver'
NET START WazuhSvc`, explain: 'In an elevated PowerShell on winserver. Use the current 4.x version from the agent download page — the filename changes with the release.', doc: { label: 'Wazuh agent (Windows)', href: 'https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-windows.html' } },
      { gui: 'In the dashboard open Agents: websrv, linuxsrv and winserver all read Active. Screenshot it into 08_Evidence.', explain: 'Disconnected means the agent installed but never reached 1514 — check the route and the firewall before anything else.' },
      { cmd: 'for i in 1 2 3 4 5 6 7 8; do ssh -o BatchMode=yes -o ConnectTimeout=2 nobody@172.16.0.10 true 2>/dev/null; done', explain: 'From your workstation: eight failed logins in a row against websrv. This is the brute force the SIEM exists to notice.' },
      { gui: 'Dashboard → Threat Hunting → Events, filter agent.name: websrv. Within a minute rule 5710 (login with non-existent user) appears eight times and rule 5712 (sshd brute force) once, level 10.', explain: 'One real attack, one real detection, with a timestamp. Screenshot it and write both times into the DR Plan & As-Built Handover.' },
      { gui: 'Integrity Monitoring → websrv: edit /etc/nginx/nginx.conf on websrv (add a comment line) and watch the alert arrive.', explain: 'FIM on /etc is on by default. Now a tampered config is an event, not a mystery found weeks later.' },
    ],
  },
  {
    id: 'terraform-proxmox-provider',
    week: 5,
    title: 'Terraform: a token, a provider, a plan',
    where: 'The Proxmox host shell, then your workstation',
    summary:
      'Infrastructure as code starts with a credential Terraform may use and a provider that speaks Proxmox. The token lives in an environment variable and never in a file you might commit; the provider block goes in main.tf; the first plan proves the two can talk.',
    steps: [
      { cmd: 'pveum user add terraform@pve --comment "Terraform provider"', explain: 'On the Proxmox host. Terraform gets its own identity so its changes are attributable in the task log.' },
      { cmd: 'pveum role add Terraform -privs "Datastore.Allocate Datastore.AllocateSpace Datastore.AllocateTemplate Datastore.Audit Pool.Allocate Sys.Audit Sys.Console Sys.Modify SDN.Use VM.Allocate VM.Audit VM.Clone VM.Config.CDROM VM.Config.Cloudinit VM.Config.CPU VM.Config.Disk VM.Config.HWType VM.Config.Memory VM.Config.Network VM.Config.Options VM.Migrate VM.Monitor VM.PowerMgmt User.Modify"', explain: 'The privileges the provider documents. Not Administrator: a tool that can build VMs should not be able to delete users.', doc: { label: 'bpg/proxmox provider docs', href: 'https://registry.terraform.io/providers/bpg/proxmox/latest/docs' } },
      { cmd: 'pveum aclmod / -user terraform@pve -role Terraform', explain: 'Grant it at the root, so it applies to every node and datastore.' },
      { cmd: 'pveum user token add terraform@pve provider --privsep=0', explain: 'Copy the token value now. --privsep=0 means the token carries the user’s permissions rather than a subset.' },
      { cmd: 'sudo apt update && sudo apt install -y gnupg software-properties-common && wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list && sudo apt update && sudo apt install -y terraform', explain: 'On your workstation (Ubuntu shown; the Windows installer is on the same page). Terraform runs where you type, against the host’s API.', doc: { label: 'Install Terraform', href: 'https://developer.hashicorp.com/terraform/install' } },
      { cmd: `mkdir -p ~/ServerPlus_Capstone/00_Planning/terraform && cd ~/ServerPlus_Capstone/00_Planning/terraform && cat > main.tf <<'EOF'
terraform {
  required_providers {
    proxmox = {
      source  = "bpg/proxmox"
      version = "~> 0.60"
    }
  }
}

provider "proxmox" {
  endpoint = "https://10.10.30.T:8006/"
  insecure = true
  # The API token comes from PROXMOX_VE_API_TOKEN in the environment.
  # It is never written into this file.
}
EOF`, explain: 'The provider block, in the planning folder so the file is filed with the design. Replace T with your team number.' },
      { cmd: "export PROXMOX_VE_API_TOKEN='terraform@pve!provider=PASTE_THE_TOKEN_VALUE_HERE'", explain: 'The credential, in the shell only. Close the terminal and it is gone; commit main.tf and nothing secret goes with it.' },
      { cmd: 'terraform init && terraform plan', explain: 'init downloads the provider; plan authenticates and, with no resources yet, reports No changes. An authentication error here is the token, the endpoint, or the T you forgot to replace.' },
    ],
  },
  {
    id: 'terraform-first-vm-and-import',
    week: 5,
    title: 'Terraform: a template, a VM from code, and the existing three imported',
    where: 'The Proxmox host shell, then your workstation',
    summary:
      'A cloud-init template makes a VM a clone rather than an install. main.tf then creates the tools VM from it — a machine you never clicked through — and terraform import brings websrv, winserver and linuxsrv under the same state, so the whole lab is described in one file that plan can check against reality.',
    steps: [
      { cmd: 'cd /var/lib/vz/template/iso && wget -q https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img', explain: 'On the Proxmox host. Ubuntu’s cloud image: a disk that boots and configures itself from cloud-init instead of an installer.' },
      { cmd: 'qm create 9000 --name ubuntu-cloud --memory 2048 --cores 2 --net0 virtio,bridge=vmbr2 --scsihw virtio-scsi-pci --ostype l26', explain: 'An empty VM shell with the template ID 9000. The bridge is a default the clone will override.' },
      { cmd: 'qm set 9000 --scsi0 local-lvm:0,import-from=/var/lib/vz/template/iso/noble-server-cloudimg-amd64.img && qm set 9000 --ide2 local-lvm:cloudinit --boot order=scsi0 --serial0 socket --vga serial0 && qm disk resize 9000 scsi0 20G', explain: 'Attach the cloud image as the disk, add the cloud-init drive, boot from the disk. Substitute your storage name if it is not local-lvm.' },
      { cmd: 'qm set 9000 --ciuser ubuntu --sshkeys ~/.ssh/authorized_keys --ipconfig0 ip=dhcp && qm template 9000', explain: 'Default user and your key baked in, then converted to a template — it can now only be cloned, never started.' },
      { cmd: `cat >> main.tf <<'EOF'

resource "proxmox_virtual_environment_vm" "tools" {
  name      = "tools"
  node_name = "pve-host"
  vm_id     = 121

  clone {
    vm_id = 9000
  }

  cpu {
    cores = 2
  }

  memory {
    dedicated = 4096
  }

  disk {
    datastore_id = "local-lvm"
    interface    = "scsi0"
    size         = 40
  }

  network_device {
    bridge = "vmbr2"
  }

  initialization {
    ip_config {
      ipv4 {
        address = "192.168.0.21/24"
        gateway = "192.168.0.1"
      }
    }
    dns {
      servers = ["192.168.0.2"]
    }
  }
}
EOF`, explain: 'On your workstation, in the terraform folder. The tools VM as a description: what it is, not how to click it. node_name is your host’s name from the console’s left pane.' },
      { cmd: 'terraform plan -out tools.plan && terraform apply tools.plan', explain: 'plan shows one resource to add; apply builds it. Two minutes later ssh ubuntu@192.168.0.21 answers, on a machine no one installed.' },
      { cmd: 'terraform import proxmox_virtual_environment_vm.websrv pve-host/100', explain: 'Bring the existing websrv under state — its VM ID is in the console; 100 is the usual first. Add an empty resource "proxmox_virtual_environment_vm" "websrv" {} block to main.tf first, then fill it in from terraform state show until plan reports no changes. Repeat for winserver and linuxsrv.' },
      { cmd: 'terraform plan', explain: 'The finish line: No changes. Your infrastructure matches your configuration. main.tf now describes all four VMs and is the truest as-built you have — file it in 00_Planning and hash it.' },
    ],
  },
  {
    id: 'netbox-ipam',
    week: 5,
    title: 'NetBox: the rack and the IP plan, as a system of record',
    where: 'The tools VM (192.168.0.21)',
    summary:
      'NetBox holds the two registers you kept as forms — the 24U rack elevation and the IP plan — and holds them as data: a device at a U, a prefix with its addresses and what each one belongs to. Fill it from your own forms, then export it, and the export should match the form to the row.',
    steps: [
      { cmd: 'sudo apt update && sudo apt install -y docker.io docker-compose-v2 git && sudo usermod -aG docker $USER && newgrp docker', explain: 'On tools. Docker is how both NetBox and GLPI ship; adding yourself to the docker group saves a sudo on every command.' },
      { cmd: 'git clone -b release https://github.com/netbox-community/netbox-docker.git ~/netbox-docker && cd ~/netbox-docker', explain: 'The maintained compose bundle.', doc: { label: 'netbox-docker', href: 'https://github.com/netbox-community/netbox-docker' } },
      { cmd: `tee docker-compose.override.yml >/dev/null <<'EOF'
services:
  netbox:
    ports:
      - "8000:8080"
EOF`, explain: 'Publish the web UI on 8000. Without this override the container is only reachable from inside Docker.' },
      { cmd: 'docker compose pull && docker compose up -d', explain: 'Pulls NetBox, PostgreSQL and Redis and starts them. First start takes a few minutes while the database migrates — watch with docker compose logs -f netbox.' },
      { cmd: 'docker compose exec netbox /opt/netbox/netbox/manage.py createsuperuser', explain: 'Your admin account. Runs inside the container.' },
      { gui: 'Browse to http://192.168.0.21:8000 and sign in. Organization → Sites → Add: your company from the Architecture Brief. Then Racks → Add: 24U, at that site.', explain: 'The rack you planned in Week 2, now a record something else can query.' },
      { gui: 'Devices → Device Types → Add one per model in your Rack, Power & Asset Register (server 2U, switch 1U, patch panel 1U, PDU 1U); then Devices → Add each, at the U position the register gives it.', explain: 'The elevation NetBox draws is the one you drew on paper. If they disagree, one of them is wrong.' },
      { gui: 'IPAM → Prefixes → Add 172.16.0.0/24 (DMZ) and 192.168.0.0/24 (private). Then IP Addresses → Add every address from your IP Plan & Connectivity Proof, each assigned to its device, and mark the gateways.', explain: 'The plan becomes IPAM: the next address a colleague needs is a click, not a search through a form.' },
      { gui: 'IP Addresses → Export → CSV. Save it into 08_Evidence as 20260915_TeamXX_netbox_ipam.csv and hash it.', explain: 'Compare it line by line with the IP plan form. Every difference is a finding for the As-Built.' },
    ],
  },
  {
    id: 'glpi-assets-and-change',
    week: 5,
    title: 'GLPI: the asset register and the change log, as tickets',
    where: 'The tools VM (192.168.0.21)',
    summary:
      'GLPI is the helpdesk and asset system a small company would actually run. The hardware and software assets from your register go in as inventory; one row from your change log goes in as a change ticket with its rollback attached; the GLPI Agent on winserver proves inventory can arrive by itself.',
    steps: [
      { cmd: `mkdir -p ~/glpi && cd ~/glpi && tee docker-compose.yml >/dev/null <<'EOF'
services:
  db:
    image: mariadb:11
    environment:
      MARIADB_ROOT_PASSWORD: change-me-root
      MARIADB_DATABASE: glpi
      MARIADB_USER: glpi
      MARIADB_PASSWORD: change-me-glpi
    volumes:
      - glpi-db:/var/lib/mysql
  glpi:
    image: diouxx/glpi
    ports:
      - "8080:80"
    volumes:
      - glpi-www:/var/www/html/glpi
    depends_on:
      - db
volumes:
  glpi-db:
  glpi-www:
EOF
docker compose up -d`, explain: 'On tools, beside NetBox. A community-maintained GLPI image over the official MariaDB image; change both passwords before you run it.', doc: { label: 'GLPI install documentation', href: 'https://glpi-install.readthedocs.io/en/latest/' } },
      { gui: 'Browse to http://192.168.0.21:8080 and walk the installer: database host db, user glpi, the password you set. Sign in as glpi / glpi and change it immediately — the installer warns you, and it means it.', explain: 'Four default accounts exist after install; the installer lists them. Change or disable every one.' },
      { gui: 'Assets → Computers → Add one per machine in your Rack, Power & Asset Register: name, serial, location (the rack and U), status. Then Assets → Software → Add each installed program with its support-end date.', explain: 'The register, as inventory. The support-end dates are what make this worth more than the spreadsheet — GLPI can report what expires next.' },
      { gui: 'Assistance → Changes → Add: pick one row from your Operations Log & SOPs, enter it as a change with the same title, the plan, the rollback in the Rollback plan field, and the approver as validator. Move it through Evaluation → Approval → Applied → Closed.', explain: 'Change control with an approver, which the Management deep-dive documented in Week 3, now enforced by the tool rather than by habit.' },
      { cmd: `Invoke-WebRequest -Uri https://github.com/glpi-project/glpi-agent/releases/latest/download/GLPI-Agent-x64.msi -OutFile $env:tmp\\glpi-agent.msi
msiexec /i $env:tmp\\glpi-agent.msi /quiet SERVER='http://192.168.0.21:8080/front/inventory.php' RUNNOW=1`, explain: 'In an elevated PowerShell on winserver. The agent inventories the machine and posts it to GLPI.', doc: { label: 'GLPI Agent', href: 'https://glpi-agent.readthedocs.io/' } },
      { gui: 'Assets → Computers: winserver now carries an inventory it reported itself — CPU, memory, disks, installed software. Screenshot it into 08_Evidence.', explain: 'Compare it with the row you typed. The agent’s numbers are the truth; the register was the intention.' },
    ],
  },

  // ══ WEEK 6 · Run It as a Fleet ═══════════════════════════════════════════
  //
  // Week 5 put the team's own tools on the team's own server. Week 6 asks the
  // MSP question: do that for sixteen clients from one console. The instructor
  // runs one Core node — Git, the observability plane, Wazuh, the backup vault,
  // a package cache — and every team onboards its site into it over a shared
  // ops network. The addressing lives in serverTopology.ts (`OPS`); the command
  // bodies below carry the team rule as a token the Lab access panel fills.
  {
    id: 'core-node-day-zero',
    week: 6,
    title: 'Instructor, Day 0: build the Core node',
    where: 'The instructor’s rack server, before students arrive',
    summary:
      'Read this so you know what you are joining; do not run it. Half a day builds the platform every team onboards into: the ops bridge, a package cache first, then Gitea, the observability plane, Wazuh, the backup vault, the golden template, and a handout per team. Everything is a container or a VM on one 64 GB server.',
    optional: true,
    optionalLabel: 'Instructor · Day 0',
    steps: [
      { cmd: `cat >> /etc/network/interfaces <<'EOF'

auto vmbr9
iface vmbr9 inet static
    address 10.20.0.1/16
    bridge_ports eno2.20
    bridge_stp off
    bridge_fd 0
EOF
ifreload -a && ip -br a show vmbr9`, explain: 'On the Core node. The ops bridge, backed by the second NIC tagged VLAN 20 — the same stanza every team node gets with its own address. A bridge with no physical port is one host talking to itself.' },
      { cmd: 'pct create 114 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst --hostname cache --memory 2048 --cores 2 --rootfs local-lvm:200 --net0 name=eth0,bridge=vmbr9,ip=10.20.0.14/16 --unprivileged 1 && pct start 114 && pct exec 114 -- bash -c "apt update && apt install -y apt-cacher-ng"', explain: 'cache.lab first. Sixteen teams pulling the same packages over the school link is the biggest time sink in the room; a cache on the ops network turns a ten-minute install into thirty seconds. Every team’s base role points apt at it.', doc: { label: 'apt-cacher-ng', href: 'https://wiki.debian.org/AptCacherNg' } },
      { cmd: 'pct create 110 local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst --hostname git --memory 2048 --cores 2 --rootfs local-lvm:40 --net0 name=eth0,bridge=vmbr9,ip=10.20.0.10/16 --unprivileged 1 && pct start 110', explain: 'git.lab as a container. Install Gitea from its binary release inside it, then in the web UI create one organisation per team (team01 … team16, each team’s members as owners) and a platform repository the instructor owns.', doc: { label: 'Gitea installation', href: 'https://docs.gitea.com/installation/install-from-binary' } },
      { gui: 'In the platform repository create two folders: targets/ (one Prometheus file_sd file per team, initially empty) and alertmanager/ (one receiver stub per team). Grant every team organisation write access to those two folders through a pull-request rule, and nothing else.', explain: 'This is how a team onboards without a ticket to the instructor: it commits its targets file and its receiver, and the Core pulls the repository every five minutes.' },
      { cmd: 'qm create 111 --name obs --memory 12288 --cores 4 --net0 virtio,bridge=vmbr9 --net1 virtio,bridge=vmbr0 --scsihw virtio-scsi-pci --scsi0 local-lvm:400 --ide2 local:iso/ubuntu-24.04-live-server-amd64.iso,media=cdrom --boot order=scsi0', explain: 'obs.lab, dual-homed: net0 on the ops network at 10.20.0.11 for the server fleet, net1 on the campus LAN so student browsers reach Grafana and the workstations can be collected. Install Ubuntu, then Prometheus, Grafana, Loki and Alertmanager from the Grafana and Ubuntu repositories as the Week 5 procedures show.' },
      { cmd: `cat > /etc/prometheus/prometheus.yml <<'EOF'
global:
  scrape_interval: 30s
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['localhost:9093']
rule_files:
  - /etc/prometheus/rules/*.yml
scrape_configs:
  - job_name: 'fleet'
    file_sd_configs:
      - files: ['/etc/prometheus/targets/team-*.yml']
        refresh_interval: 1m
EOF
cat > /etc/cron.d/platform-pull <<'EOF'
*/5 * * * * root cd /srv/platform && git pull -q && rsync -a --delete targets/ /etc/prometheus/targets/ && rsync -a --delete alertmanager/ /etc/alertmanager/teams/ && systemctl reload alertmanager
EOF
systemctl restart prometheus`, explain: 'On obs.lab, with the platform repository cloned to /srv/platform. Prometheus discovers targets from files, and the files come from Git — so a team’s commit is what puts its hosts on the Targets page. The three fleet alert rules (InstanceDown, DiskAlmostFull, ServiceDown) go in the rules folder, each carrying the team label through.', doc: { label: 'Prometheus file_sd', href: 'https://prometheus.io/docs/prometheus/latest/configuration/configuration/#file_sd_config' } },
      { cmd: 'qm create 112 --name xdr --memory 16384 --cores 8 --net0 virtio,bridge=vmbr9 --net1 virtio,bridge=vmbr0 --scsihw virtio-scsi-pci --scsi0 local-lvm:300 --ide2 local:iso/ubuntu-24.04-live-server-amd64.iso,media=cdrom --boot order=scsi0', explain: 'xdr.lab at 10.20.0.12, also dual-homed. The heaviest component: 16 GB is the working floor for a manager that takes a hundred agents. Run the Wazuh assisted installer exactly as the Week 5 procedure does, then under Agents → Groups create team-01 through team-16.' },
      { cmd: `qm create 113 --name pbs --memory 8192 --cores 4 --net0 virtio,bridge=vmbr9 --scsihw virtio-scsi-pci --scsi0 local-lvm:64 --scsi1 local-lvm:2048 --ide2 local:iso/proxmox-backup-server_3.3-1.iso,media=cdrom --boot order=scsi0
# after the PBS install, on pbs.lab:
proxmox-backup-manager datastore create vault /mnt/datastore/vault
for t in $(seq -w 1 16); do proxmox-backup-manager namespace create --store vault --ns team$t; done
proxmox-backup-manager cert info | grep -i fingerprint`, explain: 'pbs.lab at 10.20.0.13 with the biggest disk you have: deduplication wants disk, not memory. One namespace per team keeps sixteen sites apart in one datastore. The fingerprint goes on every team’s handout — it is how a team node trusts the vault.', doc: { label: 'Proxmox Backup Server — namespaces', href: 'https://pbs.proxmox.com/docs/storage.html#backup-namespaces' } },
      { cmd: `wget -q https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img
qm create 9000 --name ubuntu-2404-tmpl --memory 2048 --cores 2 --net0 virtio,bridge=vmbr9 --net1 virtio,bridge=vmbr2 --scsihw virtio-scsi-pci
qm importdisk 9000 noble-server-cloudimg-amd64.img local-lvm
qm set 9000 --scsi0 local-lvm:vm-9000-disk-0 --ide2 local-lvm:cloudinit --boot order=scsi0 --serial0 socket --vga serial0 --agent enabled=1
qm template 9000
vzdump 9000 --storage cache-templates --mode stop`, explain: 'The golden template, built once with two NICs — ops first, client private second — and published as a backup archive on cache.lab so every team restores the same image as VM 9000 on its own node. Identical clones are what make sixteen Terraform runs behave the same.', doc: { label: 'Proxmox cloud-init support', href: 'https://pve.proxmox.com/wiki/Cloud-Init_Support' } },
      { gui: 'Print one handout per team: team number, node address on the campus LAN and on the ops network, the Gitea organisation and its first-login link, the PBS namespace and fingerprint, the Wazuh group name, and the ops subnet. Then stop. Everything from here is student work.', explain: 'Eight numbers on a card. A team that has them can finish the week without asking you anything; a team that does not will ask sixteen times.' },
    ],
  },
  {
    id: 'ops-network-spine',
    week: 6,
    title: 'Wire the ops network: the bridge, the second NICs, the ping',
    where: 'The Proxmox host shell, then every server VM',
    summary:
      'Every team’s DMZ and private zone are identical islands — Team 3’s winserver and Team 9’s are both 192.168.0.2 — and that was fine while nothing crossed them. The Core has to cross them. So the host and every server VM get a second interface on the shared VLAN, and the third octet is the team number. Prove the path to the Core before anything else this week.',
    steps: [
      { cmd: `cat >> /etc/network/interfaces <<'EOF'

auto vmbr9
iface vmbr9 inet static
    address 10.20.T.1/24
    bridge_ports eno2.20
    bridge_stp off
    bridge_fd 0
EOF
ifreload -a && ip -br a show vmbr9`, explain: 'On the host, with T replaced by your team number — or set your ops subnet in Lab access and it is already replaced. eno2.20 is the second NIC tagged VLAN 20; with one NIC, trunk the port and use eno1.20 instead. The host’s own .1 is what the backup vault, the exporter and Ansible’s inventory will reach.' },
      { cmd: 'ping -c 3 10.20.0.11', explain: 'From the host. Three replies from obs.lab means the switch is trunking VLAN 20 to your port. No reply means it is not, and nothing else this week will work until it does — the Networking deep-dive owns that trunk.' },
      { gui: 'For websrv, winserver and linuxsrv (and secmon, wazuh and tools if you built Week 5): VM → Hardware → Add → Network Device, Bridge vmbr9, Model VirtIO. Then inside each VM give the new interface the same host octet it has in its zone, moved into your block: winserver 10.20.T.2, linuxsrv 10.20.T.3, websrv 10.20.T.10 — /24, no gateway.', explain: 'One number per machine, whichever network you meet it on. No gateway on the ops leg: the client zones keep routing out through vmbr0 as before, and the ops network carries only management traffic — scraping, logs, backups, SSH.' },
      { cmd: `cat > /etc/netplan/60-ops.yaml <<'EOF'
network:
  version: 2
  ethernets:
    ens19:
      addresses: [10.20.T.3/24]
EOF
netplan apply && ping -c 3 10.20.0.11`, explain: 'On linuxsrv as the worked example — the second VirtIO device appears as ens19. The same file with .10 on websrv. On winserver it is Network Connections → the new adapter → IPv4 → static, no gateway, no DNS.' },
      { gui: 'Open the Architecture Brief and add the ops VM (next procedure) as a machine; open the IP Plan and add one row per ops-network address, including the host’s .1. Then run the connectivity proof for the new path: every server VM reaches 10.20.0.11.', explain: 'The Week 3 forms hold the site’s addressing; the ops network is part of it now. The hostref columns in later forms can only name a machine the brief knows.' },
    ],
  },
  {
    id: 'ops-vm-build',
    week: 6,
    title: 'The ops VM: a permanent home for the toolchain',
    where: 'The Proxmox web console, then the new ops VM',
    summary:
      'Classroom workstations get reimaged, reassigned and shared. Terraform state, SSH keys and playbooks that live on one disappear. So the team’s toolchain lives on a small VM on the team’s own node, with a leg on the campus LAN for the Proxmox API and a leg on the ops network for the machines it configures. The workstation becomes a window.',
    steps: [
      { gui: 'Create a VM named ops: Ubuntu Server ISO, 2 cores, 2048 MB, 32 GB disk, net0 on vmbr0 (DHCP from the campus), net1 on vmbr9. Install Ubuntu with the ops user, OpenSSH enabled, and net1 static at 10.20.T.30/24 with no gateway.', explain: 'Dual-homed on purpose. Terraform and the dynamic inventory talk to the Proxmox API over the campus LAN; Ansible talks to the VMs over the ops network. Mixing the two paths up is the most common first-day blocker.' },
      { cmd: 'echo "Acquire::http::Proxy \\"http://10.20.0.14:3142\\";" | sudo tee /etc/apt/apt.conf.d/01proxy && sudo apt update && sudo apt install -y git ansible python3-proxmoxer python3-requests', explain: 'Point apt at the Core’s package cache first — from here on every install on this VM and every VM Ansible builds comes from the cache. Then Git, Ansible and the Python libraries the Proxmox inventory plugin needs.' },
      { cmd: 'wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list && sudo apt update && sudo apt install -y terraform && terraform -version && ansible --version', explain: 'Terraform from HashiCorp’s repository (OpenTofu works with the same provider; pick one for the whole team). Both version lines printing is the check.', doc: { label: 'Install Terraform', href: 'https://developer.hashicorp.com/terraform/install' } },
      { cmd: 'ssh-keygen -t ed25519 -C "team07-ops" -f ~/.ssh/id_ed25519 -N "" && cat ~/.ssh/id_ed25519.pub', explain: 'The fleet key, with your own team number in the comment. Its public half goes into every VM cloud-init builds; its private half never leaves this VM. Copy the public key — the Terraform template and the Ansible base role both need it.' },
      { cmd: 'curl -sk https://10.10.30.T:8006/api2/json/version && ping -c 3 10.20.0.11', explain: 'The two paths, proven from the VM that will use them: the API answers over the campus LAN, the Core answers over the ops network. If either fails, fix it now — every later step depends on both.' },
      { cmd: 'cd ~/ServerPlus_Capstone/00_Planning/terraform 2>/dev/null && scp -r . ops@10.20.T.30:~/tf-week5/ ; echo done', explain: 'Only if you did Week 5: from the workstation that ran Terraform, move the state and files onto the ops VM. State on a workstation is state that disappears at the next reimage.' },
    ],
  },
  {
    id: 'gitea-team-repo',
    week: 6,
    title: 'Put the infrastructure in Git',
    where: 'The ops VM, and Gitea in a browser',
    summary:
      'Infrastructure as code that is not in version control is scripts on someone’s laptop. Git gives the team history, review, rollback and one source of truth. The layout is boring and identical across teams on purpose; the .gitignore is written before the first commit because a secret pushed once is in the history forever.',
    steps: [
      { gui: 'Browse to http://10.20.0.10, sign in with the account on your handout, open your team organisation and create a repository named team07-infra (your own team number), private, no initialisation.', explain: 'One repository per team, owned by the organisation rather than a person, so the person who leaves does not take it with them.' },
      { cmd: `mkdir -p ~/team07-infra && cd ~/team07-infra && git init -b main && mkdir -p terraform ansible/roles/{base,monitoring,wazuh_agent} docs && cat > .gitignore <<'EOF'
*.tfvars
*.tfstate
*.tfstate.*
.terraform/
.vault-pass
*.pem
id_ed25519*
EOF
git add .gitignore && git commit -m "Ignore secrets and state before anything else"`, explain: 'The first commit is the ignore file, alone. Token files, state files, the vault password and keys can never be added by accident after this — and the state file in particular describes every VM you own, which is not for a shared server.' },
      { cmd: `cat > README.md <<'EOF'
# team07-infra

The Granite Peak client site, as code.

1. Clone this on the ops VM (10.20.T.30 — your team's ops subnet).
2. terraform/: cp terraform.tfvars.example terraform.tfvars, fill the API token, terraform init && terraform apply.
3. ansible/: export PVE_TOKEN=..., ansible-playbook -i inventory.proxmox.yml site.yml
4. Everything the site runs is in roles/. Nothing is configured by hand.
EOF
git add README.md && git commit -m "README a stranger could follow"`, explain: 'Written for the person who arrives after you. The test of a README is whether someone who has never seen this site can rebuild it from the four lines.' },
      { cmd: 'git remote add origin http://10.20.0.10/team07/team07-infra.git && git push -u origin main', explain: 'Gitea asks for your username and a token the first time; create one under Settings → Applications. Every teammate clones from here and commits under their own name — the log is part of the deliverable.' },
      { cmd: 'git grep -iE "password|token|secret" -- . ":!README.md" ; echo "exit $?"', explain: 'Run this before every push. exit 1 means no match — nothing that looks like a credential is tracked. A match is a leak: remove it, rotate it, and only then commit.' },
    ],
  },
  {
    id: 'fleet-template-and-terraform',
    week: 6,
    title: 'The site from the golden template, in Terraform',
    where: 'The Proxmox host shell, then the ops VM',
    summary:
      'An ISO install takes twenty minutes and is different every time. A clone of the Core’s golden template takes seconds and is identical every time — which is what makes Terraform worth using. The provider block, the token in a file Git never sees, the server VMs described once, applied, and then a second plan that has nothing to do.',
    steps: [
      { gui: 'On your node, Datacenter → Storage → Add → the Core’s template store (Directory or NFS, the address is on your handout). Then Storage → Backups → the ubuntu-2404-tmpl archive → Restore, as VM 9000. Convert it: right-click → Convert to template.', explain: 'Every team restores the same image as the same ID. Two NICs are already on it — net0 ops, net1 client private — so cloud-init can address both.' },
      { cmd: 'pveum user add terraform@pve 2>/dev/null; pveum aclmod / -user terraform@pve -role Terraform && pveum user token add terraform@pve fleet --privsep=0', explain: 'On the host. The Terraform role from Week 5 already exists if you did it; if not, create it with the privileges the provider documents first. A new token named fleet — copy the value the moment it prints, it is shown once.' },
      { cmd: `cd ~/team07-infra/terraform && cat > providers.tf <<'EOF'
terraform {
  required_providers {
    proxmox = { source = "bpg/proxmox", version = "~> 0.66" }
  }
}
variable "pve_token" { sensitive = true }
variable "team" { default = 7 }
provider "proxmox" {
  endpoint  = "https://10.10.30.T:8006/"
  api_token = var.pve_token
  insecure  = true
}
EOF
cat > terraform.tfvars.example <<'EOF'
pve_token = "terraform@pve!fleet=PASTE_THE_TOKEN_VALUE_HERE"
EOF
cp terraform.tfvars.example terraform.tfvars`, explain: 'On the ops VM. The token goes in terraform.tfvars, which .gitignore already excludes; the .example file is what gets committed. Set team to your own number — every address below is built from it.', doc: { label: 'bpg/proxmox provider', href: 'https://registry.terraform.io/providers/bpg/proxmox/latest/docs' } },
      { cmd: `cat > main.tf <<'EOF'
locals {
  node    = "pve-host"
  ops_key = file("~/.ssh/id_ed25519.pub")
  servers = {
    websrv   = { octet = 10, client_bridge = "vmbr1", client_ip = "172.16.0.10/24",  gw = "172.16.0.1",  memory = 2048 }
    linuxsrv = { octet = 3,  client_bridge = "vmbr2", client_ip = "192.168.0.3/24",  gw = "192.168.0.1", memory = 2048 }
  }
}

resource "proxmox_virtual_environment_vm" "server" {
  for_each  = local.servers
  name      = each.key
  node_name = local.node
  clone { vm_id = 9000 }
  cpu    { cores = 2 }
  memory { dedicated = each.value.memory }
  agent  { enabled = true }
  network_device { bridge = "vmbr9" }
  network_device { bridge = each.value.client_bridge }
  initialization {
    ip_config { ipv4 { address = "10.20.\${var.team}.\${each.value.octet}/24" } }
    ip_config { ipv4 { address = each.value.client_ip, gateway = each.value.gw } }
    user_account { username = "ops", keys = [local.ops_key] }
  }
}
EOF
terraform init && terraform plan`, explain: 'The Linux servers, described once each: first NIC and first ip_config are the ops leg, second are the client zone. winserver stays a hand-built import — cloud-init does not build Windows — and is imported exactly as in Week 5. Plan lists two to add.' },
      { cmd: 'terraform apply -auto-approve && terraform plan', explain: 'Two clones, up in under a minute each. Then the real proof: the second plan says No changes. If it wants to change something, the file and reality disagree — fix the file, never the VM.' },
      { cmd: 'ssh ops@10.20.T.3 hostname && git add providers.tf main.tf terraform.tfvars.example && git commit -m "The site from the template" && git push', explain: 'The fleet key gets you in without a password because cloud-init installed it. Commit the code — and notice git status never lists terraform.tfvars or the state.' },
    ],
  },
  {
    id: 'ansible-site-playbook',
    week: 6,
    title: 'Ansible: the hypervisor is the inventory, and the second run changes nothing',
    where: 'The ops VM',
    summary:
      'Terraform makes the box; Ansible makes it a server. A playbook is idempotent — safe to run a hundred times — and that property is the whole point: the second run must report changed=0, or it is a shell script in disguise. The inventory is not a file you maintain; it is a question asked of the Proxmox API.',
    steps: [
      { cmd: 'pveum user add ansible@pve 2>/dev/null; pveum aclmod / -user ansible@pve -role PVEAuditor && pveum user token add ansible@pve inv --privsep=0', explain: 'On the host. The inventory only reads, so PVEAuditor is enough. Copy the token value.' },
      { cmd: `cd ~/team07-infra/ansible && cat > inventory.proxmox.yml <<'EOF'
plugin: community.general.proxmox
url: https://10.10.30.T:8006
user: ansible@pve
token_id: inv
token_secret: "{{ lookup('env', 'PVE_TOKEN') }}"
validate_certs: false
want_facts: true
keyed_groups:
  - key: proxmox_tags_parsed
    prefix: tag
compose:
  ansible_host: proxmox_agent_interfaces | selectattr('name', 'equalto', 'eth0') | map(attribute='ip-addresses') | first | map(attribute='ip-address') | select('match', '^10\\.20\\.') | first
EOF
export PVE_TOKEN=PASTE_THE_TOKEN_VALUE_HERE && ansible-inventory -i inventory.proxmox.yml --graph`, explain: 'The plugin asks the API which VMs exist and, through the guest agent, which addresses they hold; compose picks the ops-network one. The token is an environment variable, never a line in the file. The graph lists every running VM on your node.', doc: { label: 'community.general.proxmox inventory', href: 'https://docs.ansible.com/ansible/latest/collections/community/general/proxmox_inventory.html' } },
      { cmd: `mkdir -p roles/base/tasks && cat > roles/base/tasks/main.yml <<'EOF'
- name: apt through the Core cache
  copy: { dest: /etc/apt/apt.conf.d/01proxy, content: 'Acquire::http::Proxy "http://10.20.0.14:3142";' }
- name: chrony to the Core
  apt: { name: chrony, state: present }
- name: one time source
  copy: { dest: /etc/chrony/sources.d/core.sources, content: "server 10.20.0.11 iburst\\n" }
  notify: restart chrony
- name: ops user has the fleet key only
  authorized_key: { user: ops, key: "{{ lookup('file', '~/.ssh/id_ed25519.pub') }}", exclusive: true }
- name: sshd forbids passwords
  lineinfile: { path: /etc/ssh/sshd_config, regexp: '^#?PasswordAuthentication', line: 'PasswordAuthentication no' }
  notify: restart sshd
EOF
mkdir -p roles/base/handlers && cat > roles/base/handlers/main.yml <<'EOF'
- name: restart chrony
  service: { name: chrony, state: restarted }
- name: restart sshd
  service: { name: ssh, state: restarted }
EOF`, explain: 'The base role: the cache, one clock, the fleet key and no passwords. Skewed clocks silently break TLS, Kerberos and log correlation — chrony to the Core is the cheapest fix in the week. Every task is written so that running it again does nothing.' },
      { cmd: `mkdir -p roles/monitoring/tasks roles/monitoring/templates && cat > roles/monitoring/tasks/main.yml <<'EOF'
- name: exporter and Alloy
  apt: { name: [prometheus-node-exporter, alloy], state: present, update_cache: true }
- name: Alloy ships to the Core with the team label
  template: { src: config.alloy.j2, dest: /etc/alloy/config.alloy }
  notify: restart alloy
- name: both running
  service: { name: "{{ item }}", state: started, enabled: true }
  loop: [prometheus-node-exporter, alloy]
EOF
cat > roles/monitoring/templates/config.alloy.j2 <<'EOF'
loki.source.journal "sys" {
  forward_to = [loki.write.core.receiver]
  labels     = { team = "{{ team }}", host = "{{ inventory_hostname }}" }
}
loki.write "core" {
  endpoint { url = "http://10.20.0.11:3100/loki/api/v1/push" }
}
EOF
mkdir -p roles/monitoring/handlers && printf -- '- name: restart alloy\\n  service: { name: alloy, state: restarted }\\n' > roles/monitoring/handlers/main.yml`, explain: 'The monitoring role: the node exporter on 9100 and Alloy shipping the journal to the Core’s Loki, every line labelled with the team. The Grafana repository the Week 5 procedure adds is a task in the base role — add it there. Week 5 teams keep their own Loki by adding a second loki.write block.' },
      { cmd: `mkdir -p roles/wazuh_agent/tasks && cat > roles/wazuh_agent/tasks/main.yml <<'EOF'
- name: Wazuh repository
  apt_repository: { repo: "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main", state: present }
- name: agent, enrolled into the team group
  apt: { name: wazuh-agent, state: present }
  environment: { WAZUH_MANAGER: "10.20.0.12", WAZUH_AGENT_GROUP: "team-{{ '%02d' | format(team | int) }}", WAZUH_AGENT_NAME: "team{{ '%02d' | format(team | int) }}-{{ inventory_hostname }}" }
- name: running
  service: { name: wazuh-agent, state: started, enabled: true }
EOF
cat > site.yml <<'EOF'
- hosts: all
  become: true
  vars: { team: 7 }
  roles: [base, monitoring, wazuh_agent]
EOF
cat > ansible.cfg <<'EOF'
[defaults]
inventory = inventory.proxmox.yml
remote_user = ops
host_key_checking = false
EOF`, explain: 'The wazuh_agent role enrols into the Core manager under the team group with a name built from the team number and the host — two agents with the same name means one silently never reports. Set team in site.yml to your own number; the key import from Week 5 is a task in the base role.' },
      { cmd: 'ansible-playbook site.yml && ansible-playbook site.yml | tail -n 4', explain: 'Twice, on purpose. The first run changes many things. The second run must end with changed=0 on every host — that line is the deliverable. A non-zero second run is a task written as a command instead of a state; find it and rewrite it.' },
      { cmd: 'git add . && git commit -m "site.yml: base, monitoring, wazuh_agent — changed=0 on the second run" && git push', explain: 'Everything the site is, in Git. From now on a change made in the console instead of the repository is drift, and the next run may revert it. If it is not in code, it does not exist.' },
    ],
  },
  {
    id: 'core-onboarding-observability',
    week: 6,
    title: 'Onboard the site into the Core’s observability plane',
    where: 'The ops VM, then Grafana on the Core in a browser',
    summary:
      'The Core scrapes what the platform repository tells it to. A team onboards by committing one targets file with its label, and five minutes later its hosts are on the Targets page; the same commit carries the receiver Alertmanager pages. One dashboard with a team variable serves the whole class; the alerts route by the label.',
    steps: [
      { cmd: 'apt install -y prometheus-node-exporter && ss -ltn | grep 9100', explain: 'On the Proxmox host, as root — it is Debian underneath, so the same exporter the VMs run works on it. The hypervisor is the one target that says the whole site is in trouble before every VM alert fires at once.' },
      { cmd: `git clone http://10.20.0.10/instructor/platform.git ~/platform && cd ~/platform && cat > targets/team-07.yml <<'EOF'
- targets: ['10.20.T.1:9100', '10.20.T.2:9182', '10.20.T.3:9100', '10.20.T.10:9100', '10.20.T.30:9100']
  labels:
    team: "07"
    client: "granite-peak"
EOF
git add targets/team-07.yml && git commit -m "team-07: onboard five targets" && git push`, explain: 'Your own file, named for your team: the host and every Linux machine on 9100, winserver on 9182. The team label is what makes sixteen teams manageable — one dashboard, one rule set, routed by label. Add secmon, wazuh and tools if you built them.' },
      { cmd: `cat > alertmanager/team-07.yml <<'EOF'
- name: team-07
  email_configs:
    - to: team07@its.lan
EOF
git add alertmanager/team-07.yml && git commit -m "team-07: alert receiver" && git push`, explain: 'Where the Core pages you. The instructor’s route matches on the team label and hands the alert to this receiver. A webhook to a chat room works the same way — the Management deep-dive decides who is paged and writes it down.' },
      { gui: 'Wait five minutes. Browse to http://10.20.0.11:9090/targets and filter on team="07": every endpoint reads UP. Then Grafana at http://10.20.0.11:3000 → the Fleet dashboard → set the team variable to yours: live CPU, memory and disk for every host, and the Logs panel shows your journal lines.', explain: 'The Core found your hosts from a commit, not a ticket. A DOWN target is almost always the exporter listening on the wrong interface or a firewall rule from Week 4 — allow the port from the Core’s address on the ops leg.' },
      { cmd: 'sudo systemctl stop nginx', explain: 'On websrv. Note the time. Within five minutes ServiceDown fires for team 07 and the receiver gets it: screenshot the alert in Alertmanager at http://10.20.0.11:9093 and the email or message.' },
      { cmd: 'sudo systemctl start nginx', explain: 'Put it back; note the time the alert resolves. Both times go into the As-Built, beside the Week 5 pair — this time the detection came from a plane you do not run.' },
    ],
  },
  {
    id: 'pbs-vault-and-restore',
    week: 6,
    title: 'Back up to the vault, verify it, and restore against the clock',
    where: 'The Proxmox web console, then the host shell',
    summary:
      'Week 4 restored a file. The vault restores a machine, and its verify jobs prove a backup is readable before you need it. The team node trusts the vault by fingerprint, backs up every VM including the ops VM into its own namespace nightly, and then times a full restore against the RTO the DR plan promised.',
    steps: [
      { gui: 'Datacenter → Storage → Add → Proxmox Backup Server: ID vault, Server 10.20.0.13, Username team07@pbs, the password and the Fingerprint from your handout, Datastore vault, Namespace team07. Content: VZDump backup file.', explain: 'The fingerprint is how your node knows it is talking to the real vault and not something answering on its address. One namespace per team keeps sixteen sites apart inside one datastore.' },
      { gui: 'Datacenter → Backup → Add: Storage vault, Schedule 02:00 daily, Selection mode All, Mode Snapshot, Retention keep-daily 7 keep-weekly 4. Make sure the ops VM is in the selection. Then select the job → Run now.', explain: 'The ops VM holds the Terraform state. Lose it and Terraform no longer knows what it owns; it must be in every backup. Deduplication means the second night’s backup is a fraction of the first.', doc: { label: 'Proxmox VE backup and restore', href: 'https://pve.proxmox.com/wiki/Backup_and_Restore' } },
      { gui: 'In the vault’s own UI at https://10.20.0.13:8007 → Datastore vault → Verify Jobs: the instructor’s nightly verify covers every namespace. After your backup finishes, open Content → your namespace and confirm each group shows a green verified tick.', explain: 'A verify job re-reads every chunk and checks it against its hash. A backup that has never been verified is a hope, and the handover promised a number, not a hope.' },
      { cmd: 'date +%T && qm stop 102 && qm destroy 102 --purge', explain: 'On the host. linuxsrv, gone, for real — note the time. This is the Week 4 drill at machine scale: the DR plan says how long a server takes to come back, and the number has never been measured.' },
      { gui: 'Storage vault → Backups → the latest linuxsrv backup → Restore, VM ID 102, Start after restore ticked. Watch the task log until it reads TASK OK, then ssh ops@10.20.T.3 and run mariadb -e "SHOW DATABASES".', explain: 'The service answering is the finish line, not the VM booting. The database that was in the backup is the database that came back.' },
      { cmd: 'date +%T', explain: 'Stop the clock. Restore time is the difference; write it into the DR plan beside the RTO from Week 4 and say which is bigger. If the restore is slower than the promise, the promise was wrong — change the number, and say why.' },
    ],
  },
  {
    id: 'wazuh-fleet-agents',
    week: 6,
    title: 'The MSP’s XDR over the fleet endpoints',
    where: 'The Proxmox host shell, the ops VM, and Wazuh on the Core in a browser',
    summary:
      'An agent reports to one manager. The client site’s servers stay on the client’s own SIEM from Week 5 — that is the client’s data. The MSP’s XDR on the Core takes the fleet endpoints: the hypervisor, the ops VM, and with school IT’s sign-off the workstations, all in the team’s group. Then SCA scores the hardening and FIM proves the pipeline.',
    steps: [
      { cmd: `curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && chmod 644 /usr/share/keyrings/wazuh.gpg && echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" > /etc/apt/sources.list.d/wazuh.list && apt-get update
WAZUH_MANAGER="10.20.0.12" WAZUH_AGENT_GROUP="team-07" WAZUH_AGENT_NAME="team07-pve-host" apt-get install -y wazuh-agent && systemctl enable --now wazuh-agent && tail -n 3 /var/ossec/logs/ossec.log`, explain: 'On the Proxmox host itself, as root, with your own team number in both names. The hypervisor is the machine whose compromise takes every client VM with it; it reports to the MSP, not the client. Connected to the server (10.20.0.12:1514) is the line you want.' },
      { cmd: 'cd ~/team07-infra/ansible && ansible-playbook site.yml -l ops', explain: 'On the ops VM: the wazuh_agent role already enrols whatever it runs on into the Core group, so running it against the ops VM itself is the second fleet endpoint. Sign-off in hand, the same role points at workstations — named from the asset tag, never the hostname, because reimaged machines come back with the same hostname and a stale duplicate.' },
      { gui: 'Browse to https://10.20.0.12, sign in with the handout account, Agents → filter group team-07: the host and the ops VM read Active. Open the host → Security configuration assessment: note the score for the CIS benchmark before hardening.', explain: 'SCA runs the benchmark checks and gives a percentage. It is the number the Windows and Linux deep-dives move this week: the base role is the hardening standard, and the score is how you show it did something.' },
      { cmd: 'echo "# fim test $(date +%T)" | sudo tee -a /etc/hosts.allow', explain: 'On the ops VM. FIM watches /etc by default; a watched file changed. Within a minute Wazuh raises an integrity checksum changed alert for team07-ops with the file, the time and the user.' },
      { gui: 'Threat Hunting → Events, filter agent.group: team-07 and rule.groups: syscheck: the FIM event. Then Vulnerability Detection → the ops VM: the CVE list for its packages. Screenshot both into 08_Evidence.', explain: 'One detection, one vulnerability list, one SCA score: the security posture report the As-Built asks for, from a platform someone else runs. That is what an MSP hands a client every month.' },
    ],
  },
  {
    id: 'rebuild-from-git',
    week: 6,
    title: 'Destroy a server and rebuild it from the repository alone',
    where: 'The Proxmox host shell, then the ops VM, then the Core in a browser',
    summary:
      'The standard for the track, and the demo that proves the whole week: delete a VM, rebuild it from Git with two commands, and watch it reappear in Grafana and Wazuh without anyone touching a console. If the team can do that, it can run a fleet.',
    steps: [
      { cmd: 'date +%T && qm stop 102 && qm destroy 102 --purge', explain: 'On the host: linuxsrv again, gone. Note the time. Nobody opens the backup this time.' },
      { cmd: 'cd ~/team07-infra/terraform && terraform apply -auto-approve', explain: 'On the ops VM. Terraform refreshes, finds linuxsrv missing, and clones it from the template with both NICs and both addresses. Under a minute.' },
      { cmd: 'cd ../ansible && ansible-playbook site.yml -l linuxsrv', explain: 'The base, monitoring and wazuh_agent roles, on a machine that did not exist two minutes ago. The database role, if you wrote one, restores the schema; if not, restore the dump from Week 4 as the runbook says.' },
      { gui: 'Grafana → Fleet dashboard → your team: linuxsrv’s panels go green on their own. Wazuh → Agents → team-07: a new linuxsrv agent, Active. Prometheus Targets: the same address, UP, without your targets file changing.', explain: 'Nothing was re-registered by hand. The address came from the code, the exporter from the role, the enrolment from the role — the platform saw the machine because the machine was built to be seen.' },
      { cmd: 'date +%T && git tag -a v1.0-handover -m "Rebuilt linuxsrv from this tag" && git push --tags', explain: 'Stop the clock; the rebuild time goes in the As-Built beside the restore time — usually faster, and the comparison is the SLO report’s best line. Tag the repository: this exact history is what you hand over.' },
    ],
  },
];

/** Look a procedure up by the id a step's `guideRef` names. */
export function procedureById(id: string): Procedure | undefined {
  return PROCEDURES.find((p) => p.id === id);
}

/** The title a step's "Exact clicks" row shows when the step gives no label. */
export function procedureTitle(id: string): string {
  return procedureById(id)?.title ?? id;
}

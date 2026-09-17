/**
 * Every command the Server+ base build types, written down ONCE.
 *
 * Weeks 0-4 contained 219 distinct commands, and 157 of them existed twice —
 * once in the course step (`data/seed/serverPlus.ts`) and again in the matching
 * guide procedure (`serverProcedures.ts`), each with its own hand-written
 * explanation. Nothing held the two copies together, so they drifted, and any
 * fact a student needed per command — which machine it runs on, what it should
 * print — would have had to be written twice to appear in both places.
 *
 * So the command itself is the key and this file is its home:
 *
 *   k        the command as typed, whitespace-normalised so a heredoc's
 *            indentation cannot miss the lookup
 *   on       WHICH MACHINE, a `MachineId` — the chip above the line, and what
 *            the topology focus strip highlights
 *   explain  why the line exists, one sentence, under the R71 word budget
 *   sample   what it prints when it worked, shown behind one press
 *   backupOf what it overwrites, when it overwrites something a student would
 *            otherwise have to rebuild by hand
 *
 * The seed and the guide do not reference entries by hand. `withCommandDetail`
 * and `withProcedureDetail` walk both structures at module load and fill each
 * command from here, matching on the command text. The call sites stay readable
 * — a step still literally lists the lines it runs — and there is exactly one
 * place to correct a machine, an explanation or a sample.
 */
import type { MachineId } from '@/lib/serverTopology';

export interface CommandDetail {
  /** The command as typed, whitespace-normalised. */
  k: string;
  on: MachineId;
  explain: string;
  /** What a working run prints. `(no output …)` where the command is silent. */
  sample: string;
  /** Set when the line rewrites config a student cannot easily reconstruct. */
  backupOf?: string;
}

/** One line per command, in the order the course meets them. */
export const COMMANDS: CommandDetail[] = [
  // R72 — the way back, required by the backup guard
  { k: "Export-DnsServerZone -Name \"team1.local\" -FileName \"team1.local.pre-forwarder.dns\"", on: "winserver", explain: "Your way back. Writes the zone as it stands now to %SystemRoot%\\System32\\dns before you change it.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // R72 — the way back, required by the backup guard
  { k: "route print -4 > C:\\baseline\\routes-before.txt", on: "winserver", explain: "The route table before you add a persistent entry, so a wrong route can be compared and removed.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // R72 — the way back, required by the backup guard
  { k: "sudo cp /etc/netplan/01-capstone.yaml /etc/netplan/01-capstone.yaml.bak", on: "linuxsrv", explain: "Copy the working file before editing it. A netplan file that will not parse takes the host off the network.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // R72 — the way back, required by the backup guard
  { k: "sudo cp -r /etc/netplan /root/netplan.bak", on: "websrv", explain: "The installer wrote its own netplan file. Keep the whole directory before you replace it.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // R72 — the way back, required by the backup guard
  { k: "sudo cp -r /etc/ufw /root/ufw.bak && sudo ufw status verbose > /root/ufw-before.txt", on: "websrv", explain: "The firewall as it stands, before you turn it on. If a rule locks you out, the console restores this.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // R72 — the way back, required by the backup guard
  { k: "sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.bak", on: "websrv", explain: "The server block that is serving your site right now, kept before you replace it with the TLS one.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W0 verify-pxe-imaged-workstation | SEED W0 sp-w0-pxe-s2
  { k: "hostname", on: "workstation", explain: "Must print the desk label with the space typed as a hyphen.", sample: "ITS-LAB-14" },
  // GUIDE W0 verify-pxe-imaged-workstation | SEED W0 sp-w0-pxe-s2
  { k: "systeminfo | findstr /C:\"Domain\" /C:\"OS Name\"", on: "workstation", explain: "Domain must read ITS.lan. WORKGROUP means the join did not take.", sample: "OS Name:                   Microsoft Windows 11 Pro\nDomain:                    ITS.lan" },
  // GUIDE W0 verify-pxe-imaged-workstation | SEED W0 sp-w0-pxe-s2
  { k: "ping itsdc3", on: "workstation", explain: "The domain controller also hosts the ISO share you pull the Proxmox installer from in Week 1.", sample: "Pinging itsdc3.ITS.lan [10.10.10.20] with 32 bytes of data:\nReply from 10.10.10.20: bytes=32 time<1ms TTL=128\nReply from 10.10.10.20: bytes=32 time=1ms TTL=128\n...\nPing statistics for 10.10.10.20:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\nApproximate round trip times in milli-seconds:\n    Minimum = 0ms, Maximum = 1ms, Average = 0ms" },
  // SEED W1 sp-w1-document-s3 | SEED W1 sp-w1-lnx-s1
  { k: "sudo dmidecode -s bios-version && sudo dmidecode -s bios-release-date", on: "host", explain: "The firmware version and its release date. dmidecode takes one keyword per run, so this is two runs. The date matters more than the number.", sample: "2.15.0\n09/06/2023" },  // SEED W1 sp-w1-document-s3
  { k: "sudo dmidecode -s system-serial-number", on: "host", explain: "The service tag, confirmed from the machine rather than the sticker. This is what you look support up with.", sample: "7KJ4X2S" },
  // SEED W1 sp-w1-document-s3
  { k: "lscpu | grep -i virt", on: "host", explain: "Confirms the virtualization extensions are present AND switched on.", sample: "Virtualization features:\n  Virtualization:                     VT-x" },
  // SEED W1 sp-w1-document-s3
  { k: "sudo dmidecode -t memory", on: "host", explain: "RAM size, type, whether it is ECC, and how many slots are populated.", sample: "# dmidecode 3.4\nPhysical Memory Array\n\tError Correction Type: Multi-bit ECC\n\tMaximum Capacity: 1 TB\n\tNumber Of Devices: 12\n...\nMemory Device\n\tSize: 32 GB\n\tLocator: DIMM_A1\n\tType: DDR4\n\tSpeed: 3200 MT/s" },
  // SEED W1 sp-w1-document-s3
  { k: "lsblk -o NAME,SIZE,MODEL,ROTA", on: "host", explain: "Every disk the machine can see. ROTA=1 means a spinning disk, 0 means SSD.", sample: "NAME     SIZE MODEL              ROTA\nsda    446.6G PERC H730P Mini       0\n|-sda1    1M                        0\n|-sda2  512M                        0\n`-sda3 445.1G                       0\nsdb      3.6T PERC H730P Mini       1\n`-sdb1   3.6T                       1" },
  // SEED W1 sp-w1-document-s3
  { k: "lspci -nnk | grep -iA3 raid", on: "host", explain: "The storage controller and, on the \"Kernel driver in use\" line, whether a driver claimed it.", sample: "18:00.0 RAID bus controller [0104]: Broadcom / LSI MegaRAID SAS-3 3108 [Invader] [1000:005d] (rev 02)\n\tSubsystem: Dell PERC H730P Mini [1028:1f47]\n\tKernel driver in use: megaraid_sas\n\tKernel modules: megaraid_sas" },
  // SEED W1 sp-w1-document-s3
  { k: "lspci -nnk | grep -iA3 ethernet", on: "host", explain: "Each network card and the driver bound to it.", sample: "01:00.0 Ethernet controller [0200]: Broadcom Inc. and subsidiaries NetXtreme BCM5720 Gigabit Ethernet PCIe [14e4:165f]\n\tSubsystem: Dell Device [1028:1f5b]\n\tKernel driver in use: tg3\n\tKernel modules: tg3\n--\n01:00.1 Ethernet controller [0200]: Broadcom Inc. and subsidiaries NetXtreme BCM5720 Gigabit Ethernet PCIe [14e4:165f]\n\tSubsystem: Dell Device [1028:1f5b]\n\tKernel driver in use: tg3\n..." },
  // GUIDE W1 flash-proxmox-usb | SEED W1 sp-w1-install-s1
  { k: "explorer \\\\itsdc3\\its", on: "workstation", explain: "Opens the share the course keeps its images on. Rufus and the Proxmox VE ISO both live here.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W1 install-proxmox-host | SEED W1 sp-w1-install-s3
  { k: "ip -4 addr show vmbr0", on: "host", explain: "The install turns the management NIC into vmbr0 and puts your address on it. Must show your team address with /16.", sample: "5: vmbr0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000\n    inet 10.10.30.1/16 brd 10.10.255.255 scope global vmbr0\n       valid_lft forever preferred_lft forever" },
  // GUIDE W1 install-proxmox-host | GUIDE W3 prove-connectivity | SEED W1 sp-w1-install-s3 | SEED W3 sp-w3-connect-s5
  { k: "ping -c 4 10.10.10.1", on: "campus", explain: "Proves the host reaches the campus gateway. If this fails the prefix or the cable is wrong, not the install.", sample: "PING 10.10.10.1 (10.10.10.1) 56(84) bytes of data.\n64 bytes from 10.10.10.1: icmp_seq=1 ttl=64 time=0.412 ms\n64 bytes from 10.10.10.1: icmp_seq=2 ttl=64 time=0.389 ms\n...\n--- 10.10.10.1 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3045ms\nrtt min/avg/max/mdev = 0.389/0.431/0.502/0.041 ms" },
  // SEED W1 sp-w1-install-s3
  { k: "pveversion", on: "host", explain: "The hypervisor version, for the Bring-Up Log. Record exactly what it prints.", sample: "pve-manager/8.2.4/faa83925c9641325 (running kernel: 6.8.12-1-pve)" },
  // GUIDE W1 install-proxmox-host | SEED W1 sp-w1-install-s3
  { k: "systemctl status pveproxy --no-pager", on: "campus", explain: "Run this before blaming the network when the browser cannot reach the console.", sample: "\u25cf pveproxy.service - PVE API Proxy Server\n     Loaded: loaded (/lib/systemd/system/pveproxy.service; enabled; preset: enabled)\n     Active: active (running) since Tue 2026-09-15 08:12:03 CDT; 2h 41min ago\n   Main PID: 1483 (pveproxy)\n      Tasks: 4 (limit: 76923)\n     Memory: 142.8M\n     CGroup: /system.slice/pveproxy.service\n...\nSep 15 08:12:03 pve-host systemd[1]: Started pveproxy.service - PVE API Proxy Server." },
  // GUIDE W1 tailscale-remote-access | SEED W1 sp-w1-install-s4
  { k: "timedatectl status", on: "laptop", explain: "Run this first. A wrong clock rejects valid certificates, and the failure looks like a broken download rather than a broken clock.", sample: "               Local time: Tue 2026-09-15 10:53:19 CDT\n           Universal time: Tue 2026-09-15 15:53:19 UTC\n                 RTC time: Tue 2026-09-15 15:53:19\n                Time zone: America/Chicago (CDT, -0500)\nSystem clock synchronized: yes\n              NTP service: active\n          RTC in local TZ: no" },
  // GUIDE W1 tailscale-remote-access | SEED W1 sp-w1-install-s4
  { k: "curl -fsSL https://tailscale.com/install.sh | sh", on: "laptop", explain: "The official installer for the Debian base that Proxmox is built on.", sample: "Installing Tailscale for debian bookworm, using method apt\n+ mkdir -p --mode=0755 /usr/share/keyrings\n...\nSetting up tailscale (1.72.1) ...\nCreated symlink /etc/systemd/system/multi-user.target.wants/tailscaled.service \u2192 /lib/systemd/system/tailscaled.service\nInstallation complete! Log in to start using Tailscale by running:\n\ntailscale up" },
  // GUIDE W1 tailscale-remote-access | SEED W1 sp-w1-install-s4
  { k: "tailscale up", on: "laptop", explain: "Prints a one-time URL. One teammate opens it, signs in, and approves this host into the team tailnet \u2014 that person owns the tailnet.", sample: "To authenticate, visit:\n\n\thttps://login.tailscale.com/a/9f3c1d7e4b2a\n\nSuccess." },
  // GUIDE W1 tailscale-remote-access | SEED W1 sp-w1-install-s4
  { k: "tailscale ip -4", on: "laptop", explain: "Your host's own 100.x address \u2014 write it into the Bring-Up Log. It is how the team reaches this server from off campus.", sample: "100.101.42.17" },
  // GUIDE W1 tailscale-remote-access | SEED W1 sp-w1-install-s4
  { k: "systemctl is-active tailscaled", on: "laptop", explain: "Must print active, so remote access returns after a reboot without anyone at the keyboard.", sample: "active" },
  // GUIDE W1 tailscale-remote-access | SEED W1 sp-w1-install-s4
  { k: "ssh root@<tailscale-ip>", on: "laptop", explain: "From a laptop off campus, using the address tailscale ip -4 printed. A new host-key prompt is expected \u2014 same machine, new address. Check the fingerprint before accepting.", sample: "The authenticity of host '100.101.42.17 (100.101.42.17)' can't be established.\nED25519 key fingerprint is SHA256:9Qs1nT4bV7xKpLmR2dYcE8fA0uWjH5gZ3oXqB6tNvCk.\nThis key is not known by any other names.\nAre you sure you want to continue connecting (yes/no/[fingerprint])? [type yes, but only after the fingerprint matches the one the host showed you]\nWarning: Permanently added '100.101.42.17' (ED25519) to the list of known hosts.\nroot@100.101.42.17's password: [type the root password, nothing appears as you type]\nLast login: Tue Sep 15 09:02:11 2026 from 10.10.30.44\nroot@pve-host:~#" },
  // GUIDE W1 team-accounts-shared-host | SEED W1 sp-w1-install-s5
  { k: "apt update && apt install -y sudo", on: "host", explain: "Proxmox ships without sudo \u2014 the only account it expects anyone to use is root.", sample: "Hit:1 http://ftp.debian.org/debian bookworm InRelease\nGet:2 http://security.debian.org bookworm-security InRelease [48.0 kB]\n...\nReading package lists... Done\nThe following NEW packages will be installed:\n  sudo\n0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.\nSetting up sudo (1.9.13p3-1+deb12u1) ..." },
  // GUIDE W1 team-accounts-shared-host | SEED W1 sp-w1-install-s5
  { k: "adduser alex", on: "host", explain: "Once per teammate, substituting their name. Each person types their own password; nobody types it for them.", sample: "Adding user `alex' ...\nAdding new group `alex' (1000) ...\nAdding new user `alex' (1000) with group `alex' ...\nCreating home directory `/home/alex' ...\nNew password: [Alex types it; nothing appears as you type]\nRetype new password: [Alex types the same thing again]\npasswd: password updated successfully\n\tFull Name []: [Alex Rivera \u2014 the rest of the fields can be left blank with Enter]\nIs the information correct? [Y/n] [press Y]" },
  // GUIDE W1 team-accounts-shared-host | SEED W1 sp-w1-install-s5
  { k: "usermod -aG sudo alex", on: "host", explain: "Lets that account run administrative commands, with every one of them attributable to a name.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W1 team-accounts-shared-host | SEED W1 sp-w1-install-s5
  { k: "pveum user list", on: "host", explain: "Read it back after adding everyone under Datacenter \u2192 Permissions \u2192 Users. Each teammate should read name@pam and sit in teamadmins.", sample: "\u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n\u2502 userid     \u2502 comment \u2502 email \u2502 enable \u2502 expire \u2502 firstname \u2502 lastname \u2502\n\u255e\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u256a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u256a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u256a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u256a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u256a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u256a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2561\n\u2502 alex@pam   \u2502         \u2502       \u2502      1 \u2502      0 \u2502 Alex      \u2502 Rivera   \u2502\n\u2502 jordan@pam \u2502         \u2502       \u2502      1 \u2502      0 \u2502 Jordan    \u2502 Diaz     \u2502\n\u2502 root@pam   \u2502         \u2502       \u2502      1 \u2502      0 \u2502           \u2502          \u2502\n\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2534\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518" },
  // GUIDE W2 create-zone-bridges | SEED W2 sp-w2-install-s3
  { k: "cp /etc/network/interfaces /etc/network/interfaces.bak", on: "host", explain: "A malformed interfaces file can leave the host unreachable, and this backup is your way back.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W2 create-zone-bridges | SEED W2 sp-w2-install-s3
  { k: "cat >> /etc/network/interfaces <<'EOF' auto vmbr1 iface vmbr1 inet static address 172.16.0.1/24 bridge-ports none bridge-stp off bridge-fd 0 # DMZ zone \u2014 carries websrv (172.16.0.10), the public-facing website auto vmbr2 iface vmbr2 inet static address 192.168.0.1/24 bridge-ports none bridge-stp off bridge-fd 0 # Private zone \u2014 carries winserver (192.168.0.2) and linuxsrv (192.168.0.3) EOF", on: "host", explain: "Appends both stanzas in one go. \"bridge-ports none\" means the bridge has no physical NIC yet \u2014 it is internal to the host until the later phase.", sample: "(no output \u2014 it returns straight to the prompt)", backupOf: "/etc/network/interfaces" },
  // GUIDE W2 create-zone-bridges | SEED W2 sp-w2-install-s3 | SEED W2 sp-w2-net-s1
  { k: "cat /etc/network/interfaces", on: "host", explain: "Read the whole file back before applying. Check you have not appended inside another stanza and that vmbr0 is untouched.", sample: "auto vmbr0\niface vmbr0 inet static\n        address 10.10.30.1/16\n        gateway 10.10.10.1\n        bridge-ports enp3s0\n...\nauto vmbr1\niface vmbr1 inet static\n        address 172.16.0.1/24\n        bridge-ports none\n...\nauto vmbr2\niface vmbr2 inet static\n        address 192.168.0.1/24\n        bridge-ports none" },
  // GUIDE W2 create-zone-bridges | GUIDE W3 map-vmbr2-physical-nic | SEED W2 sp-w2-install-s3 | SEED W3 sp-w3-connect-s7
  { k: "ifreload -a", on: "host", explain: "Applies the change in place without dropping the host. On an older host without ifupdown2, use \"systemctl restart networking\" and be ready to reboot.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W2 create-zone-bridges | SEED W2 sp-w2-install-s3
  { k: "ip -br addr show vmbr1 vmbr2", on: "host", explain: "Both bridges must be UP holding the two zone gateway addresses.", sample: "vmbr1            UP             172.16.0.1/24 fe80::be24:11ff:fe4a:7c41/64\nvmbr2            UP             192.168.0.1/24 fe80::9c07:5aff:fe12:b8cd/64" },
  // GUIDE W2 create-zone-bridges | SEED W2 sp-w2-install-s3
  { k: "ip -br addr show vmbr0", on: "host", explain: "Confirm the management bridge still holds your team address \u2014 you have not disturbed your own way in.", sample: "vmbr0            UP             10.10.30.1/16 fe80::be24:11ff:fe4a:7c00/64" },
  // GUIDE W2 create-zone-bridges | SEED W2 sp-w2-install-s3
  { k: "sysctl -w net.ipv4.ip_forward=1", on: "host", explain: "Turns the host into a router between its own bridges. Until this is on, a guest on vmbr1 or vmbr2 cannot get a packet past the host.", sample: "net.ipv4.ip_forward = 1" },
  // GUIDE W2 create-zone-bridges | SEED W2 sp-w2-install-s3
  { k: "echo \"net.ipv4.ip_forward=1\" > /etc/sysctl.d/99-capstone-forward.conf && sysctl --system", on: "host", explain: "Makes forwarding survive a reboot. A drop-in file is cleaner than appending to sysctl.conf and is easy to remove again.", sample: "* Applying /usr/lib/sysctl.d/50-default.conf ...\n...\n* Applying /etc/sysctl.d/99-capstone-forward.conf ...\nnet.ipv4.ip_forward = 1\n* Applying /etc/sysctl.conf ..." },
  // GUIDE W2 create-zone-bridges | SEED W2 sp-w2-install-s3
  { k: "DEBIAN_FRONTEND=noninteractive apt install -y iptables-persistent", on: "host", explain: "The package that restores /etc/iptables/rules.v4 at boot. Non-interactive skips its offer to save the current (empty) rules \u2014 the file you write next is the ruleset.", sample: "...\nSetting up iptables-persistent (1.0.20) ...\nCreated symlink /etc/systemd/system/multi-user.target.wants/netfilter-persistent.service \u2192 /lib/systemd/system/netfilter-persistent.service.\nProcessing triggers for man-db (2.11.2-2) ..." },
  // GUIDE W2 create-zone-bridges | SEED W2 sp-w2-install-s3
  { k: "cat > /etc/iptables/rules.v4 <<'EOF' *filter :INPUT ACCEPT [0:0] :FORWARD DROP [0:0] :OUTPUT ACCEPT [0:0] # Replies to anything already allowed, in either direction -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT # Both zones reach the campus LAN, and the internet beyond it, through the host -A FORWARD -i vmbr1 -o vmbr0 -j ACCEPT -A FORWARD -i vmbr2 -o vmbr0 -j ACCEPT # Everything else the host is asked to forward is dropped \u2014 and logged, so a blocked path is visible -A FORWARD -m limit --limit 5/min -j LOG --log-prefix \"FWD-DROP \" --log-level 4 COMMIT *nat :PREROUTING ACCEPT [0:0] :INPUT ACCEPT [0:0] :OUTPUT ACCEPT [0:0] :POSTROUTING ACCEPT [0:0] # Both zones leave as the host's campus address -A POSTROUTING -o vmbr0 -j MASQUERADE COMMIT EOF iptables-restore < /etc/iptables/rules.v4", on: "host", explain: "The whole ruleset in one file; restore makes it live, twice changes nothing, every line is commented. Leave Datacenter \u2192 Firewall off \u2014 it would fight this file.", sample: "(no output \u2014 it returns straight to the prompt)", backupOf: "/etc/iptables/rules.v4" },
  // GUIDE W2 create-zone-bridges | SEED W2 sp-w2-install-s3
  { k: "iptables -L FORWARD -n -v && iptables -t nat -L POSTROUTING -n -v", on: "host", explain: "Read it back: policy DROP, two zone ACCEPTs, one MASQUERADE out of vmbr0. Never run netfilter-persistent save \u2014 the file is the source.", sample: "Chain FORWARD (policy DROP 0 packets, 0 bytes)\n pkts bytes target     prot opt in     out     source               destination\n  412 38104 ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED\n  118  8142 ACCEPT     all  --  vmbr1  vmbr0   0.0.0.0/0            0.0.0.0/0\n   96  6720 ACCEPT     all  --  vmbr2  vmbr0   0.0.0.0/0            0.0.0.0/0\nChain POSTROUTING (policy ACCEPT 0 packets, 0 bytes)\n pkts bytes target     prot opt in     out     source               destination\n  214 14862 MASQUERADE  all  --  *      vmbr0   0.0.0.0/0            0.0.0.0/0" },
  // GUIDE W2 upload-isos | SEED W2 sp-w2-install-s3
  { k: "scp ubuntu-22.04.5-live-server-amd64.iso root@10.10.30.1:/var/lib/vz/template/iso/", on: "host", explain: "Alternative to the browser upload, from a Linux workstation \u2014 substitute your team's host address and the exact filename. Faster for large images.", sample: "ubuntu-22.04.5-live-server-amd64.iso          100% 2018MB  112.4MB/s   00:17" },
  // GUIDE W2 upload-isos | SEED W2 sp-w2-install-s3
  { k: "ls -lh /var/lib/vz/template/iso/", on: "host", explain: "On the host. Confirm every image landed at its full size \u2014 a truncated upload fails silently in the VM wizard.", sample: "total 13G\n-rw-r--r-- 1 root root 2.0G Sep 15 09:12 ubuntu-22.04.5-live-server-amd64.iso\n-rw-r--r-- 1 root root 5.2G Sep 15 09:41 SERVER_EVAL_x64FRE_en-us.iso\n-rw-r--r-- 1 root root 5.7G Sep 15 10:02 Win11_23H2_English_x64v2.iso" },
  // GUIDE W2 create-linuxsrv-vm | GUIDE W2 create-websrv-dmz-vm | SEED W2 sp-w2-install-s4
  { k: "ip -4 addr show", on: "linuxsrv", explain: "In the websrv console after the reboot \u2014 it must show 172.16.0.10/24 \u2014 and again on linuxsrv, which must show 192.168.0.3/24.", sample: "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n    inet 127.0.0.1/8 scope host lo\n       valid_lft forever preferred_lft forever\n2: ens18: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000\n    inet 172.16.0.10/24 brd 172.16.0.255 scope global ens18\n       valid_lft forever preferred_lft forever" },
  // GUIDE W2 create-websrv-dmz-vm | GUIDE W3 prove-connectivity | SEED W2 sp-w2-install-s4
  { k: "ping -c 4 172.16.0.1", on: "linuxsrv", explain: "From websrv: its gateway is the host's vmbr1 address. The same check on linuxsrv is \"ping -c 4 192.168.0.1\".", sample: "PING 172.16.0.1 (172.16.0.1) 56(84) bytes of data.\n64 bytes from 172.16.0.1: icmp_seq=1 ttl=64 time=0.412 ms\n...\n64 bytes from 172.16.0.1: icmp_seq=4 ttl=64 time=0.388 ms\n\n--- 172.16.0.1 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3052ms\nrtt min/avg/max/mdev = 0.371/0.398/0.412/0.016 ms" },
  // GUIDE W2 create-winserver-vm | SEED W2 sp-w2-install-s4
  { k: "ipconfig /all", on: "winserver", explain: "On winserver, in PowerShell or cmd. Address, mask, gateway and DNS must all read back as you set them.", sample: "Windows IP Configuration\n\n   Host Name . . . . . . . . . . . . : winserver\n   Primary Dns Suffix  . . . . . . . : team1.local\n...\nEthernet adapter Ethernet:\n\n   IPv4 Address. . . . . . . . . . . : 192.168.0.2(Preferred)\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.0.1\n   DNS Servers . . . . . . . . . . . : 192.168.0.2" },
  // GUIDE W2 create-winserver-vm | SEED W2 sp-w2-install-s4
  { k: "ping 192.168.0.1", on: "winserver", explain: "From winserver: proves it reaches its gateway, which is the Proxmox host's vmbr2 address.", sample: "Pinging 192.168.0.1 with 32 bytes of data:\nReply from 192.168.0.1: bytes=32 time<1ms TTL=64\n...\nReply from 192.168.0.1: bytes=32 time<1ms TTL=64\n\nPing statistics for 192.168.0.1:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\nApproximate round trip times in milli-seconds:\n    Minimum = 0ms, Maximum = 0ms, Average = 0ms" },
  // GUIDE W2 deploy-nginx-website | GUIDE W2 linuxsrv-mariadb | SEED W2 sp-w2-deploy-s1 | SEED W2 sp-w2-deploy-s3
  { k: "sudo apt update", on: "websrv", explain: "Refresh the package lists first. websrv reaches the archive through the Proxmox host \u2014 the forwarding and NAT you enabled when you created the bridges.", sample: "Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease\nGet:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease [128 kB]\n...\nFetched 512 kB in 2s (256 kB/s)\nReading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\nAll packages are up to date." },
  // GUIDE W2 deploy-nginx-website | SEED W2 sp-w2-deploy-s1
  { k: "sudo apt install nginx -y", on: "websrv", explain: "Installs NGINX and enables the default site on port 80.", sample: "...\nSetting up nginx (1.18.0-6ubuntu14.6) ...\nProcessing triggers for ufw (0.36.1-4ubuntu0.1) ...\nProcessing triggers for man-db (2.10.2-1) ..." },
  // GUIDE W2 deploy-nginx-website | SEED W2 sp-w2-deploy-s1
  { k: "sudo chown -R ubuntu:www-data /var/www/html && sudo chmod -R g+w /var/www/html", on: "websrv", explain: "The document root becomes writable by the install user, so the Week-3 upload over scp lands straight in it. NGINX keeps reading it as www-data.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W2 deploy-nginx-website | SEED W2 sp-w2-deploy-s1
  { k: "echo \"<html><body><h1>Welcome to the Team X capstone website</h1></body></html>\" | sudo tee /var/www/html/index.html", on: "websrv", explain: "A placeholder, not the site. It proves NGINX serves what is in the document root; the page your team builds replaces it in Week 3.", sample: "<html><body><h1>Welcome to the Team X capstone website</h1></body></html>" },
  // GUIDE W2 deploy-nginx-website | SEED W2 sp-w2-deploy-s1
  { k: "sudo systemctl enable --now nginx", on: "websrv", explain: "Enables at boot and starts it in one command.", sample: "Synchronizing state of nginx.service with SysV service script with /lib/systemd/systemd-sysv-install.\nExecuting: /lib/systemd/systemd-sysv-install enable nginx" },
  // GUIDE W2 deploy-nginx-website | SEED W2 sp-w2-deploy-s1
  { k: "systemctl status nginx --no-pager", on: "websrv", explain: "Confirm active (running) before you go looking for network problems.", sample: "\u25cf nginx.service - A high performance web server and a reverse proxy server\n     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)\n     Active: active (running) since Thu 2026-09-17 10:21:55 UTC; 2min 11s ago\n   Main PID: 1482 (nginx)\n      Tasks: 3 (limit: 2274)\n     Memory: 3.4M\n     CGroup: /system.slice/nginx.service\n             \u251c\u25001482 \"nginx: master process /usr/sbin/nginx -g daemon on; master_process on;\"\n..." },
  // GUIDE W2 deploy-nginx-website | GUIDE W3 prove-connectivity | GUIDE W4 harden-dmz-web-host | SEED W2 sp-w2-deploy-s1 | SEED W3 sp-w3-connect-s5 | SEED W4 sp-w4-secure-s2
  { k: "curl -I http://172.16.0.10", on: "host", explain: "From the Proxmox host shell, not websrv: the host holds 172.16.0.1 on vmbr1, so it reaches the DMZ directly. Private-zone hosts cannot until Week 3.", sample: "HTTP/1.1 200 OK\nServer: nginx/1.18.0 (Ubuntu)\nDate: Thu, 17 Sep 2026 10:24:06 GMT\nContent-Type: text/html\nContent-Length: 74\nLast-Modified: Thu, 17 Sep 2026 10:21:40 GMT\nConnection: keep-alive\nAccept-Ranges: bytes" },
  // GUIDE W2 winserver-promote-adds | SEED W2 sp-w2-deploy-s2
  { k: "Rename-Computer -NewName \"winserver\" -Restart", on: "winserver", explain: "Rename before promotion. The machine reboots.", sample: "WARNING: The changes will take effect after you restart the computer WIN-8Q2K9P3LV7A." },
  // GUIDE W2 winserver-promote-adds | SEED W2 sp-w2-deploy-s2
  { k: "Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools", on: "winserver", explain: "Installs the role and the management tools. Nothing is a domain controller yet.", sample: "Success Restart Needed Exit Code      Feature Result\n------- -------------- ---------      --------------\nTrue    No             Success        {Active Directory Domain Services, Group P..." },
  // GUIDE W2 winserver-promote-adds | SEED W2 sp-w2-deploy-s2
  { k: "Install-ADDSForest -DomainName \"team1.local\" -DomainNetbiosName \"TEAM1\" -InstallDns -Force", on: "winserver", explain: "Creates the forest and, with -InstallDns, the DNS role and the forward lookup zone. The server reboots again.", sample: "The target server will be configured as a domain controller and restarted when this operation is complete.\n\nMessage                                  Context  RebootRequired Status\n-------                                  -------  -------------- ------\nOperation completed successfully                            True Success" },
  // GUIDE W2 winserver-promote-adds | SEED W2 sp-w2-deploy-s2
  { k: "Get-ADDomain | Select-Object DNSRoot, NetBIOSName, DomainMode", on: "winserver", explain: "After the reboot: confirms the domain exists and names it.", sample: "DNSRoot     NetBIOSName DomainMode\n-------     ----------- ----------\nteam1.local TEAM1       Windows2016Domain" },
  // GUIDE W2 winserver-promote-adds | SEED W2 sp-w2-deploy-s2
  { k: "Get-Service NTDS, DNS | Select-Object Name, Status", on: "winserver", explain: "Both must read Running before you add records or a DHCP scope.", sample: "Name Status\n---- ------\nNTDS Running\nDNS  Running" },
  // GUIDE W2 winserver-dns | SEED W2 sp-w2-deploy-s2
  { k: "Install-WindowsFeature -Name DNS -IncludeManagementTools", on: "winserver", explain: "Only for the standalone route \u2014 harmless to run if the role is already present.", sample: "Success Restart Needed Exit Code      Feature Result\n------- -------------- ---------      --------------\nTrue    No             NoChangeNeeded {}" },
  // GUIDE W2 winserver-dns | SEED W2 sp-w2-deploy-s2
  { k: "Add-DnsServerPrimaryZone -Name \"team1.local\" -ZoneFile \"team1.local.dns\"", on: "winserver", explain: "The New Zone wizard in PowerShell. Substitute your team number, and skip it if AD DS already created the zone.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W2 winserver-dns | SEED W2 sp-w2-deploy-s2
  { k: "Add-DnsServerResourceRecordA -ZoneName \"team1.local\" -Name \"winserver\" -IPv4Address \"192.168.0.2\"", on: "winserver", explain: "The directory / DNS / DHCP server itself.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W2 winserver-dns | SEED W2 sp-w2-deploy-s2
  { k: "Add-DnsServerResourceRecordA -ZoneName \"team1.local\" -Name \"linuxsrv\" -IPv4Address \"192.168.0.3\"", on: "winserver", explain: "The private-zone database host.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W2 winserver-dns | SEED W2 sp-w2-deploy-s2
  { k: "Add-DnsServerResourceRecordA -ZoneName \"team1.local\" -Name \"websrv\" -IPv4Address \"172.16.0.10\"", on: "winserver", explain: "The DMZ website. The record lives in the same zone even though the host is in a different subnet \u2014 DNS zones and network zones are unrelated.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W2 winserver-dns | GUIDE W3 prove-connectivity | SEED W2 sp-w2-deploy-s2 | SEED W3 sp-w3-connect-s5
  { k: "nslookup websrv.team1.local 192.168.0.2", on: "winserver", explain: "Query the server explicitly. Returning 172.16.0.10 is what proves cross-zone name resolution works.", sample: "Server:  winserver.team1.local\nAddress:  192.168.0.2\n\nName:    websrv.team1.local\nAddress:  172.16.0.10" },
  // GUIDE W2 winserver-dns | SEED W2 sp-w2-deploy-s2
  { k: "Add-DnsServerForwarder -IPAddress 10.10.10.1", on: "winserver", explain: "The campus resolver, for every name that is not team1.local. Without it the zones lose internet names in Week 3, when the temporary 1.1.1.1 goes.", sample: "(no output \u2014 it returns straight to the prompt)", backupOf: "winserver's DNS zone" },
  // GUIDE W2 winserver-dns | SEED W2 sp-w2-deploy-s2
  { k: "Resolve-DnsName archive.ubuntu.com -Server 192.168.0.2", on: "winserver", explain: "An internet name through winserver. An answer proves the forwarder; every VM resolves the package archive this way after Week 3.", sample: "Name                           Type   TTL   Section    IPAddress\n----                           ----   ---   -------    ---------\narchive.ubuntu.com             A      60    Answer     185.125.190.83\narchive.ubuntu.com             A      60    Answer     91.189.91.81\narchive.ubuntu.com             A      60    Answer     185.125.190.81" },
  // GUIDE W2 winserver-dhcp | SEED W2 sp-w2-deploy-s2
  { k: "Install-WindowsFeature -Name DHCP -IncludeManagementTools", on: "winserver", explain: "The DHCP role install in PowerShell.", sample: "Success Restart Needed Exit Code      Feature Result\n------- -------------- ---------      --------------\nTrue    No             Success        {DHCP Server, DHCP Server Tools, Remote S..." },
  // GUIDE W2 winserver-dhcp | SEED W2 sp-w2-deploy-s2
  { k: "Add-DhcpServerv4Scope -Name \"CapstoneScope\" -StartRange 192.168.0.100 -EndRange 192.168.0.200 -SubnetMask 255.255.255.0 -State Active", on: "winserver", explain: "The range starts at .100 deliberately: .1, .2, .3 and .4 \u2014 the optional monitoring host \u2014 are static, and your own extra private-zone VMs go at .5 upward.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W2 winserver-dhcp | SEED W2 sp-w2-deploy-s2
  { k: "Set-DhcpServerv4OptionValue -ScopeId 192.168.0.0 -Router 192.168.0.1 -DnsServer 192.168.0.2 -DnsDomain \"team1.local\"", on: "winserver", explain: "Option 3 is the host's vmbr2 address; option 6 is winserver itself. Substitute your team number in the domain.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W2 winserver-dhcp | SEED W2 sp-w2-deploy-s2
  { k: "Add-DhcpServerInDC -DnsName \"winserver.team1.local\" -IPAddress 192.168.0.2", on: "winserver", explain: "Authorizes the server in Active Directory. An unauthorized DHCP server in a domain refuses to hand out leases.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W2 winserver-dhcp | SEED W2 sp-w2-deploy-s2
  { k: "Get-DhcpServerv4Lease -ScopeId 192.168.0.0", on: "winserver", explain: "Run this once client01 has booted \u2014 a scope with no client is untested. Screenshot the leases for the record.", sample: "IPAddress     ScopeId     ClientId          HostName             AddressState\n---------     -------     --------          --------             ------------\n192.168.0.100 192.168.0.0 00-15-5d-01-2a-0b client01.team1.local ActiveReservation" },
  // GUIDE W2 linuxsrv-mariadb | SEED W2 sp-w2-deploy-s3
  { k: "sudo apt install mariadb-server -y", on: "linuxsrv", explain: "Installs the server and the client.", sample: "...\nSetting up mariadb-server (1:10.6.18-0ubuntu0.22.04.1) ...\nCreated symlink /etc/systemd/system/multi-user.target.wants/mariadb.service \u2192 /lib/systemd/system/mariadb.service.\nProcessing triggers for man-db (2.10.2-1) ..." },
  // GUIDE W2 linuxsrv-mariadb | SEED W2 sp-w2-deploy-s3
  { k: "sudo systemctl enable --now mariadb", on: "linuxsrv", explain: "Enables at boot and starts it.", sample: "Synchronizing state of mariadb.service with SysV service script with /lib/systemd/systemd-sysv-install.\nExecuting: /lib/systemd/systemd-sysv-install enable mariadb" },
  // GUIDE W2 linuxsrv-mariadb | SEED W2 sp-w2-deploy-s3
  { k: "sudo mysql_secure_installation", on: "linuxsrv", explain: "Sets the root password, removes the anonymous users and the test database, and disables remote root login.", sample: "Enter current password for root (enter for none):   [just press Enter \u2014 there is none yet]\nSwitch to unix_socket authentication [Y/n]   [n]\nChange the root password? [Y/n]   [Y, then type a password of your own twice]\nRemove anonymous users? [Y/n]   [Y]\nDisallow root login remotely? [Y/n]   [Y]\nRemove test database and access to it? [Y/n]   [Y]\nReload privilege tables now? [Y/n]   [Y]\n...\nThanks for using MariaDB!" },
  // GUIDE W2 linuxsrv-mariadb | SEED W2 sp-w2-deploy-s3
  { k: "sudo mysql", on: "linuxsrv", explain: "Opens the MariaDB shell as root over the unix socket. The next three statements are typed inside it.", sample: "Welcome to the MariaDB monitor.  Commands end with ; or \\g.\nYour MariaDB connection id is 32\nServer version: 10.6.18-MariaDB-0ubuntu0.22.04.1 Ubuntu 22.04\n...\nMariaDB [(none)]>   [the shell prompt \u2014 type the next three statements here, then EXIT;]" },
  // GUIDE W2 linuxsrv-mariadb | SEED W2 sp-w2-deploy-s3
  { k: "CREATE DATABASE capstone_db;", on: "linuxsrv", explain: "The application database.", sample: "Query OK, 1 row affected (0.001 sec)" },
  // GUIDE W2 linuxsrv-mariadb | SEED W2 sp-w2-deploy-s3
  { k: "CREATE USER 'capuser'@'localhost' IDENTIFIED BY 'ChangeThisPassword1!';", on: "linuxsrv", explain: "Use a real password of your own and record it in the Server Bring-Up Log.", sample: "Query OK, 0 rows affected (0.004 sec)" },
  // GUIDE W2 linuxsrv-mariadb | SEED W2 sp-w2-deploy-s3
  { k: "GRANT ALL PRIVILEGES ON capstone_db.* TO 'capuser'@'localhost'; FLUSH PRIVILEGES; EXIT;", on: "linuxsrv", explain: "Grants on capstone_db only \u2014 not on everything \u2014 then reloads the grant tables and leaves the shell.", sample: "Query OK, 0 rows affected (0.003 sec)\n\nQuery OK, 0 rows affected (0.001 sec)\n\nBye" },
  // GUIDE W2 linuxsrv-mariadb | GUIDE W4 timed-restore-test | SEED W2 sp-w2-deploy-s3 | SEED W4 sp-w4-dr-s2
  { k: "mysql -u capuser -p -e \"SHOW DATABASES;\"", on: "linuxsrv", explain: "Log in as the application user and confirm capstone_db is listed. This is the proof step.", sample: "Enter password:\n+--------------------+\n| Database           |\n+--------------------+\n| capstone_db        |\n| information_schema |\n+--------------------+" },
  // SEED W3 sp-w3-topology-s1
  { k: "ip -brief a", on: "host", explain: "Every interface and the address it holds, one line each.", sample: "lo               UNKNOWN        127.0.0.1/8 ::1/128\nens18            UP             172.16.0.10/24 fe80::be24:11ff:fe6a:3c19/64" },
  // SEED W3 sp-w3-topology-s1
  { k: "ip route | grep default", on: "host", explain: "Where this host sends anything it does not have a better route for.", sample: "default via 172.16.0.1 dev ens18 proto static" },
  // SEED W3 sp-w3-lnx-s1 | SEED W3 sp-w3-topology-s1
  { k: "resolvectl status | grep -A2 \"Current DNS\"", on: "host", explain: "Which DNS server is really answering \u2014 Ubuntu's stub at 127.0.0.53 hides the real one.", sample: "       Current DNS Server: 192.168.0.2\n              DNS Servers: 192.168.0.2\n               DNS Domain: team1.local" },
  // GUIDE W3 apply-static-addresses | SEED W3 sp-w3-connect-s1
  { k: "ip -br addr show vmbr0 vmbr1 vmbr2", on: "host", explain: "On the host. Expect 10.10.30.T/16, 172.16.0.1/24 and 192.168.0.1/24. Wrong? Edit /etc/network/interfaces and run \"ifreload -a\" \u2014 the host is never a DHCP client.", sample: "vmbr0            UP             10.10.30.1/16 fe80::2ef0:5dff:fe11:8a41/64\nvmbr1            UP             172.16.0.1/24 fe80::b81f:2cff:fe44:9e07/64\nvmbr2            UP             192.168.0.1/24 fe80::6c3a:d0ff:fe95:12bb/64" },
  // GUIDE W3 apply-static-addresses | SEED W3 sp-w3-connect-s1
  { k: "ip -br link", on: "host", explain: "Inside each Ubuntu guest, to learn the real interface name. A VirtIO NIC usually appears as ens18 \u2014 do not copy an interface name out of a guide.", sample: "lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>\nens18            UP             bc:24:11:6a:3c:19 <BROADCAST,MULTICAST,UP,LOWER_UP>" },
  // GUIDE W3 apply-static-addresses | SEED W3 sp-w3-connect-s1
  { k: "sudo tee /etc/netplan/01-capstone.yaml > /dev/null <<'EOF' network: version: 2 ethernets: ens18: dhcp4: false addresses: [172.16.0.10/24] routes: - to: default via: 172.16.0.1 nameservers: addresses: [192.168.0.2] EOF", on: "websrv", explain: "websrv, in the DMZ; substitute the interface name you read. For linuxsrv use 192.168.0.3/24 via 192.168.0.1. One nameserver now \u2014 winserver carries DNS.", sample: "(no output \u2014 it returns straight to the prompt)", backupOf: "/etc/netplan/01-capstone.yaml" },
  // GUIDE W3 apply-static-addresses | SEED W3 sp-w3-connect-s1
  { k: "sudo chmod 600 /etc/netplan/01-capstone.yaml", on: "websrv", explain: "Netplan warns loudly about world-readable configs.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 apply-static-addresses | SEED W3 sp-w3-connect-s1
  { k: "sudo netplan apply", on: "websrv", explain: "Applies immediately and persists across reboots.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 apply-static-addresses | SEED W3 sp-w3-connect-s1
  { k: "ip -4 addr show && ip route show && resolvectl status | grep -A2 'DNS Servers'", on: "host", explain: "Address, default route and resolver in one pass, on each Ubuntu host.", sample: "1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n    inet 127.0.0.1/8 scope host lo\n...\n2: ens18: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000\n    inet 172.16.0.10/24 brd 172.16.0.255 scope global ens18\n       valid_lft forever preferred_lft forever\ndefault via 172.16.0.1 dev ens18 proto static\n172.16.0.0/24 dev ens18 proto kernel scope link src 172.16.0.10\n              DNS Servers: 192.168.0.2" },
  // GUIDE W3 apply-static-addresses | SEED W3 sp-w3-connect-s2
  { k: "Get-NetAdapter | Select-Object Name, Status, LinkSpeed", on: "winserver", explain: "Names the adapter you are about to configure.", sample: "Name     Status LinkSpeed\n----     ------ ---------\nEthernet Up     10 Gbps" },
  // GUIDE W3 apply-static-addresses | SEED W3 sp-w3-connect-s2
  { k: "New-NetIPAddress -InterfaceAlias \"Ethernet\" -IPAddress 192.168.0.2 -PrefixLength 24 -DefaultGateway 192.168.0.1", on: "winserver", explain: "If the adapter still holds a DHCP address, run \"Remove-NetIPAddress -InterfaceAlias 'Ethernet' -Confirm:$false\" first.", sample: "IPAddress         : 192.168.0.2\nInterfaceIndex    : 5\nInterfaceAlias    : Ethernet\nAddressFamily     : IPv4\nType              : Unicast\nPrefixLength      : 24\nPrefixOrigin      : Manual\n..." },
  // GUIDE W3 apply-static-addresses | SEED W3 sp-w3-connect-s2
  { k: "Set-DnsClientServerAddress -InterfaceAlias \"Ethernet\" -ServerAddresses 127.0.0.1", on: "winserver", explain: "winserver resolves against itself because it is the DNS server. Every other host points at 192.168.0.2.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 apply-static-addresses | SEED W3 sp-w3-connect-s2
  { k: "Get-NetIPConfiguration -InterfaceAlias \"Ethernet\"", on: "winserver", explain: "Reads back address, gateway and DNS. Log the change as you make it.", sample: "InterfaceAlias       : Ethernet\nInterfaceIndex       : 5\nInterfaceDescription : Red Hat VirtIO Ethernet Adapter\nNetProfile.Name      : team1.local\nIPv4Address          : 192.168.0.2\nIPv4DefaultGateway   : 192.168.0.1\nDNSServer            : 127.0.0.1" },
  // GUIDE W3 enable-routing-nat | SEED W3 sp-w3-connect-s3
  { k: "sysctl net.ipv4.ip_forward", on: "host", explain: "You turned this on in Week 2 and the drop-in file made it persistent. Expect 1; if it reads 0, re-run the two Week-2 sysctl lines.", sample: "net.ipv4.ip_forward = 1" },
  // GUIDE W3 enable-routing-nat | SEED W3 sp-w3-connect-s3
  { k: "cp /etc/iptables/rules.v4 /etc/iptables/rules.v4.week2", on: "host", explain: "The Week-2 file, kept. If the new one misbehaves, restore this copy and you are back to a host that only routes out.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 enable-routing-nat | SEED W3 sp-w3-connect-s3
  { k: "cat > /etc/iptables/rules.v4 <<'EOF' *filter :INPUT ACCEPT [0:0] :FORWARD DROP [0:0] :OUTPUT ACCEPT [0:0] # Replies to anything already allowed, in either direction -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT # Both zones reach the campus LAN, and the internet beyond it, through the host -A FORWARD -i vmbr1 -o vmbr0 -j ACCEPT -A FORWARD -i vmbr2 -o vmbr0 -j ACCEPT # Staff in the private zone open the website -A FORWARD -i vmbr2 -o vmbr1 -j ACCEPT # The DMZ reaches the private zone for DNS and the database, and for nothing else -A FORWARD -i vmbr1 -o vmbr2 -d 192.168.0.2 -p udp --dport 53 -j ACCEPT -A FORWARD -i vmbr1 -o vmbr2 -d 192.168.0.2 -p tcp --dport 53 -j ACCEPT -A FORWARD -i vmbr1 -o vmbr2 -d 192.168.0.3 -p tcp --dport 3306 -j ACCEPT # The published ports, after PREROUTING has rewritten the destination -A FORWARD -i vmbr0 -o vmbr1 -d 172.16.0.10 -p tcp --dport 80 -j ACCEPT -A FORWARD -i vmbr0 -o vmbr1 -d 172.16.0.10 -p tcp --dport 443 -j ACCEPT -A FORWARD -i vmbr0 -o vmbr1 -d 172.16.0.10 -p tcp --dport 22 -j ACCEPT # Administrators on the tailnet, through the host, into both zones -A FORWARD -i tailscale0 -o vmbr1 -p tcp --dport 22 -j ACCEPT -A FORWARD -i tailscale0 -o vmbr2 -p tcp --dport 22 -j ACCEPT -A FORWARD -i tailscale0 -o vmbr2 -d 192.168.0.2 -p tcp --dport 3389 -j ACCEPT # Everything else the host is asked to forward is dropped \u2014 and logged, so a blocked path is visible -A FORWARD -m limit --limit 5/min -j LOG --log-prefix \"FWD-DROP \" --log-level 4 COMMIT *nat :PREROUTING ACCEPT [0:0] :INPUT ACCEPT [0:0] :OUTPUT ACCEPT [0:0] :POSTROUTING ACCEPT [0:0] # Published from the campus LAN: the host's own address, port by port -A PREROUTING -i vmbr0 -p tcp --dport 80 -j DNAT --to-destination 172.16.0.10:80 -A PREROUTING -i vmbr0 -p tcp --dport 443 -j DNAT --to-destination 172.16.0.10:443 -A PREROUTING -i vmbr0 -p tcp --dport 2200 -j DNAT --to-destination 172.16.0.10:22 # Both zones leave as the host's campus address -A POSTROUTING -o vmbr0 -j MASQUERADE COMMIT EOF iptables-restore < /etc/iptables/rules.v4", on: "host", explain: "The whole ruleset in one file; restore makes it live and running it twice changes nothing. Every line is commented in the file itself.", sample: "(no output \u2014 it returns straight to the prompt)", backupOf: "/etc/iptables/rules.v4" },
  // GUIDE W3 enable-routing-nat | SEED W3 sp-w3-connect-s3
  { k: "iptables -t nat -L PREROUTING -n", on: "host", explain: "Three DNAT lines, all to websrv, none into the private zone. 443 is published before anything listens \u2014 Week 4 fixes that.", sample: "Chain PREROUTING (policy ACCEPT)\ntarget     prot opt source               destination         \nDNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:80 to:172.16.0.10:80\nDNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:443 to:172.16.0.10:443\nDNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:2200 to:172.16.0.10:22" },
  // GUIDE W3 enable-routing-nat | SEED W3 sp-w3-connect-s3
  { k: "iptables -L FORWARD -n -v", on: "host", explain: "Policy DROP, so every ACCEPT is a decision. The last line logs what is refused: journalctl -k shows it as FWD-DROP.", sample: "Chain FORWARD (policy DROP 24 packets, 1440 bytes)\n pkts bytes target     prot opt in     out     source               destination         \n 1842  184K ACCEPT     all  --  *      *       0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED\n  312 18720 ACCEPT     tcp  --  vmbr0  vmbr1   0.0.0.0/0            172.16.0.10          multiport dports 80,443,22\n   46  3128 ACCEPT     udp  --  vmbr1  vmbr2   172.16.0.0/24        192.168.0.2          udp dpt:53\n    8   480 ACCEPT     tcp  --  vmbr1  vmbr2   172.16.0.0/24        192.168.0.3          tcp dpt:3306\n...\n   24  1440 LOG        all  --  *      *       0.0.0.0/0            0.0.0.0/0            limit: avg 5/min burst 5 LOG flags 0 level 4 prefix \"FWD-DROP \"" },
  // GUIDE W3 enable-routing-nat | SEED W3 sp-w3-connect-s3
  { k: "systemctl reboot", on: "host", explain: "Once, to prove it: iptables-persistent restores the same file at boot. After the reboot, re-run the two list commands.", sample: "Connection to 10.10.30.1 closed by remote host.\nConnection to 10.10.30.1 closed." },
  // GUIDE W3 build-and-upload-site | SEED W3 sp-w3-connect-s3b
  { k: "mkdir -p site && cat > site/index.html <<'EOF' <!doctype html> <html lang=\"en\"> <head> <meta charset=\"utf-8\"> <title>Your Business \u2014 built by Team X</title> <link rel=\"stylesheet\" href=\"style.css\"> </head> <body> <header> <h1>Your Business</h1> <p>Built, networked and run by Team X for the Server+ capstone.</p> </header> <main> <section> <h2>What we do</h2> <p>One sentence from your Architecture Brief: what this business sells or does.</p> </section> <section> <h2>What runs it</h2> <ul> <li>websrv, in the DMZ: this site</li> <li>winserver, private: staff logins, DNS and DHCP</li> <li>linuxsrv, private: the database</li> </ul> </section> <section> <h2>Contact</h2> <p>The address your Architecture Brief names \u2014 a person, a desk, a mailbox.</p> </section> </main> <footer>Team X \u00b7 Week 3 \u00b7 served from the DMZ through the Proxmox host</footer> </body> </html> EOF", on: "campus", explain: "A title, the business, what it does, a contact line, the three machines. Replace every \"Your Business\" and \"Team X\"; add pages if you like.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 build-and-upload-site | SEED W3 sp-w3-connect-s3b
  { k: "cat > site/style.css <<'EOF' body { font-family: system-ui, sans-serif; margin: 0; color: darkslategray; background: whitesmoke; } header { background: darkslategray; color: white; padding: 2rem; } header p { margin: 0.5rem 0 0; opacity: 0.85; } main { max-width: 48rem; margin: 2rem auto; padding: 0 1rem; } section { background: white; border-radius: 8px; padding: 1rem 1.5rem; margin-bottom: 1rem; } footer { text-align: center; color: dimgray; padding: 2rem; font-size: 0.9rem; } EOF", on: "campus", explain: "Enough style to show it is yours. A site is not a default page with a different heading.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 build-and-upload-site | SEED W3 sp-w3-connect-s3b
  { k: "scp -P 2200 -r site/* ubuntu@10.10.30.T:/var/www/html/", on: "websrv", explain: "Port 2200 on your host's campus address is forwarded to sshd on websrv; the document root is writable by the install user since Week 2.", sample: "index.html                                    100% 2143     1.9MB/s   00:00\nstyle.css                                     100% 1268     1.1MB/s   00:00\nlogo.svg                                      100% 3410     2.8MB/s   00:00" },
  // GUIDE W3 build-and-upload-site | SEED W3 sp-w3-connect-s3b
  { k: "curl -s http://10.10.30.T | grep -i \"<title>\"", on: "campus", explain: "From a classmate's machine, not your own: your title comes back through the host's port-80 forward. Screenshot the page in a browser too \u2014 that is the evidence.", sample: "    <title>Brightline Coffee Roasters \u2014 Team 1</title>" },
  // GUIDE W3 build-and-upload-site | SEED W3 sp-w3-connect-s3b
  { k: "curl -sI --max-time 5 https://10.10.30.T; echo \"exit $?\"", on: "websrv", explain: "Expected to fail: 443 is published but nothing listens on websrv until Week 4 adds TLS. Published and listening are different questions \u2014 the Networking deep-dive asks exactly this.", sample: "exit 7" },
  // GUIDE W3 static-routes-reverse | SEED W3 sp-w3-connect-s4
  { k: "route -p add 172.16.0.0 mask 255.255.255.0 192.168.0.1", on: "winserver", explain: "On winserver, elevated. The -p flag is what makes the route persistent; without it the route is gone at the next reboot.", sample: " OK!", backupOf: "winserver's persistent routes" },
  // GUIDE W3 static-routes-reverse | SEED W3 sp-w3-connect-s4
  { k: "route print -4", on: "winserver", explain: "Confirm the 172.16.0.0 entry is listed, and that it appears under Persistent Routes.", sample: "===========================================================================\nActive Routes:\nNetwork Destination        Netmask          Gateway       Interface  Metric\n          0.0.0.0          0.0.0.0      192.168.0.1     192.168.0.2    271\n       172.16.0.0    255.255.255.0      192.168.0.1     192.168.0.2     16\n...\nPersistent Routes:\n  Network Address          Netmask  Gateway Address  Metric\n       172.16.0.0    255.255.255.0      192.168.0.1       1" },
  // GUIDE W3 static-routes-reverse | SEED W3 sp-w3-connect-s4
  { k: "sudo ip route add 172.16.0.0/24 via 192.168.0.1", on: "linuxsrv", explain: "On linuxsrv. Takes effect immediately but does NOT survive a reboot on its own.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 static-routes-reverse | SEED W3 sp-w3-connect-s4
  { k: "sudo nano /etc/netplan/01-capstone.yaml", on: "websrv", explain: "The route belongs inside the existing routes: list, so this is an edit, not an append \u2014 an appended entry lands outside every block.", sample: "[nano opens the file; the student adds a second entry inside the existing routes: list \u2014 - to: 172.16.0.0/24 / via: 192.168.0.1 \u2014 indented to line up with the default route already there, then saves with Ctrl+O and exits with Ctrl+X]", backupOf: "/etc/netplan/01-capstone.yaml" },
  // GUIDE W3 static-routes-reverse | SEED W3 sp-w3-connect-s4
  { k: "network: version: 2 ethernets: ens18: dhcp4: false addresses: [192.168.0.3/24] routes: - to: default via: 192.168.0.1 - to: 172.16.0.0/24 via: 192.168.0.1 nameservers: addresses: [192.168.0.2]", on: "winserver", explain: "The complete linuxsrv file \u2014 address, both routes, resolver. Make yours match, substituting your interface name; save with Ctrl+O, exit with Ctrl+X.", sample: "[this is the file content, not a command \u2014 the student makes the open nano buffer match it line for line (address 192.168.0.3/24, the default route via 192.168.0.1, the 172.16.0.0/24 route via 192.168.0.1, nameserver 192.168.0.2), substituting the real interface name, then Ctrl+O, Ctrl+X]" },
  // GUIDE W3 static-routes-reverse | SEED W3 sp-w3-connect-s4
  { k: "sudo netplan apply && ip route show", on: "websrv", explain: "Applies and confirms. The 172.16.0.0/24 via 192.168.0.1 line must appear.", sample: "default via 192.168.0.1 dev ens18 proto static\n172.16.0.0/24 via 192.168.0.1 dev ens18 proto static\n192.168.0.0/24 dev ens18 proto kernel scope link src 192.168.0.3" },
  // GUIDE W3 static-routes-reverse | SEED W3 sp-w3-connect-s4
  { k: "Test-NetConnection -ComputerName 172.16.0.10 -Port 80", on: "winserver", explain: "From winserver. TcpTestSucceeded : True proves the route and the forward rule both work.", sample: "ComputerName     : 172.16.0.10\nRemoteAddress    : 172.16.0.10\nRemotePort       : 80\nInterfaceAlias   : Ethernet\nSourceAddress    : 192.168.0.2\nTcpTestSucceeded : True" },
  // GUIDE W3 prove-connectivity | SEED W3 sp-w3-connect-s5
  { k: "ping -c 4 172.16.0.1 && ping -c 4 192.168.0.1", on: "host", explain: "From the Proxmox host: both zone gateways are its own bridge addresses, so this confirms both bridges are up.", sample: "PING 172.16.0.1 (172.16.0.1) 56(84) bytes of data.\n64 bytes from 172.16.0.1: icmp_seq=1 ttl=64 time=0.041 ms\n...\n--- 172.16.0.1 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3062ms\nPING 192.168.0.1 (192.168.0.1) 56(84) bytes of data.\n...\n--- 192.168.0.1 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3070ms" },
  // GUIDE W3 prove-connectivity | GUIDE W3 tailscale-subnet-router | SEED W3 sp-w3-connect-s5 | SEED W3 sp-w3-connect-s6
  { k: "ssh ubuntu@172.16.0.10 hostname && ssh ubuntu@192.168.0.3 hostname", on: "host", explain: "From the Proxmox host, with the install users. The host sits on every zone bridge, so its own SSH is never forwarded \u2014 the DROP policy does not apply.", sample: "websrv\nlinuxsrv" },
  // GUIDE W3 prove-connectivity | SEED W3 sp-w3-connect-s5
  { k: "ping -c 4 192.168.0.2", on: "host", explain: "From linuxsrv: Linux to Windows across the private zone. Run \"ping 192.168.0.3\" from winserver for the reverse.", sample: "PING 192.168.0.2 (192.168.0.2) 56(84) bytes of data.\n64 bytes from 192.168.0.2: icmp_seq=1 ttl=128 time=0.412 ms\n64 bytes from 192.168.0.2: icmp_seq=2 ttl=128 time=0.388 ms\n...\n--- 192.168.0.2 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3055ms\nrtt min/avg/max/mdev = 0.388/0.407/0.431/0.019 ms" },
  // GUIDE W3 prove-connectivity | SEED W3 sp-w3-connect-s5
  { k: "nslookup archive.ubuntu.com 192.168.0.2", on: "winserver", explain: "From websrv: an internet name answered by winserver through its forwarder \u2014 the DMZ's DNS hole and the forwarder proven in one line.", sample: "Server:\t\t192.168.0.2\nAddress:\t192.168.0.2#53\n\nNon-authoritative answer:\nName:\tarchive.ubuntu.com\nAddress: 185.125.190.36\nName:\tarchive.ubuntu.com\nAddress: 91.189.91.83" },
  // GUIDE W3 prove-connectivity | SEED W3 sp-w3-connect-s5
  { k: "nc -vz -w 3 192.168.0.3 3306", on: "websrv", explain: "From websrv: the one thing the DMZ may open into the private zone besides DNS. \"succeeded\" \u2014 the database port answers through the host.", sample: "Connection to 192.168.0.3 3306 port [tcp/mysql] succeeded!" },
  // GUIDE W3 prove-connectivity | SEED W3 sp-w3-connect-s5
  { k: "nc -vz -w 3 192.168.0.3 22", on: "websrv", explain: "From websrv: must FAIL. The DMZ has no SSH hole into the private zone. journalctl -k | grep FWD-DROP on the host shows the refusal \u2014 screenshot it.", sample: "nc: connect to 192.168.0.3 port 22 (tcp) timed out: Operation now in progress" },
  // GUIDE W3 prove-connectivity | SEED W3 sp-w3-connect-s5
  { k: "curl -I http://10.10.30.T", on: "campus", explain: "From a campus PC on vmbr0: proves the port-80 DNAT publishes the site to the campus LAN.", sample: "HTTP/1.1 200 OK\nServer: nginx/1.24.0 (Ubuntu)\nDate: Thu, 17 Sep 2026 15:42:08 GMT\nContent-Type: text/html\nContent-Length: 2143\nLast-Modified: Thu, 17 Sep 2026 15:31:52 GMT\nConnection: keep-alive\nAccept-Ranges: bytes" },
  // GUIDE W3 prove-connectivity | SEED W3 sp-w3-connect-s5
  { k: "ssh -p 2200 ubuntu@10.10.30.T hostname", on: "websrv", explain: "From a campus PC: 2200 lands on websrv and prints its hostname \u2014 the only SSH the campus reaches. linuxsrv has no published port at all.", sample: "websrv" },
  // GUIDE W3 tailscale-subnet-router | SEED W3 sp-w3-connect-s6
  { k: "tailscale up --advertise-routes=172.16.0.0/24,192.168.0.0/24 --ssh", on: "host", explain: "On the host. --ssh keeps the tailnet login you already use; the routes are what change. Approve them in the admin console under the host's Routes.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 tailscale-subnet-router | SEED W3 sp-w3-connect-s6
  { k: "tailscale debug prefs | grep -A3 AdvertiseRoutes", on: "laptop", explain: "Both subnets listed. If not, re-run the up command with both routes on one line.", sample: "  \"AdvertiseRoutes\": [\n    \"172.16.0.0/24\",\n    \"192.168.0.0/24\"\n  ]," },
  // GUIDE W3 tailscale-subnet-router | SEED W3 sp-w3-connect-s6
  { k: "tailscale up --accept-routes", on: "laptop", explain: "On your laptop (Windows and macOS: Settings \u2192 Use subnet routes). Now 172.16.0.x and 192.168.0.x route through the host.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 tailscale-subnet-router | SEED W3 sp-w3-connect-s6
  { k: "mstsc /v:192.168.0.2", on: "winserver", explain: "From a Windows laptop: RDP to winserver over the tailnet \u2014 the one other admin path the rules allow into the private zone.", sample: "[no console output \u2014 the Remote Desktop window opens, asks for TEAM1\\Administrator and its password, and the winserver desktop appears]" },
  // GUIDE W1 team-accounts-shared-host | GUIDE W3 tailscale-subnet-router | GUIDE W4 harden-proxmox-host-access | SEED W3 sp-w3-connect-s6 | SEED W4 sp-w4-secure-s7
  { k: "ssh alex@<tailscale-ip>", on: "laptop", explain: "The host itself \u2014 the vmbr0 device \u2014 by its tailnet address or MagicDNS name, exactly as in Week 1.", sample: "Welcome to the Proxmox Virtual Environment. Please use your web browser to\nconfigure this server - connect to:\n\n  https://10.10.30.1:8006/\n\nLast login: Thu Sep 17 09:12:44 2026 from 100.88.14.6\nalex@pve-host:~$" },
  // GUIDE W3 map-vmbr2-physical-nic | SEED W3 sp-w3-connect-s7
  { k: "ip -br link show", on: "host", explain: "Identify the second physical NIC by name. Cross-check against the Week-1 NIC inventory \u2014 do not guess which port is which.", sample: "lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>\neno1             UP             2c:f0:5d:11:8a:41 <BROADCAST,MULTICAST,UP,LOWER_UP>\neno2             UP             2c:f0:5d:11:8a:42 <BROADCAST,MULTICAST,UP,LOWER_UP>\nvmbr0            UP             2c:f0:5d:11:8a:41 <BROADCAST,MULTICAST,UP,LOWER_UP>\nvmbr1            UP             b8:1f:2c:44:9e:07 <BROADCAST,MULTICAST,UP,LOWER_UP>\nvmbr2            UP             6e:3a:d0:95:12:bb <BROADCAST,MULTICAST,UP,LOWER_UP>\n...\ntailscale0       UNKNOWN        <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP>" },
  // GUIDE W3 map-vmbr2-physical-nic | SEED W3 sp-w3-connect-s7
  { k: "cp /etc/network/interfaces /etc/network/interfaces.bak-prephys", on: "host", explain: "Back up again: this change can take the private zone offline if you get it wrong.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 map-vmbr2-physical-nic | SEED W3 sp-w3-connect-s7
  { k: "nano /etc/network/interfaces", on: "host", explain: "Make the two edits above. Two devices holding 192.168.0.1 is a duplicate-address outage, not redundancy.", sample: "[nano opens the file; the student moves bridge-ports for vmbr2 from none to eno2 and deletes the address/netmask lines that gave vmbr2 192.168.0.1, so the Cisco router owns that address alone, then saves with Ctrl+O and exits with Ctrl+X]", backupOf: "/etc/network/interfaces" },
  // GUIDE W3 map-vmbr2-physical-nic | SEED W3 sp-w3-connect-s7
  { k: "bridge link show | grep vmbr2", on: "host", explain: "The physical NIC must now appear as a member of vmbr2.", sample: "4: eno2: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master vmbr2 state forwarding priority 32 cost 4" },
  // GUIDE W2 create-linuxsrv-vm | GUIDE W3 map-vmbr2-physical-nic | GUIDE W3 prove-connectivity | SEED W3 sp-w3-connect-s7
  { k: "ping -c 4 192.168.0.1", on: "linuxsrv", explain: "From linuxsrv. The gateway must still answer \u2014 but now it is the Cisco router answering, not the Proxmox host.", sample: "PING 192.168.0.1 (192.168.0.1) 56(84) bytes of data.\n64 bytes from 192.168.0.1: icmp_seq=1 ttl=255 time=1.02 ms\n64 bytes from 192.168.0.1: icmp_seq=2 ttl=255 time=0.981 ms\n...\n--- 192.168.0.1 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3004ms\nrtt min/avg/max/mdev = 0.981/1.043/1.118/0.052 ms" },
  // GUIDE W3 map-vmbr2-physical-nic | SEED W3 sp-w3-connect-s7
  { k: "ping -c 4 8.8.8.8", on: "linuxsrv", explain: "From linuxsrv. This is the point of the phase: the private-zone servers now reach the internet through the Cisco router.", sample: "PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.\n64 bytes from 8.8.8.8: icmp_seq=1 ttl=116 time=11.4 ms\n64 bytes from 8.8.8.8: icmp_seq=2 ttl=116 time=10.9 ms\n...\n--- 8.8.8.8 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3005ms\nrtt min/avg/max/mdev = 10.902/11.208/11.612/0.271 ms" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s1
  { k: "sudo apt update && sudo apt install openssh-server -y", on: "websrv", explain: "Skip if you selected OpenSSH during the Ubuntu install; harmless either way.", sample: "Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nGet:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]\n...\nReading package lists... Done\nBuilding dependency tree... Done\nopenssh-server is already the newest version (1:9.6p1-3ubuntu13.5).\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded." },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s1
  { k: "sudo systemctl enable --now ssh", on: "websrv", explain: "Enables at boot and starts it.", sample: "Synchronizing state of ssh.service with SysV service script with /usr/lib/systemd/systemd-sysv-install.\nExecuting: /usr/lib/systemd/systemd-sysv-install enable ssh\nCreated symlink /etc/systemd/system/sshd.service \u2192 /usr/lib/systemd/system/ssh.service.\nCreated symlink /etc/systemd/system/multi-user.target.wants/ssh.service \u2192 /usr/lib/systemd/system/ssh.service." },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s1
  { k: "sudo adduser webadmin", on: "websrv", explain: "Creates the non-root administrative user and prompts for its password. Pick your own name and record it \u2014 this becomes your only way in.", sample: "info: Adding new group `webadmin' (1001) ...\ninfo: Adding new user `webadmin' (1001) with group `webadmin (1001)' ...\ninfo: Creating home directory `/home/webadmin' ...\nNew password: [type a password \u2014 nothing appears as you type]\nRetype new password: [type the same password again]\npasswd: password updated successfully\nChanging the user information for webadmin\n\tFull Name []: [press Enter through all five fields, then y to confirm]" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s1
  { k: "sudo usermod -aG sudo webadmin", on: "websrv", explain: "Gives the new user sudo. Log out and prove it works before going any further.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W4 harden-dmz-web-host | GUIDE W4 harden-proxmox-host-access | SEED W4 sp-w4-secure-s1 | SEED W4 sp-w4-secure-s7
  { k: "sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak", on: "host", explain: "Back up before editing.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s1
  { k: "sudo sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/; s/^#\\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config", on: "websrv", explain: "Sets both directives and uncomments them if they were commented. Editing by hand with nano is equally fine.", sample: "(no output \u2014 it returns straight to the prompt)", backupOf: "/etc/ssh/sshd_config" },
  // GUIDE W4 harden-dmz-web-host | GUIDE W4 harden-proxmox-host-access | SEED W4 sp-w4-secure-s1 | SEED W4 sp-w4-secure-s7
  { k: "grep -E '^(PermitRootLogin|PasswordAuthentication)' /etc/ssh/sshd_config", on: "host", explain: "Read back exactly what you set.", sample: "PermitRootLogin no\nPasswordAuthentication yes" },
  // GUIDE W4 harden-dmz-web-host | GUIDE W4 harden-proxmox-host-access | SEED W4 sp-w4-secure-s1
  { k: "sudo sshd -t", on: "websrv", explain: "Validates the config \u2014 silence means valid. Never restart sshd on a config that has not passed this.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W4 harden-dmz-web-host | GUIDE W4 harden-proxmox-host-access | SEED W4 sp-w4-secure-s1
  { k: "sudo systemctl restart ssh", on: "websrv", explain: "Applies the change. Keep your existing session open and prove a new one works before closing it.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2 | SEED W4 sp-w4-secure-s2b
  { k: "sudo ufw allow from 10.10.0.0/16 to any port 22 proto tcp", on: "linuxsrv", explain: "SSH from the campus LAN \u2014 the whole 10.10.0.0/16 supernet, not a single /24.", sample: "Rule added" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2
  { k: "sudo ufw allow from 192.168.0.0/24 to any port 22 proto tcp", on: "linuxsrv", explain: "SSH from the private zone.", sample: "Rule added" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2
  { k: "sudo ufw allow from 172.16.0.0/24 to any port 22 proto tcp", on: "websrv", explain: "SSH from within the DMZ itself.", sample: "Rule added" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2
  { k: "sudo ufw allow from 172.16.0.1 to any port 22 proto tcp", on: "websrv", explain: "The host's own DMZ address on its own line. The /24 covers it, but the allow-list should say the hypervisor may always get in.", sample: "Rule added" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2
  { k: "sudo ufw allow 80/tcp", on: "websrv", explain: "The website is public-facing, so port 80 is open to everyone \u2014 unlike SSH, which is restricted to the networks above.", sample: "Rule added\nRule added (v6)" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2
  { k: "sudo ufw allow 443/tcp", on: "websrv", explain: "The TLS port the host has published since Week 3. Until now it was published with nobody listening; the next two lines fix that.", sample: "Rule added\nRule added (v6)" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2
  { k: "sudo ufw enable", on: "websrv", explain: "It warns that this may disrupt existing SSH connections. You have already allowed SSH from all three networks, so answer y.", sample: "Command may disrupt existing ssh connections. Proceed with operation (y|n)? [answer y]\nFirewall is active and enabled on system startup", backupOf: "the firewall on this machine" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-lnx-s1 | SEED W4 sp-w4-secure-s2
  { k: "sudo ufw status numbered", on: "websrv", explain: "Read the whole ruleset back and screenshot it for the Server Bring-Up Log.", sample: "Status: active\n\n     To                         Action      From\n     --                         ------      ----\n[ 1] 22/tcp                     ALLOW IN    10.10.0.0/16\n[ 2] 22/tcp                     ALLOW IN    192.168.0.0/24\n[ 3] 22/tcp                     ALLOW IN    172.16.0.0/24\n[ 4] 22/tcp                     ALLOW IN    172.16.0.1\n[ 5] 80/tcp                     ALLOW IN    Anywhere\n[ 6] 443/tcp                    ALLOW IN    Anywhere\n..." },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2
  { k: "sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/websrv.key -out /etc/ssl/certs/websrv.crt -subj \"/CN=websrv\"", on: "websrv", explain: "A self-signed certificate. Browsers will warn \u2014 there is no public CA in this lab \u2014 but the traffic is encrypted, and the warning is the lesson.", sample: ".+..+.+..+....+..+....+...+.....+...+.+..+.......+..+....+........+.+..\n....+...+..+.+......+...+.....+....+......+..+.+........+....+...+.....\n-----" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2
  { k: "sudo tee /etc/nginx/sites-available/default > /dev/null <<'EOF' server { listen 80 default_server; listen 443 ssl default_server; ssl_certificate /etc/ssl/certs/websrv.crt; ssl_certificate_key /etc/ssl/private/websrv.key; root /var/www/html; index index.html; server_name _; location / { try_files $uri $uri/ =404; } } EOF sudo nginx -t && sudo systemctl reload nginx", on: "websrv", explain: "One server block, both ports, one document root. nginx -t validates before the reload \u2014 never reload a config that has not passed.", sample: "nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\nnginx: configuration file /etc/nginx/nginx.conf test is successful", backupOf: "/etc/nginx/sites-available/default" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2
  { k: "curl -kI https://10.10.30.T", on: "websrv", explain: "From a campus workstation. -k accepts the self-signed certificate; HTTP/1.1 200 OK means the 443 forward now reaches a listener.", sample: "HTTP/1.1 200 OK\nServer: nginx/1.24.0 (Ubuntu)\nDate: Mon, 09 Mar 2026 15:42:07 GMT\nContent-Type: text/html\nContent-Length: 612\nLast-Modified: Mon, 02 Mar 2026 18:11:55 GMT\nConnection: keep-alive\nAccept-Ranges: bytes" },
  // SEED W4 sp-w4-lnx-s1 | SEED W4 sp-w4-secure-s2b
  { k: "sudo ufw default deny incoming && sudo ufw default allow outgoing", on: "linuxsrv", explain: "Do this FIRST. Until the default is deny, every allow rule you add is describing what was already permitted.", sample: "Default incoming policy changed to 'deny'\n(be sure to update your rules accordingly)\nDefault outgoing policy changed to 'allow'\n(be sure to update your rules accordingly)", backupOf: "the firewall on this machine" },
  // SEED W4 sp-w4-secure-s2b
  { k: "sudo adduser dbadmin && sudo usermod -aG sudo dbadmin", on: "linuxsrv", explain: "The non-root admin. Log in as it and run one sudo command BEFORE disabling root \u2014 this account becomes your only way in.", sample: "info: Adding new group `dbadmin' (1001) ...\ninfo: Adding new user `dbadmin' (1001) with group `dbadmin (1001)' ...\ninfo: Creating home directory `/home/dbadmin' ...\nNew password: [type a password \u2014 nothing appears as you type]\nRetype new password: [type the same password again]\npasswd: password updated successfully\nChanging the user information for dbadmin\n\tFull Name []: [press Enter through all five fields, then y \u2014 usermod then prints nothing]" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2b
  { k: "sudo ufw allow from 192.168.0.1 to any port 22 proto tcp", on: "linuxsrv", explain: "The host's own address on the private bridge, so the hypervisor can always SSH in \u2014 the same line websrv got.", sample: "Rule added" },
  // SEED W4 sp-w4-secure-s2b
  { k: "sudo ufw enable && sudo ufw status verbose", on: "linuxsrv", explain: "Read it back. The line that matters is \"Default: deny (incoming)\" \u2014 without it the rest is decoration.", sample: "Command may disrupt existing ssh connections. Proceed with operation (y|n)? [answer y]\nFirewall is active and enabled on system startup\nStatus: active\nLogging: on (low)\nDefault: deny (incoming), allow (outgoing), disabled (routed)\nNew profiles: skip\n\nTo                         Action      From\n--                         ------      ----\n22/tcp                     ALLOW IN    10.10.0.0/16\n...", backupOf: "the firewall on this machine" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s2b
  { k: "ssh dbadmin@192.168.0.3", on: "host", explain: "From a tailnet laptop with subnet routes, or from the host: the hardened path still works. Do this before you close the console.", sample: "The authenticity of host '192.168.0.3 (192.168.0.3)' can't be established.\nED25519 key fingerprint is SHA256:9pQ1x0h2mWZ5r3kL8vTnCj4bYdQ7sXeR0aFuK2gN1oM.\nAre you sure you want to continue connecting (yes/no/[fingerprint])? [type yes]\ndbadmin@192.168.0.3's password: [type the password you set \u2014 nothing appears as you type]\nWelcome to Ubuntu 24.04.3 LTS (GNU/Linux 6.8.0-84-generic x86_64)\n...\nLast login: Mon Mar  9 10:14:22 2026 from 192.168.0.1" },
  // SEED W4 sp-w4-secure-s2c
  { k: "New-ADUser -Name \"winadmin\" -SamAccountName \"winadmin\" -UserPrincipalName \"winadmin@team1.local\" -AccountPassword (Read-Host -AsSecureString \"New password\") -Enabled $true", on: "winserver", explain: "The named administrative account. Pick your own name and your team's domain, and record both \u2014 this becomes how you sign in.", sample: "New password: [type the password and press Enter \u2014 it shows as asterisks; New-ADUser itself prints nothing]" },
  // SEED W4 sp-w4-secure-s2c
  { k: "Add-ADGroupMember -Identity \"Domain Admins\" -Members \"winadmin\"", on: "winserver", explain: "Gives it the rights. Sign out, sign back in as this account and confirm it works BEFORE you stop using the built-in Administrator.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W4 sp-w4-secure-s2c
  { k: "Get-NetFirewallProfile | Select-Object Name, Enabled", on: "winserver", explain: "Read the three profiles back. Every one must say True.", sample: "Name    Enabled\n----    -------\nDomain     True\nPrivate    True\nPublic     True" },
  // SEED W4 sp-w4-secure-s2c
  { k: "Set-NetFirewallProfile -Profile Domain,Private,Public -Enabled True", on: "winserver", explain: "Turns back on any profile something switched off. Run it even if all three already read True \u2014 it is idempotent.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W4 sp-w4-secure-s2c
  { k: "Set-NetFirewallRule -DisplayName \"Remote Desktop - User Mode (TCP-In)\" -RemoteAddress 192.168.0.0/24", on: "winserver", explain: "Restricts RDP to the private zone. The rule stays enabled; what changes is who is allowed to use it.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W4 sp-w4-secure-s2c
  { k: "Get-NetFirewallRule -DisplayName \"Remote Desktop - User Mode (TCP-In)\" | Get-NetFirewallAddressFilter", on: "winserver", explain: "Reads the restriction back. RemoteAddress must show the private subnet, not Any.", sample: "LocalAddress  : Any\nRemoteAddress : 192.168.0.0/24" },
  // SEED W4 sp-w4-secure-s2d
  { k: "systemctl list-unit-files --state=enabled > baseline/linuxsrv-services-wk4.txt", on: "host", explain: "The same capture as Week 2, into a new file so the reference survives.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W4 sp-w4-secure-s2d
  { k: "diff baseline/linuxsrv-services.txt baseline/linuxsrv-services-wk4.txt", on: "host", explain: "What changed. No output means nothing changed \u2014 which after a hardening week is itself worth knowing.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W4 sp-w4-secure-s2d
  { k: "sha256sum -c baseline/SHA256SUMS", on: "host", explain: "Confirms the Week 2 reference files have not themselves been edited since you took them.", sample: "baseline/linuxsrv-services.txt: OK\nbaseline/interfaces.txt: OK\nbaseline/nat-rules.txt: OK\nbaseline/winserver-roles.txt: OK" },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s3
  { k: "qm list", on: "host", explain: "Lists every VM with its ID, name and state \u2014 you need the IDs for the next command.", sample: "      VMID NAME                 STATUS     MEM(MB)    BOOTDISK(GB) PID\n       100 websrv               running    2048              32.00 1423\n       101 winserver            running    4096              60.00 1587\n       102 linuxsrv             running    2048              32.00 1702" },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s3
  { k: "qm snapshot 101 pre-patch-2026-03-09 --description \"Pre-patch rollback point\"", on: "host", explain: "Substitute the real VM ID and today's date. Repeat for every VM.", sample: "snapshotting 'drive-scsi0' (local-lvm:vm-101-disk-0)\n  Logical volume \"snap_vm-101-disk-0_pre-patch-2026-03-09\" created." },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s3
  { k: "qm listsnapshot 101", on: "host", explain: "Confirm the snapshot exists before patching. An unverified rollback is not a rollback.", sample: "`-> pre-patch-2026-03-09          2026-03-09 09:12:44     Pre-patch rollback point\n    `-> current                                              You are here!" },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s4
  { k: "apt update && apt dist-upgrade -y", on: "host", explain: "On the Proxmox host itself. The hypervisor is the machine everything else depends on.", sample: "Hit:1 http://ftp.debian.org/debian bookworm InRelease\nGet:2 http://security.debian.org bookworm-security InRelease [48.0 kB]\nHit:3 http://download.proxmox.com/debian/pve bookworm InRelease\n...\nThe following packages will be upgraded:\n  proxmox-kernel-6.8 pve-manager pve-qemu-kvm qemu-server\n4 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n...\nSetting up pve-manager (8.2.7) ..." },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s4
  { k: "pveversion -v | head -n 3", on: "host", explain: "Records the new hypervisor version for the Operations Log & SOPs.", sample: "proxmox-ve: 8.2.0 (running kernel: 6.8.12-2-pve)\npve-manager: 8.2.7 (running version: 8.2.7/3e0176e6bb2ade3b)\nproxmox-kernel-helper: 8.1.0" },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s4
  { k: "sudo apt update && sudo apt full-upgrade -y", on: "websrv", explain: "On websrv and linuxsrv. full-upgrade removes packages when a dependency change requires it, which is what you want on a maintained server.", sample: "Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nGet:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]\n...\nThe following packages will be upgraded:\n  linux-image-generic nginx nginx-common openssl\n4 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.\n...\nSetting up nginx (1.24.0-2ubuntu7.3) ..." },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s4
  { k: "sudo apt autoremove --purge -y && [ -f /var/run/reboot-required ] && sudo reboot", on: "host", explain: "Cleans up, then reboots only if the update actually needs it \u2014 a kernel update, typically.", sample: "Reading package lists... Done\nBuilding dependency tree... Done\nThe following packages will be REMOVED:\n  linux-image-6.8.0-79-generic* linux-modules-6.8.0-79-generic*\n0 upgraded, 0 newly installed, 2 to remove and 0 not upgraded.\nAfter this operation, 412 MB disk space will be freed.\n...\nConnection to 172.16.0.10 closed by remote host." },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s4
  { k: "lsb_release -d && uname -r", on: "host", explain: "On each Ubuntu host after the reboot: distribution and kernel version for the Operations Log & SOPs.", sample: "Description:\tUbuntu 24.04.3 LTS\n6.8.0-84-generic" },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s5
  { k: "Install-Module PSWindowsUpdate -Force -Scope AllUsers", on: "winserver", explain: "In an elevated PowerShell. If the module cannot be reached, use sconfig option 6 or the Settings GUI instead.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s5
  { k: "Get-WindowsUpdate -Install -AcceptAll -AutoReboot", on: "winserver", explain: "Applies every available update and reboots if required.", sample: "X ComputerName Result     KB          Size Title\n- ------------ ------     --          ---- -----\n1 WINSERVER    Accepted   KB5044284  68MB  2026-03 Cumulative Update for Microsoft server operating sys...\n1 WINSERVER    Downloaded KB5044284  68MB  2026-03 Cumulative Update for Microsoft server operating sys...\n2 WINSERVER    Installed  KB5044284  68MB  2026-03 Cumulative Update for Microsoft server operating sys...\n2 WINSERVER    Installed  KB2267602  142MB Security Intelligence Update for Microsoft Defender Antivi..." },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s5 | SEED W4 sp-w4-win-s1
  { k: "Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 5", on: "winserver", explain: "Lists what actually landed, for the Operations Log & SOPs.", sample: "Source        Description      HotFixID      InstalledBy          InstalledOn\n------        -----------      --------      -----------          -----------\nWINSERVER     Update           KB5044284     NT AUTHORITY\\SYSTEM   3/9/2026 12:00:00 AM\nWINSERVER     Security Update  KB5043935     NT AUTHORITY\\SYSTEM   2/11/2026 12:00:00 AM\nWINSERVER     Update           KB5041578     NT AUTHORITY\\SYSTEM   1/14/2026 12:00:00 AM\nWINSERVER     Security Update  KB5039891     NT AUTHORITY\\SYSTEM   12/10/2025 12:00:00 AM\nWINSERVER     Update           KB5037423     NT AUTHORITY\\SYSTEM   11/12/2025 12:00:00 AM" },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s5
  { k: "systemctl status nginx --no-pager", on: "websrv", explain: "On websrv. NGINX must still be running after the update \u2014 that check is the point of patching with a rollback.", sample: "\u25cf nginx.service - A high performance web server and a reverse proxy server\n     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)\n     Active: active (running) since Sun 2026-03-08 21:14:03 UTC; 3min ago" },
  { k: "systemctl status mariadb --no-pager", on: "linuxsrv", explain: "The same check on linuxsrv. A service that did not come back after a patch is what the snapshot is for.", sample: "\u25cf mariadb.service - MariaDB 10.11.6 database server\n     Loaded: loaded (/lib/systemd/system/mariadb.service; enabled; preset: enabled)\n     Active: active (running) since Sun 2026-03-08 21:15:41 UTC; 2min ago" },  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s5
  { k: "Get-Service NTDS, DNS, DHCPServer | Select-Object Name, Status", on: "winserver", explain: "On winserver: all three roles must read Running after the reboot.", sample: "Name       Status\n----       ------\nNTDS       Running\nDNS        Running\nDHCPServer Running" },
  // GUIDE W4 snapshot-and-patch | SEED W4 sp-w4-secure-s5
  { k: "qm rollback 101 pre-patch-2026-03-09", on: "host", explain: "ONLY if an update broke something. The VM must be stopped first \u2014 this is why the snapshot came before the patch.", sample: "rollback snapshot\n  Logical volume \"vm-101-disk-0\" successfully removed.\n  Logical volume \"vm-101-disk-0\" created." },
  // GUIDE W4 harden-proxmox-host-access | SEED W4 sp-w4-secure-s7
  { k: "sudo sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config", on: "host", explain: "prohibit-password, not no: root keeps a key-only emergency route, and the root password stops working over the network.", sample: "(no output \u2014 it returns straight to the prompt)", backupOf: "/etc/ssh/sshd_config" },
  // GUIDE W4 harden-dmz-web-host | SEED W4 sp-w4-secure-s7
  { k: "sudo sshd -t && sudo systemctl restart ssh", on: "linuxsrv", explain: "Validate, then apply. Silence from sshd -t means the file is good.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W4 sp-w4-dr-s0
  { k: "cat /etc/pve/jobs.cfg", on: "host", explain: "The job as Proxmox stored it. If this file has no vzdump entry, the job was not saved.", sample: "vzdump: backup-7f3c9a21-4e8b\n\tschedule sun 02:00\n\tcompress zstd\n\tenabled 1\n\tmailnotification failure\n\tmode snapshot\n\tstorage local\n\tvmid 100,101,102" },
  // SEED W4 sp-w4-dr-s0
  { k: "ls -lh /var/lib/vz/dump/", on: "host", explain: "The archives themselves. Sizes in the hundreds of MB or more mean real data; a few KB means it backed up nothing.", sample: "total 18G\n-rw-r--r-- 1 root root 2.1G Mar  8 02:04 vzdump-qemu-100-2026_03_08-02_00_03.vma.zst\n-rw-r--r-- 1 root root  742 Mar  8 02:04 vzdump-qemu-100-2026_03_08-02_00_03.log\n-rw-r--r-- 1 root root  11G Mar  8 02:31 vzdump-qemu-101-2026_03_08-02_04_11.vma.zst\n-rw-r--r-- 1 root root  751 Mar  8 02:31 vzdump-qemu-101-2026_03_08-02_04_11.log\n-rw-r--r-- 1 root root 4.6G Mar  8 02:47 vzdump-qemu-102-2026_03_08-02_31_52.vma.zst\n-rw-r--r-- 1 root root  748 Mar  8 02:47 vzdump-qemu-102-2026_03_08-02_31_52.log" },
  // GUIDE W4 timed-restore-test | SEED W4 sp-w4-dr-s2
  { k: "date +%T", on: "linuxsrv", explain: "The start of your measured recovery window.", sample: "09:41:07" },
  // GUIDE W4 timed-restore-test | SEED W4 sp-w4-dr-s2
  { k: "sudo mysql -e \"DROP DATABASE capstone_db;\"", on: "linuxsrv", explain: "The deliberate failure, on the machine you are about to roll back. Substitute whatever your DR plan names \u2014 as long as it is on this VM.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W4 timed-restore-test | SEED W4 sp-w4-dr-s2
  { k: "qm stop 102", on: "host", explain: "On the Proxmox host, substituting the linuxsrv VM ID. A VM must be stopped before it can be rolled back.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W4 timed-restore-test | SEED W4 sp-w4-dr-s2
  { k: "qm rollback 102 pre-patch-2026-03-09", on: "host", explain: "Restores that same VM to the snapshot. Substitute your own snapshot name from qm listsnapshot.", sample: "rollback snapshot\n  Logical volume \"vm-102-disk-0\" successfully removed.\n  Logical volume \"vm-102-disk-0\" created." },
  // GUIDE W4 timed-restore-test | SEED W4 sp-w4-dr-s2
  { k: "qm start 102 && qm status 102", on: "host", explain: "Bring it back up and confirm it is running.", sample: "status: running" },
  // SEED W2 sp-w2-net-s1
  { k: "ip -brief link", on: "host", explain: "Every interface and whether it is UP. The physical NICs are the enpXsY names.", sample: "lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>\nenp3s0           UP             bc:24:11:4a:7c:00 <BROADCAST,MULTICAST,UP,LOWER_UP>\nenp4s0           DOWN           bc:24:11:4a:7c:01 <NO-CARRIER,BROADCAST,MULTICAST,UP>\nvmbr0            UP             bc:24:11:4a:7c:00 <BROADCAST,MULTICAST,UP,LOWER_UP>\nvmbr1            UP             be:24:11:4a:7c:41 <BROADCAST,MULTICAST,UP,LOWER_UP>\nvmbr2            UP             9e:07:5a:12:b8:cd <BROADCAST,MULTICAST,UP,LOWER_UP>\n..." },
  // SEED W2 sp-w2-net-s1
  { k: "bridge link show", on: "host", explain: "Which physical port is enslaved to which bridge \u2014 this is the mapping you are documenting.", sample: "2: enp3s0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master vmbr0 state forwarding priority 32 cost 4\n7: tap100i0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master vmbr1 state forwarding priority 32 cost 100\n8: tap101i0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master vmbr2 state forwarding priority 32 cost 100\n9: tap102i0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 master vmbr2 state forwarding priority 32 cost 100" },
  // SEED W3 sp-w3-net-s1
  { k: "ip route", on: "host", explain: "How this host decides where to send a packet. The default route is the last resort, not the first.", sample: "default via 172.16.0.1 dev ens18 proto static\n172.16.0.0/24 dev ens18 proto kernel scope link src 172.16.0.10" },
  // SEED W3 sp-w3-net-s1
  { k: "sudo iptables -t nat -L PREROUTING -n --line-numbers", on: "host", explain: "Every port published from outside \u2014 three here, all to websrv: 80, 443, 2200. Name why each exists, and which one has nobody listening yet.", sample: "Chain PREROUTING (policy ACCEPT)\nnum  target     prot opt source               destination         \n1    DNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:80 to:172.16.0.10:80\n2    DNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:443 to:172.16.0.10:443\n3    DNAT       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:2200 to:172.16.0.10:22" },
  // SEED W3 sp-w3-net-s1
  { k: "sudo iptables -L FORWARD -n -v", on: "host", explain: "The policy is DROP, so every ACCEPT above it is a decision. The DMZ-to-private lines should be exactly DNS and the database, and nothing else.", sample: "Chain FORWARD (policy DROP 24 packets, 1440 bytes)\n pkts bytes target     prot opt in     out     source               destination         \n   46  3128 ACCEPT     udp  --  vmbr1  vmbr2   172.16.0.0/24        192.168.0.2          udp dpt:53\n    2   120 ACCEPT     tcp  --  vmbr1  vmbr2   172.16.0.0/24        192.168.0.2          tcp dpt:53\n    8   480 ACCEPT     tcp  --  vmbr1  vmbr2   172.16.0.0/24        192.168.0.3          tcp dpt:3306\n   19  1596 ACCEPT     all  --  vmbr2  vmbr1   192.168.0.0/24       172.16.0.0/24       \n...\n   24  1440 LOG        all  --  *      *       0.0.0.0/0            0.0.0.0/0            limit: avg 5/min burst 5 LOG flags 0 level 4 prefix \"FWD-DROP \"" },
  // SEED W3 sp-w3-net-s1 | SEED W4 sp-w4-lnx-s1
  { k: "sudo ss -tulpn", on: "host", explain: "Everything listening on this host. Compare it against what you published: they are not the same list.", sample: "Netid State  Recv-Q Send-Q    Local Address:Port  Peer Address:Port Process\nudp   UNCONN 0      0         127.0.0.53%lo:53         0.0.0.0:*     users:((\"systemd-resolve\",pid=612,fd=14))\ntcp   LISTEN 0      4096      127.0.0.53%lo:53         0.0.0.0:*     users:((\"systemd-resolve\",pid=612,fd=15))\ntcp   LISTEN 0      511             0.0.0.0:80         0.0.0.0:*     users:((\"nginx\",pid=1041,fd=6))\ntcp   LISTEN 0      128             0.0.0.0:22         0.0.0.0:*     users:((\"sshd\",pid=889,fd=3))\ntcp   LISTEN 0      511                [::]:80            [::]:*     users:((\"nginx\",pid=1041,fd=7))\ntcp   LISTEN 0      128                [::]:22            [::]:*     users:((\"sshd\",pid=889,fd=4))" },
  // SEED W4 sp-w4-net-s1
  { k: "sudo cp /etc/iptables/rules.v4 baseline/nat-rules.txt", on: "host", explain: "The rules in the form the host restores them from \u2014 the file is the source, so copy the file rather than dumping the live rules.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W4 sp-w4-net-s1
  { k: "sudo cp /etc/network/interfaces baseline/interfaces.txt", on: "host", explain: "The bridge definitions. These two files are the network half of your baseline.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W2 sp-w2-win-s1
  { k: "Get-WindowsFeature | Where-Object Installed | Out-File baseline\\winserver-roles.txt", on: "winserver", explain: "Every installed role. Anything here you cannot justify is attack surface you chose.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W2 sp-w2-win-s1
  { k: "Get-Service | Where-Object Status -eq Running | Out-File baseline\\winserver-services.txt", on: "winserver", explain: "What is actually running, as opposed to what is installed.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W2 sp-w2-win-s1
  { k: "Get-FileHash baseline\\winserver-roles.txt", on: "winserver", explain: "The hash goes in the Baselines form \u2014 it proves the file has not been edited since.", sample: "Algorithm       Hash                                                             Path\n---------       ----                                                             ----\nSHA256          9F2C4A1E7B3D5068A1C4E9F0B27D8A5341CC6E90B7F2A18D4E3C05B9A6F71D28C C:\\Users\\Administrator\\baseline\\winserver-roles.txt" },
  // SEED W3 sp-w3-win-s1
  { k: "Get-ADDefaultDomainPasswordPolicy", on: "winserver", explain: "What the domain enforces TODAY, before you change anything. Record it as the starting point.", sample: "ComplexityEnabled           : True\nDistinguishedName           : DC=team1,DC=local\nLockoutDuration             : 00:30:00\nLockoutObservationWindow    : 00:30:00\nLockoutThreshold            : 0\nMaxPasswordAge              : 42.00:00:00\nMinPasswordLength           : 7\n..." },
  // SEED W3 sp-w3-win-s1
  { k: "Set-ADDefaultDomainPasswordPolicy -Identity $env:USERDNSDOMAIN -MinPasswordLength 14 -LockoutThreshold 5 -LockoutDuration 00:15:00", on: "winserver", explain: "Fourteen characters and a lockout after five failures. Write the numbers you chose into the policy table.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W3 sp-w3-win-s1
  { k: "Get-DhcpServerv4Scope | Format-List Name,StartRange,EndRange,SubnetMask", on: "winserver", explain: "The scope as configured. It must match the range you reserved in the IP plan, not overlap your static addresses.", sample: "Name       : Private Zone\nStartRange : 192.168.0.100\nEndRange   : 192.168.0.199\nSubnetMask : 255.255.255.0" },
  // SEED W4 sp-w4-win-s1
  { k: "Get-WindowsFeature | Where-Object Installed | Out-File baseline\\winserver-roles-after.txt", on: "winserver", explain: "Capture again after patching, so you can diff against the Week 2 file.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W4 sp-w4-win-s1
  { k: "Compare-Object (Get-Content baseline\\winserver-roles.txt) (Get-Content baseline\\winserver-roles-after.txt)", on: "winserver", explain: "The drift. An empty result is the good answer; anything else is a change nobody logged.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W1 sp-w1-lnx-s1
  { k: "lscpu | grep -i -e \"model name\" -e virtualization", on: "host", explain: "The CPU and whether VT-x/AMD-V is exposed. Absent here means it is off in the BIOS, not missing from the chip.", sample: "  Model name:                         Intel(R) Xeon(R) Silver 4210 CPU @ 2.20GHz\nVirtualization features:\n  Virtualization:                     VT-x" },
  // SEED W1 sp-w1-lnx-s1
  { k: "lspci -nnk | grep -iA3 -e raid -e ethernet", on: "host", explain: "The \"Kernel driver in use\" line is the whole answer: no driver, no support.", sample: "01:00.0 Ethernet controller [0200]: Broadcom Inc. and subsidiaries NetXtreme BCM5720 Gigabit Ethernet PCIe [14e4:165f]\n\tSubsystem: Dell Device [1028:1f5b]\n\tKernel driver in use: tg3\n\tKernel modules: tg3\n--\n18:00.0 RAID bus controller [0104]: Broadcom / LSI MegaRAID SAS-3 3108 [Invader] [1000:005d] (rev 02)\n\tSubsystem: Dell PERC H730P Mini [1028:1f47]\n\tKernel driver in use: megaraid_sas\n..." },
  // SEED W2 sp-w2-lnx-s1
  { k: "systemctl list-unit-files --state=enabled > baseline/linuxsrv-services.txt", on: "host", explain: "Everything set to start at boot. Read it \u2014 services you did not install are the interesting ones.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W2 sp-w2-lnx-s1
  { k: "qm config 101 > baseline/vm-101.txt", on: "host", explain: "A VM's full definition: disks, memory, bridges. This is what you would need to rebuild it exactly.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W2 sp-w2-lnx-s1
  { k: "sha256sum baseline/*.txt > baseline/SHA256SUMS", on: "host", explain: "One hash file for the whole set \u2014 the line you paste into the Baselines form.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // SEED W3 sp-w3-lnx-s1
  { k: "sudo netplan get", on: "host", explain: "The configuration as netplan understands it \u2014 clearer than reading the YAML by eye.", sample: "network:\n  ethernets:\n    ens18:\n      addresses:\n      - \"172.16.0.10/24\"\n      nameservers:\n        addresses:\n        - 192.168.0.2\n..." },
  // SEED W3 sp-w3-lnx-s1
  { k: "ip -brief a && ip route | grep default", on: "host", explain: "What the interface actually holds right now, and where its traffic leaves.", sample: "lo               UNKNOWN        127.0.0.1/8 ::1/128\nens18            UP             172.16.0.10/24 fe80::be24:11ff:fe6a:3c19/64\ndefault via 172.16.0.1 dev ens18 proto static" },
  // GUIDE W1 tailscale-remote-access
  { k: "chronyc tracking", on: "laptop", explain: "Confirms the host is really synchronised to a time source rather than merely holding a plausible-looking clock. Correct the time before continuing if it is not.", sample: "Reference ID    : 0A0A0A01 (ntp.its.lan)\nStratum         : 3\nRef time (UTC)  : Tue Sep 15 15:49:02 2026\nSystem time     : 0.000021453 seconds slow of NTP time\nLast offset     : -0.000009812 seconds\nRMS offset      : 0.000114287 seconds\n...\nLeap status     : Normal" },
  // GUIDE W1 tailscale-remote-access
  { k: "tailscale status", on: "laptop", explain: "Every device in the tailnet and whether it is online. pve-host must be listed here before you go home and try it.", sample: "100.101.42.17   pve-host             team1@       linux   -\n100.88.14.203   alex-laptop          team1@       windows active; direct 10.10.30.44:41641, tx 8124 rx 5620\n100.72.130.66   jordan-laptop        team1@       macOS   idle, tx 1180 rx 940" },
  // GUIDE W1 tailscale-remote-access
  { k: "ssh root@pve-host", on: "laptop", explain: "With MagicDNS on, the machine answers to its name from any device in the tailnet, so nobody has to keep a 100.x address written down. https://pve-host:8006 reaches the console the same way.", sample: "Linux pve-host 6.8.12-1-pve #1 SMP PREEMPT_DYNAMIC PMX 6.8.12-1 x86_64\n\nThe programs included with the Debian GNU/Linux system are free software;\n...\nLast login: Tue Sep 15 09:02:11 2026 from 100.88.14.203\nroot@pve-host:~#" },
  // GUIDE W1 tailscale-remote-access
  { k: "tar -czf /root/pve-config-backup.tar.gz -C / etc/pve etc/network/interfaces etc/hosts etc/hostname var/lib/tailscale/tailscaled.state", on: "laptop", explain: "Backs up the host configuration together with the Tailscale identity. Without that state file a rebuilt host is a brand-new device that has to be authorised into the tailnet again.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W1 team-accounts-shared-host
  { k: "ssh-keygen -t ed25519 -C \"alex@capstone\"", on: "host", explain: "Run this on YOUR OWN laptop, not on the server. It makes a key pair: a private half that never leaves your machine and a public half you are about to hand to the host. Give it a passphrase.", sample: "Generating public/private ed25519 key pair.\nEnter file in which to save the key (/home/alex/.ssh/id_ed25519): [press Enter to accept the default]\nEnter passphrase for \"/home/alex/.ssh/id_ed25519\" (empty for no passphrase): [type a passphrase, nothing appears as you type]\nEnter same passphrase again: [type the same passphrase again]\nYour identification has been saved in /home/alex/.ssh/id_ed25519\nYour public key has been saved in /home/alex/.ssh/id_ed25519.pub\nThe key fingerprint is:\nSHA256:7bQ2xR9vKmT4pLzYcN1dHfAe5uWjG8oXqB3tVsC6nEk alex@capstone" },
  // GUIDE W1 team-accounts-shared-host
  { k: "ssh-copy-id alex@<tailscale-ip>", on: "laptop", explain: "Also from your laptop, over the tailnet. It appends your public key to that account's authorized_keys on the host, asking for the password one last time.", sample: "/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: \"/home/alex/.ssh/id_ed25519.pub\"\n/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed\n/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys\nalex@100.101.42.17's password: [type the account password one last time]\n\nNumber of key(s) added: 1\n\nNow try logging into the machine, with:   \"ssh 'alex@100.101.42.17'\"" },
  // GUIDE W2 deploy-nginx-website
  { k: "curl http://172.16.0.10", on: "host", explain: "Again from the Proxmox host. Confirm your own welcome text comes back in the body, not the NGINX default page. Screenshot this \u2014 it is the evidence for the Server Bring-Up Log.", sample: "<html><body><h1>Welcome to the Team X capstone website</h1></body></html>" },
  // GUIDE W2 winserver-dns | GUIDE W3 prove-connectivity
  { k: "nslookup winserver.team1.local 192.168.0.2", on: "winserver", explain: "Query the server explicitly. Must return 192.168.0.2.", sample: "Server:  winserver.team1.local\nAddress:  192.168.0.2\n\nName:    winserver.team1.local\nAddress:  192.168.0.2" },
  // GUIDE W2 linuxsrv-mariadb
  { k: "sudo mysql -e \"CREATE USER 'capuser'@'172.16.0.10' IDENTIFIED BY 'ChangeThisPassword1!'; GRANT ALL PRIVILEGES ON capstone_db.* TO 'capuser'@'172.16.0.10'; FLUSH PRIVILEGES;\"", on: "websrv", explain: "OPTIONAL \u2014 only if a VM of your own or a dynamic site on websrv needs the database across zones. Also bind MariaDB to the private address in 50-server.cnf. The base build does not need this.", sample: "(no output \u2014 it returns straight to the prompt)" },
  // GUIDE W3 static-routes-reverse
  { k: "ping -c 4 172.16.0.10", on: "linuxsrv", explain: "From linuxsrv. Proves the private zone can now initiate to the DMZ web host.", sample: "PING 172.16.0.10 (172.16.0.10) 56(84) bytes of data.\n64 bytes from 172.16.0.10: icmp_seq=1 ttl=63 time=0.501 ms\n64 bytes from 172.16.0.10: icmp_seq=2 ttl=63 time=0.478 ms\n...\n--- 172.16.0.10 ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss, time 3041ms\nrtt min/avg/max/mdev = 0.478/0.512/0.559/0.031 ms" },
  // GUIDE W3 prove-connectivity
  { k: "ping 192.168.0.3", on: "winserver", explain: "From winserver, in PowerShell. Windows to Linux across the private zone.", sample: "Pinging 192.168.0.3 with 32 bytes of data:\nReply from 192.168.0.3: bytes=32 time<1ms TTL=64\nReply from 192.168.0.3: bytes=32 time<1ms TTL=64\n...\nPing statistics for 192.168.0.3:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\nApproximate round trip times in milli-seconds:\n    Minimum = 0ms, Maximum = 0ms, Average = 0ms" },
  // GUIDE W4 harden-dmz-web-host
  { k: "sudo adduser dbadmin", on: "linuxsrv", explain: "On linuxsrv. Pick your own name, record it in the Bring-Up Log, give it sudo with usermod -aG sudo dbadmin, and test it from the console BEFORE you disable root.", sample: "info: Adding new group `dbadmin' (1001) ...\ninfo: Adding new user `dbadmin' (1001) with group `dbadmin (1001)' ...\ninfo: Creating home directory `/home/dbadmin' ...\nNew password: [type a password \u2014 nothing appears as you type]\nRetype new password: [type the same password again]\npasswd: password updated successfully\nChanging the user information for dbadmin\n\tFull Name []: [press Enter through all five fields, then y to confirm]" },
  // GUIDE W4 harden-dmz-web-host
  { k: "sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak && sudo sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && grep -E '^PermitRootLogin' /etc/ssh/sshd_config", on: "linuxsrv", explain: "Back up, set the directive, read it straight back. Same edit as websrv.", sample: "PermitRootLogin no" },
  // GUIDE W4 harden-dmz-web-host
  { k: "sudo ufw enable && sudo ufw status numbered", on: "linuxsrv", explain: "Turn it on and read the whole ruleset back. Screenshot it for the Server Bring-Up Log.", sample: "Command may disrupt existing ssh connections. Proceed with operation (y|n)? [answer y]\nFirewall is active and enabled on system startup\nStatus: active\n\n     To                         Action      From\n     --                         ------      ----\n[ 1] 22/tcp                     ALLOW IN    10.10.0.0/16\n[ 2] 80/tcp                     ALLOW IN    Anywhere\n[ 3] 443/tcp                    ALLOW IN    Anywhere\n...", backupOf: "the firewall on this machine" },
];

/** Whitespace-insensitive, so a reflowed heredoc still matches. */
const norm = (c: string) => c.replace(/\s+/g, ' ').trim();

const BY_CMD = new Map<string, CommandDetail>(COMMANDS.map((c) => [norm(c.k), c]));

/** The registry entry for a command, or undefined for one outside the base build. */
export function detailFor(cmd: string): CommandDetail | undefined {
  return BY_CMD.get(norm(cmd));
}

type AnyCommand = { cmd: string; explain?: string; on?: string; sample?: string; backupOf?: string };

/**
 * Fill one command from the registry.
 *
 * Anything the call site authored wins, so a step that genuinely needs its own
 * wording for a shared command can still say so — the registry is the default,
 * not a straitjacket.
 */
export function fillCommand<T extends AnyCommand>(c: T): T {
  const d = detailFor(c.cmd);
  if (!d) return c;
  return {
    ...c,
    on: c.on ?? d.on,
    explain: c.explain ?? d.explain,
    sample: c.sample ?? d.sample,
    ...(d.backupOf && !c.backupOf ? { backupOf: d.backupOf } : {}),
  };
}

/** Fill every command of every step of every task. Used on the course seed. */
export function withCommandDetail<T extends { tasks: { steps: { commands?: AnyCommand[] }[] }[] }>(course: T): T {
  return {
    ...course,
    tasks: course.tasks.map((t) => ({
      ...t,
      steps: t.steps.map((s) => (s.commands ? { ...s, commands: s.commands.map(fillCommand) } : s)),
    })),
  };
}

/** Fill every command step of every procedure. Used on the configuration guide. */
export function withProcedureDetail<T extends { steps: { cmd?: string; explain?: string; on?: string; sample?: string; backupOf?: string }[] }>(
  procedures: T[]
): T[] {
  return procedures.map((p) => ({
    ...p,
    steps: p.steps.map((s) => {
      if (!s.cmd) return s;
      const d = detailFor(s.cmd);
      if (!d) return s;
      return {
        ...s,
        on: s.on ?? d.on,
        explain: s.explain || d.explain,
        sample: s.sample ?? d.sample,
        ...(d.backupOf && !s.backupOf ? { backupOf: d.backupOf } : {}),
      };
    }),
  }));
}

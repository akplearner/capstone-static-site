// Plain-language definitions for the jargon a non-technical student meets in the
// course. Kept deliberately short (one sentence, no new jargon) because each is
// shown in a hover tooltip. Keyed by the exact term as it appears in prose; the
// matcher below is case-insensitive and boundary-aware, and wraps only the FIRST
// occurrence in a block so explanatory text isn't peppered with tooltips.

export const GLOSSARY: Record<string, string> = {
  'data.src_ip': 'The Wazuh search field holding the source address of a network (Suricata) alert — who the traffic came from.',
  'data.srcip': 'The Wazuh search field holding the source address of a host alert (logins, web requests). Its network twin is data.src_ip — search both.',
  'ossec.conf': "The Wazuh agent's config file. It names the SOC to report to and any extra log files to ship.",
  hydra: 'A password-guessing tool. In this lab you run it against your own pod so the SOC has a brute-force attack to detect.',
  tcpdump: 'A command-line tool that records network traffic to a .pcap file you can open in Wireshark.',
  Wireshark: 'A traffic viewer. Open a .pcap in it and "Follow HTTP Stream" to read the exact request an attacker sent.',
  Kali: 'The attacker machine in your lab — a Linux build that ships with nmap, nikto, hydra and the rest.',
  Proxmox: 'A hypervisor — an operating system whose job is to run virtual machines. In Server+ you install it on your own server; in the CySA lab it already runs the lab.',
  // ── Server+ bench vocabulary ──────────────────────────────────────────────
  // The 70-odd terms above are SOC/CySA words; almost none can fire on a
  // build-and-document course, which left the glossary inert there. These are
  // the bench terms a Server+ beginner actually stalls on — chosen from the
  // words that appear a handful of times each, NOT the ones on every screen
  // (RAID and hypervisor appear in 30 strings apiece; wrapping those would put
  // an ⓘ in every paragraph, which is the clutter this course just removed).
  POST: 'Power-On Self-Test — the hardware check a machine runs the moment you power it on, before any operating system. Beeps and blink codes are POST talking to you.',
  DIMM: 'A memory stick. Which slots they go in is dictated by the motherboard manual, and the wrong slots can stop the machine starting at all.',
  ECC: 'Error-Correcting Code memory — server RAM that detects and fixes single-bit corruption on the fly. Servers use it; desktops usually do not.',
  HCL: 'Hardware Compatibility List — the check that the software you plan to run officially supports the exact hardware you have, before you build on it.',
  UEFI: 'The modern replacement for the old BIOS firmware. Boot mode matters: an OS installed under UEFI will not boot if the firmware is later switched to legacy.',
  IOMMU: 'The chip feature (Intel VT-d / AMD-Vi) that lets a virtual machine be handed a real piece of hardware, like a NIC, as its own.',
  'VT-x': 'Intel\u2019s virtualization extensions. Present is not enough — they must be ENABLED in firmware setup, or the hypervisor cannot start a single VM.',
  'stripe size': 'How large a chunk of data a RAID array writes to one disk before moving to the next. The default is right for this build.',
  IDS: 'Intrusion Detection System — software that watches traffic and raises an alert when it matches a known attack pattern. Suricata is yours.',
  NVD: 'National Vulnerability Database — the public catalogue you search to find a CVE and its score for a given software version.',
  pod: 'Your team\u2019s pair of machines: one Ubuntu web server and one Windows PC.',
  escalate: 'Pass an alert on for deeper investigation, with the reason written down, instead of closing it yourself.',
  SOC: 'Security Operations Centre — the team (and dashboard) that watches for attacks around the clock.',
  SIEM: 'Security Information and Event Management — software that gathers logs from everywhere and raises alerts. Wazuh is your SIEM.',
  IOC: 'Indicator of Compromise — a clue an attacker leaves behind, like a bad IP address, file name, or hash.',
  CVE: 'Common Vulnerabilities and Exposures — a public ID for one specific known software flaw, e.g. CVE-2021-41773.',
  CVSS: 'A 0–10 score for how severe a vulnerability is, so you can rank what to fix first.',
  pcap: "A 'packet capture' — a saved recording of network traffic you can open in Wireshark.",
  SQLi: "SQL injection — tricking a website into running database commands it shouldn't, often to steal data.",
  WAF: 'Web Application Firewall — a filter in front of a website that blocks common attacks like SQL injection.',
  'POA&M': 'Plan of Action & Milestones — a to-do list for fixing findings: what, who owns it, and by when.',
  PTES: 'Penetration Testing Execution Standard — the agreed steps of a pentest: recon, scan, exploit, report.',
  STRIDE: 'A checklist of threat types: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.',
  NIC: "Network Interface Card — a machine's network connection. On these VMs it's usually named ens18.",
  FIM: 'File Integrity Monitoring — watching key files for unexpected changes.',
  SCA: "Security Configuration Assessment — checking a machine's settings against a hardening benchmark.",
  'Rules of Engagement': "The written agreement of what you're allowed to test, and when.",
  RoE: "Rules of Engagement — the written agreement of what you're allowed to test, and when.",
  triage: 'Quickly sorting alerts into real vs noise and deciding what to escalate — like an ER nurse.',
  baseline: "A record of what 'normal' looks like, so you can spot what's abnormal later.",
  'chain of custody': 'A documented trail of who handled each piece of evidence and when — so it holds up as proof.',
  agent: 'A small program installed on each machine that ships its logs to the SOC.',
  gate: 'A checkpoint at the end of a week — finish its required work before the next week unlocks.',
  'eve.json': 'The file where Suricata writes its network alerts.',
  subnet: 'A slice of a network sharing an address range, e.g. 10.10.100.x.',
  Wazuh: 'The free, open-source SIEM/SOC platform this lab is built on.',
  Suricata: 'An open-source network intrusion detector that watches traffic and raises alerts.',
  Sysmon: 'A Windows tool that records detailed activity — processes, connections, file changes.',
  DVWA: 'Damn Vulnerable Web App — a deliberately insecure web app used as a safe attack target.',
  nmap: 'A scanner that finds open ports and what software is running on them.',
  nikto: 'A scanner that checks a web server for known issues.',
  'MITRE ATT&CK': 'A public catalogue of attacker techniques, used to describe how an attack was carried out.',
  MTTD: 'Mean Time To Detect — the average time from an attack starting to it being noticed.',
  MTTR: 'Mean Time To Respond — the average time from detecting an attack to containing it.',
  'rule.level': 'Wazuh scores every alert 0–15 by severity; searching rule.level:>=7 keeps the ones that usually matter.',
  'rule.groups': 'The category tags Wazuh puts on an alert (e.g. authentication_failed, ids, web) — handy for filtering by attack type.',
  'agent.name': 'The Wazuh field naming which machine an alert came from (e.g. Team07-ubuntu) — use it to filter to one host.',
  'event channel': 'A named Windows log stream — Sysmon writes to Microsoft-Windows-Sysmon/Operational, which the agent forwards.',
  'Emerging Threats ruleset': "The community alert rules Suricata downloads with suricata-update — without them it sees traffic but raises nothing.",
  DQL: 'Dashboard Query Language — the field:value search syntax in the Wazuh/OpenSearch search bar (e.g. data.src_ip:10.10.30.7).',
  Discover: 'The Wazuh/OpenSearch view that lists raw events in a table you can search, add columns to, and save.',
  'time picker': 'The date/time control (top-right) that sets which window of events you see — the #1 reason a correct search looks empty.',
  visualization: 'A saved chart (bar, pie, table) built from a search — the building block you drop onto a dashboard.',
  dashboard: 'A saved page of visualizations and searches you assemble to watch at a glance.',
  'rule.description': 'The Wazuh field holding the human-readable name of the rule that fired — useful to group and count alerts by.',
  syscheck: 'Wazuh’s File Integrity Monitoring engine; its events carry syscheck.path and whether a file was added/modified/deleted.',
  sensor: 'A program on a machine that watches activity and reports it to the SOC — your Wazuh agent, Suricata and Sysmon are all sensors.',
  endpoint: 'Any individual computer on the network — a laptop, server or VM — as opposed to the network gear between them.',
  telemetry: 'The stream of activity data a machine sends about itself — processes, logins, connections — that the SOC watches.',
  hash: 'A short fingerprint calculated from a file; change one byte and the fingerprint changes, so it proves the file was not tampered with.',
  hashing: 'Running a file through a formula to get its fixed-length fingerprint (its hash).',
  'SHA-256': 'A widely trusted hashing method that turns any file into a 64-character fingerprint.',
  'false positive': 'An alert that turned out to be harmless — the tool flagged something that was not actually an attack.',
  'true positive': 'An alert that was real — the flagged activity really was malicious.',
  enroll: 'To register a machine with the SOC so its agent starts sending logs.',
  'brute force': 'Guessing a password by automatically trying huge numbers of combinations until one works.',
  'port scan': 'Probing a machine to list which network ports are open, to discover what services it is running.',
  SSH: 'Secure Shell — a way to log in to and run commands on another machine over the network, from your terminal.',
  pivot: 'To follow a clue (like an IP or username) from one log into related events, tracing an attacker’s movements.',
  hardening: 'Making a machine harder to attack by closing unused services, fixing weak settings and applying updates.',
  containment: 'Stopping an attack from spreading — e.g. isolating the affected machine — once you have detected it.',
  vulnerability: 'A weakness in software or configuration that an attacker could exploit.',
  vuln: 'Short for vulnerability — a weakness an attacker could exploit.',
  firewall: 'A filter that allows or blocks network connections by rule, to keep unwanted traffic out.',
  ufw: 'Uncomplicated Firewall — the simple command-line firewall on Ubuntu (e.g. ufw allow 22).',
};

export interface TermMatch {
  term: string; // the term as written in the source text (original casing)
  definition: string;
  start: number;
  end: number;
}

// Longest terms first so multi-word terms (e.g. "chain of custody", "MITRE ATT&CK")
// claim their span before a shorter term inside them can.
const TERMS = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

const isBoundary = (ch: string | undefined): boolean => ch === undefined || !/[A-Za-z0-9]/.test(ch);

/**
 * Find the first, non-overlapping occurrence of each known glossary term in `text`.
 * Case-insensitive, but only matches whole tokens (won't flag "soc" inside
 * "associate"). Returns matches sorted by position for easy wrapping.
 */
export function findTerms(text: string): TermMatch[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const taken = new Array(text.length).fill(false);
  const matches: TermMatch[] = [];
  for (const term of TERMS) {
    const needle = term.toLowerCase();
    let idx = lower.indexOf(needle);
    while (idx !== -1) {
      const end = idx + needle.length;
      const boundaryOk = isBoundary(text[idx - 1]) && isBoundary(text[end]);
      let overlap = false;
      for (let i = idx; i < end; i++) if (taken[i]) { overlap = true; break; }
      if (boundaryOk && !overlap) {
        for (let i = idx; i < end; i++) taken[i] = true;
        matches.push({ term: text.slice(idx, end), definition: GLOSSARY[term], start: idx, end });
        break; // first occurrence per term only
      }
      idx = lower.indexOf(needle, idx + 1);
    }
  }
  return matches.sort((a, b) => a.start - b.start);
}

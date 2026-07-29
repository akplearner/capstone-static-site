// Plain-language definitions for the jargon a non-technical student meets in the
// course. Kept deliberately short (one sentence, no new jargon) because each is
// shown in a hover tooltip. Keyed by the exact term as it appears in prose; the
// matcher below is case-insensitive and boundary-aware, and wraps only the FIRST
// occurrence in a block so explanatory text isn't peppered with tooltips.

export const GLOSSARY: Record<string, string> = {
  SOC: 'Security Operations Centre — the team (and dashboard) that watches for attacks around the clock.',
  SIEM: 'Security Information and Event Management — software that gathers logs from everywhere and raises alerts. Wazuh is your SIEM.',
  IOC: 'Indicator of Compromise — a clue an attacker leaves behind, like a bad IP address, file name, or hash.',
  IoC: 'Indicator of Compromise — a clue an attacker leaves behind, like a bad IP address, file name, or hash.',
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
  'event channel': 'A named Windows log stream — Sysmon writes to Microsoft-Windows-Sysmon/Operational, which the agent forwards.',
  'Emerging Threats ruleset': "The community alert rules Suricata downloads with suricata-update — without them it sees traffic but raises nothing.",
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

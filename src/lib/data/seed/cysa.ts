import { Course, Gate, RoleDef, Task, WeekDef } from '../../types';

// CySA+ SOC Capstone (CS0-003) — a 4-week Security Operations simulation built on a
// Wazuh SOC. Three tiers rotate: Tier 1 SOC Analyst, Tier 2 Threat Hunter, Tier 3
// Incident Responder. The lab is one flat 10.10.0.0/16 network: a shared Wazuh SOC
// at 10.10.100.100, and each team's pod = Ubuntu+DVWA+Suricata (<UBUNTU_IP>) and
// Windows 11+Sysmon (<WINDOWS_IP>). Ids stay red/blue/grc for helper compatibility;
// names/colors/icons carry the tier identity.

const roles: RoleDef[] = [
  {
    id: 'blue',
    name: 'SOC Analyst',
    mission: 'Watch the alerts — decide what is real, what is noise, and what to escalate.',
    color: '#1f5aa8',
    icon: 'Eye',
    label: '🖥️ SOC Analyst',
  },
  {
    id: 'grc',
    name: 'Threat Hunter',
    mission: 'Dig into the suspicious activity in logs and packets, and prove what happened.',
    color: '#0d9488',
    icon: 'Search',
    label: '🔎 Threat Hunter',
  },
  {
    id: 'red',
    name: 'Incident Responder',
    mission: 'Stop the attack, keep the evidence clean, and write the report leadership reads.',
    color: '#b22222',
    icon: 'ShieldAlert',
    label: '🛡️ Incident Responder',
  },
];

/**
 * The expedition arc.
 *
 * `stage` is the cut of the Capstone Stone each week produces, and `phase` is
 * the verb shown above the week title. The default Quarry arc is shaped for a
 * course that builds an environment (Survey → Build → Integrate → Secure);
 * CySA+ is a security *operations* course, so it runs its own arc — you do not
 * "build & establish" a threat investigation. The shape is the same and it
 * still lands on Defend; only the wording matches the actual work.
 */
const weeks: WeekDef[] = [
  { number: 0, title: 'Lab setup: build the environment (optional)', theme: 'SETUP', objective: 'Stand up the Wazuh SOC and the team pods (instructor / builder).',
    setup: true, stage: 0, phase: 'Lab Setup', difficulty: 4, flow: ['Build SOC', 'Build pods', 'Clone', 'Hand out access'],
    milestone: 'Skip this unless you are building your own lab. Cleared when 10.10.100.100 loads and your pods are cloned.',
    plain: 'Setup week: get your bearings and your access. Like a new hire on day one — find your desk, log in, and learn who does what — before any real work starts.' },
  { number: 1, title: 'See everything: sensors & baseline', theme: 'DEPLOY', objective: 'Install the sensor you own, prove its events reach the SOC, then record what normal looks like.',
    stage: 1, phase: 'Deploy & Baseline', difficulty: 2, flow: ['Install your sensor', 'Enrol with the SOC', 'Prove the feed', 'Record normal'],
    milestone: 'The sensor you own is Active in the SOC, a fresh event from it arrives, and your Week-1 report is filled in.',
    plain: 'You turn on the security camera you are responsible for so the SOC can see it, then write down what a quiet, normal day looks like. Next week you can only spot “weird” because you wrote down “normal” now.' },
  { number: 2, title: 'Prove it: hunt & evidence', theme: 'DETECT', objective: 'Spot suspicious activity and prove what happened.',
    stage: 2, phase: 'Detect & Investigate', difficulty: 3, flow: ['Generate traffic', 'Triage alerts', 'Pivot on the source', 'Capture evidence'],
    milestone: 'You can name the attacker IP, what it did, and point at the alert and packet capture that prove it.',
    plain: 'Something looks off. This week you play detective: follow one suspicious visitor through the logs and network capture and prove exactly what they did — evidence, not a hunch.' },
  { number: 3, title: 'Close the gaps: vulns & risk', theme: 'ASSESS', objective: 'Find the weak spots and say which ones matter most.',
    stage: 3, phase: 'Assess & Harden', difficulty: 2, flow: ['Read the CVE list', 'Run the config check', 'Scan from Kali', 'Rank by risk'],
    milestone: 'Your findings are ranked by likelihood and impact, and the top item names its CVE and its fix.',
    plain: 'You check the building for unlocked doors and windows (weaknesses), then rank them — a wide-open front door matters more than a stiff window on the third floor. The output is a fix-it plan, ordered by real risk.' },
  { number: 4, title: 'Hold the line: respond & report', theme: 'RESPOND', objective: 'Handle a real attack: find it, prove it, stop it, report it.',
    stage: 4, phase: 'Respond & Report', difficulty: 3, flow: ['Contain', 'Build the timeline', 'Hash the evidence', 'Report & debrief'],
    milestone: 'The attacker is blocked, every artifact is hashed and logged, and the incident report has a start-to-finish timeline.',
    plain: 'The real thing happens. You detect the break-in, rebuild the timeline of what the attacker touched, stop them, keep the evidence clean, and write the short report a manager actually reads.' },
];

const gates: Gate[] = [
  {
    id: 1,
    week: 1,
    title: 'Monitoring live',
    description: 'Each role’s own sensor reports to the SOC, the baseline of "normal" is written, and coverage is validated.',
    requiredArtifactTypes: ['01_SOC_Monitoring_Report.md', '06_Coverage_Validation.md', '10_Sensor_Deployment_Record.md'],
    requiredTasks: ['cr-w1', 'cb-w1', 'cg-w1'],
    handoffs: [
      { from: 'red', to: 'blue', artifact: 'Windows lane live', label: 'Optional: compare the Windows and Ubuntu feeds' },
      { from: 'blue', to: 'grc', artifact: 'Baseline', label: 'Optional: share what normal looks like' },
    ],
  },
  {
    id: 2,
    week: 2,
    title: 'Threat proven',
    description: 'A suspicious activity is triaged, investigated in the packets, and turned into indicators.',
    requiredArtifactTypes: ['07_Alert_Triage_Report.md', '02_Threat_Investigation_Report.md', '05_IOC_Database.csv'],
    requiredTasks: ['cb-w2', 'cg-w2', 'cr-w2'],
    handoffs: [
      { from: 'blue', to: 'grc', artifact: 'Escalated alerts', label: 'Analyst → Hunter: the real alerts to chase' },
      { from: 'grc', to: 'red', artifact: 'Findings', label: 'Hunter → Responder: findings to index as IOCs' },
    ],
  },
  {
    id: 3,
    week: 3,
    title: 'Risk ranked',
    description: 'Each role finds weaknesses its own way — from the SOC, from a scan, and from public CVE data — and the findings are ranked into a fix plan.',
    requiredArtifactTypes: ['11_SOC_Findings_Record.md', '12_Scan_Validation_Report.md', '03_Vulnerability_Assessment.md'],
    requiredTasks: ['cb-w3', 'cg-w3', 'cr-w3'],
    handoffs: [
      { from: 'blue', to: 'red', artifact: 'SOC findings', label: 'Optional: the SOC’s vuln + SCA list gives the ranking more to work with' },
      { from: 'grc', to: 'red', artifact: 'Scan validation', label: 'Optional: a finding confirmed from outside ranks higher than one only inferred' },
    ],
  },
  {
    id: 4,
    week: 4,
    title: 'Incident closed & team debriefed',
    description: 'The attack is detected, its timeline rebuilt, contained, evidenced with hashes, and reported — then the team delivers the executive debrief and lessons learned.',
    requiredArtifactTypes: ['08_Detection_Record.md', '04_Incident_Response_Report.md', '09_Executive_Debrief.md'],
    requiredTasks: ['cb-w4', 'cg-w4', 'cr-w4', 'cg-w4b'],
    handoffs: [
      { from: 'blue', to: 'grc', artifact: 'Detection record', label: 'Analyst → Hunter: first alert + attacker IP' },
      { from: 'grc', to: 'red', artifact: 'Timeline', label: 'Hunter → Responder: the rebuilt attack timeline' },
      { from: 'red', to: 'grc', artifact: 'Incident report', label: 'Responder → Hunter: closed incident feeds the debrief' },
    ],
  },
];

const tasks: Task[] = [
  // ─────────────────────────── WEEK 0 · Lab & SOC build (builder) ───────────────────────────
  {
    id: 'cr-w0',
    difficulty: 4,
    role: 'red',
    week: 0,
    title: 'Environment build — Wazuh SOC + team pods (set up first)',
    objective: 'One-time server setup: stand up the shared SOC and the pod templates, then clone. This is the instructor / builder track — every step is optional. If your SOC is already running at 10.10.100.100, skip Week 0 and start at Week 1.',
    frameworks: ['NIST_CSF'],
    deliverables: [],
    estimatedTime: 'One-time setup (instructor / builder)',
    homeLabOnly: true,
    learn: ['Wazuh all-in-one install', 'Suricata on each server', 'Sysmon on Windows', 'cloning pods'],
    tools: ['Proxmox', 'Wazuh', 'Suricata', 'Sysmon', 'DVWA'],
    steps: [
      {
        id: 'cr-w0-s1',
        where: 'Proxmox web console',
        path: ['build', 'create + clone', 'soc'],
        title: 'Make the virtual machines in Proxmox',
        description: 'Create the SOC, one Ubuntu pod, one Windows pod, and Kali.',
        instruction: 'Set up the server side first. If the SOC already answers at https://10.10.100.100, you can skip all of Week 0. On the Proxmox web console, give each VM a static IP so addresses never change.',
        whatItMeans: 'These are the machines the whole capstone runs on. The SOC and the Ubuntu pods share the 10.10.100.x range — that is fine, the numbers do not overlap. With SOC access you need build nothing.',
        expectedOutput: 'Every VM boots and can reach the others (try ping 10.10.100.100 from a pod).',
        frameworks: ['NIST_CSF'],
        optional: true,
      },
      {
        id: 'cr-w0-s2',
        where: 'SOC VM (10.10.100.100), over SSH',
        path: ['build', 'run installer', 'soc'],
        title: 'Install the entire SOC with one command',
        description: 'Wazuh all-in-one on the SOC VM.',
        instruction: 'On the SOC VM (10.10.100.100), over SSH.',
        commands: [
          { cmd: 'sudo curl -sO https://packages.wazuh.com/4.14/wazuh-install.sh && sudo bash ./wazuh-install.sh -a', explain: 'Download the installer as root, then run it. The -a flag installs all three Wazuh parts (manager, indexer, dashboard) on this one machine.' },
        ],
        whatItMeans: 'One machine runs the whole SOC — no second network card, no ISO wizard.',
        expectedOutput: 'After a few minutes it prints a Summary box with a URL and an admin password. Copy that password now.',
        files: [
          { name: 'wazuh-install.sh (v4.14)', purpose: 'the all-in-one installer for manager + indexer + dashboard', source: 'sudo curl -sO https://packages.wazuh.com/4.14/wazuh-install.sh' },
          { name: 'Official Wazuh installation guide', purpose: 'the vendor’s step-by-step reference if anything differs on your version', source: 'https://documentation.wazuh.com/current/installation-guide/index.html' },
        ],
        troubleshooting: 'Installer exits early? It needs a fresh Ubuntu 22.04+ with ≥4 GB RAM and root. If it complains a component already exists, re-run with `-a -i` to ignore the existing-host check, or start from a clean VM.',
        frameworks: ['NIST_CSF'],
        optional: true,
      },
      {
        id: 'cr-w0-s3',
        where: 'SOC VM',
        path: ['build', 'read passwords', 'soc'],
        title: 'Save the admin password',
        description: 'Recover every generated password from the install bundle.',
        instruction: 'On the SOC VM.',
        commands: [
          { cmd: 'sudo tar -O -xvf wazuh-install-files.tar wazuh-install-files/wazuh-passwords.txt', explain: 'Every password lives in this file if you closed the terminal too soon.' },
        ],
        whatItMeans: 'You need the admin password to log in and to make student accounts.',
        expectedOutput: 'A list of users and passwords, including admin.',
        frameworks: ['NIST_CSF'],
        optional: true,
      },
      {
        id: 'cr-w0-s4',
        where: 'SOC VM',
        path: ['build', 'disable updates', 'soc'],
        title: 'Freeze the Wazuh version',
        description: 'Stop an apt upgrade from swapping in a new version mid-term.',
        instruction: 'On the SOC VM.',
        commands: [
          { cmd: 'sudo sed -i \'s/^deb /#deb /\' /etc/apt/sources.list.d/wazuh.list', explain: 'Comment out the Wazuh apt source.' },
          { cmd: 'sudo apt update', explain: 'Confirm it no longer lists a Wazuh repository.' },
        ],
        whatItMeans: 'Wazuh recommends turning off its update source after install so a routine upgrade cannot break your setup halfway through the course.',
        expectedOutput: 'apt update runs and no longer lists a Wazuh repository.',
        frameworks: ['NIST_CSF'],
        optional: true,
      },
      {
        id: 'cr-w0-s5',
        where: 'SOC VM',
        path: ['build', 'open ports + health check', 'soc'],
        title: 'Open the firewall ports, then check services are up',
        description: 'Let agents reach the SOC, then confirm it is healthy before adding them.',
        instruction: 'On the SOC VM. Open the ports agents use, then confirm the three services are running.',
        commands: [
          { cmd: 'sudo ufw allow 22/tcp', explain: 'Keep SSH open BEFORE enabling the firewall, so you do not lock yourself out.' },
          { cmd: 'sudo ufw allow 1514/tcp', explain: 'Agent data — how each machine sends its logs to the SOC.' },
          { cmd: 'sudo ufw allow 1515/tcp', explain: 'Agent enrolment — how a new agent registers the first time.' },
          { cmd: 'sudo ufw allow 443/tcp', explain: 'Dashboard — the web page you and the students log into.' },
          { cmd: 'sudo ufw --force enable', explain: 'Turn the firewall on (all machines should have UFW enabled).' },
          { cmd: 'sudo ufw reload', explain: 'Apply the new rules.' },
          { cmd: 'sudo systemctl status wazuh-manager wazuh-indexer wazuh-dashboard --no-pager', explain: 'All three should say active (running).' },
          { cmd: "sudo ss -lntp | grep -E '1514|1515|55000|443'", explain: 'Confirm the ports are listening. 55000 = the manager API (already open locally).' },
        ],
        whatItMeans: 'If a student agent will not connect later, it is almost always a closed port — open them here first, then check the services.',
        expectedOutput: `● wazuh-manager.service   Active: active (running)
● wazuh-indexer.service   Active: active (running)
● wazuh-dashboard.service Active: active (running)

$ sudo ss -lntp | grep -E '1514|1515|55000|443'
LISTEN 0  128  0.0.0.0:1514   0.0.0.0:*  users:(("wazuh-remoted"))
LISTEN 0  128  0.0.0.0:1515   0.0.0.0:*  users:(("wazuh-authd"))
LISTEN 0  128  0.0.0.0:443    0.0.0.0:*  users:(("node"))
LISTEN 0  128  0.0.0.0:55000   0.0.0.0:* users:(("wazuh-apid"))`,
        outputHighlights: [
          { text: 'active (running)', label: 'all three core services must read this. Any one showing "failed" means the SOC is not fully up, and student agents will fail to connect against it later.' },
          { text: '0.0.0.0:1514', label: 'the agent-data port, listening on all interfaces. If it is missing here, no machine can send logs in — the single most common reason an agent never appears.' },
          { text: '0.0.0.0:55000', label: 'the manager API. Wazuh binds this on all interfaces by default, so this is expected \u2014 it is why the SOC lives on an isolated lab network rather than the open internet.' },
        ],
        verify: ['active (running)'],
        frameworks: ['NIST_CSF'],
        optional: true,
      },
      {
        id: 'cr-w0-s6',
        where: 'The one Ubuntu template VM',
        path: ['build', 'install DVWA + Suricata', 'ubuntu'],
        title: 'Build the Ubuntu pod: DVWA + Suricata + a student login',
        description: 'The vulnerable web app, the network IDS, and the account analysts SSH into.',
        instruction: 'On the one Ubuntu template VM. Afterwards open http://<UBUNTU_IP>/dvwa/setup.php, click Create/Reset Database, and set DVWA Security = Low.',
        commands: [
          { cmd: 'sudo apt update' },
          { cmd: 'sudo apt install -y apache2 mariadb-server php php-mysqli php-gd git auditd suricata' },
          { cmd: 'sudo adduser student', explain: 'The account students SSH into.' },
          { cmd: 'cd /var/www/html && sudo git clone https://github.com/digininja/DVWA.git dvwa' },
          { cmd: 'sudo cp dvwa/config/config.inc.php.dist dvwa/config/config.inc.php' },
          { cmd: 'sudo chown -R www-data:www-data /var/www/html/dvwa' },
        ],
        whatItMeans: 'DVWA is the vulnerable web app the attacker targets; Suricata is the network intrusion detector.',
        expectedOutput: 'http://<UBUNTU_IP>/dvwa shows the DVWA login, and ls /var/log/suricata/eve.json shows the file exists.',
        files: [
          { name: 'DVWA (Damn Vulnerable Web App)', purpose: 'the vulnerable web app the attacker targets in Weeks 3–4', source: 'sudo git clone https://github.com/digininja/DVWA.git dvwa' },
          { name: 'config.inc.php', purpose: 'DVWA won’t load until you copy the sample config into place', source: 'sudo cp dvwa/config/config.inc.php.dist dvwa/config/config.inc.php' },
          { name: 'apache2 · mariadb · php · suricata', purpose: 'web server, database, PHP and the network IDS the pod needs', source: 'sudo apt install -y apache2 mariadb-server php php-mysqli php-gd git auditd suricata' },
        ],
        fixes: [
          { symptom: 'DVWA page blank, or "Unable to connect to database"?', fix: 'One of three things: you skipped the config copy, MariaDB is not running (sudo systemctl enable --now mariadb), or you have not run setup.php → Create/Reset Database yet.' },
          { symptom: 'Attacks in Weeks 3–4 do nothing?', fix: 'Set DVWA Security = Low. On any higher setting the exercises are blocked by design.' },
        ],
        frameworks: ['NIST_CSF'],
        optional: true,
      },
      {
        id: 'cr-w0-s7',
        where: 'The Ubuntu template VM',
        path: ['build', 'set capture NIC', 'ubuntu'],
        title: 'Point Suricata at the right network card',
        description: 'The #1 gotcha — Proxmox NICs are ens18, not eth0.',
        instruction: 'On the Ubuntu template VM.',
        commands: [
          { cmd: 'ip -br addr', explain: 'Find your card name — on Proxmox it is usually ens18.' },
          { cmd: "sudo sed -i 's/  - interface: eth0/  - interface: ens18/' /etc/suricata/suricata.yaml", explain: 'Swap ens18 if yours differs.' },
          { cmd: 'sudo suricata-update' },
          { cmd: 'sudo systemctl enable --now suricata' },
          { cmd: 'sudo systemctl restart suricata' },
        ],
        whatItMeans: 'Suricata sniffs one network card. Its default config says eth0 — if you skip this, Suricata runs but sees nothing.',
        expectedOutput: `$ ip -br addr
lo               UNKNOWN        127.0.0.1/8
ens18            UP             10.10.100.7/24

$ sudo systemctl status suricata --no-pager
     Active: active (running) since Wed 2026-08-05 08:40:03 UTC; 12s ago
     Notice: This is Suricata version 6.0.10 RELEASE running in SYSTEM mode`,
        outputHighlights: [
          { text: 'ens18            UP', label: 'the real network card, and the name Suricata must be told to watch. If the config still says eth0, Suricata runs but inspects nothing.' },
          { text: 'active (running)', label: 'the engine is up. Combined with the correct interface above, this is what makes alerts actually appear in eve.json.' },
          { text: 'SYSTEM mode', label: 'confirms it loaded a working config. A config error would drop it out of SYSTEM mode or refuse to start at all.' },
        ],
        verify: ['active (running)'],
        files: [
          { name: '/etc/suricata/suricata.yaml', purpose: 'the capture interface lives here — it must name your real NIC, not eth0', source: 'ip -br addr  # find your card (usually ens18 on Proxmox)' },
          { name: 'Emerging Threats ruleset', purpose: 'without rules Suricata sees traffic but raises no alerts', source: 'sudo suricata-update' },
        ],
        fixes: [
          { symptom: 'Suricata active but no alerts in eve.json?', fix: 'The interface is wrong — Proxmox NICs are ens18, not eth0. Confirm with `ip -br addr`, fix the `interface:` line in suricata.yaml, run `sudo suricata-update`, then restart.' },
          { symptom: 'Still nothing after fixing the interface?', fix: 'There is no traffic to inspect. Browse to DVWA to generate some, then look again.' },
        ],
        frameworks: ['NIST_CSF'],
        optional: true,
      },
      {
        id: 'cr-w0-s8',
        where: 'The Ubuntu template VM',
        path: ['ubuntu', 'forwards alerts', 'soc'],
        title: 'Forward Suricata + Apache logs to the SOC',
        description: 'Make the agent read Suricata\u2019s alert file and the web server\u2019s access log.',
        instruction: 'Add both blocks inside <ossec_config> in /var/ossec/etc/ossec.conf on the Ubuntu template, then restart the agent. The Apache block is what makes web-attack fields (data.url, web rule group) work in Week 2.',
        commands: [
          { cmd: '<localfile>\n  <log_format>json</log_format>\n  <location>/var/log/suricata/eve.json</location>\n</localfile>', explain: 'Ships Suricata\u2019s network alerts to the SOC.' },
          { cmd: '<localfile>\n  <log_format>apache</log_format>\n  <location>/var/log/apache2/access.log</location>\n</localfile>', explain: 'Ships DVWA/Apache requests so SQLi and other web attacks are decoded (data.url, rule.groups:web).' },
          { cmd: 'sudo systemctl restart wazuh-agent' },
        ],
        whatItMeans: 'Network attacks (Suricata) and web attacks (Apache) both show up in the same dashboard as everything else.',
        expectedOutput: 'After a Kali scan + a DVWA request, both Suricata alerts and Apache web-log alerts appear in the Wazuh dashboard within a minute.',
        frameworks: ['NIST_CSF'],
        optional: true,
      },
      {
        id: 'cr-w0-s8b',
        where: 'SOC VM + the Ubuntu template',
        path: ['build', 'enable modules', 'soc'],
        title: 'Turn on the modules Weeks 3–4 rely on (Vulnerability, SCA, FIM)',
        description: 'Make sure the panels students read in later weeks actually have data.',
        instruction: 'Two SOC-side settings, so the later weeks have data to work with.',
        instructionList: [
          'On the SOC, confirm Vulnerability detection and SCA are enabled in /var/ossec/etc/ossec.conf — on Wazuh 4.8+ both are on by default, so this is usually just a check.',
          'On the Ubuntu template, add a syscheck directory for the DVWA web root. This is what makes Week-4 file-change evidence possible.',
          'Restart the agent so the syscheck change takes effect.',
        ],
        commands: [
          { cmd: 'sudo grep -A2 "<vulnerability-detection>" /var/ossec/etc/ossec.conf', explain: 'On the SOC: confirm the block reads <enabled>yes</enabled> (default on 4.8+).' },
          { cmd: '<syscheck>\n  <directories check_all="yes" realtime="yes">/var/www/html/dvwa</directories>\n</syscheck>', explain: 'On the Ubuntu template: add this inside <ossec_config> so FIM watches the web root a Week-4 upload would change.' },
          { cmd: 'sudo systemctl restart wazuh-agent', explain: 'On the Ubuntu template: apply the syscheck change.' },
        ],
        whatItMeans: 'Week 3 reads the Vulnerabilities + SCA panels and Week 4 looks for a changed file in the web root — if these are off, those panels are empty and the steps have nothing to show.',
        expectedOutput: 'Vulnerabilities and SCA populate within a scan cycle; touching a file under /var/www/html/dvwa raises an Integrity monitoring alert.',
        files: [
          { name: 'Wazuh vulnerability detection (docs)', purpose: 'confirm/enable the CVE module on the manager', source: 'https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/index.html' },
          { name: 'Wazuh File Integrity Monitoring (docs)', purpose: 'the <syscheck> directory syntax for watching the web root', source: 'https://documentation.wazuh.com/current/user-manual/capabilities/file-integrity/index.html' },
        ],
        fixes: [
          { symptom: 'Vulnerabilities panel still empty after a cycle?', fix: 'It needs the indexer healthy and one full scan to have completed.' },
          { symptom: 'SCA panel still empty?', fix: 'It needs the OS policy present. That ships by default, so confirm the agent is Active first.' },
          { symptom: 'FIM not firing?', fix: 'Confirm the <syscheck> block is inside <ossec_config> and that the agent was restarted after the edit.' },
        ],
        frameworks: ['NIST_CSF'],
        optional: true,
      },
      {
        id: 'cr-w0-s9',
        where: 'The one Windows 11 template VM',
        path: ['build', 'install Sysmon', 'win'],
        title: 'Build the Windows pod: Sysmon + the agent',
        description: 'Rich Windows logging shipped to the SOC.',
        instruction: 'On the one Windows 11 template VM (PowerShell as Administrator). Put Sysmon64.exe and the SwiftOnSecurity sysmonconfig.xml in one folder, install Sysmon, then add the localfile block to ossec.conf.',
        commands: [
          { cmd: '.\\Sysmon64.exe -accepteula -i .\\sysmonconfig.xml', explain: 'Install Sysmon as a service using the config (run from the folder holding both files).' },
          { cmd: '<localfile>\n  <location>Microsoft-Windows-Sysmon/Operational</location>\n  <log_format>eventchannel</log_format>\n</localfile>', explain: 'Add inside <ossec_config> in C:\\Program Files (x86)\\ossec-agent\\ossec.conf — the agent then ships Sysmon\u2019s events to the SOC.' },
        ],
        whatItMeans: 'Sysmon records process starts, network connections, and file changes — far more than Windows logs on their own.',
        expectedOutput: 'Get-Service Sysmon shows Running, and its events show up under the agent later.',
        files: [
          { name: 'Sysmon (Sysinternals)', purpose: 'the rich Windows event source the agent forwards', source: 'https://learn.microsoft.com/sysinternals/downloads/sysmon' },
          { name: 'sysmonconfig.xml', purpose: 'a sane default config — Sysmon logs almost nothing without one', source: 'https://github.com/SwiftOnSecurity/sysmon-config' },
          { name: 'ossec.conf (agent)', purpose: 'add the Sysmon <localfile> block so events reach the SOC', source: 'C:\\Program Files (x86)\\ossec-agent\\ossec.conf' },
        ],
        troubleshooting: 'No Sysmon events at the SOC? Install with the config (`.\\Sysmon64.exe -accepteula -i sysmonconfig.xml`), confirm the “Sysmon” service is running, and make sure the <localfile> block was added to ossec.conf and the Wazuh agent restarted.',
        frameworks: ['NIST_CSF'],
        optional: true,
      },
      {
        id: 'cr-w0-s10',
        where: 'Proxmox + Kali',
        path: ['kali', 'attacks', 'ubuntu', 'alerts', 'soc'],
        title: 'Clone both pods ×16 and prep the attacks',
        description: 'One pod per team, plus the Week 3/4 attacks staged on Kali.',
        instruction: 'On Proxmox, set each clone\u2019s IP to its team number (Team 7 Ubuntu = 10.10.100.7, Windows = 10.10.20.7, Kali = 10.10.30.7). On Kali, stage the recon + incident.',
        commands: [
          { cmd: 'nmap -sV -p- 10.10.100.<#>', explain: 'Week 3 — the noisy scan students should detect.' },
          { cmd: 'nikto -h http://10.10.100.<#>', explain: 'Week 3 — web recon.' },
          { cmd: '# Week 4 — SQL injection on DVWA then a file upload; run it live and note the exact start time', explain: 'The incident students respond to.' },
        ],
        whatItMeans: 'You run the attacks so students stay on the defender\u2019s side.',
        expectedOutput: 'You can ping 10.10.100.1–16 and 10.10.20.1–16; running the Week 3 scan makes Suricata alerts appear within seconds.',
        frameworks: ['NIST_CSF'],
        optional: true,
      },
    ],
  },

  // Week-0 onboarding for the two student tiers (the build track above is the
  // instructor/builder's). No commands — just orientation so nobody starts Week 1 lost.
  {
    id: 'cb-w0',
    difficulty: 1,
    role: 'blue',
    week: 0,
    title: 'Get oriented — Tier 1 SOC Analyst',
    objective: 'Before Week 1: know your mission, get into the SOC, and know who you hand off to.',
    frameworks: ['NIST_CSF'],
    deliverables: [],
    estimatedTime: '20 min',
    learn: ['what a SOC analyst does', 'the weekly rhythm', 'who you work with'],
    tools: ['Wazuh dashboard'],
    definitionOfDone: ['You can log into the Wazuh dashboard', 'You can name what you hand to the Threat Hunter'],
    steps: [
      {
        id: 'cb-w0-s1',
        where: 'This course',
        title: 'Read the scope and rules of engagement',
        description: 'What the lab is, and what you are (and are not) allowed to do.',
        instruction: 'Read the course overview and the Rules of Engagement.',
        instructionList: [
          'You only ever work on your own team pod.',
          'You may safely test your OWN pod — for example scanning it in Week 2 to check your own detection.',
          'You never touch another team’s pod.',
        ],
        whatItMeans: 'Staying in scope is the ethics anchor of security work; it is graded as much as the technical steps.',
        expectedOutput: 'You can say in one sentence what your team is allowed to touch.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cb-w0-s2',
        where: 'The Wazuh dashboard',
        path: ['you', 'log in', 'soc'],
        title: 'Log into the SOC dashboard',
        description: 'Confirm you can reach the shared SOC in a browser.',
        instruction: 'Open https://10.10.100.100 in a browser and sign in — username student, password @Pass@2026 (your shared class login). The SOC is already set up and running.',
        whatItMeans: 'The dashboard is where you do almost all of your work — alerts, searches, and evidence all live here.',
        expectedOutput: 'The Wazuh dashboard loads and you can see the Security events view.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cb-w0-s3',
        where: 'This course',
        path: ['analyst', 'escalate', 'hunter'],
        title: 'Learn your role and hand-offs',
        description: 'Tier 1 watches the alerts and decides what to escalate.',
        instruction: 'Read your Tier 1 mission on the course overview: you triage alerts and escalate the real ones to the Threat Hunter (Tier 2). Note who your teammates are.',
        whatItMeans: 'Knowing the hand-off up front means your triage notes are written for the person who receives them.',
        expectedOutput: 'You can name what you send to the Hunter and what you get from the Responder.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'cg-w0',
    difficulty: 1,
    role: 'grc',
    week: 0,
    title: 'Get oriented — Tier 2 Threat Hunter',
    objective: 'Before Week 1: know your mission, get into the SOC, and know who feeds you work.',
    frameworks: ['NIST_CSF'],
    deliverables: [],
    estimatedTime: '20 min',
    learn: ['what a threat hunter does', 'the weekly rhythm', 'who you work with'],
    tools: ['Wazuh dashboard'],
    definitionOfDone: ['You can log into the Wazuh dashboard', 'You can name what the Analyst hands you and what you hand the Responder'],
    steps: [
      {
        id: 'cg-w0-s1',
        where: 'This course',
        title: 'Read the scope and rules of engagement',
        description: 'What the lab is, and what you are (and are not) allowed to do.',
        instruction: 'Read the course overview and the Rules of Engagement: you investigate your own team pod only, and you work from evidence, not guesses.',
        whatItMeans: 'Staying in scope is the ethics anchor of security work; it is graded as much as the technical steps.',
        expectedOutput: 'You can say in one sentence what your team is allowed to touch.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cg-w0-s2',
        where: 'The Wazuh dashboard',
        path: ['you', 'log in', 'soc'],
        title: 'Log into the SOC dashboard',
        description: 'Confirm you can reach the shared SOC in a browser.',
        instruction: 'Open https://10.10.100.100 in a browser and sign in — username student, password @Pass@2026 (your shared class login). The SOC is already set up and running.',
        whatItMeans: 'The dashboard and its search bar are where you pivot on a suspicious source to prove what happened.',
        expectedOutput: 'The Wazuh dashboard loads and you can use the search bar.',
        fixes: [
          { symptom: 'Browser says the connection is not private?', fix: 'Expected — the SOC uses a self-signed certificate. Click Advanced → Proceed (Chrome/Edge) or Advanced → Accept the Risk (Firefox). It is not a real problem on this lab network.' },
          { symptom: 'Page does not load at all?', fix: 'Check you typed https, not http. The dashboard does not answer on plain http.' },
        ],
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cg-w0-s3',
        where: 'This course',
        path: ['analyst', 'escalate', 'hunter'],
        title: 'Learn your role and hand-offs',
        description: 'Tier 2 investigates the alerts the Analyst escalates and proves what happened.',
        instruction: 'Read your Tier 2 mission on the course overview: the SOC Analyst escalates alerts to you; you investigate, prove it in the logs and packets, and hand findings to the Incident Responder (Tier 3).',
        whatItMeans: 'Your investigations are only as good as the alerts you receive — knowing the hand-off tells you what to ask the Analyst for.',
        expectedOutput: 'You can name what the Analyst hands you and what you hand the Responder.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },

  // ─────────────────────────── WEEK 1 · DEPLOY ───────────────────────────
  {
    id: 'cr-w1',
    difficulty: 3,
    role: 'red',
    week: 1,
    title: 'Deploy the Windows endpoint sensor',
    objective: 'Install Sysmon + the Wazuh agent on your Windows PC so its process and network activity reaches the SOC at 10.10.100.100.',
    frameworks: ['NIST_CSF'],
    deliverables: ['10_Sensor_Deployment_Record.md'],
    prerequisites: ['The SOC is up at https://10.10.100.100 (sign in: student / @Pass@2026)', 'Your Windows 11 PC already exists (the OS was set up for you)', 'You can sign in to Windows as an administrator', 'Your pod IPs (set them in the Lab access panel)'],
    estimatedTime: '70 min',
    learn: ['Sysmon (Windows telemetry)', 'Wazuh agent deployment', 'pointing a sensor at the SOC'],
    tools: ['Sysmon', 'Wazuh agent'],
    definitionOfDone: ['Sysmon is Running on Windows', 'The Wazuh agent is Active on Windows and points to 10.10.100.100', 'Sysmon events appear in the SOC for your Windows agent', 'Your Sensor Deployment Record is filled in'],
    handoff: [{ to: 'grc', artifact: 'Windows agent name', note: 'Optional: share your Windows agent name so a teammate can cross-check coverage \u2014 each role verifies its own lane independently.' }],
    steps: [
      {
        id: 'cr-w1-s1',
        where: 'Wazuh dashboard',
        path: ['dash', 'build command', 'you'],
        title: 'Find your SOC address (optional wizard)',
        description: 'Confirm the manager IP the agents report to: 10.10.100.100.',
        instruction: 'In the dashboard: Agents › Deploy new agent. (If you don\u2019t see Agents, look for Endpoints — the name varies by version.)',
        whatItMeans: 'The wizard fills in the SOC address and your team name for you — you don\u2019t figure anything out.',
        expectedOutput: 'The generated command contains 10.10.100.100 and your team name.',
        verify: ['10.10.100.100'],
        outputHighlights: [
          { text: '10.10.100.100', label: 'the SOC address baked into the install command \u2014 if this is missing or different, the agent installs but never reports' },
        ],
        walkthrough: {
          screen: 'deploy-agent',
          title: 'Deploy new agent \u2014 what the wizard is actually giving you',
          markers: [
            { n: 1, label: 'Agents \u2192 Deploy new agent. The wizard only writes a command for you; it does not touch the machine.' },
            { n: 2, label: 'Server address must be 10.10.100.100 \u2014 this is the value that ends up in the agent config.' },
            { n: 3, label: 'The generated command at the bottom. Copy this; it is what you run on the endpoint.' },
          ],
        },
        optional: true,
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cr-w1-s4',
        where: 'Your Windows 11 PC',
        path: ['you', 'install Sysmon', 'win', 'rich logging'],
        title: 'Install Sysmon on your Windows PC',
        description: 'Sysmon records process starts, network connections and file changes — far more than Windows logs on their own.',
        instruction: 'On your Windows 11 PC, open PowerShell as Administrator, then run the commands below in order.',
        instructionList: [
          'Make a wazuh-lab folder to work in.',
          'Download Sysmon and the SwiftOnSecurity config into it.',
          'Confirm both files arrived before you install.',
          'Install Sysmon using that config.',
          'Prefer clicking? The download links are in the guide box below — save both into the wazuh-lab folder, then run the install line.',
        ],
        commands: [
          { cmd: 'mkdir $HOME\\Downloads\\wazuh-lab; cd $HOME\\Downloads\\wazuh-lab', explain: 'Make and enter the lab folder — everything downloads here.' },
          { cmd: 'Invoke-WebRequest https://download.sysinternals.com/files/Sysmon.zip -OutFile Sysmon.zip; Expand-Archive Sysmon.zip -DestinationPath . -Force', explain: 'Download Sysmon straight from Microsoft and unzip it — this puts Sysmon64.exe in the folder.' },
          { cmd: 'Invoke-WebRequest https://raw.githubusercontent.com/SwiftOnSecurity/sysmon-config/master/sysmonconfig-export.xml -OutFile sysmonconfig.xml', explain: 'Download the SwiftOnSecurity config as sysmonconfig.xml — Sysmon logs almost nothing without one.' },
          { cmd: 'Get-ChildItem Sysmon64.exe, sysmonconfig.xml', explain: 'Confirm BOTH files are in the folder before you install. If either is missing, re-run its download line above.' },
          { cmd: '.\\Sysmon64.exe -accepteula -i .\\sysmonconfig.xml', explain: 'Install Sysmon as a service using the config. Run it from the folder (the leading .\\ is why it works even though Sysmon isn’t on PATH).' },
          { cmd: 'Get-Service Sysmon*', explain: 'Confirm the Sysmon service is installed and Running. Note the wildcard: installing the 64-bit binary registers the service as Sysmon64, so a bare `Get-Service Sysmon` reports "cannot find any service" even on a healthy install.' },
        ],
        whatItMeans: 'Sysmon is the rich Windows event source your agent will forward in the next step.',
        expectedOutput: `PS C:\\Users\\student\\Downloads\\wazuh-lab> Get-ChildItem Sysmon64.exe, sysmonconfig.xml

    Directory: C:\\Users\\student\\Downloads\\wazuh-lab

Mode      LastWriteTime       Length Name
----      -------------       ------ ----
-a---     8/5/2026   9:20 AM 4479456 Sysmon64.exe
-a---     8/5/2026   9:20 AM  131072 sysmonconfig.xml

PS C:\\Users\\student\\Downloads\\wazuh-lab> Get-Service Sysmon*

Status   Name       DisplayName
------   ----       -----------
Running  Sysmon64   Sysmon64`,
        outputHighlights: [
          { text: 'Sysmon64.exe', label: 'both files must be listed here before you install. A missing one means its download line failed — re-run it rather than pressing on.' },
          { text: 'Running', label: 'Sysmon is recording process starts, network connections and file changes. Note the service lists as Sysmon64, not Sysmon — that is why the check above uses a wildcard.' },
        ],
        verify: ['Running'],
        files: [
          { name: 'Sysmon (Sysinternals)', purpose: 'the rich Windows event source the agent forwards', source: 'https://learn.microsoft.com/sysinternals/downloads/sysmon' },
          { name: 'sysmonconfig.xml (SwiftOnSecurity)', purpose: 'a sane default config — Sysmon logs almost nothing without one', source: 'https://github.com/SwiftOnSecurity/sysmon-config' },
        ],
        frameworks: ['NIST_CSF'],
        troubleshooting: 'No “Sysmon” service after install? Run PowerShell as Administrator, confirm both Sysmon64.exe and sysmonconfig.xml are in the folder you cd’d into, and re-run `.\\Sysmon64.exe -accepteula -i .\\sysmonconfig.xml`.',
      },
      {
        id: 'cr-w1-s5',
        where: 'Your Windows 11 PC',
        path: ['you', 'run installer', 'win', 'reports', 'soc'],
        title: 'Install the Wazuh agent on Windows & subscribe to Sysmon',
        description: 'Install the agent pointed at the SOC, tell it to read Sysmon\u2019s events, then start the service.',
        instruction: 'Still in PowerShell as Administrator, in the same wazuh-lab folder. Every step below is a command, so you should not need a browser.',
        instructionList: [
          'Download the Wazuh agent MSI.',
          'Install it pointed at 10.10.100.100.',
          'Add the Sysmon block to ossec.conf.',
          'Start the service.',
        ],
        commands: [
          { cmd: 'cd $HOME\\Downloads\\wazuh-lab', explain: 'Work in the same folder you used for Sysmon.' },
          { cmd: 'Invoke-WebRequest -Uri https://packages.wazuh.com/4.x/windows/wazuh-agent-4.14.7-1.msi -OutFile wazuh-agent-4.14.7-1.msi', explain: 'Download the agent installer straight into this folder — no browser needed (same approach as the Sysmon download above).' },
          { cmd: 'Get-ChildItem wazuh-agent-*.msi', explain: 'Confirm the .msi actually landed before you try to install it.' },
          { cmd: 'msiexec.exe /i wazuh-agent-4.14.7-1.msi /q WAZUH_MANAGER="10.10.100.100" WAZUH_AGENT_NAME="Team<#>-win"', explain: 'Install silently, pointed at your SOC and named for your team. If you downloaded a different version, type wazuh-agent and press Tab to complete the filename.' },
          { cmd: 'notepad "C:\\Program Files (x86)\\ossec-agent\\ossec.conf"', explain: 'Open the agent config to edit it. PowerShell must already be running as Administrator — Program Files is protected, and Notepad cannot save here otherwise.' },
          { cmd: '<localfile>\n  <location>Microsoft-Windows-Sysmon/Operational</location>\n  <log_format>eventchannel</log_format>\n</localfile>', explain: 'Paste this block INSIDE <ossec_config>, just above the closing </ossec_config> tag, then save. It ships Sysmon\u2019s events to the SOC. Outside that tag the agent ignores it.' },
          { cmd: 'Start-Service WazuhSvc', explain: 'Start the Wazuh service after the install and config edit.' },
          { cmd: 'Get-Service WazuhSvc', explain: 'Confirm the agent service shows Status: Running (the Windows twin of the Ubuntu systemctl check).' },
          { cmd: "Get-Content 'C:\\Program Files (x86)\\ossec-agent\\ossec.log' -Tail 20", explain: 'The proof it worked: look for "Connected to the server" — the agent reached 10.10.100.100 over port 1514.' },
        ],
        whatItMeans: 'The agent already forwards the Windows Application, Security and System logs; the Sysmon block adds process, network and file telemetry on top. Windows now lands in the same dashboard as Ubuntu and Suricata.',
        expectedOutput: `PS C:\\Users\\student\\Downloads\\wazuh-lab> Get-Service WazuhSvc

Status   Name       DisplayName
------   ----       -----------
Running  WazuhSvc   Wazuh

PS C:\\Users\\student\\Downloads\\wazuh-lab> Get-Content 'C:\\Program Files (x86)\\ossec-agent\\ossec.log' -Tail 20
2026/08/05 09:31:02 wazuh-agent: INFO: Requesting a key from server: 10.10.100.100
2026/08/05 09:31:03 wazuh-agent: INFO: Valid key received
2026/08/05 09:31:05 wazuh-agent: INFO: Connected to the server (10.10.100.100:1514/tcp).
2026/08/05 09:31:06 wazuh-agent: INFO: Started module 'logcollector'.`,
        outputHighlights: [
          { text: 'Running', label: 'the Windows service is alive. No firewall step is needed here \u2014 Defender Firewall is already on, and UFW is Linux-only.' },
          { text: 'Valid key received', label: 'enrolment worked. If this line is absent the agent never got an identity from the SOC \u2014 usually a duplicate agent name.' },
          { text: 'Connected to the server', label: 'the line that proves it. Running without this means installed but blind, which is exactly how a Windows machine ends up silently missing from the dashboard.' },
          { text: "Started module 'logcollector'", label: 'the component that reads the Sysmon event channel you just added to ossec.conf.' },
        ],
        walkthrough: {
          screen: 'ossec-conf',
          title: 'The Sysmon block in the Windows ossec.conf',
          markers: [
            { n: 1, label: 'Before: C:\\Program Files (x86)\\ossec-agent\\ossec.conf as installed.' },
            { n: 2, label: 'After: the Sysmon <localfile> eventchannel block, inside <ossec_config>. This adds process/network telemetry on top of the default event logs.' },
            { n: 3, label: 'Notepad must be run as Administrator to save into Program Files, then restart the service.' },
          ],
        },
        verify: ['Running', 'Connected to the server'],
        files: [
          { name: 'Official Wazuh agent guide (Windows)', purpose: 'download the MSI and see the exact msiexec install line', source: 'https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-windows.html' },
          { name: 'ossec.conf (agent)', purpose: 'add the Sysmon <localfile> block so events reach the SOC', source: 'C:\\Program Files (x86)\\ossec-agent\\ossec.conf' },
        ],
        frameworks: ['NIST_CSF'],
        troubleshooting: 'No "Connected to the server" in ossec.log? Most often two agents share a name — make it unique (Team<#>-win). Also confirm ossec.conf points to 10.10.100.100 (ports 1514 data / 1515 enrolment) and that the service is running (Start-Service WazuhSvc).',
      },
      {
        id: 'cr-w1-s6',
        where: 'Deliverables page',
        title: 'File your Sensor Deployment Record',
        description: 'Write down what you installed and the line that proves it reported.',
        instruction: 'Fill the Sensor Deployment Record — it already has the columns and worked example rows to copy.',
        instructionList: [
          'One row per sensor: the host, the version you actually installed, the manager address you set, and the service state.',
          'Paste the `Connected to the server` line from ossec.log — that, not the service state, is the proof it reached the SOC.',
          'Attach the Agents-view screenshot showing your agent Active.',
          'Note anything you had to fix, so the next person deploying this does not lose the same hour.',
        ],
        whatItMeans:
          'Version and manager address are what a responder needs at 2am to answer "should this host be sending me data?". A sensor that installed cleanly but points at the wrong manager looks identical to one that works.',
        expectedOutput: 'The Sensor Deployment Record filled in, with the agent-Active screenshot attached and the Connected to the server line pasted.',
        outputHighlights: [
          { text: 'Connected to the server', label: 'the one line that separates "installed" from "reporting".' },
        ],
        usesForm: 'Sensor Deployment Record',
        producesDeliverable: '10_Sensor_Deployment_Record.md',
        isEvidenceStep: true,
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'cb-w1',
    difficulty: 2,
    role: 'blue',
    week: 1,
    title: 'Deploy your Ubuntu sensor, prove the feed, write the baseline',
    objective: 'Install the Wazuh agent on your Ubuntu host, confirm it reports, prove the feed is live, then describe what normal looks like.',
    frameworks: ['NIST_CSF'],
    deliverables: ['01_SOC_Monitoring_Report.md'],
    prerequisites: ['You can SSH into your Ubuntu pod as the `student` user', 'You can log into the Wazuh dashboard with your account', 'Your pod IPs (set them in the Lab access panel)'],
    estimatedTime: '90 min',
    learn: ['Wazuh agent deployment', 'confirming agent check-in', 'log collection', 'baselining'],
    tools: ['Wazuh agent', 'Wazuh dashboard'],
    definitionOfDone: ['Your Ubuntu agent is Active in the dashboard', 'A fresh event from your host arrives in Security events', 'Baseline names 3 routine alert types and a rough events/hour'],
    handoff: [{ to: 'grc', artifact: 'Baseline', note: 'Optional: share your baseline so a teammate can compare — they can build their own too; it is not a prerequisite.' }],
    steps: [
      {
        id: 'cb-w1-s0',
        where: 'Your Ubuntu server \u2014 SSH in',
        path: ['you', 'ssh + install', 'ubuntu', 'reports', 'soc'],
        title: 'Install the Wazuh agent on your Ubuntu server',
        description: 'The official agent install, pointed at your SOC and named so you can find it.',
        instruction: 'SSH in and install the Wazuh agent, pointed at 10.10.100.100 and named for your team.',
        instructionList: [
          'Become root, then add the Wazuh package repository.',
          'Install the agent with BOTH the manager address and an agent name set \u2014 an unnamed agent enrols under the machine hostname and you will not find it in the Agents list.',
          'Open SSH (22) and the web port (80) in the firewall BEFORE enabling it, then turn it on.',
          'Start the service and read ossec.log for the line that proves it reached the SOC.',
        ],
        commands: [
          { cmd: 'sudo -i', explain: 'Become root \u2014 every command below runs as root, so none of them need their own sudo.' },
          { cmd: 'apt-get install -y gnupg apt-transport-https', explain: 'Tools apt needs to add a signed third-party repo.' },
          { cmd: 'curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --no-default-keyring --keyring gnupg-ring:/usr/share/keyrings/wazuh.gpg --import && chmod 644 /usr/share/keyrings/wazuh.gpg', explain: 'Trust the Wazuh signing key so packages verify.' },
          { cmd: 'echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" | tee /etc/apt/sources.list.d/wazuh.list', explain: 'Add the repository.' },
          { cmd: 'apt-get update', explain: 'Refresh the package list so wazuh-agent is found.' },
          { cmd: 'WAZUH_MANAGER="10.10.100.100" WAZUH_AGENT_NAME="Team<#>-ubuntu" apt-get install -y wazuh-agent', explain: 'Install the agent, point it at the SOC, and give it the exact name you will search for in the dashboard. Replace <#> with your team number.' },
          { cmd: 'systemctl daemon-reload && systemctl enable --now wazuh-agent', explain: 'Start the agent now and on every boot.' },
          { cmd: 'ufw allow 22/tcp', explain: 'Keep SSH open BEFORE turning the firewall on, so you do not lock yourself out.' },
          { cmd: 'ufw allow 80/tcp', explain: 'DVWA is served on port 80. Without this rule the web attacks in Weeks 2\u20134 cannot reach the box.' },
          { cmd: 'ufw --force enable', explain: 'Turn the firewall on. Outbound to the SOC stays allowed by default.' },
          { cmd: 'systemctl status wazuh-agent --no-pager', explain: 'Confirm the agent is running.' },
          { cmd: 'tail -n 20 /var/ossec/logs/ossec.log', explain: 'The proof it worked: look for "Connected to the server".' },
        ],
        whatItMeans: 'Out of the box the agent forwards this server\u2019s system logs (/var/log/auth.log, /var/log/syslog) to the SOC. "active (running)" means the service is up; "Connected to the server" means it actually reached 10.10.100.100.',
        expectedOutput: `\u25cf wazuh-agent.service - Wazuh agent
     Loaded: loaded (/lib/systemd/system/wazuh-agent.service; enabled; preset: enabled)
     Active: active (running) since Wed 2026-07-22 09:11:40 UTC; 5s ago

root@team07-ubuntu:~# tail -n 20 /var/ossec/logs/ossec.log
2026/07/22 09:11:41 wazuh-agentd: INFO: Requesting a key from server: 10.10.100.100
2026/07/22 09:11:42 wazuh-agentd: INFO: Valid key received
2026/07/22 09:11:44 wazuh-agentd: INFO: Connected to the server (10.10.100.100:1514/tcp).`,
        outputHighlights: [
          { text: 'active (running)', label: 'the agent process is up on this machine. Necessary, but on its own it does not mean the SOC can hear you.' },
          { text: 'Valid key received', label: 'enrolment on port 1515 worked \u2014 the SOC issued this agent its identity.' },
          { text: 'Connected to the server', label: 'the line that actually proves it worked. Running but never connected is the common half-failure, and it looks fine until you go looking for logs that never arrived.' },
          { text: '10.10.100.100:1514/tcp', label: 'the SOC address and the data port. A different address here means the agent enrolled against the wrong manager.' },
        ],
        verify: ['active (running)', 'Connected to the server'],
        files: [
          { name: 'Official Wazuh agent guide (Linux)', purpose: 'the vendor step-by-step reference for the commands above', source: 'https://documentation.wazuh.com/current/installation-guide/wazuh-agent/wazuh-agent-package-linux.html' },
        ],
        frameworks: ['NIST_CSF'],
        fixes: [
          { symptom: 'No "Connected to the server" in ossec.log?', fix: 'The agent installed but cannot reach the manager. Check the pod can ping 10.10.100.100 and that ports 1514 (data) and 1515 (enrolment) are open on the SOC.' },
          { symptom: 'Missed the manager address at install time?', fix: 'Set <address>10.10.100.100</address> in /var/ossec/etc/ossec.conf, then restart the agent.' },
          { symptom: 'Agent never appears in the Agents list?', fix: 'Two agents sharing a name collide and only one shows. Make yours unique (Team<#>-ubuntu) and restart.' },
        ],
      },
      {
        id: 'cb-w1-s1',
        where: 'Wazuh dashboard',
        path: ['ubuntu', 'active', 'dash'],
        title: 'Confirm your agent checks in',
        description: 'An agent that installed but never checked in is the #1 Week-1 problem \u2014 catch it now, not in Week 4.',
        instruction: 'In the dashboard: Agents (or Endpoints). Confirm your Team<#>-ubuntu agent shows Active with a recent "Last keep alive" (within the last few minutes). Click it to see its exact last check-in time. Screenshot the agents list.',
        whatItMeans: 'Green/Active means the agent is reporting. \u201cDisconnected\u201d or \u201cNever connected\u201d means the SOC has a blind spot on your host — the fixes below cover the three usual causes.',
        expectedOutput: 'Your Team<#>-ubuntu agent shows Active with a recent check-in, captured in a screenshot.',
        verify: ['Active'],
        outputHighlights: [
          { text: 'Active', label: 'the Status column must read this for your Ubuntu host \u2014 anything else means the SOC is blind to it' },
        ],
        walkthrough: {
          screen: 'agents',
          title: 'Agents \u2014 what a healthy check-in looks like',
          markers: [
            { n: 1, label: 'Left nav \u2192 Agents (called Endpoints in some builds). This is the list you are looking at.' },
            { n: 2, label: 'Status Active plus a Last keep alive of seconds/minutes ago \u2014 this row is healthy.' },
            { n: 3, label: 'Disconnected, or never \u2014 this machine is NOT reporting. Fix it now: service running, ports 1514/1515 reachable, agent name unique.' },
          ],
        },
        producesDeliverable: '01_SOC_Monitoring_Report.md',
        isEvidenceStep: true,
        frameworks: ['NIST_CSF'],
        fixes: [
          { symptom: 'Your agent is missing from the list, or shows Disconnected?', fix: 'On the host, confirm the service is running (systemctl status wazuh-agent) and that it can reach 10.10.100.100 on 1514/1515.' },
          { symptom: 'Service is running but it still never appears?', fix: 'Check its name is unique, and that 10.10.100.100 is set as the manager in the agent’s ossec.conf.' },
        ],
      },
      {
        id: 'cb-w1-s2',
        where: 'Wazuh dashboard',
        path: ['ubuntu', 'events', 'dash'],
        title: 'Open your Ubuntu server\u2019s events',
        description: 'Your alert feed for one machine.',
        instruction: 'In the dashboard: Agents › Team<#>-ubuntu › Security events. Set the time filter to Last 24 hours.',
        whatItMeans: 'This is where you will spend Weeks 2–4 — one machine\u2019s alerts.',
        expectedOutput: 'The events table has rows and the time filter is set to Last 24 hours.',
        outputHighlights: [
          { text: 'Last 24 hours', label: 'the time picker, top right \u2014 if this is narrower than your activity the table looks empty even when the feed is fine' },
        ],
        walkthrough: {
          screen: 'security-events',
          title: 'Security events \u2014 the three controls you will use all course',
          markers: [
            { n: 1, label: 'Events tab (not Dashboard). Events is the raw table of alerts, one row per alert.' },
            { n: 2, label: 'The search bar. Queries like rule.level:>=7 go here, one at a time.' },
            { n: 3, label: 'The time picker. Set it to Last 24 hours \u2014 this is the #1 reason a working feed looks empty.' },
          ],
        },
        verify: ['Last 24 hours'],
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cb-w1-s3',
        where: 'Your Ubuntu host, then the dashboard',
        path: ['you', 'make an event', 'ubuntu', 'dash'],
        title: 'Prove your feed is live',
        description: 'Make one event on your Ubuntu host and watch it arrive.',
        instruction: 'Generate a fresh event on your Ubuntu host, then find it in the dashboard: SSH in and straight back out — that makes an authentication event.',
        commands: [
          { cmd: 'ssh student@<UBUNTU_IP>', explain: 'Logging in makes an authentication event.' },
          { cmd: 'exit', explain: 'Log straight back out.' },
        ],
        whatItMeans: 'If a brand-new event from your host shows up in the SOC, your pipeline works end to end — not just "the agent says Active".',
        expectedOutput: 'Within about a minute the event lands. Under Agents › Team<#>-ubuntu › Security events a new row reads sshd: Authentication success.',
        outputHighlights: [
          { text: 'sshd: Authentication success', label: 'your own login arriving from the agent — proof the pipeline runs end to end. Matching your own action to a row rules out stale data.' },
        ],
        walkthrough: {
          screen: 'security-events',
          title: 'Finding your test event',
          markers: [
            { n: 1, label: 'Time picker — set Last 15 minutes. Agents batch-send, so give it a minute before deciding it failed.' },
            { n: 2, label: 'Search bar / the agent’s Security events — one query at a time.' },
            { n: 3, label: 'The row itself. You want one row you can tie to the SSH login you just made.' },
          ],
        },
        verify: ['Authentication success'],
        troubleshooting: 'Event not showing? Widen the time picker to Last 15 minutes and give it a minute — agents batch-send. Still nothing? Re-run the SSH login and confirm your agent is Active (step 1).',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cb-w1-s4',
        where: 'Your notes',
        path: ['dash', 'you note normal', 'report'],
        title: 'Write the baseline',
        description: 'Record what normal looks like now, while nothing is wrong.',
        instruction: 'Fill the SOC Monitoring Report — it already has the columns and a worked example row to copy.',
        instructionList: [
          'The 3 routine alert types: Security events › Dashboard sub-tab › "Top 5 rule groups" (or add rule.description as a column and read the top names).',
          'Events per hour: the "Alerts evolution" graph — hover a bar for its count, or take the 24-hour total ÷ 24.',
          'Example row you should see: rule.description "sshd: authentication success" · level 3 · ~20/hour.',
        ],
        usesForm: 'SOC Monitoring Report',
        whatItMeans: 'Next week you can only spot "weird" if you wrote down "normal" this week. "Normal" here = the handful of rule types that fire all the time and roughly how often.',
        expectedOutput: 'Three routine alert types named with a rough count each, an events/hour figure, and a screenshot of the Alerts-evolution graph.',
        outputHighlights: [
          { text: 'Three routine alert types', label: 'write the actual rule.description text, not a category. "sshd: authentication success" is usable next week; "login stuff" is not.' },
          { text: 'events/hour figure', label: 'the single number you will compare against in Week 2. Without it you can only say traffic "looks higher", which proves nothing.' },
          { text: 'screenshot of the Alerts-evolution graph', label: 'your dated proof of what normal looked like. Once the attack runs you cannot go back and capture this.' },
        ],
        producesDeliverable: '01_SOC_Monitoring_Report.md',
        isEvidenceStep: true,
        troubleshooting: 'Alerts-evolution graph flat or empty? Widen the time picker to Last 24 hours (top-right). No rule.description column? Open any event row, find the rule.description field and click the "+" / Toggle column button to add it to the table.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'cg-w1',
    difficulty: 2,
    role: 'grc',
    week: 1,
    title: 'Deploy the network sensor, then validate coverage',
    objective: 'Make sure every data source you rely on is reporting — host agent, Suricata network alerts, and Sysmon Windows events. A source you expect but can’t find is itself a finding.',
    frameworks: ['NIST_CSF'],
    deliverables: ['06_Coverage_Validation.md'],
    prerequisites: ['You can SSH into your Ubuntu pod as the `student` user', 'You can open each module for your pod in the shared dashboard'],
    estimatedTime: '75 min',
    learn: ['Suricata (network IDS)', 'data-source coverage', 'endpoint telemetry', 'gap analysis'],
    tools: ['Suricata', 'Wazuh dashboard'],
    definitionOfDone: ['Suricata is running and writing eve.json', 'Every expected source is checked and recorded as present or missing', 'Each missing source is written up as a coverage finding'],
    steps: [
      {
        id: 'cg-w1-s0',
        where: 'Your Ubuntu server \u2014 SSH in',
        path: ['you', 'ssh + install', 'ubuntu', 'watches network', 'soc'],
        title: 'Install Suricata and forward its alerts',
        description: 'Suricata is the network IDS \u2014 it watches the server\u2019s traffic and raises alerts.',
        instruction: 'Install Suricata, point it at the real network card, pull the rules, start it, then tell the Wazuh agent to ship its alert file.',
        instructionList: [
          'Install Suricata on the Ubuntu server.',
          'Run `ip -br addr` and note your real card name \u2014 on Proxmox it is usually ens18, not eth0. This is the single most common mistake.',
          'Open /etc/suricata/suricata.yaml and set the `interface:` line under af-packet to that card name.',
          'Download the rules, then start Suricata and confirm it is running and writing eve.json.',
          'Add the <localfile> block below to /var/ossec/etc/ossec.conf so the agent forwards the alerts, then restart the agent.',
        ],
        commands: [
          { cmd: 'ssh student@<UBUNTU_IP>' },
          { cmd: 'sudo apt update && sudo apt install -y suricata', explain: 'Install the Suricata network intrusion-detection engine.' },
          { cmd: 'ip -br addr', explain: 'Find your network card name. Whatever this prints is what the next step must use.' },
          { cmd: 'sudo nano /etc/suricata/suricata.yaml', explain: 'Find the af-packet section and set `interface:` to the card you just saw. Editing by hand is deliberate \u2014 a blind find-and-replace fails whenever the card is not named ens18.' },
          { cmd: 'sudo suricata-update', explain: 'Download the Emerging Threats ruleset \u2014 without rules Suricata sees traffic but raises no alerts.' },
          { cmd: 'sudo systemctl enable --now suricata', explain: 'Start Suricata now and on every boot.' },
          { cmd: 'sudo systemctl status suricata --no-pager', explain: 'Confirm it is running.' },
          { cmd: '<localfile>\n  <log_format>json</log_format>\n  <location>/var/log/suricata/eve.json</location>\n</localfile>', explain: 'Paste this INSIDE <ossec_config> in /var/ossec/etc/ossec.conf (use sudo nano), just above the closing tag \u2014 outside it the agent ignores it. Then `sudo systemctl restart wazuh-agent`; the agent only re-reads its config on restart.' },
        ],
        whatItMeans: 'Suricata sniffs one network card and matches traffic against rules; the <localfile> block carries those alerts to the SOC. No agent here yet? Suricata still writes eve.json locally — record that as a coverage gap.',
        expectedOutput: `\u25cf suricata.service - Suricata IDS/IDP daemon
     Loaded: loaded (/lib/systemd/system/suricata.service; enabled; preset: enabled)
     Active: active (running) since Wed 2026-07-22 09:02:11 UTC; 6s ago
   Main PID: 4412 (Suricata-Main)

student@team07-ubuntu:~$ ls -l /var/log/suricata/eve.json
-rw-r----- 1 root root 18452 Jul 22 09:04 /var/log/suricata/eve.json`,
        outputHighlights: [
          { text: 'active (running)', label: 'Suricata is up and watching the card. If this reads "inactive (dead)" or "failed", nothing is being inspected \u2014 fix it before moving on.' },
          { text: 'Main PID', label: 'a real process id means it started cleanly rather than crashing on a bad config file.' },
          { text: '/var/log/suricata/eve.json', label: 'the alert file Suricata writes \u2014 this is what the Wazuh agent ships to the SOC.' },
          { text: '18452', label: 'any non-zero size means traffic is actually being recorded. 0 bytes means Suricata is running but sniffing the wrong card.' },
        ],
        walkthrough: {
          screen: 'ossec-conf',
          title: 'Where the <localfile> block goes in ossec.conf',
          markers: [
            { n: 1, label: 'Before: the file already has a <client> block. Do not remove or duplicate it.' },
            { n: 2, label: 'After: your new <localfile> block sits INSIDE <ossec_config>, above the closing tag. Outside it, the agent ignores it.' },
            { n: 3, label: 'Save, then restart the agent \u2014 it only re-reads the config on restart.' },
          ],
        },
        verify: ['active (running)'],
        files: [
          { name: 'Suricata quickstart (official)', purpose: 'the vendor step-by-step for installing and starting Suricata', source: 'https://docs.suricata.io/en/latest/quickstart.html' },
          { name: '/etc/suricata/suricata.yaml', purpose: 'the capture interface lives here \u2014 it must name your real NIC, not eth0', source: 'ip -br addr  # find your card (usually ens18 on Proxmox)' },
        ],
        frameworks: ['NIST_CSF'],
        fixes: [
          { symptom: 'Suricata running but eve.json stays 0 bytes?', fix: 'The interface is wrong. Re-check `ip -br addr`, fix the `interface:` line in suricata.yaml, then restart Suricata.' },
          { symptom: 'eve.json fills but nothing reaches the SOC?', fix: 'The <localfile> block is missing, outside <ossec_config>, or the agent was not restarted after the edit.' },
          { symptom: 'No alerts at all, even with traffic?', fix: 'Run `sudo suricata-update` \u2014 with no ruleset Suricata inspects traffic but has nothing to match against.' },
        ],
      },
      {
        id: 'cg-w1-s1',
        where: 'Wazuh dashboard',
        path: ['ubuntu', 'modules', 'dash'],
        title: 'Check each module has data',
        description: 'Each module is a separate data source.',
        instruction: 'In the dashboard: Agents › your agent › open Integrity monitoring, then SCA, then Vulnerabilities.',
        instructionList: [
          'A module "has data" when its table shows rows.',
          'Integrity monitoring lists watched files; SCA shows a score with pass/fail checks; Vulnerabilities lists CVEs.',
          'Empty is not always a fault — SCA and Vulnerabilities run on a schedule, so a brand-new agent can need one scan cycle (often 15–60 min) before they fill.',
        ],
        whatItMeans: 'An empty module is a blind spot to note, not to ignore — but check the scan-cycle warning above before you call it a gap.',
        expectedOutput: 'You can say which of the three modules show rows and which are still empty (and whether "empty" is just waiting for the first scan cycle).',
        outputHighlights: [
          { text: 'which of the three modules show rows', label: 'rows are the test. Integrity monitoring lists watched files, SCA shows a score with pass/fail checks, Vulnerabilities lists CVEs.' },
          { text: 'waiting for the first scan cycle', label: 'the distinction that matters. A module empty because it has not run yet is not a coverage gap — reporting it as one is a wrong finding.' },
        ],
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cg-w1-s2',
        where: 'Your Ubuntu server — SSH in',
        path: ['ubuntu', 'Suricata alerts', 'soc'],
        title: 'Confirm the network (Suricata) alerts arrive',
        description: 'Suricata watches your server\u2019s own traffic.',
        instruction: 'On your Ubuntu server — SSH in and confirm the alert file is filling. Then, in the dashboard, search for the same alerts so you know they reached the SOC.',
        commands: [
          { cmd: 'sudo tail -n 20 /var/log/suricata/eve.json', explain: 'The live Suricata alert file on your own server.' },
          { cmd: 'rule.groups:ids', explain: 'In the dashboard search bar — this is how Suricata network alerts are tagged. (Fallback: location:"/var/log/suricata/eve.json".) A quick nmap from Kali is an easy way to make one appear.' },
        ],
        whatItMeans: 'Suricata\u2019s alerts reach the SOC through the agent — confirm the file is being written.',
        expectedOutput: `student@team07-ubuntu:~$ sudo tail -n 20 /var/log/suricata/eve.json
{"timestamp":"2026-08-05T09:44:02.118374+0000","event_type":"stats","stats":{"uptime":412}}
{"timestamp":"2026-08-05T09:44:19.402881+0000","flow_id":1885329447,"event_type":"alert","src_ip":"10.10.30.7","src_port":51422,"dest_ip":"10.10.100.7","dest_port":80,"proto":"TCP","alert":{"signature":"ET SCAN Nmap Scripting Engine User-Agent Detected","category":"Web Application Attack","severity":2}}`,
        outputHighlights: [
          { text: '"event_type":"alert"', label: 'the field that separates a real detection from the routine "stats" lines. If every line says stats, Suricata is running but has matched nothing yet — generate some traffic.' },
          { text: '"src_ip":"10.10.30.7"', label: 'who caused it. This is the field you pivot on in Week 2, where it is written data.src_ip in the dashboard search bar.' },
          { text: '"signature":"ET SCAN Nmap Scripting Engine User-Agent Detected"', label: 'the Emerging Threats rule that fired. No signature names at all means suricata-update never ran, so there are no rules to match against.' },
          { text: '"severity":2', label: 'Suricata’s own severity. It is not the same scale as Wazuh’s rule.level, so do not compare the two numbers directly.' },
        ],
        verify: ['event_type'],
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cg-w1-s3',
        where: 'Wazuh dashboard',
        path: ['win', 'Sysmon events', 'dash'],
        title: 'Confirm the Windows (Sysmon) events arrive',
        description: 'Sysmon is your rich Windows telemetry — process starts, network connections, file changes.',
        instruction: 'In the dashboard: pick Team<#>-win, then search for its Sysmon channel — enter data.win.system.channel: "Microsoft-Windows-Sysmon/Operational" in the search bar (or open the Windows agent’s events and filter for Sysmon).',
        whatItMeans: 'If Sysmon events show up here, the Windows half of your coverage is live — this is where you’ll spot suspicious process activity in later weeks.',
        expectedOutput: 'Rows appear for Team<#>-win. Each carries the channel Microsoft-Windows-Sysmon/Operational, a rule.description of "Sysmon - Event 1: Process creation", and a data.win.eventdata.image field naming the program that ran — for example C:\\Windows\\System32\\whoami.exe.',
        outputHighlights: [
          { text: 'Microsoft-Windows-Sysmon/Operational', label: 'the channel. Events only appear here because Sysmon is installed and the agent was told to read this channel — plain Windows logging does not produce them.' },
          { text: 'Sysmon - Event 1: Process creation', label: 'the process-create event. This is the backbone of Windows hunting: every program that starts leaves one.' },
          { text: 'data.win.eventdata.image', label: 'the field naming the executable. Remember it — this is what you search on when you are chasing a suspicious process in Week 4.' },
        ],
        walkthrough: {
          screen: 'security-events',
          title: 'Isolating the Windows agent’s Sysmon events',
          markers: [
            { n: 1, label: 'Pick Team<#>-win first, so you are not reading the Ubuntu server’s events by mistake.' },
            { n: 2, label: 'Search bar — paste the channel query. It is the cleanest way to prove Sysmon specifically is arriving.' },
            { n: 3, label: 'Open one row and read data.win.eventdata.image to see which program the event describes.' },
          ],
        },
        verify: ['Microsoft-Windows-Sysmon/Operational'],
        frameworks: ['NIST_CSF'],
        troubleshooting: 'No Sysmon events? Confirm the Sysmon service is Running on the PC, that the <localfile> Sysmon block is in the agent’s ossec.conf, and that the Wazuh agent was restarted after the edit.',
      },
      {
        id: 'cg-w1-s4',
        where: 'Your notes',
        path: ['dash', 'you record gaps', 'report'],
        title: 'Write up coverage in the Coverage Validation Report',
        usesForm: 'Coverage Validation Report',
        description: 'A source you expect but can\u2019t find is a finding.',
        instruction: 'Fill the Coverage Validation Report — it already has the columns and a worked example row to copy. One row per feed below, each answering: was data present, where did you check, what gap did you find?',
        instructionList: [
          'Host agent.',
          'Suricata — the network feed.',
          'Sysmon — the Windows feed.',
        ],
        whatItMeans: 'A missing source is worth marks — write it up rather than ignore it.',
        expectedOutput: 'A short table: each of the three feeds checked, whether data was present, and any gap noted.',
        outputHighlights: [
          { text: 'each of the three feeds checked', label: 'host agent, Suricata network alerts, Sysmon Windows events — one row each. A feed you did not check is not the same as a feed with no data.' },
          { text: 'any gap noted', label: 'the part that earns marks. A missing source written up is a finding; a missing source left blank just looks like you did not look.' },
        ],
        producesDeliverable: '06_Coverage_Validation.md',
        isEvidenceStep: true,
        frameworks: ['NIST_CSF'],
      },
    ],
  },

  // ─────────────────────────── WEEK 2 · DETECT ───────────────────────────
  {
    id: 'cb-w2',
    difficulty: 2,
    role: 'blue',
    week: 2,
    title: 'Triage the alerts',
    objective: 'Sort the alerts: real, noise, or worth a closer look.',
    frameworks: ['NIST_CSF'],
    deliverables: ['07_Alert_Triage_Report.md'],
    prerequisites: ['Week-1 baseline written — you know what “normal” looks like', 'You have run this week’s attack against your OWN pod, so there are real alerts to triage (no teammate needed — or use the seeded example rows)', 'Dashboard access to read and filter alerts'],
    estimatedTime: '60 min',
    learn: ['alert triage', 'alert scoring'],
    tools: ['Wazuh dashboard'],
    handoff: [{ to: 'grc', artifact: 'Escalated alerts', note: 'Optional: share your escalations so a teammate can compare — they can also work from their own alerts.' }],
    definitionOfDone: ['Every reviewed alert has a verdict and a one-line reason', 'At least one alert is escalated to the Threat Hunter in the Alert Triage Report'],
    steps: [
      {
        id: 'cb-w2-s1',
        where: 'Wazuh dashboard',
        path: ['ubuntu', 'alerts', 'dash'],
        title: 'See the alerts grouped',
        description: 'Read the summary by rule and category instead of scrolling.',
        instruction: 'In Security events, open the Dashboard sub-tab — that is where the real counts live.',
        instructionList: [
          '"Top 5 rule groups" and "Alerts evolution" give you counts directly.',
          'For any other field, open a row, expand a field (e.g. rule.description) and click Visualize.',
          'Full click-paths — add columns, save a search, build a dashboard — are in "Driving the dashboard" on the Guide.',
        ],
        whatItMeans: 'The raw event table has no count/group-by; the Dashboard sub-tab and Visualize do. rule.description = what fired, rule.groups = the category (authentication, ids, web…), agent.name = which machine.',
        expectedOutput: 'You can name the top three alert types with a count for each, and say which machine (agent.name) they came from.',
        files: [
          { name: 'Wazuh dashboard (docs)', purpose: 'the Events table, the Dashboard visualisations, and Visualize', source: 'https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/index.html' },
          { name: 'Build a dashboard (OpenSearch Dashboards)', purpose: 'save a search and assemble panels into your own dashboard', source: 'https://opensearch.org/docs/latest/dashboards/dashboard/index/' },
        ],
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cb-w2-s2',
        where: 'Wazuh dashboard search bar',
        path: ['dash', 'filter', 'you'],
        title: 'Focus on the important ones — and know what to look for',
        description: 'Filter to the alerts that usually matter, then to the three attack shapes.',
        instruction: 'Set the time picker (top-right) to cover the attack window your team just ran, then work through the queries below.',
        instructionList: [
          'Run each query ONE AT A TIME, clearing the bar between them.',
          'They are alternatives, not one big AND.',
          'Full cheat sheet: "Filtering & what to look for" on the Guide.',
        ],
        commands: [
          { cmd: 'rule.level:>=7', explain: 'Wazuh scores every alert 0–15; level 7+ is a good first cut for the auth/web alerts. (Do NOT chain this with the ids query below — Suricata scan alerts are often low level.)' },
          { cmd: 'rule.groups:authentication_failed', explain: 'The tell for an SSH brute force: many failed logins from one data.srcip in a short window.' },
          { cmd: 'rule.groups:(ids or suricata) and data.event_type:alert', explain: 'Suricata network alerts. A burst from one data.src_ip across many data.dest_port = a port scan. (Fallback: location:"/var/log/suricata/eve.json".)' },
          { cmd: 'data.alert.signature:SQL*', explain: 'A SQL-injection web attack, by Suricata’s signature name. (Avoid a leading * — it is slow and often disabled. If Apache logs are ingested, rule.groups:web also works.)' },
        ],
        whatItMeans: 'The severity cut shortens the auth/web list; the group and signature queries tell a port scan from a brute force from a web attack instead of guessing. Note Suricata uses data.src_ip / data.dest_port (underscores), not data.srcip.',
        expectedOutput: `Run one at a time, reading the hit count in the top-right:

rule.groups:authentication_failed              412 hits   → brute force
rule.groups:(ids or suricata) and data.event_type:alert   1,204 hits → port scan
data.alert.signature:SQL*                        3 hits   → web attack (SQLi)`,
        outputHighlights: [
          { text: 'rule.groups:authentication_failed', label: 'the brute-force query. A high count from a single data.srcip in a short window is the signature of someone guessing SSH passwords.' },
          { text: '1,204 hits', label: 'the scan. A big number spread across many data.dest_port values in seconds is a port sweep, not normal traffic.' },
          { text: 'data.alert.signature:SQL*', label: 'the web attack. Even 3 hits matter here — one successful SQL injection is worse than a thousand blocked scan packets.' },
        ],
        verify: ['rule.groups'],
        fixes: [
          { symptom: 'Query returns nothing?', fix: '90% of the time it is the time picker — widen it to cover when your team ran the attack.' },
          { symptom: 'Time picker is right and it is still empty?', fix: 'Confirm you are on the Security events search bar (DQL), not the Agents list — that one uses WQL, which wants rule.level>=7 with no colon.' },
          { symptom: 'Sure the query is right?', fix: 'Expand one document and check the field actually exists on it before trusting the filter.' },
        ],
        files: [
          { name: 'Wazuh rule levels (docs)', purpose: 'what each severity level (0–15) means, so rule.level:>=7 makes sense', source: 'https://documentation.wazuh.com/current/user-manual/ruleset/rules-classification.html' },
          { name: 'Query language (DQL) (docs)', purpose: 'how field:value queries and filters work in the Security events search bar', source: 'https://documentation.wazuh.com/current/user-manual/wazuh-dashboard/queries.html' },
        ],
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cb-w2-s3',
        where: 'Your notes',
        path: ['you', 'decide', 'report'],
        title: 'Give each a verdict with a reason — in the Alert Triage Report',
        usesForm: 'Alert Triage Report',
        description: 'A verdict needs a reason.',
        instruction: 'Fill the Alert Triage Report — it already has the columns and a worked example row to copy. One row per alert: its count and severity, a verdict, a one-line reason, and whether you escalated.',
        instructionList: [
          'Compare each alert to your Week-1 baseline — that comparison is what decides the verdict.',
          'An alert type and rate that matches "normal" is a false positive.',
          'A burst, a new source IP, or a type you never baselined is a true positive worth escalating.',
        ],
        whatItMeans: '"Looks bad" isn\u2019t a reason; "one IP hit 900 ports in 40 seconds \u2014 not in the Week-1 baseline" is. The baseline is what turns a guess into a verdict.',
        expectedOutput: 'Every alert type has a verdict and a one-line reason tied to the baseline; the real ones go to the Hunter in writing.',
        producesDeliverable: '07_Alert_Triage_Report.md',
        isEvidenceStep: true,
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'cg-w2',
    difficulty: 3,
    role: 'grc',
    week: 2,
    title: 'Investigate & prove it',
    objective: 'Follow the suspicious source in the logs, capture the traffic, and quote the exact request it sent.',
    frameworks: ['NIST_CSF'],
    deliverables: ['02_Threat_Investigation_Report.md', 'week2.pcap'],
    prerequisites: ['Kali reachable on the lab network (you generate the traffic in step 1)', 'A suspicious source to chase (from your own generated attack in step 1)', 'Wireshark to open the capture (pre-installed on Kali)'],
    estimatedTime: '75 min',
    learn: ['safe self-testing (your own pod)', 'log pivoting', 'packet capture', 'stream analysis'],
    tools: ['nmap', 'hydra', 'Wazuh', 'tcpdump', 'Wireshark', 'sha256sum'],
    definitionOfDone: ['A pcap + its .sha256 exist', 'The attacker\u2019s exact request is quoted with a screenshot'],
    handoff: [{ to: 'red', artifact: 'Findings', note: 'Optional: share your findings — a teammate can index them as IOCs; they can also gather their own.' }],
    steps: [
      {
        id: 'cg-w2-s1',
        where: 'Kali — attack your OWN pod',
        path: ['kali', 'scan + attack', 'ubuntu', 'alerts', 'soc'],
        title: 'Generate the attack traffic (against your own pod)',
        description: 'Make real alerts to investigate by safely attacking your own team’s Ubuntu server.',
        instruction: 'From Kali, run these against your OWN Ubuntu pod only.',
        instructionList: [
          'This is allowed: you are testing your own team’s detection, never another team.',
          'Note the start time so the SOC Analyst can filter to it.',
          'Give each command a minute, then watch the SOC light up.',
        ],
        commands: [
          { cmd: 'sudo nmap -sS -p- <UBUNTU_IP>', explain: 'Port scan → Suricata network alerts (rule.groups ids/suricata).' },
          { cmd: 'sudo gunzip -k /usr/share/wordlists/rockyou.txt.gz', explain: 'One-time: unzip the wordlist hydra needs. Skip if rockyou.txt already exists.' },
          { cmd: 'hydra -l student -P /usr/share/wordlists/rockyou.txt ssh://<UBUNTU_IP> -t 4', explain: 'SSH brute force → many authentication_failed alerts. Ctrl+C after ~20 seconds; you do not need it to finish.' },
          { cmd: 'curl "http://<UBUNTU_IP>/dvwa/vulnerabilities/sqli/?id=1%27+UNION+SELECT+user,password+FROM+users--&Submit=Submit"', explain: 'SQL-injection web attack → Suricata/Apache web alerts.' },
        ],
        whatItMeans: 'Week 2 is a detection exercise — you first create the signal, then hunt it. Scanning your own pod is standard SOC self-testing and stays inside the Rules of Engagement.',
        expectedOutput: `┌──(kali㉿kali)-[~]
└─$ sudo nmap -sS -p- 10.10.100.7
Nmap scan report for 10.10.100.7
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
3306/tcp open  mysql

┌──(kali㉿kali)-[~]
└─$ hydra -l student -P /usr/share/wordlists/rockyou.txt ssh://10.10.100.7 -t 4
[DATA] attacking ssh://10.10.100.7:22/
[STATUS] 284.00 tries/min, 284 tries in 00:01h
^C   (Ctrl+C after ~20s — you do not need it to finish)`,
        outputHighlights: [
          { text: 'open', label: 'the scan reached your pod. This burst of connections is what fires the Suricata port-scan alerts you are about to hunt.' },
          { text: '284.00 tries/min', label: 'hydra is hammering SSH. Each failed try becomes one authentication_failed alert at the SOC — this is what a brute force looks like from the attacker side.' },
          { text: '^C', label: 'stop it after ~20 seconds. You only need enough failures to make a clear signal, not a completed crack.' },
        ],
        verify: ['open'],
        files: [
          { name: 'nmap', purpose: 'the port scanner (pre-installed on Kali)', source: 'sudo apt install -y nmap' },
          { name: 'hydra', purpose: 'the login brute-forcer (pre-installed on Kali)', source: 'sudo apt install -y hydra' },
        ],
        troubleshooting: 'No alerts? Confirm you can reach the pod (ping <UBUNTU_IP>), that Suricata is active on it (Week 1), and widen the SOC time picker. hydra: if rockyou.txt is gzipped, run `gunzip /usr/share/wordlists/rockyou.txt.gz` first.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cg-w2-s2',
        where: 'Wazuh dashboard search bar',
        path: ['dash', 'search by IP', 'you'],
        title: 'Pull everything from the suspicious source',
        description: 'See everything that host touched.',
        instruction: 'In the dashboard search bar, search by the Kali source IP, then read the detail fields to size up what it did. Suricata alerts use underscore field names.',
        commands: [
          { cmd: 'data.srcip:<kali-ip> or data.src_ip:<kali-ip>', explain: 'Both forms: sshd/auth alerts use data.srcip; Suricata alerts use data.src_ip. Using both shows everything that host did.' },
        ],
        outputExplanation: 'Add these columns (or open a row) to size it up: data.dest_port = which ports it hit (many in seconds = a scan), data.alert.signature = the Suricata rule name, agent.name = which of your machines.',
        whatItMeans: 'One source, all of its activity — the shape of the behaviour, not a single alert.',
        expectedOutput: 'You can say how many different ports (data.dest_port) the source hit and name the Suricata signatures it triggered, on which machine.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cg-w2-s3',
        where: 'Your Ubuntu server — SSH in',
        path: ['ubuntu', 'capture', 'you'],
        title: 'Capture the traffic for a closer look',
        description: 'Capture on the machine being hit, and hash it.',
        instruction: 'On your Ubuntu server — SSH in and start the capture, then re-run the Kali attack (step 1) so there is traffic to record. Press Ctrl+C to stop, take ownership of the file, then hash it.',
        commands: [
          { cmd: 'sudo apt install -y tcpdump', explain: 'The packet capture tool — install it once if the pod does not have it yet.' },
          { cmd: 'sudo tcpdump -i "$(ip -br addr | awk \'/UP/{print $1; exit}\')" -nn -w /tmp/week2.pcap', explain: 'Capture on your real card, discovered rather than hardcoded. Nothing is filtered out \u2014 the SSH brute force IS part of the attack you are evidencing.' },
          { cmd: 'sudo chown student:student /tmp/week2.pcap', explain: 'tcpdump writes as root — take ownership so you can copy it off with scp in the next step.' },
          { cmd: 'sha256sum /tmp/week2.pcap > /tmp/week2.pcap.sha256', explain: 'Hash it right away so you can prove it wasn\u2019t changed.' },
          { cmd: 'sha256sum -c /tmp/week2.pcap.sha256', explain: 'Verify the hash the moment you make it \u2014 it should print week2.pcap: OK.' },
        ],
        whatItMeans: 'Hashing at capture time is what makes the packet file trustworthy evidence.',
        expectedOutput: `student@team07-ubuntu:~$ sudo tcpdump -i ens18 -nn -w /tmp/week2.pcap
tcpdump: listening on ens18, link-type EN10MB (Ethernet), snapshot length 262144 bytes
^C
1487 packets captured
1502 packets received by filter
0 packets dropped by kernel
student@team07-ubuntu:~$ sha256sum -c /tmp/week2.pcap.sha256
/tmp/week2.pcap: OK`,
        outputHighlights: [
          { text: '1487 packets captured', label: 'a non-trivial count means the attack was actually flowing while you captured. Single digits mean you stopped too early, or the attack was not running — re-run it, then stop the capture.' },
          { text: '0 packets dropped by kernel', label: 'nothing was lost, so the pcap is a complete record of the window. Dropped packets mean gaps the defence lawyer would point at.' },
          { text: 'OK', label: 'the pcap still matches the hash you took at capture time. That match is what makes the packet file admissible rather than just "a file you have".' },
        ],
        producesDeliverable: 'week2.pcap',
        isEvidenceStep: true,
        verify: ['OK'],
        tree: {
          label: '~/team-artifacts/week-2/',
          kind: 'root',
          children: [
            { label: 'week2.pcap', kind: 'file' },
            { label: 'week2.pcap.sha256', kind: 'file' },
            { label: '20260725_Team07_http_stream.png', kind: 'file', format: 'img' },
          ],
        },
        fixes: [
          { symptom: 'Capture empty, or only a few KB?', fix: 'You stopped it before the attack ran, or used the wrong NIC — confirm your card with `ip -br addr` (usually ens18). Re-run tcpdump, re-run your Kali attack from step 1, then Ctrl+C.' },
          { symptom: 'scp fails later with Permission denied?', fix: 'You skipped the chown line above — the capture is still owned by root.' },
        ],
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cg-w2-s4',
        where: 'Kali (or your own PC) — open the pcap',
        path: ['you', 'follow stream', 'report'],
        title: 'Read it in Wireshark',
        description: 'Follow the stream to see the request in plain text.',
        instruction: 'Copy the pcap somewhere with Wireshark — Kali has it pre-installed (use the scp line below), or use your own PC — then open it.',
        instructionList: [
          'Right-click a packet → Follow → HTTP Stream to read the attacker’s requests.',
          'Useful display filters are below; Statistics → Conversations is the fastest way to prove the port scan.',
          'Fill the Threat Investigation Report — it already has the columns and a worked example row to copy.',
          'Quote the exact request, its source IP and time, and attach the Follow-stream screenshot.',
        ],
        commands: [
          { cmd: 'http.request', explain: 'Show only the HTTP requests.' },
          { cmd: 'http.request.uri contains "union"', explain: 'Jump straight to the SQL-injection request.' },
          { cmd: 'tcp.flags.syn==1 && tcp.flags.ack==0', explain: 'The port-scan tell: lots of bare SYNs to many ports.' },
          { cmd: 'ip.addr == <UBUNTU_IP>', explain: 'Limit to traffic to/from your server.' },
        ],
        whatItMeans: 'Following the stream shows the attacker\u2019s request and the server\u2019s reply as plain text.',
        expectedOutput: 'You can quote the exact request the attacker sent, with a screenshot.',
        walkthrough: {
          screen: 'wireshark',
          title: 'Wireshark \u2014 from a packet list to the actual request',
          markers: [
            { n: 1, label: 'Display filter: type http and press Enter. This hides everything that is not web traffic.' },
            { n: 2, label: 'The Info column shows the request line. This is the row worth quoting.' },
            { n: 3, label: 'Right-click that packet \u2192 Follow \u2192 HTTP Stream to read the whole request and response as text.' },
          ],
        },
        files: [
          { name: 'Wireshark', purpose: 'to open week2.pcap and follow the HTTP stream (pre-installed on Kali; download for your own PC)', source: 'https://www.wireshark.org/download.html' },
          { name: 'week2.pcap', purpose: 'the capture you made in the previous step — copy it to your workstation', source: 'scp student@<UBUNTU_IP>:/tmp/week2.pcap .' },
        ],
        troubleshooting: 'Nothing on “Follow → HTTP Stream”? The attack may be HTTPS (encrypted) or filtered out — clear filters and try http.request, or sort by the suspicious IP. Verify the pcap’s SHA-256 matches before you quote from it.',
        usesForm: 'Threat Investigation Report',
        producesDeliverable: '02_Threat_Investigation_Report.md',
        isEvidenceStep: true,
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'cr-w2',
    difficulty: 2,
    role: 'red',
    week: 2,
    title: 'Turn findings into indicators',
    objective: 'Turn the findings into indicators, each with a verdict.',
    frameworks: ['NIST_CSF'],
    deliverables: ['05_IOC_Database.csv'],
    prerequisites: ['Your own attack traffic in the SOC — IPs, files, requests to index (or a shared capture, if a teammate provides one)', 'Access to the IOC Database form on the Deliverables page'],
    estimatedTime: '60 min',
    learn: ['IOCs', 'threat-intel lookup', 'MITRE ATT&CK'],
    tools: ['Threat-intel sites', 'Wazuh MITRE ATT&CK'],
    definitionOfDone: ['At least five IOC rows, each traceable to an alert or packet', 'At least two rows carry an ATT&CK technique (e.g. T1110, T1190)'],
    steps: [
      {
        id: 'cr-w2-s1',
        where: 'Your notes',
        path: ['report', 'one row each', 'report'],
        title: 'Build the IOC table',
        description: 'One row per indicator.',
        instruction: 'Fill the IOC Database — it already has the columns and worked example rows to copy. Each row is type (IP · domain · URL · hash), value, where you first saw it, and a timestamp.',
        instructionList: [
          'Attacker IP — re-run data.src_ip:<kali-ip> or data.srcip:<kali-ip> in the dashboard.',
          'Malicious URL/URI and the attacker’s User-Agent — open week2.pcap in Wireshark (Follow → HTTP Stream).',
          'Hash — use the SHA-256 you already made of week2.pcap.',
          'Example row: type IP · value <kali-ip> · source "Suricata port-scan alert (Security events)" · 2026-07-25 14:03.',
        ],
        usesForm: 'IOC Database',
        whatItMeans: 'The IOC table is the running record every later week adds to. Every row must trace back to something you actually saw — an alert, a packet, or a file hash — not a guess.',
        expectedOutput: 'At least five rows, each traceable to a specific alert or packet (e.g. attacker IP, the SQLi URL, the attacker User-Agent, the week2.pcap hash).',
        outputHighlights: [
          { text: 'At least five rows', label: 'the count the grade checks. Four indicators drawn from real evidence beats ten guessed ones, but you do need the five.' },
          { text: 'traceable to a specific alert or packet', label: 'the real test. Every row must point back to something you actually saw — an alert, a packet, a hash — not something you assumed an attacker "probably" did.' },
        ],
        producesDeliverable: '05_IOC_Database.csv',
        isEvidenceStep: true,
        troubleshooting: 'Can’t find five? Widen the time picker and re-run the pivot query — and remember the week2.pcap SHA-256 and the attacker’s User-Agent count as indicators too, not just IPs.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cr-w2-s2',
        where: 'Threat-intel sites in your browser',
        path: ['you', 'look up', 'report'],
        title: 'Look each one up',
        description: 'Record what public sources say about each indicator.',
        instruction: 'In your browser, look each indicator up and record a verdict.',
        instructionList: [
          'VirusTotal for files, URLs and domains; AbuseIPDB for IPs.',
          'Your lab IPs are private (10.10.x.x) and these sites do not track them, so expect "no data" or an error.',
          'Mark those rows unknown — that is the correct answer here, not a failure.',
          'To practise a real lookup, try the sample public indicator in the files below.',
        ],
        whatItMeans: 'Nothing found is still a result — mark it unknown. In a real SOC most of your indicators would be public IPs/hashes; here the value is the process, not the verdict.',
        expectedOutput: 'Every row has a source and a verdict: malicious, suspicious, benign, or unknown (private lab IPs will be unknown).',
        files: [
          { name: 'VirusTotal', purpose: 'look up a file hash, URL or domain against 70+ engines', source: 'https://www.virustotal.com' },
          { name: 'AbuseIPDB', purpose: 'check whether a PUBLIC IP has abuse reports (rejects private 10.x lab IPs)', source: 'https://www.abuseipdb.com' },
          { name: 'Sample public IOC to practise on', purpose: 'EICAR test-file hash — a safe, universally-flagged sample so you see a real "malicious" verdict', source: '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f' },
        ],
        producesDeliverable: '05_IOC_Database.csv',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cr-w2-s3',
        where: 'Wazuh dashboard',
        path: ['dash', 'ATT&CK', 'report'],
        title: 'Use the ATT&CK mapping Wazuh gives you',
        description: 'Confirm the technique the SOC already tagged.',
        instruction: 'In the dashboard, open MITRE ATT&CK and confirm the tagged techniques match what your team actually ran.',
        instructionList: [
          'Open a tagged alert to see its technique ID.',
          'The SSH brute force maps to T1110 (Brute Force).',
          'The SQLi maps to T1190 (Exploit Public-Facing Application).',
          'Add the technique to the ATT&CK column of your IOC Database.',
        ],
        whatItMeans: 'Wazuh already tags many alerts with an ATT&CK technique — your job is to confirm it fits and record it against the indicator.',
        expectedOutput: 'Your IOC Database names at least two ATT&CK techniques (e.g. T1110, T1190) and the alert behind each.',
        outputHighlights: [
          { text: 'T1110', label: 'Brute Force \u2014 the technique ID you copy into the IOC Database, not the description' },
        ],
        walkthrough: {
          screen: 'mitre',
          title: 'MITRE ATT&CK module \u2014 turning alerts into technique IDs',
          markers: [
            { n: 1, label: 'Modules \u2192 MITRE ATT&CK. Wazuh has already tagged your alerts; you are reading its work, not mapping by hand.' },
            { n: 2, label: 'The technique name and its ID. The ID (T1110) is what goes in your IOC table.' },
            { n: 3, label: 'Click a technique to see the alerts behind it \u2014 that is your evidence for naming it.' },
          ],
        },
        usesForm: 'IOC Database',
        producesDeliverable: '05_IOC_Database.csv',
        isEvidenceStep: true,
        files: [
          { name: 'Wazuh MITRE ATT&CK module (docs)', purpose: 'how the dashboard maps alerts to ATT&CK techniques', source: 'https://documentation.wazuh.com/current/user-manual/capabilities/mitre-attack/index.html' },
        ],
        frameworks: ['NIST_CSF'],
      },
    ],
  },

  // ─────────────────────────── WEEK 3 · ASSESS ───────────────────────────
  {
    id: 'cb-w3',
    difficulty: 2,
    role: 'blue',
    week: 3,
    title: 'Read what the SOC already knows',
    objective: 'Find weaknesses from what the SOC already knows, before any scan.',
    frameworks: ['CVSS', 'NIST_800_115'],
    deliverables: ['11_SOC_Findings_Record.md'],
    prerequisites: ['The SOC’s vulnerability module has data (agents have run a scan cycle)', 'Dashboard access to Vulnerabilities + SCA'],
    estimatedTime: '70 min',
    learn: ['vulnerability detection', 'configuration assessment', 'detection coverage'],
    tools: ['Wazuh Vulnerabilities', 'Wazuh SCA'],
    definitionOfDone: ['The SOC’s built-in vulnerability list and SCA findings are captured with screenshots', 'Your SOC Findings Record names at least three findings with the fix each module states', 'You have answered whether the SOC alerted on recon, and what stayed silent'],
    handoff: [{ to: 'red', artifact: 'SOC Findings Record', note: 'Optional: your SOC findings give the ranked assessment more to work with — but it stands on its own without them.' }],
    steps: [
      {
        id: 'cb-w3-s1',
        where: 'Wazuh dashboard',
        path: ['ubuntu', 'known CVEs', 'dash'],
        title: 'Read the built-in vulnerability list',
        description: 'Wazuh checks installed software against CVE lists.',
        instruction: 'In the dashboard: Agents › your agent › Vulnerabilities. Filter Severity to Critical + High, then screenshot the list and name it like 20260726_Team07_wazuh_vulns.png — hand it to the Incident Responder for the Vulnerability Assessment.',
        whatItMeans: 'You get a vulnerability list without scanning anything.',
        expectedOutput: 'A screenshot of the Critical/High CVEs for your Ubuntu server, named and handed over.',
        walkthrough: {
          screen: 'vuln-sca',
          title: 'Vulnerabilities \u2014 filtering to what actually matters',
          markers: [
            { n: 1, label: 'Modules \u2192 Vulnerabilities, with your Ubuntu agent selected.' },
            { n: 2, label: 'Filter Severity to Critical and High. The unfiltered list is too long to act on.' },
            { n: 3, label: 'Click a CVE row to open the drawer with the affected package version and the fix.' },
          ],
        },
        files: [
          { name: 'Wazuh vulnerability detection (docs)', purpose: 'how the module builds the CVE list, and what to do if it is empty', source: 'https://documentation.wazuh.com/current/user-manual/capabilities/vulnerability-detection/index.html' },
        ],
        fixes: [
          { symptom: 'Vulnerabilities panel empty?', fix: 'The vulnerability detector runs on a schedule and must be enabled on the SOC manager. Give it one scan cycle.' },
          { symptom: 'Still empty after a full cycle?', fix: 'Ask the instructor or builder to confirm it is turned on — see the Week-0 build note.' },
        ],
        frameworks: ['CVSS'],
      },
      {
        id: 'cb-w3-s2',
        where: 'Wazuh dashboard',
        path: ['ubuntu', 'config score', 'dash'],
        title: 'Run the configuration check',
        description: 'SCA scores the server against hardening rules.',
        instruction: 'In the dashboard: Agents › your agent › SCA. Filter Result to Failed, then click any failed check to read its Rationale and Remediation (the exact fix to apply). Screenshot the score and three failed checks.',
        whatItMeans: 'SCA gives a pass/fail score, and every failed check comes with Remediation text — the fix you hand to the Incident Responder.',
        expectedOutput: 'The SCA score, three failed checks named, and the Remediation text for at least one of them.',
        files: [
          { name: 'Wazuh Security Configuration Assessment (docs)', purpose: 'how SCA scores the host against CIS-style hardening policies', source: 'https://documentation.wazuh.com/current/user-manual/capabilities/sec-config-assessment/index.html' },
        ],
        fixes: [
          { symptom: 'SCA panel empty?', fix: 'SCA is enabled by default but runs on a cycle. Wait for one scan, then refresh.' },
          { symptom: 'Still empty after a scan?', fix: 'Confirm the agent is Active and that the SCA policy for its OS is present — see the Week-0 build note.' },
        ],
        frameworks: ['CIS'],
      },
      {
        id: 'cb-w3-s3',
        where: 'Wazuh dashboard search bar',
        path: ['kali', 'scan', 'soc'],
        title: 'Watch the SOC catch a scan',
        description: 'See whether your monitoring catches recon.',
        instruction: 'Watch a recon scan land in the dashboard. You do not need to wait for anyone.',
        instructionList: [
          'From Kali, run a quick scan against your OWN pod, e.g. `nmap <UBUNTU_IP>`.',
          'Open Security events and set the time picker to Last 15 minutes.',
          'Search the Kali IP to see which alerts fired — and which recon was silent.',
          'If a teammate happens to be scanning, you can watch theirs instead.',
        ],
        commands: [
          { cmd: 'data.src_ip:<kali-ip> or data.srcip:<kali-ip>', explain: 'Both field families: the scan makes Suricata alerts (data.src_ip); auth/web attempts use data.srcip. Using both shows everything the scan tripped.' },
        ],
        whatItMeans: 'Tells you whether your monitoring would catch a real attacker doing recon. What stays silent is the finding.',
        expectedOutput: 'You list which alerts the scan set off — and anything it did that set off nothing.',
        troubleshooting: 'Empty table? 90% of the time it is the time picker — widen it to the scan window. Make sure you searched data.src_ip (Suricata), not only data.srcip.',
        frameworks: ['NIST_800_115'],
      },
      {
        id: 'cb-w3-s4',
        where: 'Deliverables page',
        title: 'File your SOC Findings Record',
        description: 'Write up what the SOC already knew, and what it missed.',
        instruction: 'Fill the SOC Findings Record — it already has the columns and worked example rows to copy.',
        instructionList: [
          'One row per finding: whether it came from Vulnerabilities or SCA, what it is, its severity or result, and the fix the module itself states.',
          'Attach the Critical/High vulnerability screenshot.',
          'Answer the detection question from the previous step: did the SOC alert on your recon, and what was silent?',
        ],
        whatItMeans:
          'Two lenses on one host. Vulnerabilities means "software with a known CVE"; SCA means "configured against best practice". A fully patched host can still fail a dozen SCA checks — and those usually have the cheaper fix.',
        expectedOutput: 'The SOC Findings Record filled in: at least three findings with their remediation, plus your honest answer on detection coverage.',
        outputHighlights: [
          { text: 'detection coverage', label: 'the part teams skip. Recon that raised no alert is a gap in your monitoring, and it belongs in the record.' },
        ],
        usesForm: 'SOC Findings Record',
        producesDeliverable: '11_SOC_Findings_Record.md',
        isEvidenceStep: true,
        frameworks: ['CVSS', 'CIS'],
      },
    ],
  },
  {
    id: 'cg-w3',
    difficulty: 3,
    role: 'grc',
    week: 3,
    title: 'Scan from the attacker\u2019s side',
    objective: 'Scan from Kali and confirm what\u2019s exposed.',
    frameworks: ['NIST_800_115', 'CVSS'],
    deliverables: ['12_Scan_Validation_Report.md'],
    prerequisites: ['Scope & rules of engagement understood — only scan your own pod', 'Kali reachable with nmap and nikto installed'],
    estimatedTime: '70 min',
    learn: ['port/version scanning', 'web scanning', 'validating what the SOC believes'],
    tools: ['Nmap', 'Nikto'],
    definitionOfDone: ['nmap + nikto output saved as files, hashed, and copied to the team folder', 'Your Scan Validation Report compares at least three services with a reason on each', 'A verdict is written — including "everything agreed" if that is what you found'],
    handoff: [{ to: 'red', artifact: 'Scan Validation Report', note: 'Optional: a finding you confirmed from outside ranks higher than one only inferred — but the ranking works without it.' }],
    steps: [
      {
        id: 'cg-w3-s1',
        where: 'Kali',
        path: ['kali', 'nmap', 'ubuntu'],
        title: 'Scan ports and versions',
        description: 'Ask each open port what it runs.',
        instruction: 'On Kali — save the output to a file with -oN so you can attach it as evidence, then copy it to the report machine.',
        commands: [
          { cmd: 'nmap --version', explain: 'Optional first check: confirm nmap is installed (it is pre-installed on Kali). Missing? sudo apt install -y nmap.' },
          { cmd: 'nmap -sV -p- -oN nmap_<team>.txt <UBUNTU_IP>', explain: 'Give it a few minutes — -p- checks all 65535 ports. -oN writes the results to nmap_<team>.txt.', flags: [{ flag: '-sV', meaning: 'Ask each open port what software/version it runs.' }, { flag: '-p-', meaning: 'Scan all ports, not just the common ones.' }, { flag: '-oN', meaning: 'Save the full output to a file (your evidence).' }] },
          { cmd: 'ssh student@<UBUNTU_IP> "mkdir -p ~/team-artifacts/week-3"', explain: 'Create the destination folder on the server FIRST — scp will not make missing parent folders and fails without this.' },
          { cmd: 'scp nmap_<team>.txt student@<UBUNTU_IP>:~/team-artifacts/week-3/', explain: 'Copy the output to your team folder so it goes in the Vulnerability Assessment.' },
        ],
        whatItMeans: 'The version behind each open port is what maps to a known CVE.',
        expectedOutput: `Starting Nmap 7.94 ( https://nmap.org ) at 2026-08-05 10:02 UTC
Nmap scan report for 10.10.100.7
Host is up (0.00042s latency).
Not shown: 65531 closed tcp ports (reset)

PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.4 (Ubuntu Linux; protocol 2.0)
80/tcp   open  http    Apache httpd 2.4.52 ((Ubuntu))
3306/tcp open  mysql   MySQL 8.0.35-0ubuntu0.22.04.1
1514/tcp open  unknown

Service detection performed. Nmap done: 1 IP address (1 host up) scanned in 94.28 seconds`,
        outputHighlights: [
          { text: 'open', label: 'the state you care about. "closed" and "filtered" ports are not attack surface; only open ones are.' },
          { text: 'PORT     STATE SERVICE VERSION', label: 'the header of the table you are actually after. Everything above it is scan bookkeeping.' },
          { text: 'OpenSSH 8.9p1 Ubuntu 3ubuntu0.4', label: 'a version string. This exact text is what you paste into NVD next week — "SSH is open" cannot be matched to a CVE, but this can.' },
          { text: 'Apache httpd 2.4.52', label: 'the web server behind DVWA. Cross-check it against what the Wazuh vulnerability module reported; disagreement between the two is itself a finding.' },
          { text: '1514/tcp open  unknown', label: 'your own Wazuh agent port. Recognising your monitoring as monitoring — rather than reporting it as a mystery service — is part of the job.' },
          { text: '1 IP address (1 host up)', label: 'confirms you scanned exactly one host. More than one means you strayed outside your own pod, which breaks the scope rule.' },
        ],
        verify: ['open'],
        files: [
          { name: 'nmap', purpose: 'the port/version scanner (pre-installed on Kali)', source: 'sudo apt install -y nmap' },
        ],
        fixes: [
          { symptom: 'scp says "No such file or directory"?', fix: 'The destination folder does not exist. Run the ssh mkdir line above first.' },
          { symptom: 'Scan shows all ports filtered, or the host down?', fix: 'You are scanning the wrong pod, or a firewall is dropping you. Confirm you can `ping <UBUNTU_IP>` first — and only ever scan your own team’s pod.' },
        ],
        producesDeliverable: '03_Vulnerability_Assessment.md',
        isEvidenceStep: true,
        frameworks: ['NIST_800_115'],
      },
      {
        id: 'cg-w3-s2',
        where: 'Kali',
        path: ['kali', 'nikto', 'ubuntu'],
        title: 'Scan the web app',
        description: 'Check the web server for known issues.',
        instruction: 'On Kali \u2014 save the output with -o so it becomes evidence.',
        commands: [
          { cmd: 'nikto -Version', explain: 'Optional first check: confirm nikto is installed (pre-installed on Kali). Missing? sudo apt install -y nikto.' },
          { cmd: 'nikto -h http://<UBUNTU_IP> -o nikto_<team>.txt -Format txt', explain: 'Checks for known dangerous files and outdated software; -o saves the findings to a file.' },
        ],
        whatItMeans: 'Nikto turns the web server\u2019s exposure into a list with reference IDs.',
        expectedOutput: `- Nikto v2.5.0
---------------------------------------------------------------------------
+ Target IP:          10.10.100.7
+ Target Port:        80
+ Start Time:         2026-08-05 10:14:33 (GMT0)
---------------------------------------------------------------------------
+ Server: Apache/2.4.52 (Ubuntu)
+ /: The anti-clickjacking X-Frame-Options header is not present.
+ /: The X-Content-Type-Options header is not set.
+ /dvwa/: Directory indexing found.
+ /dvwa/config/: Directory indexing found.
+ 1 host(s) tested`,
        outputHighlights: [
          { text: '+ Server', label: 'every finding line starts with a "+". This first one is the banner — proof Nikto reached the web server rather than failing to connect.' },
          { text: 'Apache/2.4.52 (Ubuntu)', label: 'the same version nmap reported. Two tools agreeing is worth stating in the assessment — it is corroboration, not duplication.' },
          { text: 'X-Frame-Options header is not present', label: 'a missing security header. Low severity on its own, but it is a real finding with a fix, so it belongs in the report.' },
          { text: '/dvwa/config/: Directory indexing found', label: 'the serious one. A browsable config directory can expose database credentials — rank this above the header findings.' },
          { text: '+ 1 host(s) tested', label: 'the scan finished rather than timing out. A truncated run means your finding list is incomplete.' },
        ],
        verify: ['+ Server'],
        files: [
          { name: 'nikto', purpose: 'the web-server scanner (pre-installed on Kali; install it if missing)', source: 'sudo apt install -y nikto' },
        ],
        troubleshooting: 'nikto: command not found? Install it with `sudo apt install -y nikto`. Connection refused? Confirm the web app is up \u2014 open http://<UBUNTU_IP> in a browser first, and only scan your own team\u2019s pod.',
        producesDeliverable: '03_Vulnerability_Assessment.md',
        isEvidenceStep: true,
        frameworks: ['NIST_800_115'],
      },
      {
        id: 'cg-w3-s3',
        where: 'Your notes',
        path: ['report', 'compare', 'report'],
        title: 'Compare with the SOC\u2019s list',
        description: 'Where scan and SOC disagree, one is wrong.',
        instruction: 'Fill the Scan Validation Report — it already has the six columns and worked example rows to copy.',
        instructionList: [
          'One row per service. The nmap version comes from your -sV output; the Wazuh package version comes from the Vulnerabilities module.',
          'Mark agree or disagree, then say which source you trust for that row and why.',
          'Paste the key scan lines, and record the SHA-256 of the nmap output you saved.',
          'Write the verdict. If every source agreed, say so explicitly — that is a valid result.',
        ],
        whatItMeans: 'The two sources measure different things: Wazuh reads the installed package version, nmap reads whatever the running service announces. A disagreement usually means a package was upgraded but the service never restarted.',
        expectedOutput: 'The Scan Validation Report filled in: at least three services compared with a reason on each, plus a written verdict.',
        outputHighlights: [
          { text: 'at least three services compared', label: 'one row is an observation; three is a comparison you can draw a conclusion from.' },
        ],
        usesForm: 'Scan Validation Report',
        producesDeliverable: '12_Scan_Validation_Report.md',
        isEvidenceStep: true,
        frameworks: ['CVSS'],
      },
    ],
  },
  {
    id: 'cr-w3',
    difficulty: 2,
    role: 'red',
    week: 3,
    title: 'Rank the risk & write the fix plan',
    objective: 'Rank by risk and write a fix plan someone could follow.',
    frameworks: ['CVSS', 'NIST_800_115'],
    deliverables: ['03_Vulnerability_Assessment.md'],
    prerequisites: ['Your own scan output and/or the SOC’s Vulnerabilities + SCA findings for your pod', 'Access to the Vulnerability Assessment form'],
    estimatedTime: '45 min',
    learn: ['CVSS scoring', 'risk ranking', 'remediation planning'],
    tools: ['CVE lookup'],
    definitionOfDone: ['Every finding plotted on the risk matrix', 'Each fix has an owner and a date'],
    steps: [
      {
        id: 'cr-w3-s1',
        where: 'Your notes',
        path: ['report', 'CVE lookup', 'report'],
        title: 'Record each finding with its CVE and severity',
        description: 'CVEs from Wazuh, versions from the scan.',
        instruction: 'Fill the Vulnerability Assessment — it already has the columns and a worked example row to copy. Each finding needs a CVE and its CVSS score, or a written reason where there is no CVE.',
        instructionList: [
          'To find the CVE, paste the software and version into NVD search.',
          'Use either the package + version from Wazuh Vulnerabilities (e.g. "openssl 1.1.1f") or the service banner from your nmap -sV output (e.g. "Apache httpd 2.4.41").',
          'NVD prints the official CVSS base score on each CVE page — copy that rather than re-scoring by hand.',
          'Only open the CVSS calculator when there is no published CVE.',
        ],
        usesForm: 'Vulnerability Assessment',
        whatItMeans: 'No CVE means it’s a misconfiguration (usually an SCA failed check) — say so, and score it with the calculator or a written reason.',
        expectedOutput: 'Every finding has a CVE with its NVD CVSS score, or a written reason for its severity.',
        producesDeliverable: '03_Vulnerability_Assessment.md',
        isEvidenceStep: true,
        fixes: [
          { symptom: 'NVD returns nothing for a version?', fix: 'Search just the product name, then match your version against the "Known Affected" range on each result.' },
          { symptom: 'Genuinely no CVE for this finding?', fix: 'Then it is a misconfiguration, not a vulnerability. Write it up with a reason and score it yourself.' },
        ],
        files: [
          { name: 'NVD CVE lookup', purpose: 'find a CVE’s details and official CVSS score', source: 'https://nvd.nist.gov/vuln/search' },
          { name: 'CVSS v3.1 calculator (FIRST)', purpose: 'score a finding yourself when needed', source: 'https://www.first.org/cvss/calculator/3.1' },
        ],
        frameworks: ['CVSS'],
      },
      {
        id: 'cr-w3-s2',
        where: 'Your notes',
        path: ['report', 'rank + fix', 'report'],
        title: 'Rank by risk, then write the fix plan',
        description: 'Turn findings into an ordered, actionable plan.',
        instruction: 'In the Vulnerability Assessment — the same form as the previous step — plot each finding by likelihood × impact, then give it a fix, an owner and a target date.',
        instructionList: [
          'SCA supplies the fix text for config findings, and the form has a worked example row for the ranking.',
          'Likelihood is how reachable the flaw is: High = reachable from the network with no login; Medium = needs a local account or a user to click something; Low = needs physical access or an unlikely chain.',
          'Impact is what the attacker gets: High = full data loss, or the attacker gets admin; Medium = one service down, or limited data exposed; Low = cosmetic, or no real data at risk.',
          'The risk-matrix diagram on the Deliverables page draws these two axes as a grid — read the cell where your two ratings meet.',
        ],
        whatItMeans: 'Risk is severity × exposure — your top risk is not your top CVSS number: an open, unauthenticated web flaw outranks a local one behind a login. A fix with no owner and no date does not get done.',
        expectedOutput: 'Every finding is ranked by risk (likelihood × impact) and carries a fix, an owner and a date.',
        usesForm: 'Vulnerability Assessment',
        producesDeliverable: '03_Vulnerability_Assessment.md',
        isEvidenceStep: true,
        frameworks: ['CVSS', 'NIST_800_115'],
      },
    ],
  },

  // ─────────────────────────── WEEK 4 · RESPOND ───────────────────────────
  {
    id: 'cb-w4',
    difficulty: 2,
    role: 'blue',
    week: 4,
    title: 'Find the incident',
    objective: 'Find the incident and mark the start time.',
    frameworks: ['NIST_800_61'],
    deliverables: ['08_Detection_Record.md'],
    prerequisites: ['You have run this week’s attack against your OWN pod (or the instructor triggers a class-wide one) — you know roughly when it started', 'Dashboard access to search the incident window'],
    estimatedTime: '45 min',
    learn: ['incident detection', 'scoping'],
    tools: ['Wazuh dashboard'],
    handoff: [{ to: 'grc', artifact: 'Detection record', note: 'Optional: share your detection record — it gives a teammate the first alert and attacker IP to start from.' }],
    definitionOfDone: ['The first-alert time and attacker IP are recorded', 'The Detection Record is filled and handed to the Threat Hunter'],
    steps: [
      {
        id: 'cb-w4-s1',
        where: 'Wazuh dashboard',
        path: ['ubuntu', 'first alert', 'dash'],
        title: 'Find the first alert',
        description: 'The earliest related alert is your start time.',
        instruction: 'In the dashboard: Agents › your agent › Security events. Set the time picker to the incident window, then sort by Time oldest-first and read down to the first attacker event.',
        commands: [
          { cmd: 'rule.level:>=5', explain: 'Cut the routine noise but keep the early, low-severity signs. First contact is often a level-5 event, so filtering at >=7 would hide your real incident start.' },
        ],
        whatItMeans: 'Everything else in the incident is measured from this timestamp.',
        expectedOutput: `Security events — sorted Time ascending, filter rule.level:>=5

Time (UTC)            rule.level  rule.description                         data.srcip
2026-08-05 11:02:14   5           Apache: client sent malformed request    10.10.30.7
2026-08-05 11:02:41   10          Multiple web attack attempts (SQLi)      10.10.30.7
2026-08-05 11:03:02   7           SQL injection attempt in URL             10.10.30.7`,
        outputHighlights: [
          { text: '2026-08-05 11:02:14', label: 'the earliest row, and therefore your incident start time. Copy it exactly — every duration in the report is measured from here.' },
          { text: 'rule.level', label: 'the column you filtered on. Keep it at >=5: the level-5 malformed request above is the attacker’s first contact, and >=7 would have hidden it.' },
          { text: '10.10.30.7', label: 'the attacker address, the same on every row. This is the IP you hand the Hunter and search on in the next step.' },
        ],
        troubleshooting: 'Nothing shows? 90% of the time it is the time picker — widen it to cover when the attack ran.',
        producesDeliverable: '08_Detection_Record.md',
        isEvidenceStep: true,
        frameworks: ['NIST_800_61'],
      },
      {
        id: 'cb-w4-s2',
        where: 'Wazuh dashboard search bar',
        path: ['dash', 'search attacker IP', 'you'],
        title: 'Check how far it spread',
        description: 'Did the attacker hit other teams too?',
        instruction: 'In the dashboard search bar, search the attacker IP without picking an agent.',
        commands: [
          { cmd: 'data.src_ip:<attacker-ip> or data.srcip:<attacker-ip>', explain: 'Across all agents — both field forms so Suricata (data.src_ip) and auth/web (data.srcip) events all show. Leadership always asks how far it went.' },
        ],
        whatItMeans: 'Scope is one of the first questions leadership asks.',
        expectedOutput: 'You can say whether the attacker hit only your pod or several.',
        frameworks: ['NIST_800_61'],
      },
      {
        id: 'cb-w4-s3',
        where: 'Your notes',
        path: ['you', 'handoff', 'report'],
        title: 'Hand the Hunter a clean start — fill the Detection Record',
        usesForm: 'Detection Record',
        description: 'Give them what they need to just start.',
        instruction: 'Fill the Detection Record — it already has the fields and a worked example to copy.',
        instructionList: [
          'The first alert and its time as YYYY-MM-DD HH:MM — the incident start you found in step 1.',
          'The attacker IP.',
          'What tipped you off — the rule that fired.',
          'The affected hosts.',
          'Who you escalated to.',
        ],
        whatItMeans: 'A clean handoff means the Hunter can begin without follow-up questions.',
        expectedOutput: 'The Hunter can begin without asking you follow-up questions.',
        producesDeliverable: '08_Detection_Record.md',
        isEvidenceStep: true,
        frameworks: ['NIST_800_61'],
      },
    ],
  },
  {
    id: 'cg-w4',
    difficulty: 3,
    role: 'grc',
    week: 4,
    title: 'Rebuild the attack',
    objective: 'Put the attacker’s actions back in order — one clear timeline, each row backed by a log line.',
    frameworks: ['NIST_800_61'],
    deliverables: ['04_Incident_Response_Report.md'],
    prerequisites: ['You can find the attack window in the SOC (sort Security events oldest-first to find the attacker IP)', 'Dashboard access and the ability to SSH in to read the server’s access.log'],
    estimatedTime: '60 min',
    learn: ['timeline reconstruction', 'log forensics'],
    tools: ['Wazuh', 'Apache access log'],
    definitionOfDone: ['Every timeline row points to the search or log line it came from'],
    handoff: [{ to: 'red', artifact: 'Timeline', note: 'Optional: share your timeline — a teammate can contain and report from it; they can also rebuild their own.' }],
    steps: [
      {
        id: 'cg-w4-s1',
        where: 'Wazuh dashboard search bar',
        path: ['dash', 'sort by time', 'report'],
        title: 'Pull every event from the attacker',
        description: 'Sort by time to get the attack sequence.',
        instruction: 'In the dashboard search bar, search the attacker IP and sort by time.',
        commands: [
          { cmd: 'data.src_ip:<attacker-ip> or data.srcip:<attacker-ip>', explain: 'Both field forms so no attacker event is hidden. Sort by Time and you have the attack sequence directly.' },
        ],
        whatItMeans: 'The ordered event list is the skeleton of your timeline.',
        expectedOutput: 'An ordered list of events from first contact onward.',
        frameworks: ['NIST_800_61'],
      },
      {
        id: 'cg-w4-s2',
        where: 'Your Ubuntu server — SSH in',
        path: ['ubuntu', 'access log', 'report'],
        title: 'Read the web server\u2019s own log',
        description: 'The exact request the attacker sent.',
        instruction: 'On your Ubuntu server — SSH in.',
        commands: [
          { cmd: 'ssh student@<UBUNTU_IP>' },
          { cmd: 'sudo grep -iE "union|select|\\.\\./|<script" /var/log/apache2/access.log | tail -40', explain: 'Pull the injection/traversal attempts straight from the access log.' },
        ],
        whatItMeans: 'You read the injection instead of guessing it.',
        expectedOutput: `student@team07-ubuntu:~$ sudo grep -iE "union|select|\\.\\./|<script" /var/log/apache2/access.log | tail -40
10.10.30.7 - - [05/Aug/2026:11:03:02 +0000] "GET /dvwa/vulnerabilities/sqli/?id=1'+UNION+SELECT+user,password+FROM+users--&Submit=Submit HTTP/1.1" 200 4821 "-" "Mozilla/5.0"
10.10.30.7 - - [05/Aug/2026:11:03:05 +0000] "GET /dvwa/vulnerabilities/sqli/?id=1'+OR+'1'='1&Submit=Submit HTTP/1.1" 200 1136 "-" "Mozilla/5.0"`,
        outputHighlights: [
          { text: 'UNION+SELECT+user,password+FROM+users', label: 'the payload itself. Quote this in the report — it names exactly what the attacker tried to read (the users table, with passwords).' },
          { text: '200', label: 'the HTTP status. 200 means the server answered the injected request rather than rejecting it — a strong sign the injection was processed, not blocked.' },
          { text: '10.10.30.7', label: 'the source, matching the attacker IP from the detection record. Same address on both lines ties the log evidence back to your timeline.' },
        ],
        verify: ['UNION'],
        producesDeliverable: '04_Incident_Response_Report.md',
        isEvidenceStep: true,
        frameworks: ['NIST_800_61'],
      },
      {
        id: 'cg-w4-s3',
        where: 'Wazuh dashboard',
        path: ['ubuntu', 'file changes', 'dash'],
        title: 'Check the endpoint to see if it worked',
        description: 'A changed file shows the attack succeeded.',
        instruction: 'In the dashboard: your agent › Integrity monitoring. Look for a new or changed file in the web root around the attack time.',
        whatItMeans: 'Network data shows the attempt; a new or changed file shows it succeeded — you need both to claim compromise.',
        expectedOutput: 'A new/changed file lines up in time with the attack — or you can show nothing did, meaning it failed.',
        files: [
          { name: 'Wazuh File Integrity Monitoring (docs)', purpose: 'how FIM reports file changes, and which paths it watches', source: 'https://documentation.wazuh.com/current/user-manual/capabilities/file-integrity/index.html' },
        ],
        fixes: [
          { symptom: 'No file-change events at all?', fix: 'FIM (syscheck) has to be watching the web root (/var/www/html/dvwa). If the builder did not add it, changes will never show — see the Week-0 build note.' },
          { symptom: 'FIM is watching and still nothing changed?', fix: 'That is a valid result, not a failure. The attack did not write a file, so report it as attempted-but-not-succeeded.' },
        ],
        frameworks: ['NIST_800_61'],
      },
      {
        id: 'cg-w4-s4',
        where: 'Deliverables — Incident Response Report',
        path: ['report', 'time · event · source', 'report'],
        title: 'Write the timeline',
        description: 'One row per step of the attack.',
        instruction: 'Fill the timeline table in the Incident Response Report — it already has the columns time · event · source · tool · note, and worked example rows.',
        instructionList: [
          'One row per step of the attack, in time order.',
          'Each row cites the search or log line it came from.',
        ],
        usesForm: 'Incident Response Report',
        whatItMeans: 'The ordered, cited timeline is what the Incident Responder contains and reports from.',
        expectedOutput: 'Every row points to the search or log line it came from.',
        producesDeliverable: '04_Incident_Response_Report.md',
        isEvidenceStep: true,
        frameworks: ['NIST_800_61'],
      },
    ],
  },
  {
    id: 'cg-w4b',
    difficulty: 2,
    role: 'grc',
    week: 4,
    title: 'Debrief the team (capstone)',
    objective: 'Assemble the one-page executive debrief and lessons learned from the whole four-week engagement.',
    frameworks: ['NIST_CSF'],
    deliverables: ['09_Executive_Debrief.md'],
    prerequisites: ['Your weekly reports — Detection Record, Incident Response, Vulnerability Assessment (your own, or a teammate’s if shared)', 'Use the seeded example figures if a report is missing, so MTTD/MTTR still compute'],
    estimatedTime: '60 min',
    learn: ['writing for leadership', 'security metrics (MTTD/MTTR)', 'lessons learned'],
    tools: ['your weekly reports'],
    definitionOfDone: ['An executive summary a non-technical manager can act on', 'Headline metrics and lessons learned are filled'],
    steps: [
      {
        id: 'cg-w4b-s1',
        where: 'Your weekly reports',
        path: ['report', 'gather', 'report'],
        title: 'Gather the numbers and the story',
        description: 'Pull the headline facts from the four weeks of work.',
        instruction: 'Open your team reports and note the exact numbers you will need.',
        instructionList: [
          'First-alert (detection) time — Detection Record (08).',
          'Containment time — Incident Response Report (04). You need both of these for MTTD and MTTR.',
          'Count of High/Critical risks still open — Vulnerability Assessment (03).',
          'One or two things that went well, and one or two that went badly.',
        ],
        whatItMeans: 'The debrief is a summary of work already done — you are collecting facts from the four reports, not doing new analysis.',
        expectedOutput: 'A short list of numbers (detection time, containment time, open-risk count) and notes ready to drop into the debrief.',
        frameworks: ['NIST_CSF'],
      },
      {
        id: 'cg-w4b-s2',
        where: 'Your notes',
        path: ['report', 'write summary', 'report'],
        title: 'Write the executive debrief',
        description: 'The one page leadership actually reads.',
        instruction: 'Fill the Executive Debrief and Lessons Learned form — it already has the sections and a worked example to copy: a plain-English summary, the headline metrics, and concrete lessons and recommendations with owners.',
        instructionList: [
          'MTTD (mean time to detect) = first-alert time (Detection Record) − attack-start time.',
          'MTTR (mean time to respond) = containment time (Incident Response Report) − first-alert time.',
          'Write each as a duration, e.g. "detected in 9 min, contained 12 min later".',
        ],
        usesForm: 'Executive Debrief & Lessons Learned',
        whatItMeans: 'This is the wrap-up a manager reads instead of the full reports — clear, short, and honest about what to improve.',
        expectedOutput: 'A short debrief a non-technical manager could read and act on.',
        producesDeliverable: '09_Executive_Debrief.md',
        isEvidenceStep: true,
        troubleshooting: 'MTTD/MTTR come out negative or huge? Check all three times are in the same timezone and that they run in order — attack-start before first-alert before containment.',
        frameworks: ['NIST_CSF'],
      },
    ],
  },
  {
    id: 'cr-w4',
    difficulty: 3,
    role: 'red',
    week: 4,
    title: 'Contain, preserve & report',
    objective: 'Stop the attack, save the evidence with a hash, and write the short report leadership reads.',
    frameworks: ['NIST_800_61'],
    deliverables: ['04_Incident_Response_Report.md'],
    prerequisites: ['You can SSH in to the Ubuntu pod as the student user, find the attacker IP in the SOC, and read access.log', 'The Incident Response Report form (its timeline table seeds example rows to fill)'],
    estimatedTime: '60 min',
    learn: ['containment', 'evidence integrity', 'incident reporting'],
    tools: ['ufw', 'sha256sum'],
    definitionOfDone: ['Containment is timestamped', 'Evidence is hashed', 'A 5-sentence manager summary exists'],
    handoff: [{ to: 'blue', artifact: 'Incident report', note: 'File the report; leadership reads the summary. Optional: share it for the team debrief.' }],
    steps: [
      {
        id: 'cr-w4-s1',
        where: 'Your Ubuntu server — SSH in',
        path: ['you', 'block attacker', 'ubuntu'],
        title: 'Contain it, and log what you did and when',
        description: 'Stop the attack; record the action and its time.',
        instruction: 'SSH in, block the attacker at the top of the rule list, note the exact time, then take the web app offline if it was the way in.',
        commands: [
          { cmd: 'sudo ufw insert 1 deny from <attacker-ip>', explain: 'Block the attacker FIRST in the list — a plain `ufw deny` lands after the earlier `allow 22` rule and would not take effect.' },
          { cmd: 'sudo ufw status numbered', explain: 'Confirm the DENY rule is rule #1.' },
          { cmd: 'sudo systemctl stop apache2', explain: 'If the web app is the way in, take it offline.' },
        ],
        whatItMeans: 'An untimed action can\u2019t be defended later — the log of it matters as much as the action.',
        expectedOutput: `student@team07-ubuntu:~$ sudo ufw status numbered
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] Anywhere                   DENY IN     10.10.30.7
[ 2] 22/tcp                     ALLOW IN    Anywhere
[ 3] 80/tcp                     ALLOW IN    Anywhere`,
        outputHighlights: [
          { text: 'DENY', label: 'the block itself. UFW stops at the first rule that matches, which is why this has to sit above the ALLOW rules rather than below them.' },
          { text: '[ 1]', label: 'the position, and it must be 1. A plain `ufw deny` appends to the end, lands under the ALLOW on line 2, and silently never fires.' },
          { text: '10.10.30.7', label: 'the attacker you are blocking. Check it against the source IP in your alerts — blocking the wrong address contains nothing.' },
          { text: '22/tcp                     ALLOW IN', label: 'SSH is still open. Confirm this before you walk away; a containment rule that locks you out of the machine is its own incident.' },
        ],
        verify: ['DENY'],
        troubleshooting: 'Still seeing Suricata alerts from the attacker? That is expected — Suricata reads the wire before the firewall drops the packet. What should stop is new Apache/authentication alerts. Record your containment timestamp either way.',
        producesDeliverable: '04_Incident_Response_Report.md',
        isEvidenceStep: true,
        frameworks: ['NIST_800_61'],
      },
      {
        id: 'cr-w4-s2',
        where: 'Your Ubuntu server — SSH in',
        path: ['ubuntu', 'copy + hash', 'report'],
        title: 'Save the evidence with a hash',
        description: 'Prove the file hasn\u2019t changed since collection.',
        instruction: 'SSH in, copy the log into your week-4 evidence folder, TAKE OWNERSHIP of the copy (it was root-owned), then hash it and verify.',
        commands: [
          { cmd: 'mkdir -p ~/team-artifacts/week-4', explain: 'The one folder all week-4 evidence lives in.' },
          { cmd: 'sudo cp /var/log/apache2/access.log ~/team-artifacts/week-4/', explain: 'Copy the attacker’s requests out of the live log.' },
          { cmd: 'sudo chown student:student ~/team-artifacts/week-4/access.log', explain: 'cp ran as root, so the copy is root-owned — take ownership or the next two commands fail with Permission denied.' },
          { cmd: 'sha256sum ~/team-artifacts/week-4/access.log > ~/team-artifacts/week-4/access.log.sha256', explain: 'Hash it the moment you collect it.' },
          { cmd: 'sha256sum -c ~/team-artifacts/week-4/access.log.sha256', explain: 'Verify the hash — it should print access.log: OK.' },
        ],
        whatItMeans: 'A hash proves the file hasn’t changed since you took it.',
        expectedOutput: `student@team07-ubuntu:~$ sha256sum ~/team-artifacts/week-4/access.log > ~/team-artifacts/week-4/access.log.sha256
student@team07-ubuntu:~$ cat ~/team-artifacts/week-4/access.log.sha256
9f2c4e1a7b83d05f6c1e94a2b7d8e30f5a6c1b9d4e2f70a8c3b5d1e6f9a2c4b7  /home/student/team-artifacts/week-4/access.log
student@team07-ubuntu:~$ sha256sum -c ~/team-artifacts/week-4/access.log.sha256
/home/student/team-artifacts/week-4/access.log: OK`,
        outputHighlights: [
          { text: '9f2c4e1a7b83d05f6c1e94a2b7d8e30f5a6c1b9d4e2f70a8c3b5d1e6f9a2c4b7', label: 'the hash. Copy this exact string into your chain-of-custody log — yours will differ, and a hash recorded later than collection proves nothing.' },
          { text: 'OK', label: 'the file still matches the hash you took. This is the line that makes the evidence defensible; FAILED means it changed after collection and can no longer be relied on.' },
          { text: '/home/student/team-artifacts/week-4/access.log', label: 'your copy, not the live log. Never hash a file the server is still writing to — the hash is stale the moment you take it.' },
        ],
        verify: ['OK'],
        producesDeliverable: '04_Incident_Response_Report.md',
        isEvidenceStep: true,
        tree: {
          label: '~/team-artifacts/week-4/',
          kind: 'root',
          children: [
            { label: 'access.log', kind: 'file' },
            { label: 'access.log.sha256', kind: 'file' },
            { label: '20260731_Team07_first_alert.png', kind: 'file', format: 'img' },
          ],
        },
        frameworks: ['NIST_800_61'],
      },
      {
        id: 'cr-w4-s3',
        where: 'Your notes',
        path: ['report', 'write up', 'report'],
        title: 'Write the report and a plain summary',
        description: 'The report leadership reads.',
        instruction: 'Fill the Incident Response Report. The form seeds worked example rows you can copy.',
        instructionList: [
          'Fill the timeline table from your own SOC search, or use a teammate’s timeline if they shared one.',
          'Add the evidence you collected.',
          'Root cause = the one weakness that let it in. Trace the timeline back to the first successful step (e.g. "DVWA SQL-injection on an unpatched app with no WAF"), not just the last alert.',
          'Fixes = the remediations from the Vulnerability Assessment (03) that would have blocked that root cause.',
          'Close with a 5-sentence summary a manager could read.',
        ],
        usesForm: 'Incident Response Report',
        whatItMeans: 'The summary is five sentences a manager can act on: what happened, what was hit, what you did, the impact, what you need. Root cause is the one thing to fix so it cannot happen again.',
        expectedOutput: 'Someone outside your team can read the summary and explain the incident back to you correctly.',
        producesDeliverable: '04_Incident_Response_Report.md',
        isEvidenceStep: true,
        frameworks: ['NIST_800_61'],
      },
    ],
  },
];

export const CYSA_PLUS: Course = {
  id: 'cysa-plus',
  title: 'CySA+ SOC Capstone',
  slug: 'cysa-plus',
  vendor: 'CompTIA',
  certification: 'CySA+ (CS0-003)',
  level: 'professional',
  lifecyclePath: [
    { label: 'Detect', detail: 'An alert fires in the SOC — something looks off.' },
    { label: 'Triage', detail: 'SOC Analyst: real threat or noise? Escalate the real ones.' },
    { label: 'Investigate', detail: 'Threat Hunter: prove what happened in the logs and packets.' },
    { label: 'Threat Intel', detail: 'Look up the indicators (IPs, files, hashes) against known threats.' },
    { label: 'Scope', detail: 'How far did it spread? Which machines and accounts are hit?' },
    { label: 'Contain', detail: 'Stop the attack — block the attacker, isolate the host.' },
    { label: 'Recover', detail: 'Clean up, restore service, and close the hole that let it in.' },
    { label: 'Report', detail: 'Incident Responder: timeline, evidence, and a plain summary leadership can act on.' },
  ],
  noGatekeeping: true,
  audience: 'Run a SOC — monitor, detect, investigate, and respond on a live Wazuh stack (CS0-003).',
  description:
    'Four weeks running a live SOC: deploy monitoring, investigate real attacks, assess risk, and handle an incident end to end. Three rotating analyst roles on a shared Wazuh stack.',
  roles,
  weeks,
  gates,
  tasks,
  isSeed: true,
  version: 2,
  locked: false,
  teamCount: 16,
  teamCapacity: 6,
};

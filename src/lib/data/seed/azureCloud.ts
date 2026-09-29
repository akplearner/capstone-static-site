import type { Course, Step, Task, WeekDef } from '../../types';
import { CLOUD_FILES, CLOUD_FORMS, cloudTask, cloudWeeks, setupWeek, sliceCourse, stepKit, type WeekPlan } from './cloudKit';

/**
 * Azure Cloud Capstone (R87) — "Run a small company in Azure".
 *
 * Twelve weeks, four roles, one task each per week, no locks. The team builds
 * a real environment (a website with HTTPS, a serverless visitor counter on
 * Cosmos DB, one small Linux VM), then operates, secures, recovers, codifies
 * and hands it over. The final environment is `azuredeploy.json`
 * (`src/lib/cloud/azureIac.ts`); the Guide draws it week by week.
 *
 * Shape and budgets are shared with the AWS course (`cloudKit.ts`), so the
 * two read as one course on two platforms. Commands use shell variables
 * (`RG=rg-capstone-team01`) — each step sets the ones it uses, so any step
 * runs in a fresh Cloud Shell.
 *
 * Cost: the $5 budget is set in Week 1, before anything can cost money, and
 * every step that starts the VM ends with the VM deallocated.
 */

const FW = ['AZ_900', 'WAF'];
const { portal, cli, record } = stepKit(FW, 'Azure Cloud Shell (Bash)');
const P = 'az';

const VARS = 'RG=rg-capstone-team01; VM=vm-tools-team01';

const PLANS: WeekPlan[] = [
  { n: 1, title: 'Foundation', theme: 'Names, guardrails, a network', objective: 'Set the standard and the $5 budget, then lay the network everything else sits in.',
    milestone: 'A budget alerts at $4, the resource group and VNet exist with the agreed names and tags, and the team repo is live.',
    labels: ['Set the naming standard and the budget', 'Create the resource group and VNet', 'Open the team repository and board', 'Put an NSG on the subnet'] },
  { n: 2, title: 'Website and VM', theme: 'First things people can reach', objective: 'Publish the company website over HTTPS and bring up one small Linux VM, reachable only from you.',
    milestone: 'The site loads over HTTPS, the B1s VM runs in snet-app, SSH works from your IP only, and the VM is deallocated.',
    labels: ['Write the architecture document and cost', 'Deploy the tools VM', 'Publish the website with HTTPS', 'Allow SSH from your IP only'] },
  { n: 3, title: 'Serverless API', theme: 'A counter behind the site', objective: 'Add a visitor counter: a Function reading and writing Cosmos DB, callable only from your site.',
    milestone: 'The page shows a live visitor count, CORS admits only your site, and no key appears in the browser.',
    labels: ['Draw the request flow with real URLs', 'Create Cosmos DB and seed the counter', 'Build the visitor-counter Function', 'Lock CORS and keep secrets out'] },
  { n: 4, title: 'Operate', theme: 'Watch it, break it, fix it', objective: 'Watch cost and errors, then work one failure from symptom to root cause and prevention.',
    milestone: 'An alert emails on Function errors, one incident is written up layer by layer, and spend is reported.',
    labels: ['Report the cost to date', 'Alert on Function errors', 'Find a failure in Application Insights', 'Work one incident layer by layer'] },
  { n: 5, title: 'Identity', theme: 'Least privilege, no secrets', objective: 'Give people and the Function exactly the access they need, and remove the last stored secret.',
    milestone: 'The Function reaches Cosmos DB with its managed identity, a group holds Reader, and a denial is proved.',
    labels: ['Write the access matrix', 'Grant a group Reader on the group', 'Switch the Function to its identity', 'Prove an access is denied'] },
  { n: 6, title: 'Networking', theme: 'Segment it, close the door', objective: 'Add a management subnet, remove SSH entirely, and prove every path with Network Watcher.',
    milestone: 'Two subnets with their own NSGs, no inbound management port, admin through Run Command, every path tested.',
    labels: ['Write the network design document', 'Add the management subnet', 'Trace the request paths', 'Remove SSH and use Run Command'] },
  { n: 7, title: 'Server Admin', theme: 'Disks, patches, baselines', objective: 'Run the VM like production: right-size it, add a data disk, patch it, and baseline it.',
    milestone: 'A data disk is mounted at /data, patches are installed, the baseline and runbook are written, and the VM is off.',
    labels: ['Decide the VM size', 'Attach and mount a data disk', 'Patch the VM with Update Manager', 'Baseline the VM and write the runbook'] },
  { n: 8, title: 'Backup and Recovery', theme: 'Prove you can get it back', objective: 'Set recovery targets, restore a disk and a web file, and time a recovery drill.',
    milestone: 'RPO and RTO per asset, a disk restored from a snapshot, a deleted file recovered, and a timed drill.',
    labels: ['Set RPO and RTO per asset', 'Restore a disk from a snapshot', 'Recover a deleted web file', 'Run a timed recovery drill'] },
  { n: 9, title: 'Infrastructure as Code', theme: 'The environment, as a file', objective: 'Read the environment as an ARM template, fill the starter, preview with what-if, deploy to dev.',
    milestone: 'The starter template is complete, what-if previewed it, dev deployed, and the parameters are recorded.',
    labels: ['Map the template to the diagram', 'Inventory everything with the CLI', 'Fill the starter and deploy to dev', 'Write parameter files and validate'] },
  { n: 10, title: 'CI/CD', theme: 'Deploy from a pipeline', objective: 'Deploy through GitHub Actions with no stored keys, under a reviewed change request.',
    milestone: 'Main is protected, the pipeline signs in with OIDC and deploys the template, and a rollback was tested.',
    labels: ['Write and approve the change request', 'Protect main and add an environment', 'Deploy from GitHub Actions', 'Sign in with OIDC and test rollback'] },
  { n: 11, title: 'Governance', theme: 'Rules the platform enforces', objective: 'Enforce the tag standard with Policy, read the audit log, review posture and cost.',
    milestone: 'Untagged resources are denied, audit events are read, three findings are owned, and cost is broken down.',
    labels: ['Review cost by service', 'Require the owner tag with Policy', 'Query the Activity Log', 'Review posture in Defender for Cloud'] },
  { n: 12, title: 'Handover', theme: 'Survive it, then hand it on', objective: 'Recover, fix and contain under pressure, then hand the environment over.',
    milestone: 'Three scenarios survived and recorded, and the handover package is signed off.',
    labels: ['Assemble the handover package', 'Rebuild the environment from the template', 'Fix an app failure through CI', 'Contain a security incident'] },
];

/** One role's task for one week. */
function T(
  week: number,
  role: string,
  title: string,
  objective: string,
  minutes: number,
  learn: string[],
  done: string[],
  steps: Step[]
): Task {
  return cloudTask({ id: `${P}-w${week}-${role}`, role, week, title, objective, minutes, file: CLOUD_FILES[week - 1], frameworks: FW, learn, done, steps });
}
const s = (week: number, role: string, n: number) => `${P}-w${week}-${role}-s${n}`;
const rec = (week: number, role: string, section: string, actions: string[], why: string) =>
  record(s(week, role, 9), CLOUD_FORMS[week - 1], CLOUD_FILES[week - 1], section, actions, why);

const DEALLOCATE = (week: number, role: string): Step =>
  cli(s(week, role, 8), 'Deallocate the VM', 'Stop the VM so it stops costing money.', [
    { cmd: `${VARS}; az vm deallocate -g $RG -n $VM`, explain: 'Deallocate releases the compute. A VM that is only "stopped" from inside still bills.', sample: '(no output — returns when the VM is deallocated)' },
    { cmd: 'az vm get-instance-view -g $RG -n $VM --query "instanceView.statuses[1].displayStatus" -o tsv', explain: 'Reads the power state back.', sample: 'VM deallocated' },
  ], ['VM deallocated'], 'A running B1s costs about 1 cent an hour; a forgotten one eats the budget in weeks.');

const TASKS: Task[] = [
  // ── Week 1 — Foundation ────────────────────────────────────────────────
  T(1, 'arch', 'Set the naming standard and the budget', 'Agree how everything is named and tagged, and cap spending at $5 before anything is built.', 40,
    ['Cloud Adoption Framework naming', 'Tags', 'Budgets'], ['A $5 budget alerts at 80%', 'The naming and tag table is agreed'], [
    portal(s(1, 'arch', 1), 'Create the $5 budget', 'Create a $5 monthly budget that emails the team.', 'Azure portal — Cost Management', [
      'Search Cost Management → Budgets → Add.',
      'Scope: your subscription. Name: budget-capstone-team01. Amount: 5.',
      'Alert condition: Actual, 80%. Recipient: the team email.',
      'Create.',
    ], 'The budget budget-capstone-team01 is listed with a $5 amount and one alert at 80%.', 'The budget is the guardrail. It is created first because it is the one thing that tells you a mistake is costing money.', {
      fixes: [{ symptom: 'Budgets is greyed out', fix: 'Student subscriptions sometimes need the Billing Reader role — ask the instructor, or set the budget at resource-group scope.' }],
    }),
    portal(s(1, 'arch', 2), 'Agree the naming and tags', 'Agree one naming pattern and four tags as a team.', 'Team meeting', [
      'Pattern: type prefix, workload, team — e.g. vm-tools-team01.',
      'Use the Azure abbreviations: rg-, vnet-, snet-, nsg-, vm-, st, func-, kv-.',
      'Tags: project, team, env, owner.',
    ], 'A table of prefixes and four tag keys everyone has agreed to use.', 'A name you can read tells you the type, the purpose and the owner without opening anything. Week 11 enforces the owner tag.'),
    rec(1, 'arch', 'Account and guardrails, Naming, Tags, RACI', [
      'Subscription, region (eastus) and the budget.',
      'One naming row per resource type you will create.',
      'The four tags, and a short RACI.',
    ], 'This is the standard every later document and template refers to.'),
  ]),
  T(1, 'infra', 'Create the resource group and VNet', 'Create the resource group and a virtual network with its first subnet, named and tagged by the standard.', 35,
    ['Resource groups', 'VNet address space', 'Subnets'], ['rg-capstone-team01 exists with tags', 'vnet-capstone-team01 is 10.10.0.0/16 with snet-app'], [
    cli(s(1, 'infra', 1), 'Create the resource group', 'Create the tagged resource group in eastus.', [
      { cmd: 'az group create -n rg-capstone-team01 -l eastus --tags project=capstone team=team01 env=dev owner=team01-infra', explain: 'A resource group is the folder every resource lives in; deleting it deletes them all.', sample: '"name": "rg-capstone-team01",\n"properties": { "provisioningState": "Succeeded" }' },
    ], ['Succeeded'], 'Everything this course builds lives in this one group, so cost, access and clean-up happen in one place.'),
    cli(s(1, 'infra', 2), 'Create the VNet and first subnet', 'Create the VNet 10.10.0.0/16 with snet-app 10.10.1.0/24.', [
      { cmd: 'az network vnet create -g rg-capstone-team01 -n vnet-capstone-team01 --address-prefix 10.10.0.0/16 --subnet-name snet-app --subnet-prefix 10.10.1.0/24', explain: 'The VNet is your private network; the subnet is the slice the VM will use.', sample: '"addressPrefixes": [ "10.10.0.0/16" ],\n"subnets": [ { "addressPrefix": "10.10.1.0/24", "name": "snet-app" } ]' },
    ], ['10.10.1.0/24', 'snet-app'], 'A /16 leaves room for 256 /24 subnets; the course uses two. Private ranges (RFC 1918) never route on the internet.', {
      fixes: [{ symptom: 'ResourceGroupNotFound', fix: 'Run the previous step first, and check the name is exactly rg-capstone-team01.' }],
    }),
    rec(1, 'infra', 'Landing zone', ['The resource group and VNet names.', 'The address space and the first subnet.'], 'The Network Design Document in Week 6 starts from these numbers.'),
  ]),
  T(1, 'dev', 'Open the team repository and board', 'Create the team repository, a README with the naming standard, and a twelve-week board.', 35,
    ['Git repositories', 'README as documentation', 'Project boards'], ['The repo exists with a README', 'The board has this week’s four tasks'], [
    portal(s(1, 'dev', 1), 'Create the repository', 'Create the team repository with a README.', 'github.com', [
      'New repository: capstone-team01, private, add a README.',
      'Invite your three teammates as collaborators.',
      'Folders: site/, api/, infra/, docs/.',
    ], 'A private repository with a README and four folders, shared with the team.', 'Everything the team produces lives here — the site, the function, the template and the documents.'),
    portal(s(1, 'dev', 2), 'Create the board', 'Create a board with this week’s four tasks.', 'github.com — Projects', [
      'New project (Board). Columns: To do, Doing, Done.',
      'Add one card per role for Week 1 and assign it.',
      'Link the board from the README.',
    ], 'A board with four assigned cards, linked from the README.', 'A board makes the four independent tasks visible, so nobody waits on anybody without knowing it.'),
    rec(1, 'dev', 'Team tooling', ['The repository URL.', 'The board URL.'], 'The handover package in Week 12 points a new team at this repository.'),
  ]),
  T(1, 'secops', 'Put an NSG on the subnet', 'Create a network security group, attach it to snet-app, and review who has access to the subscription.', 40,
    ['Network security groups', 'Default rules', 'Azure RBAC'], ['nsg-snet-app-team01 is attached to snet-app', 'Access is listed'], [
    cli(s(1, 'secops', 1), 'Create and attach the NSG', 'Create the NSG and attach it to snet-app.', [
      { cmd: 'az network nsg create -g rg-capstone-team01 -n nsg-snet-app-team01', explain: 'An NSG is a stateful firewall. It starts with default rules that deny all inbound from the internet.', sample: '"name": "nsg-snet-app-team01",\n"provisioningState": "Succeeded"' },
      { cmd: 'az network vnet subnet update -g rg-capstone-team01 --vnet-name vnet-capstone-team01 -n snet-app --nsg nsg-snet-app-team01', explain: 'Attaching it to the subnet protects everything placed there, including the VM next week.', sample: '"networkSecurityGroup": { "id": ".../nsg-snet-app-team01" }' },
    ], ['Succeeded', 'nsg-snet-app-team01'], 'Attach at the subnet, not the VM, so a resource added later is protected from its first second.'),
    cli(s(1, 'secops', 2), 'Read the default rules', 'List the NSG’s default rules.', [
      { cmd: 'az network nsg rule list -g rg-capstone-team01 --nsg-name nsg-snet-app-team01 --include-default -o table', explain: 'Shows the built-in rules. The last inbound rule, DenyAllInBound, is why nothing reaches the VM until you allow it.', sample: 'Name                 Priority  Access  Direction\nAllowVnetInBound     65000     Allow   Inbound\nDenyAllInBound       65500     Deny    Inbound' },
    ], ['DenyAllInBound'], 'Knowing the defaults is how you know every Allow you add is a decision.'),
    portal(s(1, 'secops', 3), 'Review access (RBAC)', 'List who holds which role on the subscription.', 'Azure portal — Access control (IAM)', [
      'Subscription → Access control (IAM) → Role assignments.',
      'Note each person or group, their role and scope.',
    ], 'A list of role assignments on the subscription.', 'Least privilege starts with knowing what is granted today. Week 5 narrows it.'),
    rec(1, 'secops', 'Access and NSG', ['One row per person or group and what they get.'], 'The Week 5 access matrix builds on this list.'),
  ]),

  // ── Week 2 — Website and VM ────────────────────────────────────────────
  T(2, 'arch', 'Write the architecture document and cost', 'Estimate the monthly cost of each component, then record the first architecture decision with what was rejected.', 45,
    ['Pricing calculator', 'Solution architecture documents', 'ADRs'], ['Every component has a monthly cost', 'ADR-001 names the rejected option'], [
    portal(s(2, 'arch', 1), 'Price it', 'Price the components in the Azure pricing calculator.', 'azure.microsoft.com/pricing/calculator', [
      'Add: Virtual Machines (B1s, Linux, 730 h), Storage Accounts (LRS, 1 GB).',
      'Add: Functions (Consumption), Azure Cosmos DB (serverless).',
      'Read the monthly total; then halve the VM hours — you deallocate it.',
    ], 'A monthly estimate per service, with the VM the largest line.', 'Cost is an architecture property. Knowing which line dominates tells you what to switch off.'),
    portal(s(2, 'arch', 2), 'Write ADR-001', 'Record why the site is a storage static website.', 'The document', [
      'Context: a public site with HTTPS for under $1 a month.',
      'Decision: storage static website — HTTPS is built in.',
      'Rejected: a VM with nginx, and Front Door (about $35 a month).',
    ], 'ADR-001 with context, decision, rejected options and consequences.', 'An ADR records the decision and the alternatives, so the next team does not reopen it without new facts.'),
    rec(2, 'arch', 'Components and cost, ADR-001', ['One component per row, with its monthly cost.', 'ADR-001.'], 'The architecture document grows every week and is handed over in Week 12.'),
  ]),
  T(2, 'infra', 'Deploy the tools VM', 'Deploy a B1s Ubuntu VM into snet-app with SSH-key sign-in only, then deallocate it.', 45,
    ['VM sizes', 'SSH keys', 'NICs and public IPs'], ['vm-tools-team01 runs in snet-app', 'The VM is deallocated at the end'], [
    cli(s(2, 'infra', 1), 'Create the VM', 'Create the B1s VM in snet-app, SSH key only.', [
      { cmd: `${VARS}; az vm create -g $RG -n $VM --image Ubuntu2204 --size Standard_B1s --vnet-name vnet-capstone-team01 --subnet snet-app --nsg "" --public-ip-sku Standard --admin-username azureuser --generate-ssh-keys --tags project=capstone team=team01 env=dev owner=team01-infra`, explain: '--nsg "" skips a per-VM NSG: the subnet’s NSG already protects it. --generate-ssh-keys means no password exists to guess.', sample: '"powerState": "VM running",\n"privateIpAddress": "10.10.1.4",\n"publicIpAddress": "20.119.8.41"' },
    ], ['VM running', '10.10.1.4'], 'B1s is the free-tier size. Key-only sign-in removes password guessing entirely.', {
      fixes: [
        { symptom: 'SkuNotAvailable', fix: 'B1s is out of capacity in that region. Try eastus2 for the VM only, and record why.' },
        { symptom: 'QuotaExceeded', fix: 'Student subscriptions allow few vCPUs. Delete any other VM first.' },
      ],
    }),
    cli(s(2, 'infra', 2), 'Read its network facts', 'Read the VM’s private IP and NIC.', [
      { cmd: `${VARS}; az vm list-ip-addresses -g $RG -n $VM -o table`, explain: 'The private IP is what other resources use; the public IP only exists for outbound patching.', sample: 'VirtualMachine    PublicIPAddresses    PrivateIPAddresses\nvm-tools-team01   20.119.8.41          10.10.1.4' },
    ], ['10.10.1.4'], 'The private IP comes from snet-app — 10.10.1.4 because Azure reserves the first four addresses.'),
    rec(2, 'infra', 'Virtual machine facts', ['Name, size, private IP, operating system.'], 'The runbook in Week 7 and the snapshot in Week 8 start from these facts.'),
    DEALLOCATE(2, 'infra'),
  ]),
  T(2, 'dev', 'Publish the website with HTTPS', 'Publish the company website from a storage account static website, HTTPS-only, then change it and redeploy.', 45,
    ['Storage accounts', 'Static websites', 'HTTPS and TLS 1.2'], ['The site loads over HTTPS', 'A change was redeployed'], [
    cli(s(2, 'dev', 1), 'Create the storage account', 'Create an HTTPS-only storage account with TLS 1.2.', [
      { cmd: 'RG=rg-capstone-team01; WEB=stwebteam01$RANDOM; echo $WEB', explain: 'Storage names are global, 3–24 lowercase letters and digits. $RANDOM makes yours unique; write it down.', sample: 'stwebteam0118342' },
      { cmd: 'az storage account create -g $RG -n $WEB --sku Standard_LRS --kind StorageV2 --https-only true --min-tls-version TLS1_2 --allow-blob-public-access false', explain: 'HTTPS-only and TLS 1.2 refuse old, insecure connections. Blob public access stays off; the website endpoint still serves.', sample: '"enableHttpsTrafficOnly": true,\n"minimumTlsVersion": "TLS1_2"' },
    ], ['TLS1_2'], 'The static-website endpoint serves HTTPS with Microsoft’s certificate, so no CDN is needed.'),
    cli(s(2, 'dev', 2), 'Enable the website and upload', 'Switch on the static website and upload index.html.', [
      { cmd: 'az storage blob service-properties update --account-name $WEB --static-website --index-document index.html --404-document 404.html --auth-mode login', explain: 'Creates the $web container and serves it as a website.', sample: '"staticWebsite": { "enabled": true, "indexDocument": "index.html" }' },
      { cmd: "az storage blob upload-batch --account-name $WEB -s ./site -d '$web' --auth-mode login --overwrite", explain: 'Uploads the site folder. You need the Storage Blob Data Contributor role for --auth-mode login.', sample: 'Finished[#############################################################]  100.0000%' },
      { cmd: 'az storage account show -n $WEB --query primaryEndpoints.web -o tsv', explain: 'Prints the site’s address.', sample: 'https://stwebteam0118342.z13.web.core.windows.net/' },
    ], ['web.core.windows.net'], 'Upload again after any change — that is a redeploy. Week 10 automates it.', {
      fixes: [{ symptom: 'AuthorizationPermissionMismatch on upload', fix: 'Assign yourself Storage Blob Data Contributor on the account, wait a minute, retry.' }],
    }),
    rec(2, 'dev', 'Website', ['The HTTPS URL.', 'How you redeployed a change.'], 'The site URL is the origin CORS will admit in Week 3.'),
  ]),
  T(2, 'secops', 'Allow SSH from your IP only', 'Add one inbound rule allowing SSH from your own address, then prove it is allowed from you and blocked elsewhere.', 40,
    ['NSG rule priority', '/32 source addresses', 'Allowed and blocked tests'], ['SSH works from your IP', 'SSH is blocked from Cloud Shell'], [
    cli(s(2, 'secops', 1), 'Add the SSH rule', 'Allow TCP 22 from your IP address only.', [
      { cmd: 'MYIP=$(curl -s https://ifconfig.me); echo $MYIP', explain: 'Run this on YOUR laptop, not Cloud Shell: it prints the address your laptop reaches the internet from.', sample: '203.0.113.25' },
      { cmd: 'az network nsg rule create -g rg-capstone-team01 --nsg-name nsg-snet-app-team01 -n Allow-SSH-MyIP --priority 1000 --direction Inbound --access Allow --protocol Tcp --source-address-prefixes $MYIP/32 --destination-port-ranges 22', explain: 'A /32 is exactly one address. Priority 1000 is evaluated before the default deny at 65500.', sample: '"access": "Allow",\n"sourceAddressPrefix": "203.0.113.25/32"' },
    ], ['/32'], 'Never 0.0.0.0/0 on port 22: bots scan the whole internet for open SSH within minutes.'),
    portal(s(2, 'secops', 2), 'Test allowed and blocked', 'Test SSH from your laptop, then from Cloud Shell.', 'Your laptop, then Cloud Shell', [
      'Start the VM: az vm start -g rg-capstone-team01 -n vm-tools-team01.',
      'From your laptop: ssh azureuser@PUBLIC_IP — expect a prompt.',
      'From Cloud Shell: the same command — expect a timeout.',
      'Deallocate the VM when done.',
    ], 'SSH connects from your laptop and times out from Cloud Shell.', 'A rule is only proved when something that should fail does fail.', {
      fixes: [{ symptom: 'Timeout from your laptop too', fix: 'Your IP changed (Wi-Fi, VPN). Re-run the first command and update the rule.' }],
    }),
    rec(2, 'secops', 'SSH access test', ['One allowed row, one blocked row.'], 'Week 6 removes this rule entirely; this record is the before.'),
  ]),

  // ── Week 3 — Serverless API ────────────────────────────────────────────
  T(3, 'arch', 'Draw the request flow with real URLs', 'Trace how a page view becomes a count in the database, naming every real URL and resource.', 35,
    ['Request flows', 'Architecture versions'], ['The flow names real URLs'], [
    portal(s(3, 'arch', 1), 'Read Architecture v3', 'Open the architecture diagram at week 3.', 'Guide → Architecture & IaC', [
      'Move the slider to v3. New resources glow.',
      'Follow the solid arrows from Visitors to Cosmos DB.',
      'Click the Function App: the template highlights its lines.',
    ], 'You can name every hop from the browser to the database.', 'The diagram is drawn from the template, so it is the environment you are building, not an illustration.'),
    portal(s(3, 'arch', 2), 'Write the flow', 'Write the flow with your real URLs.', 'The document', [
      'Browser → https://your-site (storage static website).',
      'Page script → GET https://func-…/api/visitorCount.',
      'Function → Cosmos DB database capstone, container visitors, item id "site".',
    ], 'A three-hop flow with real URLs and resource names.', 'A flow with real URLs is testable. Week 6 tests each hop.'),
    rec(3, 'arch', 'Request flow', ['The flow, hop by hop.'], 'Week 6’s path tests follow this flow.'),
  ]),
  T(3, 'infra', 'Create Cosmos DB and seed the counter', 'Create a serverless Cosmos DB account, a database and a container, and seed the counter item.', 45,
    ['Cosmos DB serverless', 'Partition keys', 'Data Explorer'], ['Container visitors exists with /id', 'Item id "site" has count 0'], [
    cli(s(3, 'infra', 1), 'Create the account', 'Create a serverless Cosmos DB account.', [
      { cmd: 'RG=rg-capstone-team01; COSMOS=cosmos-capstone-team01-$RANDOM; az cosmosdb create -g $RG -n $COSMOS --capabilities EnableServerless --default-consistency-level Session', explain: 'Serverless bills per request, so an idle counter costs nearly nothing. This takes a few minutes.', sample: '"capabilities": [ { "name": "EnableServerless" } ],\n"provisioningState": "Succeeded"' },
    ], ['EnableServerless', 'Succeeded'], 'Provisioned throughput would charge every hour even when nobody visits.'),
    cli(s(3, 'infra', 2), 'Create the database and container', 'Create database capstone and container visitors.', [
      { cmd: 'az cosmosdb sql database create -g $RG -a $COSMOS -n capstone', explain: 'A database groups containers.', sample: '"name": "capstone"' },
      { cmd: 'az cosmosdb sql container create -g $RG -a $COSMOS -d capstone -n visitors --partition-key-path /id', explain: 'The partition key decides how data is spread. /id suits one small item.', sample: '"partitionKey": { "paths": [ "/id" ] }' },
    ], ['/id'], 'Choosing the partition key is the one Cosmos DB decision you cannot change later.'),
    portal(s(3, 'infra', 3), 'Seed the counter item', 'Add the item { "id": "site", "count": 0 }.', 'Azure portal — Cosmos DB → Data Explorer', [
      'capstone → visitors → Items → New item.',
      'Replace the body with { "id": "site", "count": 0 } and Save.',
    ], 'The item "site" with count 0 is listed.', 'The Function reads and updates this one item.'),
    rec(3, 'infra', 'Data store', ['Account, database, container.', 'Partition key and the seed item.'], 'The API spec’s data model.'),
  ]),
  T(3, 'dev', 'Build the visitor-counter Function', 'Create a Function App with an HTTP trigger that increments the counter, and show the count on the site.', 50,
    ['Azure Functions', 'Bindings', 'Calling an API from a page'], ['The API returns a count', 'The site shows it'], [
    portal(s(3, 'dev', 1), 'Create the Function App', 'Create a Consumption Function App for Node.js.', 'Azure portal — Function App → Create', [
      'Resource group rg-capstone-team01. Name func-capstone-team01-XXXX.',
      'Runtime Node.js 20, Windows, Consumption plan.',
      'Monitoring: enable Application Insights. Create.',
    ], 'The Function App is running.', 'Windows Consumption is the plan that lets you edit code in the portal, and it costs nothing at this scale.'),
    portal(s(3, 'dev', 2), 'Add the counter function', 'Add an HTTP function with Cosmos DB bindings.', 'Function App → Functions → Create', [
      'HTTP trigger, name visitorCount, authorization Anonymous.',
      'Integration: input and output binding to Cosmos DB, database capstone, container visitors, id site.',
      'Code: read count, add 1, write it back, return { count }.',
    ], 'The function is listed and its Get function URL works.', 'Bindings do the database calls, so the code is four lines. The read-then-write is a known race — fine for a counter.', {
      fixes: [{ symptom: 'Binding asks for a connection', fix: 'Choose New → your Cosmos DB account. The portal stores a connection setting; Week 5 replaces it with the identity.' }],
    }),
    cli(s(3, 'dev', 3), 'Call it and show it', 'Call the API, then add the count to the page.', [
      { cmd: 'FUNC=https://func-capstone-team01-XXXX.azurewebsites.net; curl -s $FUNC/api/visitorCount', explain: 'Each call adds one. Then add fetch() of this URL to site/index.html, writing the result into #visitor-count, and upload again.', sample: '{"count":1}' },
    ], ['count'], 'The page calls the API from the browser, which is why CORS matters next.'),
    rec(3, 'dev', 'Endpoints', ['GET /api/visitorCount, what it returns, its status codes.'], 'The spec another developer would call your API from.'),
  ]),
  T(3, 'secops', 'Lock CORS and keep secrets out', 'Allow only your site to call the API from a browser, prove another origin is refused, and keep keys out of the page.', 45,
    ['CORS', 'Negative tests', 'Key Vault references'], ['Only your site is allowed', 'A foreign origin is refused'], [
    cli(s(3, 'secops', 1), 'Allow only your site', 'Set CORS to your site origin only.', [
      { cmd: 'RG=rg-capstone-team01; FN=func-capstone-team01-XXXX; SITE=https://stwebteam0118342.z13.web.core.windows.net', explain: 'Set these to your own names. The origin has no trailing slash.', sample: '(no output — the variables are set)' },
      { cmd: 'az functionapp cors add -g $RG -n $FN --allowed-origins $SITE && az functionapp cors show -g $RG -n $FN', explain: 'Browsers only let pages from listed origins read the API’s answers.', sample: '"allowedOrigins": [ "https://stwebteam0118342.z13.web.core.windows.net" ]' },
    ], ['allowedOrigins'], 'Remove "*" if the portal added it. A wildcard lets any website use your API from its visitors’ browsers.'),
    cli(s(3, 'secops', 2), 'Prove a foreign origin is refused', 'Call the API as another website would.', [
      { cmd: 'curl -s -D - -o /dev/null -H "Origin: https://evil.example" https://$FN.azurewebsites.net/api/visitorCount | grep -i access-control || echo "no CORS header — refused"', explain: 'A foreign origin gets no Access-Control-Allow-Origin header, so its browser discards the answer.', sample: 'no CORS header — refused' },
    ], ['refused'], 'CORS protects browsers, not the API: curl still gets a count. That is why the API holds no secrets.'),
    portal(s(3, 'secops', 3), 'Keep secrets out of the page', 'Check the page and settings hold no key.', 'Browser DevTools, then the Function App', [
      'View the site source: only the API URL, no key.',
      'Function App → Environment variables: the Cosmos setting should be a Key Vault reference, not a raw key.',
    ], 'No key in the page; the Cosmos setting points at Key Vault.', 'Anything in page source is public. Week 5 removes the key altogether.'),
    rec(3, 'secops', 'CORS and secrets', ['The allowed origin, the negative test, where the credential lives.'], 'The first line of the secrets register.'),
  ]),

  // ── Week 4 — Operate ───────────────────────────────────────────────────
  T(4, 'arch', 'Report the cost to date', 'Read what the environment has cost so far, by service, and name the largest line.', 30,
    ['Cost analysis', 'Cost by service'], ['Spend and largest cost reported'], [
    portal(s(4, 'arch', 1), 'Read the cost', 'Group cost by service for this month.', 'Azure portal — Cost Management → Cost analysis', [
      'Scope: rg-capstone-team01. View: Accumulated costs.',
      'Group by: Service name.',
      'Compare with your Week 2 estimate.',
    ], 'A per-service cost for the month so far.', 'Actual cost against the estimate is how you find what you forgot to switch off.'),
    rec(4, 'arch', 'Cost this week', ['Spend to date, and the largest cost with its reason.'], 'Week 11 turns this into the cost report.'),
  ]),
  T(4, 'infra', 'Alert on Function errors', 'Create an action group and an alert that emails when the Function returns server errors.', 40,
    ['Metric alerts', 'Action groups'], ['The alert exists and emails the team'], [
    cli(s(4, 'infra', 1), 'Create the action group', 'Create an action group that emails the team.', [
      { cmd: 'RG=rg-capstone-team01; az monitor action-group create -g $RG -n ag-capstone-team01 --short-name capstone --action email team team01-alerts@school.edu', explain: 'An action group is who gets told and how. Alerts point at it.', sample: '"groupShortName": "capstone",\n"enabled": true' },
    ], ['capstone'], 'One action group, many alerts: change the email once.'),
    cli(s(4, 'infra', 2), 'Create the alert', 'Alert when Http5xx is above zero in five minutes.', [
      { cmd: 'FNID=$(az functionapp show -g $RG -n func-capstone-team01-XXXX --query id -o tsv); az monitor metrics alert create -g $RG -n alert-func-5xx-team01 --scopes $FNID --condition "total Http5xx > 0" --window-size 5m --evaluation-frequency 1m --action ag-capstone-team01', explain: 'Http5xx counts server errors. Any error in five minutes fires the alert.', sample: '"name": "alert-func-5xx-team01",\n"enabled": true,\n"severity": 2' },
    ], ['alert-func-5xx-team01'], 'Errors are the signal users feel. CPU on a serverless app tells you little.'),
    rec(4, 'infra', 'Signals', ['The signal, where it is measured, the threshold, the action.'], 'The monitoring half of the incident report.'),
  ]),
  T(4, 'dev', 'Find a failure in Application Insights', 'Break the API on purpose, find the exception in Application Insights, and restore it.', 45,
    ['Application Insights', 'Failures view', 'Log queries'], ['The exception is found', 'The API works again'], [
    portal(s(4, 'dev', 1), 'Break it', 'Rename the Cosmos setting so the Function fails.', 'Function App → Environment variables', [
      'Copy the Cosmos connection setting’s name somewhere safe.',
      'Rename it by adding _OFF. Apply.',
      'Load the site twice: the counter fails.',
    ], 'The counter shows no number; the API returns 500.', 'Breaking it yourself means you know the answer, so you can learn the tool that finds it.'),
    portal(s(4, 'dev', 2), 'Find it', 'Find the exception in Application Insights.', 'Application Insights → Failures', [
      'Operations tab: visitorCount shows failed requests.',
      'Open a sample: the exception names the missing setting.',
    ], 'An exception naming the missing Cosmos setting.', 'The exception names the layer — configuration — before you open any code.'),
    portal(s(4, 'dev', 3), 'Restore it', 'Rename the setting back and retest.', 'Function App → Environment variables', [
      'Remove _OFF, Apply, reload the site.',
    ], 'The counter shows a number again.', 'A fix is not done until the retest passes.'),
    rec(4, 'dev', 'Signals', ['Add a signal row for exceptions in Application Insights.'], 'Your half of the monitoring table.'),
  ]),
  T(4, 'secops', 'Work one incident layer by layer', 'Break CORS on purpose, then work it as an incident: symptom, layer, evidence, root cause, fix, prevention.', 45,
    ['ITIL incident management', 'Layer-by-layer troubleshooting'], ['An incident record with all six parts'], [
    cli(s(4, 'secops', 1), 'Inject the fault', 'Remove your site from CORS.', [
      { cmd: 'RG=rg-capstone-team01; FN=func-capstone-team01-XXXX; SITE=https://stwebteam0118342.z13.web.core.windows.net; az functionapp cors remove -g $RG -n $FN --allowed-origins $SITE', explain: 'The page will still load, but its script can no longer read the count.', sample: '"allowedOrigins": []' },
    ], ['allowedOrigins'], 'A realistic fault: nothing is “down”, one feature silently stops.'),
    portal(s(4, 'secops', 2), 'Find the layer', 'Follow the symptom down the layers.', 'Browser DevTools → Console and Network', [
      'Symptom: the count is missing.',
      'Network tab: the API returned 200 — the network and app layers work.',
      'Console: “blocked by CORS policy” — the configuration layer.',
    ], 'The console names CORS as the cause.', 'Working down the layers stops you fixing what is not broken.'),
    cli(s(4, 'secops', 3), 'Fix and retest', 'Add the origin back and reload.', [
      { cmd: 'az functionapp cors add -g $RG -n $FN --allowed-origins $SITE', explain: 'Restores the rule. Reload the site: the count returns.', sample: '"allowedOrigins": [ "https://stwebteam0118342.z13.web.core.windows.net" ]' },
    ], ['allowedOrigins'], 'Week 10 puts CORS in the template, so drift like this is corrected by the next deploy.'),
    rec(4, 'secops', 'Incident record', ['Symptom, layer, evidence, root cause, fix, prevention.'], 'Week 12 runs this loop again under time pressure.'),
  ]),

  // ── Week 5 — Identity ──────────────────────────────────────────────────
  T(5, 'arch', 'Write the access matrix', 'List every principal, its role and scope, with a justification for each.', 35,
    ['Least privilege', 'Role scope'], ['Three or more justified grants'], [
    cli(s(5, 'arch', 1), 'Export the assignments', 'List role assignments on the resource group.', [
      { cmd: 'az role assignment list -g rg-capstone-team01 --include-inherited -o table', explain: 'Shows every grant that applies here, including those inherited from the subscription.', sample: 'Principal              Role                     Scope\nteam01-infra@...       Contributor              /subscriptions/.../resourceGroups/rg-capstone-team01' },
    ], ['Contributor'], 'Inherited grants are the ones people forget; they count just the same.'),
    rec(5, 'arch', 'Access matrix', ['One row per grant: principal, role, scope, why.', 'Mark any grant broader than it needs to be.'], 'Week 11’s posture review reads this matrix.'),
  ]),
  T(5, 'infra', 'Grant a group Reader on the group', 'Create a security group and give it Reader on the resource group — the access an auditor or a new hire starts with.', 35,
    ['Microsoft Entra groups', 'Built-in roles', 'Scope'], ['The group holds Reader at resource-group scope'], [
    cli(s(5, 'infra', 1), 'Create the group', 'Create the readers group.', [
      { cmd: 'GID=$(az ad group create --display-name grp-capstone-team01-readers --mail-nickname grp-capstone-team01-readers --query id -o tsv); echo $GID', explain: 'Grant roles to groups, not people: joining and leaving the team becomes one membership change.', sample: '3f2a9c1e-5b7d-4e8a-9c0f-1a2b3c4d5e6f' },
    ], ['3f2a9c1e'], 'Groups make access reviewable at a glance.', {
      fixes: [{ symptom: 'Insufficient privileges to create a group', fix: 'Your school tenant blocks it. Use an existing group the instructor gives you, and record that.' }],
    }),
    cli(s(5, 'infra', 2), 'Assign Reader', 'Assign Reader at resource-group scope.', [
      { cmd: 'RGID=$(az group show -n rg-capstone-team01 --query id -o tsv); az role assignment create --assignee-object-id $GID --assignee-principal-type Group --role Reader --scope $RGID', explain: 'Reader can see everything in the group and change nothing.', sample: '"roleDefinitionName": "Reader",\n"scope": "/subscriptions/.../resourceGroups/rg-capstone-team01"' },
    ], ['Reader'], 'Scope is half of least privilege: the right role on too wide a scope is still too much.'),
    rec(5, 'infra', 'Access matrix', ['Add the group’s row with its justification.'], 'The matrix records who can see, not only who can change.'),
  ]),
  T(5, 'dev', 'Switch the Function to its identity', 'Give the Function a managed identity, grant it data access to Cosmos DB, and delete the stored key.', 50,
    ['Managed identities', 'Cosmos DB data-plane roles', 'Identity-based connections'], ['The Function uses its identity', 'No Cosmos key remains in settings'], [
    cli(s(5, 'dev', 1), 'Turn on the identity', 'Enable the Function’s system-assigned identity.', [
      { cmd: 'RG=rg-capstone-team01; FN=func-capstone-team01-XXXX; PID=$(az functionapp identity assign -g $RG -n $FN --query principalId -o tsv); echo $PID', explain: 'Azure creates an identity tied to this Function’s lifetime. There is no password to store or leak.', sample: '7c1e2d3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f' },
    ], ['7c1e2d3f'], 'An identity cannot be copied into a chat message or a commit, which is the point.'),
    cli(s(5, 'dev', 2), 'Grant it the data role', 'Grant Cosmos DB Built-in Data Contributor.', [
      { cmd: 'COSMOS=cosmos-capstone-team01-XXXX; az cosmosdb sql role assignment create -g $RG -a $COSMOS --role-definition-id 00000000-0000-0000-0000-000000000002 --principal-id $PID --scope "/"', explain: 'The ...0002 role reads and writes items and nothing else — no keys, no account settings.', sample: '"roleDefinitionId": ".../sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"' },
    ], ['00000000-0000-0000-0000-000000000002'], 'Cosmos DB data access is its own RBAC system, separate from Azure roles.'),
    cli(s(5, 'dev', 3), 'Swap the setting', 'Point the binding at the endpoint, then delete the key.', [
      { cmd: 'az functionapp config appsettings set -g $RG -n $FN --settings CosmosConnection__accountEndpoint=https://$COSMOS.documents.azure.com:443/', explain: 'The __accountEndpoint suffix tells the binding to sign in with the identity. Point the bindings at CosmosConnection, delete the old key setting, then curl the API.', sample: '"name": "CosmosConnection__accountEndpoint"' },
    ], ['CosmosConnection__accountEndpoint'], 'The best secret is the one that does not exist.'),
    rec(5, 'dev', 'Secrets register', ['The database access row: stored in — nothing; read by — the managed identity.'], 'The register now shows a secret removed, not just moved.'),
  ]),
  T(5, 'secops', 'Prove an access is denied', 'Show what the Function’s identity can do, then prove a Reader cannot change anything.', 40,
    ['Effective permissions', 'Denied-access tests'], ['The identity’s roles are listed', 'A denial is recorded'], [
    cli(s(5, 'secops', 1), 'List the identity’s roles', 'List every role the Function’s identity holds.', [
      { cmd: 'PID=$(az functionapp identity show -g rg-capstone-team01 -n func-capstone-team01-XXXX --query principalId -o tsv); az role assignment list --assignee $PID --all -o table', explain: 'Azure roles only. The Cosmos data role is separate — it will not appear here, so the list should be short or empty.', sample: 'Principal    Role                  Scope\n7c1e2d3f...  Key Vault Secrets User  .../kv-team01-...' },
    ], ['Key Vault Secrets User'], 'Short lists are good lists.'),
    portal(s(5, 'secops', 2), 'Test a denial', 'As a Reader, try to stop the VM.', 'Azure portal — signed in as a Reader', [
      'Use a teammate in the readers group, or Check access → their account.',
      'Open vm-tools-team01 → Stop.',
      'Expect: “does not have authorization to perform action”.',
    ], 'The portal refuses the stop with an authorization error.', 'A permission is only proved when the thing it forbids fails.'),
    rec(5, 'secops', 'Access tests', ['Who, what they tried, expected, result.'], 'Evidence that the matrix is enforced, not just written.'),
  ]),

  // ── Week 6 — Networking ────────────────────────────────────────────────
  T(6, 'arch', 'Write the network design document', 'Write the address plan, the rules and the admin path, and say what production would add.', 40,
    ['RFC 1918', 'Segmentation', 'Design trade-offs'], ['Address plan and rules recorded', 'The production gap is stated'], [
    cli(s(6, 'arch', 1), 'Read the effective address plan', 'List every subnet and its NSG.', [
      { cmd: 'az network vnet subnet list -g rg-capstone-team01 --vnet-name vnet-capstone-team01 --query "[].{name:name, prefix:addressPrefix, nsg:networkSecurityGroup.id}" -o table', explain: 'One line per subnet: its range and the NSG guarding it.', sample: 'Name       Prefix         Nsg\nsnet-app   10.10.1.0/24   .../nsg-snet-app-team01\nsnet-mgmt  10.10.2.0/24   .../nsg-snet-mgmt-team01' },
    ], ['10.10.2.0/24'], 'The plan is read from Azure, not remembered.'),
    rec(6, 'arch', 'Design summary', ['How admins reach the VM now.', 'What production would add: a NAT gateway and a private VM.'], 'Honest about the trade-off: a public IP for outbound only, to avoid $32 a month.'),
  ]),
  T(6, 'infra', 'Add the management subnet', 'Add snet-mgmt with its own NSG, reserved for a future Bastion.', 35,
    ['Subnet planning', 'Per-subnet NSGs'], ['snet-mgmt is 10.10.2.0/24 with its own NSG'], [
    cli(s(6, 'infra', 1), 'Create the NSG and subnet', 'Create nsg-snet-mgmt-team01 and snet-mgmt.', [
      { cmd: 'RG=rg-capstone-team01; az network nsg create -g $RG -n nsg-snet-mgmt-team01', explain: 'Its own NSG, so rules for admin traffic never mix with app rules.', sample: '"provisioningState": "Succeeded"' },
      { cmd: 'az network vnet subnet create -g $RG --vnet-name vnet-capstone-team01 -n snet-mgmt --address-prefixes 10.10.2.0/24 --nsg nsg-snet-mgmt-team01', explain: 'The next /24 after snet-app. No overlap is possible inside the /16.', sample: '"addressPrefix": "10.10.2.0/24",\n"name": "snet-mgmt"' },
    ], ['10.10.2.0/24', 'snet-mgmt'], 'Segmenting now means a Bastion can be added later without renumbering anything.'),
    rec(6, 'infra', 'Address plan', ['One row per subnet: CIDR, purpose, route to internet.'], 'The template in Week 9 must match this plan.'),
  ]),
  T(6, 'dev', 'Trace the request paths', 'Test each hop of the website and API paths, and one path that must be blocked.', 35,
    ['HTTP status codes', 'Path testing'], ['Reachable and blocked paths recorded'], [
    cli(s(6, 'dev', 1), 'Test the public paths', 'Test the site and the API.', [
      { cmd: 'curl -sI https://stwebteam0118342.z13.web.core.windows.net | head -1', explain: 'The first line is the status: 200 means the site answered over HTTPS.', sample: 'HTTP/1.1 200 OK' },
      { cmd: 'curl -sI http://stwebteam0118342.z13.web.core.windows.net | head -1', explain: 'Plain HTTP should be refused — the account is HTTPS-only.', sample: 'HTTP/1.1 400 The account being accessed does not support http.' },
    ], ['200 OK', 'does not support http'], 'Testing the insecure path proves the setting, not just the happy path.'),
    rec(6, 'dev', 'Request paths', ['HTTPS site reachable, HTTP refused, API reachable.'], 'Paths tested both ways are the design proved.'),
  ]),
  T(6, 'secops', 'Remove SSH and use Run Command', 'Delete the SSH rule, administer the VM through Run Command, and prove port 22 is denied.', 45,
    ['Run Command', 'IP flow verify', 'Attack surface'], ['No inbound SSH rule', 'Run Command works', 'IP flow verify says Deny'], [
    cli(s(6, 'secops', 1), 'Remove SSH, start the VM', 'Delete the SSH rule and start the VM.', [
      { cmd: `${VARS}; az network nsg rule delete -g $RG --nsg-name nsg-snet-app-team01 -n Allow-SSH-MyIP && az vm start -g $RG -n $VM`, explain: 'With the rule gone, nothing on the internet can reach port 22.', sample: '(no output — the rule is deleted and the VM starts)' },
      { cmd: 'az vm run-command invoke -g $RG -n $VM --command-id RunShellScript --scripts "hostname; systemctl is-active nginx"', explain: 'Run Command goes through the Azure agent, not the network. No port, no key.', sample: '"message": "Enable succeeded: \\n[stdout]\\nvm-tools-team01\\nactive\\n"' },
    ], ['active'], 'The safest open port is none: admin goes through the Azure control plane, which is already authenticated and logged.'),
    cli(s(6, 'secops', 2), 'Prove port 22 is denied', 'Ask Network Watcher whether SSH would be allowed.', [
      { cmd: 'az network watcher test-ip-flow -g $RG --vm $VM --direction Inbound --protocol TCP --local 10.10.1.4:22 --remote 203.0.113.25:50000', explain: 'Evaluates the NSG rules for that exact packet, without sending one.', sample: '"access": "Deny",\n"ruleName": "securityRules/DenyAllInBound"' },
    ], ['Deny'], 'Proof from the platform itself, naming the rule that blocked it.'),
    rec(6, 'secops', 'NSG rules', ['Every inbound and outbound rule with its reason.', 'The IP flow verify result.'], 'The rules matrix of the network design.'),
    DEALLOCATE(6, 'secops'),
  ]),

  // ── Week 7 — Server Admin ──────────────────────────────────────────────
  T(7, 'arch', 'Decide the VM size', 'Read the VM’s CPU and memory use and decide whether B1s is still the right size.', 30,
    ['Right-sizing', 'Burstable VMs'], ['A size decision with its evidence'], [
    cli(s(7, 'arch', 1), 'Read the CPU history', 'Read the average CPU for the last week.', [
      { cmd: 'VMID=$(az vm show -g rg-capstone-team01 -n vm-tools-team01 --query id -o tsv); az monitor metrics list --resource $VMID --metric "Percentage CPU" --interval PT1H --aggregation Average --offset 7d -o table | tail -5', explain: 'Hourly averages. B-series VMs earn credits while idle, so a low average is normal and healthy.', sample: 'Timestamp            Name            Average\n2026-10-20 14:00:00  Percentage CPU  3.2' },
    ], ['Percentage CPU'], 'Right-sizing is cost control with evidence, not a guess.'),
    rec(7, 'arch', 'Sizing decision', ['Size now; keep, grow or shrink, and why.'], 'The decision is reversible and cheap — record it anyway.'),
  ]),
  T(7, 'infra', 'Attach and mount a data disk', 'Add a 4 GB data disk to the VM and mount it at /data so it survives a reboot.', 45,
    ['Managed disks', 'Filesystems', 'fstab'], ['/data is mounted', 'The VM is deallocated'], [
    cli(s(7, 'infra', 1), 'Attach the disk', 'Create and attach a 4 GB data disk.', [
      { cmd: `${VARS}; az vm start -g $RG -n $VM; az vm disk attach -g $RG --vm-name $VM --name disk-data-tools-team01 --new --size-gb 4 --sku Standard_LRS`, explain: 'Data lives on its own disk so the OS disk can be replaced without losing it.', sample: '"lun": 0,\n"name": "disk-data-tools-team01"' },
    ], ['disk-data-tools-team01'], 'Separating data from the OS disk is what makes Week 8’s restore simple.'),
    cli(s(7, 'infra', 2), 'Format and mount it', 'Format the disk and mount it at /data.', [
      { cmd: 'az vm run-command invoke -g $RG -n $VM --command-id RunShellScript --scripts "D=/dev/disk/azure/scsi1/lun0; mkfs.ext4 -q $D; mkdir -p /data; echo \\"$D /data ext4 defaults,nofail 0 2\\" >> /etc/fstab; mount -a; df -h /data"', explain: 'The lun0 path never changes between boots, unlike sdc. nofail lets the VM boot even if the disk is missing.', sample: '[stdout]\nFilesystem  Size  Used Avail Use% Mounted on\n/dev/sdc    3.9G   24K  3.7G   1% /data' },
    ], ['/data'], 'A mount that is not in fstab disappears at the next reboot.'),
    rec(7, 'infra', 'Storage', ['The disk, its size, where it is mounted.'], 'The runbook’s storage section.'),
    DEALLOCATE(7, 'infra'),
  ]),
  T(7, 'dev', 'Patch the VM with Update Manager', 'Assess missing updates and install the security ones through Azure Update Manager.', 40,
    ['Update Manager', 'Patch classifications'], ['A patch run succeeded', 'The VM is deallocated'], [
    cli(s(7, 'dev', 1), 'Assess and install', 'Assess, then install security updates.', [
      { cmd: `${VARS}; az vm start -g $RG -n $VM; az vm assess-patches -g $RG -n $VM --query "{critical:criticalAndSecurityPatchCount, other:otherPatchCount}"`, explain: 'Assessment lists what is missing without changing anything.', sample: '{ "critical": 12, "other": 30 }' },
      { cmd: 'az vm install-patches -g $RG -n $VM --maximum-duration PT1H --reboot-setting IfRequired --classifications-to-include-linux Critical Security --query "{status:status, installed:installedPatchCount}"', explain: 'Installs only critical and security updates, rebooting only if one requires it.', sample: '{ "status": "Succeeded", "installed": 12 }' },
    ], ['Succeeded'], 'Patching through the platform leaves a record in Update Manager — evidence an auditor can read.'),
    rec(7, 'dev', 'Patching', ['The tool, and the result of the run.'], 'Patch evidence for the runbook and the governance report.'),
    DEALLOCATE(7, 'dev'),
  ]),
  T(7, 'secops', 'Baseline the VM and write the runbook', 'Record what normal looks like on the VM and write the steps to check it is healthy.', 45,
    ['Performance baselines', 'Runbooks'], ['Three baseline metrics', 'A four-step runbook'], [
    cli(s(7, 'secops', 1), 'Take the baseline', 'Read load, memory and disk on the VM.', [
      { cmd: `${VARS}; az vm start -g $RG -n $VM; az vm run-command invoke -g $RG -n $VM --command-id RunShellScript --scripts "uptime; free -m | head -2; df -h / | tail -1"`, explain: 'Load average, free memory and disk use, taken while the VM is idle — that is what normal means.', sample: '[stdout]\n 14:02:11 up 3 min,  load average: 0.08, 0.10, 0.04\nMem:  848  312  201\n/dev/sda1  29G  2.1G  27G   8% /' },
    ], ['load average'], 'You cannot say “it is slow” without knowing what fast looked like.'),
    rec(7, 'secops', 'Performance baseline, Runbook', ['Three metrics: normal and alert level.', 'Four runbook steps: check, expect.'], 'The runbook is what a teammate on call follows.'),
    DEALLOCATE(7, 'secops'),
  ]),

  // ── Week 8 — Backup and Recovery ───────────────────────────────────────
  T(8, 'arch', 'Set RPO and RTO per asset', 'For each asset, decide how much data the company can lose and how fast it must return.', 30,
    ['Business impact analysis', 'RPO and RTO'], ['Three assets with RPO, RTO and method'], [
    portal(s(8, 'arch', 1), 'Rank the assets', 'Rank the website, the counter data and the VM.', 'Team meeting', [
      'Ask: what does an hour of this being down cost?',
      'RPO: how much data can we lose? RTO: how fast must it return?',
      'Name the protection: versioning, snapshot, or the template.',
    ], 'Three assets ranked, each with an RPO, an RTO and a method.', 'Targets come first, backups second: the target decides how often you back up.'),
    rec(8, 'arch', 'Business impact', ['One row per asset.'], 'Week 12’s recovery scenario is judged against these numbers.'),
  ]),
  T(8, 'infra', 'Restore a disk from a snapshot', 'Snapshot the data disk, create a new disk from it, and prove the data is there.', 45,
    ['Snapshots', 'Restore testing'], ['A disk restored from a snapshot', 'The test disk is deleted'], [
    cli(s(8, 'infra', 1), 'Snapshot and restore', 'Snapshot the data disk and make a disk from it.', [
      { cmd: 'RG=rg-capstone-team01; az snapshot create -g $RG -n snap-data-tools-team01 --source disk-data-tools-team01 --incremental true', explain: 'Incremental snapshots store only changed blocks — cents a month.', sample: '"provisioningState": "Succeeded",\n"incremental": true' },
      { cmd: 'az disk create -g $RG -n disk-data-restore-team01 --source snap-data-tools-team01 --sku Standard_LRS --query provisioningState -o tsv', explain: 'A new disk from the snapshot. Attach it to the VM and ls /data to see the files.', sample: 'Succeeded' },
    ], ['Succeeded'], 'Snapshots are cheap; Azure Backup would be about $5 a month per VM — an optional stretch.'),
    cli(s(8, 'infra', 2), 'Clean up the test disk', 'Delete the restored test disk.', [
      { cmd: 'az disk delete -g $RG -n disk-data-restore-team01 --yes', explain: 'Keep the snapshot, delete the test disk: it proved the restore and now only costs money.', sample: '(no output — the disk is deleted)' },
      { cmd: 'az disk list -g $RG --query "[].name" -o tsv', explain: 'The restore disk should be gone.', sample: 'disk-data-tools-team01\nvm-tools-team01_OsDisk_1' },
    ], ['disk-data-tools-team01'], 'A restore test leaves nothing behind but the evidence.'),
    rec(8, 'infra', 'VM restore', ['The snapshot name, and whether the data was present.'], 'The first proven restore in the DR plan.'),
  ]),
  T(8, 'dev', 'Recover a deleted web file', 'Turn on soft delete and versioning for the website, delete index.html, and get it back.', 40,
    ['Blob soft delete', 'Versioning'], ['index.html was recovered', 'The site loads again'], [
    cli(s(8, 'dev', 1), 'Turn on protection', 'Enable soft delete and versioning.', [
      { cmd: 'RG=rg-capstone-team01; WEB=stwebteam0118342; az storage account blob-service-properties update -g $RG -n $WEB --enable-delete-retention true --delete-retention-days 7 --enable-versioning true', explain: 'Deleted files are kept for seven days; every overwrite keeps the previous version.', sample: '"deleteRetentionPolicy": { "days": 7, "enabled": true },\n"isVersioningEnabled": true' },
    ], ['isVersioningEnabled'], 'Protection has to be on BEFORE the accident.'),
    cli(s(8, 'dev', 2), 'Delete and recover', 'Delete index.html, then undelete it.', [
      { cmd: "az storage blob delete --account-name $WEB -c '$web' -n index.html --auth-mode login", explain: 'The site now returns 404.', sample: '(no output — the blob is soft-deleted)' },
      { cmd: "az storage blob undelete --account-name $WEB -c '$web' -n index.html --auth-mode login && curl -sI https://$WEB.z13.web.core.windows.net | head -1", explain: 'Restores the soft-deleted blob. Your endpoint’s zone may differ from z13.', sample: 'HTTP/1.1 200 OK' },
    ], ['200 OK'], 'A backup is only real once you have restored from it.'),
    rec(8, 'dev', 'Website restore', ['What you deleted and how you restored it.'], 'The second proven restore.'),
  ]),
  T(8, 'secops', 'Run a timed recovery drill', 'Snapshot the VM’s OS disk, rebuild a disk from it, time the whole thing, and compare it with the RTO.', 45,
    ['Recovery drills', 'RTO measurement'], ['The drill is timed', 'Test resources are deleted'], [
    cli(s(8, 'secops', 1), 'Run the drill', 'Start a timer, snapshot the OS disk, restore it.', [
      { cmd: `${VARS}; date +%T; OS=$(az vm show -g $RG -n $VM --query storageProfile.osDisk.managedDisk.id -o tsv); az snapshot create -g $RG -n snap-os-drill --source $OS --incremental true -o none`, explain: 'Note the start time. The snapshot works while the VM is deallocated.', sample: '14:02:07' },
      { cmd: 'az disk create -g $RG -n disk-os-drill --source snap-os-drill -o none && date +%T', explain: 'The end time. The difference is your measured restore time.', sample: '14:05:52' },
    ], ['14:0'], 'A measured time turns an RTO from a hope into a fact.'),
    cli(s(8, 'secops', 2), 'Clean up', 'Delete the drill disk and snapshot.', [
      { cmd: 'az disk delete -g $RG -n disk-os-drill --yes && az snapshot delete -g $RG -n snap-os-drill && az snapshot list -g $RG --query "[].name" -o tsv', explain: 'Only the infra team’s data snapshot should remain.', sample: 'snap-data-tools-team01' },
    ], ['snap-data-tools-team01'], 'Drills leave no cost behind.'),
    rec(8, 'secops', 'Drill', ['Start, end, RTO met, lessons.'], 'The drill record proves the plan.'),
  ]),

  // ── Week 9 — Infrastructure as Code ────────────────────────────────────
  T(9, 'arch', 'Map the template to the diagram', 'Match five template resources to their diagram nodes, and say what code does that the portal cannot.', 35,
    ['ARM templates', 'The ARM visualizer'], ['Five resources mapped'], [
    portal(s(9, 'arch', 1), 'Read the template beside the diagram', 'Click five resources and read their template lines.', 'Guide → Architecture & IaC', [
      'Click a node: the template scrolls to its resource.',
      'Note its type, and which parameters and variables it reads.',
      'Tick "Template dependencies": arrows now show dependsOn.',
    ], 'Five resources traced from the picture to the code.', 'The diagram is generated from the template: if they ever disagree, the template is the truth.'),
    rec(9, 'arch', 'Template map, Portal vs code', ['Five rows: resource, node, parameter.', 'One thing code does that the portal cannot.'], 'The map lets anyone navigate the template.'),
  ]),
  T(9, 'infra', 'Inventory everything with the CLI', 'List every resource with its type and owner tag, and find anything the standard missed.', 35,
    ['JMESPath queries', 'Resource inventory'], ['Five or more resources listed with tags'], [
    cli(s(9, 'infra', 1), 'List the resources', 'List every resource with its owner tag.', [
      { cmd: 'az resource list -g rg-capstone-team01 --query "[].{name:name, type:type, owner:tags.owner}" -o table', explain: '--query picks fields with JMESPath. An empty Owner column is a resource that broke the standard.', sample: 'Name                   Type                                     Owner\nvm-tools-team01        Microsoft.Compute/virtualMachines        team01-infra\nnsg-snet-app-team01    Microsoft.Network/networkSecurityGroups' },
    ], ['Microsoft.Compute/virtualMachines'], 'The gaps you find now are what Policy will deny in Week 11.'),
    rec(9, 'infra', 'CLI inventory', ['Five or more resources, their type, tagged or not.'], 'The inventory is the before-picture for the template.'),
  ]),
  T(9, 'dev', 'Fill the starter and deploy to dev', 'Complete the starter ARM template, preview it with what-if, deploy it to a dev resource group, then delete it.', 55,
    ['ARM template structure', 'what-if', 'Deployments'], ['what-if previewed', 'Deployment Succeeded', 'The dev group is deleted'], [
    portal(s(9, 'dev', 1), 'Fill the starter', 'Download the starter and fill its seven blanks.', 'Guide → Architecture & IaC → Starter', [
      'Download azuredeploy.json and both parameter files into infra/.',
      'Replace each FILL-ME using its hint; the Full tab is the answer key.',
      'Commit to a branch.',
    ], 'A template with no FILL-ME left.', 'Filling blanks in a real template teaches its structure faster than writing one from nothing.'),
    cli(s(9, 'dev', 2), 'Preview, then deploy', 'Run what-if, then deploy into a dev group.', [
      { cmd: 'DEV=rg-capstone-team01-dev; az group create -n $DEV -l eastus -o none; az deployment group what-if -g $DEV --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.dev.json', explain: 'what-if lists every create, change and delete before anything happens.', sample: 'Resource changes: 26 to create.' },
      { cmd: 'az deployment group create -g $DEV --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.dev.json --query properties.provisioningState -o tsv', explain: 'You will be asked for the SSH key and email parameters.', sample: 'Succeeded' },
    ], ['to create', 'Succeeded'], 'Preview first, always: what-if is how you catch a delete you did not mean.'),
    rec(9, 'dev', 'Deployment', ['Blanks filled, what-if result, deployment result.'], 'The deployment record Week 10 automates.'),
    cli(s(9, 'dev', 3), 'Delete the dev copy', 'Delete the dev resource group.', [
      { cmd: 'az group delete -n rg-capstone-team01-dev --yes --no-wait && az group list --query "[].name" -o tsv', explain: 'The whole copy goes in one command — that is why everything lives in one group.', sample: 'rg-capstone-team01\nrg-capstone-team01-dev' },
    ], ['rg-capstone-team01'], 'A second environment doubles the bill until it is gone.'),
  ]),
  T(9, 'secops', 'Write parameter files and validate', 'Set dev and prod parameter values with no secrets in them, and validate the template against both.', 40,
    ['Parameter files', 'Validation', 'Secure parameters'], ['Both parameter files validate', 'No secret in either file'], [
    portal(s(9, 'secops', 1), 'Set the parameter values', 'Set teamId, environment, ownerTag and alertEmail.', 'infra/ in the repository', [
      'dev: environment dev, a small budget.',
      'prod: environment prod.',
      'Leave sshPublicKey out: it is supplied at deploy time.',
    ], 'Two parameter files differing only where environments differ.', 'Parameters are what changes between environments; everything else stays identical, which is what makes prod predictable.'),
    cli(s(9, 'secops', 2), 'Validate both', 'Validate the template with each parameter file.', [
      { cmd: 'az deployment group validate -g rg-capstone-team01 --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.prod.json --parameters sshPublicKey="$(cat ~/.ssh/id_rsa.pub)" --query properties.provisioningState -o tsv', explain: 'Validation checks syntax and the values against Azure, deploying nothing. Repeat with the dev file.', sample: 'Succeeded' },
    ], ['Succeeded'], 'Validation is the cheapest test in the whole course.'),
    portal(s(9, 'secops', 3), 'Compare with Terraform (optional)', 'Compare ARM with Terraform in two lines.', 'Your notes', [
      'Terraform: one language across clouds, keeps a state file.',
      'ARM: Azure only, no state file — Azure is the state.',
    ], 'Two sentences comparing native templates with Terraform.', 'Knowing why a team picks one over the other is an interview question.', { optional: true }),
    rec(9, 'secops', 'Parameters', ['Each parameter: dev value, prod value, secret or not.'], 'The environments, side by side.'),
  ]),

  // ── Week 10 — CI/CD ────────────────────────────────────────────────────
  T(10, 'arch', 'Write and approve the change request', 'Write a change request for one template change, get it reviewed, and approve it in a pull request.', 35,
    ['Change enablement', 'Risk and rollback'], ['The RFC has risk, rollback and approver'], [
    portal(s(10, 'arch', 1), 'Write the RFC in a pull request', 'Open a pull request with the RFC as its description.', 'github.com — Pull requests', [
      'The change: e.g. add a tag to every resource.',
      'Risk, rollback plan, and the tests the pipeline runs.',
      'Request review from a teammate; approve only after it passes.',
    ], 'A pull request with a complete RFC, reviewed and approved.', 'The pull request is the change record: who asked, who approved, what ran.'),
    rec(10, 'arch', 'Request for change', ['Change, risk, rollback plan, approver.'], 'The release record’s front page.'),
  ]),
  T(10, 'infra', 'Protect main and add an environment', 'Require a review before anything reaches main, and add a prod environment with a required reviewer.', 30,
    ['Branch protection', 'Deployment environments'], ['Main requires a review', 'prod needs approval'], [
    portal(s(10, 'infra', 1), 'Protect main', 'Require a pull request and one review on main.', 'Repository → Settings → Branches', [
      'Add a rule for main.',
      'Require a pull request, one approval, and passing checks.',
      'Block force pushes.',
    ], 'Direct pushes to main are refused.', 'Protection turns a convention into a rule the platform enforces.'),
    portal(s(10, 'infra', 2), 'Add the prod environment', 'Create environment prod with a required reviewer.', 'Repository → Settings → Environments', [
      'New environment: prod.',
      'Required reviewers: the Architect.',
    ], 'Jobs targeting prod wait for approval.', 'The pause before prod is where a human reads the what-if.'),
    rec(10, 'infra', 'Repository controls', ['The branch rule and the environment.'], 'Evidence of change control.'),
  ]),
  T(10, 'dev', 'Deploy from GitHub Actions', 'Add a workflow that validates, previews and deploys the template on every merge to main.', 50,
    ['GitHub Actions', 'azure/login', 'azure/arm-deploy'], ['A run deployed the template'], [
    portal(s(10, 'dev', 1), 'Write the workflow', 'Add .github/workflows/deploy.yml.', 'The repository', [
      'On: push to main, and workflow_dispatch.',
      'permissions: id-token write, contents read.',
      'Steps: checkout → azure/login@v2 → azure/arm-deploy@v2 with the prod parameters.',
      'Use the three IDs the Security task stores as repository variables.',
    ], 'A workflow file committed through a pull request.', 'id-token: write is what lets the job ask GitHub for a sign-in token instead of using a stored key.'),
    portal(s(10, 'dev', 2), 'Watch it run', 'Merge, then watch the run go green.', 'Repository → Actions', [
      'Merge the pull request.',
      'Open the run: login, then deploy.',
      'Approve the prod environment when asked.',
    ], 'The run is green and the deploy step shows Succeeded.', 'From now on nobody deploys from a laptop.', {
      fixes: [{ symptom: 'AADSTS70021: no matching federated identity', fix: 'The OIDC task is not finished, or its subject does not match your repo and branch exactly.' }],
    }),
    rec(10, 'dev', 'Pipeline runs', ['Run number, stages, result.'], 'The release record.'),
  ]),
  T(10, 'secops', 'Sign in with OIDC and test rollback', 'Let GitHub sign in to Azure with no stored secret, then break a deploy on purpose and roll it back.', 50,
    ['Workload identity federation', 'Rollback'], ['No client secret exists', 'A failed deploy was rolled back'], [
    cli(s(10, 'secops', 1), 'Create the federated sign-in', 'Create an app with a federated credential.', [
      { cmd: 'APP=$(az ad app create --display-name gh-capstone-team01 --query appId -o tsv); az ad sp create --id $APP -o none', explain: 'An app registration is the identity the pipeline signs in as. Echo $APP to see its ID.', sample: '(no output — the app and its service principal exist)' },
      { cmd: 'az ad app federated-credential create --id $APP --parameters \'{"name":"main","issuer":"https://token.actions.githubusercontent.com","subject":"repo:ORG/capstone-team01:ref:refs/heads/main","audiences":["api://AzureADTokenExchange"]}\'', explain: 'Trusts tokens GitHub issues for exactly this repo and branch. No secret is created.', sample: '"issuer": "https://token.actions.githubusercontent.com",\n"subject": "repo:ORG/capstone-team01:ref:refs/heads/main"' },
    ], ['token.actions.githubusercontent.com'], 'A stored key can leak and works from anywhere; a federated token works only for that repo, for minutes.'),
    cli(s(10, 'secops', 2), 'Grant it the resource group only', 'Give the pipeline Contributor on the resource group.', [
      { cmd: 'az role assignment create --assignee $APP --role Contributor --scope $(az group show -n rg-capstone-team01 --query id -o tsv) --query roleDefinitionName -o tsv', explain: 'Contributor on one group: the pipeline cannot touch the rest of the subscription. Save AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID as repository variables.', sample: 'Contributor' },
    ], ['Contributor'], 'These IDs are not secrets — without the federated trust they sign nobody in.'),
    portal(s(10, 'secops', 3), 'Break it, roll it back', 'Push a broken template, watch it fail, revert.', 'github.com', [
      'In a branch, misspell a resource type. Merge after review.',
      'The run fails at deploy; the environment is unchanged.',
      'Revert the commit; the next run is green.',
    ], 'A red run followed by a green revert.', 'A rollback plan you have never run is a guess.'),
    rec(10, 'secops', 'Keyless access and rollback', ['How the pipeline signs in, no keys stored, the rollback test.'], 'Evidence the pipeline is both safe and reversible.'),
  ]),

  // ── Week 11 — Governance ───────────────────────────────────────────────
  T(11, 'arch', 'Review cost by service', 'Break this month’s cost down by service and name one action for each.', 30,
    ['Cost analysis', 'Cost optimisation'], ['Three services with spend and an action'], [
    portal(s(11, 'arch', 1), 'Break down the cost', 'Group this month’s cost by service.', 'Cost Management → Cost analysis', [
      'Scope rg-capstone-team01, group by Service name.',
      'Check the budget: how close to the $4 alert?',
      'For each service, one action: keep, reduce, remove.',
    ], 'Cost per service with an action for each.', 'Every line has an owner and a decision — that is FinOps in one table.'),
    rec(11, 'arch', 'Cost by service', ['Three or more services, spend, action.'], 'The cost section of the governance report.'),
  ]),
  T(11, 'infra', 'Require the owner tag with Policy', 'Assign the built-in “Require a tag on resources” policy for owner, and prove it denies an untagged resource.', 40,
    ['Azure Policy', 'Deny effects'], ['The policy is assigned', 'An untagged create is denied'], [
    cli(s(11, 'infra', 1), 'Assign the policy', 'Assign “Require a tag on resources” for owner.', [
      { cmd: 'RGID=$(az group show -n rg-capstone-team01 --query id -o tsv); az policy assignment create -n require-owner-tag --policy 871b6d14-10aa-478d-b590-94f262ecfa99 --scope $RGID --params \'{"tagName":{"value":"owner"}}\'', explain: 'The GUID is the built-in policy. From now on, resources without an owner tag are refused.', sample: '"displayName": null,\n"name": "require-owner-tag",\n"enforcementMode": "Default"' },
    ], ['require-owner-tag'], 'A standard that is only written down is a suggestion; Policy makes it a rule.'),
    cli(s(11, 'infra', 2), 'Prove it denies', 'Try to create an untagged storage account.', [
      { cmd: 'az storage account create -g rg-capstone-team01 -n sttagtest$RANDOM --sku Standard_LRS 2>&1 | grep -o RequestDisallowedByPolicy', explain: 'Policy can take a few minutes to apply. Retry if the account is created — then delete it.', sample: 'RequestDisallowedByPolicy' },
    ], ['RequestDisallowedByPolicy'], 'Enforcement proved by a denial, not assumed.'),
    rec(11, 'infra', 'Policy', ['The policy and the result of the test.'], 'Governance the platform enforces for you.'),
  ]),
  T(11, 'dev', 'Query the Activity Log', 'Find who changed what in the resource group this week from the Activity Log.', 35,
    ['Activity Log', 'Audit trails'], ['Three audit events recorded'], [
    cli(s(11, 'dev', 1), 'Read the audit trail', 'List this week’s write operations.', [
      { cmd: 'az monitor activity-log list -g rg-capstone-team01 --offset 7d --query "[?contains(operationName.value, \'write\')].{time:eventTimestamp, who:caller, op:operationName.value}" -o table | head -8', explain: 'Every control-plane change is logged with who did it. Kept 90 days free.', sample: 'Time                  Who                    Op\n2026-11-10T14:02:07Z  team01-infra@school    Microsoft.Authorization/policyAssignments/write' },
    ], ['Microsoft.'], 'The audit log is how an incident answers “who did this, and when”.'),
    rec(11, 'dev', 'Audit events', ['Three events: when, who, operation.'], 'Evidence the environment is auditable.'),
  ]),
  T(11, 'secops', 'Review posture in Defender for Cloud', 'Read the free Defender for Cloud recommendations, rank three, and own their remediation.', 40,
    ['Cloud security posture', 'Secure score'], ['Three owned findings'], [
    portal(s(11, 'secops', 1), 'Read the recommendations', 'Open the free recommendations and the secure score.', 'Defender for Cloud → Recommendations', [
      'Note the secure score.',
      'Filter to rg-capstone-team01.',
      'Pick three: severity, affected resource, fix.',
    ], 'Three findings with severity and a remediation.', 'Free CSPM is enough to find real misconfigurations. Paid plans add threat detection.'),
    rec(11, 'secops', 'Posture findings', ['Three findings: severity, owner, remediation.'], 'Open findings become the handover’s risks.'),
  ]),

  // ── Week 12 — Handover ─────────────────────────────────────────────────
  T(12, 'arch', 'Assemble the handover package', 'Catalogue every service, list the open risks, and sign the package off.', 45,
    ['Service transition', 'Risk registers'], ['Four services catalogued', 'Three risks', 'Signed off'], [
    portal(s(12, 'arch', 1), 'Catalogue the services', 'List each service with its URL, owner and runbook.', 'The document', [
      'Website, API, database, tools VM.',
      'Each points to the runbook section that fixes it.',
    ], 'A four-row service catalogue.', 'The catalogue is the map a new team uses on day one.'),
    portal(s(12, 'arch', 2), 'List the risks', 'Turn open findings into risks.', 'The document', [
      'Start from Week 11’s open findings.',
      'Add: the public IP, the counter race, one-region hosting.',
    ], 'Three or more risks, each with a mitigation.', 'Handing over known risks honestly is what makes a handover trustworthy.'),
    rec(12, 'arch', 'Service catalogue, Risk register, Sign-off', ['Catalogue, risks, and the sign-off.'], 'The capstone — the package you defend.'),
  ]),
  T(12, 'infra', 'Rebuild the environment from the template', 'Rebuild the whole environment in a new resource group from the template, time it, and delete it.', 50,
    ['Disaster recovery by redeploy', 'Idempotent templates'], ['The rebuild Succeeded', 'Time recorded', 'Recovery group deleted'], [
    cli(s(12, 'infra', 1), 'Rebuild it', 'Deploy the template into a new group, timed.', [
      { cmd: 'REC=rg-capstone-team01-recover; date +%T; az group create -n $REC -l eastus -o none; az deployment group create -g $REC --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.prod.json --query properties.provisioningState -o tsv; date +%T', explain: 'The whole company, rebuilt from one file. The two times are your recovery time.', sample: '15:10:02\nSucceeded\n15:19:47' },
    ], ['Succeeded'], 'If it can be rebuilt from code, it can be recovered from anything.'),
    cli(s(12, 'infra', 2), 'Delete the recovery copy', 'Delete the recovery group.', [
      { cmd: 'az group delete -n rg-capstone-team01-recover --yes --no-wait && echo deleting', explain: 'Keep the evidence, not the bill.', sample: 'deleting' },
    ], ['deleting'], 'Clean-up is part of the drill.'),
    rec(12, 'infra', 'Scenario outcomes', ['Recover: rebuild from the template — time and result.'], 'Proof the template is the environment.'),
  ]),
  T(12, 'dev', 'Fix an app failure through CI', 'Break the Function’s configuration by hand, then restore it by re-running the pipeline — no portal fixes.', 45,
    ['Configuration drift', 'Redeploy as a fix'], ['The API failed, then recovered through CI'], [
    cli(s(12, 'dev', 1), 'Break it', 'Point the Function at a wrong Cosmos endpoint.', [
      { cmd: 'az functionapp config appsettings set -g rg-capstone-team01 -n func-capstone-team01-XXXX --settings CosmosConnection__accountEndpoint=https://wrong.documents.azure.com:443/ -o none; sleep 30; curl -s -o /dev/null -w "%{http_code}\\n" https://func-capstone-team01-XXXX.azurewebsites.net/api/visitorCount', explain: 'The API now fails with a server error.', sample: '500' },
    ], ['500'], 'This is drift: the running environment no longer matches the code.'),
    portal(s(12, 'dev', 2), 'Fix it through CI', 'Re-run the deploy workflow, then retest.', 'Repository → Actions → deploy → Run workflow', [
      'Run the workflow on main; approve prod.',
      'The template resets the setting.',
      'curl the API again: a count, not 500.',
    ], 'The API returns a count again after the pipeline run.', 'Redeploying the known-good template fixes drift without anyone touching the portal.'),
    rec(12, 'dev', 'Scenario outcomes', ['App failure fixed through CI — time and result.'], 'The second scenario of the handover.'),
  ]),
  T(12, 'secops', 'Contain a security incident', 'Open SSH to the internet on purpose, detect it, contain it, and run the final security checklist.', 45,
    ['Detection', 'Containment', 'Final checklist'], ['The rule was detected and removed', 'Checklist complete'], [
    cli(s(12, 'secops', 1), 'Inject the incident', 'Add an SSH rule open to the internet.', [
      { cmd: 'az network nsg rule create -g rg-capstone-team01 --nsg-name nsg-snet-app-team01 -n Bad-SSH-Any --priority 900 --access Allow --protocol Tcp --source-address-prefixes "*" --destination-port-ranges 22 --query access -o tsv', explain: 'The exact misconfiguration attackers scan for. The VM is deallocated, so nothing is exposed.', sample: 'Allow' },
    ], ['Allow'], 'A realistic incident: one bad rule, easy to add, easy to miss.'),
    cli(s(12, 'secops', 2), 'Detect and contain', 'Find it in the Activity Log, then delete it.', [
      { cmd: 'az monitor activity-log list -g rg-capstone-team01 --offset 1h --query "[?contains(operationName.value, \'securityRules/write\')].caller" -o tsv | head -1', explain: 'Who created the rule, and when — the first question of any incident.', sample: 'team01-secops@school.edu' },
      { cmd: 'az network nsg rule delete -g rg-capstone-team01 --nsg-name nsg-snet-app-team01 -n Bad-SSH-Any && echo contained', explain: 'Containment: remove the exposure first, investigate after.', sample: 'contained' },
    ], ['contained'], 'Contain, then learn. Prevention: a policy that denies rules from * to 22.'),
    rec(12, 'secops', 'Scenario outcomes, Sign-off', ['Security incident contained — time and result.', 'Final checklist: no open ports, no keys, budget alerting.'], 'The third scenario, and the security sign-off.'),
  ]),
];

const WEEKS = cloudWeeks(P, PLANS);

/** Week 0 of the later courses: the previous course's end state, from the template. */
function azureSetup(through: 4 | 8, previous: string, fw: string): Task {
  return {
    id: `${P}-w0-setup`,
    role: 'arch',
    shared: true,
    week: 0,
    title: 'Stand up the inherited environment',
    objective: `Have the environment ${previous} ends with — skip if your team built it; deploy it from the template if not.`,
    frameworks: [fw, 'WAF'],
    deliverables: [],
    estimatedTime: '40 min',
    difficulty: 1,
    learn: ['Deploying an ARM template', 'The throughWeek parameter', 'What a template does not carry'],
    definitionOfDone: [`rg-capstone-team01 holds every resource Architecture v${through} shows`, 'The website answers over HTTPS'],
    steps: [
      portal(`${P}-w0-setup-s1`, 'Check what your team already has', `Skip this week if your team finished ${previous}.`, 'Azure portal — Resource groups', [
        'Open rg-capstone-team01, if it exists.',
        'Compare it with the Guide’s picture for Week 0.',
        'Everything there already? Go to Week 1.',
      ], 'You know whether the environment exists or must be deployed.', 'A team that built it keeps it; a team that did not gets the same starting point from the template, so both do the same Week 1.'),
      portal(`${P}-w0-setup-s2`, 'Get the template', 'Download azuredeploy.json and the prod parameter file.', 'Guide → Architecture & IaC → Full template', [
        'Download azuredeploy.json and azuredeploy.parameters.prod.json into infra/.',
        'Set teamId, ownerTag and alertEmail in the parameter file.',
      ], 'The two files sit in infra/ with your team’s values.', 'The template describes the whole twelve-week environment; the throughWeek parameter deploys only as far as this course starts.'),
      cli(`${P}-w0-setup-s3`, `Deploy through Week ${through}`, `Create the resource group and deploy with throughWeek=${through}.`, [
        { cmd: 'RG=rg-capstone-team01; az group create -n $RG -l eastus -o none', explain: 'The resource group everything lives in.', sample: '(no output — the group exists)' },
        { cmd: `az deployment group create -g $RG --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.prod.json --parameters throughWeek=${through} sshPublicKey="$(cat ~/.ssh/id_rsa.pub)" --query properties.provisioningState -o tsv`, explain: `throughWeek=${through} leaves every later resource out — the conditions in the template do the choosing.`, sample: 'Succeeded' },
      ], ['Succeeded'], 'One command, and the environment is exactly where the previous course left it.', {
        fixes: [{ symptom: 'No SSH key at ~/.ssh/id_rsa.pub', fix: 'Run ssh-keygen -t ed25519 first and pass that .pub file instead.' }],
      }),
      cli(`${P}-w0-setup-s4`, 'Publish what the template cannot', 'Switch on the static website and upload the site.', [
        { cmd: 'WEB=$(az deployment group show -g $RG -n azuredeploy --query properties.outputs.webStorageAccount.value -o tsv); az storage blob service-properties update --account-name $WEB --static-website --index-document index.html --404-document 404.html --auth-mode login -o none; az storage blob upload-batch --account-name $WEB -s ./site -d \'$web\' --auth-mode login --overwrite -o none; az storage account show -n $WEB --query primaryEndpoints.web -o tsv', explain: 'ARM cannot switch on the static website, and site files and Function code never live in a template. The site comes from the team repository; deploy api/ to the Function App as Week 3 did.', sample: 'https://stwebteam0118342.z13.web.core.windows.net/' },
      ], ['web.core.windows.net'], 'Infrastructure is in the template; content is in the repository. Both are needed for a working site.'),
      DEALLOCATE(0, 'setup'),
    ],
  };
}

const AZ_BLOCKS = {
  fundamentals: {
    weeks: [1, 4] as [number, number],
    id: 'azure-fundamentals',
    title: 'Azure Fundamentals Capstone',
    description: 'Build a small company in Azure in four weeks: a network, a VM, a website with HTTPS and a serverless counter — then watch it run.',
    certification: 'AZ-900',
    level: 'entry' as const,
    audience: 'Four roles build a real Azure environment in four weeks, on a $5 budget. Start here.',
    framework: 'AZ_900',
    authoredFramework: 'AZ_900',
    intro: 'A website with HTTPS, a serverless visitor counter, one Linux VM, and the first incident worked end to end.',
  },
  administrator: {
    weeks: [5, 8] as [number, number],
    id: 'azure-administrator',
    title: 'Azure Administrator Capstone',
    description: 'Run the company’s Azure like production: least-privilege identity, a segmented network with no open ports, server administration, backup and recovery.',
    certification: 'AZ-104',
    level: 'associate' as const,
    audience: 'Four roles operate the environment the Fundamentals course built. Week 0 deploys it if your team is new.',
    framework: 'AZ_104',
    authoredFramework: 'AZ_900',
    intro: 'Starts from the Fundamentals environment and adds identity without secrets, a management subnet, a data disk and patching, snapshots and a timed recovery drill.',
  },
  devops: {
    weeks: [9, 12] as [number, number],
    id: 'azure-devops',
    title: 'Azure DevOps Capstone',
    description: 'Write the company’s Azure as an ARM template, deploy it from GitHub Actions with no stored keys, govern it with Policy, and hand it over.',
    certification: 'AZ-400',
    level: 'expert' as const,
    audience: 'Four roles codify, automate, govern and hand over the environment. Week 0 deploys it if your team is new.',
    framework: 'AZ_400',
    authoredFramework: 'AZ_900',
    intro: 'Starts from the Administrator environment and adds the template, what-if and a dev deployment, a reviewed pipeline with OIDC, Policy, audit and posture, and the handover under pressure.',
  },
};

const slice = (b: keyof typeof AZ_BLOCKS, setup?: { week: WeekDef; task: Task }) =>
  sliceCourse(AZ_BLOCKS[b], { vendor: 'Microsoft', plans: PLANS, tasks: TASKS, weeks: WEEKS, setup });

export const AZURE_FUNDAMENTALS: Course = slice('fundamentals');
export const AZURE_ADMINISTRATOR: Course = slice('administrator', {
  week: setupWeek(P, 'the Fundamentals course'),
  task: azureSetup(4, 'the Fundamentals course', 'AZ_104'),
});
export const AZURE_DEVOPS: Course = slice('devops', {
  week: setupWeek(P, 'the Administrator course'),
  task: azureSetup(8, 'the Administrator course', 'AZ_400'),
});
export const AZURE_COURSES = [AZURE_FUNDAMENTALS, AZURE_ADMINISTRATOR, AZURE_DEVOPS];
export const AZURE_BLOCKS = AZ_BLOCKS;

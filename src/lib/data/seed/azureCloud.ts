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
const { portal, cli, both, record } = stepKit(FW, 'Azure Cloud Shell (Bash)');
const P = 'az';

const VARS = 'RG=rg-capstone-team01; VM=vm-tools-team01';

const PLANS: WeekPlan[] = [
  { n: 1, title: 'Cloud concepts and governance', theme: 'Who manages what, a budget, a network', objective: 'Say who manages what, set the standard and the $5 budget, then lay the network everything else sits in.',
    milestone: 'A budget alerts at $4, every planned service has a model and an owner, the resource group and VNet exist, the team can sign in and build with MFA on.',
    labels: ['Set the standard, the budget and the service model', 'Create the resource group and VNet', 'Open the team repository and board', 'Add the team to the account and give them access'] },
  { n: 2, title: 'Core services', theme: 'Compute, storage, network — and what they cost', objective: 'Price it, choose redundancy, publish the website over HTTPS and bring up one small VM reachable only from you.',
    milestone: 'The estimate and redundancy choices are written, the site loads over HTTPS, the B1s VM runs in its zone, SSH works from your IP only.',
    labels: ['Estimate the cost and choose redundancy', 'Deploy the tools VM', 'Publish the website with HTTPS', 'Put an NSG on the subnet and allow SSH from your IP'] },
  { n: 3, title: 'Serverless, data and identity', theme: 'A counter behind the site, and the team’s access', objective: 'Add a visitor counter — a Function reading and writing Cosmos DB — and give the team its group, role and MFA.',
    milestone: 'The page shows a live visitor count, the team’s group holds Reader with MFA on, and no key appears in the browser.',
    labels: ['Draw the request flow and say who manages each hop', 'Create Cosmos DB and seed the counter', 'Build the visitor-counter Function', 'Give the team the right access'] },
  { n: 4, title: 'Monitor, govern, pay', theme: 'Watch it, break it, fix it, lock it', objective: 'Watch cost and errors, read Advisor and Service Health, lock the group, and write one failure up as an incident.',
    milestone: 'An alert emails on Function errors, the group is locked, Advisor is read, one incident is recorded, and spend is reported.',
    labels: ['Report the cost, and read Advisor and Service Health', 'Alert on Function errors', 'Find a failure in Application Insights', 'Lock the resource group and write the incident record'] },
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
  docs: Task['docs'],
  freeTier: string,
  steps: Step[],
  extra: { prerequisites?: string[]; tools?: string[] } = {}
): Task {
  return cloudTask({ id: `${P}-w${week}-${role}`, role, week, title, objective, minutes, file: CLOUD_FILES[week - 1], frameworks: FW, learn, done, docs, freeTier, steps, ...extra });
}
const s = (week: number, role: string, n: number) => `${P}-w${week}-${role}-s${n}`;
const rec = (week: number, role: string, section: string, actions: string[], why: string) =>
  record(s(week, role, 9), CLOUD_FORMS[week - 1], CLOUD_FILES[week - 1], section, actions, why);

const PORTAL = 'Azure portal · or Cloud Shell';
const L = 'https://learn.microsoft.com/';
const doc = (title: string, path: string, lookFor: string) => ({ title, url: path.startsWith('http') ? path : `${L}${path}`, lookFor });
/** R97: what the screen shows when the clicks are done, and the page(s) to read for this step. */
const out = (seen: string, ...docs: ReturnType<typeof doc>[]): Partial<Step> => ({ expectedOutput: seen, outputKind: 'result', docs });

const DEALLOCATE = (week: number, role: string): Step =>
  both(s(week, role, 8), 'Deallocate the VM', 'Stop the VM so it stops costing money.', PORTAL, [
    'Virtual machines → vm-tools-team01 → Stop.',
    'Wait until Status reads “Stopped (deallocated)” — not just “Stopped”.',
  ], [
    { cmd: `${VARS}; az vm deallocate -g $RG -n $VM`, explain: 'Deallocate releases the compute. A VM that is only "stopped" from inside still bills.', sample: '(no output — returns when the VM is deallocated)' },
    { cmd: 'az vm get-instance-view -g $RG -n $VM --query "instanceView.statuses[1].displayStatus" -o tsv', explain: 'Reads the power state back.', sample: 'VM deallocated', flags: [
      { flag: '--query "instanceView.statuses[1].displayStatus"', meaning: 'Pick the power-state line out of the VM’s status list.' },
      { flag: '-o tsv', meaning: 'Plain text, no quotes.' },
    ] },
  ], ['VM deallocated'], 'Free-tier hours count while it runs; the portal’s Stop button deallocates, a shutdown from inside the OS does not.',
  out('Overview shows Status “Stopped (deallocated)”.', doc('VM states and billing', 'azure/virtual-machines/states-billing', 'the power-states table: Stopped still bills compute, Stopped (deallocated) does not')));

const TASKS: Task[] = [
  // ── Week 1 — Cloud concepts and governance ─────────────────────────────
  T(1, 'arch', 'Set the standard, the budget and the service model', 'Agree names and tags, cap spending at $5, and say who manages what for each planned service.', 45,
    ['AZ-900 · Cloud concepts', 'Shared responsibility and IaaS / PaaS / SaaS', 'Budgets and tags', 'How to read a resource name'], ['A $5 budget alerts at 80%', 'The naming and tag table is agreed', 'Every planned service has a model and a responsibility line'],
    [doc('Shared responsibility in the cloud', 'azure/security/fundamentals/shared-responsibility', 'the diagram: which rows move from you to Microsoft across IaaS, PaaS and SaaS'),
     doc('Create and manage budgets', 'azure/cost-management-billing/costs/tutorial-acm-create-budgets', 'the “Create a budget” steps and the alert conditions: Actual vs Forecasted, and the email'),
     doc('Resource abbreviations', 'azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations', 'the abbreviation column: rg, vnet, snet, nsg, vm, st, func — copy them into your standard')],
    'Free: budgets, Cost Management and Cloud Shell’s first 5 GB share are inside the free account. Nothing is deployed this task.', [
    both(s(1, 'arch', 1), 'Create the $5 budget', 'Create a $5 monthly budget that emails the team.', PORTAL, [
      'Search “Cost Management” → Budgets → Add. Scope: your subscription.',
      'Name budget-capstone-team01, amount 5, reset monthly. Alert: Actual, 80%, the team email. Create.',
      'Open Cloud Shell (the >_ icon) once and choose Bash: it makes its storage share now.',
    ], [
      { cmd: 'az consumption budget create --budget-name budget-capstone-team01 --amount 5 --category Cost --time-grain Monthly --start-date $(date +%Y-%m-01) --end-date $(date -d "+1 year" +%Y-%m-01) --query name -o tsv', explain: 'The same budget from Cloud Shell. Add the alert in the portal: this command cannot set contact emails.', sample: 'budget-capstone-team01', flags: [
        { flag: '--amount 5', meaning: 'The monthly limit in your billing currency.' },
        { flag: '--time-grain Monthly', meaning: 'The counter resets on the first of each month.' },
      ] },
    ], ['budget-capstone-team01'], 'A budget does not stop spending; it emails you before a mistake gets expensive. 80% of $5 is $4, so you hear early. Cloud Shell is the exam’s CLI.', {
      ...out('Budgets lists budget-capstone-team01 at $5 with one alert at 80%.', doc('Create and manage budgets', 'azure/cost-management-billing/costs/tutorial-acm-create-budgets', 'the “Create a budget” steps: scope, name, amount, reset period, then the alert condition and email')),
      paths: [
        { label: 'Azure free account', when: 'You signed up yourself, with a card', steps: ['Scope: your subscription — Budgets is available.'] },
        { label: 'Azure for Students', when: 'Your school gave you the subscription', steps: ['Budgets may be greyed out. Set the scope to rg-capstone-team01 once the Infra Admin has created it, and note it in the document.'] },
      ],
      fixes: [
        { symptom: 'Budgets is greyed out', fix: 'Student subscriptions sometimes need the Billing Reader role — ask the instructor, or set the budget at resource-group scope.' },
        { symptom: 'No email arrives at 80%', fix: 'Alerts send once a day at most, and cost data lags 8–24 hours. Check the recipient address, then wait a day.' },
      ],
    }),
    portal(s(1, 'arch', 2), 'Classify each service', 'Say who manages what for each service you will build.', 'Team meeting', [
      'List the seven services: VNet, VM, storage website, Function, Cosmos DB, Log Analytics, Key Vault.',
      'For each: IaaS, PaaS or serverless? Who patches the OS? Who secures the data?',
      'Pick the region (East US); note its zones are separate buildings.',
    ], 'A table: service, model, what we manage, what Microsoft manages.', 'Shared responsibility is the first exam domain: on a VM you patch the OS; on Functions and Cosmos DB Microsoft does, and you own code, data and identities.', {
      docs: [doc('Shared responsibility in the cloud', 'azure/security/fundamentals/shared-responsibility', 'the diagram: which rows move from you to Microsoft across IaaS, PaaS and SaaS')],
    }),
    portal(s(1, 'arch', 3), 'Agree the naming and tags', 'Agree one naming pattern and four tags as a team.', 'Team meeting', [
      'Pattern: what-it-is – what-it-is-for – who-owns-it. Example: vm-tools-team01.',
      'Prefixes from Azure’s list: rg-, vnet-, snet-, nsg-, vm-, st, func-. Global names: four digits.',
      'Tags on everything: project=capstone, team=team01, env=dev, owner=your-role-email.',
    ], 'A table of prefixes and four tag keys everyone has agreed to use.', 'Read vm-tools-team01 as three parts: a virtual machine, for the tools job, owned by team01. Sixteen teams share one subscription, so the pattern is how you find your things.', {
      docs: [doc('Resource abbreviations', 'azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations', 'the abbreviation column: rg, vnet, snet, nsg, vm, st, func — the prefixes in your standard')],
      fixes: [{ symptom: 'Storage account name refused', fix: 'Storage names allow only lowercase letters and digits, 3–24 characters, unique across all of Azure. stwebteam01 plus four digits fits.' }],
    }),
    rec(1, 'arch', 'Account and guardrails, Service model, Naming, Tags, RACI', [
      'Subscription, region and zone, and the budget.',
      'One service-model row per service; one naming row per resource type.',
      'The four tags, and a short RACI.',
    ], 'This is the standard every later document and template refers to.'),
  ], { tools: ['Azure portal', 'Cloud Shell'] }),
  T(1, 'infra', 'Create the resource group and VNet', 'Create the resource group and a virtual network with its first subnet, named and tagged by the standard.', 35,
    ['AZ-900 · Azure architecture and services', 'Subscriptions and resource groups', 'Regions and availability zones', 'VNet address space and subnets'], ['rg-capstone-team01 exists with tags', 'vnet-capstone-team01 is 10.10.0.0/16 with snet-app'],
    [doc('Manage resource groups (portal)', 'azure/azure-resource-manager/management/manage-resource-groups-portal', 'the “Create resource groups” section — region and tags are set at creation'),
     doc('Create a virtual network (portal)', 'azure/virtual-network/quick-create-portal', 'the IP addresses tab: the address space box and how a subnet is carved out of it')],
    'Free: resource groups, virtual networks and subnets cost nothing.', [
    both(s(1, 'infra', 1), 'Create the resource group', 'Create the tagged resource group in eastus.', PORTAL, [
      'Resource groups → Create. Name rg-capstone-team01, region East US.',
      'Tags tab: project=capstone, team=team01, env=dev, owner=team01-infra. Review + create → Create.',
    ], [
      { cmd: 'az group create -n rg-capstone-team01 -l eastus --tags project=capstone team=team01 env=dev owner=team01-infra', explain: 'A resource group is the folder every resource lives in; deleting it deletes them all.', sample: '"name": "rg-capstone-team01",\n"properties": { "provisioningState": "Succeeded" }', flags: [
        { flag: '-n', meaning: 'The name (rg- says resource group; capstone the project; team01 the owner).' },
        { flag: '-l eastus', meaning: 'The region: which set of datacenters holds it. A region has several availability zones.' },
        { flag: '--tags', meaning: 'Key=value labels, space separated. Cost analysis can group by them.' },
      ] },
    ], ['Succeeded'], 'Subscription › resource group › resource is the hierarchy: the group is where cost, access and clean-up happen. A region’s availability zones are separate buildings that fail independently.', {
      ...out('Resource groups lists rg-capstone-team01 in East US with four tags.', doc('Manage resource groups (portal)', 'azure/azure-resource-manager/management/manage-resource-groups-portal', 'the “Create resource groups” section: subscription, name, region, then Review + create')),
      fixes: [{ symptom: 'The region list does not offer East US', fix: 'Your subscription is limited to certain regions. Pick the nearest one offered and use it for everything; note it in the document.' }],
    }),
    both(s(1, 'infra', 2), 'Create the VNet and first subnet', 'Create the VNet 10.10.0.0/16 with snet-app 10.10.1.0/24.', PORTAL, [
      'Virtual networks → Create. Group rg-capstone-team01, name vnet-capstone-team01, region East US.',
      'IP addresses tab: address space 10.10.0.0/16; delete the default subnet.',
      'Add subnet snet-app, starting address 10.10.1.0, size /24. Tags, then Create.',
    ], [
      { cmd: 'az network vnet create -g rg-capstone-team01 -n vnet-capstone-team01 --address-prefix 10.10.0.0/16 --subnet-name snet-app --subnet-prefix 10.10.1.0/24 --tags project=capstone team=team01 env=dev owner=team01-infra', explain: 'The VNet is your private network; the subnet is the slice the VM will use.', sample: '"addressPrefixes": [ "10.10.0.0/16" ],\n"subnets": [ { "addressPrefix": "10.10.1.0/24", "name": "snet-app" } ]', flags: [
        { flag: '-g', meaning: 'The resource group it goes in.' },
        { flag: '--address-prefix 10.10.0.0/16', meaning: 'The whole private range: 65,536 addresses, from the RFC 1918 10.x block.' },
        { flag: '--subnet-prefix 10.10.1.0/24', meaning: 'The first slice: 256 addresses. Azure keeps five of them, so 251 are usable.' },
      ] },
    ], ['10.10.1.0/24', 'snet-app'], 'A virtual network is the private network your VM sits in; a /16 leaves room for 256 /24 subnets. Private ranges never route on the internet.', {
      ...out('vnet-capstone-team01 shows address space 10.10.0.0/16 and one subnet, snet-app 10.10.1.0/24.', doc('Create a virtual network (portal)', 'azure/virtual-network/quick-create-portal', 'the IP addresses tab: the address space box, and Add a subnet with its starting address and size')),
      fixes: [
        { symptom: 'ResourceGroupNotFound', fix: 'Run the previous step first, and check the name is exactly rg-capstone-team01.' },
        { symptom: 'Address space overlaps', fix: 'Another VNet in the subscription uses 10.10.0.0/16. Use 10.20.0.0/16 and 10.20.1.0/24 everywhere, and record it.' },
      ],
    }),
    rec(1, 'infra', 'Landing zone', ['The resource group and VNet names.', 'The address space and the first subnet.'], 'The Network Design Document in Week 6 starts from these numbers.'),
  ], { tools: ['Azure portal', 'Cloud Shell'] }),
  T(1, 'dev', 'Open the team repository and board', 'Create the team repository, a README with the naming standard, and a twelve-week board.', 35,
    ['AZ-900 · Azure management and governance', 'Where a team keeps its work', 'Project boards'], ['The repo exists with a README', 'The board has this week’s four tasks'],
    [doc('Create a repository', 'https://docs.github.com/repositories/creating-and-managing-repositories/creating-a-new-repository', 'the visibility choice (private) and the “Add a README” box'),
     doc('Create a project', 'https://docs.github.com/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project', 'the Board layout and how to add a draft item to a column')],
    'Free: GitHub is free for private repositories and project boards.', [
    portal(s(1, 'dev', 1), 'Create the repository', 'Create the team repository with a README.', 'github.com', [
      'New repository: capstone-team01, private, tick “Add a README file”.',
      'Settings → Collaborators: invite your three teammates.',
      'Create folders site/, api/, infra/, docs/ and paste the naming standard into the README.',
    ], 'A private repository with a README and four folders, shared with the team.', 'Everything the team produces lives here: the site, the function, the template and the documents. Private, because it holds real resource names; a key or password never goes in.', {
      docs: [doc('Create a repository', 'https://docs.github.com/repositories/creating-and-managing-repositories/creating-a-new-repository', 'the visibility choice (private) and the “Add a README” box')],
      fixes: [{ symptom: 'A teammate cannot see the repo', fix: 'They must accept the invitation email. Settings → Collaborators shows “Pending” until they do.' }],
    }),
    portal(s(1, 'dev', 2), 'Create the board', 'Create a board with this week’s four tasks.', 'github.com — Projects', [
      'Your profile → Projects → New project → Board. Columns: To do, Doing, Done.',
      'Add one card per role for Week 1, assigned. Link the board from the README.',
    ], 'A board with four assigned cards, linked from the README.', 'A board makes the four independent tasks visible, so nobody waits on anybody without knowing it. Moving a card is the cheapest status report there is.', {
      docs: [doc('Create a project', 'https://docs.github.com/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project', 'the Board layout and how to add a draft item to a column')],
    }),
    rec(1, 'dev', 'Team tooling', ['The repository URL.', 'The board URL.'], 'The handover package in Week 12 points a new team at this repository.'),
  ], { tools: ['GitHub'] }),
  T(1, 'secops', 'Add the team to the account and give them access', 'Invite the three teammates into the account, put them in a builders group with Contributor on the resource group, and require MFA.', 50,
    ['AZ-900 · Azure architecture and services', 'Entra ID users, guests and groups', 'RBAC: Contributor at resource-group scope', 'Security defaults and MFA'], ['The three teammates can sign in', 'The builders group holds Contributor on rg-capstone-team01', 'MFA is required for everyone'],
    [doc('Invite external users (B2B)', 'entra/external-id/b2b-quickstart-add-guest-users-portal', 'the “Invite external user” steps: email, display name, message, and what the guest sees on accepting'),
     doc('Assign roles (portal)', 'azure/role-based-access-control/role-assignments-portal', 'the “Add role assignment” steps: pick Contributor, then Members → select the group, then Review + assign'),
     doc('Security defaults', 'entra/fundamentals/security-defaults', 'what it turns on, MFA registration for every user within 14 days, and the switch under Properties')],
    'Free: users, groups, role assignments and security defaults cost nothing. Do this signed in as the teammate who created the account.', [
    both(s(1, 'secops', 1), 'Invite the three teammates', 'Invite each teammate into the account as a user.', PORTAL, [
      'Search “Microsoft Entra ID” → Users → New user → Invite external user.',
      'Email, display name, message “Capstone team01”. Review + invite. Repeat for all three.',
      'Each teammate opens the invitation email → Accept invitation → signs in with that address.',
    ], [
      { cmd: 'az rest --method post --url https://graph.microsoft.com/v1.0/invitations --body \'{"invitedUserEmailAddress":"teammate@school.edu","invitedUserDisplayName":"Teammate Name","inviteRedirectUrl":"https://portal.azure.com","sendInvitationMessage":true}\' --query status -o tsv', explain: 'Sends the same invitation through the Graph API. Run it once per teammate.', sample: 'PendingAcceptance', flags: [
        { flag: 'az rest --method post --url …/invitations', meaning: 'There is no az ad command for invitations; az rest calls the Graph API directly.' },
        { flag: '"sendInvitationMessage":true', meaning: 'Email the invitation, so the teammate has the link to accept.' },
      ] },
    ], ['PendingAcceptance'], 'Entra ID is the identity service behind every Azure sign-in. A guest keeps their own sign-in and MFA and appears in your directory; until they accept, they are Pending.', {
      ...out('Users lists three guests; each reads “Pending acceptance” until the teammate accepts.', doc('Invite external users (B2B)', 'entra/external-id/b2b-quickstart-add-guest-users-portal', 'the “Invite external user” steps: email, display name, message, and what the guest sees on accepting')),
      paths: [
        { label: 'Personal free account', when: 'You created the account with your own email', steps: ['Invite external user for each teammate; they accept the email and sign in with their own address.'] },
        { label: 'Same school tenant', when: 'The subscription lives in the school’s directory', steps: ['Users → the teammates already exist: skip the invitation and add them to the group in the next step.'] },
      ],
      fixes: [
        { symptom: 'Invite external user is greyed out', fix: 'The tenant blocks guest invitations. Ask the instructor to add the three users, and record it in the document.' },
        { symptom: 'The invitation never arrives', fix: 'Check the spam folder; or open the user in Entra ID → Resend invitation.' },
      ],
    }),
    both(s(1, 'secops', 2), 'Create the builders group', 'Create grp-capstone-team01-builders with all four of you.', PORTAL, [
      'Entra ID → Groups → New group. Type Security, name grp-capstone-team01-builders.',
      'Members → No members selected → tick the three teammates and yourself → Select → Create.',
    ], [
      { cmd: 'GID=$(az ad group create --display-name grp-capstone-team01-builders --mail-nickname grp-capstone-team01-builders --query id -o tsv); for U in $(az ad user list --query "[].id" -o tsv); do az ad group member add -g $GID --member-id $U; done; echo grp-capstone-team01-builders; az ad group member list -g $GID --query "[].displayName" -o tsv', explain: 'Creates the group and adds every user in the directory — in a four-person tenant, that is the team. Prints the members back.', sample: 'grp-capstone-team01-builders\nAda Lovelace\nGrace Hopper\nLinus Torvalds\nMargaret Hamilton', flags: [
        { flag: 'az ad group create --mail-nickname', meaning: 'A required short alias; the same as the name is fine.' },
        { flag: 'az ad group member add -g $GID --member-id $U', meaning: 'Add one user, by object id, to the group.' },
      ] },
    ], ['grp-capstone-team01-builders'], 'Grant access to a group, not to people: joining and leaving the team becomes one membership change, and the access document has one row instead of four.',
    out('Groups lists grp-capstone-team01-builders, type Security, with four members.', doc('Manage groups (Entra)', 'entra/fundamentals/how-to-manage-groups', 'the “Create a basic group and add members” steps: Security type, then Members → select'))),
    both(s(1, 'secops', 3), 'Give the group Contributor on the resource group', 'Assign Contributor on rg-capstone-team01 to the group.', PORTAL, [
      'rg-capstone-team01 → Access control (IAM) → Add → Add role assignment.',
      'Role tab: Privileged administrator roles → Contributor → Next. Members: Select members → grp-capstone-team01-builders.',
      'Review + assign. A teammate signs in: the group shows and Create is enabled.',
    ], [
      { cmd: 'RGID=$(az group show -n rg-capstone-team01 --query id -o tsv); az role assignment create --role Contributor --assignee-object-id $GID --assignee-principal-type Group --scope $RGID --query roleDefinitionName -o tsv', explain: 'Contributor can create and change everything in the group, and cannot grant access to others.', sample: 'Contributor', flags: [
        { flag: '--role Contributor', meaning: 'Build and change anything in scope; no role assignments.' },
        { flag: '--scope $RGID', meaning: 'Only this resource group — not the whole subscription.' },
        { flag: '--assignee-principal-type Group', meaning: 'The assignee is a group, so no lookup of each person is needed.' },
      ] },
    ], ['Contributor'], 'RBAC is role plus scope: Contributor on rg-capstone-team01. Builders can change everything there and nothing outside it; only you, the Owner, can grant access. That is least privilege.', {
      ...out('Role assignments shows grp-capstone-team01-builders as Contributor at this resource group.', doc('Assign roles (portal)', 'azure/role-based-access-control/role-assignments-portal', 'the “Add role assignment” steps: pick Contributor, then Members → select the group, then Review + assign')),
      fixes: [
        { symptom: 'rg-capstone-team01 does not exist yet', fix: 'The Infrastructure Admin creates it this week. Do the invitations and the group now; assign the role when the group exists.' },
        { symptom: 'A teammate sees “No access” on the subscription', fix: 'Expected: their access starts at the resource group. They open Resource groups → rg-capstone-team01.' },
      ],
    }),
    portal(s(1, 'secops', 4), 'Require MFA for everyone', 'Turn on security defaults; each member registers Authenticator.', 'Azure portal — Microsoft Entra ID → Overview → Properties', [
      'Properties → Manage security defaults → Security defaults: Enabled → Save.',
      'Each member, at next sign-in: follow the prompt, or mysignins.microsoft.com → Security info → Microsoft Authenticator.',
      'Entra ID → Users → a teammate → Authentication methods: Microsoft Authenticator listed.',
    ], 'Security defaults are on; every member’s next sign-in asks for Authenticator.', 'Security defaults are the free, one-switch way to require MFA for every user, the control the exam names most. A member registers within 14 days or is blocked.', {
      docs: [doc('Security defaults', 'entra/fundamentals/security-defaults', 'the “Enabling security defaults” steps and the list of what it enforces: MFA registration for every user')],
      fixes: [{ symptom: 'Security defaults cannot be enabled', fix: 'The tenant uses Conditional Access instead; MFA is already enforced there. Record “enforced by Conditional Access”.' }],
    }),
    rec(1, 'secops', 'Team access', ['One row per person: sign-in, group, role and scope, MFA.'], 'The Week 3 identity task narrows this to Reader for people who only look.'),
  ], { tools: ['Azure portal', 'Cloud Shell', 'Microsoft Authenticator'], prerequisites: ['The resource group rg-capstone-team01 from the Infrastructure Admin, this week — the role is assigned on it.'] }),

  // ── Week 2 — Core services: compute, storage, network, cost ────────────
  T(2, 'arch', 'Estimate the cost and choose redundancy', 'Price each component in the calculator against the free account, then choose storage redundancy and tiers with a reason.', 45,
    ['AZ-900 · Azure management and governance', 'Pricing calculator and the free account', 'Storage redundancy (LRS, ZRS, GRS) and access tiers', 'Factors that affect cost'], ['Every component has a monthly cost', 'Redundancy and tier chosen with a reason'],
    [doc('Azure free account — what is free', 'https://azure.microsoft.com/free/', 'the “12 months free” list: B1s 750 hours, 5 GB storage, two 64 GB Standard SSD disks'),
     doc('Pricing calculator', 'https://azure.microsoft.com/pricing/calculator/', 'add Virtual Machines, set hours to 730, then halve them; the Public IP line never becomes free'),
     doc('Storage redundancy', 'azure/storage/common/storage-redundancy', 'the LRS, ZRS, GRS and GZRS table: copies, zones or regions, and the durability nines')],
    'Free: the calculator. Nothing is deployed. Your estimate should come out near $4 a month: the VM’s public IP, and cents for the rest.', [
    portal(s(2, 'arch', 1), 'Price it', 'Price the components in the Azure pricing calculator.', 'azure.microsoft.com/pricing/calculator', [
      'Add: Virtual Machines (B1s, Linux, 730 h), Storage Accounts (LRS, 1 GB), IP Addresses (Standard).',
      'Add: Functions (Consumption) and Azure Cosmos DB (serverless). Read the monthly total.',
      'Halve the VM hours (you deallocate it); subtract the free 750 B1s hours and 5 GB.',
    ], 'A monthly estimate per service, with the public IP the largest line after the VM.', 'Cost is set by size, hours, region, redundancy and traffic, the factors the exam lists. The free account removes the VM and storage lines, leaving the public IP.', {
      docs: [doc('Pricing calculator', 'https://azure.microsoft.com/pricing/calculator/', 'add Virtual Machines, set hours to 730, then halve them; the Public IP line never becomes free')],
      fixes: [{ symptom: 'The VM line is $8, not $4', fix: 'You left 730 hours. A deallocated VM bills no compute: halve the hours, and note that the disk and IP still bill.' }],
    }),
    portal(s(2, 'arch', 2), 'Choose redundancy and tiers', 'Choose LRS or GRS, Hot or Cool, for each asset.', 'The document', [
      'Website storage: LRS (three copies, one datacenter) and Hot: re-uploaded from the repo, read daily.',
      'VM disk: Standard SSD, LRS. Snapshots (Week 8) are the backup.',
      'Cosmos DB: single region, Session consistency. Write the alternative you rejected and its price.',
    ], 'One row per asset: option chosen, alternative rejected, monthly cost.', 'Redundancy is how many copies and where: LRS three in one building, ZRS three zones, GRS a second region. Hot costs more to store, Cool more to read.', {
      docs: [doc('Storage redundancy', 'azure/storage/common/storage-redundancy', 'the LRS, ZRS, GRS and GZRS table: copies, zones or regions, and the durability nines')],
    }),
    rec(2, 'arch', 'Components and cost, Redundancy and tiers', ['One component per row, with its monthly cost.', 'One redundancy row per asset.'], 'The architecture document grows every week and is handed over in Week 12.'),
  ], { tools: ['Pricing calculator'] }),
  T(2, 'infra', 'Deploy the tools VM', 'Deploy a B1s Ubuntu VM into snet-app with SSH-key sign-in only, read its facts, then deallocate it.', 45,
    ['AZ-900 · Azure architecture and services', 'VM sizes and the free tier', 'Availability options: zones and sets', 'Private and public IPs; deallocate vs stop'], ['vm-tools-team01 runs in snet-app', 'The VM is deallocated at the end'],
    [doc('Create a Linux VM (portal)', 'azure/virtual-machines/linux/quick-create-portal', 'the Basics tab: size, availability options, SSH public key; the Networking tab: VNet and subnet'),
     doc('B-series burstable sizes', 'azure/virtual-machines/sizes/general-purpose/bv1-series', 'the B1s row: 1 vCPU, 1 GiB, and the credit model behind a low CPU average')],
    'Free tier: 750 B1s hours a month and the Standard SSD disk. The public IP costs about $3.60 a month; deallocate the VM anyway.', [
    both(s(2, 'infra', 1), 'Create the VM', 'Create the B1s VM in snet-app, SSH key only.', PORTAL, [
      'Virtual machines → Create. Group rg-capstone-team01, name vm-tools-team01, East US, zone 1, Ubuntu 22.04, size B1s.',
      'Authentication: SSH public key, username azureuser, Generate new key pair kp-team01. Disks: Standard SSD.',
      'Networking: vnet-capstone-team01, snet-app, new public IP, NIC security group None. Create → Download private key.',
    ], [
      { cmd: `${VARS}; az vm create -g $RG -n $VM --image Ubuntu2204 --size Standard_B1s --zone 1 --storage-sku StandardSSD_LRS --vnet-name vnet-capstone-team01 --subnet snet-app --nsg "" --public-ip-sku Standard --admin-username azureuser --generate-ssh-keys --tags project=capstone team=team01 env=dev owner=team01-infra`, explain: 'Creates the VM, its disk, NIC and public IP together. The key pair lands in ~/.ssh; download it from Cloud Shell (Manage files) for the Security Admin.', sample: '"powerState": "VM running",\n"privateIpAddress": "10.10.1.4",\n"publicIpAddress": "20.119.8.41"', flags: [
        { flag: '--size Standard_B1s', meaning: 'The free-tier size: 1 vCPU, 1 GiB, burstable.' },
        { flag: '--zone 1', meaning: 'Pin it to availability zone 1 — one building of the region.' },
        { flag: '--storage-sku StandardSSD_LRS', meaning: 'The free-tier disk type. Premium SSD would cost about $5 a month.' },
        { flag: '--nsg ""', meaning: 'No per-VM NSG: the subnet’s NSG already guards it.' },
        { flag: '--generate-ssh-keys', meaning: 'Makes a key pair if you have none; no password exists to guess.' },
      ] },
    ], ['VM running', '10.10.1.4'], 'A VM is IaaS: you choose size, image and zone, and you patch it. B1s and Standard SSD are the free-tier choices. Key-only sign-in removes password guessing.', {
      ...out('vm-tools-team01 shows Status Running, size Standard B1s, zone 1, and a private IP in 10.10.1.x.', doc('Create a Linux VM (portal)', 'azure/virtual-machines/linux/quick-create-portal', 'the Basics tab: size, availability options, SSH public key; the Networking tab: VNet and subnet')),
      fixes: [
        { symptom: 'SkuNotAvailable', fix: 'B1s is out of capacity in that region. Try eastus2 for the VM only, and record why.' },
        { symptom: 'QuotaExceeded', fix: 'Student subscriptions allow few vCPUs. Delete any other VM first.' },
        { symptom: 'Zones are not offered', fix: 'Your subscription or region has no zones for this size. Choose “No infrastructure redundancy required” and record it.' },
      ],
    }),
    both(s(2, 'infra', 2), 'Read its facts and hand over the key', 'Read the IPs, then share the key privately with Security.', PORTAL, [
      'vm-tools-team01 → Overview: note the public IP, the private IP and the zone.',
      'Send kp-team01.pem privately (a DM or password manager), never the repository or email. User: azureuser.',
    ], [
      { cmd: `${VARS}; az vm list-ip-addresses -g $RG -n $VM -o table; ls -l ~/.ssh/id_rsa`, explain: 'The private IP is what other resources use; the public IP only exists for outbound patching and the SSH test. Download the private key from Cloud Shell: Manage files → Download.', sample: 'VirtualMachine    PublicIPAddresses    PrivateIPAddresses\nvm-tools-team01   20.119.8.41          10.10.1.4\n-rw------- 1 user user 2602 id_rsa' },
    ], ['10.10.1.4'], 'The private IP comes from snet-app; the public IP is what the internet reaches. The private key is the password to this machine: never committed.',
    out('Overview shows one public IP, private IP 10.10.1.4 and Availability zone 1.', doc('Connect to a Linux VM with SSH', 'azure/virtual-machines/linux-vm-connect', 'the private-key handling: chmod 400, the -i flag, and keeping the key file out of the open'))),
    rec(2, 'infra', 'Virtual machine facts', ['Name, size, zone, private IP, operating system.'], 'The runbook in Week 7 and the snapshot in Week 8 start from these facts.'),
    DEALLOCATE(2, 'infra'),
  ], { tools: ['Azure portal', 'Cloud Shell'] }),
  T(2, 'dev', 'Publish the website with HTTPS', 'Publish the company website from a storage account static website, HTTPS-only, then change it and redeploy.', 45,
    ['AZ-900 · Azure architecture and services', 'Storage accounts and blob containers', 'Static websites and HTTPS'], ['The site loads over HTTPS', 'A change was redeployed'],
    [doc('Create a storage account', 'azure/storage/common/storage-account-create', 'the Basics tab (Standard, LRS) and the Advanced tab: “Require secure transfer” and the minimum TLS version'),
     doc('Host a static website', 'azure/storage/blobs/storage-blob-static-website-how-to', 'the “Enable static website hosting” steps — the $web container and the primary endpoint URL')],
    'Free tier: 5 GB of LRS storage for 12 months; the static website feature costs nothing.', [
    both(s(2, 'dev', 1), 'Create the storage account', 'Create an HTTPS-only storage account with TLS 1.2.', PORTAL, [
      'Storage accounts → Create. Group rg-capstone-team01, name stwebteam01 plus four digits, East US, Standard, LRS.',
      'Advanced: Require secure transfer on, minimum TLS 1.2, anonymous blob access off.',
      'Review + create → Create. Write the name down.',
    ], [
      { cmd: 'RG=rg-capstone-team01; WEB=stwebteam01$RANDOM; echo $WEB', explain: 'Storage names are global, 3–24 lowercase letters and digits. $RANDOM makes yours unique; write it down.', sample: 'stwebteam0118342' },
      { cmd: 'az storage account create -g $RG -n $WEB --sku Standard_LRS --kind StorageV2 --https-only true --min-tls-version TLS1_2 --allow-blob-public-access false --tags project=capstone team=team01 env=dev owner=team01-dev', explain: 'HTTPS-only and TLS 1.2 refuse old, insecure connections. Blob public access stays off; the website endpoint still serves.', sample: '"enableHttpsTrafficOnly": true,\n"minimumTlsVersion": "TLS1_2"', flags: [
        { flag: '--sku Standard_LRS', meaning: 'Standard disks, three copies in one datacenter — the redundancy the Architect chose.' },
        { flag: '--kind StorageV2', meaning: 'The general-purpose account type that holds blobs, files, tables and queues.' },
        { flag: '--https-only true', meaning: 'Refuse plain HTTP.' },
      ] },
    ], ['TLS1_2'], 'st + web + team01 reads: a storage account, for the website, owned by team01. Digits, because storage names are unique across Azure.', {
      ...out('The account’s Configuration shows Secure transfer required Enabled and Minimum TLS version 1.2.', doc('Create a storage account', 'azure/storage/common/storage-account-create', 'the Basics tab (Standard, LRS) and the Advanced tab: “Require secure transfer” and the minimum TLS version')),
      fixes: [{ symptom: 'The name is already taken', fix: 'Someone in the world has it. Change the digits and try again.' }],
    }),
    both(s(2, 'dev', 2), 'Enable the website and upload', 'Switch on the static website and upload index.html.', PORTAL, [
      'The account → Data management → Static website → Enabled; index index.html, error 404.html. Save.',
      'Copy the endpoint URL. Storage browser → Blob containers → $web → Upload your site/ files.',
      'Open the endpoint URL in a browser: your page, with a padlock.',
    ], [
      { cmd: 'az storage blob service-properties update --account-name $WEB --static-website --index-document index.html --404-document 404.html --auth-mode login', explain: 'Creates the $web container and serves it as a website.', sample: '"staticWebsite": { "enabled": true, "indexDocument": "index.html" }', flags: [
        { flag: '--static-website', meaning: 'Turn the feature on.' },
        { flag: '--auth-mode login', meaning: 'Use your signed-in identity rather than the account key.' },
      ] },
      { cmd: "az storage blob upload-batch --account-name $WEB -s ./site -d '$web' --auth-mode login --overwrite", explain: 'Uploads the site folder. You need the Storage Blob Data Contributor role for --auth-mode login.', sample: 'Finished[#############################################################]  100.0000%', flags: [
        { flag: '-s ./site -d \'$web\'', meaning: 'Source folder on your side; destination container. The quotes stop the shell reading $web as a variable.' },
        { flag: '--overwrite', meaning: 'Replace files that already exist — that is what a redeploy is.' },
      ] },
      { cmd: 'az storage account show -n $WEB --query primaryEndpoints.web -o tsv', explain: 'Prints the site’s address.', sample: 'https://stwebteam0118342.z13.web.core.windows.net/', flags: [
        { flag: '--query primaryEndpoints.web', meaning: 'Only the website endpoint out of the account’s many addresses.' },
      ] },
    ], ['web.core.windows.net'], 'The $web container is served at the web endpoint over HTTPS with Microsoft’s certificate, so no server is run or patched: that is PaaS. Uploading again is a redeploy.', {
      ...out('Static website shows Enabled with a Primary endpoint ending web.core.windows.net; the URL loads your page.', doc('Host a static website', 'azure/storage/blobs/storage-blob-static-website-how-to', 'the “Enable static website hosting” steps — the $web container and the primary endpoint URL')),
      fixes: [
        { symptom: 'AuthorizationPermissionMismatch on upload', fix: 'Assign yourself Storage Blob Data Contributor on the account (Access control → Add role assignment), wait a minute, retry.' },
        { symptom: 'The endpoint shows “The requested content does not exist”', fix: 'index.html is not in $web, or its name differs (Index.html). Upload it to the container root.' },
      ],
    }),
    rec(2, 'dev', 'Website', ['The HTTPS URL.', 'How you redeployed a change.'], 'The site URL is what the counter page calls in Week 3.'),
  ], { tools: ['Azure portal', 'Cloud Shell', 'A text editor'] }),
  T(2, 'secops', 'Put an NSG on the subnet and allow SSH from your IP', 'Create and attach the subnet’s NSG, allow SSH from your own address only, then prove it is allowed from you and blocked elsewhere.', 50,
    ['AZ-900 · Azure architecture and services', 'Network security groups, default rules and priority', 'Defense in depth: one address, one port', 'Allowed and blocked tests'], ['nsg-snet-app-team01 is attached to snet-app', 'SSH works from your IP', 'SSH is blocked from Cloud Shell'],
    [doc('Network security groups overview', 'azure/virtual-network/network-security-groups-overview', 'the “Default security rules” tables — priority 65500 DenyAllInBound is what blocks everything until you allow it'),
     doc('Create a security rule', 'azure/virtual-network/manage-network-security-group#create-a-security-rule', 'the Source field set to “My IP address” and the Priority field — lower numbers are evaluated first'),
     doc('Connect to a Linux VM with SSH', 'azure/virtual-machines/linux-vm-connect', 'the ssh command with -i and the private key, and the “Permission denied” cases at the end')],
    'Free: network security groups and rules. VM hours count while it runs — deallocate it when the test is done.', [
    both(s(2, 'secops', 3), 'Create and attach the NSG', 'Create the NSG and attach it to snet-app.', PORTAL, [
      'Network security groups → Create. Group rg-capstone-team01, name nsg-snet-app-team01, East US. Create.',
      'Open it → Settings → Subnets → Associate → vnet-capstone-team01 / snet-app.',
      'Inbound security rules: read the three default rules at the bottom, priorities 65000–65500.',
    ], [
      { cmd: 'az network nsg create -g rg-capstone-team01 -n nsg-snet-app-team01 --tags project=capstone team=team01 env=dev owner=team01-secops', explain: 'An NSG is a stateful firewall. It starts with default rules that deny all inbound from the internet.', sample: '"name": "nsg-snet-app-team01",\n"provisioningState": "Succeeded"', flags: [
        { flag: '-n nsg-snet-app-team01', meaning: 'Read it as: the NSG that guards subnet snet-app, owned by team01.' },
      ] },
      { cmd: 'az network vnet subnet update -g rg-capstone-team01 --vnet-name vnet-capstone-team01 -n snet-app --nsg nsg-snet-app-team01', explain: 'Attaching it to the subnet protects everything placed there, including the VM.', sample: '"networkSecurityGroup": { "id": ".../nsg-snet-app-team01" }', flags: [
        { flag: '--nsg', meaning: 'Which NSG the subnet uses. One NSG can guard several subnets.' },
      ] },
      { cmd: 'az network nsg rule list -g rg-capstone-team01 --nsg-name nsg-snet-app-team01 --include-default -o table', explain: 'Shows the built-in rules. The last inbound rule, DenyAllInBound, is why nothing reaches the VM until you allow it.', sample: 'Name                 Priority  Access  Direction\nAllowVnetInBound     65000     Allow   Inbound\nDenyAllInBound       65500     Deny    Inbound', flags: [
        { flag: '--include-default', meaning: 'Also show the six rules Azure adds to every NSG; they are hidden otherwise.' },
      ] },
    ], ['Succeeded', 'DenyAllInBound'], 'Rules are checked from the lowest priority number up; the first match wins, and DenyAllInBound (65500) catches the rest. Attach at the subnet, so later resources are protected at once.',
    out('Subnets lists snet-app; Inbound security rules ends with DenyAllInBound at priority 65500.', doc('Network security groups overview', 'azure/virtual-network/network-security-groups-overview', 'the “Default security rules” tables — priority 65500 DenyAllInBound is what blocks everything until you allow it'))),
    both(s(2, 'secops', 1), 'Add the SSH rule', 'Allow TCP 22 from your IP address only.', PORTAL, [
      'nsg-snet-app-team01 → Inbound security rules → Add.',
      'Source: My IP address. Destination port ranges: 22. Protocol: TCP. Action: Allow. Priority 1000. Name Allow-SSH-MyIP.',
      'Add. The rule appears above the default rules.',
    ], [
      { cmd: 'curl -s https://ifconfig.me; echo', explain: 'Run this on YOUR laptop, not Cloud Shell: it prints the address your laptop reaches the internet from.', sample: '203.0.113.25' },
      { cmd: 'MYIP=203.0.113.25   # type the address the first line printed', explain: 'Cloud Shell is another machine with another address, so tell it yours.', sample: '(no output — the variable is set)' },
      { cmd: 'az network nsg rule create -g rg-capstone-team01 --nsg-name nsg-snet-app-team01 -n Allow-SSH-MyIP --priority 1000 --direction Inbound --access Allow --protocol Tcp --source-address-prefixes $MYIP/32 --destination-port-ranges 22', explain: 'A /32 is exactly one address. Priority 1000 is evaluated before the default deny at 65500.', sample: '"access": "Allow",\n"sourceAddressPrefix": "203.0.113.25/32"', flags: [
        { flag: '--priority 1000', meaning: 'Checked before the defaults at 65000+. Leave gaps (1000, 1100…) for rules you add later.' },
        { flag: '--source-address-prefixes $MYIP/32', meaning: 'Only this one address may connect.' },
        { flag: '--destination-port-ranges 22', meaning: 'SSH’s port. Nothing else is opened.' },
      ] },
    ], ['/32'], 'Never 0.0.0.0/0 on port 22: bots scan the whole internet for open SSH within minutes. The NSG is one layer and the key another: defense in depth.',
    out('Allow-SSH-MyIP sits at priority 1000 with your address as a /32, above the default rules.', doc('Create a security rule', 'azure/virtual-network/manage-network-security-group#create-a-security-rule', 'the Source field set to “My IP address” and the Priority field — lower numbers are evaluated first'))),
    portal(s(2, 'secops', 2), 'Test allowed and blocked', 'Test SSH from your laptop, then from Cloud Shell.', 'Your laptop, then Cloud Shell', [
      'Start the VM (vm-tools-team01 → Start) and read the public IP on Overview.',
      'From your laptop, with the shared key, connect (below, by operating system): a prompt appears.',
      'From Cloud Shell: ssh azureuser@PUBLIC_IP times out. Then Stop the VM.',
    ], 'SSH connects from your laptop and times out from Cloud Shell.', 'A rule is only proved when something that should fail does fail. Cloud Shell has a different address, so the /32 rule refuses it, as it refuses any attacker.', {
      docs: [doc('Connect to a Linux VM with SSH', 'azure/virtual-machines/linux-vm-connect', 'the ssh command with -i and the private key, and the “Permission denied” cases at the end')],
      paths: [
        { label: 'macOS / Linux', when: 'Terminal', steps: ['chmod 400 kp-team01.pem', 'ssh -i kp-team01.pem azureuser@PUBLIC_IP'] },
        { label: 'Windows', when: 'PowerShell (OpenSSH is built in)', steps: ['icacls kp-team01.pem /inheritance:r /grant:r "$env:USERNAME:R"', 'ssh -i kp-team01.pem azureuser@PUBLIC_IP'] },
      ],
      fixes: [
        { symptom: 'Timeout from your laptop too', fix: 'Your IP changed (Wi-Fi, VPN), or the VM is not running. Re-run curl ifconfig.me and update the rule’s source.' },
        { symptom: 'Permission denied (publickey)', fix: 'Wrong key file or wrong user name. The user is azureuser and the key is the one created with this VM.' },
        { symptom: 'UNPROTECTED PRIVATE KEY FILE', fix: 'The key is readable by others. Run the chmod / icacls line first.' },
      ],
    }),
    rec(2, 'secops', 'SSH access test', ['The NSG and its default rules.', 'One allowed row, one blocked row.'], 'Week 6 removes this rule entirely; this record is the before.'),
  ], { tools: ['Azure portal', 'Cloud Shell', 'Terminal or PowerShell'], prerequisites: ['The tools VM and its private key (kp-team01.pem) from the Infrastructure Admin, this week — shared privately, never in the repo.'] }),

  // ── Week 3 — Serverless, data and identity ─────────────────────────────
  T(3, 'arch', 'Draw the request flow and say who manages each hop', 'Trace how a page view becomes a count in the database, naming every real URL and who manages each service.', 35,
    ['AZ-900 · Cloud concepts', 'Serverless: what you do not manage', 'Request flows'], ['The flow names real URLs', 'Each hop says who manages it'],
    [doc('Azure Functions overview', 'azure/azure-functions/functions-overview', 'the “Scenarios” list and the diagram of a trigger calling a binding — the two hops your flow names'),
     doc('Shared responsibility in the cloud', 'azure/security/fundamentals/shared-responsibility', 'the PaaS column: the OS, runtime and scaling are Microsoft’s; the code, data and access are yours')],
    'Free: reading the diagram and writing the flow. Nothing is deployed.', [
    portal(s(3, 'arch', 1), 'Read Architecture v3', 'Open the architecture diagram at week 3.', 'Guide → Architecture & IaC', [
      'Pick Week 3. New resources glow.',
      'Follow the solid arrows from Visitors to Cosmos DB.',
      'Click the Function App: the template highlights its lines.',
    ], 'You can name every hop from the browser to the database.', 'The diagram is drawn from the template, so it is the environment you are building, not an illustration. A glowing node arrived this week; a grey one was already there.', {
      docs: [doc('Azure Functions overview', 'azure/azure-functions/functions-overview', 'the “Scenarios” list and the diagram of a trigger calling a binding — the two hops your flow names')],
    }),
    portal(s(3, 'arch', 2), 'Write the flow', 'Write the flow with your real URLs and owners.', 'The document', [
      'Browser → the storage website URL. Page script → GET …/api/visitorCount on the Function App.',
      'Function → Cosmos DB: database capstone, container visitors, item "site". Back: { "count": n }.',
      'For each hop: who runs it (Microsoft) and what we own (code, data, access).',
    ], 'A three-hop flow with real URLs, resource names and who manages each.', 'Serverless means no server you can see: it scales to zero and you pay per execution. A flow with real URLs is testable: each arrow can be called.', {
      docs: [doc('Shared responsibility in the cloud', 'azure/security/fundamentals/shared-responsibility', 'the PaaS column: the OS, runtime and scaling are Microsoft’s; the code, data and access are yours')],
    }),
    rec(3, 'arch', 'Request flow', ['The flow, hop by hop, with who manages each.'], 'Week 6’s path tests follow this flow.'),
  ], { tools: ['The Guide'] }),
  T(3, 'infra', 'Create Cosmos DB and seed the counter', 'Create a serverless Cosmos DB account, a database and a container, and seed the counter item.', 45,
    ['AZ-900 · Azure architecture and services', 'Managed databases: Cosmos DB', 'Serverless capacity and consistency', 'Data Explorer'], ['Container visitors exists with /id', 'Item id "site" has count 0'],
    [doc('Create a Cosmos DB account (portal)', 'azure/cosmos-db/nosql/quickstart-portal', 'the “Create an account” steps: API NoSQL, capacity mode Serverless — and Data Explorer, where the item goes'),
     doc('Serverless capacity mode', 'azure/cosmos-db/serverless', 'the “Pricing” paragraph: you pay per request unit, nothing while idle')],
    'About a cent a month: serverless bills per request and a counter uses almost none. The free-tier account flag is the other route.', [
    both(s(3, 'infra', 1), 'Create the account', 'Create a serverless Cosmos DB account.', PORTAL, [
      'Azure Cosmos DB → Create → Azure Cosmos DB for NoSQL.',
      'Group rg-capstone-team01, account cosmos-capstone-team01 plus four digits, East US, capacity mode Serverless.',
      'Review + create → Create (a few minutes).',
    ], [
      { cmd: 'RG=rg-capstone-team01; COSMOS=cosmos-capstone-team01-$RANDOM; az cosmosdb create -g $RG -n $COSMOS --capabilities EnableServerless --default-consistency-level Session --tags project=capstone team=team01 env=dev owner=team01-infra', explain: 'Serverless bills per request, so an idle counter costs nearly nothing. This takes a few minutes.', sample: '"capabilities": [ { "name": "EnableServerless" } ],\n"provisioningState": "Succeeded"' },
    ], ['EnableServerless', 'Succeeded'], 'Cosmos DB is a managed NoSQL database: items are JSON documents and Microsoft runs and patches it. Provisioned throughput charges every hour; serverless charges per request.', {
      ...out('The account’s Overview shows Capacity mode Serverless and status Online.', doc('Create a Cosmos DB account (portal)', 'azure/cosmos-db/nosql/quickstart-portal', 'the “Create an account” steps: API NoSQL, capacity mode Serverless, then Review + create')),
      fixes: [{ symptom: 'Service unavailable in the region', fix: 'Serverless is not offered everywhere for new accounts. Pick East US 2 for the account only, and record it.' }],
    }),
    both(s(3, 'infra', 2), 'Create the database and container', 'Create database capstone and container visitors.', PORTAL, [
      'The account → Data Explorer → New Container.',
      'Database id: capstone (Create new). Container id: visitors. Partition key: /id. OK.',
    ], [
      { cmd: 'az cosmosdb sql database create -g $RG -a $COSMOS -n capstone', explain: 'A database groups containers.', sample: '"name": "capstone"' },
      { cmd: 'az cosmosdb sql container create -g $RG -a $COSMOS -d capstone -n visitors --partition-key-path /id', explain: 'The partition key decides how data is spread. /id suits one small item.', sample: '"partitionKey": { "paths": [ "/id" ] }' },
    ], ['/id'], 'Account → database → container → items is the hierarchy. The partition key is the one decision you cannot change later: /id, the item’s own name, is safe.',
    out('Data Explorer shows capstone → visitors with partition key /id.', doc('Partitioning in Cosmos DB', 'azure/cosmos-db/partitioning-overview', 'the first section: the partition key decides where an item is stored and cannot be changed later'))),
    portal(s(3, 'infra', 3), 'Seed the counter item', 'Add the item { "id": "site", "count": 0 }.', 'Azure portal — Cosmos DB → Data Explorer', [
      'capstone → visitors → Items → New Item.',
      'Replace the body with { "id": "site", "count": 0 } and Save.',
      'Settings → Keys: note where the Primary connection string is — App & DevOps will need it.',
    ], 'The item "site" with count 0 is listed.', 'The Function updates this one item; seeding it means the first visit finds a number, not an error. The connection string is a key: app setting only, never a page.', {
      docs: [doc('Data Explorer', 'azure/cosmos-db/data-explorer', 'the “Items” section: New Item, the JSON body, and Save')],
    }),
    rec(3, 'infra', 'Data store', ['Account, database, container.', 'Partition key and the seed item.'], 'The API spec’s data model.'),
  ], { tools: ['Azure portal', 'Cloud Shell'] }),
  T(3, 'dev', 'Build the visitor-counter Function', 'Create a Function App with an HTTP trigger that increments the counter, and show the count on the site.', 50,
    ['AZ-900 · Azure architecture and services', 'Azure Functions and the Consumption plan', 'App settings hold configuration, pages do not', 'Calling an API from a page'], ['The API returns a count', 'The site shows it'],
    [doc('Create a function app (portal)', 'azure/azure-functions/functions-create-function-app-portal', 'the hosting choice — Consumption — and the Monitoring tab that enables Application Insights'),
     doc('Cosmos DB bindings for Functions (Node.js v4)', 'azure/azure-functions/functions-bindings-cosmosdb-v2-input?tabs=javascript-v4', 'the JavaScript v4 example: input.cosmosDB with databaseName, containerName, connection and id')],
    'Free: the Consumption plan includes 1 million executions a month for ever; Application Insights lives inside the free 5 GB of Log Analytics.', [
    portal(s(3, 'dev', 1), 'Create the Function App', 'Create a Consumption Function App for Node.js.', 'Azure portal — Function App → Create', [
      'Hosting option: Consumption (not Flex). Resource group rg-capstone-team01. Name func-capstone-team01 plus four digits.',
      'Runtime stack Node.js 20, operating system Windows, East US.',
      'Monitoring: enable Application Insights (a new one). Create.',
    ], 'The Function App is running.', 'Functions is serverless compute: Microsoft runs the servers, your code runs when called, and Consumption bills per execution. Windows Consumption lets you edit code in the portal.', {
      docs: [doc('Create a function app (portal)', 'azure/azure-functions/functions-create-function-app-portal', 'the hosting choice — Consumption — and the Monitoring tab that enables Application Insights')],
      fixes: [
        { symptom: 'Only Flex Consumption is offered', fix: 'On the first screen choose “Select a hosting option” → Consumption. Flex cannot be edited in the portal.' },
        { symptom: 'A storage account is created too', fix: 'Expected: Functions keep their files in one. Leave it; it is inside the free 5 GB.' },
      ],
    }),
    both(s(3, 'dev', 2), 'Add the counter function', 'Add an HTTP function with Cosmos DB bindings.', PORTAL, [
      'Settings → Environment variables → Add CosmosConnection = the Primary connection string (Cosmos DB Keys). Apply.',
      'Overview → Create function → HTTP trigger, name visitorCount, authorization Anonymous. Create.',
      'Code + Test: replace the file with the code below. Save. Test/Run: {"count":1}.',
    ], [
      { cmd: `const { app, input, output } = require('@azure/functions');
const counterIn = input.cosmosDB({ databaseName: 'capstone', containerName: 'visitors', connection: 'CosmosConnection', id: 'site', partitionKey: 'site' });
const counterOut = output.cosmosDB({ databaseName: 'capstone', containerName: 'visitors', connection: 'CosmosConnection' });
app.http('visitorCount', {
  methods: ['GET'], authLevel: 'anonymous', extraInputs: [counterIn], extraOutputs: [counterOut],
  handler: async (request, context) => {
    const item = context.extraInputs.get(counterIn);
    item.count += 1;
    context.extraOutputs.set(counterOut, item);
    return { jsonBody: { count: item.count } };
  },
});`, explain: 'Paste this over the whole file in Code + Test. The two bindings fetch and save the item; the handler adds one and returns it.', sample: '{"count":1}' },
    ], ['count'], 'Bindings do the database calls, so the code is four lines: read, add one, write back, return. CosmosConnection is an app setting: configuration lives in settings, never in code.', {
      ...out('Test/Run returns status 200 with body {"count":1}.', doc('Cosmos DB bindings for Functions (Node.js v4)', 'azure/azure-functions/functions-bindings-cosmosdb-v2-input?tabs=javascript-v4', 'the JavaScript v4 example: input.cosmosDB with databaseName, containerName, connection and id')),
      codeToPaste: true,
      fixes: [
        { symptom: 'Cannot find module @azure/functions', fix: 'The app was created on the v3 model. Delete it and recreate with Node.js 20; the v4 model is the default there.' },
        { symptom: 'Test returns 500 and mentions CosmosConnection', fix: 'The setting is missing or the value is not the full connection string (AccountEndpoint=…;AccountKey=…;). Fix it and Apply.' },
      ],
    }),
    both(s(3, 'dev', 3), 'Call it and show it', 'Call the API, then add the count to the page.', PORTAL, [
      'The function → Get function URL → open it in a new tab: {"count":2}.',
      'Add the snippet below to site/index.html; API → CORS → add your site’s origin. Save.',
      'Upload the changed file to $web (Week 2 step) and reload the site.',
    ], [
      { cmd: 'FUNC=https://func-capstone-team01-XXXX.azurewebsites.net; curl -s $FUNC/api/visitorCount', explain: 'Each call adds one. Replace XXXX with your digits.', sample: '{"count":2}' },
      { cmd: `<p>Visitors: <span id="visitor-count">…</span></p>
<script>
  fetch('https://func-capstone-team01-XXXX.azurewebsites.net/api/visitorCount')
    .then((r) => r.json())
    .then((d) => { document.getElementById('visitor-count').textContent = d.count; });
</script>`, explain: 'Paste into index.html before </body>, with your own URL. The browser calls the API and writes the answer into the page.', sample: '(the page shows: Visitors: 3)' },
    ], ['count'], 'The page calls the API from the visitor’s browser; there is no server. The browser only reads the answer because the API lists the site as an allowed origin.', {
      ...out('The site shows “Visitors: 3” and the number grows on every reload.', doc('CORS on a function app', 'azure/azure-functions/functions-how-to-use-azure-function-app-settings#cors', 'the “CORS” section: add the site’s origin exactly as the browser sends it, with no trailing slash')),
      codeToPaste: true,
      fixes: [{ symptom: 'The page shows “…” for ever', fix: 'Open DevTools → Console. “blocked by CORS policy” means the origin is missing or has a trailing slash; a 404 means the URL is wrong.' }],
    }),
    rec(3, 'dev', 'Endpoints', ['GET /api/visitorCount, what it returns, its status codes.'], 'The spec another developer would call your API from.'),
  ], { tools: ['Azure portal', 'A text editor', 'Browser DevTools'], prerequisites: ['The Cosmos DB account, database capstone and container visitors from the Infrastructure Admin, this week (and its connection string).', 'Your own site from Week 2.'] }),
  T(3, 'secops', 'Give the team the right access', 'Create the team’s Entra group, add the teammates, give it Reader on the resource group, confirm MFA, and confirm no key is in the page.', 45,
    ['AZ-900 · Azure architecture and services', 'Entra ID users and groups', 'RBAC: role + scope, granted to a group', 'MFA for every member'], ['The group holds Reader at resource-group scope', 'All four are members with MFA', 'No key in the page'],
    [doc('Manage groups (Entra)', 'entra/fundamentals/how-to-manage-groups', 'the “Create a basic group” steps — Security group type, and adding members'),
     doc('Assign roles (portal)', 'azure/role-based-access-control/role-assignments-portal', 'the “Add role assignment” steps: pick Reader, then Members → select the group'),
     doc('Azure built-in roles', 'azure/role-based-access-control/built-in-roles', 'the four general roles at the top: Owner, Contributor, Reader, User Access Administrator')],
    'Free: Entra ID groups, role assignments and MFA cost nothing.', [
    both(s(3, 'secops', 1), 'Create the group and add the team', 'Create the readers group with your four teammates.', PORTAL, [
      'Microsoft Entra ID → Groups → New group. Type Security, name grp-capstone-team01-readers.',
      'Members → Add members → your four teammates. Create.',
    ], [
      { cmd: 'GID=$(az ad group create --display-name grp-capstone-team01-readers --mail-nickname grp-capstone-team01-readers --query id -o tsv); az ad group member add -g $GID --member-id $(az ad signed-in-user show --query id -o tsv); echo $GID', explain: 'Creates the group and adds you; add the others the same way with their object ids.', sample: '3f2a9c1e-5b7d-4e8a-9c0f-1a2b3c4d5e6f' },
    ], ['3f2a9c1e'], 'Entra ID holds users and groups; Azure resources trust it for every sign-in. Grant to groups, not people: joining and leaving the team becomes one membership change.', {
      ...out('Groups lists grp-capstone-team01-readers, type Security, with four members.', doc('Manage groups (Entra)', 'entra/fundamentals/how-to-manage-groups', 'the “Create a basic group” steps — Security group type, and adding members')),
      fixes: [{ symptom: 'Insufficient privileges to create a group', fix: 'Your school tenant blocks it. Use an existing group the instructor gives you, and record that.' }],
    }),
    both(s(3, 'secops', 2), 'Assign Reader', 'Assign Reader at resource-group scope.', PORTAL, [
      'rg-capstone-team01 → Access control (IAM) → Add → Add role assignment.',
      'Role: Reader. Members: the group. Review + assign.',
      'Sign in as a teammate: the group is visible, every Create button is greyed.',
    ], [
      { cmd: 'RGID=$(az group show -n rg-capstone-team01 --query id -o tsv); az role assignment create --assignee-object-id $GID --assignee-principal-type Group --role Reader --scope $RGID', explain: 'Reader can see everything in the group and change nothing.', sample: '"roleDefinitionName": "Reader",\n"scope": "/subscriptions/.../resourceGroups/rg-capstone-team01"' },
    ], ['Reader'], 'RBAC is role plus scope: Reader on rg-capstone-team01. Scope is half of least privilege: the right role on too wide a scope is still too much.',
    out('Role assignments shows the readers group as Reader; a member’s portal greys every Create button.', doc('Azure built-in roles', 'azure/role-based-access-control/built-in-roles', 'the Reader row: view everything, change nothing — compare it with Contributor and Owner'))),
    portal(s(3, 'secops', 3), 'Confirm MFA and no key', 'Check MFA on each member and no key in the page.', 'Entra ID → Users, then the browser', [
      'Entra ID → Users → each teammate → Authentication methods: Microsoft Authenticator listed.',
      'View the site source (Ctrl+U): only the API URL, no key (it is an app setting).',
    ], 'Four members with MFA; the page holds a URL and nothing else.', 'MFA per person and least privilege per group are the two identity controls AZ-900 tests. Anything in page source is public; the connection string stays in an app setting.', {
      docs: [doc('Manage user authentication methods', 'entra/identity/authentication/howto-mfa-userdevicesettings', 'the “Manage authentication methods” section: where a user’s registered methods are listed')],
      fixes: [{ symptom: 'A teammate has no authentication method', fix: 'They skipped Week 1’s MFA step. Send them the link: mysignins.microsoft.com → Security info.' }],
    }),
    rec(3, 'secops', 'Identity and access', ['The group, its members, the role and scope, MFA, where the credential lives.'], 'The first lines of the access matrix and the secrets register.'),
  ], { tools: ['Azure portal', 'Cloud Shell'], prerequisites: ['The Function and the site from App & DevOps, this week — for the no-key check.'] }),

  // ── Week 4 — Monitor, govern, pay ──────────────────────────────────────
  T(4, 'arch', 'Report the cost, and read Advisor and Service Health', 'Read what the environment has cost by service, then Advisor’s recommendations and Service Health for your region.', 35,
    ['AZ-900 · Azure management and governance', 'Cost analysis and why cost data lags', 'Azure Advisor', 'Service Health'], ['Spend and largest cost reported', 'One Advisor recommendation owned', 'Service Health checked'],
    [doc('Explore costs with cost analysis', 'azure/cost-management-billing/costs/quick-acm-cost-analysis', 'the “Group by” control and the Service name option — that is your per-service table'),
     doc('Azure Advisor overview', 'azure/advisor/advisor-overview', 'the five categories — Cost, Security, Reliability, Operational excellence, Performance — and that it is free'),
     doc('Service Health', 'azure/service-health/service-health-overview', 'the difference between Azure status (everyone), Service Health (your subscription) and Resource Health (one resource)')],
    'Free: cost analysis, Advisor and Service Health. Cost data lags 8–24 hours, so today’s VM hours are not in it yet.', [
    both(s(4, 'arch', 1), 'Read the cost', 'Group cost by service for this month.', PORTAL, [
      'Cost Management → Cost analysis. Scope rg-capstone-team01, view Accumulated costs, Group by Service name.',
      'Read the table under the chart: service, cost. Compare with your Week 2 estimate.',
      'Budgets → budget-capstone-team01: how much of the $5 is used.',
    ], [
      { cmd: 'az consumption usage list --start-date $(date +%Y-%m-01) --end-date $(date +%F) --query "[].[consumedService, pretaxCost]" -o tsv | awk \'{c[$1]+=$2} END {for (s in c) printf "%-28s %.2f\\n", s, c[s]}\'', explain: 'Usage rows for the month, added up per service. The portal view is the main path; this API is not available on every subscription offer.', sample: 'Microsoft.Compute            0.31\nMicrosoft.Network            0.24\nMicrosoft.Storage            0.01' },
    ], ['Microsoft.'], 'Actual cost is how you find what you forgot to switch off. Microsoft.Network is the public IP; Microsoft.Compute is VM hours, which should be near zero.', {
      ...out('A table of services and their cost this month, with Microsoft.Network the largest line.', doc('Explore costs with cost analysis', 'azure/cost-management-billing/costs/quick-acm-cost-analysis', 'the “Group by” control and the Service name option — that is your per-service table')),
      fixes: [
        { symptom: 'Cost analysis is empty', fix: 'Data takes 8–24 hours after a resource first bills; free-tier hours show as $0. Come back tomorrow and record the date you read it.' },
        { symptom: 'Not supported for this offer (shell)', fix: 'The consumption API is off on student and sponsorship offers. Use the portal; that is the main path.' },
      ],
    }),
    portal(s(4, 'arch', 2), 'Read Advisor and Service Health', 'Own one Advisor recommendation; check Service Health.', 'Azure portal — Advisor, then Service Health', [
      'Advisor → Overview: five categories. Open Cost and Security; pick one recommendation and name its owner.',
      'Service Health → Service issues: any incident in East US? Health advisories: planned maintenance?',
      'Service Health → Health alerts: create one for East US that emails the action group.',
    ], 'One recommendation with an owner, and the region’s health noted.', 'Advisor is Azure looking at what you built and saying how to spend less or be safer; Service Health is Azure telling you about itself.', {
      docs: [doc('Azure Advisor overview', 'azure/advisor/advisor-overview', 'the five categories — Cost, Security, Reliability, Operational excellence, Performance — and that it is free'),
             doc('Service Health', 'azure/service-health/service-health-overview', 'the difference between Azure status (everyone), Service Health (your subscription) and Resource Health (one resource)')],
    }),
    rec(4, 'arch', 'Cost this week', ['Spend to date, and the largest cost with its reason.', 'The Advisor recommendation and its owner.'], 'Week 11 turns this into the cost report.'),
  ], { tools: ['Azure portal', 'Cloud Shell'] }),
  T(4, 'infra', 'Alert on Function errors', 'Create an action group and an alert that emails when the Function returns server errors.', 40,
    ['AZ-900 · Azure management and governance', 'Azure Monitor: metrics, alerts, action groups', 'Why errors, not CPU'], ['The alert exists and emails the team'],
    [doc('Create a metric alert rule', 'azure/azure-monitor/alerts/alerts-create-metric-alert-rule', 'the Condition pane: signal Http5xx, aggregation Total, threshold 0; then the Actions tab'),
     doc('Action groups', 'azure/azure-monitor/alerts/action-groups', 'the Notifications table — Email is free; SMS and voice are not')],
    'Free: the first ten metric alert rules and email notifications cost nothing.', [
    both(s(4, 'infra', 1), 'Create the action group', 'Create an action group that emails the team.', PORTAL, [
      'Monitor → Alerts → Action groups → Create. Group rg-capstone-team01, name ag-capstone-team01, display name capstone.',
      'Notifications: Email → the team address, name team-email. Review + create.',
      'Check the inbox: Azure sends a “you were added to an action group” email.',
    ], [
      { cmd: 'RG=rg-capstone-team01; az monitor action-group create -g $RG -n ag-capstone-team01 --short-name capstone --action email team team01-alerts@school.edu', explain: 'An action group is who gets told and how. Alerts point at it.', sample: '"groupShortName": "capstone",\n"enabled": true' },
    ], ['capstone'], 'Azure Monitor collects metrics and logs from everything; an alert rule watches one signal; an action group is who gets told. One group, many alerts: change the email once.',
    out('Action groups lists ag-capstone-team01, and the team inbox has the welcome email.', doc('Action groups', 'azure/azure-monitor/alerts/action-groups', 'the “Create an action group” steps and the Notifications table — Email is free; SMS and voice are not'))),
    both(s(4, 'infra', 2), 'Create the alert', 'Alert when Http5xx is above zero in five minutes.', PORTAL, [
      'The Function App → Monitoring → Alerts → Create → Alert rule.',
      'Condition: signal Http5xx, Total, Greater than 0, check every 1 minute, lookback 5 minutes.',
      'Actions: ag-capstone-team01. Details: severity 2, name alert-func-5xx-team01. Review + create.',
    ], [
      { cmd: 'FNID=$(az functionapp show -g $RG -n func-capstone-team01-XXXX --query id -o tsv); az monitor metrics alert create -g $RG -n alert-func-5xx-team01 --scopes $FNID --condition "total Http5xx > 0" --window-size 5m --evaluation-frequency 1m --action ag-capstone-team01', explain: 'Http5xx counts server errors. Any error in five minutes fires the alert.', sample: '"name": "alert-func-5xx-team01",\n"enabled": true,\n"severity": 2' },
    ], ['alert-func-5xx-team01'], 'Http5xx means the server failed, the signal users feel. CPU on a serverless app tells you nothing. This week’s drill breaks the Function on purpose: expect an email.', {
      ...out('Alert rules lists alert-func-5xx-team01, enabled, severity 2, scoped to the Function App.', doc('Create a metric alert rule', 'azure/azure-monitor/alerts/alerts-create-metric-alert-rule', 'the Condition pane: signal Http5xx, aggregation Total, threshold 0; then the Actions tab')),
      fixes: [{ symptom: 'No email during the drill', fix: 'Check the action group email was confirmed, and that the alert scope is the Function App (not the plan). Alerts can take up to ten minutes the first time.' }],
    }),
    rec(4, 'infra', 'Signals', ['The signal, where it is measured, the threshold, the action.'], 'The monitoring half of the incident report.'),
  ], { tools: ['Azure portal', 'Cloud Shell'], prerequisites: ['The Function App from App & DevOps (Week 3).'] }),
  T(4, 'dev', 'Find a failure in Application Insights', 'Break the API on purpose, find the exception in Application Insights, and restore it.', 45,
    ['AZ-900 · Azure management and governance', 'Application Insights and Log Analytics', 'Reading an exception'], ['The exception is found', 'The API works again'],
    [doc('Failures and performance views', 'azure/azure-monitor/app/failures-and-performance-views', 'the Failures pane: Operations tab, then “Drill into” a failed sample to read the exception'),
     doc('App settings on a function app', 'azure/azure-functions/functions-how-to-use-azure-function-app-settings', 'the “Settings” section: edit an app setting, Apply, and the restart that follows')],
    'Free: Application Insights data stays well inside the free 5 GB a month.', [
    both(s(4, 'dev', 1), 'Break it', 'Rename the Cosmos setting so the Function fails.', PORTAL, [
      'Function App → Settings → Environment variables → CosmosConnection → rename to CosmosConnection_OFF. Apply, confirm restart.',
      'Note the time. Load the site twice: the counter shows “…” and never fills.',
    ], [
      { cmd: 'RG=rg-capstone-team01; FN=func-capstone-team01-XXXX; V=$(az functionapp config appsettings list -g $RG -n $FN --query "[?name==\'CosmosConnection\'].value" -o tsv); az functionapp config appsettings set -g $RG -n $FN --settings "CosmosConnection_OFF=$V" -o none; az functionapp config appsettings delete -g $RG -n $FN --setting-names CosmosConnection -o none; echo renamed', explain: 'Copies the value under a new name and removes the original. The binding looks for CosmosConnection and finds nothing.', sample: 'renamed' },
    ], ['renamed'], 'Breaking it yourself means you know the answer. The binding asks for CosmosConnection; with the name changed, every request is a 500. The alert should email within five minutes.',
    out('The site’s counter stays at “…”; the function URL returns a 500 error.', doc('App settings on a function app', 'azure/azure-functions/functions-how-to-use-azure-function-app-settings', 'the “Settings” section: edit an app setting, Apply, and the restart that follows'))),
    portal(s(4, 'dev', 2), 'Find it', 'Find the exception in Application Insights.', 'Application Insights → Failures', [
      'Function App → Application Insights → View Application Insights data → Failures.',
      'Operations tab: visitorCount shows failed requests. Click the count.',
      'Drill into a sample: the exception says the connection setting CosmosConnection is missing.',
    ], 'An exception naming the missing Cosmos setting.', 'Application Insights records every request and exception; Log Analytics is the workspace that stores them. Read the message: what failed (the binding), why (setting not found), where (the function).', {
      docs: [doc('Failures and performance views', 'azure/azure-monitor/app/failures-and-performance-views', 'the Failures pane: Operations tab, then “Drill into” a failed sample to read the exception')],
      fixes: [{ symptom: 'No failures yet', fix: 'Telemetry arrives after one to three minutes. Reload the site a few more times and refresh.' }],
    }),
    both(s(4, 'dev', 3), 'Restore it', 'Rename the setting back and retest.', PORTAL, [
      'Environment variables → CosmosConnection_OFF → rename to CosmosConnection. Apply.',
      'Reload the site: the counter shows a number again. Note the time.',
    ], [
      { cmd: 'V=$(az functionapp config appsettings list -g $RG -n $FN --query "[?name==\'CosmosConnection_OFF\'].value" -o tsv); az functionapp config appsettings set -g $RG -n $FN --settings "CosmosConnection=$V" -o none; az functionapp config appsettings delete -g $RG -n $FN --setting-names CosmosConnection_OFF -o none; sleep 20; curl -s https://$FN.azurewebsites.net/api/visitorCount', explain: 'Puts the name back and calls the API. A count means it is fixed.', sample: '{"count":14}' },
    ], ['count'], 'A fix is not done until the retest passes. Tell the Security Admin the times: broke at, alerted at, found at, fixed at. Those four numbers are their incident record.',
    out('The site shows a growing count again and the function URL returns {"count":n}.', doc('App settings on a function app', 'azure/azure-functions/functions-how-to-use-azure-function-app-settings', 'the “Settings” section: the setting name must match what the code asks for, exactly'))),
    rec(4, 'dev', 'Signals', ['Add a signal row for exceptions in Application Insights.'], 'Your half of the monitoring table.'),
  ], { tools: ['Azure portal', 'Cloud Shell', 'Browser DevTools'] }),
  T(4, 'secops', 'Lock the resource group and write the incident record', 'Put a delete lock on the resource group, prove a delete is refused, then write up this week’s drill as an incident.', 40,
    ['AZ-900 · Azure management and governance', 'Resource locks', 'An incident record: symptom, evidence, cause, fix'], ['CanNotDelete lock on the group', 'A delete was refused', 'The incident record is complete'],
    [doc('Lock your resources', 'azure/azure-resource-manager/management/lock-resources', 'the two lock levels, CanNotDelete and ReadOnly, and that a group lock covers everything in it'),
     doc('Metric alerts: what fired and when', 'azure/azure-monitor/alerts/alerts-page', 'the Alerts page: the fired alert’s time and severity — your incident’s “alerted at”')],
    'Free: locks and the alerts page cost nothing.', [
    both(s(4, 'secops', 1), 'Lock the resource group', 'Add a CanNotDelete lock to rg-capstone-team01.', PORTAL, [
      'rg-capstone-team01 → Settings → Locks → Add. Name lock-capstone-team01, type Delete. OK.',
    ], [
      { cmd: 'az lock create -n lock-capstone-team01 -g rg-capstone-team01 --lock-type CanNotDelete --query level -o tsv', explain: 'A delete lock on the group protects every resource in it.', sample: 'CanNotDelete' },
    ], ['CanNotDelete'], 'A resource lock is governance, not access: even an Owner cannot delete a locked resource without removing the lock first. ReadOnly would also block changes, too much while still building.',
    out('Locks lists lock-capstone-team01 with lock type Delete on the resource group.', doc('Lock your resources', 'azure/azure-resource-manager/management/lock-resources', 'the two lock levels, CanNotDelete and ReadOnly, and that a group lock covers everything in it'))),
    both(s(4, 'secops', 2), 'Prove the lock', 'Try to delete the storage account; it is refused.', PORTAL, [
      'The storage account → Delete → type its name → Delete: “Failed … is locked and cannot be deleted”.',
      'Screenshot the error for Evidence. Do not remove the lock.',
    ], [
      { cmd: 'az storage account delete -n stwebteam01XXXX -g rg-capstone-team01 --yes 2>&1 | grep -o "locked" || echo "deleted — the lock is missing"', explain: 'A refused delete prints the word locked; anything else means the lock is not there.', sample: 'locked' },
    ], ['locked'], 'A control is only proved when something that should fail does fail. The message names the lock, so the next person knows what to remove and why it is there.',
    out('Delete fails with “is locked and cannot be deleted”; the storage account is still there.', doc('Lock your resources', 'azure/azure-resource-manager/management/lock-resources', 'the “Considerations before applying your locks” list: what a CanNotDelete lock still allows'))),
    portal(s(4, 'secops', 3), 'Write the incident record', 'Record this week’s drill: symptom, evidence, cause, fix.', 'Monitor → Alerts, then the document', [
      'Monitor → Alerts: find alert-func-5xx-team01 fired; note the time.',
      'From App & DevOps: broke at, found at, fixed at. From the inbox: the alert email.',
      'Cause: the app setting was renamed. Fix: renamed back, retested. Prevention: Week 10 makes settings code.',
    ], 'An incident record with symptom, evidence, cause, fix and the four times.', 'An incident record is how a team learns: what users saw, how you knew, what it was, what fixed it. The four times show who told you first.', {
      docs: [doc('Metric alerts: what fired and when', 'azure/azure-monitor/alerts/alerts-page', 'the Alerts page: the fired alert’s time and severity — your incident’s “alerted at”')],
    }),
    rec(4, 'secops', 'Incident record', ['Symptom, evidence, root cause, fix; the lock.'], 'Week 12 runs this loop again under time pressure.'),
  ], { tools: ['Azure portal', 'Cloud Shell'], prerequisites: ['The break-and-fix times from App & DevOps, this week.'] }),

  // ── Week 5 — Identity ──────────────────────────────────────────────────
  T(5, 'arch', 'Write the access matrix', 'List every principal, its role and scope, with a justification for each.', 35,
    ['Least privilege', 'Role scope'], ['Three or more justified grants'],
    [doc('List role assignments (portal)', 'azure/role-based-access-control/role-assignments-list-portal', 'the “List role assignments for a resource group” steps and the Scope column — inherited grants show “(Inherited)”')],
    'Free: reading role assignments.', [
    both(s(5, 'arch', 1), 'Export the assignments', 'List role assignments on the resource group.', PORTAL, [
      'rg-capstone-team01 → Access control (IAM) → Role assignments.',
      'Note each row: who, role, scope, and whether it is inherited.',
    ], [
      { cmd: 'az role assignment list -g rg-capstone-team01 --include-inherited -o table', explain: 'Shows every grant that applies here, including those inherited from the subscription.', sample: 'Principal              Role                     Scope\nteam01-infra@...       Contributor              /subscriptions/.../resourceGroups/rg-capstone-team01' },
    ], ['Contributor'], 'Inherited grants are the ones people forget; they count just the same.'),
    rec(5, 'arch', 'Access matrix', ['One row per grant: principal, role, scope, why.', 'Mark any grant broader than it needs to be.'], 'Week 11’s posture review reads this matrix.'),
  ]),
  T(5, 'infra', 'Move the key into Key Vault', 'Create the vault, store the Cosmos connection string as a secret, and let the Function read it through its identity — no key in any setting.', 50,
    ['Key Vault in RBAC mode', 'Secrets Officer vs Secrets User', 'Managed identity and Key Vault references'], ['The secret CosmosConnection is in the vault', 'The Function’s setting is a Key Vault reference and the counter still counts'],
    [doc('Key Vault references in app settings', 'azure/app-service/app-service-key-vault-references', 'the @Microsoft.KeyVault(SecretUri=…) syntax, and the “Grant your app access to Key Vault” steps: system-assigned identity plus the Key Vault Secrets User role'),
     doc('Provide access to Key Vault with RBAC', 'azure/key-vault/general/rbac-guide', 'the roles table: Secrets Officer writes secrets, Secrets User only reads them')],
    'Key Vault costs about $0.03 per 10,000 operations — cents. The AZ-104 exam expects it.', [
    both(s(5, 'infra', 1), 'Create the vault and store the key', 'Put the Cosmos connection string in Key Vault.', PORTAL, [
      'Key vaults → Create. Group rg-capstone-team01, name kv-capstone-team01 plus four digits, East US, permission model: Azure RBAC. Tags. Create.',
      'The vault → Access control (IAM) → Add role assignment → Key Vault Secrets Officer → yourself.',
      'Objects → Secrets → Generate/Import: name CosmosConnection, value = the Primary connection string (Cosmos DB → Keys). Create.',
      'Open the secret → the current version → copy the Secret Identifier (a URL).',
    ], [
      { cmd: 'RG=rg-capstone-team01; KV=kv-capstone-team01-$RANDOM; az keyvault create -g $RG -n $KV --enable-rbac-authorization true --tags project=capstone team=team01 env=dev owner=team01-infra; echo $KV', explain: 'A vault in RBAC mode: who may read secrets is an Azure role, the same model as everything else.', sample: 'kv-capstone-team01-18342' },
      { cmd: 'az role assignment create --role "Key Vault Secrets Officer" --assignee $(az ad signed-in-user show --query id -o tsv) --scope $(az keyvault show -n $KV --query id -o tsv) -o none; sleep 30; CS=$(az cosmosdb keys list -g $RG -n cosmos-capstone-team01-XXXX --type connection-strings --query "connectionStrings[0].connectionString" -o tsv); az keyvault secret set --vault-name $KV -n CosmosConnection --value "$CS" --query id -o tsv', explain: 'Gives you the right to write secrets, waits for it to apply, then stores the connection string. The printed id is the Secret Identifier.', sample: 'https://kv-capstone-team01-18342.vault.azure.net/secrets/CosmosConnection/3f2a…' },
    ], ['vault.azure.net/secrets/CosmosConnection'], 'A vault is a safe with an audit log: the key has one home, and every read is recorded. Secrets Officer may write secrets; the Function gets Secrets User: read only. Vault names are global, hence the digits.', {
      fixes: [{ symptom: 'Forbidden when creating the secret', fix: 'The Secrets Officer role has not applied yet (up to a few minutes), or you skipped it. Wait, refresh, retry.' }],
    }),
    both(s(5, 'infra', 2), 'Point the Function at the vault', 'Give the Function an identity and a Key Vault reference.', PORTAL, [
      'Function App → Settings → Identity → System assigned → Status On → Save.',
      'The vault → Access control (IAM) → Add role assignment → Key Vault Secrets User → Managed identity → the Function App.',
      'Function App → Environment variables → CosmosConnection → value: @Microsoft.KeyVault(SecretUri=<the Secret Identifier>) → Apply. Restart the app.',
      'Reload the site: the counter still counts. The setting shows a green “Key vault reference” mark.',
    ], [
      { cmd: 'FN=func-capstone-team01-XXXX; PID=$(az functionapp identity assign -g $RG -n $FN --query principalId -o tsv); az role assignment create --role "Key Vault Secrets User" --assignee-object-id $PID --assignee-principal-type ServicePrincipal --scope $(az keyvault show -n $KV --query id -o tsv) -o none; echo $PID', explain: 'Turns on the Function’s system-assigned identity and lets it read secrets from this vault only.', sample: '7d3e1b2c-…' },
      { cmd: 'URI=$(az keyvault secret show --vault-name $KV -n CosmosConnection --query id -o tsv); az functionapp config appsettings set -g $RG -n $FN --settings "CosmosConnection=@Microsoft.KeyVault(SecretUri=$URI)" --query "[?name==\'CosmosConnection\'].value" -o tsv; az functionapp restart -g $RG -n $FN', explain: 'Replaces the raw key with a pointer to the secret. The Function resolves it with its identity at start-up.', sample: '@Microsoft.KeyVault(SecretUri=https://kv-capstone-team01-18342.vault.azure.net/secrets/CosmosConnection/3f2a…)' },
    ], ['@Microsoft.KeyVault'], 'A managed identity is a sign-in Azure gives the Function: no password to store, rotated for you. With Secrets User on the vault, the Function reads the key at start-up and nobody else needs it.', {
      fixes: [
        { symptom: 'The setting shows a red X and the counter fails', fix: 'The role has not applied yet, or the identity is off. Wait two minutes and Restart; check the SecretUri has no spaces.' },
        { symptom: 'Object ID not found when assigning the role', fix: 'You chose “User” instead of “Managed identity” in the assignment. Pick Managed identity → Function App.' },
      ],
    }),
    rec(5, 'infra', 'Secrets register', ['The vault, the secret name, who may read it (the Function’s identity) and who may write it.'], 'The register shows where every credential lives.'),
  ], { prerequisites: ['The Function App from App & DevOps (Week 3).'] }),
  T(5, 'dev', 'Switch the Function to its identity', 'Give the Function a managed identity, grant it data access to Cosmos DB, and delete the stored key.', 50,
    ['Managed identities', 'Cosmos DB data-plane roles', 'Identity-based connections'], ['The Function uses its identity', 'No Cosmos key remains in settings'],
    [doc('Managed identities for App Service and Functions', 'azure/app-service/overview-managed-identity', 'the “Add a system-assigned identity” steps — the Identity blade, Status On'),
     doc('Cosmos DB data-plane RBAC', 'azure/cosmos-db/nosql/how-to-grant-data-plane-role-based-access', 'the built-in role ids — 00000000-0000-0000-0000-000000000002 is Data Contributor — and the az cosmosdb sql role assignment command'),
     doc('Identity-based connections', 'azure/azure-functions/functions-reference#configure-an-identity-based-connection', 'the __accountEndpoint setting name for Cosmos DB')],
    'Free: managed identities and data-plane role assignments cost nothing.', [
    both(s(5, 'dev', 1), 'Turn on the identity', 'Enable the Function’s system-assigned identity.', PORTAL, [
      'The Function App → Settings → Identity → System assigned → Status On → Save.',
      'Copy the Object (principal) ID.',
    ], [
      { cmd: 'RG=rg-capstone-team01; FN=func-capstone-team01-XXXX; PID=$(az functionapp identity assign -g $RG -n $FN --query principalId -o tsv); echo $PID', explain: 'Azure creates an identity tied to this Function’s lifetime. There is no password to store or leak.', sample: '7c1e2d3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f' },
    ], ['7c1e2d3f'], 'An identity cannot be copied into a chat message or a commit, which is the point.'),
    cli(s(5, 'dev', 2), 'Grant it the data role', 'Grant Cosmos DB Built-in Data Contributor.', [
      { cmd: 'COSMOS=cosmos-capstone-team01-XXXX; az cosmosdb sql role assignment create -g $RG -a $COSMOS --role-definition-id 00000000-0000-0000-0000-000000000002 --principal-id $PID --scope "/"', explain: 'The ...0002 role reads and writes items and nothing else — no keys, no account settings. The portal has no page for Cosmos data-plane roles; this one needs the shell.', sample: '"roleDefinitionId": ".../sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"' },
    ], ['00000000-0000-0000-0000-000000000002'], 'Cosmos DB data access is its own RBAC system, separate from Azure roles.'),
    both(s(5, 'dev', 3), 'Swap the setting', 'Point the binding at the endpoint, then delete the key.', PORTAL, [
      'Environment variables → Add: CosmosConnection__accountEndpoint = https://COSMOS.documents.azure.com:443/.',
      'Point the bindings’ connection at CosmosConnection; delete the old key setting. Apply.',
      'Open the function URL: a count means the identity works.',
    ], [
      { cmd: 'az functionapp config appsettings set -g $RG -n $FN --settings CosmosConnection__accountEndpoint=https://$COSMOS.documents.azure.com:443/', explain: 'The __accountEndpoint suffix tells the binding to sign in with the identity. Point the bindings at CosmosConnection, delete the old key setting, then curl the API.', sample: '"name": "CosmosConnection__accountEndpoint"' },
    ], ['CosmosConnection__accountEndpoint'], 'The best secret is the one that does not exist.'),
    rec(5, 'dev', 'Secrets register', ['The database access row: stored in — nothing; read by — the managed identity.'], 'The register now shows a secret removed, not just moved.'),
  ]),
  T(5, 'secops', 'Prove an access is denied', 'Show what the Function’s identity can do, then prove a Reader cannot change anything.', 40,
    ['Effective permissions', 'Denied-access tests'], ['The identity’s roles are listed', 'A denial is recorded'],
    [doc('Check access for a user (portal)', 'azure/role-based-access-control/check-access', 'the “Check access” button on Access control (IAM) — it lists what a user or identity can do at that scope')],
    'Free: reading and testing access.', [
    both(s(5, 'secops', 1), 'List the identity’s roles', 'List every role the Function’s identity holds.', PORTAL, [
      'rg-capstone-team01 → Access control (IAM) → Check access → search the Function App’s name.',
      'Read the roles listed; the Cosmos data role is separate and will not appear.',
    ], [
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
    ['RFC 1918', 'Segmentation', 'Design trade-offs'], ['Address plan and rules recorded', 'The production gap is stated'],
    [doc('Default outbound access in Azure', 'azure/virtual-network/ip-services/default-outbound-access', 'why a VM needs an explicit outbound path — a public IP, a NAT gateway or a load balancer — and what each costs')],
    'Free: the document. The public IP the VM keeps for outbound is the one line that costs (about $3.60 a month); a NAT gateway would be ten times that.', [
    both(s(6, 'arch', 1), 'Read the effective address plan', 'List every subnet and its NSG.', PORTAL, [
      'vnet-capstone-team01 → Subnets: read each range and the security group column.',
    ], [
      { cmd: 'az network vnet subnet list -g rg-capstone-team01 --vnet-name vnet-capstone-team01 --query "[].{name:name, prefix:addressPrefix, nsg:networkSecurityGroup.id}" -o table', explain: 'One line per subnet: its range and the NSG guarding it.', sample: 'Name       Prefix         Nsg\nsnet-app   10.10.1.0/24   .../nsg-snet-app-team01\nsnet-mgmt  10.10.2.0/24   .../nsg-snet-mgmt-team01' },
    ], ['10.10.2.0/24'], 'The plan is read from Azure, not remembered.'),
    rec(6, 'arch', 'Design summary', ['How admins reach the VM now.', 'What production would add: a NAT gateway and a private VM.'], 'Honest about the trade-off: a public IP for outbound only, to avoid $32 a month.'),
  ]),
  T(6, 'infra', 'Add the management subnet', 'Add snet-mgmt with its own NSG, reserved for a future Bastion.', 35,
    ['Subnet planning', 'Per-subnet NSGs'], ['snet-mgmt is 10.10.2.0/24 with its own NSG'],
    [doc('Add, change or delete a subnet', 'azure/virtual-network/virtual-network-manage-subnet', 'the “Add a subnet” steps and the Network security group dropdown on the same pane')],
    'Free: subnets and NSGs.', [
    both(s(6, 'infra', 1), 'Create the NSG and subnet', 'Create nsg-snet-mgmt-team01 and snet-mgmt.', PORTAL, [
      'Network security groups → Create: nsg-snet-mgmt-team01 in rg-capstone-team01.',
      'vnet-capstone-team01 → Subnets → Add: name snet-mgmt, range 10.10.2.0/24, NSG nsg-snet-mgmt-team01. Save.',
    ], [
      { cmd: 'RG=rg-capstone-team01; az network nsg create -g $RG -n nsg-snet-mgmt-team01', explain: 'Its own NSG, so rules for admin traffic never mix with app rules.', sample: '"provisioningState": "Succeeded"' },
      { cmd: 'az network vnet subnet create -g $RG --vnet-name vnet-capstone-team01 -n snet-mgmt --address-prefixes 10.10.2.0/24 --nsg nsg-snet-mgmt-team01', explain: 'The next /24 after snet-app. No overlap is possible inside the /16.', sample: '"addressPrefix": "10.10.2.0/24",\n"name": "snet-mgmt"' },
    ], ['10.10.2.0/24', 'snet-mgmt'], 'Segmenting now means a Bastion can be added later without renumbering anything.'),
    rec(6, 'infra', 'Address plan', ['One row per subnet: CIDR, purpose, route to internet.'], 'The template in Week 9 must match this plan.'),
  ]),
  T(6, 'dev', 'Lock CORS and trace the request paths', 'Allow only your site to call the API from a browser, prove a foreign origin is refused, and test each public path both ways.', 45,
    ['CORS and origins', 'Negative tests', 'HTTP status codes'], ['Only your site is allowed', 'A foreign origin is refused', 'Reachable and blocked paths recorded'],
    [doc('CORS on a function app', 'azure/azure-functions/functions-how-to-use-azure-function-app-settings#cors', 'the CORS blade: one origin per line, no trailing slash, and why * must not stay there'),
     doc('Require secure transfer', 'azure/storage/common/storage-require-secure-transfer', 'what an HTTP request to a secure-transfer-only account returns — the 400 you are about to see')],
    'Free: CORS is a setting; the tests are four HTTP requests.', [
    both(s(6, 'dev', 3), 'Allow only your site', 'Set CORS to your site origin only.', PORTAL, [
      'The Function App → API → CORS.',
      'Remove * if it is there. Keep only your site’s origin (https://stwebteam01….web.core.windows.net, no trailing slash). Save.',
    ], [
      { cmd: 'RG=rg-capstone-team01; FN=func-capstone-team01-XXXX; SITE=https://stwebteam0118342.z13.web.core.windows.net; az functionapp cors remove -g $RG -n $FN --allowed-origins "*" -o none; az functionapp cors add -g $RG -n $FN --allowed-origins $SITE && az functionapp cors show -g $RG -n $FN', explain: 'Browsers only let pages from listed origins read the API’s answers.', sample: '"allowedOrigins": [ "https://stwebteam0118342.z13.web.core.windows.net" ]' },
    ], ['allowedOrigins'], 'An origin is scheme + host + port. CORS is a browser rule: the API answers everyone, but a browser only lets a page read the answer if its origin is listed. A wildcard admits every website.'),
    cli(s(6, 'dev', 2), 'Prove a foreign origin is refused', 'Call the API as another website would.', [
      { cmd: 'curl -s -D - -o /dev/null -H "Origin: https://evil.example" https://$FN.azurewebsites.net/api/visitorCount | grep -i access-control || echo "no CORS header — refused"', explain: 'A foreign origin gets no Access-Control-Allow-Origin header, so its browser discards the answer. The portal has no way to send a fake Origin; this one needs the shell.', sample: 'no CORS header — refused' },
    ], ['refused'], 'CORS protects browsers, not the API: curl still gets a count. That is why the API must hold no secrets — and since Week 5 it holds none.'),
    both(s(6, 'dev', 1), 'Test the public paths', 'Test the site and the API.', 'Browser DevTools · or Cloud Shell', [
      'Open the site over https:// — the Network tab shows 200.',
      'Change the address to http:// — the account refuses it.',
    ], [
      { cmd: 'curl -sI https://stwebteam0118342.z13.web.core.windows.net | head -1', explain: 'The first line is the status: 200 means the site answered over HTTPS.', sample: 'HTTP/1.1 200 OK' },
      { cmd: 'curl -sI http://stwebteam0118342.z13.web.core.windows.net | head -1', explain: 'Plain HTTP should be refused — the account is HTTPS-only.', sample: 'HTTP/1.1 400 The account being accessed does not support http.' },
    ], ['200 OK', 'does not support http'], 'Testing the insecure path proves the setting, not just the happy path.'),
    rec(6, 'dev', 'Request paths, CORS', ['HTTPS site reachable, HTTP refused, API reachable.', 'The allowed origin and the negative test.'], 'Paths tested both ways are the design proved.'),
  ]),
  T(6, 'secops', 'Remove SSH and use Run Command', 'Delete the SSH rule, administer the VM through Run Command, and prove port 22 is denied.', 45,
    ['Run Command', 'IP flow verify', 'Attack surface'], ['No inbound SSH rule', 'Run Command works', 'IP flow verify says Deny'],
    [doc('Run scripts in a Linux VM (Run Command)', 'azure/virtual-machines/linux/run-command', 'the “Azure portal” section: Operations → Run command → RunShellScript'),
     doc('IP flow verify', 'azure/network-watcher/ip-flow-verify-overview', 'what the result reports — Access and the name of the rule that decided it')],
    'Free: Run Command and IP flow verify. VM hours count while it runs — deallocate at the end.', [
    both(s(6, 'secops', 1), 'Remove SSH, start the VM', 'Delete the SSH rule and start the VM.', PORTAL, [
      'nsg-snet-app-team01 → Inbound security rules → Allow-SSH-MyIP → Delete.',
      'vm-tools-team01 → Start. Then Operations → Run command → RunShellScript.',
      'Script: hostname; systemctl is-active nginx → Run.',
    ], [
      { cmd: `${VARS}; az network nsg rule delete -g $RG --nsg-name nsg-snet-app-team01 -n Allow-SSH-MyIP && az vm start -g $RG -n $VM`, explain: 'With the rule gone, nothing on the internet can reach port 22.', sample: '(no output — the rule is deleted and the VM starts)' },
      { cmd: 'az vm run-command invoke -g $RG -n $VM --command-id RunShellScript --scripts "hostname; systemctl is-active nginx"', explain: 'Run Command goes through the Azure agent, not the network. No port, no key.', sample: '"message": "Enable succeeded: \\n[stdout]\\nvm-tools-team01\\nactive\\n"' },
    ], ['active'], 'The safest open port is none: admin goes through the Azure control plane, which is already authenticated and logged.'),
    both(s(6, 'secops', 2), 'Prove port 22 is denied', 'Ask Network Watcher whether SSH would be allowed.', PORTAL, [
      'Network Watcher → IP flow verify. VM vm-tools-team01, Inbound, TCP, local port 22, remote 203.0.113.25:50000.',
      'Check: Access denied, by DenyAllInBound.',
    ], [
      { cmd: 'az network watcher test-ip-flow -g $RG --vm $VM --direction Inbound --protocol TCP --local 10.10.1.4:22 --remote 203.0.113.25:50000', explain: 'Evaluates the NSG rules for that exact packet, without sending one.', sample: '"access": "Deny",\n"ruleName": "securityRules/DenyAllInBound"' },
    ], ['Deny'], 'Proof from the platform itself, naming the rule that blocked it.'),
    rec(6, 'secops', 'NSG rules', ['Every inbound and outbound rule with its reason.', 'The IP flow verify result.'], 'The rules matrix of the network design.'),
    DEALLOCATE(6, 'secops'),
  ]),

  // ── Week 7 — Server Admin ──────────────────────────────────────────────
  T(7, 'arch', 'Decide the VM size', 'Read the VM’s CPU and memory use and decide whether B1s is still the right size.', 30,
    ['Right-sizing', 'Burstable VMs'], ['A size decision with its evidence'],
    [doc('Monitor a VM', 'azure/virtual-machines/monitor-vm', 'the Metrics pane: Percentage CPU, Average, and the time range picker')],
    'Free: metrics.', [
    both(s(7, 'arch', 1), 'Read the CPU history', 'Read the average CPU for the last week.', PORTAL, [
      'vm-tools-team01 → Monitoring → Metrics. Metric Percentage CPU, aggregation Avg, last 7 days.',
    ], [
      { cmd: 'VMID=$(az vm show -g rg-capstone-team01 -n vm-tools-team01 --query id -o tsv); az monitor metrics list --resource $VMID --metric "Percentage CPU" --interval PT1H --aggregation Average --offset 7d -o table | tail -5', explain: 'Hourly averages. B-series VMs earn credits while idle, so a low average is normal and healthy.', sample: 'Timestamp            Name            Average\n2026-10-20 14:00:00  Percentage CPU  3.2' },
    ], ['Percentage CPU'], 'Right-sizing is cost control with evidence, not a guess.'),
    rec(7, 'arch', 'Sizing decision', ['Size now; keep, grow or shrink, and why.'], 'The decision is reversible and cheap — record it anyway.'),
  ]),
  T(7, 'infra', 'Attach and mount a data disk', 'Add a 4 GB data disk to the VM and mount it at /data so it survives a reboot.', 45,
    ['Managed disks', 'Filesystems', 'fstab'], ['/data is mounted', 'The VM is deallocated'],
    [doc('Attach a data disk (portal)', 'azure/virtual-machines/linux/attach-disk-portal', 'the “Attach a new disk” steps and, below, the “Prepare the disk” commands — the same ones Run Command runs')],
    'About 20 cents a month: a 4 GB Standard HDD data disk. VM hours count while it runs — deallocate at the end.', [
    both(s(7, 'infra', 1), 'Attach the disk', 'Create and attach a 4 GB data disk.', PORTAL, [
      'vm-tools-team01 → Start. Then Settings → Disks → Create and attach a new disk.',
      'Name disk-data-tools-team01, Standard HDD, 4 GiB. Save.',
    ], [
      { cmd: `${VARS}; az vm start -g $RG -n $VM; az vm disk attach -g $RG --vm-name $VM --name disk-data-tools-team01 --new --size-gb 4 --sku Standard_LRS`, explain: 'Data lives on its own disk so the OS disk can be replaced without losing it.', sample: '"lun": 0,\n"name": "disk-data-tools-team01"' },
    ], ['disk-data-tools-team01'], 'Separating data from the OS disk is what makes Week 8’s restore simple.'),
    both(s(7, 'infra', 2), 'Format and mount it', 'Format the disk and mount it at /data.', PORTAL, [
      'Operations → Run command → RunShellScript.',
      'Paste: D=/dev/disk/azure/scsi1/lun0; mkfs.ext4 -q $D; mkdir -p /data; echo "$D /data ext4 defaults,nofail 0 2" >> /etc/fstab; mount -a',
      'Run; then run df -h /data and read the size.',
    ], [
      { cmd: 'az vm run-command invoke -g $RG -n $VM --command-id RunShellScript --scripts "D=/dev/disk/azure/scsi1/lun0; mkfs.ext4 -q $D; mkdir -p /data; echo \\"$D /data ext4 defaults,nofail 0 2\\" >> /etc/fstab; mount -a; df -h /data"', explain: 'The lun0 path never changes between boots, unlike sdc. nofail lets the VM boot even if the disk is missing.', sample: '[stdout]\nFilesystem  Size  Used Avail Use% Mounted on\n/dev/sdc    3.9G   24K  3.7G   1% /data' },
    ], ['/data'], 'A mount that is not in fstab disappears at the next reboot.'),
    rec(7, 'infra', 'Storage', ['The disk, its size, where it is mounted.'], 'The runbook’s storage section.'),
    DEALLOCATE(7, 'infra'),
  ]),
  T(7, 'dev', 'Patch the VM with Update Manager', 'Assess missing updates and install the security ones through Azure Update Manager.', 40,
    ['Update Manager', 'Patch classifications'], ['A patch run succeeded', 'The VM is deallocated'],
    [doc('Deploy updates with Update Manager', 'azure/update-manager/deploy-updates', 'the “Install updates now” steps and the classification checkboxes — Critical and Security')],
    'Free: Update Manager costs nothing for Azure VMs. VM hours count while it runs — deallocate it at the end.', [
    both(s(7, 'dev', 1), 'Assess and install', 'Assess, then install security updates.', PORTAL, [
      'vm-tools-team01 → Start. Then Updates → Check for updates; read the count.',
      'One-time update → Install now. Classifications: Critical, Security. Reboot if required. Install.',
    ], [
      { cmd: `${VARS}; az vm start -g $RG -n $VM; az vm assess-patches -g $RG -n $VM --query "{critical:criticalAndSecurityPatchCount, other:otherPatchCount}"`, explain: 'Assessment lists what is missing without changing anything.', sample: '{ "critical": 12, "other": 30 }' },
      { cmd: 'az vm install-patches -g $RG -n $VM --maximum-duration PT1H --reboot-setting IfRequired --classifications-to-include-linux Critical Security --query "{status:status, installed:installedPatchCount}"', explain: 'Installs only critical and security updates, rebooting only if one requires it.', sample: '{ "status": "Succeeded", "installed": 12 }' },
    ], ['Succeeded'], 'Patching through the platform leaves a record in Update Manager — evidence an auditor can read.'),
    rec(7, 'dev', 'Patching', ['The tool, and the result of the run.'], 'Patch evidence for the runbook and the governance report.'),
    DEALLOCATE(7, 'dev'),
  ]),
  T(7, 'secops', 'Baseline the VM and write the runbook', 'Record what normal looks like on the VM and write the steps to check it is healthy.', 45,
    ['Performance baselines', 'Runbooks'], ['Three baseline metrics', 'A four-step runbook'],
    [doc('Run scripts in a Linux VM (Run Command)', 'azure/virtual-machines/linux/run-command', 'RunShellScript and where the output appears — uptime, free and df are the three numbers you baseline')],
    'Free: Run Command. VM hours count while it runs — deallocate at the end.', [
    both(s(7, 'secops', 1), 'Take the baseline', 'Read load, memory and disk on the VM.', PORTAL, [
      'vm-tools-team01 → Start. Operations → Run command → RunShellScript.',
      'Paste: uptime; free -m | head -2; df -h / | tail -1 → Run.',
    ], [
      { cmd: `${VARS}; az vm start -g $RG -n $VM; az vm run-command invoke -g $RG -n $VM --command-id RunShellScript --scripts "uptime; free -m | head -2; df -h / | tail -1"`, explain: 'Load average, free memory and disk use, taken while the VM is idle — that is what normal means.', sample: '[stdout]\n 14:02:11 up 3 min,  load average: 0.08, 0.10, 0.04\nMem:  848  312  201\n/dev/sda1  29G  2.1G  27G   8% /' },
    ], ['load average'], 'You cannot say “it is slow” without knowing what fast looked like.'),
    portal(s(7, 'secops', 2), 'Write the “when it is slow” step', 'Add the layer-by-layer check to the runbook.', 'The document', [
      'Layers, in order: network (reachable?), identity (allowed?), application (answers?), data (store there?), configuration (setting changed?).',
      'For each layer, one check and one expected result: ping / NSG rules, sign-in, curl the API, Data Explorer, app settings.',
      'Stop at the first layer that fails; that is where the fix goes.',
    ], 'A runbook step that walks the five layers with one check each.', 'Working down the layers stops you fixing what is not broken: a 200 from the API rules out three layers in one look. Week 4’s incident was a configuration fault; this step finds the next one in minutes.'),
    rec(7, 'secops', 'Performance baseline, Runbook', ['Three metrics: normal and alert level.', 'Four runbook steps: check, expect — and the five-layer step.'], 'The runbook is what a teammate on call follows.'),
    DEALLOCATE(7, 'secops'),
  ]),

  // ── Week 8 — Backup and Recovery ───────────────────────────────────────
  T(8, 'arch', 'Set RPO and RTO per asset', 'For each asset, decide how much data the company can lose and how fast it must return.', 30,
    ['Business impact analysis', 'RPO and RTO'], ['Three assets with RPO, RTO and method'],
    [doc('Reliability: recovery targets', 'azure/well-architected/reliability/metrics', 'the definitions of RPO and RTO and the worked example — the two numbers every asset row needs')],
    'Free: a team decision.', [
    portal(s(8, 'arch', 1), 'Rank the assets', 'Rank the website, the counter data and the VM.', 'Team meeting', [
      'Ask: what does an hour of this being down cost?',
      'RPO: how much data can we lose? RTO: how fast must it return?',
      'Name the protection: versioning, snapshot, or the template.',
    ], 'Three assets ranked, each with an RPO, an RTO and a method.', 'Targets come first, backups second: the target decides how often you back up.'),
    rec(8, 'arch', 'Business impact', ['One row per asset.'], 'Week 12’s recovery scenario is judged against these numbers.'),
  ]),
  T(8, 'infra', 'Restore a disk from a snapshot', 'Snapshot the data disk, create a new disk from it, and prove the data is there.', 45,
    ['Snapshots', 'Restore testing'], ['A disk restored from a snapshot', 'The test disk is deleted'],
    [doc('Create a snapshot of a managed disk', 'azure/virtual-machines/snapshot-copy-managed-disk', 'the portal steps — Incremental snapshot — and “Create a disk from a snapshot”')],
    'Cents: an incremental snapshot bills only changed blocks. Delete the test disk so it does not bill; Azure Backup (about $5 a month per VM) is the paid alternative.', [
    both(s(8, 'infra', 1), 'Snapshot and restore', 'Snapshot the data disk and make a disk from it.', PORTAL, [
      'Disks → disk-data-tools-team01 → Create snapshot: name snap-data-tools-team01, Incremental. Create.',
      'Snapshots → snap-data-tools-team01 → Create disk: name disk-data-restore-team01, Standard HDD. Create.',
    ], [
      { cmd: 'RG=rg-capstone-team01; az snapshot create -g $RG -n snap-data-tools-team01 --source disk-data-tools-team01 --incremental true', explain: 'Incremental snapshots store only changed blocks — cents a month.', sample: '"provisioningState": "Succeeded",\n"incremental": true' },
      { cmd: 'az disk create -g $RG -n disk-data-restore-team01 --source snap-data-tools-team01 --sku Standard_LRS --query provisioningState -o tsv', explain: 'A new disk from the snapshot. Attach it to the VM and ls /data to see the files.', sample: 'Succeeded' },
    ], ['Succeeded'], 'Snapshots are cheap; Azure Backup would be about $5 a month per VM — an optional stretch.'),
    both(s(8, 'infra', 2), 'Clean up the test disk', 'Delete the restored test disk.', PORTAL, [
      'Disks → disk-data-restore-team01 → Delete. Keep the snapshot.',
    ], [
      { cmd: 'az disk delete -g $RG -n disk-data-restore-team01 --yes', explain: 'Keep the snapshot, delete the test disk: it proved the restore and now only costs money.', sample: '(no output — the disk is deleted)' },
      { cmd: 'az disk list -g $RG --query "[].name" -o tsv', explain: 'The restore disk should be gone.', sample: 'disk-data-tools-team01\nvm-tools-team01_OsDisk_1' },
    ], ['disk-data-tools-team01'], 'A restore test leaves nothing behind but the evidence.'),
    rec(8, 'infra', 'VM restore', ['The snapshot name, and whether the data was present.'], 'The first proven restore in the DR plan.'),
  ]),
  T(8, 'dev', 'Recover a deleted web file', 'Turn on soft delete and versioning for the website, delete index.html, and get it back.', 40,
    ['Blob soft delete', 'Versioning'], ['index.html was recovered', 'The site loads again'],
    [doc('Enable soft delete for blobs', 'azure/storage/blobs/soft-delete-blob-enable', 'Data protection → “Enable soft delete for blobs” and the retention days'),
     doc('Restore a soft-deleted blob', 'azure/storage/blobs/soft-delete-blob-manage', 'the “Show deleted blobs” toggle in the container view, then Undelete')],
    'Free: soft delete and versioning are settings; retained versions count toward the free 5 GB.', [
    both(s(8, 'dev', 1), 'Turn on protection', 'Enable soft delete and versioning.', PORTAL, [
      'The storage account → Data management → Data protection.',
      'Enable soft delete for blobs (7 days) and Enable versioning for blobs. Save.',
    ], [
      { cmd: 'RG=rg-capstone-team01; WEB=stwebteam0118342; az storage account blob-service-properties update -g $RG -n $WEB --enable-delete-retention true --delete-retention-days 7 --enable-versioning true', explain: 'Deleted files are kept for seven days; every overwrite keeps the previous version.', sample: '"deleteRetentionPolicy": { "days": 7, "enabled": true },\n"isVersioningEnabled": true' },
    ], ['isVersioningEnabled'], 'Protection has to be on BEFORE the accident.'),
    both(s(8, 'dev', 2), 'Delete and recover', 'Delete index.html, then undelete it.', PORTAL, [
      'Storage browser → $web → index.html → Delete. The site returns 404.',
      'Toggle “Show deleted blobs” → index.html → Undelete. Reload the site.',
    ], [
      { cmd: "az storage blob delete --account-name $WEB -c '$web' -n index.html --auth-mode login", explain: 'The site now returns 404.', sample: '(no output — the blob is soft-deleted)' },
      { cmd: "az storage blob undelete --account-name $WEB -c '$web' -n index.html --auth-mode login && curl -sI https://$WEB.z13.web.core.windows.net | head -1", explain: 'Restores the soft-deleted blob. Your endpoint’s zone may differ from z13.', sample: 'HTTP/1.1 200 OK' },
    ], ['200 OK'], 'A backup is only real once you have restored from it.'),
    rec(8, 'dev', 'Website restore', ['What you deleted and how you restored it.'], 'The second proven restore.'),
  ]),
  T(8, 'secops', 'Run a timed recovery drill', 'Snapshot the VM’s OS disk, rebuild a disk from it, time the whole thing, and compare it with the RTO.', 45,
    ['Recovery drills', 'RTO measurement'], ['The drill is timed', 'Test resources are deleted'],
    [doc('Create a snapshot of a managed disk', 'azure/virtual-machines/snapshot-copy-managed-disk', 'the time the portal reports between Create and Succeeded — the drill measures that, end to end')],
    'Cents: one incremental snapshot and one test disk, both deleted at the end.', [
    both(s(8, 'secops', 1), 'Run the drill', 'Start a timer, snapshot the OS disk, restore it.', PORTAL, [
      'Note the time. vm-tools-team01 → Disks → the OS disk → Create snapshot snap-os-drill (Incremental).',
      'Snapshots → snap-os-drill → Create disk disk-os-drill. Note the time when it shows Succeeded.',
    ], [
      { cmd: `${VARS}; date +%T; OS=$(az vm show -g $RG -n $VM --query storageProfile.osDisk.managedDisk.id -o tsv); az snapshot create -g $RG -n snap-os-drill --source $OS --incremental true -o none`, explain: 'Note the start time. The snapshot works while the VM is deallocated.', sample: '14:02:07' },
      { cmd: 'az disk create -g $RG -n disk-os-drill --source snap-os-drill -o none && date +%T', explain: 'The end time. The difference is your measured restore time.', sample: '14:05:52' },
    ], ['14:0'], 'A measured time turns an RTO from a hope into a fact.'),
    both(s(8, 'secops', 2), 'Clean up', 'Delete the drill disk and snapshot.', PORTAL, [
      'Disks → disk-os-drill → Delete. Snapshots → snap-os-drill → Delete.',
    ], [
      { cmd: 'az disk delete -g $RG -n disk-os-drill --yes && az snapshot delete -g $RG -n snap-os-drill && az snapshot list -g $RG --query "[].name" -o tsv', explain: 'Only the infra team’s data snapshot should remain.', sample: 'snap-data-tools-team01' },
    ], ['snap-data-tools-team01'], 'Drills leave no cost behind.'),
    rec(8, 'secops', 'Drill', ['Start, end, RTO met, lessons.'], 'The drill record proves the plan.'),
  ]),

  // ── Week 9 — Infrastructure as Code ────────────────────────────────────
  T(9, 'arch', 'Map the template to the diagram', 'Match five template resources to their diagram nodes, and say what code does that the portal cannot.', 35,
    ['ARM templates', 'The ARM visualizer'], ['Five resources mapped'],
    [doc('ARM template structure and syntax', 'azure/azure-resource-manager/templates/syntax', 'the sections table: parameters, variables, resources, outputs — and what dependsOn means')],
    'Free: reading.', [
    portal(s(9, 'arch', 1), 'Read the template beside the diagram', 'Click five resources and read their template lines.', 'Guide → Architecture & IaC', [
      'Click a node: the template scrolls to its resource.',
      'Note its type, and which parameters and variables it reads.',
      'Tick "Template dependencies": arrows now show dependsOn.',
    ], 'Five resources traced from the picture to the code.', 'The diagram is generated from the template: if they ever disagree, the template is the truth.'),
    portal(s(9, 'arch', 2), 'Write ADR-001', 'Record the decision that the environment is a template.', 'The document', [
      'Context: eight weeks of hand-built resources drift; a new team must get the same environment.',
      'Decision: the environment is an ARM template; the portal is for reading.',
      'Rejected: building by hand — no record, no rebuild, no review. Consequences: every change is a pull request from Week 10.',
    ], 'ADR-001 with context, decision, rejected option and consequences.', 'An Architecture Decision Record keeps the decision and the alternatives, so the next team does not reopen it without new facts. The rejected option matters most: it shows the decision was a choice.'),
    rec(9, 'arch', 'Template map, Portal vs code, ADR-001', ['Five rows: resource, node, parameter.', 'One thing code does that the portal cannot.', 'ADR-001.'], 'The map lets anyone navigate the template.'),
  ]),
  T(9, 'infra', 'Inventory everything with the CLI', 'List every resource with its type and owner tag, and find anything the standard missed.', 35,
    ['JMESPath queries', 'Resource inventory'], ['Five or more resources listed with tags'],
    [doc('az resource list', 'cli/azure/resource#az-resource-list', 'the --query examples — JMESPath picks the columns'),
     doc('Filter resources by tag (portal)', 'azure/azure-resource-manager/management/tag-resources-portal', 'the “View resources by tag” steps — the same inventory without the shell')],
    'Free: listing.', [
    both(s(9, 'infra', 1), 'List the resources', 'List every resource with its owner tag.', PORTAL, [
      'rg-capstone-team01 → Overview: the resource list. Add the Tags column with “Manage view”.',
      'Sort by owner; an empty cell is a resource that broke the standard.',
    ], [
      { cmd: 'az resource list -g rg-capstone-team01 --query "[].{name:name, type:type, owner:tags.owner}" -o table', explain: '--query picks fields with JMESPath. An empty Owner column is a resource that broke the standard.', sample: 'Name                   Type                                     Owner\nvm-tools-team01        Microsoft.Compute/virtualMachines        team01-infra\nnsg-snet-app-team01    Microsoft.Network/networkSecurityGroups' },
    ], ['Microsoft.Compute/virtualMachines'], 'The gaps you find now are what Policy will deny in Week 11.'),
    rec(9, 'infra', 'CLI inventory', ['Five or more resources, their type, tagged or not.'], 'The inventory is the before-picture for the template.'),
  ]),
  T(9, 'dev', 'Fill the starter and deploy to dev', 'Complete the starter ARM template, preview it with what-if, deploy it to a dev resource group, then delete it.', 55,
    ['ARM template structure', 'what-if', 'Deployments'], ['what-if previewed', 'Deployment Succeeded', 'The dev group is deleted'],
    [doc('Deploy resources from a custom template (portal)', 'azure/azure-resource-manager/templates/deploy-portal', 'the “Deploy resources from custom template” steps: Build your own template → load file → parameters'),
     doc('What-if deployments', 'azure/azure-resource-manager/templates/deploy-what-if', 'the result legend — Create, Modify, Delete, NoChange — and the az deployment group what-if command')],
    'Free to deploy; the dev copy runs a second VM and public IP — delete the group the same session so nothing bills overnight.', [
    portal(s(9, 'dev', 1), 'Fill the starter', 'Download the starter and fill its seven blanks.', 'Guide → Architecture & IaC → Starter', [
      'Download azuredeploy.json and both parameter files into infra/.',
      'Replace each FILL-ME using its hint; the Full tab is the answer key.',
      'Commit to a branch.',
    ], 'A template with no FILL-ME left.', 'Filling blanks in a real template teaches its structure faster than writing one from nothing.'),
    both(s(9, 'dev', 2), 'Preview, then deploy', 'Run what-if, then deploy into a dev group.', PORTAL, [
      'Resource groups → Create rg-capstone-team01-dev.',
      'Deploy a custom template → Build your own template → Load file azuredeploy.json → Save.',
      'Fill the parameters (teamId, alertEmail, sshPublicKey). Review + create — the portal shows what it will create — then Create.',
    ], [
      { cmd: 'DEV=rg-capstone-team01-dev; az group create -n $DEV -l eastus -o none; az deployment group what-if -g $DEV --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.dev.json', explain: 'what-if lists every create, change and delete before anything happens.', sample: 'Resource changes: 26 to create.' },
      { cmd: 'az deployment group create -g $DEV --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.dev.json --query properties.provisioningState -o tsv', explain: 'You will be asked for the SSH key and email parameters.', sample: 'Succeeded' },
    ], ['to create', 'Succeeded'], 'Preview first, always: what-if is how you catch a delete you did not mean.'),
    rec(9, 'dev', 'Deployment', ['Blanks filled, what-if result, deployment result.'], 'The deployment record Week 10 automates.'),
    both(s(9, 'dev', 3), 'Delete the dev copy', 'Delete the dev resource group.', PORTAL, [
      'Resource groups → rg-capstone-team01-dev → Delete resource group → type the name → Delete.',
    ], [
      { cmd: 'az group delete -n rg-capstone-team01-dev --yes --no-wait && az group list --query "[].name" -o tsv', explain: 'The whole copy goes in one command — that is why everything lives in one group.', sample: 'rg-capstone-team01\nrg-capstone-team01-dev' },
    ], ['rg-capstone-team01'], 'A second environment doubles the bill until it is gone.'),
  ]),
  T(9, 'secops', 'Write parameter files and validate', 'Set dev and prod parameter values with no secrets in them, and validate the template against both.', 40,
    ['Parameter files', 'Validation', 'Secure parameters'], ['Both parameter files validate', 'No secret in either file'],
    [doc('ARM parameter files', 'azure/azure-resource-manager/templates/parameter-files', 'the file format and the “Parameter precedence” section — why the SSH key is passed on the command line, never stored')],
    'Free: validation deploys nothing.', [
    portal(s(9, 'secops', 1), 'Set the parameter values', 'Set teamId, environment, ownerTag and alertEmail.', 'infra/ in the repository', [
      'dev: environment dev, a small budget.',
      'prod: environment prod.',
      'Leave sshPublicKey out: it is supplied at deploy time.',
    ], 'Two parameter files differing only where environments differ.', 'Parameters are what changes between environments; everything else stays identical, which is what makes prod predictable.'),
    both(s(9, 'secops', 2), 'Validate both', 'Validate the template with each parameter file.', PORTAL, [
      'Deploy a custom template → Load file → fill parameters → Review + create: “Validation passed” is the check. Do not click Create.',
      'Repeat with the other parameter values.',
    ], [
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
    ['Change enablement', 'Risk and rollback'], ['The RFC has risk, rollback and approver'],
    [doc('About pull requests', 'https://docs.github.com/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests', 'the review flow — request, approve, merge — and where the description lives')],
    'Free: GitHub.', [
    portal(s(10, 'arch', 1), 'Write the RFC in a pull request', 'Open a pull request with the RFC as its description.', 'github.com — Pull requests', [
      'The change: e.g. add a tag to every resource.',
      'Risk, rollback plan, and the tests the pipeline runs.',
      'Request review from a teammate; approve only after it passes.',
    ], 'A pull request with a complete RFC, reviewed and approved.', 'The pull request is the change record: who asked, who approved, what ran.'),
    rec(10, 'arch', 'Request for change', ['Change, risk, rollback plan, approver.'], 'The release record’s front page.'),
  ]),
  T(10, 'infra', 'Protect main and add an environment', 'Require a review before anything reaches main, and add a prod environment with a required reviewer.', 30,
    ['Branch protection', 'Deployment environments'], ['Main requires a review', 'prod needs approval'],
    [doc('About protected branches', 'https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches', '“Require a pull request before merging” and “Require approvals”'),
     doc('Using environments for deployment', 'https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment', 'the “Required reviewers” protection rule')],
    'Free: GitHub settings.', [
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
    ['GitHub Actions', 'azure/login', 'azure/arm-deploy'], ['A run deployed the template'],
    [doc('Deploy ARM templates with GitHub Actions', 'azure/azure-resource-manager/templates/deploy-github-actions', 'the “Workflow file” example with azure/login and azure/arm-deploy — copy its shape, use OIDC not a secret')],
    'Free: GitHub Actions gives 2,000 minutes a month on private repositories; a deploy uses about three.', [
    portal(s(10, 'dev', 1), 'Write the workflow', 'Add .github/workflows/deploy.yml.', 'The repository', [
      'On: push to main, and workflow_dispatch.',
      'permissions: id-token write, contents read.',
      'Steps: checkout → azure/login@v2 → azure/arm-deploy@v2 with the prod parameters.',
      'Use the three IDs the Security task stores as repository variables.',
    ], 'A workflow file committed through a pull request.', 'id-token: write is what lets the job ask GitHub for a sign-in token instead of using a stored key.'),
    both(s(10, 'dev', 2), 'Watch it run', 'Merge, then watch the run go green.', 'Repository → Actions · or Cloud Shell', [
      'Merge the pull request. Open the run: login, then deploy.',
      'Approve the prod environment when asked.',
      'Deployments → the resource group → Deployments: the new one reads Succeeded.',
    ], [
      { cmd: 'az deployment group list -g rg-capstone-team01 --query "[0].{name:name, state:properties.provisioningState, when:properties.timestamp}" -o table', explain: 'The latest deployment on the group — the pipeline’s.', sample: 'Name         State      When\nazuredeploy  Succeeded  2026-11-03T14:02:07' },
    ], ['Succeeded'], 'From now on nobody deploys from a laptop.', {
      fixes: [{ symptom: 'AADSTS70021: no matching federated identity', fix: 'The OIDC task is not finished, or its subject does not match your repo and branch exactly.' }],
    }),
    rec(10, 'dev', 'Pipeline runs', ['Run number, stages, result.'], 'The release record.'),
  ]),
  T(10, 'secops', 'Sign in with OIDC and test rollback', 'Let GitHub sign in to Azure with no stored secret, then break a deploy on purpose and roll it back.', 50,
    ['Workload identity federation', 'Rollback'], ['No client secret exists', 'A failed deploy was rolled back'],
    [doc('Connect GitHub to Azure with OpenID Connect', 'azure/developer/github/connect-from-azure-openid-connect', 'the “Add federated credentials” steps and the subject format repo:ORG/REPO:ref:refs/heads/main — one character off and sign-in fails')],
    'Free: app registrations and federated credentials.', [
    both(s(10, 'secops', 1), 'Create the federated sign-in', 'Create an app with a federated credential.', PORTAL, [
      'Microsoft Entra ID → App registrations → New registration: gh-capstone-team01. Register.',
      'Certificates & secrets → Federated credentials → Add: GitHub Actions, your org, repo capstone-team01, entity Branch main.',
      'Copy the Application (client) ID and the Directory (tenant) ID.',
    ], [
      { cmd: 'APP=$(az ad app create --display-name gh-capstone-team01 --query appId -o tsv); az ad sp create --id $APP -o none', explain: 'An app registration is the identity the pipeline signs in as. Echo $APP to see its ID.', sample: '(no output — the app and its service principal exist)' },
      { cmd: 'az ad app federated-credential create --id $APP --parameters \'{"name":"main","issuer":"https://token.actions.githubusercontent.com","subject":"repo:ORG/capstone-team01:ref:refs/heads/main","audiences":["api://AzureADTokenExchange"]}\'', explain: 'Trusts tokens GitHub issues for exactly this repo and branch. No secret is created.', sample: '"issuer": "https://token.actions.githubusercontent.com",\n"subject": "repo:ORG/capstone-team01:ref:refs/heads/main"' },
    ], ['token.actions.githubusercontent.com'], 'A stored key can leak and works from anywhere; a federated token works only for that repo, for minutes.'),
    both(s(10, 'secops', 2), 'Grant it the resource group only', 'Give the pipeline Contributor on the resource group.', PORTAL, [
      'rg-capstone-team01 → Access control (IAM) → Add role assignment: Contributor → Members: gh-capstone-team01.',
      'Save AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID as repository variables (not secrets).',
    ], [
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
    ['Cost analysis', 'Cost optimisation'], ['Three services with spend and an action'],
    [doc('Explore costs with cost analysis', 'azure/cost-management-billing/costs/quick-acm-cost-analysis', 'Group by Service name, and the Budgets view that shows how close to the alert you are')],
    'Free: cost analysis.', [
    both(s(11, 'arch', 1), 'Break down the cost', 'Group this month’s cost by service.', PORTAL, [
      'Cost Management → Cost analysis, scope rg-capstone-team01, group by Service name.',
      'Check the budget: how close to the $4 alert?',
      'For each service, one action: keep, reduce, remove.',
    ], [
      { cmd: 'az consumption budget list --query "[].{name:name, amount:amount, spent:currentSpend.amount}" -o table', explain: 'Where the budget stands, from the shell.', sample: 'Name                    Amount  Spent\nbudget-capstone-team01  5.0     3.12' },
    ], ['budget-capstone-team01'], 'Every line has an owner and a decision — that is FinOps in one table.'),
    rec(11, 'arch', 'Cost by service', ['Three or more services, spend, action.'], 'The cost section of the governance report.'),
  ]),
  T(11, 'infra', 'Require the owner tag with Policy', 'Assign the built-in “Require a tag on resources” policy for owner, and prove it denies an untagged resource.', 40,
    ['Azure Policy', 'Deny effects'], ['The policy is assigned', 'An untagged create is denied'],
    [doc('Assign a policy (portal)', 'azure/governance/policy/assign-policy-portal', 'the “Create a policy assignment” steps: scope, the definition picker, and the Parameters tab where the tag name goes')],
    'Free: Azure Policy costs nothing.', [
    both(s(11, 'infra', 1), 'Assign the policy', 'Assign “Require a tag on resources” for owner.', PORTAL, [
      'Policy → Assignments → Assign policy. Scope rg-capstone-team01.',
      'Definition: search “Require a tag on resources”. Parameters: tag name owner. Review + create.',
    ], [
      { cmd: 'RGID=$(az group show -n rg-capstone-team01 --query id -o tsv); az policy assignment create -n require-owner-tag --policy 871b6d14-10aa-478d-b590-94f262ecfa99 --scope $RGID --params \'{"tagName":{"value":"owner"}}\'', explain: 'The GUID is the built-in policy. From now on, resources without an owner tag are refused.', sample: '"displayName": null,\n"name": "require-owner-tag",\n"enforcementMode": "Default"' },
    ], ['require-owner-tag'], 'A standard that is only written down is a suggestion; Policy makes it a rule.'),
    both(s(11, 'infra', 2), 'Prove it denies', 'Try to create an untagged storage account.', PORTAL, [
      'Storage accounts → Create in rg-capstone-team01 with no tags → Review + create.',
      'Validation fails with RequestDisallowedByPolicy (allow a few minutes after assigning).',
    ], [
      { cmd: 'az storage account create -g rg-capstone-team01 -n sttagtest$RANDOM --sku Standard_LRS 2>&1 | grep -o RequestDisallowedByPolicy', explain: 'Policy can take a few minutes to apply. Retry if the account is created — then delete it.', sample: 'RequestDisallowedByPolicy' },
    ], ['RequestDisallowedByPolicy'], 'Enforcement proved by a denial, not assumed.'),
    rec(11, 'infra', 'Policy', ['The policy and the result of the test.'], 'Governance the platform enforces for you.'),
  ]),
  T(11, 'dev', 'Query the Activity Log', 'Find who changed what in the resource group this week from the Activity Log.', 35,
    ['Activity Log', 'Audit trails'], ['Three audit events recorded'],
    [doc('Azure Monitor activity log', 'azure/azure-monitor/essentials/activity-log', 'the “View the activity log” section and the filters — Operation, Event initiated by, and the 90-day retention')],
    'Free: the Activity Log keeps 90 days at no cost.', [
    both(s(11, 'dev', 1), 'Read the audit trail', 'List this week’s write operations.', PORTAL, [
      'rg-capstone-team01 → Activity log. Timespan: last 7 days.',
      'Read the Operation name, Event initiated by and Time columns.',
    ], [
      { cmd: 'az monitor activity-log list -g rg-capstone-team01 --offset 7d --query "[?contains(operationName.value, \'write\')].{time:eventTimestamp, who:caller, op:operationName.value}" -o table | head -8', explain: 'Every control-plane change is logged with who did it. Kept 90 days free.', sample: 'Time                  Who                    Op\n2026-11-10T14:02:07Z  team01-infra@school    Microsoft.Authorization/policyAssignments/write' },
    ], ['Microsoft.'], 'The audit log is how an incident answers “who did this, and when”.'),
    rec(11, 'dev', 'Audit events', ['Three events: when, who, operation.'], 'Evidence the environment is auditable.'),
  ]),
  T(11, 'secops', 'Review posture in Defender for Cloud', 'Read the free Defender for Cloud recommendations, rank three, and own their remediation.', 40,
    ['Cloud security posture', 'Secure score'], ['Three owned findings'],
    [doc('Review security recommendations', 'azure/defender-for-cloud/review-security-recommendations', 'the Recommendations page: severity, affected resource, and the Remediation steps tab')],
    'Free: the foundational CSPM plan of Defender for Cloud costs nothing; the paid plans are not needed.', [
    both(s(11, 'secops', 1), 'Read the recommendations', 'Open the free recommendations and the secure score.', PORTAL, [
      'Defender for Cloud → Recommendations. Note the secure score.',
      'Filter to rg-capstone-team01. Pick three: severity, affected resource, fix.',
    ], [
      { cmd: 'az security assessment list --query "[?status.code==\'Unhealthy\'].{name:displayName, severity:metadata.severity}" -o table | head -6', explain: 'The same findings from the shell.', sample: 'Name                                          Severity\nManagement ports should be closed on your VMs  High' },
    ], ['Severity'], 'Free CSPM is enough to find real misconfigurations. Paid plans add threat detection.'),
    rec(11, 'secops', 'Posture findings', ['Three findings: severity, owner, remediation.'], 'Open findings become the handover’s risks.'),
  ]),

  // ── Week 12 — Handover ─────────────────────────────────────────────────
  T(12, 'arch', 'Assemble the handover package', 'Catalogue every service, list the open risks, and sign the package off.', 45,
    ['Service transition', 'Risk registers'], ['Four services catalogued', 'Three risks', 'Signed off'],
    [doc('Operational excellence pillar', 'azure/well-architected/operational-excellence/', 'the checklist — the items on documentation, runbooks and handover are what the package must cover')],
    'Free: a document.', [
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
    ['Disaster recovery by redeploy', 'Idempotent templates'], ['The rebuild Succeeded', 'Time recorded', 'Recovery group deleted'],
    [doc('Deploy resources from a custom template (portal)', 'azure/azure-resource-manager/templates/deploy-portal', 'the deployment’s Overview page after Create — its start and end times are your recovery time')],
    'Free to deploy; the recovery copy runs a second VM and public IP — delete the group the same session.', [
    both(s(12, 'infra', 1), 'Rebuild it', 'Deploy the template into a new group, timed.', PORTAL, [
      'Resource groups → Create rg-capstone-team01-recover. Note the time.',
      'Deploy a custom template → Load file azuredeploy.json → prod parameters → Create.',
      'Deployments → the deployment: Succeeded; note the duration.',
    ], [
      { cmd: 'REC=rg-capstone-team01-recover; date +%T; az group create -n $REC -l eastus -o none; az deployment group create -g $REC --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.prod.json --query properties.provisioningState -o tsv; date +%T', explain: 'The whole company, rebuilt from one file. The two times are your recovery time.', sample: '15:10:02\nSucceeded\n15:19:47' },
    ], ['Succeeded'], 'If it can be rebuilt from code, it can be recovered from anything.'),
    both(s(12, 'infra', 2), 'Delete the recovery copy', 'Delete the recovery group.', PORTAL, [
      'Resource groups → rg-capstone-team01-recover → Delete resource group.',
    ], [
      { cmd: 'az group delete -n rg-capstone-team01-recover --yes --no-wait && echo deleting', explain: 'Keep the evidence, not the bill.', sample: 'deleting' },
    ], ['deleting'], 'Clean-up is part of the drill.'),
    rec(12, 'infra', 'Scenario outcomes', ['Recover: rebuild from the template — time and result.'], 'Proof the template is the environment.'),
  ]),
  T(12, 'dev', 'Fix an app failure through CI', 'Break the Function’s configuration by hand, then restore it by re-running the pipeline — no portal fixes.', 45,
    ['Configuration drift', 'Redeploy as a fix'], ['The API failed, then recovered through CI'],
    [doc('Manually run a workflow', 'https://docs.github.com/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow', 'the “Run workflow” button — it only appears when the workflow has workflow_dispatch')],
    'Free: a setting change and one pipeline run.', [
    both(s(12, 'dev', 1), 'Break it', 'Point the Function at a wrong Cosmos endpoint.', PORTAL, [
      'Function App → Environment variables → CosmosConnection__accountEndpoint → set https://wrong.documents.azure.com:443/ → Apply.',
      'Open the function URL: a server error.',
    ], [
      { cmd: 'az functionapp config appsettings set -g rg-capstone-team01 -n func-capstone-team01-XXXX --settings CosmosConnection__accountEndpoint=https://wrong.documents.azure.com:443/ -o none; sleep 30; curl -s -o /dev/null -w "%{http_code}\\n" https://func-capstone-team01-XXXX.azurewebsites.net/api/visitorCount', explain: 'The API now fails with a server error.', sample: '500' },
    ], ['500'], 'This is drift: the running environment no longer matches the code.'),
    portal(s(12, 'dev', 2), 'Fix it through CI', 'Re-run the deploy workflow, then retest.', 'Repository → Actions → deploy → Run workflow', [
      'Run the workflow on main; approve prod.',
      'The template resets the setting.',
      'Open the function URL again: a count, not an error.',
    ], 'The API returns a count again after the pipeline run.', 'Redeploying the known-good template fixes drift without anyone touching the portal.'),
    rec(12, 'dev', 'Scenario outcomes', ['App failure fixed through CI — time and result.'], 'The second scenario of the handover.'),
  ]),
  T(12, 'secops', 'Contain a security incident', 'Open SSH to the internet on purpose, detect it, contain it, and run the final security checklist.', 45,
    ['Detection', 'Containment', 'Final checklist'], ['The rule was detected and removed', 'Checklist complete'],
    [doc('Azure Monitor activity log', 'azure/azure-monitor/essentials/activity-log', 'filter Operation to “Create or Update Security Rule” — the entry names who opened the port and when')],
    'Free: an NSG rule and the Activity Log. The VM stays deallocated, so nothing is exposed.', [
    both(s(12, 'secops', 1), 'Inject the incident', 'Add an SSH rule open to the internet.', PORTAL, [
      'nsg-snet-app-team01 → Inbound security rules → Add: source Any, port 22, TCP, Allow, priority 900, name Bad-SSH-Any.',
    ], [
      { cmd: 'az network nsg rule create -g rg-capstone-team01 --nsg-name nsg-snet-app-team01 -n Bad-SSH-Any --priority 900 --access Allow --protocol Tcp --source-address-prefixes "*" --destination-port-ranges 22 --query access -o tsv', explain: 'The exact misconfiguration attackers scan for. The VM is deallocated, so nothing is exposed.', sample: 'Allow' },
    ], ['Allow'], 'A realistic incident: one bad rule, easy to add, easy to miss.'),
    both(s(12, 'secops', 2), 'Detect and contain', 'Find it in the Activity Log, then delete it.', PORTAL, [
      'rg-capstone-team01 → Activity log → the “Create or Update Security Rule” entry: who, when.',
      'nsg-snet-app-team01 → Inbound security rules → Bad-SSH-Any → Delete.',
    ], [
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
      both(`${P}-w0-setup-s3`, `Deploy through Week ${through}`, `Create the resource group and deploy with throughWeek=${through}.`, PORTAL, [
        'Resource groups → Create: rg-capstone-team01, region East US.',
        'Search “Deploy a custom template” → Build your own template → Load file → infra/azuredeploy.json → Save.',
        `Resource group rg-capstone-team01; fill the parameters; throughWeek ${through}; paste your SSH public key. Review + create.`,
        'Deployments → azuredeploy: wait for “Succeeded”.',
      ], [
        { cmd: 'RG=rg-capstone-team01; az group create -n $RG -l eastus -o none', explain: 'The resource group everything lives in.', sample: '(no output — the group exists)' },
        { cmd: `az deployment group create -g $RG --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.prod.json --parameters throughWeek=${through} sshPublicKey="$(cat ~/.ssh/id_rsa.pub)" --query properties.provisioningState -o tsv`, explain: `throughWeek=${through} leaves every later resource out — the conditions in the template do the choosing.`, sample: 'Succeeded' },
      ], ['Succeeded'], 'One command, and the environment is exactly where the previous course left it.', {
        fixes: [{ symptom: 'No SSH key at ~/.ssh/id_rsa.pub', fix: 'Run ssh-keygen -t ed25519 first and pass that .pub file instead.' }],
      }),
      both(`${P}-w0-setup-s4`, 'Publish what the template cannot', 'Switch on the static website and upload the site.', PORTAL, [
        'Storage accounts → the stweb… account → Static website → Enabled; index.html, 404.html. Save.',
        'Containers → $web → Upload → your site/ files.',
        'Static website: copy the Primary endpoint and open it.',
      ], [
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

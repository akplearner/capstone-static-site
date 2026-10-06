import type { Course, Step, Task, TaskCost, WeekDef } from '../../types';
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
  { n: 5, title: 'Secure by design', theme: 'Least privilege, every layer', objective: 'Give people and the Function exactly the access they need, protect the secrets, fence the API, find what is exposed.',
    milestone: 'The Function reaches Cosmos DB by identity, the key sits in a protected vault, a foreign origin is refused, a denial is proved and the recommendations are owned.',
    labels: ['Write the access matrix and the layers', 'Key Vault, protected and audited', 'The Function’s identity and a locked CORS', 'Prove a denial and find what is exposed'] },
  { n: 6, title: 'Resilient compute', theme: 'Two zones, one address', objective: 'Design, build and fence a two-zone scale set behind a load balancer, with no open port and a private path.',
    milestone: 'ADR-002 is costed, a scale set runs two instances in two zones behind a Standard Load Balancer, the fleet is parked, port 22 is closed and the vault was reached privately.',
    labels: ['Design the two-zone fleet and record the decision', 'Build the scale set across two zones', 'Put the fleet behind a load balancer', 'Close port 22, Bastion, a private endpoint'] },
  { n: 7, title: 'Data and storage', theme: 'The right store, the right tier', objective: 'Choose the data store, run a zone-redundant encrypted PostgreSQL, decouple the counter with a queue, and age blobs out.',
    milestone: 'ADR-003 is costed, a zone-redundant PostgreSQL ran private and encrypted and is stopped, a queue with a poison queue feeds a ledger, and a lifecycle rule ages the site account.',
    labels: ['Choose the data store and the storage tiers', 'Create a zone-redundant PostgreSQL server', 'Queue the visits and write a ledger', 'Lock the data down and age it out'] },
  { n: 8, title: 'Scale, monitor, recover', theme: 'Prove it survives', objective: 'Set recovery targets, scale on demand, lose an instance and a database and get both back, and read the bill.',
    milestone: 'RPO and RTO per asset, autoscale grew the fleet and replaced a lost instance, a file and the database were restored, the drill was timed, and nothing bills by the hour.',
    labels: ['Set RPO, RTO and the autoscale target', 'Autoscale on CPU and prove self-healing', 'Recover a web file and the database', 'Run a timed drill and tear down'] },
  { n: 9, title: 'Infrastructure as code, tested', theme: 'The environment, as a file that is checked', objective: 'Read the environment as a template, detect drift, validate it, check it against policy, preview and deploy to dev.',
    milestone: 'ADR-001 and the environment strategy are written, drift was detected and repaired, the template validates and passes two deny policies, and a dev group was previewed, deployed and deleted.',
    labels: ['Map the template and set the environment strategy', 'Inventory with the CLI and detect drift', 'Fill the starter and deploy to dev', 'Parameter files, validation and policy as code'] },
  { n: 10, title: 'Pipelines with stages and gates', theme: 'Check, deploy dev, approve, deploy prod', objective: 'Deploy through a staged pipeline with no stored keys: a check job, dev, a reviewer before prod, a tested rollback.',
    milestone: 'Main requires the check, the pipeline signs in with OIDC and deploys dev then prod behind a gate, the deploy identity is scoped, and a failure stopped at dev and rolled back.',
    labels: ['Write the change request and the gates', 'Protect main, add the environments, require the checks', 'Build the staged pipeline', 'OIDC, a scoped deploy identity and a rollback test'] },
  { n: 11, title: 'Release strategies and observability', theme: 'Ship by cut-over, watch by number', objective: 'Set service levels and a dashboard, release the fleet blue/green and the function through a slot, judged by a metric.',
    milestone: 'Three SLIs with targets, a shared dashboard that shows them, a blue/green cut-over with no failed request, a slot swapped in or kept out by a metric, the tag rule proved and the audit log read.',
    labels: ['Review cost by service and set the service levels', 'Blue/green the fleet with a second pool', 'Canary the counter with a slot and a metric', 'Dashboard, Policy and the audit trail'] },
  { n: 12, title: 'Incident, compliance and handover', theme: 'Survive it, learn from it, hand it on', objective: 'Recover from code, repair by runbook, fix drift through CI, contain an incident, write its post-mortem, hand over.',
    milestone: 'The environment was rebuilt and timed, an Automation runbook ran, drift was fixed through the pipeline, an incident was contained with a post-mortem, and the handover package is signed off.',
    labels: ['Assemble the handover package', 'Rebuild from the template and automate the restart', 'Fix an app failure through CI', 'Contain a security incident and write the post-mortem'] },
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
  extra: { prerequisites?: string[]; tools?: string[]; cost?: TaskCost } = {}
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

  // ── Week 5 — Secure by design ──────────────────────────────────────────
  T(5, 'arch', 'Write the access matrix and the security design', 'List every principal with its role, scope and justification, then decide the layers a request crosses and what each one refuses.', 40,
    ['AZ-104 · Manage Azure identities and governance', 'Least privilege', 'Defence in depth', 'Built-in and custom roles'], ['Three or more justified grants', 'The layers are named with what each refuses'],
    [doc('List role assignments (portal)', 'azure/role-based-access-control/role-assignments-list-portal', 'the “List role assignments for a resource group” steps and the Scope column — inherited grants show “(Inherited)”'),
     doc('Azure custom roles', 'azure/role-based-access-control/custom-roles', 'the “Steps to create a custom role” list and the Actions / NotActions pair — your matrix says which built-in role each grant would be, and whether a custom one is justified')],
    'Free: reading role assignments and the Well-Architected guidance costs nothing.', [
    both(s(5, 'arch', 1), 'Export the assignments', 'List every role assignment on the resource group.', PORTAL, [
      'rg-capstone-team01 → Access control (IAM) → Role assignments.',
      'Note each row: who, role, scope, and whether it is inherited.',
      'Access control (IAM) → Roles: open Contributor → Permissions, and read what it cannot do.',
    ], [
      { cmd: 'az role assignment list -g rg-capstone-team01 --include-inherited --query "[].[principalName, roleDefinitionName, scope]" -o tsv', explain: 'Every grant that applies here, including those inherited from the subscription.', sample: 'team01-infra@contoso.com\tContributor\t/subscriptions/…/resourceGroups/rg-capstone-team01\ngrp-capstone-team01-readers\tReader\t/subscriptions/…/resourceGroups/rg-capstone-team01' },
      { cmd: 'az role definition list -n Contributor --query "[0].permissions[0].notActions" -o tsv', explain: 'What Contributor is refused: granting access, and a few others. The matrix needs the refusals as much as the grants.', sample: 'Microsoft.Authorization/*/Delete\nMicrosoft.Authorization/*/Write\nMicrosoft.Authorization/elevateAccess/Action' },
    ], ['Contributor'], 'Inherited grants are the ones people forget; they count just the same. A role is defined by what it refuses too.'),
    portal(s(5, 'arch', 2), 'Name the layers', 'Write one line per layer a request crosses.', 'Deliverables tab · Access matrix', [
      'Edge (the static site, the load balancer), network (subnets, NSGs), identity (roles, scopes), application (CORS), data (encryption, data-plane roles).',
      'For each layer write what it refuses and which role owns the rule.',
    ], 'Five layers, each with a refusal and an owner.', 'The exam asks which layer stops a given request; the matrix is where the team agrees on it before anything is built.'),
    rec(5, 'arch', 'Access matrix', ['One row per grant: principal, role, scope, why.', 'Mark any grant broader than it needs to be.', 'The layers, each with what it refuses.'], 'Week 11’s posture review reads this matrix.'),
  ]),
  T(5, 'infra', 'Move the key into Key Vault, protected and audited', 'Create the vault in RBAC mode, store the Cosmos connection string, point the Function at it, then turn on purge protection and the audit log.', 55,
    ['AZ-104 · Manage Azure identities and governance', 'Key Vault in RBAC mode', 'Secrets Officer vs Secrets User', 'Soft delete, purge protection and AuditEvent'], ['The secret CosmosConnection is in the vault', 'The Function’s setting is a Key Vault reference and the counter still counts', 'Purge protection is on and reads are logged'],
    [doc('Key Vault references in app settings', 'azure/app-service/app-service-key-vault-references', 'the @Microsoft.KeyVault(SecretUri=…) syntax, and the “Grant your app access to Key Vault” steps: system-assigned identity plus the Key Vault Secrets User role'),
     doc('Provide access to Key Vault with RBAC', 'azure/key-vault/general/rbac-guide', 'the roles table: Secrets Officer writes secrets, Secrets User only reads them'),
     doc('Key Vault soft-delete and purge protection', 'azure/key-vault/general/soft-delete-overview', 'the “Purge protection” paragraph: once on, nobody can purge a deleted vault or secret before the retention period ends — not even an Owner')],
    'Key Vault costs about $0.03 per 10,000 operations: cents. The audit log lands in the Week 3 workspace, inside its free 5 GB.', [
    both(s(5, 'infra', 1), 'Create the vault and store the key', 'Put the Cosmos connection string in Key Vault.', PORTAL, [
      'Key vaults → Create. Group rg-capstone-team01, name kv-capstone-team01 plus four digits, East US, permission model: Azure RBAC. Tags. Create.',
      'The vault → Access control (IAM) → Add role assignment → Key Vault Secrets Officer → yourself.',
      'Objects → Secrets → Generate/Import: name CosmosConnection, value = the Primary connection string (Cosmos DB → Keys). Create.',
      'Open the secret → the current version → copy the Secret Identifier (a URL).',
    ], [
      { cmd: 'RG=rg-capstone-team01; KV=kv-capstone-team01-$RANDOM; az keyvault create -g $RG -n $KV --enable-rbac-authorization true --tags project=capstone team=team01 env=dev owner=team01-infra -o none; echo $KV', explain: 'A vault in RBAC mode: who may read secrets is an Azure role, the same model as everything else.', sample: 'kv-capstone-team01-18342' },
      { cmd: 'az role assignment create --role "Key Vault Secrets Officer" --assignee $(az ad signed-in-user show --query id -o tsv) --scope $(az keyvault show -n $KV --query id -o tsv) -o none; sleep 30; CS=$(az cosmosdb keys list -g $RG -n cosmos-capstone-team01-XXXX --type connection-strings --query "connectionStrings[0].connectionString" -o tsv); az keyvault secret set --vault-name $KV -n CosmosConnection --value "$CS" --query id -o tsv', explain: 'Gives you the right to write secrets, waits for it to apply, then stores the connection string. The printed id is the Secret Identifier.', sample: 'https://kv-capstone-team01-18342.vault.azure.net/secrets/CosmosConnection/3f2a…' },
    ], ['vault.azure.net/secrets/CosmosConnection'], 'A vault is a safe with an audit log: the key has one home, and every read is recorded. Secrets Officer may write; the Function gets Secrets User, read only. Vault names are global, hence the digits.', {
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
    both(s(5, 'infra', 3), 'Protect the vault and log every read', 'Purge protection on; AuditEvent to Log Analytics.', PORTAL, [
      'The vault → Settings → Properties → Purge protection: Enable → Save. It cannot be switched off again.',
      'Monitoring → Diagnostic settings → Add: name audit, category AuditEvent, destination log-capstone-team01. Save.',
      'After a few minutes: Logs → AzureDiagnostics | where OperationName == "SecretGet": the Function’s reads.',
    ], [
      { cmd: 'az keyvault update -n $KV --enable-purge-protection true --query "properties.[enableSoftDelete, enablePurgeProtection]" -o tsv', explain: 'Soft delete keeps a deleted secret for the retention period; purge protection stops anyone emptying the bin early.', sample: 'True\tTrue' },
      { cmd: 'LOG=$(az monitor log-analytics workspace show -g $RG -n log-capstone-team01 --query id -o tsv); az monitor diagnostic-settings create -n audit --resource $(az keyvault show -n $KV --query id -o tsv) --workspace $LOG --logs \'[{"category":"AuditEvent","enabled":true}]\' --query "logs[0].category" -o tsv', explain: 'Every data-plane call on the vault, who made it and whether it was allowed, lands in the workspace.', sample: 'AuditEvent' },
    ], ['True', 'AuditEvent'], 'The exam asks what protects a secret from a careless delete and who read it last week; these two switches are the answer, and an auditor reads the same log.'),
    rec(5, 'infra', 'Secrets register', ['The vault, the secret name, who may read it (the Function’s identity) and who may write it.', 'Purge protection on; the audit log destination.'], 'The register shows where every credential lives, and that its reads are recorded.'),
  ], { prerequisites: ['The Function App from App & DevOps (Week 3).'] }),
  T(5, 'dev', 'Switch the Function to its identity and lock CORS', 'Give the Function a managed identity with a data-plane role, delete the stored key, then allow only your site to call the API.', 55,
    ['AZ-104 · Manage Azure identities and governance', 'Managed identities', 'Cosmos DB data-plane roles', 'CORS at the API'], ['The Function uses its identity', 'No Cosmos key remains in settings', 'A foreign origin is refused and the API still works'],
    [doc('Managed identities for App Service and Functions', 'azure/app-service/overview-managed-identity', 'the “Add a system-assigned identity” steps — the Identity blade, Status On'),
     doc('Cosmos DB data-plane RBAC', 'azure/cosmos-db/nosql/how-to-grant-data-plane-role-based-access', 'the built-in role ids — 00000000-0000-0000-0000-000000000002 is Data Contributor — and the az cosmosdb sql role assignment command'),
     doc('CORS on a function app', 'azure/azure-functions/functions-how-to-use-azure-function-app-settings#cors', 'the CORS blade: one origin per line, no trailing slash, and why * must not stay there')],
    'Free: managed identities, data-plane role assignments and CORS settings cost nothing.', [
    both(s(5, 'dev', 1), 'Turn on the identity', 'Enable the Function’s system-assigned identity.', PORTAL, [
      'The Function App → Settings → Identity → System assigned → Status On → Save.',
      'Copy the Object (principal) ID.',
    ], [
      { cmd: 'RG=rg-capstone-team01; FN=func-capstone-team01-XXXX; PID=$(az functionapp identity assign -g $RG -n $FN --query principalId -o tsv); echo $PID', explain: 'Azure creates an identity tied to this Function’s lifetime. There is no password to store or leak.', sample: '7c1e2d3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f' },
    ], ['7c1e2d3f'], 'An identity cannot be copied into a chat message or a commit, which is the point.'),
    cli(s(5, 'dev', 2), 'Grant it the data role', 'Grant Cosmos DB Built-in Data Contributor.', [
      { cmd: 'COSMOS=cosmos-capstone-team01-XXXX; az cosmosdb sql role assignment create -g $RG -a $COSMOS --role-definition-id 00000000-0000-0000-0000-000000000002 --principal-id $PID --scope "/" --query roleDefinitionId -o tsv', explain: 'The …0002 role reads and writes items and nothing else: no keys, no account settings. The portal has no page for Cosmos data-plane roles; this one needs the shell.', sample: '/subscriptions/…/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002' },
    ], ['00000000-0000-0000-0000-000000000002'], 'Cosmos DB data access is its own RBAC system, separate from Azure roles: a Contributor on the account still cannot read a document.'),
    both(s(5, 'dev', 3), 'Swap the setting and allow your origin only', 'Endpoint instead of key; CORS to your site.', PORTAL, [
      'Environment variables → Add: CosmosConnection__accountEndpoint = https://COSMOS.documents.azure.com:443/. Delete the old key setting. Apply.',
      'API → CORS: remove * if it is there; keep only your site’s origin (https://stwebteam01….web.core.windows.net, no trailing slash). Save.',
      'Open the function URL: a count means the identity works.',
    ], [
      { cmd: 'SITE=https://stwebteam0118342.z13.web.core.windows.net; az functionapp config appsettings set -g $RG -n $FN --settings CosmosConnection__accountEndpoint=https://$COSMOS.documents.azure.com:443/ --query "[?name==\'CosmosConnection__accountEndpoint\'].name" -o tsv; az functionapp cors remove -g $RG -n $FN --allowed-origins "*" -o none; az functionapp cors add -g $RG -n $FN --allowed-origins $SITE --query allowedOrigins -o tsv', explain: 'The __accountEndpoint suffix tells the binding to sign in with the identity; then one allowed origin, no wildcard.', sample: 'CosmosConnection__accountEndpoint\nhttps://stwebteam0118342.z13.web.core.windows.net' },
    ], ['CosmosConnection__accountEndpoint', 'web.core.windows.net'], 'The best secret is the one that does not exist. CORS is the application layer’s fence: the API still answers anyone, but a browser on another site is refused the answer.'),
    cli(s(5, 'dev', 4), 'Prove a foreign origin is refused', 'Send a forged Origin header; expect no allow header.', [
      { cmd: 'curl -s -D - -o /dev/null -H "Origin: https://evil.example" https://$FN.azurewebsites.net/api/visitorCount | grep -ci "access-control-allow-origin" || echo "no allow header"', explain: 'A request claiming to come from another site. The count is still returned, but without the header a browser needs.', sample: 'no allow header' },
      { cmd: 'curl -s -D - -o /dev/null -H "Origin: $SITE" https://$FN.azurewebsites.net/api/visitorCount | grep -i "access-control-allow-origin"', explain: 'The same request from your own site: the header is present.', sample: 'access-control-allow-origin: https://stwebteam0118342.z13.web.core.windows.net' },
    ], ['no allow header', 'access-control-allow-origin'], 'A negative test is the proof: the exam asks what happens to the other origin, and the answer is in this output. CORS protects browsers, not the API, which is why the API holds no secret.'),
    rec(5, 'dev', 'Secrets register', ['The database access row: stored in — nothing; read by — the managed identity.', 'The CORS origin and the negative test result.'], 'The register shows a secret removed, not just moved, and a fence that was tested.'),
  ]),
  T(5, 'secops', 'Prove an access is denied and find what is exposed', 'Show what the Function’s identity can do, prove a Reader cannot change anything, then read Defender for Cloud’s recommendations for the group.', 40,
    ['AZ-104 · Manage Azure identities and governance', 'Effective permissions', 'Denied-access tests', 'Defender for Cloud recommendations'], ['The identity’s roles are listed', 'A denial is recorded', 'Each recommendation is owned or accepted'],
    [doc('Check access for a user (portal)', 'azure/role-based-access-control/check-access', 'the “Check access” button on Access control (IAM) — it lists what a user or identity can do at that scope'),
     doc('Defender for Cloud recommendations', 'azure/defender-for-cloud/review-security-recommendations', 'the recommendation page: the affected resources list, the severity, and the Exempt option for a finding the team accepts on purpose')],
    'Free: Check access, the simulator and the foundational Defender for Cloud posture cost nothing.', [
    both(s(5, 'secops', 1), 'List the identity’s roles', 'List every role the Function’s identity holds.', PORTAL, [
      'rg-capstone-team01 → Access control (IAM) → Check access → search the Function App’s name.',
      'Read the roles listed; the Cosmos data role is separate and will not appear.',
    ], [
      { cmd: 'PID=$(az functionapp identity show -g rg-capstone-team01 -n func-capstone-team01-XXXX --query principalId -o tsv); az role assignment list --assignee $PID --all --query "[].[roleDefinitionName, scope]" -o tsv', explain: 'Azure roles only. The Cosmos data role lives in its own system, so this list should be one line.', sample: 'Key Vault Secrets User\t/subscriptions/…/vaults/kv-capstone-team01-18342' },
    ], ['Key Vault Secrets User'], 'Short lists are good lists: one role, one scope, and the exam’s “least privilege” is a fact you can print.'),
    both(s(5, 'secops', 2), 'Test a denial', 'As a Reader, try to deallocate the VM.', 'Azure portal — signed in as a Reader', [
      'Use a teammate in the readers group, or Check access → their account.',
      'Open vm-tools-team01 → Stop.',
      'Expect: “does not have authorization to perform action”.',
    ], [
      { cmd: 'GID=$(az ad group show -g grp-capstone-team01-readers --query id -o tsv); az role assignment list --assignee $GID -g rg-capstone-team01 --query "[].roleDefinitionName" -o tsv; az role definition list -n Reader --query "[0].permissions[0].actions" -o tsv', explain: 'The group holds Reader, and Reader’s only action is */read. A deallocate is an action, so it is refused by absence of an allow.', sample: 'Reader\n*/read' },
    ], ['Reader', '*/read'], 'A permission is only proved when the thing it forbids fails. The portal shows the refusal; the role definition shows why.'),
    both(s(5, 'secops', 3), 'Read the posture', 'Defender for Cloud recommendations for the group.', PORTAL, [
      'Microsoft Defender for Cloud → Recommendations → filter Resource group = rg-capstone-team01.',
      'Read each row: the resource, the severity, the fix. Decide: fix it, own it, or exempt it with a reason.',
    ], [
      { cmd: 'az security assessment list --query "[?status.code==\'Unhealthy\'].[displayName]" -o tsv | sort | uniq -c | sort -rn | head -5', explain: 'The unhealthy assessments across the subscription, most frequent first. The storage and Cosmos public-network rows are expected: the site must be public.', sample: '      2 Storage accounts should restrict network access using virtual network rules\n      1 Azure Cosmos DB accounts should have firewall rules' },
    ], ['should'], 'A recommendation is not a fault until you have read it: the site is meant to be public. Own what is not intended, exempt what is, and write the reason.'),
    rec(5, 'secops', 'Access tests', ['Who, what they tried, expected, result.', 'Each recommendation: fixed, owned or exempted, and why.'], 'Evidence that the matrix is enforced, not just written.'),
  ]),

  // ── Week 6 — Resilient compute ─────────────────────────────────────────
  T(6, 'arch', 'Design the two-zone fleet and record the decision', 'Decide how the site survives a zone: two zones, a load balancer, a scale set of two; cost it against the alternative.', 40,
    ['AZ-104 · Deploy and manage Azure compute resources', 'Availability zones', 'Load Balancer SKUs', 'Architecture decision records'], ['Two zones are named with their roles', 'The design is costed against the single-VM alternative', 'ADR-002 is written'],
    [doc('Availability zones', 'azure/reliability/availability-zones-overview', 'the “Zonal and zone-redundant services” paragraph: a zonal VM lives in one zone, a zone-redundant load balancer in all of them — your design uses both'),
     doc('Load Balancer pricing', 'https://azure.microsoft.com/pricing/details/load-balancer/', 'the Standard tier: the hourly rate per rule and the data-processed line — the cost the team accepts for a fleet that survives a zone')],
    'Free: the design is on paper; the fleet it describes is costed on the next tasks.', [
    both(s(6, 'arch', 1), 'Read the zones', 'List the region’s zones and where the VM sits.', PORTAL, [
      'vm-tools-team01 → Overview → Availability zone: one number, or “No infrastructure redundancy”.',
      'Virtual machines → Create → Availability options → Availability zone: read the zones the region offers for B1s.',
    ], [
      { cmd: 'RG=rg-capstone-team01; az vm show -g $RG -n vm-tools-team01 --query "zones" -o tsv; az vm list-skus -l eastus --size Standard_B1s --query "[0].locationInfo[0].zones" -o tsv', explain: 'The VM’s zone (or none), then the zones B1s is offered in. Today everything is in one.', sample: '1\n1\t2\t3' },
    ], ['1'], 'A design that lives in one zone has one zone’s failure rate. The exam calls the fix “zone-redundant”; the picture calls it instances in two zones behind one address.'),
    portal(s(6, 'arch', 2), 'Cost the fleet', 'Price the load balancer and two VMs, against one.', 'Azure Pricing Calculator (azure.microsoft.com/pricing/calculator)', [
      'Add Load Balancer, Standard, 1 rule, 730 hours, 10 GB processed: read the monthly total.',
      'Add Virtual Machines: two B1s Linux, 730 hours each, pay as you go; the free account covers one.',
      'Write both totals and the difference against the single VM the company runs today.',
    ], 'A monthly figure for the fleet and for the single VM, and the difference.', 'Resilience is bought: the exam asks you to say what a zone’s worth of protection costs and who decided to pay it.'),
    rec(6, 'arch', 'Design summary', ['ADR-002: two zones, a Standard Load Balancer, a scale set of two; the single-VM alternative and why it lost.', 'The monthly cost of each, from the calculator.'], 'Week 9’s template must build exactly this design.'),
  ]),
  T(6, 'infra', 'Build the fleet: a web subnet and a scale set across two zones', 'Add a web subnet that admits port 80 only, run a scale set of two B1s across two zones with no public addresses, park it.', 55,
    ['AZ-104 · Deploy and manage Azure compute resources', 'Virtual Machine Scale Sets (Flexible)', 'Zonal placement', 'Custom data and cloud-init'], ['A web subnet with its own NSG exists', 'The scale set runs two instances in different zones with no public address', 'The scale set is parked at zero at the end'],
    [doc('Virtual Machine Scale Sets overview', 'azure/virtual-machine-scale-sets/overview', 'the “Flexible orchestration” paragraph: instances are ordinary VMs, spread across zones and fault domains, that you can scale to zero'),
     doc('Create a scale set across availability zones', 'azure/virtual-machine-scale-sets/virtual-machine-scale-sets-use-availability-zones', 'the “Zone balancing” section: list two zones and the set spreads instances evenly between them')],
    'The second B1s bills about $0.01 an hour while the fleet runs (the first is in the free account’s hours); park the set at zero when you stop. Stop or delete anything you started.', [
    both(s(6, 'infra', 1), 'Add the web subnet and its NSG', '10.10.2.0/24; port 80 from the internet, nothing else.', PORTAL, [
      'Network security groups → Create nsg-snet-web-team01. Inbound rule Allow-HTTP-Internet: source Internet, port 80, TCP, Allow, priority 110.',
      'vnet-capstone-team01 → Subnets → Add: snet-web, 10.10.2.0/24, NSG nsg-snet-web-team01. Save.',
    ], [
      { cmd: 'RG=rg-capstone-team01; az network nsg create -g $RG -n nsg-snet-web-team01 -o none; az network nsg rule create -g $RG --nsg-name nsg-snet-web-team01 -n Allow-HTTP-Internet --priority 110 --direction Inbound --access Allow --protocol Tcp --source-address-prefixes Internet --destination-port-ranges 80 -o none; az network vnet subnet create -g $RG --vnet-name vnet-capstone-team01 -n snet-web --address-prefixes 10.10.2.0/24 --nsg nsg-snet-web-team01 --query "[name, addressPrefix]" -o tsv', explain: 'A subnet of its own for the fleet, with an NSG that admits 80 from the internet and nothing else. The app subnet, and the tools VM in it, stay closed.', sample: 'snet-web\t10.10.2.0/24' },
    ], ['snet-web'], 'The fleet is the only thing the internet may reach, so it gets its own subnet and its own rule; a rule on the app subnet would have opened the tools VM too.'),
    both(s(6, 'infra', 2), 'Create the scale set', 'Two B1s across zones 1 and 2, no public IPs.', PORTAL, [
      'Virtual machine scale sets → Create: rg-capstone-team01, vmss-web-team01, zones 1 and 2, orchestration Flexible, Ubuntu 22.04, B1s.',
      'Networking: vnet-capstone-team01, snet-web, no public IP per instance, no load balancer yet. Scaling: initial 2, manual.',
      'Advanced → Custom data: paste the cloud-init below. Review + create.',
    ], [
      { cmd: 'RG=rg-capstone-team01; printf \'#cloud-config\\nruncmd:\\n  - mkdir -p /srv/www\\n  - Z=$(curl -s -H Metadata:true "http://169.254.169.254/metadata/instance/compute/zone?api-version=2021-02-01&format=text"); echo "web OK from zone $Z" > /srv/www/index.html\\n  - cd /srv/www && nohup python3 -m http.server 80 >/dev/null 2>&1 &\\n\' > fleet-init.yaml; az vmss create -g $RG -n vmss-web-team01 --orchestration-mode Flexible --image Ubuntu2204 --vm-sku Standard_B1s --instance-count 2 --zones 1 2 --vnet-name vnet-capstone-team01 --subnet snet-web --public-ip-address "" --load-balancer "" --admin-username azureuser --generate-ssh-keys --custom-data fleet-init.yaml --platform-fault-domain-count 1 --tags owner=team01 --query "[orchestrationMode, zones]" -o tsv', explain: 'A start-up script that serves the instance’s zone on port 80 with what the image already has, then the set: Flexible, two zones, two instances, no public addresses.', sample: 'Flexible\n1\t2' },
    ], ['Flexible'], 'A scale set is the VM written down: it can run a hundred identical copies, and the Week 9 template holds the same definition. Serving the zone name lets the balancer show which zone answered.'),
    both(s(6, 'infra', 3), 'Read the instances', 'Two instances, one in each zone, no public IP.', PORTAL, [
      'vmss-web-team01 → Instances: two rows, Availability zone 1 and 2, Status Running.',
      'Open one → Networking: Public IP address is empty.',
    ], [
      { cmd: 'az vmss list-instances -g $RG -n vmss-web-team01 --query "[].[name, zones[0], provisioningState]" -o tsv; az vmss list-instance-public-ips -g $RG -n vmss-web-team01 --query "length(@)" -o tsv', explain: 'Each instance with its zone, then the count of public addresses: zero.', sample: 'vmss-web-team01_a1b2c3d4\t1\tSucceeded\nvmss-web-team01_e5f6a7b8\t2\tSucceeded\n0' },
    ], ['Succeeded', '0'], 'The set keeps the count you ask for, in the zones you list. Delete one and autoscale restores it; Week 8 proves it.'),
    both(s(6, 'infra', 4), 'Park the fleet', 'Scale to zero until the next task.', PORTAL, [
      'vmss-web-team01 → Availability + scaling → Scaling → Instance count 0 → Save.',
      'Instances: both rows show Deleting, then disappear.',
    ], [
      { cmd: 'az vmss scale -g $RG -n vmss-web-team01 --new-capacity 0 -o none; sleep 30; az vmss show -g $RG -n vmss-web-team01 --query "sku.capacity" -o tsv', explain: 'Capacity zero: the set deletes its instances and costs nothing until it is asked for more.', sample: '0' },
    ], ['0'], 'A parked set is free; a forgotten one is the second instance’s hourly rate all week. Every task that scales it up ends by parking it.'),
    rec(6, 'infra', 'Address plan and fleet', ['The web subnet: name, CIDR, its NSG and the one rule.', 'The scale set: image, size, zones, orchestration mode, capacity now and maximum.'], 'Week 9’s template must match this plan exactly.'),
  ], { cost: { usd: 0.0104, per: 'hour', note: 'The second B1s while the fleet runs; parked at zero at the end of the task.' } }),
  T(6, 'dev', 'Put the fleet behind a Standard Load Balancer', 'Create a zone-redundant Standard Load Balancer with a health probe, join the fleet to its pool, and prove both zones answer.', 55,
    ['AZ-104 · Implement and manage virtual networking', 'Standard Load Balancer', 'Health probes and rules', 'NSG rules for a fleet'], ['The balancer answers on port 80 from a zone-redundant address', 'Both zones serve requests', 'Only the balancer’s port 80 reaches the fleet'],
    [doc('What is Azure Load Balancer?', 'azure/load-balancer/load-balancer-overview', 'the “Why use Azure Load Balancer?” list and the Standard SKU: zone-redundant front ends and a health probe that decides which instances receive traffic'),
     doc('Load Balancer health probes', 'azure/load-balancer/load-balancer-custom-probe-overview', 'the “Probe interval and threshold” paragraph: an instance that fails the probe stops receiving new flows within seconds')],
    'A Standard Load Balancer bills about $0.025 an hour plus a little per GB while it exists; it stays for Weeks 6–8 and is deleted in the Week 8 drill. Stop or delete anything you started.', [
    both(s(6, 'dev', 1), 'Create the balancer, the probe and the rule', 'Zone-redundant public address, HTTP probe on /, port 80.', PORTAL, [
      'Load balancers → Create: rg-capstone-team01, lb-web-team01, Standard, Public. Frontend: new IP pip-lb-web-team01, zone-redundant.',
      'Backend pool bepool (vnet-capstone-team01). Inbound rule http: port 80 → 80, probe http (HTTP, 80, /). Review + create.',
    ], [
      { cmd: 'RG=rg-capstone-team01; az network lb create -g $RG -n lb-web-team01 --sku Standard --public-ip-address pip-lb-web-team01 --public-ip-zone 1 2 3 --frontend-ip-name fe --backend-pool-name bepool --tags owner=team01 --query "loadBalancer.sku.name" -o tsv; az network lb probe create -g $RG --lb-name lb-web-team01 -n http --protocol Http --port 80 --path / --interval 5 --threshold 2 -o none; az network lb rule create -g $RG --lb-name lb-web-team01 -n http --protocol Tcp --frontend-port 80 --backend-port 80 --frontend-ip-name fe --backend-pool-name bepool --probe-name http --query provisioningState -o tsv', explain: 'A Standard balancer with an address in every zone, a probe that asks each instance for / every five seconds, and the rule that forwards 80.', sample: 'Standard\nSucceeded' },
    ], ['Standard', 'Succeeded'], 'The probe is the design’s nerve: an instance that stops answering / is taken out of rotation in ten seconds, before a visitor notices. Zone-redundant means the address survives a zone too.'),
    both(s(6, 'dev', 2), 'Join the fleet to the pool', 'The set’s NICs in bepool; capacity two.', PORTAL, [
      'vmss-web-team01 → Networking → Load balancing → Add: lb-web-team01, bepool. Then Scaling → Instance count 2 → Save.',
      'nsg-snet-web-team01 → Inbound security rules: Allow-HTTP-Internet (80) is there; probes use the AzureLoadBalancer default rule.',
    ], [
      { cmd: 'POOL=$(az network lb address-pool show -g $RG --lb-name lb-web-team01 -n bepool --query id -o tsv); az vmss update -g $RG -n vmss-web-team01 --set "virtualMachineProfile.networkProfile.networkInterfaceConfigurations[0].ipConfigurations[0].loadBalancerBackendAddressPools=[{\\"id\\":\\"$POOL\\"}]" -o none; az vmss scale -g $RG -n vmss-web-team01 --new-capacity 2 -o none; sleep 120; az network lb address-pool show -g $RG --lb-name lb-web-team01 -n bepool --query "length(backendIPConfigurations)" -o tsv', explain: 'The set’s network profile now names the pool, so every new instance joins it; scale to two and count the pool members.', sample: '2' },
    ], ['2'], 'The exam’s favourite pairing: the NSG says what may enter the subnet, the balancer says which instance answers. The instances themselves have no address to attack.'),
    both(s(6, 'dev', 3), 'Prove both zones answer', 'Curl the balancer ten times; both zones reply.', PORTAL, [
      'lb-web-team01 → Frontend IP configuration: copy the address. Open http://<address> and refresh; the zone in the page changes.',
      'Insights → the topology shows the probe healthy on both instances.',
    ], [
      { cmd: 'IP=$(az network public-ip show -g $RG -n pip-lb-web-team01 --query ipAddress -o tsv); for i in 1 2 3 4 5 6 7 8 9 10; do curl -s --max-time 5 http://$IP; done | sort | uniq -c', explain: 'Ten requests through the balancer: both zones answer, roughly half each.', sample: '      5 web OK from zone 1\n      5 web OK from zone 2' },
    ], ['zone 1', 'zone 2'], 'That output is the whole domain in one line: two zones, one address, and a visitor who cannot tell which answered.'),
    both(s(6, 'dev', 4), 'Park the fleet', 'Capacity zero; the balancer stays for next week.', PORTAL, [
      'vmss-web-team01 → Scaling → Instance count 0 → Save.',
    ], [
      { cmd: 'az vmss scale -g $RG -n vmss-web-team01 --new-capacity 0 -o none; az network lb show -g $RG -n lb-web-team01 --query provisioningState -o tsv', explain: 'Instances gone, the balancer kept: its hourly rate is the price of not rebuilding it twice.', sample: 'Succeeded' },
    ], ['Succeeded'], 'The balancer costs about sixty cents a day; the instances cost more and come back in a minute, so they are what gets parked.'),
    rec(6, 'dev', 'Request paths', ['Visitor → balancer → fleet (both zones): reachable.', 'Internet → an instance directly: no address, blocked.', 'The NSG rule and the probe settings.'], 'The network document shows the path and the fence around it.'),
  ], { prerequisites: ['The scale set from Infrastructure (this week).'], cost: { usd: 0.0354, per: 'hour', note: 'The Standard Load Balancer ($0.025) and the second B1s while attached; the fleet is parked at the end, the balancer stays until the Week 8 drill.' } }),
  T(6, 'secops', 'Close port 22, add Bastion, and reach the vault privately', 'Delete the SSH rule and prove 22 is denied, deploy Bastion Developer, reach Key Vault through a private endpoint, then remove it.', 55,
    ['AZ-104 · Implement and manage virtual networking', 'NSG rules and IP flow verify', 'Azure Bastion', 'Private endpoints and private DNS'], ['No inbound SSH rule and IP flow verify says Deny', 'Bastion Developer opens a browser session', 'The vault resolved to a private address from the VM, and the endpoint is gone'],
    [doc('IP flow verify', 'azure/network-watcher/ip-flow-verify-overview', 'what the result reports — Access and the name of the rule that decided it'),
     doc('Bastion Developer SKU', 'azure/bastion/quickstart-developer-sku', 'the “Deploy Bastion Developer” steps: no AzureBastionSubnet, no public IP, a browser session to the VM’s private address'),
     doc('Private endpoint DNS integration', 'azure/private-link/private-endpoint-dns-integration', 'the vault row of the zone table: privatelink.vaultcore.azure.net, and why the zone must be linked to the VNet for the name to resolve privately')],
    'Bastion Developer, IP flow verify and Run Command are free. The private endpoint bills about $0.01 an hour and is deleted inside the task. VM hours count while it runs — deallocate at the end.', [
    both(s(6, 'secops', 1), 'Close port 22 and open Bastion', 'Delete the SSH rule; deploy Bastion Developer; verify 22.', PORTAL, [
      'nsg-snet-app-team01 → Inbound security rules → Allow-SSH-MyIP → Delete.',
      'vnet-capstone-team01 → Bastion → Deploy Bastion Developer. vm-tools-team01 → Start → Connect → Bastion: the shell opens in the browser.',
      'Network Watcher → IP flow verify: vm-tools-team01, Inbound, TCP, local port 22, remote 203.0.113.25:50000 → Access denied, DenyAllInBound.',
    ], [
      { cmd: `${VARS}; az network nsg rule delete -g $RG --nsg-name nsg-snet-app-team01 -n Allow-SSH-MyIP; az network bastion create -g $RG -n bas-capstone-team01 --vnet-name vnet-capstone-team01 --sku Developer --query "sku.name" -o tsv; az vm start -g $RG -n $VM -o none`, explain: 'The rule gone, Bastion Developer deployed (no subnet, no public IP, no charge), the VM started for the next steps.', sample: 'Developer' },
      { cmd: 'az network watcher test-ip-flow -g $RG --vm $VM --direction Inbound --protocol TCP --local 10.10.1.4:22 --remote 203.0.113.25:50000 --query "[access, ruleName]" -o tsv', explain: 'Evaluates the NSG rules for that exact packet, without sending one.', sample: 'Deny\tsecurityRules/DenyAllInBound' },
    ], ['Developer', 'Deny'], 'The safest open port is none: admin goes through the Azure control plane, which is already authenticated and logged, and the platform itself names the rule that blocks 22.'),
    both(s(6, 'secops', 2), 'Create the private endpoint and its DNS zone', 'The vault gets an address in snet-app.', PORTAL, [
      'The vault → Networking → Private endpoint connections → Create: pe-kv-team01, vnet-capstone-team01, snet-app, target sub-resource vault.',
      'DNS: integrate with private DNS zone privatelink.vaultcore.azure.net. Create.',
    ], [
      { cmd: 'KVID=$(az keyvault list -g $RG --query "[0].id" -o tsv); az network private-endpoint create -g $RG -n pe-kv-team01 --vnet-name vnet-capstone-team01 --subnet snet-app --private-connection-resource-id $KVID --group-id vault --connection-name kv --query "customDnsConfigs[0].ipAddresses[0]" -o tsv', explain: 'A network card in your subnet that answers for the vault; the printed address is private.', sample: '10.10.1.5' },
      { cmd: 'az network private-dns zone create -g $RG -n privatelink.vaultcore.azure.net -o none; az network private-dns link vnet create -g $RG -z privatelink.vaultcore.azure.net -n link-vnet -v vnet-capstone-team01 -e false -o none; az network private-endpoint dns-zone-group create -g $RG --endpoint-name pe-kv-team01 -n default --private-dns-zone privatelink.vaultcore.azure.net --zone-name vault --query provisioningState -o tsv', explain: 'The zone, its link to the network, and the record the endpoint writes into it; inside the VNet the vault’s name now resolves to the private address.', sample: 'Succeeded' },
    ], ['10.10.1', 'Succeeded'], 'A private endpoint is the exam’s answer to “reach a PaaS service without the internet”; the DNS zone is the half people forget, and without it the name still resolves publicly.'),
    both(s(6, 'secops', 3), 'Prove it from the VM, then remove the endpoint', 'nslookup from the VM; delete the endpoint and the zone.', PORTAL, [
      'vm-tools-team01 → Operations → Run command → RunShellScript: nslookup <your vault>.vault.azure.net → Run. The address is 10.10.1.x.',
      'Private endpoints → pe-kv-team01 → Delete. Private DNS zones → privatelink.vaultcore.azure.net → Delete.',
    ], [
      { cmd: 'KV=$(az keyvault list -g $RG --query "[0].name" -o tsv); az vm run-command invoke -g $RG -n $VM --command-id RunShellScript --scripts "nslookup $KV.vault.azure.net | tail -2" --query "value[0].message" -o tsv', explain: 'From inside the network the public name answers with the private address: the path to the vault never leaves Azure.', sample: 'Enable succeeded: \n[stdout]\nName:\tkv-capstone-team01-18342.privatelink.vaultcore.azure.net\nAddress: 10.10.1.5' },
      { cmd: 'az network private-endpoint delete -g $RG -n pe-kv-team01; az network private-dns zone delete -g $RG -n privatelink.vaultcore.azure.net --yes; az network private-endpoint list -g $RG --query "length(@)" -o tsv', explain: 'The proof is recorded; the hourly endpoint and its zone are deleted. Zero endpoints remain.', sample: '0' },
    ], ['Address: 10.10.1', '0'], 'A cent an hour is nothing for an afternoon and seven dollars for a month left running. The record says what was kept (Bastion, free) and what was used and deleted.'),
    rec(6, 'secops', 'Rules and private path', ['Every inbound rule with its reason; the IP flow verify result.', 'How admins reach the VM: Bastion Developer, in the browser, no open port.', 'The private endpoint test: name, private address, deleted at the end.'], 'The network document now shows the private path and proves it.'),
    DEALLOCATE(6, 'secops'),
  ], { cost: { usd: 0.01, per: 'hour', note: 'The private endpoint while it exists; deleted at the end of the task.' } }),

  // ── Week 7 — Data and storage ──────────────────────────────────────────
  T(7, 'arch', 'Choose the data store and the storage tiers', 'Compare the serverless database with a relational one for the next workload, choose blob access tiers and redundancy, and record the decision with its cost.', 40,
    ['AZ-104 · Implement and manage storage', 'Cosmos DB vs PostgreSQL', 'Blob access tiers', 'Storage redundancy'], ['A data-store decision with its monthly cost', 'An access tier and a redundancy per object kind, with a lifecycle rule'],
    [doc('Blob access tiers', 'azure/storage/blobs/access-tiers-overview', 'the comparison table: Hot, Cool, Cold and Archive — minimum retention days and retrieval latency per tier, the two numbers that decide where logs and backups go'),
     doc('Azure Storage redundancy', 'azure/storage/common/storage-redundancy', 'the “Durability and availability parameters” table: LRS, ZRS, GRS — the copies each keeps and where')],
    'Free: the decision is on paper; the database it describes is costed on Infrastructure’s task.', [
    both(s(7, 'arch', 1), 'Read today’s data costs', 'What Cosmos DB and the storage accounts cost this month.', PORTAL, [
      'Cost Management → Cost analysis → scope rg-capstone-team01 → group by Service name: read Cosmos DB and Storage, month to date.',
      'Each storage account → Insights: capacity and transactions.',
    ], [
      { cmd: 'az consumption usage list --start-date $(date +%Y-%m-01) --end-date $(date +%F) --query "[?contains(instanceName, \'cosmos\') || contains(instanceName, \'stweb\')].[instanceName, pretaxCost]" -o tsv | sort | uniq', explain: 'Month-to-date cost for the database account and the site storage. On the free account, cents.', sample: 'cosmos-capstone-team01-a1b2c3\t0.0000\nstwebteam0118342\t0.0210' },
    ], ['cosmos'], 'A decision that starts from what the current design costs is one the finance side can follow.'),
    portal(s(7, 'arch', 2), 'Price the relational alternative', 'Cost a small zone-redundant PostgreSQL for a month.', 'Azure Pricing Calculator (azure.microsoft.com/pricing/calculator)', [
      'Add Azure Database for PostgreSQL flexible server: General Purpose, D2ds v4, zone-redundant HA, 32 GB. Read the monthly total.',
      'Write the workloads each store fits: the counter stays on Cosmos DB; orders, customers and reports go relational.',
      'Pick a tier per kind: site files Hot, LRS; logs to Cool after 30 days; backups Archive, ZRS.',
    ], 'A monthly figure for the database, the workload split, and a tier and redundancy per object kind.', 'The storage domain is a set of these trade-offs: the right store for the access pattern, the cheapest tier that still meets the retrieval time, the redundancy the data deserves.'),
    rec(7, 'arch', 'Sizing and data decisions', ['ADR-003: which workloads use Cosmos DB, which PostgreSQL, and the monthly cost of each.', 'The access tier, redundancy and lifecycle per object kind.'], 'Week 9’s template holds the database and the lifecycle rule this decides.'),
  ]),
  T(7, 'infra', 'Create a zone-redundant PostgreSQL server in its own subnet, then stop it', 'Add a delegated subnet with its NSG, run an encrypted zone-redundant PostgreSQL flexible server reachable only from the app subnet, read its facts, stop it.', 60,
    ['AZ-104 · Implement and manage virtual networking', 'Subnet delegation and private DNS', 'Zone-redundant high availability', 'Encryption at rest'], ['The server ran zone-redundant, encrypted, with no public access', 'Only the app subnet may reach port 5432', 'The server is stopped at the end'],
    [doc('High availability in PostgreSQL flexible server', 'azure/postgresql/flexible-server/concepts-high-availability', 'the “Zone-redundant” paragraph: a synchronous standby in another zone and a failover in about a minute — the RTO your plan can promise'),
     doc('Networking with private access (VNet integration)', 'azure/postgresql/flexible-server/concepts-networking-private', 'the “Virtual network concepts” list: a subnet delegated to Microsoft.DBforPostgreSQL/flexibleServers and a private DNS zone — why the subnet comes first')],
    'D2ds v4 zone-redundant bills about $0.30 an hour while it runs; created and stopped inside this task. Stopped, it bills storage only, and Azure restarts it after seven days, so Week 8 deletes it. Stop or delete anything you started.', [
    both(s(7, 'infra', 1), 'Add the delegated subnet and its NSG', '10.10.3.0/24, delegated; 5432 from inside the VNet only.', PORTAL, [
      'Network security groups → Create nsg-snet-db-team01. Inbound rule Allow-Postgres-From-VNet: sources 10.10.1.0/24 and 10.10.2.0/24, port 5432, TCP, Allow, 100.',
      'vnet-capstone-team01 → Subnets → Add: snet-db, 10.10.3.0/24, NSG nsg-snet-db-team01, Subnet delegation Microsoft.DBforPostgreSQL/flexibleServers. Save.',
    ], [
      { cmd: 'RG=rg-capstone-team01; az network nsg create -g $RG -n nsg-snet-db-team01 -o none; az network nsg rule create -g $RG --nsg-name nsg-snet-db-team01 -n Allow-Postgres-From-VNet --priority 100 --direction Inbound --access Allow --protocol Tcp --source-address-prefixes 10.10.1.0/24 10.10.2.0/24 --destination-port-ranges 5432 -o none; az network vnet subnet create -g $RG --vnet-name vnet-capstone-team01 -n snet-db --address-prefixes 10.10.3.0/24 --nsg nsg-snet-db-team01 --delegations Microsoft.DBforPostgreSQL/flexibleServers --query "[addressPrefix, delegations[0].serviceName]" -o tsv', explain: 'An NSG that admits 5432 from the app and web subnets only, then a subnet handed to the PostgreSQL service: the server’s network cards live here.', sample: '10.10.3.0/24\tMicrosoft.DBforPostgreSQL/flexibleServers' },
    ], ['10.10.3.0/24', 'flexibleServers'], 'A database with a rule from the internet is one click from exposed; a delegated subnet with a rule from the app subnet follows the fleet wherever it moves.'),
    both(s(7, 'infra', 2), 'Create the server, zone-redundant and private', 'D2ds v4, HA across zones, in snet-db.', PORTAL, [
      'Azure Database for PostgreSQL flexible servers → Create: rg-capstone-team01, pg-capstone-team01 plus digits, PostgreSQL 16, Production, General Purpose D2ds_v4, 32 GiB.',
      'High availability: Zone redundant, zone 1, standby 2. Networking: Private access, vnet-capstone-team01, snet-db, new private DNS zone. Review + create.',
      'Wait for Deployment succeeded (about ten minutes).',
    ], [
      { cmd: 'PG=pg-capstone-team01-$RANDOM; PW="Pg-$(openssl rand -hex 8)"; echo "$PG"; az network private-dns zone create -g $RG -n $PG.private.postgres.database.azure.com -o none; az postgres flexible-server create -g $RG -n $PG -l eastus --tier GeneralPurpose --sku-name Standard_D2ds_v4 --storage-size 32 --version 16 --high-availability ZoneRedundant --zone 1 --standby-zone 2 --vnet vnet-capstone-team01 --subnet snet-db --private-dns-zone $PG.private.postgres.database.azure.com --admin-user capstone --admin-password "$PW" --tags owner=team01 --yes --query "[host, state]" -o tsv', explain: 'The DNS zone the server needs, then the server: a standby in another zone, inside the delegated subnet, no public address. The password stays in the shell and goes to Key Vault, never a file.', sample: 'pg-capstone-team01-18342\npg-capstone-team01-18342.postgres.database.azure.com\tReady' },
    ], ['Ready'], 'Zone-redundant is not a backup: it is a standby that takes over in a minute. The automatic backups kept with the server are the backup; Week 8 restores from them.'),
    both(s(7, 'infra', 3), 'Read the five facts', 'HA mode and state, public access, zones, encryption.', PORTAL, [
      'The server → Overview: High availability Zone redundant (Healthy), Availability zone 1, Standby zone 2.',
      'Networking: Public access Disabled, delegated subnet snet-db. Data encryption: Service-managed key.',
    ], [
      { cmd: 'az postgres flexible-server show -g $RG -n $PG --query "[highAvailability.mode, highAvailability.state, network.publicNetworkAccess, availabilityZone, highAvailability.standbyAvailabilityZone, dataEncryption.type]" -o tsv', explain: 'The facts the exam asks about a database: a standby in another zone and healthy, no public address, encrypted at rest.', sample: 'ZoneRedundant\tHealthy\tDisabled\t1\t2\tSystemManaged' },
    ], ['ZoneRedundant', 'Disabled', 'SystemManaged'], 'Five facts, one line: the record copies this output, and the plan names its RPO and RTO from it.'),
    both(s(7, 'infra', 4), 'Stop the server', 'Compute off; storage and backups kept.', PORTAL, [
      'The server → Overview → Stop → Yes. State reads Stopped.',
    ], [
      { cmd: 'az postgres flexible-server stop -g $RG -n $PG -o none; az postgres flexible-server show -g $RG -n $PG --query state -o tsv', explain: 'A stopped server bills storage only; compute, the expensive line, stops. Azure restarts it after seven days, so Week 8 must delete it.', sample: 'Stopped' },
    ], ['Stopped'], 'An hour of zone-redundant PostgreSQL is thirty cents; a week of it forgotten is the course budget. Stopped, it keeps its data and its backups for cents a day.'),
    rec(7, 'infra', 'Database', ['Engine, size, HA mode, encrypted, public access, the zones, the subnet and the NSG rule.', 'Backups kept: automatic, 7 days; the server is stopped.'], 'Week 8 restores this database and the plan names its RPO and RTO.'),
  ], { cost: { usd: 0.3, per: 'hour', note: 'General Purpose D2ds_v4 zone-redundant (two nodes) plus 32 GB while it runs; stopped inside the task, storage kept for cents a day.' } }),
  T(7, 'dev', 'Queue the visits and write a ledger', 'Put a storage queue between the API and a ledger function that records each visit in Cosmos DB, and prove a poison message moves aside.', 55,
    ['AZ-104 · Implement and manage storage', 'Storage queues', 'Queue-triggered functions', 'Poison messages'], ['A visits queue exists on the runtime storage account', 'A visit sent to the queue becomes an item in Cosmos DB', 'A poison message ends in the visits-poison queue'],
    [doc('Queue storage trigger for Functions', 'azure/azure-functions/functions-bindings-storage-queue-trigger?tabs=javascript-v4', 'the “Poison messages” section: after five failed attempts a message moves to <queue>-poison instead of looping forever'),
     doc('Cosmos DB output binding (Node.js v4)', 'azure/azure-functions/functions-bindings-cosmosdb-v2-output?tabs=javascript-v4', 'the JavaScript v4 example: output.cosmosDB with databaseName, containerName and connection, returned from the handler')],
    'Free: a storage queue holds this many messages for nothing, and the Consumption plan’s million executions cover the ledger many times over.', [
    both(s(7, 'dev', 1), 'Create the queue', 'A visits queue on the Function’s runtime storage.', PORTAL, [
      'Storage accounts → the stfn… account → Queues → Add queue: visits. OK.',
    ], [
      { cmd: 'RG=rg-capstone-team01; FN=func-capstone-team01-XXXX; STFN=$(az storage account list -g $RG --query "[?starts_with(name, \'stfn\')].name | [0]" -o tsv); az storage queue create --account-name $STFN -n visits --auth-mode login --query created -o tsv', explain: 'The queue, on the account the Function already has a connection to (AzureWebJobsStorage). Poison messages will get visits-poison beside it, created by the runtime.', sample: 'True' },
    ], ['True'], 'A queue lets the API answer in milliseconds and the write happen when it can; the poison queue is where a bad message goes instead of blocking the good ones.'),
    both(s(7, 'dev', 2), 'Create the ledger function', 'One Cosmos item per message; an error on a bad one.', PORTAL, [
      'The Function App → Overview → Create function → Azure Queue Storage trigger, name ledger, queue visits, connection AzureWebJobsStorage. Create.',
      'Code + Test: replace the file with the code below. Save.',
    ], [
      { cmd: `const { app, output } = require('@azure/functions');
const ledger = output.cosmosDB({ databaseName: 'capstone', containerName: 'visitors', connection: 'CosmosConnection' });
app.storageQueue('ledger', {
  queueName: 'visits', connection: 'AzureWebJobsStorage', return: ledger,
  handler: (message, context) => {
    if (!message.page) throw new Error('no page');
    return { id: 'visit#' + context.triggerMetadata.id, page: message.page, at: Date.now() };
  },
});`, explain: 'Paste this over the whole file. The trigger hands over one message; the handler returns one item, written by the output binding with the Function’s identity. A message with no page throws: the poison case.', sample: '(the function appears under Functions as ledger)' },
    ], ['ledger'], 'Two functions, each with one job, is the shape the exam calls “decoupled”: the counter never waits for the ledger, and the ledger’s identity already holds the data role from Week 5.', {
      codeToPaste: true,
      fixes: [{ symptom: 'The function does not appear after Save', fix: 'Code + Test → Save again and refresh the Functions list; the v4 model registers the function from the file, so a syntax error hides it. Check Logs.' }],
    }),
    both(s(7, 'dev', 3), 'Send a visit and find the item', 'One message becomes one item in Cosmos DB.', PORTAL, [
      'The stfn… account → Queues → visits → Add message: {"page":"/"}. OK. The message disappears within a few seconds.',
      'Cosmos DB → Data Explorer → capstone → visitors → Items: an item visit#… appears.',
    ], [
      { cmd: 'az storage message put --account-name $STFN -q visits --content \'{"page":"/"}\' --auth-mode login --query id -o tsv; sleep 30; az monitor app-insights query --app appi-capstone-team01 -g $RG --analytics-query "requests | where name == \'ledger\' | summarize runs=count(), failed=countif(success == false)" --query "tables[0].rows[0]" -o tsv', explain: 'A message, then the ledger’s own telemetry a few seconds later: one run, none failed. The item is in Data Explorer.', sample: 'a1b2c3d4-…\n1\t0' },
    ], ['1'], 'The write happened without the API knowing; that gap is what lets the front door stay fast when the back room is slow.'),
    both(s(7, 'dev', 4), 'Poison the queue and read the poison queue', 'A message with no page fails five times, then moves.', PORTAL, [
      'Queues → visits → Add message: {} → OK. After two minutes a queue visits-poison appears with one message.',
      'The Function App → ledger → Monitor: five failed invocations, each “no page”.',
    ], [
      { cmd: 'az storage message put --account-name $STFN -q visits --content \'{}\' --auth-mode login -o none; sleep 120; az storage message peek --account-name $STFN -q visits-poison --auth-mode login --query "[0].content" -o tsv', explain: 'A message the function rejects; after five tries the runtime moves it to visits-poison, where you can read it.', sample: '{}' },
    ], ['{}'], 'Without the poison queue that message would be retried forever and every good message behind it would wait. The exam asks for exactly this behaviour and its default count.'),
    rec(7, 'dev', 'Queue and ledger', ['The queue, its poison queue and the attempts before a message moves.', 'The ledger function, its trigger and its output binding.', 'The poison test and where the message ended.'], 'The design document shows the decoupled path and its failure mode.'),
  ], { prerequisites: ['The Function’s managed identity and data role from Week 5.'] }),
  T(7, 'secops', 'Lock the data down and age it out', 'Prove the database is private and encrypted, harden every storage account, say who may restore the backups, and age old blobs to a colder tier.', 40,
    ['AZ-104 · Implement and manage storage', 'Storage account security settings', 'Backup restore permissions', 'Lifecycle management'], ['Every storage account is HTTPS-only, TLS 1.2, no anonymous blobs', 'The backups can be restored only by Contributors on the group', 'A lifecycle rule ages the site account'],
    [doc('Security recommendations for Blob storage', 'azure/storage/blobs/security-recommendations', 'the “Data protection” and “Networking” tables: secure transfer, TLS version, anonymous access — the switches the next step reads back'),
     doc('Lifecycle management policies', 'azure/storage/blobs/lifecycle-management-overview', 'the “Rule actions” table: tierToCool, tierToArchive, delete, and the minimum days before an object may move')],
    'Free: the settings, the role check and the lifecycle rule cost nothing; colder tiers cost less, not more.', [
    both(s(7, 'secops', 1), 'Harden every storage account', 'HTTPS only, TLS 1.2, no anonymous blob access.', PORTAL, [
      'Each storage account → Configuration: Secure transfer required Enabled, Minimum TLS version 1.2, Allow Blob anonymous access Disabled. Save.',
    ], [
      { cmd: 'RG=rg-capstone-team01; for A in $(az storage account list -g $RG --query "[].name" -o tsv); do az storage account update -g $RG -n $A --https-only true --min-tls-version TLS1_2 --allow-blob-public-access false -o none; done; az storage account list -g $RG --query "[].[name, enableHttpsTrafficOnly, minimumTlsVersion, allowBlobPublicAccess]" -o tsv', explain: 'The three switches on every account, then read back: true, TLS1_2, false. The static website still serves; it does not use anonymous container access.', sample: 'stfnteam0118342\tTrue\tTLS1_2\tFalse\nstwebteam0118342\tTrue\tTLS1_2\tFalse' },
    ], ['TLS1_2', 'False'], 'The site stays reachable because the static-website endpoint is its own front door: the fence blocks only the mistake, a container accidentally made public.'),
    both(s(7, 'secops', 2), 'Check the database and who may restore it', 'Private, encrypted, backups kept; restore needs Contributor.', PORTAL, [
      'The pg… server → Backup and restore: automatic backups, retention 7 days. Networking: Public access Disabled.',
      'Access control (IAM) → Role assignments: who holds Contributor or Owner here — only they can restore.',
    ], [
      { cmd: 'PG=$(az postgres flexible-server list -g $RG --query "[0].name" -o tsv); az postgres flexible-server show -g $RG -n $PG --query "[backup.backupRetentionDays, network.publicNetworkAccess, dataEncryption.type]" -o tsv; az role assignment list -g $RG --query "[?roleDefinitionName==\'Contributor\' || roleDefinitionName==\'Owner\'].principalName" -o tsv', explain: 'Seven days of backups, no public access, encrypted; then the principals who could run a restore. Readers cannot.', sample: '7\tDisabled\tSystemManaged\nteam01-infra@contoso.com' },
    ], ['Disabled', 'SystemManaged'], 'A backup is the database’s data without its fence; the role that may restore it is the fence, and the exam asks who holds it.'),
    both(s(7, 'secops', 3), 'Age the old blobs', 'Cool after 30 days; old versions deleted after 90.', PORTAL, [
      'The stweb… account → Data management → Lifecycle management → Add rule: age-out, all block blobs.',
      'Move to cool 30 days after modification; delete previous versions after 90 days. Add.',
    ], [
      { cmd: 'WEB=$(az storage account list -g $RG --query "[?starts_with(name, \'stweb\')].name | [0]" -o tsv); az storage account management-policy create -g $RG --account-name $WEB --policy \'{"rules":[{"enabled":true,"name":"age-out","type":"Lifecycle","definition":{"filters":{"blobTypes":["blockBlob"]},"actions":{"baseBlob":{"tierToCool":{"daysAfterModificationGreaterThan":30}},"version":{"delete":{"daysAfterCreationGreaterThan":90}}}}}]}\' --query "policy.rules[0].[name, enabled, definition.actions.baseBlob.tierToCool.daysAfterModificationGreaterThan]" -o tsv', explain: 'One rule: after thirty days a blob moves to a tier that costs half as much and still answers in milliseconds; versions older than ninety days are deleted.', sample: 'age-out\tTrue\t30' },
    ], ['age-out', '30'], 'Cost optimisation in the storage domain is mostly this rule: say how soon an object will be read, and let the account move it to the tier that matches.'),
    rec(7, 'secops', 'Data controls', ['Every storage account: HTTPS-only, TLS 1.2, anonymous access off.', 'The database: private, encrypted, backups kept, who may restore.', 'The lifecycle rule and the tier it moves to.'], 'The runbook’s data section says what protects the data at rest and who may copy it.'),
  ]),

  // ── Week 8 — Scale, monitor, recover ───────────────────────────────────
  T(8, 'arch', 'Set RPO and RTO per asset and the autoscale target', 'Decide per asset how much data can be lost and how fast it must return, set the autoscale target, and cost the final design.', 35,
    ['AZ-104 · Monitor and maintain Azure resources', 'RPO and RTO', 'Autoscale metrics', 'Right-sizing'], ['RPO and RTO for every asset', 'An autoscale target with its reason', 'The final design is costed'],
    [doc('Reliability: recovery targets', 'azure/well-architected/reliability/metrics', 'the definitions of RPO and RTO and the worked example — the two numbers every asset row needs'),
     doc('Autoscale overview', 'azure/azure-monitor/autoscale/autoscale-overview', 'the “Autoscale settings” section: a metric that rises with load and falls when instances are added — CPU is the textbook one, and the cool-down between actions')],
    'Free: targets, metrics and the calculator cost nothing.', [
    both(s(8, 'arch', 1), 'Read the fleet’s usage', 'CPU over the week for the fleet and the VM.', PORTAL, [
      'vmss-web-team01 → Monitoring → Metrics: Percentage CPU, Avg and Max, last 7 days.',
      'vm-tools-team01 → Monitoring → Metrics: Percentage CPU, last 7 days.',
    ], [
      { cmd: 'RG=rg-capstone-team01; VMSS=$(az vmss show -g $RG -n vmss-web-team01 --query id -o tsv); az monitor metrics list --resource $VMSS --metric "Percentage CPU" --interval PT1H --aggregation Average Maximum --offset 7d --query "value[0].timeseries[0].data[?average != null].[average, maximum]" -o tsv | tail -3', explain: 'Hourly average and peak CPU for the fleet while it ran. Low numbers argue for a small size and a high target.', sample: '3.1\t12.4\n2.8\t9.7\n4.0\t15.2' },
    ], ['12.4'], 'A scaling target is a number you defend: 50 % CPU on a B1s leaves headroom for a burst before the next instance is ready.'),
    portal(s(8, 'arch', 2), 'Cost the final design', 'The fleet, balancer, database and queue for a month.', 'Azure Pricing Calculator (azure.microsoft.com/pricing/calculator)', [
      'Add Load Balancer Standard, two B1s, PostgreSQL D2ds v4 zone-redundant 32 GB, Cosmos DB serverless, Storage. Read the total.',
      'Write it next to Week 6’s single-VM figure; the difference buys a zone, a standby and a queue.',
    ], 'A monthly total for the final design with the difference explained.', 'The exam’s cost questions are not “cheapest”: they ask for the cheapest design that still meets the RPO, the RTO and the availability the company wrote down.'),
    rec(8, 'arch', 'Business impact and scaling', ['Asset, criticality, RPO, RTO, protected by.', 'The autoscale target and why.', 'The monthly cost of the final design.'], 'Week 12’s recovery scenario is judged against these targets.'),
  ]),
  T(8, 'infra', 'Autoscale the fleet on CPU and prove a lost instance is replaced', 'Add an autoscale setting, load one instance until the set adds a third, delete one and watch the minimum restore it, then park the fleet.', 55,
    ['AZ-104 · Deploy and manage Azure compute resources', 'Autoscale rules', 'Scale-out and scale-in', 'Instance replacement'], ['A rule scales out on CPU', 'A deleted instance is replaced without a human', 'The fleet is parked at the end'],
    [doc('Autoscale a scale set with the CLI', 'azure/virtual-machine-scale-sets/tutorial-autoscale-cli', 'the az monitor autoscale create and rule create commands: a profile with min, max and default, then a rule per direction'),
     doc('Autoscale best practices', 'azure/azure-monitor/autoscale/autoscale-best-practices', 'the “Ensure the maximum and minimum values are different” and “Choose the thresholds carefully” sections: a gap between the out and in thresholds, or the set flaps')],
    'The fleet runs two to three B1s for under an hour (about $0.01 to $0.02 an hour beyond the free one); park it at zero at the end. Stop or delete anything you started.', [
    both(s(8, 'infra', 1), 'Wake the fleet and add the autoscale setting', 'Min 2, max 3; out above 50 %, in below 25 %.', PORTAL, [
      'vmss-web-team01 → Availability + scaling → Scaling → Custom autoscale: minimum 2, maximum 3, default 2.',
      'Rules: Percentage CPU average > 50 for 5 minutes → +1; < 25 for 5 minutes → −1. Save.',
    ], [
      { cmd: 'RG=rg-capstone-team01; VMSS=$(az vmss show -g $RG -n vmss-web-team01 --query id -o tsv); az monitor autoscale create -g $RG --resource $VMSS -n autoscale-web-team01 --min-count 2 --max-count 3 --count 2 --query "profiles[0].capacity" -o tsv; az monitor autoscale rule create -g $RG --autoscale-name autoscale-web-team01 --condition "Percentage CPU > 50 avg 5m" --scale out 1 -o none; az monitor autoscale rule create -g $RG --autoscale-name autoscale-web-team01 --condition "Percentage CPU < 25 avg 5m" --scale in 1 --query "scaleAction.direction" -o tsv', explain: 'The setting brings the set to two and holds it between two and three; one rule adds an instance above the target, one removes it below.', sample: '{\n  "default": "2",\n  "maximum": "3",\n  "minimum": "2"\n}\nDecrease' },
    ], ['"minimum": "2"', 'Decrease'], 'Autoscale is the exam’s default answer for “scale on demand”: you give the thresholds and the limits, and the service does the clicking.'),
    both(s(8, 'infra', 2), 'Load an instance until the set adds one', 'Burn CPU on one instance; watch capacity reach three.', PORTAL, [
      'vmss-web-team01 → Instances → open one → Operations → Run command → RunShellScript.',
      'Script: for i in 1 2; do yes > /dev/null & done; sleep 420; pkill yes → Run.',
      'Availability + scaling → Scaling → Run history: after five to eight minutes a scale-out action; Instances: three rows.',
    ], [
      { cmd: 'ONE=$(az vmss list-instances -g $RG -n vmss-web-team01 --query "[0].name" -o tsv); az vm run-command invoke -g $RG -n $ONE --command-id RunShellScript --scripts "for i in 1 2; do yes > /dev/null & done; sleep 420; pkill yes" --no-wait; sleep 480; az vmss show -g $RG -n vmss-web-team01 --query "sku.capacity" -o tsv', explain: 'Two CPU burners for seven minutes on one instance; the average crosses 50 % and the rule raises capacity to three.', sample: '3' },
    ], ['3'], 'The third instance is the rule acting on the metric; nobody clicked. When the load ends the scale-in rule removes it again, a few minutes later.'),
    both(s(8, 'infra', 3), 'Delete one and watch it come back', 'Delete an instance; the minimum restores it.', PORTAL, [
      'vmss-web-team01 → Instances → tick one → Delete. Instances: the count drops, then a new row appears within five minutes.',
    ], [
      { cmd: 'az vm delete -g $RG -n $ONE --yes -o none; sleep 300; az vmss list-instances -g $RG -n vmss-web-team01 --query "[].[name, zones[0], provisioningState]" -o tsv', explain: 'The deletion, then the set’s instances five minutes later: a new name has taken the lost one’s place, and the count is back at the minimum.', sample: 'vmss-web-team01_e5f6a7b8\t2\tSucceeded\nvmss-web-team01_c9d0e1f2\t1\tSucceeded' },
    ], ['Succeeded'], 'This is self-healing on the exam: autoscale holds the minimum, the balancer stops sending to the dead one within seconds, and the visitor never knew.'),
    both(s(8, 'infra', 4), 'Park the fleet', 'Autoscale off, capacity zero.', PORTAL, [
      'vmss-web-team01 → Scaling → Manual scale → Instance count 0 → Save.',
    ], [
      { cmd: 'az monitor autoscale update -g $RG -n autoscale-web-team01 --enabled false -o none; az vmss scale -g $RG -n vmss-web-team01 --new-capacity 0 -o none; sleep 30; az vmss show -g $RG -n vmss-web-team01 --query "sku.capacity" -o tsv', explain: 'Autoscale disabled so it does not fight the next command; capacity zero. The setting stays for Week 9’s template to copy.', sample: '0' },
    ], ['0'], 'Parked is free. The drill on Security & Ops’ task wakes it one more time and then deletes it all.'),
    rec(8, 'infra', 'Scaling and replacement', ['The autoscale setting: metric, thresholds, limits.', 'The scale-out time and the replacement time, from the run history.'], 'The plan names the time a lost instance takes to come back.'),
  ], { cost: { usd: 0.021, per: 'hour', note: 'Up to two billed B1s beyond the free one while the fleet runs; parked at the end.' } }),
  T(8, 'dev', 'Recover a deleted web file and restore the database to a point in time', 'Turn on soft delete and versioning, delete index.html and get it back, restore the database to ten minutes ago, then delete both servers.', 55,
    ['AZ-104 · Monitor and maintain Azure resources', 'Blob soft delete and versioning', 'Point-in-time restore', 'Recovery proof'], ['The deleted file is back', 'A server restored to a point in time reached Ready', 'Both servers are deleted'],
    [doc('Restore a soft-deleted blob', 'azure/storage/blobs/soft-delete-blob-manage', 'the “Show deleted blobs” toggle in the container view, then Undelete'),
     doc('Point-in-time restore for PostgreSQL flexible server', 'azure/postgresql/flexible-server/how-to-restore-server-portal', 'the “Restoring to the latest restore point” steps and the note that a restore creates a new server with a new name — and that a private-access server restores into a subnet you choose')],
    'The restored D2ds v4 bills about $0.14 an hour and the original about $0.30 while they run; both are deleted at the end of the task. Soft delete and versions sit inside the free 5 GB. Stop or delete anything you started.', [
    both(s(8, 'dev', 1), 'Turn on protection', 'Soft delete and versioning for the site.', PORTAL, [
      'The stweb… account → Data management → Data protection: Enable soft delete for blobs (7 days), Enable versioning for blobs. Save.',
    ], [
      { cmd: 'RG=rg-capstone-team01; WEB=$(az storage account list -g $RG --query "[?starts_with(name, \'stweb\')].name | [0]" -o tsv); az storage account blob-service-properties update -g $RG -n $WEB --enable-delete-retention true --delete-retention-days 7 --enable-versioning true --query "[deleteRetentionPolicy.enabled, isVersioningEnabled]" -o tsv', explain: 'Deleted files are kept for seven days; every overwrite keeps the previous version.', sample: 'True\tTrue' },
    ], ['True'], 'Protection has to be on before the accident. Versioning is the cheapest backup there is, and the one the exam expects for a static site.'),
    both(s(8, 'dev', 2), 'Delete the page and bring it back', 'Delete index.html; undelete it; the site answers.', PORTAL, [
      'Storage browser → $web → index.html → Delete. The site returns 404.',
      'Toggle “Show deleted blobs” → index.html → Undelete. Reload the site.',
    ], [
      { cmd: 'az storage blob delete --account-name $WEB -c \'$web\' -n index.html --auth-mode login; curl -s -o /dev/null -w "%{http_code}\\n" https://$WEB.z13.web.core.windows.net/', explain: 'The delete, then the site: 404. The page is gone from the visitor’s view.', sample: '404' },
      { cmd: 'az storage blob undelete --account-name $WEB -c \'$web\' -n index.html --auth-mode login -o none; curl -s -o /dev/null -w "%{http_code}\\n" https://$WEB.z13.web.core.windows.net/', explain: 'Undelete brings the soft-deleted blob back; nothing was uploaded. Your endpoint’s zone may differ from z13.', sample: '200' },
    ], ['404', '200'], 'The restore took one call and uploaded nothing: the object was always there, in the bin.'),
    both(s(8, 'dev', 3), 'Start the database and restore it to a point in time', 'A new server from ten minutes ago; wait; check.', PORTAL, [
      'The pg… server → Start. Backup and restore → Restore: ten minutes ago, name pg-capstone-team01-restore, subnet snet-db. Review + create.',
      'Wait for Ready (about ten minutes): Overview shows a new server name and no high availability.',
    ], [
      { cmd: 'PG=$(az postgres flexible-server list -g $RG --query "[?!contains(name, \'restore\')].name | [0]" -o tsv); az postgres flexible-server start -g $RG -n $PG -o none; az postgres flexible-server restore -g $RG -n $PG-restore --source-server $PG --restore-time "$(date -u -d \'-10 minutes\' +%Y-%m-%dT%H:%M:%SZ)" --subnet $(az network vnet subnet show -g $RG --vnet-name vnet-capstone-team01 -n snet-db --query id -o tsv) --private-dns-zone $PG.private.postgres.database.azure.com --yes --query "[state, fullyQualifiedDomainName, highAvailability.mode]" -o tsv', explain: 'The source started, then a new server built from the backups as they were ten minutes ago, in the same subnet, with a new name: the application would be pointed at it.', sample: 'Ready\tpg-capstone-team01-18342-restore.postgres.database.azure.com\tDisabled' },
    ], ['Ready', 'restore'], 'A restore is a new database, not the old one repaired: the name changes, and the runbook has to say where the application reads the new one from.'),
    both(s(8, 'dev', 4), 'Delete both servers', 'The original and the restore: gone.', PORTAL, [
      'pg-capstone-team01-restore → Delete → confirm. The pg… server → Delete → confirm.',
    ], [
      { cmd: 'az postgres flexible-server delete -g $RG -n $PG-restore --yes; az postgres flexible-server delete -g $RG -n $PG --yes; az postgres flexible-server list -g $RG --query "length(@)" -o tsv', explain: 'The proof is recorded; the two hourly servers are not needed any more. Zero remain.', sample: '0' },
    ], ['0'], 'The restore was the drill. Week 9 rebuilds the database from the template when a team wants it; keeping it by hand would be paying twice for the same design.'),
    rec(8, 'dev', 'Website and database restore', ['What you deleted and restored, and how.', 'The point in time restored, the time it took, the new server name.'], 'The plan proves both restores were done, not planned.'),
  ], { cost: { usd: 0.44, per: 'hour', note: 'The original zone-redundant server ($0.30) and the restored single server ($0.14) while they run; both deleted at the end of the task.' } }),
  T(8, 'secops', 'Run a timed recovery drill and tear the fleet down', 'Take the fleet from zero to serving as if a zone failed, time it against the RTO, delete everything hourly, read the bill.', 55,
    ['AZ-104 · Monitor and maintain Azure resources', 'Recovery drills', 'RTO measurement', 'Tear-down and cost review'], ['The drill is timed against the RTO', 'The balancer, its address, the scale set and the autoscale setting are deleted', 'This month’s cost is read'],
    [doc('Load Balancer health probes', 'azure/load-balancer/load-balancer-custom-probe-overview', 'the probe interval and threshold: how long a fresh instance takes to receive traffic — the floor of your RTO'),
     doc('Cost analysis', 'azure/cost-management-billing/costs/quick-acm-cost-analysis', 'the “Group by” and “Granularity” controls: service name, month to date — what this week’s fleet, balancer and database cost')],
    'The fleet runs for the minutes of the drill; the balancer is deleted at the end of this task, so Week 8 closes with nothing billing by the hour. Stop or delete anything you started.', [
    both(s(8, 'secops', 1), 'Start the clock and wake the fleet', 'Note the time; capacity 2; wait until the balancer answers.', PORTAL, [
      'Write the time. vmss-web-team01 → Scaling → Instance count 2 → Save.',
      'Open the balancer’s address and refresh until the page answers. Write the time again.',
    ], [
      { cmd: 'RG=rg-capstone-team01; START=$(date +%s); az vmss scale -g $RG -n vmss-web-team01 --new-capacity 2 -o none; IP=$(az network public-ip show -g $RG -n pip-lb-web-team01 --query ipAddress -o tsv); until curl -sf --max-time 3 http://$IP >/dev/null; do sleep 10; done; echo "RTO $(( $(date +%s) - START )) s"', explain: 'From zero instances to a page served through the balancer, timed by the shell: that number is the measured RTO.', sample: 'RTO 162 s' },
    ], ['RTO'], 'An RTO in the plan is a promise; this is the measurement. Three minutes from nothing to serving is what a two-zone scale set with a start-up script buys.'),
    both(s(8, 'secops', 2), 'Serve through it, then tear it all down', 'Curl once; delete autoscale, scale set, balancer, address.', PORTAL, [
      'Open the balancer’s address once: the page answers.',
      'Autoscale settings → autoscale-web-team01 → Delete. vmss-web-team01 → Delete. lb-web-team01 → Delete. pip-lb-web-team01 → Delete.',
    ], [
      { cmd: 'curl -s http://$IP; az monitor autoscale delete -g $RG -n autoscale-web-team01; az vmss delete -g $RG -n vmss-web-team01; az network lb delete -g $RG -n lb-web-team01; az network public-ip delete -g $RG -n pip-lb-web-team01; az vmss list -g $RG --query "length(@)" -o tsv', explain: 'One request through the balancer, then everything that bills by the hour is deleted; the subnet and its rule stay for the template to match. Zero scale sets remain.', sample: 'web OK from zone 2\n0' },
    ], ['web OK', '0'], 'Week 9 rebuilds all of this from the template in one command; keeping it by hand would be paying twice for the same design.'),
    both(s(8, 'secops', 3), 'Read the month’s cost', 'What the fleet, the balancer and the database cost.', PORTAL, [
      'Cost Management → Cost analysis → scope rg-capstone-team01 → month to date → group by Service name.',
      'Read Virtual Machines, Load Balancer, Azure Database for PostgreSQL; compare with the $20 budget.',
    ], [
      { cmd: 'az consumption usage list --start-date $(date +%Y-%m-01) --end-date $(date +%F) --query "[?contains(instanceName, \'web\') || contains(instanceName, \'pg-\')].[instanceName, pretaxCost]" -o tsv | sort | uniq', explain: 'Month-to-date by resource for the things this quarter paid for: the fleet, the balancer, the database.', sample: 'lb-web-team01\t3.4200\npg-capstone-team01-18342\t0.6100\nvmss-web-team01_a1b2c3d4\t0.3800' },
    ], ['lb-web-team01'], 'A design is not finished until its bill has been read against the budget it was given.'),
    rec(8, 'secops', 'Drill and cost', ['Drill start, service back, RTO met, lessons.', 'What was deleted; the month’s cost by service against the $20 budget.'], 'The plan shows the drill, and the course ends with nothing billing by the hour.'),
  ], { cost: { usd: 0.0354, per: 'hour', note: 'The fleet and the balancer for the minutes of the drill; all of it deleted inside the task.' } }),

  // ── Week 9 — Infrastructure as code, tested ────────────────────────────
  T(9, 'arch', 'Map the template and set the environment strategy', 'Match five template resources to their diagram nodes, write ADR-001, and decide what differs between the dev and prod deployments.', 40,
    ['AZ-400 · Design and implement processes and communications', 'ARM templates', 'Architecture decision records', 'Environment strategy'], ['Five resources mapped', 'ADR-001 written', 'The dev and prod differences are listed'],
    [doc('ARM template structure and syntax', 'azure/azure-resource-manager/templates/syntax', 'the sections table: parameters, variables, resources, outputs — and what dependsOn means'),
     doc('Deployment environments and DevOps', 'azure/cloud-adoption-framework/ready/considerations/environments', 'the “Environment types” list — dev, test, prod — and the rule that one template with different parameters builds each of them')],
    'Free: reading. Nothing is deployed.', [
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
    portal(s(9, 'arch', 3), 'Decide what differs between dev and prod', 'List every parameter whose value changes, and why.', 'The document', [
      'Same template, two groups: dev with fleetSize 0 and a $5 budget; prod with fleetSize 2 and $20.',
      'What never differs: the NSG rules, HTTPS-only storage, the role assignments. Write why.',
    ], 'A table of parameters with their dev and prod values, and the list of what never changes.', 'The exam calls this an environment strategy: one template, parameterised only where environments genuinely differ, so a prod bug can be reproduced in dev.'),
    rec(9, 'arch', 'Template map, Portal vs code, ADR-001', ['Five rows: resource, node, parameter.', 'One thing code does that the portal cannot.', 'ADR-001 and the dev/prod differences.'], 'The map lets anyone navigate the template; the strategy says what a deployment is allowed to vary.'),
  ]),
  T(9, 'infra', 'Inventory with the CLI and detect drift', 'List every resource with its owner tag, change one tag by hand, run what-if against the live group and read which resource drifted.', 40,
    ['AZ-400 · Design and implement build and release pipelines', 'Resource inventory with JMESPath', 'what-if as a drift detector', 'Configuration drift'], ['Five or more resources listed with tags', 'what-if reports the changed tag as a Modify'],
    [doc('az resource list', 'cli/azure/resource#az-resource-list', 'the --query examples — JMESPath picks the columns'),
     doc('What-if deployments', 'azure/azure-resource-manager/templates/deploy-what-if', 'the change types — Create, Modify, Delete, NoChange — and the note that what-if compares the template with the live resources, which is what makes it a drift detector')],
    'Free: listing and what-if deploy nothing.', [
    both(s(9, 'infra', 1), 'List the resources', 'List every resource with its owner tag.', PORTAL, [
      'rg-capstone-team01 → Overview: the resource list. Add the Tags column with “Manage view”.',
      'Sort by owner; an empty cell is a resource that broke the standard.',
    ], [
      { cmd: 'az resource list -g rg-capstone-team01 --query "[].[name, type, tags.owner]" -o tsv | sort', explain: 'Every resource, its type and its owner. Anything you built but do not see tagged here broke the standard.', sample: 'lb-web-team01\tMicrosoft.Network/loadBalancers\tteam01-lead\nvm-tools-team01\tMicrosoft.Compute/virtualMachines\tteam01-lead\nvnet-capstone-team01\tMicrosoft.Network/virtualNetworks\tteam01-lead' },
    ], ['Microsoft.Compute/virtualMachines'], 'The gaps you find now are what the Week 11 policy denies.'),
    both(s(9, 'infra', 2), 'Change one tag by hand', 'Edit the VNet’s owner tag in the portal.', PORTAL, [
      'vnet-capstone-team01 → Tags: owner = somebody-else. Apply.',
    ], [
      { cmd: 'RG=rg-capstone-team01; VNETID=$(az network vnet show -g $RG -n vnet-capstone-team01 --query id -o tsv); az tag update --resource-id $VNETID --operation merge --tags owner=somebody-else --query "properties.tags.owner" -o tsv', explain: 'A portal change the template knows nothing about — the everyday way an environment drifts.', sample: 'somebody-else' },
    ], ['somebody-else'], 'Drift is not a mistake someone makes on purpose; it is a quick fix at 5 p.m. that nobody wrote down.'),
    both(s(9, 'infra', 3), 'Detect the drift with what-if', 'Run what-if; read the Modify; put the tag back.', PORTAL, [
      'Deploy a custom template → Load file infra/azuredeploy.json → prod parameters → Review + create → the preview lists vnet-capstone-team01 as Modify: tags.owner.',
      'Cancel. vnet-capstone-team01 → Tags → owner = team01-lead. Apply.',
    ], [
      { cmd: 'az deployment group what-if -g $RG --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.prod.json --parameters sshPublicKey="$(cat ~/.ssh/id_rsa.pub)" --no-pretty-print 2>/dev/null | grep -A 2 "virtualNetworks/vnet-capstone-team01"; az tag update --resource-id $VNETID --operation merge --tags owner=team01-lead -o none', explain: 'what-if compares every live resource with the template and names what differs: the tag, with the live value and the template’s; then the tag is put back.', sample: '~ Microsoft.Network/virtualNetworks/vnet-capstone-team01 [2023-11-01]\n  ~ tags.owner: "somebody-else" => "team01-lead"' },
    ], ['=>'], 'The exam asks how you find out the environment no longer matches the code: this is the command, and Week 12 fixes drift the proper way, through the pipeline.'),
    rec(9, 'infra', 'CLI inventory and drift', ['Five or more resources, their type, tagged or not.', 'The resource that drifted, its expected and actual value.'], 'The inventory is the before-picture for the template; the drift result is why the template must be the only writer.'),
  ]),
  T(9, 'dev', 'Fill the starter and deploy to dev', 'Complete the starter template, preview it with what-if, deploy it to a dev resource group, then delete the group.', 55,
    ['AZ-400 · Design and implement build and release pipelines', 'Template anatomy', 'what-if', 'Deployments'], ['what-if previewed', 'Deployment Succeeded', 'The dev group is deleted'],
    [doc('Deploy resources from a custom template (portal)', 'azure/azure-resource-manager/templates/deploy-portal', 'the “Deploy resources from custom template” steps: Build your own template → load file → parameters'),
     doc('What-if deployments', 'azure/azure-resource-manager/templates/deploy-what-if', 'the result legend — Create, Modify, Delete, NoChange — and the az deployment group what-if command')],
    'The dev copy is a second environment: with fleetSize 0 and no database it is the B1s VM and the balancer, about $0.04 an hour. Delete the group the same session.', [
    portal(s(9, 'dev', 1), 'Fill the starter', 'Download the starter and fill its blanks.', 'Guide → Architecture & IaC → Starter', [
      'Download azuredeploy.json and both parameter files into infra/.',
      'Replace each FILL-ME using its hint; the Full tab is the answer key.',
      'In the dev parameter file set teamId to t01dev, so names never clash with what you built by hand.',
    ], 'A template with no FILL-ME left.', 'Filling blanks in a real template teaches its structure faster than writing one from nothing.'),
    both(s(9, 'dev', 2), 'Preview, then deploy', 'Run what-if, then deploy into a dev group.', PORTAL, [
      'Resource groups → Create rg-capstone-team01-dev.',
      'Deploy a custom template → Build your own template → Load file azuredeploy.json → Save.',
      'Fill the parameters; Review + create shows what it will create; Create.',
      'Deployments → azuredeploy: wait for Succeeded.',
    ], [
      { cmd: 'DEV=rg-capstone-team01-dev; az group create -n $DEV -l eastus -o none; az deployment group what-if -g $DEV --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.dev.json --parameters sshPublicKey="$(cat ~/.ssh/id_rsa.pub)" --no-pretty-print 2>/dev/null | tail -1', explain: 'what-if lists every create, change and delete before anything happens; in an empty group, everything is a create.', sample: 'Resource changes: 37 to create.' },
      { cmd: 'az deployment group create -g $DEV --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.dev.json --parameters sshPublicKey="$(cat ~/.ssh/id_rsa.pub)" --query properties.provisioningState -o tsv', explain: 'The whole environment, as the dev file describes it: fleet parked, no database.', sample: 'Succeeded' },
    ], ['to create', 'Succeeded'], 'Preview first, always: what-if is how you catch a delete you did not mean.', {
      fixes: [{ symptom: 'Conflict: a vault or storage name already exists', fix: 'A name clashes with something you built by hand. Use a different teamId in the dev parameter file and retry.' }],
    }),
    rec(9, 'dev', 'Deployment', ['Blanks filled, what-if result, deployment result.'], 'The deployment record Week 10 automates.'),
    both(s(9, 'dev', 3), 'Delete the dev copy', 'Delete the dev resource group.', PORTAL, [
      'Resource groups → rg-capstone-team01-dev → Delete resource group → type the name → Delete.',
    ], [
      { cmd: 'az group delete -n rg-capstone-team01-dev --yes --no-wait && echo deleting', explain: 'The whole copy goes in one command — that is why everything lives in one group.', sample: 'deleting' },
    ], ['deleting'], 'A second environment doubles the bill until it is gone.'),
  ], { cost: { usd: 0.04, per: 'hour', note: 'The dev copy’s VM and balancer while the group exists; deleted inside the task.' } }),
  T(9, 'secops', 'Parameter files, validation and policy as code', 'Set dev and prod values with no secrets, validate the template against both, then write two deny policies and prove the template passes them.', 50,
    ['AZ-400 · Develop a security and compliance plan', 'Parameter files and secure parameters', 'Template validation', 'Azure Policy as code'], ['The template validates against both files', 'Two deny policies are assigned and proved', 'No secret in either file'],
    [doc('ARM parameter files', 'azure/azure-resource-manager/templates/parameter-files', 'the file format and the “Parameter precedence” section — why the SSH key and the database password are passed on the command line, never stored'),
     doc('Azure Policy definition structure', 'azure/governance/policy/concepts/definition-structure-basics', 'the if/then shape: a condition on fields and aliases, then an effect — deny is the one the pipeline relies on')],
    'Free: validation deploys nothing, and Azure Policy costs nothing.', [
    portal(s(9, 'secops', 1), 'Set the parameter values', 'Set teamId, environment, ownerTag, fleetSize per environment.', 'infra/ in the repository', [
      'dev: environment dev, teamId t01dev, fleetSize 0, createDatabase false, budgetAmount 5.',
      'prod: environment prod, teamId team01, fleetSize 2, budgetAmount 20.',
      'No keys: sshPublicKey and dbAdminPassword are passed at deploy time, never written in a file.',
    ], 'Two parameter files differing only where environments differ.', 'Parameters are what changes between environments; everything else stays identical, which is what makes prod predictable.'),
    both(s(9, 'secops', 2), 'Validate both', 'Validate the template with each parameter file.', PORTAL, [
      'Deploy a custom template → Load file → fill parameters → Review + create: “Validation passed” is the check. Do not click Create.',
      'Repeat with the other parameter values.',
    ], [
      { cmd: 'RG=rg-capstone-team01; for F in dev prod; do az deployment group validate -g $RG --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.$F.json --parameters sshPublicKey="$(cat ~/.ssh/id_rsa.pub)" --query properties.provisioningState -o tsv; done', explain: 'Validation checks the syntax and the values against Azure — and the policies in scope — deploying nothing. Once per file.', sample: 'Succeeded\nSucceeded' },
    ], ['Succeeded'], 'Validation is the cheapest test in the whole course, and from the next step it also runs the policies.'),
    both(s(9, 'secops', 3), 'Write two deny policies and assign them', 'No SSH from the internet; storage HTTPS-only.', PORTAL, [
      'Policy → Definitions → + Policy definition: scope the subscription, name deny-nsg-ssh-internet, rule: the JSON below. Save. Assign it to rg-capstone-team01.',
      'Policy → Assignments → Assign policy: rg-capstone-team01, definition “Secure transfer to storage accounts should be enabled”, Parameters: Effect = Deny. Create.',
    ], [
      { cmd: 'cat > infra/deny-nsg-ssh-internet.json <<\'EOF\'\n{ "if": { "allOf": [\n  { "field": "type", "equals": "Microsoft.Network/networkSecurityGroups/securityRules" },\n  { "field": "Microsoft.Network/networkSecurityGroups/securityRules/access", "equals": "Allow" },\n  { "field": "Microsoft.Network/networkSecurityGroups/securityRules/direction", "equals": "Inbound" },\n  { "field": "Microsoft.Network/networkSecurityGroups/securityRules/destinationPortRange", "equals": "22" },\n  { "field": "Microsoft.Network/networkSecurityGroups/securityRules/sourceAddressPrefix", "in": [ "*", "Internet", "0.0.0.0/0" ] }\n] }, "then": { "effect": "deny" } }\nEOF\nRGID=$(az group show -n $RG --query id -o tsv); az policy definition create -n deny-nsg-ssh-internet --display-name "Deny SSH from the internet" --mode All --rules @infra/deny-nsg-ssh-internet.json --query name -o tsv; az policy assignment create -n deny-ssh-internet --policy deny-nsg-ssh-internet --scope $RGID --query name -o tsv', explain: 'A rule in Policy’s language: an inbound allow to port 22 from anywhere is refused. The file is committed; the definition and its assignment are created from it.', sample: 'deny-nsg-ssh-internet\ndeny-ssh-internet' },
      { cmd: 'az policy assignment create -n deny-http-storage --policy 404c3081-a854-4457-ae30-26a93ef643f9 --scope $RGID --params \'{"effect":{"value":"Deny"}}\' --query "parameters.effect.value" -o tsv', explain: 'A built-in definition, assigned with the Deny effect: a storage account that accepts plain HTTP cannot be created here.', sample: 'Deny' },
    ], ['deny-ssh-internet', 'Deny'], 'Policy as code is the exam’s compliance domain in one file: the rule is reviewed like code, versioned like code, and refuses the request before anything deploys.'),
    both(s(9, 'secops', 4), 'Prove the policies', 'The template passes; a bad rule is refused.', PORTAL, [
      'After ten minutes: Deploy a custom template → azuredeploy.json → Review + create: Validation passed.',
      'nsg-snet-app-team01 → Inbound security rules → Add: source Any, port 22, Allow → Add: “RequestDisallowedByPolicy”.',
    ], [
      { cmd: 'sleep 600; az deployment group validate -g $RG --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.prod.json --parameters sshPublicKey="$(cat ~/.ssh/id_rsa.pub)" --query properties.provisioningState -o tsv; az network nsg rule create -g $RG --nsg-name nsg-snet-app-team01 -n Test-SSH-Any --priority 900 --access Allow --protocol Tcp --source-address-prefixes "*" --destination-port-ranges 22 2>&1 | grep -o RequestDisallowedByPolicy', explain: 'Ten minutes for the assignments to apply, then the two verdicts: the template passes, the bad rule is refused by name.', sample: 'Succeeded\nRequestDisallowedByPolicy' },
    ], ['Succeeded', 'RequestDisallowedByPolicy'], 'A policy proved by a refusal, not assumed. Week 10 runs the same validation in the pipeline, so a template that breaks a rule never reaches dev.', {
      fixes: [{ symptom: 'The bad rule is created instead of refused', fix: 'The assignment has not applied yet (up to fifteen minutes). Delete the rule, wait, retry.' }],
    }),
    rec(9, 'secops', 'Parameters and policy as code', ['Each parameter: dev value, prod value, secret or not.', 'The two policies, what each checks, and the result of the test.'], 'The environments, side by side, and the rules every deploy must pass.'),
  ]),

  // ── Week 10 — Pipelines with stages and gates ──────────────────────────
  T(10, 'arch', 'Write the change request and the gates', 'Write a change request for one template change, name the checks that gate dev and prod, and approve it in a pull request.', 35,
    ['AZ-400 · Design and implement processes and communications', 'Change enablement', 'Stage gates', 'Risk and rollback'], ['The RFC has risk, rollback and approver', 'The gates before dev and prod are named'],
    [doc('Creating a pull request', 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request', 'the description box and the Reviewers panel — the RFC goes in the description, the approver is the reviewer'),
     doc('Release gates and approvals', 'azure/devops/pipelines/release/approvals/', 'the “Approvals” and “Gates” sections: a human check and an automated check between stages — what the course’s dev and prod environments are a small version of')],
    'Free: GitHub pull requests.', [
    portal(s(10, 'arch', 1), 'Write the RFC in a pull request', 'Open a pull request with the RFC as its description.', 'github.com — Pull requests', [
      'The change: e.g. raise the fleet’s autoscale maximum to four.',
      'Risk, rollback plan, and the tests the pipeline runs.',
      'Request review from a teammate; approve only after it passes.',
    ], 'A pull request with a complete RFC, reviewed and approved.', 'The pull request is the change record: who asked, who approved, what ran.'),
    portal(s(10, 'arch', 2), 'Name the gates', 'Before dev: validate and what-if; before prod: green dev plus a reviewer.', 'The pull request description', [
      'Gate 1, before dev: validation passed under the policies, a what-if with no Delete.',
      'Gate 2, before prod: the dev group deployed, the counter answered, and the Architect approved the prod environment.',
    ], 'Two gates written down, each a list of checks a machine or a person makes.', 'A pipeline without gates is a faster way to break prod. The exam’s pipeline domain is mostly about which check sits before which stage.'),
    rec(10, 'arch', 'Request for change', ['Change, risk, rollback plan, approver.', 'The gates before dev and before prod.'], 'The release record’s front page.'),
  ]),
  T(10, 'infra', 'Protect main, add the environments and require the checks', 'Require a review and the passing checks before anything reaches main, and add dev and prod environments with a required reviewer on prod.', 35,
    ['AZ-400 · Design and implement a source control strategy', 'Branch protection', 'Required status checks', 'Deployment environments'], ['Main requires a review and the checks', 'prod needs approval'],
    [doc('Managing a branch protection rule', 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule', 'the three boxes you tick: require a pull request, required approvals, require status checks'),
     doc('Using environments for deployment', 'https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment', 'the “Required reviewers” protection rule and how a job that names the environment waits for it')],
    'Free: branch protection and environments on a private repository need a GitHub Free organisation or a public repo; a personal private repo needs Pro — use an organisation.', [
    portal(s(10, 'infra', 1), 'Protect main', 'Require a pull request, one review and the checks.', 'Repository → Settings → Branches', [
      'Add a rule for main.',
      'Require a pull request, one approval, and the status check named check (validate and what-if).',
      'Block force pushes.',
    ], 'Direct pushes to main are refused, and a red check blocks the merge.', 'Protection turns a convention into a rule the platform enforces.'),
    portal(s(10, 'infra', 2), 'Add the environments', 'dev with no gate; prod with a required reviewer.', 'Repository → Settings → Environments', [
      'New environment: dev. New environment: prod.',
      'prod → Required reviewers: the Architect. Deployment branches: main only.',
    ], 'Jobs targeting prod wait for approval; jobs targeting dev run at once.', 'The pause before prod is where a human reads the what-if.'),
    rec(10, 'infra', 'Repository controls', ['The branch rule, the required check, the two environments.'], 'Evidence of change control.'),
  ]),
  T(10, 'dev', 'Build the staged pipeline', 'Add a workflow with a check job, a dev deploy and a prod deploy behind the environment gate, keeping the what-if as an artifact.', 55,
    ['AZ-400 · Design and implement build and release pipelines', 'GitHub Actions jobs and needs', 'Artifacts', 'azure/login and az deployment'], ['The check job validates and runs what-if', 'dev deploys, then prod waits for approval', 'A run deployed both groups'],
    [doc('Deploy ARM templates with GitHub Actions', 'azure/azure-resource-manager/templates/deploy-github-actions', 'the workflow example: permissions id-token write, azure/login with client-id, tenant-id and subscription-id, then the deployment step'),
     doc('Storing and sharing data from a workflow', 'https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts', 'the upload-artifact step: the what-if listing is kept with the run, so a reviewer reads what was about to change')],
    'Free: 2,000 GitHub Actions minutes a month on a private repo; a full run uses about ten. The dev copy adds a VM and a balancer at about $0.04 an hour; delete the group after the run.', [
    portal(s(10, 'dev', 1), 'Write the check job', 'Validate and what-if on every pull request.', 'The repository: .github/workflows/deploy.yml', [
      'On: pull_request and push to main. permissions: id-token write, contents read.',
      'Job check: checkout → azure/login@v2 (client-id, tenant-id, subscription-id from repository variables) → az deployment group validate → az deployment group what-if > whatif.txt → upload-artifact.',
      'Name the job check: that is the status the branch rule requires.',
    ], 'A pull request shows the check job; a template that breaks a policy turns it red.', 'The first gate is a machine: validation runs the Week 9 policies, and nothing a human has to remember.'),
    portal(s(10, 'dev', 2), 'Write the dev and prod deploys', 'Two jobs, needs, environments, rollback on error.', 'The same workflow file', [
      'Job deploy-dev: needs check, environment dev; azure/login; az deployment group create -g rg-capstone-team01-dev with the dev file and --rollback-on-error.',
      'Job deploy-prod: needs deploy-dev, environment prod; the same step into rg-capstone-team01 with the prod file.',
      'sshPublicKey comes from a repository secret, passed as a parameter; nothing else is secret.',
    ], 'A workflow of three jobs: check → deploy-dev → deploy-prod.', 'needs is the pipeline’s spine: prod cannot start until dev finished, and the environment holds it for the reviewer.'),
    portal(s(10, 'dev', 3), 'Run it end to end', 'Merge; watch dev deploy; approve prod.', 'Repository → Actions', [
      'Merge the pull request. Open the run: check is green, deploy-dev deploys, deploy-prod waits.',
      'Download the artifact: the what-if listing. Approve prod; the run finishes green.',
    ], 'A green three-job run, with the what-if kept as an artifact.', 'From now on nobody deploys from a laptop, and every deploy leaves the preview it was approved on.', {
      fixes: [
        { symptom: 'AADSTS70021: no matching federated identity record', fix: 'The OIDC task is not finished, or its subject does not match repo:ORG/REPO:ref:refs/heads/main exactly.' },
        { symptom: 'Conflict: a name already exists', fix: 'Your hand-built resources share the name. Delete them, or deploy prod with a different teamId.' },
      ],
    }),
    both(s(10, 'dev', 4), 'Delete the dev copy', 'Delete the dev group until the next run.', PORTAL, [
      'Resource groups → rg-capstone-team01-dev → Delete resource group → confirm.',
    ], [
      { cmd: 'az group delete -n rg-capstone-team01-dev --yes --no-wait && echo deleting', explain: 'The dev copy is recreated by the next run; between runs it only costs.', sample: 'deleting' },
    ], ['deleting'], 'A staged pipeline that leaves dev running all month doubles the VM and balancer bill for nothing.'),
    rec(10, 'dev', 'Pipeline runs', ['Run number, the three stages, result, the artifact.'], 'The release record.'),
  ], { prerequisites: ['The deploy identity and its federated credential from Security & Ops (this week).'], cost: { usd: 0.04, per: 'hour', note: 'The dev copy’s VM and balancer between the run and the delete.' } }),
  T(10, 'secops', 'Sign in with OIDC, scope the deploy identity and test rollback', 'Let GitHub sign in as a managed identity with no secret, narrow what it may do, then break a deploy and watch it roll back.', 55,
    ['AZ-400 · Develop a security and compliance plan', 'Workload identity federation', 'Least-privilege deploy identities', 'Rollback on error'], ['No client secret exists', 'The deploy identity holds Contributor on two groups and nothing else', 'A failed deploy rolled back'],
    [doc('Connect GitHub to Azure with OpenID Connect', 'azure/developer/github/connect-from-azure-openid-connect', 'the “Add federated credentials” steps and the subject format repo:ORG/REPO:ref:refs/heads/main — one character off and sign-in fails'),
     doc('Rollback on error', 'azure/azure-resource-manager/templates/rollback-on-error', 'the --rollback-on-error flag: a failed deployment redeploys the last successful one — the UPDATE you will see after the failure')],
    'Free: managed identities, federated credentials and role assignments. The broken deploy rolls back to the same environment.', [
    both(s(10, 'secops', 1), 'Create the deploy identity and trust GitHub', 'A managed identity with a federated credential.', PORTAL, [
      'Managed Identities → Create: rg-capstone-team01, id-deploy-capstone-team01. Create.',
      'The identity → Federated credentials → Add: GitHub Actions deploying Azure resources, your org, repo capstone-team01, entity Branch main, name github-main. Add.',
      'Overview: copy the Client ID.',
    ], [
      { cmd: 'RG=rg-capstone-team01; CID=$(az identity create -g $RG -n id-deploy-capstone-team01 --query clientId -o tsv); az identity federated-credential create -g $RG --identity-name id-deploy-capstone-team01 -n github-main --issuer https://token.actions.githubusercontent.com --subject repo:ORG/capstone-team01:ref:refs/heads/main --audiences api://AzureADTokenExchange --query subject -o tsv; echo $CID', explain: 'An identity with no password, and a credential that trusts tokens GitHub issues for exactly this repo and branch.', sample: 'repo:ORG/capstone-team01:ref:refs/heads/main\n3f2a9c1e-…' },
    ], ['repo:ORG/capstone-team01'], 'A stored secret can leak and works from anywhere; a federated token works only for that repo, for minutes. The Week 9 template holds this same identity.'),
    both(s(10, 'secops', 2), 'Grant it the two groups only', 'Contributor on prod and dev; the IDs as variables.', PORTAL, [
      'rg-capstone-team01 → Access control (IAM) → Add role assignment: Contributor → Managed identity → id-deploy-capstone-team01. Repeat on rg-capstone-team01-dev (create it first).',
      'GitHub → Settings → Variables: AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID (variables, not secrets).',
    ], [
      { cmd: 'PID=$(az identity show -g $RG -n id-deploy-capstone-team01 --query principalId -o tsv); az group create -n $RG-dev -l eastus -o none; for G in $RG $RG-dev; do az role assignment create --assignee-object-id $PID --assignee-principal-type ServicePrincipal --role Contributor --scope $(az group show -n $G --query id -o tsv) --query scope -o tsv; done', explain: 'Contributor on exactly two groups: the pipeline cannot touch the rest of the subscription, and cannot grant access.', sample: '/subscriptions/…/resourceGroups/rg-capstone-team01\n/subscriptions/…/resourceGroups/rg-capstone-team01-dev' },
    ], ['rg-capstone-team01-dev'], 'The three IDs are not secrets — without the federated trust they sign nobody in. The scope is the fence.'),
    both(s(10, 'secops', 3), 'Read what it may do, and narrow it', 'List its assignments; remove anything wider.', PORTAL, [
      'Microsoft Entra ID → Enterprise applications → id-deploy-capstone-team01 → Azure role assignments: two Contributor rows, both resource groups.',
      'Anything at subscription scope, or Owner anywhere: Remove.',
    ], [
      { cmd: 'az role assignment list --assignee $PID --all --query "[].[roleDefinitionName, scope]" -o tsv; az role assignment list --assignee $PID --all --query "[?!contains(scope, \'resourceGroups\')].id" -o tsv | xargs -r az role assignment delete --ids', explain: 'Every grant the identity holds, then any grant above a resource group removed. The list should read two Contributor rows and nothing else.', sample: 'Contributor\t/subscriptions/…/resourceGroups/rg-capstone-team01\nContributor\t/subscriptions/…/resourceGroups/rg-capstone-team01-dev' },
    ], ['Contributor'], 'The pipeline’s identity is the most powerful identity in the subscription that nobody logs in as. The exam asks you to scope it to what it deploys, not to what it might need.'),
    portal(s(10, 'secops', 4), 'Break it, watch it roll back', 'Push a broken template, watch it roll back, revert.', 'github.com, then rg-capstone-team01-dev → Deployments', [
      'In a branch, set a value validation cannot catch (a VM size the region lacks). Merge after review.',
      'The run fails at deploy-dev; Deployments shows the failed one and, right after, the previous one redeployed; prod never ran.',
      'Revert the commit; the next run is green.',
    ], 'A red run stopped at dev, a rollback, then a green revert.', 'Rollback on error redeploys the last good deployment by itself, and the staged pipeline kept the failure out of prod — you proved both, not assumed them.'),
    rec(10, 'secops', 'Keyless access and rollback', ['How the pipeline signs in, no keys stored, the identity’s two grants, the rollback test.'], 'Evidence the pipeline is safe, scoped and reversible.'),
  ]),

  // ── Week 11 — Release strategies and observability ─────────────────────
  T(11, 'arch', 'Review cost by service and set the service levels', 'Break this month’s cost down by service with an action for each, then write the three service-level indicators the dashboard will watch.', 35,
    ['AZ-400 · Implement an instrumentation strategy', 'Cost analysis', 'SLIs and SLOs', 'Error budgets'], ['Three services with spend and an action', 'Three SLIs with targets'],
    [doc('Explore costs with cost analysis', 'azure/cost-management-billing/costs/quick-acm-cost-analysis', 'Group by Service name, and the Budgets view that shows how close to the alert you are'),
     doc('Load Balancer metrics', 'azure/load-balancer/load-balancer-standard-diagnostics', 'the metrics table: Health probe status (DipAvailability) and Data path availability (VipAvailability) — the two availability signals the course’s SLIs are built from')],
    'Free: cost analysis and metrics.', [
    both(s(11, 'arch', 1), 'Break down the cost', 'Group this month’s cost by service.', PORTAL, [
      'Cost Management → Cost analysis, scope rg-capstone-team01, group by Service name.',
      'Check the budget: how close to the alert?',
      'For each service, one action: keep, reduce, remove.',
    ], [
      { cmd: 'az consumption budget list --query "[].[name, amount, currentSpend.amount]" -o tsv; az consumption usage list --start-date $(date +%Y-%m-01) --end-date $(date +%F) --query "[].[instanceName, pretaxCost]" -o tsv | sort -k2 -nr | head -5', explain: 'Where the budget stands, then the five resources that cost most this month.', sample: 'budget-capstone-team01\t20.0\t6.12\nlb-web-team01\t4.1200\nvm-tools-team01\t1.9800' },
    ], ['budget-capstone-team01'], 'Every line has an owner and a decision — that is FinOps in one table.'),
    portal(s(11, 'arch', 2), 'Write the service levels', 'Availability, latency, errors: an indicator, a target, a window.', 'The document', [
      'Availability: health probe status ≥ 1 healthy instance for 99.5% of five-minute windows a month.',
      'Latency: Function HttpResponseTime p95 under 500 ms. Errors: Http5xx under 1% of requests.',
      'The error budget: how many bad minutes a month the targets allow, and who decides to spend it.',
    ], 'Three SLIs with targets and the monthly error budget.', 'An SLO turns “is it up?” into a number a dashboard can show and a release can be judged against — the canary in App’s task is swapped back when it eats the budget.'),
    rec(11, 'arch', 'Cost by service and service levels', ['Three or more services, spend, action.', 'Three SLIs, targets, the error budget.'], 'The cost section of the governance report, and the levels the dashboard watches.'),
  ]),
  T(11, 'infra', 'Blue/green the fleet with a second pool and a cut-over', 'Build a green scale set beside blue, test it on a second port, cut the production rule over to green, retire blue, park.', 60,
    ['AZ-400 · Design and implement build and release pipelines', 'Blue/green deployments', 'Backend pools and rules', 'Instant rollback'], ['Green answered on the test port', 'The cut-over served every request from green', 'Blue is retired and the fleet parked'],
    [doc('Load Balancer rules', 'azure/load-balancer/manage-rules-how-to', 'the “Update a load-balancing rule” section: the backend pool a rule points at is one property — the knob a blue/green cut-over turns'),
     doc('Deployment strategies', 'azure/architecture/framework/devops/release-engineering-cd', 'the blue-green and canary definitions: two complete environments and a switch, versus a slice of traffic')],
    'Blue and green together are up to four B1s for about half an hour (about $0.03 an hour beyond the free one) plus the balancer; park both at zero at the end. Stop or delete anything you started.', [
    both(s(11, 'infra', 1), 'Build green beside blue', 'A green scale set on v2, in its own pool.', PORTAL, [
      'lb-web-team01 → Backend pools → Add: bepool-green.',
      'Virtual machine scale sets → Create vmss-web-green-team01 like Week 6: Flexible, B1s, zones 1 and 2, snet-web, no public IP.',
      'Custom data writes “web v2 from zone”; load balancer lb-web-team01, pool bepool-green; 2 instances. Create.',
    ], [
      { cmd: 'RG=rg-capstone-team01; az network lb address-pool create -g $RG --lb-name lb-web-team01 -n bepool-green -o none; sed "s/web OK/web v2/" fleet-init.yaml > fleet-init-v2.yaml; az vmss create -g $RG -n vmss-web-green-team01 --orchestration-mode Flexible --image Ubuntu2204 --vm-sku Standard_B1s --instance-count 2 --zones 1 2 --vnet-name vnet-capstone-team01 --subnet snet-web --public-ip-address "" --lb lb-web-team01 --backend-pool-name bepool-green --admin-username azureuser --generate-ssh-keys --custom-data fleet-init-v2.yaml --platform-fault-domain-count 1 --tags owner=team01 --query "[orchestrationMode, sku.capacity]" -o tsv', explain: 'A second pool, then a second fleet whose only difference is the page it serves, registered to the green pool. Blue keeps serving.', sample: 'Flexible\n2' },
    ], ['Flexible'], 'A release is a new scale set, never an edit to running instances: blue keeps serving while green is built beside it.'),
    both(s(11, 'infra', 2), 'Wake blue and open a test door to green', 'Blue at two; port 8080 → green.', PORTAL, [
      'vmss-web-team01 → Scaling → Instance count 2 → Save.',
      'lb-web-team01 → Load balancing rules → Add http-test: frontend fe, port 8080 → backend 80, pool bepool-green, probe http. Save.',
    ], [
      { cmd: 'az vmss scale -g $RG -n vmss-web-team01 --new-capacity 2 -o none; az network lb rule create -g $RG --lb-name lb-web-team01 -n http-test --protocol Tcp --frontend-port 8080 --backend-port 80 --frontend-ip-name fe --backend-pool-name bepool-green --probe-name http --query provisioningState -o tsv; sleep 150; IP=$(az network public-ip show -g $RG -n pip-lb-web-team01 --query ipAddress -o tsv); for i in 1 2 3 4 5 6 7 8 9 10; do curl -s --max-time 5 http://$IP:8080; done | cut -d" " -f1-2 | sort | uniq -c', explain: 'Blue awake on port 80; a test rule on 8080 that reaches only green. Ten requests on the test port all say v2.', sample: 'Succeeded\n     10 web v2' },
    ], ['web v2'], 'Two complete fleets, one address: the test port lets the team read green with real traffic before any visitor does.'),
    both(s(11, 'infra', 3), 'Cut over, count, keep the way back', 'Point the http rule at green; every answer is v2.', PORTAL, [
      'lb-web-team01 → Load balancing rules → http → Backend pool: bepool-green. Save. Open the address ten times: every page says v2.',
      'The rollback is the same edit with bepool: write it in the record.',
    ], [
      { cmd: 'az network lb rule update -g $RG --lb-name lb-web-team01 -n http --backend-pool-name bepool-green --query "backendAddressPool.id" -o tsv | sed "s|.*/||"; sleep 20; for i in 1 2 3 4 5 6 7 8 9 10; do curl -s --max-time 5 -o /dev/null -w "%{http_code} " http://$IP; echo; done | sort | uniq -c; for i in 1 2 3 4 5; do curl -s http://$IP; done | cut -d" " -f1-2 | sort | uniq -c', explain: 'One property changed on the production rule; then ten status codes (all 200, none failed) and five pages (all v2).', sample: 'bepool-green\n     10 200 \n      5 web v2' },
    ], ['bepool-green', '200', 'web v2'], 'Blue/green on the exam is this one edit: the rollback is the same command with the pools reversed, and it takes seconds, not a redeploy.'),
    both(s(11, 'infra', 4), 'Retire blue and park', 'Blue to zero; green parked; the test rule removed.', PORTAL, [
      'vmss-web-team01 → Scaling → 0. vmss-web-green-team01 → Scaling → 0. lb-web-team01 → Load balancing rules → http-test → Delete.',
    ], [
      { cmd: 'az vmss scale -g $RG -n vmss-web-team01 --new-capacity 0 -o none; az vmss scale -g $RG -n vmss-web-green-team01 --new-capacity 0 -o none; az network lb rule delete -g $RG --lb-name lb-web-team01 -n http-test; az vmss list -g $RG --query "[].[name, sku.capacity]" -o tsv', explain: 'Both fleets parked, the test door closed. The green set is next week’s blue.', sample: 'vmss-web-green-team01\t0\nvmss-web-team01\t0' },
    ], ['0'], 'The release is over when the old fleet is parked and nothing that bills by the hour is left running.'),
    rec(11, 'infra', 'Release strategy', ['Blue/green: the two sets, the test port, requests counted before and after the cut-over, failed requests (none).'], 'The governance report shows a release that could be undone in seconds.'),
  ], { cost: { usd: 0.056, per: 'hour', note: 'Up to three billed B1s and the balancer while blue and green run together; both parked at the end.' } }),
  T(11, 'dev', 'Canary the counter with a deployment slot and a metric', 'Add a staging slot, deploy version 2 to it, call it thirty times, and let the error metric decide whether it is swapped into production.', 50,
    ['AZ-400 · Design and implement build and release pipelines', 'Deployment slots', 'Slot swap', 'Metric-driven promotion'], ['A staging slot runs version 2', 'The slot’s Http5xx metric is read after thirty calls', 'The slot was swapped in, or kept out, by the metric'],
    [doc('Azure Functions deployment slots', 'azure/azure-functions/functions-deployment-slots', 'the “Swap slots” section and the Consumption plan note: one slot, and a swap that is also the rollback'),
     doc('Azure Monitor metrics for App Service', 'azure/app-service/web-sites-monitor', 'the Http5xx and HttpResponseTime rows of the metrics table — read per slot, which is what judges the canary')],
    'Free: one slot on the Consumption plan, and metrics, cost nothing.', [
    both(s(11, 'dev', 1), 'Add the staging slot', 'A slot cloned from production.', PORTAL, [
      'The Function App → Deployment → Deployment slots → Add slot: staging, clone settings from production. Add.',
    ], [
      { cmd: 'RG=rg-capstone-team01; FN=$(az functionapp list -g $RG --query "[0].name" -o tsv); az functionapp deployment slot create -g $RG -n $FN --slot staging --configuration-source $FN --query "[name, state]" -o tsv', explain: 'A second copy of the app with the same settings and its own URL, at …-staging.azurewebsites.net.', sample: 'func-capstone-team01-a1b2c3/staging\tRunning' },
    ], ['staging'], 'A slot is a release you can point at and return to; production is whatever the last swap left there.'),
    both(s(11, 'dev', 2), 'Deploy version 2 to the slot', 'Add a response header in the slot only.', PORTAL, [
      'The slot → Functions → visitorCount → Code + Test: add headers: { "X-Release": "v2" } to the returned object. Save.',
      'Open the slot URL /api/visitorCount: a count, and X-Release: v2 in the response headers (DevTools → Network).',
    ], [
      { cmd: 'curl -s -D - -o /dev/null https://$FN-staging.azurewebsites.net/api/visitorCount | grep -i "x-release"', explain: 'Version 2 answers on the slot’s own address with the new header; production is untouched.', sample: 'x-release: v2' },
    ], ['x-release'], 'Version 2 exists beside version 1 and takes no visitor yet: the canary is the slot, and nothing has changed for production.'),
    both(s(11, 'dev', 3), 'Call it thirty times and read the metric', 'Thirty calls; Http5xx on the slot.', PORTAL, [
      'Call the slot URL thirty times (reload). The slot → Monitoring → Metrics: Http 5xx, Sum, last 30 minutes: 0.',
    ], [
      { cmd: 'for i in $(seq 30); do curl -s -o /dev/null https://$FN-staging.azurewebsites.net/api/visitorCount; done; sleep 120; SLOT=$(az functionapp deployment slot list -g $RG -n $FN --query "[0].id" -o tsv); az monitor metrics list --resource $SLOT --metric Http5xx --aggregation Total --interval PT30M --offset 30m --query "value[0].timeseries[0].data[-1].total" -o tsv', explain: 'Thirty real calls, then the slot’s own error count over the window. Zero is the verdict that promotes.', sample: '0.0' },
    ], ['0'], 'This metric is the promotion trigger: in production an alert on it would swap the slot back without a human.'),
    both(s(11, 'dev', 4), 'Promote or keep it out', 'Zero errors: swap; errors: leave the slot where it is.', PORTAL, [
      'The Function App → Deployment slots → Swap: staging → production. Swap.',
      'Production now answers with X-Release: v2; a rollback is the same Swap again.',
    ], [
      { cmd: 'if [ "$(az monitor metrics list --resource $SLOT --metric Http5xx --aggregation Total --interval PT30M --offset 30m --query "value[0].timeseries[0].data[-1].total" -o tsv)" = "0.0" ]; then az functionapp deployment slot swap -g $RG -n $FN --slot staging --target-slot production; echo swapped; else echo "kept out"; fi; curl -s -D - -o /dev/null https://$FN.azurewebsites.net/api/visitorCount | grep -i "x-release"', explain: 'Zero errors swaps the slot into production and the header now comes from the production address; any error leaves version 2 in the slot.', sample: 'swapped\nx-release: v2' },
    ], ['swapped', 'x-release'], 'Promote or roll back is one swap either way; the decision came from a metric, not a feeling.'),
    rec(11, 'dev', 'Release strategy', ['Canary: the slot, version 2, the thirty calls, the metric, swapped or kept out.'], 'The governance report shows a release judged by a metric.'),
  ]),
  T(11, 'secops', 'Build the dashboard, require the tag with Policy and read the audit trail', 'Build a shared dashboard of the service levels, assign the owner-tag policy and prove it denies, then find who changed what in the Activity Log.', 55,
    ['AZ-400 · Implement an instrumentation strategy', 'Azure dashboards', 'Azure Policy deny effects', 'Activity Log'], ['A shared dashboard shows the three SLIs', 'An untagged resource is denied', 'Three audit events recorded'],
    [doc('Create a dashboard in the Azure portal', 'azure/azure-portal/azure-portal-dashboards', 'the “Create a dashboard” steps, the Metrics tile, and “Share”: a shared dashboard is a resource in the group, so the template can carry it'),
     doc('Assign a policy (portal)', 'azure/governance/policy/assign-policy-portal', 'the “Create a policy assignment” steps: scope, the definition picker, and the Parameters tab where the tag name goes'),
     doc('Azure Monitor activity log', 'azure/azure-monitor/essentials/activity-log', 'the “View the activity log” section and the filters — Operation, Event initiated by, and the 90-day retention')],
    'Free: dashboards, Azure Policy and 90 days of Activity Log cost nothing.', [
    both(s(11, 'secops', 1), 'Build and share the dashboard', 'Probe status, response time, 5xx, on one screen.', PORTAL, [
      'Dashboard → New dashboard → Blank: dash-capstone-team01. Add Metrics tiles: lb-web-team01 Health probe status; the Function HttpResponseTime (p95) and Http5xx. Save.',
      'Share → resource group rg-capstone-team01 → Publish. The dashboard is now a resource the template can hold.',
    ], [
      { cmd: 'RG=rg-capstone-team01; cat > dash.json <<\'EOF\'\n{ "lenses": { "0": { "order": 0, "parts": { "0": { "position": { "x": 0, "y": 0, "colSpan": 6, "rowSpan": 3 }, "metadata": { "inputs": [], "type": "Extension/HubsExtension/PartType/MarkdownPart", "settings": { "content": { "settings": { "content": "# Service levels\\n- Availability: health probe status, 99.5% of 5-minute windows\\n- Latency: HttpResponseTime p95 < 500 ms\\n- Errors: Http5xx < 1%", "title": "capstone-team01", "subtitle": "add the three metric tiles beside this card" } } } } } } } }, "metadata": { "model": { "timeRange": { "value": { "relative": { "duration": 24, "timeUnit": 1 } }, "type": "MsPortalFx.Composition.Configuration.ValueTypes.TimeRange" } } } }\nEOF\naz portal dashboard create -g $RG -n dash-capstone-team01 --input-path dash.json --tags owner=team01 --query name -o tsv', explain: 'The shared dashboard as a resource, with the service levels written on its first card; the metric tiles are added in the portal and saved back into it.', sample: 'dash-capstone-team01' },
    ], ['dash-capstone-team01'], 'The dashboard is the service levels made visible: when the on-call opens it at 2 a.m. the three numbers the Architect wrote are the first thing they see.'),
    both(s(11, 'secops', 2), 'Assign the policy and prove it denies', 'Require the owner tag; an untagged create fails.', PORTAL, [
      'Policy → Assignments → Assign policy: scope rg-capstone-team01, definition “Require a tag on resources”, tag name owner. Review + create.',
      'After a few minutes: Storage accounts → Create in rg-capstone-team01 with no tags → Review + create: RequestDisallowedByPolicy.',
    ], [
      { cmd: 'RGID=$(az group show -n $RG --query id -o tsv); az policy assignment create -n require-owner-tag --policy 871b6d14-10aa-478d-b590-94f262ecfa99 --scope $RGID --params \'{"tagName":{"value":"owner"}}\' --query name -o tsv; sleep 600; az storage account create -g $RG -n sttagtest$RANDOM --sku Standard_LRS 2>&1 | grep -o RequestDisallowedByPolicy', explain: 'The built-in definition assigned, ten minutes for it to apply, then a creation without the tag refused by name.', sample: 'require-owner-tag\nRequestDisallowedByPolicy' },
    ], ['require-owner-tag', 'RequestDisallowedByPolicy'], 'Policy denies at the request, before anything exists: the exam contrasts this with tools that only record a finding after the fact.', {
      fixes: [{ symptom: 'The account is created instead of refused', fix: 'The assignment has not applied yet (up to fifteen minutes). Delete the account, wait, retry.' }],
    }),
    both(s(11, 'secops', 3), 'Read the audit trail', 'List this week’s write operations.', PORTAL, [
      'rg-capstone-team01 → Activity log. Timespan: last 7 days. Read Operation name, Event initiated by and Time.',
    ], [
      { cmd: 'az monitor activity-log list -g $RG --offset 7d --query "[?contains(operationName.value, \'write\') || contains(operationName.value, \'swap\')].[eventTimestamp, caller, operationName.value]" -o tsv | head -8', explain: 'Every control-plane change is logged with who did it; this week it includes the rule cut-over and the slot swap. Kept 90 days free.', sample: '2026-11-10T14:02:07Z\tteam01-infra@school.edu\tMicrosoft.Network/loadBalancers/write\n2026-11-10T14:40:51Z\tteam01-dev@school.edu\tMicrosoft.Web/sites/slots/slotsswap/action' },
    ], ['Microsoft.'], 'The audit log is how an incident answers “who did this, and when” — and this week it says who cut the rule over and who swapped the slot.'),
    rec(11, 'secops', 'Policy, dashboard and audit', ['The dashboard and its tiles.', 'The policy and the result of the test.', 'Three events: when, who, operation.'], 'Governance the platform enforces for you, and the picture the on-call reads.'),
  ]),

  // ── Week 12 — Incident, compliance and handover ────────────────────────
  T(12, 'arch', 'Assemble the handover package', 'Catalogue every service, list the open risks, and sign the package off.', 45,
    ['AZ-400 · Design and implement processes and communications', 'Service transition', 'Risk registers', 'Release notes and runbooks'], ['Six services catalogued', 'Three risks', 'Signed off'],
    [doc('Operational excellence pillar', 'azure/well-architected/operational-excellence/', 'the checklist — the items on documentation, runbooks and handover are what the package must cover')],
    'Free: a document. Nothing is deployed.', [
    portal(s(12, 'arch', 1), 'Catalogue the services', 'List each service with its URL, owner and runbook.', 'The document', [
      'Website, API, the fleet behind the balancer, the database (opt-in), the queue, the pipeline.',
      'Each points to the runbook section that fixes it, and to the dashboard tile that shows it.',
    ], 'A six-row service catalogue.', 'The catalogue is the map a new team uses on day one.'),
    portal(s(12, 'arch', 2), 'List the risks', 'Turn open findings into risks.', 'The document', [
      'Start from Week 11’s recommendations and the error budget spent.',
      'Add: the balancer serves HTTP only, the database is opt-in, the SSH policy covers port 22 alone, one region.',
    ], 'Three or more risks, each with a mitigation.', 'Handing over known risks honestly is what makes a handover trustworthy.'),
    rec(12, 'arch', 'Service catalogue, Risk register, Sign-off', ['Catalogue, risks, and the sign-off.'], 'The capstone — the package you defend.'),
  ]),
  T(12, 'infra', 'Rebuild from the template and automate the restart', 'Rebuild the environment in a new group from the template, time it, run an Automation runbook against the tools VM, delete the group.', 55,
    ['AZ-400 · Design and implement build and release pipelines', 'Disaster recovery by redeploy', 'Azure Automation runbooks', 'Runbooks as code'], ['The rebuild Succeeded, timed', 'A runbook job Completed', 'The recovery group is deleted'],
    [doc('Deploy resources from a custom template (portal)', 'azure/azure-resource-manager/templates/deploy-portal', 'the deployment’s Overview page after Create — its start and end times are your recovery time'),
     doc('Azure Automation runbooks', 'azure/automation/automation-runbook-types', 'the PowerShell runbook type and the “Managed identities” note: the runbook signs in as the account, with no credential stored')],
    'The recovery copy is a second environment for the minutes it exists: the VM and balancer at about $0.04 an hour, fleet parked; Automation’s first 500 minutes a month are free. Delete the group the same session. Stop or delete anything you started.', [
    both(s(12, 'infra', 1), 'Rebuild it', 'Deploy the template into a new group, timed.', PORTAL, [
      'Resource groups → Create rg-capstone-team01-recover. Note the time.',
      'Deploy a custom template → Load file azuredeploy.json → prod parameters, teamId t01rec, fleetSize 0 → Create.',
      'Deployments → the deployment: Succeeded; note the duration.',
    ], [
      { cmd: 'REC=rg-capstone-team01-recover; date +%T; az group create -n $REC -l eastus -o none; az deployment group create -g $REC --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.prod.json --parameters teamId=t01rec fleetSize=0 sshPublicKey="$(cat ~/.ssh/id_rsa.pub)" --query properties.provisioningState -o tsv; date +%T', explain: 'The whole company, rebuilt from one file. teamId t01rec keeps names from clashing. The two times are your recovery time.', sample: '15:10:02\nSucceeded\n15:21:47' },
    ], ['Succeeded'], 'If it can be rebuilt from code, it can be recovered from anything.'),
    both(s(12, 'infra', 2), 'Run an Automation runbook', 'Restart the tools VM from a published runbook.', PORTAL, [
      'Automation Accounts → Create aa-capstone-team01 in rg-capstone-team01-recover, system-assigned identity on.',
      'The account → Identity → Azure role assignments → Virtual Machine Contributor on the group.',
      'Runbooks → Create: Restart-ToolsVm, PowerShell 7.2; paste Connect-AzAccount -Identity; Restart-AzVM -ResourceGroupName rg-capstone-team01-recover -Name vm-tools-t01rec. Publish → Start → Output.',
    ], [
      { cmd: 'AA=aa-capstone-team01; az automation account create -g $REC -n $AA -o none; AAID=$(az automation account show -g $REC -n $AA --query id -o tsv); PID=$(az resource update --ids $AAID --set identity.type=SystemAssigned --query identity.principalId -o tsv); sleep 30; az role assignment create --assignee-object-id $PID --assignee-principal-type ServicePrincipal --role "Virtual Machine Contributor" --scope $(az group show -n $REC --query id -o tsv) -o none; echo granted', explain: 'The account, its own identity, and one role on one group: the runbook restarts VMs here and nothing else.', sample: 'granted' },
      { cmd: 'printf \'Connect-AzAccount -Identity | Out-Null\\nRestart-AzVM -ResourceGroupName "%s" -Name "vm-tools-t01rec"\\n\' $REC > restart.ps1; az automation runbook create -g $REC --automation-account-name $AA -n Restart-ToolsVm --type PowerShell72 -o none; az automation runbook replace-content -g $REC --automation-account-name $AA -n Restart-ToolsVm --content @restart.ps1; az automation runbook publish -g $REC --automation-account-name $AA -n Restart-ToolsVm -o none; JOB=$(az automation runbook start -g $REC --automation-account-name $AA -n Restart-ToolsVm --query name -o tsv); sleep 180; az automation job show -g $REC --automation-account-name $AA -n $JOB --query status -o tsv', explain: 'The runbook as a file, created, published and started; three minutes later its job status: Completed, and the VM restarted.', sample: 'Completed' },
    ], ['granted', 'Completed'], 'The exam asks for repairs nobody types by hand: a runbook is the repair as code, signed in by identity, and an alert can start it.'),
    both(s(12, 'infra', 3), 'Delete the recovery copy', 'Delete the recovery group, Automation account included.', PORTAL, [
      'Resource groups → rg-capstone-team01-recover → Delete resource group → type the name → Delete.',
    ], [
      { cmd: 'az group delete -n rg-capstone-team01-recover --yes --no-wait && echo deleting', explain: 'Keep the evidence, not the bill. The Automation account goes with the group.', sample: 'deleting' },
    ], ['deleting'], 'Clean-up is part of the drill.'),
    rec(12, 'infra', 'Scenario outcomes', ['Recover: rebuild from the template — time and result.', 'The runbook, its role and its job result.'], 'Proof the template is the environment, and that the repair is a document.'),
  ], { cost: { usd: 0.04, per: 'hour', note: 'The recovery copy’s VM and balancer while the group exists; deleted inside the task.' } }),
  T(12, 'dev', 'Fix an app failure through CI', 'Break the Function’s configuration by hand, prove the drift with what-if, then restore it by re-running the pipeline — no portal fixes.', 45,
    ['AZ-400 · Design and implement build and release pipelines', 'Configuration drift', 'Redeploy as a fix'], ['The API failed, drift was detected, and CI recovered it'],
    [doc('What-if deployments', 'azure/azure-resource-manager/templates/deploy-what-if', 'the Modify change type with the property path — the proof the portal change is drift'),
     doc('Manually run a workflow', 'https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/manually-running-a-workflow', 'the “Run workflow” button — it only appears when the workflow has workflow_dispatch')],
    'Free: a setting change, one what-if and one pipeline run (about ten of the 2,000 free minutes).', [
    both(s(12, 'dev', 1), 'Break it', 'Point the Function at a wrong Cosmos endpoint.', PORTAL, [
      'Function App → Environment variables → CosmosConnection__accountEndpoint → https://wrong.documents.azure.com:443/ → Apply.',
      'Open the function URL: a server error.',
    ], [
      { cmd: 'RG=rg-capstone-team01; FN=$(az functionapp list -g $RG --query "[0].name" -o tsv); az functionapp config appsettings set -g $RG -n $FN --settings CosmosConnection__accountEndpoint=https://wrong.documents.azure.com:443/ -o none; sleep 30; curl -s -o /dev/null -w "%{http_code}\\n" https://$FN.azurewebsites.net/api/visitorCount', explain: 'The API now fails with a server error. The dashboard’s 5xx tile shows it before anyone reports it.', sample: '500' },
    ], ['500'], 'This is drift: the running environment no longer matches the code.'),
    both(s(12, 'dev', 2), 'Prove the drift', 'what-if names the setting and both values.', PORTAL, [
      'Deploy a custom template → azuredeploy.json → prod parameters → Review + create: the Function App shows Modify on appSettings.',
    ], [
      { cmd: 'az deployment group what-if -g $RG --template-file infra/azuredeploy.json --parameters @infra/azuredeploy.parameters.prod.json --parameters sshPublicKey="$(cat ~/.ssh/id_rsa.pub)" --no-pretty-print 2>/dev/null | grep -B 1 -A 1 "wrong.documents"', explain: 'The template says one endpoint, the live app another: a Modify with both values, found by the same command the pipeline runs.', sample: '~ properties.siteConfig.appSettings[9].value: "https://wrong.documents.azure.com:443/" => "https://cosmos-capstone-team01-a1b2c3.documents.azure.com:443/"' },
    ], ['=>'], 'Detection by comparison, not by memory: the pipeline would have shown the same line in its artifact.'),
    portal(s(12, 'dev', 3), 'Fix it through CI', 'Re-run the deploy workflow, then retest.', 'Repository → Actions → deploy → Run workflow', [
      'Run the workflow on main; approve prod.',
      'The template resets the setting.',
      'Open the function URL again: a count, not an error.',
    ], 'The API returns a count again after the pipeline run.', 'Redeploying the known-good template fixes drift without anyone touching the portal — and leaves a run that says so.'),
    rec(12, 'dev', 'Scenario outcomes', ['App failure fixed through CI — time and result.'], 'The second scenario of the handover.'),
  ]),
  T(12, 'secops', 'Contain a security incident and write the post-mortem', 'Open RDP to the internet on purpose, detect it in the Activity Log, contain it, write the timeline, root cause and prevention, widen the policy.', 50,
    ['AZ-400 · Develop a security and compliance plan', 'Detection', 'Containment', 'Post-incident review'], ['The rule was detected and removed', 'A post-mortem with a timeline and a prevention', 'The policy now denies 3389 too'],
    [doc('Azure Monitor activity log', 'azure/azure-monitor/essentials/activity-log', 'filter Operation to “Create or Update Security Rule” — the entry names who opened the port and when'),
     doc('Azure Policy definition structure', 'azure/governance/policy/concepts/definition-structure-basics', 'the “in” condition: a list of values one field may match — how a rule for one port becomes a rule for several')],
    'Free: an NSG rule, the Activity Log and a policy update. The VM stays deallocated, so nothing is exposed.', [
    both(s(12, 'secops', 1), 'Inject the incident', 'Add an RDP rule open to the internet.', PORTAL, [
      'nsg-snet-app-team01 → Inbound security rules → Add: source Any, port 3389, TCP, Allow, priority 900, name Bad-RDP-Any. Add.',
      'It is created: the Week 9 policy covers port 22 only.',
    ], [
      { cmd: 'RG=rg-capstone-team01; az network nsg rule create -g $RG --nsg-name nsg-snet-app-team01 -n Bad-RDP-Any --priority 900 --access Allow --protocol Tcp --source-address-prefixes "*" --destination-port-ranges 3389 --query access -o tsv', explain: 'The exact misconfiguration attackers scan for, and it goes through: the deny policy names port 22 alone. The VM is deallocated, so nothing is exposed.', sample: 'Allow' },
    ], ['Allow'], 'A realistic incident: one bad rule, easy to add, easy to miss, and a control that almost caught it.'),
    both(s(12, 'secops', 2), 'Detect and contain', 'Find it in the Activity Log, then delete it.', PORTAL, [
      'rg-capstone-team01 → Activity log → the “Create or Update Security Rule” entry: who, when.',
      'nsg-snet-app-team01 → Inbound security rules → Bad-RDP-Any → Delete.',
    ], [
      { cmd: 'az monitor activity-log list -g $RG --offset 1h --query "[?contains(operationName.value, \'securityRules/write\')].[eventTimestamp, caller]" -o tsv | head -1', explain: 'Who created the rule, and when — the first question of any incident.', sample: '2026-12-01T10:02:07Z\tteam01-secops@school.edu' },
      { cmd: 'az network nsg rule delete -g $RG --nsg-name nsg-snet-app-team01 -n Bad-RDP-Any && echo contained', explain: 'Containment: remove the exposure first, investigate after.', sample: 'contained' },
    ], ['contained'], 'Contain, then learn. The time between the two commands is the number the post-mortem is built around.'),
    both(s(12, 'secops', 3), 'Write the post-mortem and widen the rule', 'Timeline, root cause, prevention; the policy covers 3389.', 'The document, then Azure Policy', [
      'Timeline: opened, detected, contained — from the Activity Log and your notes; time to detect, time to contain.',
      'Root cause: a portal change outside the pipeline, a policy written for one port. Blast radius; prevention, owner, date.',
      'Policy → Definitions → deny-nsg-ssh-internet → Edit definition: destinationPortRange in [22, 3389, *]. Save.',
    ], [
      { cmd: 'sed -i \'s/"destinationPortRange", "equals": "22"/"destinationPortRange", "in": [ "22", "3389", "*" ]/\' infra/deny-nsg-ssh-internet.json; az policy definition update -n deny-nsg-ssh-internet --rules @infra/deny-nsg-ssh-internet.json --query "policyRule.if.allOf[3].in" -o tsv', explain: 'The prevention, as code: the same file widened to three values, committed, and the definition updated from it.', sample: '22\t3389\t*' },
    ], ['3389'], 'The exam ends every incident the same way: a timeline, a root cause and a change that stops the repeat — not a name. Here the change is one line in a policy file.'),
    rec(12, 'secops', 'Scenario outcomes, Post-mortem, Sign-off', ['Security incident contained — time and result.', 'The post-mortem: timeline, root cause, prevention, owner.', 'Final checklist: no open ports, no keys, budget alerting, fleet parked.'], 'The third scenario, the lesson, and the security sign-off.'),
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
    description: 'Run the company’s Azure like production: identity without secrets, a two-zone fleet behind a load balancer, a zone-redundant database and a queue, autoscale and a timed recovery.',
    certification: 'AZ-104',
    level: 'associate' as const,
    audience: 'Four roles operate the environment the Fundamentals course built. Week 0 deploys it if your team is new.',
    framework: 'AZ_104',
    authoredFramework: 'AZ_900',
    intro: 'Starts from the Fundamentals environment and adds a protected vault and a locked API, a scale set across two zones behind a Standard Load Balancer, a zone-redundant PostgreSQL server and a queue, autoscale, and a timed recovery drill against AZ-104.',
  },
  devops: {
    weeks: [9, 12] as [number, number],
    id: 'azure-devops',
    title: 'Azure DevOps Capstone',
    description: 'Run the company’s Azure the DevOps way: a tested template with drift detection and policy as code, a staged OIDC pipeline, blue/green and slot releases judged by metrics, incidents with post-mortems.',
    certification: 'AZ-400',
    level: 'expert' as const,
    audience: 'Four roles codify, automate, govern and hand over the environment. Week 0 deploys it if your team is new.',
    framework: 'AZ_400',
    authoredFramework: 'AZ_900',
    intro: 'Starts from the Administrator environment and adds what-if as a drift detector and two deny policies, a check → dev → prod pipeline signed in by a federated identity, a blue/green cut-over and a slot canary judged by metrics, a shared dashboard, a rebuild and a runbook, an incident with its post-mortem, and the handover against AZ-400.',
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

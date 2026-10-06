import type { Course, Step, Task, TaskCost, WeekDef } from '../../types';
import { CLOUD_FILES, CLOUD_FORMS, cloudTask, cloudWeeks, setupWeek, sliceCourse, stepKit, type WeekPlan } from './cloudKit';

/**
 * AWS Cloud Capstone (R87) — "Run a small company in AWS".
 *
 * The Azure course's twin (`azureCloud.ts`): the same twelve weeks, the same
 * four roles, the same twelve documents, with AWS services and the AWS CLI.
 * The final environment is `template.yaml` (`src/lib/cloud/awsIac.ts`).
 *
 * Where the platforms genuinely differ, the course says so rather than
 * pretending they match: the site needs CloudFront for HTTPS (S3's website
 * endpoint is HTTP only), identity is an IAM role scoped to one table rather
 * than a managed identity, and admin access is Session Manager.
 *
 * Commands run in AWS CloudShell in us-east-1. Each step sets the variables
 * it uses. Every step that starts the instance ends with it stopped.
 */

const FW = ['AWS_CLF', 'WAF'];
const { portal, cli, both, record } = stepKit(FW, 'AWS CloudShell (us-east-1)');
const P = 'aws';

/** Finds the tools instance by its Name tag, so no step needs an id typed in. */
const IID = 'IID=$(aws ec2 describe-instances --filters Name=tag:Name,Values=ec2-tools-team01 Name=instance-state-name,Values=running,stopped --query "Reservations[0].Instances[0].InstanceId" --output text)';

const PLANS: WeekPlan[] = [
  { n: 1, title: 'Cloud concepts and governance', theme: 'Who manages what, a budget, a network', objective: 'Say who manages what, set the standard and the $5 budget, then lay the network everything else sits in.',
    milestone: 'A budget alerts at $4, every planned service has a model and an owner, the VPC and subnet exist, the team can sign in and build with MFA on.',
    labels: ['Set the standard, the budget and the service model', 'Create the VPC and public subnet', 'Open the team repository and board', 'Add the team to the account and give them access'] },
  { n: 2, title: 'Core services', theme: 'Compute, storage, network — and what they cost', objective: 'Price it, choose storage classes, publish the website over HTTPS and bring up one small instance reachable only from you.',
    milestone: 'The estimate and storage choices are written, the site loads over HTTPS, the t3.micro runs in its zone, SSH works from your IP only.',
    labels: ['Estimate the cost and choose storage classes', 'Launch the tools instance', 'Publish the website with CloudFront', 'Allow SSH from your IP only'] },
  { n: 3, title: 'Serverless, data and identity', theme: 'A counter behind the site, and the team’s access', objective: 'Add a visitor counter — a Lambda reading and writing DynamoDB — and give the team its group, policy and MFA.',
    milestone: 'The page shows a live visitor count, the team’s group holds ReadOnlyAccess with MFA on, and no key appears in the browser.',
    labels: ['Draw the request flow and say who manages each hop', 'Create the DynamoDB table', 'Build the counter Lambda and API', 'Give the team the right access'] },
  { n: 4, title: 'Monitor, govern, pay', theme: 'Watch it, break it, fix it, audit it', objective: 'Watch cost and errors, read Trusted Advisor, find the change in CloudTrail, and write one failure up as an incident.',
    milestone: 'An alarm emails on Lambda errors, Trusted Advisor is read, the change is found in CloudTrail, one incident is recorded, and spend is reported.',
    labels: ['Report the cost, and read Trusted Advisor and the support plans', 'Alarm on Lambda errors', 'Find a failure in CloudWatch Logs', 'Find who changed it in CloudTrail and write the incident record'] },
  { n: 5, title: 'Secure by design', theme: 'Least privilege, every layer', objective: 'Give people and functions exactly the access they need, encrypt the secrets, fence the API, find what is exposed.',
    milestone: 'The Lambda role reaches one table, a SecureString sits under the team key, a foreign origin is refused, a denial is proved and the analyzer’s findings are owned.',
    labels: ['Write the access matrix and the layers', 'Parameter Store and a customer-managed key', 'Scope the Lambda role and lock CORS', 'Prove a denial and find exposed access'] },
  { n: 6, title: 'Resilient compute', theme: 'Two zones, one address', objective: 'Design, build and fence a two-zone fleet behind a load balancer, with a private path and no internet.',
    milestone: 'ADR-002 is costed, a launch template and a group run two instances in two zones behind an ALB, the fleet is parked, and a private instance was managed through endpoints alone.',
    labels: ['Design the two-zone fleet and record the decision', 'Build the fleet across two zones', 'Put the fleet behind a load balancer', 'Give the private subnet a path without the internet'] },
  { n: 7, title: 'Data and storage', theme: 'The right store, the right class', objective: 'Choose the data store, run an encrypted Multi-AZ database, decouple the counter with a queue, and age objects out.',
    milestone: 'ADR-003 is costed, a Multi-AZ PostgreSQL ran encrypted and private and left a snapshot, a queue with a dead-letter queue feeds a ledger, and a lifecycle rule ages the audit bucket.',
    labels: ['Choose the data store and the storage classes', 'Create a Multi-AZ PostgreSQL database', 'Queue the visits and write a ledger', 'Lock the data down and age it out'] },
  { n: 8, title: 'Scale, monitor, recover', theme: 'Prove it survives', objective: 'Set recovery targets, scale on demand, lose an instance and a database and get both back, and read the bill.',
    milestone: 'RPO and RTO per asset, a policy scaled the fleet and replaced a lost instance, a file and the database were restored, the drill was timed, and nothing bills by the hour.',
    labels: ['Set RPO, RTO and the scaling policy', 'Scale on CPU and prove self-healing', 'Recover a web file and the database', 'Run a timed drill and tear down'] },
  { n: 9, title: 'Infrastructure as code, tested', theme: 'The environment, as a file that is checked', objective: 'Read the environment as a template, detect drift, lint it, check it against policy, preview and deploy to dev.',
    milestone: 'ADR-001 and the environment strategy are written, drift was detected and repaired, the template lints and passes two Guard rules, and a dev stack was previewed, deployed and deleted.',
    labels: ['Map the template and set the environment strategy', 'Inventory with the CLI and detect drift', 'Fill the starter and deploy to dev', 'Parameter files, validation and policy as code'] },
  { n: 10, title: 'Pipelines with stages and gates', theme: 'Check, deploy dev, approve, deploy prod', objective: 'Deploy through a staged pipeline with no stored keys: a check job, dev, a reviewer before prod, a tested rollback.',
    milestone: 'Main requires the check, the pipeline signs in with OIDC and deploys dev then prod behind a gate, the deploy role is scoped, and a failure stopped at dev and rolled back.',
    labels: ['Write the change request and the gates', 'Protect main, add the environments, require the checks', 'Build the staged pipeline', 'OIDC, a scoped deploy role and a rollback test'] },
  { n: 11, title: 'Release strategies and observability', theme: 'Ship by weight, watch by number', objective: 'Set service levels and a dashboard, release the fleet blue/green and the function as a canary, judged by an alarm.',
    milestone: 'Three SLIs with targets, a dashboard that shows them, a blue/green shift with no failed request, a canary promoted or rolled back by an alarm, the tag rule proved and the audit log read.',
    labels: ['Review cost by service and set the service levels', 'Blue/green the fleet with weighted target groups', 'Canary the counter with alias weights and an alarm', 'Dashboard, Config and the audit trail'] },
  { n: 12, title: 'Incident, compliance and handover', theme: 'Survive it, learn from it, hand it on', objective: 'Recover from code, repair by runbook, fix drift through CI, contain an incident, write its post-mortem, hand over.',
    milestone: 'The environment was rebuilt and timed, an automation runbook ran, drift was fixed through the pipeline, an incident was contained with a post-mortem, and the handover package is signed off.',
    labels: ['Assemble the handover package', 'Rebuild from the template and automate the restart', 'Fix an app failure through CI', 'Contain a security incident and write the post-mortem'] },
];

/** One role's task for one week. */
function T(week: number, role: string, title: string, objective: string, minutes: number, learn: string[], done: string[], docs: Task['docs'], freeTier: string, steps: Step[], extra: { prerequisites?: string[]; tools?: string[]; cost?: TaskCost } = {}): Task {
  return cloudTask({ id: `${P}-w${week}-${role}`, role, week, title, objective, minutes, file: CLOUD_FILES[week - 1], frameworks: FW, learn, done, docs, freeTier, steps, ...extra });
}
const s = (week: number, role: string, n: number) => `${P}-w${week}-${role}-s${n}`;
const rec = (week: number, role: string, section: string, actions: string[], why: string) =>
  record(s(week, role, 9), CLOUD_FORMS[week - 1], CLOUD_FILES[week - 1], section, actions, why);

/** R92: every hands-on step reads console first, CloudShell second. */
const CONSOLE = 'AWS console · or CloudShell';
const D = 'https://docs.aws.amazon.com/';
const doc = (title: string, path: string, lookFor: string) => ({ title, url: path.startsWith('http') ? path : `${D}${path}`, lookFor });
/** R97: what the screen shows when the clicks are done, and the page(s) to read for this step. */
const out = (seen: string, ...docs: ReturnType<typeof doc>[]): Partial<Step> => ({ expectedOutput: seen, outputKind: 'result', docs });

const STOP = (week: number, role: string): Step =>
  both(s(week, role, 8), 'Stop the instance', 'Stop the instance so it stops costing money.', CONSOLE, [
    'EC2 → Instances → ec2-tools-team01 → Instance state → Stop instance.',
    'Wait until Instance state reads “Stopped”.',
  ], [
    { cmd: `${IID}; aws ec2 stop-instances --instance-ids $IID --query "StoppingInstances[0].CurrentState.Name" --output text`, explain: 'A stopped instance pays only for its disk. Stopping from inside the OS does the same; forgetting does not.', sample: 'stopping' },
    { cmd: 'aws ec2 wait instance-stopped --instance-ids $IID && echo stopped', explain: 'Waits until it is fully stopped.', sample: 'stopped', flags: [
      { flag: 'wait instance-stopped', meaning: 'Block until the state is stopped, then continue.' },
    ] },
  ], ['stopped'], 'Free-tier hours count while it runs: 750 a month covers one instance running all month, not one you forgot plus one you rebuilt.',
  out('Instance state reads “Stopped” for ec2-tools-team01.', doc('Stop and start your instance', 'AWSEC2/latest/UserGuide/Stop_Start.html', 'the “What happens when you stop an instance” list: the public IP is released, the disk is kept')));


const TASKS: Task[] = [
  // ── Week 1 — Cloud concepts and governance ─────────────────────────────
  T(1, 'arch', 'Set the standard, the budget and the service model', 'Agree names and tags, cap spending at $5, and say who manages what for each planned service.', 45,
    ['CLF-C02 · Cloud Concepts', 'Shared responsibility and IaaS / PaaS / SaaS', 'Budgets and tags', 'How to read a resource name'], ['A $5 budget alerts at 80%', 'The naming and tag table is agreed', 'Every planned service has a model and a responsibility line'],
    [doc('Shared responsibility model', 'https://aws.amazon.com/compliance/shared-responsibility-model/', 'the diagram: AWS secures the cloud, you secure what you put in it; rows change by service'),
     doc('Creating a cost budget', 'cost-management/latest/userguide/budgets-create.html', 'the “Create a budget” steps and the alert-threshold table — Actual vs Forecasted, and where the email goes'),
     doc('Tagging best practices', 'whitepapers/latest/tagging-best-practices/tagging-best-practices.html', 'the “Tagging categories” list — technical, business, security, automation — and pick one key from each')],
    'Free: AWS Budgets gives two budgets free, the Free Tier usage alerts are on by default, and CloudShell is free. Nothing is deployed this task.', [
    both(s(1, 'arch', 1), 'Create the $5 budget', 'Create a $5 monthly budget that emails the team.', CONSOLE, [
      'Billing and Cost Management → Budgets → Create budget → Use a template → Monthly cost budget.',
      'Name capstone-team01, amount 5, recipients: the team email. Create budget. Billing preferences: tick Free Tier alerts.',
      'Cost Explorer → Launch Cost Explorer once (it fills in a day). Open CloudShell (the >_ icon) once.',
    ], [
      { cmd: 'ACCT=$(aws sts get-caller-identity --query Account --output text); aws budgets create-budget --account-id $ACCT --budget \'{"BudgetName":"capstone-team01","BudgetLimit":{"Amount":"5","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}\' --notifications-with-subscribers \'[{"Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":80},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"team01-alerts@school.edu"}]}]\' && echo created', explain: 'The same budget from the shell: $5 a month, an email at 80% of actual spend.', sample: 'created', flags: [
        { flag: 'sts get-caller-identity', meaning: 'Prints who you are; the budget API needs your 12-digit account id.' },
        { flag: '"NotificationType":"ACTUAL" … "Threshold":80', meaning: 'Email when money already spent passes 80% — $4 of $5.' },
      ] },
    ], ['created'], 'A budget does not stop spending; it emails you before a mistake gets expensive. Actual is money spent; Forecasted guesses month-end. Budgets, Cost Explorer and CloudShell are exam tools.', {
      ...out('Budgets lists capstone-team01 at $5.00 with an alert at 80% of actual spend.', doc('Creating a cost budget', 'cost-management/latest/userguide/budgets-create.html', 'the “Create a budget” steps and the alert-threshold table — Actual vs Forecasted, and where the email goes')),
      paths: [
        { label: 'Your own free-tier account', when: 'You signed up yourself, with a card', steps: ['Budgets and Cost Explorer are available; the template monthly cost budget is the fastest path.'] },
        { label: 'AWS Academy Learner Lab', when: 'Your school gave you a lab account', steps: ['Budgets and IAM are locked. The lab page shows its own $ budget at the top: record that figure, and note the difference in the document.'] },
      ],
      fixes: [
        { symptom: 'Access denied to Billing', fix: 'Sign in as the root user once and enable IAM access to billing (Account → IAM user and role access to billing information).' },
        { symptom: 'No email arrives at 80%', fix: 'Budgets evaluate a few times a day and cost data lags up to a day. Check the address, then wait a day.' },
      ],
    }),
    portal(s(1, 'arch', 2), 'Classify each service', 'Say who manages what for each service you will build.', 'Team meeting', [
      'List the seven services: VPC, EC2, S3 + CloudFront site, Lambda + API Gateway, DynamoDB, CloudWatch, SNS.',
      'For each: IaaS, PaaS or serverless? Who patches the OS? Who secures the data?',
      'Pick the region (us-east-1); note its Availability Zones are separate buildings.',
    ], 'A table: service, model, what we manage, what AWS manages.', 'Shared responsibility is the first exam domain: on EC2 you patch the OS; on Lambda and DynamoDB AWS does, and you own code, data and identities.', {
      docs: [doc('Shared responsibility model', 'https://aws.amazon.com/compliance/shared-responsibility-model/', 'the diagram: AWS secures the cloud, you secure what you put in it; rows change by service')],
    }),
    portal(s(1, 'arch', 3), 'Agree the naming and tags', 'Agree one naming pattern and four tags as a team.', 'Team meeting', [
      'Pattern: what-it-is – what-it-is-for – who-owns-it. Example: ec2-tools-team01.',
      'Prefixes: vpc-, snet-, rt-, igw-, sg-, ec2-, ebs-. Buckets, functions and tables: capstone-team01-…; buckets add digits.',
      'Tags on everything: project=capstone, team=team01, env=dev, owner=your-role-email.',
    ], 'A table of prefixes and four tag keys everyone has agreed to use.', 'Read ec2-tools-team01 as three parts: an EC2 instance, for the tools job, owned by team01. Most AWS names are just the Name tag, so the pattern makes a list readable.', {
      docs: [doc('Tagging best practices', 'whitepapers/latest/tagging-best-practices/tagging-best-practices.html', 'the “Tagging categories” list — technical, business, security, automation — and pick one key from each')],
      fixes: [{ symptom: 'Bucket name refused', fix: 'Bucket names are lowercase letters, digits and hyphens, 3–63 characters, unique across all of AWS. capstone-team01-site plus four digits fits.' }],
    }),
    rec(1, 'arch', 'Account and guardrails, Service model, Naming, Tags, RACI', [
      'Account alias, region and zone, and the budget.',
      'One service-model row per service; one naming row per resource type.',
      'The four tags, and a short RACI.',
    ], 'This is the standard every later document and template refers to.'),
  ], { tools: ['AWS console', 'CloudShell'] }),
  T(1, 'infra', 'Create the VPC and public subnet', 'Create a VPC with one public subnet, an internet gateway and a route, named and tagged by the standard.', 45,
    ['CLF-C02 · Cloud Technology and Services', 'Global infrastructure: Regions and Availability Zones', 'VPC, subnets, internet gateways and route tables'], ['vpc-capstone-team01 is 10.10.0.0/16', 'The public subnet routes 0.0.0.0/0 to the IGW'],
    [doc('Regions and Availability Zones', 'AWSEC2/latest/UserGuide/using-regions-availability-zones.html', 'the first paragraphs: a Region is a geographic area; an Availability Zone is isolated datacenters inside it'),
     doc('Create a VPC', 'vpc/latest/userguide/create-vpc.html', 'the “VPC only” option (this course builds the parts one at a time) and the CIDR box'),
     doc('Route tables', 'vpc/latest/userguide/VPC_Route_Tables.html', 'the “Main route table” paragraph: every subnet uses it until you associate another; public is a routing decision')],
    'Free: VPCs, subnets, route tables and internet gateways cost nothing. A NAT gateway would cost about $32 a month, so this course never creates one.', [
    both(s(1, 'infra', 1), 'Create the VPC and subnet', 'Create the VPC 10.10.0.0/16 and subnet 10.10.1.0/24.', CONSOLE, [
      'VPC → Your VPCs → Create VPC → “VPC only”. Name vpc-capstone-team01, IPv4 CIDR 10.10.0.0/16, tags. Create.',
      'Subnets → Create subnet: VPC vpc-capstone-team01, name snet-public-team01, Availability Zone us-east-1a, CIDR 10.10.1.0/24. Create.',
      'Open the subnet: its route table is the VPC’s main one, local only.',
    ], [
      { cmd: 'TAGS="{Key=project,Value=capstone},{Key=team,Value=team01},{Key=env,Value=dev},{Key=owner,Value=team01-infra}"; VPC=$(aws ec2 create-vpc --cidr-block 10.10.0.0/16 --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=vpc-capstone-team01},$TAGS]" --query Vpc.VpcId --output text); echo $VPC', explain: 'The VPC is your private network. Its id is kept in $VPC for the next lines.', sample: 'vpc-0a1b2c3d4e5f67890', flags: [
        { flag: '--cidr-block 10.10.0.0/16', meaning: 'The whole private range: 65,536 addresses from the RFC 1918 10.x block.' },
        { flag: '--tag-specifications', meaning: 'Tags at creation. The Name tag is what the console shows as the name.' },
        { flag: '--query Vpc.VpcId --output text', meaning: 'Print only the new id, as plain text, so it can be saved in a variable.' },
      ] },
      { cmd: 'SUB=$(aws ec2 create-subnet --vpc-id $VPC --cidr-block 10.10.1.0/24 --availability-zone us-east-1a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=snet-public-team01},$TAGS]" --query Subnet.SubnetId --output text); echo $SUB', explain: 'A subnet lives in exactly one Availability Zone.', sample: 'subnet-0123456789abcdef0', flags: [
        { flag: '--availability-zone us-east-1a', meaning: 'One of the Region’s separate datacenters. Everything in this course uses 1a so the instance and its volumes can meet.' },
      ] },
    ], ['vpc-', 'subnet-'], 'A Region is a geographic area with several Availability Zones, separate buildings, and a subnet lives in one zone. A /16 leaves room for 256 /24 subnets.', {
      ...out('Your VPCs lists vpc-capstone-team01 (10.10.0.0/16); Subnets lists snet-public-team01 in us-east-1a.', doc('Create a VPC', 'vpc/latest/userguide/create-vpc.html', 'the “VPC only” option (this course builds the parts one at a time) and the CIDR box')),
      fixes: [{ symptom: 'CIDR overlaps or is invalid', fix: 'Another VPC already uses 10.10.0.0/16, or you typed /26. Use 10.20.0.0/16 and 10.20.1.0/24 everywhere and record it.' }],
    }),
    both(s(1, 'infra', 2), 'Give it a way out', 'Add an internet gateway and a default route.', CONSOLE, [
      'Internet gateways → Create: name igw-capstone-team01, tags. Actions → Attach to VPC → vpc-capstone-team01.',
      'Route tables → Create rt-public-team01 in the VPC. Edit routes → Add 0.0.0.0/0 → Internet Gateway → igw-capstone-team01. Save.',
      'Subnet associations → Edit subnet associations → tick snet-public-team01 → Save.',
    ], [
      { cmd: 'IGW=$(aws ec2 create-internet-gateway --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=igw-capstone-team01},$TAGS]" --query InternetGateway.InternetGatewayId --output text); aws ec2 attach-internet-gateway --internet-gateway-id $IGW --vpc-id $VPC', explain: 'The internet gateway is the VPC’s door to the internet. It does nothing until a route points at it.', sample: '(no output — attached)', flags: [
        { flag: 'attach-internet-gateway --vpc-id $VPC', meaning: 'A gateway belongs to one VPC; attaching is what connects the two.' },
      ] },
      { cmd: 'RT=$(aws ec2 create-route-table --vpc-id $VPC --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=rt-public-team01},$TAGS]" --query RouteTable.RouteTableId --output text); aws ec2 create-route --route-table-id $RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW; aws ec2 associate-route-table --route-table-id $RT --subnet-id $SUB --query AssociationState.State --output text', explain: 'A subnet is "public" only because its route table sends 0.0.0.0/0 to the gateway.', sample: '{ "Return": true }\nassociated', flags: [
        { flag: '--destination-cidr-block 0.0.0.0/0', meaning: 'Everything not matched by a more specific route — the internet.' },
        { flag: '--gateway-id $IGW', meaning: 'Send that traffic out through the internet gateway.' },
        { flag: 'associate-route-table', meaning: 'Make the subnet use this table instead of the VPC’s main one.' },
      ] },
    ], ['associated'], 'Public or private is a routing decision, not a subnet setting: rt-public-team01 has the 0.0.0.0/0 route, so snet-public-team01 is public. Week 6 adds a subnet with no such route.', {
      ...out('rt-public-team01 shows routes local and 0.0.0.0/0 → igw-capstone-team01, with snet-public-team01 associated.', doc('Route tables', 'vpc/latest/userguide/VPC_Route_Tables.html', 'the “Main route table” paragraph: every subnet uses it until you associate another; public is a routing decision')),
      fixes: [{ symptom: 'VPC variable is empty', fix: 'CloudShell restarted. Look the id up: aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01.' }],
    }),
    rec(1, 'infra', 'Landing zone', ['The VPC and subnet names.', 'The address space and the first subnet.'], 'The Network Design Document in Week 6 starts from these numbers.'),
  ], { tools: ['AWS console', 'CloudShell'] }),
  T(1, 'dev', 'Open the team repository and board', 'Create the team repository, a README with the naming standard, and a twelve-week board.', 35,
    ['CLF-C02 · Cloud Technology and Services', 'Where a team keeps its work', 'Project boards'], ['The repo exists with a README', 'The board has this week’s four tasks'],
    [doc('Creating a new repository', 'https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository', 'the visibility choice and the “Add a README file” box: tick it, or the repo starts empty'),
     doc('Creating a project', 'https://docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project', 'the “Board” layout and how to add a draft item — one card per role per week')],
    'Free: GitHub is free for private repositories and project boards.', [
    portal(s(1, 'dev', 1), 'Create the repository', 'Create the team repository with a README.', 'github.com', [
      'New repository: capstone-team01, private, tick “Add a README file”.',
      'Settings → Collaborators: invite your three teammates.',
      'Create folders site/, api/, infra/, docs/ and paste the naming standard into the README.',
    ], 'A private repository with a README and four folders, shared with the team.', 'Everything the team produces lives here: the site, the function, the template and the documents. Private, because it holds real resource names; a key or .pem file never goes in.', {
      docs: [doc('Creating a new repository', 'https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository', 'the visibility choice and the “Add a README file” box: tick it, or the repo starts empty')],
      fixes: [{ symptom: 'A teammate cannot see the repo', fix: 'They must accept the invitation email. Settings → Collaborators shows “Pending” until they do.' }],
    }),
    portal(s(1, 'dev', 2), 'Create the board', 'Create a board with this week’s four tasks.', 'github.com — Projects', [
      'Your profile → Projects → New project → Board. Columns: To do, Doing, Done.',
      'Add one card per role for Week 1, assigned. Link the board from the README.',
    ], 'A board with four assigned cards, linked from the README.', 'A board makes the four independent tasks visible, so nobody waits on anybody without knowing it. Moving a card is the cheapest status report there is.', {
      docs: [doc('Creating a project', 'https://docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project', 'the “Board” layout and how to add a draft item — one card per role per week')],
    }),
    rec(1, 'dev', 'Team tooling', ['The repository URL.', 'The board URL.'], 'The handover package in Week 12 points a new team at this repository.'),
  ], { tools: ['GitHub'] }),
  T(1, 'secops', 'Add the team to the account and give them access', 'Create an IAM user for each teammate in a builders group with AdministratorAccess, hand over the sign-in, and get MFA on every user.', 50,
    ['CLF-C02 · Security and Compliance', 'IAM users, groups and managed policies', 'The account alias and sign-in URL', 'MFA for every user'], ['Three IAM users can sign in', 'The builders group holds AdministratorAccess', 'MFA is on for every user'],
    [doc('Creating an IAM user in your AWS account', 'IAM/latest/UserGuide/id_users_create.html', 'the console steps: console access, autogenerated password, “must create a new password at next sign-in”, Download .csv'),
     doc('Creating IAM user groups', 'IAM/latest/UserGuide/id_groups_create.html', 'the “Attach permissions policies” step — search AdministratorAccess, tick exactly that one'),
     doc('Enable a virtual MFA device for an IAM user', 'IAM/latest/UserGuide/id_credentials_mfa_enable_virtual.html', 'the “My security credentials” route and the two consecutive codes the wizard asks for')],
    'Free: IAM users, groups, policies and MFA cost nothing. Do this signed in as the teammate who created the account.', [
    both(s(1, 'secops', 1), 'Create the builders group', 'Create capstone-team01-builders with AdministratorAccess.', CONSOLE, [
      'IAM → User groups → Create group. Name capstone-team01-builders.',
      'Attach permissions policies: search AdministratorAccess, tick it. Create group.',
    ], [
      { cmd: 'aws iam create-group --group-name capstone-team01-builders --query Group.Arn --output text && aws iam attach-group-policy --group-name capstone-team01-builders --policy-arn arn:aws:iam::aws:policy/AdministratorAccess && echo attached', explain: 'The group, then the AWS-managed policy attached to it.', sample: 'arn:aws:iam::123456789012:group/capstone-team01-builders\nattached', flags: [
        { flag: 'create-group --group-name', meaning: 'Read it as: the builders of the capstone, owned by team01.' },
        { flag: 'attach-group-policy --policy-arn arn:aws:iam::aws:policy/AdministratorAccess', meaning: 'An AWS-managed policy: every action on every resource.' },
      ] },
    ], ['capstone-team01-builders'], 'IAM users sign in; groups hold policies; a policy is a JSON list of allowed actions. Builders get AdministratorAccess because they create everything this month.', {
      ...out('User groups lists capstone-team01-builders with AdministratorAccess under Permissions.', doc('Creating IAM user groups', 'IAM/latest/UserGuide/id_groups_create.html', 'the “Attach permissions policies” step — search AdministratorAccess, tick exactly that one')),
      paths: [
        { label: 'Your own free-tier account', when: 'You created the account yourself', steps: ['IAM is yours: create the group, the users and the alias as below.'] },
        { label: 'AWS Academy Learner Lab', when: 'Your school gave you a lab account', steps: ['IAM is locked: everyone signs in through the lab page with the same session. Record “shared lab sign-in” and skip to MFA.'] },
      ],
    }),
    both(s(1, 'secops', 2), 'Create a user for each teammate', 'Create team01-infra, team01-dev and team01-arch in the group.', CONSOLE, [
      'IAM → Users → Create user: team01-infra. Tick “Provide user access to the console”, IAM user.',
      'Password: Autogenerated, tick “must create a new password at next sign-in”. Permissions: add to capstone-team01-builders.',
      'Create user → Download .csv (sign-in URL, temporary password). Repeat for team01-dev and team01-arch.',
    ], [
      { cmd: 'for U in team01-infra team01-dev team01-arch; do aws iam create-user --user-name $U --tags Key=team,Value=team01 -o none; aws iam create-login-profile --user-name $U --password "Capstone-$RANDOM-Start!" --password-reset-required --query "LoginProfile.UserName" --output text; aws iam add-user-to-group --group-name capstone-team01-builders --user-name $U; done', explain: 'Three users, each with a console password they must change at first sign-in, each in the builders group. Note each password as it is generated.', sample: 'team01-infra\nteam01-dev\nteam01-arch', flags: [
        { flag: 'create-login-profile --password-reset-required', meaning: 'A console password that must be changed at first sign-in.' },
        { flag: 'add-user-to-group', meaning: 'Membership is where the permissions come from; the user itself has none.' },
      ] },
    ], ['team01-infra'], 'One IAM user per person, never a shared one: CloudTrail then records who did what. The temporary password dies at first sign-in; the group membership is what grants access.', {
      ...out('Users lists team01-infra, team01-dev and team01-arch, each in capstone-team01-builders.', doc('Creating an IAM user in your AWS account', 'IAM/latest/UserGuide/id_users_create.html', 'the console steps: console access, autogenerated password, “must create a new password at next sign-in”, Download .csv')),
      fixes: [{ symptom: 'Access denied creating users', fix: 'You are not signed in as the account owner. Ask the teammate who created the account to run this task.' }],
    }),
    both(s(1, 'secops', 3), 'Set the account alias and hand over the sign-ins', 'Create the alias; send each teammate their sign-in privately.', CONSOLE, [
      'IAM → Dashboard → AWS Account → Account Alias → Create → capstone-team01.',
      'Send each teammate their user name, temporary password and https://capstone-team01.signin.aws.amazon.com/console privately, never the repository.',
      'Each teammate signs in at that URL, sets a new password, and sees the console.',
    ], [
      { cmd: 'aws iam create-account-alias --account-alias capstone-team01 && aws iam list-account-aliases --query "AccountAliases[0]" --output text', explain: 'An alias replaces the 12-digit account id in the sign-in URL.', sample: 'capstone-team01', flags: [
        { flag: 'create-account-alias', meaning: 'One alias per account; it must be unique across AWS.' },
      ] },
    ], ['capstone-team01'], 'IAM users sign in at the account’s own URL, not the root page; the alias makes it readable. A password pushed to the repository is public at once.', {
      ...out('The IAM dashboard shows the sign-in URL https://capstone-team01.signin.aws.amazon.com/console.', doc('Your AWS account ID and its alias', 'IAM/latest/UserGuide/console_account-alias.html', 'the “Creating, deleting, and listing an AWS account alias” steps and the sign-in URL it produces')),
      fixes: [
        { symptom: 'Alias already taken', fix: 'Someone in the world has it. Add your school’s initials: capstone-team01-uni.' },
        { symptom: 'A teammate gets “Incorrect user name or password”', fix: 'They are on the root sign-in page. Send the alias URL again; the user name is team01-infra, not an email.' },
      ],
    }),
    both(s(1, 'secops', 4), 'Get MFA on every user', 'Each member assigns an MFA device; you check the column.', CONSOLE, [
      'Each member: top-right menu → Security credentials → Assign MFA device → Authenticator app → scan → two codes → Add MFA.',
      'You: IAM → Users: the MFA column reads “Virtual” for all four.',
      'Root user: IAM → Dashboard → Security recommendations → root MFA on.',
    ], [
      { cmd: 'aws iam list-virtual-mfa-devices --assignment-status Assigned --query "VirtualMFADevices[].User.UserName" --output text', explain: 'Every user with an MFA device assigned. All four names should appear.', sample: 'team01-arch\tteam01-dev\tteam01-infra\tteam01-secops', flags: [
        { flag: '--assignment-status Assigned', meaning: 'Only devices in use, not spare ones.' },
      ] },
    ], ['team01'], 'Multi-factor authentication is the control the exam names most: a stolen password alone no longer opens the account. It is per IAM user, so each person does it once.', {
      ...out('IAM → Users shows MFA “Virtual” for all four users, and the root user has MFA too.', doc('Enable a virtual MFA device for an IAM user', 'IAM/latest/UserGuide/id_credentials_mfa_enable_virtual.html', 'the “My security credentials” route and the two consecutive codes the wizard asks for')),
      fixes: [{ symptom: 'The Security credentials page is missing MFA', fix: 'That user is signed in with SSO or a lab role. Record “managed by the identity provider” and move on.' }],
    }),
    rec(1, 'secops', 'Team access', ['One row per person: sign-in, group, policy, MFA.'], 'The Week 3 identity task adds the read-only group for people who only look.'),
  ], { tools: ['AWS console', 'CloudShell', 'An authenticator app'] }),

  // ── Week 2 — Core services: compute, storage, network, cost ────────────
  T(2, 'arch', 'Estimate the cost and choose storage classes', 'Price each component in the calculator against the Free Tier, then choose S3 storage classes and EBS volume types with a reason.', 45,
    ['CLF-C02 · Billing, Pricing and Support', 'Pricing Calculator and the Free Tier', 'S3 storage classes and durability', 'Factors that affect cost'], ['Every component has a monthly cost', 'Storage classes chosen with a reason'],
    [doc('AWS Free Tier', 'https://aws.amazon.com/free/', 'the three kinds of offer, 12 months free, always free, trials, and the 750-hour EC2 line'),
     doc('AWS Pricing Calculator', 'pricing-calculator/latest/userguide/what-is-pricing-calculator.html', 'the “Add service” flow and the estimate summary; it prices list rates, so subtract the free tier yourself'),
     doc('Amazon S3 storage classes', 'AmazonS3/latest/userguide/storage-class-intro.html', 'the comparison table: Standard, Standard-IA, One Zone-IA, Glacier; the retrieval fee column decides for a daily-read site')],
    'Free: the calculator. Nothing is deployed. Your list-price estimate should come out near $10 a month before the free tier and near $0 after it.', [
    portal(s(2, 'arch', 1), 'Price it', 'Price the components in the AWS Pricing Calculator.', 'calculator.aws', [
      'Add: EC2 (t3.micro, Linux, 730 h), S3 Standard (1 GB), CloudFront (1 GB out).',
      'Add: Lambda, API Gateway HTTP API, DynamoDB on-demand (mostly free tier). Read the monthly total.',
      'Halve the EC2 hours (you stop it); subtract the Free Tier: 750 hours, 5 GB S3.',
    ], 'A monthly estimate per service, with EC2 the largest line.', 'Cost is set by size, hours, Region, storage class and data out. The 12-month Free Tier removes the EC2 and S3 lines; Lambda and DynamoDB stay free.', {
      docs: [doc('AWS Pricing Calculator', 'pricing-calculator/latest/userguide/what-is-pricing-calculator.html', 'the “Add service” flow and the estimate summary; it prices list rates, so subtract the free tier yourself')],
      fixes: [{ symptom: 'EC2 comes out at $7–8', fix: 'You left 730 hours. A stopped instance bills no compute: halve the hours, and note that the disk still bills after the free 30 GB.' }],
    }),
    portal(s(2, 'arch', 2), 'Choose storage classes and volume types', 'Choose S3 classes and the EBS type for each asset.', 'The document', [
      'Site bucket: S3 Standard (read daily, 11 nines, no retrieval fee). Rejected: Standard-IA (retrieval fee).',
      'Root volume: gp3 8 GB, inside the free 30 GB. Snapshots (Week 8) are the backup.',
      'DynamoDB: on-demand, one Region. Write each alternative you rejected and its price.',
    ], 'One row per asset: class chosen, alternative rejected, monthly cost.', 'S3 classes trade storage price for retrieval price: Standard for data read often, IA for data read rarely, Glacier for archives. Every step down is a fee somewhere else.', {
      docs: [doc('Amazon S3 storage classes', 'AmazonS3/latest/userguide/storage-class-intro.html', 'the comparison table: Standard, Standard-IA, One Zone-IA, Glacier; the retrieval fee column decides for a daily-read site')],
    }),
    rec(2, 'arch', 'Components and cost, Redundancy and tiers', ['One component per row, with its monthly cost.', 'One storage-class row per asset.'], 'The architecture document grows every week and is handed over in Week 12.'),
  ], { tools: ['AWS Pricing Calculator'] }),
  T(2, 'infra', 'Launch the tools instance', 'Launch a t3.micro Amazon Linux instance in the public subnet with a key pair, read its facts, then stop it.', 45,
    ['CLF-C02 · Cloud Technology and Services', 'EC2 instance types and the Free Tier', 'Key pairs and the security group', 'Availability Zones; stop vs terminate'], ['ec2-tools-team01 runs in the public subnet', 'The instance is stopped at the end'],
    [doc('Launch an instance using the launch wizard', 'AWSEC2/latest/UserGuide/ec2-launch-instance-wizard.html', 'the “Free tier eligible” label by the instance type, and the Network settings panel: subnet and security group'),
     doc('Instance lifecycle', 'AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html', 'the state diagram: stopped keeps the disk and bills only storage; terminated is gone')],
    'Free tier: 750 t3.micro hours a month, the 8 GB gp3 disk, 750 public IPv4 hours. Stop it when done: hours count while running.', [
    both(s(2, 'infra', 1), 'Launch the instance', 'Launch the t3.micro in the public subnet.', CONSOLE, [
      'EC2 → Instances → Launch instance. Name ec2-tools-team01 (tags project, team, env, owner). Amazon Linux 2023, t3.micro.',
      'Key pair → Create new: kp-team01, RSA, .pem. Save the file; never commit it.',
      'Network settings: vpc-capstone-team01, snet-public-team01, Auto-assign public IP Enable; new security group sg-tools-team01, untick “Allow SSH”. Launch.',
    ], [
      { cmd: 'aws ec2 create-key-pair --key-name kp-team01 --query KeyMaterial --output text > kp-team01.pem && chmod 400 kp-team01.pem', explain: 'The private key is shown once. Download it from CloudShell (Actions → Download file) and never commit it.', sample: '(no output — kp-team01.pem saved)', flags: [
        { flag: '--query KeyMaterial --output text > kp-team01.pem', meaning: 'Write only the private key text to a file.' },
        { flag: 'chmod 400', meaning: 'Only you can read it; ssh refuses a key others can read.' },
      ] },
      { cmd: 'SUB=$(aws ec2 describe-subnets --filters Name=tag:Name,Values=snet-public-team01 --query "Subnets[0].SubnetId" --output text); VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); SG=$(aws ec2 create-security-group --group-name sg-tools-team01 --description "Tools instance" --vpc-id $VPC --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=sg-tools-team01},{Key=project,Value=capstone},{Key=team,Value=team01},{Key=owner,Value=team01-infra}]" --query GroupId --output text); aws ec2 run-instances --image-id resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --instance-type t3.micro --key-name kp-team01 --subnet-id $SUB --security-group-ids $SG --associate-public-ip-address --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=ec2-tools-team01},{Key=project,Value=capstone},{Key=team,Value=team01},{Key=env,Value=dev},{Key=owner,Value=team01-infra}]" --query "Instances[0].{id:InstanceId, ip:PrivateIpAddress}"', explain: 'Creates the empty security group, then the instance inside it. resolve:ssm always picks the current Amazon Linux image.', sample: '{ "id": "i-0abc123def4567890", "ip": "10.10.1.25" }', flags: [
        { flag: 'create-security-group … --vpc-id $VPC', meaning: 'A stateful firewall around the instance, with no inbound rule yet — Security adds the SSH rule.' },
        { flag: '--image-id resolve:ssm:/aws/service/ami-…', meaning: 'Look up today’s Amazon Linux 2023 image id instead of pasting one that goes stale.' },
        { flag: '--instance-type t3.micro', meaning: 'The free-tier size: 2 vCPU burstable, 1 GiB.' },
        { flag: '--associate-public-ip-address', meaning: 'Give it an internet address, for updates and your SSH test.' },
      ] },
    ], ['i-0', '10.10.1.'], 'EC2 is IaaS: you choose the image, type and zone, and you patch it. t3.micro is free-tier eligible; the new security group has no inbound rule, so nothing reaches it.', {
      ...out('Instances lists ec2-tools-team01 Running, t3.micro, in us-east-1a, with a public IPv4 address.', doc('Launch an instance using the launch wizard', 'AWSEC2/latest/UserGuide/ec2-launch-instance-wizard.html', 'the “Free tier eligible” label by the instance type, and the Network settings panel: subnet and security group')),
      fixes: [
        { symptom: 'InvalidParameterCombination: t3.micro', fix: 'Your account’s free tier is t2.micro. Use --instance-type t2.micro and record why.' },
        { symptom: 'The instance never gets a public IP', fix: 'Auto-assign public IP was left Disabled, and it cannot be added later. Terminate and launch again with it enabled.' },
        { symptom: 'Status check 1/2 for a long time', fix: 'Normal for the first two minutes. Wait for 2/2 before connecting.' },
      ],
    }),
    both(s(2, 'infra', 2), 'Read its facts and hand over the key', 'Read the IPs and zone, then share the key privately.', CONSOLE, [
      'EC2 → Instances → ec2-tools-team01 → Details: Private IPv4, Public IPv4, Availability Zone, Instance state.',
      'Send kp-team01.pem privately (a DM or password manager), never the repository or email. User: ec2-user.',
    ], [
      { cmd: `${IID}; aws ec2 describe-instances --instance-ids $IID --query "Reservations[0].Instances[0].{private:PrivateIpAddress, public:PublicIpAddress, az:Placement.AvailabilityZone, state:State.Name}"`, explain: 'The private IP is what other resources use; the public IP only exists for outbound patching and your SSH test. Download the key from CloudShell: Actions → Download file.', sample: '{ "private": "10.10.1.25", "public": "3.91.12.44", "az": "us-east-1a", "state": "running" }', flags: [
        { flag: 'IID=$(… describe-instances --filters Name=tag:Name …)', meaning: 'Find the instance by its Name tag, so no id is typed by hand.' },
      ] },
    ], ['running'], 'The public IP changes on every stop and start, so record the private one. AWS keeps five addresses in every subnet. The key is the password to this machine.',
    out('Details shows Private IPv4 10.10.1.x, a Public IPv4, Availability Zone us-east-1a, state running.', doc('Connect to your Linux instance using SSH', 'AWSEC2/latest/UserGuide/connect-linux-inst-ssh.html', 'the prerequisites: the .pem file, chmod 400, and the ec2-user name for Amazon Linux'))),
    rec(2, 'infra', 'Virtual machine facts', ['Name, type, zone, private IP, operating system.'], 'The runbook in Week 7 and the snapshot in Week 8 start from these facts.'),
    STOP(2, 'infra'),
  ], { tools: ['AWS console', 'CloudShell'] }),
  T(2, 'dev', 'Publish the website with CloudFront', 'Publish the site from a private S3 bucket behind CloudFront with Origin Access Control, then change it and redeploy.', 50,
    ['CLF-C02 · Cloud Technology and Services', 'S3 buckets and Block Public Access', 'CloudFront: the edge network', 'Origin Access Control'], ['The site loads over HTTPS', 'The bucket is private', 'A change was redeployed'],
    [doc('Restrict access to an S3 origin', 'AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html', 'the “Create a new OAC” steps and the bucket policy CloudFront hands you to paste into the bucket'),
     doc('Creating a bucket', 'AmazonS3/latest/userguide/create-bucket-overview.html', 'the bucket-naming rules (global, lowercase) and the Block Public Access section — leave every box ticked')],
    'Free tier: S3 5 GB for 12 months; CloudFront 1 TB out, always free. Do not enable WAF on the distribution: about $14 a month.', [
    both(s(2, 'dev', 1), 'Create the bucket and upload', 'Create a private bucket and upload the site.', CONSOLE, [
      'S3 → Create bucket: capstone-team01-site plus four digits, us-east-1, Block all public access ticked. Tags. Create.',
      'Open it → Upload → Add files → site/index.html (and 404.html) → Upload.',
    ], [
      { cmd: 'BUCKET=capstone-team01-site-$RANDOM; aws s3 mb s3://$BUCKET && aws s3 sync ./site s3://$BUCKET && echo $BUCKET', explain: 'Bucket names are global. Block Public Access is on by default — leave it on; CloudFront will read the bucket for you.', sample: 'make_bucket: capstone-team01-site-18342\nupload: site/index.html to s3://capstone-team01-site-18342/index.html', flags: [
        { flag: 's3 mb', meaning: 'Make bucket.' },
        { flag: 's3 sync ./site s3://$BUCKET', meaning: 'Upload every file in site/ that is new or changed.' },
      ] },
    ], ['make_bucket'], 'S3 is object storage: a bucket holds files, the name is unique worldwide, and Block Public Access keeps it private. It never becomes public; CloudFront sits in front instead.', {
      ...out('The bucket lists index.html, and Permissions shows Block all public access: On.', doc('Creating a bucket', 'AmazonS3/latest/userguide/create-bucket-overview.html', 'the bucket-naming rules (global, lowercase) and the Block Public Access section — leave every box ticked')),
      fixes: [{ symptom: 'Bucket name already exists', fix: 'Someone in the world has it. Change the digits and try again.' }],
    }),
    portal(s(2, 'dev', 2), 'Put CloudFront in front', 'Create a distribution with Origin Access Control.', 'AWS console — CloudFront → Create distribution', [
      'Create distribution. Origin domain: your bucket (not the website endpoint). Origin access control → Create new OAC.',
      'Viewer protocol: Redirect HTTP to HTTPS. WAF: Do not enable. Default root object: index.html. Create distribution.',
      'The yellow banner → Copy policy → S3 → the bucket → Permissions → Bucket policy → Edit → paste → Save.',
    ], 'The distribution is Enabled and https://d….cloudfront.net shows your page.', 'CloudFront is the content delivery network: edge locations near visitors cache the site and serve it over HTTPS. OAC signs CloudFront’s requests; the bucket policy admits only this distribution.', {
      docs: [doc('Restrict access to an S3 origin', 'AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html', 'the “Create a new OAC” steps and the bucket policy CloudFront hands you to paste into the bucket')],
      fixes: [
        { symptom: 'AccessDenied XML page', fix: 'The bucket policy was not pasted, or the origin is the website endpoint instead of the bucket.' },
        { symptom: 'The page is “NoSuchKey”', fix: 'Default root object is empty, or index.html sits in a folder. It must be at the bucket root.' },
        { symptom: 'WAF was enabled by accident', fix: 'Distribution → Security → Web Application Firewall → Edit → Disable. It bills from the first hour.' },
      ],
    }),
    both(s(2, 'dev', 3), 'Redeploy a change', 'Upload a change and clear the cache.', CONSOLE, [
      'Edit site/index.html; S3 → the bucket → Upload the new file (overwrite).',
      'CloudFront → the distribution → Invalidations → Create invalidation → /* → Create invalidation.',
      'Reload the site after a minute: the change is there.',
    ], [
      { cmd: 'aws s3 sync ./site s3://$BUCKET && DIST=$(aws cloudfront list-distributions --query "DistributionList.Items[0].Id" --output text) && aws cloudfront create-invalidation --distribution-id $DIST --paths "/*" --query Invalidation.Status --output text', explain: 'CloudFront caches; an invalidation tells it to fetch the new files.', sample: 'InProgress', flags: [
        { flag: 'create-invalidation --paths "/*"', meaning: 'Forget every cached copy. 1,000 paths a month are free.' },
      ] },
    ], ['InProgress'], 'Upload plus invalidate is a redeploy. CloudFront keeps a copy of each file at the edge for up to a day, so without the invalidation the old page lingers.',
    out('Invalidations lists one with status Completed, and the site shows your change.', doc('Invalidate files', 'AmazonCloudFront/latest/DeveloperGuide/Invalidation.html', 'the “Invalidating files using the console” steps and the /* path that clears everything'))),
    rec(2, 'dev', 'Website', ['The HTTPS URL.', 'How you redeployed a change.'], 'The CloudFront URL is what the counter page calls in Week 3.'),
  ], { tools: ['AWS console', 'CloudShell', 'A text editor'] }),
  T(2, 'secops', 'Allow SSH from your IP only', 'Add one inbound rule allowing SSH from your own address, then prove it is allowed from you and blocked elsewhere.', 40,
    ['CLF-C02 · Security and Compliance', 'Security groups: stateful, allow-only', 'Defense in depth: one address, one port', 'Allowed and blocked tests'], ['SSH works from your IP', 'SSH is blocked from CloudShell'],
    [doc('Work with security group rules', 'AWSEC2/latest/UserGuide/working-with-security-group-rules.html', 'the “Add rules” steps and the Source field’s “My IP” choice — it fills your /32 for you'),
     doc('Connect to your Linux instance using SSH', 'AWSEC2/latest/UserGuide/connect-linux-inst-ssh.html', 'the ssh command with -i, the ec2-user name, and the “Permission denied” fix for an open .pem')],
    'Free: security group rules. Instance hours count while it runs — stop it when the test is done.', [
    both(s(2, 'secops', 1), 'Add the SSH rule', 'Allow TCP 22 from your IP address only.', CONSOLE, [
      'EC2 → Security groups → sg-tools-team01: Inbound rules is empty; Outbound rules has the default All traffic.',
      'Inbound rules → Edit inbound rules → Add rule.',
      'Type SSH, Source “My IP” (the console fills your /32). Description Allow-SSH-MyIP. Save rules.',
    ], [
      { cmd: 'curl -s https://checkip.amazonaws.com', explain: 'Run this on YOUR laptop, not CloudShell: it prints the address your laptop reaches the internet from.', sample: '203.0.113.25' },
      { cmd: 'MYIP=203.0.113.25   # type the address the first line printed', explain: 'CloudShell is another machine with another address, so tell it yours.', sample: '(no output — the variable is set)' },
      { cmd: 'SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr $MYIP/32 --query "SecurityGroupRules[0].CidrIpv4" --output text', explain: 'A /32 is exactly one address.', sample: '203.0.113.25/32', flags: [
        { flag: 'authorize-security-group-ingress', meaning: 'Add an inbound allow rule.' },
        { flag: '--protocol tcp --port 22', meaning: 'SSH’s port. Nothing else is opened.' },
        { flag: '--cidr $MYIP/32', meaning: 'Only this one address may connect.' },
      ] },
    ], ['/32'], 'Never 0.0.0.0/0 on port 22: bots scan the internet for open SSH within minutes. Security groups have no priorities and no deny: this allow is the whole inbound policy.',
    out('Inbound rules shows one row: SSH, TCP 22, source your address/32, Allow-SSH-MyIP.', doc('Work with security group rules', 'AWSEC2/latest/UserGuide/working-with-security-group-rules.html', 'the “Add rules” steps and the Source field’s “My IP” choice — it fills your /32 for you'))),
    portal(s(2, 'secops', 2), 'Test allowed and blocked', 'Test SSH from your laptop, then from CloudShell.', 'Your laptop, then CloudShell', [
      'Start the instance (Instance state → Start) and read the public IP on Details.',
      'From your laptop, with the shared key, connect (below, by operating system): a prompt appears.',
      'From CloudShell: ssh -i kp-team01.pem ec2-user@PUBLIC_IP times out. Then stop the instance.',
    ], 'SSH connects from your laptop and times out from CloudShell.', 'A rule is only proved when something that should fail does fail. CloudShell has a different address, so the /32 rule refuses it, as it refuses any attacker.', {
      docs: [doc('Connect to your Linux instance using SSH', 'AWSEC2/latest/UserGuide/connect-linux-inst-ssh.html', 'the ssh command with -i, the ec2-user name, and the “Permission denied” fix for an open .pem')],
      paths: [
        { label: 'macOS / Linux', when: 'Terminal', steps: ['chmod 400 kp-team01.pem', 'ssh -i kp-team01.pem ec2-user@PUBLIC_IP'] },
        { label: 'Windows', when: 'PowerShell (OpenSSH is built in)', steps: ['icacls kp-team01.pem /inheritance:r /grant:r "$env:USERNAME:R"', 'ssh -i kp-team01.pem ec2-user@PUBLIC_IP'] },
      ],
      fixes: [
        { symptom: 'Timeout from your laptop too', fix: 'Your IP changed (Wi-Fi, VPN), or the instance is not running. Re-run curl checkip.amazonaws.com and update the rule’s source.' },
        { symptom: 'Permission denied (publickey)', fix: 'Wrong key file or wrong user name. The user is ec2-user on Amazon Linux and the key is kp-team01.pem.' },
        { symptom: 'UNPROTECTED PRIVATE KEY FILE', fix: 'The key is readable by others. Run the chmod / icacls line first.' },
      ],
    }),
    rec(2, 'secops', 'SSH access test', ['One allowed row, one blocked row.'], 'Week 6 removes this rule entirely; this record is the before.'),
  ], { tools: ['AWS console', 'CloudShell', 'Terminal or PowerShell'], prerequisites: ['The tools instance and its private key (kp-team01.pem) from the Infrastructure Admin, this week — shared privately, never in the repo.'] }),

  // ── Week 3 — Serverless, data and identity ─────────────────────────────
  T(3, 'arch', 'Draw the request flow and say who manages each hop', 'Trace how a page view becomes a count in the table, naming every real URL and who manages each service.', 35,
    ['CLF-C02 · Cloud Concepts', 'Serverless: what you do not manage', 'Request flows'], ['The flow names real URLs', 'Each hop says who manages it'],
    [doc('Working with HTTP APIs', 'apigateway/latest/developerguide/http-api.html', 'the invoke-URL shape — https://{api-id}.execute-api.{region}.amazonaws.com — so you can recognise your second hop'),
     doc('Shared responsibility model', 'https://aws.amazon.com/compliance/shared-responsibility-model/', 'the “abstracted services” paragraph: for Lambda and DynamoDB, AWS runs the platform; you own code, data and access')],
    'Free: reading the diagram and writing the flow. Nothing is deployed.', [
    portal(s(3, 'arch', 1), 'Read Architecture v3', 'Open the architecture diagram at week 3.', 'Guide → Architecture & IaC', [
      'Pick Week 3. New resources glow.',
      'Follow the solid arrows from Visitors to DynamoDB.',
      'Click the Lambda function: the template highlights its lines.',
    ], 'You can name every hop from the browser to the table.', 'The diagram is drawn from the template, so it is the environment you are building, not an illustration. A glowing node arrived this week; a grey one was already there.', {
      docs: [doc('Working with HTTP APIs', 'apigateway/latest/developerguide/http-api.html', 'the invoke-URL shape — https://{api-id}.execute-api.{region}.amazonaws.com — so you can recognise your second hop')],
    }),
    portal(s(3, 'arch', 2), 'Write the flow', 'Write the flow with your real URLs and owners.', 'The document', [
      'Browser → https://d….cloudfront.net. Page script → GET …execute-api.us-east-1.amazonaws.com/default/capstone-team01-counter.',
      'Lambda → DynamoDB table capstone-team01-visitors, item id "site". Back: { "count": n }.',
      'For each hop: who runs it (AWS) and what we own (code, data, access).',
    ], 'A three-hop flow with real URLs, resource names and who manages each.', 'Serverless means no server you can see: it scales to zero and you pay per request. A flow with real URLs is testable: each arrow can be called.', {
      docs: [doc('Shared responsibility model', 'https://aws.amazon.com/compliance/shared-responsibility-model/', 'the “abstracted services” paragraph: for Lambda and DynamoDB, AWS runs the platform; you own code, data and access')],
    }),
    rec(3, 'arch', 'Request flow', ['The flow, hop by hop, with who manages each.'], 'Week 6’s path tests follow this flow.'),
  ], { tools: ['The Guide'] }),
  T(3, 'infra', 'Create the DynamoDB table', 'Create an on-demand DynamoDB table and seed the counter item.', 35,
    ['CLF-C02 · Cloud Technology and Services', 'Managed databases: DynamoDB vs RDS', 'On-demand capacity', 'Items and attributes'], ['Table capstone-team01-visitors exists', 'Item id "site" has count 0'],
    [doc('Create a table in DynamoDB', 'amazondynamodb/latest/developerguide/getting-started-step-1.html', 'the console steps: table name, partition key name and type, and Table settings → Customize for capacity mode'),
     doc('On-demand capacity mode', 'amazondynamodb/latest/developerguide/on-demand-capacity-mode.html', 'the first paragraph: you pay per request, with no capacity to plan, so an idle counter costs nothing')],
    'Free: DynamoDB gives 25 GB and 25 read/write units always free; on-demand requests for a counter round to zero.', [
    both(s(3, 'infra', 1), 'Create the table', 'Create an on-demand table keyed on id.', CONSOLE, [
      'DynamoDB → Tables → Create table. Name capstone-team01-visitors, partition key id (String).',
      'Table settings → Customize settings → Capacity mode: On-demand. Tags. Create table.',
      'Wait until Status reads Active.',
    ], [
      { cmd: 'aws dynamodb create-table --table-name capstone-team01-visitors --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --tags Key=project,Value=capstone Key=team,Value=team01 Key=env,Value=dev Key=owner,Value=team01-infra --query TableDescription.TableStatus --output text', explain: 'On-demand bills per request, so an idle counter costs nothing.', sample: 'CREATING', flags: [
        { flag: '--key-schema AttributeName=id,KeyType=HASH', meaning: 'id is the partition key (HASH) — the field DynamoDB uses to place each item.' },
        { flag: '--billing-mode PAY_PER_REQUEST', meaning: 'On-demand: pay per read and write, nothing while idle.' },
      ] },
      { cmd: 'aws dynamodb wait table-exists --table-name capstone-team01-visitors && echo ACTIVE', explain: 'Waits until the table can take writes.', sample: 'ACTIVE' },
    ], ['ACTIVE'], 'DynamoDB is a managed NoSQL key-value database: no server, no schema beyond the key, AWS runs and scales it. RDS is the managed relational choice for tables with joins.',
    out('Tables lists capstone-team01-visitors with status Active and capacity mode On-demand.', doc('Create a table in DynamoDB', 'amazondynamodb/latest/developerguide/getting-started-step-1.html', 'the console steps: table name, partition key name and type, and Table settings → Customize for capacity mode'))),
    both(s(3, 'infra', 2), 'Seed the counter', 'Put the item { id: site, count: 0 }.', CONSOLE, [
      'Open the table → Explore table items → Create item.',
      'id: site. Add new attribute → Number → name count, value 0. Create item.',
    ], [
      { cmd: 'aws dynamodb put-item --table-name capstone-team01-visitors --item \'{"id":{"S":"site"},"count":{"N":"0"}}\' && aws dynamodb get-item --table-name capstone-team01-visitors --key \'{"id":{"S":"site"}}\' --output text', explain: 'DynamoDB types every value: S for string, N for number.', sample: 'COUNT\t0\nID\tsite' },
    ], ['site'], 'The Lambda adds one to this one item. Seeding is optional in DynamoDB (ADD creates a missing item), but seeing the item now makes the first request clearer.',
    out('Explore table items lists one item: id site, count 0.', doc('Write data to a table', 'amazondynamodb/latest/developerguide/getting-started-step-2.html', 'the console steps: Create item, the id value, then Add new attribute → Number'))),
    rec(3, 'infra', 'Data store', ['Table name, partition key, the seed item.'], 'The API spec’s data model.'),
  ], { tools: ['AWS console', 'CloudShell'] }),
  T(3, 'dev', 'Build the counter Lambda and API', 'Create a Lambda that atomically adds one to the counter, put an HTTP API in front, and show the count on the site.', 50,
    ['CLF-C02 · Cloud Technology and Services', 'Lambda: serverless compute', 'API Gateway', 'An execution role instead of a key'], ['The API returns a count', 'The site shows it'],
    [doc('Create your first Lambda function', 'lambda/latest/dg/getting-started.html', 'the “Author from scratch” form and the Test tab — the console editor deploys with one button'),
     doc('Lambda execution role', 'lambda/latest/dg/lambda-intro-execution-role.html', 'the first paragraph: the function assumes the role at run time, so no key is stored in it'),
     doc('Using Lambda with API Gateway', 'lambda/latest/dg/services-apigateway.html', 'the “Add trigger” route for an HTTP API — it creates the API, the route and the permission together')],
    'Free: Lambda 1 million requests a month always free; API Gateway HTTP API 1 million calls a month for 12 months.', [
    both(s(3, 'dev', 1), 'Create the function', 'Create a Python Lambda that adds one to the count.', CONSOLE, [
      'Lambda → Create function → Author from scratch: capstone-team01-counter, Python 3.12, new role with basic permissions. Create.',
      'Code tab: replace lambda_function.py with the code below. Deploy. Configuration → Environment variables → TABLE_NAME = capstone-team01-visitors.',
      'Test → Create new event (any name) → Test: an AccessDenied error, expected until the next step.',
    ], [
      { cmd: `import json, os, boto3
table = boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])

def lambda_handler(event, context):
    r = table.update_item(
        Key={"id": "site"},
        UpdateExpression="ADD #c :one",
        ExpressionAttributeNames={"#c": "count"},
        ExpressionAttributeValues={":one": 1},
        ReturnValues="UPDATED_NEW",
    )
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"count": int(r["Attributes"]["count"])}),
    }`, explain: 'Paste over lambda_function.py. One update_item adds one to the item “site” and returns the new number as JSON. The same code sits in the Week 9 template.', sample: '{"statusCode": 200, "body": "{\\"count\\": 1}"}' },
    ], ['count'], 'Lambda is serverless compute: AWS runs the servers, your code runs when called, and you pay per request. ADD is atomic, so two visitors at once both count.', {
      ...out('Deploy reports “Successfully updated”; Test returns an AccessDeniedException for dynamodb:UpdateItem.', doc('Create your first Lambda function', 'lambda/latest/dg/getting-started.html', 'the “Author from scratch” form and the Test tab — the console editor deploys with one button')),
      codeToPaste: true,
      fixes: [
        { symptom: 'KeyError: TABLE_NAME', fix: 'The environment variable is missing or misspelt. Configuration → Environment variables.' },
        { symptom: 'Runtime.ImportModuleError', fix: 'The file is not named lambda_function.py, or the handler setting is not lambda_function.lambda_handler.' },
      ],
    }),
    both(s(3, 'dev', 2), 'Let it write the table, add the API', 'Grant the table, then add an HTTP API trigger.', CONSOLE, [
      'Configuration → Permissions → the role → Add permissions → Create inline policy → JSON: paste below; name count-visitors.',
      'Back in Lambda, Test again: {"count": 1}.',
      'Function overview → Add trigger → API Gateway → new HTTP API, Security Open. Copy the API endpoint.',
    ], [
      { cmd: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "dynamodb:UpdateItem",
    "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/capstone-team01-visitors"
  }]
}`, explain: 'The inline policy: one action on one table. Replace 123456789012 with your account id (top-right menu).', sample: '(the policy count-visitors is listed under the role)' },
      { cmd: 'ROLE=$(aws lambda get-function-configuration --function-name capstone-team01-counter --query Role --output text | cut -d/ -f2); ACCT=$(aws sts get-caller-identity --query Account --output text); aws iam put-role-policy --role-name $ROLE --policy-name count-visitors --policy-document "{\\"Version\\":\\"2012-10-17\\",\\"Statement\\":[{\\"Effect\\":\\"Allow\\",\\"Action\\":\\"dynamodb:UpdateItem\\",\\"Resource\\":\\"arn:aws:dynamodb:us-east-1:$ACCT:table/capstone-team01-visitors\\"}]}" && echo granted', explain: 'The same grant from the shell: finds the function’s role and attaches the one-table policy. Add the API trigger in the console.', sample: 'granted' },
    ], ['granted'], 'A role is an identity the function assumes; its policy allows one action on one table, so a bug cannot touch more. API Gateway gives the function its URL.', {
      ...out('Test returns {"count": 1}, and Triggers shows an API Gateway endpoint URL.', doc('Lambda execution role', 'lambda/latest/dg/lambda-intro-execution-role.html', 'the first paragraph: the function assumes the role at run time, so no key is stored in it')),
      codeToPaste: true,
      fixes: [{ symptom: 'AccessDeniedException still, after the policy', fix: 'The table ARN has a typo (region, account id or table name). Compare it with the table’s Overview → ARN.' }],
    }),
    both(s(3, 'dev', 3), 'Call it and show it', 'Call the API, then add the count to the page.', CONSOLE, [
      'Open the API endpoint in a browser tab: {"count": 2}. Reload: 3.',
      'Add the snippet below to index.html; API Gateway → CORS → Allow-Origin = your CloudFront URL, GET. Save.',
      'Upload the file to the bucket and invalidate /* (Week 2). Reload the site.',
    ], [
      { cmd: 'API=https://abc123.execute-api.us-east-1.amazonaws.com/default/capstone-team01-counter; curl -s $API', explain: 'Each call adds one. Replace the URL with your endpoint.', sample: '{"count": 2}' },
      { cmd: `<p>Visitors: <span id="visitor-count">…</span></p>
<script>
  fetch('https://abc123.execute-api.us-east-1.amazonaws.com/default/capstone-team01-counter')
    .then((r) => r.json())
    .then((d) => { document.getElementById('visitor-count').textContent = d.count; });
</script>`, explain: 'Paste into index.html before </body>, with your own URL. The browser calls the API and writes the answer into the page.', sample: '(the page shows: Visitors: 3)' },
    ], ['count'], 'The page calls the API from the visitor’s browser; there is no server. The browser only reads the answer because the API lists the site as an allowed origin.', {
      ...out('The site shows “Visitors: 3” and the number grows on every reload.', doc('Configuring CORS for an HTTP API', 'apigateway/latest/developerguide/http-api-cors.html', 'the console section: Access-Control-Allow-Origin takes the site’s origin exactly, with no trailing slash')),
      codeToPaste: true,
      fixes: [{ symptom: 'The page shows “…” for ever', fix: 'Open DevTools → Console. “blocked by CORS policy” means the origin is missing or has a trailing slash; a 404 means the URL is wrong.' }],
    }),
    rec(3, 'dev', 'Endpoints', ['GET, the path, what it returns, its status codes.'], 'The spec another developer would call your API from.'),
  ], { tools: ['AWS console', 'CloudShell', 'A text editor', 'Browser DevTools'], prerequisites: ['The DynamoDB table capstone-team01-visitors from the Infrastructure Admin, this week.', 'Your own site from Week 2.'] }),
  T(3, 'secops', 'Give the team the right access', 'Create the team’s IAM user group, add the teammates, attach ReadOnlyAccess, confirm MFA, and confirm no key is in the page.', 45,
    ['CLF-C02 · Security and Compliance', 'IAM users, groups and managed policies', 'Least privilege: ReadOnlyAccess for looking', 'MFA for every member'], ['The group holds ReadOnlyAccess', 'All four are members with MFA', 'No key in the page'],
    [doc('Creating IAM user groups', 'IAM/latest/UserGuide/id_groups_create.html', 'the “Attach permissions policies” step — search ReadOnlyAccess, tick exactly that one'),
     doc('ReadOnlyAccess managed policy', 'aws-managed-policy/latest/reference/ReadOnlyAccess.html', 'the policy’s length, and that every action starts with Describe, Get or List: that is read only'),
     doc('Getting credential reports', 'IAM/latest/UserGuide/id_credentials_getting-report.html', 'the “Download report” button and the mfa_active column — one line per user, your MFA check')],
    'Free: IAM groups, managed policies, MFA and the credential report cost nothing.', [
    both(s(3, 'secops', 1), 'Create the group and add the team', 'Create the read-only group with your four teammates.', CONSOLE, [
      'IAM → User groups → Create group: capstone-team01-readonly.',
      'Attach permissions policies: search ReadOnlyAccess, tick it. Create group.',
      'The group → Users → Add users → your four teammates. Add.',
    ], [
      { cmd: 'aws iam create-group --group-name capstone-team01-readonly --query Group.Arn --output text && aws iam attach-group-policy --group-name capstone-team01-readonly --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess && aws iam add-user-to-group --group-name capstone-team01-readonly --user-name team01-secops && echo added', explain: 'Creates the group, attaches the AWS-managed policy, adds you; add the others the same way.', sample: 'arn:aws:iam::123456789012:group/capstone-team01-readonly\nadded' },
    ], ['capstone-team01-readonly'], 'Grant to groups, not people: joining and leaving becomes one membership change. ReadOnlyAccess is an AWS-managed policy: every action in it is Describe, Get or List.',
    out('User groups lists capstone-team01-readonly with ReadOnlyAccess and four users.', doc('Creating IAM user groups', 'IAM/latest/UserGuide/id_groups_create.html', 'the “Attach permissions policies” step — search ReadOnlyAccess, tick exactly that one'))),
    both(s(3, 'secops', 2), 'Prove it can look and not touch', 'Sign in as a member and try to stop the instance.', CONSOLE, [
      'Sign in as a teammate who is in the group only: EC2 → Instances is readable.',
      'Select ec2-tools-team01 → Instance state → Stop instance: “You are not authorized to perform this operation”. Screenshot it.',
    ], [
      { cmd: 'ARN=$(aws iam get-group --group-name capstone-team01-readonly --query Group.Arn --output text); aws iam simulate-principal-policy --policy-source-arn $ARN --action-names ec2:StopInstances ec2:DescribeInstances --query "EvaluationResults[].[EvalActionName, EvalDecision]" --output text', explain: 'The policy simulator evaluates the real policies without calling anything.', sample: 'ec2:StopInstances\timplicitDeny\nec2:DescribeInstances\tallowed' },
    ], ['implicitDeny'], 'Least privilege is proved by a denial: one allowed and one denied action show the policy does what the document says. In IAM the default answer is no.',
    out('The console shows “You are not authorized to perform this operation” and the instance keeps running.', doc('ReadOnlyAccess managed policy', 'aws-managed-policy/latest/reference/ReadOnlyAccess.html', 'the policy’s length, and that every action starts with Describe, Get or List: that is read only'))),
    portal(s(3, 'secops', 3), 'Confirm MFA and no key', 'Check MFA on each member and no key in the page.', 'IAM → Credential report, then the browser', [
      'IAM → Credential report → Download report: mfa_active TRUE for every teammate; access_key_1_active FALSE for root.',
      'View the site source (Ctrl+U): only the API URL, no key. Lambda → Environment variables: only TABLE_NAME.',
    ], 'Four members with MFA; the page holds a URL and nothing else.', 'MFA per user and least privilege per group are the two identity controls CLF-C02 tests. Anything in page source is public; the function needs no key at all.', {
      docs: [doc('Getting credential reports', 'IAM/latest/UserGuide/id_credentials_getting-report.html', 'the “Download report” button and the mfa_active column — one line per user, your MFA check')],
      fixes: [{ symptom: 'mfa_active is FALSE for a teammate', fix: 'They skipped Week 1’s MFA step. Security credentials → Assign MFA device.' }],
    }),
    rec(3, 'secops', 'Identity and access', ['The group, its members, the policy, MFA, where access comes from.'], 'The first lines of the access matrix and the secrets register.'),
  ], { tools: ['AWS console', 'CloudShell'], prerequisites: ['The Lambda function and the site from App & DevOps, this week — for the no-key check.'] }),

  // ── Week 4 — Monitor, govern, pay ──────────────────────────────────────
  T(4, 'arch', 'Report the cost, and read Trusted Advisor and the support plans', 'Read what the environment has cost by service and by Free Tier offer, then Trusted Advisor’s checks and the support-plan table.', 35,
    ['CLF-C02 · Billing, Pricing and Support', 'Cost Explorer and the Free Tier page', 'Trusted Advisor', 'Support plans'], ['Spend and largest cost reported', 'One Trusted Advisor check owned', 'The support plan noted'],
    [doc('Exploring your data using Cost Explorer', 'cost-management/latest/userguide/ce-exploring-data.html', 'the “Group by” control and the Service dimension; the table under the chart is what you copy'),
     doc('AWS Trusted Advisor', 'awssupport/latest/user/trusted-advisor.html', 'the checks on Basic support: the free security ones are MFA on root, open ports, S3 permissions'),
     doc('Compare AWS Support plans', 'https://aws.amazon.com/premiumsupport/plans/', 'the four columns — Basic, Developer, Business, Enterprise — and the response-time rows; that is the exam question')],
    'Free: the Cost Explorer console, the Free Tier page and Trusted Advisor’s basic checks. The Cost Explorer API costs $0.01 a call: use the console.', [
    both(s(4, 'arch', 1), 'Read the cost', 'Group this month’s cost by service and by offer.', CONSOLE, [
      'Billing → Cost Explorer. Month to date, Group by Service. Read the table under the chart.',
      'Billing → Free Tier: usage per offer (EC2 hours, S3 GB). Budgets → capstone-team01: how much is used.',
      'Compare with your Week 2 estimate.',
    ], [
      { cmd: 'aws ce get-cost-and-usage --time-period Start=$(date +%Y-%m-01),End=$(date -d tomorrow +%F) --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE --query "ResultsByTime[0].Groups[].[Keys[0], Metrics.UnblendedCost.Amount]" --output text', explain: 'Cost Explorer by service for the month so far. Each call costs $0.01; the console view is free.', sample: 'Amazon Elastic Compute Cloud - Compute\t0.31\nAmazon Simple Storage Service\t0.01' },
    ], ['Amazon'], 'Actual cost shows what you forgot to switch off: if EC2 is not near zero, the instance was left running. Cost data arrives a day late.', {
      ...out('A table of services and their month-to-date cost, with EC2 the largest line.', doc('Exploring your data using Cost Explorer', 'cost-management/latest/userguide/ce-exploring-data.html', 'the “Group by” control and the Service dimension; the table under the chart is what you copy')),
      fixes: [
        { symptom: 'Cost Explorer is empty or “being prepared”', fix: 'It was enabled less than 24 hours ago. Come back tomorrow and record the date you read it; free-tier usage shows as $0.' },
        { symptom: 'Free Tier page shows 80% of EC2 hours used', fix: 'The instance ran while nobody used it. Stop it now; the alert email is the Free Tier usage alert doing its job.' },
      ],
    }),
    portal(s(4, 'arch', 2), 'Read Trusted Advisor and the support plans', 'Own one check; note your support plan.', 'AWS console — Trusted Advisor, then Support Center', [
      'Trusted Advisor → Security: MFA on root, open ports, S3 permissions. Pick one check; name its owner.',
      'Support Center → your plan (Basic). Read the plans table: what Developer and Business add, response times.',
    ], 'One Trusted Advisor check with an owner, and the support plan noted.', 'Trusted Advisor is AWS looking at what you built and saying how to spend less or be safer; the support plan is what you pay to get a human.', {
      docs: [doc('AWS Trusted Advisor', 'awssupport/latest/user/trusted-advisor.html', 'the checks on Basic support: the free security ones are MFA on root, open ports, S3 permissions'),
             doc('Compare AWS Support plans', 'https://aws.amazon.com/premiumsupport/plans/', 'the four columns — Basic, Developer, Business, Enterprise — and the response-time rows; that is the exam question')],
    }),
    rec(4, 'arch', 'Cost this week', ['Spend to date, and the largest cost with its reason.', 'The Trusted Advisor check and its owner; the support plan.'], 'Week 11 turns this into the cost report.'),
  ], { tools: ['AWS console', 'CloudShell'] }),
  T(4, 'infra', 'Alarm on Lambda errors', 'Create an SNS topic and a CloudWatch alarm that emails when the function errors.', 40,
    ['CLF-C02 · Cloud Technology and Services', 'CloudWatch metrics and alarms', 'SNS topics and subscriptions', 'Why errors, not CPU'], ['The alarm exists and emails the team'],
    [doc('Create a CloudWatch alarm based on a static threshold', 'AmazonCloudWatch/latest/monitoring/ConsoleAlarms.html', 'the “Select metric” step and “Treat missing data as”: good, or an idle function looks broken'),
     doc('Email notifications with Amazon SNS', 'sns/latest/dg/sns-email-notifications.html', 'the “Confirm subscription” paragraph: nothing is delivered until someone clicks the link in the first email')],
    'Free: 10 CloudWatch alarms and 1,000 SNS email deliveries a month, always free.', [
    both(s(4, 'infra', 1), 'Create the topic', 'Create an SNS topic that emails the team.', CONSOLE, [
      'SNS → Topics → Create topic → Standard, name capstone-team01-alerts. Tags. Create topic.',
      'Create subscription → Protocol Email → Endpoint: the team address → Create subscription.',
      'Open the inbox and click “Confirm subscription” in the AWS email. Status: Confirmed.',
    ], [
      { cmd: 'TOPIC=$(aws sns create-topic --name capstone-team01-alerts --tags Key=project,Value=capstone Key=team,Value=team01 Key=owner,Value=team01-infra --query TopicArn --output text); aws sns subscribe --topic-arn $TOPIC --protocol email --notification-endpoint team01-alerts@school.edu --query SubscriptionArn --output text', explain: 'Confirm the subscription from the email AWS sends, or nothing is delivered.', sample: 'pending confirmation' },
    ], ['pending confirmation'], 'SNS separates “what happened” from “who gets told”: alarms publish to the topic, subscribers receive. One topic, many alarms. An unconfirmed subscription is the commonest reason an alarm is silent.',
    out('Subscriptions lists the team email with status Confirmed.', doc('Email notifications with Amazon SNS', 'sns/latest/dg/sns-email-notifications.html', 'the “Confirm subscription” paragraph: nothing is delivered until someone clicks the link in the first email'))),
    both(s(4, 'infra', 2), 'Create the alarm', 'Alarm when Errors is above zero in five minutes.', CONSOLE, [
      'CloudWatch → Alarms → Create alarm → Select metric → Lambda → By Function Name → capstone-team01-counter Errors.',
      'Statistic Sum, Period 5 minutes; Static, Greater than 0; Treat missing data as good (not breaching).',
      'Notification: In alarm → existing SNS topic capstone-team01-alerts. Name capstone-team01-counter-errors. Create alarm.',
    ], [
      { cmd: 'aws cloudwatch put-metric-alarm --alarm-name capstone-team01-counter-errors --namespace AWS/Lambda --metric-name Errors --dimensions Name=FunctionName,Value=capstone-team01-counter --statistic Sum --period 300 --evaluation-periods 1 --threshold 0 --comparison-operator GreaterThanThreshold --treat-missing-data notBreaching --alarm-actions $TOPIC && aws cloudwatch describe-alarms --alarm-names capstone-team01-counter-errors --query "MetricAlarms[0].StateValue" --output text', explain: 'Any error in five minutes fires it. Missing data (no traffic) is treated as fine.', sample: 'OK' },
    ], ['OK'], 'CloudWatch collects metrics from every service; an alarm watches one metric against a threshold and publishes to SNS. Errors are the signal users feel; CPU says nothing about a function.', {
      ...out('Alarms lists capstone-team01-counter-errors in state OK, with the SNS topic as its action.', doc('Create a CloudWatch alarm based on a static threshold', 'AmazonCloudWatch/latest/monitoring/ConsoleAlarms.html', 'the “Select metric” step and “Treat missing data as”: good, or an idle function looks broken')),
      fixes: [{ symptom: 'No email during the drill', fix: 'The subscription is still Pending confirmation, or the alarm names the wrong function. Alarms take up to ten minutes the first time.' }],
    }),
    rec(4, 'infra', 'Signals', ['The signal, where it is measured, the threshold, the action.'], 'The monitoring half of the incident report.'),
  ], { tools: ['AWS console', 'CloudShell'], prerequisites: ['The Lambda function capstone-team01-counter from App & DevOps (Week 3).'] }),
  T(4, 'dev', 'Find a failure in CloudWatch Logs', 'Break the function on purpose, find the error in CloudWatch Logs, and restore it.', 45,
    ['CLF-C02 · Cloud Technology and Services', 'CloudWatch Logs', 'Reading a stack trace'], ['The error is found', 'The API works again'],
    [doc('Using CloudWatch Logs with Lambda', 'lambda/latest/dg/monitoring-cloudwatchlogs.html', 'the log-group name pattern /aws/lambda/<function> and the Monitor tab’s “View CloudWatch logs” button'),
     doc('Lambda environment variables', 'lambda/latest/dg/configuration-envvars.html', 'the console steps under “Configure environment variables” — the Edit button is on the Configuration tab')],
    'Free: CloudWatch Logs 5 GB of ingestion a month; a few hundred errors are kilobytes.', [
    both(s(4, 'dev', 1), 'Break it', 'Point the function at a table that does not exist.', CONSOLE, [
      'Lambda → capstone-team01-counter → Configuration → Environment variables → Edit.',
      'TABLE_NAME = capstone-team01-missing. Save. Note the time.',
      'Load the site twice: the counter shows “…” and never fills.',
    ], [
      { cmd: 'aws lambda update-function-configuration --function-name capstone-team01-counter --environment "Variables={TABLE_NAME=capstone-team01-missing}" --query LastUpdateStatus --output text', explain: 'The API now returns 500. Load the site twice to generate errors.', sample: 'InProgress' },
    ], ['InProgress'], 'Breaking it yourself means you know the answer. The code asks for a missing table, so every request ends in a 500. The alarm should email within five minutes.',
    out('The site’s counter stays at “…”; the API endpoint returns Internal Server Error.', doc('Lambda environment variables', 'lambda/latest/dg/configuration-envvars.html', 'the console steps under “Configure environment variables” — the Edit button is on the Configuration tab'))),
    both(s(4, 'dev', 2), 'Find it', 'Read the latest errors from the log group.', CONSOLE, [
      'Lambda → the function → Monitor → View CloudWatch logs → the newest log stream.',
      'Filter events: ERROR. Read the exception name and the line under it.',
    ], [
      { cmd: 'aws logs filter-log-events --log-group-name /aws/lambda/capstone-team01-counter --filter-pattern ERROR --max-items 2 --query "events[].message" --output text', explain: 'Every Lambda writes to a log group named after it.', sample: '[ERROR] ResourceNotFoundException: Requested resource not found' },
    ], ['ResourceNotFoundException'], 'CloudWatch Logs holds every line the function prints, in a log group named after it. Read a stack trace bottom up: the last line says what failed.', {
      ...out('The newest log stream shows [ERROR] ResourceNotFoundException: Requested resource not found.', doc('Using CloudWatch Logs with Lambda', 'lambda/latest/dg/monitoring-cloudwatchlogs.html', 'the log-group name pattern /aws/lambda/<function> and the Monitor tab’s “View CloudWatch logs” button')),
      fixes: [{ symptom: 'No log stream yet', fix: 'Logs arrive a minute after the call. Reload the site again and refresh the stream list.' }],
    }),
    both(s(4, 'dev', 3), 'Restore it', 'Put the right table name back and retest.', CONSOLE, [
      'Configuration → Environment variables → Edit: TABLE_NAME = capstone-team01-visitors. Save.',
      'Open the API endpoint in a browser tab: a count, not an error. Note the time.',
    ], [
      { cmd: 'aws lambda update-function-configuration --function-name capstone-team01-counter --environment "Variables={TABLE_NAME=capstone-team01-visitors}" -o none; sleep 5; curl -s $API', explain: 'Set $API to your endpoint. A count means it is fixed.', sample: '{"count": 12}' },
    ], ['count'], 'A fix is not done until the retest passes. Tell the Security Admin the times: broke at, alarmed at, found at, fixed at. The alarm returns to OK by itself.',
    out('The API endpoint returns a count again, and the alarm goes back to OK.', doc('Lambda environment variables', 'lambda/latest/dg/configuration-envvars.html', 'the console steps under “Configure environment variables” — the value must match the real table name exactly'))),
    rec(4, 'dev', 'Signals', ['Add a signal row for errors in CloudWatch Logs.'], 'Your half of the monitoring table.'),
  ], { tools: ['AWS console', 'CloudShell', 'Browser DevTools'] }),
  T(4, 'secops', 'Find who changed it in CloudTrail and write the incident record', 'Find this week’s drill in CloudTrail event history — who changed what, when — then write it up as an incident.', 40,
    ['CLF-C02 · Security and Compliance', 'CloudTrail event history', 'An incident record: symptom, evidence, cause, fix'], ['The change is found in CloudTrail with its user and time', 'The incident record is complete'],
    [doc('Viewing CloudTrail events', 'awscloudtrail/latest/userguide/view-cloudtrail-events.html', 'the Event history page and its lookup attributes — Event name is the one you filter on'),
     doc('Using CloudWatch alarms', 'AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html', 'the alarm History tab: the state change and its time — your incident’s “alarmed at”')],
    'Free: 90 days of CloudTrail event history and the alarm history cost nothing.', [
    both(s(4, 'secops', 1), 'Find the change', 'Find who changed the function’s variable, and when.', CONSOLE, [
      'CloudTrail → Event history. Lookup attribute: Event name = UpdateFunctionConfiguration20150331v2.',
      'Read the two rows: Event time, User name, Resource. Screenshot them for Evidence.',
    ], [
      { cmd: 'aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=UpdateFunctionConfiguration20150331v2 --max-results 2 --query "Events[].[EventTime, Username]" --output text', explain: 'Every console click and API call is recorded with who made it. Allow a few minutes for the newest event to appear.', sample: '2026-10-08T14:07:02+00:00\tteam01-dev\n2026-10-08T14:02:11+00:00\tteam01-dev' },
    ], ['team01'], 'CloudTrail is the audit log: who did what, when, from where, the first question of every incident and compliance review. Event history keeps 90 days free.',
    out('Event history shows two UpdateFunctionConfiguration rows with user team01-dev and their times.', doc('Viewing CloudTrail events', 'awscloudtrail/latest/userguide/view-cloudtrail-events.html', 'the Event history page and its lookup attributes — Event name is the one you filter on'))),
    both(s(4, 'secops', 2), 'Read the alarm history', 'Read when the alarm fired and when it recovered.', CONSOLE, [
      'CloudWatch → Alarms → capstone-team01-counter-errors → History: “Alarm updated from OK to In alarm” and back, with times.',
    ], [
      { cmd: 'aws cloudwatch describe-alarm-history --alarm-name capstone-team01-counter-errors --history-item-type StateUpdate --max-items 2 --query "AlarmHistoryItems[].[Timestamp, HistorySummary]" --output text', explain: 'The state changes, newest first.', sample: '2026-10-08T14:11:30+00:00\tAlarm updated from ALARM to OK\n2026-10-08T14:06:30+00:00\tAlarm updated from OK to ALARM' },
    ], ['ALARM'], 'The alarm’s times against CloudTrail’s show whether monitoring or a user told you first; the alarm should win. Minutes from change to alarm is how a monitoring design is judged.',
    out('History shows “Alarm updated from OK to In alarm” and back to OK, with times.', doc('Using CloudWatch alarms', 'AmazonCloudWatch/latest/monitoring/AlarmThatSendsEmail.html', 'the alarm History tab: the state change and its time — your incident’s “alarmed at”'))),
    portal(s(4, 'secops', 3), 'Write the incident record', 'Record this week’s drill: symptom, evidence, cause, fix.', 'The document', [
      'Symptom: the counter showed “…”. Evidence: the CloudTrail rows, the alarm history, the alert email.',
      'Cause: TABLE_NAME was changed to a table that does not exist. Fix: changed back, retested.',
      'Times: changed at, alarmed at, found at, fixed at. Prevention: Week 10 makes settings code.',
    ], 'An incident record with symptom, evidence, cause, fix and the four times.', 'An incident record is how a team learns: what users saw, how you knew, the cause, the fix. CloudTrail turns “someone changed something” into a name and a time.', {
      docs: [doc('Viewing CloudTrail events', 'awscloudtrail/latest/userguide/view-cloudtrail-events.html', 'the Event history page: the User name and Event time columns are the incident’s who and when')],
    }),
    rec(4, 'secops', 'Incident record', ['Symptom, evidence, root cause, fix; who made the change.'], 'Week 12 runs this loop again under time pressure.'),
  ], { tools: ['AWS console', 'CloudShell'], prerequisites: ['The break-and-fix times from App & DevOps, this week.'] }),

  // ── Week 5 — Secure by design ──────────────────────────────────────────
  T(5, 'arch', 'Write the access matrix and the security design', 'List every principal with its scope and justification, then decide the layers a request crosses and what each one refuses.', 40,
    ['SAA-C03 · Design Secure Architectures', 'Least privilege', 'Defence in depth', 'Managed and inline policies'], ['Three or more justified grants', 'The layers are named with what each refuses'],
    [doc('Policies and permissions in IAM', 'IAM/latest/UserGuide/access_policies.html', 'the “Identity-based policies” section and the difference between managed and inline — your matrix has a column for each'),
     doc('Security pillar — Well-Architected', 'wellarchitected/latest/security-pillar/welcome.html', 'the “Design principles” list: apply security at all layers, and keep people away from data')],
    'Free: IAM, its reports and the Well-Architected guidance cost nothing.', [
    both(s(5, 'arch', 1), 'Export the grants', 'List users and groups with their policies.', CONSOLE, [
      'IAM → Users: open each user → Permissions tab; note attached policies and group memberships.',
      'IAM → User groups: each group’s Permissions tab.',
      'IAM → Credential report → Download report.',
    ], [
      { cmd: 'aws iam get-account-authorization-details --filter User Group --query "{users: UserDetailList[].[UserName, AttachedManagedPolicies[].PolicyName], groups: GroupDetailList[].[GroupName, AttachedManagedPolicies[].PolicyName]}" --output json', explain: 'Every user and group, with the managed policies attached to each.', sample: '{ "users": [ [ "team01-infra", [ "PowerUserAccess" ] ] ],\n  "groups": [] }' },
    ], ['users'], 'A policy attached to a user is the one people forget to review.'),
    portal(s(5, 'arch', 2), 'Name the layers', 'Write one line per layer a request crosses.', 'Deliverables tab · Access matrix', [
      'Edge (CloudFront, ALB group), network (subnets, security groups), identity (roles, policies), application (CORS), data (encryption, one-table policies).',
      'For each layer write what it refuses and which role owns the rule.',
    ], 'Five layers, each with a refusal and an owner.', 'The exam asks which layer stops a given request; the matrix is where the team agrees on it before anything is built.'),
    rec(5, 'arch', 'Access matrix', ['One row per grant: principal, policy, scope, why.', 'Mark any grant broader than it needs to be.', 'The layers, each with what it refuses.'], 'Week 11’s posture review reads this matrix.'),
  ]),
  T(5, 'infra', 'Put the table name in Parameter Store and a secret under a customer key', 'Store the table name as a parameter, create a customer-managed KMS key, store one SecureString under it, and let the counter role read exactly those.', 45,
    ['SAA-C03 · Design Secure Architectures', 'Systems Manager Parameter Store', 'AWS KMS customer-managed keys', 'A policy scoped to one parameter'], ['The parameter exists', 'A SecureString is encrypted with the team key', 'The role may read those parameters only'],
    [doc('Parameter Store', 'systems-manager/latest/userguide/systems-manager-parameter-store.html', 'the “What is Parameter Store” paragraph: String for configuration, SecureString for secrets, and that standard parameters are free'),
     doc('Customer managed keys', 'kms/latest/developerguide/concepts.html#customer-cmk', 'the difference between AWS managed and customer managed keys — who controls the key policy and the rotation')],
    'KMS: one customer-managed key is $1 a month, prorated by the hour; schedule its deletion at the end of the course. Parameters and their reads cost nothing.', [
    both(s(5, 'infra', 1), 'Create the parameter', 'Store the table name at /capstone/team01/visitor/table.', CONSOLE, [
      'Systems Manager → Parameter Store → Create parameter. Name /capstone/team01/visitor/table, tier Standard, type String, value capstone-team01-visitors. Tags. Create.',
    ], [
      { cmd: 'aws ssm put-parameter --name /capstone/team01/visitor/table --type String --value capstone-team01-visitors --tags Key=project,Value=capstone Key=team,Value=team01 --query Version --output text', explain: 'A String parameter for configuration. A password would be a SecureString.', sample: '1' },
    ], ['1'], 'Configuration belongs in one place that code reads at start-up, not in code and not in a page. Parameter Store is that place on AWS; the Week 9 template creates this same parameter, so hand and code agree.'),
    both(s(5, 'infra', 2), 'Create the team key and a secret under it', 'Make a KMS key, then store one SecureString with it.', CONSOLE, [
      'KMS → Customer managed keys → Create key: symmetric, encrypt and decrypt, alias alias/capstone-team01. Key administrators: your builders group. Finish.',
      'Parameter Store → Create parameter /capstone/team01/db/password, type SecureString, KMS key alias/capstone-team01, any value. Create.',
    ], [
      { cmd: 'KEY=$(aws kms create-key --description "capstone team01" --tags TagKey=project,TagValue=capstone --query KeyMetadata.KeyId --output text); aws kms create-alias --alias-name alias/capstone-team01 --target-key-id $KEY; aws ssm put-parameter --name /capstone/team01/db/password --type SecureString --key-id alias/capstone-team01 --value "Rotate-Me-$(date +%s)" --query Version --output text', explain: 'A key the team controls, an alias to name it by, and a secret encrypted under it.', sample: '1' },
    ], ['1'], 'An AWS managed key works, but the exam and an auditor both ask who controls the key: a customer-managed key has a policy you can read, rotate and revoke.'),
    both(s(5, 'infra', 3), 'Let the role read them, and read them back', 'Grant GetParameter on the two names; read both.', CONSOLE, [
      'IAM → Roles → the counter role → Add permissions → Create inline policy → JSON.',
      'Allow ssm:GetParameter on the two parameter ARNs and kms:Decrypt on the team key; name it read-params.',
      'Parameter Store → the parameter → the value is shown. That is what the code would read.',
    ], [
      { cmd: 'ROLE=$(aws lambda get-function-configuration --function-name capstone-team01-counter --query Role --output text | cut -d/ -f2); ACCT=$(aws sts get-caller-identity --query Account --output text); aws iam put-role-policy --role-name $ROLE --policy-name read-params --policy-document "{\\"Version\\":\\"2012-10-17\\",\\"Statement\\":[{\\"Effect\\":\\"Allow\\",\\"Action\\":\\"ssm:GetParameter\\",\\"Resource\\":\\"arn:aws:ssm:us-east-1:$ACCT:parameter/capstone/team01/*\\"},{\\"Effect\\":\\"Allow\\",\\"Action\\":\\"kms:Decrypt\\",\\"Resource\\":\\"arn:aws:kms:us-east-1:$ACCT:key/$KEY\\"}]}" && aws ssm get-parameter --name /capstone/team01/visitor/table --query Parameter.Value --output text && aws ssm get-parameter --name /capstone/team01/db/password --with-decryption --query Parameter.Type --output text', explain: 'Read on one path, decrypt with one key, then a read of each to prove it.', sample: 'capstone-team01-visitors\nSecureString' },
    ], ['capstone-team01-visitors', 'SecureString'], 'The same least-privilege shape as the table policy: one path, one key. A role that can read every parameter would also read the ones that hold secrets.'),
    rec(5, 'infra', 'Secrets register', ['The parameter and the SecureString: type, key, who may read them (the counter role).'], 'The register shows where every credential and setting lives, and under which key.'),
  ], { prerequisites: ['The counter function and its role from App & DevOps (Week 3).'], cost: { usd: 0.0014, per: 'hour', note: 'The KMS key: $1 a month, prorated; schedule deletion at the end of the course.' } }),
  T(5, 'dev', 'Scope the Lambda role to the table and lock CORS', 'Make the function’s role update one table and nothing else, then allow only your site to call the API from a browser.', 50,
    ['SAA-C03 · Design Secure Architectures', 'Execution roles', 'Resource ARNs in policies', 'CORS at the API'], ['The role names the table ARN only', 'A foreign origin is refused', 'The API still works'],
    [doc('Lambda execution role', 'lambda/latest/dg/lambda-intro-execution-role.html', 'the “View the execution role” steps under Configuration → Permissions — the role name is a link into IAM'),
     doc('Configuring CORS for an HTTP API', 'apigateway/latest/developerguide/http-api-cors.html', 'the “Configuring CORS” table: allowOrigins takes exact origins, and a request from any other origin gets no CORS headers')],
    'Free: reading and editing a role and the API costs nothing.', [
    both(s(5, 'dev', 1), 'Read the role’s policies', 'List what the function’s role may do.', CONSOLE, [
      'Lambda → capstone-team01-counter → Configuration → Permissions → the role name.',
      'IAM opens the role: Permissions policies lists AWSLambdaBasicExecutionRole-… and count-visitors.',
      'If AmazonDynamoDBFullAccess is there, Remove it.',
    ], [
      { cmd: 'ROLE=$(aws lambda get-function-configuration --function-name capstone-team01-counter --query Role --output text | cut -d/ -f3-); aws iam list-attached-role-policies --role-name $ROLE --query "AttachedPolicies[].PolicyName" --output text; aws iam list-role-policies --role-name $ROLE --output text', explain: 'Attached managed policies, then inline ones. Only basic logging and your table policy should appear.', sample: 'AWSLambdaBasicExecutionRole-1a2b3c\nPOLICYNAMES\tcount-visitors' },
    ], ['count-visitors'], 'If AmazonDynamoDBFullAccess appears, the console added it — detach it.'),
    both(s(5, 'dev', 2), 'Check the resource', 'Confirm the inline policy names one table.', CONSOLE, [
      'Open the inline policy count-visitors → JSON.',
      'Action: dynamodb:UpdateItem. Resource: one table ARN, no *.',
    ], [
      { cmd: 'aws iam get-role-policy --role-name $ROLE --policy-name count-visitors --query "PolicyDocument.Statement[0].[Action, Resource]" --output text', explain: 'One action, one table ARN. No wildcard.', sample: 'dynamodb:UpdateItem\narn:aws:dynamodb:us-east-1:123456789012:table/capstone-team01-visitors' },
    ], ['table/capstone-team01-visitors'], 'This is AWS’s answer to a managed identity: the credentials rotate by themselves, and the policy is the fence.'),
    both(s(5, 'dev', 3), 'Allow your origin only', 'Set the API’s CORS to your CloudFront host.', CONSOLE, [
      'API Gateway → your HTTP API → CORS → Configure: Access-Control-Allow-Origin = https://your-distribution.cloudfront.net, methods GET. Save.',
    ], [
      { cmd: 'API=$(aws apigatewayv2 get-apis --query "Items[?Name==\'capstone-team01-api\'].ApiId" --output text); SITE=https://$(aws cloudfront list-distributions --query "DistributionList.Items[0].DomainName" --output text); aws apigatewayv2 update-api --api-id $API --cors-configuration AllowOrigins=$SITE,AllowMethods=GET --query CorsConfiguration.AllowOrigins --output text', explain: 'One allowed origin, one method. The browser enforces it; curl does not.', sample: 'https://d1234abcd.cloudfront.net' },
    ], ['cloudfront.net'], 'CORS is the application layer’s fence: the API still answers anyone, but a browser on another site is refused the answer.'),
    cli(s(5, 'dev', 4), 'Prove a foreign origin is refused', 'Send a forged Origin header; expect no allow header.', [
      { cmd: 'URL=$(aws apigatewayv2 get-apis --query "Items[?Name==\'capstone-team01-api\'].ApiEndpoint" --output text); curl -s -D - -o /dev/null -H "Origin: https://evil.example" $URL/count | grep -ci "access-control-allow-origin" || echo "no allow header"', explain: 'A request claiming to come from another site. The count is still returned, but without the header a browser needs.', sample: 'no allow header' },
      { cmd: 'curl -s -D - -o /dev/null -H "Origin: $SITE" $URL/count | grep -i "access-control-allow-origin"', explain: 'The same request from your own site: the header is present.', sample: 'access-control-allow-origin: https://d1234abcd.cloudfront.net' },
    ], ['no allow header', 'access-control-allow-origin'], 'A negative test is the proof: the exam asks what happens to the other origin, and the answer is in this output.'),
    rec(5, 'dev', 'Secrets register', ['The database access row: stored in — nothing; read by — the execution role.', 'The CORS origin and the negative test result.'], 'The register shows a secret that never existed, and a fence that was tested.'),
  ]),
  T(5, 'secops', 'Prove an access is denied and find what is exposed', 'Ask IAM whether the read-only group could stop the instance, then turn on IAM Access Analyzer and read its external-access findings.', 40,
    ['SAA-C03 · Design Secure Architectures', 'IAM policy simulator', 'IAM Access Analyzer', 'Denied-access tests'], ['A denial is recorded', 'An analyzer exists and its findings are read'],
    [doc('Testing IAM policies with the IAM policy simulator', 'IAM/latest/UserGuide/access_policies_testing-policies.html', 'the “Testing policies attached to a user, group or role” steps and the Results column — implicitDeny is a denial by absence of an allow'),
     doc('IAM Access Analyzer', 'IAM/latest/UserGuide/what-is-access-analyzer.html', 'the “External access analyzers” paragraph: a finding is a resource a principal outside your account can reach')],
    'Free: the simulator and an external access analyzer cost nothing.', [
    both(s(5, 'secops', 1), 'Simulate the group', 'Simulate stopping an instance as the read-only group.', CONSOLE, [
      'IAM → User groups → capstone-team01-readonly → Simulate (or policysim.aws.amazon.com → Groups).',
      'Service EC2, actions StopInstances and DescribeInstances. Run simulation.',
      'Read: StopInstances denied, DescribeInstances allowed.',
    ], [
      { cmd: 'ARN=$(aws iam get-group --group-name capstone-team01-readonly --query Group.Arn --output text); aws iam simulate-principal-policy --policy-source-arn $ARN --action-names ec2:StopInstances ec2:DescribeInstances --query "EvaluationResults[].[EvalActionName, EvalDecision]" --output text', explain: 'The simulator evaluates the real policies without calling anything.', sample: 'ec2:StopInstances\timplicitDeny\nec2:DescribeInstances\tallowed' },
    ], ['implicitDeny', 'allowed'], 'One allowed and one denied action prove the policy does what the matrix says.'),
    both(s(5, 'secops', 2), 'Turn on Access Analyzer', 'Create an account analyzer and list its findings.', CONSOLE, [
      'IAM → Access Analyzer → Create analyzer: external access, account zone of trust, name capstone-team01. Create.',
      'Findings: read each row — the resource, the external principal and the access.',
    ], [
      { cmd: 'aws accessanalyzer create-analyzer --analyzer-name capstone-team01 --type ACCOUNT --query arn --output text; sleep 20; aws accessanalyzer list-findings --analyzer-arn $(aws accessanalyzer list-analyzers --query "analyzers[?name==\'capstone-team01\'].arn" --output text) --query "findings[].[resourceType, status]" --output text', explain: 'The analyzer, then its findings: resources a principal outside the account can reach. The site bucket policy names CloudFront, which is expected.', sample: 'arn:aws:access-analyzer:us-east-1:123456789012:analyzer/capstone-team01\nAWS::S3::Bucket\tACTIVE' },
    ], ['analyzer/capstone-team01'], 'A finding is not a fault until you have read it: the bucket is meant to be readable by CloudFront. Archive what is intended and own what is not.'),
    rec(5, 'secops', 'Access tests', ['Who, what they tried, expected, result.', 'Each analyzer finding: intended (archived) or owned.'], 'Evidence that the matrix is enforced, not just written.'),
  ]),

  // ── Week 6 — Resilient compute ─────────────────────────────────────────
  T(6, 'arch', 'Design the two-zone fleet and record the decision', 'Decide how the site survives a zone: two zones, a load balancer, a fleet of two; cost it against the alternative.', 40,
    ['SAA-C03 · Design Resilient Architectures', 'Availability Zones', 'Elastic Load Balancing', 'Architecture decision records'], ['Two zones are named with their roles', 'The design is costed against the single-instance alternative', 'ADR-002 is written'],
    [doc('Regions and Availability Zones', 'AWSEC2/latest/UserGuide/using-regions-availability-zones.html', 'the “Availability Zones” paragraph: separate power and networking, so a design that spans two survives the loss of one'),
     doc('Elastic Load Balancing pricing', 'https://aws.amazon.com/elasticloadbalancing/pricing/', 'the Application Load Balancer hourly rate and the LCU line — the cost the team accepts for a fleet that survives a zone')],
    'Free: the design is on paper; the fleet it describes is costed on the next tasks.', [
    both(s(6, 'arch', 1), 'Read the zones', 'List the Region’s zones and the subnets in each.', CONSOLE, [
      'VPC → Subnets → filter by vpc-capstone-team01: read the Availability Zone column.',
      'EC2 → Instances → the tools instance → Availability Zone.',
    ], [
      { cmd: 'aws ec2 describe-availability-zones --query "AvailabilityZones[?State==\'available\'].ZoneName" --output text; VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC --query "Subnets[].[Tags[?Key==\'Name\']|[0].Value, CidrBlock, AvailabilityZone]" --output text', explain: 'The zones available, then every subnet with its zone. Today everything is in one.', sample: 'us-east-1a\tus-east-1b\tus-east-1c\tus-east-1d\tus-east-1e\tus-east-1f\nsnet-public-team01\t10.10.1.0/24\tus-east-1a\nsnet-private-team01\t10.10.2.0/24\tus-east-1a' },
    ], ['us-east-1b'], 'A design that lives in one zone has one zone’s failure rate. The exam calls the fix “multi-AZ”; the picture calls it a second subnet in a second zone.'),
    portal(s(6, 'arch', 2), 'Cost the fleet', 'Price the ALB and two instances for a month, against one instance.', 'AWS Pricing Calculator (calculator.aws)', [
      'Add Application Load Balancer, us-east-1, 1 ALB, 730 hours, 1 LCU: read the monthly total.',
      'Add EC2: two t3.micro, 730 hours each, on-demand. Note the free-tier 750 hours covers one.',
      'Write both totals and the difference against the single instance the company runs today.',
    ], 'A monthly figure for the fleet and for the single instance, and the difference.', 'Resilience is bought: the exam’s cost-optimisation domain asks you to say what a zone’s worth of protection costs and who decided to pay it.'),
    rec(6, 'arch', 'Design summary', ['ADR-002: two zones, an ALB, a fleet of two; the alternative (one instance) and why it was rejected.', 'The monthly cost of each, from the calculator.'], 'Week 9’s template must build exactly this design.'),
  ]),
  T(6, 'infra', 'Build the fleet: a launch template and an Auto Scaling group across two zones', 'Add a second public subnet in another zone, write a launch template, run a group of two across both zones, then park it.', 55,
    ['SAA-C03 · Design Resilient Architectures', 'Launch templates', 'Auto Scaling groups', 'Multi-AZ subnets'], ['A second public subnet exists in a second zone', 'The group runs two instances in different zones', 'The group is parked at zero at the end'],
    [doc('Auto Scaling groups', 'autoscaling/ec2/userguide/auto-scaling-groups.html', 'the “Availability Zones and subnets” paragraph: list two subnets in two zones and the group balances across them'),
     doc('Launch templates', 'autoscaling/ec2/userguide/launch-templates.html', 'the “Create a launch template” steps — the image, the type, the key, the security group and user data the group launches from')],
    'The second t3.micro bills about $0.01 an hour while the fleet runs (the first is free tier); park the group at zero when you stop. Stop or delete anything you started.', [
    both(s(6, 'infra', 1), 'Add the second public subnet', 'Create 10.10.3.0/24 in a second zone, routed to the IGW.', CONSOLE, [
      'VPC → Subnets → Create subnet: vpc-capstone-team01, name snet-public-b-team01, zone us-east-1b, CIDR 10.10.3.0/24. Create.',
      'Route tables → rt-public-team01 → Subnet associations → Edit → add the new subnet.',
    ], [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); SUBB=$(aws ec2 create-subnet --vpc-id $VPC --cidr-block 10.10.3.0/24 --availability-zone us-east-1b --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=snet-public-b-team01},{Key=owner,Value=team01}]" --query Subnet.SubnetId --output text); RT=$(aws ec2 describe-route-tables --filters Name=tag:Name,Values=rt-public-team01 --query "RouteTables[0].RouteTableId" --output text); aws ec2 associate-route-table --subnet-id $SUBB --route-table-id $RT --query AssociationState.State --output text', explain: 'A subnet in a different zone, associated with the public route table so it reaches the internet gateway.', sample: 'associated' },
    ], ['associated'], 'Two subnets in two zones is what makes the next step a multi-AZ group instead of two instances in one basket.'),
    both(s(6, 'infra', 2), 'Write the launch template', 'Amazon Linux, nginx, IMDSv2, the SSM role, no key pair.', CONSOLE, [
      'EC2 → Launch templates → Create: name lt-web-team01, AMI Amazon Linux 2023, type t3.micro, no key pair.',
      'Security group sg-tools-team01; IAM instance profile: the SSM profile.',
      'Advanced: Metadata version V2 only (token required). User data: install nginx and write the zone name into index.html. Create.',
    ], [
      { cmd: 'SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); PROFILE=$(aws iam list-instance-profiles --query "InstanceProfiles[?contains(InstanceProfileName,\'capstone\')].Arn | [0]" --output text); UD=$(echo -e "#!/bin/bash\\ndnf install -y nginx\\nTOKEN=\\$(curl -sX PUT http://169.254.169.254/latest/api/token -H \\"X-aws-ec2-metadata-token-ttl-seconds: 60\\")\\nAZ=\\$(curl -s -H \\"X-aws-ec2-metadata-token: \\$TOKEN\\" http://169.254.169.254/latest/meta-data/placement/availability-zone)\\necho \\"web OK from \\$AZ\\" > /usr/share/nginx/html/index.html\\nsystemctl enable --now nginx" | base64 -w0); aws ec2 create-launch-template --launch-template-name lt-web-team01 --launch-template-data "{\\"ImageId\\":\\"resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64\\",\\"InstanceType\\":\\"t3.micro\\",\\"SecurityGroupIds\\":[\\"$SG\\"],\\"IamInstanceProfile\\":{\\"Arn\\":\\"$PROFILE\\"},\\"MetadataOptions\\":{\\"HttpTokens\\":\\"required\\"},\\"UserData\\":\\"$UD\\",\\"TagSpecifications\\":[{\\"ResourceType\\":\\"instance\\",\\"Tags\\":[{\\"Key\\":\\"Name\\",\\"Value\\":\\"web-team01\\"},{\\"Key\\":\\"owner\\",\\"Value\\":\\"team01\\"}]}]}" --query LaunchTemplate.LaunchTemplateName --output text', explain: 'The image resolved from SSM, the type, the SSM profile, IMDSv2 required, and user data that serves the zone name — so the ALB shows which zone answered.', sample: 'lt-web-team01' },
    ], ['lt-web-team01'], 'A launch template is the instance written down: the group can launch a hundred of them identically, and the Week 9 template will hold the same one.'),
    both(s(6, 'infra', 3), 'Run the group across both zones', 'Two instances, one subnet in each zone.', CONSOLE, [
      'EC2 → Auto Scaling groups → Create: name asg-web-team01, launch template lt-web-team01, VPC vpc-capstone-team01, subnets snet-public-team01 and snet-public-b-team01.',
      'Desired 2, minimum 0, maximum 3. Tags: owner. Create.',
      'Instances: wait for two InService rows and read their Availability Zone column.',
    ], [
      { cmd: 'SUBA=$(aws ec2 describe-subnets --filters Name=tag:Name,Values=snet-public-team01 --query "Subnets[0].SubnetId" --output text); aws autoscaling create-auto-scaling-group --auto-scaling-group-name asg-web-team01 --launch-template LaunchTemplateName=lt-web-team01 --min-size 0 --max-size 3 --desired-capacity 2 --vpc-zone-identifier "$SUBA,$SUBB" --tags Key=owner,Value=team01,PropagateAtLaunch=true; sleep 60; aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names asg-web-team01 --query "AutoScalingGroups[0].Instances[].[InstanceId, AvailabilityZone, LifecycleState]" --output text', explain: 'The group, then its instances: two, in two different zones.', sample: 'i-0a1b2c3d4e5f60001\tus-east-1a\tInService\ni-0a1b2c3d4e5f60002\tus-east-1b\tInService' },
    ], ['us-east-1a', 'us-east-1b', 'InService'], 'The group keeps the count you ask for, in the zones you list. Terminate one and it launches another — Week 8 proves it.'),
    both(s(6, 'infra', 4), 'Park the fleet', 'Set the desired count to zero until the next task.', CONSOLE, [
      'EC2 → Auto Scaling groups → asg-web-team01 → Edit: desired capacity 0. Update.',
      'Instances: both rows show Terminating, then disappear.',
    ], [
      { cmd: 'aws autoscaling set-desired-capacity --auto-scaling-group-name asg-web-team01 --desired-capacity 0; sleep 30; aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names asg-web-team01 --query "AutoScalingGroups[0].[DesiredCapacity, length(Instances)]" --output text', explain: 'Desired zero: the group terminates its instances and costs nothing until it is asked for more.', sample: '0\t0' },
    ], ['0'], 'A parked group is free; a forgotten one is the second instance’s hourly rate all week. Every task that scales it up ends by parking it.'),
    rec(6, 'infra', 'Address plan and fleet', ['The second subnet: name, CIDR, zone, route.', 'The group: launch template, zones, minimum, desired, maximum.'], 'Week 9’s template must match this plan exactly.'),
  ], { cost: { usd: 0.0104, per: 'hour', note: 'The second t3.micro while the fleet runs; parked at zero at the end of the task.' } }),
  T(6, 'dev', 'Put the fleet behind an Application Load Balancer', 'Create a target group with a health check and an ALB across both public subnets, attach the group, and prove requests reach both zones.', 55,
    ['SAA-C03 · Design Resilient Architectures', 'Application Load Balancer', 'Target groups and health checks', 'Security group chaining'], ['The ALB answers on port 80', 'Both zones serve requests', 'Only the ALB may reach the instances on 80'],
    [doc('Application Load Balancers', 'elasticloadbalancing/latest/application/introduction.html', 'the “Application Load Balancer components” figure: listener → rule → target group → targets, each a thing you create below'),
     doc('Health checks for target groups', 'elasticloadbalancing/latest/application/target-group-health-checks.html', 'the “Health check settings” table: path, interval, healthy threshold — what makes a target healthy or drains it')],
    'The ALB bills about $0.0225 an hour plus a little per request while it exists; it stays for Weeks 6–8 and is deleted in the Week 8 drill. Stop or delete anything you started.', [
    both(s(6, 'dev', 1), 'Create the target group', 'HTTP on 80, health check on /.', CONSOLE, [
      'EC2 → Target groups → Create: instances, tg-web-team01, HTTP 80, the VPC; health check path /, threshold 2, interval 10 s.',
    ], [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); TG=$(aws elbv2 create-target-group --name tg-web-team01 --protocol HTTP --port 80 --vpc-id $VPC --health-check-path / --health-check-interval-seconds 10 --healthy-threshold-count 2 --query "TargetGroups[0].TargetGroupArn" --output text); echo $TG', explain: 'Where the ALB sends traffic and how it decides a target is healthy.', sample: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg-web-team01/abc123' },
    ], ['targetgroup/tg-web-team01'], 'The health check is the design’s nerve: a target that stops answering / is drained within twenty seconds, before a visitor notices.'),
    both(s(6, 'dev', 2), 'Create the ALB and chain the security groups', 'An ALB open on 80; the instances open only to it.', CONSOLE, [
      'EC2 → Security groups → Create sg-alb-team01 in the VPC: inbound HTTP 80 from 0.0.0.0/0.',
      'Edit sg-tools-team01: inbound HTTP 80 with source sg-alb-team01 (the group, not an address).',
      'EC2 → Load balancers → Create ALB: name alb-web-team01, internet-facing, both public subnets, sg-alb-team01, listener HTTP 80 → tg-web-team01. Create.',
    ], [
      { cmd: 'ALBSG=$(aws ec2 create-security-group --group-name sg-alb-team01 --description "ALB: 80 from the internet" --vpc-id $VPC --query GroupId --output text); aws ec2 authorize-security-group-ingress --group-id $ALBSG --protocol tcp --port 80 --cidr 0.0.0.0/0 --query "Return" --output text; SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 80 --source-group $ALBSG --query "Return" --output text', explain: 'Two groups chained: the world may reach the ALB on 80; only the ALB may reach the fleet on 80.', sample: 'True\nTrue' },
      { cmd: 'SUBA=$(aws ec2 describe-subnets --filters Name=tag:Name,Values=snet-public-team01 --query "Subnets[0].SubnetId" --output text); SUBB=$(aws ec2 describe-subnets --filters Name=tag:Name,Values=snet-public-b-team01 --query "Subnets[0].SubnetId" --output text); ALB=$(aws elbv2 create-load-balancer --name alb-web-team01 --subnets $SUBA $SUBB --security-groups $ALBSG --tags Key=owner,Value=team01 --query "LoadBalancers[0].LoadBalancerArn" --output text); aws elbv2 create-listener --load-balancer-arn $ALB --protocol HTTP --port 80 --default-actions Type=forward,TargetGroupArn=$TG --query "Listeners[0].Port" --output text', explain: 'The balancer in both subnets, and a listener that forwards 80 to the target group.', sample: '80' },
    ], ['True', '80'], 'Security-group chaining is the exam’s favourite answer: the fleet needs no CIDR rule at all, only “from the ALB’s group”.'),
    both(s(6, 'dev', 3), 'Attach the fleet and prove both zones answer', 'Scale the group to two, attach it, curl the ALB ten times.', CONSOLE, [
      'EC2 → Auto Scaling groups → asg-web-team01 → Edit: desired 2; Integrations → Load balancing → attach tg-web-team01. Update.',
      'Target groups → tg-web-team01 → Targets: two healthy. Load balancers → alb-web-team01 → DNS name: open it, refresh; the zone in the page changes.',
    ], [
      { cmd: 'aws autoscaling attach-load-balancer-target-groups --auto-scaling-group-name asg-web-team01 --target-group-arns $TG; aws autoscaling set-desired-capacity --auto-scaling-group-name asg-web-team01 --desired-capacity 2; sleep 150; aws elbv2 describe-target-health --target-group-arn $TG --query "TargetHealthDescriptions[].TargetHealth.State" --output text', explain: 'The group registers its instances with the target group; after the health checks pass, two healthy targets.', sample: 'healthy\thealthy' },
      { cmd: 'DNS=$(aws elbv2 describe-load-balancers --names alb-web-team01 --query "LoadBalancers[0].DNSName" --output text); for i in 1 2 3 4 5 6 7 8 9 10; do curl -s http://$DNS; done | sort | uniq -c', explain: 'Ten requests through the balancer: both zones answer, roughly half each.', sample: '      5 web OK from us-east-1a\n      5 web OK from us-east-1b' },
    ], ['healthy', 'us-east-1a', 'us-east-1b'], 'That output is the whole domain in one line: two zones, one address, and a visitor who cannot tell which answered.'),
    both(s(6, 'dev', 4), 'Park the fleet', 'Desired zero; the ALB stays for next week.', CONSOLE, [
      'EC2 → Auto Scaling groups → asg-web-team01 → Edit: desired 0. Update.',
    ], [
      { cmd: 'aws autoscaling set-desired-capacity --auto-scaling-group-name asg-web-team01 --desired-capacity 0; aws elbv2 describe-load-balancers --names alb-web-team01 --query "LoadBalancers[0].State.Code" --output text', explain: 'Instances gone, the balancer kept: its hourly rate is the price of not rebuilding it twice.', sample: 'active' },
    ], ['active'], 'The balancer costs about fifty cents a day; the instances cost more and come back in a minute, so they are what gets parked.'),
    rec(6, 'dev', 'Request paths', ['Visitor → ALB → fleet (both zones): reachable.', 'Internet → an instance on 80 directly: blocked (only the ALB’s group).'], 'The network document shows the path and the fence around it.'),
  ], { prerequisites: ['The launch template and the group from Infrastructure (this week).'], cost: { usd: 0.0329, per: 'hour', note: 'The ALB ($0.0225) and the second instance while attached; the fleet is parked at the end, the ALB stays until the Week 8 drill.' } }),
  T(6, 'secops', 'Give the private subnet a path without the internet', 'Add a free S3 gateway endpoint and the Session Manager endpoints, manage an instance with no public address, then remove the paid endpoints.', 55,
    ['SAA-C03 · Design Secure Architectures', 'VPC endpoints', 'Private subnets without NAT', 'Session Manager'], ['The gateway endpoint exists', 'A private instance with no public IP installed packages and answered Session Manager', 'The interface endpoints and the instance are gone'],
    [doc('Gateway endpoints for Amazon S3', 'vpc/latest/privatelink/vpc-endpoints-s3.html', 'the “Create a gateway endpoint” steps and the sentence that there is no charge — the free way to reach S3, and the AL2023 repositories, from a private subnet'),
     doc('Session Manager VPC endpoints', 'systems-manager/latest/userguide/setup-create-vpc.html', 'the three endpoint names — ssm, ssmmessages, ec2messages — a private instance needs to be managed with no internet route')],
    'Interface endpoints bill about $0.01 an hour each (three here); delete them at the end of the task. The gateway endpoint is free. Stop or delete anything you started.', [
    both(s(6, 'secops', 1), 'Create the S3 gateway endpoint', 'Attach it to the private route table.', CONSOLE, [
      'VPC → Endpoints → Create: name vpce-s3-team01, type AWS services, com.amazonaws.us-east-1.s3 (Gateway), vpc-capstone-team01, route table rt-private-team01. Create.',
    ], [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); PRT=$(aws ec2 describe-route-tables --filters Name=tag:Name,Values=rt-private-team01 --query "RouteTables[0].RouteTableId" --output text); aws ec2 create-vpc-endpoint --vpc-id $VPC --service-name com.amazonaws.us-east-1.s3 --vpc-endpoint-type Gateway --route-table-ids $PRT --tag-specifications "ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=vpce-s3-team01},{Key=owner,Value=team01}]" --query VpcEndpoint.State --output text', explain: 'A gateway endpoint adds a prefix-list route to the private table: S3 is reachable, the internet still is not.', sample: 'available' },
    ], ['available'], 'Amazon Linux’s package repositories live in S3, so a private subnet with this one free route can patch itself with no NAT gateway at all.'),
    both(s(6, 'secops', 2), 'Create the three Session Manager endpoints', 'ssm, ssmmessages, ec2messages in the private subnet.', CONSOLE, [
      'VPC → Endpoints → Create ×3: type Interface, services com.amazonaws.us-east-1.ssm, …ssmmessages, …ec2messages; subnet snet-private-team01; security group sg-tools-team01; private DNS on.',
    ], [
      { cmd: 'PRIV=$(aws ec2 describe-subnets --filters Name=tag:Name,Values=snet-private-team01 --query "Subnets[0].SubnetId" --output text); SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 443 --source-group $SG --query Return --output text; for S in ssm ssmmessages ec2messages; do aws ec2 create-vpc-endpoint --vpc-id $VPC --service-name com.amazonaws.us-east-1.$S --vpc-endpoint-type Interface --subnet-ids $PRIV --security-group-ids $SG --private-dns-enabled --tag-specifications "ResourceType=vpc-endpoint,Tags=[{Key=Name,Value=vpce-$S-team01}]" --query VpcEndpoint.State --output text; done', explain: 'The group allows 443 from itself, then the three endpoints the agent talks to, resolved by private DNS inside the VPC.', sample: 'True\npending\npending\npending' },
    ], ['pending'], 'An interface endpoint is a network card in your subnet that answers for an AWS service; it is how a private instance is managed with no internet route at all.'),
    both(s(6, 'secops', 3), 'Launch a private instance and administer it', 'No public IP; nginx installs; a session opens.', CONSOLE, [
      'EC2 → Launch instance from template lt-web-team01: subnet snet-private-team01, auto-assign public IP disabled. Launch.',
      'After three minutes: Systems Manager → Fleet Manager → the instance → Connect → Session Manager. Run curl localhost.',
    ], [
      { cmd: 'PID=$(aws ec2 run-instances --launch-template LaunchTemplateName=lt-web-team01 --subnet-id $PRIV --no-associate-public-ip-address --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=web-private-team01}]" --query "Instances[0].InstanceId" --output text); sleep 180; aws ec2 describe-instances --instance-ids $PID --query "Reservations[0].Instances[0].[PublicIpAddress, State.Name]" --output text', explain: 'An instance with no public address at all.', sample: 'None\trunning' },
      { cmd: 'CID=$(aws ssm send-command --instance-ids $PID --document-name AWS-RunShellScript --parameters \'commands=["curl -s localhost"]\' --query Command.CommandId --output text); sleep 6; aws ssm get-command-invocation --command-id $CID --instance-id $PID --query StandardOutputContent --output text', explain: 'A command through Session Manager, over the endpoints, to a machine the internet cannot reach — and nginx is installed, through the S3 gateway.', sample: 'web OK from us-east-1a' },
    ], ['None', 'web OK'], 'This is the production design the Week 6 document used to describe as “what production would add”: no public address, no NAT, and still patched and managed.'),
    both(s(6, 'secops', 4), 'Remove the paid endpoints and the instance', 'Keep the free gateway; delete the rest.', CONSOLE, [
      'EC2 → Instances → web-private-team01 → Instance state → Stop, then Terminate.',
      'VPC → Endpoints → select the three Interface endpoints → Actions → Delete. Keep vpce-s3-team01.',
    ], [
      { cmd: 'aws ec2 stop-instances --instance-ids $PID --query "StoppingInstances[0].CurrentState.Name" --output text; aws ec2 terminate-instances --instance-ids $PID --query "TerminatingInstances[0].CurrentState.Name" --output text; IDS=$(aws ec2 describe-vpc-endpoints --filters Name=vpc-id,Values=$VPC Name=vpc-endpoint-type,Values=Interface --query "VpcEndpoints[].VpcEndpointId" --output text); aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $IDS --query "length(Unsuccessful)" --output text', explain: 'The instance stopped and terminated, the three interface endpoints deleted; zero unsuccessful.', sample: 'stopping\nshutting-down\n0' },
    ], ['shutting-down', '0'], 'Three cents an hour is nothing for an afternoon and twenty dollars for a month left running. The record says what was kept and why.'),
    rec(6, 'secops', 'Rules and private path', ['The gateway endpoint (kept, free) and the interface endpoints (used, deleted).', 'Rule: 443 from the group itself, why.', 'Path: admin → Session Manager → private instance: reachable with no public IP.'], 'The network document now shows the private path and proves it.'),
  ], { prerequisites: ['The launch template from Infrastructure (this week).'], cost: { usd: 0.03, per: 'hour', note: 'Three interface endpoints at $0.01 each while they exist; deleted at the end of the task.' } }),

  // ── Week 7 — Data and storage ──────────────────────────────────────────
  T(7, 'arch', 'Choose the data store and the storage classes', 'Compare the serverless table with a relational database for the next workload, choose S3 storage classes, and record the decision with its cost.', 40,
    ['SAA-C03 · Design Cost-Optimized Architectures', 'DynamoDB vs relational', 'S3 storage classes', 'Lifecycle rules'], ['A data-store decision with its monthly cost', 'A storage class per object kind, with a lifecycle rule'],
    [doc('Amazon S3 storage classes', 'AmazonS3/latest/userguide/storage-class-intro.html', 'the comparison table: retrieval time and minimum storage duration per class — the two numbers that decide where logs and backups go'),
     doc('Choosing between DynamoDB and relational', 'amazondynamodb/latest/developerguide/SQLtoNoSQL.html', 'the “Why choose DynamoDB” list against the cases a relational database fits — joins, transactions across tables, ad-hoc queries')],
    'Free: the decision is on paper; the database it describes is costed on Infrastructure’s task.', [
    both(s(7, 'arch', 1), 'Read today’s data costs', 'How much the table and the buckets cost this month.', CONSOLE, [
      'Billing → Cost Explorer → filter Service: DynamoDB, S3; group by usage type. Read the month to date.',
      'S3 → each bucket → Metrics: total size and object count.',
    ], [
      { cmd: 'aws ce get-cost-and-usage --time-period Start=$(date -d "-30 days" +%F),End=$(date +%F) --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE --query "ResultsByTime[0].Groups[?contains(Keys[0],\'DynamoDB\') || contains(Keys[0],\'S3\')].[Keys[0], Metrics.UnblendedCost.Amount]" --output text', explain: 'Thirty days of cost for the table and the buckets. On the free tier, cents.', sample: 'Amazon DynamoDB\t0.00\nAmazon Simple Storage Service\t0.03' },
    ], ['DynamoDB'], 'A decision that starts from what the current design costs is one the finance side can follow.'),
    portal(s(7, 'arch', 2), 'Price the relational alternative', 'Cost a small Multi-AZ PostgreSQL for a month.', 'AWS Pricing Calculator (calculator.aws)', [
      'Add Amazon RDS for PostgreSQL: db.t3.micro, Multi-AZ, 20 GB gp3, us-east-1. Read the monthly total.',
      'Write the workloads each store fits: the counter stays on the table; orders, customers and reports go relational.',
      'Pick a class per kind: site files Standard; logs to Glacier Instant Retrieval after 30 days; backups to Deep Archive.',
    ], 'A monthly figure for the database, the workload split, and a class per object kind.', 'The cost-optimisation domain is a set of these trade-offs: the right store for the access pattern, and the cheapest class that still meets the retrieval time.'),
    rec(7, 'arch', 'Sizing and data decisions', ['ADR-003: which workloads use the table, which the database, and the monthly cost of each.', 'The storage class and lifecycle per object kind.'], 'Week 9’s template holds the database and the lifecycle rule this decides.'),
  ]),
  T(7, 'infra', 'Create a Multi-AZ PostgreSQL database and keep its snapshot', 'Add a second private subnet and a subnet group, run an encrypted Multi-AZ PostgreSQL reachable only from the fleet, snapshot it, delete it.', 60,
    ['SAA-C03 · Design Resilient Architectures', 'Amazon RDS Multi-AZ', 'DB subnet groups', 'Encryption at rest'], ['The database ran Multi-AZ, encrypted, not public', 'Only the fleet’s group may reach port 5432', 'A manual snapshot exists and the instance is deleted'],
    [doc('Multi-AZ DB instance deployments', 'AmazonRDS/latest/UserGuide/Concepts.MultiAZSingleStandby.html', 'the “Failover process” paragraph: a synchronous standby in another zone and a DNS switch in a minute or two — the RTO your plan can promise'),
     doc('Working with DB subnet groups', 'AmazonRDS/latest/UserGuide/USER_VPC.WorkingWithRDSInstanceinaVPC.html#USER_VPC.Subnets', 'a subnet group needs subnets in at least two Availability Zones — why the second private subnet comes first')],
    'db.t3.micro Multi-AZ bills about $0.036 an hour plus storage while it exists; it is created, snapshotted and deleted inside this task. A snapshot bills cents a month. Stop or delete anything you started.', [
    both(s(7, 'infra', 1), 'Add the second private subnet and the subnet group', '10.10.4.0/24 in zone b; a group of both private subnets.', CONSOLE, [
      'VPC → Subnets → Create: name snet-private-b-team01, zone us-east-1b, CIDR 10.10.4.0/24; associate it with rt-private-team01.',
      'RDS → Subnet groups → Create: name dbsg-team01, VPC vpc-capstone-team01, both private subnets. Create.',
    ], [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); PRIVB=$(aws ec2 create-subnet --vpc-id $VPC --cidr-block 10.10.4.0/24 --availability-zone us-east-1b --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=snet-private-b-team01},{Key=owner,Value=team01}]" --query Subnet.SubnetId --output text); PRT=$(aws ec2 describe-route-tables --filters Name=tag:Name,Values=rt-private-team01 --query "RouteTables[0].RouteTableId" --output text); aws ec2 associate-route-table --subnet-id $PRIVB --route-table-id $PRT --query AssociationState.State --output text; PRIVA=$(aws ec2 describe-subnets --filters Name=tag:Name,Values=snet-private-team01 --query "Subnets[0].SubnetId" --output text); aws rds create-db-subnet-group --db-subnet-group-name dbsg-team01 --db-subnet-group-description "capstone private subnets" --subnet-ids $PRIVA $PRIVB --query "DBSubnetGroup.Subnets[].SubnetAvailabilityZone.Name" --output text', explain: 'A private subnet in the second zone, on the private route table, then a subnet group that spans both.', sample: 'associated\nus-east-1a\tus-east-1b' },
    ], ['us-east-1b'], 'RDS refuses a Multi-AZ instance without two zones to put it in; the subnet group is where that promise is written.'),
    both(s(7, 'infra', 2), 'Fence the database', 'A security group that admits only the fleet on 5432.', CONSOLE, [
      'EC2 → Security groups → Create sg-db-team01 in the VPC: inbound PostgreSQL 5432 from sg-tools-team01 (the group, not an address). Create.',
    ], [
      { cmd: 'SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); DBSG=$(aws ec2 create-security-group --group-name sg-db-team01 --description "PostgreSQL from the fleet only" --vpc-id $VPC --query GroupId --output text); aws ec2 authorize-security-group-ingress --group-id $DBSG --protocol tcp --port 5432 --source-group $SG --query Return --output text', explain: 'One inbound rule, from the fleet’s group. No address, no 0.0.0.0/0.', sample: 'True' },
    ], ['True'], 'A database with a CIDR rule is one subnet change from exposed; a rule from a group follows the fleet wherever it moves.'),
    both(s(7, 'infra', 3), 'Launch it Multi-AZ, encrypted, private', 'db.t3.micro PostgreSQL with a standby in the other zone.', CONSOLE, [
      'RDS → Create database: Standard create, PostgreSQL, Multi-AZ DB instance, db.t3.micro, 20 GB gp3, identifier capstone-team01-db.',
      'Master password managed in Secrets Manager; subnet group dbsg-team01; public access No; security group sg-db-team01; encryption on. Create.',
      'Wait for Available (about ten minutes). Connectivity & security: Multi-AZ Yes, Publicly accessible No, Encryption Enabled.',
    ], [
      { cmd: 'aws rds create-db-instance --db-instance-identifier capstone-team01-db --engine postgres --db-instance-class db.t3.micro --allocated-storage 20 --storage-type gp3 --multi-az --storage-encrypted --no-publicly-accessible --master-username capstone --manage-master-user-password --db-subnet-group-name dbsg-team01 --vpc-security-group-ids $DBSG --backup-retention-period 1 --tags Key=owner,Value=team01 --query DBInstance.DBInstanceStatus --output text; aws rds wait db-instance-available --db-instance-identifier capstone-team01-db; aws rds describe-db-instances --db-instance-identifier capstone-team01-db --query "DBInstances[0].[MultiAZ, PubliclyAccessible, StorageEncrypted, AvailabilityZone, SecondaryAvailabilityZone]" --output text', explain: 'The instance, then the five facts the exam asks about it: a standby in another zone, no public address, encrypted at rest.', sample: 'creating\nTrue\tFalse\tTrue\tus-east-1a\tus-east-1b' },
    ], ['True\tFalse\tTrue', 'us-east-1b'], 'Multi-AZ is not a backup: it is a standby that takes over in a minute. The snapshot in the next step is the backup.'),
    both(s(7, 'infra', 4), 'Snapshot it, then delete it', 'A manual snapshot kept; the instance gone.', CONSOLE, [
      'RDS → capstone-team01-db → Actions → Take snapshot: capstone-team01-db-w7. Wait for Available.',
      'Actions → Delete: untick the final snapshot (you have one), tick the acknowledgement. Delete.',
    ], [
      { cmd: 'aws rds create-db-snapshot --db-instance-identifier capstone-team01-db --db-snapshot-identifier capstone-team01-db-w7 --query DBSnapshot.Status --output text; aws rds wait db-snapshot-available --db-snapshot-identifier capstone-team01-db-w7; aws rds delete-db-instance --db-instance-identifier capstone-team01-db --skip-final-snapshot --delete-automated-backups --query DBInstance.DBInstanceStatus --output text', explain: 'The snapshot first, then the hourly instance gone. Week 8 restores from this snapshot.', sample: 'creating\ndeleting' },
    ], ['deleting'], 'An hour of Multi-AZ PostgreSQL is a few cents; a week of it forgotten is the course budget. The snapshot keeps the data for a fraction of that.'),
    rec(7, 'infra', 'Database', ['Engine, class, Multi-AZ, encrypted, public access, the zones, the subnet group and the security group rule.', 'The snapshot name.'], 'Week 8 restores this database and the plan names its RPO and RTO.'),
  ], { cost: { usd: 0.04, per: 'hour', note: 'db.t3.micro Multi-AZ ($0.036) plus 20 GB gp3 while it exists; deleted inside the task, the snapshot kept for cents.' } }),
  T(7, 'dev', 'Queue the visits and write a ledger', 'Put a queue and a dead-letter queue between the API and a ledger function that records each visit, and prove a poison message is redriven.', 55,
    ['SAA-C03 · Design High-Performing Architectures', 'Amazon SQS', 'Dead-letter queues', 'Event source mappings'], ['A queue and a dead-letter queue exist', 'A visit sent to the queue becomes an item in the table', 'A poison message is redriven to the dead-letter queue'],
    [doc('Amazon SQS dead-letter queues', 'AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html', 'the “Redrive policy” paragraph: maxReceiveCount, after which a message moves aside instead of looping forever'),
     doc('Using Lambda with Amazon SQS', 'lambda/latest/dg/with-sqs.html', 'the “Event source mapping” steps and the batch size: Lambda polls the queue and deletes what it processed')],
    'Free: a million SQS requests a month and the Lambda free tier cover this many times over.', [
    both(s(7, 'dev', 1), 'Create the queues', 'A visits queue and its dead-letter queue, maxReceiveCount 3.', CONSOLE, [
      'SQS → Create queue: Standard, capstone-team01-visits-dlq. Create. Then Create queue: Standard, capstone-team01-visits, Dead-letter queue enabled → the DLQ, maximum receives 3. Create.',
    ], [
      { cmd: 'DLQ=$(aws sqs create-queue --queue-name capstone-team01-visits-dlq --query QueueUrl --output text); DLQARN=$(aws sqs get-queue-attributes --queue-url $DLQ --attribute-names QueueArn --query Attributes.QueueArn --output text); Q=$(aws sqs create-queue --queue-name capstone-team01-visits --attributes "{\\"RedrivePolicy\\":\\"{\\\\\\"deadLetterTargetArn\\\\\\":\\\\\\"$DLQARN\\\\\\",\\\\\\"maxReceiveCount\\\\\\":\\\\\\"3\\\\\\"}\\"}" --query QueueUrl --output text); echo $Q', explain: 'The dead-letter queue first, then the working queue that points at it after three failed receives.', sample: 'https://sqs.us-east-1.amazonaws.com/123456789012/capstone-team01-visits' },
    ], ['capstone-team01-visits'], 'A queue lets the API answer in milliseconds and the write happen when it can; the dead-letter queue is where a bad message goes instead of blocking the good ones.'),
    both(s(7, 'dev', 2), 'Create the ledger function', 'One item per message, scoped to the table and the queue.', CONSOLE, [
      'IAM → Roles → Create role-ledger-team01: Lambda, AWSLambdaBasicExecutionRole.',
      'Inline policy: dynamodb:PutItem on the visitors table ARN; sqs Receive, Delete and GetQueueAttributes on the visits queue ARN.',
      'Lambda → Create function capstone-team01-ledger, Node.js, that role. Paste the code: for each record, PutItem {id: "visit#"+messageId, at: now}. Deploy.',
    ], [
      { cmd: 'ACCT=$(aws sts get-caller-identity --query Account --output text); QARN=$(aws sqs get-queue-attributes --queue-url $Q --attribute-names QueueArn --query Attributes.QueueArn --output text); aws iam create-role --role-name role-ledger-team01 --assume-role-policy-document \'{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}\' --query Role.RoleName --output text; aws iam attach-role-policy --role-name role-ledger-team01 --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole; aws iam put-role-policy --role-name role-ledger-team01 --policy-name ledger --policy-document "{\\"Version\\":\\"2012-10-17\\",\\"Statement\\":[{\\"Effect\\":\\"Allow\\",\\"Action\\":\\"dynamodb:PutItem\\",\\"Resource\\":\\"arn:aws:dynamodb:us-east-1:$ACCT:table/capstone-team01-visitors\\"},{\\"Effect\\":\\"Allow\\",\\"Action\\":[\\"sqs:ReceiveMessage\\",\\"sqs:DeleteMessage\\",\\"sqs:GetQueueAttributes\\"],\\"Resource\\":\\"$QARN\\"}]}"', explain: 'A role the function assumes, basic logging, then one policy: put to one table, read from one queue.', sample: 'role-ledger-team01' },
      { cmd: 'mkdir -p /tmp/ledger && cat > /tmp/ledger/index.mjs <<\'EOF\'\nimport { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";\nconst db = new DynamoDBClient({});\nexport const handler = async (event) => {\n  for (const r of event.Records) {\n    const body = JSON.parse(r.body);\n    if (!body.page) throw new Error("no page");\n    await db.send(new PutItemCommand({ TableName: process.env.TABLE, Item: { id: { S: `visit#${r.messageId}` }, page: { S: body.page }, at: { N: String(Date.now()) } } }));\n  }\n};\nEOF\ncd /tmp/ledger && zip -q f.zip index.mjs && sleep 10 && aws lambda create-function --function-name capstone-team01-ledger --runtime nodejs20.x --handler index.handler --role arn:aws:iam::$ACCT:role/role-ledger-team01 --zip-file fileb://f.zip --environment Variables={TABLE=capstone-team01-visitors} --query State --output text', explain: 'The function: one PutItem per message, and an error on a message with no page — the poison case.', sample: 'Pending' },
    ], ['role-ledger-team01', 'Pending'], 'Two functions, each with one job and one policy, is the shape the exam calls “decoupled”: the counter never waits for the ledger.'),
    both(s(7, 'dev', 3), 'Connect the queue and send a visit', 'An event source mapping; one message becomes one item.', CONSOLE, [
      'Lambda → capstone-team01-ledger → Add trigger: SQS, capstone-team01-visits, batch size 10. Add.',
      'SQS → capstone-team01-visits → Send and receive messages: body {"page":"/"}. Send. DynamoDB → Explore items: a visit# item appears.',
    ], [
      { cmd: 'aws lambda create-event-source-mapping --function-name capstone-team01-ledger --event-source-arn $QARN --batch-size 10 --query State --output text; sleep 20; aws sqs send-message --queue-url $Q --message-body \'{"page":"/"}\' --query MessageId --output text; sleep 15; aws dynamodb scan --table-name capstone-team01-visitors --filter-expression "begins_with(id, :v)" --expression-attribute-values \'{":v":{"S":"visit#"}}\' --query "Count" --output text', explain: 'The mapping, a message, and the count of visit items a few seconds later.', sample: 'Creating\n1a2b3c4d-…\n1' },
    ], ['1'], 'The write happened without the API knowing; that gap is what lets the front door stay fast when the back room is slow.'),
    both(s(7, 'dev', 4), 'Poison the queue and watch the dead-letter queue', 'A message with no page fails three times, then moves aside.', CONSOLE, [
      'SQS → capstone-team01-visits → Send message with body {} . After a minute, capstone-team01-visits-dlq → Messages available: 1.',
      'CloudWatch → Logs → /aws/lambda/capstone-team01-ledger: three “no page” errors.',
    ], [
      { cmd: 'aws sqs send-message --queue-url $Q --message-body \'{}\' --query MessageId --output text; sleep 90; aws sqs get-queue-attributes --queue-url $DLQ --attribute-names ApproximateNumberOfMessages --query Attributes.ApproximateNumberOfMessages --output text', explain: 'A message the function rejects; after three receives the queue redrives it to the dead-letter queue.', sample: '1a2b3c4d-…\n1' },
    ], ['1'], 'Without the dead-letter queue that message would be retried forever and every good message behind it would wait. The exam asks for exactly this setting.'),
    rec(7, 'dev', 'Queue and ledger', ['The queue, its dead-letter queue and the receive count.', 'The ledger function, its role and the event source mapping.', 'The poison test and where the message ended.'], 'The design document shows the decoupled path and its failure mode.'),
  ]),
  T(7, 'secops', 'Lock the data down and age it out', 'Prove the database was never public and is encrypted, block public access for the account, and age old audit objects to a colder class.', 40,
    ['SAA-C03 · Design Secure Architectures', 'S3 Block Public Access', 'Encryption at rest', 'Lifecycle rules'], ['Account-level Block Public Access is on', 'The database snapshot is encrypted and not shared', 'A lifecycle rule ages the audit bucket'],
    [doc('Blocking public access to your Amazon S3 storage', 'AmazonS3/latest/userguide/access-control-block-public-access.html', 'the “Block public access settings” table and the account-level option that overrides every bucket'),
     doc('Managing your storage lifecycle', 'AmazonS3/latest/userguide/object-lifecycle-mgmt.html', 'the “Transition actions” list and the minimum days before an object may move to Glacier Instant Retrieval')],
    'Free: Block Public Access, lifecycle rules and reading snapshot attributes cost nothing; colder classes cost less, not more.', [
    both(s(7, 'secops', 1), 'Block public access for the account', 'All four settings on, account-wide.', CONSOLE, [
      'S3 → Block Public Access settings for this account → Edit → tick all four → Save → confirm.',
    ], [
      { cmd: 'ACCT=$(aws sts get-caller-identity --query Account --output text); aws s3control put-public-access-block --account-id $ACCT --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true; aws s3control get-public-access-block --account-id $ACCT --query "PublicAccessBlockConfiguration.RestrictPublicBuckets" --output text', explain: 'The account-wide switch; a bucket policy that opens a bucket to the world is refused from now on.', sample: 'True' },
    ], ['True'], 'The site stays reachable because CloudFront reads it as a named principal, not as “everyone”: the fence blocks only the mistake.'),
    both(s(7, 'secops', 2), 'Check the snapshot', 'Encrypted, and shared with nobody.', CONSOLE, [
      'RDS → Snapshots → capstone-team01-db-w7: Encrypted Yes. Actions → Share snapshot: no accounts listed.',
    ], [
      { cmd: 'aws rds describe-db-snapshots --db-snapshot-identifier capstone-team01-db-w7 --query "DBSnapshots[0].[Encrypted, Status]" --output text; aws rds describe-db-snapshot-attributes --db-snapshot-identifier capstone-team01-db-w7 --query "DBSnapshotAttributesResult.DBSnapshotAttributes[0].AttributeValues" --output text', explain: 'Encrypted and available, and the restore attribute lists no other account.', sample: 'True\tavailable\n' },
    ], ['True'], 'A snapshot is the database’s data without its fence; the attribute that lists who may restore it is the fence.'),
    both(s(7, 'secops', 3), 'Age the audit objects', 'Standard to Glacier Instant Retrieval after 30 days.', CONSOLE, [
      'S3 → the audit bucket (or the site bucket if Week 11 has not run) → Management → Create lifecycle rule.',
      'Name age-out, whole bucket: current versions to Glacier Instant Retrieval after 30 days; expire noncurrent after 90. Create.',
    ], [
      { cmd: 'BUCKET=$(aws s3api list-buckets --query "Buckets[?contains(Name,\'team01\')].Name | [0]" --output text); aws s3api put-bucket-lifecycle-configuration --bucket $BUCKET --lifecycle-configuration \'{"Rules":[{"ID":"age-out","Status":"Enabled","Filter":{},"Transitions":[{"Days":30,"StorageClass":"GLACIER_IR"}],"NoncurrentVersionExpiration":{"NoncurrentDays":90}}]}\' && aws s3api get-bucket-lifecycle-configuration --bucket $BUCKET --query "Rules[0].[ID, Status, Transitions[0].StorageClass]" --output text', explain: 'One rule: after thirty days an object moves to a class that costs a quarter as much and still answers in milliseconds.', sample: 'age-out\tEnabled\tGLACIER_IR' },
    ], ['GLACIER_IR'], 'Cost optimisation on the exam is mostly this rule: say how soon an object will be read, and let the bucket move it to the class that matches.'),
    rec(7, 'secops', 'Data controls', ['Block Public Access: on, account level.', 'The snapshot: encrypted, shared with nobody.', 'The lifecycle rule and the class it moves to.'], 'The runbook’s data section says what protects the data at rest and who may copy it.'),
  ]),

  // ── Week 8 — Scale, monitor, recover ───────────────────────────────────
  T(8, 'arch', 'Set RPO and RTO per asset and the scaling policy', 'Decide per asset how much data can be lost and how fast it must return, set the scaling target, and cost the final design.', 35,
    ['SAA-C03 · Design Cost-Optimized Architectures', 'RPO and RTO', 'Target tracking', 'Right-sizing'], ['RPO and RTO for every asset', 'A scaling target with its reason', 'The final design is costed'],
    [doc('Reliability pillar — Well-Architected', 'wellarchitected/latest/reliability-pillar/welcome.html', 'the “Plan for disaster recovery” section: RPO and RTO defined, and the four strategies from backup-and-restore to multi-site'),
     doc('Target tracking scaling policies', 'autoscaling/ec2/userguide/as-scaling-target-tracking.html', 'the “Choose metrics” paragraph: a metric that rises with load and falls when instances are added — CPU is the textbook one')],
    'Free: targets, a policy and the calculator cost nothing.', [
    both(s(8, 'arch', 1), 'Read the fleet’s usage', 'CPU over the week for the fleet and the tools instance.', CONSOLE, [
      'CloudWatch → Metrics → EC2 → By Auto Scaling Group → asg-web-team01 CPUUtilization, 1 week, Average.',
      'EC2 → Instances → ec2-tools-team01 → Monitoring → CPU utilization, 1 week.',
    ], [
      { cmd: 'aws cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name CPUUtilization --dimensions Name=AutoScalingGroupName,Value=asg-web-team01 --start-time $(date -u -d "-7 days" +%FT%TZ) --end-time $(date -u +%FT%TZ) --period 86400 --statistics Average Maximum --query "Datapoints[].[Average, Maximum]" --output text', explain: 'Average and peak CPU per day for the fleet while it ran. Low numbers argue for a small type and a high scaling target.', sample: '3.1\t12.4' },
    ], ['12.4'], 'A scaling target is a number you defend: 50 % CPU on a t3.micro leaves headroom for a burst before the next instance is ready.'),
    portal(s(8, 'arch', 2), 'Cost the final design', 'The fleet, the ALB, the database and the queue for a month.', 'AWS Pricing Calculator (calculator.aws)', [
      'Add one ALB, two t3.micro (one free-tier), RDS db.t3.micro Multi-AZ 20 GB, DynamoDB on-demand, SQS, S3. Read the total.',
      'Write it next to Week 6’s single-instance figure; the difference buys a zone, a standby and a queue.',
    ], 'A monthly total for the final design with the difference explained.', 'The exam’s cost domain is not “cheapest”: it is the cheapest design that still meets the RPO, the RTO and the availability the company wrote down.'),
    rec(8, 'arch', 'Business impact and scaling', ['Asset, criticality, RPO, RTO, protected by.', 'The scaling target and why.', 'The monthly cost of the final design.'], 'Week 12’s recovery scenario is judged against these targets.'),
  ]),
  T(8, 'infra', 'Scale the fleet on CPU and prove a lost instance is replaced', 'Add a target-tracking policy, load one instance until the group adds a third, terminate one and watch it replaced, then park the fleet.', 55,
    ['SAA-C03 · Design Resilient Architectures', 'Target tracking', 'Self-healing groups', 'Instance replacement'], ['A policy scales out on CPU', 'A terminated instance is replaced without a human', 'The fleet is parked at the end'],
    [doc('Target tracking scaling policies', 'autoscaling/ec2/userguide/as-scaling-target-tracking.html', 'the “Create a target tracking scaling policy” steps and the predefined metric ASGAverageCPUUtilization'),
     doc('Replacing unhealthy instances', 'autoscaling/ec2/userguide/ec2-auto-scaling-health-checks.html', 'the “Health check grace period” paragraph and what happens to an instance the group marks unhealthy — it is terminated and replaced')],
    'The fleet runs two to three t3.micro for under an hour (about $0.01 to $0.02 an hour beyond the free one); park it at zero at the end. Stop or delete anything you started.', [
    both(s(8, 'infra', 1), 'Wake the fleet and add the policy', 'Desired 2; target 50 % average CPU.', CONSOLE, [
      'EC2 → Auto Scaling groups → asg-web-team01 → Edit: desired 2. Update.',
      'Automatic scaling → Create dynamic scaling policy: target tracking, Average CPU utilization, 50, name cpu-50. Create.',
    ], [
      { cmd: 'aws autoscaling set-desired-capacity --auto-scaling-group-name asg-web-team01 --desired-capacity 2; aws autoscaling put-scaling-policy --auto-scaling-group-name asg-web-team01 --policy-name cpu-50 --policy-type TargetTrackingScaling --target-tracking-configuration \'{"PredefinedMetricSpecification":{"PredefinedMetricType":"ASGAverageCPUUtilization"},"TargetValue":50.0}\' --query "Alarms[].AlarmName" --output text', explain: 'The policy creates two alarms for you: one that adds instances above the target, one that removes them below it.', sample: 'TargetTracking-asg-web-team01-AlarmHigh-…\tTargetTracking-asg-web-team01-AlarmLow-…' },
    ], ['AlarmHigh', 'AlarmLow'], 'Target tracking is the exam’s default answer for “scale on demand”: you give the target, the service writes the alarms.'),
    both(s(8, 'infra', 2), 'Load an instance until the group adds one', 'Burn CPU on one instance; watch desired go to three.', CONSOLE, [
      'Systems Manager → Run Command → AWS-RunShellScript on one fleet instance.',
      'Command: for i in 1 2; do yes > /dev/null & done; sleep 420; pkill yes. Run.',
      'EC2 → Auto Scaling groups → asg-web-team01 → Activity: after five to eight minutes a third instance launches.',
    ], [
      { cmd: 'ONE=$(aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names asg-web-team01 --query "AutoScalingGroups[0].Instances[0].InstanceId" --output text); aws ssm send-command --instance-ids $ONE --document-name AWS-RunShellScript --parameters \'commands=["for i in 1 2; do yes > /dev/null & done; sleep 420; pkill yes"]\' --query Command.Status --output text; sleep 480; aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names asg-web-team01 --query "AutoScalingGroups[0].[DesiredCapacity, length(Instances)]" --output text', explain: 'Two CPU burners for seven minutes on one instance; the average crosses 50 % and the policy raises desired to three.', sample: 'Pending\n3\t3' },
    ], ['3'], 'The third instance is the policy acting on the alarm; nobody clicked. When the load ends the AlarmLow removes it again, a few minutes later.'),
    both(s(8, 'infra', 3), 'Terminate one and watch it come back', 'Kill an instance; the group launches a replacement.', CONSOLE, [
      'EC2 → Instances → one web-team01 instance → Instance state → Terminate.',
      'Auto Scaling groups → asg-web-team01 → Activity: “Terminating EC2 instance” then “Launching a new EC2 instance”. Instances: back to the desired count.',
    ], [
      { cmd: 'aws ec2 terminate-instances --instance-ids $ONE --query "TerminatingInstances[0].CurrentState.Name" --output text; sleep 120; aws autoscaling describe-scaling-activities --auto-scaling-group-name asg-web-team01 --max-items 2 --query "Activities[].Description" --output text', explain: 'The termination, then the group’s own activities: it noticed and launched a replacement.', sample: 'shutting-down\nLaunching a new EC2 instance: i-0a1b2c3d4e5f60004\tTerminating EC2 instance: i-0a1b2c3d4e5f60001' },
    ], ['Launching a new EC2 instance'], 'This is “self-healing” on the exam: the group holds the count, the balancer stops sending to the dead one within seconds, and the visitor never knew.'),
    both(s(8, 'infra', 4), 'Park the fleet', 'Desired zero, policy left in place.', CONSOLE, [
      'EC2 → Auto Scaling groups → asg-web-team01 → Edit: desired 0, minimum 0. Update.',
    ], [
      { cmd: 'aws autoscaling set-desired-capacity --auto-scaling-group-name asg-web-team01 --desired-capacity 0; sleep 30; aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names asg-web-team01 --query "AutoScalingGroups[0].[DesiredCapacity, length(Instances)]" --output text', explain: 'Desired zero; the policy stays for Week 9’s template to copy.', sample: '0\t0' },
    ], ['0'], 'Parked is free. The drill on Security & Ops’ task wakes it one more time and then deletes it all.'),
    rec(8, 'infra', 'Scaling and replacement', ['The policy: metric, target, the alarms it created.', 'The scale-out time and the replacement time, from the activity log.'], 'The plan names the time a lost instance takes to come back.'),
  ], { cost: { usd: 0.021, per: 'hour', note: 'Up to two billed t3.micro beyond the free one while the fleet runs; parked at the end.' } }),
  T(8, 'dev', 'Recover a deleted web file and the database from its snapshot', 'Turn on versioning, delete index.html and get it back, restore the database from the Week 7 snapshot, check it, and delete the restored instance.', 55,
    ['SAA-C03 · Design Resilient Architectures', 'S3 versioning', 'RDS snapshot restore', 'Recovery proof'], ['The deleted file is back', 'A database restored from the snapshot reached Available', 'The restored instance is deleted'],
    [doc('Using versioning in S3 buckets', 'AmazonS3/latest/userguide/Versioning.html', 'the “Delete markers” paragraph: a delete on a versioned bucket hides the object behind a marker, and removing the marker brings it back'),
     doc('Restoring from a DB snapshot', 'AmazonRDS/latest/UserGuide/USER_RestoreFromSnapshot.html', 'the note that a restore creates a new instance with a new endpoint — and that you choose its subnet group and security group again')],
    'The restored db.t3.micro bills about $0.018 an hour (single-AZ) while it exists; delete it at the end of the task. Versioning stores the old copies for cents. Stop or delete anything you started.', [
    both(s(8, 'dev', 1), 'Turn on versioning', 'Every overwrite and delete keeps the previous version.', CONSOLE, [
      'S3 → the site bucket → Properties → Bucket Versioning → Edit → Enable → Save.',
    ], [
      { cmd: 'BUCKET=$(aws s3api list-buckets --query "Buckets[?contains(Name,\'site\') && contains(Name,\'team01\')].Name | [0]" --output text); aws s3api put-bucket-versioning --bucket $BUCKET --versioning-configuration Status=Enabled && aws s3api get-bucket-versioning --bucket $BUCKET --query Status --output text', explain: 'Versioning on. From now on nothing in the bucket is lost by a delete.', sample: 'Enabled' },
    ], ['Enabled'], 'Versioning is the cheapest backup there is, and the one the exam expects for a static site.'),
    both(s(8, 'dev', 2), 'Delete the page and bring it back', 'Delete index.html; remove the delete marker.', CONSOLE, [
      'S3 → the bucket → tick index.html → Delete.',
      'Show versions → the Delete marker row → Delete (permanently). The page is back.',
    ], [
      { cmd: 'aws s3 rm s3://$BUCKET/index.html; curl -s -o /dev/null -w "%{http_code}\\n" https://$(aws cloudfront list-distributions --query "DistributionList.Items[0].DomainName" --output text)/index.html', explain: 'The delete, then the site: 403 or 404 — the page is gone from the visitor’s view.', sample: '403' },
      { cmd: 'MARKER=$(aws s3api list-object-versions --bucket $BUCKET --prefix index.html --query "DeleteMarkers[?IsLatest].VersionId | [0]" --output text); aws s3api delete-object --bucket $BUCKET --key index.html --version-id $MARKER --query VersionId --output text', explain: 'Removing the delete marker makes the previous version current again. Nothing was uploaded.', sample: 'kX9…' },
    ], ['403'], 'The restore took one call and uploaded nothing: the object was always there, behind the marker.'),
    both(s(8, 'dev', 3), 'Restore the database from the snapshot', 'A new instance from capstone-team01-db-w7; wait; check.', CONSOLE, [
      'RDS → Snapshots → capstone-team01-db-w7 → Actions → Restore snapshot: identifier capstone-team01-db-restore, db.t3.micro, single-AZ, subnet group dbsg-team01, no public access, sg-db-team01. Restore.',
      'Wait for Available (about eight minutes): Connectivity & security shows a new endpoint.',
    ], [
      { cmd: 'DBSG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-db-team01 --query "SecurityGroups[0].GroupId" --output text); aws rds restore-db-instance-from-db-snapshot --db-instance-identifier capstone-team01-db-restore --db-snapshot-identifier capstone-team01-db-w7 --db-instance-class db.t3.micro --db-subnet-group-name dbsg-team01 --vpc-security-group-ids $DBSG --no-publicly-accessible --query DBInstance.DBInstanceStatus --output text; aws rds wait db-instance-available --db-instance-identifier capstone-team01-db-restore; aws rds describe-db-instances --db-instance-identifier capstone-team01-db-restore --query "DBInstances[0].[DBInstanceStatus, Endpoint.Address]" --output text', explain: 'A new instance built from the snapshot, with a new endpoint — the application would be pointed at it.', sample: 'creating\navailable\tcapstone-team01-db-restore.abc123.us-east-1.rds.amazonaws.com' },
    ], ['available'], 'A restore is a new database, not the old one repaired: the endpoint changes, and the runbook has to say where the application reads the new one from.'),
    both(s(8, 'dev', 4), 'Delete the restored instance', 'Gone, no final snapshot.', CONSOLE, [
      'RDS → capstone-team01-db-restore → Actions → Delete: no final snapshot, acknowledge. Delete.',
    ], [
      { cmd: 'aws rds delete-db-instance --db-instance-identifier capstone-team01-db-restore --skip-final-snapshot --query DBInstance.DBInstanceStatus --output text', explain: 'The proof is recorded; the hourly instance is not needed any more.', sample: 'deleting' },
    ], ['deleting'], 'The snapshot stays; the restore was the drill. Keeping the restored instance would double the database bill for no reason.'),
    rec(8, 'dev', 'Website and database restore', ['What you deleted and restored, and how.', 'The snapshot restored, the time it took, the new endpoint.'], 'The plan proves both restores were done, not planned.'),
  ], { cost: { usd: 0.018, per: 'hour', note: 'The restored single-AZ db.t3.micro while it exists; deleted at the end of the task.' } }),
  T(8, 'secops', 'Run a timed recovery drill and tear the fleet down', 'Take the fleet to zero as if a zone failed, time its return against the RTO, delete the balancer, group and template, read the bill.', 55,
    ['SAA-C03 · Design Resilient Architectures', 'Recovery drills', 'RTO measurement', 'Tear-down and cost review'], ['The drill is timed against the RTO', 'The ALB, the group, the target group and the template are deleted', 'This month’s cost is read'],
    [doc('Elastic Load Balancing — target health', 'elasticloadbalancing/latest/application/target-group-health-checks.html', 'the healthy threshold and interval: how long a fresh instance takes to receive traffic — the floor of your RTO'),
     doc('AWS Cost Explorer', 'cost-management/latest/userguide/ce-what-is.html', 'the “Filtering and grouping” paragraph: group by service to see what this week’s fleet, balancer and database cost')],
    'The fleet runs for the minutes of the drill; the ALB is deleted at the end of this task, so Week 8 closes with nothing billing by the hour. Stop or delete anything you started.', [
    both(s(8, 'secops', 1), 'Start the clock and wake the fleet', 'Note the time; desired 2; wait for two healthy targets.', CONSOLE, [
      'Write the time. EC2 → Auto Scaling groups → asg-web-team01 → Edit: desired 2. Update.',
      'Target groups → tg-web-team01 → Targets: refresh until two rows read healthy. Write the time again.',
    ], [
      { cmd: 'START=$(date +%s); aws autoscaling set-desired-capacity --auto-scaling-group-name asg-web-team01 --desired-capacity 2; TG=$(aws elbv2 describe-target-groups --names tg-web-team01 --query "TargetGroups[0].TargetGroupArn" --output text); until [ "$(aws elbv2 describe-target-health --target-group-arn $TG --query "length(TargetHealthDescriptions[?TargetHealth.State==\'healthy\'])" --output text)" = "2" ]; do sleep 10; done; echo "RTO $(( $(date +%s) - START )) s"', explain: 'From zero instances to two healthy targets, timed by the shell: that number is the measured RTO.', sample: 'RTO 187 s' },
    ], ['RTO'], 'An RTO in the plan is a promise; this is the measurement. Three minutes from nothing to serving is what a two-zone group with a launch template buys.'),
    both(s(8, 'secops', 2), 'Serve through it, then tear it all down', 'Curl the ALB once, then delete the ALB, group, target group, template.', CONSOLE, [
      'Open the ALB DNS name once: the page answers.',
      'EC2 → Load balancers → alb-web-team01 → Delete. Auto Scaling groups → asg-web-team01 → Delete (force). Target groups → tg-web-team01 → Delete. Launch templates → lt-web-team01 → Delete.',
    ], [
      { cmd: 'DNS=$(aws elbv2 describe-load-balancers --names alb-web-team01 --query "LoadBalancers[0].DNSName" --output text); curl -s http://$DNS; ALB=$(aws elbv2 describe-load-balancers --names alb-web-team01 --query "LoadBalancers[0].LoadBalancerArn" --output text); aws elbv2 delete-load-balancer --load-balancer-arn $ALB; aws autoscaling delete-auto-scaling-group --auto-scaling-group-name asg-web-team01 --force-delete; sleep 60; aws elbv2 delete-target-group --target-group-arn $TG; aws ec2 delete-launch-template --launch-template-name lt-web-team01 --query LaunchTemplate.LaunchTemplateName --output text', explain: 'One request through the balancer, then everything that bills by the hour is deleted, template last.', sample: 'web OK from us-east-1b\nlt-web-team01' },
    ], ['web OK', 'lt-web-team01'], 'Week 9 rebuilds all of this from the template in one command; keeping it by hand would be paying twice for the same design.'),
    both(s(8, 'secops', 3), 'Read the month’s cost', 'What the fleet, the balancer and the database cost.', CONSOLE, [
      'Billing → Cost Explorer → this month → group by Service: read EC2, Elastic Load Balancing, RDS. Compare with the $20 budget.',
    ], [
      { cmd: 'aws ce get-cost-and-usage --time-period Start=$(date +%Y-%m-01),End=$(date +%F) --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE --query "ResultsByTime[0].Groups[?contains(Keys[0],\'Compute\') || contains(Keys[0],\'Load\') || contains(Keys[0],\'Relational\')].[Keys[0], Metrics.UnblendedCost.Amount]" --output text', explain: 'Month-to-date by service for the three things this quarter paid for.', sample: 'Amazon Elastic Compute Cloud - Compute\t1.42\nAmazon Elastic Load Balancing\t9.80\nAmazon Relational Database Service\t0.21' },
    ], ['Load Balancing'], 'A design is not finished until its bill has been read against the budget it was given.'),
    rec(8, 'secops', 'Drill and cost', ['Drill start, service back, RTO met, lessons.', 'What was deleted; the month’s cost by service against the $20 budget.'], 'The plan shows the drill, and the course ends with nothing billing by the hour.'),
  ], { cost: { usd: 0.0329, per: 'hour', note: 'The fleet and the ALB for the minutes of the drill; all of it deleted inside the task.' } }),

  // ── Week 9 — Infrastructure as code, tested ────────────────────────────
  T(9, 'arch', 'Map the template and set the environment strategy', 'Match five template resources to their diagram nodes, write ADR-001, and decide what differs between the dev and prod stacks.', 40,
    ['DOP-C02 · Configuration Management and IaC', 'CloudFormation templates', 'Architecture decision records', 'Environment strategy'], ['Five resources mapped', 'ADR-001 written', 'The dev and prod differences are listed'],
    [doc('Template anatomy', 'AWSCloudFormation/latest/UserGuide/template-anatomy.html', 'the section list — Parameters, Conditions, Resources, Outputs — and that only Resources is required'),
     doc('Infrastructure Composer', 'infrastructure-composer/latest/dg/what-is-composer.html', 'the “Import a template” note: paste template.yaml and it draws the same picture the Guide draws')],
    'Free: reading. Infrastructure Composer is free; nothing is deployed.', [
    portal(s(9, 'arch', 1), 'Read the template beside the diagram', 'Click five resources and read their template lines.', 'Guide → Architecture & IaC', [
      'Click a node: the template scrolls to its logical id.',
      'Note its Type, and which Parameters and !Ref it reads.',
      'Tick "Template dependencies": arrows now show !Ref, !GetAtt and DependsOn.',
    ], 'Five resources traced from the picture to the code.', 'The diagram is generated from the template: if they ever disagree, the template is the truth.'),
    portal(s(9, 'arch', 2), 'Write ADR-001', 'Record the decision that the environment is a template.', 'The document', [
      'Context: eight weeks of hand-built resources drift; a new team must get the same environment.',
      'Decision: the environment is a CloudFormation stack; the console is for reading.',
      'Rejected: building by hand — no record, no rebuild, no review. Consequences: every change is a pull request from Week 10.',
    ], 'ADR-001 with context, decision, rejected option and consequences.', 'An Architecture Decision Record keeps the decision and the alternatives, so the next team does not reopen it without new facts. The rejected option matters most: it shows the decision was a choice.'),
    portal(s(9, 'arch', 3), 'Decide what differs between dev and prod', 'List every parameter whose value changes, and why.', 'The document', [
      'Same template, two stacks: dev with FleetSize 0 and a $5 budget; prod with FleetSize 2 and $20.',
      'What never differs: the security groups, encryption, the role policies. Write why.',
    ], 'A table of parameters with their dev and prod values, and the list of what never changes.', 'The exam calls this an environment strategy: one template, parameterised only where environments genuinely differ, so a prod bug can be reproduced in dev.'),
    rec(9, 'arch', 'Template map, Portal vs code, ADR-001', ['Five rows: resource, node, parameter.', 'One thing code does that the console cannot.', 'ADR-001 and the dev/prod differences.'], 'The map lets anyone navigate the template; the strategy says what a stack is allowed to vary.'),
  ]),
  T(9, 'infra', 'Inventory with the CLI and detect drift', 'List every tagged resource, change one tag by hand, run drift detection on the stack and read which resource drifted.', 40,
    ['DOP-C02 · Configuration Management and IaC', 'Resource Groups Tagging API', 'Stack drift detection', 'Configuration drift'], ['Five or more resources listed with tags', 'Drift detection reports the changed resource as MODIFIED'],
    [doc('Find resources to tag', 'tag-editor/latest/userguide/find-resources-to-tag.html', 'the Tag Editor search: region, “All supported resource types”, and a tag filter — the same list the shell command returns'),
     doc('Detect drift on a stack', 'AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html', 'the drift statuses — IN_SYNC, MODIFIED, DELETED — and the note that drift detection reads the live resource, not the template')],
    'Free: Tag Editor, the tagging API and drift detection cost nothing.', [
    both(s(9, 'infra', 1), 'List the resources', 'List every resource tagged project=capstone.', CONSOLE, [
      'Resource Groups & Tag Editor → Tag Editor. Region us-east-1, resource types All, tag project = capstone. Search.',
      'Read the table: ARN, type, and the owner tag column. Export to CSV.',
    ], [
      { cmd: 'aws resourcegroupstaggingapi get-resources --tag-filters Key=project,Values=capstone --query "ResourceTagMappingList[].[ResourceARN, Tags[?Key==\'owner\']|[0].Value]" --output text', explain: 'Every resource carrying the project tag, with its owner. Anything you built but do not see here broke the standard.', sample: 'arn:aws:ec2:us-east-1:123456789012:vpc/vpc-0a1b2c3d4e5f67890\tteam01-infra' },
    ], ['arn:aws:'], 'The gaps you find now are what the Config rule flags in Week 11.'),
    both(s(9, 'infra', 2), 'Change one tag by hand', 'Edit the VPC’s owner tag in the console.', CONSOLE, [
      'VPC → Your VPCs → vpc-capstone-team01 → Tags → Manage tags: owner = somebody-else. Save.',
    ], [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); aws ec2 create-tags --resources $VPC --tags Key=owner,Value=somebody-else && echo tagged', explain: 'A console change the template knows nothing about — the everyday way an environment drifts.', sample: 'tagged' },
    ], ['tagged'], 'Drift is not a mistake someone makes on purpose; it is a quick fix at 5 p.m. that nobody wrote down.'),
    both(s(9, 'infra', 3), 'Detect the drift', 'Run drift detection; read the MODIFIED resource.', CONSOLE, [
      'CloudFormation → capstone-team01 → Stack actions → Detect drift. View drift results: Vpc shows MODIFIED, expected and actual side by side.',
      'Put the tag back: Manage tags → owner = team01-infra.',
    ], [
      { cmd: 'DID=$(aws cloudformation detect-stack-drift --stack-name capstone-team01 --query StackDriftDetectionId --output text); sleep 45; aws cloudformation describe-stack-resource-drifts --stack-name capstone-team01 --stack-resource-drift-status-filters MODIFIED --query "StackResourceDrifts[].[LogicalResourceId, StackResourceDriftStatus]" --output text; aws ec2 create-tags --resources $VPC --tags Key=owner,Value=team01-infra', explain: 'Drift detection compares every live resource with the template and names the ones that differ; then the tag is put back.', sample: 'Vpc\tMODIFIED' },
    ], ['MODIFIED'], 'The exam asks how you find out the environment no longer matches the code: this is the command, and Week 12 fixes drift the proper way, through the pipeline.'),
    rec(9, 'infra', 'CLI inventory and drift', ['Five or more resources, their type, tagged or not.', 'The resource that drifted, its expected and actual value.'], 'The inventory is the before-picture for the template; the drift result is why the template must be the only writer.'),
  ]),
  T(9, 'dev', 'Fill the starter and deploy to dev', 'Complete the starter template, preview it with a change set, deploy a dev stack, then delete it.', 55,
    ['DOP-C02 · Configuration Management and IaC', 'Template anatomy', 'Change sets', 'Stacks'], ['The change set previewed', 'CREATE_COMPLETE', 'The dev stack is deleted'],
    [doc('Create a change set', 'AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets-create.html', 'the “Create a change set for a new stack” steps and the Changes tab: Add, Modify, Remove, with Replacement True highlighted'),
     doc('Delete a stack', 'AWSCloudFormation/latest/UserGuide/cfn-console-delete-stack.html', 'the DELETE_FAILED paragraph about non-empty buckets — empty the bucket first')],
    'The dev stack is a second copy: with FleetSize 0 and no database it is the free tier plus the balancer at about $0.0225 an hour. Delete it the same session.', [
    portal(s(9, 'dev', 1), 'Fill the starter', 'Download the starter and fill its blanks.', 'Guide → Architecture & IaC → Starter', [
      'Download template.yaml and both parameter files into infra/.',
      'Replace each FILL-ME using its hint; the Full tab is the answer key.',
      'In params-dev.json set TeamId to t01dev, so names never clash with what you built by hand.',
    ], 'A template with no FILL-ME left.', 'Filling blanks in a real template teaches its structure faster than writing one from nothing.'),
    both(s(9, 'dev', 2), 'Preview, then deploy', 'Create a change set, read it, execute it.', CONSOLE, [
      'CloudFormation → Stacks → Create stack → With new resources → Upload template.yaml. Name capstone-team01-dev; enter the dev parameter values.',
      'Tick the IAM capability box. Instead of Submit: Create change set → wait → Changes tab lists every Add.',
      'Execute change set. Events tab until CREATE_COMPLETE (CloudFront takes ten minutes).',
    ], [
      { cmd: 'STACK=capstone-team01-dev; aws cloudformation create-change-set --stack-name $STACK --change-set-name preview --change-set-type CREATE --template-body file://infra/template.yaml --parameters file://infra/params-dev.json --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM -o none; aws cloudformation wait change-set-create-complete --stack-name $STACK --change-set-name preview; aws cloudformation describe-change-set --stack-name $STACK --change-set-name preview --query "length(Changes)"', explain: 'A change set lists every add, modify and remove before anything happens.', sample: '58' },
      { cmd: 'aws cloudformation execute-change-set --stack-name $STACK --change-set-name preview && aws cloudformation wait stack-create-complete --stack-name $STACK; aws cloudformation describe-stacks --stack-name $STACK --query "Stacks[0].StackStatus" --output text', explain: 'CloudFront makes this take ten minutes or so.', sample: 'CREATE_COMPLETE' },
    ], ['58', 'CREATE_COMPLETE'], 'Preview first, always: a change set is how you catch a replacement you did not mean.', {
      fixes: [{ symptom: 'ROLLBACK_COMPLETE, "already exists"', fix: 'A name clashes with something you built by hand. Use a different TeamId in params-dev.json and retry.' }],
    }),
    rec(9, 'dev', 'Deployment', ['Blanks filled, change set result, stack status.'], 'The deployment record Week 10 automates.'),
    both(s(9, 'dev', 3), 'Delete the dev stack', 'Delete the dev stack.', CONSOLE, [
      'CloudFormation → Stacks → capstone-team01-dev → Delete → confirm.',
      'If it ends DELETE_FAILED: empty the dev bucket in S3, then Delete again.',
    ], [
      { cmd: 'aws cloudformation delete-stack --stack-name capstone-team01-dev && echo deleting', explain: 'The whole copy goes in one command — that is what a stack is for. Empty its bucket first if the delete fails.', sample: 'deleting' },
    ], ['deleting'], 'A second environment doubles the bill until it is gone.'),
  ], { cost: { usd: 0.0225, per: 'hour', note: 'The dev stack’s balancer while the stack exists; deleted inside the task.' } }),
  T(9, 'secops', 'Parameter files, validation and policy as code', 'Set dev and prod values with no secrets, validate and lint the template, then write two Guard rules and prove the template passes them.', 50,
    ['DOP-C02 · Security and Compliance', 'Parameter files', 'cfn-lint', 'AWS CloudFormation Guard'], ['The template validates and lints clean', 'Two Guard rules pass', 'No secret in either file'],
    [doc('Validate a template', 'AWSCloudFormation/latest/UserGuide/using-cfn-validate-template.html', 'what validation checks — syntax and the parameter list — and what it does not: property values, which is what cfn-lint adds'),
     doc('What is AWS CloudFormation Guard?', 'cfn-guard/latest/ug/what-is-guard.html', 'the “policy as code” paragraph: rules written against the template, run before anything deploys — the gate Week 10 puts in the pipeline')],
    'Free: validation, linting and Guard run in CloudShell. Nothing is deployed in this task.', [
    portal(s(9, 'secops', 1), 'Set the parameter values', 'Set TeamId, Environment, OwnerTag, FleetSize per environment.', 'infra/ in the repository', [
      'dev: Environment dev, TeamId t01dev, FleetSize 0, CreateDatabase false.',
      'prod: Environment prod, TeamId team01, FleetSize 2, BudgetAmount 20.',
      'No passwords or keys: the template takes none; the database password is managed by RDS.',
    ], 'Two parameter files differing only where environments differ.', 'Parameters are what changes between environments; everything else stays identical, which is what makes prod predictable.'),
    both(s(9, 'secops', 2), 'Validate and lint', 'Validate the template, then lint it.', CONSOLE, [
      'CloudFormation → Create stack → Upload template.yaml → Next: the parameter form appears only if the template is valid. Cancel.',
      'Infrastructure Composer → Import template.yaml: red markers show property errors, the same ones cfn-lint reports.',
    ], [
      { cmd: 'aws cloudformation validate-template --template-body file://infra/template.yaml --query "Parameters[].ParameterKey" --output text', explain: 'Checks the syntax and lists the parameters it expects.', sample: 'TeamId\tEnvironment\tOwnerTag\tAlertEmail\tInstanceType\tLatestAmiId\tBudgetAmount\tThroughWeek\tGithubRepository\tFleetSize\tCreateDatabase' },
      { cmd: 'pip install -q cfn-lint && cfn-lint infra/template.yaml && echo "lint clean"', explain: 'cfn-lint checks property names and values against the real resource specs.', sample: 'lint clean' },
    ], ['TeamId', 'lint clean'], 'Validation is the cheapest test in the whole course.'),
    both(s(9, 'secops', 3), 'Write two Guard rules and run them', 'No SSH from the internet; every volume encrypted.', 'CloudShell (Guard has no console)', [
      'Write infra/rules.guard with two rules: no security-group ingress on port 22 from 0.0.0.0/0; every volume Encrypted true.',
      'Run Guard against the template: PASS.',
    ], [
      { cmd: 'cat > infra/rules.guard <<\'EOF\'\nlet sgs = Resources.*[ Type == "AWS::EC2::SecurityGroup" ]\nrule no_ssh_from_internet when %sgs !empty {\n  %sgs.Properties.SecurityGroupIngress[*] { when FromPort == 22 { CidrIp != "0.0.0.0/0" } }\n}\nlet vols = Resources.*[ Type == "AWS::EC2::Volume" ]\nrule volumes_encrypted when %vols !empty {\n  %vols.Properties.Encrypted == true\n}\nEOF\ncurl --proto "=https" --tlsv1.2 -sSf https://raw.githubusercontent.com/aws-cloudformation/cloudformation-guard/main/install-guard.sh | sh >/dev/null 2>&1; ~/.guard/bin/cfn-guard validate --data infra/template.yaml --rules infra/rules.guard --show-summary pass,fail 2>&1 | tail -3', explain: 'Two rules in Guard’s language, then the verdict on the template. A rule that fails names the resource and the line.', sample: 'Rule(s):\n  PASS/SKIP infra/rules.guard/no_ssh_from_internet\n  PASS/SKIP infra/rules.guard/volumes_encrypted' },
    ], ['PASS'], 'Policy as code is the exam’s Security and Compliance domain in one file: the rule is reviewed like code, versioned like code, and runs before every deploy in Week 10.'),
    rec(9, 'secops', 'Parameters and policy as code', ['Each parameter: dev value, prod value, secret or not.', 'The two Guard rules and their result.'], 'The environments, side by side, and the rules every deploy must pass.'),
  ]),

  // ── Week 10 — Pipelines with stages and gates ──────────────────────────
  T(10, 'arch', 'Write the change request and the gates', 'Write a change request for one template change, name the checks that gate dev and prod, and approve it in a pull request.', 35,
    ['DOP-C02 · SDLC Automation', 'Change enablement', 'Stage gates', 'Risk and rollback'], ['The RFC has risk, rollback and approver', 'The gates before dev and prod are named'],
    [doc('Creating a pull request', 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request', 'the description box and the Reviewers panel — the RFC goes in the description, the approver is the reviewer'),
     doc('Deployment pipeline reference', 'wellarchitected/latest/devops-guidance/deployment-pipeline-reference-architecture.html', 'the stage list — source, build, test, beta, gamma, prod — and the gate between each: what the course’s dev and prod stages are a small version of')],
    'Free: GitHub pull requests.', [
    portal(s(10, 'arch', 1), 'Write the RFC in a pull request', 'Open a pull request with the RFC as its description.', 'github.com — Pull requests', [
      'The change: e.g. raise the fleet’s maximum to four.',
      'Risk, rollback plan, and the tests the pipeline runs.',
      'Request review from a teammate; approve only after it passes.',
    ], 'A pull request with a complete RFC, reviewed and approved.', 'The pull request is the change record: who asked, who approved, what ran.'),
    portal(s(10, 'arch', 2), 'Name the gates', 'Before dev: lint and Guard; before prod: green dev plus a reviewer.', 'The pull request description', [
      'Gate 1, before dev: cfn-lint clean, Guard PASS, a change set with no Replacement.',
      'Gate 2, before prod: the dev stack deployed, the counter answered, and the Architect approved the prod environment.',
    ], 'Two gates written down, each a list of checks a machine or a person makes.', 'A pipeline without gates is a faster way to break prod. The exam’s SDLC domain is mostly about which check sits before which stage.'),
    rec(10, 'arch', 'Request for change', ['Change, risk, rollback plan, approver.', 'The gates before dev and before prod.'], 'The release record’s front page.'),
  ]),
  T(10, 'infra', 'Protect main, add the environments and require the checks', 'Require a review and the passing checks before anything reaches main, and add dev and prod environments with a required reviewer on prod.', 35,
    ['DOP-C02 · SDLC Automation', 'Branch protection', 'Required status checks', 'Deployment environments'], ['Main requires a review and the checks', 'prod needs approval'],
    [doc('Managing a branch protection rule', 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule', 'the three boxes you tick: require a pull request, required approvals, require status checks'),
     doc('Using environments for deployment', 'https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment', 'the “Required reviewers” protection rule and how a job that names the environment waits for it')],
    'Free: branch protection and environments on a private repository need a GitHub Free organisation or a public repo; a personal private repo needs Pro — use an organisation.', [
    portal(s(10, 'infra', 1), 'Protect main', 'Require a pull request, one review and the checks.', 'Repository → Settings → Branches', [
      'Add a rule for main.',
      'Require a pull request, one approval, and the status check named check (lint and Guard).',
      'Block force pushes.',
    ], 'Direct pushes to main are refused, and a red check blocks the merge.', 'Protection turns a convention into a rule the platform enforces.'),
    portal(s(10, 'infra', 2), 'Add the environments', 'dev with no gate; prod with a required reviewer.', 'Repository → Settings → Environments', [
      'New environment: dev. New environment: prod.',
      'prod → Required reviewers: the Architect. Deployment branches: main only.',
    ], 'Jobs targeting prod wait for approval; jobs targeting dev run at once.', 'The pause before prod is where a human reads the change set.'),
    rec(10, 'infra', 'Repository controls', ['The branch rule, the required check, the two environments.'], 'Evidence of change control.'),
  ]),
  T(10, 'dev', 'Build the staged pipeline', 'Add a workflow with a check job, a dev deploy and a prod deploy behind the environment gate, keeping the change set as an artifact.', 55,
    ['DOP-C02 · SDLC Automation', 'GitHub Actions jobs and needs', 'Artifacts', 'CloudFormation deploy'], ['The check job runs lint and Guard', 'dev deploys, then prod waits for approval', 'A run deployed both stacks'],
    [doc('Configuring OpenID Connect in AWS', 'https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services', 'the workflow example: permissions id-token write, and the configure-aws-credentials step with role-to-assume'),
     doc('Storing and sharing data from a workflow', 'https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts', 'the upload-artifact step: the change-set listing is kept with the run, so a reviewer reads what was about to change')],
    'Free: 2,000 GitHub Actions minutes a month on a private repo; a full run uses about fifteen. The dev stack adds a balancer at about $0.0225 an hour; delete it after the run.', [
    portal(s(10, 'dev', 1), 'Write the check job', 'Lint and Guard on every pull request.', 'The repository: .github/workflows/deploy.yml', [
      'On: pull_request and push to main. Job check: checkout → pip install cfn-lint → cfn-lint infra/template.yaml → install Guard → cfn-guard validate.',
      'Name the job check: that is the status the branch rule requires.',
    ], 'A pull request shows the check job; a broken template turns it red.', 'The first gate is a machine: nothing a human has to remember.'),
    portal(s(10, 'dev', 2), 'Write the dev and prod deploys', 'Two jobs, needs, environments, an artifact.', 'The same workflow file', [
      'Job deploy-dev: needs check, environment dev, permissions id-token write; configure-aws-credentials with the role variable.',
      'Steps: create a change set with params-dev, describe it to a file, upload-artifact, execute.',
      'Job deploy-prod: needs deploy-dev, environment prod; the same steps with params-prod.',
    ], 'A workflow of three jobs: check → deploy-dev → deploy-prod.', 'needs is the pipeline’s spine: prod cannot start until dev finished, and the environment holds it for the reviewer.'),
    portal(s(10, 'dev', 3), 'Run it end to end', 'Merge; watch dev deploy; approve prod.', 'Repository → Actions', [
      'Merge the pull request. Open the run: check is green, deploy-dev deploys, deploy-prod waits.',
      'Download the artifact: the change-set listing. Approve prod; the run finishes green.',
    ], 'A green three-job run, with the change set kept as an artifact.', 'From now on nobody deploys from a laptop, and every deploy leaves the preview it was approved on.', {
      fixes: [
        { symptom: 'Not authorized to perform sts:AssumeRoleWithWebIdentity', fix: 'The OIDC task is not finished, or the role’s trust policy names a different repo or branch.' },
        { symptom: 'AlreadyExists for the function or log group', fix: 'Your hand-built Week 3 resources share the name. Delete them, or deploy prod with a different TeamId.' },
      ],
    }),
    both(s(10, 'dev', 4), 'Delete the dev stack', 'Delete the dev stack until the next run.', CONSOLE, [
      'CloudFormation → Stacks → capstone-t01dev → Delete → confirm.',
    ], [
      { cmd: 'aws cloudformation delete-stack --stack-name capstone-t01dev && echo deleting', explain: 'The dev copy is recreated by the next run; between runs it only costs.', sample: 'deleting' },
    ], ['deleting'], 'A staged pipeline that leaves dev running all month doubles the balancer bill for nothing.'),
    rec(10, 'dev', 'Pipeline runs', ['Run number, the three stages, result, the artifact.'], 'The release record.'),
  ], { cost: { usd: 0.0225, per: 'hour', note: 'The dev stack’s balancer between the run and the delete.' } }),
  T(10, 'secops', 'Sign in with OIDC, scope the deploy role and test rollback', 'Let GitHub assume a role with no stored key, read and narrow what it may do, then break a deploy and watch it roll back.', 55,
    ['DOP-C02 · Security and Compliance', 'IAM OIDC providers', 'Trust policies', 'Stack rollback'], ['No access key exists', 'The deploy role’s policy is reviewed', 'A failed deploy rolled back'],
    [doc('Create an OpenID Connect identity provider in IAM', 'IAM/latest/UserGuide/id_roles_providers_create_oidc.html', 'the provider URL and audience for GitHub — token.actions.githubusercontent.com and sts.amazonaws.com — and the “Assign role” button after'),
     doc('Stack failure options', 'AWSCloudFormation/latest/UserGuide/stack-failure-options.html', 'the default behaviour: roll back all resources — the UPDATE_ROLLBACK_COMPLETE you will see')],
    'Free: IAM providers and roles. The broken deploy rolls back to the same stack.', [
    both(s(10, 'secops', 1), 'Trust GitHub', 'Add GitHub as an OIDC identity provider.', CONSOLE, [
      'IAM → Identity providers → Add provider → OpenID Connect.',
      'Provider URL https://token.actions.githubusercontent.com, audience sts.amazonaws.com. Add provider.',
    ], [
      { cmd: 'aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 --query OpenIDConnectProviderArn --output text', explain: 'Tells AWS to accept tokens GitHub signs. The thumbprint is GitHub’s published value.', sample: 'arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com' },
    ], ['oidc-provider'], 'A stored key can leak and works from anywhere; an OIDC token works only for that repo, for an hour.'),
    portal(s(10, 'secops', 2), 'Create the deploy role', 'Create a role GitHub may assume for this repo only.', 'IAM → Roles → Create role → Web identity', [
      'Provider token.actions.githubusercontent.com, audience sts.amazonaws.com.',
      'GitHub organization and repository capstone-team01, branch main.',
      'Permissions: enough for the stack; name it gh-capstone-team01. Save its ARN as a repo variable.',
    ], 'The role’s trust policy names repo:ORG/capstone-team01:ref:refs/heads/main.', 'The trust policy is the fence: any other repo’s token is refused.'),
    both(s(10, 'secops', 3), 'Read what the role may do, and narrow it', 'List its policies; replace AdministratorAccess if present.', CONSOLE, [
      'IAM → Roles → gh-capstone-team01 → Permissions: detach AdministratorAccess if attached.',
      'Attach PowerUserAccess plus an inline policy for iam:PassRole and the role actions the stack needs.',
      'Last accessed: the services the role actually used in its first run.',
    ], [
      { cmd: 'aws iam list-attached-role-policies --role-name gh-capstone-team01 --query "AttachedPolicies[].PolicyName" --output text; aws iam generate-service-last-accessed-details --arn $(aws iam get-role --role-name gh-capstone-team01 --query Role.Arn --output text) --query JobId --output text', explain: 'What is attached, and a job that lists which services the role really touched — the evidence for narrowing it.', sample: 'PowerUserAccess\n3f1c…' },
    ], ['PowerUserAccess'], 'The pipeline’s role is the most powerful identity in the account that nobody logs in as. The exam asks you to scope it from what it used, not from what it might need.'),
    portal(s(10, 'secops', 4), 'Break it, watch it roll back', 'Push a broken template, watch it roll back, revert.', 'github.com, then CloudFormation → Events', [
      'In a branch, set a value lint cannot catch (an instance type the Region lacks). Merge after review.',
      'The run fails at deploy-dev; the stack shows UPDATE_ROLLBACK_COMPLETE; prod never ran.',
      'Revert the commit; the next run is green.',
    ], 'A red run stopped at dev, a rollback, then a green revert.', 'CloudFormation rolls back a failed update by itself, and the staged pipeline kept the failure out of prod — you proved both, not assumed them.'),
    rec(10, 'secops', 'Keyless access and rollback', ['How the pipeline signs in, no keys stored, the role’s policies, the rollback test.'], 'Evidence the pipeline is safe, scoped and reversible.'),
  ]),

  // ── Week 11 — Release strategies and observability ─────────────────────
  T(11, 'arch', 'Review cost by service and set the service levels', 'Break this month’s cost down by service with an action for each, then write the three service-level indicators the dashboard will watch.', 35,
    ['DOP-C02 · Monitoring and Logging', 'Cost Explorer', 'SLIs and SLOs', 'Error budgets'], ['Three services with spend and an action', 'Three SLIs with targets'],
    [doc('Exploring your data using Cost Explorer', 'cost-management/latest/userguide/ce-exploring-data.html', 'the Group by → Service control and the “Download CSV” button under the chart'),
     doc('Application Load Balancer metrics', 'elasticloadbalancing/latest/application/load-balancer-cloudwatch-metrics.html', 'HTTPCode_Target_5XX_Count, TargetResponseTime and HealthyHostCount — the three metrics the course’s SLIs are built from')],
    'Free: the Cost Explorer console. The shell alternative costs $0.01 per call.', [
    both(s(11, 'arch', 1), 'Break down the cost', 'Group this month’s cost by service.', CONSOLE, [
      'Billing and Cost Management → Cost Explorer. Date range: month to date. Group by: Service.',
      'Budgets: how close is capstone-team01 to its alert?',
      'For each service, one action: keep, reduce, remove.',
    ], [
      { cmd: 'aws ce get-cost-and-usage --time-period Start=$(date +%Y-%m-01),End=$(date -d tomorrow +%F) --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE --query "ResultsByTime[0].Groups[].[Keys[0], Metrics.UnblendedCost.Amount]" --output text', explain: 'The same table from the shell. Each call costs $0.01 — the console is free.', sample: 'Amazon Elastic Compute Cloud - Compute\t0.31\nAmazon Elastic Load Balancing\t4.12\nAmazon Simple Storage Service\t0.01' },
    ], ['Amazon'], 'Every line has an owner and a decision — that is FinOps in one table.'),
    portal(s(11, 'arch', 2), 'Write the service levels', 'Availability, latency, errors: an indicator, a target, a window.', 'The document', [
      'Availability: healthy targets ≥ 1 for 99.5% of five-minute windows a month.',
      'Latency: TargetResponseTime p95 under 500 ms. Errors: 5XX under 1% of requests.',
      'The error budget: how many bad minutes a month the targets allow, and who decides to spend it.',
    ], 'Three SLIs with targets and the monthly error budget.', 'An SLO turns “is it up?” into a number a dashboard can show and a release can be judged against — the canary in App’s task is rolled back when it eats the budget.'),
    rec(11, 'arch', 'Cost by service and service levels', ['Three or more services, spend, action.', 'Three SLIs, targets, the error budget.'], 'The cost section of the governance report, and the levels the dashboard watches.'),
  ]),
  T(11, 'infra', 'Blue/green the fleet with weighted target groups', 'Publish a new template version, launch a green fleet into a second target group, shift the listener 90/10 to 0/100, retire blue, park.', 60,
    ['DOP-C02 · Resilient Cloud Solutions', 'Blue/green deployments', 'Weighted target groups', 'Launch template versions'], ['Ten percent of requests reach green, then all of them', 'Blue is retired with no failed request', 'The fleet is parked'],
    [doc('Listener rules for your Application Load Balancer', 'elasticloadbalancing/latest/application/listener-update-rules.html', 'the forward action with multiple target groups and weights — the knob a blue/green shift turns'),
     doc('Launch template versions', 'autoscaling/ec2/userguide/launch-templates.html#launch-template-versions', 'how a group picks a version — $Latest, $Default or a number — and why a new version is the unit of a release')],
    'Blue and green together are up to four t3.micro for about half an hour (about $0.03 an hour beyond the free one) plus the balancer; park the group at zero at the end. Stop or delete anything you started.', [
    both(s(11, 'infra', 1), 'Publish the green version and its target group', 'Version 2 serves a new page; a second target group.', CONSOLE, [
      'EC2 → Launch templates → lt-web-team01 → Actions → Modify template (create new version): user data writes "web v2 from $AZ". Create.',
      'Target groups → Create tg-web-green-team01: HTTP 80, the VPC, health check /, interval 10 s.',
    ], [
      { cmd: 'UD=$(echo -e "#!/bin/bash\\ndnf install -y nginx\\nTOKEN=\\$(curl -sX PUT http://169.254.169.254/latest/api/token -H \\"X-aws-ec2-metadata-token-ttl-seconds: 60\\")\\nAZ=\\$(curl -s -H \\"X-aws-ec2-metadata-token: \\$TOKEN\\" http://169.254.169.254/latest/meta-data/placement/availability-zone)\\necho \\"web v2 from \\$AZ\\" > /usr/share/nginx/html/index.html\\nsystemctl enable --now nginx" | base64 -w0); aws ec2 create-launch-template-version --launch-template-name lt-web-team01 --source-version 1 --launch-template-data "{\\"UserData\\":\\"$UD\\"}" --query LaunchTemplateVersion.VersionNumber --output text; VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); GREEN=$(aws elbv2 create-target-group --name tg-web-green-team01 --protocol HTTP --port 80 --vpc-id $VPC --health-check-path / --health-check-interval-seconds 10 --healthy-threshold-count 2 --query "TargetGroups[0].TargetGroupArn" --output text); echo $GREEN', explain: 'Version 2 of the template changes only the page; the new target group is where green will register.', sample: '2\narn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg-web-green-team01/def456' },
    ], ['tg-web-green-team01'], 'A release is a new template version, never an edit to running instances: blue keeps serving while green is built beside it.'),
    both(s(11, 'infra', 2), 'Launch green beside blue', 'A second group on version 2, registered to green.', CONSOLE, [
      'Auto Scaling groups → asg-web-team01 → Edit: desired 2 (blue).',
      'Create group asg-web-green-team01: lt-web-team01 version 2, both public subnets, desired 2, target group tg-web-green-team01.',
      'Target groups: two healthy in each.',
    ], [
      { cmd: 'SUBA=$(aws ec2 describe-subnets --filters Name=tag:Name,Values=snet-public-team01 --query "Subnets[0].SubnetId" --output text); SUBB=$(aws ec2 describe-subnets --filters Name=tag:Name,Values=snet-public-b-team01 --query "Subnets[0].SubnetId" --output text); aws autoscaling set-desired-capacity --auto-scaling-group-name asg-web-team01 --desired-capacity 2; aws autoscaling create-auto-scaling-group --auto-scaling-group-name asg-web-green-team01 --launch-template LaunchTemplateName=lt-web-team01,Version=2 --min-size 0 --max-size 3 --desired-capacity 2 --vpc-zone-identifier "$SUBA,$SUBB" --target-group-arns $GREEN --tags Key=owner,Value=team01,PropagateAtLaunch=true; sleep 180; aws elbv2 describe-target-health --target-group-arn $GREEN --query "TargetHealthDescriptions[].TargetHealth.State" --output text', explain: 'Blue awake, green launched on version 2 into its own target group; three minutes later two healthy green targets.', sample: 'healthy\thealthy' },
    ], ['healthy'], 'Two complete fleets, one address: the balancer decides who answers, and that decision is a number you can change in a second.'),
    both(s(11, 'infra', 3), 'Shift 90/10, then 0/100', 'Weight the listener; count the versions; shift all.', CONSOLE, [
      'Load balancers → alb-web-team01 → Listeners → HTTP:80 → Edit default action: forward to tg-web-team01 weight 90, tg-web-green-team01 weight 10. Save.',
      'Open the ALB address twenty times: about two in twenty say v2. Then set weights 0 / 100.',
    ], [
      { cmd: 'TG=$(aws elbv2 describe-target-groups --names tg-web-team01 --query "TargetGroups[0].TargetGroupArn" --output text); L=$(aws elbv2 describe-listeners --load-balancer-arn $(aws elbv2 describe-load-balancers --names alb-web-team01 --query "LoadBalancers[0].LoadBalancerArn" --output text) --query "Listeners[0].ListenerArn" --output text); aws elbv2 modify-listener --listener-arn $L --default-actions "[{\\"Type\\":\\"forward\\",\\"ForwardConfig\\":{\\"TargetGroups\\":[{\\"TargetGroupArn\\":\\"$TG\\",\\"Weight\\":90},{\\"TargetGroupArn\\":\\"$GREEN\\",\\"Weight\\":10}]}}]" -o none; DNS=$(aws elbv2 describe-load-balancers --names alb-web-team01 --query "LoadBalancers[0].DNSName" --output text); for i in $(seq 20); do curl -s http://$DNS; done | cut -d" " -f1-2 | sort | uniq -c', explain: 'Ninety to ten, then twenty requests: most say "web OK", a couple say "web v2". That is the canary.', sample: '     18 web OK\n      2 web v2' },
      { cmd: 'aws elbv2 modify-listener --listener-arn $L --default-actions "[{\\"Type\\":\\"forward\\",\\"ForwardConfig\\":{\\"TargetGroups\\":[{\\"TargetGroupArn\\":\\"$TG\\",\\"Weight\\":0},{\\"TargetGroupArn\\":\\"$GREEN\\",\\"Weight\\":100}]}}]" -o none; for i in $(seq 10); do curl -s http://$DNS; done | cut -d" " -f1-2 | sort | uniq -c', explain: 'All traffic to green; every answer is v2 and no request failed.', sample: '     10 web v2' },
    ], ['web v2'], 'Blue/green on the exam is this listener edit: the rollback is the same command with the weights reversed, and it takes a second, not a redeploy.'),
    both(s(11, 'infra', 4), 'Retire blue and park', 'Blue to zero; green parked; keep the green group.', CONSOLE, [
      'Auto Scaling groups → asg-web-team01 → Edit: desired 0. asg-web-green-team01 → Edit: desired 0.',
    ], [
      { cmd: 'aws autoscaling set-desired-capacity --auto-scaling-group-name asg-web-team01 --desired-capacity 0; aws autoscaling set-desired-capacity --auto-scaling-group-name asg-web-green-team01 --desired-capacity 0; sleep 30; aws autoscaling describe-auto-scaling-groups --query "AutoScalingGroups[?starts_with(AutoScalingGroupName, \'asg-web\')].[AutoScalingGroupName, DesiredCapacity]" --output text', explain: 'Both fleets parked. The green group is next week’s blue.', sample: 'asg-web-green-team01\t0\nasg-web-team01\t0' },
    ], ['0'], 'The release is over when the old fleet is gone and nothing that bills by the hour is left running.'),
    rec(11, 'infra', 'Release strategy', ['Blue/green: the versions, the weights, requests counted at 90/10 and at 0/100, failed requests (none).'], 'The governance report shows a release that could be undone in a second.'),
  ], { cost: { usd: 0.054, per: 'hour', note: 'Up to three billed t3.micro and the balancer while blue and green run together; both parked at the end.' } }),
  T(11, 'dev', 'Canary the counter with alias weights and an alarm', 'Publish versions 1 and 2 of the function, send ten percent of traffic to version 2 through an alias, and let an alarm decide.', 50,
    ['DOP-C02 · Resilient Cloud Solutions', 'Lambda versions and aliases', 'Weighted aliases', 'Alarm-driven rollback'], ['Two versions and a weighted alias exist', 'An alarm watches the alias', 'The canary was promoted or rolled back by weight'],
    [doc('Lambda function versions', 'lambda/latest/dg/configuration-versions.html', 'the “Publishing a function version” paragraph: a version is immutable code plus configuration, which is what makes a rollback exact'),
     doc('Lambda aliases and traffic shifting', 'lambda/latest/dg/configuration-aliases.html#configuring-alias-routing', 'the routing configuration: one additional version with a weight — the ten percent that is your canary')],
    'Free: versions, aliases and one alarm stay inside the Lambda and CloudWatch free tiers.', [
    both(s(11, 'dev', 1), 'Publish version 1 and version 2', 'Freeze the current code, change it, publish again.', CONSOLE, [
      'Lambda → capstone-team01-counter → Actions → Publish new version: 1.',
      'Code: add a response header X-Release: v2. Deploy. Actions → Publish new version: 2.',
    ], [
      { cmd: 'aws lambda publish-version --function-name capstone-team01-counter --query Version --output text; aws lambda update-function-configuration --function-name capstone-team01-counter --description "v2: release header" -o none; aws lambda wait function-updated --function-name capstone-team01-counter; aws lambda publish-version --function-name capstone-team01-counter --query Version --output text', explain: 'Version 1 is the code as it runs today; version 2 is the change. Both are immutable from here.', sample: '1\n2' },
    ], ['1', '2'], 'A version is a release you can point at and return to; $LATEST is whatever someone last saved.'),
    both(s(11, 'dev', 2), 'Create the alias with a ten percent canary', 'live → version 1, with 10% to version 2.', CONSOLE, [
      'Lambda → Aliases → Create alias live: version 1, weighted alias on, additional version 2 at 10%. Save.',
      'API Gateway → the integration → point it at the live alias (the function ARN with :live).',
    ], [
      { cmd: 'aws lambda create-alias --function-name capstone-team01-counter --name live --function-version 1 --routing-config AdditionalVersionWeights={"2"=0.1} --query "RoutingConfig.AdditionalVersionWeights" --output json', explain: 'The alias sends nine in ten invocations to version 1 and one in ten to version 2.', sample: '{\n    "2": 0.1\n}' },
    ], ['0.1'], 'The canary is a weight, not a second deployment: the ten percent are real visitors, and the alarm decides if they were served well.'),
    both(s(11, 'dev', 3), 'Alarm on the canary’s errors', 'Errors on version 2 over 0 in five minutes.', CONSOLE, [
      'CloudWatch → Alarms → Create: Lambda → By Function Name and Resource → capstone-team01-counter:2 Errors, Sum, 5 minutes, > 0.',
      'Notify the team topic. Name it counter-canary-errors.',
    ], [
      { cmd: 'TOPIC=$(aws sns list-topics --query "Topics[?contains(TopicArn,\'team01\')].TopicArn | [0]" --output text); aws cloudwatch put-metric-alarm --alarm-name counter-canary-errors --namespace AWS/Lambda --metric-name Errors --dimensions Name=FunctionName,Value=capstone-team01-counter Name=Resource,Value=capstone-team01-counter:2 --statistic Sum --period 300 --evaluation-periods 1 --threshold 0 --comparison-operator GreaterThanThreshold --alarm-actions $TOPIC && aws cloudwatch describe-alarms --alarm-names counter-canary-errors --query "MetricAlarms[0].StateValue" --output text', explain: 'The Resource dimension scopes the alarm to version 2 alone, so a healthy version 1 cannot hide a failing canary.', sample: 'INSUFFICIENT_DATA' },
    ], ['INSUFFICIENT_DATA'], 'This alarm is the rollback trigger: in production a CodeDeploy deployment group would read it and shift the weight back without a human.'),
    both(s(11, 'dev', 4), 'Promote or roll back', 'Alarm OK: everything to version 2; alarm: back to version 1.', CONSOLE, [
      'Call the API thirty times; CloudWatch → counter-canary-errors stays OK.',
      'Lambda → Aliases → live → Edit: version 2, no additional version. Save. (A rollback would be: version 1, additional 0%.)',
    ], [
      { cmd: 'URL=$(aws apigatewayv2 get-apis --query "Items[?Name==\'capstone-team01-api\'].ApiEndpoint" --output text); for i in $(seq 30); do curl -s -o /dev/null $URL/count; done; STATE=$(aws cloudwatch describe-alarms --alarm-names counter-canary-errors --query "MetricAlarms[0].StateValue" --output text); echo $STATE; if [ "$STATE" != "ALARM" ]; then aws lambda update-alias --function-name capstone-team01-counter --name live --function-version 2 --routing-config AdditionalVersionWeights={} --query FunctionVersion --output text; else aws lambda update-alias --function-name capstone-team01-counter --name live --function-version 1 --routing-config AdditionalVersionWeights={} --query FunctionVersion --output text; fi', explain: 'Thirty real calls, then the alarm decides: no alarm promotes version 2, an alarm sends everything back to version 1.', sample: 'OK\n2' },
    ], ['OK'], 'Promote or roll back is one alias update either way; the decision came from a metric, not a feeling.'),
    rec(11, 'dev', 'Release strategy', ['Canary: the versions, the weight, the alarm, the thirty calls, promoted or rolled back.'], 'The governance report shows a release judged by an alarm.'),
  ]),
  T(11, 'secops', 'Build the dashboard, require the tag with Config and read the audit trail', 'Build a dashboard of the service levels, turn on the required-tags rule and prove it flags, then find who changed what in CloudTrail.', 55,
    ['DOP-C02 · Monitoring and Logging', 'CloudWatch dashboards', 'AWS Config managed rules', 'CloudTrail'], ['A dashboard shows the three SLIs', 'An untagged resource is NON_COMPLIANT', 'Three audit events recorded'],
    [doc('Using Amazon CloudWatch dashboards', 'AmazonCloudWatch/latest/monitoring/CloudWatch_Dashboards.html', 'the “Create a dashboard” steps and that three dashboards with up to fifty metrics are free'),
     doc('required-tags', 'config/latest/developerguide/required-tags.html', 'the tag1Key parameter and the resource types the rule can evaluate — buckets are on the list, which is why the test uses one'),
     doc('Viewing CloudTrail events', 'awscloudtrail/latest/userguide/view-cloudtrail-events.html', 'the Event history page and its lookup attributes — Read-only = false shows only changes')],
    'Dashboards and 90 days of event history are free. Config charges about $0.003 per item recorded and per rule evaluation — cents; record only three resource types.', [
    both(s(11, 'secops', 1), 'Build the dashboard', 'Healthy hosts, p95 latency, 5XX, canary errors.', CONSOLE, [
      'CloudWatch → Dashboards → Create capstone-team01: widgets for ALB HealthyHostCount, TargetResponseTime p95, HTTPCode_Target_5XX_Count.',
      'Add Lambda Errors for the counter and the ledger. Save.',
    ], [
      { cmd: 'ALB=$(aws elbv2 describe-load-balancers --names alb-web-team01 --query "LoadBalancers[0].LoadBalancerArn" --output text | cut -d/ -f2-); aws cloudwatch put-dashboard --dashboard-name capstone-team01 --dashboard-body "{\\"widgets\\":[{\\"type\\":\\"metric\\",\\"x\\":0,\\"y\\":0,\\"width\\":12,\\"height\\":6,\\"properties\\":{\\"title\\":\\"Availability and latency\\",\\"metrics\\":[[\\"AWS/ApplicationELB\\",\\"HealthyHostCount\\",\\"LoadBalancer\\",\\"$ALB\\",\\"TargetGroup\\",\\"$(aws elbv2 describe-target-groups --names tg-web-team01 --query \'TargetGroups[0].TargetGroupArn\' --output text | cut -d: -f6)\\"],[\\"AWS/ApplicationELB\\",\\"TargetResponseTime\\",\\"LoadBalancer\\",\\"$ALB\\",{\\"stat\\":\\"p95\\"}]],\\"region\\":\\"us-east-1\\"}},{\\"type\\":\\"metric\\",\\"x\\":12,\\"y\\":0,\\"width\\":12,\\"height\\":6,\\"properties\\":{\\"title\\":\\"Errors\\",\\"metrics\\":[[\\"AWS/ApplicationELB\\",\\"HTTPCode_Target_5XX_Count\\",\\"LoadBalancer\\",\\"$ALB\\"],[\\"AWS/Lambda\\",\\"Errors\\",\\"FunctionName\\",\\"capstone-team01-counter\\"],[\\"AWS/Lambda\\",\\"Errors\\",\\"FunctionName\\",\\"capstone-team01-ledger\\"]],\\"region\\":\\"us-east-1\\"}}]}" --query "length(DashboardValidationMessages)" --output text', explain: 'Two widgets: the availability and latency SLIs on the left, every error count on the right. Zero validation messages means it saved.', sample: '0' },
    ], ['0'], 'The dashboard is the service levels made visible: when the on-call opens it at 2 a.m. the three numbers the Architect wrote are the first thing they see.'),
    portal(s(11, 'secops', 2), 'Turn on the rule', 'Add the required-tags managed rule.', 'AWS Config → Rules → Add rule', [
      'If asked, set up Config: record specific types — EC2, S3, Lambda. One recorder per region only.',
      'Managed rule required-tags. tag1Key: owner.',
      'Scope: EC2 instances, S3 buckets, Lambda functions.',
    ], 'The rule required-tags is listed and evaluating.', 'Config records and checks; it does not block. The deny version is an SCP, which needs AWS Organizations.'),
    both(s(11, 'secops', 3), 'Prove it flags', 'Create an untagged bucket and read its compliance.', CONSOLE, [
      'S3 → Create bucket capstone-team01-untagged-NNNN, no tags. Wait two minutes.',
      'AWS Config → Rules → required-tags: the bucket is listed Noncompliant.',
      'Delete the bucket afterwards.',
    ], [
      { cmd: 'B=capstone-team01-untagged-$RANDOM; aws s3 mb s3://$B -o none; sleep 120; aws configservice get-compliance-details-by-config-rule --config-rule-name required-tags --compliance-types NON_COMPLIANT --query "EvaluationResults[].[EvaluationResultIdentifier.EvaluationResultQualifier.ResourceId, ComplianceType]" --output text; aws s3 rb s3://$B', explain: 'Evaluation takes a minute or two; the bucket is removed afterwards.', sample: 'capstone-team01-untagged-18342\tNON_COMPLIANT' },
    ], ['NON_COMPLIANT'], 'Enforcement proved by a finding, not assumed.'),
    both(s(11, 'secops', 4), 'Read the audit trail', 'List this week’s write events.', CONSOLE, [
      'CloudTrail → Event history. Lookup attribute: Read-only → false.',
      'Read Event time, User name, Event name for the top rows.',
    ], [
      { cmd: 'aws cloudtrail lookup-events --lookup-attributes AttributeKey=ReadOnly,AttributeValue=false --max-results 8 --query "Events[].[EventTime, Username, EventName]" --output text', explain: 'Every management API call is recorded with who made it. Event history keeps 90 days free.', sample: '2026-11-10T14:02:07+00:00\tteam01-infra\tModifyListener' },
    ], ['team01'], 'The audit log is how an incident answers “who did this, and when” — and this week it says who shifted the listener.'),
    rec(11, 'secops', 'Policy, dashboard and audit', ['The dashboard and its widgets.', 'The rule and the result of the test.', 'Three events: when, who, operation.'], 'Governance the platform checks for you, and the picture the on-call reads.'),
  ]),

  // ── Week 12 — Incident, compliance and handover ────────────────────────
  T(12, 'arch', 'Assemble the handover package', 'Catalogue every service, list the open risks, and sign the package off.', 45,
    ['DOP-C02 · Incident and Event Response', 'Service transition', 'Risk registers'], ['Four services catalogued', 'Three risks', 'Signed off'],
    [doc('Operational Excellence pillar', 'wellarchitected/latest/operational-excellence-pillar/welcome.html', 'the “Operate” and “Evolve” sections: runbooks, playbooks and known risks are what a handover carries')],
    'Free: a document. Nothing is deployed.', [
    portal(s(12, 'arch', 1), 'Catalogue the services', 'List each service with its URL, owner and runbook.', 'The document', [
      'Website, API, the fleet behind the balancer, the database snapshot, the queue, the pipeline.',
      'Each points to the runbook section that fixes it, and to the dashboard widget that shows it.',
    ], 'A six-row service catalogue.', 'The catalogue is the map a new team uses on day one.'),
    portal(s(12, 'arch', 2), 'List the risks', 'Turn open findings into risks.', 'The document', [
      'Start from Week 11’s open findings and the error budget spent.',
      'Add: the balancer serves HTTP only, the database is opt-in, Config detects but does not block.',
    ], 'Three or more risks, each with a mitigation.', 'Handing over known risks honestly is what makes a handover trustworthy.'),
    rec(12, 'arch', 'Service catalogue, Risk register, Sign-off', ['Catalogue, risks, and the sign-off.'], 'The capstone — the package you defend.'),
  ]),
  T(12, 'infra', 'Rebuild from the template and automate the restart', 'Rebuild the environment as a new stack from the template, time it, run an automation runbook against the tools instance, delete the stack.', 55,
    ['DOP-C02 · Resilient Cloud Solutions', 'Disaster recovery by redeploy', 'Systems Manager Automation', 'Runbooks as code'], ['The rebuild completed, timed', 'An automation runbook ran to Success', 'The recovery stack is deleted'],
    [doc('Create a stack from the console', 'AWSCloudFormation/latest/UserGuide/cfn-console-create-stack.html', 'the Events tab: the timestamps of the first and last event are your measured recovery time'),
     doc('AWS Systems Manager Automation', 'systems-manager/latest/userguide/systems-manager-automation.html', 'the “Automation runbooks” paragraph and AWS-RestartEC2Instance: a repair a machine runs the same way every time')],
    'The recovery stack is a full second copy for the minutes it exists — the balancer at $0.0225 an hour, the fleet parked. Delete it in the same session. Stop or delete anything you started.', [
    both(s(12, 'infra', 1), 'Rebuild it', 'Deploy the template as a recovery stack, timed.', CONSOLE, [
      'Note the time. CloudFormation → Create stack → Upload template.yaml. Name capstone-team01-recover; TeamId t01rec, Environment prod, FleetSize 0.',
      'Tick the IAM capability, Submit. Events tab until CREATE_COMPLETE; note the time.',
    ], [
      { cmd: 'date +%T; aws cloudformation deploy --stack-name capstone-team01-recover --template-file infra/template.yaml --parameter-overrides TeamId=t01rec Environment=prod OwnerTag=team01-infra AlertEmail=team01-alerts@school.edu FleetSize=0 --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM; date +%T', explain: 'The whole company, rebuilt from one file. TeamId t01rec keeps names from clashing. The two times are your recovery time.', sample: '15:10:02\nSuccessfully created/updated stack - capstone-team01-recover\n15:26:47' },
    ], ['Successfully created'], 'If it can be rebuilt from code, it can be recovered from anything.'),
    both(s(12, 'infra', 2), 'Run an automation runbook', 'Restart the tools instance with AWS-RestartEC2Instance.', CONSOLE, [
      'Systems Manager → Automation → Execute automation → AWS-RestartEC2Instance → InstanceId: the recovery stack’s tools instance → Execute. Watch the steps go to Success.',
    ], [
      { cmd: 'RID=$(aws cloudformation describe-stack-resource --stack-name capstone-team01-recover --logical-resource-id ToolsInstance --query StackResourceDetail.PhysicalResourceId --output text); EX=$(aws ssm start-automation-execution --document-name AWS-RestartEC2Instance --parameters InstanceId=$RID --query AutomationExecutionId --output text); sleep 90; aws ssm get-automation-execution --automation-execution-id $EX --query "AutomationExecution.[AutomationExecutionStatus, length(StepExecutions)]" --output text', explain: 'A runbook AWS wrote, run as one call: stop, wait, start, wait. Success, with the steps it took.', sample: 'Success\t2' },
    ], ['Success'], 'The exam’s incident domain asks for repairs nobody types by hand: an automation document is the runbook as code, and an alarm can start it.'),
    both(s(12, 'infra', 3), 'Delete the recovery stack', 'Delete the recovery stack.', CONSOLE, [
      'CloudFormation → Stacks → capstone-team01-recover → Delete → confirm.',
      'Empty its bucket first if the delete fails.',
    ], [
      { cmd: 'aws cloudformation delete-stack --stack-name capstone-team01-recover && echo deleting', explain: 'Keep the evidence, not the bill.', sample: 'deleting' },
    ], ['deleting'], 'Clean-up is part of the drill.'),
    rec(12, 'infra', 'Scenario outcomes', ['Recover: rebuild from the template — time and result.', 'The automation runbook, its steps and its result.'], 'Proof the template is the environment, and that the repair is a document.'),
  ], { cost: { usd: 0.0225, per: 'hour', note: 'The recovery stack’s balancer while it exists; deleted inside the task.' } }),
  T(12, 'dev', 'Fix an app failure through CI', 'Break the function’s configuration by hand, prove the drift, then restore it by re-running the pipeline — no console fixes.', 45,
    ['DOP-C02 · Incident and Event Response', 'Configuration drift', 'Redeploy as a fix'], ['The API failed, drift was detected, and CI recovered it'],
    [doc('Detect drift on a stack', 'AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html', 'the Stack actions → Detect drift steps and the drift status MODIFIED on a resource — the proof the console change is drift'),
     doc('Lambda environment variables', 'lambda/latest/dg/configuration-envvars.html', 'the Edit steps — the same place you break it')],
    'Free: one setting changed, one pipeline run (about fifteen of the 2,000 free minutes).', [
    both(s(12, 'dev', 1), 'Break it', 'Point the function at a table that does not exist.', CONSOLE, [
      'CloudFormation → capstone-team01 → Resources → CounterFunction → the link opens Lambda.',
      'Configuration → Environment variables → Edit: TABLE_NAME = wrong. Save.',
      'Open the stack’s ApiUrl output in a browser: Internal Server Error.',
    ], [
      { cmd: 'FN=$(aws cloudformation describe-stack-resource --stack-name capstone-team01 --logical-resource-id CounterFunction --query StackResourceDetail.PhysicalResourceId --output text); aws lambda update-function-configuration --function-name $FN --environment "Variables={TABLE_NAME=wrong}" -o none; sleep 10; curl -s -o /dev/null -w "%{http_code}\\n" $(aws cloudformation describe-stacks --stack-name capstone-team01 --query "Stacks[0].Outputs[?OutputKey==\'ApiUrl\'].OutputValue" --output text)', explain: 'The stack’s API now fails with a server error.', sample: '500' },
    ], ['500'], 'This is drift: the running environment no longer matches the code. The dashboard’s error widget shows it before anyone reports it.'),
    portal(s(12, 'dev', 2), 'Fix it through CI', 'Detect the drift, re-run the deploy workflow, retest.', 'Repository → Actions → deploy → Run workflow', [
      'CloudFormation → the stack → Stack actions → Detect drift: CounterFunction is MODIFIED.',
      'Run the workflow on main; approve prod.',
      'curl the API again: a count, not 500.',
    ], 'The API returns a count again after the pipeline run.', 'CloudFormation only fixes what it changes — if nothing changed in the template, update a tag to force it, and record that lesson.'),
    rec(12, 'dev', 'Scenario outcomes', ['App failure fixed through CI — time and result.'], 'The second scenario of the handover.'),
  ]),
  T(12, 'secops', 'Contain a security incident and write the post-mortem', 'Open SSH to the internet on purpose, detect it in CloudTrail, contain it, write the timeline, root cause and prevention, run the checklist.', 50,
    ['DOP-C02 · Incident and Event Response', 'Detection', 'Containment', 'Post-incident review'], ['The rule was detected and removed', 'A post-mortem with a timeline and a prevention', 'Checklist complete'],
    [doc('Viewing CloudTrail events', 'awscloudtrail/latest/userguide/view-cloudtrail-events.html', 'the Event name lookup attribute — AuthorizeSecurityGroupIngress answers “who opened it”'),
     doc('restricted-ssh', 'config/latest/developerguide/restricted-ssh.html', 'what the rule checks: any security group with port 22 open to 0.0.0.0/0 — the automatic detection you name as prevention')],
    'Free: one rule added and removed; CloudTrail event history. The fleet is parked, so nothing is exposed.', [
    both(s(12, 'secops', 1), 'Inject the incident', 'Add an SSH rule open to the internet.', CONSOLE, [
      'EC2 → Security groups → sg-tools-team01 → Inbound rules → Edit → Add rule: SSH, source Anywhere-IPv4. Save.',
    ], [
      { cmd: 'SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr 0.0.0.0/0 --query "SecurityGroupRules[0].CidrIpv4" --output text', explain: 'The exact misconfiguration attackers scan for. The fleet is parked, so nothing is exposed.', sample: '0.0.0.0/0' },
    ], ['0.0.0.0/0'], 'A realistic incident: one bad rule, easy to add, easy to miss.'),
    both(s(12, 'secops', 2), 'Detect and contain', 'Find it in CloudTrail, then revoke it.', CONSOLE, [
      'CloudTrail → Event history → Event name = AuthorizeSecurityGroupIngress: read the time and user. Allow a few minutes.',
      'EC2 → Security groups → sg-tools-team01 → Inbound rules → Edit → delete the 0.0.0.0/0 row → Save.',
    ], [
      { cmd: 'aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=AuthorizeSecurityGroupIngress --max-results 1 --query "Events[0].[EventTime, Username]" --output text', explain: 'Who opened it, and when — the first question of any incident. Allow a few minutes for the event to appear.', sample: '2026-12-01T10:02:07+00:00\tteam01-secops' },
      { cmd: 'aws ec2 revoke-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr 0.0.0.0/0 --query Return --output text && echo contained', explain: 'Containment: remove the exposure first, investigate after.', sample: 'True\ncontained' },
    ], ['contained'], 'Contain, then learn. Prevention: the Config rule restricted-ssh flags this automatically, and Week 9’s Guard rule would have refused it in a template.'),
    portal(s(12, 'secops', 3), 'Write the post-mortem', 'Timeline, root cause, blast radius, prevention, owner.', 'The document', [
      'Timeline: opened at, detected at, contained at — from CloudTrail and your notes; time to detect and time to contain.',
      'Root cause (a console change outside the pipeline), the blast radius, and the prevention with an owner and a date.',
    ], 'A blameless post-mortem a stranger could learn from.', 'The exam’s incident domain ends every incident the same way: a timeline, a root cause and a change that stops the repeat — not a name.'),
    rec(12, 'secops', 'Scenario outcomes, Post-mortem, Sign-off', ['Security incident contained — time and result.', 'The post-mortem: timeline, root cause, prevention, owner.', 'Final checklist: no open ports, no keys, budget alerting, fleet parked.'], 'The third scenario, the lesson, and the security sign-off.'),
  ]),

];

const WEEKS = cloudWeeks(P, PLANS);

/** Week 0 of the later courses: the previous course's end state, from the template. */
function awsSetup(through: 4 | 8, previous: string, fw: string): Task {
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
    learn: ['Deploying a CloudFormation stack', 'The ThroughWeek parameter', 'What a template does not carry'],
    definitionOfDone: [`The stack holds every resource Architecture v${through} shows`, 'The website answers over HTTPS'],
    steps: [
      portal(`${P}-w0-setup-s1`, 'Check what your team already has', `Skip this week if your team finished ${previous}.`, 'AWS console — CloudFormation → Stacks', [
        'Open the stack capstone-team01, if it exists.',
        'Compare its resources with the Guide’s picture for Week 0.',
        'Everything there already? Go to Week 1.',
      ], 'You know whether the environment exists or must be deployed.', 'A team that built it keeps it; a team that did not gets the same starting point from the template, so both do the same Week 1.'),
      portal(`${P}-w0-setup-s2`, 'Get the template', 'Download template.yaml and the prod parameter file.', 'Guide → Architecture & IaC → Full template', [
        'Download template.yaml and params-prod.json into infra/.',
        'Set TeamId, OwnerTag and AlertEmail in the parameter file.',
      ], 'The two files sit in infra/ with your team’s values.', 'The template describes the whole twelve-week environment; the ThroughWeek parameter deploys only as far as this course starts.'),
      both(`${P}-w0-setup-s3`, `Deploy through Week ${through}`, `Deploy the stack with ThroughWeek=${through}.`, CONSOLE, [
        'CloudFormation → Create stack → With new resources → Upload template.yaml. Stack name capstone-team01.',
        `Parameters: ThroughWeek ${through}, TeamId team01, OwnerTag, AlertEmail. Tick the IAM capability. Submit.`,
        'Events tab until CREATE_COMPLETE — CloudFront takes about ten minutes.',
      ], [
        { cmd: `aws cloudformation deploy --stack-name capstone-team01 --template-file infra/template.yaml --parameter-overrides ThroughWeek=${through} TeamId=team01 OwnerTag=team01-lead AlertEmail=team01-alerts@school.edu --capabilities CAPABILITY_IAM`, explain: `ThroughWeek=${through} leaves every later resource out — the Week5Plus condition in the template does the choosing. CloudFront makes this take about ten minutes.`, sample: 'Waiting for changeset to be created..\nWaiting for stack create/update to complete\nSuccessfully created/updated stack - capstone-team01' },
      ], ['Successfully created'], 'One command, and the environment is exactly where the previous course left it.', {
        fixes: [{ symptom: 'AlreadyExists for a bucket or function', fix: 'A hand-built resource shares the name. Delete it, or use another TeamId and record why.' }],
      }),
      both(`${P}-w0-setup-s4`, 'Publish what the template cannot', 'Upload the site to the bucket the stack made.', CONSOLE, [
        'CloudFormation → capstone-team01 → Outputs: copy SiteBucketName and SiteUrl.',
        'S3 → that bucket → Upload → your site/ files.',
        'Open SiteUrl: your page over HTTPS.',
      ], [
        { cmd: "BUCKET=$(aws cloudformation describe-stacks --stack-name capstone-team01 --query \"Stacks[0].Outputs[?OutputKey=='SiteBucketName'].OutputValue\" --output text); aws s3 sync ./site s3://$BUCKET && aws cloudformation describe-stacks --stack-name capstone-team01 --query \"Stacks[0].Outputs[?OutputKey=='SiteUrl'].OutputValue\" --output text", explain: 'Site files never live in a template; the Lambda code does (inline). The site comes from the team repository.', sample: 'upload: site/index.html to s3://capstone-team01-site/index.html\nhttps://d111111abcdef8.cloudfront.net' },
      ], ['cloudfront.net'], 'Infrastructure is in the template; content is in the repository. Both are needed for a working site.'),
      STOP(0, 'setup'),
    ],
  };
}

const AWS_BLOCKS = {
  fundamentals: {
    weeks: [1, 4] as [number, number],
    id: 'aws-cloud-practitioner',
    title: 'AWS Cloud Practitioner Capstone',
    description: 'Build a small company in AWS in four weeks: a VPC, an instance, a website with HTTPS and a serverless counter — then watch it run.',
    certification: 'Cloud Practitioner (CLF-C02)',
    level: 'entry' as const,
    audience: 'Four roles build a real AWS environment in four weeks, on a $5 budget. Start here.',
    framework: 'AWS_CLF',
    authoredFramework: 'AWS_CLF',
    intro: 'A website behind CloudFront, a serverless visitor counter, one Linux instance, and the first incident worked end to end.',
  },
  architect: {
    weeks: [5, 8] as [number, number],
    id: 'aws-solutions-architect',
    title: 'AWS Solutions Architect Capstone',
    description: 'Run the company’s AWS like production: least-privilege IAM, a private subnet with no open ports, instance administration, backup and recovery.',
    certification: 'Solutions Architect – Associate (SAA-C03)',
    level: 'associate' as const,
    audience: 'Four roles operate the environment the Cloud Practitioner course built. Week 0 deploys it if your team is new.',
    framework: 'AWS_SAA',
    authoredFramework: 'AWS_CLF',
    intro: 'Starts from the Cloud Practitioner environment and adds a table-scoped role, a private subnet and Session Manager, an EBS volume and patching, snapshots and a timed recovery drill.',
  },
  devops: {
    weeks: [9, 12] as [number, number],
    id: 'aws-devops',
    title: 'AWS DevOps Engineer Capstone',
    description: 'Write the company’s AWS as CloudFormation, deploy it from GitHub Actions with no stored keys, check it with Config, and hand it over.',
    certification: 'DevOps Engineer – Professional (DOP-C02)',
    level: 'professional' as const,
    audience: 'Four roles codify, automate, govern and hand over the environment. Week 0 deploys it if your team is new.',
    framework: 'AWS_DOP',
    authoredFramework: 'AWS_CLF',
    intro: 'Starts from the Solutions Architect environment and adds the template, change sets and a dev stack, a reviewed pipeline with OIDC, Config, CloudTrail and posture, and the handover under pressure.',
  },
};

const slice = (b: keyof typeof AWS_BLOCKS, setup?: { week: WeekDef; task: Task }) =>
  sliceCourse(AWS_BLOCKS[b], { vendor: 'AWS', plans: PLANS, tasks: TASKS, weeks: WEEKS, setup });

export const AWS_CLOUD_PRACTITIONER: Course = slice('fundamentals');
export const AWS_SOLUTIONS_ARCHITECT: Course = slice('architect', {
  week: setupWeek(P, 'the Cloud Practitioner course'),
  task: awsSetup(4, 'the Cloud Practitioner course', 'AWS_SAA'),
});
export const AWS_DEVOPS: Course = slice('devops', {
  week: setupWeek(P, 'the Solutions Architect course'),
  task: awsSetup(8, 'the Solutions Architect course', 'AWS_DOP'),
});
export const AWS_COURSES = [AWS_CLOUD_PRACTITIONER, AWS_SOLUTIONS_ARCHITECT, AWS_DEVOPS];
export { AWS_BLOCKS };

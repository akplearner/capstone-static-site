import type { Course, Step, Task, WeekDef } from '../../types';
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
/** Runs a shell script on the instance through Session Manager and prints its output. */
const ssm = (script: string) =>
  `CID=$(aws ssm send-command --instance-ids $IID --document-name AWS-RunShellScript --parameters 'commands=["${script}"]' --query Command.CommandId --output text); sleep 6; aws ssm get-command-invocation --command-id $CID --instance-id $IID --query StandardOutputContent --output text`;

const PLANS: WeekPlan[] = [
  { n: 1, title: 'Cloud concepts and governance', theme: 'Who manages what, a budget, a network', objective: 'Say who manages what, set the standard and the $5 budget, then lay the network everything else sits in.',
    milestone: 'A budget alerts at $4, every planned service has a model and an owner, the VPC and subnet exist, MFA is on.',
    labels: ['Set the standard, the budget and the service model', 'Create the VPC and public subnet', 'Open the team repository and board', 'Create the security group and turn on MFA'] },
  { n: 2, title: 'Core services', theme: 'Compute, storage, network — and what they cost', objective: 'Price it, choose storage classes, publish the website over HTTPS and bring up one small instance reachable only from you.',
    milestone: 'The estimate and storage choices are written, the site loads over HTTPS, the t3.micro runs in its zone, SSH works from your IP only.',
    labels: ['Estimate the cost and choose storage classes', 'Launch the tools instance', 'Publish the website with CloudFront', 'Allow SSH from your IP only'] },
  { n: 3, title: 'Serverless, data and identity', theme: 'A counter behind the site, and the team’s access', objective: 'Add a visitor counter — a Lambda reading and writing DynamoDB — and give the team its group, policy and MFA.',
    milestone: 'The page shows a live visitor count, the team’s group holds ReadOnlyAccess with MFA on, and no key appears in the browser.',
    labels: ['Draw the request flow and say who manages each hop', 'Create the DynamoDB table', 'Build the counter Lambda and API', 'Give the team the right access'] },
  { n: 4, title: 'Monitor, govern, pay', theme: 'Watch it, break it, fix it, audit it', objective: 'Watch cost and errors, read Trusted Advisor, find the change in CloudTrail, and write one failure up as an incident.',
    milestone: 'An alarm emails on Lambda errors, Trusted Advisor is read, the change is found in CloudTrail, one incident is recorded, and spend is reported.',
    labels: ['Report the cost, and read Trusted Advisor and the support plans', 'Alarm on Lambda errors', 'Find a failure in CloudWatch Logs', 'Find who changed it in CloudTrail and write the incident record'] },
  { n: 5, title: 'Identity', theme: 'Least privilege, no secrets', objective: 'Give people and the function exactly the access they need, and no broader.',
    milestone: 'The Lambda role reaches one table only, a group holds ReadOnlyAccess, and a denial is proved.',
    labels: ['Write the access matrix', 'Create a read-only group', 'Scope the Lambda role to the table', 'Prove an access is denied'] },
  { n: 6, title: 'Networking', theme: 'Segment it, close the door', objective: 'Add a private subnet, remove SSH entirely, and administer through Session Manager.',
    milestone: 'A private subnet with no internet route, no inbound rule on the security group, admin through Session Manager.',
    labels: ['Write the network design document', 'Add the private subnet', 'Trace the request paths', 'Remove SSH and use Session Manager'] },
  { n: 7, title: 'Server Admin', theme: 'Volumes, patches, baselines', objective: 'Run the instance like production: right-size it, add a volume, patch it, and baseline it.',
    milestone: 'An EBS volume is mounted at /data, patches are installed, the baseline and runbook are written, and the instance is stopped.',
    labels: ['Decide the instance size', 'Attach and mount an EBS volume', 'Patch with Patch Manager', 'Baseline the instance and write the runbook'] },
  { n: 8, title: 'Backup and Recovery', theme: 'Prove you can get it back', objective: 'Set recovery targets, restore a volume and a web file, and time a recovery drill.',
    milestone: 'RPO and RTO per asset, a volume restored from a snapshot, a deleted file recovered, and a timed drill.',
    labels: ['Set RPO and RTO per asset', 'Restore a volume from a snapshot', 'Recover a deleted web file', 'Run a timed recovery drill'] },
  { n: 9, title: 'Infrastructure as Code', theme: 'The environment, as a file', objective: 'Read the environment as CloudFormation, fill the starter, preview a change set, deploy to dev.',
    milestone: 'The starter template is complete, a change set previewed it, the dev stack deployed, and the parameters are recorded.',
    labels: ['Map the template to the diagram', 'Inventory everything with the CLI', 'Fill the starter and deploy to dev', 'Write parameter files and validate'] },
  { n: 10, title: 'CI/CD', theme: 'Deploy from a pipeline', objective: 'Deploy through GitHub Actions with no stored keys, under a reviewed change request.',
    milestone: 'Main is protected, the pipeline assumes a role with OIDC and deploys the stack, and a rollback was tested.',
    labels: ['Write and approve the change request', 'Protect main and add an environment', 'Deploy from GitHub Actions', 'Sign in with OIDC and test rollback'] },
  { n: 11, title: 'Governance', theme: 'Rules the platform checks', objective: 'Check the tag standard with AWS Config, read CloudTrail, review posture and cost.',
    milestone: 'Untagged resources are flagged, audit events are read, three findings are owned, and cost is broken down.',
    labels: ['Review cost by service', 'Require the owner tag with Config', 'Query CloudTrail event history', 'Review posture with Trusted Advisor'] },
  { n: 12, title: 'Handover', theme: 'Survive it, then hand it on', objective: 'Recover, fix and contain under pressure, then hand the environment over.',
    milestone: 'Three scenarios survived and recorded, and the handover package is signed off.',
    labels: ['Assemble the handover package', 'Rebuild the environment from the template', 'Fix an app failure through CI', 'Contain a security incident'] },
];

/** One role's task for one week. */
function T(week: number, role: string, title: string, objective: string, minutes: number, learn: string[], done: string[], docs: Task['docs'], freeTier: string, steps: Step[], extra: { prerequisites?: string[]; tools?: string[] } = {}): Task {
  return cloudTask({ id: `${P}-w${week}-${role}`, role, week, title, objective, minutes, file: CLOUD_FILES[week - 1], frameworks: FW, learn, done, docs, freeTier, steps, ...extra });
}
const s = (week: number, role: string, n: number) => `${P}-w${week}-${role}-s${n}`;
const rec = (week: number, role: string, section: string, actions: string[], why: string) =>
  record(s(week, role, 9), CLOUD_FORMS[week - 1], CLOUD_FILES[week - 1], section, actions, why);

/** R92: every hands-on step reads console first, CloudShell second. */
const CONSOLE = 'AWS console · or CloudShell';
const D = 'https://docs.aws.amazon.com/';
const doc = (title: string, path: string, lookFor: string) => ({ title, url: path.startsWith('http') ? path : `${D}${path}`, lookFor });

const STOP = (week: number, role: string): Step =>
  both(s(week, role, 8), 'Stop the instance', 'Stop the instance so it stops costing money.', CONSOLE, [
    'EC2 → Instances → ec2-tools-team01 → Instance state → Stop instance.',
    'Wait until Instance state reads “Stopped”.',
  ], [
    { cmd: `${IID}; aws ec2 stop-instances --instance-ids $IID --query "StoppingInstances[0].CurrentState.Name" --output text`, explain: 'A stopped instance pays only for its disk. Stopping from inside the OS does the same; forgetting does not.', sample: 'stopping' },
    { cmd: 'aws ec2 wait instance-stopped --instance-ids $IID && echo stopped', explain: 'Waits until it is fully stopped.', sample: 'stopped', flags: [
      { flag: 'wait instance-stopped', meaning: 'Block until the state is stopped, then continue.' },
    ] },
  ], ['stopped'], 'Free-tier hours count while it runs: 750 a month covers one instance running all month, not one you forgot plus one you rebuilt.');

const START = `${IID}; aws ec2 start-instances --instance-ids $IID -o text > /dev/null; aws ec2 wait instance-status-ok --instance-ids $IID`;
const START_CLICK = 'EC2 → Instances → ec2-tools-team01 → Instance state → Start instance; wait for “Running”.';

const TASKS: Task[] = [
  // ── Week 1 — Cloud concepts and governance ─────────────────────────────
  T(1, 'arch', 'Set the standard, the budget and the service model', 'Agree names and tags, cap spending at $5, and say who manages what for each planned service.', 45,
    ['CLF-C02 · Cloud Concepts', 'Shared responsibility and IaaS / PaaS / SaaS', 'Budgets and tags', 'How to read a resource name'], ['A $5 budget alerts at 80%', 'The naming and tag table is agreed', 'Every planned service has a model and a responsibility line'],
    [doc('Shared responsibility model', 'https://aws.amazon.com/compliance/shared-responsibility-model/', 'the diagram: AWS is responsible for security OF the cloud, you for security IN the cloud — which rows are yours changes with the service'),
     doc('Creating a cost budget', 'cost-management/latest/userguide/budgets-create.html', 'the “Create a budget” steps and the alert-threshold table — Actual vs Forecasted, and where the email goes'),
     doc('Tagging best practices', 'whitepapers/latest/tagging-best-practices/tagging-best-practices.html', 'the “Tagging categories” list — technical, business, security, automation — and pick one key from each')],
    'Free: AWS Budgets gives two budgets free, the Free Tier usage alerts are on by default, and CloudShell is free. Nothing is deployed this task.', [
    both(s(1, 'arch', 1), 'Create the $5 budget', 'Create a $5 monthly budget that emails the team.', CONSOLE, [
      'Billing and Cost Management → Budgets → Create budget → Use a template → Monthly cost budget.',
      'Name capstone-team01, amount 5, email recipients: the team email. Create budget.',
      'Cost Explorer → Launch Cost Explorer once: it needs a day to fill. Billing preferences: tick “Receive Free Tier usage alerts”.',
      'Open CloudShell (the >_ icon) once: your CLI, signed in already.',
    ], [
      { cmd: 'ACCT=$(aws sts get-caller-identity --query Account --output text); aws budgets create-budget --account-id $ACCT --budget \'{"BudgetName":"capstone-team01","BudgetLimit":{"Amount":"5","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}\' --notifications-with-subscribers \'[{"Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":80},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"team01-alerts@school.edu"}]}]\' && echo created', explain: 'The same budget from the shell: $5 a month, an email at 80% of actual spend.', sample: 'created', flags: [
        { flag: 'sts get-caller-identity', meaning: 'Prints who you are; the budget API needs your 12-digit account id.' },
        { flag: '"NotificationType":"ACTUAL" … "Threshold":80', meaning: 'Email when money already spent passes 80% — $4 of $5.' },
      ] },
    ], ['created'], 'Pay-as-you-go means you pay for what runs; a budget does not stop spending, it emails you before a mistake becomes expensive. Actual is money spent; Forecasted guesses month-end. Budgets, Cost Explorer and CloudShell are exam tools.', {
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
      'List the seven things the team will build: VPC, EC2 instance, S3 + CloudFront site, Lambda + API Gateway, DynamoDB, CloudWatch, SNS.',
      'For each: IaaS, PaaS or serverless? Who patches the OS? Who secures the data?',
      'Pick the region (us-east-1) and note that its Availability Zones are separate buildings.',
    ], 'A table: service, model, what we manage, what AWS manages.', 'Shared responsibility is the first exam domain: on EC2 (IaaS) you patch the OS; on Lambda and DynamoDB AWS does, and you own code, data and identities. AWS secures the cloud; you secure what you put in it.'),
    portal(s(1, 'arch', 3), 'Agree the naming and tags', 'Agree one naming pattern and four tags as a team.', 'Team meeting', [
      'Pattern: what-it-is – what-it-is-for – who-owns-it. Example: ec2-tools-team01.',
      'Prefixes: vpc-, snet-, rt-, igw-, sg-, ec2-, ebs-. Buckets, functions and tables start capstone-team01-.',
      'Bucket names must be unique worldwide: add four digits.',
      'Tags on everything: project=capstone, team=team01, env=dev, owner=your-role-email.',
    ], 'A table of prefixes and four tag keys everyone has agreed to use.', 'Read ec2-tools-team01 as three parts: an EC2 instance, for the tools job, owned by team01. Most AWS names are just the Name tag, so the pattern makes a list readable. Tags carry the owner; cost reports group by them.', {
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
    [doc('Regions and Availability Zones', 'AWSEC2/latest/UserGuide/using-regions-availability-zones.html', 'the first two paragraphs: a Region is a separate geographic area; an Availability Zone is one or more datacenters inside it, isolated from the others'),
     doc('Create a VPC', 'vpc/latest/userguide/create-vpc.html', 'the “VPC only” option (this course builds the parts one at a time so you see each) and the CIDR box'),
     doc('Route tables', 'vpc/latest/userguide/VPC_Route_Tables.html', 'the “Main route table” paragraph — every subnet uses it until you associate another, which is why a subnet is public only by its route')],
    'Free: VPCs, subnets, route tables and internet gateways cost nothing. A NAT gateway would cost about $32 a month, which is why this course does not create one.', [
    both(s(1, 'infra', 1), 'Create the VPC and subnet', 'Create the VPC 10.10.0.0/16 and subnet 10.10.1.0/24.', CONSOLE, [
      'VPC → Your VPCs → Create VPC → “VPC only”. Name vpc-capstone-team01, IPv4 CIDR 10.10.0.0/16, tags project, team, env, owner. Create.',
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
    ], ['vpc-', 'subnet-'], 'A Region is a geographic area with several Availability Zones — separate buildings with their own power — and a subnet lives in one zone. A /16 leaves room for 256 /24 subnets.', {
      fixes: [{ symptom: 'CIDR overlaps or is invalid', fix: 'Another VPC already uses 10.10.0.0/16, or you typed /26. Use 10.20.0.0/16 and 10.20.1.0/24 everywhere and record it.' }],
    }),
    both(s(1, 'infra', 2), 'Give it a way out', 'Add an internet gateway and a default route.', CONSOLE, [
      'Internet gateways → Create: name igw-capstone-team01, tags. Then Actions → Attach to VPC → vpc-capstone-team01.',
      'Route tables → Create: name rt-public-team01, VPC vpc-capstone-team01. Routes → Edit routes → Add route 0.0.0.0/0 → Internet Gateway → igw-capstone-team01. Save.',
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
    ], ['associated'], 'Public or private is a routing decision, not a setting on the subnet: rt-public-team01 has the 0.0.0.0/0 route, so snet-public-team01 is public. Week 6 adds a subnet whose table has no such route, and that one is private.', {
      fixes: [{ symptom: 'VPC variable is empty', fix: 'CloudShell restarted. Look the id up: aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01.' }],
    }),
    rec(1, 'infra', 'Landing zone', ['The VPC and subnet names.', 'The address space and the first subnet.'], 'The Network Design Document in Week 6 starts from these numbers.'),
  ], { tools: ['AWS console', 'CloudShell'] }),
  T(1, 'dev', 'Open the team repository and board', 'Create the team repository, a README with the naming standard, and a twelve-week board.', 35,
    ['CLF-C02 · Cloud Technology and Services', 'Where a team keeps its work', 'Project boards'], ['The repo exists with a README', 'The board has this week’s four tasks'],
    [doc('Creating a new repository', 'https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository', 'the visibility choice and the “Initialize this repository with a README” box — tick it, or the repo starts empty'),
     doc('Creating a project', 'https://docs.github.com/en/issues/planning-and-tracking-with-projects/creating-projects/creating-a-project', 'the “Board” layout and how to add a draft item — one card per role per week')],
    'Free: GitHub is free for private repositories and project boards.', [
    portal(s(1, 'dev', 1), 'Create the repository', 'Create the team repository with a README.', 'github.com', [
      'New repository: capstone-team01, private, tick “Add a README file”.',
      'Settings → Collaborators: invite your three teammates.',
      'Create folders site/, api/, infra/, docs/ and paste the naming standard into the README.',
    ], 'A private repository with a README and four folders, shared with the team.', 'Everything the team produces lives here — the site, the function, the template (Week 9) and the documents. Private, because it will hold your real resource names and URLs; a key or the .pem file never goes in.', {
      fixes: [{ symptom: 'A teammate cannot see the repo', fix: 'They must accept the invitation email. Settings → Collaborators shows “Pending” until they do.' }],
    }),
    portal(s(1, 'dev', 2), 'Create the board', 'Create a board with this week’s four tasks.', 'github.com — Projects', [
      'Your profile → Projects → New project → Board. Columns: To do, Doing, Done.',
      'Add one card per role for Week 1 and assign it. Link the board from the README.',
    ], 'A board with four assigned cards, linked from the README.', 'A board makes the four independent tasks visible, so nobody waits on anybody without knowing it. Moving a card is the cheapest status report there is, and operating in the cloud starts with knowing who is doing what.'),
    rec(1, 'dev', 'Team tooling', ['The repository URL.', 'The board URL.'], 'The handover package in Week 12 points a new team at this repository.'),
  ], { tools: ['GitHub'] }),
  T(1, 'secops', 'Create the security group and turn on MFA', 'Create the tools security group with no inbound rules, review who has access to the account, and switch on MFA for your own IAM user.', 45,
    ['CLF-C02 · Security and Compliance', 'Security groups: stateful, allow-only', 'IAM users, groups and the root user', 'Multi-factor authentication'], ['sg-tools-team01 has no inbound rule', 'Access is listed', 'MFA is on for you'],
    [doc('Security groups for your VPC', 'vpc/latest/userguide/vpc-security-groups.html', 'the “Security group basics” list — stateful, allow rules only, and the default outbound rule that lets everything out'),
     doc('Enable a virtual MFA device for an IAM user', 'IAM/latest/UserGuide/id_credentials_mfa_enable_virtual.html', 'the “My security credentials” route and the two consecutive codes the wizard asks for'),
     doc('Security best practices in IAM', 'IAM/latest/UserGuide/best-practices.html', 'the first two items: MFA on the root user, and no access keys for it — that is your access review checklist')],
    'Free: security groups, IAM and MFA cost nothing.', [
    both(s(1, 'secops', 1), 'Create the security group', 'Create sg-tools-team01 in the VPC and read its rules.', CONSOLE, [
      'VPC → Security groups → Create security group. Name sg-tools-team01, description “Tools instance”, VPC vpc-capstone-team01. Tags.',
      'Leave Inbound rules empty. Create security group.',
      'Open it: Inbound rules is empty; Outbound rules has one row, All traffic to 0.0.0.0/0 — the default.',
    ], [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); SG=$(aws ec2 create-security-group --group-name sg-tools-team01 --description "Tools instance" --vpc-id $VPC --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=sg-tools-team01},{Key=project,Value=capstone},{Key=team,Value=team01},{Key=env,Value=dev},{Key=owner,Value=team01-secops}]" --query GroupId --output text); echo $SG', explain: 'A security group is a stateful firewall around an instance. It starts by allowing nothing in.', sample: 'sg-0f1e2d3c4b5a69788', flags: [
        { flag: 'describe-vpcs --filters Name=tag:Name,…', meaning: 'Find the VPC by its Name tag, so no id is typed by hand.' },
        { flag: '--group-name sg-tools-team01', meaning: 'Read it as: the security group for the tools instance, owned by team01.' },
      ] },
      { cmd: 'aws ec2 describe-security-groups --group-ids $SG --query "SecurityGroups[0].{inbound:IpPermissions, outbound:IpPermissionsEgress[0].IpRanges}"', explain: 'Inbound is empty; outbound allows everything, which is the default.', sample: '{ "inbound": [],\n  "outbound": [ { "CidrIp": "0.0.0.0/0" } ] }', flags: [
        { flag: '--query "SecurityGroups[0].{…}"', meaning: 'A JMESPath expression that picks two fields and names them.' },
      ] },
    ], ['sg-', '"inbound": []'], 'Security groups are allow-only: there is no deny rule, only the absence of an allow, and replies to allowed traffic come back (stateful). It attaches to an instance; subnets have network ACLs, left at defaults.', {
      fixes: [{ symptom: 'vpc-capstone-team01 is not listed', fix: 'The Infrastructure Admin has not created it yet. Wait for it; the group must be created in that VPC.' }],
    }),
    both(s(1, 'secops', 2), 'Review access (IAM)', 'List who can sign in and with what.', CONSOLE, [
      'IAM → Users: note each user, its groups and its MFA column.',
      'IAM → Dashboard → Security recommendations: root MFA on, no root access keys.',
    ], [
      { cmd: 'aws iam list-users --query "Users[].UserName" --output text; aws iam get-account-summary --query "SummaryMap.[AccountMFAEnabled, AccountAccessKeysPresent]" --output text', explain: 'The users, then two numbers: root MFA on (1), root access keys present (0 is what you want).', sample: 'team01-infra\tteam01-secops\n1\t0', flags: [
        { flag: 'get-account-summary --query "SummaryMap.[…]"', meaning: 'The account-wide counters; these two are the root user’s MFA and key status.' },
      ] },
    ], ['1'], 'The root user is the account itself: it can do anything, so it gets MFA and no keys, and nobody uses it day to day. Everyone else is an IAM user in a group with a policy.'),
    portal(s(1, 'secops', 3), 'Turn on MFA for yourself', 'Assign a virtual MFA device to your IAM user.', 'AWS console — top-right menu → Security credentials', [
      'Multi-factor authentication (MFA) → Assign MFA device → Authenticator app → scan the QR code → enter two codes → Add MFA.',
      'Sign out, sign in again: the code is asked for. Ask each teammate to do the same.',
    ], 'Your IAM user shows an MFA device; the next sign-in asks for a code.', 'Multi-factor authentication is the single control the exam names most: a stolen password alone no longer opens the account. On AWS it is per IAM user (and the root user), so every teammate does it once.', {
      fixes: [{ symptom: 'The Security credentials page is missing MFA', fix: 'You are signed in with SSO or a lab role that manages MFA elsewhere. Record “managed by the identity provider” and move on.' }],
    }),
    rec(1, 'secops', 'Access and security group', ['One row per person or group and what they get.', 'MFA status per teammate.'], 'The Week 3 identity task builds on this list.'),
  ], { tools: ['AWS console', 'CloudShell', 'An authenticator app'] }),

  // ── Week 2 — Core services: compute, storage, network, cost ────────────
  T(2, 'arch', 'Estimate the cost and choose storage classes', 'Price each component in the calculator against the Free Tier, then choose S3 storage classes and EBS volume types with a reason.', 45,
    ['CLF-C02 · Billing, Pricing and Support', 'Pricing Calculator and the Free Tier', 'S3 storage classes and durability', 'Factors that affect cost'], ['Every component has a monthly cost', 'Storage classes chosen with a reason'],
    [doc('AWS Free Tier', 'https://aws.amazon.com/free/', 'the three kinds of offer — 12 months free, always free, trials — and the 750-hour line under EC2; that is the budget this course lives inside'),
     doc('AWS Pricing Calculator', 'pricing-calculator/latest/userguide/what-is-pricing-calculator.html', 'the “Add service” flow and the estimate summary; the calculator prices list rates, so subtract the free tier yourself'),
     doc('Amazon S3 storage classes', 'AmazonS3/latest/userguide/storage-class-intro.html', 'the comparison table: Standard, Standard-IA, One Zone-IA, Glacier — the retrieval fee column is what decides for a site read every day')],
    'Free: the calculator. Nothing is deployed. Your list-price estimate should come out near $10 a month before the free tier and near $0 after it.', [
    portal(s(2, 'arch', 1), 'Price it', 'Price the components in the AWS Pricing Calculator.', 'calculator.aws', [
      'Add: EC2 (t3.micro, Linux, 730 h), S3 Standard (1 GB), CloudFront (1 GB out).',
      'Add: Lambda, API Gateway HTTP API, DynamoDB on-demand — mostly free tier.',
      'Read the monthly total; then halve the EC2 hours — you stop it.',
      'Subtract what the Free Tier covers in year one: 750 EC2 hours, 5 GB S3, 750 public-IP hours.',
    ], 'A monthly estimate per service, with EC2 the largest line.', 'Cost is set by size, hours, Region, storage class and data out — the factors the exam lists. The calculator shows list prices; the 12-month Free Tier removes the EC2 and S3 lines, and Lambda and DynamoDB stay free.', {
      fixes: [{ symptom: 'EC2 comes out at $7–8', fix: 'You left 730 hours. A stopped instance bills no compute: halve the hours, and note that the disk still bills after the free 30 GB.' }],
    }),
    portal(s(2, 'arch', 2), 'Choose storage classes and volume types', 'Choose S3 classes and the EBS type for each asset.', 'The document', [
      'Site bucket: S3 Standard — read every day, 11 nines durability, no retrieval fee. Alternative: Standard-IA, rejected for its retrieval fee.',
      'Instance root volume: gp3 8 GB, inside the free 30 GB. Snapshots (Week 8) are the backup.',
      'DynamoDB: on-demand, one Region. Write each alternative you rejected and its price.',
    ], 'One row per asset: class chosen, alternative rejected, monthly cost.', 'S3 classes trade storage price for retrieval price and availability: Standard for data read often, IA for data read rarely, Glacier for archives. EBS types trade IOPS for price. Every step down is a fee somewhere else.'),
    rec(2, 'arch', 'Components and cost, Redundancy and tiers', ['One component per row, with its monthly cost.', 'One storage-class row per asset.'], 'The architecture document grows every week and is handed over in Week 12.'),
  ], { tools: ['AWS Pricing Calculator'] }),
  T(2, 'infra', 'Launch the tools instance', 'Launch a t3.micro Amazon Linux instance in the public subnet with a key pair, read its facts, then stop it.', 45,
    ['CLF-C02 · Cloud Technology and Services', 'EC2 instance types and the Free Tier', 'Key pairs', 'Availability Zones; stop vs terminate'], ['ec2-tools-team01 runs in the public subnet', 'The instance is stopped at the end'],
    [doc('Launch an instance using the launch wizard', 'AWSEC2/latest/UserGuide/ec2-launch-instance-wizard.html', 'the “Free tier eligible” label beside the instance type, and the Network settings panel where you pick the subnet and security group'),
     doc('Instance lifecycle', 'AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html', 'the state diagram: stopped keeps the disk and bills only storage; terminated is gone')],
    'Free tier: t3.micro is free for 750 hours a month for 12 months; the 8 GB gp3 root disk sits inside the 30 GB free. Stop it when done — hours count while it runs. The public IPv4 is free for 750 hours in year one.', [
    both(s(2, 'infra', 1), 'Launch the instance', 'Launch the t3.micro in the public subnet.', CONSOLE, [
      'EC2 → Instances → Launch instance. Name ec2-tools-team01; add tags project, team, env, owner. Amazon Linux 2023; t3.micro (Free tier eligible).',
      'Key pair → Create new key pair: kp-team01, RSA, .pem. Save the file; never commit it.',
      'Network settings → Edit: VPC vpc-capstone-team01, subnet snet-public-team01, Auto-assign public IP Enable, Select existing security group sg-tools-team01.',
      'Leave Advanced details at their defaults. Launch instance.',
    ], [
      { cmd: 'aws ec2 create-key-pair --key-name kp-team01 --query KeyMaterial --output text > kp-team01.pem && chmod 400 kp-team01.pem', explain: 'The private key is shown once. Download it from CloudShell (Actions → Download file) and never commit it.', sample: '(no output — kp-team01.pem saved)', flags: [
        { flag: '--query KeyMaterial --output text > kp-team01.pem', meaning: 'Write only the private key text to a file.' },
        { flag: 'chmod 400', meaning: 'Only you can read it; ssh refuses a key others can read.' },
      ] },
      { cmd: 'SUB=$(aws ec2 describe-subnets --filters Name=tag:Name,Values=snet-public-team01 --query "Subnets[0].SubnetId" --output text); SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 run-instances --image-id resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --instance-type t3.micro --key-name kp-team01 --subnet-id $SUB --security-group-ids $SG --associate-public-ip-address --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=ec2-tools-team01},{Key=project,Value=capstone},{Key=team,Value=team01},{Key=env,Value=dev},{Key=owner,Value=team01-infra}]" --query "Instances[0].{id:InstanceId, ip:PrivateIpAddress}"', explain: 'resolve:ssm always picks the current Amazon Linux image; every other option is the console’s default.', sample: '{ "id": "i-0abc123def4567890", "ip": "10.10.1.25" }', flags: [
        { flag: '--image-id resolve:ssm:/aws/service/ami-…', meaning: 'Look up today’s Amazon Linux 2023 image id instead of pasting one that goes stale.' },
        { flag: '--instance-type t3.micro', meaning: 'The free-tier size: 2 vCPU burstable, 1 GiB.' },
        { flag: '--associate-public-ip-address', meaning: 'Give it an internet address, for updates and your SSH test.' },
      ] },
    ], ['i-0', '10.10.1.'], 'EC2 is IaaS: you choose the image, type and zone, and you patch it. t3.micro is free-tier eligible; the security group is Security’s empty one, so nothing reaches it yet. The private .pem is your key: keep it.', {
      fixes: [
        { symptom: 'InvalidParameterCombination: t3.micro', fix: 'Your account’s free tier is t2.micro. Use --instance-type t2.micro and record why.' },
        { symptom: 'The instance never gets a public IP', fix: 'Auto-assign public IP was left Disabled, and it cannot be added later. Terminate and launch again with it enabled.' },
        { symptom: 'Status check 1/2 for a long time', fix: 'Normal for the first two minutes. Wait for 2/2 before connecting.' },
      ],
    }),
    both(s(2, 'infra', 2), 'Read its facts and hand over the key', 'Read the IPs and zone, then share the key privately.', CONSOLE, [
      'EC2 → Instances → ec2-tools-team01 → Details: Private IPv4, Public IPv4, Availability Zone, Instance state.',
      'Send kp-team01.pem through a private channel (Teams/Slack DM, a password manager) — never the repository or email. User name: ec2-user.',
    ], [
      { cmd: `${IID}; aws ec2 describe-instances --instance-ids $IID --query "Reservations[0].Instances[0].{private:PrivateIpAddress, public:PublicIpAddress, az:Placement.AvailabilityZone, state:State.Name}"`, explain: 'The private IP is what other resources use; the public IP only exists for outbound patching and your SSH test. Download the key from CloudShell: Actions → Download file.', sample: '{ "private": "10.10.1.25", "public": "3.91.12.44", "az": "us-east-1a", "state": "running" }', flags: [
        { flag: 'IID=$(… describe-instances --filters Name=tag:Name …)', meaning: 'Find the instance by its Name tag, so no id is typed by hand.' },
      ] },
    ], ['running'], 'AWS reserves the first four addresses and the last in every subnet. The public IP changes every time the instance stops and starts — record the private one. The private key is the password to this machine.'),
    rec(2, 'infra', 'Virtual machine facts', ['Name, type, zone, private IP, operating system.'], 'The runbook in Week 7 and the snapshot in Week 8 start from these facts.'),
    STOP(2, 'infra'),
  ], { tools: ['AWS console', 'CloudShell'] }),
  T(2, 'dev', 'Publish the website with CloudFront', 'Publish the site from a private S3 bucket behind CloudFront with Origin Access Control, then change it and redeploy.', 50,
    ['CLF-C02 · Cloud Technology and Services', 'S3 buckets and Block Public Access', 'CloudFront: the edge network', 'Origin Access Control'], ['The site loads over HTTPS', 'The bucket is private', 'A change was redeployed'],
    [doc('Restrict access to an S3 origin', 'AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html', 'the “Create a new OAC” steps and the bucket policy CloudFront hands you — you paste it into the bucket, CloudFront does not do it for you'),
     doc('Creating a bucket', 'AmazonS3/latest/userguide/create-bucket-overview.html', 'the bucket-naming rules (global, lowercase) and the Block Public Access section — leave every box ticked')],
    'Free tier: S3 5 GB for 12 months; CloudFront 1 TB out and 10 million requests a month, always free. Invalidations: 1,000 paths a month free. Do not enable WAF on the distribution — that costs about $14 a month.', [
    both(s(2, 'dev', 1), 'Create the bucket and upload', 'Create a private bucket and upload the site.', CONSOLE, [
      'S3 → Create bucket: name capstone-team01-site plus four digits, region us-east-1, Block all public access ticked. Tags. Create bucket.',
      'Open it → Upload → Add files → site/index.html (and 404.html) → Upload.',
    ], [
      { cmd: 'BUCKET=capstone-team01-site-$RANDOM; aws s3 mb s3://$BUCKET && aws s3 sync ./site s3://$BUCKET && echo $BUCKET', explain: 'Bucket names are global. Block Public Access is on by default — leave it on; CloudFront will read the bucket for you.', sample: 'make_bucket: capstone-team01-site-18342\nupload: site/index.html to s3://capstone-team01-site-18342/index.html', flags: [
        { flag: 's3 mb', meaning: 'Make bucket.' },
        { flag: 's3 sync ./site s3://$BUCKET', meaning: 'Upload every file in site/ that is new or changed.' },
      ] },
    ], ['make_bucket'], 'S3 is object storage: a bucket holds files, the name is unique worldwide, and Block Public Access keeps it private. capstone-team01-site: the bucket for the capstone site, owned by team01. It never becomes public — hence CloudFront in front.', {
      fixes: [{ symptom: 'Bucket name already exists', fix: 'Someone in the world has it. Change the digits and try again.' }],
    }),
    portal(s(2, 'dev', 2), 'Put CloudFront in front', 'Create a distribution with Origin Access Control.', 'AWS console — CloudFront → Create distribution', [
      'Origin domain: your bucket (not the website endpoint). Origin access: Origin access control settings → Create new OAC → Create.',
      'Viewer protocol policy: Redirect HTTP to HTTPS. Web Application Firewall: Do not enable security protections.',
      'Default root object: index.html. Create distribution.',
      'The yellow banner → Copy policy → S3 → the bucket → Permissions → Bucket policy → Edit → paste → Save.',
    ], 'The distribution is Enabled and https://d….cloudfront.net shows your page.', 'CloudFront is the content delivery network: edge locations near visitors cache the site and serve it over HTTPS with AWS’s certificate. OAC signs CloudFront’s requests; the bucket policy admits only this distribution, which is why you paste it yourself.', {
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
    ], ['InProgress'], 'Upload plus invalidate is a redeploy. CloudFront keeps a copy of each file at the edge for up to a day, so without the invalidation the old page can linger. Week 10 automates both steps.'),
    rec(2, 'dev', 'Website', ['The HTTPS URL.', 'How you redeployed a change.'], 'The CloudFront URL is what the counter page calls in Week 3.'),
  ], { tools: ['AWS console', 'CloudShell', 'A text editor'] }),
  T(2, 'secops', 'Allow SSH from your IP only', 'Add one inbound rule allowing SSH from your own address, then prove it is allowed from you and blocked elsewhere.', 40,
    ['CLF-C02 · Security and Compliance', 'Security group rules', 'Defense in depth: one address, one port', 'Allowed and blocked tests'], ['SSH works from your IP', 'SSH is blocked from CloudShell'],
    [doc('Work with security group rules', 'AWSEC2/latest/UserGuide/working-with-security-group-rules.html', 'the “Add rules” steps and the Source field’s “My IP” choice — it fills your /32 for you'),
     doc('Connect to your Linux instance using SSH', 'AWSEC2/latest/UserGuide/connect-linux-inst-ssh.html', 'the ssh command with -i and the user name for Amazon Linux (ec2-user), and the “Permission denied” troubleshooting for a .pem that is too open')],
    'Free: security group rules. Instance hours count while it runs — stop it when the test is done.', [
    both(s(2, 'secops', 1), 'Add the SSH rule', 'Allow TCP 22 from your IP address only.', CONSOLE, [
      'EC2 → Security groups → sg-tools-team01 → Inbound rules → Edit inbound rules → Add rule.',
      'Type SSH, Source “My IP” — the console fills your address as a /32. Description: Allow-SSH-MyIP. Save rules.',
    ], [
      { cmd: 'curl -s https://checkip.amazonaws.com', explain: 'Run this on YOUR laptop, not CloudShell: it prints the address your laptop reaches the internet from.', sample: '203.0.113.25' },
      { cmd: 'MYIP=203.0.113.25   # type the address the first line printed', explain: 'CloudShell is another machine with another address, so tell it yours.', sample: '(no output — the variable is set)' },
      { cmd: 'SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr $MYIP/32 --query "SecurityGroupRules[0].CidrIpv4" --output text', explain: 'A /32 is exactly one address.', sample: '203.0.113.25/32', flags: [
        { flag: 'authorize-security-group-ingress', meaning: 'Add an inbound allow rule.' },
        { flag: '--protocol tcp --port 22', meaning: 'SSH’s port. Nothing else is opened.' },
        { flag: '--cidr $MYIP/32', meaning: 'Only this one address may connect.' },
      ] },
    ], ['/32'], 'Never 0.0.0.0/0 on port 22: bots scan the internet for open SSH within minutes. Security groups have no priorities and no deny: this allow is the whole inbound policy — one layer of defense in depth.'),
    portal(s(2, 'secops', 2), 'Test allowed and blocked', 'Test SSH from your laptop, then from CloudShell.', 'Your laptop, then CloudShell', [
      'Start the instance: EC2 → Instances → ec2-tools-team01 → Instance state → Start; read the public IP on Details.',
      'From your laptop, using the key the Infra Admin shared: a prompt appears (below, by operating system).',
      'From CloudShell: ssh -i kp-team01.pem ec2-user@PUBLIC_IP — expect “Connection timed out”.',
      'Stop the instance when done: Instance state → Stop instance.',
    ], 'SSH connects from your laptop and times out from CloudShell.', 'A rule is only proved when something that should fail does fail. CloudShell has a different address, so the /32 rule rightly refuses it — the same refusal any attacker gets.', {
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
    ], 'You can name every hop from the browser to the table.', 'The diagram is drawn from the template, so it is the environment you are building, not an illustration. A glowing node arrived this week; a grey one was already there.'),
    portal(s(3, 'arch', 2), 'Write the flow', 'Write the flow with your real URLs and owners.', 'The document', [
      'Browser → https://d….cloudfront.net (CloudFront + S3: AWS runs them).',
      'Page script → GET https://….execute-api.us-east-1.amazonaws.com/default/capstone-team01-counter (API Gateway + Lambda: AWS runs the servers, we own the code).',
      'Lambda → DynamoDB table capstone-team01-visitors, item id "site" (AWS runs it, we own the data).',
      'Back: { "count": n } → the page writes it into #visitor-count.',
    ], 'A three-hop flow with real URLs, resource names and who manages each.', 'Serverless means no server you can see: it scales to zero and you pay per request — the pay-as-you-go model. A flow with real URLs is testable: each arrow is something you can call and watch fail.'),
    rec(3, 'arch', 'Request flow', ['The flow, hop by hop, with who manages each.'], 'Week 6’s path tests follow this flow.'),
  ], { tools: ['The Guide'] }),
  T(3, 'infra', 'Create the DynamoDB table', 'Create an on-demand DynamoDB table and seed the counter item.', 35,
    ['CLF-C02 · Cloud Technology and Services', 'Managed databases: DynamoDB vs RDS', 'On-demand capacity', 'Items and attributes'], ['Table capstone-team01-visitors exists', 'Item id "site" has count 0'],
    [doc('Create a table in DynamoDB', 'amazondynamodb/latest/developerguide/getting-started-step-1.html', 'the console steps: table name, partition key name and type, and where “Table settings → Customize” hides the capacity mode'),
     doc('On-demand capacity mode', 'amazondynamodb/latest/developerguide/on-demand-capacity-mode.html', 'the first paragraph: you pay per request, with no capacity to plan — that is why an idle counter costs nothing')],
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
    ], ['ACTIVE'], 'DynamoDB is a managed NoSQL key-value database: no server, no schema beyond the key, AWS runs and scales it. RDS would be the managed relational choice for tables with joins. The partition key decides where an item is stored.'),
    both(s(3, 'infra', 2), 'Seed the counter', 'Put the item { id: site, count: 0 }.', CONSOLE, [
      'Open the table → Explore table items → Create item.',
      'id: site. Add new attribute → Number → name count, value 0. Create item.',
    ], [
      { cmd: 'aws dynamodb put-item --table-name capstone-team01-visitors --item \'{"id":{"S":"site"},"count":{"N":"0"}}\' && aws dynamodb get-item --table-name capstone-team01-visitors --key \'{"id":{"S":"site"}}\' --output text', explain: 'DynamoDB types every value: S for string, N for number.', sample: 'COUNT\t0\nID\tsite' },
    ], ['site'], 'The Lambda adds one to this one item on every visit. Seeding it is optional in DynamoDB (ADD creates a missing item), but seeing the item now makes the first request easier to understand.'),
    rec(3, 'infra', 'Data store', ['Table name, partition key, the seed item.'], 'The API spec’s data model.'),
  ], { tools: ['AWS console', 'CloudShell'] }),
  T(3, 'dev', 'Build the counter Lambda and API', 'Create a Lambda that atomically adds one to the counter, put an HTTP API in front, and show the count on the site.', 50,
    ['CLF-C02 · Cloud Technology and Services', 'Lambda: serverless compute', 'API Gateway', 'An execution role instead of a key'], ['The API returns a count', 'The site shows it'],
    [doc('Create your first Lambda function', 'lambda/latest/dg/getting-started.html', 'the “Author from scratch” form and the Test tab — the console editor deploys with one button'),
     doc('Lambda execution role', 'lambda/latest/dg/lambda-intro-execution-role.html', 'the first paragraph: the function assumes the role at run time, so no key is ever stored in it'),
     doc('Using Lambda with API Gateway', 'lambda/latest/dg/services-apigateway.html', 'the “Add trigger” route for an HTTP API — it creates the API, the route and the permission together')],
    'Free: Lambda 1 million requests a month always free; API Gateway HTTP API 1 million calls a month for 12 months.', [
    both(s(3, 'dev', 1), 'Create the function', 'Create a Python Lambda that adds one to the count.', CONSOLE, [
      'Lambda → Create function → Author from scratch. Name capstone-team01-counter, runtime Python 3.12, “Create a new role with basic Lambda permissions”. Create.',
      'Code tab: replace lambda_function.py with the code below. Deploy.',
      'Configuration → Environment variables → Edit → Add: TABLE_NAME = capstone-team01-visitors. Save.',
      'Test → Create new event (any name) → Test: an AccessDenied error — expected until the next step.',
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
    ], ['count'], 'Lambda is serverless compute: AWS runs the servers, your code runs when called, and you pay per request. ADD is atomic, so two visitors at once both count. The Test fails until the next step grants the table.', {
      fixes: [
        { symptom: 'KeyError: TABLE_NAME', fix: 'The environment variable is missing or misspelt. Configuration → Environment variables.' },
        { symptom: 'Runtime.ImportModuleError', fix: 'The file is not named lambda_function.py, or the handler setting is not lambda_function.lambda_handler.' },
      ],
    }),
    both(s(3, 'dev', 2), 'Let it write the table, add the API', 'Grant the table, then add an HTTP API trigger.', CONSOLE, [
      'Configuration → Permissions → the role name → Add permissions → Create inline policy → JSON: paste the policy below. Name count-visitors. Create.',
      'Back in Lambda: Test again — {"count": 1}.',
      'Function overview → Add trigger → API Gateway → Create a new API → HTTP API, Security: Open. Add.',
      'Configuration → Triggers: copy the API endpoint URL.',
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
    ], ['granted'], 'An IAM role is an identity a service assumes: the policy names one action on one table, so a bug cannot touch anything else — that is least privilege. API Gateway gives the function its HTTPS URL.', {
      fixes: [{ symptom: 'AccessDeniedException still, after the policy', fix: 'The table ARN has a typo (region, account id or table name). Compare it with the table’s Overview → ARN.' }],
    }),
    both(s(3, 'dev', 3), 'Call it and show it', 'Call the API, then add the count to the page.', CONSOLE, [
      'Open the API endpoint in a browser tab: {"count": 2}. Reload: 3.',
      'In site/index.html add a fetch() of that URL writing the result into #visitor-count (snippet below).',
      'API Gateway → the counter API → CORS → Configure: Access-Control-Allow-Origin = your CloudFront URL (no trailing slash), Allow-Methods GET. Save.',
      'Upload the file to the bucket and invalidate /* (Week 2). Reload the site.',
    ], [
      { cmd: 'API=https://abc123.execute-api.us-east-1.amazonaws.com/default/capstone-team01-counter; curl -s $API', explain: 'Each call adds one. Replace the URL with your endpoint.', sample: '{"count": 2}' },
      { cmd: `<p>Visitors: <span id="visitor-count">…</span></p>
<script>
  fetch('https://abc123.execute-api.us-east-1.amazonaws.com/default/capstone-team01-counter')
    .then((r) => r.json())
    .then((d) => { document.getElementById('visitor-count').textContent = d.count; });
</script>`, explain: 'Paste into index.html before </body>, with your own URL. The browser calls the API and writes the answer into the page.', sample: '(the page shows: Visitors: 3)' },
    ], ['count'], 'The page calls the API from the visitor’s browser — there is no server. The browser only reads the answer because the API lists the site as an allowed origin. Nothing in the page is secret.', {
      fixes: [{ symptom: 'The page shows “…” for ever', fix: 'Open DevTools → Console. “blocked by CORS policy” means the origin is missing or has a trailing slash; a 404 means the URL is wrong.' }],
    }),
    rec(3, 'dev', 'Endpoints', ['GET, the path, what it returns, its status codes.'], 'The spec another developer would call your API from.'),
  ], { tools: ['AWS console', 'CloudShell', 'A text editor', 'Browser DevTools'], prerequisites: ['The DynamoDB table capstone-team01-visitors from the Infrastructure Admin, this week.', 'Your own site from Week 2.'] }),
  T(3, 'secops', 'Give the team the right access', 'Create the team’s IAM user group, add the teammates, attach ReadOnlyAccess, confirm MFA, and confirm no key is in the page.', 45,
    ['CLF-C02 · Security and Compliance', 'IAM users, groups and managed policies', 'Least privilege: ReadOnlyAccess for looking', 'MFA for every member'], ['The group holds ReadOnlyAccess', 'All four are members with MFA', 'No key in the page'],
    [doc('Creating IAM user groups', 'IAM/latest/UserGuide/id_groups_create.html', 'the “Attach permissions policies” step — search ReadOnlyAccess, tick exactly that one'),
     doc('ReadOnlyAccess managed policy', 'aws-managed-policy/latest/reference/ReadOnlyAccess.html', 'the length of the policy and that every action starts with Describe, Get or List — that is what “read only” means'),
     doc('Getting credential reports', 'IAM/latest/UserGuide/id_credentials_getting-report.html', 'the “Download report” button and the mfa_active column — one line per user, your MFA check')],
    'Free: IAM groups, managed policies, MFA and the credential report cost nothing.', [
    both(s(3, 'secops', 1), 'Create the group and add the team', 'Create the read-only group with your four teammates.', CONSOLE, [
      'IAM → User groups → Create group: capstone-team01-readonly.',
      'Attach permissions policies: search ReadOnlyAccess, tick it. Create group.',
      'The group → Users → Add users → your four teammates. Add.',
    ], [
      { cmd: 'aws iam create-group --group-name capstone-team01-readonly --query Group.Arn --output text && aws iam attach-group-policy --group-name capstone-team01-readonly --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess && aws iam add-user-to-group --group-name capstone-team01-readonly --user-name team01-secops && echo added', explain: 'Creates the group, attaches the AWS-managed policy, adds you; add the others the same way.', sample: 'arn:aws:iam::123456789012:group/capstone-team01-readonly\nadded' },
    ], ['capstone-team01-readonly'], 'IAM users sign in; groups hold policies; a policy is a JSON list of allowed actions. Grant to groups, not people: joining and leaving becomes one membership change. ReadOnlyAccess is AWS-managed: every action is Describe, Get or List.'),
    both(s(3, 'secops', 2), 'Prove it can look and not touch', 'Sign in as a member and try to stop the instance.', CONSOLE, [
      'Sign in as a teammate who is in the group only: EC2 → Instances is readable.',
      'Select ec2-tools-team01 → Instance state → Stop instance: “You are not authorized to perform this operation”. Screenshot it.',
    ], [
      { cmd: 'ARN=$(aws iam get-group --group-name capstone-team01-readonly --query Group.Arn --output text); aws iam simulate-principal-policy --policy-source-arn $ARN --action-names ec2:StopInstances ec2:DescribeInstances --query "EvaluationResults[].[EvalActionName, EvalDecision]" --output text', explain: 'The policy simulator evaluates the real policies without calling anything.', sample: 'ec2:StopInstances\timplicitDeny\nec2:DescribeInstances\tallowed' },
    ], ['implicitDeny'], 'Least privilege is proved by a denial: one allowed and one denied action show the policy does what the document says. implicitDeny means no policy allowed it — the default in IAM is no.'),
    portal(s(3, 'secops', 3), 'Confirm MFA and no key', 'Check MFA on each member and no key in the page.', 'IAM → Credential report, then the browser', [
      'IAM → Credential report → Download report: mfa_active is TRUE for every teammate; access_key_1_active is FALSE for root.',
      'View the site source (Ctrl+U): only the API URL, no key. Lambda → Environment variables: only TABLE_NAME; the role grants access.',
    ], 'Four members with MFA; the page holds a URL and nothing else.', 'MFA per user and least privilege per group are the two identity controls CLF-C02 tests. Anything in page source is public; the function needs no key at all because its role hands out short-lived credentials.', {
      fixes: [{ symptom: 'mfa_active is FALSE for a teammate', fix: 'They skipped Week 1’s MFA step. Security credentials → Assign MFA device.' }],
    }),
    rec(3, 'secops', 'Identity and access', ['The group, its members, the policy, MFA, where access comes from.'], 'The first lines of the access matrix and the secrets register.'),
  ], { tools: ['AWS console', 'CloudShell'], prerequisites: ['The Lambda function and the site from App & DevOps, this week — for the no-key check.'] }),

  // ── Week 4 — Monitor, govern, pay ──────────────────────────────────────
  T(4, 'arch', 'Report the cost, and read Trusted Advisor and the support plans', 'Read what the environment has cost by service and by Free Tier offer, then Trusted Advisor’s checks and the support-plan table.', 35,
    ['CLF-C02 · Billing, Pricing and Support', 'Cost Explorer and the Free Tier page', 'Trusted Advisor', 'Support plans'], ['Spend and largest cost reported', 'One Trusted Advisor check owned', 'The support plan noted'],
    [doc('Exploring your data using Cost Explorer', 'cost-management/latest/userguide/ce-exploring-data.html', 'the “Group by” control and the Service dimension; the table under the chart is what you copy'),
     doc('AWS Trusted Advisor', 'awssupport/latest/user/trusted-advisor.html', 'the checks available on Basic support — the security ones are free: MFA on root, security groups with open ports, S3 permissions'),
     doc('Compare AWS Support plans', 'https://aws.amazon.com/premiumsupport/plans/', 'the four columns — Basic, Developer, Business, Enterprise — and the response-time rows; that is the exam question')],
    'Free: the Cost Explorer console, the Free Tier page and Trusted Advisor’s basic checks. The Cost Explorer API costs $0.01 per call, so the console is the main path.', [
    both(s(4, 'arch', 1), 'Read the cost', 'Group this month’s cost by service and by offer.', CONSOLE, [
      'Billing and Cost Management → Cost Explorer. Date range: month to date. Group by: Service. Read the table: service, cost.',
      'Billing → Free Tier: the usage of each offer (EC2 hours, S3 GB). Budgets → capstone-team01: how much is used.',
      'Compare with your Week 2 estimate.',
    ], [
      { cmd: 'aws ce get-cost-and-usage --time-period Start=$(date +%Y-%m-01),End=$(date -d tomorrow +%F) --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE --query "ResultsByTime[0].Groups[].[Keys[0], Metrics.UnblendedCost.Amount]" --output text', explain: 'Cost Explorer by service for the month so far. Each call costs $0.01; the console view is free.', sample: 'Amazon Elastic Compute Cloud - Compute\t0.31\nAmazon Simple Storage Service\t0.01' },
    ], ['Amazon'], 'Actual cost shows what you forgot to switch off: if EC2 is not near zero, the instance was left running. Cost data arrives a day late; Cost Explorer stays empty for its first day.', {
      fixes: [
        { symptom: 'Cost Explorer is empty or “being prepared”', fix: 'It was enabled less than 24 hours ago. Come back tomorrow and record the date you read it; free-tier usage shows as $0.' },
        { symptom: 'Free Tier page shows 80% of EC2 hours used', fix: 'The instance ran while nobody used it. Stop it now; the alert email is the Free Tier usage alert doing its job.' },
      ],
    }),
    portal(s(4, 'arch', 2), 'Read Trusted Advisor and the support plans', 'Own one check; note your support plan.', 'AWS console — Trusted Advisor, then Support Center', [
      'Trusted Advisor → Security: MFA on root, open ports, S3 permissions. Pick one check and note who will act on it.',
      'Support Center → your plan (Basic). Read the plans table: what Developer and Business add, and their response times.',
    ], 'One Trusted Advisor check with an owner, and the support plan noted.', 'Trusted Advisor is AWS looking at what you built and telling you how to spend less or be safer; the support plan is what you pay to get a human. Basic is free; Business unlocks every check.'),
    rec(4, 'arch', 'Cost this week', ['Spend to date, and the largest cost with its reason.', 'The Trusted Advisor check and its owner; the support plan.'], 'Week 11 turns this into the cost report.'),
  ], { tools: ['AWS console', 'CloudShell'] }),
  T(4, 'infra', 'Alarm on Lambda errors', 'Create an SNS topic and a CloudWatch alarm that emails when the function errors.', 40,
    ['CLF-C02 · Cloud Technology and Services', 'CloudWatch metrics and alarms', 'SNS topics and subscriptions', 'Why errors, not CPU'], ['The alarm exists and emails the team'],
    [doc('Create a CloudWatch alarm based on a static threshold', 'AmazonCloudWatch/latest/monitoring/ConsoleAlarms.html', 'the “Select metric” step and the “Treat missing data as” option — set it to good, or an idle function looks broken'),
     doc('Email notifications with Amazon SNS', 'sns/latest/dg/sns-email-notifications.html', 'the “Confirm subscription” paragraph: nothing is delivered until someone clicks the link in the first email')],
    'Free: 10 CloudWatch alarms and 1,000 SNS email deliveries a month, always free.', [
    both(s(4, 'infra', 1), 'Create the topic', 'Create an SNS topic that emails the team.', CONSOLE, [
      'SNS → Topics → Create topic → Standard, name capstone-team01-alerts. Tags. Create topic.',
      'Create subscription → Protocol Email → Endpoint: the team address → Create subscription.',
      'Open the inbox and click “Confirm subscription” in the AWS email. Status: Confirmed.',
    ], [
      { cmd: 'TOPIC=$(aws sns create-topic --name capstone-team01-alerts --tags Key=project,Value=capstone Key=team,Value=team01 Key=owner,Value=team01-infra --query TopicArn --output text); aws sns subscribe --topic-arn $TOPIC --protocol email --notification-endpoint team01-alerts@school.edu --query SubscriptionArn --output text', explain: 'Confirm the subscription from the email AWS sends, or nothing is delivered.', sample: 'pending confirmation' },
    ], ['pending confirmation'], 'SNS separates “what happened” from “who gets told”: alarms publish to the topic, subscribers receive. One topic, many alarms: change the email once. An unconfirmed subscription is the most common reason an alarm is silent.'),
    both(s(4, 'infra', 2), 'Create the alarm', 'Alarm when Errors is above zero in five minutes.', CONSOLE, [
      'CloudWatch → Alarms → Create alarm → Select metric → Lambda → By Function Name → capstone-team01-counter, Errors → Select metric.',
      'Statistic Sum, Period 5 minutes; Threshold Static, Greater than 0; Additional configuration → Treat missing data as good (not breaching).',
      'Notification: In alarm → Select an existing SNS topic → capstone-team01-alerts. Name capstone-team01-counter-errors. Create alarm.',
    ], [
      { cmd: 'aws cloudwatch put-metric-alarm --alarm-name capstone-team01-counter-errors --namespace AWS/Lambda --metric-name Errors --dimensions Name=FunctionName,Value=capstone-team01-counter --statistic Sum --period 300 --evaluation-periods 1 --threshold 0 --comparison-operator GreaterThanThreshold --treat-missing-data notBreaching --alarm-actions $TOPIC && aws cloudwatch describe-alarms --alarm-names capstone-team01-counter-errors --query "MetricAlarms[0].StateValue" --output text', explain: 'Any error in five minutes fires it. Missing data (no traffic) is treated as fine.', sample: 'OK' },
    ], ['OK'], 'CloudWatch collects metrics from every service; an alarm watches one metric against a threshold and publishes to SNS. Errors are the signal users feel; CPU tells you nothing about a function. The App & DevOps drill will fire it.', {
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
    ], ['InProgress'], 'Breaking it yourself means you know the answer. The code asks for a table that is not there, so every request ends in an exception and a 500. The Infra Admin’s alarm should email within five minutes.'),
    both(s(4, 'dev', 2), 'Find it', 'Read the latest errors from the log group.', CONSOLE, [
      'Lambda → the function → Monitor → View CloudWatch logs → the newest log stream.',
      'Filter events: ERROR. Read the exception name and the line under it.',
    ], [
      { cmd: 'aws logs filter-log-events --log-group-name /aws/lambda/capstone-team01-counter --filter-pattern ERROR --max-items 2 --query "events[].message" --output text', explain: 'Every Lambda writes to a log group named after it.', sample: '[ERROR] ResourceNotFoundException: Requested resource not found' },
    ], ['ResourceNotFoundException'], 'CloudWatch Logs holds every line the function prints, in a log group named after it. Read a stack trace bottom up: the last line says what failed, the lines above say where. The table name is in the message.', {
      fixes: [{ symptom: 'No log stream yet', fix: 'Logs arrive a minute after the call. Reload the site again and refresh the stream list.' }],
    }),
    both(s(4, 'dev', 3), 'Restore it', 'Put the right table name back and retest.', CONSOLE, [
      'Configuration → Environment variables → Edit: TABLE_NAME = capstone-team01-visitors. Save.',
      'Open the API endpoint in a browser tab: a count, not an error. Note the time.',
    ], [
      { cmd: 'aws lambda update-function-configuration --function-name capstone-team01-counter --environment "Variables={TABLE_NAME=capstone-team01-visitors}" -o none; sleep 5; curl -s $API', explain: 'Set $API to your endpoint. A count means it is fixed.', sample: '{"count": 12}' },
    ], ['count'], 'A fix is not done until the retest passes. Tell the Security Admin the times: broke at, alarmed at, found at, fixed at — those four numbers are their incident record, and the alarm returns to OK by itself.'),
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
    ], ['team01'], 'CloudTrail is the audit log: who did what, when, from where — the first question of every incident and every compliance review. Event history keeps 90 days free; a trail to S3 keeps it for ever.'),
    both(s(4, 'secops', 2), 'Read the alarm history', 'Read when the alarm fired and when it recovered.', CONSOLE, [
      'CloudWatch → Alarms → capstone-team01-counter-errors → History: “Alarm updated from OK to In alarm” and back, with times.',
    ], [
      { cmd: 'aws cloudwatch describe-alarm-history --alarm-name capstone-team01-counter-errors --history-item-type StateUpdate --max-items 2 --query "AlarmHistoryItems[].[Timestamp, HistorySummary]" --output text', explain: 'The state changes, newest first.', sample: '2026-10-08T14:11:30+00:00\tAlarm updated from ALARM to OK\n2026-10-08T14:06:30+00:00\tAlarm updated from OK to ALARM' },
    ], ['ALARM'], 'The alarm’s times against CloudTrail’s show whether monitoring or a user told you first — the alarm should win. Minutes from change to alarm is the number a monitoring design is judged by.'),
    portal(s(4, 'secops', 3), 'Write the incident record', 'Record this week’s drill: symptom, evidence, cause, fix.', 'The document', [
      'Symptom: the counter showed “…”. Evidence: the CloudTrail rows, the alarm history, the alert email.',
      'Cause: TABLE_NAME was changed to a table that does not exist. Fix: changed back, retested.',
      'Times: changed at, alarmed at, found at, fixed at. Prevention: Week 10 makes settings code.',
    ], 'An incident record with symptom, evidence, cause, fix and the four times.', 'An incident record is how a team learns: what users saw, how you knew, what it was, what fixed it. CloudTrail turns “someone changed something” into a name and a time.'),
    rec(4, 'secops', 'Incident record', ['Symptom, evidence, root cause, fix; who made the change.'], 'Week 12 runs this loop again under time pressure.'),
  ], { tools: ['AWS console', 'CloudShell'], prerequisites: ['The break-and-fix times from App & DevOps, this week.'] }),

  // ── Week 5 — Identity ──────────────────────────────────────────────────
  T(5, 'arch', 'Write the access matrix', 'List every principal, its policies and scope, with a justification for each.', 35,
    ['Least privilege', 'Managed and inline policies'], ['Three or more justified grants'],
    [doc('Policies and permissions in IAM', 'IAM/latest/UserGuide/access_policies.html', 'the “Identity-based policies” section and the difference between managed and inline — your matrix has a column for each'),
     doc('Getting credential reports', 'IAM/latest/UserGuide/id_credentials_getting-report.html', 'the “Download report” button and the columns mfa_active and access_key_1_active — the two that decide a risky row')],
    'Free: IAM and its reports cost nothing.', [
    both(s(5, 'arch', 1), 'Export the grants', 'List users and groups with their policies.', CONSOLE, [
      'IAM → Users: open each user → Permissions tab; note attached policies and group memberships.',
      'IAM → User groups: each group’s Permissions tab.',
      'IAM → Credential report → Download report.',
    ], [
      { cmd: 'aws iam get-account-authorization-details --filter User Group --query "{users: UserDetailList[].[UserName, AttachedManagedPolicies[].PolicyName], groups: GroupDetailList[].[GroupName, AttachedManagedPolicies[].PolicyName]}" --output json', explain: 'Every user and group, with the managed policies attached to each.', sample: '{ "users": [ [ "team01-infra", [ "PowerUserAccess" ] ] ],\n  "groups": [] }' },
    ], ['users'], 'A policy attached to a user is the one people forget to review.'),
    rec(5, 'arch', 'Access matrix', ['One row per grant: principal, policy, scope, why.', 'Mark any grant broader than it needs to be.'], 'Week 11’s posture review reads this matrix.'),
  ]),
  T(5, 'infra', 'Put the table name in Parameter Store', 'Store the table name as a parameter, let the counter role read that one parameter, and read it back — configuration out of code.', 35,
    ['Systems Manager Parameter Store', 'Configuration vs secrets', 'A policy scoped to one parameter'], ['The parameter exists', 'The role may read that parameter only'],
    [doc('Parameter Store', 'systems-manager/latest/userguide/systems-manager-parameter-store.html', 'the “What is Parameter Store” paragraph: String for configuration, SecureString for secrets, and that standard parameters are free'),
     doc('Restricting access to parameters', 'systems-manager/latest/userguide/sysman-paramstore-access.html', 'the example policy that names one parameter ARN — copy its shape')],
    'Free: standard parameters and their reads cost nothing.', [
    both(s(5, 'infra', 1), 'Create the parameter', 'Store the table name at /capstone/team01/visitor/table.', CONSOLE, [
      'Systems Manager → Parameter Store → Create parameter. Name /capstone/team01/visitor/table, tier Standard, type String, value capstone-team01-visitors. Tags. Create.',
    ], [
      { cmd: 'aws ssm put-parameter --name /capstone/team01/visitor/table --type String --value capstone-team01-visitors --tags Key=project,Value=capstone Key=team,Value=team01 --query Version --output text', explain: 'A String parameter for configuration. A password would be a SecureString.', sample: '1' },
    ], ['1'], 'Configuration belongs in one place that code reads at start-up, not in code and not in a page. Parameter Store is that place on AWS; the Week 9 template creates this same parameter, so hand and code agree.'),
    both(s(5, 'infra', 2), 'Let the role read it, and read it back', 'Grant ssm:GetParameter on that one parameter; read it.', CONSOLE, [
      'IAM → Roles → the counter role → Add permissions → Create inline policy → JSON: Allow ssm:GetParameter on arn:aws:ssm:us-east-1:ACCOUNT:parameter/capstone/team01/visitor/table. Name read-table-param.',
      'Parameter Store → the parameter → the value is shown. That is what the code would read.',
    ], [
      { cmd: 'ROLE=$(aws lambda get-function-configuration --function-name capstone-team01-counter --query Role --output text | cut -d/ -f2); ACCT=$(aws sts get-caller-identity --query Account --output text); aws iam put-role-policy --role-name $ROLE --policy-name read-table-param --policy-document "{\\"Version\\":\\"2012-10-17\\",\\"Statement\\":[{\\"Effect\\":\\"Allow\\",\\"Action\\":\\"ssm:GetParameter\\",\\"Resource\\":\\"arn:aws:ssm:us-east-1:$ACCT:parameter/capstone/team01/visitor/table\\"}]}" && aws ssm get-parameter --name /capstone/team01/visitor/table --query Parameter.Value --output text', explain: 'One action on one parameter, then a read to prove the value.', sample: 'capstone-team01-visitors' },
    ], ['capstone-team01-visitors'], 'The same least-privilege shape as the table policy: one action, one resource. A role that can read every parameter would also read the ones that hold secrets.'),
    rec(5, 'infra', 'Secrets register', ['The parameter, its type, who may read it (the counter role).'], 'The register shows where every credential and setting lives.'),
  ], { prerequisites: ['The counter function and its role from App & DevOps (Week 3).'] }),
  T(5, 'dev', 'Scope the Lambda role to the table', 'Read the function’s role and make sure it can update one item table and nothing else.', 40,
    ['Execution roles', 'Resource ARNs in policies'], ['The role names the table ARN only', 'The API still works'],
    [doc('Lambda execution role', 'lambda/latest/dg/lambda-intro-execution-role.html', 'the “View the execution role” steps under Configuration → Permissions — the role name is a link into IAM'),
     doc('IAM JSON policy elements: Resource', 'IAM/latest/UserGuide/reference_policies_elements_resource.html', 'the ARN examples and the wildcard warning — your policy should name one table ARN and no *')],
    'Free: reading and editing a role costs nothing.', [
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
    rec(5, 'dev', 'Secrets register', ['The database access row: stored in — nothing; read by — the execution role.'], 'The register shows a secret that never existed.'),
  ]),
  T(5, 'secops', 'Prove an access is denied', 'Ask IAM whether the read-only group could stop the instance, and record the denial.', 35,
    ['IAM policy simulator', 'Denied-access tests'], ['A denial is recorded'],
    [doc('Testing IAM policies with the IAM policy simulator', 'IAM/latest/UserGuide/access_policies_testing-policies.html', 'the “Testing policies attached to a user, group or role” steps and the Results column — implicitDeny is a denial by absence of an allow')],
    'Free: the simulator evaluates policies without calling any service.', [
    both(s(5, 'secops', 1), 'Simulate the group', 'Simulate stopping an instance as the read-only group.', CONSOLE, [
      'IAM → User groups → capstone-team01-readonly → Simulate (or policysim.aws.amazon.com → Groups).',
      'Service EC2, actions StopInstances and DescribeInstances. Run simulation.',
      'Read: StopInstances denied, DescribeInstances allowed.',
    ], [
      { cmd: 'ARN=$(aws iam get-group --group-name capstone-team01-readonly --query Group.Arn --output text); aws iam simulate-principal-policy --policy-source-arn $ARN --action-names ec2:StopInstances ec2:DescribeInstances --query "EvaluationResults[].[EvalActionName, EvalDecision]" --output text', explain: 'The simulator evaluates the real policies without calling anything.', sample: 'ec2:StopInstances\timplicitDeny\nec2:DescribeInstances\tallowed' },
    ], ['implicitDeny', 'allowed'], 'One allowed and one denied action prove the policy does what the matrix says.'),
    rec(5, 'secops', 'Access tests', ['Who, what they tried, expected, result.'], 'Evidence that the matrix is enforced, not just written.'),
  ]),

  // ── Week 6 — Networking ────────────────────────────────────────────────
  T(6, 'arch', 'Write the network design document', 'Write the address plan, the rules and the admin path, and say what production would add.', 40,
    ['RFC 1918', 'Public and private subnets', 'Design trade-offs'], ['Address plan and rules recorded', 'The production gap is stated'],
    [doc('Subnets for your VPC', 'vpc/latest/userguide/configure-subnets.html', 'the “Subnet types” list — public, private, VPN-only, isolated — and the sentence that defines each by its route table'),
     doc('NAT gateways', 'vpc/latest/userguide/vpc-nat-gateway.html', 'the “Pricing” link and the hourly charge: this is the $32 a month the course avoids by keeping the instance public for outbound only')],
    'Free: reading the plan. The production alternative — a NAT gateway — is about $32 a month, which is why the course keeps a public IP instead.', [
    both(s(6, 'arch', 1), 'Read the address plan', 'List every subnet in the VPC.', CONSOLE, [
      'VPC → Subnets → filter by vpc-capstone-team01.',
      'Read Name, IPv4 CIDR and Availability Zone for each row.',
    ], [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC --query "Subnets[].[Tags[?Key==\'Name\']|[0].Value, CidrBlock, AvailabilityZone]" --output text', explain: 'One line per subnet: its name, range and zone.', sample: 'snet-public-team01\t10.10.1.0/24\tus-east-1a\nsnet-private-team01\t10.10.2.0/24\tus-east-1a' },
    ], ['10.10.2.0/24'], 'The plan is read from AWS, not remembered.'),
    rec(6, 'arch', 'Design summary', ['How admins reach the instance now.', 'What production would add: a NAT gateway, the instance private.'], 'Honest about the trade-off: a public IP for outbound only, to avoid $32 a month.'),
  ]),
  T(6, 'infra', 'Add the private subnet', 'Add a private subnet with its own route table that has no route to the internet.', 35,
    ['Private subnets', 'Route tables'], ['snet-private-team01 is 10.10.2.0/24', 'Its route table has only local'],
    [doc('Route tables', 'vpc/latest/userguide/VPC_Route_Tables.html', 'the “Custom route tables” section and the local route every table carries — a table with only that route is what makes a subnet private'),
     doc('Subnets for your VPC', 'vpc/latest/userguide/configure-subnets.html', 'the “Create a subnet” steps — the CIDR must sit inside the VPC’s /16')],
    'Free: subnets and route tables cost nothing.', [
    both(s(6, 'infra', 1), 'Create the subnet and its route table', 'Create 10.10.2.0/24 with a local-only route table.', CONSOLE, [
      'VPC → Subnets → Create subnet: vpc-capstone-team01, name snet-private-team01, us-east-1a, 10.10.2.0/24.',
      'Route tables → Create: rt-private-team01 in the VPC. Subnet associations → Edit → tick snet-private-team01.',
      'Routes tab: one row, 10.10.0.0/16 → local. Nothing else.',
    ], [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); PSUB=$(aws ec2 create-subnet --vpc-id $VPC --cidr-block 10.10.2.0/24 --availability-zone us-east-1a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=snet-private-team01}]" --query Subnet.SubnetId --output text)', explain: 'The next /24. It stays private because nothing routes it to the gateway.', sample: '(no output — $PSUB holds the subnet id)' },
      { cmd: 'PRT=$(aws ec2 create-route-table --vpc-id $VPC --query RouteTable.RouteTableId --output text); aws ec2 associate-route-table --route-table-id $PRT --subnet-id $PSUB -o none; aws ec2 describe-route-tables --route-table-ids $PRT --query "RouteTables[0].Routes[].[DestinationCidrBlock, GatewayId]" --output text', explain: 'A new route table has only the local route — no way out.', sample: '10.10.0.0/16\tlocal' },
    ], ['local'], 'Private means “no route to the internet gateway”, and this output proves it.'),
    rec(6, 'infra', 'Address plan', ['One row per subnet: CIDR, purpose, route to internet.'], 'The template in Week 9 must match this plan.'),
  ]),
  T(6, 'dev', 'Lock CORS and trace the request paths', 'Allow only your site to call the API from a browser, prove a foreign origin is refused, and test each public path both ways.', 45,
    ['CORS and origins', 'Negative tests', 'HTTP status codes'], ['Only your site is allowed', 'A foreign origin is refused', 'Reachable and refused paths recorded'],
    [doc('Configuring CORS for an HTTP API', 'apigateway/latest/developerguide/http-api-cors.html', 'the Access-Control-Allow-Origin row of the table, and the warning that a wildcard cannot be combined with credentials'),
     doc('Requiring HTTPS between viewers and CloudFront', 'AmazonCloudFront/latest/DeveloperGuide/using-https-viewers-to-cloudfront.html', 'the “Redirect HTTP to HTTPS” option: the 301 you will see is that setting at work'),
     doc('Blocking public access to S3', 'AmazonS3/latest/userguide/access-control-block-public-access.html', 'the four settings and what each blocks — with all four on, the bucket URL answers 403 to everyone but CloudFront')],
    'Free: CORS is a setting; the tests are five HTTP requests.', [
    both(s(6, 'dev', 3), 'Allow only your site', 'Set the API’s CORS to your site only.', CONSOLE, [
      'API Gateway → APIs → capstone-team01-counter-API → Develop → CORS → Configure.',
      'Access-Control-Allow-Origin: only your CloudFront URL (no trailing slash); remove anything else. Allow-Methods: GET. Save.',
    ], [
      { cmd: 'APIID=$(aws apigatewayv2 get-apis --query "Items[?contains(Name, \'capstone-team01\')].ApiId | [0]" --output text); SITE=https://d111111abcdef8.cloudfront.net; aws apigatewayv2 update-api --api-id $APIID --cors-configuration AllowOrigins=$SITE,AllowMethods=GET --query CorsConfiguration', explain: 'Set SITE to your own CloudFront URL. Browsers only let pages from listed origins read the API’s answers.', sample: '{ "AllowMethods": [ "GET" ],\n  "AllowOrigins": [ "https://d111111abcdef8.cloudfront.net" ] }' },
    ], ['AllowOrigins'], 'An origin is scheme + host + port. CORS is a browser rule: the API answers everyone, but a browser only lets a page read the answer if its origin is listed. A wildcard admits every website.'),
    cli(s(6, 'dev', 2), 'Prove a foreign origin is refused', 'Call the API as another website would.', [
      { cmd: 'curl -s -D - -o /dev/null -H "Origin: https://evil.example" $API | grep -i access-control || echo "no CORS header — refused"', explain: 'A foreign origin gets no Access-Control-Allow-Origin header, so its browser discards the answer. Set $API to your endpoint first.', sample: 'no CORS header — refused' },
    ], ['refused'], 'CORS protects browsers, not the API: curl still gets a count. That is why the API holds no secrets. The console cannot send a forged Origin header — this test is shell only.'),
    both(s(6, 'dev', 1), 'Test the public paths', 'Test HTTPS, HTTP and the bucket directly.', CONSOLE, [
      'Browser: https://YOUR.cloudfront.net loads; http://YOUR.cloudfront.net redirects to https.',
      'Browser: https://YOUR-BUCKET.s3.amazonaws.com/index.html → AccessDenied.',
      'DevTools → Network shows the codes: 200, 301, 403.',
    ], [
      { cmd: 'SITE=d111111abcdef8.cloudfront.net; curl -sI https://$SITE | head -1; curl -sI http://$SITE | head -1', explain: 'HTTPS answers 200; HTTP is redirected to HTTPS by the viewer policy.', sample: 'HTTP/2 200\nHTTP/1.1 301 Moved Permanently' },
      { cmd: 'BUCKET=$(aws s3 ls | grep capstone-team01-site | awk \'{print $3}\'); curl -sI https://$BUCKET.s3.amazonaws.com/index.html | head -1', explain: 'Going around CloudFront to the bucket must be refused.', sample: 'HTTP/1.1 403 Forbidden' },
    ], ['200', '403 Forbidden'], 'The refused path proves the bucket is private — only CloudFront gets in.'),
    rec(6, 'dev', 'Request paths, CORS', ['HTTPS reachable, HTTP redirected, bucket refused, API reachable.', 'The allowed origin and the negative test.'], 'Paths tested both ways are the design proved.'),
  ]),
  T(6, 'secops', 'Remove SSH and use Session Manager', 'Give the instance a Session Manager role, delete the SSH rule, and administer it with no open port.', 50,
    ['Session Manager', 'Instance profiles', 'Attack surface'], ['No inbound rule', 'A command ran through Session Manager'],
    [doc('Setting up Session Manager', 'systems-manager/latest/userguide/session-manager-getting-started.html', 'the prerequisites list: the agent (already on Amazon Linux), an instance profile with AmazonSSMManagedInstanceCore, and outbound HTTPS — no inbound port'),
     doc('IAM roles for Amazon EC2', 'AWSEC2/latest/UserGuide/iam-roles-for-amazon-ec2.html', 'the “Attach an IAM role to an instance” steps under Actions → Security → Modify IAM role')],
    'Free: Session Manager, IAM roles and Run Command cost nothing. Instance hours count while it runs — stop it at the end.', [
    both(s(6, 'secops', 1), 'Give the instance a role', 'Create an SSM role and attach it to the instance.', CONSOLE, [
      'IAM → Roles → Create role → AWS service → EC2. Policy AmazonSSMManagedInstanceCore. Name capstone-team01-ssm.',
      'EC2 → Instances → ec2-tools-team01 → Actions → Security → Modify IAM role → capstone-team01-ssm → Update.',
    ], [
      { cmd: 'aws iam create-role --role-name capstone-team01-ssm --assume-role-policy-document \'{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}\' -o none && aws iam attach-role-policy --role-name capstone-team01-ssm --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore', explain: 'The role lets the instance’s SSM agent talk to Systems Manager — nothing else.', sample: '(no output — the role and its policy exist)' },
      { cmd: `aws iam create-instance-profile --instance-profile-name capstone-team01-ssm -o none && aws iam add-role-to-instance-profile --instance-profile-name capstone-team01-ssm --role-name capstone-team01-ssm && sleep 10 && ${IID} && aws ec2 associate-iam-instance-profile --instance-id $IID --iam-instance-profile Name=capstone-team01-ssm --query IamInstanceProfileAssociation.State --output text`, explain: 'An instance profile is how a role is handed to an instance.', sample: 'associating' },
    ], ['associating'], 'The agent is already installed on Amazon Linux; it only needed permission.'),
    both(s(6, 'secops', 2), 'Remove SSH, run a command', 'Revoke the SSH rule and run a command through SSM.', CONSOLE, [
      'EC2 → Security groups → sg-tools-team01 → Inbound rules → Edit → Delete the SSH row → Save. The table is empty.',
      START_CLICK,
      'Systems Manager → Run Command → Run command → AWS-RunShellScript; target ec2-tools-team01; commands: hostname; systemctl is-active amazon-ssm-agent. Run.',
      'Open the command → the instance → Output: the hostname and “active”.',
    ], [
      { cmd: 'SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 revoke-security-group-ingress --group-id $SG --ip-permissions "$(aws ec2 describe-security-groups --group-ids $SG --query SecurityGroups[0].IpPermissions)" -o none; aws ec2 describe-security-groups --group-ids $SG --query "SecurityGroups[0].IpPermissions"', explain: 'Revokes every inbound rule. The empty list is the proof.', sample: '[]' },
      { cmd: `${START}; ${ssm('hostname; systemctl is-active amazon-ssm-agent')}`, explain: 'Session Manager goes out through the agent, so no inbound port is needed. Give it a minute after starting.', sample: 'ip-10-10-1-25.ec2.internal\nactive' },
    ], ['[]', 'active'], 'The safest open port is none: admin goes through an authenticated, logged AWS API.'),
    rec(6, 'secops', 'Security group rules', ['Every inbound and outbound rule with its reason.', 'The empty inbound list.'], 'The rules matrix of the network design.'),
    STOP(6, 'secops'),
  ]),

  // ── Week 7 — Server Admin ──────────────────────────────────────────────
  T(7, 'arch', 'Decide the instance size', 'Read the instance’s CPU use and decide whether t3.micro is still the right size.', 30,
    ['Right-sizing', 'Burstable instances'], ['A size decision with its evidence'],
    [doc('Burstable performance instances', 'AWSEC2/latest/UserGuide/burstable-performance-instances.html', 'the “Baseline utilization” table: t3.micro’s baseline is 10% — an average under that is normal, not idle waste'),
     doc('Monitor your instances using CloudWatch', 'AWSEC2/latest/UserGuide/viewing_metrics_with_cloudwatch.html', 'the Monitoring tab on the instance page and the CPU utilization graph; change the period to one day')],
    'Free: CloudWatch basic monitoring at five-minute intervals costs nothing. Detailed monitoring would; do not enable it.', [
    both(s(7, 'arch', 1), 'Read the CPU history', 'Read the average CPU for the last week.', CONSOLE, [
      'EC2 → Instances → ec2-tools-team01 → Monitoring tab.',
      'CPU utilization → enlarge; time range 1 week, period 1 day, statistic Average.',
    ], [
      { cmd: `${IID}; aws cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name CPUUtilization --dimensions Name=InstanceId,Value=$IID --start-time $(date -d '-7 days' +%FT%T) --end-time $(date +%FT%T) --period 86400 --statistics Average --query "Datapoints[].[Timestamp, Average]" --output text`, explain: 'Daily averages. T3 instances earn CPU credits while idle, so a low average is normal and healthy.', sample: '2026-10-20T00:00:00+00:00\t2.4' },
    ], ['2026-'], 'Right-sizing is cost control with evidence, not a guess.'),
    rec(7, 'arch', 'Sizing decision', ['Size now; keep, grow or shrink, and why.'], 'The decision is reversible and cheap — record it anyway.'),
  ]),
  T(7, 'infra', 'Attach and mount an EBS volume', 'Add a 4 GB encrypted gp3 volume to the instance and mount it at /data so it survives a reboot.', 45,
    ['EBS volumes', 'NVMe device names', 'fstab'], ['/data is mounted', 'The instance is stopped'],
    [doc('Create an Amazon EBS volume', 'ebs/latest/userguide/ebs-creating-volume.html', 'the Availability Zone field — it must match the instance’s zone or Attach will not list the instance'),
     doc('Make an EBS volume available for use', 'ebs/latest/userguide/ebs-using-volumes.html', 'the “Format and mount” steps and the fstab line with UUID= — copy that form, not /dev/nvme1n1')],
    'Free tier: the 4 GB gp3 volume sits inside the 30 GB free. Instance hours count while it runs — stop it at the end.', [
    both(s(7, 'infra', 1), 'Create and attach the volume', 'Create a 4 GB encrypted volume and attach it.', CONSOLE, [
      START_CLICK,
      'EC2 → Volumes → Create volume: gp3, 4 GiB, us-east-1a, Encrypt ticked, tag Name ebs-data-tools-team01.',
      'Select it → Actions → Attach volume → ec2-tools-team01, device /dev/sdf → Attach.',
    ], [
      { cmd: `${START}; VOL=$(aws ec2 create-volume --size 4 --volume-type gp3 --encrypted --availability-zone us-east-1a --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=ebs-data-tools-team01}]" --query VolumeId --output text); aws ec2 wait volume-available --volume-ids $VOL; aws ec2 attach-volume --volume-id $VOL --instance-id $IID --device /dev/sdf --query State --output text`, explain: 'A volume must be in the same Availability Zone as the instance.', sample: 'attaching' },
    ], ['attaching'], 'Data on its own volume can be snapshotted and restored without touching the OS.'),
    both(s(7, 'infra', 2), 'Format and mount it', 'Format the volume and mount it at /data.', CONSOLE, [
      'Systems Manager → Run Command → AWS-RunShellScript → target ec2-tools-team01.',
      'Commands: paste the script inside the quotes of the shell line below — format, fstab entry, mount.',
      'Then a second command: df -h /data. Read the output.',
    ], [
      { cmd: ssm('D=/dev/nvme1n1; mkfs -t xfs -q $D; mkdir -p /data; echo UUID=$(blkid -s UUID -o value $D) /data xfs defaults,nofail 0 2 >> /etc/fstab; mount -a; df -h /data'), explain: 'On t3, /dev/sdf appears as /dev/nvme1n1. fstab uses the UUID because NVMe names can change.', sample: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme1n1    4.0G   61M  3.9G   2% /data' },
    ], ['/data'], 'A mount that is not in fstab disappears at the next reboot.'),
    rec(7, 'infra', 'Storage', ['The volume, its size, where it is mounted.'], 'The runbook’s storage section.'),
    STOP(7, 'infra'),
  ]),
  T(7, 'dev', 'Patch with Patch Manager', 'Scan for missing updates and install them through Systems Manager Patch Manager.', 40,
    ['Patch Manager', 'Patch baselines'], ['A patch run succeeded', 'The instance is stopped'],
    [doc('Patch instances on demand', 'systems-manager/latest/userguide/patch-manager-patch-now.html', 'the “Patch now” button and the Operation choice: Scan only, or Scan and install'),
     doc('Patch compliance', 'systems-manager/latest/userguide/patch-manager-compliance-states.html', 'the compliance states — Installed, Missing, Failed — the three numbers you record')],
    'Free: Patch Manager and its compliance data cost nothing. Instance hours count while it runs — stop it at the end.', [
    both(s(7, 'dev', 1), 'Install patches', 'Run the patch baseline in Install mode.', CONSOLE, [
      START_CLICK,
      'Systems Manager → Patch Manager → Patch now. Operation: Scan and install. Reboot if needed. Target: ec2-tools-team01. Patch now.',
      'Patch Manager → Compliance reporting: read Installed, Missing, Failed for the instance.',
    ], [
      { cmd: `${START}; CID=$(aws ssm send-command --instance-ids $IID --document-name AWS-RunPatchBaseline --parameters Operation=Install --query Command.CommandId --output text); aws ssm wait command-executed --command-id $CID --instance-id $IID; aws ssm get-command-invocation --command-id $CID --instance-id $IID --query Status --output text`, explain: 'AWS-RunPatchBaseline applies the default baseline and reports compliance.', sample: 'Success' },
      { cmd: 'aws ssm describe-instance-patch-states --instance-ids $IID --query "InstancePatchStates[0].[InstalledCount, MissingCount, FailedCount]" --output text', explain: 'Installed, still missing, failed.', sample: '412\t0\t0' },
    ], ['Success'], 'Patching through the platform leaves a compliance record an auditor can read.'),
    rec(7, 'dev', 'Patching', ['The tool, and the result of the run.'], 'Patch evidence for the runbook and the governance report.'),
    STOP(7, 'dev'),
  ]),
  T(7, 'secops', 'Baseline the instance and write the runbook', 'Record what normal looks like on the instance and write the steps to check it is healthy.', 45,
    ['Performance baselines', 'Runbooks'], ['Three baseline metrics', 'A four-step runbook'],
    [doc('AWS Systems Manager Run Command', 'systems-manager/latest/userguide/run-command.html', 'the “Run a command” walkthrough: document AWS-RunShellScript, targets by instance, and where the output appears'),
     doc('Session Manager', 'systems-manager/latest/userguide/session-manager.html', 'the “Start session” button on the instance’s Connect page — a shell with no port, if you prefer it to Run Command')],
    'Free: Run Command and Session Manager. Instance hours count while it runs — stop it at the end.', [
    both(s(7, 'secops', 1), 'Take the baseline', 'Read load, memory and disk on the instance.', CONSOLE, [
      START_CLICK,
      'Systems Manager → Run Command → AWS-RunShellScript → ec2-tools-team01. Commands: uptime; free -m | head -2; df -h / | tail -1',
      'Open the command → Output: load average, free memory, disk use.',
    ], [
      { cmd: `${START}; ${ssm('uptime; free -m | head -2; df -h / | tail -1')}`, explain: 'Load average, free memory and disk use, taken while idle — that is what normal means.', sample: ' 14:02:11 up 2 min,  load average: 0.05, 0.08, 0.03\nMem:  949  298  402\n/dev/nvme0n1p1  8.0G  1.6G  6.4G  20% /' },
    ], ['load average'], 'You cannot say “it is slow” without knowing what fast looked like.'),
    both(s(7, 'secops', 2), 'Require IMDSv2', 'Make the instance refuse metadata requests without a token.', CONSOLE, [
      'EC2 → Instances → ec2-tools-team01 → Actions → Instance settings → Modify instance metadata options → IMDSv2: Required. Save.',
    ], [
      { cmd: 'aws ec2 modify-instance-metadata-options --instance-id $IID --http-tokens required --http-endpoint enabled --query "InstanceMetadataOptions.HttpTokens" --output text', explain: 'Only token-based (v2) requests may read the instance’s metadata and credentials.', sample: 'required' },
    ], ['required'], 'The metadata service hands an instance its role credentials. IMDSv1 answers any request, so a bug that makes the instance fetch a URL (SSRF) could leak them; v2 needs a token first. The Week 9 template requires it.'),
    portal(s(7, 'secops', 3), 'Write the “when it is slow” step', 'Add the layer-by-layer check to the runbook.', 'The document', [
      'Layers, in order: network (reachable?), identity (allowed?), application (answers?), data (table there?), configuration (setting changed?).',
      'For each layer, one check and one expected result: security group rules, IAM simulator, curl the API, DynamoDB, environment variables.',
      'Stop at the first layer that fails; that is where the fix goes.',
    ], 'A runbook step that walks the five layers with one check each.', 'Working down the layers stops you fixing what is not broken: a 200 from the API rules out three layers in one look. Week 4’s incident was a configuration fault; this step finds the next one in minutes.'),
    rec(7, 'secops', 'Performance baseline, Runbook', ['Three metrics: normal and alert level.', 'Four runbook steps: check, expect — and the five-layer step.'], 'The runbook is what a teammate on call follows.'),
    STOP(7, 'secops'),
  ]),

  // ── Week 8 — Backup and Recovery ───────────────────────────────────────
  T(8, 'arch', 'Set RPO and RTO per asset', 'For each asset, decide how much data the company can lose and how fast it must return.', 30,
    ['Business impact analysis', 'RPO and RTO'], ['Three assets with RPO, RTO and method'],
    [doc('Disaster recovery options in the cloud', 'whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html', 'the RPO/RTO definitions at the top and the four strategies — backup and restore is the one this course uses')],
    'Free: a decision, written down. Nothing is deployed.', [
    portal(s(8, 'arch', 1), 'Rank the assets', 'Rank the website, the counter data and the instance.', 'Team meeting', [
      'Ask: what does an hour of this being down cost?',
      'RPO: how much data can we lose? RTO: how fast must it return?',
      'Name the protection: versioning, snapshot, or the template.',
    ], 'Three assets ranked, each with an RPO, an RTO and a method.', 'Targets come first, backups second: the target decides how often you back up.'),
    rec(8, 'arch', 'Business impact', ['One row per asset.'], 'Week 12’s recovery scenario is judged against these numbers.'),
  ]),
  T(8, 'infra', 'Restore a volume from a snapshot', 'Snapshot the data volume, create a new volume from it, and clean up.', 40,
    ['EBS snapshots', 'Restore testing'], ['A volume restored from a snapshot', 'The test volume is deleted'],
    [doc('Create Amazon EBS snapshots', 'ebs/latest/userguide/ebs-creating-snapshot.html', 'the “Create a snapshot of a volume” steps and the Status column — wait for Completed before restoring'),
     doc('Create a volume from a snapshot', 'ebs/latest/userguide/ebs-restoring-volume.html', 'the “Create volume from snapshot” action — pick the same Availability Zone as the instance')],
    'Free tier: 1 GB of EBS snapshot storage a month; a 4 GB volume with 61 MB used snapshots to well under that. Delete the test volume — it counts against the 30 GB.', [
    both(s(8, 'infra', 1), 'Snapshot and restore', 'Snapshot the data volume and make a volume from it.', CONSOLE, [
      'EC2 → Volumes → ebs-data-tools-team01 → Actions → Create snapshot; description “team01 data”. Wait for Completed.',
      'Snapshots → the snapshot → Actions → Create volume from snapshot: gp3, us-east-1a. Create.',
    ], [
      { cmd: 'VOL=$(aws ec2 describe-volumes --filters Name=tag:Name,Values=ebs-data-tools-team01 --query "Volumes[0].VolumeId" --output text); SNAP=$(aws ec2 create-snapshot --volume-id $VOL --description "team01 data" --query SnapshotId --output text); aws ec2 wait snapshot-completed --snapshot-ids $SNAP && echo $SNAP', explain: 'Snapshots are incremental and stored in S3 — cents a month.', sample: 'snap-0a1b2c3d4e5f67890' },
      { cmd: 'NEW=$(aws ec2 create-volume --snapshot-id $SNAP --availability-zone us-east-1a --volume-type gp3 --query VolumeId --output text); aws ec2 wait volume-available --volume-ids $NEW && echo available', explain: 'A new volume from the snapshot. Attach it to check the files, if you like.', sample: 'available' },
    ], ['snap-', 'available'], 'Snapshots are cheap; AWS Backup is an optional stretch.'),
    both(s(8, 'infra', 2), 'Clean up the test volume', 'Delete the restored test volume.', CONSOLE, [
      'EC2 → Volumes → the new, unattached volume → Actions → Delete volume.',
      'ebs-data-tools-team01 still reads In-use.',
    ], [
      { cmd: 'aws ec2 delete-volume --volume-id $NEW && aws ec2 describe-volumes --filters Name=tag:Name,Values=ebs-data-tools-team01 --query "Volumes[].State" --output text', explain: 'Keep the snapshot and the original; delete the test copy.', sample: 'in-use' },
    ], ['in-use'], 'A restore test leaves nothing behind but the evidence.'),
    rec(8, 'infra', 'VM restore', ['The snapshot id, and whether the data was present.'], 'The first proven restore in the DR plan.'),
  ]),
  T(8, 'dev', 'Recover a deleted web file', 'Turn on bucket versioning, delete index.html, and get it back by removing the delete marker.', 40,
    ['S3 versioning', 'Delete markers'], ['index.html was recovered', 'The site loads again'],
    [doc('Enabling versioning on buckets', 'AmazonS3/latest/userguide/manage-versioning-examples.html', 'the console steps under Properties → Bucket Versioning → Edit → Enable'),
     doc('Working with delete markers', 'AmazonS3/latest/userguide/DeleteMarker.html', 'the diagram: a delete adds a marker on top; deleting the marker brings the object back')],
    'Free: versioning is a setting; the extra copies of one small file are kilobytes inside the 5 GB.', [
    both(s(8, 'dev', 1), 'Turn on versioning', 'Enable versioning on the site bucket.', CONSOLE, [
      'S3 → the site bucket → Properties → Bucket Versioning → Edit → Enable → Save.',
      'Objects → Upload site/index.html once more, so a versioned copy exists.',
    ], [
      { cmd: "BUCKET=$(aws s3 ls | grep capstone-team01-site | awk '{print $3}'); aws s3api put-bucket-versioning --bucket $BUCKET --versioning-configuration Status=Enabled && aws s3api get-bucket-versioning --bucket $BUCKET --output text", explain: 'Every overwrite and delete now keeps the previous version.', sample: 'Enabled' },
      { cmd: 'aws s3 cp s3://$BUCKET/index.html s3://$BUCKET/index.html --metadata-directive REPLACE -o none 2>/dev/null; aws s3 sync ./site s3://$BUCKET', explain: 'Upload once more so a versioned copy exists.', sample: 'upload: site/index.html to s3://capstone-team01-site-18342/index.html' },
    ], ['Enabled'], 'Protection has to be on BEFORE the accident.'),
    both(s(8, 'dev', 2), 'Delete and recover', 'Delete index.html, then remove the delete marker.', CONSOLE, [
      'Objects → tick index.html → Delete → confirm. The site now 404s.',
      'Toggle “Show versions”: index.html has a Delete marker on top. Tick the marker only → Delete.',
      'The file is back; reload the site.',
    ], [
      { cmd: "aws s3 rm s3://$BUCKET/index.html && MARK=$(aws s3api list-object-versions --bucket $BUCKET --prefix index.html --query 'DeleteMarkers[0].VersionId' --output text)", explain: 'With versioning on, a delete only adds a marker on top.', sample: 'delete: s3://capstone-team01-site-18342/index.html' },
      { cmd: 'aws s3api delete-object --bucket $BUCKET --key index.html --version-id $MARK -o none && aws s3api head-object --bucket $BUCKET --key index.html --query ContentType --output text', explain: 'Removing the marker brings the file back.', sample: 'text/html' },
    ], ['text/html'], 'A backup is only real once you have restored from it.'),
    rec(8, 'dev', 'Website restore', ['What you deleted and how you restored it.'], 'The second proven restore.'),
  ]),
  T(8, 'secops', 'Run a timed recovery drill', 'Snapshot the instance’s root volume, rebuild a volume from it, time the whole thing, and compare with the RTO.', 45,
    ['Recovery drills', 'RTO measurement'], ['The drill is timed', 'Test resources are deleted'],
    [doc('Create Amazon EBS snapshots', 'ebs/latest/userguide/ebs-creating-snapshot.html', 'the note that a snapshot of a stopped instance’s root volume is consistent — you do not need to start it'),
     doc('Amazon EBS pricing', 'https://aws.amazon.com/ebs/pricing/', 'the snapshot line: per GB-month of changed data — the reason a drill costs cents and clean-up matters')],
    'Free tier: the drill snapshot is a few hundred MB inside the 1 GB free; delete the drill volume and snapshot at the end.', [
    both(s(8, 'secops', 1), 'Run the drill', 'Start a timer, snapshot the root volume, restore it.', CONSOLE, [
      'Note the time. EC2 → Instances → ec2-tools-team01 → Storage → the root volume → Create snapshot, description “drill”.',
      'Snapshots → wait for Completed → Actions → Create volume from snapshot, us-east-1a. Wait for Available; note the time.',
    ], [
      { cmd: `date +%T; ${IID}; ROOT=$(aws ec2 describe-instances --instance-ids $IID --query "Reservations[0].Instances[0].BlockDeviceMappings[0].Ebs.VolumeId" --output text); DS=$(aws ec2 create-snapshot --volume-id $ROOT --description drill --query SnapshotId --output text); aws ec2 wait snapshot-completed --snapshot-ids $DS`, explain: 'Note the start time. A snapshot works while the instance is stopped.', sample: '14:02:07' },
      { cmd: 'DV=$(aws ec2 create-volume --snapshot-id $DS --availability-zone us-east-1a --query VolumeId --output text); aws ec2 wait volume-available --volume-ids $DV; date +%T', explain: 'The end time. The difference is your measured restore time.', sample: '14:09:41' },
    ], ['14:0'], 'A measured time turns an RTO from a hope into a fact.'),
    both(s(8, 'secops', 2), 'Clean up', 'Delete the drill volume and snapshot.', CONSOLE, [
      'Volumes → the drill volume → Actions → Delete volume.',
      'Snapshots → the “drill” snapshot → Actions → Delete snapshot.',
    ], [
      { cmd: 'aws ec2 delete-volume --volume-id $DV && aws ec2 delete-snapshot --snapshot-id $DS && echo cleaned', explain: 'Drills leave no cost behind.', sample: 'cleaned' },
    ], ['cleaned'], 'Clean-up is part of the drill.'),
    rec(8, 'secops', 'Drill', ['Start, end, RTO met, lessons.'], 'The drill record proves the plan.'),
  ]),

  // ── Week 9 — Infrastructure as Code ────────────────────────────────────
  T(9, 'arch', 'Map the template to the diagram', 'Match five template resources to their diagram nodes, and say what code does that the console cannot.', 35,
    ['CloudFormation templates', 'Infrastructure Composer'], ['Five resources mapped'],
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
    rec(9, 'arch', 'Template map, Portal vs code, ADR-001', ['Five rows: resource, node, parameter.', 'One thing code does that the console cannot.', 'ADR-001.'], 'The map lets anyone navigate the template.'),
  ]),
  T(9, 'infra', 'Inventory everything with the CLI', 'List every tagged resource and find anything the standard missed.', 35,
    ['Resource Groups Tagging API', 'JMESPath queries'], ['Five or more resources listed with tags'],
    [doc('Find resources to tag', 'tag-editor/latest/userguide/find-resources-to-tag.html', 'the Tag Editor search: region, “All supported resource types”, and a tag filter — the same list the shell command returns'),
     doc('GetResources API', 'resourcegroupstagging/latest/APIReference/API_GetResources.html', 'the TagFilters parameter and the note that only tagged resources are returned — untagged ones are the gap you are hunting')],
    'Free: Tag Editor and the tagging API cost nothing.', [
    both(s(9, 'infra', 1), 'List the resources', 'List every resource tagged project=capstone.', CONSOLE, [
      'Resource Groups & Tag Editor → Tag Editor. Region us-east-1, resource types All, tag project = capstone. Search.',
      'Read the table: ARN, type, and the owner tag column. Export to CSV.',
    ], [
      { cmd: 'aws resourcegroupstaggingapi get-resources --tag-filters Key=project,Values=capstone --query "ResourceTagMappingList[].[ResourceARN, Tags[?Key==\'owner\']|[0].Value]" --output text', explain: 'Every resource carrying the project tag, with its owner. Anything you built but do not see here broke the standard.', sample: 'arn:aws:ec2:us-east-1:123456789012:vpc/vpc-0a1b2c3d4e5f67890\tteam01-infra' },
    ], ['arn:aws:'], 'The gaps you find now are what the Config rule flags in Week 11.'),
    rec(9, 'infra', 'CLI inventory', ['Five or more resources, their type, tagged or not.'], 'The inventory is the before-picture for the template.'),
  ]),
  T(9, 'dev', 'Fill the starter and deploy to dev', 'Complete the starter template, preview it with a change set, deploy a dev stack, then delete it.', 55,
    ['Template anatomy', 'Change sets', 'Stacks'], ['The change set previewed', 'CREATE_COMPLETE', 'The dev stack is deleted'],
    [doc('Create a change set', 'AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets-create.html', 'the “Create a change set for a new stack” steps and the Changes tab: Add, Modify, Remove, with Replacement True highlighted'),
     doc('Delete a stack', 'AWSCloudFormation/latest/UserGuide/cfn-console-delete-stack.html', 'the DELETE_FAILED paragraph about non-empty buckets — empty the bucket first')],
    'Free tier while it exists: the dev stack is a second copy of everything, so its instance hours and public IP count too. Delete it the same session.', [
    portal(s(9, 'dev', 1), 'Fill the starter', 'Download the starter and fill its nine blanks.', 'Guide → Architecture & IaC → Starter', [
      'Download template.yaml and both parameter files into infra/.',
      'Replace each FILL-ME using its hint; the Full tab is the answer key.',
      'In params-dev.json set TeamId to t01dev, so names never clash with what you built by hand.',
    ], 'A template with no FILL-ME left.', 'Filling blanks in a real template teaches its structure faster than writing one from nothing.'),
    both(s(9, 'dev', 2), 'Preview, then deploy', 'Create a change set, read it, execute it.', CONSOLE, [
      'CloudFormation → Stacks → Create stack → With new resources → Upload template.yaml. Name capstone-team01-dev; enter the dev parameter values.',
      'Tick the IAM capability box. Instead of Submit: Create change set → wait → Changes tab lists every Add.',
      'Execute change set. Events tab until CREATE_COMPLETE (CloudFront takes ten minutes).',
    ], [
      { cmd: 'STACK=capstone-team01-dev; aws cloudformation create-change-set --stack-name $STACK --change-set-name preview --change-set-type CREATE --template-body file://infra/template.yaml --parameters file://infra/params-dev.json --capabilities CAPABILITY_IAM -o none; aws cloudformation wait change-set-create-complete --stack-name $STACK --change-set-name preview; aws cloudformation describe-change-set --stack-name $STACK --change-set-name preview --query "length(Changes)"', explain: 'A change set lists every add, modify and remove before anything happens.', sample: '34' },
      { cmd: 'aws cloudformation execute-change-set --stack-name $STACK --change-set-name preview && aws cloudformation wait stack-create-complete --stack-name $STACK; aws cloudformation describe-stacks --stack-name $STACK --query "Stacks[0].StackStatus" --output text', explain: 'CloudFront makes this take ten minutes or so.', sample: 'CREATE_COMPLETE' },
    ], ['34', 'CREATE_COMPLETE'], 'Preview first, always: a change set is how you catch a replacement you did not mean.', {
      fixes: [{ symptom: 'ROLLBACK_COMPLETE, "already exists"', fix: 'A name clashes with something you built by hand. Use a different TeamId in params-dev.json and retry.' }],
    }),
    rec(9, 'dev', 'Deployment', ['Blanks filled, change set result, stack status.'], 'The deployment record Week 10 automates.'),
    both(s(9, 'dev', 3), 'Delete the dev stack', 'Delete the dev stack.', CONSOLE, [
      'CloudFormation → Stacks → capstone-team01-dev → Delete → confirm.',
      'If it ends DELETE_FAILED: empty the dev bucket in S3, then Delete again.',
    ], [
      { cmd: 'aws cloudformation delete-stack --stack-name capstone-team01-dev && echo deleting', explain: 'The whole copy goes in one command — that is what a stack is for. Empty its bucket first if the delete fails.', sample: 'deleting' },
    ], ['deleting'], 'A second environment doubles the bill until it is gone.'),
  ]),
  T(9, 'secops', 'Write parameter files and validate', 'Set dev and prod parameter values with no secrets in them, and validate the template.', 40,
    ['Parameter files', 'Validation', 'cfn-lint'], ['The template validates', 'No secret in either file'],
    [doc('Validate a template', 'AWSCloudFormation/latest/UserGuide/using-cfn-validate-template.html', 'what validation checks — syntax and the parameter list — and what it does not: property values, which is what cfn-lint adds'),
     doc('Parameters', 'AWSCloudFormation/latest/UserGuide/parameters-section-structure.html', 'the NoEcho property: the way a template would take a secret if it had to — ours takes none')],
    'Free: validation and linting. Nothing is deployed in this task.', [
    portal(s(9, 'secops', 1), 'Set the parameter values', 'Set TeamId, Environment, OwnerTag and AlertEmail.', 'infra/ in the repository', [
      'dev: Environment dev, TeamId t01dev.',
      'prod: Environment prod, TeamId team01.',
      'No passwords or keys: the template takes none.',
    ], 'Two parameter files differing only where environments differ.', 'Parameters are what changes between environments; everything else stays identical, which is what makes prod predictable.'),
    both(s(9, 'secops', 2), 'Validate', 'Validate the template, then lint it.', CONSOLE, [
      'CloudFormation → Create stack → Upload template.yaml → Next: the parameter form appears only if the template is valid. Cancel.',
      'Infrastructure Composer → Import template.yaml: red markers show property errors, the same ones cfn-lint reports.',
    ], [
      { cmd: 'aws cloudformation validate-template --template-body file://infra/template.yaml --query "Parameters[].ParameterKey" --output text', explain: 'Checks the syntax and lists the parameters it expects.', sample: 'TeamId\tEnvironment\tOwnerTag\tAlertEmail\tInstanceType\tLatestAmiId\tBudgetAmount' },
      { cmd: 'pip install -q cfn-lint && cfn-lint infra/template.yaml && echo "lint clean"', explain: 'cfn-lint checks property names and values against the real resource specs.', sample: 'lint clean' },
    ], ['TeamId', 'lint clean'], 'Validation is the cheapest test in the whole course.'),
    portal(s(9, 'secops', 3), 'Compare with Terraform (optional)', 'Compare CloudFormation with Terraform in two lines.', 'Your notes', [
      'Terraform: one language across clouds, keeps a state file.',
      'CloudFormation: AWS only, the stack is the state.',
    ], 'Two sentences comparing native templates with Terraform.', 'Knowing why a team picks one over the other is an interview question.', { optional: true }),
    rec(9, 'secops', 'Parameters', ['Each parameter: dev value, prod value, secret or not.'], 'The environments, side by side.'),
  ]),

  // ── Week 10 — CI/CD ────────────────────────────────────────────────────
  T(10, 'arch', 'Write and approve the change request', 'Write a change request for one template change, get it reviewed, and approve it in a pull request.', 35,
    ['Change enablement', 'Risk and rollback'], ['The RFC has risk, rollback and approver'],
    [doc('Creating a pull request', 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request', 'the description box and the Reviewers panel — the RFC goes in the description, the approver is the reviewer')],
    'Free: GitHub pull requests.', [
    portal(s(10, 'arch', 1), 'Write the RFC in a pull request', 'Open a pull request with the RFC as its description.', 'github.com — Pull requests', [
      'The change: e.g. add a tag to every resource.',
      'Risk, rollback plan, and the tests the pipeline runs.',
      'Request review from a teammate; approve only after it passes.',
    ], 'A pull request with a complete RFC, reviewed and approved.', 'The pull request is the change record: who asked, who approved, what ran.'),
    rec(10, 'arch', 'Request for change', ['Change, risk, rollback plan, approver.'], 'The release record’s front page.'),
  ]),
  T(10, 'infra', 'Protect main and add an environment', 'Require a review before anything reaches main, and add a prod environment with a required reviewer.', 30,
    ['Branch protection', 'Deployment environments'], ['Main requires a review', 'prod needs approval'],
    [doc('Managing a branch protection rule', 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule', 'the three boxes you tick: require a pull request, required approvals, require status checks'),
     doc('Using environments for deployment', 'https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment', 'the “Required reviewers” protection rule and how a job that names the environment waits for it')],
    'Free: branch protection and environments on a private repository need a GitHub Free organisation or a public repo; a personal private repo needs Pro — use an organisation.', [
    portal(s(10, 'infra', 1), 'Protect main', 'Require a pull request and one review on main.', 'Repository → Settings → Branches', [
      'Add a rule for main.',
      'Require a pull request, one approval, and passing checks.',
      'Block force pushes.',
    ], 'Direct pushes to main are refused.', 'Protection turns a convention into a rule the platform enforces.'),
    portal(s(10, 'infra', 2), 'Add the prod environment', 'Create environment prod with a required reviewer.', 'Repository → Settings → Environments', [
      'New environment: prod.',
      'Required reviewers: the Architect.',
    ], 'Jobs targeting prod wait for approval.', 'The pause before prod is where a human reads the change set.'),
    rec(10, 'infra', 'Repository controls', ['The branch rule and the environment.'], 'Evidence of change control.'),
  ]),
  T(10, 'dev', 'Deploy from GitHub Actions', 'Add a workflow that validates and deploys the stack on every merge to main.', 50,
    ['GitHub Actions', 'configure-aws-credentials', 'CloudFormation deploy'], ['A run deployed the stack'],
    [doc('Configuring OpenID Connect in AWS', 'https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services', 'the workflow example: permissions id-token write, and the configure-aws-credentials step with role-to-assume'),
     doc('aws cloudformation deploy', 'cli/latest/reference/cloudformation/deploy/index.html', 'the --parameter-overrides and --capabilities options — the deploy action passes the same ones')],
    'Free: 2,000 GitHub Actions minutes a month on a private repo; a deploy uses about ten. The stack itself is the same free-tier environment.', [
    portal(s(10, 'dev', 1), 'Write the workflow', 'Add .github/workflows/deploy.yml.', 'The repository', [
      'On: push to main, and workflow_dispatch.',
      'permissions: id-token write, contents read.',
      'Steps: checkout → aws-actions/configure-aws-credentials@v4 (role-to-assume) → aws-actions/aws-cloudformation-github-deploy@v1.',
      'Use the role ARN the Security task stores as a repository variable.',
    ], 'A workflow file committed through a pull request.', 'id-token: write lets the job ask GitHub for a token AWS trusts instead of using a stored key.'),
    portal(s(10, 'dev', 2), 'Watch it run', 'Merge, then watch the run go green.', 'Repository → Actions', [
      'Merge the pull request.',
      'Open the run: credentials, then deploy.',
      'Approve the prod environment when asked.',
    ], 'The run is green and the stack shows CREATE_COMPLETE or UPDATE_COMPLETE.', 'From now on nobody deploys from a laptop.', {
      fixes: [
        { symptom: 'Not authorized to perform sts:AssumeRoleWithWebIdentity', fix: 'The OIDC task is not finished, or the role’s trust policy names a different repo or branch.' },
        { symptom: 'AlreadyExists for the function or log group', fix: 'Your hand-built Week 3 resources share the name. Delete them, or deploy prod with a different TeamId.' },
      ],
    }),
    rec(10, 'dev', 'Pipeline runs', ['Run number, stages, result.'], 'The release record.'),
  ]),
  T(10, 'secops', 'Sign in with OIDC and test rollback', 'Let GitHub assume an AWS role with no stored key, then break a deploy on purpose and watch it roll back.', 50,
    ['IAM OIDC providers', 'Trust policies', 'Stack rollback'], ['No access key exists', 'A failed deploy rolled back'],
    [doc('Create an OpenID Connect identity provider in IAM', 'IAM/latest/UserGuide/id_roles_providers_create_oidc.html', 'the provider URL and audience for GitHub — token.actions.githubusercontent.com and sts.amazonaws.com — and the “Assign role” button after'),
     doc('Stack failure options', 'AWSCloudFormation/latest/UserGuide/stack-failure-options.html', 'the default behaviour: roll back all resources — the UPDATE_ROLLBACK_COMPLETE you will see')],
    'Free: IAM providers and roles. The broken deploy rolls back to the same free-tier stack.', [
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
    portal(s(10, 'secops', 3), 'Break it, watch it roll back', 'Push a broken template, watch it roll back, revert.', 'github.com, then CloudFormation → Events', [
      'In a branch, set an invalid property value. Merge after review.',
      'The run fails; the stack shows UPDATE_ROLLBACK_COMPLETE.',
      'Revert the commit; the next run is green.',
    ], 'A red run and a rollback, then a green revert.', 'CloudFormation rolls back a failed update by itself — you proved it, not assumed it.'),
    rec(10, 'secops', 'Keyless access and rollback', ['How the pipeline signs in, no keys stored, the rollback test.'], 'Evidence the pipeline is both safe and reversible.'),
  ]),

  // ── Week 11 — Governance ───────────────────────────────────────────────
  T(11, 'arch', 'Review cost by service', 'Break this month’s cost down by service and name one action for each.', 30,
    ['Cost Explorer', 'Cost optimisation'], ['Three services with spend and an action'],
    [doc('Exploring your data using Cost Explorer', 'cost-management/latest/userguide/ce-exploring-data.html', 'the Group by → Service control and the “Download CSV” button under the chart'),
     doc('AWS Free Tier', 'https://aws.amazon.com/free/', 'which of your services is “12 months free” — those lines start costing money when the account turns one')],
    'Free: the Cost Explorer console. The shell alternative costs $0.01 per call.', [
    both(s(11, 'arch', 1), 'Break down the cost', 'Group this month’s cost by service.', CONSOLE, [
      'Billing and Cost Management → Cost Explorer. Date range: month to date. Group by: Service.',
      'Budgets: how close is capstone-team01 to its alert?',
      'For each service, one action: keep, reduce, remove.',
    ], [
      { cmd: 'aws ce get-cost-and-usage --time-period Start=$(date +%Y-%m-01),End=$(date -d tomorrow +%F) --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE --query "ResultsByTime[0].Groups[].[Keys[0], Metrics.UnblendedCost.Amount]" --output text', explain: 'The same table from the shell. Each call costs $0.01 — the console is free.', sample: 'Amazon Elastic Compute Cloud - Compute\t0.31\nAmazon Simple Storage Service\t0.01' },
    ], ['Amazon'], 'Every line has an owner and a decision — that is FinOps in one table.'),
    rec(11, 'arch', 'Cost by service', ['Three or more services, spend, action.'], 'The cost section of the governance report.'),
  ]),
  T(11, 'infra', 'Require the owner tag with Config', 'Turn on the AWS Config required-tags rule for owner, and prove it flags an untagged resource.', 45,
    ['AWS Config', 'Managed rules'], ['The rule is active', 'An untagged resource is NON_COMPLIANT'],
    [doc('required-tags', 'config/latest/developerguide/required-tags.html', 'the tag1Key parameter and the resource types the rule can evaluate — buckets are on the list, which is why the test uses one'),
     doc('Setting up AWS Config with the console', 'config/latest/developerguide/gs-console.html', 'the “Recording strategy” choice: pick specific resource types, not all, to keep the evaluation count small')],
    'Costs cents: Config charges per configuration item recorded and per rule evaluation — about $0.003 each. The DOP-C02 exam expects Config, so this is kept; record only three resource types.', [
    portal(s(11, 'infra', 1), 'Turn on the rule', 'Add the required-tags managed rule.', 'AWS Config → Rules → Add rule', [
      'If asked, set up Config: record specific types — EC2, S3, Lambda. One recorder per region only.',
      'Managed rule required-tags. tag1Key: owner.',
      'Scope: EC2 instances, S3 buckets, Lambda functions.',
    ], 'The rule required-tags is listed and evaluating.', 'Config records and checks; it does not block. The deny version is an SCP, which needs AWS Organizations.'),
    both(s(11, 'infra', 2), 'Prove it flags', 'Create an untagged bucket and read its compliance.', CONSOLE, [
      'S3 → Create bucket capstone-team01-untagged-NNNN, no tags. Wait two minutes.',
      'AWS Config → Rules → required-tags: the bucket is listed Noncompliant.',
      'Delete the bucket afterwards.',
    ], [
      { cmd: 'aws s3 mb s3://capstone-team01-untagged-$RANDOM -o none; sleep 120; aws configservice get-compliance-details-by-config-rule --config-rule-name required-tags --compliance-types NON_COMPLIANT --query "EvaluationResults[].[EvaluationResultIdentifier.EvaluationResultQualifier.ResourceId, ComplianceType]" --output text', explain: 'Evaluation takes a minute or two. Delete the bucket afterwards.', sample: 'capstone-team01-untagged-18342\tNON_COMPLIANT' },
    ], ['NON_COMPLIANT'], 'Enforcement proved by a finding, not assumed.'),
    rec(11, 'infra', 'Policy', ['The rule and the result of the test.'], 'Governance the platform checks for you.'),
  ]),
  T(11, 'dev', 'Query CloudTrail event history', 'Find who changed what this week from CloudTrail event history.', 35,
    ['CloudTrail', 'Audit trails'], ['Three audit events recorded'],
    [doc('Viewing CloudTrail events', 'awscloudtrail/latest/userguide/view-cloudtrail-events.html', 'the Event history page and its lookup attributes — Read-only = false shows only changes')],
    'Free: 90 days of event history for management events. Creating a trail to S3 would cost storage; you do not need one.', [
    both(s(11, 'dev', 1), 'Read the audit trail', 'List this week’s write events.', CONSOLE, [
      'CloudTrail → Event history. Lookup attribute: Read-only → false.',
      'Read Event time, User name, Event name for the top rows.',
    ], [
      { cmd: 'aws cloudtrail lookup-events --lookup-attributes AttributeKey=ReadOnly,AttributeValue=false --max-results 8 --query "Events[].[EventTime, Username, EventName]" --output text', explain: 'Every management API call is recorded with who made it. Event history keeps 90 days free.', sample: '2026-11-10T14:02:07+00:00\tteam01-infra\tPutConfigRule' },
    ], ['team01'], 'The audit log is how an incident answers “who did this, and when”.'),
    rec(11, 'dev', 'Audit events', ['Three events: when, who, operation.'], 'Evidence the environment is auditable.'),
  ]),
  T(11, 'secops', 'Review posture with Trusted Advisor', 'Read the free Trusted Advisor checks and IAM Access Analyzer, rank three findings, and own their remediation.', 40,
    ['Security posture', 'IAM Access Analyzer'], ['Three owned findings'],
    [doc('AWS Trusted Advisor', 'awssupport/latest/user/trusted-advisor.html', 'the checks available on Basic support — the security ones are free: MFA on root, security groups with open ports, S3 permissions'),
     doc('IAM Access Analyzer', 'IAM/latest/UserGuide/what-is-access-analyzer.html', 'the difference between an external-access analyzer (free) and an unused-access analyzer (paid) — create the first only')],
    'Free: Trusted Advisor’s security checks and an external-access analyzer. Security Hub and the unused-access analyzer cost money; skip them.', [
    both(s(11, 'secops', 1), 'Read the checks', 'Open the free security checks.', CONSOLE, [
      'Trusted Advisor → Security: MFA on root, open ports, S3 permissions.',
      'IAM → Access Analyzer → Create analyzer → External access (free); read the findings.',
      'Pick three: severity, resource, fix.',
    ], [
      { cmd: 'aws support describe-trusted-advisor-checks --language en --query "checks[?category==\'security\'].name" --output text 2>/dev/null || echo "Support API needs a Business plan — use the console"', explain: 'The Trusted Advisor API is Business-support only; the console shows the free checks to everyone.', sample: 'Support API needs a Business plan — use the console' },
      { cmd: 'AN=$(aws accessanalyzer list-analyzers --query "analyzers[0].arn" --output text); aws accessanalyzer list-findings --analyzer-arn $AN --query "findings[].[resourceType, status]" --output text', explain: 'Access Analyzer findings from the shell, once the analyzer exists.', sample: 'AWS::S3::Bucket\tACTIVE' },
    ], ['console', 'ACTIVE'], 'Free checks find real misconfigurations. Security Hub adds more, for a fee.'),
    rec(11, 'secops', 'Posture findings', ['Three findings: severity, owner, remediation.'], 'Open findings become the handover’s risks.'),
  ]),

  // ── Week 12 — Handover ─────────────────────────────────────────────────
  T(12, 'arch', 'Assemble the handover package', 'Catalogue every service, list the open risks, and sign the package off.', 45,
    ['Service transition', 'Risk registers'], ['Four services catalogued', 'Three risks', 'Signed off'],
    [doc('Operational Excellence pillar', 'wellarchitected/latest/operational-excellence-pillar/welcome.html', 'the “Operate” and “Evolve” sections: runbooks, playbooks and known risks are what a handover carries')],
    'Free: a document. Nothing is deployed.', [
    portal(s(12, 'arch', 1), 'Catalogue the services', 'List each service with its URL, owner and runbook.', 'The document', [
      'Website, API, table, tools instance.',
      'Each points to the runbook section that fixes it.',
    ], 'A four-row service catalogue.', 'The catalogue is the map a new team uses on day one.'),
    portal(s(12, 'arch', 2), 'List the risks', 'Turn open findings into risks.', 'The document', [
      'Start from Week 11’s open findings.',
      'Add: the public IP, one Availability Zone, Config detects but does not block.',
    ], 'Three or more risks, each with a mitigation.', 'Handing over known risks honestly is what makes a handover trustworthy.'),
    rec(12, 'arch', 'Service catalogue, Risk register, Sign-off', ['Catalogue, risks, and the sign-off.'], 'The capstone — the package you defend.'),
  ]),
  T(12, 'infra', 'Rebuild the environment from the template', 'Rebuild the whole environment as a new stack from the template, time it, and delete it.', 50,
    ['Disaster recovery by redeploy', 'Stacks'], ['The rebuild completed', 'Time recorded', 'Recovery stack deleted'],
    [doc('Create a stack from the console', 'AWSCloudFormation/latest/UserGuide/cfn-console-create-stack.html', 'the Events tab: the timestamps of the first and last event are your measured recovery time'),
     doc('Delete a stack', 'AWSCloudFormation/latest/UserGuide/cfn-console-delete-stack.html', 'the DELETE_FAILED paragraph about non-empty buckets')],
    'Free tier while it exists: the recovery stack is a full second copy — a second instance and public IP. Delete it in the same session; stop counting hours.', [
    both(s(12, 'infra', 1), 'Rebuild it', 'Deploy the template as a recovery stack, timed.', CONSOLE, [
      'Note the time. CloudFormation → Create stack → Upload template.yaml. Name capstone-team01-recover; TeamId t01rec, Environment prod.',
      'Tick the IAM capability, Submit. Events tab until CREATE_COMPLETE; note the time.',
    ], [
      { cmd: 'date +%T; aws cloudformation deploy --stack-name capstone-team01-recover --template-file infra/template.yaml --parameter-overrides TeamId=t01rec Environment=prod OwnerTag=team01-infra AlertEmail=team01-alerts@school.edu --capabilities CAPABILITY_IAM; date +%T', explain: 'The whole company, rebuilt from one file. TeamId t01rec keeps names from clashing. The two times are your recovery time.', sample: '15:10:02\nSuccessfully created/updated stack - capstone-team01-recover\n15:24:47' },
    ], ['Successfully created'], 'If it can be rebuilt from code, it can be recovered from anything.'),
    both(s(12, 'infra', 2), 'Delete the recovery stack', 'Delete the recovery stack.', CONSOLE, [
      'CloudFormation → Stacks → capstone-team01-recover → Delete → confirm.',
      'Empty its bucket first if the delete fails.',
    ], [
      { cmd: 'aws cloudformation delete-stack --stack-name capstone-team01-recover && echo deleting', explain: 'Keep the evidence, not the bill.', sample: 'deleting' },
    ], ['deleting'], 'Clean-up is part of the drill.'),
    rec(12, 'infra', 'Scenario outcomes', ['Recover: rebuild from the template — time and result.'], 'Proof the template is the environment.'),
  ]),
  T(12, 'dev', 'Fix an app failure through CI', 'Break the function’s configuration by hand, then restore it by re-running the pipeline — no console fixes.', 45,
    ['Configuration drift', 'Redeploy as a fix'], ['The API failed, then recovered through CI'],
    [doc('Detect drift on a stack', 'AWSCloudFormation/latest/UserGuide/using-cfn-stack-drift.html', 'the Stack actions → Detect drift steps and the drift status MODIFIED on a resource — the proof the console change is drift'),
     doc('Lambda environment variables', 'lambda/latest/dg/configuration-envvars.html', 'the Edit steps — the same place you break it')],
    'Free: one setting changed, one pipeline run (about ten of the 2,000 free minutes).', [
    both(s(12, 'dev', 1), 'Break it', 'Point the function at a table that does not exist.', CONSOLE, [
      'CloudFormation → capstone-team01 → Resources → CounterFunction → the link opens Lambda.',
      'Configuration → Environment variables → Edit: TABLE_NAME = wrong. Save.',
      'Open the stack’s ApiUrl output in a browser: Internal Server Error.',
    ], [
      { cmd: 'FN=$(aws cloudformation describe-stack-resource --stack-name capstone-team01 --logical-resource-id CounterFunction --query StackResourceDetail.PhysicalResourceId --output text); aws lambda update-function-configuration --function-name $FN --environment "Variables={TABLE_NAME=wrong}" -o none; sleep 10; curl -s -o /dev/null -w "%{http_code}\\n" $(aws cloudformation describe-stacks --stack-name capstone-team01 --query "Stacks[0].Outputs[?OutputKey==\'ApiUrl\'].OutputValue" --output text)', explain: 'The stack’s API now fails with a server error.', sample: '500' },
    ], ['500'], 'This is drift: the running environment no longer matches the code.'),
    portal(s(12, 'dev', 2), 'Fix it through CI', 'Re-run the deploy workflow, then retest.', 'Repository → Actions → deploy → Run workflow', [
      'CloudFormation → the stack → Stack actions → Detect drift: CounterFunction is MODIFIED.',
      'Run the workflow on main; approve prod.',
      'curl the API again: a count, not 500.',
    ], 'The API returns a count again after the pipeline run.', 'CloudFormation only fixes what it changes — if nothing changed in the template, update a tag to force it, and record that lesson.'),
    rec(12, 'dev', 'Scenario outcomes', ['App failure fixed through CI — time and result.'], 'The second scenario of the handover.'),
  ]),
  T(12, 'secops', 'Contain a security incident', 'Open SSH to the internet on purpose, detect it, contain it, and run the final security checklist.', 45,
    ['Detection', 'Containment', 'Final checklist'], ['The rule was detected and removed', 'Checklist complete'],
    [doc('Viewing CloudTrail events', 'awscloudtrail/latest/userguide/view-cloudtrail-events.html', 'the Event name lookup attribute — AuthorizeSecurityGroupIngress answers “who opened it”'),
     doc('restricted-ssh', 'config/latest/developerguide/restricted-ssh.html', 'what the rule checks: any security group with port 22 open to 0.0.0.0/0 — the automatic detection you name as prevention')],
    'Free: one rule added and removed; CloudTrail event history. The instance stays stopped, so nothing is exposed.', [
    both(s(12, 'secops', 1), 'Inject the incident', 'Add an SSH rule open to the internet.', CONSOLE, [
      'EC2 → Security groups → sg-tools-team01 → Inbound rules → Edit → Add rule: SSH, source Anywhere-IPv4. Save.',
    ], [
      { cmd: 'SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr 0.0.0.0/0 --query "SecurityGroupRules[0].CidrIpv4" --output text', explain: 'The exact misconfiguration attackers scan for. The instance is stopped, so nothing is exposed.', sample: '0.0.0.0/0' },
    ], ['0.0.0.0/0'], 'A realistic incident: one bad rule, easy to add, easy to miss.'),
    both(s(12, 'secops', 2), 'Detect and contain', 'Find it in CloudTrail, then revoke it.', CONSOLE, [
      'CloudTrail → Event history → Event name = AuthorizeSecurityGroupIngress: read the time and user. Allow a few minutes.',
      'EC2 → Security groups → sg-tools-team01 → Inbound rules → Edit → delete the 0.0.0.0/0 row → Save.',
    ], [
      { cmd: 'aws cloudtrail lookup-events --lookup-attributes AttributeKey=EventName,AttributeValue=AuthorizeSecurityGroupIngress --max-results 1 --query "Events[0].[EventTime, Username]" --output text', explain: 'Who opened it, and when — the first question of any incident. Allow a few minutes for the event to appear.', sample: '2026-12-01T10:02:07+00:00\tteam01-secops' },
      { cmd: 'aws ec2 revoke-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr 0.0.0.0/0 --query Return --output text && echo contained', explain: 'Containment: remove the exposure first, investigate after.', sample: 'True\ncontained' },
    ], ['contained'], 'Contain, then learn. Prevention: the Config rule restricted-ssh flags this automatically.'),
    rec(12, 'secops', 'Scenario outcomes, Sign-off', ['Security incident contained — time and result.', 'Final checklist: no open ports, no keys, budget alerting.'], 'The third scenario, and the security sign-off.'),
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

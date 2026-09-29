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
const { portal, cli, record } = stepKit(FW, 'AWS CloudShell (us-east-1)');
const P = 'aws';

/** Finds the tools instance by its Name tag, so no step needs an id typed in. */
const IID = 'IID=$(aws ec2 describe-instances --filters Name=tag:Name,Values=ec2-tools-team01 Name=instance-state-name,Values=running,stopped --query "Reservations[0].Instances[0].InstanceId" --output text)';
/** Runs a shell script on the instance through Session Manager and prints its output. */
const ssm = (script: string) =>
  `CID=$(aws ssm send-command --instance-ids $IID --document-name AWS-RunShellScript --parameters 'commands=["${script}"]' --query Command.CommandId --output text); sleep 6; aws ssm get-command-invocation --command-id $CID --instance-id $IID --query StandardOutputContent --output text`;

const PLANS: WeekPlan[] = [
  { n: 1, title: 'Foundation', theme: 'Names, guardrails, a network', objective: 'Set the standard and the $5 budget, then lay the network everything else sits in.',
    milestone: 'A budget alerts at $4, the VPC and public subnet exist with the agreed names and tags, and the team repo is live.',
    labels: ['Set the naming standard and the budget', 'Create the VPC and public subnet', 'Open the team repository and board', 'Create the security group'] },
  { n: 2, title: 'Website and EC2', theme: 'First things people can reach', objective: 'Publish the company website over HTTPS and bring up one small instance, reachable only from you.',
    milestone: 'The site loads through CloudFront over HTTPS, the t3.micro runs in the public subnet, SSH works from your IP only, and it is stopped.',
    labels: ['Write the architecture document and cost', 'Launch the tools instance', 'Publish the website with CloudFront', 'Allow SSH from your IP only'] },
  { n: 3, title: 'Serverless API', theme: 'A counter behind the site', objective: 'Add a visitor counter: Lambda behind an HTTP API, writing DynamoDB, callable only from your site.',
    milestone: 'The page shows a live visitor count, CORS admits only your site, and no key appears anywhere.',
    labels: ['Draw the request flow with real URLs', 'Create the DynamoDB table', 'Build the counter Lambda and API', 'Lock CORS and keep secrets out'] },
  { n: 4, title: 'Operate', theme: 'Watch it, break it, fix it', objective: 'Watch cost and errors, then work one failure from symptom to root cause and prevention.',
    milestone: 'An alarm emails on Lambda errors, one incident is written up layer by layer, and spend is reported.',
    labels: ['Report the cost to date', 'Alarm on Lambda errors', 'Find a failure in CloudWatch Logs', 'Work one incident layer by layer'] },
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

function T(week: number, role: string, title: string, objective: string, minutes: number, learn: string[], done: string[], steps: Step[]): Task {
  return cloudTask({ id: `${P}-w${week}-${role}`, role, week, title, objective, minutes, file: CLOUD_FILES[week - 1], frameworks: FW, learn, done, steps });
}
const s = (week: number, role: string, n: number) => `${P}-w${week}-${role}-s${n}`;
const rec = (week: number, role: string, section: string, actions: string[], why: string) =>
  record(s(week, role, 9), CLOUD_FORMS[week - 1], CLOUD_FILES[week - 1], section, actions, why);

const STOP = (week: number, role: string): Step =>
  cli(s(week, role, 8), 'Stop the instance', 'Stop the instance so it stops costing money.', [
    { cmd: `${IID}; aws ec2 stop-instances --instance-ids $IID --query "StoppingInstances[0].CurrentState.Name" --output text`, explain: 'A stopped instance pays only for its disk. Stopping from inside the OS does the same; forgetting does not.', sample: 'stopping' },
    { cmd: 'aws ec2 wait instance-stopped --instance-ids $IID && echo stopped', explain: 'Waits until it is fully stopped.', sample: 'stopped' },
  ], ['stopped'], 'A running t3.micro costs about 1 cent an hour; a forgotten one eats the budget in weeks.');

const START = `${IID}; aws ec2 start-instances --instance-ids $IID -o text > /dev/null; aws ec2 wait instance-status-ok --instance-ids $IID`;

const TASKS: Task[] = [
  // ── Week 1 — Foundation ────────────────────────────────────────────────
  T(1, 'arch', 'Set the naming standard and the budget', 'Agree how everything is named and tagged, and cap spending at $5 before anything is built.', 40,
    ['AWS tagging best practices', 'Tags', 'AWS Budgets'], ['A $5 budget alerts at 80%', 'The naming and tag table is agreed'], [
    portal(s(1, 'arch', 1), 'Create the $5 budget', 'Create a $5 monthly budget that emails the team.', 'AWS console — Billing and Cost Management → Budgets', [
      'Create budget → Use a template → Monthly cost budget.',
      'Name: capstone-team01. Amount: 5.',
      'Email recipients: the team email. Create.',
    ], 'The budget capstone-team01 is listed with a $5 amount and alerts at 85% and 100%.', 'The budget is the guardrail. It is created first because it is the one thing that tells you a mistake is costing money.', {
      fixes: [{ symptom: 'Access denied to Billing', fix: 'Sign in as the root user once and enable IAM access to billing (Account → IAM user access to billing).' }],
    }),
    portal(s(1, 'arch', 2), 'Agree the naming and tags', 'Agree one naming pattern and four tags as a team.', 'Team meeting', [
      'Pattern: type prefix, workload, team — e.g. ec2-tools-team01.',
      'Prefixes: vpc-, snet-, rt-, igw-, sg-, ec2-, ebs-; buckets and functions start capstone-team01-.',
      'Tags: project, team, env, owner.',
    ], 'A table of prefixes and four tag keys everyone has agreed to use.', 'AWS resource names are mostly free text; the Name tag and a pattern are what make them readable. Week 11 checks the owner tag.'),
    rec(1, 'arch', 'Account and guardrails, Naming, Tags, RACI', [
      'Account alias, region (us-east-1) and the budget.',
      'One naming row per resource type you will create.',
      'The four tags, and a short RACI.',
    ], 'This is the standard every later document and template refers to.'),
  ]),
  T(1, 'infra', 'Create the VPC and public subnet', 'Create a VPC with one public subnet, an internet gateway and a route, named and tagged by the standard.', 45,
    ['VPC CIDR', 'Subnets and AZs', 'Internet gateways and route tables'], ['vpc-capstone-team01 is 10.10.0.0/16', 'The public subnet routes 0.0.0.0/0 to the IGW'], [
    cli(s(1, 'infra', 1), 'Create the VPC and subnet', 'Create the VPC 10.10.0.0/16 and subnet 10.10.1.0/24.', [
      { cmd: 'TAGS="{Key=project,Value=capstone},{Key=team,Value=team01},{Key=owner,Value=team01-infra}"; VPC=$(aws ec2 create-vpc --cidr-block 10.10.0.0/16 --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=vpc-capstone-team01},$TAGS]" --query Vpc.VpcId --output text); echo $VPC', explain: 'The VPC is your private network. Its id is kept in $VPC for the next lines.', sample: 'vpc-0a1b2c3d4e5f67890' },
      { cmd: 'SUB=$(aws ec2 create-subnet --vpc-id $VPC --cidr-block 10.10.1.0/24 --availability-zone us-east-1a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=snet-public-team01},$TAGS]" --query Subnet.SubnetId --output text); echo $SUB', explain: 'A subnet lives in exactly one Availability Zone.', sample: 'subnet-0123456789abcdef0' },
    ], ['vpc-', 'subnet-'], 'A /16 leaves room for 256 /24 subnets; the course uses two. Private ranges never route on the internet.'),
    cli(s(1, 'infra', 2), 'Give it a way out', 'Add an internet gateway and a default route.', [
      { cmd: 'IGW=$(aws ec2 create-internet-gateway --query InternetGateway.InternetGatewayId --output text); aws ec2 attach-internet-gateway --internet-gateway-id $IGW --vpc-id $VPC', explain: 'The internet gateway is the VPC’s door to the internet.', sample: '(no output — attached)' },
      { cmd: 'RT=$(aws ec2 create-route-table --vpc-id $VPC --query RouteTable.RouteTableId --output text); aws ec2 create-route --route-table-id $RT --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW; aws ec2 associate-route-table --route-table-id $RT --subnet-id $SUB --query AssociationState.State --output text', explain: 'A subnet is "public" only because its route table sends 0.0.0.0/0 to the gateway.', sample: '{ "Return": true }\nassociated' },
    ], ['associated'], 'Public or private is a routing decision, not a setting on the subnet.', {
      fixes: [{ symptom: 'VPC variable is empty', fix: 'CloudShell restarted. Look the id up: aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01.' }],
    }),
    rec(1, 'infra', 'Landing zone', ['The VPC and subnet names.', 'The address space and the first subnet.'], 'The Network Design Document in Week 6 starts from these numbers.'),
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
  T(1, 'secops', 'Create the security group', 'Create the tools security group with no inbound rules, and review who has access to the account.', 40,
    ['Security groups', 'Stateful rules', 'IAM users and roles'], ['sg-tools-team01 has no inbound rule', 'Access is listed'], [
    cli(s(1, 'secops', 1), 'Create the security group', 'Create sg-tools-team01 in the VPC.', [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); SG=$(aws ec2 create-security-group --group-name sg-tools-team01 --description "Tools instance" --vpc-id $VPC --query GroupId --output text); echo $SG', explain: 'A security group is a stateful firewall around an instance. It starts by allowing nothing in.', sample: 'sg-0f1e2d3c4b5a69788' },
    ], ['sg-'], 'Security groups are allow-only: there is no deny rule, only the absence of an allow.'),
    cli(s(1, 'secops', 2), 'Read its rules', 'List inbound and outbound rules.', [
      { cmd: 'aws ec2 describe-security-groups --group-ids $SG --query "SecurityGroups[0].{inbound:IpPermissions, outbound:IpPermissionsEgress[0].IpRanges}"', explain: 'Inbound is empty; outbound allows everything, which is the default.', sample: '{ "inbound": [],\n  "outbound": [ { "CidrIp": "0.0.0.0/0" } ] }' },
    ], ['"inbound": []'], 'Knowing the defaults is how you know every rule you add is a decision.'),
    portal(s(1, 'secops', 3), 'Review access (IAM)', 'List who can sign in and with what.', 'AWS console — IAM', [
      'IAM → Users: note each user, group and MFA status.',
      'Confirm the root user has MFA and no access keys.',
    ], 'A list of users, their groups and MFA status.', 'Least privilege starts with knowing what is granted today. Week 5 narrows it.'),
    rec(1, 'secops', 'Access and security group', ['One row per person or group and what they get.'], 'The Week 5 access matrix builds on this list.'),
  ]),

  // ── Week 2 — Website and EC2 ───────────────────────────────────────────
  T(2, 'arch', 'Write the architecture document and cost', 'Estimate the monthly cost of each component, then record the first architecture decision with what was rejected.', 45,
    ['AWS Pricing Calculator', 'Solution architecture documents', 'ADRs'], ['Every component has a monthly cost', 'ADR-001 names the rejected option'], [
    portal(s(2, 'arch', 1), 'Price it', 'Price the components in the AWS Pricing Calculator.', 'calculator.aws', [
      'Add: EC2 (t3.micro, Linux, 730 h), S3 Standard (1 GB), CloudFront (1 GB out).',
      'Add: Lambda, API Gateway HTTP API, DynamoDB on-demand — mostly free tier.',
      'Read the monthly total; then halve the EC2 hours — you stop it.',
    ], 'A monthly estimate per service, with EC2 the largest line.', 'Cost is an architecture property. Knowing which line dominates tells you what to switch off.'),
    portal(s(2, 'arch', 2), 'Write ADR-001', 'Record why the site is S3 behind CloudFront.', 'The document', [
      'Context: a public site with HTTPS for under $1 a month.',
      'Decision: private S3 bucket behind CloudFront with Origin Access Control.',
      'Rejected: the S3 website endpoint — HTTP only; an EC2 web server.',
    ], 'ADR-001 with context, decision, rejected options and consequences.', 'An ADR records the decision and the alternatives, so the next team does not reopen it without new facts.'),
    rec(2, 'arch', 'Components and cost, ADR-001', ['One component per row, with its monthly cost.', 'ADR-001.'], 'The architecture document grows every week and is handed over in Week 12.'),
  ]),
  T(2, 'infra', 'Launch the tools instance', 'Launch a t3.micro Amazon Linux instance in the public subnet with a key pair and IMDSv2, then stop it.', 45,
    ['Instance types', 'Key pairs', 'IMDSv2'], ['ec2-tools-team01 runs in the public subnet', 'The instance is stopped at the end'], [
    cli(s(2, 'infra', 1), 'Launch the instance', 'Launch the t3.micro with IMDSv2 required.', [
      { cmd: 'aws ec2 create-key-pair --key-name kp-team01 --query KeyMaterial --output text > kp-team01.pem && chmod 400 kp-team01.pem', explain: 'The private key is shown once. Download it from CloudShell (Actions → Download) and never commit it.', sample: '(no output — kp-team01.pem saved)' },
      { cmd: 'SUB=$(aws ec2 describe-subnets --filters Name=tag:Name,Values=snet-public-team01 --query "Subnets[0].SubnetId" --output text); SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 run-instances --image-id resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 --instance-type t3.micro --key-name kp-team01 --subnet-id $SUB --security-group-ids $SG --associate-public-ip-address --metadata-options HttpTokens=required --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=ec2-tools-team01},{Key=owner,Value=team01-infra}]" --query "Instances[0].{id:InstanceId, ip:PrivateIpAddress}"', explain: 'resolve:ssm always picks the current Amazon Linux image. HttpTokens=required turns on IMDSv2, which blocks a common credential-theft trick.', sample: '{ "id": "i-0abc123def4567890", "ip": "10.10.1.25" }' },
    ], ['i-0', '10.10.1.'], 't3.micro is free-tier eligible. IMDSv2 is off by default on older launch paths — always require it.', {
      fixes: [{ symptom: 'InvalidParameterCombination: t3.micro', fix: 'Your account’s free tier is t2.micro. Use --instance-type t2.micro and record why.' }],
    }),
    cli(s(2, 'infra', 2), 'Read its network facts', 'Read the private and public IPs.', [
      { cmd: `${IID}; aws ec2 describe-instances --instance-ids $IID --query "Reservations[0].Instances[0].{private:PrivateIpAddress, public:PublicIpAddress, state:State.Name}"`, explain: 'The private IP is what other resources use; the public IP only exists for outbound patching and your SSH test.', sample: '{ "private": "10.10.1.25", "public": "3.91.12.44", "state": "running" }' },
    ], ['running'], 'AWS reserves the first four addresses and the last in every subnet.'),
    rec(2, 'infra', 'Virtual machine facts', ['Name, type, private IP, operating system.'], 'The runbook in Week 7 and the snapshot in Week 8 start from these facts.'),
    STOP(2, 'infra'),
  ]),
  T(2, 'dev', 'Publish the website with CloudFront', 'Publish the site from a private S3 bucket behind CloudFront with Origin Access Control, then change it and redeploy.', 50,
    ['S3 buckets', 'CloudFront', 'Origin Access Control'], ['The site loads over HTTPS', 'The bucket is private', 'A change was redeployed'], [
    cli(s(2, 'dev', 1), 'Create the bucket and upload', 'Create a private bucket and upload the site.', [
      { cmd: 'BUCKET=capstone-team01-site-$RANDOM; aws s3 mb s3://$BUCKET && aws s3 sync ./site s3://$BUCKET', explain: 'Bucket names are global. Block Public Access is on by default — leave it on; CloudFront will read the bucket for you.', sample: 'make_bucket: capstone-team01-site-18342\nupload: site/index.html to s3://capstone-team01-site-18342/index.html' },
    ], ['make_bucket'], 'The bucket never becomes public. That is the difference from the old S3-website approach.'),
    portal(s(2, 'dev', 2), 'Put CloudFront in front', 'Create a distribution with Origin Access Control.', 'AWS console — CloudFront → Create distribution', [
      'Origin: your bucket (not the website endpoint). Origin access: Origin access control settings → Create.',
      'Viewer protocol policy: Redirect HTTP to HTTPS. Default root object: index.html.',
      'Create, then Copy policy and paste it into the bucket’s Permissions → Bucket policy.',
    ], 'The distribution is Enabled and https://d….cloudfront.net shows your page.', 'OAC signs CloudFront’s requests; the bucket policy admits only this distribution. Deployment takes about five minutes.', {
      fixes: [{ symptom: 'AccessDenied XML page', fix: 'The bucket policy was not pasted, or the origin is the website endpoint instead of the bucket.' }],
    }),
    cli(s(2, 'dev', 3), 'Redeploy a change', 'Upload a change and clear the cache.', [
      { cmd: 'aws s3 sync ./site s3://$BUCKET && DIST=$(aws cloudfront list-distributions --query "DistributionList.Items[0].Id" --output text) && aws cloudfront create-invalidation --distribution-id $DIST --paths "/*" --query Invalidation.Status --output text', explain: 'CloudFront caches; an invalidation tells it to fetch the new files.', sample: 'InProgress' },
    ], ['InProgress'], 'Upload plus invalidate is a redeploy. Week 10 automates it.'),
    rec(2, 'dev', 'Website', ['The HTTPS URL.', 'How you redeployed a change.'], 'The CloudFront URL is the origin CORS will admit in Week 3.'),
  ]),
  T(2, 'secops', 'Allow SSH from your IP only', 'Add one inbound rule allowing SSH from your own address, then prove it is allowed from you and blocked elsewhere.', 40,
    ['Security group rules', '/32 source addresses', 'Allowed and blocked tests'], ['SSH works from your IP', 'SSH is blocked from CloudShell'], [
    cli(s(2, 'secops', 1), 'Add the SSH rule', 'Allow TCP 22 from your IP address only.', [
      { cmd: 'MYIP=$(curl -s https://checkip.amazonaws.com); echo $MYIP', explain: 'Run this on YOUR laptop, not CloudShell: it prints the address your laptop reaches the internet from.', sample: '203.0.113.25' },
      { cmd: 'SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr $MYIP/32 --query "SecurityGroupRules[0].CidrIpv4" --output text', explain: 'A /32 is exactly one address.', sample: '203.0.113.25/32' },
    ], ['/32'], 'Never 0.0.0.0/0 on port 22: bots scan the whole internet for open SSH within minutes.'),
    portal(s(2, 'secops', 2), 'Test allowed and blocked', 'Test SSH from your laptop, then from CloudShell.', 'Your laptop, then CloudShell', [
      'Start the instance: EC2 → Instances → ec2-tools-team01 → Start.',
      'From your laptop: ssh -i kp-team01.pem ec2-user@PUBLIC_IP — expect a prompt.',
      'From CloudShell: the same command — expect a timeout.',
      'Stop the instance when done.',
    ], 'SSH connects from your laptop and times out from CloudShell.', 'A rule is only proved when something that should fail does fail.', {
      fixes: [{ symptom: 'Timeout from your laptop too', fix: 'Your IP changed (Wi-Fi, VPN). Re-run the first command and add the new address.' }],
    }),
    rec(2, 'secops', 'SSH access test', ['One allowed row, one blocked row.'], 'Week 6 removes this rule entirely; this record is the before.'),
  ]),

  // ── Week 3 — Serverless API ────────────────────────────────────────────
  T(3, 'arch', 'Draw the request flow with real URLs', 'Trace how a page view becomes a count in the table, naming every real URL and resource.', 35,
    ['Request flows', 'Architecture versions'], ['The flow names real URLs'], [
    portal(s(3, 'arch', 1), 'Read Architecture v3', 'Open the architecture diagram at week 3.', 'Guide → Architecture & IaC', [
      'Move the slider to v3. New resources glow.',
      'Follow the solid arrows from Visitors to DynamoDB.',
      'Click the Lambda function: the template highlights its lines.',
    ], 'You can name every hop from the browser to the table.', 'The diagram is drawn from the template, so it is the environment you are building, not an illustration.'),
    portal(s(3, 'arch', 2), 'Write the flow', 'Write the flow with your real URLs.', 'The document', [
      'Browser → https://d….cloudfront.net (S3 via OAC).',
      'Page script → GET https://….execute-api.us-east-1.amazonaws.com/count.',
      'Lambda → DynamoDB table capstone-team01-visitors, item id "site".',
    ], 'A three-hop flow with real URLs and resource names.', 'A flow with real URLs is testable. Week 6 tests each hop.'),
    rec(3, 'arch', 'Request flow', ['The flow, hop by hop.'], 'Week 6’s path tests follow this flow.'),
  ]),
  T(3, 'infra', 'Create the DynamoDB table', 'Create an on-demand DynamoDB table and seed the counter item.', 35,
    ['DynamoDB on-demand', 'Partition keys'], ['Table capstone-team01-visitors exists', 'Item id "site" has count 0'], [
    cli(s(3, 'infra', 1), 'Create the table', 'Create an on-demand table keyed on id.', [
      { cmd: 'aws dynamodb create-table --table-name capstone-team01-visitors --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --tags Key=owner,Value=team01-infra --query TableDescription.TableStatus --output text', explain: 'On-demand bills per request, so an idle counter costs nothing.', sample: 'CREATING' },
      { cmd: 'aws dynamodb wait table-exists --table-name capstone-team01-visitors && echo ACTIVE', explain: 'Waits until the table can take writes.', sample: 'ACTIVE' },
    ], ['ACTIVE'], 'Provisioned capacity would charge every hour even when nobody visits.'),
    cli(s(3, 'infra', 2), 'Seed the counter', 'Put the item { id: site, count: 0 }.', [
      { cmd: 'aws dynamodb put-item --table-name capstone-team01-visitors --item \'{"id":{"S":"site"},"count":{"N":"0"}}\' && aws dynamodb get-item --table-name capstone-team01-visitors --key \'{"id":{"S":"site"}}\' --output text', explain: 'DynamoDB types every value: S for string, N for number.', sample: 'COUNT\t0\nID\tsite' },
    ], ['site'], 'The Lambda updates this one item.'),
    rec(3, 'infra', 'Data store', ['Table name, partition key, the seed item.'], 'The API spec’s data model.'),
  ]),
  T(3, 'dev', 'Build the counter Lambda and API', 'Create a Lambda that atomically adds one to the counter, put an HTTP API in front, and show the count on the site.', 50,
    ['AWS Lambda', 'API Gateway HTTP APIs', 'Atomic updates'], ['The API returns a count', 'The site shows it'], [
    portal(s(3, 'dev', 1), 'Create the function', 'Create a Python Lambda that adds one to the count.', 'AWS console — Lambda → Create function', [
      'Name capstone-team01-counter, Python 3.12, create a new basic execution role.',
      'Code: update_item with UpdateExpression "ADD #c :one", ReturnValues UPDATED_NEW. Deploy.',
      'Configuration → Environment variables: TABLE_NAME = capstone-team01-visitors.',
    ], 'The function exists; a Test event returns a count.', 'ADD is atomic: two visitors at once both count. The Test fails until the role may write the table — next step.'),
    portal(s(3, 'dev', 2), 'Let it write the table, add the API', 'Grant the table, then add an HTTP API trigger.', 'Lambda → Configuration → Permissions, then Add trigger', [
      'Role → Add permissions → Create inline policy: dynamodb:UpdateItem on the table’s ARN only.',
      'Add trigger → API Gateway → Create HTTP API, security Open.',
      'Copy the API endpoint.',
    ], 'The trigger is listed with an https://….execute-api… endpoint.', 'The role names one action on one table. Week 5 checks nothing broader crept in.'),
    cli(s(3, 'dev', 3), 'Call it and show it', 'Call the API, then add the count to the page.', [
      { cmd: 'API=https://abc123.execute-api.us-east-1.amazonaws.com/default/capstone-team01-counter; curl -s $API', explain: 'Each call adds one. Then add fetch() of this URL to site/index.html, writing the result into #visitor-count, and redeploy.', sample: '{"count": 1}' },
    ], ['count'], 'The page calls the API from the browser, which is why CORS matters next.'),
    rec(3, 'dev', 'Endpoints', ['GET, the path, what it returns, its status codes.'], 'The spec another developer would call your API from.'),
  ]),
  T(3, 'secops', 'Lock CORS and keep secrets out', 'Allow only your site to call the API from a browser, prove another origin is refused, and confirm no key exists anywhere.', 45,
    ['CORS', 'Negative tests', 'Roles instead of keys'], ['Only your site is allowed', 'A foreign origin is refused'], [
    cli(s(3, 'secops', 1), 'Allow only your site', 'Set the API’s CORS to your site only.', [
      { cmd: 'APIID=$(aws apigatewayv2 get-apis --query "Items[?contains(Name, \'capstone-team01\')].ApiId | [0]" --output text); SITE=https://d111111abcdef8.cloudfront.net', explain: 'Set SITE to your own CloudFront URL, no trailing slash.', sample: '(no output — the variables are set)' },
      { cmd: 'aws apigatewayv2 update-api --api-id $APIID --cors-configuration AllowOrigins=$SITE,AllowMethods=GET --query CorsConfiguration', explain: 'Browsers only let pages from listed origins read the API’s answers.', sample: '{ "AllowMethods": [ "GET" ],\n  "AllowOrigins": [ "https://d111111abcdef8.cloudfront.net" ] }' },
    ], ['AllowOrigins'], 'Never "*": a wildcard lets any website use your API from its visitors’ browsers.'),
    cli(s(3, 'secops', 2), 'Prove a foreign origin is refused', 'Call the API as another website would.', [
      { cmd: 'curl -s -D - -o /dev/null -H "Origin: https://evil.example" $API | grep -i access-control || echo "no CORS header — refused"', explain: 'A foreign origin gets no Access-Control-Allow-Origin header, so its browser discards the answer. Set $API to your endpoint first.', sample: 'no CORS header — refused' },
    ], ['refused'], 'CORS protects browsers, not the API: curl still gets a count. That is why the API holds no secrets.'),
    portal(s(3, 'secops', 3), 'Confirm there is no key', 'Check the page and the function hold no key.', 'Browser, then Lambda → Configuration', [
      'View the site source: only the API URL, no key.',
      'Lambda environment variables: only TABLE_NAME. Access comes from the role.',
    ], 'No key anywhere; the function reaches the table through its role.', 'An IAM role hands out short-lived credentials automatically — there is nothing to leak.'),
    rec(3, 'secops', 'CORS and secrets', ['The allowed origin, the negative test, where access comes from.'], 'The first line of the secrets register.'),
  ]),

  // ── Week 4 — Operate ───────────────────────────────────────────────────
  T(4, 'arch', 'Report the cost to date', 'Read what the environment has cost so far, by service, and name the largest line.', 30,
    ['Cost Explorer', 'Cost by service'], ['Spend and largest cost reported'], [
    cli(s(4, 'arch', 1), 'Read the cost', 'Group this month’s cost by service.', [
      { cmd: 'aws ce get-cost-and-usage --time-period Start=$(date +%Y-%m-01),End=$(date -d tomorrow +%F) --granularity MONTHLY --metrics UnblendedCost --group-by Type=DIMENSION,Key=SERVICE --query "ResultsByTime[0].Groups[].[Keys[0], Metrics.UnblendedCost.Amount]" --output text', explain: 'Cost Explorer by service for the month so far. Each call costs $0.01; the console view is free.', sample: 'Amazon Elastic Compute Cloud - Compute\t0.31\nAmazon Simple Storage Service\t0.01' },
    ], ['Amazon'], 'Actual cost against the estimate is how you find what you forgot to switch off.'),
    rec(4, 'arch', 'Cost this week', ['Spend to date, and the largest cost with its reason.'], 'Week 11 turns this into the cost report.'),
  ]),
  T(4, 'infra', 'Alarm on Lambda errors', 'Create an SNS topic and a CloudWatch alarm that emails when the function errors.', 40,
    ['CloudWatch alarms', 'SNS topics'], ['The alarm exists and emails the team'], [
    cli(s(4, 'infra', 1), 'Create the topic', 'Create an SNS topic that emails the team.', [
      { cmd: 'TOPIC=$(aws sns create-topic --name capstone-team01-alerts --query TopicArn --output text); aws sns subscribe --topic-arn $TOPIC --protocol email --notification-endpoint team01-alerts@school.edu --query SubscriptionArn --output text', explain: 'Confirm the subscription from the email AWS sends, or nothing is delivered.', sample: 'pending confirmation' },
    ], ['pending confirmation'], 'One topic, many alarms: change the email once.'),
    cli(s(4, 'infra', 2), 'Create the alarm', 'Alarm when Errors is above zero in five minutes.', [
      { cmd: 'aws cloudwatch put-metric-alarm --alarm-name capstone-team01-counter-errors --namespace AWS/Lambda --metric-name Errors --dimensions Name=FunctionName,Value=capstone-team01-counter --statistic Sum --period 300 --evaluation-periods 1 --threshold 0 --comparison-operator GreaterThanThreshold --treat-missing-data notBreaching --alarm-actions $TOPIC && aws cloudwatch describe-alarms --alarm-names capstone-team01-counter-errors --query "MetricAlarms[0].StateValue" --output text', explain: 'Any error in five minutes fires it. Missing data (no traffic) is treated as fine.', sample: 'OK' },
    ], ['OK'], 'Errors are the signal users feel.'),
    rec(4, 'infra', 'Signals', ['The signal, where it is measured, the threshold, the action.'], 'The monitoring half of the incident report.'),
  ]),
  T(4, 'dev', 'Find a failure in CloudWatch Logs', 'Break the function on purpose, find the error in CloudWatch Logs, and restore it.', 45,
    ['CloudWatch Logs', 'Reading stack traces'], ['The error is found', 'The API works again'], [
    cli(s(4, 'dev', 1), 'Break it', 'Point the function at a table that does not exist.', [
      { cmd: 'aws lambda update-function-configuration --function-name capstone-team01-counter --environment "Variables={TABLE_NAME=capstone-team01-missing}" --query LastUpdateStatus --output text', explain: 'The API now returns 500. Load the site twice to generate errors.', sample: 'InProgress' },
    ], ['InProgress'], 'Breaking it yourself means you know the answer, so you can learn the tool that finds it.'),
    cli(s(4, 'dev', 2), 'Find it', 'Read the latest errors from the log group.', [
      { cmd: 'aws logs filter-log-events --log-group-name /aws/lambda/capstone-team01-counter --filter-pattern ERROR --max-items 2 --query "events[].message" --output text', explain: 'Every Lambda writes to a log group named after it.', sample: '[ERROR] ResourceNotFoundException: Requested resource not found' },
    ], ['ResourceNotFoundException'], 'The exception names the layer — configuration — before you open any code.'),
    cli(s(4, 'dev', 3), 'Restore it', 'Put the right table name back and retest.', [
      { cmd: 'aws lambda update-function-configuration --function-name capstone-team01-counter --environment "Variables={TABLE_NAME=capstone-team01-visitors}" -o none; sleep 5; curl -s $API', explain: 'Set $API to your endpoint. A count means it is fixed.', sample: '{"count": 12}' },
    ], ['count'], 'A fix is not done until the retest passes.'),
    rec(4, 'dev', 'Signals', ['Add a signal row for errors in CloudWatch Logs.'], 'Your half of the monitoring table.'),
  ]),
  T(4, 'secops', 'Work one incident layer by layer', 'Break CORS on purpose, then work it as an incident: symptom, layer, evidence, root cause, fix, prevention.', 45,
    ['ITIL incident management', 'Layer-by-layer troubleshooting'], ['An incident record with all six parts'], [
    cli(s(4, 'secops', 1), 'Inject the fault', 'Replace the allowed origin with a wrong one.', [
      { cmd: 'APIID=$(aws apigatewayv2 get-apis --query "Items[?contains(Name, \'capstone-team01\')].ApiId | [0]" --output text); aws apigatewayv2 update-api --api-id $APIID --cors-configuration AllowOrigins=https://wrong.example,AllowMethods=GET --query CorsConfiguration.AllowOrigins', explain: 'The page still loads, but its script can no longer read the count.', sample: '[ "https://wrong.example" ]' },
    ], ['wrong.example'], 'A realistic fault: nothing is “down”, one feature silently stops.'),
    portal(s(4, 'secops', 2), 'Find the layer', 'Follow the symptom down the layers.', 'Browser DevTools → Console and Network', [
      'Symptom: the count is missing.',
      'Network tab: the API answered 200 — the network and the function work.',
      'Console: “blocked by CORS policy” — the configuration layer.',
    ], 'The console names CORS as the cause.', 'Working down the layers stops you fixing what is not broken.'),
    cli(s(4, 'secops', 3), 'Fix and retest', 'Put your site back and reload.', [
      { cmd: 'aws apigatewayv2 update-api --api-id $APIID --cors-configuration AllowOrigins=https://d111111abcdef8.cloudfront.net,AllowMethods=GET --query CorsConfiguration.AllowOrigins', explain: 'Use your own CloudFront URL. Reload the site: the count returns.', sample: '[ "https://d111111abcdef8.cloudfront.net" ]' },
    ], ['cloudfront.net'], 'Week 10 puts CORS in the template, so drift like this is corrected by the next deploy.'),
    rec(4, 'secops', 'Incident record', ['Symptom, layer, evidence, root cause, fix, prevention.'], 'Week 12 runs this loop again under time pressure.'),
  ]),

  // ── Week 5 — Identity ──────────────────────────────────────────────────
  T(5, 'arch', 'Write the access matrix', 'List every principal, its policies and scope, with a justification for each.', 35,
    ['Least privilege', 'Managed and inline policies'], ['Three or more justified grants'], [
    cli(s(5, 'arch', 1), 'Export the grants', 'List users and groups with their policies.', [
      { cmd: 'aws iam get-account-authorization-details --filter User Group --query "{users: UserDetailList[].[UserName, AttachedManagedPolicies[].PolicyName], groups: GroupDetailList[].[GroupName, AttachedManagedPolicies[].PolicyName]}" --output json', explain: 'Every user and group, with the managed policies attached to each.', sample: '{ "users": [ [ "team01-infra", [ "PowerUserAccess" ] ] ],\n  "groups": [] }' },
    ], ['users'], 'A policy attached to a user is the one people forget to review.'),
    rec(5, 'arch', 'Access matrix', ['One row per grant: principal, policy, scope, why.', 'Mark any grant broader than it needs to be.'], 'Week 11’s posture review reads this matrix.'),
  ]),
  T(5, 'infra', 'Create a read-only group', 'Create an IAM group with ReadOnlyAccess — the access an auditor or a new hire starts with.', 30,
    ['IAM groups', 'AWS managed policies'], ['The group holds ReadOnlyAccess'], [
    cli(s(5, 'infra', 1), 'Create the group', 'Create the group and attach ReadOnlyAccess.', [
      { cmd: 'aws iam create-group --group-name capstone-team01-readonly --query Group.Arn --output text && aws iam attach-group-policy --group-name capstone-team01-readonly --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess', explain: 'Grant to groups, not people: joining and leaving the team becomes one membership change.', sample: 'arn:aws:iam::123456789012:group/capstone-team01-readonly' },
      { cmd: 'aws iam list-attached-group-policies --group-name capstone-team01-readonly --query "AttachedPolicies[].PolicyName" --output text', explain: 'Reads the grant back.', sample: 'ReadOnlyAccess' },
    ], ['ReadOnlyAccess'], 'ReadOnlyAccess can see everything and change nothing.'),
    rec(5, 'infra', 'Access matrix', ['Add the group’s row with its justification.'], 'The matrix records who can see, not only who can change.'),
  ]),
  T(5, 'dev', 'Scope the Lambda role to the table', 'Read the function’s role and make sure it can update one item table and nothing else.', 40,
    ['Execution roles', 'Resource ARNs in policies'], ['The role names the table ARN only', 'The API still works'], [
    cli(s(5, 'dev', 1), 'Read the role’s policies', 'List what the function’s role may do.', [
      { cmd: 'ROLE=$(aws lambda get-function-configuration --function-name capstone-team01-counter --query Role --output text | cut -d/ -f3-); aws iam list-attached-role-policies --role-name $ROLE --query "AttachedPolicies[].PolicyName" --output text; aws iam list-role-policies --role-name $ROLE --output text', explain: 'Attached managed policies, then inline ones. Only basic logging and your table policy should appear.', sample: 'AWSLambdaBasicExecutionRole-1a2b3c\nPOLICYNAMES\tcount-visitors' },
    ], ['count-visitors'], 'If AmazonDynamoDBFullAccess appears, the console added it — detach it.'),
    cli(s(5, 'dev', 2), 'Check the resource', 'Confirm the inline policy names one table.', [
      { cmd: 'aws iam get-role-policy --role-name $ROLE --policy-name count-visitors --query "PolicyDocument.Statement[0].[Action, Resource]" --output text', explain: 'One action, one table ARN. No wildcard.', sample: 'dynamodb:UpdateItem\narn:aws:dynamodb:us-east-1:123456789012:table/capstone-team01-visitors' },
    ], ['table/capstone-team01-visitors'], 'This is AWS’s answer to a managed identity: the credentials rotate by themselves, and the policy is the fence.'),
    rec(5, 'dev', 'Secrets register', ['The database access row: stored in — nothing; read by — the execution role.'], 'The register shows a secret that never existed.'),
  ]),
  T(5, 'secops', 'Prove an access is denied', 'Ask IAM whether the read-only group could stop the instance, and record the denial.', 35,
    ['IAM policy simulator', 'Denied-access tests'], ['A denial is recorded'], [
    cli(s(5, 'secops', 1), 'Simulate the group', 'Simulate stopping an instance as the read-only group.', [
      { cmd: 'ARN=$(aws iam get-group --group-name capstone-team01-readonly --query Group.Arn --output text); aws iam simulate-principal-policy --policy-source-arn $ARN --action-names ec2:StopInstances ec2:DescribeInstances --query "EvaluationResults[].[EvalActionName, EvalDecision]" --output text', explain: 'The simulator evaluates the real policies without calling anything.', sample: 'ec2:StopInstances\timplicitDeny\nec2:DescribeInstances\tallowed' },
    ], ['implicitDeny', 'allowed'], 'One allowed and one denied action prove the policy does what the matrix says.'),
    rec(5, 'secops', 'Access tests', ['Who, what they tried, expected, result.'], 'Evidence that the matrix is enforced, not just written.'),
  ]),

  // ── Week 6 — Networking ────────────────────────────────────────────────
  T(6, 'arch', 'Write the network design document', 'Write the address plan, the rules and the admin path, and say what production would add.', 40,
    ['RFC 1918', 'Public and private subnets', 'Design trade-offs'], ['Address plan and rules recorded', 'The production gap is stated'], [
    cli(s(6, 'arch', 1), 'Read the address plan', 'List every subnet in the VPC.', [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC --query "Subnets[].[Tags[?Key==\'Name\']|[0].Value, CidrBlock, AvailabilityZone]" --output text', explain: 'One line per subnet: its name, range and zone.', sample: 'snet-public-team01\t10.10.1.0/24\tus-east-1a\nsnet-private-team01\t10.10.2.0/24\tus-east-1a' },
    ], ['10.10.2.0/24'], 'The plan is read from AWS, not remembered.'),
    rec(6, 'arch', 'Design summary', ['How admins reach the instance now.', 'What production would add: a NAT gateway, the instance private.'], 'Honest about the trade-off: a public IP for outbound only, to avoid $32 a month.'),
  ]),
  T(6, 'infra', 'Add the private subnet', 'Add a private subnet with its own route table that has no route to the internet.', 35,
    ['Private subnets', 'Route tables'], ['snet-private-team01 is 10.10.2.0/24', 'Its route table has only local'], [
    cli(s(6, 'infra', 1), 'Create the subnet and its route table', 'Create 10.10.2.0/24 with a local-only route table.', [
      { cmd: 'VPC=$(aws ec2 describe-vpcs --filters Name=tag:Name,Values=vpc-capstone-team01 --query "Vpcs[0].VpcId" --output text); PSUB=$(aws ec2 create-subnet --vpc-id $VPC --cidr-block 10.10.2.0/24 --availability-zone us-east-1a --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=snet-private-team01}]" --query Subnet.SubnetId --output text)', explain: 'The next /24. It stays private because nothing routes it to the gateway.', sample: '(no output — $PSUB holds the subnet id)' },
      { cmd: 'PRT=$(aws ec2 create-route-table --vpc-id $VPC --query RouteTable.RouteTableId --output text); aws ec2 associate-route-table --route-table-id $PRT --subnet-id $PSUB -o none; aws ec2 describe-route-tables --route-table-ids $PRT --query "RouteTables[0].Routes[].[DestinationCidrBlock, GatewayId]" --output text', explain: 'A new route table has only the local route — no way out.', sample: '10.10.0.0/16\tlocal' },
    ], ['local'], 'Private means “no route to the internet gateway”, and this output proves it.'),
    rec(6, 'infra', 'Address plan', ['One row per subnet: CIDR, purpose, route to internet.'], 'The template in Week 9 must match this plan.'),
  ]),
  T(6, 'dev', 'Trace the request paths', 'Test each hop of the website and API paths, and one path that must be refused.', 35,
    ['HTTP status codes', 'Path testing'], ['Reachable and refused paths recorded'], [
    cli(s(6, 'dev', 1), 'Test the public paths', 'Test HTTPS, HTTP and the bucket directly.', [
      { cmd: 'SITE=d111111abcdef8.cloudfront.net; curl -sI https://$SITE | head -1; curl -sI http://$SITE | head -1', explain: 'HTTPS answers 200; HTTP is redirected to HTTPS by the viewer policy.', sample: 'HTTP/2 200\nHTTP/1.1 301 Moved Permanently' },
      { cmd: 'BUCKET=$(aws s3 ls | grep capstone-team01-site | awk \'{print $3}\'); curl -sI https://$BUCKET.s3.amazonaws.com/index.html | head -1', explain: 'Going around CloudFront to the bucket must be refused.', sample: 'HTTP/1.1 403 Forbidden' },
    ], ['200', '403 Forbidden'], 'The refused path proves the bucket is private — only CloudFront gets in.'),
    rec(6, 'dev', 'Request paths', ['HTTPS reachable, HTTP redirected, bucket refused, API reachable.'], 'Paths tested both ways are the design proved.'),
  ]),
  T(6, 'secops', 'Remove SSH and use Session Manager', 'Give the instance a Session Manager role, delete the SSH rule, and administer it with no open port.', 50,
    ['Session Manager', 'Instance profiles', 'Attack surface'], ['No inbound rule', 'A command ran through Session Manager'], [
    cli(s(6, 'secops', 1), 'Give the instance a role', 'Create an SSM role and attach it to the instance.', [
      { cmd: 'aws iam create-role --role-name capstone-team01-ssm --assume-role-policy-document \'{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}\' -o none && aws iam attach-role-policy --role-name capstone-team01-ssm --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore', explain: 'The role lets the instance’s SSM agent talk to Systems Manager — nothing else.', sample: '(no output — the role and its policy exist)' },
      { cmd: `aws iam create-instance-profile --instance-profile-name capstone-team01-ssm -o none && aws iam add-role-to-instance-profile --instance-profile-name capstone-team01-ssm --role-name capstone-team01-ssm && sleep 10 && ${IID} && aws ec2 associate-iam-instance-profile --instance-id $IID --iam-instance-profile Name=capstone-team01-ssm --query IamInstanceProfileAssociation.State --output text`, explain: 'An instance profile is how a role is handed to an instance.', sample: 'associating' },
    ], ['associating'], 'The agent is already installed on Amazon Linux; it only needed permission.'),
    cli(s(6, 'secops', 2), 'Remove SSH, run a command', 'Revoke the SSH rule and run a command through SSM.', [
      { cmd: 'SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 revoke-security-group-ingress --group-id $SG --ip-permissions "$(aws ec2 describe-security-groups --group-ids $SG --query SecurityGroups[0].IpPermissions)" -o none; aws ec2 describe-security-groups --group-ids $SG --query "SecurityGroups[0].IpPermissions"', explain: 'Revokes every inbound rule. The empty list is the proof.', sample: '[]' },
      { cmd: `${START}; ${ssm('hostname; systemctl is-active amazon-ssm-agent')}`, explain: 'Session Manager goes out through the agent, so no inbound port is needed. Give it a minute after starting.', sample: 'ip-10-10-1-25.ec2.internal\nactive' },
    ], ['[]', 'active'], 'The safest open port is none: admin goes through an authenticated, logged AWS API.'),
    rec(6, 'secops', 'Security group rules', ['Every inbound and outbound rule with its reason.', 'The empty inbound list.'], 'The rules matrix of the network design.'),
    STOP(6, 'secops'),
  ]),

  // ── Week 7 — Server Admin ──────────────────────────────────────────────
  T(7, 'arch', 'Decide the instance size', 'Read the instance’s CPU use and decide whether t3.micro is still the right size.', 30,
    ['Right-sizing', 'Burstable instances'], ['A size decision with its evidence'], [
    cli(s(7, 'arch', 1), 'Read the CPU history', 'Read the average CPU for the last week.', [
      { cmd: `${IID}; aws cloudwatch get-metric-statistics --namespace AWS/EC2 --metric-name CPUUtilization --dimensions Name=InstanceId,Value=$IID --start-time $(date -d '-7 days' +%FT%T) --end-time $(date +%FT%T) --period 86400 --statistics Average --query "Datapoints[].[Timestamp, Average]" --output text`, explain: 'Daily averages. T3 instances earn CPU credits while idle, so a low average is normal and healthy.', sample: '2026-10-20T00:00:00+00:00\t2.4' },
    ], ['2026-'], 'Right-sizing is cost control with evidence, not a guess.'),
    rec(7, 'arch', 'Sizing decision', ['Size now; keep, grow or shrink, and why.'], 'The decision is reversible and cheap — record it anyway.'),
  ]),
  T(7, 'infra', 'Attach and mount an EBS volume', 'Add a 4 GB encrypted gp3 volume to the instance and mount it at /data so it survives a reboot.', 45,
    ['EBS volumes', 'NVMe device names', 'fstab'], ['/data is mounted', 'The instance is stopped'], [
    cli(s(7, 'infra', 1), 'Create and attach the volume', 'Create a 4 GB encrypted volume and attach it.', [
      { cmd: `${START}; VOL=$(aws ec2 create-volume --size 4 --volume-type gp3 --encrypted --availability-zone us-east-1a --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=ebs-data-tools-team01}]" --query VolumeId --output text); aws ec2 wait volume-available --volume-ids $VOL; aws ec2 attach-volume --volume-id $VOL --instance-id $IID --device /dev/sdf --query State --output text`, explain: 'A volume must be in the same Availability Zone as the instance.', sample: 'attaching' },
    ], ['attaching'], 'Data on its own volume can be snapshotted and restored without touching the OS.'),
    cli(s(7, 'infra', 2), 'Format and mount it', 'Format the volume and mount it at /data.', [
      { cmd: ssm('D=/dev/nvme1n1; mkfs -t xfs -q $D; mkdir -p /data; echo UUID=$(blkid -s UUID -o value $D) /data xfs defaults,nofail 0 2 >> /etc/fstab; mount -a; df -h /data'), explain: 'On t3, /dev/sdf appears as /dev/nvme1n1. fstab uses the UUID because NVMe names can change.', sample: 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme1n1    4.0G   61M  3.9G   2% /data' },
    ], ['/data'], 'A mount that is not in fstab disappears at the next reboot.'),
    rec(7, 'infra', 'Storage', ['The volume, its size, where it is mounted.'], 'The runbook’s storage section.'),
    STOP(7, 'infra'),
  ]),
  T(7, 'dev', 'Patch with Patch Manager', 'Scan for missing updates and install them through Systems Manager Patch Manager.', 40,
    ['Patch Manager', 'Patch baselines'], ['A patch run succeeded', 'The instance is stopped'], [
    cli(s(7, 'dev', 1), 'Install patches', 'Run the patch baseline in Install mode.', [
      { cmd: `${START}; CID=$(aws ssm send-command --instance-ids $IID --document-name AWS-RunPatchBaseline --parameters Operation=Install --query Command.CommandId --output text); aws ssm wait command-executed --command-id $CID --instance-id $IID; aws ssm get-command-invocation --command-id $CID --instance-id $IID --query Status --output text`, explain: 'AWS-RunPatchBaseline applies the default baseline and reports compliance.', sample: 'Success' },
      { cmd: 'aws ssm describe-instance-patch-states --instance-ids $IID --query "InstancePatchStates[0].[InstalledCount, MissingCount, FailedCount]" --output text', explain: 'Installed, still missing, failed.', sample: '412\t0\t0' },
    ], ['Success'], 'Patching through the platform leaves a compliance record an auditor can read.'),
    rec(7, 'dev', 'Patching', ['The tool, and the result of the run.'], 'Patch evidence for the runbook and the governance report.'),
    STOP(7, 'dev'),
  ]),
  T(7, 'secops', 'Baseline the instance and write the runbook', 'Record what normal looks like on the instance and write the steps to check it is healthy.', 45,
    ['Performance baselines', 'Runbooks'], ['Three baseline metrics', 'A four-step runbook'], [
    cli(s(7, 'secops', 1), 'Take the baseline', 'Read load, memory and disk on the instance.', [
      { cmd: `${START}; ${ssm('uptime; free -m | head -2; df -h / | tail -1')}`, explain: 'Load average, free memory and disk use, taken while idle — that is what normal means.', sample: ' 14:02:11 up 2 min,  load average: 0.05, 0.08, 0.03\nMem:  949  298  402\n/dev/nvme0n1p1  8.0G  1.6G  6.4G  20% /' },
    ], ['load average'], 'You cannot say “it is slow” without knowing what fast looked like.'),
    rec(7, 'secops', 'Performance baseline, Runbook', ['Three metrics: normal and alert level.', 'Four runbook steps: check, expect.'], 'The runbook is what a teammate on call follows.'),
    STOP(7, 'secops'),
  ]),

  // ── Week 8 — Backup and Recovery ───────────────────────────────────────
  T(8, 'arch', 'Set RPO and RTO per asset', 'For each asset, decide how much data the company can lose and how fast it must return.', 30,
    ['Business impact analysis', 'RPO and RTO'], ['Three assets with RPO, RTO and method'], [
    portal(s(8, 'arch', 1), 'Rank the assets', 'Rank the website, the counter data and the instance.', 'Team meeting', [
      'Ask: what does an hour of this being down cost?',
      'RPO: how much data can we lose? RTO: how fast must it return?',
      'Name the protection: versioning, snapshot, or the template.',
    ], 'Three assets ranked, each with an RPO, an RTO and a method.', 'Targets come first, backups second: the target decides how often you back up.'),
    rec(8, 'arch', 'Business impact', ['One row per asset.'], 'Week 12’s recovery scenario is judged against these numbers.'),
  ]),
  T(8, 'infra', 'Restore a volume from a snapshot', 'Snapshot the data volume, create a new volume from it, and clean up.', 40,
    ['EBS snapshots', 'Restore testing'], ['A volume restored from a snapshot', 'The test volume is deleted'], [
    cli(s(8, 'infra', 1), 'Snapshot and restore', 'Snapshot the data volume and make a volume from it.', [
      { cmd: 'VOL=$(aws ec2 describe-volumes --filters Name=tag:Name,Values=ebs-data-tools-team01 --query "Volumes[0].VolumeId" --output text); SNAP=$(aws ec2 create-snapshot --volume-id $VOL --description "team01 data" --query SnapshotId --output text); aws ec2 wait snapshot-completed --snapshot-ids $SNAP && echo $SNAP', explain: 'Snapshots are incremental and stored in S3 — cents a month.', sample: 'snap-0a1b2c3d4e5f67890' },
      { cmd: 'NEW=$(aws ec2 create-volume --snapshot-id $SNAP --availability-zone us-east-1a --volume-type gp3 --query VolumeId --output text); aws ec2 wait volume-available --volume-ids $NEW && echo available', explain: 'A new volume from the snapshot. Attach it to check the files, if you like.', sample: 'available' },
    ], ['snap-', 'available'], 'Snapshots are cheap; AWS Backup is an optional stretch.'),
    cli(s(8, 'infra', 2), 'Clean up the test volume', 'Delete the restored test volume.', [
      { cmd: 'aws ec2 delete-volume --volume-id $NEW && aws ec2 describe-volumes --filters Name=tag:Name,Values=ebs-data-tools-team01 --query "Volumes[].State" --output text', explain: 'Keep the snapshot and the original; delete the test copy.', sample: 'in-use' },
    ], ['in-use'], 'A restore test leaves nothing behind but the evidence.'),
    rec(8, 'infra', 'VM restore', ['The snapshot id, and whether the data was present.'], 'The first proven restore in the DR plan.'),
  ]),
  T(8, 'dev', 'Recover a deleted web file', 'Turn on bucket versioning, delete index.html, and get it back by removing the delete marker.', 40,
    ['S3 versioning', 'Delete markers'], ['index.html was recovered', 'The site loads again'], [
    cli(s(8, 'dev', 1), 'Turn on versioning', 'Enable versioning on the site bucket.', [
      { cmd: "BUCKET=$(aws s3 ls | grep capstone-team01-site | awk '{print $3}'); aws s3api put-bucket-versioning --bucket $BUCKET --versioning-configuration Status=Enabled && aws s3api get-bucket-versioning --bucket $BUCKET --output text", explain: 'Every overwrite and delete now keeps the previous version.', sample: 'Enabled' },
      { cmd: 'aws s3 cp s3://$BUCKET/index.html s3://$BUCKET/index.html --metadata-directive REPLACE -o none 2>/dev/null; aws s3 sync ./site s3://$BUCKET', explain: 'Upload once more so a versioned copy exists.', sample: 'upload: site/index.html to s3://capstone-team01-site-18342/index.html' },
    ], ['Enabled'], 'Protection has to be on BEFORE the accident.'),
    cli(s(8, 'dev', 2), 'Delete and recover', 'Delete index.html, then remove the delete marker.', [
      { cmd: "aws s3 rm s3://$BUCKET/index.html && MARK=$(aws s3api list-object-versions --bucket $BUCKET --prefix index.html --query 'DeleteMarkers[0].VersionId' --output text)", explain: 'With versioning on, a delete only adds a marker on top.', sample: 'delete: s3://capstone-team01-site-18342/index.html' },
      { cmd: 'aws s3api delete-object --bucket $BUCKET --key index.html --version-id $MARK -o none && aws s3api head-object --bucket $BUCKET --key index.html --query ContentType --output text', explain: 'Removing the marker brings the file back.', sample: 'text/html' },
    ], ['text/html'], 'A backup is only real once you have restored from it.'),
    rec(8, 'dev', 'Website restore', ['What you deleted and how you restored it.'], 'The second proven restore.'),
  ]),
  T(8, 'secops', 'Run a timed recovery drill', 'Snapshot the instance’s root volume, rebuild a volume from it, time the whole thing, and compare with the RTO.', 45,
    ['Recovery drills', 'RTO measurement'], ['The drill is timed', 'Test resources are deleted'], [
    cli(s(8, 'secops', 1), 'Run the drill', 'Start a timer, snapshot the root volume, restore it.', [
      { cmd: `date +%T; ${IID}; ROOT=$(aws ec2 describe-instances --instance-ids $IID --query "Reservations[0].Instances[0].BlockDeviceMappings[0].Ebs.VolumeId" --output text); DS=$(aws ec2 create-snapshot --volume-id $ROOT --description drill --query SnapshotId --output text); aws ec2 wait snapshot-completed --snapshot-ids $DS`, explain: 'Note the start time. A snapshot works while the instance is stopped.', sample: '14:02:07' },
      { cmd: 'DV=$(aws ec2 create-volume --snapshot-id $DS --availability-zone us-east-1a --query VolumeId --output text); aws ec2 wait volume-available --volume-ids $DV; date +%T', explain: 'The end time. The difference is your measured restore time.', sample: '14:09:41' },
    ], ['14:0'], 'A measured time turns an RTO from a hope into a fact.'),
    cli(s(8, 'secops', 2), 'Clean up', 'Delete the drill volume and snapshot.', [
      { cmd: 'aws ec2 delete-volume --volume-id $DV && aws ec2 delete-snapshot --snapshot-id $DS && echo cleaned', explain: 'Drills leave no cost behind.', sample: 'cleaned' },
    ], ['cleaned'], 'Clean-up is part of the drill.'),
    rec(8, 'secops', 'Drill', ['Start, end, RTO met, lessons.'], 'The drill record proves the plan.'),
  ]),

  // ── Week 9 — Infrastructure as Code ────────────────────────────────────
  T(9, 'arch', 'Map the template to the diagram', 'Match five template resources to their diagram nodes, and say what code does that the console cannot.', 35,
    ['CloudFormation templates', 'Infrastructure Composer'], ['Five resources mapped'], [
    portal(s(9, 'arch', 1), 'Read the template beside the diagram', 'Click five resources and read their template lines.', 'Guide → Architecture & IaC', [
      'Click a node: the template scrolls to its logical id.',
      'Note its Type, and which Parameters and !Ref it reads.',
      'Tick "Template dependencies": arrows now show !Ref, !GetAtt and DependsOn.',
    ], 'Five resources traced from the picture to the code.', 'The diagram is generated from the template: if they ever disagree, the template is the truth.'),
    rec(9, 'arch', 'Template map, Portal vs code', ['Five rows: resource, node, parameter.', 'One thing code does that the console cannot.'], 'The map lets anyone navigate the template.'),
  ]),
  T(9, 'infra', 'Inventory everything with the CLI', 'List every tagged resource and find anything the standard missed.', 35,
    ['Resource Groups Tagging API', 'JMESPath queries'], ['Five or more resources listed with tags'], [
    cli(s(9, 'infra', 1), 'List the resources', 'List every resource tagged project=capstone.', [
      { cmd: 'aws resourcegroupstaggingapi get-resources --tag-filters Key=project,Values=capstone --query "ResourceTagMappingList[].[ResourceARN, Tags[?Key==\'owner\']|[0].Value]" --output text', explain: 'Every resource carrying the project tag, with its owner. Anything you built but do not see here broke the standard.', sample: 'arn:aws:ec2:us-east-1:123456789012:vpc/vpc-0a1b2c3d4e5f67890\tteam01-infra' },
    ], ['arn:aws:'], 'The gaps you find now are what the Config rule flags in Week 11.'),
    rec(9, 'infra', 'CLI inventory', ['Five or more resources, their type, tagged or not.'], 'The inventory is the before-picture for the template.'),
  ]),
  T(9, 'dev', 'Fill the starter and deploy to dev', 'Complete the starter template, preview it with a change set, deploy a dev stack, then delete it.', 55,
    ['Template anatomy', 'Change sets', 'Stacks'], ['The change set previewed', 'CREATE_COMPLETE', 'The dev stack is deleted'], [
    portal(s(9, 'dev', 1), 'Fill the starter', 'Download the starter and fill its nine blanks.', 'Guide → Architecture & IaC → Starter', [
      'Download template.yaml and both parameter files into infra/.',
      'Replace each FILL-ME using its hint; the Full tab is the answer key.',
      'In params-dev.json set TeamId to t01dev, so names never clash with what you built by hand.',
    ], 'A template with no FILL-ME left.', 'Filling blanks in a real template teaches its structure faster than writing one from nothing.'),
    cli(s(9, 'dev', 2), 'Preview, then deploy', 'Create a change set, read it, execute it.', [
      { cmd: 'STACK=capstone-team01-dev; aws cloudformation create-change-set --stack-name $STACK --change-set-name preview --change-set-type CREATE --template-body file://infra/template.yaml --parameters file://infra/params-dev.json --capabilities CAPABILITY_IAM -o none; aws cloudformation wait change-set-create-complete --stack-name $STACK --change-set-name preview; aws cloudformation describe-change-set --stack-name $STACK --change-set-name preview --query "length(Changes)"', explain: 'A change set lists every add, modify and remove before anything happens.', sample: '34' },
      { cmd: 'aws cloudformation execute-change-set --stack-name $STACK --change-set-name preview && aws cloudformation wait stack-create-complete --stack-name $STACK; aws cloudformation describe-stacks --stack-name $STACK --query "Stacks[0].StackStatus" --output text', explain: 'CloudFront makes this take ten minutes or so.', sample: 'CREATE_COMPLETE' },
    ], ['34', 'CREATE_COMPLETE'], 'Preview first, always: a change set is how you catch a replacement you did not mean.', {
      fixes: [{ symptom: 'ROLLBACK_COMPLETE, "already exists"', fix: 'A name clashes with something you built by hand. Use a different TeamId in params-dev.json and retry.' }],
    }),
    rec(9, 'dev', 'Deployment', ['Blanks filled, change set result, stack status.'], 'The deployment record Week 10 automates.'),
    cli(s(9, 'dev', 3), 'Delete the dev stack', 'Delete the dev stack.', [
      { cmd: 'aws cloudformation delete-stack --stack-name capstone-team01-dev && echo deleting', explain: 'The whole copy goes in one command — that is what a stack is for. Empty its bucket first if the delete fails.', sample: 'deleting' },
    ], ['deleting'], 'A second environment doubles the bill until it is gone.'),
  ]),
  T(9, 'secops', 'Write parameter files and validate', 'Set dev and prod parameter values with no secrets in them, and validate the template.', 40,
    ['Parameter files', 'Validation', 'cfn-lint'], ['The template validates', 'No secret in either file'], [
    portal(s(9, 'secops', 1), 'Set the parameter values', 'Set TeamId, Environment, OwnerTag and AlertEmail.', 'infra/ in the repository', [
      'dev: Environment dev, TeamId t01dev.',
      'prod: Environment prod, TeamId team01.',
      'No passwords or keys: the template takes none.',
    ], 'Two parameter files differing only where environments differ.', 'Parameters are what changes between environments; everything else stays identical, which is what makes prod predictable.'),
    cli(s(9, 'secops', 2), 'Validate', 'Validate the template, then lint it.', [
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
    ], 'Jobs targeting prod wait for approval.', 'The pause before prod is where a human reads the change set.'),
    rec(10, 'infra', 'Repository controls', ['The branch rule and the environment.'], 'Evidence of change control.'),
  ]),
  T(10, 'dev', 'Deploy from GitHub Actions', 'Add a workflow that validates and deploys the stack on every merge to main.', 50,
    ['GitHub Actions', 'configure-aws-credentials', 'CloudFormation deploy'], ['A run deployed the stack'], [
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
    ['IAM OIDC providers', 'Trust policies', 'Stack rollback'], ['No access key exists', 'A failed deploy rolled back'], [
    cli(s(10, 'secops', 1), 'Trust GitHub', 'Add GitHub as an OIDC identity provider.', [
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
    ['Cost Explorer', 'Cost optimisation'], ['Three services with spend and an action'], [
    portal(s(11, 'arch', 1), 'Break down the cost', 'Group this month’s cost by service.', 'Billing and Cost Management → Cost Explorer', [
      'Date range: month to date. Group by: Service.',
      'Check the budget: how close to the alert?',
      'For each service, one action: keep, reduce, remove.',
    ], 'Cost per service with an action for each.', 'Every line has an owner and a decision — that is FinOps in one table.'),
    rec(11, 'arch', 'Cost by service', ['Three or more services, spend, action.'], 'The cost section of the governance report.'),
  ]),
  T(11, 'infra', 'Require the owner tag with Config', 'Turn on the AWS Config required-tags rule for owner, and prove it flags an untagged resource.', 45,
    ['AWS Config', 'Managed rules'], ['The rule is active', 'An untagged resource is NON_COMPLIANT'], [
    portal(s(11, 'infra', 1), 'Turn on the rule', 'Add the required-tags managed rule.', 'AWS Config → Rules → Add rule', [
      'If asked, set up Config: record specific types — EC2, S3, Lambda. One recorder per region only.',
      'Managed rule required-tags. tag1Key: owner.',
      'Scope: EC2 instances, S3 buckets, Lambda functions.',
    ], 'The rule required-tags is listed and evaluating.', 'Config records and checks; it does not block. The deny version is an SCP, which needs AWS Organizations.'),
    cli(s(11, 'infra', 2), 'Prove it flags', 'Create an untagged bucket and read its compliance.', [
      { cmd: 'aws s3 mb s3://capstone-team01-untagged-$RANDOM -o none; sleep 120; aws configservice get-compliance-details-by-config-rule --config-rule-name required-tags --compliance-types NON_COMPLIANT --query "EvaluationResults[].[EvaluationResultIdentifier.EvaluationResultQualifier.ResourceId, ComplianceType]" --output text', explain: 'Evaluation takes a minute or two. Delete the bucket afterwards.', sample: 'capstone-team01-untagged-18342\tNON_COMPLIANT' },
    ], ['NON_COMPLIANT'], 'Enforcement proved by a finding, not assumed.'),
    rec(11, 'infra', 'Policy', ['The rule and the result of the test.'], 'Governance the platform checks for you.'),
  ]),
  T(11, 'dev', 'Query CloudTrail event history', 'Find who changed what this week from CloudTrail event history.', 35,
    ['CloudTrail', 'Audit trails'], ['Three audit events recorded'], [
    cli(s(11, 'dev', 1), 'Read the audit trail', 'List this week’s write events.', [
      { cmd: 'aws cloudtrail lookup-events --lookup-attributes AttributeKey=ReadOnly,AttributeValue=false --max-results 8 --query "Events[].[EventTime, Username, EventName]" --output text', explain: 'Every management API call is recorded with who made it. Event history keeps 90 days free.', sample: '2026-11-10T14:02:07+00:00\tteam01-infra\tPutConfigRule' },
    ], ['team01'], 'The audit log is how an incident answers “who did this, and when”.'),
    rec(11, 'dev', 'Audit events', ['Three events: when, who, operation.'], 'Evidence the environment is auditable.'),
  ]),
  T(11, 'secops', 'Review posture with Trusted Advisor', 'Read the free Trusted Advisor checks and IAM Access Analyzer, rank three findings, and own their remediation.', 40,
    ['Security posture', 'IAM Access Analyzer'], ['Three owned findings'], [
    portal(s(11, 'secops', 1), 'Read the checks', 'Open the free security checks.', 'Trusted Advisor, then IAM → Access Analyzer', [
      'Trusted Advisor → Security: MFA on root, open ports, S3 permissions.',
      'IAM Access Analyzer: create an account analyzer (free); read external-access findings.',
      'Pick three: severity, resource, fix.',
    ], 'Three findings with severity and a remediation.', 'Free checks find real misconfigurations. Security Hub adds more, for a fee.'),
    rec(11, 'secops', 'Posture findings', ['Three findings: severity, owner, remediation.'], 'Open findings become the handover’s risks.'),
  ]),

  // ── Week 12 — Handover ─────────────────────────────────────────────────
  T(12, 'arch', 'Assemble the handover package', 'Catalogue every service, list the open risks, and sign the package off.', 45,
    ['Service transition', 'Risk registers'], ['Four services catalogued', 'Three risks', 'Signed off'], [
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
    ['Disaster recovery by redeploy', 'Stacks'], ['The rebuild completed', 'Time recorded', 'Recovery stack deleted'], [
    cli(s(12, 'infra', 1), 'Rebuild it', 'Deploy the template as a recovery stack, timed.', [
      { cmd: 'date +%T; aws cloudformation deploy --stack-name capstone-team01-recover --template-file infra/template.yaml --parameter-overrides TeamId=t01rec Environment=prod OwnerTag=team01-infra AlertEmail=team01-alerts@school.edu --capabilities CAPABILITY_IAM; date +%T', explain: 'The whole company, rebuilt from one file. TeamId t01rec keeps names from clashing. The two times are your recovery time.', sample: '15:10:02\nSuccessfully created/updated stack - capstone-team01-recover\n15:24:47' },
    ], ['Successfully created'], 'If it can be rebuilt from code, it can be recovered from anything.'),
    cli(s(12, 'infra', 2), 'Delete the recovery stack', 'Delete the recovery stack.', [
      { cmd: 'aws cloudformation delete-stack --stack-name capstone-team01-recover && echo deleting', explain: 'Keep the evidence, not the bill.', sample: 'deleting' },
    ], ['deleting'], 'Clean-up is part of the drill.'),
    rec(12, 'infra', 'Scenario outcomes', ['Recover: rebuild from the template — time and result.'], 'Proof the template is the environment.'),
  ]),
  T(12, 'dev', 'Fix an app failure through CI', 'Break the function’s configuration by hand, then restore it by re-running the pipeline — no console fixes.', 45,
    ['Configuration drift', 'Redeploy as a fix'], ['The API failed, then recovered through CI'], [
    cli(s(12, 'dev', 1), 'Break it', 'Point the function at a table that does not exist.', [
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
    ['Detection', 'Containment', 'Final checklist'], ['The rule was detected and removed', 'Checklist complete'], [
    cli(s(12, 'secops', 1), 'Inject the incident', 'Add an SSH rule open to the internet.', [
      { cmd: 'SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=sg-tools-team01 --query "SecurityGroups[0].GroupId" --output text); aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port 22 --cidr 0.0.0.0/0 --query "SecurityGroupRules[0].CidrIpv4" --output text', explain: 'The exact misconfiguration attackers scan for. The instance is stopped, so nothing is exposed.', sample: '0.0.0.0/0' },
    ], ['0.0.0.0/0'], 'A realistic incident: one bad rule, easy to add, easy to miss.'),
    cli(s(12, 'secops', 2), 'Detect and contain', 'Find it in CloudTrail, then revoke it.', [
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
      cli(`${P}-w0-setup-s3`, `Deploy through Week ${through}`, `Deploy the stack with ThroughWeek=${through}.`, [
        { cmd: `aws cloudformation deploy --stack-name capstone-team01 --template-file infra/template.yaml --parameter-overrides ThroughWeek=${through} TeamId=team01 OwnerTag=team01-lead AlertEmail=team01-alerts@school.edu --capabilities CAPABILITY_IAM`, explain: `ThroughWeek=${through} leaves every later resource out — the Week5Plus condition in the template does the choosing. CloudFront makes this take about ten minutes.`, sample: 'Waiting for changeset to be created..\nWaiting for stack create/update to complete\nSuccessfully created/updated stack - capstone-team01' },
      ], ['Successfully created'], 'One command, and the environment is exactly where the previous course left it.', {
        fixes: [{ symptom: 'AlreadyExists for a bucket or function', fix: 'A hand-built resource shares the name. Delete it, or use another TeamId and record why.' }],
      }),
      cli(`${P}-w0-setup-s4`, 'Publish what the template cannot', 'Upload the site to the bucket the stack made.', [
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

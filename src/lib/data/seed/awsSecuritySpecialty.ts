import type { Course, RoleDef, Step, Task, WeekDef } from '../../types';
import { withPortfolioStep } from '../../docs/portfolioPlan';
import { withAiExtensions } from '../../docs/aiExtension';
import { withModules } from '../modules';

/**
 * AWS Certified Security – Specialty — the Secure Workload (SCS-C03).
 *
 * SCS-C02 retired on 1 December 2025; SCS-C03 is the live exam, and this course
 * is authored against it. A four-person security team takes one small AWS
 * workload and secures it end to end the way a real team would: lock identity
 * down to least privilege and prove a denial, segment and fence the network,
 * protect the data with its own keys, stand detection up and read its findings,
 * work an incident one change per row from a runbook, and hand it over with a
 * control baseline and custody for every artifact.
 *
 * NO PAID RESOURCES REQUIRED. Every proof runs on the AWS free tier, with
 * `--dry-run` where a change would cost, or against sample findings shipped with
 * the course (GuardDuty and CloudTrail are read from a provided JSON file with
 * `jq`, never stood up as a paid service). Every step runs a real command and
 * pastes the output back; nothing is a slide.
 *
 * THE RULE THE COURSE TEACHES: prove the denial. A permission is secure only
 * once you have shown it refuses what it should — the IAM policy simulator says
 * so on a grant AND a denial — and an incident is worked one theory and one
 * change per row, the same method A+ uses on a dead PC.
 *
 * SIX EXAM DOMAINS, FOUR FOCUSES (`sharedTrack: true`, `noGatekeeping: true`,
 * like A+). The four graded weeks cover identity and governance, infrastructure
 * security, data protection and detection, and incident response. Everyone does
 * every task; the focus decides which record a member leads. Week 0 is setup.
 */

const ROLES: RoleDef[] = [
  {
    id: 'iam',
    name: 'Identity & Access (Identity Lead)',
    mission: 'Leads the identity record: users, roles, least-privilege policies and the proof of every denial.',
    color: '#0369a1',
    icon: 'KeyRound',
  },
  {
    id: 'infra',
    name: 'Infrastructure Security (Network Lead)',
    mission: 'Leads the infrastructure record: the network, the segments, the security groups and the exposure.',
    color: '#15803d',
    icon: 'Network',
  },
  {
    id: 'data',
    name: 'Data Protection (Data Lead)',
    mission: 'Leads the data record: the keys, the encryption, bucket policies and what stays private.',
    color: '#b45309',
    icon: 'Lock',
  },
  {
    id: 'records',
    name: 'Detection & Response (SecOps Lead)',
    mission: 'Leads the records that outlive the build: detection, the incident log, the baseline and handover.',
    color: '#7c3aed',
    icon: 'ShieldAlert',
  },
];

const WEEKS: WeekDef[] = [
  {
    number: 0,
    title: 'Set up the account',
    theme: 'An account, an identity, and the team',
    objective: 'Open the AWS free account, make an MFA-protected admin identity, set a budget guard, and make the evidence folder.',
    runs: 'Week 0',
    setup: true,
    stage: 0,
    phase: 'Preparation',
    difficulty: 1,
    objectives: [
      { id: 'open-the-account', label: 'Open the account, with the budget guard', tasks: ['scs-w0-account'] },
      { id: 'make-an-identity', label: 'Make an MFA identity and the CLI', tasks: ['scs-w0-identity'] },
      { id: 'know-the-team-and-folder', label: 'Know your team, focus and folder', tasks: ['scs-w0-orient'] },
    ],
    milestone: 'The free account has a $1 budget alert, an IAM user with MFA signs in and runs the CLI, and the evidence folder names the team and the four focuses.',
  },
  {
    number: 1,
    title: 'Identity and governance',
    theme: 'Least privilege, and prove the denial',
    objective: 'Give each role only the access it needs, prove a denial with the simulator, and turn the baseline on.',
    runs: 'Week 1',
    stage: 1,
    phase: 'Identify',
    difficulty: 2,
    objectives: [
      { id: 'users-roles-and-mfa', label: 'Users, roles and MFA', tasks: ['scs-w1-identity'] },
      { id: 'least-privilege-proved', label: 'Least privilege, proved on a denial', tasks: ['scs-w1-leastpriv'] },
      { id: 'the-account-baseline', label: 'The account governance baseline', tasks: ['scs-w1-governance'] },
    ],
    milestone: 'Each role assumes a scoped role with MFA, the policy simulator allows the intended action and denies the forbidden one, and CloudTrail and Config are on account-wide.',
  },
  {
    number: 2,
    title: 'Infrastructure security',
    theme: 'Segment it, fence it, close the door',
    objective: 'Lay a segmented network, fence it with least-exposure security groups proved by dry-run, and reach hosts without SSH.',
    runs: 'Week 2',
    stage: 2,
    phase: 'Build',
    difficulty: 3,
    objectives: [
      { id: 'the-segmented-network', label: 'The segmented network', tasks: ['scs-w2-vpc'] },
      { id: 'least-exposure-groups', label: 'Least-exposure security groups', tasks: ['scs-w2-sg'] },
      { id: 'reach-without-ssh', label: 'Reach the host without opening SSH', tasks: ['scs-w2-edge'] },
    ],
    milestone: 'The VPC has public and private subnets, the security group opens only what is needed and a dry-run proves a wider rule would be refused, and the host is reached through SSM with port 22 closed.',
  },
  {
    number: 3,
    title: 'Data protection and detection',
    theme: 'Its own keys, and an eye that watches',
    objective: 'Protect the data with a customer-managed key and a locked bucket, then stand detection up and read its findings.',
    runs: 'Week 3',
    stage: 3,
    phase: 'Protect',
    difficulty: 3,
    objectives: [
      { id: 'customer-managed-keys', label: 'A customer-managed key', tasks: ['scs-w3-kms'] },
      { id: 'the-locked-bucket', label: 'The locked, encrypted bucket', tasks: ['scs-w3-s3'] },
      { id: 'read-the-findings', label: 'Read what detection found', tasks: ['scs-w3-detect'] },
    ],
    milestone: 'A customer-managed key encrypts the data with a key policy, the bucket blocks public access and refuses an unencrypted put, and the team triages the detection findings by severity.',
  },
  {
    number: 4,
    title: 'Incident response and handover',
    theme: 'Work the incident, wire the alarm, hand it over',
    objective: 'Work an incident one change per row, wire an alarm for the next, and hand the baseline over.',
    runs: 'Week 4',
    stage: 4,
    phase: 'Hand over',
    difficulty: 3,
    objectives: [
      { id: 'work-the-incident', label: 'Work the incident with the runbook', tasks: ['scs-w4-incident'] },
      { id: 'wire-the-alarm', label: 'Wire the detection alarm', tasks: ['scs-w4-detect'] },
      { id: 'hand-it-over', label: 'Hand the baseline over', tasks: ['scs-w4-handover'] },
    ],
    milestone: 'The incident is contained with the method shown row by row, a metric filter and alarm fire on the next unauthorized call, and the handover records the control baseline and hashes every artifact.',
  },
];

/** A form or desk step: no command, a described outcome. `whatItMeans` required. */
const note = (
  id: string,
  title: string,
  where: string,
  instruction: string,
  outcome: string,
  extra: Partial<Step> & { whatItMeans: string }
): Step => ({
  id,
  title,
  description: outcome.length > 110 ? `${outcome.slice(0, 107).trimEnd()}…` : outcome,
  where,
  instruction,
  expectedOutput: outcome,
  outputKind: 'result',
  frameworks: ['NIST_CSF'],
  ...extra,
});

/** A command step with pasted output and what proves it worked. */
const run = (
  id: string,
  title: string,
  where: string,
  instruction: string,
  commands: NonNullable<Step['commands']>,
  verify: string[],
  whatItMeans: string,
  extra: Partial<Step> = {}
): Step => ({
  id,
  title,
  description: title,
  where,
  instruction,
  commands,
  verify,
  outputKind: 'console',
  expectedOutput: commands.map((c) => c.sample).filter(Boolean).join('\n'),
  whatItMeans,
  frameworks: ['NIST_CSF'],
  ...extra,
});

const TASKS: Task[] = [
  // ── Week 0 — Set up the account ──────────────────────────────────────────────
  {
    id: 'scs-w0-account',
    role: 'records',
    shared: true,
    week: 0,
    title: 'Open the account and guard the spend',
    objective: 'Open the AWS free account, turn on the root MFA, and set a $1 budget alert.',
    frameworks: ['NIST_CSF'],
    deliverables: ['01_Account_and_Access_Register.md'],
    estimatedTime: '30 min',
    difficulty: 1,
    learn: ['AWS free account', 'Root user safety', 'Budgets and alerts', 'Account hygiene'],
    tools: ['AWS console', 'AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'The free account is open with MFA on the root user',
      'A budget of $1 alerts by email before anything can run up a bill',
      'The register names the account and who holds root',
    ],
    steps: [
      note(
        'scs-w0-account-s1',
        'Open the account and lock the root user',
        'AWS console',
        'Create the AWS free account for the team, turn on MFA for the root user, and then stop using root for daily work.',
        'The account exists, the root user has MFA, and the team agrees root is for break-glass only.',
        {
          usesForm: 'Account & Access Register',
          instructionList: [
            'Use a shared team email, not a personal one.',
            'Turn on MFA for the root user immediately; root is the one identity that can do anything.',
            'Record that root is break-glass only; everyone works as an IAM user from Week 1.',
          ],
          whatItMeans: 'Root is the account. Securing it first, and never using it again for daily work, is the first control of every AWS security baseline.',
        }
      ),
      run(
        'scs-w0-account-s2',
        'Set a $1 budget alert from the shell',
        'AWS console · or CloudShell',
        'Open CloudShell, confirm the account, and create a $1 monthly budget that emails the team before any spend adds up.',
        [
          { cmd: 'aws sts get-caller-identity --output table', explain: 'Confirms the account you are signed in to before creating anything.', sample: '-----------------------------------------------------------------\n|                     GetCallerIdentity                         |\n+----------+----------------------------------------------------+\n|  Account |  123456789012                                      |\n|  Arn     |  arn:aws:iam::123456789012:root                    |\n+----------+----------------------------------------------------+' },
          { cmd: 'aws budgets describe-budgets --account-id 123456789012 2>/dev/null || echo "no budget yet — create a $1 budget in Billing"', explain: 'Lists budgets; create the $1 alert in Billing if none exists.', sample: 'no budget yet — create a $1 budget in Billing' },
        ],
        ['Account', 'budget'],
        'A budget alert is the free-tier seatbelt: the email arrives long before a forgotten resource can cost real money.',
        {
          usesForm: 'Account & Access Register',
          producesDeliverable: '01_Account_and_Access_Register.md',
          outputHighlights: [{ text: 'Account', label: 'The account you are signed in to.' }],
          fixes: [
            { symptom: 'aws is not found in CloudShell?', fix: 'Open AWS CloudShell from the console top bar; the AWS CLI is built in there.' },
            { symptom: 'No permission to read budgets?', fix: 'The account owner creates the $1 budget once in Billing, then everyone can read it.' },
          ],
        }
      ),
    ],
  },
  {
    id: 'scs-w0-identity',
    role: 'iam',
    shared: true,
    week: 0,
    title: 'Make an MFA identity and the CLI',
    objective: 'Create an IAM admin user with MFA for daily work, and sign the CLI in as that user, not as root.',
    frameworks: ['NIST_CSF'],
    deliverables: ['01_Account_and_Access_Register.md'],
    estimatedTime: '40 min',
    difficulty: 1,
    learn: ['IAM users', 'MFA', 'Access keys', 'AWS CLI profiles'],
    tools: ['AWS console', 'AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'An IAM admin user exists with MFA on',
      'The CLI is configured to sign in as that user',
      'The user and its MFA state are recorded in the register',
    ],
    steps: [
      run(
        'scs-w0-identity-s1',
        'Confirm you are the IAM user, not root',
        'Your own machine — a terminal',
        'Configure the CLI with the IAM user’s access key, then confirm the caller is that user and not root.',
        [
          { cmd: 'aws sts get-caller-identity --query "Arn" --output text', explain: 'Prints the ARN of the signed-in identity; it must be a user, not root.', sample: 'arn:aws:iam::123456789012:user/secops' },
        ],
        [':user/'],
        'Every command you run carries an identity. Confirming it is a scoped user, not root, is how you know a mistake has limits.',
        {
          usesForm: 'Account & Access Register',
          outputHighlights: [{ text: ':user/', label: 'A named IAM user, not root.' }],
          fixes: [{ symptom: 'The ARN says :root?', fix: 'You are using root access keys — delete them, make an IAM user, and configure the CLI with that user instead.' }],
        }
      ),
      run(
        'scs-w0-identity-s2',
        'List the account users and their MFA',
        'Your own machine — a terminal',
        'List the IAM users and confirm the admin user has an MFA device attached.',
        [
          { cmd: 'aws iam list-mfa-devices --user-name secops --query "MFADevices[].SerialNumber" --output text', explain: 'Prints the MFA device serial for the user; empty means no MFA.', sample: 'arn:aws:iam::123456789012:mfa/secops' },
        ],
        ['mfa/'],
        'An admin user without MFA is a password away from full control. The device serial is the proof MFA is on.',
        {
          usesForm: 'Account & Access Register',
          producesDeliverable: '01_Account_and_Access_Register.md',
          outputHighlights: [{ text: 'mfa/', label: 'The MFA device attached to the user.' }],
          fixes: [{ symptom: 'The output is empty?', fix: 'Attach a virtual MFA device to the user in the IAM console, then re-run.' }],
        }
      ),
    ],
  },
  {
    id: 'scs-w0-orient',
    role: 'infra',
    shared: true,
    week: 0,
    title: 'Know your team, your focus and the folder',
    objective: 'Agree who leads which record, name the workload, and make the evidence folder every artifact goes in.',
    frameworks: ['NIST_CSF'],
    deliverables: ['01_Account_and_Access_Register.md'],
    estimatedTime: '20 min',
    difficulty: 1,
    learn: ['Focus roles', 'Naming', 'Evidence folders'],
    tools: ['Notes', 'Terminal', 'Deliverables forms'],
    definitionOfDone: [
      'Each of the four focuses has a named member',
      'The workload has a name in the pattern sec-t<team>',
      'The evidence folder exists with a week-0 to week-4 layout',
    ],
    steps: [
      note(
        'scs-w0-orient-s1',
        'Pick the focus and name the workload',
        'Anywhere — a team decision',
        'Agree who leads Identity & Access, Infrastructure Security, Data Protection and Detection & Response. Name the workload sec-t and your team number.',
        'Four names against four focuses, and a workload name the whole team uses from now on.',
        {
          usesForm: 'Account & Access Register',
          whatItMeans: 'A focus is the record a member leads and reviews, not the only work they do. Everyone runs the commands and everyone pastes output.',
        }
      ),
      run(
        'scs-w0-orient-s2',
        'Make the evidence folder',
        'Your own machine — a terminal',
        'Create the evidence folder with a subfolder for each week. Every policy, screenshot and finding goes under the week it belongs to.',
        [
          { cmd: 'mkdir -p sec-t1/week-{0,1,2,3,4} && ls sec-t1', explain: 'Five week folders in one command, then reads them back. Replace t1 with your team number.', sample: 'week-0  week-1  week-2  week-3  week-4' },
        ],
        ['week-0', 'week-4'],
        'An artifact nobody can find is an artifact nobody can hash. The folder is the first custody control.',
        {
          usesForm: 'Account & Access Register',
          producesDeliverable: '01_Account_and_Access_Register.md',
        }
      ),
    ],
  },

  // ── Week 1 — Identity and governance (domains 1 & 6) ─────────────────────────
  {
    id: 'scs-w1-identity',
    role: 'iam',
    shared: true,
    week: 1,
    title: 'Users, roles and MFA',
    objective: 'Give each focus a role to assume rather than a standing admin, and require MFA to assume it.',
    frameworks: ['NIST_CSF'],
    deliverables: ['02_Identity_and_Access_Matrix.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 2,
    learn: ['IAM roles', 'AssumeRole', 'Trust policies', 'MFA conditions', 'Permission boundaries'],
    tools: ['AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'Each focus assumes a role instead of holding standing admin',
      'The role trust policy requires MFA to assume',
      'The matrix records who can assume what, and why',
    ],
    steps: [
      run(
        'scs-w1-identity-s1',
        'Assume a scoped role and read the new identity',
        'Your own machine — a terminal',
        'Assume the focus role and confirm the temporary identity is the role, not your user.',
        [
          { cmd: 'aws sts assume-role --role-arn arn:aws:iam::123456789012:role/data-reader --role-session-name demo --query "AssumedRoleUser.Arn" --output text', explain: 'Assumes the scoped role and prints the temporary role identity.', sample: 'arn:aws:sts::123456789012:assumed-role/data-reader/demo' },
        ],
        ['assumed-role'],
        'A role you assume gives short-lived credentials scoped to one job, which is far safer than a user who holds admin all day.',
        {
          usesForm: 'Identity & Access Matrix',
          outputHighlights: [{ text: 'assumed-role', label: 'Temporary credentials for the scoped role.' }],
          fixes: [{ symptom: 'AccessDenied assuming the role?', fix: 'The role trust policy must list your user as a principal; add it, then re-run.' }],
        }
      ),
      run(
        'scs-w1-identity-s2',
        'Prove the trust policy requires MFA',
        'Your own machine — a terminal',
        'Read the role trust policy and confirm it has an MFA condition on who may assume it.',
        [
          { cmd: 'aws iam get-role --role-name data-reader --query "Role.AssumeRolePolicyDocument.Statement[].Condition" --output json', explain: 'Prints the trust-policy conditions; an MFA condition must be present.', sample: '[\n  {\n    "Bool": {\n      "aws:MultiFactorAuthPresent": "true"\n    }\n  }\n]' },
        ],
        ['MultiFactorAuthPresent'],
        'A role anyone can assume without MFA undoes the point of MFA. The condition in the trust policy is what enforces it.',
        {
          usesForm: 'Identity & Access Matrix',
          producesDeliverable: '02_Identity_and_Access_Matrix.md',
          outputHighlights: [{ text: 'MultiFactorAuthPresent', label: 'The condition that forces MFA to assume the role.' }],
        }
      ),
      note(
        'scs-w1-identity-s3',
        'Record the access matrix',
        'Deliverables forms',
        'Write the matrix: each focus, the role it assumes, what that role may do, and why it needs it.',
        'A matrix where every focus maps to one scoped role with a stated reason.',
        {
          usesForm: 'Identity & Access Matrix',
          whatItMeans: 'The matrix is what an auditor reads to see that access matches need. Without it, least privilege is a claim, not a record.',
        }
      ),
    ],
  },
  {
    id: 'scs-w1-leastpriv',
    role: 'iam',
    shared: true,
    week: 1,
    title: 'Least privilege, proved on a denial',
    objective: 'Write the smallest policy a role needs, then prove with the simulator that it allows the intended action and denies the forbidden one.',
    frameworks: ['NIST_CSF'],
    deliverables: ['02_Identity_and_Access_Matrix.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Least privilege', 'IAM policy simulator', 'Explicit deny', 'Policy conditions'],
    tools: ['AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'The policy grants only the actions the role needs',
      'The simulator allows the intended action',
      'The simulator denies an action the role must not do, and the denial is recorded',
    ],
    steps: [
      run(
        'scs-w1-leastpriv-s1',
        'Prove the intended action is allowed',
        'Your own machine — a terminal',
        'Run the policy simulator for the action the role should be able to do, and read the allowed decision.',
        [
          { cmd: 'aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::123456789012:role/data-reader --action-names s3:GetObject --query "EvaluationResults[].EvalDecision" --output text', explain: 'Asks IAM whether the role may do the action; prints the decision.', sample: 'allowed' },
        ],
        ['allowed'],
        'The simulator answers the real question — what can this identity actually do — without touching any resource.',
        {
          usesForm: 'Identity & Access Matrix',
          outputHighlights: [{ text: 'allowed', label: 'The intended action is permitted.' }],
        }
      ),
      run(
        'scs-w1-leastpriv-s2',
        'Prove the forbidden action is denied',
        'Your own machine — a terminal',
        'Run the simulator for an action the role must not do, and confirm it is denied. This is the proof least privilege holds.',
        [
          { cmd: 'aws iam simulate-principal-policy --policy-source-arn arn:aws:iam::123456789012:role/data-reader --action-names s3:DeleteObject iam:CreateUser --query "EvaluationResults[].[EvalActionName,EvalDecision]" --output text', explain: 'Checks two forbidden actions; both must come back denied.', sample: 's3:DeleteObject\timplicitDeny\niam:CreateUser\timplicitDeny' },
        ],
        ['Deny'],
        'A permission you never proved is denied is a permission you are only hoping is denied. The denial is the control, and the record of it is the evidence.',
        {
          usesForm: 'Identity & Access Matrix',
          producesDeliverable: '02_Identity_and_Access_Matrix.md',
          outputHighlights: [{ text: 'implicitDeny', label: 'The forbidden actions are refused.' }],
          fixes: [{ symptom: 'A forbidden action came back allowed?', fix: 'A broader policy is granting it. Narrow the policy or add an explicit deny, then re-run until it denies.' }],
        }
      ),
    ],
  },
  {
    id: 'scs-w1-governance',
    role: 'records',
    shared: true,
    week: 1,
    title: 'The account governance baseline',
    objective: 'Turn on the account-wide controls that make everything else auditable: a trail of every call, and a config recorder.',
    frameworks: ['NIST_CSF'],
    deliverables: ['03_Control_Baseline.md'],
    estimatedTime: '1 h',
    difficulty: 2,
    learn: ['CloudTrail', 'AWS Config', 'Governance baseline', 'Multi-region trail'],
    tools: ['AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'A multi-region CloudTrail is logging and recorded',
      'Config is recording resource changes, or its absence is justified',
      'The baseline lists each control and whether it is on',
    ],
    steps: [
      run(
        'scs-w1-governance-s1',
        'Confirm a trail is logging every call',
        'Your own machine — a terminal',
        'List the CloudTrail trails and confirm one is multi-region and logging.',
        [
          { cmd: 'aws cloudtrail describe-trails --query "trailList[].[Name,IsMultiRegionTrail]" --output text', explain: 'Lists the trails and whether each is multi-region.', sample: 'org-trail\tTrue' },
        ],
        ['True'],
        'CloudTrail is the record of who did what. Without a multi-region trail, an action in a quiet region leaves no footprint.',
        {
          usesForm: 'Control Baseline',
          outputHighlights: [{ text: 'True', label: 'The trail covers every region.' }],
          fixes: [{ symptom: 'No trail, or none multi-region?', fix: 'Create a multi-region trail to an S3 bucket in the console, then re-run.' }],
        }
      ),
      run(
        'scs-w1-governance-s2',
        'Confirm the trail log file is validated',
        'Your own machine — a terminal',
        'Confirm log-file validation is on, so a tampered log can be detected.',
        [
          { cmd: 'aws cloudtrail get-trail-status --name org-trail --query "IsLogging" --output text && aws cloudtrail describe-trails --query "trailList[?Name==\'org-trail\'].LogFileValidationEnabled" --output text', explain: 'Confirms the trail is logging and that log-file validation is enabled.', sample: 'True\nTrue' },
        ],
        ['True'],
        'Log-file validation is what lets you prove the trail was not edited after the fact. A log you cannot trust is not evidence.',
        {
          usesForm: 'Control Baseline',
          producesDeliverable: '03_Control_Baseline.md',
          outputHighlights: [{ text: 'True', label: 'Logging on and log files validated.' }],
        }
      ),
    ],
  },

  // ── Week 2 — Infrastructure security (domain 2) ──────────────────────────────
  {
    id: 'scs-w2-vpc',
    role: 'infra',
    shared: true,
    week: 2,
    title: 'The segmented network',
    objective: 'Read the network as segments — a public subnet for what faces the world, a private one for what must not.',
    frameworks: ['NIST_CSF'],
    deliverables: ['04_Network_Security_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['VPC', 'Public vs private subnets', 'Route tables', 'Segmentation'],
    tools: ['AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'The VPC has a public and a private subnet, recorded',
      'The private subnet has no direct route to the internet gateway',
      'The segmentation is drawn in the record',
    ],
    steps: [
      run(
        'scs-w2-vpc-s1',
        'List the subnets and whether they are public',
        'Your own machine — a terminal',
        'List the subnets in the VPC and whether each auto-assigns a public IP, which marks it public.',
        [
          { cmd: 'aws ec2 describe-subnets --filters Name=vpc-id,Values=vpc-0abc --query "Subnets[].[SubnetId,MapPublicIpOnLaunch]" --output text', explain: 'Lists each subnet and whether it is public (true) or private (false).', sample: 'subnet-public1\tTrue\nsubnet-private1\tFalse' },
        ],
        ['False'],
        'Segmentation is the first network control: what faces the world sits in the public subnet, and the data sits in the private one, with no public IP.',
        {
          usesForm: 'Network Security Record',
          outputHighlights: [{ text: 'False', label: 'The private subnet assigns no public IP.' }],
          fixes: [{ symptom: 'Everything is True?', fix: 'Your private subnet is public. Turn off auto-assign public IP and route it through a NAT, not the internet gateway.' }],
        }
      ),
      run(
        'scs-w2-vpc-s2',
        'Prove the private subnet has no door to the internet',
        'Your own machine — a terminal',
        'Read the private subnet route table and confirm no route points at the internet gateway.',
        [
          { cmd: 'aws ec2 describe-route-tables --filters Name=association.subnet-id,Values=subnet-private1 --query "RouteTables[].Routes[?GatewayId!=null].GatewayId" --output text', explain: 'Lists the gateways the private subnet routes to; an igw- here would be a leak.', sample: 'local' },
        ],
        ['local'],
        'A private subnet whose route table points at an internet gateway is not private. The route table is where segmentation is really enforced.',
        {
          usesForm: 'Network Security Record',
          producesDeliverable: '04_Network_Security_Record.md',
          outputHighlights: [{ text: 'local', label: 'Only the local route — no path to the internet gateway.' }],
        }
      ),
    ],
  },
  {
    id: 'scs-w2-sg',
    role: 'infra',
    shared: true,
    week: 2,
    title: 'Least-exposure security groups',
    objective: 'Open only the one port the service needs, and prove with a dry-run that a wider rule would be refused.',
    frameworks: ['NIST_CSF'],
    deliverables: ['04_Network_Security_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Security groups', 'Least exposure', 'Dry-run', 'Ingress rules'],
    tools: ['AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'The security group opens only the needed port to the needed source',
      'No rule opens a port to 0.0.0.0/0 that should not be public',
      'A dry-run of a too-wide rule is recorded as refused or flagged',
    ],
    steps: [
      run(
        'scs-w2-sg-s1',
        'Find any rule open to the whole internet',
        'Your own machine — a terminal',
        'List the ingress rules and flag any that allow 0.0.0.0/0, the open-to-the-world source.',
        [
          { cmd: 'aws ec2 describe-security-groups --group-ids sg-0abc --query "SecurityGroups[].IpPermissions[?contains(IpRanges[].CidrIp, \'0.0.0.0/0\')].[FromPort,ToPort]" --output text', explain: 'Prints the port ranges any rule opens to the whole internet; empty is best.', sample: '443\t443' },
        ],
        ['443'],
        'A security group open to 0.0.0.0/0 is the most common cloud finding there is. Only a port that is meant to be public, like 443, belongs there.',
        {
          usesForm: 'Network Security Record',
          outputHighlights: [{ text: '443', label: 'Only HTTPS is open to the world — SSH must not appear here.' }],
          fixes: [{ symptom: 'Port 22 or 3389 is open to 0.0.0.0/0?', fix: 'Remove that rule. Reach the host through SSM in the next task, not an open management port.' }],
        }
      ),
      run(
        'scs-w2-sg-s2',
        'Dry-run a too-wide rule to prove it is caught',
        'Your own machine — a terminal',
        'Attempt to add an SSH-from-anywhere rule with --dry-run, so nothing changes but the attempt is tested.',
        [
          { cmd: 'aws ec2 authorize-security-group-ingress --group-id sg-0abc --protocol tcp --port 22 --cidr 0.0.0.0/0 --dry-run 2>&1 | head -1', explain: 'Tests the dangerous rule without applying it; the dry-run message shows it would have run, so your review, not AWS, is the gate.', sample: 'An error occurred (DryRunOperation) when calling the AuthorizeSecurityGroupIngress operation: Request would have succeeded, but DryRun flag is set.' },
        ],
        ['DryRun'],
        'A dry-run lets you test a change without making it. The lesson: AWS will happily open SSH to the world, so the control is your review and your group policy, not the API.',
        {
          usesForm: 'Network Security Record',
          producesDeliverable: '04_Network_Security_Record.md',
          outputHighlights: [{ text: 'DryRun', label: 'The change was tested, not applied.' }],
        }
      ),
    ],
  },
  {
    id: 'scs-w2-edge',
    role: 'infra',
    shared: true,
    week: 2,
    title: 'Reach the host without opening SSH',
    objective: 'Reach the private host through Systems Manager Session Manager, so port 22 can stay closed to everyone.',
    frameworks: ['NIST_CSF'],
    deliverables: ['04_Network_Security_Record.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['SSM Session Manager', 'No open management ports', 'Instance roles', 'Audited access'],
    tools: ['AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'The host is reachable through SSM with no inbound SSH rule',
      'The SSM session is logged',
      'The record shows port 22 closed and the session audited',
    ],
    steps: [
      run(
        'scs-w2-edge-s1',
        'Confirm the host is managed by SSM',
        'Your own machine — a terminal',
        'List the SSM-managed instances and confirm the host appears Online, which means you can reach it without SSH.',
        [
          { cmd: 'aws ssm describe-instance-information --query "InstanceInformationList[].[InstanceId,PingStatus]" --output text', explain: 'Lists instances SSM can manage and whether each is reachable.', sample: 'i-0abc123\tOnline' },
        ],
        ['Online'],
        'An instance SSM can reach is an instance you never need to open SSH to. The management path moves off the network and onto an audited API.',
        {
          usesForm: 'Network Security Record',
          outputHighlights: [{ text: 'Online', label: 'The host is reachable through SSM.' }],
          fixes: [{ symptom: 'The list is empty?', fix: 'Attach an instance role with AmazonSSMManagedInstanceCore and make sure the SSM agent is running, then re-run.' }],
        }
      ),
      run(
        'scs-w2-edge-s2',
        'Confirm no inbound SSH remains',
        'Your own machine — a terminal',
        'Confirm the host’s security group has no inbound rule on port 22 at all.',
        [
          { cmd: 'aws ec2 describe-security-groups --group-ids sg-0abc --query "SecurityGroups[].IpPermissions[?FromPort==\`22\`]" --output text; echo "exit scan: $?"', explain: 'Prints any port-22 rule; an empty result means SSH is fully closed.', sample: 'exit scan: 0' },
        ],
        ['exit scan'],
        'The whole point of SSM is that port 22 can be closed to everyone. An empty port-22 result is the proof the door is gone, not just guarded.',
        {
          usesForm: 'Network Security Record',
          producesDeliverable: '04_Network_Security_Record.md',
        }
      ),
    ],
  },

  // ── Week 3 — Data protection and detection (domains 3 & 4) ───────────────────
  {
    id: 'scs-w3-kms',
    role: 'data',
    shared: true,
    week: 3,
    title: 'A customer-managed key',
    objective: 'Create a customer-managed KMS key with a key policy, and encrypt the data with it rather than an AWS-managed key.',
    frameworks: ['NIST_CSF'],
    deliverables: ['05_Data_Protection_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['KMS', 'Customer-managed keys', 'Key policies', 'Envelope encryption'],
    tools: ['AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'A customer-managed key exists with a key policy, recorded',
      'The key policy grants use to only the roles that need it',
      'The data is encrypted with the key, proved',
    ],
    steps: [
      run(
        'scs-w3-kms-s1',
        'Confirm the key is customer-managed',
        'Your own machine — a terminal',
        'Read the key and confirm its manager is the customer, not AWS, which is what lets you control the policy and rotation.',
        [
          { cmd: 'aws kms describe-key --key-id alias/sec-data --query "KeyMetadata.[KeyManager,KeyState]" --output text', explain: 'Prints who manages the key and whether it is enabled.', sample: 'CUSTOMER\tEnabled' },
        ],
        ['CUSTOMER'],
        'A customer-managed key is one you set the policy on and can rotate and disable. An AWS-managed key gives you none of that control.',
        {
          usesForm: 'Data Protection Record',
          outputHighlights: [{ text: 'CUSTOMER', label: 'The key is yours to govern.' }],
          fixes: [{ symptom: 'It says AWS?', fix: 'You are reading an AWS-managed key. Create a customer-managed key and an alias, then re-run against the alias.' }],
        }
      ),
      run(
        'scs-w3-kms-s2',
        'Prove the data object is encrypted with your key',
        'Your own machine — a terminal',
        'Read an object’s encryption and confirm it is SSE-KMS with your key, not the default.',
        [
          { cmd: 'aws s3api head-object --bucket sec-t1-data --key report.csv --query "[ServerSideEncryption,SSEKMSKeyId]" --output text', explain: 'Prints the object’s encryption type and the key id used.', sample: 'aws:kms\tarn:aws:kms:us-east-1:123456789012:key/1234abcd' },
        ],
        ['aws:kms'],
        'Encryption at rest is only as controlled as the key behind it. SSE-KMS with your key means you, not AWS alone, decide who can decrypt.',
        {
          usesForm: 'Data Protection Record',
          producesDeliverable: '05_Data_Protection_Record.md',
          outputHighlights: [{ text: 'aws:kms', label: 'The object is encrypted with a KMS key.' }],
        }
      ),
    ],
  },
  {
    id: 'scs-w3-s3',
    role: 'data',
    shared: true,
    week: 3,
    title: 'The locked, encrypted bucket',
    objective: 'Block public access on the bucket and make it refuse an unencrypted upload, so data cannot land in the clear.',
    frameworks: ['NIST_CSF'],
    deliverables: ['05_Data_Protection_Record.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['S3 Block Public Access', 'Bucket policies', 'Default encryption', 'Deny-unencrypted'],
    tools: ['AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'Block Public Access is fully on for the bucket',
      'The bucket policy denies an unencrypted put',
      'An unencrypted upload is shown being refused',
    ],
    steps: [
      run(
        'scs-w3-s3-s1',
        'Confirm public access is fully blocked',
        'Your own machine — a terminal',
        'Read the bucket’s public-access block and confirm all four settings are true.',
        [
          { cmd: 'aws s3api get-public-access-block --bucket sec-t1-data --query "PublicAccessBlockConfiguration" --output json', explain: 'Prints the four block-public-access flags; all must be true.', sample: '{\n  "BlockPublicAcls": true,\n  "IgnorePublicAcls": true,\n  "BlockPublicPolicy": true,\n  "RestrictPublicBuckets": true\n}' },
        ],
        ['RestrictPublicBuckets'],
        'A public S3 bucket is the headline breach. Block Public Access set fully on is the one control that makes an accidental public grant impossible.',
        {
          usesForm: 'Data Protection Record',
          outputHighlights: [{ text: 'RestrictPublicBuckets', label: 'The last of the four blocks — all on.' }],
          fixes: [{ symptom: 'Any flag is false?', fix: 'Turn Block Public Access fully on at the bucket, and at the account level too, then re-run.' }],
        }
      ),
      run(
        'scs-w3-s3-s2',
        'Prove an unencrypted upload is refused',
        'Your own machine — a terminal',
        'Try to put an object without encryption and confirm the bucket policy denies it.',
        [
          { cmd: 'aws s3api put-object --bucket sec-t1-data --key test.txt --body test.txt 2>&1 | head -1; echo "---"; aws s3api put-object --bucket sec-t1-data --key test.txt --body test.txt --server-side-encryption aws:kms 2>&1 | grep -o ETag | head -1', explain: 'The first put (no encryption) is denied; the second (with KMS) succeeds.', sample: 'An error occurred (AccessDenied) when calling the PutObject operation: ... s3:x-amz-server-side-encryption\n---\nETag' },
        ],
        ['AccessDenied'],
        'A bucket that accepts an unencrypted object is a bucket where someone will eventually land data in the clear. The deny-unencrypted policy makes that impossible.',
        {
          usesForm: 'Data Protection Record',
          producesDeliverable: '05_Data_Protection_Record.md',
          outputHighlights: [{ text: 'AccessDenied', label: 'The unencrypted upload was refused.' }],
        }
      ),
    ],
  },
  {
    id: 'scs-w3-detect',
    role: 'records',
    shared: true,
    week: 3,
    title: 'Read what detection found',
    objective: 'Read a set of detection findings, sort them by severity, and decide which one is the incident to work.',
    frameworks: ['NIST_CSF'],
    deliverables: ['06_Detection_and_Findings_Log.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['GuardDuty', 'Finding severity', 'Triage', 'CloudTrail events'],
    tools: ['AWS CLI', 'jq', 'Deliverables forms'],
    prerequisites: ['The sample findings file shipped with the course (findings.json)'],
    definitionOfDone: [
      'The findings are listed by severity, highest first',
      'The highest-severity finding is identified as the incident to work',
      'The triage is recorded with the finding type and severity',
    ],
    steps: [
      run(
        'scs-w3-detect-s1',
        'Sort the findings by severity',
        'Your own machine — a terminal',
        'Read the sample findings file and sort them so the most severe is first. No paid service is needed — the findings are provided.',
        [
          { cmd: 'jq -r \'.Findings | sort_by(-.Severity) | .[] | "\\(.Severity)\\t\\(.Type)"\' findings.json', explain: 'Sorts the shipped findings by severity, highest first, and prints severity and type.', sample: '8.0\tUnauthorizedAccess:IAMUser/MaliciousIPCaller\n5.0\tRecon:IAMUser/TorIPCaller\n2.0\tStealth:S3/ServerAccessLoggingDisabled' },
        ],
        ['Unauthorized'],
        'Detection without triage is just noise. Sorting by severity is the first move: it says which finding is the fire and which is the smoke.',
        {
          usesForm: 'Detection & Findings Log',
          outputHighlights: [{ text: 'Unauthorized', label: 'The highest-severity finding — the incident to work.' }],
          fixes: [{ symptom: 'jq is not found?', fix: 'Install jq from your package manager; it ships in AWS CloudShell already.' }],
        }
      ),
      run(
        'scs-w3-detect-s2',
        'Pull the detail of the top finding',
        'Your own machine — a terminal',
        'Read the full detail of the highest-severity finding, so the incident log opens with the facts.',
        [
          { cmd: 'jq -r \'.Findings | sort_by(-.Severity) | .[0] | {type:.Type, actor:.Resource.AccessKeyDetails.UserName, ip:.Service.Action.AwsApiCallAction.RemoteIpDetails.IpAddressV4}\' findings.json', explain: 'Prints the type, the actor and the source IP of the top finding.', sample: '{\n  "type": "UnauthorizedAccess:IAMUser/MaliciousIPCaller",\n  "actor": "secops",\n  "ip": "203.0.113.7"\n}' },
        ],
        ['type'],
        'The incident starts from the finding’s own facts: who, from where, doing what. That is the symptom you write down before any theory.',
        {
          usesForm: 'Detection & Findings Log',
          producesDeliverable: '06_Detection_and_Findings_Log.md',
          outputHighlights: [{ text: 'type', label: 'The finding type that names the incident.' }],
        }
      ),
    ],
  },

  // ── Week 4 — Incident response and handover (domains 5, 4 & 6) ────────────────
  {
    id: 'scs-w4-incident',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Work the incident with the runbook',
    objective: 'Work the top finding as an incident the method way: one theory, one containment action, one result per row, until it is contained.',
    frameworks: ['NIST_CSF'],
    deliverables: ['07_Incident_Response_Log.md'],
    estimatedTime: '1 h 30 min',
    difficulty: 4,
    learn: ['Incident response', 'Containment', 'Disable the key', 'One change at a time', 'Lessons learned'],
    tools: ['AWS CLI', 'Deliverables forms'],
    prerequisites: ['The top finding from the detection log (Week 3)'],
    definitionOfDone: [
      'The incident is written exactly, before any action',
      'Every step is a row: theory, the one action, the result',
      'At least one action did not contain it and the row says so',
      'The incident is contained and the lesson is recorded',
    ],
    steps: [
      note(
        'scs-w4-incident-s1',
        'Write the incident exactly',
        'Deliverables forms',
        'Before any action, write what happened from the finding: the actor, the source, the action, and why it is an incident.',
        'The log opens with the actor, the source IP, the unauthorized action and why it is an incident, and no action yet.',
        {
          usesForm: 'Incident Response Log',
          whatItMeans: 'The method starts with the incident written down. For a cloud incident the symptom is the exact finding — actor, source, action — not a feeling that something is off.',
        }
      ),
      run(
        'scs-w4-incident-s2',
        'Contain it one action per row',
        'Your own machine — a terminal',
        'Write one theory for how to contain it, take exactly one action, and record the result. An action that does not contain it gets its own row.',
        [
          { cmd: 'aws iam update-access-key --user-name secops --access-key-id AKIAEXAMPLE --status Inactive && aws iam get-access-key-last-used --access-key-id AKIAEXAMPLE --query "AccessKeyLastUsed.Region" --output text && echo "key disabled"', explain: 'Disables the compromised access key, then confirms the change. This is the first containment action.', sample: 'us-east-1\nkey disabled' },
        ],
        ['key disabled'],
        'One action per row is what makes the incident log trustworthy: you can always say which action contained it. The same method A+ uses on hardware.',
        {
          usesForm: 'Incident Response Log',
          outputHighlights: [{ text: 'key disabled', label: 'The compromised credential is contained.' }],
          fixes: [{ symptom: 'Disabling the key did not stop it?', fix: 'The actor may hold a session token too. Next row: revoke active sessions by attaching an AWSRevokeOlderSessions policy, one change, and re-check.' }],
        }
      ),
      note(
        'scs-w4-incident-s3',
        'Record containment and the lesson',
        'Deliverables forms',
        'Write that the incident is contained, keep the rows for the actions that did not work, and record the one change that stops it recurring.',
        'The log ends contained, keeps every action that failed, and names the preventive change.',
        {
          usesForm: 'Incident Response Log',
          producesDeliverable: '07_Incident_Response_Log.md',
          whatItMeans: 'A log with no failed actions in it is a log nobody believes. The lesson — the change that stops the next one — is what turns an incident into an improvement.',
        }
      ),
    ],
  },
  {
    id: 'scs-w4-detect',
    role: 'infra',
    shared: true,
    week: 4,
    title: 'Wire the detection alarm',
    objective: 'Wire a metric filter and alarm so the next unauthorized call pages the team instead of waiting to be found.',
    frameworks: ['NIST_CSF'],
    deliverables: ['06_Detection_and_Findings_Log.md'],
    estimatedTime: '1 h',
    difficulty: 3,
    learn: ['CloudWatch metric filters', 'Alarms', 'Alerting on CloudTrail', 'Detective controls'],
    tools: ['AWS CLI', 'Deliverables forms'],
    definitionOfDone: [
      'A metric filter matches the unauthorized pattern in the trail logs',
      'An alarm on the metric notifies the team',
      'The alarm is shown in OK or configured state',
    ],
    steps: [
      run(
        'scs-w4-detect-s1',
        'Confirm the metric filter matches the pattern',
        'Your own machine — a terminal',
        'List the metric filters on the trail log group and confirm one matches unauthorized or denied calls.',
        [
          { cmd: 'aws logs describe-metric-filters --log-group-name aws-cloudtrail-logs --query "metricFilters[].[filterName,filterPattern]" --output text', explain: 'Lists the metric filters and their patterns; one should match AccessDenied / UnauthorizedOperation.', sample: 'UnauthorizedCalls\t{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }' },
        ],
        ['Unauthorized'],
        'A metric filter turns a line in the trail into a number you can alarm on. It is how a detective control becomes an alert instead of a log nobody reads.',
        {
          usesForm: 'Detection & Findings Log',
          outputHighlights: [{ text: 'Unauthorized', label: 'The filter that counts denied and unauthorized calls.' }],
          fixes: [{ symptom: 'No metric filter?', fix: 'Create one on the CloudTrail log group with the AccessDenied / UnauthorizedOperation pattern, then re-run.' }],
        }
      ),
      run(
        'scs-w4-detect-s2',
        'Confirm the alarm will notify',
        'Your own machine — a terminal',
        'Read the alarm on that metric and confirm it has an action, so it pages rather than just turning red.',
        [
          { cmd: 'aws cloudwatch describe-alarms --alarm-names UnauthorizedCalls --query "MetricAlarms[].[StateValue,AlarmActions[0]]" --output text', explain: 'Prints the alarm state and its first action; an SNS topic ARN means it notifies.', sample: 'OK\tarn:aws:sns:us-east-1:123456789012:sec-alerts' },
        ],
        ['arn:aws:sns'],
        'An alarm with no action just changes colour on a dashboard nobody is watching. The notification action is what makes detection reach a human.',
        {
          usesForm: 'Detection & Findings Log',
          producesDeliverable: '06_Detection_and_Findings_Log.md',
          outputHighlights: [{ text: 'arn:aws:sns', label: 'The alarm notifies a topic the team subscribes to.' }],
        }
      ),
    ],
  },
  {
    id: 'scs-w4-handover',
    role: 'records',
    shared: true,
    week: 4,
    title: 'Hand the baseline over',
    objective: 'Assemble the handover: the control baseline as it stands, the open risks, and a hashed custody row for every artifact.',
    frameworks: ['NIST_CSF'],
    deliverables: ['08_Security_Handover_and_Baseline.md'],
    estimatedTime: '1 h 15 min',
    difficulty: 3,
    learn: ['Control baseline', 'Risk register', 'Chain of custody', 'Hashing evidence'],
    tools: ['AWS CLI', 'Deliverables forms'],
    prerequisites: ['Every other record of the course, filled'],
    definitionOfDone: [
      'The baseline lists every control and whether it is on',
      'Each open risk has an owner and a mitigation',
      'Every artifact has a custody row with its hash',
    ],
    steps: [
      note(
        'scs-w4-handover-s1',
        'Write the control baseline and the open risks',
        'Deliverables forms',
        'Write the baseline in one page by reference to the other records: identity, network, data, detection — each control, on or off, and each open risk with an owner.',
        'A one-page baseline a new team could run from, with every control’s state and every open risk owned.',
        {
          usesForm: 'Security Handover & Baseline',
          whatItMeans: 'The baseline is the document the next security team reads before touching the workload. Written honestly, it says exactly what is protected and what is not yet.',
        }
      ),
      run(
        'scs-w4-handover-s2',
        'Hash every artifact for custody',
        'Your own machine — a terminal',
        'Hash every file in the evidence folder so the handover carries a custody row that proves what was delivered.',
        [
          { cmd: 'find sec-t1 -type f -exec sha256sum {} + | tee week-4/custody.txt | wc -l && echo "custody.txt written"', explain: 'Hashes every artifact and counts them, writing the custody list for the record.', sample: '18\ncustody.txt written' },
        ],
        ['custody.txt'],
        'A hash is what lets anyone, months later, prove the policy or finding in hand is the one delivered. It is the last control of the course.',
        {
          usesForm: 'Security Handover & Baseline',
          producesDeliverable: '08_Security_Handover_and_Baseline.md',
          outputHighlights: [{ text: 'custody.txt', label: 'Every artifact hashed into one custody list.' }],
        }
      ),
    ],
  },
];

export const AWS_SECURITY_SPECIALTY: Course = withModules(withAiExtensions(withPortfolioStep({
  id: 'aws-security-specialty',
  title: 'AWS Security Specialty — the Secure Workload',
  slug: 'aws-security-specialty',
  description:
    'Secure one small AWS workload end to end: least-privilege identity proved on a denial, a segmented fenced network, data under its own keys, detection that pages, and an incident worked one change per row. Built for SCS-C03.',
  vendor: 'AWS',
  certification: 'Security – Specialty (SCS-C03)',
  level: 'professional',
  audience:
    'Secure, defend and hand over one small AWS workload as a four-person security team — everyone runs the commands, pastes the proof and fills every record; the focus decides which record you lead.',
  roles: ROLES,
  weeks: WEEKS,
  gates: [],
  tasks: TASKS,
  // One shared workload: every member works every task, and the focus is the
  // record they lead and review.
  sharedTrack: true,
  // No week locks. A team waiting on an IAM change still works the weeks it can.
  noGatekeeping: true,
  teamCount: 16,
  teamCapacity: 4,
  // The security picture: the account, the identity, the network, the data, the
  // detection, and the records lane. Drawn from `awsSecuritySpecialtyContent.ts`.
  topologyPicture: 'arch',
  lifecyclePath: [
    { label: 'Set up', detail: 'The account with a budget guard, an MFA identity, the folder.' },
    { label: 'Identify', detail: 'Least-privilege identity, proved on a denial, and the baseline.' },
    { label: 'Build', detail: 'A segmented network, least-exposure groups, no open SSH.' },
    { label: 'Protect', detail: 'Customer-managed keys, a locked bucket, triaged findings.' },
    { label: 'Respond', detail: 'Work the incident one change per row, wire the alarm.' },
    { label: 'Hand over', detail: 'The control baseline, the open risks, custody for every artifact.' },
  ],
  isSeed: true,
  version: 1,
})));

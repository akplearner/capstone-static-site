import { cloudDeliverables, sliceDeliverables, type CloudVocab } from './cloudDeliverables';

/** The AWS capstone's twelve documents (R87) — the shared set, in AWS’s words. */
export const AWS_CLOUD_VOCAB: CloudVocab = {
  courseId: 'aws-cloud',
  key: 'aws',
  cloud: 'AWS',
  scope: 'Account',
  group: 'Stack',
  net: 'VPC',
  subnet: 'subnet',
  firewall: 'Security group',
  vm: 'EC2 instance (t3.micro)',
  hosting: 'Private S3 bucket behind CloudFront with Origin Access Control',
  fn: 'Lambda + API Gateway HTTP API',
  db: 'DynamoDB',
  secrets: 'Nothing — the Lambda execution role',
  identity: 'IAM execution role (table-scoped)',
  monitor: 'CloudWatch',
  alert: 'SNS topic',
  policy: 'AWS Config — required-tags (owner)',
  audit: 'CloudTrail event history',
  posture: 'Trusted Advisor + IAM Access Analyzer',
  remoteAdmin: 'Session Manager',
  patching: 'Systems Manager Patch Manager',
  snapshot: 'snap-… (EBS, incremental)',
  objectRecovery: 'S3 versioning (remove the delete marker)',
  template: 'template.yaml',
  tool: 'CloudFormation',
  preview: 'change set',
  pipelineAction: 'aws-actions/aws-cloudformation-github-deploy',
  oidc: 'IAM OIDC provider + role assumed by the workflow (no access key)',
  region: 'us-east-1',
  calculator: 'AWS Pricing Calculator',
  standardW1: 'AWS tagging best practices — naming and tagging',
  standardW11: 'AWS Well-Architected — cost and security pillars',
  naming: [
    { resource: 'VPC', pattern: 'vpc-{workload}-{team}', example: 'vpc-capstone-team01' },
    { resource: 'Subnet', pattern: 'snet-{public|private}-{team}', example: 'snet-public-team01' },
    { resource: 'EC2 instance', pattern: 'ec2-{role}-{team}', example: 'ec2-tools-team01' },
    { resource: 'S3 bucket', pattern: 'capstone-{team}-{purpose}-{random}', example: 'capstone-team01-site-18342' },
  ],
  services: [
    'EC2 instance',
    'EBS volume',
    'VPC / security group',
    'S3',
    'CloudFront',
    'Lambda',
    'API Gateway',
    'DynamoDB',
    'CloudWatch / SNS',
    'Other',
  ],
};

const ALL = cloudDeliverables(AWS_CLOUD_VOCAB);
export const AWS_CLOUD_PRACTITIONER_DELIVERABLES = sliceDeliverables(ALL, 'aws-cloud-practitioner', 'awsf', [1, 4]);
export const AWS_SOLUTIONS_ARCHITECT_DELIVERABLES = sliceDeliverables(ALL, 'aws-solutions-architect', 'awsa', [5, 8]);
export const AWS_DEVOPS_DELIVERABLES = sliceDeliverables(ALL, 'aws-devops', 'awsd', [9, 12]);
export const AWS_CLOUD_DELIVERABLES = [...AWS_CLOUD_PRACTITIONER_DELIVERABLES, ...AWS_SOLUTIONS_ARCHITECT_DELIVERABLES, ...AWS_DEVOPS_DELIVERABLES];

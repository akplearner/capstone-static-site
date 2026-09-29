import type { CloudEdge, CloudTopology } from './model';
import { AWS_IAC } from './awsIac';
import { cfnDependencies, dependencyEdges } from './deps';

/**
 * The AWS capstone's picture (R87), drawn like CloudFormation's designer
 * (Infrastructure Composer) inside the usual AWS diagram nesting: AWS Cloud ›
 * Region › VPC › Availability Zone › public/private subnets, with global
 * services (CloudFront, IAM, Budgets) outside the Region.
 *
 * Node and container ids are the template's logical ids, so every box is a
 * resource in template.yaml and vice versa (parity-tested). The VPC and both
 * subnets are template resources drawn as containers.
 */

const weekOf = (id: string) => AWS_IAC.resources.find((r) => r.id === id)?.week ?? 1;

const TRAFFIC: CloudEdge[] = [
  { from: 'user', to: 'SiteDistribution', kind: 'traffic', label: 'HTTPS', week: 2 },
  { from: 'SiteDistribution', to: 'SiteBucket', kind: 'traffic', label: 'OAC (signed)', week: 2 },
  { from: 'user', to: 'HttpApi', kind: 'traffic', label: 'GET /count', week: 3 },
  { from: 'HttpApi', to: 'CounterFunction', kind: 'traffic', label: 'invoke', week: 3 },
  { from: 'CounterFunction', to: 'VisitorTable', kind: 'traffic', label: 'ADD +1', week: 3 },
  { from: 'CounterFunction', to: 'CounterLogGroup', kind: 'traffic', label: 'logs', week: 4 },
  { from: 'CounterFunction', to: 'FunctionErrorsAlarm', kind: 'traffic', label: 'Errors metric', week: 4 },
  { from: 'FunctionErrorsAlarm', to: 'AlertTopic', kind: 'traffic', label: 'email', week: 4 },
  { from: 'admin', to: 'ToolsInstance', kind: 'traffic', label: 'SSH from your /32', week: 2, until: 5 },
  { from: 'admin', to: 'ToolsInstance', kind: 'traffic', label: 'Session Manager — no open port', week: 6 },
  { from: 'ToolsInstance', to: 'InternetGateway', kind: 'traffic', label: 'outbound: patches', week: 2 },
  { from: 'github', to: 'SiteBucket', kind: 'traffic', label: 'deploy site (OIDC)', week: 10 },
  { from: 'github', to: 'CounterFunction', kind: 'traffic', label: 'deploy code (OIDC)', week: 10, via: { x: 480, y: 150 } },
];

export const AWS_TOPOLOGY: CloudTopology = {
  platform: 'aws',
  title: 'The company in AWS — what template.yaml builds',
  howToRead:
    'Boxes are AWS Cloud, the Region, the VPC, its Availability Zone and subnets; global services sit outside the Region. Each icon is one resource in the CloudFormation template — click it to see its lines. Orange arrows are traffic; thin grey lines tie a supporting resource to what it belongs to; switch on "Show template details" to see the plumbing, !Ref and DependsOn. Icons are the official AWS Architecture Icons.',
  width: 1100,
  height: 640,
  containers: [
    { id: 'cloud', kind: 'account', label: 'AWS Cloud', sub: 'account · team01', x: 110, y: 10, w: 890, h: 620, week: 1 },
    { id: 'region', kind: 'region', label: 'Region', sub: 'us-east-1', x: 272, y: 30, w: 714, h: 600, week: 1 },
    { id: 'Vpc', kind: 'network', label: 'VPC', sub: 'vpc-capstone-team01 · 10.10.0.0/16', x: 650, y: 70, w: 326, h: 450, week: 1 },
    { id: 'az', kind: 'zone', label: 'Availability Zone', sub: 'us-east-1a', x: 664, y: 150, w: 298, h: 360, week: 1 },
    { id: 'PublicSubnet', kind: 'subnet', label: 'Public subnet', sub: '10.10.1.0/24', x: 678, y: 184, w: 270, h: 200, week: 1 },
    { id: 'PrivateSubnet', kind: 'subnet-private', label: 'Private subnet', sub: '10.10.2.0/24 · no internet route', x: 678, y: 392, w: 270, h: 100, week: 6 },
    // Not a template resource: the box for what is account-level, outside any Region — top-left, so a Week-1 picture is two small boxes.
    { id: 'account-level', kind: 'group', label: 'Account level', sub: 'IAM · Budgets', x: 112, y: 40, w: 140, h: 100, week: 1 },
  ],
  // Read left to right: visitors reach CloudFront and the API; the API reaches
  // Lambda, then the table; monitoring sits under Lambda; the VPC on the right
  // holds the one instance. Plumbing (`detail`) is drawn only on request.
  nodes: [
    { id: 'github', icon: 'github', label: 'GitHub', x: 55, y: 150, week: 1, external: true },
    { id: 'user', icon: 'user', label: 'Visitors', x: 55, y: 330, week: 2, external: true },
    { id: 'admin', icon: 'user', label: 'Team admin', x: 1055, y: 262, week: 2, external: true },

    { id: 'SiteDistribution', icon: 'cdn', label: 'CloudFront', name: 'd…cloudfront.net', x: 185, y: 205, week: 2 },
    { id: 'SiteOac', icon: 'oac', label: 'OAC', x: 185, y: 283, week: 2, small: true },
    { id: 'ReadOnlyGroup', icon: 'group', label: 'Read-only', x: 145, y: 100, week: 5, small: true },
    { id: 'MonthlyBudget', icon: 'budget', label: 'Budget $5', x: 212, y: 100, week: 1, small: true },

    { id: 'SiteBucket', icon: 'storage', label: 'Amazon S3', name: 'site bucket (private)', x: 340, y: 205, week: 2 },
    { id: 'SiteBucketPolicy', icon: 'bucketpolicy', label: 'Bucket policy', x: 315, y: 283, week: 2, small: true, detail: true },

    { id: 'HttpApi', icon: 'api', label: 'API Gateway', name: 'HTTP API', x: 340, y: 330, week: 3 },
    { id: 'ApiInvokePermission', icon: 'role', label: 'Invoke perm.', x: 410, y: 270, week: 3, small: true, detail: true },
    { id: 'ApiIntegration', icon: 'api', label: 'Integration', x: 305, y: 410, week: 3, small: true, detail: true },
    { id: 'ApiRoute', icon: 'route', label: 'GET /count', x: 360, y: 410, week: 3, small: true, detail: true },
    { id: 'ApiStage', icon: 'api', label: '$default', x: 415, y: 410, week: 3, small: true, detail: true },
    { id: 'CounterFunction', icon: 'function', label: 'AWS Lambda', name: 'capstone-team01-counter', x: 480, y: 330, week: 3 },
    { id: 'VisitorTable', icon: 'nosql', label: 'DynamoDB', name: 'on-demand', x: 610, y: 330, week: 3 },
    { id: 'TableNameParameter', icon: 'param', label: 'Parameter Store', x: 610, y: 412, week: 3, small: true, detail: true },
    // IAM is global, but AWS draws a role beside what assumes it.
    { id: 'CounterFunctionRole', icon: 'role', label: 'Role: counter', x: 480, y: 412, week: 3, small: true },
    { id: 'InstanceRole', icon: 'role', label: 'Role: SSM', x: 860, y: 585, week: 6, small: true },
    { id: 'InstanceProfile', icon: 'role', label: 'Instance profile', x: 950, y: 585, week: 6, small: true, detail: true },

    { id: 'CounterLogGroup', icon: 'logs', label: 'CloudWatch Logs', name: '/aws/lambda/…counter', x: 400, y: 505, week: 4 },
    { id: 'FunctionErrorsAlarm', icon: 'alert', label: 'CloudWatch alarm', name: 'Errors > 0', x: 600, y: 505, week: 4 },
    { id: 'AlertTopic', icon: 'notify', label: 'Amazon SNS', name: 'email the team', x: 745, y: 545, week: 4 },

    { id: 'GatewayAttachment', icon: 'route', label: 'Attachment', x: 865, y: 118, week: 1, small: true, detail: true },
    { id: 'InternetGateway', icon: 'gateway', label: 'Internet gateway', x: 930, y: 118, week: 1, small: true },
    { id: 'PublicRouteTable', icon: 'route', label: 'Route table → IGW', x: 720, y: 237, week: 1, small: true },
    { id: 'PublicDefaultRoute', icon: 'route', label: '0.0.0.0/0 → IGW', x: 720, y: 290, week: 1, small: true, detail: true },
    { id: 'PublicSubnetRouteAssoc', icon: 'route', label: 'Association', x: 720, y: 340, week: 1, small: true, detail: true },
    { id: 'ToolsSecurityGroup', icon: 'firewall', label: 'Security group', x: 915, y: 217, week: 1, small: true },
    { id: 'ToolsInstance', icon: 'vm', label: 'Amazon EC2', name: 'ec2-tools-team01', x: 820, y: 272, week: 2 },
    { id: 'DataVolumeAttachment', icon: 'route', label: 'Attachment', x: 915, y: 332, week: 7, small: true, detail: true },
    { id: 'DataVolume', icon: 'disk', label: 'EBS volume', x: 860, y: 347, week: 7, small: true },
    { id: 'PrivateRouteTable', icon: 'route', label: 'Route table (local)', x: 745, y: 447, week: 6, small: true },
    { id: 'PrivateSubnetRouteAssoc', icon: 'route', label: 'Association', x: 870, y: 447, week: 6, small: true, detail: true },
  ],
  edges: [...TRAFFIC, ...dependencyEdges(cfnDependencies(AWS_IAC.full.text, AWS_IAC.resources), weekOf)],
};

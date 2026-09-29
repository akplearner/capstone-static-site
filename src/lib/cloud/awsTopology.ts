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
  { from: 'CounterFunction', to: 'VisitorTable', kind: 'traffic', label: 'UpdateItem ADD', week: 3 },
  { from: 'CounterFunction', to: 'CounterLogGroup', kind: 'traffic', label: 'logs', week: 4 },
  { from: 'FunctionErrorsAlarm', to: 'AlertTopic', kind: 'traffic', label: 'email', week: 4 },
  { from: 'admin', to: 'ToolsInstance', kind: 'traffic', label: 'SSH from your /32', week: 2, until: 5 },
  { from: 'admin', to: 'ToolsInstance', kind: 'traffic', label: 'Session Manager — no open port', week: 6 },
  { from: 'ToolsInstance', to: 'InternetGateway', kind: 'traffic', label: 'outbound: patches', week: 2 },
  { from: 'github', to: 'SiteBucket', kind: 'traffic', label: 'deploy site (OIDC)', week: 10 },
  { from: 'github', to: 'CounterFunction', kind: 'traffic', label: 'deploy code (OIDC)', week: 10 },
];

export const AWS_TOPOLOGY: CloudTopology = {
  platform: 'aws',
  title: 'The company in AWS — what template.yaml builds',
  howToRead:
    'Boxes are AWS Cloud, the Region, the VPC, its Availability Zone and subnets; global services sit outside the Region. Each icon is one resource in the CloudFormation template — click it to see its lines. Solid arrows are traffic; switch on "Template dependencies" to see !Ref and DependsOn. Icons are drawn in the AWS icon style.',
  width: 1000,
  height: 640,
  containers: [
    { id: 'cloud', kind: 'account', label: 'AWS Cloud', sub: 'account · team01', x: 110, y: 10, w: 880, h: 620, week: 1 },
    { id: 'region', kind: 'region', label: 'Region', sub: 'us-east-1', x: 250, y: 44, w: 726, h: 574, week: 1 },
    { id: 'Vpc', kind: 'network', label: 'VPC', sub: 'vpc-capstone-team01 · 10.10.0.0/16', x: 268, y: 84, w: 300, h: 400, week: 1 },
    { id: 'az', kind: 'zone', label: 'Availability Zone', sub: 'us-east-1a', x: 282, y: 120, w: 272, h: 352, week: 1 },
    { id: 'PublicSubnet', kind: 'subnet', label: 'Public subnet', sub: '10.10.1.0/24', x: 296, y: 154, w: 244, h: 168, week: 1 },
    { id: 'PrivateSubnet', kind: 'subnet-private', label: 'Private subnet', sub: '10.10.2.0/24 · no internet route', x: 296, y: 338, w: 244, h: 122, week: 6 },
  ],
  nodes: [
    { id: 'user', icon: 'user', label: 'Visitors', x: 55, y: 170, week: 2, external: true },
    { id: 'admin', icon: 'user', label: 'Team admin', x: 55, y: 345, week: 2, external: true },
    { id: 'github', icon: 'github', label: 'GitHub', x: 55, y: 545, week: 1, external: true },

    { id: 'SiteDistribution', icon: 'cdn', label: 'CloudFront', name: 'd…cloudfront.net', x: 180, y: 160, week: 2 },
    { id: 'SiteOac', icon: 'oac', label: 'OAC', x: 180, y: 232, week: 2, small: true },
    { id: 'InstanceRole', icon: 'role', label: 'Role: SSM', x: 152, y: 330, week: 6, small: true },
    { id: 'InstanceProfile', icon: 'role', label: 'Profile', x: 210, y: 330, week: 6, small: true },
    { id: 'CounterFunctionRole', icon: 'role', label: 'Role: counter', x: 152, y: 420, week: 3, small: true },
    { id: 'ReadOnlyGroup', icon: 'group', label: 'Read-only', x: 210, y: 420, week: 5, small: true },
    { id: 'MonthlyBudget', icon: 'budget', label: 'Budget $5', x: 180, y: 560, week: 1, small: true },

    { id: 'InternetGateway', icon: 'gateway', label: 'Internet gateway', x: 420, y: 84, week: 1, small: true },
    { id: 'GatewayAttachment', icon: 'route', label: 'Attachment', x: 350, y: 84, week: 1, small: true },
    { id: 'PublicRouteTable', icon: 'route', label: 'Route table', x: 330, y: 196, week: 1, small: true },
    { id: 'PublicDefaultRoute', icon: 'route', label: '0.0.0.0/0 → IGW', x: 330, y: 250, week: 1, small: true },
    { id: 'PublicSubnetRouteAssoc', icon: 'route', label: 'Association', x: 330, y: 300, week: 1, small: true },
    { id: 'ToolsSecurityGroup', icon: 'firewall', label: 'Security group', x: 515, y: 180, week: 1, small: true },
    { id: 'ToolsInstance', icon: 'vm', label: 'Amazon EC2', name: 'ec2-tools-team01', x: 425, y: 236, week: 2 },
    { id: 'DataVolumeAttachment', icon: 'route', label: 'Attachment', x: 515, y: 244, week: 7, small: true },
    { id: 'DataVolume', icon: 'disk', label: 'EBS volume', x: 515, y: 300, week: 7, small: true },
    { id: 'PrivateRouteTable', icon: 'route', label: 'Route table (local)', x: 350, y: 404, week: 6, small: true },
    { id: 'PrivateSubnetRouteAssoc', icon: 'route', label: 'Association', x: 460, y: 404, week: 6, small: true },

    { id: 'SiteBucket', icon: 'storage', label: 'Amazon S3', name: 'site bucket (private)', x: 655, y: 150, week: 2 },
    { id: 'SiteBucketPolicy', icon: 'bucketpolicy', label: 'Bucket policy', x: 745, y: 192, week: 2, small: true },

    { id: 'HttpApi', icon: 'api', label: 'API Gateway', name: 'HTTP API', x: 650, y: 300, week: 3 },
    { id: 'ApiIntegration', icon: 'api', label: 'Integration', x: 605, y: 380, week: 3, small: true },
    { id: 'ApiRoute', icon: 'route', label: 'GET /count', x: 660, y: 380, week: 3, small: true },
    { id: 'ApiStage', icon: 'api', label: '$default', x: 715, y: 380, week: 3, small: true },
    { id: 'ApiInvokePermission', icon: 'role', label: 'Invoke perm.', x: 725, y: 250, week: 3, small: true },
    { id: 'CounterFunction', icon: 'function', label: 'AWS Lambda', name: 'capstone-team01-counter', x: 800, y: 300, week: 3 },
    { id: 'VisitorTable', icon: 'nosql', label: 'DynamoDB', name: 'on-demand', x: 925, y: 300, week: 3 },
    { id: 'TableNameParameter', icon: 'param', label: 'Parameter Store', x: 925, y: 380, week: 3, small: true },

    { id: 'FunctionErrorsAlarm', icon: 'alert', label: 'CloudWatch alarm', x: 655, y: 470, week: 4 },
    { id: 'CounterLogGroup', icon: 'logs', label: 'CloudWatch Logs', x: 800, y: 470, week: 4 },
    { id: 'AlertTopic', icon: 'notify', label: 'Amazon SNS', x: 655, y: 565, week: 4, small: true },
  ],
  edges: [...TRAFFIC, ...dependencyEdges(cfnDependencies(AWS_IAC.full.text, AWS_IAC.resources), weekOf)],
};

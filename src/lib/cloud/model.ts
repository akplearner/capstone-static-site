/**
 * The cloud capstones' shared vocabulary (R87): one topology model and one
 * IaC model, used by both the Azure (ARM) and the AWS (CloudFormation)
 * course. Each course fills them with its own native services; the renderer
 * and the viewer only know these shapes.
 *
 * Everything here is plain data so it serialises into the course document
 * (`content.cloud`) unchanged — the components read the document, never this
 * module directly.
 */

export type CloudPlatform = 'azure' | 'aws';

/** Every service a diagram can draw. One drawn glyph per key per platform. */
export type CloudIconKey =
  // shared concepts
  | 'user'
  | 'github'
  | 'vm'
  | 'disk'
  | 'function'
  | 'nosql'
  | 'storage'
  | 'secret'
  | 'logs'
  | 'apm'
  | 'alert'
  | 'notify'
  | 'budget'
  | 'policy'
  | 'role'
  | 'group'
  | 'param'
  | 'diag'
  // network
  | 'vnet'
  | 'subnet'
  | 'firewall'
  | 'publicip'
  | 'nic'
  | 'gateway'
  | 'route'
  // platform-specific
  | 'plan'
  | 'cdn'
  | 'oac'
  | 'api'
  | 'blobservice'
  | 'bucketpolicy'
  | 'container'
  // R103: drawn glyphs (no official file yet)
  | 'bastion'
  | 'backup'
  | 'identity'
  | 'audit';

/** A box that holds other things: subscription, resource group, VNet, subnet;
 *  or AWS Cloud, Region, VPC, subnet. */
export interface CloudContainer {
  id: string;
  kind: 'account' | 'group' | 'region' | 'network' | 'subnet' | 'subnet-private' | 'zone';
  label: string;
  /** Second line, in monospace: an address space, a resource name. */
  sub?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The week the box first exists (Architecture vN). */
  week: number;
}

export interface CloudNode {
  /** Matches the template: an ARM resource's `comments` tag or a CloudFormation logical id. */
  id: string;
  icon: CloudIconKey;
  /** The service, as the platform names it ("Virtual machine", "Amazon EC2"). */
  label: string;
  /** The deployed resource's name, as the naming standard produces it. */
  name?: string;
  /** Centre of the icon, in the diagram's viewBox units. */
  x: number;
  y: number;
  week: number;
  /** R103: what it is for, in at most twelve words — the weekly breakdown's line. */
  purpose?: string;
  /** Draw small: supporting resources (NIC, role assignment, diagnostic setting). */
  small?: boolean;
  /** R94: template plumbing a beginner does not need in the picture (a route-table
   *  association, an API stage, a runtime storage account). Drawn only with
   *  "Show template details"; always `small`. */
  detail?: boolean;
  /** Not in the template: people, GitHub, the internet. */
  external?: boolean;
}

export interface CloudEdge {
  from: string;
  to: string;
  /** `traffic` is the request path students trace; `depends` is the template's
   *  dependsOn / !Ref graph, drawn only in the dependencies view. */
  kind: 'traffic' | 'depends';
  label?: string;
  week: number;
  /** Last week the path exists (SSH from the admin's IP ends when Week 6
   *  removes it). Omitted = still there at the end. */
  until?: number;
  /** A corner the line turns at, so it can route around what it would cross. */
  via?: { x: number; y: number };
}

export interface CloudTopology {
  platform: CloudPlatform;
  title: string;
  howToRead: string;
  width: number;
  height: number;
  containers: CloudContainer[];
  nodes: CloudNode[];
  edges: CloudEdge[];
}

// ── IaC ──────────────────────────────────────────────────────────────────────

export interface IacFile {
  name: string;
  lang: 'json' | 'yaml';
  text: string;
}

export interface IacResourceRange {
  /** Node id, as in the topology. */
  id: string;
  /** The native type ("Microsoft.Compute/virtualMachines", "AWS::EC2::Instance"). */
  type: string;
  week: number;
  /** 1-based, inclusive line range in the FULL template. */
  start: number;
  end: number;
}

export interface IacOutput {
  name: string;
  description: string;
}

export interface IacBundle {
  platform: CloudPlatform;
  /** "ARM template" | "CloudFormation" */
  tool: string;
  full: IacFile;
  starter: IacFile;
  /** How many blanks the starter leaves for the student. */
  fillCount: number;
  parameters: IacFile[];
  outputs: IacOutput[];
  resources: IacResourceRange[];
  /** The commands that validate, preview and deploy it, in order. */
  commands: { label: string; cmd: string }[];
  /** Plain-language notes on what the template deliberately does NOT do. */
  notes: string[];
}

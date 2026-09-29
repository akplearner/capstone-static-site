import type { CloudEdge, CloudTopology } from './model';
import { AZURE_IAC } from './azureIac';
import { armDependencies, dependencyEdges } from './deps';

/**
 * The Azure capstone's picture (R87), drawn like the ARM template
 * visualizer inside the Cloud Adoption Framework's usual nesting:
 * subscription › resource group › virtual network › subnets, with the PaaS
 * services beside the network and the operations resources along the bottom.
 *
 * Node ids are the template's `comments` tags, so every box here is a
 * resource in azuredeploy.json and vice versa (parity-tested). Positions are
 * the diagram's own; weeks come from the template.
 */

const weekOf = (id: string) => AZURE_IAC.resources.find((r) => r.id === id)?.week ?? 1;

const TRAFFIC: CloudEdge[] = [
  { from: 'user', to: 'webStorage', kind: 'traffic', label: 'HTTPS', week: 2 },
  { from: 'user', to: 'func', kind: 'traffic', label: 'GET /api/visitorCount', week: 3 },
  { from: 'func', to: 'cosmos', kind: 'traffic', label: 'managed identity', week: 3 },
  // Weeks 3–4 only: the template's final state has no vault reference — from Week 5 the identity replaces the secret.
  { from: 'func', to: 'kv', kind: 'traffic', label: 'Key Vault reference (until Week 5)', week: 3, until: 4 },
  { from: 'func', to: 'appi', kind: 'traffic', label: 'telemetry', week: 3 },
  { from: 'appi', to: 'log', kind: 'traffic', label: 'stores in', week: 3 },
  { from: 'func', to: 'http5xxAlert', kind: 'traffic', label: 'Http5xx metric', week: 4 },
  { from: 'http5xxAlert', to: 'actionGroup', kind: 'traffic', label: 'email', week: 4 },
  { from: 'admin', to: 'pip', kind: 'traffic', label: 'SSH from your /32', week: 2, until: 5, via: { x: 990, y: 322 } },
  { from: 'vm', to: 'pip', kind: 'traffic', label: 'outbound', week: 2 },
  { from: 'admin', to: 'vm', kind: 'traffic', label: 'Run Command — no open port', week: 6 },
  { from: 'github', to: 'webStorage', kind: 'traffic', label: 'deploy site (OIDC)', week: 10 },
  { from: 'github', to: 'func', kind: 'traffic', label: 'deploy code (OIDC)', week: 10 },
];

export const AZURE_TOPOLOGY: CloudTopology = {
  platform: 'azure',
  title: 'The company in Azure — what azuredeploy.json builds',
  howToRead:
    'Boxes are the containers Azure groups things in: subscription, resource group, virtual network, subnets. Each icon is one resource in the ARM template — click it to see its lines. Blue arrows are traffic; thin grey lines tie a supporting resource to what it belongs to; switch on "Template dependencies" to see every dependsOn. Icons are Microsoft’s official Azure icons.',
  width: 1100,
  height: 640,
  containers: [
    { id: 'subscription', kind: 'account', label: 'Azure subscription', sub: 'Azure for Students', x: 110, y: 10, w: 890, h: 620, week: 1 },
    { id: 'rg', kind: 'group', label: 'Resource group', sub: 'rg-capstone-team01', x: 128, y: 44, w: 858, h: 574, week: 1 },
    { id: 'vnet', kind: 'network', label: 'Virtual network', sub: 'vnet-capstone-team01 · 10.10.0.0/16', x: 640, y: 84, w: 332, h: 390, week: 1 },
    { id: 'snetApp', kind: 'subnet', label: 'snet-app', sub: '10.10.1.0/24', x: 656, y: 128, w: 300, h: 196, week: 1 },
    { id: 'snetMgmt', kind: 'subnet', label: 'snet-mgmt', sub: '10.10.2.0/24 · reserved for Bastion', x: 656, y: 340, w: 300, h: 118, week: 6 },
    // Not a template resource: the box that holds what applies to the whole resource group.
    { id: 'governance', kind: 'group', label: 'Governance', sub: 'resource-group scope', x: 640, y: 520, w: 332, h: 90, week: 1 },
  ],
  nodes: [
    { id: 'user', icon: 'user', label: 'Visitors', x: 55, y: 150, week: 2, external: true },
    { id: 'github', icon: 'github', label: 'GitHub', x: 55, y: 560, week: 1, external: true },
    { id: 'admin', icon: 'user', label: 'Team admin', x: 1055, y: 230, week: 2, external: true },

    { id: 'webStorage', icon: 'storage', label: 'Storage account', name: 'stweb… ($web)', x: 280, y: 128, week: 2 },
    { id: 'webBlobService', icon: 'blobservice', label: 'Soft delete', x: 372, y: 170, week: 8, small: true },
    { id: 'kvRoleFunc', icon: 'role', label: 'Secrets User', x: 425, y: 128, week: 5, small: true },
    { id: 'kv', icon: 'secret', label: 'Key vault', name: 'kv-team01-…', x: 545, y: 128, week: 3 },

    { id: 'plan', icon: 'plan', label: 'Plan (Y1)', x: 200, y: 300, week: 3, small: true },
    { id: 'func', icon: 'function', label: 'Function app', name: 'func-capstone-team01', x: 300, y: 270, week: 3 },
    { id: 'funcStorage', icon: 'storage', label: 'Runtime storage', x: 395, y: 335, week: 3, small: true },
    { id: 'cosmosRoleFunc', icon: 'role', label: 'Data Contributor', x: 425, y: 215, week: 5, small: true },
    { id: 'cosmos', icon: 'nosql', label: 'Azure Cosmos DB', name: 'serverless', x: 545, y: 270, week: 3 },
    { id: 'cosmosDb', icon: 'container', label: 'Database', x: 510, y: 360, week: 3, small: true },
    { id: 'cosmosContainer', icon: 'container', label: 'visitors', x: 580, y: 360, week: 3, small: true },

    { id: 'appi', icon: 'apm', label: 'App Insights', name: 'appi-capstone-team01', x: 300, y: 450, week: 3 },
    { id: 'log', icon: 'logs', label: 'Log Analytics', name: 'log-capstone-team01', x: 460, y: 450, week: 3 },

    { id: 'nsgApp', icon: 'firewall', label: 'NSG', name: 'nsg-snet-app', x: 925, y: 160, week: 1, small: true },
    { id: 'nic', icon: 'nic', label: 'NIC', x: 700, y: 190, week: 2, small: true },
    { id: 'pip', icon: 'publicip', label: 'Public IP', x: 700, y: 296, week: 2, small: true },
    { id: 'vm', icon: 'vm', label: 'Virtual machine', name: 'vm-tools-team01', x: 850, y: 222, week: 2 },
    { id: 'dataDisk', icon: 'disk', label: 'Data disk', x: 930, y: 252, week: 7, small: true },
    { id: 'nsgMgmt', icon: 'firewall', label: 'NSG', name: 'nsg-snet-mgmt', x: 925, y: 380, week: 6, small: true },

    { id: 'readerRole', icon: 'role', label: 'Reader (group)', x: 700, y: 572, week: 5, small: true },
    { id: 'tagPolicy', icon: 'policy', label: 'Policy: owner tag', x: 810, y: 572, week: 11, small: true },
    { id: 'funcDiag', icon: 'diag', label: 'Diagnostics', x: 200, y: 570, week: 4, small: true },
    { id: 'http5xxAlert', icon: 'alert', label: 'Alert: 5xx', x: 400, y: 570, week: 4, small: true },
    { id: 'actionGroup', icon: 'notify', label: 'Action group', x: 540, y: 570, week: 4, small: true },
    { id: 'budget', icon: 'budget', label: 'Budget $5', x: 920, y: 572, week: 1, small: true },
  ],
  edges: [...TRAFFIC, ...dependencyEdges(armDependencies(AZURE_IAC.full.text), weekOf)],
};

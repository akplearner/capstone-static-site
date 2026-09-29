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
  { from: 'func', to: 'kv', kind: 'traffic', label: 'secret reference', week: 3 },
  { from: 'func', to: 'appi', kind: 'traffic', label: 'telemetry', week: 3 },
  { from: 'appi', to: 'log', kind: 'traffic', week: 3 },
  { from: 'http5xxAlert', to: 'actionGroup', kind: 'traffic', label: 'email', week: 4 },
  { from: 'admin', to: 'pip', kind: 'traffic', label: 'SSH from your /32', week: 2, until: 5 },
  { from: 'admin', to: 'vm', kind: 'traffic', label: 'Run Command — no open port', week: 6 },
  { from: 'github', to: 'webStorage', kind: 'traffic', label: 'deploy site (OIDC)', week: 10 },
  { from: 'github', to: 'func', kind: 'traffic', label: 'deploy code (OIDC)', week: 10 },
];

export const AZURE_TOPOLOGY: CloudTopology = {
  platform: 'azure',
  title: 'The company in Azure — what azuredeploy.json builds',
  howToRead:
    'Boxes are the containers Azure groups things in: subscription, resource group, virtual network, subnets. Each icon is one resource in the ARM template — click it to see its lines. Solid arrows are traffic; switch on "Template dependencies" to see dependsOn. Icons are drawn in the Azure icon style.',
  width: 1000,
  height: 640,
  containers: [
    { id: 'subscription', kind: 'account', label: 'Azure subscription', sub: 'Azure for Students', x: 110, y: 10, w: 880, h: 620, week: 1 },
    { id: 'rg', kind: 'group', label: 'Resource group', sub: 'rg-capstone-team01', x: 130, y: 44, w: 846, h: 574, week: 1 },
    { id: 'vnet', kind: 'network', label: 'Virtual network', sub: 'vnet-capstone-team01 · 10.10.0.0/16', x: 150, y: 84, w: 330, h: 372, week: 1 },
    { id: 'snetApp', kind: 'subnet', label: 'snet-app', sub: '10.10.1.0/24', x: 168, y: 128, w: 294, h: 178, week: 1 },
    { id: 'snetMgmt', kind: 'subnet', label: 'snet-mgmt', sub: '10.10.2.0/24 · reserved for Bastion', x: 168, y: 322, w: 294, h: 116, week: 6 },
  ],
  nodes: [
    { id: 'user', icon: 'user', label: 'Visitors', x: 55, y: 170, week: 2, external: true },
    { id: 'admin', icon: 'user', label: 'Team admin', x: 55, y: 345, week: 2, external: true },
    { id: 'github', icon: 'github', label: 'GitHub', x: 55, y: 545, week: 1, external: true },

    { id: 'nsgApp', icon: 'firewall', label: 'NSG', name: 'nsg-snet-app', x: 438, y: 156, week: 1, small: true },
    { id: 'pip', icon: 'publicip', label: 'Public IP', x: 205, y: 176, week: 2, small: true },
    { id: 'nic', icon: 'nic', label: 'NIC', x: 205, y: 250, week: 2, small: true },
    { id: 'vm', icon: 'vm', label: 'Virtual machine', name: 'vm-tools-team01', x: 315, y: 214, week: 2 },
    { id: 'dataDisk', icon: 'disk', label: 'Data disk', x: 420, y: 256, week: 7, small: true },
    { id: 'nsgMgmt', icon: 'firewall', label: 'NSG', name: 'nsg-snet-mgmt', x: 438, y: 350, week: 6, small: true },

    { id: 'webStorage', icon: 'storage', label: 'Storage account', name: 'stweb… ($web)', x: 565, y: 134, week: 2 },
    { id: 'webBlobService', icon: 'blobservice', label: 'Soft delete', x: 650, y: 176, week: 8, small: true },
    { id: 'kvRoleFunc', icon: 'role', label: 'Secrets User', x: 815, y: 176, week: 5, small: true },
    { id: 'kv', icon: 'secret', label: 'Key vault', name: 'kv-team01-…', x: 905, y: 134, week: 3 },

    { id: 'plan', icon: 'plan', label: 'Plan (Y1)', x: 548, y: 296, week: 3, small: true },
    { id: 'func', icon: 'function', label: 'Function app', name: 'func-capstone-team01', x: 655, y: 290, week: 3 },
    { id: 'funcStorage', icon: 'storage', label: 'Runtime storage', x: 655, y: 372, week: 3, small: true },
    { id: 'cosmosRoleFunc', icon: 'role', label: 'Data Contributor', x: 790, y: 262, week: 5, small: true },
    { id: 'cosmos', icon: 'nosql', label: 'Azure Cosmos DB', name: 'serverless', x: 905, y: 290, week: 3 },
    { id: 'cosmosDb', icon: 'container', label: 'Database', x: 865, y: 372, week: 3, small: true },
    { id: 'cosmosContainer', icon: 'container', label: 'visitors', x: 945, y: 372, week: 3, small: true },

    { id: 'log', icon: 'logs', label: 'Log Analytics', name: 'log-capstone-team01', x: 565, y: 470, week: 3 },
    { id: 'appi', icon: 'apm', label: 'App Insights', name: 'appi-capstone-team01', x: 700, y: 470, week: 3 },
    { id: 'funcDiag', icon: 'diag', label: 'Diagnostics', x: 630, y: 560, week: 4, small: true },
    { id: 'actionGroup', icon: 'notify', label: 'Action group', x: 760, y: 560, week: 4, small: true },
    { id: 'http5xxAlert', icon: 'alert', label: 'Alert: 5xx', x: 845, y: 560, week: 4, small: true },
    { id: 'budget', icon: 'budget', label: 'Budget $5', x: 930, y: 560, week: 1, small: true },

    { id: 'readerRole', icon: 'role', label: 'Reader (group)', x: 215, y: 540, week: 5, small: true },
    { id: 'tagPolicy', icon: 'policy', label: 'Policy: owner tag', x: 340, y: 540, week: 11, small: true },
  ],
  edges: [...TRAFFIC, ...dependencyEdges(armDependencies(AZURE_IAC.full.text), weekOf)],
};

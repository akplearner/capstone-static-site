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
 *
 * R106: the network holds three subnets — the app subnet with the tools VM,
 * the web subnet with the load-balanced fleet (Week 6) and the delegated
 * database subnet with the zone-redundant PostgreSQL server (Week 7). The
 * queue sits between the function and the database it already reaches.
 */

const weekOf = (id: string) => AZURE_IAC.resources.find((r) => r.id === id)?.week ?? 1;

const TRAFFIC: CloudEdge[] = [
  { from: 'user', to: 'webStorage', kind: 'traffic', label: 'HTTPS', week: 2 },
  { from: 'user', to: 'func', kind: 'traffic', label: 'GET /api/visitorCount', week: 3 },
  // By hand, Weeks 3–4 reach Cosmos DB with a connection string in an app setting; Week 5 replaces it with the identity
  // (and files the string in Key Vault as the team's secret record — the Function never reads the vault in the final state).
  { from: 'func', to: 'cosmos', kind: 'traffic', label: 'connection string (until Week 5)', week: 3, until: 4 },
  { from: 'func', to: 'cosmos', kind: 'traffic', label: 'managed identity', week: 5 },
  { from: 'func', to: 'appi', kind: 'traffic', label: 'telemetry', week: 3 },
  { from: 'appi', to: 'log', kind: 'traffic', label: 'stores in', week: 3 },
  { from: 'func', to: 'http5xxAlert', kind: 'traffic', label: 'Http5xx metric', week: 4 },
  { from: 'http5xxAlert', to: 'actionGroup', kind: 'traffic', label: 'email', week: 4 },
  { from: 'admin', to: 'pip', kind: 'traffic', label: 'SSH from your /32', week: 2, until: 5 },
  { from: 'vm', to: 'pip', kind: 'traffic', label: 'outbound: patches', week: 2 },
  { from: 'admin', to: 'bastion', kind: 'traffic', label: 'browser SSH — no open port', week: 6 },
  { from: 'bastion', to: 'vm', kind: 'traffic', label: 'private IP', week: 6 },
  { from: 'user', to: 'lb', kind: 'traffic', label: 'HTTP, one address', week: 6 },
  { from: 'lb', to: 'vmss', kind: 'traffic', label: 'port 80, probed', week: 6 },
  { from: 'vmss', to: 'pg', kind: 'traffic', label: 'port 5432, private', week: 7 },
  { from: 'func', to: 'visitsQueue', kind: 'traffic', label: 'queue the visit', week: 7 },
  { from: 'visitsQueue', to: 'func', kind: 'traffic', label: 'trigger: ledger', week: 7 },
  { from: 'vmss', to: 'autoscale', kind: 'traffic', label: 'average CPU', week: 8 },
  { from: 'lb', to: 'lbGreenPool', kind: 'traffic', label: 'test port, then cut-over', week: 11 },
  { from: 'func', to: 'funcSlot', kind: 'traffic', label: 'canary, then swap', week: 11 },
  { from: 'lb', to: 'dashboard', kind: 'traffic', label: 'probe status · 5xx', week: 11 },
  { from: 'github', to: 'deployIdentity', kind: 'traffic', label: 'OIDC sign-in', week: 10 },
  { from: 'github', to: 'webStorage', kind: 'traffic', label: 'deploy site (OIDC)', week: 10 },
  { from: 'github', to: 'func', kind: 'traffic', label: 'deploy code (OIDC)', week: 10 },
];

export const AZURE_TOPOLOGY: CloudTopology = {
  platform: 'azure',
  title: 'The company in Azure — what azuredeploy.json builds',
  howToRead:
    'Boxes are the containers Azure groups things in: subscription, resource group, virtual network, subnets. Each icon is one resource in the ARM template — click it to see its lines. Blue arrows are traffic; thin grey lines tie a supporting resource to what it belongs to; switch on "Show template details" to see the plumbing and every dependsOn. Icons are Microsoft’s official Azure icons.',
  width: 1100,
  height: 760,
  containers: [
    { id: 'subscription', kind: 'account', label: 'Azure subscription', sub: 'your subscription', x: 110, y: 10, w: 890, h: 740, week: 1 },
    { id: 'rg', kind: 'group', label: 'Resource group', sub: 'rg-capstone-team01', x: 128, y: 44, w: 858, h: 690, week: 1 },
    { id: 'vnet', kind: 'network', label: 'Virtual network', sub: 'vnet-capstone-team01 · 10.10.0.0/16', x: 640, y: 165, w: 332, h: 555, week: 1 },
    { id: 'snetApp', kind: 'subnet', label: 'snet-app', sub: '10.10.1.0/24', x: 656, y: 292, w: 300, h: 135, week: 1 },
    { id: 'snetWeb', kind: 'subnet', label: 'snet-web', sub: '10.10.2.0/24 · zones 1 and 2', x: 656, y: 453, w: 300, h: 120, week: 6 },
    { id: 'snetDb', kind: 'subnet-private', label: 'snet-db', sub: '10.10.3.0/24 · delegated to PostgreSQL', x: 656, y: 596, w: 300, h: 110, week: 7 },
    // Not a template resource: the strip above the network for what applies to the whole resource group — so a Week-1 picture is one compact column.
    { id: 'governance', kind: 'group', label: 'Governance', sub: 'resource-group scope', x: 640, y: 60, w: 332, h: 90, week: 1 },
  ],
  // Read left to right: visitors reach the site, the API and the balancer;
  // the API reaches its queue and its data; monitoring sits under the API;
  // the network on the right holds the VM, the fleet and the database.
  // Plumbing (`detail`) is drawn only on request.
  nodes: [
    { id: 'user', icon: 'user', label: 'Visitors', purpose: 'The visitors who load the site, call the counter and reach the fleet', x: 55, y: 150, week: 2, external: true },
    { id: 'github', icon: 'github', label: 'GitHub', purpose: 'The repository the site, the code and the template ship from', x: 55, y: 560, week: 1, external: true },
    { id: 'admin', icon: 'user', label: 'Team admin', purpose: 'The team member who administers the environment', x: 1055, y: 425, week: 2, external: true },

    { id: 'webStorage', icon: 'storage', label: 'Storage account', name: 'stweb… ($web)', purpose: 'Hosts the company website over HTTPS', x: 270, y: 130, week: 2 },
    { id: 'webBlobService', icon: 'blobservice', label: 'Soft delete', purpose: 'Brings a deleted or overwritten page back', x: 190, y: 185, week: 8, small: true },
    { id: 'lifecycle', icon: 'blobservice', label: 'Lifecycle: age-out', purpose: 'Moves blobs to Cool after 30 days and deletes old versions after 90', x: 350, y: 185, week: 7, small: true },
    { id: 'kv', icon: 'secret', label: 'Key vault', name: 'kv-capstone-team01-…', purpose: 'Holds secrets the function reads by identity', x: 540, y: 130, week: 5 },
    { id: 'kvRoleFunc', icon: 'role', label: 'Secrets User', purpose: 'Lets the function read secrets, nothing more', x: 622, y: 150, week: 5, small: true },

    { id: 'func', icon: 'function', label: 'Function app', name: 'func-capstone-team01', purpose: 'The visitor-counter API and the ledger that drains the queue', x: 270, y: 285, week: 3 },
    { id: 'funcSlot', icon: 'function', label: 'Slot: staging', purpose: 'Where the canary runs before a swap makes it production', x: 200, y: 240, week: 11, small: true },
    { id: 'plan', icon: 'plan', label: 'Plan (Y1)', x: 200, y: 345, week: 3, small: true, detail: true },
    { id: 'funcStorage', icon: 'storage', label: 'Runtime storage', x: 345, y: 345, week: 3, small: true, detail: true },
    { id: 'visitsQueue', icon: 'queue', label: 'Queue: visits', name: 'on the runtime storage', purpose: 'Decouples the counter from the ledger: the API answers now, the write happens when it can', x: 420, y: 285, week: 7 },
    { id: 'visitsPoisonQueue', icon: 'queue', label: 'visits-poison', purpose: 'Where a message the ledger rejects five times ends up', x: 420, y: 350, week: 7, small: true },
    { id: 'cosmos', icon: 'nosql', label: 'Azure Cosmos DB', name: 'serverless', purpose: 'The database the counter and the ledger live in', x: 540, y: 285, week: 3 },
    { id: 'cosmosRoleFunc', icon: 'role', label: 'Data Contributor', purpose: 'Lets the function read and write data by identity', x: 622, y: 305, week: 5, small: true },
    { id: 'cosmosDb', icon: 'container', label: 'Database', x: 500, y: 358, week: 3, small: true, detail: true },
    { id: 'cosmosContainer', icon: 'container', label: 'visitors', x: 580, y: 358, week: 3, small: true, detail: true },

    { id: 'appi', icon: 'apm', label: 'App Insights', name: 'appi-capstone-team01', purpose: 'Requests, failures and traces from the function', x: 220, y: 458, week: 3 },
    { id: 'log', icon: 'logs', label: 'Log Analytics', name: 'log-capstone-team01', purpose: 'Where every log and metric ends up', x: 350, y: 458, week: 3 },
    { id: 'http5xxAlert', icon: 'alert', label: 'Alert: Http5xx', name: 'alert-func-5xx', purpose: 'Fires when the API returns a server error', x: 480, y: 458, week: 4 },
    { id: 'actionGroup', icon: 'notify', label: 'Action group', name: 'email the team', purpose: 'Who gets told when the alert fires', x: 600, y: 458, week: 4 },
    { id: 'funcDiag', icon: 'diag', label: 'Diagnostics', x: 220, y: 565, week: 4, small: true, detail: true },
    { id: 'dashboard', icon: 'apm', label: 'Dashboard', name: 'the service levels', purpose: 'Probe status, p95 response time and 5xx on one screen', x: 480, y: 560, week: 11 },

    { id: 'lb', icon: 'lb', label: 'Load balancer', name: 'lb-web-team01 · Standard', purpose: 'One address for the fleet; a health probe decides which instance answers', x: 700, y: 222, week: 6 },
    { id: 'lbPip', icon: 'publicip', label: 'Public IP', name: 'zone-redundant', purpose: 'The balancer’s address, present in every zone', x: 765, y: 222, week: 6, small: true },
    { id: 'lbGreenPool', icon: 'route', label: 'Green pool', purpose: 'Where the next release registers while blue still serves; the rule is cut over to it', x: 830, y: 236, week: 11, small: true },
    { id: 'bastion', icon: 'bastion', label: 'Azure Bastion', name: 'Developer SKU · free', purpose: 'A browser SSH session to the VM with no open port', x: 920, y: 222, week: 6 },

    { id: 'nsgApp', icon: 'firewall', label: 'NSG', name: 'nsg-snet-app', purpose: 'Rules for the app subnet: nothing inbound from the internet', x: 930, y: 329, week: 2, small: true },
    { id: 'nic', icon: 'nic', label: 'NIC', x: 720, y: 341, week: 2, small: true, detail: true },
    { id: 'vm', icon: 'vm', label: 'Virtual machine', name: 'vm-tools-team01', purpose: 'The internal IT tools server', x: 790, y: 359, week: 2 },
    { id: 'pip', icon: 'publicip', label: 'Public IP', purpose: 'The VM’s public address, outbound only after week 6', x: 905, y: 384, week: 2, small: true },
    { id: 'dataDisk', icon: 'disk', label: 'Data disk', purpose: 'Data that must outlive the operating system', x: 720, y: 391, week: 7, small: true },

    { id: 'nsgWeb', icon: 'firewall', label: 'NSG', name: 'nsg-snet-web', purpose: 'Rules for the web subnet: HTTP from the internet, nothing else', x: 930, y: 485, week: 6, small: true },
    { id: 'vmss', icon: 'fleet', label: 'Scale set', name: 'vmss-web-team01 · B1s × 0–3', purpose: 'The web fleet across two zones, parked at zero between tasks', x: 790, y: 505, week: 6 },
    { id: 'autoscale', icon: 'alert', label: 'Autoscale', name: 'CPU 50% / 25%', purpose: 'Adds an instance above 50% average CPU, removes one below 25%', x: 870, y: 527, week: 8, small: true },

    { id: 'nsgDb', icon: 'firewall', label: 'NSG', name: 'nsg-snet-db', purpose: 'Rules for the database subnet: PostgreSQL from the app and web subnets only', x: 930, y: 624, week: 7, small: true },
    { id: 'pg', icon: 'db', label: 'PostgreSQL', name: 'flexible server · zone-redundant', purpose: 'The relational store: a standby in another zone, encrypted, no public address', x: 790, y: 634, week: 7 },
    { id: 'pgDnsZone', icon: 'route', label: 'Private DNS zone', x: 690, y: 628, week: 7, small: true, detail: true },
    { id: 'pgDnsLink', icon: 'route', label: 'VNet link', x: 870, y: 638, week: 7, small: true, detail: true },

    { id: 'deployIdentity', icon: 'identity', label: 'Deploy identity', purpose: 'The identity GitHub Actions deploys as; no password to leak', x: 700, y: 80, week: 10, small: true },
    { id: 'githubFederation', icon: 'github', label: 'GitHub federation', purpose: 'Trusts GitHub’s tokens for one repository’s main branch', x: 758, y: 80, week: 10, small: true },
    { id: 'deployRole', icon: 'role', label: 'Contributor (RG)', purpose: 'Contributor on this resource group only', x: 865, y: 80, week: 10, small: true },
    { id: 'readerRole', icon: 'role', label: 'Reader (group)', purpose: 'The team’s group can look at everything and change nothing', x: 700, y: 118, week: 3, small: true },
    { id: 'tagPolicy', icon: 'policy', label: 'Policy: owner tag', purpose: 'Refuses any new resource without an owner tag', x: 810, y: 118, week: 11, small: true },
    { id: 'budget', icon: 'budget', label: 'Budget $5', purpose: 'The $5 guardrail, set before anything can cost money', x: 920, y: 118, week: 1, small: true },
  ],
  edges: [...TRAFFIC, ...dependencyEdges(armDependencies(AZURE_IAC.full.text), weekOf)],
};

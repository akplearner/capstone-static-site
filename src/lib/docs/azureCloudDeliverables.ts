import { cloudDeliverables, sliceDeliverables, type CloudVocab } from './cloudDeliverables';

/** The Azure capstone's twelve documents (R87) — the shared set, in Azure’s words. */
export const AZURE_CLOUD_VOCAB: CloudVocab = {
  courseId: 'azure-cloud',
  key: 'az',
  cloud: 'Azure',
  scope: 'Subscription',
  group: 'Resource group',
  net: 'VNet',
  subnet: 'subnet',
  firewall: 'NSG',
  vm: 'Virtual machine (B1s)',
  hosting: 'Storage account static website (HTTPS built in)',
  fn: 'Function App',
  db: 'Cosmos DB',
  secrets: 'Key Vault',
  identity: 'Managed identity',
  monitor: 'Application Insights / Azure Monitor',
  alert: 'Action group',
  policy: 'Azure Policy — Require a tag on resources (owner)',
  audit: 'Activity Log',
  posture: 'Defender for Cloud (free CSPM)',
  remoteAdmin: 'Run Command',
  patching: 'Azure Update Manager',
  snapshot: 'snap-data-tools-team01 (incremental)',
  objectRecovery: 'Blob soft delete + versioning',
  lb: 'Standard Load Balancer',
  fleet: 'VM scale set (B1s × 0–3, two zones)',
  rdb: 'Azure Database for PostgreSQL flexible server D2ds_v4, zone-redundant HA',
  queue: 'Storage queue capstone-team01-visits',
  endpoint: 'Bastion Developer in the browser; the vault through a private endpoint',
  scaling: 'Autoscale, 50% average CPU',
  template: 'azuredeploy.json',
  tool: 'ARM template',
  preview: 'what-if',
  pipelineAction: 'azure/arm-deploy',
  oidc: 'Federated credential on an app registration (azure/login, no secret)',
  region: 'eastus',
  calculator: 'Azure pricing calculator',
  standardW1: 'Microsoft Cloud Adoption Framework — naming and tagging',
  standardW11: 'Azure Well-Architected — cost and security pillars',
  naming: [
    { resource: 'Resource group', pattern: 'rg-{workload}-{team}', example: 'rg-capstone-team01' },
    { resource: 'Virtual network', pattern: 'vnet-{workload}-{team}', example: 'vnet-capstone-team01' },
    { resource: 'Virtual machine', pattern: 'vm-{role}-{team}', example: 'vm-tools-team01' },
    { resource: 'Storage account', pattern: 'st{purpose}{team}{random}', example: 'stwebteam0118342' },
  ],
  services: [
    'Virtual machine',
    'Managed disk',
    'Virtual network / NSG',
    'Public IP',
    'Storage account',
    'Function App',
    'Cosmos DB',
    'Key Vault',
    'Log Analytics / App Insights',
    'Other',
  ],
};

const ALL = cloudDeliverables(AZURE_CLOUD_VOCAB);
export const AZURE_FUNDAMENTALS_DELIVERABLES = sliceDeliverables(ALL, 'azure-fundamentals', 'azf', [1, 4]);
export const AZURE_ADMINISTRATOR_DELIVERABLES = sliceDeliverables(ALL, 'azure-administrator', 'aza', [5, 8]);
export const AZURE_DEVOPS_DELIVERABLES = sliceDeliverables(ALL, 'azure-devops', 'azd', [9, 12]);
export const AZURE_CLOUD_DELIVERABLES = [...AZURE_FUNDAMENTALS_DELIVERABLES, ...AZURE_ADMINISTRATOR_DELIVERABLES, ...AZURE_DEVOPS_DELIVERABLES];

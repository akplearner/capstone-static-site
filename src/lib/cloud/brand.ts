import type { CloudIconKey, CloudPlatform } from './model';

/**
 * Brand colours for the cloud diagrams (R87). These are the platforms' own
 * palettes, not the site's theme — an AWS compute tile is orange in dark mode
 * too, the way it is on every AWS diagram — so they live here as literals,
 * deliberately outside the theme-token kit (src/components/diagrams/kit),
 * whose no-hex rule is about recolouring per course.
 *
 * AWS: the architecture-icon category colours. Azure: the blues its icon set
 * is built on, plus the few accent colours specific icons carry.
 */

export const AWS_CATEGORY = {
  compute: '#ED7100',
  storage: '#7AA116',
  database: '#C925D1',
  networking: '#8C4FFF',
  security: '#DD344C',
  management: '#E7157B',
  integration: '#E7157B',
  finance: '#7AA116',
  neutral: '#545B64',
} as const;

export const AZURE = {
  blue: '#0078D4',
  light: '#50E6FF',
  dark: '#004E8C',
  gold: '#FFB900',
  green: '#5CA028',
  purple: '#8661C5',
  teal: '#32BEDD',
  grey: '#737373',
} as const;

/** Which AWS category tile a key sits on. */
export const AWS_TILE: Record<CloudIconKey, keyof typeof AWS_CATEGORY> = {
  user: 'neutral',
  github: 'neutral',
  vm: 'compute',
  disk: 'storage',
  function: 'compute',
  nosql: 'database',
  storage: 'storage',
  secret: 'security',
  logs: 'management',
  apm: 'management',
  alert: 'management',
  notify: 'integration',
  budget: 'finance',
  policy: 'management',
  role: 'security',
  group: 'security',
  param: 'management',
  diag: 'management',
  vnet: 'networking',
  subnet: 'networking',
  firewall: 'security',
  publicip: 'networking',
  nic: 'networking',
  gateway: 'networking',
  route: 'networking',
  plan: 'compute',
  cdn: 'networking',
  oac: 'security',
  api: 'integration',
  blobservice: 'storage',
  bucketpolicy: 'security',
  container: 'database',
};

/** The main colour an Azure glyph is drawn in. */
export const AZURE_GLYPH: Record<CloudIconKey, string> = {
  user: AZURE.grey,
  github: AZURE.grey,
  vm: AZURE.blue,
  disk: AZURE.blue,
  function: AZURE.gold,
  nosql: AZURE.dark,
  storage: AZURE.teal,
  secret: AZURE.gold,
  logs: AZURE.purple,
  apm: AZURE.purple,
  alert: AZURE.purple,
  notify: AZURE.purple,
  budget: AZURE.green,
  policy: AZURE.blue,
  role: AZURE.blue,
  group: AZURE.blue,
  param: AZURE.blue,
  diag: AZURE.purple,
  vnet: AZURE.blue,
  subnet: AZURE.blue,
  firewall: AZURE.blue,
  publicip: AZURE.blue,
  nic: AZURE.blue,
  gateway: AZURE.blue,
  route: AZURE.blue,
  plan: AZURE.blue,
  cdn: AZURE.blue,
  oac: AZURE.blue,
  api: AZURE.blue,
  blobservice: AZURE.teal,
  bucketpolicy: AZURE.blue,
  container: AZURE.dark,
};

/** Container chrome per platform: the outline colours platform diagrams use. */
export const CONTAINER_STROKE: Record<CloudPlatform, Record<string, string>> = {
  azure: {
    account: '#737373',
    group: '#949494',
    region: '#0078D4',
    network: '#0078D4',
    subnet: '#50A0E0',
    'subnet-private': '#50A0E0',
    zone: '#8AB8E6',
  },
  aws: {
    account: '#232F3E',
    group: '#7D8998',
    region: '#00A4A6',
    network: '#8C4FFF',
    subnet: '#7AA116',
    'subnet-private': '#00A4A6',
    zone: '#147EBA',
  },
};

/** Faint fills for subnets, the one place platform diagrams tint a box. */
export const CONTAINER_FILL: Record<CloudPlatform, Record<string, string>> = {
  azure: { subnet: 'rgba(80,160,224,0.08)', 'subnet-private': 'rgba(80,160,224,0.08)' },
  aws: { subnet: 'rgba(122,161,22,0.10)', 'subnet-private': 'rgba(0,164,166,0.10)' },
};

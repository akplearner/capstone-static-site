/**
 * Catalog vendors.
 *
 * A vendor maps 1:1 onto a quarry region (`src/lib/quarry.ts` + the
 * `[data-region=…]` blocks in globals.css), so a vendor already owns a rock and
 * a mineral palette — theming a vendor is a data reference, not new CSS. Keep
 * `region` pointing at a key that has a CSS block; the catalog integrity test
 * asserts it. "Engagement" is a real region (the Obsidian Audit Vault) that
 * carries the MSSP client-engagement capstone; it is a vendor-shaped bucket here
 * even though the credential is a framework, not a product.
 */
export interface Vendor {
  id: string;
  /** Display name, e.g. 'CompTIA'. */
  name: string;
  /** Quarry region key — must match a `[data-region=…]` block in globals.css. */
  region: string;
  /** One line on what this vendor's ground covers. */
  blurb: string;
}

export const VENDORS: Vendor[] = [
  {
    id: 'comptia',
    name: 'CompTIA',
    region: 'comptia',
    blurb: 'Broad, practical ground — hardware, networks, security and operations.',
  },
  {
    id: 'cisco',
    name: 'Cisco',
    region: 'cisco',
    blurb: 'Deep network canyons — routing, switching and network security.',
  },
  {
    id: 'isc2',
    name: 'ISC2',
    region: 'isc2',
    blurb: 'The security vault — risk, governance and the defender’s body of knowledge.',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    region: 'microsoft',
    blurb: 'The Azure basin — identity, cloud and hybrid enterprise defence.',
  },
  {
    id: 'aws',
    name: 'AWS',
    region: 'aws',
    blurb: 'The cloud range — distributed systems that survive losing a zone.',
  },
  {
    id: 'linux',
    name: 'Linux',
    region: 'linux',
    blurb: 'The system caverns — the shell, services and automation everything runs on.',
  },
  {
    id: 'engagement',
    name: 'Engagements',
    region: 'engagement',
    blurb: 'Client-side work — compliance, audit and evidence you can hand over.',
  },
];

const BY_ID: Record<string, Vendor> = Object.fromEntries(VENDORS.map((v) => [v.id, v]));

/** A vendor by id, or undefined if unknown. */
export function vendorById(id: string): Vendor | undefined {
  return BY_ID[id];
}

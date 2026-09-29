import type { CloudContainer, CloudIconKey, CloudPlatform } from './model';

/**
 * The official icons (R88).
 *
 * `public/cloud-icons/{aws,azure}/<key>.svg` holds one file per icon key,
 * copied unchanged from the platforms' own packs — AWS Architecture Icons
 * (package 07312026) and Microsoft's Azure Public Service Icons (V24); see
 * `public/cloud-icons/README.md` for the source file of each and the terms
 * both packs are used under. A key listed here renders its official file;
 * anything not listed keeps the drawn glyph in `CloudIcon.tsx`, which is why
 * the two Azure keys that have no official icon (GitHub, an action group)
 * are absent from the Azure list.
 *
 * AWS follows its own convention: a SERVICE icon (the coloured tile) for a
 * service, a RESOURCE icon (a line glyph in the category colour) for a
 * resource inside a group. Its general icons (a user, a repository, a
 * firewall) come in a light and a dark version, so those keys carry a
 * `.dark.svg` twin and the renderer swaps them with the theme.
 */
export const OFFICIAL_ICONS: Record<CloudPlatform, CloudIconKey[]> = {
  azure: [
    'user', 'vm', 'disk', 'storage', 'blobservice', 'function', 'plan', 'nosql', 'container', 'secret', 'role',
    'firewall', 'publicip', 'nic', 'logs', 'apm', 'diag', 'alert', 'budget', 'policy',
  ],
  aws: [
    'user', 'github', 'firewall', 'vm', 'disk', 'function', 'nosql', 'storage', 'cdn', 'api', 'logs', 'alert',
    'notify', 'budget', 'role', 'group', 'param', 'gateway', 'route', 'bucketpolicy', 'oac',
  ],
};

/** Keys whose file has a `.dark.svg` twin for dark backgrounds. */
export const DARK_VARIANTS: Record<CloudPlatform, CloudIconKey[]> = {
  azure: [],
  aws: ['user', 'github', 'firewall'],
};

/** The group icons drawn in a container's corner, by container kind. The AWS
 *  Availability Zone is a dashed box with no icon, as AWS draws it. */
export const OFFICIAL_CONTAINER_ICONS: Record<CloudPlatform, CloudContainer['kind'][]> = {
  azure: ['account', 'group', 'network', 'subnet', 'subnet-private'],
  aws: ['account', 'region', 'network', 'subnet', 'subnet-private'],
};
export const DARK_CONTAINER_VARIANTS: Record<CloudPlatform, CloudContainer['kind'][]> = {
  azure: [],
  aws: ['account'],
};

export function officialIconHref(platform: CloudPlatform, key: CloudIconKey): { light: string; dark: string | null } | null {
  if (!OFFICIAL_ICONS[platform].includes(key)) return null;
  const base = `/cloud-icons/${platform}/${key}`;
  return { light: `${base}.svg`, dark: DARK_VARIANTS[platform].includes(key) ? `${base}.dark.svg` : null };
}

export function officialContainerHref(platform: CloudPlatform, kind: CloudContainer['kind']): { light: string; dark: string | null } | null {
  if (!OFFICIAL_CONTAINER_ICONS[platform].includes(kind)) return null;
  const base = `/cloud-icons/${platform}/group-${kind}`;
  return { light: `${base}.svg`, dark: DARK_CONTAINER_VARIANTS[platform].includes(kind) ? `${base}.dark.svg` : null };
}

import type { CloudIconKey, CloudPlatform } from './model';

/**
 * Official icon drop-in (R87).
 *
 * The diagrams draw every service in each platform's icon STYLE. The
 * official icon packs (Microsoft's Azure architecture icons, AWS's
 * architecture icons) are free to use in architecture diagrams and training
 * material, but they could not be downloaded when this course was built.
 *
 * To use them: copy an SVG from the official pack to
 *   public/cloud-icons/azure/<key>.svg   or   public/cloud-icons/aws/<key>.svg
 * (key = one of CloudIconKey, e.g. `vm`, `function`, `storage`) and add the key
 * to the list below. Listed keys render the official file; everything else
 * keeps its drawn glyph. Listing a key whose file is missing shows a broken
 * image, which is why nothing is listed by default — no request is ever made
 * for a file that is not here.
 */
export const OFFICIAL_ICONS: Record<CloudPlatform, CloudIconKey[]> = {
  azure: [],
  aws: [],
};

export function officialIconHref(platform: CloudPlatform, key: CloudIconKey): string | null {
  return OFFICIAL_ICONS[platform].includes(key) ? `/cloud-icons/${platform}/${key}.svg` : null;
}

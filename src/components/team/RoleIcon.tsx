'use client';

import { getIcon } from '@/lib/icons';

interface RoleIconProps {
  /** Lucide icon name from the whitelist (RoleDef.icon). */
  iconName?: string;
  className?: string;
  /** Optional hex color applied inline. */
  color?: string;
}

// Single source for rendering a role's icon, driven by course data (RoleDef.icon).
// getIcon returns a stable component from a fixed whitelist (not created here).
export function RoleIcon({ iconName, className, color }: RoleIconProps) {
  const Icon = getIcon(iconName);
  // eslint-disable-next-line react-hooks/static-components
  return <Icon className={className} style={color ? { color } : undefined} />;
}

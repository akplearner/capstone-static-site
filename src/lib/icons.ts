import {
  Target,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
  Cloud,
  Terminal,
  Server,
  Database,
  Lock,
  Bug,
  Search,
  Network,
  Code,
  Cpu,
  Globe,
  Eye,
  Wrench,
  BookOpen,
  Users,
  FileText,
  Activity,
  Flame,
  Layers,
  Boxes,
  KeyRound,
  type LucideIcon,
} from 'lucide-react';

// Whitelist of icons instructors can assign to a role. Keeping this explicit
// prevents authored course data from referencing a non-existent component
// (which would crash at render). Add more here as needed.
export const ICON_MAP: Record<string, LucideIcon> = {
  Target,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ClipboardList,
  Cloud,
  Terminal,
  Server,
  Database,
  Lock,
  Bug,
  Search,
  Network,
  Code,
  Cpu,
  Globe,
  Eye,
  Wrench,
  BookOpen,
  Users,
  FileText,
  Activity,
  Flame,
  Layers,
  Boxes,
  KeyRound,
};

export const ICON_NAMES = Object.keys(ICON_MAP);

export const DEFAULT_ICON = 'ClipboardList';

export function getIcon(name?: string): LucideIcon {
  return (name && ICON_MAP[name]) || ICON_MAP[DEFAULT_ICON];
}

import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

// Token-driven, not raw palette classes. `info` uses the course accent — it was
// hardcoded blue before, which made every info callout a different brand from
// the accent-teal buttons on the same screen (and never re-themed per course).
// The others use the ok/warn/danger token trios, which also re-theme in dark
// mode without a single `dark:` class here.
const variants: Record<AlertVariant, { box: string; icon: typeof Info; iconColor: string }> = {
  info: {
    box: 'border-accent/30 bg-accent-soft text-ink',
    icon: Info,
    iconColor: 'text-accent',
  },
  success: {
    box: 'border-ok-line bg-ok-soft text-ink',
    icon: CheckCircle2,
    iconColor: 'text-ok',
  },
  warning: {
    box: 'border-warn-line bg-warn-soft text-ink',
    icon: AlertTriangle,
    iconColor: 'text-warn',
  },
  error: {
    box: 'border-danger-line bg-danger-soft text-ink',
    icon: XCircle,
    iconColor: 'text-danger',
  },
};

/**
 * One accessible callout that replaces the copy-pasted coloured info boxes.
 * `error` alerts get role="alert"; others are passive.
 */
export function Alert({
  variant = 'info',
  title,
  children,
  icon = true,
  className = '',
}: {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}) {
  const v = variants[variant];
  const Icon = v.icon;
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${v.box} ${className}`}
      role={variant === 'error' ? 'alert' : undefined}
    >
      {icon && <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${v.iconColor}`} aria-hidden />}
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  );
}

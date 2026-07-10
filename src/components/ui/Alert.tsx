import { CheckCircle2, Info, AlertTriangle, XCircle } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const variants: Record<AlertVariant, { box: string; icon: typeof Info; iconColor: string }> = {
  info: {
    box: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    box: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200',
    icon: CheckCircle2,
    iconColor: 'text-green-600 dark:text-green-400',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    box: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200',
    icon: XCircle,
    iconColor: 'text-red-600 dark:text-red-400',
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

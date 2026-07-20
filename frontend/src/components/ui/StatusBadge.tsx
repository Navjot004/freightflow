import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'outline';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalizedStatus = (status || '').toUpperCase().trim();

  let variant: BadgeVariant = 'default';
  let label = status;

  // Map business logic statuses to visual variants
  if (['COMPLETED', 'DELIVERED', 'ACCEPTED', 'POD_UPLOADED', 'TENDER_ACCEPTED', 'DRIVER_ACCEPTED', 'PICKUP_COMPLETED'].includes(normalizedStatus)) {
    variant = 'success';
  } else if (['PENDING', 'IN_TRANSIT', 'WAITING_FOR_DRIVER_ASSIGNMENT', 'DRIVER_ASSIGNED', 'PICKUP_STARTED', 'TENDER_SENT'].includes(normalizedStatus)) {
    variant = 'info';
  } else if (['DRAFT', 'EXPIRED', 'NOT_SELECTED'].includes(normalizedStatus)) {
    variant = 'outline';
  } else if (['REJECTED', 'CANCELED', 'DISPUTED'].includes(normalizedStatus)) {
    variant = 'destructive';
  } else if (['AVAILABLE', 'ACTIVE'].includes(normalizedStatus)) {
    variant = 'success';
  }

  // Formatting label nicely
  label = normalizedStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  // Define color mappings for Dark Mode compatible variants
  const variants = {
    default: 'bg-muted text-muted-foreground border-transparent',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-transparent',
    destructive: 'bg-destructive/15 text-destructive dark:text-red-400 border-transparent',
    info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-transparent',
    outline: 'border-border text-muted-foreground',
  };

  return (
    <div
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variants[variant]} ${className}`}
    >
      {label}
    </div>
  );
}

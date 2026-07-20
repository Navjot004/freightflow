import { CheckCircle, Clock, XCircle, AlertCircle, Link } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getBadgeStyle = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-700 dark:text-yellow-400',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: <Clock className="h-3.5 w-3.5 mr-1" />,
          label: 'Pending'
        };
      case 'ACCEPTED':
      case 'CONNECTED':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-700 dark:text-green-400',
          border: 'border-green-200 dark:border-green-800',
          icon: <CheckCircle className="h-3.5 w-3.5 mr-1" />,
          label: status === 'CONNECTED' ? 'Connected' : 'Accepted'
        };
      case 'REJECTED':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-700 dark:text-red-400',
          border: 'border-red-200 dark:border-red-800',
          icon: <XCircle className="h-3.5 w-3.5 mr-1" />,
          label: 'Rejected'
        };
      case 'CANCELLED':
        return {
          bg: 'bg-orange-100 dark:bg-orange-900/30',
          text: 'text-orange-700 dark:text-orange-400',
          border: 'border-orange-200 dark:border-orange-800',
          icon: <AlertCircle className="h-3.5 w-3.5 mr-1" />,
          label: 'Cancelled'
        };
      case 'BLOCKED':
        return {
          bg: 'bg-gray-100 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-400',
          border: 'border-gray-200 dark:border-gray-700',
          icon: <XCircle className="h-3.5 w-3.5 mr-1" />,
          label: 'Blocked'
        };
      default:
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-800',
          icon: <Link className="h-3.5 w-3.5 mr-1" />,
          label: status
        };
    }
  };

  const style = getBadgeStyle(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
      {style.icon}
      {style.label}
    </span>
  );
}

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInDays, parseISO, isBefore, addMonths, format, formatDistanceToNow, differenceInMinutes } from "date-fns";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export type DomainStatus = 'expired' | 'warning' | 'safe' | 'unknown';
export interface DomainStatusInfo {
  status: DomainStatus;
  label: string;
  colorClassName: string;
  daysRemaining: number | null;
}
export function getDomainStatus(expiryDate: string | null | undefined): DomainStatusInfo {
  if (!expiryDate) {
    return {
      status: 'unknown',
      label: 'N/A',
      colorClassName: 'bg-gray-400',
      daysRemaining: null,
    };
  }
  try {
    const now = new Date();
    const expiration = parseISO(expiryDate);
    const daysRemaining = differenceInDays(expiration, now);
    if (isBefore(expiration, now)) {
      return {
        status: 'expired',
        label: `Expired ${-daysRemaining}d ago`,
        colorClassName: 'bg-red-500',
        daysRemaining,
      };
    }
    if (isBefore(expiration, addMonths(now, 3))) {
      return {
        status: 'warning',
        label: `Expires in ${daysRemaining}d`,
        colorClassName: 'bg-yellow-500',
        daysRemaining,
      };
    }
    return {
      status: 'safe',
      label: `Expires in ${daysRemaining}d`,
      colorClassName: 'bg-green-500',
      daysRemaining,
    };
  } catch (error) {
    console.error("Error parsing date:", expiryDate, error);
    return {
      status: 'unknown',
      label: 'Invalid Date',
      colorClassName: 'bg-gray-400',
      daysRemaining: null,
    };
  }
}
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '–';
    try {
        return format(new Date(dateString), 'dd-MM-yyyy');
    } catch {
        return 'Invalid Date';
    }
}
export const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '–';
  // Using fr-CI (Côte d'Ivoire) as a locale that uses CFA franc, but specifying currency is key.
  return new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF' }).format(value);
};
export function formatLastSeen(dateString: string | null | undefined): { text: string, isOnline: boolean } {
  if (!dateString) {
    return { text: 'Offline', isOnline: false };
  }
  try {
    const lastSeenDate = parseISO(dateString);
    const now = new Date();
    const diffMins = differenceInMinutes(now, lastSeenDate);
    if (diffMins < 5) {
      return { text: 'Active now', isOnline: true };
    }
    return { text: `Active ${formatDistanceToNow(lastSeenDate, { addSuffix: true })}`, isOnline: false };
  } catch (error) {
    return { text: 'Offline', isOnline: false };
  }
}
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), "MMM d, h:mm a");
  } catch {
    return 'Invalid Date';
  }
}
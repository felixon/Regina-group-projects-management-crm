import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Project } from '@shared/types';
import { getDomainStatus } from '@/lib/utils';
import { BellRing } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
interface UpcomingRenewalsProps {
  projects: Project[];
  isLoading: boolean;
}
export function UpcomingRenewals({ projects, isLoading }: UpcomingRenewalsProps) {
  const upcomingRenewals = useMemo(() => {
    if (!projects) return [];
    return projects
      .map(p => ({ project: p, status: getDomainStatus(p.dateExpirationDomaine) }))
      .filter(({ status }) => status.status === 'warning')
      .sort((a, b) => (a.status.daysRemaining ?? Infinity) - (b.status.daysRemaining ?? Infinity));
  }, [projects]);
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="h-5 w-5" />
          Upcoming Renewals
        </CardTitle>
        <CardDescription>Domains expiring in the next 90 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingRenewals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {upcomingRenewals.map(({ project, status }) => (
              <div key={project.id} className="flex items-center justify-between">
                <p className="text-sm font-medium truncate pr-2">{project.nomDuProjet}</p>
                <div className="flex items-center gap-2 text-sm flex-shrink-0">
                  <span className={`h-2 w-2 rounded-full ${status.colorClassName}`} />
                  <span>{status.label}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No upcoming renewals in the next 90 days. All good!</p>
        )}
      </CardContent>
    </Card>
  );
}
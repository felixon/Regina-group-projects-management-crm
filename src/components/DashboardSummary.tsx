import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Project } from '@shared/types';
import { Layers, Clock, DollarSign, Server } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { formatCurrency } from '@/lib/utils';
interface DashboardSummaryProps {
  projects: Project[];
  isLoading: boolean;
}
export function DashboardSummary({ projects, isLoading }: DashboardSummaryProps) {
  const summaryStats = useMemo(() => {
    if (!projects) return { totalProjects: 0, inProgress: 0, totalDomainCost: 0, totalHostingCost: 0 };
    const totalProjects = projects.length;
    const inProgress = projects.filter(p => {
      const status = p.status.toLowerCase();
      return !status.includes('terminé') && !status.includes('completed') && !status.includes('annulé') && !status.includes('cancelled');
    }).length;
    const totalDomainCost = projects.reduce((acc, p) => acc + (p.coutDomaine ?? 0), 0);
    const totalHostingCost = projects.reduce((acc, p) => acc + (p.coutHebergement ?? 0), 0);
    return { totalProjects, inProgress, totalDomainCost, totalHostingCost };
  }, [projects]);
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
        <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryStats.totalProjects}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summaryStats.inProgress}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Amount Spent On domains</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalDomainCost)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Amount Spent On Webhosting</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalHostingCost)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
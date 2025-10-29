import React, { useMemo, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUpDown, Trash2, Edit, FileSpreadsheet, X, Loader2 } from 'lucide-react';
import { Project } from '@shared/types';
import { useProjectsStore } from '@/hooks/use-projects-store';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useAuthStore } from '@/hooks/use-auth-store';
import { getDomainStatus, formatDate, formatCurrency, cn } from '@/lib/utils';
import { exportToExcel } from '@/lib/export';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from './DateRangePicker';
type SortKey = 'nomDuProjet' | 'status' | 'dateEnregistrementDomaine' | 'domainStatus' | 'totalCost' | 'dateDebut' | 'dateTermine';
export function ProjectDataTable() {
  const {
    projects, isLoading, openSheet, openDeleteDialog, highlightedProjectId,
    page, totalPages, setPage,
    filters, setFilters, resetFilters,
    sortKey, sortDirection, setSorting,
    fetchProjects, exportAllProjects, isExporting
  } = useProjectsStore();
  const columns = useSettingsStore(s => s.settings.columns);
  const fetchSettings = useSettingsStore(s => s.fetchSettings);
  const user = useAuthStore(s => s.user);
  useEffect(() => {
    fetchSettings();
    fetchProjects();
  }, [fetchSettings, fetchProjects]);
  const uniqueStatuses = useMemo(() => {
    // This can be improved by fetching statuses from the backend in the future
    const statuses = new Set(projects.map(p => p.status));
    return ['all', ...Array.from(statuses)];
  }, [projects]);
  const handleExportPage = () => {
    const headers: Record<string, string> = {
      nomDuProjet: 'Project Name', status: 'Status', dateEnregistrementDomaine: 'Domain Registration',
      dateExpirationDomaine: 'Domain Expiry', domainExpiryStatus: 'Domain Expiry Status', coutDomaine: 'Domain Cost',
      coutHebergement: 'Hosting Cost', totalCost: 'Total Cost', dateDebut: 'Start Date',
      dateTermine: 'Completed Date',
    };
    const visibleHeaders = Object.entries(headers).reduce((acc, [key, value]) => {
        const columnKey = key === 'domainExpiryStatus' ? 'domainExpiry' : key === 'totalCost' ? 'cost' : key;
        if (columns[columnKey as keyof typeof columns] || ['coutDomaine', 'coutHebergement'].includes(key)) {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, string>);
    const dataToExport = projects.map(p => ({
      nomDuProjet: p.nomDuProjet, status: p.status, dateEnregistrementDomaine: formatDate(p.dateEnregistrementDomaine),
      dateExpirationDomaine: formatDate(p.dateExpirationDomaine), domainExpiryStatus: getDomainStatus(p.dateExpirationDomaine).label,
      coutDomaine: p.coutDomaine ?? 0, coutHebergement: p.coutHebergement ?? 0,
      totalCost: (p.coutDomaine ?? 0) + (p.coutHebergement ?? 0), dateDebut: formatDate(p.dateDebut),
      dateTermine: formatDate(p.dateTermine),
    }));
    exportToExcel(dataToExport, visibleHeaders, `DomainDeck_Report_Page_${page}`);
  };
  const SortableHeader = ({ label, sortKey: key }: { label: string; sortKey: SortKey }) => (
    <TableHead>
      <Button variant="ghost" onClick={() => setSorting(key)} className="px-2 py-1">
        {label}
        <ArrowUpDown className={cn("ml-2 h-4 w-4", sortKey === key ? "text-foreground" : "text-muted-foreground")} />
      </Button>
    </TableHead>
  );
  const isSuperAdmin = user?.role === 'superadmin';
  const visibleColumnsConfig = { ...columns, actions: columns.actions };
  const visibleColumnCount = Object.values(visibleColumnsConfig).filter(Boolean).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Select value={filters.status} onValueChange={(status) => setFilters({ status })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status..." /></SelectTrigger>
          <SelectContent>{uniqueStatuses.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>)}</SelectContent>
        </Select>
        <DateRangePicker date={filters.expiryDate} onDateChange={(expiryDate) => setFilters({ expiryDate })} placeholder="Filter by expiry date" />
        <DateRangePicker date={filters.startDate} onDateChange={(startDate) => setFilters({ startDate })} placeholder="Filter by start date" />
        <DateRangePicker date={filters.completedDate} onDateChange={(completedDate) => setFilters({ completedDate })} placeholder="Filter by completion date" />
        <Button variant="ghost" onClick={resetFilters}><X className="mr-2 h-4 w-4" />Reset Filters</Button>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPage}><FileSpreadsheet className="mr-2 h-4 w-4" />Export Page</Button>
          <Button variant="outline" onClick={exportAllProjects} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
            Export All
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.nomDuProjet && <SortableHeader label="Project Name" sortKey="nomDuProjet" />}
              {columns.status && <SortableHeader label="Status" sortKey="status" />}
              {columns.domainRegistration && <SortableHeader label="Domain Registration" sortKey="dateEnregistrementDomaine" />}
              {columns.domainExpiry && <SortableHeader label="Domain Expiry" sortKey="domainStatus" />}
              {columns.cost && <SortableHeader label="Cost" sortKey="totalCost" />}
              {columns.startDate && <SortableHeader label="Start Date" sortKey="dateDebut" />}
              {columns.completedDate && <SortableHeader label="Completed Date" sortKey="dateTermine" />}
              {visibleColumnsConfig.actions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={visibleColumnCount}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : projects.length > 0 ? (
              projects.map((project) => {
                const domainStatus = getDomainStatus(project.dateExpirationDomaine);
                const totalCost = (project.coutDomaine ?? 0) + (project.coutHebergement ?? 0);
                return (
                  <TableRow key={project.id} className={cn('transition-colors duration-500', highlightedProjectId === project.id && 'bg-accent')}>
                    {columns.nomDuProjet && (<TableCell className="font-medium"><Button variant="link" onClick={() => openSheet(project.id)} className="p-0 h-auto font-medium text-foreground">{project.nomDuProjet}</Button></TableCell>)}
                    {columns.status && <TableCell><Badge variant="secondary">{project.status}</Badge></TableCell>}
                    {columns.domainRegistration && <TableCell>{formatDate(project.dateEnregistrementDomaine)}</TableCell>}
                    {columns.domainExpiry && (<TableCell><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${domainStatus.colorClassName}`} /><div className="flex flex-col"><span>{domainStatus.label}</span>{domainStatus.status !== 'unknown' && (<span className="text-xs text-muted-foreground">({formatDate(project.dateExpirationDomaine)})</span>)}</div></div></TableCell>)}
                    {columns.cost && <TableCell>{formatCurrency(totalCost > 0 ? totalCost : null)}</TableCell>}
                    {columns.startDate && <TableCell>{formatDate(project.dateDebut)}</TableCell>}
                    {columns.completedDate && <TableCell>{formatDate(project.dateTermine)}</TableCell>}
                    {visibleColumnsConfig.actions && (<TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openSheet(project.id)}><Edit className="mr-2 h-4 w-4" />{isSuperAdmin ? 'Edit' : 'View & Comment'}</DropdownMenuItem>{isSuperAdmin && (<DropdownMenuItem className="text-red-600" onClick={() => openDeleteDialog(project.id)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu></TableCell>)}
                  </TableRow>
                );
              })
            ) : (
              <TableRow><TableCell colSpan={visibleColumnCount} className="h-24 text-center">No projects found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (page > 1) setPage(page - 1); }} className={cn(page <= 1 && "pointer-events-none opacity-50")} />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink href="#" onClick={(e) => { e.preventDefault(); setPage(i + 1); }} isActive={page === i + 1}>
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages) setPage(page + 1); }} className={cn(page >= totalPages && "pointer-events-none opacity-50")} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
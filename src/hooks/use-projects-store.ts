import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Project, PaginatedProjectsResponse } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { exportToExcel } from '@/lib/export';
import { formatDate, getDomainStatus } from '@/lib/utils';
import { useSettingsStore } from './use-settings-store';
type SortKey = 'nomDuProjet' | 'status' | 'dateEnregistrementDomaine' | 'domainStatus' | 'totalCost' | 'dateDebut' | 'dateTermine';
type SortDirection = 'asc' | 'desc';
type Filters = {
  status: string;
  expiryDate: DateRange | undefined;
  startDate: DateRange | undefined;
  completedDate: DateRange | undefined;
};
type ProjectsState = {
  projects: Project[]; // Paginated list for the main table
  allProjects: Project[]; // Complete list for selectors/comboboxes
  isLoading: boolean;
  error: string | null;
  sheetOpen: boolean;
  deleteDialogOpen: boolean;
  selectedProjectId: string | null;
  isSubmitting: boolean;
  isExporting: boolean;
  highlightedProjectId: string | null;
  // Pagination & Sorting State
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sortKey: SortKey;
  sortDirection: SortDirection;
  filters: Filters;
};
type ProjectsActions = {
  fetchProjects: () => Promise<void>;
  fetchAllProjects: () => Promise<void>;
  openSheet: (projectId?: string) => void;
  closeSheet: () => void;
  openDeleteDialog: (projectId: string) => void;
  closeDeleteDialog: () => void;
  createProject: (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project | undefined>;
  updateProject: (projectId: string, projectData: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Project | undefined>;
  deleteProject: (projectId: string) => Promise<void>;
  setHighlightedProject: (projectId: string | null) => void;
  exportAllProjects: () => Promise<void>;
  // Pagination & Sorting Actions
  setPage: (page: number) => void;
  setSorting: (sortKey: SortKey) => void;
  setFilters: (newFilters: Partial<Filters>) => void;
  resetFilters: () => void;
};
const initialFilters: Filters = {
  status: 'all',
  expiryDate: undefined,
  startDate: undefined,
  completedDate: undefined,
};
export const useProjectsStore = create<ProjectsState & ProjectsActions>()(
  immer((set, get) => ({
    projects: [],
    allProjects: [],
    isLoading: true,
    error: null,
    sheetOpen: false,
    deleteDialogOpen: false,
    selectedProjectId: null,
    isSubmitting: false,
    isExporting: false,
    highlightedProjectId: null,
    page: 1,
    limit: 8,
    total: 0,
    totalPages: 1,
    sortKey: 'nomDuProjet',
    sortDirection: 'asc',
    filters: initialFilters,
    fetchProjects: async () => {
      set({ isLoading: true, error: null });
      const { page, limit, sortKey, sortDirection, filters } = get();
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortKey,
        sortDirection,
      });
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.expiryDate?.from) {
        params.append('expiryDateFrom', filters.expiryDate.from.toISOString());
        if (filters.expiryDate.to) params.append('expiryDateTo', filters.expiryDate.to.toISOString());
      }
      if (filters.startDate?.from) {
        params.append('startDateFrom', filters.startDate.from.toISOString());
        if (filters.startDate.to) params.append('startDateTo', filters.startDate.to.toISOString());
      }
      if (filters.completedDate?.from) {
        params.append('completedDateFrom', filters.completedDate.from.toISOString());
        if (filters.completedDate.to) params.append('completedDateTo', filters.completedDate.to.toISOString());
      }
      try {
        const data = await api<PaginatedProjectsResponse>(`/api/projects?${params.toString()}`);
        set({
          projects: data.projects,
          total: data.total,
          page: data.page,
          totalPages: data.totalPages,
          isLoading: false,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
        set({ error: errorMessage, isLoading: false });
        toast.error(errorMessage);
      }
    },
    fetchAllProjects: async () => {
      try {
        const allProjects = await api<Project[]>('/api/projects/export');
        set({ allProjects });
      } catch (error) {
        toast.error('Failed to load full project list for selection.');
      }
    },
    exportAllProjects: async () => {
      set({ isExporting: true });
      const { sortKey, sortDirection, filters } = get();
      const params = new URLSearchParams({ sortKey, sortDirection });
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.expiryDate?.from) {
        params.append('expiryDateFrom', filters.expiryDate.from.toISOString());
        if (filters.expiryDate.to) params.append('expiryDateTo', filters.expiryDate.to.toISOString());
      }
      if (filters.startDate?.from) {
        params.append('startDateFrom', filters.startDate.from.toISOString());
        if (filters.startDate.to) params.append('startDateTo', filters.startDate.to.toISOString());
      }
      if (filters.completedDate?.from) {
        params.append('completedDateFrom', filters.completedDate.from.toISOString());
        if (filters.completedDate.to) params.append('completedDateTo', filters.completedDate.to.toISOString());
      }
      try {
        const allProjects = await api<Project[]>(`/api/projects/export?${params.toString()}`);
        const columns = useSettingsStore.getState().settings.columns;
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
        const dataToExport = allProjects.map(p => ({
          nomDuProjet: p.nomDuProjet, status: p.status, dateEnregistrementDomaine: formatDate(p.dateEnregistrementDomaine),
          dateExpirationDomaine: formatDate(p.dateExpirationDomaine), domainExpiryStatus: getDomainStatus(p.dateExpirationDomaine).label,
          coutDomaine: p.coutDomaine ?? 0, coutHebergement: p.coutHebergement ?? 0,
          totalCost: (p.coutDomaine ?? 0) + (p.coutHebergement ?? 0), dateDebut: formatDate(p.dateDebut),
          dateTermine: formatDate(p.dateTermine),
        }));
        exportToExcel(dataToExport, visibleHeaders, `DomainDeck_Full_Report_${new Date().toISOString().split('T')[0]}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to export projects';
        toast.error(errorMessage);
      } finally {
        set({ isExporting: false });
      }
    },
    setPage: (page) => {
      set({ page });
      get().fetchProjects();
    },
    setSorting: (newSortKey) => {
      const { sortKey, sortDirection } = get();
      const newSortDirection = sortKey === newSortKey && sortDirection === 'asc' ? 'desc' : 'asc';
      set({ sortKey: newSortKey, sortDirection: newSortDirection, page: 1 });
      get().fetchProjects();
    },
    setFilters: (newFilters) => {
      set(state => {
        state.filters = { ...state.filters, ...newFilters };
        state.page = 1;
      });
      get().fetchProjects();
    },
    resetFilters: () => {
      set({ filters: initialFilters, page: 1 });
      get().fetchProjects();
    },
    openSheet: (projectId?: string) => {
      set({ sheetOpen: true, selectedProjectId: projectId || null });
    },
    closeSheet: () => {
      set({ sheetOpen: false, selectedProjectId: null });
    },
    openDeleteDialog: (projectId: string) => {
      set({ deleteDialogOpen: true, selectedProjectId: projectId });
    },
    closeDeleteDialog: () => {
      set({ deleteDialogOpen: false, selectedProjectId: null });
    },
    createProject: async (projectData) => {
      set({ isSubmitting: true });
      try {
        await api<Project>('/api/projects', {
          method: 'POST',
          body: JSON.stringify(projectData),
        });
        toast.success('Project created successfully!');
        get().closeSheet();
        get().fetchProjects(); // Refetch to show the new project
        get().fetchAllProjects();
        return undefined; // Simplified return
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
        toast.error(errorMessage);
      } finally {
        set({ isSubmitting: false });
      }
    },
    updateProject: async (projectId, projectData) => {
      set({ isSubmitting: true });
      try {
        await api<Project>(`/api/projects/${projectId}`, {
          method: 'PUT',
          body: JSON.stringify(projectData),
        });
        toast.success('Project updated successfully!');
        get().closeSheet();
        get().fetchProjects(); // Refetch to show updated data
        get().fetchAllProjects();
        return undefined; // Simplified return
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
        toast.error(errorMessage);
      } finally {
        set({ isSubmitting: false });
      }
    },
    deleteProject: async (projectId) => {
      set({ isSubmitting: true });
      try {
        await api(`/api/projects/${projectId}`, { method: 'DELETE' });
        toast.success('Project deleted successfully!');
        get().closeDeleteDialog();
        get().fetchProjects(); // Refetch to reflect deletion
        get().fetchAllProjects();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
        toast.error(errorMessage);
      } finally {
        set({ isSubmitting: false });
      }
    },
    setHighlightedProject: (projectId) => {
      set({ highlightedProjectId: projectId });
    },
  }))
);
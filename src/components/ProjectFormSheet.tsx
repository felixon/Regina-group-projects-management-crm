import React, { useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useProjectsStore } from '@/hooks/use-projects-store';
import { useAuthStore } from '@/hooks/use-auth-store';
import { CalendarIcon, Loader2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Project } from '@shared/types';
import { Separator } from './ui/separator';
import { CommentThread } from './CommentThread';
import { toast } from 'sonner';
const projectSchema = z.object({
  nomDuProjet: z.string().min(1, "Project name is required"),
  status: z.string().min(1, "Status is required"),
  dateEnregistrementDomaine: z.date().nullable().optional(),
  dateExpirationDomaine: z.date().nullable().optional(),
  dateDebut: z.date().nullable().optional(),
  dateTermine: z.date().nullable().optional(),
  coutDomaine: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().optional().nullable()
  ),
  coutHebergement: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().optional().nullable()
  ),
});
type ProjectFormData = z.infer<typeof projectSchema>;
export function ProjectFormSheet() {
  const sheetOpen = useProjectsStore(s => s.sheetOpen);
  const closeSheet = useProjectsStore(s => s.closeSheet);
  const selectedProjectId = useProjectsStore(s => s.selectedProjectId);
  const projects = useProjectsStore(s => s.projects);
  const createProject = useProjectsStore(s => s.createProject);
  const updateProject = useProjectsStore(s => s.updateProject);
  const isSubmitting = useProjectsStore(s => s.isSubmitting);
  const user = useAuthStore(s => s.user);
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const isEditMode = !!selectedProject;
  const isSuperAdmin = user?.role === 'superadmin';
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema) as Resolver<ProjectFormData>,
    defaultValues: {
      nomDuProjet: '',
      status: 'En cours',
      dateEnregistrementDomaine: null,
      dateExpirationDomaine: null,
      dateDebut: null,
      dateTermine: null,
      coutDomaine: undefined,
      coutHebergement: undefined,
    },
  });
  useEffect(() => {
    if (sheetOpen) {
      if (selectedProject) {
        form.reset({
          nomDuProjet: selectedProject.nomDuProjet,
          status: selectedProject.status,
          dateEnregistrementDomaine: selectedProject.dateEnregistrementDomaine ? new Date(selectedProject.dateEnregistrementDomaine) : null,
          dateExpirationDomaine: selectedProject.dateExpirationDomaine ? new Date(selectedProject.dateExpirationDomaine) : null,
          dateDebut: selectedProject.dateDebut ? new Date(selectedProject.dateDebut) : null,
          dateTermine: selectedProject.dateTermine ? new Date(selectedProject.dateTermine) : null,
          coutDomaine: selectedProject.coutDomaine,
          coutHebergement: selectedProject.coutHebergement,
        });
      } else {
        form.reset({
          nomDuProjet: '', status: 'En cours', dateEnregistrementDomaine: null, dateExpirationDomaine: null,
          dateDebut: null, dateTermine: null, coutDomaine: undefined, coutHebergement: undefined,
        });
      }
    }
  }, [selectedProject, form, sheetOpen]);
  const onSubmit = async (data: ProjectFormData) => {
    if (!isSuperAdmin) return;
    const projectData = {
        ...data,
        dateEnregistrementDomaine: data.dateEnregistrementDomaine ? data.dateEnregistrementDomaine.toISOString() : null,
        dateExpirationDomaine: data.dateExpirationDomaine ? data.dateExpirationDomaine.toISOString() : null,
        dateDebut: data.dateDebut ? data.dateDebut.toISOString() : null,
        dateTermine: data.dateTermine ? data.dateTermine.toISOString() : null,
        coutDomaine: data.coutDomaine ?? null,
        coutHebergement: data.coutHebergement ?? null,
    };
    if (isEditMode && selectedProjectId) {
      await updateProject(selectedProjectId, projectData);
    } else {
      await createProject(projectData as Omit<Project, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };
  const handleCopyProjectName = () => {
    if (selectedProject?.nomDuProjet) {
      navigator.clipboard.writeText(selectedProject.nomDuProjet);
      toast.success('Project name copied to clipboard!');
    }
  };
  const DatePickerField = ({ name, label }: { name: "dateEnregistrementDomaine" | "dateExpirationDomaine" | "dateDebut" | "dateTermine", label: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full pl-3 text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                  disabled={!isSuperAdmin}
                >
                  {field.value ? format(field.value as Date, "PPP") : <span>Pick a date</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value as Date | undefined}
                onSelect={field.onChange}
                initialFocus
                captionLayout="dropdown"
                fromYear={1990}
                toYear={new Date().getFullYear() + 10}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
  return (
    <Sheet open={sheetOpen} onOpenChange={(isOpen) => !isOpen && closeSheet()}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>{isEditMode ? (isSuperAdmin ? 'Edit Project' : 'Project Details') : 'Create Project'}</SheetTitle>
            {isEditMode && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyProjectName}>
                <Copy className="h-4 w-4" />
                <span className="sr-only">Copy project name</span>
              </Button>
            )}
          </div>
          <SheetDescription>
            {isEditMode ? 'Update the details of the project.' : 'Fill in the details for the new project.'}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto pr-6">
          <Form {...form}>
            <form id="project-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="nomDuProjet" render={({ field }) => (
                  <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} value={field.value ?? ''} disabled={!isSuperAdmin} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel><FormControl><Input {...field} value={field.value ?? ''} disabled={!isSuperAdmin} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePickerField name="dateEnregistrementDomaine" label="Domain Registration" />
                <DatePickerField name="dateExpirationDomaine" label="Domain Expiration" />
                <DatePickerField name="dateDebut" label="Start Date" />
                <DatePickerField name="dateTermine" label="Completed Date" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="coutDomaine" render={({ field }) => (
                  <FormItem><FormLabel>Domain Cost</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} disabled={!isSuperAdmin} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="coutHebergement" render={({ field }) => (
                  <FormItem><FormLabel>Hosting Cost</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} disabled={!isSuperAdmin} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </form>
          </Form>
          {isEditMode && selectedProjectId && (
            <div className="space-y-6 pt-6">
              <Separator />
              <h3 className="text-lg font-medium">Comments</h3>
              <CommentThread projectId={selectedProjectId} />
            </div>
          )}
        </div>
        <SheetFooter className="mt-auto pt-6">
          <Button type="button" variant="outline" onClick={closeSheet} disabled={isSubmitting}>Cancel</Button>
          {isSuperAdmin && (
            <Button type="submit" form="project-form" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Save Changes' : 'Create Project'}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
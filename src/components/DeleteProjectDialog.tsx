import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProjectsStore } from '@/hooks/use-projects-store';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
export function DeleteProjectDialog() {
  const deleteDialogOpen = useProjectsStore(s => s.deleteDialogOpen);
  const closeDeleteDialog = useProjectsStore(s => s.closeDeleteDialog);
  const selectedProjectId = useProjectsStore(s => s.selectedProjectId);
  const deleteProject = useProjectsStore(s => s.deleteProject);
  const isSubmitting = useProjectsStore(s => s.isSubmitting);
  const projects = useProjectsStore(s => s.projects);
  const projectToDelete = projects.find(p => p.id === selectedProjectId);
  const handleDelete = async () => {
    if (selectedProjectId) {
      await deleteProject(selectedProjectId);
    }
  };
  return (
    <AlertDialog open={deleteDialogOpen} onOpenChange={(isOpen) => !isOpen && closeDeleteDialog()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the project
            <span className="font-bold"> "{projectToDelete?.nomDuProjet}"</span> and remove its data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
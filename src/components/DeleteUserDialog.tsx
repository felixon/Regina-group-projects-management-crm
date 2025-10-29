import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useUsersStore } from '@/hooks/use-users-store';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';
export function DeleteUserDialog() {
  const { deleteUserOpen, closeDeleteDialog, selectedUser, isSubmitting, deleteUser } = useUsersStore();
  const handleDelete = () => {
    if (selectedUser) {
      deleteUser(selectedUser.id);
    }
  };
  return (
    <AlertDialog open={deleteUserOpen} onOpenChange={closeDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the user account for
            <span className="font-bold"> "{selectedUser?.name}"</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete User
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
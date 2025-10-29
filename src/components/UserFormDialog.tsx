import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUsersStore } from '@/hooks/use-users-store';
import { Loader2 } from 'lucide-react';
import { User } from '@shared/types';
const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().optional(),
  role: z.enum(['superadmin', 'collaborator']),
});
type UserFormData = z.infer<typeof userSchema>;
export function UserFormDialog() {
  const { userFormOpen, closeUserForm, selectedUser, isSubmitting, createUser, updateUser } = useUsersStore();
  const isEditMode = !!selectedUser;
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'collaborator',
    },
  });
  useEffect(() => {
    if (userFormOpen) {
      if (isEditMode) {
        form.reset({
          name: selectedUser.name,
          email: selectedUser.email,
          password: '',
          role: selectedUser.role,
        });
      } else {
        form.reset({ name: '', email: '', password: '', role: 'collaborator' });
      }
    }
  }, [userFormOpen, selectedUser, isEditMode, form]);
  const onSubmit = (data: UserFormData) => {
    const userData: Partial<Omit<User, 'id'>> = { ...data };
    if (!isEditMode && !userData.password) {
      form.setError('password', { type: 'manual', message: 'Password is required for new users' });
      return;
    }
    if (isEditMode && !userData.password) {
      delete userData.password;
    }
    if (isEditMode && selectedUser) {
      updateUser(selectedUser.id, userData);
    } else {
      createUser(userData as Omit<User, 'id'>);
    }
  };
  return (
    <Dialog open={userFormOpen} onOpenChange={closeUserForm}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the user details.' : 'Fill in the details for the new user.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" placeholder={isEditMode ? 'Leave blank to keep current' : ''} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="collaborator">Collaborator</SelectItem>
                    <SelectItem value="superadmin">Superadmin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeUserForm} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useUsersStore } from '@/hooks/use-users-store';
import { Loader2 } from 'lucide-react';
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  password: z.string().optional(),
});
type ProfileFormData = z.infer<typeof profileSchema>;
export function ProfileSettings() {
  const user = useAuthStore(s => s.user);
  const updateUser = useUsersStore(s => s.updateUser);
  const isSubmitting = useUsersStore(s => s.isSubmitting);
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      password: '',
    },
  });
  const onSubmit = (data: ProfileFormData) => {
    if (!user) return;
    const updateData: Partial<ProfileFormData> = { name: data.name };
    if (data.password) {
      updateData.password = data.password;
    }
    updateUser(user.id, updateData);
  };
  if (!user) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
        <CardDescription>Update your personal information and password.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Leave blank to keep current password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
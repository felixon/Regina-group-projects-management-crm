import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useCommentsStore } from '@/hooks/use-comments-store';
import { useProjectsStore } from '@/hooks/use-projects-store';
import { useUsersStore } from '@/hooks/use-users-store';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Card, CardContent } from './ui/card';
import { cn } from '@/lib/utils';
const commentSchema = z.object({
  text: z.string().min(1, 'Comment text is required'),
  projectId: z.string().optional().nullable(),
  visibleTo: z.array(z.string()).optional(),
});
type CommentFormData = z.infer<typeof commentSchema>;
export function CommentFormDialog() {
  const { dialogOpen, closeDialog, replyToComment, activeProjectId, isSubmitting, createComment } = useCommentsStore();
  const { allProjects, fetchAllProjects } = useProjectsStore();
  const { users, fetchUsers } = useUsersStore();
  const currentUser = useAuthStore(s => s.user);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const form = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { text: '', projectId: null, visibleTo: [] },
  });
  useEffect(() => {
    if (dialogOpen) {
      fetchUsers();
      fetchAllProjects();
      form.reset({
        text: '',
        projectId: activeProjectId || null,
        visibleTo: [],
      });
    }
  }, [dialogOpen, activeProjectId, form, fetchUsers, fetchAllProjects]);
  const onSubmit = (data: CommentFormData) => {
    createComment({
      text: data.text,
      parentId: replyToComment?.id || null,
      projectId: data.projectId || null,
      visibleTo: data.visibleTo || [],
    });
  };
  const availableUsers = users.filter(user => user.id !== currentUser?.id);
  return (
    <Dialog open={dialogOpen} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{replyToComment ? `Reply to ${replyToComment.authorName}` : 'Add Comment'}</DialogTitle>
          <DialogDescription>
            {replyToComment ? `Your reply will be nested under the original comment.` : 'Share your thoughts or updates.'}
          </DialogDescription>
        </DialogHeader>
        {replyToComment && (
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <p className="text-sm text-muted-foreground truncate">
                {replyToComment.text}
              </p>
            </CardContent>
          </Card>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="text" render={({ field }) => (
              <FormItem>
                <FormLabel>Comment</FormLabel>
                <FormControl><Textarea placeholder="Type your comment here..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {!replyToComment && (
              <>
                <FormField control={form.control} name="projectId" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Associate with Project (Optional)</FormLabel>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                          >
                            {field.value
                              ? allProjects.find(p => p.id === field.value)?.nomDuProjet
                              : "Select a project or leave for general comment"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search project..." />
                          <CommandList>
                            <CommandEmpty>No project found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                onSelect={() => {
                                  form.setValue("projectId", null);
                                  setComboboxOpen(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", field.value === null ? "opacity-100" : "opacity-0")} />
                                General Comment
                              </CommandItem>
                              {allProjects.map((project) => (
                                <CommandItem
                                  value={project.nomDuProjet}
                                  key={project.id}
                                  onSelect={() => {
                                    form.setValue("projectId", project.id);
                                    setComboboxOpen(false);
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", project.id === field.value ? "opacity-100" : "opacity-0")} />
                                  {project.nomDuProjet}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="visibleTo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visible To</FormLabel>
                    <p className="text-sm text-muted-foreground">If none selected, comment is visible to everyone.</p>
                    <ScrollArea className="h-32 rounded-md border p-4">
                      {availableUsers.map((user) => (
                        <FormField key={user.id} control={form.control} name="visibleTo" render={({ field }) => (
                          <FormItem key={user.id} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(user.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), user.id])
                                    : field.onChange(field.value?.filter((value) => value !== user.id));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{user.name}</FormLabel>
                          </FormItem>
                        )} />
                      ))}
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Post Comment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
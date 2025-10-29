import React, { useEffect, useMemo, useState } from 'react';
import { useCommentsStore } from '@/hooks/use-comments-store';
import { useProjectsStore } from '@/hooks/use-projects-store';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, MessageSquareReply } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
export function ActivityPage() {
  const { comments, isLoading, fetchComments, openDialog, markAsRead } = useCommentsStore();
  const { projects, fetchProjects } = useProjectsStore();
  const currentUser = useAuthStore(s => s.user);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  useEffect(() => {
    fetchComments(); // Fetch all comments
    fetchProjects();
  }, [fetchComments, fetchProjects]);
  const projectMap = useMemo(() => {
    return projects.reduce((acc, p) => {
      acc[p.id] = p.nomDuProjet;
      return acc;
    }, {} as Record<string, string>);
  }, [projects]);
  const filteredAndSortedComments = useMemo(() => {
    const filtered =
      selectedProjectId === 'all'
        ? comments
        : comments.filter(c => c.projectId === selectedProjectId);
    return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [comments, selectedProjectId]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Feed</h1>
                  <p className="text-muted-foreground">A log of all comments and replies you have access to.</p>
                </div>
              </div>
              <div className="w-full sm:w-64">
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects & General</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nomDuProjet}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <main className="space-y-6">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                  <CardContent><Skeleton className="h-10 w-full" /></CardContent>
                </Card>
              ))
            ) : filteredAndSortedComments.length > 0 ? (
              filteredAndSortedComments.map(comment => {
                const isRead = currentUser ? comment.readBy.includes(currentUser.id) : false;
                return (
                  <Card
                    key={comment.id}
                    className={cn(
                      "transition-colors",
                      !isRead && "bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer"
                    )}
                    onClick={() => !isRead && markAsRead(comment.id, currentUser?.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={cn("h-2.5 w-2.5 rounded-full", !isRead ? "bg-blue-500" : "bg-transparent")} />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{comment.authorName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base">{comment.authorName}</CardTitle>
                            {comment.projectId && projectMap[comment.projectId] && (
                              <Badge variant="secondary">{projectMap[comment.projectId]}</Badge>
                            )}
                            {comment.parentId && <Badge variant="outline">Reply</Badge>}
                          </div>
                          <CardDescription>
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">{comment.text}</p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDialog({ replyTo: comment, projectId: comment.projectId || undefined });
                        }}
                        disabled={!isRead}
                        title={!isRead ? "Click the card to mark as read before replying" : "Reply"}
                      >
                        <MessageSquareReply className="mr-2 h-4 w-4" />
                        Reply
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>{selectedProjectId === 'all' ? 'No activity yet.' : 'No comments found for this project.'}</p>
                <p>{selectedProjectId === 'all' ? 'Start a conversation by adding a comment.' : 'Be the first to comment on this project.'}</p>
              </div>
            )}
          </main>
        </div>
      </div>
      <Toaster richColors closeButton />
    </div>
  );
}
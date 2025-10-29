import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { useProjectsStore } from '@/hooks/use-projects-store';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useCommentsStore } from '@/hooks/use-comments-store';
import { ProjectDataTable } from '@/components/ProjectDataTable';
import { ProjectFormSheet } from '@/components/ProjectFormSheet';
import { DeleteProjectDialog } from '@/components/DeleteProjectDialog';
import { DashboardSummary } from '@/components/DashboardSummary';
import { UpcomingRenewals } from '@/components/UpcomingRenewals';
import { PlusCircle, Settings, Bell, LogOut, MessageSquare, MessageCircle, User } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { getDomainStatus } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from '@/lib/api-client';
import { Comment } from '@shared/types';
import { MessagingSystem } from '@/components/MessagingSystem';
export function HomePage() {
  const fetchProjects = useProjectsStore(s => s.fetchProjects);
  const projects = useProjectsStore(s => s.projects);
  const allProjects = useProjectsStore(s => s.allProjects);
  const fetchAllProjects = useProjectsStore(s => s.fetchAllProjects);
  const isLoadingProjects = useProjectsStore(s => s.isLoading);
  const openSheet = useProjectsStore(s => s.openSheet);
  const setHighlightedProject = useProjectsStore(s => s.setHighlightedProject);
  const appName = useSettingsStore(s => s.settings.appName);
  const appLogoUrl = useSettingsStore(s => s.settings.appLogoUrl);
  const fetchSettings = useSettingsStore(s => s.fetchSettings);
  const isLoadingSettings = useSettingsStore(s => s.isLoading);
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const openCommentDialog = useCommentsStore(s => s.openDialog);
  const [commentNotifications, setCommentNotifications] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    fetchProjects();
    fetchAllProjects();
    fetchSettings();
    const fetchCommentNotifications = async () => {
      try {
        const comments = await api<Comment[]>('/api/notifications/comments');
        // A simple count for now. More complex logic (e.g., "last viewed") could be added.
        setCommentNotifications(comments.length);
      } catch (error) {
        console.error("Failed to fetch comment notifications:", error);
      }
    };
    fetchCommentNotifications();
  }, [fetchProjects, fetchAllProjects, fetchSettings]);
  useEffect(() => {
    const projectIdFromUrl = searchParams.get('projectId');
    if (projectIdFromUrl && !isLoadingProjects && projects.length > 0) {
      const projectExists = projects.some(p => p.id === projectIdFromUrl);
      if (projectExists) {
        openSheet(projectIdFromUrl);
        setHighlightedProject(projectIdFromUrl);
        setTimeout(() => {
          setHighlightedProject(null);
          // Clean up URL
          searchParams.delete('projectId');
          setSearchParams(searchParams, { replace: true });
        }, 2000); // Highlight for 2 seconds
      }
    }
  }, [projects, isLoadingProjects, searchParams, setSearchParams, openSheet, setHighlightedProject]);
  const isLoading = isLoadingProjects || isLoadingSettings;
  const upcomingRenewalsCount = useMemo(() => {
    if (!allProjects) return 0;
    return allProjects.filter(p => getDomainStatus(p.dateExpirationDomaine).status === 'warning').length;
  }, [allProjects]);
  const userInitials = user?.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="flex items-center justify-between mb-8">
            {isLoadingSettings ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {appLogoUrl && (
                  <img src={appLogoUrl} alt="App Logo" className="h-12 w-12 object-contain" />
                )}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{appName}</h1>
                  <p className="text-muted-foreground">Project & Domain Management CRM</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild className="relative">
                <Link to="/activity">
                  <MessageSquare className="h-4 w-4" />
                  {commentNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                      {commentNotifications}
                    </span>
                  )}
                  <span className="sr-only">Activity Feed</span>
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild className="relative">
                <Link to="/notifications">
                  <Bell className="h-4 w-4" />
                  {upcomingRenewalsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {upcomingRenewalsCount}
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Link>
              </Button>
              {user && (
                <Button onClick={() => openCommentDialog()}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Add Comment
                </Button>
              )}
              {user?.role === 'superadmin' && (
                <Button onClick={() => openSheet()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === 'superadmin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Admin Settings</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="space-y-8">
            <div>
              <DashboardSummary projects={allProjects} isLoading={isLoading} />
            </div>
            <div>
              <UpcomingRenewals projects={allProjects} isLoading={isLoading} />
            </div>
            <ProjectDataTable />
          </main>
        </div>
      </div>
      <footer className="text-center py-6 text-sm text-muted-foreground">
        Built with ❤️ at Cloudflare
      </footer>
      {/* Global components */}
      <ProjectFormSheet />
      <DeleteProjectDialog />
      <MessagingSystem />
      <Toaster richColors closeButton />
    </div>
  );
}
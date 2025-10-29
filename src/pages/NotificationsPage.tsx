import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useProjectsStore } from '@/hooks/use-projects-store';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { getDomainStatus } from '@/lib/utils';
import { NotificationCard, type Notification } from '@/components/NotificationCard';
import { ArrowLeft, BellRing, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
// The useNotificationsStore is used within NotificationCard, so no direct import is needed here.
export function NotificationsPage() {
  const allProjects = useProjectsStore(s => s.allProjects);
  const fetchAllProjects = useProjectsStore(s => s.fetchAllProjects);
  const reminderSettings = useSettingsStore(s => s.settings.reminder) || { defaultEmails: '' };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  useEffect(() => {
    fetchAllProjects();
  }, [fetchAllProjects]);
  const upcomingRenewals = useMemo(() => {
    return allProjects
      .map(p => ({ project: p, status: getDomainStatus(p.dateExpirationDomaine) }))
      .filter(({ status }) => status.status === 'warning')
      .sort((a, b) => (a.status.daysRemaining ?? Infinity) - (b.status.daysRemaining ?? Infinity));
  }, [allProjects]);
  const generateReminders = () => {
    const generated: Notification[] = upcomingRenewals.map(({ project, status }) => {
      const expiryDate = new Date(project.dateExpirationDomaine!).toLocaleDateString();
      const subject = `Domain Renewal Reminder: ${project.nomDuProjet}`;
      const body = `
Hello,
This is a reminder that the domain for the project "${project.nomDuProjet}" is set to expire soon.
Expiry Date: ${expiryDate}
Days Remaining: ${status.daysRemaining}
Please take the necessary steps to renew the domain to avoid any service interruption.
Thank you,
DomainDeck CRM
      `.trim();
      return {
        projectId: project.id,
        projectName: project.nomDuProjet,
        expiryDate: project.dateExpirationDomaine!,
        daysRemaining: status.daysRemaining!,
        recipientEmails: reminderSettings.defaultEmails || '',
        emailSubject: subject,
        emailBody: body,
      };
    });
    setNotifications(generated);
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <div className="flex items-center gap-3">
              <BellRing className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Notification Center</h1>
                <p className="text-muted-foreground">Simulated reminders for upcoming domain renewals.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center text-center p-6 border rounded-lg mb-8 bg-card">
            <p className="text-muted-foreground mb-4">
              This tool generates pre-formatted email reminders for domains expiring in the next 90 days.
              You can then send them using the configured SMTP settings.
            </p>
            <Button onClick={generateReminders} disabled={upcomingRenewals.length === 0}>
              <Bot className="mr-2 h-4 w-4" />
              Generate {upcomingRenewals.length} Reminder(s)
            </Button>
          </div>
          <main className="space-y-6">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationCard key={notification.projectId} notification={notification} />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No reminders generated yet.</p>
                <p>Click the button above to check for upcoming renewals.</p>
              </div>
            )}
          </main>
        </div>
      </div>
      <Toaster richColors closeButton />
    </div>
  );
}
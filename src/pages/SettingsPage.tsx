import React, { useEffect, useState } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/hooks/use-settings-store';
import { useAuthStore } from '@/hooks/use-auth-store';
import { AppSettings, TableColumn, tableColumns, ColumnVisibility } from '@shared/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { UserManagement } from '@/components/UserManagement';
import { UserFormDialog } from '@/components/UserFormDialog';
import { DeleteUserDialog } from '@/components/DeleteUserDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
const reminderSchema = z.object({
  defaultEmails: z.string().min(1, 'At least one email is required'),
  startMonthsBefore: z.coerce.number().min(1, 'Must be at least 1 month'),
  frequency: z.enum(['weekly', 'daily']),
});
const smtpSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1, 'Port is required'),
  user: z.string().min(1, 'Username is required'),
  pass: z.string(),
  secure: z.boolean(),
});
const columnVisibilitySchema = z.custom<ColumnVisibility>((val) => {
    return typeof val === 'object' && val !== null && tableColumns.every(col => typeof (val as any)[col] === 'boolean');
});
const settingsSchema = z.object({
  appName: z.string().min(1, 'Application name is required'),
  appLogoUrl: z.string().url().or(z.literal('')).nullable(),
  smtp: smtpSchema,
  columns: columnVisibilitySchema,
  reminder: reminderSchema,
});
type SettingsFormData = z.infer<typeof settingsSchema>;
const columnLabels: Record<TableColumn, string> = {
  nomDuProjet: 'Project Name',
  status: 'Status',
  domainExpiry: 'Domain Expiry',
  domainRegistration: 'Domain Registration',
  cost: 'Cost',
  startDate: 'Start Date',
  completedDate: 'Completed Date',
  actions: 'Actions',
};
export function SettingsPage() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [testEmail, setTestEmail] = useState('');
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      navigate('/');
    }
  }, [user, navigate]);
  const settings = useSettingsStore(s => s.settings);
  const isLoading = useSettingsStore(s => s.isLoading);
  const isSubmitting = useSettingsStore(s => s.isSubmitting);
  const isTestingSmtp = useSettingsStore(s => s.isTestingSmtp);
  const fetchSettings = useSettingsStore(s => s.fetchSettings);
  const updateSettings = useSettingsStore(s => s.updateSettings);
  const setColumnVisibility = useSettingsStore(s => s.setColumnVisibility);
  const testSmtpSettings = useSettingsStore(s => s.testSmtpSettings);
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema) as Resolver<SettingsFormData>,
    defaultValues: settings,
  });
  useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchSettings();
    }
  }, [fetchSettings, user]);
  useEffect(() => {
    form.reset(settings);
  }, [settings, form]);
  const onSubmit = (data: SettingsFormData) => {
    const settingsToUpdate: AppSettings = {
        ...data,
        appLogoUrl: data.appLogoUrl || null,
    };
    updateSettings(settingsToUpdate);
  };
  const handleTestSmtp = () => {
    const smtpSettings = form.getValues('smtp');
    testSmtpSettings(smtpSettings, testEmail);
  };
  if (user?.role !== 'superadmin') {
    return null;
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4">
        <div className="max-w-4xl mx-auto py-8 md:py-10 lg:py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-8">
            <Card><CardHeader><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-2/3 mt-2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-2/3 mt-2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Settings</h1>
            <p className="text-muted-foreground">Manage your application settings and preferences.</p>
          </div>
          <div className="space-y-12">
            <UserManagement />
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Branding</CardTitle>
                    <CardDescription>Customize the name and logo of the application.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="appName" render={({ field }) => (
                      <FormItem><FormLabel>Application Name</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="appLogoUrl" render={({ field }) => (
                      <FormItem><FormLabel>Logo URL</FormLabel><FormControl><Input placeholder="https://example.com/logo.png" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Reminder Configuration</CardTitle>
                    <CardDescription>Set default parameters for domain expiry reminders.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="reminder.defaultEmails" render={({ field }) => (
                      <FormItem><FormLabel>Default Recipient Emails</FormLabel><FormControl><Textarea placeholder="Comma-separated emails" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="reminder.startMonthsBefore" render={({ field }) => (
                        <FormItem><FormLabel>Start Reminders (Months Before)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="reminder.frequency" render={({ field }) => (
                        <FormItem><FormLabel>Reminder Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Column Visibility</CardTitle>
                    <CardDescription>Choose which columns to display on the project dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {tableColumns.map((column) => (
                      <div key={column} className="flex items-center space-x-2">
                        <Switch
                          id={column}
                          checked={settings.columns?.[column] ?? false}
                          onCheckedChange={(checked) => setColumnVisibility(column, checked)}
                          disabled={column === 'nomDuProjet' || column === 'actions'}
                        />
                        <label htmlFor={column} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {columnLabels[column]}
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>SMTP Configuration</CardTitle>
                    <CardDescription>Configure your email server for sending domain expiry reminders. This feature is not yet active.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="smtp.host" render={({ field }) => (
                        <FormItem><FormLabel>Host</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="smtp.port" render={({ field }) => (
                        <FormItem><FormLabel>Port</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="smtp.user" render={({ field }) => (
                      <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="smtp.pass" render={({ field }) => (
                      <FormItem><FormLabel>Password</FormLabel><FormControl><Input type="password" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="smtp.secure" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5"><FormLabel>Use SSL/TLS</FormLabel></div>
                        <FormControl><Switch checked={field.value ?? false} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    <div className="border-t pt-4 space-y-2">
                      <h4 className="text-sm font-medium">Test SMTP Settings</h4>
                      <div className="flex items-center gap-2">
                        <Input placeholder="Enter your email for testing" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
                        <Button type="button" variant="secondary" onClick={handleTestSmtp} disabled={isTestingSmtp || !testEmail}>
                          {isTestingSmtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Send Test Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Settings
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
      <UserFormDialog />
      <DeleteUserDialog />
      <Toaster richColors closeButton />
    </div>
  );
}
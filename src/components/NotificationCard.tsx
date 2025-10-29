import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from 'lucide-react';
import { useNotificationsStore } from '@/hooks/use-notifications-store';
export interface Notification {
  projectId: string;
  projectName: string;
  expiryDate: string;
  daysRemaining: number;
  recipientEmails: string;
  emailSubject: string;
  emailBody: string;
}
interface NotificationCardProps {
  notification: Notification;
}
export function NotificationCard({ notification }: NotificationCardProps) {
  const sendReminder = useNotificationsStore(s => s.sendReminder);
  const isSending = useNotificationsStore(s => s.isSending[notification.projectId] || false);
  const handleSend = () => {
    sendReminder(notification);
  };
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle>{notification.projectName}</CardTitle>
            <CardDescription>
              Expires in {notification.daysRemaining} days on {new Date(notification.expiryDate).toLocaleDateString()}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleSend} className="shrink-0" disabled={isSending}>
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {isSending ? 'Sending...' : 'Send Reminder'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`recipients-${notification.projectId}`}>Recipient(s)</Label>
          <Input id={`recipients-${notification.projectId}`} readOnly value={notification.recipientEmails || 'No emails configured'} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`subject-${notification.projectId}`}>Email Subject</Label>
          <Input id={`subject-${notification.projectId}`} readOnly value={notification.emailSubject} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`body-${notification.projectId}`}>Email Body</Label>
          <Textarea id={`body-${notification.projectId}`} readOnly value={notification.emailBody} className="h-48 font-mono text-xs" />
        </div>
      </CardContent>
    </Card>
  );
}
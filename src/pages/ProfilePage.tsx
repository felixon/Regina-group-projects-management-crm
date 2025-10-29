import React from 'react';
import { ProfileSettings } from '@/components/ProfileSettings';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
export function ProfilePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="mb-8">
            <Button variant="ghost" asChild className="mb-4">
              <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">My Profile</h1>
            <p className="text-muted-foreground">Manage your personal information and password.</p>
          </div>
          <ProfileSettings />
        </div>
      </div>
      <Toaster richColors closeButton />
    </div>
  );
}
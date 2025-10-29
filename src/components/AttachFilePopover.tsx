import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paperclip } from 'lucide-react';
import { toast } from 'sonner';
interface AttachFilePopoverProps {
  onFileLinkSubmit: (fileLink: string) => void;
}
export function AttachFilePopover({ onFileLinkSubmit }: AttachFilePopoverProps) {
  const [link, setLink] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!link.trim()) {
      toast.error('Please enter a valid URL.');
      return;
    }
    try {
      // Basic URL validation
      new URL(link);
      onFileLinkSubmit(`File attached: ${link}`);
      setLink('');
      setIsOpen(false);
    } catch (_) {
      toast.error('Invalid URL format. Please include http/https.');
    }
  };
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Attach file</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Attach File Link</h4>
            <p className="text-sm text-muted-foreground">
              Paste a URL to a file (e.g., Google Drive, Dropbox) to share it.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file-link">File URL</Label>
            <Input
              id="file-link"
              placeholder="https://example.com/file.pdf"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
          <Button type="submit">Attach Link</Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
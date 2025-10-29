import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectsStore } from '@/hooks/use-projects-store';
import { Paperclip, Link as LinkIcon, Folder, Send } from 'lucide-react';
import { toast } from 'sonner';
interface AttachmentPopoverProps {
  onProjectSelect: (projectLink: string) => void;
  onFileLinkSubmit: (fileLink: string) => void;
}
export function AttachmentPopover({ onProjectSelect, onFileLinkSubmit }: AttachmentPopoverProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [fileLink, setFileLink] = useState('');
  const projects = useProjectsStore(s => s.projects);
  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.nomDuProjet.toLowerCase().includes(search.toLowerCase()));
  }, [projects, search]);
  const handleProjectClick = (projectId: string) => {
    const projectLink = `${window.location.origin}/?projectId=${projectId}`;
    onProjectSelect(projectLink);
    setOpen(false);
  };
  const handleFileLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileLink.trim()) return;
    try {
      new URL(fileLink); // Validate URL
      onFileLinkSubmit(fileLink);
      setFileLink('');
      setOpen(false);
    } catch {
      toast.error('Please enter a valid URL.');
    }
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Attach</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <Tabs defaultValue="project" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="project"><Folder className="mr-2 h-4 w-4" />Project</TabsTrigger>
            <TabsTrigger value="file"><LinkIcon className="mr-2 h-4 w-4" />File Link</TabsTrigger>
          </TabsList>
          <TabsContent value="project">
            <div className="space-y-2 pt-2">
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ScrollArea className="h-48">
                <div className="space-y-1 p-1">
                  {filteredProjects.map(p => (
                    <Button
                      key={p.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => handleProjectClick(p.id)}
                    >
                      {p.nomDuProjet}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          <TabsContent value="file">
            <form onSubmit={handleFileLink} className="space-y-2 pt-2">
              <p className="text-sm text-muted-foreground">Paste a link to a file (e.g., Google Drive, Dropbox).</p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="https://..."
                  value={fileLink}
                  onChange={(e) => setFileLink(e.target.value)}
                />
                <Button type="submit" size="icon" variant="secondary">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
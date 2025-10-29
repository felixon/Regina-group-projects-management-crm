import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useProjectsStore } from '@/hooks/use-projects-store';
import { Paperclip, Search } from 'lucide-react';
interface AttachProjectPopoverProps {
  onProjectSelect: (projectLink: string) => void;
}
export function AttachProjectPopover({ onProjectSelect }: AttachProjectPopoverProps) {
  const projects = useProjectsStore(s => s.projects);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.nomDuProjet.toLowerCase().includes(search.toLowerCase()));
  }, [projects, search]);
  const handleSelect = (projectId: string, projectName: string) => {
    const projectUrl = `${window.location.origin}/?projectId=${projectId}`;
    onProjectSelect(`Check out this project: ${projectName}\n${projectUrl}`);
    setIsOpen(false);
  };
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Attach project</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          {filteredProjects.length > 0 ? (
            filteredProjects.map(project => (
              <button
                key={project.id}
                onClick={() => handleSelect(project.id, project.nomDuProjet)}
                className="w-full text-left p-2 text-sm hover:bg-accent"
              >
                {project.nomDuProjet}
              </button>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">No projects found.</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
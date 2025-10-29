import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessagingStore } from '@/hooks/use-messaging-store';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useUsersStore } from '@/hooks/use-users-store';
import { MessageSquare, Send, ArrowLeft, Loader2, Search, UserPlus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn, formatLastSeen, formatDateTime } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import { AttachmentPopover } from './AttachmentPopover';
import { User } from '@shared/types';
export function MessagingSystem() {
  const {
    isSheetOpen, openSheet, closeSheet, conversations, fetchConversations, isLoadingConversations,
    activeConversation, setActiveConversation, currentThread, isLoadingThread, sendMessage, isSending,
    unreadCount, fetchUnreadCount, messageText, setMessageText
  } = useMessagingStore();
  const currentUser = useAuthStore(s => s.user);
  const { users, fetchUsers } = useUsersStore();
  const [viewMode, setViewMode] = useState<'conversations' | 'newMessage'>('conversations');
  const [searchUser, setSearchUser] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Initial fetch for the badge count
    fetchUnreadCount();
  }, [fetchUnreadCount]);
  useEffect(() => {
    if (isSheetOpen) {
      fetchConversations();
      if (viewMode === 'newMessage') {
        fetchUsers();
      }
    } else {
      // Reset view when sheet closes
      setViewMode('conversations');
    }
  }, [isSheetOpen, fetchConversations, viewMode, fetchUsers]);
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [currentThread]);
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };
  const handleProjectSelect = (projectLink: string) => {
    setMessageText(messageText ? `${messageText}\n${projectLink}` : projectLink);
  };
  const handleFileLinkSubmit = (fileLink: string) => {
    setMessageText(messageText ? `${messageText}\n${fileLink}` : fileLink);
  };
  const handleUserSelect = (user: Omit<User, 'password'>) => {
    // Check if a conversation already exists
    const existingConvo = conversations.find(c => c.otherUser.id === user.id);
    if (existingConvo) {
      setActiveConversation(existingConvo);
    } else {
      // Create a transient conversation object
      setActiveConversation({ otherUser: user });
    }
    setViewMode('conversations');
    setSearchUser('');
  };
  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.id !== currentUser?.id &&
      u.name.toLowerCase().includes(searchUser.toLowerCase())
    );
  }, [users, searchUser, currentUser]);
  const handleBack = () => {
    if (activeConversation) {
      setActiveConversation(null);
    } else if (viewMode === 'newMessage') {
      setViewMode('conversations');
    }
  };
  return (
    <>
      <Button
        onClick={openSheet}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg"
        size="icon"
      >
        <MessageSquare className="h-8 w-8" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white">
            {unreadCount}
          </span>
        )}
        <span className="sr-only">Open Messages</span>
      </Button>
      <Sheet open={isSheetOpen} onOpenChange={(isOpen) => !isOpen && closeSheet()}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-6 border-b">
            {activeConversation || viewMode === 'newMessage' ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="-ml-2" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {activeConversation ? (
                  <>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{activeConversation.otherUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle>{activeConversation.otherUser.name}</SheetTitle>
                      <p className="text-xs text-muted-foreground">{formatLastSeen(activeConversation.otherUser.lastSeen).text}</p>
                    </div>
                  </>
                ) : (
                  <SheetTitle>New Message</SheetTitle>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <SheetTitle>Messages</SheetTitle>
                  <SheetDescription>Your recent conversations.</SheetDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setViewMode('newMessage')}>
                  <UserPlus className="h-5 w-5" />
                  <span className="sr-only">New Message</span>
                </Button>
              </div>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            {activeConversation ? (
              <div className="h-full flex flex-col">
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  {isLoadingThread ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-3/4" />
                      <Skeleton className="h-10 w-3/4 ml-auto" />
                      <Skeleton className="h-10 w-3/4" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentThread.map(msg => (
                        <div key={msg.id} className={cn("flex w-full", msg.senderId === currentUser?.id ? "justify-end" : "justify-start")}>
                          <div className="flex flex-col gap-1 max-w-xs">
                            <div className={cn(
                              "rounded-lg p-3",
                              msg.senderId === currentUser?.id
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-muted rounded-bl-none"
                            )}>
                              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            <p className={cn("text-xs text-muted-foreground px-1", msg.senderId === currentUser?.id ? "text-right" : "text-left")}>
                              {formatDateTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
                  <AttachmentPopover
                    onProjectSelect={handleProjectSelect}
                    onFileLinkSubmit={handleFileLinkSubmit}
                  />
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    autoComplete="off"
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={isSending}>
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </form>
              </div>
            ) : viewMode === 'newMessage' ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {filteredUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full text-left flex items-center gap-3 p-4 border-b transition-colors hover:bg-accent"
                    >
                      <Avatar>
                        <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="font-semibold truncate">{user.name}</p>
                    </button>
                  ))}
                </ScrollArea>
              </div>
            ) : (
              <ScrollArea className="h-full">
                {isLoadingConversations ? (
                  <div className="p-4 space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : conversations.length > 0 ? (
                  conversations.map(convo => {
                    const lastSeenInfo = formatLastSeen(convo.otherUser.lastSeen);
                    return (
                      <button
                        key={convo.otherUser.id}
                        onClick={() => setActiveConversation(convo)}
                        className="w-full text-left flex items-center gap-3 p-4 border-b transition-colors hover:bg-accent"
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback>{convo.otherUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {lastSeenInfo.isOnline && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold truncate">{convo.otherUser.name}</p>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(convo.lastMessage.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-sm text-muted-foreground truncate">{convo.lastMessage.text}</p>
                            {convo.unreadCount > 0 && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                {convo.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center p-12 text-muted-foreground">
                    <p>No conversations yet.</p>
                    <p>Click the <UserPlus className="inline h-4 w-4" /> icon to start a new chat.</p>
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
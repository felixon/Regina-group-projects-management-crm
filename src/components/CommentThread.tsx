import React, { useEffect, useMemo } from 'react';
import { useCommentsStore } from '@/hooks/use-comments-store';
import { useAuthStore } from '@/hooks/use-auth-store';
import { Comment } from '@shared/types';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { MessageSquareReply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
interface CommentThreadProps {
  projectId: string | null;
}
interface CommentNode extends Comment {
  children: CommentNode[];
}
const CommentItem = ({ comment, level = 0 }: { comment: CommentNode; level?: number }) => {
  const openDialog = useCommentsStore(s => s.openDialog);
  const markAsRead = useCommentsStore(s => s.markAsRead);
  const currentUser = useAuthStore(s => s.user);
  const isRead = currentUser ? comment.readBy.includes(currentUser.id) : false;
  const handleRead = () => {
    if (!isRead && currentUser) {
      markAsRead(comment.id, currentUser.id);
    }
  };
  return (
    <div style={{ marginLeft: `${level * 1.5}rem` }} className="border-l-2 border-muted pl-4">
      <div
        className={cn(
          "flex items-start gap-4 py-4 rounded-md transition-colors",
          !isRead && "bg-blue-500/5 hover:bg-blue-500/10 cursor-pointer"
        )}
        onClick={handleRead}
      >
        <div className={cn("h-2.5 w-2.5 rounded-full self-center", !isRead ? "bg-blue-500" : "bg-transparent")} />
        <Avatar className="h-8 w-8">
          <AvatarFallback>{comment.authorName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{comment.authorName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{comment.text}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 -ml-2"
            onClick={(e) => {
              e.stopPropagation(); // Prevent handleRead from firing
              openDialog({ replyTo: comment, projectId: comment.projectId || undefined });
            }}
            disabled={!isRead}
            title={!isRead ? "Click the comment to mark as read before replying" : "Reply"}
          >
            <MessageSquareReply className="mr-2 h-4 w-4" />
            Reply
          </Button>
        </div>
      </div>
      {comment.children.map(child => (
        <CommentItem key={child.id} comment={child} level={level + 1} />
      ))}
    </div>
  );
};
export function CommentThread({ projectId }: CommentThreadProps) {
  const { comments, isLoading, fetchComments } = useCommentsStore();
  useEffect(() => {
    if (projectId) {
      fetchComments(projectId);
    }
  }, [projectId, fetchComments]);
  const commentTree = useMemo(() => {
    const map: Record<string, CommentNode> = {};
    const roots: CommentNode[] = [];
    comments.forEach(comment => {
      map[comment.id] = { ...comment, children: [] };
    });
    comments.forEach(comment => {
      const node = map[comment.id];
      if (comment.parentId && map[comment.parentId]) {
        map[comment.parentId].children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [comments]);
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }
  return (
    <div>
      {commentTree.length > 0 ? (
        commentTree.map(comment => <CommentItem key={comment.id} comment={comment} />)
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
      )}
    </div>
  );
}
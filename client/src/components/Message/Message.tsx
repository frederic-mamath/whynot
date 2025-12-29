import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { cn } from '@/lib/utils';

interface MessageProps {
  message: {
    id: number;
    content: string;
    createdAt: Date;
    user: {
      id: number;
      email: string;
      firstname?: string | null;
      lastname?: string | null;
    };
  };
  currentUserId: number;
}

export function Message({ message, currentUserId }: MessageProps) {
  const isOwnMessage = message.user.id === currentUserId;
  
  // Generate display name and initials
  const displayName = message.user.firstname && message.user.lastname
    ? `${message.user.firstname} ${message.user.lastname}`
    : message.user.email.split('@')[0];
  
  const initials = message.user.firstname && message.user.lastname
    ? `${message.user.firstname[0]}${message.user.lastname[0]}`.toUpperCase()
    : message.user.email.slice(0, 2).toUpperCase();

  return (
    <div className={cn('flex gap-2 mb-3', isOwnMessage && 'flex-row-reverse')}>
      <Avatar className="w-8 h-8 shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      
      <div className={cn('flex flex-col max-w-[70%]', isOwnMessage && 'items-end')}>
        <div className={cn('flex items-center gap-2 mb-1', isOwnMessage && 'flex-row-reverse')}>
          <span className="text-sm font-medium">{displayName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
          </span>
        </div>
        
        <div
          className={cn(
            'px-3 py-2 rounded-lg break-words',
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

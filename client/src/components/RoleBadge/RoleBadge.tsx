import { Badge } from '../ui/badge';
import { Crown, Eye } from 'lucide-react';

interface RoleBadgeProps {
  role: 'seller' | 'buyer';
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  if (role === 'seller') {
    return (
      <Badge variant="default" className={className}>
        <Crown className="w-3 h-3" />
        Broadcaster
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      <Eye className="w-3 h-3" />
      Viewer
    </Badge>
  );
}

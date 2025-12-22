import { trpc } from '../../lib/trpc';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Video, Users, Lock, Plus } from 'lucide-react';
import { isAuthenticated } from '../../lib/auth';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';

export default function ChannelsPage() {
  const navigate = useNavigate();
  const { data: channels, isLoading } = trpc.channel.list.useQuery();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading channels...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Live Channels</h1>
          <Button onClick={() => navigate('/create-channel')}>
            <Plus className="size-4 mr-2" />
            Create Channel
          </Button>
        </div>

        {channels?.length === 0 ? (
          <div className="text-center py-12">
            <Video className="size-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active channels</h3>
            <p className="text-muted-foreground mb-4">
              Be the first to create a live channel!
            </p>
            <Button onClick={() => navigate('/create-channel')}>
              <Plus className="size-4 mr-2" />
              Create Channel
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels?.map((channel) => (
              <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Video className="size-5" />
                      {channel.name}
                    </CardTitle>
                    {channel.is_private && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-accent px-2 py-1 rounded">
                        <Lock className="size-3" />
                        Private
                      </div>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <Users className="size-4" />
                    {channel.participantCount} / {channel.max_participants}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/channel/${channel.id}`)}
                    disabled={channel.participantCount >= (channel.max_participants || 10)}
                    variant={
                      channel.participantCount >= (channel.max_participants || 10)
                        ? 'secondary'
                        : 'default'
                    }
                  >
                    {channel.participantCount >= (channel.max_participants || 10)
                      ? 'Full'
                      : 'Join Channel'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

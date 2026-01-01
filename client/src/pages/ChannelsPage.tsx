import { trpc } from "../lib/trpc";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { Video, Users, Lock, Plus, Store } from "lucide-react";
import { isAuthenticated } from "../lib/auth";
import Button from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { Alert, AlertDescription } from "../components/ui/alert";

export default function ChannelsPage() {
  const navigate = useNavigate();
  const { data: channels, isLoading } = trpc.channel.list.useQuery();
  const { data: userRoles, isLoading: isLoadingRoles } =
    trpc.role.myRoles.useQuery();
  const { data: userShops, isLoading: isLoadingShops } =
    trpc.shop.list.useQuery(undefined, {
      enabled: userRoles?.roles.includes("SELLER"),
    });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const isSeller = userRoles?.roles.includes("SELLER");
  const hasShop = (userShops?.length ?? 0) > 0;
  const canCreateChannel = isSeller && hasShop;

  if (isLoading || isLoadingRoles) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-10 w-36" />
          </div>

          {/* Channel Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardHeader>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Live Channels</h1>
          {canCreateChannel ? (
            <Button asChild>
              <Link to="/create-channel">
                <Plus className="size-4 mr-2" />
                Create Channel
              </Link>
            </Button>
          ) : (
            <Alert className="max-w-md">
              <Store className="size-4" />
              <AlertDescription>
                {!isSeller
                  ? "Only sellers can create channels. Request seller access from the menu."
                  : "You need at least one shop to create a channel."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {channels?.length === 0 ? (
          <div className="text-center py-12">
            <Video className="size-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active channels</h3>
            {canCreateChannel ? (
              <>
                <p className="text-muted-foreground mb-4">
                  Be the first to create a live channel!
                </p>
                <Button asChild>
                  <Link to="/create-channel">
                    <Plus className="size-4 mr-2" />
                    Create Channel
                  </Link>
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">
                {!isSeller
                  ? "Only sellers with shops can create channels."
                  : "You need at least one shop to create a channel."}
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels?.map((channel) => (
              <Card
                key={channel.id}
                className="hover:shadow-lg transition-shadow"
              >
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
                    asChild={
                      channel.participantCount <
                      (channel.max_participants || 10)
                    }
                    disabled={
                      channel.participantCount >=
                      (channel.max_participants || 10)
                    }
                    variant={
                      channel.participantCount >=
                      (channel.max_participants || 10)
                        ? "secondary"
                        : "default"
                    }
                  >
                    {channel.participantCount >=
                    (channel.max_participants || 10) ? (
                      <span>Full</span>
                    ) : (
                      <Link to={`/channel/${channel.id}`}>Join Channel</Link>
                    )}
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

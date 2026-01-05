import { useNavigate, Link } from "react-router-dom";
import { LogOut, User, Mail, Calendar, CheckCircle, Clock } from "lucide-react";
import { trpc } from "../lib/trpc";
import { removeToken, isAuthenticated } from "../lib/auth";
import { useEffect } from "react";
import Button from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: user, isLoading, error } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    removeToken();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>

          {/* User Info Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48 mb-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-4" />
                <Skeleton className="h-5 w-full max-w-xs" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="size-4" />
                <Skeleton className="h-5 w-full max-w-sm" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="size-4" />
                <Skeleton className="h-5 w-full max-w-md" />
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32 mb-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-destructive">{error.message}</div>
              <Button asChild>
                <Link to="/login">Go to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="size-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  User ID
                </span>
                <span className="text-sm font-mono">{user?.id}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Mail className="size-4" />
                  Email
                </span>
                <span className="text-sm">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Status
                </span>
                <span className="text-sm flex items-center gap-2">
                  {user?.isVerified ? (
                    <>
                      <CheckCircle className="size-4 text-emerald-500 dark:text-emerald-400" />
                      Verified
                    </>
                  ) : (
                    <>
                      <Clock className="size-4 text-yellow-500" />
                      Pending
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-4" />
                  Member Since
                </span>
                <span className="text-sm">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

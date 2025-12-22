import { useNavigate } from "react-router-dom";
import { LogOut, User, Mail, Calendar, CheckCircle, Clock } from "lucide-react";
import { trpc } from "../lib/trpc";
import { removeToken, isAuthenticated } from "../lib/auth";
import { useEffect } from "react";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";

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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading...</div>
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
              <Button onClick={() => navigate("/login")}>Go to Login</Button>
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
                <span className="text-sm font-medium text-muted-foreground">User ID</span>
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
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <span className="text-sm flex items-center gap-2">
                  {user?.isVerified ? (
                    <>
                      <CheckCircle className="size-4 text-green-500" />
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

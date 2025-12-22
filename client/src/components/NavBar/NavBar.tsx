import { Link, useNavigate } from "react-router-dom";
import { Video, Home, Plus, LogOut, LogIn, UserPlus, User } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { isAuthenticated, removeToken } from "../../lib/auth";
import Button from "../ui/Button";

export default function NavBar() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const { data: user } = trpc.auth.me.useQuery(undefined, {
    enabled: authenticated,
  });

  const handleLogout = () => {
    removeToken();
    navigate("/");
  };

  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-bold hover:text-primary transition-colors"
          >
            <Video className="size-6 text-primary" />
            <span>NotWhat</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {authenticated ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/dashboard">
                    <Home className="size-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>

                <Button variant="ghost" size="sm" asChild>
                  <Link to="/channels">
                    <Video className="size-4 mr-2" />
                    Channels
                  </Link>
                </Button>

                <Button variant="default" size="sm" onClick={() => navigate("/create-channel")}>
                  <Plus className="size-4 mr-2" />
                  Create
                </Button>

                {user && (
                  <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-accent">
                      <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                        {user.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm hidden md:inline">{user.email}</span>
                    </div>
                  </div>
                )}

                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">
                    <LogIn className="size-4 mr-2" />
                    Login
                  </Link>
                </Button>

                <Button variant="default" size="sm" asChild>
                  <Link to="/register">
                    <UserPlus className="size-4 mr-2" />
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

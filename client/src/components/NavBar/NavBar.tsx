import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Video, Home, Plus, LogOut, LogIn, UserPlus, Menu, X } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { isAuthenticated, removeToken } from "../../lib/auth";
import Button from "../ui/Button";

export default function NavBar() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user } = trpc.auth.me.useQuery(undefined, {
    enabled: authenticated,
  });

  const handleLogout = () => {
    removeToken();
    setMobileMenuOpen(false);
    navigate("/");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-lg md:text-xl font-bold hover:text-primary transition-colors"
            onClick={closeMobileMenu}
          >
            <Video className="size-5 md:size-6 text-primary" />
            <span className="hidden xs:inline">NotWhat</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
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
                      <span className="text-sm hidden lg:inline">{user.email}</span>
                    </div>
                  </div>
                )}

                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="size-4 mr-2" />
                  <span className="hidden lg:inline">Logout</span>
                  <span className="lg:hidden">Exit</span>
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

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="flex flex-col space-y-2">
              {authenticated ? (
                <>
                  {user && (
                    <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-md bg-accent">
                      <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                        {user.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm">{user.email}</span>
                    </div>
                  )}

                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/dashboard" onClick={closeMobileMenu}>
                      <Home className="size-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>

                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/channels" onClick={closeMobileMenu}>
                      <Video className="size-4 mr-2" />
                      Channels
                    </Link>
                  </Button>

                  <Button 
                    variant="default" 
                    className="justify-start" 
                    onClick={() => {
                      navigate("/create-channel");
                      closeMobileMenu();
                    }}
                  >
                    <Plus className="size-4 mr-2" />
                    Create Channel
                  </Button>

                  <div className="border-t border-border my-2"></div>

                  <Button variant="ghost" className="justify-start text-destructive" onClick={handleLogout}>
                    <LogOut className="size-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/login" onClick={closeMobileMenu}>
                      <LogIn className="size-4 mr-2" />
                      Login
                    </Link>
                  </Button>

                  <Button variant="default" className="justify-start" asChild>
                    <Link to="/register" onClick={closeMobileMenu}>
                      <UserPlus className="size-4 mr-2" />
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

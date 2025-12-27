import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Video,
  Home,
  Plus,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  Store,
  X,
  BadgeCheck,
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { isAuthenticated, removeToken } from "../../lib/auth";
import Button from "../ui/Button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { toast } from "sonner";
import ThemeToggle from "../ui/ThemeToggle";

export default function NavBar() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: user } = trpc.auth.me.useQuery(undefined, {
    enabled: authenticated,
  });

  const { data: userRoles } = trpc.role.myRoles.useQuery(undefined, {
    enabled: authenticated,
  });

  const utils = trpc.useUtils();

  const requestSellerRole = trpc.role.requestSellerRole.useMutation({
    onSuccess: (data) => {
      toast.success("Request Submitted", {
        description: data.message,
      });
      utils.role.myRoles.invalidate();
    },
    onError: (error) => {
      toast.error("Request Failed", {
        description: error.message,
      });
    },
  });

  const isSeller = userRoles?.roles.includes('SELLER') ?? false;

  const hasPendingRequest = userRoles?.details.some(
    (role) => role.role_name === 'SELLER' && role.activated_at === null
  ) ?? false;

  const handleRequestSellerRole = async () => {
    try {
      await requestSellerRole.mutateAsync();
    } catch (error) {
      // Error handled by onError callback
    }
  };

  const handleLogout = () => {
    removeToken();
    setSheetOpen(false);
    navigate("/");
  };

  const closeSheet = () => setSheetOpen(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 text-lg md:text-xl font-bold hover:text-primary transition-colors"
            onClick={closeSheet}
          >
            <Video className="size-5 md:size-6 text-primary" />
            <span className="hidden xs:inline">WhyNot</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
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

                {isSeller && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/shops">
                      <Store className="size-4 mr-2" />
                      Shops
                    </Link>
                  </Button>
                )}

                {!isSeller && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestSellerRole}
                    disabled={hasPendingRequest || requestSellerRole.isPending}
                  >
                    <BadgeCheck className="size-4 mr-2" />
                    {hasPendingRequest ? 'Pending' : 'Become a Seller'}
                  </Button>
                )}

                <Button variant="default" size="sm" asChild>
                  <Link to="/create-channel">
                    <Plus className="size-4 mr-2" />
                    Create
                  </Link>
                </Button>

                {user && (
                  <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-accent">
                      <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                        {user.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm hidden lg:inline">
                        {user.email}
                      </span>
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

          {/* Mobile Menu Sheet */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Toggle menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[75%] sm:max-w-[320px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                  <X className="size-4" />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </SheetHeader>
              <div className="flex flex-col h-full pt-6">
                <div className="flex items-center justify-end mb-4">
                  <ThemeToggle />
                </div>
                {authenticated ? (
                  <>
                    {user && (
                      <div className="flex items-center gap-3 px-2 py-3 mb-4 rounded-lg bg-accent">
                        <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-semibold">
                          {user.email[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium truncate">
                          {user.email}
                        </span>
                      </div>
                    )}

                    <nav className="flex flex-col gap-2 flex-1">
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/dashboard" onClick={closeSheet}>
                          <Home className="size-4 mr-2" />
                          Dashboard
                        </Link>
                      </Button>

                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/channels" onClick={closeSheet}>
                          <Video className="size-4 mr-2" />
                          Channels
                        </Link>
                      </Button>

                      {isSeller && (
                        <Button variant="ghost" className="justify-start" asChild>
                          <Link to="/shops" onClick={closeSheet}>
                            <Store className="size-4 mr-2" />
                            Shops
                          </Link>
                        </Button>
                      )}

                      {!isSeller && (
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => {
                            handleRequestSellerRole();
                            closeSheet();
                          }}
                          disabled={hasPendingRequest || requestSellerRole.isPending}
                        >
                          <BadgeCheck className="size-4 mr-2" />
                          {hasPendingRequest ? 'Pending' : 'Become Seller'}
                        </Button>
                      )}

                      <Button
                        variant="default"
                        className="justify-start"
                        asChild
                      >
                        <Link to="/create-channel" onClick={closeSheet}>
                          <Plus className="size-4 mr-2" />
                          Create Channel
                        </Link>
                      </Button>
                    </nav>

                    <div className="border-t border-border pt-4 mt-auto">
                      <Button
                        variant="ghost"
                        className="justify-start w-full text-destructive hover:text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="size-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  </>
                ) : (
                  <nav className="flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/login" onClick={closeSheet}>
                        <LogIn className="size-4 mr-2" />
                        Login
                      </Link>
                    </Button>

                    <Button variant="default" className="justify-start" asChild>
                      <Link to="/register" onClick={closeSheet}>
                        <UserPlus className="size-4 mr-2" />
                        Sign Up
                      </Link>
                    </Button>
                  </nav>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

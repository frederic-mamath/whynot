import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  ShoppingBag,
  Package,
  UserCircle,
} from "lucide-react";
import { trpc } from "../../lib/trpc";
import { removeToken } from "../../lib/auth";
import Button from "../ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { HoverMenu } from "../ui/HoverMenu";
import { toast } from "sonner";
import ThemeToggle from "../ui/theme-toggle";

export default function NavBar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: user, isLoading: isAuthLoading } = trpc.auth.me.useQuery(
    undefined,
    {
      retry: false,
    },
  );
  const authenticated = !!user;

  const { data: userRoles } = trpc.role.myRoles.useQuery(undefined, {
    enabled: authenticated,
  });

  const utils = trpc.useUtils();

  const requestSellerRole = trpc.role.requestSellerRole.useMutation({
    onSuccess: (data) => {
      toast.success(t("navbar.requestSubmitted"), {
        description: data.message,
      });
      utils.role.myRoles.invalidate();
    },
    onError: (error) => {
      toast.error(t("navbar.requestFailed"), {
        description: error.message,
      });
    },
  });

  const isSeller = userRoles?.roles.includes("SELLER") ?? false;

  const hasPendingRequest =
    userRoles?.details.some(
      (role) => role.role_name === "SELLER" && role.activated_at === null,
    ) ?? false;

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      removeToken();
      setSheetOpen(false);
      utils.auth.me.invalidate();
      navigate("/");
    },
  });

  const handleRequestSellerRole = async () => {
    try {
      await requestSellerRole.mutateAsync();
    } catch (error) {
      // Error handled by onError callback
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
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
          <div className="hidden xl:flex items-center gap-2">
            {authenticated ? (
              <>
                <HoverMenu
                  trigger={t("navbar.browse")}
                  items={[
                    {
                      icon: Video,
                      label: t("navbar.channels"),
                      to: "/channels",
                    },
                  ]}
                />

                <HoverMenu
                  trigger={t("navbar.myActivity")}
                  items={[
                    {
                      icon: Home,
                      label: t("navbar.dashboard"),
                      to: "/dashboard",
                    },
                    {
                      icon: UserCircle,
                      label: t("navbar.profile"),
                      to: "/profile",
                    },
                    {
                      icon: ShoppingBag,
                      label: t("navbar.myOrders"),
                      to: "/my-orders",
                    },
                  ]}
                />

                {isSeller && (
                  <HoverMenu
                    trigger={t("navbar.sell")}
                    items={[
                      { icon: Store, label: t("navbar.shops"), to: "/shops" },
                      {
                        icon: Package,
                        label: t("navbar.deliveries"),
                        to: "/pending-deliveries",
                      },
                    ]}
                  />
                )}

                {/* Separator */}
                <div className="h-6 w-px bg-border mx-2" />

                {/* Actions */}
                {!isSeller ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestSellerRole}
                    disabled={hasPendingRequest || requestSellerRole.isPending}
                  >
                    <BadgeCheck className="size-4 mr-2" />
                    {hasPendingRequest
                      ? t("navbar.requestPending")
                      : t("navbar.becomeSeller")}
                  </Button>
                ) : (
                  <Button variant="default" size="sm" asChild>
                    <Link to="/create-channel">
                      <Plus className="size-4 mr-2" />
                      {t("navbar.create")}
                    </Link>
                  </Button>
                )}

                {/* Separator */}
                <div className="h-6 w-px bg-border mx-2" />

                {/* Account */}
                <ThemeToggle />
                {user && (
                  <div className="flex items-center gap-2">
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
                  <span className="hidden lg:inline">{t("navbar.logout")}</span>
                  <span className="lg:hidden">{t("navbar.exit")}</span>
                </Button>
              </>
            ) : (
              <>
                <ThemeToggle />

                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">
                    <LogIn className="size-4 mr-2" />
                    {t("navbar.login")}
                  </Link>
                </Button>

                <Button variant="default" size="sm" asChild>
                  <Link to="/register">
                    <UserPlus className="size-4 mr-2" />
                    {t("navbar.signUp")}
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
                className="xl:hidden"
                aria-label="Toggle menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[75%] sm:max-w-[320px]">
              <SheetHeader>
                <SheetTitle>{t("navbar.menu")}</SheetTitle>
                <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                  <X className="size-4" />
                  <span className="sr-only">{t("navbar.close")}</span>
                </SheetClose>
              </SheetHeader>
              <div className="flex flex-col h-full pt-6">
                <div className="flex items-center justify-end mb-4">
                  <ThemeToggle />
                </div>
                {authenticated ? (
                  <>
                    {user && (
                      <div className="flex items-center gap-3 px-2 py-3 mb-6 rounded-lg bg-accent">
                        <div className="size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-semibold">
                          {user.email[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium truncate">
                          {user.email}
                        </span>
                      </div>
                    )}

                    <nav className="flex flex-col gap-1 flex-1">
                      {/* Browse Section */}
                      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("navbar.browse")}
                      </div>
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/channels" onClick={closeSheet}>
                          <Video className="size-4 mr-2" />
                          {t("navbar.channels")}
                        </Link>
                      </Button>

                      {/* My Activity Section */}
                      <div className="px-2 py-1 mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("navbar.myActivity")}
                      </div>
                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/dashboard" onClick={closeSheet}>
                          <Home className="size-4 mr-2" />
                          {t("navbar.dashboard")}
                        </Link>
                      </Button>

                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/profile" onClick={closeSheet}>
                          <UserCircle className="size-4 mr-2" />
                          {t("navbar.profile")}
                        </Link>
                      </Button>

                      <Button variant="ghost" className="justify-start" asChild>
                        <Link to="/my-orders" onClick={closeSheet}>
                          <ShoppingBag className="size-4 mr-2" />
                          {t("navbar.myOrders")}
                        </Link>
                      </Button>

                      {/* Sell Section - Sellers only */}
                      {isSeller && (
                        <>
                          <div className="px-2 py-1 mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("navbar.sell")}
                          </div>
                          <Button
                            variant="ghost"
                            className="justify-start"
                            asChild
                          >
                            <Link to="/shops" onClick={closeSheet}>
                              <Store className="size-4 mr-2" />
                              {t("navbar.shops")}
                            </Link>
                          </Button>

                          <Button
                            variant="ghost"
                            className="justify-start"
                            asChild
                          >
                            <Link to="/pending-deliveries" onClick={closeSheet}>
                              <Package className="size-4 mr-2" />
                              {t("navbar.pendingDeliveries")}
                            </Link>
                          </Button>
                        </>
                      )}

                      {/* Actions Section */}
                      <div className="h-px bg-border my-4" />
                      {!isSeller ? (
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => {
                            handleRequestSellerRole();
                            closeSheet();
                          }}
                          disabled={
                            hasPendingRequest || requestSellerRole.isPending
                          }
                        >
                          <BadgeCheck className="size-4 mr-2" />
                          {hasPendingRequest
                            ? t("navbar.requestPending")
                            : t("navbar.becomeSeller")}
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          className="justify-start"
                          asChild
                        >
                          <Link to="/create-channel" onClick={closeSheet}>
                            <Plus className="size-4 mr-2" />
                            {t("navbar.createChannel")}
                          </Link>
                        </Button>
                      )}
                    </nav>

                    {/* Logout at bottom */}
                    <div className="border-t border-border pt-4">
                      <Button
                        variant="ghost"
                        className="justify-start w-full text-destructive hover:text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOut className="size-4 mr-2" />
                        {t("navbar.logout")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <nav className="flex flex-col gap-1">
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link to="/login" onClick={closeSheet}>
                        <LogIn className="size-4 mr-2" />
                        {t("navbar.login")}
                      </Link>
                    </Button>

                    <Button variant="default" className="justify-start" asChild>
                      <Link to="/register" onClick={closeSheet}>
                        <UserPlus className="size-4 mr-2" />
                        {t("navbar.signUp")}
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

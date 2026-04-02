import { useNavigate } from "react-router-dom";
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
import ButtonV2 from "../ui/ButtonV2/ButtonV2";
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
      window.location.href = "/";
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
                  <ButtonV2
                    icon={<BadgeCheck className="size-4" />}
                    label={hasPendingRequest ? t("navbar.requestPending") : t("navbar.becomeSeller")}
                    onClick={handleRequestSellerRole}
                    disabled={hasPendingRequest || requestSellerRole.isPending}
                    className="border border-border bg-background text-foreground"
                  />
                ) : (
                  <ButtonV2
                    icon={<Plus className="size-4" />}
                    label={t("navbar.create")}
                    onClick={() => navigate("/create-channel")}
                    className="bg-primary text-primary-foreground"
                  />
                )}

                {/* Separator */}
                <div className="h-6 w-px bg-border mx-2" />

                {/* Account */}
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

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:text-primary rounded-md"
                >
                  <LogOut className="size-4" />
                  <span className="hidden lg:inline">{t("navbar.logout")}</span>
                  <span className="lg:hidden">{t("navbar.exit")}</span>
                </button>
              </>
            ) : (
              <>
                <ButtonV2
                  icon={<LogIn className="size-4" />}
                  label={t("navbar.login")}
                  onClick={() => navigate("/login")}
                  className="bg-transparent text-foreground"
                />
                <ButtonV2
                  icon={<UserPlus className="size-4" />}
                  label={t("navbar.signUp")}
                  onClick={() => navigate("/register")}
                  className="bg-primary text-primary-foreground"
                />
              </>
            )}
          </div>

          {/* Mobile Menu Sheet */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className="xl:hidden p-2 text-foreground hover:text-primary rounded-md"
                aria-label="Toggle menu"
              >
                <Menu className="size-5" />
              </button>
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
                      <ButtonV2
                        icon={<Video className="size-4" />}
                        label={t("navbar.channels")}
                        onClick={() => { navigate("/lives"); closeSheet(); }}
                        className="bg-transparent text-foreground justify-start w-full"
                      />

                      {/* My Activity Section */}
                      <div className="px-2 py-1 mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("navbar.myActivity")}
                      </div>
                      <ButtonV2
                        icon={<Home className="size-4" />}
                        label={t("navbar.dashboard")}
                        onClick={() => { navigate("/dashboard"); closeSheet(); }}
                        className="bg-transparent text-foreground justify-start w-full"
                      />
                      <ButtonV2
                        icon={<UserCircle className="size-4" />}
                        label={t("navbar.profile")}
                        onClick={() => { navigate("/profile"); closeSheet(); }}
                        className="bg-transparent text-foreground justify-start w-full"
                      />
                      <ButtonV2
                        icon={<ShoppingBag className="size-4" />}
                        label={t("navbar.myOrders")}
                        onClick={() => { navigate("/my-orders"); closeSheet(); }}
                        className="bg-transparent text-foreground justify-start w-full"
                      />

                      {/* Sell Section - Sellers only */}
                      {isSeller && (
                        <>
                          <div className="px-2 py-1 mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {t("navbar.sell")}
                          </div>
                          <ButtonV2
                            icon={<Store className="size-4" />}
                            label={t("navbar.shops")}
                            onClick={() => { navigate("/shops"); closeSheet(); }}
                            className="bg-transparent text-foreground justify-start w-full"
                          />
                          <ButtonV2
                            icon={<Package className="size-4" />}
                            label={t("navbar.pendingDeliveries")}
                            onClick={() => { navigate("/pending-deliveries"); closeSheet(); }}
                            className="bg-transparent text-foreground justify-start w-full"
                          />
                        </>
                      )}

                      {/* Actions Section */}
                      <div className="h-px bg-border my-4" />
                      {!isSeller ? (
                        <ButtonV2
                          icon={<BadgeCheck className="size-4" />}
                          label={hasPendingRequest ? t("navbar.requestPending") : t("navbar.becomeSeller")}
                          onClick={() => { handleRequestSellerRole(); closeSheet(); }}
                          disabled={hasPendingRequest || requestSellerRole.isPending}
                          className="border border-border bg-background text-foreground justify-start w-full"
                        />
                      ) : (
                        <ButtonV2
                          icon={<Plus className="size-4" />}
                          label={t("navbar.createChannel")}
                          onClick={() => { navigate("/create-channel"); closeSheet(); }}
                          className="bg-primary text-primary-foreground justify-start w-full"
                        />
                      )}
                    </nav>

                    {/* Logout at bottom */}
                    <div className="border-t border-border pt-4">
                      <ButtonV2
                        icon={<LogOut className="size-4" />}
                        label={t("navbar.logout")}
                        onClick={handleLogout}
                        className="bg-transparent text-destructive justify-start w-full"
                      />
                    </div>
                  </>
                ) : (
                  <nav className="flex flex-col gap-1">
                    <ButtonV2
                      icon={<LogIn className="size-4" />}
                      label={t("navbar.login")}
                      onClick={() => { navigate("/login"); closeSheet(); }}
                      className="bg-transparent text-foreground justify-start w-full"
                    />
                    <ButtonV2
                      icon={<UserPlus className="size-4" />}
                      label={t("navbar.signUp")}
                      onClick={() => { navigate("/register"); closeSheet(); }}
                      className="bg-primary text-primary-foreground justify-start w-full"
                    />
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

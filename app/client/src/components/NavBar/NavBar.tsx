import { useNavigate, useLocation, Link } from "react-router-dom";
import Logo from "@/components/Logo/Logo";
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
import { cn } from "@/lib/utils";

export default function NavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
    <nav className="hidden md:block sticky top-0 z-50 border-b border-border bg-background">
      <div className="max-w-[1024px] mx-auto px-8 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" onClick={closeSheet}>
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {authenticated ? (
              <>
                {[
                  { label: "Accueil", to: "/home" },
                  { label: "Vendre", to: isSeller ? "/seller" : "/vendre" },
                  { label: "Activité", to: "/my-orders" },
                  { label: "Profil", to: "/profile" },
                ].map(({ label, to }) => (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-outfit font-semibold transition-colors",
                      pathname.startsWith(to)
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:text-primary",
                    )}
                  >
                    {label}
                  </Link>
                ))}
                <div className="h-6 w-px bg-border mx-2" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
                >
                  <LogOut className="size-4" />
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
                className="md:hidden p-2 text-foreground hover:text-primary rounded-md"
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
                        onClick={() => {
                          navigate("/lives");
                          closeSheet();
                        }}
                        className="bg-transparent text-foreground justify-start w-full"
                      />

                      {/* My Activity Section */}
                      <div className="px-2 py-1 mt-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("navbar.myActivity")}
                      </div>
                      <ButtonV2
                        icon={<Home className="size-4" />}
                        label={t("navbar.dashboard")}
                        onClick={() => {
                          navigate("/dashboard");
                          closeSheet();
                        }}
                        className="bg-transparent text-foreground justify-start w-full"
                      />
                      <ButtonV2
                        icon={<UserCircle className="size-4" />}
                        label={t("navbar.profile")}
                        onClick={() => {
                          navigate("/profile");
                          closeSheet();
                        }}
                        className="bg-transparent text-foreground justify-start w-full"
                      />
                      <ButtonV2
                        icon={<ShoppingBag className="size-4" />}
                        label={t("navbar.myOrders")}
                        onClick={() => {
                          navigate("/my-orders");
                          closeSheet();
                        }}
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
                            onClick={() => {
                              navigate("/shops");
                              closeSheet();
                            }}
                            className="bg-transparent text-foreground justify-start w-full"
                          />
                          <ButtonV2
                            icon={<Package className="size-4" />}
                            label={t("navbar.pendingDeliveries")}
                            onClick={() => {
                              navigate("/pending-deliveries");
                              closeSheet();
                            }}
                            className="bg-transparent text-foreground justify-start w-full"
                          />
                        </>
                      )}

                      {/* Actions Section */}
                      <div className="h-px bg-border my-4" />
                      {!isSeller ? (
                        <ButtonV2
                          icon={<BadgeCheck className="size-4" />}
                          label={
                            hasPendingRequest
                              ? t("navbar.requestPending")
                              : t("navbar.becomeSeller")
                          }
                          onClick={() => {
                            handleRequestSellerRole();
                            closeSheet();
                          }}
                          disabled={
                            hasPendingRequest || requestSellerRole.isPending
                          }
                          className="border border-border bg-background text-foreground justify-start w-full"
                        />
                      ) : (
                        <ButtonV2
                          icon={<Plus className="size-4" />}
                          label={t("navbar.createChannel")}
                          onClick={() => {
                            navigate("/create-channel");
                            closeSheet();
                          }}
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
                      onClick={() => {
                        navigate("/login");
                        closeSheet();
                      }}
                      className="bg-transparent text-foreground justify-start w-full"
                    />
                    <ButtonV2
                      icon={<UserPlus className="size-4" />}
                      label={t("navbar.signUp")}
                      onClick={() => {
                        navigate("/register");
                        closeSheet();
                      }}
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

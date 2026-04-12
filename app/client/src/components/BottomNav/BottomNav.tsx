import { useLocation, useNavigate } from "react-router-dom";
import { Activity, Home, Radio, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = trpc.profile.me.useQuery();
  const { data: userRoles } = trpc.role.myRoles.useQuery(undefined, {
    enabled: !!profile,
  });
  const isSeller = userRoles?.roles.includes("SELLER") ?? false;

  const isActive = (path: string) => location.pathname.startsWith(path);

  if (location.pathname.startsWith("/live/")) {
    return null;
  }

  const handleVendre = () => {
    if (isSeller) {
      navigate("/seller");
    } else {
      navigate("/vendre");
    }
  };

  const isVendreActive = isSeller
    ? location.pathname.startsWith("/seller") ||
      location.pathname.startsWith("/pending-deliveries")
    : location.pathname.startsWith("/vendre");

  const navItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "Home",
      path: "/home",
      onClick: () => navigate("/home"),
      active: isActive("/home"),
    },
    {
      icon: <Store className="w-5 h-5" />,
      label: "Vendre",
      path: isSeller ? "/seller" : "/vendre",
      onClick: handleVendre,
      active: isVendreActive,
    },
    {
      icon: <Activity className="w-5 h-5" />,
      label: "Activité",
      path: "/my-orders",
      onClick: () => navigate("/my-orders"),
      active: isActive("/my-orders"),
    },
    {
      icon: <User className="w-5 h-5" />,
      label: "Profil",
      path: "/profile",
      onClick: () => navigate("/profile"),
      active: isActive("/profile"),
    },
  ];

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "md:hidden",
        "bg-background",
        "border-t border-border border-divider",
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 hover:cursor-pointer",
              item.active ? "text-primary" : "text-muted-foreground",
            )}
            >
              {item.path === "/profile" && profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                item.icon
              )}
              <span className="text-[10px] font-outfit font-medium">
                {item.label}
              </span>
            </button>
          ))}
      </div>
    </nav>
  );
};

export default BottomNav;

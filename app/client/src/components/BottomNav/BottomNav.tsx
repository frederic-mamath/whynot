import { useLocation, useNavigate } from "react-router-dom";
import { Home, Radio, User, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { icon: <Home className="w-5 h-5" />, label: "Home", path: "/home" },
  {
    icon: <Radio className="w-5 h-5" />,
    label: "Lives",
    path: "/seller/lives",
  },
  { icon: null, label: "GO", path: "/seller/go", isCenter: true },
  {
    icon: <User className="w-5 h-5" />,
    label: "Profil",
    path: "/profile",
  },
  {
    icon: <Store className="w-5 h-5" />,
    label: "Boutique",
    path: "/seller/shop",
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: profile } = trpc.profile.me.useQuery();

  const isActive = (path: string) => {
    if (path === "/seller") return location.pathname === "/seller";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[460px] mx-auto bg-background border-t border-border z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          if (item.isCenter) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-primary text-primary-foreground font-syne font-extrabold text-sm shadow-lg hover:cursor-pointer"
              >
                {item.label}
              </button>
            );
          }

          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 hover:cursor-pointer",
                active ? "text-primary" : "text-muted-foreground",
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
          );
        })}
      </div>
    </nav>
  );
}

import { Outlet, NavLink } from "react-router-dom";
import { Home, Store, Video, Package, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

function SidebarLink({
  to,
  icon: Icon,
  label,
  end,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-outfit font-semibold transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {label}
    </NavLink>
  );
}

export default function SellerLayout() {
  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0 lg:border-r lg:border-border bg-background p-4 gap-1 sticky top-16 self-start h-[calc(100vh-4rem)]">
        <SidebarLink to="/seller" icon={Home} label="Accueil" end />
        <SidebarLink to="/seller/shop" icon={Store} label="Boutique" />
        <SidebarLink to="/seller/lives" icon={Video} label="Lives" />
        <SidebarLink to="/seller/livraisons" icon={Package} label="Livraisons" />
        <SidebarLink to="/seller/explorer" icon={Compass} label="Explorer" />
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Building2,
  AlertTriangle,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  {
    title: "داشبورد",
    href: "/",
    icon: LayoutDashboard,
    roles: ["admin", "manager", "head", "viewer"],
  },
  {
    title: "مرکز ورود داده",
    href: "/import",
    icon: Upload,
    roles: ["admin"],
  },
  {
    title: "ساختار سازمانی",
    href: "/organization",
    icon: Building2,
    roles: ["admin"],
  },
  {
    title: "تریگرها",
    href: "/triggers",
    icon: AlertTriangle,
    roles: ["admin", "manager", "head"],
  },
  {
    title: "سوابق",
    href: "/records",
    icon: History,
    roles: ["admin", "manager", "head", "viewer"],
  },
  {
    title: "تنظیمات",
    href: "/settings",
    icon: Settings,
    roles: ["admin"],
  },
];

interface SidebarProps {
  userRole: string;
}

export function Sidebar({ userRole }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  
  const allowedItems = sidebarItems.filter(item => 
    item.roles.includes(userRole.toLowerCase())
  );

  return (
    <aside
      className={cn(
        "bg-card border-l border-border transition-all duration-300 relative",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -left-3 top-6 bg-card border border-border rounded-full h-6 w-6 p-0 z-10"
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="p-4 pt-6">
        <ul className="space-y-2">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground"
                    )
                  }
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium">{item.title}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
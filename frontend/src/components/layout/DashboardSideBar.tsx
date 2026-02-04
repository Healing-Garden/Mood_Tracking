import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { authApi } from "../../api/authApi";
import { useDailyCheckInStore } from "../../store/dailyCheckInStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import {
  Home,
  User,
  Settings,
  BookOpen,
  TrendingUp,
  Brain,
  Users,
  BarChart3,
  LogOut,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

interface DashboardSidebarProps {
  userType: "user" | "admin";
  onClose?: () => void;
}

export default function DashboardSidebar({
  userType,
  onClose,
}: DashboardSidebarProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout(); // optional nếu backend có
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      // Xoá luôn state liên quan tới user hiện tại trong các store
      useDailyCheckInStore.getState().resetStore();
      useOnboardingStore.getState().resetOnboarding();
      navigate("/", { replace: true });
    }
  };

  const location = useLocation();

  const userMenuItems: MenuItem[] = [
    { label: "Dashboard", icon: <Home size={20} />, href: "/user/dashboard" },
    { label: "Check-ins", icon: <Brain size={20} />, href: "/user/journal" },
    { label: "Journal", icon: <BookOpen size={20} />, href: "/user/journal" },
    {
      label: "Analytics",
      icon: <TrendingUp size={20} />,
      href: "/user/analytics",
    },
  ];

  const adminMenuItems: MenuItem[] = [
    { label: "Dashboard", icon: <Home size={20} />, href: "/admin/dashboard" },
    {
      label: "Users",
      icon: <Users size={20} />,
      href: "/admin/users",
      badge: 3,
    },
    {
      label: "Analytics",
      icon: <BarChart3 size={20} />,
      href: "/admin/analytics",
    },
    {
      label: "Reports",
      icon: <TrendingUp size={20} />,
      href: "/admin/reports",
    },
    { label: "System", icon: <Settings size={20} />, href: "/admin/settings" },
  ];

  const menuItems = userType === "user" ? userMenuItems : adminMenuItems;

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <aside className="w-64 bg-white border-r border-border/50 h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <img
            src="/healing-garden-logo.png"
            alt="Healing Garden"
            width={50}
            height={50}
            className="rounded-lg"
          />
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Healing Garden
            </h2>
            <p className="text-xs text-muted-foreground">
              {userType === "user" ? "Your Wellness" : "Administration"}
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onClose}
            className={({ isActive: navActive }) =>
              `flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                navActive || isActive(item.href)
                  ? "bg-primary text-white"
                  : "text-foreground hover:bg-muted"
              }`
            }
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </div>

            {item.badge && (
              <span className="bg-accent text-foreground text-xs font-semibold px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border/50 p-3 space-y-3">
        <NavLink
          to={userType === "user" ? "/user/profile" : "/admin/profile"}
          onClick={onClose}
        >
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2 text-foreground hover:bg-muted/50 hover:text-primary"
          >
            <User size={20} />
            Profile
          </Button>
        </NavLink>

        <NavLink
          to={userType === "user" ? "/user/settings" : "/admin/settings"}
          onClick={onClose}
        >
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2 text-foreground hover:bg-muted/50 hover:text-primary"
          >
            <Settings size={20} />
            Settings
          </Button>
        </NavLink>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-start gap-3 bg-transparent border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <LogOut size={20} />
          Logout
        </Button>
      </div>
    </aside>
  );
}

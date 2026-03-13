import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/Button";
import { authApi } from "../../api/authApi";
import { useDailyCheckInStore } from "../../store/dailyCheckInStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import { useAuth } from "../../hooks/useAuth";
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
  Bell,
  MessageSquare,
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
  collapsed?: boolean;
}

export default function DashboardSidebar({
  userType,
  onClose,
  collapsed,
}: DashboardSidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("journalUnlocked");
      useDailyCheckInStore.getState().resetStore();
      useOnboardingStore.getState().resetOnboarding();
      navigate("/", { replace: true });
    }
  };

  const location = useLocation();

  const userMenuItems: MenuItem[] = [
    { label: "Home", icon: <Home size={20} />, href: "/user/dashboard" },
    { label: "Journal", icon: <BookOpen size={20} />, href: "/user/journal" },
    { label: "Analytics", icon: <TrendingUp size={20} />, href: "/user/analytics" },
    { label: "AI Partner", icon: <Brain size={20} />, href: "/user/ai-partner" },
    { label: "Notifications", icon: <Bell size={20} />, href: "/user/notifications" },
    { label: "Feedback", icon: <MessageSquare size={20} />, href: "/user/feedback" },
  ];

  const adminMenuItems: MenuItem[] = [
    { label: "Home", icon: <Home size={20} />, href: "/admin/dashboard" },
    {
      label: "Users",
      icon: <Users size={20} />,
      href: "/admin/users",
    },
    {
      label: "Analytics",
      icon: <BarChart3 size={20} />,
      href: "/admin/analytics",
    },
    { label: "Feedback", icon: <MessageSquare size={20} />, href: "/admin/feedback" },
    { label: "Healing Content", icon: <BookOpen size={20} />, href: "/admin/healing-content" },
    { label: "Notifications", icon: <Bell size={20} />, href: "/admin/notifications" },
  ];

  const menuItems = userType === "user" ? userMenuItems : adminMenuItems;

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  return (
    <aside className={`${collapsed ? "w-16" : "w-64"} fixed left-0 top-20 h-[calc(100vh-80px)] bg-white border-r border-border/50 flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden z-20`}>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pt-4 pb-6 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            onClick={onClose}
            className={({ isActive: navActive }) =>
              `flex items-center ${collapsed ? 'justify-center px-3' : 'justify-between px-4'} py-3 rounded-lg transition-all ${navActive || isActive(item.href)
                ? "bg-primary text-white"
                : "text-foreground hover:bg-muted"
              }`
            }
            title={collapsed ? item.label : undefined}
          >
            <div className={`flex items-center ${collapsed ? '' : 'gap-3'} whitespace-nowrap flex-nowrap`}>
              <div className={`flex-shrink-0 ${collapsed ? 'w-auto' : 'w-10'} flex justify-center`}>
                {item.icon}
              </div>
              <span className={`font-medium transition-all duration-300 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                {item.label}
              </span>
            </div>

            {!collapsed && item.badge && (
              <span className="bg-accent text-foreground text-xs font-semibold px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={`border-t border-border/50 ${collapsed ? 'px-2' : 'p-3'} space-y-3`}>
        <NavLink
          to={userType === "user" ? "/user/profile" : "/admin/profile"}
          onClick={onClose}
        >
          <Button
            variant="ghost"
            className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2 text-foreground hover:bg-muted/50 hover:text-primary transition-all`}
            title={collapsed ? "Profile" : undefined}
          >
            <div className={`flex items-center ${collapsed ? '' : 'gap-3'} whitespace-nowrap flex-nowrap`}>
              <div className={`flex-shrink-0 ${collapsed ? 'w-auto' : 'w-10'} flex justify-center`}>
                {(user as any)?.avatarUrl || user?.avatar ? (
                  <img
                    src={(user as any)?.avatarUrl || user?.avatar}
                    alt={(user as any)?.fullName || user?.name || "Profile"}
                    className="w-6 h-6 rounded-full object-cover shrink-0 block"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={20} className="shrink-0" />
                )}
              </div>
              <span className={`transition-all duration-300 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                Profile
              </span>
            </div>
          </Button>
        </NavLink>

        <NavLink
          to={userType === "user" ? "/user/settings" : "/admin/settings"}
          onClick={onClose}
        >
          <Button
            variant="ghost"
            className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2 text-foreground hover:bg-muted/50 hover:text-primary transition-all`}
            title={collapsed ? "Settings" : undefined}
          >
            <div className={`flex items-center ${collapsed ? '' : 'gap-3'} whitespace-nowrap flex-nowrap`}>
              <div className={`flex-shrink-0 ${collapsed ? 'w-auto' : 'w-10'} flex justify-center`}>
                <Settings size={20} />
              </div>
              <span className={`transition-all duration-300 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                Settings
              </span>
            </div>
          </Button>
        </NavLink>

        <Button
          variant="outline"
          onClick={handleLogout}
          className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start px-3'} py-2 bg-transparent border-destructive/30 text-destructive hover:bg-destructive/10 transition-all`}
          title={collapsed ? "Logout" : undefined}
        >
          <div className={`flex items-center ${collapsed ? '' : 'gap-3'} whitespace-nowrap flex-nowrap`}>
            <div className={`flex-shrink-0 ${collapsed ? 'w-auto' : 'w-10'} flex justify-center`}>
              <LogOut size={20} />
            </div>
            <span className={`transition-all duration-300 ease-in-out ${collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
              Logout
            </span>
          </div>
        </Button>
      </div>
    </aside>
  );
}
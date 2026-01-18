import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isAdmin?: boolean;
}

export default function Sidebar({ isAdmin = false }: SidebarProps) {
  const location = useLocation();

  const userNavItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/app/journal', label: 'Journal', icon: '📝' },
    { path: '/app/analytics', label: 'Analytics', icon: '📈' },
    { path: '/app/profile', label: 'Profile', icon: '👤' },
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/profile', label: 'Settings', icon: '⚙️' },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <aside
      className="w-64 border-r border-border bg-card"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-card)',
      }}
    >
      <div className="flex h-full flex-col p-4">
        <div className="mb-8">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
            🌸 Healing
          </h2>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                location.pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-foreground hover:bg-muted'
              )}
              style={
                location.pathname === item.path
                  ? {
                      backgroundColor: 'var(--color-primary)',
                      color: 'white',
                    }
                  : {}
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">© 2024 Healing Garden</p>
        </div>
      </div>
    </aside>
  );
}

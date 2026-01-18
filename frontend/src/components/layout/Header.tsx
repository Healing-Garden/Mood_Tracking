import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  isAdmin?: boolean;
}

export default function Header({ isAdmin = false }: HeaderProps) {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header
      className="border-b border-border bg-white shadow-sm"
      style={{
        borderBottomColor: 'var(--color-border)',
        backgroundColor: 'var(--color-card)',
      }}
    >
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            Healing Garden
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 transition-colors hover:bg-muted"
              style={{
                borderColor: 'var(--color-border)',
              }}
            >
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`}
                alt={user?.name}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                {user?.name}
              </span>
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-border bg-card shadow-lg"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-card)',
                }}
              >
                <nav className="flex flex-col p-2">
                  <Link
                    to="/app/profile"
                    className="rounded px-4 py-2 text-sm transition-colors hover:bg-muted"
                  >
                    Profile
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin/dashboard"
                        className="rounded px-4 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        Admin Dashboard
                      </Link>
                      <Link
                        to="/admin/profile"
                        className="rounded px-4 py-2 text-sm transition-colors hover:bg-muted"
                      >
                        Admin Settings
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="rounded px-4 py-2 text-left text-sm text-destructive transition-colors hover:bg-muted"
                  >
                    Logout
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

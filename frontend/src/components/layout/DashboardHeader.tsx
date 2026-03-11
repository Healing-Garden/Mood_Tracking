import React from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardHeaderProps {
  isSidebarOpen: boolean;
  onMenuClick: () => void;
  children?: React.ReactNode;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  isSidebarOpen,
  onMenuClick,
  children
}) => {
  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-border/40 h-20 flex items-center">
      <div className="pl-3 pr-4 lg:pl-4 lg:pr-8 w-full flex justify-between items-center">
        <div className="flex items-center gap-4">
          {/* Logo and System Name */}
          <Link
            to={window.location.pathname.startsWith('/admin') ? '/admin/dashboard' : '/user/dashboard'}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="/healing-garden-logo.png"
              alt="Healing Garden"
              width={65}
              height={65}
              className="rounded-lg"
            />
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Healing Garden
              </h2>
              <p className="text-xs text-muted-foreground">
                {window.location.pathname.startsWith('/admin') ? "Administration" : "Your Wellness"}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {children}
          
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;

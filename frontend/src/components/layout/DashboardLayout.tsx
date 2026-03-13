import React, { useState, createContext, useContext } from 'react';
import DashboardSidebar from './DashboardSideBar';
import DashboardHeader from './DashboardHeader';

interface SidebarContextType {
  sidebarCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  sidebarCollapsed: true,
});

export const useSidebar = () => useContext(SidebarContext);

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userType?: 'user' | 'admin';
  headerActions?: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userType = 'user',
  headerActions
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(() => {
    // Khởi tạo từ sessionStorage nếu có
    return sessionStorage.getItem('sidebarHovered') === 'true';
  });

  // Lưu trạng thái hover vào sessionStorage khi thay đổi
  React.useEffect(() => {
    sessionStorage.setItem('sidebarHovered', sidebarHovered.toString());
  }, [sidebarHovered]);

  const sidebarCollapsed = !sidebarHovered;

  return (
    <SidebarContext.Provider value={{ sidebarCollapsed }}>
      <div className="min-h-screen bg-background">
        {/* Header - Full width at top */}
        <DashboardHeader
          isSidebarOpen={sidebarOpen}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {headerActions}
        </DashboardHeader>

        <div className="flex">
          {/* Sidebar - Below header */}
          <div
            className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}
            onMouseEnter={() => setSidebarHovered(true)}
            onMouseLeave={() => setSidebarHovered(false)}
          >
            <DashboardSidebar 
              userType={userType} 
              onClose={() => setSidebarOpen(false)} 
              collapsed={sidebarCollapsed}
            />
          </div>

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main Content */}
          <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};

export default DashboardLayout;

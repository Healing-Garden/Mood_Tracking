import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '../../../hooks/use-toast';
import { adminService } from '../../../api/adminService';
import type { UserDTO } from '../../../api/adminService';
import DashboardSidebar from '../../../components/layout/DashboardSideBar';
import { AdminUserTable } from '../../../components/admin/AdminUserTable';
import { Input } from '../../../components/ui/Input';
import { Search, Menu, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { BanUserModal } from '../../../components/admin/BanUserModal';
import type { BanConfig } from '../../../components/admin/BanUserModal';

const AdminUserList: React.FC = () => {
    const { toast } = useToast();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [users, setUsers] = useState<UserDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    // Modal state
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [userToBan, setUserToBan] = useState<{ id: string, name: string } | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminService.getUsers(debouncedSearch);
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
            toast({
                title: 'Error',
                description: 'Failed to load user list',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearch, toast]);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    const handleBanClick = (userId: string, userName: string) => {
        setUserToBan({ id: userId, name: userName });
        setIsBanModalOpen(true);
    };

    const confirmBan = async (config: BanConfig) => {
        if (!userToBan) return;

        try {
            setActionLoadingId(userToBan.id);
            await adminService.banUser(userToBan.id, config);

            // Re-fetch users or update locally
            setUsers(prev => prev.map(u =>
                u._id === userToBan.id
                    ? { ...u, isBanned: true, accountStatus: 'banned', banReason: config.reason }
                    : u
            ));

            toast({
                title: 'Success',
                description: 'User banned successfully',
            });
            setIsBanModalOpen(false);
        } catch (error: any) {
            console.error('Failed to ban user:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to ban user',
                variant: 'destructive',
            });
        } finally {
            setActionLoadingId(null);
            setUserToBan(null);
        }
    };

    const handleUnban = async (userId: string) => {
        try {
            setActionLoadingId(userId);
            await adminService.unbanUser(userId);
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: false, accountStatus: 'active' } : u));
            toast({
                title: 'Success',
                description: 'User unbanned successfully',
            });
        } catch (error: any) {
            console.error('Failed to unban user:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to unban user',
                variant: 'destructive',
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 ${sidebarOpen ? 'block' : 'hidden'} lg:static lg:block`}>
                <DashboardSidebar userType="admin" onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-white border-b border-border/50 shadow-sm">
                    <div className="px-4 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-primary">User Management</h1>

                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-muted rounded-lg"
                        >
                            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle>All Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <div className="relative w-full md:w-96">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center p-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                </div>
                            ) : (
                                <AdminUserTable
                                    users={users}
                                    onBan={handleBanClick}
                                    onUnban={handleUnban}
                                    isActionLoading={actionLoadingId}
                                />
                            )}
                        </CardContent>
                    </Card>
                </main>
            </div>

            <BanUserModal
                isOpen={isBanModalOpen}
                onClose={() => {
                    setIsBanModalOpen(false);
                    setUserToBan(null);
                }}
                onConfirm={confirmBan}
                userName={userToBan?.name || ""}
                isActionLoading={!!actionLoadingId}
            />
        </div>
    );
};

export default AdminUserList;

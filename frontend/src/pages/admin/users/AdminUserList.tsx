import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '../../../hooks/use-toast';
import { adminService } from '../../../api/adminService';
import type { UserDTO } from '../../../api/adminService';
import { AdminUserTable } from '../../../components/admin/AdminUserTable';
import { Input } from '../../../components/ui/Input';
import { Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { BanUserModal } from '../../../components/admin/BanUserModal';
import type { BanConfig } from '../../../components/admin/BanUserModal';
import DashboardLayout from '../../../components/layout/DashboardLayout';

const AdminUserList: React.FC = () => {
    const { toast } = useToast();
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
        <DashboardLayout title="User Management" userType="admin">
            <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto w-full transition-all duration-300">
                <Card className="shadow-sm border-border">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl">System Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div className="relative w-full md:w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 rounded-xl"
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                                <p className="text-muted-foreground text-sm">Retrieving users...</p>
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
        </DashboardLayout>
    );
};

export default AdminUserList;

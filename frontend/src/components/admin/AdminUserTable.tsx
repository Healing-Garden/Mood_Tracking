import React from 'react';
import { Button } from '../ui/Button';
import type { UserDTO } from '../../api/adminService';

interface AdminUserTableProps {
    users: UserDTO[];
    onBan: (userId: string, userName: string) => void;
    onUnban: (userId: string) => void;
    isActionLoading: string | null;
}

export const AdminUserTable: React.FC<AdminUserTableProps> = ({ users, onBan, onUnban, isActionLoading }) => {
    if (users.length === 0) {
        return (
            <div className="text-center p-8 bg-white rounded-lg border border-border">
                <p className="text-muted-foreground">No users found</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground border-b border-border">
                        <tr>
                            <th className="px-6 py-4 font-medium">Avatar</th>
                            <th className="px-6 py-4 font-medium">Name</th>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Created Date</th>
                            <th className="px-6 py-4 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => (
                            <tr key={user._id} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 text-center align-middle">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.fullName}
                                            className="w-10 h-10 rounded-full object-cover shadow-sm m-auto block"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold m-auto">
                                            {user.fullName?.charAt(0)?.toUpperCase()}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 font-medium align-middle">{user.fullName}</td>
                                <td className="px-6 py-4 align-middle">{user.email}</td>
                                <td className="px-6 py-4 align-middle">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.isBanned
                                        ? 'bg-red-100 text-red-700 border border-red-200'
                                        : 'bg-green-100 text-green-700 border border-green-200'
                                        }`}>
                                        {user.isBanned ? 'Banned' : 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-muted-foreground align-middle">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right align-middle">
                                    {user.role === 'admin' ? (
                                        <span className="text-xs text-muted-foreground italic px-3 flex justify-end">Admin</span>
                                    ) : user.isBanned ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => onUnban(user._id)}
                                            disabled={isActionLoading === user._id}
                                            className="h-8 border-green-200 text-green-700 hover:bg-green-50"
                                        >
                                            {isActionLoading === user._id ? 'Processing...' : 'Unban User'}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={() => onBan(user._id, user.fullName)}
                                            disabled={isActionLoading === user._id}
                                            className="h-8 border-red-200 text-red-700 hover:bg-red-50"
                                        >
                                            {isActionLoading === user._id ? 'Processing...' : 'Ban User'}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

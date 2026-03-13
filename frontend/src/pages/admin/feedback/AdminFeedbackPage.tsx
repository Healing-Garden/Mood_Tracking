import { useEffect, useState } from "react";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { adminService } from "../../../api/adminService";
import type { FeedbackDTO } from "../../../api/adminService";
import { MessageSquare, Calendar } from "lucide-react";

export default function AdminFeedbackPage() {
    const [feedbacks, setFeedbacks] = useState<FeedbackDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await adminService.getAllFeedback();
            setFeedbacks(data);
        } catch (err: any) {
            console.error("Failed to fetch feedback", err);
            setError("Failed to load user feedback. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            setUpdatingId(id);
            await adminService.updateFeedbackStatus(id, newStatus);
            setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, status: newStatus } : f));
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Failed to update status");
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "reviewed":
                return "bg-blue-100 text-blue-700";
            case "resolved":
                return "bg-green-100 text-green-700";
            default:
                return "bg-yellow-100 text-yellow-700";
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "bug":
                return "bg-red-100 text-red-700";
            case "feature":
                return "bg-green-100 text-green-700";
            default:
                return "bg-blue-100 text-blue-700";
        }
    };

    const filteredFeedbacks = feedbacks.filter(f => {
        const matchesType = typeFilter === "all" || f.type === typeFilter;
        const matchesStatus = statusFilter === "all" || f.status === statusFilter;
        return matchesType && matchesStatus;
    });

    return (
        <DashboardLayout title="User Feedback" userType="admin">
            <div className="px-4 py-8 max-w-7xl mx-auto space-y-6">
                <Card className="shadow-sm border-border">
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Feedback Overview
                        </CardTitle>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">Type:</span>
                                <select
                                    className="text-sm font-medium border border-border hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-full px-3 py-1.5 bg-background shadow-sm transition-all outline-none cursor-pointer text-foreground"
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                >
                                    <option value="all">All Types</option>
                                    <option value="bug">Bug</option>
                                    <option value="feature">Feature</option>
                                    <option value="content_rating">Content Rating</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                                <select
                                    className="text-sm font-medium border border-border hover:border-primary/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-full px-3 py-1.5 bg-background shadow-sm transition-all outline-none cursor-pointer text-foreground"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="reviewed">Reviewed</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-500 py-12">{error}</div>
                        ) : filteredFeedbacks.length === 0 ? (
                            <div className="text-center text-muted-foreground py-12">
                                No feedback entries matching your filters.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 rounded-tl-lg font-medium">User</th>
                                            <th className="px-4 py-3 font-medium">Type</th>
                                            <th className="px-4 py-3 font-medium">Subject</th>
                                            <th className="px-4 py-3 font-medium">Rating</th>
                                            <th className="px-4 py-3 font-medium">Status</th>
                                            <th className="px-4 py-3 rounded-tr-lg font-medium text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {filteredFeedbacks.map((item) => (
                                            <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-4">
                                                    <p className="font-medium text-foreground">
                                                        {item.user_id?.fullName || (typeof item.user_id === 'string' ? `ID: ${item.user_id}` : 'Unknown User')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{item.user_id?.email || 'N/A'}</p>
                                                </td>
                                                <td className="px-4 py-4 font-semibold capitalize">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getTypeColor(item.type)}`}>
                                                        {item.type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-medium text-foreground mb-1">{item.subject}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs" title={item.message}>{item.message}</p>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    {item.rating ? (
                                                        <span className="font-bold flex items-center gap-1 justify-center text-yellow-500">
                                                            {item.rating} / 5
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="relative">
                                                        <select
                                                            disabled={updatingId === item._id}
                                                            value={item.status}
                                                            onChange={(e) => handleStatusUpdate(item._id, e.target.value)}
                                                            className={`appearance-none px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize cursor-pointer border hover:opacity-80 focus:ring-2 focus:ring-offset-1 focus:ring-primary/40 shadow-sm outline-none transition-all text-center ${getStatusColor(item.status)}`}
                                                        >
                                                            <option value="pending" className="bg-background text-foreground">Pending</option>
                                                            <option value="reviewed" className="bg-background text-foreground">Reviewed</option>
                                                            <option value="resolved" className="bg-background text-foreground">Resolved</option>
                                                        </select>
                                                        {updatingId === item._id && (
                                                            <div className="absolute inset-0 bg-white/20 rounded-full flex items-center justify-center">
                                                                <div className="w-3 h-3 border-2 border-primary border-t-transparent animate-spin rounded-full"></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-right align-top">
                                                    <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(item.created_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

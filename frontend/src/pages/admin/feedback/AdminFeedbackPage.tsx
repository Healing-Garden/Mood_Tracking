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
                return "text-red-500";
            case "feature":
                return "text-purple-500";
            default:
                return "text-blue-500";
        }
    };

    return (
        <DashboardLayout title="User Feedback" userType="admin">
            <div className="px-4 py-8 max-w-7xl mx-auto space-y-6">
                <Card className="shadow-sm border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary" />
                            Feedback Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-500 py-12">{error}</div>
                        ) : feedbacks.length === 0 ? (
                            <div className="text-center text-muted-foreground py-12">
                                No feedback entries found.
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
                                        {feedbacks.map((item) => (
                                            <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-4">
                                                    <p className="font-medium text-foreground">{item.user_id?.fullName || 'Unknown User'}</p>
                                                    <p className="text-xs text-muted-foreground">{item.user_id?.email || 'N/A'}</p>
                                                </td>
                                                <td className="px-4 py-4 font-semibold capitalize">
                                                    <span className={getTypeColor(item.type)}>{item.type.replace('_', ' ')}</span>
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
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(item.status)}`}>
                                                        {item.status}
                                                    </span>
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

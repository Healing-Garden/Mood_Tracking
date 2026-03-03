import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { RefreshCw } from 'lucide-react';
import { aiApi } from '../../api/aiApi';
import { useAuth } from '../../hooks/useAuth';
import http from '../../api/http';

interface DailySummaryCardProps {
    onRegenerate?: () => void;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ onRegenerate }) => {
    const { user } = useAuth();
    const [summary, setSummary] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    type CachedSummaryResponse = {
        success: boolean;
        data?: { summary: string; metadata?: any; generatedAt?: string; type?: string };
    };

    const fetchSummary = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const result = (await http.get(`/ai/summary/daily/${user.id}`)) as unknown as CachedSummaryResponse;
            if (result?.success && result.data?.summary) {
                setSummary(result.data.summary);
                setMetadata(result.data.metadata);
            } else {
                setError('Không thể tải dữ liệu');
            }
        } catch (err: any) {
            if (err?.response?.status === 404) {
                // Chưa có summary -> gọi generate
                await generateSummary();
                return;
            }
            console.error('Fetch summary error:', err);
            setError('Lỗi kết nối');
        } finally {
            setLoading(false);
        }
    };

    const generateSummary = async (force = false) => {
        if (!user) return;
        setLoading(true);
        try {
            const result = await aiApi.getDailySummary(user.id, null, force);
            if (result.data.success) {
                setSummary(result.data.data.summary);
                setMetadata(result.data.data.metadata);
            } else {
                setError('Unable to generate summary');
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        await generateSummary(true);
        setRegenerating(false);
        onRegenerate?.();
    };

    useEffect(() => {
        fetchSummary();
    }, [user]);

    if (loading) {
        return (
            <Card className="border-border/50 shadow-md">
                <CardContent className="p-4 text-center text-muted-foreground">
                    Loading your daily summary...
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-border/50 shadow-md">
                <CardContent className="p-4 text-center text-destructive">
                    {error}
                </CardContent>
            </Card>
        );
    }

    if (!summary) {
        return (
            <Card className="border-border/50 shadow-md">
                <CardContent className="p-4 text-center text-muted-foreground">
                    No summary available for today.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>📝 Your Day in Review</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRegenerate}
                        disabled={regenerating}
                    >
                        <RefreshCw className={`h-4 w-4 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
                        Regenerate
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                    {summary}
                </p>
                {metadata && (
                    <div className="mt-3 text-xs text-muted-foreground border-t pt-2">
                        {metadata.entry_count} journal entries · {metadata.mood_count} mood check-ins
                        {metadata.avg_mood > 0 && ` · Avg mood: ${metadata.avg_mood.toFixed(1)}/5`}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
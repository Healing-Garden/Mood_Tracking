import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { RefreshCw } from 'lucide-react';
import { aiApi } from '../../api/aiApi';
import { useAuth } from '../../hooks/useAuth';
import http from '../../api/http';
import type { AxiosError } from 'axios';

interface DailySummaryCardProps {
    onRegenerate?: () => void;
}

interface DailySummaryMetadata {
    entry_count: number;
    mood_count: number;
    avg_mood: number;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ onRegenerate }) => {
    const { user } = useAuth();
    const [summary, setSummary] = useState<string | null>(null);
    const [metadata, setMetadata] = useState<DailySummaryMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getLocalDateString = () => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    type CachedSummaryResponse = {
        success: boolean;
        data?: {
            summary: string;
            metadata?: DailySummaryMetadata;
            generatedAt?: string;
            type?: string;
        };
    };

    const fetchSummary = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            const date = getLocalDateString();
            const result = (await http.get(`/ai/summary/daily/${user.id}?date=${encodeURIComponent(date)}`)) as unknown as CachedSummaryResponse;
            if (result?.success && result.data?.summary) {
                setSummary(result.data.summary);
                setMetadata(result.data.metadata ?? null);
            } else {
                setError('Data could not be loaded');
            }
        } catch (err: unknown) {
            const error = err as AxiosError;

            if (error.response?.status === 404) {
                await generateSummary();
                return;
            }

            console.error('Fetch summary error:', error);
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const generateSummary = async (force = false) => {
        if (!user) return;
        setLoading(true);
        try {
            const date = getLocalDateString();
            const result = (await aiApi.getDailySummary(user.id, date, force)) as any;
            if (result.success) {
                setSummary(result.data.summary);
                setMetadata(result.data.metadata);
            } else {
                setError('Unable to generate summary');
            }
        } catch {
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
                    <span>Your Day in Review</span>
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
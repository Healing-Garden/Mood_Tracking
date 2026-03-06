import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { feedbackApi } from '../../api/feedbackApi';
import type { FeedbackType } from '../../api/feedbackApi';
import { MessageSquare, Bug, Star, Send, CheckCircle2 } from 'lucide-react';

interface FeedbackFormProps {
    onSuccess?: () => void;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess }) => {
    const [type, setType] = useState<FeedbackType>('feature');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState<number>(5);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !message) return;

        setLoading(true);
        try {
            await feedbackApi.submit({
                type,
                subject,
                message,
                rating: type === 'content_rating' ? rating : undefined
            });
            setSubmitted(true);
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            alert('Failed to submit feedback. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <Card className="border-green-100 bg-green-50/30">
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="text-green-600 w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-green-800 mb-2">Thank you!</h3>
                    <p className="text-green-700">Your feedback has been submitted successfully. We appreciate your input!</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border shadow-lg">
            <CardHeader>
                <CardTitle className="text-primary flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    Give Feedback
                </CardTitle>
                <CardDescription>
                    Help us improve your Healing Garden experience.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Selection */}
                    <div className="flex gap-4 p-1 bg-secondary/50 rounded-lg">
                        {(['feature', 'bug', 'content_rating'] as FeedbackType[]).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${type === t
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-muted-foreground hover:bg-white/50'
                                    }`}
                            >
                                {t === 'feature' && <Star size={16} />}
                                {t === 'bug' && <Bug size={16} />}
                                {t === 'content_rating' && <MessageSquare size={16} />}
                                <span className="capitalize">{t.replace('_', ' ')}</span>
                            </button>
                        ))}
                    </div>

                    {/* Rating for content_rating type */}
                    {type === 'content_rating' && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Rate your experience (1-5)</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setRating(num)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${rating >= num
                                            ? 'bg-amber-100 text-amber-600 border-2 border-amber-200 shadow-sm'
                                            : 'bg-slate-50 text-slate-400 border-2 border-transparent'
                                            }`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-2">
                        <label htmlFor="subject" className="text-sm font-medium text-slate-700">Subject</label>
                        <input
                            id="subject"
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="E.g., New feature request"
                            className="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            required
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium text-slate-700">Message</label>
                        <textarea
                            id="message"
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Detailed description..."
                            className="w-full px-4 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-white gap-2 py-6 text-lg"
                    >
                        {loading ? 'Submitting...' : (
                            <>
                                <Send size={20} />
                                Send Feedback
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default FeedbackForm;

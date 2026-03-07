import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { X } from 'lucide-react';

export interface BanConfig {
    durationDays: number;
    reason: string;
}

interface BanUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: BanConfig) => void;
    userName: string;
    isActionLoading: boolean;
}

export const BanUserModal: React.FC<BanUserModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    userName,
    isActionLoading
}) => {
    const [reason, setReason] = useState("");
    const [duration, setDuration] = useState<string>("7"); // default to 7 days
    const [customDays, setCustomDays] = useState<string>("");

    if (!isOpen) return null;

    const handleConfirm = () => {
        let days = 0;
        if (duration === "custom") {
            days = parseInt(customDays, 10);
            if (isNaN(days) || days <= 0) return;
        } else if (duration !== "permanent") {
            days = parseInt(duration, 10);
        }

        // If permanent, we can pass a really large number or handle it differently
        // In our backend logic, durationDays = 0 or null handles permanent if we pass 0
        if (duration === "permanent") days = 0;

        onConfirm({ durationDays: days, reason });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-semibold text-primary">Ban User</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} disabled={isActionLoading}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Ban <span className="font-semibold text-foreground">{userName}</span> from accessing the platform.
                    </p>

                    <div className="space-y-2">
                        <Label htmlFor="ban-reason">Reason</Label>
                        <Input
                            id="ban-reason"
                            placeholder="e.g. Violation of community guidelines"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={isActionLoading}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ban-duration">Duration</Label>
                        <select
                            id="ban-duration"
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            disabled={isActionLoading}
                        >
                            <option value="1">1 Day</option>
                            <option value="3">3 Days</option>
                            <option value="7">7 Days</option>
                            <option value="30">30 Days</option>
                            <option value="permanent">Permanent (No expiry)</option>
                            <option value="custom">Custom...</option>
                        </select>
                    </div>

                    {duration === "custom" && (
                        <div className="space-y-2">
                            <Label htmlFor="custom-duration">Custom Duration (Days)</Label>
                            <Input
                                id="custom-duration"
                                type="number"
                                min="1"
                                placeholder="e.g. 14"
                                value={customDays}
                                onChange={(e) => setCustomDays(e.target.value)}
                                disabled={isActionLoading}
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 p-4 border-t border-border bg-muted/20">
                    <Button variant="outline" onClick={onClose} disabled={isActionLoading}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleConfirm}
                        disabled={
                            isActionLoading ||
                            (duration === "custom" && (!customDays || parseInt(customDays) <= 0))
                        }
                    >
                        {isActionLoading ? "Processing..." : "Confirm Ban"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

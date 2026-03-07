import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { AlertCircle } from 'lucide-react';

interface BannedUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    banExpiresAt: string | null;
    banReason: string;
}

export const BannedUserModal: React.FC<BannedUserModalProps> = ({
    isOpen,
    onClose,
    banExpiresAt,
    banReason
}) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!isOpen || !banExpiresAt) {
            if (!banExpiresAt) setTimeLeft("Vĩnh viễn");
            return;
        }

        const targetTime = new Date(banExpiresAt).getTime();

        const updateCountdown = () => {
            const now = new Date().getTime();
            const distance = targetTime - now;

            if (distance <= 0) {
                setTimeLeft('Đã hết hạn Khóa');
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const parts = [];
            if (days > 0) parts.push(`${days} ngày`);
            if (hours > 0) parts.push(`${hours} giờ`);
            if (minutes > 0) parts.push(`${minutes} phút`);
            if (seconds > 0 || parts.length === 0) parts.push(`${seconds} giây`);

            setTimeLeft(parts.join(' '));
        };

        updateCountdown();
        const intervalId = setInterval(updateCountdown, 1000);

        return () => clearInterval(intervalId);
    }, [isOpen, banExpiresAt]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 duration-200 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-6">
                    <AlertCircle className="h-10 w-10 text-red-600" />
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">Tài khoản bị khóa</h2>

                <div className="bg-red-50 text-red-800 rounded-lg p-4 mb-6 space-y-3 shadow-inner">
                    <div>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-red-600/70 mb-1">Thời gian khóa còn lại</span>
                        <span className="text-xl font-bold tabular-nums tracking-tight">{timeLeft}</span>
                    </div>

                    <div className="h-px bg-red-200/50 w-full" />

                    <div>
                        <span className="block text-xs font-semibold uppercase tracking-wider text-red-600/70 mb-1">Lý do khóa</span>
                        <span className="font-medium">{banReason || 'Không có lý do cụ thể'}</span>
                    </div>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    Nếu bạn cho rằng đây là một sự nhầm lẫn, vui lòng liên hệ với bộ phận hỗ trợ khách hàng để được giải quyết.
                </p>

                <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 text-base"
                    onClick={onClose}
                >
                    Đóng
                </Button>
            </div>
        </div>
    );
};

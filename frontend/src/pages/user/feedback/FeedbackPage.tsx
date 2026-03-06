import { useState } from 'react';
import FeedbackForm from '../../../components/features/FeedbackForm';
import DashboardSidebar from '../../../components/layout/DashboardSideBar';
import { Menu, X, MessageCircle } from 'lucide-react';

const FeedbackPage = () => {
    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-30 ${sidebarOpen ? 'block' : 'hidden'} lg:static lg:block`}>
                <DashboardSidebar userType="user" onClose={() => setSidebarOpen(false)} />
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
                    <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MessageCircle className="text-primary w-6 h-6" />
                            <h1 className="text-2xl font-bold text-primary">Help & Feedback</h1>
                        </div>

                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-muted rounded-lg"
                        >
                            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
                    <div className="w-full max-w-2xl">
                        <div className="mb-8 text-center">
                            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">We value your feedback</h2>
                            <p className="text-slate-500">
                                Your thoughts and suggestions help us make Healing Garden better for everyone.
                                Whether it's a new feature idea, a bug report, or just general praise, we're listening!
                            </p>
                        </div>

                        <FeedbackForm />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default FeedbackPage;
